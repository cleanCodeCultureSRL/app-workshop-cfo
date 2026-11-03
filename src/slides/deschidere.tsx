import { useState, type ReactNode } from "react";
import { Card, CoverSlide, Kicker, Lead } from "./ui";

/** Intro-ul păstrat din „Turnul de Control · Live”, cu textele pentru Freedom Number. */

export function Coperta() {
  return (
    <CoverSlide img="/kickoff.jpg">
      <div className="cover-in">
        <Kicker>Programul · cfo.ro</Kicker>
        <h1>Turnul de Control</h1>
        <h2 style={{ fontWeight: 400 }}>pentru Antreprenori Contabili</h2>
        <Lead className="mt-6">Un program care aliniază direcția personală a antreprenorului cu strategia de business.</Lead>
      </div>
      <Card className="cover-card">
        <div className="stat-l">Cei trei piloni aliniați</div>
        <div className="grid g3 cover-pillars">
          {["Modelul de business", "Modelul financiar", "Modelul de management și date"].map((x) => (
            <div className="stat-v" key={x}>
              {x}
            </div>
          ))}
        </div>
        <div className="grid g4 cover-facts">
          {[
            ["3 luni", "durata programului"],
            ["11 zile", "de întâlniri fizice"],
            ["18", "întâlniri online"],
            ["4", "workshopuri de 2,5 ore"],
          ].map(([v, l]) => (
            <div key={l}>
              <div className="stat-v">{v}</div>
              <div className="stat-l">{l}</div>
            </div>
          ))}
        </div>
      </Card>
    </CoverSlide>
  );
}

export function Multumire() {
  return (
    <CoverSlide img="/multumim.jpg" pos="center top">
      <div className="cover-in">
        <Kicker>Deschidere</Kicker>
        <h1>Îți mulțumim că ești aici!</h1>
        <Lead>Ai lăsat firma o zi ca să lucrezi la ceea ce rareori ajunge în calendar. Pregătește o foaie și un pix.</Lead>
      </div>
      <Card className="cover-card">
        <div className="stat-l">Regula telefoanelor</div>
        <p style={{ margin: 0 }}>Telefoanele se folosesc în afara sălii, pentru apeluri, sau în pauze. În timpul programului, doar pentru calcule.</p>
      </Card>
    </CoverSlide>
  );
}

/** Slide-urile de introducere: același limbaj ca Mulțumirea, cu umbra navy mai densă ca textul mare să domine. */
function Intro({ kicker, ex, title, titleClass, lead, children }: { kicker?: string; ex?: string; title: string; titleClass?: string; lead?: ReactNode; children?: ReactNode }) {
  return (
    <CoverSlide img="/kickoff.jpg" className="intro">
      <div className="cover-in">
        {(ex || kicker) && (
          <Kicker>
            {ex && <span className="extag">Exercițiu · {ex}</span>} {kicker}
          </Kicker>
        )}
        <h1 className={titleClass}>{title}</h1>
        {lead && <Lead>{lead}</Lead>}
      </div>
      {children}
    </CoverSlide>
  );
}

const Handout = ({ children }: { children: ReactNode }) => (
  <p className="intro-hout">
    <b>Hand-out:</b> {children}
  </p>
);

export function Citat() {
  return (
    <Intro kicker="Principala caracteristică a unui antreprenor?" title="„Un antreprenor alege să trăiască așa cum cei mai mulți nu sunt dispuși să o facă, pentru a putea trăi tot restul vieții așa cum aceștia nici nu pot visa.”" titleClass="intro-citat" />
  );
}

export function Obiective() {
  return (
    <Intro kicker="Programul începe aici · Întâlnirea de kick-off" title="Obiectivul tău personal și obiectivul afacerii">
      <div className="grid g3 intro-cards">
        {[
          ["Obiectiv personal", "Freedom number", "Suma de care ai nevoie ca munca să devină o alegere."],
          ["Obiectiv de business", "Destinația afacerii", "Unde trebuie să ajungă firma ca să te ducă acolo."],
          ["Ce le leagă", "Noul Act Constitutiv", "Ce trebuie să-ți ofere firma, în cifre și în clauze."],
        ].map(([k, v, d]) => (
          <Card className="cover-card" key={k}>
            <div className="stat-l">{k}</div>
            <div className="stat-v">{v}</div>
            <p>{d}</p>
          </Card>
        ))}
      </div>
    </Intro>
  );
}

export function Amanat() {
  return (
    <Intro kicker="Deschidere" title="Ce ai amânat în viața ta până când firma îți va permite?" lead="Scrie un singur lucru. Nu îl vede nimeni.">
      <Handout>Foaia de introspecție, întrebarea 1.</Handout>
    </Intro>
  );
}

export function Obtii() {
  return (
    <Intro kicker="Deschidere" title="Azi pleci cu cinci lucruri scrise">
      <Card className="cover-card">
        <ol className="intro-list">
          <li>Rolul firmei în viața ta</li>
          <li>Suma de care ai nevoie</li>
          <li>Vehiculul care te duce acolo</li>
          <li>Ritmul pe care îl poate ține firma</li>
          <li>Noul Act Constitutiv, semnat</li>
        </ol>
      </Card>
    </Intro>
  );
}

export function Regula() {
  return (
    <Intro kicker="Deschidere" title="Ce scrii azi rămâne la tine">
      <Card className="cover-card">
        <ul className="intro-list plain">
          <li>Foaia ta rămâne la tine.</li>
          <li>Răspunsurile tale personale din aplicație rămân pe dispozitivul tău.</li>
          <li>Se salvează doar cifrele și ce intră în Act, ca să le regăsești.</li>
          <li>Ce auzi aici rămâne în această sală.</li>
        </ul>
      </Card>
    </Intro>
  );
}

