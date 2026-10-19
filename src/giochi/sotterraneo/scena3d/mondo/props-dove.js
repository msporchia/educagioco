// Dove stanno gli oggetti di scena del mondo di sopra fuori dalle città (puro, senza three): lapidi, rovine, menhir, tronchi,
// palafitte, fumarole, carrelli, accampamenti, cartelli... e il piccolo scenario attorno a ogni ingresso di dungeon. Non si
// aggiunge niente alla pianta: si derivano a scena dalle celle che il generatore ha già fatto (habitat della regione, celle libere,
// strade, lotti), con un caso proprio. Mai su una strada, davanti a una porta, in una città o sopra un albero del decoro.
// Le forme sono in props-aperto.js; il perché in docs/sotterraneo/mondo-3d.md, «I props fuori dalle città».
import { ERBA, ACQUA } from '../../motore/mondo-aperto.js'
import { fbm, quotaTerreno, LIVELLO_ACQUA } from './suolo.js'
import { pezzoDi } from './pezzi.js'

const PI = Math.PI
const hash = (a, b, c = 0) => {
  let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1274126177)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

// Cosa si mette, per habitat: [tipo, probabilità per cella libera (moltiplicata da una macchia di rumore)]. `FORME` dice quanto
// è grande ogni tipo (`R`, il raggio in celle che si tiene libero attorno) e dove può stare: `riva` vicino all'acqua, `acqua`
// dentro (bassa), `strada` accanto a una strada (e a `dist` celle da un altro dello stesso gruppo).
export const FORME = {
  tomba: { R: 1 }, cripta: { R: 1 }, cancello: { R: 1 }, croce: { R: 0 },
  arcoRotto: { R: 1 }, colonnaRotta: { R: 1 }, muretto: { R: 2 }, macerie: { R: 1 },
  menhir: { R: 0 }, cerchio: { R: 2 }, tumulo: { R: 1 }, cespoErica: { R: 1 },
  tronco: { R: 1 }, ceppoGrande: { R: 1 }, funghiGiganti: { R: 1 }, ragnatela: { R: 1 },
  accampamento: { R: 2 }, carro: { R: 2 }, recinto: { R: 1 }, cassaMele: { R: 0 },
  palafitta: { R: 1, acqua: 'fonda' }, barca: { R: 1, riva: true }, canneto: { R: 1, riva: true }, ninfee: { R: 0, acqua: true }, palo: { R: 0, acqua: true },
  fumarola: { R: 1 }, rocciaSpaccata: { R: 1 }, ossa: { R: 1 }, tridente: { R: 0 },
  carrello: { R: 1 }, binari: { R: 2 }, travi: { R: 1 }, minerale: { R: 1 }, argano: { R: 1 }, cairn: { R: 0 },
  cartello: { R: 0, strada: true, dist: 9 }, totem: { R: 0, strada: true, dist: 9 }, miliare: { R: 0, strada: true, dist: 9 },
  // quelli che stanno solo attorno agli ingressi
  teschio: { R: 0 }, braciere: { R: 0 }, pozza: { R: 0 }, bozzolo: { R: 0 }, palizzata: { R: 1 }, sacchi: { R: 0 }, trave: { R: 0 }, crepa: { R: 1 }, lanterna: { R: 0 },
}
export const TABELLA = {
  cimitero: [['tomba', 0.03], ['cripta', 0.004], ['cancello', 0.006], ['croce', 0.01], ['macerie', 0.003]],
  rovine: [['arcoRotto', 0.006], ['colonnaRotta', 0.01], ['muretto', 0.01], ['macerie', 0.012], ['accampamento', 0.002]],
  brughiera: [['menhir', 0.014], ['cerchio', 0.004], ['tumulo', 0.007], ['cespoErica', 0.02], ['accampamento', 0.002], ['carro', 0.002]],
  bosco: [['tronco', 0.005], ['ceppoGrande', 0.01], ['funghiGiganti', 0.012], ['ragnatela', 0.007], ['accampamento', 0.003]],
  foresta: [['tronco', 0.005], ['ceppoGrande', 0.008], ['funghiGiganti', 0.012], ['ragnatela', 0.01], ['accampamento', 0.002]],
  secco: [['tronco', 0.006], ['ceppoGrande', 0.01], ['ragnatela', 0.01], ['ossa', 0.004], ['carro', 0.003]],
  palude: [['palafitta', 0.012], ['barca', 0.01], ['canneto', 0.02], ['ninfee', 0.05], ['palo', 0.04], ['funghiGiganti', 0.004]],
  lago: [['palafitta', 0.005], ['barca', 0.008], ['canneto', 0.02], ['ninfee', 0.025], ['palo', 0.03], ['accampamento', 0.003]],
  ceneri: [['fumarola', 0.008], ['rocciaSpaccata', 0.01], ['ossa', 0.01], ['tridente', 0.008], ['cairn', 0.006]],
  landa: [['ossa', 0.01], ['menhir', 0.012], ['carro', 0.004], ['croce', 0.01], ['tridente', 0.004], ['cairn', 0.006]],
  monte: [['carrello', 0.006], ['binari', 0.006], ['travi', 0.007], ['minerale', 0.01], ['argano', 0.004], ['cairn', 0.012]],
  roccia: [['carrello', 0.003], ['travi', 0.004], ['minerale', 0.008], ['cairn', 0.014], ['menhir', 0.006], ['accampamento', 0.003]],
  prato: [['accampamento', 0.004], ['carro', 0.004], ['recinto', 0.006], ['tronco', 0.004], ['sacchi', 0.004]],
  frutteto: [['cassaMele', 0.012], ['carro', 0.004], ['recinto', 0.008], ['accampamento', 0.003]],
  campi: [['carro', 0.005], ['recinto', 0.01], ['sacchi', 0.006], ['accampamento', 0.003]],
}
// lungo le strade: cosa si trova, per habitat (di default il cartello)
const LUNGO_STRADA = { rovine: 'totem', brughiera: 'totem', ceneri: 'totem', landa: 'totem', monte: 'totem', roccia: 'totem', cimitero: 'totem' }
const PIU_GRANDI = [1, 2.2, 6]   // un oggetto largo ha bisogno di più spazio libero: si prova più spesso
const P_STRADA = 0.05
const DENSITA = 5   // quanto si moltiplicano le probabilità della tabella (tanti candidati cadono su un albero o una strada)

