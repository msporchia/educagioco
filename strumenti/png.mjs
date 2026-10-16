// Una tela RGBA che si scrive in PNG senza browser né dipendenze (zlib è nel Node), con un carattere di 3×5 pixel per le
// etichette. La usa `npm run pianta -- --mondo`; serve a chi vuole guardare una pianta con Read senza fare la build.
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

// il carattere: cinque righe di tre pixel per lettera, maiuscole, cifre e qualche segno
const LETTERE = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
  G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
  M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101',
  S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
  Y: '101101010010010', Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
  4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001110',
  '-': '000000111000000', ':': '000010000010000', '.': '000000000000010', '/': '001001010100100', "'": '010010000000000',
  '>': '100010001010100', '<': '001010100010001', '(': '010100100100010', ')': '010001001001010', '+': '000010111010000',
  '?': '110001010000010', '!': '010010010000010', '=': '000111000111000', '#': '101111101111101', '%': '101001010100101',
  ' ': '000000000000000', ',': '000000000010100',
}
const SENZA_ACCENTI = { À: 'A', È: 'E', É: 'E', Ì: 'I', Ò: 'O', Ù: 'U' }

export class Tela {
  constructor(w, h, fondo = [0, 0, 0]) {
    this.w = w; this.h = h
    this.px = Buffer.alloc(w * h * 4)
    this.rettangolo(0, 0, w, h, fondo)
  }
  punto(x, y, [r, g, b], a = 1) {
    x = Math.floor(x); y = Math.floor(y)
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return
    const i = (y * this.w + x) * 4, p = this.px
    p[i] = Math.round(p[i] * (1 - a) + r * a); p[i + 1] = Math.round(p[i + 1] * (1 - a) + g * a); p[i + 2] = Math.round(p[i + 2] * (1 - a) + b * a); p[i + 3] = 255
  }
  rettangolo(x, y, w, h, colore, a = 1) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.punto(x + i, y + j, colore, a) }
  cornice(x, y, w, h, colore) {
    for (let i = 0; i < w; i++) { this.punto(x + i, y, colore); this.punto(x + i, y + h - 1, colore) }
    for (let j = 0; j < h; j++) { this.punto(x, y + j, colore); this.punto(x + w - 1, y + j, colore) }
  }
  // il testo, `s` pixel per pixel del carattere; con `fondo` un riquadro dietro perché si legga sopra la mappa
  testo(x, y, t, colore, { s = 2, fondo = null } = {}) {
    const lettere = [...String(t).toUpperCase()].map(c => SENZA_ACCENTI[c] || c)
    if (fondo) this.rettangolo(x - s, y - s, lettere.length * 4 * s + s, 7 * s, fondo, 0.75)
    lettere.forEach((c, n) => {
      const g = LETTERE[c] || LETTERE['?']
      for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g[j * 3 + i] === '1') this.rettangolo(x + (n * 4 + i) * s, y + j * s, s, s, colore)
    })
    return lettere.length * 4 * s
  }
  scrivi(file) {
    const crc = buf => {
      let c = ~0
      for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)) }
      return ~c >>> 0
    }
    const pezzo = (tipo, dati) => {
      const t = Buffer.from(tipo), lun = Buffer.alloc(4), c = Buffer.alloc(4)
      lun.writeUInt32BE(dati.length); c.writeUInt32BE(crc(Buffer.concat([t, dati])))
      return Buffer.concat([lun, t, dati, c])
    }
    const testa = Buffer.alloc(13)
    testa.writeUInt32BE(this.w, 0); testa.writeUInt32BE(this.h, 4); testa.set([8, 6, 0, 0, 0], 8)
    const righe = Buffer.alloc((this.w * 4 + 1) * this.h)
    for (let y = 0; y < this.h; y++) this.px.copy(righe, y * (this.w * 4 + 1) + 1, y * this.w * 4, (y + 1) * this.w * 4)
    writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      pezzo('IHDR', testa), pezzo('IDAT', deflateSync(righe)), pezzo('IEND', Buffer.alloc(0))]))
  }
}
