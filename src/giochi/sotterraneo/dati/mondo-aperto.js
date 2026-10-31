// La scheda del mondo di sopra del sotterraneo (docs/sotterraneo/mondo-aperto-generatore.md): il mondo a percorso, da cui
// motore/mondo-percorso.js fa la mappa. Le parti di sempre (le botteghe, chi sta fermo, gli habitat, i lotti, le domande di un
// livello) e, sotto, la serpentina: le misure e il seme, il tracciato, i luoghi, le zone, i quattordici ingressi, il villaggio, le
// terre. Il mondo ad anelli che c'era prima è stato tolto il 20 ottobre 2026 (docs/sotterraneo/mondo-a-percorso.md). Dato puro:
// nessun import da Vue, three o DOM. Il nome non è `dati/mondo.js`: quello tiene già le misure del sotterraneo di sempre.
import { CAMPAGNA } from './campagna.js'
import { LIVELLI_ATTESI } from './storia.js'

// le domande di una regione: l'inizio di quelle del dungeon della storia di quel livello (l'ultimo che non lo supera)
export function difDi(R) {
  if (!R.livello) return null
  let k = 0
  for (let i = 0; i < CAMPAGNA.length; i++) if (LIVELLI_ATTESI[i] - 1 <= R.livello) k = i
  return CAMPAGNA[k].dif[0]
}

// le botteghe di sopra: com'è fatto il banco di ogni mercante (lo disegna il 3D); dove stanno lo dice la pianta del villaggio
export const BOTTEGHE = {
  rigattiere: { bottega: 'bancarella', w: 3, h: 2 },
  erborista: { bottega: 'erbe', w: 3, h: 2 },
  armaiolo: { bottega: 'fucina', w: 4, h: 3 },
  incantatrice: { bottega: 'torretta', w: 3, h: 3 },
}

// Chi sta fermo fuori dalle città, vicino al posto delle sue missioni (le chiavi di dati/missioni.js). Il capitano è nuovo:
// non ha ancora lo sprite (docs/sotterraneo/mondo-aperto-quest.md)
export const PERSONE = [
  { chiave: 'eremita', vicino: 'altare' }, { chiave: 'guardia', vicino: 'torre' },
  { chiave: 'boscaiolo', vicino: 'gallerie' }, { chiave: 'pescatore', vicino: 'cisterna' },
  { chiave: 'mugnaio', vicino: 'mulino' },
]
export const PERSONE_NUOVE = { capitano: { nome: 'Il capitano', chi: 'il capitano del forte' } }

