import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BetControls } from "@/components/games/BetControls";
import { useWallet } from "@/hooks/useWallet";
import { formatMultiplier } from "@/lib/format";

type Color = "red" | "black" | "gold";

const OPTIONS: { color: Color; label: string; payout: number; chance: number; cls: string }[] = [
  { color: "red", label: "Red", payout: 2, chance: 7 / 15, cls: "bg-primary/20 border-primary/60 text-primary" },
  { color: "black", label: "Black", payout: 2, chance: 7 / 15, cls: "bg-surface-2 border-border" },
  { color: "gold", label: "Gold", payout: 14, chance: 1 / 15, cls: "bg-gold/15 border-gold/60 text-gold" },
];

export function Roulette() {
  const { balance, settle, signedIn, roll } = useWallet();
  const [wager, setWager] = useState(100);
  const [pick, setPick] = useState<Color>("red");
  const [spinning, setSpinning] = useState(false);
  const [landed, setLanded] = useState<Color | null>(null);

  async function spin() {
    if (!signedIn) return toast.error("Sign in with your Roblox account first.");
    if (wager <= 0 || wager > balance) return toast.error("Invalid wager.");
    const option = OPTIONS.find((o) => o.color === pick)!;
    setSpinning(true);
    setLanded(null);
    const win = roll(option.chance);
    const result: Color = win
      ? pick
      : pick === "gold"
        ? Math.random() < 0.5
          ? "red"
          : "black"
        : Math.random() < 0.93
          ? pick === "red"
            ? "black"
            : "red"
          : "gold";
    await new Promise((r) => setTimeout(r, 1600));
    setLanded(result);
    setSpinning(false);
    const m = result === pick ? option.payout : 0;
    await settle("roulette", wager, m);
    if (m) toast.success(`${option.label} hit — ${formatMultiplier(m)}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="panel flex h-[360px] flex-col items-center justify-center gap-6 p-6">
        <div className="flex gap-2 overflow-hidden rounded-md border border-border p-2">
          {Array.from({ length: 15 }).map((_, i) => {
            const c: Color = i === 7 ? "gold" : i % 2 === 0 ? "red" : "black";
            return (
              <span
                key={i}
                className={`h-14 w-8 rounded-sm ${
                  c === "gold" ? "bg-gold" : c === "red" ? "bg-primary" : "bg-surface-2"
                } ${spinning ? "animate-pulse" : ""}`}
              />
            );
          })}
        </div>
        <p className="num font-display text-4xl font-bold uppercase">
          {spinning ? "Spinning…" : landed ? landed : "Place your bet"}
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
              <span className="mt-1 block num text-[10px] opacity-80">{o.payout}x</span>
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
