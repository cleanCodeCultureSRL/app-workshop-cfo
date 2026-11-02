import { useEffect, useState } from "react";
import { control, fresh, normalize } from "../freedom/engine";

/** Tabelul de control al prezentatorului: se citește din firma-exemplu din acest browser. */
function read() {
  try {
    const raw = localStorage.getItem("fn.demo");
    return control(raw ? normalize(JSON.parse(raw)) : fresh());
  } catch {
    return control(fresh());
  }
}

export function Control() {
  const [data, setData] = useState(read);
  useEffect(() => {
    const again = () => setData(read());
    window.addEventListener("focus", again);
    window.addEventListener("storage", again);
    return () => {
      window.removeEventListener("focus", again);
      window.removeEventListener("storage", again);
    };
  }, []);
  return (
    <main className="ctl">
      <h1>Tabel de control</h1>
      <p>Datele din Exemplul din acest browser. Se actualizează când revii pe această filă.</p>
      {data.chk.length > 0 && (
        <section className="ctl-chk">
          <h2>De verificat</h2>
          <ul>
            {data.chk.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </section>
      )}
      {data.secs.map((s) => (
        <section key={s.t}>
          <h2>{s.t}</h2>
          <table>
            <thead>
              <tr>
                <th>Cifra</th>
                <th>Valoare</th>
                <th>De unde vine</th>
                <th>Pagina</th>
              </tr>
            </thead>
            <tbody>
              {s.rows.map((r) => (
                <tr key={r.n} className={r.w ? "ctl-w" : undefined}>
                  <td>{r.n}</td>
                  <td>{r.v}</td>
                  <td>{r.f}</td>
                  <td>{r.p}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </main>
  );
}
