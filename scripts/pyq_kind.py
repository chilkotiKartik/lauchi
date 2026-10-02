"""Heuristic 'theory' / 'numerical' tagging of PYQ question groups (shared by build-pyq.py and build-bca.py).

theory    : derive / prove / state / explain / define / describe / differentiate / write a program or algorithm / short note
numerical : evaluate / find / solve / calculate / verify with numbers / test convergence / trace the output of code or a sort
A group is tagged by the majority of its parts' marks (a part without marks counts as the group's marks; "5 to 10" = 7.5).
Run `python3 scripts/pyq_kind.py` to re-tag the generated JSON files in place (AHT-003, AHT-005, CST-001, BCA-*).
"""
import glob, json, os, re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "content", "pyq")
TAGS = re.compile(r"</?(sub|sup|b|i)>")
MATHS = {"AHT-003", "AHT-005", "BCA-002", "BCA-011"}

THEORY_START = re.compile(r"^(state|define|derive|prove|explain|describe|discuss|differentiate|distinguish|what (is|are|do)|how |why|list|illustrate|elaborate|introduce|compare|classify|outline|summari|enumerate|name |write (a )?(short )?note|write short|give|mention|justify|brief)", re.I)
NUM_VERB = re.compile(r"\b(evaluate|find|solve|calculate|compute|determine|verify|test the|examine the|reduce|expand|trace|form the|obtain|simplify|apply|change the order|change to|residues?|minimi[sz]e|convert|perform|express|construct the (truth|k-map)|draw the (k-map|truth|timing)|how many|what is the (value|result|sum|output)|represent)\b", re.I)
PROGRAM = re.compile(r"^(write|develop|create|implement|construct|define|code)\b.{0,60}\b(program|function|algorithm|class|method|query|pseudo ?code|flowchart|script|code|structure)\b|^write (the )?(steps|algorithm)", re.I)
OUTPUT = re.compile(r"(output of|will be the output|what will .* print|predict the output|find the output|trace the output|dry run)", re.I)
SORT_TRACE = re.compile(r"(step-by-step|steps|trace|sort|search|tree|heap|hash|insert|delete).{0,120}(\[[\d\s,.\-]+\]|\b\d+\s*,\s*\d+\s*,\s*\d+)", re.I)
MATH_PROOF_NUM = re.compile(r"(vector field|harmonic|analytic|solenoidal|irrotational|conservative|orthogonal|consistent|continuous|differentiable|converge|diverge|rank|determinant|row operations?)", re.I)
DIGITS = re.compile(r"\d|=")


def _plain(s):
    return re.sub(r"\s+", " ", TAGS.sub("", s)).strip()


def part_kind(text, code):
    t = _plain(text)
    low = t.lower()
    if OUTPUT.search(low[:200]):
        return "numerical"
    if SORT_TRACE.search(t[:300]) and not low.startswith(("differentiate", "what is", "define")):
        return "numerical"
    if PROGRAM.match(t) or (re.match(r"^(differentiate|explain|discuss|what is)", low) and re.search(r"\bwrite (a |an )?(c |java )?(program|function|algorithm)", low)):
        return "theory"
    if THEORY_START.match(t):
        if re.match(r"^(prove|show)", low) and MATH_PROOF_NUM.search(t) and "=" in t:
            return "numerical"
        if re.match(r"^(prove|derive|state and prove)", low):
            return "theory"
        if NUM_VERB.search(t) and ("=" in t or re.search(r"\d.*\d", t)) and not re.match(r"^(derive|explain|describe|define)\b.{0,60}$", low):
            return "numerical"
        return "theory"
    if re.match(r"^(show|prove) that", low):
        return "numerical" if code in MATHS or DIGITS.search(t) else "theory"
    if NUM_VERB.search(t) or re.match(r"^(if|given|let|consider|a |an |the |in |using|check|sort|search|insert|build|test)", low):
        return "numerical" if (DIGITS.search(t) or code in MATHS) else "theory"
    return "numerical" if code in MATHS else "theory"


def _w(m):
    if m is None:
        return None
    nums = [float(x) for x in re.findall(r"\d+", m)]
    return sum(nums) / len(nums) if nums else None


def group_kind(q, code):
    gm = _w(q.get("marks")) or 1.0
    score = {"theory": 0.0, "numerical": 0.0}
    for p in q["parts"] or [{"text": q.get("title", ""), "marks": None}]:
        score[part_kind(p["text"], code)] += _w(p.get("marks")) or gm
    if score["theory"] == score["numerical"]:
        return part_kind(q["parts"][0]["text"] if q["parts"] else q.get("title", ""), code)
    return "numerical" if score["numerical"] > score["theory"] else "theory"


def retag(data, code):
    """Re-tag every group of a subject dict in place; returns number of changed groups."""
    n = 0
    for u in data["units"]:
        for q in u["pyqs"]:
            k = group_kind(q, code)
            n += k != q["kind"]
            q["kind"] = k
    return n


def main():
    for f in sorted(glob.glob(os.path.join(ROOT, "*.json"))):
        code = os.path.basename(f)[:-5]
        if not (code in ("AHT-003", "AHT-005", "CST-001") or code.startswith("BCA-")):
            continue
        d = json.load(open(f, encoding="utf-8"))
        ch = retag(d, code)
        json.dump(d, open(f, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
        per = [(sum(q["kind"] == "theory" for q in u["pyqs"]), sum(q["kind"] == "numerical" for q in u["pyqs"])) for u in d["units"]]
        print(code, "changed", ch, "theory/numerical per unit", per)


if __name__ == "__main__":
    main()
