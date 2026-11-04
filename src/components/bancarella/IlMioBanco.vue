<script setup>
/* Il banco del bambino: la cassa, la tenda, il carretto e la merce da comprare.
   Riceve il banco e dice cosa si vuole comprare. Vedi docs/bancarella/banco.md. */
import { ref, computed } from 'vue'
import { BANCHI, LISTINO, euro } from '../../data/bancarella.js'
import { CARRETTI, TENDE, MERCE_BASE, MERCE_NUOVA, cesteDi, pazienzaDi, prossimaTenda,
         prossimoCarretto } from '../../data/bancarella-banco.js'
import { disegnaMioBanco, LATO_BANCO } from '../../grafica/bancarella-mondo.js'

const props = defineProps({ banco: { type: Object, required: true } })
const emit = defineEmits(['compra'])

const scheda = ref('frutta')
const scelta = ref(null)             // il prodotto toccato, da comprare

const disegno = computed(() => disegnaMioBanco(props.banco.carretto, props.banco.tenda))

const scale = computed(() => {
  const t = prossimaTenda(props.banco), c = prossimoCarretto(props.banco)
  return [
    { che: 'tenda', ora: TENDE[props.banco.tenda].nome, dopo: t,
      fa: t ? `I clienti aspettano ${t.pazienza} secondi in più` : '', adesso: `${pazienzaDi(props.banco)} secondi in più` },
    { che: 'carretto', ora: CARRETTI[props.banco.carretto].nome, dopo: c,
      fa: c ? `${c.ceste} ceste sul banco` : '', adesso: `${cesteDi(props.banco)} ceste sul banco` },
  ]
})

const nomeDi = e => LISTINO.find(p => p[0] === e)
const roba = computed(() => [
  ...MERCE_BASE[scheda.value].map(e => ({ emoji: e, nome: nomeDi(e)[1], prezzo: nomeDi(e)[2], mia: true })),
  ...MERCE_NUOVA[scheda.value].map(m => ({ ...m, mia: props.banco.merce.includes(m.emoji) })),
])
const daComprare = computed(() => (scheda.value && scelta.value ? roba.value.find(r => r.emoji === scelta.value && !r.mia) : null))

function apriScheda(b) { scheda.value = b; scelta.value = null }
function tocca(r) { if (!r.mia) scelta.value = scelta.value === r.emoji ? null : r.emoji }
function compraMerce() {
  emit('compra', { che: 'merce', emoji: scelta.value })
  scelta.value = null
}
const manca = costa => costa - props.banco.cassa
</script>

<template>
  <div class="mio" data-mio-banco>
    <div class="vetrina">
      <svg class="figura" :viewBox="LATO_BANCO" aria-hidden="true" v-html="disegno"></svg>
      <div class="cassa">
        <small>In cassa</small>
        <b data-in-cassa>{{ euro(banco.cassa) }}</b>
      </div>
    </div>

    <div class="scale">
      <section v-for="s in scale" :key="s.che" class="scala" :data-scala="s.che">
        <h2>{{ s.ora }}</h2>
        <template v-if="s.dopo">
          <p class="poi">{{ s.dopo.nome }}</p>
          <p class="fa">{{ s.fa }}</p>
          <button type="button" class="compra" :disabled="s.dopo.prezzo > banco.cassa" :data-compra="s.che"
                  @click="emit('compra', { che: s.che })">{{ euro(s.dopo.prezzo) }}</button>
          <p v-if="s.dopo.prezzo > banco.cassa" class="manca">ti mancano {{ euro(manca(s.dopo.prezzo)) }}</p>
        </template>
        <p v-else class="fa">{{ s.adesso }}: il massimo!</p>
      </section>
    </div>

    <section class="merce">
      <h2>La merce</h2>
      <div class="schede">
        <button v-for="(b, k) in BANCHI" :key="k" type="button" class="scheda" :class="{ qui: k === scheda }"
                :style="{ '--c': b.colore }" :data-scheda="k" :aria-label="b.nome" @click="apriScheda(k)">{{ b.icona }}</button>
      </div>
      <div class="griglia">
        <button v-for="r in roba" :key="r.emoji" type="button" class="pezzo"
                :class="{ mia: r.mia, scelto: r.emoji === scelta }" :data-merce="r.emoji" :data-mia="r.mia ? '1' : '0'"
                @click="tocca(r)">
          <span class="em">{{ r.emoji }}</span>
          <small>{{ r.mia ? euro(r.prezzo) : euro(r.costa) }}</small>
        </button>
      </div>
    </section>

    <div v-if="daComprare" class="fondo" data-da-comprare>
      <span class="em">{{ daComprare.emoji }}</span>
      <p><b>{{ daComprare.nome }}</b><small>si vende a {{ euro(daComprare.prezzo) }}</small></p>
      <button type="button" class="compra" :disabled="daComprare.costa > banco.cassa" data-compra="merce"
              @click="compraMerce">{{ daComprare.costa > banco.cassa ? `ti mancano ${euro(manca(daComprare.costa))}` : euro(daComprare.costa) }}</button>
    </div>
  </div>
