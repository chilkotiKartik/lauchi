import Link from "next/link";
import { StartQuizButton } from "@/components/StartQuizButton";
import { Tilt } from "@/components/Tilt";
import { ArtLab, ArtPractice, ArtPyq, ArtRevise } from "@/components/art";

export interface MissionProps {
  due: number;
  weak: { course: string; unit: number; label: string; pct: number } | null;
  lab: { id: string; title: string } | null;
}

/** Four next steps for today, each built from data the dashboard already loaded. */
export function MissionStrip({ due, weak, lab }: MissionProps) {
  return (
    <section aria-labelledby="mission-h" className="enter">
      <h2 id="mission-h" className="mb-3 text-xl">Today&apos;s mission</h2>
      <ul className="mission-grid m-0 list-none p-0">
        <li>
          <Tilt max={4} className="h-full">
            <Link href="/revise" className="mission" style={{ ["--accent" as string]: "#2ba6f5" }}>
              <span className="flex items-center justify-between"><span className="step" aria-hidden>1</span><ArtRevise size={34} /></span>
              <h3>Revise</h3>
              <p>{due > 0 ? `${due} ${due === 1 ? "question" : "questions"} due before you forget.` : "Nothing due. You are caught up."}</p>
            </Link>
          </Tilt>
        </li>
        <li>
          <Tilt max={4} className="h-full">
            <div className="mission" style={{ ["--accent" as string]: "#44c95a" }}>
              <span className="flex items-center justify-between"><span className="step" aria-hidden>2</span><ArtPractice size={34} /></span>
              <h3>Weakest unit</h3>
              <p>{weak ? `${weak.label} (${weak.pct}% right).` : "Take a quiz and your weakest unit shows up here."}</p>
              <div className="mt-auto pt-2">
                {weak ? <StartQuizButton kind="practice" course={weak.course} unit={weak.unit}>Practice it</StartQuizButton> : <Link href="/practice" className="btn">Pick a subject</Link>}
              </div>
            </div>
          </Tilt>
        </li>
        <li>
          <Tilt max={4} className="h-full">
            <Link href={lab ? `/labs/${lab.id}` : "/labs"} className="mission" style={{ ["--accent" as string]: "#ffc83d" }}>
              <span className="flex items-center justify-between"><span className="step" aria-hidden>3</span><ArtLab size={34} /></span>
              <h3>See it in 3D</h3>
              <p>{lab ? `Open the ${lab.title} lab.` : "Browse the live 3D labs."}</p>
            </Link>
          </Tilt>
        </li>
        <li>
          <Tilt max={4} className="h-full">
            <Link href="/pyq" className="mission" style={{ ["--accent" as string]: "#ff5a5f" }}>
              <span className="flex items-center justify-between"><span className="step" aria-hidden>4</span><ArtPyq size={34} /></span>
              <h3>Past papers</h3>
              <p>Solve the questions that repeat most.</p>
            </Link>
          </Tilt>
        </li>
      </ul>
    </section>
  );
}
