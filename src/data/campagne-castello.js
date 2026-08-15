/* ═══════════════════════════════════════════════════════════════════
   LE CAMPAGNE DEL CASTELLO — quello che di una tappa si racconta.

   Qui dentro non c'è un solo numero di equilibrio. Una tappa dichiara
   il suo nome, il terreno su cui si combatte, il percorso che i mostri
   percorrono, chi arriva, quali operazioni mette a disposizione — e
   una cosa sola che non è racconto ma promessa:

     `calcoli`   quante operazioni in colonna costa finirla

   È il bersaglio, non una misura: `data/castello.js` ci costruisce
   sopra le ondate, l'energia, i prezzi e le postazioni, e `npm run
   tara` ci tara sopra la vita dei nemici. Prima era il contrario — il
   numero di calcoli usciva dai conti, e usciva sbagliato: ventuno per
   la prima tappa, cinquantadue per l'ultima. Una partita diventava un
   compito.

   Tre archi da cinque tappe, ognuno che riparte più basso della fine
   del precedente ma arriva più in alto:

     Bosco         6 · 7 · 8 · 10 · 12
     Sotterraneo   9 · 11 · 13 · 16 · 19
     Mura         14 · 18 · 22 · 26 · 30

   Le quattro torri: `add` arciere 🏹, `sub` magica 🔮 (danno a zona),
   `mul` ghiaccio ❄️ (non fa danno: gela), `div` bombe 💣.

   ── le torri, e perché entrano tutte nel Bosco ──
   Il Bosco è il tutorial e basta: introduce le quattro torri una per
   volta, una ogni tappa o due. Dal Sotterraneo in avanti sono tutte
   aperte, perché chi arriva lì il tutorial l'ha già fatto e il gioco
   non è più «quale torre si sblocca» ma «quale torre serve adesso».

   ── le debolezze, e perché quasi dappertutto ──
   Ogni mostro ha un tipo di torre che gli fa doppio danno
   (`data/mostri.js`). Accenderlo in una tappa sola lo rendeva un
   dettaglio; qui è acceso **da Bosco 2 in poi**, cioè in quattordici
   tappe su quindici. Fuori resta solo la primissima, che ha una torre
   sola: con una torre sola la debolezza non è una scelta, è
   un'etichetta.
   Due regole tengono la cosa onesta, e `strumenti/valida-percorsi.mjs`
   le verifica:
     · ogni mostro dell'elenco è debole a una torre che **quella tappa
       mette a disposizione** — se no la scheda indica un bottone
       chiuso;
     · in un elenco compaiono almeno **due** debolezze diverse — se
       fossero tutte uguali la risposta sarebbe sempre la stessa.
   Le file qui sotto fanno di più: girano i tre bersagli in ordine, in
   modo che due ondate di fila non chiedano mai la stessa torre. Il
   ghiaccio non compare mai fra le debolezze — non fa danno, e il
   doppio di zero è zero.
   ═══════════════════════════════════════════════════════════════════ */

