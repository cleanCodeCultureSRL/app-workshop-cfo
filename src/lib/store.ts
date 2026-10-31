import { useSyncExternalStore } from "react";
import type { Participant, PresenterState, Role } from "../../shared/types";

export interface Session {
  role: Role;
  id?: string;
  name?: string;
  firm?: string;
  pin?: string;
}

export interface Notice {
  id: number;
  text: string;
  from: "system" | "app";
  tone?: "info" | "ok" | "warn";
}

export interface State {
  conn: "idle" | "connecting" | "open" | "closed";
  error: string | null;
  session: Session | null;
  presenter: PresenterState;
  me: Participant | null;
  participants: Participant[];
  notices: Notice[];
  fields: Record<string, string>;
  /** Câmpuri șterse de participant (id → când). La reconectare, serverul nu le mai învie; îi cerem și lui să le șteargă. */
  deleted: Record<string, number>;
  viewStepId: string | null;
  following: boolean;
  stuck: boolean;
  /** Panoul „Sala” de pe proiector. */
  roomOpen: boolean;
}

const LS = {
  session: "tdc.session",
  fields: "tdc.fields",
  deleted: "tdc.deleted",
  view: "tdc.view",
};

function read<T>(k: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}

let state: State = {
  conn: "idle",
  error: null,
  session: read<Session | null>(LS.session, null),
  presenter: { stepId: null, updatedAt: 0, maxStepId: null },
  me: null,
  participants: [],
  notices: [],
  fields: read<Record<string, string>>(LS.fields, {}),
  deleted: read<Record<string, number>>(LS.deleted, {}),
  viewStepId: read<string | null>(LS.view, null),
  following: true,
  stuck: false,
  roomOpen: false,
};

const listeners = new Set<() => void>();
function emit() {
  for (const l of listeners) l();
}

export function getState() {
  return state;
}
export function setState(patch: Partial<State> | ((s: State) => Partial<State>)) {
  const p = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...p };
  if ("session" in p) write(LS.session, state.session);
  if ("fields" in p) write(LS.fields, state.fields);
  if ("deleted" in p) write(LS.deleted, state.deleted);
  if ("viewStepId" in p) write(LS.view, state.viewStepId);
  emit();
}
export function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => sel(state), () => sel(state));
}

let noticeSeq = 1;
export function pushNotice(text: string, from: Notice["from"] = "app", tone: Notice["tone"] = "info", ttl = 6000) {
  const id = noticeSeq++;
  setState((s) => ({ notices: [...s.notices, { id, text, from, tone }] }));
  if (ttl > 0) setTimeout(() => dismissNotice(id), ttl);
  return id;
}
export function dismissNotice(id: number) {
  setState((s) => ({ notices: s.notices.filter((n) => n.id !== id) }));
}

export function clearSession() {
  setState({ session: null, me: null, participants: [], conn: "idle", error: null, stuck: false });
}
