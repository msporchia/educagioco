// Cosa dire quando una cosa non riesce: il motivo del motore in una riga per un bambino. Senza three, così la vista
// (Gioco.vue) lo usa senza trascinarsi dietro il disegno. Un rifiuto dice cosa fare, non un «no» nudo.
import { COLTURE } from '../dati/colture.js'
import { emojiDi, merceDi, RICETTE } from '../dati/ricette.js'
import { EDIFICI } from '../dati/catalogo.js'
import { MANGIMI_SENZA_RICETTA } from '../dati/cortile2.js'
import { tempoBreve } from '../dati/tempo.js'
import { siloDi, SILOS } from '../dati/silos.js'

/** `extra`: costo (le monete che servono: «Servono 🪙 N»), mancano (monete), per, secondi, liv (il livello a cui arriva), ingredienti ({ chiave: quanti }). */
export function dettoDi(motivo, extra = {}) {
  switch (motivo) {
    case 'poche-monete':
      if (extra.costo && extra.per) return `Per ${extra.per} servono 🪙 ${extra.costo}`
      return extra.costo ? `Servono 🪙 ${extra.costo}` : `Ti mancano 🪙 ${extra.mancano}`
    case 'manca-mangime': {
      // «Serve 🥬 foraggio (2 a testa): lo fa il fienile» — il mangime lo fa una macchina, non è un raccolto (docs/fattoria3d/mangime-e-catena.md)
      const cibi = (extra.mangia || []).filter(k => merceDi(k))
      if (!cibi.length) return 'Serve da mangiare'
      const cosa = cibi.map(k => `${emojiDi(k)} ${merceDi(k).nome.toLowerCase()}`).join(' o ')
      const dove = [...new Set(cibi.map(k => (RICETTE[k] || MANGIMI_SENZA_RICETTA[k] || {}).dove))].map(t => EDIFICI[t]).filter(Boolean).map(e => `${e.art} ${e.nome.toLowerCase()}`).join(' o ')
      return `Serve ${cosa}${extra.servono > 1 ? ` (${extra.servono} a testa)` : ''}${dove ? `: lo fa ${dove}` : ''}`
    }
    case 'lavora': return extra.secondi ? `Ci stanno lavorando… ${tempoBreve(extra.secondi * 1000)}` : 'Ci stanno lavorando'
    case 'pieno': return extra.bestie ? `Ci sono già tutte le ${extra.bestie} che ci stanno` : 'Non c\'è più posto'
    case 'lana-ricresce': return `La lana ricresce… ${tempoBreve(extra.secondi * 1000)}`
    case 'scomparto-pieno': {
      // lo scomparto di quella merce è pieno (dati/silos.js): non si raccoglie e non si paga, il lavoro aspetta
      const m = extra.k && merceDi(extra.k), silo = extra.k && SILOS[siloDi(extra.k)]
      return `${m ? `${m.emoji} ${m.nome}: ` : ''}lo scomparto è pieno${extra.max ? ` (${extra.max})` : ''}. Usa un po' di roba${silo ? ` o ingrandisci ${silo.breve === 'Dispensa' ? 'la dispensa' : 'il magazzino'}` : ''}`
    }
    case 'sazie': return 'Sono tutte sazie'
    case 'forno-pieno': return extra.compra ? 'Tutti i posti sono occupati: puoi comprarne un altro' : 'Tutti i posti sono occupati'
    case 'non-posseduta': return 'Costruisci prima questa macchina'
    case 'mancano-ingredienti': {
      const manca = Object.entries(extra.ingredienti || {}).map(([k, n]) => `${emojiDi(k, COLTURE)} ${n}`).join('  ')
      return manca ? `Ti mancano: ${manca}` : 'Mancano degli ingredienti'
    }
    case 'banco-chiuso': return 'Il banco è chiuso: serve una bacheca'
    case 'sconosciuto': return 'Questo ordine non c\'è più'
    case 'non-sbloccato': return extra.liv ? `Arriva al livello ${extra.liv}` : 'Non è ancora arrivato'
    case 'non-tua': return 'Costruisci prima questo edificio'
    case 'gia-tuo': return 'Ce n\'è già uno: puoi spostarlo'
    case 'niente-bottega': return 'Metti prima la bottega nella fattoria'
    case 'non-esiste': return 'Quel cliente è già andato via'
    case 'in-viaggio': return 'È ancora in viaggio…'
    case 'non-confina': return 'Compra prima un terreno che confina con questo'
    case 'occupato': case 'fuori-terreno': return 'Qui non si può: cerca un posto libero nei tuoi terreni'
    case 'acqua': return 'Qui c\'è l\'acqua: serve un ponte'
    case 'ponte-sopra': return 'Togli prima il ponte'
    case 'non-acqua-vicina': return 'Qui non c\'è acqua da pescare'
    case 'non-acqua': return 'Qui non c\'è acqua'
    case 'non-abbocca': return 'Non ha ancora abboccato'
    case 'da-ritirare': return 'Il pesce ha abboccato: ritiralo!'
    case 'senza-molo': return 'Per pescare serve un molo vicino all\'acqua'
    case 'serve-porticciolo': return 'Per pescare in mare serve il porticciolo'
    case 'lontano': return 'L\'acqua è troppo lontana dal molo: allunga il molo o mettine un altro'
    case 'acqua-non-tua': return 'Quest\'acqua non è ancora tua: compra prima il terreno'
    case 'serve-riva': return 'Il porticciolo si mette sulla riva, vicino all\'acqua'
    case 'pesca-attesa': return extra.secondi ? `Il galleggiante è in acqua… ${tempoBreve(extra.secondi * 1000)}` : 'Il galleggiante è in acqua'
    case 'pesca-riposo': return extra.secondi ? `I pesci stanno tornando… ${tempoBreve(extra.secondi * 1000)}` : 'I pesci stanno tornando'
    case 'sta-crescendo': return 'Quello che sta crescendo non si mette via'
    case 'ha-le-bestie': return 'Ci sono le bestie: spostalo, non si mette via'
    case 'macchina-al-lavoro': return 'Finisci prima il lavoro: poi la metti via (spostarla si può)'
    case 'ha-le-pecore': return 'Il recinto ha le pecore: spostalo, non si mette via'
    default: return 'Non si può'
  }
}

/** Lo stesso, da un rifiuto intero del motore ({ ok: false, motivo, liv, mancano… }): prende da sé il livello e gli ingredienti. */
export function dettoDiRifiuto(r, extra = {}) {
  return dettoDi(r.motivo, { liv: r.liv, ingredienti: r.mancano, costo: r.costo, k: r.k, max: r.max, servono: r.servono, mangia: r.mangia, secondi: r.secondi, ...extra })
}
