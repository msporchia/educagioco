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

   ── E PERCHÉ ATTACCATO, E NON IN FONDO ──
   Per un po' questo foglio è salito dal basso, largo quanto lo schermo:
   il gesto era giusto ma la risposta compariva lontana dalla domanda —
   premevi il `＋` in mezzo alla lista e le azioni apparivano dall'altra
   parte, sopra tutto il resto. Adesso è un fumetto ancorato al tasto
   premuto (`ancora`), con la punta rivolta verso di lui: si apre in
   giù se sotto c'è posto, in su se non c'è, e solo quando non ci sta
   da nessuna parte torna a mettersi al centro. Il resto della lista
   resta visibile, ed è quello che fa capire dove finirà quello che
   scegli.

   Qui non ci sono spiegazioni: i nomi dei verbi sono già la frase che
   si legge nella riga, e cosa fa un ordine si impara guardandolo
   correre. Le sette righe di aiuto che stavano in ogni pannellino le
   diceva a chi le aveva già capite.
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'
import { VERBI, GRADI, BLOCCHI } from '../../motore/generale.js'

const props = defineProps({
  modo: { type: String, default: '' },          // '' | 'azione' | 'cosa' | 'cond'
  titolo: { type: String, default: '' },
  /* il tasto che ha aperto la domanda, in coordinate di finestra:
     `{ cx, su, giu }`. Senza, il foglio si mette al centro. */
  ancora: { type: Object, default: null },
  /* modo «azione» */
  verbi: { type: Array, default: () => [] },
  /* quelli che questa unità NON sa fare: `[{ v, perche }]`. Si vedono
     spenti, con la ragione, e non si toccano */
  negati: { type: Array, default: () => [] },
  conDecisione: { type: Boolean, default: false },
  conCiclo: { type: Boolean, default: false },
  conAscolto: { type: Boolean, default: false },
  /* modo «cosa» */
  cose: { type: Array, default: () => [] },
  scelto: { type: String, default: '' },
  /* modo «cond» */
  gruppi: { type: Array, default: () => [] },
  cond: { type: Object, default: null },
  frase: { type: String, default: '' },
})
const emit = defineEmits(['verbo', 'decisione', 'ciclo', 'ascolto', 'cosa',
                          'cond-cambia', 'chiudi'])

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
  /* se di cose da guardare ce n'è una sola, la domanda è già finita:
     restare aperti a mostrare un elenco di un elemento è chiedere di
     confermare una cosa che non aveva alternative */
  if (g.cose.length <= 1) emit('chiudi')
}
/* ── SCELTO SU COSA, LA DOMANDA È FINITA ──
   Una condizione è verbo + complemento, come un ordine: appena arriva
   il secondo pezzo la frase è completa e il foglio si chiude da sé,
   esattamente come quando scegli il bersaglio di un verbo. Restava
   aperto in attesa di una ✕ che nessuno pensava di premere, e in mezzo
   allo schermo c'era un pannello che non chiedeva più niente.
   Il «non» e il cambio di verbo NON chiudono: quelli lasciano la frase
   a metà, e chi li tocca sta ancora componendo. */
const scegliCosaCond = id => {
  emit('cond-cambia', { ...ora(), complemento: id })
  emit('chiudi')
}
const gira = () => emit('cond-cambia', { ...ora(), non: !ora().non })

/* ── dove si mette il fumetto ──
   Tre numeri e due decisioni: quanto è largo (mai oltre lo schermo),
   da che parte si apre (dove c'è più posto, con una preferenza per il
   sotto, che è la direzione in cui si legge), e dove va la punta —
   che resta agganciata al tasto anche quando il foglio è stato
   spostato per non uscire dal bordo.
   Il calcolo si rifà a ogni apertura perché `ancora` cambia: non
   serve stare a sentire lo scorrimento, la lista sotto è ferma
   finché il velo è aperto. */
/* `COMODO` è quanto spazio basta perché aprire in giù sia la scelta
   buona anche quando sopra ce n'è di più: si legge dall'alto in basso,
   e un menù che scatta all'insù ogni volta che la lista è a metà
   schermo sembra saltare da una parte all'altra. */
const LARGO = 360, MARGINE = 8, MINIMO = 170, COMODO = 250
const posa = computed(() => {
  const a = props.ancora
  if (!props.modo || !a || typeof window === 'undefined') return null
  const vw = window.innerWidth, vh = window.innerHeight
  const w = Math.min(LARGO, vw - MARGINE * 2)
  const x = Math.max(MARGINE, Math.min(a.cx - w / 2, vw - MARGINE - w))
  const sotto = vh - a.giu - MARGINE * 2, sopra = a.su - MARGINE * 2
  /* se non ci sta nemmeno il minimo da nessuna delle due parti, tanto
     vale metterlo al centro: un fumetto alto ottanta pixel non è più
     un fumetto, è una fessura */
  if (Math.max(sotto, sopra) < MINIMO) return null
  const giu = sotto >= COMODO || sotto >= sopra
  return {
    giu, punta: Math.round(Math.max(16, Math.min(a.cx - x, w - 16))),
    stile: {
      width: w + 'px', left: Math.round(x) + 'px',
      maxHeight: Math.round((giu ? sotto : sopra) - MARGINE) + 'px',
      ...(giu ? { top: Math.round(a.giu + MARGINE) + 'px' }
              : { bottom: Math.round(vh - a.su + MARGINE) + 'px' }),
    },
  }
})
</script>

