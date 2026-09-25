/* ═══════════════════════════════════════════════════════════════════
   IL PITTORE DELLE BILANCE

   Una o due bilance a due piatti, **sempre in pari**, dentro il
   quadrato 100×100 del riquadro. Sa disegnare una scena sola:

     { che: 'bilance', bilance: [
         { sx: [{ e: '🍎', n: 3 }], dx: [{ peso: 12 }] },
         { sx: [{ e: '🍐', n: 1 }], dx: [{ e: '🍎', n: 1 }, { peso: 2 }] },
     ] }

   Su un piatto ci sono **cose** (un'emoji e quante ne sono) e **pesi**
   (un numero scritto sopra). Il pittore non sa quale sia la cosa da
   trovare, non sa quanto pesa niente e non controlla che la bilancia
   sia davvero in pari: la disegna dritta perché il modulo gliel'ha
   data così. Un pittore che facesse i conti sarebbe un secondo posto
   dove sbagliarli.

   SEMPRE IN PARI, E SI DEVE VEDERE. La lettura di tutta la domanda sta
   in quella trave orizzontale, quindi c'è anche l'ago in mezzo, dritto
   in su: è il segno che le bilance vere hanno per dire «uguale», e a
   figura piccola si vede prima della trave.

   PICCOLA VUOL DIRE POCHE COSE. Nella carta il riquadro è largo circa
   148 pixel, e le bilance sono due quando si scambia: un piatto regge
   al massimo sei pezzi, in due file da tre, e il modulo non gliene dà
   di più. Le cose uguali stanno vicine (i pesi insieme, le cose
   raggruppate per specie), perché «tre mele e un peso» si legge a
   colpo d'occhio solo se le tre mele sono in fila.

   Due bilance stanno una sopra l'altra — «quella di sopra» e «quella
   di sotto» sono le parole che usa l'aiuto — e rimpicciolite: la trave
   lunga cento non ci starebbe due volte in altezza.

   SI DISEGNA CHIARO, perché la carta dei quiz è blu notte (vedi i
   pittori del senso del numero).
   ═══════════════════════════════════════════════════════════════════ */

const PIATTO = '#dbe4fb'
const ASTA = '#93a7d6'
const PIEDE = '#7d8cb4'
const AGO = '#ffd58a'
const PESO = '#ffd58a'
const PESO_OMBRA = '#d9a94e'
const CIFRA = '#3a2a08'
const RIGA = 'rgba(255,255,255,.14)'

/* ── la bilancia, in un riquadro suo di 100×60 ──
   I piatti stanno sopra la trave (come nelle bilance da cucina a due
   piatti), non appesi: appesi, i fili taglierebbero in due quello che
   c'è sopra, e a questa misura un filo e il gambo di una pera sono la
   stessa riga. */
const PIANO = 38               // dove poggiano le cose
const CX = [25, 75]            // il centro dei due piatti
const LARGO = 42               // quanto è largo un piatto
const PEZZO = 13               // il lato di una cosa sul piatto
const GRANDE = 15.5            // …e quando c'è posto per farla più grossa
const STRABORDA = 47           // fin dove una fila può uscire dal piatto

function bilancia(p, { sx = [], dx = [] }, lato = PEZZO) {
  /* il piede e la colonna */
  p.figura([[37, 60], [63, 60], [57, 55.5], [43, 55.5]], PIEDE)
  p.rett(48.6, 46, 2.8, 10, ASTA)
  /* la trave, dritta: è tutta la domanda */
  p.rett(17, 45, 66, 3, ASTA)
  /* i due sostegni e i due piatti */
  for (const cx of CX) {
    p.rett(cx - 1.4, PIANO + 2, 2.8, 5.5, ASTA)
    p.rett(cx - LARGO / 2, PIANO, LARGO, 2.6, PIATTO)
  }
  /* l'ago in mezzo, dritto in su: «in pari» */
  p.figura([[50, 43.5], [47, 47], [53, 47]], PIEDE)
  p.linea([{ x: 50, y: 45 }, { x: 50, y: 33 }], AGO, 1.6)
  p.cerchio(50, 32.5, 1.6, AGO)

  piatto(p, CX[0], sx, lato)
  piatto(p, CX[1], dx, lato)
}

/* i pezzi di un piatto, a mucchietti: i pesi insieme, e le cose di una
   specie insieme — così le cose uguali stanno vicine. Il mucchietto più
   grosso viene prima, perché è quello che va giù in fondo. */
function mucchiDi(lato) {
  const pesi = lato.filter(x => x.peso !== undefined).map(x => ({ peso: x.peso }))
  const cose = lato.filter(x => x.e).map(x => Array.from({ length: x.n || 1 }, () => ({ e: x.e })))
  return [pesi, ...cose].filter(m => m.length).sort((a, b) => b.length - a.length)
}