/* ═══════════════ I PERCORSI ═══════════════

   Una `forma` è una spezzata in coordinate 0–1 sul riquadro del campo.
   `motore/battaglia.js` la smussa (Chaikin, `grafica/geometria.js`) e
   ci dispone le postazioni ai lati, alternate, **partendo
   dall'ingresso**: ogni torre nuova allunga la difesa verso il
   castello.

   ── il riquadro vero ──
   Il campo è **verticale**, come il gioco: `MONDO` in
   `data/castello.js` dice 420×760, uguale su ogni schermo. Non è più il
   riquadro quasi quadrato di prima (390×420 sul telefono, 520×420 sul
   computer, e le mappe che si stiravano fra i due): il banco dei
   bottoni non c'è più, il campo si prende tutta la schermata, e quello
   che cambia da un telefono a un monitor è solo quanto lo si vede
   grande.

   ── i margini, e perché ──
     x ∈ [0.05, 0.95]   una strada che tocca il bordo sembra tagliata
     y ∈ [0.04, 0.95]   il castello in fondo al percorso è alto una
                        cinquantina di unità sopra il suo piede
   Il percorso entra sempre dal bordo **di sopra** ed esce **in fondo**:
   da lì scendono i nemici, e in fondo — vicino al pollice, dove si
   difende — c'è il castello.

   ── quanto due tratti possono avvicinarsi ──
   Una postazione sta a 34 unità dal centro della strada e la sua
   piazzola ne è larga 15; mezza strada ne misura 17. Fanno 66: sotto,
   una piazzola finisce sopra l'altra corsia. Ma il conto vale fra
   **corsie parallele**, non dentro un gomito — nell'incavo di una
   curva la torre ci sta apposta, ed è metà del mestiere di chi la
   piazza. Il validatore quindi distingue i due casi dalla distanza
   *lungo il cammino*: fino a 200 unità è un gomito (minimo 52), oltre
   sono due corsie diverse (minimo 62).

   ── la difficoltà che sta nella mappa ──
   Il raggio di una torre va da 86 a 132 unità: su un campo largo 420
   una torre ne vede un bel pezzo. Quello che conta non è la lunghezza
   in sé ma **quanta strada ogni torre tiene sotto tiro** — un
   tracciato che si ripiega si fa battere due o tre volte dalla stessa
   torre, uno diritto una volta sola. Il validatore la chiama
   `presidio` (strada per postazione, misurata in raggi d'arciere), e
   scende di campagna in campagna:

     Bosco        ~2,4     serpentine che si ripiegano: perdonano
     Sotterraneo  ~2,1     cunicoli: qualche gomito, meno regali
     Mura         ~1,9     rettifili: una torre, un tratto, e basta

   È il numero che regge la difficoltà, e **non è cambiato** con il
   campo nuovo: le strade sono più lunghe — un riquadro 420×760 ha più
   posto di uno 390×420 — ma quanto si ripiegano su sé stesse è la
   stessa promessa di prima.

   Il verso, invece, è cambiato tutto: si scende. Le corsie sono
   orizzontali e stanno una sotto l'altra, e la distanza fra due corsie
   è la manopola del presidio — settanta-novanta unità e una torre in
   mezzo ne batte due, oltre centocinquanta ne batte una sola. */

/* ── BOSCO: sentieri che si perdono nel verde ──
   Serpentine larghe, diagonali, niente spigoli. Le anse stanno vicine:
   qui una torre lavora due volte, ed è il regalo che il bosco fa a chi
   sta imparando. */

// il sentiero: quattro anse che attraversano il bosco da parte a
// parte, una sotto l'altra e vicine. È la prima tappa: chi comincia ha
// bisogno di tempo, non di sconti sui nemici — e con le corsie così
// strette ogni torre lavora due volte.
const BOSCO_SENTIERO = [
  [0.36, 0.04], [0.30, 0.13], [0.72, 0.19], [0.76, 0.28], [0.30, 0.34],
  [0.26, 0.43], [0.70, 0.49], [0.74, 0.60], [0.34, 0.68], [0.30, 0.82],
  [0.54, 0.95]]

// il guado: si scende alla riva, si costeggia l'acqua da una sponda
// all'altra e si torna giù
const BOSCO_GUADO = [
  [0.30, 0.04], [0.26, 0.14], [0.66, 0.20], [0.70, 0.30], [0.28, 0.37],
  [0.24, 0.48], [0.68, 0.55], [0.72, 0.66], [0.36, 0.73], [0.40, 0.86],
  [0.62, 0.95]]

// la radura: il sentiero gira **attorno** alla radura e poi se ne va.
// L'anello è il regalo del bosco: una torre in mezzo batte due tratti.
const BOSCO_RADURA = [
  [0.46, 0.04], [0.26, 0.11], [0.22, 0.22], [0.54, 0.28], [0.76, 0.22],
  [0.80, 0.34], [0.44, 0.40], [0.24, 0.48], [0.28, 0.60], [0.66, 0.66],
  [0.62, 0.80], [0.44, 0.95]]

