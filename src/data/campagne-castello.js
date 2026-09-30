/* Le campagne del castello: quello che di una tappa si racconta (nome,
   terreno, percorso, mostri, torri). `calcoli` è la sola promessa: vedi
   docs/castello/campagne.md, torri.md e mostri.md. Il commento accanto a
   ogni fila dice chi lascia fuori: 🏹 arciere, 🔮 magica, 💣 bombe, ❄️ ghiaccio. */

// I percorsi: una `forma` è una spezzata in coordinate 0-1 sul riquadro del
// campo (420×760, verticale). Le descrizioni di ogni tracciato, il presidio
// per campagna e le distanze minime stanno in docs/castello/campagne.md.

const BOSCO_SENTIERO = [
  [0.36, 0.04], [0.30, 0.13], [0.72, 0.19], [0.76, 0.28], [0.30, 0.34],
  [0.26, 0.43], [0.70, 0.49], [0.74, 0.60], [0.34, 0.68], [0.30, 0.82],
  [0.54, 0.95]]

const BOSCO_GUADO = [
  [0.30, 0.04], [0.26, 0.14], [0.66, 0.20], [0.70, 0.30], [0.28, 0.37],
  [0.24, 0.48], [0.68, 0.55], [0.72, 0.66], [0.36, 0.73], [0.40, 0.86],
  [0.62, 0.95]]

const BOSCO_RADURA = [
  [0.46, 0.04], [0.26, 0.11], [0.22, 0.22], [0.54, 0.28], [0.76, 0.22],
  [0.80, 0.34], [0.44, 0.40], [0.24, 0.48], [0.28, 0.60], [0.66, 0.66],
  [0.62, 0.80], [0.44, 0.95]]

const BOSCO_FOLTO = [
  [0.38, 0.04], [0.30, 0.12], [0.74, 0.18], [0.78, 0.28], [0.28, 0.35],
  [0.22, 0.45], [0.66, 0.51], [0.70, 0.61], [0.26, 0.68], [0.30, 0.81],
  [0.58, 0.88], [0.52, 0.95]]

const BOSCO_RADICE = [
  [0.32, 0.04], [0.26, 0.16], [0.70, 0.23], [0.74, 0.34], [0.30, 0.41],
  [0.26, 0.54], [0.68, 0.61], [0.64, 0.76], [0.36, 0.84], [0.44, 0.95]]

const SOTTO_GROTTA = [
  [0.34, 0.04], [0.28, 0.16], [0.70, 0.24], [0.74, 0.38], [0.30, 0.46],
  [0.26, 0.60], [0.68, 0.68], [0.60, 0.82], [0.40, 0.95]]

const SOTTO_MINIERA = [
  [0.28, 0.04], [0.26, 0.18], [0.72, 0.24], [0.74, 0.40], [0.28, 0.48],
  [0.26, 0.64], [0.68, 0.72], [0.66, 0.95]]

// le fogne: la prima tappa con due ingressi. Le due si avvicinano solo in
// fondo (dove la porta è una): unite prima, i due ingressi non li
// guarderebbe più nessuno.
const SOTTO_FOGNE = [
  [[0.22, 0.04], [0.13, 0.16], [0.32, 0.26], [0.14, 0.38], [0.32, 0.50], [0.16, 0.62],
   [0.30, 0.76], [0.50, 0.95]],
  [[0.74, 0.04], [0.83, 0.16], [0.64, 0.26], [0.82, 0.38], [0.64, 0.50], [0.80, 0.62],
   [0.66, 0.76], [0.50, 0.95]]]

const SOTTO_CRIPTA = [
  [0.22, 0.04], [0.22, 0.24], [0.66, 0.24], [0.66, 0.46], [0.26, 0.46],
  [0.26, 0.68], [0.70, 0.68], [0.70, 0.86], [0.48, 0.95]]

const SOTTO_GOLA = [
  [0.36, 0.04], [0.30, 0.16], [0.68, 0.24], [0.72, 0.40], [0.32, 0.50],
  [0.28, 0.66], [0.62, 0.76], [0.54, 0.95]]

