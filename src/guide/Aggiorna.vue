<script setup>
/* ═══════════════════════════════════════════════════════════════════
   «CERCA AGGIORNAMENTI» — IL FOGLIO

   Si apre dal fondo della home («↻ cerca aggiornamenti», accanto alla
   versione) e dal nastro «c'è una versione nuova»: tutti e due chiamano
   `aggiornaOra()` in `aggiornamento.js`, e questo foglio fa vedere a che
   punto è. Qui dentro non si decide niente.

   Il foglio esiste per una cosa sola: **che l'attesa si veda.** Sette
   megabyte e mezzo su una rete lenta sono minuti, e un aggiornamento
   muto è indistinguibile da uno che non arriverà mai — che era proprio
   il difetto da togliere. Quindi i megabyte si contano, e quando va
   storto si dice **cosa** è andato storto e che il gioco è rimasto
   com'era: «non ha funzionato» e basta non dice se si può giocare.

   Si chiude solo con la ✕. Non toccando fuori: a scaricamento in corso
   chiudere vuol dire fermarlo, e un tocco di passaggio sul velo non
   deve buttare via tre megabyte già arrivati.
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'
import { aggiornando, aggiornaOra, lasciaStare, inMega } from '../aggiornamento.js'

/* la versione a schermo: «hai già l'ultima» dice questa, non quella del
   sito — se il sito ne avesse una più vecchia, sarebbe la risposta
   sbagliata alla domanda giusta */
const questa = __VERSIONE__

const a = computed(() => aggiornando.value || {})
const quota = computed(() =>
  a.value.totale ? Math.min(1, (a.value.presi || 0) / a.value.totale) : null)
const guasto = computed(() => ['muto', 'interrotto', 'vecchia'].includes(a.value.fase))
</script>

<template>
  <div class="ag-velo" data-aggiorna :data-fase="a.fase">
    <div class="ag-foglio" role="dialog" aria-modal="true" aria-labelledby="ag-titolo">
      <!-- la ✕ non c'è solo a «riparto»: lì la pagina se ne va da sé -->
      <button v-if="a.fase !== 'pronta'" type="button" class="ag-chiudi" aria-label="chiudi"
              data-chiudi @click="lasciaStare()">✕</button>

      <div aria-live="polite">
        <!-- ── 1. si chiede ── -->
        <template v-if="a.fase === 'chiedo'">
          <div class="ag-segno gira" aria-hidden="true">↻</div>
          <h2 id="ag-titolo">Chiedo al sito che versione c'è…</h2>
        </template>

        <!-- ── è già questa ── -->
        <template v-else-if="a.fase === 'gia'">
          <div class="ag-segno bene" aria-hidden="true">✓</div>
          <h2 id="ag-titolo">Hai già l'ultima</h2>
          <p>È quella del <b>{{ questa.etichetta }}</b>: sul sito non ce n'è una più
            nuova.</p>
        </template>

        <!-- ── 2. si scarica, e si conta ── -->
        <template v-else-if="a.fase === 'scarico'">
          <div class="ag-segno" aria-hidden="true">⤓</div>
          <h2 id="ag-titolo">Scarico la versione nuova</h2>
          <p>quella del <b>{{ a.sito.etichetta }}</b></p>
          <div class="ag-barra" :class="{ vaga: quota === null }">
            <i :style="quota === null ? null : { width: Math.round(quota * 100) + '%' }"></i>
          </div>
          <p class="ag-conto" data-scaricati>{{ inMega(a.presi) }}<template
            v-if="a.totale"> di {{ inMega(a.totale) }}</template> MB</p>
          <p class="ag-piano">I progressi non si toccano. Se la connessione cade, il
            gioco resta com'era.</p>
        </template>

        <!-- ── 5. si riparte ── -->
        <template v-else-if="a.fase === 'pronta'">
          <div class="ag-segno bene" aria-hidden="true">✓</div>
          <h2 id="ag-titolo">Fatto: riparto</h2>
          <p>con la versione del <b>{{ a.sito.etichetta }}</b></p>
        </template>

        <!-- ── quando va storto: cosa, e che il gioco è rimasto com'era ── -->
        <template v-else-if="a.fase === 'muto'">
          <div class="ag-segno" aria-hidden="true">📡</div>
          <h2 id="ag-titolo">Il sito non risponde</h2>
          <p>Forse sei senza connessione, o va troppo piano. Il gioco intanto
            funziona come prima.</p>
        </template>
        <template v-else-if="a.fase === 'interrotto'">
          <div class="ag-segno" aria-hidden="true">📡</div>
          <h2 id="ag-titolo">Lo scaricamento si è fermato</h2>
          <p>Arrivati {{ inMega(a.presi) }}<template v-if="a.totale"> di {{
            inMega(a.totale) }}</template> MB, poi la connessione si è persa. Il gioco
            resta com'era.</p>
        </template>
        <template v-else-if="a.fase === 'vecchia'">
          <div class="ag-segno" aria-hidden="true">⏳</div>
          <h2 id="ag-titolo">Il sito sta ancora cambiando versione</h2>
          <p>Dice di avere quella del <b>{{ a.sito.etichetta }}</b>, ma mi ha dato ancora
            quella di prima. Di solito si sistema in qualche minuto.</p>
        </template>
      </div>

      <!-- una scelta vera accanto alla ✕, quindi un tasto suo -->
      <button v-if="guasto" type="button" class="bottone" data-azione="riprova"
              @click="aggiornaOra()">Riprova</button>
    </div>
  </div>
