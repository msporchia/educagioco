/* ═══════════════════════════════════════════════════════════════════
   I LUOGHI — dove capita una storia

   Stavano in `cose.js` finché erano quattro. Adesso sono otto e hanno un
   file loro, perché sono un mestiere diverso da quello di una cosa: un
   luogo **riempie il riquadro** e non ha un punto d'appoggio, una cosa
   sta in un punto e non sa cosa ha intorno.

   ── PERCHÉ UN LUOGO È TRE FASCE E NON UNA STANZA ──
   Una vignetta in una striscia da quattro, su un telefono, è larga
   settanta pixel. A quella taglia i dettagli non si vedono e la
   leggibilità viene tutta dal contrasto fra le grandi masse: il chiaro
   sopra, lo scuro sotto, la figura in mezzo. Quindi i fondali sono
   deliberatamente poveri — due o tre fasce di colore e **un solo
   accento riconoscibile** (la finestra, la lavagna, i solchi
   dell'orto) — e tutto il disegno vero sta nella persona.

   Il corollario che conta per chi ne aggiunge uno: due luoghi devono
   distinguersi **dal colore prima che dall'arredo**. In una striscia si
   guarda per mezzo secondo, e la prima cosa che dice «adesso siamo
   altrove» è che il fondo ha cambiato tinta.
   ═══════════════════════════════════════════════════════════════════ */
import { poligono, tondo } from '../../../grafica/comune.js'

export const LATO = 100
export const SUOLO = 80

/* Quanto i fondali debordano dal riquadro. La telecamera di
   `scena/tela.js` può stringere su un punto e guardare **oltre** il
   bordo del mondo: una fascia di colore che finisse esatta a 0 e a 100
   lascerebbe una striscia trasparente sul bordo della vignetta, che è il
   genere di difetto che si vede solo su una taglia sola. */
const FUORI = 60

/* le due righe che ogni luogo scrive uguali: il cielo (o la parete) e il
   pavimento (o la terra) */
function fasce(p, alto, basso, quota = SUOLO) {
  p.rett(-FUORI, -FUORI, LATO + FUORI * 2, quota + FUORI, alto)
  p.rett(-FUORI, quota, LATO + FUORI * 2, LATO - quota + FUORI, basso)
}

function ciuffi(p, colore, quali = [10, 24, 58, 72, 92]) {
  for (const x of quali) {
    p.linea([{ x, y: SUOLO + 3 }, { x: x - 1.5, y: SUOLO - 2 }], colore, 1.1)
    p.linea([{ x, y: SUOLO + 3 }, { x: x + 2, y: SUOLO - 1 }], colore, 1.1)
  }
}

function prato(p) {
  fasce(p, '#bfe6f5', '#7ec16a', SUOLO - 2)
  p.ellisse(30, SUOLO - 2, 34, 7, '#8fd07a')                  // una gobba di prato
  p.ellisse(80, SUOLO - 1, 26, 5, '#8fd07a')
  ciuffi(p, '#5da84c')
}

function cortile(p) {
  fasce(p, '#cfe8f0', '#b08b5e', SUOLO - 2)
  p.ellisse(22, SUOLO + 6, 26, 6, '#9c7a4f')
  ciuffi(p, '#6f9c50', [6, 40, 88])
}

/* la finestra: dice «dentro casa» meglio di qualunque mobile, ed è
   l'accento che salotto e cucina si spartiscono cambiando solo la
   parete */
function finestra(p, x = 80, y = 27, giorno = true) {
  p.rett(x - 14, y - 13, 28, 26, giorno ? '#8fc6de' : '#2b3a63')
  p.linea([{ x, y: y - 13 }, { x, y: y + 13 }], '#f7f2e8', 2)
  p.linea([{ x: x - 14, y }, { x: x + 14, y }], '#f7f2e8', 2)
  if (!giorno) {
    tondo(p, x - 6, y - 6, 3.4, 3.4, '#ffe98a')               // la luna
    for (const [dx, dy] of [[6, -8], [9, 3], [2, 6]])
      tondo(p, x + dx, y + dy, 0.9, 0.9, '#fff6cc')
  }
  p.ctx.strokeStyle = '#a8834f'; p.ctx.lineWidth = 2.4
  p.ctx.strokeRect(x - 14, y - 13, 28, 26)
}

function parquet(p) {
  for (let x = -10 - FUORI; x < LATO + FUORI; x += 14)
    p.linea([{ x, y: LATO }, { x: x + 8, y: SUOLO }], '#b57c42', 1)
}

