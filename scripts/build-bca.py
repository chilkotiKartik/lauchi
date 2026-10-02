"""Builds the BCA curriculum from content/pyq/bca.md (VMSB UTU Bachelor of Computer Applications master file).

Run: python3 scripts/build-bca.py
Writes src/content/syllabus/BCA-0NN.json, src/content/pyq/BCA-0NN.json and appends rows to src/content/syllabus/index.json.

Reuses the LaTeX -> Unicode converter from build-pyq.py (extended here with a few logic / set symbols and matrices).

Unit assignment heuristic (the master file does not tag questions with a unit): every question, predicted topic,
lab and priority row is scored against each unit's title + syllabus text by shared (rarity-weighted) keywords;
a small penalty for distance from the unit the item's position in the list would suggest (the question bank is
written in syllabus order) breaks ties. Every unit is guaranteed at least one question.
"""
import importlib.util, json, math, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("build_pyq", os.path.join(HERE, "build-pyq.py"))
bp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bp)
bp.SYM.update({
    "neg": "¬", "lnot": "¬", "wedge": "∧", "land": "∧", "vee": "∨", "lor": "∨", "forall": "∀", "exists": "∃", "subset": "⊂", "subseteq": "⊆",
    "supset": "⊃", "supseteq": "⊇", "cup": "∪", "cap": "∩", "emptyset": "∅", "varnothing": "∅", "mid": "∣", "vert": "|", "lvert": "|", "rvert": "|",
    "setminus": "∖", "notin": "∉", "nmid": "∤", "implies": "⇒", "iff": "⇔", "leftrightarrow": "↔", "lfloor": "⌊", "rfloor": "⌋",
    "lceil": "⌈", "rceil": "⌉", "mod": " mod ", "pmod": " mod ", "bmod": " mod ", "therefore": "∴", "because": "∵", "oplus": "⊕", "odot": "⊙",
    "cos": "cos", "sec": "sec", "csc": "csc", "cot": "cot", "arcsin": "sin⁻¹", "gcd": "gcd", "lcm": "lcm", "sqrt": "√", "ne": "≠", "langle": "⟨",
    "rangle": "⟩", "mathbb": "", "overrightarrow": "", "lbrace": "{", "rbrace": "}", "backslash": "\\", "dots": "…", "ldots": "…", "to": "→",
    "xrightarrow": "→", "Longrightarrow": "⇒", "longrightarrow": "→", "oplus": "⊕", "not": "¬", "sigma": "σ", "mu": "μ", "bar": "",
})
bp.RELS.update({"subset", "subseteq", "supset", "supseteq", "implies", "iff", "notin", "in", "mid", "nmid"})

SRC = os.path.join(HERE, "..", "content", "pyq", "bca.md")
OUT_PYQ = os.path.join(HERE, "..", "src", "content", "pyq")
OUT_SYL = os.path.join(HERE, "..", "src", "content", "syllabus")

# file section number -> (course code, name, short, paper code)
SUBJECTS = {
    1: ("BCA-001", "Programming using C", "C Programming", "BCAT 001"),
    2: ("BCA-002", "Basic Mathematics", "Basic Maths", "BCAT 002"),
    3: ("BCA-003", "Digital Electronics", "Digital Electronics", "BCAT 003"),
    4: ("BCA-004", "Information Technology Fundamentals", "IT Fundamentals", "BCAT 004"),
    5: ("BCA-006", "Data Structures", "Data Structures", "BCAT 006"),
    6: ("BCA-007", "Computer Organization & Architecture", "COA", "BCAT 007"),
    7: ("BCA-008", "Object-Oriented Programming using Java", "Java (OOP)", "BCAT 008"),
    8: ("BCA-009", "Software Engineering", "Software Engg.", "BCAT 009"),
    9: ("BCA-011", "Bridge Course in Mathematics", "Bridge Maths", "BCAB 001"),
    10: ("BCA-005", "Personality Development and Life Skills", "Personality Dev.", "BCAT 005"),
    11: ("BCA-010", "Environmental Studies", "Env. Studies", "BCAT 010"),
}
# Manual corrections found when the keyword scorer was checked against src/content/syllabus/BCA-*.json topics
# (question id -> 1-based unit). Only items where the scorer and the syllabus topic list disagreed are listed.
UNIT_OVERRIDES = {
    "BCA-001": {"Q1.2": 1, "Q1.8": 2, "Q1.17": 5},          # 2D array program; struct vs union
    "BCA-002": {"Q2.6": 2, "Q2.8": 2, "Q2.15": 4},  # inclusion-exclusion; Hasse diagram; handshakes (combinations)
    "BCA-004": {"Q4.4": 1, "Q4.16": 4},                      # DBMS is listed under Software Concepts
    "BCA-007": {"Q6.4": 1, "Q6.11": 3},           # multiprocessors/multicomputers (unit 1 topic); bus transfer
    "BCA-008": {"Q7.8": 3},                       # final keyword (overriding / inheritance)
    "BCA-009": {"Q8.6": 1, "Q8.10": 3},           # CMMI (process framework); cohesion and coupling (design)
    "BCA-010": {"Q11.16": 4},                     # pollution control legislation
    "BCA-011": {"Q9.4": 2, "Q9.6": 2, "Q9.13": 1},           # permutations; determinants
}
# predicted-topic corrections: (course, text prefix) -> unit
PRED_OVERRIDES = {("BCA-003", "Implementation of higher-order MUX"): 2, ("BCA-004", "Fixed-point vs"): 5}
PAPER_TO_SECTION = {v[3].replace(" ", ""): k for k, v in SUBJECTS.items()}
# Subjects whose syllabus is bullets without UNIT labels
UNIT_TITLES = {
    10: ["Self-Exploration and Personality", "Empathy and Thinking Skills", "Stress and Communication", "Mindset and Time Management", "Interviews and Careers"],
}

