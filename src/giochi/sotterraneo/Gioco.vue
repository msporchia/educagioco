<script setup>
// Il coordinatore: un sotterraneo che si cammina col dito, un posto
// invece che un diagramma.
// L'unico file che sa che esistono monete, avanzamento salvato e quiz: le
// regole stanno in motore/, i numeri in dati/, il disegno in scena/, le
// schermate in viste/. `corsa.chiesta` dice solo quanto dev'essere
// difficile; qui si va a prendere una domanda vera dai moduli di quiz.
import { ref, shallowRef, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import Barra from '../../components/Barra.vue'
import { suono } from '../../audio.js'
import { state, segna, segnaBest } from '../../store/profile.js'
import { borsa } from '../../store/varieta.js'
import { PAGA } from '../../data/paghe.js'
import { progresso, aperta, adesso, chiusaPerEta, completa, scelta, ricorda, ritocca } from '../campagne.js'
import { usaPausa } from '../pausa.js'
import { prendiRipresa } from '../ripresa.js'
import VeloPausa from '../VeloPausa.vue'
import { domandaPerGioco } from '../../quiz/scelta.js'
import Domanda from '../../quiz/Domanda.vue'

import { CAMPAGNA, QUANTE_TAPPE, stelleDella, L_ABISSO, INDICE_ABISSO,
         tappaDi } from './dati/campagna.js'
import { COSE, SEGNI } from './dati/cose.js'
import { MOSTRI } from './dati/mostri.js'
import { CURIOSITA_DI } from './dati/curiosita.js'
import { pezzoAndante } from './dati/tessere.js'
import { EROI, DI_PARTENZA, eroeDi } from './dati/eroi.js'
import { TASCHE, VITA_PER_PIANO } from './dati/mondo.js'
import { Corsa } from './motore/corsa.js'
import { rileggiRoba, ROBA_VUOTA, schedaConLaRoba, Corredo } from './motore/corredo.js'
import { prendi as prendiMissione, consegna as consegnaMissione, fatte as missioniFatte, presePer, promemoria,
         rotta as rottaDi, seguita, diario } from './motore/missioni.js'
import { Bottega } from './motore/bottega.js'
import { scrivi, leggi, dice, viaDi, PORTALE as VIA_PORTALE } from './motore/sosta.js'
import { avventuraDi, scriviNellAvventura, vintaNellAvventura, azzeraIlVecchio, ricordaIlFondo, cominciata }
  from './motore/avventure.js'
import { PORTALE } from './dati/terra-mappa.js'
import { iconaDi } from './dati/terra.js'
import { mercanteDi } from './dati/mercanti.js'
import { Tela } from './scena/tela.js'

import Campagna from './viste/Campagna.vue'
import Eroi from './viste/Eroi.vue'
import Foglio from './viste/Foglio.vue'
import Icona from './viste/Icona.vue'
import { occhio } from './viste/occhio.js'
import Scontro from './viste/Scontro.vue'
import Zaino from './viste/Zaino.vue'
import Diario from './viste/Diario.vue'
import BarraDiSotto from './viste/BarraDiSotto.vue'
import LaBottega from './viste/Bottega.vue'   // la bottega dei mercanti di sopra
import Fine from './viste/Fine.vue'
import LascioPerdere from './viste/LascioPerdere.vue'   // la frase chiara prima di buttare una discesa
import './stile.css'

defineOptions({ name: 'IlSotterraneo' })
const emit = defineEmits(['vai'])

const CHIAVE = 'sotterraneo'
// il dito si lascia dietro un click che va ingoiato (vedi giochi/fattoria)
const FANTASMA_MS = 100
const FANTASMA_PX = 32
const FERMO_PX = 16   // sotto i 16px Android/iOS considerano il dito ancora fermo

const tela = ref(null)
const corsa = shallowRef(null)
// indice della campagna, o INDICE_ABISSO (−1); null vuol dire nessuna discesa
const tappaIdx = ref(null)
const nellAbisso = computed(() => tappaIdx.value === INDICE_ABISSO)
const domanda = ref(null)
const fine = ref(null)
// un avviso è una riga sola; `dilloDi` porta anche la cosa, per mostrare la sua faccia vera invece di un'emoji
const avviso = ref(null)
const zainoAperto = ref(false)
const diarioGiu = ref(false)       // il diario delle missioni aperto dalla barra in basso
const mappaGrande = ref(false)     // la mappina aperta grande dalla barra (scena/tela.js, minimappa)
const colpito = ref(false)         // il globo della vita sobbalza a un colpo
const scosso = ref(0)
const tic = ref(0)                 // batte quando cambia qualcosa che si vede
// la corsa è uno shallowRef: niente computed a mano su quello che sta dentro (vedi viste/occhio.js)
const dallaCorsa = occhio(corsa, tic)
let ultimoModulo = null
let borsellino = borsa(CHIAVE)      // le monete di questa discesa, pagate a ogni risposta giusta
let pittore = null
let orologio = 0
let ultimoAvviso = 0

// i salvataggi di prima si azzerano, una volta: restano il record di fuori e l'eroe scelto (docs/sotterraneo/avventure.md)
ritocca(CHIAVE, c => ricordaIlFondo(c, state.profile.best?.sotFondo), { subito: true })
ritocca(CHIAVE, azzeraIlVecchio, { subito: true })

// la pausa (giochi/pausa.js): il ⏸, il telefono posato, il foglio del `?`, e anche il cartello di un
// traguardo (state.festa) — un mostro addosso mentre si guarda una medaglia è un colpo che nessuno vede.
// Non salva vite (a passi, non a riflessi): serve a fermarsi volendo senza uscire.
const { inPausa, fermo, metti, togli, aiuto } = usaPausa({ anche: () => !!fine.value })

// unico posto in cui ⏸ e velo hanno senso: dentro una discesa, senza una domanda (già un velo) e senza il cartello di fine
const siGioca = computed(() => !!corsa.value && !domanda.value && !fine.value)

// Ogni eroe ha la sua avventura (motore/avventure.js, docs/sotterraneo/avventure.md): cfg.eroe dice quale è
// aperta, e la prima volta la scelta si presenta da sé. Cambiare eroe è cambiare avventura, senza perdere niente
const chiEro = ref(scelta(CHIAVE, 'eroe', null))
const eroeQui = () => chiEro.value || DI_PARTENZA
// chi sta scendendo (corsa.io) comanda durante una discesa; fuori comanda la scelta (chiEro), che decide chi scenderà
const chiScende = dallaCorsa(c => c.io || null)
const eroeScheda = computed(() => chiScende.value || eroeDi(eroeQui()))
const scegliEroe = ref(!chiEro.value)

// l'avventura aperta, riletta dal profilo a ogni scrittura; ci si scrive solo da qui
const qui = computed(() => avventuraDi(progresso(CHIAVE), eroeQui()))
const nellAvventura = (campi, opz) => ritocca(CHIAVE, c => scriviNellAvventura(c, eroeQui(), campi), opz)

function scegli(k) {
  chiudiBottega()
  chiEro.value = ricorda(CHIAVE, 'eroe', k)
  scegliEroe.value = false
  suono.ok()
  nextTick(riprendiSeUscito)   // l'avventura scelta ha la discesa lasciata con la ✕? si riprende giù
}

// le quattro schede della scelta: a che punto è ognuna, o «nuova avventura». I numeri sono quelli con la roba
// addosso (schedaConLaRoba, gli stessi della discesa); un'avventura nuova ha lo zaino vuoto e quindi quelli di base
const avventure = computed(() => EROI.map(e => {
  const a = avventuraDi(progresso(CHIAVE), e.chiave)
  const r = rileggiRoba(a.roba) || ROBA_VUOTA()
  const n = schedaConLaRoba(e.chiave, r)
  const meta = dice(a.sosta, CAMPAGNA)
  return {
    ...e, nuova: !cominciata(a),
    vita: n.vita, att: n.att, dif: n.dif, tratti: n.tratti,
    mano: n.mano, mancina: n.mancina,
    discese: Math.min(a.tappa, QUANTE_TAPPE), quante: QUANTE_TAPPE,
    stelle: Object.values(a.stelle).reduce((n, s) => n + (Number(s) || 0), 0),
    // il resto della roba che si vede: l'arma e lo scudo sono già nelle mani del ritratto
    addosso: [n.corpo, n.dito].filter(k => k && COSE[k]).map(k => ({ chiave: k, ...COSE[k] })),
    gemme: r.gemme,
    fondo: (a.abisso && a.abisso.fondo) || 0,
    aMeta: meta ? meta.nome : null,
    aMetaIcona: meta ? iconaDi(meta.chiave) : null,
  }
}))

// La roba dell'avventuriero (motore/corredo.js), in cfg.avventure[eroe].roba: fra una discesa e l'altra non si
// riparte più nudi (docs/sotterraneo/la-roba-che-resta.md). Un'avventura nuova comincia con lo zaino vuoto
const roba = computed(() => rileggiRoba(qui.value.roba) || ROBA_VUOTA())

// la carta "riprendi" dice la sosta dell'avventura aperta (motore/sosta.js). Le gemme sono quelle della roba:
// sopra si può essere passati da un mercante
const conNome = d => (d ? { ...d, chi: d.eroe ? eroeDi(d.eroe).nome : '', gemme: roba.value.gemme,
                              immagine: iconaDi(d.chiave) } : null)
const ripresa = computed(() => conNome(dice(qui.value.sosta, CAMPAGNA)))
let ultimoSalvato = 0

// la roba e la sosta nello stesso giro: un telefono spento fra le due perderebbe quello che si è raccolto. Le
// missioni fatte giù (la cosa trovata, il mostro col nome) passano subito nell'avventura: sopra si consegnano
function salva({ subito = false, via } = {}) {
  const c = corsa.value
  if (!c || c.finita || tappaIdx.value == null) return
  ultimoSalvato = orologio
  nellAvventura({ roba: c.roba, sosta: scrivi(c, tappaIdx.value, { via }), ...fatteGiu(c) }, { subito })
}
function fatteGiu(c) {
  const n = c.missioniFatte.size ? missioniFatte(qui.value.missioni, [...c.missioniFatte]) : null
  return n ? { missioni: n } : {}
}

/* ═══════════ le missioni dei personaggi (motore/missioni.js) ═══════════
   Si prendono parlando con chi le dà (anche più insieme), si fanno giù (Corsa.missioni), si consegnano sopra: il
   premio va sulla roba dell'avventura, gemme o un gioiello, e a volte monete, che passano dalla borsa del gioco
   come ogni altra (docs/sotterraneo/missioni.md) */
const missioni = computed(() => qui.value.missioni || {})
// la missione che le freccine seguono, se nel diario ne è stata scelta una e quella è ancora presa
// (motore/missioni.js, seguita; docs/sotterraneo/missioni-freccina.md)
const segui = computed(() => seguita(missioni.value, qui.value.segui))
function seguiMissione(id) {
  nellAvventura({ segui: id && seguita(missioni.value, id) ? id : null }, { subito: true })
}
function azioneMissione(id, azione) {
  if (azione === 'prendi') {
    const n = prendiMissione(missioni.value, id, tappe.value)
    if (!n) return null
    nellAvventura({ missioni: n }, { subito: true })
    suono.ok()
    return 'presa'
  }
  const b = new Corredo({ eroe: eroeQui(), roba: roba.value })
  const r = consegnaMissione(missioni.value, id, b)
  if (!r) return null
  if (r.esito !== 'consegnata') { suono.no(); return { esito: r.esito, monete: 0 } }
  // la scelta di quale seguire cade con la missione consegnata
  nellAvventura({ missioni: r.stati, roba: b.roba, ...(qui.value.segui === id ? { segui: null } : {}) }, { subito: true })
  suono.livello()
  // le monete del regalo: quelle che il salvadanaio della varietà lascia passare, non una di più
  return { esito: 'consegnata', monete: r.monete ? borsa(CHIAVE).paga(r.monete) : 0 }
}

// la riga in cima a una discesa per ogni missione presa che la riguarda (motore/missioni.js, promemoria)
const ricordo = dallaCorsa(c => {
  const t = c.tappa
  return t && !t.abisso ? promemoria(missioni.value, t.chiave, c.piano + 1) : []
}, [])

function scorda() {
  nellAvventura({ sosta: null }, { subito: true })
}

// il portale: si sale al villaggio lasciando il piano com'è. La sosta è il portale aperto (`via: 'portale'`): sopra
// compare il gemello (viste/Terra.vue), e l'eroe sbuca accanto a lui. Uscire con la ✕ non è questo: lì la sosta è
// una 'uscita', senza gemello, e rientrando si riprende giù (docs/sotterraneo/portale-e-sosta.md, «Il portale e l'uscita»)
function salgoDalPortale() {
  const c = corsa.value
  if (!c || c.finita) return
  c.chiudi()
  salva({ subito: true, via: VIA_PORTALE })
  nellAvventura({ terra: { ...(qui.value.terra || {}), dove: [...PORTALE.accanto] } }, { subito: true })
  suono.nota(260, 880, 0.5, 'sine', 0.12)
  allaMappa()
}

// riprendere non è ricominciare: il piano si rifà dal seme, e sopra ci si rimette quello che era successo. Dalla
// carta in cima, da «riprendi da qui» e dal portale di sopra: è la stessa sosta. `ferma`: nasce dietro il velo
// della pausa e riparte al tocco (docs/core/ripresa.md), quando non c'è stato un tocco su «torno giù» a chiederlo
function riprendiDiscesa({ ferma = false } = {}) {
  const dato = qui.value.sosta
  const t = dato ? tappaDi(dato.tappa) : null
  const c = t ? leggi(dato, t, roba.value, presePer(missioni.value, t.chiave || '')) : null
  if (!c) { scorda(); return }
  togli()   // il telefono posato sulla mappa lascia acceso il freno, o si ritroverebbe dietro un velo non chiesto
  tappaIdx.value = dato.tappa
  fine.value = null
  domanda.value = null
  chiudiLaBarra()
  corsa.value = c
  borsellino = borsa(CHIAVE)
  suono.nota(180, 90, 0.4, 'sawtooth', 0.12)
  nextTick(() => accendi())
  if (ferma) metti()
}

// Uscire non è un portale: la discesa lasciata con la ✕ (o quella di prima, senza `via`) non passa dalla terra di
// sopra, e rientrando nel sotterraneo, da «riprendi da qui» come da un'altra porta, si è già giù, nel punto esatto.
// Il gemello e le spese sono del portale vero. La richiesta di «riprendi da qui» si consuma qui: se restasse in
// piedi, la prima volta che si risale dal portale la carta in cima ripartirebbe da sola
function riprendiSeUscito() {
  const s = qui.value.sosta
  if (!s || corsa.value || viaDi(s) === VIA_PORTALE) return
  prendiRipresa()
  riprendiDiscesa({ ferma: true })
}

/* ═══════════ la mappa delle tappe ═══════════ */
// quelle dell'avventura aperta: un eroe nuovo comincia dalla scalinata (l'età apre lo stesso quelle già passate)
const tappe = computed(() => {
  const a = qui.value
  return CAMPAGNA.map((t, i) => ({
    ...t, indice: i,
    aperta: aperta(CHIAVE, i, a.tappa),
    adesso: adesso(CHIAVE, i, a.tappa),
    stelle: a.stelle[i] || 0,
    perEta: chiusaPerEta(CHIAVE, i),
    fatta: i < a.tappa,
  }))
})

// la carta di chi scende, sulla mappa: vita, braccio e difesa con quello che ha addosso, e le gemme da spendere
const robaSopra = computed(() => schedaConLaRoba(eroeQui(), roba.value))

/* ═══════════ i mercanti di sopra (motore/bottega.js) ═══════════
   Il banco si pesca una volta per giro e si scrive nell'avventura (botteghe): un banco che cambiasse a ogni
   apertura sarebbe una slot machine. Il giro cambia quando una discesa finisce (chiudi); quanta roba c'è lo
   dicono le discese finite di quest'avventura */
const aperto = ref(null)          // la chiave del mercante col banco aperto
const tocco = ref(0)              // batte a ogni compra/vendi: la bottega non è reattiva
const dettoBanco = ref(null)
let bottega = null

function apriBottega(k) {
  if (!mercanteDi(k)) return
  bottega = new Bottega({ eroe: eroeQui(), roba: roba.value, finite: qui.value.tappa,
                          banchi: (qui.value.botteghe || {}).banchi })
  bottega.banco(k)
  nellAvventura({ botteghe: { banchi: bottega.banchi } })
  dettoBanco.value = null
  aperto.value = k
  tocco.value++
  suono.ok()
}
function chiudiBottega() { aperto.value = null; bottega = null }

const banco = computed(() => {
  tocco.value
  const k = aperto.value
  if (!k || !bottega) return null
  const b = bottega, m = mercanteDi(k)
  const voce = x => (x && COSE[x] ? { chiave: x, ...COSE[x] } : null)
  // quello peggiore di quello addosso non si mostra; i pezzi delle righe dopo (`avanti`) si comprano, a un prezzo più
  // alto (`costa`: il `prezzo` resta quello pieno, da cui si legge il gradino)
  const vendibili = b.mercanzia(k).filter(({ chiave: x, avanti }) => avanti || !b.sottoAddosso(x))
    .map(({ chiave: x, sempre, avanti }) => {
      const costa = b.quantoCosta(x)
      return {
        chiave: x, sempre, ...COSE[x], costa, avanti, posso: b.gemme >= costa,
        nonPuoi: b.perchéNo(x), prova: b.seLoMetto(x), va: b.vaAddosso(x),
        mancano: Math.max(0, costa - b.gemme),
        quante: b.quanteNeHo(x),
      }
    })
  return {
    chi: m,
    roba: vendibili,
    addosso: { mano: voce(b.mano), mancina: voce(b.mancina), corpo: voce(b.corpo), dito: voce(b.dito) },
    numeri: { vita: b.vitaConLaRoba, att: b.att, dif: b.dif, gemme: b.gemme },
    tasche: m.compra ? Array.from({ length: TASCHE }, (_, i) => {
      const y = b.zaino[i]
      return y ? { chiave: y, ...COSE[y], vale: b.quantoVale(y) } : null
    }) : null,
  }
})

function dopoIlBanco(e) {
  const a = bottega.avvisi.pop()
  bottega.avvisi = []
  if (a) dettoBanco.value = typeof a === 'string' ? { testo: a } : { ...(COSE[a.cosa] || {}), testo: a.testo }
  nellAvventura({ roba: bottega.roba, botteghe: { banchi: bottega.banchi } })
  tocco.value++
  return e
}
function compraSopra(x) {
  const e = dopoIlBanco(bottega.compraDa(aperto.value, x))
  if (e?.che === 'comprato') suono.compra(); else suono.no()
}
function vendiSopra(i) {
  const e = dopoIlBanco(bottega.vendiA(aperto.value, i))
  if (e) suoni.bottino()
}

// la terra di sopra si ricorda per avventura: la nebbia, dove si era, se il minatore ha già parlato
const ricordaTerra = v => nellAvventura({ terra: v })

const titolo = computed(() =>
  corsa.value ? tappaDi(tappaIdx.value).nome : 'Il sotterraneo')

// si apre su `libera` dell'avventura; il record sta nell'avventura (sopravvive alla sosta buttata) e non in
// `stelle`, che con una chiave per piano finirebbe in ogni persist() per sempre
const fondoDellAbisso = computed(() => (qui.value.abisso && qui.value.abisso.fondo) || 0)
const abisso = computed(() => (qui.value.libera
  ? { indice: INDICE_ABISSO, nome: L_ABISSO.nome, icona: L_ABISSO.icona,
      dritta: L_ABISSO.dritta, fondo: fondoDellAbisso.value }
  : null))

// si scrive scendendo e non solo alla fine: una discesa che dura tre sere non finisce quasi mai
function segnaIlFondo(piano) {
  if (!piano || piano <= fondoDellAbisso.value) return
  nellAvventura({ abisso: { fondo: piano } })
  segnaBest('sotFondo', piano)
}

const eroe = dallaCorsa(c => {
  const q = c.vita / Math.max(1, c.vitaMax)
  return {
    vita: c.vita, vitaMax: c.vitaMax, quota: q,
    att: c.att, dif: c.dif, gemme: c.gemme,
    piano: c.piano + 1, piani: c.senzaFondo ? null : c.quantiPiani,   // null nell'abisso: "piano 3 di ∞" non è un conto
    posto: c.posto,                   // nell'abisso: dove si è arrivati
    chiave: c.chiaveDelPiano,
    // niente quando non se ne ha nessuna; `quota` (0..1) sta qui e non nella vista, che riceve solo il numero
    torcia: c.torciaAccesa
      ? { resta: c.torciaResta, quota: c.torciaResta / (COSE.torcia.stanze || 1),
          scorta: c.torceInScorta, agliSgoccioli: c.torciaResta <= 3 && !c.torceInScorta }
      : null,
    pozioni: c.pozioni,               // le cure in tasca, sulla casella 🧪 della barra
  }
})

// il globo della vita sobbalza quando cala: un colpo preso si vede anche con gli occhi sul mostro
let colpitoFino = 0
watch(() => eroe.value && eroe.value.vita, (ora, prima) => {
  if (ora == null || prima == null || ora >= prima) return
  colpito.value = true
  clearTimeout(colpitoFino)
  colpitoFino = setTimeout(() => { colpito.value = false }, 380)
})

// sul diario della barra, quante missioni sono in mano (come il tasto 📖 di sopra)
const missioniAperte = computed(() => diario(missioni.value, tappe.value, segui.value).aperte)

// chi riapre il telefono dopo mezz'ora non sta guardando il gioco: "piano 2 di 3 · ❤️ 24" fa tornare in mente dov'era
const dovEravamo = dallaCorsa(c => `🕳️ piano ${c.piano + 1}`
  + (c.senzaFondo ? '' : ` di ${c.quantiPiani}`)
  + ` · ❤️ ${c.vita}`, '')

// il foglio aperto è sempre lo stesso oggetto: si guarda `c.foglio` per conto proprio, per svegliarsi quando cambia dentro
const foglio = dallaCorsa(c => c.foglio || null)

// il graffio esiste da sempre ma non si vedeva (suono di botta indistinguibile da uno sbaglio): il motore dice dato/preso
const scambio = ref(null)
let scambioFinoA = 0

// cambia a ogni risposta (le ossa restanti erano fatte una volta all'inizio, e restavano ferme)
const nemico = dallaCorsa(c => {
  const f = c.foglio
  if (!f || f.che !== 'scontro') return null
  const scheda = MOSTRI[f.chi.tipo] || {}
  return {
    mostro: f.chi, colpo: c.colpo(f.chi), restano: c.colpiPer(f.chi),
    sprite: scheda.sprite ? pezzoAndante(scheda.sprite, 'fermo', 0) : null,   // la stessa faccia del campo
    graffio: c.graffio(f.chi), male: c.danno(f.chi),   // detti PRIMA di rispondere: con questi si decide restare o scappare
    vita: c.vita, vitaMax: c.vitaMax,
  }
})

const pieni = dallaCorsa(c => c.zaino.length, 0)   // sei su sei vuol dire che la prossima cosa resta per terra

const zaino = dallaCorsa(c => {
  // `nonPuoi` la scrive il motore (perchéNo), che sa chi sta scendendo
  const voce = k => (k ? { chiave: k, ...COSE[k], nonPuoi: c.perchéNo(k), prova: c.seLoMetto(k) } : null)
  return {
    mano: voce(c.mano), mancina: voce(c.mancina),
    corpo: voce(c.corpo), dito: voce(c.dito),
    tasche: Array.from({ length: TASCHE }, (_, i) => voce(c.zaino[i])),
  }
})

const curiosita = dallaCorsa(c => {
  const f = c.foglio
  if (!f || f.che !== 'curiosita') return {}
  return CURIOSITA_DI[f.chi.tipo] || {}
}, {})

const segno = dallaCorsa(c => {
  const f = c.foglio
  return f && f.che === 'porta' ? SEGNI[f.chi.segno] : null
})

const suoni = {
  passo: () => suono.nota(320, 320, 0.05, 'sine', 0.06),
  colpo: () => suono.boom(),
  ahia: () => suono.no(),
  // un tonfo sordo, non suono.no(): rispondendo bene il graffio non può suonare come uno sbaglio
  graffio: () => suono.nota(200, 150, 0.09, 'triangle', 0.07),
  bottino: () => suono.moneta(),
  tesoro: () => suono.livello(),
}

// il seme dall'indirizzo (#seme=812), come gli altri cheat di casa: "riaprilo col seme 812" invece di "fidati"
function semeDallIndirizzo() {
  const n = Number(new URLSearchParams(location.hash.slice(1)).get('seme'))
  return Number.isFinite(n) && n > 0 ? n : null
}

// `#sotterraneo=roba` scende già equipaggiato, per guardare una schermata senza giocare mezza discesa
function corredoDaProva(c) {
  if (new URLSearchParams(location.hash.slice(1)).get('sotterraneo') !== 'roba') return
  c.mano = 'spada-di-ghiaccio'
  c.mancina = 'scudo-ferro'
  c.corpo = 'corazza'
  c.dito = 'teschio-cercatore'
  // le tre armature (mai visibili addosso) e i due gioielli: le cose che si vedono solo qui
  c.zaino = ['panciotto', 'manto', 'saio', 'amuleto-azzurro', 'pozione-grande', 'chiave']
  c.gemme += 120
  // due torce (una accesa, una di scorta): la seconda fa vedere anche il "+1" nella fascia in cima
  c.accendi('torcia')
  c.accendi('torcia')
  // stesso corredo per tutti e quattro: sistemaIlCorredo toglie quello che questa classe non porta, come al rientro
  c.sistemaIlCorredo()
}

// `#abisso=12` comincia già a quel piano, per guardare una schermata senza aspettare due sere di discesa
function pianoDaProva(c) {
  const n = Number(new URLSearchParams(location.hash.slice(1)).get('abisso'))
  if (!c.senzaFondo || !Number.isFinite(n) || n < 2) return
  c.piano = Math.floor(n) - 1
  c.vitaBase += VITA_PER_PIANO * c.piano
  c.vita = c.vitaBase
  c.nuovoPiano()
}

function avvia(i) {
  togli()          // vedi `riprendiDiscesa`: si scende, non si scende in pausa
  scorda()
  tappaIdx.value = i
  fine.value = null
  domanda.value = null
  chiudiLaBarra()
  corsa.value = new Corsa(tappaDi(i), { seme: semeDallIndirizzo(), eroe: eroeQui(), roba: roba.value,
                                        missioni: presePer(missioni.value, tappaDi(i).chiave) })
  borsellino = borsa(CHIAVE)
  corredoDaProva(corsa.value)
  pianoDaProva(corsa.value)
  suono.nota(180, 90, 0.4, 'sawtooth', 0.12)
  nextTick(() => accendi())
}

function accendi() {
  if (!tela.value || !corsa.value) return
  // il canvas di prima è stato smontato tornando alle discese: il pittore va riagganciato al nuovo
  if (!pittore) pittore = new Tela(tela.value)
  else pittore.attacca(tela.value)
  pittore.misura()
  pittore.segui(corsa.value.livello, corsa.value.eroe.x, corsa.value.eroe.y)
  pittore.mostra({ corsa: corsa.value, orologio })   // il primo quadro c'è subito: rientrando si nasce dietro il velo della pausa, e il giro non disegna finché si è fermi
  pittore.avvia()
  giro()
}

// il tempo lo tiene questo file, non il motore: passo(dt) è pura, e il banco può farla girare mille volte in un millisecondo
// misurato sul foglio vero (una quota fissa non funzionerebbe: una domanda disegnata è alta il doppio di due righe di
// testo); rilettura ogni sei fotogrammi perché è una misura del DOM. Lo scontro non c'entra: sta al centro, misura zero.
let altoFoglio = 0, contaGiri = 0
function misuraFoglio() {
  const f = document.querySelector('.sot-foglio')
  // il foglio sale dal fondo e copre prima la barra in basso, che sta già fuori dal campo
  const b = f && document.querySelector('[data-barra-giu]')
  altoFoglio = f ? Math.max(0, f.getBoundingClientRect().height - (b ? b.getBoundingClientRect().height : 0)) : 0
}

let raf = 0, prima = 0
function giro() {
  cancelAnimationFrame(raf)
  prima = performance.now()
  const passo = ora => {
    raf = requestAnimationFrame(passo)
    const dt = Math.min(0.05, (ora - prima) / 1000)
    prima = ora
    const c = corsa.value
    // `fermo` (giochi/pausa.js) vale uguale in tutti i giochi; il resto è roba del motore, in uno shallowRef che non avvisa
    if (!c || c.finita || fermo.value) return
    // l'orologio si muove DOPO: contarlo anche in pausa farebbe sparire all'istante la riga lasciata a metà
    orologio += dt
    c.passo(dt)
    // col foglio aperto la telecamera alza l'eroe (lo scontro no: sta al centro e non chiede spazio)
    if ((contaGiri++ % 6) === 0) misuraFoglio()
    // ogni tanto, non a ogni fotogramma: una discesa salvata sono un paio di chilobyte
    if (orologio - ultimoSalvato > 8) salva()
    pittore.segui(c.livello, c.eroe.x, c.eroe.y, altoFoglio)
    pittore.mostra({ corsa: c, orologio })
    posaLaRotta(c)
    guarda(c)
  }
  raf = requestAnimationFrame(passo)
}

/* ═══════════ la freccina verso la missione (motore/missioni.js, rotta) ═══════════
   Attorno all'eroe, nella direzione della missione presa più vicina: la cosa se è su questo piano, la scala se è
   più giù. Direzione e non strada, e non guarda la nebbia. Cosa cambia di rado (quale missione, 'qui' o 'scala')
   è reattivo; l'angolo e il posto si scrivono nel DOM a ogni fotogramma, come la terra di sopra */
const rotta = ref(null)
const rottaEl = ref(null)
let rottaChiave = ''
function posaLaRotta(c) {
  const r = rottaDi(c, segui.value)
  const chiave = r ? `${r.id}|${r.verso}` : ''
  if (chiave !== rottaChiave) { rottaChiave = chiave; rotta.value = r ? { id: r.id, verso: r.verso, nome: r.nome } : null }
  const el = rottaEl.value
  if (!r || !el) return
  const p = pittore.schermoDi(c.eroe.x, c.eroe.y - 0.25)
  el.style.transform = `translate(${Math.round(p.x)}px, ${Math.round(p.y)}px) rotate(${r.gradi}deg)`
  if (el.dataset.gradi !== String(r.gradi)) el.dataset.gradi = r.gradi
}

// un `tic` a ogni fotogramma ricalcolerebbe mezza schermata sessanta volte al secondo: si confronta una firma corta
let firma = ''
function guarda(c) {
  const f = `${c.vita}|${c.gemme}|${c.foglio ? c.foglio.che : '-'}|${c.chiesta ? c.chiesta.id : 0}` +
            `|${c.piano}|${c.zaino.length}|${c.chiaveDelPiano}|${c.finita}` +
            // tutte e quattro le caselle: uno scudo raccolto camminandoci sopra va nella mancina, un anello al dito
            `|${c.mano}|${c.mancina}|${c.corpo}|${c.dito}` +
            `|${c.torciaResta}|${c.torceInScorta}` +   // la torcia cala da sola, camminando
            `|${c.foglio ? c.foglio.cosa || '' : ''}|${c.livello.robe.length}`   // due cose trovate di fila hanno lo stesso `che`
  if (f !== firma) { firma = f; tic.value++ }
  if (c.avvisi.length) {
    const a = c.avvisi.shift()
    avviso.value = typeof a === 'string' ? { testo: a } : { ...a, ...(COSE[a.cosa] || {}) }
    ultimoAvviso = orologio
  } else if (avviso.value && orologio - ultimoAvviso > 1.8) avviso.value = null
  if (scambio.value && orologio > scambioFinoA) scambio.value = null
}

// `tic` è la dipendenza: la corsa è uno shallowRef, e senza il tic in cima questo watcher scatterebbe solo
// alla nascita di una corsa nuova — la domanda non comparirebbe mai, senza un errore da nessuna parte
watch(() => { tic.value; return corsa.value?.chiesta?.id }, (id) => {
  if (!id) { domanda.value = null; return }
  const chiesta = corsa.value.chiesta
  try {
    const q = domandaPerGioco({ difficolta: chiesta.difficolta, evita: ultimoModulo })
    if (!q?.domanda) throw new Error('nessun modulo di quiz')
    ultimoModulo = q.modulo
    domanda.value = q
  } catch (e) {
    // senza moduli non si blocca un bambino davanti a una porta: si apre e via
    domanda.value = null
    risolvi(true)
  }
})

function risposto({ giusto, saltata }) {
  domanda.value = null
  // rispondere È il tocco che riprende: il freno può essersi acceso durante la domanda
  togli()
  // una risposta giusta paga subito, nelle discese come nell'abisso: docs/sotterraneo/regole.md
  // (il tasto «salta» dei grandi dà la giusta ma non paga: docs/core/comandi.md)
  if (giusto && !saltata) borsellino.paga(PAGA.mossa)
  risolvi(giusto, saltata)
}

function risolvi(giusto, saltata = false) {
  const c = corsa.value
  if (!c) return
  const esito = c.rispondi(giusto, { saltata })
  tic.value++
  salva()
  if (!esito) return
  scosso.value++
  // resta a schermo un paio di secondi: il tempo di leggerlo mentre la domanda dopo si sta già montando
  if (esito.dato != null || esito.preso != null) {
    scambio.value = { dato: esito.dato || 0, preso: esito.preso || 0, caduto: esito.che === 'caduto' }
    scambioFinoA = orologio + 2.4
  }
  switch (esito.che) {
    case 'colpo': suoni.colpo(); if (esito.male) setTimeout(() => suoni.graffio(), 200); break
    case 'caduto': suoni.colpo(); setTimeout(() => suoni.bottino(), 260); break
    case 'ferito': suoni.ahia(); break
    case 'svenuto': suono.fine(); break
    case 'tesoro': suoni.tesoro(); break
    case 'curiosita': esito.buono ? suoni.tesoro() : suoni.graffio(); break
    case 'aperta': suono.ok(); break
    case 'bevuto': suoni.tesoro(); break
    default: suono.no()
  }
}

// scappare costa un graffio (Corsa.scappa), quindi può anche far svenire: il foglio che compare da solo lo dice
function scappa() {
  const e = corsa.value.scappa()
  domanda.value = null
  togli()          // stessa ragione di `risposto`: scappare è un tocco
  tic.value++
  if (e?.che === 'svenuto') suono.fine()
  else { suoni.graffio(); setTimeout(() => suoni.passo(), 160) }
  salva()
}
function chiudiFoglio() { corsa.value.chiudi(); domanda.value = null; tic.value++ }
// "riprovo" rimette in piedi all'ingresso, tranne all'ultima occasione dove riprendi() risale e la discesa è finita
function riprendi() {
  const c = corsa.value
  c.riprendi()
  tic.value++
  if (c.finita) chiudi()
}
function usa(i) { corsa.value.usa(i); tic.value++; suono.ok(); salva() }
function butta(i) { corsa.value.butta(i); tic.value++; suoni.passo(); salva() }
function riponi(dove) { corsa.value.riponi(dove); tic.value++; suono.ok(); salva() }

/* ═══════════ la barra in basso (viste/BarraDiSotto.vue, docs/sotterraneo/barra.md) ═══════════ */
// 🧪: un tocco beve, senza aprire lo zaino. Quale lo sceglie il motore (pozioneGiusta); in piena forma non si beve
function bevi() {
  const c = corsa.value
  if (!c || c.foglio || c.finita) return
  const i = c.pozioneGiusta()
  if (i == null) {
    c.dillo(c.pozioni ? '❤️ sei già in piena forma' : '🧪 non hai pozioni')
    tic.value++
    return
  }
  usa(i)
}
// una discesa nuova o ripresa nasce senza niente aperto sopra il campo
function chiudiLaBarra() {
  zainoAperto.value = false
  diarioGiu.value = false
  mappaGrande.value = false
}
// lo zaino e il diario si aprono uno alla volta, e chiudono la mappa grande
function apriDallaBarra(che) {
  mappaGrande.value = false
  zainoAperto.value = che === 'zaino'
  diarioGiu.value = che === 'diario'
}
watch(mappaGrande, g => { if (pittore) pittore.mappaGrande = g })
// un foglio che si apre (un mostro, una porta) chiude la mappa grande: si guarda quello
watch(foglio, f => { if (f) mappaGrande.value = false })

/* ═══════════ un tocco altrove chiude (docs/core/interfaccia.md) ═══════════
   Quello che si legge e basta si chiude toccando il campo, e quel tocco porta anche l'eroe dove si è toccato. Resta
   fermo solo quello che chiede una scelta senza cui non si va avanti: una domanda in corso, lo scontro, lo
   svenimento, il cartello di fine, «lascio perdere» */
const LEGGERI = new Set(['portale', 'chiusa', 'scala'])
// la scala che sale si chiude come quella che scende; dal primo piano è «lascio perdere», una scelta che costa
const leggero = f => LEGGERI.has(f.che) || (f.che === 'scala-su' && !f.fuori) || (f.che === 'curiosita' && !!f.esito)
// false se c'è un foglio che chiede una scelta: allora il campo non si tocca
function lasciaAndare() {
  const c = corsa.value
  if (c && c.foglio) {
    if (!leggero(c.foglio)) return false
    chiudiFoglio()
  }
  mappaGrande.value = false
  avviso.value = null
  return true
}
// lo zaino e il diario: il tocco sul velo li chiude, e se cade sul campo l'eroe ci va. Il click è quello del dito
// stesso, che finisce sul velo: dietro non arriva nessun fantasma
function toccoFuori(e) {
  zainoAperto.value = false
  diarioGiu.value = false
  const r = tela.value && tela.value.getBoundingClientRect()
  if (!r || !e || e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return
  if (!lasciaAndare()) return
  vai({ x: e.clientX - r.left, y: e.clientY - r.top }, true)
}
// la bottega di sopra: chiusa dal tocco fuori, il tocco passa alla terra (viste/Terra.vue, toccoDaFuori)
const campagnaEl = ref(null)
function fuoriDallaBottega(e) {
  chiudiBottega()
  if (campagnaEl.value && e) campagnaEl.value.toccoDaFuori(e.clientX, e.clientY)
}

function scendi() {
  const e = corsa.value.scendi()
  tic.value++
  if (e?.che === 'finita') return chiudi()
  suono.livello()
  if (nellAbisso.value) segnaIlFondo(corsa.value.piano + 1)
  salva()          // un piano nuovo è il momento in cui si perde di più
}

// la scala che sale: si torna al piano di sopra, accanto alla scala da cui si era scesi (docs/sotterraneo/scala-che-sale.md).
// Dal primo piano non si sale da qui: il foglio è quello di «lascio perdere», l'unica strada su senza portale
function sali() {
  const e = corsa.value.sali()
  tic.value++
  if (!e) return
  suono.livello()
  salva()
}

// `senzaCartello`: si lascia perdere la discesa dal velo della pausa — si risale con la roba (la regola) e si
// dice una volta sola, nel foglio di prima, quello che si perde: niente cartello di fine
function chiudi({ senzaCartello = false } = {}) {
  const c = corsa.value
  if (!c) return
  if (!c.finita) c.risali()
  // la roba viene su (vinta, persa o finita la sera): quello che è rimasto per terra resta giù. Un giro nuovo: i
  // mercanti hanno roba nuova sul banco
  nellAvventura({ roba: c.roba, botteghe: null, ...fatteGiu(c) })
  const e = c.esito
  const stelle = stelleDella(e)
  // l'abisso non si butta (finisce la sera, non la discesa): si scrive il punto da cui si rientra
  const eraIlFondo = fondoDellAbisso.value   // il record DI PRIMA: segnaIlFondo lo sposta subito dopo
  if (nellAbisso.value) {
    segnaIlFondo(e.fondo)
    // risalito per stasera: è sopra, con la strada per tornare giù (il gemello), come dopo un portale
    nellAvventura({ sosta: scrivi(c, INDICE_ABISSO, { anchePerFinite: true, via: VIA_PORTALE }) }, { subito: true })
  } else scorda()

  // prima l'avanzamento, poi i contatori: i traguardi in segna() devono vedere la tappa già segnata come fatta.
  // Due conti: quello dell'avventura, e fuori il massimo fra le avventure (completa tiene il più alto), che è
  // quello che leggono medaglie, esperienza e home: un altro eroe che rifà la scalinata non lo ridà
  if (e.vinta) {
    ritocca(CHIAVE, c => vintaNellAvventura(c, eroeQui(), tappaIdx.value, QUANTE_TAPPE, stelle))
    completa(CHIAVE, tappaIdx.value, QUANTE_TAPPE, { stelle })
  }

  segna('sotStanze', e.stanze)
  segna('sotPiani', e.piani)
  if (e.mostri) segna('sotMostri', e.mostri)
  if (e.tesori) segna('sotTesori', e.tesori)
  segnaBest('sotGemme', e.gemme)

  // niente premio di fine discesa: ogni risposta giusta si è già pagata (risposto), qui si dice il totale
  if (e.vinta) { if (e.svenimenti === 0) segna('sotInteri'); suono.livello() } else if (!senzaCartello) suono.fine()
  if (senzaCartello) return allaMappa()

  fine.value = { vinta: e.vinta, titolo: tappaDi(tappaIdx.value).nome, stelle, fatti: e,
                 monete: borsellino.dato, notaMonete: borsellino.nota(),
                 abisso: nellAbisso.value, record: e.fondo > eraIlFondo }
}

function ancora() {
  const vinta = fine.value.vinta
  // dall'abisso si torna alla mappa: "ci riprovo" ricomincerebbe dal piano 1, buttando quello appena salvato
  const allaFila = vinta || fine.value.abisso
  fine.value = null
  if (allaFila) return allaMappa()
  avvia(tappaIdx.value)
}

function allaMappa() {
  cancelAnimationFrame(raf)
  togli()
  if (pittore) pittore.ferma()
  fine.value = null
  domanda.value = null
  corsa.value = null
  chiudiLaBarra()
}

// uscire a metà non chiude la discesa: si scrive dove si era. Si salva SEMPRE, anche dopo due passi: quello che si
// perde non sono le gemme, è la mappa già girata (docs/sotterraneo/portale-e-sosta.md). E si esce DAVVERO, in home: la ✕ non
// è un portale, e la terra di sopra con i suoi mercanti non è dietro l'angolo per chi finge di uscire. Rientrando si
// è già giù (riprendiSeUscito). Finita la discesa (il cartello di fine) la ✕ porta alla mappa, com'è giusto
function indietro() {
  if (!corsa.value && !fine.value) return emit('vai', 'home')
  const c = corsa.value
  if (c && !c.finita && !fine.value) {
    salva({ subito: true })
    return emit('vai', 'home')
  }
  allaMappa()
}

// «lascio perdere questa discesa» dal velo della pausa: si risale sulla terra di sopra con la roba che si ha
// addosso e nello zaino, ma la discesa ricomincia da capo. Il foglio lo dice prima (viste/LascioPerdere.vue).
// Nell'abisso no: là la strada su è il portale, e il piano raggiunto è il record
const perdendo = ref(false)
function lascioPerdere() {
  perdendo.value = false
  if (!corsa.value || corsa.value.finita || nellAbisso.value) return
  chiudi({ senzaCartello: true })
}

// Cambiare eroe da dentro una discesa: dalla terra di sopra non si può più (uscire non porta di sopra), e senza
// questo chi ha lasciato la discesa di un eroe non potrebbe giocare con un altro senza buttarla. La discesa si salva
// com'è e si apre la scelta; chiuderla senza scegliere riporta giù (chiudiLaScelta)
function cambioEroeDaGiu() {
  const c = corsa.value
  if (!c || c.finita) return
  salva({ subito: true })
  allaMappa()
  scegliEroe.value = true
}
function chiudiLaScelta() {
  scegliEroe.value = false
  nextTick(riprendiSeUscito)
}

/* ═══════════ il dito ═══════════ */
const dita = new Map()
let pizzico = 0, premuto = false, giu = null, ultimoTrascina = 0

function punto(e) {
  const r = tela.value.getBoundingClientRect()
  return { x: e.clientX - r.left, y: e.clientY - r.top }
}

function premi(e) {
  dita.set(e.pointerId, e)
  if (zainoAperto.value || diarioGiu.value || fine.value) return
  // un foglio da leggere, la mappa grande, un avviso: il tocco li chiude e intanto cammina
  if (!lasciaAndare()) return
  if (dita.size > 1) { premuto = false; return }
  premuto = true
  giu = { x: e.clientX, y: e.clientY }
  tela.value.setPointerCapture?.(e.pointerId)
  vai(punto(e), true)
}

// trascinando, l'eroe insegue il dito senza toccare quaranta volte; ricalcolato di rado, o il percorso tremerebbe
function muovi(e) {
  if (dita.has(e.pointerId)) dita.set(e.pointerId, e)
  if (dita.size === 2) return pizzica()
  if (!premuto || corsa.value?.foglio) return
  if (giu && Math.hypot(e.clientX - giu.x, e.clientY - giu.y) < FERMO_PX) return
  const ora = performance.now()
  if (ora - ultimoTrascina < 140) return
  ultimoTrascina = ora
  vai(punto(e), false)
}

function pizzica() {
  premuto = false                                   // due dita non camminano
  const [a, b] = [...dita.values()]
  const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
  if (!pizzico) { pizzico = d; return }
  if (Math.abs(d - pizzico) < 45) return
  if (pittore.zoomA(pittore.scala + (d > pizzico ? 1 : -1))) suoni.passo()
  pizzico = d
}

function lascia(e) {
  if (e.pointerType !== 'mouse') zittisciIlFantasma(e.clientX, e.clientY)
  dita.delete(e.pointerId)
  if (dita.size < 2) pizzico = 0
  premuto = false
  giu = null
}

function zittisciIlFantasma(x, y) {
  const t0 = performance.now()
  const smetti = () => removeEventListener('click', zitto, true)
  const zitto = ev => {
    if (performance.now() - t0 > FANTASMA_MS) return smetti()
    if (Math.hypot(ev.clientX - x, ev.clientY - y) > FANTASMA_PX) return
    ev.stopPropagation(); ev.preventDefault(); smetti()
  }
  addEventListener('click', zitto, true)
  setTimeout(smetti, FANTASMA_MS + 20)
}

function vai(p, preciso) {
  const c = corsa.value
  if (!c || c.finita) return
  c.vaiVerso(pittore.cellaDa(p.x, p.y), preciso)
  tic.value++
}

function rotella(e) {
  if (!pittore) return
  pittore.zoomA(pittore.scala + (e.deltaY < 0 ? 1 : -1))
}

function nienteClickDalCampo(e) { if (e.cancelable) e.preventDefault() }

// su un telefono l'app non si chiude, sparisce: visibilitychange è l'ultimo momento per scrivere.
// giochi/pausa.js ferma la discesa ascoltando lo stesso evento: qui resta solo la scrittura
function seSparisce(e) {
  if (e?.type === 'pagehide' || document.visibilityState === 'hidden') salva({ subito: true })
}

// rientrando con la discesa lasciata con la ✕ si nasce già giù: decisa qui, prima del primo disegno, perché la carta
// della terra di sopra (che alla richiesta di «riprendi da qui» parte da sola) non faccia in tempo a nascere
if (!scegliEroe.value) riprendiSeUscito()

onMounted(() => {
  if (corsa.value) nextTick(accendi)   // la tela esiste solo adesso
  addEventListener('resize', ridimensiona)
  // `visibilitychange` si ascolta sul document (dove viene lanciato); `pagehide` è della finestra
  document.addEventListener('visibilitychange', seSparisce)
  addEventListener('pagehide', seSparisce)
})
onUnmounted(() => {
  salva({ subito: true })
  removeEventListener('resize', ridimensiona)
  document.removeEventListener('visibilitychange', seSparisce)
  removeEventListener('pagehide', seSparisce)
  cancelAnimationFrame(raf)
  if (pittore) pittore.ferma()
})
function ridimensiona() { if (pittore) pittore.misura() }
</script>

<template>
  <div class="schermo">
    <!-- il ⏸ solo dentro una discesa: sulla mappa non c'è niente da fermare -->
    <Barra :titolo="titolo" guida="sotterraneo" @aiuto="aiuto" :monete="!corsa" scura
           :pausa="siGioca" @pausa="metti()" @indietro="indietro">
      <!-- vita, gemme e zaino stanno nella barra in basso; qui restano i due numeri che decidono uno scontro -->
      <button v-if="corsa && eroe" class="sot-io" data-azione="zaino-barra"
              aria-label="lo zaino" @click="apriDallaBarra('zaino')">
        <span class="sot-n em">⚔️<b>{{ eroe.att }}</b></span>
        <span class="sot-n em">🛡️<b>{{ eroe.dif }}</b></span>
      </button>
    </Barra>

    <div class="sot">
      <template v-if="!corsa">
        <!-- la chiave è l'eroe: cambiando avventura la terra di sopra rinasce con la nebbia e il posto suoi -->
        <Campagna ref="campagnaEl" :key="eroeQui()" :tappe="tappe" :ripresa="ripresa" :eroe="eroeScheda" :abisso="abisso"
                  :roba="robaSopra" :terra="qui.terra || null" @terra="ricordaTerra"
                  :missioni="missioni" :azione-missione="azioneMissione" :segui="segui" @segui="seguiMissione"
                  @gioca="avvia" @riprendi="riprendiDiscesa" @scorda="scorda"
                  @eroe="scegliEroe = true" @bottega="apriBottega" />
        <!-- la bottega di un mercante di sopra: quasi a tutto schermo, la ✕ in alto a destra, niente domande.
             La chiave è il mercante: le linguette e la scelta ripartono da capo cambiando bottega -->
        <LaBottega v-if="banco" :key="banco.chi.chiave" v-bind="banco" :eroe="eroeScheda" :detto="dettoBanco"
                  chi-compra="al rigattiere, vicino al carro"
                  @compra="compraSopra" @vendi="vendiSopra" @chiudi="chiudiBottega" @fuori="fuoriDallaBottega" />
        <Eroi v-if="scegliEroe" :avventure="avventure" :scelto="chiEro || ''" :primo="!chiEro"
              @scegli="scegli" @chiudi="chiudiLaScelta" />
      </template>

      <template v-else>
        <div class="sot-campo">
          <!-- il campo si tocca coi puntatori: il click che il dito lascia finirebbe sul foglio appena aperto -->
          <canvas ref="tela" class="sot-tela"
                  @pointerdown="premi" @pointermove="muovi" @pointerup="lascia"
                  @pointercancel="lascia" @touchend="nienteClickDalCampo"
                  @wheel.prevent="rotella"></canvas>

          <!-- le missioni prese che riguardano questa discesa: una riga ciascuna, in cima (motore/missioni.js) -->
          <ul v-if="ricordo.length" class="sot-ricordo" data-promemoria>
            <li v-for="r in ricordo" :key="r.id" :data-missione="r.id" :data-dove="r.dove"
                :data-segui="rotta && rotta.id === r.id ? 1 : null">
              <span class="em">{{ r.em }}</span> {{ r.testo }}
            </li>
          </ul>

          <!-- la freccina verso la missione: attorno all'eroe, non si tocca (il campo sotto sì) -->
          <div v-if="rotta && !foglio && !zainoAperto" ref="rottaEl" class="sot-rotta" data-rotta
               :data-verso="rotta.verso" :data-missione-rotta="rotta.id" :aria-label="'Verso ' + rotta.nome">
            <i></i>
          </div>

          <p class="sot-piede" :data-posto="eroe.posto || ''">
            <template v-if="eroe.posto">{{ eroe.posto }} · </template>piano {{ eroe.piano }}<template v-if="eroe.piani"> di {{ eroe.piani }}</template> ·
            <span v-if="eroe.chiave" class="em">🗝️ la scala è aperta</span>
            <span v-else>la chiave ce l'ha qualcuno, qua sotto</span>
          </p>
          <p v-if="avviso" class="sot-avviso">
            <Icona v-if="avviso.cosa" :sprite="avviso.sprite" :em="avviso.em" :emAlto="20" />
            {{ avviso.testo }}
          </p>
        </div>

        <!-- la barra in basso, come in Diablo: la vita e la luce nei globi, le caselle in mezzo. I fogli le salgono
             sopra (docs/sotterraneo/barra.md) -->
        <BarraDiSotto :vita="eroe.vita" :vita-max="eroe.vitaMax" :colpito="colpito" :torcia="eroe.torcia"
                      :pozioni="eroe.pozioni" :pieni="pieni" :tasche="TASCHE" :gemme="eroe.gemme"
                      :missioni="missioniAperte" :mappa="mappaGrande"
                      @bevi="bevi" @zaino="apriDallaBarra('zaino')" @diario="apriDallaBarra('diario')"
                      @mappa="mappaGrande = !mappaGrande" />

        <!-- lo scontro sta al centro, non sale dal basso: un mostro addosso arriva mentre si cammina, e in
             fondo allo schermo chi guarda il proprio eroe non lo vedrebbe. Niente classe `sot-foglio`
             apposta: `misuraFoglio()` cerca quella, e non trovandola la telecamera non fa spazio a un pannello -->
        <div v-if="foglio && foglio.che === 'scontro'" class="sot-velo">
          <div class="sot-modale">
            <Scontro v-bind="nemico" :scosso="scosso" :scambio="scambio" />
            <div v-if="domanda" class="sot-domanda">
              <Domanda :domanda="domanda.domanda" :pittori="domanda.pittori"
                       :origine="domanda" gioco="sotterraneo" :respiro="900"
                       @risposto="risposto" />
            </div>
            <!-- il costo sta sul tasto: si vede prima, non nell'avviso che arriva dopo -->
            <button class="sot-grosso sot-chiaro" data-azione="scappa" @click="scappa">
              <span class="em">🏃</span> scappo via
              <small v-if="nemico">ti graffia ❤️ −{{ nemico.graffio }}</small>
            </button>
          </div>
        </div>

        <Foglio v-else-if="foglio && foglio.che === 'porta'" em="🚪" titolo="Una porta chiusa"
                :dice="segno ? segno.em + ' ' + segno.dice : ''">
          <div v-if="domanda" class="sot-domanda">
            <Domanda :domanda="domanda.domanda" :pittori="domanda.pittori"
                     :origine="domanda" gioco="sotterraneo" :respiro="900"
                     @risposto="risposto" />
          </div>
          <button class="sot-grosso sot-chiaro" data-azione="dopo" @click="chiudiFoglio">
            ci torno dopo
          </button>
        </Foglio>

        <!-- il forziere di una missione dice cosa c'è dentro, e non si perde: sbagliando si riprova -->
        <Foglio v-else-if="foglio && foglio.che === 'forziere'" :em="foglio.chi.missione ? foglio.chi.em : '🎁'"
                :titolo="foglio.chi.missione ? foglio.chi.nome : 'Un forziere'" :data-missione="foglio.chi.missione || null"
                :dice="foglio.chi.missione ? 'È quello che cercavi. Rispondi giusto e lo prendi; se sbagli, riprovi.'
                                           : 'Una domanda sola. Se la sbagli, resta chiuso per sempre.'">
          <div v-if="domanda" class="sot-domanda">
            <Domanda :domanda="domanda.domanda" :pittori="domanda.pittori"
                     :origine="domanda" gioco="sotterraneo" :respiro="900"
                     @risposto="risposto" />
          </div>
          <button class="sot-grosso sot-chiaro" data-azione="dopo" @click="chiudiFoglio">
            non me la sento
          </button>
        </Foglio>

        <Foglio v-else-if="foglio && foglio.che === 'fonte'" em="⛲" titolo="Una fonte"
                dice="Acqua pulita. Rispondi e bevi.">
          <div v-if="domanda" class="sot-domanda">
            <Domanda :domanda="domanda.domanda" :pittori="domanda.pittori"
                     :origine="domanda" gioco="sotterraneo" :respiro="900"
                     @risposto="risposto" />
          </div>
          <button class="sot-grosso sot-chiaro" data-azione="dopo" @click="chiudiFoglio">
            più tardi
          </button>
        </Foglio>

        <!-- una curiosità: prima la domanda (si risponde o si lascia perdere), poi la battuta, che un tocco sul campo
             chiude mentre l'eroe cammina (`leggero`) -->
        <Foglio v-else-if="foglio && foglio.che === 'curiosita'"
                :em="curiosita.em" :sprite="curiosita.pezzo"
                :titolo="curiosita.nome"
                :dice="foglio.esito ? '' : curiosita.dice + ' Può andare bene, o male.'">
          <template v-if="foglio.esito">
            <p class="sot-storia">{{ foglio.esito.dice }}</p>
            <p v-if="foglio.esito.conto" class="sot-cambio em"
               :class="{ 'sot-meglio': foglio.esito.buono }">{{ foglio.esito.conto }}</p>
            <button class="sot-grosso" data-azione="avanti" @click="chiudiFoglio">
              vado avanti
            </button>
          </template>
          <template v-else>
            <div v-if="domanda" class="sot-domanda">
              <Domanda :domanda="domanda.domanda" :pittori="domanda.pittori"
                       :origine="domanda" gioco="sotterraneo" :respiro="900"
                       @risposto="risposto" />
            </div>
            <button class="sot-grosso sot-chiaro" data-azione="dopo" @click="chiudiFoglio">
              lascio perdere
            </button>
          </template>
        </Foglio>

        <!-- il portale: niente domanda, è la strada di casa; il piano resta com'è -->
        <Foglio v-else-if="foglio && foglio.che === 'portale'" em="🌀" titolo="Un portale"
                dice="Torni su al villaggio, e ritrovi il portale per tornare qui.">
          <button class="sot-grosso" data-azione="portale" @click="salgoDalPortale">
            salgo al villaggio
          </button>
          <button class="sot-grosso sot-chiaro" data-azione="dopo" @click="chiudiFoglio">
            resto qui
          </button>
        </Foglio>

        <Foglio v-else-if="foglio && foglio.che === 'chiusa'" em="🔒" titolo="La scala è chiusa"
                :dice="foglio.visto && foglio.chi
                  ? `Un cancello di ferro. La chiave ce l'ha ${foglio.chi.nome.toLowerCase()}, ed è segnato in oro sulla mappina.`
                  : 'Un cancello di ferro, e la serratura non ha buco per le dita. La chiave ce l\'ha qualcuno, qua sotto.'">
          <button class="sot-grosso" data-azione="cerca" @click="chiudiFoglio">
            vado a cercarla
          </button>
        </Foglio>

        <Foglio v-else-if="foglio && foglio.che === 'scala'" em="🕳️" titolo="La scala che scende"
                :dice="foglio.ultimo
                  ? 'Da qui si risale, e quello che hai addosso e in tasca viene su con te.'
                  : 'Sotto è più buio, i mostri hanno più ossa e le domande si fanno toste. Quello che hai addosso scende con te.'">
          <button class="sot-grosso" data-azione="scendi" @click="scendi">
            {{ foglio.ultimo ? 'esco dal sotterraneo' : `scendo al piano ${eroe.piano + 1}` }}
          </button>
          <button class="sot-grosso sot-chiaro" data-azione="dopo" @click="chiudiFoglio">
            prima giro ancora
          </button>
        </Foglio>

        <!-- la scala che sale: dal primo piano è la strada del «lascio perdere» (stesso foglio, stesse parole) -->
        <LascioPerdere v-else-if="foglio && foglio.che === 'scala-su' && foglio.fuori" :nome="titolo" giu
                       @si="lascioPerdere" @no="chiudiFoglio" />
        <Foglio v-else-if="foglio && foglio.che === 'scala-su'" em="🪜" titolo="La scala che sale"
                dice="Torni al piano di sopra, accanto alla scala da cui eri sceso. Quello che hai lasciato là resta com'è.">
          <button class="sot-grosso" data-azione="sali" @click="sali">
            {{ `risalgo al piano ${eroe.piano - 1}` }}
          </button>
          <button class="sot-grosso sot-chiaro" data-azione="dopo" @click="chiudiFoglio">
            resto qui
          </button>
        </Foglio>

        <!-- svenuto: finché ci sono occasioni si dice quante ne restano; svenendo si perdono le tasche e metà
             gemme, quello addosso mai, e nell'abisso la discesa non ricomincia da capo (docs/sotterraneo/regole.md) -->
        <Foglio v-else-if="foglio && foglio.che === 'svenuto'" em="💫"
                :titolo="foglio.ultimo && !nellAbisso ? 'Non ti reggi più in piedi'
                         : foglio.ultimo ? 'Per stasera basta' : 'Ti sei svegliato all\'ingresso'"
                :dice="nellAbisso && foglio.ultimo
                  ? 'Ti hanno portato su, con quello che hai addosso. L\'abisso resta dov\'è: ci si rientra da questo piano.'
                  : foglio.ultimo
                    ? 'Ti hanno portato su, con quello che hai addosso. Il sotterraneo resta lì: questa discesa ricomincia da capo.'
                    : 'Qualcuno ti ha trascinato all\'ingresso. Le tasche si sono svuotate e metà delle gemme non c\'è più, ma quello che avevi addosso sì.'">
          <p v-if="!foglio.ultimo" class="sot-storia">
            Ancora <b>{{ foglio.restano }}</b>
            {{ foglio.restano === 1 ? 'volta' : 'volte' }}, poi si risale.
          </p>
          <button class="sot-grosso" data-azione="riprendi" @click="riprendi">
            {{ !foglio.ultimo ? 'riprovo' : nellAbisso ? 'torno su per stasera' : 'torno su' }}
          </button>
        </Foglio>

        <!-- lo zaino al centro, nella cornice della bottega: dal basso sembrava un'appendice del campo -->
        <Zaino v-else-if="zainoAperto" v-bind="zaino" :eroe="eroeScheda" :torcia="eroe.torcia"
               :att="eroe.att" :dif="eroe.dif" :gemme="eroe.gemme"
               :vita="eroe.vita" :vitaMax="eroe.vitaMax"
               :piano="eroe.piano" :piani="eroe.piani"
               @usa="usa" @butta="butta" @riponi="riponi"
               @chiudi="zainoAperto = false" @fuori="toccoFuori" />

        <!-- il diario delle missioni, giù: lo stesso di sopra, senza «vai da» (chi aspetta sta sopra) -->
        <Diario v-else-if="diarioGiu" giu :stati="missioni" :tappe="tappe" :segui="segui"
                @chiudi="diarioGiu = false" @segui="seguiMissione" @fuori="toccoFuori" />

        <Fine v-if="fine" v-bind="fine" @ancora="ancora" @esci="allaMappa" />
      </template>

      <!-- sta in fondo e fuori da tutto: la domanda e il cartello di fine hanno già la loro pausa -->
      <VeloPausa v-if="inPausa && siGioca && !perdendo" :dove="dovEravamo" @riprendi="togli" @esci="indietro">
        <!-- da qui si può anche cambiare eroe, o lasciar perdere la discesa e risalire; nell'abisso la strada su è il portale -->
        <button type="button" class="sot-lascia" data-azione="eroe-giu" @click.stop="cambioEroeDaGiu">
          scelgo un altro eroe
        </button>
        <button v-if="!nellAbisso" type="button" class="sot-lascia" data-azione="lascia-discesa" @click.stop="perdendo = true">
          lascio perdere questa discesa
        </button>
      </VeloPausa>
      <LascioPerdere v-if="perdendo && siGioca" :nome="titolo" giu @si="lascioPerdere" @no="perdendo = false" />
    </div>
  </div>
</template>
