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
   ci dispone le postazioni ai lati, alternate, **partendo dal
   castello**: ogni torre nuova allunga la difesa verso l'ingresso.

   ── il riquadro vero ──
   Il campo non è verticale, anche se il gioco lo è: `.campo` in
   `TowerDefense.vue` è alto `min(52vh, 420px)` e largo al massimo
   520px. Su un telefono sono circa 390×420, sul computer 520×420 —
   cioè un riquadro **quasi quadrato, semmai largo**. Le mappe si
   disegnano per quella forma lì, non per una colonna.

   ── i margini, e perché ──
     x ∈ [0.03, 0.97]   una strada che tocca il bordo sembra tagliata
     y ∈ [0.25, 0.92]   in alto a destra c'è la scheda del mostro, e il
                        castello in fondo al percorso è alto una
                        cinquantina di unità sopra il suo piede
   Il percorso entra sempre dal bordo sinistro ed esce a destra: da lì
   arrivano i nemici, lì c'è il castello da difendere.

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
   Il raggio di una torre va da 86 a 132 unità: su un campo largo 400
   una torre ne vede un bel pezzo. Quello che conta non è la lunghezza
   in sé ma **quanta strada ogni torre tiene sotto tiro** — un
   tracciato che si ripiega si fa battere due o tre volte dalla stessa
   torre, uno diritto una volta sola. Il validatore la chiama
   `presidio` (strada per postazione, misurata in raggi d'arciere), e
   scende di campagna in campagna:

     Bosco        ~2,38     sentieri che si ripiegano: perdonano
     Sotterraneo  ~2,14     cunicoli: qualche gomito, meno regali
     Mura         ~1,97     rettifili: una torre, un tratto, e basta

   La lunghezza segue: nel Bosco stanno tutti fra 820 e 950 unità,
   nelle Mura si scende fino a 474 — dall'ingresso alla porta del
   torrione ci sono quattro segmenti, ed è l'ultima tappa apposta. */

/* ── BOSCO: sentieri che si perdono nel verde ──
   Curve larghe, diagonali, niente spigoli. */

// il sentiero: sale e scende fra i tronchi tre volte. È il tracciato
// più ripiegato del gioco insieme al folto, ed è la prima tappa: chi
// comincia ha bisogno di tempo, non di sconti sui nemici.
const BOSCO_SENTIERO = [
  [0.03, 0.28], [0.24, 0.26], [0.32, 0.50], [0.22, 0.74], [0.42, 0.88],
  [0.58, 0.72], [0.52, 0.48], [0.62, 0.30], [0.80, 0.36], [0.86, 0.62], [0.97, 0.82]]

// il guado: si scende alla riva, si costeggia l'acqua, si risale
// sull'altra sponda e si esce in alto
const BOSCO_GUADO = [
  [0.03, 0.28], [0.26, 0.28], [0.34, 0.52], [0.22, 0.76], [0.46, 0.90],
  [0.68, 0.80], [0.60, 0.54], [0.74, 0.36], [0.90, 0.46], [0.97, 0.70]]

// la radura: il sentiero gira **attorno** alla radura e poi se ne va.
// L'anello è il regalo del bosco: una torre in mezzo batte due tratti.
const BOSCO_RADURA = [
  [0.03, 0.32], [0.24, 0.28], [0.46, 0.32], [0.54, 0.50], [0.42, 0.64],
  [0.24, 0.62], [0.16, 0.80], [0.40, 0.90], [0.64, 0.84], [0.72, 0.64],
  [0.88, 0.54], [0.97, 0.70]]

// il folto: quattro denti stretti fra i tronchi, su e giù senza respiro
const BOSCO_FOLTO = [
  [0.03, 0.30], [0.20, 0.28], [0.28, 0.52], [0.20, 0.76], [0.40, 0.88],
  [0.54, 0.70], [0.48, 0.46], [0.62, 0.32], [0.78, 0.42], [0.82, 0.66], [0.97, 0.78]]

// la radice: due grandi tornanti attorno alla radice affiorata, e via.
// Il bosco si apre: da qui i tracciati cominciano ad accorciarsi.
const BOSCO_RADICE = [
  [0.03, 0.34], [0.30, 0.30], [0.44, 0.50], [0.22, 0.70], [0.48, 0.90],
  [0.74, 0.78], [0.62, 0.54], [0.84, 0.42], [0.97, 0.62]]

/* ── SOTTERRANEO: cunicoli ──
   Gomiti netti e rettifili: sotto terra le gallerie le ha scavate
   qualcuno. Più corti del bosco, e via via meno ripiegati. */

// la grotta: la caverna più larga di tutte, con il pilastro in mezzo
const SOTTO_GROTTA = [
  [0.03, 0.30], [0.26, 0.30], [0.46, 0.42], [0.40, 0.66], [0.18, 0.74],
  [0.36, 0.90], [0.60, 0.86], [0.72, 0.66], [0.64, 0.44], [0.82, 0.36], [0.97, 0.48]]

// la miniera: gallerie a squadra, una sotto l'altra
const SOTTO_MINIERA = [
  [0.03, 0.30], [0.34, 0.30], [0.36, 0.56], [0.14, 0.62], [0.18, 0.84],
  [0.52, 0.86], [0.56, 0.62], [0.97, 0.66]]

// le fogne: due salti di quota dentro il collettore
const SOTTO_FOGNE = [
  [0.03, 0.30], [0.24, 0.30], [0.28, 0.54], [0.48, 0.60], [0.44, 0.84],
  [0.70, 0.88], [0.78, 0.64], [0.97, 0.56]]

// la cripta: una scala regolare che scende di loculo in loculo, tutta
// ad angoli retti — l'unica mappa che si potrebbe disegnare col righello
const SOTTO_CRIPTA = [
  [0.03, 0.28], [0.26, 0.28], [0.28, 0.48], [0.50, 0.48], [0.52, 0.68],
  [0.74, 0.68], [0.76, 0.88], [0.97, 0.88]]

// la gola: stretta e quasi diritta, due gomiti e sei fuori
const SOTTO_GOLA = [
  [0.03, 0.32], [0.28, 0.38], [0.36, 0.62], [0.60, 0.70], [0.72, 0.52],
  [0.88, 0.62], [0.97, 0.82]]

/* ── MURA: dentro il castello ──
   Rettifili e angoli retti, e soprattutto **corti**: qui i nemici
   arrivano addosso, e una torre batte un tratto solo. */

// il cortile: si gira attorno al pozzo e si sale al camminamento
const MURA_CORTILE = [
  [0.03, 0.30], [0.30, 0.30], [0.34, 0.58], [0.14, 0.66], [0.22, 0.86],
  [0.58, 0.88], [0.62, 0.62], [0.97, 0.62]]

// il camminamento: la ronda sopra le mura, un lungo rettifilo e giù
const MURA_CAMMINAMENTO = [
  [0.03, 0.30], [0.56, 0.28], [0.68, 0.54], [0.38, 0.72], [0.54, 0.90], [0.97, 0.88]]

// il corridoio: un dritto, un gomito, un dritto
const MURA_CORRIDOIO = [
  [0.03, 0.34], [0.40, 0.32], [0.54, 0.58], [0.34, 0.80], [0.64, 0.90], [0.97, 0.80]]

// la sala del trono: si entra, si taglia la sala in diagonale, si esce
// dal fondo. Nessun tornante: chi sbaglia a comprare lo vede subito.
const MURA_TRONO = [
  [0.03, 0.36], [0.32, 0.34], [0.40, 0.66], [0.70, 0.74], [0.80, 0.46], [0.97, 0.44]]

// il torrione: la rampa finale. Il tracciato più corto e più esposto
// del gioco — dall'ingresso alla porta ci sono quattro segmenti.
const MURA_TORRIONE = [
  [0.03, 0.34], [0.36, 0.40], [0.52, 0.66], [0.78, 0.72], [0.97, 0.56]]

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
