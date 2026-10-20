// La scheda del mondo aperto (docs/sotterraneo/mondo-aperto-generatore.md): il seme, le misure, le venticinque regioni con il
// loro anello e la loro fascia, i passaggi fra le regioni (ponti e valichi, con la grata che li chiude per la storia o per
// l'età), le tre città coi loro mercanti, gli ingressi dei sette dungeon e dell'abisso coi nomi nuovi, chi sta fermo vicino
// a quale ingresso. Il generatore che ne fa la mappa è motore/mondo-aperto.js. Dato puro: nessun import da Vue, three o DOM.
// Il nome non è `dati/mondo.js`: quello tiene già le misure del sotterraneo di sempre.
import { CAMPAGNA } from './campagna.js'
import { LIVELLI_ATTESI } from './storia.js'

// la mappa non cambia mai: il seme si sceglie guardando le piante (`npm run pianta -- --mondo --semi 1-16`). `firma` è quella
// del mondo di oggi: chi cambia il generatore o la scheda la vede cambiare (unita/sotterraneo-mondo), e sa che il mondo dei
// bambini (e la nebbia salvata) cambia con lei. La nuova la stampa `npm run pianta -- --mondo`
export const MONDO_APERTO = { seme: 19, largo: 160, alto: 140, griglia: [5, 5], firma: '02904a7d' }

// quanto è larga la fascia di livelli di una regione: `livello` è l'inizio, la fine `livello + LARGA_REGIONE - 1`. Tre, così
// l'anello 1 sta in 1–6 e l'anello 2 in 6–13 come vuole il progetto (docs/sotterraneo/mondo-aperto-progetto.md)
export const LARGA_REGIONE = 3
export const FASCE_DEGLI_ANELLI = { 0: null, 1: [1, 6], 2: [6, 13] }

// i dungeon nel mondo: la chiave della storia (non cambia mai: è l'indice della campagna, delle missioni, delle soste), il nome
// nuovo, la regione dove sta, il monumento che lo segna di sopra e quanto è grande il suo lotto (w×h celle). `appoggio`: il
// lato di dietro si appoggia alla roccia (la grotta, la miniera) o all'acqua (la scala nel lago). L'abisso ha indice −1
export const DUNGEON = [
  { chiave: 'altare', indice: 0, nome: 'La cripta dei re', regione: 'cimitero', monumento: 'altare', w: 3, h: 2 },
  { chiave: 'cantine', indice: 1, nome: 'Le cantine dei goblin', regione: 'colle', monumento: 'arco', w: 3, h: 2 },
  { chiave: 'torre', indice: 2, nome: 'La torre bruciata', regione: 'brughiera', monumento: 'torre', w: 3, h: 3 },
  { chiave: 'gallerie', indice: 3, nome: 'La tana dei ragni', regione: 'bosco', monumento: 'grotta', w: 4, h: 2, appoggio: 'roccia' },
  { chiave: 'cisterna', indice: 4, nome: 'Le sale allagate', regione: 'palude', monumento: 'stagno', w: 3, h: 2, appoggio: 'acqua' },
  { chiave: 'labirinto', indice: 5, nome: 'La porta dell\'inferno', regione: 'ceneri', monumento: 'botola', w: 2, h: 2 },
  { chiave: 'fondo', indice: 6, nome: 'Le miniere di brace', regione: 'monte', monumento: 'miniera', w: 4, h: 2, appoggio: 'roccia' },
  { chiave: 'abisso', indice: -1, nome: 'Il pozzo senza fondo', regione: 'landa', monumento: 'pozzo', w: 2, h: 2 },
]

// le marche dell'anello 2, quattro regioni ciascuna in giro come le pale di un mulino (ognuna prende l'angolo da cui parte).
// `apre`: quante discese finite servono perché i suoi passaggi alzino la grata. L'est è l'abisso: si apre a storia finita
export const MARCHE = {
  nord: { nome: 'La marca del nord', apre: 6 },
  est: { nome: 'La marca dell\'est', apre: 7 },
  sud: { nome: 'La marca del sud', apre: 4 },
  ovest: { nome: 'La marca dell\'ovest', apre: 4 },
}

