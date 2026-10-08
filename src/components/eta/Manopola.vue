<script setup>
/* La manopola dell'età: un numero solo (in anni), il quadro di quell'età
   sotto (data/quadro.js) e cosa è cambiato rispetto a prima. Due mestieri,
   un componente: il primo avvio (nessun bambino ancora) e la schermata dei
   grandi (`conferma`, muove una bozza e mostra «Applica»). Non salva mai:
   emette `scegli` una volta sola, quando chi guarda ha deciso. Il conto di
   cosa cambia è `spostandoLEta`/`rimettendoLEta` di data/partenze.js — la
   stessa funzione che poi scrive. Vedi docs/genitori/manopola.md,
   quadro.md, ritocchi.md. */
import { ref, computed } from 'vue'
import Blocco from './Blocco.vue'
import Riga from './Riga.vue'
import Tacca from './Tacca.vue'
import Conferma from './Conferma.vue'
import Taratura from './Taratura.vue'
import InCasa from './InCasa.vue'
import Scuola from './Scuola.vue'
import { GRUPPI } from './gruppi.js'
import { usaBozzaEta } from './bozza.js'
import { anniInLettere, perdeInParole } from './lettere.js'
import { quadroDi, vannoMale } from '../../data/quadro.js'
import { partenzaPerEta, rimettendoLEta } from '../../data/partenze.js'
import { classiNude } from '../../quiz/catalogo.js'
import { contoDi, consiglioDa } from '../../quiz/consiglio.js'

