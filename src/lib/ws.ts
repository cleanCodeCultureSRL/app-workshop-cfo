import type { ClientMessage, ServerMessage } from "../../shared/types";
import { getState, setState, pushNotice, clearSession, type Session } from "./store";
import { STEPS, STEP_INDEX } from "../content/steps";

/** Indexul celui mai avansat pas deschis de prezentator; fără prezentator, nimic nu e deschis dincolo de primul pas. */
export function maxOpenIndex(): number {
  const m = getState().presenter.maxStepId;
  return m && m in STEP_INDEX ? STEP_INDEX[m] : 0;
}

/** Participantul nu poate trece de pasul maxim atins de prezentator. */
export function clampStepId(stepId: string | null | undefined): string | null {
  if (!stepId || !(stepId in STEP_INDEX)) return stepId ?? null;
  const max = maxOpenIndex();
  return STEP_INDEX[stepId] > max ? STEPS[max].id : stepId;
}

let ws: WebSocket | null = null;
let retry = 0;
let retryTimer: number | null = null;
let currentSession: Session | null = null;
let pendingFields: Record<string, string> = {};
let fieldTimer: number | null = null;
let manuallyClosed = false;

// În dev, HMR reevaluează modulul și pierde socketul, iar butoanele ar trimite în gol: reîncărcăm pagina.
if (import.meta.hot) {
  if (import.meta.hot.data.loaded) location.reload();
  import.meta.hot.data.loaded = true;
}

