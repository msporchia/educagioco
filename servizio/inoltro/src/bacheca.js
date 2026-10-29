/* La bacheca di un'amicizia (docs/core/amici-bacheca.md): l'ultima istantanea di ciascuno dei due, perché l'amico la legga quando
   può, anche se l'altro non è online. Scade una settimana dopo l'ultima scrittura. Qui solo le regole; il Durable Object che la
   tiene è in index.js. Il servizio non legge le istantanee: controlla chi scrive, la forma e la misura. */
import { CHIAVE, ID } from './presenza.js'

export const SCADENZA = 7 * 24 * 60 * 60 * 1000          // una settimana dall'ultima scrittura, poi non resta niente
export const MAX_DATI = 2048                              // byte di un'istantanea: poche righe di numeri
export const BACHECHE_ORA = 600                           // richieste all'ora da uno stesso indirizzo (una famiglia, sei amici a testa)

/* la richiesta del telefono: { chiave, id, dati } con `dati` un oggetto (si scrive) o null (si legge soltanto).
   Torna { ok, chiave, id, testo } (testo: i dati già in JSON, o null) o { ok: false, errore } */
export function leggiRichiesta(corpo) {
  if (!corpo || typeof corpo !== 'object') return { ok: false, errore: 'richiesta storta' }
  if (!CHIAVE.test(corpo.chiave || '')) return { ok: false, errore: 'chiave storta' }
  if (!ID.test(corpo.id || '')) return { ok: false, errore: 'id storto' }
  const d = corpo.dati
  if (d === null || d === undefined) return { ok: true, chiave: corpo.chiave, id: corpo.id, testo: null }
  if (typeof d !== 'object' || Array.isArray(d)) return { ok: false, errore: 'dati storti' }
  const testo = JSON.stringify(d)
  if (testo.length > MAX_DATI) return { ok: false, errore: 'dati troppo grandi' }
  return { ok: true, chiave: corpo.chiave, id: corpo.id, testo }
}

/* `posti`: { [id]: testo } di chi ha scritto. Una bacheca è di due: il terzo id che scrive è rifiutato (come la presenza).
   Torna { posti (i nuovi), scritto, altro (il testo dell'altro, o null), rifiutato } */
export function usa(posti, id, testo) {
  const p = { ...(posti || {}) }
  const altri = Object.keys(p).filter(x => x !== id)
  if (!(id in p) && altri.length >= 2) return { posti: p, scritto: false, altro: null, rifiutato: true }
  const scritto = testo !== null
  if (scritto) p[id] = testo
  return { posti: p, scritto, altro: altri.length ? p[altri[0]] : null, rifiutato: false }
}
