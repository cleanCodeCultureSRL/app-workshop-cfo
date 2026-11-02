import { useEffect, useRef, useState, type ReactNode } from "react";
import { mount } from "./engine";
import { CoverSlide } from "../slides/ui";
import { FN_FIELD, demoState, isForeign, participantState, persistDemo, persistParticipant, useGeneration } from "./state";
import { useSlide } from "../slides/SlideContext";
import { useStore } from "../lib/store";
import { goToStep, presenterSet } from "../lib/ws";

export const stepIdOfPage = (pageId: string) => "fn-" + pageId;

/**
 * O pagină din motorul Freedom Number, ca slide.
 * Participant: peste cifrele lui (salvate la fiecare modificare). Prezentator: peste firma-exemplu.
 * Pagina e randată de motor (DOM clasic) în div-ul .fn; React o remontează doar când se schimbă pagina,
 * rolul, sau când starea vine din altă parte (server la reconectare, reset).
 */
export function FreedomPage({ id, before, after, intro, form }: { id: string; before?: ReactNode; after?: ReactNode; intro?: boolean; form?: boolean }) {
  const { mode } = useSlide();
  const participant = mode === "participant";
  const ref = useRef<HTMLDivElement>(null);
  const gen = useGeneration();
  const raw = useStore((s) => (participant ? (s.fields[FN_FIELD] ?? null) : null));
  const [ext, setExt] = useState(0);
  const seen = useRef(raw);

  useEffect(() => {
    if (!participant || raw === seen.current) return;
    seen.current = raw;
    if (isForeign(raw)) setExt((x) => x + 1);
  }, [raw, participant]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const h = mount(el, id, {
      state: participant ? participantState() : demoState(),
      onChange: participant ? persistParticipant : persistDemo,
      navigate: (pid) => (participant ? goToStep(stepIdOfPage(pid), { manual: true }) : presenterSet(stepIdOfPage(pid))),
    });
    return () => h.destroy();
  }, [id, participant, gen, ext]);

  const body = (
    <>
      {before}
      <div className={intro ? "fn fn-dark" : form ? "fn fn-form" : "fn"} ref={ref} />
      {after}
    </>
  );
  // exercițiile din introducere stau pe același fundal ca slide-urile din jurul lor
  if (intro) return <CoverSlide img="/kickoff.jpg" className="intro intro-work">{body}</CoverSlide>;
  return (
    <section className={form ? "slide slide-white slide-form" : "slide slide-white"}>
      <div className="slide-in fn-in">{body}</div>
    </section>
  );
}
