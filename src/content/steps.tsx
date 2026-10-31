import type { ReactNode } from "react";
import { Coperta, Multumire, Speaker } from "../slides/deschidere";
import { FreedomPage, stepIdOfPage } from "../freedom/FreedomPage";
import { ContractStep } from "../freedom/ContractStep";
import { PAGES } from "../freedom/engine";

export interface Chapter {
  id: string;
  title: string;
  short: string;
}

export interface Step {
  id: string; // singurul lucru pe care îl vede serverul
  chapter: string;
  title: string;
  /** "work" = ecran cu câmpuri pentru participant */
  kind?: "slide" | "work";
  /** id-ul paginii din motorul Freedom Number (lipsește la slide-urile de deschidere) */
  page?: string;
  slide: ReactNode;
}

export const CHAPTERS: Chapter[] = [
  { id: "deschidere", title: "Deschidere", short: "Deschidere" },
  { id: "timp", title: "Timpul pe care îl avem", short: "Timpul" },
  { id: "firma", title: "Firma azi", short: "Firma" },
  { id: "sume", title: "Cele trei sume", short: "Sumele" },
  { id: "cai", title: "Trei căi către freedom number", short: "Căile" },
  { id: "ritm", title: "Ritmul firmei", short: "Ritmul" },
  { id: "an", title: "Anul antreprenorial", short: "Anul 1" },
  { id: "terms", title: "Contractul cu firma · T.E.R.M.S.", short: "Contractul" },
];

/** Capitolul fiecărei pagini din motor; ordinea paginilor e cea din PAGES (ca în HTML). */
const CHAPTER_OF: Record<string, string> = {
  qSperanta: "timp", qRetragere: "timp", qAni: "timp", timp: "timp",
  firma: "firma",
  buget: "sume", oneoff: "sume", fonduri: "sume", productivi: "sume", freedom: "sume",
  cai1: "cai", cai2: "cai", cai3: "cai", cale1: "cai", multiplu: "cai", cale2: "cai", cale3: "cai", concluzii: "cai",
  ritm1: "ritm", ritmA: "ritm", ritmB: "ritm", ritmC: "ritm", ritm2: "ritm", ritm3: "ritm",
  munte: "an", anEnt: "an", dest: "an", plan: "an",
  tIntro: "terms", tIntro2: "terms", tT: "terms", tE: "terms", tR: "terms", tM: "terms", tS: "terms", contract: "terms",
};
/** Paginile în care participantul completează ceva. */
const WORK = new Set(["qSperanta", "qRetragere", "qAni", "firma", "buget", "oneoff", "fonduri", "freedom", "multiplu", "cale3", "concluzii", "ritm1", "ritmA", "ritmB", "ritmC", "ritm2", "ritm3", "dest", "plan", "tIntro", "tT", "tE", "tR", "tM", "tS", "contract"]);

export { stepIdOfPage };

export const STEPS: Step[] = [
  { id: "fn-coperta", chapter: "deschidere", title: "Freedom Number", slide: <Coperta /> },
  { id: "fn-multumire", chapter: "deschidere", title: "Mulțumim că ai venit", slide: <Multumire /> },
  { id: "fn-speaker", chapter: "deschidere", title: "Cine îți vorbește", slide: <Speaker /> },
  ...PAGES.map((p) => ({
    id: stepIdOfPage(p.id),
    chapter: CHAPTER_OF[p.id] ?? "sume",
    title: p.t,
    kind: (WORK.has(p.id) ? "work" : "slide") as Step["kind"],
    page: p.id,
    slide: p.id === "contract" ? <ContractStep /> : <FreedomPage id={p.id} />,
  })),
];

export const STEP_INDEX: Record<string, number> = Object.fromEntries(STEPS.map((s, i) => [s.id, i]));
export const stepById = (id: string | null | undefined) => (id ? STEPS[STEP_INDEX[id]] : undefined);
