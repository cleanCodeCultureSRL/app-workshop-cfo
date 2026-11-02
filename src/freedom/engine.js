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

  /* industrii: intervalele din care se derivă multiplul pe venituri și marja EBITDA tipică (IMM private Europa) */
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
    crestere: ['Veniturile au scăzut', 'Creștere 0-5% pe an', 'Creștere 5-10% pe an', 'Creștere 10-20% pe an', 'Creștere peste 20% pe an, susținută'],
    recurenta: ['Sub 10%: fiecare vânzare se câștigă de la zero', '10-30%', '30-50%', '50-75%', 'Peste 75%: abonamente sau contracte pe termen lung'],
    concentrare: ['Primii 3 clienți peste 60% din CA', '40-60%', '25-40%', '10-25%', 'Sub 10%: portofoliu foarte diversificat'],
    dependenta: ['Totul trece prin antreprenor', 'Antreprenorul e implicat zilnic în operațiuni și vânzări', 'Echipă, dar deciziile importante depind de antreprenor', 'Managementul conduce operațiunile, antreprenorul face strategie', 'Firma funcționează autonom, procese documentate'],
    informatie: ['Doar contabilitate fiscală', 'Situații anuale, analize ocazionale', 'P&L managerial periodic', 'BVC, P&L și cash flow lunar, KPI', 'Raportare completă, previziuni, audit'],
    marja: ['Marja EBITDA mult sub industrie', 'Sub minimul tipic al industriei', 'În partea de jos a intervalului tipic', 'În partea de sus a intervalului tipic', 'Peste maximul tipic al industriei'],
    stabilitate: ['În scădere sau foarte volatil', 'Variații de peste 30% de la an la an', 'Variații de 15-30%', 'Variații de 5-15%', 'Stabil sau în creștere constantă']
  };
  var VF = [['crestere', 'Creșterea veniturilor (ultimii 3 ani)', 0.20], ['marja', 'Marja EBITDA față de industrie (calculată)', 0.20], ['recurenta', 'Venit recurent / contractual (% din CA)', 0.20],
    ['concentrare', 'Ponderea primilor 3 clienți în CA', 0.15], ['dependenta', 'Dependența de antreprenor', 0.15], ['informatie', 'Calitatea informației financiare', 0.10]];
  var SF = [
    ['T1', 'Ce s-ar întâmpla cu firma dacă ați lipsi o lună întreagă?', ['Activitatea s-ar opri', 'Pierderi mari de clienți sau venituri', 'Ar funcționa, cu probleme și decizii amânate', 'Ar funcționa aproape normal', 'Ar funcționa normal, fără mine']],
    ['T2', 'Câți dintre clienții importanți au relație personală doar cu dumneavoastră?', ['Toți', 'Majoritatea', 'Aproximativ jumătate', 'Puțini', 'Niciunul; relația e cu firma și echipa']],
    ['T3', 'Există angajați cheie care pot conduce operațiunile și ar rămâne după vânzare?', ['Nu există', 'Există, dar sunt incerți să rămână', 'Pe o parte din activitate', 'Există și probabil rămân', 'Echipă stabilă, cu stimulente să rămână']],
    ['T4', 'Licențele, contractele cheie și furnizorii importanți sunt legați de persoana dumneavoastră?', ['Da, pe numele meu', 'În mare parte', 'Parțial', 'În mică măsură', 'Nu, toate pe firmă și transferabile']],
    ['T5', 'Cât mai are de durat contractul de chirie și poate fi transferat?', ['Sub 1 an sau fără contract', '1-2 ani', '2-3 ani', 'Peste 3 ani, transferabil', 'Peste 5 ani garantat, spațiu propriu sau nu depinde de locație']],
    ['T6', 'Procesele sunt scrise și sunteți dispus să rămâneți pentru predare?', ['Nimic scris, nu rămân', 'Nimic scris, rămân sub 3 luni', 'Parțial scrise, rămân 3-6 luni', 'În mare parte scrise, rămân 6-12 luni', 'Proceduri complete, predare structurată']],
    ['crestere', 'Creșterea veniturilor (ultimii 3 ani)', null, 0.15], ['stabilitate', 'Stabilitatea SDE (ultimii 3 ani)', null, 0.15], ['recurenta', 'Venit recurent / contractual (% din CA)', null, 0.15],
    ['concentrare', 'Ponderea primilor 3 clienți în CA', null, 0.15], ['informatie', 'Calitatea informației financiare', null, 0.10]];
  var SDE_TAB = [[50000, 1.00, 1.25], [75000, 1.10, 1.80], [100000, 2.00, 2.70], [200000, 2.50, 3.00], [500000, 3.00, 4.00], [1000000, 3.25, 4.25]];
  var VM = { venit: { t: 'Multiplu pe venituri', u: '× cifra de afaceri', base: 'Cifra de afaceri' }, sde: { t: 'Multiplu SDE', u: '× SDE', base: 'SDE' } };

  /* ---------- starea ---------- */
  var DEF = {
    speranta: 85, retragere: 60, aniRamasi: 15,
    randament: 7, taxRand: 10, randFond: 1, inflatie: 3, metoda: 'consum', economii: null, ecoV2: true, curs: 5,
    urgLuni: 6, reloc1: 20000, reloc2: 20000, sanatate1: 50000, sanatate2: 50000,
    venituri: null, pierderi: [0, null], nivelPlan: 3, catsV2: true, setup: false, regim: 'profit',
    ca: 1600000, profitMod: 'suma', ebitdaMod: 'suma', profitPct: 0, ebitdaPct: 0, ebitdaK: 0, profitNet: 128000,
    ebitda: 160000, da: 10, crestere: 2, reinvest: 20, cota: 100,
    taxProfit: 16, taxDiv: 16, cassRon: 9720, taxCastig: 16, datorie: 0, vzRitm0: 0, vzRitm: 25, vzRitm2: 10, vzSprinturi: 1, vzMarjaPlus: 0, pgMarja: 0, pgVarsta: 0, pgNivel: 0, pgMultiplu: 0, gol1: true, ooEx2: true, ebK: true, pfVanzare: false, ctxPriv: true,
    mTab: 'azi', alegere: null, valMetoda: 'sde', industrie: 'productie',
    notesV2: true, manualV1: true,
    nV: [1, 1, 1, 1, 1, 1], nVT: [1, 1, 1, 1, 1, 1], notesV3: true, vManual: true, vManAzi: 0.5, vManT: 0.7, sManual: true, sManAzi: 2.2, sManT: 2.8,
    nS: [2, 2, 3, 3, 3, 2, 3, 3, 2, 2, 3], nST: [4, 4, 4, 4, 4, 4, 3, 4, 3, 3, 4],
    sdeSalariu: 60000, sdeChelt: 10000, sdeSalPiata: 50000, sdePodea: 100000, cursUsd: 4.5, factorPiata: 0.85,
    finAport: 30, finDobBanca: 9, finAniBanca: 5, finCreditV: 0, finDobV: 6, finAniV: 3, finRand: 20, finDscr: 1.25,
    cotaPastrata: 70, puncteCrestere: 40, legacy: 100000, costCeo: 70000, crestere2: 2,
    caTrecut: 1200000, ritmAles: null, an1Ok: null, an1Target: 0, sezModel: 'none', sez: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], startLuna: 0, dInit: false, dS0: 0, dM0: 0, dX0: 0, dPT: 0, dST: 0, dMT: 0, dXT: 0, bud: [],
    terms: { hook: '', T: { hk: '', now: 50, end: 30, zile: 4, conc: 4, neg: '' }, E: { hk: '', azi: 6, tinta: 9, a: [{ n: '', h: 0 }, { n: '', h: 0 }, { n: '', h: 0 }], keep: '', no: '', opresc: '' }, R: { hk: '', loc: '', oras: '', echipa: 0, constr: '' }, M: { hk: '' }, S: { hk: '', dispus: '', y1: '', y2: '', y3: '' } },
    stAzi: null, stTinta: null, stPlan: ['', '', '', '', '', ''], exitFacute: [], exitDorit: null, rol: { fraza: '', c: ['', '', ''] }, initiative: ['', '', ''], ctNume: '', ctFirma: '', ctLoc: '', deCe: { a: '', b: '', c: '', w: [''] }
  };
  function buildCats(old) {
    return CATS.map(function (g) { return { g: g.g, open: true, items: g.items.map(function (it) { var v = old && old[it[0]]; return { id: it[0], n: it[1], v: v ? [+v[0] || 0, +v[0] || 0, +v[1] || 0] : [it[2], it[3], it[4]] }; }) }; });
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
    randament: [0.5, -5, 20], taxRand: [1, 0, 50], randFond: [0.5, 0, 10], inflatie: [0.5, -5, 30], curs: [0.05, 1, 10],
    nivelPlan: [1, 1, 4], urgLuni: [1, 6, 12], reloc1: [5000, 0, 1e7], reloc2: [5000, 0, 1e7], sanatate1: [5000, 0, 1e7], sanatate2: [5000, 0, 1e7],
    ca: [50000, 0, 1e10], profitNet: [5000, -1e9, 1e9],
    ebitda: [10000, 0, 1e9], da: [1, 0, 90], crestere: [0.5, -20, 50], reinvest: [5, 0, 100], cota: [1, 1, 100],
    taxProfit: [1, 0, 50], taxDiv: [1, 0, 50], cassRon: [100, 0, 1e6], taxCastig: [1, 0, 50], datorie: [10000, -1e9, 1e9], vzRitm0: [1, -50, 300], vzRitm: [1, 0, 300], vzRitm2: [1, 0, 100], vzSprinturi: [1, 1, 2], vzMarjaPlus: [1, 0, 50], profitPct: [0.5, -50, 100], ebitdaPct: [0.5, -50, 100], ebitdaK: [0.05, 1, 3], pgMarja: [1, 0, 50], pgVarsta: [1, 0, 15], pgNivel: [1, 0, 60], pgMultiplu: [0.5, 0, 10],
    sdeSalariu: [5000, 0, 1e8], sdeChelt: [1000, 0, 1e8], sdeSalPiata: [5000, 0, 1e8], sdePodea: [10000, 0, 1e9], cursUsd: [0.05, 1, 10], factorPiata: [0.05, 0.5, 1.2],
    finAport: [5, 0, 100], finDobBanca: [0.5, 0, 40], finAniBanca: [1, 1, 30], finCreditV: [5, 0, 100], finDobV: [0.5, 0, 40], finAniV: [1, 1, 30], finRand: [1, 0, 100], finDscr: [0.05, 1, 3],
    vManAzi: [0.05, 0, 20], vManT: [0.05, 0, 20], sManAzi: [0.05, 0, 20], sManT: [0.05, 0, 20],
    cotaPastrata: [1, 1, 100], legacy: [10000, 0, 1e9], puncteCrestere: [1, 0, 100], costCeo: [5000, 0, 1e7], crestere2: [0.5, -20, 50], caTrecut: [50000, 0, 1e10], an1Target: [50000, 0, 1e11], dS0: [50000, 0, 1e11], dM0: [0.5, -50, 100], dX0: [0.1, 0, 50], dPT: [10000, -1e10, 1e10], dST: [50000, 0, 1e11], dMT: [0.5, 0.5, 100], dXT: [0.1, 0, 50]
  };
  var PCT_KEYS = { vzRitm0: 1, profitPct: 1, ebitdaPct: 1, ebitdaK: 1, vzRitm: 1, vzRitm2: 1, vzMarjaPlus: 1, pgMultiplu: 1, dM0: 1, dMT: 1, dX0: 1, dXT: 1, sManAzi: 1, sManT: 1, vManAzi: 1, vManT: 1, cursUsd: 1, factorPiata: 1, finAport: 1, finDobBanca: 1, finCreditV: 1, finDobV: 1, finRand: 1, finDscr: 1, randament: 1, taxRand: 1, randFond: 1, inflatie: 1, da: 1, crestere: 1, reinvest: 1, cota: 1, taxProfit: 1, taxDiv: 1, taxCastig: 1, cotaPastrata: 1, puncteCrestere: 1, crestere2: 1, curs: 1 };
  var state = null, onSave = null;
  /* veniturile din toate sursele: firma = dividendele firmei principale, care se calculează separat și nu se adună aici */
  var VEN_GROUPS = ['Afaceri active', 'Venituri din plasamente', 'Expertiză vândută individual', 'Alte venituri'];
  function defaultVen() {
    return [[0, 'Firma principală · dividende', true], [0, 'Firma principală · salariu'], [0, 'Alte afaceri'],
      [1, 'Bancare'], [1, 'Imobiliare'], [1, 'Platforme de investiții'], [1, 'Angel investments'],
      [2, 'Consultanță'], [3, 'Comisioane'], [3, 'Intermedieri']].map(function (r, i) {
      return { id: i + 1, g: r[0], n: r[1], firma: !!r[2], cont: false, v: [0, null] };
    });
  }
  /* anul curent și anul următor; o coloană goală repetă anul anterior, iar după anul următor rămâne ultima coloană */
  function venAt(v, i) { for (var k = Math.min(i, 4); k >= 0; k--) if (v[k] != null) return +v[k] || 0; return 0; }
  /* tot ce introduce omul pornește gol; rămân doar cotele legale și parametrii de piață */
  var GOL = { speranta: 0, retragere: 0, aniRamasi: 0, randament: 0, inflatie: 0, randFond: 0, urgLuni: 0, reloc1: 0, reloc2: 0, sanatate1: 0, sanatate2: 0, nivelPlan: 0, ca: 0, profitNet: 0, ebitda: 0, profitPct: 0, ebitdaPct: 0, ebitdaK: 0, reinvest: 0, cota: 0, datorie: 0, crestere: 0, vzRitm0: 0, vzRitm: 0, vzRitm2: 0, vzSprinturi: 0, vzMarjaPlus: 0, vManAzi: 0, vManT: 0, sManAzi: 0, sManT: 0, sdeSalariu: 0, sdeChelt: 0, sdeSalPiata: 0, sdePodea: 0, cotaPastrata: 0, puncteCrestere: 0, legacy: 0, costCeo: 0, crestere2: 0, caTrecut: 0, pgMarja: 0, pgVarsta: 0, pgNivel: 0, pgMultiplu: 0 };
  function fresh() {
    var s = exemplu();
    Object.keys(GOL).forEach(function (k) { s[k] = GOL[k]; });
    s.alegere = null; s.metoda = 'consum'; s.economii = null; s.ebitdaMod = 'factor';
    s.terms.T.now = s.terms.T.end = s.terms.T.zile = s.terms.T.conc = 0; s.terms.E.azi = s.terms.E.tinta = 0;
    s.vManual = s.sManual = false; s.nV = s.nV.map(function () { return 1; }); s.nVT = s.nVT.map(function () { return 1; }); s.nS = s.nS.map(function () { return 1; }); s.nST = s.nST.map(function () { return 1; });
    s.cats.forEach(function (g) { g.items.forEach(function (it) { it.v = [0, 0, 0]; }); });
    s.oneoff = s.oneoff.map(function (o) { o.varsta = 0; o.suma = 0; o.oblig = false; return o; }); s.venituri.forEach(function (r) { r.v = [0, null]; });
    return s;
  }
  /* exemplul complet, doar pentru repetiții */
  function exemplu() {
    var s = JSON.parse(JSON.stringify(DEF)); s.alegere = 2; s.metoda = 'minim';
    s.cats = buildCats(null);
    s.oneoff = defaultOO(Math.round(s.retragere - s.aniRamasi), s.retragere);
    s.venituri = defaultVen();
    return s;
  }
  /** Starea unui participant, cum vine de pe server sau din browser: completată cu ce lipsește și migrată de la forme mai vechi. */
  function normalize(raw) {
    try { if (raw && typeof raw === 'object') { var s = raw, f = fresh(); if (!s.gol1) return f; if (!s.ebK) { if (!s.ebitda) s.ebitdaMod = 'factor'; s.ebK = true; } if (!s.ooEx2) { var oo0 = s.oneoff || [], idm = oo0.reduce(function (m, o) { return Math.max(m, o.id); }, 0); s.oneoff = f.oneoff.map(function (o) { o.id += idm; return o; }).concat(oo0); s.ooEx2 = true; } if (s.valMetoda === 'ebitda') s.valMetoda = 'sde'; if (!s.cats) s.cats = buildCats(s.buget); delete s.buget; s.cats.forEach(function (g) { g.items.forEach(function (it) { if (it.v.length === 2) it.v = [it.v[0], it.v[0], it.v[1]]; }); }); if (s.oneoff) s.oneoff.forEach(function (o) { if (o.g == null) o.g = guessG(o.nume); }); if (!s.ecoV2) { if (s.economii === 100000) s.economii = null; s.ecoV2 = true; } if (!s.catsV2) { s.cats.forEach(function (g) { g.open = true; }); s.catsV2 = true; } if (s.venituri) s.venituri.forEach(function (r) { r.v = r.v.slice(0, 2); }); if (s.pierderi) s.pierderi = s.pierderi.slice(0, 2); if (!s.notesV2) { s.nE = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]; s.nET = s.nE.slice(); s.notesV2 = true; } if (!s.manualV1) { s.mManual = s.vManual = s.sManual = true; s.manualV1 = true; } if (!s.notesV3) { s.nV = [1, 1, 1, 1, 1, 1]; s.nVT = s.nV.slice(); s.notesV3 = true; } if (s.mval && !s.nE) { s.nE = s.mval.map(function (v) { return Math.min(5, Math.floor(v / 2) + 1); }); s.nET = (s.mvalT || s.mval).map(function (v) { return Math.min(5, Math.floor(v / 2) + 1); }); } for (var k in f) if (!(k in s)) s[k] = f[k]; delete s.step; return s; } } catch (e) {}
    return fresh();
  }
  function save() { if (onSave) onSave(state); }

  /* ---------- motorul de calcul ---------- */
  function pctN(n) { return Math.max(0, Math.min(1, ((+n || 1) - 1) / 4)); }
  function marjaNote(m, ind) { if (!(m > 0)) return 1; if (m < ind.mmin * 0.75) return 1; if (m < ind.mmin) return 2; if (m <= (ind.mmin + ind.mmax) / 2) return 3; if (m <= ind.mmax) return 4; return 5; }
  function scoreV(notes, mNote) { var sc = 0; VF.forEach(function (f, i) { sc += f[2] * pctN(i === 1 ? mNote : notes[i]); }); return sc; }
  function scoreS(notes) { var t = 0; for (var i = 0; i < 6; i++) t += +notes[i] || 1; var sc = 0.30 * pctN(t / 6); for (var j = 6; j < 11; j++) sc += SF[j][3] * pctN(notes[j]); return sc; }
  function annuity(r, n) { return r <= 0 ? 1 / n : r / (1 - Math.pow(1 + r, -n)); }
  /* evaluarea SDE: tabel pe mărime (USD), factor de piață, suma minimă de vânzare, testul cumpărătorului, scorecard */
  function evalSDE(s, sdeEur, score) {
    var o = { msgs: [], ok: sdeEur > 0 };
    if (!o.ok) { o.msgs.push('Afacerea nu generează beneficii pentru proprietar. Valoarea este suma minimă de vânzare.'); o.min = o.max = o.applied = 0; o.value = s.sdePodea; return o; }
    var usd = sdeEur * s.curs / s.cursUsd, T = SDE_TAB, tmin, tmax;
    if (usd <= T[0][0]) { tmin = T[0][1]; tmax = T[0][2]; o.msgs.push('La acest nivel, afacerea este practic un loc de muncă pentru proprietar. Valoarea este dată în principal de active.'); }
    else if (usd >= T[T.length - 1][0]) { tmin = T[T.length - 1][1]; tmax = T[T.length - 1][2]; o.msgs.push('La acest nivel, tabelul SDE nu se mai aplică. Folosește multiplul pe venituri.'); }
    else { for (var i = 0; i < T.length - 1; i++) if (usd >= T[i][0] && usd <= T[i + 1][0]) { var t = (usd - T[i][0]) / (T[i + 1][0] - T[i][0]); tmin = T[i][1] + t * (T[i + 1][1] - T[i][1]); tmax = T[i][2] + t * (T[i + 1][2] - T[i][2]); } }
    var amin = tmin * s.factorPiata, amax = tmax * s.factorPiata, floorM = s.sdePodea / sdeEur;
    var cv = s.finCreditV / 100, ap = s.finAport / 100, pb = Math.max(0, 1 - ap - cv);
    var rate = pb * annuity(s.finDobBanca / 100, s.finAniBanca) + cv * annuity(s.finDobV / 100, s.finAniV), cost = rate + ap * s.finRand / 100;
    var avail = sdeEur - s.sdeSalPiata;
    o.usd = usd; o.tmin = tmin; o.tmax = tmax; o.amin = amin; o.amax = amax; o.floorM = floorM;
    if (avail <= 0) { o.msgs.push('După plata unui salariu de piață pentru conducere, afacerea nu mai generează profit. Un cumpărător plătește doar suma minimă de vânzare.'); o.min = o.max = o.applied = floorM; o.value = s.sdePodea; return o; }
    var capM = Math.min(avail / cost, rate > 0 ? avail / (s.finDscr * rate) : Infinity) / sdeEur; o.capM = capM;
    var mn = Math.max(amin, floorM), mx = Math.min(amax, capM);
    if (floorM > mx) { o.msgs.push('Suma minimă de vânzare depășește ce poate susține profitul. Afacerea se evaluează la această sumă.'); o.min = o.max = o.applied = floorM; o.value = s.sdePodea; return o; }
    if (capM < amin) { o.msgs.push('La prețul minim al pieței, un cumpărător nu și-ar putea finanța achiziția din profit. Plata eșalonată a unei părți din preț (credit vânzător) poate face tranzacția posibilă.'); mn = mx = capM; }
    o.min = mn; o.max = mx; o.applied = mn + score * (mx - mn); o.value = o.applied * sdeEur;
    return o;
  }
  function calc(s) {
    var R = Math.round(s.retragere), varsta = Math.round(s.retragere - s.aniRamasi);
    var E = Math.max(R + 1, Math.round(s.speranta)), n1 = Math.max(0, R - varsta), n2 = E - R;
    /* randamentul real, după impozitul pe randament; fondurile produc separat un randament marginal, tot după impozit */
    var tr = 1 - s.taxRand / 100, rr = (1 + s.randament / 100 * tr) / (1 + s.inflatie / 100) - 1, rf = s.randFond / 100 * tr;
    var L1 = 0, L2 = 0;
    var L1b = 0;
    s.cats.forEach(function (g) { g.items.forEach(function (it) { L1 += +it.v[0] || 0; L1b += +it.v[1] || 0; L2 += +it.v[1] || 0; }); });
    var atins = false, YA = s.setup ? 4 : 3, YT = Math.min(4, Math.max(1, Math.round(+s.nivelPlan) || 1));
    var L1use = L1, life1Tot = 0;
    /* veniturile din afara dividendelor firmei principale */
    var ven = s.venituri || [];
    function altAt(i) { var t = -venAt(s.pierderi || [], i); ven.forEach(function (r) { if (!r.firma) t += venAt(r.v, i); }); return t; }
    var altCont = 0; ven.forEach(function (r) { if (r.cont && !r.firma) altCont += venAt(r.v, 4); });
    /* sursele estimate pe slide-ul 34, inclusiv dividendele firmei principale; baza calculelor rămân cheltuielile declarate */
    function venTot(i) { var t = -venAt(s.pierderi || [], i); ven.forEach(function (r) { if (!r.firma) t += venAt(r.v, i); }); return t; }
    var venDecl = venTot(0), ecoVen = 0; ven.forEach(function (r) { if (r.g === 1) ecoVen += venAt(r.v, 0); });
    var ecoRand = s.randament / 100 * tr, eco = +s.economii || 0;
    /* până la termen nivelul de trai e blocat la cheltuielile actuale, fără să depășească dividendul firmei și celelalte surse; din anul termenului, nivelul dorit devine noul minim */
    function lifeM(i) { return i < (atins ? 1 : YT) ? L1use : L1b; }
    function lifeAt(i) { return lifeM(i) * 12; }
    var ooAt = {}, ooObl = {}, OO1 = 0, OO2 = 0, cnt1 = 0, cnt2 = 0, OO2pv = 0;
    s.oneoff.forEach(function (o) {
      var a = Math.round(o.varsta), v = +o.suma || 0;
      if (a < varsta || a >= E || v <= 0) return;
      ooAt[a] = (ooAt[a] || 0) + v; if (o.oblig) ooObl[a] = (ooObl[a] || 0) + v;
      if (a < R) { OO1 += v; cnt1++; } else { OO2 += v; cnt2++; OO2pv += v / Math.pow(1 + rr, a - R); }
    });
    var urg1 = s.urgLuni * L1, urg2 = s.urgLuni * L2, F1 = urg1 + s.reloc1 + s.sanatate1, F2 = urg2 + s.reloc2 + s.sanatate2;
    var intact = s.metoda === 'capital', minim = s.metoda === 'minim';
    var cassEur = s.cassRon / s.curs, td = s.taxDiv / 100, tp = s.taxProfit / 100, da = s.da / 100;

    var pn0 = s.profitNet, E0 = Math.max(0, s.ebitda), kE = pn0 > 0 && E0 > 0 ? E0 / pn0 : 1;
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
    /* Freedom number: valoarea la începutul capitolului următor a tot ce trebuie plătit, cu un venit anual D(k) care îl reduce */
    function freedom(D, legacy) {
      var lifePv = 0, last = 0, fy = F2 * rf, fyPv = 0;
      /* cheltuielile ies din portofoliu la începutul anului; randamentul fondurilor intră la final de an */
      for (var k = 1; k <= n2; k++) { var need = Math.max(0, L2 * 12 - altCont - (D ? D(k) : 0)); lifePv += need / Math.pow(1 + rr, k - 1); fyPv += fy / Math.pow(1 + rr, k); last = need; }
      var term = 0;
      if (intact) { if (rr <= 0) return { ok: false }; term = (last * (1 + rr) - fy) / rr / Math.pow(1 + rr, n2); }
      var lg = legacy > 0 ? legacy / Math.pow(1 + rr, n2) : 0, total = lifePv + term + OO2pv + F2 + lg - fyPv;
      /* un singur Freedom number: tot ce trebuie să existe în prima zi a capitolului următor */
      return { ok: true, life: lifePv, term: term, oo: OO2pv, fonduri: F2, fondRand: fy, fondPv: fyPv, legacy: lg, fn: total, total: total };
    }
    var FN = freedom(null, minim ? s.legacy : 0);
    var FNsimple = Math.max(0, L2 * 12 - altCont) * n2 + OO2 + F2 + (minim ? s.legacy : 0);

    var share1 = (1 - s.reinvest / 100) * (s.cota / 100);
    /* în interval (până în anul selectat, inclusiv) plățile unice se plătesc din surplus, iar ce rămâne încarcă fondurile; după interval, restul se întinde egal */
    function prodAt(i) { return divNet(E0, share1).net + altAt(i); }
    var capAn = prodAt(0);
    if (capAn > 0) L1use = Math.min(L1, capAn / 12);
    atins = capAn >= L1b * 12 - 0.5;
    var plan = { T: 1, m: Math.max(1, n1 - 1), cover: 0, Fin: 0, Frest: F1 };
    /* cât se pune la fonduri după ce atingi nivelul dorit: 3 ani; cu surplus înainte, totul se termină în cel mult 5 ani */
    function aniFond(i, cuSurplus) { return cuSurplus ? Math.max(1, Math.min(3, 5 - i)) : 3; }
    function fondAt(i) {
      if (n1 <= 1) return i === 0 ? F1 : 0;
      var ny = aniFond(plan.T, plan.Fin > 0.5);
      return i < plan.T ? plan.Fin / plan.T : i < plan.T + ny ? plan.Frest / ny : 0;
    }
    (function () {
      var T = Math.max(1, Math.min(atins ? 1 : YT, n1 - 1)), S = 0, ooI = 0, oblI = 0, i;
      for (i = 0; i < T; i++) S += Math.max(0, prodAt(i) - lifeAt(i));
      for (i = 0; i <= Math.min(T, n1 - 1); i++) { ooI += ooAt[varsta + i] || 0; oblI += ooObl[varsta + i] || 0; }
      var cover = Math.min(S, ooI), Fin = Math.min(S - cover, F1), X = ooI - cover, Xm = Math.max(0, oblI - cover);
      plan = { T: T, m: Math.max(1, n1 - T), S: S, ooI: ooI, cover: cover, Fin: Fin, Frest: F1 - Fin, X: X, Xm: Xm, Xo: X - Xm };
    })();
    function ooLevel(i) { return i < plan.T ? plan.cover / plan.T : (OO1 - plan.cover) / plan.m; }
    var keep = Math.min(s.cotaPastrata, Math.max(0, s.cotaPastrata - s.puncteCrestere)) / 100, g2 = s.crestere2 / 100;
    var ind = indOf(s.industrie), meth = s.valMetoda || 'sde', addS = s.sdeSalariu + s.sdeChelt;
    /* valoarea firmei după metoda aleasă; which = 'azi' sau 'tinta' (factorii la vânzare) */
    function eff(a, t) { return t.map(function (v, i) { return Math.max(+v || 1, +a[i] || 1); }); }
    var nVT = eff(s.nV, s.nVT), nST = eff(s.nS, s.nST);
    function valuation(EB, CAv, which) {
      var tinta = which === 'tinta', o = { meth: meth };
      if (meth === 'venit') {
        var mN = marjaNote(CAv > 0 ? EB / CAv : 0, ind), sc = scoreV(tinta ? nVT : s.nV, mN);
        o.min = ind.rmin; o.max = ind.rmax; o.score = s.vManual ? NaN : sc; o.mult = s.vManual ? (tinta ? s.vManT : s.vManAzi) : ind.rmin + sc * (ind.rmax - ind.rmin); o.base = CAv; o.EV = o.mult * CAv; o.mNote = mN;
      } else {
        var sd = EB + addS, ev = evalSDE(s, sd, scoreS(tinta ? nST : s.nS));
        o.min = ev.min; o.max = ev.max; o.score = s.sManual ? NaN : scoreS(tinta ? nST : s.nS); o.mult = s.sManual ? (tinta ? s.sManT : s.sManAzi) : ev.applied; o.base = sd; o.EV = s.sManual ? o.mult * Math.max(0, sd) : ev.value; o.sde = ev;
      }
      o.equity = Math.max(0, o.EV - s.datorie); o.ours = o.equity * s.cota / 100;
      return o;
    }
    var V0 = valuation(E0, s.ca, 'azi'), VT0 = valuation(E0, s.ca, 'tinta'), M0 = V0.mult, MT = VT0.mult;
    var capFirma = capAn / 12;
    for (var li = 0; li < n1; li++) life1Tot += lifeAt(li);

    /* căile 1 și 2 au două etape: în primii ani firma crește cu g1 până la cifra care acoperă nivelul de trai și plățile unice (slide-ul 38),
       apoi crește constant cu g (ritmul căutat) ca să strângă economiile, respectiv să ajungă la valoarea de vânzare */
    var Y4 = atins ? 0 : Math.max(0, Math.min(YT, n1 - 1)), g1 = 0;
    /* marja EBITDA crește liniar până la final */
    var m0 = s.ca > 0 ? E0 / s.ca : 0;
    function marjaF(route, i) { return route !== 'none' && m0 > 0 && n1 > 0 ? 1 + (s.vzMarjaPlus / 100) * (i / n1) / m0 : 1; }
    /* curba firmei, aceeași pe orice cale: anul de setup, cu ritmul lui, sprinturile (un an antreprenorial = 3 ani), apoi ritmul de după */
    function mult(g, route, i) {
      if (route === 'none') return Math.pow(1 + g, i);
      var yS = s.setup ? 1 : 0, nS = s.vzSprinturi * 3;
      return Math.pow(1 + s.vzRitm0 / 100, Math.min(i, yS)) * Math.pow(1 + g, Math.min(Math.max(0, i - yS), nS)) * Math.pow(1 + s.vzRitm2 / 100, Math.max(0, i - yS - nS));
    }
    function boardDivAt(ER) { return function (k) { return divNet(ER * Math.pow(1 + g2, k - 1) - s.costCeo, keep).net; }; }
    function simulate(g, route, saleNet, bDiv, bEb, cap) {
      var P = eco, Res = 0, rows = [], tot = { div: 0, life: 0, oo: 0, fond: 0, growth: 0, def: 0, def1: 0, defLife: 0 }, runOut = null, firstDef = null;
      var pts = [{ age: varsta, c: P }], fRest = F1, fDin = null, fCota = 0;
      for (var i = 0; i < n1; i++) {
        var a = varsta + i, eb = E0 * mult(g, route, i) * marjaF(route, i), d = divNet(eb, share1), inc = d.net + altAt(i);
        var life = lifeAt(i), oo = ooLevel(i), fond = fondAt(i), start = P, growth = (P > 0 ? P * rr : 0) + Res * rf, def = 0;
        /* nivelul de trai rămâne blocat la ce produce anul, până când firma îl poate plăti */
        if (cap) life = Math.min(life, Math.max(0, inc));
        /* fondurile: până la nivelul dorit doar din surplus; după el în 3 ani, cel mult 4 */
        if (cap && n1 > 1) {
          if (life >= L1b * 12 - 1) {
            if (fDin === null) { fDin = i; fCota = fRest / aniFond(i, fRest < F1 - 0.5); }
            fond = i - fDin >= 3 ? fRest : Math.min(fRest, fCota);
          } else fond = Math.min(fRest, Math.max(0, inc - life - oo));
        }
        if (cap) {
          /* fără economii negative: plătești doar cât ai; restul rămâne neplătit */
          var av = Math.max(0, P) + growth + inc, pl = Math.min(life, av); av -= pl;
          var pf = Math.min(fond, av); av -= pf; var po = Math.min(oo, av); av -= po;
          def = (life - pl) + (fond - pf) + (oo - po); tot.defLife += life - pl;
          if (def > 0.5 && firstDef === null) firstDef = a;
          life = pl; fond = pf; oo = po; P = av;
        } else {
          P = P + growth + inc - life - oo - fond;
          if (P + Res + fond < 0 && runOut === null) runOut = a + 1;
        }
        Res += fond; fRest = Math.max(0, fRest - fond);
        tot.div += inc; tot.life += life; tot.oo += oo; tot.fond += fond; tot.growth += growth; tot.def += def; if (i >= 1) tot.def1 += def;
        rows.push({ age: a, ch: 1, ebitda: eb, start: start, sale: 0, fond: -fond, growth: growth, div: inc, life: -life, oo: -oo, def: -def, end: P, res: Res });
        pts.push({ age: a + 1, c: P + Res });
      }
      var capRet = P + Res, resR = Res, sale = saleNet || 0, w = { div: 0, life: 0, oo: 0, growth: 0 };
      for (var k = 1; k <= n2; k++) {
        var a2 = R + k - 1, st = P, pre = 0, topup = 0;
        if (k === 1) { pre = sale; topup = F2 - Res; Res = F2; }
        /* cheltuielile ies la începutul anului, iar randamentul se aplică la ce rămâne */
        var dv = (bDiv ? bDiv(k) : 0) + altCont, lf = L2 * 12, o2 = ooAt[a2] || 0, base = st + pre - topup + dv - lf - o2, gr = (base > 0 ? base * rr : 0) + Res * rf;
        P = base + gr;
        w.div += dv; w.life += lf; w.oo += o2; w.growth += gr;
        if (P < 0 && runOut === null) runOut = a2 + 1;
        rows.push({ age: a2, ch: 2, ebitda: bEb ? bEb(k) : null, start: st, sale: pre, fond: -topup, growth: gr, div: dv, life: -lf, oo: -o2, def: 0, end: P, res: Res });
        pts.push({ age: a2 + 1, c: Math.max(0, P) + Res });
      }
      return { rows: rows, pts: pts, tot: tot, w: w, capRet: capRet, resR: resR, capTrans: capRet + sale, runOut: runOut, end: P, firstDef: firstDef, cap: !!cap };
    }
    /* un scenariu: firma crește constant cu g pe an în anii productivi */
    function scenario(g, route, M, cap) {
      var X = mult(g, route, n1), ER = E0 * X * marjaF(route, n1), o = { g: g, X: X, ER: ER, CA: s.ca * X, route: route }, saleNet = 0, bDiv = null, bEb = null;
      if (route === 'sale' || (route === 'div' && s.pfVanzare)) {
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
      /* ținta căii: vânzarea și capitalul strâns, dividendul din board sau capitalul strâns */
      if (route === 'sale') o.gap = FN.ok ? FN.total - saleNet - o.sim.capRet : NaN;
      else if (route === 'board') { o.nevoie = Math.max(0, L2 * 12 - altCont); o.gap = o.nevoie - o.d1.net; }
      else o.gap = o.FNr.ok ? o.FNr.total - o.sim.capTrans : NaN; /* calea 1: capitalul strâns, plus vânzarea dacă portofoliul se construiește și din ea */
      o.atinsAn = null; o.sim.rows.forEach(function (r, i) { if (o.atinsAn === null && r.ch === 1 && -r.life >= L1b * 12 - 1) o.atinsAn = i; });
      o.divLast = n1 > 0 ? divNet(E0 * mult(g, route, n1 - 1) * marjaF(route, n1 - 1), share1).net : 0;
      o.curve = []; for (var ci = 0; ci <= n1; ci++) o.curve.push(mult(g, route, ci));
      return o;
    }
    /* se calculează doar calea aleasă */
    function drum(route) {
      if (!FN.ok || E0 <= 0) return null;
      var o = scenario(s.vzRitm / 100, route, 'tinta', true); o.status = 'ok'; o.gMed = n1 > 0 ? Math.pow(o.X, 1 / n1) - 1 : 0; return o;
    }

    var PROV = (function () {
        var o = { ok: E0 > 0 && n1 >= 1, years: [] }; if (!o.ok) return o;
        var i;
        o.peak = 0; o.peakI = 0; o.from = plan.T; o.loan = plan.Xm; o.loanI = plan.T;
        for (i = 0; i < n1; i++) {
          var life = lifeAt(i), fond = fondAt(i), pr = ooLevel(i);
          var alt = altAt(i), ebL = invertNet(Math.max(0, life - alt), share1), ebT = invertNet(Math.max(0, life + fond + pr - alt), share1);
          var y = { i: i, age: varsta + i, life: life, fond: fond, prov: pr, alt: alt, caLife: s.ca * ebL / E0, caTot: s.ca * ebT / E0, div: Math.max(0, life + fond + pr - alt) };
          o.years.push(y);
          if (y.caTot > o.peak) { o.peak = y.caTot; o.peakI = i; }
        }
        o.peakY = o.years[o.peakI];
        o.g = o.peakI > 0 ? Math.pow(o.peak / s.ca, 1 / o.peakI) - 1 : NaN;
        o.X = o.peak / s.ca;
        o.maxProv = Math.max.apply(null, o.years.map(function (y) { return y.prov + y.fond; }));
        return o;
      })();
    /* creșterea minimă până la termen: cifra care plătește nivelul dorit și plățile din acel an */
    var y4R = PROV.ok ? (PROV.years[Y4] || PROV.years[PROV.years.length - 1]) : null;
    var need4 = PROV.ok && Y4 > 0 && y4R ? E0 * y4R.caTot / s.ca : 0;
    if (Y4 > 0 && E0 > 0) g1 = Math.max(0, Math.pow(need4 / E0, 1 / Y4) - 1);

    return {
      prov: PROV, g1: g1, Y4: Y4, need4: need4, atins: atins, YT: YT, YA: YA, altNow: altAt(0), altCont: altCont, altAt: altAt, cheltAt: function (i) { return lifeAt(i) + (ooAt[varsta + i] || 0) + fondAt(i); },
      lifeOnly: (function () {
        var last = Math.max(0, Math.min(YT, n1 - 1)), o = { ok: E0 > 0 && n1 >= 2, yrs: last, toAge: varsta + last, lifeLast: lifeM(last) };
        o.div = Math.max(0, o.lifeLast * 12 - altAt(last)); o.eb = invertNet(o.div, share1); o.pn = o.eb / kE; o.X = E0 > 0 ? o.eb / E0 : NaN; o.CA = s.ca * o.X; o.g = last > 0 ? Math.pow(o.X, 1 / last) - 1 : 0;
        o.tot = o.div * o.yrs; o.tot03 = 0; for (var q = 0; q < Math.min(YT, n1); q++) o.tot03 += lifeAt(q);
        return o;
      })(),
      L1b: L1b, life1Tot: life1Tot, plan: plan, lifeNow: L1use * 12, L1in: L1, capAn: capAn, capFirma: capFirma, venDecl: venDecl,
      R: R, varsta: varsta, E: E, n1: n1, n2: n2, rr: rr, L1: L1, L2: L2, OO1: OO1, OO2: OO2, OO2pv: OO2pv, cnt1: cnt1, cnt2: cnt2, ooAt: ooAt,
      urg1: urg1, urg2: urg2, F1: F1, F2: F2, FN: FN, FNsimple: FNsimple, intact: intact, minim: minim, rf: rf, tr: tr, eco: eco, ecoVen: ecoVen, ecoRand: ecoRand,
      share1: share1, div0: divNet(E0, share1), E0: E0, curba: (function () { var o = []; for (var i = 0; i <= n1; i++) { var x = mult(s.vzRitm / 100, 'cale', i); o.push({ i: i, age: varsta + i, X: x, CA: s.ca * x, eb: E0 * x * marjaF('cale', i) }); } return o; })(), pn0: pn0, marja: s.ca > 0 ? pn0 / s.ca : NaN, kE: kE,
      keep: keep, M0: M0, MT: MT, V0: V0, VT0: VT0, ind: ind, meth: meth, valAzi: V0.ours,
      w1: s.alegere === 1 ? drum('div') : null, w2: s.alegere === 2 ? drum('sale') : null, w3: s.alegere === 3 ? drum('board') : null
    };
  }

  /* ---------- componente ---------- */
  function fmtK(k) { if (k in GOL && !state[k]) return ''; return PCT_KEYS[k] ? nf2.format(state[k]) : nf0.format(state[k]); }
  function fld(k, label, unit, help, small) {
    return '<div class="frow"><label for="f_' + k + '">' + label + (help ? '<small>' + help + '</small>' : '') + '</label>' +
      '<span class="mini"><button type="button" data-k="' + k + '" data-d="-1" aria-label="Scade">−</button><input id="f_' + k + '" data-k="' + k + '" class="' + (small ? 's' : '') + '" inputmode="decimal" value="' + fmtK(k) + '"><button type="button" data-k="' + k + '" data-d="1" aria-label="Crește">+</button></span>' +
      '<span class="u">' + (unit || '') + '</span></div>';
  }
  function setK(k, v) {
    var L = LIM[k]; if (!L || isNaN(v)) return;
    state[k] = Math.min(L[2], Math.max(L[1], Math.round(v * 100) / 100));
  }
  function dl(items) { return items.map(function (it) { return '<div' + (it[2] ? ' class="tot"' : '') + '><dt>' + it[0] + '</dt><dd>' + it[1] + '</dd></div>'; }).join(''); }

  /* linia timpului (din prezentare) */
  function timelineSVG(c, level) {
    level = level || 3;
    var A0 = Math.min(30, Math.floor(c.varsta / 10) * 10), A1 = Math.max(100, Math.ceil(c.E / 10) * 10), W = 1000, L = 40, R = 40, axisY = 128;
    function X(a) { return L + (Math.min(A1, Math.max(A0, a)) - A0) / (A1 - A0) * (W - L - R); }
    var f = 'Source Sans 3, sans-serif', fd = 'Manrope, sans-serif', o = [];
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
    if (level >= 2) post(c.R, 'capitolul următor · ' + c.R, 'middle');
    post(c.E, 'capătul · ' + c.E, 'start');
    o.push('</svg>');
    return o.join('');
  }

  /* graficul capitalului */
  function niceStep(raw) { var q = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / q; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * q; }

  /* ---------- paginile ---------- */
  var PAGES = [
    { id: 'amanat', t: 'Ce ai amânat' }, { id: 'obtii', t: 'Ce obții azi' }, { id: 'regula', t: 'Regula sălii' }, { id: 'teza', t: 'Firma este un instrument' }, { id: 'viataAzi', t: 'Viața ta de azi' }, { id: 'perechi', t: 'De ce e important pentru tine' }, { id: 'viataDorita', t: 'Viața dorită' }, { id: 'ceCauti', t: 'Ce cauți prin succes' }, { id: 'capitolUrm', t: 'Capitolul următor și moștenirea' }, { id: 'rolFirma', t: 'Rolul firmei' }, { id: 'pace', t: 'Libertatea' }, { id: 'calcul', t: 'Calculul Freedom number' }, { id: 'urma', t: 'Ce rămâne după mine' }, { id: 'qSperanta', t: 'Speranța de viață' }, { id: 'qRetragere', t: 'Până când muncești pentru bani' }, { id: 'qAni', t: 'Anii productivi' }, { id: 'timp', t: 'Imaginea de ansamblu' }, { id: 'buget1', t: 'Nivelul de trai · categoriile 1-4' }, { id: 'buget2', t: 'Nivelul de trai · categoriile 5-8' }, { id: 'oneoff', t: 'Plățile unice' }, { id: 'fonduri', t: 'Fondurile de urgență' }, { id: 'freedom', t: 'Freedom number' }, { id: 'freedom2', t: 'Freedom number, cu banii la treabă' }, { id: 'punte', t: 'Puntea' }, { id: 'spv', t: 'Banii antreprenorilor stau în SPV' }, { id: 'spv2', t: 'Firma este vehiculul tău' }, { id: 'spv3', t: 'Vehiculul care aduce liniștea' }, { id: 'firma', t: 'Firma azi' }, { id: 'venituri', t: 'Alte surse și economii' }, { id: 'productivi3', t: 'Ce ai azi' }, { id: 'buget', t: 'Termenul' }, { id: 'productivi', t: 'Cât costă anii productivi' }, { id: 'productivi2', t: 'Până unde trebuie să ajungă firma' }, { id: 'exitQ', t: 'Ce înseamnă exit pentru tine' }, { id: 'exitLinie', t: 'Cele 5 exituri' }, { id: 'exitUnde', t: 'Unde ești pe scară' }, { id: 'ritm1', t: 'Unde ești' }, { id: 'ritmA', t: 'Ce vrei să nu pierzi' }, { id: 'ritmB', t: 'Ce e fragil' }, { id: 'ritmC', t: 'Primul blocaj' }, { id: 'crestereCash', t: 'Creșterea are nevoie de bani' }, { id: 'ritm2', t: 'Tabelul ritmurilor' }, { id: 'ritm3', t: 'De ce ritmul ăsta' }, { id: 'munte', t: 'Urcarea muntelui' }, { id: 'anEnt', t: 'Anul antreprenorial' }, { id: 'curba', t: 'Curba firmei' }, { id: 'drum', t: 'Ce strângi pe drum' }, { id: 'cai', t: 'Cum funcționează calea ta' }, { id: 'multiplu', t: 'Cum se calculează valoarea firmei' }, { id: 'multipluDate', t: 'Cifrele din care pornim' }, { id: 'multipluNote', t: 'Notează firma' }, { id: 'multipluCalc', t: 'Cât valorează firma' }, { id: 'cale', t: 'Calea ta pe cifrele tale' }, { id: 'parghii', t: 'Pârghiile' }, { id: 'firmaCale', t: 'Ce fel de firmă construiești' }, { id: 'concluzii', t: 'Concluzii' }, { id: 'stadii', t: 'Cele 7 stadii' }, { id: 'crize', t: 'Crizele de depășit' }, { id: 'exitNext', t: 'Următorul tău exit' }, { id: 'anEchipa', t: 'Anul echipei' }, { id: 'dest', t: 'Harta destinației' }, { id: 'plan', t: 'Harta călătoriei' }, { id: 'tIntro', t: 'Reacționezi sau conduci' }, { id: 'tIntro2', t: 'Cei cinci termeni' }, { id: 'tT', t: 'T · Timp' }, { id: 'tE', t: 'E · Energie' }, { id: 'tR', t: 'R · Resurse' }, { id: 'tM', t: 'M · Mijloace financiare' }, { id: 'tS', t: 'S · Sănătate' }, { id: 'contract', t: 'Noul Act Constitutiv' }, { id: 'contextZi', t: 'Contextul zilei' }
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
  R.qSperanta = question('speranta', 'Până la ce vârstă îți planifici viața?', 'ani', 'Eurostat 2024: la 65 de ani, un bărbat din România ajunge în medie la 80 de ani, o femeie la 84.', 1);
  R.qRetragere = question('retragere', 'Până la ce vârstă vrei să muncești pentru bani?', 'ani', 'De aici începe capitolul următor. Munca poate continua, dar devine o alegere.', 2);
  R.qAni = question('aniRamasi', 'Câți ani mai ai până atunci?', 'ani', 'Anii productivi sunt anii în care muncești și pentru bani.', 3);
  R.timp = {
    html: function () {
      return '<div class="eyebrow">Timpul pe care îl avem</div><h1 class="q">Imaginea de ansamblu</h1>' +
        '<div class="trio">' +
        '<div class="cell"><div class="k">Vârsta de azi</div><div class="v" data-o="age"></div><div class="k" data-o="ageH"></div></div>' +
        '<div class="cell"><div class="k">Anii productivi</div><div class="v" data-o="n1" style="color:var(--accent)"></div><div class="k" data-o="n1H"></div></div>' +
        '<div class="cell"><div class="k">Anii capitolului următor</div><div class="v" data-o="n2" style="color:var(--cabinet)"></div><div class="k" data-o="n2H"></div></div>' +
        '</div><div class="tl" data-o="tl"></div><p class="concl" data-o="concl"></p>' +
        '<p class="note">Urmează patru sume: nivelul de trai, plățile unice, fondurile de urgență și economiile.</p>';
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
    return '<td><input id="b_' + it.id + '_' + col + '" data-b="' + it.id + '" data-c="' + col + '" inputmode="decimal" aria-label="' + esc(it.n) + ([', nivelul actual', ', nivelul dorit'][col]) + '" value="' + nf0.format(it.v[col]) + '"' + (+it.v[col] ? '' : ' class="zero"') + '></td>';
  }
  /* după cele trei sume: veniturile față de tot ce trebuie plătit, apoi decizia */
  R.buget = {
    html: function () {
      return '<div class="eyebrow">Vehiculul · termenul</div><h1 class="q">În câți ani ajungi la nivelul de trai dorit?</h1>' +
        '<div class="planbox"><div class="planrow">' + fld('nivelPlan', 'Termenul ales', 'ani', 'cel mult 4 ani', true) + '</div>' +
        '<div class="yrbox"><div class="indc"><div class="ih"><span class="k" data-o="y0k"></span></div><div class="iv" data-o="y0"></div><div class="is">pe lună · nivelul blocat</div></div>' +
        '<div class="indc"><div class="ih"><span class="k" data-o="yTk"></span></div><div class="iv" data-o="yT"></div><div class="is">pe lună · noul minim</div></div></div></div>' +
        '<div class="eqrow"><button type="button" class="det-btn" data-go="productivi">Continuă</button></div>';
    },
    update: function (p, c) {
      out(p, 'y0k', c.YT > 1 ? 'Până în anul ' + (c.YT - 1) : 'Anul 0'); out(p, 'y0', eur(c.lifeNow / 12));
      out(p, 'yTk', 'Din anul ' + c.YT); out(p, 'yT', eur(c.L1b));
    }
  };

  /* categoriile se împart echilibrat pe două pagini */
  var CAT_SPLIT = 4;
  function bugetPage(from, to, last) {
    return {
      html: function () {
        return '<div class="eyebrow">Nivelul de trai · pagina ' + (last ? 2 : 1) + ' din 2</div><h1 class="q">Nivelul de trai, pe categorii</h1>' +
          '<details class="panel"><summary>Cum completezi</summary><p class="note">Banii de zi cu zi: euro pe lună, în banii de azi, pentru toată familia. La nivelul actual treci ce cheltuiești azi. La nivelul dorit treci viața pe care o vrei; el rămâne și în capitolul următor. Adaugă subcategorii sau elimină-le pe cele care nu te privesc.</p></details>' +
          '<div class="btable"><table><colgroup><col><col class="v"><col class="v"></colgroup><thead><tr><th>Categorie</th><th class="c1">Nivelul actual<small class="thu">€/lună</small></th><th class="c3">Nivelul dorit<small class="thu">€/lună</small></th></tr></thead><tbody id="bBody"></tbody>' +
          '<tfoot><tr><td>Total pe lună, toate categoriile</td><td class="c1" data-o="L1"></td><td class="c3" data-o="L2"></td></tr><tr><td>Total pe an</td><td data-o="Y1"></td><td data-o="Y2"></td></tr></tfoot></table></div>' +
          (last ? '' : '<div class="eqrow"><button type="button" class="det-btn" data-go="buget2">Continuă</button></div>');
      },
      body: function (p) {
        p.querySelector('#bBody').innerHTML = state.cats.map(function (g, gi) {
          if (gi < from || gi >= to) return '';
          var head = '<tr class="grp' + (g.open ? ' open' : '') + '"><td><button type="button" class="gt" data-gt="' + gi + '" aria-expanded="' + g.open + '"><span class="chev">▸</span><span class="nmg">' + esc(g.g) + '</span><span class="cnt">' + g.items.length + '</span></button></td><td class="c1" data-o="ga' + gi + '"></td><td class="c3" data-o="gm' + gi + '"></td></tr>';
          if (!g.open) return head;
          return head + g.items.map(function (it) {
            var nm = it.custom ? '<input class="nm" id="bn_' + it.id + '" data-bn="' + it.id + '" value="' + esc(it.n) + '" aria-label="Numele subcategoriei">' : '<span>' + esc(it.n) + '</span>';
            return '<tr class="sub"><td><div class="sn">' + nm + '<button type="button" class="rm" data-rm="' + it.id + '" aria-label="Elimină ' + esc(it.n) + '" title="Elimină subcategoria">×</button></div></td>' + bInput(it, 0) + bInput(it, 1) + '</tr>';
          }).join('') + '<tr class="add"><td colspan="3"><button type="button" class="addsub" data-add="' + gi + '">+ Adaugă subcategorie</button></td></tr>';
        }).join('');
      },
      bind: function (p) {
        var self = this; self.body(p);
        p.querySelector('#bBody').addEventListener('click', function (e) {
          var t = e.target.closest('[data-gt]');
          if (t) { var g = state.cats[+t.getAttribute('data-gt')]; g.open = !g.open; self.body(p); changed(); return; }
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
        out(p, 'L1', eur(c.L1in)); out(p, 'L2', eur(c.L2)); out(p, 'Y1', eur(c.L1in * 12)); out(p, 'Y2', eur(c.L2 * 12));
        state.cats.forEach(function (g, gi) {
          var a = 0, m = 0; g.items.forEach(function (it) { a += +it.v[0]; m += +it.v[1]; });
          out(p, 'ga' + gi, eur(a)); out(p, 'gm' + gi, eur(m));
        });
      }
    };
  }
  R.buget1 = bugetPage(0, CAT_SPLIT, false);
  R.buget2 = bugetPage(CAT_SPLIT, Infinity, true);

  R.oneoff = {
    html: function () {
      return '<div class="eyebrow">Plățile unice</div><h1 class="q">Ce plăți mari știi deja că vor veni?</h1>' +
        '<details class="panel"><summary>Cum completezi</summary><p class="note">Adaugă ce te privește: nume, vârsta ta la care se întâmplă și suma. Bifează ce e obligatoriu. Aplicația o așază singură în anii productivi sau în capitolul următor.</p></details>' +
        '<div class="btable ootable"><table><colgroup><col><col class="a"><col class="v"><col class="v"><col class="v"><col class="x"></colgroup><thead><tr><th>Plata</th><th>La vârsta</th><th>Suma<small class="thu">€</small></th><th class="c1">Anii productivi<small class="thu">€</small></th><th class="c2">Capitolul următor<small class="thu">€</small></th><th></th></tr></thead><tbody id="ooList"></tbody>' +
        '<tfoot><tr><td>Total plăți unice</td><td></td><td></td><td class="c1" data-o="o1"></td><td class="c2" data-o="o2"></td><td></td></tr></tfoot></table></div>';
    },
    list: function (p) {
      p.querySelector('#ooList').innerHTML = OO_GROUPS.map(function (gn, gi) {
        var head = '<tr class="grp"><td><div class="sn"><span class="nmg">' + esc(gn) + '</span><button type="button" class="addsub" data-addoo="' + gi + '">+ Adaugă</button></div></td><td></td><td></td><td class="c1" data-o="og1_' + gi + '"></td><td class="c2" data-o="og2_' + gi + '"></td><td></td></tr>';
        return head + state.oneoff.filter(function (o) { return o.g === gi; }).map(function (o) {
          return '<tr class="sub" data-id="' + o.id + '"><td><input class="nm" id="oo_n_' + o.id + '" data-oo="nume" value="' + esc(o.nume) + '" aria-label="Plata"><label class="oobl"><input type="checkbox" data-obl="' + o.id + '"' + (o.oblig ? ' checked' : '') + '> obligatorie</label></td>' +
            '<td><input id="oo_v_' + o.id + '" data-oo="varsta" inputmode="numeric" value="' + (o.varsta || '') + '" aria-label="La vârsta"></td>' +
            '<td><input id="oo_s_' + o.id + '" data-oo="suma" inputmode="decimal" value="' + (o.suma ? nf0.format(o.suma) : '') + '" aria-label="Suma"></td>' +
            '<td class="c1" data-cap1="' + o.id + '"></td><td class="c2" data-cap2="' + o.id + '"></td><td><button type="button" class="rm" data-deloo="' + o.id + '" aria-label="Elimină ' + esc(o.nume) + '" title="Elimină plata">×</button></td></tr>';
        }).join('');
      }).join('');
    },
    bind: function (p) {
      var self = this, box = p.querySelector('#ooList');
      self.list(p);
      box.addEventListener('click', function (e) {
        var b = e.target.closest('[data-deloo]');
        if (b) { var id = +b.getAttribute('data-deloo'); state.oneoff = state.oneoff.filter(function (o) { return o.id !== id; }); self.list(p); changed(); return; }
        var a = e.target.closest('[data-addoo]');
        if (a) {
          var nid = state.oneoff.reduce(function (m, o) { return Math.max(m, o.id); }, 0) + 1;
          state.oneoff.push({ id: nid, g: +a.getAttribute('data-addoo'), nume: 'Plată nouă', varsta: 0, suma: 0 });
          self.list(p); changed();
          var ni = p.querySelector('#oo_n_' + nid); if (ni) { ni.focus(); ni.select(); }
        }
      });
      box.addEventListener('change', function (e) {
        var ob = e.target.getAttribute('data-obl'); if (ob != null) { state.oneoff.forEach(function (o) { if (String(o.id) === ob) o.oblig = e.target.checked; }); changed(); return; }
        var inp = e.target, f = inp.getAttribute('data-oo'); if (!f) return;
        var id = +inp.closest('tr').getAttribute('data-id'), o = state.oneoff.filter(function (x) { return x.id === id; })[0]; if (!o) return;
        if (f === 'nume') { o.nume = inp.value.trim().slice(0, 80) || 'Plată nouă'; inp.value = o.nume; }
        else { var n = inp.value.trim() === '' ? 0 : parseRo(inp.value); if (!isNaN(n)) o[f] = f === 'varsta' ? Math.round(Math.min(120, Math.max(0, n))) : Math.max(0, n); inp.value = f === 'varsta' ? (o.varsta || '') : (o.suma ? nf0.format(o.suma) : ''); }
        changed();
      });
    },
    update: function (p, c) {
      out(p, 'o1', eur(c.OO1)); out(p, 'o2', eur(c.OO2));
      OO_GROUPS.forEach(function (gn, gi) {
        var t1 = 0, t2 = 0;
        state.oneoff.forEach(function (o) { if (o.g !== gi) return; var a = Math.round(o.varsta); if (a < c.varsta || a >= c.E) return; if (a < c.R) t1 += +o.suma || 0; else t2 += +o.suma || 0; });
        out(p, 'og1_' + gi, eur(t1)); out(p, 'og2_' + gi, eur(t2));
      });
      state.oneoff.forEach(function (o) {
        var e1 = p.querySelector('[data-cap1="' + o.id + '"]'), e2 = p.querySelector('[data-cap2="' + o.id + '"]'); if (!e1 || !e2) return;
        var a = Math.round(o.varsta), inn = a >= c.varsta && a < c.E, one = a < c.R;
        e1.textContent = !inn ? 'în afara calculului' : one ? eur(+o.suma || 0) : ''; e2.textContent = inn && !one ? eur(+o.suma || 0) : '';
      });
    }
  };

  function fundInput(k) { return '<span class="mini"><button type="button" data-k="' + k + '" data-d="-1" aria-label="Scade">−</button><input id="f_' + k + '" data-k="' + k + '" inputmode="decimal" value="' + fmtK(k) + '"><button type="button" data-k="' + k + '" data-d="1" aria-label="Crește">+</button></span>'; }
  R.fonduri = {
    html: function () {
      return '<div class="eyebrow">Fondurile de urgență</div><h1 class="q">Banii care nu se ating</h1>' +
        '<details class="panel"><summary>Cum completezi</summary><p class="note">Fondul de urgență majoră acoperă o relocare sau o perioadă în care nu ai venituri: traiul întregii familii pentru un număr de luni, plus o sumă pentru relocare. Fondul pentru intervenții medicale majore este suma pentru familie, peste ce acoperă asigurările. Fondurile stau deoparte, lichide și în afara firmei. Se construiesc în timp, din dividende, pe anii productivi; ce ai pus deoparte trece în capitolul următor, unde se completează doar diferența.</p></details>' +
        '<div class="btable ftable"><table><colgroup><col><col class="v"><col class="v"></colgroup><thead><tr><th></th><th class="c1">Anii productivi<small class="thu">€</small></th><th class="c2">Capitolul următor<small class="thu">€</small></th></tr></thead><tbody>' +
        '<tr class="grp"><td>Fondul de urgență majoră<small>relocare sau o perioadă fără venituri</small></td><td class="c1" data-o="fu1"></td><td class="c2" data-o="fu2"></td></tr>' +
        '<tr class="sub"><td>Trai pentru toată familia<small data-o="uh"></small></td><td data-o="u1"></td><td data-o="u2"></td></tr>' +
        '<tr class="sub"><td>Sumă pentru relocare în caz de urgență</td><td>' + fundInput('reloc1') + '</td><td>' + fundInput('reloc2') + '</td></tr>' +
        '<tr class="grp"><td>Fondul pentru intervenții medicale majore<small>în familie, peste ce acoperă asigurările</small></td><td class="c1" data-o="fm1"></td><td class="c2" data-o="fm2"></td></tr>' +
        '<tr class="sub"><td>Suma disponibilă imediat</td><td>' + fundInput('sanatate1') + '</td><td>' + fundInput('sanatate2') + '</td></tr>' +
        '</tbody><tfoot><tr><td>Total fonduri<small>ce ai pus deoparte trece mai departe; se completează diferența</small></td><td class="c1" data-o="F1"></td><td class="c2" data-o="F2"></td></tr></tfoot></table></div>' +
        '<div class="grid2 fset">' + fld('urgLuni', 'Câte luni de trai pentru familie', 'luni', '', true) + '</div>';
    },
    update: function (p, c) {
      var fu1 = c.urg1 + state.reloc1, fu2 = c.urg2 + state.reloc2;
      out(p, 'fu1', eur(fu1)); out(p, 'fu2', eur(fu2)); out(p, 'fm1', eur(state.sanatate1)); out(p, 'fm2', eur(state.sanatate2));
      out(p, 'u1', eur(c.urg1)); out(p, 'u2', eur(c.urg2)); out(p, 'F1', eur(c.F1)); out(p, 'F2', eur(c.F2));
      out(p, 'uh', state.urgLuni + (state.urgLuni === 1 ? ' lună' : ' luni') + ' × ' + eur(c.L1) + ', apoi × ' + eur(c.L2));
    }
  };

  function primiiAni(n) { return n === 1 ? 'primul an' : 'primii ' + ani(n); }
  R.productivi = {
    html: function () {
      return '<div class="eyebrow">Anii productivi</div><h1 class="q">Cât costă anii productivi</h1>' +
        '<div class="fnbox prod"><div class="lbl" data-o="lbl"></div><div class="big" data-o="big"></div><div class="row" data-o="row"></div></div>' +
        '<p class="note">Nivelul de trai, plățile unice și fondurile de urgență, în banii de azi.</p>' +
        '<div class="eqrow"><button type="button" class="det-btn" data-go="productivi2">Continuă</button></div>';
    },
    update: function (p, c) {
      var tot = c.life1Tot + c.OO1 + c.F1, altT = 0; for (var ai = 0; ai < c.n1; ai++) altT += c.altAt(ai);
      out(p, 'lbl', 'De la ' + c.varsta + ' la ' + c.R + ' de ani · ' + ani(c.n1));
      out(p, 'big', shortEur(tot));
      out(p, 'row', '<div><b>' + shortEur(c.n1 ? tot / c.n1 : 0) + '</b>pe an, în medie</div><div><b>' + shortEur(Math.max(0, altT)) + '</b>din alte surse</div><div><b>' + shortEur(Math.max(0, tot - altT)) + '</b>de la firmă</div>');
    }
  };
  /* răspunsul simplu: cât produce firma azi față de cât ai nevoie */
  R.productivi3 = {
    html: function () { return '<div class="eyebrow">Vehiculul</div><div data-o="cv"></div><div data-o="cc"></div><div class="eqrow"><button type="button" class="det-btn" data-go="buget">Continuă</button></div>'; },
    update: function (p, c) {
      var ch = c.L1in * 12, peste = ch > c.capAn + 0.5;
      out(p, 'cv', '<h1 class="q">Îți blochezi nivelul de trai la ' + eur(c.lifeNow) + ' pe an.</h1>' +
        (peste ? '<p class="note">Cheltuiești ' + eur(ch) + ' și ai ' + eur(c.capAn) + '. Diferența de ' + eur(ch - c.capAn) + ' vine probabil din economii sau din împrumuturi.</p>' : '<p class="note">Cheltuielile actuale sunt acoperite, iar nivelul rămâne aici până crește firma.</p>'));
      out(p, 'cc', '<div class="jstats"><div><div class="k">Dividendul pe care îl poate plăti firma</div><div class="v" style="color:var(--teal)">' + shortEur(c.div0.net) + '</div><div class="s">pe an, din profitul de azi</div></div>' +
        '<div><div class="k">Alte surse</div><div class="v" style="color:var(--teal)">' + shortEur(c.altNow) + '</div><div class="s">pe an</div></div>' +
        '<div><div class="k">Nivelul de trai dorit</div><div class="v">' + shortEur(c.L1b * 12) + '</div><div class="s">pe an</div></div>' +
        '<div><div class="k">Îți lipsesc</div><div class="v">' + shortEur(Math.max(0, c.L1b * 12 - c.capAn)) + '</div><div class="s">pe an, până la nivelul dorit</div></div></div>');
    }
  };
  /* creșterea minimă: doar pentru nivelul de trai, plățile unice și fonduri, eșalonate pe anii productivi */
  R.productivi2 = {
    html: function () {
      return '<div class="eyebrow">Anii productivi</div><h1 class="q">Până unde trebuie să ajungă firma?</h1>' +
        '<p class="note">Creșterea minimă, doar pentru nivelul de trai, plățile unice și fondurile de urgență.</p>' +
        '<div data-o="pv"></div>';
    },
    update: function (p, c) {
      var v = c.prov;
      if (!v.ok) { out(p, 'pv', '<p class="note">Nu se poate calcula: firma nu are profit sau anii productivi sunt prea puțini.</p>'); return; }
      var ok = v.peak <= state.ca + 0.5, pl = c.plan;
      out(p, 'pv', (ok ? '<p class="verdict ok">Firma de azi plătește deja toate acestea.<small>Nu trebuie să crească doar pentru ele.</small></p>' : '') +
        '<div class="jstats"><div><div class="k">Cifra de afaceri minimă</div><div class="v" style="color:var(--teal)">' + shortEur(v.peak) + '</div><div class="s">din anul ' + v.peakI + ', la ' + ani(v.peakY.age) + ' · azi ' + shortEur(state.ca) + '</div></div>' +
        '<div><div class="k">Ritmul minim de creștere</div><div class="v" style="color:var(--teal)">' + (isNaN(v.g) || ok ? '-' : gfmt(v.g)) + '</div><div class="s">' + (v.peakI > 0 && !ok ? 'pe an, ' + ani(v.peakI) + ' · ' + xfmt(v.X) : 'fără creștere') + '</div></div>' +
        '<div><div class="k">Pui deoparte pe an</div><div class="v">' + shortEur(v.maxProv) + '</div><div class="s">plăți unice + fonduri de urgență</div></div>' +
        (v.loan > 0.5 ? '<div><div class="k">Împrumut pentru plățile obligatorii</div><div class="v">' + shortEur(v.loan) + '</div><div class="s">în anul ' + v.loanI + ', fără dobândă în calcul</div></div>' : '') + '</div>' +
        provBars(c, v) +
        '<p class="note small">Până în anul ' + pl.T + ': surplusul de ' + eur(pl.S) + ' plătește ' + eur(pl.cover) + ' plăți unice și ' + eur(pl.Fin) + ' fonduri. Din anul ' + pl.T + ', plățile rămase se întind egal pe ' + ani(pl.m) + ', iar fondurile se termină în cel mult 4 ani de la atingerea nivelului dorit.' + (pl.Xo > 0.5 ? ' ' + eur(pl.Xo) + ' plăți neobligatorii neacoperite se amână.' : '') + '</p>');
    }
  };
  /* cele 3 căi: [calea din VARIANTE, metoda de calcul, titlu, text] */
  var URMA = [[2, 'minim', 'Vând firma', 'Nu rămân pe capul nimănui. Am banii pentru bătrânețe și las ceva simbolic.'], [3, 'consum', 'Trăiesc din firmă', 'Îmi păstrez stilul de viață, iar firma îmi dă banii pentru el.'], [1, 'capital', 'Las un portofoliu', 'Randamentul plătește nivelul de trai, iar capitalul rămâne celor care îl primesc.']];
  function setCale(v) { state.alegere = v; URMA.forEach(function (x) { if (x[0] === v) state.metoda = x[1]; }); }
  R.urma = {
    html: function () {
      return '<div class="eyebrow">Ce las în urmă</div><h1 class="q">Ce vreau să rămână după mine?</h1>' +
        '<div class="urmo" id="urmo">' + URMA.map(function (x) { return '<button type="button" data-c="' + x[0] + '"><b>' + x[2] + '</b><span>' + x[3] + '</span></button>'; }).join('') + '</div>' +
        '<div class="eqrow"><button type="button" class="det-btn" data-go="qSperanta">Continuă</button></div>';
    },
    bind: function (p) { p.querySelector('#urmo').addEventListener('click', function (e) { var b = e.target.closest('[data-c]'); if (!b) return; setCale(+b.getAttribute('data-c')); changed(); }); },
    update: function (p) { p.querySelectorAll('#urmo button').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-c') === state.alegere)); }); }
  };

  /* demonstrația: aceleași formule ca în calc(), cu cifrele participantului, și verificarea an cu an */
  function fnProof(c) {
    var A = Math.max(0, c.L2 * 12 - c.altCont), r = c.rr, n = c.n2, F = c.FN, fac = (r !== 0 ? (1 - Math.pow(1 + r, -n)) / r : n) * (1 + r), ages = Object.keys(c.ooAt).map(Number).filter(function (a) { return a >= c.R; }).sort(function (a, b) { return a - b; });
    function st(t, b) { return '<div class="pstep"><h3>' + t + '</h3>' + b + '</div>'; }
    var pc = function (x) { return nf2.format(x * 100) + '%'; };
    var o = '<p class="note">Sumele sunt în euro de azi. Cheltuielile ies din portofoliu la începutul fiecărui an, iar randamentul se aplică la ce rămâne. Randamentul fondurilor intră la final de an.</p>';
    o += st('1. Randamentul net și randamentul real', '<p>Net, după toate taxele și impozitele: ' + nf2.format(state.randament) + '% × (1 − ' + nf2.format(state.taxRand) + '%) = <b>' + pc(c.ecoRand) + '</b></p><p>Real: r = (1 + ' + pc(c.ecoRand) + ') / (1 + ' + nf2.format(state.inflatie) + '%) − 1 = <b>' + pc(r) + '</b></p>');
    o += st('2. Numărul fără randament', '<p>' + n + ' ani × ' + eur(A) + (c.altCont > 0 ? ' (după ' + eur(c.altCont) + ' venituri care continuă)' : '') + ' = ' + eur(A * n) + '</p><p>+ plăți unice ' + eur(c.OO2) + ' + fonduri ' + eur(c.F2) + (c.minim ? ' + suma lăsată în urmă ' + eur(state.legacy) : '') + ' = <b>' + eur(c.FNsimple) + '</b></p>');
    o += st('3. Nivelul de trai, cu randament', '<p>Cheltuiala anului k iese la începutul anului, deci banii stau investiți k − 1 ani și costă azi A / (1 + r)<sup>k − 1</sup>.</p><p>Suma pe ' + n + ' ani = A × (1 + r) × (1 − (1 + r)<sup>−n</sup>) / r = ' + eur(A) + ' × ' + nf2.format(fac) + ' = <b>' + eur(F.life) + '</b></p>');
    o += st('4. Plățile unice, cu randament', ages.length ? '<p>Plata de la vârsta v costă azi S / (1 + r)<sup>v − ' + c.R + '</sup>.</p>' + ages.map(function (a) { var k = a - c.R; return '<p>La ' + ani(a) + ': ' + eur(c.ooAt[a]) + ' / (1 + r)<sup>' + k + '</sup> = ' + eur(c.ooAt[a] / Math.pow(1 + r, k)) + '</p>'; }).join('') + '<p>Total = <b>' + eur(F.oo) + '</b></p>' : '<p>Nu ai plăți unice în capitolul următor.</p>');
    o += st('5. Fondurile de urgență', '<p>Rămân întregi: <b>' + eur(F.fonduri) + '</b></p><p>Produc ' + nf2.format(state.randFond) + '% pe an, după impozit ' + pc(c.rf) + ', adică ' + eur(F.fondRand) + ' la final de an. Pe ' + n + ' ani, azi valorează <b>' + eur(F.fondPv) + '</b> și se scad.</p>');
    if (F.term > 0) o += st('Capitalul lăsat întreg', '<p>Suma care rămâne neatinsă: (A × (1 + r) − ' + eur(F.fondRand) + ') / r, adusă la azi = <b>' + eur(F.term) + '</b></p>');
    if (F.legacy > 0) o += st('Suma lăsată în urmă', '<p>' + eur(state.legacy) + ' / (1 + r)<sup>' + n + '</sup> = <b>' + eur(F.legacy) + '</b></p>');
    o += st('6. FREEDOM NUMBER', '<p>' + eur(F.life) + ' + ' + eur(F.oo) + ' + ' + eur(F.fonduri) + (F.term > 0 ? ' + ' + eur(F.term) : '') + (F.legacy > 0 ? ' + ' + eur(F.legacy) : '') + ' − ' + eur(F.fondPv) + ' = <b>' + eur(F.total) + '</b></p>');
    var bal = F.total - F.fonduri, rows = '';
    for (var k = 1; k <= n; k++) {
      var oo = c.ooAt[c.R + k - 1] || 0, rest = bal - A - oo, y = rest * r + F.fondRand, end = rest + y;
      rows += '<tr><td>' + (c.R + k - 1) + '</td><td>' + eur(bal) + '</td><td>' + eur(A) + '</td><td>' + eur(oo) + '</td><td>' + eur(y) + '</td><td>' + eur(Math.abs(end) < 0.5 ? 0 : end) + '</td></tr>';
      bal = end;
    }
    o += st('7. Verificarea, an cu an', '<p>Pornim cu suma de la pasul 6, fără fonduri. La final, soldul ajunge la ' + (c.intact ? 'capitalul lăsat întreg' : c.minim ? 'suma lăsată în urmă' : 'zero') + '.</p><div class="tbl-wrap"><table class="qt"><thead><tr><th>Vârsta</th><th>Sold la început</th><th>Nivel de trai</th><th>Plăți unice</th><th>Randament</th><th>Sold la final</th></tr></thead><tbody>' + rows + '</tbody></table></div>');
    return o;
  }
  var FN1 = {
    html: function () {
      return '<div class="eyebrow">Freedom number</div><h1 class="q fn-cap">FREEDOM NUMBER</h1>' +
        (state.alegere === 2 ? '<div class="panel">' + fld('legacy', 'Suma pe care o las în urmă', '€', 'la finalul vieții, în banii de azi') + '</div>' : '') +
        '<div class="fnbox"><div class="lbl" data-o="lbl"></div><div class="big" data-o="fn0"></div><div class="row" data-o="short0"></div></div>' +
        '<p class="note">Dar știm că valoarea în timp a banilor scade, deci aceasta nu este o imagine corectă.</p>' +
        '<div class="eqrow"><button type="button" class="det-btn" id="fnGood" data-go="freedom2"></button></div>';
    },
    update: function (p, c) {
      out(p, 'lbl', 'Fără randament · în banii de azi · la ' + c.R + ' de ani · pentru ' + ani(c.n2));
      out(p, 'fn0', shortEur(c.FNsimple));
      out(p, 'short0', '<div><b>' + shortEur(Math.max(0, c.L2 * 12 - c.altCont) * c.n2) + '</b>nivel de trai</div><div><b>' + shortEur(c.OO2) + '</b>plăți unice</div><div><b>' + shortEur(c.F2) + '</b>fonduri de urgență</div>' + (c.minim ? '<div><b>' + shortEur(state.legacy) + '</b>lăsați în urmă</div>' : ''));
      /* vestea depinde de situație: la capital întreg, numărul cu randament poate depăși numărul fără randament */
      p.querySelector('#fnGood').textContent = c.FN.ok && c.FN.total <= c.FNsimple ? 'Dar am o veste bună' : 'Dar am o veste diferită pentru tine';
    }
  };
  /* pe calea „trăiesc din firmă” ținta nu e un capital, ci dividendul anual */
  R.freedom = {
    html: function () {
      if (state.alegere !== 3) return FN1.html();
      return '<div class="eyebrow">Freedom number</div><h1 class="q">Cât trebuie să-ți plătească firma?</h1><div class="fnbox"><div class="lbl">Net pe an, de la ' + C.R + ' de ani</div><div class="big">' + shortEur(C.L2 * 12) + '</div></div>' +
        '<p class="note">Pe calea ta nu strângi un capital. Firma îți plătește nivelul de trai dorit, an de an.</p><div class="eqrow"><button type="button" class="det-btn" data-go="punte">Continuă</button></div>';
    },
    update: function (p, c) { if (state.alegere !== 3) FN1.update(p, c); }
  };
  var FN2 = {
    html: function () {
      return '<div class="eyebrow">Freedom number</div><h1 class="q fn-cap">FREEDOM NUMBER</h1>' +
        '<p class="note">Vezi cât trebuie să fie FREEDOM cu banii puși la treabă, conform alegerilor din pașii anteriori.</p>' +
        '<div class="fnbox prod"><div class="lbl" data-o="lbl2"></div><div class="big" data-o="fn"></div><div class="row" data-o="short"></div></div>' +
        '<details class="panel"><summary>Demonstrația matematică</summary><div class="proof" data-o="proof"></div></details>' +
        '<div class="stack"><div class="panel"><h2 class="sec">Randamentul</h2>' + fld('randament', 'Randamentul anual al investițiilor', '%') + fld('taxRand', 'Impozitul pe randament', '%') + fld('inflatie', 'Inflația anuală', '%') + fld('randFond', 'Randamentul fondurilor de urgență', '%') +
        '<div class="frow"><span>Randamentul net<small style="display:block;color:var(--muted);font-size:.78rem">după toate taxele și impozitele</small></span><b data-o="rnet"></b><span class="u"></span></div>' +
        '<div class="frow"><span>Randamentul real net<small style="display:block;color:var(--muted);font-size:.78rem">(1 + randament net) / (1 + inflație) − 1</small></span><b data-o="rr"></b><span class="u"></span></div></div>' +
        '<div class="panel"><p class="note small">Mai departe vedem din ce se plătește: din dividende, din vânzarea firmei sau din firma condusă de altcineva.</p></div></div>';
    },
    update: function (p, c) {
      var bun = c.FN.ok && c.FN.total <= c.FNsimple;
      out(p, 'lbl2', bun ? 'Cu banii la treabă' : 'Cu capitalul lăsat întreg');
      out(p, 'rnet', nf2.format(c.ecoRand * 100) + '%'); out(p, 'rr', nf2.format(c.rr * 100) + '%');
      if (!c.FN.ok) { out(p, 'fn', '-'); out(p, 'short', '<div>Cu capitalul întreg, randamentul real trebuie să fie pozitiv.</div>'); out(p, 'proof', ''); return; }
      out(p, 'fn', shortEur(c.FN.total));
      out(p, 'short', '<div><b>' + shortEur(Math.abs(c.FNsimple - c.FN.total)) + '</b>' + (bun ? 'muncesc banii pentru tine' : 'în plus, ca să rămână capitalul') + '</div><div><b>' + nf2.format(c.rr * 100) + '%</b>randament real net</div>' + (c.intact ? '<div><b>întreg</b>capitalul rămâne</div>' : ''));
      out(p, 'proof', fnProof(c));
    }
  };

  /* profitul și EBITDA se introduc ca sumă sau ca procent din cifra de afaceri */
  function modFld(k, label, help) {
    var m = state[k + 'Mod'], opt = [['suma', '€'], ['pct', '%']].concat(k === 'ebitda' ? [['factor', '×']] : []);
    return '<div class="modrow"><span class="seg" data-mod="' + k + '">' + opt.map(function (o) { return '<button type="button" data-v="' + o[0] + '" aria-pressed="' + (m === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</span>' +
      (m === 'factor' ? fld('ebitdaK', label, '× profit net', 'de obicei 1,2-1,25') : m === 'pct' ? fld(k + 'Pct', label, '% din CA', help) : fld(k === 'profit' ? 'profitNet' : 'ebitda', label, '€', help)) + '<small data-o="h' + k + '"></small></div>';
  }
  function syncPct() {
    if (state.profitMod === 'pct') state.profitNet = Math.round(state.ca * state.profitPct / 100);
    if (state.ebitdaMod === 'pct') state.ebitda = Math.round(state.ca * state.ebitdaPct / 100);
    if (state.ebitdaMod === 'factor') state.ebitda = Math.round(state.profitNet * state.ebitdaK);
  }
  R.firma = {
    html: function () {
      return '<div class="eyebrow">Vehiculul</div><h1 class="q">Cât îți poate distribui firma azi?</h1>' +
        '<p class="note">Sumele sunt în euro de azi, din ultimul an încheiat.</p>' +
        '<div class="panel">' + fld('ca', 'Cifra de afaceri', '€', 'fără TVA, pe an') + modFld('profit', 'Profit net', 'pe an') + modFld('ebitda', 'EBITDA', 'profit net + impozit + dobânzi + amortizare') +
        fld('reinvest', 'Profit lăsat în firmă pentru creștere', '%', 'din profitul net') + fld('cota', 'Cota ta din firmă', '%') + fld('datorie', 'Datoria netă a firmei', '€', 'credite minus numerar') + '</div>' +
        '<div class="divbanner"><div class="lbl">Pe hârtie, firma îți poate distribui cel mult, pe an, dacă banii sunt în cont</div><div class="big" data-o="dn"></div><div class="row" data-o="dnrow"></div></div>' +
        '<div class="stack">' +
        '<details class="panel" id="dFisc"><summary>Fiscalitate și curs</summary>' +
        '<div class="trow"><span>Regim fiscal</span><span class="seg" id="regim"><button type="button" data-rg="profit">Impozit pe profit</button><button type="button" data-rg="micro">Microîntreprindere</button></span></div>' + fld('taxProfit', 'Impozit pe profit sau pe venit', '%', 'la micro, pe venit') + fld('taxDiv', 'Impozit pe dividende', '%', '16% din 2026') +
        fld('cassRon', 'Plafonul CASS pe dividende', 'lei/an', '10% × 24 salarii minime') + fld('taxCastig', 'Impozit pe câștigul din vânzarea firmei', '%', 'de confirmat cu contabilul') +
        fld('curs', 'Curs', 'lei/€') + '</details>' +
        '<details class="panel" id="dPod"><summary>Podul de la EBITDA la dividendul net</summary><div class="eqrow" data-o="bridge"></div></details></div>';
    },
    bind: function (p) {
      p.querySelector('#regim').addEventListener('click', function (e) { var b = e.target.closest('[data-rg]'); if (!b) return; state.regim = b.getAttribute('data-rg'); if (state.regim === 'micro' && state.taxProfit === 16) state.taxProfit = 3; else if (state.regim === 'profit' && state.taxProfit === 3) state.taxProfit = 16; rerender(); changed(); });
      p.querySelector('#regim [data-rg="' + (state.regim || 'profit') + '"]').setAttribute('aria-pressed', 'true');
      p.addEventListener('click', function (e) {
        var b = e.target.closest('[data-mod] [data-v]'); if (!b) return;
        var k = b.parentNode.getAttribute('data-mod'), v = b.getAttribute('data-v'), sum = k === 'profit' ? state.profitNet : state.ebitda; if (v === state[k + 'Mod']) return;
        if (v === 'pct' && state.ca > 0) state[k + 'Pct'] = sum / state.ca * 100;
        if (v === 'factor' && state.profitNet > 0) state.ebitdaK = sum / state.profitNet;
        state[k + 'Mod'] = v; save(); rerender();
      });
    },
    update: function (p, c) {
      var pa = function (x) { return state.ca > 0 ? nf2.format(x / state.ca * 100) + '% din cifra de afaceri' : ''; };
      out(p, 'hprofit', state.profitMod === 'pct' ? '= ' + eur(state.profitNet) : state.profitNet ? '= ' + pa(state.profitNet) : '');
      out(p, 'hebitda', !state.ebitda ? '' : state.ebitdaMod === 'suma' ? '= ' + pa(state.ebitda) : state.ebitdaMod === 'pct' ? '= ' + eur(state.ebitda) : '= ' + eur(state.ebitda) + ', adică ' + pa(state.ebitda));
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


  function noteKey(t) { var m = state.valMetoda || 'sde'; return (m === 'venit' ? 'nV' : 'nS') + (t === 'tinta' ? 'T' : ''); }
  function curNotes() { return state[noteKey(state.mTab)]; }
  function factorList(m) {
    if (m === 'venit') return VF.map(function (f, i) { return { t: f[1], d: GRADE[f[0]], w: f[2], auto: i === 1 }; });
    return SF.map(function (f, i) { return { t: (i < 6 ? f[0] + ' · ' : '') + f[1], d: f[2] || GRADE[f[0]], w: i < 6 ? null : f[3], group: i === 0 ? 'Transferabilitatea afacerii · 30%, media răspunsurilor T1-T6' : i === 6 ? 'Ceilalți factori' : null }; });
  }
  /* multiplul are patru pagini: formula, datele, notele și rezultatul; toate împart același bind și update */
  function mTabs() { return '<span class="seg" id="mTab"><button type="button" data-mt="azi">Azi</button><button type="button" data-mt="tinta">La vânzare</button></span>'; }
  function mPair() { return '<div class="mres"><div class="eqrow"><div><span class="small" style="color:var(--muted)">Multiplul de azi</span><div class="big" data-o="M0" style="color:var(--muted)"></div></div><span class="op">→</span><div><span class="small" style="color:var(--muted)">Multiplul la vânzare</span><div class="big" data-o="MT"></div></div></div></div>'; }
  function mNext(id) { return '<div class="eqrow"><button type="button" class="det-btn" data-go="' + id + '">Continuă</button></div>'; }
  var MPASI = { sde: ['Tabelul de piață dă intervalul de multiplu, după mărimea SDE-ului.', 'Notele pe factori arată unde cade firma în interval.', 'Verificăm că un cumpărător poate plăti prețul din profitul firmei.', 'Valoarea nu coboară sub suma minimă la care se vinde afacerea.'],
    venit: ['Industria dă intervalul de multiplu.', 'Notele pe factori și marja arată unde cade firma în interval.'] };
  R.multipluV = {
    html: function () {
      var m = state.valMetoda || 'sde';
      return '<div class="eyebrow">Calea ta · cât valorează firma</div><h1 class="q">Cum se calculează valoarea firmei?</h1>' +
        '<div class="vmeth" id="vMeth">' +
        '<button type="button" data-vm="sde"><b>Multiplu SDE</b><span>Afaceri conduse de proprietar, vândute cuiva care preia conducerea.</span></button>' +
        '<button type="button" data-vm="venit"><b>Multiplu pe venituri</b><span>Când profitul e mic sau volatil.</span></button></div>' +
        '<p class="bvf big">BV = multiplu × ' + (m === 'sde' ? 'SDE' : 'cifra de afaceri') + (m === 'sde' ? '<small>SDE = EBITDA + salariul tău + cheltuielile personale plătite de firmă</small>' : '') + '</p>' +
        '<h2 class="sec">Cum se calculează multiplul</h2><ol class="isteps big" style="--pc:var(--teal)">' + MPASI[m].map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol>' + mNext('multipluDate');
    }
  };
  R.multipluDateV = {
    html: function () {
      var m = state.valMetoda || 'sde', man = m === 'venit' ? state.vManual : state.sManual;
      return '<div class="eyebrow">Calea ta · cât valorează firma</div><h1 class="q">Cifrele din care pornim</h1>' +
        (m !== 'sde' ? '<div class="indban"><div class="lbl">Industria firmei</div><select id="indSel">' + IND.map(function (x) { return '<option value="' + x.id + '"' + (x.id === state.industrie ? ' selected' : '') + '>' + esc(x.n) + '</option>'; }).join('') + '</select><div class="row" data-o="indH"></div></div>' +
          (m !== 'sde' ? '<div class="panel"><div class="frow"><span>Cum stabilești multiplul</span><span class="seg" id="mHow"><button type="button" data-mh="calc" aria-pressed="' + !man + '">Calculat din factori</button><button type="button" data-mh="manual" aria-pressed="' + man + '">Introdus manual</button></span><span class="u"></span></div>' +
            (man ? fld('vManAzi', 'Multiplul de azi', '× CA') + fld('vManT', 'Multiplul la vânzare', '× CA', 'unde vrei să ajungi') : '') + '</div>' : '')
          : '<div class="indban sdeban"><div class="lbl">Construirea SDE</div><div class="row" data-o="sdeRow"></div>' + fld('sdeSalariu', 'Salariul tău pe firmă, brut plus contribuții', '€/an', 'un singur proprietar-operator') + fld('sdeChelt', 'Cheltuieli personale documentate plătite de firmă', '€/an') +
            fld('sdeSalPiata', 'Cât ar costa un manager care să-ți preia rolurile', '€/an', 'salariul de piață, cost total') + fld('sdePodea', 'Suma minimă la care se vinde afacerea', '€', 'echipamente, stoc și creanțe, minus datoriile preluate') +
            '</div>' +
            '<div class="panel"><div class="frow"><span>Cum stabilești multiplul</span><span class="seg" id="mHow"><button type="button" data-mh="calc" aria-pressed="' + !man + '">Calculat din factori</button><button type="button" data-mh="manual" aria-pressed="' + man + '">Introdus manual</button></span><span class="u"></span></div>' +
            (man ? fld('sManAzi', 'Multiplul de azi', '× SDE') + fld('sManT', 'Multiplul la vânzare', '× SDE', 'unde vrei să ajungi') : '') + '</div>' +
            '<details class="panel"><summary>Parametri de piață și finanțare (consultant)</summary>' + fld('cursUsd', 'Curs USD/RON', 'lei') + fld('factorPiata', 'Factor de piață RO/UE', '×', 'tabelul e pentru piața americană') +
            fld('finAport', 'Aportul propriu al cumpărătorului', '%') + fld('finDobBanca', 'Dobânda creditului bancar', '%') + fld('finAniBanca', 'Perioada creditului bancar', 'ani') +
            fld('finCreditV', 'Credit vânzător (plată eșalonată)', '%') + fld('finDobV', 'Dobânda creditului vânzător', '%') + fld('finAniV', 'Perioada creditului vânzător', 'ani') +
            fld('finRand', 'Randamentul cerut pe aportul propriu', '%') + fld('finDscr', 'DSCR minim', '×') + '</details>') + mNext(man ? 'multipluCalc' : 'multipluNote');
    }
  };
  R.multipluNoteV = {
    html: function () {
      var m = state.valMetoda || 'sde', man = m === 'venit' ? state.vManual : state.sManual, fl = man ? [] : factorList(m);
      return '<div class="eyebrow">Calea ta · cât valorează firma</div><h1 class="q">Notează firma</h1>' +
        (man ? '<p class="note">Multiplul e introdus manual, deci notele nu se folosesc.</p>'
          : '<p class="note">Note de la 1 la 5, azi și la vânzare. Notele la vânzare nu pot fi sub cele de azi.</p><div class="eqrow">' + mTabs() + '<button type="button" class="chip" id="cpT">Copiază notele de azi la „La vânzare”</button></div>') +
                '<div class="mfac" id="mfac">' + fl.map(function (f, i) {
          return (f.group ? '<h2 class="sec">' + f.group + '</h2>' : '') + '<div class="fac" data-f="' + i + '"><div class="fn">' + (i + 1) + '. ' + esc(f.t) + '<small data-o="w' + i + '"></small></div>' +
            '<div class="bands"><span class="seg">' + [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" data-fn="' + i + ':' + n + '"' + (f.auto ? ' disabled' : '') + ' title="' + esc(f.d[n - 1]) + '">' + n + '</button>'; }).join('') + '</span></div>' +
            '<div class="desc" data-o="d' + i + '"></div></div>';
        }).join('') + '</div>' + mNext('multipluCalc');
    }
  };
  R.multipluCalcV = {
    html: function () {
      return '<div class="eyebrow">Calea ta · cât valorează firma</div><h1 class="q">Cât valorează firma ta?</h1>' + mPair() + '<div class="eqrow">' + mTabs() + '</div>' +
        '<div class="panel"><h2 class="sec">Calculul multiplului</h2><div class="facts" data-o="vres"></div><div data-o="vmsg"></div></div>' +
        '<div class="panel"><h2 class="sec">De la BV la equity value</h2><p class="bvf" data-o="bvf"></p><div class="eqrow bridge" data-o="bridge"></div></div><div data-o="pcAv"></div>' +
        '<p class="note small">Estimare orientativă, nu evaluare profesională. BV este valoarea afacerii fără datorii și fără numerar. Datoria netă vine de pe slide-ul 33.</p>' + mNext('cale');
    }
  };
  var MV = {
    bind: function (p) {
      var vm = p.querySelector('#vMeth'); if (vm) vm.addEventListener('click', function (e) { var b = e.target.closest('[data-vm]'); if (!b) return; state.valMetoda = b.getAttribute('data-vm'); rerender(); });
      var sel = p.querySelector('#indSel'); if (sel) sel.addEventListener('change', function () { state.industrie = sel.value; changed(); });
      var mh = p.querySelector('#mHow'); if (mh) mh.addEventListener('click', function (e) { var b = e.target.closest('[data-mh]'); if (!b) return; var on = b.getAttribute('data-mh') === 'manual', vm = state.valMetoda || 'sde'; if (vm === 'venit') state.vManual = on; else state.sManual = on; if (on) state.mTab = 'azi'; rerender(); });
      var mt = p.querySelector('#mTab'); if (mt) mt.addEventListener('click', function (e) { var b = e.target.closest('[data-mt]'); if (!b) return; state.mTab = b.getAttribute('data-mt'); changed(); });
      var cp = p.querySelector('#cpT'); if (cp) cp.addEventListener('click', function () { state[noteKey('tinta')] = state[noteKey('azi')].slice(); state.mTab = 'tinta'; changed(); });
      var mf = p.querySelector('#mfac'); if (mf) mf.addEventListener('click', function (e) {
        var b = e.target.closest('[data-fn]'); if (!b || b.disabled) return;
        var a = b.getAttribute('data-fn').split(':'); curNotes()[+a[0]] = +a[1]; changed();
      });
    },
    update: function (p, c) {
      var m = state.valMetoda || 'sde', man = m === 'venit' ? state.vManual : state.sManual, fl = man ? [] : factorList(m), atSale = state.mTab === 'tinta' && m === 'sde' && (c.w2 || c.w1) && (c.w2 || c.w1).V, V = atSale ? (c.w2 || c.w1).V : state.mTab === 'tinta' ? c.VT0 : c.V0, when = atSale ? 'la vânzare' : 'azi';
      var av = state.avere; out(p, 'pcAv', av && av.pct > 0 ? '<p class="lead-to">Pe slide-ul 31 ai estimat că ' + nf0.format(av.pct) + '% din avere stă în firmă.</p>' : '');
      p.querySelectorAll('#vMeth button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-vm') === m)); });
      var wv = c.w2 || c.w1, mtUsed = wv && wv.M != null ? wv.M : c.MT;
      out(p, 'M0', nf2.format(c.M0) + '×'); out(p, 'MT', nf2.format(mtUsed) + '×');
      p.querySelectorAll('#mTab button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mt') === state.mTab)); });
      if (m !== 'sde') {
        var mg = state.ca > 0 ? c.E0 / state.ca : NaN;
        out(p, 'indH', '<div><b>' + nf2.format(c.ind.rmin) + '× - ' + nf2.format(c.ind.rmax) + '×' + '</b>' + 'interval pe venituri, derivat din marjă' + '</div>' +
          '<div><b>' + pct(c.ind.mmin) + ' - ' + pct(c.ind.mmax) + '</b>marja EBITDA tipică</div><div><b>' + (isNaN(mg) ? '-' : pct(mg)) + '</b>marja ta EBITDA</div>');
      }
      else out(p, 'sdeRow', '<div><b>' + eur(c.V0.base) + '</b>SDE azi</div><div><b>' + eur(c.E0) + '</b>EBITDA</div><div><b>+ ' + eur(state.sdeSalariu) + '</b>salariul tău</div><div><b>+ ' + eur(state.sdeChelt) + '</b>cheltuieli personale</div>');
      out(p, 'vres',
        '<div class="fact"><div class="k">Interval de multiplu' + (state.mTab === 'tinta' ? ', la vânzare' : ', azi') + '</div><div class="v">' + nf2.format(V.min) + '× - ' + nf2.format(V.max) + '×</div><div class="how">' + VM[m].u + (m === 'sde' ? (atSale ? ' · intervalul pentru SDE-ul din anul vânzării; azi ' + nf2.format(c.V0.min) + '× - ' + nf2.format(c.V0.max) + '×' : ' · pentru SDE-ul de azi') : '') + '</div></div>' +
        '<div class="fact"><div class="k">Scor pe factori</div><div class="v">' + (isNaN(V.score) ? '-' : nf0.format(V.score * 100) + '%') + '</div><div class="how">' + (isNaN(V.score) ? 'multiplu introdus manual' : 'poziția în interval') + '</div></div>' +
        '<div class="fact ac"><div class="k">Multiplul aplicat</div><div class="v">' + nf2.format(V.mult) + '×</div><div class="how">' + VM[m].base + ' ' + when + ' ' + shortEur(V.base) + '</div></div>' +
        '<div class="fact gd"><div class="k">Valoarea firmei ' + when + '</div><div class="v">' + shortEur(V.EV) + '</div><div class="how">interval ' + shortEur(V.min * Math.max(0, V.base)) + ' - ' + shortEur(V.max * Math.max(0, V.base)) + '</div></div>');
      var bf = function (k, v, how, cls) { return '<div class="fact' + (cls ? ' ' + cls : '') + '"><div class="k">' + k + '</div><div class="v">' + v + '</div>' + (how ? '<div class="how">' + how + '</div>' : '') + '</div>'; };
      var bop = function (x) { return '<span class="op">' + x + '</span>'; }, dn = state.datorie, tinta = state.mTab === 'tinta', tax = V.ours * state.taxCastig / 100;
      var dinPodea = m === 'sde' && V.sde && Math.abs(V.EV - V.mult * V.base) > 0.5 && !state.sManual;
      out(p, 'bvf', (dinPodea ? 'BV = suma minimă de vânzare = <b>' + eur(V.EV) + '</b>' : 'BV = multiplu × ' + VM[m].base + ' = ' + nf2.format(V.mult) + ' × ' + eur(V.base) + ' = <b>' + eur(V.EV) + '</b>') +
        (m === 'sde' && V.sde ? '<small>' + (dinPodea ? 'Profitul susține mai puțin, deci rămâne suma minimă de vânzare.' : 'Suma minimă de vânzare, ' + eur(state.sdePodea) + ', nu schimbă rezultatul.') + '</small>' : ''));
      out(p, 'bridge', bf('BV', eur(V.EV), 'valoarea afacerii') + bop(dn < 0 ? '+' : '−') + bf(dn < 0 ? 'Numerar net' : 'Datoria netă', eur(Math.abs(dn))) + bop('=') + bf('Equity value', eur(V.equity), 'valoarea părților sociale, 100%', 'ac') + bop('×') + bf('Cota ta', nf0.format(state.cota) + '%') + bop('=') + bf('Partea ta', eur(V.ours), '', 'gd') +
        (tinta ? bop('−') + bf('Impozit', eur(tax), nf0.format(state.taxCastig) + '% la vânzare') + bop('=') + bf('Încasezi net', eur(V.ours - tax), '', 'gd') : ''));
      var msgs = [];
      if (m !== 'sde' && state.ca > 0) { var mg = c.E0 / state.ca; msgs.push(mg < c.ind.mmin ? 'Marja EBITDA este sub media industriei. Un cumpărător va observa acest decalaj.' : mg > c.ind.mmax ? 'Marja EBITDA este peste media industriei. Verifică normalizarea; dacă e reală, e un argument puternic în negociere.' : 'Marja EBITDA este în linie cu industria.'); }
      if (m === 'sde' && V.sde) msgs = msgs.concat(V.sde.msgs);
      if (state.datorie > 0.5 * V.EV && V.EV > 0) msgs.push('Datoria financiară netă absoarbe o parte semnificativă din valoarea firmei. Reducerea datoriei crește direct valoarea pentru acționari.');
      out(p, 'vmsg', msgs.length ? '<ul class="cl" style="margin:8px 0 0;padding-left:1.1em;color:var(--muted);font-size:.9rem">' + msgs.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' : '');
      var notes = curNotes(), other = state[noteKey(state.mTab === 'tinta' ? 'azi' : 'tinta')];
      fl.forEach(function (f, i) {
        var card = p.querySelector('[data-f="' + i + '"]'); if (!card) return;
        var n = f.auto ? V.mNote || c.V0.mNote : (state.mTab === 'tinta' ? Math.max(notes[i], other[i]) : notes[i]), w = f.w;
        var diff = state.mTab === 'tinta' && !f.auto && other[i] !== n ? ' · azi ' + other[i] : '';
        out(p, 'w' + i, (w == null ? 'parte din transferabilitate' : 'pondere ' + nf.format(w * 100) + '%') + (f.auto ? ' · calculat din marjă' : '') + diff);
        card.querySelectorAll('[data-fn]').forEach(function (b, j) { b.setAttribute('aria-pressed', String(j + 1 === n)); });
        out(p, 'd' + i, 'Nota ' + n + ': <i>' + esc(f.d[n - 1]) + '</i>');
      });
    }
  };
  ['multipluV', 'multipluDateV', 'multipluNoteV', 'multipluCalcV'].forEach(function (id) { R[id].bind = MV.bind; R[id].update = MV.update; });

  function gfmt(g) { return (g > 0 ? '+' : '') + nf.format(g * 100) + '%'; }
  function xfmt(x) { return nf2.format(x) + '×'; }
  /* slide informativ pentru fiecare cale: erou, schema fluxului de bani, pașii și ce aflăm */
  function infoSlide(o) {
    var flow = o.flow.map(function (n, i) {
      return (i ? '<div class="fl-ar" aria-hidden="true">→</div>' : '') + '<div class="fl-n' + (n[2] ? ' fl-end' : '') + '"><div class="fl-k">' + n[0] + '</div><div class="fl-s">' + n[1] + '</div></div>';
    }).join('');
    return '<div class="ihero" style="--pc:' + o.col + '"><div class="ih-txt"><div class="eyebrow" style="color:' + o.col + '">Calea ta</div>' +
      '<h1 class="q">' + o.title + '</h1><p class="ih-tag">' + o.tag + '</p></div></div>' +
      '<div class="flow" style="--pc:' + o.col + '">' + flow + '</div>' +
      '<p class="ikey">' + o.key + '</p>';
  }
  R.cai1 = {
    html: function () {
      return infoSlide({ col: 'var(--accent)', title: 'Las un portofoliu', tag: '„Faci plinul din mers”. Firma îți plătește dividende, iar tu construiești capitalul în afara ei.',
        flow: [['Crești firma', 'până acoperă nivelul dorit'], ['Îți plătești nivelul de trai', 'din dividende'], ['Investești restul', 'banii lucrează pentru tine'], ['Freedom number', 'la ' + ani(C.R), true]],
        key: 'Capitalul rămâne întreg, iar randamentul plătește nivelul de trai.' }) +
        '<h2 class="sec">Din ce construiești portofoliul?</h2><div class="urmo" id="pfo"><button type="button" data-pf="0"><b>Doar din economii</b><span>Strângi tot din ce îți rămâne până la retragere.</span></button><button type="button" data-pf="1"><b>Economii și vânzarea firmei</b><span>Banii din vânzare intră în portofoliu.</span></button></div>';
    },
    bind: function (p) { p.querySelector('#pfo').addEventListener('click', function (e) { var b = e.target.closest('[data-pf]'); if (!b) return; state.pfVanzare = b.getAttribute('data-pf') === '1'; changed(); }); },
    update: function (p) { p.querySelectorAll('#pfo button').forEach(function (b) { b.setAttribute('aria-pressed', String((b.getAttribute('data-pf') === '1') === !!state.pfVanzare)); }); }
  };
  R.cai2 = {
    html: function () {
      return infoSlide({ col: 'var(--teal)', title: 'Vând firma', tag: '„Îmbraci mireasa”. Construiești o firmă pe care cineva vrea să o cumpere.',
        flow: [['Crești firma', 'în ritmul pe care îl poți ține'], ['Ridici multiplul', 'echipă, clienți, recurență, profit'], ['Vinzi firma', 'la ' + ani(C.R) + ', minus datorii și impozit'], ['Freedom number', 'din vânzare și din ce ai strâns', true]],
        key: 'Până la vânzare trăiești din dividende. După vânzare trăiești din banii încasați și din ce ai strâns.' });
    },
    update: function () {}
  };
  R.cai3 = {
    html: function () {
      return infoSlide({ col: 'var(--plum)', title: 'Trăiesc din firmă', tag: '„Devii investitor”. Păstrezi firma, iar altcineva o conduce.',
        flow: [['Crești firma', 'până acoperă nivelul dorit'], ['Aduci un CEO', 'el conduce firma'], ['Treci în board', 'păstrezi o parte din firmă'], ['Dividendul tău', 'plătește nivelul de trai', true]],
        key: 'Un CEO conduce firma. Dividendul tău plătește nivelul de trai până la capăt.' });
    },
    update: function () {}
  };


  /* drumul cifrei de afaceri: de la azi la ținta căii */
  function provBars(c, v) {
    var n = v.years.length, W = 900, H = 240, L = 70, Rr = 16, T = 18, B = 34, g0 = 0;
    var max = Math.max(v.peak, state.ca * Math.pow(1 + g0, n - 1)) * 1.1 || 1, ys = niceStep(max / 4), yMax = Math.ceil(max / ys) * ys;
    var bw = (W - L - Rr) / n, f = 'Source Sans 3, sans-serif', o = ['<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Cifra de afaceri necesară pe ani">'];
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
    return '<div class="chart-box" style="margin-top:12px">' + o.join('') + '</div><div class="lg-row"><span><i class="sw" style="background:var(--teal);height:10px"></i>pentru nivel de trai</span><span><i class="sw" style="background:var(--teal);opacity:.4;height:10px"></i>+ plăți unice și fonduri puse deoparte</span><span><i class="sw" style="background:var(--ink)"></i>cifra de afaceri de azi, fără creștere</span></div>';
  }

  function signed(n) { return Math.round(n) === 0 ? '-' : (n < 0 ? '− ' : '+ ') + nf0.format(Math.abs(Math.round(n))); }
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
      o.push('<text x="' + (X(c.R) - 10) + '" y="' + (Y(need) - 10) + '" text-anchor="end" fill="var(--ink)" font-size="14" font-weight="600" font-family="' + f + '">Freedom number ' + shortEur(need) + '</text>');
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
    var head = ['Vârsta', 'Capitol', 'Capital la început'].concat(opts.sale ? ['Vânzarea firmei'] : []).concat(['Fonduri de urgență', 'Randament', 'Dividende nete', 'Nivel de trai', 'Plăți unice']).concat(opts.def ? ['Neplătit'] : []).concat(['Capital la final', 'Din care fonduri']);
    var body = sim.rows.map(function (r, i) {
      var cells = [r.age + '-' + (r.age + 1), r.ch === 1 ? 'productiv' : 'următor', eur(r.start)];
      if (opts.sale) cells.push(r.sale ? signed(r.sale) : '');
      cells.push(signed(r.fond), signed(r.growth), signed(r.div), signed(r.life), signed(r.oo));
      if (opts.def) cells.push(r.def ? '<span class="neg">' + signed(r.def) + '</span>' : '');
      cells.push('<span' + (r.end < 0 ? ' class="neg"' : '') + '>' + eur(r.end + r.res) + '</span>', eur(r.res));
      var edge = i > 0 && r.ch === 2 && sim.rows[i - 1].ch === 1;
      return '<tr class="c' + r.ch + (edge ? ' edge' : '') + '">' + cells.map(function (v) { return '<td>' + v + '</td>'; }).join('') + '</tr>';
    }).join('');
    var inner = '<div class="ytable"><table><thead><tr>' + head.map(function (t) { return '<th>' + t + '</th>'; }).join('') + '</tr></thead><tbody>' + body + '</tbody></table></div>' +
      '<p class="note small" style="margin-top:8px">Euro de azi (reali). În anii productivi, fluxurile se înregistrează la final de an. În capitolul următor, cheltuielile ies din portofoliu la începutul anului, iar randamentul se aplică la ce rămâne. „Capital la final” include fondurile de urgență, care stau deoparte cu un randament marginal. Un sold negativ arată cât lipsește; lipsa nu produce randament.</p>';
    return opts.flat ? inner : '<details class="yt"><summary>Vezi desfășurătorul anual</summary>' + inner + '</details>';
  }
  function runOutHtml(sim, c) {
    if (sim.capRet < 1000) return '<div class="runout"><span class="rb">La ' + ani(c.R) + ' nu ai capital pentru capitolul următor.</span><span class="rs">Freedom number lipsește în întregime: ' + (c.FN.ok ? shortEur(c.FN.total) : '-') + '.</span></div>';
    if (sim.runOut) return '<div class="runout"><span class="rb">Banii se termină la ' + ani(sim.runOut) + '.</span><span class="rs">La ' + ani(Math.max(0, sim.runOut - c.R)) + ' după ce pui munca în cui, cu ' + ani(c.E - sim.runOut) + ' înainte de capăt (' + c.E + ').</span></div>';
    return '<div class="runout ok"><span class="rb">Banii ajung până la ' + ani(c.E) + '.</span><span class="rs">' + (sim.end >= 0 ? 'La final rămân ' + shortEur(sim.end) + ' în portofoliu, plus fondurile de urgență.' : '') + '</span></div>';
  }
  function sectTable(w, c, col, label) {
    return chartSVG(c, [{ sim: w.sim, color: col }], w.FNr.ok ? w.FNr.total : 0) + '<div class="lg-row"><span><i class="sw" style="background:' + col + '"></i>' + label + '</span><span>○ Freedom number la ' + c.R + ' de ani</span></div>' + tableHtml(w.sim, { flat: true, sale: w.route === 'sale', def: true });
  }
  /* calea aleasă: firma de la final, ce strângi și ce lipsește */
  function caleSt(k, v, n) { return '<div><div class="k">' + k + '</div><div class="v">' + v + '</div>' + (n ? '<div class="s">' + n + '</div>' : '') + '</div>'; }
  function caleBf(k, v, n, cls) { return '<div class="fact' + (cls ? ' ' + cls : '') + '"><div class="k">' + k + '</div><div class="v">' + v + '</div>' + (n ? '<div class="how">' + n + '</div>' : '') + '</div>'; }
  function caleOp(x) { return '<span class="op' + (x.length > 1 ? ' optxt' : '') + '">' + x + '</span>'; }
  /* peste țintă nu mai sunt necesare pârghiile */
  function caleNext(p, w) { p.querySelector('#caleNext').setAttribute('data-go', w.gap > 0.5 ? 'parghii' : 'firmaCale'); }
  function caleVerd(w, unit) {
    return w.gap > 0.5 ? '<p class="verdict no">Lipsesc ' + eur(w.gap) + unit + '.<small>Le închidem cu pârghiile de pe slide-ul următor.</small></p>' : '<p class="verdict ok">Ajungi la țintă.<small>Îți rămân ' + eur(-w.gap) + unit + ' peste ea.</small></p>';
  }
  function caleHtml(eye, q, mid) {
    return '<div class="eyebrow" style="color:var(--teal)">' + eye + '</div><h1 class="q">' + q + '</h1>' + (mid || '') +
      '<div data-o="firma"></div><div class="eqrow bridge" data-o="suma"></div><div data-o="verd"></div><details class="panel sect"><summary>Demonstrația: desfășurătorul an cu an</summary><div data-o="tb"></div></details><div class="eqrow"><button type="button" class="det-btn" id="caleNext" data-go="parghii">Continuă</button></div>';
  }
  function caleFirma(w, c) { return caleSt('Cifra de afaceri la ' + ani(c.R), shortEur(w.CA), 'azi ' + shortEur(state.ca) + ', de ' + nf2.format(w.X) + ' ori') + caleSt('EBITDA la ' + ani(c.R), shortEur(w.ER), 'azi ' + shortEur(c.E0)); }
  R.cale1 = {
    html: function () { return caleHtml('Calea ta · Las un portofoliu', 'Ajunge ce strângi?'); },
    update: function (p, c) {
      var w = c.w1; if (!w) return;
      out(p, 'firma', '<div class="jstats">' + caleFirma(w, c) + (state.pfVanzare ? caleSt(VM[c.meth].base + ' la vânzare', shortEur(w.base), 'multiplu ' + nf2.format(w.M) + '×') : '') + '</div>');
      out(p, 'suma', (state.pfVanzare ? caleBf('Net din vânzare', shortEur(w.saleNet)) + caleOp('+') + caleBf('Capital strâns', shortEur(w.sim.capRet)) + caleOp('=') + caleBf('Portofoliu la ' + ani(c.R), shortEur(w.saleNet + w.sim.capRet), '', 'gd') : caleBf('Portofoliu la ' + ani(c.R), shortEur(w.sim.capRet), 'din economii', 'gd')) + caleOp('față de') + caleBf('Capitalul care nu se consumă', shortEur(c.FN.fn), 'randamentul plătește nivelul de trai', 'ac'));
      out(p, 'verd', caleVerd(w, '')); caleNext(p, w); out(p, 'tb', sectTable(w, c, 'var(--accent)', 'Portofoliul tău'));
    }
  };
  R.cale2 = {
    html: function () { return caleHtml('Calea ta · Vând firma', 'Ce îți aduce vânzarea?'); },
    update: function (p, c) {
      var w = c.w2; if (!w) return;
      out(p, 'firma', '<div class="jstats">' + caleFirma(w, c) + caleSt(VM[c.meth].base + ' la vânzare', shortEur(w.base), 'multiplu ' + nf2.format(w.M) + '×') + '</div>');
      out(p, 'suma', caleBf('Încasezi net din vânzare', shortEur(w.saleNet)) + caleOp('+') + caleBf('Capital strâns', shortEur(w.sim.capRet)) + caleOp('=') + caleBf('Ai la ' + ani(c.R), shortEur(w.saleNet + w.sim.capRet), '', 'gd') + caleOp('față de') + caleBf('Freedom number', shortEur(c.FN.fn), '', 'ac'));
      out(p, 'verd', caleVerd(w, '')); caleNext(p, w); out(p, 'tb', sectTable(w, c, 'var(--teal)', 'Capitalul tău'));
    }
  };
  R.cale3 = {
    html: function () {
      return caleHtml('Calea ta · Trăiesc din firmă', 'Îți plătește firma nivelul de trai?', '<div class="panel">' + fld('costCeo', 'Cât plătești pentru CEO', '€/an', 'cost total') + fld('cotaPastrata', 'Cât vei deține', '%') + fld('puncteCrestere', 'Cât lași pentru creștere', 'p.p.', 'din cota ta') + fld('crestere2', 'Ritmul de creștere după retragere', '%') + '</div>');
    },
    update: function (p, c) {
      var w = c.w3; if (!w) return;
      out(p, 'firma', '<div class="jstats">' + caleFirma(w, c) + caleSt('EBITDA după CEO', shortEur(w.eb1), '') + '</div>');
      out(p, 'suma', caleBf('Dividendul din board', shortEur(w.d1.net), 'net, primul an', 'gd') + caleOp('față de') + caleBf('Nivelul dorit', shortEur(w.nevoie), 'pe an', 'ac'));
      out(p, 'verd', caleVerd(w, ' pe an')); caleNext(p, w); out(p, 'tb', sectTable(w, c, 'var(--plum)', 'Capitalul tău'));
    }
  };
  /* curba firmei și ce strângi pe drum */
  R.curba = {
    html: function () {
      return ritmEye(10) + '<h1 class="q">Cum crește firma ta?</h1><div class="planrow">' + (state.setup ? fld('vzRitm0', 'Ritmul în anul de setup', '% pe an', 'poate fi și 0', true) : '') + fld('vzSprinturi', 'Câte sprinturi faci', '', 'un sprint este un an antreprenorial, 3 ani', true) + fld('vzRitm', 'Ritmul în sprint', '% pe an', '', true) + fld('vzRitm2', 'Ritmul de după sprinturi', '% pe an', '', true) + fld('vzMarjaPlus', 'Cu cât crește marja EBITDA până la final', 'p.p.', '', true) + '</div>' +
        '<div data-o="alarma"></div><div data-o="st"></div><details class="panel sect"><summary>An cu an</summary><div data-o="tab"></div></details><div class="eqrow"><button type="button" class="det-btn" data-go="drum">Continuă</button></div>';
    },
    update: function (p, c) {
      var u = c.curba[c.n1], med = c.n1 > 0 ? Math.pow(u.X, 1 / c.n1) - 1 : 0;
      out(p, 'alarma', med > 0.25 ? '<p class="verdict no">Ritm greu de susținut.<small>În medie ' + gfmt(med) + ' pe an. Peste 25%, ani la rând, ținta nu mai este realistă.</small></p>' : '');
      out(p, 'st', '<div class="jstats">' + caleSt('Ritmul minim cerut', gfmt(c.g1), 'până la termen') + caleSt('Cifra de afaceri la ' + ani(c.R), shortEur(u.CA), 'de ' + nf2.format(u.X) + ' ori') + caleSt('EBITDA la ' + ani(c.R), shortEur(u.eb), '') + caleSt('Ritm mediu', gfmt(med), (state.setup ? 'cu an de setup' : 'fără an de setup')) + '</div>');
      out(p, 'tab', '<table class="qt"><thead><tr><th>Anul</th><th>Vârsta</th><th>Cifra de afaceri</th><th>EBITDA</th></tr></thead><tbody>' + c.curba.map(function (r) { return '<tr><td>' + r.i + '</td><td>' + r.age + '</td><td>' + eur(r.CA) + '</td><td>' + eur(r.eb) + '</td></tr>'; }).join('') + '</tbody></table>');
    }
  };
  R.drum = {
    html: function () {
      return ritmEye(11) + '<h1 class="q">Ce strângi până la retragere?</h1><div data-o="st"></div><details class="panel sect" open><summary>An cu an</summary><div data-o="tab"></div></details><div class="eqrow"><button type="button" class="det-btn" data-go="cai">Continuă</button></div>';
    },
    update: function (p, c) {
      var w = [c.w1, c.w2, c.w3][state.alegere - 1]; if (!w) { out(p, 'st', '<p class="note">Nu se poate calcula.</p>'); return; }
      var rows = w.sim.rows.filter(function (r) { return r.ch === 1; });
      out(p, 'st', '<div class="jstats">' + caleSt('Capital strâns la ' + ani(c.R), shortEur(w.sim.capRet), 'economii, dividende rămase, fonduri') + caleSt('Nivelul dorit îl atingi', w.atinsAn === null ? 'nu încă' : 'în anul ' + w.atinsAn, 'până atunci rămâne blocat') + (w.sim.tot.def > 0.5 ? caleSt('Rămân neplătite', shortEur(w.sim.tot.def), 'plăți unice și fonduri') : '') + (w.sim.resR < c.F1 - 1 ? caleSt('Fonduri neconstruite', shortEur(c.F1 - w.sim.resR), 'din ' + shortEur(c.F1)) : '') + '</div>');
      out(p, 'tab', '<table class="qt"><thead><tr><th>Anul</th><th>Bani primiți</th><th>Nivel de trai</th><th>Plăți unice</th><th>Fonduri</th><th>Capital</th></tr></thead><tbody>' + rows.map(function (r, i) { return '<tr><td>' + i + '</td><td>' + eur(r.div) + '</td><td>' + eur(-r.life) + '</td><td>' + eur(-r.oo) + '</td><td>' + eur(-r.fond) + '</td><td>' + eur(r.end + r.res) + '</td></tr>'; }).join('') + '</tbody></table>');
    }
  };
  /* pârghiile nu ating cifrele de mai sus: fiecare se calculează pe o copie */
  function gapDe(st) { var c = calc(st), w = [c.w1, c.w2, c.w3][st.alegere - 1]; return w ? w.gap : NaN; }
  R.parghii = {
    html: function () {
      var w0 = [C.w1, C.w2, C.w3][state.alegere - 1];
      if (w0 && w0.gap <= 0.5) return '<div class="eyebrow">Calea ta · pârghiile</div><h1 class="q">Ai ajuns la țintă.</h1><p class="note">Nu ai nevoie de ajustări. Îți rămân ' + eur(-w0.gap) + (state.alegere === 3 ? ' pe an' : '') + ' peste ea.</p><div class="eqrow"><button type="button" class="det-btn" data-go="firmaCale">Continuă</button></div>';
      return '<div class="eyebrow">Calea ta · pârghiile</div><h1 class="q">Cum închizi diferența?</h1><div class="planrow">' + fld('pgMarja', 'Marja EBITDA, în plus', 'p.p.', '', true) + fld('pgVarsta', 'Te retragi mai târziu cu', 'ani', '', true) + fld('pgNivel', 'Nivelul dorit, mai mic cu', '%', '', true) + (vinde() ? fld('pgMultiplu', 'Multiplul, în plus', '×', '', true) : '') + '</div>' +
        '<div data-o="st"></div><div data-o="verd"></div><div class="eqrow"><button type="button" class="det-btn" data-go="firmaCale">Continuă</button></div>';
    },
    update: function (p, c) {
      var w = [c.w1, c.w2, c.w3][state.alegere - 1]; if (!w || w.gap <= 0.5) return;
      var un = state.alegere === 3 ? ' pe an' : '', cl = function (f) { var o = JSON.parse(JSON.stringify(state)); f(o); return o; };
      var fM = function (o) { o.vzMarjaPlus += state.pgMarja; }, fV = function (o) { o.retragere += state.pgVarsta; o.aniRamasi += state.pgVarsta; }, fN = function (o) { o.cats.forEach(function (g) { g.items.forEach(function (it) { it.v[1] = (+it.v[1] || 0) * (1 - state.pgNivel / 100); }); }); };
      var mul = vinde() ? state.pgMultiplu * w.base * state.cota / 100 * (1 - state.taxCastig / 100) : 0;
      var e = function (f) { return w.gap - gapDe(cl(f)); }, dupa = gapDe(cl(function (o) { fM(o); fV(o); fN(o); })) - mul;
      var rows = [['Marja', state.pgMarja ? e(fM) : 0], ['Retragerea', state.pgVarsta ? e(fV) : 0], ['Nivelul dorit', state.pgNivel ? e(fN) : 0]]; if (vinde()) rows.push(['Multiplul', mul]);
      out(p, 'st', '<div class="jstats">' + caleSt('Lipsesc acum', shortEur(Math.max(0, w.gap)), un.trim()) + rows.map(function (r) { return caleSt(r[0], isNaN(r[1]) ? '-' : shortEur(r[1]), 'închide'); }).join('') + '</div>');
      out(p, 'verd', dupa > 0.5 ? '<p class="verdict no">Cu aceste pârghii lipsesc ' + eur(dupa) + un + '.</p>' : '<p class="verdict ok">Cu aceste pârghii, planul se închide.<small>Îți rămân ' + eur(-dupa) + un + ' peste țintă.</small></p>');
    }
  };

  R.concluzii = {
    html: function () {
      return '<div class="eyebrow">Calea ta · concluzii</div><h1 class="q">Calea ta către Freedom number</h1><div data-o="top"></div>' +
        '<div class="routes" data-o="cards"></div><div data-o="pick"></div>' +
        '<h2 class="sec">Nu ți se potrivește? Alege altă cale.</h2><div class="urmo" id="choose" data-o="alte"></div>' +
        '<p class="note small">Este un exercițiu de planificare în euro de azi, fără valoare de plan financiar sau fiscal. Valorile fiscale se confirmă cu contabilul pe legislația în vigoare.</p>';
    },
    bind: function (p) {
      p.querySelector('#choose').addEventListener('click', function (e) { var b = e.target.closest('[data-pick]'); if (!b) return; setCale(+b.getAttribute('data-pick')); changed(); });
    },
    update: function (p, c) {
      out(p, 'top', '<div class="fnbox"><div class="lbl">Freedom number la ' + c.R + ' de ani · ' + ani(c.n2) + ' de capitol următor</div><div class="big">' + (c.FN.ok ? shortEur(c.FN.fn) : '-') + '</div>' +
        '<div class="row"><div><b>' + shortEur(state.ca) + '</b>cifra de afaceri azi</div><div><b>' + (isNaN(c.marja) ? '-' : pct(c.marja)) + '</b>marja de profit net</div><div><b>' + shortEur(c.div0.net) + '</b>dividend net azi</div></div></div>');
      var W = [[1, 'var(--accent)', 'Las un portofoliu', c.w1, function (w) { return (w.saleNet ? [['Încasezi net din vânzare', shortEur(w.saleNet)]] : []).concat([['Capital strâns', shortEur(w.sim.capRet)], [w.gap > 0.5 ? 'Lipsesc' : 'Peste țintă', shortEur(Math.abs(w.gap))]]); }, 'cale'],
               [2, 'var(--teal)', 'Vând firma', c.w2, function (w) { return [['Multiplul (' + VM[c.meth].u + ')', nf2.format(c.M0) + ' → ' + nf2.format(w.M)], ['Încasezi net din vânzare', shortEur(w.saleNet)], ['Economii și dividende rămase', shortEur(w.sim.capRet)], [w.gap > 0.5 ? 'Lipsesc' : 'Peste țintă', shortEur(Math.abs(w.gap))]]; }, 'cale'],
               [3, 'var(--plum)', 'Trăiesc din firmă', c.w3, function (w) { return [['Cota păstrată', nf0.format(state.cotaPastrata) + '%'], ['Dividend net, primul an', shortEur(w.d1.net)], [w.gap > 0.5 ? 'Lipsesc pe an' : 'Peste țintă, pe an', shortEur(Math.abs(w.gap))]]; }, 'cale']];
      out(p, 'alte', URMA.filter(function (x) { return x[0] !== state.alegere; }).map(function (x) { return '<button type="button" data-pick="' + x[0] + '"><b>' + x[2] + '</b><span>' + x[3] + '</span></button>'; }).join(''));
      out(p, 'cards', W.filter(function (x) { return state.alegere === x[0]; }).map(function (x) {
        var w = x[3], sel = true, ok = w && w.status !== 'imposibil';
        return '<div class="route' + (sel ? ' sel' : '') + '" style="border-color:' + x[1] + '"><div class="rt" style="color:' + x[1] + '">Calea ' + x[0] + '</div><p class="rv">' + x[2] + '</p>' +
          (ok ? '<div class="cbig" style="color:' + x[1] + '">' + shortEur(w.CA) + '</div><p class="small" style="color:var(--muted)">' + 'cifra de afaceri la ' + c.R + ' de ani' + '</p>' +
            '<dl>' + dl((w.g != null ? [['În sprint', gfmt(w.g) + ' pe an'], ['După sprinturi', gfmt(state.vzRitm2 / 100) + ' pe an']] : w.p1 ? [['În ' + primiiAni(w.p1.yrs), gfmt(w.p1.g) + ' pe an → ' + shortEur(w.p1.CA)], ['Apoi, constant', gfmt(w.g) + ' pe an']] : [['Ritm constant de creștere', gfmt(w.g) + ' pe an']]).concat([ ['De câte ori crește firma', xfmt(w.X)], ['EBITDA la ' + c.R + ' de ani', shortEur(w.ER)]]).concat(x[4](w))) + '</dl>'
            : '<p class="small" style="color:var(--cabinet)">Pe această cale nu se ajunge la Freedom number.</p>') +
          '<div class="eqrow"><button type="button" class="link" data-go="' + x[5] + '">Vezi calculul</button></div></div>';
      }).join(''));
      var pk = state.alegere ? W[state.alegere - 1] : null, pw = pk && pk[3];
      var sum = pw && eur((pw.saleNet || 0) + pw.sim.capRet);
      out(p, 'pick', pw ? '<p class="concl">La acest ritm, firma ajunge la <span class="a">' + shortEur(pw.CA) + '</span> cifră de afaceri până la ' + ani(c.R) + '. ' +
        (state.alegere === 3 ? 'Dividendul din board ' : 'Cu ' + sum + ' strânși, ') + (pw.gap > 0.5 ? 'nu ajungi încă la țintă: lipsesc ' + eur(pw.gap) : 'ajungi la țintă și îți rămân ' + eur(-pw.gap) + ' peste ea') + (state.alegere === 3 ? ' pe an' : '') + '.</p>' : '');
    }
  };

  /* se calculează și se arată doar calea aleasă; altă cale se alege de pe Concluzii */
  function vinde() { return state.alegere === 2 || (state.alegere === 1 && state.pfVanzare); }
  function perCale(ids, none) {
    function rc() { return R[typeof ids === 'function' ? ids() : ids[state.alegere]]; }
    return {
      html: function () { var r = rc(); return r ? r.html() : '<div class="eyebrow">Calea ta</div><h1 class="q">' + none + '</h1><div class="eqrow"><button type="button" class="det-btn" data-go="' + (state.alegere ? 'cale' : 'urma') + '">Continuă</button></div>'; },
      bind: function (p) { var r = rc(); if (r && r.bind) r.bind(p); },
      update: function (p, c) { var r = rc(); if (r) r.update(p, c); }
    };
  }
  R.cai = perCale({ 1: 'cai1', 2: 'cai2', 3: 'cai3' }, 'Alege întâi ce vrei să rămână după tine.');
  [['multiplu', 'multipluV'], ['multipluDate', 'multipluDateV'], ['multipluNote', 'multipluNoteV'], ['multipluCalc', 'multipluCalcV']].forEach(function (x) { R[x[0]] = perCale(function () { return vinde() ? x[1] : null; }, 'Pe calea ta nu ai nevoie de multiplu.'); });
  R.cale = perCale({ 1: 'cale1', 2: 'cale2', 3: 'cale3' }, 'Alege întâi ce vrei să rămână după tine.');

  /* firma de care are nevoie calea aleasă: [calea, tipul firmei, trăsături, cifra-cheie a căii] */
  var FIRME = [
    [2, 'Firmă vandabilă', ['Merge fără tine', 'Venit recurent', 'Clienți diversificați', 'Echipă de conducere'], function (w) { return ['Încasezi net din vânzare', shortEur(w.saleNet)]; }],
    [3, 'Firmă care plătește dividend', ['Un CEO o conduce', 'Profit stabil', 'Cash încasat la timp', 'Tu rămâi în board'], function (w) { return ['Dividend net, primul an', shortEur(w.d1.net)]; }],
    [1, 'Firmă care produce capital', ['Marjă mare', 'Puțin cash blocat', 'Profitul merge în portofoliu', 'Disciplină la dividend'], function (w, c) { return ['Portofoliu de strâns', c.FN.ok ? shortEur(c.FN.fn) : '-']; }]
  ];
  function stCA(v) { var T = [48000, 79000, 350000, 800000, 3000000], i = 0; while (i < 5 && v > T[i]) i++; return STADII[i]; }
  R.firmaCale = {
    html: function () {
      return '<div class="eyebrow">Calea ta</div><h1 class="q">Ce fel de firmă construiești?</h1>' +
        '<div class="urmo" id="firmo">' + URMA.map(function (x) { return '<button type="button" data-c="' + x[0] + '"><b>' + x[2] + '</b></button>'; }).join('') + '</div><div data-o="f"></div>';
    },
    bind: function (p) { p.querySelector('#firmo').addEventListener('click', function (e) { var b = e.target.closest('[data-c]'); if (!b) return; setCale(+b.getAttribute('data-c')); changed(); }); },
    update: function (p, c) {
      p.querySelectorAll('#firmo button').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-c') === state.alegere)); });
      var f = FIRME.filter(function (x) { return x[0] === state.alegere; })[0];
      if (!f) { out(p, 'f', '<p class="note">Alege ce vrei să rămână după tine.</p>'); return; }
      var w = [c.w1, c.w2, c.w3][f[0] - 1], ok = w && w.status !== 'imposibil', a = stCA(state.ca), k = ok ? f[3](w, c) : null;
      var stat = function (t, v, n) { return '<div><div class="k">' + t + '</div><div class="v">' + v + '</div>' + (n ? '<div class="s">' + n + '</div>' : '') + '</div>'; };
      out(p, 'f', '<p class="firmtip">' + f[1] + '</p>' + (ok
        ? '<div class="jstats">' + stat(k[0], k[1]) + (f[0] === 2 ? (c.meth === 'venit' ? stat('Multiplul la vânzare', nf2.format(w.M) + '×', 'azi ' + nf2.format(c.M0) + '×') : stat('SDE la vânzare', shortEur(w.base), 'azi ' + shortEur(c.V0.base))) : stat('EBITDA la ' + c.R + ' de ani', shortEur(w.ER), 'azi ' + shortEur(c.E0))) + stat('Cifra de afaceri', shortEur(w.CA), 'de ' + nf2.format(w.X) + ' ori firma de azi') + stat('Stadiul', stCA(w.CA).a, 'azi ' + a.a) + '</div>'
        : '<p class="verdict no">Pe această cale nu se ajunge la Freedom number.</p>') +
        '<div class="firmtr">' + f[2].map(function (t) { return '<span>' + t + '</span>'; }).join('') + '</div>');
    }
  };

  /* ---------- ritmul: ce ritm poate ține firma ta (extragerea DE CE-ului) ---------- */
  var RITMS = [
    { id: 'men', n: 'Menținere', d: 'sub 1,1× pe an', y: ['< 1,1×', '< 1,1×', '< 1,1×'], m: [1.05, 1.05, 1.05], lo: -9, col: 'var(--muted)' },
    { id: 'len', n: 'Creștere lentă', d: '+10-20% pe an', y: ['1,1-1,2×', '1,1-1,2×', '1,1-1,2×'], m: [1.15, 1.15, 1.15], lo: 0.10, col: 'var(--teal)' },
    { id: 'sta', n: 'Creștere stabilizată', d: '+25-50% pe an', y: ['1,25-1,5×', '1,25-1,5×', '1,25-1,5×'], m: [1.37, 1.37, 1.37], lo: 0.20, col: 'var(--accent)' },
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
  /* ținta: cifra care acoperă nivelul dorit; dacă nivelul e deja atins, cifra cerută de calea aleasă în anul țintă */
  /* înainte de calea ta, ritmul cerut vine doar din creșterea minimă deja calculată */
  function tintaMin(c) {
    if (!(state.ca > 0)) return null;
    var y = Math.min(c.Y4 || 0, c.YA), g = c.g1 || 0; if (!y) return null;
    var X = Math.pow(1 + g, y); return { y: y, g: g, X: X, ca: state.ca * X, age: c.varsta + y };
  }
  function tinta4(c) {
    var y = Math.min(c.YA, c.n1), r = c.curba[y]; if (!(state.ca > 0) || !y || !r) return null;
    return { y: y, g: Math.pow(r.X, 1 / y) - 1, X: r.X, ca: r.CA, age: r.age };
  }
  /* anul calendaristic din care pornesc cele 12 trimestre: 1 fără setup, 2 cu un an de setup */
  function anStart() { return state.setup ? 2 : 1; }
  function ritmEye(n) { return '<div class="eyebrow">Ritmul firmei · pasul ' + n + ' din 11</div>'; }
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
      return ritmEye(1) + '<h1 class="q">Unde ești și unde trebuie să ajungi</h1>' +
        '<p class="note">Compară ritmul cerut cu ritmul pe care l-ai avut deja. Aceasta este distanța reală.</p>' +
        '<div data-o="hero"></div>' +
        '<details class="panel sect"><summary>Și de unde vii · ultimii 3 ani</summary>' + fld('caTrecut', 'Cifra de afaceri acum 3 ani', '€', 'aproximativ') + '<div data-o="hist"></div></details>';
    },
    update: function (p, c) {
      var t = tintaMin(c);
      out(p, 'hero', !t ? '<p class="note">Ai nevoie de cel puțin 2 ani productivi și o cifră de afaceri ca să vezi ținta.</p>' :
        '<div class="rhero"><div class="rh-box"><div class="k">Unde ești · azi</div><div class="v">' + shortEur(state.ca) + '</div><div class="s">la ' + ani(c.varsta) + '</div></div>' +
        '<div class="rh-mid"><div class="rh-x">' + xfmt(t.X) + '</div><div class="rh-ar" aria-hidden="true"></div><div class="rh-s">în ' + ani(t.y) + ' · ' + gfmt(t.g) + ' pe an</div></div>' +
        '<div class="rh-box to"><div class="k">Unde ți-ai propus · anul ' + t.y + '</div><div class="v">' + shortEur(t.ca) + '</div><div class="s">la ' + ani(t.age) + ' · nivel de trai + plăți unice</div></div></div>' +
        rampBars(c, t) +
        '<div class="rh-foot"><div><span class="k">Diferența de acoperit</span><b>+' + shortEur(t.ca - state.ca) + '</b><span class="s">cifră de afaceri în plus față de azi</span></div>' +
        '<div><span class="k">Ritmul cerut</span><b>' + gfmt(t.g) + ' pe an</b><span class="s">' + ritmChip(t.g).replace(/ <span class="rcmp[^]*$/, '') + '</span></div></div>');
      var gH = state.caTrecut > 0 && state.ca > 0 ? Math.pow(state.ca / state.caTrecut, 1 / 3) - 1 : NaN;
      out(p, 'hist', isNaN(gH) ? '<p class="note small">Completează cifra de acum 3 ani ca să-ți vezi ritmul real.</p>' :
        '<p class="lead-to">De la ' + shortEur(state.caTrecut) + ' la ' + shortEur(state.ca) + ' în 3 ani: ' + xfmt(1 + gH) + ' pe an (' + gfmt(gH) + '). ' + ritmChip(gH).replace(/ <span class="rcmp[^]*$/, '') + '</p>' +
        (t ? '<p class="note small">' + (gH >= t.g ? 'Ritmul cerut pentru anul ' + t.y + ' e sub cel pe care l-ai avut deja.' : 'Ritmul cerut pentru anul ' + t.y + ' e peste cel pe care l-ai avut în ultimii 3 ani.') + '</p>' : ''));
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
          '<p class="qsafe">Rămâne doar pe dispozitivul tău.</p></div></div>';
      },
      bind: bindTexts,
      update: function (p, c) {
        var t = tintaMin(c);
        out(p, 'ctx', t ? 'Drumul tău: <b>' + shortEur(state.ca) + '</b> azi → <b>' + shortEur(t.ca) + '</b> în anul ' + t.y + ' · ' + xfmt(t.X) + ', ' + gfmt(t.g) + ' pe an' : '');
        out(p, 'qq', o.q(t));
      }
    };
  }
  R.ritmA = qSlide({ step: 2, k: 1, key: 'a', sub: 'Caută lucrul care a dus firma până aici. Pe el se sprijină și drumul următor.',
    q: function () { return 'Ce a făcut firma să crească până acum și vrei să nu pierzi?'; },
    hints: ['un client', 'un om din echipă', 'un produs', 'un canal de vânzare', 'un obicei al meu'] });
  R.ritmB = qSlide({ step: 3, k: 2, key: 'b', sub: 'Funcționează azi, dar nu ar face față unui volum mai mare. Pe lista asta lucrezi primul.',
    q: function () { return 'Ce funcționează azi doar pentru că intervii tu sau un singur om?'; },
    hints: ['un om-cheie', 'cash-ul', 'procesele', 'livrarea', 'eu, care fac tot'] });
  R.ritmC = qSlide({ step: 4, k: 3, key: 'c', sub: 'Primul blocaj îți arată ce trebuie construit înainte de creștere.',
    q: function (t) { return t ? 'Dacă firma trebuie să crească de ' + xfmt(t.X) + ' în ' + ani(t.y) + ', unde se blochează prima dată?' : 'Dacă firma ar trebui să crească mai repede decât până acum, unde se blochează prima dată?'; },
    hints: ['oamenii', 'cash-ul', 'livrarea', 'calitatea', 'timpul meu'] });
  R.ritm2 = {
    html: function () {
      return ritmEye(6) + '<h1 class="q">Ce ritm poate ține firma ta?</h1>' +
        '<p class="note">De câte ori crește cifra de afaceri într-un an. Pe rânduri vezi unde cade ritmul cerut. Alege ritmul pe care îl poate ține firma.</p>' +
        '<div class="panel"><div class="rtab" role="table"><div class="rr rh" role="row"><span role="columnheader"></span><span role="columnheader">Ritm</span><span role="columnheader">Anul 1</span><span role="columnheader">Anul 2</span><span role="columnheader">Anul 3</span><span role="columnheader">Cine e aici</span></div><div data-o="rows" class="rtab"></div></div></div>' +
        '<div data-o="cmp"></div>';
    },
    bind: function (p) {
      p.addEventListener('click', function (e) {
        var r = e.target.closest('[data-ritm]'); if (!r) return;
        var v = +r.getAttribute('data-ritm'); state.ritmAles = state.ritmAles === v ? null : v; if (state.ritmAles != null) { var rm = RITMS[v].m; state.vzRitm = Math.round((Math.pow(rm[0] * rm[1] * rm[2], 1 / 3) - 1) * 100); } changed();
      });
    },
    update: function (p, c) {
      var t = tintaMin(c), gH = state.caTrecut > 0 && state.ca > 0 ? Math.pow(state.ca / state.caTrecut, 1 / 3) - 1 : NaN;
      var paths = [], tags = RITMS.map(function () { return []; });
      if (!isNaN(gH)) tags[ritmIdx(gH)].push('<span class="ptag you">Tu, ultimii 3 ani</span>');
      if (t) tags[ritmIdx(t.g)].push('<span class="ptag tgt">Ținta ta</span>');
      paths.forEach(function (x) { var w = x[1]; if (!w || w.status === 'imposibil') return; tags[ritmIdx(w.g)].push('<span class="ptag" style="--pc:' + x[2] + '">Calea ' + x[0] + (w.p1 ? ' · după anul ' + w.p1.yrs : '') + '</span>'); });
      out(p, 'rows', RITMS.map(function (x, i) {
        var sel = state.ritmAles === i;
        return '<button type="button" class="rr' + (sel ? ' sel' : '') + '" role="row" data-ritm="' + i + '" aria-pressed="' + sel + '" style="--rc:' + x.col + '"><span class="rsp">' + ritmSpark(x) + '</span><span class="rn"><b>' + x.n + '</b><small>' + x.d + '</small></span>' +
          x.y.map(function (y, j) { return '<span class="ry" data-y="Anul ' + (j + 1) + '">' + y + '</span>'; }).join('') + '<span class="rt2">' + tags[i].join('') + (sel ? '<span class="ptag ales">Ritmul ales de tine</span>' : '') + '</span></button>';
      }).join(''));
      var al = state.ritmAles;
      if (al == null) { out(p, 'cmp', '<p class="note">Alege un rând ca să vezi ce îți cere fiecare cale față de el.</p>'); return; }
      var rows = (t ? '<div><dt>Ținta cere ' + gfmt(t.g) + ' pe an</dt><dd class="' + (ritmIdx(t.g) <= al ? 'ok">în ritmul ales' : 'no">peste ritmul ales') + '</dd></div>' : '') +
        paths.map(function (x) {
          var w = x[1]; if (!w || w.status === 'imposibil') return '<div><dt>Calea ' + x[0] + '</dt><dd>nu se ajunge</dd></div>';
          var ok = ritmIdx(w.g) <= al;
          return '<div><dt>Calea ' + x[0] + (w.p1 ? ', după anul ' + w.p1.yrs + ',' : '') + ' cere ' + gfmt(w.g) + ' pe an</dt><dd class="' + (ok ? 'ok' : 'no') + '">' + (ok ? 'în ritmul ales' : 'peste ritmul ales') + '</dd></div>';
        }).join('');
      var gap = !isNaN(gH) && al > ritmIdx(gH) ? '<p class="note">Ai ales un ritm mai rapid decât cel pe care l-a avut firma în ultimii 3 ani. De răspunsul despre primul blocaj depinde dacă ritmul se poate ține.</p>' : '';
      out(p, 'cmp', '<div class="panel"><h2 class="sec">Față de ritmul ales: ' + RITMS[al].n.toLowerCase() + '</h2><dl class="rdl">' + rows + '</dl>' + gap + '</div>');
    }
  };
  R.ritm3 = {
    html: function () {
      return ritmEye(7) + '<div class="qwrap"><div class="qnum">?<small>de ce</small></div><div class="qbody"><div class="qctx" data-o="ctx"></div><h1 class="q qbig">De ce ritmul ăsta?</h1>' +
        '<table class="qt"><thead><tr><th>Creșterea pentru validare</th><th>Creșterea pentru construcție</th></tr></thead><tbody><tr><td>Vreau să demonstrez că sunt capabil</td><td>Vreau să construiesc ceva durabil</td></tr><tr><td>Vreau să fiu mai mare decât competitorii</td><td>Vreau să creez valoare pentru clienți</td></tr><tr><td>Vreau să fiu recunoscut și admirat</td><td>Vreau un sistem care funcționează și fără implicarea mea permanentă</td></tr></tbody></table>' +
        '<p class="note">Scrie motivul real, apoi lucrează în perechi: partenerul întreabă de cel mult trei ori „De ce e important pentru tine?”</p><div data-o="why"></div>' +
        '<p class="qsafe">Rămâne doar pe dispozitivul tău.</p></div></div>';
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
  /* profile orientative de sezonalitate pe luni calendaristice (ian-dec); se pot ajusta lună cu lună */
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
  function an1Eye(n) { return '<div class="eyebrow">Primul an antreprenorial · pasul ' + n + ' din 3</div>'; }
  function an1Model(c) { return state.ca * (1 + (c.g1 || 0)); }
  /* creșterea flat: fiecare lună = luna anterioară × (1 + r), pornind de la media lunară de azi; suma celor 12 luni = ținta */
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
      o.push('<text x="' + lx + '" y="' + (y - 3) + '" font-family="Manrope, sans-serif" font-weight="700" font-size="21" fill="' + (i === 2 ? 'var(--accent)' : 'var(--ink)') + '">' + t[0] + '</text>');
      o.push('<text x="' + lx + '" y="' + (y + 20) + '" font-family="Source Sans 3, sans-serif" font-size="15" fill="var(--muted)">' + t[1] + '</text>');
    });
    o.push('</svg>');
    return o.join('');
  }
  R.munte = {
    html: function () {
      return ritmEye(8) + '<h1 class="q">Urcarea muntelui</h1>' +
        '<p class="note">Ai ales deja vârful. Acum coborâm până la ce faci luni dimineață.</p>' +
        '<div class="mgrid"><div class="mtn" data-o="mtn"></div><div class="mlist" data-o="ml"></div></div>' +
        '<p class="lead-to">Fiecare punct răspunde la aceeași întrebare, la altă distanță: ce trebuie să fie adevărat până atunci?</p>';
    },
    update: function (p, c) {
      var t = tintaMin(c);
      var top = c.FN.ok ? 'Freedom number ' + shortEur(c.FN.fn) + ' la ' + ani(c.R) : 'capitolul următor';
      out(p, 'mtn', mountainSVG([['Vârful', top], ['Trei ani · anul ' + (t ? t.y : c.YA), t ? shortEur(t.ca) + ' cifră de afaceri' : '-'], ['12 trimestre', 'anul tău antreprenorial'], ['12 săptămâni', 'anul echipei']]));
      out(p, 'ml', [
        ['Vârful', 'Capitolul următor', 'Freedom number. Nu se schimbă de la un an la altul.'],
        ['Trei ani', 'Anul ' + (t ? t.y : c.YA), 'Cifra de afaceri la care ajunge firma' + (t ? ' (' + shortEur(t.ca) + ', ' + xfmt(t.X) + ')' : '') + '.'],
        ['12 trimestre', 'Anul antreprenorial', 'Trei ani normali, priviți ca 12 luni ale unui singur an.'],
        ['12 săptămâni', 'Anul echipei', 'Un trimestru: perioada în care echipa își face inițiativele.']
      ].map(function (x, i) { return '<div class="mli' + (i === 2 ? ' hi' : '') + '"><span class="mk">' + x[0] + '</span><b>' + x[1] + '</b><span>' + x[2] + '</span></div>'; }).join(''));
    }
  };

  /* ---------- anul antreprenorial: 12 trimestre (anul 1 → anul 4) = 12 luni antreprenoriale ---------- */
  /* cifrele hărții vin mereu din calculul Freedom number, cât timp antreprenorul nu le-a modificat (dMan) */
  function destDefaults(c) {
    var t = tinta4(c), mg = isNaN(c.marja) ? 10 : Math.round(c.marja * 1000) / 10, x0 = c.M0, xT = c.MT;
    var s0 = Math.round((state.setup ? an1Model(c) : state.ca) / 1000) * 1000;
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
  /* baza multiplului pe hartă: cifra de afaceri sau SDE, după metoda aleasă la vânzare */
  function destBaza(S, P) { return state.valMetoda === 'venit' ? S : P * (state.profitNet > 0 ? state.ebitda / state.profitNet : 1) + state.sdeSalariu + state.sdeChelt; }
  function destCalc() {
    var S0 = state.dS0, P0 = S0 * state.dM0 / 100, V0 = state.dX0 * destBaza(S0, P0);
    if (!(state.dST > 0) && state.dMT > 0) state.dST = Math.round(state.dPT / (state.dMT / 100));
    var PT = state.dPT, ST = state.dST, VT = state.dXT * destBaza(ST, PT);
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
      return ritmEye(9) + '<h1 class="q">Trei ani devin un singur an: anul tău antreprenorial</h1>' +
        '<p class="note">3 ani normali = 12 trimestre. Fiecare trimestru este o lună antreprenorială.</p>' +
        '<div class="panel"><h2 class="sec">Poate începe creșterea cu firma de azi?</h2><div class="eqrow"><span class="seg" id="setup"><button type="button" data-su="0">Da: cele 12 trimestre pornesc acum</button><button type="button" data-su="1">Nu: fac întâi un an de setup</button></span></div><p class="note small">Ai nevoie de setup dacă blocajul cere oameni, sisteme sau finanțare pe care nu le poți pune la punct în primele 12 săptămâni.</p></div>' +
        '<div class="panel"><div class="aeg" data-o="aeg"></div></div>';
    },
    bind: function (p) { p.querySelector('#setup').addEventListener('click', function (e) { var b = e.target.closest('[data-su]'); if (!b) return; state.setup = b.getAttribute('data-su') === '1'; if (state.dMan) state.dMan.dS0 = false; destInit(calc(state)); changed(); }); },
    update: function (p, c) {
      p.querySelectorAll('#setup [data-su]').forEach(function (b) { b.setAttribute('aria-pressed', String((b.getAttribute('data-su') === '1') === !!state.setup)); });
      var t = tintaMin(c), st = anStart(), y = st + 2, html = '';
      for (var a = st; a <= y; a++) {
        html += '<div class="aey"><div class="aey-h">Anul ' + a + '</div><div class="aey-q">';
        for (var q = 1; q <= 4; q++) { var k = (a - st) * 4 + q; html += '<div class="aeq"><span class="aeq-t">T' + q + '</span><b>Luna ' + k + '</b></div>'; }
        html += '</div></div>';
      }
      out(p, 'aeg', '<div class="aeh"><div class="aeh-s"><span class="k">Punctul de plecare</span><b>' + (state.setup ? 'Anul de setup' : 'Azi') + '</b></div><div class="aeh-ar" aria-hidden="true">→</div><div class="aeh-s to"><span class="k">Destinația</span><b>Anul ' + y + '</b><span class="s">' + (t ? shortEur(t.ca) + ' cifră de afaceri' : '') + '</span></div></div><div class="aeys">' + html + '</div>');
    }
  };
  function dIn(k, unit) { return '<span class="din"><input data-k="' + k + '" inputmode="decimal" value="' + fmtK(k) + '"><small>' + unit + '</small></span>'; }
  R.dest = {
    html: function () {
      destInit(C);
      return an1Eye(2) + '<h1 class="q">De unde pleci și unde ajungi</h1>' +
        '<p class="note">Cifrele vin din calcul. Le poți ajusta în celulele albe. Valoarea firmei = multiplu × ' + (state.valMetoda === 'venit' ? 'cifra de afaceri' : 'SDE') + '.</p>' +
        '<div class="dmap"><div class="dcol"><div class="dh">Punctul de plecare</div>' +
        '<div class="dr"><span class="dl">Vânzări</span>' + dIn('dS0', '€') + '</div>' +
        '<div class="dr"><span class="dl">Marjă</span>' + dIn('dM0', '%') + '</div>' +
        '<div class="dr calc"><span class="dl">Profit</span><b data-o="P0"></b></div>' +
        '<div class="dr"><span class="dl">Multiplu</span>' + dIn('dX0', '×') + '</div>' +
        '<div class="dr calc"><span class="dl">Valoare</span><b data-o="V0"></b></div></div>' +
        '<div class="dcol mid"><div class="dh">Ritm creștere</div><div class="dx"><span>Vânzări</span><b data-o="xS"></b></div><div class="dx"><span>Profit</span><b data-o="xP"></b></div><div class="dx"><span>Valoare</span><b data-o="xV"></b></div></div>' +
        '<div class="dcol to"><div class="dh">Ținta</div>' +
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
      out(p, 'xS', isNaN(d.xS) ? '-' : xfmt(d.xS)); out(p, 'xP', isNaN(d.xP) ? '-' : xfmt(d.xP)); out(p, 'xV', isNaN(d.xV) ? '-' : xfmt(d.xV));
      var df = destDefaults(c), mod = state.dMan && state.dMan.dST ? true : Math.abs(state.dST - df.dST) > 1;
      out(p, 'stsrc', mod ? 'din calcul: ' + shortEur(df.dST) + ' · modificat' : 'din calculul Freedom number');
      out(p, 'dsrc', 'Din calcul: plecare = ' + shortEur(state.setup ? an1Model(c) : state.ca) + ', țintă = ' + (t ? shortEur(t.ca) : '-') + ', marja de azi ' + (isNaN(c.marja) ? '-' : pct(c.marja)) + '.');
    }
  };
  R.plan = {
    html: function () {
      destInit(C);
      return an1Eye(3) + '<h1 class="q">Cele 12 trimestre: creșterea uniformă și țintele tale</h1>' +
        '<p class="note">Creșterea uniformă arată același procent în fiecare trimestru. Tu ajustezi țintele după sezonalitatea firmei. Bugetul detaliat vine mai târziu în program.</p>' +
        '<div class="panel jpanel"><div data-o="st"></div><div data-o="ch"></div></div>' +
        '<div class="panel"><div class="eqrow"><button type="button" class="chip" id="bCopy">Pornește de la creșterea uniformă</button><button type="button" class="chip" id="bClear">Golește țintele</button></div><div class="tbl-wrap" data-o="tb"></div></div>' +
        '<div class="panel"><h2 class="sec">Primele 12 săptămâni: ce trebuie să fie adevărat la final?</h2><p class="note">Scrie trei inițiative pentru primul an al echipei. Pornește de la primul blocaj și de la criza următoare.</p>' + [0, 1, 2].map(function (i) { return '<input class="tline" data-ini="' + i + '" value="' + esc((state.initiative || [])[i] || '') + '" placeholder="Inițiativa ' + (i + 1) + '">'; }).join('') + '</div>';
    },
    bind: function (p) {
      p.addEventListener('change', function (e) {
        var t = e.target, iv = t.getAttribute('data-bv'), ip = t.getAttribute('data-bp'); if (iv == null && ip == null) return;
        var i = +(iv != null ? iv : ip), v = parseRo(t.value); if (!state.bud[i]) state.bud[i] = { v: 0, p: null };
        if (iv != null) state.bud[i].v = isNaN(v) ? 0 : Math.max(0, v); else state.bud[i].p = isNaN(v) ? null : v;
        changed();
      });
      p.addEventListener('input', function (e) { var i = e.target.getAttribute('data-ini'); if (i == null) return; if (!state.initiative) state.initiative = ['', '', '']; state.initiative[+i] = e.target.value; save(); });
      p.querySelector('#bCopy').addEventListener('click', function () { var pl = planCalc(); if (!pl) return; state.bud = pl.rows.map(function (r) { return { v: Math.round(r.fv / 1000) * 1000, p: null }; }); changed(); p.querySelectorAll('[data-bv]').forEach(function (inp) { inp.value = nf0.format(state.bud[+inp.getAttribute('data-bv')].v); }); });
      p.querySelector('#bClear').addEventListener('click', function () { state.bud = []; changed(); p.querySelectorAll('[data-bv]').forEach(function (inp) { inp.value = ''; }); });
    },
    update: function (p, c) {
      var pl = planCalc(); if (!pl) { out(p, 'st', '<p class="note">Completează harta destinației.</p>'); return; }
      var tb = p.querySelector('[data-o="tb"]');
      var sum = function (a, b, f) { var t = 0; for (var i = a; i < b; i++) t += f(pl.rows[i]); return t; };
      var bAll = sum(0, 12, function (r) { return r.bv; }), b4 = sum(8, 12, function (r) { return r.bv; }), f4 = sum(8, 12, function (r) { return r.fv; });
      out(p, 'st', '<div class="jstats"><div><div class="k">Creștere uniformă, de la un trimestru la altul</div><div class="v" style="color:var(--accent)">' + gfmt(pl.r) + '</div><div class="s">pe trimestru · ' + gfmt(pl.ann) + ' pe an · ' + ritmChip(pl.ann).replace(/ <span class="rcmp[^]*$/, '') + '</div></div>' +
        '<div><div class="k">Primul trimestru</div><div class="v">' + shortEur(pl.rows[0].fv) + '</div><div class="s">vânzări, creștere uniformă</div></div>' +
        '<div><div class="k">Ultimele 4 trimestre: ținte vs destinație</div><div class="v" style="color:' + (b4 >= pl.d.ST - 1 ? 'var(--teal)' : 'var(--cabinet)') + '">' + (bAll > 0 ? shortEur(b4) : '-') + '</div><div class="s">' + (bAll > 0 ? (b4 >= pl.d.ST - 1 ? 'atinge ' : 'sub ') + shortEur(pl.d.ST) + (b4 >= pl.d.ST - 1 ? '' : ' cu ' + shortEur(pl.d.ST - b4)) : 'scrie țintele în tabel') + '</div></div></div>');
      out(p, 'ch', planChart(pl));
      var head = '<table class="qt pt"><thead><tr><th rowspan="2">Luna antreprenorială</th><th colspan="3" class="grp">Creștere uniformă</th><th colspan="3" class="grp b">Ținta ta</th><th rowspan="2">Diferență</th></tr><tr><th>Vânzări</th><th>Profit</th><th>%</th><th>Vânzări</th><th>%</th><th>Profit</th></tr></thead><tbody>';
      var body = '', y = 2;
      pl.rows.forEach(function (r, i) {
        var q = (i % 4) + 1, df = r.bv - r.fv;
        body += '<tr><th>Luna ' + r.k + ' <small>T' + q + ' · anul ' + (anStart() + Math.floor(i / 4)) + '</small></th><td>' + eur(r.fv) + '</td><td>' + eur(r.fp) + '</td><td>' + nf.format(state.dMT) + '%</td>' +
          '<td class="bin"><input data-bv="' + i + '" inputmode="decimal" placeholder="' + nf0.format(Math.round(r.fv / 1000) * 1000) + '" value="' + (r.bv ? nf0.format(r.bv) : '') + '"></td>' +
          '<td class="bin s"><input data-bp="' + i + '" inputmode="decimal" value="' + nf2.format(r.bpct) + '"></td><td>' + (r.bv ? eur(r.bpr) : '-') + '</td>' +
          '<td class="' + (r.bv ? (df >= 0 ? 'pos' : 'neg') : '') + '">' + (r.bv ? (df >= 0 ? '+' : '−') + nf0.format(Math.abs(Math.round(df))) + ' €' : '-') + '</td></tr>';
        if (q === 4) {
          var a = i - 3, fv = sum(a, i + 1, function (x) { return x.fv; }), fp = sum(a, i + 1, function (x) { return x.fp; }), bv = sum(a, i + 1, function (x) { return x.bv; }), bp = sum(a, i + 1, function (x) { return x.bpr; });
          body += '<tr class="tot"><th>Anul ' + y + (y === 4 ? ' · destinația ' + shortEur(pl.d.ST) : '') + '</th><td>' + eur(fv) + '</td><td>' + eur(fp) + '</td><td></td><td>' + (bv ? eur(bv) : '-') + '</td><td>' + (bv ? nf.format(bp / bv * 100) + '%' : '') + '</td><td>' + (bv ? eur(bp) : '-') + '</td><td class="' + (bv ? (bv - fv >= 0 ? 'pos' : 'neg') : '') + '">' + (bv ? (bv - fv >= 0 ? '+' : '−') + nf0.format(Math.abs(Math.round(bv - fv))) + ' €' : '') + '</td></tr>';
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
    var W = 900, H = 250, L = 70, Rr = 16, T = 18, B = 34, n = 12, fnt = 'Source Sans 3, sans-serif';
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
  function termsEye(n) { return '<div class="eyebrow">T.E.R.M.S. · pasul ' + n + ' din 7</div>'; }
  var LET = { T: ['Timp', 'Cât timp vrei să pui în firmă și cât în afara ei?'], E: ['Energie', 'Ce te încarcă și ce nu mai ești dispus să tolerezi?'], R: ['Resurse', 'Ce resurse ești dispus să pui în firmă?'], M: ['Mijloace financiare', 'Câți bani trebuie să producă firma?'], S: ['Sănătate', 'Câtă putere ai să ții acest drum?'] };
  function letterHead(L, n, hook, hookPh) {
    return termsEye(n) + '<div class="lethead"><div class="letbig">' + L + '</div><div class="lettxt"><div class="letname">' + LET[L][0] + '</div><h1 class="q">' + LET[L][1] + '</h1></div></div>' +
      '<div class="panel tstep"><div class="tsn">1</div><div class="tsb"><h2 class="sec">Înainte de clauză · singur, în scris</h2><p class="lead-to">' + hook + '</p>' + tTxt(L + '.hk', hookPh, 3) + '<p class="qsafe">Rămâne doar pe dispozitivul tău. Nu intră în Act.</p></div></div>';
  }
  function tStep(n, title, body) { return '<div class="panel tstep"><div class="tsn">' + n + '</div><div class="tsb"><h2 class="sec">' + title + '</h2>' + body + '</div></div>'; }
  function tQuote(t) { return '<p class="tquote">' + t + '</p>'; }
  function yr(i) { return new Date().getFullYear() + i; }

  /* ---------- stadiile firmei și crizele de trecere ---------- */
  var STADII = [
    { a: 'Hamster', n: 'Practician', w: 'Lucrezi singur. Dacă te oprești, se oprește și firma.', p: 'până la 48.000 €', c: 'Leadership: nu poate delega producția' },
    { a: 'Veveriță', n: 'Optimizator', w: 'Ai 1-2 oameni, acumulezi și rămâi sub un plafon.', p: 'până la 79.000 € (plafon TVA)', c: 'Prag fiscal' },
    { a: 'Berbec', n: 'Meșter', w: 'Ai echipă, dar clienții și deciziile trec prin tine.', p: 'până la 350.000 €', c: 'Leadership: rezolvată prin omul cheie' },
    { a: 'Gazelă', n: 'Delegator', w: 'Ai oameni care conduc zone din firmă, iar tu înveți să delegi.', p: 'până la 800.000 €', c: 'Autonomie: seniori fără sisteme' },
    { a: 'Ghepard', n: 'Constructor', w: 'Firma are manageri și sisteme, iar tu faci strategia.', p: 'până la 3.000.000 €', c: 'Control: manageri fără coordonare' },
    { a: 'Leu', n: 'Campion', w: 'Conduci un grup consolidat, autohton, neafiliat la rețele internaționale.', p: 'peste 3.000.000 €, autohton', c: 'Birocrație' },
    { a: 'Dinozaur', n: 'Reprezentant', w: 'Multinațională sau firmă afiliată unei rețele profesionale internaționale. Este reper, nu țintă.', p: 'multinațională sau afiliată', c: 'Birocrație instalată', reper: true }
  ];
  var CRIZE = [
    { n: 'Criza de leadership', e: 'Hamster · Practician', r: 'Nu poți delega producția.', b: 'Primii oameni care livrează fără tine.' },
    { n: 'Criza de prag fiscal', e: 'Veveriță · Optimizator', r: 'Te oprești sub un plafon.', b: 'Prețuri și un model care rămân profitabile peste plafon.' },
    { n: 'Criza omului cheie', e: 'Berbec · Meșter', r: 'Criza de leadership se rezolvă prin omul cheie, iar totul depinde de el.', b: 'Procese scrise și un conducător operațional.' },
    { n: 'Criza de autonomie', e: 'Gazelă · Delegator', r: 'Ai seniori, dar nu ai sisteme.', b: 'Responsabilități clare și sisteme comune.' },
    { n: 'Criza de control', e: 'Ghepard · Constructor', r: 'Managerii lucrează fără coordonare.', b: 'Bugete, raportare și ședințe de coordonare.' },
    { n: 'Criza de birocrație', e: 'Leu · Campion', r: 'Deciziile se mișcă tot mai greu.', b: 'Decizii mai aproape de client și mai puține niveluri.' }
  ];
  function stPathMin(c) { var pk = state.alegere; return pk === 1 ? 3 : pk ? 4 : null; }
  function stTarget(c) { var m = stPathMin(c), a = state.stAzi; if (state.stTinta != null) return state.stTinta; if (m != null) return Math.max(m, a == null ? 0 : a); return a == null ? null : Math.min(5, a + 1); }
  function stEye(n) { return '<div class="eyebrow">Stadiile firmei · pasul ' + n + ' din 3</div>'; }
  function pathNeed(c) {
    var pk = state.alegere;
    if (!pk) return 'Nu ai ales încă o cale. <button type="button" class="link" data-go="urma">Alege-o</button>';
    return ['Calea 1 · Economii cere cel puțin Delegator, ca să ai timp și bani în afara firmei.',
      'Calea 2 · Vânzare cere cel puțin Constructor: cumpărătorul plătește pentru o firmă care merge fără tine.',
      'Calea 3 · Board cere Constructor și Exitul 3: un CEO te înlocuiește, iar tu primești dividende ca proprietar.'][pk - 1];
  }
  R.stadii = {
    html: function () {
      return stEye(1) + '<h1 class="q">În ce stadiu este firma ta azi?</h1>' +
        '<p class="note">Alege după rolul tău de azi; cifra de afaceri este un reper. Dacă ești între două stadii, alege-l pe cel inferior. Apasă o dată pe stadiul de azi, a doua oară pe stadiul din anul țintă.</p>' +
        '<div class="stg" id="stg"></div>' +
        '<div class="panel"><h2 class="sec">Ce cere calea ta</h2><p class="lead-to" data-o="need" style="font-weight:500"></p><div data-o="res"></div></div>';
    },
    bind: function (p) {
      p.querySelector('#stg').addEventListener('click', function (e) {
        var b = e.target.closest('[data-st]'); if (!b) return;
        var i = +b.getAttribute('data-st'), t = stTarget(C);
        if (STADII[i].reper && state.stAzi != null && i !== state.stAzi) return;
        if (state.stAzi == null) { state.stAzi = i; state.stTinta = null; }
        else if (i === state.stAzi) { state.stAzi = null; state.stTinta = null; }
        else if (i === t && state.stTinta != null) state.stTinta = null;
        else state.stTinta = i;
        changed();
      });
    },
    update: function (p, c) {
      var a = state.stAzi, t = stTarget(c), m = stPathMin(c);
      p.querySelector('#stg').innerHTML = STADII.map(function (x, i) {
        var tags = (i === a ? '<span class="ptag you">Azi</span>' : '') + (i === t && t !== a ? '<span class="ptag tgt">Ținta</span>' : '') + (m === i ? '<span class="ptag ales">Cerut de calea ' + state.alegere + '</span>' : '');
        return '<button type="button" class="stc' + (i === a ? ' azi' : '') + (i === t && t !== a ? ' tgt' : '') + '" data-st="' + i + '" aria-pressed="' + (i === a || i === t) + '"><span class="stn">' + x.a + '</span><b>' + x.n + '</b><span class="stw">' + x.w + '</span><span class="stp">' + x.p + '</span><span class="sttag">' + tags + '</span></button>';
      }).join('');
      out(p, 'need', pathNeed(c));
      if (a == null) { out(p, 'res', '<p class="note">Alege mai sus stadiul de azi.</p>'); return; }
      var n = t != null ? Math.max(0, t - a) : 0, low = m != null && t != null && t < m;
      out(p, 'res', '<div class="jstats"><div><div class="k">Azi</div><div class="v">' + STADII[a].n + '</div><div class="s">stadiul ' + (a + 1) + ' din 7</div></div>' +
        '<div><div class="k">Anul țintă</div><div class="v" style="color:var(--accent)">' + (t != null ? STADII[t].n : '-') + '</div><div class="s">' + (state.stTinta == null ? 'propus din calea aleasă; îl poți schimba' : 'ales de tine') + '</div></div>' +
        '<div><div class="k">Crize de trecut</div><div class="v">' + n + '</div><div class="s">' + (n ? CRIZE.slice(a, t).map(function (k) { return k.n; }).join(', ') : (t != null && t < a ? 'ținta e sub stadiul de azi' : 'rămâi în același stadiu')) + '</div></div></div>' +
        (low ? '<p class="verdict no" style="font-size:1.1rem">Ținta e sub ce cere calea ' + state.alegere + '.<small>Ori ridici ținta la ' + STADII[m].n + ', ori schimbi calea.</small></p>' : ''));
    }
  };
  R.crize = {
    html: function () {
      return stEye(2) + '<h1 class="q">Fiecare stadiu are criza lui</h1>' +
        '<p class="note">Scrie ce construiești în primul an pentru fiecare criză de pe drumul tău. Răspunsurile intră în Act.</p>' +
        '<div class="stack" data-o="cz"></div>';
    },
    bind: function (p) {
      p.addEventListener('input', function (e) { var i = e.target.getAttribute('data-sp'); if (i == null) return; state.stPlan[+i] = e.target.value; save(); });
    },
    update: function (p, c) {
      var a = state.stAzi, t = stTarget(c), box = p.querySelector('[data-o="cz"]');
      if (box.contains(document.activeElement)) return;
      if (a == null) { box.innerHTML = '<p class="note">Alege întâi stadiul de azi. <button type="button" class="link" data-go="stadii">Înapoi la stadii</button></p>'; return; }
      if (t == null || t <= a) { box.innerHTML = '<p class="verdict ok">Pe drumul ales nu treci nicio criză de stadiu.<small>Firma rămâne ' + STADII[a].n + '. Verifică dacă asta se potrivește cu clauza de timp din Act.</small></p>'; return; }
      box.innerHTML = '<p class="lead-to">De la <b>' + STADII[a].n + '</b> la <b>' + STADII[t].n + '</b>: ' + (t - a === 1 ? 'o criză' : (t - a) + ' crize') + '.</p>' + CRIZE.slice(a, t).map(function (k, j) {
        var i = a + j;
        return '<div class="panel crzc"><div class="eyebrow" style="color:var(--cabinet)">' + k.e + '</div><h3>' + k.n + '</h3>' +
          '<div class="grid2"><div><h2 class="sec">Ce nu mai funcționează</h2><p>' + k.r + '</p></div><div><h2 class="sec">Ce trebuie construit</h2><p>' + k.b + '</p></div></div>' +
          '<label class="dq"><span class="dqq">Ce construiești în primul an</span><textarea class="qta tta" rows="2" data-sp="' + i + '" placeholder="Un om, un proces, un raport, o decizie pe care o predai.">' + esc(state.stPlan[i] || '') + '</textarea></label></div>';
      }).join('');
    }
  };

  R.tIntro = {
    html: function () {
      var r = state.rol || { c: [] };
      return termsEye(1) + '<h1 class="q">Reacționezi sau conduci?</h1>' +
        '<p class="lead-to">Actul de la Registrul Comerțului spune cine deține firma. Noul Act Constitutiv spune în ce termeni lucrează firma pentru tine.</p>' +
        '<div class="panel"><h2 class="sec">Cerințele tale de dimineață</h2><ul class="cl">' + (r.c || []).filter(function (x) { return (x || '').trim(); }).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
        '<label class="dq"><span class="dqq">Dacă firma ar fi un angajat, ce i-ai scrie în contract, în afară de bani?</span>' + tTxt('hook', 'Câte zile vrei să fii acolo, ce nu mai faci tu, ce nu se negociază.', 4) + '</label><p class="qsafe">Rămâne doar pe dispozitivul tău.</p></div>';
    },
    bind: function (p) { bindTerms(p); },
    update: function () {}
  };
  R.tIntro2 = {
    html: function () {
      return termsEye(2) + '<h1 class="q">Firma ta, în termenii tăi</h1>' +
        '<div class="tgrid">' + ['T', 'E', 'R', 'M', 'S'].map(function (L) { return '<div class="tcard' + (L === 'M' ? ' done' : '') + '"><div class="tl">' + L + '</div><b>' + LET[L][0] + '</b><span>' + LET[L][1] + '</span>' + (L === 'M' ? '<em>calculat deja</em>' : '<em>se declară</em>') + '</div>'; }).join('') + '</div>' +
        '<p class="tquote">Patru termeni se declară, iar M l-ai calculat deja. Dacă cifra de la M se atinge doar încălcându-i pe ceilalți, corectezi cifra.</p>' +
        '<p class="note small">Cadru adaptat după Martin Norbury, Entrepreneurs Circle.</p>';
    },
    bind: function (p) { bindTerms(p); },
    update: function () {}
  };

  R.tT = {
    html: function () {
      return letterHead('T', 3, 'Ce ai ratat săptămâna trecută din cauza firmei?', 'Săptămâna trecută am ratat…') +
        tStep(2, 'Clauza de timp', '<div class="trow"><span>Ore pe săptămână, azi</span>' + tNum('T.now', 'ore') + '</div>' +
          '<div class="trow"><span>Ore pe săptămână, în anul țintă</span>' + tNum('T.end', 'ore') + '</div>' +
          '<div class="trow"><span>Zile pe săptămână, în anul țintă</span>' + tNum('T.zile', 'zile') + '</div>' +
          '<div class="trow"><span>Săptămâni de concediu pe an, fără laptop</span>' + tNum('T.conc', 'săpt.') + '</div>' +
          '<label class="dq"><span class="dqq">Ce nu se negociază</span>' + tTxt('T.neg', 'De exemplu: miercuri după-amiaza sunt cu copiii.', 2) + '</label>') +
        tStep(3, 'Ce înseamnă pentru firmă', '<div data-o="tres"></div>');
    },
    bind: function (p) { bindTerms(p, R.tT); },
    update: function (p) {
      var t = TS().T, d = Math.max(0, (t.now || 0) - (t.end || 0)), sapt = 52 - (t.conc || 0);
      out(p, 'tres', '<div class="jstats"><div><div class="k">Ore de predat pe săptămână</div><div class="v" style="color:var(--accent)">' + nf0.format(d) + '</div><div class="s">de la ' + nf0.format(t.now || 0) + ' la ' + nf0.format(t.end || 0) + '</div></div>' +
        '<div><div class="k">Ore de predat pe an</div><div class="v">' + nf0.format(d * sapt) + '</div><div class="s">la ' + sapt + ' săptămâni lucrate</div></div>' +
        '<div><div class="k">Echivalent normă întreagă</div><div class="v">' + nf.format(d * sapt / 1760) + '</div><div class="s">oameni, la 1.760 de ore pe an</div></div></div>' +
        '<p class="note">Orele pe care le dai altcuiva trebuie preluate de un om, un proces sau un furnizor. Și asta se plătește din cifra de la M.</p>');
    }
  };

  R.tE = {
    html: function () {
      return letterHead('E', 4, 'Ce ai făcut săptămâna trecută și te-a golit de energie, deși altcineva putea face acel lucru?', 'Săptămâna trecută m-a golit…') +
        tStep(2, 'Abia aștepți ziua de luni?', '<div class="trow"><span>Duminică seara, de la 1 la 10, azi</span>' + tNum('E.azi', '/ 10', 70) + '</div><div class="trow"><span>Nota pe care o vrei în anul țintă</span>' + tNum('E.tinta', '/ 10', 70) + '</div>') +
        tStep(3, 'Clauza de energie', '<p class="note small">Cel mult trei activități care ies din fișa ta, cu orele lor pe săptămână.</p>' +
          [0, 1, 2].map(function (i) { return '<div class="trow"><span class="tn">' + (i + 1) + '</span>' + tLine('E.a.' + i + '.n', ['de exemplu: facturarea', 'de exemplu: ofertele mici', 'de exemplu: problemele zilnice'][i]) + tNum('E.a.' + i + '.h', 'ore') + '</div>'; }).join('') +
          '<label class="dq"><span class="dqq">Ce păstrezi</span>' + tTxt('E.keep', 'Partea din muncă pentru care ai pornit firma.', 2) + '</label>' +
          '<label class="dq"><span class="dqq">Ce nu mai tolerezi</span>' + tTxt('E.no', 'Un tip de client, un comportament, un mod de lucru.', 2) + '</label>' +
          '<label class="dq"><span class="dqq">Ce oprești, chiar dacă aduce bani</span>' + tTxt('E.opresc', 'Un client, un proiect, un obicei.', 2) + '</label>') +
        tStep(4, 'Ce înseamnă pentru firmă', '<div data-o="eres"></div>');
    },
    bind: function (p) { bindTerms(p, R.tE); },
    update: function (p) {
      var a = TS().E.a, h = a.reduce(function (s, x) { return s + (+x.h || 0); }, 0), n = a.filter(function (x) { return (x.n || '').trim(); }).length;
      out(p, 'eres', '<div class="jstats"><div><div class="k">Activități care ies din fișa ta</div><div class="v" style="color:var(--accent)">' + n + '</div></div><div><div class="k">Ore pe săptămână eliberate</div><div class="v">' + nf0.format(h) + '</div><div class="s">se adaugă la clauza de timp</div></div></div>');
    }
  };

  function contractRows(c) {
    destInit(c); var pl = planCalc(), d = destCalc(), rows = [], first = anStart();
    for (var i = 1; i <= c.YA + 1; i++) {
      var y = c.prov && c.prov.years && c.prov.years[i], ca, pr, idx = i - first;
      if (idx < 0) { ca = d.S0; pr = d.P0; }
      else if (pl) {
        var a = Math.min(idx, 2) * 4, bv = 0, fv = 0, bp = 0, fp = 0, full = true;
        for (var k = a; k < a + 4; k++) { var r = pl.rows[k]; fv += r.fv; fp += r.fp; if (r.bv) { bv += r.bv; bp += r.bpr; } else full = false; }
        ca = full ? bv : fv; pr = full ? bp : fp;
      }
      rows.push({ i: i, an: yr(i), life: y ? y.life : 0, oo: y ? y.prov : 0, fond: y ? y.fond : 0, alt: y ? y.alt : 0, div: y ? y.div : 0, ca: ca || 0, pr: pr || 0 });
    }
    return rows;
  }
  function pathInfo(c) {
    var pk = state.alegere || 1, w = [c.w1, c.w2, c.w3][pk - 1], nm = ['Las un portofoliu', 'Vând firma', 'Trăiesc din firmă'][pk - 1];
    return { pk: pk, w: w, nm: nm, ales: !!state.alegere };
  }
  R.tR = {
    html: function () {
      return letterHead('R', 5, 'Unde ai lucrat cel mai bine în ultimul an: în ce loc, cu ce oameni, la ce oră?', 'Am lucrat cel mai bine…') +
        tStep(2, 'Clauza de resurse', '<div class="trow"><span>Câți oameni cel mult în firmă</span>' + tNum('R.echipa', 'oameni') + '</div>' +
          '<div class="trow"><span>Unde lucrezi în anul țintă</span>' + tSeg('R.loc', ['La birou', 'Mixt', 'De acasă', 'De oriunde']) + '</div>' +
          '<div class="trow"><span>Unde vrei să trăiești</span>' + tLine('R.oras', 'oraș, țară, aproape de cine') + '</div>' +
          '<div class="trow"><span>Ce capital lași în firmă</span><b>' + nf0.format(state.reinvest) + '% din profit</b></div>' +
          '<label class="dq"><span class="dqq">Constrângerile pe care ți le asumi</span>' + tTxt('R.constr', 'De exemplu: nu ne mutăm din biroul de acum.', 2) + '</label>');
    },
    bind: function (p) { bindTerms(p); },
    update: function () {}
  };

  R.tM = {
    html: function () {
      return termsEye(6) + '<div class="lethead"><div class="letbig done">M</div><div class="lettxt"><div class="letname">Mijloace financiare · calculat deja</div><h1 class="q">Câți bani trebuie să producă firma?</h1></div></div>' +
        '<div class="panel tstep"><div class="tsn">1</div><div class="tsb"><h2 class="sec">Înainte de cifre · singur, în scris</h2><p class="lead-to">Dacă firma ți-ar plăti exact aceste sume, ce s-ar schimba acasă în primul an?</p>' + tTxt('M.hk', 'În primul an aș putea…', 3) + '<p class="qsafe">Rămâne doar pe dispozitivul tău.</p></div></div>' +
        tStep(2, 'Ținta până la capitolul următor', '<div data-o="rtop"></div>') +
        tStep(3, 'Banii de acum și banii pentru viitor', '<div class="tbl-wrap" data-o="rtab"></div><p class="note small">Sumele sunt nete, în banii de azi. Cifra de afaceri și profitul vin din harta destinației și din harta călătoriei.</p>');
    },
    bind: function (p) { bindTerms(p); },
    update: function (p, c) {
      destInit(c); var pi = pathInfo(c), w = pi.w, t = tinta4(c);
      out(p, 'rtop', '<div class="jstats"><div><div class="k">Freedom number</div><div class="v" style="color:var(--accent)">' + (c.FN.ok ? shortEur(c.FN.fn) : '-') + '</div><div class="s">la ' + ani(c.R) + ', pentru ' + ani(c.n2) + ' de capitol următor</div></div>' +
        '<div><div class="k">Calea aleasă</div><div class="v vtxt">' + pi.nm + '</div></div>' +
        '<div><div class="k">Cifra de afaceri la ' + ani(c.R) + '</div><div class="v">' + (w && w.status !== 'imposibil' ? shortEur(w.CA) : '-') + '</div><div class="s">' + (w && w.status !== 'imposibil' ? gfmt(w.g) + ' pe an după anul ' + (t ? t.y : 4) : '') + '</div></div>' +
        '<div><div class="k">Anul 4</div><div class="v">' + shortEur(destCalc().ST) + '</div><div class="s">cifra de afaceri din harta destinației</div></div></div>');
      var rows = contractRows(c);
      out(p, 'rtab', '<table class="qt"><thead><tr><th>Anul</th><th>Nivel de trai</th><th>Plăți unice puse deoparte</th><th>Fonduri</th><th>Din alte surse</th><th>Dividend net necesar</th><th>Cifra de afaceri</th><th>Profit</th></tr></thead><tbody>' +
        rows.map(function (r) { return '<tr><th>Anul ' + r.i + ' <small>' + r.an + '</small></th><td>' + eur(r.life) + '</td><td>' + eur(r.oo) + '</td><td>' + eur(r.fond) + '</td><td>' + eur(r.alt) + '</td><td><b>' + eur(r.div) + '</b></td><td><b>' + eur(r.ca) + '</b></td><td>' + eur(r.pr) + '</td></tr>'; }).join('') + '</tbody></table>');
    }
  };

  R.tS = {
    html: function () {
      return letterHead('S', 7, 'Ce ai tolerat anul trecut și ai primit mai mult din același lucru?', 'Am tolerat…') +
        tStep(2, 'Ce ești dispus să faci ca să funcționeze?', tTxt('S.dispus', 'Sunt dispus să…', 2)) +
        tStep(3, 'Cât timp dai tot', '<div class="trow"><span>Dacă drumul durează un an, dai tot?</span>' + tSeg('S.y1', ['Da', 'Poate', 'Nu']) + '</div>' +
          '<div class="trow"><span>Dacă durează doi ani?</span>' + tSeg('S.y2', ['Da', 'Poate', 'Nu']) + '</div>' +
          '<div class="trow"><span>Dacă durează trei ani?</span>' + tSeg('S.y3', ['Da', 'Poate', 'Nu']) + '</div><div data-o="sres"></div>') +
        tQuote('Anul la care răspunsul devine „poate” este orizontul real al Actului.');
    },
    bind: function (p) { bindTerms(p, R.tS); },
    update: function (p, c) {
      var s = TS().S, h = !s.y1 ? null : s.y1 !== 'Da' ? 0 : !s.y2 ? null : s.y2 !== 'Da' ? 1 : !s.y3 ? null : s.y3 !== 'Da' ? 2 : 3, y = c.YA;
      out(p, 'sres', h == null ? '' : '<p class="lead-to">' + (h >= y ? 'Dai tot cel puțin ' + ani(y) + ': orizontul se potrivește cu harta.' : (h === 0 ? 'Nu dai tot nici un an.' : 'Dai tot ' + ani(h) + '.') + ' Harta cere ' + ani(y) + ': ori urci mai repede, ori schimbi ținta, ori iei pe cineva care să urce cu tine.') + '</p>');
    }
  };

  R.contract = {
    html: function () {
      return '<div class="eyebrow">Actul constitutiv</div><h1 class="q">Noul Act Constitutiv</h1>' +
        '<ol class="isteps"><li>Întoarce-te la prima ta foaie: dacă firma respectă acest Act, când nu mai amâni acel lucru?</li><li>Citește Actul și anexa, apoi corectează ce nu îți poți asuma.</li><li>Citește-i partenerului un singur angajament. El este martorul tău.</li><li>Semnezi tu, ca antreprenor, și tot tu, pentru firmă.</li></ol>' +
        '<div class="panel"><div class="ctf"><label>Numele tău<input class="tline" data-ct="ctNume" value="' + esc(state.ctNume || '') + '" placeholder="Prenume Nume"></label><label>Firma<input class="tline" data-ct="ctFirma" value="' + esc(state.ctFirma || '') + '" placeholder="Denumirea firmei"></label><label>Locul<input class="tline" data-ct="ctLoc" value="' + esc(state.ctLoc || '') + '" placeholder="Orașul"></label></div>' +
        '<div class="eqrow"><button type="button" class="det-btn" id="ctPdf">Descarcă PDF</button><button type="button" class="chip" id="ctPrint">Printează</button><span class="small" data-o="ctmsg" style="color:var(--muted)"></span></div></div>' +
        '<div data-o="pdfv"></div><div class="opwrap"><div id="ctDoc" data-o="doc"></div></div>';
    },
    bind: function (p) {
      p.addEventListener('input', function (e) { var k = e.target.getAttribute('data-ct'); if (!k) return; state[k] = e.target.value; save(); R.contract.update(p, C); });
      p.querySelector('#ctPrint').addEventListener('click', function () { printDoc(p.querySelector('#ctDoc'), '0', p, 'ctmsg'); });
      p.querySelector('#ctPdf').addEventListener('click', function () { contractPdf(p); });
    },
    update: function (p, c) { out(p, 'doc', contractHtml(c)); }
  };
  function cv(v, ph) { return v && String(v).trim() ? esc(String(v).trim().replace(/[.;,\s]+$/, '')) : '<span class="ctblank">' + ph + '</span>'; }
  function deW(n, w) { n = Math.round(n || 0); var m = Math.abs(n) % 100; return nf0.format(n) + ((m >= 20 || (m === 0 && n !== 0)) ? ' de ' : ' ') + w; }
  function stRow(c) {
    var a = state.stAzi, t = stTarget(c); if (a == null) return '';
    var r = '<tr><td>Stadiul firmei: azi · în anul țintă</td><td><b>' + STADII[a].n + ' · ' + (t != null ? STADII[t].n : '-') + '</b></td></tr>';
    if (t != null && t > a) CRIZE.slice(a, t).forEach(function (k, j) { var v = (state.stPlan[a + j] || '').trim(); r += '<tr><td>' + k.n + ': ce se construiește în primul an</td><td>' + (v ? esc(v) : '<span class="ctblank">de completat</span>') + '</td></tr>'; });
    return r;
  }
  function loadScript(src) { return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  /* PDF-ul se generează în browser: fiecare pagină e desenată, apoi așezată pe A4 */
  function pdfLib() {
    var a = window.html2canvas ? Promise.resolve() : loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    var b = window.jspdf ? Promise.resolve() : loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    return Promise.all([a, b]);
  }
  function pdfDesen(el, sc) { return window.html2canvas(el, { scale: sc, backgroundColor: '#ffffff', logging: false }); }
  /* descărcarea poate fi blocată de browser, așa că PDF-ul rămâne și vizibil pe pagină */
  function pdfSalveaza(pdf, fn, p, k) {
    var url = URL.createObjectURL(pdf.output('blob')), a = document.createElement('a');
    a.href = url; a.download = fn; document.body.appendChild(a); a.click(); a.remove();
    out(p, k, 'PDF-ul e gata.');
    var el = p.querySelector('[data-o="pdfv"]');
    if (el) el.innerHTML = '<div class="eqrow noprint"><a class="det-btn" href="' + url + '" download="' + esc(fn) + '">Salvează PDF-ul</a><a class="chip" href="' + url + '" target="_blank" rel="noopener">Deschide în altă filă</a></div><iframe class="pdfprev noprint" src="' + url + '" title="Previzualizare PDF"></iframe>';
  }
  /* printarea trece printr-un cadru separat: documentul lung nu mai e tăiat de pagina aplicației */
  function printDoc(el, margin, p, k) {
    var f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'; document.body.appendChild(f);
    var d = f.contentWindow.document, css = [].slice.call(document.querySelectorAll('link[rel="stylesheet"],style')).map(function (x) { return x.outerHTML; }).join('');
    d.open(); d.write('<!doctype html><html lang="ro"><head><meta charset="utf-8"><title>' + esc(document.title) + '</title>' + css + '<style>@page{size:A4 portrait;margin:' + margin + '}@media print{html,body{background:#fff}body *{visibility:visible!important}#ctDoc,#cxDoc{position:static!important;width:auto!important;padding:0!important}.oppage{margin:0!important;box-shadow:none!important;break-after:page}.oppage:last-child{break-after:auto}.cxdoc{width:auto;max-width:none;padding:0}}</style></head><body><div class="fn">' + el.outerHTML + '</div></body></html>'); d.close();
    var gata = function () { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (er) { if (p) out(p, k, 'Printarea nu e disponibilă aici.'); } setTimeout(function () { f.remove(); }, 60000); };
    var fonts = d.fonts && d.fonts.ready ? d.fonts.ready : Promise.resolve();
    Promise.race([fonts, new Promise(function (r) { setTimeout(r, 1500); })]).then(function () { setTimeout(gata, 200); });
  }
  function contractPdf(p) {
    var pages = [].slice.call(p.querySelectorAll('#ctDoc .oppage')), fn = 'Noul Act Constitutiv' + (state.ctFirma ? ' - ' + state.ctFirma : '') + '.pdf';
    out(p, 'ctmsg', 'Pregătesc PDF-ul…');
    pdfLib().then(function () {
      var pdf = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      return pages.reduce(function (pr, el, i) { return pr.then(function () { return pdfDesen(el, 2).then(function (cv) { if (i) pdf.addPage(); pdf.addImage(cv.toDataURL('image/jpeg', 0.94), 'JPEG', 0, 0, 210, 297); }); }); }, Promise.resolve()).then(function () { pdfSalveaza(pdf, fn, p, 'ctmsg'); });
    }).catch(function () { out(p, 'ctmsg', 'Nu am putut genera PDF-ul aici. Folosește „Printează” și alege „Salvează ca PDF”.'); });
  }

  /* ---------- paginile kick-off-ului care nu au calcule proprii ---------- */
  function eye(t) { return '<div class="eyebrow">' + t + '</div>'; }
  function eyeEx(ex, t) { return '<div class="eyebrow"><span class="extag">Exercițiu · ' + ex + '</span> ' + t + '</div>'; }
  function still(html, update) { return { html: function () { return html; }, update: update || function () {} }; }
  function cards(items) { return '<div class="kgrid">' + items.map(function (x) { return '<div class="panel kcard"><h2 class="sec">' + x[0] + '</h2><p>' + x[1] + '</p></div>'; }).join('') + '</div>'; }
    function V() { if (!state.viata) state.viata = {}; return state.viata; }
  function Rol() { if (!state.rol) state.rol = { fraza: '', c: ['', '', ''] }; return state.rol; }
  function vTxt(k, ph, rows) { return '<textarea class="qta tta" rows="' + (rows || 3) + '" data-vt="' + k + '" placeholder="' + esc(ph || '') + '">' + esc(V()[k] || '') + '</textarea>'; }
  function bindViata(p) {
    p.addEventListener('input', function (e) { var k = e.target.getAttribute('data-vt'); if (!k) return; V()[k] = e.target.value; save(); });
  }

  R.viataDorita = {
    html: function () {
      return eyeEx('lucrezi singur, 10 minute', 'Viața dorită') + '<h1 class="q">Cum vrei să arate următorii 10 ani?</h1><p class="note">Scrie ce vrei să ai, să faci și să devii. Fezabilitatea o verificăm mai târziu.</p>' +
        '<div class="kgrid k2">' + [['timp', 'Timp', 'Cum arată o zi obișnuită de marți?'], ['loc', 'Loc', 'Unde trăiești?'], ['oameni', 'Oameni', 'Cu cine îți petreci timpul?'], ['activ', 'Activități', 'Ce faci doar pentru că vrei?']].map(function (x) { return '<label class="panel kcard"><h2 class="sec">' + x[1] + '</h2><span>' + x[2] + '</span>' + vTxt(x[0], '', 4) + '</label>'; }).join('') + '</div><p class="qsafe">Rămâne doar pe dispozitivul tău.</p>';
    },
    bind: bindViata, update: function () {}
  };
  var MOTIVE = [['lib', 'Libertate', 'Îmi decid timpul și clienții?'], ['sig', 'Siguranță', 'Familia mea e acoperită, orice s-ar întâmpla?'], ['bani', 'Bani', 'Câștig cât cred că merită munca mea?'], ['fam', 'Timp pentru familie', 'Sunt prezent acasă și în perioadele aglomerate?'], ['san', 'Sănătate', 'Corpul meu ține ritmul pe care îl cere firma?'], ['rec', 'Recunoaștere', 'Cei care contează pentru mine văd ce am construit?'], ['rea', 'Realizare', 'Munca mea îmi dă satisfacție?'], ['con', 'Contribuție', 'Las ceva în urmă, dincolo de firmă?']];
  function sondaj() { var v = V(); return v.sond || (v.sond = {}); }
  function sondNota(id, k) { var x = sondaj()[id]; return x && x[k] ? x[k] : 0; }
  function sondComplet() { return MOTIVE.filter(function (m) { return sondNota(m[0], 'c') && sondNota(m[0], 'a'); }).length; }
  /* cele mai mari două lipsuri; la egalitate urcă ce contează mai mult */
  function sondTop() {
    return MOTIVE.map(function (m) { var c = sondNota(m[0], 'c'), a = sondNota(m[0], 'a'); return { id: m[0], n: m[1], c: c, a: a, l: Math.max(0, c - a) }; })
      .sort(function (x, y) { return y.l - x.l || y.c - x.c; }).slice(0, 2);
  }
  function sondNote(id, k) { return '<span class="seg srate">' + [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" data-s="' + id + '.' + k + '.' + n + '" aria-pressed="' + (sondNota(id, k) === n) + '">' + n + '</button>'; }).join('') + '</span>'; }
  function sondTabel() {
    var gata = sondComplet();
    return '<div class="srows"><div class="srow shead"><span></span><span>Cât contează pentru mine</span><span>Cât am azi</span></div>' +
      MOTIVE.map(function (m) { return '<div class="srow"><div><b>' + m[1] + '</b><small>' + m[2] + '</small></div>' + sondNote(m[0], 'c') + sondNote(m[0], 'a') + '</div>'; }).join('') + '</div>' +
      '<div class="sfoot"><button type="button" class="go" data-sgo="1"' + (gata < MOTIVE.length ? ' disabled' : '') + '>Arată rezultatul</button><span class="small">' + gata + ' din ' + MOTIVE.length + ' completate</span></div>';
  }
  function sondRezultat() {
    var top = sondTop();
    return '<h2 class="sec">' + (top[0].l ? 'Cele mai mari două lipsuri' : 'Nu ai nicio lipsă. Acestea contează cel mai mult') + '</h2><div class="kgrid k2">' + top.map(function (t) {
      return '<label class="panel kcard"><h2 class="sec">' + t.n + '</h2><span>Contează ' + t.c + ' · Ai azi ' + t.a + ' · Lipsă ' + t.l + '</span>' + vTxt('sondT_' + t.id, 'Știu că am asta când…', 3) + '</label>';
    }).join('') + '</div><div class="sfoot"><button type="button" class="chip" data-sback="1">Modifică notele</button></div>';
  }
  R.ceCauti = {
    html: function () { return eyeEx('lucrezi singur, 5 minute', 'Motivația') + '<h1 class="q">Ce cauți prin succesul tău?</h1><p class="note" data-o="sNote"></p><div data-o="sond"></div><p class="qsafe">Rămâne doar pe dispozitivul tău.</p>'; },
    bind: function (p) {
      bindViata(p);
      p.addEventListener('click', function (e) {
        var b = e.target.closest('[data-s],[data-sgo],[data-sback]'); if (!b || b.disabled) return;
        var v = V(), s = b.getAttribute('data-s');
        if (s) { var x = s.split('.'), o = sondaj(); (o[x[0]] || (o[x[0]] = {}))[x[1]] = +x[2]; }
        else v.sondGata = b.hasAttribute('data-sgo');
        changed();
      });
    },
    update: function (p) {
      var g = V().sondGata;
      out(p, 'sNote', g ? 'Pentru fiecare, scrie o frază: de unde știi că ai asta?' : 'Dă fiecărui element două note, de la 1 la 5.');
      out(p, 'sond', g ? sondRezultat() : sondTabel());
    }
  };
  R.rolFirma = {
    html: function () {
      var r = Rol();
      return eyeEx('lucrezi singur, 5 minute', 'Rolul firmei') + '<h1 class="q">Ce trebuie să-ți ofere firma?</h1>' +
        '<table class="qt qrol"><thead><tr><th>Din viața dorită</th><th>Cerință pentru firmă</th></tr></thead><tbody><tr><td>Mai mult timp liber</td><td>Independență operațională, delegare și procese clare</td></tr><tr><td>Independență financiară</td><td>Profit, capital acumulat și resurse planificate</td></tr><tr><td>Călătorii și mobilitate</td><td>Independență față de locație, decizii luate de la distanță</td></tr><tr><td>Mai puțină implicare zilnică</td><td>Echipă capabilă, responsabilități clare, sisteme de management</td></tr><tr><td>Contribuție și impact</td><td>Oameni, cultură și valoare creată pentru clienți</td></tr><tr><td>Siguranță pe termen lung</td><td>Rezerve, active, predictibilitate, mai puține dependențe critice</td></tr></tbody></table>' +
        '<label class="dq"><span class="dqq">Rolul firmei în viața mea, într-o frază</span><input class="tline" data-rol="fraza" value="' + esc(r.fraza) + '" placeholder="Firma îmi oferă…"></label>' +
        '<div class="dq"><span class="dqq">Trei cerințe pentru firmă</span>' + [0, 1, 2].map(function (i) { return '<input class="tline" data-rol="' + i + '" value="' + esc(r.c[i] || '') + '" placeholder="Cerința ' + (i + 1) + '">'; }).join('') + '</div><p class="qsafe">Aceste rânduri intră în Actul pe care îl semnezi la final.</p>';
    },
    bind: function (p) { p.addEventListener('input', function (e) { var k = e.target.getAttribute('data-rol'); if (k == null) return; var r = Rol(); if (k === 'fraza') r.fraza = e.target.value; else r.c[+k] = e.target.value; save(); }); },
    update: function () {}
  };

  function venTotal(y) { var t = 0; state.venituri.forEach(function (r) { if (!r.firma) t += venAt(r.v, y); }); return { t: t, r: t - venAt(state.pierderi, y) }; }
  /* slide-ul 34: veniturile din toate sursele, cu valori și procente, pentru anul curent și anul următor */
  function venInput(id, y, v) { return '<td class="bin"><input data-ven="' + id + '" data-y="' + y + '" inputmode="decimal" value="' + (v == null ? '' : nf0.format(v)) + '" placeholder="' + (y ? '=' : '0') + '" aria-label="' + (y ? 'Anul următor' : 'Anul curent') + '"></td>'; }
  function venPct(v, t) { return t > 0 ? nf0.format(v / t * 100) + '%' : '-'; }
  R.venituri = {
    html: function () {
      return eye('Vehiculul') + '<h1 class="q">Ce alte surse de bani ai?</h1><p class="note">Euro net pe an, fără dividendele firmei, pe care le-ai calculat deja. Bifează ce continuă fără munca ta.</p><div class="tbl-wrap" data-o="vt"></div>' +
        '<div class="panel"><h2 class="sec">Economiile de azi</h2><div class="trow"><span>Cât ai deja pus deoparte</span><span class="din"><input id="ecoIn" inputmode="decimal" value="' + (state.economii == null ? '' : nf0.format(state.economii)) + '" placeholder="0" aria-label="Economiile de azi"><small>€</small></span></div></div>';
    },
    bind: function (p) {
      var self = this;
      p.querySelector('#ecoIn').addEventListener('change', function (e) {
        var raw = e.target.value.trim(), v = raw === '' ? null : parseRo(raw); if (v != null && (isNaN(v) || v < 0)) v = state.economii;
        state.economii = v; e.target.value = v == null ? '' : nf0.format(v); changed();
      });
      p.addEventListener('change', function (e) {
        var t = e.target, id = t.getAttribute('data-ven'), c = t.getAttribute('data-vc');
        if (id != null) {
          var raw = t.value.trim(), v = raw === '' ? null : parseRo(raw), y = +t.getAttribute('data-y'); if (v != null && isNaN(v)) v = null;
          if (id === 'p') state.pierderi[y] = v; else state.venituri.forEach(function (r) { if (String(r.id) === id) r.v[y] = v; });
          if (y === 0 && v == null) { if (id === 'p') state.pierderi[0] = 0; }
          t.value = v == null ? '' : nf0.format(v);
          changed();
        } else if (c != null) { state.venituri.forEach(function (r) { if (String(r.id) === c) r.cont = t.checked; }); changed(); }
        else if (t.getAttribute('data-vn') != null) { state.venituri.forEach(function (r) { if (String(r.id) === t.getAttribute('data-vn')) r.n = t.value; }); changed(); }
      });
      p.addEventListener('click', function (e) {
        var d = e.target.closest('[data-vdel]');
        if (d) { state.venituri = state.venituri.filter(function (r) { return String(r.id) !== d.getAttribute('data-vdel'); }); self.body(p); changed(); return; }
        var b = e.target.closest('[data-vadd]'); if (!b) return;
        var g = +b.getAttribute('data-vadd'), id = state.venituri.reduce(function (m, r) { return Math.max(m, r.id); }, 0) + 1;
        state.venituri.push({ id: id, g: g, n: 'Sursă nouă', firma: false, cont: false, v: [0, null], custom: true });
        self.body(p); changed();
      });
      self.body(p);
    },
    body: function (p) {
      function cells(k) { return '<td data-o="' + k + '0"></td><td class="vpc" data-o="' + k + 'p0"></td><td data-o="' + k + '1"></td><td class="vpc" data-o="' + k + 'p1"></td>'; }
      var head = '<table class="qt vent"><thead><tr><th>Sursa</th><th>Anul curent</th><th>%</th><th>Anul următor</th><th>%</th><th>Continuă fără munca ta?</th></tr></thead><tbody>';
      var body = VEN_GROUPS.map(function (gn, g) {
        return '<tr class="vg"><th>' + gn + ' <button type="button" class="addsub" data-vadd="' + g + '">+ Adaugă sursă</button></th>' + cells('vg' + g) + '<td></td></tr>' + state.venituri.filter(function (r) { return r.g === g && !r.firma; }).map(function (r) {
          return '<tr><th>' + (r.custom ? '<span class="sn"><input class="tline" data-vn="' + r.id + '" value="' + esc(r.n) + '" aria-label="Numele sursei"><button type="button" class="rm" data-vdel="' + r.id + '" aria-label="Elimină ' + esc(r.n) + '" title="Elimină sursa">×</button></span>' : esc(r.n)) + '</th>' +
            venInput(r.id, 0, r.v[0]) + '<td class="vpc" data-o="vr' + r.id + 'p0"></td>' + venInput(r.id, 1, r.v[1]) + '<td class="vpc" data-o="vr' + r.id + 'p1"></td>' +
            '<td>' + (r.firma ? '' : '<input type="checkbox" data-vc="' + r.id + '"' + (r.cont ? ' checked' : '') + ' aria-label="Continuă fără munca ta">') + '</td></tr>';
        }).join('');
      }).join('');
      var foot = '<tr class="vtot"><th>Total venituri nete</th>' + cells('vT') + '<td></td></tr>' +
        '<tr><th>Pierderi</th>' + venInput('p', 0, state.pierderi[0]) + '<td></td>' + venInput('p', 1, state.pierderi[1]) + '<td></td><td></td></tr>' +
        '<tr class="vtot"><th>Rămâne după pierderi</th><td data-o="vR0"></td><td></td><td data-o="vR1"></td><td></td><td></td></tr>';
      out(p, 'vt', head + body + foot + '</tbody></table>');
    },
    update: function (p, c) {
      for (var y = 0; y < 2; y++) {
        var v = venTotal(y);
        out(p, 'vT' + y, eur(v.t)); out(p, 'vTp' + y, venPct(v.t, v.t)); out(p, 'vR' + y, eur(v.r));
        VEN_GROUPS.forEach(function (gn, g) {
          var t = 0; state.venituri.forEach(function (r) { if (r.g === g) { var x = venAt(r.v, y); t += x; out(p, 'vr' + r.id + 'p' + y, venPct(x, v.t)); } });
          out(p, 'vg' + g + y, eur(t)); out(p, 'vg' + g + 'p' + y, venPct(t, v.t));
        });
      }
    }
  };

  R.freedom2 = {
    html: function () { return state.alegere === 3 ? '<div class="eyebrow">Freedom number</div><h1 class="q">Pe calea ta nu ai nevoie de randament.</h1><div class="eqrow"><button type="button" class="det-btn" data-go="punte">Continuă</button></div>' : FN2.html(); },
    bind: function (p) { if (state.alegere !== 3 && FN2.bind) FN2.bind(p); },
    update: function (p, c) { if (state.alegere !== 3) FN2.update(p, c); }
  };
  R.punte = still(eye('Freedom number') + '<h1 class="q qhuge">Acum ai cifra.<span class="qnext">Urmează să vedem ce firmă trebuie să avem pentru a o împlini.</span></h1>');

  /* slide-ul 31: cât din avere stă în firmă */
  function Av() { var a = state.avere; if (!a) a = state.avere = { pct: null }; if (a.pct === undefined) a.pct = a.total > 0 ? Math.round(a.firma / a.total * 100) : null; return a; }
  R.spv2 = {
    html: function () {
      return eye('Vehiculul') + '<h1 class="q">La majoritatea proprietarilor de companie, 80-90% din avere stă într-un singur vehicul: firma.</h1>' +
        '<p class="lead-to">Valoarea ei devine bani abia când cineva o plătește.</p>' +
        '<div class="panel"><h2 class="sec">Procentul tău</h2><div class="trow"><span>Cât din averea ta stă în firmă?</span><span class="din"><input data-av="pct" inputmode="decimal" value="' + (Av().pct == null ? '' : nf0.format(Av().pct)) + '" placeholder="0" aria-label="Procentul din avere care stă în firmă"><small>%</small></span></div></div>' +
        '<p class="note small">Sursa: Exit Planning Institute, estimare pentru SUA. Răspunsul tău rămâne pe dispozitivul tău.</p>';
    },
    bind: function (p) { p.addEventListener('change', function (e) { if (e.target.getAttribute('data-av') !== 'pct') return; var v = parseRo(e.target.value); Av().pct = isNaN(v) || e.target.value.trim() === '' ? null : Math.min(100, Math.max(0, v)); e.target.value = Av().pct == null ? '' : nf0.format(Av().pct); save(); }); },
    update: function () {}
  };

  R.spv3 = still('<h1 class="q qhuge">Cum arată vehiculul care ne aduce liniștea?</h1>');

  /* exiturile */
  var EXITS = [
    { n: 'Ieși din execuție', d: 'Executant → Manager', t: 'Din execuție în management', r: 'De la a face la a delega', col: '#e9b949' },
    { n: 'Ieși din management', d: 'Manager → CEO', t: 'Din management în CEO', r: 'De la a delega la a conduce', col: '#e67e5c' },
    { n: 'Ieși din conducere', d: 'CEO → Board', t: 'Din CEO în board', r: 'De la a conduce la a guverna', col: '#3fa66a' },
    { n: 'Ieși din board', d: 'Board → Investitor', t: 'Din board în investitor', r: 'De la a guverna la a deține', col: '#4a9fe0' },
    { n: 'Ieși din proprietate', d: 'Investitor → Încasezi', t: 'Din proprietate', r: 'De la a deține la a încasa', col: '#a24bb8' }
  ];
  function exitLine(on, click, rol) {
    return '<div class="xline">' + EXITS.map(function (x, i) {
      var inner = '<i style="background:' + x.col + '"></i><b>Exit ' + (i + 1) + '</b><span class="xn">' + x.n + '</span><span class="xd">' + x.d + '</span>' + (rol ? '<span class="xr">' + x.r + '</span>' : '');
      return click ? '<button type="button" class="xp' + (on && on(i) ? ' on' : '') + '" data-ex="' + i + '" aria-pressed="' + !!(on && on(i)) + '">' + inner + '</button>' : '<div class="xp">' + inner + '</div>';
    }).join('') + '</div>';
  }
  var EX_TITLE = 'Exitul este deplasarea ta din micro în macro management.';
  R.exitQ = {
    html: function () { return eyeEx('lucrezi singur, un minut', 'Exitul') + '<h1 class="q qhuge">Ce înseamnă pentru tine „exit”?</h1><p class="lead-to">Scrie o singură frază.</p>' + vTxt('exitFraza', 'Pentru mine, exit înseamnă…', 2); },
    bind: bindViata, update: function () {}
  };
  R.exitLinie = still(eye('Exitul') + '<h1 class="q">' + EX_TITLE + '</h1>' + exitLine(null, false, true));
  function exBind(key) {
    return function (p) {
      p.addEventListener('click', function (e) {
        var b = e.target.closest('[data-ex]'); if (!b) return; var i = +b.getAttribute('data-ex');
        if (key === 'exitFacute') { var f = state.exitFacute || (state.exitFacute = []), k = f.indexOf(i); if (k >= 0) f.splice(k, 1); else f.push(i); }
        else state[key] = state[key] === i ? null : i;
        changed();
      });
    };
  }
  R.exitUnde = {
    html: function () { return eyeEx('lucrezi singur, 3 minute', 'Exitul') + '<h1 class="q">Unde ești pe această scară?</h1><div class="panel"><h2 class="sec">Exiturile pe care le-ai făcut deja</h2><div data-o="f"></div></div><div class="panel"><h2 class="sec">Exitul care te atrage pentru capitolul următor</h2><div data-o="d"></div></div>'; },
    bind: function (p) {
      p.addEventListener('click', function (e) {
        var b = e.target.closest('[data-ex]'); if (!b) return; var i = +b.getAttribute('data-ex');
        if (b.closest('[data-o="f"]')) { var f = state.exitFacute || (state.exitFacute = []), k = f.indexOf(i); if (k >= 0) f.splice(k, 1); else f.push(i); }
        else state.exitDorit = state.exitDorit === i ? null : i;
        changed();
      });
    },
    update: function (p) { var f = state.exitFacute || []; out(p, 'f', exitLine(function (i) { return f.indexOf(i) >= 0; }, true)); out(p, 'd', exitLine(function (i) { return state.exitDorit === i; }, true)); }
  };
  var VARIANTE = [[1, 'Economii', 'Din ce strângi pe drum'], [2, 'Vânzare', 'Din ce primești când vinzi firma'], [3, 'Board', 'Din ce îți plătește firma după ce nu o mai conduci']];
  R.crestereCash = still(ritmEye(5) + '<h1 class="q qhuge">„Orice creștere consumă cash.”</h1><p class="note">Alan Miltz</p><p class="lead-to">Firma are nevoie de o parte din profit ca să crească.<br>De aceea, profitul nu poate merge integral în dividende.</p>');

  R.exitNext = {
    html: function () {
      return stEye(3) + '<h1 class="q">Următorul tău exit</h1><table class="qt"><thead><tr><th>Trecerea</th><th>Exitul</th></tr></thead><tbody><tr><td>Meșter → Delegator</td><td>Exit 1: din execuție în management</td></tr><tr><td>Delegator → Constructor</td><td>Exit 2: din management în CEO</td></tr><tr><td>Constructor → pasul următor</td><td>Exit 3: din CEO în board</td></tr><tr><td>Campion</td><td>Exit 4 sau 5, dacă le alegi</td></tr></tbody></table>' +
        '<div class="panel"><h2 class="sec">Recitește alegerea de la slide-ul 41. O păstrezi sau o schimbi?</h2><div data-o="x"></div></div>' +
        '<div class="grid2"><label class="dq"><span class="dqq">Ce rol vei avea peste trei ani?</span>' + vTxt('rolAn3', '', 2) + '</label><label class="dq"><span class="dqq">Dacă alegi Exitul 3, 4 sau 5, ce faci cu timpul și cu banii?</span>' + vTxt('dupaExit', '', 2) + '</label></div>';
    },
    bind: function (p) { bindViata(p); exBind('exitDorit')(p); },
    update: function (p) { out(p, 'x', exitLine(function (i) { return state.exitDorit === i; }, true)); }
  };

  R.anEchipa = still(an1Eye(1) + '<h1 class="q">Echipa ta are propriul an: 12 săptămâni</h1><table class="qt"><thead><tr><th></th><th>Anul antreprenorial</th><th>Anul echipei</th></tr></thead><tbody><tr><th>Durata</th><td>3 ani = 12 trimestre</td><td>12 săptămâni = 1 trimestru</td></tr><tr><th>O „lună”</th><td>Un trimestru</td><td>O săptămână</td></tr><tr><th>Ce urmărește</th><td>Direcția și cifrele firmei</td><td>Inițiativele trimestrului</td></tr></tbody></table><p class="lead-to">Săptămâna a 13-a este pentru bilanț și planificare.</p>');

  /* Actul: un One Pager A4 portret, cu T.E.R.M.S. în centru, și anexa lui */
  function opVal(v) { return v != null && String(v).trim() ? esc(String(v).trim()) : '<span class="opb"></span>'; }
  function contractHtml(c) {
    var t = TS(), pi = pathInfo(c), w = pi.w, ok = w && w.status !== 'imposibil', tt = tinta4(c), d = destCalc(), r = state.rol || { fraza: '', c: [] }, rows = contractRows(c);
    var a = state.stAzi, tg = stTarget(c), ex = state.exitDorit, today = new Date(), dt = today.getDate() + ' ' + LUNI_L[today.getMonth()] + ' ' + today.getFullYear();
    var acts = t.E.a.filter(function (x) { return (x.n || '').trim(); }).map(function (x) { return x.n + (x.h ? ' (' + nf0.format(x.h) + ' ore/săpt.)' : ''); }).join(', ');
    var cer = (r.c || []).filter(function (x) { return (x || '').trim(); }).join('; ');
    var hz = !t.S.y1 ? '' : t.S.y1 !== 'Da' ? 'mai puțin de un an' : !t.S.y2 ? '' : t.S.y2 !== 'Da' ? 'un an' : !t.S.y3 ? '' : t.S.y3 !== 'Da' ? 'doi ani' : 'cel puțin trei ani';
    var rA = rows.filter(function (x) { return x.div > 0; })[0] || rows[rows.length - 1] || {};
    function tr(L, n, list) { return '<div class="tr"><div class="l">' + L + '</div><div class="tn"><h3>' + n + '</h3></div><div class="c">' + list.map(function (x) { return '<div><span>' + x[0] + '</span><b>' + x[1] + '</b></div>'; }).join('') + '</div></div>'; }
    function kv(list) { return '<table class="kv">' + list.map(function (x) { return '<tr><td>' + x[0] + '</td><td>' + x[1] + '</td></tr>'; }).join('') + '</table>'; }
    var who = '<div class="who"><span>Antreprenor</span><b>' + opVal(state.ctNume) + '</b><span>Firma</span><b>' + opVal(state.ctFirma) + '</b><span>Locul și data</span><b>' + (state.ctLoc && state.ctLoc.trim() ? esc(state.ctLoc.trim()) + ', ' : '') + dt + '</b></div>';
    var p1 = '<section class="oppage"><header class="hd"><div><div class="kick">Noul Act Constitutiv</div><h1>Firma mea, în termenii mei</h1></div>' + who + '</header>' +
      '<div class="oprolebox"><div class="sec">Rolul firmei în viața mea</div><p class="oprole">' + opVal(r.fraza) + '</p></div>' +
      '<div class="nums"><div><div class="k">Freedom number</div><div class="b">' + (c.FN.ok ? shortEur(c.FN.fn) : '-') + '</div><div class="s">la ' + ani(c.R) + '</div></div>' +
      '<div><div class="k">Calea aleasă</div><div class="b bs">' + pi.nm + '</div></div>' +
      '<div><div class="k">Cifra de afaceri, țintă</div><div class="b">' + (tt ? shortEur(tt.ca) : '-') + '</div><div class="s">' + (tt ? 'în anul ' + tt.y : '') + '</div></div>' +
      '<div><div class="k">Cifra de afaceri, final</div><div class="b">' + (ok ? shortEur(w.CA) : '-') + '</div><div class="s">la ' + ani(c.R) + '</div></div></div>' +
      '<div class="terms"><div class="th"><b>T.E.R.M.S.</b><span>Se verifică la fiecare trimestru</span></div>' +
      tr('T', 'Timp', [['Ore pe săptămână', nf0.format(t.T.now || 0) + ' → ' + nf0.format(t.T.end || 0)], ['Nu se negociază', opVal(t.T.neg)]]) +
      tr('E', 'Energie', [['Abia aștept lunea', nf0.format(t.E.azi || 0) + ' → ' + nf0.format(t.E.tinta || 0) + ' din 10'], ['Opresc', opVal(t.E.opresc)]]) +
      tr('R', 'Resurse', [['Oameni, cel mult', t.R.echipa ? nf0.format(t.R.echipa) : opVal('')], ['Rămâne în firmă', nf0.format(state.reinvest) + '% din profit']]) +
      tr('M', 'Mijloace financiare', [['Dividend net, primul an', rA.div != null ? eur(rA.div) : '-'], ['Profit în anul țintă', eur(d.PT)]]) +
      tr('S', 'Sănătate', [['Dau tot', opVal(hz)], ['Sunt dispus să', opVal(t.S.dispus)]]) + '</div>' +
      '<div class="init"><div class="sec">Primele 12 săptămâni</div><ol>' + [0, 1, 2].map(function (i) { return '<li>' + opVal((state.initiative || [])[i]) + '</li>'; }).join('') + '</ol></div>' +
      '<footer class="ft"><p>Document personal de angajament, fără valoare juridică. Nu modifică actul constitutiv al societății.</p><div class="sig"><i></i>Antreprenorul</div><div class="sig"><i></i>Pentru firmă</div></footer></section>';
    var crize = ''; if (a != null && tg != null && tg > a) CRIZE.slice(a, tg).forEach(function (k, j) { crize += '<tr><td>' + k.n + '</td><td>' + opVal((state.stPlan || [])[a + j]) + '</td></tr>'; });
    var p2 = '<section class="oppage"><header class="hd"><div><div class="kick">Anexă · Noul Act Constitutiv</div><h1>Cifrele și clauzele</h1></div>' + who + '</header>' +
      '<div class="two"><div><div class="sec">Obiectul</div>' + kv([['Calea', pi.nm], ['Cerințe către firmă', opVal(cer)], ['Următorul exit', ex != null ? 'Exit ' + (ex + 1) + ': ' + EXITS[ex].t : '-'], ['Ritmul ales', state.ritmAles != null ? RITMS[state.ritmAles].n : '-'], ['An de setup', state.setup ? 'da' : 'nu']]) + '</div>' +
      '<div><div class="sec">Banii mei</div>' + kv([['Nivel de trai: azi → dorit', eur(c.L1) + ' → ' + eur(c.L1b) + ' / lună'], ['Alte surse', eur(c.altNow) + ' / an'], ['Plăți unice', eur(c.OO1 + c.OO2)], ['Fonduri de urgență', eur(c.F1)], ['Multiplul: azi → vânzare', nf2.format(c.M0) + ' → ' + nf2.format(c.MT)]]) + '</div></div>' +
      '<div><div class="sec">Mijloacele financiare, an cu an</div><table class="stage"><tr><th>Anul</th><th>Nivel de trai</th><th>Plăți unice</th><th>Fonduri</th><th>Alte surse</th><th>Dividend net</th><th>Cifra de afaceri</th><th>Profit</th></tr>' + rows.map(function (x) { return '<tr><td>' + x.an + '</td><td>' + eur(x.life) + '</td><td>' + eur(x.oo) + '</td><td>' + eur(x.fond) + '</td><td>' + eur(x.alt) + '</td><td><b>' + eur(x.div) + '</b></td><td><b>' + eur(x.ca) + '</b></td><td>' + eur(x.pr) + '</td></tr>'; }).join('') + '</table></div>' +
      '<div><div class="sec">Stadiul firmei</div><table class="stage st7"><tr><th>Stadiu</th><th>Arhetip</th><th>Cifra de afaceri, reper</th><th>Criza de depășit</th></tr>' + STADII.map(function (x, i) { return '<tr' + (i === a ? ' class="now"' : i === tg ? ' class="to"' : '') + '><td>' + x.a + (i === a ? ' <span class="tag">azi</span>' : i === tg ? ' <span class="tag">țintă</span>' : '') + '</td><td>' + x.n + '</td><td>' + x.p + '</td><td>' + x.c + '</td></tr>'; }).join('') + '</table>' + (crize ? '<table class="kv" style="margin-top:2mm">' + crize + '</table>' : '') + '</div>' +
      '<div><div class="sec">Următorul meu exit</div><div class="exits">' + EXITS.map(function (x, i) { return '<div class="ex' + (ex === i ? ' on' : '') + '"><i style="background:' + x.col + '"></i><b>Exit ' + (i + 1) + '</b>' + x.d + '</div>'; }).join('') + '</div></div>' +
      '<div class="two plan"><div><div class="sec">Clauzele complete</div><dl><dt>Zile pe săptămână</dt><dd>' + nf0.format(t.T.zile || 0) + '</dd><dt>Concediu</dt><dd>' + nf0.format(t.T.conc || 0) + ' săptămâni, fără lucru</dd><dt>Ies din fișa mea</dt><dd>' + opVal(acts) + '</dd><dt>Păstrez în fișă</dt><dd>' + opVal(t.E.keep) + '</dd></dl></div>' +
      '<div><div class="sec">&nbsp;</div><dl><dt>Nu mai tolerez</dt><dd>' + opVal(t.E.no) + '</dd><dt>Unde lucrez</dt><dd>' + opVal(t.R.loc) + '</dd><dt>Unde trăiesc</dt><dd>' + opVal(t.R.oras) + '</dd><dt>Constrângeri</dt><dd>' + opVal(t.R.constr) + '</dd></dl></div></div>' +
      '<div class="grow"></div><footer class="ft one"><p>Actul se verifică la fiecare trimestru, în săptămâna a 13-a, și se renegociază la fiecare schimbare de stadiu a firmei. O cifră atinsă prin încălcarea termenilor T, E, R și S nu înseamnă un Act respectat. Sumele sunt nete, în euro, în banii de azi.</p></footer></section>';
    return p1 + p2;
  }

  /* ---------- montare în aplicația de sală ---------- */
  function goId(id) { if (opts.navigate) opts.navigate(id); }
  /* o pagină apare doar după ce pașii ei au fost completați */
  var PASI = {
    cale: [function () { return state.alegere != null; }, 'urma', 'Alege ce vrei să rămână după tine'],
    timp: [function () { return state.speranta > 0 && state.retragere > 0 && state.aniRamasi > 0; }, 'qSperanta', 'Completează anii'],
    trai: [function () { return C.L1in > 0 && C.L2 > 0; }, 'buget1', 'Completează nivelul de trai'],
    fond: [function () { return state.urgLuni > 0; }, 'fonduri', 'Completează fondurile de urgență'],
    rand: [function () { return state.alegere === 3 || state.randament > 0; }, 'freedom2', 'Completează randamentul'],
    firma: [function () { return state.ca > 0 && state.profitNet > 0 && state.ebitda > 0 && state.cota > 0; }, 'firma', 'Completează datele firmei'],
    termen: [function () { return state.nivelPlan > 0; }, 'buget', 'Alege termenul'],
    curba: [function () { return state.vzSprinturi > 0 && state.vzRitm > 0; }, 'curba', 'Completează curba firmei']
  };
  var T0 = ['timp'], T1 = ['timp', 'trai'], T2 = ['cale', 'timp', 'trai', 'fond'], T3 = T2.concat('firma'), T4 = T3.concat('termen'), T5 = T4.concat('rand', 'curba');
  var CERE = { timp: T0, oneoff: T0, fonduri: T1, freedom: T2, freedom2: T2, productivi3: T3, buget: T3, productivi: T4, productivi2: T4, ritm1: T4, ritm2: T4, ritm3: T4, munte: T4, anEnt: T4, curba: T4, drum: T5, cai: ['cale'], multiplu: T3, multipluDate: T3, multipluNote: T3, multipluCalc: T5, cale: T5, parghii: T5, firmaCale: T5, concluzii: T5, stadii: T3, exitNext: T3, anEchipa: T5, dest: T5, plan: T5, tE: T5, tM: T5, contract: T5 };
  function lipsa(id) { var a = CERE[id] || []; for (var i = 0; i < a.length; i++) { var x = PASI[a[i]]; if (!x[0]()) return x; } return null; }
  var blocat = false;
  function rerender() {
    if (!container || !pageId) return;
    syncPct(); C = calc(state);
    var r = R[pageId], gol = lipsa(pageId);
    container.innerHTML = '';
    if (!r) return;
    if (gol) { cur = h('<div class="eyebrow">Mai întâi</div><h1 class="q">' + gol[2] + '</h1><p class="note">Cifrele de aici se construiesc din pasul acesta.</p><div class="eqrow"><button type="button" class="det-btn" data-go="' + gol[1] + '">Mergi la pas</button></div>'); blocat = true; container.appendChild(cur); return; }
    blocat = false;
    cur = h(r.html());
    container.appendChild(cur);
    if (r.bind) r.bind(cur);
    r.update(cur, C);
  }
  function changed() {
    if (!cur) return;
    syncPct(); C = calc(state); save();
    if (blocat) return;
    R[pageId].update(cur, C);
    cur.querySelectorAll('input[data-k]').forEach(function (inp) { if (document.activeElement !== inp) inp.value = fmtK(inp.getAttribute('data-k')); });
  }
  function bindContainer(el) {
    el.addEventListener('click', function (e) {
      if (!cur || el !== container) return;
      var b = e.target.closest('button[data-k][data-d]');
      if (b) { var k = b.getAttribute('data-k'); setK(k, (+state[k] || 0) + LIM[k][0] * +b.getAttribute('data-d')); changed(); return; }
      var g = e.target.closest('[data-go]');
      if (g) goId(g.getAttribute('data-go'));
    });
    el.addEventListener('change', function (e) {
      if (!cur || el !== container) return;
      var t = e.target, k = t.getAttribute('data-k');
      if (k) { if (t.value.trim() === '' && k in GOL) state[k] = 0; else setK(k, parseRo(t.value)); t.value = fmtK(k); changed(); return; }
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
  /* Contextul zilei: tot ce s-a construit, pe capitole; se generează pe dispozitiv */
  function contextHtml(c) {
    var v = state.viata || {}, d = state.deCe || {}, t = TS(), r = state.rol || { fraza: '', c: [] }, priv = state.ctxPriv !== false, pi = pathInfo(c), w = state.alegere ? pi.w : null, tt = tinta4(c);
    var val = function (x) { return x != null && String(x).trim() ? esc(String(x).trim()) : ''; };
    function rows(l) { return l.filter(function (x) { return x[1] != null && x[1] !== ''; }).map(function (x) { return '<div class="cxrow"><span>' + x[0] + '</span><b>' + x[1] + '</b></div>'; }).join(''); }
    function cap(n, tit, sub, body) { return body ? '<section class="cxcap"><h2><i>' + n + '</i>' + tit + '</h2>' + (sub ? '<p class="cxsub">' + sub + '</p>' : '') + body + '</section>' : ''; }
    function tab(head, lines) { return '<table class="cxt"><thead><tr>' + head.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' + lines.map(function (l) { return '<tr>' + l.map(function (x) { return '<td>' + x + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>'; }
    var cer = (r.c || []).map(val).filter(Boolean).join('; '), top = sondComplet() ? sondTop().map(function (m) { return m.n; }).join(', ') : '';
    var f = c.E0 > 0, oo = state.oneoff.filter(function (o) { return +o.suma > 0; }).sort(function (a, b) { return a.varsta - b.varsta; });
    var ex = state.exitDorit, fac = (state.exitFacute || []).map(function (i) { return 'Exit ' + (i + 1); }).join(', '), a = state.stAzi, tg = stTarget(c);
    var o = '<header class="cxhd"><div class="kick">Întâlnirea de kick-off · Turnul de Control</div><h1>Contextul zilei</h1><p>' + [val(state.ctNume), val(state.ctFirma)].filter(Boolean).join(' · ') + '</p></header>';
    o += cap(1, 'Ce vreau', 'Viața dorită și rolul firmei.', rows((priv ? [['O zi obișnuită', val(v.timp)], ['Unde trăiesc', val(v.loc)], ['Cu cine', val(v.oameni)], ['Ce fac doar pentru că vreau', val(v.activ)], ['Ce caut prin succes', top]] : []).concat([['Rolul firmei', val(r.fraza)], ['Cerințe către firmă', cer], ['Ce vreau să rămână după mine', state.alegere ? pi.nm : '']])));
    o += cap(2, 'Timpul', '', c.n2 > 0 && state.retragere ? rows([['Vârsta de azi', ani(c.varsta)], ['Retragerea', 'la ' + ani(c.R)], ['Ani productivi', ani(c.n1)], ['Ani de capitol următor', ani(c.n2)]]) : '');
    o += cap(3, 'Nivelul de trai', 'Baza calculelor: cheltuielile declarate.', c.L1in > 0 ? rows([['Nivelul actual', eur(c.L1in) + ' / lună'], ['Nivelul dorit', eur(c.L1b) + ' / lună'], ['Plăți unice, anii productivi', eur(c.OO1)], ['Plăți unice, capitolul următor', eur(c.OO2)], ['Fonduri de urgență', eur(c.F1)]]) + (oo.length ? tab(['Plata', 'La vârsta', 'Suma', 'Obligatorie'], oo.map(function (x) { return [esc(x.nume), x.varsta || '-', eur(+x.suma), x.oblig ? 'da' : 'nu']; })) : '') : '');
    o += cap(4, 'Freedom number', 'Calculat pentru calea aleasă.', c.L1in > 0 && state.alegere ? (state.alegere === 3 ? rows([['Dividend net necesar', eur(c.L2 * 12) + ' / an']]) : rows([['Fără randament', eur(c.FNsimple)], ['Cu randament', c.FN.ok ? eur(c.FN.fn) : ''], ['Randament anual', nf2.format(state.randament) + '%'], ['Inflație', nf2.format(state.inflatie) + '%'], ['Randament real net', nf2.format(c.rr * 100) + '%'], ['Suma lăsată în urmă', c.minim ? eur(state.legacy) : '']])) : '');
    o += cap(5, 'Ce am azi', 'Vehiculul și banii disponibili.', f ? rows([['Cifra de afaceri', eur(state.ca)], ['Profit net', eur(c.pn0)], ['EBITDA', eur(c.E0)], ['Dividendul pe care îl poate plăti firma', eur(c.div0.net) + ' / an'], ['Alte surse', eur(c.altNow) + ' / an'], ['Economii', eur(c.eco)], ['Nivel blocat până la termen', eur(c.lifeNow) + ' / an'], ['Din avere, în firmă', state.avere && state.avere.pct != null && priv ? nf0.format(state.avere.pct) + '%' : '']]) : '');
    o += cap(6, 'Ce lipsește', 'Termenul și creșterea minimă.', f && state.nivelPlan ? rows([['Termenul pentru nivelul dorit', ani(c.YT)], ['Cifra de afaceri minimă', c.prov.ok ? eur(c.prov.peak) : ''], ['Ritmul minim', gfmt(c.g1) + ' pe an']]) : '');
    o += cap(7, 'Exitul', '', rows([['Ce înseamnă exit', priv ? val(v.exitFraza) : ''], ['Exituri făcute', fac], ['Următorul exit', ex != null ? 'Exit ' + (ex + 1) + ': ' + EXITS[ex].t : ''], ['Rolul meu peste trei ani', priv ? val(v.rolAn3) : ''], ['După exit', priv ? val(v.dupaExit) : '']]));
    o += cap(8, 'Ritmul', 'Ce pot ține și de ce.', rows((priv ? [['Ce a dus firma până aici', val(d.a)], ['Ce e fragil', val(d.b)], ['Primul blocaj', val(d.c)], ['De ce acest ritm', (d.w || []).map(val).filter(Boolean).join(' → ')]] : []).concat([['Ritmul ales', state.ritmAles != null ? RITMS[state.ritmAles].n : ''], ['Sprinturi', state.vzSprinturi ? state.vzSprinturi + ' · ' + nf2.format(state.vzRitm) + '% pe an, apoi ' + nf2.format(state.vzRitm2) + '%' : ''], ['An de setup', state.setup ? 'da, ' + nf2.format(state.vzRitm0) + '%' : '']])) + (f && state.vzSprinturi ? tab(['Anul', 'Vârsta', 'Cifra de afaceri', 'EBITDA'], c.curba.map(function (x) { return [x.i, x.age, eur(x.CA), eur(x.eb)]; })) : ''));
    if (w) {
      var un = state.alegere === 3 ? ' / an' : '';
      o += cap(9, 'Calea mea: ' + pi.nm, '', rows([['Cifra de afaceri la ' + ani(c.R), eur(w.CA)], ['EBITDA la ' + ani(c.R), eur(w.ER)], ['Capital strâns', eur(w.sim.capRet)], ['Net din vânzare', w.saleNet ? eur(w.saleNet) : ''], ['Multiplul la vânzare', w.M ? nf2.format(w.M) + '×' : ''], ['Dividendul din board', w.d1 ? eur(w.d1.net) + ' / an' : ''], ['Ținta', state.alegere === 3 ? eur(w.nevoie) + ' / an' : (c.FN.ok ? eur(c.FN.fn) : '')], [w.gap > 0.5 ? 'Lipsesc' : 'Peste țintă', eur(Math.abs(w.gap)) + un], ['Pârghii alese', w.gap > 0.5 ? [state.pgMarja ? 'marjă +' + state.pgMarja + ' p.p.' : '', state.pgVarsta ? 'retragere +' + ani(state.pgVarsta) : '', state.pgNivel ? 'nivel dorit −' + state.pgNivel + '%' : '', state.pgMultiplu ? 'multiplu +' + state.pgMultiplu + '×' : ''].filter(Boolean).join(', ') : ''], ['Ce fel de firmă', (FIRME.filter(function (x) { return x[0] === state.alegere; })[0] || [])[1]]]));
    }
    o += cap(10, 'Stadiile firmei', '', a != null ? rows([['Azi', STADII[a].a + ' · ' + STADII[a].n], ['Ținta', tg != null ? STADII[tg].a + ' · ' + STADII[tg].n : '']].concat(tg != null && tg > a ? CRIZE.slice(a, tg).map(function (k, j) { return [k.n, val((state.stPlan || [])[a + j])]; }) : [])) : '');
    o += cap(11, 'Primul an', 'Cele 12 trimestre și primele 12 săptămâni.', rows([['Ținta la ' + (tt ? 'anul ' + tt.y : '3 ani'), tt ? eur(tt.ca) : ''], ['Inițiativa 1', val((state.initiative || [])[0])], ['Inițiativa 2', val((state.initiative || [])[1])], ['Inițiativa 3', val((state.initiative || [])[2])]]));
    var acts = t.E.a.map(function (x) { return val(x.n); }).filter(Boolean).join(', ');
    o += cap(12, 'T.E.R.M.S.', 'Termenii mei.', rows([['T · Ore pe săptămână', t.T.now || t.T.end ? nf0.format(t.T.now) + ' → ' + nf0.format(t.T.end) : ''], ['T · Nu se negociază', val(t.T.neg)], ['E · Abia aștept lunea', t.E.azi || t.E.tinta ? nf0.format(t.E.azi) + ' → ' + nf0.format(t.E.tinta) + ' din 10' : ''], ['E · Ies din fișa mea', acts], ['E · Păstrez', val(t.E.keep)], ['E · Nu mai tolerez', val(t.E.no)], ['E · Opresc', val(t.E.opresc)], ['R · Oameni, cel mult', t.R.echipa ? nf0.format(t.R.echipa) : ''], ['R · Unde lucrez', val(t.R.loc)], ['R · Unde trăiesc', val(t.R.oras)], ['R · Constrângeri', val(t.R.constr)], ['S · Sunt dispus să', val(t.S.dispus)]].concat(priv ? [['T · Ce am ratat', val(t.T.hk)], ['E · Reflecție', val(t.E.hk)], ['R · Reflecție', val(t.R.hk)], ['M · Reflecție', val(t.M.hk)], ['S · Reflecție', val(t.S.hk)]] : [])));
    return o + '<footer class="cxft">Sumele sunt în euro, în banii de azi. Document personal, generat pe dispozitivul tău. Nu ține loc de plan financiar sau de consultanță fiscală.</footer>';
  }
  R.contextZi = {
    html: function () {
      return '<div class="eyebrow">Rezumatul zilei</div><h1 class="q">Contextul zilei</h1><p class="note">Tot ce ai construit azi, pe capitole. Se generează pe dispozitivul tău.</p>' +
        '<div class="eqrow noprint"><label class="ckx"><input type="checkbox" id="cxPriv"> Include răspunsurile personale</label><button type="button" class="det-btn" id="cxPdf">Descarcă PDF</button><button type="button" class="chip" id="cxPrint">Printează</button><button type="button" class="chip" id="cxCopy">Copiază textul</button><span class="small" data-o="cxmsg" style="color:var(--muted)"></span></div>' +
        '<div data-o="pdfv"></div><div class="cxwrap"><div class="cxdoc" id="cxDoc" data-o="cx"></div></div>';
    },
    bind: function (p) {
      var ck = p.querySelector('#cxPriv'); ck.checked = state.ctxPriv !== false;
      ck.addEventListener('change', function () { state.ctxPriv = ck.checked; changed(); });
      p.querySelector('#cxPrint').addEventListener('click', function () { printDoc(p.querySelector('#cxDoc'), '12mm', p, 'cxmsg'); });
      p.querySelector('#cxCopy').addEventListener('click', function () { var t = p.querySelector('#cxDoc').innerText; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { out(p, 'cxmsg', 'Textul e copiat.'); }, function () { out(p, 'cxmsg', 'Nu am putut copia aici.'); }); });
      p.querySelector('#cxPdf').addEventListener('click', function () {
        out(p, 'cxmsg', 'Pregătesc PDF-ul…');
        cxPdf(p.querySelector('#cxDoc'), p).catch(function () { out(p, 'cxmsg', 'Nu am putut genera PDF-ul aici. Folosește „Printează” și alege „Salvează ca PDF”.'); });
      });
    },
    update: function (p, c) { destInit(c); out(p, 'cx', contextHtml(c)); }
  };
  /* documentul lung se taie între rânduri, nu prin ele */
  function cxPdf(el, p) {
    var sc = 2, mm = 12, fn = 'Contextul zilei' + (state.ctFirma ? ' - ' + state.ctFirma : '') + '.pdf';
    return pdfLib().then(function () { return pdfDesen(el, sc); }).then(function (cv) {
      var pdf = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' }), lat = 210 - 2 * mm, H = cv.width * (297 - 2 * mm) / lat;
      var top = el.getBoundingClientRect().top, ends = [].slice.call(el.querySelectorAll('.cxhd, .cxsub, .cxrow, tr, .cxft')).map(function (x) { return (x.getBoundingClientRect().bottom - top) * sc; }).sort(function (a, b) { return a - b; });
      var y = 0, first = true;
      while (y < cv.height - 2) {
        var lim = y + H, end = cv.height;
        if (lim < cv.height) { end = lim; for (var i = ends.length - 1; i >= 0; i--) if (ends[i] <= lim && ends[i] > y) { end = ends[i]; break; } }
        var c2 = document.createElement('canvas'); c2.width = cv.width; c2.height = Math.ceil(end - y);
        var g = c2.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c2.width, c2.height); g.drawImage(cv, 0, -y);
        if (!first) pdf.addPage(); first = false;
        pdf.addImage(c2.toDataURL('image/jpeg', 0.94), 'JPEG', mm, mm, lat, c2.height * lat / c2.width); y = end;
      }
      pdfSalveaza(pdf, fn, p, 'cxmsg');
    });
  }
  function renderContract(s) {
    var pS = state, pC = C, pSave = onSave;
    state = s; onSave = null;
    try { C = calc(s); return contractHtml(C); } finally { state = pS; C = pC; onSave = pSave; }
  }
  /** Răspunsurile personale rămân pe dispozitiv: nu pleacă spre server și nu intră în Act. */
  var PRIV_TOP = ['deCe', 'viata', 'avere'], PRIV_TERMS = ['T', 'E', 'R', 'M', 'S'];
  function splitPrivate(s) {
    var pub = JSON.parse(JSON.stringify(s)), priv = { terms: {} };
    PRIV_TOP.forEach(function (k) { if (pub[k] !== undefined) { priv[k] = pub[k]; delete pub[k]; } });
    var t = pub.terms;
    if (t) {
      if (t.hook !== undefined) { priv.hook = t.hook; delete t.hook; }
      PRIV_TERMS.forEach(function (L) { if (t[L] && t[L].hk !== undefined) { priv.terms[L] = t[L].hk; delete t[L].hk; } });
    }
    return { pub: pub, priv: priv };
  }
  function mergePrivate(s, priv) {
    if (!priv) return s;
    PRIV_TOP.forEach(function (k) { if (priv[k] !== undefined) s[k] = priv[k]; });
    if (s.terms) {
      if (priv.hook !== undefined) s.terms.hook = priv.hook;
      PRIV_TERMS.forEach(function (L) { if (s.terms[L] && priv.terms && priv.terms[L] !== undefined) s.terms[L].hk = priv.terms[L]; });
    }
    return s;
  }
  /** Amprenta cifrelor (fără ce e doar afișare: categorii deschise, tab-uri). Spune dacă s-a schimbat ceva de la ultima semnare. */
  function fingerprint(s) {
    var c = splitPrivate(s).pub;
    ['step', 'dInit', 'mTab', 'ooOpen', 'catsV2', 'ecoV2', 'notesV2', 'notesV3', 'manualV1'].forEach(function (k) { delete c[k]; });
    if (c.cats) c.cats.forEach(function (g) { delete g.open; });
    return JSON.stringify(c);
  }
  /** Cifrele-cheie ale unui participant, pentru panoul „Sala”. */
  function summary(s) {
    var c = calc(s), pk = s.alegere, w = pk ? [c.w1, c.w2, c.w3][pk - 1] : c.w1;
    var ok = w && w.status !== 'imposibil';
    return { varsta: c.varsta, R: c.R, E: c.E, ca: s.ca, marja: c.marja, divNet: c.div0.net, FN: c.FN.ok ? c.FN.fn : NaN, cale: pk, caR: ok ? w.CA : NaN, g: ok ? w.g : NaN, g1: c.g1, X: ok ? w.X : NaN, ritmAles: s.ritmAles, metoda: s.valMetoda || 'ebitda', M0: c.M0, MT: c.MT };
  }

  /** Tabelul de control: toate cifrele, cu formula aplicată pe valori, pagina de unde vin și verificările dintre pagini. */
  function control(s) {
    var c = calc(s), secs = [], cur0 = null, chk = [], d = c.div0, pl = c.plan, F = c.FN, v = c.prov, P2 = function (x) { return isNaN(x) ? '-' : nf2.format(x * 100) + '%'; };
    function sec(t) { cur0 = { t: t, rows: [] }; secs.push(cur0); }
    function r(n, val, how, pg, w) { cur0.rows.push({ n: n, v: val, f: how || '', p: pg || '', w: !!w }); }
    var ven = s.venituri || [], divDecl = 0; ven.forEach(function (x) { if (x.firma) divDecl += venAt(x.v, 0); });
    var altSure = c.altNow, oblT = 0; s.oneoff.forEach(function (o) { var a = Math.round(o.varsta); if (o.oblig && a >= c.varsta && a < c.R) oblT += +o.suma || 0; });
    sec('1. Timpul');
    r('Vârsta de azi', ani(c.varsta), c.R + ' − ' + c.n1, '17-22'); r('Anii productivi', ani(c.n1), 'de la ' + c.varsta + ' la ' + c.R, '17-22'); r('Capitolul următor', ani(c.n2), 'de la ' + c.R + ' la ' + c.E, '17-22');
    sec('2. Veniturile declarate, anul curent');
    ven.forEach(function (x) { var y = venAt(x.v, 0); if (y) r(x.n, eur(y), x.firma ? 'estimare, firma principală' : 'estimare', '35'); });
    r('Total venituri nete', eur(c.venDecl), 'suma rândurilor', '35'); r('Din care dividende', eur(divDecl), 'declarat', '35'); r('Din care alte surse', eur(altSure), 'rândurile fără dividende', '35');
    sec('3. Nivelul de trai');
    r('Nivelul actual', eur(c.L1) + ' / lună', eur(c.L1) + ' × 12 = ' + eur(c.L1 * 12) + ' pe an', '23-24'); r('Nivelul dorit', eur(c.L2) + ' / lună', eur(c.L2) + ' × 12 = ' + eur(c.L2 * 12) + ' pe an', '23-24');
    sec('4. Plățile unice');
    r('În anii productivi', eur(c.OO1), c.cnt1 + ' plăți', '25'); r('Din care obligatorii', eur(oblT), 'bifate pe pagina 36', '27'); r('În capitolul următor', eur(c.OO2), c.cnt2 + ' plăți', '25');
    sec('5. Fondurile de urgență');
    r('Trai pentru familie', eur(c.urg1), s.urgLuni + ' luni × ' + eur(c.L1), '26'); r('Relocare', eur(s.reloc1), 'introdus', '26'); r('Intervenții medicale', eur(s.sanatate1), 'introdus', '26'); r('Total în anii productivi', eur(c.F1), 'suma celor trei', '26'); r('Total în capitolul următor', eur(c.F2), s.urgLuni + ' × ' + eur(c.L2) + ' + ' + eur(s.reloc2) + ' + ' + eur(s.sanatate2), '26');
    sec('6. Termenul și blocarea nivelului de trai');
    r('Termenul', ani(c.YT), 'ales pe pagina 36', '27'); r('Dividend posibil + alte surse', eur(c.capAn), eur(d.net) + ' + ' + eur(altSure), '37'); r('Nivel blocat până la termen', eur(c.lifeNow), 'cel mai mic dintre cheltuielile actuale și suma de mai sus', '37');
    sec('7. Freedom number');
    r('Randamentul net', P2(c.ecoRand), nf2.format(s.randament) + '% × (1 − ' + nf2.format(s.taxRand) + '%)', '29'); r('Randamentul real net', P2(c.rr), '(1 + ' + P2(c.ecoRand) + ') / (1 + ' + nf2.format(s.inflatie) + '%) − 1', '29');
    r('Fără randament', eur(c.FNsimple), 'trai ' + ani(c.n2) + ' + plăți unice + fonduri' + (c.minim ? ' + suma lăsată' : ''), '28');
    if (F.ok) {
      r('Nivelul de trai, cu randament', eur(F.life), 'cheltuieli la început de an', '29'); r('Plățile unice, cu randament', eur(F.oo), '', '29'); r('Fondurile', eur(F.fonduri), 'întregi', '29'); r('Randamentul fondurilor', '−' + eur(F.fondPv), eur(F.fondRand) + ' pe an, adus la azi', '29');
      if (F.legacy) r('Suma lăsată în urmă', eur(F.legacy), eur(s.legacy) + ' adus la azi', '18'); if (F.term) r('Capitalul lăsat întreg', eur(F.term), 'adus la azi', '18');
      r('FREEDOM NUMBER', eur(F.total), 'suma rândurilor', '29');
    }
    r('Portofoliul de azi', eur(c.eco), s.economii != null ? 'introdus manual' : 'sugerat: ' + eur(c.ecoVen) + ' / ' + P2(c.ecoRand), '29');
    sec('8. Ce poate plăti firma');
    r('Cifra de afaceri', eur(s.ca), 'introdus', '34'); r('Marja de profit net', isNaN(c.marja) ? '-' : P2(c.marja), 'introdus', '34'); r('Profit net', eur(d.pn), eur(s.ca) + ' × ' + P2(c.marja), '34'); r('EBITDA', eur(c.E0), eur(d.pn) + ' × ' + nf2.format(c.kE), '34');
    r('Rămâne în firmă', nf2.format(s.reinvest) + '%', 'setare', '34'); r('Dividend brut posibil', eur(d.brut), eur(d.pn) + ' × (1 − ' + nf2.format(s.reinvest) + '%) × cota ' + nf2.format(s.cota) + '%', '34'); r('Impozit pe dividende', '−' + eur(d.tax), eur(d.brut) + ' × ' + nf2.format(s.taxDiv) + '%', '34'); r('CASS', '−' + eur(d.cass), 'plafon din cursul ' + nf2.format(s.curs), '34'); r('Dividend net posibil', eur(d.net), 'brut − impozit − CASS', '34');
    sec('9. Legăturile dintre pagini');
    var gap = d.net - divDecl, brutD = divDecl > 0 ? (divDecl + d.cass) / (1 - s.taxDiv / 100) : 0, ramas = d.pn > 0 && brutD > 0 ? 1 - brutD / d.pn : NaN, needA = c.L1 * 12 - altSure, needD = c.L2 * 12 - altSure, y1 = v.ok && v.years[pl.T], needT = y1 ? y1.div : 0;
    r('Dividend declarat față de cel posibil', eur(Math.abs(gap)), eur(divDecl) + ' declarat, ' + eur(d.net) + ' posibil', '21 și 34', Math.abs(gap) > 1000);
    if (!isNaN(ramas)) r('Rămâne în firmă, după ce ai declarat', P2(ramas), '1 − ' + eur(brutD) + ' brut / ' + eur(d.pn) + ' profit; setarea e ' + nf2.format(s.reinvest) + '%', '21 și 34', Math.abs(ramas * 100 - s.reinvest) > 2);
    r('Dividend necesar, nivel actual', eur(needA), eur(c.L1 * 12) + ' − ' + eur(altSure) + ' alte surse', '23 și 21'); r('Dividend necesar, nivel dorit', eur(needD), eur(c.L2 * 12) + ' − ' + eur(altSure) + ' alte surse', '23 și 21', needD > d.net); r('Dividend necesar, cu plăți unice și fonduri', eur(needT), 'din anul ' + pl.T + ': nivel dorit + ' + eur(y1 ? y1.prov + y1.fond : 0) + ' puse deoparte − alte surse', '37', needT > d.net);
    sec('10. Intervalul, până în anul ' + pl.T);
    r('Surplus strâns', eur(pl.S), 'venituri peste nivelul actual, anii 0-' + (pl.T - 1) + ', din dividendul posibil și alte surse', '37'); r('Plăți unice din interval', eur(pl.ooI), 'anii 0-' + pl.T, '37'); r('Acoperite din surplus', eur(pl.cover), '', '37'); r('Fonduri încărcate din surplus', eur(pl.Fin), 'ce rămâne', '38'); r('Neacoperit', eur(pl.X), eur(pl.ooI) + ' − ' + eur(pl.cover), '37', pl.X > 0.5); r('Împrumut, plăți obligatorii', eur(pl.Xm), 'fără dobândă', '38'); r('Neobligatorii amânate', eur(pl.Xo), '', '38');
    sec('11. Creșterea minimă');
    if (v.ok) { r('Pus deoparte pe an', eur(v.maxProv), eur(c.OO1 - pl.cover) + ' plăți / ' + ani(pl.m) + ' + ' + eur(pl.Frest) + ' fonduri, în 3-4 ani de la nivelul dorit', '38'); r('Cifra de afaceri minimă', eur(v.peak), 'din dividendul necesar, cu marja și procentul din firmă', '38'); r('Ritmul minim', isNaN(v.g) ? '-' : gfmt(v.g), xfmt(v.X) + ' în ' + ani(v.peakI), '38'); }
    if (divDecl < d.net - 1000) chk.push('Firma poate plăti cu ' + eur(gap) + ' mai mult decât ai estimat pe slide-ul 34. Paginile despre firmă folosesc ce poate plăti firma.');
    if (divDecl > d.net + 1000) chk.push('Dividendul estimat pe slide-ul 34 depășește cu ' + eur(-gap) + ' ce poate plăti firma. Paginile despre firmă folosesc ce poate plăti firma.');
    if (!isNaN(ramas) && Math.abs(ramas * 100 - s.reinvest) > 2) chk.push('Pe pagina firmei rămâne în firmă ' + nf2.format(s.reinvest) + '%, dar dividendul declarat înseamnă ' + P2(ramas) + '.');
    return { secs: secs, chk: chk };
  }

  var fmt = { eur: eur, shortEur: shortEur, pct: pct, ani: ani, gfmt: gfmt, xfmt: xfmt, nf0: nf0, nf2: nf2 };
  var CALE_NUME = ['Las un portofoliu', 'Vând firma', 'Trăiesc din firmă'];
  var RITM_NUME = RITMS.map(function (r) { return r.n; });

export { PAGES, printDoc, fresh, exemplu, normalize, calc, mount, renderContract, fingerprint, splitPrivate, mergePrivate, summary, control, fmt, CALE_NUME, RITM_NUME };
