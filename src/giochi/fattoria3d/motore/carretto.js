/* Il carretto del vicino (C15, come nella 2D: fattoria/motore/vicino.js): dà 5 di quello che avanza, riceve 1 di quello che manca. Mai
   monete, mai esperienza: cinque contro uno apposta, è la via d'uscita da uno scomparto pieno (D11), non un modo di giocare. In 3D lo si
   apre dalla mappa del trattore (docs/fattoria3d/vicini.md, «Il carretto»). Pure: niente DOM, niente Vue; lavora sul motore di casa solo
   con `scortaDi`, `spazioPer`, `_togli` e `_riponi` (le scorte e gli scomparti: dati/silos.js). */
import { COLTURE } from '../dati/colture.js'
import { RICETTE, merceDi } from '../dati/ricette.js'
import { LANA } from '../dati/animali.js'
import { SILOS, merciDelSilo } from '../dati/silos.js'
import { livelloDelPezzo } from '../dati/livelli.js'
import { livelloDellaMerce } from '../dati/vicini.js'

export const DAI = 5
export const RICEVI = 1

/** Le merci che il carretto tratta: quelle degli scomparti, meno il mangime (cibo di cane e gatto, non è roba da scambiare). */
export const MERCI_DEL_CARRETTO = Object.keys(SILOS).flatMap(merciDelSilo).filter(k => !(RICETTE[k] && RICETTE[k].mangime))
const livelloDi = k => LANA[k] ? livelloDelPezzo(LANA[k].dove) : livelloDellaMerce(k)
const dettaglio = k => { const m = LANA[k] || merceDi(k) || {}; return { k, nome: m.nome || k, emoji: m.emoji || '' } }

/** Quello che si può dare (almeno cinque): chi ne ha di più va per primo. `colmo`: lo scomparto è pieno (il motivo per venire qui). */
export function cosaPuoiDare(m) {
  return MERCI_DEL_CARRETTO.map(k => ({ ...dettaglio(k), quanti: m.scortaDi(k), colmo: m.spazioPer(k) === 0 })).filter(r => r.quanti >= DAI).sort((a, b) => b.quanti - a.quanti)
}

/** Quello che si può ricevere: merci già aperte dal livello, con posto nello scomparto, diverse da quella data; per prime quelle che hai di meno. */
export function cosaOffre(m, dato) {
  return MERCI_DEL_CARRETTO.filter(k => k !== dato && livelloDi(k) <= m.livello() && m.spazioPer(k) >= RICEVI)
    .map(k => ({ ...dettaglio(k), quanti: m.scortaDi(k) })).sort((a, b) => a.quanti - b.quanti)
}

/** Quanti scomparti sono colmi (e delle merci aperte): serve a dire se il carretto ha qualcosa da fare per chi apre il foglio. */
export function scompartiColmi(m) {
  return MERCI_DEL_CARRETTO.filter(k => livelloDi(k) <= m.livello() && m.spazioPer(k) === 0 && m.scortaDi(k) > 0)
}

/** Lo scambio; `verso` null è il regalo (si svuota e basta). Torna { ok, dato, quanti, verso, ricevuti } o { ok: false, motivo }. */
export function scambia(m, dato, verso = null) {
  if (!MERCI_DEL_CARRETTO.includes(dato)) return { ok: false, motivo: 'non-esiste' }
  if (m.scortaDi(dato) < DAI) return { ok: false, motivo: 'poca-roba', serve: DAI }
  if (verso && !cosaOffre(m, dato).some(r => r.k === verso)) return { ok: false, motivo: 'non-ci-sta', k: verso }       // il controllo non si salta: un foglio vecchio potrebbe offrire un posto già pieno
  m._togli(dato, DAI)
  const ricevuti = verso ? m._riponi(verso, RICEVI) : 0
  return { ok: true, dato, quanti: DAI, verso, ricevuti }
}
