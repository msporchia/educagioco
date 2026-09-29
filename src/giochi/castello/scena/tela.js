// La tela del castello a sprite: riceve un campo già deciso (scena/campo.js)
// e lo dipinge, senza sapere niente di regole. Il canvas è grande quanto il
// mondo in pixel di sprite e non c'è nessuna scala qui dentro: a farlo
// entrare nello schermo ci pensa il CSS (object-fit: contain). Chi disegna
// roba che non è uno sprite (i segnaposti) viene ingrandito insieme al
// resto: per numeri nitidi serve un secondo canvas non scalato, non
// rimettere la scala qui.
import { ATLANTE, PEZZI } from '../dati/atlante.js'
import { TESSERA, COLONNE, RIGHE, inSprite } from '../dati/mondo.js'
import { creaFoglio, netto } from '../../../grafica/atlante.js'

export const LARGO = COLONNE * TESSERA
export const ALTO = RIGHE * TESSERA

export class Tela {
  constructor(canvas) {
    this.canvas = canvas
    this.canvas.width = LARGO
    this.canvas.height = ALTO
    this.ctx = canvas.getContext('2d')
    // il foglio si carica da sé: disegnare prima che sia pronto non rompe
    // niente, `pezzo` risponde false
    this.foglio = creaFoglio({ pezzi: PEZZI, immagine: ATLANTE, tessera: TESSERA })
    this.foglio.carica().then(() => this.disegna(this.campo)).catch(() => {})
    this.campo = null
  }

  disegna(campo) {
    this.campo = campo
    if (!campo) return
    const ctx = this.ctx
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    netto(ctx)
    ctx.fillStyle = '#161a16'
    ctx.fillRect(0, 0, LARGO, ALTO)

    for (let x = 0; x < COLONNE; x++)
      for (let y = 0; y < RIGHE; y++) {
        const n = campo.prato(x, y)
        if (n) this.foglio.pezzo(ctx, n, x * TESSERA, y * TESSERA)
      }

    for (const c of campo.strada) {
      if (!c.posa) { this.buco(c); continue }
      this.tessera(c)
    }

    for (const q of campo.postazioni) this.piazzola(q)
    for (const b of campo.bocche) this.bocca(b)
    this.porta(campo.porta)
  }

  // il giro si fa qui col contesto: girarlo a monte vorrebbe dire otto
  // copie di ogni tessera nell'atlante
  tessera({ x, y, posa }) {
    const ctx = this.ctx
    const m = TESSERA / 2
    ctx.save()
    ctx.translate(x * TESSERA + m, y * TESSERA + m)
    if (posa.gira) ctx.rotate(posa.gira * Math.PI / 2)
    if (posa.specchia) ctx.scale(-1, 1)
    this.foglio.pezzo(ctx, posa.nome, -m, -m)
    ctx.restore()
  }

  // la casella che il catalogo non sa riempire deve vedersi: coprirla
  // nasconderebbe che a quel foglio manca un pezzo
  buco({ x, y }) {
    const ctx = this.ctx
    ctx.strokeStyle = '#ff00c8'
    ctx.lineWidth = 2
    ctx.strokeRect(x * TESSERA + 1, y * TESSERA + 1, TESSERA - 2, TESSERA - 2)
  }

  // i segnaposti: le figure (torri, castello, bocche) non sono ancora
  // nell'atlante, quindi si disegnano piatte e riconoscibili come tali
  piazzola(q) {
    const ctx = this.ctx
    ctx.beginPath()
    ctx.arc(inSprite(q.x), inSprite(q.y), inSprite(9), 0, 7)
    ctx.fillStyle = 'rgba(0,0,0,.28)'
    ctx.fill()
    ctx.strokeStyle = '#ffd23f'
    ctx.lineWidth = inSprite(2)
    ctx.stroke()
  }

  bocca(b) {
    const ctx = this.ctx
    ctx.beginPath()
    ctx.arc(inSprite(b.x), inSprite(b.y), inSprite(10), 0, 7)
    ctx.fillStyle = '#e0644f'
    ctx.fill()
  }

  porta(p) {
    const ctx = this.ctx
    const x = inSprite(p.x), y = inSprite(p.y), r = inSprite(16)
    ctx.fillStyle = '#5a6fd0'
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
    ctx.strokeStyle = '#22285a'
    ctx.lineWidth = inSprite(2)
    ctx.strokeRect(x - r, y - r, r * 2, r * 2)
  }
}
