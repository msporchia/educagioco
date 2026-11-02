<script setup>
// L'interfaccia unica per personalizzare un personaggio, in comune fra la fattoria (il contadino), il sotterraneo (gli eroi) e, dopo, gli
// animali. Cambia solo il tema (`tema`: i colori sono variabili CSS, vedi personalizza.css); la forma è sempre la stessa:
//   ✕ in alto a destra · un'anteprima GRANDE in alto (a cura di chi la usa, slot `anteprima`) · le schede (una per cosa da scegliere,
//   in fila che scorre) · la griglia dei gettoni della scheda aperta · una riga che spiega, e sotto lo slot `fondo` (per esempio
//   «Acquista e indossa»).
// Chi la usa dà le schede e i gettoni della scheda aperta e riceve le scelte: non sa niente di cosa sia un taglio o un colore.
// Un gettone mostra, in quest'ordine, la `foto` (un'immagine, per esempio la foto 3D del pezzo), il `colore` (un campione) o l'`emoji`;
// con `slot: true` il campione lo disegna lo slot `gettone` (un ritratto 3D, per esempio). `dati`: attributi in più (per i test: `{ 'data-pelle': 'ambra' }`).
import './personalizza.css'

defineProps({
  tema: { type: String, default: 'sotterraneo' },       // 'sotterraneo' | 'fattoria'
  titolo: { type: String, default: 'Personalizza' },
  schede: { type: Array, required: true },              // [{ id, nome, emoji?, dati? }]
  scheda: { type: String, required: true },             // l'id della scheda aperta
  // i gettoni della scheda aperta: [{ id, nome, sel?, bloccato?, nota?, prezzo?, foto?, colore?, emoji?, dati? }]
  voci: { type: Array, default: () => [] },
  riga: { type: String, default: '' },                  // la frase sotto la griglia
  ruotabile: { type: Boolean, default: false },         // l'anteprima si gira: due frecce ai lati e il dito che scorre; chi la usa la ridisegna
})
const emit = defineEmits(['scheda', 'scegli', 'giro', 'chiudi'])

// il giro dell'anteprima: `giro` dice `-1` o `+1` a ogni scatto (la vista a passi di 45°, a cura di chi la usa). Col dito che scorre sull'anteprima
// uno scatto ogni `PASSO` px, e un tocco senza scorrere non gira niente
const PASSO = 40
let da = null
function giu(e) { da = { x: e.clientX, fatti: 0 }; e.currentTarget.setPointerCapture?.(e.pointerId) }
function muovi(e) {
  if (!da) return
  const n = Math.trunc((e.clientX - da.x) / PASSO)
  if (n !== da.fatti) { emit('giro', n > da.fatti ? -1 : 1); da.fatti = n }   // trascinare verso destra porta avanti il lato sinistro: come girare un oggetto
}
const su = () => { da = null }
</script>

<template>
  <div class="pz" :class="'pz-tema-' + tema" data-personalizza @click.self="$emit('chiudi')">
    <div class="pz-foglio" role="dialog" :aria-label="titolo">
      <header class="pz-testa">
        <h2>{{ titolo }}</h2>
        <button type="button" class="pz-x" data-chiudi aria-label="chiudi" @click="$emit('chiudi')">✕</button>
      </header>

      <!-- chi si è sta sopra l'anteprima, in un angolo: una riga a sé toglieva spazio alla griglia -->
      <div class="pz-anteprima" :class="{ ruotabile }" data-pz="anteprima" @pointerdown="ruotabile && giu($event)" @pointermove="ruotabile && muovi($event)"
           @pointerup="su" @pointercancel="su">
        <slot name="anteprima" />
        <div v-if="$slots.chi" class="pz-chi" data-pz="chi"><slot name="chi" /></div>
        <template v-if="ruotabile">
          <button type="button" class="pz-gira pz-gira-sx" data-pz="gira-sx" aria-label="gira a sinistra" @pointerdown.stop @click="$emit('giro', -1)">‹</button>
          <button type="button" class="pz-gira pz-gira-dx" data-pz="gira-dx" aria-label="gira a destra" @pointerdown.stop @click="$emit('giro', 1)">›</button>
        </template>
      </div>

      <nav class="pz-schede" data-pz="schede">
        <button v-for="s in schede" :key="s.id" type="button" :class="{ acceso: scheda === s.id }" :data-pz-scheda="s.id" v-bind="s.dati"
                :aria-pressed="scheda === s.id" @click="$emit('scheda', s.id)">
          <span v-if="s.emoji" aria-hidden="true">{{ s.emoji }}</span> {{ s.nome }}
        </button>
      </nav>

      <div class="pz-corpo">
        <div class="pz-griglia" :key="scheda">
          <button v-for="(v, i) in voci" :key="v.id" type="button" class="pz-gettone"
                  :class="{ sel: v.sel, bloccato: v.bloccato }" :style="{ '--i': i, '--col': v.colore || 'transparent' }"
                  :data-pz-voce="v.id" :aria-pressed="!!v.sel" :aria-label="v.nome" v-bind="v.dati" @click="$emit('scegli', scheda, v)">
            <slot v-if="v.slot" name="gettone" :voce="v" />
            <span v-else class="pz-campione" :class="{ foto: v.foto, colore: !v.foto && v.colore }">
              <img v-if="v.foto" :src="v.foto" alt="" draggable="false">
              <em v-else-if="!v.colore && v.emoji" aria-hidden="true">{{ v.emoji }}</em>
            </span>
            <b>{{ v.nome }}</b>
            <small v-if="v.nota">{{ v.nota }}</small>
            <small v-else-if="v.prezzo" class="pz-prezzo">{{ v.prezzo }}</small>
          </button>
        </div>
      </div>

      <p v-if="riga" class="pz-riga" data-pz="riga">{{ riga }}</p>
      <slot name="fondo" />
    </div>
  </div>
</template>
