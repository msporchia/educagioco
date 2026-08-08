<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA SCHEDA DELL'EROE — chi sei e cosa ti porti dietro

   Nasce da un problema di spazio che era diventato un problema di
   leggibilità: nella fascia in cima stavano vita, attacco, difesa,
   gemme **e** una fila di emoji che cresceva a ogni oggetto raccolto.
   Su un telefono da 390 punti quella fila spingeva fuori il resto, e i
   pezzi cominciavano a sparire — cioè proprio i numeri che servono a
   decidere.

   Quindi in cima restano i quattro numeri, e **si toccano**: da lì si
   apre questa scheda, dove l'equipaggiamento ha lo spazio per dire
   anche cosa fa. È il posto dove un bambino va a chiedersi «ma la
   lanterna a cosa serviva?» tre stanze dopo averla presa — che è
   esattamente quando se lo chiede.

   Non decide niente e non tocca il motore: riceve com'è messo l'eroe e
   lo mostra.
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  /* { vita, vitaMax, quota, attacco, difesa, polso } */
  eroe: { type: Object, required: true },
  gemme: { type: Number, default: 0 },
  /* [{ em, nome, desc, dove }] — dove: 'in mano' | 'addosso' | null */
  roba: { type: Array, default: () => [] },
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

      <!-- i due numeri che contano, con scritto cosa vogliono dire:
           «attacco 8» da solo non dice niente a chi ha sei anni -->
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
