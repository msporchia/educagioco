// Le forme delle stanze del sotterraneo (docs/sotterraneo/piani.md e piani-caverne.md). Una forma è una maschera di celle (1 = si cammina)
// dentro un riquadro `bw × bh`; il piano la posa dove gli dice il BSP. Niente canvas, niente piano: gira in Node.
// Ogni funzione prende `rnd` (il caso del piano) e dà null se la forma non ci sta nelle misure date.
// Due famiglie: le costruite (rettangoli, forme squadrate e simmetriche) e le grotte (una massa di celle organica, un
// automa cellulare: grotta, bilobata, galleria, antro).

import { ipot, arcotangente2, coseno } from '../../../motore/conti-uguali.js'   // uguali al bit sui due telefoni (docs/sotterraneo/in-due.md)

export const FORME_COSTRUITE = ['rettangolo', 'smussata', 'elle', 'tu', 'croce', 'cappella', 'doppia', 'sala']
export const FORME_DI_GROTTA = ['grotta', 'bilobata', 'galleria', 'antro']
export const FORME = [...FORME_COSTRUITE, ...FORME_DI_GROTTA]

// da quante celle in su una stanza è «grande»: ci si può nascondere, e ha le colonne
export const CELLE_SALA = 70

const tra = (rnd, a, b) => a + Math.floor(rnd() * (b - a + 1))   // intero in [a, b]
const vuota = (w, h) => new Uint8Array(w * h)
const riempi = (m, w, x0, y0, x1, y1) => {   // [x0, x1) × [y0, y1)
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) m[y * w + x] = 1
}

// la maschera a specchio / trasposta: le forme si disegnano in un verso solo e poi si girano
function specchia(m, w, h, orizzontale, verticale) {
  const o = vuota(w, h)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
    o[y * w + x] = m[(verticale ? h - 1 - y : y) * w + (orizzontale ? w - 1 - x : x)]
  return o
}
function trasponi(m, w, h) {
  const o = vuota(h, w)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) o[x * h + y] = m[y * w + x]
  return o
}

// un'unica massa, senza celle che si toccano solo di spigolo: una stanza spezzata in due non è una stanza
export function connessa(m, w, h) {
  let prima = m.indexOf(1)
  if (prima < 0) return false
  const visti = new Uint8Array(w * h), coda = [prima]
  visti[prima] = 1
  for (let i = 0; i < coda.length; i++) {
    const x = coda[i] % w, y = (coda[i] / w) | 0
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = x + dx, b = y + dy
      if (a < 0 || b < 0 || a >= w || b >= h || visti[b * w + a] || !m[b * w + a]) continue
      visti[b * w + a] = 1; coda.push(b * w + a)
    }
  }
  return coda.length === m.reduce((n, c) => n + c, 0)
}

// la maschera → pochi rettangoli (le righe uguali una sotto l'altra si fondono): `pezzi` della stanza
export function pezziDa(m, w, h, x0, y0) {
  const pezzi = []
  let aperti = []   // rettangoli ancora allargabili in basso
  for (let y = 0; y <= h; y++) {
    const corse = []
    if (y < h) for (let x = 0; x < w;) {
      if (!m[y * w + x]) { x++; continue }
      let f = x; while (f < w && m[y * w + f]) f++
      corse.push([x, f]); x = f
    }
    const nuovi = []
    for (const p of aperti) {
      const i = corse.findIndex(c => c[0] === p.da && c[1] === p.a)
      if (i >= 0) { p.h++; nuovi.push(p); corse.splice(i, 1) } else pezzi.push({ x: x0 + p.da, y: y0 + p.y, w: p.a - p.da, h: p.h })
    }
    for (const [da, a] of corse) nuovi.push({ da, a, y, h: 1 })
    aperti = nuovi
  }
  return pezzi
}

