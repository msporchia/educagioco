/* ═════ IL CAVALIERE ═════
   L'eroe. Argento e azzurro, spalle larghe, e sopra l'elmo una cresta
   rossa che è la cosa che si vede per prima da lontano: fra tutti è
   l'unico che ha qualcosa di **acceso in cima**. */
import { mescola, capsula, poligono, tondo } from '../comune.js'
import { occhi } from '../segni.js'

/* ─────────── il secondo livello ───────────
   Quello che distingue «una forma con un colore dentro» da «un
   oggetto fatto da qualcuno». Sono tutti pezzi da mezzo pixel, e
   messi uno per uno non si notano: è la loro somma che l'occhio legge
   come fattura. */

/* i chiodi lungo un arco: il bordo dello scudo è tenuto da qualcosa,
   e sono loro a dirlo */
function chiodi(q, x, y, rx, ry, quanti, s, C) {
  for (let i = 0; i < quanti; i++) {
    const a = (i / quanti) * 6.2832 - 1.57
    tondo(q, x + Math.cos(a) * rx, y + Math.sin(a) * ry, 0.34 * s, 0.34 * s,
          mescola(C.ferro, '#ffffff', 0.35))
    tondo(q, x + Math.cos(a) * rx, y + Math.sin(a) * ry + 0.16 * s, 0.2 * s, 0.2 * s,
          mescola(C.ferro, '#000000', 0.4))
  }
}

/* un graffio: la traccia che il ferro porta addosso dopo che è stato
   usato. Sempre negli stessi posti — è una firma, non del caso */
function graffio(q, x, y, l, ang, s, col) {
  const c = q.ctx
  c.save(); c.translate(x, y); c.rotate(ang)
  c.strokeStyle = col; c.lineWidth = 0.24 * s; c.lineCap = 'round'
  c.beginPath(); c.moveTo(-l / 2, 0); c.lineTo(l / 2, -0.3 * s); c.stroke()
  c.restore()
}