// Gli habitat: la quota di base, quanto la bucano gli spuntoni di roccia (0 niente, più basso più roccia), il decoro ogni cento
// celle, l'acqua (un lago al centro, o le pozze della palude), la forma degli antri, e il decoro: [tipo, peso, blocca]. Un
// ingombro che blocca sta sempre con una cella libera attorno: non chiude mai una strada
export const HABITAT = {
  villaggio: { quota: 0.1, rocce: 0, densita: 1.4, antro: 'cantina',
    decoro: [['tondo', 5, 1], ['frutto', 3, 1], ['cespuglio', 5, 0], ['botte', 2, 1], ['cassa', 2, 1], ['covone', 1, 1]] },
  campi: { quota: 0.05, rocce: 0, densita: 1.8, antro: 'cantina',
    decoro: [['tondo', 4, 1], ['frutto', 4, 1], ['cespuglio', 3, 0], ['covone', 3, 1], ['sasso', 1, 1], ['spaventapasseri', 1, 1]] },
  frutteto: { quota: 0.1, rocce: 0, densita: 4, antro: 'cantina',
    decoro: [['frutto', 8, 1], ['tondo', 2, 1], ['cespuglio', 3, 0], ['botte', 1, 1], ['covone', 1, 1]] },
  prato: { quota: 0.15, rocce: 0, densita: 3, antro: 'grotta',
    decoro: [['tondo', 4, 1], ['pino', 2, 1], ['sasso', 2, 1], ['cespuglio', 5, 0], ['fiori', 4, 0]] },
  cimitero: { quota: 0.3, rocce: 0, densita: 4, antro: 'tomba',
    decoro: [['lapide', 6, 1], ['secco', 3, 1], ['tondo', 2, 1], ['colonna', 1, 1], ['cespuglio', 2, 0]] },
  rovine: { quota: 0.5, rocce: 0.78, densita: 5, antro: 'cantina',
    decoro: [['rudere', 4, 1], ['colonna', 3, 1], ['secco', 3, 1], ['tondo', 2, 1], ['sasso', 3, 1], ['cespuglio', 3, 0]] },
  brughiera: { quota: 0.35, rocce: 0.8, densita: 4, antro: 'grotta',
    decoro: [['erica', 6, 0], ['sasso', 3, 1], ['masso', 2, 1], ['pino', 2, 1], ['secco', 2, 1]] },
  bosco: { quota: 0.2, rocce: 0, densita: 13, antro: 'grotta', macchie: true,
    decoro: [['pino', 7, 1], ['tondo', 5, 1], ['abete', 4, 1], ['cespuglio', 4, 0], ['ceppo', 1, 1], ['funghi', 2, 0], ['sasso', 1, 1]] },
  foresta: { quota: 0.3, rocce: 0.82, densita: 14, antro: 'grotta', macchie: true,
    decoro: [['abete', 8, 1], ['pino', 4, 1], ['ceppo', 2, 1], ['funghi', 3, 0], ['masso', 1, 1], ['cespuglio', 3, 0]] },
  lago: { quota: -0.05, rocce: 0, densita: 3, antro: 'grotta', acqua: 'lago',
    decoro: [['salice', 4, 1], ['tondo', 2, 1], ['canne', 6, 0], ['cespuglio', 3, 0], ['sasso', 2, 1]] },
  palude: { quota: -0.1, rocce: 0, densita: 4, antro: 'grotta', acqua: 'pozze',
    decoro: [['salice', 4, 1], ['canne', 8, 0], ['secco', 2, 1], ['funghi', 2, 0], ['cespuglio', 2, 0]] },
  monte: { quota: 1.1, rocce: 0.64, densita: 4, antro: 'grotta',
    decoro: [['abete', 5, 1], ['pino', 3, 1], ['masso', 3, 1], ['sasso', 3, 1], ['cespuglio', 2, 0]] },
  roccia: { quota: 0.8, rocce: 0.7, densita: 4, antro: 'grotta',
    decoro: [['masso', 4, 1], ['sasso', 4, 1], ['pino', 2, 1], ['secco', 1, 1], ['cespuglio', 2, 0]] },
  landa: { quota: 0.6, rocce: 0.74, densita: 4, antro: 'tomba',
    decoro: [['secco', 5, 1], ['masso', 3, 1], ['sasso', 3, 1], ['ossa', 1, 0], ['cespuglio', 2, 0]] },
  ceneri: { quota: 0.4, rocce: 0.76, densita: 3, antro: 'tomba',
    decoro: [['secco', 5, 1], ['masso', 2, 1], ['sasso', 3, 1], ['ossa', 2, 0], ['brace', 2, 0]] },
  secco: { quota: 0.3, rocce: 0, densita: 8, antro: 'grotta', macchie: true,
    decoro: [['secco', 8, 1], ['ceppo', 2, 1], ['sasso', 2, 1], ['cespuglio', 2, 0], ['ossa', 1, 0]] },
}

// i lotti di chi non è un mercante né un ingresso: w×h celle
export const LOTTI = { pietra: [2, 2], antro: [2, 2], bacheca: [2, 1], cartello: [1, 1], tenda: [3, 2], mulino: [3, 3] }

/* ── Il mondo a percorso (docs/sotterraneo/mondo-a-percorso.md): la scheda del generatore, motore/mondo-percorso.js. Sopra le
   parti che legge anche lui (HABITAT, LOTTI, BOTTEGHE, PERSONE e PERSONE_NUOVE) ── */

