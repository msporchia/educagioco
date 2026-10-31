<script setup>
// La lista degli amici di chi gioca: nomi, chi è online, a cosa gioca; e «Mi vedono online» (docs/core/amici.md). Un foglio
// con la ✕ in alto a destra. Senza internet la lista c'è lo stesso, in grigio, e nessun errore.
import { ref, computed } from 'vue'
import { dati, mettiOnline, MAX_AMICI } from '../../store/amici.js'
import { stato, avvia } from '../../amici/servizio.js'
import { nomeCorrente, giocoAcceso } from '../../store/profile.js'
import { GIOCHI } from '../../amici/giochi.js'
import { chiediIngresso } from '../../amici/ingresso.js'
import { chiediDopoIlCodice } from '../../store/pin.js'

const emit = defineEmits(['chiudi', 'vai'])
const amici = computed(() => stato.amici.filter(a => !a.inAttesa))
const inAttesa = computed(() => stato.amici.filter(a => a.inAttesa).length)

async function cambiaOnline() {
  await mettiOnline(!dati.online)
  avvia({ nome: nomeCorrente(), puoGiocare: giocoAcceso })
}
const doveGioca = a => (a.gioco && GIOCHI[a.gioco] ? `gioca a ${GIOCHI[a.gioco].nome}` : 'online')

// «Gioca»: i giochi in due che i grandi hanno lasciato accesi; scelto il gioco, si apre la sua sala con l'amico già da invitare
const giochiInDue = computed(() => Object.keys(GIOCHI).filter(k => giocoAcceso(k)))
const aperto = ref('')                 // la chiave dell'amico di cui si stanno guardando i giochi
const tocca = a => { aperto.value = aperto.value === a.chiave ? '' : a.chiave }
function giocaCon(a, gioco) {
  chiediIngresso(gioco, { amico: a.chiave })
  emit('chiudi')
}
// un amico nuovo è una cosa da grandi: prima il loro codice, poi la pagina (GenitoriView apre AggiungiAmico.vue)
function aggiungiAmico() {
  chiediDopoIlCodice('amico')
  emit('vai', 'genitori')
}
</script>

<template>
  <div class="velo-amici" data-amici @click.self="$emit('chiudi')">
    <div class="foglio">
      <button class="chiudi" type="button" aria-label="chiudi" data-azione="chiudi-amici" @click="$emit('chiudi')">✕</button>
      <h2>👫 Amici</h2>

      <p v-if="!dati.online" class="nota" data-offline>Sei offline: gli amici non ti vedono e non puoi invitarli.</p>
      <ul v-if="amici.length" class="lista">
        <li v-for="a in amici" :key="a.chiave" :class="{ su: a.online }" :data-amico="a.id">
          <div class="riga">
            <span class="pallino" aria-hidden="true"></span>
            <b>{{ a.nome || 'Amico' }}</b>
            <i>{{ a.online ? doveGioca(a) : 'non c\'è' }}</i>
            <button v-if="a.online && dati.online && giochiInDue.length" class="gioca" :class="{ su: aperto === a.chiave }" type="button"
                    data-amico-gioca :aria-expanded="aperto === a.chiave" @click="tocca(a)">Gioca</button>
          </div>
          <div v-if="aperto === a.chiave && a.online" class="giochi" role="group" :aria-label="`Gioca con ${a.nome || 'l\'amico'}`">
            <button v-for="g in giochiInDue" :key="g" class="bottone chiaro" type="button" :data-amico-gioco="g" @click="giocaCon(a, g)">
              {{ GIOCHI[g].nome }}</button>
          </div>
        </li>
      </ul>
      <p v-else class="nota">Non hai ancora amici qui. Si aggiungono con un codice, insieme a mamma o papà.</p>
      <p v-if="inAttesa" class="nota">{{ inAttesa === 1 ? 'Un amico è in attesa di collegarsi.' : inAttesa + ' amici sono in attesa di collegarsi.' }}</p>

      <button v-if="amici.length + inAttesa < MAX_AMICI" class="bottone chiaro aggiungi" type="button" data-azione="amici-aggiungi"
              @click="aggiungiAmico">＋ Aggiungi un amico</button>

      <label class="online">
        <input type="checkbox" :checked="dati.online" data-azione="amici-online" @change="cambiaOnline">
        <span>Mi vedono online</span>
      </label>
    </div>
  </div>
</template>

<style scoped>
.velo-amici { position:fixed; inset:0; z-index:120; display:flex; align-items:flex-end; justify-content:center; background:#1b2436aa }
.foglio { position:relative; width:min(calc(var(--colonna) + 32px),100%); max-height:80vh; overflow:auto; display:flex; flex-direction:column; gap:10px;
          padding:16px 16px calc(16px + env(safe-area-inset-bottom)); border-radius:22px 22px 0 0;
          background:var(--fondo); box-shadow:0 -8px 30px #00000030 }
h2 { margin:0; text-align:center; font-size:17px; font-weight:600; color:var(--inchiostro) }
.chiudi { position:absolute; top:10px; right:10px; width:44px; height:44px; border:0; border-radius:50%; background:#0000000f; font-size:20px }
.lista { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:8px }
li { display:flex; flex-direction:column; align-items:stretch; gap:8px; padding:10px 12px; border-radius:var(--raggio); background:var(--superficie); box-shadow:var(--ombra); opacity:.6 }
li.su { opacity:1 }
.pallino { width:12px; height:12px; border-radius:50%; background:#c9ced8 }
li.su .pallino { background:var(--verde) }
li .riga { display:flex; align-items:center; gap:10px; min-height:32px }
li b { flex:1 }
.gioca { min-height:36px; padding:6px 14px; border:0; border-radius:999px; background:var(--inchiostro); color:#fff; font:inherit; font-size:14px; font-weight:600; touch-action:manipulation }
.gioca.su { background:var(--tessera); color:var(--inchiostro) }
.giochi { display:flex; flex-wrap:wrap; gap:8px }
.giochi .bottone { flex:1 1 40% }
.aggiungi { align-self:center }
li i { font-style:normal; font-size:12px; color:var(--grigio) }
.nota { margin:0; font-size:13px; color:var(--grigio); text-align:center }
.online { display:flex; align-items:center; gap:10px; padding:10px 12px; font-weight:600 }
.online input { width:22px; height:22px }
</style>
