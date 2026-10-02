"""Builds src/content/pyq/<CODE>.json from the subject notes in content/pyq/*.md.

Run: python3 scripts/build-pyq.py

The notes are Markdown with LaTeX maths. The app renders only plain text plus <sub>/<sup>/<b>/<i>
(see src/lib/rich.tsx), so the maths is converted to Unicode text here, once, at build time.
"""
import json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pyq_kind  # theory / numerical tagging heuristic (see scripts/pyq_kind.py)

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "content", "pyq")
OUT = os.path.join(HERE, "..", "src", "content", "pyq")

SUBJECTS = [
    ("AHT-001", "physics.md", "Engineering Physics"),
    ("AHT-002", "chem.md", "Engineering Chemistry"),
    ("EET-001", "electrical.md", "Basic Electrical Engineering"),
    ("ECT-001", "electronics.md", "Basic Electronics Engineering"),
    ("MET-001", "mecha.md", "Basic Mechanical Engineering"),
    ("AHT-003", "maths1.md", "Introduction to Engineering Mathematics"),
    ("AHT-005", "maths2.md", "Analytical Mathematics"),
    ("CST-001", "cprog.md", "Programming for Problem Solving"),
]
# Notes whose question headings carry no Theory/Numerical tag: every question is a problem to solve.
CORE_FIVE = {"AHT-001", "AHT-002", "EET-001", "ECT-001", "MET-001"}
# The CST-001 notes have no lab section; these blueprints point at the C labs (see LAB_MAP in src/lib/pyq.ts).
EXTRA_LABS = {"CST-001": {1: ("1.1", "Compile and Run Pipeline"), 2: ("2.1", "Control Flow Stepper"), 3: ("3.1", "Sorting and the Call Stack"), 4: ("4.1", "Pointers and the Heap"), 5: ("5.1", "Structures and Unions in Memory")}}
DEFAULT_KIND = {"AHT-003": "numerical", "AHT-005": "numerical"}

# ---------------------------------------------------------------- LaTeX -> Unicode text

SYM = {
    "alpha": "α", "beta": "β", "gamma": "γ", "delta": "δ", "epsilon": "ε", "varepsilon": "ε", "zeta": "ζ", "eta": "η", "theta": "θ",
    "vartheta": "θ", "iota": "ι", "kappa": "κ", "lambda": "λ", "mu": "μ", "nu": "ν", "xi": "ξ", "pi": "π", "rho": "ρ", "sigma": "σ",
    "tau": "τ", "upsilon": "υ", "phi": "φ", "varphi": "φ", "chi": "χ", "psi": "ψ", "omega": "ω",
    "Gamma": "Γ", "Delta": "Δ", "Theta": "Θ", "Lambda": "Λ", "Xi": "Ξ", "Pi": "Π", "Sigma": "Σ", "Phi": "Φ", "Psi": "Ψ", "Omega": "Ω",
    "cdot": "·", "times": "×", "div": "÷", "pm": "±", "mp": "∓", "le": "≤", "leq": "≤", "ge": "≥", "geq": "≥", "neq": "≠", "ne": "≠",
    "approx": "≈", "sim": "∼", "equiv": "≡", "infty": "∞", "propto": "∝", "to": "→", "rightarrow": "→", "Rightarrow": "⇒", "leftarrow": "←",
    "leftrightarrow": "↔", "rightleftharpoons": "⇌", "parallel": "∥", "perp": "⊥", "nabla": "∇", "partial": "∂", "int": "∫", "oint": "∮",
    "sum": "Σ", "prod": "Π", "circ": "°", "oplus": "⊕", "ominus": "⊖", "ddagger": "‡", "dagger": "†", "hbar": "ħ", "AA": "Å",
    "degree": "°", "iint": "∬", "iiint": "∭", "mid": "|", "sec": "sec", "cot": "cot", "csc": "csc", "arg": "arg", "tanh": "tanh", "sup": "sup", "inf": "inf",
    "lt": "<", "gt": ">", "langle": "⟨", "rangle": "⟩", "setminus": "∖", "subset": "⊂", "cup": "∪", "cap": "∩", "forall": "∀", "exists": "∃",
    "neg": "¬", "land": "∧", "lor": "∨", "mapsto": "↦", "Leftrightarrow": "⇔", "iff": "⇔", "implies": "⇒", "Re": "Re", "Im": "Im", "ldots": "…", "dots": "…", "cdots": "⋯", "vdots": "⋮", "in": "∈", "angle": "∠", "triangle": "△", "star": "⋆",
    "log": "log", "ln": "ln", "sin": "sin", "cos": "cos", "tan": "tan", "sinh": "sinh", "cosh": "cosh", "exp": "exp", "max": "max",
    "min": "min", "lim": "lim", "det": "det", "uparrow": "↑", "downarrow": "↓", "%": "%", "{": "{", "}": "}", "_": "_", "$": "$", "#": "#",
    "&": "&", ",": " ", ";": " ", ":": " ", "!": "", " ": " ", "quad": " ", "qquad": "  ", "prime": "′", "bullet": "•", "ell": "ℓ",
}
RELS = {"to", "rightarrow", "Rightarrow", "leftarrow", "leftrightarrow", "rightleftharpoons", "approx", "le", "leq", "ge", "geq", "neq", "ne", "equiv", "propto"}
# "\sin x" keeps its space only for the newer subjects, so the first five notes build byte-identical to before.
SPACE_FUNCS = False
FUNCS = {"log", "ln", "sin", "cos", "tan", "sec", "cot", "csc", "sinh", "cosh", "tanh", "exp", "max", "min", "det", "arg"}
STRIP = {"left", "right", "big", "Big", "bigg", "Bigg", "displaystyle", "limits", "nolimits"}
TEXTLIKE = {"text", "mathrm", "textbf", "mathbf", "boldsymbol", "mathit", "textit", "operatorname", "mathsf", "mathcal", "rm", "bf"}
SUPDIGITS = str.maketrans("0123456789+-−=()n", "⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁻⁼⁽⁾ⁿ")