// Le misure e il seme. Il tracciato è scritto sulla misura del prototipo (352×216, `su`) e si stira su `largo`×`alto`: la
// forma è quella approvata, il mondo più grande perché fra due pietre ci siano ~200–230 passi (45–50 s a piedi). `mezza`: la
// mezza larghezza del corridoio di una zona; `salto` e `terre`: quanto salgono i mostri da una terra alla dopo, e fino a quante.
// `firma` è dello scheletro (si salva col mondo), `firmaCelle` di tutte le zone caricate: chi cambia il generatore le vede
// cambiare in unita/sotterraneo-mondo-percorso e sa che il mondo dei bambini cambia (`npm run pianta -- --percorso` le stampa)
export const MONDO_PERCORSO = { seme: 8, largo: 504, alto: 300, su: [352, 216], mezza: 29, salto: 14, terre: 5,
  firma: '1ab5aff5', firmaCelle: '178a0fc6' }

// La strada maestra: i punti per cui passa la curva, dal cancello del villaggio alla fine della landa (sulla misura `su`, la
// riga 0 a nord). Tre file: in basso verso est (villaggio, prati, bosco), si sale a est, in mezzo verso ovest (brughiera,
// palude, ceneri), si sale a ovest, in alto verso est (monte, landa)
export const TRACCIATO = [
  [44, 174], [64, 164], [88, 183], [114, 170], [141, 189], [169, 173], [198, 189], [229, 170], [257, 186], [284, 170], [308, 178],
  [321, 156], [317, 130],
  [295, 112], [268, 128], [240, 104], [211, 120], [183, 101], [154, 120], [125, 101], [97, 117], [68, 101], [40, 112],
  [26, 88], [30, 62],
  [51, 42], [79, 56], [108, 34], [136, 50], [165, 31], [194, 47], [222, 31], [251, 50], [279, 34], [310, 45],
]

// I luoghi: le regioni del mondo ad anelli, con le loro chiavi (le taglie le nominano), messe in fila dentro le zone. `abitanti`
// e `caporale` per i sei che vengono dalle terre selvagge
export const LUOGHI = {
  campi: { nome: 'I campi', habitat: 'campi' },
  mulino: { nome: 'La valle del mulino', habitat: 'prato' },
  cimitero: { nome: 'Il cimitero vecchio', habitat: 'cimitero' },
  frutteto: { nome: 'Il frutteto', habitat: 'frutteto' },
  lago: { nome: 'Il lago', habitat: 'lago' },
  bosco: { nome: 'Il bosco vecchio', habitat: 'bosco' },
  lupi: { nome: 'Il bosco dei lupi', habitat: 'foresta' },
  colle: { nome: 'Il colle delle rovine', habitat: 'rovine' },
  brughiera: { nome: 'La brughiera', habitat: 'brughiera' },
  corvi: { nome: 'Il colle dei corvi', habitat: 'brughiera' },
  rovine: { nome: 'Le rovine del guado', habitat: 'rovine', abitanti: ['scheletro', 'zombie', 'fantasma'], caporale: 'scheletro-scudo' },
  guado: { nome: 'Il guado', habitat: 'prato' },
  accampamento: { nome: 'Il prato dell\'accampamento', habitat: 'prato', abitanti: ['goblin', 'lupo', 'cinghiale'], caporale: 'orco' },
  palude: { nome: 'La palude', habitat: 'palude' },
  secco: { nome: 'Il bosco secco', habitat: 'secco', abitanti: ['ragno', 'vespa', 'pianta'], caporale: 'ent' },
  ceneri: { nome: 'La piana delle ceneri', habitat: 'ceneri' },
  ossa: { nome: 'La valle delle ossa', habitat: 'ceneri' },
  colline: { nome: 'Le colline di roccia', habitat: 'roccia', abitanti: ['scorpione', 'serpente', 'golem-pietra'], caporale: 'golem-muschio' },
  passo: { nome: 'Il passo', habitat: 'monte' },
  gola: { nome: 'La gola dei venti', habitat: 'roccia', abitanti: ['grifone', 'pipistrello', 'vespa'], caporale: 'drago' },
  vetta: { nome: 'La vetta dei troll', habitat: 'monte', abitanti: ['troll-clava', 'orco', 'golem'], caporale: 'golem-lava' },
  monte: { nome: 'Il monte', habitat: 'monte' },
  foresta: { nome: 'La foresta nera', habitat: 'foresta' },
  landa: { nome: 'La landa vecchia', habitat: 'landa' },
}

