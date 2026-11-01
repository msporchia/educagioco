// Le strade di tutti i tipi, coi loro bordi: un banco di istanze per tipo (il fondo, una cella l'una) e uno o due per ogni stile di bordo
// (cordolo, sassi, erba alta). Il bordo si calcola dai vicini (dati/tessere.js): sta solo sui lati che non toccano un'altra strada dello
// stesso tipo, e sugli angoli rientranti. Il peso è quello delle istanze: non cresce con la fattoria (finestra di lotti, come il resto).
// Vedi docs/fattoria3d/terreno.md «Le strade: tipi e bordi» e «Gli strati del terreno».
import * as THREE from 'three'
import { cellaDa, chiave } from '../dati/mondo.js'
import { viciniDi, caso, LATI, ANGOLI } from '../dati/tessere.js'
import { TIPI } from '../dati/strade.js'

/** Quante istanze al massimo (il peso è questo, qualunque sia l'estensione). */
export const CAPACITA_STRADE = { fondo: 4000, lati: 3200, sassi: 9000, ciuffi: 6000, pali: 3000, angoli: 800 }
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

/** La frangia d'erba che sfuma sul prato: fili che partono dalla linea di mezzo (il bordo della strada) e vanno da una parte e dall'altra, lunghi e corti,
    dello stesso verde del prato; la trasparenza fa il resto. La tela si ripete in lunghezza senza cuciture. */
