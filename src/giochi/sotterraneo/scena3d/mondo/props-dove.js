// Dove stanno gli oggetti di scena del mondo di sopra fuori dal villaggio (puro, senza three): lapidi, rovine, menhir, tronchi,
// palafitte, fumarole, carrelli, accampamenti, cartelli... e il piccolo scenario attorno a ogni ingresso di dungeon. Non si
// aggiunge niente alla pianta: si derivano a scena dalle celle di una zona caricata (l'habitat del suo luogo, celle libere, strade,
// lotti), con un caso proprio, e se ne vanno con la zona. Mai su una strada, davanti a una porta, nel villaggio, su un confine fra
// due zone o sopra un albero del decoro. Le forme sono in props-aperto.js; il perché in docs/sotterraneo/mondo-3d.md, «I props
// fuori dal villaggio».
import { fbm, quotaTerreno, LIVELLO_ACQUA, ERBA, ACQUA } from './suolo.js'
import { pezzoDi } from './pezzi.js'
import { ricettaDi } from './props-tana-dati.js'

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
  // il segno delle tane (props-tana-dati.js): tutti piccoli, a una cella; le varianti «Tana» disegnano come i loro fratelli maggiori
  sassiTana: { R: 0 }, cenereTana: { R: 0 }, braciTana: { R: 0 }, bozzoliTesi: { R: 0 }, canneSpezzate: { R: 0 }, nidoFango: { R: 0 }, carcassa: { R: 0 }, mucchio: { R: 0 }, croceStorta: { R: 0 },
  ossaTana: { R: 0 }, crepaTana: { R: 0 }, rocciaTana: { R: 0 }, macerieTana: { R: 0 },
  teschio: { R: 0 }, braciere: { R: 0 }, pozza: { R: 0 }, bozzolo: { R: 0 }, palizzata: { R: 1 }, sacchi: { R: 0 }, trave: { R: 0 }, crepa: { R: 1 }, lanterna: { R: 0 },
}
export const TABELLA = {
  cimitero: [['tomba', 0.016], ['cripta', 0.004], ['cancello', 0.006], ['croce', 0.01], ['macerie', 0.003]],
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
// quanto si moltiplicano le probabilità della tabella (tanti candidati cadono su un albero o una strada). Era 5 sul mondo ad anelli:
// sul percorso le zone hanno più erba libera, e a 5 un pezzo arrivava a 14k triangoli di soli oggetti
const DENSITA = 3.5

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
  // i sei dungeon nuovi (dati/mondo-aperto.js, INGRESSI_DEL_MONDO): per chiave quando il monumento è di un altro (il pozzo, la miniera)
  menhir: [['tumulo', -4.2, -1.6, 0.4], ['cespoErica', 3.8, 2.6, 0], ['cespoErica', -3.6, 2.8, 0], ['menhir', 4.6, -2.2, 0.3], ['cairn', -2.8, 3.6, 0], ['ossa', 3.2, -3.4, 1.1], ['cespoErica', 0.4, -4.2, 0]],
  corvaia: [['ossa', 2.8, 2.4, 0.4], ['palo', -2.6, -1.6, 0], ['palo', 2.6, -1.8, 0], ['menhir', -3.6, 1.6, 0.2], ['ragnatela', 3.8, 0.4, -0.3], ['crepa', -2.4, 2.8, 0], ['cespoErica', 4.4, -2.8, 0], ['teschio', -1.6, 2.2, 0], ['tronco', -4.6, -0.8, 0.6]],
  palafitta: [['canneto', -3.6, 1.2, 0], ['canneto', 3.8, 1.6, 0], ['palo', -2.4, -2.2, 0], ['palo', 2.6, -2.4, 0], ['barca', 4.4, -0.6, 0.6], ['funghiGiganti', -4.6, -1.4, 0], ['pozza', -2.8, 3, 0], ['pozza', 2.6, 3.2, 0.5], ['ninfee', 0.4, -3.6, 0]],
  fumarola: [['fumarola', -3.4, -1.2, 0], ['fumarola', 3.6, -1.6, 0.6], ['rocciaSpaccata', -3.8, 2, 0.5], ['rocciaSpaccata', 4, 2.4, 1.6], ['braciere', -1.9, 1.8, 0], ['braciere', 2.1, 1.8, 0], ['crepa', 0.2, -3.2, 0.4], ['ossa', -4.8, 0.2, 0.3], ['tridente', 4.8, 0.2, -0.2]],
  cava: [['minerale', 4.6, 0.2, 0.3], ['minerale', -3.2, -2.6, 1], ['carrello', -3.6, 1.6, 0.4], ['binari', 4.4, 3, 1.57], ['travi', -4.8, -0.8, 0], ['argano', 5.2, -2.2, 0.2], ['cairn', -2.2, 3.6, 0], ['lanterna', 3.4, 1.6, 0]],
  tomba: [['croce', -3.2, 1.4, 0.2], ['croce', 3.4, 1.6, -0.2], ['tomba', -3.6, -1.4, 0.3], ['tomba', 3.8, -1.2, -0.3], ['menhir', -4.6, 2.8, 0.1], ['menhir', 4.8, 2.6, -0.1], ['ossa', 0.6, 3.6, 0.5], ['colonnaRotta', -1.6, -3.4, 0.2], ['colonnaRotta', 2, -3.4, 1.2], ['tridente', 0, -4.6, 0]],
}
export const scenarioDi = g => SCENARI[g.chiave] || SCENARI[g.monumento] || null

