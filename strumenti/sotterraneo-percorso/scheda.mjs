// La scheda del mondo a percorso, in prova (docs/sotterraneo/mondo-a-percorso.md): il tracciato a serpentina, le sette zone
// in fila col loro livello, i dungeon di ogni zona, le città, la pianta fissa del villaggio, le terre successive. Dato puro, la
// legge solo il prototipo del generatore (genera.mjs) e la pianta (`npm run pianta -- --percorso`). Quando il progetto passa al
// gioco questa scheda diventa dati/mondo-aperto.js: le chiavi dei dungeon della storia e dei luoghi sono quelle di oggi.

// le misure: 352×216 celle, la mezza larghezza del corridoio di una zona, quanto sale una terra dopo l'altra
export const PERCORSO = { seme: 8, largo: 352, alto: 216, mezza: 24, salto: 14, terre: 5 }

// La strada maestra: i punti di passaggio (in celle, la riga 0 a nord) per cui passa la curva, dal cancello del villaggio
// alla fine della landa. Tre file: in basso verso est (villaggio, prati, bosco), si sale a est, in mezzo verso ovest
// (brughiera, palude, ceneri), si sale a ovest, in alto verso est (monte, landa)
export const TRACCIATO = [
  [44, 174], [64, 164], [88, 183], [114, 170], [141, 189], [169, 173], [198, 189], [229, 170], [257, 186], [284, 170], [308, 178],
  [321, 156], [317, 130],
  [295, 112], [268, 128], [240, 104], [211, 120], [183, 101], [154, 120], [125, 101], [97, 117], [68, 101], [40, 112],
  [26, 88], [30, 62],
  [51, 42], [79, 56], [108, 34], [136, 50], [165, 31], [194, 47], [222, 31], [251, 50], [279, 34], [310, 45],
]

// Le zone in fila (l'ordine e il numero li ha approvati l'utente il 20 ottobre 2026). `peso`: quanta strada maestra prende
// (in proporzione); `fascia`: il livello dei mostri all'entrata e in fondo alla zona; `luoghi`: le regioni di oggi che diventano
// i suoi pezzi (le chiavi restano: le taglie le nominano), in fila lungo la strada; `confine`: come si passa nella zona dopo
// (`ponte` su un fiume, `valico` in una cresta), con il modello del ponte e il nome se la storia lo dice; `dungeon`: dove
// stanno (f: a che punto della zona, lato: a sinistra +1 o a destra −1 della strada guardando avanti, fondo: quante celle
// dentro). `habitat`: quelli di dati/mondo-aperto.js
export const ZONE = [
  { chiave: 'prati', nome: 'I prati del cimitero', peso: 0.85, fascia: [1, 3], colore: [128, 168, 88],
    luoghi: [['campi', 'campi'], ['mulino', 'prato'], ['cimitero', 'cimitero'], ['frutteto', 'frutteto']],
    confine: { tipo: 'ponte', modello: 'arco', nome: 'Il ponte del mulino' },
    dungeon: [{ chiave: 'altare', f: 0.18, lato: 1, fondo: 11 }, { chiave: 'cantine', f: 0.72, lato: -1, fondo: 13 }] },
  { chiave: 'bosco', nome: 'Il bosco vecchio', peso: 1.1, fascia: [3, 5], colore: [64, 120, 64],
    luoghi: [['lago', 'lago'], ['bosco', 'bosco'], ['lupi', 'foresta']],
    confine: { tipo: 'valico', nome: 'La salita della brughiera' },
    dungeon: [{ chiave: 'torre', f: 0.3, lato: -1, fondo: 13 }, { chiave: 'gallerie', f: 0.74, lato: 1, fondo: 14 }] },
  { chiave: 'brughiera', nome: 'La brughiera', peso: 1.2, fascia: [5, 7], colore: [150, 120, 120],
    luoghi: [['colle', 'rovine'], ['brughiera', 'brughiera'], ['corvi', 'brughiera'], ['rovine', 'rovine']],
    confine: { tipo: 'ponte', modello: 'arco', nome: 'Il ponte del guado' },
    dungeon: [{ chiave: 'cerchio', f: 0.3, lato: 1, fondo: 14 }, { chiave: 'corvaia', f: 0.72, lato: -1, fondo: 14 }] },
  { chiave: 'palude', nome: 'La palude', peso: 1, fascia: [7, 9], colore: [92, 120, 104],
    luoghi: [['guado', 'prato'], ['accampamento', 'prato'], ['palude', 'palude'], ['secco', 'secco']],
    confine: { tipo: 'ponte', modello: 'passerella', nome: 'La passerella delle ceneri' },
    dungeon: [{ chiave: 'cisterna', f: 0.55, lato: 1, fondo: 13 }, { chiave: 'palafitta', f: 0.85, lato: -1, fondo: 13 }] },
  { chiave: 'ceneri', nome: 'La piana delle ceneri', peso: 1, fascia: [9, 11], colore: [128, 92, 76],
    luoghi: [['ceneri', 'ceneri'], ['ossa', 'ceneri'], ['colline', 'roccia']],
    confine: { tipo: 'valico', nome: 'Il valico del passo' },
    dungeon: [{ chiave: 'labirinto', f: 0.3, lato: 1, fondo: 13 }, { chiave: 'fornace', f: 0.72, lato: -1, fondo: 13 }] },
  { chiave: 'monte', nome: 'Il monte', peso: 1, fascia: [11, 13], colore: [120, 128, 140],
    luoghi: [['passo', 'monte'], ['gola', 'roccia'], ['vetta', 'monte'], ['monte', 'monte']],
    confine: { tipo: 'ponte', modello: 'passerella', nome: 'Il ponte sulla gola' },
    dungeon: [{ chiave: 'fondo', f: 0.55, lato: 1, fondo: 12 }, { chiave: 'cava', f: 0.85, lato: -1, fondo: 13 }] },
  { chiave: 'landa', nome: 'La landa vecchia', peso: 1, fascia: [13, 15], colore: [112, 96, 128],
    luoghi: [['foresta', 'foresta'], ['landa', 'landa']],
    confine: null,
    dungeon: [{ chiave: 'abisso', f: 0.42, lato: 1, fondo: 13 }, { chiave: 'tombe', f: 0.86, lato: -1, fondo: 12 }] },
]

