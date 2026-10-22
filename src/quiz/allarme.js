/* Quando una domanda che va male richiede un grande (docs/apprendimento/la-domanda.md#quando-si-avvisa-un-grande). Puro (test/unita/allarme).
   Il gioco alleggerisce da sé il muro per una settimana (quiz/alleggerire.js) e il grande lo vede in «Come va»: un avviso in più serve solo quando
   **non basta**. Prima, quando il muro scriveva in posta a ogni tipologia, era troppo: arrivava quasi sempre mentre la bambina non sapeva ancora
   una cosa, e stressava. Adesso si avvisa solo se:
   - una domanda del suo livello va ancora male **dopo la settimana di aiuto del gioco** (`persiste`), con almeno `ABBASTANZA` risposte; oppure
   - sono **parecchie** insieme (il giudizio di «Come va» è «tante»: forse è tutto tarato troppo avanti);
   e comunque **una volta ogni due settimane** (`PAUSA`) per bambino, in **un solo messaggio**, e mai per le domande «un passo avanti»
   (che è normale sbagliare). Si spegne con «Non avvertirmi più». */
import { giudizioDi } from './comeva.js'
import { alleggeritaDa, contoDopo } from './alleggerire.js'
import { consiglioDa } from './consiglio.js'

export const ABBASTANZA = 12                 // risposte a quella domanda: più di MINIME (8), perché un pomeriggio storto non basta
export const PAUSA = 14 * 86400000           // fra un avviso e il prossimo, per bambino

const soloAvanti = r => !!r.classi?.length && r.classi.every(c => c.dove === 'toste' || c.dove === 'sopra')

/* la domanda ha avuto la sua settimana di aiuto e da allora (almeno otto risposte nuove) va ancora male */
export const persiste = (r, segno, items, now) =>
  !!segno && !alleggeritaDa(segno, now) && consiglioDa(contoDopo(items?.[r.tipo], segno))?.verso === -1

/* viste/difficili: come per il giudizio; alleggerite: settings.alleggerite; items: state.profile.items; ultimo: quando si è avvisato l'ultima volta.
   Torna null (niente da dire) o { motivo: 'persistono' | 'tante', quali: [nomi], altre: n, testo } */
export function chiAvvisare({ viste = [], difficili = [], alleggerite = {}, items = {}, ultimo = 0, now = Date.now(), attivo = true } = {}) {
  if (!attivo) return null
  if (ultimo && now - ultimo < PAUSA) return null
  const sue = difficili.filter(r => !soloAvanti(r) && r.quante >= ABBASTANZA)
  const ostinate = sue.filter(r => persiste(r, alleggerite[r.tipo], items, now))
  const tante = giudizioDi({ viste, difficili }).tono === 'tante'
  if (!ostinate.length && !tante) return null
  const quali = (ostinate.length ? ostinate : sue).map(r => r.nome)
  return { motivo: ostinate.length ? 'persistono' : 'tante', quali: quali.slice(0, 2), altre: Math.max(0, quali.length - 2) }
}

/* la frase per il grande: i numeri, mai un giudizio sul bambino */
export function testoAvviso(nome, a) {
  const chi = nome || 'Il bambino'
  const elenco = a.quali.map(q => `«${q}»`).join(' e ') + (a.altre ? ` e altre ${a.altre}` : '')
  return a.motivo === 'persistono'
    ? `${chi} ha ancora difficoltà con ${elenco}, anche dopo la settimana in cui il gioco gliela ha spiegata prima. Dà un'occhiata a «Come va»: puoi provarla, spostarla più avanti o non chiedergliela più.`
    : `${chi} ha difficoltà con parecchie domande insieme (${elenco}): forse per ora sono tarate un po' troppo avanti. Dà un'occhiata a «Come va».`
}