// Le regioni. `colonna` e `riga` nella griglia 5×5 (la riga 0 in cima, a nord); l'anello è la distanza a scacchiera dal
// centro. `livello`: l'inizio della fascia dei mostri di sopra (quella di un dungeon è il suo livello atteso meno uno, le altre
// stanno fra le vicine: lo controlla il test). `habitat`: il decoro e la quota (HABITAT, sotto). `antri`: quanti ingressi
// piccoli ha. `abitanti` e `caporale`: chi ci vive, per le sei regioni che vengono dalle terre selvagge; le altre li aspettano
// (il foglio di creature d'aperta campagna, docs/sotterraneo/da-fare.md)
const r = (chiave, nome, colonna, riga, habitat, livello, extra = {}) => ({ chiave, nome, colonna, riga, habitat, livello, antri: 2, ...extra })
export const REGIONI_DEL_MONDO = [
  r('villaggio', 'Il villaggio', 2, 2, 'villaggio', 0, { antri: 0 }),
  // l'anello 1: le otto terre vicine
  r('cimitero', 'Il cimitero vecchio', 1, 1, 'cimitero', 1, { antri: 1 }),
  r('campi', 'I campi', 2, 1, 'campi', 1, { antri: 1 }),
  r('colle', 'Il colle delle rovine', 3, 1, 'rovine', 1),
  r('brughiera', 'La brughiera', 3, 2, 'brughiera', 2),
  r('frutteto', 'Il frutteto', 3, 3, 'frutteto', 2, { antri: 1 }),
  r('mulino', 'La valle del mulino', 2, 3, 'prato', 3, { antri: 1 }),
  r('bosco', 'Il bosco vecchio', 1, 3, 'bosco', 4),
  r('lago', 'Il lago', 1, 2, 'lago', 2),
  // l'anello 2: le sedici delle marche, ognuna in fila dall'ingresso verso l'angolo dopo. Il nord, dal rifugio verso ovest: il
  // monte all'angolo, perché le miniere (la settima) stiano oltre la porta dell'inferno (la sesta)
  r('passo', 'Il passo', 3, 0, 'monte', 9, { marca: 'nord', antri: 1 }),
  r('gola', 'La gola dei venti', 2, 0, 'roccia', 9, { marca: 'nord', abitanti: ['grifone', 'pipistrello', 'vespa'], caporale: 'drago' }),
  r('vetta', 'La vetta dei troll', 1, 0, 'monte', 10, { marca: 'nord', abitanti: ['troll-clava', 'orco', 'golem'], caporale: 'golem-lava', antri: 3 }),
  r('monte', 'Il monte', 0, 0, 'monte', 9, { marca: 'nord' }),
  // l'est, dal valico del passo verso sud: l'abisso è il posto più lontano
  r('corvi', 'Il colle dei corvi', 4, 0, 'brughiera', 10, { marca: 'est' }),
  r('foresta', 'La foresta nera', 4, 1, 'foresta', 10, { marca: 'est' }),
  r('ossa', 'La valle delle ossa', 4, 2, 'ceneri', 11, { marca: 'est' }),
  r('landa', 'La landa vecchia', 4, 3, 'landa', 11, { marca: 'est', antri: 3 }),
  // il sud, dal forte verso est
  r('guado', 'Il guado', 1, 4, 'prato', 6, { marca: 'sud', antri: 1 }),
  r('palude', 'La palude', 2, 4, 'palude', 6, { marca: 'sud' }),
  r('accampamento', 'Il prato dell\'accampamento', 3, 4, 'prato', 7, { marca: 'sud', abitanti: ['goblin', 'lupo', 'cinghiale'], caporale: 'orco' }),
  r('secco', 'Il bosco secco', 4, 4, 'secco', 8, { marca: 'sud', abitanti: ['ragno', 'vespa', 'pianta'], caporale: 'ent', antri: 3 }),
  // l'ovest, dal forte verso nord
  r('ceneri', 'La piana delle ceneri', 0, 4, 'ceneri', 7, { marca: 'ovest' }),
  r('rovine', 'Le rovine del guado', 0, 3, 'rovine', 7, { marca: 'ovest', abitanti: ['scheletro', 'zombie', 'fantasma'], caporale: 'scheletro-scudo' }),
  r('colline', 'Le colline di roccia', 0, 2, 'roccia', 8, { marca: 'ovest', abitanti: ['scorpione', 'serpente', 'golem-pietra'], caporale: 'golem-muschio' }),
  r('lupi', 'Il bosco dei lupi', 0, 1, 'foresta', 9, { marca: 'ovest', antri: 3 }),
]

