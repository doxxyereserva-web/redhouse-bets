import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BetControls } from "@/components/games/BetControls";
import { useWallet } from "@/hooks/useWallet";
import { formatMultiplier } from "@/lib/format";

const ROWS = 12;

const PAYOUTS: Record<string, number[]> = {
  low: [5.6, 2.1, 1.6, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.6, 2.1, 5.6],
  medium: [24, 8, 3, 1.4, 1.1, 0.6, 0.3, 0.6, 1.1, 1.4, 3, 8, 24],
  high: [130, 26, 8, 3, 1.2, 0.4, 0.2, 0.4, 1.2, 3, 8, 26, 130],
};

export function Plinko() {
  const { balance, settle, signedIn } = useWallet();
  const [wager, setWager] = useState(100);
  const [risk, setRisk] = useState<keyof typeof PAYOUTS>("medium");
  const [dropping, setDropping] = useState(false);
  const [slot, setSlot] = useState<number | null>(null);

  const payouts = PAYOUTS[risk]!;

  async function drop() {
    if (!signedIn) return toast.error("Sign in with your Roblox account first.");
    if (wager <= 0 || wager > balance) return toast.error("Invalid wager.");
    setDropping(true);
    setSlot(null);
    let index = 0;
    for (let i = 0; i < ROWS; i++) index += Math.random() < 0.5 ? 0 : 1;
    await new Promise((r) => setTimeout(r, 1200));
    setSlot(index);
    setDropping(false);
    const m = payouts[index] ?? 0;
    await settle("plinko", wager, m);
    if (m >= 1) toast.success(`Landed ${formatMultiplier(m)}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="panel flex flex-col items-center gap-4 p-6">
        <div className="flex flex-col items-center gap-1.5 py-2">
          {Array.from({ length: ROWS }).map((_, r) => (
            <div key={r} className="flex gap-2.5">
              {Array.from({ length: r + 2 }).map((_, c) => (
                <span
                  key={c}
                  className={`h-1.5 w-1.5 rounded-full bg-muted-foreground/50 ${dropping ? "animate-pulse" : ""}`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex w-full flex-wrap justify-center gap-1">
          {payouts.map((p, i) => (
            <span
              key={i}
              className={`num rounded-sm px-2 py-1 text-[10px] font-semibold ${
                slot === i
                  ? "bg-gold text-background"
                  : p >= 2
                    ? "bg-primary/20 text-primary"
                    : "bg-surface-2 text-muted-foreground"
              }`}
            >
              {p}x
            </span>
          ))}
        </div>
      </div>

      <BetControls wager={wager} setWager={setWager} balance={balance} disabled={dropping}>
        <div className="space-y-2">
          <Label>Risk</Label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(PAYOUTS) as (keyof typeof PAYOUTS)[]).map((r) => (
              <Button
                key={r}
                size="sm"
                variant={risk === r ? "default" : "secondary"}
                onClick={() => setRisk(r)}
                disabled={dropping}
                className="capitalize"
              >
                {r}
              </Button>
            ))}
          </div>
        </div>
        <Button className="w-full" onClick={drop} disabled={dropping}>
          Drop ball
        </Button>
      </BetControls>
    </div>
  );
}
