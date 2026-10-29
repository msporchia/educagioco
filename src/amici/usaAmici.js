// Gli amici in un gioco (docs/core/amici-bacheca.md): tutto quello che una schermata ha da mostrare, già deciso. Il gioco dichiara
// `amici` nel manifesto, chiama `usaAmici(chiave)` nel setup e sceglie solo dove mettere le cose (AmiciQui, RecordAmici, `davanti`).
import { computed, onMounted, reactive } from 'vue'
import { state } from '../store/profile.js'
import { amiciNelGioco, rileggiTutte } from './bacheca.js'
import { conAmici, dichiarazione, leggiGioco, davantiInParole, recordDegliAmici, controAmici, controAmiciInParole } from './istantanea.js'
import { sfideDi } from '../giochi/primati.js'

export function usaAmici(chiave) {
  const g = conAmici(chiave)
  if (!g) throw new Error(`«${chiave}» non dichiara «amici» nel manifesto (docs/core/amici-bacheca.md)`)
  const { tappe, dove } = dichiarazione(g)
  onMounted(rileggiTutte)                     // entrando si rilegge, se non lo si è fatto da poco

  const amici = computed(() => amiciNelGioco(chiave))
  // dove sono io, letto come lo legge l'istantanea: il confronto è sempre fra cose dette allo stesso modo
  const qui = computed(() => leggiGioco(state.profile, g)?.tappa ?? 0)
  const misura = sfida => sfideDi(g.senzaFine).find(s => (s.chiave || '') === (sfida || ''))?.misura
  const conRecord = sfida => amici.value.map(a => ({ ...a, record: a.primati?.[sfida || ''] || 0 }))

  // reattivo: nel template e nel codice `a.amici`, `a.davanti` sono già i valori
  return reactive({
    amici,
    tappe,                                    // il nodo della sfida senza fine (0: il gioco ha solo record)
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