// Il scenario attorno a ogni ingresso: [tipo, du, dv, giro] con (du, dv) in celle dal centro del lotto (dv positivo verso sud,
// cioè davanti), `giro` in radianti. Quello che non cade su una cella buona si salta.
export const SCENARI = {
  altare: [['tomba', -3.4, -1.4, 0.3], ['tomba', 3.6, -1.2, -0.2], ['croce', -3, 1.6, 0.2], ['croce', 3.3, 1.9, -0.3], ['cancello', -4.8, 0.2, 1.57], ['tomba', -0.6, -3.2, 0], ['cripta', 5.2, -2.6, -0.5], ['croce', 0.2, -4.2, 0.1]],
  arco: [['palizzata', -3.8, 0.2, 1.57], ['palizzata', 3.9, 0.4, 1.57], ['carro', -4.6, 3, 0.7], ['macerie', 3.6, -1.6, 0.4], ['sacchi', -2.8, 2.4, 0], ['sacchi', 3.0, 2.2, 0.5], ['teschio', -2.4, 1.8, 0], ['trave', -3.6, -2, 1.2]],
  torre: [['trave', -3.2, -1.6, 0.4], ['trave', 3.2, -1.8, -0.5], ['macerie', -3.6, 1.2, 0.2], ['macerie', 3.8, 0.8, 1.1], ['trave', 0.4, -3.4, 1.4], ['crepa', -3.4, 3.4, 0], ['menhir', 4.6, 2.8, 0.2], ['trave', -4.8, 0, 0.9]],
  grotta: [['ragnatela', -3.4, 0.6, 0.4], ['ragnatela', 3.6, 0.6, -0.3], ['bozzolo', -2.6, 2.2, 0], ['bozzolo', 3.0, 2.4, 0], ['ragnatela', -1.4, -2.6, 1.1], ['funghiGiganti', 4.6, -1.2, 0], ['tronco', -4.8, 2.6, 0.4], ['ragnatela', 5, 2.2, -1.2]],
  stagno: [['pozza', -3.4, 0.6, 0], ['pozza', 3.4, 1.2, 0.5], ['pozza', 0.4, 3.8, 0], ['pozza', -3.6, 3, 1], ['palo', -2.6, 1.6, 0], ['palo', 2.8, -0.4, 0], ['barca', 4.6, 0.2, 0.4], ['canneto', -4.2, -0.6, 0], ['canneto', 4.2, 3.2, 0], ['canneto', 3.6, -2.4, 0], ['palafitta', 0.2, -3.2, 0], ['ninfee', -2.4, -2.4, 0], ['ninfee', 2.6, -2.6, 0], ['ninfee', 0.4, -4.2, 0], ['palo', 3.2, -1.6, 0], ['tronco', -4.6, 2.2, 0.3], ['funghiGiganti', 5, 1.4, 0]],
  botola: [['braciere', -2.6, 1.2, 0], ['braciere', 2.8, 1.2, 0], ['teschio', -2.8, -1.2, 0], ['teschio', 2.8, -1.4, 0], ['tridente', -3.6, 2.6, 0.2], ['tridente', 3.8, 2.8, -0.2], ['rocciaSpaccata', -3.4, -3, 0.5], ['rocciaSpaccata', 4, -3.2, 2], ['ossa', 0.4, -3.4, 0.3], ['crepa', -2.2, 3.2, 0], ['crepa', 2.4, 3.6, 1]],
  miniera: [['binari', 4.4, 3, 1.57], ['carrello', -3.6, 1.6, 0.4], ['travi', -4.8, -0.8, 0], ['minerale', 4.6, 0.2, 0.3], ['minerale', -3.2, -2.6, 1], ['argano', 5.2, -2.2, 0.2], ['lanterna', 3.4, 1.6, 0], ['cairn', -2.2, 3.6, 0]],
  pozzo: [['menhir', -2.6, -1.2, 0.1], ['menhir', 2.8, -1.6, -0.1], ['menhir', -3.6, 1.6, 0.2], ['menhir', 3.8, 1.2, 0], ['menhir', 0.2, -3, 0], ['ossa', 3, 2.8, 0.4], ['crepa', -2.4, 2.8, 0], ['croce', -4.8, 0, -0.3], ['tridente', 4.8, -1, 0.3], ['crepa', 2.2, -2.6, 1.2]],
}

