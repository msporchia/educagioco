/* ── IL TOTEM ──
   Il gemello della leva che invece di scattare CONTA (vedi `motore/
   generale/elementi/totem.js`): ogni «premi» sotto la soglia accende
   una tacca in più, e solo l'ultima manda il comando ai collegati.

   `Totem.faccia()` consegna due numeri, `tacche` e `accese`, e non un
   sì/no — è la variabile che si vede, non un interruttore — quindi il
   disegno deve rispondere alla stessa domanda che si fa il bambino:
   «a che punto sono?». Un blocco di pietra intagliato, con tante gemme
   quante `tacche` ne servono: quelle già premute ardono, le altre
   restano di pietra fredda. Contarle a colpo d'occhio è tutto quello
   che serve per decidere se premere ancora. */
import { poligono, tondo } from '../comune.js'
import { PIETRA, ombra } from './attrezzi.js'

export function totem(p, cosa, S = p.S) {
  const { x, y, tacche = 3, accese = 0 } = cosa
  const s = S, t = p.tempo || 0
  ombra(p, x, y, 6 * s, 2 * s)
  // il blocco, più stretto in cima come un vero totem intagliato
  poligono(p, [[x - 5.4 * s, y], [x + 5.4 * s, y],
               [x + 4.2 * s, y - 15 * s], [x - 4.2 * s, y - 15 * s]],
           PIETRA.media, PIETRA.bordo, 0.7 * s)
  p.rett(x - 4.2 * s, y - 15 * s, 2.2 * s, 15 * s, PIETRA.chiara)
  // la faccia intagliata in cima: due occhi e una bocca, sempre uguale
  // — non conta niente, è quello che fa «totem» invece di «lastra» */
  p.in(x, y - 12.2 * s, q => {
    tondo(q, -1.6 * s, 0, 1 * s, 1.2 * s, PIETRA.scura)
    tondo(q, 1.6 * s, 0, 1 * s, 1.2 * s, PIETRA.scura)
    q.rett(-1.6 * s, 1.6 * s, 3.2 * s, 0.6 * s, PIETRA.scura)
  })
  // le tacche, in fila sul petto: quante ne servono (`tacche`), quante
  // sono già accese (`accese`) — la variabile che si vede
  const n = Math.max(1, tacche)
  const largo = 7.6 * s, passo = largo / n
  for (let i = 0; i < n; i++) {
    const tx = x - largo / 2 + passo * (i + 0.5)
    const accesa = i < accese
    if (accesa) {
      const pulsa = 0.5 + 0.3 * Math.sin(t * 3 + i * 1.7)
      p.velo(pulsa, () => tondo(p, tx, y - 5 * s, 1.7 * s, 1.7 * s, '#ffb14a'))
    }
    tondo(p, tx, y - 5 * s, 0.9 * s, 0.9 * s,
          accesa ? '#ffd88a' : PIETRA.scura, PIETRA.bordo, 0.35 * s)
  }
}
