/* ═══════════════════════════════════════════════════════════════════
   GLI OGGETTI DEL VILLAGGIO NEL MONDO DI SOPRA IN 3D, LE PARTI PURE
   — docs/sotterraneo/mondo-3d.md, «Gli oggetti del villaggio»

   Insegne, lanterne, panche, barili, carretti, fiori… si derivano dal
   villaggio già generato (che non cambia): stanno su celle libere di erba
   dentro il villaggio, mai su una strada, su un posto, davanti a una porta
   o nelle zone tenute libere davanti alle botteghe, e mai sul davanti (fra
   la piazza e chi guarda) se non sono piccole e basse: dalla piazza si
   devono vedere tutti. Niente orti. Sono sempre uguali, ognuno sta nel
   pezzo della sua cella, ogni modello ha un nome e poche facce.
   ═══════════════════════════════════════════════════════════════════ */
import { scheletroDelMondo, caricaZona, ERBA } from '../../src/giochi/sotterraneo/motore/mondo-percorso.js'
import { propsDellaCitta, propsPerPezzo } from '../../src/giochi/sotterraneo/scena3d/mondo/props-citta.js'
import { MODELLI } from '../../src/giochi/sotterraneo/scena3d/mondo/props-modelli.js'
import { Cantiere } from '../../src/giochi/sotterraneo/scena3d/mondo/kit.js'
import { caso } from '../../src/giochi/sotterraneo/scena3d/mondo/suolo.js'
import { pezzoDi, grigliaDi } from '../../src/giochi/sotterraneo/scena3d/mondo/pezzi.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const m = scheletroDelMondo()
{
  const vuoti = propsPerPezzo(m)
  uguale('prima che la zona del villaggio sia caricata, niente oggetti', vuoti.flat().length, 0)
}
caricaZona(m, 0)
const v = m.villaggio
const firma = () => [...m.blocco, ...m.strada, ...m.riservato].reduce((s, x) => (Math.imul(s, 31) + x) | 0, 7)
const prima = firma()
const l = propsDellaCitta(m)

/* ── il mondo non cambia, i risultati sono sempre gli stessi ── */
{
  controlla('due calcoli danno gli stessi oggetti', JSON.stringify(propsDellaCitta(m)) === JSON.stringify(l))
  uguale('la mappa del mondo non è stata toccata', firma(), prima)
  dentro('il villaggio ha i suoi oggetti, non troppi', l.length, 25, 90)
  const altro = scheletroDelMondo(); caricaZona(altro, 0)
  uguale('un altro mondo dallo stesso seme dà gli stessi', JSON.stringify(propsDellaCitta(altro)), JSON.stringify(l))
}

/* ── i posti: mai su strade, posti, porte; tutti dentro il villaggio ── */
{
  const rettangoli = []
  for (const cs of v.case) rettangoli.push({ x: cs.x, y: cs.y, w: cs.w, h: cs.h, che: 'casa' })
  for (const p of m.posti) if (p.tipo !== 'citta') rettangoli.push({ x: p.x, y: p.y, w: p.w, h: p.h, che: p.tipo })
  const dentroA = (r, x, y) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h
  const celle = new Set()
  let guasti = 0, doppie = 0, fuori = 0
  for (const o of l) for (const [x, y] of o.celle) {
    const k = y * m.W + x
    if (celle.has(k)) doppie++
    celle.add(k)
    if (x < v.x || y < v.y || x >= v.x + v.w || y >= v.y + v.h) fuori++
    if (m.terreno[k] !== ERBA || m.strada[k] || m.blocco[k] || m.riservato[k] || m.ponte[k] >= 0) guasti++
    else if (rettangoli.some(r => dentroA(r, x, y))) guasti++
    for (const p of m.posti) if (p.accanto && p.accanto.x === x && p.accanto.y === y) guasti++
  }
  uguale('nessun oggetto su una strada, un posto, dove ci si ferma o sull\'acqua', guasti, 0)
  uguale('nessuna cella data due volte', doppie, 0)
  uguale('tutti dentro il villaggio', fuori, 0)
  controlla('ogni oggetto ha un modello', l.every(o => typeof MODELLI[o.tipo] === 'function'))
  controlla('l\'asse del davanti è un numero', l.every(o => Number.isFinite(o.ry) && Number.isFinite(o.x) && Number.isFinite(o.z) && o.seme > 0))
}