// I passaggi fra le regioni: dove un confine (sempre un fiume o una cresta di roccia) si passa. `tipo`: `ponte` (il confine è
// un fiume, `modello` dice quale ponte: arco di pietra, travi, passerella di corde) o `valico` (una cresta aperta). Gli altri
// confini non si passano. `nome` per i passaggi che la storia nomina. Quando si aprono e per chi, lo dice `regolaDi` più sotto:
// dai passaggi dipende tutto il resto (lo prova il test: ogni regione si raggiunge dalla piazza solo attraversandoli)
const p = (da, a, tipo, modello = null, extra = {}) => ({ da, a, tipo, modello, ...extra })
export const PASSAGGI = [
  // il villaggio sta in un'isola, con un ponte d'arco a nord e uno a sud. Le discese sono in fila per passi (la prima la più
  // vicina), e le quattro dell'anello 1 stanno a nord-ovest, nord-est, est e sud-ovest: con un ponte a est la torre (la terza)
  // starebbe più vicina delle cantine, con uno a ovest il bosco (la quarta) più vicino della torre
  p('villaggio', 'campi', 'ponte', 'arco'), p('villaggio', 'mulino', 'ponte', 'arco'),
  // l'anello 1 in giro, da una terra vicina all'altra, tranne fra il mulino e il bosco (un fiume senza ponte): al bosco si
  // arriva dal lago, cioè dal cimitero, il giro lungo
  p('cimitero', 'campi', 'ponte', 'travi'), p('campi', 'colle', 'ponte', 'travi'),
  p('colle', 'brughiera', 'valico'), p('brughiera', 'frutteto', 'valico'),
  p('frutteto', 'mulino', 'ponte', 'travi'),
  p('bosco', 'lago', 'valico'), p('lago', 'cimitero', 'valico'),
  // dall'anello 1 alle marche, in due punti soli e con la grata: il ponte del guado porta al forte (che serve il sud e l'ovest),
  // il valico del nord al rifugio (il nord, e oltre il suo valico l'est)
  p('bosco', 'guado', 'ponte', 'arco', { nome: 'Il ponte del guado' }),
  p('colle', 'passo', 'valico', null, { nome: 'Il valico del nord' }),
  // dentro le marche
  p('passo', 'gola', 'ponte', 'passerella'), p('gola', 'vetta', 'ponte', 'passerella'), p('vetta', 'monte', 'ponte', 'passerella'),
  p('corvi', 'foresta', 'valico'), p('foresta', 'ossa', 'valico'), p('ossa', 'landa', 'valico'),
  p('guado', 'palude', 'ponte', 'passerella'), p('palude', 'accampamento', 'ponte', 'passerella'), p('accampamento', 'secco', 'ponte', 'passerella'),
  p('ceneri', 'rovine', 'valico'), p('rovine', 'colline', 'valico'), p('colline', 'lupi', 'valico'),
  // fra una marca e l'altra, agli angoli
  p('passo', 'corvi', 'valico', null, { nome: 'Il valico del passo' }),
  p('guado', 'ceneri', 'ponte', 'travi'),
  p('lupi', 'monte', 'valico'), p('landa', 'secco', 'valico'),
]

