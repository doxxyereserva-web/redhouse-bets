import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BetControls } from "@/components/games/BetControls";
import { useWallet } from "@/hooks/useWallet";
import { formatMultiplier } from "@/lib/format";
import { plinkoPayouts } from "@/lib/fair";

const ROWS = 12;
const STEP_MS = 105;

const PAYOUTS: Record<string, number[]> = {
  low: plinkoPayouts(ROWS, 1.35),
  medium: plinkoPayouts(ROWS, 1.75),
  high: plinkoPayouts(ROWS, 2.3),
};

type Ball = { x: number; y: number };

export function Plinko() {
  const { balance, settle, signedIn } = useWallet();
  const [wager, setWager] = useState(100);
  const [risk, setRisk] = useState<keyof typeof PAYOUTS>("medium");
  const [dropping, setDropping] = useState(false);
  const [slot, setSlot] = useState<number | null>(null);
  const [ball, setBall] = useState<Ball | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const payouts = PAYOUTS[risk]!;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  async function drop() {
    if (!signedIn) {
      toast.error("Sign in with your Roblox account first.");
      return;
    }
    if (wager <= 0 || wager > balance) {
      toast.error("Invalid wager.");
      return;
    }
    setDropping(true);
    setSlot(null);

    // Path: at each row the ball bounces left or right off a peg.
    const path: number[] = [];
    let offset = 0;
    for (let i = 0; i < ROWS; i++) {
      offset += Math.random() < 0.5 ? -1 : 1;
      path.push(offset);
    }
    const index = (offset + ROWS) / 2;

    setBall({ x: 0, y: 0 });
    path.forEach((o, i) => {
      timers.current.push(
        setTimeout(() => setBall({ x: o, y: i + 1 }), STEP_MS * (i + 1)),
      );
    });

    await new Promise((r) => setTimeout(r, STEP_MS * (ROWS + 2)));
    setBall(null);
    setSlot(index);
    setDropping(false);
    const m = payouts[index] ?? 0;
    await settle("plinko", wager, m);
    if (m >= 1) toast.success(`Landed ${formatMultiplier(m)}`);
  }

  const cell = 100 / (ROWS + 2);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="panel flex flex-col items-center gap-4 p-4">
        <div className="relative aspect-[4/3] w-full max-w-lg overflow-hidden rounded-md bg-[radial-gradient(400px_240px_at_50%_0%,oklch(0.56_0.21_24/0.14),transparent_70%)]">
          {Array.from({ length: ROWS }).map((_, r) =>
            Array.from({ length: r + 2 }).map((__, c) => {
              const left = 50 + (c - (r + 1) / 2) * cell;
              const top = 6 + ((r + 1) / (ROWS + 1)) * 84;
              return (
                <span
                  key={`${r}-${c}`}
                  className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted-foreground/60"
                  style={{ left: `${left}%`, top: `${top}%` }}
                />
              );
            }),
          )}
          {ball && (
            <span
              className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_12px_oklch(0.82_0.15_85/0.8)]"
              style={{
                left: `${50 + (ball.x * cell) / 2}%`,
                top: `${6 + (ball.y / (ROWS + 1)) * 84}%`,
                transition: `left ${STEP_MS}ms linear, top ${STEP_MS}ms cubic-bezier(.4,0,.9,.5)`,
              }}
            />
          )}
        </div>

        <div className="flex w-full max-w-lg justify-center gap-1">
          {payouts.map((p, i) => (
            <span
              key={i}
              className={`num flex-1 rounded-sm px-1 py-1.5 text-center text-[10px] font-semibold transition-all ${
                slot === i
                  ? "-translate-y-1 bg-gold text-gold-foreground glow-gold"
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
        <p className="text-xs text-muted-foreground">
          Higher risk means the centre pays under 1x far more often.
        </p>
      </BetControls>
    </div>
  );
}
