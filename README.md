# Freedom Number · Live

Aplicația de sală pentru workshopul „Freedom Number · Contractul cu firma” (cfo.ro). Aceeași arhitectură ca „Turnul de Control · Live”
(`PROJECTS/turnul de control/app`, care rămâne neatinsă): prezentatorul e master pe slide-uri, fiecare participant urmărește pe laptopul lui
și își completează propriile cifre, totul sincronizat prin WebSocket.

| Rol | Intră cu | Vede |
|---|---|---|
| Participant | nume + firmă | slide-ul curent, cu cifrele lui; nu poate trece de pasul deschis de prezentator |
| Prezentator | PIN (`TEACHER_PIN`) | slide-ul cu firma-exemplu (interactivă, ca să arate „ce se întâmplă dacă”) + panoul **Sala** (tasta `S`) cu cifrele fiecărui participant |

## Rulare

```bash
npm install
cp .env.example .env      # TEACHER_PIN, PORT (8791)
npm run dev               # server pe 8791 + Vite pe 5173
```

Producție: `npm run build && npm start` (un singur proces Node servește API-ul, WebSocket-ul și `dist/`).
Deploy pe VPS: `bash deploy/push.sh` (director `/var/www/freedom-number`, serviciu `freedom-number`, port 8794, domeniu din `DEPLOY_DOMAIN`, implicit `app.cfo.cleancodeculture.com`).

Link-uri directe: `/?role=teacher&pin=1234`, `/?role=participant&name=Ana&firm=Firma%20SRL`.

Taste prezentator: `← →` pași, `Home/End`, `G` toate slide-urile, `S` Sala, `B` bara, `Esc`. Butonul **Exemplul** readuce firma-exemplu la cifrele inițiale.

## Conținutul: Freedom Number

Slide-urile sunt cele 36 de pagini din `../Freedom Number.html` (HTML-ul primit), în ordinea de acolo, precedate de intro (copertă, mulțumire, speaker):

1. **Timpul pe care îl avem** – speranța de viață, munca în cui, anii productivi, imaginea de ansamblu
2. **Firma azi** – cifra de afaceri, profit, EBITDA, dividendul net
3. **Cele trei sume** – lifestyle lunar, one-off, fonduri de siguranță, anii productivi, freedom number
4. **Trei căi** – economii / vânzare (cu evaluarea firmei) / board, concluzii
5. **Ritmul firmei** – unde ești, cele 3 întrebări, tabelul ritmurilor, de ce
6. **Anul antreprenorial** – muntele, 12 luni antreprenoriale, harta destinației, flat vs buget
7. **Contractul cu firma** – T.E.R.M.S. și contractul de semnat (cu versiuni semnate pe server, PDF, print)

## Unde stă codul

- `src/freedom/engine.js` — portul 1:1 al scriptului din HTML (formule, pagini, randare DOM). Generat de `port.mjs` (scratchpad) și apoi întreținut aici. API: `PAGES`, `fresh()`, `normalize()`, `calc()`, `mount(el, pageId, { state, onChange, navigate })`, `renderContract()`, `fingerprint()`, `summary()`.
- `src/freedom/freedom.css` — stilurile din HTML, închise sub `.fn` (CSS nesting), în paleta cfo.ro.
- `src/freedom/state.ts` — starea participantului (câmpul `fn.state`, JSON, salvat în browser și pe server la fiecare modificare) și firma-exemplu a prezentatorului (`localStorage`).
- `src/freedom/FreedomPage.tsx` — o pagină din motor ca slide; `ContractStep.tsx` — ultimul pas, cu semnare și versiuni.
- `src/content/steps.tsx` — lista pașilor (capitole + slide-uri); serverul vede doar id-urile (`fn-<pagina>`).
- `src/slides/deschidere.tsx` — intro-ul; `src/slides/theme.css` — brandul cfo.ro.
- `src/components/RoomPanel.tsx` — Sala: vârste, CA, dividend, freedom number, calea aleasă, CA la retragere, ritm, contract semnat.

## Date

`data/state.json` (gitignored): prezentator + participanți (`fields.fn.state`, `acts` = versiunile semnate ale contractului). Butonul „reset” al prezentatorului șterge tot.
