/* Le parole del foglio della bestia (viste/Bestia.vue), senza Vue: dove si fa una roba che manca, cosa dice un rifiuto del motore, l'esito di un gesto.
   Scritte per bambini dai quattro ai dodici anni. Vedi docs/fattoria3d/bestie-di-casa.md. */
import { COLTURE } from '../dati/colture.js'
import { RICETTE } from '../dati/ricette.js'
import { PRODOTTI_ANIMALI, LANA } from '../dati/animali.js'
import { EDIFICI, PEZZI } from '../dati/catalogo.js'
import { merceDi } from '../dati/ricette.js'

/** Come si ottiene una roba del granaio che manca (una frase, in minuscolo). */
export function doveSiFa(k) {
  if (COLTURE[k]) return `semina ${COLTURE[k].nome.toLowerCase()} in un campo`
  if (RICETTE[k]) { const e = EDIFICI[RICETTE[k].dove]; return e ? `si prepara ${e.art === 'il' ? 'nel' : e.art === 'lo' ? 'nello' : 'nella'} ${e.nome}` : 'si prepara in una macchina' }
  if (PRODOTTI_ANIMALI[k]) { const p = PEZZI[PRODOTTI_ANIMALI[k].dove] || EDIFICI[PRODOTTI_ANIMALI[k].dove]; return `lo fanno gli animali${p ? ': ' + p.nome.toLowerCase() : ''}` }
  if (LANA[k]) return 'la fanno le pecore del recinto'
  return 'lo fai nella fattoria'
}

/** Cosa dice un rifiuto di `Cura` (nutri, coccola). `monete`: quante ne hai. */
export function dettoCura(r, { monete = 0 } = {}) {
  switch (r && r.motivo) {
    case 'non-gli-piace': return r.perche || 'Questo non lo vuole.'
    case 'non-ha-fame': return 'Non ha fame, adesso.'
    case 'non-serve': return 'Adesso non ne ha bisogno.'
    case 'manca-roba': { const m = merceDi(r.prodotto); return `Non hai ${m ? m.emoji + ' ' + m.nome.toLowerCase() : 'questa roba'}: ${doveSiFa(r.prodotto)}.` }
    case 'poche-monete': { const n = Math.max(1, (r.costo || 1) - monete); return `Ti ${n === 1 ? 'manca' : 'mancano'} 🪙${n}: gli esercizi negli altri giochi te le danno.` }
    case 'non-e-tua': return 'Non è tua.'
    case 'non-gli-sta': return r.dove === 'schiena' ? 'Il pappagallo ha le ali: sulla schiena non porta niente.' : 'Questo non gli sta.'
    case 'fuori-stagione': return r.stagione === 'halloween' ? 'Il cappello da strega si compra solo a Halloween.' : 'Si compra solo nei giorni di festa.'
    default: return 'Non si può, adesso.'
  }
}

/** Cosa dice un gesto riuscito: il premio, se c'è, è esperienza. */
export const dettoEsito = (r, nome) => r && r.premio ? `${nome} sta benissimo! +${r.premio.xp} ⭐` : `${nome} è contento!`

/** Cosa dice una compera che non si può. */
export function dettoCompera(r, nome) {
  if (r.motivo === 'non-sbloccato') return `${nome} arriva al livello ${r.liv}.`
  if (r.motivo === 'poche-monete') return `Servono 🪙${r.costo}: gli esercizi negli altri giochi te le danno.`
  if (r.motivo === 'gia-tua') return `${nome} è già tuo!`
  return 'Non si può, adesso.'
}