/* quanto è largo un pezzo: una cosa è quadrata, un peso si allarga
   con le cifre del suo numero */
const largoDi = (pezzo, lato) => pezzo.peso === undefined
  ? lato
  : (8 + String(pezzo.peso).length * 5) * lato / PEZZO

/* Una fila o due, al massimo tre pezzi per fila. Se il mucchietto più
   grosso sta da solo in una fila, la fila di sotto è la sua e il resto
   va sopra: tre pulcini in fila e il gatto sopra si leggono «tre e
   uno», due e due si leggono «un mucchio». Altrimenti si spezza a metà,
   con la fila di sotto più lunga, come si mettono le cose su un piatto
   vero. */
function fileDi(lato) {
  const mucchi = mucchiDi(lato)
  const pezzi = mucchi.flat()
  if (pezzi.length <= 3) return pezzi.length ? [pezzi] : []
  const primo = mucchi[0].length
  const sotto = primo <= 3 && pezzi.length - primo <= 3 ? primo : Math.ceil(pezzi.length / 2)
  return [pezzi.slice(0, sotto), pezzi.slice(sotto)]
}

const larghezza = (fila, lato) => fila.reduce((s, x) => s + largoDi(x, lato), 0) + (fila.length - 1) * 0.8

function piatto(p, cx, lato, pezzo) {
  fileDi(lato).forEach((fila, i) => {
    const y = PIANO - pezzo / 2 - 0.4 - i * pezzo
    let x = cx - larghezza(fila, pezzo) / 2
    for (const uno of fila) {
      const w = largoDi(uno, pezzo)
      if (uno.peso !== undefined) peso(p, x + w / 2, y, w, uno.peso, pezzo)
      else p.testo(uno.e, x + w / 2, y + 0.6, '#ffffff', pezzo * 0.88, 400)
      x += w + 0.8
    }
  })
}

/* la misura più grossa che ci sta: una bilancia sola ha tutto il
   riquadro, e con poche cose sul piatto le cose si possono fare più
   grandi — che è quello che conta a 148 pixel */
function pezzoPer(b) {
  const file = [...fileDi(b.sx || []), ...fileDi(b.dx || [])]
  return file.every(f => larghezza(f, GRANDE) <= STRABORDA) ? GRANDE : PEZZO
}

/* un peso da bilancia: il trapezio con la maniglia, e il numero sopra */
function peso(p, x, y, w, quanto, lato) {
  const h = lato - 2
  p.ctx.lineWidth = 1.4
  p.ctx.strokeStyle = PESO_OMBRA
  p.ctx.beginPath()
  p.ctx.arc(x, y - h / 2, 2.4 * lato / PEZZO, Math.PI, 0)
  p.ctx.stroke()
  p.figura([[x - w / 2, y + h / 2], [x + w / 2, y + h / 2],
            [x + w / 2 - 2, y - h / 2], [x - w / 2 + 2, y - h / 2]], PESO)
  p.rett(x - w / 2, y + h / 2 - 1.4, w, 1.4, PESO_OMBRA)
  p.testo(String(quanto), x, y + 0.4, CIFRA, 7.5 * lato / PEZZO, 800)
}

/* ── la scena ──
   Una bilancia sola sta in mezzo, grande; due stanno una sopra
   l'altra, rimpicciolite quanto basta perché il riquadro le tenga
   tutte e due, con una riga leggera in mezzo che le separa.

   Rimpicciolite di poco: la bilancia disegnata è alta sessanta, ma le
   prime dodici righe sono aria sopra le cose, e l'aria si può tagliare.
   Il fondo di ognuna sta a 48 della sua metà, e la cima a tre dal
   bordo anche con due file di cose. */
const DUE = 0.92

export function bilance(p, { bilance: tutte = [] }) {
  if (tutte.length <= 1) {
    /* da sola sta in mezzo al riquadro: la cima è quella della fila più
       alta, il fondo è il piede a 60 */
    const b = tutte[0] || {}
    const pezzo = pezzoPer(b)
    const file = Math.max(fileDi(b.sx || []).length, fileDi(b.dx || []).length, 1)
    const cima = Math.min(PIANO - file * pezzo, 30)
    p.in(0, 50 - (cima + 60) / 2, q => bilancia(q, b, pezzo))
    return
  }
  p.rett(6, 49.6, 88, 0.8, RIGA)
  tutte.slice(0, 2).forEach((b, i) => {
    p.in((100 - 100 * DUE) / 2, i * 50 + 48 - 60 * DUE, q => { q.ctx.scale(DUE, DUE); bilancia(q, b) })
  })
}

export const PITTORI_BILANCE = { bilance }