<template>
  <div v-if="modo" class="velo-scelta" :class="{ centrato: !posa }" @click.self="emit('chiudi')">
    <div class="foglio-scelta" :class="posa ? (posa.giu ? 'giu' : 'su') : 'mezzo'"
         :style="posa ? { ...posa.stile, '--punta': posa.punta + 'px' } : null">
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
        <div v-if="conDecisione || conCiclo || conAscolto" class="scaglione">
          <div class="et">e poi</div>
          <div class="griglia">
            <button v-if="conDecisione" class="pezzo scelta" @click="emit('decisione')">
              <span class="e">{{ BLOCCHI.condizione.et }}</span>
              <span class="n">{{ BLOCCHI.condizione.nome }}</span>
            </button>
            <!-- il ciclo è un blocco come la decisione, e sta con lei:
                 sono le due cose che CONTENGONO ordini -->
            <button v-if="conCiclo" class="pezzo ciclo" @click="emit('ciclo')">
              <span class="e">{{ BLOCCHI.ripeti.et }}</span>
              <span class="n">{{ BLOCCHI.ripeti.nome }}</span>
            </button>
            <button v-if="conAscolto" class="pezzo msg" @click="emit('ascolto')">
              <span class="e">{{ VERBI.quando.et }}</span>
              <span class="n">{{ VERBI.quando.nome }}</span>
            </button>
          </div>
        </div>

        <!-- quello che questa non sa fare: si vede, spento, e dice
             perché. È la divisione dei compiti, e va letta prima di
             scrivere il piano, non scoperta cercando un tasto. -->
        <div v-if="negati.length" class="scaglione">
          <div class="et">questo non lo sa fare</div>
          <div class="griglia larga">
            <span v-for="n in negati" :key="n.v" class="pezzo spento">
              <span class="e">{{ VERBI[n.v].et }}</span>
              <span class="n">{{ VERBI[n.v].nome }}
                <i v-if="n.perche">{{ n.perche }}</i></span>
            </span>
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
/* il velo non nasconde, intercetta: serve a chiudere toccando fuori, e
   deve lasciar vedere la riga da cui la domanda è partita */
.velo-scelta { position:fixed; inset:0; z-index:30; background:#0b12201f }
.velo-scelta.centrato { display:flex; align-items:center; justify-content:center;
                        padding:12px; background:#0b122055 }
/* fondo PIENO, non `--carta`: quello è bianco al 94%, e appoggiato
   sulla lista invece che su un velo scuro lasciava trasparire le righe
   sotto le voci del menù */
.foglio-scelta { position:fixed; display:flex; flex-direction:column; background:#fff;
                 border-radius:16px; box-shadow:0 8px 28px #1b243a4d, 0 0 0 1.5px #d6def0;
                 animation:spunta .14s ease-out }
/* al centro non è ancorato a niente: torna un foglio normale */
.foglio-scelta.mezzo { position:static; width:100%; max-width:360px; max-height:100% }
@keyframes spunta { from { transform:scale(.97); opacity:.3 } to { transform:none; opacity:1 } }

/* la punta: sta dov'era il dito, anche quando il foglio si è spostato
   per non uscire dal bordo */
.foglio-scelta.giu::before, .foglio-scelta.su::before {
  content:''; position:absolute; left:var(--punta); width:14px; height:14px;
  margin-left:-7px; background:#fff; transform:rotate(45deg) }
.foglio-scelta.giu::before { top:-6px; box-shadow:-1.5px -1.5px 0 #d6def0 }
.foglio-scelta.su::before { bottom:-6px; box-shadow:1.5px 1.5px 0 #d6def0 }
.capo { display:flex; align-items:center; gap:8px; padding:10px 12px; font-size:14px;
        font-weight:900; color:var(--viola-scuro); border-bottom:1px solid #e6ebf3 }
.capo button { margin-left:auto; width:34px; height:34px; border-radius:10px;
               background:#eef2f9; font-size:14px }
.corpo { min-height:0; overflow-y:auto; padding:9px 10px 11px }

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
.pezzo.chiama { border-bottom-color:#3fb872 }
.pezzo.scelta { border-bottom-color:#8a63d2; background:#f6f2ff }
/* spento: c'è, si legge, non si preme */
.griglia.larga { grid-template-columns:1fr }
.pezzo.spento { background:#f2f4f8; box-shadow:none; border-bottom:3px solid #dfe4ec;
                opacity:.85; align-items:flex-start; padding-top:6px; padding-bottom:6px }
.pezzo.spento .e { filter:grayscale(1); opacity:.6 }
.pezzo.spento .n { color:var(--tenue) }
.pezzo.spento .n i { display:block; font-style:normal; font-size:11px; font-weight:700;
                     line-height:1.25; color:#8d97a8; margin-top:1px }

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