const MURA_CORTILE = [
  [0.30, 0.04], [0.32, 0.26], [0.74, 0.36], [0.70, 0.62], [0.30, 0.72],
  [0.36, 0.95]]

const MURA_CAMMINAMENTO = [
  [0.24, 0.04], [0.28, 0.30], [0.76, 0.42], [0.72, 0.68], [0.44, 0.95]]

const MURA_CORRIDOIO = [
  [0.70, 0.04], [0.64, 0.26], [0.24, 0.38], [0.28, 0.60], [0.66, 0.72],
  [0.56, 0.95]]

const MURA_TRONO = [
  [0.34, 0.04], [0.38, 0.34], [0.72, 0.50], [0.64, 0.78], [0.44, 0.95]]

const MURA_TORRIONE = [
  [[0.24, 0.04], [0.34, 0.22], [0.16, 0.40], [0.32, 0.58], [0.22, 0.76], [0.48, 0.95]],
  [[0.76, 0.04], [0.66, 0.24], [0.84, 0.42], [0.68, 0.60], [0.78, 0.78], [0.48, 0.95]]]


// Palude: le strade si possono fondere (Y, anello, immissione), perché il
// `Percorso` chiede solo che ognuna sappia dov'è il suo ingresso e dove il
// castello. Vedi docs/castello/campagne.md.
const PALUDE_TRONCO = [[0.36, 0.66], [0.46, 0.80], [0.50, 0.95]]
const PALUDE_GUADO = [
  [[0.14, 0.04], [0.08, 0.28], [0.18, 0.52], ...PALUDE_TRONCO],
  [[0.84, 0.04], [0.92, 0.28], [0.82, 0.52], [0.62, 0.62], ...PALUDE_TRONCO]]

const PALUDE_SBOCCO = [[0.44, 0.86], [0.50, 0.95]]
const PALUDE_CANNETO = [
  [[0.18, 0.04], [0.12, 0.22], [0.30, 0.36], [0.14, 0.54], [0.28, 0.72], ...PALUDE_SBOCCO],
  [[0.86, 0.04], [0.90, 0.28], [0.80, 0.54], [0.68, 0.74], ...PALUDE_SBOCCO]]

const ISOLE_TESTA = [[0.50, 0.04], [0.50, 0.14]]
const ISOLE_CODA = [[0.50, 0.78], [0.50, 0.95]]
const PALUDE_ISOLE = [
  [...ISOLE_TESTA, [0.14, 0.22], [0.10, 0.48], [0.30, 0.70], ...ISOLE_CODA],
  [...ISOLE_TESTA, [0.86, 0.22], [0.90, 0.48], [0.70, 0.70], ...ISOLE_CODA]]

const PALUDE_PANTANO = [
  [[0.16, 0.04], [0.10, 0.24], [0.26, 0.44], [0.10, 0.64], [0.26, 0.82], [0.50, 0.95]],
  [[0.84, 0.04], [0.90, 0.24], [0.74, 0.44], [0.90, 0.64], [0.74, 0.82], [0.50, 0.95]]]

const FOCE_NODO = [[0.50, 0.56]]
const FOCE_PORTA = [[0.50, 0.95]]
const PALUDE_FOCE = [
  [[0.14, 0.04], [0.08, 0.26], [0.26, 0.42], ...FOCE_NODO,
   [0.28, 0.70], [0.38, 0.86], ...FOCE_PORTA],
  [[0.86, 0.04], [0.92, 0.26], [0.74, 0.42], ...FOCE_NODO,
   [0.72, 0.70], [0.62, 0.86], ...FOCE_PORTA]]

