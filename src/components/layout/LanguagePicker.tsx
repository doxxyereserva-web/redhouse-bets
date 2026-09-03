import { useState } from "react";
import { Globe, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LANGUAGES } from "@/lib/languages";
import { useI18n } from "@/lib/i18n";

export function LanguagePicker() {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const list = LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(q.toLowerCase()) ||
      l.english.toLowerCase().includes(q.toLowerCase()) ||
      l.code.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("Change language")}>
          <Globe className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t("Language")}</DialogTitle>
          <DialogDescription>
            {t("Automatic translation for 90 regions. The interface updates instantly.")}
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("Search language")}
            className="pl-9"
          />
        </div>
        <div className="-mx-2 max-h-[45vh] overflow-y-auto px-2">
          <div className="grid gap-1 sm:grid-cols-2">
            {list.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
                className={`flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-secondary ${
                  lang === l.code ? "bg-secondary text-foreground" : "text-muted-foreground"
                }`}
              >
                <span>
                  {l.name}
                  <span className="ml-2 text-[10px] uppercase tracking-widest opacity-60">
                    {l.code}
                  </span>
                </span>
                {lang === l.code && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
