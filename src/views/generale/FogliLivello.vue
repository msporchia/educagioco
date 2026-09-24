<script setup>
/* ═══════════════════════════════════════════════════════════════════
   I FOGLI — quello che si apre sopra la lista e si richiude

   Sono quattro e si somigliano: una testa con un titolo e la ✕, un
   corpo che scorre. Il registro (cos'è successo), il cartello (cosa
   racconta il livello, e gli aiuti), la scheda (com'è fatto uno che sta
   in campo) e l'elenco dei nomi (le cose che non stanno sulla mappa).

   Si aprono SOPRA la lista degli ordini e non sopra i comandi: un
   avviso che copre i verbi è un avviso che ti impedisce di fare la cosa
   che ti sta suggerendo.

   Qui dentro non si decide niente: si legge quello che il gioco passa e
   si dice cosa ha toccato il dito. Il registro non riavvolge — chiede
   di riavvolgere; il cartello non spende le monete — chiede l'aiuto.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, watch, onUnmounted } from 'vue'
import { VERBI, reazioniDi, verbiPer, nonSa, scusaDi } from '../../motore/generale.js'
import { mancano, chiedeConferma, scrive } from '../../giochi/aiuti.js'

const props = defineProps({
  quale: { type: String, default: '' },        // '' | 'registro' | 'cartello' | 'scheda'
  liv: { type: Object, required: true },
  mondoOra: { type: Function, default: () => null },
  righe: { type: Array, default: () => [] },   // le righe del registro
  /* la scala degli aiuti, già composta da `generale/piano.js`: i
     gradini scesi finora e quello che verrebbe adesso. Qui dentro non
     si sa cosa faccia un gradino — si sa che tipo è, e quel tipo è
     tutto quello che serve per scriverci sopra un tasto onesto. */
  fatti: { type: Array, default: () => [] },
  prossimo: { type: Object, default: null },
  monete: { type: Number, default: 0 },        // quante ne ha: il tasto dice se bastano
  scheda: { type: String, default: '' },       // di chi è la scheda aperta
  mia: { type: Boolean, default: false },      // ...e se lo comanda il giocatore
  /* l'elenco dei nomi ha una vita sua: non è uno dei tre pannelli, si
     apre quando un verbo cerca una cosa che sulla mappa non si tocca */
  elenco: { type: Object, default: null },     // { verbo, cose, scelto }
})
const emit = defineEmits(['chiudi', 'riavvolgi', 'aiuto', 'rimetti', 'scegli-nome', 'chiudi-elenco'])

/* ── COME SI PRESENTA UN GRADINO ──
   Prima di essere premuto dice cosa farà e quanto costa; dopo, dice
   cos'è comparso. Le parole di un gradino le può scrivere il livello
   (`aiuto.scrive(piano, 'ti metto il giro di ronda')`); se non lo fa,
   queste sono buone per tutti. */
const FACCIA = {
  ragiona: { em: '🧠', tasto: 'Aiutami a ragionare', ancora: 'Ragioniamoci ancora',
             sotto: 'non ti dico la risposta: ti aiuto a trovarla', fatto: 'Ragioniamo' },
  dice: { em: '💡', tasto: 'Dammi un indizio', ancora: 'Un altro indizio',
          sotto: 'una cosa da guardare, o da fare', fatto: 'Indizio' },
  scrive: { em: '🧩', tasto: 'Scrivimi un pezzo', ancora: 'Scrivimene un altro pezzo',
            sotto: 'ti metto nel piano un pezzo già fatto',
            fatto: 'Te l’ho scritto io' },
  forma: { em: '🧩', tasto: 'Mettimi la struttura', ancora: 'Mettimi la struttura',
           sotto: 'ti scrivo quali ordini e in che disposizione: i bersagli li trovi tu',
           fatto: 'La struttura è nel piano' },
  svela: { em: '✅', tasto: 'Svelami la soluzione', ancora: 'Svelami la soluzione',
           sotto: 'ti scrivo il piano intero: premi ▶ e guardalo girare',
           fatto: 'Il piano è scritto' },
}
const faccia = p => (p && FACCIA[p.aiuto]) || FACCIA.dice

