/** The formal head of the question paper, as it looks on a printed UTU end-semester paper. */
export function PaperHeader({ subject, code }: { subject: string; code: string }) {
  return (
    <header className="pp-head">
      <p className="pp-uni">Uttarakhand Technical University</p>
      <p className="pp-sub">B.Tech I Year — {subject} <span className="pp-code">({code})</span></p>
      <p className="pp-print-line">Uttarakhand Technical University — B.Tech I Year — {subject} — Time: 3 Hours, Max Marks: 100</p>
      <div className="pp-meta"><span>Time: 3 Hours</span><span>Max Marks: 100</span></div>
    </header>
  );
}
