// Test-only stand-in for Supabase: a tiny GoTrue (email link) + PostgREST (the subset supabase-js uses) in front of a REAL
// Postgres that has the real migrations applied. RLS, grants and functions are therefore the real ones.
import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

pg.types.setTypeParser(1082, (v) => v); // PostgREST returns a date as "YYYY-MM-DD", not a JS Date
const SERVICE_KEY = process.env.E2E_SERVICE_KEY;
const DB = "lockin_e2e";
const conn = { host: process.env.PGHOST || "/tmp", port: +(process.env.PGPORT || 5544), user: process.env.PGUSER || "pgtest" };

const admin = new pg.Client({ ...conn, database: "postgres" });
await admin.connect();
await admin.query(`drop database if exists ${DB} with (force)`);
await admin.query(`create database ${DB}`);
await admin.end();
const pool = new pg.Pool({ ...conn, database: DB, max: 8 });
await pool.query(fs.readFileSync("supabase/tests/stub.sql", "utf8"));
for (const f of fs.readdirSync("supabase/migrations").sort()) await pool.query(fs.readFileSync(path.join("supabase/migrations", f), "utf8"));

const codes = new Map(), tokens = new Map(), mails = new Map();
let ytCalls = 0;
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const send = (res, code, body) => { res.writeHead(code, { "content-type": "application/json" }); res.end(body === undefined ? "" : JSON.stringify(body)); };
const readBody = (req) => new Promise((r) => { let d = ""; req.on("data", (c) => (d += c)); req.on("end", () => { try { r(d ? JSON.parse(d) : {}); } catch { r({}); } }); });
const ident = (s) => { if (!/^[a-z_][a-z0-9_]*$/i.test(s)) throw Object.assign(new Error("bad identifier"), { status: 400 }); return `"${s}"`; };

