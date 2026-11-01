<script setup>
// Il battesimo: un nome per la bestia appena presa. Prima si TOCCA (un bambino di quattro anni non sa scrivere): i nomi della fattoria di
// sempre per la sua famiglia (`nomiPer`); sotto, la casella per scriverne uno suo, come nella 2D. «Lascia così» tiene il nome della razza;
// si può cambiare quando si vuole dal foglio della bestia. ✕ in alto a destra. Vedi docs/fattoria3d/bestie-di-casa.md.
import { computed, ref } from 'vue'
import { curabile, nomiPer, pulisciNome, NOME_MAX } from '../dati/bestie.js'
import '../stile-bestia.css'

const props = defineProps({ id: { type: String, required: true }, scelto: { type: String, default: '' } })
const emit = defineEmits(['scegli', 'chiudi'])
const b = computed(() => curabile(props.id))
const nomi = computed(() => nomiPer(props.id))
// un nome scritto prima torna nella casella, uno della lista no (è già acceso sopra)
const scritto = ref(nomi.value.includes(props.scelto) ? '' : props.scelto)
const pronto = computed(() => pulisciNome(scritto.value))
function conferma() { if (pronto.value) emit('scegli', pronto.value) }
</script>

<template>
  <div class="f3-velo" data-f3="battesimo-velo" @click.self="emit('chiudi')">
    <div class="f3-foglio f3-colonna f3-bes f3-bat" data-f3="battesimo">
      <header class="f3-bes-asse"><span aria-hidden="true">{{ b.emoji }}</span><h2>Che nome gli diamo?</h2></header>
      <button class="f3-chiudi f3-bes-x" data-chiudi aria-label="chiudi" @click="emit('chiudi')">✕</button>
      <div class="f3-corpo f3-bes-corpo">
        <div class="f3-bat-nomi">
          <button v-for="n in nomi" :key="n" type="button" class="f3-bes-gesto" :class="{ sel: n === scelto && !pronto }" :data-nome="n" @click="emit('scegli', n)"><span>{{ n }}</span></button>
        </div>
        <form class="f3-bat-scrivi" @submit.prevent="conferma">
          <input v-model="scritto" data-f3="battesimo-scrivi" type="text" :maxlength="NOME_MAX" autocomplete="off" autocapitalize="words" spellcheck="false"
                 enterkeyhint="done" placeholder="…oppure scrivilo tu" aria-label="scrivi un nome">
          <button type="submit" class="f3-bes-az" data-azione="scrivi" :disabled="!pronto">✔ Va bene</button>
        </form>
        <div class="f3-bes-azioni">
          <button type="button" class="f3-bes-az" data-azione="lascia" @click="emit('scegli', '')">Lascia «{{ b.nome }}»</button>
        </div>
      </div>
    </div>
  </div>
</template>
