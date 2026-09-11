<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL BANCO — la ricetta, gli attrezzi, lo scaffale

   Dall'alto in basso: la pergamena con la ricetta e il calderone, il
   cartello con l'aiuto (quando c'è), gli attrezzi in mezzo, lo
   scaffale degli ingredienti in fondo — vicino al pollice, perché è
   da lì che si prende.

   **Si trascina.** Un ingrediente si prende dallo scaffale e si porta
   sull'attrezzo; se il dito si stacca senza essersi mosso, è un tocco:
   l'ingrediente resta «in mano» e si posa toccando l'attrezzo. Tutte e
   due le strade portano agli stessi due eventi, `prendi` e `posa`, e
   chi sta sopra non sa quale delle due è stata usata.

   Il dito si lascia dietro un click, e va ingoiato: dopo un
   trascinamento col dito arriva un `click` sul punto in cui si è
   mollato — cioè sull'attrezzo, che si «toccherebbe» da solo. Col
   mouse non succede. Vedi `zittisciIlFantasma`, lo stesso rimedio della
   fattoria.

   Questa vista non decide niente: riceve la partita e dice cosa il
   bambino ha fatto.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed } from 'vue'
import { FAMIGLIA, scrivi, QUANTO_E } from '../dati/misure.js'
import Strumento from './Strumento.vue'

const props = defineProps({
  partita: { type: Object, required: true },
  bloccato: { type: Boolean, default: false },   // la finestra cieca e le attese
  attesa: { type: Number, default: 0 },          // 0..1, quanto manca alla fine dell'esito
  calderone: { type: Object, default: () => ({ colore: '#4b3f7d', dentro: [] }) },
  strumentiTutti: { type: Array, required: true },
})
const emit = defineEmits(['prendi', 'posa', 'metti', 'togli', 'svuota', 'riponi', 'conferma'])

const p = computed(() => props.partita)
const ricetta = computed(() => p.value.ricetta)
const ing = computed(() => p.value.ingrediente)
const strumento = computed(() => p.value.strumento)
const esito = computed(() => p.value.esito)
const aiuto = computed(() => p.value.aiuto)
const famigliaDi = chiave => FAMIGLIA[chiave]

/* fin dove arriva un attrezzo, detto nell'unità grande della famiglia */
const finoA = s => scrivi(s.limite, FAMIGLIA[s.famiglia].unita.G)
const livello = computed(() => (strumento.value ? Math.min(1, p.value.messo / strumento.value.limite) : 0))
const lettura = computed(() => (strumento.value ? scrivi(p.value.messo, strumento.value.unita) : ''))

/* ── il suggerimento di come si gioca, per la prima tappa ──
   Cambia con la fase: dice la prossima cosa da fare e basta. */
const comeSiGioca = computed(() => {
  if (!aiuto.value || aiuto.value.livello !== 'gioco') return ''
  const f = ing.value ? famigliaDi(ing.value.famiglia) : null
  if (p.value.fase === 'scaffale') {
    const prossimo = p.value.daFare[0]
    return prossimo ? `Prendi ${prossimo.nome} dallo scaffale e trascinalo ${famigliaDi(prossimo.famiglia).dove}` : ''
  }
  if (p.value.fase === 'inMano') return `Ora mettilo ${f.dove}`
  return `Metti i ${f.pezzo === 'peso' ? 'pesi' : f.pezzo === 'pezzo' ? 'pezzi' : 'misurini'} finché il numero fa ${ing.value.dose.testo}, poi «nel calderone»`
})

/* ═══════════ il trascinamento ═══════════ */
const SOGLIA = 16              // sotto, un dito è ancora fermo (non 4 px come un mouse)
const FANTASMA_MS = 120, FANTASMA_PX = 32
const presa = ref(null)        // { nome, emoji, x, y, x0, y0, mosso, sopra }

function zittisciIlFantasma(x, y) {
  const t0 = performance.now()
  const smetti = () => removeEventListener('click', zitto, true)
  const zitto = ev => {
    if (performance.now() - t0 > FANTASMA_MS) return smetti()
    if (Math.hypot(ev.clientX - x, ev.clientY - y) > FANTASMA_PX) return
    ev.stopPropagation(); ev.preventDefault(); smetti()
  }
  addEventListener('click', zitto, true)
  setTimeout(smetti, FANTASMA_MS + 20)
}

function strumentoSotto(x, y) {
  const el = document.elementFromPoint(x, y)
  const s = el && el.closest ? el.closest('[data-strumento]') : null
  return s ? s.getAttribute('data-strumento') : null
}

