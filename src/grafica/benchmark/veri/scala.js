// Le scale (docs/core/vecchio-telefono-veri.md, «La scala»): una scena vera costruita un gradino alla volta, dal fondo fino alla scena
// intera; ogni gradino accende i suoi pezzi sopra quelli di prima. Il salto da un gradino all'altro è il costo di quel pezzo dentro la scena
// vera; un gradino si rifà in fondo e la differenza è il rumore. Due scale: lo scontro del Sotterraneo con 3 mostri (gli elementi di
// veri/elementi-sot.js) e il villaggio di sopra (veri/elementi-sopra.js). Dato puro: le scene per veri.js e la LETTURA per log-veri.js.
import { ELEMENTI_DISCESE, ELEMENTI_SOPRA } from '../../../giochi/sotterraneo/scena3d/costanti.js'

export const MOSTRI_SCALA = 3
// gli elementi di ogni scena: i pezzi di ACCESI e gli speciali che la sua scena sa fare (ombra, normal map, passaggio finale, foschia)
export const ELEMENTI_SCALA = { sot: [...ELEMENTI_DISCESE, 'ombra', 'normali', 'post'], sopra: [...ELEMENTI_SOPRA, 'ombra', 'normali', 'foschia'] }

// i gradini che il telefono ha detto gratis (28/10: rilievo, torcia, fuochi, lampi, nebbia, particelle, ombra) stanno insieme; il fondo e le
// figure, i più cari, sono divisi: la luce fissa da sola, il pavimento, le pareti; l'eroe, i mostri
const GRADINI_SOT = [
  { nome: 'niente disegnato (il giro del gioco)', accendi: [] },
  { nome: 'la luce fissa e il resto, senza pavimento né pareti', accendi: ['resto'] },
  { nome: '+ pavimento', accendi: ['pavimento'] },
  { nome: '+ pareti', accendi: ['pareteLontana', 'pareteVicina'] },
  { nome: '+ colonne e arredo', accendi: ['colonne', 'arredo'] },
  { nome: '+ rilievo, torcia, fuochi, lampi, nebbia', accendi: ['normali', 'torcia', 'fuochi', 'fiamme', 'lampo', 'palco', 'nebbia'] },
  { nome: '+ eroe', accendi: ['eroe'] },
  { nome: '+ mostri', accendi: ['mostri', 'figure', 'chiarori'] },
  { nome: '+ particelle, effetti, ombra e passaggio finale', accendi: ['particelle', 'effetti3d', 'ombra', 'post'] },
]
// il mondo di sopra (28/10: 15-17 fps veri nel villaggio e sul prato, e nella bassa nessuna semplificazione); l'ombra del sole la bassa
// non la disegna (`ombre` spento), sta col cielo
const GRADINI_SOPRA = [
  { nome: 'niente disegnato (il giro del gioco)', accendi: [] },
  { nome: 'il cielo e le luci', accendi: ['cielo', 'sole', 'resto', 'ombra'] },
  { nome: '+ mare', accendi: ['mare'] },
  { nome: '+ terreno', accendi: ['terreno'] },
  { nome: '+ rilievo del terreno', accendi: ['normali'] },
  { nome: '+ case e piazza', accendi: ['case'] },
  { nome: '+ alberi, erba e natura', accendi: ['natura'] },
  { nome: '+ nebbia della mappa, foschia, vita e scia', accendi: ['velo', 'foschia', 'vita', 'scia'] },
  { nome: '+ persone ed eroe', accendi: ['persone', 'eroe'] },
  { nome: '+ mostri', accendi: ['mostri'] },
]
// `rumore`: il gradino rifatto in fondo, uno che costa abbastanza da far vedere quanto si sposta una misura
export const SCALE = {
  sot: { id: 'scala', titolo: `lo scontro con ${MOSTRI_SCALA} mostri`, gradini: GRADINI_SOT, rumore: 3 },
  sopra: { id: 'scala-sopra', titolo: 'il villaggio di sopra con 4 persone e 3 mostri', gradini: GRADINI_SOPRA, rumore: 3 },
}

