/* eslint-disable */
/*
  Motorul „Freedom Number”: port 1:1 al scriptului din „Freedom Number.html” (formule, pagini, randare).
  Diferențe față de prototip: starea nu mai stă în localStorage, ci vine din exterior (mount(el, pageId, { state, onChange, navigate }));
  navigarea între pagini o face aplicația de sală (prezentator / participant), nu bara de jos.
  Generat cu scratchpad/port.mjs; corecturile de formule se fac aici, în JS, ca să rămână identice cu HTML-ul primit.
*/
  /* ---------- formatare ---------- */
  var nf = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 1 });
  var nf0 = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 0 });
  var nf2 = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 2 });
  function eur(n) { return (n < 0 ? '−' : '') + nf0.format(Math.abs(Math.round(n))) + ' €'; }
  function shortEur(n) {
    var a = Math.abs(n), s = n < 0 ? '−' : '';
    if (a >= 1e6) return s + nf2.format(a / 1e6) + ' mil. €';
    if (a >= 1e4) return s + nf0.format(Math.round(a / 1e3)) + ' mii €';
    return s + nf0.format(Math.round(a)) + ' €';
  }
  function signed(n) { return Math.round(n) === 0 ? '—' : (n < 0 ? '− ' : '+ ') + nf0.format(Math.abs(Math.round(n))); }
  function pct(x) { return nf.format(x * 100) + '%'; }
  function ani(n) { if (Math.abs(n) === 1) return n + ' an'; var m = Math.abs(n) % 100; return n + ((m >= 20 || m === 0) ? ' de ani' : ' ani'); }
  function parseRo(s) {
    s = String(s).replace(/\s/g, '').replace(/€|%|lei|ani/gi, '').replace('−', '-');
    if (s === '') return NaN;
    if (s.indexOf(',') > -1) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    var n = Number(s); return isFinite(n) ? n : NaN;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- categoriile de buget (din aplicația de cheltuieli) ---------- */
  var CATS = [
    { g: 'Educație, sănătate și sport', items: [['edu', 'Educație', 400, 450, 0], ['san', 'Sănătate', 150, 150, 300], ['sport', 'Îngrijire corporală și sport', 150, 250, 150]] },
    { g: 'Mâncare și băuturi', items: [['mancare', 'Mâncare și băuturi nonalcoolice', 900, 1000, 800], ['alcool', 'Băuturi alcoolice', 80, 80, 60], ['tutun', 'Tutun', 0, 0, 0]] },
    { g: 'Îmbrăcăminte', items: [['haine', 'Îmbrăcăminte', 250, 300, 150], ['incaltaminte', 'Încălțăminte & accesorii', 120, 120, 80]] },
    { g: 'Locuință', items: [['chirie', 'Locuință - chirie', 0, 0, 0], ['ipoteca', 'Locuință - rată ipotecar', 900, 900, 0], ['utilitati', 'Utilități', 300, 300, 300], ['dotare', 'Dotarea locuinței', 150, 150, 100]] },
    { g: 'Servicii, taxe și credite', items: [['it', 'Comunicații și IT', 120, 120, 80], ['asigurari', 'Asigurări și servicii financiare', 100, 150, 150], ['taxe', 'Taxe și impozite', 80, 80, 80], ['credite', 'Credite și carduri', 0, 0, 0]] },
    { g: 'Transport', items: [['transport', 'Transport public', 20, 20, 30], ['masina', 'Mașina personală', 450, 700, 350]] },
    { g: 'Timp liber', items: [['horeca', 'HoReCa', 400, 700, 350], ['cultura', 'Cultură și recreere', 200, 350, 250], ['cadouri', 'Cadouri și evenimente', 200, 300, 250], ['concedii', 'Concedii și vacanțe', 700, 1500, 900], ['jocuri', 'Jocuri noroc și pariuri', 0, 0, 0]] },
    { g: 'Altele', items: [['animal', 'Animal de companie', 60, 60, 60], ['diverse', 'Diverse', 150, 150, 150]] }
  ];

  /* ---------- calculatorul de multiplu EBITDA (12 factori, din Excel) ---------- */
  var BANDS = ['M < 2', '2 ≤ M < 4', '4 ≤ M < 6', '6 ≤ M < 8', 'M ≥ 8'];
  var BAND_SHORT = ['< 2', '2–4', '4–6', '6–8', '≥ 8'];
  var W5 = [0.30, 0.23, 0.22, 0.15, 0.10], W12 = [0.21, 0.19, 0.16, 0.13, 0.09, 0.08, 0.03, 0.02, 0.03, 0.03, 0.02, 0.01];
  var FACT = [
    { t: 'Echipa de management (sau fondatorii)', d: ['fără management', '1 manager cu experiență neadecvată', '1–2 manageri cu experiență adecvată', 'echipă de management cu experiență profundă', 'echipă de management bine formată, cu experiență remarcabilă'],
      d2: ['mLER = 0', '1 < mLER ≤ 2', '2 < mLER ≤ 3', '3 < mLER ≤ 4', 'mLER > 4'], n2: 'Eficiența managementului: mLER = (venituri − COGS − muncă directă) / costul managementului' },
    { t: 'Clienții', d: ['top client ≥ 15% din venituri', 'top client 12–15%', 'top client 10–12%', 'top client 8–10%', 'top client < 8%'],
      d2: ['top 5 clienți ≥ 40%', 'top 5 clienți 35–40%', 'top 5 clienți 30–35%', 'top 5 clienți 25–30%', 'top 5 clienți < 25%'], n2: 'Concentrarea veniturilor pe clienți' },
    { t: 'Cum faci profit (clienți recurenți)', d: ['foarte puțini clienți care revin; fără contracte în derulare', 'puțini clienți care revin; câteva contracte în derulare', '20–35% dintre clienți revin', 'bază relativ diversificată de clienți care revin', 'bază diversificată de clienți care revin, mulți cu contracte în derulare'],
      d2: ['recurenți < 5%; abonament 0%', 'recurenți 5–20%; abonament ≤ 5%', 'recurenți 20–35%; abonament 5–10%', 'recurenți 35–50%; abonament 10–15%', 'recurenți > 50%; abonament > 15%'], n2: 'Loialitatea clienților' },
    { t: 'Bariere la intrare', d: ['foarte ușor de copiat modelul de business', 'ușor de copiat', 'dificultate medie de copiat', 'greu de copiat (investiții și know-how semnificative)', 'foarte greu de copiat (investiții și know-how majore)'] },
    { t: 'Profitabilitate', d: ['foarte volatilă sau mică; marja netă < 3%', 'volatilitate ridicată; marja netă 3–5%', 'volatilitate medie; marja netă 5–10%', 'volatilitate redusă; marja netă 10–20%', 'volatilitate foarte redusă; marja netă 20–30%'] },
    { t: 'Furnizori', d: ['top furnizor ≥ 40%', 'top furnizor 30–40%', 'top furnizor 20–30%', 'top furnizor 15–20%', 'top furnizor < 15%'],
      d2: ['top 3 furnizori ≥ 70%', 'top 3 furnizori 60–70%', 'top 3 furnizori 50–60%', 'top 3 furnizori 40–50%', 'top 3 furnizori < 40%'], n2: 'Concentrarea pe furnizori' },
    { t: 'Tipul produselor / serviciilor', d: ['marja brută < 20% sau negativă', 'marja brută 20–35%', 'marja brută 35–50%', 'marja brută 50–65%', 'marja brută 65–80%'] },
    { t: 'Diversificarea produselor / serviciilor', d: ['cel mult 3 produse sau servicii', '4–5', '6–7', '8–9', 'peste 9'] },
    { t: 'Ciclul de viață al produselor', d: ['dezvoltare; lansare în piață', 'creștere, la început', 'creștere, la mijloc', 'între creștere târzie și maturitate timpurie', 'maturitate, în partea de sus a curbei'] },
    { t: 'Intensitatea concurenței (HHI)', d: ['piață competitivă, HHI ≤ 400', 'piață competitivă, HHI 400–800', 'piață competitivă, HHI 800–1.000', 'intensitate medie, HHI 1.000–1.800', 'piață concentrată, HHI peste 1.800'] },
    { t: 'Vechimea companiei', d: ['sub 4 ani', '4–6 ani', '6–10 ani', '10–15 ani', 'cel puțin 15 ani'] },
    { t: 'Locația companiei', d: ['sub 150.000 locuitori', 'sub 280.000 locuitori', 'sub 500.000 locuitori', 'sub 2.000.000 locuitori', 'peste 2.000.000 locuitori'] }
  ];
  var MMM = [5, 8, 7, 5, 5, 8, 5, 9, 5, 6, 4, 5];
  /* industrii: multiplii EV/EBITDA și marja EBITDA tipică (knowledge EBITDA, IMM private Europa) */
  var IND = [
    ['saas', 'Software / SaaS cu venit recurent', 6, 12, 0.20, 0.35], ['it_servicii', 'Servicii IT / outsourcing', 4, 7, 0.12, 0.18],
    ['contabilitate', 'Cabinete de contabilitate / salarizare', 4, 7, 0.15, 0.25], ['consultanta', 'Consultanță / servicii profesionale', 3, 6, 0.10, 0.18],
    ['marketing', 'Agenții de marketing / publicitate', 3, 6, 0.10, 0.15], ['sanatate', 'Clinici / servicii medicale private', 6, 10, 0.12, 0.20],
    ['ecommerce', 'E-commerce / magazine online', 4, 8, 0.05, 0.10], ['productie', 'Producție industrială', 4, 7, 0.10, 0.15],
    ['lemn', 'Prelucrarea lemnului / mobilă', 3, 6, 0.08, 0.12], ['horeca', 'HoReCa', 3, 5, 0.10, 0.15],
    ['transport', 'Transport / logistică', 3, 6, 0.08, 0.12], ['retail', 'Retail fizic', 3, 6, 0.05, 0.08],
    ['constructii', 'Construcții / instalații', 3, 5, 0.05, 0.08], ['distributie', 'Distribuție / comerț en-gros', 4, 7, 0.03, 0.06]
  ].map(function (r) { return { id: r[0], n: r[1], min: r[2], max: r[3], mmin: r[4], mmax: r[5], rmin: Math.round(r[2] * r[4] * 100) / 100, rmax: Math.round(r[3] * r[5] * 100) / 100 }; });
  function indOf(id) { return IND.filter(function (x) { return x.id === id; })[0] || IND[7]; }
  var GRADE = {
    crestere: ['Veniturile au scăzut', 'Creștere 0–5% pe an', 'Creștere 5–10% pe an', 'Creștere 10–20% pe an', 'Creștere peste 20% pe an, susținută'],
    recurenta: ['Sub 10%: fiecare vânzare se câștigă de la zero', '10–30%', '30–50%', '50–75%', 'Peste 75%: abonamente sau contracte pe termen lung'],
    concentrare: ['Primii 3 clienți peste 60% din CA', '40–60%', '25–40%', '10–25%', 'Sub 10%: portofoliu foarte diversificat'],
    dependenta: ['Totul trece prin antreprenor', 'Antreprenorul e implicat zilnic în operațiuni și vânzări', 'Echipă, dar deciziile importante depind de antreprenor', 'Managementul conduce operațiunile, antreprenorul face strategie', 'Firma funcționează autonom, procese documentate'],
    informatie: ['Doar contabilitate fiscală', 'Situații anuale, analize ocazionale', 'P&L managerial periodic', 'BVC, P&L și cash flow lunar, KPI', 'Raportare completă, previziuni, audit'],
    marja: ['Marja EBITDA mult sub industrie', 'Sub minimul tipic al industriei', 'În partea de jos a intervalului tipic', 'În partea de sus a intervalului tipic', 'Peste maximul tipic al industriei'],
    stabilitate: ['În scădere sau foarte volatil', 'Variații de peste 30% de la an la an', 'Variații de 15–30%', 'Variații de 5–15%', 'Stabil sau în creștere constantă']
  };
  var VF = [['crestere', 'Creșterea veniturilor (ultimii 3 ani)', 0.20], ['marja', 'Marja EBITDA față de industrie (calculată)', 0.20], ['recurenta', 'Venit recurent / contractual (% din CA)', 0.20],
    ['concentrare', 'Ponderea primilor 3 clienți în CA', 0.15], ['dependenta', 'Dependența de antreprenor', 0.15], ['informatie', 'Calitatea informației financiare', 0.10]];
  var SF = [
    ['T1', 'Ce s-ar întâmpla cu firma dacă ați lipsi o lună întreagă?', ['Activitatea s-ar opri', 'Pierderi mari de clienți sau venituri', 'Ar funcționa, cu probleme și decizii amânate', 'Ar funcționa aproape normal', 'Ar funcționa normal, fără mine']],
    ['T2', 'Câți dintre clienții importanți au relație personală doar cu dumneavoastră?', ['Toți', 'Majoritatea', 'Aproximativ jumătate', 'Puțini', 'Niciunul; relația e cu firma și echipa']],
    ['T3', 'Există angajați cheie care pot conduce operațiunile și ar rămâne după vânzare?', ['Nu există', 'Există, dar sunt incerți să rămână', 'Pe o parte din activitate', 'Există și probabil rămân', 'Echipă stabilă, cu stimulente să rămână']],
    ['T4', 'Licențele, contractele cheie și furnizorii importanți sunt legați de persoana dumneavoastră?', ['Da, pe numele meu', 'În mare parte', 'Parțial', 'În mică măsură', 'Nu, toate pe firmă și transferabile']],
    ['T5', 'Cât mai are de durat contractul de chirie și poate fi transferat?', ['Sub 1 an sau fără contract', '1–2 ani', '2–3 ani', 'Peste 3 ani, transferabil', 'Peste 5 ani garantat, spațiu propriu sau nu depinde de locație']],
    ['T6', 'Procesele sunt scrise și sunteți dispus să rămâneți pentru predare?', ['Nimic scris, nu rămân', 'Nimic scris, rămân sub 3 luni', 'Parțial scrise, rămân 3–6 luni', 'În mare parte scrise, rămân 6–12 luni', 'Proceduri complete, predare structurată']],
    ['crestere', 'Creșterea veniturilor (ultimii 3 ani)', null, 0.15], ['stabilitate', 'Stabilitatea SDE (ultimii 3 ani)', null, 0.15], ['recurenta', 'Venit recurent / contractual (% din CA)', null, 0.15],
    ['concentrare', 'Ponderea primilor 3 clienți în CA', null, 0.15], ['informatie', 'Calitatea informației financiare', null, 0.10]];
  var SDE_TAB = [[50000, 1.00, 1.25], [75000, 1.10, 1.80], [100000, 2.00, 2.70], [200000, 2.50, 3.00], [500000, 3.00, 4.00], [1000000, 3.25, 4.25]];
  var VM = { ebitda: { t: 'Multiplu EBITDA', u: '× EBITDA', base: 'EBITDA' }, venit: { t: 'Multiplu pe venituri', u: '× cifra de afaceri', base: 'Cifra de afaceri' }, sde: { t: 'Multiplu SDE', u: '× SDE', base: 'SDE' } };

  /* ---------- starea ---------- */
  var DEF = {
    speranta: 85, retragere: 60, aniRamasi: 15,
    randament: 7, inflatie: 3, metoda: 'consum', economii: 100000, curs: 5,
    urgLuni: 6, sanatate1: 50000, sanatate2: 50000, aniFonduri: 2,
    ca: 1600000, marjaMod: 'pct', marjaPct: 8, profitNet: 128000, kEbitda: 1.25,
    ebitda: 160000, da: 10, crestere: 2, reinvest: 20, cota: 100,
    taxProfit: 16, taxDiv: 16, cassRon: 9720, taxCastig: 16, datorie: 0,
    mMode: '12', mTab: 'azi', alegere: null, valMetoda: 'ebitda', industrie: 'productie',
    nE: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], nET: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], notesV2: true, manualV1: true, mManual: true, mManAzi: 4, mManT: 5,
    nV: [1, 1, 1, 1, 1, 1], nVT: [1, 1, 1, 1, 1, 1], notesV3: true, vManual: true, vManAzi: 0.5, vManT: 0.7, sManual: true, sManAzi: 2.2, sManT: 2.8,
    nS: [2, 2, 3, 3, 3, 2, 3, 3, 2, 2, 3], nST: [4, 4, 4, 4, 4, 4, 3, 4, 3, 3, 4],
    sdeSalariu: 60000, sdeChelt: 10000, sdeSalPiata: 50000, sdePodea: 100000, cursUsd: 4.5, factorPiata: 0.85,
    finAport: 30, finDobBanca: 9, finAniBanca: 5, finCreditV: 0, finDobV: 6, finAniV: 3, finRand: 20, finDscr: 1.25,
    cotaPastrata: 70, puncteCrestere: 40, legacy: 150000, ramp1: 5, ramp2: 5, ramp3: 5, costCeo: 70000, crestere2: 2,
    caTrecut: 1200000, ritmAles: null, an1Ok: null, an1Target: 0, sezModel: 'none', sez: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], startLuna: 0, dInit: false, dS0: 0, dM0: 0, dX0: 0, dPT: 0, dST: 0, dMT: 0, dXT: 0, bud: [],
    terms: { hook: '', T: { hk: '', now: 50, end: 30, zile: 4, conc: 4, neg: '' }, E: { hk: '', a: [{ n: '', h: 0 }, { n: '', h: 0 }, { n: '', h: 0 }], keep: '', no: '' }, R: { hk: '' }, M: { hk: '', loc: '', oras: '', echipa: 0, constr: '' }, S: { hk: '', azi: 6, tinta: 9, y1: '', y2: '', y3: '', opresc: '' } },
    ctNume: '', ctFirma: '', ctLoc: '', deCe: { a: '', b: '', c: '', w: [''] }
  };
  function buildCats(old) {
    return CATS.map(function (g) { return { g: g.g, open: false, items: g.items.map(function (it) { var v = old && old[it[0]]; return { id: it[0], n: it[1], v: v ? [+v[0] || 0, +v[0] || 0, +v[1] || 0] : [it[2], it[3], it[4]] }; }) }; });
  }
  var OO_GROUPS = ['Evenimente', 'Hobby', 'Caritate / Ajutor membri familie', 'Fantezii / Dorințe'];
  function defaultOO(varsta, retr) {
    return [
      { id: 1, g: 0, nume: 'Nunta copilului', varsta: varsta + 9, suma: 25000 },
      { id: 2, g: 0, nume: 'Aniversarea de 25 de ani de căsătorie', varsta: varsta + 7, suma: 8000 },
      { id: 3, g: 1, nume: 'Echipament pentru hobby', varsta: retr + 1, suma: 12000 },
      { id: 4, g: 2, nume: 'Studiile copilului', varsta: varsta + 3, suma: 30000 },
      { id: 5, g: 2, nume: 'Ajutor pentru părinți', varsta: varsta + 6, suma: 10000 },
      { id: 6, g: 3, nume: 'Mașină nouă', varsta: varsta + 5, suma: 35000 },
      { id: 7, g: 3, nume: 'Călătoria vieții', varsta: retr + 2, suma: 20000 },
      { id: 8, g: 3, nume: 'Mașină nouă', varsta: retr + 6, suma: 30000 }
    ];
  }
  function guessG(n) { n = (n || '').toLowerCase(); return /nunt|botez|anivers|eveniment/.test(n) ? 0 : /hobby|golf|barc/.test(n) ? 1 : /studi|avans|copil|părinț|parint|donaț|caritat/.test(n) ? 2 : 3; }
  var LIM = {
    speranta: [1, 60, 110], retragere: [1, 35, 90], aniRamasi: [1, 0, 60],
    randament: [0.5, -5, 20], inflatie: [0.5, -5, 30], economii: [10000, 0, 1e9], curs: [0.05, 1, 10],
    urgLuni: [1, 0, 24], sanatate1: [5000, 0, 1e7], sanatate2: [5000, 0, 1e7], aniFonduri: [1, 1, 10],
    ca: [50000, 0, 1e10], marjaPct: [0.5, -50, 100], profitNet: [5000, -1e9, 1e9], kEbitda: [0.05, 1, 3],
    ebitda: [10000, 0, 1e9], da: [1, 0, 90], crestere: [0.5, -20, 50], reinvest: [5, 0, 100], cota: [1, 1, 100],
    taxProfit: [1, 0, 50], taxDiv: [1, 0, 50], cassRon: [100, 0, 1e6], taxCastig: [1, 0, 50], datorie: [10000, -1e9, 1e9],
    sdeSalariu: [5000, 0, 1e8], sdeChelt: [1000, 0, 1e8], sdeSalPiata: [5000, 0, 1e8], sdePodea: [10000, 0, 1e9], cursUsd: [0.05, 1, 10], factorPiata: [0.05, 0.5, 1.2],
    finAport: [5, 0, 100], finDobBanca: [0.5, 0, 40], finAniBanca: [1, 1, 30], finCreditV: [5, 0, 100], finDobV: [0.5, 0, 40], finAniV: [1, 1, 30], finRand: [1, 0, 100], finDscr: [0.05, 1, 3],
    mManAzi: [0.1, 0, 50], mManT: [0.1, 0, 50], vManAzi: [0.05, 0, 20], vManT: [0.05, 0, 20], sManAzi: [0.05, 0, 20], sManT: [0.05, 0, 20],
    cotaPastrata: [1, 1, 100], ramp1: [1, -50, 100], ramp2: [1, -50, 100], ramp3: [1, -50, 100], legacy: [10000, 0, 1e9], puncteCrestere: [1, 0, 100], costCeo: [5000, 0, 1e7], crestere2: [0.5, -20, 50], caTrecut: [50000, 0, 1e10], an1Target: [50000, 0, 1e11], dS0: [50000, 0, 1e11], dM0: [0.5, -50, 100], dX0: [0.1, 0, 50], dPT: [10000, -1e10, 1e10], dST: [50000, 0, 1e11], dMT: [0.5, 0.5, 100], dXT: [0.1, 0, 50]
  };
  var PCT_KEYS = { dM0: 1, dMT: 1, dX0: 1, dXT: 1, sManAzi: 1, sManT: 1, vManAzi: 1, vManT: 1, mManAzi: 1, mManT: 1, cursUsd: 1, factorPiata: 1, finAport: 1, finDobBanca: 1, finCreditV: 1, finDobV: 1, finRand: 1, finDscr: 1, ramp1: 1, ramp2: 1, ramp3: 1, marjaPct: 1, kEbitda: 1, randament: 1, inflatie: 1, da: 1, crestere: 1, reinvest: 1, cota: 1, taxProfit: 1, taxDiv: 1, taxCastig: 1, cotaPastrata: 1, puncteCrestere: 1, crestere2: 1, curs: 1 };
  var state = null, onSave = null;
  function fresh() {
    var s = JSON.parse(JSON.stringify(DEF));
    s.cats = buildCats(null);
    s.oneoff = defaultOO(Math.round(s.retragere - s.aniRamasi), s.retragere);
    s.ooOpen = [true, false, false, false];
    return s;
  }
  /** Starea unui participant, cum vine de pe server sau din browser: completată cu ce lipsește și migrată de la forme mai vechi. */
  function normalize(raw) {
    try { if (raw && typeof raw === 'object') { var s = raw, f = fresh(); if (!s.cats) s.cats = buildCats(s.buget); delete s.buget; s.cats.forEach(function (g) { g.items.forEach(function (it) { if (it.v.length === 2) it.v = [it.v[0], it.v[0], it.v[1]]; }); }); if (s.oneoff) s.oneoff.forEach(function (o) { if (o.g == null) o.g = guessG(o.nume); }); if (!s.ooOpen) s.ooOpen = [true, false, false, false]; if (!s.notesV2) { s.nE = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]; s.nET = s.nE.slice(); s.notesV2 = true; } if (!s.manualV1) { s.mManual = s.vManual = s.sManual = true; s.manualV1 = true; } if (!s.notesV3) { s.nV = [1, 1, 1, 1, 1, 1]; s.nVT = s.nV.slice(); s.notesV3 = true; } if (s.mval && !s.nE) { s.nE = s.mval.map(function (v) { return Math.min(5, Math.floor(v / 2) + 1); }); s.nET = (s.mvalT || s.mval).map(function (v) { return Math.min(5, Math.floor(v / 2) + 1); }); } for (var k in f) if (!(k in s)) s[k] = f[k]; delete s.step; return s; } } catch (e) {}
    return fresh();
  }
  function save() { if (onSave) onSave(state); }

  /* ---------- motorul de calcul ---------- */
  function pctN(n) { return Math.max(0, Math.min(1, ((+n || 1) - 1) / 4)); }
  function scoreE(s, notes) { var w = s.mMode === '5' ? W5 : W12, sc = 0, sw = 0; for (var i = 0; i < 12; i++) { var wi = w[i] || 0; sc += wi * pctN(notes[i]); sw += wi; } return sw ? sc / sw : 0; }
  function marjaNote(m, ind) { if (!(m > 0)) return 1; if (m < ind.mmin * 0.75) return 1; if (m < ind.mmin) return 2; if (m <= (ind.mmin + ind.mmax) / 2) return 3; if (m <= ind.mmax) return 4; return 5; }
  function scoreV(notes, mNote) { var sc = 0; VF.forEach(function (f, i) { sc += f[2] * pctN(i === 1 ? mNote : notes[i]); }); return sc; }
  function scoreS(notes) { var t = 0; for (var i = 0; i < 6; i++) t += +notes[i] || 1; var sc = 0.30 * pctN(t / 6); for (var j = 6; j < 11; j++) sc += SF[j][3] * pctN(notes[j]); return sc; }
  function annuity(r, n) { return r <= 0 ? 1 / n : r / (1 - Math.pow(1 + r, -n)); }
  /* evaluarea SDE: tabel pe mărime (USD), factor de piață, podeaua de active, testul cumpărătorului, scorecard */
  function evalSDE(s, sdeEur, score) {
    var o = { msgs: [], ok: sdeEur > 0 };
    if (!o.ok) { o.msgs.push('Afacerea nu generează beneficii pentru proprietar. Valoarea este dată de active.'); o.min = o.max = o.applied = 0; o.value = s.sdePodea; return o; }
    var usd = sdeEur * s.curs / s.cursUsd, T = SDE_TAB, tmin, tmax;
    if (usd <= T[0][0]) { tmin = T[0][1]; tmax = T[0][2]; o.msgs.push('La acest nivel, afacerea este practic un loc de muncă pentru proprietar. Valoarea este dată în principal de active.'); }
    else if (usd >= T[T.length - 1][0]) { tmin = T[T.length - 1][1]; tmax = T[T.length - 1][2]; o.msgs.push('La acest nivel, metoda recomandată este EV/EBITDA.'); }
    else { for (var i = 0; i < T.length - 1; i++) if (usd >= T[i][0] && usd <= T[i + 1][0]) { var t = (usd - T[i][0]) / (T[i + 1][0] - T[i][0]); tmin = T[i][1] + t * (T[i + 1][1] - T[i][1]); tmax = T[i][2] + t * (T[i + 1][2] - T[i][2]); } }
    var amin = tmin * s.factorPiata, amax = tmax * s.factorPiata, floorM = s.sdePodea / sdeEur;
    var cv = s.finCreditV / 100, ap = s.finAport / 100, pb = Math.max(0, 1 - ap - cv);
    var rate = pb * annuity(s.finDobBanca / 100, s.finAniBanca) + cv * annuity(s.finDobV / 100, s.finAniV), cost = rate + ap * s.finRand / 100;
    var avail = sdeEur - s.sdeSalPiata;
    o.usd = usd; o.tmin = tmin; o.tmax = tmax; o.amin = amin; o.amax = amax; o.floorM = floorM;
    if (avail <= 0) { o.msgs.push('După plata unui salariu de piață pentru conducere, afacerea nu mai generează profit. Un cumpărător plătește doar pentru active.'); o.min = o.max = o.applied = floorM; o.value = s.sdePodea; return o; }
    var capM = Math.min(avail / cost, rate > 0 ? avail / (s.finDscr * rate) : Infinity) / sdeEur; o.capM = capM;
    var mn = Math.max(amin, floorM), mx = Math.min(amax, capM);
    if (floorM > mx) { o.msgs.push('Activele valorează mai mult decât poate susține profitul. Afacerea se evaluează pe baza activelor.'); o.min = o.max = o.applied = floorM; o.value = s.sdePodea; return o; }
    if (capM < amin) { o.msgs.push('La prețul minim al pieței, un cumpărător nu și-ar putea finanța achiziția din profit. Plata eșalonată a unei părți din preț (credit vânzător) poate face tranzacția posibilă.'); mn = mx = capM; }
    o.min = mn; o.max = mx; o.applied = mn + score * (mx - mn); o.value = o.applied * sdeEur;
    return o;
  }
  function calc(s) {
    var R = Math.round(s.retragere), varsta = Math.max(18, Math.round(s.retragere - s.aniRamasi));
    var E = Math.max(R + 1, Math.round(s.speranta)), n1 = Math.max(0, R - varsta), n2 = E - R;
    var rr = (1 + s.randament / 100) / (1 + s.inflatie / 100) - 1;
    var L1 = 0, L2 = 0;
    var L1b = 0;
    s.cats.forEach(function (g) { g.items.forEach(function (it) { L1 += +it.v[0] || 0; L1b += +it.v[1] || 0; L2 += +it.v[2] || 0; }); });
    var L1use = L1, life1Tot = 0;
    var rampM = [1, 1 + s.ramp1 / 100, (1 + s.ramp1 / 100) * (1 + s.ramp2 / 100), (1 + s.ramp1 / 100) * (1 + s.ramp2 / 100) * (1 + s.ramp3 / 100)];
    function lifeM(i) { return i < 4 ? L1use * rampM[i] : L1b; }
    function lifeAt(i) { return lifeM(i) * 12; }
    var ooAt = {}, OO1 = 0, OO2 = 0, cnt1 = 0, cnt2 = 0, OO2pv = 0;
    s.oneoff.forEach(function (o) {
      var a = Math.round(o.varsta), v = +o.suma || 0;
      if (a < varsta || a >= E || v <= 0) return;
      ooAt[a] = (ooAt[a] || 0) + v;
      if (a < R) { OO1 += v; cnt1++; } else { OO2 += v; cnt2++; OO2pv += v / Math.pow(1 + rr, a - R + 1); }
    });
    var urg1 = s.urgLuni * L1, urg2 = s.urgLuni * L2, F1 = urg1 + s.sanatate1, F2 = urg2 + s.sanatate2;
    var intact = s.metoda === 'capital';
    var cassEur = s.cassRon / s.curs, td = s.taxDiv / 100, tp = s.taxProfit / 100, da = s.da / 100;

    var kE = s.kEbitda > 0 ? s.kEbitda : 1.25;
    var pn0 = s.marjaMod === 'suma' ? s.profitNet : s.ca * s.marjaPct / 100, E0 = Math.max(0, pn0) * kE;
    function divNet(ebitda, share) {
      var pn = Math.max(0, ebitda) / kE, pb = pn / (1 - tp), brut = pn * share, cass = Math.min(0.10 * brut, cassEur);
      return { pb: pb, pn: pn, brut: brut, cass: cass, tax: brut * td, net: Math.max(0, brut * (1 - td) - cass) };
    }
    function invertNet(A, share) {
      if (A <= 0 || share <= 0) return 0;
      var brut = A / (1 - td - 0.10);
      if (0.10 * brut > cassEur) brut = (A + cassEur) / (1 - td);
      return brut / share * kE;
    }
    /* freedom number: valoarea la începutul capitolului următor a tot ce trebuie plătit, cu un venit anual D(k) care îl reduce */
    function freedom(D, legacy) {
      var pv = 0, last = 0, lifePv = 0;
      for (var k = 1; k <= n2; k++) { var need = Math.max(0, L2 * 12 - (D ? D(k) : 0)); lifePv += need / Math.pow(1 + rr, k); last = need; }
      pv = lifePv;
      var term = 0;
      if (intact) { if (rr <= 0) return { ok: false }; term = last / rr / Math.pow(1 + rr, n2); }
      var lg = legacy > 0 ? legacy / Math.pow(1 + rr, n2) : 0;
      return { ok: true, life: lifePv, term: term, oo: OO2pv, fonduri: F2, legacy: lg, total: lifePv + term + OO2pv + F2 + lg };
    }
    var FN = freedom(null);
    var FNsimple = L2 * 12 * n2 + OO2 + F2;

    var share1 = (1 - s.reinvest / 100) * (s.cota / 100);
    var nFund = Math.max(1, Math.min(s.aniFonduri, Math.max(1, n1 - 1)));
    /* fondurile se construiesc din anul 1 (anul 0 e azi, dividendul lui e deja cheltuit) */
    function fondAt(i) { return (n1 > 1 ? (i >= 1 && i <= nFund) : i === 0) ? F1 / nFund : 0; }
    var keep = Math.min(s.cotaPastrata, Math.max(0, s.cotaPastrata - s.puncteCrestere)) / 100, g2 = s.crestere2 / 100;
    var ind = indOf(s.industrie), meth = s.valMetoda || 'ebitda', addS = s.sdeSalariu + s.sdeChelt;
    /* valoarea firmei după metoda aleasă; which = 'azi' sau 'tinta' (factorii la vânzare) */
    function eff(a, t) { return t.map(function (v, i) { return Math.max(+v || 1, +a[i] || 1); }); }
    var nET = eff(s.nE, s.nET), nVT = eff(s.nV, s.nVT), nST = eff(s.nS, s.nST);
    function valuation(EB, CAv, which) {
      var tinta = which === 'tinta', o = { meth: meth };
      if (meth === 'venit') {
        var mN = marjaNote(CAv > 0 ? EB / CAv : 0, ind), sc = scoreV(tinta ? nVT : s.nV, mN);
        o.min = ind.rmin; o.max = ind.rmax; o.score = s.vManual ? NaN : sc; o.mult = s.vManual ? (tinta ? s.vManT : s.vManAzi) : ind.rmin + sc * (ind.rmax - ind.rmin); o.base = CAv; o.EV = o.mult * CAv; o.mNote = mN;
      } else if (meth === 'sde') {
        var sd = EB + addS, ev = evalSDE(s, sd, scoreS(tinta ? nST : s.nS));
        o.min = ev.min; o.max = ev.max; o.score = s.sManual ? NaN : scoreS(tinta ? nST : s.nS); o.mult = s.sManual ? (tinta ? s.sManT : s.sManAzi) : ev.applied; o.base = sd; o.EV = s.sManual ? o.mult * Math.max(0, sd) : ev.value; o.sde = ev;
      } else {
        var se = scoreE(s, tinta ? nET : s.nE);
        o.min = ind.min; o.max = ind.max; o.score = s.mManual ? NaN : se;
        o.mult = EB > 0 ? (s.mManual ? (tinta ? s.mManT : s.mManAzi) : ind.min + se * (ind.max - ind.min)) : 0; o.base = EB; o.EV = o.mult * Math.max(0, EB);
      }
      o.equity = Math.max(0, o.EV - s.datorie); o.ours = o.equity * s.cota / 100;
      return o;
    }
    var V0 = valuation(E0, s.ca, 'azi'), VT0 = valuation(E0, s.ca, 'tinta'), M0 = V0.mult, MT = VT0.mult;
    /* anul 1: lifestyle-ul nu poate depăși dividendul net pe care îl poți ridica */
    var capMonth = divNet(E0, share1).net / 12;
    L1use = Math.min(L1, capMonth);
    for (var li = 0; li < n1; li++) life1Tot += lifeAt(li);
    urg1 = s.urgLuni * L1use; F1 = urg1 + s.sanatate1;

    /* căile 1 și 2 au două etape: în primii 4 ani firma crește cu g1 până la cifra care acoperă lifestyle-ul și one-off-urile (slide-ul 9),
       apoi crește constant cu g (ritmul căutat) ca să strângă economiile, respectiv să ajungă la valoarea de vânzare */
    var Y4 = Math.max(0, Math.min(4, n1 - 1)), g1 = 0;
    function phased(route) { return (route === 'div' || route === 'sale' || route === 'board') && Y4 > 0; }
    function mult(g, route, i) { return !phased(route) ? Math.pow(1 + g, i) : (i <= Y4 ? Math.pow(1 + g1, i) : Math.pow(1 + g1, Y4) * Math.pow(1 + g, i - Y4)); }
    /* calea 3: din anul morții înapoi — cu ce EBITDA intri în capitolul următor ca dividendele din board să plătească totul și să rămână moștenirea */
    function boardDivAt(ER) { return function (k) { return divNet(ER * Math.pow(1 + g2, k - 1) - s.costCeo, keep).net; }; }
    function boardGap(ER, resR) {
      var bD = boardDivAt(ER), P3 = 0, minP = 0, need = 0, dsum = 0;
      for (var k = 1; k <= n2; k++) {
        var nk = L2 * 12 + (ooAt[R + k - 1] || 0) + (k === 1 ? Math.max(0, F2 - resR) : 0), dk = bD(k);
        need += nk; dsum += dk; P3 = P3 + (P3 > 0 ? P3 * rr : 0) + dk - nk; if (P3 < minP) minP = P3;
      }
      return { gap: Math.max(-minP, (s.legacy || 0) - P3), bc: { minP: minP, end: P3, need: need, div: dsum, cover: need > 0 ? dsum / need : 0 } };
    }
    function simulate(g, route, saleNet, bDiv, bEb, cap) {
      var P = s.economii, Res = 0, rows = [], tot = { div: 0, life: 0, oo: 0, fond: 0, growth: 0, def: 0, def1: 0, defLife: 0 }, runOut = null, firstDef = null;
      var pts = [{ age: varsta, c: P }];
      for (var i = 0; i < n1; i++) {
        var a = varsta + i, eb = E0 * mult(g, route, i), d = divNet(eb, share1);
        var life = lifeAt(i), oo = (ooAt[a] || 0), fond = fondAt(i), start = P, growth = P > 0 ? P * rr : 0, def = 0;
        if (cap) {
          /* fără economii negative: plătești doar cât ai; restul rămâne neplătit */
          var av = Math.max(0, P) + growth + d.net, pl = Math.min(life, av); av -= pl;
          var pf = Math.min(fond, av); av -= pf; var po = Math.min(oo, av); av -= po;
          def = (life - pl) + (fond - pf) + (oo - po); tot.defLife += life - pl;
          if (def > 0.5 && firstDef === null) firstDef = a;
          life = pl; fond = pf; oo = po; P = av;
        } else {
          P = P + growth + d.net - life - oo - fond;
          if (P + Res + fond < 0 && runOut === null) runOut = a + 1;
        }
        Res += fond;
        tot.div += d.net; tot.life += life; tot.oo += oo; tot.fond += fond; tot.growth += growth; tot.def += def; if (i >= 1) tot.def1 += def;
        rows.push({ age: a, ch: 1, ebitda: eb, start: start, sale: 0, fond: -fond, growth: growth, div: d.net, life: -life, oo: -oo, def: -def, end: P, res: Res });
        pts.push({ age: a + 1, c: P + Res });
      }
      var capRet = P + Res, resR = Res, sale = saleNet || 0, w = { div: 0, life: 0, oo: 0, growth: 0 };
      for (var k = 1; k <= n2; k++) {
        var a2 = R + k - 1, st = P, pre = 0, topup = 0;
        if (k === 1) { pre = sale; topup = F2 - Res; Res = F2; }
        var base = st + pre - topup, gr = base > 0 ? base * rr : 0, dv = bDiv ? bDiv(k) : 0, lf = L2 * 12, o2 = ooAt[a2] || 0;
        P = base + gr + dv - lf - o2;
        w.div += dv; w.life += lf; w.oo += o2; w.growth += gr;
        if (P < 0 && runOut === null) runOut = a2 + 1;
        rows.push({ age: a2, ch: 2, ebitda: bEb ? bEb(k) : null, start: st, sale: pre, fond: -topup, growth: gr, div: dv, life: -lf, oo: -o2, def: 0, end: P, res: Res });
        pts.push({ age: a2 + 1, c: Math.max(0, P) + Res });
      }
      return { rows: rows, pts: pts, tot: tot, w: w, capRet: capRet, resR: resR, capTrans: capRet + sale, runOut: runOut, end: P, firstDef: firstDef, cap: !!cap };
    }
    /* un scenariu: firma crește constant cu g pe an în anii productivi */
    function scenario(g, route, M, cap) {
      var X = mult(g, route, n1), ER = E0 * X, o = { g: g, X: X, ER: ER, CA: s.ca * X, route: route }, saleNet = 0, bDiv = null, bEb = null;
      if (route === 'sale') {
        var sv = valuation(ER, s.ca * X, M); o.V = sv; o.M = sv.mult; o.base = sv.base;
        o.EV = sv.EV; o.equity = sv.equity; o.ours = sv.ours; o.saleTax = o.ours * s.taxCastig / 100; o.saleNet = o.ours - o.saleTax; saleNet = o.saleNet;
      }
      if (route === 'board') {
        bEb = function (k) { return ER * Math.pow(1 + g2, k - 1) - s.costCeo; };
        bDiv = function (k) { return divNet(bEb(k), keep).net; };
        o.d1 = divNet(bEb(1), keep); o.dLast = divNet(bEb(n2), keep); o.eb1 = bEb(1);
      }
      o.FNr = route === 'board' ? freedom(bDiv, s.legacy) : FN;
      o.sim = simulate(g, route, saleNet, bDiv, bEb, cap);
      if (route === 'sale') {
        /* calea 2: anii de freedom se plătesc doar din vânzare; economiile din dividende nu intră în calcul */
        o.gap = FN.ok ? FN.total - saleNet : NaN;
      } else if (route === 'board') {
        /* calea 3: capitolul următor e plătit an de an din dividendele din board, pornind de la zero economii */
        var bg = boardGap(ER, o.sim.resR); o.bc = bg.bc; o.gap = bg.gap;
      } else o.gap = o.FNr.ok ? o.FNr.total - o.sim.capTrans : NaN;
      o.divLast = n1 > 0 ? divNet(E0 * mult(g, route, n1 - 1), share1).net : 0;
      o.curve = []; for (var ci = 0; ci <= n1; ci++) o.curve.push(mult(g, route, ci));
      if (phased(route)) {
        var x1 = Math.pow(1 + g1, Y4);
        o.p1 = { g: g1, X: x1, CA: s.ca * x1, age: varsta + Y4, yrs: Y4 };
        o.X2 = X / x1;
        var rw = o.sim.rows; function sv(r) { return r.div + r.life + r.fond; }
        o.save4 = rw[Y4] ? sv(rw[Y4]) : 0; o.saveEnd = rw[n1 - 1] ? sv(rw[n1 - 1]) : 0; o.div4 = rw[Y4] ? rw[Y4].div : 0;
      }
      return o;
    }
    /* reverse engineering: ritmul constant de creștere care închide exact freedom number */
    /* calea 3: EBITDA cerută la începutul capitolului următor; dacă e sub nivelul din anul 4 rămâi la acela, altfel crești constant din anul 4 până la ea */
    function solve3() {
      if (!FN.ok || E0 <= 0 || n1 === 0) return null;
      var resR = scenario(0, 'board', 0, true).sim.resR, lo = 0, hi = E0 * 1000;
      if (boardGap(hi, resR).gap > 0) { var z = scenario(3, 'board', 0, true); z.status = 'imposibil'; return z; }
      for (var it = 0; it < 80; it++) { var m = (lo + hi) / 2; if (boardGap(m, resR).gap > 0) lo = m; else hi = m; }
      var ERq = hi, base4 = E0 * mult(0, 'board', n1), steps = phased('board') ? n1 - Y4 : n1, g = 0;
      if (ERq > base4) g = Math.pow(ERq / base4, 1 / steps) - 1;
      var r = scenario(g, 'board', 0, true);
      r.status = 'ok'; r.ERreq = ERq; r.CAreq = s.ca * ERq / E0; r.floor = ERq <= base4; r.CAbase = s.ca * base4 / E0;
      return r;
    }
    function solve(route, M) {
      if (!FN.ok || E0 <= 0) return null;
      if (n1 === 0) { var z = scenario(0, route, M); z.status = z.gap <= 0 ? 'ok' : 'imposibil'; return z; }
      /* condiția: în fiecare an productiv (din anul 1) se plătesc lifestyle-ul, one-off-urile și fondurile, fără economii negative, iar la retragere capitalul acoperă freedom number */
      function bad(x) { return x.gap > 0 || x.sim.tot.def1 > 1; }
      var lo = -0.9, hi = 3, flo = scenario(lo, route, M, true);
      if (isNaN(flo.gap)) return null;
      if (!bad(flo)) { flo.status = 'min'; return flo; }
      var fhi = scenario(hi, route, M, true);
      if (bad(fhi)) { fhi.status = 'imposibil'; return fhi; }
      for (var it = 0; it < 60; it++) { var mid = (lo + hi) / 2; if (bad(scenario(mid, route, M, true))) lo = mid; else hi = mid; }
      var r = scenario(hi, route, M, true); r.status = 'ok'; return r;
    }

    var PROV = (function () {
        /* one-off-urile se pun deoparte din timp: din anul 4 (sau din anul 1, dacă evenimentul e mai devreme) până în anul în care se întâmplă */
        var o = { ok: E0 > 0 && n1 >= 1, years: [] }; if (!o.ok) return o;
        var provAt = [], i;
        for (i = 0; i < n1; i++) provAt.push(0);
        s.oneoff.forEach(function (x) {
          var a = Math.round(x.varsta), v = +x.suma || 0; if (a < varsta || a >= R || v <= 0) return;
          var k = a - varsta, st = k >= 4 ? 4 : Math.min(1, k), cnt = k - st + 1;
          for (var j = st; j <= k; j++) provAt[j] += v / cnt;
        });
        o.peak = 0; o.peakI = 0; o.lastOO = -1;
        for (i = 0; i < n1; i++) {
          var life = lifeAt(i), fond = fondAt(i), pr = provAt[i];
          var ebL = invertNet(life, share1), ebT = invertNet(life + fond + pr, share1);
          var y = { i: i, age: varsta + i, life: life, fond: fond, prov: pr, caLife: s.ca * ebL / E0, caTot: s.ca * ebT / E0, div: life + fond + pr };
          o.years.push(y);
          if (y.caTot > o.peak) { o.peak = y.caTot; o.peakI = i; }
          if (pr > 0) o.lastOO = i;
        }
        o.peakY = o.years[o.peakI];
        o.g = o.peakI > 0 ? Math.pow(o.peak / s.ca, 1 / o.peakI) - 1 : NaN;
        o.X = o.peak / s.ca;
        o.maxProv = Math.max.apply(null, o.years.map(function (y) { return y.prov + y.fond; }));
        return o;
      })();
    /* etapa 1: cel mai mic ritm g1 cu care, în 4 ani, firma ajunge la cifra din slide-ul 9 pentru anul 4 și nu lasă nimic neplătit în anii 1–4 */
    var need4 = PROV.ok && Y4 > 0 && PROV.years[Y4] ? E0 * PROV.years[Y4].caTot / s.ca : 0, g1Imp = false;
    if (Y4 > 0 && E0 > 0) {
      var p1bad = function (x) {
        g1 = x; if (E0 * Math.pow(1 + x, Y4) < need4 - 0.5) return true;
        var sm = simulate(0, 'div', 0, null, null, true), d = 0;
        for (var j = 1; j <= Y4; j++) d += -sm.rows[j].def;
        return d > 1;
      };
      var l1 = 0, h1 = 3;
      if (!p1bad(l1)) g1 = 0;
      else if (p1bad(h1)) { g1 = h1; g1Imp = true; }
      else { for (var it1 = 0; it1 < 60; it1++) { var m1 = (l1 + h1) / 2; if (p1bad(m1)) l1 = m1; else h1 = m1; } g1 = h1; }
    }
    var base = scenario(0, 'none', 0, true), r1 = base.sim;
    var A = NaN, ebNec = NaN;
    if (n1 > 0 && FN.ok) {
      var sf = 0, num = FN.total - F1 - s.economii * Math.pow(1 + rr, n1);
      for (var i2 = 0; i2 < n1; i2++) {
        var f = Math.pow(1 + rr, n1 - 1 - i2), a3 = varsta + i2;
        num += (lifeAt(i2) + (ooAt[a3] || 0) + fondAt(i2)) * f; sf += f;
      }
      A = num / sf; ebNec = invertNet(A, share1);
    }

    /* primii 3 ani: cât trebuie să crească firma ca dividendul să plătească lifestyle-ul dorit */
    /* anii 0–4: cât trebuie să crească firma ca dividendul să plătească lifestyle-ul fiecărui an */
    var y3 = { ok: false };
    if (E0 > 0 && n1 >= 1) {
      y3.ok = true; y3.years = [];
      var prevEb = E0;
      for (var yi = 0; yi <= Math.min(4, n1 - 1); yi++) {
        var lm = lifeM(yi), req = yi === 0 ? E0 : invertNet(lm * 12, share1), ebn = Math.max(req, prevEb);
        y3.years.push({ an: yi, age: varsta + yi, life: lm, eb: ebn, CA: s.ca * ebn / E0, div: yi === 0 ? divNet(E0, share1).net : lm * 12, g: yi === 0 ? 0 : ebn / prevEb - 1, covered: yi > 0 && req <= prevEb });
        prevEb = ebn;
      }
      var last3 = y3.years[y3.years.length - 1];
      y3.h = last3.an; y3.X = last3.eb / E0; y3.g = y3.h > 0 ? Math.pow(y3.X, 1 / y3.h) - 1 : 0; y3.CA = last3.CA; y3.need = last3.life * 12; y3.eb = last3.eb;
    }
    return {
      prov: PROV, g1: g1, Y4: Y4, need4: need4,
      lifeOnly: (function () {
        var last = Math.max(0, Math.min(4, n1 - 1)), o = { ok: E0 > 0 && n1 >= 2, yrs: last, toAge: varsta + last, lifeLast: lifeM(last) };
        o.div = o.lifeLast * 12; o.eb = invertNet(o.div, share1); o.pn = o.eb / kE; o.X = E0 > 0 ? o.eb / E0 : NaN; o.CA = s.ca * o.X; o.g = last > 0 ? Math.pow(o.X, 1 / last) - 1 : 0;
        o.tot = o.div * o.yrs; o.tot03 = 0; for (var q = 0; q < Math.min(4, n1); q++) o.tot03 += lifeAt(q);
        return o;
      })(),
      L1b: L1b, life1Tot: life1Tot, y3: y3, rampM: rampM, lifeNow: L1use * 12, L1in: L1, capMonth: capMonth,
      R: R, varsta: varsta, E: E, n1: n1, n2: n2, rr: rr, L1: L1use, L2: L2, OO1: OO1, OO2: OO2, OO2pv: OO2pv, cnt1: cnt1, cnt2: cnt2, ooAt: ooAt,
      urg1: urg1, urg2: urg2, F1: F1, F2: F2, FN: FN, FNsimple: FNsimple, intact: intact,
      share1: share1, div0: divNet(E0, share1), E0: E0, pn0: pn0, marja: s.ca > 0 ? pn0 / s.ca : NaN, kE: kE,
      keep: keep, M0: M0, MT: MT, V0: V0, VT0: VT0, ind: ind, meth: meth, valAzi: V0.ours,
      r1: r1, A: A, ebNec: ebNec, gap1: base.gap,
      w1: solve('div', 0), w2: solve('sale', 'tinta'), w2b: solve('sale', 'azi'), w3: solve3()
    };
  }

  /* ---------- componente ---------- */
  function fmtK(k) { return PCT_KEYS[k] ? nf2.format(state[k]) : nf0.format(state[k]); }
  function fld(k, label, unit, help, small) {
    return '<div class="frow"><label for="f_' + k + '">' + label + (help ? '<small>' + help + '</small>' : '') + '</label>' +
      '<span class="mini"><button type="button" data-k="' + k + '" data-d="-1" aria-label="Scade">−</button><input id="f_' + k + '" data-k="' + k + '" class="' + (small ? 's' : '') + '" inputmode="decimal" value="' + fmtK(k) + '"><button type="button" data-k="' + k + '" data-d="1" aria-label="Crește">+</button></span>' +
      '<span class="u">' + (unit || '') + '</span></div>';
  }
  function setK(k, v) {
    var L = LIM[k]; if (!L || isNaN(v)) return;
    state[k] = Math.min(L[2], Math.max(L[1], Math.round(v * 100) / 100));
  }
  function verdictHtml(gap, cap, fn, runOut, c, extra) {
    if (isNaN(gap)) return '<p class="verdict no">Freedom number nu se poate calcula cu capitalul intact la un randament real negativ.<small>Alege „consumăm capitalul” sau un randament mai mare decât inflația.</small></p>';
    if (gap <= 0) return '<p class="verdict ok">Acoperă. La ' + c.R + ' de ani ai ' + shortEur(cap) + ', cu ' + shortEur(-gap) + ' peste freedom number.<small>' + (extra || 'Banii ajung până la ' + ani(c.E) + '.') + '</small></p>';
    return '<p class="verdict no">Lipsesc ' + shortEur(gap) + ' la ' + c.R + ' de ani.<small>' +
      (runOut ? 'Banii se termină la ' + ani(runOut) + ', cu ' + ani(c.E - runOut) + ' înainte de capăt.' : 'Banii ajung până la ' + ani(c.E) + ', dar capitalul nu rămâne întreg.') + (extra ? ' ' + extra : '') + '</small></p>';
  }
  function dl(items) { return items.map(function (it) { return '<div' + (it[2] ? ' class="tot"' : '') + '><dt>' + it[0] + '</dt><dd>' + it[1] + '</dd></div>'; }).join(''); }

  /* linia timpului (din prezentare) */
  function timelineSVG(c, level) {
    level = level || 3;
    var A0 = Math.min(30, Math.floor(c.varsta / 10) * 10), A1 = Math.max(100, Math.ceil(c.E / 10) * 10), W = 1000, L = 40, R = 40, axisY = 128;
    function X(a) { return L + (Math.min(A1, Math.max(A0, a)) - A0) / (A1 - A0) * (W - L - R); }
    var f = 'Inter, sans-serif', fd = 'Inter Tight, Inter, sans-serif', o = [];
    o.push('<svg viewBox="0 0 ' + W + ' 200" role="img" aria-label="Linia timpului" class="tl-svg">');
    o.push('<line x1="' + L + '" x2="' + (W - R) + '" y1="' + axisY + '" y2="' + axisY + '" stroke="var(--line)" stroke-width="4" stroke-linecap="round"/>');
    for (var a = A0; a <= A1; a += 10) {
      o.push('<line x1="' + X(a) + '" x2="' + X(a) + '" y1="' + (axisY - 6) + '" y2="' + (axisY + 6) + '" stroke="var(--muted)" stroke-width="2"/>');
      o.push('<text x="' + X(a) + '" y="' + (axisY + 30) + '" text-anchor="middle" fill="var(--muted)" font-size="18" font-family="' + f + '">' + a + '</text>');
    }
    function seg(a, b, color, label) {
      if (b <= a) return;
      o.push('<rect x="' + X(a) + '" y="' + (axisY - 12) + '" width="' + (X(b) - X(a)) + '" height="24" rx="6" fill="' + color + '"/>');
      o.push('<text x="' + ((X(a) + X(b)) / 2) + '" y="' + (axisY - 24) + '" text-anchor="middle" fill="' + color + '" font-size="19" font-weight="600" font-family="' + f + '">' + label + '</text>');
    }
    function post(a, label, anchor) {
      var x = X(a), dx = anchor === 'end' ? 10 : anchor === 'start' ? -10 : 0;
      o.push('<line x1="' + x + '" x2="' + x + '" y1="' + (axisY - 70) + '" y2="' + (axisY + 12) + '" stroke="var(--ink)" stroke-width="3"/>');
      o.push('<circle cx="' + x + '" cy="' + (axisY - 70) + '" r="7" fill="var(--ink)"/>');
      o.push('<text x="' + (x + dx) + '" y="' + (axisY - 82) + '" text-anchor="' + anchor + '" fill="var(--ink)" font-size="21" font-weight="700" font-family="' + fd + '">' + label + '</text>');
    }
    if (level === 1) [[80, 'bărbați 80'], [84, 'femei 84']].forEach(function (r, i) {
      o.push('<line x1="' + X(r[0]) + '" x2="' + X(r[0]) + '" y1="' + (axisY - 14) + '" y2="' + (axisY + 14) + '" stroke="var(--muted)" stroke-width="2" stroke-dasharray="3 3"/>');
      o.push('<text x="' + X(r[0]) + '" y="' + (axisY + 56) + '" text-anchor="' + (i ? 'start' : 'end') + '" fill="var(--muted)" font-size="16" font-family="' + f + '">' + r[1] + '</text>');
    });
    if (level >= 2) seg(c.R, c.E, 'var(--cabinet)', ani(c.n2) + ' · capitolul următor');
    if (level >= 3) seg(c.varsta, c.R, 'var(--accent)', ani(c.n1) + ' productivi');
    if (level >= 3) post(c.varsta, 'azi · ' + c.varsta, 'end');
    if (level >= 2) post(c.R, 'munca în cui · ' + c.R, 'middle');
    post(c.E, 'capătul · ' + c.E, 'start');
    o.push('</svg>');
    return o.join('');
  }

  /* graficul capitalului */
  function niceStep(raw) { var q = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / q; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * q; }
  function chartSVG(c, series, need) {
    var W = 900, H = 360, L = 84, R = 24, T = 24, B = 44, x0 = c.varsta, x1 = c.E, max = need || 0;
    series.forEach(function (s) { s.sim.pts.forEach(function (q) { if (q.c > max) max = q.c; }); });
    var top = Math.max(max, 1000) * 1.08, ys = niceStep(top / 5), yMax = Math.ceil(top / ys) * ys;
    function X(a) { return L + (a - x0) / Math.max(1, x1 - x0) * (W - L - R); }
    function Y(v) { return T + (1 - Math.max(0, v) / yMax) * (H - T - B); }
    var f = 'Inter, sans-serif', o = ['<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Capitalul pe ani">'];
    o.push('<rect x="' + X(c.R) + '" y="' + T + '" width="' + (X(x1) - X(c.R)) + '" height="' + (H - T - B) + '" fill="var(--cabinet-soft)"/>');
    for (var v = 0; v <= yMax + 1; v += ys) {
      o.push('<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="var(--line)" stroke-width="1"/>');
      o.push('<text x="' + (L - 10) + '" y="' + (Y(v) + 5) + '" text-anchor="end" fill="var(--muted)" font-size="14" font-family="' + f + '">' + (v === 0 ? '0' : shortEur(v)) + '</text>');
    }
    var xs = (x1 - x0) > 40 ? 10 : 5;
    for (var a = Math.ceil(x0 / xs) * xs; a <= x1; a += xs) o.push('<text x="' + X(a) + '" y="' + (H - B + 24) + '" text-anchor="middle" fill="var(--muted)" font-size="14" font-family="' + f + '">' + a + '</text>');
    o.push('<line x1="' + X(c.R) + '" x2="' + X(c.R) + '" y1="' + T + '" y2="' + (H - B) + '" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="4 5"/>');
    o.push('<text x="' + (X(c.R) + 8) + '" y="' + (T + 16) + '" fill="var(--muted)" font-size="14" font-family="' + f + '">capitolul următor · ' + c.R + '</text>');
    if (need && need > 0) {
      o.push('<circle cx="' + X(c.R) + '" cy="' + Y(need) + '" r="6" fill="none" stroke="var(--ink)" stroke-width="2.5"/>');
      o.push('<text x="' + (X(c.R) - 10) + '" y="' + (Y(need) - 10) + '" text-anchor="end" fill="var(--ink)" font-size="14" font-weight="600" font-family="' + f + '">freedom number ' + shortEur(need) + '</text>');
    }
    series.forEach(function (s, idx) {
      var d = s.sim.pts.map(function (q, i) { return (i ? 'L' : 'M') + X(q.age).toFixed(1) + ' ' + Y(q.c).toFixed(1); }).join(' ');
      o.push('<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="3.5" stroke-linejoin="round"' + (s.dash ? ' stroke-dasharray="10 7"' : '') + '/>');
      if (s.sim.runOut !== null) {
        var cx = X(s.sim.runOut), cy = Y(0), anchor = cx > W - 220 ? 'end' : 'start';
        o.push('<circle cx="' + cx + '" cy="' + cy + '" r="6" fill="' + s.color + '" stroke="var(--surface)" stroke-width="2"/>');
        o.push('<text x="' + (cx + (anchor === 'end' ? -10 : 10)) + '" y="' + (cy - 12 - idx * 18) + '" text-anchor="' + anchor + '" fill="' + s.color + '" font-size="14" font-weight="600" font-family="' + f + '">se termină la ' + s.sim.runOut + '</text>');
      }
    });
    o.push('<text x="' + (W - R) + '" y="' + (H - 6) + '" text-anchor="end" fill="var(--muted)" font-size="13" font-family="' + f + '">vârsta</text></svg>');
    return o.join('');
  }
  function tableHtml(sim, opts) {
    var head = ['Vârsta', 'Capitol', 'Capital la început'].concat(opts.sale ? ['Vânzarea firmei'] : []).concat(['Fonduri de siguranță', 'Randament', 'Dividende nete', 'Lifestyle', 'One-off']).concat(opts.def ? ['Neplătit'] : []).concat(['Capital la final', 'Din care fonduri']);
    var body = sim.rows.map(function (r, i) {
      var cells = [r.age + '–' + (r.age + 1), r.ch === 1 ? 'productiv' : 'următor', eur(r.start)];
      if (opts.sale) cells.push(r.sale ? signed(r.sale) : '');
      cells.push(signed(r.fond), signed(r.growth), signed(r.div), signed(r.life), signed(r.oo));
      if (opts.def) cells.push(r.def ? '<span class="neg">' + signed(r.def) + '</span>' : '');
      cells.push('<span' + (r.end < 0 ? ' class="neg"' : '') + '>' + eur(r.end + r.res) + '</span>', eur(r.res));
      var edge = i > 0 && r.ch === 2 && sim.rows[i - 1].ch === 1;
      return '<tr class="c' + r.ch + (edge ? ' edge' : '') + '">' + cells.map(function (v) { return '<td>' + v + '</td>'; }).join('') + '</tr>';
    }).join('');
    var inner = '<div class="ytable"><table><thead><tr>' + head.map(function (t) { return '<th>' + t + '</th>'; }).join('') + '</tr></thead><tbody>' + body + '</tbody></table></div>' +
      '<p class="note small" style="margin-top:8px">Euro de azi (reali). Fluxurile se înregistrează la final de an; randamentul se aplică soldului de la început. „Capital la final” include fondurile de siguranță, care stau deoparte fără randament real. Un sold negativ arată cât lipsește; lipsa nu produce randament.</p>';
    return opts.flat ? inner : '<details class="yt"><summary>Vezi desfășurătorul anual</summary>' + inner + '</details>';
  }

  /* ---------- paginile ---------- */
  var PAGES = [
    { id: 'qSperanta', t: 'Speranța de viață' },
    { id: 'qRetragere', t: 'Munca în cui' },
    { id: 'qAni', t: 'Anii productivi' },
    { id: 'timp', t: 'Imaginea de ansamblu' },
    { id: 'firma', t: 'Firma azi' },
    { id: 'buget', t: 'Lifestyle lunar' },
    { id: 'oneoff', t: 'One-off' },
    { id: 'fonduri', t: 'Fonduri de siguranță' },
    { id: 'productivi', t: 'Anii productivi' },
    { id: 'freedom', t: 'Freedom number' },
    { id: 'cai1', t: 'Calea 1 · cum funcționează' },
    { id: 'cai2', t: 'Calea 2 · cum funcționează' },
    { id: 'cai3', t: 'Calea 3 · cum funcționează' },
    { id: 'cale1', t: 'Calea 1 · Economii' },
    { id: 'multiplu', t: 'Multiplul firmei' },
    { id: 'cale2', t: 'Calea 2 · Vânzare' },
    { id: 'cale3', t: 'Calea 3 · Board' },
    { id: 'concluzii', t: 'Concluzii' },
    { id: 'ritm1', t: 'Ritmul · unde ești' },
    { id: 'ritmA', t: 'Ritmul · ce vrei să nu pierzi' },
    { id: 'ritmB', t: 'Ritmul · ce ține cu scotch' },
    { id: 'ritmC', t: 'Ritmul · ce s-ar rupe' },
    { id: 'ritm2', t: 'Ritmul · tabelul' },
    { id: 'ritm3', t: 'Ritmul · de ce' },
    { id: 'munte', t: 'Urcarea muntelui' },
    { id: 'anEnt', t: 'Anul antreprenorial' },
    { id: 'dest', t: 'Harta destinației' },
    { id: 'plan', t: 'Harta călătoriei · flat vs buget' },
    { id: 'tIntro', t: 'Contractul cu firma' },
    { id: 'tIntro2', t: 'Cei cinci termeni · T.E.R.M.S.' },
    { id: 'tT', t: 'T · Timp' },
    { id: 'tE', t: 'E · Energie și efort' },
    { id: 'tR', t: 'R · Resurse' },
    { id: 'tM', t: 'M · Mediu' },
    { id: 'tS', t: 'S · Sănătate' },
    { id: 'contract', t: 'Contractul de semnat' }
  ];
  var cur = null, C = null, container = null, pageId = null, opts = {};
  function h(html) { var d = document.createElement('div'); d.className = 'page'; d.innerHTML = html; return d; }
  function out(page, k, v) { page.querySelectorAll('[data-o="' + k + '"]').forEach(function (el) { el.innerHTML = v; }); }

  var R = {};
  function question(k, q, unit, note, level) {
    return {
      html: function () {
        return '<div class="eyebrow">Timpul pe care îl avem</div><h1 class="q">' + q + '</h1>' +
          '<div class="entry"><div class="big-step"><button type="button" data-k="' + k + '" data-d="-1" aria-label="Scade">−</button><input id="f_' + k + '" data-k="' + k + '" inputmode="numeric" aria-label="' + esc(q) + '" value="' + fmtK(k) + '"><button type="button" data-k="' + k + '" data-d="1" aria-label="Crește">+</button></div><span class="unit">' + unit + '</span></div>' +
          (note ? '<p class="note">' + note + '</p>' : '') + '<p class="askq" data-o="line"></p><div class="tl" data-o="tl"></div>';
      },
      update: function (p, c) {
        out(p, 'tl', timelineSVG(c, level));
        out(p, 'line', level === 3 ? 'Vârsta de azi: <b>' + c.varsta + '</b> (' + c.R + ' − ' + c.n1 + ')' : '');
      }
    };
  }
  R.qSperanta = question('speranta', 'Care este speranța ta de viață?', 'ani', 'Eurostat 2024: la 65 de ani, un bărbat din România ajunge în medie la 80 de ani, o femeie la 84.', 1);
  R.qRetragere = question('retragere', 'La ce vârstă vrei să pui munca în cui?', 'ani', 'De aici începe capitolul următor: munca trece pe planul doi, pe planul trei sau iese din imagine.', 2);
  R.qAni = question('aniRamasi', 'Câți ani mai ai până atunci?', 'ani', 'Anii productivi: încă muncim și încă facem bani.', 3);
  R.timp = {
    html: function () {
      return '<div class="eyebrow">Timpul pe care îl avem</div><h1 class="q">Imaginea de ansamblu</h1>' +
        '<div class="trio">' +
        '<div class="cell"><div class="k">Vârsta de azi</div><div class="v" data-o="age"></div><div class="k" data-o="ageH"></div></div>' +
        '<div class="cell"><div class="k">Anii productivi</div><div class="v" data-o="n1" style="color:var(--accent)"></div><div class="k" data-o="n1H"></div></div>' +
        '<div class="cell"><div class="k">Anii capitolului următor</div><div class="v" data-o="n2" style="color:var(--cabinet)"></div><div class="k" data-o="n2H"></div></div>' +
        '</div><div class="tl" data-o="tl"></div><p class="concl" data-o="concl"></p>' +
        '<p class="note">Pentru fiecare capitol calculăm trei sume: lifestyle-ul lunar, one-off-urile și fondurile de siguranță.</p>';
    },
    update: function (p, c) {
      out(p, 'age', c.varsta); out(p, 'ageH', c.R + ' − ' + c.n1);
      out(p, 'n1', c.n1); out(p, 'n1H', 'de la ' + c.varsta + ' la ' + c.R);
      out(p, 'n2', c.n2); out(p, 'n2H', c.E + ' − ' + c.R);
      out(p, 'tl', timelineSVG(c, 3));
      out(p, 'concl', '<span class="a">' + ani(c.n1) + ' de muncă</span> trebuie să plătească <span class="b">' + ani(c.n2) + ' de capitol următor</span>.');
    }
  };

  function findItem(id) { var r = null; state.cats.forEach(function (g) { g.items.forEach(function (it) { if (it.id === id) r = it; }); }); return r; }
  function bInput(it, col) {
    return '<td><input id="b_' + it.id + '_' + col + '" data-b="' + it.id + '" data-c="' + col + '" inputmode="decimal" aria-label="' + esc(it.n) + ([', anul 0', ', din anul 4', ', capitolul următor'][col]) + '" value="' + nf0.format(it.v[col]) + '"' + (+it.v[col] ? '' : ' class="zero"') + '></td>';
  }
  R.buget = {
    html: function () {
      return '<div class="eyebrow">Suma 1 · Lifestyle asigurat de companie</div><h1 class="q">Cum trăiești astăzi vs cum ți-ai dori să trăiești peste 4 ani</h1>' +
        '<details class="panel"><summary>Cum completezi</summary><p class="note">Euro pe lună, în banii de azi, pentru toată familia. Anul 0 este azi și e limitat la dividendul pe care îl poți ridica din firmă. Anii 1, 2 și 3 cresc procentual față de anul anterior. Din anul 4 până la sfârșitul anilor productivi și în capitolul următor completezi manual, în tabel. Deschide o categorie ca să completezi subcategoriile, să adaugi altele sau să le elimini pe cele care nu te privesc. Ce dispare în capitolul următor (rata, școala copiilor) se trece cu zero.</p></details>' +
        '<div data-o="capline"></div>' +
        '<div class="yrbox">' +
        '<div class="indc"><div class="ih"><span class="k">Anul 0 · azi</span></div><div class="iv" data-o="y0"></div><div class="is" data-o="y0s"></div></div>' +
        [1, 2, 3].map(function (i) { return '<div class="indc"><div class="ih"><span class="k">Anul ' + i + '</span></div><div class="iv" data-o="y' + i + '"></div><div class="is">pe lună</div>' + fld('ramp' + i, 'Creștere', '%', 'față de anul ' + (i - 1), true) + '</div>'; }).join('') +
        '<div class="indc"><div class="ih"><span class="k">Din anul 4</span></div><div class="iv" data-o="y4"></div><div class="is" data-o="y4s"></div></div>' +
        '</div>' +
        '<div class="btable"><table><colgroup><col><col class="v"><col class="v"><col class="v"></colgroup><thead><tr><th><button type="button" class="chip thbtn" id="openAll">Deschide toate categoriile</button></th><th class="c1">Anul 0<small class="thu">€/lună</small></th><th class="c3">Din anul 4<small class="thu">€/lună</small></th><th class="c2">Capitolul următor<small class="thu">€/lună</small></th></tr></thead><tbody id="bBody"></tbody>' +
        '<tfoot><tr><td>Total pe lună</td><td class="c1" data-o="L1"></td><td class="c3" data-o="L1b"></td><td class="c2" data-o="L2"></td></tr><tr><td>Total pe an</td><td data-o="Y1"></td><td data-o="Y1b"></td><td data-o="Y2"></td></tr></tfoot></table></div>';
    },
    body: function (p) {
      p.querySelector('#bBody').innerHTML = state.cats.map(function (g, gi) {
        var head = '<tr class="grp' + (g.open ? ' open' : '') + '"><td><button type="button" class="gt" data-gt="' + gi + '" aria-expanded="' + g.open + '"><span class="chev">▸</span><span class="nmg">' + esc(g.g) + '</span><span class="cnt">' + g.items.length + '</span></button></td><td class="c1" data-o="ga' + gi + '"></td><td class="c3" data-o="gm' + gi + '"></td><td class="c2" data-o="gb' + gi + '"></td></tr>';
        if (!g.open) return head;
        return head + g.items.map(function (it) {
          var nm = it.custom ? '<input class="nm" id="bn_' + it.id + '" data-bn="' + it.id + '" value="' + esc(it.n) + '" aria-label="Numele subcategoriei">' : '<span>' + esc(it.n) + '</span>';
          return '<tr class="sub"><td><div class="sn">' + nm + '<button type="button" class="rm" data-rm="' + it.id + '" aria-label="Elimină ' + esc(it.n) + '" title="Elimină subcategoria">×</button></div></td>' + bInput(it, 0) + bInput(it, 1) + bInput(it, 2) + '</tr>';
        }).join('') + '<tr class="add"><td colspan="4"><button type="button" class="addsub" data-add="' + gi + '">+ Adaugă subcategorie</button></td></tr>';
      }).join('');
    },
    bind: function (p) {
      var self = this; self.body(p);
      var oa = p.querySelector('#openAll');
      function syncOA() { oa.textContent = state.cats.every(function (g) { return g.open; }) ? 'Închide toate categoriile' : 'Deschide toate categoriile'; }
      syncOA();
      oa.addEventListener('click', function () { var all = state.cats.every(function (g) { return g.open; }); state.cats.forEach(function (g) { g.open = !all; }); self.body(p); syncOA(); changed(); });
      p.querySelector('#bBody').addEventListener('click', function (e) {
        var t = e.target.closest('[data-gt]');
        if (t) { var g = state.cats[+t.getAttribute('data-gt')]; g.open = !g.open; self.body(p); syncOA(); changed(); return; }
        var r = e.target.closest('[data-rm]');
        if (r) { var id = r.getAttribute('data-rm'); state.cats.forEach(function (g) { g.items = g.items.filter(function (it) { return it.id !== id; }); }); self.body(p); changed(); return; }
        var a = e.target.closest('[data-add]');
        if (a) {
          var nid = 'x' + Date.now().toString(36);
          state.cats[+a.getAttribute('data-add')].items.push({ id: nid, n: 'Subcategorie nouă', v: [0, 0, 0], custom: true });
          self.body(p); changed();
          var ni = p.querySelector('#bn_' + nid); if (ni) { ni.focus(); ni.select(); }
        }
      });
      p.querySelector('#bBody').addEventListener('change', function (e) {
        var id = e.target.getAttribute('data-bn'); if (!id) return;
        var it = findItem(id); if (it) { it.n = e.target.value.trim().slice(0, 60) || 'Subcategorie nouă'; e.target.value = it.n; changed(); }
      });
    },
    update: function (p, c) {
      var over = c.L1in > c.capMonth + 0.5;
      out(p, 'capline', '<div class="capban' + (over ? ' over' : '') + '"><div class="lbl">Concluzie · lifestyle asigurat de companie</div>' +
        '<div class="txt">Conform cifrelor companiei, în acest moment poți alege un lifestyle de</div><div class="big">' + eur(c.capMonth) + ' <small>pe lună</small></div>' +
        '<div class="row"><div><b>' + eur(c.capMonth * 12) + '</b>dividend net pe an</div><div><b>' + eur(c.L1in) + '</b>ai trecut în anul 0</div><div><b>' + (over ? '+' + eur(c.L1in - c.capMonth) : eur(c.capMonth - c.L1in)) + '</b>' + (over ? 'peste ce îți poate plăti firma; în calcul folosim maximul' : 'rămân neutilizați pe lună') + '</div></div></div>');
      out(p, 'y0', eur(c.L1)); out(p, 'y0s', 'pe lună' + (over ? ' · plafonat la dividend' : ' · din tabel'));
      [1, 2, 3].forEach(function (i) { out(p, 'y' + i, eur(c.L1 * c.rampM[i])); });
      out(p, 'y4', eur(c.L1b)); out(p, 'y4s', 'pe lună · manual, din tabel, până la ' + ani(c.R));
      out(p, 'L1', '<span' + (over ? ' class="overv" title="Peste dividendul net"' : '') + '>' + eur(c.L1in) + '</span>'); out(p, 'L1b', eur(c.L1b)); out(p, 'L2', eur(c.L2)); out(p, 'Y1', eur(c.L1in * 12)); out(p, 'Y1b', eur(c.L1b * 12)); out(p, 'Y2', eur(c.L2 * 12));
      state.cats.forEach(function (g, gi) {
        var a = 0, m = 0, b = 0; g.items.forEach(function (it) { a += +it.v[0]; m += +it.v[1]; b += +it.v[2]; });
        out(p, 'ga' + gi, eur(a)); out(p, 'gm' + gi, eur(m)); out(p, 'gb' + gi, eur(b));
      });
    }
  };

  R.oneoff = {
    html: function () {
      return '<div class="eyebrow">Suma 2 · One-off-urile</div><h1 class="q">Ce se întâmplă o singură dată</h1>' +
        '<details class="panel"><summary>Cum completezi</summary><p class="note">Deschide o categorie și adaugă ce te privește: nume, vârsta ta la care se întâmplă și suma. Aplicația o așază singură în anii productivi sau în capitolul următor. Cu × elimini o plată care nu te privește.</p></details>' +
        '<div class="oohdr"><button type="button" class="chip thbtn" id="ooAll">Deschide toate categoriile</button><div class="oot"><span class="c1">Anii productivi<small>€</small></span><span class="c2">Capitolul următor<small>€</small></span></div></div>' +
        '<div class="oo" id="ooList"></div>' +
        '<div class="grid2"><div class="panel"><div class="ph-t" style="color:var(--accent)">Anii productivi</div><div class="facts"><div class="fact ac"><div class="k">Total one-off</div><div class="v" data-o="o1"></div><div class="how" data-o="o1n"></div></div></div></div>' +
        '<div class="panel"><div class="ph-t" style="color:var(--cabinet)">Capitolul următor</div><div class="facts"><div class="fact hi"><div class="k">Total one-off</div><div class="v" data-o="o2"></div><div class="how" data-o="o2n"></div></div></div></div></div>';
    },
    list: function (p) {
      p.querySelector('#ooList').innerHTML = OO_GROUPS.map(function (gn, gi) {
        var items = state.oneoff.filter(function (o) { return o.g === gi; }), open = !!state.ooOpen[gi];
        var head = '<div class="oohead"><button type="button" class="gt" data-ogt="' + gi + '" aria-expanded="' + open + '"><span class="chev">▸</span><span class="nmg">' + esc(gn) + '</span><span class="cnt">' + items.length + '</span></button>' +
          '<div class="oot"><span class="c1" data-o="og1_' + gi + '"></span><span class="c2" data-o="og2_' + gi + '"></span></div></div>';
        if (!open) return '<div class="oog">' + head + '</div>';
        return '<div class="oog open">' + head + '<div class="oobody">' + items.map(function (o) {
          return '<div class="oo-row" data-id="' + o.id + '"><input class="nm" id="oo_n_' + o.id + '" data-oo="nume" value="' + esc(o.nume) + '" aria-label="Subcategoria">' +
            '<label for="oo_v_' + o.id + '">la vârsta <input class="num age" id="oo_v_' + o.id + '" data-oo="varsta" inputmode="numeric" value="' + o.varsta + '"></label>' +
            '<label for="oo_s_' + o.id + '">suma <input class="num" id="oo_s_' + o.id + '" data-oo="suma" inputmode="decimal" value="' + nf0.format(o.suma) + '"> €</label>' +
            '<span class="pill" data-cap="' + o.id + '"></span><button type="button" class="rm" data-deloo="' + o.id + '" aria-label="Elimină ' + esc(o.nume) + '" title="Elimină subcategoria">×</button></div>';
        }).join('') + '<button type="button" class="addsub" data-addoo="' + gi + '" style="align-self:flex-start">+ Adaugă subcategorie</button></div></div>';
      }).join('');
    },
    bind: function (p) {
      var self = this, box = p.querySelector('#ooList'), oa = p.querySelector('#ooAll');
      function syncOA() { oa.textContent = state.ooOpen.every(Boolean) ? 'Închide toate categoriile' : 'Deschide toate categoriile'; }
      self.list(p); syncOA();
      oa.addEventListener('click', function () { var all = state.ooOpen.every(Boolean); state.ooOpen = state.ooOpen.map(function () { return !all; }); self.list(p); syncOA(); changed(); });
      box.addEventListener('click', function () { setTimeout(syncOA, 0); });
      box.addEventListener('click', function (e) {
        var t = e.target.closest('[data-ogt]');
        if (t) { var gi = +t.getAttribute('data-ogt'); state.ooOpen[gi] = !state.ooOpen[gi]; self.list(p); changed(); return; }
        var b = e.target.closest('[data-deloo]');
        if (b) { var id = +b.getAttribute('data-deloo'); state.oneoff = state.oneoff.filter(function (o) { return o.id !== id; }); self.list(p); changed(); return; }
        var a = e.target.closest('[data-addoo]');
        if (a) {
          var nid = state.oneoff.reduce(function (m, o) { return Math.max(m, o.id); }, 0) + 1;
          state.oneoff.push({ id: nid, g: +a.getAttribute('data-addoo'), nume: 'Subcategorie nouă', varsta: Math.min(C.R - 1, C.varsta + 5), suma: 0 });
          self.list(p); changed();
          var ni = p.querySelector('#oo_n_' + nid); if (ni) { ni.focus(); ni.select(); }
        }
      });
      box.addEventListener('change', function (e) {
        var inp = e.target, f = inp.getAttribute('data-oo'); if (!f) return;
        var id = +inp.closest('.oo-row').getAttribute('data-id'), o = state.oneoff.filter(function (x) { return x.id === id; })[0]; if (!o) return;
        if (f === 'nume') { o.nume = inp.value.trim().slice(0, 80) || 'Subcategorie nouă'; inp.value = o.nume; }
        else { var n = parseRo(inp.value); if (!isNaN(n)) o[f] = f === 'varsta' ? Math.round(Math.min(120, Math.max(0, n))) : Math.max(0, n); inp.value = f === 'varsta' ? o.varsta : nf0.format(o.suma); }
        changed();
      });
    },
    update: function (p, c) {
      out(p, 'o1', eur(c.OO1)); out(p, 'o2', eur(c.OO2));
      out(p, 'o1n', c.cnt1 + ' plăți, între ' + c.varsta + ' și ' + (c.R - 1) + ' ani');
      out(p, 'o2n', c.cnt2 + ' plăți, între ' + c.R + ' și ' + (c.E - 1) + ' ani');
      OO_GROUPS.forEach(function (gn, gi) {
        var t1 = 0, t2 = 0;
        state.oneoff.forEach(function (o) { if (o.g !== gi) return; var a = Math.round(o.varsta); if (a < c.varsta || a >= c.E) return; if (a < c.R) t1 += +o.suma || 0; else t2 += +o.suma || 0; });
        out(p, 'og1_' + gi, eur(t1) + '<small>anii productivi</small>'); out(p, 'og2_' + gi, eur(t2) + '<small>capitolul următor</small>');
      });
      state.oneoff.forEach(function (o) {
        var el = p.querySelector('[data-cap="' + o.id + '"]'); if (!el) return;
        var a = Math.round(o.varsta);
        if (a < c.varsta || a >= c.E) { el.className = 'pill out'; el.textContent = 'în afara calculului'; }
        else if (a < c.R) { el.className = 'pill c1'; el.textContent = 'anii productivi'; }
        else { el.className = 'pill c2'; el.textContent = 'capitolul următor'; }
      });
    }
  };

  R.fonduri = {
    html: function () {
      return '<div class="eyebrow">Suma 3 · Fondurile de siguranță</div><h1 class="q">Banii care nu se ating</h1>' +
        '<details class="panel"><summary>Cum completezi</summary><p class="note">Fondul de urgență acoperă câteva luni de lifestyle. Fondul de sănătate acoperă o intervenție sau un tratament mare. Ambele stau deoparte, lichide, fără randament real. Fondurile se construiesc din dividende, în primii ani productivi; cele din anii productivi trec mai departe în capitolul următor, unde se completează doar diferența.</p></details>' +
        '<div class="indg"><div class="indc urgc"><div class="ih"><span class="k">Fondul de urgență</span></div><div class="iv" data-o="uMain"></div><div class="is">de lifestyle, ținute deoparte</div>' +
        '<div class="iv2"><div><div class="iv" data-o="u1b"></div><div class="is">anii productivi</div></div><div><div class="iv" data-o="u2b"></div><div class="is">capitolul următor</div></div></div>' +
        fld('urgLuni', 'Câte luni de lifestyle', 'luni', '', true) + fld('aniFonduri', 'În câți ani îl construiești', 'ani', 'din dividende, la începutul anilor productivi', true) + '</div></div>' +
        '<div class="grid2">' +
        '<div class="panel chap"><h3>Anii productivi</h3><div class="sum3 nolet"><div><span class="n"></span><span class="t">Fond de urgență<small data-o="u1h"></small></span><span class="a" data-o="u1"></span></div>' +
        '<div><span class="n"></span><span class="t">Fond de sănătate</span><span class="a">' + '<span class="mini"><button type="button" data-k="sanatate1" data-d="-1" aria-label="Scade">−</button><input id="f_sanatate1" data-k="sanatate1" inputmode="decimal" value="' + fmtK('sanatate1') + '"><button type="button" data-k="sanatate1" data-d="1" aria-label="Crește">+</button></span></span></div>' +
        '<div><span class="n"></span><span class="t">Total fonduri</span><span class="a" data-o="F1"></span></div></div></div>' +
        '<div class="panel chap two"><h3>Capitolul următor</h3><div class="sum3 nolet"><div><span class="n"></span><span class="t">Fond de urgență<small data-o="u2h"></small></span><span class="a" data-o="u2"></span></div>' +
        '<div><span class="n"></span><span class="t">Fond de sănătate</span><span class="a"><span class="mini"><button type="button" data-k="sanatate2" data-d="-1" aria-label="Scade">−</button><input id="f_sanatate2" data-k="sanatate2" inputmode="decimal" value="' + fmtK('sanatate2') + '"><button type="button" data-k="sanatate2" data-d="1" aria-label="Crește">+</button></span></span></div>' +
        '<div><span class="n"></span><span class="t">Total fonduri<small>fondurile din anii productivi trec mai departe; se completează diferența</small></span><span class="a" data-o="F2"></span></div></div></div></div>';
    },
    update: function (p, c) {
      out(p, 'u1', eur(c.urg1)); out(p, 'u2', eur(c.urg2)); out(p, 'F1', eur(c.F1)); out(p, 'F2', eur(c.F2));
      out(p, 'u1h', state.urgLuni + ' × ' + eur(c.L1)); out(p, 'u2h', state.urgLuni + ' × ' + eur(c.L2));
      out(p, 'uMain', state.urgLuni + (state.urgLuni === 1 ? ' lună' : ' luni')); out(p, 'u1b', eur(c.urg1)); out(p, 'u2b', eur(c.urg2));
    }
  };

  function chapCard(n, c) {
    var one = n === 1, L = one ? c.L1 : c.L2, yrs = one ? c.n1 : c.n2, lifeTot = one ? c.life1Tot : c.L2 * 12 * c.n2;
    return '<div class="panel chap' + (one ? '' : ' two') + '"><h3>' + (one ? 'Anii productivi' : 'Capitolul următor') + '</h3>' +
      '<div class="sub">' + (one ? c.varsta + '–' + c.R : c.R + '–' + c.E) + ' · ' + ani(yrs) + '</div><div class="sum3">' +
      '<div><span class="n">1</span><span class="t">Lifestyle<small>' + (one && c.n1 > 1 ? eur(c.L1) + ' pe lună în anul 0, crescând până la ' + eur(c.L1 * c.rampM[3]) + ' în anul 3, apoi ' + eur(c.L1b) + ' pe lună' : eur(L) + ' pe lună · ' + eur(L * 12) + ' pe an · × ' + yrs) + '</small></span><span class="a">' + shortEur(lifeTot) + '</span></div>' +
      '<div><span class="n">2</span><span class="t">One-off<small>' + (one ? c.cnt1 : c.cnt2) + ' evenimente</small></span><span class="a">' + shortEur(one ? c.OO1 : c.OO2) + '</span></div>' +
      '<div><span class="n">3</span><span class="t">Fonduri de siguranță<small>urgență ' + shortEur(one ? c.urg1 : c.urg2) + ' + sănătate ' + shortEur(one ? state.sanatate1 : state.sanatate2) + '</small></span><span class="a">' + shortEur(one ? c.F1 : c.F2) + '</span></div>' +
      '<div><span class="n"></span><span class="t">Total, fără randament</span><span class="a">' + shortEur(lifeTot + (one ? c.OO1 + c.F1 : c.OO2 + c.F2)) + '</span></div>' +
      '</div></div>';
  }
  var detOpen = {};
  function detBlock(key) {
    return '<button type="button" class="det-btn" data-det="' + key + '" aria-expanded="' + !!detOpen[key] + '">' + (detOpen[key] ? 'Ascunde detaliile' : 'Vezi detaliile cifrei') + '</button>' +
      '<div class="det" data-detbox="' + key + '"' + (detOpen[key] ? '' : ' hidden') + '></div>';
  }
  function bindDet(p) {
    p.querySelectorAll('[data-det]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var k = btn.getAttribute('data-det'); detOpen[k] = !detOpen[k];
        p.querySelector('[data-detbox="' + k + '"]').hidden = !detOpen[k];
        btn.textContent = detOpen[k] ? 'Ascunde detaliile' : 'Vezi detaliile cifrei';
        btn.setAttribute('aria-expanded', String(detOpen[k]));
      });
    });
  }
  R.productivi = {
    html: function () {
      return '<div class="eyebrow">Cele trei sume · anii productivi</div><h1 class="q">Cât costă anii productivi</h1>' +
        '<p class="note">Banii pe care firma trebuie să ți-i aducă până pui munca în cui: lifestyle-ul de acum, one-off-urile și fondurile de siguranță. În banii de azi, fără randament.</p>' +
        '<div class="fnbox prod"><div class="lbl" data-o="lbl"></div><div class="big" data-o="big"></div><div class="row" data-o="row"></div></div>' +
        detBlock('prod') +
        '<div class="panel jpanel" style="border-color:var(--accent)"><h2 class="sec" style="color:var(--accent)">Concluzie · cât trebuie să crească firma doar pentru lifestyle</h2><div data-o="lo"></div><div data-o="lobars"></div><div data-o="lofacts"></div></div>' +
        '<div class="panel jpanel" style="border-color:var(--teal)"><h2 class="sec" style="color:var(--teal)">Concluzie · cu one-off-urile și fondurile de siguranță puse deoparte din timp</h2><div data-o="pv"></div></div>';
    },
    bind: bindDet,
    update: function (p, c) {
      var tot = c.life1Tot + c.OO1 + c.F1;
      out(p, 'lbl', 'Anii productivi · ' + c.varsta + '–' + c.R + ' · ' + ani(c.n1));
      out(p, 'big', shortEur(tot));
      out(p, 'row', '<div><b>' + shortEur(c.n1 ? tot / c.n1 : 0) + '</b>pe an, în medie</div><div><b>' + eur(c.n1 ? tot / c.n1 / 12 : 0) + '</b>pe lună, în medie</div>');
      p.querySelector('[data-detbox="prod"]').innerHTML = chapCard(1, c);
      var o = c.lifeOnly;
      if (!o.ok) { out(p, 'lo', '<p class="note">Nu se poate calcula: firma nu are profit sau anii productivi sunt prea puțini.</p>'); out(p, 'lobars', ''); out(p, 'lofacts', ''); return; }
      out(p, 'lo', '<p class="lead-to">Ca dividendul să plătească lifestyle-ul dorit din anul ' + o.yrs + ' (' + eur(o.lifeLast) + ' pe lună), firma trebuie să ajungă în anul ' + o.yrs + ' la:</p>' +
        (o.X <= 1 ? '<p class="verdict ok">Firma de azi plătește deja acest lifestyle.<small>Nu trebuie să crească doar pentru lifestyle.</small></p>'
          : journey(c, o, 'var(--accent)', 'Cifra de afaceri în anul ' + o.yrs, '<div><div class="k">Dividend net necesar</div><div class="v">' + shortEur(o.div) + '</div><div class="s">pe an · azi ' + shortEur(c.div0.net) + '</div></div>')));
      out(p, 'lobars', o.X > 1 ? caBars(c, o, 'var(--accent)') : '');
      out(p, 'lofacts', '<div class="facts" style="margin-top:12px">' +
        '<div class="fact"><div class="k">Profit net în anul ' + o.yrs + '</div><div class="v">' + shortEur(o.pn) + '</div><div class="how">azi ' + shortEur(c.pn0) + '</div></div>' +
        '<div class="fact"><div class="k">EBITDA în anul ' + o.yrs + '</div><div class="v">' + shortEur(o.eb) + '</div><div class="how">azi ' + shortEur(c.E0) + '</div></div>' +
        '<div class="fact"><div class="k">Marja de profit net</div><div class="v">' + (isNaN(c.marja) ? '—' : pct(c.marja)) + '</div><div class="how">rămâne cea de azi</div></div></div>' +
        '<p class="note small">Din anul ' + o.yrs + ' până la ' + ani(c.R) + ' lifestyle-ul rămâne același, deci firma trebuie doar să se mențină la această cifră de afaceri. Aici e doar lifestyle-ul; one-off-urile și fondurile sunt în concluzia de mai jos, iar economiile pentru capitolul următor pe căile 1–3.</p>');
      var v = c.prov;
      if (!v.ok) { out(p, 'pv', ''); return; }
      out(p, 'pv', '<p class="lead-to">Fiecare one-off se strânge treptat, din anul 4 până în anul în care se întâmplă; fondurile de siguranță, în anii 1–' + Math.max(1, Math.min(state.aniFonduri, c.n1 - 1)) + ' (setarea de pe slide-ul 8). Dividendul necesar = lifestyle + ce pui deoparte în acel an.</p>' +
        '<div class="jstats"><div><div class="k">Cifra de afaceri maximă necesară</div><div class="v" style="color:var(--teal)">' + shortEur(v.peak) + '</div><div class="s">în anul ' + v.peakI + ', la ' + ani(v.peakY.age) + '</div></div>' +
        '<div><div class="k">Ritm constant până la vârf</div><div class="v" style="color:var(--teal)">' + (isNaN(v.g) ? '—' : gfmt(v.g)) + '</div><div class="s">' + (v.peakI > 0 ? 'pe an, ' + ani(v.peakI) + ' · ' + xfmt(v.X) : 'vârful e chiar în anul 0') + '</div></div>' +
        '<div><div class="k">Cel mai mult pus deoparte într-un an</div><div class="v">' + shortEur(v.maxProv) + '</div><div class="s">one-off-uri + fonduri de siguranță</div></div></div>' +
        provBars(c, v) +
        '<p class="note small">' + (v.lastOO >= 0 ? 'După ultimul one-off (anul ' + v.lastOO + ', la ' + ani(c.varsta + v.lastOO) + '), cifra de afaceri necesară revine la nivelul cerut de lifestyle. ' : '') + 'Barele arată cifra de afaceri necesară în fiecare an, la marja de azi: partea închisă e lifestyle-ul, partea deschisă e ce pui deoparte. Linia punctată e cifra de afaceri de azi.</p>');
    }
  };
  R.freedom = {
    html: function () {
      return '<div class="eyebrow">Cele trei sume · capitolul următor</div><h1 class="q">What’s your Freedom Number?</h1>' +
        '<p class="note">Capitalul de care ai nevoie în prima zi a capitolului următor ca să plătești lifestyle-ul, one-off-urile și fondurile de siguranță până la capăt.</p>' +
        '<div class="fnbox"><div class="lbl" data-o="lbl"></div><div class="big" data-o="fn"></div><div class="row" data-o="short"></div></div>' +
        detBlock('fn') +
        '<div class="stack"><div class="panel"><h2 class="sec">Randamentul</h2>' + fld('randament', 'Randamentul anual al investițiilor', '%') + fld('inflatie', 'Inflația anuală', '%') +
        '<div class="frow"><span>Randamentul real<small style="display:block;color:var(--muted);font-size:.78rem">(1 + randament) / (1 + inflație) − 1</small></span><b data-o="rr"></b><span class="u"></span></div>' +
        '<div class="frow"><span>Capitalul din capitolul următor</span><span class="seg" id="metoda"><button type="button" data-m="consum">Îl consumăm</button><button type="button" data-m="capital">Rămâne întreg</button></span><span class="u"></span></div>' +
        '<p class="note small" data-o="mnote"></p></div>' +
        '<div class="panel"><h2 class="sec">Economiile pe care le ai deja</h2>' + fld('economii', 'Portofoliul de libertate de azi', '€', 'economii și investiții în afara firmei') +
        '<p class="note small">Mai departe vedem din ce se plătește freedom number: din dividende, din vânzarea firmei sau din firma condusă de altcineva.</p></div></div>';
    },
    bind: function (p) {
      bindDet(p);
      p.querySelector('#metoda').addEventListener('click', function (e) { var b = e.target.closest('[data-m]'); if (!b) return; state.metoda = b.getAttribute('data-m'); changed(); });
    },
    update: function (p, c) {
      out(p, 'lbl', 'Freedom number · capitalul de care ai nevoie la ' + c.R + ' de ani · ' + ani(c.n2) + ' de capitol următor');
      out(p, 'rr', pct(c.rr));
      p.querySelectorAll('#metoda button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-m') === state.metoda)); });
      out(p, 'mnote', c.intact ? 'Capitalul rămâne întreg la final: trăiești din randament și lași moștenirea mai departe.' : 'Capitalul ajunge la zero la ' + ani(c.E) + ': trăiești din randament și din capital.');
      var box = p.querySelector('[data-detbox="fn"]');
      if (!c.FN.ok) { out(p, 'fn', '—'); out(p, 'short', '<div>Cu capitalul intact, randamentul real trebuie să fie pozitiv.</div>'); box.innerHTML = chapCard(2, c); return; }
      out(p, 'fn', shortEur(c.FN.total));
      out(p, 'short', '<div><b>' + shortEur(c.FNsimple) + '</b>fără randament</div><div><b>' + shortEur(Math.max(0, c.FNsimple - c.FN.total)) + '</b>muncesc banii pentru tine</div><div><b>' + pct(c.rr) + '</b>randament real</div>');
      box.innerHTML = chapCard(2, c) +
        '<div class="panel"><h2 class="sec">Cum se ajunge la freedom number</h2>' +
        '<p class="note">Fără randament: ' + c.n2 + ' ani × ' + eur(c.L2 * 12) + ' + ' + eur(c.OO2) + ' one-off + ' + eur(c.F2) + ' fonduri = <b>' + eur(c.FNsimple) + '</b>.</p>' +
        '<div class="phases"><div class="phase two"><div class="ph-t">Cu banii la treabă, la ' + c.R + ' de ani</div><dl>' +
        dl([['Lifestyle, ' + ani(c.n2) + (c.intact ? ' + capital întreg' : ''), eur(c.FN.life + c.FN.term)], ['One-off', eur(c.FN.oo)], ['Fonduri de siguranță', eur(c.FN.fonduri)], ['Freedom number', eur(c.FN.total), true]]) +
        '</dl></div></div></div>';
    }
  };

  R.firma = {
    html: function () {
      return '<div class="eyebrow">Viziunea se mută pe afacere</div><h1 class="q">Ce lifestyle îți poate oferi firma în acest moment</h1>' +
        '<p class="note">Pornim de la cifra de afaceri și profitul net. Sume în euro de azi; creșterea este reală, peste inflație.</p>' +
        '<div class="indg">' +
        '<div class="indc"><div class="ih"><span class="k">Cifra de afaceri</span></div><div class="iv" data-o="iCA"></div><div class="is">fără TVA, pe an</div>' + fld('ca', 'Modifică', '€') + '</div>' +
        '<div class="indc"><div class="ih"><span class="k">Profit net</span><span class="seg" id="mMod"><button type="button" data-mm="pct">Procent</button><button type="button" data-mm="suma">Sumă</button></span></div>' +
        '<div class="iv2"><div data-o="pnA"></div><div data-o="pnB"></div></div><div data-o="mfield"></div></div>' +
        '<div class="indc"><div class="ih"><span class="k">EBITDA</span></div><div class="iv" data-o="iEB"></div><div class="is" data-o="ebH"></div></div>' +
        '</div>' +
        '<div class="divbanner"><div class="lbl">Dividendul tău net, anul acesta</div><div class="big" data-o="dn"></div><div class="row" data-o="dnrow"></div></div>' +
        '<div class="stack">' +
        '<details class="panel" id="dAlte"><summary>Alte informații despre firmă</summary>' +
        fld('reinvest', 'Profit lăsat în firmă pentru creștere', '%', 'din profitul net') +
        fld('cota', 'Cota ta din firmă', '%') + fld('datorie', 'Datoria netă a firmei', '€', 'credite minus numerar') +
        fld('kEbitda', 'EBITDA = profit net ×', '', 'factorul de calcul al EBITDA') + '</details>' +
        '<details class="panel" id="dFisc"><summary>Fiscalitate și curs</summary>' +
        fld('taxProfit', 'Impozit pe profit', '%') + fld('taxDiv', 'Impozit pe dividende', '%', '16% din 2026') +
        fld('cassRon', 'Plafonul CASS pe dividende', 'lei/an', '10% × 24 salarii minime') + fld('taxCastig', 'Impozit pe câștigul din vânzarea firmei', '%', 'de confirmat cu contabilul') +
        fld('curs', 'Curs', 'lei/€') + '</details>' +
        '<details class="panel" id="dPod"><summary>Podul de la EBITDA la dividendul net</summary><div class="eqrow" data-o="bridge"></div></details></div>';
    },
    bind: function (p) {
      p.querySelector('#mMod').addEventListener('click', function (e) {
        var b = e.target.closest('[data-mm]'); if (!b) return;
        var m = b.getAttribute('data-mm'); if (m === state.marjaMod) return;
        if (m === 'suma') state.profitNet = Math.round(state.ca * state.marjaPct / 100);
        else if (state.ca > 0) state.marjaPct = Math.round(state.profitNet / state.ca * 1000) / 10;
        state.marjaMod = m; R.firma.mfield(p); changed();
      });
      R.firma.mfield(p);
    },
    mfield: function (p) {
      p.querySelector('[data-o="mfield"]').innerHTML = state.marjaMod === 'suma' ? fld('profitNet', 'Modifică suma', '€') : fld('marjaPct', 'Modifică procentul', '%');
    },
    update: function (p, c) {
      p.querySelectorAll('#mMod button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mm') === state.marjaMod)); });
      var sm = state.marjaMod === 'suma', A = '<div class="iv">' + eur(c.pn0) + '</div><div class="is">profit net pe an</div>', B = '<div class="iv">' + (isNaN(c.marja) ? '—' : pct(c.marja)) + '</div><div class="is">marja de profit net</div>';
      out(p, 'pnA', sm ? A : B); out(p, 'pnB', sm ? B : A);
      p.querySelector('[data-o="pnA"]').className = 'on'; p.querySelector('[data-o="pnB"]').className = 'off2';
      out(p, 'iCA', eur(state.ca));
      out(p, 'iEB', eur(c.E0)); out(p, 'ebH', 'profit net ' + eur(c.pn0) + ' × ' + nf2.format(c.kE));
      var d = c.div0;
      out(p, 'dn', eur(d.net));
      out(p, 'dnrow', '<div><b>' + eur(d.net / 12) + '</b>pe lună</div><div><b>' + pct(c.share1) + '</b>din profitul net ajunge la tine</div><div><b>' + eur(d.tax + d.cass) + '</b>impozit și CASS</div>');
      out(p, 'bridge',
        '<div class="fact"><div class="k">EBITDA</div><div class="v">' + shortEur(c.E0) + '</div></div><span class="op">→</span>' +
        '<div class="fact"><div class="k">Profit înainte de impozit</div><div class="v">' + shortEur(d.pb) + '</div></div><span class="op">→</span>' +
        '<div class="fact"><div class="k">Profit net</div><div class="v">' + shortEur(d.pn) + '</div></div><span class="op">→</span>' +
        '<div class="fact"><div class="k">Dividend brut cuvenit ție</div><div class="v">' + shortEur(d.brut) + '</div><div class="how">' + pct(c.share1) + ' din profitul net</div></div><span class="op">→</span>' +
        '<div class="fact gd"><div class="k">Dividend net</div><div class="v">' + shortEur(d.net) + '</div><div class="how">după impozit ' + eur(d.tax) + ' și CASS ' + eur(d.cass) + '</div></div>');
    }
  };

  function y3Html(c) {
    var y = c.y3;
    if (!y.ok) return '<p class="note">Nu se poate calcula: firma nu are profit sau anii productivi sunt prea puțini.</p>';
    var o = '<p class="lead-to">Ca dividendul să plătească lifestyle-ul din fiecare an, firma trebuie să ajungă la:</p>' +
      '<div class="jr"><div class="jbox"><div class="k">Cifra de afaceri în anul 0</div><div class="v">' + shortEur(state.ca) + '</div><div class="s">azi, la ' + ani(c.varsta) + '</div></div>' +
      '<div class="jarrow" style="color:var(--teal)"><span class="ar">→</span><span>' + ani(y.h) + '</span></div>' +
      '<div class="jbox to" style="border-color:var(--teal)"><div class="k">Cifra de afaceri în anul ' + y.h + '</div><div class="v" style="color:var(--teal)">' + shortEur(y.CA) + '</div><div class="s">la ' + ani(c.varsta + y.h) + '</div></div></div>' +
      '<div class="jstats"><div><div class="k">Ritm mediu de creștere</div><div class="v" style="color:var(--teal)">' + gfmt(y.g) + '</div><div class="s">pe an, până în anul ' + y.h + ' · ritmul de azi ' + gfmt(state.crestere / 100) + '</div></div>' +
      '<div><div class="k">De câte ori crește firma</div><div class="v" style="color:var(--teal)">' + xfmt(y.X) + '</div><div class="s">până în anul ' + y.h + '</div></div>' +
      '<div><div class="k">Dividend net necesar în anul ' + y.h + '</div><div class="v">' + shortEur(y.need) + '</div><div class="s">EBITDA ' + shortEur(y.eb) + '</div></div></div>';
    return o + '<div class="yrs">' + y.years.map(function (r) {
      return '<div class="yr"><div class="k">' + (r.an < 4 ? 'Anul ' + r.an : 'Din anul 4') + ' · ' + ani(r.age) + '</div><div class="v">' + eur(r.life) + '<small> / lună</small></div>' +
        '<div class="s">' + (r.an === 0 ? 'cifra de afaceri ' + shortEur(r.CA) + ' · azi' : r.covered ? 'cifra de afaceri ' + shortEur(r.CA) + ' · ajunge, fără creștere' : 'cifra de afaceri necesară ' + shortEur(r.CA) + ' · ' + gfmt(r.g) + ' față de anul ' + (r.an - 1)) + '</div></div>';
    }).join('') + '</div>';
  }
  function runOutHtml(sim, c) {
    if (sim.capRet < 1000) return '<div class="runout"><span class="rb">La ' + ani(c.R) + ' nu ai capital pentru capitolul următor.</span><span class="rs">Freedom number lipsește în întregime: ' + (c.FN.ok ? shortEur(c.FN.total) : '—') + '.</span></div>';
    if (sim.runOut) return '<div class="runout"><span class="rb">Banii se termină la ' + ani(sim.runOut) + '.</span><span class="rs">La ' + ani(Math.max(0, sim.runOut - c.R)) + ' după ce pui munca în cui, cu ' + ani(c.E - sim.runOut) + ' înainte de capăt (' + c.E + ').</span></div>';
    return '<div class="runout ok"><span class="rb">Banii ajung până la ' + ani(c.E) + '.</span><span class="rs">' + (sim.end >= 0 ? 'La final rămân ' + shortEur(sim.end) + ' în portofoliu, plus fondurile de siguranță.' : '') + '</span></div>';
  }
  R.div = {
    html: function () {
      return '<div class="eyebrow">Cu firma și ritmul de creștere de azi</div><h1 class="q">Acoperă dividendele lifestyle-ul, one-off-urile și economiile?</h1>' +
        '<div data-o="v"></div>' +
        '<div class="panel jpanel" style="border-color:var(--teal)"><h2 class="sec" style="color:var(--teal)">Anii 0–4 · creșterea de care ai nevoie</h2><div data-o="y3"></div></div>' +
        '<div class="panel jpanel" style="border-color:var(--accent)"><h2 class="sec" style="color:var(--accent)" data-o="rt"></h2><div class="facts c3" data-o="gapf"></div><div data-o="run"></div></div>' +
        '<details class="panel sect"><summary data-o="s1"></summary><div class="facts c3" data-o="facts"></div></details>' +
        '<details class="panel sect"><summary data-o="s2"></summary><div class="phases" data-o="ph"></div></details>' +
        '<details class="panel sect"><summary>Tabel și desfășurător</summary><div class="chart-box" data-o="ch"></div><div class="lg-row"><span><i class="sw" style="background:var(--accent)"></i>Capitalul tău, doar din dividende</span><span>○ freedom number la ' + C.R + ' de ani</span></div>' +
        '<div data-o="tb"></div></details>';
    },
    update: function (p, c) {
      var s = c.r1, gap = c.gap1;
      var over = c.L1in > c.capMonth + 0.5;
      out(p, 'v', over
        ? '<p class="verdict no">Nu poți avea lifestyle-ul de acum.<small>Ai trecut ' + eur(c.L1in) + ' pe lună, dar firma îți plătește ca dividend net maximum ' + eur(c.capMonth) + '. În anul 0 trăiești cu ' + eur(c.capMonth) + ' pe lună.</small></p>'
        : '<p class="verdict ok">Firma îți plătește lifestyle-ul de acum.<small>' + eur(c.L1) + ' pe lună, din maximum ' + eur(c.capMonth) + ' cât poți ridica din dividend.</small></p>');
      out(p, 'rt', 'Cu ritmul de creștere de azi · ' + gfmt(state.crestere / 100) + ' pe an');
      out(p, 'gapf',
        '<div class="fact' + (s.tot.def > 0.5 ? ' hi' : ' gd') + '"><div class="k">Neplătit în anii productivi</div><div class="v">' + (s.tot.def > 0.5 ? shortEur(s.tot.def) : 'nimic') + '</div><div class="how">' + (s.tot.def > 0.5 ? 'lifestyle, fonduri și one-off pe care dividendul nu le acoperă, din ' + ani(s.firstDef) : 'dividendul acoperă tot') + '</div></div>' +
        '<div class="fact ac"><div class="k">Capital la ' + c.R + ' de ani</div><div class="v">' + shortEur(s.capRet) + '</div><div class="how">economii + fonduri de siguranță</div></div>' +
        '<div class="fact' + (gap > 0 ? ' hi' : ' gd') + '"><div class="k">' + (gap > 0 ? 'Lipsește din freedom number' : 'Peste freedom number') + '</div><div class="v">' + (isNaN(gap) ? '—' : shortEur(Math.abs(gap))) + '</div><div class="how">freedom number ' + (c.FN.ok ? shortEur(c.FN.total) : '—') + '</div></div>');
      out(p, 'run', runOutHtml(s, c));
      out(p, 'y3', y3Html(c));
      out(p, 's1', 'Dividend până la freedom number');
      out(p, 's2', 'Anii productivi până la capitalul la ' + c.R + ' de ani');
      out(p, 'facts',
        '<div class="fact"><div class="k">Dividend net anul acesta</div><div class="v">' + shortEur(c.div0.net) + '</div><div class="how">' + eur(c.div0.net / 12) + ' pe lună</div></div>' +
        '<div class="fact"><div class="k">Nevoia anului acesta</div><div class="v">' + shortEur(c.L1 * 12 + (c.ooAt[c.varsta] || 0)) + '</div><div class="how">lifestyle' + (c.ooAt[c.varsta] ? ' + one-off' : '') + ', fără fonduri</div></div>' +
        '<div class="fact ac"><div class="k">Capital la ' + c.R + ' de ani</div><div class="v">' + shortEur(s.capRet) + '</div><div class="how">portofoliu + fonduri</div></div>' +
        '<div class="fact"><div class="k">Freedom number</div><div class="v">' + (c.FN.ok ? shortEur(c.FN.total) : '—') + '</div></div>' +
        '<div class="fact hi"><div class="k">Dividend net necesar, constant</div><div class="v">' + (isNaN(c.A) ? '—' : shortEur(c.A)) + '</div><div class="how">pe an, ca să ajungi exact la freedom number</div></div>' +
        '<div class="fact hi"><div class="k">EBITDA necesar, constant</div><div class="v">' + (isNaN(c.ebNec) ? '—' : shortEur(c.ebNec)) + '</div><div class="how">față de ' + shortEur(c.E0) + ' azi</div></div>');
      out(p, 'ph',
        '<div class="phase"><div class="ph-t">Anii productivi · ' + c.varsta + '–' + c.R + '</div><dl>' + dl([['Portofoliul de azi', eur(state.economii)], ['Dividende nete încasate', signed(s.tot.div)], ['Lifestyle plătit', signed(-s.tot.life)], ['One-off plătite', signed(-s.tot.oo)], ['Fonduri de siguranță puse deoparte', signed(-s.tot.fond)], ['Randament câștigat', signed(s.tot.growth)]].concat(s.tot.def > 0.5 ? [['Neplătit (lipsă de dividend)', eur(s.tot.def)]] : []).concat([['Capital la ' + c.R + ' de ani', eur(s.capRet), true]])) + '</dl></div>' +
        '<div class="phase two"><div class="ph-t">Capitolul următor · ' + c.R + '–' + c.E + '</div><dl>' + dl([['Capital de pornire', eur(s.capRet)], ['Randament câștigat', signed(s.w.growth)], ['Lifestyle', signed(-s.w.life)], ['One-off', signed(-s.w.oo)], ['Capital la ' + c.E + ' de ani', eur(s.end + c.F2), true]]) + '</dl></div>');
      out(p, 'ch', chartSVG(c, [{ sim: s, color: 'var(--accent)' }], c.FN.ok ? c.FN.total : 0));
      out(p, 'tb', tableHtml(s, { flat: true, def: true }));
    }
  };

  function noteKey(t) { var m = state.valMetoda || 'ebitda'; return (m === 'venit' ? 'nV' : m === 'sde' ? 'nS' : 'nE') + (t === 'tinta' ? 'T' : ''); }
  function curNotes() { return state[noteKey(state.mTab)]; }
  function factorList(m) {
    if (m === 'venit') return VF.map(function (f, i) { return { t: f[1], d: GRADE[f[0]], w: f[2], auto: i === 1 }; });
    if (m === 'sde') return SF.map(function (f, i) { return { t: (i < 6 ? f[0] + ' · ' : '') + f[1], d: f[2] || GRADE[f[0]], w: i < 6 ? null : f[3], group: i === 0 ? 'Transferabilitatea afacerii · 30%, media răspunsurilor T1–T6' : i === 6 ? 'Ceilalți factori' : null }; });
    return FACT.map(function (f, i) { return { t: f.t, d: f.d, d2: f.d2, wi: i }; });
  }
  R.multiplu = {
    html: function () {
      var m = state.valMetoda || 'ebitda', man = (m === 'ebitda' && state.mManual) || (m === 'venit' && state.vManual) || (m === 'sde' && state.sManual), fl = man ? [] : factorList(m);
      return '<div class="eyebrow">Calea 2 · Cât valorează firma</div><h1 class="q">Evaluarea firmei: alege metoda</h1>' +
        '<p class="note">Alege metoda care se potrivește firmei tale. Dă note de la 1 la 5 pe factori, întâi pentru firma de azi, apoi pentru cum vrei să arate la vânzare. Multiplul la vânzare devine baza pentru calea 2.</p>' +
        '<div class="vmeth" id="vMeth">' +
        '<button type="button" data-vm="sde"><b>Multiplu SDE</b><span>Afaceri mici conduse de proprietar, vândute unei persoane care preia conducerea.</span></button>' +
        '<button type="button" data-vm="venit"><b>Multiplu pe venituri</b><span>Când profitul e mic sau volatil. Valoarea pornește de la cifra de afaceri și marja față de industrie.</span></button>' +
        '<button type="button" data-vm="ebitda"><b>Multiplu EBITDA</b><span>Firme cu EBITDA pozitiv. Cumpărători: firme din sector sau fonduri. Intervalul vine din industrie.</span></button></div>' +
        (m !== 'sde' ? '<div class="indban"><div class="lbl">Industria firmei</div><select id="indSel">' + IND.map(function (x) { return '<option value="' + x.id + '"' + (x.id === state.industrie ? ' selected' : '') + '>' + esc(x.n) + '</option>'; }).join('') + '</select><div class="row" data-o="indH"></div></div>' +
          (m !== 'sde' ? '<div class="panel"><div class="frow"><span>Cum stabilești multiplul</span><span class="seg" id="mHow"><button type="button" data-mh="calc" aria-pressed="' + !man + '">Calculat din factori</button><button type="button" data-mh="manual" aria-pressed="' + man + '">Introdus manual</button></span><span class="u"></span></div>' +
            (man ? (m === 'ebitda' ? fld('mManAzi', 'Multiplul de azi', '× EBITDA') + fld('mManT', 'Multiplul la vânzare', '× EBITDA', 'unde vrei să ajungi') : fld('vManAzi', 'Multiplul de azi', '× CA') + fld('vManT', 'Multiplul la vânzare', '× CA', 'unde vrei să ajungi')) : '') + '</div>' : '')
          : '<div class="indban sdeban"><div class="lbl">Construirea SDE</div><div class="row" data-o="sdeRow"></div>' + fld('sdeSalariu', 'Salariul tău pe firmă, brut plus contribuții', '€/an', 'un singur proprietar-operator') + fld('sdeChelt', 'Cheltuieli personale documentate plătite de firmă', '€/an') +
            fld('sdeSalPiata', 'Cât ar costa un manager care să-ți preia rolurile', '€/an', 'salariul de piață, cost total') + fld('sdePodea', 'Podeaua de active', '€', 'echipamente la valoare de piață + stoc vandabil + creanțe sub 90 de zile − datorii preluate') +
            '</div>' +
            '<div class="panel"><div class="frow"><span>Cum stabilești multiplul</span><span class="seg" id="mHow"><button type="button" data-mh="calc" aria-pressed="' + !man + '">Calculat din factori</button><button type="button" data-mh="manual" aria-pressed="' + man + '">Introdus manual</button></span><span class="u"></span></div>' +
            (man ? fld('sManAzi', 'Multiplul de azi', '× SDE') + fld('sManT', 'Multiplul la vânzare', '× SDE', 'unde vrei să ajungi') : '') + '</div>' +
            '<details class="panel"><summary>Parametri de piață și finanțare (consultant)</summary>' + fld('cursUsd', 'Curs USD/RON', 'lei') + fld('factorPiata', 'Factor de piață RO/UE', '×', 'tabelul e pentru piața americană') +
            fld('finAport', 'Aportul propriu al cumpărătorului', '%') + fld('finDobBanca', 'Dobânda creditului bancar', '%') + fld('finAniBanca', 'Perioada creditului bancar', 'ani') +
            fld('finCreditV', 'Credit vânzător (plată eșalonată)', '%') + fld('finDobV', 'Dobânda creditului vânzător', '%') + fld('finAniV', 'Perioada creditului vânzător', 'ani') +
            fld('finRand', 'Randamentul cerut pe aportul propriu', '%') + fld('finDscr', 'DSCR minim', '×') + '</details>') +
        '<div class="mres"><div class="eqrow"><div><span class="small" style="color:var(--muted)">Multiplul de azi</span><div class="big" data-o="M0" style="color:var(--muted)"></div></div><span class="op">→</span><div><span class="small" style="color:var(--muted)">Multiplul la vânzare</span><div class="big" data-o="MT"></div></div></div>' +
        (man ? '' : '<span class="seg" id="mTab"><button type="button" data-mt="azi">Factorii de azi</button><button type="button" data-mt="tinta">La vânzare</button></span>' +
        '<button type="button" class="chip" id="cpT">Copiază notele de azi la „La vânzare”</button>') + (m === 'ebitda' && !man ? '<span class="seg" id="mMode"><button type="button" data-mm="12">12 factori</button><button type="button" data-mm="5">5 factori</button></span>' : '') + '</div>' +
        '<p class="lead-to" data-o="base2" style="font-weight:500"></p><div class="panel"><div class="facts" data-o="vres"></div><div data-o="vmsg"></div></div>' +
        '<div class="mfac" id="mfac">' + fl.map(function (f, i) {
          return (f.group ? '<h2 class="sec">' + f.group + '</h2>' : '') + '<div class="fac" data-f="' + i + '"><div class="fn">' + (i + 1) + '. ' + esc(f.t) + '<small data-o="w' + i + '"></small></div>' +
            '<div class="bands"><span class="seg">' + [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" data-fn="' + i + ':' + n + '"' + (f.auto ? ' disabled' : '') + ' title="' + esc(f.d[n - 1]) + '">' + n + '</button>'; }).join('') + '</span></div>' +
            '<div class="desc" data-o="d' + i + '"></div></div>';
        }).join('') + '</div>' +
        '<p class="note small">Rezultatul este o estimare orientativă, pe multiplii tipici ai IMM-urilor private din Europa' + (m === 'sde' ? ' (tabelul SDE vine de pe piața americană și e ajustat cu factorul de piață)' : '') + '. Nu este o evaluare profesională și nu ține loc de due diligence. Prezintă întotdeauna intervalul, nu un singur număr.</p>';
    },
    bind: function (p) {
      p.querySelector('#vMeth').addEventListener('click', function (e) { var b = e.target.closest('[data-vm]'); if (!b) return; state.valMetoda = b.getAttribute('data-vm'); rerender(); });
      var sel = p.querySelector('#indSel'); if (sel) sel.addEventListener('change', function () { state.industrie = sel.value; changed(); });
      var mm = p.querySelector('#mMode'); if (mm) mm.addEventListener('click', function (e) { var b = e.target.closest('[data-mm]'); if (!b) return; state.mMode = b.getAttribute('data-mm'); changed(); });
      var mh = p.querySelector('#mHow'); if (mh) mh.addEventListener('click', function (e) { var b = e.target.closest('[data-mh]'); if (!b) return; var on = b.getAttribute('data-mh') === 'manual', vm = state.valMetoda || 'ebitda'; if (vm === 'venit') state.vManual = on; else if (vm === 'sde') state.sManual = on; else state.mManual = on; if (on) state.mTab = 'azi'; rerender(); });
      if (!p.querySelector('#mTab')) return;
      p.querySelector('#mTab').addEventListener('click', function (e) { var b = e.target.closest('[data-mt]'); if (!b) return; state.mTab = b.getAttribute('data-mt'); changed(); });
      p.querySelector('#cpT').addEventListener('click', function () { state[noteKey('tinta')] = state[noteKey('azi')].slice(); state.mTab = 'tinta'; changed(); });
      p.querySelector('#mfac').addEventListener('click', function (e) {
        var b = e.target.closest('[data-fn]'); if (!b || b.disabled) return;
        var a = b.getAttribute('data-fn').split(':'); curNotes()[+a[0]] = +a[1]; changed();
      });
    },
    update: function (p, c) {
      var m = state.valMetoda || 'ebitda', man = (m === 'ebitda' && state.mManual) || (m === 'venit' && state.vManual) || (m === 'sde' && state.sManual), fl = man ? [] : factorList(m), atSale = state.mTab === 'tinta' && m === 'sde' && c.w2 && c.w2.V, V = atSale ? c.w2.V : state.mTab === 'tinta' ? c.VT0 : c.V0, when = atSale ? 'la vânzare' : 'azi';
      p.querySelectorAll('#vMeth button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-vm') === m)); });
      var mtUsed = c.w2 && c.w2.M != null ? c.w2.M : c.MT;
      out(p, 'M0', nf2.format(c.M0) + '×'); out(p, 'MT', nf2.format(mtUsed) + '×');
      out(p, 'base2', 'Pe calea 2 folosim multiplul la vânzare: <b>' + nf2.format(mtUsed) + ' ' + VM[m].u + '</b>' + (m === 'sde' ? ', calculat la SDE-ul din anul vânzării: o firmă mai mare intră într-o tranșă cu multipli mai mari, de aceea intervalul la vânzare e altul decât azi' : '') + (man ? ', introdus manual.' : '. Notele „La vânzare” nu pot fi sub cele de azi.'));
      var mmEl = p.querySelectorAll('#mMode button'); mmEl.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mm') === state.mMode)); });
      p.querySelectorAll('#mTab button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mt') === state.mTab)); });
      if (m !== 'sde') {
        var mg = state.ca > 0 ? c.E0 / state.ca : NaN;
        out(p, 'indH', '<div><b>' + (m === 'ebitda' ? nf.format(c.ind.min) + '× – ' + nf.format(c.ind.max) + '×' : nf2.format(c.ind.rmin) + '× – ' + nf2.format(c.ind.rmax) + '×') + '</b>' + (m === 'ebitda' ? 'interval EV/EBITDA' : 'interval EV/venituri, derivat din EBITDA și marjă') + '</div>' +
          '<div><b>' + pct(c.ind.mmin) + ' – ' + pct(c.ind.mmax) + '</b>marja EBITDA tipică</div><div><b>' + (isNaN(mg) ? '—' : pct(mg)) + '</b>marja ta EBITDA</div>');
      }
      else out(p, 'sdeRow', '<div><b>' + eur(c.V0.base) + '</b>SDE azi</div><div><b>' + eur(c.E0) + '</b>EBITDA</div><div><b>+ ' + eur(state.sdeSalariu) + '</b>salariul tău</div><div><b>+ ' + eur(state.sdeChelt) + '</b>cheltuieli personale</div>');
      out(p, 'vres',
        '<div class="fact"><div class="k">Interval de multiplu' + (state.mTab === 'tinta' ? ', la vânzare' : ', azi') + '</div><div class="v">' + nf2.format(V.min) + '× – ' + nf2.format(V.max) + '×</div><div class="how">' + VM[m].u + (m === 'sde' ? (atSale ? ' · intervalul pentru SDE-ul din anul vânzării; azi ' + nf2.format(c.V0.min) + '× – ' + nf2.format(c.V0.max) + '×' : ' · pentru SDE-ul de azi') : '') + '</div></div>' +
        '<div class="fact"><div class="k">Scor pe factori</div><div class="v">' + (isNaN(V.score) ? '—' : nf0.format(V.score * 100) + '%') + '</div><div class="how">' + (isNaN(V.score) ? 'multiplu introdus manual' : 'poziția în interval') + '</div></div>' +
        '<div class="fact ac"><div class="k">Multiplul aplicat</div><div class="v">' + nf2.format(V.mult) + '×</div><div class="how">' + VM[m].base + ' ' + when + ' ' + shortEur(V.base) + '</div></div>' +
        '<div class="fact gd"><div class="k">Valoarea firmei ' + when + '</div><div class="v">' + shortEur(V.EV) + '</div><div class="how">interval ' + shortEur(V.min * Math.max(0, V.base)) + ' – ' + shortEur(V.max * Math.max(0, V.base)) + '</div></div>' +
        '<div class="fact"><div class="k">Partea ta, după datoria netă</div><div class="v">' + shortEur(V.ours) + '</div><div class="how">datorie netă ' + shortEur(state.datorie) + ' · cota ' + nf0.format(state.cota) + '%</div></div>');
      var msgs = [];
      if (m === 'ebitda') {
        if (c.E0 <= 0) msgs.push('Firma nu generează EBITDA pozitiv. Metoda EBITDA nu poate fi aplicată. Folosește metoda pe venituri.');
        else if (c.E0 < 500000) msgs.push('La acest nivel de EBITDA, tranzacțiile se fac de obicei spre minimul intervalului. Cumpărătorii sunt în principal investitori individuali sau firme din același sector.');
        else if (c.E0 <= 2000000) msgs.push('Poziția în interval este dată în principal de calitatea afacerii (scorul pe factori).');
        else msgs.push('La acest nivel, firma intră în zona de interes a fondurilor de investiții. Multiplul poate depăși maximul intervalului.');
      }
      if (m !== 'sde' && state.ca > 0) { var mg = c.E0 / state.ca; msgs.push(mg < c.ind.mmin ? 'Marja EBITDA este sub media industriei. Un cumpărător va observa acest decalaj.' : mg > c.ind.mmax ? 'Marja EBITDA este peste media industriei. Verifică normalizarea; dacă e reală, e un argument puternic în negociere.' : 'Marja EBITDA este în linie cu industria.'); }
      if (m === 'sde' && V.sde) msgs = msgs.concat(V.sde.msgs);
      if (state.datorie > 0.5 * V.EV && V.EV > 0) msgs.push('Datoria financiară netă absoarbe o parte semnificativă din valoarea firmei. Reducerea datoriei crește direct valoarea pentru acționari.');
      out(p, 'vmsg', msgs.length ? '<ul class="cl" style="margin:8px 0 0;padding-left:1.1em;color:var(--muted);font-size:.9rem">' + msgs.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' : '');
      var notes = curNotes(), other = state[noteKey(state.mTab === 'tinta' ? 'azi' : 'tinta')];
      fl.forEach(function (f, i) {
        var card = p.querySelector('[data-f="' + i + '"]'); if (!card) return;
        var n = f.auto ? V.mNote || c.V0.mNote : (state.mTab === 'tinta' ? Math.max(notes[i], other[i]) : notes[i]), w = m === 'ebitda' ? (state.mMode === '5' ? (W5[f.wi] || 0) : W12[f.wi]) : f.w;
        card.classList.toggle('off', m === 'ebitda' && !w);
        var diff = state.mTab === 'tinta' && !f.auto && other[i] !== n ? ' · azi ' + other[i] : '';
        out(p, 'w' + i, (w == null ? 'parte din transferabilitate' : w ? 'pondere ' + nf.format(w * 100) + '%' : 'nu intră în varianta cu 5 factori') + (f.auto ? ' · calculat din marjă' : '') + diff);
        card.querySelectorAll('[data-fn]').forEach(function (b, j) { b.setAttribute('aria-pressed', String(j + 1 === n)); });
        out(p, 'd' + i, 'Nota ' + n + ': <i>' + esc(f.d[n - 1]) + '</i>' + (f.d2 ? ' · ' + esc(f.d2[n - 1]) : ''));
      });
    }
  };

  function gfmt(g) { return (g > 0 ? '+' : '') + nf.format(g * 100) + '%'; }
  function xfmt(x) { return nf2.format(x) + '×'; }
  function wBanner(col, lbl, big, items) {
    return '<div class="fnbox" style="background:' + col + '"><div class="lbl">' + lbl + '</div><div class="big">' + big + '</div><div class="row">' +
      items.map(function (i) { return '<div><b>' + i[0] + '</b>' + i[1] + '</div>'; }).join('') + '</div></div>';
  }
  function wStatus(w, c) {
    if (!w) return '<p class="verdict no">Calculul nu se poate face.<small>Verifică freedom number (randament real pozitiv, dacă păstrezi capitalul întreg) și profitul firmei.</small></p>';
    if (w.status === 'imposibil') return '<p class="verdict no">Pe această cale nu se ajunge la freedom number.<small>Nici cu o creștere de 300% pe an. Schimbă ipotezele sau combină căile.</small></p>';
    if (w.status === 'min' || w.g <= 0) return '<p class="verdict ok">Firma de azi acoperă deja această cale.<small>Nu ai nevoie de creștere; firma poate chiar să scadă cu până la ' + nf.format(-w.g * 100) + '% pe an.</small></p>';
    return '';
  }
  function caiCard(n, col, title, text, how, find) {
    return '<div class="route" style="border-color:' + col + '"><div class="rt" style="color:' + col + '">Calea ' + n + '</div><p class="rv">' + title + '</p><p>' + text + '</p>' +
      '<div class="ph-t" style="color:' + col + ';margin:6px 0 0">Cum funcționează</div><ul class="cl">' + how.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' +
      '<div class="ph-t" style="color:' + col + ';margin:6px 0 0">Ce aflăm</div><p>' + find + '</p></div>';
  }
  /* slide informativ pentru fiecare cale: erou, schema fluxului de bani, pașii și ce aflăm */
  function infoSlide(o) {
    var flow = o.flow.map(function (n, i) {
      return (i ? '<div class="fl-ar" aria-hidden="true">→</div>' : '') + '<div class="fl-n' + (n[2] ? ' fl-end' : '') + '"><div class="fl-k">' + n[0] + '</div><div class="fl-s">' + n[1] + '</div></div>';
    }).join('');
    return '<div class="ihero" style="--pc:' + o.col + '"><div class="ih-num">' + o.n + '</div><div class="ih-txt"><div class="eyebrow" style="color:' + o.col + '">Cum aduci suma care lipsește · calea ' + o.n + ' din 3</div>' +
      '<h1 class="q">' + o.title + '</h1><p class="ih-tag">' + o.tag + '</p></div></div>' +
      '<div class="flow" style="--pc:' + o.col + '">' + flow + '</div>' +
      '<div class="grid2"><div class="panel"><h2 class="sec" style="color:' + o.col + '">Cum funcționează</h2><ol class="isteps" style="--pc:' + o.col + '">' + o.how.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol></div>' +
      '<div class="panel ifind" style="--pc:' + o.col + '"><h2 class="sec" style="color:' + o.col + '">Ce aflăm pe slide-ul următor</h2><div class="chips">' + o.find.map(function (x) { return '<span class="fchip">' + x + '</span>'; }).join('') + '</div>' +
      (o.when ? '<p class="note small" style="margin-top:6px">' + o.when + '</p>' : '') + '</div></div>';
  }
  R.cai1 = {
    html: function () {
      return infoSlide({ n: 1, col: 'var(--accent)', title: 'Economiile din anii productivi', tag: 'Firma îți plătește dividende în fiecare an. Din ele trăiești acum și construiești capitalul pentru capitolul următor.',
        flow: [['Etapa 1 · 4 ani', 'crești până acoperi lifestyle + one-off'], ['Etapa 2 · din anul 4', 'creștere constantă'], ['Lifestyle, one-off, fonduri', 'se plătesc întâi'], ['Ce rămâne se investește', 'banii lucrează pentru tine'], ['Freedom number', 'la ' + ani(C.R), true]],
        how: ['În primii 4 ani firma crește până la cifra de afaceri din slide-ul 9: dividendul acoperă lifestyle-ul, one-off-urile și fondurile de siguranță.', 'Din anul 4 firma crește constant; pe lângă lifestyle și one-off, dividendul lasă economii care se investesc cu randamentul real.', 'La ' + ani(C.R) + ', portofoliul trebuie să fie egal cu freedom number.'],
        find: ['Ritmul din primii 4 ani', 'Ritmul constant din anul 4', 'Cifra de afaceri în ultimul an productiv', 'De câte ori crește firma (X)', 'Cât pui deoparte pe an'],
        when: 'Potrivită când firma face profit stabil și vrei să rămâi proprietar până la final.' });
    },
    update: function () {}
  };
  R.cai2 = {
    html: function () {
      return infoSlide({ n: 2, col: 'var(--teal)', title: 'Vânzarea companiei', tag: 'Construiești o firmă pe care cineva vrea să o cumpere și o vinzi la ' + ani(C.R) + '. Prețul depinde de mărimea firmei și de multiplu.',
        flow: [['Multiplul de azi', 'cât valorează firma acum'], ['Lucrezi la factori', 'echipă, clienți, recurență, profit'], ['Multiplul țintă', 'unde vrei să ajungi'], ['Vânzarea', 'la ' + ani(C.R) + ', minus datorii și impozit'], ['Freedom number', 'plătit doar din vânzare', true]],
        how: ['Primii 4 ani crești până acoperi lifestyle-ul și one-off-urile; apoi firma crește constant până la vânzare.', 'Alegi metoda de evaluare: SDE, venituri sau EBITDA.', 'Notezi factorii de azi și pe cei pe care vrei să-i atingi la vânzare.', 'Dividendele plătesc doar anii productivi; anii de freedom se plătesc din banii pe vânzare.'],
        find: ['Multiplul de azi și multiplul țintă', 'Cifra de afaceri cu care vinzi firma', 'De câte ori crește firma (X)', 'Ritmul constant de creștere'],
        when: 'Cu cât lucrezi mai mult la factori, cu atât firma trebuie să crească mai puțin.' });
    },
    update: function () {}
  };
  R.cai3 = {
    html: function () {
      return infoSlide({ n: 3, col: 'var(--plum)', title: 'Din CEO în board', tag: 'Nu vinzi. Aduci un CEO, păstrezi o parte din acțiuni și treci în board. Firma îți plătește dividende până la capătul vieții.',
        flow: [['Cota păstrată', 'restul acțiunilor la noul CEO'], ['Parte lăsată pentru creștere', 'firma continuă să crească'], ['Dividendul tău', 'pe partea rămasă'], ['Lifestyle până la capăt', 'plus moștenirea dorită', true]],
        how: ['Setezi cât deții, cât costă CEO-ul și cât lași pentru creștere.', 'Ca în anii productivi, dar CEO-ul te înlocuiește: dividendul din board plătește tot lifestyle-ul și one-off-urile din capitolul următor, fără economii strânse dinainte.', 'Mergem înapoi din ultimul an de viață, cu moștenirea și costul CEO-ului: cifra de afaceri cu care trebuie să intri în capitolul următor.', 'Dacă e sub cifra din anul 4 (lifestyle + one-off în anii productivi), rămâi la aceea; altfel firma crește constant din anul 4 până la ea.'],
        find: ['Cifra de afaceri cerută de capitolul următor', 'Ritmul din primii 4 ani', 'Ritmul constant din anul 4', 'De câte ori crește firma (X)'],
        when: 'Firma rămâne a ta și poate fi dată mai departe: o moștenire pe lângă suma lăsată la final.' });
    },
    update: function () {}
  };


  /* drumul cifrei de afaceri: de la azi la ținta căii */
  function caBars(c, w, col) {
    var pl = w.p1 ? w.p1.yrs : null, n = w.curve ? c.n1 - 1 : (w.yrs != null ? w.yrs : c.n1), W = 900, H = 230, L = 70, Rr = 16, T = 18, B = 34, g0 = 0;
    var vals = [], base = [];
    for (var i = 0; i <= n; i++) { vals.push(state.ca * (w.curve ? w.curve[i] : Math.pow(1 + w.g, i))); base.push(state.ca * Math.pow(1 + g0, i)); }
    var max = Math.max.apply(null, vals.concat(base)) * 1.1 || 1, ys = niceStep(max / 4), yMax = Math.ceil(max / ys) * ys;
    var bw = (W - L - Rr) / (n + 1), f = 'Inter, sans-serif', o = ['<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Cifra de afaceri pe ani">'];
    function Y(v) { return T + (1 - v / yMax) * (H - T - B); }
    for (var v = 0; v <= yMax + 1; v += ys) {
      o.push('<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="var(--line)"/>');
      o.push('<text x="' + (L - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end" fill="var(--muted)" font-size="13" font-family="' + f + '">' + (v === 0 ? '0' : shortEur(v)) + '</text>');
    }
    vals.forEach(function (v, i) {
      var x = L + i * bw + bw * 0.15, last = pl != null ? i > pl : i === n;
      o.push('<rect x="' + x.toFixed(1) + '" y="' + Y(v).toFixed(1) + '" width="' + (bw * 0.7).toFixed(1) + '" height="' + (Y(0) - Y(v)).toFixed(1) + '" rx="3" fill="' + col + '" opacity="' + (last ? 1 : 0.45) + '"/>');
      if (i === 0 || last || (n > 16 && i % 5 === 0) || (n <= 16)) o.push('<text x="' + (x + bw * 0.35).toFixed(1) + '" y="' + (H - B + 18) + '" text-anchor="middle" fill="var(--muted)" font-size="12" font-family="' + f + '">' + (c.varsta + i) + '</text>');
    });
    var d = base.map(function (v, i) { return (i ? 'L' : 'M') + (L + i * bw + bw / 2).toFixed(1) + ' ' + Y(v).toFixed(1); }).join(' ');
    o.push('<path d="' + d + '" fill="none" stroke="var(--ink)" stroke-width="2" stroke-dasharray="6 5"/>');
    o.push('</svg>');
    return '<div class="chart-box">' + o.join('') + '</div><div class="lg-row"><span><i class="sw" style="background:' + col + ';height:10px"></i>' + (pl != null ? 'cifra de afaceri: anii 0–' + pl + ' acoperă lifestyle-ul și one-off-urile (deschis), apoi creșterea pentru ' + (w.route === 'sale' ? 'vânzare' : w.route === 'board' ? 'capitolul următor' : 'economii') + ' (închis)' : 'cifra de afaceri pe această cale') + '</span><span><i class="sw" style="background:var(--ink)"></i>cifra de afaceri de azi, fără creștere</span></div>';
  }
  function provBars(c, v) {
    var n = v.years.length, W = 900, H = 240, L = 70, Rr = 16, T = 18, B = 34, g0 = 0;
    var max = Math.max(v.peak, state.ca * Math.pow(1 + g0, n - 1)) * 1.1 || 1, ys = niceStep(max / 4), yMax = Math.ceil(max / ys) * ys;
    var bw = (W - L - Rr) / n, f = 'Inter, sans-serif', o = ['<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Cifra de afaceri necesară pe ani">'];
    function Y(x) { return T + (1 - x / yMax) * (H - T - B); }
    for (var t = 0; t <= yMax + 1; t += ys) {
      o.push('<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + Y(t) + '" y2="' + Y(t) + '" stroke="var(--line)"/>');
      o.push('<text x="' + (L - 8) + '" y="' + (Y(t) + 4) + '" text-anchor="end" fill="var(--muted)" font-size="13" font-family="' + f + '">' + (t === 0 ? '0' : shortEur(t)) + '</text>');
    }
    v.years.forEach(function (y, i) {
      var x = L + i * bw + bw * 0.15, w = bw * 0.7;
      o.push('<rect x="' + x.toFixed(1) + '" y="' + Y(y.caTot).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + (Y(0) - Y(y.caTot)).toFixed(1) + '" rx="2" fill="var(--teal)" opacity="0.4"><title>Anul ' + i + ': ' + eur(y.caTot) + '</title></rect>');
      o.push('<rect x="' + x.toFixed(1) + '" y="' + Y(y.caLife).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + (Y(0) - Y(y.caLife)).toFixed(1) + '" rx="2" fill="var(--teal)"/>');
      if (n <= 16 || i % 5 === 0 || i === n - 1) o.push('<text x="' + (x + w / 2).toFixed(1) + '" y="' + (H - B + 18) + '" text-anchor="middle" fill="var(--muted)" font-size="12" font-family="' + f + '">' + y.age + '</text>');
    });
    var d = v.years.map(function (y, i) { return (i ? 'L' : 'M') + (L + i * bw + bw / 2).toFixed(1) + ' ' + Y(state.ca * Math.pow(1 + g0, i)).toFixed(1); }).join(' ');
    o.push('<path d="' + d + '" fill="none" stroke="var(--ink)" stroke-width="2" stroke-dasharray="6 5"/></svg>');
    return '<div class="chart-box" style="margin-top:12px">' + o.join('') + '</div><div class="lg-row"><span><i class="sw" style="background:var(--teal);height:10px"></i>pentru lifestyle</span><span><i class="sw" style="background:var(--teal);opacity:.4;height:10px"></i>+ one-off-uri și fonduri puse deoparte</span><span><i class="sw" style="background:var(--ink)"></i>cifra de afaceri de azi, fără creștere</span></div>';
  }
  function journey(c, w, col, toLbl, extra) {
    var p1 = w.p1;
    var mid = p1 ? '<div class="jarrow" style="color:' + col + '"><span class="ar">→</span><span>' + ani(p1.yrs) + '</span><span>' + gfmt(p1.g) + '/an</span></div>' +
      '<div class="jbox"><div class="k">Anul ' + p1.yrs + ' · lifestyle + one-off</div><div class="v">' + shortEur(p1.CA) + '</div><div class="s">la ' + ani(p1.age) + '</div></div>' : '';
    return '<div class="jr' + (p1 ? ' j3' : '') + '"><div class="jbox"><div class="k">Cifra de afaceri azi</div><div class="v">' + shortEur(state.ca) + '</div><div class="s">la ' + ani(c.varsta) + '</div></div>' + mid +
      '<div class="jarrow" style="color:' + col + '"><span class="ar">→</span><span>' + ani(p1 ? c.n1 - p1.yrs : (w.yrs != null ? w.yrs : c.n1)) + '</span>' + (p1 ? '<span>' + gfmt(w.g) + '/an</span>' : '') + '</div>' +
      '<div class="jbox to" style="border-color:' + col + '"><div class="k">' + toLbl + '</div><div class="v" style="color:' + col + '">' + shortEur(w.CA) + '</div><div class="s">la ' + ani(w.toAge != null ? w.toAge : c.R) + '</div></div></div>' +
      '<div class="jstats">' + (p1 ? '<div><div class="k">Etapa 1 · primii ' + ani(p1.yrs) + '</div><div class="v">' + gfmt(p1.g) + '</div><div class="s">pe an, până la cifra care acoperă lifestyle-ul și one-off-urile (slide-ul 9)</div><div class="rline">' + ritmChip(p1.g) + '</div></div>' +
        '<div><div class="k">Etapa 2 · din anul ' + p1.yrs + ' până la ' + ani(c.R) + '</div><div class="v" style="color:' + col + '">' + gfmt(w.g) + '</div><div class="s">pe an, constant · ' + xfmt(w.X2) + '</div><div class="rline">' + ritmChip(w.g) + '</div></div>'
        : '<div><div class="k">Ritm constant de creștere</div><div class="v" style="color:' + col + '">' + gfmt(w.g) + '</div><div class="s">pe an, în fiecare an productiv</div><div class="rline">' + ritmChip(w.g) + '</div></div>') +
      '<div><div class="k">De câte ori crește firma, în total</div><div class="v" style="color:' + col + '">' + xfmt(w.X) + '</div><div class="s">' + shortEur(state.ca) + ' × ' + xfmt(w.X) + '</div></div>' + (extra || '') + '</div>';
  }
  function sectTable(w, c, col, label) {
    return chartSVG(c, [{ sim: w.sim, color: col }], w.FNr.ok ? w.FNr.total : 0) + '<div class="lg-row"><span><i class="sw" style="background:' + col + '"></i>' + label + '</span><span>○ freedom number la ' + c.R + ' de ani</span></div>' + tableHtml(w.sim, { flat: true, sale: w.route === 'sale', def: true });
  }
  function pathPage(o) {
    return '<div class="eyebrow" style="color:' + o.col + '">' + o.eye + '</div><h1 class="q">' + o.q + '</h1><p class="note">' + o.note + '</p>' + (o.pre || '') +
      '<div class="panel jpanel" style="border-color:' + o.col + '"><div data-o="st"></div><div data-o="jr"></div><div data-o="bars"></div></div>' +
      (o.mid || '') +
      '<details class="panel sect"><summary>' + o.sum + '</summary><div data-o="facts"></div></details>' +
      '<details class="panel sect"><summary>Tabel și desfășurător</summary><div data-o="tb"></div></details>';
  }
  function fillPath(p, c, w, col, toLbl, extra, facts, label) {
    out(p, 'st', wStatus(w, c));
    if (!w || w.status === 'imposibil') { out(p, 'jr', ''); out(p, 'bars', ''); out(p, 'facts', ''); out(p, 'tb', ''); return false; }
    out(p, 'jr', journey(c, w, col, toLbl, extra));
    out(p, 'bars', caBars(c, w, col));
    out(p, 'facts', facts);
    out(p, 'tb', sectTable(w, c, col, label));
    return true;
  }

  R.cale1 = {
    html: function () {
      return pathPage({ col: 'var(--accent)', eye: 'Calea 1 · Economiile din anii productivi', q: 'Cât trebuie să crească firma până la ' + C.R + ' de ani?',
        note: 'Două etape. În primii 4 ani firma crește până la cifra de afaceri care acoperă lifestyle-ul și one-off-urile (slide-ul 9). Din anul 4 crește constant, ca dividendele să acopere lifestyle-ul și one-off-urile și, în plus, economiile care, investite cu randamentul ales, ajung la ' + C.R + ' de ani exact la freedom number. Marja de profit net rămâne cea de azi.',
        sum: 'Dividendele și capitalul pe această cale' });
    },
    update: function (p, c) {
      var w = c.w1;
      fillPath(p, c, w, 'var(--accent)', 'Cifra de afaceri în ultimul an productiv',
        w && w.p1 ? '<div><div class="k">Pui deoparte pe an</div><div class="v">' + shortEur(w.save4) + ' → ' + shortEur(w.saveEnd) + '</div><div class="s">din anul ' + w.p1.yrs + ' până la ' + ani(c.R - 1) + ', crește odată cu firma</div></div>' : '',
        w ? '<div class="facts c3"><div class="fact"><div class="k">Dividend net azi</div><div class="v">' + shortEur(c.div0.net) + '</div></div>' +
          '<div class="fact"><div class="k">Dividend net în anul ' + (w.p1 ? w.p1.yrs : 4) + '</div><div class="v">' + shortEur(w.div4 || 0) + '</div><div class="how">acoperă lifestyle-ul și one-off-urile</div></div>' +
          '<div class="fact"><div class="k">Dividend net în ultimul an</div><div class="v">' + shortEur(w.divLast) + '</div><div class="how">EBITDA ' + shortEur(w.ER) + ' la ' + ani(c.R) + '</div></div>' +
          '<div class="fact"><div class="k">Dividende nete în ' + ani(c.n1) + '</div><div class="v">' + shortEur(w.sim.tot.div) + '</div></div>' +
          '<div class="fact"><div class="k">Lifestyle și one-off plătite</div><div class="v">' + shortEur(w.sim.tot.life + w.sim.tot.oo) + '</div></div>' +
          '<div class="fact"><div class="k">Fonduri de siguranță</div><div class="v">' + shortEur(w.sim.tot.fond) + '</div></div>' +
          '<div class="fact gd"><div class="k">Capital la ' + c.R + ' de ani</div><div class="v">' + shortEur(w.sim.capRet) + '</div><div class="how">= freedom number</div></div></div>' : '',
        'Capitalul tău pe calea 1');
    }
  };

  R.cale2 = {
    html: function () {
      return pathPage({ col: 'var(--teal)', eye: 'Calea 2 · Vânzarea companiei', q: 'Unde vrei să ajungă multiplul firmei?',
        note: 'Primii 4 ani firma crește până la cifra care acoperă lifestyle-ul și one-off-urile (slide-ul 9), apoi crește constant până la ' + C.R + ' de ani, când o vinzi la multiplul țintă. Dividendele plătesc lifestyle-ul, one-off-urile și fondurile din anii productivi; banii din vânzare plătesc singuri freedom number. Cu cât multiplul e mai mare, cu atât firma trebuie să crească mai puțin.',
        pre: '<div class="mrow"><div class="mbox"><div class="k">Multiplul de azi</div><div class="v" data-o="m0"></div><div class="s" data-o="m0s"></div></div><span class="op">→</span>' +
          '<div class="mbox to"><div class="k">Multiplul țintă, la vânzare</div><div class="v" data-o="mt"></div><div class="s">unde vrei să ajungi</div></div>' +
          '<button type="button" class="det-btn" data-go="multiplu">Lucrează la factori</button>' +
          '<span class="small" style="color:var(--muted);flex-basis:100%" data-o="mmeth"></span></div><p class="lead-to" data-o="lead"></p>',
        sum: 'Vânzarea la ' + C.R + ' de ani' });
    },
    update: function (p, c) {
      var w = c.w2, w0 = c.w2b;
      var u = VM[c.meth].u, mt = w && w.M != null ? w.M : c.MT;
      out(p, 'm0', nf2.format(c.M0) + '×'); out(p, 'mt', nf2.format(mt) + '×');
      out(p, 'mmeth', VM[c.meth].t + (c.meth !== 'sde' ? ' · ' + esc(c.ind.n) : '') + ' · ' + u);
      out(p, 'm0s', 'partea ta azi valorează ' + shortEur(c.valAzi));
      out(p, 'lead', 'Deci, cu un multiplu de ' + nf2.format(mt) + ' ' + u + ', cifra de afaceri trebuie să fie:');
      fillPath(p, c, w, 'var(--teal)', 'Cifra de afaceri în anul vânzării',
        w ? '<div><div class="k">Încasezi net din vânzare</div><div class="v">' + shortEur(w.saleNet) + '</div><div class="s">valoarea firmei ' + shortEur(w.EV) + '</div></div>' : '',
        w ? '<div class="eqrow"><div class="fact"><div class="k">' + VM[c.meth].base + ' la vânzare</div><div class="v">' + shortEur(w.base) + '</div></div><span class="op">×</span>' +
          '<div class="fact"><div class="k">Multiplul țintă</div><div class="v">' + nf2.format(w.M) + '</div></div><span class="op">=</span>' +
          '<div class="fact"><div class="k">Valoarea firmei</div><div class="v">' + shortEur(w.EV) + '</div><div class="how">minus datoria netă ' + shortEur(state.datorie) + '</div></div><span class="op">→</span>' +
          '<div class="fact gd"><div class="k">Încasezi net</div><div class="v">' + shortEur(w.saleNet) + '</div><div class="how">' + nf0.format(state.cota) + '% din acțiuni, minus ' + nf0.format(state.taxCastig) + '% impozit</div></div></div>' +
          '<div class="facts c3" style="margin-top:12px"><div class="fact ac"><div class="k">Freedom number</div><div class="v">' + shortEur(c.FN.total) + '</div><div class="how">acoperit doar din vânzare</div></div>' +
          '<div class="fact"><div class="k">Rămas din dividende la ' + c.R + '</div><div class="v">' + shortEur(w.sim.capRet) + '</div><div class="how">rezervă, nu intră în calcul</div></div>' +
          '<div class="fact hi"><div class="k">Dacă rămâi la ' + nf2.format(c.M0) + '×</div><div class="v">' + (!w0 || w0.status === 'imposibil' ? '—' : gfmt(w0.g)) + '</div><div class="how">' + (w0 && w0.status !== 'imposibil' ? 'pe an, cifra de afaceri ' + shortEur(w0.CA) + ' (' + xfmt(w0.X) + ')' : 'nu se ajunge la freedom number') + '</div></div></div>' : '',
        'Capitalul tău pe calea 2');
    }
  };

  R.cale3 = {
    html: function () {
      return pathPage({ col: 'var(--plum)', eye: 'Calea 3 · Din CEO în board', q: 'Cu ce cifră de afaceri pornești în capitolul următor?',
        note: 'Setezi cum arată firma după ce pleci de la conducere. Nu strângi economii pentru capitolul următor: dividendele din board plătesc an de an lifestyle-ul, one-off-urile și fondul de siguranță, după costul CEO-ului, iar la final rămâne moștenirea. Aplicația pleacă din ultimul an de viață și merge înapoi până la cifra de afaceri cu care trebuie să intri în capitolul următor. Dacă aceasta e sub cifra din anul 4 (care acoperă lifestyle-ul și one-off-urile din anii productivi), rămâi la cea din anul 4; altfel firma crește constant din anul 4 până la ea.',
        pre: '<div class="panel"><h2 class="sec">Firma în capitolul următor</h2>' +
          fld('crestere2', 'Ritmul de creștere în capitolul următor', '%', 'constant, real, până la finalul vieții') +
          fld('cotaPastrata', 'Cât vei deține', '%', 'restul acțiunilor le primește noul CEO') +
          fld('costCeo', 'Cât plătești pentru CEO', '€/an', 'cost total, scade din EBITDA') +
          fld('puncteCrestere', 'Cât lași pentru creștere', 'p.p.', 'din cota ta, puncte procentuale din profitul net') +
          fld('legacy', 'Moștenirea pe care vrei să o lași', '€', 'la finalul vieții, în banii de azi, pe lângă acțiuni') +
          '<div class="frow"><span>Dividendul tău se calculează pe</span><b data-o="keep"></b><span class="u">din profit</span></div></div><div data-o="req"></div>',
        sum: 'Dividendele din capitolul următor' });
    },
    update: function (p, c) {
      var w = c.w3;
      out(p, 'keep', pct(c.keep));
      out(p, 'req', w && w.CAreq ? '<p class="lead-to">Capitolul următor cere o cifră de afaceri de <b>' + shortEur(w.CAreq) + '</b> la ' + ani(c.R) + '. ' +
        (w.floor ? 'E sub cifra din anul ' + c.Y4 + ' (' + shortEur(w.CAbase) + '), așa că firma rămâne la aceasta din anul ' + c.Y4 + ' până la ' + ani(c.R) + '.' : 'E peste cifra din anul ' + c.Y4 + ' (' + shortEur(w.CAbase) + '), așa că firma crește constant din anul ' + c.Y4 + ' până la ea.') + '</p>' : '');
      fillPath(p, c, w, 'var(--plum)', 'Cifra de afaceri de pornire în capitolul următor',
        w && w.d1 ? '<div><div class="k">Dividend net, primul an</div><div class="v">' + shortEur(w.d1.net) + '</div><div class="s">' + (c.L2 > 0 ? nf0.format(w.d1.net / (c.L2 * 12) * 100) : '0') + '% din lifestyle</div></div>' : '',
        w && w.d1 ? '<div class="facts c3"><div class="fact gd"><div class="k">Dividend net, primul an</div><div class="v">' + shortEur(w.d1.net) + '</div><div class="how">' + eur(w.d1.net / 12) + ' pe lună</div></div>' +
          '<div class="fact"><div class="k">Dividend net, la ' + ani(c.E) + '</div><div class="v">' + shortEur(w.dLast.net) + '</div><div class="how">firma crește cu ' + gfmt(state.crestere2 / 100) + ' pe an</div></div>' +
          '<div class="fact"><div class="k">Dividende până la capăt</div><div class="v">' + shortEur(w.sim.w.div) + '</div><div class="how">în ' + ani(c.n2) + '</div></div>' +
          '<div class="fact"><div class="k">EBITDA în primul an, după CEO</div><div class="v">' + shortEur(w.eb1) + '</div><div class="how">' + shortEur(w.ER) + ' − ' + shortEur(state.costCeo) + '</div></div>' +
          '<div class="fact ac"><div class="k">Nevoi în capitolul următor</div><div class="v">' + shortEur(w.bc.need) + '</div><div class="how">lifestyle, one-off, fond · plătite din dividende</div></div>' +
          '<div class="fact"><div class="k">Rămas din dividende la ' + c.R + '</div><div class="v">' + shortEur(w.sim.capRet) + '</div><div class="how">rezervă, nu intră în calcul</div></div>' +
          '<div class="fact gd"><div class="k">Moștenirea la ' + ani(c.E) + '</div><div class="v">' + shortEur(state.legacy) + '</div><div class="how">' + (state.legacy > 0 ? 'strânsă din dividendele din board' : 'nicio sumă setată') + '</div></div>' +
          '<div class="fact"><div class="k">Surplus din board la ' + ani(c.E) + '</div><div class="v">' + shortEur(Math.max(0, w.bc.end)) + '</div><div class="how">fără economiile din anii productivi</div></div>' +
          '<div class="fact"><div class="k">Acțiunile tale</div><div class="v">' + nf0.format(state.cotaPastrata) + '%</div><div class="how">rămân și ele în moștenire</div></div></div>' : '',
        'Capitalul tău pe calea 3');
    }
  };

  R.concluzii = {
    html: function () {
      return '<div class="eyebrow">Concluzii</div><h1 class="q">Trei căi către freedom number. Tu alegi.</h1><div data-o="top"></div>' +
        '<div class="routes" id="choose" data-o="cards"></div><div data-o="pick"></div>' +
        '<p class="note small">Exercițiu de planificare în euro de azi, nu plan financiar sau fiscal. Valorile fiscale se confirmă cu contabilul pe legislația în vigoare. Pensia de stat și chiriile nu sunt incluse.</p>';
    },
    bind: function (p) {
      p.querySelector('#choose').addEventListener('click', function (e) { var b = e.target.closest('[data-pick]'); if (!b) return; var v = +b.getAttribute('data-pick'); state.alegere = state.alegere === v ? null : v; changed(); });
    },
    update: function (p, c) {
      out(p, 'top', '<div class="fnbox"><div class="lbl">Freedom number la ' + c.R + ' de ani · ' + ani(c.n2) + ' de capitol următor</div><div class="big">' + (c.FN.ok ? shortEur(c.FN.total) : '—') + '</div>' +
        '<div class="row"><div><b>' + shortEur(state.ca) + '</b>cifra de afaceri azi</div><div><b>' + (isNaN(c.marja) ? '—' : pct(c.marja)) + '</b>marja de profit net</div><div><b>' + shortEur(c.div0.net) + '</b>dividend net azi</div></div></div>');
      var W = [[1, 'var(--accent)', 'Economiile din anii productivi', c.w1, function (w) { return [['Dividend net în ultimul an', shortEur(w.divLast)]]; }, 'cale1'],
               [2, 'var(--teal)', 'Vânzarea companiei', c.w2, function (w) { return [['Multiplul (' + VM[c.meth].u + ')', nf2.format(c.M0) + ' → ' + nf2.format(w.M)], ['Încasezi net din vânzare', shortEur(w.saleNet)]]; }, 'cale2'],
               [3, 'var(--plum)', 'Din CEO în board', c.w3, function (w) { return [['Cota păstrată', nf0.format(state.cotaPastrata) + '%'], ['Dividend net, primul an', shortEur(w.d1.net)], ['Moștenire la final', shortEur(state.legacy)]]; }, 'cale3']];
      out(p, 'cards', W.map(function (x) {
        var w = x[3], sel = state.alegere === x[0], ok = w && w.status !== 'imposibil';
        return '<div class="route' + (sel ? ' sel' : '') + '" style="border-color:' + x[1] + '"><div class="rt" style="color:' + x[1] + '">Calea ' + x[0] + '</div><p class="rv">' + x[2] + '</p>' +
          (ok ? '<div class="cbig" style="color:' + x[1] + '">' + shortEur(w.CA) + '</div><p class="small" style="color:var(--muted)">' + 'cifra de afaceri la ' + c.R + ' de ani' + '</p>' +
            '<dl>' + dl((w.p1 ? [['Primii ' + ani(w.p1.yrs), gfmt(w.p1.g) + ' pe an → ' + shortEur(w.p1.CA)], ['Apoi, constant', gfmt(w.g) + ' pe an']] : [['Ritm constant de creștere', gfmt(w.g) + ' pe an']]).concat([ ['De câte ori crește firma', xfmt(w.X)], ['EBITDA la ' + c.R + ' de ani', shortEur(w.ER)]]).concat(x[4](w))) + '</dl>'
            : '<p class="small" style="color:var(--cabinet)">Pe această cale nu se ajunge la freedom number.</p>') +
          '<div class="eqrow"><button type="button" class="det-btn" data-pick="' + x[0] + '" aria-pressed="' + sel + '">' + (sel ? 'Alegerea ta ✓' : 'Aleg această cale') + '</button><button type="button" class="link" data-go="' + x[5] + '">Vezi calculul</button></div></div>';
      }).join(''));
      var pk = state.alegere ? W[state.alegere - 1] : null, pw = pk && pk[3];
      out(p, 'pick', pk && pw && pw.status !== 'imposibil' ? '<p class="concl">Ai ales calea ' + pk[0] + ': firma trebuie să ajungă la <span class="a">' + shortEur(pw.CA) + '</span> cifră de afaceri până la ' + ani(c.R) + (pw.p1 ? ': ' + gfmt(pw.p1.g) + ' pe an în primii ' + ani(pw.p1.yrs) + ', apoi o creștere constantă de <span class="b">' + gfmt(pw.g) + ' pe an</span>' : ', cu o creștere constantă de <span class="b">' + gfmt(pw.g) + ' pe an</span>') + '.</p>' : '<p class="note">Alege calea pe care o urmezi. Poți reveni oricând asupra ei.</p>');
    }
  };

  /* ---------- ritmul: ce ritm poate ține firma ta (extragerea DE CE-ului) ---------- */
  var RITMS = [
    { id: 'men', n: 'Menținere', d: 'sub 1,1× pe an', y: ['< 1,1×', '< 1,1×', '< 1,1×'], m: [1.05, 1.05, 1.05], lo: -9, col: 'var(--muted)' },
    { id: 'len', n: 'Creștere lentă', d: '+10–20% pe an', y: ['1,1–1,2×', '1,1–1,2×', '1,1–1,2×'], m: [1.15, 1.15, 1.15], lo: 0.10, col: 'var(--teal)' },
    { id: 'sta', n: 'Creștere stabilizată', d: '+25–50% pe an', y: ['1,25–1,5×', '1,25–1,5×', '1,25–1,5×'], m: [1.37, 1.37, 1.37], lo: 0.20, col: 'var(--accent)' },
    { id: 'rap', n: 'Creștere rapidă', d: 'se dublează', y: ['2×', '2×', '1,7×'], m: [2, 2, 1.7], lo: 0.5, col: 'var(--plum)' },
    { id: 'ful', n: 'Creștere fulgerătoare', d: 'se triplează', y: ['3×', '3×', '2×'], m: [3, 3, 2], lo: 1.0, col: 'var(--cabinet)' }
  ];
  function ritmIdx(g) { var r = 0; RITMS.forEach(function (x, i) { if (g >= x.lo - 1e-9) r = i; }); return r; }
  function ritmChip(g) {
    if (g == null || isNaN(g)) return '';
    var i = ritmIdx(g), x = RITMS[i], al = state.ritmAles, cmp = '';
    if (al != null) cmp = i <= al ? ' <span class="rcmp ok">în ritmul ales</span>' : ' <span class="rcmp no">peste ritmul ales</span>';
    return '<span class="rchip" style="--rc:' + x.col + '">' + x.n + '</span>' + cmp;
  }
  function ritmSpark(x) {
    var v = [1], W = 84, H = 34; x.m.forEach(function (m) { v.push(v[v.length - 1] * m); });
    var mx = 18, pts = v.map(function (y, i) { return (4 + i * (W - 8) / 3).toFixed(1) + ',' + (H - 4 - (Math.log(y) / Math.log(mx)) * (H - 8)).toFixed(1); }).join(' ');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true"><polyline points="' + pts + '" fill="none" stroke="' + x.col + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  var WHY = ['De ce vrei ca firma să crească în ritmul ăsta?', 'De ce e important asta pentru tine?', 'Ce s-ar întâmpla dacă n-ar crește așa?', 'Și cum te-ar afecta, concret?', 'Ce decizie iei luni, știind asta?'];
  /* ținta pe 4 ani: cifra de afaceri din slide-ul 9 (lifestyle + one-off în anul 4) */
  function tinta4(c) {
    var y = c.Y4 || 0, g = c.g1 || 0; if (!y || !(state.ca > 0)) return null;
    var X = Math.pow(1 + g, y);
    return { y: y, g: g, X: X, ca: state.ca * X, age: c.varsta + y };
  }
  function ritmEye(n) { return '<div class="eyebrow">Ritmul firmei · pasul ' + n + ' din 6</div>'; }
  function bindTexts(p) {
    p.addEventListener('input', function (e) {
      var t = e.target, k = t.getAttribute('data-t'); if (!k) return;
      if (!state.deCe) state.deCe = { a: '', b: '', c: '', w: [''] };
      if (k.charAt(0) === 'w') state.deCe.w[+k.slice(1)] = t.value; else state.deCe[k] = t.value;
      save();
    });
    p.addEventListener('click', function (e) {
      var h = e.target.closest('[data-hint]'); if (!h) return;
      var ta = p.querySelector('textarea[data-t="' + h.getAttribute('data-for') + '"]'); if (!ta) return;
      ta.value = (ta.value.trim() ? ta.value.replace(/\s+$/, '') + ', ' : '') + h.getAttribute('data-hint');
      ta.dispatchEvent(new Event('input', { bubbles: true })); ta.focus();
    });
  }
  function rampBars(c, t) {
    var vals = []; for (var i = 0; i <= t.y; i++) vals.push(state.ca * Math.pow(1 + t.g, i));
    var mx = vals[vals.length - 1] * 1.08;
    return '<div class="rbars">' + vals.map(function (v, i) {
      var last = i === vals.length - 1;
      return '<div class="rb' + (i === 0 ? ' now' : last ? ' to' : '') + '"><span class="rbv">' + shortEur(v) + '</span><span class="rbb" style="height:' + (v / mx * 100).toFixed(1) + '%"></span><span class="rbl">' + (i === 0 ? 'azi' : 'anul ' + i) + '</span></div>';
    }).join('') + '</div>';
  }
  R.ritm1 = {
    html: function () {
      return ritmEye(1) + '<h1 class="q">Unde ești vs unde ți-ai propus în 4 ani</h1>' +
        '<p class="note">Cifra din anul 4 e cea de pe slide-ul 9: cât trebuie să facă firma ca dividendele să acopere lifestyle-ul și one-off-urile.</p>' +
        '<div data-o="hero"></div>' +
        '<details class="panel sect"><summary>Și de unde vii · ultimii 3 ani</summary>' + fld('caTrecut', 'Cifra de afaceri acum 3 ani', '€', 'aproximativ') + '<div data-o="hist"></div></details>';
    },
    update: function (p, c) {
      var t = tinta4(c);
      out(p, 'hero', !t ? '<p class="note">Ai nevoie de cel puțin 2 ani productivi și o cifră de afaceri ca să vezi ținta.</p>' :
        '<div class="rhero"><div class="rh-box"><div class="k">Unde ești · azi</div><div class="v">' + shortEur(state.ca) + '</div><div class="s">la ' + ani(c.varsta) + '</div></div>' +
        '<div class="rh-mid"><div class="rh-x">' + xfmt(t.X) + '</div><div class="rh-ar" aria-hidden="true"></div><div class="rh-s">în ' + ani(t.y) + ' · ' + gfmt(t.g) + ' pe an</div></div>' +
        '<div class="rh-box to"><div class="k">Unde ți-ai propus · anul ' + t.y + '</div><div class="v">' + shortEur(t.ca) + '</div><div class="s">la ' + ani(t.age) + ' · lifestyle + one-off</div></div></div>' +
        rampBars(c, t) +
        '<div class="rh-foot"><div><span class="k">Diferența de acoperit</span><b>+' + shortEur(t.ca - state.ca) + '</b><span class="s">cifră de afaceri în plus față de azi</span></div>' +
        '<div><span class="k">Ritmul cerut</span><b>' + gfmt(t.g) + ' pe an</b><span class="s">' + ritmChip(t.g).replace(/ <span class="rcmp[^]*$/, '') + '</span></div></div>');
      var gH = state.caTrecut > 0 && state.ca > 0 ? Math.pow(state.ca / state.caTrecut, 1 / 3) - 1 : NaN;
      out(p, 'hist', isNaN(gH) ? '<p class="note small">Completează cifra de acum 3 ani ca să-ți vezi ritmul real.</p>' :
        '<p class="lead-to">De la ' + shortEur(state.caTrecut) + ' la ' + shortEur(state.ca) + ' în 3 ani: ' + xfmt(1 + gH) + ' pe an (' + gfmt(gH) + '). ' + ritmChip(gH).replace(/ <span class="rcmp[^]*$/, '') + '</p>' +
        (t ? '<p class="note small">' + (gH >= t.g ? 'Ritmul cerut pentru anul 4 e sub cel pe care l-ai avut deja.' : 'Ritmul cerut pentru anul 4 e peste cel pe care l-ai avut în ultimii 3 ani.') + '</p>' : ''));
    }
  };
  function qSlide(o) {
    return {
      html: function () {
        var d = state.deCe || {};
        return ritmEye(o.step) + '<div class="qwrap"><div class="qnum">' + o.k + '<small>din 3</small></div><div class="qbody">' +
          '<div class="qctx" data-o="ctx"></div><h1 class="q qbig" data-o="qq"></h1><p class="note">' + o.sub + '</p>' +
          '<textarea class="qta" rows="6" data-t="' + o.key + '" placeholder="Scrie pentru tine. O frază ajunge.">' + esc(d[o.key] || '') + '</textarea>' +
          '<div class="qhints"><span class="small">Te poate ajuta să pornești de la:</span>' + o.hints.map(function (h) { return '<button type="button" class="qh" data-hint="' + esc(h) + '" data-for="' + o.key + '">' + esc(h) + '</button>'; }).join('') + '</div>' +
          '<p class="qsafe">Se salvează automat, doar în acest browser. Nimeni altcineva nu vede ce scrii.</p></div></div>';
      },
      bind: bindTexts,
      update: function (p, c) {
        var t = tinta4(c);
        out(p, 'ctx', t ? 'Drumul tău: <b>' + shortEur(state.ca) + '</b> azi → <b>' + shortEur(t.ca) + '</b> în anul ' + t.y + ' · ' + xfmt(t.X) + ', ' + gfmt(t.g) + ' pe an' : '');
        out(p, 'qq', o.q(t));
      }
    };
  }
  R.ritmA = qSlide({ step: 2, k: 1, key: 'a', sub: 'Lucrul care a dus firma până aici. Pe el se sprijină și drumul următor.',
    q: function () { return 'Ce a făcut firma să crească până acum și vrei să nu pierzi?'; },
    hints: ['un client', 'un om din echipă', 'un produs', 'un canal de vânzare', 'un obicei al meu'] });
  R.ritmB = qSlide({ step: 3, k: 2, key: 'b', sub: 'Merge azi, dar s-ar rupe la primul val mai mare. Nu e o critică, e o hartă.',
    q: function () { return 'Ce ține acum „cu scotch”?'; },
    hints: ['un om-cheie', 'cash-ul', 'procesele', 'livrarea', 'eu, care fac tot'] });
  R.ritmC = qSlide({ step: 4, k: 3, key: 'c', sub: 'Primul lucru care cedează îți spune ce trebuie construit înainte de creștere.',
    q: function (t) { return t ? 'Dacă firma trebuie să crească de ' + xfmt(t.X) + ' în ' + ani(t.y) + ', ce s-ar rupe primul?' : 'Dacă firma ar trebui să crească mai repede decât până acum, ce s-ar rupe primul?'; },
    hints: ['oamenii', 'cash-ul', 'livrarea', 'calitatea', 'timpul meu'] });
  R.ritm2 = {
    html: function () {
      return ritmEye(5) + '<h1 class="q">Ce ritm poate ține firma ta?</h1>' +
        '<p class="note">De câte ori crește cifra de afaceri într-un an. Pe fiecare rând vezi unde cade ținta ta pe 4 ani și fiecare cale după anul 4. Alege ritmul pe care crezi că îl poate ține firma.</p>' +
        '<div class="panel"><div class="rtab" role="table"><div class="rr rh" role="row"><span role="columnheader"></span><span role="columnheader">Ritm</span><span role="columnheader">Anul 1</span><span role="columnheader">Anul 2</span><span role="columnheader">Anul 3</span><span role="columnheader">Cine e aici</span></div><div data-o="rows" class="rtab"></div></div></div>' +
        '<div data-o="cmp"></div>';
    },
    bind: function (p) {
      p.addEventListener('click', function (e) {
        var r = e.target.closest('[data-ritm]'); if (!r) return;
        var v = +r.getAttribute('data-ritm'); state.ritmAles = state.ritmAles === v ? null : v; changed();
      });
    },
    update: function (p, c) {
      var t = tinta4(c), gH = state.caTrecut > 0 && state.ca > 0 ? Math.pow(state.ca / state.caTrecut, 1 / 3) - 1 : NaN;
      var paths = [[1, c.w1, 'var(--accent)'], [2, c.w2, 'var(--teal)'], [3, c.w3, 'var(--plum)']], tags = RITMS.map(function () { return []; });
      if (!isNaN(gH)) tags[ritmIdx(gH)].push('<span class="ptag you">Tu, ultimii 3 ani</span>');
      if (t) tags[ritmIdx(t.g)].push('<span class="ptag tgt">Ținta ta pe 4 ani</span>');
      paths.forEach(function (x) { var w = x[1]; if (!w || w.status === 'imposibil') return; tags[ritmIdx(w.g)].push('<span class="ptag" style="--pc:' + x[2] + '">Calea ' + x[0] + (w.p1 ? ' · după anul ' + w.p1.yrs : '') + '</span>'); });
      out(p, 'rows', RITMS.map(function (x, i) {
        var sel = state.ritmAles === i;
        return '<button type="button" class="rr' + (sel ? ' sel' : '') + '" role="row" data-ritm="' + i + '" aria-pressed="' + sel + '" style="--rc:' + x.col + '"><span class="rsp">' + ritmSpark(x) + '</span><span class="rn"><b>' + x.n + '</b><small>' + x.d + '</small></span>' +
          x.y.map(function (y, j) { return '<span class="ry" data-y="Anul ' + (j + 1) + '">' + y + '</span>'; }).join('') + '<span class="rt2">' + tags[i].join('') + (sel ? '<span class="ptag ales">Ritmul ales de tine</span>' : '') + '</span></button>';
      }).join(''));
      var al = state.ritmAles;
      if (al == null) { out(p, 'cmp', '<p class="note">Alege un rând ca să vezi ce îți cere fiecare cale față de el.</p>'); return; }
      var rows = (t ? '<div><dt>Ținta pe 4 ani cere ' + gfmt(t.g) + ' pe an</dt><dd class="' + (ritmIdx(t.g) <= al ? 'ok">în ritmul ales' : 'no">peste ritmul ales') + '</dd></div>' : '') +
        paths.map(function (x) {
          var w = x[1]; if (!w || w.status === 'imposibil') return '<div><dt>Calea ' + x[0] + '</dt><dd>nu se ajunge</dd></div>';
          var ok = ritmIdx(w.g) <= al;
          return '<div><dt>Calea ' + x[0] + (w.p1 ? ', după anul ' + w.p1.yrs + ',' : '') + ' cere ' + gfmt(w.g) + ' pe an</dt><dd class="' + (ok ? 'ok' : 'no') + '">' + (ok ? 'în ritmul ales' : 'peste ritmul ales') + '</dd></div>';
        }).join('');
      var gap = !isNaN(gH) && al > ritmIdx(gH) ? '<p class="note">Ai ales un ritm mai rapid decât cel pe care l-a avut firma în ultimii 3 ani. Răspunsul de la „ce s-ar rupe primul” e lucrul de care depinde.</p>' : '';
      out(p, 'cmp', '<div class="panel"><h2 class="sec">Față de ritmul ales: ' + RITMS[al].n.toLowerCase() + '</h2><dl class="rdl">' + rows + '</dl>' + gap + '</div>');
    }
  };
  R.ritm3 = {
    html: function () {
      return ritmEye(6) + '<div class="qwrap"><div class="qnum">?<small>de ce</small></div><div class="qbody"><div class="qctx" data-o="ctx"></div><h1 class="q qbig">De ce ritmul ăsta?</h1>' +
        '<p class="note">Coboară câte o treaptă cu „încă un de ce”. Te oprești când ai ajuns la motivul real; de obicei sunt 2–4 trepte, nu 5.</p><div data-o="why"></div>' +
        '<p class="qsafe">Se salvează automat, doar în acest browser.</p></div></div>';
    },
    bind: function (p) {
      bindTexts(p);
      p.addEventListener('click', function (e) {
        if (!e.target.closest('#whyMore')) return;
        if (state.deCe.w.length < 5) state.deCe.w.push(''); save(); R.ritm3.update(p, C);
        var tas = p.querySelectorAll('[data-t^="w"]'); if (tas.length) tas[tas.length - 1].focus();
      });
    },
    update: function (p, c) {
      var al = state.ritmAles, d = state.deCe;
      out(p, 'ctx', al == null ? 'Nu ai ales încă un ritm. <button type="button" class="link" data-go="ritm2">Alege-l în tabel</button>' : 'Ritmul ales: <span class="rchip" style="--rc:' + RITMS[al].col + '">' + RITMS[al].n + '</span>');
      out(p, 'why', '<ol class="whys">' + d.w.map(function (v, i) { return '<li><label class="dq"><span class="dqq">' + WHY[i] + '</span><textarea rows="3" data-t="w' + i + '">' + esc(v || '') + '</textarea></label></li>'; }).join('') + '</ol>' +
        (d.w.length < 5 ? '<button type="button" class="chip" id="whyMore">Încă un „de ce”</button>' : '<p class="note small">Ai ajuns la a cincea treaptă. Răspunsul de aici e cel care contează luni.</p>'));
    }
  };

  /* ---------- urcarea muntelui: BHAG → 3HAG → 12 luni → 90 de zile; primul an antreprenorial ---------- */
  var LUNI = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  var LUNI_L = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];
  /* profile orientative de sezonalitate pe luni calendaristice (ian–dec); se pot ajusta lună cu lună */
  var SEZ = [
    { id: 'none', n: 'Fără sezonalitate', v: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
    { id: 'b2b', n: 'Servicii B2B', v: [0.85, 0.95, 1.05, 1, 1, 1, 0.85, 0.8, 1.05, 1.1, 1.1, 1.25] },
    { id: 'ecom', n: 'E-commerce', v: [0.85, 0.8, 0.9, 0.9, 0.95, 0.9, 0.85, 0.9, 0.95, 1.05, 1.45, 1.5] },
    { id: 'dist', n: 'Distribuție', v: [0.8, 0.85, 1, 1.05, 1.05, 1.05, 1, 1, 1.05, 1.05, 1.05, 1.05] },
    { id: 'cg', n: 'Construcții generale', v: [0.5, 0.6, 0.9, 1.1, 1.2, 1.25, 1.25, 1.25, 1.2, 1.1, 0.95, 0.7] },
    { id: 'cs', n: 'Construcții specializate', v: [0.6, 0.7, 0.95, 1.1, 1.15, 1.2, 1.15, 1.15, 1.15, 1.05, 0.95, 0.85] },
    { id: 'prod', n: 'Producție', v: [0.85, 0.95, 1.05, 1.05, 1.05, 1, 0.9, 0.85, 1.05, 1.1, 1.1, 1.05] },
    { id: 'cont', n: 'Firmă de contabilitate', v: [1, 1, 1.15, 1.1, 1.25, 0.95, 0.9, 0.85, 0.9, 0.95, 0.95, 1] }
  ];
  function an1Eye(n) { return '<div class="eyebrow">Anul antreprenorial · pasul ' + n + ' din 4</div>'; }
  function an1Model(c) { return state.ca * (1 + (c.g1 || 0)); }
  function an1Tinta(c) { return state.an1Ok === false && state.an1Target > 0 ? state.an1Target : an1Model(c); }
  /* creșterea flat: fiecare lună = luna anterioară × (1 + r), pornind de la media lunară de azi; suma celor 12 luni = ținta */
  function flatPlan(c) {
    var T = an1Tinta(c), b = state.ca / 12; if (!(b > 0) || !(T > 0)) return null;
    function sum(r) { var t = 0; for (var k = 1; k <= 12; k++) t += b * Math.pow(1 + r, k); return t; }
    var lo = -0.5, hi = 1; for (var i = 0; i < 80; i++) { var m = (lo + hi) / 2; if (sum(m) < T) lo = m; else hi = m; }
    var r = hi, mo = []; for (var k = 1; k <= 12; k++) mo.push(b * Math.pow(1 + r, k));
    var st = state.startLuna || 0, idx = mo.map(function (x, k) { return state.sez[(st + k) % 12] || 1; });
    var raw = mo.map(function (x, k) { return x * idx[k]; }), rs = raw.reduce(function (a, x) { return a + x; }, 0);
    var bud = raw.map(function (x) { return x * T / rs; });
    var lbl = mo.map(function (x, k) { return LUNI[(st + k) % 12]; });
    return { T: T, base: b, r: r, ann: Math.pow(1 + r, 12) - 1, flat: mo, bud: bud, lbl: lbl, idx: idx, marja: c.marja };
  }
  function monthChart(f, mode) {
    var vals = mode === 'bud' ? f.bud : f.flat, W = 900, H = 250, L = 70, Rr = 16, T = 22, B = 34;
    var max = Math.max.apply(null, vals.concat(f.flat).concat([f.base])) * 1.12, ys = niceStep(max / 4), yMax = Math.ceil(max / ys) * ys;
    var bw = (W - L - Rr) / 12, fnt = 'Inter, sans-serif', o = ['<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Cifra de afaceri pe luni">'];
    function Y(v) { return T + (1 - v / yMax) * (H - T - B); }
    for (var v = 0; v <= yMax + 1; v += ys) {
      o.push('<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="var(--line)"/>');
      o.push('<text x="' + (L - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end" fill="var(--muted)" font-size="13" font-family="' + fnt + '">' + (v === 0 ? '0' : shortEur(v)) + '</text>');
    }
    o.push('<rect x="' + L + '" y="' + T + '" width="' + (bw * 3).toFixed(1) + '" height="' + (H - T - B) + '" fill="var(--accent)" opacity="0.07"/>');
    o.push('<text x="' + (L + 6) + '" y="' + (T + 14) + '" fill="var(--accent)" font-size="12" font-weight="600" font-family="' + fnt + '">primele 90 de zile</text>');
    vals.forEach(function (v, i) {
      var x = L + i * bw + bw * 0.18, w = bw * 0.64;
      o.push('<rect x="' + x.toFixed(1) + '" y="' + Y(v).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + (Y(0) - Y(v)).toFixed(1) + '" rx="3" fill="' + (mode === 'bud' ? 'var(--teal)' : 'var(--accent)') + '" opacity="' + (i < 3 ? 1 : 0.55) + '"><title>' + f.lbl[i] + ': ' + eur(v) + '</title></rect>');
      o.push('<text x="' + (x + w / 2).toFixed(1) + '" y="' + (H - B + 18) + '" text-anchor="middle" fill="var(--muted)" font-size="12" font-family="' + fnt + '">' + f.lbl[i] + '</text>');
    });
    if (mode === 'bud') o.push('<path d="' + f.flat.map(function (v, i) { return (i ? 'L' : 'M') + (L + i * bw + bw / 2).toFixed(1) + ' ' + Y(v).toFixed(1); }).join(' ') + '" fill="none" stroke="var(--accent)" stroke-width="2.5"/>');
    o.push('<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + Y(f.base).toFixed(1) + '" y2="' + Y(f.base).toFixed(1) + '" stroke="var(--ink)" stroke-width="2" stroke-dasharray="6 5"/>');
    o.push('</svg>');
    return '<div class="chart-box">' + o.join('') + '</div><div class="lg-row">' + (mode === 'bud' ? '<span><i class="sw" style="background:var(--teal);height:10px"></i>bugetul tău, cu sezonalitate</span><span><i class="sw" style="background:var(--accent)"></i>creșterea flat</span>' : '<span><i class="sw" style="background:var(--accent);height:10px"></i>creșterea flat, lună de lună</span>') + '<span><i class="sw" style="background:var(--ink)"></i>media lunară de azi</span></div>';
  }
  function quarterTable(f, withBud) {
    var rows = [0, 1, 2, 3].map(function (q) {
      var fl = 0, bu = 0; for (var k = q * 3; k < q * 3 + 3; k++) { fl += f.flat[k]; bu += f.bud[k]; }
      var v = withBud ? bu : fl;
      return '<tr' + (q === 0 ? ' class="q90"' : '') + '><th>T' + (q + 1) + ' · ' + f.lbl[q * 3] + '–' + f.lbl[q * 3 + 2] + (q === 0 ? ' <small>90 de zile</small>' : '') + '</th><td>' + eur(fl) + '</td>' + (withBud ? '<td><b>' + eur(bu) + '</b></td><td class="' + (bu >= fl ? 'pos' : 'neg') + '">' + (bu >= fl ? '+' : '−') + eur(Math.abs(bu - fl)).replace('−', '') + '</td>' : '') +
        '<td>' + (isNaN(f.marja) ? '—' : eur(v * f.marja)) + '</td></tr>';
    }).join('');
    var tf = f.flat.reduce(function (a, x) { return a + x; }, 0);
    return '<div class="tbl-wrap"><table class="qt"><thead><tr><th>Trimestrul</th><th>Flat</th>' + (withBud ? '<th>Bugetat</th><th>Diferență</th>' : '') + '<th>Profit net, la marja de azi</th></tr></thead><tbody>' + rows +
      '<tr class="tot"><th>Anul 1</th><td>' + eur(tf) + '</td>' + (withBud ? '<td><b>' + eur(f.T) + '</b></td><td></td>' : '') + '<td>' + (isNaN(f.marja) ? '—' : eur(f.T * f.marja)) + '</td></tr></tbody></table></div>';
  }
  function mountainSVG(pts) {
    var o = ['<svg viewBox="0 0 1010 470" role="img" aria-label="Urcarea muntelui: vârful, anul 4, primul an, primele 90 de zile">'];
    o.push('<path d="M40 470 L150 300 L210 330 L330 120 L380 150 L430 60 L520 210 L600 270 L700 330 L790 400 L860 470 Z" fill="var(--ink)" opacity="0.85"/>');
    o.push('<path d="M430 60 L470 125 L445 120 L470 170 L430 150 L400 190 L410 140 L380 150 Z" fill="var(--surface)" opacity="0.85"/>');
    o.push('<path d="M330 120 L360 175 L335 168 L320 210 L305 160 L290 185 Z" fill="var(--surface)" opacity="0.6"/>');
    o.push('<path d="M430 60 L520 210 L600 270 L700 330 L790 400" fill="none" stroke="var(--accent)" stroke-width="3" stroke-dasharray="2 8" stroke-linecap="round"/>');
    var P = [[430, 60], [535, 220], [655, 302], [770, 386]];
    pts.forEach(function (t, i) {
      var x = P[i][0], y = P[i][1], lx = x + 40;
      o.push('<line x1="' + (x + 14) + '" y1="' + y + '" x2="' + (lx - 6) + '" y2="' + y + '" stroke="var(--ink)" stroke-width="2"/>');
      o.push('<circle cx="' + x + '" cy="' + y + '" r="13" fill="var(--surface)" stroke="' + (i === 2 ? 'var(--accent)' : 'var(--ink)') + '" stroke-width="5"/>');
      o.push('<text x="' + lx + '" y="' + (y - 3) + '" font-family="Inter Tight, Inter, sans-serif" font-weight="700" font-size="21" fill="' + (i === 2 ? 'var(--accent)' : 'var(--ink)') + '">' + t[0] + '</text>');
      o.push('<text x="' + lx + '" y="' + (y + 20) + '" font-family="Inter, sans-serif" font-size="15" fill="var(--muted)">' + t[1] + '</text>');
    });
    o.push('</svg>');
    return o.join('');
  }
  R.munte = {
    html: function () {
      return an1Eye(1) + '<h1 class="q">Urcarea muntelui</h1>' +
        '<p class="note">Ai ales deja vârful: capitolul următor și calea prin care ajungi acolo. Ai văzut și ce cere anul 4. Acum coborâm muntele până la pasul pe care îl faci luni dimineață.</p>' +
        '<div class="mgrid"><div class="mtn" data-o="mtn"></div><div class="mlist" data-o="ml"></div></div>' +
        '<p class="lead-to">Fiecare punct răspunde la aceeași întrebare, la altă distanță: ce trebuie să fie adevărat până atunci?</p>';
    },
    update: function (p, c) {
      var pk = state.alegere, w = pk ? [c.w1, c.w2, c.w3][pk - 1] : null, t = tinta4(c);
      var top = w && w.status !== 'imposibil' ? shortEur(w.CA) + ' cifră de afaceri la ' + ani(c.R) + ' · calea ' + pk : (c.FN.ok ? 'freedom number ' + shortEur(c.FN.total) + ' la ' + ani(c.R) : 'capitolul următor');
      out(p, 'mtn', mountainSVG([['BHAG · vârful', top], ['3HAG · anul ' + (t ? t.y : 4), t ? shortEur(t.ca) + ' · lifestyle + one-off' : '—'], ['12 luni · anul antreprenorial', '12 trimestre, din anul 1 în anul ' + (t ? t.y : 4)], ['90 de zile', 'o lună antreprenorială = un trimestru']]));
      out(p, 'ml', [
        ['BHAG', 'Vârful', 'Ținta mare și îndrăzneață: capitolul următor, freedom number-ul și calea aleasă' + (pk ? ' (calea ' + pk + ')' : '') + '. Nu se schimbă de la un an la altul.'],
        ['3HAG', 'Anul ' + (t ? t.y : 4), 'Un an de pregătire plus 3 ani de urcare: cifra la care dividendele acoperă lifestyle-ul și one-off-urile' + (t ? ' (' + shortEur(t.ca) + ', ' + xfmt(t.X) + ')' : '') + '.'],
        ['12 luni', 'Anul antreprenorial', 'Cei 3 ani dintre anul 1 și anul 4 au 12 trimestre. Le tratezi ca pe 12 luni ale unui singur an: anul tău antreprenorial.'],
        ['90 de zile', 'O lună antreprenorială', 'Un trimestru. Ce faci acum; aici se vede dacă ești pe drum.']
      ].map(function (x, i) { return '<div class="mli' + (i === 2 ? ' hi' : '') + '"><span class="mk">' + x[0] + '</span><b>' + x[1] + '</b><span>' + x[2] + '</span></div>'; }).join(''));
    }
  };
  R.an1q = {
    html: function () {
      var d = state.deCe || {};
      return an1Eye(2) + '<div class="qwrap"><div class="qnum">12<small>luni</small></div><div class="qbody"><div class="qctx" data-o="ctx"></div>' +
        '<h1 class="q qbig" data-o="qq"></h1><div class="okrow" data-o="ok"></div><div data-o="own"></div>' +
        '<label class="dq"><span class="dqq" data-o="why"></span><textarea class="qta" rows="4" data-t="an1">' + esc(d.an1 || '') + '</textarea></label>' +
        '<p class="qsafe">Se salvează automat, doar în acest browser.</p></div></div>';
    },
    bind: function (p) {
      bindTexts(p);
      p.addEventListener('click', function (e) {
        var b = e.target.closest('[data-ok]'); if (!b) return;
        var v = b.getAttribute('data-ok') === '1';
        state.an1Ok = state.an1Ok === v ? null : v;
        if (state.an1Ok === false && !(state.an1Target > 0)) state.an1Target = Math.round(an1Model(C) / 50000) * 50000;
        changed();
      });
    },
    update: function (p, c) {
      var y1 = an1Model(c), ok = state.an1Ok;
      out(p, 'ctx', 'Din calcul: <b>' + shortEur(state.ca) + '</b> azi → <b>' + shortEur(y1) + '</b> în primul an · ' + gfmt(c.g1 || 0));
      out(p, 'qq', 'Primul an, din calcul, înseamnă ' + shortEur(y1) + '. Îți ajunge cifra asta?');
      out(p, 'ok', '<button type="button" class="okb" data-ok="1" aria-pressed="' + (ok === true) + '"><b>Da</b><span>merg pe ' + shortEur(y1) + '</span></button>' +
        '<button type="button" class="okb" data-ok="0" aria-pressed="' + (ok === false) + '"><b>Nu</b><span>îmi stabilesc altă cifră</span></button>');
      var own = p.querySelector('[data-o="own"]');
      if (ok === false && !own.querySelector('#f_an1Target')) own.innerHTML = '<div class="panel">' + fld('an1Target', 'Cifra mea pentru primul an', '€', 'cifra de afaceri pe 12 luni') + '</div>';
      if (ok !== false) own.innerHTML = '';
      var own2 = ok === false && state.an1Target > 0 ? state.an1Target / state.ca - 1 : null;
      if (own2 != null) { var s2 = own.querySelector('.ownr'); var h = '<p class="ownr lead-to">' + gfmt(own2) + ' față de azi · ' + ritmChip(own2).replace(/ <span class="rcmp[^]*$/, '') + '</p>'; if (s2) s2.outerHTML = h; else own.querySelector('.panel').insertAdjacentHTML('beforeend', h); }
      out(p, 'why', ok === false ? 'De ce vrei altă cifră decât cea din calcul?' : ok === true ? 'Ce trebuie să fie adevărat ca să o atingi?' : 'Alege mai sus, apoi scrie de ce.');
    }
  };
  R.an1flat = {
    html: function () {
      return an1Eye(3) + '<h1 class="q">Cum arată o creștere flat în primul an</h1>' +
        '<p class="note">Fără sezonalitate: fiecare lună crește cu același procent față de luna dinainte, pornind de la media lunară de azi, iar cele 12 luni adunate dau ținta anului. E reperul față de care îți pui bugetul.</p>' +
        '<div class="panel"><div class="frow"><label for="stL">Primul an începe în</label><select id="stL">' + LUNI_L.map(function (l, i) { return '<option value="' + i + '"' + (i === (state.startLuna || 0) ? ' selected' : '') + '>' + l + '</option>'; }).join('') + '</select><span class="u"></span></div></div>' +
        '<div class="panel jpanel"><div data-o="st"></div><div data-o="ch"></div></div><div data-o="tb"></div>';
    },
    bind: function (p) { p.querySelector('#stL').addEventListener('change', function (e) { state.startLuna = +e.target.value; changed(); }); },
    update: function (p, c) {
      var f = flatPlan(c); if (!f) { out(p, 'st', '<p class="note">Completează cifra de afaceri de azi.</p>'); return; }
      out(p, 'st', '<div class="jstats"><div><div class="k">Ținta primului an</div><div class="v">' + shortEur(f.T) + '</div><div class="s">' + (state.an1Ok === false ? 'cifra ta' : 'din calcul') + '</div></div>' +
        '<div><div class="k">Creștere de la lună la lună</div><div class="v" style="color:var(--accent)">' + gfmt(f.r) + '</div><div class="s">media de azi: ' + shortEur(f.base) + ' pe lună</div></div>' +
        '<div><div class="k">Primele 90 de zile</div><div class="v">' + shortEur(f.flat[0] + f.flat[1] + f.flat[2]) + '</div><div class="s">' + f.lbl[0] + '–' + f.lbl[2] + '</div></div>' +
        '<div><div class="k">Ultima lună a anului</div><div class="v">' + shortEur(f.flat[11]) + '</div><div class="s">ritmul cu care intri în anul 2</div></div></div>');
      out(p, 'ch', monthChart(f, 'flat'));
      out(p, 'tb', '<div class="panel"><h2 class="sec">Pe trimestre</h2>' + quarterTable(f, false) + '</div>');
    }
  };
  R.an1buget = {
    html: function () {
      return an1Eye(4) + '<h1 class="q">Bugetul tău pentru primul an</h1>' +
        '<p class="note">Aceeași țintă, împărțită după cum se mișcă de obicei afacerea ta în timpul anului. Alege modelul de afacere și ajustează lunile care la tine arată altfel.</p>' +
        '<div class="panel"><div class="frow"><label for="sezM">Modelul de afacere</label><select id="sezM">' + SEZ.map(function (x) { return '<option value="' + x.id + '"' + (x.id === state.sezModel ? ' selected' : '') + '>' + x.n + '</option>'; }).join('') + (state.sezModel === 'custom' ? '<option value="custom" selected>Ajustat de tine</option>' : '') + '</select><span class="u"></span></div>' +
        '<p class="note small">Cât de puternică e fiecare lună față de o lună obișnuită (1 = medie). Profilurile sunt orientative; le potrivești pe firma ta.</p><div class="sezg" data-o="sez"></div></div>' +
        '<div class="panel jpanel"><div data-o="st"></div><div data-o="ch"></div></div><div data-o="tb"></div>';
    },
    bind: function (p) {
      p.querySelector('#sezM').addEventListener('change', function (e) { var m = SEZ.filter(function (x) { return x.id === e.target.value; })[0]; if (!m) return; state.sezModel = m.id; state.sez = m.v.slice(); rerender(); });
      p.addEventListener('change', function (e) {
        var i = e.target.getAttribute('data-sez'); if (i == null) return;
        var v = parseRo(e.target.value); if (isNaN(v) || v < 0) v = state.sez[+i];
        state.sez[+i] = Math.min(5, Math.round(v * 100) / 100); state.sezModel = 'custom';
        var sel = p.querySelector('#sezM'); if (!sel.querySelector('[value="custom"]')) sel.insertAdjacentHTML('beforeend', '<option value="custom">Ajustat de tine</option>'); sel.value = 'custom';
        changed();
      });
    },
    update: function (p, c) {
      var f = flatPlan(c);
      var box = p.querySelector('[data-o="sez"]'), st = state.startLuna || 0;
      if (!box.querySelector('input') || box.getAttribute('data-st') !== String(st)) {
        box.setAttribute('data-st', String(st));
        box.innerHTML = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (k) { var m = (st + k) % 12; return '<label class="sezc' + (k < 3 ? ' q1' : '') + '"><span>' + LUNI[m] + '</span><input data-sez="' + m + '" inputmode="decimal" value="' + nf2.format(state.sez[m]) + '"></label>'; }).join('');
      } else box.querySelectorAll('input[data-sez]').forEach(function (inp) { if (document.activeElement !== inp) inp.value = nf2.format(state.sez[+inp.getAttribute('data-sez')]); });
      if (!f) return;
      var bq = f.bud[0] + f.bud[1] + f.bud[2], fq = f.flat[0] + f.flat[1] + f.flat[2], mx = f.bud.indexOf(Math.max.apply(null, f.bud)), mn = f.bud.indexOf(Math.min.apply(null, f.bud));
      out(p, 'st', '<div class="jstats"><div><div class="k">Ținta primului an</div><div class="v">' + shortEur(f.T) + '</div><div class="s">' + (state.an1Ok === false ? 'cifra ta' : 'din calcul') + '</div></div>' +
        '<div><div class="k">Primele 90 de zile, bugetat</div><div class="v" style="color:var(--teal)">' + shortEur(bq) + '</div><div class="s">' + (bq >= fq ? '+' : '−') + shortEur(Math.abs(bq - fq)) + ' față de flat</div></div>' +
        '<div><div class="k">Cea mai bună lună</div><div class="v">' + shortEur(f.bud[mx]) + '</div><div class="s">' + LUNI_L[(st + mx) % 12] + '</div></div>' +
        '<div><div class="k">Cea mai slabă lună</div><div class="v">' + shortEur(f.bud[mn]) + '</div><div class="s">' + LUNI_L[(st + mn) % 12] + ' · ' + (f.bud[mn] < f.base ? 'sub media de azi' : 'peste media de azi') + '</div></div></div>');
      out(p, 'ch', monthChart(f, 'bud'));
      out(p, 'tb', '<div class="panel"><h2 class="sec">Pe trimestre · flat față de bugetat</h2>' + quarterTable(f, true) +
        '<p class="note small">Bugetul = creșterea flat × puterea fiecărei luni, readus la ținta anului. Profitul e calculat la marja de profit net de azi (' + (isNaN(f.marja) ? '—' : pct(f.marja)) + ').</p></div>');
    }
  };

  /* ---------- anul antreprenorial: 12 trimestre (anul 1 → anul 4) = 12 luni antreprenoriale ---------- */
  /* cifrele hărții vin mereu din calculul freedom number, cât timp antreprenorul nu le-a modificat (dMan) */
  function destDefaults(c) {
    var t = tinta4(c), mg = isNaN(c.marja) ? 10 : Math.round(c.marja * 1000) / 10, x0 = c.meth === 'ebitda' ? c.M0 : (state.mManAzi || 4), xT = c.meth === 'ebitda' ? c.MT : (state.mManT || x0);
    var s0 = Math.round(an1Model(c) / 1000) * 1000;
    return { dS0: s0, dM0: mg, dX0: Math.round(x0 * 10) / 10, dMT: mg, dST: Math.round((t ? t.ca : s0) / 1000) * 1000, dXT: Math.round(xT * 10) / 10 };
  }
  function destInit(c, force) {
    if (force || !state.dMan) state.dMan = {};
    var d = destDefaults(c), m = state.dMan;
    ['dS0', 'dM0', 'dX0', 'dMT', 'dST', 'dXT'].forEach(function (k) { if (!m[k]) state[k] = d[k]; });
    if (m.dPT && !m.dST) { if (state.dMT > 0) state.dST = Math.round(state.dPT / (state.dMT / 100)); }
    else if (!m.dPT) state.dPT = Math.round(state.dST * state.dMT / 100);
    state.dInit = true; save();
  }
  function destCalc() {
    var S0 = state.dS0, P0 = S0 * state.dM0 / 100, V0 = state.dX0 * P0 * 1.25;
    if (!(state.dST > 0) && state.dMT > 0) state.dST = Math.round(state.dPT / (state.dMT / 100));
    var PT = state.dPT, ST = state.dST, VT = state.dXT * 1.25 * PT;
    return { S0: S0, P0: P0, V0: V0, PT: PT, ST: ST, VT: VT, xS: S0 > 0 ? ST / S0 : NaN, xP: P0 > 0 ? PT / P0 : NaN, xV: V0 > 0 ? VT / V0 : NaN };
  }
  /* creșterea flat pe 12 trimestre: T1 = vânzările anului 1 ÷ 4 × (1 + r); ritmul r face ca ultimele 4 trimestre să dea vânzările din anul 4 */
  function planCalc() {
    var d = destCalc(), b = d.S0 / 4; if (!(b > 0) || !(d.ST > 0)) return null;
    function last4(r) { var t = 0; for (var k = 9; k <= 12; k++) t += b * Math.pow(1 + r, k); return t; }
    var lo = -0.5, hi = 2; for (var i = 0; i < 80; i++) { var m = (lo + hi) / 2; if (last4(m) < d.ST) lo = m; else hi = m; }
    var r = hi, rows = [];
    if (!Array.isArray(state.bud)) state.bud = [];
    for (var z = 0; z < 12; z++) if (!state.bud[z]) state.bud[z] = { v: 0, p: null };
    for (var k = 1; k <= 12; k++) {
      var fv = b * Math.pow(1 + r, k), bu = state.bud[k - 1] || { v: 0, p: null }, bp = bu.p == null ? state.dMT : bu.p;
      rows.push({ k: k, fv: fv, fp: fv * state.dMT / 100, bv: +bu.v || 0, bpct: bp, bpr: (+bu.v || 0) * bp / 100 });
    }
    return { d: d, r: r, ann: Math.pow(1 + r, 4) - 1, rows: rows };
  }
  R.anEnt = {
    html: function () {
      return an1Eye(2) + '<h1 class="q">Trei ani devin un singur an: anul tău antreprenorial</h1>' +
        '<p class="note">Între anul 1 și anul 4 sunt 12 trimestre. Le privești ca pe 12 luni ale unui singur an. Fiecare trimestru e o lună antreprenorială: o lună în care se vede dacă ești pe drum sau nu.</p>' +
        '<div class="panel"><div class="aeg" data-o="aeg"></div></div>' +
        '<div class="grid2"><div class="panel"><h2 class="sec">De ce așa</h2><ul class="cl"><li>Trei ani par departe; 12 luni se țin minte.</li><li>Fiecare trimestru are o cifră de atins și o ședință în care o compari cu ce ai realizat.</li><li>Abaterea dintr-o lună antreprenorială se corectează în următoarea, nu la final de an.</li></ul></div>' +
        '<div class="panel"><h2 class="sec">Ce faci în continuare</h2><ol class="isteps" style="--pc:var(--accent)"><li>Pui pe hartă punctul de plecare (anul 1) și destinația (anul 4).</li><li>Vezi cum arată creșterea flat pe cele 12 luni antreprenoriale.</li><li>Îți scrii bugetul, lună antreprenorială cu lună antreprenorială, alături de ea.</li></ol></div></div>';
    },
    update: function (p, c) {
      var t = tinta4(c), y = t ? t.y : 4, html = '';
      for (var a = 2; a <= y; a++) {
        html += '<div class="aey"><div class="aey-h">Anul ' + a + '</div><div class="aey-q">';
        for (var q = 1; q <= 4; q++) { var k = (a - 2) * 4 + q; html += '<div class="aeq"><span class="aeq-t">T' + q + '</span><b>Luna ' + k + '</b></div>'; }
        html += '</div></div>';
      }
      out(p, 'aeg', '<div class="aeh"><div class="aeh-s"><span class="k">Punctul de plecare</span><b>Anul 1</b><span class="s">anul de pregătire</span></div><div class="aeh-ar" aria-hidden="true">→</div><div class="aeh-s to"><span class="k">Destinația · 3HAG</span><b>Anul ' + y + '</b><span class="s">' + (t ? shortEur(t.ca) + ' cifră de afaceri' : '') + '</span></div></div><div class="aeys">' + html + '</div>');
    }
  };
  function dIn(k, unit) { return '<span class="din"><input data-k="' + k + '" inputmode="decimal" value="' + fmtK(k) + '"><small>' + unit + '</small></span>'; }
  R.dest = {
    html: function () {
      destInit(C);
      return an1Eye(3) + '<h1 class="q">Harta de stabilire a destinației</h1>' +
        '<p class="note">De unde pleci (anul 1) și unde trebuie să ajungi (anul 4). Cifrele sunt preluate din calcul; le schimbi în celulele albe. La țintă, vânzările, marja și profitul sunt legate: schimbi vânzările sau marja și se recalculează profitul; schimbi profitul și se recalculează vânzările. Valoarea firmei = multiplu × profit × 1,25 (EBITDA).</p>' +
        '<div class="dmap"><div class="dcol"><div class="dh">Punctul de plecare · anul 1</div>' +
        '<div class="dr"><span class="dl">Vânzări</span>' + dIn('dS0', '€') + '</div>' +
        '<div class="dr"><span class="dl">Marjă</span>' + dIn('dM0', '%') + '</div>' +
        '<div class="dr calc"><span class="dl">Profit</span><b data-o="P0"></b></div>' +
        '<div class="dr"><span class="dl">Multiplu</span>' + dIn('dX0', '×') + '</div>' +
        '<div class="dr calc"><span class="dl">Valoare</span><b data-o="V0"></b></div></div>' +
        '<div class="dcol mid"><div class="dh">Ritm creștere</div><div class="dx"><span>Vânzări</span><b data-o="xS"></b></div><div class="dx"><span>Profit</span><b data-o="xP"></b></div><div class="dx"><span>Valoare</span><b data-o="xV"></b></div></div>' +
        '<div class="dcol to"><div class="dh">Ținta · anul 4 (3HAG)</div>' +
        '<div class="dr"><span class="dl">Vânzări<small class="dsrc" data-o="stsrc"></small></span>' + dIn('dST', '€') + '</div>' +
        '<div class="dr"><span class="dl">Marjă</span>' + dIn('dMT', '%') + '</div>' +
        '<div class="dr"><span class="dl">Profit</span>' + dIn('dPT', '€') + '</div>' +
        '<div class="dr"><span class="dl">Multiplu</span>' + dIn('dXT', '×') + '</div>' +
        '<div class="dr calc"><span class="dl">Valoare</span><b data-o="VT"></b></div></div></div>' +
        '<div class="eqrow"><button type="button" class="chip" id="dReset">Preia din nou cifrele din calcul</button><span class="small" data-o="dsrc" style="color:var(--muted)"></span></div>';
    },
    bind: function (p) {
      p.querySelector('#dReset').addEventListener('click', function () { destInit(C, true); rerender(); });
      /* ținta: vânzări, marjă și profit sunt legate; modifici una, se recalculează cealaltă */
      p.addEventListener('change', function (e) {
        var k = e.target.getAttribute('data-k'); if (!/^d(S0|M0|X0|ST|PT|MT|XT)$/.test(k || '')) return;
        if (!state.dMan) state.dMan = {};
        state.dMan[k] = true; if (k === 'dST') state.dMan.dPT = false; if (k === 'dPT') state.dMan.dST = false;
        setK(k, parseRo(e.target.value));
        if (k !== 'dST' && k !== 'dPT' && k !== 'dMT') return;
        if (k === 'dPT') { if (state.dMT > 0) state.dST = Math.round(state.dPT / (state.dMT / 100)); }
        else state.dPT = Math.round(state.dST * state.dMT / 100);
      });
    },
    update: function (p, c) {
      var d = destCalc(), t = tinta4(c);
      out(p, 'P0', eur(d.P0)); out(p, 'V0', eur(d.V0)); out(p, 'VT', eur(d.VT));
      out(p, 'xS', isNaN(d.xS) ? '—' : xfmt(d.xS)); out(p, 'xP', isNaN(d.xP) ? '—' : xfmt(d.xP)); out(p, 'xV', isNaN(d.xV) ? '—' : xfmt(d.xV));
      var df = destDefaults(c), mod = state.dMan && state.dMan.dST ? true : Math.abs(state.dST - df.dST) > 1;
      out(p, 'stsrc', mod ? 'din calcul: ' + shortEur(df.dST) + ' · modificat' : 'din calculul freedom number');
      out(p, 'dsrc', 'Din calcul: anul 1 = ' + shortEur(an1Model(c)) + ', anul 4 = ' + (t ? shortEur(t.ca) : '—') + ', marja de azi ' + (isNaN(c.marja) ? '—' : pct(c.marja)) + '.');
    }
  };
  R.plan = {
    html: function () {
      destInit(C);
      return an1Eye(4) + '<h1 class="q">Harta călătoriei: creșterea flat vs bugetul tău</h1>' +
        '<p class="note">În stânga, creșterea flat: fiecare lună antreprenorială (trimestru) crește cu același procent, iar ultimele 4 dau vânzările din anul 4. În dreapta, bugetul tău, scris de mână, cu sezonalitatea afacerii tale.</p>' +
        '<div class="panel jpanel"><div data-o="st"></div><div data-o="ch"></div></div>' +
        '<div class="panel"><div class="eqrow"><button type="button" class="chip" id="bCopy">Pornește bugetul de la creșterea flat</button><button type="button" class="chip" id="bClear">Golește bugetul</button></div><div class="tbl-wrap" data-o="tb"></div></div>';
    },
    bind: function (p) {
      p.addEventListener('change', function (e) {
        var t = e.target, iv = t.getAttribute('data-bv'), ip = t.getAttribute('data-bp'); if (iv == null && ip == null) return;
        var i = +(iv != null ? iv : ip), v = parseRo(t.value); if (!state.bud[i]) state.bud[i] = { v: 0, p: null };
        if (iv != null) state.bud[i].v = isNaN(v) ? 0 : Math.max(0, v); else state.bud[i].p = isNaN(v) ? null : v;
        changed();
      });
      p.querySelector('#bCopy').addEventListener('click', function () { var pl = planCalc(); if (!pl) return; state.bud = pl.rows.map(function (r) { return { v: Math.round(r.fv / 1000) * 1000, p: null }; }); changed(); p.querySelectorAll('[data-bv]').forEach(function (inp) { inp.value = nf0.format(state.bud[+inp.getAttribute('data-bv')].v); }); });
      p.querySelector('#bClear').addEventListener('click', function () { state.bud = []; changed(); p.querySelectorAll('[data-bv]').forEach(function (inp) { inp.value = ''; }); });
    },
    update: function (p, c) {
      var pl = planCalc(); if (!pl) { out(p, 'st', '<p class="note">Completează harta destinației.</p>'); return; }
      var tb = p.querySelector('[data-o="tb"]');
      var sum = function (a, b, f) { var t = 0; for (var i = a; i < b; i++) t += f(pl.rows[i]); return t; };
      var bAll = sum(0, 12, function (r) { return r.bv; }), b4 = sum(8, 12, function (r) { return r.bv; }), f4 = sum(8, 12, function (r) { return r.fv; });
      out(p, 'st', '<div class="jstats"><div><div class="k">Creștere flat, de la o lună antreprenorială la alta</div><div class="v" style="color:var(--accent)">' + gfmt(pl.r) + '</div><div class="s">pe trimestru · ' + gfmt(pl.ann) + ' pe an · ' + ritmChip(pl.ann).replace(/ <span class="rcmp[^]*$/, '') + '</div></div>' +
        '<div><div class="k">Luna 1, flat</div><div class="v">' + shortEur(pl.rows[0].fv) + '</div><div class="s">vânzări în primul trimestru din anul 2</div></div>' +
        '<div><div class="k">Anul 4: buget vs destinație</div><div class="v" style="color:' + (b4 >= pl.d.ST - 1 ? 'var(--teal)' : 'var(--cabinet)') + '">' + (bAll > 0 ? shortEur(b4) : '—') + '</div><div class="s">' + (bAll > 0 ? (b4 >= pl.d.ST - 1 ? 'atinge ' : 'sub ') + shortEur(pl.d.ST) + (b4 >= pl.d.ST - 1 ? '' : ' cu ' + shortEur(pl.d.ST - b4)) : 'scrie bugetul în tabel') + '</div></div></div>');
      out(p, 'ch', planChart(pl));
      var head = '<table class="qt pt"><thead><tr><th rowspan="2">Luna antreprenorială</th><th colspan="3" class="grp">Creștere flat</th><th colspan="3" class="grp b">Bugetat</th><th rowspan="2">Diferență</th></tr><tr><th>Vânzări</th><th>Profit</th><th>%</th><th>Vânzări</th><th>%</th><th>Profit</th></tr></thead><tbody>';
      var body = '', y = 2;
      pl.rows.forEach(function (r, i) {
        var q = (i % 4) + 1, df = r.bv - r.fv;
        body += '<tr><th>Luna ' + r.k + ' <small>T' + q + ' · anul ' + (2 + Math.floor(i / 4)) + '</small></th><td>' + eur(r.fv) + '</td><td>' + eur(r.fp) + '</td><td>' + nf.format(state.dMT) + '%</td>' +
          '<td class="bin"><input data-bv="' + i + '" inputmode="decimal" placeholder="' + nf0.format(Math.round(r.fv / 1000) * 1000) + '" value="' + (r.bv ? nf0.format(r.bv) : '') + '"></td>' +
          '<td class="bin s"><input data-bp="' + i + '" inputmode="decimal" value="' + nf2.format(r.bpct) + '"></td><td>' + (r.bv ? eur(r.bpr) : '—') + '</td>' +
          '<td class="' + (r.bv ? (df >= 0 ? 'pos' : 'neg') : '') + '">' + (r.bv ? (df >= 0 ? '+' : '−') + nf0.format(Math.abs(Math.round(df))) + ' €' : '—') + '</td></tr>';
        if (q === 4) {
          var a = i - 3, fv = sum(a, i + 1, function (x) { return x.fv; }), fp = sum(a, i + 1, function (x) { return x.fp; }), bv = sum(a, i + 1, function (x) { return x.bv; }), bp = sum(a, i + 1, function (x) { return x.bpr; });
          body += '<tr class="tot"><th>Anul ' + y + (y === 4 ? ' · destinația ' + shortEur(pl.d.ST) : '') + '</th><td>' + eur(fv) + '</td><td>' + eur(fp) + '</td><td></td><td>' + (bv ? eur(bv) : '—') + '</td><td>' + (bv ? nf.format(bp / bv * 100) + '%' : '') + '</td><td>' + (bv ? eur(bp) : '—') + '</td><td class="' + (bv ? (bv - fv >= 0 ? 'pos' : 'neg') : '') + '">' + (bv ? (bv - fv >= 0 ? '+' : '−') + nf0.format(Math.abs(Math.round(bv - fv))) + ' €' : '') + '</td></tr>';
          y++;
        }
      });
      if (!tb.querySelector('table') || document.activeElement === null || !tb.contains(document.activeElement)) tb.innerHTML = head + body + '</tbody></table>';
      else {
        /* păstrează focusul: actualizează doar celulele calculate */
        var tmp = document.createElement('div'); tmp.innerHTML = head + body + '</tbody></table>';
        var nr = tmp.querySelectorAll('tbody tr'), orr = tb.querySelectorAll('tbody tr');
        nr.forEach(function (row, i) { row.querySelectorAll('td').forEach(function (td, j) { var o = orr[i].querySelectorAll('td')[j]; if (o && !o.querySelector('input')) { o.innerHTML = td.innerHTML; o.className = td.className; } }); });
      }
    }
  };
  function planChart(pl) {
    var W = 900, H = 250, L = 70, Rr = 16, T = 18, B = 34, n = 12, fnt = 'Inter, sans-serif';
    var max = Math.max.apply(null, pl.rows.map(function (r) { return Math.max(r.fv, r.bv); })) * 1.12, ys = niceStep(max / 4), yMax = Math.ceil(max / ys) * ys, bw = (W - L - Rr) / n;
    var o = ['<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Creșterea flat și bugetul pe cele 12 luni antreprenoriale">'];
    function Y(v) { return T + (1 - v / yMax) * (H - T - B); }
    for (var v = 0; v <= yMax + 1; v += ys) { o.push('<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="var(--line)"/><text x="' + (L - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end" fill="var(--muted)" font-size="13" font-family="' + fnt + '">' + (v === 0 ? '0' : shortEur(v)) + '</text>'); }
    [4, 8].forEach(function (k) { o.push('<line x1="' + (L + k * bw) + '" x2="' + (L + k * bw) + '" y1="' + T + '" y2="' + (H - B) + '" stroke="var(--line)" stroke-dasharray="3 4"/>'); });
    pl.rows.forEach(function (r, i) {
      var x = L + i * bw + bw * 0.2, w = bw * 0.6;
      o.push('<text x="' + (x + w / 2).toFixed(1) + '" y="' + (H - B + 18) + '" text-anchor="middle" fill="var(--muted)" font-size="12" font-family="' + fnt + '">L' + r.k + '</text>');
    });
    o.push('<path d="' + pl.rows.map(function (r, i) { return (i ? 'L' : 'M') + (L + i * bw + bw / 2).toFixed(1) + ' ' + Y(r.fv).toFixed(1); }).join(' ') + '" fill="none" stroke="var(--accent)" stroke-width="3"/>');
    pl.rows.forEach(function (r, i) { o.push('<circle cx="' + (L + i * bw + bw / 2).toFixed(1) + '" cy="' + Y(r.fv).toFixed(1) + '" r="4" fill="var(--accent)"><title>Luna ' + r.k + ', flat: ' + eur(r.fv) + '</title></circle>'); });
    var bp = '', pen = false;
    pl.rows.forEach(function (r, i) { if (r.bv) { bp += (pen ? 'L' : 'M') + (L + i * bw + bw / 2).toFixed(1) + ' ' + Y(r.bv).toFixed(1) + ' '; pen = true; } else pen = false; });
    if (bp) o.push('<path d="' + bp + '" fill="none" stroke="var(--teal)" stroke-width="3" stroke-linejoin="round"/>');
    pl.rows.forEach(function (r, i) { if (r.bv) o.push('<circle cx="' + (L + i * bw + bw / 2).toFixed(1) + '" cy="' + Y(r.bv).toFixed(1) + '" r="5" fill="var(--surface)" stroke="var(--teal)" stroke-width="3"><title>Luna ' + r.k + ', bugetat: ' + eur(r.bv) + '</title></circle>'); });
    o.push('</svg>');
    return '<div class="chart-box">' + o.join('') + '</div><div class="lg-row"><span><i class="sw" style="background:var(--accent)"></i>creșterea flat</span><span><i class="sw" style="background:var(--teal)"></i>bugetul tău</span><span>liniile punctate despart anii 2, 3 și 4</span></div>';
  }

  /* ---------- contractul cu firma: T.E.R.M.S. (R e calculat; T, E, M, S se declară) ---------- */
  function TS() {
    var d = DEF.terms, t = state.terms || (state.terms = JSON.parse(JSON.stringify(d)));
    Object.keys(d).forEach(function (k) { if (t[k] == null) t[k] = JSON.parse(JSON.stringify(d[k])); else if (typeof d[k] === 'object') Object.keys(d[k]).forEach(function (j) { if (t[k][j] == null) t[k][j] = JSON.parse(JSON.stringify(d[k][j])); }); });
    return t;
  }
  function tGet(path) { var o = TS(); path.split('.').forEach(function (k) { o = o == null ? o : o[k]; }); return o; }
  function tSet(path, v) { var ks = path.split('.'), o = TS(); for (var i = 0; i < ks.length - 1; i++) o = o[ks[i]]; o[ks[ks.length - 1]] = v; }
  function tNum(path, unit, w) { var v = tGet(path); return '<span class="din"><input data-tp="' + path + '" data-num="1" inputmode="decimal" style="width:' + (w || 90) + 'px" value="' + (v ? nf0.format(v) : '') + '" placeholder="0"><small>' + (unit || '') + '</small></span>'; }
  function tTxt(path, ph, rows) { return '<textarea class="qta tta" rows="' + (rows || 2) + '" data-tp="' + path + '" placeholder="' + esc(ph || 'Scrie pentru tine.') + '">' + esc(tGet(path) || '') + '</textarea>'; }
  function tLine(path, ph) { return '<input class="tline" data-tp="' + path + '" placeholder="' + esc(ph || '') + '" value="' + esc(tGet(path) || '') + '">'; }
  function tSeg(path, opts) { var v = tGet(path); return '<span class="seg">' + opts.map(function (o) { return '<button type="button" data-tseg="' + path + '" data-v="' + esc(o) + '" aria-pressed="' + (v === o) + '">' + esc(o) + '</button>'; }).join('') + '</span>'; }
  function bindTerms(p, R0) {
    p.addEventListener('input', function (e) {
      var t = e.target, path = t.getAttribute('data-tp'); if (!path) return;
      if (t.getAttribute('data-num')) { var v = parseRo(t.value); tSet(path, isNaN(v) ? 0 : v); } else tSet(path, t.value);
      save(); if (t.getAttribute('data-num') && R0) R0.update(p, C);
    });
    p.addEventListener('click', function (e) {
      var b = e.target.closest('[data-tseg]'); if (!b) return;
      var path = b.getAttribute('data-tseg'), v = b.getAttribute('data-v'); tSet(path, tGet(path) === v ? '' : v); save();
      p.querySelectorAll('[data-tseg="' + path + '"]').forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-v') === tGet(path))); });
      if (R0) R0.update(p, C);
    });
  }
  function termsEye(n) { return '<div class="eyebrow">Contractul cu firma · pasul ' + n + ' din 8</div>'; }
  var LET = { T: ['Timp', 'Cât timp investești în firmă?'], E: ['Energie și efort', 'Ce te încarcă și ce nu mai tolerezi?'], R: ['Resurse', 'Câți bani trebuie să producă firma?'], M: ['Mediu', 'Unde și cum vrei să lucrezi și să trăiești?'], S: ['Sănătate', 'Câtă bătaie de cap ești dispus să suporți?'] };
  function letterHead(L, n, hook, hookPh) {
    return termsEye(n) + '<div class="lethead"><div class="letbig">' + L + '</div><div class="lettxt"><div class="letname">' + LET[L][0] + '</div><h1 class="q">' + LET[L][1] + '</h1></div></div>' +
      '<div class="panel tstep"><div class="tsn">1</div><div class="tsb"><h2 class="sec">Înainte de clauză · singur, în scris</h2><p class="lead-to">' + hook + '</p>' + tTxt(L + '.hk', hookPh, 3) + '<p class="qsafe">Rămâne doar în acest browser. Nu intră în contract.</p></div></div>';
  }
  function tStep(n, title, body) { return '<div class="panel tstep"><div class="tsn">' + n + '</div><div class="tsb"><h2 class="sec">' + title + '</h2>' + body + '</div></div>'; }
  function tQuote(t) { return '<p class="tquote">' + t + '</p>'; }
  function yr(i) { return new Date().getFullYear() + i; }

  R.tIntro = {
    html: function () {
      return termsEye(1) + '<h1 class="q">Contractul tău cu firma</h1>' +
        '<p class="note">Înainte de definiții, o întrebare. Firma lucrează pentru tine. Dacă ar fi un angajat, ce i-ai scrie în contract, în afară de bani?</p>' +
        '<div class="panel">' + tTxt('hook', 'De exemplu: câte zile pe săptămână vrei să fii acolo, ce nu mai faci tu, ce nu se negociază.', 4) + '<p class="qsafe">Scrie întâi. Abia apoi mergi mai departe.</p></div>';
    },
    bind: function (p) { bindTerms(p); },
    update: function () {}
  };
  R.tIntro2 = {
    html: function () {
      return termsEye(2) + '<h1 class="q">Cinci termeni. Unul singur se calculează.</h1>' +
        '<p class="note">Uită-te la ce ai scris pe slide-ul anterior. Fiecare frază de acolo intră într-unul din acești termeni.</p>' +
        '<div class="tgrid">' + ['T', 'E', 'R', 'M', 'S'].map(function (L) { return '<div class="tcard' + (L === 'R' ? ' done' : '') + '"><div class="tl">' + L + '</div><b>' + LET[L][0] + '</b><span>' + LET[L][1] + '</span>' + (L === 'R' ? '<em>calculat deja</em>' : '<em>se declară</em>') + '</div>'; }).join('') + '</div>' +
        '<p class="tquote">R l-ai construit deja: lifestyle-ul, one-off-urile, fondurile, freedom number-ul, calea și harta pe 4 ani. Ceilalți patru termeni se declară. Dacă cifra de la R se atinge doar încălcându-i, contractul e greșit, nu ei.</p>' +
        '<div class="grid2"><div class="panel"><h2 class="sec">Ce iese la final</h2><p>O foaie de contract între tine și firmă: ținta până la capitolul următor, sumele clare pentru următorii 4 ani și cele patru clauze. O semnezi și o pui la vedere.</p></div>' +
        '<div class="panel"><h2 class="sec">De ce un contract</h2><p>Un plan îl amâni. Un contract semnat îl citești când apare o decizie grea: mai angajez, mai lucrez în weekend, mai accept clientul ăsta? Răspunsul e deja scris.</p></div></div>';
    },
    bind: function (p) { bindTerms(p); },
    update: function () {}
  };

  R.tT = {
    html: function () {
      return letterHead('T', 3, 'Gândește-te la săptămâna trecută. Ce ai ratat din cauza firmei? Un lucru concret: o seară, un meci, o vacanță amânată.', 'Săptămâna trecută am ratat…') +
        tStep(2, 'Clauza de timp', '<div class="trow"><span>Câte ore pe săptămână lucrezi azi în firmă</span>' + tNum('T.now', 'ore') + '</div>' +
          '<div class="trow"><span>Câte ore pe săptămână vrei să lucrezi în anul 4</span>' + tNum('T.end', 'ore') + '</div>' +
          '<div class="trow"><span>Câte zile pe săptămână, în anul 4</span>' + tNum('T.zile', 'zile') + '</div>' +
          '<div class="trow"><span>Câte săptămâni de concediu pe an, fără laptop</span>' + tNum('T.conc', 'săpt.') + '</div>' +
          '<label class="dq"><span class="dqq">Ce nu se negociază</span>' + tTxt('T.neg', 'De exemplu: nu lucrez vinerea; miercuri după-amiază sunt la antrenamentul copilului.', 2) + '</label>') +
        tStep(3, 'Ce înseamnă pentru firmă', '<div data-o="tres"></div>') +
        tQuote('Clauzele se schimbă cu firma. Autorii metodei au pornit de la „fac orice e nevoie” și au ajuns, după opt ani, la „patru zile pe săptămână, fără weekenduri, fără lucru în concediu”.');
    },
    bind: function (p) { bindTerms(p, R.tT); },
    update: function (p) {
      var t = TS().T, d = Math.max(0, (t.now || 0) - (t.end || 0)), sapt = 52 - (t.conc || 0);
      out(p, 'tres', '<div class="jstats"><div><div class="k">Ore de predat pe săptămână</div><div class="v" style="color:var(--accent)">' + nf0.format(d) + '</div><div class="s">de la ' + nf0.format(t.now || 0) + ' la ' + nf0.format(t.end || 0) + '</div></div>' +
        '<div><div class="k">Ore de predat pe an</div><div class="v">' + nf0.format(d * sapt) + '</div><div class="s">la ' + sapt + ' săptămâni lucrate</div></div>' +
        '<div><div class="k">Echivalent normă întreagă</div><div class="v">' + nf.format(d * sapt / 1760) + '</div><div class="s">oameni, la 1.760 de ore pe an</div></div></div>' +
        '<p class="note">Orele astea trebuie să le preia cineva sau ceva: un om, un proces, un furnizor. Și asta se plătește din cifra de la R.</p>');
    }
  };

  R.tE = {
    html: function () {
      return letterHead('E', 4, 'Ce ai făcut săptămâna trecută în firmă și te-a golit de energie, deși altcineva l-ar fi putut face?', 'Săptămâna trecută m-a golit…') +
        tStep(2, 'Ce iese din fișa ta', '<p class="note small">Cel mult trei activități, cu orele pe săptămână pe care ți le iau.</p>' +
          [0, 1, 2].map(function (i) { return '<div class="trow"><span class="tn">' + (i + 1) + '</span>' + tLine('E.a.' + i + '.n', ['de exemplu: facturarea și urmărirea plăților', 'de exemplu: ofertele mici', 'de exemplu: problemele zilnice ale echipei'][i]) + tNum('E.a.' + i + '.h', 'ore') + '</div>'; }).join('') +
          '<label class="dq"><span class="dqq">Ce te încarcă și vrei să păstrezi</span>' + tTxt('E.keep', 'Partea din muncă pentru care ai pornit firma.', 2) + '</label>' +
          '<label class="dq"><span class="dqq">Ce nu mai tolerezi</span>' + tTxt('E.no', 'Un tip de client, un comportament, un mod de lucru.', 2) + '</label>') +
        tStep(3, 'Ce înseamnă pentru firmă', '<div data-o="eres"></div>') +
        tQuote('Exemplul autorilor: proprietarul care își ține singur evidențele 4 ore pe săptămână, pe care un specialist le face în 2. Nu economisește bani, îi pierde de două ori.');
    },
    bind: function (p) { bindTerms(p, R.tE); },
    update: function (p) {
      var a = TS().E.a, h = a.reduce(function (s, x) { return s + (+x.h || 0); }, 0), n = a.filter(function (x) { return (x.n || '').trim(); }).length;
      out(p, 'eres', '<div class="jstats"><div><div class="k">Activități care ies din fișa ta</div><div class="v" style="color:var(--accent)">' + n + '</div></div><div><div class="k">Ore pe săptămână eliberate</div><div class="v">' + nf0.format(h) + '</div><div class="s">se adaugă la clauza de timp</div></div></div>');
    }
  };

  function contractRows(c) {
    destInit(c); var pl = planCalc(), d = destCalc(), rows = [];
    for (var i = 1; i <= 4; i++) {
      var y = c.prov && c.prov.years && c.prov.years[i], ca, pr;
      if (i === 1) { ca = d.S0; pr = d.P0; }
      else if (pl) {
        var a = (i - 2) * 4, bv = 0, fv = 0, bp = 0, fp = 0, full = true;
        for (var k = a; k < a + 4; k++) { var r = pl.rows[k]; fv += r.fv; fp += r.fp; if (r.bv) { bv += r.bv; bp += r.bpr; } else full = false; }
        ca = full ? bv : fv; pr = full ? bp : fp;
      }
      rows.push({ i: i, an: yr(i), life: y ? y.life : 0, oo: y ? y.prov : 0, fond: y ? y.fond : 0, div: y ? y.div : 0, ca: ca || 0, pr: pr || 0 });
    }
    return rows;
  }
  function pathInfo(c) {
    var pk = state.alegere || 1, w = [c.w1, c.w2, c.w3][pk - 1], nm = ['Economiile din anii productivi', 'Vânzarea companiei', 'Din CEO în board'][pk - 1];
    return { pk: pk, w: w, nm: nm, ales: !!state.alegere };
  }
  R.tR = {
    html: function () {
      return termsEye(5) + '<div class="lethead"><div class="letbig done">R</div><div class="lettxt"><div class="letname">Resurse · calculat deja</div><h1 class="q">Câți bani trebuie să producă firma?</h1></div></div>' +
        '<div class="panel tstep"><div class="tsn">1</div><div class="tsb"><h2 class="sec">Înainte de cifre · singur, în scris</h2><p class="lead-to">Dacă firma ți-ar plăti exact sumele de mai jos, ce s-ar schimba concret acasă, în primul an?</p>' + tTxt('R.hk', 'În primul an aș putea…', 3) + '<p class="qsafe">Rămâne doar în acest browser.</p></div></div>' +
        tStep(2, 'Ținta până la capitolul următor', '<div data-o="rtop"></div>') +
        tStep(3, 'Sumele pentru următorii 4 ani', '<div class="tbl-wrap" data-o="rtab"></div><p class="note small">Lifestyle, one-off-uri și fonduri: sumele nete, în bani de azi, de pe slide-urile 6–9. Cifra de afaceri și profitul: din harta destinației (anul 1) și harta călătoriei (anii 2–4; bugetul tău când e completat pentru tot anul, altfel creșterea flat).</p>');
    },
    bind: function (p) { bindTerms(p); },
    update: function (p, c) {
      destInit(c); var pi = pathInfo(c), w = pi.w, t = tinta4(c);
      out(p, 'rtop', '<div class="jstats"><div><div class="k">Freedom number</div><div class="v" style="color:var(--accent)">' + (c.FN.ok ? shortEur(c.FN.total) : '—') + '</div><div class="s">la ' + ani(c.R) + ', pentru ' + ani(c.n2) + ' de capitol următor</div></div>' +
        '<div><div class="k">Calea ' + (pi.ales ? 'aleasă' : '1 (nu ai ales încă)') + '</div><div class="v">' + pi.pk + '</div><div class="s">' + pi.nm + '</div></div>' +
        '<div><div class="k">Cifra de afaceri la ' + ani(c.R) + '</div><div class="v">' + (w && w.status !== 'imposibil' ? shortEur(w.CA) : '—') + '</div><div class="s">' + (w && w.status !== 'imposibil' ? gfmt(w.g) + ' pe an după anul ' + (t ? t.y : 4) : '') + '</div></div>' +
        '<div><div class="k">Anul 4 · 3HAG</div><div class="v">' + shortEur(destCalc().ST) + '</div><div class="s">cifra de afaceri din harta destinației</div></div></div>');
      var rows = contractRows(c);
      out(p, 'rtab', '<table class="qt"><thead><tr><th>Anul</th><th>Lifestyle</th><th>One-off pus deoparte</th><th>Fonduri</th><th>Dividend net necesar</th><th>Cifra de afaceri</th><th>Profit</th></tr></thead><tbody>' +
        rows.map(function (r) { return '<tr><th>Anul ' + r.i + ' <small>' + r.an + '</small></th><td>' + eur(r.life) + '</td><td>' + eur(r.oo) + '</td><td>' + eur(r.fond) + '</td><td><b>' + eur(r.div) + '</b></td><td><b>' + eur(r.ca) + '</b></td><td>' + eur(r.pr) + '</td></tr>'; }).join('') + '</tbody></table>');
    }
  };

  R.tM = {
    html: function () {
      return letterHead('M', 6, 'Unde ai lucrat cel mai bine în ultimul an: în ce loc, cu ce oameni în jur, la ce oră din zi?', 'Am lucrat cel mai bine…') +
        tStep(2, 'Clauza de mediu', '<div class="trow"><span>Unde lucrezi în anul 4</span>' + tSeg('M.loc', ['La birou', 'Mixt', 'De acasă', 'De oriunde']) + '</div>' +
          '<div class="trow"><span>Unde vrei să trăiești</span>' + tLine('M.oras', 'oraș, țară, aproape de cine') + '</div>' +
          '<div class="trow"><span>Câți oameni cel mult în firmă</span>' + tNum('M.echipa', 'oameni') + '</div>' +
          '<label class="dq"><span class="dqq">Constrângeri pe care ți le asumi</span>' + tTxt('M.constr', 'De exemplu: nu ne mutăm din biroul de acum, deci cel mult 6 oameni în plus.', 2) + '</label>') +
        tQuote('Mediul pune limite cifrei: un birou care nu se mută înseamnă un număr maxim de oameni, deci un venit pe om pe care firma trebuie să-l atingă.');
    },
    bind: function (p) { bindTerms(p); },
    update: function () {}
  };

  R.tS = {
    html: function () {
      return letterHead('S', 7, 'Ce ai tolerat anul trecut și ai primit mai mult din același lucru?', 'Am tolerat…') +
        tStep(2, 'Cât îți place azi firma ta', '<div class="trow"><span>Pe o scară de la 1 la 10, azi</span>' + tNum('S.azi', '/ 10', 70) + '</div><div class="trow"><span>Nota pe care o vrei în anul 4</span>' + tNum('S.tinta', '/ 10', 70) + '</div>') +
        tStep(3, 'Cât timp dai tot', '<div class="trow"><span>Dacă drumul durează un an, dai tot?</span>' + tSeg('S.y1', ['Da', 'Poate', 'Nu']) + '</div>' +
          '<div class="trow"><span>Dacă durează doi ani?</span>' + tSeg('S.y2', ['Da', 'Poate', 'Nu']) + '</div>' +
          '<div class="trow"><span>Dacă durează trei ani?</span>' + tSeg('S.y3', ['Da', 'Poate', 'Nu']) + '</div><div data-o="sres"></div>') +
        tStep(4, 'Ce oprești, chiar dacă aduce bani', tTxt('S.opresc', 'Un client, un proiect, un om, un obicei.', 2)) +
        tQuote('Anul la care răspunsul devine „poate” e orizontul real al contractului.');
    },
    bind: function (p) { bindTerms(p, R.tS); },
    update: function (p, c) {
      var s = TS().S, h = !s.y1 ? null : s.y1 !== 'Da' ? 0 : !s.y2 ? null : s.y2 !== 'Da' ? 1 : !s.y3 ? null : s.y3 !== 'Da' ? 2 : 3, t = tinta4(c), y = t ? t.y : 4;
      out(p, 'sres', h == null ? '' : '<p class="lead-to">' + (h >= 3 ? 'Dai tot cel puțin 3 ani: orizontul se potrivește cu harta (un an de pregătire + 3 ani).' : (h === 0 ? 'Nu dai tot nici un an.' : 'Dai tot ' + ani(h) + '.') + ' Harta cere ' + ani(y) + ': ori urci mai repede, ori schimbi ținta, ori iei pe cineva care să urce cu tine.') + '</p>');
    }
  };

  R.contract = {
    html: function () {
      return termsEye(8) + '<h1 class="q">Contractul de semnat</h1>' +
        '<p class="note">Completează părțile, verifică foaia și descarc-o în PDF. Semnezi tu, ca antreprenor, și tot tu, pentru firmă. Pune-o unde o vezi când iei decizii.</p>' +
        '<div class="panel"><div class="ctf"><label>Numele tău<input class="tline" data-ct="ctNume" value="' + esc(state.ctNume || '') + '" placeholder="Prenume Nume"></label><label>Firma<input class="tline" data-ct="ctFirma" value="' + esc(state.ctFirma || '') + '" placeholder="Denumirea firmei"></label><label>Locul<input class="tline" data-ct="ctLoc" value="' + esc(state.ctLoc || '') + '" placeholder="Orașul"></label></div>' +
        '<div class="eqrow"><button type="button" class="det-btn" id="ctPdf">Descarcă PDF</button><button type="button" class="chip" id="ctPrint">Printează</button><span class="small" data-o="ctmsg" style="color:var(--muted)"></span></div></div>' +
        '<div class="ctwrap"><div class="ctdoc" id="ctDoc" data-o="doc"></div></div>';
    },
    bind: function (p) {
      p.addEventListener('input', function (e) { var k = e.target.getAttribute('data-ct'); if (!k) return; state[k] = e.target.value; save(); R.contract.update(p, C); });
      p.querySelector('#ctPrint').addEventListener('click', function () { try { window.print(); } catch (er) { out(p, 'ctmsg', 'Printarea nu e disponibilă aici. Folosește „Descarcă PDF”.'); } });
      p.querySelector('#ctPdf').addEventListener('click', function () { contractPdf(p); });
    },
    update: function (p, c) { out(p, 'doc', contractHtml(c)); }
  };
  function cv(v, ph) { return v && String(v).trim() ? esc(String(v).trim().replace(/[.;,\s]+$/, '')) : '<span class="ctblank">' + ph + '</span>'; }
  function deW(n, w) { n = Math.round(n || 0); var m = Math.abs(n) % 100; return nf0.format(n) + ((m >= 20 || (m === 0 && n !== 0)) ? ' de ' : ' ') + w; }
  function contractHtml(c) {
    var t = TS(), pi = pathInfo(c), w = pi.w, d = destCalc(), rows = contractRows(c), tt = tinta4(c), y4 = tt ? tt.y : 4;
    var today = new Date(), dt = today.getDate() + ' ' + LUNI_L[today.getMonth()] + ' ' + today.getFullYear();
    var acts = t.E.a.filter(function (x) { return (x.n || '').trim(); });
    var hz = !t.S.y1 ? '—' : t.S.y1 !== 'Da' ? 'mai puțin de un an' : !t.S.y2 ? '—' : t.S.y2 !== 'Da' ? 'un an' : !t.S.y3 ? '—' : t.S.y3 !== 'Da' ? 'doi ani' : 'cel puțin trei ani';
    return '<div class="ct-h"><div class="ct-k">Turnul de Control · Contractul cu firma</div><h2>Contract între ' + cv(state.ctNume, 'antreprenor') + ' și ' + cv(state.ctFirma, 'firmă') + '</h2><p>Încheiat la ' + cv(state.ctLoc, 'locul') + ', la ' + dt + '. Sumele sunt nete, în euro, în banii de azi.</p></div>' +
      '<div class="ct-art"><h3>Art. 1 · Obiectul</h3><p>Firma lucrează pentru antreprenor. Ea se obligă să îi plătească viața aleasă acum și să construiască, până la ' + ani(c.R) + ', capitalul pentru capitolul următor, pe calea ' + pi.pk + ': <b>' + pi.nm + '</b>.</p></div>' +
      '<div class="ct-art"><h3>Art. 2 · Ținta și durata</h3><table class="ct-t"><tr><td>Freedom number, la ' + ani(c.R) + '</td><td><b>' + (c.FN.ok ? eur(c.FN.total) : '—') + '</b></td></tr><tr><td>Cifra de afaceri la ' + ani(c.R) + ' (calea ' + pi.pk + ')</td><td><b>' + (w && w.status !== 'imposibil' ? eur(w.CA) : '—') + '</b></td></tr><tr><td>Destinația pe 4 ani (anul ' + y4 + ', ' + yr(y4) + '): cifra de afaceri · profit</td><td><b>' + eur(d.ST) + ' · ' + eur(d.PT) + '</b></td></tr><tr><td>Durata acestui contract</td><td>' + yr(1) + ' – ' + yr(4) + ': un an de pregătire și 3 ani de urcare</td></tr></table></div>' +
      '<div class="ct-art"><h3>Art. 3 · Resurse (R): sumele pe următorii 4 ani</h3><table class="ct-t ct-g"><tr><th>Anul</th><th>Lifestyle</th><th>One-off</th><th>Fonduri</th><th>Dividend net</th><th>Cifra de afaceri</th><th>Profit</th></tr>' +
        rows.map(function (r) { return '<tr><td>' + r.an + '</td><td>' + eur(r.life) + '</td><td>' + eur(r.oo) + '</td><td>' + eur(r.fond) + '</td><td><b>' + eur(r.div) + '</b></td><td><b>' + eur(r.ca) + '</b></td><td>' + eur(r.pr) + '</td></tr>'; }).join('') + '</table></div>' +
      '<div class="ct-art"><h3>Art. 4 · Timp (T)</h3><p>Antreprenorul lucrează azi ' + deW(t.T.now, 'ore') + ' pe săptămână. În anul 4 lucrează cel mult <b>' + deW(t.T.end, 'ore') + '</b>, în <b>' + deW(t.T.zile, 'zile') + '</b> pe săptămână, cu <b>' + deW(t.T.conc, 'săptămâni') + '</b> de concediu pe an, fără lucru. Ce nu se negociază: ' + cv(t.T.neg, 'de completat') + '.</p></div>' +
      '<div class="ct-art"><h3>Art. 5 · Energie și efort (E)</h3><p>Ies din fișa antreprenorului: ' + (acts.length ? acts.map(function (x) { return esc(x.n) + (x.h ? ' (' + nf0.format(x.h) + ' ore/săpt.)' : ''); }).join('; ') : '<span class="ctblank">de completat</span>') + '. Rămâne a lui: ' + cv(t.E.keep, 'de completat') + '. Nu mai tolerează: ' + cv(t.E.no, 'de completat') + '.</p></div>' +
      '<div class="ct-art"><h3>Art. 6 · Mediu (M)</h3><p>Lucrează: ' + cv(t.M.loc, 'de completat') + '. Trăiește: ' + cv(t.M.oras, 'de completat') + '. Firma are cel mult ' + (t.M.echipa ? '<b>' + deW(t.M.echipa, 'oameni') + '</b>' : '<span class="ctblank">…</span> oameni') + '. Constrângeri asumate: ' + cv(t.M.constr, 'de completat') + '.</p></div>' +
      '<div class="ct-art"><h3>Art. 7 · Sănătate (S)</h3><p>Nota relației cu firma azi: <b>' + nf0.format(t.S.azi || 0) + '/10</b>; în anul 4: <b>' + nf0.format(t.S.tinta || 0) + '/10</b>. Antreprenorul dă tot: ' + hz + '. Se oprește, chiar dacă aduce bani: ' + cv(t.S.opresc, 'de completat') + '.</p></div>' +
      '<div class="ct-art"><h3>Art. 8 · Verificare și renegociere</h3><p>Contractul se verifică la finalul fiecărei luni antreprenoriale (un trimestru), cu bugetul față de realizat. Se renegociază la fiecare trecere de stadiu a firmei. O cifră atinsă prin încălcarea articolelor 4–7 nu e un contract onorat.</p></div>' +
      '<div class="ct-sig"><div><span>Antreprenorul</span><b>' + cv(state.ctNume, '') + '</b><i></i></div><div><span>Pentru firmă</span><b>' + cv(state.ctFirma, '') + '</b><i></i></div></div>';
  }
  function loadScript(src) { return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  function contractPdf(p) {
    var el = p.querySelector('#ctDoc'), fn = 'Contract cu firma' + (state.ctFirma ? ' - ' + state.ctFirma : '') + '.pdf';
    out(p, 'ctmsg', 'Pregătesc PDF-ul…');
    var lib = window.html2pdf ? Promise.resolve() : loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js').catch(function () { return loadScript('https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js'); });
    lib.then(function () {
      return window.html2pdf().set({ margin: [12, 12, 14, 12], filename: fn, image: { type: 'jpeg', quality: 0.96 }, html2canvas: { scale: 2, backgroundColor: '#ffffff' }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, pagebreak: { mode: ['css', 'legacy'], avoid: ['.ct-art', '.ct-sig', 'tr'] } }).from(el).outputPdf('blob');
    }).then(function (blob) {
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fn; document.body.appendChild(a); a.click(); a.remove(); out(p, 'ctmsg', 'Gata.');
    }).catch(function () { out(p, 'ctmsg', 'Nu am putut genera PDF-ul aici. Folosește „Printează” și alege „Salvează ca PDF”.'); });
  }

  /* ---------- montare în aplicația de sală ---------- */
  function goId(id) { if (opts.navigate) opts.navigate(id); }
  function rerender() {
    if (!container || !pageId) return;
    C = calc(state);
    var r = R[pageId];
    container.innerHTML = '';
    if (!r) return;
    cur = h(r.html());
    container.appendChild(cur);
    if (r.bind) r.bind(cur);
    r.update(cur, C);
  }
  function changed() {
    if (!cur) return;
    C = calc(state); save();
    R[pageId].update(cur, C);
    cur.querySelectorAll('input[data-k]').forEach(function (inp) { if (document.activeElement !== inp) inp.value = fmtK(inp.getAttribute('data-k')); });
  }
  function bindContainer(el) {
    el.addEventListener('click', function (e) {
      if (!cur || el !== container) return;
      var b = e.target.closest('button[data-k][data-d]');
      if (b) { var k = b.getAttribute('data-k'); setK(k, state[k] + LIM[k][0] * +b.getAttribute('data-d')); changed(); return; }
      var g = e.target.closest('[data-go]');
      if (g) goId(g.getAttribute('data-go'));
    });
    el.addEventListener('change', function (e) {
      if (!cur || el !== container) return;
      var t = e.target, k = t.getAttribute('data-k');
      if (k) { setK(k, parseRo(t.value)); t.value = fmtK(k); changed(); return; }
      var bk = t.getAttribute('data-b');
      if (bk) {
        var it = findItem(bk), col = +t.getAttribute('data-c'); if (!it) return;
        var n = parseRo(t.value); if (isNaN(n) || n < 0) n = t.value.trim() === '' ? 0 : it.v[col];
        it.v[col] = n; t.value = nf0.format(n); t.classList.toggle('zero', !n); changed();
      }
    });
    el.addEventListener('focusin', function (e) { if (e.target.matches('input[inputmode]')) e.target.select(); });
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.matches('input')) e.target.blur(); });
  }

  /**
   * Montează pagina `id` (din PAGES) în `el`, peste starea `o.state` (obiectul e mutat pe loc).
   * o.onChange(state) e chemat la fiecare modificare; o.navigate(pageId) la „Vezi calculul” / „Lucrează la factori”.
   */
  function mount(el, id, o) {
    container = el; pageId = id; opts = o || {}; state = opts.state; onSave = opts.onChange || null;
    if (!el.__fnBound) { bindContainer(el); el.__fnBound = true; }
    rerender();
    return {
      refresh: function () { if (container === el) changed(); },
      destroy: function () { if (container === el) { container = null; cur = null; pageId = null; onSave = null; } el.innerHTML = ''; },
    };
  }
  /** Foaia de contract pentru o stare oarecare (ex. o versiune semnată), fără să atingă pagina montată. */
  function renderContract(s) {
    var pS = state, pC = C, pSave = onSave;
    state = s; onSave = null;
    try { C = calc(s); return contractHtml(C); } finally { state = pS; C = pC; onSave = pSave; }
  }
  /** Amprenta cifrelor (fără ce e doar afișare: categorii deschise, tab-uri). Spune dacă s-a schimbat ceva de la ultima semnare. */
  function fingerprint(s) {
    var c = JSON.parse(JSON.stringify(s));
    ['step', 'dInit', 'mTab', 'ooOpen', 'notesV2', 'notesV3', 'manualV1'].forEach(function (k) { delete c[k]; });
    if (c.cats) c.cats.forEach(function (g) { delete g.open; });
    return JSON.stringify(c);
  }
  /** Cifrele-cheie ale unui participant, pentru panoul „Sala”. */
  function summary(s) {
    var c = calc(s), pk = s.alegere, w = pk ? [c.w1, c.w2, c.w3][pk - 1] : c.w1;
    var ok = w && w.status !== 'imposibil';
    return { varsta: c.varsta, R: c.R, E: c.E, ca: s.ca, marja: c.marja, divNet: c.div0.net, FN: c.FN.ok ? c.FN.total : NaN, cale: pk, caR: ok ? w.CA : NaN, g: ok ? w.g : NaN, g1: c.g1, X: ok ? w.X : NaN, ritmAles: s.ritmAles, metoda: s.valMetoda || 'ebitda', M0: c.M0, MT: c.MT };
  }

  var fmt = { eur: eur, shortEur: shortEur, pct: pct, ani: ani, gfmt: gfmt, xfmt: xfmt, nf0: nf0, nf2: nf2 };
  var CALE_NUME = ['Economiile din anii productivi', 'Vânzarea companiei', 'Din CEO în board'];
  var RITM_NUME = RITMS.map(function (r) { return r.n; });

export { PAGES, fresh, normalize, calc, mount, renderContract, fingerprint, summary, fmt, CALE_NUME, RITM_NUME };
