// Dice a un grande che una domanda va male, quando non basta quello che fa già il gioco (quiz/allarme.js: le soglie e il perché).
// Si guarda all'avvio e cambiando bambino, come il compleanno (store/compleanno.js); un solo messaggio ogni due settimane per bambino.
import { state, nomeCorrente, sapereAcceso } from './profile.js'
import { fasceDelBambino } from '../quiz/catalogo.js'
import { andamentoDi } from '../quiz/andamento.js'
import { settimanaDi } from '../quiz/comeva.js'
import { chiAvvisare, testoAvviso } from '../quiz/allarme.js'
import { avvisiDifficolta, avvisaDifficolta, ultimoAvvisoDifficolta, segnaAvvisoDifficolta } from './posta.js'

export async function controllaDifficolta(now = Date.now()) {
  try {
    if (!state.player || !state.profile || !avvisiDifficolta.value) return null
    const items = state.profile.items || {}
    const righe = fasceDelBambino().flatMap(f => f.righe)
    const { viste } = andamentoDi(righe, items)
    const { difficili } = settimanaDi({ righe: viste, items, prima: null, vaBene: state.profile.settings.vaBene || {},
                                         alleggerite: state.profile.settings.alleggerite || {}, voci: [], now })
    const a = chiAvvisare({ viste, difficili: difficili.filter(r => sapereAcceso(r.tipo)), alleggerite: state.profile.settings.alleggerite || {},
                            items, ultimo: await ultimoAvvisoDifficolta(state.player), now, attivo: avvisiDifficolta.value })
    if (!a) return null
    await segnaAvvisoDifficolta(state.player, now)
    await avvisaDifficolta(testoAvviso(nomeCorrente(), a), { testo: 'Vai a «Come va»', scheda: 'comeva' })
    return a.motivo
  } catch { return null }     // un avviso in più non rompe mai niente
}
