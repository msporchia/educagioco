<script setup>
// La settimana di un bambino: minuti, difficili e migliorate, e quattro tasti su ogni difficile (anche «Non chiedergliela più»: le eccezioni si gestiscono qui, non in una lista di tutto). Al posto dell'avviso in posta (vedi docs/genitori/come-va.md).
import { ref } from 'vue'
import Taratura from '../components/eta/Taratura.vue'
import { SETTIMANA } from './alleggerire.js'

const props = defineProps({
  chi: { type: String, default: '' },
  settimana: { type: Object, required: true }, // settimanaDi di quiz/comeva.js
  eta: { type: Number, default: null },
  alleggerite: { type: Object, default: () => ({}) }, // settings.alleggerite: per dire «fino a quando»
  spente: { type: Array, default: () => [] }, // le domande che un grande ha spento: { tipo, nome }
})
const emit = defineEmits(['prova', 'rimanda', 'va-bene', 'spegni', 'riaccendi'])

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
              già alleggerita: esce meno spesso e prima gli mostra un esempio svolto<template
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
          <button type="button" class="spegni" data-azione="settimana-spegni"
                  @click="emit('spegni', r)">Non chiedergliela più</button>
        </div>
        <Taratura v-if="tarando === r.tipo && eta != null" :livello="livello(r)" :livelli="livelli(r)"
                  :eta="eta" :ritocco="r.ritocco" :chiave="r.tipo" :parte="1"
                  @applica="applica(r, $event)" @chiudi="tarando = null" />
      </li>
    </ul>

    <template v-if="spente.length">
      <h3>Le hai spente tu</h3>
      <ul class="righe" data-spente>
        <li v-for="x in spente" :key="x.tipo" class="spenta" :data-spenta="x.tipo">
          <div class="voce"><span class="testo"><b>{{ x.nome }}</b><i>non gli viene più chiesta</i></span>
            <button type="button" data-azione="settimana-riaccendi" @click="emit('riaccendi', x)">Riaccendi</button></div>
        </li>
      </ul>
    </template>

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
.spegni { color: #8c2f2f }
.spenta .voce { display: flex; align-items: center; justify-content: space-between; gap: 8px }
.settimana { display: grid; gap: 8px; padding: 12px; text-align: left; border-radius: var(--raggio); background: #fff;
             box-shadow: 0 1px 6px #0000000f }
.settimana h2 { margin: 0 }
h3 { margin: 4px 0 0; font-size: 13px; font-weight:600; color: var(--inchiostro) }

.numeri { display: flex; gap: 7px }
.numeri > div { flex: 1; display: grid; gap: 1px; padding: 8px 4px; text-align: center;
                background: var(--tessera); border-radius: var(--raggio-piccolo) }
.numeri b { font-size: 16px; font-weight:600 }
.numeri span { font-size: 10.5px; color: var(--grigio); line-height: 1.2 }
.numeri .su b { color: #1f7a45 }
.numeri .male { background: #ffe9e4 }
.numeri .male b { color: #9a3a26 }

.vuoto { margin: 0; font-size: 11.5px; line-height: 1.45; color: var(--grigio) }
.righe { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px }
.difficile { padding: 8px; border-radius: var(--raggio); background: #fff6f3 }
.voce { display: flex; align-items: center; gap: 8px }
.ico { font-size: 17px; width: 22px; text-align: center }
.testo { flex: 1; min-width: 0; display: grid; gap: 1px }
.testo b { font-size: 13px; font-weight:600 }
.testo i { font-style: normal; font-size: 11px; color: var(--grigio) }
.alleggerita { font-style: normal; font-size: 10.5px; color: #1f6a8a; line-height: 1.3 }

.tasti { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 7px }
.tasti button { flex: 1 1 auto; padding: 8px 7px; border: 0; border-radius: var(--raggio-piccolo);
                background: var(--tessera); color: var(--inchiostro); font: inherit; font-size: 11.5px;
                font-weight:600; cursor: pointer }
.tasti button.ora { background: var(--filo) }

.scala { flex: 0 0 72px; height: 8px; display: flex; border-radius: 4px; background: var(--filo);
         overflow: hidden }
.scala i { display: block; height: 100%; background: #a3a9b8 }
.scala i.ora { background: #38c172 }
</style>
