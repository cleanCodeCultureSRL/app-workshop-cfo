// Tipurile modulului engine.js (portul motorului „Freedom Number”). Starea e un obiect mutabil, cu cheile din DEF-ul prototipului.

export interface FnPage {
  id: string;
  t: string;
}

export type FnState = Record<string, unknown> & {
  ca: number;
  alegere: number | null;
  ritmAles: number | null;
  valMetoda: string;
  ctNume: string;
  ctFirma: string;
  ctLoc: string;
};

/** Cifrele-cheie ale unui participant (pentru panoul „Sala”). NaN unde nu se poate calcula. */
export interface FnSummary {
  varsta: number;
  R: number;
  E: number;
  ca: number;
  marja: number;
  divNet: number;
  FN: number;
  cale: number | null;
  caR: number;
  g: number;
  g1: number;
  X: number;
  ritmAles: number | null;
  metoda: string;
  M0: number;
  MT: number;
}

export interface MountOpts {
  /** Starea peste care lucrează pagina; e modificată pe loc. */
  state: FnState;
  /** Chemat la fiecare modificare a stării. */
  onChange?: (s: FnState) => void;
  /** „Vezi calculul”, „Lucrează la factori”: pagina (id din PAGES) la care vrea să sară. */
  navigate?: (pageId: string) => void;
}

export interface MountHandle {
  refresh(): void;
  destroy(): void;
}

export const PAGES: FnPage[];
export function fresh(): FnState;
export function normalize(raw: unknown): FnState;
export function calc(s: FnState): Record<string, unknown>;
export function mount(el: HTMLElement, pageId: string, opts: MountOpts): MountHandle;
export function renderContract(s: FnState): string;
export function fingerprint(s: FnState): string;
export function splitPrivate(s: FnState): { pub: FnState; priv: Record<string, unknown> };
export function mergePrivate(s: FnState, priv: unknown): FnState;
export function summary(s: FnState): FnSummary;
export function control(s: FnState): { secs: { t: string; rows: { n: string; v: string; f: string; p: string; w: boolean }[] }[]; chk: string[] };
export const fmt: {
  eur(n: number): string;
  shortEur(n: number): string;
  pct(x: number): string;
  ani(n: number): string;
  gfmt(g: number): string;
  xfmt(x: number): string;
  nf0: Intl.NumberFormat;
  nf2: Intl.NumberFormat;
};
export const CALE_NUME: string[];
export const RITM_NUME: string[];
