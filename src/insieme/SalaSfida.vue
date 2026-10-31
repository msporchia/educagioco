<script setup>
// La sala della sfida in due, uguale per ogni gioco (docs/core/insieme.md, «Un gioco nuovo in due»): crea una sfida, entra con un
// codice, invita un amico; poi il codice da dire, l'attesa, e cosa è andato storto. Non conosce la rete: la fase e il resto
// arrivano da `usaSfida` (sfida.js). Le scelte di chi crea (il terreno, il ritmo…) sono del gioco: le mette nello slot `scelte`,
// e può usare le classi `ins-scelte`, `ins-scelta`, `ins-scelta-su` e `ins-nota` per avere i tasti di tutti.
import { ref, computed, watch } from 'vue'

const props = defineProps({
  fase: { type: String, default: 'scelta' },      // scelta | creo | attesa | entro | accordo | errore | rotta
  codice: { type: String, default: '' },
  messaggio: { type: String, default: '' },        // l'errore o il motivo, già in parole da bambino
  amici: { type: Array, default: () => [] },       // [{ chiave, id, nome, online }]: solo se i grandi hanno acceso gli amici online
  invitato: { type: String, default: '' },         // il nome dell'amico che si aspetta, se si è invitato un amico invece di dare un codice
  scelto: { type: String, default: '' },           // la chiave di un amico già scelto dalla lista degli amici: si parte dalle scelte con lui
  partita: { type: String, default: 'la partita' },   // come la chiama il gioco: «la battaglia»
  spiega: { type: String, default: 'Due telefoni, la stessa partita. Serve internet su tutti e due.' },
  domanda: { type: String, default: 'Come giocate?' }, // il titolo delle scelte di chi crea
})
const emit = defineEmits(['crea', 'entra', 'indietro', 'invita'])

const modo = ref(null)                // null | 'crea' | 'entra'
const amico = ref(null)               // l'amico che si sta per invitare
const scritto = ref('')
const pulito = computed(() => scritto.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5))
const valido = computed(() => /^[A-Z]{5}$/.test(pulito.value))
const crea = () => (amico.value ? emit('invita', amico.value.chiave) : emit('crea'))
const scegliAmico = a => { amico.value = a; modo.value = 'crea' }
const indietroDalleScelte = () => { modo.value = null; amico.value = null }
// dalla lista degli amici («Gioca con…»): appena l'amico c'è ed è online, la sala salta al «Sfidi …», una volta sola (con
// «Indietro» si resta sulla scelta, anche se intanto la lista cambia)
let preso = ''
watch(() => [props.scelto, props.fase, props.amici], () => {
  const a = props.scelto !== preso && props.fase === 'scelta' && !modo.value && props.amici.find(x => x.chiave === props.scelto && x.online)
  if (a) { preso = props.scelto; scegliAmico(a) }
}, { immediate: true })
</script>

<template>
  <div class="ins-sala" data-sfida>
    <template v-if="fase === 'scelta'">
      <template v-if="!modo">
        <h2>⚔️ Sfida un amico</h2>
        <p>{{ spiega }}</p>
        <button class="bottone" data-sfida-crea @click="modo = 'crea'">Crea una sfida</button>
        <button class="bottone chiaro" data-sfida-entra @click="modo = 'entra'">Entra con un codice</button>
        <template v-if="amici.length">
          <h3 class="ins-amici" data-sfida-amici>Oppure invita un amico</h3>
          <button v-for="a in amici" :key="a.chiave" class="bottone chiaro" type="button" :disabled="!a.online"
                  :data-amico="a.id" @click="scegliAmico(a)">
            <span aria-hidden="true">{{ a.online ? '🟢' : '⚪' }}</span> {{ a.nome }}<small v-if="!a.online"> · non c'è</small>
          </button>
        </template>
      </template>
      <template v-else-if="modo === 'crea'">
        <h2 v-if="amico">Sfidi {{ amico.nome }}</h2>
        <h2>{{ domanda }}</h2>
        <slot name="scelte" />
        <button class="bottone" data-sfida-vai @click="crea">{{ amico ? `Invita ${amico.nome}` : 'Crea la sfida' }}</button>
        <button class="bottone chiaro" @click="indietroDalleScelte">Indietro</button>
      </template>
      <template v-else>
        <h2>Il codice del tuo amico</h2>
        <input v-model="scritto" class="ins-codice" data-sfida-codice-input type="text" inputmode="text" autocapitalize="characters"
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
        <p data-sfida-invitato>Gli è arrivato l'invito: appena dice di sì, {{ partita }} comincia da sola.</p>
      </template>
      <template v-else>
        <h2>Dì questo codice al tuo amico</h2>
        <div class="ins-codice-grande" data-codice>{{ codice }}</div>
        <p>Appena entra, {{ partita }} comincia da sola.</p>
      </template>
      <button class="bottone chiaro" data-sfida-indietro @click="emit('indietro')">Annulla</button>
    </template>

    <template v-else-if="fase === 'accordo'">
      <h2>Preparo {{ partita }}…</h2>
    </template>

    <template v-else>
      <h2>{{ fase === 'errore' ? 'Non ci riesco' : 'La sfida è finita qui' }}</h2>
      <p data-sfida-messaggio>{{ messaggio }}</p>
      <button class="bottone" data-sfida-indietro @click="emit('indietro')">Torna indietro</button>
    </template>
  </div>
</template>

<style>
/* non `scoped`: le classi dei tasti valgono anche per le scelte che il gioco mette nello slot */
.ins-sala { display: flex; flex-direction: column; gap: 12px; padding: 18px 16px; align-items: stretch; text-align: center }
.ins-sala h2 { margin: 6px 0 0; font-size: 20px }
.ins-sala p { margin: 0; color: #5a574d }
.ins-nota { font-size: 14px }
.ins-scelte { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center }
.ins-scelta { flex: 1 1 40%; min-height: 44px; padding: 8px 6px; border: 2px solid #c9c2b0; border-radius: 12px; background: #fff;
              color: #3c3a33; font: inherit; font-weight: 700; touch-action: manipulation }
.ins-scelta-su { border-color: #7a5cf0; background: #7a5cf0; color: #fff }
.ins-codice { font: 700 32px/1.2 "Emoji Gioco", ui-monospace, monospace; letter-spacing: 8px; text-align: center; text-transform: uppercase;
              padding: 10px; border: 2px solid #c9c2b0; border-radius: 12px }
.ins-codice-grande { font: 800 46px/1.2 "Emoji Gioco", ui-monospace, monospace; letter-spacing: 10px; padding: 14px; border: 3px dashed #7a5cf0;
                     border-radius: 14px; background: #fff; color: #5b3fc8; user-select: all }
</style>
