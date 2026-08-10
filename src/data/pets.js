/* ═══════════════════════════════════════════════════════════════════
   GLI ANIMALI E I LORO BISOGNI

   Un catalogo di amici da adottare — cani, gatti, pappagalli, pesciolini
   e due bestie che in natura non esistono — e quattro barre che si
   svuotano da sole: la pancia, l'allegria, il pulito e la forma. Ogni
   barra cala col passare delle ore — la stessa idea del decadimento nel
   motore di apprendimento — e cala anche a gioco chiuso: così tornare
   domani ha un motivo in più della classifica.

   In casa ce ne stanno **quattro per volta** (`POSTI_CASA`). Chi non è in
   cameretta non sparisce: sta al rifugio, col suo nome e i suoi pasti, e
   si riporta a casa quando si vuole pagando una quota piccola
   (`quotaRientro`). Nessun gesto di questo gioco butta via un animale.

   Ognuno **mangia le sue cose**: la dieta è della specie (`DIETE`) e i
   preferiti sono dell'individuo. Un cane non mangia il sushi e un pesce
   non mangia la carne — e quando gli si offre storce il naso senza che
   la porzione si sprechi. La lezione «ognuno mangia cose diverse» è il
   motivo per cui i cibi sono tanti.

   Nessun animale può ammalarsi, sparire o morire di fame: quando ha
   bisogno di qualcosa lo fa presente e basta. Anche la barra della `forma`
   NON è la salute: a zero vuol dire "un po' fiacco, gli andrebbe una
   carota", non "sta male". Un gioco per bambini non deve punire chi torna
   dopo una settimana, deve solo dargli qualcosa da fare quando torna.

   I numeri stanno tutti qui: costi, quanto rende ogni prodotto e la
   velocità con cui si svuotano le barre si regolano in questo file e da
   nessun'altra parte. `node test/esegui.mjs unita/animali` stampa quanto
   costa al giorno tenere un animale contento: è la misura da guardare
   quando si toccano.
   ═══════════════════════════════════════════════════════════════════ */

const ORA = 3600000

/* Quanti ne stanno in cameretta insieme. Quattro perché quattro sagome
   stanno in fila su un telefono senza diventare francobolli, e perché
   una casa che non può essere piena non fa mai scegliere. */
export const POSTI_CASA = 4

/* Le quattro barre. `oreVuoto` è quanto ci mette a passare da piena a
   vuota, e da sola decide quanto spesso quel bisogno costa monete:
   la pancia è quella che riporta il bambino qui domani, la forma è il
   costo grosso e raro. `inizio` è come arriva un animale appena adottato. */
export const BISOGNI = [
  { k: 'fame',    nome: 'pancia',   emoji: '🍽️', oreVuoto:  7, inizio: 45,
    chiede: 'ha fame!',         mezzo: 'mezza fame',        sazio: 'pancia piena' },
  { k: 'gioco',   nome: 'allegria', emoji: '🎾', oreVuoto: 16, inizio: 60,
    chiede: 'vuole giocare',    mezzo: 'si annoia un po\'', sazio: 'si è divertito' },
  { k: 'pulizia', nome: 'pulito',   emoji: '🫧', oreVuoto: 40, inizio: 70,
    chiede: 'è da spazzolare',  mezzo: 'una passata ci sta', sazio: 'è pulitissimo' },
  { k: 'forma',   nome: 'forma',    emoji: '💪', oreVuoto: 90, inizio: 80,
    chiede: 'è un po\' fiacco', mezzo: 'gli va una carota',  sazio: 'è in gran forma' },
]

export const CHIAVI = BISOGNI.map(b => b.k)
export const bisognoDi = k => BISOGNI.find(b => b.k === k) || null

/* soglie comuni a tutte le barre */
export const SOGLIE = {
  basso:  30,    // sotto questa l'animale lo fa presente
  alto:   75,    // sopra questa è contento
  pieno:  98,    // sopra questa il prodotto non viene consumato: niente sprechi
}