/** Le scene della scala `chiave`: `<id>-0`… coi pezzi accesi fin lì, e `<id>-ancora` (il gradino `rumore` di nuovo). */
export function sceneDellaScala(chiave) {
  const { id, gradini, rumore } = SCALE[chiave], accesi = [], scene = []
  gradini.forEach((g, k) => {
    accesi.push(...g.accendi)
    scene.push({ id: `${id}-${k}`, nome: `gradino ${k}: ${g.nome}`, accesi: [...accesi], stima: 8 })
  })
  scene.push({ id: `${id}-ancora`, nome: `gradino ${rumore} di nuovo (il rumore)`, accesi: [...scene[rumore].accesi], stima: 8 })
  return scene
}

const t1 = x => Math.round(x * 10) / 10
const piu = x => `${x >= 0 ? '+' : ''}${t1(x)}`
const buona = r => r && !r.errore && !r.salta && r.ms != null

/**
 * La LETTURA di ogni scala misurata: una riga per gradino col salto dal gradino di prima (ms, js, gpu, chiamate), il rumore (il gradino
 * `rumore` rifatto) e i gradini più cari. Un gradino non misurato (la prova si è fermata lì) chiude la scala: quelli prima restano buoni.
 * `ris`: i risultati, già tolti dal calore.
 */
export const letturaScala = ris => Object.values(SCALE).flatMap(s => unaScala(ris, s))

function unaScala(ris, { id, titolo, gradini: GRADINI, rumore: RUMORE }) {
  const g = GRADINI.map((_, k) => ris.find(r => r.id === `${id}-${k}`))
  if (!g.some(buona)) return []
  const righe = [`SCALA (${titolo}, un gradino alla volta; il salto è quanto aggiunge il gradino; ms di lavoro in fila, telefono poi scheda: conta il salto, non il totale):`]
  const salti = []
  let prima = null
  for (let k = 0; k < g.length; k++) {
    const r = g[k]
    if (!buona(r)) { righe.push(`  ${k} ${GRADINI[k].nome}: ${r ? (r.errore ? 'non regge (' + r.errore + ')' : 'saltato') : 'non misurato'}; la scala si ferma qui.`); break }
    const s = prima ? { ms: r.ms - prima.ms, js: (r.js ?? 0) - (prima.js ?? 0), gpu: (r.gpu ?? 0) - (prima.gpu ?? 0) } : null
    if (s) salti.push({ k, ...s })
    // il JS diviso (veri.js, `agg`/`dis`): il giro del gioco e il disegno di three
    const diviso = r.agg != null ? `: gioco ${r.agg}, disegno ${r.dis}` : ''
    const salto = s && r.agg != null && prima.agg != null ? `: gioco ${piu(r.agg - prima.agg)}, disegno ${piu((r.dis ?? 0) - (prima.dis ?? 0))}` : ''
    righe.push(`  ${k} ${GRADINI[k].nome}: ${r.ms} ms (p95 ${r.p95}, js ${r.js}${diviso}, gpu ${r.gpu}, ${r.ch} ch)` + (s ? ` → ${piu(s.ms)} ms (js ${piu(s.js)}${salto}, gpu ${piu(s.gpu)})` : ''))
    prima = r
  }
  const uno = g[RUMORE], ancora = ris.find(r => r.id === `${id}-ancora`)
  const rumore = buona(uno) && buona(ancora) ? Math.abs(ancora.ms - uno.ms) : null
  if (rumore != null) righe.push(`  Rumore: il gradino ${RUMORE} rifatto in fondo ${ancora.ms} ms contro ${uno.ms} (${piu(ancora.ms - uno.ms)}): un gradino che si sposta meno di così è rumore.`)
  const soglia = Math.max(1, rumore ?? 1)
  const cari = salti.filter(s => s.ms > soglia).sort((a, b) => b.ms - a.ms).slice(0, 3)
  if (cari.length) righe.push(`  I gradini più cari: ${cari.map(s => `${GRADINI[s.k].nome.replace(/^\+ /, '')} ${piu(s.ms)} ms (${s.gpu >= s.js ? 'GPU' : 'JS'})`).join(', ')}.`)
  else if (salti.length) righe.push(`  Nessun gradino sopra il rumore (${t1(soglia)} ms): il tempo è nel fondo, non nei pezzi.`)
  return righe
}
