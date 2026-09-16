<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL REGALO — ogni cinque ondate della partita libera

   Un velo con tre carte: si sceglie un potenziamento e **resta per
   sempre**, anche nelle partite di domani. Il catalogo, i numeri e
   quali tre carte toccano a questo giro stanno in `data/castello.js`
   (`REGALI`, `regaliOfferti`): qui non si decide niente, si mostra.

   ── perché tre e non tutte e sette ──
   Su uno schermo verticale tre carte si leggono senza scorrere, e
   scegliere fra sette è un catalogo da studiare, non una decisione. Le
   tre girano a ogni regalo, quindi quella che si voleva torna: è la
   ragione per cui si può offrire di meno senza togliere niente.

   ── cosa dice una carta ──
   Il grado che si ha e quello che diventa (`3 → 4`), non solo il
   passo: «+8% di danno» da solo non dice se si è al principio o al
   ventesimo giro, e la cosa che un bambino guarda è **quanto ne ha
   già**. Chi è a zero non legge nessuna freccia: «nuovo».

   ── il «più tardi» ──
   Non butta il regalo, lo rimanda: l'ondata dopo non parte finché non
   si è scelto (la regola sta nel motore, `daScegliere`), quindi il velo
   torna appena si prova a chiamarla. Serve a poter guardare il campo —
   cosa c'è in piedi, che ramo hanno le torri — prima di decidere, che è
   esattamente l'informazione che rende la scelta una scelta.

   La finestra cieca è quella di tutti (`giochi/pausa.js`): il dito che
   ha chiuso l'ondata si lascia dietro un click, e senza quei 320 ms
   atterrerebbe sulla prima carta scegliendo al posto del bambino.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { regaliOfferti } from '../../data/castello.js'
import { CIECA } from '../../giochi/pausa.js'

const props = defineProps({
  /* quanti se ne sono già presi in tutto: è il giro delle carte */
  presi: { type: Number, default: 0 },
  /* `{ id: quanti }`, i gradi che questo bambino ha già */
  gradi: { type: Object, default: () => ({}) },
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
/* Sopra il foglio del castello (4-5) e sotto la pausa (130): la pausa è
   lo stato più esterno, quindi il telefono posato davanti a un regalo
   mostra la pausa e dietro il regalo che aspetta. */
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

/* Una colonna, non una griglia: le carte hanno una riga di testo da
   leggere, e in verticale tre carte larghe si scorrono con gli occhi
   invece che con il dito. */
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
