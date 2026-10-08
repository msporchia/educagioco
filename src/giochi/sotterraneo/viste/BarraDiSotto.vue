<script setup>
// La barra in basso della discesa, come quella di Diablo: a sinistra il globo della vita, a destra quello della
// luce, in mezzo le caselle (bevi, torce, zaino, diario, mappina, gemme) in una cornice di pietra. Tutto in CSS e
// SVG finché la cornice dipinta non è approvata (docs/sotterraneo/barra.md). Le regole non le sa: dice solo cosa
// è stato toccato.
import Globo from './Globo.vue'

defineProps({
  vita: { type: Number, required: true },
  vitaMax: { type: Number, required: true },
  colpito: { type: Boolean, default: false },
  torcia: { type: Object, default: null },     // { quota, resta, scorta, agliSgoccioli }, o null al buio
  pozioni: { type: Number, default: 0 },
  pieni: { type: Number, default: 0 },          // le tasche occupate
  tasche: { type: Number, default: 6 },
  gemme: { type: Number, default: 0 },
  missioni: { type: Number, default: 0 },       // quelle aperte, sul diario
  mappa: { type: Boolean, default: false },     // la mappina è aperta grande
  esperienza: { type: Number, default: null },  // 0..1; null finché l'eroe non ha livelli: la scanalatura resta vuota
})
defineEmits(['bevi', 'zaino', 'diario', 'mappa'])
</script>

<template>
  <nav class="sot-plancia" data-barra-giu aria-label="la barra dell'eroe">
    <div class="sot-plancia-lato sot-plancia-sx">
      <Globo tipo="vita" :quota="vita / Math.max(1, vitaMax)" :numero="vita" :colpito="colpito"
             :etichetta="`vita ${vita} su ${vitaMax}`" />
      <svg class="sot-reggi" viewBox="0 0 100 44" aria-hidden="true"><use href="#sot-reggi" /></svg>
    </div>

    <div class="sot-plancia-mezzo">
      <!-- il posto per l'esperienza dell'eroe: arriverà coi livelli, per ora la scanalatura è vuota -->
      <span class="sot-esperienza" data-esperienza :data-quota="esperienza == null ? null : esperienza.toFixed(2)"
            aria-hidden="true"><i :style="{ width: (esperienza || 0) * 100 + '%' }"></i></span>
      <div class="sot-caselle">
        <button type="button" class="sot-cella" :class="{ 'sot-vuota': !pozioni }" data-casella-barra="pozione"
                data-azione="bevi" :data-n="pozioni" :aria-label="pozioni ? 'bevi una pozione' : 'nessuna pozione'"
                @click="$emit('bevi')">
          <span class="em">🧪</span><b>{{ pozioni }}</b>
        </button>
        <span class="sot-cella sot-conta" :class="{ 'sot-vuota': !torcia || !torcia.scorta }" data-casella-barra="torcia"
              :data-n="torcia ? torcia.scorta : 0" :aria-label="`torce alla cintura: ${torcia ? torcia.scorta : 0}`">
          <span class="em">🔥</span><b>{{ torcia ? torcia.scorta : 0 }}</b>
        </span>
        <button type="button" class="sot-cella" data-casella-barra="zaino" data-azione="zaino" aria-label="zaino"
                @click="$emit('zaino')">
          <span class="em">🎒</span><b>{{ pieni }}/{{ tasche }}</b>
        </button>
        <button type="button" class="sot-cella" data-casella-barra="diario" data-azione="diario-giu" aria-label="le missioni"
                @click="$emit('diario')">
          <span class="em">📖</span><b v-if="missioni">{{ missioni }}</b>
        </button>
        <button type="button" class="sot-cella" data-casella-barra="mappa" data-azione="mappina" aria-label="la mappa"
                :aria-pressed="mappa ? 'true' : 'false'" @click="$emit('mappa')">
          <span class="em">🗺️</span>
        </button>
        <span class="sot-cella sot-conta" data-casella-barra="gemme" data-gemme-barra :data-n="gemme"
              :aria-label="`gemme: ${gemme}`">
          <span class="em">💎</span><b>{{ gemme }}</b>
        </span>
      </div>
    </div>

    <div class="sot-plancia-lato sot-plancia-dx">
      <Globo tipo="luce" :quota="torcia ? torcia.quota : 0" :numero="torcia ? torcia.resta : ''"
             :guizza="!!(torcia && torcia.agliSgoccioli)"
             :etichetta="torcia ? `luce: ancora ${torcia.resta} stanze` : 'nessuna torcia accesa'" />
      <svg class="sot-reggi" viewBox="0 0 100 44" aria-hidden="true"><use href="#sot-reggi" /></svg>
    </div>

    <!-- l'ornamento che regge i globi, disegnato una volta: una coppa di pietra col filo d'oro e due riccioli -->
    <svg width="0" height="0" class="sot-plancia-defs" aria-hidden="true">
      <defs>
        <linearGradient id="sot-pietra-reggi" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#77717f" /><stop offset=".45" stop-color="#46414f" /><stop offset="1" stop-color="#211e26" />
        </linearGradient>
        <g id="sot-reggi">
          <path d="M2 8C5 30 26 42 50 42S95 30 98 8L88 6C86 24 69 33 50 33S14 24 12 6Z"
                fill="url(#sot-pietra-reggi)" stroke="#0b0a0e" stroke-width="1.6" stroke-linejoin="round" />
          <path d="M6 13C10 30 30 38.5 50 38.5S90 30 94 13" fill="none" stroke="#0007" stroke-width="1.1" />
          <path d="M12 6C14 24 31 33 50 33S86 24 88 6" fill="none" stroke="#d8a845" stroke-width="1.8" />
          <circle cx="7" cy="7" r="6" fill="url(#sot-pietra-reggi)" stroke="#0b0a0e" stroke-width="1.4" />
          <circle cx="93" cy="7" r="6" fill="url(#sot-pietra-reggi)" stroke="#0b0a0e" stroke-width="1.4" />
          <path d="M7 7m-3 0a3 3 0 1 1 3 3" fill="none" stroke="#d8a845" stroke-width="1.3" />
          <path d="M93 7m3 0a3 3 0 1 0-3 3" fill="none" stroke="#d8a845" stroke-width="1.3" />
          <path d="M50 34.5l3.6 3.9-3.6 3.9-3.6-3.9z" fill="#ffd977" stroke="#7a4f12" stroke-width=".9" />
        </g>
      </defs>
    </svg>
  </nav>
</template>
