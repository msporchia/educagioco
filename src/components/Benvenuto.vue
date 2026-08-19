<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL PRIMO AVVIO

   Quando nell'archivio non c'è nessun giocatore, questa è la prima cosa
   che si vede. Prima non poteva succedere: i giocatori erano scritti nel
   codice, quindi ce n'erano sempre due anche su un telefono appena
   installato. Adesso l'elenco è vuoto finché qualcuno non ci mette il
   suo nome.

   Non chiede il PIN apposta. Il PIN protegge le cose dei genitori, ma
   qui non c'è ancora niente da proteggere: chiederlo vorrebbe dire che
   un'app appena installata non si apre senza sapere un codice che
   nessuno ha ancora scelto. Aggiungere il secondo giocatore, invece, sta
   dietro il PIN come tutto il resto.

   ── DUE PASSI, E IL SECONDO NON È PER IL BAMBINO ──────────────────
   Il nome e la faccia sono la sua domanda; **da dove parte** è la
   domanda del grande che gli sta installando il gioco, e le due cose
   non stanno bene sullo stesso schermo — una colonna con dentro il
   nome, sei facce e quattro fasce da leggere non è più «tre tocchi», è
   un modulo.

   Perché chiederlo qui e non lasciarlo alla schermata dei genitori,
   dove la scelta esiste da sempre: perché di lì passa chi aggiunge il
   *secondo* bambino, e il primo — cioè chiunque installi l'app — non ci
   passava mai. Nasceva con tutto acceso: quindici carte in home, con
   dentro le divisioni in colonna, anche a un bambino di cinque anni.
   Regalando il gioco si è visto due volte di fila, e le due volte era
   una sorella più piccola.

   La fascia non si preseleziona, per lo stesso motivo che vale in
   `GenitoriView`: una risposta già data si preme senza leggerla. Il
   tasto resta spento finché non si sceglie, che è il modo di chiederlo
   senza scriverlo — e non blocca nessuno, perché è una domanda con
   quattro risposte tutte buone e nessuna definitiva: da domani si
   cambia tutto a mano.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed } from 'vue'
import { creaGiocatore } from '../store/profile.js'
import { PARTENZE } from '../data/partenze.js'
import { PERSONE } from '../giochi/fattoria/dati/atlante.js'
import SceltaAspetto from './SceltaAspetto.vue'

const nome = ref('')
const occupato = ref(false)
/* Preselezionato, non chiesto vuoto come la partenza: qui non cambia
   cosa il bambino vede o sa, solo con che faccia si vede in mappa — un
   tasto spento finché non si sceglie sarebbe attrito su una schermata
   che vuole restare corta. */
const aspetto = ref(PERSONE[0])
const partenza = ref('')
const passo = ref(1)

const pulito = computed(() => nome.value.trim())

function avanti() {
  if (!pulito.value) return
  passo.value = 2
}

async function entra() {
  if (!pulito.value || !partenza.value || occupato.value) return
  occupato.value = true
  try { await creaGiocatore(pulito.value, true, partenza.value, aspetto.value) }
  finally { occupato.value = false }
}
</script>

<template>
  <div class="schermo benvenuto">
    <div v-if="passo === 1" class="centro">
      <span class="em">👋</span>
      <h1>Ciao!<br><span>Come ti chiami?</span></h1>

      <form @submit.prevent="avanti">
        <input v-model="nome" class="nome" type="text" maxlength="20"
               autocomplete="off" autocapitalize="words" spellcheck="false"
               placeholder="il tuo nome" aria-label="il tuo nome">
        <SceltaAspetto :scelto="aspetto" data-scelta="aspetto" @scegli="aspetto = $event" />
        <button class="via" type="submit" :disabled="!pulito">Si gioca!</button>
      </form>

      <p class="mini">Lo possono cambiare mamma e papà quando vogliono.</p>
    </div>

    <!-- ── il passo dei grandi ── -->
    <div v-else class="centro fasce">
      <span class="em">🎒</span>
      <h1>{{ pulito }}<br><span>a che punto è?</span></h1>
      <p class="mini alto">Da qui si decide quali giochi mettergli in casa e a che età
        tarare le domande. Non è una gabbia: l'età si sposta poi di mezzo anno per volta,
        dalle impostazioni.</p>

      <div class="partenze">
        <button v-for="p in PARTENZE" :key="p.chiave" type="button"
                class="partenza" :class="{ on: partenza === p.chiave }"
                :data-partenza="p.chiave" @click="partenza = p.chiave">
          <b>{{ p.nome }}<em>{{ p.eta }}</em></b>
          <i>{{ p.che }}</i>
          <small>le domande partono da {{ String(p.anni).replace('.', ',') }} anni</small>
        </button>
      </div>

      <button class="via" type="button" :disabled="!partenza || occupato"
              @click="entra">Si gioca!</button>
      <button class="indietro" type="button" @click="passo = 1">← cambia il nome</button>
    </div>
  </div>
</template>

<style scoped>
.benvenuto .centro { display:flex; flex-direction:column; align-items:center; gap:18px; padding:24px }
.benvenuto .centro.fasce { gap:13px; padding:20px 16px }
.em { font-size:64px; line-height:1 }
.fasce .em { font-size:44px }
h1 { text-align:center; margin:0 }
.fasce h1 { font-size:26px }
form { display:flex; flex-direction:column; align-items:center; gap:14px; width:min(320px, 82vw) }
.nome {
  width:100%; padding:15px 18px; border:none; border-radius:16px;
  font-size:22px; text-align:center; font-family:inherit;
  background:#ffffffee; color:var(--viola-scuro); box-shadow:0 3px 0 #0002;
}
.nome:focus { outline:3px solid var(--viola); outline-offset:2px }
.via {
  padding:14px 34px; border:none; border-radius:999px; font-size:20px; font-weight:800;
  font-family:inherit; color:#fff; cursor:pointer;
  background:linear-gradient(180deg, var(--viola), var(--viola-scuro)); box-shadow:0 4px 0 #0003;
}
.via:disabled { opacity:.45; box-shadow:none }
.mini { opacity:.75; font-size:14px; text-align:center; margin:0 }
.mini.alto { max-width:34ch; font-size:13px; margin:-6px 0 0 }
.indietro { background:none; border:none; font-family:inherit; font-size:14px;
            color:#fff; opacity:.75; padding:4px 10px; cursor:pointer }

/* le stesse carte della schermata dei genitori: è la stessa domanda,
   e due modi di disegnarla sarebbero due cose da tenere allineate */
.partenze { display:flex; flex-direction:column; gap:7px; width:min(340px, 88vw) }
.partenza { display:flex; flex-direction:column; gap:2px; width:100%; text-align:left;
            border:none; font-family:inherit; cursor:pointer;
            padding:11px 14px; border-radius:14px; background:#fff;
            box-shadow:inset 0 0 0 2px #e3e8ef; transition:.14s }
.partenza b { display:flex; align-items:baseline; gap:7px; font-size:15px; font-weight:800;
              color:var(--viola-scuro) }
.partenza b em { font-style:normal; font-size:11px; font-weight:700; color:var(--tenue) }
.partenza i { font-style:normal; font-size:12px; line-height:1.35; color:var(--tenue) }
.partenza small { font-size:11px; font-weight:750; color:var(--viola) }
.partenza.on { background:#f4f1ff; box-shadow:inset 0 0 0 3px var(--viola) }
.partenza.on b { color:var(--viola) }
.partenza:active { transform:translateY(1px) }
</style>