// il folto: cinque denti stretti fra i tronchi, avanti e indietro
// senza respiro. Il tracciato più ripiegato del gioco.
const BOSCO_FOLTO = [
  [0.38, 0.04], [0.30, 0.12], [0.74, 0.18], [0.78, 0.28], [0.28, 0.35],
  [0.22, 0.45], [0.66, 0.51], [0.70, 0.61], [0.26, 0.68], [0.30, 0.81],
  [0.58, 0.88], [0.52, 0.95]]

// la radice: tre tornanti attorno alla radice affiorata, e via. Il
// bosco si apre: da qui i tracciati cominciano ad accorciarsi.
const BOSCO_RADICE = [
  [0.32, 0.04], [0.26, 0.16], [0.70, 0.23], [0.74, 0.34], [0.30, 0.41],
  [0.26, 0.54], [0.68, 0.61], [0.64, 0.76], [0.36, 0.84], [0.44, 0.95]]

/* ── SOTTERRANEO: cunicoli ──
   Gomiti netti e rettifili: sotto terra le gallerie le ha scavate
   qualcuno. Più corti del bosco, e via via meno ripiegati. */

// la grotta: la caverna più larga di tutte, con il pilastro in mezzo
const SOTTO_GROTTA = [
  [0.34, 0.04], [0.28, 0.16], [0.70, 0.24], [0.74, 0.38], [0.30, 0.46],
  [0.26, 0.60], [0.68, 0.68], [0.60, 0.82], [0.40, 0.95]]

// la miniera: gallerie a squadra, una sotto l'altra
const SOTTO_MINIERA = [
  [0.28, 0.04], [0.26, 0.18], [0.72, 0.24], [0.74, 0.40], [0.28, 0.48],
  [0.26, 0.64], [0.68, 0.72], [0.66, 0.95]]

// le fogne: due salti di quota dentro il collettore
const SOTTO_FOGNE = [
  [0.62, 0.04], [0.66, 0.20], [0.26, 0.30], [0.22, 0.46], [0.62, 0.56],
  [0.66, 0.72], [0.34, 0.82], [0.38, 0.95]]

// la cripta: una scala regolare che scende di loculo in loculo, tutta
// ad angoli retti — l'unica mappa che si potrebbe disegnare col righello
const SOTTO_CRIPTA = [
  [0.22, 0.04], [0.22, 0.24], [0.66, 0.24], [0.66, 0.46], [0.26, 0.46],
  [0.26, 0.68], [0.70, 0.68], [0.70, 0.86], [0.48, 0.95]]

// la gola: stretta e quasi diritta, tre gomiti e sei fuori
const SOTTO_GOLA = [
  [0.36, 0.04], [0.30, 0.16], [0.68, 0.24], [0.72, 0.40], [0.32, 0.50],
  [0.28, 0.66], [0.62, 0.76], [0.54, 0.95]]

/* ── MURA: dentro il castello ──
   Rettifili e angoli retti, e soprattutto **corti**: qui i nemici
   arrivano addosso, e una torre batte un tratto solo. */

// il cortile: si gira attorno al pozzo e si scende alla porta
const MURA_CORTILE = [
  [0.30, 0.04], [0.32, 0.26], [0.74, 0.36], [0.70, 0.62], [0.30, 0.72],
  [0.36, 0.95]]

// il camminamento: la ronda sopra le mura, un lungo rettifilo e giù
const MURA_CAMMINAMENTO = [
  [0.24, 0.04], [0.28, 0.30], [0.76, 0.42], [0.72, 0.68], [0.44, 0.95]]

// il corridoio: un dritto, un gomito, un dritto
const MURA_CORRIDOIO = [
  [0.70, 0.04], [0.64, 0.26], [0.24, 0.38], [0.28, 0.60], [0.66, 0.72],
  [0.56, 0.95]]

// la sala del trono: si entra, si taglia la sala in diagonale, si esce
// dal fondo. Nessun tornante: chi sbaglia a comprare lo vede subito.
const MURA_TRONO = [
  [0.34, 0.04], [0.38, 0.34], [0.72, 0.50], [0.64, 0.78], [0.44, 0.95]]