const SU_MISURA = {
  rettangolo: (maxW, maxH, rnd) => {
    const w = Math.max(5, Math.min(maxW, 5 + Math.floor(rnd() * 6)))
    const h = Math.max(4, Math.min(maxH, 4 + Math.floor(rnd() * 5)))
    const m = vuota(w, h); riempi(m, w, 0, 0, w, h)
    return { w, h, m }
  },

  // una L: un rettangolo senza un angolo (il braccio più corto sta sempre sopra i tre)
  elle: (maxW, maxH, rnd) => {
    if (maxW < 7 || maxH < 6) return null
    const w = tra(rnd, 7, Math.min(11, maxW)), h = tra(rnd, 6, Math.min(9, maxH))
    const cw = tra(rnd, 3, w - 3), ch = tra(rnd, 2, h - 3)
    let m = vuota(w, h); riempi(m, w, 0, 0, w, h)
    for (let y = 0; y < ch; y++) for (let x = w - cw; x < w; x++) m[y * w + x] = 0
    return { w, h, m: specchia(m, w, h, rnd() < 0.5, rnd() < 0.5) }
  },

  // una T: una sbarra e un gambo al centro; si gira da tutte e quattro le parti
  tu: (maxW, maxH, rnd) => {
    const girata = rnd() < 0.5
    const [mL, mD] = girata ? [maxH, maxW] : [maxW, maxH]   // lunghezza della sbarra, profondità
    if (mL < 8 || mD < 6) return null
    const L = tra(rnd, 8, Math.min(11, mL)), D = tra(rnd, 6, Math.min(9, mD))
    const sbarra = tra(rnd, 2, 3), gambo = L % 2 ? 3 : 4   // il gambo sta esattamente in mezzo: una T costruita è simmetrica
    const g0 = (L - gambo) / 2
    let m = vuota(L, D); riempi(m, L, 0, 0, L, sbarra); riempi(m, L, g0, sbarra, g0 + gambo, D)
    m = specchia(m, L, D, false, rnd() < 0.5)
    return girata ? { w: D, h: L, m: trasponi(m, L, D) } : { w: L, h: D, m }
  },

  // una croce: due bracci larghi tre che si incrociano esattamente al centro (misure dispari, o non sarebbe simmetrica)
  croce: (maxW, maxH, rnd) => {
    if (maxW < 9 || maxH < 9) return null
    const dispari = n => n - (1 - n % 2)
    const w = dispari(tra(rnd, 9, Math.min(12, maxW))), h = dispari(tra(rnd, 9, Math.min(11, maxH)))
    const at = 3
    const ax = (w - at) / 2, ay = (h - at) / 2
    const m = vuota(w, h); riempi(m, w, 0, ay, w, ay + at); riempi(m, w, ax, 0, ax + at, h)
    return { w, h, m }
  },

  // un rettangolo con gli angoli tagliati (una cella o due, uguali ai quattro angoli): una stanza smussata, non un cassone
  smussata: (maxW, maxH, rnd) => {
    if (maxW < 6 || maxH < 5) return null
    const w = tra(rnd, 6, Math.min(12, maxW)), h = tra(rnd, 5, Math.min(9, maxH))
    const taglio = Math.min(w, h) >= 7 ? tra(rnd, 1, 2) : 1
    const m = vuota(w, h); riempi(m, w, 0, 0, w, h)
    for (let y = 0; y < taglio; y++) for (let x = 0; x < taglio - y; x++) {
      m[y * w + x] = 0; m[y * w + w - 1 - x] = 0
      m[(h - 1 - y) * w + x] = 0; m[(h - 1 - y) * w + w - 1 - x] = 0
    }
    return { w, h, m }
  },

  // una cappella: un corpo rettangolare e un'abside stretta in mezzo a un lato corto, tutto simmetrico; si gira da tutte le parti
  cappella: (maxW, maxH, rnd) => {
    const girata = rnd() < 0.5
    const [mL, mD] = girata ? [maxH, maxW] : [maxW, maxH]   // larghezza del corpo, profondità
    if (mL < 7 || mD < 6) return null
    const L = tra(rnd, 7, Math.min(10, mL))
    const abside = L % 2 ? tra(rnd, 1, 2) * 2 + 1 : 4   // dispari quando il corpo è dispari: sta in mezzo
    const ap = tra(rnd, 2, 3), corpo = tra(rnd, 4, Math.max(4, Math.min(6, mD - ap)))
    const D = ap + corpo
    if (D > mD || abside > L - 2) return null
    const m = vuota(L, D), a0 = (L - abside) / 2
    riempi(m, L, a0, 0, a0 + abside, ap); riempi(m, L, 0, ap, L, D)
    if (abside >= 5) { m[a0] = 0; m[a0 + abside - 1] = 0 }   // l'abside è tondeggiante: la prima riga perde gli angoli
    const g = specchia(m, L, D, false, rnd() < 0.5)
    return girata ? { w: D, h: L, m: trasponi(g, L, D) } : { w: L, h: D, m: g }
  },

  // due rettangoli che si sovrappongono per un pezzo: una stanza a Z o a scala
  doppia: (maxW, maxH, rnd) => {
    if (maxW < 9 || maxH < 7) return null
    const w = tra(rnd, 9, Math.min(13, maxW)), h = tra(rnd, 7, Math.min(10, maxH))
    let aw = Math.round(w * (0.5 + rnd() * 0.25)), bw = Math.round(w * (0.5 + rnd() * 0.25))
    let ah = Math.round(h * (0.5 + rnd() * 0.25)), bh = Math.round(h * (0.5 + rnd() * 0.25))
    if (aw + bw < w + 2) bw = w + 2 - aw   // si toccano per almeno due celle, in larghezza e in altezza
    if (ah + bh < h + 2) bh = h + 2 - ah
    const m = vuota(w, h)
    riempi(m, w, 0, 0, aw, ah); riempi(m, w, w - bw, h - bh, w, h)
    return { w, h, m: specchia(m, w, h, rnd() < 0.5, false) }
  },

  // una sala grande: un rettangolo largo, con gli angoli tagliati una volta su tre (le colonne le mette il piano)
  sala: (maxW, maxH, rnd) => {
    if (maxW < 9 || maxH < 7) return null
    const w = Math.min(maxW, tra(rnd, 12, 18)), h = Math.min(maxH, tra(rnd, 9, 13))
    const m = vuota(w, h); riempi(m, w, 0, 0, w, h)
    const t = tra(rnd, 2, 3)
    // gli angoli tagliati una volta su tre, e solo se la sala resta grande (da CELLE_SALA in su, più qualche cella per i relitti)
    if (rnd() < 0.34 && w * h - 2 * t * (t + 1) >= CELLE_SALA + 8) {
      for (let y = 0; y < t; y++) for (let x = 0; x < t - y; x++) {
        m[y * w + x] = 0; m[y * w + w - 1 - x] = 0
        m[(h - 1 - y) * w + x] = 0; m[(h - 1 - y) * w + w - 1 - x] = 0
      }
    }
    return { w, h, m }
  },

  // le grotte: una massa organica che si ricava da un automa cellulare (blobCA); si gira anche per il lungo
  // una grotta compatta, qualche cella di roccia dentro e i bordi che vanno e vengono
  grotta: (maxW, maxH, rnd) => {
    if (maxW < 4 || maxH < 4) return null
    const w = Math.min(maxW, tra(rnd, 8, 14)), h = Math.min(maxH, tra(rnd, 7, 10))
    // in uno spazio stretto l'automa mangerebbe tutto: si scava un tondo, col contorno mosso
    if (w < 7 || h < 6) return tondo(w, h, rnd)
    return blobCA(w, h, rnd, { minimo: Math.min(28, Math.floor(w * h * 0.45)), densita: 1.55 })
  },

  // due slarghi uniti da un'imboccatura stretta: una grotta a due lobi
  bilobata: (maxW, maxH, rnd) => {
    const girata = rnd() < 0.5
    const [mL, mD] = girata ? [maxH, maxW] : [maxW, maxH]
    if (mL < 12 || mD < 6) return null
    const L = tra(rnd, 12, Math.min(17, mL)), D = tra(rnd, 7, Math.min(10, mD))
    const f = blobCA(L, D, rnd, { minimo: 46, densita: 1.5, lobi: [[0.27, 0.5, 0.3], [0.74, 0.35 + rnd() * 0.3, 0.27]] })
    return f && (girata ? { w: f.h, h: f.w, m: trasponi(f.m, f.w, f.h) } : f)
  },

  // un budello largo: una galleria che serpeggia, quattro o cinque celle di sezione
  galleria: (maxW, maxH, rnd) => {
    const girata = rnd() < 0.5
    const [mL, mD] = girata ? [maxH, maxW] : [maxW, maxH]
    if (mL < 11 || mD < 5) return null
    const L = tra(rnd, 11, Math.min(18, mL)), D = tra(rnd, 5, Math.min(7, mD))
    const f = blobCA(L, D, rnd, { minimo: 30, densita: 1.75, lobi: [[0.17, 0.5, 0.2], [0.5, 0.35 + rnd() * 0.3, 0.2], [0.83, 0.5, 0.2]] })
    return f && (girata ? { w: f.h, h: f.w, m: trasponi(f.m, f.w, f.h) } : f)
  },

  // un antro: lo slargo grande della grotta, dove stanno i branchi (da 70 celle: `grande`)
  antro: (maxW, maxH, rnd) => {
    // la scatola è la foglia intera: il bordo di una massa è sempre vuoto, quindi il margine c'è già. In una foglia stretta
    // l'automa non basta: si scava un tondo grande (tondo), col contorno mosso
    if (maxW < 14 || maxH < 11) {
      const w = Math.min(maxW - 2, 16), h = Math.min(maxH - 2, 12)
      return w >= 11 && h >= 8 && w * h >= 92 ? tondo(w, h, rnd, CELLE_SALA + 2) : null
    }
    const w = tra(rnd, Math.min(14, maxW), Math.min(20, maxW)), h = tra(rnd, Math.min(11, maxH), Math.min(14, maxH))
    return blobCA(w, h, rnd, { minimo: CELLE_SALA + 2, densita: 1.9 })
  },
}

