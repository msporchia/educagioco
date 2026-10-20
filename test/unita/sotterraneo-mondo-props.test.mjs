/* ═══════════════════════════════════════════════════════════════════
   GLI OGGETTI DELLE CITTÀ NEL MONDO DI SOPRA IN 3D, LE PARTI PURE
   — docs/sotterraneo/mondo-3d.md, «Gli oggetti delle città»

   Barili, carretti, bancarelle, lanterne, palizzate… si derivano dal
   mondo già generato (che non cambia): stanno su celle libere di erba,
   mai su una strada, su un posto, davanti a una porta o nelle zone
   tenute libere davanti alle botteghe; sono sempre uguali; ognuno sta
   nel pezzo della sua cella; ogni città ha il suo carattere; ogni
   modello ha un nome e poche facce.
   ═══════════════════════════════════════════════════════════════════ */
import { ilMondo } from '../../src/giochi/sotterraneo/motore/mondo-sopra-anelli.js'
import { ERBA } from '../../src/giochi/sotterraneo/motore/mondo-aperto.js'
import { propsDellaCitta, propsPerPezzo } from '../../src/giochi/sotterraneo/scena3d/mondo/props-citta.js'
import { MODELLI } from '../../src/giochi/sotterraneo/scena3d/mondo/props-modelli.js'
import { Cantiere } from '../../src/giochi/sotterraneo/scena3d/mondo/kit.js'
import { caso } from '../../src/giochi/sotterraneo/scena3d/mondo/suolo.js'
import { pezzoDi, grigliaDi } from '../../src/giochi/sotterraneo/scena3d/mondo/pezzi.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const m = ilMondo()
const firma = () => [...m.blocco, ...m.strada, ...m.riservato].reduce((s, v) => (Math.imul(s, 31) + v) | 0, 7)
const prima = firma()
const per = m.citta.map((c, ci) => ({ c, l: propsDellaCitta(m, ci) }))

/* ── il mondo non cambia, i risultati sono sempre gli stessi ── */
{
  const dopo = m.citta.map((_, ci) => propsDellaCitta(m, ci))
  controlla('due calcoli danno gli stessi oggetti', JSON.stringify(dopo) === JSON.stringify(per.map(p => p.l)))
  uguale('la mappa del mondo non è stata toccata', firma(), prima)
  uguale('tre città con oggetti', per.filter(p => p.l.length > 10).length, 3)
}

/* ── i posti: mai su strade, posti, porte ── */
{
  const rettangoli = []
  for (const cs of m.case) rettangoli.push({ x: cs.x, y: cs.y, w: cs.w, h: cs.h, che: 'casa' })
  for (const p of m.posti) if (p.tipo !== 'citta') rettangoli.push({ x: p.x, y: p.y, w: p.w, h: p.h, che: p.tipo })
  for (const c of m.citta) rettangoli.push({ ...c.pozzo, che: 'pozzo' })
  const porte = m.case.map(cs => {
    const d = { n: [0, -1], s: [0, 1], e: [1, 0], o: [-1, 0] }[cs.verso]
    return d[1] ? { x: cs.x, y: d[1] > 0 ? cs.y + cs.h : cs.y - 1, w: cs.w, h: 1 } : { x: d[0] > 0 ? cs.x + cs.w : cs.x - 1, y: cs.y, w: 1, h: cs.h }
  })
  const dentroA = (r, x, y) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h
  for (const { c, l } of per) {
    const celle = new Set()
    let guasti = 0, doppie = 0
    for (const o of l) for (const [x, y] of o.celle) {
      const k = y * m.W + x
      if (celle.has(k)) doppie++
      celle.add(k)
      if (m.terreno[k] !== ERBA || m.strada[k] || m.blocco[k] || m.riservato[k] || m.ponte[k] >= 0) guasti++
      else if (rettangoli.some(r => dentroA(r, x, y)) || porte.some(r => dentroA(r, x, y))) guasti++
    }
    uguale(`${c.chiave}: nessun oggetto su una strada, un posto, una porta o l'acqua`, guasti, 0)
    uguale(`${c.chiave}: nessuna cella data due volte`, doppie, 0)
    controlla(`${c.chiave}: ogni oggetto sta dentro la città (≤ due raggi dal centro)`, l.every(o => Math.hypot(o.x - c.centro.x - 0.5, o.z - c.centro.y - 0.5) <= c.raggio * 2 + 1))
    controlla(`${c.chiave}: ogni oggetto ha un modello`, l.every(o => typeof MODELLI[o.tipo] === 'function'))
    controlla(`${c.chiave}: l'asse del davanti è un numero`, l.every(o => Number.isFinite(o.ry) && Number.isFinite(o.x) && Number.isFinite(o.z) && o.seme > 0))
  }
}

