/* La pancetta del maiale (id `pancetta`, vedi dati/cortile.js) non è una merce senza uscita: tre ricette SOLO 3D, nelle macchine che già ci sono, la usano come
   ingrediente (come Hay Day). Non esistono in 2D: nessun numero si legge da parita2d.js, e `somiglia` dice quale piatto 2D prestano premio e fascia
   (`premioCome`: l'esperienza di un ordine e di una cassa la calcola la formula della 2D su quel piatto). I numeri sono PROVVISORI: stessa fascia di tempo,
   costo del gesto e livello del piatto 2D più vicino; il livello vero è il più tardo fra questo, la macchina e gli ingredienti (porcile compreso).
   Senza `pezzo` (`aspetta`: lo sprite d'atlante non c'è ancora): la faccia è l'emoji. Decisione dell'utente del 22/10/2026; vedi docs/fattoria3d/cortile-e-pentolone.md e parita/colture-e-catena.md. */
import { msDaMinuti } from './parita2d.js'

const R = (minuti, liv, costo, somiglia) => ({ ms: msDaMinuti(minuti), liv, costo, solo3d: true, silo: 'bottega', premioCome: somiglia })

export const RICETTE_PANCETTA = {
  uova_pancetta: { nome: 'Uova e pancetta', emoji: '🍳', aspetta: 'merce_uova_pancetta', ing: { uova: 1, pancetta: 1 }, ...R(8, 28, 1, 'polenta') },              // la cucina: come la polenta (8 min, liv 25), ma il porcile arriva al 28
  panino_pancetta: { nome: 'Panino alla pancetta', emoji: '🥪', aspetta: 'merce_panino_pancetta', ing: { pane: 1, pancetta: 1 }, ...R(7, 28, 1, 'torta') },         // il panificio: come la torta (8 min, 🪙2) un po' più svelto; il porcile arriva al 28
  ravioli_pancetta: { nome: 'Ravioli alla pancetta', emoji: '🥟', aspetta: 'merce_ravioli_pancetta', ing: { pasta: 1, uova: 1, pancetta: 1 }, ...R(10, 46, 2, 'lasagne') },              // il pastificio: come pizza e lasagne (liv 46–48, 9–12 min, 🪙2)
}
export const PIATTI_CON_PANCETTA = Object.keys(RICETTE_PANCETTA)
