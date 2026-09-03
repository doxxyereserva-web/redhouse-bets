/**
 * RedHouse fairness / house-edge model.
 *
 * Every game funnels its payouts through this module so the return-to-player
 * (RTP) is consistent and the house always keeps an edge. Before this existed
 * each game invented its own numbers, which made high-risk modes far too
 * profitable for the player.
 */

/** Fraction of every wager the house keeps on average. */
export const HOUSE_EDGE = 0.06;

/** Expected return to the player, in the long run. */
export const RTP = 1 - HOUSE_EDGE;

/** Hard cap on the multiplier a single bet can pay. */
export const MAX_MULTIPLIER = 2500;

/** Applies the house edge to a "fair" multiplier and caps it. */
export function edged(fairMultiplier: number) {
  if (!Number.isFinite(fairMultiplier) || fairMultiplier <= 0) return 0;
  return Number(Math.min(fairMultiplier * RTP, MAX_MULTIPLIER).toFixed(2));
}

/** Fair multiplier for an event with the given win probability. */
export function fairFromChance(chance: number) {
  return chance > 0 ? 1 / chance : 0;
}

/** Edged multiplier for an event with the given win probability. */
export function payoutForChance(chance: number) {
  return edged(fairFromChance(chance));
}

function binomial(n: number, k: number) {
  let c = 1;
  for (let i = 0; i < k; i++) c = (c * (n - i)) / (i + 1);
  return c;
}

/**
 * Builds a Plinko payout row whose expected value equals the RTP exactly.
 * `spread` controls how aggressively the edges pay compared to the centre.
 */
export function plinkoPayouts(rows: number, spread: number) {
  const total = Math.pow(2, rows);
  const probs = Array.from({ length: rows + 1 }, (_, i) => binomial(rows, i) / total);
  const centre = rows / 2;
  const shape = probs.map((_, i) => Math.pow(spread, Math.abs(i - centre)));
  const expected = probs.reduce((sum, p, i) => sum + p * shape[i]!, 0);
  const scale = RTP / expected;
  return shape.map((s) => Number(Math.min(s * scale, MAX_MULTIPLIER).toFixed(2)));
}

/** Crash bust point. Returns 1.00 when the round busts instantly. */
export function crashPoint(luck = 1) {
  const r = Math.random();
  const raw = RTP / (1 - r);
  const boosted = raw * Math.min(1 + (luck - 1) * 0.25, 2);
  if (boosted < 1.01) return 1;
  return Number(Math.min(boosted, MAX_MULTIPLIER).toFixed(2));
}
