<script setup>
// La pagina dell'eroe (docs/sotterraneo/livelli.md): il livello e l'esperienza, i numeri che decidono uno scontro
// (vita, attacco, difesa: non stanno più in cima allo schermo, si leggono qui), le quattro caratteristiche coi punti da
// dare (un «+» grande che dice prima cosa cambia) e la porta per i Tesori. Nella stessa cornice dello zaino. I numeri
// li dà il motore (Corredo.seDoUnPunto): qui si mostrano e si dice cosa è stato toccato
import { computed } from 'vue'
import Cornice from './Cornice.vue'
import Armato from './Armato.vue'
import Glifo from './Glifo.vue'

const props = defineProps({
  eroe: { type: Object, required: true },        // la scheda: nome, sprite, em
  mano: { type: String, default: null },
  mancina: { type: String, default: null },
  livello: { type: Number, required: true },
  fatto: { type: Number, default: 0 },           // l'esperienza fatta nel livello, e quella che serve per il dopo
  serve: { type: Number, default: 1 },
  punti: { type: Number, default: 0 },
  numeri: { type: Object, required: true },      // { vita, vitaMax, att, dif, fortuna, gemme }
  caratteristiche: { type: Array, required: true },   // Corredo.caratteristiche(): [{ chiave, nome, em, fa, valore, cambia, trattenuta, dietro, indietro }]
  tesori: { type: Object, default: () => ({ trovati: 0, tutti: 0 }) },
  tratti: { type: Array, default: () => [] },    // quello che la roba addosso dà oltre ai numeri («💎 ×1,5»), sopra
  cambia: { type: Boolean, default: false },     // sopra c'è «Cambia eroe»: la scelta delle avventure; giù si cambia dal velo
  puntiAbilita: { type: Number, default: 0 },    // i punti dell'albero: sul tasto delle abilità
})
defineEmits(['dai', 'tesori', 'cambia', 'chiudi', 'fuori', 'abilita'])

const quota = computed(() => Math.max(0, Math.min(1, props.fatto / Math.max(1, props.serve))))
const nomeDi = k => (props.caratteristiche.find(c => c.chiave === k) || { nome: '' }).nome.toLowerCase()
</script>

<template>
  <Cornice data-pagina-eroe @chiudi="$emit('chiudi')" @fuori="e => $emit('fuori', e)">
    <header class="sot-eroe-testa">
      <span class="sot-eroe-ritratto"><Armato :eroe="eroe" :mano="mano" :mancina="mancina" :scala="3" /></span>
      <span class="sot-eroe-nome">
        <b>{{ eroe.nome }}</b>
        <i data-livello-eroe :data-livello="livello">Livello {{ livello }}</i>
        <span class="sot-eroe-esp" data-esperienza :data-fatto="fatto" :data-serve="serve"
              :aria-label="`esperienza: ${fatto} su ${serve}`">
          <u :style="{ width: quota * 100 + '%' }"></u>
          <small>✨ {{ fatto }} / {{ serve }}</small>
        </span>
      </span>
    </header>

    <div class="sot-eroe-numeri em" data-numeri-eroe>
      <span data-numero="vita">❤️ <b>{{ numeri.vita }}</b><template v-if="numeri.vitaMax !== numeri.vita">/{{ numeri.vitaMax }}</template></span>
      <span data-numero="att">⚔️ <b>{{ numeri.att }}</b></span>
      <span data-numero="dif">🛡️ <b>{{ numeri.dif }}</b></span>
      <span data-numero="gemme">💎 <b>{{ numeri.gemme }}</b></span>
    </div>
    <span v-if="tratti.length" class="sot-tratti sot-eroe-tratti em" data-tratti-eroe>
      <span v-for="t in tratti" :key="t">{{ t }}</span>
    </span>

    <p v-if="punti" class="sot-eroe-punti" data-punti-da-dare :data-n="punti">
      <span class="em">✨</span> {{ punti === 1 ? 'Hai un punto da dare' : `Hai ${punti} punti da dare` }}
    </p>
    <p v-else class="sot-eroe-punti sot-tenue">Batti i mostri: a ogni livello, un punto da dare.</p>

    <!-- il «+» di chi correrebbe troppo avanti è spento, e quella rimasta indietro brilla: «prima un po' di questa» -->
    <ul class="sot-eroe-car">
      <li v-for="c in caratteristiche" :key="c.chiave" :data-caratteristica="c.chiave" :data-valore="c.valore"
          :data-dati="c.dati" :data-indietro="punti && c.indietro ? 1 : null" :data-trattenuta="punti && c.trattenuta ? 1 : null"
          :class="{ 'sot-car-indietro': punti && c.indietro }">
        <span class="sot-car-em em">{{ c.em }}</span>
        <span class="sot-car-nome"><b>{{ c.nome }} <em>{{ c.valore }}</em></b>
          <i v-if="punti && c.indietro" class="sot-car-prima">prima un po' di questa</i>
          <i v-else-if="punti && c.trattenuta">prima un po' di {{ nomeDi(c.dietro) }}</i>
          <i v-else>{{ c.fa }}</i></span>
        <span class="sot-car-cambia em">
          <template v-if="punti && !c.trattenuta">
            <span v-for="x in c.cambia" :key="x.em" data-cambia>{{ x.em }} {{ x.prima }} → <b>{{ x.dopo }}</b></span>
          </template>
        </span>
        <button type="button" class="sot-car-piu" :disabled="!punti || c.trattenuta" data-azione="dai" :data-dai="c.chiave"
                :aria-label="`un punto a ${c.nome.toLowerCase()}`" @click="$emit('dai', c.chiave)">+</button>
      </li>
    </ul>

    <div class="sot-eroe-porte">
      <!-- l'albero delle abilità: la stessa pagina che apre il globo blu della barra (docs/sotterraneo/abilita.md) -->
      <button type="button" class="sot-grosso sot-chiaro sot-eroe-tesori" data-azione="abilita-pagina" @click="$emit('abilita')">
        <Glifo nome="energia" :misura="18" class="sot-glifo-energia" /> Abilità <small v-if="puntiAbilita" class="sot-eroe-nuovi">+{{ puntiAbilita }}</small>
      </button>
      <button type="button" class="sot-grosso sot-chiaro sot-eroe-tesori" data-azione="tesori" @click="$emit('tesori')">
        <span class="em">🏆</span> Tesori <small>{{ tesori.trovati }} / {{ tesori.tutti }}</small>
      </button>
    </div>

    <!-- le quattro avventure: la scelta è un altro foglio, e questa avventura resta com'è -->
    <button v-if="cambia" type="button" class="sot-eroe-cambia" data-azione="eroe" @click="$emit('cambia')">
      Cambia eroe
    </button>
  </Cornice>
</template>