function url() {
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${location.host}/ws`;
}

export function send(msg: ClientMessage) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

function hello(s: Session) {
  if (s.role === "participant") {
    send({ type: "hello", role: "participant", id: s.id, name: s.name ?? "", firm: s.firm ?? "" });
  } else {
    send({ type: "hello", role: "teacher", pin: s.pin ?? "" });
  }
}

export function connect(session: Session) {
  currentSession = session;
  manuallyClosed = false;
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    ws.close();
  }
  setState({ conn: "connecting", error: null });
  const sock = new WebSocket(url());
  ws = sock;
  sock.onopen = () => {
    if (ws !== sock) return;
    retry = 0;
    setState({ conn: "open" });
    if (currentSession) hello(currentSession);
  };
  sock.onmessage = (ev) => {
    if (ws !== sock) return;
    let msg: ServerMessage;
    try {
      msg = JSON.parse(ev.data);
    } catch {
      return;
    }
    handle(msg);
  };
  sock.onclose = () => {
    // Un socket înlocuit de un connect() mai nou (ex. dublul mount din React StrictMode) nu mai are voie
    // să programeze o reconectare - altfel închide socketul nou și intră într-o buclă de reconectări.
    if (ws !== sock) return;
    setState({ conn: "closed" });
    if (manuallyClosed) return;
    const delay = Math.min(10000, 500 * 2 ** retry++);
    if (retryTimer) window.clearTimeout(retryTimer);
    retryTimer = window.setTimeout(() => currentSession && connect(currentSession), delay);
  };
  sock.onerror = () => {
    /* onclose follows */
  };
}

export function disconnect() {
  manuallyClosed = true;
  if (retryTimer) window.clearTimeout(retryTimer);
  ws?.close();
  ws = null;
  currentSession = null;
}

function handle(msg: ServerMessage) {
  const s = getState();
  switch (msg.type) {
    case "welcome": {
      const patch: Partial<typeof s> = { presenter: msg.presenter, error: null };
      if (msg.role === "participant" && msg.me) {
        // merge: local values win, server fills gaps (e.g. cleared localStorage) - dar nu învie ce a șters participantul
        const merged: Record<string, string> = { ...s.fields };
        for (const [k, v] of Object.entries(msg.me.fields)) if (!(k in merged) && !(k in s.deleted)) merged[k] = v;
        patch.me = msg.me;
        patch.fields = merged;
        patch.stuck = msg.me.stuck;
        patch.session = { ...(s.session as Session), id: msg.me.id, name: msg.me.name, firm: msg.me.firm };
        setState({ presenter: msg.presenter });
        const view = clampStepId(s.viewStepId ?? msg.presenter.stepId);
        patch.viewStepId = view;
        patch.following = s.following;
        setState(patch);
        // push anything the server doesn't have yet, and delete on the server what was deleted here
        const diff: Record<string, string> = {};
        for (const [k, v] of Object.entries(merged)) if (msg.me.fields[k] !== v) diff[k] = v;
        for (const k of Object.keys(s.deleted)) if (msg.me.fields[k] !== undefined) diff[k] = "";
        send({
          type: "participant:update",
          patch: { stepId: view, following: s.following, fields: Object.keys(diff).length ? diff : undefined },
        });
      } else {
        patch.participants = msg.participants ?? [];
        setState(patch);
        // Prima sesiune, fără niciun pas setat pe server: prezentatorul pornește de la început.
        if (msg.role === "teacher" && !msg.presenter.stepId) presenterSet(STEPS[0].id);
      }
      return;
    }
    case "error":
      setState({ error: msg.message });
      return;
    case "presenter": {
      const st = getState();
      const patch: Partial<typeof st> = { presenter: msg.presenter };
      if (st.session?.role === "participant" && st.following && msg.presenter.stepId) {
        patch.viewStepId = msg.presenter.stepId;
        send({ type: "participant:update", patch: { stepId: msg.presenter.stepId } });
      }
      setState(patch);
      // sesiune resetată sau limită retrasă: participantul care se uita mai departe e adus înapoi
      if (st.session?.role === "participant" && !st.following) {
        const clamped = clampStepId(getState().viewStepId);
        if (clamped && clamped !== getState().viewStepId) goToStep(clamped, { manual: true });
      }
      return;
    }
    case "participants":
      setState({ participants: msg.participants });
      return;
    case "me":
      setState({ me: msg.me, stuck: msg.me.stuck });
      return;
    case "notice":
      pushNotice(msg.text, msg.from, "warn", 0);
      return;
    case "reset": {
      // Sesiune de la zero. Participant: uită tot ce a scris (și din localStorage) și reintră cu numele.
      pendingFields = {};
      try {
        localStorage.removeItem("fn.private");
      } catch {}
      const role = getState().session?.role;
      setState({ fields: {}, deleted: {}, viewStepId: null, following: true, stuck: false, participants: [], me: null });
      if (role === "participant") {
        disconnect();
        clearSession();
      } else if (role === "teacher") {
        presenterSet(STEPS[0].id);
      }
      return;
    }
    case "pong":
      return;
  }
}

// ---------- participant helpers ----------
function flushFields() {
  if (fieldTimer) window.clearTimeout(fieldTimer);
  fieldTimer = null;
  if (!Object.keys(pendingFields).length) return;
  const f = pendingFields;
  pendingFields = {};
  send({ type: "participant:update", patch: { fields: f } });
}
function queueField(id: string, value: string) {
  pendingFields[id] = value;
  if (fieldTimer) window.clearTimeout(fieldTimer);
  fieldTimer = window.setTimeout(flushFields, 350);
}
// la reload / închidere, nu pierdem ultima editare din fereastra de debounce
if (typeof window !== "undefined") window.addEventListener("pagehide", flushFields);

export function setField(id: string, value: string) {
  if (value === "") return clearField(id);
  setState((s) => {
    if (!(id in s.deleted)) return { fields: { ...s.fields, [id]: value } };
    const { [id]: _undelete, ...deleted } = s.deleted;
    return { fields: { ...s.fields, [id]: value }, deleted };
  });
  queueField(id, value);
}

/** Șterge ce a scris participantul la un câmp: local dispare cheia, serverul o șterge la valoarea goală. */
export function clearField(id: string) {
  setState((s) => {
    const { [id]: _drop, ...rest } = s.fields;
    return { fields: rest, deleted: { ...s.deleted, [id]: Date.now() } };
  });
  queueField(id, "");
}

/** Semnează actul: întâi trimitem ce e încă în debounce, apoi cerem serverului să înghețe versiunea. */
export function signAct() {
  flushFields();
  send({ type: "participant:sign" });
}

export function goToStep(stepId: string, opts: { manual?: boolean } = {}) {
  const s = getState();
  if (s.session?.role === "participant") {
    const clamped = clampStepId(stepId);
    if (clamped && clamped !== stepId) {
      pushNotice("Pasul ăsta nu e deschis încă - prezentatorul n-a ajuns acolo.", "app", "warn", 1500);
      stepId = clamped;
    }
  }
  const following = opts.manual ? stepId === s.presenter.stepId : s.following;
  setState({ viewStepId: stepId, following });
  if (s.session?.role === "participant") send({ type: "participant:update", patch: { stepId, following } });
}

export function followPresenter() {
  const s = getState();
  const stepId = s.presenter.stepId;
  setState({ following: true, viewStepId: stepId ?? s.viewStepId });
  if (s.session?.role === "participant") send({ type: "participant:update", patch: { following: true, stepId: stepId ?? undefined } });
}

export function setStuck(stuck: boolean) {
  setState({ stuck });
  send({ type: "participant:update", patch: { stuck } });
}

export function presenterSet(stepId: string) {
  // limita crește doar înainte: dacă prezentatorul se întoarce, participanții păstrează accesul până unde s-a ajuns
  const cur = getState().presenter.maxStepId;
  const curIdx = cur && cur in STEP_INDEX ? STEP_INDEX[cur] : -1;
  const maxStepId = STEP_INDEX[stepId] > curIdx ? stepId : cur;
  send({ type: "presenter:set", stepId, maxStepId });
}
