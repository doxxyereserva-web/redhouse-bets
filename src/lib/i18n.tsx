import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { translateStrings } from "@/lib/translate.functions";
import { LANGUAGES, RTL } from "@/lib/languages";

type Dict = Record<string, string>;

type Ctx = {
  lang: string;
  setLang: (code: string) => void;
  t: (text: string) => string;
};

const I18nContext = createContext<Ctx>({ lang: "en", setLang: () => {}, t: (s) => s });

const STORAGE_KEY = "redhouse.lang";

function cacheKey(lang: string) {
  return `redhouse.i18n.${lang}`;
}

function detectLang() {
  if (typeof navigator === "undefined") return "en";
  const nav = navigator.language;
  const exact = LANGUAGES.find((l) => l.code.toLowerCase() === nav.toLowerCase());
  if (exact) return exact.code;
  const base = nav.split("-")[0]!.toLowerCase();
  return LANGUAGES.find((l) => l.code.toLowerCase() === base)?.code ?? "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState("en");
  const [dict, setDict] = useState<Dict>({});
  const pending = useRef(new Set<string>());
  const requested = useRef(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    setLangState(saved ?? detectLang());
  }, []);

  useEffect(() => {
    requested.current = new Set();
    pending.current = new Set();
    if (lang === "en") {
      setDict({});
      return;
    }
    try {
      const cached = localStorage.getItem(cacheKey(lang));
      const parsed = cached ? (JSON.parse(cached) as Dict) : {};
      setDict(parsed);
      Object.keys(parsed).forEach((k) => requested.current.add(k));
    } catch {
      setDict({});
    }
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL.has(lang.split("-")[0]!) ? "rtl" : "ltr";
  }, [lang]);

  const flush = useCallback(
    async (target: string) => {
      const strings = Array.from(pending.current);
      pending.current = new Set();
      if (!strings.length || target === "en") return;
      const language = LANGUAGES.find((l) => l.code === target)?.english ?? target;
      const res = await translateStrings({ data: { language, strings } });
      if (!res.translations || Object.keys(res.translations).length === 0) return;
      setDict((prev) => {
        const next = { ...prev, ...res.translations };
        try {
          localStorage.setItem(cacheKey(target), JSON.stringify(next));
        } catch {
          /* quota */
        }
        return next;
      });
    },
    [],
  );

  const t = useCallback(
    (text: string) => {
      if (lang === "en" || !text) return text;
      const hit = dict[text];
      if (hit) return hit;
      if (!requested.current.has(text)) {
        requested.current.add(text);
        pending.current.add(text);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => void flush(lang), 250);
      }
      return text;
    },
    [lang, dict, flush],
  );

  const setLang = useCallback((code: string) => {
    localStorage.setItem(STORAGE_KEY, code);
    setLangState(code);
  }, []);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

/** Translates its text child automatically. */
export function T({ children }: { children: string }) {
  const { t } = useI18n();
  return <>{t(children)}</>;
}