export const PREFERITO = 1.35   // quanto rende di più quello che uno preferisce

/* Quanto vale una barra adesso: il valore dell'ultima volta, meno le ore
   passate da allora. Fuori da Vue apposta, così è verificabile da sola. */
export function livelloDi(a, k, now = Date.now()) {
  const b = bisognoDi(k)
  if (!a || !b) return 0
  const ore = Math.max(0, now - ((a.t && a.t[k]) || 0)) / ORA
  const da = (a.val && a.val[k]) ?? 0
  return Math.max(0, Math.min(100, da - ore * (100 / b.oreVuoto)))
}

/* la pancia è la barra di cui parla mezzo gioco: le lasciamo il suo nome */
export const sazietaDi = (a, now = Date.now()) => livelloDi(a, 'fame', now)

/* come sta una barra, in una parola sola */
export function grado(v) {
  if (v >= SOGLIE.alto) return 'alto'
  if (v < SOGLIE.basso) return 'basso'
  return 'medio'
}

/* Di cosa ha bisogno adesso: la barra più bassa, che è quella che
   l'animale chiede e che decide faccia e frase. */
export function urgenza(a, now = Date.now()) {
  let peggio = null
  for (const b of BISOGNI) {
    const v = livelloDi(a, b.k, now)
    if (!peggio || v < peggio.v) peggio = { k: b.k, v, def: b }
  }
  return { ...peggio, grado: grado(peggio.v) }
}

export const contento = (a, now = Date.now()) => urgenza(a, now).grado === 'alto'

/* Come nasce un animale: tutte le barre al loro valore di partenza, e il
   nome che gli ha dato chi lo adotta. Il nome sta nel PROFILO e non nel
   catalogo, perché è l'unica cosa di un animale che appartiene al
   bambino: il catalogo propone «Watson», ma in quella casa si chiamerà
   come vogliono loro. */
export function nuovoAnimale(ora = Date.now(), nome = '') {
  const a = { adottato: ora, nome: String(nome || ''), val: {}, t: {}, pasti: 0, addosso: {} }
  for (const b of BISOGNI) { a.val[b.k] = b.inizio; a.t[b.k] = ora }
  return a
}

/* Come torna un animale dal rifugio: riposato. Le barre non si
   congelano mentre è via — sarebbero righe di codice per fingere che il
   tempo non passi — semplicemente al rifugio l'hanno tenuto bene, e chi
   se lo riprende non trova quattro barre a zero da riempire subito.
   Nome, pasti serviti e accessori restano suoi. */
export function curato(a, ora = Date.now()) {
  if (!a || typeof a !== 'object') return a
  if (!a.val || typeof a.val !== 'object') a.val = {}
  if (!a.t || typeof a.t !== 'object') a.t = {}
  for (const b of BISOGNI) { a.val[b.k] = b.inizio; a.t[b.k] = ora }
  return a
}

/* Porta un animale alla forma corrente dello stato, qualunque cosa ci
   fosse scritta prima. Un profilo nato quando esisteva solo la fame aveva
   `sat` e `pasto`: quelli diventano la pancia, e le tre barre nuove
   partono dal loro valore iniziale. Chi torna dopo un aggiornamento non
   deve trovarsi tre barre rosse per colpa di una modifica a cui non ha
   partecipato.

   `id` serve solo a dare un nome a chi non ce l'ha: prima dei nomi
   scelti dai bambini il nome stava nel catalogo, e chi aveva Watson deve
   continuare a chiamarlo Watson. */
export function migraAnimale(a, ora = Date.now(), id = '') {
  if (!a || typeof a !== 'object') return a
  if (!a.val || typeof a.val !== 'object') a.val = {}
  if (!a.t || typeof a.t !== 'object') a.t = {}
  if (!a.addosso || typeof a.addosso !== 'object') a.addosso = {}
  if (typeof a.nome !== 'string' || !a.nome.trim()) a.nome = (petDi(id) || {}).nome || ''
  if (a.sat != null && a.val.fame == null) {
    a.val.fame = a.sat
    a.t.fame = a.pasto || a.adottato || ora
  }
  for (const b of BISOGNI) {
    if (a.val[b.k] == null) { a.val[b.k] = b.inizio; a.t[b.k] = ora }
    if (!a.t[b.k]) a.t[b.k] = a.adottato || ora
  }
  delete a.sat
  delete a.pasto
  return a
}

