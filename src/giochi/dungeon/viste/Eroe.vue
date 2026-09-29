<script setup>
// La scheda dell'eroe: in cima restano solo i quattro numeri (vita, attacco,
// difesa, gemme) perché una fila di emoji per ogni oggetto spingeva fuori i
// numeri su un telefono stretto. Toccandoli si apre questa scheda, dove
// l'equipaggiamento ha spazio per dire anche cosa fa. Non decide niente.
defineProps({
  eroe: { type: Object, required: true },   // { vita, vitaMax, quota, attacco, difesa, polso }
  gemme: { type: Number, default: 0 },
  roba: { type: Array, default: () => [] },   // [{ em, nome, desc, dove }] — dove: 'in mano' | 'addosso' | null
})
defineEmits(['chiudi'])
</script>

<template>
  <div class="dng-velo" data-velo="eroe" @click="$emit('chiudi')">
    <div class="dng-scheda" @click.stop>
      <div class="dng-scheda-testa">
        <span class="dng-scheda-em em">🧝</span>
        <div class="dng-scheda-vita">
          <b>{{ eroe.vita }} / {{ eroe.vitaMax }}</b>
          <div class="dng-barra">
            <i :style="{ width: eroe.quota * 100 + '%', background: eroe.polso }"></i>
          </div>
        </div>
      </div>

      <div class="dng-numeroni">
        <div class="dng-numerone">
          <span class="em">⚔️</span>
          <b>{{ eroe.attacco }}</b>
          <i>quanto togli a ogni risposta giusta</i>
        </div>
        <div class="dng-numerone">
          <span class="em">🛡️</span>
          <b>{{ eroe.difesa }}</b>
          <i>quanto ti proteggi quando sbagli</i>
        </div>
        <div class="dng-numerone">
          <span class="em">💎</span>
          <b>{{ gemme }}</b>
          <i>da spendere dal mercante</i>
        </div>
      </div>

      <h4 class="dng-scheda-titolo">Quello che ti porti dietro</h4>
      <div v-if="roba.length" class="dng-zaino">
        <div v-for="r in roba" :key="r.nome" class="dng-oggetto" :data-oggetto="r.chiave">
          <span class="dng-em em">{{ r.em }}</span>
          <span class="dng-testo">
            <b>{{ r.nome }}</b>
            <i>{{ r.desc }}</i>
          </span>
          <span v-if="r.dove" class="dng-dove">{{ r.dove }}</span>
        </div>
      </div>
      <p v-else class="dng-zaino-vuoto">
        Ancora niente. Le armi le lasciano i mostri grossi 🐲 e gli scrigni 🎁.
      </p>

      <button class="dng-grosso" data-voce="chiudi-eroe" @click="$emit('chiudi')">
        <span class="em">🚪</span> torna al dungeon
      </button>
    </div>
  </div>
</template>
