<script setup>
/* «Rimetti da un file», e lo stato di navigator.storage.persist():
   componente a parte (docs/core/archivio.md, docs/genitori/cestino-e-posta.md)
   perché tocca `store/profile.js` e `store/storage.js`, comuni ad altri
   agenti — qui il cambio resta un montaggio a una riga in GenitoriView. */
import { ref, computed, onMounted } from 'vue'
import { anteprimaImportazione, importaTutto } from '../../store/profile.js'
import { chiediPersistenza } from '../../store/storage.js'

const emit = defineEmits(['esito'])

const file = ref(null)
const inAttesa = ref(null)   // { dati, sostituiti, esportato } mentre si aspetta conferma
const persistita = ref(null) // null = non si sa (o non supportato), true/false = risposta del browser

onMounted(async () => { persistita.value = await chiediPersistenza() })

function apriFile() { file.value?.click() }

async function scegli(ev) {
  const f = ev.target.files?.[0]
  ev.target.value = ''   // lo stesso file due volte di fila deve poter funzionare
  if (!f) return
  emit('esito', null)
  let dati
  try { dati = JSON.parse(await f.text()) }
  catch (e) { emit('esito', { ok: false, testo: 'Questo file non si legge: non sembra un salvataggio.' }); return }
  try {
    const anteprima = anteprimaImportazione(dati)
    // un telefono nuovo, senza nessuno di questi id: niente da chiedere,
    // niente da proteggere — si importa e basta, come prima
    if (!anteprima.sostituiti.length) { await eseguiImportazione(dati); return }
    inAttesa.value = { dati, ...anteprima }
  } catch (e) { emit('esito', { ok: false, testo: e.message }) }
}

async function eseguiImportazione(dati) {
  const nomi = await importaTutto(dati)
  emit('esito', { ok: true, testo: 'Rimessi i progressi di ' + nomi.join(' e ') + '.' })
}

async function conferma() {
  const { dati } = inAttesa.value
  inAttesa.value = null
  try { await eseguiImportazione(dati) }
  catch (e) { emit('esito', { ok: false, testo: e.message }) }
}

function annulla() { inAttesa.value = null }

const dataFile = computed(() => {
  const iso = inAttesa.value?.esportato
  if (!iso) return null
  const d = new Date(iso)
  return isNaN(d) ? null : d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })
})

const chiVieneSostituito = computed(() => {
  const nomi = (inAttesa.value?.sostituiti || []).map(s => s.nomeAttuale)
  if (nomi.length <= 1) return nomi[0] || 'chi c\'è già'
  return nomi.slice(0, -1).join(', ') + ' e ' + nomi[nomi.length - 1]
})
</script>

<template>
  <button class="carta" data-azione="rimetti-da-file" @click="apriFile">
    <span class="ico">📂</span>
    <b>Rimetti da un file</b>
    <i>Sostituisce i progressi con quelli salvati</i>
  </button>
  <input ref="file" type="file" accept="application/json,.json" hidden @change="scegli">

  <div v-if="inAttesa" class="carta pericolo aperta" data-conferma="importazione">
    <b>Sostituisce {{ chiVieneSostituito }}?</b>
    <i>
      Il file porta un profilo con lo stesso id di chi c'è già in questo telefono<template
        v-if="dataFile">, salvato il {{ dataFile }}</template>: quello che c'è adesso
      viene sostituito. Ne resta una copia nel cestino qui sotto, per tornare indietro.
    </i>
    <div class="riga">
      <button class="bottone chiaro" data-azione="importazione-annulla" @click="annulla">
        No, lascia stare
      </button>
      <button class="bottone rosso" data-azione="importazione-conferma" @click="conferma">
        Sì, sostituisci
      </button>
    </div>
  </div>

  <p class="persistenza" data-persistenza :data-concessa="persistita">
    <template v-if="persistita === true">
      🔒 Il browser ha promesso di non liberare da solo questo spazio.
    </template>
    <template v-else-if="persistita === false">
      ⚠️ Il browser non garantisce questo spazio: su un telefono non installato può
      liberarlo dopo una settimana senza giocare. Salvare ogni tanto su file resta la
      rete di sicurezza vera.
    </template>
    <template v-else>
      ℹ️ Non si sa se questo browser garantisce lo spazio: salvare ogni tanto su file
      resta la rete di sicurezza vera.
    </template>
  </p>
</template>

<style scoped>
.carta { display:grid; grid-template-columns:auto 1fr; grid-template-rows:auto auto;
         gap:2px 14px; align-items:center; text-align:left; padding:15px 18px;
         border-radius:18px; background:var(--carta); box-shadow:0 4px 14px #8593a822;
         width:100%; box-sizing:border-box }
.carta .ico { grid-row:1/3; font-size:29px }
.carta b { font-size:16px; font-weight:800; color:var(--viola-scuro) }
.carta i { font-style:normal; font-size:12.5px; color:var(--tenue) }
.carta:active { transform:translateY(2px) }
.carta.pericolo b { color:#b23a5a }
.carta.pericolo.aperta { display:flex; flex-direction:column; gap:9px; align-items:center;
                         text-align:center; background:#fff0f3 }
.carta.pericolo.aperta i { max-width:34ch }
.bottone.rosso { background:linear-gradient(180deg,var(--rosso),#d63a5c); color:#fff;
                 box-shadow:0 6px 0 #a82a46; font-size:16px; padding:13px 22px }
.bottone.rosso:active { box-shadow:0 3px 0 #a82a46 }
.bottone.chiaro { font-size:16px; padding:13px 22px }
.persistenza { font-size:11.5px; color:var(--tenue); max-width:400px; line-height:1.4;
               margin:2px 0 0 }
</style>