const props = defineProps({
  anni: { type: Number, default: null }, // null al primo avvio: una risposta già data si premerebbe senza leggerla
  giochi: { type: Object, default: () => ({}) },
  sa: { type: Object, default: () => ({}) },
  ritocchi: { type: Object, default: () => ({}) }, // non visibili nel quadro, ma si perdono cambiando fascia
  sperimentali: { type: Boolean, default: false },
  // false = primo avvio (tacca del padre, conferma con «Si gioca!»); true = bozza + «Applica» (schermata dei grandi)
  conferma: { type: Boolean, default: false },
  // la prima tacca nasce in fondo (4), non in mezzo: chi aggiunge un bambino aggiunge quasi sempre il più piccolo
  partenza: { type: Number, default: 4 },
  tarabile: { type: Boolean, default: false }, // solo nella schermata dei grandi: il primo avvio non ha un profilo da correggere
  // com'è andata finora (state.profile.items): una riga che va male porta il suo numero, stessa soglia di quiz/consiglio.js
  risposte: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['scegli', 'prova', 'ritocca', 'gioco', 'sapere', 'rimetti'])

// il ▶ apre la domanda vera (quiz/nucleo/esempi.js), non un nome scritto a mano che invecchierebbe da solo
const provaClasse = r => emit('prova', { sorgente: r.sorgente, nome: r.nome, eta: anniVisti.value })
// scorre solo le domande di questa fascia (stesso `giro` della scheda), non tutto il gruppo (vedi quadro.md)
const provaSapere = s => emit('prova', { giro: s.classi, nome: s.nome, eta: anniVisti.value })
const provaFascia = g => emit('prova',
  { nome: `Domande: ${GRUPPI[g.chiave].corto.toLowerCase()}`, eta: anniVisti.value })

const MIN = 4
const MAX = 12

const classi = classiNude() // non cambiano mai durante la vita della schermata: si chiedono una volta sola

// la bozza è il numero che la tacca muove senza toccare il profilo (fuori dalla schermata dei grandi non serve)
const { bozza, mossa, cambiata, muovi: muoviBozza, annulla } = usaBozzaEta({
  eta: () => props.anni, giochi: () => props.giochi, sa: () => props.sa,
  ritocchi: () => props.ritocchi, min: MIN, max: MAX,
})

const anniVisti = computed(() => props.conferma ? bozza.value : props.anni)

// muovendo la bozza il quadro diventa l'anteprima di spostandoLEta (i ritocchi si perdono cambiando fascia)
const eccezioni = computed(() => props.conferma && cambiata.value
  ? { giochi: mossa.value.giochi, sa: mossa.value.sa,
      ritocchi: mossa.value.riscrive ? {} : props.ritocchi }
  : { giochi: props.giochi, sa: props.sa, ritocchi: props.ritocchi })

const quadro = computed(() => anniVisti.value == null ? null : quadroDi(
  { eta: anniVisti.value, giochi: eccezioni.value.giochi, sa: eccezioni.value.sa,
    sperimentali: props.sperimentali, ritocchi: eccezioni.value.ritocchi },
  { classi }))

// la chiave porta anche il blocco: lo stesso pezzo di scuola sta in due blocchi, e senza si aprivano due tacche insieme
// non si tara con l'età in sospeso: cambiando fascia i ritocchi se ne vanno (vedi ritocchi.md)
const tarando = ref('')
const siPuoTarare = computed(() => props.tarabile && !(props.conferma && cambiata.value))
const apriTara = k => { tarando.value = tarando.value === k ? '' : k }
function ritocca (chiave, mossa) {
  emit('ritocca', { chiave, ...mossa })
  tarando.value = ''
}
function fissa (chiave, come) {
  emit('gioco', { chiave, come })
  tarando.value = ''
}
// stesso patto, tacca diversa (Scuola.vue) perché le parole sono altre: non salva, dice cosa ha deciso
function fissaSap (chiave, come) {
  emit('sapere', { chiave, come })
  tarando.value = ''
}

// il tasto che rimette tutto: in fondo, solo se c'è qualcosa da buttare (vedi ritocchi.md)
const rimessa = computed(() => rimettendoLEta({
  eta: anniVisti.value, giochi: props.giochi, sa: props.sa, ritocchi: props.ritocchi,
}))
const chiedoRimetti = ref(false)
const perdeTutto = computed(() => perdeInParole(rimessa.value.perde))

// muovere è una cosa sola vista da due parti: dove si conferma sposta la bozza, dove non si conferma emette e basta
function muovi (passo) {
  if (props.conferma) return muoviBozza(passo)
  const ora = props.anni == null ? props.partenza - passo : props.anni
  const nuova = Math.round((ora + passo) * 2) / 2
  if (nuova < MIN || nuova > MAX) return
  emit('scegli', nuova)
}

const inLettere = anniInLettere

// arrotondata al mezzo anno: il catalogo la dà a un decimale e nessun genitore giudica un decimale
const etaDella = a => inLettere(Math.round((a || 0) * 2) / 2)

const fascia = computed(() => partenzaPerEta(anniVisti.value))

// «mezzo anno più facile», non «+1»: i gradini sono roba nostra, un grande non sa quanto vale uno
const QUANTO = ['', 'mezzo anno', 'un anno', 'un anno e mezzo']
const scartoDi = n => n ? `${QUANTO[Math.min(Math.abs(n), 3)]} più ${n > 0 ? 'facile' : 'difficile'}` : ''

// chi l'ha spenta cambia la frase (l'età o il grande), vedi ritocchi.md
const sottoDelSapere = s => s.spento
  ? (s.attesoSpento ? 'a quest\'età non l\'ha ancora fatto: non gliele chiediamo'
                    : 'l\'hai tolta tu: non gliele chiediamo più')
  : (s.quante === 1 ? '1 domanda' : `${s.quante} domande`) +
    (s.attesoSpento ? ' · l\'età le terrebbe spente' : '') +
    (s.ritocco ? ` · ${scartoDi(s.ritocco)}` : '')
// gli anni sono quelli visti: se un grande l'ha spostata, la riga deve dire il numero che vale per suo figlio
const sottoDellaClasse = r => etaDella(r.anniOra ?? r.anni) +
  (r.riaccesa ? ' · l\'età la terrebbe spenta' : '') +
  (r.ritocco ? ` · ${scartoDi(r.ritocco)}` : '')

// «senza le divisioni» è la stessa frase che risponde a «perché il castello chiede solo moltiplicazioni»
const sottoDelGioco = g => {
  if (g.manca) return `è tutto «${g.manca}», che hai tolto dalle domande`
  const via = (g.chiede || []).filter(s => s.spento)
  return via.length ? `${g.che} · senza ${elencoDi(via.map(s => giu(s.nome)))}` : g.che
}

// stesse parole del blocco che raccoglie quelli tolti (eta/gruppi.js): non due nomi per uno stato
const statoDelPezzo = s => s.spento
  ? { testo: 'non ancora spiegate', cls: 'off' }
  : { testo: 'lo dà per scontato', cls: 'si' }

// torna l'etichetta di destra (lo stesso posto di «c'è»/«arriva più avanti»): niente quando non c'è niente da dire
function allarmeDi(chiavi) {
  const buone = (Array.isArray(chiavi) ? chiavi : [chiavi]).filter(Boolean)
  if (!buone.length) return null
  const c = consiglioDa(contoDi(buone, props.risposte))
  if (!c || c.verso !== -1) return null
  return { testo: `${c.detto}`, cls: 'va-male' }
}
// va male sulla somma delle sue domande, o su una sola che va a fondo pur restando la somma dentro soglia
const allarmeDelSapere = s => {
  const insieme = allarmeDi((s.classi || []).map(c => c.tipo))
  if (insieme) return insieme
  const righe = vannoMale({ saperi: [s] }, props.risposte)
  if (!righe.length) return null
  return { testo: righe.length === 1 ? '1 domanda va male'
                                     : `${righe.length} domande vanno male`,
           cls: 'va-male' }
}

// il rosso risale fino alla testata (vedi quadro.md): il conto è vannoMale in data/quadro.js, qui solo le parole
const maleDi = g => {
  const righe = vannoMale(g, props.risposte)
  if (!righe.length) return null
  const uno = righe[0]
  return {
    conta: righe.length === 1 ? '1 va male' : `${righe.length} vanno male`,
    // «in Le analogie» non si può scrivere: la strada si dice un pezzo dopo l'altro, non con l'articolo giusto
    frase: righe.length === 1
      ? `⚠️ ${uno.dentro ? `${uno.dentro} › ` : ''}«${uno.nome}» · ${uno.detto}`
      : `⚠️ ${righe.slice(0, 2).map(r => `«${r.nome}»`).join(' · ')}` +
        (righe.length > 2 ? ` · e altre ${righe.length - 2}` : ''),
  }
}

const TRE = 3
const assaggioDi = g => {
  const nomi = g.saperi.slice(0, TRE).map(s => giu(s.nome))
  const restanti = g.saperi.length - nomi.length
  return nomi.join(' · ') + (restanti > 0 ? ` · e altri ${restanti}` : '')
}

// più di uno alla volta va bene: sono blocchi corti e chi apre due elenchi li sta confrontando
const aperti = ref([])
const eAperto = k => aperti.value.includes(k)
const apri = k => { aperti.value = eAperto(k)
  ? aperti.value.filter(x => x !== k) : [...aperti.value, k] }

// i nomi dei blocchi (eta/gruppi.js) li usa anche la tacca che sposta una riga: devono essere gli stessi
const STATI = {
  qui: { testo: 'c\'è', cls: 'si' },
  passato: { testo: 'l\'ha già passato', cls: 'giu' },
  avanti: { testo: 'arriva più avanti', cls: 'su' },
  spento: { testo: 'l\'hai spento tu', cls: 'off' },
}
const stato = g => STATI[g.stato] || STATI.qui
const quantiQui = computed(() =>
  quadro.value ? quadro.value.giochi.filter(g => g.stato === 'qui').length : 0)

const ARTICOLI = ['il', 'lo', 'la', 'i', 'gli', 'le', "l'"]
// dentro una frase l'articolo va minuscolo, il nome proprio no: «con Survivors e il sotterraneo»
const inFrase = nome => {
  const [prima, ...resto] = String(nome || '').split(' ')
  return ARTICOLI.includes(prima.toLowerCase()) && resto.length
    ? [prima.toLowerCase(), ...resto].join(' ') : nome
}
const elencoDi = nomi => {
  const x = (nomi || []).map(inFrase)
  return x.length < 2 ? (x[0] || '') : `${x.slice(0, -1).join(', ')} e ${x[x.length - 1]}`
}

// minuscolo: finisce dentro una frase, non a capo di una riga («le divisioni», non «Le divisioni»)
const giu = n => String(n || '').charAt(0).toLowerCase() + String(n || '').slice(1)

</script>

<template>
  <div class="manopola" data-manopola>
    <Tacca :anni="anniVisti" :min="MIN" :max="MAX"
           :sotto="fascia ? `come in ${fascia.come}` : ''" @muovi="muovi" />

    <!-- niente quadro finché non si è scelto: sarebbe il quadro di un'età che nessuno ha deciso -->
    <p v-if="!quadro" class="invito">Sposta la manopola per vedere cosa cambia.</p>

    <div v-else class="quadro">
      <!-- forma sola: eta/Blocco.vue e eta/Riga.vue (vedi docs/genitori/quadro.md) -->
      <Blocco data-apri="giochi" titolo="In casa"
              :conta="`${quantiQui} su ${quadro.giochi.length}`"
              spiega="i giochi che trova in home a quest'età"
              :aperto="eAperto('giochi')" @apri="apri('giochi')">
        <template #chiuso>
          <span class="chip-riga">
            <span v-for="g in quadro.giochi" :key="g.chiave" class="chip"
                  :class="g.stato" :title="`${g.nome} — ${stato(g).testo}`">{{ g.ico }}</span>
          </span>
        </template>
        <ul class="elenco">
          <template v-for="g in quadro.giochi" :key="g.chiave">
            <!-- la ✎ di un gioco sceglie chi decide (l'età o il grande), non sposta mezzo anno -->
            <Riga :chiave="g.chiave" :ico="g.ico" :nome="g.nome" :stato="stato(g)"
                  :sotto="sottoDelGioco(g)"
                  :tara="siPuoTarare" :tarando="tarando === `gioco:${g.chiave}`"
                  :ritoccata="g.aMano"
                  :apribile="g.chiedeQui.length > 0" :aperto="eAperto(`gioco:${g.chiave}`)"
                  @tara="apriTara(`gioco:${g.chiave}`)" @apri="apri(`gioco:${g.chiave}`)">
              <InCasa v-if="tarando === `gioco:${g.chiave}`"
                      :nome="g.nome" :scelto="g.scelto" :difetto="g.difetto" :stato="g.stato"
                      :eta="anniVisti" :chiave="g.chiave"
                      @applica="fissa(g.chiave, $event)" @chiudi="tarando = ''" />
            </Riga>
            <!-- chiede: nel manifesto (data/giochi.js): non ha una fascia di padronanza, resta appeso al gioco -->
            <Riga v-for="(s, i) in (eAperto(`gioco:${g.chiave}`) ? g.chiedeQui : [])"
                  :key="s.chiave" dentro :ultima="i === g.chiedeQui.length - 1"
                  :ico="s.ico" :nome="s.nome" :sotto="s.che" :chiave="s.chiave"
                  :stato="statoDelPezzo(s)"
                  :tara="siPuoTarare" :tarando="tarando === `chiede:${g.chiave}:${s.chiave}`"
                  :ritoccata="s.aMano" @tara="apriTara(`chiede:${g.chiave}:${s.chiave}`)">
              <!-- niente scatti in mezzi anni: senza domande c'è solo un acceso e uno spento -->
              <Scuola v-if="tarando === `chiede:${g.chiave}:${s.chiave}`"
                      :nome="s.nome" :scelto="s.scelto" :atteso-spento="s.attesoSpento"
                      :spegne="s.spegne" :eta="anniVisti" :chiave="s.chiave"
                      @applica="fissaSap(s.chiave, $event)" @chiudi="tarando = ''" />
            </Riga>
          </template>
        </ul>
      </Blocco>

      <!-- se nessun gioco in casa pesca dai moduli di quiz, una riga sola: vedi quadro.md -->
      <Blocco v-if="!quadro.domande.chiedono" data-domande="nessuna"
              titolo="Le domande" conta="nessuna" :apribile="false"
              spiega="a quest'età nessun gioco gliele chiede: quelli che ha in casa hanno le loro"
              :assaggio="quadro.domande.da
                ? `Arrivano a ${inLettere(quadro.domande.da)}, con ${elencoDi(quadro.domande.quali)}`
                : ''" />

      <!-- quattro livelli di padronanza per questo bambino (vedi quadro.md); un blocco vuoto non si mostra -->
      <Blocco v-for="g in quadro.gruppi.filter(x => x.quante || x.saperi.length)"
              :key="g.chiave" :data-apri="g.chiave"
              :titolo="GRUPPI[g.chiave].nome" :conta="String(g.quante)"
              :spiega="GRUPPI[g.chiave].che"
              :assaggio="assaggioDi(g)" :allarme="maleDi(g)"
              :aperto="eAperto(g.chiave)" @apri="apri(g.chiave)">
        <ul class="elenco">
          <template v-for="s in g.saperi" :key="s.chiave">
            <!-- ▶ scorre solo le domande di questa fascia, ✎ apre la tacca che le sposta tutte insieme -->
            <Riga :ico="s.ico" :nome="s.nome" :chiave="s.chiave"
                  :sotto="sottoDelSapere(s)" :stato="allarmeDelSapere(s)"
                  :prova="!!s.quante" :tara="siPuoTarare"
                  :tarando="tarando === `sapere:${g.chiave}:${s.chiave}`"
                  :ritoccata="s.aMano"
                  apribile :aperto="eAperto(`${g.chiave}:${s.chiave}`)"
                  @prova="provaSapere(s)" @tara="apriTara(`sapere:${g.chiave}:${s.chiave}`)"
                  @apri="apri(`${g.chiave}:${s.chiave}`)">
              <!-- l'ottavo scatto («a scuola non l'hanno ancora fatto») c'è solo qui: si spegne il gruppo, non la domanda -->
              <Taratura v-if="tarando === `sapere:${g.chiave}:${s.chiave}`"
                        :livello="s.livello" :livelli="s.livelli" :eta="anniVisti"
                        :ritocco="s.ritocco" :spenta="s.spento" :chiave="s.chiave"
                        :attesa-spenta="s.attesoSpento" puo-spegnere
                        @applica="ritocca(s.chiave, $event)" @chiudi="tarando = ''" />
            </Riga>
            <!-- sotto una domanda va a che età serve, non il nome del modulo: è la sola cosa che un grande può giudicare -->
            <Riga v-for="(r, i) in (eAperto(`${g.chiave}:${s.chiave}`) ? s.classi : [])"
                  :key="r.chiave" dentro :ultima="i === s.classi.length - 1"
                  :nome="r.nome" :sotto="sottoDellaClasse(r)" :chiave="r.chiave"
                  :stato="allarmeDi(r.tipo)"
                  prova :tara="siPuoTarare && !!r.tipo"
                  :tarando="tarando === `classe:${g.chiave}:${r.chiave}`"
                  :ritoccata="r.aMano"
                  @prova="provaClasse(r)" @tara="apriTara(`classe:${g.chiave}:${r.chiave}`)">
              <!-- qui la tacca si ferma agli scatti: una domanda non ha un gruppo suo da spegnere -->
              <Taratura v-if="tarando === `classe:${g.chiave}:${r.chiave}`"
                        :livello="r.livello" :eta="anniVisti"
                        :ritocco="r.ritocco" :chiave="r.chiave"
                        :attesa-spenta="r.riaccesa"
                        @applica="ritocca(r.tipo, $event)" @chiudi="tarando = ''" />
            </Riga>
          </template>
        </ul>
        <!-- pesca come pescherebbe un gioco, stessa campana e saperi spenti: una riga che esiste può uscire una volta su trenta -->
        <button type="button" class="pesca" :data-fascia-pesca="g.chiave"
                @click.stop="provaFascia(g)">▶ pescane una come farebbe un gioco</button>
      </Blocco>

      <!-- in fondo, solo se c'è qualcosa da buttare; conferma dicendo cosa perde, non «sei sicuro?» -->
      <div v-if="siPuoTarare && rimessa.cambia" class="rimetti-tutto">
        <button v-if="!chiedoRimetti" type="button" class="tasto-rimetti"
                data-azione="rimetti-difetti" @click="chiedoRimetti = true">
          ↺ Rimetti tutto com'è di partenza a {{ inLettere(anniVisti) }}
          <i v-if="perdeTutto" data-perde-tutto>hai messo a mano: {{ perdeTutto }}</i>
        </button>
        <template v-else>
          <p class="che">Torna tutto ai valori di {{ inLettere(anniVisti) }}, e si perde
            quello che hai messo a mano<template v-if="perdeTutto">:
            {{ perdeTutto }}</template>. I progressi non si toccano.</p>
          <div class="riga-tasti">
            <button type="button" class="tasto-rimetti chiaro" data-azione="rimetti-no"
                    @click="chiedoRimetti = false">Lascia stare</button>
            <button type="button" class="tasto-rimetti forte" data-azione="rimetti-si"
                    @click="chiedoRimetti = false; emit('rimetti')">Rimetti</button>
          </div>
        </template>
      </div>
    </div>

    <!-- resta a schermo mentre si scorre il quadro: prima stava in fondo alla colonna e non si vedeva mai -->
    <Conferma v-if="conferma && cambiata" :anni="bozza" :mossa="mossa"
              @applica="emit('scegli', bozza)" @annulla="annulla" />
  </div>
</template>

<style scoped>
.manopola { width:100%; display:flex; flex-direction:column; gap:10px }

.invito { margin:0; text-align:center; font-size:13px; color:#7a7a8a }

.quadro { display:flex; flex-direction:column; gap:8px; text-align:left }
.chip-riga { display:flex; flex-wrap:wrap; gap:3px; margin-top:4px }
.chip { font-size:17px; line-height:1.1 }
.chip.passato, .chip.avanti, .chip.spento { opacity:.28; filter:grayscale(1) } /* sbiadito, non tolto: si vede cosa manca */

.elenco { list-style:none; margin:5px 0 0; padding:0; display:flex;
          flex-direction:column; gap:5px }
.pesca { width:100%; margin-top:7px; border:none; border-radius:11px; cursor:pointer;
         font-family:inherit; font-size:12px; font-weight:750; color:var(--viola);
         background:#f4f2fd; padding:9px }
.pesca:active { transform:translateY(1px) }

/* ambra come le righe messe a mano, non rosso: non cancella monete, traguardi o campagne */
.rimetti-tutto { display:flex; flex-direction:column; gap:7px; margin-top:2px }
.tasto-rimetti { border:none; border-radius:13px; cursor:pointer; font-family:inherit;
                 padding:10px 12px; text-align:left; background:#fdf4e3; color:#8a5a10;
                 font-size:12.5px; font-weight:800;
                 display:flex; flex-direction:column; gap:2px }
.tasto-rimetti i { font-style:normal; font-size:10.5px; font-weight:600; color:#9a7434 }
.tasto-rimetti:active { transform:translateY(1px) }
.rimetti-tutto .che { margin:0; font-size:11.5px; color:#7a7a8a; line-height:1.35;
                      text-align:left }
.riga-tasti { display:flex; gap:6px }
.riga-tasti .tasto-rimetti { flex:1; text-align:center; align-items:center; font-size:12.5px }
.tasto-rimetti.chiaro { background:#eee9fb; color:var(--viola-scuro) }
.tasto-rimetti.forte { background:linear-gradient(180deg,#e0a33c,#c07a10); color:#fff }
</style>
