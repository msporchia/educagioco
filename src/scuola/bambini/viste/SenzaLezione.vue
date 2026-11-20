<script setup>
// «Senza lezione»: la maestra, col suo codice, fa partire un gioco su questo PC senza il servizio (niente internet, un
// guasto). Una lezione pronta (classe → gioco → lezione → quanto è difficile) o un esercizio scelto da lei. docs/scuola/ripieghi.md
import { ref, computed } from 'vue'
import { CATALOGO, GIOCHI, DIFFICOLTA, giocoDi, valido, descrivi } from '../../comune/esercizi.js'
import { ANNI, pronte, lezioneDa } from '../../comune/lezioni-pronte.js'
import { lezioneValida, descriviPassa } from '../../comune/lezione.js'
import CodiceMaestra from './CodiceMaestra.vue'
import SceltaEsercizio from '../../maestra/SceltaEsercizio.vue'
import TesseraGioco from '../../maestra/TesseraGioco.vue'

const emit = defineEmits(['via', 'annulla'])
const aperto = ref(false)
const anno = ref(null)
const gioco = ref(null)
const pronta = ref(null)
const difficolta = ref('normale')
const sceltaTua = ref(false)
const esercizio = ref(JSON.parse(JSON.stringify(CATALOGO.materie[0].voci[0].base)))

const giochi = computed(() => (anno.value ? GIOCHI.filter(g => pronte({ anno: anno.value, gioco: g.id }).length) : []))
const proposte = computed(() => (anno.value && gioco.value ? pronte({ anno: anno.value, gioco: gioco.value }) : []))
const reggeDifficolta = e => !!GIOCHI.find(g => g.id === giocoDi(e))?.difficolta
const conDifficolta = computed(() => !!pronta.value?.blocchi.some(b => reggeDifficolta(b.esercizio)))

function scegliAnno(a) { anno.value = a; if (!giochi.value.some(g => g.id === gioco.value)) gioco.value = null; pronta.value = null }
function scegliGioco(id) { gioco.value = id; pronta.value = null }

// la lezione che parte: quella pronta con la difficoltà su ogni blocco che la regge, o un blocco solo che non finisce
const lezione = computed(() => {
  if (sceltaTua.value) return valido(esercizio.value) ? { id: 'senza', nome: 'Senza lezione', blocchi: [{ esercizio: esercizio.value, passa: null }], inTondo: false } : null
  if (!pronta.value) return null
  const l = lezioneDa(pronta.value, 'senza')
  if (difficolta.value !== 'normale') for (const b of l.blocchi) if (reggeDifficolta(b.esercizio)) b.esercizio.difficolta = difficolta.value
  return l
})
function via() { if (lezione.value && lezioneValida(lezione.value)) emit('via', JSON.parse(JSON.stringify(lezione.value))) }
</script>

<template>
  <div class="maestra senza" data-senza-lezione>
    <div class="pagina">
      <section v-if="!aperto" class="carta">
        <CodiceMaestra @giusto="aperto = true" @annulla="emit('annulla')" />
      </section>

      <template v-else>
        <section class="carta">
          <h1>Senza lezione</h1>
          <p class="nota">Si gioca solo su questo computer, anche senza internet: le risposte non arrivano a nessuno e non resta
            niente. I blocchi «quando lo dice la maestra» passano dal tasto «Maestra», in basso a sinistra.</p>
          <div class="fila">
            <button class="bottone chiaro" data-azione="annulla" @click="emit('annulla')">Torna al codice della lezione</button>
            <button class="bottone chiaro" data-azione="scelta-tua" @click="sceltaTua = !sceltaTua">
              {{ sceltaTua ? 'Una lezione pronta' : 'Scegli tu cosa chiedere' }}</button>
          </div>
        </section>

        <template v-if="!sceltaTua">
          <section class="carta" data-passo="anno">
            <h2>Per quale classe?</h2>
            <div class="fila">
              <button v-for="a in ANNI" :key="a" class="tessera" :class="{ scelta: anno === a }" :aria-pressed="anno === a"
                      :data-anno="a" @click="scegliAnno(a)">{{ a }}ª</button>
            </div>
          </section>
          <section v-if="anno" class="carta" data-passo="gioco">
            <h2>In che gioco?</h2>
            <div class="fila">
              <TesseraGioco v-for="g in giochi" :key="g.id" :gioco="g" :scelta="gioco === g.id" @click="scegliGioco(g.id)" />
            </div>
          </section>
          <section v-if="gioco" class="carta" data-passo="lezioni">
            <h2>Che lezione?</h2>
            <ul class="proposte">
              <li v-for="p in proposte" :key="p.id">
                <button class="pronta" :class="{ scelta: pronta?.id === p.id }" :aria-pressed="pronta?.id === p.id" :data-pronta="p.id" @click="pronta = p">
                  <b>{{ p.nome }}</b>
                  <span v-for="(b, i) in p.blocchi" :key="i" class="nota">{{ descrivi(b.esercizio) }} · {{ descriviPassa(b.passa) }}</span>
                </button>
              </li>
            </ul>
          </section>
          <section v-if="conDifficolta" class="carta" data-passo="difficolta">
            <h2>Quanto è difficile?</h2>
            <div class="fila">
              <button v-for="d in DIFFICOLTA" :key="d.id" class="tessera" :class="{ scelta: difficolta === d.id }" :aria-pressed="difficolta === d.id"
                      :data-difficolta="d.id" @click="difficolta = d.id">{{ d.nome }}</button>
            </div>
          </section>
        </template>

        <section v-else class="carta" data-passo="scelta-tua">
          <h2>Cosa chiedere</h2>
          <SceltaEsercizio v-model="esercizio" dove="senza-lezione" apri-giochi />
          <p class="nota">Si va avanti finché non la cambi dal tasto «Maestra».</p>
        </section>

        <section class="carta">
          <button class="bottone grande" :disabled="!lezione" data-azione="via-senza" @click="via">Via</button>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped>
.senza { flex:1; min-height:0; overflow-y:auto; text-align:left }
.proposte { list-style:none; display:flex; flex-direction:column; gap:8px }
.pronta { width:100%; display:flex; flex-direction:column; gap:2px; text-align:left; padding:12px; font:inherit; font-size:14px;
          color:var(--inchiostro); background:var(--tessera); border:2px solid transparent; border-radius:var(--raggio-piccolo) }
.pronta.scelta { border-color:var(--inchiostro) }
.pronta b { font-size:15px }
.bottone.grande { font-size:20px; padding:14px 48px; align-self:center }
</style>
