/* ═══════════════════════════════════════════════════════════════════
   GLI ANIMALI E I LORO BISOGNI

   Un cane e due gatti che si adottano una volta sola, e quattro barre che
   si svuotano da sole: la pancia, l'allegria, il pulito e la forma. Ogni
   barra cala col passare delle ore — la stessa idea del decadimento nel
   motore di apprendimento — e cala anche a gioco chiuso: così tornare
   domani ha un motivo in più della classifica.

   Nessun animale può ammalarsi, sparire o morire di fame: quando ha
   bisogno di qualcosa lo fa presente e basta. Anche la barra della `forma`
   NON è la salute: a zero vuol dire "un po' fiacco, gli andrebbe una
   carota", non "sta male". Un gioco per bambini non deve punire chi torna
   dopo una settimana, deve solo dargli qualcosa da fare quando torna.

   I numeri stanno tutti qui: costi, quanto rende ogni prodotto e la
   velocità con cui si svuotano le barre si regolano in questo file e da
   nessun'altra parte. `node pets-test.mjs` stampa quanto costa al giorno
   tenere un animale contento: è la misura da guardare quando si toccano.
   ═══════════════════════════════════════════════════════════════════ */

const ORA = 3600000

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

/* Come nasce un animale: tutte le barre al loro valore di partenza. */
export function nuovoAnimale(ora = Date.now()) {
  const a = { adottato: ora, val: {}, t: {}, pasti: 0, addosso: {} }
  for (const b of BISOGNI) { a.val[b.k] = b.inizio; a.t[b.k] = ora }
  return a
}

/* Porta un animale alla forma corrente dello stato, qualunque cosa ci
   fosse scritta prima. Un profilo nato quando esisteva solo la fame aveva
   `sat` e `pasto`: quelli diventano la pancia, e le tre barre nuove
   partono dal loro valore iniziale. Chi torna dopo un aggiornamento non
   deve trovarsi tre barre rosse per colpa di una modifica a cui non ha
   partecipato. */
