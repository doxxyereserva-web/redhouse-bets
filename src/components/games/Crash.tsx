import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BetControls } from "@/components/games/BetControls";
import { useWallet } from "@/hooks/useWallet";
import { formatMultiplier } from "@/lib/format";

type Phase = "idle" | "running" | "done";

export function Crash() {
  const { balance, settle, signedIn, luck } = useWallet();
  const [wager, setWager] = useState(100);
  const [phase, setPhase] = useState<Phase>("idle");
  const [mult, setMult] = useState(1);
  const [bust, setBust] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  function start() {
    if (!signedIn) return toast.error("Sign in with your Roblox account first.");
    if (wager <= 0 || wager > balance) return toast.error("Invalid wager.");
    const r = Math.random();
    const point = Math.max(1.01, (0.97 / (1 - r)) * Math.min(1 + (luck - 1) * 0.35, 2.5));
    setBust(Number(point.toFixed(2)));
    setMult(1);
    setResult(null);
    setPhase("running");
    const t0 = performance.now();
    const tick = (t: number) => {
      const elapsed = (t - t0) / 1000;
      const current = Math.pow(Math.E, 0.28 * elapsed);
      if (current >= point) {
        setMult(Number(point.toFixed(2)));
        setPhase("done");
        setResult("bust");
        void settle("crash", wager, 0);
        return;
      }
      setMult(current);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }

  async function cashOut() {
    if (phase !== "running") return;
    if (raf.current) cancelAnimationFrame(raf.current);
    const at = Number(mult.toFixed(2));
    setPhase("done");
    setResult("win");
    const res = await settle("crash", wager, at);
    if (res) toast.success(`Cashed out at ${formatMultiplier(at)}`);
  }

  const height = Math.min(100, (Math.log(mult) / Math.log(12)) * 100);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="panel relative flex h-[360px] items-end overflow-hidden p-6">
        <div
          className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,oklch(0.45_0.19_25/0.28))] transition-[height] duration-75"
          style={{ height: `${height}%` }}
        />
        <div className="relative mx-auto mb-auto mt-auto text-center">
          <p
            className={`num font-display text-6xl font-bold md:text-7xl ${
              result === "bust" ? "text-loss" : result === "win" ? "text-win glow-win" : "text-foreground"
            }`}
          >
            {formatMultiplier(mult)}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {phase === "running"
              ? "In flight"
              : result === "bust"
                ? `Busted at ${formatMultiplier(bust)}`
                : result === "win"
                  ? "Cashed out"
                  : "Place your bet"}
          </p>
        </div>
      </div>

      <BetControls wager={wager} setWager={setWager} balance={balance} disabled={phase === "running"}>
        {phase === "running" ? (
          <Button className="w-full" variant="secondary" onClick={cashOut}>
            Cash out {formatMultiplier(mult)}
          </Button>
        ) : (
          <Button className="w-full" onClick={start}>
            Bet
          </Button>
        )}
      </BetControls>
    </div>
  );
}
