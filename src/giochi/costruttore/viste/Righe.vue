<script setup>
// Un elenco di righe, che si chiama da sé (un blocco ha dentro un altro
// elenco). Non tocca il programma: chiama l'editore iniettato da
// Editor.vue. Vedi docs/costruttore/progetti.md (la mano, ✂/⧉).
import { inject } from 'vue'
import { pezzi, iconaDi } from './frasi.js'
import { colore } from '../dati/colori.js'
import Scelta from './Scelta.vue'

defineOptions({ name: 'Righe' })
const props = defineProps({
  righe: { type: Array, required: true },
  dove: { type: Object, required: true },     // { progetto, dentro, ramo } di questo elenco
  profondita: { type: Number, default: 0 },
  /* le righe di un attrezzo: si leggono e basta */
  bloccata: { type: Boolean, default: false },
  /* dentro la riga che si sta spostando: qui non si posa */
  senzaPosti: { type: Boolean, default: false },
  /* i colori dei blocchi che contengono questo elenco: un blocco dentro non li ripete */
  tinte: { type: Array, default: () => [] },
})

const ed = inject('editore')
const conCorpo = i => ['ripeti', 'finche', 'sempre', 'se'].includes(i.tipo)
/* un blocco abbraccia le sue righe e si chiude con una barra, col colore
   suo: la sola rientranza non diceva a un bambino cosa sta dentro
   (docs/costruttore/linguaggio.md). Il colore viene dall'id, quindi resta
   finché il blocco esiste; se lo ha già chi lo contiene, si passa al dopo. */
const TINTE = [
  ['#8a6fd1', '#ece5fb', '#f8f5fe'], ['#e0892b', '#fcebd6', '#fef7ee'], ['#2a9488', '#dcf2ef', '#f2faf9'],
  ['#3f74d6', '#dfe8fb', '#f3f7fe'], ['#cf4f93', '#f9e0ee', '#fdf3f8'], ['#6f9a2e', '#e6f1d6', '#f6faef'],
]
function tinta(i) {
  const n = parseInt(String(i.id).replace(/\D/g, ''), 10) || 0
  let t = n % TINTE.length
  while (props.tinte.includes(t) && props.tinte.length < TINTE.length) t = (t + 1) % TINTE.length
  return t
}
const stileDi = i => {
  if (!conCorpo(i)) return null
  const [ab, testa, pancia] = TINTE[tinta(i)]
  return { '--ab': ab, '--ab-testa': testa, '--ab-pancia': pancia }
}
/* ferme mentre il programma gira, e sempre in un attrezzo */
const ferma = () => ed.sola.value || props.bloccata

const mano = () => ed.mano.value
function tocca(i) {
  if (ferma()) return
  /* con una riga in mano si tocca solo dove posarla; toccare lei la lascia */
  if (mano()) { if (mano().id === i.id) ed.prendi(null); return }
  ed.seleziona(ed.sel.value === i.id ? null : i.id)
}
/* una casella che ha una scelta sola non si apre, e non ha il ▾: il ▾
   promette una scelta, e il colore di un livello con un colore solo non
   lo è. Solo se quello che c'è scritto è proprio quell'unica scelta. */
function unaSola(i, p) {
  const c = ed.contesto.value
  if (p.tipo === 'posto') return c.posti.length < 2 && c.posti.includes(i.dove || 'sotto')
  if (p.tipo === 'colore' && !c.porto) return c.colori.length < 2 && p.colore === c.colori[0] &&
    !c.nomi.misureColore.length && !c.nomi.ordineColore.length
  return false
}
function casella(i, p) {
  if (ferma() || mano() || !p.campo || unaSola(i, p)) return
  ed.apri(i.id, p.campo, p.tipo)
}
/* i posti dove posare quello che si ha in mano */
const conPosti = () => !!mano() && !ferma() && !props.senzaPosti
const spostando = () => mano() && !mano().copia
/* spostando, sopra di lei e subito sotto è lo stesso posto dov'è già */
function postoSopra(k) {
  if (!conPosti()) return false
  if (!spostando()) return true
  const id = mano().id
  return props.righe[k].id !== id && !(k > 0 && props.righe[k - 1].id === id)
}
const postoInFondo = () => conPosti() &&
  !(spostando() && props.righe.length && props.righe[props.righe.length - 1].id === mano().id)
const inFondo = () => (props.dove.dentro ? { dentro: props.dove.dentro, ramo: props.dove.ramo, inFondo: true }
  : { progetto: props.dove.progetto })
const nomeInFondo = () => (props.dove.dentro ? `${props.dove.dentro}:${props.dove.ramo}` : (props.dove.progetto || 'principale'))
const aperta = (i, p) => ed.aperta.value && ed.aperta.value.id === i.id && ed.aperta.value.campo === p.campo
const apertaQui = i => ed.aperta.value && ed.aperta.value.id === i.id
</script>

