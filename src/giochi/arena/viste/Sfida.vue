<script setup>
// La sfida in due, prima della battaglia: chi crea sceglie terreno e quanto andare veloce e riceve un codice di cinque lettere,
// chi entra lo scrive. Non conosce la rete: riceve la fase già decisa da Gioco.vue (docs/arena/multigiocatore.md).
import { ref, computed } from 'vue'

const props = defineProps({
  fase: { type: String, default: 'scelta' },      // scelta | creo | attesa | entro | accordo | errore | rotta
  codice: { type: String, default: '' },
  messaggio: { type: String, default: '' },        // l'errore o il motivo, già in parole da bambino
  terreni: { type: Array, default: () => [] },     // [{ chiave, nome, icona }]
  amici: { type: Array, default: () => [] },       // [{ chiave, id, nome, online, gioco }]: solo se i grandi hanno acceso gli amici online
  invitato: { type: String, default: '' },         // il nome dell'amico che si aspetta, se si è invitato un amico invece di dare un codice
})
const emit = defineEmits(['crea', 'entra', 'indietro', 'invita'])
const amico = ref(null)               // l'amico che si sta per invitare

const modo = ref(null)                // null | 'crea' | 'entra'
const terreno = ref(props.terreni[0]?.chiave || 'bosco')
// quanto ci mette un bambino a rispondere: le monete corrono in proporzione (docs/arena/multigiocatore.md)
const RITMI = [
  { chiave: 'piano', icona: '🐢', nome: 'Più piano', secondi: 15 },
  { chiave: 'normale', icona: '⚖️', nome: 'Normale', secondi: 10 },
  { chiave: 'svelto', icona: '🐇', nome: 'Svelto', secondi: 6 },
]
const ritmo = ref('normale')
const scritto = ref('')
const pulito = computed(() => scritto.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5))
const valido = computed(() => /^[A-Z]{5}$/.test(pulito.value))
const secondi = () => RITMI.find(r => r.chiave === ritmo.value).secondi
const crea = () => (amico.value
  ? emit('invita', { chiave: amico.value.chiave, terreno: terreno.value, secondi: secondi() })
  : emit('crea', { terreno: terreno.value, secondi: secondi() }))
const scegliAmico = a => { amico.value = a; modo.value = 'crea' }
const indietroDalleScelte = () => { modo.value = null; amico.value = null }
</script>

<template>
  <div class="ar-sfida" data-sfida>
    <template v-if="fase === 'scelta'">
      <template v-if="!modo">
        <h2>⚔️ Sfida un amico</h2>
        <p>Due telefoni, la stessa battaglia: tu contro tuo fratello o tua sorella. Serve internet su tutti e due.</p>
        <button class="bottone" data-sfida-crea @click="modo = 'crea'">Crea una sfida</button>
        <button class="bottone chiaro" data-sfida-entra @click="modo = 'entra'">Entra con un codice</button>
        <template v-if="amici.length">
          <h3 class="ar-sfida-amici" data-sfida-amici>Oppure invita un amico</h3>
          <button v-for="a in amici" :key="a.chiave" class="bottone chiaro" type="button" :disabled="!a.online"
                  :data-amico="a.id" @click="scegliAmico(a)">
            <span aria-hidden="true">{{ a.online ? '🟢' : '⚪' }}</span> {{ a.nome }}<small v-if="!a.online"> · non c'è</small>
          </button>
        </template>
      </template>
      <template v-else-if="modo === 'crea'">
        <h2>{{ amico ? `Sfidi ${amico.nome}: dove?` : 'Dove vi sfidate?' }}</h2>
        <div class="ar-sfida-scelte" role="group" aria-label="Terreno">
          <button v-for="t in terreni" :key="t.chiave" type="button" class="ar-livello" :class="{ 'ar-livello-su': t.chiave === terreno }"
                  :data-terreno="t.chiave" :aria-pressed="t.chiave === terreno" @click="terreno = t.chiave"><span class="em">{{ t.icona }}</span> {{ t.nome }}</button>
        </div>
        <h2>Quanto andate veloci?</h2>
        <p class="ar-sfida-nota">Quanto ci mettete a rispondere a un conto: le monete corrono di conseguenza.</p>
        <div class="ar-sfida-scelte" role="group" aria-label="Velocità">
          <button v-for="r in RITMI" :key="r.chiave" type="button" class="ar-livello" :class="{ 'ar-livello-su': r.chiave === ritmo }"
                  :data-ritmo="r.chiave" :aria-pressed="r.chiave === ritmo" @click="ritmo = r.chiave"><span class="em">{{ r.icona }}</span> {{ r.nome }}</button>
        </div>
        <button class="bottone" data-sfida-vai @click="crea">{{ amico ? `Invita ${amico.nome}` : 'Crea la sfida' }}</button>
        <button class="bottone chiaro" @click="indietroDalleScelte">Indietro</button>
      </template>
      <template v-else>
        <h2>Il codice del tuo amico</h2>
        <input v-model="scritto" class="ar-sfida-codice" data-sfida-codice-input type="text" inputmode="text" autocapitalize="characters"
               autocomplete="off" spellcheck="false" maxlength="5" placeholder="KXRNM" aria-label="Codice della sfida" />
        <button class="bottone" data-sfida-vai :disabled="!valido" @click="emit('entra', pulito)">Entra</button>
        <button class="bottone chiaro" @click="modo = null">Indietro</button>
      </template>
    </template>

    <template v-else-if="fase === 'creo' || fase === 'entro'">
      <h2>{{ fase === 'creo' ? 'Preparo la stanza…' : 'Entro nella stanza…' }}</h2>
    </template>

    <template v-else-if="fase === 'attesa'">
      <template v-if="invitato">
        <h2>Aspetto {{ invitato }}…</h2>
        <p data-sfida-invitato>Gli è arrivato l'invito: appena dice di sì, la battaglia comincia da sola.</p>
      </template>
      <template v-else>
        <h2>Dì questo codice al tuo amico</h2>
        <div class="ar-sfida-codice-grande" data-codice>{{ codice }}</div>
        <p>Appena entra, la battaglia comincia da sola.</p>
      </template>
      <button class="bottone chiaro" data-sfida-indietro @click="emit('indietro')">Annulla</button>
    </template>

    <template v-else-if="fase === 'accordo'">
      <h2>Preparo la battaglia…</h2>
    </template>

    <template v-else>
      <h2>{{ fase === 'errore' ? 'Non ci riesco' : 'La sfida è finita qui' }}</h2>
      <p data-sfida-messaggio>{{ messaggio }}</p>
      <button class="bottone" data-sfida-indietro @click="emit('indietro')">Torna indietro</button>
    </template>
  </div>
</template>
