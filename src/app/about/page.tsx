import type { Metadata } from "next";
import { LegalPage, Mail } from "@/components/Legal";

export const metadata: Metadata = { title: "About" };

export default function About() {
  return (
    <LegalPage title="About lockin.">
      <p><b>Made by kalu don.</b> lockin. is a study app for B.Tech students of Uttarakhand Technical University, built around the official first-year syllabus (Semester I and II).</p>
      <h2>What it is not</h2>
      <p>lockin. is unofficial. It is not affiliated with, endorsed by or run by Uttarakhand Technical University or any college. Always confirm dates, rules and syllabus with the university. Study material can contain mistakes, and AI answers can be wrong: check important steps against your textbook or teacher.</p>
      <h2>Contact</h2>
      <p><Mail /></p>
    </LegalPage>
  );
}