/* ── IL PREZZO, E IL SECONDO TOCCO ──
   Il tasto dice quanto costa prima di essere premuto. Se le monete non
   bastano lo dice e non fa niente — quanto manca, non «non puoi». Dai
   cinquanta in su chiede un secondo tocco: il primo lo arma e il tasto
   dice «sì, pago», e se il secondo non arriva entro qualche secondo si
   disarma da solo. Un gradino che scrive toglie anche quello che hai
   scritto tu, e lo dice. */
const armato = ref(false)
let disarma = 0
const povero = () => mancano(props.monete, props.prossimo) > 0
function premi () {
  const p = props.prossimo
  if (!p || povero()) return
  if (chiedeConferma(p) && !armato.value) {
    armato.value = true
    clearTimeout(disarma)
    disarma = setTimeout(() => { armato.value = false }, 4000)
    return
  }
  armato.value = false
  clearTimeout(disarma)
  emit('aiuto')
}
/* cambiando gradino (o chiudendo il cartello) il tasto riparte disarmato */
watch(() => [props.prossimo, props.quale], () => { armato.value = false; clearTimeout(disarma) })
onUnmounted(() => clearTimeout(disarma))

const unita = () => {
  const m = props.mondoOra()
  return m && props.scheda ? m.perId[props.scheda] : null
}
const reazioni = () => reazioniDi(props.mondoOra(), props.scheda) || []
const sa = () => verbiPer(props.mondoOra(), props.scheda) || []
/* e il perché, quando il livello lo dice: un «non sa aprire» barrato e
   basta è una regola calata dall'alto, «ha le mani occupate» è un
   personaggio */
const nonSaFare = () => (nonSa(props.mondoOra(), props.scheda) || [])
  .map(v => ({ v, perche: scusaDi(props.mondoOra(), props.scheda, v) }))
</script>

