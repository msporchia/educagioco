// Gli amici in un gioco (docs/core/amici-bacheca.md): tutto quello che una schermata ha da mostrare, già deciso. Il gioco dichiara
// `amici` nel manifesto, chiama `usaAmici(chiave)` nel setup (`usaAmici(chiave, { percorso })` per una mappa di un gioco che ne ha
// più d'una) e sceglie solo dove mettere le cose (AmiciQui, RecordAmici, `davanti`).
import { computed, onMounted, reactive } from 'vue'
import { state } from '../store/profile.js'
import { amiciNelGioco, rileggiTutte } from './bacheca.js'
import { conAmici, percorsoDi, davantiInParole, recordDegliAmici, controAmici, controAmiciInParole } from './istantanea.js'
import { sfideDi } from '../giochi/primati.js'

export function usaAmici(chiave, { percorso = '' } = {}) {
  const g = conAmici(chiave)
  if (!g) throw new Error(`«${chiave}» non dichiara «amici» nel manifesto (docs/core/amici-nei-giochi.md)`)
  const via = percorsoDi(g, percorso)
  if (percorso && !via) throw new Error(`«${chiave}» non dichiara il percorso «${percorso}»`)
  const tappe = via?.tappe || 0, dove = via?.dove || ''
  onMounted(rileggiTutte)                     // entrando si rilegge, se non lo si è fatto da poco

  // tutti, per i record; sulla mappa solo chi in questo percorso ha un posto, che diventa la sua `tappa`
  const tutti = computed(() => amiciNelGioco(chiave))
  const amici = computed(() => tutti.value.filter(a => a.posti?.[via?.chiave ?? ''] > 0).map(a => ({ ...a, tappa: a.posti[via.chiave] })))
  // dove sono io, letto come lo legge l'istantanea: il confronto è sempre fra cose dette allo stesso modo
  const qui = computed(() => (via ? via.tappa(state.profile) : 0))
  const misura = sfida => sfideDi(g.senzaFine).find(s => (s.chiave || '') === (sfida || ''))?.misura
  const conRecord = sfida => tutti.value.map(a => ({ ...a, tappa: a.posti?.[via?.chiave ?? ''] || 0, record: a.primati?.[sfida || ''] || 0 }))

  // reattivo: nel template e nel codice `a.amici`, `a.davanti` sono già i valori
  return reactive({
    amici,
    tappe,                                    // il nodo della sfida senza fine (0: il gioco, o il percorso, ha solo record)
    qui,
    // «Leonardo è 2 tappe più avanti di te.»: il più vicino fra quelli avanti; chi è dietro non si dice
    davanti: computed(() => (tappe ? davantiInParole(amici.value, qui.value, { ultimo: tappe, dove }) : '')),
    // chi è arrivato a quel nodo della mappa
    sullaTappa: nodo => amici.value.filter(a => a.tappa === nodo),
    // chi è alla sfida senza fine e non ha ancora un record di quella sfida (chi l'ha, sta nei record)
    allaFine: (sfida = null) => (tappe ? conRecord(sfida).filter(a => a.tappa >= tappe && !a.record) : []),
    // i record degli amici in quella sfida, dal più alto, in parole
    record: (sfida = null) => recordDegliAmici(conRecord(sfida), misura(sfida)),
    // a fine partita: «Hai superato Leonardo (3:10)!» o quanto è mancato al prossimo; `prima` è il record di prima
    contro: (valore, prima, sfida = null) => controAmiciInParole(controAmici(valore, prima, conRecord(sfida)), misura(sfida)),
  })
}
