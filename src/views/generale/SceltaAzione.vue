<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL FOGLIO DELLE SCELTE — si apre da un posto vuoto e si richiude

   Un solo foglio per tre domande, perché a gesto sono la stessa cosa:
   hai toccato una casella vuota di un ordine, e ti si chiede con cosa
   riempirla.

     · «azione» — cosa fa qui? i verbi che quell'unità sa fare, e la
       decisione, che non è un verbo e si vede che non lo è;
     · «cosa»   — su quale cosa? i nomi che il livello dichiara;
     · «cond»   — quale domanda? verbo di condizione, su cosa, e il
       «non», che non è una voce dell'elenco ma un interruttore:
       «vedi» e «non vedi» sono la stessa domanda con la risposta
       girata.

   ── PERCHÉ UN FOGLIO E NON UNA CASSETTA FISSA ──
   Prima i verbi stavano in fondo allo schermo, sempre lì, e per
   scrivere in un ramo bisognava prima dire dove si stava scrivendo e
   poi scendere a prendere il verbo: due gesti lontani, e in mezzo uno
   stato invisibile. Adesso il posto vuoto È il tasto — lo tocchi, e
   quello che scegli finisce lì. Su un telefono da 390 la cassetta si
   prendeva anche un quinto dello schermo per non fare niente.

   Qui non ci sono spiegazioni: i nomi dei verbi sono già la frase che
   si legge nella riga, e cosa fa un ordine si impara guardandolo
   correre. Le sette righe di aiuto che stavano in ogni pannellino le
   diceva a chi le aveva già capite.
   ═══════════════════════════════════════════════════════════════════ */
import { VERBI, GRADI, BLOCCHI } from '../../motore/generale.js'

const props = defineProps({
  modo: { type: String, default: '' },          // '' | 'azione' | 'cosa' | 'cond'
  titolo: { type: String, default: '' },
  /* modo «azione» */
  verbi: { type: Array, default: () => [] },
  conDecisione: { type: Boolean, default: false },
  conAscolto: { type: Boolean, default: false },
  /* modo «cosa» */
  cose: { type: Array, default: () => [] },
  scelto: { type: String, default: '' },
  /* modo «cond» */
  gruppi: { type: Array, default: () => [] },
  cond: { type: Object, default: null },
  frase: { type: String, default: '' },
})
const emit = defineEmits(['verbo', 'decisione', 'ascolto', 'cosa', 'cond-cambia', 'chiudi'])

/* i verbi in tre scaglioni, come li nomina il motore: un posto alla
   volta, un compito, una strategia. Sono le tre altezze del gioco, e
   restano visibili anche qui — ma senza una riga di spiegazione per
   ognuna, che è quello che li faceva sembrare un manuale. */
const scaglioni = () => {
  const per = { 1: [], 2: [], 3: [] }
  props.verbi.filter(v => v !== 'quando').forEach(v => per[VERBI[v].grado].push(v))
  return [1, 2, 3].filter(g => per[g].length).map(g => ({ g, nome: GRADI[g], verbi: per[g] }))
}
const ora = () => props.cond || {}
const gruppoOra = () => props.gruppi.find(g => g.cond === ora().cond) || null

function scegliCond (g) {
  if (ora().cond === g.cond) return
  const c = { cond: g.cond, complemento: (g.cose[0] || {}).id }
  if (ora().non) c.non = true
  emit('cond-cambia', c)
}
const scegliCosaCond = id => emit('cond-cambia', { ...ora(), complemento: id })
const gira = () => emit('cond-cambia', { ...ora(), non: !ora().non })
</script>