/* ═══════════ CHI SI PUÒ ADOTTARE ═══════════

   Gli animali sono disegnati, non presi dalle emoji: le emoji di gatto
   disponibili sono tre volte lo stesso gatto, e un bobtail non esiste
   proprio. `specie` decide quale sagoma disegna PetSprite.vue, `taglio`
   quale variante di quella sagoma, `verso` che suono fa.

   Il catalogo è ordinato per famiglia e, dentro la famiglia, per prezzo:
   il negozio lo mostra così com'è. Il pesciolino costa poco perché è il
   primo amico possibile anche con pochi spiccioli; il draghetto costa
   quanto una settimana di gioco perché è il traguardo. */
export const FAMIGLIE = [
  { k: 'cani',    titolo: 'Cani',            emoji: '🐶' },
  { k: 'gatti',   titolo: 'Gatti',           emoji: '🐱' },
  { k: 'uccelli', titolo: 'Pappagalli',      emoji: '🦜' },
  { k: 'pesci',   titolo: 'Pesciolini',      emoji: '🐠' },
  { k: 'strani',  titolo: 'Bestie speciali', emoji: '🐲' },
]

export const PETS = [
  /* ---------- cani ---------- */
  {
    id: 'watson', nome: 'Watson', razza: 'bobtail inglese', famiglia: 'cani',
    specie: 'cane', taglio: 'bobtail', verso: 'bau', costo: 40,
    manto: '#93a3b3', pancia: '#f7f4ee', frangia: '#e6e3dc', occhi: '#4a3b2f',
    preferiti: ['🍗', '🎾'],
    descr: 'tutto pelo e niente coda',
  },
  {
    id: 'biscotto', nome: 'Biscotto', razza: 'bassotto', famiglia: 'cani',
    specie: 'cane', taglio: 'orecchione', verso: 'bau', costo: 55,
    manto: '#b9743a', pancia: '#f3d6b0', occhi: '#3b2a1e',
    preferiti: ['🥩', '🦴'],
    descr: 'lungo un metro e alto un palmo',
  },
  {
    id: 'nuvola', nome: 'Nuvola', razza: 'barboncino', famiglia: 'cani',
    specie: 'cane', taglio: 'riccio', verso: 'bau', costo: 70,
    manto: '#f2ece2', pancia: '#fffdf8', occhi: '#4a3b2f',
    preferiti: ['🥣', '🎾'],
    descr: 'una nuvola con le zampe',
  },

  /* ---------- gatti ---------- */
  {
    id: 'pepe', nome: 'Pepe', razza: 'soriano grigio', famiglia: 'gatti',
    specie: 'gatto', verso: 'miao', costo: 60,
    manto: '#8e93a0', pancia: '#e8ebef', occhi: '#7fd06a', coda: 'lunga',
    strisce: '#5d626f',
    preferiti: ['🍥', '🎾'],
    descr: 'a righe come una tigre in miniatura',
  },
  {
    id: 'sherlock', nome: 'Sherlock', razza: 'gatto tuxedo', famiglia: 'gatti',
    specie: 'gatto', verso: 'miao', costo: 70,
    manto: '#2d2d3a', pancia: '#ffffff', occhi: '#8fd06a', coda: 'lunga',
    macchie: [{ dove: 'testa', blaze: true, cx: 60, cy: 38, rx: 8, ry: 20, c: '#ffffff' }],
    preferiti: ['🍣', '🪶'],
    descr: 'in smoking, mangia solo cose raffinate',
  },
  {
    id: 'irene', nome: 'Irene', razza: 'gatta arancione e nera', famiglia: 'gatti',
    specie: 'gatto', verso: 'miao', costo: 70,
    manto: '#e0872a', pancia: '#ffe7c9', occhi: '#f0b429', coda: 'lunga',
    macchie: [{ dove: 'testa', cx: 42, cy: 38, r: 16, c: '#33292b' },
              { dove: 'corpo', cx: 76, cy: 92, rx: 14, ry: 22, c: '#33292b' }],
    preferiti: ['🥩', '🧶'],
    descr: 'metà fuoco e metà notte',
  },
  {
    id: 'luna', nome: 'Luna', razza: 'gatta siamese', famiglia: 'gatti',
    specie: 'gatto', verso: 'miao', costo: 85,
    manto: '#e8ddcb', pancia: '#fbf5ea', occhi: '#6fc0e8', coda: 'scura',
    codaColore: '#6b5847', orecchie: '#6b5847',
    macchie: [{ dove: 'testa', cx: 60, cy: 58, rx: 18, ry: 13, c: '#6b5847' }],
    preferiti: ['🍤', '🪶'],
    descr: 'occhi di ghiaccio e musetto scuro',
  },

  /* ---------- pappagalli ---------- */
  {
    id: 'kiwi', nome: 'Kiwi', razza: 'parrocchetto', famiglia: 'uccelli',
    specie: 'pappagallo', verso: 'cip', costo: 90,
    manto: '#5fbf63', pancia: '#c9ec9a', occhi: '#2b2b33',
    ala: '#3f9a54', becco: '#f0a63c', ciuffo: '#ffd24a',
    preferiti: ['🌾', '🎈'],
    descr: 'verde come una foglia, chiacchiera sempre',
  },
  {
    id: 'rio', nome: 'Rio', razza: 'ara blu e gialla', famiglia: 'uccelli',
    specie: 'pappagallo', verso: 'cip', costo: 115,
    manto: '#4a86d8', pancia: '#ffd24a', occhi: '#2b2b33',
    ala: '#2f63ad', becco: '#3b3b45', ciuffo: '#5aa0e8',
    preferiti: ['🥜', '🪞'],
    descr: 'blu sopra e giallo sotto, e ripete tutto',
  },

  /* ---------- pesciolini ---------- */
  {
    id: 'bolla', nome: 'Bolla', razza: 'pesce rosso', famiglia: 'pesci',
    specie: 'pesce', verso: 'blub', costo: 35,
    manto: '#f57f3c', pancia: '#ffd9a8', occhi: '#2b2b33',
    pinna: '#ffb05e',
    preferiti: ['🥫', '🪀'],
    descr: 'gira in tondo e non si annoia mai',
  },
  {
    id: 'neon', nome: 'Neon', razza: 'pesce tropicale', famiglia: 'pesci',
    specie: 'pesce', verso: 'blub', costo: 55,
    manto: '#3fb6d8', pancia: '#d9f4ff', occhi: '#2b2b33',
    pinna: '#8be0ef', strisce: '#1f6f9a',
    preferiti: ['🪱', '🪀'],
    descr: 'a strisce fosforescenti, sembra acceso',
  },

  /* ---------- bestie che non esistono ---------- */
  {
    id: 'rex', nome: 'Rex', razza: 'cucciolo di dinosauro', famiglia: 'strani',
    specie: 'drago', taglio: 'dino', verso: 'ruggito', costo: 130,
    manto: '#6bbf5a', pancia: '#dff0b8', occhi: '#2b2b33',
    cresta: '#f0a63c',
    preferiti: ['🥩', '🦴'],
    descr: 'piccolo adesso, ma cresce',
  },
  {
    id: 'brace', nome: 'Brace', razza: 'draghetto sputafuoco', famiglia: 'strani',
    specie: 'drago', taglio: 'drago', verso: 'ruggito', costo: 150,
    manto: '#d9503f', pancia: '#ffd9a8', occhi: '#ffd24a',
    cresta: '#ffb03a', ala: '#f08a5d',
    preferiti: ['🌶️', '🪃'],
    descr: 'mangia peperoncini e fa il fumo dal naso',
  },
]

