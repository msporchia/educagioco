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
   «tutto aperto», di chiuse non ce n'è nessuna — partite libere
   comprese, che sono un arco a tutti gli effetti: quattro tasti in
   fondo, uno per terreno, ognuno col suo record.
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
  /* le quattro partite libere, una per terreno, ognuna col suo record
     già in parole («12 ondate · 580 nemici fermati · 9 torri»):
     `[{ chiave, nome, emoji, primato }]`. Il record sta sul tasto,
     prima di entrare, perché è lì che si decide se riprovarci. Si
     aprono tutte insieme, a campagna finita (`libera`). */
  libere: { type: Array, default: () => [] },
  /* quanti potenziamenti definitivi si è già presi nelle partite libere
     (`REGALI` in `data/castello.js`): sono **uno** per il castello, non
     uno per terreno, e stanno sotto i quattro tasti perché sono l'altra
     cosa che ci si porta dietro da una partita all'altra — e a zero non
     si dice, che un contatore a zero su un tasto mai premuto non spiega
     niente */
  regali: { type: Number, default: 0 },
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
  <!-- ── le partite libere ──
       Quattro, una per terreno, e si aprono tutte insieme a campagna
       finita. Ognuna porta il suo record: quattro terreni non si
       confrontano fra loro, e un record solo direbbe di un terreno e
       tacerebbe degli altri. -->
  <template v-if="libera">
    <div class="arco libere">
      <span class="faccia">♾️</span>
      <b>Partite libere</b>
      <i v-if="regali" data-regali>🎁 {{ regali }}
        {{ regali === 1 ? 'potenziamento' : 'potenziamenti' }}</i>
    </div>
    <div class="tappe">
      <button v-for="l in libere" :key="l.chiave" class="tap" :data-tappa="l.chiave"
              @click="$emit('libera', l.chiave)">
        <span class="em">{{ l.emoji }}</span>
        <b>{{ l.nome }}</b>
        <i v-if="l.primato" class="record">record {{ l.primato }}</i>
        <i v-else>senza fine</i>
      </button>
    </div>
    <p v-if="regali" class="dote">I potenziamenti presi restano per sempre, su tutti i terreni</p>
  </template>
  <div class="riga">
    <button class="bottone chiaro" @click="$emit('indietro')">Indietro</button>
  </div>
</template>

<style scoped src="./mappa.css"></style>
