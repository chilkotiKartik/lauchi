export const BRANCHES = [
  { key: "CSE", name: "Computer Science & Engineering" },
  { key: "AIML", name: "CSE (AI & ML)" },
  { key: "BCA", name: "Bachelor of Computer Applications" },
] as const;
export type BranchKey = (typeof BRANCHES)[number]["key"];
export const branchName = (key: string | null) => BRANCHES.find((b) => b.key === key)?.name ?? "";
export const GOALS = [
  { xp: 30, label: "Casual", hint: "about 10 minutes a day" },
  { xp: 50, label: "Regular", hint: "about 20 minutes a day" },
  { xp: 100, label: "Serious", hint: "about 40 minutes a day" },
] as const;
