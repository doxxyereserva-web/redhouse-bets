import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BetControls } from "@/components/games/BetControls";
import { useWallet } from "@/hooks/useWallet";
import { formatMultiplier } from "@/lib/format";
import { edged } from "@/lib/fair";

export type StepConfig = {
  id: string;
  levels: number;
  choices: number;
  safe: number;
  levelLabel: string;
  choiceLabel: (index: number) => string;
  failText: string;
  winText: string;
};

export const STEP_GAMES: Record<string, StepConfig> = {
  towers: {
    id: "towers",
    levels: 8,
    choices: 3,
    safe: 2,
    levelLabel: "Floor",
    choiceLabel: (i) => ["Left", "Center", "Right"][i] ?? `#${i + 1}`,
    failText: "Wrong step — the tower collapsed.",
    winText: "Top floor reached.",
  },
  blackout: {
    id: "blackout",
    levels: 6,
    choices: 4,
    safe: 3,
    levelLabel: "Wave",
    choiceLabel: (i) => `Grid ${i + 1}`,
    failText: "Blackout caught you.",
    winText: "You survived every wave.",
  },
  heist: {
    id: "heist",
    levels: 5,
    choices: 3,
    safe: 2,
    levelLabel: "Vault",
    choiceLabel: (i) => `Lock ${i + 1}`,
    failText: "Alarm triggered.",
    winText: "Vaults cleared.",
  },
  ladder: {
    id: "ladder",
    levels: 10,
    choices: 2,
    safe: 1,
    levelLabel: "Rung",
    choiceLabel: (i) => (i === 0 ? "Left rung" : "Right rung"),
    failText: "Missed the rung.",
    winText: "Top of the ladder.",
  },
};

function multiplierAt(cfg: StepConfig, level: number) {
  // Edge compounds per step, so long runs are not free money.
  const per = (cfg.choices / cfg.safe) * (1 - 0.06);
  return edged(Math.pow(per, level) / (1 - 0.06));
}

export function StepGame({ config }: { config: StepConfig }) {
  const { balance, settle, signedIn, roll } = useWallet();
  const [wager, setWager] = useState(100);
  const [level, setLevel] = useState(0);
  const [active, setActive] = useState(false);
  const [dead, setDead] = useState(false);

  const current = level ? multiplierAt(config, level) : 1;
  const next = multiplierAt(config, level + 1);

  function start() {
    if (!signedIn) return toast.error("Sign in with your Roblox account first.");
    if (wager <= 0 || wager > balance) return toast.error("Invalid wager.");
    setLevel(0);
    setDead(false);
    setActive(true);
  }

  async function choose() {
    if (!active) return;
    const win = roll(config.safe / config.choices);
    if (!win) {
      setActive(false);
      setDead(true);
      await settle(config.id, wager, 0);
      toast.error(config.failText);
      return;
    }
    const nextLevel = level + 1;
    setLevel(nextLevel);
    if (nextLevel >= config.levels) {
      setActive(false);
      const m = multiplierAt(config, nextLevel);
      await settle(config.id, wager, m);
      toast.success(`${config.winText} ${formatMultiplier(m)}`);
    }
  }

  async function cashOut() {
    if (!active || level === 0) return;
    setActive(false);
    const m = multiplierAt(config, level);
    const res = await settle(config.id, wager, m);
    if (res) toast.success(`Cashed out at ${formatMultiplier(m)}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="panel flex flex-col-reverse gap-2 p-4">
        {Array.from({ length: config.levels }).map((_, l) => {
          const cleared = l < level;
          const isCurrent = l === level && active;
          return (
            <div key={l} className="flex items-center gap-2">
              <span className="num w-16 shrink-0 text-[10px] uppercase tracking-widest text-muted-foreground">
                {config.levelLabel} {l + 1}
              </span>
              <div className="grid flex-1 gap-2" style={{ gridTemplateColumns: `repeat(${config.choices}, minmax(0,1fr))` }}>
                {Array.from({ length: config.choices }).map((__, c) => (
                  <button
                    key={c}
                    onClick={choose}
                    disabled={!isCurrent}
                    className={`rounded-md border px-2 py-3 text-xs transition-all ${
                      cleared
                        ? "border-win/40 bg-win/10 text-win"
                        : isCurrent
                          ? "border-primary/60 bg-surface-2 hover:bg-primary/15"
                          : dead && l === level
                            ? "border-loss/40 bg-loss/10 text-loss"
                            : "border-border bg-surface-2/50 text-muted-foreground/60"
                    }`}
                  >
                    {config.choiceLabel(c)}
                  </button>
                ))}
              </div>
              <span className="num w-14 shrink-0 text-right text-[10px] text-muted-foreground">
                {formatMultiplier(multiplierAt(config, l + 1))}
              </span>
            </div>
          );
        })}
      </div>

      <BetControls wager={wager} setWager={setWager} balance={balance} disabled={active}>
        <div className="space-y-1">
          <Label>Current</Label>
          <p className="num text-2xl font-bold text-gold">{formatMultiplier(current)}</p>
          <p className="text-xs text-muted-foreground">Next step {formatMultiplier(next)}</p>
        </div>
        {active ? (
          <Button className="w-full" variant="secondary" onClick={cashOut} disabled={level === 0}>
            Cash out
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
