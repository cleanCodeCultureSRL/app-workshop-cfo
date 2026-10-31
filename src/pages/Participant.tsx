import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StepNav } from "../components/StepNav";
import { STEPS, STEP_INDEX, stepById } from "../content/steps";
import { clearSession, pushNotice, useStore } from "../lib/store";
import { connect, disconnect, followPresenter, goToStep, maxOpenIndex, setStuck } from "../lib/ws";
import { cx } from "../lib/util";
import { SlideContext } from "../slides/SlideContext";
import PresentationNav from "../slides/PresentationNav";
import { resetParticipant } from "../freedom/state";

/** Ecranul participantului: același slide ca pe proiector, cu cifrele lui. Bara de jos e mereu vizibilă; meniul lateral doar la cerere. */
export function Participant() {
  const nav = useNavigate();
  const session = useStore((s) => s.session);
  const conn = useStore((s) => s.conn);
  const presenter = useStore((s) => s.presenter);
  const viewId = useStore((s) => s.viewStepId);
  const following = useStore((s) => s.following);
  const stuck = useStore((s) => s.stuck);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!session || session.role !== "participant") {
      nav("/", { replace: true });
      return;
    }
    if (conn === "idle") connect(session);
  }, [session?.role]);

  const step = useMemo(() => stepById(viewId) ?? stepById(presenter.stepId) ?? STEPS[0], [viewId, presenter.stepId]);
  const idx = STEP_INDEX[step.id];
  const prev = STEPS[idx - 1];
  const next = STEPS[idx + 1];
  const behind = presenter.stepId && !following ? STEP_INDEX[presenter.stepId] - idx : 0;
  const maxIdx = maxOpenIndex();
  const nextOpen = !!next && idx + 1 <= maxIdx;

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setNavOpen(false);
  }, [step.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        if (nextOpen) goToStep(next.id, { manual: true });
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        if (prev) goToStep(prev.id, { manual: true });
      } else if (e.key === "Escape") setNavOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, nextOpen]);

  if (!session) return null;

  return (
    <div className={cx("participant", stuck && "is-stuck")}>
      {stuck && (
        <div className="stuck-bar" role="status">
          <span className="stuck-bar-text">✋ SUNT BLOCAT · prezentatorul te vede</span>
          <button className="stuck-bar-cancel" onClick={() => setStuck(false)}>
            am rezolvat · anulează
          </button>
        </div>
      )}
      <div className="deck deck-fill" key={step.id}>
        <SlideContext.Provider value={{ mode: "participant", stepId: step.id }}>{step.slide}</SlideContext.Provider>
      </div>
      <PresentationNav />

      {navOpen && (
        <>
          <div className="scrim-teacher" onClick={() => setNavOpen(false)} />
          <aside className="sidebar side-drawer">
            <div className="sidebar-head">
              <img className="sidebar-logo" src="/logo-cfo.png" alt="CFO" />
              <div className="sidebar-who">
                <div className="who-name">{session.name}</div>
                <div className="who-firm">{session.firm || "—"}</div>
              </div>
              <button className="btn btn-ghost" onClick={() => setNavOpen(false)} title="Închide">
                ✕
              </button>
            </div>
            <StepNav currentId={step.id} presenterId={presenter.stepId} maxId={presenter.maxStepId} onPick={(id) => goToStep(id, { manual: true })} />
            <div className="sidebar-foot">
              <button
                className="link"
                title="Șterge toate cifrele tale și pornește din nou de la firma-exemplu"
                onClick={() => {
                  if (confirm("Ștergi toate cifrele tale și pornești din nou de la firma-exemplu?")) {
                    resetParticipant();
                    pushNotice("Ai pornit din nou de la firma-exemplu.", "app", "ok");
                    setNavOpen(false);
                  }
                }}
              >
                reîncarcă exemplul
              </button>
              <button
                className="link"
                onClick={() => {
                  disconnect();
                  clearSession();
                  nav("/");
                }}
              >
                ieși
              </button>
            </div>
          </aside>
        </>
      )}

      <footer className="control-bar noprint">
        <div className="tb-left">
          <button className="btn btn-ghost" onClick={() => setNavOpen((o) => !o)} title="Pașii">
            ☰
          </button>
          <button className="btn btn-ghost" onClick={() => prev && goToStep(prev.id, { manual: true })} disabled={!prev}>
            ←
          </button>
          <span className="mono">
            {idx + 1} / {STEPS.length}
          </span>
          <button className="btn btn-ghost" onClick={() => nextOpen && goToStep(next.id, { manual: true })} disabled={!nextOpen} title={next && !nextOpen ? "Se deschide când ajunge prezentatorul aici" : undefined}>
            {next && !nextOpen ? "🔒" : "→"}
          </button>
        </div>
        <div className="tb-mid">
          {following ? (
            <span className="pill pill-live">● Urmăresc prezentatorul</span>
          ) : (
            <button className="pill pill-back" onClick={followPresenter}>
              ↩ Revino la prezentator {behind > 0 ? `(ești cu ${behind} în urmă)` : behind < 0 ? `(ești cu ${-behind} înainte)` : ""}
            </button>
          )}
        </div>
        <div className="tb-right">
          <button className={cx("btn", stuck ? "btn-danger" : "btn-outline")} onClick={() => setStuck(!stuck)}>
            {stuck ? "✋ Blocat · anulează" : "✋ Sunt blocat"}
          </button>
          <span className={cx("conn", conn)} title={conn === "open" ? "conectat" : "reconectez…"} />
        </div>
      </footer>
    </div>
  );
}
