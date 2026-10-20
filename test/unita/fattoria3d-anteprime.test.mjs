/* Le anteprime 3D del menu «Costruisci qui»: la parte pura (anteprime-pura.js, senza three né document): l'inquadratura dalla
   scatola dell'oggetto e la cache a coda (una per tipo, una per volta, «non pronta» finché non tocca). Il disegno vero lo
   guarda l'integrazione. `node test/esegui.mjs fattoria3d-anteprime`
   tempo: 1 */
import { inquadra, creaCache, VERSO } from '../../src/giochi/fattoria3d/scena3d/anteprime-pura.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const FOV = 30, T = Math.tan(FOV * Math.PI / 360)
const norma = v => Math.hypot(...v)
const meno = (a, b) => a.map((x, k) => x - b[k])
const pp = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const pv = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]

/** Dove cadono gli otto angoli nel quadro (−1…1) guardando dalla telecamera data. */
function proiezioni(box, q) {
  const dir = meno(q.bersaglio, q.posizione), f = dir.map(x => x / norma(dir))
  const dx = pv(f, [0, 1, 0]), r = dx.map(x => x / norma(dx)), u = pv(r, f)
  const out = []
  for (const x of [box.min[0], box.max[0]]) for (const y of [box.min[1], box.max[1]]) for (const z of [box.min[2], box.max[2]]) {
    const d = meno([x, y, z], q.posizione), p = pp(d, f)
    out.push([pp(d, r) / p / T, pp(d, u) / p / T, p])
  }
  return out
}
function prova(nome, box) {
  const q = inquadra(box, { fov: FOV })
  const p = proiezioni(box, q)
  const xs = p.map(a => a[0]), ys = p.map(a => a[1])
  const massimo = Math.max(...xs.map(Math.abs), ...ys.map(Math.abs))
  controlla(`${nome}: sta tutto nel quadro, col suo margine (≤ 1/1,1)`, massimo <= 1 / 1.1 + 1e-6 && massimo > 0.8)
  controlla(`${nome}: è centrato (margini uguali ai due lati)`, Math.abs(Math.max(...xs) + Math.min(...xs)) < 0.1 && Math.abs(Math.max(...ys) + Math.min(...ys)) < 0.1)     // la prospettiva sposta un poco
  controlla(`${nome}: la telecamera sta davanti a tutto (profondità positiva)`, p.every(a => a[2] > 0))
  controlla(`${nome}: guarda dall'alto e di lato (verso a tre quarti)`, q.posizione[1] > q.bersaglio[1] && q.posizione[0] > q.bersaglio[0] && q.posizione[2] > q.bersaglio[2])
  return q
}

const q11 = prova('1×1', { min: [-0.5, 0, -0.5], max: [0.5, 0.9, 0.5] })
const q33 = prova('3×3 alto', { min: [-1.5, 0, -1.5], max: [1.5, 3, 1.5] })
const q43 = prova('4×3 largo', { min: [-2, 0, -1.5], max: [2, 1.4, 1.5] })
controlla('un oggetto più grande sta più lontano', q33.distanza > q11.distanza && q43.distanza > q11.distanza)
// la stessa figura traslata si inquadra uguale: conta la forma, non il posto
const spostato = inquadra({ min: [9.5, 0, 19.5], max: [10.5, 0.9, 20.5] }, { fov: FOV })
uguale('traslare la scatola non cambia la distanza', Math.round(spostato.distanza * 1e6), Math.round(q11.distanza * 1e6))
controlla('il verso predefinito è un versore', Math.abs(norma(VERSO) - 1) < 1e-9)
controlla('una scatola piatta e vuota non rompe l\'inquadratura', Number.isFinite(inquadra({ min: [0, 0, 0], max: [0, 0, 0] }, { fov: FOV }).distanza))

// ── la cache ──
{
  const compiti = [], disegnati = []
  const pianifica = fn => compiti.push(fn)
  const cache = creaCache(t => { disegnati.push(t); if (t === 'rotto') throw new Error('no'); return t === 'vuoto' ? null : 'img:' + t }, pianifica)
  controlla('prima di chiederla non è pronta', cache.leggi('campo') === null && !cache.pronta('campo'))
  const p1 = cache.chiedi('campo'), p2 = cache.chiedi('campo'), p3 = cache.chiedi('mulino'), p4 = cache.chiedi('rotto'), p5 = cache.chiedi('vuoto')
  controlla('chiederla due volte dà la stessa promessa', p1 === p2)
  uguale('chiedere non disegna: costa dopo', disegnati.length, 0)
  controlla('«non pronta» finché non tocca', cache.leggi('campo') === null && cache.inCoda() === 4)
  compiti.shift()()
  uguale('un tipo per passo', disegnati.join(), 'campo')
  uguale('dopo il primo passo la prima è pronta', cache.leggi('campo'), 'img:campo')
  controlla('e la seconda ancora no', cache.leggi('mulino') === null && compiti.length === 1)
  while (compiti.length) compiti.shift()()
  uguale('in ordine di richiesta, uno per passo', disegnati.join(), 'campo,mulino,rotto,vuoto')
  uguale('le promesse arrivano con l\'immagine', [await p1, await p3].join(), 'img:campo,img:mulino')
  controlla('un guasto del disegno è null, non un\'eccezione', (await p4) === null && (await p5) === null)
  controlla('un guasto conta come fatto (non si riprova)', cache.pronta('rotto') && cache.leggi('rotto') === null)
  await cache.chiedi('campo')
  uguale('una seconda richiesta non ridisegna', disegnati.filter(t => t === 'campo').length, 1)
  const p6 = cache.chiedi('pozzo')
  cache.via()
  uguale('chiusa la cache, ciò che aspettava si chiude con null', await p6, null)
  uguale('e dopo la chiusura non si chiede più', await cache.chiedi('nuovo'), null)
}

riassunto()
