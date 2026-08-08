/* ── LA TORCIA DA MURO ──
   Nel fondale le torce ci sono già (`luce.js`), ferme e con la pozza
   cotta dentro la stanza: sono l'illuminazione dell'ambiente, e a
   fuoco fermo perché a 36 px il guizzo non si vede.

   Questa è un'altra cosa: **un oggetto di scena**, che il livello mette
   dove vuole e può spegnere. Il fuoco guizza, la pozza respira, e chi
   ci passa davanti ci passa davanti davvero (la tela ordina per `y`).
   Costa di più, quindi se ne mettono poche e dove contano.

   È disegnata **alta**: la staffa parte da sopra la cella e la
   fiaccola resta all'altezza della testa di un personaggio, come una
   torcia appesa alla faccia di un muro. La pozza di luce cade sul
   pavimento davanti, un po' più in basso della fiamma — se cadesse
   sotto la fiamma sembrerebbe una lampada da tavolo. */
import { capsula, poligono, tondo } from '../comune.js'
import { LEGNO, fiamma, pozzaLuce } from './attrezzi.js'

export function torcia(p, cosa, S = p.S) {
  const { x, y, accesa = true } = cosa
  const s = S, t = p.tempo || 0
  const f = (x * 0.07 + y * 0.11) % 6.28         // ogni torcia guizza per conto suo
  if (accesa) pozzaLuce(p, x, y + 3 * s, 15 * s, '#ffb45a', 0.55 + 0.1 * Math.sin(t * 6 + f))
  // la staffa a muro e il manico obliquo
  p.rett(x - 2.6 * s, y - 15 * s, 5.2 * s, 2 * s, LEGNO.ferroS)
  p.rett(x - 2.6 * s, y - 15 * s, 5.2 * s, 0.7 * s, LEGNO.ferroL)
  p.in(x, y - 13.6 * s, q => {
    capsula(q, 0, 0, 0.8 * s, 3.4 * s, 0.7 * s, LEGNO.scuro, LEGNO.bordo, 0.6 * s)
    poligono(q, [[-2.2 * s, -4.6 * s], [2.2 * s, -4.6 * s], [1.3 * s, -2.4 * s],
                 [-1.3 * s, -2.4 * s]], LEGNO.ferro, LEGNO.bordo, 0.6 * s)
    q.rett(-2.2 * s, -4.9 * s, 4.4 * s, 0.7 * s, LEGNO.ferroL)
  }, 0.3)
  if (!accesa) {
    // spenta: due tizzoni neri, e si capisce che c'era un fuoco
    tondo(p, x + 0.6 * s, y - 18.4 * s, 1.4 * s, 0.9 * s, '#2b2723')
    return
  }
  p.velo(0.9, () => fiamma(p, x + 0.8 * s, y - 18 * s, 1.9 * s, t, f))
  p.velo(0.24 + 0.06 * Math.sin(t * 7 + f), () =>
    p.ellisse(x + 0.8 * s, y - 20 * s, 5 * s, 6 * s, '#ffb45a'))
}
