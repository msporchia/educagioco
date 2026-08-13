/* ═══════════════════════════════════════════════════════════════════
   CHIUDI — il gemello di `apri`, e non è una simmetria per bellezza

   Una porta chiusa **taglia la vista** (di qua e di là: si vede a
   distanza di cammino, e da una porta chiusa non ci si cammina) ma
   **non taglia il suono**. Chi si chiude dentro diventa cieco e resta
   in ascolto: l'unica cosa che gli arriva è un segnale, ed è
   esattamente il principio del gioco reso letterale — quello che non
   vedi te lo deve dire qualcuno.

   Da qui viene anche il tempo: dietro una porta chiusa aspettare non
   costa niente, e il rischio si concentra tutto nell'istante in cui
   riapri.
   ═══════════════════════════════════════════════════════════════════ */
import { Ordine } from './ordine.js'
import { AContatto } from '../distanze/a-contatto.js'

const ACCANTO = new AContatto(1)

export class Chiudi extends Ordine {
  static parola = 'chiudi'
  fa (contesto, cosa) { return contesto.consegna(this, cosa, 'chiudi') }
  raccontaIlMoto (cosa) { return `torno a chiudere ${cosa.nome}` }

  /* ── DA DOVE SI CHIUDE UNA PORTA: DA ACCANTO ──
     È l'unico verbo che non tocca la cosa da dove la cosa dichiara.
     Una porta APERTA si tocca stando sopra (`Porta.raggioDiPresa`), e
     ha ragione lei: aperta è una cella come le altre, e chi la apre o
     ci passa ci cammina sopra. Ma chi ci sta sopra non la può
     chiudere — se lo facesse resterebbe murato dentro la sua cella, e
     infatti la porta si rifiuta: «c'è qualcuno sulla soglia».
     Le due regole insieme rendevano `chiudi` ineseguibile: l'ordine
     camminava fin sopra la soglia e da lì falliva sempre, comunque
     fosse scritto il piano. Ci si ferma un passo prima. */
  aPortata (contesto, cosa) {
    const dove = contesto.mondo.dovePensiCheSia(contesto.chi, cosa)
    if (!dove) return false
    const io = contesto.chi
    /* sopra la soglia non ci si «arriva»: bisogna scendere di lì */
    if (io.x === dove.posto.x && io.y === dove.posto.y) return false
    return ACCANTO.arriva(contesto.mondo, io, dove.posto)
  }
}