export const petDi = id => PETS.find(p => p.id === id) || null
export const dellaFamiglia = f => PETS.filter(p => p.famiglia === f)

/* Riprendere un amico dal rifugio costa una quota, non il prezzo pieno:
   deve essere poco — al rifugio l'hanno tenuto, mica rivenduto — ma non
   zero, altrimenti scambiare quattro animali dieci volte al giorno non
   costa niente e la scelta smette di essere una scelta. */
export const quotaRientro = id => Math.max(5, Math.round((petDi(id)?.costo || 0) / 10))

/* ═══════════ COSA MANGIA CHI ═══════════
   La dieta è della SPECIE, i preferiti sono dell'individuo: tutti i gatti
   mangiano pesce, ma il sushi lo adora solo Sherlock. Un cibo fuori dieta
   viene rifiutato — con garbo e senza sprecare la porzione — perché è la
   cosa che questo gioco è venuto a insegnare: il cane e il gatto non
   mangiano le stesse cose.

   Vale solo per la fame: giochi, spazzole e vitamine vanno bene per
   tutti. Un pesce che rifiuta la spazzola sarebbe solo un dispetto. */
export const DIETE = {
  cane:       ['carne', 'croccantini', 'verdura'],
  gatto:      ['carne', 'croccantini', 'pesce'],
  pappagallo: ['semi', 'frutta', 'verdura'],
  pesce:      ['acquario', 'verdura'],
  drago:      ['carne', 'fuoco'],
}

