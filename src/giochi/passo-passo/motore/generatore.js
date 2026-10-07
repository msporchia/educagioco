/* I SENTIERI SENZA FINE — posti fatti al momento, esaminati dal motore:
   si tengono solo se si vincono, sopra il pavimento della loro forma, con
   la carota che chiede una deviazione e con tutte le regole che servono.
   Due sentieri: quello del coniglio (prati e posti con lo zaino) e quello
   del cane (pascoli, e lo zaino col cane). Le bozze stanno in
   `prati.js`, `pascoli.js` e `sagome*.js`; qui si sceglie cosa fare e si
   controlla. Vedi docs/passo-passo/sentiero.md. */
import { Livello } from './livello.js'
import { misura, serveLaRegola } from './risolutore.js'
import { misuraSvelta, vaBene } from './svelto.js'
import { esegui, TANA } from './mondo.js'
import { generaZaino, carteInMano, SAGOME, animaleDi } from './sagome.js'
import { bozzaLabirinto, bozzaLago, bozzaFiume } from './prati.js'
import { BOZZE_DEL_PASCOLO } from './pascoli.js'
import { TEMI } from '../dati/campagna.js'
import { programma, ripeti } from '../dati/carte.js'

/* un generatore di numeri a seme: sempre la stessa fila per lo stesso seme.
   Il seme si rimescola prima di cominciare: semi vicini (quelli di due
   sentieri di fila) davano primi numeri quasi uguali e piccoli, e il
   primo numero è quello che sceglie la famiglia del posto */
export function caso(seme = 1) {
  let s = Math.imul((seme >>> 0) ^ 0x9e3779b9, 0x85ebca6b) >>> 0
  s = Math.imul(s ^ (s >>> 13), 0xc2b2ae35) >>> 0
  s = (s ^ (s >>> 16)) >>> 0 || 1
  return () => {
    s ^= s << 13; s >>>= 0
    s ^= s >>> 17
    s ^= s << 5; s >>>= 0
    return s / 4294967296
  }
}

/* ogni gradino finito (non solo visto) della campagna mette nel
   sentiero una cosa: una regola del mondo, il cane, una carta */
export const INGREDIENTI = {
  salto: 'salto', ghiaccio: 'ghiaccio', massi: 'massi', buche: 'buche',
  pecore: 'cane', ripeti: 'ripeti', fino: 'fino', se: 'se',
}
/* le regole del mondo, col nome che il risolutore usa per spegnerle */
const REGOLE = { salto: 'salto', ghiaccio: 'ghiaccio', massi: 'spinta', buche: 'buche' }
/* i sentieri si aprono alla fine delle buche: chi ci arriva ha già tutte
   e quattro le regole del prato */
export const DI_BASE = ['salto', 'ghiaccio', 'massi', 'buche']

/* i due sentieri, ognuno con le sue famiglie; quello del cane si apre a
   pascolo finito (vedi docs/passo-passo/sentiero.md) */
export const SENTIERI = {
  coniglio: { nome: 'Il sentiero del coniglio', famiglie: ['prato', 'ripeti', 'fino', 'se'] },
  cane: { nome: 'Il sentiero del cane', famiglie: ['pascolo', 'ripeti', 'fino', 'se'] },
}
const ZAINO = ['ripeti', 'fino', 'se']
/* una carta entra nel sentiero del cane solo se ha una sagoma col cane */
const conSagoma = (strada, carta) => SAGOME.some(g => g.carta === carta && animaleDi(g) === strada)

/* `prima` è il ricordo del posto di prima, «famiglia:forma» (i profili
   di ieri scrivevano solo la famiglia) */
export const ricordoDi = t => `${t.famiglia}:${t.forma || ''}`
const leggiRicordo = prima => {
  const [famiglia = null, forma = null] = String(prima || '').split(':')
  return { famiglia: famiglia || null, forma: forma || null }
}

