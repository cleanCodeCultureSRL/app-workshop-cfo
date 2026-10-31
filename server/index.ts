import express from "express";
import { createServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import type { ClientMessage, Participant, PresenterState, ServerMessage, Role } from "../shared/types.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA_DIR = join(ROOT, "data");
const STATE_FILE = join(DATA_DIR, "state.json");

// Minimal .env loader (no dependency): KEY=VALUE lines, # comments. Real env vars win.
try {
  const envFile = join(ROOT, ".env");
  if (existsSync(envFile)) {
    for (const line of readFileSync(envFile, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
} catch {}

const PORT = Number(process.env.PORT ?? 8791);
const TEACHER_PIN = process.env.TEACHER_PIN ?? "1234";
const PROD = process.env.NODE_ENV === "production";

// ---------------- state ----------------
interface Persisted {
  presenter: PresenterState;
  participants: Record<string, Participant>;
}

/** Starea Freedom Number a unui participant e un singur câmp JSON (câteva zeci de KB cu categorii proprii). */
const FIELD_MAX = 200000;
/** Câte versiuni semnate ale contractului păstrăm per participant. */
const ACTS_MAX = 50;

let state: Persisted = { presenter: { stepId: null, updatedAt: 0, maxStepId: null }, participants: {} };

function loadState() {
  try {
    if (existsSync(STATE_FILE)) {
      const raw = JSON.parse(readFileSync(STATE_FILE, "utf8")) as Persisted;
      state = raw;
      if (state.presenter.maxStepId === undefined) state.presenter.maxStepId = state.presenter.stepId;
      for (const p of Object.values(state.participants)) {
        p.online = false;
        if (!Array.isArray(p.acts)) p.acts = [];
      }
      console.log(`[state] loaded ${Object.keys(state.participants).length} participants`);
    }
  } catch (e) {
    console.warn("[state] could not load, starting fresh", e);
  }
}
let saveTimer: NodeJS.Timeout | null = null;
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
      writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    } catch (e) {
      console.warn("[state] save failed", e);
    }
  }, 400);
}
loadState();

// ---------------- sockets ----------------
interface Conn {
  ws: WebSocket;
  role: Role | null;
  participantId: string | null;
  alive: boolean;
}
const conns = new Set<Conn>();

function send(ws: WebSocket, msg: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}
function broadcast(msg: ServerMessage, filter?: (c: Conn) => boolean) {
  for (const c of conns) if (!filter || filter(c)) send(c.ws, msg);
}
function participantsList(): Participant[] {
  return Object.values(state.participants).sort((a, b) => a.joinedAt - b.joinedAt);
}
let participantsTimer: NodeJS.Timeout | null = null;
function pushParticipants() {
  // coalesce bursts of typing into ~10 updates/sec max; only the presenter sees the room
  if (participantsTimer) return;
  participantsTimer = setTimeout(() => {
    participantsTimer = null;
    broadcast({ type: "participants", participants: participantsList() }, (c) => c.role === "teacher");
  }, 100);
  scheduleSave();
}
function participantConns(id: string) {
  return [...conns].filter((c) => c.participantId === id);
}

