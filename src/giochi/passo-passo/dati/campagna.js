/* ═══════════════════════════════════════════════════════════════════
   LA CAMPAGNA — ventiquattro posti in cinque gradini

   Ogni gradino porta **una regola nuova**, e da lì in poi quella regola
   c'è sempre: il mondo non cambia da un livello all'altro, si allarga.
   Prima si cammina e basta, poi si salta, poi si scivola, poi si spinge,
   poi si cade nelle buche — e l'ultimo livello le mette tutte insieme.

   ── UN LIVELLO È UN POSTO, NON UNA STANZA ─────────────────────────
   La mappa è scritta a mano, una lettera per cella (la legenda sta in
   `dati/mondo.js`), e ognuna ha la sua forma: un prato con due
   cespugli, un bosco con un bivio, un fiume con i sassi, un lago
   ghiacciato con un buco. Il fuori non è sempre un rettangolo pieno — è
   l'acqua, il bosco, la siepe — e ogni posto ha un piccolo «aha»,
   scritto nel `racconto`: è la cosa che il livello esiste per far
   scoprire.

   ── LA CAROTA ─────────────────────────────────────────────────────
   Ogni livello ne ha una, e prenderla vale una stella. Nei primi sta
   sulla strada; poi chiede una deviazione; poi una deviazione pensata —
   sul ghiaccio, dietro a un buco, dall'altra parte della buca. Non è
   mai obbligatoria: senza, la tana vale lo stesso.

   ── I NUMERI ──────────────────────────────────────────────────────
   `portata` è la scala di tutto il repo (0 = quattro anni, 12,5 punti
   per anno, vedi `data/portata.js`): dal prato a quattro anni al tutto
   insieme a sette e mezzo. L'ultima sta a 44 e non a 45 apposta: la mira
   di un bambino di sei anni arriva a 44, e un punto in più chiudeva col
   lucchetto l'ultima tappa (e il sentiero senza fine dietro) proprio a
   chi ha l'età giusta per giocarla. Nessuna tappa dichiara `scuola`: dietro non
   c'è un pezzo di programma scolastico, e la testa della fila non si
   taglia mai.

   `premio` sono le monete **della prima vittoria**, una volta sola: il
   livello è fisso, e rigiocarlo è ricordarlo, non esercitarsi (vedi
   `CALIBRAZIONE.md`). Sale col gradino perché col gradino sale il tempo
   che un livello chiede: un minuto il prato, cinque il labirinto di
   ghiaccio.

   `salti: true` accende la seconda fila di frecce. Solo dove il livello
   le usa: una fila di tasti che non servono a niente è una fila di
   tasti da provare a caso.

   Quanto è lunga la strada più corta e se la regola del gradino serve
   davvero **non si scrive qui**: lo misura il risolutore, e il test
   (`test/unita/passo-passo`) lo pretende. Le misure di oggi, per chi
   deve scrivere un livello nuovo, stanno in `docs/passo-passo.md`.
   ═══════════════════════════════════════════════════════════════════ */
import { guastiDellaMappa } from './mondo.js'

export const SCALINI = [
  { chiave: 'passi', nome: 'Primi passi', icona: '🐾', regola: null,
    dritta: 'Solo frecce: si cammina, si gira attorno, non si entra nell\'acqua.' },
  { chiave: 'salto', nome: 'Il salto', icona: '🦘', regola: 'salto',
    dritta: 'Il salto scavalca una cella: l\'acqua e i tronchi sì, i sassi no.' },
  { chiave: 'ghiaccio', nome: 'Il ghiaccio', icona: '❄️', regola: 'ghiaccio',
    dritta: 'Sul ghiaccio si scivola finché qualcosa non ferma.' },
  { chiave: 'massi', nome: 'I massi', icona: '🪨', regola: 'spinta',
    dritta: 'Un masso si spinge: sul ghiaccio scivola, nell\'acqua fa un ponte.' },
  { chiave: 'buche', nome: 'Le buche', icona: '🕳️', regola: 'buche',
    dritta: 'Si entra in una buca e si esce dalla sua gemella, dello stesso colore.' },
]

/* I temi sono solo vestito: cambiano l'erba, le foglie per terra, la
   neve sugli alberi. Le regole restano le stesse in ogni stagione. */
export const TEMI = ['primavera', 'estate', 'inverno', 'autunno']

