<script setup>
// Chi sei? I nomi della classe come tasti; un nome preso da un altro è grigio. docs/scuola/bambini.md
import { ref, nextTick } from 'vue'

defineProps({
  alunni: { type: Array, default: () => [] },   // [{ id, nome, preso }] dallo `stato` del servizio
  scelgo: { type: Boolean, default: false },    // un nome è partito e si aspetta la risposta
  avviso: { type: String, default: '' },
})
const emit = defineEmits(['scegli', 'nuovo', 'cambia'])
const scrivendo = ref(false)
const nome = ref('')
const campo = ref(null)

async function nonTrovo() {
  scrivendo.value = true
  await nextTick()
  campo.value?.focus()
}
function manda() {
  const n = nome.value.replace(/\s+/g, ' ').trim()
  if (n) emit('nuovo', n)
}
</script>

<template>
  <div class="centro nomi">
    <h2>Chi sei? Tocca il tuo codice</h2>
    <div class="elenco" data-nomi>
      <button v-for="a in alunni" :key="a.id" type="button" class="nome" :class="{ preso: a.preso }"
              :data-nome="a.id" :data-preso="a.preso ? '' : null" :disabled="a.preso || scelgo"
              @click="emit('scegli', a.id)">{{ a.nome }}</button>
    </div>
    <p v-if="scelgo" class="testo" data-scelgo>Un momento…</p>
    <p v-if="avviso" class="avviso-nome" data-nome-avviso>{{ avviso }}</p>

    <button v-if="!scrivendo" type="button" class="bottone chiaro" data-non-trovo @click="nonTrovo">Non trovo il mio codice</button>
    <form v-else class="nuovo" @submit.prevent="manda">
      <label class="testo" for="nome-nuovo">Scrivi il codice che ti ha dato la maestra</label>
      <input id="nome-nuovo" ref="campo" v-model="nome" class="campo" data-nome-nuovo maxlength="24"
             autocomplete="off" spellcheck="false">
      <button type="submit" class="bottone" data-nome-nuovo-manda :disabled="!nome.trim() || scelgo">Sono io</button>
    </form>

    <button type="button" class="link" data-cambia-codice @click="emit('cambia')">Ho sbagliato codice</button>
  </div>
</template>

<style scoped>
.nomi h2 { font-size: 22px }
.elenco {
  width: 100%; max-width: 960px;
  display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 10px;
}
.nome {
  min-height: 60px; padding: 10px 14px; overflow-wrap: anywhere;
  font-size: 20px; font-weight: 600; color: var(--inchiostro);
  background: var(--superficie); border-radius: var(--raggio); box-shadow: inset 0 0 0 1px var(--filo), var(--ombra);
}
.nome:not(:disabled):hover { box-shadow: inset 0 0 0 2px var(--accento), var(--ombra) }
.nome:not(:disabled):active { transform: scale(.98) }
.nome:disabled { cursor: default }
.nome.preso { color: var(--grigio); background: var(--tessera); box-shadow: none }
.avviso-nome { font-size: 17px; color: var(--inchiostro); max-width: var(--colonna) }
.nuovo { width: 100%; max-width: var(--colonna); display: flex; flex-direction: column; align-items: center; gap: 10px }
.campo {
  width: 100%; padding: 12px 14px; font: inherit; font-size: 22px; text-align: center;
  color: var(--inchiostro); background: var(--superficie); border: 2px solid var(--filo); border-radius: var(--raggio);
  outline: none;
}
.campo:focus { border-color: var(--accento) }
.nomi .link { font-size: 14px }
</style>
