// Mette in moto gli amici per il bambino di turno (App.vue lo chiama a profilo pronto e quando cambia il bambino o un interruttore).
// Non aspetta e non lancia: gli amici sono un di più (docs/core/amici.md).
import { state, nomeCorrente, giocoAcceso } from '../store/profile.js'
import { carica, dati } from '../store/amici.js'
import { avvisaUnaVolta } from '../store/posta.js'
import { avvia, ferma } from './servizio.js'
import { avviaBacheca, fermaBacheca } from './bacheca.js'
import { avvisoPosta } from './testi.js'

export async function riavviaAmici() {
  try {
    fermaBacheca()                     // prima di cambiare bambino: una risposta in ritardo non finisce nelle sue amicizie
    if (!state.player) return ferma()
    await carica(state.player)
    // i profili che c'erano già non hanno mai risposto: spento, e il grande lo scopre dalla posta (non dalle novità dei bambini)
    if (!dati.deciso) avvisaUnaVolta(`amici:${state.player}`, avvisoPosta(nomeCorrente()), { testo: 'Apri le impostazioni', scheda: 'bambini', dove: 'amici' })
    avvia({ nome: nomeCorrente(), puoGiocare: giocoAcceso })
    avviaBacheca()
  } catch { /* gli amici non rompono mai niente */ }
}