class Tex:
    def __init__(self, s):
        self.s, self.i = s, 0

    def peek(self):
        return self.s[self.i] if self.i < len(self.s) else ""

    def group(self):
        """One argument: {…} or a single command/character."""
        while self.peek() == " ":
            self.i += 1
        c = self.peek()
        if c == "{":
            self.i += 1
            out = self.seq(stop="}")
            self.i += 1
            return out
        if c == "\\":
            return self.command()
        self.i += 1
        return c

    def command(self):
        self.i += 1  # backslash
        m = re.match(r"[A-Za-z]+", self.s[self.i:])
        if m:
            name = m.group(0)
            self.i += len(name)
            while self.peek() == " " and name not in ("quad", "qquad"):
                self.i += 1  # TeX swallows the spaces after a control word
        else:
            name = self.s[self.i] if self.i < len(self.s) else ""
            self.i += 1
        if name == "begin":
            return self.environment()
        if name in STRIP:
            # \left( -> "(" ; \left. -> ""
            if name in ("left", "right") and self.peek():
                c = self.s[self.i]
                self.i += 1
                if c == "\\":
                    m2 = re.match(r"[A-Za-z]+|.", self.s[self.i:])
                    nm = m2.group(0)
                    self.i += len(nm)
                    return {"{": "{", "}": "}", "|": "‖", "langle": "⟨", "rangle": "⟩"}.get(nm, SYM.get(nm, ""))
                return "" if c == "." else c
            return ""
        if name in TEXTLIKE:
            g = self.group()
            return g + " " if name == "operatorname" and re.match(r"[A-Za-z0-9\\]", self.peek() or " ") else g
        if name in ("frac", "dfrac", "tfrac"):
            a, b = self.group(), self.group()
            vulgar = {("1", "2"): "½", ("1", "3"): "⅓", ("2", "3"): "⅔", ("1", "4"): "¼", ("3", "4"): "¾", ("1", "8"): "⅛"}
            if (a.strip(), b.strip()) in vulgar:
                return vulgar[(a.strip(), b.strip())]
            wrap = lambda x: x if re.fullmatch(r"[\w.′αβγδεθλμνπρστφψωΔΩ√²³⁰¹⁴⁵⁶⁷⁸⁹ħ°]*", strip_tags(x)) else f"({x})"
            return f"{wrap(a)}/{wrap(b)}"
        if name == "sqrt":
            if self.peek() == "[":
                j = self.s.index("]", self.i)
                root = self.s[self.i + 1 : j]
                self.i = j + 1
                a = self.group()
                return f"{root.translate(SUPDIGITS)}√({a})"
            a = self.group()
            return f"√{a}" if len(strip_tags(a)) <= 2 else f"√({a})"
        if name == "vec":
            a = self.group()
            return a + "⃗" if len(strip_tags(a)) == 1 else a
        if name == "hat":
            a = self.group()
            return a + "̂"
        if name in ("overline", "bar"):
            a = self.group()
            return a + "̅" if len(strip_tags(a)) == 1 else f"({a})‾"
        if name == "dot":
            a = self.group()
            return a + "̇"
        if name in ("mathbb",):
            return self.group()
        if name in SYM:
            if SPACE_FUNCS and name in FUNCS and re.match(r"[A-Za-z0-9\\]", self.peek() or " "):
                return SYM[name] + " "
            if name in RELS or (SPACE_FUNCS and name == "times"):
                return f" {SYM[name]} "
            return SYM[name]
        if name == "\\":
            return " "
        return name

    def environment(self):
        """\\begin{env} … \\end{env}: matrices as [1 2; 3 4], cases as { a, x > 0 ; b, x <= 0 }."""
        m = re.match(r"\{([A-Za-z*]+)\}", self.s[self.i:])
        if not m:
            return ""
        env = m.group(1)
        self.i += m.end()
        end = f"\\end{{{env}}}"
        j = self.s.find(end, self.i)
        if j < 0:
            j = len(self.s)
        body = self.s[self.i:j]
        self.i = min(len(self.s), j + len(end))
        rows = [r for r in re.split(r"\\\\", body) if r.strip()]
        cells = [[Tex(c).seq().strip() for c in r.split("&")] for r in rows]
        if env == "cases":
            return "{ " + " ; ".join(" ".join(c for c in r if c) for r in cells) + " }"
        if env in ("aligned", "align", "split", "gather", "eqnarray"):
            return " ; ".join(" ".join(c for c in r if c) for r in cells)
        inner = "; ".join(" ".join(r) for r in cells)
        lo, hi = {"pmatrix": "()", "vmatrix": "||", "Vmatrix": "‖‖", "Bmatrix": "{}"}.get(env, "[]")
        return f"{lo}{inner}{hi}"

    def script(self, tag):
        arg = self.group()
        if tag == "sup" and strip_tags(arg) in ("\\circ", "°", "∘"):
            return "°"
        if not arg:
            return ""
        return f"<{tag}>{arg}</{tag}>"

    def seq(self, stop=None):
        out = []
        while self.i < len(self.s):
            c = self.s[self.i]
            if stop and c == stop:
                break
            if c == "\\":
                out.append(self.command())
            elif c == "{":
                self.i += 1
                out.append(self.seq(stop="}"))
                self.i += 1
            elif c == "}":
                self.i += 1
            elif c == "^":
                self.i += 1
                out.append(self.script("sup"))
            elif c == "_":
                self.i += 1
                out.append(self.script("sub"))
            elif c == "~":
                out.append(" ")
                self.i += 1
            else:
                out.append(c)
                self.i += 1
        return "".join(out)


