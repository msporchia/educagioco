// Quando l'età che i giochi usano non è più quella che la data di nascita dice (un compleanno), si decide cosa fare
// (docs/genitori/riordino.md). Nella stessa fascia (cambiano solo le domande, che si spostano da sole) si aggiorna in silenzio; se cambia
// la fascia (si aprono e si chiudono giochi, si riscrivono i saperi) non si cambia niente da soli: un avviso nella posta dei grandi,
// una volta sola per età, e la scelta si fa dalle impostazioni, con l'anteprima di cosa succede.
import { state, nomeCorrente, etaDelBambino, nascitaDelBambino, etaDaNascita, spostaLEta } from './profile.js'
import { nomeClasse } from '../data/nascita.js'
import { avvisaUnaVolta } from './posta.js'
import { partenzaPerEta, eccezioniPerEta } from '../data/partenze.js'
import { GIOCHI } from '../data/giochi.js'

const nomeDi = k => (GIOCHI.find(g => g.chiave === k) || {}).nome || k

/* i giochi che passando da un'età all'altra si aprono e si chiudono (per le partenze, non per i ritocchi di un grande) */
export function cosaCambia(da, a) {
  const prima = eccezioniPerEta(da).giochi || {}, dopo = eccezioniPerEta(a).giochi || {}
  const chiavi = new Set([...Object.keys(prima), ...Object.keys(dopo)])
  const apre = [], chiude = []
  for (const k of chiavi) {
    if (prima[k] === false && dopo[k] !== false) apre.push(nomeDi(k))
    else if (prima[k] !== false && dopo[k] === false) chiude.push(nomeDi(k))
  }
  return { apre, chiude }
}

export const stessaFascia = (da, a) => {
  const x = partenzaPerEta(da), y = partenzaPerEta(a)
  return !!x && !!y && x.chiave === y.chiave
}

/* Da chiamare a profilo pronto e cambiando bambino. Torna cosa ha fatto: 'silenzio', 'avviso' o null (niente da fare). */
export async function controllaCompleanno() {
  try {
    if (!state.player || !nascitaDelBambino()) return null
    const ora = etaDelBambino(), voluta = etaDaNascita()
    if (voluta == null || voluta === ora) return null
    if (stessaFascia(ora, voluta)) { spostaLEta(voluta); return 'silenzio' }
    const { apre, chiude } = cosaCambia(ora, voluta)
    const nome = nomeCorrente()
    const testo = `Dalla data di nascita ${nome} fa adesso la ${nomeClasse(voluta)}, cioè i giochi andrebbero tarati sui ${voluta} anni: sono ancora tarati su ${ora}.`
      + (apre.length ? ` Passando ai ${voluta} anni si aprirebbero: ${apre.join(', ')}.` : '')
      + (chiude.length ? ` Si chiuderebbero: ${chiude.join(', ')}.` : '')
      + ' Non cambio niente da solo: dalle impostazioni vedi cosa succede e decidi tu.'
    await avvisaUnaVolta(`eta:${state.player}:${voluta}`, testo, { testo: 'Vai a «Quando è nato»', scheda: 'bambini', dove: 'nascita' })
    return 'avviso'
  } catch { return null }     // l'età non rompe mai niente
}
