import type { ReactNode } from "react";
import { Amanat, Calcul, CapitolUrm, Citat, Coperta, Multumire, Obiective, Obtii, Ozn, Pace, Perechi, Regula, Speaker, Teza, ViataAzi } from "../slides/deschidere";
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
  { id: "deschidere", title: "Introducere", short: "Introducere" },
  { id: "obiective", title: "Obiectivele tale personale", short: "Obiective" },
  { id: "vehicul", title: "Vehiculul", short: "Vehiculul" },
  { id: "ritm", title: "Ritmul", short: "Ritmul" },
  { id: "cale", title: "Calea ta", short: "Calea" },
  { id: "stadii", title: "Stadii, crize și exituri", short: "Stadii" },
  { id: "an", title: "Primul an antreprenorial", short: "Anul 1" },
  { id: "terms", title: "T.E.R.M.S.", short: "T.E.R.M.S." },
  { id: "act", title: "Actul constitutiv", short: "Actul" },
];

/** Capitolul fiecărei pagini din motor: primul id din fiecare capitol, în ordinea din PAGES. */
const CHAPTER_START: Record<string, string> = {
  amanat: "deschidere", calcul: "obiective", spv: "vehicul", ritm1: "ritm", cai: "cale", stadii: "stadii", anEchipa: "an", tIntro: "terms", contract: "act",
};
/** Paginile în care participantul completează ceva în aplicație. */
const WORK = new Set(["contextZi", "cai", "cale", "curba", "parghii", "viataDorita", "ceCauti", "rolFirma", "qSperanta", "qRetragere", "qAni", "venituri", "buget", "buget1", "buget2", "oneoff", "fonduri", "urma", "freedom", "freedom2", "spv2", "firma", "exitQ", "exitUnde", "multiplu", "multipluDate", "multipluNote", "multipluCalc", "firmaCale", "concluzii", "ritm1", "ritmA", "ritmB", "ritmC", "ritm2", "ritm3", "stadii", "crize", "exitNext", "anEnt", "dest", "plan", "tIntro", "tT", "tE", "tR", "tM", "tS", "contract"]);

export { stepIdOfPage };

/** Primele slide-uri continuă limbajul coperții: cele fără câmpuri sunt slide-uri React, exercițiile rămân pe motor. */
const INTRO: Record<string, ReactNode> = {
  amanat: <Amanat />, obtii: <Obtii />, regula: <Regula />, teza: <Teza />, viataAzi: <ViataAzi />, perechi: <Perechi />, capitolUrm: <CapitolUrm />, calcul: <Calcul />, pace: <Pace />, spv: <Ozn />,
};
const INTRO_WORK = new Set(["viataDorita", "ceCauti", "rolFirma"]);

let chapter = "deschidere";
const pageSteps: Step[] = PAGES.map((p) => {
  chapter = CHAPTER_START[p.id] ?? chapter;
  return {
    id: stepIdOfPage(p.id),
    chapter,
    title: p.t,
    kind: (WORK.has(p.id) ? "work" : "slide") as Step["kind"],
    page: p.id,
    slide: p.id === "contract" ? <ContractStep /> : (INTRO[p.id] ?? <FreedomPage id={p.id} intro={INTRO_WORK.has(p.id)} form={!INTRO_WORK.has(p.id)} />),
  };
});

export const STEPS: Step[] = [
  { id: "fn-coperta", chapter: "deschidere", title: "Turnul de Control", slide: <Coperta /> },
  { id: "fn-multumire", chapter: "deschidere", title: "Îți mulțumim că ești aici!", slide: <Multumire /> },
  { id: "fn-citat", chapter: "deschidere", title: "Principala caracteristică a unui antreprenor", slide: <Citat /> },
  { id: "fn-speaker", chapter: "deschidere", title: "Cine îți vorbește", slide: <Speaker /> },
  { id: "fn-obiective", chapter: "deschidere", title: "Întâlnirea de kick-off", slide: <Obiective /> },
  ...pageSteps,
];

export const STEP_INDEX: Record<string, number> = Object.fromEntries(STEPS.map((s, i) => [s.id, i]));
export const stepById = (id: string | null | undefined) => (id ? STEPS[STEP_INDEX[id]] : undefined);
