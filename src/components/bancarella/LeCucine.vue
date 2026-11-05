<script setup>
/* La scelta delle cucine: la cassa, gli attrezzi da comprare, i livelli.
   Riceve il banco e dice cosa si vuole fare. Vedi docs/bancarella/cucina.md. */
import { computed } from 'vue'
import { CUCINE, ATTREZZI } from '../../data/bancarella-cucine.js'
import { euro } from '../../data/bancarella.js'
import { FOTO } from '../../data/bancarella-foto.js'

const props = defineProps({
  banco: { type: Object, required: true },
  aperte: { type: Boolean, default: false },   // la prova dei grandi: `&aperte=1`
})
const emit = defineEmits(['scegli', 'compra'])

const fatte = computed(() => props.banco.cucina.fatte)
const chiusa = k => !props.aperte && k > fatte.value
const attrezzi = computed(() => ATTREZZI.filter(a => props.aperte || a.da <= fatte.value))
const preso = a => props.banco.cucina[a.che]
const prezzo = a => a.prezzi[preso(a)]
const finito = a => prezzo(a) === undefined
</script>

<template>
  <div class="cucine" data-cucine>
    <div class="cassa"><small>In cassa</small><b data-in-cassa>{{ euro(banco.cassa) }}</b></div>

    <section v-if="attrezzi.length" class="attrezzi">
      <button v-for="a in attrezzi" :key="a.che" type="button" class="attrezzo" :class="{ finito: finito(a) }" :data-attrezzo="a.che"
              :disabled="finito(a) || prezzo(a) > banco.cassa" @click="emit('compra', a.che)">
        <img :src="FOTO['attrezzo:' + a.che]" alt="">
        <span>{{ a.nome }}</span>
        <b>{{ finito(a) ? 'tuo' : euro(prezzo(a)) }}</b>
      </button>
    </section>

    <button v-for="(c, k) in CUCINE" :key="c.id" type="button" class="livello" :class="{ chiusa: chiusa(k), fatta: k < fatte }" :data-cucina-n="k + 1"
            :disabled="chiusa(k)" @click="emit('scegli', k)">
      <img :src="FOTO['piatto:' + c.foto]" alt="">
      <span class="testo"><b>{{ k + 1 }} · {{ c.nome }}</b><small>{{ c.nuovo }}</small></span>
    </button>
  </div>
</template>

<style scoped>
.cucine { flex:1; min-height:0; overflow-y:auto; overscroll-behavior:contain; display:flex; flex-direction:column; gap:8px; padding:10px 12px calc(14px + env(safe-area-inset-bottom)) }
.cassa { flex:none; align-self:flex-start; display:flex; flex-direction:column; padding:5px 12px 6px; border-radius:12px; background:#fffdf7; box-shadow:0 3px 0 #0000001f }
.cassa small { font-size:11.5px; font-weight:800; color:#8a6a45 }
.cassa b { font-size:20px; font-weight:900; color:#1c7a45 }
.attrezzi { flex:none; display:grid; grid-template-columns:repeat(auto-fill,minmax(104px,1fr)); gap:7px }
.attrezzo { display:flex; flex-direction:column; align-items:center; gap:1px; padding:6px 4px; border:0; border-radius:14px; background:#fffdf7; box-shadow:0 3px 0 #0000001f }
.attrezzo img { width:56px; height:56px }
.attrezzo span { font-size:12px; font-weight:800; line-height:1.15; text-align:center; color:#6d5a44 }
.attrezzo b { font-size:14px; font-weight:900; color:#a8301f }
.attrezzo:disabled { opacity:.6 }
.attrezzo.finito { opacity:1; background:#dff3e3 }
.attrezzo.finito b { color:#1c7a45 }
.livello { flex:none; display:flex; align-items:center; gap:10px; padding:6px 10px; border:0; border-radius:14px; text-align:left; background:#fffdf7; box-shadow:0 3px 0 #0000001f }
.livello:active:not(:disabled) { transform:translateY(2px) }
.livello img { flex:none; width:58px; height:58px }
.livello.chiusa img { filter:grayscale(1) opacity(.5) }
.livello.chiusa { background:#ffffff66 }
.livello.fatta { background:#eef7ea }
.testo { display:flex; flex-direction:column; gap:1px; min-width:0 }
.testo b { font-size:15px; font-weight:900; color:#a8301f }
.chiusa .testo b { color:#8a7a66 }
.testo small { font-size:12.5px; font-weight:700; color:#6d5a44 }
</style>