def strip_tags(s):
    return re.sub(r"</?(sub|sup|b|i)>", "", s)


def tex(s):
    s = s.replace("^\\circ", "°").replace("^{\\circ}", "°")
    out = Tex(s).seq()
    if SPACE_FUNCS:
        out = re.sub(r"(?<=[\w)>])(?=(?:sin|cos|tan|sec|cot|csc|log|ln|exp)\b)", " ", out)
    out = out.replace("°C", "°C")
    out = re.sub(r"<sup>°</sup>", "°", out)
    return re.sub(r"[ \t]{2,}", " ", out).strip()


def code_text(c):
    """Inline code is shown as plain text; C escapes lose their backslash (\\n -> ⏎, \\t -> tab, \\0 -> NUL)."""
    c = c.replace("\\n", "⏎").replace("\\t", "⇥").replace("\\0", "NUL").replace("\\\\", "\\")
    return c.replace("\\", "").replace("$", "＄")


def text(s):
    """Markdown line -> Rich text: maths converted, **bold** kept as <b>, stray markdown removed."""
    s = re.sub(r"\s*\[cite:[^\]]*\]", "", s)
    codes = []

    def keep_code(m):
        codes.append(code_text(m.group(1)))
        return f"\ue000{len(codes) - 1}\ue001"

    s = re.sub(r"`([^`]*)`", keep_code, s)
    parts = re.split(r"(\$\$.*?\$\$|\$[^$]+\$)", s)
    out = []
    for p in parts:
        if p.startswith("$$"):
            out.append(tex(p[2:-2]))
        elif p.startswith("$") and len(p) > 1:
            out.append(tex(p[1:-1]))
        else:
            out.append(p)
    s = "".join(out)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"(?<![\w*])\*(?!\s)([^*]+?)\*(?!\w)", r"<i>\1</i>", s)
    s = s.replace("`", "")
    s = re.sub("\ue000(\\d+)\ue001", lambda m: codes[int(m.group(1))], s)
    return re.sub(r"\s+", " ", s).strip()