// Una massa organica dentro `w × h`: celle piene vicino ai centri (un'ellisse o i `lobi` [x, y, raggio] in frazioni del
// riquadro), rade verso i bordi; tre giri di automa cellulare (una cella è vuota con meno di quattro vicine piene, piena
// con cinque o più); si tiene la massa più grande in un pezzo solo e si ritaglia dal vuoto attorno. Null se non viene.
export function blobCA(w, h, rnd, { minimo = 30, densita = 1.2, lobi = null, larghezzaMin = 5, altezzaMin = 4 } = {}) {
  for (let prova = 0; prova < 16; prova++) {
    let m = vuota(w, h)
    // il contorno è gonfio e storto: tre armoniche a caso sull'angolo, per non avere un ovale
    const armoniche = [1, 2, 3].map(k => ({ k, a: (0.34 - 0.07 * k) * (0.5 + rnd()), f: rnd() * 6.283 }))
    // e un rumore a macchie larghe tre celle (valori a caso sulla griglia, interpolati) scava baie e spinge penisole
    const gw = Math.ceil(w / 3) + 2, gh = Math.ceil(h / 3) + 2
    const griglia = Array.from({ length: gw * gh }, () => rnd())
    const macchia = (x, y) => {
      const u = x / 3, v = y / 3, i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j
      const g = (a, b) => griglia[b * gw + a]
      return (g(i, j) * (1 - fu) + g(i + 1, j) * fu) * (1 - fv) + (g(i, j + 1) * (1 - fu) + g(i + 1, j + 1) * fu) * fv
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let d = 9, ang = 0
      if (lobi) for (const [lx, ly, r] of lobi) {
        const dx = (x + 0.5) / w - lx, dy = ((y + 0.5) / h - ly) * (h / w), q = ipot(dx, dy) / r
        if (q < d) { d = q; ang = arcotangente2(dy, dx) }
      } else {
        const dx = ((x + 0.5) / w - 0.5) * 2, dy = ((y + 0.5) / h - 0.5) * 2
        d = ipot(dx, dy); ang = arcotangente2(dy, dx)
      }
      d /= Math.max(0.55, 1 + armoniche.reduce((n, o) => n + o.a * coseno(o.k * ang + o.f), 0))
      d += (macchia(x, y) - 0.5) * 0.8
      const p = Math.max(0, Math.min(0.97, densita - d * 1.02))
      if (x > 0 && y > 0 && x < w - 1 && y < h - 1 && rnd() < p) m[y * w + x] = 1
    }
    for (let g = 0; g < 2; g++) {
      const n = vuota(w, h)
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let c = 0
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const a = x + dx, b = y + dy
          if ((dx || dy) && a >= 0 && b >= 0 && a < w && b < h) c += m[b * w + a]
        }
        n[y * w + x] = c >= 5 ? 1 : c <= 3 ? 0 : m[y * w + x]
      }
      m = n
    }
    // la massa più grande, in un pezzo solo (quattro direzioni)
    const visto = new Uint8Array(w * h)
    let meglio = []
    for (let k = 0; k < w * h; k++) {
      if (!m[k] || visto[k]) continue
      const coda = [k]; visto[k] = 1
      for (let i = 0; i < coda.length; i++) {
        const x = coda[i] % w, y = (coda[i] / w) | 0
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const a = x + dx, b = y + dy
          if (a < 0 || b < 0 || a >= w || b >= h || visto[b * w + a] || !m[b * w + a]) continue
          visto[b * w + a] = 1; coda.push(b * w + a)
        }
      }
      if (coda.length > meglio.length) meglio = coda
    }
    if (meglio.length < minimo) continue
    let x0 = w, y0 = h, x1 = 0, y1 = 0
    for (const k of meglio) { const x = k % w, y = (k / w) | 0; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y) }
    const cw = x1 - x0 + 1, ch = y1 - y0 + 1
    if (cw < larghezzaMin || ch < altezzaMin) continue
    const o = vuota(cw, ch)
    for (const k of meglio) o[((k / w | 0) - y0) * cw + (k % w) - x0] = 1
    return { w: cw, h: ch, m: o }
  }
  return null
}