</template>

<style scoped>
/* fra i veli di casa (60–80): sopra la home, sotto il foglio del `?` */
.ag-velo { position:fixed; inset:0; z-index:70; display:flex; align-items:center;
           justify-content:center; padding:18px; background:#1b2436aa;
           backdrop-filter:blur(2px); animation:ag-entra .18s ease-out }
@keyframes ag-entra { from { opacity:0 } }
.ag-foglio { position:relative; width:min(360px,100%); display:flex; flex-direction:column;
             align-items:center; gap:12px; padding:22px 20px 20px; border-radius:22px;
             text-align:center; background:linear-gradient(180deg,#fff9f0,#eef4ef);
             box-shadow:0 12px 34px #00000038 }
.ag-chiudi { position:absolute; top:10px; right:10px; width:38px; height:38px;
             display:grid; place-items:center; border-radius:12px; padding:0;
             background:#ffffffcc; box-shadow:inset 0 0 0 1px #d7dfea;
             color:var(--tenue); font-size:15px; font-weight:800; cursor:pointer }
.ag-chiudi:active { transform:scale(.92) }

.ag-segno { font-size:40px; line-height:1; margin:4px 0 8px; color:var(--viola) }
.ag-segno.bene { color:var(--verde) }
.ag-segno.gira { display:inline-block; animation:ag-gira 1s linear infinite }
@keyframes ag-gira { to { transform:rotate(360deg) } }
/* il margine ai lati tiene il titolo lontano dalla ✕ */
.ag-foglio h2 { font-size:19px; line-height:1.25; padding:0 30px; margin:0 0 6px }
.ag-foglio p { margin:0 0 6px; font-size:14.5px; line-height:1.45; color:var(--testo) }

.ag-barra { width:100%; height:12px; margin:10px 0 6px; border-radius:999px;
            overflow:hidden; background:#ffffffcc; box-shadow:inset 0 0 0 1px #d7dfea }
.ag-barra i { display:block; height:100%; width:0; border-radius:999px;
              background:linear-gradient(90deg,var(--viola),#7f95e6); transition:width .2s }
/* senza il totale non si sa dove sia la fine: la barra dice solo «si muove» */
.ag-barra.vaga i { width:35%; animation:ag-vaga 1.3s ease-in-out infinite alternate }
@keyframes ag-vaga { from { transform:translateX(-10%) } to { transform:translateX(200%) } }
.ag-foglio .ag-conto { font-size:16px; font-weight:800; color:var(--viola-scuro);
                       font-variant-numeric:tabular-nums }
.ag-foglio .ag-piano { font-size:12.5px; color:var(--tenue) }
.ag-foglio .bottone { padding:12px 34px; font-size:17px }
</style>
