import { useMemo } from "react";
import type { Participant } from "../../shared/types";
import { CALE_NUME, RITM_NUME, fmt, summary, type FnSummary } from "../freedom/engine";
import { FN_FIELD, parseState } from "../freedom/state";
import { STEP_INDEX, stepById } from "../content/steps";
import { setState, useStore } from "../lib/store";
import { cx, timeAgo } from "../lib/util";

interface Row {
  p: Participant;
  s: FnSummary | null;
  signed: number;
}

/** Cifrele unui participant se recalculează doar când i se schimbă starea (calc-ul e scump: 3 căi × bisecție). */
const cache = new Map<string, FnSummary>();
function summaryOf(raw: string | undefined): FnSummary | null {
  if (!raw) return null;
  let s = cache.get(raw);
  if (!s) {
    try {
      s = summary(parseState(raw));
    } catch {
      return null;
    }
    if (cache.size > 500) cache.clear();
    cache.set(raw, s);
  }
  return s;
}

const n = (v: number, f: (x: number) => string) => (Number.isFinite(v) ? f(v) : "—");

/** Panoul „Sala” de pe proiector: cifrele fiecărui participant, calculate din starea lui Freedom Number. Tasta S / Esc. */
export function RoomPanel() {
  const participants = useStore((s) => s.participants);
  const presenter = useStore((s) => s.presenter);
  const rows = useMemo<Row[]>(
    () =>
      participants
        .map((p) => ({ p, s: summaryOf(p.fields[FN_FIELD]), signed: p.acts?.length ?? 0 }))
        .sort((a, b) => Number(b.p.online) - Number(a.p.online) || a.p.joinedAt - b.p.joinedAt),
    [participants],
  );
  const online = rows.filter((r) => r.p.online).length;
  const signed = rows.filter((r) => r.signed > 0).length;
  const stuck = rows.filter((r) => r.p.online && r.p.stuck).length;
  const curIdx = presenter.stepId ? STEP_INDEX[presenter.stepId] : -1;
  const close = () => setState({ roomOpen: false });

  return (
    <div className="room-overlay" onClick={close}>
      <div className="room" onClick={(e) => e.stopPropagation()}>
        <div className="room-head">
          <div className="room-title">
            Sala · <b>{online}</b> online din {rows.length}
          </div>
          <div className="room-stats">
            <span className={cx("stat", stuck > 0 && "danger")}>
              <b>{stuck}</b> blocați
            </span>
            <span className="stat">
              <b>{signed}</b> au semnat
            </span>
            <button className="btn btn-ghost" onClick={close} title="Esc">
              ✕
            </button>
          </div>
        </div>
        {rows.length === 0 ? (
          <div className="room-empty">Nimeni în sală încă. Participanții intră cu numele și firma lor de pe pagina de start.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="room-table">
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Pasul</th>
                  <th>Vârste</th>
                  <th className="num">CA azi</th>
                  <th className="num">Dividend net</th>
                  <th className="num">Freedom number</th>
                  <th>Calea</th>
                  <th className="num">CA la retragere</th>
                  <th className="num">Ritm</th>
                  <th>Ritm ales</th>
                  <th>Contract</th>
                  <th>Stare</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const idx = r.p.stepId ? STEP_INDEX[r.p.stepId] : -1;
                  const behind = curIdx >= 0 && idx >= 0 ? curIdx - idx : 0;
                  const s = r.s;
                  const hot = !!s && (Number.isFinite(s.g) ? s.g > 0.3 : true);
                  return (
                    <tr key={r.p.id} className={cx(!r.p.online && "offline", r.p.online && r.p.stuck && "stuck", hot && "hot")}>
                      <td>
                        <div className="room-name">
                          {r.p.name} {r.p.stuck && r.p.online && "✋"}
                        </div>
                        <div className="room-firm">{r.p.firm || "—"}</div>
                      </td>
                      <td>
                        <span className={cx("tag", behind === 0 ? "ok" : behind > 2 ? "danger" : "warn")}>{r.p.stepId ? `${idx + 1}` : "—"}</span> <span className="muted small">{stepById(r.p.stepId)?.title ?? ""}</span>
                      </td>
                      <td className="mono">{s ? `${s.varsta} → ${s.R} → ${s.E}` : "—"}</td>
                      <td className="num">{s ? fmt.shortEur(s.ca) : "—"}</td>
                      <td className="num">{s ? n(s.divNet, fmt.shortEur) : "—"}</td>
                      <td className="num">{s ? n(s.FN, fmt.shortEur) : "—"}</td>
                      <td>{s?.cale ? CALE_NUME[s.cale - 1] : s ? <span className="muted">nealeasă</span> : "—"}</td>
                      <td className="num">{s ? n(s.caR, fmt.shortEur) : "—"}</td>
                      <td className="num" title="ritmul constant cerut de calea aleasă (sau calea 1), după anul 4">{s ? n(s.g, fmt.gfmt) : "—"}</td>
                      <td>{s && s.ritmAles != null ? RITM_NUME[s.ritmAles] : <span className="muted">—</span>}</td>
                      <td>{r.signed > 0 ? <span className="tag signed">v{r.signed}</span> : <span className="muted">—</span>}</td>
                      <td>
                        <span className="muted small">{r.p.online ? "online" : `plecat ${timeAgo(r.p.lastSeen)}`}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
