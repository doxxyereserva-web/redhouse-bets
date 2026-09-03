import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BetControls } from "@/components/games/BetControls";
import { useWallet } from "@/hooks/useWallet";
import { formatMultiplier } from "@/lib/format";
import { payoutForChance } from "@/lib/fair";

type Color = "red" | "black" | "gold";

const WHEEL: Color[] = Array.from({ length: 15 }, (_, i) =>
  i === 7 ? "gold" : i % 2 === 0 ? "red" : "black",
);

const CHANCE: Record<Color, number> = { red: 7 / 15, black: 7 / 15, gold: 1 / 15 };

const OPTIONS: { color: Color; label: string; cls: string }[] = [
  { color: "red", label: "Red", cls: "bg-primary/20 border-primary/60 text-primary" },
  { color: "black", label: "Black", cls: "bg-surface-2 border-border" },
  { color: "gold", label: "Gold", cls: "bg-gold/15 border-gold/60 text-gold" },
];

const TILE = 44; // px, tile width + gap
const REPEATS = 14;

export function Roulette() {
  const { balance, settle, signedIn } = useWallet();
  const [wager, setWager] = useState(100);
  const [pick, setPick] = useState<Color>("red");
  const [spinning, setSpinning] = useState(false);
  const [landed, setLanded] = useState<Color | null>(null);
  const [offset, setOffset] = useState(0);

  const strip = Array.from({ length: WHEEL.length * REPEATS }, (_, i) => WHEEL[i % WHEEL.length]!);

  async function spin() {
    if (!signedIn) return toast.error("Sign in with your Roblox account first.");
    if (wager <= 0 || wager > balance) return toast.error("Invalid wager.");
    setSpinning(true);
    setLanded(null);

    // A single fair wheel spin decides everything — no per-bet win rolls.
    const index = Math.floor(Math.random() * WHEEL.length);
    const result = WHEEL[index]!;
    const target = WHEEL.length * (REPEATS - 4) + index;
    setOffset(target * TILE + (Math.random() * 20 - 10));

    await new Promise((r) => setTimeout(r, 4200));
    setLanded(result);
    setSpinning(false);
    const m = result === pick ? payoutForChance(CHANCE[pick]) : 0;
    await settle("roulette", wager, m);
    if (m) toast.success(`${result.toUpperCase()} hit — ${formatMultiplier(m)}`);
    else toast.error(`${result.toUpperCase()} — you lost.`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="panel flex h-[380px] flex-col items-center justify-center gap-8 p-6">
        <div className="relative w-full max-w-xl overflow-hidden rounded-md border border-border bg-surface-2/40 py-4">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-card to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-card to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-0.5 -translate-x-1/2 bg-gold shadow-[0_0_14px_oklch(0.82_0.15_85/0.9)]" />
          <div
            className="flex gap-1 pl-[calc(50%-20px)]"
            style={{
              transform: `translateX(-${offset}px)`,
              transition: spinning ? "transform 4s cubic-bezier(.12,.72,.14,1)" : "none",
            }}
          >
            {strip.map((c, i) => (
              <span
                key={i}
                className={`h-16 w-10 shrink-0 rounded-sm ${
                  c === "gold" ? "bg-gold" : c === "red" ? "bg-primary" : "bg-surface-2 border border-border"
                }`}
              />
            ))}
          </div>
        </div>
        <p
          className={`num font-display text-4xl font-bold uppercase ${
            landed === "gold" ? "text-gold" : landed === "red" ? "text-primary" : ""
          }`}
        >
          {spinning ? "Spinning…" : (landed ?? "Place your bet")}
        </p>
      </div>

      <BetControls wager={wager} setWager={setWager} balance={balance} disabled={spinning}>
        <div className="grid grid-cols-3 gap-2">
          {OPTIONS.map((o) => (
            <button
              key={o.color}
              onClick={() => setPick(o.color)}
              disabled={spinning}
              className={`rounded-md border px-2 py-3 text-xs font-semibold uppercase tracking-wide transition-all ${o.cls} ${
                pick === o.color ? "ring-2 ring-ring" : "opacity-70"
              }`}
            >
              {o.label}
              <span className="mt-1 block num text-[10px] opacity-80">
                {payoutForChance(CHANCE[o.color])}x
              </span>
            </button>
          ))}
        </div>
        <Button className="w-full" onClick={spin} disabled={spinning}>
          Bet
        </Button>
      </BetControls>
    </div>
  );
}