STOP = set("number numbers the and for with from that this are was were into its their then than they them which what when where how why not any all can has have had been being such also use used using via per each both only more most other over under between within about above below out off one two three four five six seven eight nine ten write explain describe define differentiate compare derive discuss give state show find using following given various types type example examples program programs marks mark short note notes concept concepts basic working diagram diagrams detail details between role need necessity its".split())


def clean(s):
    return re.sub(r"\s*\[cite:[^\]]*\]", "", s)


def pre(s):
    s = clean(s)

    def mat(m):
        rows = [" ".join(c.strip() for c in r.split("&")) for r in m.group(2).split("\\\\") if r.strip()]
        return "[" + "; ".join(rows) + "]"
    s = re.sub(r"\\begin\{([bpvBV]?matrix|array)\}(?:\{[^}]*\})?(.*?)\\end\{\1\}", mat, s, flags=re.S)
    s = re.sub(r"\\binom\{([^{}]*)\}\{([^{}]*)\}", r"C(\1, \2)", s)
    s = re.sub(r"\\(?:text|mathrm)\{\s*\}", "", s)
    return s


def rich(s):
    return bp.text(pre(s))


def plain(s):
    return bp.strip_tags(rich(s)).strip()


def bt(s):
    """Remove <b>/<i> but keep sub/sup."""
    return re.sub(r"</?[bi]>", "", s)


def split_top(s, seps=",;"):
    """Split on separators at bracket depth 0 (and on '. ' sentence ends)."""
    out, depth, cur = [], 0, []
    i = 0
    while i < len(s):
        c = s[i]
        if c in "([{":
            depth += 1
        elif c in ")]}":
            depth = max(0, depth - 1)
        if depth == 0 and (c in seps or (c == "." and s[i + 1: i + 2] == " " and s[i + 2: i + 3].isupper() and not re.search(r"\b(e\.g|i\.e|vs|etc)$", "".join(cur)))):
            out.append("".join(cur))
            cur = []
        else:
            cur.append(c)
        i += 1
    out.append("".join(cur))
    return [re.sub(r"\s+", " ", x).strip(" .") for x in out if x.strip(" .")]


def topics_of(text):
    t = bt(rich(text))
    items = []
    for x in split_top(t):
        x = re.sub(r"^(and|or)\s+", "", x).strip()
        if len(bp.strip_tags(x)) >= 2 and x not in items:
            items.append(x)
    return items


# ---------------------------------------------------------------- parsing the master file

def parse(md):
    secs = {}
    cur = None
    sub = None
    for raw in md.split("\n"):
        line = raw.rstrip()
        m = re.match(r"^# (\d+)\. (.+)$", line)
        if m:
            cur = int(m.group(1))
            secs[cur] = {"syl": [], "q": [], "pred": [], "labs": [], "table": []}
            sub = None
            if cur == 12:
                sub = "table"
            continue
        if cur is None:
            continue
        if cur == 12:
            secs[12]["table"].append(line)
            continue
        m = re.match(r"^## \d+\.(\d)", line)
        if m:
            sub = {"1": "syl", "2": "q", "3": "pred", "4": "lab"}[m.group(1)]
            continue
        S = secs[cur]
        if sub == "syl" and line.startswith("* "):
            S["syl"].append(line[2:])
        elif sub == "q":
            m = re.match(r"^\* \*\*(Q\d+\.\d+)\s*\[(\d+)\s*Marks?\]:\*\*\s*(.*)$", line)
            if m:
                S["q"].append((m.group(1), m.group(2), m.group(3)))
        elif sub == "pred" and line.startswith("* "):
            S["pred"].append(line[2:])
        elif sub == "lab":
            m = re.match(r"^###\s*LAB\s*(\d+\.\d+):\s*(.+)$", line)
            if m:
                S["labs"].append({"id": m.group(1), "title": plain(m.group(2)), "points": []})
                continue
            m = re.match(r"^\s+\*\s+(.*)$", line)
            if m and S["labs"]:
                S["labs"][-1]["points"].append(rich(m.group(1)))
    return secs


