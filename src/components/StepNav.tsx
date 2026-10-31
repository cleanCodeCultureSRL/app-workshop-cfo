import { CHAPTERS, STEPS, STEP_INDEX } from "../content/steps";
import { cx } from "../lib/util";

export function StepNav({ currentId, presenterId, maxId, onPick, compact }: { currentId: string | null; presenterId: string | null; /** Ultimul pas deschis; ce e după el apare blocat. */ maxId?: string | null; onPick: (id: string) => void; compact?: boolean }) {
  const curIdx = currentId ? STEP_INDEX[currentId] : -1;
  const maxIdx = maxId === undefined ? Infinity : maxId && maxId in STEP_INDEX ? STEP_INDEX[maxId] : 0;
  return (
    <nav className={cx("stepnav", compact && "compact")}>
      {CHAPTERS.map((ch) => {
        const steps = STEPS.filter((s) => s.chapter === ch.id);
        if (!steps.length) return null;
        const first = STEP_INDEX[steps[0].id];
        const last = STEP_INDEX[steps[steps.length - 1].id];
        const active = curIdx >= first && curIdx <= last;
        return (
          <div key={ch.id} className={cx("nav-ch", active && "active")}>
            <div className="nav-ch-title">{ch.title}</div>
            {steps.map((s) => {
              const locked = STEP_INDEX[s.id] > maxIdx;
              return (
                <button key={s.id} className={cx("nav-step", s.id === currentId && "current", s.id === presenterId && "presenter", s.kind === "work" && "work", locked && "locked")} onClick={() => !locked && onPick(s.id)} disabled={locked} title={locked ? "Se deschide când ajunge prezentatorul aici" : s.title}>
                  <span className="nav-dot" />
                  <span className="nav-label">{s.title}</span>
                  {s.id === presenterId && <span className="nav-live">LIVE</span>}
                  {locked && <span className="nav-lock">🔒</span>}
                </button>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