function salotto(p) {
  fasce(p, '#f2dcc0', '#c98f52')
  p.rett(-FUORI, SUOLO - 3, LATO + FUORI * 2, 3, '#c9a97f')   // battiscopa
  parquet(p)
  finestra(p)
}

/* la cameretta è il salotto di notte, e si riconosce da quello: stessa
   casa, altra ora. La parete cambia tinta perché due luoghi si
   distinguono dal colore prima che dall'arredo */
function cameretta(p) {
  fasce(p, '#d8d0ee', '#c98f52')
  p.rett(-FUORI, SUOLO - 3, LATO + FUORI * 2, 3, '#a89ac9')
  parquet(p)
  finestra(p, 80, 25, false)
  // i pois della carta da parati: pochi e tenui, o diventano una griglia
  for (const [x, y] of [[12, 18], [30, 30], [18, 46], [40, 14], [52, 40], [8, 62]])
    tondo(p, x, y, 1.6, 1.6, '#c3b7e4')
}

function cucina(p) {
  fasce(p, '#dff0e4', '#b9ccd4')
  p.rett(-FUORI, SUOLO - 3, LATO + FUORI * 2, 3, '#9fb3bd')
  // le piastrelle a mezza parete: l'accento che la distingue dal salotto
  p.ctx.strokeStyle = '#c2ded0'; p.ctx.lineWidth = 1
  for (let y = 46; y < SUOLO; y += 12) {
    p.ctx.beginPath(); p.ctx.moveTo(-FUORI, y); p.ctx.lineTo(LATO + FUORI, y); p.ctx.stroke()
  }
  for (let x = 4; x < LATO; x += 12) {
    p.ctx.beginPath(); p.ctx.moveTo(x, 46); p.ctx.lineTo(x, SUOLO); p.ctx.stroke()
  }
  finestra(p, 82, 24)
}

function bagno(p) {
  p.rett(-FUORI, -FUORI, LATO + FUORI * 2, LATO + FUORI * 2, '#e8f4f7')
  p.ctx.strokeStyle = '#cfe4ea'; p.ctx.lineWidth = 1
  for (let y = 12; y < SUOLO; y += 16) { p.ctx.beginPath(); p.ctx.moveTo(0, y); p.ctx.lineTo(LATO, y); p.ctx.stroke() }
  for (let x = 12; x < LATO; x += 16) { p.ctx.beginPath(); p.ctx.moveTo(x, 0); p.ctx.lineTo(x, SUOLO); p.ctx.stroke() }
  p.rett(-FUORI, SUOLO, LATO + FUORI * 2, LATO - SUOLO + FUORI, '#b9ccd4')
}

/* l'orto: la terra a solchi. È l'unico luogo dove il **suolo** porta
   l'informazione — è lì che si pianta, si annaffia e si raccoglie — e
   infatti è l'unico disegnato con qualcosa di più di una fascia. */
function orto(p) {
  fasce(p, '#c7e9f3', '#6b4a2e', SUOLO - 4)
  p.ellisse(50, SUOLO - 4, 60, 6, '#7d5836')
  for (let x = -6; x < LATO + 10; x += 13) {
    p.ellisse(x, SUOLO + 4, 7, 2.6, '#5a3d25')
    p.ellisse(x + 6, SUOLO + 11, 7, 2.6, '#5a3d25')
  }
  ciuffi(p, '#4f9e42', [4, 96])
}

/* la scuola: la lavagna, e basta quella. Un'aula disegnata per bene a
   settanta pixel è un rettangolo marrone con dentro dei puntini. */
function aula(p) {
  fasce(p, '#f4ead6', '#c9a97f')
  p.rett(-FUORI, SUOLO - 3, LATO + FUORI * 2, 3, '#a8834f')
  p.rett(16, 12, 56, 30, '#3d5c4a')                            // la lavagna
  p.ctx.strokeStyle = '#a8834f'; p.ctx.lineWidth = 3
  p.ctx.strokeRect(16, 12, 56, 30)
  // due scarabocchi di gesso: dicono «ci si impara» senza scrivere niente
  p.linea([{ x: 24, y: 22 }, { x: 40, y: 22 }], '#eaf3ec', 1.6)
  p.linea([{ x: 24, y: 30 }, { x: 52, y: 30 }], '#eaf3ec', 1.6)
  poligono(p, [[56, 34], [64, 34], [60, 22]], '#eaf3ec')
}

export const LUOGHI = { prato, cortile, salotto, cameretta, cucina, bagno, orto, aula }
