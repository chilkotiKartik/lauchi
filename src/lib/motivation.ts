/** Original motivation lines written for lockin. (no quotes attributed to real people). Picked deterministically per day. */
export const BOOSTS = [
  "Small sessions, done daily, beat one heroic all-nighter.",
  "You don't need to feel ready. You need to start the first question.",
  "Every topic you finish today is one you won't panic about later.",
  "Marks follow practice. Practice follows a habit. Habits start with today.",
  "Ten focused minutes are worth an hour of scrolling through notes.",
  "The question you got wrong yesterday is today's easiest win.",
  "Your future self is cheering for the one quiz you do right now.",
  "Confusion is the feeling of learning. Stay with it a bit longer.",
  "Don't count the days to the exam. Make the days count.",
  "One unit at a time. One formula at a time. That's how syllabi fall.",
  "Discipline is choosing what you want most over what you want now.",
  "A streak is just a promise you keep to yourself, one day at a time.",
  "Derivations get easy on the third attempt. Go for attempt number three.",
  "The best time to revise was last week. The second best is now.",
  "Close the tabs. Open the unit. Lock in.",
  "Progress, not perfection. 60% today beats 0% waiting for 100%.",
  "Engineers aren't born knowing Thevenin. They practise it.",
  "Hard chapters are just chapters you haven't finished yet.",
  "Every PYQ you solve is a question that can't surprise you.",
  "Rest is part of the plan. Breaks make the next session sharper.",
  "You've survived every hard day so far. This one too.",
  "Write it, say it, solve it. Three ways in, one way it sticks.",
  "Ask the doubt now. Doubts left alone grow into chapters.",
  "Be the student who finished, not the one who planned to.",
];

export function boostFor(day: string, offset = 0): string {
  let h = 7;
  for (const c of day) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return BOOSTS[(h + offset) % BOOSTS.length];
}

/** A short line that matches the student's day. */
export function moodLine({ streak, todayXp, goal, daysLeft }: { streak: number; todayXp: number; goal: number; daysLeft: number | null }): string {
  if (daysLeft !== null && daysLeft >= 0 && daysLeft <= 7) return daysLeft === 0 ? "Exam day. Breathe, read every question twice, and trust your practice." : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} to the exam. Revise your weakest unit first, then the PYQs that repeat most.`;
  if (todayXp >= goal) return "Goal smashed today. Anything extra now is pure bonus.";
  if (streak >= 7) return `${streak} days in a row. That's how toppers are built. Don't break the chain.`;
  if (streak > 0) return `Day ${streak + 1} of your streak is one quiz away.`;
  return "Start a streak today. One quiz is all it takes.";
}