// la forma `nome` dentro uno spazio di `maxW × maxH` celle: { w, h, m, pezzi } o null se non ci sta
export function costruisci(nome, maxW, maxH, rnd) {
  const f = SU_MISURA[nome] && SU_MISURA[nome](maxW, maxH, rnd)
  if (!f || !connessa(f.m, f.w, f.h)) return null
  return f
}

// quante celle si camminano
export const celleDi = m => m.reduce((n, c) => n + c, 0)

// una pozza d'acqua: un'ellisse con il contorno mosso, in un pezzo solo; null se non viene (di rado)
export function pozza(w, h, rnd) {
  for (let prova = 0; prova < 10; prova++) {
    const m = vuota(w, h)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
      if (ipot((x + 0.5 - w / 2) / (w / 2), (y + 0.5 - h / 2) / (h / 2)) + (rnd() - 0.5) * 0.55 < 1) m[y * w + x] = 1
    if (celleDi(m) >= 4 && connessa(m, w, h)) return { w, h, m }
  }
  return null
}

// uno spazio stretto scavato a tondo: gli angoli mangiati, il bordo mosso, in un pezzo solo (per una grotta dove l'automa non ci sta)
function tondo(w, h, rnd, minimo = 0) {
  for (let prova = 0; prova < 14; prova++) {
    const m = vuota(w, h)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const bordo = (x === 0 || x === w - 1) + (y === 0 || y === h - 1)
      if (bordo === 2 || (bordo === 1 && rnd() < 0.18)) continue
      m[y * w + x] = 1
    }
    if (celleDi(m) >= Math.max(minimo, Math.floor(w * h * 0.5)) && connessa(m, w, h)) return { w, h, m }
  }
  return null
}
