<script setup>
// La lista degli amici di chi gioca: nomi, chi è online, a cosa gioca; e «Mi vedono online» (docs/core/amici.md). Un foglio
// con la ✕ in alto a destra. Senza internet la lista c'è lo stesso, in grigio, e nessun errore.
import { computed } from 'vue'
import { dati, mettiOnline } from '../../store/amici.js'
import { stato, avvia } from '../../amici/servizio.js'
import { nomeCorrente, giocoAcceso } from '../../store/profile.js'
import { GIOCHI } from '../../amici/giochi.js'

defineEmits(['chiudi'])
const amici = computed(() => stato.amici.filter(a => !a.inAttesa))
const inAttesa = computed(() => stato.amici.filter(a => a.inAttesa).length)

async function cambiaOnline() {
  await mettiOnline(!dati.online)
  avvia({ nome: nomeCorrente(), puoGiocare: giocoAcceso })
}
const doveGioca = a => (a.gioco && GIOCHI[a.gioco] ? `gioca a ${GIOCHI[a.gioco].nome}` : 'online')
</script>

<template>
  <div class="velo-amici" data-amici @click.self="$emit('chiudi')">
    <div class="foglio">
      <button class="chiudi" type="button" aria-label="chiudi" data-azione="chiudi-amici" @click="$emit('chiudi')">✕</button>
      <h2>👫 Amici</h2>

      <p v-if="!dati.online" class="nota" data-offline>Sei offline: gli amici non ti vedono e non puoi invitarli.</p>
      <ul v-if="amici.length" class="lista">
        <li v-for="a in amici" :key="a.chiave" :class="{ su: a.online }" :data-amico="a.id">
          <span class="pallino" aria-hidden="true"></span>
          <b>{{ a.nome || 'Amico' }}</b>
          <i>{{ a.online ? doveGioca(a) : 'non c\'è' }}</i>
        </li>
      </ul>
      <p v-else class="nota">Non hai ancora amici qui. Li aggiungono mamma e papà dalle impostazioni, con un codice.</p>
      <p v-if="inAttesa" class="nota">{{ inAttesa === 1 ? 'Un amico è in attesa di collegarsi.' : inAttesa + ' amici sono in attesa di collegarsi.' }}</p>

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
li { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:var(--raggio); background:var(--superficie); box-shadow:var(--ombra); opacity:.6 }
li.su { opacity:1 }
.pallino { width:12px; height:12px; border-radius:50%; background:#c9ced8 }
li.su .pallino { background:var(--verde) }
li b { flex:1 }
li i { font-style:normal; font-size:12px; color:var(--grigio) }
.nota { margin:0; font-size:13px; color:var(--grigio); text-align:center }
.online { display:flex; align-items:center; gap:10px; padding:10px 12px; font-weight:600 }
.online input { width:22px; height:22px }
</style>