// la griglia di cosa si può posare: celle d'erba delle regioni fuori dal villaggio, non su una strada, un lotto, un campo, un ponte
// o un valico, non nelle città (e attorno), non vicino ai passaggi
function celleLibere(m) {
  const N = m.W * m.H, ok = new Uint8Array(N)
  for (let k = 0; k < N; k++) {
    if (m.terreno[k] !== ERBA || m.strada[k] || m.blocco[k] === 1 || m.riservato[k] || m.campo[k] || m.zonaCitta[k] || m.ponte[k] >= 0 || m.varco[k] >= 0 || m.isola[k]) continue
    if (m.regioni[m.reg[k]].anello < 1) continue
    ok[k] = 1
  }
  const togli = (x0, y0, x1, y1) => { for (let y = Math.max(0, y0); y <= Math.min(m.H - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(m.W - 1, x1); x++) ok[y * m.W + x] = 0 }
  for (const c of m.citta) { const r = c.raggio + 3; togli(c.centro.x - r, c.centro.y - r, c.centro.x + r, c.centro.y + r) }
  for (const q of m.passaggi) for (const c of q.celle || []) togli(c.x - 2, c.y - 2, c.x + 2, c.y + 2)
  return ok
}
// i lotti dei posti fuori dalle città (la pietra, gli antri, la bacheca) e dei loro «accanto»: un giro di margine in più, perché non ci
// si ammassi. Gli ingressi, per il resto della regione, si tengono larghi (`sciolti` li lascia stare: li vede solo il loro scenario)
function senzaPosti(m, ok, sciolti = false) {
  const f = Uint8Array.from(ok)
  for (const p of m.posti) {
    if (p.tipo === 'citta' || p.tipo === 'mercante' || !p.w) continue
    const ing = p.tipo === 'ingresso'
    if (sciolti && ing) continue
    const g = ing ? 4 : 1
    for (let y = Math.max(0, p.y - g); y <= Math.min(m.H - 1, p.y + p.h + g + (ing ? 2 : 1)); y++)
      for (let x = Math.max(0, p.x - g); x <= Math.min(m.W - 1, p.x + p.w - 1 + g); x++) f[y * m.W + x] = 0
  }
  return f
}

// i posti da provare attorno a quello voluto, dal più vicino
const CERCA = [[0, 0], ...[0.9, 1.7, 2.5].flatMap(r => [0, 1, 2, 3, 4, 5, 6, 7].map(i => [Math.cos(i * PI / 4 + r) * r, Math.sin(i * PI / 4 + r) * r]))]
export const PROPS = new WeakMap()
// Tutti gli oggetti di scena del mondo: [{ tipo, x, z, giro, seme, pezzo, ingresso? }], in ordine fisso. Una volta per mondo
export function propsDelMondo(m) {
  if (PROPS.has(m)) return PROPS.get(m)
  const { W, H } = m
  const grezza = celleLibere(m), generale = senzaPosti(m, grezza), base = senzaPosti(m, grezza, true)
  const occ = new Uint8Array(W * H), occStrada = new Uint8Array(W * H)
  // gli alberi (e ogni ingombro) del decoro, per cella: un oggetto non ci si siede sopra (la cella di un albero è libera: conta la distanza)
  const alberi = new Map()
  for (const d of m.decoro) {
    if (!d.blocca) continue
    const k = Math.floor(d.y) * W + Math.floor(d.x)
    ;(alberi.get(k) || alberi.set(k, []).get(k)).push(d)
  }
  const sotto = (x, z, r) => {
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const l = alberi.get((Math.floor(z) + j) * W + Math.floor(x) + i)
      if (l) for (const d of l) if (Math.hypot(d.x - x, d.y - z) < 0.35 + d.s * 0.4 + r) return true
    }
    return false
  }
  const dentro = (x, y) => x >= 0 && y >= 0 && x < W && y < H
  const strada4 = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dy]) => dentro(x + dx, y + dy) && m.strada[(y + dy) * W + x + dx] && m.strada[(y + dy) * W + x + dx] < 3)
  const nonStrada = (x, y, R) => {
    for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) if (dentro(x + i, y + j) && m.strada[(y + j) * W + x + i]) return false
    return true
  }
  const acquaVicina = (x, y, R) => {
    for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) if (dentro(x + i, y + j) && m.terreno[(y + j) * W + x + i] === ACQUA) return true
    return false
  }
  const lista = []
  const metti = (tipo, x, z, giro, extra = {}) => {
    const R = FORME[tipo].R, cx = Math.floor(x), cy = Math.floor(z)
    for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) if (dentro(cx + i, cy + j)) occ[(cy + j) * W + cx + i] = 1
    lista.push({ tipo, x, z, giro, seme: Math.floor(x * 37 + z * 91) + lista.length, pezzo: pezzoDi(m, x, z), ...extra })
  }
  // si può posare in (cx, cy) con la sua forma? `mappa`: le celle buone di partenza
  const puo = (mappa, tipo, cx, cy, x, z) => {
    const f = FORME[tipo], R = f.R
    if (f.acqua) {
      const k = cy * W + cx
      if (m.terreno[k] !== ACQUA || m.ponte[k] >= 0 || m.varco[k] >= 0) return false
      const l = m.regioni[m.reg[k]].habitat
      if (l !== 'palude' && l !== 'lago') return false
      for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) {
        const kk = (cy + j) * W + cx + i
        if (!dentro(cx + i, cy + j) || m.terreno[kk] !== ACQUA || m.ponte[kk] >= 0 || m.varco[kk] >= 0 || m.riservato[kk] || occ[kk]) return false
        if (f.acqua === 'fonda' && LIVELLO_ACQUA - m.quota[kk] > 1.3) return false
      }
      // lontano dai passaggi (ponti e valichi) e da una riva piena di strade
      for (const q of m.passaggi) for (const c of q.celle || []) if (Math.abs(c.x - cx) < 4 && Math.abs(c.y - cy) < 4) return false
      return true
    }
    for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) {
      const kk = (cy + j) * W + cx + i
      if (!dentro(cx + i, cy + j) || !mappa[kk] || occ[kk]) return false
    }
    if (!f.strada && !nonStrada(cx, cy, R)) return false
    if (f.riva && !acquaVicina(cx, cy, R + 2)) return false
    if (sotto(x, z, [0.35, 0.8, 1.35][R])) return false
    return true
  }

  // 1. lo scenario degli ingressi, per primo: ha il posto migliore
  for (const g of m.ingressi) {
    const ricetta = SCENARI[g.monumento]
    if (!ricetta) continue
    const cx0 = g.x + g.w / 2, cz0 = g.y + g.h / 2
    for (const [tipo, du, dv, giro] of ricetta) {
      // si prova al posto voluto e poi attorno, a giri sempre più larghi: dove c'è un albero o una strada si sposta un poco
      for (let n = 0; n < CERCA.length; n++) {
        const x = cx0 + du + CERCA[n][0], z = cz0 + dv + CERCA[n][1], cx = Math.floor(x), cy = Math.floor(z)
        if (!dentro(cx, cy) || !puo(base, tipo, cx, cy, x, z)) continue
        metti(tipo, x, z, giro, { ingresso: g.chiave })
        break
      }
    }
  }
  // 2. lungo le strade: un cartello, un totem o una pietra miliare ogni tanto, a una decina di celle l'uno dall'altro
  for (let k = 0; k < W * H; k++) {
    if (!generale[k] || occ[k]) continue
    const x = k % W, y = (k / W) | 0, lato = strada4(x, y)
    if (!lato || hash(x, y, 4401) > P_STRADA) continue
    if (m.zonaCitta[k]) continue
    const h = m.regioni[m.reg[k]].habitat
    const tipo = hash(x, y, 4402) < 0.45 ? 'miliare' : LUNGO_STRADA[h] || 'cartello'
    let vicino = false
    const D = FORME[tipo].dist
    for (let j = -D; j <= D && !vicino; j++) for (let i = -D; i <= D; i++) if (dentro(x + i, y + j) && occStrada[(y + j) * W + x + i]) { vicino = true; break }
    if (vicino) continue
    const px = x + 0.5 + lato[0] * -0.08, pz = y + 0.5 + lato[1] * -0.08
    if (!puo(generale, tipo, x, y, px, pz)) continue
    // il suo davanti guarda la strada
    metti(tipo, px, pz, Math.atan2(lato[0], lato[1]), { strada: true })
    for (let j = -D; j <= D; j++) for (let i = -D; i <= D; i++) if (dentro(x + i, y + j)) occStrada[(y + j) * W + x + i] = 1
  }
  // 3. per habitat: a ogni cella una prova per ogni tipo, con una macchia di rumore che li raggruppa. Prima i grandi, che vogliono
  // spazio, poi i piccoli negli spazi che restano
  for (const grandi of [true, false]) for (let k = 0; k < W * H; k++) {
    const x = k % W, y = (k / W) | 0, hab = m.regioni[m.reg[k]].habitat, tab = TABELLA[hab]
    if (!tab || m.regioni[m.reg[k]].anello < 1) continue
    const via = Math.floor(hash(x, y, 4900) * tab.length)
    for (let ii = 0; ii < tab.length; ii++) {
      const i = (ii + via) % tab.length, [tipo, p] = tab[i], f = FORME[tipo]
      if ((f.R >= 1) !== grandi) continue
      const sale = f.acqua ? m.terreno[k] === ACQUA : generale[k]
      if (!sale || hash(x, y, 5000 + i) > p * DENSITA * PIU_GRANDI[f.R] * (0.25 + 1.5 * fbm(x, y, 6100 + i * 7, 9))) continue
      const jx = 0.5 + (hash(x, y, 5100 + i) - 0.5) * 0.4, jz = 0.5 + (hash(x, y, 5200 + i) - 0.5) * 0.4
      if (!puo(generale, tipo, x, y, x + jx, y + jz)) continue
      metti(tipo, x + jx, y + jz, hash(x, y, 5300 + i) * Math.PI * 2)
      break
    }
  }
  PROPS.set(m, lista)
  return lista
}

// gli oggetti di un pezzo
export function propsDelPezzo(m, p) {
  return propsDelMondo(m).filter(o => o.pezzo === p)
}
// l'altezza a cui si posa un oggetto e quanto sta l'acqua sopra o sotto la sua base (per i pali e le palafitte)
export function quotaProp(m, o) {
  const y = quotaTerreno(m, o.x, o.z)
  return { y, liv: LIVELLO_ACQUA - y }
}
