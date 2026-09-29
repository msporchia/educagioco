<script setup>
// Il regalo: un velo con tre carte, dal catalogo di data/castello.js
// (REGALI, regaliOfferti) — qui non si decide niente, si mostra. Vedi
// docs/castello/libere.md. «Più tardi» rimanda, non butta: l'ondata dopo
// non parte finché non si è scelto.
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { regaliOfferti } from '../../data/castello.js'
import { CIECA } from '../../giochi/pausa.js'

const props = defineProps({
  presi: { type: Number, default: 0 },     // quanti se ne sono già presi: il giro delle carte
  gradi: { type: Object, default: () => ({}) },   // { id: quanti }, i gradi già presi
})
const emit = defineEmits(['scegli', 'piuTardi'])

const carte = computed(() => regaliOfferti(props.presi).map(r => ({
  ...r, grado: Math.max(0, Math.floor(props.gradi[r.id] || 0)),
})))

const pronto = ref(false)
let cieca = 0
onMounted(() => { cieca = setTimeout(() => { pronto.value = true }, CIECA) })
onUnmounted(() => clearTimeout(cieca))

function scegli(id) {
  if (!pronto.value) return
  emit('scegli', id)
}
</script>

<template>
  <div class="re-velo" data-regalo-velo :class="{ pronto }">
    <div class="re-foglio">
      <div class="re-cima">
        <span class="re-dono" aria-hidden="true">🎁</span>
        <h2>Un regalo!</h2>
        <p class="re-sotto">Scegline uno: resta <b>per sempre</b>, anche nelle
          prossime partite.</p>
      </div>

      <div class="re-carte">
        <button v-for="r in carte" :key="r.id" type="button" class="re-carta"
                :data-regalo="r.id" @click="scegli(r.id)">
          <span class="re-em" aria-hidden="true">{{ r.emoji }}</span>
          <b>{{ r.nome }}</b>
          <span class="re-che">{{ r.che }}</span>
          <i class="re-passo">{{ r.per }}</i>
          <span class="re-grado" :class="{ nuovo: !r.grado }">
            <template v-if="r.grado">{{ r.grado }} → {{ r.grado + 1 }}</template>
            <template v-else>nuovo</template>
          </span>
        </button>
      </div>

      <button type="button" class="bottone chiaro stretto" data-regalo-dopo
              @click="$emit('piuTardi')">Guardo prima il campo</button>
    </div>
  </div>
</template>

<style scoped>
/* sopra il foglio (4-5), sotto la pausa (130) */
.re-velo { position:absolute; inset:0; z-index:60; display:flex;
           align-items:center; justify-content:center; padding:14px;
           background:#131a2ad9; backdrop-filter:blur(3px);
           animation:re-entra .18s ease-out; overflow-y:auto }
@keyframes re-entra { from { opacity:0 } }
.re-foglio { display:flex; flex-direction:column; align-items:center; gap:10px;
             width:100%; max-width:420px; margin:auto }
.re-cima { text-align:center; color:#eef2fa }
.re-dono { font-size:clamp(30px,9vw,40px); display:block; line-height:1;
           animation:re-salta 1.4s ease-in-out infinite }
@keyframes re-salta { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-5px) } }
.re-cima h2 { color:#eef2fa; font-size:clamp(20px,5.6vw,25px); margin:2px 0 0 }
.re-sotto { font-size:12.5px; color:#b9c6e6; margin:2px 0 0 }

.re-carte { display:flex; flex-direction:column; gap:8px; width:100% }
.re-carta { position:relative; background:var(--carta); border-radius:16px;
            padding:9px 12px 9px 52px; text-align:left;
            display:grid; grid-template-columns:1fr auto; gap:0 8px;
            align-items:center; opacity:.5; transition:opacity .18s ease;
            box-shadow:0 4px 0 #dde3ea }
.re-velo.pronto .re-carta { opacity:1 }
.re-carta:active { transform:translateY(2px); box-shadow:0 2px 0 #dde3ea }
.re-em { position:absolute; left:12px; top:50%; transform:translateY(-50%);
         font-size:27px; line-height:1 }
.re-carta b { grid-column:1; font-size:14px; color:var(--viola-scuro) }
.re-che { grid-column:1; font-size:11px; color:var(--tenue); line-height:1.25 }
.re-passo { grid-column:1; font-style:normal; font-size:12px; font-weight:800;
            color:#8a6b00 }
.re-grado { grid-column:2; grid-row:1 / span 3; justify-self:end;
            font-size:12.5px; font-weight:900; color:#2c7a4a;
            background:#e6f6ec; border-radius:999px; padding:4px 9px;
            white-space:nowrap }
.re-grado.nuovo { color:#5b5468; background:#f1eff6 }
.re-foglio .bottone { margin-top:2px }
</style>