export function Teza() {
  return (
    <Intro kicker="Deschidere" title="Firma este un instrument. Întâi stabilim la ce îl folosești.">
      <div className="intro-chain">
        {["Viața dorită", "Rolul firmei", "Arhitectura firmei", "Performanța economică"].map((x) => (
          <Card className="cover-card" key={x}>
            {x}
          </Card>
        ))}
      </div>
    </Intro>
  );
}

export function ViataAzi() {
  return (
    <Intro ex="lucrezi singur, 10 minute" kicker="Viața ta" title="Viața ta de azi" lead="Gândește-te la toată viața ta, nu doar la firmă.">
      <div className="grid g2 intro-cards">
        {[
          ["Funcționează", "Ce vrei să nu pierzi?"],
          ["Fragil", "Ce merge azi doar pentru că tu intervii acolo?"],
          ["Nu mai funcționează", "Ce te ține treaz?"],
          ["Prețul", "Ce sacrifici azi pentru firmă și nu mai ești dispus să sacrifici?"],
        ].map(([k, q]) => (
          <Card className="cover-card" key={k}>
            <div className="stat-l">{k}</div>
            <p>{q}</p>
          </Card>
        ))}
      </div>
      <Handout>Foaia de introspecție, întrebările 2-5.</Handout>
    </Intro>
  );
}

export function Perechi() {
  return (
    <Intro
      ex="în perechi, 10 minute în total, câte 5 fiecare"
      title="Găsește Butonul Roșu"
      lead={
        <>
          <span className="intro-dece">De ce-ul</span> care declanșează motivația. Partenerul alege un singur punct de pe foaie.
        </>
      }
    >
      <div className="grid g2 intro-cards">
        <Card className="cover-card">
          <div className="stat-l">Ascultarea empatică</div>
          <p>Asculți ca să înțelegi, nu ca să răspunzi. Nu rezolvi și nu dai sfaturi.</p>
        </Card>
        <Card className="cover-card">
          <div className="stat-l">Întrebarea succesivă</div>
          <p>
            Din fiecare răspuns întrebi din nou: „De ce e important pentru tine?” <span className="intro-max">Maximum de 3 ori.</span>
          </p>
        </Card>
      </div>
      <p className="intro-q">La 5 minute schimbați rolurile.</p>
      <Handout>Cartonașul pentru perechi. Asociații din aceeași firmă lucrează cu altcineva.</Handout>
    </Intro>
  );
}

export function CapitolUrm() {
  return (
    <Intro ex="câte 4 minute, pe hârtie" title="Capitolul următor">
      <div className="grid g2 intro-cards">
        {[
          ["Întrebarea 6", "Dacă peste 10-15 ani munca nu ar mai fi centrul vieții tale, ce ai face cu timpul?"],
          ["Întrebarea 7", "Ce ai vrea să spună despre tine oamenii cu care ai lucrat?"],
        ].map(([k, q]) => (
          <Card className="cover-card" key={k}>
            <div className="stat-l">{k}</div>
            <p>{q}</p>
          </Card>
        ))}
      </div>
      <Handout>Foaia de introspecție, întrebările 6-7. Răspunsurile rămân la tine.</Handout>
    </Intro>
  );
}

export function Calcul() {
  return (
    <Intro title="FREEDOM NUMBER" titleClass="intro-tema">
      <div className="intro-chain">
        {["Timpul pe care îl avem", "Nivelul de trai", "Economiile", "Ce lăsăm în urmă"].map((x) => (
          <Card className="cover-card" key={x}>
            {x}
          </Card>
        ))}
      </div>
    </Intro>
  );
}

export function Pace() {
  return (
    <Intro title="Libertatea">
      <div className="grid g4 intro-cards">
        {[
          ["P", "Prezență", "Timp pentru ce contează"],
          ["A", "Abundență", "Fac ce vreau, fără grija banilor"],
          ["C", "Călătorie", "Iarna la cald, vara acasă"],
          ["E", "Ecou", "Ce rămâne după tine"],
        ].map(([k, v, d]) => (
          <Card className="cover-card" key={k}>
            <div className="intro-acro">{k}</div>
            <div className="stat-v">{v}</div>
            <p>{d}</p>
          </Card>
        ))}
      </div>
    </Intro>
  );
}

export function Ozn() {
  const [on, setOn] = useState(false);
  return (
    <div className="ozn-click" onClick={() => setOn(true)}>
      <CoverSlide img="/ozn.svg" className="ozn">
        <div className="cover-in">
          <h1>
            Banii antreprenorilor stau în
            <span className="ozn-spv">SPV</span>
          </h1>
          <p className={on ? "ozn-sub on" : "ozn-sub"}>Special Purpose Vehicle</p>
        </div>
      </CoverSlide>
    </div>
  );
}

export function Speaker() {
  return (
    <Intro kicker="Cine îți vorbește" title="Sunt ca tine: contabil și antreprenor" lead="Nu vin să te învăț ceva despre cifre. Azi le punem în slujba vieții tale și a firmei tale.">
      <Card className="cover-card intro-who">
        <img src="/alin-vlad.png" alt="Alin Vlad" />
        <div>
          <div className="stat-v">Alin Vlad</div>
          <p>CFO Fracționat &amp; Fondator CFO.ro · 30 de ani la aceeași masă cu antreprenorii</p>
        </div>
      </Card>
    </Intro>
  );
}
