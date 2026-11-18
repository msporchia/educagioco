// A scuola non si gioca in due (docs/scuola/giochi.md): la sfida esiste ma non si apre mai, e nessun collegamento parte
import { ref, shallowRef, computed } from 'vue'

export const ASPETTA_A_DIRLO = 1.5

export function usaSfida() {
  const stato = ref('')
  return {
    regia: shallowRef(null), stato, motivo: ref(''), codice: ref(''), invitato: ref(''), scelto: ref(''), linea: ref(''),
    fase: computed(() => 'scelta'), messaggio: computed(() => ''), rotta: computed(() => false), amici: computed(() => []),
    inDue: () => false,
    apri() {}, async crea() {}, async invita() {}, entra() {}, daInvito: () => false, chiudi() {}, avanza() {},
  }
}