// Le zone in fila (l'ordine e il numero li ha approvati l'utente il 20 ottobre 2026). `peso`: quanta strada maestra prendono,
// in proporzione; `fascia`: il livello dei mostri all'entrata e in fondo, nella prima terra; `luoghi`: in fila lungo la strada;
// `confine`: come si passa nella dopo (sempre aperto: un ponte sul fiume o un valico nella cresta); `dungeon`: dove stanno (f: a
// che punto della zona, lato: a sinistra +1 o a destra −1 della strada guardando avanti, fondo: quante celle dentro); `campi` e
// `case`: quanti nei luoghi che li hanno (fuori dal villaggio)
export const ZONE_DEL_MONDO = [
  { chiave: 'prati', nome: 'I prati del cimitero', peso: 0.85, fascia: [1, 3], colore: [128, 168, 88],
    luoghi: ['campi', 'mulino', 'cimitero', 'frutteto'], campi: { campi: 6, mulino: 2, frutteto: 3 }, case: { campi: 3, mulino: 2, frutteto: 2 },
    confine: { tipo: 'ponte', modello: 'arco', nome: 'Il ponte del mulino' },
    dungeon: [{ chiave: 'altare', f: 0.18, lato: 1, fondo: 11 }, { chiave: 'cantine', f: 0.72, lato: -1, fondo: 13 }] },
  { chiave: 'bosco', nome: 'Il bosco vecchio', peso: 1.1, fascia: [3, 5], colore: [64, 120, 64],
    luoghi: ['lago', 'bosco', 'lupi'], case: { bosco: 1, lago: 1 },
    confine: { tipo: 'valico', nome: 'La salita della brughiera' },
    dungeon: [{ chiave: 'torre', f: 0.3, lato: -1, fondo: 13 }, { chiave: 'gallerie', f: 0.74, lato: 1, fondo: 14 }] },
  { chiave: 'brughiera', nome: 'La brughiera', peso: 1.2, fascia: [5, 7], colore: [150, 120, 120],
    luoghi: ['colle', 'brughiera', 'corvi', 'rovine'],
    confine: { tipo: 'ponte', modello: 'arco', nome: 'Il ponte del guado' },
    dungeon: [{ chiave: 'cerchio', f: 0.3, lato: 1, fondo: 14 }, { chiave: 'corvaia', f: 0.72, lato: -1, fondo: 14 }] },
  { chiave: 'palude', nome: 'La palude', peso: 1, fascia: [7, 9], colore: [92, 120, 104],
    luoghi: ['guado', 'accampamento', 'palude', 'secco'],
    confine: { tipo: 'ponte', modello: 'passerella', nome: 'La passerella delle ceneri' },
    dungeon: [{ chiave: 'cisterna', f: 0.55, lato: 1, fondo: 13 }, { chiave: 'palafitta', f: 0.85, lato: -1, fondo: 13 }] },
  { chiave: 'ceneri', nome: 'La piana delle ceneri', peso: 1, fascia: [9, 11], colore: [128, 92, 76],
    luoghi: ['ceneri', 'ossa', 'colline'],
    confine: { tipo: 'valico', nome: 'Il valico del passo' },
    dungeon: [{ chiave: 'labirinto', f: 0.3, lato: 1, fondo: 13 }, { chiave: 'fornace', f: 0.72, lato: -1, fondo: 13 }] },
  { chiave: 'monte', nome: 'Il monte', peso: 1, fascia: [11, 13], colore: [120, 128, 140],
    luoghi: ['passo', 'gola', 'vetta', 'monte'],
    confine: { tipo: 'ponte', modello: 'passerella', nome: 'Il ponte sulla gola' },
    dungeon: [{ chiave: 'fondo', f: 0.55, lato: 1, fondo: 12 }, { chiave: 'cava', f: 0.85, lato: -1, fondo: 13 }] },
  { chiave: 'landa', nome: 'La landa vecchia', peso: 1, fascia: [13, 15], colore: [112, 96, 128],
    luoghi: ['foresta', 'landa'],
    confine: null,
    dungeon: [{ chiave: 'abisso', f: 0.42, lato: 1, fondo: 13 }, { chiave: 'tombe', f: 0.86, lato: -1, fondo: 12 }] },
]