// il torrione: la rampa finale. Il tracciato più corto e più esposto
// del gioco — dall'ingresso alla porta ci sono quattro segmenti.
const MURA_TORRIONE = [
  [0.44, 0.04], [0.72, 0.24], [0.62, 0.52], [0.30, 0.66], [0.40, 0.95]]

/* ═══════════════ LE TAPPE ═══════════════

   `ambiente` è la chiave di `grafica/terreni/indice.js`: tre terreni
   veri — bosco, sotterraneo, mura — e quindici tavolozze, una per
   tappa, perché il viaggio si veda anche dove il terreno è lo stesso.

   `mostri` è la fila da cui `mostroDiOnda` pesca, un tipo per ondata,
   a giro. Il commento accanto a ogni fila è la sequenza dei punti
   deboli: 🏹 arciere, 🔮 magica, 💣 bombe. */
export const CAMPAGNE = [
  {
    id: 'bosco', nome: 'Il bosco', emoji: '🌲',
    /* Il bosco è la scuola. Le quattro torri entrano una alla volta, i
       sentieri sono i più lunghi e i più ripiegati del gioco, e i
       mostri sono quelli che si guardano volentieri. */
    tappe: [
      { nome: 'Il sentiero', emoji: '🌱', ambiente: 'bosco-chiaro', calcoli: 6, cap: 3,
        torri: ['add'],
        // l'unica tappa senza debolezze: con una torre sola non sarebbe una scelta
        mostri: ['slime', 'goblin'], forma: BOSCO_SENTIERO },
      { nome: 'Il guado', emoji: '💧', ambiente: 'bosco-guado', calcoli: 7, cap: 4,
        torri: ['add', 'sub'], debolezze: true,
        // 🏹 🔮 — due mostri, due torri: la debolezza al suo minimo leggibile
        mostri: ['goblin', 'slime'], forma: BOSCO_GUADO },
      { nome: 'La radura', emoji: '🍀', ambiente: 'bosco-radura', calcoli: 8, cap: 5,
        torri: ['add', 'sub'], debolezze: true,
        // 🏹 🔮 🏹 🔮
        mostri: ['ragno', 'slime', 'pipistrello', 'golem'], forma: BOSCO_RADURA },
      { nome: 'Il folto', emoji: '🌳', ambiente: 'bosco-fitto', calcoli: 10, cap: 6,
        torri: ['add', 'sub', 'mul'], debolezze: true,
        // 🏹 🔮 🏹 🔮 — entra il ghiaccio, che di debolezze non ne ha
        mostri: ['pipistrello', 'golem', 'goblin', 'fantasma'], forma: BOSCO_FOLTO },
      { nome: 'La radice', emoji: '🪵', ambiente: 'bosco-notte', calcoli: 12, cap: 7,
        torri: ['add', 'sub', 'mul', 'div'], debolezze: true,
        // 🏹 🔮 💣 🏹 🔮 💣 — arrivano le bombe, e con loro orco e scheletro
        mostri: ['ragno', 'fantasma', 'scheletro', 'goblin', 'golem', 'orco'],
        forma: BOSCO_RADICE },
    ],
  },
  {
    id: 'sotterraneo', nome: 'Il sotterraneo', emoji: '🕯️',
    /* Sotto terra tutte e quattro le torri sono aperte dal primo
       minuto: non si sblocca più niente, si sceglie. I cunicoli si
       raddrizzano tappa dopo tappa. */
    tappe: [
      { nome: 'La grotta', emoji: '🕳️', ambiente: 'grotta', calcoli: 9, cap: 5,
        torri: ['add', 'sub', 'mul', 'div'], debolezze: true,
        // 🏹 🔮 💣
        mostri: ['pipistrello', 'golem', 'scheletro'], forma: SOTTO_GROTTA },
      { nome: 'La miniera', emoji: '⛏️', ambiente: 'miniera', calcoli: 11, cap: 6,
        torri: ['add', 'sub', 'mul', 'div'], debolezze: true,
        // 💣 🏹 🔮
        mostri: ['scheletro', 'goblin', 'golem'], forma: SOTTO_MINIERA },
      { nome: 'Le fogne', emoji: '🕸️', ambiente: 'fogne', calcoli: 13, cap: 7,
        torri: ['add', 'sub', 'mul', 'div'], debolezze: true,
        // 🔮 🏹 💣
        mostri: ['slime', 'ragno', 'orco'], forma: SOTTO_FOGNE },
      { nome: 'La cripta', emoji: '⚰️', ambiente: 'cripta', calcoli: 16, cap: 8,
        torri: ['add', 'sub', 'mul', 'div'], debolezze: true,
        // 🔮 🏹 💣 🔮 🏹 💣
        mostri: ['fantasma', 'arpia', 'scheletro', 'golem', 'pipistrello', 'orco'],
        forma: SOTTO_CRIPTA },
      { nome: 'La gola', emoji: '⛰️', ambiente: 'gola', calcoli: 19, cap: 8,
        torri: ['add', 'sub', 'mul', 'div'], debolezze: true,
        // 💣 🔮 🏹 💣 🔮 🏹
        mostri: ['orco', 'golem', 'arpia', 'scheletro', 'fantasma', 'ragno'],
        forma: SOTTO_GOLA },
    ],
  },
  {
    id: 'mura', nome: 'Le mura', emoji: '🏰',
    /* Dentro il castello i percorsi si accorciano fino alla rampa del
       torrione: niente più anelli, niente più tempo regalato. Le file
       di mostri girano i tre punti deboli senza mai ripetersi, e le
       ultime due chiamano il drago. */
    tappe: [
      { nome: 'Il cortile', emoji: '🚪', ambiente: 'cortile', calcoli: 14, cap: 7,
        torri: ['add', 'sub', 'mul', 'div'], debolezze: true,
        // 🔮 💣 🏹
        mostri: ['golem', 'orco', 'arpia'], forma: MURA_CORTILE },
      { nome: 'Il camminamento', emoji: '🧱', ambiente: 'camminamento', calcoli: 18, cap: 8,
        torri: ['add', 'sub', 'mul', 'div'], debolezze: true,
        // 🏹 🔮 💣 — e due su tre volano, che sopra le mura è il posto giusto
        mostri: ['arpia', 'fantasma', 'scheletro'], forma: MURA_CAMMINAMENTO },
      { nome: 'Il corridoio', emoji: '🗝️', ambiente: 'corridoio', calcoli: 22, cap: 9,
        torri: ['add', 'sub', 'mul', 'div'], debolezze: true,
        // 🏹 🔮 💣 🏹 🔮 💣
        mostri: ['pipistrello', 'slime', 'scheletro', 'arpia', 'fantasma', 'orco'],
        forma: MURA_CORRIDOIO },
      { nome: 'La sala del trono', emoji: '👑', ambiente: 'trono', calcoli: 26, cap: 10,
        torri: ['add', 'sub', 'mul', 'div'], debolezze: true,
        // 🔮 🏹 💣 🔮 🏹 💣 — il drago chiude ogni giro
        mostri: ['golem', 'arpia', 'orco', 'fantasma', 'pipistrello', 'drago'],
        forma: MURA_TRONO },
      { nome: 'Il torrione', emoji: '🏰', ambiente: 'bastione', calcoli: 30, cap: 10,
        torri: ['add', 'sub', 'mul', 'div'], debolezze: true,
        // 🏹 🔮 💣 🏹 🔮 💣 — sei bestie diverse sul tracciato più corto
        mostri: ['ragno', 'golem', 'orco', 'arpia', 'fantasma', 'drago'],
        forma: MURA_TORRIONE },
    ],
  },
]

/* la fila di tutte le tappe, nell'ordine in cui si giocano: è l'indice
   che il profilo salva, e i confini di campagna servono solo a
   raccontarla sulla mappa */
export const RACCONTO = CAMPAGNE.flatMap(c =>
  c.tappe.map(t => ({ ...t, campagna: c.id, debolezze: !!t.debolezze })))

/* a che campagna appartiene la tappa numero `i` */
export const campagnaDi = i => RACCONTO[i] && RACCONTO[i].campagna
