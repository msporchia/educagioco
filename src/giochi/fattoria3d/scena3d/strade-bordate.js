// Le strade di tutti i tipi, coi loro bordi: un banco di istanze per tipo (il fondo, una cella l'una) e uno o due per ogni stile di bordo
// (cordolo, sassi, erba alta). Il bordo si calcola dai vicini (dati/tessere.js): sta solo sui lati che non toccano un'altra strada dello
// stesso tipo, e sugli angoli rientranti. Il peso è quello delle istanze: non cresce con la fattoria (finestra di lotti, come il resto).
// Vedi docs/fattoria3d/terreno.md «Le strade: tipi e bordi» e «Gli strati del terreno».
import * as THREE from 'three'
import { cellaDa, chiave } from '../dati/mondo.js'
import { viciniDi, caso, LATI, ANGOLI } from '../dati/tessere.js'
import { TIPI } from '../dati/strade.js'

/** Quante istanze al massimo (il peso è questo, qualunque sia l'estensione). */
export const CAPACITA_STRADE = { fondo: 4000, lati: 3200, sassi: 5000, angoli: 800 }
const ALTEZZA = 0.03                                          // lo spessore del fondo: sopra il prato, sotto ogni cosa

function tela(px, py = px) { const c = document.createElement('canvas'); c.width = px; c.height = py; return c }
function texturaDa(c, ripeti = false) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
  if (ripeti) t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}
/** Un caso con seme, per le texture: le stesse a ogni avvio. */
function dado(seme) { let s = seme >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296 } }

// ── i fondi: una texture per tipo, che ripetuta cella per cella si fonde con la vicina ──
const FONDI = {
  ghiaia(x, px, r) {
    x.fillStyle = '#a8a29a'; x.fillRect(0, 0, px, px)
    for (let k = 0; k < 900; k++) { x.fillStyle = ['#8d877f', '#c4beb4', '#b4aea4', '#7d776f'][k & 3]; x.globalAlpha = 0.5 + r() * 0.4; x.beginPath(); x.arc(r() * px, r() * px, 1 + r() * 2.6, 0, 6.3); x.fill() }
  },
  ciottoli(x, px, r) {
    x.fillStyle = '#d9d2bf'; x.fillRect(0, 0, px, px)
    for (let k = 0; k < 46; k++) {
      const cx = r() * px, cy = r() * px, a = 5 + r() * 6
      for (const [dx, dy] of [[0, 0], [px, 0], [-px, 0], [0, px], [0, -px]]) {         // un ciottolo sul bordo rientra dall'altra parte: la piastrella si ripete senza cuciture
        x.fillStyle = ['#f7f3e8', '#efe9d8', '#fbf8ef'][k % 3]; x.strokeStyle = '#b5ad98'; x.lineWidth = 1.2; x.globalAlpha = 1
        x.beginPath(); x.ellipse(cx + dx, cy + dy, a, a * (0.7 + r() * 0.25), r() * 3, 0, 6.3); x.fill(); x.stroke()
      }
    }
  },
  lastricato(x, px, r) {
    x.fillStyle = '#8f8b83'; x.fillRect(0, 0, px, px)
    const m = px / 2
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
      const t = 176 + Math.floor(r() * 26); x.fillStyle = `rgb(${t},${t - 4},${t - 12})`; x.fillRect(a * m + 3, b * m + 3, m - 6, m - 6)
      x.fillStyle = 'rgba(255,255,255,.14)'; x.fillRect(a * m + 3, b * m + 3, m - 6, 4)
    }
  },
  mattoni(x, px, r) {
    x.fillStyle = '#d8c7ad'; x.fillRect(0, 0, px, px)
    const righe = 8, h = px / righe, l = px / 4
    for (let q = 0; q < righe; q++) for (let c = -1; c < 4; c++) {
      const sx = c * l + (q % 2 ? l / 2 : 0), t = 0.78 + r() * 0.3
      x.fillStyle = `rgb(${Math.round(181 * t)},${Math.round(89 * t)},${Math.round(63 * t)})`
      for (const dx of [0, -px]) x.fillRect(sx + dx + 2, q * h + 2, l - 4, h - 4)         // il mattone che esce a destra rientra a sinistra
    }
  },
}

