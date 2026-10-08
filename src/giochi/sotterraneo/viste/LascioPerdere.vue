<script setup>
// «Lascio perdere questa discesa»: detto prima, mai dopo (docs/sotterraneo/portale-e-sosta.md, «Il portale e l'uscita»). La
// frase è una sola per i due posti da cui si lascia — la carta in cima alla terra di sopra e il velo della pausa
// in discesa — così non si può leggere in due modi: la roba resta, la discesa ricomincia da capo.
defineProps({
  nome: { type: String, default: '' },    // la discesa che si lascia
  giu: { type: Boolean, default: false },  // sei ancora là sotto: lasciarla vuol dire anche risalire
})
defineEmits(['si', 'no'])
</script>

<template>
  <!-- una scelta che costa: non si chiude toccando fuori, si risponde (docs/core/interfaccia.md) -->
  <div class="sot-velo" data-lascio-perdere>
    <div class="sot-modale">
      <h2><span class="em">⚠️</span> Lasci perdere questa discesa?</h2>
      <p>
        <template v-if="giu">Risali sulla terra di sopra con quello che hai addosso e nello zaino: resta tutto tuo.</template>
        <template v-else>Quello che hai addosso e nello zaino resta tuo.</template>
        Ma <b>{{ nome.toLowerCase() }}</b> ricomincia da capo, la prossima volta: i piani già girati e i mostri già
        battuti si rifanno.
      </p>
      <button class="sot-grosso" data-azione="scorda-si" @click="$emit('si')">
        {{ giu ? 'sì, risalgo' : 'sì, lascio perdere' }}
      </button>
      <button class="sot-grosso sot-chiaro" data-azione="scorda-no" @click="$emit('no')">
        no, tengo la discesa
      </button>
    </div>
  </div>
</template>