/* di che specie è il prossimo posto; quella appena giocata pesa meno */
export function famigliaDi(rnd, sbloccati, prima = null, strada = 'coniglio') {
  const famiglie = SENTIERI[strada].famiglie
  const pesi = Object.fromEntries(famiglie.map(f => [f,
    f === 'prato' ? 1.5
      : f === 'pascolo' ? (sbloccati.includes('cane') ? 2.5 : 0)
      : sbloccati.includes(f) && conSagoma(strada, f) && (strada !== 'cane' || sbloccati.includes('cane')) ? 1 : 0]))
  const p = leggiRicordo(prima).famiglia
  if (p && pesi[p]) pesi[p] *= 0.3
  let t = rnd() * famiglie.reduce((n, f) => n + pesi[f], 0)
  for (const f of famiglie) if (pesi[f] && (t -= pesi[f]) <= 0) return f
  return famiglie[0]
}

/* ── le forme senza zaino ──
   Il pavimento è la strada più corta senza carota (chi lascia perdere la
   carota non deve trovare un posto facile); `tetto` la più lunga con la
   carota, che deve stare nella fila; `prove` quante bozze al massimo.
   Vedi docs/passo-passo/sentiero.md. */
export const FORME = {
  prato: [
    { forma: 'labirinto', pavimento: 14, tetto: 36, dev: 2, prove: 400, serve: [],
      nomi: ['Il sentiero', 'La siepe', 'Il boschetto', 'Il vallone', 'La conca', 'Il pianoro', 'La radura'] },
    { forma: 'lago', pavimento: 10, tetto: 24, dev: 1, prove: 4000, serve: ['ghiaccio', 'buche'], tema: 'inverno',
      nomi: ['Il lago', 'Lo stagno gelato', 'La pista di ghiaccio', 'Il lago dei sassi'] },
    { forma: 'fiumi', pavimento: 14, tetto: 36, dev: 1, prove: 1500, serve: ['salto'],
      nomi: ['Il guado', 'Le rive', 'Il torrente', 'I fiumi', 'La palude'] },
  ],
  pascolo: [
    { forma: 'aperto', pavimento: 16, tetto: 34, dev: 1, prove: 160, serve: [],
      nomi: ['Il pascolo', 'Il trifoglio', 'Il prato alto', 'La radura'] },
    { forma: 'cancello', pavimento: 20, tetto: 34, dev: 1, prove: 160, serve: [], pecore: [2],
      nomi: ['L\'ovile', 'Il cancello', 'La staccionata'] },
    { forma: 'galleria', pavimento: 16, tetto: 34, dev: 1, prove: 200, serve: ['ghiaccio', 'buche'],
      nomi: ['La galleria', 'Il pascolo gelato', 'La siepe lunga'] },
    { forma: 'corridoio', pavimento: 16, tetto: 34, dev: 1, prove: 160, serve: [],
      nomi: ['Il corridoio', 'Il gregge sparso', 'La stretta', 'Il pascolo lungo'] },
  ],
}
/* il pavimento di ogni forma senza zaino, per nome */
export const PAVIMENTO = Object.fromEntries(Object.values(FORME).flat().map(f => [f.forma, f.pavimento]))
/* le pecore di un pascolo: tre, quattro, a volte cinque (le prime messe
   in fila, il gregge già mezzo riunito) */
const PECORE = [[3, 0.5], [4, 0.4], [5, 0.1]]

/* quanti stati guarda il risolutore su un posto del cane, prima di
   lasciarlo stare: un bambino non se ne accorge, un telefono sì */
export const LIMITE_CANE = 20000

/* quanto vale un sentiero vinto (vedi docs/passo-passo/stelle-e-aiuti.md) */
export const premioDi = t => (t && t.zaino ? 6 : 3)

const a = (rnd, n) => Math.floor(rnd() * n)
const pesca = (rnd, l) => {
  let t = rnd() * l.reduce((n, [, p]) => n + p, 0)
  for (const [v, p] of l) if ((t -= p) <= 0) return v
  return l[0][0]
}

/* l'ordine in cui provare le forme: a caso, quella di prima in fondo */
function ordine(rnd, forme, prima) {
  const l = forme.map(f => [rnd() * (f.forma === prima ? 0.2 : 1), f]).sort((p, q) => q[0] - p[0]).map(p => p[1])
  return l
}

