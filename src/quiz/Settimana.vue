<script setup>
// La settimana di un bambino: minuti, difficili e migliorate, e tre tasti su ogni difficile. Al posto dell'avviso in posta (vedi docs/genitori/come-va.md).
import { ref } from 'vue'
import Taratura from '../components/eta/Taratura.vue'
import { SETTIMANA } from './alleggerire.js'

const props = defineProps({
  chi: { type: String, default: '' },
  settimana: { type: Object, required: true }, // settimanaDi di quiz/comeva.js
  eta: { type: Number, default: null },
  alleggerite: { type: Object, default: () => ({}) }, // settings.alleggerite: per dire «fino a quando»
})
const emit = defineEmits(['prova', 'rimanda', 'va-bene'])

const tarando = ref(null) // la tipologia di cui è aperta la ✎

const livelli = r => r.classi.map(c => c.livello).filter(n => n != null)
const livello = r => (livelli(r).length ? Math.max(...livelli(r)) : 50)

const GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato']
function finoA(tipo) {
  const q = props.alleggerite[tipo]?.quando
  return q ? GIORNI[new Date(q + SETTIMANA).getDay()] : ''
}

function minuti(n) {
  if (n < 60) return `${n} minuti`
  return `${Math.floor(n / 60)} h ${String(n % 60).padStart(2, '0')}`
}

function applica(r, { ritocco }) {
  emit('rimanda', { tipo: r.tipo, ritocco })
  tarando.value = null
}
</script>

<template>
  <section class="settimana" data-settimana>
    <h2>La settimana di {{ chi }}</h2>

    <div class="numeri">
      <div data-settimana-minuti><b>{{ minuti(settimana.minuti) }}</b><span>di gioco in 7 giorni</span></div>
      <div class="su"><b>{{ settimana.migliorate.length }}</b><span>migliorate</span></div>
      <div :class="{ male: settimana.difficili.length }"><b>{{ settimana.difficili.length }}</b><span>difficili</span></div>
    </div>

    <h3>Difficili</h3>
    <p v-if="!settimana.difficili.length" class="vuoto">
      Niente da segnalare: nessuna domanda gli va male da almeno otto risposte.
    </p>
    <ul v-else class="righe">
      <li v-for="r in settimana.difficili" :key="r.tipo" class="difficile" :data-difficile="r.tipo">
        <div class="voce">
          <span class="ico">{{ r.icona }}</span>
          <span class="testo">
            <b>{{ r.nome }}</b>
            <i>{{ r.detto }}</i>
            <em v-if="r.alleggerita" class="alleggerita" data-alleggerita>
              già alleggerita: esce meno spesso e prima gli mostra come si fa<template
                v-if="finoA(r.tipo)">, fino a {{ finoA(r.tipo) }}</template>
            </em>
          </span>
        </div>
        <div class="tasti">
          <button type="button" data-azione="settimana-prova"
                  @click="emit('prova', r)">▶ Prova</button>
          <button type="button" data-azione="settimana-rimanda" :class="{ ora: tarando === r.tipo }"
                  @click="tarando = tarando === r.tipo ? null : r.tipo">Più avanti di mezzo anno</button>
          <button type="button" data-azione="settimana-va-bene"
                  @click="emit('va-bene', r)">Va bene così</button>
        </div>
        <Taratura v-if="tarando === r.tipo && eta != null" :livello="livello(r)" :livelli="livelli(r)"
                  :eta="eta" :ritocco="r.ritocco" :chiave="r.tipo" :parte="1"
                  @applica="applica(r, $event)" @chiudi="tarando = null" />
      </li>
    </ul>

    <h3>Migliorate</h3>
    <p v-if="!settimana.confronto" class="vuoto" data-settimana-attesa>
      Si confronta una settimana con l'altra, e la prima fotografia è di adesso:
      fra sette giorni qui si vedrà cosa è migliorato.
    </p>
    <p v-else-if="!settimana.migliorate.length" class="vuoto">
      Niente che sia salito di almeno due risposte su dieci, questa settimana.
    </p>
    <ul v-else class="righe">
      <li v-for="r in settimana.migliorate" :key="r.tipo" class="migliorata" :data-migliorata="r.tipo">
        <div class="voce">
          <span class="ico">{{ r.icona }}</span>
          <span class="testo"><b>{{ r.nome }}</b><i>da {{ r.da }} a {{ r.a }} su 10</i></span>
          <span class="scala"><i :style="{ width: r.da * 10 + '%' }"></i><i class="ora"
                :style="{ width: (r.a - r.da) * 10 + '%' }"></i></span>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.settimana { display: grid; gap: 8px; padding: 12px; text-align: left; border-radius: 16px; background: #fff;
             box-shadow: 0 1px 6px #0000000f }
.settimana h2 { margin: 0 }
h3 { margin: 4px 0 0; font-size: 13px; font-weight: 850; color: #55556a }

.numeri { display: flex; gap: 7px }
.numeri > div { flex: 1; display: grid; gap: 1px; padding: 8px 4px; text-align: center;
                background: #f5f3fc; border-radius: 12px }
.numeri b { font-size: 16px; font-weight: 850 }
.numeri span { font-size: 10.5px; color: #8a8a99; line-height: 1.2 }
.numeri .su b { color: #1f7a45 }
.numeri .male { background: #ffe9e4 }
.numeri .male b { color: #9a3a26 }

.vuoto { margin: 0; font-size: 11.5px; line-height: 1.45; color: #8a8a99 }
.righe { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px }
.difficile { padding: 8px; border-radius: 13px; background: #fff6f3 }
.voce { display: flex; align-items: center; gap: 8px }
.ico { font-size: 17px; width: 22px; text-align: center }
.testo { flex: 1; min-width: 0; display: grid; gap: 1px }
.testo b { font-size: 13px; font-weight: 700 }
.testo i { font-style: normal; font-size: 11px; color: #8a8a99 }
.alleggerita { font-style: normal; font-size: 10.5px; color: #1f6a8a; line-height: 1.3 }

.tasti { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 7px }
.tasti button { flex: 1 1 auto; padding: 8px 7px; border: 0; border-radius: 11px;
                background: #f1eefb; color: #5b3fa8; font: inherit; font-size: 11.5px;
                font-weight: 750; cursor: pointer }
.tasti button.ora { background: #e3d9ff }

.scala { flex: 0 0 72px; height: 8px; display: flex; border-radius: 4px; background: #eceaf3;
         overflow: hidden }
.scala i { display: block; height: 100%; background: #b9b0d6 }
.scala i.ora { background: #38c172 }
</style>
