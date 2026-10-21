<script setup>
// Quando è nato (docs/genitori/riordino.md): mese e anno, solo sul telefono. L'età si tiene aggiornata da sola; se la data dice un'età diversa da
// quella su cui il gioco è tarato (un compleanno, o una data messa dopo), qui si vede cosa succederebbe e si sceglie: passare a quell'età o
// tenerla com'è (lo scarto: «un anno più avanti dei suoi anni»). Niente cambia da solo quando cambia la fascia.
import { ref, computed } from 'vue'
import { state, nomeCorrente, etaDelBambino, nascitaDelBambino, scartoDelBambino, etaDaNascita, impostaNascita, togliNascita } from '../../store/profile.js'
import { MESI, etaAnagrafica, prossimoCompleanno, inParole } from '../../data/nascita.js'
import { cosaCambia, stessaFascia } from '../../store/compleanno.js'
import { spostandoLEta } from '../../data/partenze.js'

const emit = defineEmits(['applica', 'cambiato'])
const giro = ref(0)
const chi = computed(() => nomeCorrente() || 'lui')
const modifica = ref(false)
const mese = ref(0)
const anno = ref(new Date().getFullYear() - 8)
const anni = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i)

const nascita = computed(() => (giro.value, state.player, nascitaDelBambino()))
const eta = computed(() => etaAnagrafica(nascita.value))
const completa = computed(() => (nascita.value ? prossimoCompleanno(nascita.value) : null))
const scarto = computed(() => (giro.value, nascita.value ? scartoDelBambino() : 0))
const tarata = computed(() => (giro.value, etaDelBambino()))
const voluta = computed(() => (giro.value, nascita.value ? etaDaNascita() : null))
const disallineato = computed(() => voluta.value != null && voluta.value !== tarata.value)
const stessa = computed(() => disallineato.value && stessaFascia(tarata.value, voluta.value))
const cambia = computed(() => (disallineato.value ? cosaCambia(tarata.value, voluta.value) : { apre: [], chiude: [] }))
const perde = computed(() => {
  if (!disallineato.value || stessa.value) return 0
  const s = state.profile.settings
  const m = spostandoLEta({ da: tarata.value, a: voluta.value, giochi: s.giochi || {}, sa: s.sa || {}, ritocchi: s.ritocchi || {} })
  return m.chiede ? m.perde.giochi + m.perde.sa + m.perde.ritocchi : 0
})
const unAnno = n => `${Math.abs(n) === 1 ? 'un anno' : Math.abs(n) + ' anni'} ${n > 0 ? 'più avanti' : 'più indietro'}`

function apri() { const n = nascita.value; if (n) { mese.value = n.m; anno.value = n.a } modifica.value = true }
function salva() {
  if (impostaNascita({ m: Number(mese.value), a: Number(anno.value) })) { modifica.value = false; giro.value++; emit('cambiato') }
}
function togli() { togliNascita(); modifica.value = false; giro.value++; emit('cambiato') }
function passa() { emit('applica', voluta.value); giro.value++ }
function tieni() { impostaNascita(nascita.value); giro.value++; emit('cambiato') }
</script>

<template>
  <div class="nascita carta" data-nascita>
    <span class="ico">🎂</span>
    <b>Quando è nato {{ chi }}</b>

    <template v-if="!nascita || modifica">
      <i>Mese e anno bastano, e restano sul telefono. Così l'età si tiene aggiornata da sola e non devi ricordarti di spostarla.</i>
      <div class="riga">
        <select v-model="mese" aria-label="mese di nascita" data-nascita-mese><option v-for="(m, i) in MESI" :key="m" :value="i">{{ m }}</option></select>
        <select v-model="anno" aria-label="anno di nascita" data-nascita-anno><option v-for="a in anni" :key="a" :value="a">{{ a }}</option></select>
      </div>
      <div class="riga">
        <button v-if="modifica" class="bottone chiaro" type="button" @click="modifica = false">Lascia stare</button>
        <button class="bottone" type="button" data-azione="nascita-salva" @click="salva">Salva</button>
      </div>
    </template>

    <template v-else>
      <i data-nascita-eta><template v-if="eta">{{ MESI[nascita.m] }} {{ nascita.a }} · ha {{ inParole(eta) }}</template><template v-else>la data non è valida</template></i>
      <i v-if="scarto" class="scarto" data-nascita-scarto>Lo tari {{ unAnno(scarto) }} dei suoi anni, e così resta ai compleanni.</i>
      <i v-if="completa && !disallineato" class="prossimo">A {{ completa.mese }} compie {{ completa.anni }} anni{{ completa.fra <= 1 ? ' (questo mese)' : ` (fra ${completa.fra} mesi)` }}.</i>

      <div v-if="disallineato" class="avviso-eta" data-nascita-avviso>
        <p><b>Dovrebbe avere {{ voluta }} anni</b>, ma i giochi sono tarati su {{ tarata }}.</p>
        <p v-if="stessa" class="mini">Nella stessa fascia: i giochi non cambiano, si spostano solo le domande.</p>
        <template v-else>
          <p v-if="cambia.apre.length" class="mini">Passando ai {{ voluta }} si aprono: <b>{{ cambia.apre.join(', ') }}</b>.</p>
          <p v-if="cambia.chiude.length" class="mini">Si chiudono: <b>{{ cambia.chiude.join(', ') }}</b>.</p>
          <p v-if="perde" class="mini rosso">Perderesti {{ perde }} {{ perde === 1 ? 'cosa messa' : 'cose messe' }} a mano.</p>
        </template>
        <div class="riga">
          <button class="bottone" type="button" data-azione="nascita-passa" @click="passa">Passa ai {{ voluta }} anni</button>
          <button class="bottone chiaro" type="button" data-azione="nascita-tieni" @click="tieni">Tienilo a {{ tarata }}</button>
        </div>
      </div>

      <div class="riga">
        <button class="bottone chiaro" type="button" data-azione="nascita-cambia" @click="apri">Cambia la data</button>
        <button class="bottone chiaro" type="button" data-azione="nascita-togli" @click="togli">Toglila</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.nascita { display:flex; flex-direction:column; align-items:stretch; gap:8px; text-align:left }
.riga { display:flex; gap:8px; flex-wrap:wrap }
.riga select { flex:1; min-width:110px; min-height:44px; padding:6px 10px; border-radius:12px; border:1px solid #d9d2c2; background:#fff; font:inherit }
.avviso-eta { padding:10px 12px; border-radius:12px; background:#fff1d6; color:#5b4300 }
.avviso-eta p { margin:0 0 6px }
.rosso { color:#b4302e }
.scarto, .prossimo { font-style:normal; font-size:13px }
</style>