/* ── un sentiero ──
   `fatti` è quanti ne ha già fatti in questa seduta (sceglie la stagione,
   non la difficoltà); `rnd` il caso; `sbloccati` gli ingredienti che
   conosce (`INGREDIENTI`); `prima` il ricordo del posto di prima, che così
   pesa meno; `strada` il sentiero; `famiglia` per chiederne una (i test e
   la misura in strumenti/passo-passo/sentiero.mjs). */
export function generaSentiero(fatti, rnd, { sbloccati = DI_BASE, prima = null, strada = 'coniglio', famiglia = null } = {}) {
  const f = famiglia || famigliaDi(rnd, sbloccati, prima, strada)
  const tema = TEMI[fatti % TEMI.length]
  const ricordo = leggiRicordo(prima)
  const base = { famiglia: f, strada, tema }
  if (ZAINO.includes(f)) {
    const t = generaZaino(f, sbloccati, rnd, { strada, prima: ricordo.forma })
    if (t) return { ...t, ...base, forma: t.sagoma, tema: t.tema || tema, cane: !!Livello.da(t).cane,
                    misure: { carte: t.zaino } }
    /* niente zaino: il cane torna al pascolo, il coniglio ha il suo campo arato */
    if (strada === 'cane') return generaSentiero(fatti, rnd, { sbloccati, prima, strada, famiglia: 'pascolo' })
    return { ...RISERVA_ZAINO, carte: carteInMano(sbloccati), ...base, forma: 'riserva', nome: 'Il campo arato', misure: null }
  }
  const forme = FORME[f].filter(x => x.serve.every(r => sbloccati.includes(r)))
  for (const forma of ordine(rnd, forme, ricordo.forma)) {
    const t = f === 'pascolo' ? provaPascolo(forma, sbloccati, rnd) : provaPrato(forma, sbloccati, rnd)
    if (t) return { ...t, ...base, forma: forma.forma, tema: forma.tema || tema, nome: forma.nomi[a(rnd, forma.nomi.length)] }
  }
  const riserva = f === 'pascolo' ? RISERVA_CANE : RISERVA
  return { ...riserva, ...base, forma: 'riserva', nome: f === 'pascolo' ? 'Il pascolo' : 'Il sentiero',
           regole: [], cane: f === 'pascolo', misure: null }
}

/* le regole di un prato: tutte quelle che la forma sa mettere in scena,
   meno una a volte (nel labirinto); devono servire tutte */
function regoleDelPrato(forma, sbloccati, rnd) {
  const poss = Object.keys(REGOLE).filter(r => sbloccati.includes(r))
  if (forma.forma === 'lago') return ['ghiaccio', 'buche']
  if (forma.forma === 'fiumi') return ['salto', ...(poss.includes('massi') && rnd() < 0.75 ? ['massi'] : [])]
  const togli = poss.length >= 4 ? a(rnd, 2) : 0
  return poss.map(r => [rnd(), r]).sort((p, q) => p[0] - q[0]).map(p => p[1]).slice(togli)
}

function provaPrato(forma, sbloccati, rnd) {
  const regole = regoleDelPrato(forma, sbloccati, rnd)
  const salti = regole.includes('salto')
  const g = { regole, salti, corta: forma.pavimento, celle: [5, rnd() < 0.5 ? 6 : 5], varchi: 0.05, slarghi: 0.15,
              sassi: 0.17 }
  const bozza = { labirinto: bozzaLabirinto, lago: bozzaLago, fiumi: bozzaFiume }[forma.forma]
  for (let i = 0; i < forma.prove; i++) {
    const b = bozza(g, rnd)
    if (!b) continue
    const tappa = { mappa: b, salti }
    const liv = Livello.da(tappa)
    const mis = misura(liv, { limite: 40000 })
    if (!mis.lunga || mis.corta < forma.pavimento || mis.lunga > forma.tetto || mis.deviazione < forma.dev) continue
    if (!regole.every(r => serveLaRegola(liv, REGOLE[r]))) continue
    return { ...tappa, regole, cane: false, misure: { lunga: mis.lunga, corta: mis.corta, deviazione: mis.deviazione } }
  }
  return null
}