export const CAMPAGNA = [
  /* ── gradino 1: primi passi ── */
  { chiave: 'prato', nome: 'Il prato', icona: '🌼', scalino: 'passi',
    portata: 4, premio: 4, tema: 'primavera',
    racconto: 'Tre frecce, e la carota sta sulla strada: si scopre che il coniglio fa quello che dice la fila.',
    mappa: [
      'B..A',
      'Pc.@',
      '..B.',
    ] },
  { chiave: 'cespuglio', nome: 'Il cespuglio', icona: '🌳', scalino: 'passi',
    portata: 6, premio: 4, tema: 'primavera',
    racconto: 'Un cespuglio in mezzo alla strada: dritti si sbatte, bisogna girarci attorno.',
    mappa: [
      '....',
      'PB.@',
      '.c..',
    ] },
  { chiave: 'stagno', nome: 'Lo stagno', icona: '🐸', scalino: 'passi',
    portata: 8, premio: 4, tema: 'primavera',
    racconto: 'Lo stagno non si attraversa: splash. Due strade per girarci attorno, e la carota è su una delle due.',
    mappa: [
      '.....',
      'P~~..',
      '.~~.@',
      '.c...',
    ] },
  { chiave: 'bosco', nome: 'Il bosco', icona: '🌲', scalino: 'passi',
    portata: 10, premio: 4, tema: 'primavera',
    racconto: 'Un bivio fra gli alberi: la strada corta porta a casa, quella lunga passa dalla carota.',
    mappa: [
      'AA.AA',
      'P...A',
      'A.A.@',
      'Ac..A',
    ] },
  { chiave: 'orto', nome: 'L\'orto', icona: '🥬', scalino: 'passi',
    portata: 12, premio: 4, tema: 'primavera',
    racconto: 'Le file dell\'orto: la carota è piantata in un buco della fila, e per prenderla si passa di lì.',
    mappa: [
      '......',
      'PBBBB.',
      '......',
      '.BBcB.',
      '.....@',
    ] },

  /* ── gradino 2: il salto ── */
  { chiave: 'ruscello', nome: 'Il ruscello', icona: '💧', scalino: 'salto',
    portata: 14, premio: 6, tema: 'estate', salti: true,
    racconto: 'Un ruscello taglia il prato da parte a parte: si salta, e si atterra proprio sulla carota.',
    mappa: [
      'A.~..',
      'P.~c@',
      '..~.A',
    ] },
  { chiave: 'tronco', nome: 'Il tronco', icona: '🪵', scalino: 'salto',
    portata: 16, premio: 6, tema: 'estate', salti: true,
    racconto: 'Sopra c\'è un sasso, sotto un tronco caduto: il sasso è alto e non si salta, il tronco sì.',
    mappa: [
      'AAAAAA',
      'P..S.@',
      '.AAAA.',
      '..t.c.',
      'AAAAAA',
    ] },
  { chiave: 'fosso', nome: 'Il fosso', icona: '🏞️', scalino: 'salto',
    portata: 18, premio: 6, tema: 'estate', salti: true,
    racconto: 'Il fosso è largo due celle e il salto ne scavalca una sola: bisogna trovare la secca in mezzo.',
    mappa: [
      'AP....',
      '......',
      '~~~~~~',
      '~~~.~~',
      '..c...',
      'A...@A',
    ] },
  { chiave: 'recinto', nome: 'L\'orto recintato', icona: '🥕', scalino: 'salto',
    portata: 20, premio: 6, tema: 'estate', salti: true,
    racconto: 'Dentro la staccionata c\'è la carota: si salta dentro e si salta fuori. Saltandoci sopra non si prende.',
    mappa: [
      '...AA..',
      '.-----.',
      'P-.c.-@',
      '.-----.',
      '~~...~~',
    ] },
  { chiave: 'fiume', nome: 'I sassi nel fiume', icona: '🌊', scalino: 'salto',
    portata: 22, premio: 6, tema: 'estate', salti: true,
    racconto: 'Un fiume largo con le isolette: da un\'isola all\'altra, cambiando direzione. Qualche isola non porta da nessuna parte.',
    mappa: [
      'P.~.~cA',
      '~~~~~~~',
      '~~~.~.~',
      '~~~~~~~',
      '~.~~~.~',
      '~~~~~~~',
      'A.A.~.@',
    ] },

  /* ── gradino 3: il ghiaccio ── */
  { chiave: 'laghetto', nome: 'Il laghetto ghiacciato', icona: '⛸️', scalino: 'ghiaccio',
    portata: 24, premio: 8, tema: 'inverno',
    racconto: 'Una freccia sola, e il coniglio attraversa tutto il lago: sul ghiaccio non ci si ferma.',
    mappa: [
      'A.....A',
      '..***..',
      'P**C**.',
      '.*****@',
      'A.***.A',
    ] },
  { chiave: 'freno', nome: 'Il sasso che frena', icona: '🪨', scalino: 'ghiaccio',
    portata: 26, premio: 8, tema: 'inverno',
    racconto: 'Per scendere nella colonna giusta bisogna fermarsi a metà lago: ci pensa il sasso.',
    mappa: [
      '.......',
      'P***O*.',
      '.*****.',
      '.**C**.',
      '.*****.',
      'AA...@A',
    ] },
  { chiave: 'rotto', nome: 'Il ghiaccio rotto', icona: '🧊', scalino: 'ghiaccio',
    portata: 28, premio: 8, tema: 'inverno',
    racconto: 'Dritti si finisce nel buco del ghiaccio. La carota si prende solo fermandosi contro il sasso, e tornando indietro.',
    mappa: [
      '.......',
      'P*~O*~.',
      '.C*O**.',
      '.*****@',
      'A.....A',
    ] },
  { chiave: 'fiume-gelato', nome: 'Il fiume gelato', icona: '🥕', scalino: 'ghiaccio',
    portata: 30, premio: 8, tema: 'inverno',
    racconto: 'La carota è in mezzo al fiume gelato: ci si arriva solo scendendo nel punto giusto e scivolando lungo il fiume.',
    mappa: [
      '..A...P',
      'O******',
      '***C**O',
      '*****O*',
      '.@..A..',
    ] },
  { chiave: 'labirinto', nome: 'Il labirinto di ghiaccio', icona: '🌀', scalino: 'ghiaccio',
    portata: 32, premio: 8, tema: 'inverno',
    racconto: 'Sette frecce, e una sola strada: ogni scivolata finisce contro un sasso, e la carota è nell\'angolo in alto.',
    mappa: [
      'AA.....',
      '.C****.',
      'P*O****',
      '*****O.',
      '.O****A',
      'A.***.@',
    ] },
  { chiave: 'crepa', nome: 'La crepa', icona: '❄️', scalino: 'ghiaccio',
    portata: 34, premio: 8, tema: 'inverno', salti: true,
    racconto: 'Una crepa d\'acqua spacca il lago: prima ci si ferma accanto, contro un sasso, e poi la si salta.',
    mappa: [
      '.***O**',
      'P***~*@',
      '.***~*.',
      '.**O~*c',
      'A...~AA',
    ] },

  /* ── gradino 4: i massi ── */
  { chiave: 'masso', nome: 'Il masso', icona: '🪨', scalino: 'massi',
    portata: 36, premio: 10, tema: 'autunno',
    racconto: 'Un masso tappa il passaggio fra gli alberi: camminandoci contro si spinge, e la strada si apre.',
    mappa: [
      '..A.c.',
      'P.m...',
      '..A.@.',
    ] },
  { chiave: 'ponte', nome: 'Il ponte di sasso', icona: '🌉', scalino: 'massi',
    portata: 37, premio: 10, tema: 'autunno',
    racconto: 'Un ruscello e niente salti: spinto nell\'acqua, il masso affonda e diventa un ponte.',
    mappa: [
      'AAA~AAA',
      '...~...',
      'P.m~...',
      '...~.c.',
      'AAA~..@',
    ] },
  { chiave: 'masso-ghiaccio', nome: 'Il masso sul ghiaccio', icona: '🥌', scalino: 'massi',
    portata: 38, premio: 10, tema: 'inverno',
    racconto: 'Spinto sul ghiaccio, il masso scivola fino in fondo: e lì diventa il sasso che ti ferma.',
    mappa: [
      'AAAAAA',
      'Pm***.',
      'A****A',
      'AC***.',
      'AAAA@A',
    ] },
  { chiave: 'due-massi', nome: 'Due massi', icona: '⛰️', scalino: 'massi',
    portata: 39, premio: 10, tema: 'autunno',
    racconto: 'Due massi in fila non si spingono: prima si sposta quello davanti, poi l\'altro va nell\'acqua.',
    mappa: [
      'AA.AAAA',
      '...A...',
      'P.mm~.@',
      '...A.c.',
      'AA.AAAA',
    ] },

  /* ── gradino 5: le buche ── */
  { chiave: 'buche', nome: 'Le buche', icona: '🕳️', scalino: 'buche',
    portata: 40, premio: 12, tema: 'estate',
    racconto: 'La siepe non si passa, ma sotto c\'è una galleria: si entra da una buca e si esce dall\'altra.',
    mappa: [
      '...A...',
      'P.1A..c',
      '...A.1.',
      '...A..@',
    ] },
  { chiave: 'buca-ghiaccio', nome: 'La buca nel ghiaccio', icona: '🏝️', scalino: 'buche',
    portata: 41, premio: 12, tema: 'inverno',
    racconto: 'La tana è su un\'isola: ci porta la buca in mezzo al lago, che ferma anche chi ci scivola dentro.',
    mappa: [
      'A.....A',
      'P**C**.',
      '.**1**.',
      '.*****.',
      'A.....A',
      '~~~~~~~',
      '~1.@~~~',
    ] },
  { chiave: 'colori', nome: 'Le buche colorate', icona: '🎨', scalino: 'buche',
    portata: 42, premio: 12, tema: 'primavera',
    racconto: 'La buca rosa porta alla carota e la viola alla tana. Per tornare indietro si ripassa dalla rosa.',
    mappa: [
      '...A...',
      'P.1Ac1.',
      '..2AAAA',
      '...A...',
      '...A2.@',
    ] },
  { chiave: 'tutto', nome: 'Tutto insieme', icona: '🏆', scalino: 'buche',
    portata: 44, premio: 12, tema: 'inverno', salti: true,
    racconto: 'La strada di casa: la staccionata, il masso nel fiume, il lago col sasso, la buca. E la carota sul ghiaccio, da prendere dal lato giusto.',
    mappa: [
      'P-...AA',
      'AAAA.AA',
      'AAAAmAA',
      '~~~~~~~',
      '..*C*.A',
      '.1***..',
      '.***O*.',
      'AAAAAAA',
      '1..t..@',
    ] },
]