/** La striscia d'erba che morde il bordo: fili che partono dal lato esterno (in alto nella tela) verso l'interno, con la trasparenza dove non c'è erba. */
function texturaErba() {
  const W = 256, H = 64, c = tela(W, H), x = c.getContext('2d'), r = dado(7)
  for (let k = 0; k < 150; k++) {
    const cx = r() * W, alt = 14 + r() * 40, larg = 3 + r() * 4, verde = ['#4f8f2f', '#5e9f38', '#6fb044', '#3f7a28'][k & 3]
    for (const dx of [0, W, -W]) {                                                  // si ripete senza cuciture
      x.fillStyle = verde; x.beginPath(); x.moveTo(cx + dx - larg, -2); x.lineTo(cx + dx + larg, -2); x.lineTo(cx + dx + (r() - 0.5) * 6, alt); x.closePath(); x.fill()
    }
  }
  x.fillStyle = '#4a8a2e'; x.fillRect(0, 0, W, 5)
  return texturaDa(c, true)
}

/**
 * Il disegno delle strade. `sabbia` è la texture della terra battuta (quella di sempre); `texture` è l'elenco da liberare alla chiusura.
 * `motore` dà `strada` (Map cella → 1|2) e `aspettoStrada(i, j)`; `dentroFinestra(i, j)` dice cosa ridisegnare.
 */
