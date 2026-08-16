/* ═══════════════════════════════════════════════════════════════════
   IL MOSTRO IN SCENA — quello che sta *attorno* alla bestia.

   L'ombra a terra, l'ondeggiare di chi cammina e il volo di chi sta
   staccato, la crosta di ghiaccio, la barra della vita, il pallino
   sbarrato della resistenza. Il corpo — quello che rende un goblin un goblin — lo
   disegna un pittore di `corpi-mostri.js`, e questo file lo chiama e
   basta.

   La riga qui sotto è l'unico punto di attacco: cambiare da dove arriva
   la tabella dei corpi è cambiare quell'import, niente altro.
   ═══════════════════════════════════════════════════════════════════ */
import { TINTA } from './tinte.js'
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

/* Un mostro sul percorso. Chi vola sta staccato da terra e ondeggia,
   con l'ombra rimasta a terra sotto di lui: non cambia le regole del
   gioco, cambia il colpo d'occhio su chi sta arrivando. */
export function mostro(p, { x, y, bestia, vita = 1, gelo = 0, vola = false, resiste = null }) {
  // grosse quanto due terzi della strada: più piccole erano macchie
  const s = p.S * 1.35
  const salto = vola ? -7 * s + Math.sin(p.tempo * 2.6 + x * 0.05) * 2.2 * s
                     : Math.sin(p.tempo * 6 + x * 0.08) * 1.2 * s
  p.velo(vola ? 0.6 : 1, () => p.ellisse(x, y + 6.5 * s, 6 * s, 2.2 * s, '#00000028'))
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
  const alto = y - 11 * s + (vola ? -7 * s : 0)
  const w = 13 * s, q = Math.max(0, Math.min(1, vita))
  p.rett(x - w / 2 - 0.7 * s, alto - 0.7 * s, w + 1.4 * s, 2.6 * s + 1.4 * s, '#00000044')
  p.rett(x - w / 2, alto, w * q, 2.6 * s,
         q > 0.5 ? '#38c172' : q > 0.25 ? '#ffc93c' : '#ff5c7a')
  /* La resistenza: un pallino del colore della torre che **non** gli fa
     male, con una barretta di traverso. Prima qui c'era lo stesso
     pallino senza barra e voleva dire l'opposto — «spara con questa» —
     quindi la barra non è una decorazione: è tutta la differenza fra
     leggere il campo e leggerlo al contrario. Piccolo, perché il posto
     dove si studiano i nemici è la scheda; ma la barra sopravvive anche
     a quindici pixel, dove un colore da solo no.
     Il pallino c'è solo se quella torre esiste davvero: chi passa una
     resistenza che non corrisponde a nessuna torre non deve far saltare
     il disegno di tutto il campo. */
  if (resiste && TINTA[resiste]) {
    const cx = x + w / 2 + 3 * s, cy = alto + 1.3 * s, r = 2.6 * s
    p.cerchio(cx, cy, r, '#ffffffcc')
    p.cerchio(cx, cy, 1.8 * s, TINTA[resiste].chiaro)
    p.linea([[cx - 1.9 * s, cy + 1.9 * s], [cx + 1.9 * s, cy - 1.9 * s]], '#3a3348', 0.9 * s)
  }
}
