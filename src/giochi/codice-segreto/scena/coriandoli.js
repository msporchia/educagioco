/* ═══════════════════════════════════════════════════════════════════
   CORIANDOLI — l'unica cosa che qui si disegna su tela

   Una classe con `lancia()` e `ferma()`, che riceve il canvas e non sa
   niente del gioco: non le si dice «ha vinto», le si dice «butta giù dei
   pezzetti di carta». Se domani i coriandoli servono a un altro gioco, si
   porta via questo file e basta.
   ═══════════════════════════════════════════════════════════════════ */

const COLORI = ['#17a34a', '#f0900e', '#4b8bf5', '#e2467a', '#f5d33c', '#8b5cf6']

export class Coriandoli {
  constructor(tela) {
    this.tela = tela
    this.pezzi = []
    this.animazione = 0
  }

  lancia({ quanti = 130, durata = 4200, colori = COLORI } = {}) {
    const tela = this.tela
    if (!tela || typeof tela.getContext !== 'function') return false
    /* prima si mostra, poi si misura: da nascosta è larga zero */
    tela.hidden = false
    const r = tela.getBoundingClientRect()
    if (!r.width || !r.height) { tela.hidden = true; return false }

    const dpr = Math.min(2, window.devicePixelRatio || 1)
    tela.width = r.width * dpr
    tela.height = r.height * dpr
    const ctx = tela.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    this.pezzi = Array.from({ length: quanti }, () => ({
      x: Math.random() * r.width,
      y: -20 - Math.random() * r.height * 0.6,
      vx: (Math.random() - 0.5) * 2.4,
      vy: 2 + Math.random() * 3.4,
      l: 6 + Math.random() * 7,
      a: Math.random() * Math.PI,
      va: (Math.random() - 0.5) * 0.3,
      col: colori[Math.floor(Math.random() * colori.length)],
    }))

    const fine = performance.now() + durata
    cancelAnimationFrame(this.animazione)
    const passo = ora => {
      ctx.clearRect(0, 0, r.width, r.height)
      for (const p of this.pezzi) {
        p.x += p.vx; p.y += p.vy; p.a += p.va; p.vy += 0.045
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.a)
        ctx.fillStyle = p.col
        ctx.fillRect(-p.l / 2, -p.l / 4, p.l, p.l / 2)
        ctx.restore()
      }
      if (ora < fine) this.animazione = requestAnimationFrame(passo)
      else this.ferma()
    }
    passo(performance.now())
    return true
  }

  ferma() {
    cancelAnimationFrame(this.animazione)
    this.animazione = 0
    this.pezzi = []
    if (this.tela) this.tela.hidden = true
  }
}