def plain(s):
    return strip_tags(text(s))

# ---------------------------------------------------------------- notes -> structure

ROMAN = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6}


def parse_head(inner):
    """'Theory - 10 Marks | Repeated 10x' or 'Kirchhoff's Laws | 10 Marks | Repeated 4x' -> dict."""
    out = {"title": "", "kind": None, "marks": None, "repeated": None}
    for bit in [b.strip() for b in inner.split("|")]:
        m = re.match(r"Repeated\s+(\d+)\s*x", bit, re.I)
        if m:
            out["repeated"] = int(m.group(1))
            continue
        m = re.match(r"(Theory|Numerical|Coding|Output Tracing)\s*[-–]\s*(.+?)\s*Marks?$", bit, re.I)
        if m:
            out["kind"] = "theory" if m.group(1).lower() == "theory" else "numerical"
            out["marks"] = m.group(2).strip()
            continue
        m = re.match(r"^(\d+(?:\s*(?:to|-|–)\s*\d+)?)\s*Marks?$", bit, re.I)
        if m:
            out["marks"] = re.sub(r"\s*(-|–)\s*", " to ", m.group(1))
            continue
        out["title"] = text(bit)
    return out


def first_sentence(s, n=90):
    s = strip_tags(s)
    m = re.match(r"(.+?[.?!])(\s|$)", s)
    t = m.group(1) if m else s
    return t if len(t) <= n else t[: n - 1].rstrip() + "…"