/* ═══════════════ LE PARTITE LIBERE: UNA PER TERRENO ═══════════════

   Finita la campagna si aprono **quattro** partite senza fine, una per
   terreno, e ognuna ha il tracciato più intricato del suo mondo: qui
   non c'è più niente da insegnare, quindi la mappa può usare tutto
   quello che il `Percorso` sa fare — due forme che condividono dei
   punti sono una Y, un anello, una clessidra — e una torre ben messa
   deve poter battere la stessa strada due o tre volte. Ce n'era una
   sola, a strada singola, ed era una scelta di prudenza: con due
   bocche si temeva che la taratura non tornasse. Adesso ognuna si tara
   da sola, ondata per ondata, e quello che si temeva si misura.

     la radura grande   una bocca sola che si sdoppia attorno a una
                        radura larga mezzo campo — due bracci serpentini
                        — e si richiude in un tronco che si ripiega
                        ancora prima della porta
     il bivio           due cunicoli a squadra, uno per bocca, che
                        scendono a zig-zag e si incontrano a metà campo;
                        da lì una galleria sola, a scala, fino in fondo
     il bastione        una strada sola che fa un cappio a squadra e
                        **si attraversa da sé**: l'unica a una bocca,
                        e l'unica dove un mostro passa due volte dallo
                        stesso punto
     il delta           due canali che serpeggiano, si fondono in un
                        tronco, e il tronco si sdoppia attorno a
                        un'isola per richiudersi davanti alla porta

   I vincoli sono gli stessi delle tappe (`strumenti/valida-percorsi.mjs`
   le passa ai raggi X con le altre): niente tornanti a spillo, niente
   corsie che si sfiorano senza fondersi, e mai più di metà strada in
   comune — se no le due bocche sono un disegno. Un incrocio si
   **dichiara** (`incroci: 1`), e vale solo se è netto: due tratti che
   si tagliano a angolo largo, non due che si sfiorano. */

const RADURA_TRONCO = [[0.50, 0.68], [0.28, 0.76], [0.34, 0.86], [0.50, 0.95]]
const LIBERA_BOSCO = [
  [[0.50, 0.04], [0.50, 0.09], [0.20, 0.15], [0.14, 0.26], [0.40, 0.33], [0.16, 0.44],
   [0.12, 0.56], [0.36, 0.62], ...RADURA_TRONCO],
  [[0.50, 0.04], [0.50, 0.09], [0.80, 0.15], [0.86, 0.26], [0.60, 0.33], [0.84, 0.44],
   [0.88, 0.56], [0.64, 0.62], ...RADURA_TRONCO]]

const BIVIO_GALLERIA = [[0.50, 0.50], [0.50, 0.60], [0.24, 0.60], [0.24, 0.74], [0.70, 0.74],
                        [0.70, 0.86], [0.50, 0.86], [0.50, 0.95]]
const LIBERA_SOTTERRANEO = [
  [[0.20, 0.04], [0.20, 0.16], [0.40, 0.16], [0.40, 0.28], [0.14, 0.28], [0.14, 0.40],
   [0.40, 0.40], [0.40, 0.50], ...BIVIO_GALLERIA],
  [[0.80, 0.04], [0.80, 0.16], [0.60, 0.16], [0.60, 0.28], [0.86, 0.28], [0.86, 0.40],
   [0.60, 0.40], [0.60, 0.50], ...BIVIO_GALLERIA]]

/* ── il bastione: una strada sola, che si incrocia da sé ──
   È l'unica libera a una bocca, ed è **un anello vero**: la strada
   scende lungo il cortile, gira a sinistra sotto la torre, risale, e
   attraversa sé stessa — a squadra, com'è tutto sulle mura — prima di
   scendere dall'altra parte fino alla porta. Un mostro passa **due
   volte** dallo stesso punto (l’incrocio, a `(0.58, 0.21)`), e le torri
   piazzate lì gli sparano all’andata e al ritorno: è il regalo di
   questo terreno, come i due bracci lo sono della radura. Non ha una
   seconda bocca perché le due cose insieme non ci stanno — un
   cappio largo tutto il campo è già la difesa divisa in due, solo
   che qui si divide **nel tempo** e non nello spazio.

   Le due braccia del cappio distano fra loro più delle corsie (109u fra
   il gambo e la discesa, 182 fra la traversa e il fondo), e
   l'incrocio è dichiarato (`incroci: 1`): il validatore ammette
   quello, netto e a angolo retto, e continua a vietare le corsie che
   si sfiorano senza incrociarsi. Nel fondale la cella dell'incrocio
   chiede la tessera a croce, che il foglio delle mura ha. */
