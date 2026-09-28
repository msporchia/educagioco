<script setup>
// Quanto ha giocato: vedi docs/core/sessioni.md. Nessun giudizio, nessuna
// soglia — solo i numeri: non sappiamo se «due ore» siano tante.
import { ref, computed, onMounted, watch } from 'vue'
import { state } from '../store/profile.js'
import { leggiSessioni, perGioco, perGiorno } from '../store/sessioni.js'
import { GIOCHI } from '../data/giochi.js'

const voci = ref([])
const modo = ref('oggi')       // oggi | settimana | mese

const MODI = [
  { k: 'oggi', nome: 'Oggi', giorni: 1 },
  { k: 'settimana', nome: '7 giorni', giorni: 7 },
  { k: 'mese', nome: '30 giorni', giorni: 30 },
]
const quantiGiorni = computed(() => MODI.find(m => m.k === modo.value).giorni)

async function carica() { voci.value = await leggiSessioni(state.player) }
onMounted(carica)
watch(() => state.player, carica)

// confine locale, come chiaveGiorno: «oggi» comincia quando si sveglia chi gioca
const daQuando = computed(() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime() - (quantiGiorni.value - 1) * 86400000
})

const giochi = computed(() => perGioco(voci.value, { da: daQuando.value }))
const giorni = computed(() => perGiorno(voci.value, { quanti: quantiGiorni.value }))
const totale = computed(() => giochi.value.reduce((n, g) => n + g.secondi, 0))

const cima = computed(() => Math.max(60, ...giorni.value.map(d => d.secondi)))
const cimaGioco = computed(() => Math.max(60, ...giochi.value.map(g => g.secondi)))

const scheda = k => GIOCHI.find(g => g.chiave === k) || { ico: '🎮', nome: k }

function detto(s) {
  if (s < 60) return `${Math.round(s)}s`
  const m = Math.round(s / 60)
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`
}

const GG = ['D', 'L', 'M', 'M', 'G', 'V', 'S']
function segno(d, i) {
  const data = new Date(d.quando)
  if (quantiGiorni.value <= 7) return GG[data.getDay()]
  return i % 5 === 0 ? String(data.getDate()) : ''
}
</script>

<template>
  <div class="tempo" data-tempo>
    <div class="modi">
      <button v-for="m in MODI" :key="m.k" type="button"
              :class="{ ora: modo === m.k }" :data-tempo-modo="m.k"
              @click="modo = m.k">{{ m.nome }}</button>
    </div>

    <p class="totale" data-tempo-totale>
      <b>{{ detto(totale) }}</b>
      <span v-if="modo !== 'oggi'"> in {{ quantiGiorni }} giorni ·
        {{ detto(totale / quantiGiorni) }} al giorno</span>
      <span v-else> oggi</span>
    </p>

    <div v-if="modo !== 'oggi'" class="barre" :class="{ fitte: quantiGiorni > 7 }">
      <div v-for="(d, i) in giorni" :key="d.giorno" class="colonna"
           :title="`${d.giorno}: ${detto(d.secondi)}`">
        <div class="asta">
          <i :style="{ height: Math.round(d.secondi / cima * 100) + '%' }"
             :class="{ niente: !d.secondi }"></i>
        </div>
        <span class="gg">{{ segno(d, i) }}</span>
      </div>
    </div>

    <ul v-if="giochi.length" class="classifica">
      <li v-for="g in giochi" :key="g.gioco" :data-tempo-gioco="g.gioco">
        <span class="ico">{{ scheda(g.gioco).ico }}</span>
        <span class="nome">{{ scheda(g.gioco).nome }}</span>
        <span class="asta-oriz">
          <i :style="{ width: Math.round(g.secondi / cimaGioco * 100) + '%' }"></i>
        </span>
        <b>{{ detto(g.secondi) }}</b>
      </li>
    </ul>
    <p v-else class="vuoto">
      {{ modo === 'oggi' ? 'Oggi non ha ancora giocato.' : 'Nessuna partita in questo periodo.' }}
    </p>
  </div>
</template>

<style scoped>
.tempo { display: grid; gap: 9px }

.modi { display: flex; gap: 5px }
.modi button {
  flex: 1; padding: 7px 4px; border: 0; border-radius: 10px;
  background: #f1eefb; color: #6a5aa8; font: inherit; font-size: 11.5px;
  font-weight: 700; cursor: pointer;
}
.modi button.ora { background: #5b3fa8; color: #fff }

.totale { margin: 0; font-size: 12.5px; color: #8a8a99 }
.totale b { font-size: 19px; font-weight: 800; color: #23233a }

.barre { display: flex; align-items: flex-end; gap: 4px; height: 84px }
.barre.fitte { gap: 2px }
.colonna { flex: 1; display: grid; gap: 3px; height: 100% }
.asta { display: flex; align-items: flex-end; height: 66px;
        background: #f5f3fc; border-radius: 5px; overflow: hidden }
.asta i { display: block; width: 100%; min-height: 2px; background: #7c5cd6; border-radius: 5px }
.asta i.niente { background: #e2e0ee }
.gg { font-size: 9.5px; color: #9a9aa8; text-align: center; height: 12px }

.classifica { list-style: none; margin: 0; padding: 0; display: grid; gap: 5px }
.classifica li { display: flex; align-items: center; gap: 7px }
.classifica .ico { font-size: 15px; width: 20px; text-align: center }
.classifica .nome { flex: 0 0 33%; font-size: 11.5px; font-weight: 600;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.asta-oriz { flex: 1; height: 9px; background: #f5f3fc; border-radius: 5px; overflow: hidden }
.asta-oriz i { display: block; height: 100%; min-width: 3px;
               background: #7c5cd6; border-radius: 5px }
.classifica b { font-size: 11.5px; min-width: 44px; text-align: right }

.vuoto { margin: 0; font-size: 12px; color: #8a8a99 }
</style>
