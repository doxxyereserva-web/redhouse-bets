import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BetControls } from "@/components/games/BetControls";
import { useWallet } from "@/hooks/useWallet";
import { formatMultiplier } from "@/lib/format";
import { payoutForChance } from "@/lib/fair";

type Side = "red" | "gold";

const PAYOUT = payoutForChance(0.5);

function Face({ side, back }: { side: Side; back?: boolean }) {
  return (
    <div
      className={`absolute inset-0 grid place-items-center rounded-full border-4 [backface-visibility:hidden] ${
        side === "gold"
          ? "border-gold/70 bg-[radial-gradient(circle_at_30%_25%,oklch(0.9_0.13_88),oklch(0.62_0.13_78))] text-gold-foreground glow-gold"
          : "border-primary/70 bg-[radial-gradient(circle_at_30%_25%,oklch(0.62_0.2_24),oklch(0.36_0.16_24))] text-primary-foreground glow-primary"
      }`}
      style={back ? { transform: "rotateY(180deg)" } : undefined}
    >
      <span className="grid h-[78%] w-[78%] place-items-center rounded-full border border-foreground/20 font-display text-lg font-bold uppercase tracking-widest">
        {side === "gold" ? "GOLD" : "RED"}
      </span>
    </div>
  );
}

export function Coinflip() {
  const { balance, settle, signedIn, roll } = useWallet();
  const [wager, setWager] = useState(100);
  const [side, setSide] = useState<Side>("red");
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<Side | null>(null);
  const [spin, setSpin] = useState(0);

  // The coin has two fixed faces: front = red, back = gold.
  // Landing angle is only decided by the spin transform, so nothing is revealed early.
  async function flip() {
    if (!signedIn) {
      toast.error("Sign in with your Roblox account first.");
      return;
    }
    if (wager <= 0 || wager > balance) {
      toast.error("Invalid wager.");
      return;
    }
    setFlipping(true);
    setResult(null);
    const win = roll(0.5);
    const out: Side = win ? side : side === "red" ? "gold" : "red";

    // normalize current angle to its landed face, then add full spins + final half turn
    const current = ((spin % 360) + 360) % 360;
    const base = spin - current;
    const target = out === "gold" ? 180 : 0;
    const turns = 5 + Math.floor(Math.random() * 3);
    setSpin(base + turns * 360 + target);

    await new Promise((r) => setTimeout(r, 1600));
    setResult(out);
    setFlipping(false);
    await settle("coinflip", wager, win ? PAYOUT : 0);
    if (win) toast.success(`${out.toUpperCase()} — ${formatMultiplier(PAYOUT)}`);
    else toast.error(`${out.toUpperCase()}. Wrong side.`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="panel relative flex h-[420px] flex-col items-center justify-center gap-8 overflow-hidden p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_260px_at_50%_0%,oklch(0.4_0.14_24/0.25),transparent_70%)]" />
        <div className="relative [perspective:1100px]">
          <div
            className="relative h-36 w-36 [transform-style:preserve-3d]"
            style={{
              transform: `rotateY(${spin}deg)`,
              transition: "transform 1600ms cubic-bezier(0.16, 0.9, 0.2, 1)",
            }}
          >
            <Face side="red" />
            <Face side="gold" back />
          </div>
          <div className="mx-auto mt-6 h-3 w-28 rounded-full bg-foreground/10 blur-md" />
        </div>
        <p className="relative text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {flipping
            ? "Flipping…"
            : result
              ? result === side
                ? "You won"
                : "You lost"
              : "Pick a side"}
        </p>
      </div>

      <BetControls wager={wager} setWager={setWager} balance={balance} disabled={flipping}>
        <div className="grid grid-cols-2 gap-2">
          {(["red", "gold"] as Side[]).map((s) => (
            <button
              key={s}
              onClick={() => setSide(s)}
              disabled={flipping}
              className={`rounded-md border px-2 py-3 text-xs font-semibold uppercase tracking-wide transition ${
                s === "gold"
                  ? "border-gold/60 bg-gold/10 text-gold"
                  : "border-primary/60 bg-primary/10 text-primary"
              } ${side === s ? "ring-2 ring-ring" : "opacity-60 hover:opacity-90"}`}
            >
              {s}
            </button>
          ))}
        </div>
        <Button className="w-full" onClick={flip} disabled={flipping}>
          Flip for {formatMultiplier(PAYOUT)}
        </Button>
      </BetControls>
    </div>
  );
}
