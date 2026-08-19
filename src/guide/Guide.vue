<script setup>
/* ═══════════════════════════════════════════════════════════════════
   COME FUNZIONA — LE GUIDE PER I GRANDI

   ── PERCHÉ STA FUORI DAL CODICE DI CASA ──
   Sarebbe stata comoda dentro le impostazioni, che è dove stanno le
   manopole di cui parla. Ma la prima guida è «come si installa», e la
   legge un genitore che ha appena ricevuto il link da un altro genitore:
   uno che non sa niente di questa applicazione, tantomeno che il codice
   di partenza è 0000. Una guida dietro un codice è una guida che legge
   solo chi non ne ha bisogno.
   Non c'è niente da proteggere: qui dentro si legge e basta, non si
   cambia nemmeno una impostazione.

   ── E PERCHÉ NON È IL README ──
   Il README lo legge chi clona il repo. Nessun genitore ha mai aperto
   una pagina di GitHub per far giocare un figlio, e una documentazione
   che vive fuori dall'applicazione invecchia senza che nessuno se ne
   accorga. Qui invece sta accanto alla cosa che descrive.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, onMounted } from 'vue'
import Barra from '../components/Barra.vue'
import Blocchi from './Blocchi.vue'
import { GUIDE, guida } from './contenuti.js'
import { raccogli } from './stato.js'
import { INDIRIZZO, condividi } from './aiuto.js'

defineEmits(['vai'])

const aperta = ref(null)
const esito = ref('')

/* Chi arriva dal nastro della home ha già detto cosa vuole sapere: si
   apre lì dentro invece di rimandarlo all'elenco a cercarselo. */
onMounted(() => { const q = raccogli(); if (q) aperta.value = guida(q) })

/* Il link secco, senza messaggio addosso: quello che si manda è
   l'indirizzo, il resto lo scrive chi manda con parole sue. */
async function mandaIlLink () {
  const r = await condividi({ url: INDIRIZZO, titolo: 'Educagioco' })
  esito.value = r.come === 'copiato' ? 'Indirizzo copiato: incollalo dove vuoi.'
    : r.come === 'niente' ? INDIRIZZO : ''
}

/* Il tasto per tornare indietro fa due cose a seconda di dove si è: da
   una guida aperta torna all'elenco, dall'elenco esce. È la stessa
   freccia, ed è quello che si aspetta chi la preme. */
</script>

<template>
  <div class="schermo">
    <Barra :titolo="aperta ? aperta.titolo : 'Come funziona'" :audio="false"
           @indietro="aperta ? (aperta = null, esito = '') : $emit('vai','home')" />

    <div class="corpo">
      <!-- ── l'elenco ── -->
      <template v-if="!aperta">
        <p class="testo intro">Il gioco è fatto per i bambini, ma qualche manopola è
          per te. Qui c'è quello che conviene sapere, in ordine di quanto serve.</p>

        <button v-for="g in GUIDE" :key="g.id" class="voce" :data-guida="g.id"
                @click="aperta = g">
          <span class="ico">{{ g.emoji }}</span>
          <span class="dentro"><b>{{ g.titolo }}</b><i>{{ g.sommario }}</i></span>
          <span class="freccia">›</span>
        </button>

        <!-- Sta qui e non solo nelle impostazioni apposta: chi passa il
             gioco a un'altra famiglia non deve prima entrare col codice. -->
        <button class="manda" data-azione="manda-link" @click="mandaIlLink">
          <b>📤 Manda il link a qualcuno</b>
          <i>{{ INDIRIZZO.replace(/^https?:\/\//, '') }}</i>
        </button>
        <p v-if="esito" class="mini esito">{{ esito }}</p>
      </template>

      <!-- ── una guida aperta ── -->
      <template v-else>
        <Blocchi :blocchi="aperta.blocchi" />
        <button class="bottone chiaro torna" @click="aperta = null; esito = ''">
          ← le altre guide</button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.corpo { flex:1; overflow-y:auto; padding:12px 14px 26px;
         display:flex; flex-direction:column; gap:10px;
         width:min(560px,100%); margin:0 auto }
.intro { max-width:none; margin-bottom:4px }

.voce { display:flex; align-items:center; gap:11px; text-align:left; width:100%;
        padding:12px 13px; border-radius:16px; background:var(--carta);
        box-shadow:0 3px 10px #8593a824 }
.voce:active { transform:translateY(1px) }
.voce .ico { font-size:25px; flex:none }
.voce .dentro { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px }
.voce b { font-size:15.5px; color:var(--viola-scuro) }
.voce i { font-size:12.5px; color:var(--tenue); font-style:normal; line-height:1.35 }
.voce .freccia { font-size:22px; color:#c3cbd8; flex:none }

.manda { margin-top:8px; display:flex; flex-direction:column; gap:3px; padding:13px;
         border-radius:16px; background:#ffffffb0; box-shadow:0 2px 8px #8593a81f }
.manda b { font-size:14.5px; color:var(--viola-scuro) }
.manda i { font-size:12px; color:var(--tenue); font-style:normal;
           overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
.esito { margin-top:2px; user-select:text }
.torna { align-self:center; margin-top:12px; padding:11px 26px; font-size:15px }
</style>