export const dietaDi = id => DIETE[petDi(id)?.specie] || []

/* Tutto quello che si ricompra. `dona` è quanto riempie la sua barra:
   più costa e più rende, ma il conto per punto resta simile, così non
   esiste il prodotto-trappola che rende meno di tutti costando di più.
   `cibo` è la categoria che le diete nominano: ce l'ha solo la roba da
   mangiare, perché solo lì esiste il «questo a te non piace». */
export const PRODOTTI = [
  { e: '🥣', nome: 'Croccantini', costo:  3, dona:  26, bisogno: 'fame', tipo: 'ciotola',  cibo: 'croccantini' },
  { e: '🍗', nome: 'Pollo',       costo:  4, dona:  34, bisogno: 'fame', tipo: 'ciotola',  cibo: 'carne' },
  { e: '🍲', nome: 'Pappa',       costo:  5, dona:  44, bisogno: 'fame', tipo: 'ciotola',  cibo: 'croccantini' },
  { e: '🥩', nome: 'Carne',       costo:  6, dona:  50, bisogno: 'fame', tipo: 'ciotola',  cibo: 'carne' },

  { e: '🍥', nome: 'Narutomaki',  costo:  4, dona:  30, bisogno: 'fame', tipo: 'sushi',    cibo: 'pesce' },
  { e: '🍣', nome: 'Nigiri',      costo:  6, dona:  40, bisogno: 'fame', tipo: 'sushi',    cibo: 'pesce' },
  { e: '🍤', nome: 'Gambero',     costo:  7, dona:  46, bisogno: 'fame', tipo: 'sushi',    cibo: 'pesce' },
  { e: '🐟', nome: 'Sashimi',     costo:  9, dona:  62, bisogno: 'fame', tipo: 'sushi',    cibo: 'pesce' },

  { e: '🥬', nome: 'Insalata',    costo:  3, dona:  24, bisogno: 'fame', tipo: 'orto',     cibo: 'verdura' },
  { e: '🍎', nome: 'Mela',        costo:  4, dona:  32, bisogno: 'fame', tipo: 'orto',     cibo: 'frutta' },
  { e: '🥦', nome: 'Broccolo',    costo:  5, dona:  42, bisogno: 'fame', tipo: 'orto',     cibo: 'verdura' },
  { e: '🍌', nome: 'Banana',      costo:  5, dona:  42, bisogno: 'fame', tipo: 'orto',     cibo: 'frutta' },
  { e: '🍇', nome: 'Uva',         costo:  7, dona:  58, bisogno: 'fame', tipo: 'orto',     cibo: 'frutta' },

  { e: '🌾', nome: 'Spighe',      costo:  3, dona:  25, bisogno: 'fame', tipo: 'semi',     cibo: 'semi' },
  { e: '🥜', nome: 'Arachidi',    costo:  5, dona:  44, bisogno: 'fame', tipo: 'semi',     cibo: 'semi' },

  { e: '🥫', nome: 'Fiocchi',     costo:  3, dona:  26, bisogno: 'fame', tipo: 'acquario', cibo: 'acquario' },
  { e: '🪱', nome: 'Vermetti',    costo:  5, dona:  45, bisogno: 'fame', tipo: 'acquario', cibo: 'acquario' },

  { e: '🪨', nome: 'Carbone',     costo:  4, dona:  32, bisogno: 'fame', tipo: 'fuoco',    cibo: 'fuoco' },
  { e: '🌶️', nome: 'Peperoncino', costo:  6, dona:  50, bisogno: 'fame', tipo: 'fuoco',    cibo: 'fuoco' },

  { e: '🧶', nome: 'Gomitolo',   costo:  5, dona:  40, bisogno: 'gioco',   tipo: 'giochi' },
  { e: '🎈', nome: 'Palloncino', costo:  6, dona:  50, bisogno: 'gioco',   tipo: 'giochi' },
  { e: '🪀', nome: 'Yo-yo',      costo:  6, dona:  50, bisogno: 'gioco',   tipo: 'giochi' },
  { e: '🎾', nome: 'Palla',      costo:  7, dona:  55, bisogno: 'gioco',   tipo: 'giochi' },
  { e: '🦴', nome: 'Osso',       costo:  7, dona:  55, bisogno: 'gioco',   tipo: 'giochi' },
  { e: '🪞', nome: 'Specchietto', costo:  8, dona:  62, bisogno: 'gioco',   tipo: 'giochi' },
  { e: '🪶', nome: 'Piumino',    costo:  9, dona:  75, bisogno: 'gioco',   tipo: 'giochi' },
  { e: '🪃', nome: 'Boomerang',  costo: 10, dona:  80, bisogno: 'gioco',   tipo: 'giochi' },

  { e: '🪥', nome: 'Spazzola',   costo:  4, dona:  40, bisogno: 'pulizia', tipo: 'bagno' },
  { e: '🧼', nome: 'Sapone',     costo:  7, dona:  70, bisogno: 'pulizia', tipo: 'bagno' },
  { e: '🧴', nome: 'Shampoo',    costo: 10, dona: 100, bisogno: 'pulizia', tipo: 'bagno' },

  { e: '🥕', nome: 'Carota',     costo:  5, dona:  35, bisogno: 'forma',   tipo: 'salute' },
  { e: '💊', nome: 'Vitamine',   costo:  9, dona:  70, bisogno: 'forma',   tipo: 'salute' },
  { e: '🩺', nome: 'Controllo',  costo: 13, dona: 100, bisogno: 'forma',   tipo: 'salute' },
]