/* ── le botteghe hanno la loro insegna ── */
{
  const botteghe = m.posti.filter(p => p.tipo === 'mercante')
  for (const b of botteghe) {
    const ins = per.find(p => p.c.chiave === b.citta).l.filter(o => o.tipo === 'insegna' && o.bottega === b.bottega)
    controlla(`l'insegna di ${b.bottega} nel ${b.citta}`, ins.length >= 1)
  }
}

/* ── ognuno nel suo pezzo; la nebbia lo legge lì ── */
{
  const pezzi = propsPerPezzo(m), { n } = grigliaDi(m)
  uguale('i pezzi sono 25', pezzi.length, n)
  let fuori = 0, tot = 0
  pezzi.forEach((l, p) => { for (const o of l) { tot++; if (pezzoDi(m, o.x, o.z) !== p) fuori++ } })
  uguale('ogni oggetto sta nel pezzo della sua cella', fuori, 0)
  uguale('li ha tutti', tot, per.reduce((s, p) => s + p.l.length, 0))
  nota(`${tot} oggetti di scena nelle tre città`)
}

/* ── il carattere di ogni città ── */
{
  const conta = ch => { const k = {}; for (const o of per.find(p => p.c.chiave === ch).l) k[o.tipo] = (k[o.tipo] || 0) + 1; return k }
  const v = conta('villaggio'), f = conta('forte'), r = conta('rifugio')
  controlla('il villaggio: campi, carretti, fiori e bucato', v.orto > 0 && v.carretto > 0 && v.fiori > 0 && v.bucato > 0 && v.bancarella > 0)
  controlla('il villaggio non ha palizzate né tende', !v.palizzata && !v.tenda)
  controlla('il forte: palizzata, tende, rastrelliere, bandiere, torce', f.palizzata > 5 && f.tenda > 0 && f.rastrelliera > 0 && f.bandiera > 0 && f.torcia > 0)
  controlla('il rifugio: legna, pellicce, bracieri', (r.catasta || 0) + (r.legna || 0) > 0 && r.pellicce > 0 && r.braciere > 0)
  controlla('il rifugio non ha orti né carretti', !r.orto && !r.carretto)
  controlla('i fuochi veri sono pochi (le fiamme sono 24 in tutto)', per.every(p => p.l.filter(o => o.fuoco).length <= 8))
  controlla('ci sono le lanterne, le panche e i tavoli', v.lanterna >= 3 && (v.panca > 0) && (v.tavolo > 0))
  controlla('la ruota di pietra e l\'incudine del fabbro stanno al forte e al villaggio', (v.ruota || 0) + (f.ruota || 0) > 0 && (v.incudine || 0) + (f.incudine || 0) > 0)
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
    for (const l of Object.values(c.liste)) for (const g of l) {
      g.computeBoundingBox()
      const b = g.boundingBox
      if (b.min.y < -0.05 || b.max.y > 3.6 || Math.max(Math.abs(b.min.x), b.max.x, Math.abs(b.min.z), b.max.z) > 1.5) controlla(`${nome}: dentro le sue misure`, false, `${b.min.toArray()} ${b.max.toArray()}`)
    }
  }
  controlla('il modello più pesante è sotto le 700 facce', peggiore[1] < 700)
  nota(`il più pesante: ${peggiore[0]}, ${Math.round(peggiore[1])} facce`)
}

riassunto('gli oggetti delle città')
