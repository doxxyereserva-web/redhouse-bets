export function formatRobux(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function formatMultiplier(value: number) {
  return `${value.toFixed(2)}x`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