export const prodottoDi = e => PRODOTTI.find(c => c.e === e) || null
export const perBisogno = k => PRODOTTI.filter(c => c.bisogno === k)

export const REPARTI = [
  { tipo: 'ciotola',  titolo: 'Nella ciotola',      bisogno: 'fame',    cibi: ['carne', 'croccantini'] },
  { tipo: 'sushi',    titolo: 'Sushi',              bisogno: 'fame',    cibi: ['pesce'] },
  { tipo: 'orto',     titolo: 'Frutta e verdura',   bisogno: 'fame',    cibi: ['frutta', 'verdura'] },
  { tipo: 'semi',     titolo: 'Semi e beccatine',   bisogno: 'fame',    cibi: ['semi'] },
  { tipo: 'acquario', titolo: 'Per i pesciolini',   bisogno: 'fame',    cibi: ['acquario'] },
  { tipo: 'fuoco',    titolo: 'Roba da draghi',     bisogno: 'fame',    cibi: ['fuoco'] },
  { tipo: 'giochi',   titolo: 'Giochi',             bisogno: 'gioco' },
  { tipo: 'bagno',    titolo: 'Bagnetto',           bisogno: 'pulizia' },
  { tipo: 'salute',   titolo: 'Per stare in forma', bisogno: 'forma' },
]