const LIBERA_MURA = [
  [0.58, 0.04], [0.58, 0.45], [0.20, 0.45], [0.20, 0.21], [0.84, 0.21], [0.84, 0.64],
  [0.50, 0.64], [0.50, 0.95]]

const DELTA_TRONCO = [[0.50, 0.44], [0.50, 0.54]]
const DELTA_PORTA = [[0.50, 0.84], [0.50, 0.95]]
const LIBERA_PALUDE = [
  [[0.14, 0.04], [0.08, 0.16], [0.30, 0.24], [0.10, 0.34], [0.30, 0.40], ...DELTA_TRONCO,
   [0.22, 0.62], [0.18, 0.74], [0.36, 0.80], ...DELTA_PORTA],
  [[0.86, 0.04], [0.92, 0.16], [0.70, 0.24], [0.90, 0.34], [0.70, 0.40], ...DELTA_TRONCO,
   [0.78, 0.62], [0.82, 0.74], [0.64, 0.80], ...DELTA_PORTA]]

// Quello che di una libera si racconta: il resto (torri, mostri, rami) lo
// eredita dalla sua campagna. Vedi docs/castello/libere.md.
export const LIBERE_RACCONTO = [
  { chiave: 'libera-bosco', campagna: 'bosco', nome: 'La radura grande', emoji: '🌲',
    fronti: 1.5, forme: LIBERA_BOSCO },
  { chiave: 'libera-sotterraneo', campagna: 'sotterraneo', nome: 'Il bivio', emoji: '🕯️',
    fronti: 1.5, forme: LIBERA_SOTTERRANEO },
  { chiave: 'libera-mura', campagna: 'mura', nome: 'Il bastione', emoji: '🏰',
    forme: [LIBERA_MURA], incroci: 1 },
  { chiave: 'libera-palude', campagna: 'palude', nome: 'Il delta', emoji: '🐸',
    fronti: 1.5, forme: LIBERA_PALUDE },
]