// Quando un passaggio è aperto: la grata si alza quando le discese finite arrivano a `apre`. Un passaggio dentro un anello o dentro una marca segue la regione più
// chiusa delle due; uno verso una marca segue la marca. L'anello 1 si apre con la prima discesa (la cripta)
export const regolaDellaRegione = R => {
  return { apre: R.marca ? MARCHE[R.marca].apre : 0 }
}
// un passaggio ha la grata solo dove le due regioni hanno regole diverse: all'ingresso di una marca o di un anello, e fra due marche
export function haGrata(passaggio, regioni = REGIONI_DEL_MONDO) {
  const di = k => regioni.find(x => x.chiave === k)
  const a = regolaDellaRegione(di(passaggio.da)), b = regolaDellaRegione(di(passaggio.a))
  const A = di(passaggio.da), B = di(passaggio.a)
  return a.apre !== b.apre || A.marca !== B.marca || anelloDi(A) !== anelloDi(B)
}
export function regolaDi(passaggio, regioni = REGIONI_DEL_MONDO) {
  const di = k => regioni.find(x => x.chiave === k)
  const a = regolaDellaRegione(di(passaggio.da)), b = regolaDellaRegione(di(passaggio.a))
  // la più chiusa delle due, così una marca chiusa resta chiusa da qualunque lato ci si arrivi
  return { apre: Math.max(a.apre, b.apre) }
}
// aperto per chi ha finito `finite` discese
export const passaggioAperto = (passaggio, { finite = 0 } = {}) => finite >= regolaDi(passaggio).apre

export const anelloDi = R => Math.max(Math.abs(R.colonna - 2), Math.abs(R.riga - 2))
export const fasciaDi = R => (R.livello ? [R.livello, R.livello + LARGA_REGIONE - 1] : null)
// le domande di una regione: l'inizio di quelle del dungeon della storia di quel livello (l'ultimo che non lo supera)
export function difDi(R) {
  if (!R.livello) return null
  let k = 0
  for (let i = 0; i < CAMPAGNA.length; i++) if (LIVELLI_ATTESI[i] - 1 <= R.livello) k = i
  return CAMPAGNA[k].dif[0]
}