<template>
  <div v-if="quale === 'registro'" class="foglio">
    <div class="capo">📜 Registro <small>tocca una riga per tornare a quel momento</small>
      <button aria-label="chiudi" @click="emit('chiudi')">✕</button></div>
    <div class="corpo">
      <div v-if="!righe.length" class="vuoto">Niente ancora. Premi ▶.</div>
      <div v-for="(r, i) in righe" :key="i" class="rr" :class="r.esito"
           @click="emit('riavvolgi', r.t)">
        <span class="chi2">{{ r.emoji }}</span>
        <span class="tt">{{ r.testo }}<b v-if="r.n > 1"> ×{{ r.n }}</b></span>
        <span class="tk">{{ r.t }}</span>
      </div>
    </div>
  </div>

  <div v-else-if="quale === 'cartello'" class="foglio cartello">
    <div class="capo">💡 {{ liv.nome }} <small>{{ liv.idea }}</small>
      <button aria-label="chiudi" @click="emit('chiudi')">✕</button></div>
    <div class="corpo">
      <p class="racconto" v-html="liv.racconto || liv.dritta"></p>

      <!-- ═════ LA SCALA ═════
           Un gradino per volta, in ordine, e un tasto solo. Quello che
           è già sceso resta scritto qui: i suggerimenti si rileggono, e
           quelli che hanno scritto nel piano si vedono nel piano — qui
           ne resta la riga che dice cos'è successo. -->
      <!-- un gradino che scrive, già pagato, si rimette gratis: il piano
           si cambia e si butta, e quello che si è comprato non si ricompra -->
      <div v-for="(a, k) in fatti" :key="k" class="aiuto" :class="[a.aiuto, { scritto: scrive(a) }]"
           :data-aiuto-fatto="a.aiuto">
        <b>{{ faccia(a).em }} {{ faccia(a).fatto }}</b>
        {{ a.testo || (scrive(a) ? faccia(a).sotto : '') }}
        <button v-if="scrive(a)" class="rimetti" data-azione="rimetti-aiuto"
                @click="emit('rimetti', k)">↺ rimettilo nel piano <small>già pagato</small></button>
      </div>

      <!-- e il prossimo, che dice cosa farà PRIMA di essere premuto: il
           prezzo si annuncia, non si scopre dopo -->
      <!-- «un altro» solo se di quel tipo ne è già sceso uno: al primo
           pezzo scritto nel piano il tasto diceva «scrivimene un altro
           pezzo» perché prima erano stati letti due suggerimenti, che
           sono un'altra cosa -->
      <button v-if="prossimo" class="chiedi"
              :class="[prossimo.prezzo ? 'grosso' : 'gratis', { povero: povero(), armato }]"
              :disabled="povero()" data-azione="chiedi-aiuto" :data-prezzo="prossimo.prezzo"
              @click="premi">
        <span class="riga-tasto">
          <span>{{ faccia(prossimo).em }}
            {{ armato ? `Sì, pago ${prossimo.prezzo} monete`
                      : fatti.some(a => a.aiuto === prossimo.aiuto)
                          ? faccia(prossimo).ancora : faccia(prossimo).tasto }}</span>
          <span class="prezzo" :class="{ zero: !prossimo.prezzo }">{{ prossimo.prezzo ? `🪙 ${prossimo.prezzo}` : 'gratis' }}</span>
        </span>
        <small v-if="povero()" data-mancano>Ti servono {{ prossimo.prezzo }} monete e ne hai {{ monete }}:
          le monete si guadagnano finendo i livelli, qui e negli altri giochi.</small>
        <small v-else-if="armato">Tocca ancora per confermare.<template v-if="scrive(prossimo)"> Il piano
          che hai adesso viene sostituito.</template></small>
        <small v-else>{{ faccia(prossimo).sotto }}<template v-if="prossimo.prezzo"> · hai 🪙 {{ monete }}</template></small>
      </button>
      <div v-else class="aiuto muto">Non ho altro da dirti: il resto è tuo.</div>
    </div>
  </div>

  <div v-else-if="quale === 'scheda' && unita()" class="foglio">
    <div class="capo">{{ unita().emoji }} {{ unita().nome }}
      <small>{{ mia ? 'lo comandi tu' : 'non prende ordini da te' }}</small>
      <button aria-label="chiudi" @click="emit('chiudi')">✕</button></div>
    <div class="corpo">
      <div class="dati">
        <span>❤️ {{ unita().vita }}/{{ unita().vitaMax }} di vita</span>
        <span>👁 vede a {{ unita().vista }} caselle</span>
        <span>✋ {{ unita().mani }} {{ unita().mani === 1 ? 'mano' : 'mani' }}<template v-if="unita().mani"> ({{ unita().maniLibere }} libere)</template></span>
      </div>
      <!-- COME È FATTO. Non è un ordine che gli ha dato qualcuno: è la
           sua natura, e va letta prima di scrivere il piano — perché è
           lì che si trova il buco. -->
      <template v-if="reazioni().length">
        <div class="tit2">com'è fatto</div>
        <div class="reaz">
          <span v-for="r in reazioni()" :key="r.che">{{ r.em }} {{ r.testo }}</span>
        </div>
      </template>
      <div class="tit2">sa fare</div>
      <div class="abil">
        <span v-for="v in sa()" :key="v" class="ab">{{ VERBI[v].et }} {{ VERBI[v].nome }}</span>
      </div>
      <template v-if="nonSaFare().length">
        <div class="tit2">non sa fare</div>
        <div class="abil no">
          <span v-for="n in nonSaFare()" :key="n.v" class="ab">
            <b>{{ VERBI[n.v].et }} {{ VERBI[n.v].nome }}</b>
            <i v-if="n.perche">{{ n.perche }}</i></span>
        </div>
      </template>
    </div>
  </div>

  <!-- ═════ L'ELENCO DEI NOMI ═════
       Un segnale non sta sulla mappa: non si tocca col dito, si sceglie
       fra i nomi che il livello dichiara. -->
  <div v-if="elenco" class="foglio nomi">
    <div class="capo">{{ VERBI[elenco.verbo].et }} {{ VERBI[elenco.verbo].nome }}
      <small>scegli il nome</small>
      <button aria-label="chiudi" @click="emit('chiudi-elenco')">✕</button></div>
    <div class="corpo">
      <button v-for="c in elenco.cose" :key="c.id" class="nome"
              :class="{ qui: c.id === elenco.scelto }"
              @click="emit('scegli-nome', c.id)">{{ c.em }} {{ c.nome }}</button>
    </div>
  </div>