<template>
  <div v-if="modo" class="velo-scelta" @click.self="emit('chiudi')">
    <div class="foglio-scelta">
      <div class="capo">{{ titolo }}
        <button aria-label="chiudi" @click="emit('chiudi')">✕</button></div>

      <!-- ═════ COSA FA QUI ═════ -->
      <div v-if="modo === 'azione'" class="corpo">
        <div v-for="s in scaglioni()" :key="s.g" class="scaglione">
          <div class="et">{{ s.nome }}</div>
          <div class="griglia">
            <button v-for="v in s.verbi" :key="v" class="pezzo" :class="VERBI[v].cl"
                    @click="emit('verbo', v)">
              <span class="e">{{ VERBI[v].et }}</span>
              <span class="n">{{ VERBI[v].nome }}</span>
            </button>
          </div>
        </div>
        <!-- la decisione non è un verbo e non sta in mezzo ai verbi: è
             una struttura, e si vede che è un'altra cosa -->
        <div v-if="conDecisione || conAscolto" class="scaglione">
          <div class="et">e poi</div>
          <div class="griglia">
            <button v-if="conDecisione" class="pezzo scelta" @click="emit('decisione')">
              <span class="e">{{ BLOCCHI.condizione.et }}</span>
              <span class="n">{{ BLOCCHI.condizione.nome }}</span>
            </button>
            <button v-if="conAscolto" class="pezzo msg" @click="emit('ascolto')">
              <span class="e">{{ VERBI.quando.et }}</span>
              <span class="n">{{ VERBI.quando.nome }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ═════ SU QUALE COSA ═════ -->
      <div v-else-if="modo === 'cosa'" class="corpo nomi">
        <button v-for="c in cose" :key="c.id" class="nome" :class="{ qui: c.id === scelto }"
                @click="emit('cosa', c.id)">{{ c.em }} {{ c.nome }}</button>
      </div>

      <!-- ═════ QUALE DOMANDA ═════ -->
      <div v-else class="corpo">
        <div class="fila">
          <button v-for="g in gruppi" :key="g.cond" :class="{ qui: g.cond === ora().cond }"
                  @click="scegliCond(g)">{{ g.em }} {{ g.nome }}</button>
          <button v-if="gruppi.length" class="nega" :class="{ qui: !!ora().non }"
                  @click="gira">non</button>
        </div>
        <div v-if="gruppoOra()" class="fila lunghe">
          <button v-for="c in gruppoOra().cose" :key="c.id"
                  :class="{ qui: c.id === ora().complemento }"
                  @click="scegliCosaCond(c.id)">{{ c.em }} {{ c.nome }}</button>
        </div>
        <div class="frase" :class="{ vuota: !frase }">
          {{ frase || 'scegli cosa guardare, e su cosa' }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* il foglio sale dal basso e copre il resto: è una domanda sola, e
   finché non le rispondi non c'è altro da fare */
.velo-scelta { position:absolute; inset:0; z-index:30; display:flex; flex-direction:column;
               justify-content:flex-end; background:#0b122055 }
.foglio-scelta { max-height:70%; display:flex; flex-direction:column; background:var(--carta);
                 border-radius:18px 18px 0 0; box-shadow:0 -8px 24px #35415a3d;
                 animation:sale .16s ease-out }
@keyframes sale { from { transform:translateY(18px); opacity:.4 } to { transform:none; opacity:1 } }
.capo { display:flex; align-items:center; gap:8px; padding:10px 12px; font-size:14px;
        font-weight:900; color:var(--viola-scuro); border-bottom:1px solid #e6ebf3 }
.capo button { margin-left:auto; width:34px; height:34px; border-radius:10px;
               background:#eef2f9; font-size:14px }
.corpo { overflow-y:auto; padding:9px 10px calc(14px + env(safe-area-inset-bottom)) }

.scaglione { margin-bottom:9px }
.scaglione .et { font-size:9.5px; font-weight:900; letter-spacing:.5px; text-transform:uppercase;
                 color:var(--tenue); margin:0 2px 5px }
.griglia { display:grid; grid-template-columns:repeat(auto-fill,minmax(104px,1fr)); gap:6px }
.pezzo { display:flex; align-items:center; gap:6px; min-height:46px; padding:0 10px;
         border-radius:13px; background:#f4f7fb; box-shadow:0 2px 0 #dde3ea;
         border-bottom:3px solid #c6cfdd }
.pezzo:active { transform:translateY(2px); box-shadow:none }
.pezzo .e { font-size:17px; flex:none }
.pezzo .n { font-size:12.5px; font-weight:900; color:var(--viola-scuro); text-align:left;
            line-height:1.15 }
.pezzo.moto { border-bottom-color:#4a86e8 }
.pezzo.azione { border-bottom-color:#e8a33f }
.pezzo.ciclo { border-bottom-color:#3fb872 }
.pezzo.attesa { border-bottom-color:#b06be0 }
.pezzo.msg { border-bottom-color:#e0554d }
.pezzo.scelta { border-bottom-color:#8a63d2; background:#f6f2ff }

/* i nomi: uno per riga, grandi abbastanza da toccarli col pollice */
.corpo.nomi { display:grid; gap:5px }
.nome { min-height:48px; border-radius:13px; padding:0 12px; text-align:left; background:#f4f7fb;
        font-size:13.5px; font-weight:900; color:var(--viola-scuro); box-shadow:0 2px 0 #dde3ea }
.nome.qui { background:var(--giallo) }

/* la condizione: si compone come un ordine, verbo e complemento */
.fila { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:6px }
.fila button { min-height:42px; border-radius:11px; padding:0 10px; background:#f4f7fb;
               font-size:12.5px; font-weight:800; color:var(--viola-scuro);
               box-shadow:0 2px 0 #dde3ea }
.fila.lunghe button { width:100%; justify-content:flex-start; text-align:left }
.fila button.qui { background:var(--giallo) }
.fila button.nega { margin-left:auto; color:#a8322c }
.fila button.nega.qui { background:#ffd9d4 }
.frase { font-size:13px; font-weight:900; color:var(--viola-scuro); padding:4px 2px 0 }
.frase.vuota { font-weight:700; color:var(--tenue) }
</style>