export const delReparto = tipo => PRODOTTI.filter(c => c.tipo === tipo)

/* ── piace o non piace ──
   Tre risposte, e una sola conta davvero per chi gioca: `no` vuol dire
   che il prodotto NON si consuma. È l'unica strada per cui un errore di
   scelta non costa monete — e senza quella garanzia i cibi sbagliati
   sarebbero una trappola invece di una cosa da imparare. */
export function gradimento(id, e) {
  const c = prodottoDi(e), p = petDi(id)
  if (!c || !p) return 'no'
  if (p.preferiti.includes(e)) return 'ama'
  if (c.bisogno !== 'fame') return 'ok'
  return dietaDi(id).includes(c.cibo) ? 'ok' : 'no'
}

export const preferisce = (id, e) => gradimento(id, e) === 'ama'
export const puoMangiare = (id, e) => gradimento(id, e) !== 'no'

/* i cibi che una specie può mangiare, per il cartellino del negozio: un
   emoji per categoria, il primo che si trova, in ordine di catalogo */
export function menuDi(id) {
  const visti = new Set()
  return PRODOTTI.filter(c => c.bisogno === 'fame' && dietaDi(id).includes(c.cibo))
    .filter(c => !visti.has(c.cibo) && visti.add(c.cibo))
    .map(c => c.e)
}

/* Dove si appoggia un accessorio su ogni sagoma: [x, base, dimensione]
   nel sistema di coordinate del disegno (viewBox 0 0 120 126). Sta qui e
   non nella vista perché è un dato dell'animale, come il colore del manto.
   Ogni specie dichiara tutti e quattro i posti: un capo che si può
   comprare ma su qualcuno non si vede sarebbe un capo rotto. */
export const ANCORE = {
  cane:       { testa: [60, 24, 30], occhi: [60, 57, 26], collo: [60, 84, 26], schiena: [91, 93, 24] },
  gatto:      { testa: [60, 28, 28], occhi: [60, 50, 26], collo: [60, 86, 26], schiena: [86, 93, 24] },
  pappagallo: { testa: [60, 20, 26], occhi: [60, 46, 22], collo: [60, 74, 24], schiena: [88, 88, 22] },
  // il pesce sta in una boccia: il cappello va sul vetro, il resto addosso a lui
  pesce:      { testa: [60, 26, 26], occhi: [56, 62, 20], collo: [60, 118, 24], schiena: [92, 104, 20] },
  drago:      { testa: [60, 22, 28], occhi: [60, 52, 24], collo: [60, 82, 26], schiena: [90, 92, 22] },
}

/* Quanto costa al giorno rimettere a posto un bisogno, comprando al prezzo
   più conveniente **fra quelli che quell'animale può usare**. È il conto
   che dice se l'economia sta in piedi, e va fatto sulle VISITE, non sul
   tempo: fra una visita e l'altra la barra scende ma non va sotto zero,
   quindi chi passa una volta al giorno paga una barra da riempire e
   basta, non le tre volte che si è svuotata.
   Serve al test: non deve rifarlo nessuno a mano. */
export function costoAlGiorno(k, visiteAlGiorno = 1, id = null) {
  const b = bisognoDi(k)
  const scelta = perBisogno(k).filter(c => !id || puoMangiare(id, c.e))
  const migliore = Math.min(...scelta.map(c => c.costo / c.dona))
  const persi = Math.min(100, (24 / visiteAlGiorno) * (100 / b.oreVuoto))
  return migliore * persi * visiteAlGiorno
}

export const costoGiornaliero = (visiteAlGiorno = 1, id = null) =>
  CHIAVI.reduce((s, k) => s + costoAlGiorno(k, visiteAlGiorno, id), 0)
