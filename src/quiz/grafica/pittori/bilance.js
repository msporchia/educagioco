// { che:'bilance', bilance: [{ sx:[{e,n}|{peso}], dx:[…] }], unita?: 'kg' }, sempre in pari (il pittore non fa i conti). Vedi docs/apprendimento/quiz-moduli.md.
const PIATTO = '#dbe4fb'
const ASTA = '#93a7d6'
const PIEDE = '#7d8cb4'
const AGO = '#ffd58a'
const PESO = '#ffd58a'
const PESO_OMBRA = '#d9a94e'
const CIFRA = '#3a2a08'
const RIGA = 'rgba(255,255,255,.14)'

// riquadro suo di 100×60; i piatti poggiano sulla trave, non sono appesi (un filo si confonderebbe col gambo di una pera)
const PIANO = 38               // dove poggiano le cose
const CX = [25, 75]            // il centro dei due piatti
const LARGO = 42               // quanto è largo un piatto
const PEZZO = 13               // il lato di una cosa sul piatto
const GRANDE = 15.5            // …e quando c'è posto per farla più grossa
const STRABORDA = 47           // fin dove una fila può uscire dal piatto

function bilancia(p, { sx = [], dx = [] }, lato = PEZZO, unita = '') {
  p.figura([[37, 60], [63, 60], [57, 55.5], [43, 55.5]], PIEDE) // piede e colonna
  p.rett(48.6, 46, 2.8, 10, ASTA)
  p.rett(17, 45, 66, 3, ASTA) // la trave, dritta: è tutta la domanda
  for (const cx of CX) { // i due sostegni e i due piatti
    p.rett(cx - 1.4, PIANO + 2, 2.8, 5.5, ASTA)
    p.rett(cx - LARGO / 2, PIANO, LARGO, 2.6, PIATTO)
  }
  p.figura([[50, 43.5], [47, 47], [53, 47]], PIEDE) // l'ago dritto in su: «in pari»
  p.linea([{ x: 50, y: 45 }, { x: 50, y: 33 }], AGO, 1.6)
  p.cerchio(50, 32.5, 1.6, AGO)

  piatto(p, CX[0], sx, lato, unita)
  piatto(p, CX[1], dx, lato, unita)
}

// mucchietti: pesi insieme, cose della stessa specie insieme; il più grosso viene prima (va in fondo)
function mucchiDi(lato) {
  const pesi = lato.filter(x => x.peso !== undefined).map(x => ({ peso: x.peso }))
  const cose = lato.filter(x => x.e).map(x => Array.from({ length: x.n || 1 }, () => ({ e: x.e })))
  return [pesi, ...cose].filter(m => m.length).sort((a, b) => b.length - a.length)
}

// una cosa è quadrata, un peso si allarga con le cifre del suo numero
const largoDi = (pezzo, lato) => pezzo.peso === undefined
  ? lato
  : (8 + String(pezzo.peso).length * 5) * lato / PEZZO

// una fila o due, max tre pezzi per fila; il mucchio più grosso da solo va in fondo (si legge «tre e uno», non «un mucchio»)
function fileDi(lato) {
  const mucchi = mucchiDi(lato)
  const pezzi = mucchi.flat()
  if (pezzi.length <= 3) return pezzi.length ? [pezzi] : []
  const primo = mucchi[0].length
  const sotto = primo <= 3 && pezzi.length - primo <= 3 ? primo : Math.ceil(pezzi.length / 2)
  return [pezzi.slice(0, sotto), pezzi.slice(sotto)]
}

const larghezza = (fila, lato) => fila.reduce((s, x) => s + largoDi(x, lato), 0) + (fila.length - 1) * 0.8

function piatto(p, cx, lato, pezzo, unita) {
  fileDi(lato).forEach((fila, i) => {
    const y = PIANO - pezzo / 2 - 0.4 - i * pezzo
    let x = cx - larghezza(fila, pezzo) / 2
    for (const uno of fila) {
      const w = largoDi(uno, pezzo)
      if (uno.peso !== undefined) peso(p, x + w / 2, y, w, uno.peso, pezzo, unita)
      else p.testo(uno.e, x + w / 2, y + 0.6, '#ffffff', pezzo * 0.88, 400)
      x += w + 0.8
    }
  })
}

// la misura più grossa che ci sta: con poche cose sul piatto si può ingrandire
function pezzoPer(b) {
  const file = [...fileDi(b.sx || []), ...fileDi(b.dx || [])]
  return file.every(f => larghezza(f, GRANDE) <= STRABORDA) ? GRANDE : PEZZO
}

// l'unità sotto il numero, piccola: senza, «6» non dice di cosa (6 cosa? 6 fragole?)
function peso(p, x, y, w, quanto, lato, unita) { // trapezio con la maniglia, il numero sopra
  const h = lato - 2
  p.ctx.lineWidth = 1.4
  p.ctx.strokeStyle = PESO_OMBRA
  p.ctx.beginPath()
  p.ctx.arc(x, y - h / 2, 2.4 * lato / PEZZO, Math.PI, 0)
  p.ctx.stroke()
  p.figura([[x - w / 2, y + h / 2], [x + w / 2, y + h / 2],
            [x + w / 2 - 2, y - h / 2], [x - w / 2 + 2, y - h / 2]], PESO)
  p.rett(x - w / 2, y + h / 2 - 1.4, w, 1.4, PESO_OMBRA)
  const s = lato / PEZZO
  if (!unita) return p.testo(String(quanto), x, y + 0.4, CIFRA, 7.5 * s, 800)
  p.testo(String(quanto), x, y - 1.5 * s, CIFRA, 6.6 * s, 800)
  p.testo(unita, x, y + 2.5 * s, CIFRA, 3.4 * s, 700)
}

// una sola sta grande in mezzo; due stanno una sopra l'altra, rimpicciolite (0.92: la bilancia ha aria da tagliare sopra)
const DUE = 0.92
// tre in fila: un terzo d'altezza ciascuna, tagliata da sopra il carico (una fila sola: lo scambio a tre ha piatti da tre cose al massimo) al piede
const TRE = 0.85
const CARICO = PIANO - PEZZO - 2.5 // la cima di una fila sola, maniglia del peso compresa

export function bilance(p, { bilance: tutte = [], unita = '' }) {
  if (tutte.length <= 1) {
    // da sola: la cima è quella della fila più alta, il fondo è il piede a 60
    const b = tutte[0] || {}
    const pezzo = pezzoPer(b)
    const file = Math.max(fileDi(b.sx || []).length, fileDi(b.dx || []).length, 1)
    const cima = Math.min(PIANO - file * pezzo, 30)
    p.in(0, 50 - (cima + 60) / 2, q => bilancia(q, b, pezzo, unita))
    return
  }
  if (tutte.length >= 3) {
    for (const y of [33.3, 66.6]) p.rett(6, y - 0.4, 88, 0.8, RIGA)
    tutte.slice(0, 3).forEach((b, i) => {
      p.in((100 - 100 * TRE) / 2, i * 33.33 + 1.2 - CARICO * TRE,
        q => { q.ctx.scale(TRE, TRE); bilancia(q, b, PEZZO, unita) })
    })
    return
  }
  p.rett(6, 49.6, 88, 0.8, RIGA)
  tutte.slice(0, 2).forEach((b, i) => {
    p.in((100 - 100 * DUE) / 2, i * 50 + 48 - 60 * DUE, q => { q.ctx.scale(DUE, DUE); bilancia(q, b, PEZZO, unita) })
  })
}

export const PITTORI_BILANCE = { bilance }