def syl_units(sec, S):
    units = []
    for i, line in enumerate(S["syl"]):
        m = re.match(r"^\*\*(?:UNIT|Unit)\s+([IVX\d]+)\s*\((.+?)\):\*\*\s*(.*)$", line)
        if m:
            title, body = m.group(2), m.group(3)
        else:
            m = re.match(r"^\*\*(.+?):\*\*\s*(.*)$", line)
            if m:
                title, body = m.group(1), m.group(2)
            else:
                title, body = UNIT_TITLES[sec][i], line
        units.append({"n": i + 1, "title": plain(title), "body": body})
    return units


# ---------------------------------------------------------------- unit assignment

def stem(w):
    for suf in ("ing", "es", "s", "ed"):
        if w.endswith(suf) and len(w) - len(suf) >= 3:
            return w[: -len(suf)]
    return w


def words(s):
    s = bp.strip_tags(s).lower()
    return {stem(w) for w in re.findall(r"[a-z][a-z0-9+#]{2,}|\d+nf|\bk-map\b", s) if w not in STOP}


class Assigner:
    def __init__(self, units):
        self.ws = [words(u["title"] + " " + u["title"] + " " + u["body"]) for u in units]
        df = {}
        for w in self.ws:
            for x in w:
                df[x] = df.get(x, 0) + 1
        self.df = df
        self.n = len(units)

    def pick(self, text, pos=None):
        qw = words(text)
        best, bi = -1e9, 0
        for i, w in enumerate(self.ws):
            sc = sum(1.0 / self.df[x] ** 1.5 * (1.5 if len(x) > 6 else 1) for x in qw & w)
            if pos is not None:
                sc -= 0.15 * abs(pos * self.n - (i + 0.5)) / self.n * 4
            if sc > best:
                best, bi = sc, i
        return bi


NUMERIC = re.compile(r"^(find|calculate|compute|solve|convert|evaluate|determine|construct|obtain|simplify|minimi[sz]e|trace|resolve|prove|show that|insert|build|implement|perform|expand|how many|if |given|a |an |the |in |using|let |consider|represent|apply|check|sort|search|reduce|express|draw the (k-map|truth|timing)|design a (synchronous|counter|circuit|sequential)|write (a|an|the) (c|java|program|code|recursive|function|method|class|menu|sql|query|pseudo)|develop (a|an) (c|java|program))", re.I)
THEORYWORDS = re.compile(r"^(explain|describe|define|differentiate|distinguish|compare|discuss|state|what|why|list|enumerate|classify|illustrate|elaborate|outline|summari|write (a )?(short )?note|write short|name)", re.I)


def kind_of(text, marks):
    t = plain(text)
    if THEORYWORDS.match(t) and not re.search(r"\b(program|c code|java code|pseudo ?code)\b.*\b(write|develop)\b|^write a (c |java )?program", t, re.I):
        # concept questions that also ask for a worked calculation stay theory; programs / calculations below
        if re.search(r"\b(calculate|compute|evaluate|find the|determine the|solve)\b", t, re.I) and re.search(r"\d", t):
            return "numerical"
        return "theory"
    if NUMERIC.match(t) or re.search(r"\b(program|calculate|compute|solve|find the (value|sum|inverse|number|equation|mean|median|mode|standard)|convert)\b", t, re.I):
        return "numerical"
    return "theory"


def first_sentence(s, n=90):
    s = bp.strip_tags(s)
    m = re.match(r"(.+?(?<!\bvs)(?<!\be\.g)(?<!\bi\.e)(?<!\betc)(?<!\bapprox)[.?!:])(\s|$)", s)
    t = m.group(1).rstrip(".:") if m else s
    return t if len(t) <= n else t[: n - 1].rsplit(" ", 1)[0].rstrip(",;:( ") + "…"


def pred_item(line):
    t = rich(line)
    t = t.rstrip(".")
    m = re.match(r"^(.{8,70}?)(?::| – | — )\s*(.+)$", t)
    if m:
        return {"title": m.group(1).strip(), "text": m.group(2).strip()}
    return {"title": first_sentence(t, 70), "text": t}


MATH = re.compile(r"\$([^$]+)\$")


def formulas_from(raws):
    out = []
    for r in raws:
        for m in MATH.finditer(clean(r)):
            f = rich("$" + m.group(1) + "$")
            pf = bp.strip_tags(f)
            if "=" in pf and 5 <= len(pf) <= 110 and "\\" not in f and f not in out:
                out.append(f)
    return out


