import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getState, setState, useStore, type Session } from "../lib/store";
import { connect } from "../lib/ws";
import type { Role } from "../../shared/types";

export function Login() {
  const nav = useNavigate();
  const session = useStore((s) => s.session);
  const conn = useStore((s) => s.conn);
  const error = useStore((s) => s.error);
  const [role, setRole] = useState<Role>("participant");
  const [name, setName] = useState(session?.name ?? "");
  const [firm, setFirm] = useState(session?.firm ?? "");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  // Auto-login from URL (for QR codes / bookmarks):
  //   /?role=participant&name=Ana&firm=Dwelli   /?role=teacher&pin=1234
  // Otherwise resume a stored participant session.
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const r = q.get("role") as Role | null;
    if (r === "participant" || r === "teacher") {
      setRole(r);
      const s: Session =
        r === "participant"
          ? { role: r, id: session?.role === "participant" ? session.id : undefined, name: (q.get("name") ?? session?.name ?? "").trim(), firm: (q.get("firm") ?? session?.firm ?? "").trim() }
          : { role: r, pin: q.get("pin") ?? "" };
      if (r === "participant" && !s.name) return; // show the form prefilled
      if (r !== "participant" && !s.pin) return;
      setState({ session: s, error: null });
      connect(s);
      history.replaceState(null, "", location.pathname);
      nav(r === "participant" ? "/participant" : "/teacher", { replace: true });
      return;
    }
    if (session?.role === "participant" && session.id && conn === "idle") {
      connect(session);
      nav("/participant", { replace: true });
    }
  }, []);

  function go(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    let s: Session;
    if (role === "participant") {
      if (!name.trim()) return setBusy(false);
      s = { role, id: session?.role === "participant" ? session.id : undefined, name: name.trim(), firm: firm.trim() };
    } else {
      s = { role, pin };
    }
    setState({ session: s, error: null });
    connect(s);
    // wait for welcome (participant: me set; teacher: no error after the handshake) or an error
    const t0 = Date.now();
    const iv = window.setInterval(() => {
      const g = getState();
      const ready = g.conn === "open" && (role === "participant" ? !!g.me : Date.now() - t0 > 250 && g.error === null);
      if (g.error) {
        window.clearInterval(iv);
        setBusy(false);
      } else if (ready) {
        window.clearInterval(iv);
        setBusy(false);
        nav(role === "participant" ? "/participant" : "/teacher");
      } else if (Date.now() - t0 > 8000) {
        window.clearInterval(iv);
        setBusy(false);
        setState({ error: "Serverul nu răspunde. Verifică Wi-Fi-ul și adresa." });
      }
    }, 150);
  }

  return (
    <div className="login">
      <div className="login-card">
        <div className="login-brand">
          <img className="brand-logo" src="/logo-cfo.png" alt="CFO" />
          <div>
            <div className="brand-title">Freedom Number</div>
            <div className="brand-sub">Workshop · Contractul cu firma · cfo.ro</div>
          </div>
        </div>
        <div className="roles">
          {(
            [
              ["participant", "Participant", "Urmăresc prezentarea și îmi calculez freedom number-ul meu"],
              ["teacher", "Prezentator", "Conduc slide-urile și văd sala"],
            ] as [Role, string, string][]
          ).map(([r, t, d]) => (
            <button key={r} className={"role" + (role === r ? " active" : "")} onClick={() => setRole(r)} type="button">
              <div className="role-t">{t}</div>
              <div className="role-d">{d}</div>
            </button>
          ))}
        </div>
        <form onSubmit={go} className="login-form">
          {role === "participant" ? (
            <>
              <label>
                Numele tău
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Prenume Nume" autoFocus required />
              </label>
              <label>
                Firma ta
                <input className="input" value={firm} onChange={(e) => setFirm(e.target.value)} placeholder="ex. SC Firma Mea SRL" />
              </label>
            </>
          ) : (
            <label>
              PIN prezentator
              <input className="input" value={pin} onChange={(e) => setPin(e.target.value)} type="password" inputMode="numeric" autoFocus required />
            </label>
          )}
          {error && <div className="lint warn">{error}</div>}
          <button className="btn btn-primary" disabled={busy} type="submit">
            {busy ? "Mă conectez…" : "Intră"}
          </button>
        </form>
        <div className="login-foot">Cifrele tale rămân ale tale: le vede doar prezentatorul, ca să te poată ajuta în sală. Nu se publică nicăieri.</div>
      </div>
    </div>
  );
}
