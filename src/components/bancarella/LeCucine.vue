<script setup>
/* La scelta delle cucine.
   Riceve il banco e dice cosa si vuole fare. Vedi docs/bancarella/cucina.md. */
import { ref, shallowRef, computed, onMounted, onBeforeUnmount } from 'vue'
import { CUCINE } from '../../data/bancarella-cucine.js'
import { FOTO } from '../../data/bancarella-foto.js'
import IlCuoco from './IlCuoco.vue'

const props = defineProps({
  banco: { type: Object, required: true },
  aperta: { type: Function, required: true },  // la regola dei lucchetti la dice chi gioca
})
const emit = defineEmits(['scegli', 'due', 'cuoco'])

const fatte = computed(() => props.banco.cucina.fatte)
const chiusa = k => !props.aperta(k)

/* Il tuo cuoco (docs/bancarella/cuoco.md): la sua foto sul tasto, e il foglio per cambiarlo. Le foto le fa un renderer piccolo,
   che vive finché si sta nella scelta delle cucine. */
const ritratti = shallowRef(null)
const foglio = ref(false)
const faccia = ref('')
let via = false
onMounted(async () => {
  const { creaRitratti } = await import('../../grafica/cucina3d/ritratto.js')
  if (via) return
  ritratti.value = creaRitratti()
})
onBeforeUnmount(() => { via = true; ritratti.value?.via() })
const vesteAdesso = computed(() => props.banco.cuoco)
// la foto sul tasto: si chiede di nuovo quando il cuoco cambia
const fotoTasto = computed(() => {
  const r = ritratti.value, v = vesteAdesso.value
  if (!r) return ''
  const pronta = r.leggi(v, { quadro: 'testa' })
  if (!pronta) r.chiedi(v, { quadro: 'testa' }).then(url => { if (url && vesteAdesso.value === v) faccia.value = url })
  return pronta || faccia.value
})
</script>

<template>
  <div class="cucine" data-cucine>
    <div class="in-cima">
      <button type="button" class="tasto cuoco" data-il-cuoco @click="foglio = true">
        <span class="faccia"><img v-if="fotoTasto" :src="fotoTasto" alt=""></span><span class="testo"><b>Il tuo cuoco</b><small>scegli chi cucina</small></span>
      </button>
      <button type="button" class="tasto in-due" data-cucina-in-due @click="emit('due')">
        <span class="em">👥</span><span class="testo"><b>In due</b><small>ognuno col suo telefono</small></span>
      </button>
    </div>

    <button v-for="(c, k) in CUCINE" :key="c.id" type="button" class="livello" :class="{ chiusa: chiusa(k), fatta: k < fatte }" :data-cucina-n="k + 1"
            :disabled="chiusa(k)" @click="emit('scegli', k)">
      <img :src="FOTO['piatto:' + c.foto]" alt="">
      <span class="testo"><b>{{ c.durata ? '⏱️' : k + 1 }} · {{ c.nome }}</b><small>{{ c.nuovo }}</small></span>
    </button>
    <IlCuoco v-if="foglio" :veste="banco.cuoco" :ritratti="ritratti" @scegli="v => emit('cuoco', v)" @chiudi="foglio = false" />
  </div>
</template>

<style scoped>
.cucine { flex:1; min-height:0; overflow-y:auto; overscroll-behavior:contain; display:flex; flex-direction:column; gap:8px; padding:10px 12px calc(14px + env(safe-area-inset-bottom)) }
.in-cima { flex:none; display:grid; grid-template-columns:1fr 1fr; gap:8px }
.tasto { min-width:0; display:flex; align-items:center; gap:8px; padding:8px 10px; border:0; border-radius:14px; text-align:left; background:#ffe9b8; box-shadow:0 3px 0 #0000001f }
.tasto:active { transform:translateY(2px) }
.cuoco { background:#fde0d2 }
.in-due .em { font-size:30px }
.faccia { flex:none; width:44px; height:44px; border-radius:50%; background:#fff6ec; overflow:hidden }
.faccia img { width:100%; height:100%; object-fit:cover }
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
