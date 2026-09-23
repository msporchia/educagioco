<script setup>
/* ═══════════════════════════════════════════════════════════════════
   I NASTRI DELLA HOME

   Stanno insieme perché sono la stessa cosa detta a due momenti diversi:
   «questo gioco puoi tenertelo» e «quello che tieni è vecchio». Tutti e
   due parlano al grande, tutti e due vivono **solo in home** — dentro un
   gioco un cartello che invita a ricaricare butterebbe via la partita.

   Nessuno dei due è un allarme: riga sottile, colore tenue, e si possono
   ignorare per sempre senza che il gioco insista.

   Poi ce ne sono due che parlano al **bambino**: quello della posta,
   che gli chiede di chiamare un grande, e quello delle novità, che gli
   dice cosa c'è di nuovo nei suoi giochi (`guide/novita-bambini.js`).
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, onMounted } from 'vue'
import { piattaforma, installata, serveIlNastro } from './aiuto.js'
import { daAprire } from './stato.js'
import { versioneNuova, aggiornaOra } from '../aggiornamento.js'
import { daLeggere } from '../store/posta.js'
import { daLeggere as novitaDaLeggere } from './novita-bambini.js'
import { novitaLette } from '../store/profile.js'
import { inCasa } from '../data/portata-giochi.js'
import { load, save, flush } from '../store/storage.js'

const emit = defineEmits(['vai'])

/* Fuori dai profili, come il codice dei genitori: «ho già detto no» è una
   cosa del telefono, non di un bambino. E dentro un oggetto — `load()`
   scarta il `true` scritto da solo (vedi `store/storage.js`). */
const CHIAVE = 'nastro-installa'
const chiuso = ref(true)         // finché non si è letto, non si mostra niente

const dentro = installata()
const dove = piattaforma()
const mostraInstalla = computed(() => serveIlNastro({ dentro, dove, chiuso: chiuso.value }))

onMounted(async () => {
  const r = await load(CHIAVE)
  chiuso.value = !!r?.chiuso
})

/* `flush()` subito e non fra i 350 ms del solito ritardo: chi chiude il
   nastro spesso chiude anche l'app un attimo dopo, e un «no» perso è un
   consiglio che ricompare — cioè esattamente quello che dà fastidio. */
async function nonMeLoDire () {
  chiuso.value = true
  save(CHIAVE, { chiuso: true })
  await flush()
}

function spiegami () {
  daAprire.value = 'installare'
  emit('vai', 'guide')
}

/* ── il messaggio per un grande ──
   Questo è l'unico dei tre che parla **al bambino**, e non per sbaglio:
   il bambino è l'unico che guarda questa schermata tutti i giorni, e un
   grande in queste pagine non ci entra mai da solo. Gli si chiede di
   fare il corriere.

   E non ha la ✕. Non è una dimenticanza: la ✕ è l'ack, e la premerebbe
   il bambino per riflesso — l'informazione sarebbe consumata senza che
   nessuno l'abbia letta. Con un tasto solo non c'è niente da chiudere
   e quindi niente da proteggere: l'unica uscita è «Ho letto» dentro le
   impostazioni, che vuole il codice. Il ragionamento intero sta in
   `guide/novita.js`. */
function chiamaUnGrande () { emit('vai', 'genitori') }

/* ── cosa c'è di nuovo nei giochi ──
   Le stesse righe che la pagina mostrerà, col suo stesso tetto per
   gioco: il conto qui fuori e l'elenco là dentro non devono dire due
   numeri diversi. Il nastro ripete già la più fresca, così chi la legge
   e basta ha avuto la notizia anche senza entrare. Non ha la ✕: si
   spegne con «Letto», dentro, che è il solo gesto che dice «l'ho
   visto» — e se il bambino non ci entra, resta lì senza insistere. */
const novita = computed(() => novitaDaLeggere(novitaLette(), inCasa).flatMap(g => g.voci))
const altre = computed(() => novita.value.length - 1)
</script>

