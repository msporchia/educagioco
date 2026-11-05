// Il terreno in partita: niente si disegna qui. L'immagine del posto è già pronta (`dati/terreni-pronti.js`, `npm run disegni:arena`;
// dipinta da ChatGPT o disegnata a monte da strumenti/sprite/arena-disegni/): si compone UNA volta alla misura dello schermo,
// col ponte sopra, e a ogni fotogramma è un solo disegno senza scala. Non si stira mai (docs/arena/grafica.md).
import { TERRENI_PRONTI, PEZZO_DI_MONDO as D } from '../dati/terreni-pronti.js'
import { ambiente } from './ambienti.js'

const immagini = {}
function caricaImmagine(chiave) {
  if (typeof Image === 'undefined') return Promise.resolve(null)
  return (immagini[chiave] ||= new Promise((ok, no) => {
    const i = new Image()
    i.onload = () => ok(i)
    i.onerror = () => { delete immagini[chiave]; no(new Error(`terreno ${chiave} non caricato`)) }   // un fallimento non si ricorda: si può riprovare
    i.src = TERRENI_PRONTI[chiave] || TERRENI_PRONTI.bosco
  }))
}

export class Terreno {
  constructor(chiave) {
    this.chiave = chiave
    this.a = ambiente(chiave)
    this.img = null
    this.tela = null
    this.vista = null
  }

  async prepara() { this.img = await caricaImmagine(this.chiave) }

  /* la misura è cambiata: la prossima volta si ricompone */
  scorda() { this.tela = null }

  /* un telefono a corto di memoria può svuotare una tela in silenzio: si guarda un punto, e se è trasparente si rifà */
  controlla() {
    if (!this.tela) return
    try {
      if (this.tela.getContext('2d').getImageData(this.tela.width >> 1, this.tela.height >> 1, 1, 1).data[3] === 0) this.tela = null
    } catch { /* tela non leggibile: non si giudica */ }
  }

  /* la tela alla misura vera dello schermo: il pezzo di mondo dell'immagine, specchiato se lo schermo ne vuole di più (un monitor
     molto largo), quello che `sopra` ci aggiunge (il ponte) e i bordi scuri, che a fotogramma costerebbero una velatura intera */
  componi({ W, H, k, X, Y, s, sopra }) {
    const cv = document.createElement('canvas'); cv.width = Math.round(W * k); cv.height = Math.round(H * k)
    const c = cv.getContext('2d')
    c.scale(k, k)
    c.fillStyle = this.a.tinta; c.fillRect(0, 0, W, H)
    const x0 = -X(0) / s, y0 = -Y(0) / s
    for (let j = Math.floor((y0 - D.y) / D.h); j * D.h + D.y < y0 + H / s; j++) {
      for (let i = Math.floor((x0 - D.x) / D.w); i * D.w + D.x < x0 + W / s; i++) {
        c.save(); c.translate(X(D.x + (i + (i & 1)) * D.w), Y(D.y + (j + (j & 1)) * D.h)); c.scale(i & 1 ? -1 : 1, j & 1 ? -1 : 1)
        c.drawImage(this.img, 0, 0, D.w * s, D.h * s); c.restore()
      }
    }
    sopra(c)
    const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.46, W / 2, H / 2, Math.hypot(W, H) * 0.56)
    g.addColorStop(0, 'rgba(6,3,14,0)'); g.addColorStop(1, 'rgba(6,3,14,.5)')
    c.fillStyle = g; c.fillRect(0, 0, W, H)
    return cv
  }

  disegna(c, misure) {
    this.tela ||= this.componi(misure)
    c.drawImage(this.tela, 0, 0, misure.W, misure.H)
  }
}
