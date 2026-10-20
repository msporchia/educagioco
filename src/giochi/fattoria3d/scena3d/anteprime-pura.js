// Le anteprime dei pezzi e degli edifici, la parte che non sa né di three né del documento: dove mettere la telecamera perché
// l'oggetto stia tutto nel quadro (`inquadra`) e la cache a coda (`creaCache`: una anteprima per tipo, una per volta, mai
// ricalcolata). Il disegno vero è in anteprime.js. Vedi docs/fattoria3d/scena.md «Le anteprime».

const norma = v => { const n = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / n, v[1] / n, v[2] / n] }
const pv = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const pp = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

/** Da dove guarda la telecamera: verso l'alto e un po' di lato (a tre quarti). */
export const VERSO = norma([0.75, 0.72, 1])

/**
 * Dove mettere la telecamera per inquadrare una scatola `{ min: [x,y,z], max: [x,y,z] }` (mondo, y in su) in un quadro quadrato.
 * Guarda il centro da `verso` (versore dal centro verso la telecamera); si proiettano i suoi otto angoli e la distanza è la
 * minima per cui stanno tutti dentro, con `margine` (0,1 = il 10% di vuoto per lato); poi il bersaglio si sposta sul mezzo di
 * ciò che si vede, così i margini sono uguali. → { posizione: [x,y,z], bersaglio: [x,y,z], distanza }
 */
export function inquadra(box, { fov = 30, verso = VERSO, margine = 0.1 } = {}) {
  const v = norma(verso)
  const destra = norma(pv([0, 1, 0], v)), su = pv(v, destra)
  const t = Math.tan(fov * Math.PI / 360) / (1 + margine)             // mezzo lato del quadro a distanza 1, ridotto del margine
  const punti = []
  for (const x of [box.min[0], box.max[0]]) for (const y of [box.min[1], box.max[1]]) for (const z of [box.min[2], box.max[2]]) punti.push([x, y, z])
  let bersaglio = [0, 1, 2].map(k => (box.min[k] + box.max[k]) / 2), distanza = 0.1
  // si guarda il mezzo della figura vista: la prospettiva ingrandisce ciò che sta vicino, quindi il mezzo si cerca per approssimazioni
  for (let giro = 0; giro < 8; giro++) {
    const a = punti.map(q => { const d = [q[0] - bersaglio[0], q[1] - bersaglio[1], q[2] - bersaglio[2]]; return { u: pp(d, destra), w: pp(d, su), p: pp(d, v) } })
    distanza = 0.1
    for (const c of a) distanza = Math.max(distanza, c.p + Math.abs(c.u) / t, c.p + Math.abs(c.w) / t)
    const ndc = a.map(c => [c.u / (distanza - c.p), c.w / (distanza - c.p)])          // quanto cadono a lato, in unità di t
    const mu = (Math.max(...ndc.map(n => n[0])) + Math.min(...ndc.map(n => n[0]))) / 2
    const mw = (Math.max(...ndc.map(n => n[1])) + Math.min(...ndc.map(n => n[1]))) / 2
    bersaglio = bersaglio.map((b, k) => b + (destra[k] * mu + su[k] * mw) * distanza)
  }
  // un'ultima distanza sul bersaglio trovato
  distanza = 0.1
  for (const q of punti) {
    const d = [q[0] - bersaglio[0], q[1] - bersaglio[1], q[2] - bersaglio[2]], p = pp(d, v)
    distanza = Math.max(distanza, p + Math.abs(pp(d, destra)) / t, p + Math.abs(pp(d, su)) / t)
  }
  return { posizione: bersaglio.map((b, k) => b + v[k] * distanza), bersaglio, distanza }
}

/**
 * La cache delle anteprime. `disegna(tipo)` produce l'immagine (testo) o `null`, e costa: si chiama una volta per tipo,
 * un tipo per volta, quando `pianifica(fn)` lo concede (un fotogramma, un momento d'ozio). `chiedi(tipo)` dà una promessa
 * (la stessa per lo stesso tipo); `leggi(tipo)` dà l'immagine se c'è già, altrimenti `null` («non pronta»: la carta
 * mostra il segnaposto). Un guasto di `disegna` vale `null`, e non si riprova.
 */
export function creaCache(disegna, pianifica) {
  const fatte = new Map(), attese = new Map(), coda = []
  let gira = false, chiusa = false
  const passo = () => {
    gira = false
    const tipo = coda.shift()
    if (tipo !== undefined) {
      let img = null
      if (!chiusa) { try { img = disegna(tipo) || null } catch (e) { img = null } }
      fatte.set(tipo, img)
      const a = attese.get(tipo); attese.delete(tipo); a.resolve(img)
    }
    if (coda.length) { gira = true; pianifica(passo) }
  }
  return {
    chiedi(tipo) {
      if (fatte.has(tipo)) return Promise.resolve(fatte.get(tipo))
      if (attese.has(tipo)) return attese.get(tipo).promessa
      if (chiusa) return Promise.resolve(null)
      let resolve; const promessa = new Promise(r => { resolve = r })
      attese.set(tipo, { promessa, resolve }); coda.push(tipo)
      if (!gira) { gira = true; pianifica(passo) }
      return promessa
    },
    leggi: tipo => (fatte.has(tipo) ? fatte.get(tipo) : null),
    pronta: tipo => fatte.has(tipo),
    inCoda: () => coda.length,
    /** Il gioco si chiude: quel che aspetta si chiude con `null`. */
    via() {
      chiusa = true
      for (const [, a] of attese) a.resolve(null)
      attese.clear(); coda.length = 0
    },
  }
}
