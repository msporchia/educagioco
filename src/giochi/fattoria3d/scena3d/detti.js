// Cosa dire quando una cosa non riesce: il motivo del motore in una riga per un bambino. Senza three, così la vista
// (Gioco.vue) lo usa senza trascinarsi dietro il disegno. Un rifiuto dice cosa fare, non un «no» nudo.
import { COLTURE } from '../dati/colture.js'
import { emojiDi } from '../dati/ricette.js'

/** `extra`: mancano (monete), per, secondi, liv (il livello a cui arriva), ingredienti ({ chiave: quanti }). */
export function dettoDi(motivo, extra = {}) {
  switch (motivo) {
    case 'poche-monete': return `Ti mancano 🪙 ${extra.mancano}`
    case 'manca-raccolto': return extra.per ? `Per ${extra.per} serve un raccolto` : 'Serve un raccolto'
    case 'lana-ricresce': return `La lana ricresce… ${extra.secondi}s`
    case 'sazie': return 'Sono tutte sazie'
    case 'forno-pieno': return 'Il forno è pieno'
    case 'mancano-ingredienti': {
      const manca = Object.entries(extra.ingredienti || {}).map(([k, n]) => `${emojiDi(k, COLTURE)} ${n}`).join('  ')
      return manca ? `Ti mancano: ${manca}` : 'Mancano degli ingredienti'
    }
    case 'non-sbloccato': return extra.liv ? `Arriva al livello ${extra.liv}` : 'Non è ancora arrivato'
    case 'lotto-non-tuo': return 'Compra prima il terreno qui accanto'
    case 'non-tua': return 'Compra prima questo edificio'
    case 'in-viaggio': return 'È ancora in viaggio…'
    case 'non-confina': return 'Compra prima un terreno che confina con questo'
    case 'occupato': case 'fuori-terreno': return 'Qui non si può: cerca un posto libero nei tuoi terreni'
    case 'sta-crescendo': return 'Quello che sta crescendo non si mette via'
    case 'ha-le-pecore': return 'Il recinto ha le pecore: spostalo, non si mette via'
    default: return 'Non si può'
  }
}

/** Lo stesso, da un rifiuto intero del motore ({ ok: false, motivo, liv, mancano… }): prende da sé il livello e gli ingredienti. */
export function dettoDiRifiuto(r, extra = {}) {
  return dettoDi(r.motivo, { liv: r.liv, ingredienti: r.mancano, ...extra })
}