// Le città: dove stanno (la regione, e verso quale passaggio: la città sta all'ingresso della marca che serve), chi ci sta (le
// chiavi di dati/mercanti.js: il banco è per mercante, non per città), chi ci sta in più. `raggio`: la zona dei mercanti, dove
// non ci sono mostri né decoro che ingombra. `minatore`: il vecchio minatore ci sta dalla discesa `minatore` in poi
export const CITTA = [
  { chiave: 'villaggio', nome: 'Il villaggio', regione: 'villaggio', raggio: 13,
    mercanti: ['rigattiere', 'erborista', 'armaiolo', 'incantatrice'], persone: ['ragazza'], minatore: 0, case: 14 },
  { chiave: 'forte', nome: 'Il forte del guado', regione: 'guado', verso: 'Il ponte del guado', raggio: 10,
    mercanti: ['armaiolo', 'erborista'], persone: ['capitano'], case: 6 },
  { chiave: 'rifugio', nome: 'Il rifugio del passo', regione: 'passo', verso: 'Il valico del nord', raggio: 10,
    mercanti: ['erborista', 'incantatrice', 'rigattiere'], persone: [], minatore: 6, case: 5 },
]
// le botteghe di sopra: com'è fatto il banco di ogni mercante (lo disegna il 3D) e dove sta rispetto alla piazza
export const BOTTEGHE = {
  rigattiere: { bottega: 'bancarella', w: 3, h: 2, verso: [-1, -7], dietro: true },
  erborista: { bottega: 'erbe', w: 3, h: 2, verso: [-8, -1], dietro: true },
  armaiolo: { bottega: 'fucina', w: 4, h: 3, verso: [6, -3] },
  incantatrice: { bottega: 'torretta', w: 3, h: 3, verso: [-6, 5] },
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

/* ── Il mondo a percorso (docs/sotterraneo/mondo-a-percorso.md): la scheda del generatore nuovo, motore/mondo-percorso.js.
   Sopra c'è ancora la scheda del mondo ad anelli (regioni, marche, passaggi, città): la usano mondo-sopra.js, aperta.js e la
   scena finché i compiti B e D non passano al percorso; poi si toglie (docs/sotterraneo/mondo-aperto-generatore.md). Restano
   HABITAT, LOTTI, BOTTEGHE, PERSONE e PERSONE_NUOVE, che il percorso legge. ── */

// Le misure e il seme. Il tracciato è scritto sulla misura del prototipo (352×216, `su`) e si stira su `largo`×`alto`: la
// forma è quella approvata, il mondo più grande perché fra due pietre ci siano ~200–230 passi (45–50 s a piedi). `mezza`: la
// mezza larghezza del corridoio di una zona; `salto` e `terre`: quanto salgono i mostri da una terra alla dopo, e fino a quante.
// `firma` è dello scheletro (si salva col mondo), `firmaCelle` di tutte le zone caricate: chi cambia il generatore le vede
// cambiare in unita/sotterraneo-mondo-percorso e sa che il mondo dei bambini cambia (`npm run pianta -- --percorso` le stampa)
export const MONDO_PERCORSO = { seme: 8, largo: 504, alto: 300, su: [352, 216], mezza: 29, salto: 14, terre: 5,
  firma: '521a0901', firmaCelle: 'cf2f657b' }

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

// Il villaggio, l'unica città: una pianta fissa di 40×26 celle (la riga 0 a nord, la telecamera guarda da sud), un ferro di
// cavallo aperto a sud. La fila delle botteghe a nord della piazza col davanti a sud, il cancello a est da cui parte la strada.
// `piede`: dove sta chi ci lavora (dietro il banco o davanti alla porta); `accanto`: dove si ferma l'eroe, sempre a sud del
// piede e sulla piazza. Il capitano è venuto dal forte, che non c'è più. Niente campi: case senza porta e alberi agli angoli
export const VILLAGGIO = {
  chiave: 'villaggio', nome: 'Il villaggio', w: 40, h: 26,
  piazza: { x: 4, y: 12, w: 32, h: 9 },
  partenza: { x: 18, y: 15 },
  cancello: { x: 39, y: 16 },
  lotti: [
    { tipo: 'mercante', chiave: 'incantatrice', x: 5, y: 8, w: 3, h: 3, piede: { x: 7, y: 11 }, accanto: { x: 7, y: 13 } },
    { tipo: 'mercante', chiave: 'erborista', x: 10, y: 9, w: 3, h: 2, piede: { x: 11, y: 9 }, accanto: { x: 11, y: 12 } },
    { tipo: 'minatore', chiave: 'minatore', x: 15, y: 9, w: 3, h: 2, piede: { x: 18, y: 11 }, accanto: { x: 18, y: 13 } },
    { tipo: 'mercante', chiave: 'rigattiere', x: 21, y: 9, w: 3, h: 2, piede: { x: 22, y: 9 }, accanto: { x: 22, y: 12 } },
    { tipo: 'persona', chiave: 'capitano', x: 25, y: 11, w: 1, h: 1, piede: { x: 25, y: 11 }, accanto: { x: 25, y: 13 } },
    { tipo: 'mercante', chiave: 'armaiolo', x: 26, y: 8, w: 4, h: 3, piede: { x: 29, y: 11 }, accanto: { x: 29, y: 13 } },
    { tipo: 'pozzo', chiave: 'pozzo', x: 32, y: 9, w: 2, h: 2, piede: { x: 32, y: 9 }, accanto: { x: 33, y: 12 } },
    { tipo: 'persona', chiave: 'ragazza', x: 34, y: 11, w: 1, h: 1, piede: { x: 34, y: 11 }, accanto: { x: 34, y: 13 } },
    { tipo: 'portale', chiave: 'villaggio', x: 2, y: 15, w: 1, h: 1, piede: { x: 2, y: 15 }, accanto: { x: 4, y: 15 } },
    { tipo: 'bacheca', chiave: 'bacheca:villaggio', x: 36, y: 12, w: 2, h: 1, piede: { x: 36, y: 12 }, accanto: { x: 36, y: 14 } },
    { tipo: 'cartello', chiave: 'cartello:villaggio', x: 37, y: 18, w: 1, h: 1, piede: { x: 37, y: 18 }, accanto: { x: 36, y: 19 } },
    { tipo: 'pietra', chiave: 'villaggio', x: 31, y: 21, w: 2, h: 2, piede: { x: 32, y: 22 }, accanto: { x: 32, y: 20 } },
  ],
  case: [{ x: 6, y: 2, w: 4, h: 3 }, { x: 13, y: 3, w: 3, h: 3 }, { x: 20, y: 2, w: 4, h: 3 }, { x: 28, y: 3, w: 3, h: 3 }],
  alberi: [[1, 2], [2, 6], [37, 3], [36, 7], [1, 23], [11, 24], [27, 24], [38, 24], [34, 3]],
}

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
