<script setup>
/* ═══════════════════════════════════════════════════════════════════
   I DUE NASTRI DELLA HOME

   Stanno insieme perché sono la stessa cosa detta a due momenti diversi:
   «questo gioco puoi tenertelo» e «quello che tieni è vecchio». Tutti e
   due parlano al grande, tutti e due vivono **solo in home** — dentro un
   gioco un cartello che invita a ricaricare butterebbe via la partita.

   Nessuno dei due è un allarme: riga sottile, colore tenue, e si possono
   ignorare per sempre senza che il gioco insista.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, onMounted } from 'vue'
import { piattaforma, installata, serveIlNastro } from './aiuto.js'
import { daAprire } from './stato.js'
import { versioneNuova, aggiornaOra } from '../aggiornamento.js'
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
</script>

<template>
  <div v-if="mostraInstalla || versioneNuova" class="nastri">
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
