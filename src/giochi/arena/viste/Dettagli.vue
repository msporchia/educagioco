<script setup>
// La schermata dei dettagli di una truppa o di una scelta: com'è adesso, com'è
// al livello dopo, quanto costa e a cosa serve. Il campo sta fermo finché è
// aperta (lo decide Gioco.vue): serve a scegliere con calma quale conviene.
// Riceve tutto già calcolato (motore/dettagli.js): non conosce le regole.
import Ritratto from './Ritratto.vue'

defineProps({
  d: { type: Object, required: true },
})
defineEmits(['chiudi', 'procedi'])
</script>

<template>
  <div class="ar-velo ar-dettagli" data-dettagli-aperti @click.self="$emit('chiudi')">
    <div class="ar-scheda">
      <button class="ar-x" aria-label="chiudi" @click="$emit('chiudi')">✕</button>

      <div class="ar-intesta">
        <Ritratto v-if="d.truppa" :id="d.truppa" :lato="64" />
        <Ritratto v-else-if="d.castello" torre :livello="d.livello || 1" :lato="64" />
        <span v-else class="ar-grande em">{{ d.icona }}</span>
        <div>
          <h2>{{ d.titolo }}</h2>
          <p class="ar-livello">{{ d.livello ? 'Livello ' + d.livello : d.sottotitolo }}</p>
        </div>
      </div>

      <p class="ar-nota-grande">{{ d.nota }}</p>
      <ul v-if="d.ruolo && d.ruolo.length" class="ar-ruolo">
        <li v-for="r in d.ruolo" :key="r">{{ r }}</li>
      </ul>

      <table class="ar-righe">
        <thead v-if="d.righe.some(r => r.dopo !== null)">
          <tr><th></th><th>adesso</th><th></th><th>{{ d.livello ? 'livello ' + (d.livello + 1) : 'dopo' }}</th></tr>
        </thead>
        <tbody>
          <tr v-for="r in d.righe" :key="r.nome">
            <td>{{ r.nome }}</td>
            <td><b>{{ r.ora }}</b></td>
            <td>{{ r.dopo !== null ? '→' : '' }}</td>
            <td><b class="ar-meglio">{{ r.dopo !== null ? r.dopo : '' }}</b></td>
          </tr>
        </tbody>
      </table>

      <p v-if="d.cosa" class="ar-cosa">{{ d.cosa }}</p>
      <p class="ar-calcolo em">Per farlo si risolve {{ d.calcolo }}.</p>

      <button v-if="d.prezzo !== null" class="ar-grosso" :class="{ 'ar-spento': !d.puoi }" data-procedi
              :disabled="!d.puoi" @click="$emit('procedi')">
        <span class="em">{{ d.verbo }}</span> · {{ d.prezzo }} <span class="em">🪙</span>
      </button>
      <p v-if="d.prezzo !== null && !d.puoi" class="ar-motivo">{{ d.motivo }}</p>
      <p v-if="d.prezzo === null" class="ar-motivo">{{ d.fine }}</p>
      <button class="ar-grosso ar-chiaro" @click="$emit('chiudi')">torno in campo</button>
    </div>
  </div>
</template>