function giu(e, s) {
  if (props.bloccato || esito.value || (e.button != null && e.button !== 0)) return
  if (ricetta.value.ingredienti.some(i => i.nome === s.nome && i.fatto)) return
  try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* niente */ }
  presa.value = { nome: s.nome, emoji: s.emoji, x: e.clientX, y: e.clientY,
                  x0: e.clientX, y0: e.clientY, mosso: false, sopra: null }
}
function muovi(e) {
  const q = presa.value
  if (!q) return
  q.x = e.clientX; q.y = e.clientY
  if (!q.mosso && Math.hypot(q.x - q.x0, q.y - q.y0) > SOGLIA) q.mosso = true
  if (q.mosso) q.sopra = strumentoSotto(q.x, q.y)
}
function su(e) {
  const q = presa.value
  presa.value = null
  if (!q) return
  if (e.pointerType !== 'mouse') zittisciIlFantasma(e.clientX, e.clientY)
  /* un tocco secco: l'ingrediente resta in mano. Un trascinamento: si
     prende e, se il dito è sopra un attrezzo, si posa lì */
  emit('prendi', q.nome)
  if (q.mosso && q.sopra) emit('posa', q.sopra)
}
function annulla() { presa.value = null }

/* toccare un attrezzo con qualcosa in mano lo posa */
function toccaStrumento(chiave) {
  if (props.bloccato || esito.value) return
  if (p.value.fase === 'inMano') emit('posa', chiave)
}

const quantoE = u => QUANTO_E[u] || ''
</script>