<template>
  <div v-if="mostraInstalla || versioneNuova || daLeggere || novita.length" class="nastri">
    <!-- ══ c'è una cosa da dire a un grande ══
         Primo di tutti: è il solo che chieda di fare qualcosa a qualcun
         altro. Sottile e tenue come gli altri — non è mai urgente, e
         niente lampeggia: è un post-it sul frigo, e resta finché
         qualcuno non lo stacca. -->
    <button v-if="daLeggere" class="nastro posta" data-nastro="posta"
            data-azione="nastro-posta" @click="chiamaUnGrande">
      <span class="dentro">
        <b>📩 C'è un messaggio per la mamma o il papà</b>
        <i>Chiamali: si apre col loro codice</i>
      </span>
    </button>

    <!-- ══ c'è qualcosa di nuovo ══
         Per il bambino, e dice già la notizia più fresca: la pagina
         serve a chi ne ha più d'una, o a chi torna dopo tanto. -->
    <button v-if="novita.length" class="nastro novita" data-nastro="novita"
            data-azione="nastro-novita" @click="emit('vai', 'novita')">
      <span class="dentro">
        <b>🌟 Novità nei giochi</b>
        <i>{{ novita[0].testo }}<template v-if="altre"> · {{
          altre === 1 ? 'e un\'altra' : `e altre ${altre}` }}</template></i>
      </span>
      <span class="freccia" aria-hidden="true">›</span>
    </button>

    <!-- ══ tienitelo ══ -->
    <div v-if="mostraInstalla" class="nastro installa" data-nastro="installa">
      <button class="dentro" data-azione="nastro-installa" @click="spiegami">
        <b>📲 Mettilo sulla schermata del telefono</b>
        <i>Si apre come un'app e funziona anche senza internet — ti spiego come</i>
      </button>
      <button class="chiudi" aria-label="chiudi" data-azione="chiudi-nastro"
              @click="nonMeLoDire">✕</button>
    </div>

    <!-- ══ è vecchio ══
         Non ricarica da sé, e non compare dentro un gioco: si ricarica
         quando lo decide chi ha in mano il telefono. -->
    <div v-if="versioneNuova" class="nastro nuovo" data-nastro="versione">
      <div class="dentro">
        <b>✨ C'è una versione nuova</b>
        <i>Ricarica per prenderla: i progressi non si toccano</i>
      </div>
      <button class="ora" data-azione="aggiorna" @click="aggiornaOra">Ricarica</button>
    </div>
  </div>
</template>

<style scoped>
.nastri { display:flex; flex-direction:column; gap:7px; width:100%; max-width:400px }
.nastro { display:flex; align-items:center; gap:6px; padding:9px 10px;
          border-radius:14px; text-align:left }
/* il nastro della posta è tutto un tasto, e non ha la ✕: vedi sopra */
.nastro.novita { width:100%; background:#e6f7ec; color:#1f5f36; border:2px solid #c3e8cf;
                 cursor:pointer }
.nastro.novita .freccia { flex:none; font-size:22px; font-weight:900; opacity:.7 }
.nastro.posta { width:100%; background:#eef4ff; border:2px solid #cfe0f8; cursor:pointer }
.nastro.posta .dentro { display:flex; flex-direction:column; gap:2px; min-width:0 }
.nastro .dentro { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px;
                  background:none; text-align:left; padding:0 }
.nastro b { font-size:13.5px; font-weight:800 }
.nastro i { font-style:normal; font-size:11.5px; line-height:1.35; opacity:.8 }

.installa { background:#e8f0ff; color:#2c4283; box-shadow:0 2px 8px #8593a81f }
.installa .chiudi { flex:none; width:26px; height:26px; border-radius:50%;
                    background:#ffffff90; color:#2c4283; font-size:13px; font-weight:800 }

.nuovo { background:#fff3d6; color:#7a4b00; box-shadow:0 2px 8px #8593a81f }
.nuovo .ora { flex:none; padding:8px 14px; border-radius:999px; font-size:13px; font-weight:900;
              background:linear-gradient(180deg,var(--giallo),var(--arancio)); color:#5a3200;
              box-shadow:0 3px 0 #d97706 }
.nuovo .ora:active { transform:translateY(2px); box-shadow:0 1px 0 #d97706 }
</style>