// I quattordici ingressi: i sette della storia e il pozzo con le chiavi di sempre (`indice` della campagna, l'abisso −1), e i
// sei nuovi (nessun indice: si salvano per chiave; la loro tappa la scrive dati/dungeon-del-mondo.js). `livello`: nella prima
// terra, un po' sopra i mostri attorno; `paesaggio`: dati/paesaggi.js; `boss`: un grosso di dati/grossi.js, `nuovo` per i sei;
// `monumento`: il modello di sopra; `w h`: il lotto; `appoggio`: la gobba di roccia dietro o lo stagno dietro
export const INGRESSI_DEL_MONDO = {
  altare: { indice: 0, nome: 'La cripta dei re', livello: 1, paesaggio: 'cripta', boss: 'ossuto', monumento: 'altare', w: 3, h: 2 },
  cantine: { indice: 1, nome: 'Le cantine dei goblin', livello: 2, paesaggio: 'cantine', boss: 'grumo', monumento: 'arco', w: 3, h: 2 },
  torre: { indice: 2, nome: 'La torre bruciata', livello: 4, paesaggio: 'fornace', boss: 'fiammetta', monumento: 'torre', w: 3, h: 3 },
  gallerie: { indice: 3, nome: 'La tana dei ragni', livello: 5, paesaggio: 'grotta', boss: 'zannaverde', monumento: 'grotta', w: 4, h: 2, appoggio: 'roccia' },
  cerchio: { indice: null, nome: 'Il cerchio di pietre', livello: 6, paesaggio: 'cripta', boss: 'nuovo', monumento: 'menhir', w: 3, h: 3 },
  corvaia: { indice: null, nome: 'Il pozzo dei corvi', livello: 7, paesaggio: 'grotta', boss: 'nuovo', monumento: 'pozzo', w: 2, h: 2 },
  cisterna: { indice: 4, nome: 'Le sale allagate', livello: 8, paesaggio: 'tempio', boss: 'gorgo', monumento: 'stagno', w: 3, h: 2, appoggio: 'acqua' },
  palafitta: { indice: null, nome: 'La palafitta', livello: 9, paesaggio: 'palude', boss: 'nuovo', monumento: 'palafitta', w: 3, h: 2 },
  labirinto: { indice: 5, nome: 'La porta dell\'inferno', livello: 10, paesaggio: 'inferno', boss: 'minotto', monumento: 'botola', w: 2, h: 2 },
  fornace: { indice: null, nome: 'La fornace', livello: 11, paesaggio: 'fornace', boss: 'nuovo', monumento: 'fumarola', w: 3, h: 2 },
  fondo: { indice: 6, nome: 'Le miniere di brace', livello: 12, paesaggio: 'miniera', boss: 'carbonchio', monumento: 'miniera', w: 4, h: 2, appoggio: 'roccia' },
  cava: { indice: null, nome: 'La cava gelata', livello: 13, paesaggio: 'ghiaccio', boss: 'nuovo', monumento: 'miniera', w: 4, h: 2, appoggio: 'roccia' },
  abisso: { indice: -1, nome: 'Il pozzo senza fondo', livello: 14, paesaggio: 'cantine', boss: 'giro', monumento: 'pozzo', w: 2, h: 2 },
  tombe: { indice: null, nome: 'Le tombe del vento', livello: 15, paesaggio: 'tempio', boss: 'nuovo', monumento: 'tomba', w: 3, h: 2, finale: true },
}