// la griglia di cosa si può posare in una zona: le sue celle d'erba fuori dal villaggio, non su una strada, un lotto, un campo, un
// ponte o un valico, non vicino al villaggio né a un confine fra due zone (il fiume col ponte, la cresta col valico: lì si vede
// che il terreno cambia, e non c'è niente in mezzo)
const LONTANO_DAL_CONFINE = 7
function celleLibere(m, k, R) {
  const ok = new Uint8Array(m.W * m.H), Z = m.zone[k]
  const confini = m.confini.filter(c => c.da === Z.chiave || c.a === Z.chiave).map(c => c.s)
  for (let y = R.y0; y <= R.y1; y++) for (let x = R.x0; x <= R.x1; x++) {
    const i = y * m.W + x
    if (m.zona[i] !== k || !m.reg[i]) continue
    if (m.terreno[i] !== ERBA || m.strada[i] || m.blocco[i] === 1 || m.riservato[i] || m.campo[i] || m.zonaCitta[i] || m.ponte[i] >= 0 || m.varco[i] >= 0 || m.isola[i]) continue
    if (confini.some(s => Math.abs(m.arco[i] - s) < LONTANO_DAL_CONFINE)) continue
    ok[i] = 1
  }
  const togli = (x0, y0, x1, y1) => { for (let y = Math.max(0, y0); y <= Math.min(m.H - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(m.W - 1, x1); x++) ok[y * m.W + x] = 0 }
  const v = m.villaggio
  togli(v.x - 3, v.y - 3, v.x + v.w + 2, v.y + v.h + 2)
  for (const q of m.confini) for (const c of q.celle || []) togli(c.x - 3, c.y - 3, c.x + 3, c.y + 3)
  return ok
}
// i lotti dei posti fuori dal villaggio (la pietra, il mulino, chi sta fermo, la porta delle terre) e dei loro «accanto»: un giro di
// margine in più, perché non ci si ammassi. Gli ingressi, per il resto della zona, si tengono larghi (`sciolti` li lascia stare: li
// vede solo il loro scenario)
function senzaPosti(m, ok, sciolti = false) {
  const f = Uint8Array.from(ok)
  for (const p of m.posti) {
    if (p.tipo === 'citta' || p.citta === 'villaggio' || !p.w) continue
    const ing = p.tipo === 'ingresso'
    if (sciolti && ing) continue
    const g = ing ? 4 : 1
    for (let y = Math.max(0, p.y - g); y <= Math.min(m.H - 1, p.y + p.h + g + (ing ? 2 : 1)); y++)
      for (let x = Math.max(0, p.x - g); x <= Math.min(m.W - 1, p.x + p.w - 1 + g); x++) f[y * m.W + x] = 0
  }
  return f
}

// Le celle dove può stare il segno di una tana: come `celleLibere`, ma attorno al cuore della tana (±4 celle) anche sulle celle che il
// generatore ha riservato per lei (il suo quadrato di 7×7: niente decoro, niente altro)
function celleDelleTane(m, k, tane) {
  const ok = new Uint8Array(m.W * m.H), Z = m.zone[k]
  const confini = m.confini.filter(c => c.da === Z.chiave || c.a === Z.chiave).map(c => c.s)
  const v = m.villaggio
  for (const t of tane) for (let y = Math.max(0, t.y - 4); y <= Math.min(m.H - 1, t.y + 4); y++) for (let x = Math.max(0, t.x - 4); x <= Math.min(m.W - 1, t.x + 4); x++) {
    const i = y * m.W + x
    if (m.zona[i] !== k || !m.reg[i]) continue
    if (m.terreno[i] !== ERBA || m.strada[i] || m.blocco[i] === 1 || m.campo[i] || m.zonaCitta[i] || m.ponte[i] >= 0 || m.varco[i] >= 0 || m.isola[i]) continue
    if (m.riservato[i] && (Math.abs(x - t.x) > 3 || Math.abs(y - t.y) > 3)) continue
    if (confini.some(s => Math.abs(m.arco[i] - s) < LONTANO_DAL_CONFINE)) continue
    if (x >= v.x - 3 && y >= v.y - 3 && x < v.x + v.w + 3 && y < v.y + v.h + 3) continue
    ok[i] = 1
  }
  for (const q of m.confini) for (const c of q.celle || []) for (let y = c.y - 3; y <= c.y + 3; y++) for (let x = c.x - 3; x <= c.x + 3; x++) if (x >= 0 && y >= 0 && x < m.W && y < m.H) ok[y * m.W + x] = 0
  return ok
}

// i posti da provare attorno a quello voluto, dal più vicino
const CERCA = [[0, 0], ...[0.9, 1.7, 2.5].flatMap(r => [0, 1, 2, 3, 4, 5, 6, 7].map(i => [Math.cos(i * PI / 4 + r) * r, Math.sin(i * PI / 4 + r) * r]))]
const PROPS = new WeakMap()
// Gli oggetti di scena di una zona caricata: [{ tipo, x, z, giro, seme, pezzo, ingresso? }], in ordine fisso, sempre gli stessi per
// la stessa zona (non dipendono da quali altre sono caricate). Una volta per carico: se la zona si ricarica si rifanno uguali
export function propsDellaZona(m, k) {
  const carico = m.carico[k]
  if (!carico) return []
  if (PROPS.has(carico)) return PROPS.get(carico)
  const { W, H } = m, Z = m.zone[k], R = Z.rettangolo
  const grezza = celleLibere(m, k, R), generale = senzaPosti(m, grezza), base = senzaPosti(m, grezza, true)
  const occ = new Uint8Array(W * H), occStrada = new Uint8Array(W * H)
  // gli alberi (e ogni ingombro) del decoro, per cella: un oggetto non ci si siede sopra (la cella di un albero è libera: conta la distanza)
  const alberi = new Map()
  for (const d of carico.decoro) {
    if (!d.blocca) continue
    const q = Math.floor(d.y) * W + Math.floor(d.x)
    ;(alberi.get(q) || alberi.set(q, []).get(q)).push(d)
  }
  const sotto = (x, z, r) => {
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const l = alberi.get((Math.floor(z) + j) * W + Math.floor(x) + i)
      if (l) for (const d of l) if (Math.hypot(d.x - x, d.y - z) < 0.35 + d.s * 0.4 + r) return true
    }
    return false
  }
  const dentro = (x, y) => x >= 0 && y >= 0 && x < W && y < H
  const mia = i => m.zona[i] === k
  const strada4 = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dy]) => dentro(x + dx, y + dy) && m.strada[(y + dy) * W + x + dx] && m.strada[(y + dy) * W + x + dx] < 3)
  const nonStrada = (x, y, Rr) => {
    for (let j = -Rr; j <= Rr; j++) for (let i = -Rr; i <= Rr; i++) if (dentro(x + i, y + j) && m.strada[(y + j) * W + x + i]) return false
    return true
  }
  const acquaVicina = (x, y, Rr) => {
    for (let j = -Rr; j <= Rr; j++) for (let i = -Rr; i <= Rr; i++) if (dentro(x + i, y + j) && m.terreno[(y + j) * W + x + i] === ACQUA) return true
    return false
  }
  const lista = []
  const metti = (tipo, x, z, giro, extra = {}) => {
    const Rr = FORME[tipo].R, cx = Math.floor(x), cy = Math.floor(z)
    for (let j = -Rr; j <= Rr; j++) for (let i = -Rr; i <= Rr; i++) if (dentro(cx + i, cy + j)) occ[(cy + j) * W + cx + i] = 1
    lista.push({ tipo, x, z, giro, seme: Math.floor(x * 37 + z * 91) + lista.length, pezzo: pezzoDi(m, x, z), zona: k, ...extra })
  }
  // si può posare in (cx, cy) con la sua forma? `mappa`: le celle buone di partenza
  const puo = (mappa, tipo, cx, cy, x, z) => {
    const f = FORME[tipo], Rr = f.R
    if (f.acqua) {
      const q = cy * W + cx
      if (!mia(q) || m.terreno[q] !== ACQUA || m.ponte[q] >= 0 || m.varco[q] >= 0) return false
      const l = m.regioni[m.reg[q]].habitat
      if (l !== 'palude' && l !== 'lago') return false
      for (let j = -Rr; j <= Rr; j++) for (let i = -Rr; i <= Rr; i++) {
        const kk = (cy + j) * W + cx + i
        if (!dentro(cx + i, cy + j) || !mia(kk) || m.terreno[kk] !== ACQUA || m.ponte[kk] >= 0 || m.varco[kk] >= 0 || m.riservato[kk] || occ[kk]) return false
        if (f.acqua === 'fonda' && LIVELLO_ACQUA - m.quota[kk] > 1.3) return false
      }
      // lontano dai confini (il fiume col ponte) e dal villaggio
      for (const q2 of m.confini) for (const c of q2.celle || []) if (Math.abs(c.x - cx) < 8 && Math.abs(c.y - cy) < 8) return false
      return true
    }
    for (let j = -Rr; j <= Rr; j++) for (let i = -Rr; i <= Rr; i++) {
      const kk = (cy + j) * W + cx + i
      if (!dentro(cx + i, cy + j) || !mappa[kk] || occ[kk]) return false
    }
    if (!f.strada && !nonStrada(cx, cy, Rr)) return false
    if (f.riva && !acquaVicina(cx, cy, Rr + 2)) return false
    if (sotto(x, z, [0.35, 0.8, 1.35][Rr])) return false
    return true
  }

  // 1. lo scenario degli ingressi della zona, per primo: ha il posto migliore
  for (const g of m.ingressi) {
    const ricetta = g.zona === Z.chiave && scenarioDi(g)
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
  // 1b. il segno di ogni tana della zona (props-tana-dati.js): attorno al suo cuore, in cerchio, ognuno sulla sua cella buona (la
  // mappa di blocco non si tocca: sono segni, non muri). Il caso è della tana: la sua cella dà il giro del cerchio e le piccole mosse
  const tane = m.regioni.filter(R => R.zona === k && R.tana && ricettaDi(R.habitat)).map(R => ({ R, x: R.tana.x, y: R.tana.y }))
  if (tane.length) {
    const buone = senzaPosti(m, celleDelleTane(m, k, tane))
    for (const t of tane) {
      const cx0 = t.x + 0.5, cz0 = t.y + 0.5, giro0 = hash(t.x, t.y, 7001) * 360
      ricettaDi(t.R.habitat).forEach(([tipo, r, gradi, giro], i) => {
        const e = hash(t.x, t.y, 7100 + i)
        // al posto voluto, e se non va un poco più in qua o più in là, a giri sempre più larghi
        for (const [dr, da] of [[0, 0], [0.4, 0], [-0.4, 0], [0, 12], [0, -12], [0.4, 14], [-0.4, -14]]) {
          const rr = r ? Math.max(0, r + dr + (e - 0.5) * 0.3) : 0, a = (giro0 + gradi + da + (e - 0.5) * 10) * PI / 180
          const x = cx0 + Math.cos(a) * rr, z = cz0 + Math.sin(a) * rr, cx = Math.floor(x), cy = Math.floor(z)
          if (!dentro(cx, cy) || !puo(buone, tipo, cx, cy, x, z)) continue
          const ry = giro === 'tang' ? -(a + PI / 2) : giro === 'centro' ? Math.atan2(-Math.cos(a), -Math.sin(a)) : giro + a
          metti(tipo, x, z, ry, { tana: t.R.chiave })
          break
        }
      })
    }
  }
  // 2. lungo le strade: un cartello, un totem o una pietra miliare ogni tanto, a una decina di celle l'uno dall'altro
  for (let y = R.y0; y <= R.y1; y++) for (let x = R.x0; x <= R.x1; x++) {
    const q = y * W + x
    if (!generale[q] || occ[q]) continue
    const lato = strada4(x, y)
    if (!lato || hash(x, y, 4401) > P_STRADA) continue
    const h = m.regioni[m.reg[q]].habitat
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
  for (const grandi of [true, false]) for (let y = R.y0; y <= R.y1; y++) for (let x = R.x0; x <= R.x1; x++) {
    const q = y * W + x
    if (!mia(q) || !m.reg[q]) continue
    const tab = TABELLA[m.regioni[m.reg[q]].habitat]
    if (!tab) continue
    const via = Math.floor(hash(x, y, 4900) * tab.length)
    for (let ii = 0; ii < tab.length; ii++) {
      const i = (ii + via) % tab.length, [tipo, p] = tab[i], f = FORME[tipo]
      if ((f.R >= 1) !== grandi) continue
      const sale = f.acqua ? m.terreno[q] === ACQUA : generale[q]
      if (!sale || hash(x, y, 5000 + i) > p * DENSITA * PIU_GRANDI[f.R] * (0.25 + 1.5 * fbm(x, y, 6100 + i * 7, 9))) continue
      const jx = 0.5 + (hash(x, y, 5100 + i) - 0.5) * 0.4, jz = 0.5 + (hash(x, y, 5200 + i) - 0.5) * 0.4
      if (!puo(generale, tipo, x, y, x + jx, y + jz)) continue
      metti(tipo, x + jx, y + jz, hash(x, y, 5300 + i) * Math.PI * 2)
      break
    }
  }
  PROPS.set(carico, lista)
  return lista
}

// gli oggetti di un pezzo, dalle zone caricate
export function propsDelPezzo(m, p) {
  const l = []
  for (let k = 0; k < m.zone.length; k++) if (m.zonaCaricata[k]) for (const o of propsDellaZona(m, k)) if (o.pezzo === p) l.push(o)
  return l
}
// l'altezza a cui si posa un oggetto e quanto sta l'acqua sopra o sotto la sua base (per i pali e le palafitte)
export function quotaProp(m, o) {
  const y = quotaTerreno(m, o.x, o.z)
  return { y, liv: LIVELLO_ACQUA - y }
}
