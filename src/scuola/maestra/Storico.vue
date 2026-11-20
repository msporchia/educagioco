<script setup>
// Lo storico di una classe: le lezioni fatte con la data, e i bambini (ognuno col suo storico)
import { computed } from 'vue'
import { quaderno, classeDi } from './stato.js'
import { vociDellaClasse } from './quaderno.js'
import { giorno, iniziali, coloreDi } from './utili.js'

const props = defineProps({ classe: { type: String, required: true } })
const emit = defineEmits(['vai', 'indietro'])
const voci = computed(() => vociDellaClasse(quaderno, props.classe))
const c = computed(() => classeDi(props.classe))
const nome = computed(() => c.value?.nome ?? voci.value[0]?.nomeClasse ?? '')
// gli alunni di oggi; se la classe è cancellata, quelli delle sue lezioni (senza i «nuovi»)
const alunni = computed(() => {
  if (c.value) return c.value.alunni
  const m = new Map()
  for (const v of voci.value) for (const a of v.alunni) if (!a.nuovo && !m.has(a.id)) m.set(a.id, a)
  return [...m.values()]
})
const presenti = v => v.alunni.filter(a => v.esiti[a.id]?.presente).length
const inCorso = v => quaderno.inCorso?.voce === v.id
</script>

<template>
  <section class="carta" data-storico-di="classe">
    <h1>{{ nome || 'Senza nome' }}</h1>
    <h2>Le lezioni fatte</h2>
    <p v-if="!voci.length" class="nota">Questa classe non ha ancora fatto lezioni.</p>
    <ul v-else class="elenco">
      <li v-for="v in voci" :key="v.id" :data-voce="v.id">
        <span class="cosa"><b>{{ v.lezione.nome }}</b>
          <span class="nota">{{ giorno(v.avviata) }}, {{ presenti(v) }} bambini{{ inCorso(v) ? ', in corso' : '' }}</span></span>
        <button class="bottone chiaro piccolo" data-azione="apri-resoconto" @click="emit('vai', 'resoconto', { voce: v.id })">Resoconto</button>
      </li>
    </ul>
  </section>

  <section v-if="voci.length" class="carta">
    <h2>Bambino per bambino</h2>
    <div class="fila">
      <button v-for="a in alunni" :key="a.id" class="tessera bimbo" :data-alunno="a.id"
              @click="emit('vai', 'bambino', { classe: props.classe, alunno: a.id })">
        <span class="iniziali" :style="{ '--colore': coloreDi(a.nome) }" aria-hidden="true">{{ iniziali(a.nome) }}</span>{{ a.nome }}</button>
    </div>
  </section>
</template>

<style scoped>
.bimbo { display:inline-flex; align-items:center; gap:8px; padding:6px 12px 6px 6px; border-radius:999px }
</style>