// Il villaggio, l'unica città: una pianta fissa di 24×20 celle (la riga 0 a nord, la telecamera guarda da sud). Una piazza
// tonda col pozzo in mezzo e, attorno, le botteghe a ventaglio aperto a sud: a profondità diverse, ognuna girata appena verso la
// piazza (`giro`, in radianti: 0 il davanti a sud, più di 0 verso est). `piazza`: il centro e i raggi ogni 30° (da est, verso
// nord), raccordati; `strada`: la stradina dalla piazza al cancello, a est, dove parte la strada maestra. `piede`: dove sta chi
// ci lavora (dietro il banco o davanti alla porta); `accanto`: dove si ferma l'eroe (per chi ci sta, a sud del piede e sulla
// piazza). Le case con la porta verso la piazza (`verso` e `giro`) non vendono niente; l'orto è solo la cornice in un angolo.
// Il capitano è venuto dal forte, che non c'è più. docs/sotterraneo/mondo-a-percorso.md, «Il villaggio»
export const VILLAGGIO = {
  chiave: 'villaggio', nome: 'Il villaggio', w: 24, h: 20,
  piazza: { cx: 12.5, cy: 10.5, raggi: [5.8, 5.2, 4.3, 4.3, 4.6, 4.8, 5.5, 5.4, 4.8, 4.2, 4.5, 5.4] },
  partenza: { x: 12, y: 13 },
  cancello: { x: 23, y: 15 },
  strada: [[16.6, 13.2], [18.8, 14.4], [21, 15], [24.5, 15]],
  lotti: [
    { tipo: 'mercante', chiave: 'incantatrice', x: 4, y: 9, w: 3, h: 3, giro: 0.8, piede: { x: 7, y: 12 }, accanto: { x: 8, y: 13 } },
    { tipo: 'mercante', chiave: 'erborista', x: 6, y: 6, w: 3, h: 2, giro: 0.4, piede: { x: 7, y: 8 }, accanto: { x: 8, y: 9 } },
    { tipo: 'minatore', chiave: 'minatore', x: 9, y: 2, w: 3, h: 2, piede: { x: 12, y: 4 }, accanto: { x: 12, y: 6 } },
    { tipo: 'mercante', chiave: 'rigattiere', x: 14, y: 5, w: 3, h: 2, giro: -0.25, piede: { x: 15, y: 7 }, accanto: { x: 15, y: 8 } },
    { tipo: 'persona', chiave: 'capitano', x: 17, y: 6, w: 1, h: 1, piede: { x: 17, y: 6 }, accanto: { x: 16, y: 8 } },
    { tipo: 'mercante', chiave: 'armaiolo', x: 18, y: 7, w: 4, h: 3, giro: -0.35, piede: { x: 17, y: 10 }, accanto: { x: 17, y: 11 } },
    { tipo: 'pozzo', chiave: 'pozzo', x: 11, y: 9, w: 2, h: 2, piede: { x: 11, y: 9 }, accanto: { x: 11, y: 12 } },
    { tipo: 'persona', chiave: 'ragazza', x: 13, y: 10, w: 1, h: 1, piede: { x: 13, y: 10 }, accanto: { x: 13, y: 12 } },
    { tipo: 'portale', chiave: 'villaggio', x: 6, y: 15, w: 1, h: 1, piede: { x: 6, y: 15 }, accanto: { x: 8, y: 15 } },
    { tipo: 'bacheca', chiave: 'bacheca:villaggio', x: 15, y: 15, w: 2, h: 1, piede: { x: 15, y: 15 }, accanto: { x: 15, y: 16 } },
    { tipo: 'cartello', chiave: 'cartello:villaggio', x: 20, y: 13, w: 1, h: 1, piede: { x: 20, y: 13 }, accanto: { x: 20, y: 14 } },
    { tipo: 'pietra', chiave: 'villaggio', x: 9, y: 16, w: 2, h: 2, piede: { x: 10, y: 17 }, accanto: { x: 10, y: 15 } },
  ],
  case: [
    { x: 0, y: 4, w: 3, h: 3, verso: 'e', giro: -0.45 }, { x: 3, y: 1, w: 4, h: 3, verso: 's', giro: 0.3 },
    { x: 13, y: 0, w: 4, h: 3, verso: 's', giro: -0.12 }, { x: 20, y: 2, w: 3, h: 3, verso: 's', giro: -0.5 },
    { x: 21, y: 11, w: 3, h: 2, verso: 'o', giro: 0.4 },
  ],
  orto: { x: 1, y: 14, w: 4, h: 3 },
  alberi: [[0, 0], [8, 1], [11, 0], [18, 1], [23, 0], [23, 7], [0, 11], [0, 18], [7, 19], [19, 18], [23, 18]],
}
// la piazza: il raggio verso l'angolo `a` (0 a est, π/2 a nord), raccordato fra i raggi della scheda; se il punto (x, y) ci sta
export function raggioDellaPiazza(P, a) {
  const n = P.raggi.length, t = (((a / (2 * Math.PI)) % 1) + 1) % 1 * n, i = Math.floor(t), f = t - i
  const r = k => P.raggi[((k % n) + n) % n], p0 = r(i - 1), p1 = r(i), p2 = r(i + 1), p3 = r(i + 2)
  return 0.5 * (2 * p1 + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f)
}
export const nellaPiazza = (P, x, y) => Math.hypot(x - P.cx, y - P.cy) <= raggioDellaPiazza(P, Math.atan2(P.cy - y, x - P.cx))

