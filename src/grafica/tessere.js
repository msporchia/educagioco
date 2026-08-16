/* ═══════════════════════════════════════════════════════════════════
   QUALE TESSERA VA QUI — e in che verso.

   Un mondo a tessere non si disegna scegliendo le figure a mano: si
   **segnano le celle** — qui passa la strada, qui c'è lo stagno, qui il
   recinto — e il pezzo giusto lo si ricava guardando i vicini. È la
   differenza fra piazzare oggetti e dipingere: uno stagno smette di
   essere «un blocco 3×3 che o ci sta o non ci sta» e diventa una pozza
   della forma che vuoi.

   Qui dentro non c'è nessun canvas e nessun nome di sprite: c'è la
   domanda «che forma ha questa cella?», e la risposta è una chiave.
   Chi disegna tiene la sua tavola chiave → pezzo, e le tavole sono
   diverse per la strada, per l'acqua e per la staccionata. Per questo il
   file gira anche in Node, e infatti si prova lì.

   ── perché le chiavi sono lettere ──
   `NS` vuol dire «collegata sopra e sotto», `NE` «sopra e a destra».
   Sono ordinate sempre nello stesso modo (N, S, O, E) così due strade
   uguali fanno la stessa chiave, e la tavola si legge a colpo d'occhio.

   ── lo specchio ──
   Un foglio di sprite quasi mai contiene tutti e quattro gli angoli:
   ne disegna tre e il quarto lo ottieni specchiando. `pezzoPer` lo fa
   da sé — cerca la chiave, e se non la trova cerca quella riflessa
   scambiando destra e sinistra. Una riga di codice al posto di un
   disegno che non c'è.

   ── quando un sì/no non basta: gli attacchi ──
   Tutto quanto sopra risponde «questo lato è collegato oppure no», e
   basta finché le tessere portano la strada nello stesso punto del
   bordo. Un foglio disegnato per davvero non è così: c'è la curva che
   esce in alto a destra e quella che esce in mezzo, e con un sì/no sono
   la stessa cosa — accostate, la strada si spezza. La seconda metà del
   file (`pose`, `componiPercorso`) tratta il bordo come un'etichetta —
   dove passa, non se passa — che è quello che il mestiere chiama *Wang
   tiles*, e sceglie le tessere come si risolve un sudoku.

   ── il dungeon, l'angolo che `fettaDi` non vede ──
   `fettaDi` guarda solo i quattro vicini in croce e riduce tutto a
   nove fette: basta per una pozza, ma non per un dungeon a stanze, che
   ha anche l'angolo dove due pareti si incontrano DA DENTRO — un
   angolo concavo, diverso dai quattro angoli esterni che `fettaDi` già
   sa fare. Per quello serve guardare anche le quattro diagonali:
   `bordoOtto` lo fa, `angoliInterni` dice quali sono le rientranze, e
   `pezzoPerOtto`/`fettaEquivalente` fanno per gli otto vicini quello
   che `pezzoPer` fa per i quattro: quello che manca si cerca nella
   forma più semplice invece di lasciare un buco.
   ═══════════════════════════════════════════════════════════════════ */

/* i quattro versi, in ordine fisso: l'ordine è quello che rende le
   chiavi confrontabili */
export const VERSI = { N: [0, -1], S: [0, 1], O: [-1, 0], E: [1, 0] }
const ORDINE = ['N', 'S', 'O', 'E']
/* il lato con cui si guarda un vicino: il mio N è il suo S */
const CONTRO = { N: 'S', S: 'N', O: 'E', E: 'O' }

/* la chiave, sempre nello stesso ordine */
export const chiave = versi => ORDINE.filter(v => versi.includes(v)).join('')

/* riflessa a specchio: destra e sinistra si scambiano, sopra e sotto no */
export const riflessa = k => chiave([...k].map(v => (v === 'O' ? 'E' : v === 'E' ? 'O' : v)))

/* ── una cella dentro un insieme ──
   `dentro(x, y)` dice se quella cella è dello stesso genere. Serve per
   tutto ciò che è una *zona* o una *rete*: l'acqua di uno stagno, i pali
   di un recinto, i binari che si diramano. */
