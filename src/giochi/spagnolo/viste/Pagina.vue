<script setup>
/* La pagina di un concetto (motore/concetti.js `paginaDi`): il titolo, la
   regola in una frase, due esempi con quello che cambia colorato, e «Ho
   capito». Nessuna attesa: si legge quanto serve. Quando torna dopo gli
   sbagli (`ripresa`) dice anche la frase appena sbagliata. Le parole
   spagnole si toccano (gratis). Vedi docs/lingue/concetti.md. */
import Testo from './Testo.vue'

defineProps({
  p: { type: Object, required: true },        // { concetto, titolo, spiega, esempi: [{ pezzi, it }], ripresa, giustaEra }
  pronta: { type: Boolean, default: true },   // passata la finestra cieca: il tocco di prima non vale
})
defineEmits(['capito', 'tocca'])
</script>

<template>
  <div class="ing-concetto" data-pagina :data-concetto="p.concetto" :data-ripresa="p.ripresa ? '1' : '0'">
    <div v-if="p.ripresa" class="ing-concetto-sopra">Aspetta, te lo spiego meglio</div>
    <h2 class="ing-concetto-titolo">{{ p.titolo }}</h2>
    <p class="ing-concetto-spiega">{{ p.spiega }}</p>
    <div class="ing-concetto-esempi">
      <div v-for="(e, i) in p.esempi" :key="i" class="ing-concetto-esempio" data-esempio>
        <div class="ing-concetto-en"><template v-for="(x, j) in e.pezzi" :key="j"><b v-if="x.forte" data-forte
          class="ing-concetto-forte"><Testo :testo="x.testo" @tocca="el => $emit('tocca', el)" /></b><Testo v-else
          :testo="x.testo" @tocca="el => $emit('tocca', el)" /></template></div>
        <div class="ing-concetto-it">{{ e.it }}</div>
      </div>
    </div>
    <div v-if="p.giustaEra" class="ing-era" data-giusta-era>Si dice: <b>{{ p.giustaEra }}</b></div>
    <button type="button" class="ing-grosso" data-azione="capito" :disabled="!pronta"
            @click="pronta && $emit('capito')">Ho capito</button>
  </div>
</template>