export class StradeBordate {
  constructor(scena, motore, sabbia, texture, dentroFinestra) {
    this.m = motore; this.dentro = dentroFinestra
    const ripeti = t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; return t }
    const fondo = new THREE.BoxGeometry(1, ALTEZZA, 1)
    this.fondi = {}
    for (const tipo of TIPI) {
      const mappa = tipo === 'terra' ? sabbia : texturaDa((() => { const c = tela(128), x = c.getContext('2d'); FONDI[tipo](x, 128, dado(tipo.length * 977 + tipo.charCodeAt(0))); return c })(), true)
      if (tipo !== 'terra') texture.push(ripeti(mappa))
      this.fondi[tipo] = this._banco(scena, fondo, new THREE.MeshStandardMaterial({ map: mappa, roughness: tipo === 'lastricato' || tipo === 'mattoni' ? 0.85 : 1 }), CAPACITA_STRADE.fondo, true)
    }
    const erba = texturaErba(); texture.push(erba)
    const matErba = new THREE.MeshStandardMaterial({ map: erba, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 })
    const piano = (w, h) => new THREE.PlaneGeometry(w, h).rotateX(-Math.PI / 2)
    const sasso = new THREE.IcosahedronGeometry(0.075, 0).scale(1, 0.62, 1)
    this.bordi = {
      cordolo: { lato: this._banco(scena, new THREE.BoxGeometry(1, 0.08, 0.1), new THREE.MeshStandardMaterial({ color: 0xcfcac0, roughness: 0.9 }), CAPACITA_STRADE.lati, true),
        angolo: this._banco(scena, new THREE.BoxGeometry(0.1, 0.08, 0.1), new THREE.MeshStandardMaterial({ color: 0xcfcac0, roughness: 0.9 }), CAPACITA_STRADE.angoli, true) },
      sassi: { sasso: this._banco(scena, sasso, new THREE.MeshStandardMaterial({ color: 0x9a948a, roughness: 1, flatShading: true }), CAPACITA_STRADE.sassi, true) },
      erba: { lato: this._banco(scena, piano(1, 0.34), matErba, CAPACITA_STRADE.lati, false), angolo: this._banco(scena, piano(0.3, 0.3), matErba, CAPACITA_STRADE.angoli, false) },
    }
    this.banchi = [...Object.values(this.fondi), ...Object.values(this.bordi).flatMap(b => Object.values(b))]
  }

  _banco(scena, geo, mat, cap, ombra) {
    const m = new THREE.InstancedMesh(geo, mat, cap)
    m.receiveShadow = ombra; m.frustumCulled = false; m.count = 0
    m.setColorAt(0, new THREE.Color()); scena.add(m)
    return m
  }

  /** Mette un'istanza nel banco: posizione, giro attorno a y, scala, tinta. */
  _metti(banco, x, y, z, giro, sx, sy, sz, tinta) {
    const n = banco.count; if (n >= banco.instanceMatrix.count) return
    const d = this._d, c = this._c
    d.position.set(x, y, z); d.rotation.set(0, giro, 0); d.scale.set(sx, sy, sz); d.updateMatrix()
    banco.setMatrixAt(n, d.matrix); banco.setColorAt(n, c.setRGB(tinta, tinta * 0.99, tinta * 0.96)); banco.count = n + 1
  }

  ridisegna() {
    this._d = this._d || new THREE.Object3D(); this._c = this._c || new THREE.Color()
    for (const b of this.banchi) b.count = 0
    const m = this.m
    this._aspetto = (i, j) => (m.strada.has(chiave(i, j)) ? m.aspettoStrada(i, j) : null)
    for (const [k, v] of m.strada) {
      if (!v) continue
      const [i, j] = cellaDa(k)
      if (!this.dentro(i, j)) continue
      const a = m.aspettoStrada(i, j)
      const t = 0.93 + (((i * 7 + j * 13) % 9) + 9) % 9 * 0.014
      this._metti(this.fondi[a.tipo], i + 0.5, ALTEZZA / 2, j + 0.5, 0, 1, 1, 1, t)
      if (a.bordo !== 'nessuno') this._bordo(a.bordo, i, j)
    }
    for (const b of this.banchi) { b.instanceMatrix.needsUpdate = true; if (b.instanceColor) b.instanceColor.needsUpdate = true }
  }

  /** Il bordo di una cella: sui lati vuoti, e un pezzo negli angoli rientranti. Due strade dello stesso tipo si uniscono; un tipo diverso è un confine netto, senza bordo. */
  _bordo(stile, i, j) {
    const v = viciniDi(this._aspetto, UNISCE, i, j)
    const cx = i + 0.5, cz = j + 0.5, B = this.bordi[stile]
    for (let s = 0; s < 4; s++) {
      if (v.lati[s] !== 'vuoto') continue
      const [di, dj] = LATI[s], giro = -s * Math.PI / 2
      if (stile === 'cordolo') this._metti(B.lato, cx + di * 0.45, 0.04, cz + dj * 0.45, giro, 1, 1, 1, 0.94 + caso(i, j, s) * 0.1)
      else if (stile === 'erba') this._metti(B.lato, cx + di * 0.37, 0.036, cz + dj * 0.37, giro, caso(i, j, s) < 0.5 ? 1 : -1, 1, 1, 0.9 + caso(i, j, s + 9) * 0.2)
      else {
        const tx = -dj, tz = di                                            // lungo il lato
        for (let q = 0; q < 5; q++) {
          const r = caso(i, j, s * 8 + q), t = -0.4 + q * 0.2 + (r - 0.5) * 0.08, p = 0.43 + (caso(i, j, s * 8 + q + 40) - 0.5) * 0.07, g = 0.7 + caso(i, j, s * 8 + q + 80) * 0.7
          this._metti(B.sasso, cx + di * p + tx * t, 0.03, cz + dj * p + tz * t, r * 6.3, g, 0.8 + r * 0.6, g * (0.8 + r * 0.3), 0.75 + caso(i, j, s * 8 + q + 120) * 0.4)
        }
      }
    }
    for (let c = 0; c < 4; c++) {
      if (!v.angoli[c]) continue
      const [di, dj] = ANGOLI[c]
      if (stile === 'cordolo') this._metti(B.angolo, cx + di * 0.45, 0.04, cz + dj * 0.45, 0, 1, 1, 1, 0.97)
      else if (stile === 'erba') this._metti(B.angolo, cx + di * 0.35, 0.036, cz + dj * 0.35, c * 1.57, 1, 1, 1, 1)
      else this._metti(B.sasso, cx + di * 0.43, 0.03, cz + dj * 0.43, caso(i, j, c) * 6.3, 1.1, 1, 1, 0.9)
    }
  }
}

const UNISCE = (a, b) => a.tipo === b.tipo
