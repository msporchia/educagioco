/* La tela della fattoria: disegna un quadro già deciso (fattoria, attori, scelto, preso, anello,
   orologio, pennello, stagione), senza importare Fattoria né sapere prezzi o regole. Ordina per
   y + altezza del piede (il tetto sta sopra, non dentro); il terreno si dipinge come le voci sotto:true. */
import {
  T, CELLE, LIMITI_NUOVI, celleDi, SCALA_MIN, SCALA_MAX, SCALA_INIZIALE, caso,
} from '../dati/mondo.js'
import { ATLANTE, PEZZI, pezzoAttore } from '../dati/atlante.js'
import { PER_ID, assettoDi } from '../dati/catalogo.js'
import { OSTACOLI } from '../dati/ostacoli.js'
import { tesseraDi } from './bordi.js'
import { disegnaPixel, larghezzaDi } from './pixel-festa.js'

// Quanto vive un'etichetta (nasce quasi sempre sotto un foglio che si riapre) e di quanto sale.
export const ETICHETTA_DURATA = 2.5
export const ETICHETTA_SALITA = 28

// arcTo e non roundRect: su un telefono senza roundRect un beginPath senza tracciato non disegna niente, in silenzio.
function tondo(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2)
  c.beginPath()
  c.moveTo(x + r, y)
  c.arcTo(x + w, y, x + w, y + h, r)
  c.arcTo(x + w, y + h, x, y + h, r)
  c.arcTo(x, y + h, x, y, r)
  c.arcTo(x, y, x + w, y, r)
  c.closePath()
}

// Cresce oltre il segno e torna indietro: il «pop» con cui spuntano gettoni e nuvolette (q da 0 a 1).
function rimbalzello(q) {
  if (q <= 0) return 0
  if (q >= 1) return 1
  const c = 1.9
  return 1 + (c + 1) * Math.pow(q - 1, 3) + c * Math.pow(q - 1, 2)
}

// Le varianti del prato spuntano di rado, se no si vede il motivo che si ripete.
const ERBE = ['erba0', 'erba0', 'erba0', 'erba0', 'erba0', 'erba0', 'erba1', 'erba2', 'erba3']

// Colore dell'anteprima del pennello, per materia; '*' è il ripiego per una materia senza tinta sua.
const COLORE_MATERIA = {
  acqua: [90, 170, 230],
  roccia: [150, 150, 150],
  strada: [200, 180, 140],
  '*': [140, 220, 120],
}

// La stagione è un velo (fiocchi, crosta di neve, lucine), mai una tinta: niente Date qui dentro.
// I fiocchi vivono in un Float32Array riempito una volta; la posizione si ricava dall'orologio a ogni fotogramma.
const FIOCCHI_N = 70
const FIOCCHI = new Float32Array(FIOCCHI_N * 4)
for (let i = 0; i < FIOCCHI_N; i++) {
  FIOCCHI[i * 4] = caso(i, 1, 21)                    // x di partenza, 0..1
  FIOCCHI[i * 4 + 1] = caso(i, 2, 21)                // y di partenza, 0..1
  FIOCCHI[i * 4 + 2] = .045 + caso(i, 3, 21) * .045  // schermi al secondo: 11–22 s a cadere
  FIOCCHI[i * 4 + 3] = 1.5 + caso(i, 4, 21) * 2      // taglia, in pixel di schermo
}
// La crosta di neve va solo su quello che è alto almeno così: una panchina non ha un tetto.
const ALTO_PER_LA_NEVE = 1.5

// Un attore (bambina, cane…): tre versi nell'atlante (giù/lato/su), la sinistra è lo specchio di lato.
// Disegna soltanto: dove va e come cammina viene da fuori (motore/camminata.js). Vive in celle, non in pixel.
export class Attore {
  constructor(nome, corpo, opz = {}) {
    this.nome = nome
    this.corpo = corpo
    this.chi = opz.chi || nome
    // Facoltativo: [{colore, valore}]. Se c'è, disegna le barrette e un fumetto sotto soglia.
    this.bisogni = opz.bisogni || null
    // Quello che ha addosso, già risolto da fuori: [{testo, misura, punti}], punti per verso.
    // bob è di quanto si abbassa il disegno a ogni fotogramma della camminata (dati/animali.js).
    this.addobbi = opz.addobbi || []
    // Quello che vorrebbe, in un fumetto sopra la testa ({ disegno }): lo decide chi gioca, non questa classe.
    this.desidera = opz.desidera || null
    this.bob = opz.bob || null
  }

  // Il rettangolo a schermo, per chi deve sapere se lo si è toccato (non questa classe).
  riquadro(cellaPx, vista, pezzo = null) {
    // Si misura il fotogramma che si sta disegnando (di lato è largo il doppio): con la misura del
    // "giù" a ogni svolta lo sprite lampeggiava, centrato su un rettangolo stretto.
    const p = pezzo || pezzoAttore(this.nome, 'lato', 0) || pezzoAttore(this.nome, 'giu', 0)
    const scala = cellaPx / T
    const w = (p ? p[2] : T) * scala, h = (p ? p[3] : T * 2) * scala
    return {
      x: this.corpo.x * cellaPx - vista.x - w / 2,
      y: this.corpo.y * cellaPx - vista.y - h + cellaPx / 2,
      w, h,
    }
  }