// le città che non ci sono più: le loro chiavi stanno ancora nelle taglie salvate (`t:forte:…`) e nelle pietre accese, e si
// rileggono sul villaggio. Una pietra accesa davanti a un dungeon (`altare`) è ora la pietra della sua zona
export const CITTA_VECCHIE = { forte: 'villaggio', rifugio: 'villaggio' }
export const cittaDiOggi = chiave => CITTA_VECCHIE[chiave] || chiave
export function pietraDiOggi(chiave) {
  if (chiave === 'villaggio' || CITTA_VECCHIE[chiave]) return 'villaggio'
  const z = ZONE_DEL_MONDO.find(q => q.dungeon.some(d => d.chiave === chiave))
  return z ? `zona:${z.chiave}` : chiave
}

// il mulino sulla riva del fiume poco prima del ponte del mulino; la porta delle terre in fondo alla strada, oltre le tombe
export const MULINO = { zona: 'prati', prima: 9, lato: 1, fondo: 8, w: 3, h: 3 }
export const PORTA_DELLE_TERRE = { zona: 'landa', f: 0.985, lato: 1, fondo: 3, w: 3, h: 2 }

// Le terre: la stessa mappa, i mostri più su di `salto` livelli a terra (fino a `terre`), un nome e una tinta per non sembrare
// la stessa partita (proposta: i numeri si misurano col banco)
export const TERRE = [
  { terra: 1, nome: 'La terra di casa', villaggio: 'Il villaggio', cielo: [150, 200, 240], tinta: [1, 1, 1] },
  { terra: 2, nome: 'La terra d\'autunno', villaggio: 'Borgo d\'autunno', cielo: [240, 200, 150], tinta: [1.12, 0.92, 0.7] },
  { terra: 3, nome: 'La terra della neve', villaggio: 'Borgo bianco', cielo: [215, 225, 240], tinta: [1.15, 1.18, 1.25] },
  { terra: 4, nome: 'La terra del tramonto', villaggio: 'Borgo rosso', cielo: [240, 150, 130], tinta: [1.15, 0.8, 0.78] },
  { terra: 5, nome: 'La terra della notte', villaggio: 'Borgo delle lucciole', cielo: [60, 70, 120], tinta: [0.7, 0.75, 1] },
]
// quanto sale una terra: la prima com'è nella scheda, ogni terra dopo `salto` livelli più su, fino a `terre`
export const saltoDellaTerra = (terra = 1) => MONDO_PERCORSO.salto * (Math.max(1, Math.min(terra | 0 || 1, MONDO_PERCORSO.terre)) - 1)
export const fasciaNellaTerra = (fascia, terra = 1) => fascia.map(v => v + saltoDellaTerra(terra))
// le domande di una zona: quelle della discesa della storia del livello dove la zona comincia (nella prima terra)
export const difDellaZona = Z => difDi({ livello: Z.fascia[0] })
