/* ═══════════════════════════════════════════════════════════════════
   LE MATERIE — di che cosa è fatta una forma

   Il punto di partenza è la domanda che ha smontato tutto il resto:
   «abbiamo pochi poligoni, ma anche ad averne tanti, se è piatto non
   aiuta, no?». No. Il difetto sta in una riga ripetuta ovunque:

       ctx.fillStyle = '#3f63c8'; ctx.fill()

   Una tinta uniforme non è stoffa: è carta colorata ritagliata a forma
   di sopravveste. Cento ritagli di carta fanno una figura complicata
   di carta.

   ── il primo tentativo, e perché era sbagliato ──
   La prima versione stendeva un velo di grana **su tutto il
   fotogramma**, alla fine, in una passata sola. Costava poco ed era
   sbagliata per tre motivi, tutti visibili a occhio:

     · era una **filigrana**: passava sopra ogni cosa allo stesso modo,
       compreso il fuori campo e il cielo;
     · **non si muoveva con la scena.** Era incollata allo schermo,
       quindi scorrendo la mappa il pavimento scivolava sotto una
       grana ferma. Non è materia, è sporco sull'obiettivo — ed è la
       cosa che più di tutte faceva «vecchio»;
     · era **la stessa per tutti**. Ma uno scettro di metallo è liscio
       per davvero: è giusto che sia piatto. Un tessuto no.

   ── come è fatto adesso ──
   La materia si dichiara **per pezzo**, e si posa dentro alla forma,
   dopo il colore, ritagliata sul suo contorno. Due conseguenze, che
   sono esattamente le due cose che mancavano:

     · vale il sistema di coordinate di *chi disegna*, cioè quello già
       traslato sulla figura. La trama quindi **è attaccata alla cosa**
       e ci si muove insieme, senza che nessuno debba calcolare niente;
     · ogni pezzo pesca una zona diversa del disegno di trama, perché
       sta in un punto diverso: due maniche della stessa casacca non
       vengono mai identiche.

   Le trame sono tre, e la scelta di quale usare è del pittore: chi
   disegna un mantello sa che è stoffa, e chi disegna una lama sa che
   il ferro è liscio e non deve chiedere niente.
   ═══════════════════════════════════════════════════════════════════ */
import { dado } from './comune.js'

const LATO = 48                      // il quadretto che si ripete

/* ─────────── le tre trame ───────────
   Sono in bianco e nero trasparente e si posano *sopra* il colore:
   così la stessa trama serve un panno rosso e uno blu, e non serve
   una copia per ogni tinta di ogni personaggio — che con la luce
   della stanza che sposta i colori sarebbero centinaia. */
const TRAME = {
  /* STOFFA: il tessuto ha un ordito, cioè righe incrociate. Fitte e
     debolissime — quello che si deve vedere è che la superficie *non
     è liscia*, non le righe. */
  stoffa(c) {
    c.strokeStyle = '#ffffff30'; c.lineWidth = 1
    for (let i = 0; i < LATO; i += 4) {
      c.beginPath(); c.moveTo(i + 0.5, 0); c.lineTo(i + 0.5, LATO); c.stroke()
    }
    c.strokeStyle = '#00000038'
    for (let k = 0; k < LATO; k += 4) {
      c.beginPath(); c.moveTo(0, k + 0.5); c.lineTo(LATO, k + 0.5); c.stroke()
    }
    // e qualche filo più marcato, se no l'ordito è troppo regolare
    c.strokeStyle = '#00000048'
    for (let k = 0; k < LATO; k += 4)
      if (dado(k, 3, 1) > 0.6) {
        c.beginPath(); c.moveTo(0, k + 0.5); c.lineTo(LATO, k + 0.5); c.stroke()
      }
  },

  /* CUOIO: non ha trama, ha **grana** — macchie irregolari, di
     misura diversa, senza direzione. È la differenza fra un tessuto
     e una pelle, e si legge subito anche piccolissima. */
  cuoio(c) {
    for (let i = 0; i < 260; i++) {
      const x = dado(i, 1, 5) * LATO, y = dado(i, 2, 5) * LATO
      const r = 0.6 + dado(i, 3, 5) * 1.6
      c.fillStyle = dado(i, 4, 5) > 0.5 ? '#ffffff28' : '#00000044'
      c.beginPath(); c.ellipse(x, y, r, r * 0.8, 0, 0, 6.29); c.fill()
    }
    // le pieghe: due o tre solchi lunghi e molli
    c.strokeStyle = '#00000038'; c.lineWidth = 1.6
    for (let i = 0; i < 3; i++) {
      const y = dado(i, 7, 5) * LATO
      c.beginPath(); c.moveTo(0, y)
      c.quadraticCurveTo(LATO / 2, y + (dado(i, 8, 5) - 0.5) * 10, LATO, y)
      c.stroke()
    }
  },

  /* FERRO: il metallo battuto **non** è liscio come una plastica: ha
     venature lunghe nel verso della martellatura e qualche bolla. Va
     tenuto leggero — se si carica diventa legno — ma toglierlo del
     tutto era il motivo per cui le corazze restavano macchie grigie. */
  ferro(c) {
    c.lineWidth = 1; c.lineCap = 'round'
    for (let i = 0; i < 40; i++) {
      const y = dado(i, 1, 21) * LATO
      const x = dado(i, 2, 21) * LATO
      const l = 6 + dado(i, 3, 21) * 16
      c.strokeStyle = dado(i, 4, 21) > 0.5 ? '#ffffff2c' : '#00000030'
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + l, y + (dado(i, 5, 21) - 0.5) * 3); c.stroke()
    }
    // le ammaccature del martello
    for (let i = 0; i < 26; i++) {
      const x = dado(i, 6, 21) * LATO, y = dado(i, 7, 21) * LATO
      c.fillStyle = '#00000022'
      c.beginPath(); c.ellipse(x, y, 1.6, 1.1, 0, 0, 6.29); c.fill()
    }
  },

  /* PELO: ciuffetti corti tutti nello stesso verso. Serve alle
     bestie, dove una tinta piatta è il difetto più evidente di tutti. */
  pelo(c) {
    c.lineWidth = 1; c.lineCap = 'round'
    for (let i = 0; i < 420; i++) {
      const x = dado(i, 1, 9) * LATO, y = dado(i, 2, 9) * LATO
      const l = 1.6 + dado(i, 3, 9) * 2.4
      c.strokeStyle = dado(i, 4, 9) > 0.55 ? '#ffffff34' : '#00000044'
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + l * 0.4, y + l); c.stroke()
    }
  },
}

/* i quadretti si disegnano una volta sola per tutta la vita della
   pagina: sono venti righe di conti, ma moltiplicate per sessanta
   fotogrammi al secondo diventerebbero una sciocchezza cara */
const quadretti = {}

function quadretto(nome) {
  if (quadretti[nome]) return quadretti[nome]
  const cv = document.createElement('canvas')
  cv.width = cv.height = LATO
  const c = cv.getContext('2d')
  TRAME[nome](c)
  quadretti[nome] = cv
  return cv
}

/* Il motivo va costruito sul contesto che lo userà, ma può servire lo
   stesso contesto per tutta la partita: si tiene per nome. */
const motivi = new WeakMap()

export function trama(ctx, nome) {
  if (!TRAME[nome]) return null
  let per = motivi.get(ctx)
  if (!per) { per = {}; motivi.set(ctx, per) }
  if (!per[nome]) per[nome] = ctx.createPattern(quadretto(nome), 'repeat')
  return per[nome]
}
