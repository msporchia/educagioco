/* ═══════════════════════════════════════════════════════════════════
   IL MOSTRO IN SCENA — quello che sta *attorno* alla bestia.

   L'ombra a terra, l'ondeggiare di chi cammina e il volo di chi sta
   staccato, la crosta di ghiaccio, la barra della vita, il segno
   «immune» quando una torre gli rimbalza addosso, la corona del capo e
   chi è a terra per rialzarsi. Il corpo — quello che rende un goblin un
   goblin — lo disegna un pittore di `corpi-mostri.js`, e questo file lo
   chiama e basta.

   La riga qui sotto è l'unico punto di attacco: cambiare da dove arriva
   la tabella dei corpi è cambiare quell'import, niente altro.
   ═══════════════════════════════════════════════════════════════════ */

import { BESTIE as VECCHIE } from './corpi-mostri.js'
/* le otto bestie disegnate nell'altro cantiere (`grafica/mostri/`), che
   per un pezzo sono rimaste lì senza che nessuno le chiamasse: erano
   fatte apposta per confluire qui, indicizzate per lo stesso `id`.
   Adesso confluiscono, ed è la palude che le porta in campo. */
import { PITTORI_MOSTRI } from '../mostri/indice.js'

const BESTIE = { ...VECCHIE, ...PITTORI_MOSTRI }

/* i nomi delle bestie disegnate: il test controlla che ogni mostro di
   `data/mostri.js` abbia qui il suo disegno, e non un ripiego */
export const NOMI_BESTIE = Object.keys(BESTIE)

/* Un ritratto solo, senza barra della vita e senza ombra: serve alla
   scheda in alto a destra e al nastro del preavviso, che disegnano il
   mostro *fuori* dal campo. */
export const disegnaBestia = (p, id, s) => (BESTIE[id] || BESTIE.slime)(p, s)

/* il ritratto come cosa in scena: serve alla scheda in alto a destra e
   al nastro del preavviso, che guardano il mostro *fuori* dal campo e
   non devono sapere come è fatto dentro */
export function ritratto(p, { x = 0, y = 0, bestia }) {
  p.in(x, y, q => disegnaBestia(q, bestia, q.S * 1.35))
}

/* Il segno «immune»: una pastiglia grigia con la parola, sopra la testa,
   che sbiadisce in un attimo. Grigia per la stessa ragione del nastro —
   il colore di una torre qui vorrebbe dire «questa», e il segno dice il
   contrario: questa torre, contro di lui, non fa niente. La scrive tutta
   perché a quindici pixel un simbolo non si legge, e «immune» un bambino
   lo impara la prima volta che lo vede sopra un pipistrello che le
   bombe non toccano. Sta qui ed è esportato perché lo usa anche il
   pittore a sprite (`giochi/castello/scena/pittori.js`). */
export function segnoImmune(p, x, y, quanto) {
  if (!(quanto > 0)) return
  const S = p.S, w = 22 * S, h = 7 * S
  const su = (1 - quanto) * 4 * S
  p.velo(Math.min(1, quanto * 1.6), () => {
    p.ctx.fillStyle = '#f2eff6'; p.ctx.strokeStyle = '#6c6480'; p.ctx.lineWidth = 0.9 * S
    p.ctx.beginPath()
    p.ctx.roundRect(x - w / 2, y - h - su, w, h, h / 2)
    p.ctx.fill(); p.ctx.stroke()
    p.testo('immune', x, y - h / 2 - su, '#4a4458', 5.2 * S)
  })
}

/* La corona del capo: tre punte d'oro sopra la testa. È l'unica cosa
   disegnata in più per lui — il resto è lo stesso mostro, più grande. */
export function corona(p, x, y, s) {
  p.figura([[x - 6 * s, y], [x - 6 * s, y - 5 * s], [x - 3 * s, y - 2.5 * s], [x, y - 6 * s],
            [x + 3 * s, y - 2.5 * s], [x + 6 * s, y - 5 * s], [x + 6 * s, y]], '#f5c542')
  p.rett(x - 6 * s, y - 0.8 * s, 12 * s, 1.6 * s, '#c8961e')
}

