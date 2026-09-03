import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BetControls } from "@/components/games/BetControls";
import { useWallet } from "@/hooks/useWallet";

type Side = "red" | "gold";

export function Coinflip() {
  const { balance, settle, signedIn, roll } = useWallet();
  const [wager, setWager] = useState(100);
  const [side, setSide] = useState<Side>("red");
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<Side | null>(null);

  async function flip() {
    if (!signedIn) return toast.error("Sign in with your Roblox account first.");
    if (wager <= 0 || wager > balance) return toast.error("Invalid wager.");
    setFlipping(true);
    setResult(null);
    const win = roll(0.49);
    await new Promise((r) => setTimeout(r, 1100));
    const out: Side = win ? side : side === "red" ? "gold" : "red";
    setResult(out);
    setFlipping(false);
    await settle("coinflip", wager, win ? 2 : 0);
    if (win) toast.success("Heads up — 2.00x");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="panel flex h-[360px] flex-col items-center justify-center gap-6 p-6">
        <div
          className={`grid h-32 w-32 place-items-center rounded-full border-4 font-display text-xl font-bold uppercase transition-transform duration-500 ${
            flipping ? "animate-spin" : ""
          } ${
            (result ?? side) === "gold"
              ? "border-gold/70 bg-gold/15 text-gold"
              : "border-primary/70 bg-primary/15 text-primary"
          }`}
        >
          {flipping ? "…" : (result ?? side)}
        </div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {result ? (result === side ? "You won" : "You lost") : "Pick a side"}
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
          Flip for 2.00x
        </Button>
      </BetControls>
    </div>
  );
}
