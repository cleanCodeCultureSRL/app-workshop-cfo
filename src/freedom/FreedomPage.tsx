import { useEffect, useRef, useState, type ReactNode } from "react";
import { mount } from "./engine";
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
export function FreedomPage({ id, before, after }: { id: string; before?: ReactNode; after?: ReactNode }) {
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

  return (
    <section className="slide slide-white">
      <div className="slide-in fn-in">
        {before}
        <div className="fn" ref={ref} />
        {after}
      </div>
    </section>
  );
}
