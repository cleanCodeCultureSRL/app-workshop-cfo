// Starea Freedom Number a celui care se uită la slide.
// Participant: obiectul lui, serializat în câmpul `fn.state` (store → localStorage → server, ca orice câmp).
// Prezentator: firma-exemplu (fresh()), ținută în browserul proiectorului; se poate reseta oricând.
import { useSyncExternalStore } from "react";
import { fresh, normalize, type FnState } from "./engine";
import { getState } from "../lib/store";
import { setField } from "../lib/ws";

export const FN_FIELD = "fn.state";

export function parseState(raw: string | null | undefined): FnState {
  if (!raw) return fresh();
  try {
    return normalize(JSON.parse(raw));
  } catch {
    return fresh();
  }
}

// ---------- participant
let pState: FnState | null = null;
/** JSON-ul din store din care a fost construit pState, sau pe care l-am emis noi ultima dată. */
let pRaw: string | null = null;

function prefill(s: FnState) {
  const ses = getState().session;
  if (!s.ctNume && ses?.name) s.ctNume = ses.name;
  if (!s.ctFirma && ses?.firm) s.ctFirma = ses.firm;
}

export function participantState(): FnState {
  const raw = getState().fields[FN_FIELD] ?? null;
  if (pState && raw === pRaw) return pState;
  pState = parseState(raw);
  pRaw = raw;
  if (!raw) prefill(pState);
  return pState;
}

export function persistParticipant(s: FnState) {
  pState = s;
  pRaw = JSON.stringify(s);
  setField(FN_FIELD, pRaw);
}

/** JSON-ul din store nu e al nostru: a venit de pe server (reconectare, alt browser) sau a fost șters (reset). */
export function isForeign(raw: string | null) {
  return raw !== pRaw;
}

export function resetParticipant() {
  const s = fresh();
  prefill(s);
  persistParticipant(s);
  bump();
}

// ---------- prezentator (firma-exemplu)
const DEMO_LS = "fn.demo";
let demo: FnState | null = null;

export function demoState(): FnState {
  if (!demo) {
    try {
      demo = parseState(localStorage.getItem(DEMO_LS));
    } catch {
      demo = fresh();
    }
  }
  return demo;
}

export function persistDemo(s: FnState) {
  demo = s;
  try {
    localStorage.setItem(DEMO_LS, JSON.stringify(s));
  } catch {}
}

export function resetDemo() {
  demo = fresh();
  try {
    localStorage.removeItem(DEMO_LS);
  } catch {}
  bump();
}

// ---------- „generația”: crește când pagina montată trebuie reconstruită de la zero (reset exemplu)
let gen = 0;
const listeners = new Set<() => void>();
function bump() {
  gen++;
  for (const l of listeners) l();
}
export function useGeneration() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => gen,
    () => gen,
  );
}
