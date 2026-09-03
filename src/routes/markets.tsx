import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { TrendingDown, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/hooks/useWallet";
import { Robux } from "@/components/Robux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/markets")({
  head: () => ({
    meta: [
      { title: "RedHouse Markets — leveraged demo trading" },
      {
        name: "description",
        content:
          "Trade the simulated RC/USD chart with 1x-100x leverage, live PnL and auto liquidation, using demo Robux.",
      },
      { property: "og:title", content: "RedHouse Markets — leveraged demo trading" },
      {
        property: "og:description",
        content: "Long or short a live simulated candle chart with up to 100x leverage.",
      },
    ],
  }),
  component: MarketsPage,
});

type Candle = { o: number; h: number; l: number; c: number };

function useSimulatedPrice() {
  const [candles, setCandles] = useState<Candle[]>(() => {
    let p = 100;
    return Array.from({ length: 60 }, () => {
      const o = p;
      const c = o * (1 + (Math.random() - 0.5) * 0.02);
      p = c;
      return { o, c, h: Math.max(o, c) * 1.004, l: Math.min(o, c) * 0.996 };
    });
  });

  useEffect(() => {
    const id = setInterval(() => {
      setCandles((prev) => {
        const last = prev[prev.length - 1]!;
        const o = last.c;
        const c = o * (1 + (Math.random() - 0.5) * 0.022);
        const next: Candle = { o, c, h: Math.max(o, c) * 1.004, l: Math.min(o, c) * 0.996 };
        return [...prev.slice(-59), next];
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return candles;
}

type Position = {
  id: string;
  side: string;
  margin: number;
  leverage: number;
  entry_price: number;
  status: string;
};

function MarketsPage() {
  const { t } = useI18n();
  const { balance, settle, signedIn, profile, refresh } = useWallet();
  const candles = useSimulatedPrice();
  const price = candles[candles.length - 1]!.c;
  const first = candles[0]!.o;
  const change = ((price - first) / first) * 100;

  const [margin, setMargin] = useState(100);
  const [leverage, setLeverage] = useState([10]);
  const [positions, setPositions] = useState<Position[]>([]);
  const priceRef = useRef(price);
  priceRef.current = price;

  const { min, max } = useMemo(() => {
    const lows = candles.map((c) => c.l);
    const highs = candles.map((c) => c.h);
    return { min: Math.min(...lows), max: Math.max(...highs) };
  }, [candles]);

  useEffect(() => {
    if (!profile) return;
    void (async () => {
      const { data } = await supabase
        .from("market_positions")
        .select("id, side, margin, leverage, entry_price, status")
        .eq("status", "open")
        .order("opened_at", { ascending: false });
      setPositions((data ?? []) as Position[]);
    })();
  }, [profile]);

  function pnlOf(p: Position) {
    const dir = p.side === "long" ? 1 : -1;
    return Number(p.margin) * Number(p.leverage) * ((price - Number(p.entry_price)) / Number(p.entry_price)) * dir;
  }

  async function open(side: "long" | "short") {
    if (!signedIn || !profile) {
      toast.error(t("Sign in with your Roblox account first."));
      return;
    }
    if (margin <= 0 || margin > balance) {
      toast.error(t("Invalid margin."));
      return;
    }
    const lev = leverage[0]!;
    const res = await settle("markets", margin, 0);
    if (!res) return;
    const { data, error } = await supabase
      .from("market_positions")
      .insert({
        user_id: profile.id,
        side,
        margin,
        leverage: lev,
        entry_price: price,
      })
      .select("id, side, margin, leverage, entry_price, status")
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setPositions((prev) => [data as Position, ...prev]);
    toast.success(`${side === "long" ? t("Long") : t("Short")} ${lev}x @ ${price.toFixed(2)}`);
  }

  async function close(p: Position) {
    const pnl = pnlOf(p);
    const payout = Math.max(0, Number(p.margin) + pnl);
    await supabase
      .from("market_positions")
      .update({ status: "closed", exit_price: price, pnl, closed_at: new Date().toISOString() })
      .eq("id", p.id);
    await supabase.rpc("apply_bet", {
      _game: "markets",
      _wager: 0,
      _multiplier: payout / Number(p.margin),
      _payout: payout,
    });
    setPositions((prev) => prev.filter((x) => x.id !== p.id));
    refresh();
    toast[pnl >= 0 ? "success" : "error"](
      `${t("Position closed")} ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}`,
    );
  }

  useEffect(() => {
    positions.forEach((p) => {
      if (pnlOf(p) <= -Number(p.margin)) void close(p);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price]);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16">
      <header className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase">RedHouse Markets</h1>
          <p className="text-sm text-muted-foreground">
            {t("Simulated RC/USD perpetual — demo Robux only.")}
          </p>
        </div>
        <div className="text-right">
          <p className={`num text-3xl font-bold ${change >= 0 ? "text-win" : "text-loss"}`}>
            {price.toFixed(2)}
          </p>
          <p className={`num text-xs ${change >= 0 ? "text-win" : "text-loss"}`}>
            {change >= 0 ? "+" : ""}
            {change.toFixed(2)}%
          </p>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="panel h-[380px] p-4">
          <div className="flex h-full items-end gap-[3px]">
            {candles.map((c, i) => {
              const range = max - min || 1;
              const bodyTop = ((max - Math.max(c.o, c.c)) / range) * 100;
              const bodyH = Math.max(1, (Math.abs(c.c - c.o) / range) * 100);
              const wickTop = ((max - c.h) / range) * 100;
              const wickH = Math.max(1, ((c.h - c.l) / range) * 100);
              const up = c.c >= c.o;
              return (
                <div key={i} className="relative h-full flex-1">
                  <span
                    className={`absolute left-1/2 w-px -translate-x-1/2 ${up ? "bg-win/70" : "bg-loss/70"}`}
                    style={{ top: `${wickTop}%`, height: `${wickH}%` }}
                  />
                  <span
                    className={`absolute left-0 w-full rounded-[1px] ${up ? "bg-win" : "bg-loss"}`}
                    style={{ top: `${bodyTop}%`, height: `${bodyH}%` }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel space-y-4 p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="margin">{t("Margin")}</Label>
              <span className="text-xs text-muted-foreground">
                <Robux amount={balance} />
              </span>
            </div>
            <Input
              id="margin"
              className="num"
              value={String(margin)}
              onChange={(e) => setMargin(Number(e.target.value.replace(/[^\d.]/g, "")) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label>
              {t("Leverage")} {leverage[0]}x
            </Label>
            <Slider min={1} max={100} step={1} value={leverage} onValueChange={setLeverage} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => open("long")} className="bg-win text-background hover:bg-win/90">
              <TrendingUp className="mr-2 h-4 w-4" /> {t("Long")}
            </Button>
            <Button onClick={() => open("short")} variant="destructive">
              <TrendingDown className="mr-2 h-4 w-4" /> {t("Short")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("Positions liquidate automatically when losses reach your margin.")}
          </p>
        </div>
      </div>

      <section className="panel mt-6 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {t("Open positions")}
        </h2>
        <div className="mt-3 divide-y divide-border/60">
          {positions.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("No open positions.")}</p>
          )}
          {positions.map((p) => {
            const pnl = pnlOf(p);
            return (
              <div key={p.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                <span
                  className={`rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
                    p.side === "long" ? "bg-win/15 text-win" : "bg-loss/15 text-loss"
                  }`}
                >
                  {p.side} {p.leverage}x
                </span>
                <span className="num text-xs text-muted-foreground">
                  {t("Entry")} {Number(p.entry_price).toFixed(2)}
                </span>
                <Robux amount={p.margin} className="text-xs text-muted-foreground" />
                <span className={`num ml-auto font-semibold ${pnl >= 0 ? "text-win" : "text-loss"}`}>
                  {pnl >= 0 ? "+" : ""}
                  {pnl.toFixed(2)}
                </span>
                <Button size="sm" variant="secondary" onClick={() => close(p)}>
                  {t("Close")}
                </Button>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