function handle(conn: Conn, msg: ClientMessage) {
  switch (msg.type) {
    case "ping":
      send(conn.ws, { type: "pong" });
      return;

    case "hello": {
      if (msg.role === "participant") {
        const name = String(msg.name ?? "").trim().slice(0, 60);
        const firm = String(msg.firm ?? "").trim().slice(0, 80);
        if (!name) return send(conn.ws, { type: "error", message: "Numele lipsește." });
        let p = msg.id ? state.participants[msg.id] : undefined;
        if (!p) {
          // Same person, new browser / cleared storage: reuse the offline record instead of duplicating.
          const norm = (x: string) => x.trim().toLowerCase();
          p = Object.values(state.participants).find((x) => !x.online && norm(x.name) === norm(name) && norm(x.firm) === norm(firm));
        }
        if (!p) {
          p = {
            id: randomUUID(),
            name,
            firm,
            stepId: null,
            following: true,
            fields: {},
            acts: [],
            stuck: false,
            stuckSince: null,
            online: true,
            lastSeen: Date.now(),
            joinedAt: Date.now(),
          };
          state.participants[p.id] = p;
        } else {
          p.name = name || p.name;
          p.firm = firm || p.firm;
        }
        p.online = true;
        p.lastSeen = Date.now();
        conn.role = "participant";
        conn.participantId = p.id;
        send(conn.ws, { type: "welcome", role: "participant", id: p.id, presenter: state.presenter, me: p });
        pushParticipants();
        return;
      }
      const pin = String(msg.pin ?? "");
      if (pin !== TEACHER_PIN) return send(conn.ws, { type: "error", message: "PIN greșit." });
      conn.role = "teacher";
      send(conn.ws, { type: "welcome", role: "teacher", id: randomUUID(), presenter: state.presenter, participants: participantsList() });
      return;
    }

    case "presenter:set": {
      if (conn.role !== "teacher") return;
      // Serverul nu cunoaște ordinea pașilor; prezentatorul (singurul cu drept de scriere) trimite și limita.
      state.presenter = { stepId: String(msg.stepId), updatedAt: Date.now(), maxStepId: msg.maxStepId ? String(msg.maxStepId) : state.presenter.maxStepId ?? null };
      broadcast({ type: "presenter", presenter: state.presenter });
      scheduleSave();
      return;
    }

    case "participant:update": {
      if (conn.role !== "participant" || !conn.participantId) return;
      const p = state.participants[conn.participantId];
      if (!p) return;
      const { fields, ...rest } = msg.patch ?? {};
      if (typeof rest.stepId === "string" || rest.stepId === null) p.stepId = rest.stepId ?? null;
      if (typeof rest.following === "boolean") p.following = rest.following;
      if (typeof rest.name === "string" && rest.name.trim()) p.name = rest.name.trim().slice(0, 60);
      if (typeof rest.firm === "string") p.firm = rest.firm.trim().slice(0, 80);
      if (typeof rest.stuck === "boolean" && rest.stuck !== p.stuck) {
        p.stuck = rest.stuck;
        p.stuckSince = rest.stuck ? Date.now() : null;
      }
      if (fields && typeof fields === "object") {
        for (const [k, v] of Object.entries(fields)) {
          if (typeof v !== "string") continue;
          if (v === "") delete p.fields[k];
          else p.fields[k] = v.slice(0, FIELD_MAX);
        }
      }
      p.lastSeen = Date.now();
      p.online = true;
      pushParticipants();
      return;
    }

    case "participant:sign": {
      if (conn.role !== "participant" || !conn.participantId) return;
      const p = state.participants[conn.participantId];
      if (!p) return;
      const version = p.acts.length + 1;
      p.acts.push({ version, at: Date.now(), fields: { ...p.fields } });
      if (p.acts.length > ACTS_MAX) p.acts.splice(0, p.acts.length - ACTS_MAX);
      p.lastSeen = Date.now();
      for (const c of participantConns(p.id)) send(c.ws, { type: "me", me: p });
      pushParticipants();
      return;
    }

    case "presenter:reset": {
      if (conn.role !== "teacher") return;
      // De la zero: participanți și poziția prezentatorului.
      state.participants = {};
      state.presenter = { stepId: null, updatedAt: Date.now(), maxStepId: null };
      for (const c of conns) if (c.role === "participant") c.participantId = null;
      broadcast({ type: "presenter", presenter: state.presenter });
      broadcast({ type: "reset" });
      broadcast({ type: "notice", text: "Sesiunea a fost resetată de prezentator. Reintră cu numele tău.", from: "system" }, (c) => c.role === "participant");
      pushParticipants();
      return;
    }
  }
}

// ---------------- http ----------------
const app = express();
app.use(express.json({ limit: "1mb" }));
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    participants: Object.keys(state.participants).length,
    online: Object.values(state.participants).filter((p) => p.online).length,
    presenter: state.presenter,
  });
});

if (PROD) {
  const dist = join(ROOT, "dist");
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(join(dist, "index.html")));
}

const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws) => {
  const conn: Conn = { ws, role: null, participantId: null, alive: true };
  conns.add(conn);
  ws.on("pong", () => (conn.alive = true));
  ws.on("message", (data) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(String(data));
    } catch {
      return;
    }
    try {
      handle(conn, msg);
    } catch (e) {
      console.error("[ws] handler error", e);
    }
  });
  ws.on("close", () => {
    conns.delete(conn);
    if (conn.participantId) {
      const p = state.participants[conn.participantId];
      const stillOpen = participantConns(conn.participantId).length > 0;
      if (p && !stillOpen) {
        p.online = false;
        p.lastSeen = Date.now();
        pushParticipants();
      }
    }
  });
});

// heartbeat: drop dead sockets so presence stays truthful
setInterval(() => {
  for (const c of conns) {
    if (!c.alive) {
      c.ws.terminate();
      continue;
    }
    c.alive = false;
    try {
      c.ws.ping();
    } catch {}
  }
}, 15000);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[server] http://localhost:${PORT}  (ws at /ws)  prod=${PROD}`);
  console.log(`[server] teacher PIN=${TEACHER_PIN}`);
});