</template>

<style scoped>
.foglio { flex:none; max-height:42vh; display:flex; flex-direction:column;
          background:var(--carta); border-radius:18px 18px 0 0;
          box-shadow:0 -6px 18px #35415a26; z-index:2 }
.foglio .capo { display:flex; align-items:center; gap:8px; padding:9px 12px; font-size:14px;
                font-weight:900; color:var(--viola-scuro); border-bottom:1px solid #e6ebf3 }
.foglio .capo small { font-weight:700; font-size:10.5px; color:var(--tenue) }
.foglio .capo button { margin-left:auto; width:34px; height:34px; border-radius:10px;
                       background:#eef2f9; font-size:14px }
.foglio .corpo { overflow-y:auto; padding:8px 10px calc(12px + env(safe-area-inset-bottom)) }
.vuoto { font-size:12px; line-height:1.45; color:var(--tenue); padding:8px 4px }

/* l'elenco dei nomi: un nome per riga, grande abbastanza da toccarlo */
.foglio.nomi .corpo { display:grid; gap:5px }
.foglio.nomi .nome { min-height:46px; border-radius:12px; padding:0 12px; text-align:left;
                     background:#f4f7fb; font-size:13.5px; font-weight:900;
                     color:var(--viola-scuro); box-shadow:0 2px 0 #dde3ea }
.foglio.nomi .nome.qui { background:var(--giallo) }

/* il registro: una riga per cosa successa, col colore dell'esito */
.rr { display:flex; align-items:center; gap:8px; min-height:34px; padding:4px 8px; border-radius:10px;
      margin-bottom:3px; background:#f4f7fb; border-left:4px solid #c6cfdd }
.rr.fa { border-left-color:var(--verde) }
.rr.aspetto { border-left-color:var(--giallo) }
.rr.no { border-left-color:#e0554d; background:#ffe6e3 }
.rr.salto { border-left-color:#a9b4c6 }
.rr .chi2 { flex:none; font-size:14px }
.rr .tt { flex:1; font-size:12px; font-weight:700; line-height:1.25; color:var(--viola-scuro) }
.rr.no .tt { color:#a8322c }
.rr .tk { flex:none; font-size:10px; color:var(--tenue); font-weight:800 }

/* il cartello: il racconto, e gli aiuti — gratis quelli che fanno
   ragionare, in monete gli altri */
.racconto { margin:2px 0 10px; font-size:13px; line-height:1.5; color:var(--viola-scuro) }
.aiuto { background:#f4f7fb; border-left:4px solid var(--giallo); border-radius:10px;
         padding:7px 9px; margin-bottom:6px; font-size:12.5px; line-height:1.4 }
.aiuto b { display:block; font-size:10px; letter-spacing:.5px; text-transform:uppercase;
           color:#b5891f }
.aiuto.muto { border-left-color:#c6cfdd; color:var(--tenue) }
/* i gradini che fanno ragionare hanno il colore del tasto gratis: si
   riconoscono a colpo d'occhio da quelli pagati */
.aiuto.ragiona { border-left-color:#3aa76d; background:#effaf3 }
.aiuto.ragiona b { color:#237a4b }
.chiedi { display:block; width:100%; min-height:52px; border-radius:12px; padding:8px 12px;
          text-align:left; background:#f4f7fb; font-size:13.5px; font-weight:900;
          color:var(--viola-scuro); box-shadow:0 2px 0 #dde3ea }
.chiedi .riga-tasto { display:flex; align-items:center; gap:8px }
.chiedi .riga-tasto > span:first-child { flex:1; min-width:0 }
.chiedi .prezzo { flex:none; border-radius:999px; padding:3px 9px; font-size:12.5px;
                  background:#fff3c4; color:#7a5a00; box-shadow:inset 0 0 0 1.5px #f0d77a }
.chiedi .prezzo.zero { background:#c9efd6; color:#1c6b3f; box-shadow:none }
.chiedi small { display:block; font-size:11px; font-weight:700; color:var(--tenue);
                line-height:1.35; margin-top:2px }
.chiedi small b { color:var(--viola-scuro) }
.chiedi.gratis { background:#dff5e6 }
/* un gradino che si paga si vede che è un'altra cosa da uno gratis —
   bordo pieno invece del verde — e il prezzo sta dentro */
.chiedi.grosso { background:#fff; box-shadow:inset 0 0 0 1.5px #d6def0, 0 2px 0 #dde3ea }
/* armato: il secondo tocco paga. Un sobbalzo solo, quando si arma: un
   tasto che pulsa senza fine è un tasto che chiede di essere premuto */
.chiedi.armato { background:#fff7d6; box-shadow:inset 0 0 0 2px #e0a800, 0 2px 0 #dde3ea;
                 animation:armato .28s ease-out }
@keyframes armato { 50% { transform:scale(1.02) } }
/* senza monete il tasto c'è, spento, e dice quanto manca */
.chiedi.povero { opacity:.75; background:#f4f5f8; box-shadow:inset 0 0 0 1.5px #e2e6ee }
.chiedi.povero .prezzo { background:#eceef3; color:#8a93a6; box-shadow:none }
.chiedi.povero small { color:#a8322c }
/* e quando è già sceso, la riga che lo racconta ha il suo colore */
.aiuto.scritto { border-left-color:#8a63d2; background:#f6f2ff }
.aiuto.scritto b { color:#6b52ab }
.aiuto .rimetti { display:block; margin-top:6px; min-height:34px; border-radius:10px; padding:0 10px;
                  background:#ebe4fb; color:#4d3a86; font-size:12px; font-weight:900 }
.aiuto .rimetti small { font-weight:700; color:#7d6bb0; margin-left:4px }

/* la scheda: come è fatto uno che sta in campo */
.dati { display:flex; gap:10px; flex-wrap:wrap; font-size:12.5px; color:var(--tenue);
        font-weight:800; margin-bottom:8px }
.tit2 { font-size:10px; font-weight:900; letter-spacing:.6px; text-transform:uppercase;
        color:var(--tenue); margin:6px 0 5px }
.abil { display:flex; gap:5px; flex-wrap:wrap }
.abil .ab { font-size:12px; font-weight:800; background:#f4f7fb; border-radius:10px; padding:6px 8px;
            color:var(--viola-scuro) }
.abil.no .ab { opacity:.75 }
.abil.no .ab b { font-weight:800; text-decoration:line-through }
.abil.no .ab i { display:block; font-style:normal; font-size:11px; font-weight:700;
                 color:var(--tenue); margin-top:2px }
/* com'è fatto: una riga per reazione, e si legge come una regola */
.reaz { display:flex; flex-direction:column; gap:5px }
.reaz span { font-size:12.5px; font-weight:700; line-height:1.3; background:#fff5e6;
             border-radius:10px; padding:7px 9px; color:#6b4310 }
</style>