async function userByEmail(email) {
  const found = await pool.query("select id, email from auth.users where email = $1", [email]);
  if (found.rows[0]) return found.rows[0];
  const id = crypto.randomUUID();
  await pool.query("insert into auth.users(id, email) values ($1, $2)", [id, email]);
  return { id, email };
}
const authUser = (u) => ({ id: u.id, aud: "authenticated", role: "authenticated", email: u.email, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() });
function session(u) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const access = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: u.id, aud: "authenticated", role: "authenticated", email: u.email, exp, session_id: crypto.randomUUID() })}.${crypto.randomBytes(8).toString("base64url")}`;
  tokens.set(access, u);
  return { access_token: access, token_type: "bearer", expires_in: 3600, expires_at: exp, refresh_token: crypto.randomBytes(6).toString("base64url"), user: authUser(u) };
}
const bearer = (req) => (req.headers.authorization ?? "").replace(/^Bearer /, "");

async function inRole(req, fn) {
  const t = bearer(req);
  const client = await pool.connect();
  try {
    await client.query("begin");
    if (t === SERVICE_KEY) await client.query("set local role service_role");
    else if (tokens.has(t)) {
      const u = tokens.get(t);
      await client.query("select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claims', $2, true)", [u.id, JSON.stringify({ sub: u.id, role: "authenticated" })]);
      await client.query("set local role authenticated");
    } else await client.query("set local role anon");
    const out = await fn(client);
    await client.query("commit");
    return out;
  } catch (e) { await client.query("rollback").catch(() => {}); throw e; } finally { client.release(); }
}

function filters(url, params) {
  const where = [];
  for (const [k, v] of url.searchParams) {
    if (["select", "order", "limit", "offset", "columns", "on_conflict"].includes(k)) continue;
    const neg = v.startsWith("not."); const vv = neg ? v.slice(4) : v;
    const m = /^(eq|neq|gt|gte|lt|lte|in|is)\.(.*)$/.exec(vv);
    if (!m) throw Object.assign(new Error("bad filter"), { status: 400 });
    const [, op0, val] = m; const col = ident(k); const op = neg && op0 === "is" ? "isnot" : op0;
    if (op === "isnot") { where.push(`${col} is ${val === "null" ? "not null" : "null"}`); continue; }
    if (op === "in") { params.push(val.replace(/^\(|\)$/g, "").split(",")); where.push(`${col} = any($${params.length})`); }
    else if (op === "is") where.push(`${col} is ${val === "null" ? "null" : "not null"}`);
    else { params.push(val); where.push(`${col} ${{ eq: "=", neq: "<>", gt: ">", gte: ">=", lt: "<", lte: "<=" }[op]} $${params.length}`); }
  }
  return where.length ? " where " + where.join(" and ") : "";
}
const cols = (s) => (!s || s === "*" ? "*" : s.split(",").map((c) => ident(c.trim())).join(","));

async function rest(req, res, url, p) {
  const body = req.method === "GET" || req.method === "DELETE" ? {} : await readBody(req);
  const wantOne = /pgrst\.object/.test(req.headers.accept ?? "");
  const minimal = /return=minimal/.test(req.headers.prefer ?? "");
  const out = await inRole(req, async (c) => {
    if (p.startsWith("/rest/v1/rpc/")) {
      const fn = ident(p.slice("/rest/v1/rpc/".length));
      const keys = Object.keys(body), params = keys.map((k) => (body[k] !== null && typeof body[k] === "object" ? JSON.stringify(body[k]) : body[k]));
      const args = keys.map((k, i) => `${ident(k)} := $${i + 1}`).join(",");
      const meta = await c.query("select proretset from pg_proc where proname = $1 and pronamespace = 'public'::regnamespace limit 1", [fn.replace(/"/g, "")]);
      if (meta.rows[0]?.proretset) { // a function that returns a table answers with a JSON array, like PostgREST
        const t = await c.query(`select * from public.${fn}(${args})`, params);
        return { status: 200, data: t.rows.map((row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, typeof v === "string" && /^-?\d+$/.test(v) && k !== "display" ? Number(v) : v]))) };
      }
      const r = await c.query(`select public.${fn}(${args}) as r`, params);
      return { status: 200, data: r.rows[0]?.r ?? null };
    }
    const table = ident(p.slice("/rest/v1/".length)); const params = [];
    if (req.method === "GET") {
      let q = `select ${cols(url.searchParams.get("select"))} from public.${table}${filters(url, params)}`;
      const ord = url.searchParams.get("order"); if (ord) q += " order by " + ord.split(",").map((o) => { const [c, d] = o.split("."); return `${ident(c)} ${d === "desc" ? "desc" : "asc"}`; }).join(",");
      if (url.searchParams.get("limit")) q += ` limit ${parseInt(url.searchParams.get("limit"), 10)}`;
      const r = await c.query(q, params); return { status: 200, data: r.rows };
    }
    if (req.method === "PATCH") {
      const set = Object.keys(body).map((k) => { params.push(body[k] !== null && typeof body[k] === "object" ? JSON.stringify(body[k]) : body[k]); return `${ident(k)} = $${params.length}`; });
      const r = await c.query(`update public.${table} set ${set.join(",")}${filters(url, params)} returning *`, params);
      return { status: minimal ? 204 : 200, data: r.rows };
    }
    if (req.method === "POST") {
      const rows = Array.isArray(body) ? body : [body]; const k = Object.keys(rows[0]);
      const vals = rows.map((row) => `(${k.map((key) => { params.push(row[key] !== null && typeof row[key] === "object" ? JSON.stringify(row[key]) : row[key]); return `$${params.length}`; }).join(",")})`);
      const r = await c.query(`insert into public.${table} (${k.map(ident).join(",")}) values ${vals.join(",")} returning *`, params);
      return { status: minimal ? 201 : 201, data: r.rows };
    }
    if (req.method === "DELETE") { const r = await c.query(`delete from public.${table}${filters(url, params)} returning *`, params); return { status: 200, data: r.rows }; }
    throw Object.assign(new Error("method"), { status: 405 });
  });
  if (out.status === 204) return send(res, 204);
  if (wantOne && Array.isArray(out.data)) return out.data.length === 1 ? send(res, 200, out.data[0]) : send(res, 406, { message: "JSON object requested, multiple (or no) rows returned", code: "PGRST116" });
  return send(res, out.status, out.data);
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x"); const p = url.pathname;
  try {
    if (p === "/youtube/v3/search") { // stand-in for the YouTube Data API search endpoint
      if (url.searchParams.get("key") !== "e2e-yt-key") return send(res, 403, { error: { code: 403 } });
      ytCalls++;
      const q = url.searchParams.get("q") ?? "";
      const ids = ["aaaaaaaaaa1", "bbbbbbbbbb2", "cccccccccc3", "dddddddddd4"];
      return send(res, 200, { items: ids.map((id, i) => ({ id: { kind: "youtube#video", videoId: id }, snippet: { title: `${q} &amp; lecture ${i + 1}`, channelTitle: `Teacher ${i + 1}`, publishedAt: "2025-01-0" + (i + 1) + "T00:00:00Z", liveBroadcastContent: "none" } })) });
    }
    if (p === "/__yt") return send(res, 200, { calls: ytCalls });
    if (p === "/__mail") return send(res, 200, { link: mails.get(url.searchParams.get("email")) ?? null });
    if (p === "/__sql" && req.method === "POST") { const b = await readBody(req); const r = await pool.query(b.sql, b.params ?? []); return send(res, 200, { rows: r.rows }); }
    if (p === "/auth/v1/otp") {
      const b = await readBody(req); const email = String(b.email).toLowerCase();
      if (email.startsWith("limit")) return send(res, 429, { code: 429, error_code: "over_email_send_rate_limit", msg: "rate limit" });
      const u = await userByEmail(email); const code = crypto.randomBytes(8).toString("hex"); codes.set(code, u);
      const back = url.searchParams.get("redirect_to");
      mails.set(email, `${back}${back.includes("?") ? "&" : "?"}code=${code}`);
      return send(res, 200, {});
    }
    if (p === "/auth/v1/token") {
      const b = await readBody(req); const g = url.searchParams.get("grant_type");
      if (g === "pkce") { const u = codes.get(b.auth_code); if (!u) return send(res, 400, { error_code: "flow_state_not_found", msg: "invalid" }); codes.delete(b.auth_code); return send(res, 200, session(u)); }
      return send(res, 400, { msg: "unsupported" });
    }
    if (p === "/auth/v1/user") { const u = tokens.get(bearer(req)); return u ? send(res, 200, authUser(u)) : send(res, 401, { msg: "invalid" }); }
    const del = /^\/auth\/v1\/admin\/users\/([0-9a-f-]{36})$/.exec(p);
    if (del && req.method === "DELETE") {
      if (bearer(req) !== process.env.E2E_SERVICE_KEY) return send(res, 401, { msg: "not admin" });
      await pool.query("delete from auth.users where id = $1", [del[1]]);
      for (const [t, u] of tokens) if (u.id === del[1]) tokens.delete(t);
      return send(res, 200, {});
    }
    if (p === "/auth/v1/logout") { tokens.delete(bearer(req)); return send(res, 204); }
    if (p.startsWith("/rest/v1/")) return await rest(req, res, url, p);
    send(res, 404, { message: "not found" });
  } catch (e) {
    const perm = e.code === "42501";
    if (process.env.E2E_DEBUG) console.error("rest error:", req.method, req.url, e.message);
    send(res, e.status ?? (perm ? 403 : 400), { message: e.message, code: e.code ?? "PGRST000" });
  }
}).listen(54321, () => console.log("supabase-pg stand-in on 54321"));
