import { Card, CoverSlide, Kicker, Lead, Note, Slide, Todo } from "./ui";

/** Intro-ul păstrat din „Turnul de Control · Live”, cu textele pentru Freedom Number. */

export function Coperta() {
  return (
    <CoverSlide img="/kickoff.jpg">
      <div className="cover-in">
        <Kicker>Workshop · cfo.ro</Kicker>
        <h1>Freedom Number</h1>
        <h2 style={{ fontWeight: 400 }}>Contractul cu firma</h2>
        <Lead className="mt-6">O zi. Trei sume, trei căi, un ritm. La final semnezi un contract cu firma ta: ce trebuie să-ți livreze, în cifre, până pui munca în cui.</Lead>
      </div>
      <Card className="cover-card">
        <div className="grid g3">
          <div>
            <div className="stat-l">Durata</div>
            <div className="stat-v">o zi</div>
          </div>
          <div>
            <div className="stat-l">Cifra de pornit</div>
            <div className="stat-v">freedom number</div>
          </div>
          <div>
            <div className="stat-l">Livrabil</div>
            <div className="stat-v">Contractul cu firma</div>
          </div>
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
        <h1>Mulțumim că ai venit</h1>
        <Lead>Ai lăsat firma singură o zi ca să vii aici. Asta e deja un test — și e primul lucru despre care vom vorbi.</Lead>
      </div>
      <Card className="cover-card">
        <p style={{ margin: 0 }}>
          <Todo /> Textul de mulțumire, regulile de sală, ce se întâmplă cu telefoanele.
        </p>
      </Card>
    </CoverSlide>
  );
}

export function Speaker() {
  return (
    <Slide>
      <Kicker>Deschidere</Kicker>
      <h1>Cine îți vorbește</h1>
      <div className="speaker">
        <div className="speaker-photo">
          <img src="/alin-vlad.png" alt="Alin Vlad" />
        </div>
        <div>
          <div className="speaker-name">Alin Vlad</div>
          <div className="speaker-role">CFO Fracționat &amp; Fondator CFO.ro</div>
          <div className="speaker-stats">
            <div>
              <div className="stat-v">30 de ani</div>
              <div className="stat-l">la aceeași masă cu antreprenorii</div>
            </div>
            <div>
              <div className="stat-v">450+ companii</div>
              <div className="stat-l">cu care a lucrat</div>
            </div>
          </div>
          <p className="speaker-quote">„Știu cum e să crești în venituri și să te întrebi în fiecare lună unde a dispărut cashul.”</p>
          <p>În fiecare dintre aceste firme, la un moment dat, o decizie importantă trebuia luată fără datele care să arate dacă era sustenabilă. Cum funcționează afacerea exista în mintea antreprenorului, cifrele erau la contabil, organizate pentru autoritatea fiscală, iar întrebările pe care le ai când angajezi, investești sau crești nu aveau un răspuns calculat pe datele reale ale firmei.</p>
          <p>Azi pornim de la celălalt capăt: de la viața pe care vrei să ți-o plătească firma, până la cifra pe care trebuie să o facă în primul an.</p>
        </div>
      </div>
      <Note>
        <p>
          <Todo /> Parcursul lui Alin, de ce programul există, ce nu promite — de completat cu detaliile de la Alin.
        </p>
      </Note>
    </Slide>
  );
}
