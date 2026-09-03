import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import {
  Rocket,
  Bomb,
  Disc3,
  Coins,
  Building2,
  CircleDot,
  Zap,
  KeyRound,
  MoveUpRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GAMES, type GameId } from "@/lib/games";
import { Button } from "@/components/ui/button";
import crashArt from "@/assets/games/crash.jpg";
import minesArt from "@/assets/games/mines.jpg";
import rouletteArt from "@/assets/games/roulette.jpg";
import coinflipArt from "@/assets/games/coinflip.jpg";
import towersArt from "@/assets/games/towers.jpg";
import plinkoArt from "@/assets/games/plinko.jpg";
import blackoutArt from "@/assets/games/blackout.jpg";
import heistArt from "@/assets/games/heist.jpg";
import ladderArt from "@/assets/games/ladder.jpg";

export const GAME_ART: Record<GameId, string> = {
  crash: crashArt,
  mines: minesArt,
  roulette: rouletteArt,
  coinflip: coinflipArt,
  towers: towersArt,
  plinko: plinkoArt,
  blackout: blackoutArt,
  heist: heistArt,
  ladder: ladderArt,
};

const ICONS: Record<GameId, LucideIcon> = {
  crash: Rocket,
  mines: Bomb,
  roulette: Disc3,
  coinflip: Coins,
  towers: Building2,
  plinko: CircleDot,
  blackout: Zap,
  heist: KeyRound,
  ladder: MoveUpRight,
};

const ACCENT = {
  primary: {
    glow: "bg-primary/30",
    text: "text-primary",
    ring: "group-hover:border-primary/60",
    art: "from-primary/25",
  },
  gold: {
    glow: "bg-gold/25",
    text: "text-gold",
    ring: "group-hover:border-gold/60",
    art: "from-gold/20",
  },
  win: {
    glow: "bg-win/25",
    text: "text-win",
    ring: "group-hover:border-win/60",
    art: "from-win/20",
  },
} as const;

export function GameCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollBy(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(280, el.clientWidth * 0.8), behavior: "smooth" });
  }

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold uppercase tracking-wide">Games</h2>
          <p className="text-sm text-muted-foreground">Nine houses. One balance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="icon" aria-label="Previous games" onClick={() => scrollBy(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="icon" aria-label="Next games" onClick={() => scrollBy(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative mt-4">
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {GAMES.map((game) => {
            const Icon = ICONS[game.id];
            const accent = ACCENT[game.accent];
            return (
              <Link
                key={game.id}
                to="/games/$game"
                params={{ game: game.id }}
                className={`panel group relative w-[268px] shrink-0 snap-start overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1.5 ${accent.ring}`}
              >
                <img
                  src={GAME_ART[game.id]}
                  alt={`${game.name} artwork`}
                  loading="lazy"
                  width={768}
                  height={512}
                  className="absolute inset-x-0 top-0 h-[150px] w-full object-cover opacity-80 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-surface-1/85 to-transparent" />
                <div
                  className={`absolute -right-12 -top-12 h-36 w-36 rounded-full blur-3xl transition-opacity duration-300 group-hover:opacity-100 ${accent.glow} opacity-60`}
                />
                <div
                  className={`absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t ${accent.art} to-transparent opacity-60`}
                />
                <div className="relative flex h-[240px] flex-col">
                  <div className="flex items-start justify-between">
                    <span
                      className={`grid h-11 w-11 place-items-center rounded-lg border border-border bg-surface-2/80 ${accent.text} transition-transform duration-300 group-hover:scale-110`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    {game.original && (
                      <span className="rounded-sm bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gold">
                        Original
                      </span>
                    )}
                  </div>
                  <h3 className="mt-auto font-display text-2xl font-bold uppercase leading-none">
                    {game.name}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{game.tagline}</p>
                  <span className={`mt-3 text-xs font-semibold uppercase tracking-widest ${accent.text}`}>
                    Play now →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
      </div>
    </section>
  );
}