export function collegamenti(dentro, x, y) {
  return chiave(ORDINE.filter(v => dentro(x + VERSI[v][0], y + VERSI[v][1])))
}

/* ── una cella dentro un percorso ──
   Un percorso è una fila ordinata di celle, e questa è un'altra cosa
   dall'insieme: una strada che passa due volte vicino a sé stessa non
   diventa un incrocio, perché non ci si può svoltare. Qui si guarda
   solo da dove si viene e dove si va.

   Le due punte si collegano al bordo: `capi` dice da che parte esce la
   strada quando comincia e quando finisce — di solito 'N' in cima e 'S'
   in fondo, ma un percorso che entra da sinistra dichiara 'O'. */
export function versiLungo(celle, i, capi = {}) {
  const qui = celle[i]
  const versi = []
  for (const altro of [celle[i - 1], celle[i + 1]]) {
    if (!altro) continue
    if (altro[1] < qui[1]) versi.push('N')
    if (altro[1] > qui[1]) versi.push('S')
    if (altro[0] < qui[0]) versi.push('O')
    if (altro[0] > qui[0]) versi.push('E')
  }
  if (i === 0 && capi.parte) versi.push(capi.parte)
  if (i === celle.length - 1 && capi.arriva) versi.push(capi.arriva)
  return chiave(versi)
}

/* ── dalla chiave al pezzo ──
   `tavola` è nome della forma → nome dello sprite. Quello che manca si
   cerca allo specchio; quello che non c'è nemmeno lì torna `null`, e un
   `null` va fatto vedere invece che nascosto: è un buco nella tavola,
   non un caso da ignorare. */
export function pezzoPer(tavola, k) {
  if (tavola[k]) return { nome: tavola[k], specchia: false }
  const r = riflessa(k)
  if (tavola[r]) return { nome: tavola[r], specchia: true }
  return null
}

/* ── il bordo di una zona ──
   Le nove fette di uno stagno: il centro, quattro bordi, quattro
   angoli. Si guarda da che parte l'acqua **finisce**, che è l'opposto
   di `collegamenti` e si legge meglio così — «niente acqua sopra e a
   sinistra» è l'angolo di nord-ovest.

   Sedici combinazioni e nove fette: le altre si riducono. Una lingua
   d'acqua larga una cella (fuori a destra *e* a sinistra) prende il
   bordo di uno dei due lati invece di una figura sua, e a questa misura
   non si nota. È il compromesso che permette di disegnare una pozza
   qualsiasi con nove disegni. */
export function fettaDi(dentro, x, y) {
  const fuori = ORDINE.filter(v => !dentro(x + VERSI[v][0], y + VERSI[v][1]))
  const ha = v => fuori.includes(v)
  const su = ha('N'), giu = ha('S'), sx = ha('O'), dx = ha('E')
  if (su && sx) return 'angolo-no'
  if (su && dx) return 'angolo-ne'
  if (giu && sx) return 'angolo-so'
  if (giu && dx) return 'angolo-se'
  if (su) return 'bordo-n'
  if (giu) return 'bordo-s'
  if (sx) return 'bordo-o'
  if (dx) return 'bordo-e'
  return 'centro'
}

/* ── il bordo di una cella, otto vicini ──
   `bordoOtto` guarda anche le quattro diagonali, dove `fettaDi` si
   ferma ai quattro vicini in croce. Ma non tutte e 256 le combinazioni
   di otto vicini contano: una diagonale cambia la forma solo quando i
   DUE lati che la toccano sono entrambi dentro. Se un lato è già
   fuori, l'angolo lì è già deciso da quel lato solo, e sapere se anche
   la diagonale è fuori non aggiunge una figura in più — proprio come
   la lingua d'acqua di `fettaDi` non aggiunge un disegno in più.
   Questa è esattamente la regola che riduce le 256 combinazioni di
   otto vicini alle 47 forme canoniche dell'autotiling "blob": 47 non
   è un numero scelto a tavolino, è quello che resta dopo aver tolto
   le diagonali che non contano (vedi `angoliInterni`, sotto).

   La chiave ha due parti, sempre nello stesso ordine: i lati mancanti
   (maiuscole, ordine N S O E — la stessa `chiave` di sempre) e gli
   angoli concavi (minuscole, ordine NO NE SO SE), unite da un
   trattino quando ci sono entrambe — così restano leggibili anche
   insieme ('N-se': parete a nord, rientranza a sud-est). Una cella
   tutta dentro e senza rientranze è `'centro'`, come in `fettaDi`: è
   lo stesso concetto, non una coincidenza. */
