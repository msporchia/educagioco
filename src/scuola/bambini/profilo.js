/* Il profilo di casa per i giochi veri a scuola: uno per alunno, in memoria (l'archivio è il sostituto), muto e con la
   grafica leggera. Lo stesso alunno lo tiene fra obiettivo e «dopo», un altro riparte da zero. Vedi docs/scuola/bambini.md */
import { watch } from 'vue'
import { state, creaGiocatore, accendiSuono, festaVista } from '../../store/profile.js'
import { scegliFascia } from '../../store/qualita.js'

let alunno = null
let pronto = null          // la promessa del profilo di quell'alunno
let festaSpenta = false

async function nuovo(nome) {
  await creaGiocatore(String(nome || '').trim() || 'Bambino')
  accendiSuono(false)
  await scegliFascia('bassa')
  return state.player
}

export function bambinoInMemoria(alunnoId, nome) {
  // la festa dei traguardi a casa la mostra e la svuota App.vue; qui nessuno lo fa, e piena fermerebbe il gioco (giochi/pausa.js)
  if (!festaSpenta) { festaSpenta = true; watch(() => state.festa.length, n => { if (n) festaVista() }, { flush: 'sync' }) }
  if (alunno !== alunnoId || !pronto) { alunno = alunnoId; pronto = nuovo(nome) }
  return pronto
}
