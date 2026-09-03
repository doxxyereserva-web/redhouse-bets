import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BetControls } from "@/components/games/BetControls";
import { useWallet } from "@/hooks/useWallet";
import { formatMultiplier } from "@/lib/format";
import { payoutForChance } from "@/lib/fair";

type Side = "red" | "gold";

const PAYOUT = payoutForChance(0.5);

export function Coinflip() {
  const { balance, settle, signedIn, roll } = useWallet();
  const [wager, setWager] = useState(100);
  const [side, setSide] = useState<Side>("red");
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<Side | null>(null);
  const [spin, setSpin] = useState(0);

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
    setSpin((s) => s + 1800 + (out === "gold" ? 180 : 0));
    await new Promise((r) => setTimeout(r, 1400));
    setResult(out);
    setFlipping(false);
    await settle("coinflip", wager, win ? PAYOUT : 0);
    if (win) toast.success(`Heads up — ${formatMultiplier(PAYOUT)}`);
    else toast.error("Wrong side.");
  }

  const face = result ?? side;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="panel flex h-[380px] flex-col items-center justify-center gap-8 p-6">
        <div className="[perspective:900px]">
          <div
            className="relative h-32 w-32 transition-transform duration-[1400ms] ease-out [transform-style:preserve-3d]"
            style={{ transform: `rotateY(${spin}deg)` }}
          >
            <div
              className={`absolute inset-0 grid place-items-center rounded-full border-4 font-display text-xl font-bold uppercase [backface-visibility:hidden] ${
                face === "gold"
                  ? "border-gold/70 bg-gold/15 text-gold glow-gold"
                  : "border-primary/70 bg-primary/15 text-primary glow-primary"
              }`}
            >
              {face}
            </div>
          </div>
        </div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {flipping ? "Flipping" : result ? (result === side ? "You won" : "You lost") : "Pick a side"}
        </p>
      </div>

      <BetControls wager={wager} setWager={setWager} balance={balance} disabled={flipping}>
        <div className="grid grid-cols-2 gap-2">
          {(["red", "gold"] as Side[]).map((s) => (
            <button
              key={s}
              onClick={() => setSide(s)}
              disabled={flipping}
              className={`rounded-md border px-2 py-3 text-xs font-semibold uppercase tracking-wide ${
                s === "gold" ? "border-gold/60 bg-gold/10 text-gold" : "border-primary/60 bg-primary/10 text-primary"
              } ${side === s ? "ring-2 ring-ring" : "opacity-70"}`}
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