function texturaErba() {
  const W = 256, H = 96, M = H / 2, c = tela(W, H), x = c.getContext('2d'), r = dado(7)
  for (let k = 0; k < 190; k++) {
    const cx = r() * W, larg = 2 + r() * 3, verde = ['#5e9a38', '#79b84a', '#6aa840', '#86c455'][k & 3], dir = k % 3 === 0 ? -1 : 1     // due terzi verso la strada, uno verso il prato
    const alt = (dir > 0 ? 8 + r() * 36 : 6 + r() * 22), piega = (r() - 0.5) * 9
    for (const dx of [0, W, -W]) {
      x.globalAlpha = 0.9; x.fillStyle = verde; x.beginPath(); x.moveTo(cx + dx - larg, M); x.lineTo(cx + dx + larg, M); x.lineTo(cx + dx + piega, M + dir * alt); x.closePath(); x.fill()
    }
  }
  // Il colore dei pixel trasparenti sarebbe nero (la tela è premoltiplicata) e filtrando sporcherebbe i fili di scuro: lo si rimette verde a mano, in una DataTexture.
  const d = x.getImageData(0, 0, W, H).data, buf = new Uint8Array(W * H * 4)
  for (let riga = 0; riga < H; riga++) for (let col = 0; col < W; col++) {
    const da = (riga * W + col) * 4, a = (H - 1 - riga) * W * 4 + col * 4             // la prima riga della DataTexture è il basso
    const pieno = d[da + 3] > 0
    buf[a] = pieno ? d[da] : 110; buf[a + 1] = pieno ? d[da + 1] : 172; buf[a + 2] = pieno ? d[da + 2] : 70; buf[a + 3] = d[da + 3]
  }
  const t = new THREE.DataTexture(buf, W, H, THREE.RGBAFormat); t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 4; t.needsUpdate = true
  return t
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
    const cordolo = new THREE.MeshStandardMaterial({ color: 0xd9d4c8, roughness: 0.9 }), legno = new THREE.MeshStandardMaterial({ color: 0x8a5a33, roughness: 0.95 })
    const tondo = (r, l) => new THREE.CylinderGeometry(r, r, l, 8).rotateZ(Math.PI / 2)                      // un cordolo arrotondato, steso lungo x
    const ciuffo = (() => {                                                                                     // un ciuffetto d'erba: tre fili storti
      const g = new THREE.BufferGeometry(), v = []
      for (const [dx, dz, a, h] of [[-0.012, 0, 0.5, 1], [0.012, 0.004, -0.4, 0.8], [0, -0.008, 0.1, 0.65]]) { const A = [-0.012 + dx, 0, dz], B = [0.012 + dx, 0, dz], C = [dx + a * 0.05, h * 0.16, dz + 0.012]; v.push(...A, ...B, ...C, ...A, ...C, ...B) }       // ogni filo due volte, da una parte e dall'altra: col doppio lato la normale si rovescia e va al buio
      g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(v.map((_, k) => (k % 3 === 1 ? 1 : 0)), 3)); return g       // la normale verso l'alto: un filo preso di lato non va al buio
    })()
    this.bordi = {
      cordolo: { lato: this._banco(scena, tondo(0.055, 1), cordolo, CAPACITA_STRADE.lati, true), angolo: this._banco(scena, new THREE.SphereGeometry(0.058, 8, 6), cordolo, CAPACITA_STRADE.angoli, true) },
      sassi: { sasso: this._banco(scena, new THREE.IcosahedronGeometry(0.06, 1).scale(1, 0.66, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 }), CAPACITA_STRADE.sassi, true) },
      erba: { lato: this._banco(scena, piano(1, 0.5), matErba, CAPACITA_STRADE.lati, false), angolo: this._banco(scena, piano(0.5, 0.5), matErba, CAPACITA_STRADE.angoli, false),
        ciuffo: this._banco(scena, ciuffo, new THREE.MeshStandardMaterial({ color: 0x6fb044, roughness: 1 }), CAPACITA_STRADE.ciuffi, false) },
      steccato: { palo: this._banco(scena, new THREE.BoxGeometry(0.05, 0.13, 0.05), legno, CAPACITA_STRADE.pali, true), trave: this._banco(scena, new THREE.BoxGeometry(1, 0.025, 0.025), legno, CAPACITA_STRADE.pali, true) },
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
    const cx = i + 0.5, cz = j + 0.5, B = this.bordi[stile], R = (s, k) => caso(i, j, s * 40 + k)
    for (let s = 0; s < 4; s++) {
      if (v.lati[s] !== 'vuoto') continue
      const [di, dj] = LATI[s], giro = -s * Math.PI / 2, tx = -dj, tz = di               // tx, tz: lungo il lato
      if (stile === 'cordolo') this._metti(B.lato, cx + di * 0.46, 0.05, cz + dj * 0.46, giro, 1, 1, 1, 0.92 + R(s, 0) * 0.1)
      else if (stile === 'erba') {
        this._metti(B.lato, cx + di * 0.5, 0.036, cz + dj * 0.5, giro, 1, 1, 1, 0.92 + R(s, 1) * 0.16)
        for (let q = 0; q < 8; q++) {                                                      // ciuffi veri, un po' dentro e un po' fuori
          const t = -0.45 + q * 0.125 + (R(s, q + 2) - 0.5) * 0.08, p = 0.46 + (R(s, q + 12) - 0.5) * 0.2, h = 0.9 + R(s, q + 22) * 1.3
          this._metti(B.ciuffo, cx + di * p + tx * t, 0.03, cz + dj * p + tz * t, R(s, q + 32) * 6.3, h, h, h, 0.8 + R(s, q + 42) * 0.35)
        }
      } else if (stile === 'sassi') {
        for (let q = 0; q < 6; q++) {                                                      // una fila di ciottolini chiari, e dietro qualcuno più piccolo
          const t = -0.42 + q * 0.168 + (R(s, q) - 0.5) * 0.06, p = 0.45 + (R(s, q + 10) - 0.5) * 0.05, g = 0.85 + R(s, q + 20) * 0.5
          this._metti(B.sasso, cx + di * p + tx * t, 0.035, cz + dj * p + tz * t, R(s, q + 30) * 6.3, g, 0.85 + R(s, q + 40) * 0.3, g * (0.85 + R(s, q + 50) * 0.3), 0.86 + R(s, q + 60) * 0.18)
        }
        for (let q = 0; q < 3; q++) {
          const t = -0.3 + q * 0.3 + (R(s, q + 70) - 0.5) * 0.1, g = 0.5 + R(s, q + 80) * 0.3
          this._metti(B.sasso, cx + di * 0.35 + tx * t, 0.025, cz + dj * 0.35 + tz * t, R(s, q + 90) * 6.3, g, g, g, 0.8 + R(s, q + 100) * 0.2)
        }
      } else {                                                                              // steccato basso: quattro pali e due travi
        for (let q = 0; q < 4; q++) this._metti(B.palo, cx + di * 0.46 + tx * (-0.375 + q * 0.25), 0.065, cz + dj * 0.46 + tz * (-0.375 + q * 0.25), 0, 1, 1, 1, 0.9 + R(s, q) * 0.15)
        for (const y of [0.05, 0.1]) this._metti(B.trave, cx + di * 0.46, y, cz + dj * 0.46, giro, 1, 1, 1, 0.95)
      }
    }
    for (let c = 0; c < 4; c++) {
      if (!v.angoli[c]) continue
      const [di, dj] = ANGOLI[c]
      if (stile === 'cordolo') this._metti(B.angolo, cx + di * 0.46, 0.05, cz + dj * 0.46, 0, 1, 1, 1, 0.97)
      else if (stile === 'erba') { this._metti(B.angolo, cx + di * 0.4, 0.036, cz + dj * 0.4, c * 1.57, 1, 1, 1, 1); for (let q = 0; q < 3; q++) this._metti(B.ciuffo, cx + di * (0.38 + q * 0.04), 0.03, cz + dj * (0.38 + R(c, q) * 0.12), R(c, q + 5) * 6.3, 1.4, 1.4, 1.4, 0.9) }
      else if (stile === 'sassi') this._metti(B.sasso, cx + di * 0.44, 0.035, cz + dj * 0.44, R(c, 0) * 6.3, 1.2, 1, 1.2, 0.95)
      else this._metti(B.palo, cx + di * 0.46, 0.065, cz + dj * 0.46, 0, 1, 1, 1, 1)
    }
  }
}

const UNISCE = (a, b) => a.tipo === b.tipo
