<script setup>
// La scritta piccola sotto le monete, dentro il gioco: vedi docs/genitori/varieta.md.
// Non ferma niente e non si tocca (pointer-events:none): la partita va avanti.
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { avviso, dici, giocoAperto, statoDi } from '../../store/varieta.js'
import { ALLA_SOGLIA } from '../../data/varieta.js'

const visibile = ref(false)
let spegni = null
watch(() => avviso.k, () => {
  visibile.value = true
  clearTimeout(spegni)
  spegni = setTimeout(() => { visibile.value = false }, 4500)
})

// il passaggio di soglia succede col tempo, non con un premio: si guarda ogni due secondi
let ultima = { gioco: null, fase: null }
function guarda() {
  const k = giocoAperto()
  if (!k) { ultima = { gioco: null, fase: null }; visibile.value = false; return }
  const st = statoDi(k)
  if (!st.paga) return
  const entrato = ultima.gioco !== k
  const cambiata = ultima.fase !== st.fase
  ultima = { gioco: k, fase: st.fase }
  // entrando si dice solo se non è pieno: «da qui normali» a inizio partita non vuol dire niente
  if (entrato ? (st.fase === 'meta' || st.fase === 'vuoto') : cambiata) dici(ALLA_SOGLIA[st.fase])
}
let giro = null
onMounted(() => { giro = setInterval(guarda, 2000) })
onUnmounted(() => { clearInterval(giro); clearTimeout(spegni) })
</script>

<template>
  <Transition name="sfuma">
    <p v-if="visibile && avviso.testo" :key="avviso.k" class="varieta-avviso"
       data-varieta-avviso>{{ avviso.testo }}</p>
  </Transition>
</template>

<style scoped>
/* sotto la barra, dalla parte delle monete; fra i veli di gioco e quelli di casa */
.varieta-avviso { position:fixed; z-index:45; right:10px; max-width:min(78vw,330px);
                  top:calc(62px + env(safe-area-inset-top)); pointer-events:none;
                  padding:6px 11px; border-radius:12px; font-size:12.5px; font-weight:800;
                  line-height:1.3; color:#5b4300; background:#fff6d6f2;
                  box-shadow:0 3px 10px #0000001f }
.sfuma-enter-active, .sfuma-leave-active { transition:opacity .35s, transform .35s }
.sfuma-enter-from, .sfuma-leave-to { opacity:0; transform:translateY(-6px) }
</style>
