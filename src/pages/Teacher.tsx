import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StepNav } from "../components/StepNav";
import { RoomPanel } from "../components/RoomPanel";
import { CHAPTERS, STEPS, STEP_INDEX, stepById } from "../content/steps";
import { clearSession, setState, useStore } from "../lib/store";
import { connect, disconnect, presenterSet, send } from "../lib/ws";
import { cx } from "../lib/util";
import { SlideContext } from "../slides/SlideContext";
import PresentationNav from "../slides/PresentationNav";
import { loadExample, resetDemo } from "../freedom/state";

const BAR_HIDE_MS = 3000;

/** Ecranul proiectat: slide-ul pe tot ecranul, cu firma-exemplu (interactivă, ca să poți arăta „ce se întâmplă dacă”). Bara de control apare la mișcarea mouse-ului; S deschide „Sala”. */
export function Teacher() {
  const nav = useNavigate();
  const session = useStore((s) => s.session);
  const conn = useStore((s) => s.conn);
  const error = useStore((s) => s.error);
  const presenter = useStore((s) => s.presenter);
  const participants = useStore((s) => s.participants);
  const roomOpen = useStore((s) => s.roomOpen);
  const [grid, setGrid] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [barOn, setBarOn] = useState(true);
  const hideTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!session || session.role !== "teacher") {
      nav("/", { replace: true });
      return;
    }
    if (conn === "idle") connect(session);
  }, [session?.role]);

  useEffect(() => {
    if (error) {
      disconnect();
      clearSession();
      nav("/", { replace: true });
    }
  }, [error]);

  const step = useMemo(() => stepById(presenter.stepId) ?? STEPS[0], [presenter.stepId]);
  const idx = STEP_INDEX[step.id];

  function go(i: number) {
    const s = STEPS[Math.max(0, Math.min(STEPS.length - 1, i))];
    if (s) presenterSet(s.id);
  }

  function wake() {
    setBarOn(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setBarOn(false), BAR_HIDE_MS);
  }

  useEffect(() => {
    wake();
    window.addEventListener("mousemove", wake);
    return () => {
      window.removeEventListener("mousemove", wake);
      window.clearTimeout(hideTimer.current);
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        go(idx + 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        go(idx - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        go(0);
      } else if (e.key === "End") {
        e.preventDefault();
        go(STEPS.length - 1);
      } else if (e.key.toLowerCase() === "g") setGrid((g) => !g);
      else if (e.key.toLowerCase() === "s") setState((s) => ({ roomOpen: !s.roomOpen }));
      else if (e.key === "Escape") {
        setGrid(false);
        setNavOpen(false);
        setState({ roomOpen: false });
      } else if (e.key.toLowerCase() === "b") setBarOn((b) => !b);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx]);

  const online = participants.filter((p) => p.online);
  // Cei blocați, cu cel care așteaptă de cel mai mult timp primul: pe el îl iei întâi.
  const stuck = online.filter((p) => p.stuck).sort((a, b) => (a.stuckSince ?? 0) - (b.stuckSince ?? 0));
  const here = online.filter((p) => p.stepId === step.id);
  const behind = online.filter((p) => p.stepId && STEP_INDEX[p.stepId] < idx);
  const signed = participants.filter((p) => (p.acts?.length ?? 0) > 0);

  if (!session) return null;

  return (
    <div className="teacher">
      <div className="deck deck-stage" key={step.id}>
        <SlideContext.Provider value={{ mode: "teacher", stepId: step.id }}>{step.slide}</SlideContext.Provider>
      </div>
      <PresentationNav />

      {navOpen && (
        <>
          <div className="scrim-teacher" onClick={() => setNavOpen(false)} />
          <aside className="sidebar teacher-side">
            <StepNav currentId={step.id} presenterId={presenter.stepId} onPick={(id) => presenterSet(id)} compact />
          </aside>
        </>
      )}

      {roomOpen && <RoomPanel />}

      <footer className={cx("teacher-bar", !barOn && "is-hidden")} onMouseEnter={wake}>
        <div className="tb-left">
          <button className="btn btn-ghost" onClick={() => setNavOpen((o) => !o)}>
            ☰
          </button>
          <button className="btn btn-ghost" onClick={() => go(idx - 1)} disabled={idx === 0}>
            ←
          </button>
          <span className="mono">
            {idx + 1} / {STEPS.length}
          </span>
          <button className="btn btn-ghost" onClick={() => go(idx + 1)} disabled={idx === STEPS.length - 1}>
            →
          </button>
          <span className="muted">{CHAPTERS.find((c) => c.id === step.chapter)?.short}</span>
          <span className="muted small" title="Participanții pot vedea doar până aici">
            deschis până la {presenter.maxStepId && presenter.maxStepId in STEP_INDEX ? STEP_INDEX[presenter.maxStepId] + 1 : idx + 1}
          </span>
        </div>
        <div className="tb-mid">
          <span className="stat">
            <b>{online.length}</b> online
          </span>
          <span className="stat">
            <b>{here.length}</b> pe acest pas
          </span>
          <span className={cx("stat", behind.length > 0 && "warn")}>
            <b>{behind.length}</b> în urmă
          </span>
          <span className="stat">
            <b>{signed.length}</b> au semnat
          </span>
          <span className={cx("stat", stuck.length > 0 && "danger stat-stuck")}>
            <b>{stuck.length}</b> blocați
            {stuck.length > 0 && (
              <>
                :{" "}
                {stuck.map((p, i) => (
                  <span key={p.id}>
                    {i > 0 && ", "}
                    <b>{p.name}</b>
                  </span>
                ))}
              </>
            )}
          </span>
        </div>
        <div className="tb-right">
          <button className={cx("btn btn-ghost", roomOpen && "is-on")} onClick={() => setState((s) => ({ roomOpen: !s.roomOpen }))} title="S">
            Sala
          </button>
          <button className="btn btn-ghost" onClick={() => setGrid(true)} title="G">
            Toate
          </button>
          <a className="btn btn-ghost" href="/control" target="_blank" rel="noreferrer">
            Control
          </a>
          <button
            className="btn btn-ghost"
            title="Încarcă exemplul complet, pentru repetiții (participanții nu sunt atinși)"
            onClick={() => {
              if (confirm("Încarci exemplul complet?\n\nCifrele tale de pe proiector se înlocuiesc. Participanții nu sunt atinși.")) loadExample();
            }}
          >
            Exemplul
          </button>
          <button
            className="btn btn-ghost"
            title="Golește cifrele de pe proiector (participanții nu sunt atinși)"
            onClick={() => {
              if (confirm("Golești cifrele de pe proiector?\n\nParticipanții nu sunt atinși.")) resetDemo();
            }}
          >
            Golește
          </button>
          <span className={cx("conn", conn)} />
          <button
            className="link danger"
            title="Sesiune nouă, de la zero"
            onClick={() => {
              if (confirm("Resetezi sesiunea de la zero?\n\n• Toți participanții sunt șterși (cu cifrele și contractele lor) și reintră cu numele lor.\n• Prezentarea revine la primul slide.")) send({ type: "presenter:reset" });
            }}
          >
            reset
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
      </footer>

      {grid && (
        <div className="grid-overlay" onClick={() => setGrid(false)}>
          <div className="step-grid" onClick={(e) => e.stopPropagation()}>
            {CHAPTERS.map((ch) => (
              <div key={ch.id} className="grid-ch">
                <div className="grid-ch-title">{ch.title}</div>
                <div className="grid-steps">
                  {STEPS.filter((s) => s.chapter === ch.id).map((s) => (
                    <button
                      key={s.id}
                      className={cx("grid-step", s.id === step.id && "current")}
                      onClick={() => {
                        presenterSet(s.id);
                        setGrid(false);
                      }}
                    >
                      <span className="mono">{STEP_INDEX[s.id] + 1}</span> {s.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