const DIAGONALI = ['NO', 'NE', 'SO', 'SE']
const VERSI_DIAG = { NO: [-1, -1], NE: [1, -1], SO: [-1, 1], SE: [1, 1] }
const FIANCHI = { NO: ['N', 'O'], NE: ['N', 'E'], SO: ['S', 'O'], SE: ['S', 'E'] }

/* ── quali angoli sono concavi ──
   Un angolo è concavo quando i due lati che lo affiancano sono dentro
   ma la diagonale è fuori: è la rientranza dove due corridoi si
   saldano da dentro la stanza — il pezzo che `fettaDi` non sa
   disegnare, perché non guarda le diagonali.

   Un angolo diagonale isolato — dentro solo in diagonale, coi due lati
   già fuori da quel verso — non compare in questo elenco: non è un
   angolo suo, è già raccontato dal lato che manca (ed è la riduzione
   che sta anche dietro `bordoOtto`). */
export function angoliInterni(dentro, x, y) {
  return DIAGONALI.filter(d => {
    const [a, b] = FIANCHI[d]
    if (!dentro(x + VERSI[a][0], y + VERSI[a][1])) return false
    if (!dentro(x + VERSI[b][0], y + VERSI[b][1])) return false
    const [dx, dy] = VERSI_DIAG[d]
    return !dentro(x + dx, y + dy)
  })
}

export function bordoOtto(dentro, x, y) {
  const cardinali = ORDINE.filter(v => !dentro(x + VERSI[v][0], y + VERSI[v][1])).join('')
  const concavi = angoliInterni(dentro, x, y).join('').toLowerCase()
  if (!cardinali && !concavi) return 'centro'
  return cardinali + (cardinali && concavi ? '-' : '') + concavi
}

/* ── quando il set non ha i pezzi diagonali ──
   Un foglio pensato per `fettaDi` non ha un pezzo per un angolo
   concavo: quello si perde, e la cella si legge con la stessa forma a
   quattro vicini che avrebbe scelto `fettaDi` — un lato diritto, o
   l'angolo esterno più vicino, con lo stesso compromesso ("i lati che
   restano" prima, "il centro" se non ne resta nessuno). Non è un
   secondo algoritmo: è lo stesso `fettaDi`, letto dalla chiave a otto
   vicini invece che dai quattro vicini veri — per questo basta
   ripulire la chiave dagli angoli concavi (le lettere minuscole) e
   ridarla in pasto alle stesse regole. */
export function fettaEquivalente(k8) {
  const cardinali = k8.split('-')[0].replace(/[a-z]/g, '')
  const su = cardinali.includes('N'), giu = cardinali.includes('S')
  const sx = cardinali.includes('O'), dx = cardinali.includes('E')
  if (su && sx) return 'angolo-no'
  if (su && dx) return 'angolo-ne'
  if (giu && sx) return 'angolo-so'
  if (giu && dx) return 'angolo-se'
  if (su) return 'bordo-n'
  if (giu) return 'bordo-s'
  if (sx) return 'bordo-o'
  if (dx) return 'bordo-e'
  return 'centro'
}

/* dalla chiave a otto vicini al pezzo: prima la chiave esatta (il set
   disegna anche i concavi), poi — se manca — la forma più semplice a
   quattro vicini, passata a `pezzoPer` così lo specchio di destra e
   sinistra funziona comunque. Un set senza pezzi diagonali non resta
   scoperto, si accontenta di quello che `fettaDi` avrebbe scelto. */
export function pezzoPerOtto(tavola, k8) {
  if (tavola[k8]) return { nome: tavola[k8], specchia: false }
  return pezzoPer(tavola, fettaEquivalente(k8))
}

