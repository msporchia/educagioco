<script setup>
/* Gli animali sono disegnati, non presi dalle emoji: le tre emoji di gatto
   disponibili sono lo stesso gatto tre volte, e un bobtail non c'è proprio.
   Manto, macchie, occhi e coda arrivano da data/pets.js; `specie` sceglie
   quale sagoma disegnare.

   Qui dentro non c'è nessun tracciato: c'è la cornice (il viewBox, le
   animazioni, gli accessori) e la tabella `SAGOME`. **Aggiungere una
   specie è aggiungere un file in `sagome/` e una riga qui**, e le
   animazioni valgono già — ogni sagoma le eredita nominando i suoi
   gruppi `.testa`, `.corpo`, `.coda`, `.ala`.

   Gli id dei ritagli sono per animale, altrimenti tre bestie nella stessa
   pagina si ruberebbero le macchie a vicenda. */
import { computed } from 'vue'
import { ANCORE } from '../data/pets.js'
import Cane from './sagome/Cane.vue'
import Gatto from './sagome/Gatto.vue'
import Pappagallo from './sagome/Pappagallo.vue'
import Pesce from './sagome/Pesce.vue'
import Drago from './sagome/Drago.vue'

const SAGOME = { cane: Cane, gatto: Gatto, pappagallo: Pappagallo, pesce: Pesce,
                 drago: Drago, erbivoro: Drago }

const props = defineProps({
  pet:   { type: Object, required: true },
  // contento | normale | chiede | mangia | gioca | lavato
  stato: { type: String, default: 'normale' },
  size:  { type: Number, default: 108 },
  // { testa: '🎩', occhi: '🕶️', collo: '🎀', schiena: '🎒' }, tutti facoltativi
  addosso: { type: Object, default: () => ({}) },
})

const sagoma = computed(() => SAGOME[props.pet.specie] || Gatto)
const felice = computed(() => ['contento', 'mangia', 'gioca', 'lavato'].includes(props.stato))

/* Gli accessori sono emoji appoggiate sul disegno, non nuovi tracciati: è
   la stessa scelta fatta per tutte le icone del gioco, e settantadue
   sagome disegnate a mano non le finiremmo mai. Le coordinate stanno in
   data/pets.js, una serie per specie. */
const indossati = computed(() => {
  const ancore = ANCORE[props.pet.specie] || {}
  return Object.entries(props.addosso || {})
    .filter(([posto, e]) => e && ancore[posto])
    .map(([posto, e]) => ({ posto, e, x: ancore[posto][0], y: ancore[posto][1], dim: ancore[posto][2] }))
})
</script>

<template>
  <svg class="bestia" :class="[stato, pet.specie, pet.taglio]" :width="size" :height="size * 1.05"
       viewBox="0 0 120 126" role="img" :aria-label="pet.nome">

    <component :is="sagoma" :pet="pet" :felice="felice" :uid="pet.id" />

    <!-- gli accessori vanno per ultimi: stanno sopra tutto il resto -->
    <text v-for="a in indossati" :key="a.posto" class="addosso"
          :x="a.x" :y="a.y" :font-size="a.dim" text-anchor="middle">{{ a.e }}</text>
  </svg>
</template>

<style scoped>
/* Le sagome sono componenti figli: senza `:deep` il CSS di qui non le
   raggiungerebbe, e resterebbero immobili come adesivi. */
.bestia { display:block; overflow:visible }
.bestia :deep(.testa), .bestia :deep(.coda) { transform-box:fill-box }
.bestia :deep(.testa) { transform-origin:50% 92% }
.bestia :deep(.coda)  { transform-origin:0% 100% }

/* la coda si muove sempre un po': un gatto fermo del tutto sembra un adesivo */
.bestia :deep(.coda) { animation:coda 3.1s ease-in-out infinite }
@keyframes coda { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(7deg)} }

/* il bobtail la coda non ce l'ha: a scodinzolare è tutto il posteriore */
.bestia.cane :deep(.corpo) { transform-box:fill-box; transform-origin:50% 20%;
                             animation:sedere 2.4s ease-in-out infinite }
