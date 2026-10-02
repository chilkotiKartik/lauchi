import { Fragment } from "react";

const NAMED: Record<string, string> = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'", nbsp: "\u00a0", minus: "−", times: "×", le: "≤", ge: "≥", ne: "≠", deg: "°" };
/** Question banks escape < and > as entities; show them as the characters (as text, so still no markup). */
export const decodeEntities = (s: string) => s.replace(/&(#\d{1,6}|#x[0-9a-f]{1,6}|[a-z]{2,6});/gi, (m, e: string) => {
  if (e[0] === "#") { const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return n > 0 && n < 0x10ffff ? String.fromCodePoint(n) : m; }
  return NAMED[e.toLowerCase()] ?? m;
});

/** Renders text containing only <sub>, <sup>, <b>, <i> as React nodes. Everything else is shown as plain text, so nothing can inject markup. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(<\/?(?:sub|sup|b|i)>)/g);
  const nodes: React.ReactNode[] = [];
  const stack: { tag: string; children: React.ReactNode[] }[] = [{ tag: "", children: nodes }];
  parts.forEach((p, i) => {
    const open = /^<(sub|sup|b|i)>$/.exec(p);
    const close = /^<\/(sub|sup|b|i)>$/.exec(p);
    const top = stack[stack.length - 1];
    if (open) stack.push({ tag: open[1], children: [] });
    else if (close && top.tag === close[1] && stack.length > 1) {
      stack.pop();
      const Tag = top.tag as "sub" | "sup" | "b" | "i";
      stack[stack.length - 1].children.push(<Tag key={i}>{top.children}</Tag>);
    } else top.children.push(<Fragment key={i}>{decodeEntities(p)}</Fragment>);
  });
  while (stack.length > 1) { const t = stack.pop()!; stack[stack.length - 1].children.push(...t.children); }
  return <>{nodes}</>;
}