def priority_rows(lines):
    rows = []
    for line in lines:
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) >= 5 and re.match(r"^\*\*BCA[BT] \d+\*\*$", cells[0]):
            rows.append((cells[0].strip("*").replace(" ", ""), clean(cells[1]).strip(), clean(cells[3]).strip()))
    return rows


# ---------------------------------------------------------------- main

def main():
    md = open(SRC, encoding="utf-8").read()
    secs = parse(md)
    prio = {}
    for paper, title, marks in priority_rows(secs[12]["table"]):
        prio.setdefault(PAPER_TO_SECTION[paper], []).append((title, marks))
    os.makedirs(OUT_PYQ, exist_ok=True)
    idx_path = os.path.join(OUT_SYL, "index.json")
    index = json.load(open(idx_path, encoding="utf-8"))
    have = {r["code"] for r in index}
    report = []
    for sec, (code, name, short, paper) in SUBJECTS.items():
        S = secs[sec]
        us = syl_units(sec, S)
        asg = Assigner(us)
        units = []
        for u in us:
            units.append({"n": u["n"], "title": u["title"], "hours": None, "topics": topics_of(u["body"]), "formulas": [], "hints": []})
        pu = [{"n": u["n"], "title": u["title"], "syllabus": [{"head": "", "text": rich(u["body"]).strip()}], "pyqs": [], "predicted": [], "labs": []} for u in us]
        # questions
        nq = len(S["q"])
        qunit = []
        for i, (qid, marks, body) in enumerate(S["q"]):
            ti = plain(body)
            qunit.append(UNIT_OVERRIDES.get(code, {}).get(qid, 0) - 1 if qid in UNIT_OVERRIDES.get(code, {}) else asg.pick(ti, pos=(i + 0.5) / nq))
        # every unit needs at least one question: take the nearest-by-order question from the biggest unit
        for k in range(len(us)):
            if k not in qunit:
                lo = round(k * nq / len(us))
                cand = [i for i in range(nq) if qunit.count(qunit[i]) > 1]
                j = min(cand, key=lambda i: abs(i - lo))
                qunit[j] = k
        formula_src = [[] for _ in us]
        for (qid, marks, body), k in zip(S["q"], qunit):
            text = rich(body)
            title = first_sentence(text)
            pu[k]["pyqs"].append({"id": qid, "kind": "theory", "title": title, "marks": marks, "repeated": 1, "parts": [{"text": text, "marks": marks}]})
            formula_src[k].append(body)
        for u in pu:
            for q in u["pyqs"]:
                q["kind"] = bp.pyq_kind.group_kind(q, code)
        for line in S["pred"]:
            k = next((v - 1 for (c2, pre), v in PRED_OVERRIDES.items() if c2 == code and plain(line).startswith(pre)), None)
            if k is None:
                k = asg.pick(plain(line))
            pu[k]["predicted"].append(pred_item(line))
            units[k]["hints"].append(plain(line).rstrip("."))
            formula_src[k].append(line)
        for lab in S["labs"]:
            k = asg.pick(lab["title"] + " " + " ".join(lab["points"]))
            pu[k]["labs"].append(lab)
        for k in range(len(us)):
            units[k]["formulas"] = formulas_from(formula_src[k])[:4]
            if not units[k]["hints"]:
                units[k]["hints"] = [q["title"] for q in pu[k]["pyqs"][:2]]
        priority = []
        for r, (title, marks) in enumerate(prio.get(sec, []), 1):
            t = plain(title)
            priority.append({"rank": r, "title": t, "unit": asg.pick(t) + 1, "times": 1, "marks": marks})
        syl = {"code": code, "name": name, "short": short, "type": "theory", "ltp": "3-1-0", "credits": 4, "sem": "I", "marks": None,
               "objectives": [], "outcomes": [], "text": [], "ref": [], "rule": "", "note": "", "units": units, "exps": []}
        # keep key order identical to MET-001.json
        order = ["code", "name", "short", "type", "ltp", "credits", "sem", "marks", "objectives", "outcomes", "text", "ref", "rule", "note", "units", "exps"]
        syl = {k: syl[k] for k in order}
        json.dump(syl, open(os.path.join(OUT_SYL, code + ".json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        json.dump({"code": code, "name": name, "units": pu, "priority": priority}, open(os.path.join(OUT_PYQ, code + ".json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
        items = sum(len(u["topics"]) for u in units)
        if code not in have:
            index.append({"code": code, "name": name, "short": short, "type": "theory", "sem": "I", "credits": 4, "units": len(units), "items": items})
        report.append(f"{code} {name}: units={len(units)} topics={items} questions={nq} per-unit={[len(u['pyqs']) for u in pu]} predicted={len(S['pred'])} labs={len(S['labs'])} priority={len(priority)}")
    json.dump(index, open(idx_path, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print("\n".join(report))


if __name__ == "__main__":
    main()
