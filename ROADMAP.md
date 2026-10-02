# lockin. — what to build next

Ordered by impact for UTU first-years versus effort. Items marked **needs data/accounts** cannot be finished from code alone.

## 1. Next sprint (biggest wins)

1. **Spaced-repetition "Revise today" queue.** Every wrong answer and every PYQ marked "practised" re-appears after 1, 3, 7 and 21 days. The data is already there (quiz answers, PYQ ticks). Store ticks in Supabase instead of the device so they follow the student.
2. **Full PYQ paper simulator.** Build a real 3-hour UTU-pattern paper (Section A/B/C, internal choices) from the PYQ bank, with a self-marking rubric and model answers for the top 50 repeated questions per subject. **Needs data:** model answers written or checked by a teacher.
3. **Step-by-step "Show me the method" for numericals.** The question templates already know every intermediate value; render them as a guided worked solution with one hidden step at a time, so a wrong answer becomes a lesson.
4. **Lessons for the five core subjects.** Today only Intro Maths Unit 1 has full lessons. Write lessons (intro → worked examples → common mistakes → self-check) for the most repeated PYQ topics first: Newton's rings, Poynting theorem, Nernst equation, MO diagrams, Thevenin, induction motor, op-amp, K-maps, stress–strain, Otto cycle.
5. **Hindi and Hinglish.** UI strings, read-aloud already supports `hi-IN`; translate lesson text and question stems. **Needs data:** reviewed translations.

## 2. Make it sticky

6. **Friends, study groups and group streaks.** Invite by link; a group streak only survives if everyone studies. League is already opt-in with first names, so the privacy model exists.
7. **Weekly report card** (email or WhatsApp-style share image): XP, accuracy by unit, topics finished, focus minutes, next week's plan. **Needs accounts:** an email provider.
8. **Push notifications / PWA install.** "Your streak ends in 3 hours", "Mock test day". Service worker + Web Push. Also offline mode for lessons and formula cards.
9. **Achievement collections.** Badges per subject (e.g. "Thermodynamics master" after 90 % on every Unit 4 assignment), seasonal events before end-sems.
10. **Focus timer → XP (server-checked).** Today focus minutes stay on the device on purpose. A server-verified version (heartbeat every minute, daily cap) could award small XP.

## 3. Learning quality

11. **Adaptive difficulty.** Tag templates easy/medium/hard and pick the next question from the student's recent accuracy per unit.
12. **AI tutor grounded in the syllabus.** Give Ask Lochi the unit's lesson, formulas and the student's last mistakes as context, and let it generate a fresh similar question to check understanding. Keep the daily limit.
13. **Handwritten answer check.** Photo of a derivation → AI feedback against the key steps (marks breakdown like a UTU examiner). **Needs:** a vision-capable model budget and teacher-made rubrics.
14. **Curated video playlists.** In-app search works now; next, let a teacher pin 1–2 best videos per topic (admin panel) so students don't scroll.
15. **Lab worksheets.** Each 3D lab gets a printable viva sheet and 3 "predict, then check" tasks that award XP when answered from the lab.

## 4. Coverage

16. **Second-semester subjects in the PYQ bank:** Analytical Maths, PPS (C), EVS, Engineering Graphics, and the practical/viva sets.
17. **More labs for the remaining blueprint ideas:** centrifugal pump, journal-bearing pressure plot, ICCP potential map, 3-phase power-factor correction, BJT h-parameter bench, op-amp integrator/differentiator.
18. **Predicted paper per subject** built from repeat counts (the data is now structured in `src/content/pyq/*.json`).

## 5. Platform

19. **Admin panel** to add PYQs, fix typos in questions, pin videos and see anonymous analytics (which units students fail most). **Needs accounts:** admin role in Supabase.
20. **Observability:** error tracking (Sentry or similar), uptime checks, and a YouTube quota dashboard (the search cache is in memory; move it to Supabase or Redis when you run more than one server).
21. **Google sign-in** (the env flag exists) and phone OTP. **Needs accounts:** OAuth client / SMS provider.
22. **Performance budget in CI:** Lighthouse on /home, /pyq and one lab per run; fail the build if the 3D chunk for a lab grows past 250 kB.

## Known limits today (be honest with students)

- Lab models marked "simplified" (laser gain, LED current, corrosion rates, S_N1/S_N2 relative rates, Stribeck friction) show the right trends but are not quantitative.
- PYQ repeat counts and "predicted" topics come from the provided notes, not from an official UTU source.
- In-app videos need a `YOUTUBE_API_KEY`; the free quota allows about 100 new searches a day (each cached for 24 h). Without the key, buttons open a YouTube search.
- Read-aloud and voice typing depend on the browser (best in Chrome/Edge; voice typing sends audio to the browser vendor).

## What to build next (ideas, in order of value)

1. Sem-2 subjects once the notes arrive (the pipeline `scripts/build-pyq.py` + `LAB_MAP` is ready).
2. BCA lessons and the remaining BCA question banks (BCA-004/005/010/011); BCA-008 units 4-5 and BCA-009 labs.
3. Direct-to-Storage uploads (signed upload URLs) so admins can add large PDFs on Vercel.
4. Teacher classes: invite codes, assignment deadlines, per-class analytics.
5. Offline packs: cache a subject's notes/PDFs in the service worker for exam week.
6. Leaderboard seasons, daily 3-question challenge push notification, streak freeze.
7. More guided experiments (only ~45 of ~190 labs have one) and a "Best %" chip on lab cards.
8. Error tracking (Sentry), Lighthouse CI, and automated Supabase backups.
