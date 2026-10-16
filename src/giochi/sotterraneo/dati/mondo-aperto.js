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
// `apre`: quante discese finite servono perché i suoi passaggi alzino la grata; `tappa`: la discesa la cui età (la `portata`)
// apre o chiude i passaggi verso di lei, la più bassa della marca (l'età chiude un passaggio, non una regione). L'est è
// l'abisso: si apre a storia finita e non ha età, come l'abisso di oggi
export const MARCHE = {
  nord: { nome: 'La marca del nord', apre: 6, tappa: 6 },
  est: { nome: 'La marca dell\'est', apre: 7, tappa: null },
  sud: { nome: 'La marca del sud', apre: 4, tappa: 4 },
  ovest: { nome: 'La marca dell\'ovest', apre: 4, tappa: 5 },
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

// Quando un passaggio è aperto: la grata si alza quando le discese finite arrivano a `apre`, e resta giù per l'età se la
// discesa `tappa` è chiusa per l'età del bambino. Un passaggio dentro un anello o dentro una marca segue la regione più
// chiusa delle due; uno verso una marca segue la marca. L'anello 1 si apre con la prima discesa (la cripta)
export const regolaDellaRegione = R => {
  const m = R.marca ? MARCHE[R.marca] : anelloDi(R) === 1 ? { apre: 0, tappa: 0 } : { apre: 0, tappa: null }
  return { apre: m.apre, tappa: m.tappa }
}
// un passaggio ha la grata solo dove le due regioni hanno regole diverse: all'ingresso di una marca, o del primo anello (l'età)
export function haGrata(passaggio, regioni = REGIONI_DEL_MONDO) {
  const di = k => regioni.find(x => x.chiave === k)
  const a = regolaDellaRegione(di(passaggio.da)), b = regolaDellaRegione(di(passaggio.a))
  return a.apre !== b.apre || a.tappa !== b.tappa
}
export function regolaDi(passaggio, regioni = REGIONI_DEL_MONDO) {
  const di = k => regioni.find(x => x.chiave === k)
  const a = regolaDellaRegione(di(passaggio.da)), b = regolaDellaRegione(di(passaggio.a))
  // la più chiusa delle due, per la storia e per l'età (l'età è in fila come le discese: chi ha chiusa la quinta ha chiusa la
  // sesta), così una marca chiusa resta chiusa da qualunque lato ci si arrivi
  const tappe = [a.tappa, b.tappa].filter(t => t != null)
  return { apre: Math.max(a.apre, b.apre), tappa: tappe.length ? Math.max(...tappe) : null }
}
// aperto per chi ha finito `finite` discese; `apertaPerEta(k)` dice se la discesa k è aperta per l'età (di difetto sì)
export const passaggioAperto = (passaggio, { finite = 0, apertaPerEta = () => true } = {}) => {
  const { apre, tappa } = regolaDi(passaggio)
  return finite >= apre && (tappa == null || apertaPerEta(tappa))
}

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
