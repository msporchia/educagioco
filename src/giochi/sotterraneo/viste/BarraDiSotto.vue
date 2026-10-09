<script setup>
// La barra in basso, come quella di Diablo, la stessa sopra e sotto: a sinistra il globo della vita, a destra quello
// dell'esperienza col numero del livello, in mezzo le caselle (bevi, zaino, diario, mappa, gemme) in una cornice di
// pietra. Tutto in CSS e SVG finché la cornice dipinta non è approvata (docs/sotterraneo/barra.md). Le regole non le
// sa: dice solo cosa è stato toccato. `sopra`: sulla terra di sopra la mappa grande non c'è (la terra è già la mappa)
import Globo from './Globo.vue'

defineProps({
  vita: { type: Number, required: true },
  vitaMax: { type: Number, required: true },
  colpito: { type: Boolean, default: false },
  livello: { type: Number, default: 1 },
  esperienza: { type: Number, default: 0 },     // 0..1 verso il livello dopo
  espFatta: { type: Number, default: 0 },       // e in numeri, dentro questo livello: il globo dice «fatta/serve»
  espServe: { type: Number, default: 0 },
  punti: { type: Number, default: 0 },          // i punti da dare: un «+» sul globo, finché non si danno
  sale: { type: Boolean, default: false },      // un livello appena salito: il globo si accende
  pozioni: { type: Number, default: 0 },
  pieni: { type: Number, default: 0 },          // le tasche occupate
  tasche: { type: Number, default: 6 },
  gemme: { type: Number, default: 0 },
  missioni: { type: Number, default: 0 },       // quelle aperte, sul diario
  pronta: { type: Boolean, default: false },    // una missione fatta da consegnare: il diario in oro
  mappa: { type: Boolean, default: false },     // la mappina è aperta grande
  sopra: { type: Boolean, default: false },
})
defineEmits(['bevi', 'zaino', 'diario', 'mappa', 'eroe'])
</script>

<template>
  <nav class="sot-plancia" data-barra-giu :data-barra="sopra ? 'sopra' : 'giu'" aria-label="la barra dell'eroe">
    <div class="sot-plancia-lato sot-plancia-sx">
      <Globo tipo="vita" :quota="vita / Math.max(1, vitaMax)" :numero="vita" :colpito="colpito"
             :etichetta="`vita ${vita} su ${vitaMax}`" />
      <svg class="sot-reggi" viewBox="0 0 100 44" aria-hidden="true"><use href="#sot-reggi" /></svg>
    </div>

    <div class="sot-plancia-mezzo">
      <div class="sot-caselle">
        <button type="button" class="sot-cella" :class="{ 'sot-vuota': !pozioni }" data-casella-barra="pozione"
                data-azione="bevi" :data-n="pozioni" :aria-label="pozioni ? 'bevi una pozione' : 'nessuna pozione'"
                @click="$emit('bevi')">
          <span class="em">🧪</span><b>{{ pozioni }}</b>
        </button>
        <button type="button" class="sot-cella" data-casella-barra="zaino" data-azione="zaino" :data-n="pieni"
                aria-label="zaino" @click="$emit('zaino')">
          <span class="em">🎒</span><b>{{ pieni }}/{{ tasche }}</b>
        </button>
        <button type="button" class="sot-cella" :class="{ 'sot-pronta': pronta }" data-casella-barra="diario"
                :data-azione="sopra ? 'diario' : 'diario-giu'" aria-label="le missioni" @click="$emit('diario')">
          <span class="em">📖</span><b v-if="missioni" data-diario-n>{{ missioni }}</b>
        </button>
        <button type="button" class="sot-cella" :class="{ 'sot-vuota': sopra }" data-casella-barra="mappa"
                data-azione="mappina" :disabled="sopra" :aria-label="sopra ? 'la mappa: sei già sopra' : 'la mappa'"
                :aria-pressed="mappa ? 'true' : 'false'" @click="$emit('mappa')">
          <span class="em">🗺️</span>
        </button>
        <button type="button" class="sot-cella" data-casella-barra="gemme" data-gemme-barra :data-n="gemme"
                :aria-label="`gemme: ${gemme}`" @click="$emit('zaino')">
          <span class="em">💎</span><b>{{ gemme }}</b>
        </button>
      </div>
    </div>

    <div class="sot-plancia-lato sot-plancia-dx">
      <!-- l'esperienza: un tocco apre la pagina dell'eroe; il «+» dice che ci sono punti da dare -->
      <button type="button" class="sot-globo-tasto" data-azione="eroe-pagina" :data-livello="livello" :data-punti="punti || null"
              :aria-label="`livello ${livello}${punti ? `: ${punti} ${punti === 1 ? 'punto' : 'punti'} da dare` : ''}`"
              @click="$emit('eroe')">
        <!-- un globo dice quanto è pieno, come quello della vita: l'esperienza di questo livello su quella che serve.
             Il livello sta nella pagina dell'eroe e sulla carta di chi scende -->
        <Globo tipo="esperienza" :quota="esperienza" :numero="espServe ? `${espFatta}/${espServe}` : ''" :acceso="sale"
               :etichetta="`livello ${livello}, esperienza ${espFatta} su ${espServe}`" />
        <b v-if="punti" class="sot-punti" aria-hidden="true">+</b>
      </button>
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
