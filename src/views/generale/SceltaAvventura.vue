<script setup>
/* ═══════════════════════════════════════════════════════════════════
   SCEGLI L'AVVENTURA — la prima cosa che si vede entrando nel Generale.

   Prima di qui c'era una fila di quattordici livelli numerati, e
   «riprendi da dove eri» voleva dire «il numero dopo». Le storie non
   sono una fila: sono cinque, si scelgono, e quella di Bibi deve poter
   essere la prima per chi ha sei anni.

   ── MA PRIMA SI IMPARA A COMANDARE ───────────────────────────────
   Questa schermata ha due facce, e quale delle due si vede dipende da
   una cosa sola: se il tutorial è finito.

     · finché non lo è — in cima c'è IL TUTORIALE, e le avventure si
       vedono col lucchetto. Si vedono, non spariscono: sapere cosa ti
       aspetta è metà della voglia di arrivarci.
     · quando lo è — le storie prendono il posto loro, e le prove che
       restano scendono sotto come allenamento.

   Le prove stavano già qui, ma sotto la riga «e poi, quando vuoi»: e
   così un bambino entrava nel primo capitolo di una storia senza aver
   mai scritto un ordine in vita sua.

   ── E OGGI LE AVVENTURE NON CI SONO ──────────────────────────────
   `AVVENTURE_APERTE` è a `false`, e allora questa schermata **non si
   vede affatto**: senza storie da scegliere non c'è niente da
   scegliere, e si entra dritti nelle prove (`navigazione.js`). Il
   codice delle avventure resta qui, spento dietro il flag, perché il
   giorno che si riaccende non ci sia niente da riscrivere.
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'
import { elencoStorie } from '../../store/storie.js'
import { quanteMappe } from '../../data/mappe-storie.js'
import { AVVENTURE_APERTE } from '../../data/storie-generale.js'
import { genProgresso, tappaAperta } from '../../store/profile.js'
import { QUANTI, TUTORIAL } from '../../data/generale.js'

defineEmits(['apri', 'prove'])

const storie = computed(() => elencoStorie().map(s => ({ ...s, mappe: quanteMappe(s.id) })))
const prove = computed(() => {
  const g = genProgresso()
  return { fatte: Math.min(g.tappa || 0, QUANTI),
           stelle: Object.values(g.stelle || {}).reduce((n, s) => n + s, 0) }
})
/* il tutorial è finito quando le prime prove sono fatte. La regola del
   lucchetto è una sola in tutto il progetto (`tappaAperta`), e passa da
   lì anche questo: così l'interruttore dei genitori che apre tutto apre
   anche le avventure, senza una seconda scappatoia da tenere allineata */
const imparato = computed(() => tappaAperta(TUTORIAL, prove.value.fatte))
const rimaste = computed(() => Math.max(0, QUANTI - prove.value.fatte))
</script>

