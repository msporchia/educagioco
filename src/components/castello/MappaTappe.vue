<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA MAPPA DELLE TAPPE

   La prima schermata: quattro campagne da cinque tappe, ognuna con il
   suo percorso, un numero preciso di ondate e le torri che mette a
   disposizione. Le quattro operazioni entrano una per volta, con tappe
   di consolidamento in mezzo. Vinta l'ultima si apre la partita libera,
   senza fine.

   ── perché le campagne si vedono ──
   Per un pezzo qui c'era una fila sola, venti tappe una dietro
   l'altra: i tre archi esistevano nei dati e sul campo — il bosco
   perdona, le mura no — ma su questa schermata non li vedeva nessuno.
   Con quindici tappe era un peccato, con venti diventa un elenco.
   Adesso ogni arco ha il suo titolo, la sua faccia e il conto di quante
   ne restano: si vede che il Sotterraneo è un capitolo nuovo e non il
   sesto gradino della stessa scala.

   Una tappa chiusa resta visibile: sapere cosa c'è dopo è metà del
   motivo per finire quella di adesso. E se i genitori hanno acceso
   «tutto aperto», di chiuse non ce n'è nessuna — partita libera
   compresa, che è una campagna a tutti gli effetti.
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'
import { TORRI } from '../../data/ops.js'
import { CAMPAGNE } from '../../data/campagne-castello.js'
import { tappaAperta } from '../../store/profile.js'
import { apertaQui } from '../../data/portata-giochi.js'

const props = defineProps({
  tappe: { type: Array, required: true },
  fatte: { type: Number, default: 0 },      // quante ne ha già superate
  libera: { type: Boolean, default: false },
})
defineEmits(['gioca', 'libera', 'indietro'])

/* il lucchetto lo toglie anche l'interruttore dei genitori
   (`settings.tuttoAperto`): con quindici tappe, provare il gioco senza
   quel flag vorrebbe dire giocarsele tutte in fila */
/* Il lucchetto guarda anche l'età: le tappe che questo bambino ha già
   passato nascono aperte, quelle troppo avanti restano chiuse
   (`data/portata.js`, il campo `portata` su ogni tappa). */
const aperta = i => apertaQui(props.tappe[i], i, props.fatte)

/* Le tappe arrivano già in fila, con dentro la loro campagna: qui si
   rimettono in archi senza perdere l'indice globale, che è quello che
   il profilo salva e che il numero mostra. */
const archi = computed(() => {
  const out = []
  props.tappe.forEach((T, i) => {
    const ultimo = out[out.length - 1]
    if (!ultimo || ultimo.id !== T.campagna) {
      const c = CAMPAGNE.find(x => x.id === T.campagna)
      out.push({ id: T.campagna, nome: c ? c.nome : '', emoji: c ? c.emoji : '', tappe: [] })
    }
    out[out.length - 1].tappe.push({ T, i })
  })
  return out
})

/* quante ne ha già finite di questo arco: il conto che dice a colpo
   d'occhio se un capitolo è chiuso o appena cominciato */
const fatteDi = arco => arco.tappe.filter(({ i }) => i < props.fatte).length
</script>

<template>
  <h2>Difendi il castello</h2>
  <p class="testo">I nemici fermati lasciano ⚡. Con l'energia si costruisce una
    torre, oppure — spendendo meno — si tocca una torre già in campo per farla
    salire di livello con un calcolo più difficile. L'ondata parte quando la
    chiami tu: il tempo per fare i conti è tutto tuo.</p>
  <template v-for="arco in archi" :key="arco.id">
    <div class="arco" :class="{ finito: fatteDi(arco) === arco.tappe.length }">
      <span class="faccia">{{ arco.emoji }}</span>
      <b>{{ arco.nome }}</b>
      <i>{{ fatteDi(arco) }}/{{ arco.tappe.length }}</i>
    </div>
    <div class="tappe">
      <button v-for="{ T, i } in arco.tappe" :key="i" class="tap"
              :class="{ fatta: i < fatte, chiusa: !aperta(i) }"
              :disabled="!aperta(i)" @click="$emit('gioca', i)">
        <span class="em">{{ aperta(i) ? T.emoji : '🔒' }}</span>
        <b>{{ i + 1 }}. {{ T.nome }}</b>
        <i>{{ T.ondate }} ondate ·
          <template v-for="k in T.torri" :key="k">{{ TORRI[k].emoji }}</template>
        </i>
        <span v-if="i < fatte" class="spunta">✔</span>
      </button>
    </div>
  </template>
  <div class="riga">
    <button v-if="libera" class="bottone" @click="$emit('libera')">Partita libera ♾️</button>
    <button class="bottone chiaro" @click="$emit('indietro')">Indietro</button>
  </div>
</template>

<style scoped src="./mappa.css"></style>