<template>
  <ol class="cst-righe" :class="{ 'cst-dentro': profondita > 0 }">
    <template v-for="(i, k) in props.righe" :key="i.id">
    <li v-if="postoSopra(k)" class="cst-riga-posto">
      <button type="button" class="cst-posa" :data-posa="'prima:' + i.id" @click="ed.posa({ prima: i.id })">📥 qui</button>
    </li>
    <li class="cst-riga-posto" :class="{ 'cst-abbraccio': conCorpo(i) }" :style="stileDi(i)">
      <div class="cst-riga" :data-riga="i.id"
           :class="{ 'cst-sel': ed.sel.value === i.id, 'cst-accesa': ed.accesa.value === i.id,
                     'cst-in-mano': mano() && mano().id === i.id,
                     'cst-guasta': ed.guasto.value === i.id, 'cst-problema': ed.problemi.value.has(i.id),
                     'cst-blocco': conCorpo(i) }"
           :data-guasto="ed.guasto.value === i.id ? '' : null"
           @click="tocca(i)">
        <span class="cst-ico">{{ iconaDi(i, ed.programma.value) }}</span>
        <template v-for="(p, k) in pezzi(i, ed.programma.value)" :key="k">
          <button v-if="p.campo" type="button" class="cst-casella"
                  :class="{ 'cst-aperta': aperta(i, p), 'cst-lav': p.lavagnetta, 'cst-manca': p.manca, 'cst-fissa': ferma() || unaSola(i, p) }"
                  :style="p.colore ? { '--cst-tinta': (colore(p.colore) || {}).tinta } : null"
                  :aria-label="p.etichetta || null"
                  :data-casella="p.campo" @click.stop="casella(i, p)">
            <i v-if="p.colore" class="cst-quadretto"></i>{{ p.mostra }}
          </button>
          <span v-else class="cst-testo" :class="{ 'cst-nome-prog': p.progetto, 'cst-misura': p.misura }">{{ p.testo }}</span>
        </template>
        <span v-if="ed.giro.value && ed.giro.value.id === i.id" class="cst-giro">
          volta {{ ed.giro.value.n }}<template v-if="ed.giro.value.di"> di {{ ed.giro.value.di }}</template>
        </span>
      </div>

      <!-- la scelta di una casella, attaccata alla sua riga -->
      <Scelta v-if="apertaQui(i)" :tipo="ed.aperta.value.tipo" :riga="i" :campo="ed.aperta.value.campo"
              :contesto="ed.contesto.value"
              @scegli="v => ed.imposta(i.id, ed.aperta.value.campo, v)"
              @chiudi="ed.apri(null)" @avanti="ed.avanti(i.id)" @nuova-lavagnetta="ed.nuovaLavagnetta(i.id)" />

      <!-- i tasti della riga selezionata -->
      <div v-if="ed.sel.value === i.id && !ferma() && !mano()" class="cst-tasti-riga">
        <button type="button" data-azione="sopra" aria-label="sposta su" @click="ed.azione('su', i.id)">↑</button>
        <button type="button" data-azione="sotto" aria-label="sposta giù" @click="ed.azione('giu', i.id)">↓</button>
        <button type="button" data-azione="sposta" aria-label="prendi e sposta" @click="ed.prendi(i.id, false)">✂️ sposta</button>
        <button type="button" data-azione="copia" aria-label="copia" @click="ed.prendi(i.id, true)">⧉ copia</button>
        <button v-if="i.tipo === 'se'" type="button" data-azione="altrimenti" @click="ed.azione('altrimenti', i.id)">
          {{ i.altrimenti ? '− altrimenti' : '＋ altrimenti' }}</button>
        <button type="button" class="cst-agg" data-azione="aggiungi-dopo" @click="ed.aggiungi({ dopo: i.id })">＋ sotto</button>
        <button type="button" class="cst-via" data-azione="togli-riga" aria-label="togli la riga" @click="ed.azione('togli', i.id)">🗑</button>
      </div>

      <!-- i corpi dei blocchi -->
      <template v-if="conCorpo(i)">
        <Righe :righe="i.corpo || i.allora || []" :profondita="profondita + 1" :bloccata="bloccata"
               :tinte="[...tinte, tinta(i)]"
               :senza-posti="senzaPosti || !!(spostando() && mano().id === i.id)"
               :dove="{ progetto: dove.progetto, dentro: i.id, ramo: i.tipo === 'se' ? 'allora' : 'corpo' }" />
        <template v-if="i.tipo === 'se' && i.altrimenti">
          <div class="cst-altrimenti" data-altrimenti>altrimenti</div>
          <Righe :righe="i.altrimenti" :profondita="profondita + 1" :bloccata="bloccata"
                 :tinte="[...tinte, tinta(i)]"
                 :senza-posti="senzaPosti || !!(spostando() && mano().id === i.id)"
                 :dove="{ progetto: dove.progetto, dentro: i.id, ramo: 'altrimenti' }" />
        </template>
        <div class="cst-fine" :data-chiude="i.id">
          <button v-if="i.tipo === 'se' && !i.altrimenti && !ferma() && !mano()" type="button"
                  data-azione="aggiungi-altrimenti" @click="ed.azione('altrimenti', i.id)">＋ altrimenti</button>
        </div>
      </template>
    </li>
    </template>
    <li v-if="postoInFondo()" class="cst-riga-posto">
      <button type="button" class="cst-posa" :data-posa="'fondo:' + nomeInFondo()" @click="ed.posa(inFondo())">
        📥 {{ profondita > 0 ? 'qui dentro' : 'qui' }}{{ righe.length ? ', in fondo' : '' }}</button>
    </li>
    <li v-if="!ferma() && !mano()" class="cst-riga-posto">
      <button type="button" class="cst-piu" :data-aggiungi="nomeInFondo()" @click="ed.aggiungi(inFondo())">
        ＋ <span>{{ profondita > 0 ? 'qui dentro' : 'aggiungi' }}</span>
      </button>
    </li>
  </ol>
</template>
