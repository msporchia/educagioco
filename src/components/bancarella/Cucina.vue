<script setup>
/* La cucina della bancarella, in prova: il fornello, i due piatti, la dispensa.
   Riceve lo stato e dice cosa si è toccato. Vedi docs/bancarella/cucina.md. */
import { computed } from 'vue'
import { quantoPentola } from '../../motore/bancarella/cucina.js'
import { disegnaFornello, FIGURA_PASTA, FIGURA_PIATTO } from '../../grafica/bancarella-cucina.js'

const props = defineProps({ stato: { type: Object, required: true } })
const emit = defineEmits(['tocca', 'servi'])

const fase = computed(() => props.stato.pentola.fase)
const quanto = computed(() => Math.round(quantoPentola(props.stato.pentola) * 100))
const figura = computed(() => disegnaFornello(fase.value))
const SCRITTA = { vuota: 'vuota', cuoce: 'cuoce…', pronta: 'scola!', scotta: 'scotta: buttala' }
const sopra = p => (!p ? '' : p.pronto || (p.cose[0] === 'pane' ? '🍞' : ''))
const sotto = p => (p && p.cose[0] === 'pasta' && !p.pronto ? 'pasta' : '')
</script>

<template>
  <div class="cucina" data-cucina>
    <div class="fuochi">
      <button type="button" class="fornello" :class="'f-' + fase" data-pentola :data-fase="fase" aria-label="la pentola"
              @click="emit('tocca', 'pentola')">
        <svg viewBox="0 0 200 170" aria-hidden="true" v-html="figura"></svg>
        <span class="scritta">{{ SCRITTA[fase] }}</span>
        <span v-if="fase === 'cuoce' || fase === 'pronta'" class="cottura"><i :style="{ width: quanto + '%' }"></i></span>
      </button>
      <div class="piatti">
        <button v-for="(p, i) in stato.piatti" :key="i" type="button" class="piatto" :class="{ pronto: p && p.pronto }"
                :data-piatto="i" :data-pronto="p ? p.pronto : ''" :aria-label="'piatto ' + (i + 1)" @click="emit('servi', i)">
          <svg viewBox="0 0 120 84" aria-hidden="true" v-html="FIGURA_PIATTO(sotto(p))"></svg>
          <span class="sopra">{{ sopra(p) }}</span>
        </button>
      </div>
    </div>
    <div class="dispensa">
      <button type="button" class="cosa" data-cosa="pasta" aria-label="pasta" @click="emit('tocca', 'pasta')">
        <svg viewBox="0 0 100 100" aria-hidden="true" v-html="FIGURA_PASTA"></svg><small>pasta</small>
      </button>
      <button type="button" class="cosa" data-cosa="sugo" aria-label="sugo" @click="emit('tocca', 'sugo')"><b>🍅</b><small>sugo</small></button>
      <button type="button" class="cosa" data-cosa="pane" aria-label="pane" @click="emit('tocca', 'pane')"><b>🍞</b><small>pane</small></button>
      <button type="button" class="cosa" data-cosa="formaggio" aria-label="formaggio" @click="emit('tocca', 'formaggio')"><b>🧀</b><small>formaggio</small></button>
    </div>
  </div>
</template>

<style scoped>
.cucina { flex:1; min-height:0; margin-top:-13px; padding:22px 10px calc(10px + env(safe-area-inset-bottom)); display:flex; flex-direction:column; gap:10px;
          background:linear-gradient(180deg,#d9c8ae,#c2ab8b); box-shadow:inset 0 12px 20px #00000030 }
.fuochi { flex:1; min-height:0; display:grid; grid-template-columns:1.15fr 1fr; gap:10px }
button { padding:0; border:0; background:none; touch-action:manipulation }

.fornello { position:relative; min-height:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px;
            border-radius:16px; background:#ffffff4d; box-shadow:inset 0 0 0 3px #ffffff40 }
.fornello svg { flex:1; min-height:0; width:100%; display:block; overflow:visible }
.fornello :deep(.fiamma) { transform-origin:center bottom; transform-box:fill-box; animation:guizza .35s ease-in-out infinite alternate }
@keyframes guizza { from { transform:scaleY(.82) } to { transform:scaleY(1.1) } }
.scritta { flex:none; font-size:17px; font-weight:900; color:#5a4632 }
.cottura { flex:none; width:82%; height:11px; margin-bottom:8px; border-radius:6px; overflow:hidden; background:#00000026 }
.cottura i { display:block; height:100%; border-radius:6px; background:#4fb36b }
.f-pronta { background:#fff3bf; box-shadow:inset 0 0 0 4px #ffb020; animation:chiama .55s ease-in-out infinite alternate }
.f-pronta .cottura i { background:#ffa62b }
.f-pronta .scritta { color:#a35f00 }
.f-scotta { background:#f5c9bd; box-shadow:inset 0 0 0 4px #d9482f }
.f-scotta .scritta { color:#a8301f }
@keyframes chiama { from { transform:scale(1) } to { transform:scale(1.025) } }
@media (prefers-reduced-motion: reduce) { .f-pronta, .fornello :deep(.fiamma) { animation:none } }

.piatti { min-height:0; display:grid; grid-template-rows:1fr 1fr; gap:10px }
.piatto { position:relative; min-height:0; display:grid; place-items:center; border-radius:16px; background:#ffffff33 }
.piatto svg { width:92%; max-height:100%; display:block; filter:drop-shadow(0 3px 2px #00000030) }
.piatto.pronto { background:#d7f3d4; box-shadow:inset 0 0 0 4px #4fb36b }
.sopra { position:absolute; left:50%; top:50%; transform:translate(-50%,-56%); font-size:clamp(34px,11vw,48px); line-height:1 }

.dispensa { flex:none; display:grid; grid-template-columns:repeat(4,1fr); gap:8px }
.cosa { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; height:84px; border-radius:14px; background:#fffdf7;
        box-shadow:0 4px 0 #00000030 }
.cosa:active { transform:translateY(3px); box-shadow:0 1px 0 #00000030 }
.cosa b { font-size:38px; line-height:1.1; font-weight:400 }
.cosa svg { width:46px; height:46px; display:block }
.cosa small { font-size:12px; font-weight:900; color:#6d5a44 }
</style>
