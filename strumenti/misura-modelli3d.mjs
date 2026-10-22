// Misura il costo dei modelli della fattoria 3D: ms per creare la prima istanza e le successive, mesh e geometrie vive. Senza browser
// (node, un `document` finto per le trame). `node strumenti/misura-modelli3d.mjs [N=10]`; `SENZA_CACHE=1` e `SENZA_FUSIONE=1` rifanno i
// modelli come prima della cache e della fusione, per il confronto. Vedi docs/fattoria3d/scena.md, «Qualità e peso».
const ctx = new Proxy({}, { get: (_, k) => k === 'canvas' ? {} : () => {}, set: () => true })
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) }
const N = Number(process.argv[2]) || 10
const THREE = await import('three')
if (process.env.SENZA_FUSIONE) (await import('../src/giochi/fattoria3d/scena3d/fondi.js')).FONDI.acceso = false
if (process.env.SENZA_CACHE) (await import('../src/giochi/fattoria3d/scena3d/cache-modelli.js')).CACHE_MODELLI.acceso = false      // come prima della cache: ogni istanza si costruisce e si fonde
const { Pezzi } = await import('../src/giochi/fattoria3d/scena3d/pezzi.js')
const { EDIFICI, PEZZI } = await import('../src/giochi/fattoria3d/dati/catalogo.js')
const geometrie = g => { const s = new Set(); g.traverse(o => { if (o.isMesh) s.add(o.geometry) }); return s }
const mesh = g => { let n = 0; g.traverse(o => { if (o.isMesh) n++ }); return n }
const tri = g => { let n = 0; g.traverse(o => { if (o.isMesh) n += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 }); return Math.round(n) }
// un finto contesto: basta a `modelloDi`/`modelloAnteprima` (non si usa la scena)
const p = Object.create(Pezzi.prototype)
p.m = { misure: t => PEZZI[t] || EDIFICI[t] }
const SOLO = process.env.SOLO ? process.env.SOLO.split(',') : null      // SOLO=verde,recinti: solo le categorie dette
const tipi = [...Object.keys(PEZZI).filter(t => !['strada', 'gomma'].includes(t) && (!SOLO || SOLO.includes(PEZZI[t].categoria))).map(t => ['pezzo', t]), ...(SOLO ? [] : Object.keys(EDIFICI)).map(t => ['edificio', t])]
const righe = []
for (const [kind, tipo] of tipi) {
  const crea = () => kind === 'pezzo' ? p.modello(tipo, { pecore: [{ eta: 'adulta', t0: 0 }, { eta: 'adulta', t0: 0 }], bestie: [{ fine: null }, { fine: null }] }) : p.modelloAnteprima(tipo)
  let primo, tutti = []
  try {
    let t0 = performance.now(); const a = crea(); primo = performance.now() - t0
    t0 = performance.now(); for (let i = 0; i < N; i++) tutti.push(crea()); const resto = (performance.now() - t0) / N
    const geo = new Set(); for (const g of [a, ...tutti]) for (const x of geometrie(g)) geo.add(x)
    righe.push({ tipo, mesh: mesh(a), tri: tri(a), 'prima ms': +primo.toFixed(2), 'poi ms/ist': +resto.toFixed(2), [`geom (${N + 1} ist)`]: geo.size })
  } catch (e) { righe.push({ tipo, errore: e.message.slice(0, 60) }) }
}
console.table(righe)
const somma = righe.reduce((s, r) => s + (r['poi ms/ist'] || 0), 0)
console.log(`somma dei ms per un'istanza di ogni tipo: ${somma.toFixed(1)}`)