@keyframes sedere { 0%,100%{transform:rotate(-1.4deg)} 50%{transform:rotate(1.4deg)} }

/* le ali: pappagallo e draghetto sbattono piano, ognuna dalla sua spalla */
.bestia :deep(.ala) { transform-box:fill-box; animation:sbatte 2.2s ease-in-out infinite }
.bestia :deep(.ala.sx) { transform-origin:100% 10% }
.bestia :deep(.ala.dx) { transform-origin:0% 10% }
@keyframes sbatte { 0%,100%{transform:rotate(0)} 50%{transform:rotate(-7deg)} }
.bestia :deep(.ala.dx) { animation-name:sbatte-dx }
@keyframes sbatte-dx { 0%,100%{transform:rotate(0)} 50%{transform:rotate(7deg)} }

/* il pesce nuota avanti e indietro nella boccia, e le bolle salgono */
.bestia :deep(.pescetto) { animation:nuota 4.2s ease-in-out infinite }
@keyframes nuota { 0%,100%{transform:translate(-6px,2px)} 50%{transform:translate(6px,-3px)} }
.bestia :deep(.pinna) { transform-box:fill-box; transform-origin:0% 0%;
                        animation:pinneggia .7s ease-in-out infinite alternate }
@keyframes pinneggia { from{transform:rotate(-8deg)} to{transform:rotate(10deg)} }
.bestia :deep(.bolla) { animation:sale 3.4s linear infinite }
.bestia :deep(.bolla.b2) { animation-duration:4.1s; animation-delay:.8s }
.bestia :deep(.bolla.b3) { animation-duration:2.9s; animation-delay:1.6s }
@keyframes sale { 0%{transform:translateY(0);opacity:0} 15%{opacity:.8}
                  100%{transform:translateY(-46px);opacity:0} }

/* il fumo del draghetto contento */
.bestia :deep(.fumo) { animation:fuma 2.4s ease-out infinite }
@keyframes fuma { 0%{opacity:0;transform:translate(0,0) scale(.7)}
                  30%{opacity:1} 100%{opacity:0;transform:translate(8px,-10px) scale(1.2)} }

.bestia.mangia :deep(.testa) { animation:mastica .26s ease-in-out infinite alternate }
@keyframes mastica { from{transform:translateY(0) scaleY(1)} to{transform:translateY(2px) scaleY(.96)} }

/* chiede: qualunque cosa gli manchi, il gesto è lo stesso — saltella */
.bestia.chiede { animation:implora 1.7s ease-in-out infinite }
@keyframes implora { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
/* la boccia però non saltella: a saltellare è il pesce dentro */
.bestia.pesce.chiede { animation:none }
.bestia.pesce.chiede :deep(.pescetto) { animation:nuota 1.1s ease-in-out infinite }

.bestia.contento :deep(.corpo) { animation:respira 3.4s ease-in-out infinite }
@keyframes respira { 0%,100%{transform:translateY(0)} 50%{transform:translateY(1.5px)} }
/* contento il cane rallenta lo scodinzolio invece di fermarlo */
.bestia.cane.contento :deep(.corpo) { animation:sedere 4.2s ease-in-out infinite }

/* giocare è una cosa di tutto il corpo, il bagnetto una scrollata di testa */
.bestia.gioca { animation:salterella .42s ease-in-out infinite alternate }
@keyframes salterella { from{transform:translateY(0) rotate(-3deg)} to{transform:translateY(-7px) rotate(3deg)} }
.bestia.lavato :deep(.testa) { animation:scrolla .18s ease-in-out infinite alternate }
@keyframes scrolla { from{transform:rotate(-4deg)} to{transform:rotate(4deg)} }

/* gli accessori non intercettano i tocchi: sotto c'è la scheda da scegliere */
.addosso { pointer-events:none; paint-order:stroke;
           filter:drop-shadow(0 1px 1px #00000033) }
</style>