/* ═══════════════════════════════════════════════════════════════════
   GLI ATTACCHI — quando «di qua passa la strada» non basta

   Tutto quello che sta sopra risponde sì o no: questo lato è collegato
   oppure no. Basta finché tutte le tessere portano la strada nello
   stesso punto del bordo — nel mezzo. Ma un foglio disegnato da una
   mano sola non è fatto così: c'è la tessera che esce in alto **a
   destra**, quella che taglia in diagonale, quella che entra larga e
   esce stretta. Con un sì/no sono tutte «collegata a nord», e messe
   una sopra l'altra la strada si spezza.

   L'attacco dice **dove**: `·` nessuno, `c` in mezzo, `sx` verso
   sinistra, `dx` verso destra. Due tessere si toccano se il lato che si
   guardano racconta la stessa cosa — il N di quella sotto contro il S
   di quella sopra.

   È il modello delle *Wang tiles* (un'etichetta per lato invece di un
   colore solo), e il modo di risolverlo è quello del *Wave Function
   Collapse*: ogni cella tiene l'elenco delle tessere ancora possibili,
   si sceglie sempre la cella che ne ha meno, e se un ramo si chiude si
   torna indietro. Non c'è niente di magico: è un sudoku dove i numeri
   sono pezzi di strada.

   ── i lati si leggono sempre nello stesso verso ──
   N e S da sinistra a destra, O ed E dall'alto in basso. È la
   convenzione che fa combaciare i confronti senza rigirare niente, ed è
   anche il motivo per cui `giraSocket` inverte due lati su quattro: un
   bordo che era a sinistra, dopo un quarto di giro, si legge in alto.
   ═══════════════════════════════════════════════════════════════════ */

export const NESSUN_ATTACCO = '·'

/* l'attacco visto dall'altra parte: chi era a destra si ritrova a
   sinistra. Serve a girare e a specchiare, non a confrontare — due
   tessere affiancate guardano lo stesso bordo dallo stesso verso. */
const ribalta = a => (a === 'sx' ? 'dx' : a === 'dx' ? 'sx' : a)

/* un quarto di giro in senso orario */
export const giraSocket = s => ({ N: s.O, S: ribalta(s.E), O: ribalta(s.S), E: s.N })

/* lo specchio fra destra e sinistra */
export const specchiaSocket = s =>
  ({ N: ribalta(s.N), S: ribalta(s.S), O: s.E, E: s.O })

/* ── le otto pose di una tessera ──
   Quattro giri per due versi. Un foglio non disegna mai tutte le curve:
   ne disegna una e le altre tre sono la stessa girata, e la pixel art
   regge i novanta gradi esatti senza sfrangiarsi (non regge i
   quarantacinque, ed è il motivo per cui qui i giri sono quattro).

   Le pose che si presentano identiche su tutti e quattro i lati sono la
   stessa cosa e restano una sola: un incrocio girato è un incrocio. */
export function pose(nome, socket) {
  const fuori = []
  const viste = new Set()
  for (const specchia of [false, true]) {
    let s = specchia ? specchiaSocket(socket) : socket
    for (let gira = 0; gira < 4; gira++) {
      const k = ORDINE.map(v => s[v]).join('|')
      if (!viste.has(k)) {
        viste.add(k)
        fuori.push({ nome, gira, specchia, socket: s })
      }
      s = giraSocket(s)
    }
  }
  return fuori
}

/* la chiave dei lati aperti di una posa: serve a scegliere in fretta
   solo le pose che hanno la forma giusta */
export const latiDi = s => chiave(ORDINE.filter(v => s[v] !== NESSUN_ATTACCO))

