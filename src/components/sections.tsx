import type { ComponentType } from "react";
import { ArtAsk, ArtAssign, ArtBook, ArtFormula, ArtLeague, ArtPapers, ArtScores, ArtGear, ArtHome, ArtLab, ArtMistake, ArtMock, ArtPlan, ArtPractice, ArtProgress, ArtQuest, ArtSyllabus, ArtUser, ArtVideo, ArtPyq, ArtFocus, ArtRevise, ArtPaper, ArtFriends } from "@/components/art";

export type Section = { href: string; label: string; blurb: string; Icon: ComponentType<{ size?: number }>; accent: string; isNew?: boolean; bottom?: boolean };

/** Every place a student can go. The order is the sidebar order. */
export const SECTIONS: Section[] = [
  { href: "/home", label: "Dashboard", blurb: "Streak, XP, readiness and what to fix next.", Icon: ArtHome, accent: "#ff9a1f", bottom: true },
  { href: "/learn", label: "Learn", blurb: "Subject → unit → topic, with step-by-step lessons.", Icon: ArtBook, accent: "#2ba6f5", bottom: true },
  { href: "/practice", label: "Practice", blurb: "Fresh quiz questions for every unit, checked instantly.", Icon: ArtPractice, accent: "#44c95a", bottom: true },
  { href: "/labs", label: "3D Labs", blurb: "Live simulations you can rotate and change.", Icon: ArtLab, accent: "#ffc83d", bottom: true },
  { href: "/pyq", label: "PYQ Bank", blurb: "400+ past questions for 5 subjects, ranked by how often they come.", Icon: ArtPyq, accent: "#ff5a5f", isNew: true },
  { href: "/resources", label: "Notes & files", blurb: "Notes, assignments and slides your teachers shared.", Icon: ArtBook, accent: "#2ba6f5", isNew: true },
  { href: "/daily", label: "Daily challenge", blurb: "Five fresh questions every day. Finish for bonus XP.", Icon: ArtQuest, accent: "#ff9a1f", isNew: true },
  { href: "/bank", label: "Question bank", blurb: "Practise teacher-written questions, checked for you with the working.", Icon: ArtPractice, accent: "#44c95a", isNew: true },
  { href: "/exam", label: "Exam prep", blurb: "Countdown, weak spots and a daily revision schedule.", Icon: ArtPlan, accent: "#2ba6f5", isNew: true },
  { href: "/goals", label: "Weekly goals", blurb: "Set an XP and quiz target for the week and track it.", Icon: ArtProgress, accent: "#a970ff", isNew: true },
  { href: "/doubts", label: "Doubt box", blurb: "Ask a question, get an answer, search solved doubts.", Icon: ArtAsk, accent: "#a970ff", isNew: true },
  { href: "/focus", label: "Focus Timer", blurb: "Pomodoro sessions with calm sounds and Lochi cheering you on.", Icon: ArtFocus, accent: "#44c95a" },
  { href: "/syllabus", label: "Syllabus", blurb: "Search every topic of all 28 courses.", Icon: ArtSyllabus, accent: "#2ba6f5" },
  { href: "/formulas", label: "Formula Cards", blurb: "Flip 3D cards to revise formulas by unit.", Icon: ArtFormula, accent: "#ff9a1f" },
  { href: "/mock", label: "Mock Test", blurb: "Timed test with a question palette and full review.", Icon: ArtMock, accent: "#a970ff", isNew: true },
  { href: "/plan", label: "Study Plan", blurb: "A day-by-day plan up to your exam date.", Icon: ArtPlan, accent: "#44c95a" },
  { href: "/assignments", label: "Assignments", blurb: "10 questions per unit. Resume any time, graded when you submit.", Icon: ArtAssign, accent: "#1fa88a" },
  { href: "/papers", label: "Papers & PYQs", blurb: "Official UTU old papers and model papers, one tap away.", Icon: ArtPapers, accent: "#ff5a5f", isNew: true },
  { href: "/ask", label: "Ask Lochi", blurb: "AI help for a concept you are stuck on.", Icon: ArtAsk, accent: "#a970ff", isNew: true },
  { href: "/league", label: "League", blurb: "This week's XP board. Optional, first names only.", Icon: ArtLeague, accent: "#ffc83d", isNew: true },
  { href: "/videos", label: "Video Lectures", blurb: "Find a lecture for any unit in one tap.", Icon: ArtVideo, accent: "#ff5a5f", isNew: true },
  { href: "/mistakes", label: "Mistakes", blurb: "Every question you got wrong, with the right answer.", Icon: ArtMistake, accent: "#2ba6f5", isNew: true },
  { href: "/quests", label: "Quests", blurb: "Daily challenges built from your real activity.", Icon: ArtQuest, accent: "#ff5a5f", isNew: true },
  { href: "/revise", label: "Revise today", blurb: "Missed questions and practised PYQs come back just before you forget them.", Icon: ArtRevise, accent: "#2ba6f5", isNew: true },
  { href: "/paper", label: "Full Paper", blurb: "Sit a 3-hour UTU-style paper on the clock, then mark yourself with model answers.", Icon: ArtPaper, accent: "#a970ff", isNew: true },
  { href: "/progress", label: "Progress", blurb: "XP history, accuracy and your badges.", Icon: ArtProgress, accent: "#ffc83d" },
  { href: "/settings", label: "Settings", blurb: "Theme, exam date, download or delete your data.", Icon: ArtGear, accent: "#9db0ba" },
  { href: "/profile", label: "Profile", blurb: "Your name, branch, semester and daily goal.", Icon: ArtUser, accent: "#a970ff", bottom: true },
];
