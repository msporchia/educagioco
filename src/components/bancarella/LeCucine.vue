<script setup>
/* La scelta delle cucine.
   Riceve il banco e dice cosa si vuole fare. Vedi docs/bancarella/cucina.md. */
import { computed } from 'vue'
import { CUCINE } from '../../data/bancarella-cucine.js'
import { FOTO } from '../../data/bancarella-foto.js'

const props = defineProps({
  banco: { type: Object, required: true },
  aperta: { type: Function, required: true },  // la regola dei lucchetti la dice chi gioca
})
const emit = defineEmits(['scegli'])

const fatte = computed(() => props.banco.cucina.fatte)
const chiusa = k => !props.aperta(k)
</script>

<template>
  <div class="cucine" data-cucine>
    <button v-for="(c, k) in CUCINE" :key="c.id" type="button" class="livello" :class="{ chiusa: chiusa(k), fatta: k < fatte }" :data-cucina-n="k + 1"
            :disabled="chiusa(k)" @click="emit('scegli', k)">
      <img :src="FOTO['piatto:' + c.foto]" alt="">
      <span class="testo"><b>{{ c.durata ? '⏱️' : k + 1 }} · {{ c.nome }}</b><small>{{ c.nuovo }}</small></span>
    </button>
  </div>
</template>

<style scoped>
.cucine { flex:1; min-height:0; overflow-y:auto; overscroll-behavior:contain; display:flex; flex-direction:column; gap:8px; padding:10px 12px calc(14px + env(safe-area-inset-bottom)) }
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