// I dungeon: i sette della storia e il pozzo con le chiavi di sempre (l'indice della campagna), e i sei nuovi (nessun indice: si
// salvano per chiave, come una zona). `livello`: il livello del dungeon in questa terra (un po' sopra i mostri attorno);
// `paesaggio`: dati/paesaggi.js; `boss`: un grosso di dati/grossi.js, o uno nuovo (`nuovo`) che veste una creatura del catalogo
// con la corona come i grossi di oggi; `monumento`: il modello di sopra (gli otto di oggi, o uno nuovo fatto coi props che ci sono)
export const DUNGEON = {
  altare: { indice: 0, nome: 'La cripta dei re', livello: 1, paesaggio: 'cripta', boss: 'ossuto', monumento: 'altare', w: 3, h: 2 },
  cantine: { indice: 1, nome: 'Le cantine dei goblin', livello: 2, paesaggio: 'cantine', boss: 'grumo', monumento: 'arco', w: 3, h: 2 },
  torre: { indice: 2, nome: 'La torre bruciata', livello: 4, paesaggio: 'fornace', boss: 'fiammetta', monumento: 'torre', w: 3, h: 3 },
  gallerie: { indice: 3, nome: 'La tana dei ragni', livello: 5, paesaggio: 'grotta', boss: 'zannaverde', monumento: 'grotta', w: 4, h: 2 },
  cerchio: { nome: 'Il cerchio di pietre', livello: 6, paesaggio: 'cripta', boss: 'nuovo', monumento: 'menhir', w: 3, h: 3 },
  corvaia: { nome: 'Il pozzo dei corvi', livello: 7, paesaggio: 'cantine', boss: 'nuovo', monumento: 'pozzo', w: 2, h: 2 },
  cisterna: { indice: 4, nome: 'Le sale allagate', livello: 8, paesaggio: 'tempio', boss: 'gorgo', monumento: 'stagno', w: 3, h: 2 },
  palafitta: { nome: 'La palafitta', livello: 9, paesaggio: 'palude', boss: 'nuovo', monumento: 'palafitta', w: 3, h: 2 },
  labirinto: { indice: 5, nome: 'La porta dell\'inferno', livello: 10, paesaggio: 'inferno', boss: 'minotto', monumento: 'botola', w: 2, h: 2 },
  fornace: { nome: 'La fornace', livello: 11, paesaggio: 'fornace', boss: 'nuovo', monumento: 'fumarola', w: 3, h: 2 },
  fondo: { indice: 6, nome: 'Le miniere di brace', livello: 12, paesaggio: 'miniera', boss: 'carbonchio', monumento: 'miniera', w: 4, h: 2 },
  cava: { nome: 'La cava gelata', livello: 13, paesaggio: 'ghiaccio', boss: 'nuovo', monumento: 'miniera', w: 4, h: 2 },
  abisso: { indice: -1, nome: 'Il pozzo senza fondo', livello: 14, paesaggio: 'cantine', boss: 'giro', monumento: 'pozzo', w: 2, h: 2 },
  tombe: { nome: 'Le tombe del vento', livello: 15, paesaggio: 'tempio', boss: 'nuovo', monumento: 'tomba', w: 3, h: 2, finale: true },
}