<template>
  <div class="scelta-avv">
    <!-- ════════ PRIMA DEL TUTORIAL ════════ -->
    <template v-if="!imparato">
      <p class="intro">Un generale non comanda a mano: <b>scrive gli ordini</b> e guarda
        se il piano regge. {{ TUTORIAL }} prove per impararlo<span v-if="AVVENTURE_APERTE">, poi si parte</span>.</p>

      <button class="avventura prove tutorial" @click="$emit('prove')">
        <span class="em">🎖️</span>
        <span class="che">
          <b>Il tutorial</b>
          <i>una prova per idea: un ordine, una fila, un giro, un segnale, una scelta, un rumore,
             e due per farli stare insieme</i>
          <span v-if="prove.fatte" class="barra"><span :style="{ width: (Math.min(prove.fatte, TUTORIAL) / TUTORIAL * 100) + '%' }"></span></span>
        </span>
        <span class="dove">
          <b>{{ Math.min(prove.fatte, TUTORIAL) }} <small>di {{ TUTORIAL }}</small></b>
          <span class="via">{{ prove.fatte ? 'continua →' : 'comincia →' }}</span>
        </span>
      </button>

      <!-- chiuse, ma non nascoste: si vede dove si sta andando. Quando
           invece le avventure non esistono ancora (`AVVENTURE_APERTE`)
           non c'è nessun lucchetto da mostrare: un lucchetto prometterebbe
           che finito il tutorial si aprono, e non è vero. -->
      <template v-if="AVVENTURE_APERTE">
        <div class="riga-titolo">e poi le avventure</div>
        <div v-for="s in storie" :key="s.id" class="avventura chiusa">
          <span class="em">{{ s.emoji }}</span>
          <span class="che">
            <b>{{ s.nome }}</b>
            <i>{{ s.sottotitolo }}</i>
          </span>
          <span class="dove"><b>🔒</b></span>
        </div>
      </template>
    </template>

    <!-- ════════ DOPO ════════ ─────────────────────────────────
         LE PROVE RESTANO IN CIMA anche a tutorial finito, e non è una
         dimenticanza: sono il prerequisito, e una cosa che viene prima
         si mette prima. Stavano in fondo sotto «e poi, quando vuoi», e
         chi tornava dopo un mese leggeva la home dall'alto trovando
         cinque storie e nessuna traccia di quello che va imparato per
         starci dentro. -->
    <template v-else>
      <p v-if="AVVENTURE_APERTE" class="intro">Prima si impara a comandare, poi si parte: le <b>prove</b> sono una
        idea per volta, le <b>avventure</b> sono storie a capitoli.</p>
      <p v-else class="intro">Le <b>prove</b> sono una idea per livello: si aprono in fila, e
        ognuna ha una cosa nuova da capire.</p>

      <button class="avventura prove" @click="$emit('prove')">
        <span class="em">🎖️</span>
        <span class="che">
          <b>Le prove</b>
          <i>una idea per livello, e si aprono in fila</i>
          <span v-if="prove.fatte" class="barra"><span :style="{ width: (prove.fatte / QUANTI * 100) + '%' }"></span></span>
        </span>
        <span class="dove">
          <b>{{ prove.fatte }} <small>di {{ QUANTI }}</small></b>
          <span v-if="prove.stelle" class="stelle">⭐ {{ prove.stelle }}</span>
          <span v-else class="via">{{ rimaste }} rimaste</span>
        </span>
      </button>

      <template v-if="AVVENTURE_APERTE">
        <div class="riga-titolo">le avventure</div>

        <button v-for="s in storie" :key="s.id" class="avventura"
                :class="{ finita: s.finita, nuova: !s.cominciata }" @click="$emit('apri', s.id)">
          <span class="em">{{ s.emoji }}</span>
          <span class="che">
            <b>{{ s.nome }}</b>
            <i>{{ s.sottotitolo }}</i>
            <span v-if="s.fatti" class="barra"><span :style="{ width: (s.fatti / s.quanti * 100) + '%' }"></span></span>
          </span>
          <span class="dove">
            <b>{{ s.fatti }} <small>di {{ s.quanti }}</small></b>
            <span v-if="s.stelle" class="stelle">⭐ {{ s.stelle }}</span>
            <span v-else-if="!s.mappe" class="presto">in arrivo</span>
            <span v-else class="via">comincia →</span>
          </span>
        </button>
      </template>
    </template>
  </div>
</template>

<style scoped>
.scelta-avv { flex:1; min-height:0; overflow-y:auto;
              padding:10px 12px calc(16px + env(safe-area-inset-bottom)) }
.intro { font-size:13px; line-height:1.45; color:var(--tenue); margin:0 0 12px }

.avventura { display:flex; align-items:center; gap:11px; width:100%; text-align:left;
             margin-bottom:9px; background:var(--carta); border-radius:16px; padding:11px 12px;
             min-height:72px; box-shadow:0 3px 0 #dde3ea }
.avventura:active { transform:translateY(2px); box-shadow:none }
.avventura .em { flex:none; width:42px; height:42px; border-radius:13px; background:#eef2f9;
                 display:grid; place-items:center; font-size:22px }
.avventura.finita .em { background:var(--verde) }
.avventura .che { flex:1; min-width:0; display:grid; gap:3px }
.avventura .che b { font-size:15px; font-weight:900; color:var(--viola-scuro) }
.avventura .che i { font-style:normal; font-size:11.5px; line-height:1.3; color:var(--tenue);
                    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;
                    overflow:hidden }
.avventura .barra { display:block; height:5px; border-radius:3px; background:#e7ecf5;
                    overflow:hidden; margin-top:2px }
.avventura .barra span { display:block; height:100%; border-radius:3px;
                         background:linear-gradient(90deg,#6fd39a,#41b878) }
.avventura .dove { flex:none; text-align:right; display:grid; gap:3px; justify-items:end }
.avventura .dove b { font-size:14px; font-weight:900; color:var(--viola-scuro); white-space:nowrap }
.avventura .dove b small { font-size:10.5px; font-weight:800; color:var(--tenue) }
.avventura .dove .stelle { font-size:11px; font-weight:900; color:#b5891f }
.avventura .dove .via { font-size:10.5px; font-weight:900; color:#4a86e8 }
.avventura .dove .presto { font-size:10.5px; font-weight:900; color:var(--tenue) }

.riga-titolo { font-size:10px; font-weight:900; letter-spacing:.7px; text-transform:uppercase;
               color:var(--tenue); margin:16px 2px 7px }
.avventura.prove { background:#f4f7fb }
.avventura.prove .em { background:#e6ecf6 }
/* il tutorial in cima è la cosa da fare adesso: si vede che è quella */
.avventura.tutorial { background:var(--carta); box-shadow:0 3px 0 #d9c98e, 0 0 0 2px var(--giallo) }
.avventura.tutorial .em { background:var(--giallo) }
/* una storia chiusa: si legge, non si tocca */
.avventura.chiusa { opacity:.62; box-shadow:none; background:#f4f7fb }
.avventura.chiusa .dove b { font-size:16px }
</style>