/* ── il davanti resta libero: dalla piazza si vedono tutti ── */
{
  const fondo = v.piazza.y + v.piazza.h
  const davanti = l.filter(o => o.celle.some(([, y]) => y >= fondo))
  controlla('sul davanti solo cose basse e piccole (fiori, vasi, lanterne, panche)', davanti.every(o => ['fiori', 'vaso', 'lanterna', 'panca'].includes(o.tipo)), davanti.map(o => o.tipo).join(','))
  const tipi = new Set(l.map(o => o.tipo))
  controlla('niente orti', !tipi.has('orto'))
  controlla('niente del forte né del rifugio (palizzate, tende, bandiere, pellicce)', !['palizzata', 'tenda', 'bandiera', 'pellicce', 'slitta'].some(t => tipi.has(t)))
  // fra una persona del villaggio e la telecamera (a sud) non c'è niente di alto
  const persone = [...v.mercanti, ...v.persone, v.minatore].map(p => p.piede)
  const alti = l.filter(o => !['fiori', 'vaso', 'lanterna', 'panca', 'insegna'].includes(o.tipo))
  let davantiA = 0
  for (const p of persone) for (const o of alti) if (Math.abs(o.x - (p.x + 0.5)) < 0.9 && o.z > p.y + 0.5 && o.z < p.y + 4) davantiA++
  uguale('nessun oggetto alto davanti a chi sta nel villaggio', davantiA, 0)
}

/* ── le botteghe hanno la loro insegna, la piazza le sue lanterne ── */
{
  for (const b of v.mercanti) controlla(`l'insegna di ${b.bottega}`, l.some(o => o.tipo === 'insegna' && o.bottega === b.bottega))
  const conta = {}; for (const o of l) conta[o.tipo] = (conta[o.tipo] || 0) + 1
  controlla('ci sono le lanterne, le panche e i tavoli', conta.lanterna >= 3 && conta.panca > 0 && conta.tavolo > 0, JSON.stringify(conta))
  controlla('l\'incudine e la ruota di pietra del fabbro', (conta.incudine || 0) + (conta.ruota || 0) > 0)
  controlla('i fuochi veri sono pochi (le fiamme sono 24 in tutto)', l.filter(o => o.fuoco).length <= 8)
}

/* ── ognuno nel suo pezzo; la nebbia lo legge lì ── */
{
  const pezzi = propsPerPezzo(m), { n } = grigliaDi(m)
  uguale('un elenco per pezzo', pezzi.length, n)
  let fuori = 0, tot = 0
  pezzi.forEach((q, p) => { for (const o of q) { tot++; if (pezzoDi(m, o.x, o.z) !== p) fuori++ } })
  uguale('ogni oggetto sta nel pezzo della sua cella', fuori, 0)
  uguale('li ha tutti', tot, l.length)
  nota(`${tot} oggetti di scena nel villaggio`)
}

/* ── i modelli: poche facce, tutti nel cantiere, dentro misure ragionevoli ── */
{
  let peggiore = ['', 0]
  for (const [nome, f] of Object.entries(MODELLI)) {
    const c = new Cantiere(), cose = { fuochi: [], camini: [], braci: [] }
    f(c, caso(7), { bottega: 'fucina', fuoco: true }, cose)
    controlla(`${nome}: ha delle facce`, c.tri > 0)
    if (c.tri > peggiore[1]) peggiore = [nome, c.tri]
    controlla(`${nome}: meno di 700 facce`, c.tri < 700, `${c.tri}`)
    for (const q of Object.values(c.liste)) for (const g of q) {
      g.computeBoundingBox()
      const b = g.boundingBox
      if (b.min.y < -0.05 || b.max.y > 3.6 || Math.max(Math.abs(b.min.x), b.max.x, Math.abs(b.min.z), b.max.z) > 1.5) controlla(`${nome}: dentro le sue misure`, false, `${b.min.toArray()} ${b.max.toArray()}`)
    }
  }
  nota(`il più pesante: ${peggiore[0]}, ${Math.round(peggiore[1])} facce`)
}

riassunto('gli oggetti del villaggio')