export const QUANTE_TAPPE = CAMPAGNA.length

export const tappeDelloScalino = chiave =>
  CAMPAGNA.map((t, i) => ({ ...t, indice: i })).filter(t => t.scalino === chiave)

/* ── LA CAMPAGNA SCRITTA BENE ──
   Solo quello che si vede senza giocare: le chiavi, i campi, le mappe
   leggibili, gli scalini in fila, i premi e la portata che salgono. Se
   un livello **si vince**, e se ha bisogno della sua regola, lo dice il
   risolutore nel test — il dato non sa niente del motore. */
export function guastiDellaCampagna(campagna = CAMPAGNA) {
  const guasti = []
  const viste = new Set()
  for (const [i, t] of campagna.entries()) {
    const dove = `tappa ${i + 1} («${t.chiave}»)`
    if (viste.has(t.chiave)) guasti.push(`${dove}: chiave ripetuta`)
    viste.add(t.chiave)
    if (!t.nome || !t.racconto || !t.icona) guasti.push(`${dove}: senza nome, racconto o icona`)
    if (!SCALINI.some(s => s.chiave === t.scalino)) guasti.push(`${dove}: lo scalino «${t.scalino}» non esiste`)
    if (!TEMI.includes(t.tema)) guasti.push(`${dove}: il tema «${t.tema}» non esiste`)
    if (!Number.isFinite(t.portata) || t.portata < 0 || t.portata > 100)
      guasti.push(`${dove}: portata ${t.portata} fuori dalla scala 0-100`)
    if (t.scuola) guasti.push(`${dove}: dichiara un pezzo di scuola, e dietro questo gioco non ce n'è`)
    if (!(t.premio >= 1 && t.premio <= 20)) guasti.push(`${dove}: premio ${t.premio} fuori misura`)
    guasti.push(...guastiDellaMappa(t.mappa, dove))
    /* i salti dichiarati da chi ha una staccionata o un tronco da
       scavalcare: senza la seconda fila di frecce quel livello non si
       gioca, e il risolutore lo direbbe solo come «non si vince» */
    if (!t.salti && t.mappa.some(r => /[t-]/.test(r)))
      guasti.push(`${dove}: ha ostacoli bassi ma non accende i salti`)
  }

  /* gli scalini arrivano in fila, nessuno resta vuoto, e la portata e il
     premio non tornano indietro */
  const ordine = SCALINI.map(s => s.chiave)
  const fila = campagna.map(t => ordine.indexOf(t.scalino))
  if (fila.some((n, i) => i > 0 && n < fila[i - 1]))
    guasti.push('gli scalini non sono in fila: una tappa di un gradino viene dopo una del gradino dopo')
  for (const s of SCALINI)
    if (!campagna.some(t => t.scalino === s.chiave)) guasti.push(`lo scalino «${s.chiave}» non ha nemmeno una tappa`)
  for (let i = 1; i < campagna.length; i++) {
    if (campagna[i].portata < campagna[i - 1].portata)
      guasti.push(`tappa ${i + 1}: la portata scende (${campagna[i - 1].portata} → ${campagna[i].portata})`)
    if (campagna[i].premio < campagna[i - 1].premio)
      guasti.push(`tappa ${i + 1}: il premio scende`)
  }
  return guasti
}
