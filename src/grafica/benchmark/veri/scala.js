// La scala della verifica (docs/core/vecchio-telefono-veri.md, «La scala»): lo scontro del Sotterraneo con 3 mostri costruito un gradino alla
// volta, dal fondo piatto con la luce fissa fino alla scena intera; ogni gradino accende i suoi pezzi sopra quelli di prima. Il salto da un
// gradino all'altro è il costo di quel pezzo dentro la scena vera; il primo gradino si rifà in fondo e la differenza è il rumore (il calore).
// Dato puro: le scene per veri.js e la LETTURA per log-veri.js. I nomi sono gli elementi di veri/elementi-sot.js.
export const MOSTRI_SCALA = 3

export const GRADINI = [
  { nome: 'niente disegnato (il giro del gioco)', accendi: [] },
  { nome: 'pavimento e pareti, una luce fissa', accendi: ['pavimento', 'pareteLontana', 'pareteVicina', 'resto'] },
  { nome: '+ colonne e arredo', accendi: ['colonne', 'arredo'] },
  { nome: '+ rilievo (normal map)', accendi: ['normali'] },
  { nome: '+ la torcia', accendi: ['torcia'] },
  { nome: '+ fuochi e fiamme', accendi: ['fuochi', 'fiamme'] },
  { nome: '+ lampi e palco', accendi: ['lampo', 'palco'] },
  { nome: '+ nebbia', accendi: ['nebbia'] },
  { nome: '+ eroe e mostri', accendi: ['eroe', 'mostri', 'figure', 'chiarori'] },
  { nome: '+ particelle', accendi: ['particelle'] },
  { nome: '+ effetti delle abilità', accendi: ['effetti3d'] },
  { nome: '+ ombra e passaggio finale', accendi: ['ombra', 'post'] },
]

/** Le scene: `scala-0`…`scala-11` coi pezzi accesi fin lì, e `scala-ancora` (il gradino 1 di nuovo, per il rumore). */
export function sceneDellaScala() {
  const accesi = [], scene = []
  GRADINI.forEach((g, k) => {
    accesi.push(...g.accendi)
    scene.push({ id: `scala-${k}`, nome: `gradino ${k}: ${g.nome}`, accesi: [...accesi], stima: 8 })
  })
  scene.push({ id: 'scala-ancora', nome: 'gradino 1 di nuovo (il rumore)', accesi: [...GRADINI[1].accendi], stima: 8 })
  return scene
}

const t1 = x => Math.round(x * 10) / 10
const piu = x => `${x >= 0 ? '+' : ''}${t1(x)}`
const buona = r => r && !r.errore && !r.salta && r.ms != null

/**
 * La LETTURA: una riga per gradino col salto dal gradino di prima (ms, js, gpu, chiamate), il rumore (il gradino 1 rifatto) e i gradini più
 * cari. Un gradino non misurato (la prova si è fermata lì) chiude la scala: quelli prima restano buoni. `ris`: i risultati, già tolti dal calore.
 */
export function letturaScala(ris) {
  const g = GRADINI.map((_, k) => ris.find(r => r.id === `scala-${k}`))
  if (!g.some(buona)) return []
  const righe = [`SCALA (lo scontro con ${MOSTRI_SCALA} mostri, un gradino alla volta; il salto è quanto aggiunge il gradino):`]
  const salti = []
  let prima = null
  for (let k = 0; k < g.length; k++) {
    const r = g[k]
    if (!buona(r)) { righe.push(`  ${k} ${GRADINI[k].nome}: ${r ? (r.errore ? 'non regge (' + r.errore + ')' : 'saltato') : 'non misurato'}; la scala si ferma qui.`); break }
    const s = prima ? { ms: r.ms - prima.ms, js: (r.js ?? 0) - (prima.js ?? 0), gpu: (r.gpu ?? 0) - (prima.gpu ?? 0) } : null
    if (s && k > 1) salti.push({ k, ...s })
    righe.push(`  ${k} ${GRADINI[k].nome}: ${r.ms} ms (p95 ${r.p95}, js ${r.js}, gpu ${r.gpu}, ${r.ch} ch)` + (s ? ` → ${piu(s.ms)} ms (js ${piu(s.js)}, gpu ${piu(s.gpu)})` : ''))
    prima = r
  }
  const uno = g[1], ancora = ris.find(r => r.id === 'scala-ancora')
  const rumore = buona(uno) && buona(ancora) ? Math.abs(ancora.ms - uno.ms) : null
  if (rumore != null) righe.push(`  Rumore: il gradino 1 rifatto in fondo ${ancora.ms} ms contro ${uno.ms} (${piu(ancora.ms - uno.ms)})${ancora.ms > 1.15 * uno.ms ? ': il telefono si è scaldato, i gradini alti pesano un po\' meno di quel che dicono' : ''}.`)
  const soglia = Math.max(1, rumore ?? 1)
  const cari = salti.filter(s => s.ms > soglia).sort((a, b) => b.ms - a.ms).slice(0, 3)
  if (cari.length) righe.push(`  I gradini più cari: ${cari.map(s => `${GRADINI[s.k].nome.replace(/^\+ /, '')} ${piu(s.ms)} ms (${s.gpu >= s.js ? 'GPU' : 'JS'})`).join(', ')}.`)
  else if (salti.length) righe.push(`  Nessun gradino sopra il rumore (${t1(soglia)} ms): il tempo è nel fondo, non nei pezzi.`)
  return righe
}
