import { useEffect, useMemo, useState } from "react";
import type { SignedAct } from "../../shared/types";
import { fingerprint, renderContract } from "./engine";
import { FN_FIELD, parseState, participantState } from "./state";
import { FreedomPage } from "./FreedomPage";
import { useSlide } from "../slides/SlideContext";
import { useStore } from "../lib/store";
import { signAct } from "../lib/ws";
import { cx } from "../lib/util";

const fmtDate = (ts: number) => new Date(ts).toLocaleString("ro-RO", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

/**
 * Ultimul pas: Actul din motor, plus semnarea cu versiuni (v1, v2…) salvate pe server.
 * Prezentatorul vede foaia firmei-exemplu, fără semnare.
 */
export function ContractStep() {
  const { mode } = useSlide();
  const participant = mode === "participant";
  const me = useStore((s) => s.me);
  const raw = useStore((s) => s.fields[FN_FIELD] ?? null);
  const acts: SignedAct[] = participant ? (me?.acts ?? []) : [];
  const last = acts[acts.length - 1];
  const [viewing, setViewing] = useState<number | null>(null);
  const changed = useMemo(() => (last ? fingerprint(parseState(last.fields[FN_FIELD])) !== fingerprint(participantState()) : false), [last, raw]);
  const shown = viewing !== null ? acts.find((a) => a.version === viewing) : undefined;
  const html = useMemo(() => (shown ? renderContract(parseState(shown.fields[FN_FIELD])) : ""), [shown]);

  useEffect(() => {
    if (viewing !== null && !shown) setViewing(null);
  }, [viewing, shown]);

  const bar = participant ? (
    <div className="fn noprint">
      <div className="page" style={{ marginTop: 18 }}>
        <div className="panel">
          {acts.length > 0 && (
            <div className="signed" style={{ margin: 0 }}>
              <span>
                <b>Versiunea {last.version}</b> · semnată la {fmtDate(last.at)}
              </span>
              <span className="versions">
                {acts.map((a) => (
                  <button key={a.version} className={cx("vpill", viewing === a.version && "on")} onClick={() => setViewing(viewing === a.version ? null : a.version)}>
                    v{a.version}
                  </button>
                ))}
                <button className={cx("vpill", viewing === null && "on")} onClick={() => setViewing(null)}>
                  {changed ? "cifrele curente" : "curent"}
                </button>
              </span>
            </div>
          )}
          {changed && viewing === null && (
            <p className="verdict no" style={{ fontSize: "1.1rem" }}>
              Ai cifre noi față de v{last.version}.<small>Versiunea {last.version} rămâne vizibilă; semnează v{last.version + 1} ca să le fixezi.</small>
            </p>
          )}
          <div className="eqrow">
            {viewing === null && (acts.length === 0 || changed) && (
              <button className="go" onClick={() => signAct()}>
                {acts.length === 0 ? "Semnează Actul" : `Semnează v${last.version + 1}`}
              </button>
            )}
            <span className="small" style={{ color: "var(--muted)" }}>
              Semnarea îngheață cifrele de acum ca versiune, salvată pe server. Cifre noi înseamnă o versiune nouă; cele vechi rămân vizibile.
            </span>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  if (shown) {
    return (
      <section className="slide slide-white">
        <div className="slide-in fn-in">
          <div className="fn">
            <div className="page">
              <div className="eyebrow">Contractul cu firma · versiunea {shown.version}</div>
              <h1 className="q">Semnat la {fmtDate(shown.at)}</h1>
              <div className="ctwrap">
                <div className="ctdoc" id="ctDoc" dangerouslySetInnerHTML={{ __html: html }} />
              </div>
              <div className="eqrow noprint">
                <button type="button" className="chip" onClick={() => window.print()}>
                  Printează
                </button>
              </div>
            </div>
          </div>
          {bar}
        </div>
      </section>
    );
  }
  return <FreedomPage id="contract" after={bar} />;
}