// `ambiente` è la chiave di `grafica/terreni/indice.js`: tre terreni veri —
// bosco, sotterraneo, mura — e venti tavolozze, una per tappa. `mostri` è la
// fila da cui `mostroDiOnda` pesca; il commento accanto dice, ondata per
// ondata, le torri a cui quel mostro è immune (🏹 arciere, 🔮 magica, 💣
// bombe, ❄️ ghiaccio). Vedi docs/castello/campagne.md e mostri.md.
export const CAMPAGNE = [
  {
    id: 'bosco', nome: 'Il bosco', emoji: '🌲',
    tappe: [
      { nome: 'Il sentiero', emoji: '🌱', ambiente: 'bosco-chiaro', calcoli: 6, cap: 3,
        torri: ['add'],
        // — · 💣❄️
        mostri: ['slime', 'pipistrello'], forma: BOSCO_SENTIERO },
      { nome: 'Il guado', emoji: '💧', ambiente: 'bosco-guado', calcoli: 7, cap: 4,
        torri: ['add', 'sub'], rami: true,
        // — · —
        mostri: ['slime', 'goblin'], forma: BOSCO_GUADO },
      { nome: 'La radura', emoji: '🍀', ambiente: 'bosco-radura', calcoli: 8, cap: 5,
        torri: ['add', 'sub'], rami: true,
        // 💣❄️ · — · — · —
        mostri: ['pipistrello', 'ragno', 'slime', 'goblin'], forma: BOSCO_RADURA },
      { nome: 'Il folto', emoji: '🌳', ambiente: 'bosco-fitto', calcoli: 10, cap: 6,
        torri: ['add', 'sub', 'mul'], rami: true,
        // 💣❄️ · — · — · 🏹💣
        mostri: ['pipistrello', 'slime', 'goblin', 'fantasma'], forma: BOSCO_FOLTO },
      { nome: 'La radice', emoji: '🪵', ambiente: 'bosco-notte', calcoli: 12, cap: 7,
        torri: ['add', 'sub', 'mul', 'div'], rami: true, capo: true,
        // 💣❄️ · — · 🔮❄️ · 🏹💣 · 🏹🔮 · —
        mostri: ['arpia', 'ragno', 'scheletro', 'fantasma', 'golem', 'orco'],
        forma: BOSCO_RADICE },
    ],
  },
  {
    id: 'sotterraneo', nome: 'Il sotterraneo', emoji: '🕯️',
    tappe: [
      { nome: 'La grotta', emoji: '🕳️', ambiente: 'grotta', calcoli: 9, cap: 5,
        torri: ['add', 'sub', 'mul', 'div'], rami: true,
        // 💣❄️ · 🏹🔮 · 🔮❄️
        mostri: ['pipistrello', 'golem', 'scheletro'], forma: SOTTO_GROTTA },
      { nome: 'La miniera', emoji: '⛏️', ambiente: 'miniera', calcoli: 11, cap: 6,
        torri: ['add', 'sub', 'mul', 'div'], rami: true,
        // 🔮❄️ · — · — · 🏹🔮 · 💣❄️
        mostri: ['scheletro', 'goblin', 'verme', 'golem', 'pipistrello'], forma: SOTTO_MINIERA },
      { nome: 'Le fogne', emoji: '🕸️', ambiente: 'fogne', calcoli: 13, cap: 7,
        torri: ['add', 'sub', 'mul', 'div'], rami: true,
        // — · — · — · 💣🔮 · 🏹💣
        mostri: ['verme', 'ragno', 'slime', 'blatta', 'fantasma'], forme: SOTTO_FOGNE },
      { nome: 'La cripta', emoji: '⚰️', ambiente: 'cripta', calcoli: 16, cap: 8,
        torri: ['add', 'sub', 'mul', 'div'], rami: true,
        // 💣❄️ · 🏹💣 · 🔮❄️ · 🏹🔮 · 💣❄️ · —
        mostri: ['pipistrello', 'fantasma', 'scheletro', 'golem', 'arpia', 'orco'],
        forma: SOTTO_CRIPTA },
      { nome: 'La gola', emoji: '⛰️', ambiente: 'gola', calcoli: 19, cap: 8,
        torri: ['add', 'sub', 'mul', 'div'], rami: true, capo: true,
        // 🔮❄️ · 🏹🔮 · — · 💣❄️ · 🏹💣 · —
        mostri: ['scheletro', 'golem', 'orco', 'arpia', 'fantasma', 'ragno'],
        forma: SOTTO_GOLA },
    ],
  },
  {
    id: 'mura', nome: 'Le mura', emoji: '🏰',
    tappe: [
      { nome: 'Il cortile', emoji: '🚪', ambiente: 'cortile', calcoli: 14, cap: 7,
        torri: ['add', 'sub', 'mul', 'div'], rami: true,
        // 💣❄️ · 🏹🔮 · —
        mostri: ['arpia', 'golem', 'orco'], forma: MURA_CORTILE },
      { nome: 'Il camminamento', emoji: '🧱', ambiente: 'camminamento', calcoli: 18, cap: 8,
        torri: ['add', 'sub', 'mul', 'div'], rami: true,
        // 💣❄️ · 🏹💣 · 💣❄️ · 🏹🔮
        mostri: ['arpia', 'fantasma', 'pipistrello', 'corazziere'], forma: MURA_CAMMINAMENTO },
      { nome: 'Il corridoio', emoji: '🗝️', ambiente: 'corridoio', calcoli: 22, cap: 9,
        torri: ['add', 'sub', 'mul', 'div'], rami: true, divisioni: 2,
        // 💣❄️ · — · 🔮❄️ · 💣❄️ · — · 🏹💣
        mostri: ['pipistrello', 'slime', 'scheletro', 'arpia', 'orco', 'fantasma'],
        forma: MURA_CORRIDOIO },
      { nome: 'La sala del trono', emoji: '👑', ambiente: 'trono', calcoli: 26, cap: 10,
        torri: ['add', 'sub', 'mul', 'div'], rami: true, divisioni: 2,
        // 💣❄️ · — · 🏹💣 · — · 💣❄️ · 🔮💣 · — · — · 🏹🔮
        mostri: ['arpia', 'orco', 'fantasma', 'balestriere', 'pipistrello', 'drago',
                 'ragno', 'slime', 'golem'],
        forma: MURA_TRONO },
      { nome: 'Il torrione', emoji: '🏰', ambiente: 'bastione', calcoli: 30, cap: 10,
        torri: ['add', 'sub', 'mul', 'div'], rami: true, divisioni: 2, capo: true,
        // 💣❄️ · 🏹🔮 · — · 🏹💣 · — · — · — · — · 🔮💣
        mostri: ['arpia', 'golem', 'ragno', 'fantasma', 'orco', 'balestriere', 'slime',
                 'ragno', 'drago'],
        forme: MURA_TORRIONE },
    ],
  },
  {
    id: 'palude', nome: 'La palude', emoji: '🐸',
    tappe: [
      { nome: 'Il guado', emoji: '💧', ambiente: 'palude-alba', calcoli: 12, cap: 8,
        torri: ['add', 'sub', 'mul', 'div'], rami: true,
        // — · — · — · 🔮💣 · 🏹💣
        mostri: ['verme', 'lupo', 'verme', 'blatta', 'rovo'], fronti: 1.5, forme: PALUDE_GUADO },
      { nome: 'Il canneto', emoji: '🌾', ambiente: 'palude-verde', calcoli: 14, cap: 8,
        torri: ['add', 'sub', 'mul', 'div'], rami: true,
        // 💣❄️ · 🏹🔮 · 🏹💣 · — · — · —
        mostri: ['corvo', 'troll', 'rovo', 'lupo', 'verme', 'lupo'], fronti: 1.9, forme: PALUDE_CANNETO },
      { nome: 'Le isole', emoji: '🏝️', ambiente: 'palude-stagno', calcoli: 18, cap: 9,
        torri: ['add', 'sub', 'mul', 'div'], rami: true, divisioni: 2,
        // 🔮💣 · 🏹🔮 · — · 💣❄️ · — · —
        mostri: ['blatta', 'troll', 'verme', 'corvo', 'lupo', 'verme'], fronti: 1.5, forme: PALUDE_ISOLE },
      { nome: 'Il pantano', emoji: '🪵', ambiente: 'palude-marcio', calcoli: 21, cap: 10,
        torri: ['add', 'sub', 'mul', 'div'], rami: true, divisioni: 2,
        // — · 🏹🔮 · — · 💣❄️ · — · — · 🏹💣 · — · 🔮💣
        mostri: ['lupo', 'troll', 'verme', 'corvo', 'lupo', 'verme', 'rovo', 'lupo', 'blatta'],
        forme: PALUDE_PANTANO },
      { nome: 'La foce', emoji: '🌊', ambiente: 'palude-torce', calcoli: 24, cap: 10,
        torri: ['add', 'sub', 'mul', 'div'], rami: true, divisioni: 2, capo: true,
        // 🔮💣 · 🏹🔮 · 🔮💣 · 💣❄️ · — · —
        mostri: ['drago', 'troll', 'blatta', 'corvo', 'lupo', 'verme'], fronti: 1.6, forme: PALUDE_FOCE },
    ],
  },
]

// La fila di tutte le tappe, nell'ordine in cui si giocano: è l'indice che
// il profilo salva. `portata` si ricava dal `cap` (non si dichiara a mano):
// vedi docs/castello/campagne.md.
const LIVELLO_CAP = cap => Math.round(37 + (cap - 3) * (75 - 37) / 7)

const CON_ABILITA = new Set(['sotterraneo', 'mura', 'palude'])
// `divisioni: 2` sulla tappa: chi si divide si divide due volte (mostri.md).

export const RACCONTO = CAMPAGNE.flatMap(c =>
  c.tappe.map(t => ({ ...t, campagna: c.id, abilita: CON_ABILITA.has(c.id), capo: !!t.capo,
                      portata: LIVELLO_CAP(t.cap) })))

export const campagnaDi = i => RACCONTO[i] && RACCONTO[i].campagna
