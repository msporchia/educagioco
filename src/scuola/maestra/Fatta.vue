<script setup>
// Una scelta già fatta, richiusa in una riga: cosa si è scelto e «Cambia», che la riapre. Le scelte fatte si accumulano così,
// una sotto l'altra, sopra quella da fare (scelta dell'utente: «presa una decisione si accumulano sopra, compatte»).
// docs/scuola/editor.md
const props = defineProps({
  etichetta: { type: String, required: true },
  valore: { type: String, required: true },
  immagine: { type: String, default: '' },     // un disegno piccolo (l'icona del gioco)
  passo: { type: String, required: true },     // il bersaglio dei test: data-fatta="<passo>"
})
const emit = defineEmits(['cambia'])
</script>

<template>
  <div class="fatta" :data-fatta="props.passo">
    <!-- il posto del disegno c'è sempre, così le righe di un blocco hanno i valori allineati -->
    <img v-if="props.immagine" :src="props.immagine" alt="" class="ico">
    <span v-else class="ico" aria-hidden="true"></span>
    <span class="nome-scelta">{{ props.etichetta }}</span>
    <b class="valore">{{ props.valore }}</b>
    <button type="button" class="cambia" :data-cambia="props.passo" @click="emit('cambia')">Cambia</button>
  </div>
</template>

<style scoped>
.fatta { display:flex; align-items:center; gap:10px; min-height:40px; padding:6px 10px; border-radius:var(--raggio-piccolo);
         background:var(--penna-chiara, var(--tessera)) }
.ico { width:28px; height:28px; border-radius:7px; object-fit:cover; flex:none }
.nome-scelta { flex:none; font-size:12px; color:var(--grigio); width:150px }
.valore { flex:1; min-width:0; font-size:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
.cambia { flex:none; padding:4px 10px; border-radius:999px; border:1px solid var(--filo); background:var(--superficie); font:inherit;
          font-size:12px; font-weight:600; color:var(--penna, var(--inchiostro)); cursor:pointer }
@media (max-width:520px) { .nome-scelta { display:none } }
</style>