def parse(md, code, name):
    lines = md.split("\n")
    units, unit, section, sub, cur_q, lab = [], None, None, None, None, None
    priority = []
    in_table = False
    for raw in lines:
        line = raw.rstrip()
        m = re.match(r"^# UNIT ([IVX]+):\s*(.+)$", line)
        if m:
            unit = {"n": ROMAN[m.group(1)], "title": m.group(2).title().replace("&", "&").replace("And ", "and ").replace("Of ", "of "), "syllabus": [], "pyqs": [], "predicted": [], "labs": []}
            unit["title"] = smart_title(m.group(2))
            units.append(unit)
            section, cur_q, lab, in_table = None, None, None, False
            continue
        if re.match(r"^# CONSOLIDATED", line):
            in_table, unit = True, None
            continue
        if in_table:
            m = re.match(r"^\|\s*\*?\*?(\d+)\*?\*?\s*\|\s*(.+?)\s*\|\s*Unit ([IVX]+)(?:,\s*([IVX]+))?\s*\|\s*\*?\*?(\d+)\s*Times\*?\*?\s*\|\s*(.+?)\s*\|", line)
            if m:
                priority.append({"rank": int(m.group(1)), "title": text(m.group(2)).replace("<b>", "").replace("</b>", ""), "unit": ROMAN[m.group(3)], "times": int(m.group(5)), "marks": m.group(6).strip()})
            continue
        if unit is None:
            continue
        if re.match(r"^## \d+\.\s*Syllabus", line):
            section = "syl"; continue
        if re.match(r"^## \d+\.\s*Previous", line):
            section, sub = "pyq", None; continue
        if re.match(r"^## \d+\.\s*Predicted", line):
            section = "pred"; continue
        if re.match(r"^## \d+\.\s*(\S+\s+)?(3D|Dedicated)", line):
            section = "lab"; continue
        if section == "pyq":
            if re.match(r"^### A\.", line):
                sub = "theory"; continue
            if re.match(r"^### B\.", line):
                sub = "numerical"; continue
            m = re.match(r"^\* \*\*(Q\d+\.\d+)\s*\[(.+?)\]:\*\*\s*(.*)$", line)
            if m:
                h = parse_head(m.group(2))
                kind = h["kind"] or DEFAULT_KIND.get(code) or sub or "theory"
                cur_q = {"id": m.group(1), "kind": kind, "title": h["title"], "marks": h["marks"], "repeated": h["repeated"], "parts": []}
                body = m.group(3).strip()
                if body:
                    cur_q["parts"].append(part(body))
                unit["pyqs"].append(cur_q)
                continue
            m = re.match(r"^\s{2,}(?:\*|\d+\.)\s+(.*)$", line)
            if m and cur_q is not None:
                body = m.group(1)
                # a sub-numbered list inside a question ("1. The diameters …") belongs to the last part
                if re.match(r"^\s{2,}\d+\.", line) and cur_q["parts"]:
                    sp = part(body)
                    cur_q["parts"][-1]["text"] += f" ({body_index(cur_q['parts'][-1])}) " + sp["text"]
                    if sp["marks"] and not cur_q["parts"][-1]["marks"]:
                        cur_q["parts"][-1]["marks"] = sp["marks"]
                else:
                    cur_q["parts"].append(part(body))
                continue
            m = re.match(r"^\s{4,}(.*\S.*)$", line)
            if m and cur_q is not None and cur_q["parts"]:
                sp = part(m.group(1))
                cur_q["parts"][-1]["text"] += " " + sp["text"]
                if sp["marks"] and not cur_q["parts"][-1]["marks"]:
                    cur_q["parts"][-1]["marks"] = sp["marks"]
                continue
        if section == "syl":
            m = re.match(r"^\* (.*)$", line)
            if m:
                body = m.group(1)
                hm = re.match(r"^\*\*(.+?):\*\*\s*(.*)$", body)
                if hm:
                    unit["syllabus"].append({"head": plain(hm.group(1)), "text": text(hm.group(2))})
                else:
                    unit["syllabus"].append({"head": "", "text": text(body)})
            continue
        if section == "pred":
            m = re.match(r"^\d+\.\s*\*\*(.+?)\*\*:?\s*(.*)$", line)
            if m:
                unit["predicted"].append({"title": text(m.group(1)).rstrip(":"), "text": text(m.group(2))})
            continue
        if section == "lab":
            m = re.match(r"^(?:###\s*|\*\s*\*\*)(?:LAB|Lab Model)\s*(\d+\.\d+):?\s*(.+?)(?:\*\*)?$", line)
            if m:
                lab = {"id": m.group(1), "title": plain(m.group(2).replace("**", "")).strip(), "points": []}
                unit["labs"].append(lab)
                continue
            m = re.match(r"^\s*\*\s*(.*)$", line)
            if m and lab is not None:
                t = text(m.group(1))
                if strip_tags(t).strip() and not re.fullmatch(r"<i>[^<]*</i>:?", t.strip()):
                    lab["points"].append(t)
    for u in units:
        for q in u["pyqs"]:
            if not q["title"]:
                q["title"] = first_sentence(q["parts"][0]["text"] if q["parts"] else q["id"])
            if q["marks"] is None:
                ms = [p["marks"] for p in q["parts"] if p["marks"]]
                q["marks"] = ms[0] if ms else None
    for u in units:
        if not u["labs"] and u["n"] in EXTRA_LABS.get(code, {}):
            lid, title = EXTRA_LABS[code][u["n"]]
            u["labs"].append({"id": lid, "title": title, "points": []})
    return {"code": code, "name": name, "units": units, "priority": priority}


