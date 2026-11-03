<script setup>
// Dentro una bottega del paese, la parte che si tocca (docs/fattoria3d/botteghe.md, «Dentro»): l'insegna coi cuori della fama, «Esci», i
// fumetti sopra i clienti (cosa vogliono, quanti ne hai; verde se hai tutto) e sopra i posti vuoti (fra quanto arriva qualcuno), e il tasto
// per il foglio con tutti i clienti. I fumetti li mette al loro posto la scena (`[data-fumetto-posto]`): qui si scrive cosa c'è dentro.
import Faccia from './Faccia.vue'
import '../stile-casa.css'

defineProps({
  bottega: { type: Object, default: null },        // motore.vistaBottega(tipo)
  fumetti: { type: Array, default: () => [] },     // bottega-dentro.js: un fumetto per bancone
})
defineEmits(['esci', 'elenco', 'servi'])
</script>

<template>
  <div class="f3-int f3-btd" data-f3="bottega-dentro" :data-bottega="bottega && bottega.tipo">
    <header class="f3-int-testa">
      <span class="f3-int-titolo" v-if="bottega">
        {{ bottega.emoji }} {{ bottega.nome }}
        <small class="cuori" :aria-label="'cuori ' + bottega.fama.cuori + ' su ' + bottega.fama.di">{{ '❤️'.repeat(bottega.fama.cuori) }}{{ '🤍'.repeat(Math.max(0, bottega.fama.di - bottega.fama.cuori)) }}</small>
      </span>
      <button class="f3-int-esci" data-f3="esci-bottega" @click="$emit('esci')">🚪 Esci</button>
    </header>

    <div class="f3-btd-fumetti">
      <template v-for="f in fumetti" :key="f.k + ':' + (f.id || 'vuoto')">
        <button v-if="f.id && f.qui" class="f3-btd-fumetto" :class="{ pronto: f.pronto }" :data-fumetto-posto="f.k" data-f3="fumetto-cliente" :data-cliente="f.id" :data-pronto="f.pronto"
                :aria-label="f.cliente.nome" @click="$emit('servi', f.k)">
          <span class="merci">
            <span v-for="c in f.chiede" :key="c.k" class="merce">
              <Faccia :k="c.k" :emoji="c.emoji" :lato="34" />
              <b :class="c.manca ? 'manca' : 'ok'">{{ c.manca ? c.ha + '/' + c.n : '✓ ' + c.n }}</b>
            </span>
          </span>
          <small>+{{ f.xp }} ⭐</small>
        </button>
        <span v-else-if="f.attesa" class="f3-btd-fumetto vuoto" :data-fumetto-posto="f.k" data-vuoto="1" data-f3="posto-vuoto" :data-minuti="f.minuti">⏳ {{ Math.max(1, f.minuti) }} min</span>
      </template>
    </div>

    <div class="f3-int-azioni">
      <button data-f3="apri-clienti" @click="$emit('elenco')">📋 Tutti i clienti<em v-if="bottega && bottega.pronti" class="f3-n">{{ bottega.pronti }}</em></button>
    </div>
  </div>
</template>
