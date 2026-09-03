import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BetControls } from "@/components/games/BetControls";
import { useWallet } from "@/hooks/useWallet";
import { formatMultiplier } from "@/lib/format";
import { crashPoint } from "@/lib/fair";

type Phase = "idle" | "running" | "done";

const MAX_VIEW = 12;

export function Crash() {
  const { balance, settle, signedIn, luck } = useWallet();
  const [wager, setWager] = useState(100);
  const [phase, setPhase] = useState<Phase>("idle");
  const [mult, setMult] = useState(1);
  const [bust, setBust] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const raf = useRef<number | null>(null);

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  function finish(point: number) {
    setMult(point);
    setPhase("done");
    setResult("bust");
    setHistory((h) => [point, ...h].slice(0, 12));
    void settle("crash", wager, 0);
  }

  function start() {
    if (!signedIn) {
      toast.error("Sign in with your Roblox account first.");
      return;
    }
    if (wager <= 0 || wager > balance) {
      toast.error("Invalid wager.");
      return;
    }
    const point = crashPoint(luck);
    setBust(point);
    setMult(1);
    setResult(null);
    setPhase("running");
    if (point <= 1) {
      finish(1);
      return;
    }
    const t0 = performance.now();
    const tick = (t: number) => {
      const elapsed = (t - t0) / 1000;
      const current = Math.pow(Math.E, 0.28 * elapsed);
      if (current >= point) {
        finish(point);
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
    setHistory((h) => [bust, ...h].slice(0, 12));
    const res = await settle("crash", wager, at);
    if (res) toast.success(`Cashed out at ${formatMultiplier(at)}`);
  }

  // Rocket position along an exponential curve inside the viewport.
  const progress = Math.min(1, Math.log(mult) / Math.log(MAX_VIEW));
  const x = 6 + progress * 84;
  const y = 92 - Math.pow(progress, 0.85) * 78;
  const curve = `M 6 92 Q ${6 + (x - 6) * 0.55} ${92 - (92 - y) * 0.18} ${x} ${y}`;
  const busted = result === "bust";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="panel relative h-[380px] overflow-hidden p-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_300px_at_20%_100%,oklch(0.56_0.21_24/0.18),transparent_70%)]" />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="crashFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.56 0.21 24)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="oklch(0.56 0.21 24)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[20, 40, 60, 80].map((g) => (
            <line key={g} x1="0" y1={g} x2="100" y2={g} stroke="currentColor" strokeWidth="0.15" className="text-border" />
          ))}
          <path d={`${curve} L ${x} 92 Z`} fill="url(#crashFill)" />
          <path
            d={curve}
            fill="none"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            className={busted ? "stroke-loss" : "stroke-primary"}
          />
        </svg>

        <div
          className="absolute transition-transform duration-75 ease-linear"
          style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)" }}
        >
          <span
            className={`grid h-10 w-10 place-items-center rounded-full ${
              busted
                ? "scale-150 bg-loss/30 text-loss opacity-0 transition-all duration-500"
                : "bg-primary/20 text-primary"
            }`}
          >
            <Rocket className={`h-5 w-5 -rotate-45 ${phase === "running" ? "animate-pulse" : ""}`} />
          </span>
          {phase === "running" && (
            <span className="absolute left-1/2 top-1/2 -z-10 h-8 w-1.5 -translate-x-1/2 rounded-full bg-gradient-to-b from-gold to-transparent blur-[2px]" />
          )}
        </div>

        {busted && (
          <div className="absolute inset-0 grid place-items-center">
            <span className="font-display text-5xl font-bold uppercase text-loss opacity-80">Bust</span>
          </div>
        )}

        <div className="relative flex h-full flex-col items-center justify-center text-center">
          <p
            className={`num font-display text-6xl font-bold md:text-7xl ${
              busted ? "text-loss" : result === "win" ? "text-win glow-win" : "text-foreground"
            }`}
          >
            {formatMultiplier(mult)}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {phase === "running"
              ? "In flight"
              : busted
                ? `Busted at ${formatMultiplier(bust)}`
                : result === "win"
                  ? "Cashed out"
                  : "Place your bet"}
          </p>
        </div>

        <div className="absolute right-3 top-3 flex max-w-[60%] flex-wrap justify-end gap-1">
          {history.map((h, i) => (
            <span
              key={i}
              className={`num rounded-sm px-1.5 py-0.5 text-[10px] font-semibold ${
                h >= 2 ? "bg-win/15 text-win" : "bg-loss/15 text-loss"
              }`}
            >
              {h.toFixed(2)}x
            </span>
          ))}
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
        <p className="text-xs text-muted-foreground">House edge 6% — every round can bust instantly.</p>
      </BetControls>
    </div>
  );
}