// Le città. Il villaggio sta all'inizio della strada; il forte e il rifugio sono avamposti sulla strada maestra, all'entrata
// della zona che servono (le chiavi restano: gli id delle taglie le nominano). `s`: quante celle dopo l'inizio della zona;
// `lato`: da che parte della strada sta la piazza
export const CITTA = [
  { chiave: 'villaggio', nome: 'Il villaggio', mercanti: ['incantatrice', 'erborista', 'rigattiere', 'armaiolo'], persone: ['ragazza'], minatore: true },
  { chiave: 'forte', nome: 'Il forte del guado', zona: 'palude', s: 16, lato: 1, mercanti: ['erborista', 'armaiolo'], persone: ['capitano'], fontana: true },
  { chiave: 'rifugio', nome: 'Il rifugio del passo', zona: 'monte', s: 18, lato: -1, mercanti: ['incantatrice', 'erborista', 'rigattiere'], persone: [] },
]

// La pianta del villaggio, fissa (non la sceglie il caso): 40×26 celle, la riga 0 a nord, la telecamera guarda da sud. Una
// fila di botteghe a nord della piazza col davanti a sud, le due ali corte, il cancello a est da cui parte la strada.
// `piede`: dove sta chi ci lavora (dietro il banco, o davanti alla porta); `accanto`: dove si ferma l'eroe per parlargli
export const VILLAGGIO = {
  w: 40, h: 26,
  piazza: { x: 4, y: 12, w: 32, h: 9 },
  partenza: { x: 18, y: 15 },
  cancello: { x: 39, y: 16 },
  lotti: [
    { tipo: 'mercante', chiave: 'incantatrice', x: 5, y: 8, w: 3, h: 3, piede: { x: 7, y: 11 }, accanto: { x: 7, y: 13 } },
    { tipo: 'mercante', chiave: 'erborista', x: 10, y: 9, w: 3, h: 2, piede: { x: 11, y: 9 }, accanto: { x: 11, y: 12 } },
    { tipo: 'minatore', chiave: 'minatore', x: 15, y: 9, w: 3, h: 2, piede: { x: 18, y: 11 }, accanto: { x: 18, y: 13 } },
    { tipo: 'mercante', chiave: 'rigattiere', x: 21, y: 9, w: 3, h: 2, piede: { x: 22, y: 9 }, accanto: { x: 22, y: 12 } },
    { tipo: 'mercante', chiave: 'armaiolo', x: 26, y: 8, w: 4, h: 3, piede: { x: 29, y: 11 }, accanto: { x: 29, y: 13 } },
    { tipo: 'pozzo', chiave: 'pozzo', x: 32, y: 9, w: 2, h: 2, piede: { x: 32, y: 9 }, accanto: { x: 33, y: 12 } },
    { tipo: 'persona', chiave: 'ragazza', x: 34, y: 11, w: 1, h: 1, piede: { x: 34, y: 11 }, accanto: { x: 34, y: 13 } },
    { tipo: 'portale', chiave: 'villaggio', x: 2, y: 15, w: 1, h: 1, piede: { x: 2, y: 15 }, accanto: { x: 4, y: 15 } },
    { tipo: 'bacheca', chiave: 'bacheca:villaggio', x: 36, y: 12, w: 2, h: 1, piede: { x: 36, y: 12 }, accanto: { x: 36, y: 14 } },
    { tipo: 'cartello', chiave: 'cartello:villaggio', x: 37, y: 18, w: 1, h: 1, piede: { x: 37, y: 18 }, accanto: { x: 36, y: 19 } },
    { tipo: 'pietra', chiave: 'villaggio', x: 31, y: 21, w: 2, h: 2, piede: { x: 32, y: 22 }, accanto: { x: 32, y: 20 } },
  ],
  // il fondale: case senza porta dietro le botteghe, e gli alberi agli angoli; niente campi
  case: [{ x: 6, y: 2, w: 4, h: 3 }, { x: 13, y: 3, w: 3, h: 3 }, { x: 20, y: 2, w: 4, h: 3 }, { x: 28, y: 3, w: 3, h: 3 }],
  alberi: [[1, 2], [2, 6], [37, 3], [36, 7], [1, 23], [11, 24], [27, 24], [38, 24], [34, 3]],
}