<template>
  <div class="pz-banco" :class="{ 'pz-bloccato': bloccato }" :data-fase="partita.fase">
    <!-- ═════ LA PERGAMENA E IL CALDERONE ═════ -->
    <div class="pz-alto">
      <div class="pz-pergamena" data-pergamena>
        <b><span class="em">{{ ricetta.emoji }}</span> {{ ricetta.nome }}</b>
        <div class="pz-voci">
          <div v-for="(i, n) in ricetta.ingredienti" :key="i.nome" class="pz-voce"
               :class="{ 'pz-fatto': i.fatto, 'pz-qui': n === partita.corrente && !i.fatto }"
               :data-voce="i.nome">
            <span class="em">{{ i.fatto ? '✅' : i.emoji }}</span>
            <span><b data-dose>{{ i.dose.testo }}</b> di {{ i.nome }}</span>
          </div>
        </div>
      </div>
      <div class="pz-paiolo" :style="{ '--p': calderone.colore }">
        <div class="pz-cliente em">{{ ricetta.cliente }}</div>
        <div class="pz-pentola"><div class="pz-brodo"></div></div>
        <span v-for="(e, n) in calderone.dentro" :key="n" class="pz-galleggia em"
              :style="{ left: 18 + n * 24 + '%', animationDelay: n * .4 + 's' }">{{ e }}</span>
      </div>
    </div>

    <!-- ═════ IL CARTELLO ═════
         L'aiuto della tappa, o quello che un esito ha da dire. Sta
         sopra il banco, dove l'occhio sta già guardando la dose. -->
    <div v-if="esito" class="pz-cartello" :class="'pz-' + esito.tipo" data-esito
         :data-codice="esito.codice || 'giusto'">
      <template v-if="esito.tipo === 'giusto'">
        <b>✨ {{ esito.ingrediente.emoji }} nel calderone!</b>
      </template>
      <template v-else>
        <b>💥 {{ esito.testo }}</b>
        <div v-if="esito.spiegazione && !esito.spiegazione.uguale" class="pz-cosi" data-spiegazione>
          <i>Si fa così</i>
          <span>{{ esito.spiegazione.passi }} · {{ esito.spiegazione.come }}</span>
          <div class="pz-catena">
            <template v-for="(v, n) in esito.spiegazione.catena" :key="n">
              <em v-if="n">→</em><span :class="{ 'pz-meta': n === esito.spiegazione.catena.length - 1 }">{{ v }}</span>
            </template>
          </div>
        </div>
        <div class="pz-attesa" aria-hidden="true"><i :style="{ width: attesa * 100 + '%' }"></i></div>
      </template>
    </div>

    <div v-else-if="aiuto" class="pz-cartello pz-aiuto" data-aiuto :data-livello="aiuto.livello">
      <template v-if="aiuto.livello === 'gioco'">
        <b>👉 {{ comeSiGioca }}</b>
      </template>
      <template v-else-if="aiuto.uguale">
        <b>{{ aiuto.testo }}</b>
      </template>
      <template v-else>
        <b>{{ aiuto.regola }}</b>
        <div class="pz-gradinata">
          <template v-for="(u, n) in aiuto.scala" :key="u">
            <i v-if="n" class="pz-per">×10</i>
            <span class="pz-u" :class="{ 'pz-capo': n === 0 || n === aiuto.scala.length - 1 }">{{ u }}</span>
          </template>
        </div>
        <template v-if="aiuto.livello === 'svolto'">
          <span v-if="aiuto.consiglia" class="pz-consiglio" data-consiglio>
            👉 {{ ing.dose.testo }} {{ famigliaDi(ing.famiglia).dove }} dei
            {{ famigliaDi(ing.famiglia).parole.P[1] }} non ci stanno:
            usa <b>{{ aiuto.strumento.nome }}</b>, che conta in {{ aiuto.strumento.unita }}
          </span>
          <span class="pz-procedimento" data-procedimento>{{ aiuto.passi }} · {{ aiuto.come }}</span>
          <div class="pz-catena">
            <template v-for="(v, n) in aiuto.catena" :key="n">
              <em v-if="n">→</em><span :class="{ 'pz-meta': n === aiuto.catena.length - 1 }">{{ v }}</span>
            </template>
          </div>
        </template>
        <i v-else class="pz-quanto">1 {{ aiuto.scala[0] }} è {{ quantoE(aiuto.scala[0]) }} ·
          1 {{ aiuto.scala[aiuto.scala.length - 1] }} è {{ quantoE(aiuto.scala[aiuto.scala.length - 1]) }}</i>
      </template>
    </div>

    <!-- ═════ GLI ATTREZZI ═════
         Tutti in fila finché non se ne sceglie uno; poi resta quello,
         con i suoi pezzi sotto. -->
    <div class="pz-attrezzi" :class="{ 'pz-uno': !!strumento, 'pz-tanti': strumentiTutti.length > 3 }">
      <template v-if="!strumento">
        <button v-for="s in strumentiTutti" :key="s.chiave" class="pz-attrezzo"
                :class="{ 'pz-sopra': presa && presa.sopra === s.chiave, ['pz-' + s.gesto]: true }"
                :data-strumento="s.chiave" :data-taglia="s.taglia"
                @click="toccaStrumento(s.chiave)">
          <Strumento :gesto="s.gesto" :taglia="s.taglia" />
          <span class="pz-targa">
            <b>{{ s.nome }}</b>
            <i>conta in <em>{{ s.unita }}</em> · fino a {{ finoA(s) }}</i>
          </span>
        </button>
      </template>

      <div v-else class="pz-dosa" :data-dosa="strumento.chiave">
        <div class="pz-testa">
          <span class="pz-targa">
            <b>{{ strumento.nome }}</b>
            <i>conta in <em>{{ strumento.unita }}</em> · fino a {{ finoA(strumento) }}</i>
          </span>
          <button class="pz-piccolo" data-azione="riponi" :disabled="bloccato || !!esito"
                  @click="$emit('riponi')">↺ cambia</button>
        </div>
        <div class="pz-corpo">
          <div class="pz-figura-grande">
            <Strumento :gesto="strumento.gesto" :taglia="strumento.taglia" :livello="livello"
                       :pezzi="partita.messi.length" :colore="ing ? ing.colore : '#c98adf'" />
            <span class="pz-sopra-figura em">{{ ing ? ing.emoji : '' }}</span>
          </div>
          <div class="pz-lettura" data-lettura>{{ lettura }}</div>
        </div>
        <div class="pz-pezzi">
          <button v-for="pz in strumento.pezzi" :key="pz" class="pz-pezzo" :data-pezzo="pz"
                  :disabled="bloccato || !!esito || partita.messo + pz > strumento.limite"
                  @click="$emit('metti', pz)">{{ scrivi(pz, strumento.unita) }}</button>
          <button class="pz-pezzo pz-annulla" data-azione="togli"
                  :disabled="bloccato || !!esito || !partita.messi.length" @click="$emit('togli')">↶</button>
        </div>
        <div class="pz-azioni">
          <button class="pz-piccolo" data-azione="svuota" :disabled="bloccato || !!esito || !partita.messi.length"
                  @click="$emit('svuota')">svuota</button>
          <button class="pz-grosso pz-conferma" data-azione="conferma"
                  :disabled="bloccato || !!esito || !partita.messi.length"
                  @click="$emit('conferma')">nel calderone ⤵</button>
        </div>
      </div>
    </div>

    <!-- ═════ LO SCAFFALE ═════ -->
    <div class="pz-scaffale" data-scaffale>
      <button v-for="s in ricetta.scaffale" :key="s.nome" class="pz-ingrediente"
              :class="{ 'pz-fatto': ricetta.ingredienti.some(i => i.nome === s.nome && i.fatto),
                        'pz-in-mano': ing && ing.nome === s.nome && partita.fase === 'inMano',
                        'pz-in-uso': ing && ing.nome === s.nome && partita.fase === 'dosa',
                        'pz-preso': presa && presa.nome === s.nome }"
              :data-ingrediente="s.nome" :aria-label="s.nome"
              @pointerdown="e => giu(e, s)" @pointermove="muovi" @pointerup="su" @pointercancel="annulla">
        <span class="pz-icona em">{{ s.emoji }}</span>
        <span class="pz-nome">{{ s.nome }}</span>
      </button>
    </div>

    <!-- l'ingrediente appeso al dito -->
    <div v-if="presa && presa.mosso" class="pz-fantasma em"
         :style="{ left: presa.x + 'px', top: presa.y + 'px' }">{{ presa.emoji }}</div>
  </div>
</template>