def body_index(p):
    p.setdefault("_k", 0)
    p["_k"] += 1
    return "i" * p["_k"] if p["_k"] <= 3 else str(p["_k"])


def part(body):
    m = re.search(r"\*\(([^)]*?Marks?)\)\*\s*$", body)
    marks = None
    if m:
        marks = re.sub(r"\s*Marks?$", "", m.group(1)).strip()
        body = body[: m.start()].rstrip()
    return {"text": text(body), "marks": marks}


SMALL = {"and", "of", "the", "in", "for", "to", "a", "an", "on", "by", "with", "vs"}
KEEP = {"ODE", "PDE", "ODES", "PDES", "DC", "AC", "IC", "BJT", "FET", "MOSFET", "JFET", "UTM", "SFD", "BMD", "CFT", "MO", "NMR", "I", "II", "III", "IV", "V"}


def smart_title(s):
    words = re.split(r"(\s+|&|/|-)", s.strip())
    out, first = [], True
    for w in words:
        if not w.strip() or w in ("&", "/", "-"):
            out.append(w)
            continue
        if w.startswith("(") and len(w) > 1 and not w[1].isupper():
            w = "(" + w[1:2].upper() + w[2:]
        core = re.sub(r"[^A-Za-z]", "", w)
        if core.upper() in KEEP and core.upper() == core.upper() and len(core) > 1 and core.upper() in {k for k in KEEP}:
            out.append(w.upper() if w.strip("()").upper() == core.upper() else w)
        elif w in KEEP:
            out.append(w)
        elif w.lower() in SMALL and not first:
            out.append(w.lower())
        else:
            out.append(w[:1].upper() + w[1:].lower())
        first = False
    return re.sub(r"\((\w)", lambda m: "(" + m.group(1).upper(), "".join(out))


def main():
    os.makedirs(OUT, exist_ok=True)
    index = []
    global SPACE_FUNCS
    for code, f, name in SUBJECTS:
        SPACE_FUNCS = code not in CORE_FIVE
        md = open(os.path.join(SRC, f), encoding="utf-8").read()
        data = parse(md, code, name)
        for u in data["units"]:
            for q in u["pyqs"]:
                for p in q["parts"]:
                    p.pop("_k", None)
        if code not in CORE_FIVE:
            pyq_kind.retag(data, code)  # the new notes carry no Theory/Numerical tags: classify from the question text
        nq = sum(len(u["pyqs"]) for u in data["units"])
        nparts = sum(max(1, len(q["parts"])) for u in data["units"] for q in u["pyqs"])
        nlabs = sum(len(u["labs"]) for u in data["units"])
        assert len(data["units"]) == 5, (code, len(data["units"]))
        for u in data["units"]:
            assert u["pyqs"], (code, u["n"], "no PYQs")
            pass
            for q in u["pyqs"]:
                assert q["parts"], (code, q["id"])
                for p in q["parts"]:
                    assert "$" not in p["text"] and "\\" not in p["text"], (code, q["id"], p["text"][:120])
        json.dump(data, open(os.path.join(OUT, code + ".json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
        index.append({"code": code, "name": name, "groups": nq, "questions": nparts, "labs": nlabs})
        print(f"{code}: {nq} question groups, {nparts} questions, {nlabs} lab blueprints, priority table {len(data['priority'])}")
    json.dump(index, open(os.path.join(OUT, "index.json"), "w", encoding="utf-8"), ensure_ascii=False)


if __name__ == "__main__":
    main()
