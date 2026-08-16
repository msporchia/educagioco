/* ═══════════════════════════════════════════════════════════════════
   LA TELA DEL CASTELLO A SPRITE — il disegno, e nient'altro

   Riceve un campo già deciso (`scena/campo.js`) e lo dipinge. Di regole
   non sa niente: non sa quanto costa una torre né chi sta arrivando.

   ── il canvas è grande quanto il mondo, e a ridurlo ci pensa il browser ──
   Il canvas si dichiara della misura esatta del campo in pixel di
   sprite — dodici caselle per ventidue, per quanto è grande una tessera
   — e da lì in poi **non c'è una scala da nessuna parte**: una cella sta
   a `TESSERA`, una tessera si posa al suo posto, fine. A farlo entrare
   nello schermo ci pensa il CSS (`object-fit: contain`), cioè il
   compositore, che di ridimensionare immagini è il mestiere.

   Sembra un dettaglio e non lo è: la versione di prima calcolava una
   scala per fotogramma, la applicava alla trasformazione del contesto e
   doveva tenere intera **la cella in pixel dello schermo**, se no fra
   una tessera e l'altra spuntava la riga di fondo — i bordi cadevano a
   metà pixel. Con il canvas alla misura del mondo quel problema non
   esiste proprio: le tessere si appoggiano su coordinate intere del
   canvas, che è l'unico posto dove i pixel sono quelli veri, e il
   ridimensionamento avviene **dopo**, sull'immagine finita, una volta
   sola e uniforme.

   Il prezzo c'è ed è uno solo: quello che non è uno sprite — i cerchi
   delle piazzole, e domani i numeri e le barrette — viene disegnato alla
   risoluzione del mondo e poi ingrandito insieme a tutto il resto,
   quindi è grosso quanto gli sprite. Per i segnaposti va benissimo.
   Quando serviranno numeri nitidi, il modo è un secondo canvas sopra
   questo, non scalato — non rimettere la scala qui dentro.

   ── e allora quanto deve essere grande una tessera ──
   Adesso che la scala non è più un vincolo, `TESSERA` è solo **quanta
   roba c'è nel foglio**: i ritagli veri sono da una sessantina di pixel,
   quindi tagliarli a 36 butta via metà del disegno. Il numero sta nel
   foglietto (`strumenti/sprite/sorgenti/td/atlante.json`), qui non
   cambia una riga, e l'unica cosa che cresce è il peso dell'atlante.
   ═══════════════════════════════════════════════════════════════════ */
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
    /* Il foglio si carica da sé: disegnare prima che sia pronto non rompe
       niente — `pezzo` risponde `false` — e il primo fotogramma buono
       arriva appena l'immagine c'è. */
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

  /* ── una tessera girata ──
     Le pose sono quattro giri per due versi, e il giro si fa qui col
     contesto: girare l'immagine a monte vorrebbe dire otto copie di ogni
     tessera nell'atlante, e l'atlante è già la cosa più pesante che
     questo gioco si porta dietro. */
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

  /* La casella che il catalogo non sa riempire: si vede, e deve vedersi.
     Coprirla con una tessera qualsiasi vorrebbe dire nascondere l'unica
     informazione utile — che a quel foglio manca un pezzo. */
  buco({ x, y }) {
    const ctx = this.ctx
    ctx.strokeStyle = '#ff00c8'
    ctx.lineWidth = 2
    ctx.strokeRect(x * TESSERA + 1, y * TESSERA + 1, TESSERA - 2, TESSERA - 2)
  }

  /* ── i segnaposti ──
     Le figure — torri, castello, bocche — nell'atlante non ci sono
     ancora (`FIGURE` è vuoto): il foglio che le porta non è stato
     ritagliato. Qui si disegnano piatte, e si vede benissimo che sono
     segnaposti. Meglio un cerchio giallo dichiarato che una torre finta.
     Arrivano in unità di gioco e vanno portate in pixel di sprite. */
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