/* Un mostro sul percorso. Chi vola sta staccato da terra e ondeggia,
   con l'ombra rimasta a terra sotto di lui: non cambia le regole del
   gioco, cambia il colpo d'occhio su chi sta arrivando.
   `taglia` lo ingrandisce (il capo) o lo rimpicciolisce (i pezzi di chi
   si è diviso); `aTerra` lo stende di fianco, trasparente, finché non si
   rialza. */
export function mostro(p, { x, y, bestia, vita = 1, gelo = 0, vola = false, taglia = 1,
                            capo = false, aTerra = false, respinto = 0 }) {
  // grosse quanto due terzi della strada: più piccole erano macchie
  const s = p.S * 1.35 * taglia
  const salto = aTerra ? 0
    : vola ? -7 * s + Math.sin(p.tempo * 2.6 + x * 0.05) * 2.2 * s
           : Math.sin(p.tempo * 6 + x * 0.08) * 1.2 * s
  p.velo(vola ? 0.6 : 1, () => p.ellisse(x, y + 6.5 * s, 6 * s, 2.2 * s, '#00000028'))
  if (aTerra) {
    /* a terra: steso, sbiadito, e tre stelline che girano sopra — non è
       morto, e fra un attimo si rialza */
    p.velo(0.55, () => p.in(x, y + 3 * s, q => disegnaBestia(q, bestia, s), Math.PI / 2))
    for (let i = 0; i < 3; i++) {
      const a = p.tempo * 4 + i * 2.09
      p.cerchio(x + Math.cos(a) * 6 * s, y - 6 * s + Math.sin(a) * 2 * s, 1.2 * s, '#ffe27a')
    }
    return
  }
  p.in(x, y + salto, q => {
    disegnaBestia(q, bestia, s)
    if (gelo <= 0) return
    q.velo(0.55, () => q.cerchio(0, -0.6 * s, 8 * s, '#bfe6ff'))
    for (let i = 0; i < 3; i++) {          // la crosta di ghiaccio
      const a = i / 3 * 6.29 + 0.6
      q.figura([[Math.cos(a) * 6 * s, Math.sin(a) * 6 * s - 1 * s],
                [Math.cos(a + 0.5) * 8 * s, Math.sin(a + 0.5) * 8 * s - 1 * s],
                [Math.cos(a - 0.3) * 8.6 * s, Math.sin(a - 0.3) * 8.6 * s - 1 * s]], '#e8f7ff')
    }
  })
  // la barra della vita sta sopra la testa, ferma anche se il mostro vola:
  // se ballasse anche lei diventerebbe illeggibile proprio mentre serve
  /* la barra della vita resta della taglia di sempre anche sul capo:
     più larga sì, ma non tanto da coprire mezzo campo */
  const alto = y - 11 * s + (vola ? -7 * s : 0)
  const b = p.S * 1.35 * Math.min(taglia, 1.6)
  const w = 13 * b, q = Math.max(0, Math.min(1, vita))
  p.rett(x - w / 2 - 0.7 * b, alto - 0.7 * b, w + 1.4 * b, 2.6 * b + 1.4 * b, '#00000044')
  p.rett(x - w / 2, alto, w * q, 2.6 * b,
         q > 0.5 ? '#38c172' : q > 0.25 ? '#ffc93c' : '#ff5c7a')
  if (capo) corona(p, x, alto - 1.5 * b, b * 0.8)
  /* Il segno «immune» sta sopra la barra, e c'è solo quando serve:
     quando una torre gli ha appena sparato addosso per niente. Un segno
     fisso su ogni mostro — prima c'era il pallino sbarrato della
     resistenza — a quindici pixel è una macchia; quello che si deve
     vedere è **il colpo che rimbalza**, e si vede quando succede. */
  segnoImmune(p, x, alto - (capo ? 7 : 1.5) * b, respinto)
}
