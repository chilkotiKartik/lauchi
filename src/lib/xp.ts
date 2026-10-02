// Level n starts at 50·n·(n−1) total XP: 0, 100, 300, 600, 1000…
export const xpForLevel = (level: number) => 50 * level * (level - 1);

export function levelFromXp(totalXp: number) {
  const xp = Math.max(0, Math.floor(totalXp));
  let level = Math.floor((1 + Math.sqrt(1 + xp / 12.5)) / 2);
  while (xpForLevel(level + 1) <= xp) level++;
  while (level > 1 && xpForLevel(level) > xp) level--;
  const floor = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, floor, next, into: xp - floor, span: next - floor };
}