/* ── comporre un percorso ──
   `celle` è la fila ordinata di caselle che la strada attraversa;
   `catalogo` è una lista di pose (quelle che escono da `pose()`).

   Due vincoli, e sono di natura diversa:
     · **la forma** — una cella deve aprirsi verso la casella prima e
       verso quella dopo, e verso nessun'altra. Lo dice il percorso, non
       la tessera, e restringe il campo prima ancora di cominciare.
     · **l'attacco** — due caselle vicine devono raccontare lo stesso
       bordo. E una casella di strada che confina con l'erba deve avere
       quel lato chiuso, se no la strada sborda nel prato.

   `dentro(x, y)` dice se una casella sta nel campo: fuori dal campo non
   si vincola niente, ed è così che la strada può entrare da sopra e
   uscire in fondo senza che il bordo la chiuda.

   ── una fila, o una rete ──
   Di regola le caselle sono una **fila ordinata** e da lì si ricava da
   sé dove ogni tessera deve aprirsi. Ma una tappa a due ingressi non è
   una fila: due strade che sboccano nella stessa porta si incontrano, e
   nella casella dove si incontrano i lati aperti sono tre. Per quel caso
   `opz.versi(x, y)` risponde al posto della fila — chi lo passa ha già
   messo insieme le due strade e sa che lì c'è una biforcazione — e
   `celle` torna a essere solo l'elenco delle caselle da riempire.

   Torna `null` se non si chiude — e un `null` va fatto vedere, non
   nascosto: vuol dire che al foglio manca un pezzo, ed è una cosa da
   sapere, non da coprire con una tessera qualsiasi. */
export function componiPercorso(celle, catalogo, opz = {}) {
  const { capi = {}, dentro = () => true, seme = 0, versi = null } = opz
  const inVia = new Set(celle.map(([x, y]) => `${x},${y}`))
  const scelte = new Map()

  /* il campo di scelta di ogni casella: solo le pose che si aprono
     esattamente dove serve */
  const dominio = celle.map(([x, y], i) => {
    const voluti = versi ? versi(x, y) : versiLungo(celle, i, capi)
    const buone = catalogo.filter(p => latiDi(p.socket) === voluti)
    return { x, y, k: `${x},${y}`, voluti, buone }
  })
  const vuoto = dominio.find(d => !d.buone.length)
  if (vuoto) return null

  const combacia = (d, p) => {
    for (const v of ORDINE) {
      const [dx, dy] = VERSI[v]
      const nx = d.x + dx, ny = d.y + dy
      const chi = scelte.get(`${nx},${ny}`)
      if (chi) {
        if (p.socket[v] !== chi.socket[CONTRO[v]]) return false
      } else if (!dentro(nx, ny)) {
        continue                       // fuori dal campo: nessun vincolo
      } else if (!inVia.has(`${nx},${ny}`)) {
        if (p.socket[v] !== NESSUN_ATTACCO) return false   // di là c'è il prato
      }
    }
    return true
  }

  function passo() {
    const resto = dominio.filter(d => !scelte.has(d.k))
    if (!resto.length) return true
    /* sempre la casella con meno possibilità: è quella che fa fallire
       prima il ramo sbagliato, e un ramo che fallisce presto costa poco */
    let scelta = null, cand = null
    for (const d of resto) {
      const c = d.buone.filter(p => combacia(d, p))
      if (!cand || c.length < cand.length) { scelta = d; cand = c }
      if (!c.length) break
    }
    /* l'ordine è casuale ma non cambia mai: stesso campo, stessa strada.
       Una strada che si ridisegna diversa a ogni giro si legge come un
       guasto anche quando è bella. */
    const ordinate = cand
      .map((p, i) => [caso(scelta.x, scelta.y, seme + i), p])
      .sort((a, b) => a[0] - b[0])
      .map(([, p]) => p)
    for (const p of ordinate) {
      scelte.set(scelta.k, p)
      if (passo()) return true
      scelte.delete(scelta.k)
    }
    return false
  }

  if (!passo()) return null
  return celle.map(([x, y]) => scelte.get(`${x},${y}`))
}

/* ── il caso che non cambia ──
   Stesso posto, stessa erba. Un prato che si rimescola a ogni ridisegno
   è un prato sbagliato: si vede *mentre* cambia, e sembra un guasto.
   Il seme è la posizione, così non c'è niente da salvare. */
export function caso(x, y, k = 0) {
  let n = (x * 374761393 + y * 668265263 + k * 2246822519) | 0
  n = ((n ^ (n >>> 13)) * 1274126177) | 0
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296
}

/* Una variante fra tante, decisa dal posto. La lista può ripetere lo
   stesso nome più volte, ed è il modo di dire «questa spunta di rado»:
   un prato dove le varianti sono equiprobabili si legge come un motivo
   che si ripete, cioè come una tabella. */
export const variante = (lista, x, y, k = 0) =>
  lista[Math.min(lista.length - 1, Math.floor(caso(x, y, k) * lista.length))]