// Chi sta fermo fuori dalle città, vicino al posto delle sue missioni (dati/missioni.js), come oggi; il mulino sulla riva del
// fiume fra i prati e il bosco, accanto al ponte del mulino; la porta delle terre in fondo alla strada maestra, oltre le tombe
export const PERSONE = [
  { chiave: 'eremita', vicino: 'altare' }, { chiave: 'guardia', vicino: 'torre' }, { chiave: 'boscaiolo', vicino: 'gallerie' },
  { chiave: 'pescatore', vicino: 'cisterna' }, { chiave: 'mugnaio', vicino: 'mulino' },
]
export const MULINO = { zona: 'prati', prima: 9, lato: 1, fondo: 8, w: 3, h: 3 }
export const PORTA_DELLE_TERRE = { zona: 'landa', f: 0.985, lato: 1, fondo: 3, w: 3, h: 2 }

// Un avamposto (il forte, il rifugio): la stessa forma in piccolo, 24×14, la piazza a nord della strada col davanti a sud.
// I posti si riempiono da sinistra coi mercanti della città, poi chi ci sta; la fontana dove la città non ha chi cura
export const AVAMPOSTO = {
  w: 24, h: 14,
  piazza: { x: 2, y: 7, w: 20, h: 5 },
  posti: [{ x: 3, y: 3, w: 3, h: 3 }, { x: 8, y: 3, w: 3, h: 3 }, { x: 13, y: 3, w: 3, h: 3 }, { x: 18, y: 3, w: 3, h: 3 }],
  pietra: { x: 20, y: 8, w: 2, h: 2 }, portale: { x: 2, y: 9 }, bacheca: { x: 5, y: 11, w: 2, h: 1 }, fontana: { x: 11, y: 8, w: 2, h: 2 },
}

// Le terre: la stessa mappa, i mostri più su di `salto` livelli a terra (fino a `terre`), un nome e una tinta per non sembrare
// la stessa partita. Proposta: i numeri si misurano col banco
export const TERRE = [
  { terra: 1, nome: 'La terra di casa', villaggio: 'Il villaggio', cielo: [150, 200, 240], tinta: [1, 1, 1] },
  { terra: 2, nome: 'La terra d\'autunno', villaggio: 'Borgo d\'autunno', cielo: [240, 200, 150], tinta: [1.12, 0.92, 0.7] },
  { terra: 3, nome: 'La terra della neve', villaggio: 'Borgo bianco', cielo: [215, 225, 240], tinta: [1.15, 1.18, 1.25] },
  { terra: 4, nome: 'La terra del tramonto', villaggio: 'Borgo rosso', cielo: [240, 150, 130], tinta: [1.15, 0.8, 0.78] },
  { terra: 5, nome: 'La terra della notte', villaggio: 'Borgo delle lucciole', cielo: [60, 70, 120], tinta: [0.7, 0.75, 1] },
]
