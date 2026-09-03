export type GameId =
  | "crash"
  | "mines"
  | "roulette"
  | "coinflip"
  | "towers"
  | "plinko"
  | "blackout"
  | "heist"
  | "ladder";

export type GameMeta = {
  id: GameId;
  name: string;
  tagline: string;
  original?: boolean;
  accent: "primary" | "gold" | "win";
};

export const GAMES: GameMeta[] = [
  { id: "crash", name: "Crash", tagline: "Cash out before the rocket blows", accent: "primary" },
  { id: "mines", name: "Mines", tagline: "Dodge the bombs, stack the multiplier", accent: "gold" },
  { id: "roulette", name: "Roulette", tagline: "Red, black or gold — 14x", accent: "primary" },
  { id: "coinflip", name: "Coinflip", tagline: "Straight 2x, one flip", accent: "win" },
  { id: "towers", name: "Towers", tagline: "Climb floor by floor", accent: "gold" },
  { id: "plinko", name: "Plinko", tagline: "Drop the ball, chase the edges", accent: "primary" },
  {
    id: "blackout",
    name: "Blackout",
    tagline: "Survive every blackout wave",
    original: true,
    accent: "win",
  },
  {
    id: "heist",
    name: "Heist",
    tagline: "Crack vaults before the alarm",
    original: true,
    accent: "gold",
  },
  {
    id: "ladder",
    name: "Ladder",
    tagline: "Pick your risk on every rung",
    original: true,
    accent: "primary",
  },
];

export function getGame(id: string) {
  return GAMES.find((g) => g.id === id) ?? null;
}