/* un pascolo: misurato col risolutore svelto, e la strada che trova si
   rigioca col motore vero. L'osso, se non chiede una deviazione, si
   sposta su una cella dove la strada più corta non passa */
function provaPascolo(forma, sbloccati, rnd) {
  const ghiaccio = sbloccati.includes('ghiaccio')
  for (let i = 0; i < forma.prove; i++) {
    const pecore = forma.pecore ? forma.pecore[a(rnd, forma.pecore.length)] : pesca(rnd, PECORE)
    const g = { pecore, inFila: pecore >= 4 ? pecore - 2 : 0, ghiaccio: ghiaccio && rnd() < 0.5 }
    let b = BOZZE_DEL_PASCOLO[forma.forma](g, rnd)
    if (!b) continue
    let liv = Livello.da({ mappa: b })
    if (!vaBene(liv)) continue
    let mis = misuraSvelta(liv, { limite: LIMITE_CANE, corta: forma.pavimento })
    if (!mis.senzaCarota || mis.corta < forma.pavimento) continue
    if (!mis.lunga || mis.deviazione < forma.dev) {
      b = spostaOsso(b, liv, mis.senzaCarota, rnd)
      if (!b) continue
      liv = Livello.da({ mappa: b })
      mis = misuraSvelta(liv, { limite: LIMITE_CANE, corta: forma.pavimento })
      if (!mis.lunga || mis.deviazione < forma.dev) continue
    }
    if (mis.lunga > forma.tetto) continue
    const r = esegui(liv, mis.conCarota, { eventi: false })
    if (r.esito !== TANA || !r.carota) continue
    if (!forma.serve.every(x => serveLaRegola(liv, REGOLE[x]))) continue
    return { mappa: b, salti: false, regole: forma.serve, cane: true,
             misure: { lunga: mis.lunga, corta: mis.corta, deviazione: mis.deviazione, pecore: liv.pecore.length } }
  }
  return null
}

/* l'osso su un prato dove la strada più corta senza osso non passa */
function spostaOsso(b, liv, strada, rnd) {
  const r = esegui(liv, strada, { eventi: true })
  const passate = new Set([liv.partenza])
  for (const p of r.passi) for (const e of p.eventi) for (const k of ['a', 'dove']) if (e[k] && e.che !== 'fugge') passate.add(e[k].y * liv.colonne + e[k].x)
  const m = b.map(riga => [...riga.replace('c', '.')])
  const libere = []
  for (let y = 0; y < m.length; y++) for (let x = 0; x < m[0].length; x++)
    if (m[y][x] === '.' && !passate.has(y * liv.colonne + x)) libere.push([x, y])
  if (!libere.length) return null
  const [x, y] = libere[a(rnd, libere.length)]
  m[y][x] = 'c'
  return m.map(riga => riga.join(''))
}

/* il posto di riserva con lo zaino: un campo arato, che sta sopra il
   pavimento anche lui */
export const RISERVA_ZAINO = {
  mappa: [
    'P.....A',
    'BBBBB.A',
    '..c...A',
    '.BBBBBA',
    '......A',
    'BBBBB.A',
    '.....@A',
  ],
  salti: false,
  zaino: 9,
  soluzioni: [programma(ripeti(3, ripeti(5, 'destra'), ripeti(2, 'giu'), ripeti(5, 'sinistra'), ripeti(2, 'giu')))],
}

/* il posto di riserva del cane: tre pecore, sopra il pavimento anche lui
   (un pascolo aperto uscito dal generatore) */
export const RISERVA_CANE = {
  mappa: [
    '...A....',
    'S......A',
    '.A.p....',
    '......p.',
    '..p.c...',
    '.......S',
    '...PB##B',
  ],
  salti: false,
}

/* il posto di riserva del prato: un labirinto con tutte e quattro le
   regole, sopra il pavimento (uscito dal generatore) */
export const RISERVA = {
  mappa: [
    '..@..B...',
    '.BBBBB.B.',
    '.....BP..',
    'BBAB.AAA~',
    '1......B.',
    '*AAAAABB.',
    '*A**.~m..',
    '*A*AABBBB',
    '*A1A.....',
    'BA..A.BB.',
    '........c',
  ],
  salti: true,
}