export const CAVALIERE = {
  spalle: 5.4, taglia: 1,
  /* DI CHE COSA È FATTO. Solo quello che **non** è liscio: la
     sopravveste è panno, gli stivali e le brache sono cuoio. La
     corazza, l'elmo e la spada non compaiono ed è giusto così — il
     ferro ha la sua, che è fatta di venature di martellatura — la
     prima versione lo lasciava liscio, ed era il motivo per cui la
     corazza restava una macchia grigia proprio nel pezzo più grande
     e più guardato di tutta la figura. */
  materie: { manica: 'stoffa', gambe: 'cuoio', scarpe: 'cuoio' },
  col: {
    pelle: '#f2c9a0', pelleS: '#d9a97f',
    manica: '#3f63c8', manicaS: '#2f4a9c',
    gambe: '#48557a', gambeS: '#38445f',
    scarpe: '#6b4a2e', scarpeS: '#54381f',
    ferro: '#cfd8e6', ferroS: '#98a4bb',
    blu: '#3f63c8', bluS: '#2c469a',
    oro: '#f2c94c', cresta: '#e0453f', crestaS: '#a92f2b',
    bordo: '#241b33',
  },
  tronco(q, s, C, dir) {
    const b = C.bordo, sp = 0.75 * s
    // la sopravveste azzurra, poi la corazza sopra: due strati e si
    // vede subito che è vestito di ferro e non di stoffa
    capsula(q, 0, -9.2 * s, (dir === 'dx' ? 3.9 : 5.4) * s, 4.2 * s, 2.2 * s, C.blu, b, sp, 'stoffa')
    capsula(q, 0, -10 * s, (dir === 'dx' ? 3.4 : 4.8) * s, 3 * s, 1.8 * s, C.ferro, b, sp, 'ferro')
    if (dir !== 'su') {
      // il petto: due lastre e un rilievo centrale
      capsula(q, 0, -10.2 * s, (dir === 'dx' ? 1 : 1.1) * s, 2.6 * s, 0.8 * s, C.ferroS)
      q.rett(-4.6 * s, -6.6 * s, 9.2 * s, 1.5 * s, C.oro)      // cintura
      if (dir !== 'dx') q.rett(-1.1 * s, -6.6 * s, 2.2 * s, 1.5 * s, '#b98f22')
    } else {
      q.rett(-4.6 * s, -6.6 * s, 9.2 * s, 1.5 * s, C.oro)
      capsula(q, 0, -9.6 * s, 3.6 * s, 2.2 * s, 1.4 * s, C.ferroS)
    }
    // spalline
    if (dir === 'dx') tondo(q, 1.6 * s, -12.2 * s, 2.4 * s, 1.8 * s, C.ferro, b, sp, 'ferro')
    else for (const v of [-1, 1]) tondo(q, v * 5.2 * s, -12 * s, 2.6 * s, 1.9 * s, C.ferro, b, sp, 'ferro')

    /* ── il secondo livello sulla corazza ──
       Una corazza non è una lastra sola: è fatta di pezzi che si
       accavallano, e ogni accavallamento ha un filo d'ombra sotto e
       un filo di luce sopra. Sono quattro righe e due file di
       chiodi, e sono la differenza fra «ferro» e «una macchia
       grigia a forma di busto». */
    {
      const c = q.ctx
      const largo = (dir === 'dx' ? 3.4 : 4.8) * s
      // le fasce del ventre: due lame sovrapposte sotto il petto
      for (let i = 0; i < 2; i++) {
        const y = (-8.4 + i * 1.15) * s
        c.strokeStyle = mescola(C.ferroS, '#000000', 0.45); c.lineWidth = 0.3 * s
        c.beginPath(); c.moveTo(-largo * 0.82, y); c.lineTo(largo * 0.82, y); c.stroke()
        c.strokeStyle = mescola(C.ferro, '#ffffff', 0.4); c.lineWidth = 0.2 * s
        c.beginPath(); c.moveTo(-largo * 0.8, y + 0.3 * s); c.lineTo(largo * 0.8, y + 0.3 * s); c.stroke()
      }
      // i chiodi delle spalline: piccoli, ma sono il posto dove
      // l'occhio va a vedere se la cosa è tenuta insieme
      if (dir === 'dx') chiodi(q, 1.6 * s, -12.2 * s, 1.5 * s, 1 * s, 3, s, C)
      else for (const v of [-1, 1]) chiodi(q, v * 5.2 * s, -12 * s, 1.6 * s, 1.05 * s, 4, s, C)
      // la gorgiera: il collare che chiude la corazza in alto
      capsula(q, dir === 'dx' ? 0.5 * s : 0, -12.6 * s, (dir === 'dx' ? 1.8 : 2.6) * s,
              0.62 * s, 0.5 * s, mescola(C.ferro, '#ffffff', 0.18), b, sp * 0.7)
      // un graffio sul petto, che dice che questa corazza ha lavorato
      if (dir !== 'su') graffio(q, -1.2 * s, -10.4 * s, 2.4 * s, 0.3, s, '#00000045')
    }
  },
  testa(q, s, C, dir, stato) {
    const b = C.bordo, sp = 0.75 * s, R = 4.5 * s
    q.rett(-1.6 * s, 2.2 * s, 3.2 * s, 2 * s, C.pelleS)           // collo
    if (dir === 'dx') {
      // elmo di profilo, con la coda che scende sulla nuca
      poligono(q, [[-R, 1.4 * s], [-R * 0.95, -R * 0.6], [-R * 0.2, -R * 1.25],
                   [R * 0.8, -R * 0.7], [R * 0.95, 0.6 * s], [R * 0.5, 2.2 * s],
                   [-R * 0.6, 2.4 * s]], C.ferro, b, sp, 'ferro')
      poligono(q, [[R * 0.1, -0.6 * s], [R * 0.95, -0.2 * s], [R * 0.9, 1.9 * s], [R * 0.1, 1.6 * s]],
               '#2a2436')                                          // la fessura
      tondo(q, R * 0.62, 0.7 * s, 0.72 * s, 0.85 * s, '#ffffff')
      q.rett(R * 0.44, -0.9 * s, 0.9 * s, 3.2 * s, C.ferroS)       // nasale
      /* la cresta di profilo: una spazzola che corre dalla fronte alla
         nuca e ricade dietro. A punta pareva un cappello da nano. */
      const c2 = q.ctx
      c2.beginPath()
      c2.moveTo(R * 0.6, -R * 0.78)
      c2.quadraticCurveTo(R * 0.05, -R * 1.5, -R * 0.7, -R * 1.2)
      c2.quadraticCurveTo(-R * 1.35, -R * 0.95, -R * 1.2, -R * 0.15)
      c2.quadraticCurveTo(-R * 0.85, -R * 0.7, -R * 0.15, -R * 0.85)
      c2.closePath()
      c2.fillStyle = C.cresta; c2.fill()
      c2.strokeStyle = b; c2.lineWidth = sp; c2.lineJoin = 'round'; c2.stroke()
      c2.beginPath()
      c2.moveTo(R * 0.5, -R * 0.85)
      c2.quadraticCurveTo(R * 0.02, -R * 1.32, -R * 0.6, -R * 1.1)
      c2.quadraticCurveTo(-R * 0.3, -R * 0.95, -R * 0.1, -R * 0.88)
      c2.closePath()
      c2.fillStyle = C.crestaS; c2.fill()
    } else {
      tondo(q, 0, 0, R, R * 1.02, C.ferro, b, sp, 'ferro')
      if (dir === 'giu') {
        poligono(q, [[-R * 0.72, -0.6 * s], [R * 0.72, -0.6 * s], [R * 0.6, 2.6 * s],
                     [-R * 0.6, 2.6 * s]], '#2a2436')
        occhi(q, s, 1.7, 0.9, 0.78, stato, '#ffffff')
        q.rett(-0.55 * s, -1.2 * s, 1.1 * s, 4 * s, C.ferroS)      // nasale
      } else {
        // di spalle: la calotta liscia con la coppa sulla nuca
        capsula(q, 0, 1.3 * s, R * 0.8, 1.5 * s, 1 * s, C.ferroS, b, sp)
        q.linea([{ x: -R * 0.85, y: -0.3 * s }, { x: R * 0.85, y: -0.3 * s }], C.ferroS, 0.8 * s)
      }
      /* il pennacchio visto di faccia: un ciuffo largo. Stretto e alto
         sembrava un'antenna, e a 36 px spariva del tutto */
      const cy = -R * 0.72
      poligono(q, [[-1.7 * s, cy], [1.7 * s, cy], [2.1 * s, cy - R * 0.35],
                   [0.9 * s, cy - R * 0.78], [0, cy - R * 0.88], [-0.9 * s, cy - R * 0.78],
                   [-2.1 * s, cy - R * 0.35]], C.cresta, b, sp)
      poligono(q, [[-1.7 * s, cy], [0, cy], [0, cy - R * 0.88], [-0.9 * s, cy - R * 0.78],
                   [-2.1 * s, cy - R * 0.35]], mescola(C.cresta, '#ffffff', 0.26))
    }
    tondo(q, -R * 0.55, -R * 0.5, R * 0.3, R * 0.2, '#ffffff66')    // luce sul ferro

    /* ── il secondo livello sull'elmo ──
       Il bordo inferiore (un elmo poggia sul collo, non ci si fonde),
       i chiodi della calotta, e il filo di luce lungo la cresta della
       calotta stessa: è quello che le dà curvatura invece di
       lasciarla un cerchio pieno. */
    {
      const c = q.ctx
      // l'orlo dell'elmo
      c.strokeStyle = mescola(C.ferroS, '#000000', 0.4); c.lineWidth = 0.34 * s
      c.beginPath()
      if (dir === 'dx') c.ellipse(0, 0, R * 0.95, R * 0.98, 0, 0.3, 2.6)
      else c.ellipse(0, 0, R * 0.96, R * 0.99, 0, 0.35, 2.79)
      c.stroke()
      // il filo di luce sulla calotta
      c.strokeStyle = '#ffffff55'; c.lineWidth = 0.3 * s; c.lineCap = 'round'
      c.beginPath(); c.ellipse(0, 0, R * 0.72, R * 0.76, 0, 3.5, 4.9); c.stroke()
      // i chiodi lungo la fascia
      chiodi(q, 0, 0.2 * s, R * 0.78, R * 0.8, dir === 'dx' ? 4 : 6, s, C)
    }
  },
  arma(q, s, C, dir, sw, mani) {
    const b = C.bordo, sp = 0.7 * s
    const spada = (x, y, ang) => q.in(x, y, r => {
      r.rett(-0.75 * s, -11 * s, 1.5 * s, 11 * s, C.ferro)
      r.ctx.strokeStyle = b; r.ctx.lineWidth = sp; r.ctx.strokeRect(-0.75 * s, -11 * s, 1.5 * s, 11 * s)
      poligono(r, [[-0.75 * s, -11 * s], [0.75 * s, -11 * s], [0, -13 * s]], C.ferro, b, sp)
      r.rett(-0.3 * s, -10.6 * s, 0.6 * s, 10 * s, '#ffffff88')
      capsula(r, 0, 0, 2.8 * s, 0.7 * s, 0.5 * s, C.oro, b, sp)     // guardia
      capsula(r, 0, 1.8 * s, 0.7 * s, 1.6 * s, 0.6 * s, '#6b4a2e', b, sp)
      tondo(r, 0, 3.6 * s, 0.9 * s, 0.9 * s, C.oro, b, sp)
    }, ang)
    /* ── LO SCUDO ──
       Erano tre ellissi una dentro l'altra, ed era l'esempio più
       chiaro di «quattro cerchi e finita lì»: nessun bordo, nessuno
       spessore, niente che dicesse di che è fatto o come sta insieme.
       Un bersaglio da tiro con l'arco, non uno scudo.

       Adesso è costruito: la fascia di ferro attorno (che è un pezzo
       a parte, ed è il primo motivo per cui si legge come un
       oggetto), i chiodi che la tengono, il campo araldico spartito
       in due tinte, l'umbone al centro col suo riflesso, e due
       graffi. Undici elementi invece di tre — e la sagoma è la
       stessa di prima. */
    const scudo = (x, y, f) => {
      const rx = 3.6 * s * f, ry = 4 * s
      // la fascia di ferro: lo scudo ha un orlo, e l'orlo ha spessore
      tondo(q, x, y, rx, ry, C.ferroS, b, sp, 'ferro')
      tondo(q, x, y, rx * 0.84, ry * 0.86, C.blu, null, 0, 'stoffa')
      // il campo spartito: metà più chiara, come un'arme vera
      const c = q.ctx
      c.save()
      c.beginPath(); c.ellipse(x, y, rx * 0.84, ry * 0.86, 0, 0, 6.29); c.clip()
      c.fillStyle = C.bluS
      c.fillRect(x - rx, y - ry, rx, ry * 2)
      // la banda dorata di traverso
      c.fillStyle = mescola(C.oro, '#000000', 0.12)
      c.save(); c.translate(x, y); c.rotate(-0.5)
      c.fillRect(-rx * 1.2, -ry * 0.16, rx * 2.4, ry * 0.32)
      c.restore()
      c.restore()
      chiodi(q, x, y, rx * 0.92, ry * 0.93, f > 0.6 ? 8 : 5, s, C)
      // l'umbone, con la sua luce in alto a sinistra
      tondo(q, x, y, 1.15 * s * f, 1.25 * s, C.ferro, b, sp * 0.8)
      tondo(q, x - 0.3 * s * f, y - 0.42 * s, 0.42 * s * f, 0.44 * s,
            mescola(C.ferro, '#ffffff', 0.55))
      // due graffi, sempre negli stessi punti
      graffio(q, x - rx * 0.3, y + ry * 0.34, rx * 0.5, 0.25, s, '#ffffff30')
      graffio(q, x + rx * 0.34, y - ry * 0.2, rx * 0.36, -0.4, s, '#00000038')
    }
    if (dir === 'dx') {
      // di profilo lo scudo va davanti — un cavaliere che cammina col
      // brocchiere avanti si capisce anche da lontanissimo
      spada(mani.sx.x - 0.2 * s, mani.sx.y, 0.16)
      scudo(mani.dx.x + 1.4 * s, mani.dx.y - 1 * s, 0.42)
    } else { spada(mani.dx.x, mani.dx.y, 0.3); scudo(mani.sx.x, mani.sx.y - 1 * s, 1) }
  },
}