  disegna(ctx, immagine, cellaPx, vista, orologio, evidenziato) {
    const scala = cellaPx / T
    const fr = this.corpo.cammina ? 1 + (((this.corpo.passo * 6) | 0) % 3) : 0
    const specchio = this.corpo.verso === 'sinistra'
    // Le pose di lato guardano a destra; il verso serve sia al fotogramma sia a dove cade un addobbo.
    const verso = specchio ? 'lato' : this.corpo.verso
    const p = pezzoAttore(this.nome, verso, fr)
    if (!p) return
    const r = this.riquadro(cellaPx, vista, p)
    const x = Math.round(r.x), y = Math.round(r.y), w = p[2] * scala, h = p[3] * scala
    if (specchio) {
      // Lo specchio è una trasformazione sola: l'addobbo ci sta dentro, se no andrebbe ribaltato a mano.
      ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1)
      ctx.drawImage(immagine, p[0], p[1], p[2], p[3], 0, 0, w, h)
      this.addosso(ctx, w, h, verso, fr, scala)
      ctx.restore()
    } else {
      ctx.drawImage(immagine, p[0], p[1], p[2], p[3], x, y, w, h)
      ctx.save(); ctx.translate(x, y)
      this.addosso(ctx, w, h, verso, fr, scala)
      ctx.restore()
    }
    if (evidenziato) {
      ctx.save()
      ctx.setLineDash([5, 4]); ctx.lineDashOffset = -orologio * 12
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.85)'
      ctx.strokeRect(x + 1, y + h * .38, w - 2, h * .62 - 1)
      ctx.restore()
      this.statistiche(ctx, x + w / 2, y + h * .38, w)
    } else if (this.bisogni && this.bisogni.some(b => b.valore < .35)) {
      this.fumetto(ctx, x + w / 2, y - 4, orologio, scala)
    } else if (this.desidera) {
      this.desiderio(ctx, x + w / 2, y - 2, orologio, scala)
    }
  }

  // «Lo vorrei»: un fumetto crema col disegno dentro, come quello di un recinto che ha fame.
  desiderio(ctx, cx, punta, orologio, scala) {
    const su = Math.sin(orologio * 2.4 + cx * .05) * 2
    const lato = Math.round(18 + scala * 7)
    const x = Math.round(cx - lato / 2), y = Math.round(punta - lato - lato * .3 + su)
    ctx.save()
    ctx.lineJoin = 'round'
    ctx.lineWidth = 2
    ctx.strokeStyle = '#2a1c12'
    ctx.fillStyle = '#faf6ec'
    ctx.shadowColor = 'rgba(0,0,0,.4)'
    ctx.shadowBlur = 5
    ctx.shadowOffsetY = 2
    for (const [dy, r] of [[lato * .3, Math.max(2.5, lato * .09)], [lato * .1, Math.max(1.5, lato * .05)]]) {
      ctx.beginPath(); ctx.arc(cx - lato * .16, punta - dy + su, r, 0, 7); ctx.fill(); ctx.stroke()
    }
    const r = lato * .3
    ctx.beginPath()
    ctx.moveTo(x + r, y); ctx.arcTo(x + lato, y, x + lato, y + lato, r)
    ctx.arcTo(x + lato, y + lato, x, y + lato, r); ctx.arcTo(x, y + lato, x, y, r)
    ctx.arcTo(x, y, x + lato, y, r); ctx.closePath()
    ctx.fill(); ctx.stroke()
    ctx.restore()
    const largo = larghezzaDi(this.desidera.disegno)
    disegnaPixel(ctx, this.desidera.disegno, cx, y + lato * .86, Math.max(1, Math.floor(lato * .78 / largo)))
  }

  // Sopra lo sprite, dentro la stessa trasformazione (origine già all'angolo del riquadro).
  // Un addobbo che quel verso non conosce non si disegna (AGGANCI in dati/animali.js).
  // La taglia è in pixel dello sprite per la scala: un cappello resta della stessa misura a qualunque zoom.
  addosso(ctx, w, h, verso, fr, scala) {
    if (!this.addobbi.length) return
    const salto = ((this.bob || {})[verso] || [])[fr] || 0
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (const a of this.addobbi) {
      const punto = a.punti && a.punti[verso]
      if (!punto) continue
      // il cappello della festa è un disegno in pixel: la tesa poggia sulla testa, un filo sotto il punto
      if (a.disegno) {
        disegnaPixel(ctx, a.disegno, punto[0] * w, (punto[1] + salto) * h + 2 * scala,
                     scala * a.misura / larghezzaDi(a.disegno))
        continue
      }
      ctx.font = `${Math.max(6, Math.round(a.misura * scala))}px "Emoji Gioco", system-ui,sans-serif`
      ctx.fillText(a.testo, punto[0] * w, (punto[1] + salto) * h)
    }
    ctx.restore()
  }

  // Le barrette sopra la testa seguono l'attore; non sanno cosa rappresentino, lo decide chi le riempie.
  statistiche(ctx, x, y, larg) {
    const bis = this.bisogni
    if (!bis || !bis.length) return
    const w = Math.max(46, larg * 1.8), h = 5, passo = h + 3
    const x0 = Math.round(x - w / 2)
    let y0 = Math.round(y - bis.length * passo - 8)
    ctx.save()
    ctx.fillStyle = 'rgba(8,20,12,.72)'
    ctx.fillRect(x0 - 4, y0 - 4, w + 8, bis.length * passo + 6)
    for (const b of bis) {
      ctx.fillStyle = 'rgba(0,0,0,.45)'
      ctx.fillRect(x0, y0, w, h)
      ctx.fillStyle = b.colore
      ctx.fillRect(x0, y0, Math.round(w * Math.max(0, Math.min(1, b.valore))), h)
      y0 += passo
    }
    ctx.restore()
  }

  // Un invito, non un rimprovero: non succede niente se lo si ignora.
  fumetto(ctx, x, y, orologio, scala) {
    const s = 2 + Math.sin(orologio * 4) * 1.2
    ctx.save()
    ctx.font = `${Math.round(11 + scala * 2)}px "Emoji Gioco", system-ui,sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('💭', x, y - s)
    ctx.restore()
  }
}

export class Tela {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.vista = { x: 0, y: 0 }
    // Fin dove arriva il mondo: non è una costante, cresce comprando terra (fattoria.limiti lo rimette).
    this.mondo = { ...LIMITI_NUOVI }
    this.scala = SCALA_INIZIALE
    this.dpr = 1
    this.L = 0
    this.A = 0
    this.quadro = null
    this._raf = 0
    // Etichette effimere [{testo,x,y,nascita,durata}]: un testo posato su un punto del mondo che sale
    // e sbiadisce; questa classe non sa cosa ci sia scritto (come il fumetto riceve una faccia).
    this.etichette = []
    // Gli effetti del gesto (voli, sbuffi), i sobbalzi delle cose e le nuvolette: vivono e muoiono qui.
    this.effetti = []
    this.rimbalzi = new Map()
    this.nuvolette = []
    // L'atlante si carica una volta in background: drawImage prima che sia pronto è un no-op silenzioso.
    this.immagine = new Image()
    this.immagine.src = ATLANTE
  }

  /* ── misure ── */
  get cellaPx() { return T * this.scala }
  get latoPx() { return this.cellaPx * CELLE }

  // Il mondo in pixel schermo: non comincia da zero, cresce anche verso l'alto e verso sinistra.
  get riquadroMondo() {
    const lato = this.latoPx
    return { x: this.mondo.x0 * lato, y: this.mondo.y0 * lato,
             w: (this.mondo.x1 - this.mondo.x0 + 1) * lato,
             h: (this.mondo.y1 - this.mondo.y0 + 1) * lato }
  }

  // Si misura dal genitore, mai da sé: misurandosi da sé entra in un giro senza fondo se il CSS non ancora la tela.
  misura() {
    const casa = this.canvas.parentElement || this.canvas
    const r = casa.getBoundingClientRect()
    if (!r.width || !r.height) return false
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    if (Math.round(r.width) === this.L && Math.round(r.height) === this.A && dpr === this.dpr)
      return true
    this.L = Math.round(r.width); this.A = Math.round(r.height); this.dpr = dpr
    this.canvas.width = Math.round(this.L * dpr)
    this.canvas.height = Math.round(this.A * dpr)
    this.canvas.style.width = this.L + 'px'
    this.canvas.style.height = this.A + 'px'
    this.limita()
    return true
  }

  // Si stringe ATTORNO A UN PUNTO, non all'angolo: senza, pizzicare per ingrandire fa scattare la scena altrove.
  zoomA(voluta, ancoraX, ancoraY) {
    const nuova = Math.max(SCALA_MIN, Math.min(SCALA_MAX, Math.round(voluta)))
    if (nuova === this.scala) return
    const prima = {
      x: (ancoraX + this.vista.x) / this.cellaPx,
      y: (ancoraY + this.vista.y) / this.cellaPx,
    }
    this.scala = nuova
    this.vista.x = prima.x * this.cellaPx - ancoraX
    this.vista.y = prima.y * this.cellaPx - ancoraY
    this.limita()
  }

  // Se il mondo intero ci sta nello schermo, si centra invece di incollarsi in alto a sinistra.
  limita() {
    const r = this.riquadroMondo
    this.vista.x = Math.round(r.w <= this.L
      ? r.x + (r.w - this.L) / 2
      : Math.max(r.x, Math.min(this.vista.x, r.x + r.w - this.L)))
    this.vista.y = Math.round(r.h <= this.A
      ? r.y + (r.h - this.A) / 2
      : Math.max(r.y, Math.min(this.vista.y, r.y + r.h - this.A)))
  }

  // Math.floor e non |0: nel quadrante negativo troncare verso lo zero sbaglia di una cella.
  cellaDa(sx, sy) {
    return {
      x: Math.floor((sx + this.vista.x) / this.cellaPx),
      y: Math.floor((sy + this.vista.y) / this.cellaPx),
    }
  }

  // Il centro di una cella (non l'angolo, che cadrebbe in quella accanto): per chi una cella la sa già.
  puntoDellaCella(cx, cy) {
    return {
      x: (cx + .5) * this.cellaPx - this.vista.x,
      y: (cy + .5) * this.cellaPx - this.vista.y,
    }
  }

  // mostra() deposita il quadro; avvia() lo ridipinge a ogni fotogramma, anche se chi guida aggiorna più di rado.
  mostra(quadro) { this.quadro = quadro }

  // Un'etichetta effimera su un punto del mondo; y è dove comincia (la cima della testa, non i piedi).
  etichetta(testo, x, y, durata = ETICHETTA_DURATA) {
    this.etichette.push({ testo: String(testo), x, y, nascita: null, durata })
  }

  avvia() {
    if (this._raf) return
    const passo = () => { this._raf = requestAnimationFrame(passo); this.disegna(this.quadro) }
    this._raf = requestAnimationFrame(passo)
  }

  ferma() {
    cancelAnimationFrame(this._raf)
    this._raf = 0
  }

  // quadro: fattoria, attori, scelto (===), preso, anello {x,y,q}, orologio (l'unico che questa classe
  // usa), pennello {celle,materia,ok}, stagione, stagionali [{testo,x,y,misura,ondeggia?}],
  // bolla {punti,gettoni,lato,…} e mano {x,y,pezzo,testo,sopra,piega}
  // in pixel di schermo, già disposte da scena/bolla.js.
  disegna(quadro) {
    if (!quadro || !this.misura()) return
    this.quadro = quadro
    const { fattoria } = quadro
    const natale = quadro.stagione === 'natale'
    const ctx = this.ctx
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, this.L, this.A)

    this.disegnaPrato(natale)
    this.disegnaTerreno(fattoria)

    /* tutto quello che sta in scena, ordinato per quanto è avanti */
    const scena = []
    for (const k in fattoria.ostacoli) {
      const [x, y] = k.split(',').map(Number)
      const o = OSTACOLI[fattoria.ostacoli[k]]
      if (!o) continue          // un tipo che non esiste più: si salta, non si esplode
      if (!o) continue
      scena.push({ nome: o.pezzo, x, y, piede: o.piede, fondo: y + o.piede[1] })
    }
    // I fumetti si disegnano alla fine, sopra tutto: un campo è terreno e il suo cestino finirebbe dietro una casa.
    const fumetti = []
    for (const c of fattoria.cose) {
      if (quadro.preso && quadro.preso.da === c) continue   // è in mano, non per terra
      const v = PER_ID[c.id]; if (!v) continue
      // Come è messa questa cosa si chiede una volta ad assettoDi(); il verso non cambia col pezzo disegnato.
      const verso = assettoDi(c, v)
      let nome = verso.pezzo
      const piede = verso.piede
      if (v.anima) nome = v.anima[((quadro.orologio * 4) | 0) % v.anima.length]
      // Cosa c'è sopra questa cosa lo dice il mondo, non questa classe; un finto oggetto che non risponde si salta.
      const a = fattoria.aspettoDellaCosa ? fattoria.aspettoDellaCosa(c) : null
      // invece: certe cose cambiano faccia (un recinto ha sei disegni secondo l'ora, decisa dal mondo).
      if (a && a.invece) nome = a.invece
      // A Halloween un recinto prende il foglio vestito, se c'è il pezzo `<nome>_halloween` (docs/fattoria/stagioni.md).
      if (a && a.invece && quadro.stagione === 'halloween' && PEZZI[nome + '_halloween']) nome += '_halloween'
      scena.push({ nome, x: c.x, y: c.y, piede, cosa: c, sopra: a, verso,
                   fondo: v.sotto ? -1 : c.y + piede[1] })
      // Una coltura alta non è terreno: va in scena per conto suo, ordinata come un oggetto normale.
      if (a && a.sopra && a.alto)
        scena.push({ nome: a.sopra, x: c.x, y: c.y, piede, verso, fondo: c.y + piede[1] })
      // pronti: quanti pezzi aspettano in fila; il numerino va sul 🧺 da due in su.
      if (a && a.fumetto)
        fumetti.push({ x: c.x, y: c.y, piede, testo: a.fumetto,
                       pronti: a.pronti > 1 ? a.pronti : 0 })
      // "ho fame, voglio questo": fumetto con una faccia già decisa dal mondo, sopra tutto il resto.
      if (a && a.vuole) fumetti.push({ x: c.x, y: c.y, piede, vuole: a.vuole })
      // "sto facendo questo": stesso fumetto, con la clessidra nell'angolo.
      if (a && a.fa)
        fumetti.push({ x: c.x, y: c.y, piede, vuole: a.fa, attesa: true, pronti: a.pronti || 0 })
    }
    for (const a of quadro.attori || []) scena.push({ attore: a, fondo: a.corpo.y + 1 })
    scena.sort((a, b) => a.fondo - b.fondo)

    for (const e of scena) {
      if (e.attore) {
        e.attore.disegna(ctx, this.immagine, this.cellaPx, this.vista, quadro.orologio,
          e.attore === quadro.scelto)
        continue
      }
      // Il sobbalzo si fa sul fondo del piede: la cosa si schiaccia contro il prato, non nel vuoto.
      const molla = e.cosa ? this.molla(e.cosa, quadro.orologio) : null
      if (molla) {
        const bx = (e.x + e.piede[0] / 2) * this.cellaPx - this.vista.x
        const by = (e.y + e.piede[1]) * this.cellaPx - this.vista.y
        ctx.save()
        ctx.translate(bx, by); ctx.scale(molla.sx, molla.sy); ctx.translate(-bx, -by)
      }
      this.posa(e.nome, e.x, e.y, e.piede, null, e.verso)
      if (natale && e.cosa) this.imbianca(e, quadro.orologio)
      // quello che cresce si disegna qui solo se è basso: se è alto ha già una riga sua in scena
      if (e.sopra && e.sopra.sopra && !e.sopra.alto)
        this.posa(e.sopra.sopra, e.x, e.y, e.piede, null, e.verso)
      if (molla) ctx.restore()
      if (e.cosa && e.cosa === quadro.scelto)
        this.schiarisci(e.nome, e.x, e.y, e.piede, quadro.orologio, e.verso)
    }

    this.disegnaStagionali(quadro.stagionali, quadro.orologio)
    this.disegnaAtterraggio(quadro.preso)
    this.disegnaPennello(quadro.pennello)
    this.disegnaNebbia(fattoria)
    this.cartelli(fattoria, quadro.orologio)
    for (const f of fumetti)
      if (f.vuole) this.chiede(f, quadro.orologio)
      else this.fumetto(f, quadro.orologio)
    this.disegnaEtichette(quadro.orologio)
    if (natale) this.disegnaNeve(quadro.orologio)
    this.disegnaBolla(quadro.bolla, quadro.orologio)
    // sopra i gettoni: il «-2» nasce proprio dove stanno
    this.disegnaEffetti(quadro.orologio)
    this.disegnaNuvolette(quadro.orologio)
    this.disegnaAnello(quadro.anello)
    this.disegnaMano(quadro.mano, quadro.orologio)
  }

  // La neve: sopra tutto, davanti alla telecamera. Ogni fiocco è quattro numeri, nessun oggetto per fotogramma.
  disegnaNeve(orologio) {
    const ctx = this.ctx, L = this.L, A = this.A
    ctx.fillStyle = 'rgba(255,255,255,.85)'
    for (let i = 0; i < FIOCCHI_N; i++) {
      const b = i * 4
      let x = FIOCCHI[b] + Math.sin(orologio * .6 + i) * .012
      x -= Math.floor(x)
      let y = FIOCCHI[b + 1] + orologio * FIOCCHI[b + 2]
      y -= Math.floor(y)
      const r = FIOCCHI[b + 3]
      ctx.fillRect(x * L, y * A, r, r)
    }
  }

  // La neve appoggiata (una crosta bianca sul bordo alto) e le lucine (cose larghe o luci:true),
  // lampeggianti a coppie: non sa cos'è un tetto, sa solo che il disegno è alto.
  imbianca(e, orologio) {
    const p = PEZZI[e.nome]
    if (!p || p[3] < T * ALTO_PER_LA_NEVE) return
    const r = this.riquadroPosa(e.nome, e.x, e.y, e.piede, e.verso); if (!r) return
    if (r.x > this.L || r.y > this.A || r.x + r.w < 0 || r.y + r.h < 0) return
    const ctx = this.ctx
    const spessore = Math.max(3, Math.round(r.h * .11))
    ctx.fillStyle = 'rgba(255,255,255,.8)'
    tondo(ctx, r.x + r.w * .08, r.y + 1, r.w * .84, spessore, Math.min(4, spessore / 2))
    ctx.fill()
    const v = PER_ID[e.cosa.id]
    if (!v || !(v.luci || e.piede[0] >= 2)) return
    const passo = Math.max(5, 4 * this.scala), d = Math.max(2, Math.round(this.scala))
    const fase = ((orologio * 2) | 0) & 1
    const righe = v.luci ? 3 : 1
    for (let k = 0; k < righe; k++) {
      const y = Math.round(r.y + spessore + 1 + k * r.h * .22)
      let i = 0
      for (let x = r.x + r.w * .12; x < r.x + r.w * .88; x += passo, i++) {
        if ((i & 1) !== fase) continue
        ctx.fillStyle = (i >> 1) & 1 ? '#ff6b57' : '#ffe066'
        ctx.fillRect(Math.round(x + (k & 1) * passo / 2), y, d, d)
      }
    }
  }

  // Le emoji della stagione: x,y in celle (il centro), misura in pixel dello sprite come i cappelli.
  // Vanno dopo la scena e prima di quello che si tiene in mano: sono per terra, non in aria.
  disegnaStagionali(lista, orologio) {
    if (!lista || !lista.length) return
    const ctx = this.ctx
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (const s of lista) {
      const x = s.x * this.cellaPx - this.vista.x
      let y = s.y * this.cellaPx - this.vista.y
      if (x < -40 || y < -40 || x > this.L + 40 || y > this.A + 40) continue
      if (s.ondeggia) y += Math.sin(orologio * 3 + s.x) * 2
      ctx.font = `${Math.max(8, Math.round(s.misura * this.scala))}px "Emoji Gioco", system-ui,sans-serif`
      ctx.fillText(s.testo, x, y)
    }
    ctx.restore()
  }

  // Le etichette: sopra tutto, dopo attori e fumetti (un "+9" coperto da una casa è un premio che
  // nessuno ha visto). Sale e sbiadisce, si toglie da sola qui: nessun timer da fuori.
  disegnaEtichette(orologio) {
    if (!this.etichette.length) return
    const ctx = this.ctx
    const vive = []
    for (const e of this.etichette) {
      if (e.nascita == null) e.nascita = orologio
      const q = (orologio - e.nascita) / e.durata
      if (q >= 1) continue
      vive.push(e)
      const x = e.x * this.cellaPx - this.vista.x
      const y = e.y * this.cellaPx - this.vista.y - q * ETICHETTA_SALITA
      if (x < -60 || y < -40 || x > this.L + 60 || y > this.A + 40) continue
      const alfa = q < .5 ? 1 : 1 - (q - .5) * 2
      ctx.save()
      ctx.globalAlpha = Math.max(0, Math.min(1, alfa))
      ctx.font = `bold ${Math.round(15 + this.scala * 3)}px "Emoji Gioco", system-ui,sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.lineJoin = 'round'
      ctx.lineWidth = 4
      ctx.strokeStyle = 'rgba(8,20,12,.85)'
      ctx.strokeText(e.testo, x, y)
      ctx.fillStyle = '#ffe58a'
      ctx.fillText(e.testo, x, y)
      ctx.restore()
    }
    this.etichette = vive
  }

  // "Qui c'è qualcosa da fare", come il 💭 di una bestia affamata: galleggia piano, si nota con la coda dell'occhio.
  fumetto(f, orologio) {
    const ctx = this.ctx
    const su = Math.sin(orologio * 3 + f.x * .7) * 2
    const x = (f.x + f.piede[0] / 2) * this.cellaPx - this.vista.x
    const y = f.y * this.cellaPx - this.vista.y - 6 + su
    if (x < -40 || y < -40 || x > this.L + 40 || y > this.A + 40) return
    ctx.save()
    ctx.textAlign = 'center'
    ctx.font = `${Math.round(13 + this.scala * 3)}px "Emoji Gioco", system-ui,sans-serif`
    ctx.shadowColor = 'rgba(0,0,0,.55)'
    ctx.shadowBlur = 4
    ctx.fillText(f.testo, x, y)
    ctx.restore()
    ctx.textAlign = 'left'
    if (f.pronti) this.numerino(f.pronti, x + 9 + this.scala * 2, y - 12 - this.scala * 2,
                                Math.round(14 + this.scala * 3))
  }

  // Un tondino oro col numero: con la fila una macchina può avere pronti mentre lavora il prossimo.
  numerino(n, cx, cy, lato) {
    const ctx = this.ctx
    const vuoto = n === 0   // lo 0 si scrive, ma smorto: «non ne hai»
    const r = Math.max(7, lato / 2)
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, 7)
    ctx.fillStyle = vuoto ? '#e4dcc8' : '#ffd98a'
    ctx.strokeStyle = '#2a1c12'
    ctx.lineWidth = 2
    ctx.fill(); ctx.stroke()
    ctx.fillStyle = vuoto ? '#8a7a66' : '#2a1c12'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `700 ${Math.round(r * 1.25)}px "Emoji Gioco", system-ui,sans-serif`
    ctx.fillText(String(n), cx, cy + 1)
    ctx.restore()
  }

  // Il fumetto di cosa vuole un recinto, in pixel di schermo (non dipinto nello sprite) — vedi docs/fattoria/macchine.md.
  chiede(f, orologio) {
    const ctx = this.ctx
    const su = Math.sin(orologio * 3 + f.x * .7) * 2
    const lato = Math.round(16 + this.scala * 9)
    const cx = (f.x + f.piede[0] / 2) * this.cellaPx - this.vista.x
    // la punta sta sopra il bordo alto della cosa, come il 🧺
    const punta = f.y * this.cellaPx - this.vista.y - 2 + su
    if (cx < -lato * 2 || punta < -lato * 3 ||
        cx > this.L + lato * 2 || punta > this.A + lato * 2) return
    const x = Math.round(cx - lato / 2), y = Math.round(punta - lato - lato * .34)

    ctx.save()
    ctx.lineJoin = 'round'
    ctx.lineWidth = 2
    ctx.strokeStyle = '#2a1c12'
    ctx.fillStyle = '#faf6ec'
    ctx.shadowColor = 'rgba(0,0,0,.4)'
    ctx.shadowBlur = 5
    ctx.shadowOffsetY = 2
    // la codina prima del corpo: le due bollicine devono restare sotto il bordo del fumetto
    const r1 = Math.max(2.5, lato * .1), r2 = Math.max(1.5, lato * .06)
    for (const [dy, r] of [[lato * .34, r1], [lato * .1, r2]]) {
      ctx.beginPath()
      ctx.arc(cx - lato * .18, punta - dy, r, 0, 7)
      ctx.fill(); ctx.stroke()
    }
    tondo(ctx, x, y, lato, lato, Math.round(lato * .3))
    ctx.fill(); ctx.stroke()
    ctx.restore()

    // dentro: il disegno se c'è, se no l'emoji; l'ombra si spegne (si leggerebbe come sporco).
    const dentro = Math.round(lato * .78)
    const p = f.vuole.pezzo && PEZZI[f.vuole.pezzo]
    ctx.save()
    if (p) {
      const z = Math.min(dentro / p[2], dentro / p[3])
      const w = Math.round(p[2] * z), h = Math.round(p[3] * z)
      ctx.drawImage(this.immagine, p[0], p[1], p[2], p[3],
        Math.round(cx - w / 2), Math.round(y + (lato - h) / 2), w, h)
    } else {
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `${dentro}px "Emoji Gioco", system-ui,sans-serif`
      ctx.fillText(f.vuole.testo, cx, y + lato / 2 + 1)
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
    }
    // La clessidra distingue "sto facendo questo" da "voglio questo": stesso fumetto, stessa faccia dentro.
    if (f.attesa) {
      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `${Math.round(lato * .38)}px "Emoji Gioco", system-ui,sans-serif`
      ctx.fillText('⏳', x + lato - lato * .16, y + lato * .16)
      ctx.restore()
    }
    // i pronti stanno nell'angolo opposto alla clessidra: due notizie diverse, mai una sopra l'altra
    if (f.pronti) this.numerino(f.pronti, x + lato * .08, y + lato * .1, Math.round(lato * .5))
    ctx.restore()
  }

  // Il disegno crudo, all'angolo del riquadro girato: senza giro/specchio è un drawImage secco (il caso più
  // frequente); lo specchio si applica dentro il giro, cioè rovescia-poi-gira e non il contrario.
  pezzo(nome, sx, sy, alfa, verso) {
    const p = PEZZI[nome]; if (!p) return
    const ctx = this.ctx
    const w = p[2] * this.scala, h = p[3] * this.scala
    const giro = (verso && verso.giro) || 0
    const specchio = !!(verso && verso.specchio)
    if (alfa != null) ctx.globalAlpha = alfa
    if (!giro && !specchio) {
      ctx.drawImage(this.immagine, p[0], p[1], p[2], p[3],
        Math.round(sx), Math.round(sy), w, h)
    } else {
      // il centro del riquadro girato: a un quarto e tre quarti larghezza e altezza si scambiano
      ctx.save()
      ctx.translate(Math.round(sx) + (giro % 2 ? h : w) / 2,
                    Math.round(sy) + (giro % 2 ? w : h) / 2)
      if (giro) ctx.rotate(giro * Math.PI / 2)
      if (specchio) ctx.scale(-1, 1)
      ctx.drawImage(this.immagine, p[0], p[1], p[2], p[3], -w / 2, -h / 2, w, h)
      ctx.restore()
    }
    if (alfa != null) ctx.globalAlpha = 1
  }

  // Uno sprite si appoggia col FONDO sul fondo del suo piede. riquadroPosa dice dove finisce
  // davvero, diverso da dove appoggia (un silo è alto tre volte il suo piede).
  riquadroPosa(nome, cx, cy, piede, verso) {
    const p = PEZZI[nome]; if (!p) return null
    // Da girato lo sprite scambia le sue misure: va fatto qui, perché serve anche a sapere cos'ha
    // sotto il dito (Gioco.vue). Lo specchio invece non lo tocca.
    const giro = (verso && verso.giro) || 0
    const w = (giro % 2 ? p[3] : p[2]) * this.scala
    const h = (giro % 2 ? p[2] : p[3]) * this.scala
    return {
      x: cx * this.cellaPx - this.vista.x + (piede[0] * this.cellaPx - w) / 2,
      y: (cy + piede[1]) * this.cellaPx - this.vista.y - h,
      w, h,
    }
  }

  posa(nome, cx, cy, piede, alfa, verso) {
    const r = this.riquadroPosa(nome, cx, cy, piede, verso); if (!r) return
    this.pezzo(nome, r.x, r.y, alfa, verso)
  }

  // Le celle visibili con un margine di una: la stessa domanda se la pongono prato e acqua.
  celleVisibili() {
    const cellaPx = this.cellaPx
    const m = celleDi(this.mondo)
    const c0x = Math.max(m.cx0, Math.floor(this.vista.x / cellaPx) - 1)
    const c0y = Math.max(m.cy0, Math.floor(this.vista.y / cellaPx) - 1)
    const c1x = Math.min(m.cx1, c0x + ((this.L / cellaPx) | 0) + 3)
    const c1y = Math.min(m.cy1, c0y + ((this.A / cellaPx) | 0) + 3)
    return { c0x, c0y, c1x, c1y }
  }

  disegnaPrato(neve = false) {
    const cellaPx = this.cellaPx
    const { c0x, c0y, c1x, c1y } = this.celleVisibili()
    for (let cx = c0x; cx < c1x; cx++)
      for (let cy = c0y; cy < c1y; cy++) {
        const e = ERBE[((caso(cx, cy, 7) * 100) | 0) % ERBE.length]
        this.pezzo(e, cx * cellaPx - this.vista.x, cy * cellaPx - this.vista.y)
      }
    if (neve) this.innevaIlPrato(c0x, c0y, c1x, c1y)
  }

  // Macchie bianche a chiazze (non un manto uniforme, che coprirebbe fiori e bordi), sopra il prato.
  innevaIlPrato(c0x, c0y, c1x, c1y) {
    const ctx = this.ctx, cellaPx = this.cellaPx
    ctx.fillStyle = 'rgba(255,255,255,.62)'
    for (let cx = c0x; cx < c1x; cx++)
      for (let cy = c0y; cy < c1y; cy++) {
        const q = caso(cx, cy, 13)
        if (q > .34) continue
        const x = cx * cellaPx - this.vista.x, y = cy * cellaPx - this.vista.y
        ctx.beginPath()
        ctx.ellipse(x + cellaPx * (.3 + q), y + cellaPx * (.35 + q * .6),
                    cellaPx * (.3 + q * .4), cellaPx * (.18 + q * .3), 0, 0, 7)
        ctx.fill()
      }
  }

  // Il terreno si dipinge sopra il prato e prima della scena, come le voci sotto:true — vedi motore/fattoria.js.
  disegnaTerreno(fattoria) {
    const cellaPx = this.cellaPx
    const { c0x, c0y, c1x, c1y } = this.celleVisibili()
    const materiaDi = (x, y) => fattoria.materiaDi(x, y)
    for (let cx = c0x; cx < c1x; cx++)
      for (let cy = c0y; cy < c1y; cy++) {
        const nome = tesseraDi(materiaDi, cx, cy)
        if (!nome) continue
        this.pezzo(nome, cx * cellaPx - this.vista.x, cy * cellaPx - this.vista.y)
      }
  }

  // Il selvatico è lo stesso prato al buio: il confine è netto (una sfumatura mentirebbe su dove passa).
  disegnaNebbia(fattoria) {
    const ctx = this.ctx, lato = this.latoPx
    for (let px = this.mondo.x0; px <= this.mondo.x1; px++)
      for (let py = this.mondo.y0; py <= this.mondo.y1; py++) {
        if (fattoria.mia(px, py)) continue
        const x = px * lato - this.vista.x, y = py * lato - this.vista.y
        if (x > this.L || y > this.A || x + lato < 0 || y + lato < 0) continue
        ctx.fillStyle = fattoria.comprabile(px, py) ? 'rgba(10,26,18,.34)' : 'rgba(10,26,18,.62)'
        ctx.fillRect(x, y, lato, lato)
      }
  }

  // Quello che si compra è esattamente il riquadro tratteggiato: nessuna sorpresa su quanto viene.
  cartelli(fattoria, orologio) {
    const ctx = this.ctx, lato = this.latoPx
    const prezzo = fattoria.prezzoDellaProssima
    const posso = fattoria.borsa.quante() >= prezzo
    ctx.textAlign = 'center'
    ctx.lineJoin = 'round'
    for (let px = this.mondo.x0; px <= this.mondo.x1; px++)
      for (let py = this.mondo.y0; py <= this.mondo.y1; py++) {
        if (!fattoria.comprabile(px, py)) continue
        const x = px * lato - this.vista.x, y = py * lato - this.vista.y
        if (x > this.L || y > this.A || x + lato < 0 || y + lato < 0) continue

        ctx.save()
        ctx.setLineDash([9, 7])
        ctx.lineDashOffset = -orologio * 14      // il tratteggio cammina piano
        ctx.lineWidth = 3
        ctx.strokeStyle = posso ? 'rgba(255,224,138,.95)' : 'rgba(255,255,255,.42)'
        ctx.strokeRect(x + 2, y + 2, lato - 4, lato - 4)
        ctx.restore()

        const cx = x + lato / 2, cy = y + lato / 2
        const pc = PEZZI.cartello
        this.pezzo('cartello', cx - pc[2] * this.scala / 2, cy - pc[3] * this.scala + 14)
        // La monetina sopra e il numero sotto: un numero nudo nel bosco non dice cosa costa.
        ctx.font = `${8 + this.scala * 2}px "Emoji Gioco", system-ui,sans-serif`
        ctx.fillText('🪙', cx, cy - 3 - this.scala)
        ctx.font = `700 ${9 + this.scala * 3}px "Emoji Gioco", system-ui,sans-serif`
        ctx.fillStyle = posso ? '#3a2a12' : '#7a2a2a'
        ctx.fillText(String(prezzo), cx, cy + 9 + this.scala * 2)
      }
    ctx.textAlign = 'left'
  }

  // Un oggetto selezionato si schiarisce E prende un contorno; la schiaritura passa da posa() e non
  // ricopia il conto, se no un pezzo girato mostrerebbe l'alone sfalsato di novanta gradi.
  schiarisci(nome, cx, cy, piede, orologio, verso) {
    if (!PEZZI[nome]) return
    const ctx = this.ctx
    const battito = .16 + .12 * (1 + Math.sin(orologio * 5)) / 2
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    this.posa(nome, cx, cy, piede, battito, verso)
    ctx.restore()
    ctx.save()
    ctx.setLineDash([5, 4])
    ctx.lineDashOffset = -orologio * 12
    ctx.lineWidth = 2
    ctx.strokeStyle = 'rgba(255,255,255,.85)'
    ctx.strokeRect(cx * this.cellaPx - this.vista.x + 1, cy * this.cellaPx - this.vista.y + 1,
      piede[0] * this.cellaPx - 2, piede[1] * this.cellaPx - 2)
    ctx.restore()
  }

  // Dove finirebbe se si lascia adesso: il riquadro dice se ci sta, lo sprite in trasparenza come
  // verrebbe. preso porta piede e pezzo già decisi, come tutto il quadro.
  disegnaAtterraggio(preso) {
    if (!preso || preso.cx == null) return
    const { cx, cy, ok } = preso
    const piede = preso.piede || [1, 1]
    const ctx = this.ctx
    const x = cx * this.cellaPx - this.vista.x, y = cy * this.cellaPx - this.vista.y
    ctx.save()
    ctx.fillStyle = ok ? 'rgba(140,220,120,.28)' : 'rgba(220,110,110,.32)'
    ctx.fillRect(x, y, piede[0] * this.cellaPx, piede[1] * this.cellaPx)
    ctx.lineWidth = 2
    ctx.strokeStyle = ok ? 'rgba(180,255,160,.9)' : 'rgba(255,150,150,.9)'
    ctx.strokeRect(x + 1, y + 1, piede[0] * this.cellaPx - 2, piede[1] * this.cellaPx - 2)
    ctx.restore()
    if (preso.pezzo) this.posa(preso.pezzo, cx, cy, piede, ok ? .85 : .45, preso.verso)
  }

  /* ── i gettoni, la mano e gli effetti del gesto (vedi docs/fattoria/come-si-tocca.md) ──
     Arrivano già decisi da Gioco.vue (dove, cosa, se spento): qui solo come si vedono e si muovono. */

  // Una cosa sobbalza: si schiaccia e si allunga sul suo fondo, come una molla (semina, ricetta, arrivo).
  rimbalza(cosa) { if (cosa) this.rimbalzi.set(cosa, { nascita: null }) }

  // Uno sbuffo di terra, in celle del mondo.
  sbuffo(x, y, colore = '#8a5a32') {
    const pezzetti = Array.from({ length: 9 }, (_, i) => ({
      a: i / 9 * Math.PI * 2 + caso(i, Math.round(x * 10), 31) * .6,
      v: .6 + caso(i, Math.round(y * 10), 32) * .7 }))
    this.effetti.push({ tipo: 'sbuffo', x, y, colore, pezzetti, nascita: null, durata: .5 })
  }

  // Una merce che vola da un punto a un altro del mondo (dal campo al silo); arrivata, fa sobbalzare arriva.
  // aSchermo invece di a: la meta è un punto dello schermo (l'angolo dove va quello che si raccoglie).
  vola({ pezzo = null, testo = '', da, a = null, aSchermo = null, arriva = null, ritardo = 0, durata = .75 }) {
    this.effetti.push({ tipo: 'vola', pezzo, testo, da, a, aSchermo, arriva, ritardo, durata, nascita: null })
  }

  // Quello che si è usato: la figura col suo «-2» sopra la macchina, che sale e svanisce piano.
  consuma({ pezzo = null, testo = '', numero, x, y, ritardo = 0 }) {
    this.effetti.push({ tipo: 'consuma', pezzo, testo, numero, x, y, ritardo, durata: 1.4, nascita: null })
  }

  // Una nuvoletta che parla sopra una cosa: il no detto dove è successo, non in cima allo schermo.
  // merci: [{ quanti, pezzo, testo }] dopo la frase, col loro disegno — mai l'emoji dove c'è una figura
  // (il becchime è un sacchetto, la sua emoji una castagna).
  nuvoletta(testo, x, y, { durata = 2.6, merci = [] } = {}) {
    // una sola per volta nello stesso punto: la seconda prende il posto della prima
    this.nuvolette = this.nuvolette.filter(n => Math.hypot(n.x - x, n.y - y) > 1)
    this.nuvolette.push({ testo: String(testo), merci, x, y, nascita: null, durata })
  }

  // Il sobbalzo di questa cosa adesso, o null: squash e stretch che si spengono in quattro decimi.
  molla(cosa, orologio) {
    const r = this.rimbalzi.get(cosa)
    if (!r) return null
    if (r.nascita == null) r.nascita = orologio
    const q = (orologio - r.nascita) / .42
    if (q >= 1) { this.rimbalzi.delete(cosa); return null }
    const a = Math.sin(q * Math.PI * 3) * (1 - q) * .16
    return { sx: 1 + a * .7, sy: 1 - a }
  }

  // La figura di una merce dentro un quadrato di lato dato, centrata: il disegno se c'è, l'emoji se no.
  faccia(pezzo, testo, cx, cy, lato, alfa = 1) {
    const ctx = this.ctx
    const p = pezzo && PEZZI[pezzo]
    ctx.save()
    ctx.globalAlpha *= alfa
    if (p) {
      const z = Math.min(lato / p[2], lato / p[3])
      const w = p[2] * z, h = p[3] * z
      ctx.drawImage(this.immagine, p[0], p[1], p[2], p[3], cx - w / 2, cy - h / 2, w, h)
    } else if (testo) {
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `${Math.round(lato * .86)}px "Emoji Gioco", system-ui,sans-serif`
      ctx.fillText(testo, cx, cy + 1)
    }
    ctx.restore()
  }

  disegnaBolla(b, orologio) {
    if (!b) return
    const ctx = this.ctx
    if (b.nascita == null) b.nascita = orologio
    const t = orologio - b.nascita
    if (b.attesa) this.attesa(b.attesa, t)
    if (b.fila) this.filetta(b.fila, t, orologio)
    const lato = b.lato
    b.gettoni.forEach((g, i) => {
      const p = b.punti[i]
      const s = rimbalzello(Math.max(0, Math.min(1, (t - i * .045) / .26)))
      if (s <= 0) return
      const su = Math.sin(orologio * 2.6 + i * 1.3) * 1.6
      ctx.save()
      ctx.translate(p.x, p.y + su)
      ctx.scale(s, s)
      ctx.shadowColor = 'rgba(0,0,0,.35)'
      ctx.shadowBlur = 6
      ctx.shadowOffsetY = 3
      ctx.beginPath()
      ctx.arc(0, 0, lato / 2, 0, Math.PI * 2)
      ctx.fillStyle = g.preso ? 'rgba(250,246,236,.45)' : g.spento ? '#d9d2c2' : '#faf6ec'
      ctx.fill()
      ctx.shadowColor = 'transparent'
      ctx.lineWidth = g.colmo ? 3.5 : 2.5
      ctx.strokeStyle = g.colmo ? '#e8b64c' : '#2a1c12'
      ctx.stroke()
      if (g.preso) {
        ctx.setLineDash([4, 4])
        ctx.lineWidth = 2
        ctx.strokeStyle = 'rgba(42,28,18,.5)'
        ctx.beginPath(); ctx.arc(0, 0, lato / 2 - 6, 0, Math.PI * 2); ctx.stroke()
      } else {
        this.faccia(g.pezzo, g.testo, 0, 0, lato * .72, g.spento ? .45 : 1)
      }
      ctx.restore()
      if (g.hai != null && !g.preso && s > .9)
        this.numerino(g.hai, p.x + lato * .36, p.y + su - lato * .36, 22)
    })
    if (b.pagine) this.pagine(b.pagine, rimbalzello(Math.max(0, Math.min(1, t / .3))))
    if (b.dettaglio) this.dettaglio(b.dettaglio, lato)
  }

  // Quanto manca a un campo che cresce: una targhetta sopra, con la barra.
  attesa(a, t) {
    const ctx = this.ctx
    const s = rimbalzello(Math.min(1, t / .26))
    const w = 140, h = 40
    ctx.save()
    ctx.translate(a.x, a.y)
    ctx.scale(s, s)
    this.targhetta(-w / 2, -h / 2, w, h)
    this.faccia(a.pezzo, a.testo, -w / 2 + 22, 0, 30)
    ctx.fillStyle = '#d9cfb8'
    tondo(ctx, -w / 2 + 42, -5, 50, 10, 5); ctx.fill()
    ctx.fillStyle = '#7fbf5f'
    tondo(ctx, -w / 2 + 42, -5, Math.max(10, 50 * a.quanto), 10, 5); ctx.fill()
    ctx.fillStyle = '#2a1c12'
    ctx.font = '700 15px "Emoji Gioco", system-ui,sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(a.testoMinuti, -w / 2 + 98, 1)
    ctx.restore()
  }

  // Le pagine dei gettoni: due tasti gialli con le punte doppie ai lati, i pallini in mezzo.
  pagine(pg, s) {
    if (s <= 0) return
    const ctx = this.ctx
    for (const [punto, verso] of [[pg.indietro, -1], [pg.avanti, 1]]) {
      ctx.save()
      ctx.translate(punto.x, punto.y)
      ctx.scale(s, s)
      ctx.shadowColor = 'rgba(0,0,0,.35)'
      ctx.shadowBlur = 5
      ctx.shadowOffsetY = 3
      ctx.beginPath()
      ctx.arc(0, 0, pg.lato / 2, 0, Math.PI * 2)
      ctx.fillStyle = '#f2c230'
      ctx.fill()
      ctx.shadowColor = 'transparent'
      ctx.lineWidth = 2.5
      ctx.strokeStyle = '#8a5a12'
      ctx.stroke()
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = '#fffbe8'
      for (const dx of [-5, 4]) {
        ctx.beginPath()
        ctx.moveTo((dx - 3) * verso, -7)
        ctx.lineTo((dx + 3) * verso, 0)
        ctx.lineTo((dx - 3) * verso, 7)
        ctx.stroke()
      }
      ctx.restore()
    }
    const passo = 14
    for (let i = 0; i < pg.totale; i++) {
      const x = pg.cx + (i - (pg.totale - 1) / 2) * passo
      ctx.beginPath()
      ctx.arc(x, pg.y, i === pg.pagina ? 5 : 4, 0, Math.PI * 2)
      ctx.fillStyle = i === pg.pagina ? '#faf6ec' : 'rgba(250,246,236,.35)'
      ctx.fill()
      ctx.lineWidth = 1.5
      ctx.strokeStyle = 'rgba(42,28,18,.8)'
      ctx.stroke()
    }
  }

  // La fila di una macchina, sotto di lei: pronti in oro che saltellano, chi lavora con l'anello che si
  // chiude, chi aspetta sbiadito, i posti vuoti tratteggiati e il «+» col prezzo sotto.
  filetta(f, t, orologio) {
    const ctx = this.ctx
    const d = f.lato
    f.posti.forEach((p, i) => {
      const s = rimbalzello(Math.max(0, Math.min(1, (t - .1 - i * .04) / .24)))
      if (s <= 0) return
      const x = f.punti[i].x
      const y = f.punti[i].y + (p.come === 'pronto' ? Math.sin(orologio * 6 + i) * 2.5 : 0)
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(s, s)
      ctx.beginPath()
      ctx.arc(0, 0, d / 2, 0, Math.PI * 2)
      if (p.come === 'vuoto' || p.come === 'piu') {
        ctx.setLineDash([4, 3])
        ctx.lineWidth = 2.5
        ctx.strokeStyle = 'rgba(250,246,236,.9)'
        ctx.fillStyle = 'rgba(13,22,15,.3)'
        ctx.fill(); ctx.stroke()
        if (p.come === 'piu') {
          ctx.setLineDash([])
          ctx.fillStyle = '#faf6ec'
          ctx.font = '700 24px "Emoji Gioco", system-ui,sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('+', 0, 1)
          ctx.font = '700 13px "Emoji Gioco", system-ui,sans-serif'
          ctx.lineWidth = 3
          ctx.strokeStyle = 'rgba(8,20,12,.85)'
          ctx.strokeText('🪙' + p.prezzo, 0, d / 2 + 11)
          ctx.fillStyle = '#ffe58a'
          ctx.fillText('🪙' + p.prezzo, 0, d / 2 + 11)
        }
      } else {
        ctx.shadowColor = 'rgba(0,0,0,.3)'
        ctx.shadowBlur = 4
        ctx.shadowOffsetY = 2
        ctx.fillStyle = p.come === 'pronto' ? '#ffd98a' : '#faf6ec'
        ctx.fill()
        ctx.shadowColor = 'transparent'
        ctx.lineWidth = 2
        ctx.strokeStyle = '#2a1c12'
        ctx.stroke()
        if (p.come === 'lavora') {
          ctx.lineWidth = 3.5
          ctx.strokeStyle = '#e0a33c'
          ctx.beginPath()
          ctx.arc(0, 0, d / 2 - 1, -Math.PI / 2, -Math.PI / 2 + p.quanto * Math.PI * 2)
          ctx.stroke()
        }
        this.faccia(p.pezzo, p.testo, 0, 0, d * .68, p.come === 'aspetta' ? .5 : 1)
      }
      ctx.restore()
    })
  }

  // Il gettone tenuto o toccato, per esteso: cosa prende (caselle accese o in ombra), cosa esce, e in
  // parole quanto ne hai, quanto ci mette e quanto costa — i numeri nudi sopra i gettoni non si capivano.
  dettaglio(d, lato) {
    const ctx = this.ctx
    const q = 34, gap = 5
    ctx.save()
    ctx.font = '700 15px "Emoji Gioco", system-ui,sans-serif'
    const pezzi = [
      ...d.caselle.map(c => ({ casella: c, w: q })),
      ...(d.caselle.length ? [{ testo: '→', w: 22, grande: true }] : []),
      { faccia: d.esce, w: q },
      ...d.parole.map(t => ({ testo: t, w: ctx.measureText(t).width + 6 })),
    ]
    const w = pezzi.reduce((t, p) => t + p.w + gap, 0) + 14
    const h = q + 16
    const x = Math.max(6, Math.min(this.L - w - 6, d.x - w / 2))
    const y = d.sotto ? d.y + lato * .62 : d.y - lato * .62 - h
    this.targhetta(x, y, w, h)
    let cx = x + 9
    ctx.textBaseline = 'middle'
    for (const p of pezzi) {
      const mezzo = cx + p.w / 2
      if (p.casella) {
        const c = p.casella
        ctx.beginPath()
        ctx.arc(mezzo, y + h / 2, q / 2, 0, Math.PI * 2)
        ctx.fillStyle = c.piena ? '#e6f3d8' : '#e9e2d2'
        ctx.fill()
        if (!c.piena) {
          ctx.setLineDash([3, 3]); ctx.lineWidth = 1.5; ctx.strokeStyle = '#a89c84'; ctx.stroke()
          ctx.setLineDash([])
        }
        this.faccia(c.pezzo, c.testo, mezzo, y + h / 2, q * .78, c.piena ? 1 : .3)
      } else if (p.faccia) {
        this.faccia(p.faccia.pezzo, p.faccia.testo, mezzo, y + h / 2, q * .9)
      } else {
        ctx.fillStyle = '#2a1c12'
        ctx.textAlign = 'center'
        ctx.font = p.grande ? '700 19px "Emoji Gioco", system-ui,sans-serif' : '700 15px "Emoji Gioco", system-ui,sans-serif'
        ctx.fillText(p.testo, mezzo, y + h / 2 + 1)
      }
      cx += p.w + gap
    }
    ctx.restore()
  }

  // Il fondo crema col bordo scuro, lo stesso del fumetto dei recinti: è il «parla il gioco» della fattoria.
  targhetta(x, y, w, h) {
    const ctx = this.ctx
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,.35)'
    ctx.shadowBlur = 6
    ctx.shadowOffsetY = 2
    ctx.fillStyle = '#faf6ec'
    tondo(ctx, x, y, w, h, 12)
    ctx.fill()
    ctx.shadowColor = 'transparent'
    ctx.lineWidth = 2
    ctx.strokeStyle = '#2a1c12'
    ctx.stroke()
    ctx.restore()
  }

  // Il gettone in mano: sopra il dito (che lo coprirebbe), e per terra un'ombra che dice dove lavora.
  disegnaMano(m, orologio) {
    if (!m) return
    const ctx = this.ctx
    ctx.save()
    ctx.beginPath()
    ctx.ellipse(m.x, m.y, m.sopra ? 20 : 15, m.sopra ? 9 : 7, 0, 0, Math.PI * 2)
    ctx.fillStyle = m.sopra ? 'rgba(180,255,160,.55)' : 'rgba(0,0,0,.28)'
    ctx.fill()
    ctx.translate(m.x, m.y - 48)
    ctx.rotate(m.piega || 0)
    const s = m.sopra ? 1.22 : 1.06 + Math.sin(orologio * 9) * .03
    ctx.scale(s, s)
    ctx.shadowColor = 'rgba(0,0,0,.45)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetY = 6
    this.faccia(m.pezzo, m.testo, 0, 0, 56)
    ctx.restore()
  }

  disegnaEffetti(orologio) {
    const ctx = this.ctx, px = this.cellaPx
    const vivi = []
    for (const e of this.effetti) {
      if (e.nascita == null) e.nascita = orologio
      const q = (orologio - e.nascita - (e.ritardo || 0)) / e.durata
      if (q >= 1) { if (e.arriva) this.rimbalza(e.arriva); continue }
      vivi.push(e)
      if (q < 0) continue
      if (e.tipo === 'sbuffo') {
        const x = e.x * px - this.vista.x, y = e.y * px - this.vista.y
        ctx.save()
        ctx.globalAlpha = 1 - q
        ctx.fillStyle = e.colore
        const l = Math.max(2, Math.round(this.scala * 1.5))
        for (const p of e.pezzetti) {
          const r = (6 + 22 * p.v) * Math.sqrt(q) * this.scala / 2
          ctx.fillRect(Math.round(x + Math.cos(p.a) * r), Math.round(y + Math.sin(p.a) * r * .6 - q * 8), l, l)
        }
        ctx.restore()
      } else if (e.tipo === 'vola') {
        const k = q < .5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2
        const x0 = e.da.x * px - this.vista.x, y0 = e.da.y * px - this.vista.y
        const meta = e.aSchermo || { x: e.a.x * px - this.vista.x, y: e.a.y * px - this.vista.y }
        const x = x0 + (meta.x - x0) * k
        const y = y0 + (meta.y - y0) * k - Math.sin(Math.PI * q) * 70
        const lato = 30 * (1 + Math.sin(Math.PI * q) * .35) * (q > .85 ? (1 - q) / .15 * .6 + .4 : 1)
        this.faccia(e.pezzo, e.testo, x, y, lato)
      } else if (e.tipo === 'consuma') {
        const x = e.x * px - this.vista.x
        const y = e.y * px - this.vista.y - 8 - q * 46
        const alfa = q < .15 ? q / .15 : q > .55 ? 1 - (q - .55) / .45 : 1
        ctx.save()
        ctx.globalAlpha = Math.max(0, alfa)
        this.faccia(e.pezzo, e.testo, x - 10, y, 34)
        ctx.font = '800 20px "Emoji Gioco", system-ui,sans-serif'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.lineJoin = 'round'
        ctx.lineWidth = 4
        ctx.strokeStyle = 'rgba(8,20,12,.85)'
        ctx.strokeText('-' + e.numero, x + 10, y + 2)
        ctx.fillStyle = '#fff'
        ctx.fillText('-' + e.numero, x + 10, y + 2)
        ctx.restore()
      }
    }
    this.effetti = vivi
  }

  disegnaNuvolette(orologio) {
    if (!this.nuvolette.length) return
    const ctx = this.ctx, px = this.cellaPx
    const vive = []
    for (const n of this.nuvolette) {
      if (n.nascita == null) n.nascita = orologio
      const t = orologio - n.nascita
      if (t >= n.durata) continue
      vive.push(n)
      ctx.save()
      ctx.font = '700 16px "Emoji Gioco", system-ui,sans-serif'
      const FACCIA = 26
      const pezzi = n.merci.map(m => ({ ...m, numero: String(m.quanti), largo: ctx.measureText(String(m.quanti)).width }))
      const coda = pezzi.reduce((t, m) => t + 8 + m.largo + 3 + FACCIA, 0)
      const frase = ctx.measureText(n.testo).width
      const w = Math.min(this.L - 16, frase + coda + 28), h = 38
      const cx = Math.max(8 + w / 2, Math.min(this.L - 8 - w / 2, n.x * px - this.vista.x))
      const y = Math.max(8, n.y * px - this.vista.y - h - 12)
      const s = rimbalzello(Math.min(1, t / .22))
      ctx.globalAlpha = t > n.durata - .3 ? (n.durata - t) / .3 : 1
      ctx.translate(cx, y + h)
      ctx.scale(s, s)
      this.targhetta(-w / 2, -h, w, h)
      ctx.fillStyle = '#faf6ec'
      ctx.strokeStyle = '#2a1c12'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(-7, -1); ctx.lineTo(0, 9); ctx.lineTo(7, -1)
      ctx.fill(); ctx.stroke()
      ctx.fillRect(-6, -4, 12, 4)
      ctx.fillStyle = '#2a1c12'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      let penna = -(frase + coda) / 2
      ctx.fillText(n.testo, penna, -h / 2 + 1, w - 14)
      penna += frase
      for (const m of pezzi) {
        penna += 8
        ctx.fillText(m.numero, penna, -h / 2 + 1)
        penna += m.largo + 3
        this.faccia(m.pezzo, m.testo, penna + FACCIA / 2, -h / 2, FACCIA)
        penna += FACCIA
      }
      ctx.restore()
    }
    this.nuvolette = vive
  }

  // Come disegnaAtterraggio ma per il pennello: celle sparse, non un piede rettangolare, colorate
  // una per una. Il colore segue la materia solo quando ok è vero; il rosso di "non si può" è sempre uguale.
  disegnaPennello(pennello) {
    if (!pennello || !pennello.celle || !pennello.celle.size) return
    const ctx = this.ctx, cellaPx = this.cellaPx
    const [r, g, b] = pennello.ok
      ? (COLORE_MATERIA[pennello.materia] || COLORE_MATERIA['*'])
      : [220, 110, 110]
    ctx.save()
    ctx.fillStyle = `rgba(${r},${g},${b},.30)`
    ctx.strokeStyle = `rgba(${r},${g},${b},.92)`
    ctx.lineWidth = 2
    for (const k of pennello.celle) {
      const [cx, cy] = k.split(',').map(Number)
      const x = cx * cellaPx - this.vista.x, y = cy * cellaPx - this.vista.y
      ctx.fillRect(x, y, cellaPx, cellaPx)
      ctx.strokeRect(x + 1, y + 1, cellaPx - 2, cellaPx - 2)
    }
    ctx.restore()
  }

  // L'anello che si riempie mentre si tiene premuto: q (0..1) arriva già calcolato da chi tiene la
  // pressione. pronto vuol dire agganciato: cambia tinta (verde di "si può") e si allarga.
  disegnaAnello(anello) {
    if (!anello) return
    // Frazione nulla o negativa: l'attesa non si mostra ancora, se no direbbe "tieni premuto" ovunque.
    if (!anello.pronto && anello.q <= 0) return
    const ctx = this.ctx, r = anello.pronto ? 23 : 20
    const q = anello.pronto ? 1 : Math.max(0, Math.min(1, anello.q))
    ctx.save()
    ctx.lineWidth = 4
    ctx.strokeStyle = 'rgba(0,0,0,.35)'
    ctx.beginPath(); ctx.arc(anello.x, anello.y, r, 0, Math.PI * 2); ctx.stroke()
    ctx.strokeStyle = anello.pronto ? 'rgba(180,255,160,.9)' : 'rgba(255,224,138,.95)'
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(anello.x, anello.y, r, -Math.PI / 2, -Math.PI / 2 + q * Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }
}