export function migraAnimale(a, ora = Date.now()) {
  if (!a || typeof a !== 'object') return a
  if (!a.val || typeof a.val !== 'object') a.val = {}
  if (!a.t || typeof a.t !== 'object') a.t = {}
  if (!a.addosso || typeof a.addosso !== 'object') a.addosso = {}
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

/* Un cane e due gatti, disegnati e non presi dalle emoji: le emoji di gatto
   disponibili sono tre volte lo stesso gatto, e un bobtail non esiste proprio.
   `specie` decide quale sagoma disegna PetSprite.vue, `verso` che suono fa.
   Il costo è per animale: il primo è un invito, il terzo un obiettivo. */
export const PETS = [
  {
    id: 'watson', nome: 'Watson', razza: 'bobtail inglese',
    specie: 'cane', verso: 'bau', costo: 40,
    manto: '#93a3b3', pancia: '#f7f4ee', frangia: '#e6e3dc', occhi: '#4a3b2f',
    preferiti: ['🍗', '🎾'],
    descr: 'tutto pelo e niente coda',
  },
  {
    id: 'sherlock', nome: 'Sherlock', razza: 'gatto tuxedo',
    specie: 'gatto', verso: 'miao', costo: 70,
    manto: '#2d2d3a', pancia: '#ffffff', occhi: '#8fd06a', coda: 'lunga',
    macchie: [{ dove: 'testa', blaze: true, cx: 60, cy: 38, rx: 8, ry: 20, c: '#ffffff' }],
    preferiti: ['🍣', '🪶'],
    descr: 'in smoking, mangia solo cose raffinate',
  },
  {
    id: 'irene', nome: 'Irene', razza: 'gatta arancione e nera',
    specie: 'gatto', verso: 'miao', costo: 70,
    manto: '#e0872a', pancia: '#ffe7c9', occhi: '#f0b429', coda: 'lunga',
    macchie: [{ dove: 'testa', cx: 42, cy: 38, r: 16, c: '#33292b' },
              { dove: 'corpo', cx: 76, cy: 92, rx: 14, ry: 22, c: '#33292b' }],
    preferiti: ['🥩', '🧶'],
    descr: 'metà fuoco e metà notte',
  },
]

export const petDi = id => PETS.find(p => p.id === id) || null
export const preferisce = (id, e) => !!petDi(id)?.preferiti.includes(e)

/* Tutto quello che si ricompra. `dona` è quanto riempie la sua barra:
   più costa e più rende, ma il conto per punto resta simile, così non
   esiste il prodotto-trappola che rende meno di tutti costando di più. */
export const PRODOTTI = [
  { e: '🍗', nome: 'Pollo',      costo:  4, dona:  34, bisogno: 'fame',    tipo: 'ciotola' },
  { e: '🥩', nome: 'Carne',      costo:  6, dona:  50, bisogno: 'fame',    tipo: 'ciotola' },
  { e: '🍥', nome: 'Narutomaki', costo:  4, dona:  30, bisogno: 'fame',    tipo: 'sushi' },
  { e: '🍣', nome: 'Nigiri',     costo:  6, dona:  40, bisogno: 'fame',    tipo: 'sushi' },
  { e: '🍤', nome: 'Gambero',    costo:  7, dona:  46, bisogno: 'fame',    tipo: 'sushi' },
  { e: '🐟', nome: 'Sashimi',    costo:  9, dona:  62, bisogno: 'fame',    tipo: 'sushi' },

  { e: '🧶', nome: 'Gomitolo',   costo:  5, dona:  40, bisogno: 'gioco',   tipo: 'giochi' },
  { e: '🎾', nome: 'Palla',      costo:  7, dona:  55, bisogno: 'gioco',   tipo: 'giochi' },
  { e: '🦴', nome: 'Osso',       costo:  7, dona:  55, bisogno: 'gioco',   tipo: 'giochi' },
  { e: '🪶', nome: 'Piumino',    costo:  9, dona:  75, bisogno: 'gioco',   tipo: 'giochi' },

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
  { tipo: 'ciotola', titolo: 'Nella ciotola',      bisogno: 'fame' },
  { tipo: 'sushi',   titolo: 'Sushi',              bisogno: 'fame' },
  { tipo: 'giochi',  titolo: 'Giochi',             bisogno: 'gioco' },
  { tipo: 'bagno',   titolo: 'Bagnetto',           bisogno: 'pulizia' },
  { tipo: 'salute',  titolo: 'Per stare in forma', bisogno: 'forma' },
]

/* Dove si appoggia un accessorio sulle due sagome: [x, base, dimensione]
   nel sistema di coordinate del disegno (viewBox 0 0 120 126). Sta qui e
   non nella vista perché è un dato dell'animale, come il colore del manto. */
export const ANCORE = {
  cane:  { testa: [60, 24, 30], occhi: [60, 57, 26], collo: [60, 84, 26], schiena: [91, 93, 24] },
  gatto: { testa: [60, 28, 28], occhi: [60, 50, 26], collo: [60, 86, 26], schiena: [86, 93, 24] },
}

/* Quanto costa al giorno rimettere a posto un bisogno, comprando al prezzo
   più conveniente. È il conto che dice se l'economia sta in piedi, e va
   fatto sulle VISITE, non sul tempo: fra una visita e l'altra la barra
   scende ma non va sotto zero, quindi chi passa una volta al giorno paga
   una barra da riempire e basta, non le tre volte che si è svuotata.
   Serve al test: non deve rifarlo nessuno a mano. */
export function costoAlGiorno(k, visiteAlGiorno = 1) {
  const b = bisognoDi(k)
  const migliore = Math.min(...perBisogno(k).map(c => c.costo / c.dona))
  const persi = Math.min(100, (24 / visiteAlGiorno) * (100 / b.oreVuoto))
  return migliore * persi * visiteAlGiorno
}

export const costoGiornaliero = (visiteAlGiorno = 1) =>
  CHIAVI.reduce((s, k) => s + costoAlGiorno(k, visiteAlGiorno), 0)