</template>

<style scoped>
.mio { flex:1; min-height:0; overflow-y:auto; overscroll-behavior:contain; display:flex; flex-direction:column; gap:10px;
       padding:8px 12px calc(14px + env(safe-area-inset-bottom)); scrollbar-width:none }
.mio::-webkit-scrollbar { display:none }

.vetrina { flex:none; position:relative; display:flex; justify-content:flex-end; align-items:flex-end; padding-top:4px }
.figura { width:min(60vw,250px); height:auto; display:block; overflow:visible; filter:drop-shadow(0 6px 5px #0000002e) }
.cassa { position:absolute; left:0; top:4px; display:flex; flex-direction:column; padding:5px 12px 6px; border-radius:12px;
         background:#fffdf7; box-shadow:0 3px 0 #0000001f }
.cassa small { font-size:11.5px; font-weight:800; color:#8a6a45 }
.cassa b { font-size:20px; font-weight:900; color:#1c7a45 }

h2 { margin:0; font-size:15px; font-weight:900; color:#5a3a20 }
.scale { flex:none; display:grid; grid-template-columns:1fr 1fr; gap:9px }
.scala { display:flex; flex-direction:column; gap:3px; padding:9px 10px 10px; border-radius:14px; background:#fffdf7;
         box-shadow:0 3px 0 #0000001a }
.scala p { margin:0 }
.poi { font-size:13px; font-weight:800; color:#a8301f }
.fa { flex:1; font-size:12.5px; font-weight:700; color:#6d5a44 }
.manca { font-size:11.5px; font-weight:800; color:#a98860; text-align:center }

.compra { margin-top:4px; padding:9px 8px; border:0; border-radius:12px; font-size:16px; font-weight:900; color:#5a3200;
          background:linear-gradient(180deg,#ffd257,#ffa62b); box-shadow:0 3px 0 #c97b12 }
.compra:active:not(:disabled) { transform:translateY(2px); box-shadow:0 1px 0 #c97b12 }
.compra:disabled { color:#8a7a66; background:#e6ddcd; box-shadow:0 3px 0 #c9bca6 }

.merce { flex:none; display:flex; flex-direction:column; gap:7px }
.schede { display:flex; gap:7px }
.scheda { flex:1; padding:6px 0; border:0; border-radius:12px; font-size:24px; line-height:1.1; background:#ffffff8c }
.scheda.qui { background:#fffdf7; box-shadow:0 0 0 3px var(--c) }
.griglia { display:grid; grid-template-columns:repeat(4,1fr); gap:7px }
.pezzo { display:flex; flex-direction:column; align-items:center; gap:1px; padding:6px 2px 5px; border:0; border-radius:12px;
         background:#ffffff66; color:#8a6a45 }
.pezzo .em { font-size:32px; line-height:1.1; filter:grayscale(.85) opacity(.6) }
.pezzo small { font-size:12px; font-weight:900 }
.pezzo.mia { background:#fffdf7; color:#1c7a45; box-shadow:0 2px 0 #0000001a }
.pezzo.mia .em { filter:none }
.pezzo.scelto { background:#fff1c9; box-shadow:0 0 0 3px #ff9f1c }
.pezzo.scelto .em { filter:none }

.fondo { position:sticky; bottom:0; z-index:2; flex:none; display:flex; align-items:center; gap:10px; padding:8px 12px;
         border-radius:14px; background:#fffdf7; box-shadow:0 4px 14px #0000003d }
.fondo .em { font-size:36px; line-height:1 }
.fondo p { flex:1; min-width:0; margin:0; display:flex; flex-direction:column }
.fondo p b { font-size:15px; font-weight:900; color:#5a3a20 }
.fondo p small { font-size:12px; font-weight:700; color:#8a6a45 }
.fondo .compra { margin:0; padding:9px 12px; white-space:nowrap }
</style>
