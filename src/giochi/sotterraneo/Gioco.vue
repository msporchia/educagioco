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
import { progresso, aperta, adesso, completa, scelta, ricorda, ritocca } from '../campagne.js'
import { usaPausa, CIECA } from '../pausa.js'
import { prendiRipresa } from '../ripresa.js'
import VeloPausa from '../VeloPausa.vue'
import { domandaPerGioco } from '../../quiz/scelta.js'
import Domanda from '../../quiz/Domanda.vue'

import { CAMPAGNA, QUANTE_TAPPE, stelleDella, L_ABISSO, INDICE_ABISSO } from './dati/campagna.js'
import { inPaesaggio } from './dati/paesaggi.js'
import { COSE, PERGAMENE_MASSIME } from './dati/cose.js'
import { CURIOSITA_DI } from './dati/curiosita.js'
import { EROI, DI_PARTENZA, eroeDi } from './dati/eroi.js'
import { TASCHE, VITA_PER_PIANO, POZIONI_MASSIME } from './dati/mondo.js'
import { Corsa } from './motore/corsa.js'
import { rileggiRoba, ROBA_VUOTA, schedaConLaRoba, Corredo, tascheDello, postiDello, eCura } from './motore/corredo.js'
import { rileggiCrescita, puntiDaDare, dai as daiPunto, livelloDella, crescitaA, trattoDegliElisir } from './motore/crescita.js'
import { robaAttesa } from './motore/storia.js'
import { puntiAbilita, caselleDella, gradoDi } from './motore/abilita.js'
import { NODI, RAMI, preparabile } from './dati/abilita.js'
import { zonaDi } from './dati/zone.js'
import { notiziaDi, potenzaDi, livelloDellaZona, coloreDi, zoneConForza, zoneConSentita } from './motore/zone.js'
import { forzaDi, forzaDelCorredo } from './motore/forza.js'
import { pescaLeggendario } from './motore/bottino.js'
import { quotaDi } from './dati/livelli.js'
import { LEGGENDARI } from './dati/pezzi.js'
import { prendi as prendiMissione, consegna as consegnaMissione, fatte as missioniFatte, presePer, promemoria,
         rotta as rottaDi, seguita, diario, dopoLaMissione } from './motore/missioni.js'
import { ultimoPostoSicuro } from './motore/posto-sicuro.js'
import { Bottega, alGiroNuovo, robaRaraDi } from './motore/bottega.js'
import { scrivi, leggi, dice, viaDi, forzeDi, PORTALE as VIA_PORTALE } from './motore/sosta.js'
import { avventuraDi, scriviNellAvventura, vintaNellAvventura, azzeraIlVecchio, ricordaIlFondo, cominciata }
  from './motore/avventure.js'
import { iconaDi } from './dati/terra.js'
import { mercanteDi, schedeDi } from './dati/mercanti.js'
import { Tela } from './scena/tela.js'
import { situazioneDi, scegli as scegliPensiero, ricorda as ricordaPensiero, entraNelGiro, giroDi } from './motore/pensieri.js'
import { RITMO } from './dati/pensieri.js'
import { usaGuida } from '../guida.js'

import Campagna from './viste/Campagna.vue'
import Eroi from './viste/Eroi.vue'
import Foglio from './viste/Foglio.vue'
import Icona from './viste/Icona.vue'
import { occhio } from './viste/occhio.js'
import Scontro from './viste/Scontro.vue'
import Scontro3d from './viste/Scontro3d.vue'
import Pannello3d from './viste/Pannello3d.vue'
import { nuovoRacconto, modoDelColpo } from './viste/racconto.js'
import { vistaDelloScontro, incantiAddosso } from './viste/campo.js'
import Zaino from './viste/Zaino.vue'
import ScegliPozione from './viste/ScegliPozione.vue'
import Diario from './viste/Diario.vue'
import BarraDiSotto from './viste/BarraDiSotto.vue'
import Preparati from './viste/Preparati.vue'
import PaginaEroe from './viste/PaginaEroe.vue'
import PaginaAbilita from './viste/PaginaAbilita.vue'
import CaselleAbilita from './viste/CaselleAbilita.vue'
import Medaglione from './viste/Medaglione.vue'
import Cornice from './viste/Cornice.vue'
import Tesori from './viste/Tesori.vue'
import Grosso from './viste/Grosso.vue'
import LaBottega from './viste/Bottega.vue'   // la bottega dei mercanti di sopra
import Fine from './viste/Fine.vue'
import LascioPerdere from './viste/LascioPerdere.vue'   // la frase chiara prima di buttare una discesa
import './stile.css'
import './stile-scontro.css'
import './stile-effetti.css'
import './tema/legno.css'
import './tema/barra.css'
import './tema/rilievo.css'
import { usaTema, ATTRIBUTO } from './tema/tema.js'

defineOptions({ name: 'IlSotterraneo' })
const emit = defineEmits(['vai'])
// `disegno: '3d'`: il Sotterraneo 3D dei giochi in prova (Gioco3d.vue), stessa avventura e stessa sosta; la discesa la disegna
// scena3d/ invece di scena/tela.js. Senza, il Sotterraneo di sempre (docs/sotterraneo/grafica-3d.md)
const props = defineProps({ disegno: { type: String, default: null } })
const in3d = props.disegno === '3d'

const CHIAVE = 'sotterraneo'
// il dito si lascia dietro un click che va ingoiato (vedi giochi/fattoria)
const FANTASMA_MS = 100
const FANTASMA_PX = 32
const FERMO_PX = 16   // sotto i 16px Android/iOS considerano il dito ancora fermo

const tela = ref(null)
const radice = ref(null)
const tema = usaTema(radice, in3d ? 'legno' : 'attuale')
const corsa = shallowRef(null)
// indice della campagna, o INDICE_ABISSO (−1); null vuol dire nessuna discesa
const tappaIdx = ref(null)
const nellAbisso = computed(() => tappaIdx.value === INDICE_ABISSO)
const domanda = ref(null)
const fine = ref(null)
// un avviso è una riga sola; `dilloDi` porta anche la cosa, per mostrare la sua faccia vera invece di un'emoji
const avviso = ref(null)
const zainoAperto = ref(false)
const diarioGiu = ref(false)       // il diario delle missioni, scheda della finestra dell'eroe, aperto in discesa (sopra sta in Campagna.vue)
const preparatiAperti = ref(false) // la scelta degli incantesimi da preparare, dalla loro casella nella barra (docs/sotterraneo/orologio.md)
const mappaGrande = ref(false)     // la mappina aperta grande dalla barra (scena/tela.js, minimappa)
const colpito = ref(false)         // il globo della vita sobbalza a un colpo
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
  const n = schedaConLaRoba(e.chiave, r, a.crescita)
  const meta = dice(a.sosta, CAMPAGNA)
  return {
    ...e, nuova: !cominciata(a), livello: n.livello,
    vita: n.vita, att: n.att, dif: n.dif, tratti: n.tratti,
    mano: n.mano, mancina: n.mancina,
    discese: Math.min(a.tappa, QUANTE_TAPPE), quante: QUANTE_TAPPE,
    stelle: Object.values(a.stelle).reduce((n, s) => n + (Number(s) || 0), 0),
    // il resto della roba che si vede: l'arma e lo scudo sono già nelle mani del ritratto
    addosso: [n.corpo, n.collo, n.dito, n.dito2].filter(k => k && COSE[k]).map(k => ({ chiave: k, ...COSE[k] })),
    gemme: r.gemme,
    fondo: (a.abisso && a.abisso.fondo) || 0,
    aMeta: meta ? meta.nome : null,
    aMetaIcona: meta ? iconaDi(meta.chiave) : null,
  }
}))

// La roba dell'avventuriero (motore/corredo.js), in cfg.avventure[eroe].roba: fra una discesa e l'altra non si
// riparte più nudi (docs/sotterraneo/la-roba-che-resta.md). Un'avventura nuova comincia con lo zaino vuoto
const roba = computed(() => rileggiRoba(qui.value.roba) || ROBA_VUOTA())
// l'esperienza e i punti dati (motore/crescita.js), anche loro dell'avventura; i leggendari trovati, per i Tesori
const crescita = computed(() => rileggiCrescita(qui.value.crescita, eroeQui()))
const tesoriTrovati = computed(() => (Array.isArray(qui.value.tesori) ? qui.value.tesori.filter(id => LEGGENDARI[id]) : []))
const conITrovati = c => {
  const nuovi = [...c.trovati].filter(id => !tesoriTrovati.value.includes(id))
  return nuovi.length ? { tesori: [...tesoriTrovati.value, ...nuovi] } : {}
}

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
  if (!c || c.finita || tappaIdx.value == null || salendo) return
  ultimoSalvato = orologio
  nellAvventura({ roba: c.roba, crescita: c.crescita, sosta: scrivi(c, tappaIdx.value, { via }), ...fatteGiu(c),
                  ...conITrovati(c) }, { subito })
}
function fatteGiu(c) {
  const n = c.missioniFatte.size ? missioniFatte(qui.value.missioni, [...c.missioniFatte]) : null
  // «sconfiggi N»: il conto passa nell'avventura insieme alle fatte, così sopravvive a uscite, soste e svenimenti
  const k = Object.keys(c.conti).length ? { conti: { ...(qui.value.conti || {}), ...c.conti } } : {}
  return { ...(n ? { missioni: n } : {}), ...k }
}

/* ═══════════ le missioni dei personaggi (motore/missioni.js) ═══════════
   Si prendono parlando con chi le dà (anche più insieme), si fanno giù (Corsa.missioni), si consegnano sopra: il
   premio va sulla roba dell'avventura, gemme o un gioiello, e a volte monete, che passano dalla borsa del gioco
   come ogni altra (docs/sotterraneo/missioni.md) */
const missioni = computed(() => qui.value.missioni || {})
// a che punto sono le «sconfiggi N»: quello dell'avventura, e giù quello della discesa che cammina (motore/missioni.js)
const contiGiu = dallaCorsa(c => ({ ...c.conti }), {})
const conti = computed(() => ({ ...(qui.value.conti || {}), ...contiGiu.value }))
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
  const b = new Corredo({ eroe: eroeQui(), roba: roba.value, crescita: crescita.value })
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
  return t && !t.abisso ? promemoria(missioni.value, t.chiave, c.piano + 1, conti.value) : []
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
  const sale = c.foglio && c.foglio.chi
  // la pergamena nell'abisso non lascia il gemello: è la sera che finisce, come «torno su per stasera» (docs/sotterraneo/portale-e-sosta.md)
  if (sale && sale.senzaGemello) {
    c.chiudi()
    suono.nota(260, 880, 0.5, 'sine', 0.12)
    if (in3d && pittore && pittore.attraversa) { pittore.attraversa(() => chiudi(), sale); return }
    return chiudi()
  }
  c.chiudi()
  salva({ subito: true, via: VIA_PORTALE })
  // si sbuca nell'ultimo posto sicuro (motore/posto-sicuro.js): oggi il villaggio, accanto al gemello
  const sicuro = ultimoPostoSicuro(qui.value)
  nellAvventura({ terra: { ...(qui.value.terra || {}), dove: sicuro.terra } }, { subito: true })
  // nel mondo in 3D si sbuca accanto al gemello, nella città che serve quel dungeon (viste/Mondo3d.vue lo trova)
  if (in3d) nellAvventura({ mondo: { ...(qui.value.mondo || {}), dove: sicuro.mondo } }, { subito: true })
  suono.nota(260, 880, 0.5, 'sine', 0.12)
  // in 3D si vede il passaggio (il velo lampeggia, l'eroe ci si stringe dentro): la sosta è già scritta, non si riscrive
  if (in3d && pittore && pittore.attraversa) { salendo = true; pittore.attraversa(allaMappa, sale); return }
  allaMappa()
}
let salendo = false

// riprendere non è ricominciare: il piano si rifà dal seme, e sopra ci si rimette quello che era successo. Dalla
// carta in cima, da «riprendi da qui» e dal portale di sopra: è la stessa sosta. `ferma`: nasce dietro il velo
// della pausa e riparte al tocco (docs/core/ripresa.md), quando non c'è stato un tocco su «torno giù» a chiederlo
function riprendiDiscesa({ ferma = false } = {}) {
  const dato = qui.value.sosta
  const t = dato ? zonaDi(dato.tappa, dato.potenza) : null
  const c = t ? leggi(dato, t, roba.value, presePer(missioni.value, t.chiave || ''), crescita.value, qui.value.conti) : null
  if (!c) { scorda(); return }
  togli()   // il telefono posato sulla mappa lascia acceso il freno, o si ritroverebbe dietro un velo non chiesto
  tappaIdx.value = dato.tappa
  fine.value = null
  domanda.value = null
  chiudiLaBarra()
  c.botti = in3d   // le botti da rompere sono solo del 3D (motore/botti.js)
  corsa.value = c
  c.pergameneTrovabili = dopoLaMissione(COSE['pergamena-portale'].dopo, missioni.value)
  borsellino = borsa(CHIAVE)
  nuovoGiro({ nuovo: true })   // la stessa discesa è lo stesso giro: quello che si è già pensato non torna
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

// Salendo dal portale la vita e l'energia restano quelle di giù: lo dice la barra, e li rimettono a posto gratis la
// guaritrice e l'incantatrice (viste/Terra.vue, docs/sotterraneo/terra-di-sopra.md, «Chi cura»). Null senza portale
// `forzeDi` rifà la discesa dalla sosta (decine di ms): si tiene finché non cambiano sosta, roba e crescita, se no
// la terra di sopra la rifaceva a ogni passo e andava a scatti
let forzeTenute = { chiave: null, valore: null }
const forze = computed(() => {
  const dato = qui.value.sosta
  if (!dato || corsa.value || viaDi(dato) !== VIA_PORTALE) return null
  const chiave = [dato, qui.value.roba, qui.value.missioni, qui.value.crescita]   // i dati salvati, non le copie rilette
  if (forzeTenute.chiave && chiave.every((v, i) => v === forzeTenute.chiave[i])) return forzeTenute.valore
  const t = zonaDi(dato.tappa, dato.potenza)
  const valore = t ? forzeDi(dato, t, roba.value, presePer(missioni.value, t.chiave || ''), crescita.value) : null
  forzeTenute = { chiave, valore }
  return valore
})
const ferito = computed(() => !!forze.value && forze.value.vita < forze.value.vitaMax)
function curaDa(risorsa) {
  const f = forze.value
  if (!f) return
  nellAvventura({ sosta: { ...qui.value.sosta, ...(risorsa === 'vita' ? { vita: f.vitaMax } : { energia: f.energiaMax }) } }, { subito: true })
  suono.ok()
}

/* ═══════════ la mappa delle tappe ═══════════ */
// quelle dell'avventura aperta: un eroe nuovo comincia dalla scalinata (l'età apre lo stesso quelle già passate).
// Finita la storia ogni discesa è una zona con la sua fascia (motore/zone.js, docs/sotterraneo/zone.md): ha il suo
// nome e i suoi piani, e `livello` e `colore` dicono il pallino per l'eroe di adesso; `nuova` è la zona appena nata,
// finché il minatore non l'ha raccontata
const livelloOra = computed(() => livelloDella(crescita.value))
// il livello di forza (motore/forza.js, docs/sotterraneo/forza.md): quanto vale l'eroe con la roba e le abilità di adesso. I
// colori dei pallini si leggono da lì; le fasce, da quello più alto raggiunto (rilevato qui sotto, sulla terra di sopra)
const forzaOra = computed(() => forzaDi(eroeQui(), roba.value, crescita.value))
const notizia = computed(() => notiziaDi(qui.value, livelloOra.value, forzaOra.value))
const tappe = computed(() => {
  const a = qui.value
  return CAMPAGNA.map((t, i) => {
    const potenza = potenzaDi(a, i, livelloOra.value, forzaOra.value)
    const livello = livelloDellaZona(a, i, livelloOra.value, forzaOra.value)
    return {
      ...zonaDi(i, potenza), indice: i,
      aperta: aperta(CHIAVE, i, a.tappa),
      adesso: adesso(CHIAVE, i, a.tappa),
      stelle: a.stelle[i] || 0,
      fatta: i < a.tappa,
      livello, colore: coloreDi(a, i, livelloOra.value, forzaOra.value),
      nuova: !!notizia.value && !notizia.value.sentita && notizia.value.indice === i,
    }
  })
})
// quello che racconta il minatore della zona appena nata; sentito, il segno sopra la sua testa si spegne
const annuncio = computed(() => (notizia.value
  ? { chiave: notizia.value.chiave, nome: notizia.value.nome, livello: notizia.value.da,
      detto: notizia.value.detto, sentita: notizia.value.sentita }
  : null))
function annuncioSentito() {
  if (!notizia.value || notizia.value.sentita) return
  nellAvventura({ zone: zoneConSentita(qui.value, notizia.value.id) }, { subito: true })
}
// Il massimo della forza si scrive nell'avventura (`zone.forza`): una zona rinata non torna indietro se si vende l'arma.
// Si guarda sulla terra di sopra, appena si arriva e a ogni cambio di roba o di livello; durante una discesa no
watch([forzaOra, livelloOra, () => !!corsa.value], () => {
  if (corsa.value || scegliEroe.value) return
  const z = zoneConForza(qui.value, forzaOra.value, livelloOra.value)
  if (z) nellAvventura({ zone: z })
}, { immediate: true })

// chi scende con la roba addosso (vita, braccio, difesa, tratti, gemme): la barra in basso e la pagina dell'eroe, sulla mappa
const robaSopra = computed(() => schedaConLaRoba(eroeQui(), roba.value, crescita.value))

/* ═══════════ i mercanti di sopra (motore/bottega.js) ═══════════
   Il banco si pesca una volta per giro e si scrive nell'avventura (botteghe): un banco che cambiasse a ogni
   apertura sarebbe una slot machine. Il giro cambia quando una discesa finisce (chiudi), e il banco di chi veste non
   si ripesca: se ne vanno i pezzi più deboli e ne entrano di nuovi, gli altri aspettano (alGiroNuovo, `prepara`).
   Gli ultimi pezzi venduti al rigattiere stanno a parte (`venduti`), e sopravvivono al giro. Quanta roba c'è lo
   dicono le discese finite di quest'avventura */
const aperto = ref(null)          // la chiave del mercante col banco aperto
const tocco = ref(0)              // batte a ogni compra/vendi: la bottega non è reattiva
const dettoBanco = ref(null)
const schedaBanco = ref(null)     // la linguetta da cui si apre: «ho roba da vendere» apre quella delle tasche
let bottega = null

function apriBottega(k, scheda = null) {
  if (!mercanteDi(k)) return
  bottega = new Bottega({ eroe: eroeQui(), roba: roba.value, finite: qui.value.tappa, crescita: crescita.value,
                          ...(qui.value.botteghe || {}), venduti: qui.value.venduti, missioni: missioni.value })
  bottega.prepara(k)   // il banco di questo giro, o il suo cambio a metà se è finita una discesa
  nellAvventura({ botteghe: bottega.botteghe })
  dettoBanco.value = null
  schedaBanco.value = scheda
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
  // si mostra solo quello che migliora davvero qualcosa addosso, anche i pezzi delle righe dopo (`avanti`), che si
  // comprano a un prezzo più alto (`costa`: il `prezzo` resta quello pieno). Regola dell'utente, 8 ottobre: lo
  // scettro accanto al bastone magico (⚔️ 3 tutti e due) «non sembra molto interessante»
  const vendibili = b.mercanziaVista(k)
    .map(({ chiave: x, sempre, avanti, ruolo }) => {
      const costa = b.quantoCosta(x)
      return {
        chiave: x, sempre, ...COSE[x], ...((COSE[x].cura || COSE[x].tutta) ? { cura: b.curaDi(x) } : {}), costa, avanti, posso: b.gemme >= costa,
        // `ruolo` salto/sogno (motore/bottega.js): solo per i test, sulla casella non si segna niente
        ruolo,
        // `nonPuoi`: la classe non lo porta, non si compra. `serve`: lo porta ma gli manca la caratteristica, si compra e va nello zaino
        alTetto: eCura(x) && b.alTettoDelleCure ? POZIONI_MASSIME : b.alTettoDi(x) ? PERGAMENE_MASSIME : 0,
        tettoDi: eCura(x) ? 'pozioni' : 'pergamene',
        nonPuoi: b.porta(x) ? '' : b.perchéNo(x), serve: b.porta(x) ? b.perchéNo(x) : '', prova: b.seLoMetto(x, { ancora: true }), va: b.vaAddosso(x),
        mancano: Math.max(0, costa - b.gemme),
        quante: b.quanteNeHo(x),
      }
    })
  return {
    // le linguette di una famiglia che l'eroe non porta non si mostrano (dati/mercanti.js, schedeDi)
    chi: { ...m, schede: schedeDi(m, eroeDi(eroeQui()), missioni.value) },
    roba: vendibili,
    addosso: { mano: voce(b.mano), mancina: voce(b.mancina), corpo: voce(b.corpo), collo: voce(b.collo), dito: voce(b.dito), dito2: voce(b.dito2) },
    numeri: { vita: b.vitaConLaRoba, att: b.att, dif: b.dif, gemme: b.gemme },
    tasche: m.compra ? Array.from({ length: b.capienza }, (_, i) => {
      const t = b.tasche()[i]
      return t ? { chiave: t.k, ...COSE[t.k], vale: b.quantoVale(t.k), n: t.n } : null
    }) : null,
    // le ultime cose vendute, dalla più recente, al prezzo a cui il mercante le ha pagate (`i`: il posto nel suo elenco)
    riacquisto: m.compra ? b.daRiacquistare(k).map(({ k: x, prezzo, i }) => ({
      chiave: x, ...COSE[x], costa: prezzo, i, posso: b.gemme >= prezzo, mancano: Math.max(0, prezzo - b.gemme),
      serve: b.porta(x) ? b.perchéNo(x) : '', prova: b.seLoMetto(x, { ancora: true }), va: b.vaAddosso(x),
    })) : null,
  }
})

function dopoIlBanco(e) {
  const a = bottega.avvisi.pop()
  bottega.avvisi = []
  if (a) dettoBanco.value = typeof a === 'string' ? { testo: a } : { ...(COSE[a.cosa] || {}), testo: a.testo }
  bottega.prepara(aperto.value)   // una linguetta che si è svuotata si rimette a metà giro
  nellAvventura({ roba: bottega.roba, botteghe: bottega.botteghe, venduti: bottega.venduti.length ? bottega.venduti : null })
  tocco.value++
  return e
}
function compraSopra(x) {
  const e = dopoIlBanco(bottega.compraDa(aperto.value, x))
  if (e?.che === 'comprato') suono.compra(); else suono.no()
}
function riacquistaSopra(i) {
  const e = dopoIlBanco(bottega.riacquistaDa(aperto.value, i))
  if (e?.che === 'comprato') suono.compra(); else suono.no()
}
function vendiSopra(t) {
  const e = dopoIlBanco(bottega.vendiA(aperto.value, bottega.indiceDellaTasca(t)))
  if (e) suoni.bottino()
}

// la terra di sopra si ricorda per avventura: la nebbia, dove si era, se il minatore ha già parlato
const ricordaTerra = v => nellAvventura({ terra: v })
// il mondo di sopra del 3D (viste/Mondo3d.vue) si ricorda accanto, in `mondo`: la terra dipinta del 2D resta com'è
// (docs/sotterraneo/mondo-aperto-dati.md). La veduta d'insieme si apre dalla casella della mappa nella barra
const ricordaMondo = v => nellAvventura({ mondo: v })
const vedutaSopra = ref(false)
// la domanda di una pietra del viaggio: una risposta giusta paga come giù, una sbagliata no (docs/apprendimento/calibrazione.md)
function rispostaSopra({ giusto, saltata }) {
  if (giusto && !saltata) { borsa(CHIAVE).paga(PAGA.mossa); suono.ok() } else if (!giusto) suono.no()
}

// il nome della discesa (una zona potenziata ha il suo, docs/sotterraneo/zone.md)
const nomeGiu = dallaCorsa(c => c.tappa.nome, '')
const titolo = computed(() => nomeGiu.value || 'Il sotterraneo')

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
    livelloPosto: c.tappa.potenza ? c.livelloQui : null,   // in una zona potenziata: il livello dei mostri (docs/sotterraneo/zone.md)
    chiave: c.chiaveDelPiano,
    // niente quando non se ne ha nessuna; `quota` (0..1) sta qui e non nella vista, che riceve solo il numero
    torcia: c.torciaAccesa
      ? { resta: c.torciaResta, quota: c.torciaResta / (COSE.torcia.stanze || 1),
          scorta: c.torceInScorta, agliSgoccioli: c.torciaResta <= 3 && !c.torceInScorta }
      : null,
    pozioni: c.pozioni,               // le cure in tasca, sulla casella 🧪 della barra
    pieni: c.postiUsati(), tasche: c.capienza,
    esp: c.crescita.esp, crescita: c.crescita,
    energia: c.energia, energiaMax: c.energiaMax,   // il globo blu della barra (docs/sotterraneo/abilita.md)
    incanti: incantiAddosso(c),                     // gli incanti preparati addosso, sopra il globo (docs/sotterraneo/orologio.md)
  }
})

/* ═══════════ la barra in basso, la stessa sopra e sotto (viste/BarraDiSotto.vue, docs/sotterraneo/barra.md) ═══════════
   Giù i numeri sono quelli della discesa; sopra quelli della roba e della crescita dell'avventura, con la vita piena
   (sopra non si combatte). Il globo di destra è l'esperienza, col livello e il «+» dei punti da dare */
const barra = computed(() => {
  const giu = eroe.value
  const r = roba.value
  const n = robaSopra.value
  const sf = forze.value   // dopo il portale la vita è quella di giù
  const esp = giu ? giu.esp : crescita.value.esp
  const q = quotaDi(esp)
  const cr = giu ? giu.crescita : crescita.value
  return {
    vita: giu ? giu.vita : sf ? sf.vita : n.vita, vitaMax: giu ? giu.vitaMax : sf ? sf.vitaMax : n.vita,
    livello: q.livello, esperienza: q.quota, espFatta: q.fatto, espServe: q.serve, punti: puntiDaDare(cr),
    // l'energia giù è quella della discesa; sopra è piena, come la vita
    energia: giu ? giu.energia : sf ? sf.energia : robaSopra.value.energiaMax,
    energiaMax: giu ? giu.energiaMax : sf ? sf.energiaMax : robaSopra.value.energiaMax, puntiAbilita: puntiAbilita(cr),
    pozioni: giu ? giu.pozioni : r.zaino.filter(k => COSE[k] && (COSE[k].usa === 'cura' || COSE[k].usa === 'cresci')).length,
    pieni: giu ? giu.pieni : postiDello(r.zaino), tasche: giu ? giu.tasche : robaSopra.value.capienza,
    gemme: giu ? giu.gemme : r.gemme,
    incanti: giu ? giu.incanti : [],
    // gli incantesimi che l'eroe sa e si preparano (la casella degli incanti), e le missioni da consegnare (il globo rosso e la linguetta)
    preparabili: (RAMI[eroeQui()] || []).flatMap(r => r.nodi).filter(n => preparabile(n) && gradoDi(cr, n.id)).length,
    missioniPronte: diario(missioni.value, tappe.value, segui.value, conti.value).pronte.length,
  }
})

/* ═══════════ la pagina dell'eroe e i Tesori (viste/PaginaEroe.vue, viste/Tesori.vue) ═══════════
   Si apre dal globo dell'esperienza, sopra e sotto. Giù i punti si danno alla corsa (la vita della tempra arriva
   subito), sopra all'avventura; sopra ha anche «Cambia eroe», che riapre la scelta delle avventure */
const paginaEroe = ref(false)
const tesoriAperti = ref(false)
// la pagina dell'eroe ha due facce: le caratteristiche ('eroe') e l'albero delle abilità ('abilita', dal globo blu)
const facciaEroe = ref('eroe')
function apriPaginaEroe(faccia = 'eroe') {
  preparatiAperti.value = false
  zainoAperto.value = false
  diarioGiu.value = false
  diarioSopra(false)
  zainoSopra.value = false
  tesoriAperti.value = false
  facciaEroe.value = faccia === 'abilita' ? 'abilita' : 'eroe'
  paginaEroe.value = true
  suono.ok()
}
// il Corredo da guardare: la corsa giù, la roba dell'avventura sopra
const chiGuardo = () => corsa.value || new Corredo({ eroe: eroeQui(), roba: roba.value, crescita: crescita.value })
const pagina = computed(() => {
  tic.value
  if (!paginaEroe.value) return null
  const c = chiGuardo()
  const q = quotaDi(c.crescita.esp)
  return {
    eroe: c.io, mano: c.mano, mancina: c.mancina,
    livello: q.livello, fatto: q.fatto, serve: q.serve, punti: puntiDaDare(c.crescita), forza: forzaDelCorredo(c),
    numeri: { vita: c.vita ?? c.vitaConLaRoba, vitaMax: c.vitaMax ?? c.vitaConLaRoba, att: c.att, dif: c.dif,
              gemme: c.gemme },
    caratteristiche: c.caratteristiche(),
    cambia: !corsa.value, tratti: corsa.value ? [trattoDegliElisir(c.crescita)].filter(Boolean) : robaSopra.value.tratti,
    tesori: { trovati: tesoriTrovati.value.length, tutti: Object.keys(LEGGENDARI).length },
    puntiAbilita: puntiAbilita(c.crescita), costoRiassegnare: c.costoRiassegnare,
  }
})
// l'albero delle abilità (viste/PaginaAbilita.vue, docs/sotterraneo/abilita.md): i numeri li dà il Corredo
const albero = computed(() => {
  tic.value
  if (!paginaEroe.value || facciaEroe.value !== 'abilita') return null
  const c = chiGuardo()
  return {
    eroe: c.io, livello: c.livelloEroe, punti: puntiAbilita(c.crescita), crescita: c.crescita,
    energia: c.energia ?? c.energiaMax, energiaMax: c.energiaMax,
    armi: Object.fromEntries(['mano', 'mancina'].map(d => [d, c[d]])),
    haLArma: a => c.haLArma(a),
    gemme: c.gemme, costoDimenticare: c.costoDimenticare,
    puntiEroe: puntiDaDare(c.crescita), vitaMax: c.vitaMax ?? c.vitaConLaRoba,
  }
})
// un punto all'albero o una casella cambiata: giù sulla corsa (e la sosta), sopra sull'avventura
function sullAlbero(fai) {
  const c = corsa.value
  if (c) {
    const vitaPrima = c.vitaMax, energiaPrima = c.energiaMax
    if (!fai(c)) return false
    // Cuore saldo e l'intelligenza alzano il tetto: quello in più arriva subito, come la tempra; riassegnando può scendere
    c.vita = Math.min(c.vitaMax, c.vita + Math.max(0, c.vitaMax - vitaPrima))
    c.energia = Math.min(c.energiaMax, c.energia + Math.max(0, c.energiaMax - energiaPrima))
    tic.value++
    salva({ subito: true })
    return true
  }
  const b = new Corredo({ eroe: eroeQui(), roba: roba.value, crescita: crescita.value })
  if (!fai(b)) return false
  // anche la roba: riassegnare costa gemme, e quello che non si può più indossare torna in tasca
  nellAvventura({ crescita: b.crescita, roba: b.roba }, { subito: true })
  tic.value++
  return true
}
// le tasche dello zaino, una voce per tasca: le pozioni uguali stanno insieme (`n`), il resto una per pezzo, poi i buchi
function tascheVoci(c, voce) {
  const t = c.tasche()
  return Array.from({ length: c.capienza }, (_, i) => (t[i] ? { ...voce(t[i].k), n: t[i].n } : null))
}
// comprare una tasca in più con le gemme (viste/Zaino.vue): sopra e giù, e resta all'eroe per sempre
function compraTasca() { if (sullAlbero(c => c.compraTasca())) suono.compra() }
// riassegnare i punti o dimenticare l'albero: si paga in gemme (docs/sotterraneo/livelli.md, «Riassegnare»)
function riassegnaPunti() { if (sullAlbero(c => c.riassegnaPunti())) suono.nota(659, 330, 0.3, 'triangle', 0.1) }
function dimenticaAlbero() { if (sullAlbero(c => c.dimenticaAlbero())) suono.nota(659, 330, 0.3, 'triangle', 0.1) }
function imparaAbilita(id) {
  if (sullAlbero(c => c.impara(id))) suono.nota(523, 784, 0.18, 'triangle', 0.12)
}
function casellaAbilita({ i, id }) {
  if (sullAlbero(c => c.mettiInCasella(i, id))) suono.ok()
}
// «Cambia eroe», dalla pagina dell'eroe di sopra: la pagina si chiude e si apre la scelta, senza perdere niente
function cambiaEroe() {
  paginaEroe.value = false
  tesoriAperti.value = false
  scegliEroe.value = true
}
function daiUnPunto(k) {
  const c = corsa.value
  if (c) {
    if (!c.daiUnPunto(k)) return
    tic.value++
    salva({ subito: true })
  } else {
    const n = daiPunto(crescita.value, k)
    if (!n) return
    nellAvventura({ crescita: n }, { subito: true })
    tic.value++
  }
  suono.nota(523, 784, 0.18, 'triangle', 0.12)
}

/* ═══════════ lo zaino di sopra ═══════════
   Lo stesso zaino della discesa, sulla roba dell'avventura: ci si veste e ci si spoglia, ma non si beve (sopra si
   è sempre in piena forma) e non si butta (quello che non serve lo compra il mercante, chiave `rigattiere`) */
const zainoSopra = ref(false)
const detto = ref(null)        // la riga sopra il campo, sulla terra di sopra (la terra ha la sua per quello che trova)
let dettoFino = 0
function dilloSopra(testo) {
  detto.value = testo
  clearTimeout(dettoFino)
  dettoFino = setTimeout(() => { detto.value = null }, 2200)
}
const zainoDiSopra = computed(() => {
  tic.value
  if (!zainoSopra.value) return null
  const c = new Corredo({ eroe: eroeQui(), roba: roba.value, crescita: crescita.value })
  const voce = k => (k ? { chiave: k, ...COSE[k], nonPuoi: c.perchéNo(k), ancora: c.porta(k) && !c.posso(k), prova: c.seLoMetto(k, { ancora: true }), ...((COSE[k].cura || COSE[k].tutta) ? { cura: c.curaDi(k) } : {}) } : null)
  return {
    mano: voce(c.mano), mancina: voce(c.mancina), corpo: voce(c.corpo), collo: voce(c.collo), dito: voce(c.dito), dito2: voce(c.dito2),
    tasche: tascheVoci(c, voce), costoTasca: c.costoTasca, cure: { n: c.pozioniDiCura, max: POZIONI_MASSIME },
    att: c.att, dif: c.dif, gemme: c.gemme, vita: c.vitaConLaRoba, vitaMax: c.vitaConLaRoba,
  }
})
function suLaRoba(fai) {
  const c = new Corredo({ eroe: eroeQui(), roba: roba.value, crescita: crescita.value })
  const e = fai(c)
  const a = c.avvisi.pop()
  if (a) dilloSopra(typeof a === 'string' ? a : a.testo)
  nellAvventura({ roba: c.roba, crescita: c.crescita }, { subito: true })
  tic.value++
  return e
}
function usaSopra(t, dove = null) {
  const i = tascheDello(roba.value.zaino)[t].i   // la tasca → il posto nella lista (le pozioni uguali ne fanno una sola)
  const k = roba.value.zaino[i]
  // l'elisir vale per sempre e si beve anche qui; una cura no (si è già in piena forma), le altre cose servono laggiù
  if (COSE[k] && COSE[k].usa === 'cresci') { suLaRoba(c => { const e = c.beviElisir(i); if (e) c.dillo(`🐂 +${e.vita} vita, per sempre`); return e }); suono.ok(); return }
  if (COSE[k] && !COSE[k].dove) { dilloSopra(COSE[k].usa === 'cura' ? (ferito.value ? '❤️ la guaritrice ti cura, gratis' : '❤️ sei già in piena forma') : 'Serve laggiù, non qui'); return }
  suLaRoba(c => c.indossaDallaTasca(i, dove))
  suono.ok()
}
function riponiSopra(dove) { suLaRoba(c => c.riponi(dove)); suono.ok() }

/* ═══════════ il mostro grosso (dati/grossi.js) ═══════════
   La sua vita in cima allo schermo da quando ci si entra nella stanza (si sveglia) o lo si combatte */
const grosso = dallaCorsa(c => {
  const f = c.foglio
  const m = f && f.che === 'scontro' && f.chi.grosso ? f.chi
    : c.livello.robe.find(r => r.che === 'mostro' && r.grosso && !r.morto && r.sveglio)
  if (!m) return null
  return { chiave: m.grosso, nome: m.nome, ossa: Math.max(0, m.ossa),
           ossaMax: m.ossaMax, att: m.att, dif: m.dif }
})

/* ═══════════ le feste: un livello salito, un leggendario caduto (Corsa.eventi) ═══════════
   Il livello: la colonna di luce sull'eroe (scena/tela.js), il globo che si accende e un suono suo. Il leggendario: la
   colonna di luce su di lui finché sta per terra, e in mezzo al campo il nome in oro con la sua riga di storia */
const festa = ref(null)          // { che: 'livello', livello } | { che: 'leggendario', nome, storia, cosa }
const sale = ref(false)
let festaFino = 0
const suoniDellaFesta = {
  livello: () => {
    [392, 523, 659, 784, 1047].forEach((f, i) => suono.nota(f, f, 0.22, 'triangle', 0.12, i * 90))
    suono.nota(1568, 2093, 0.6, 'sine', 0.06, 480)
  },
  leggendario: () => {
    [262, 330, 392, 523].forEach((f, i) => suono.nota(f, f, 1.1, 'sine', 0.09, i * 60))
    ;[1568, 2093, 2637].forEach((f, i) => suono.nota(f, f * 1.01, 0.5, 'triangle', 0.07, 520 + i * 140))
  },
}
function festeggia(e, c) {
  if (e.che === 'esp') {
    if (pittore) pittore.numerini.push({ testo: `+${e.esp} ✨`, x: e.x + 0.5, y: e.y, t: orologio })
    return
  }
  if (e.che === 'livello') {
    festa.value = { che: 'livello', livello: e.livello }
    sale.value = true
    setTimeout(() => { sale.value = false }, 1600)
    if (pittore) pittore.colonne.push({ x: c.eroe.x, y: c.eroe.y, t: orologio, colore: '255,226,140', segui: true })
  } else if (e.che === 'leggendario') {
    const k = COSE[e.cosa]
    if (!k) return
    festa.value = { che: 'leggendario', nome: k.nome, storia: k.storia, cosa: e.cosa, sprite: k.sprite, em: k.em }
  }
  suoniDellaFesta[e.che]?.()
  clearTimeout(festaFino)
  festaFino = setTimeout(() => { festa.value = null }, e.che === 'leggendario' ? 4200 : 2600)
}

// il globo della vita sobbalza quando cala: un colpo preso si vede anche con gli occhi sul mostro
let colpitoFino = 0
watch(() => eroe.value && eroe.value.vita, (ora, prima) => {
  if (ora == null || prima == null || ora >= prima || racconto.fx.attivo) return   // in uno scontro il globo sobbalza a ogni colpo raccontato
  colpito.value = true
  clearTimeout(colpitoFino)
  colpitoFino = setTimeout(() => { colpito.value = false }, 380)
})

// chi riapre il telefono dopo mezz'ora non sta guardando il gioco: "piano 2 di 3 · ❤️ 24" fa tornare in mente dov'era
const dovEravamo = dallaCorsa(c => `🕳️ piano ${c.piano + 1}`
  + (c.senzaFondo ? '' : ` di ${c.quantiPiani}`)
  + ` · ❤️ ${c.vita}`, '')

// il foglio aperto è sempre lo stesso oggetto: si guarda `c.foglio` per conto proprio, per svegliarsi quando cambia dentro
const foglio = dallaCorsa(c => c.foglio || null)

// Lo scontro com'è adesso (viste/campo.js) e il suo racconto (viste/racconto.js). Il motore risolve un turno intero dentro
// `rispondi`; la vista lo rifà un'azione alla volta, e tiene lo scontro a schermo finché l'ultimo colpo non è raccontato
// (anche se intanto è finito, o l'eroe è svenuto). La domanda e la scelta dopo compaiono a racconto finito.
const racconto = nuovoRacconto({
  suono: n => ({ colpo: () => suoni.colpo(), graffio: () => suoni.graffio(), bottino: () => suoni.bottino(),
                 ahia: () => suoni.ahia(), bevuto: () => suoni.tesoro() })[n]?.(),
  colpitoEroe: () => {
    colpito.value = true
    clearTimeout(colpitoFino)
    colpitoFino = setTimeout(() => { colpito.value = false }, 380)
  },
  finito: () => {
    const dopo = alFinire
    alFinire = null
    tic.value++
    if (dopo) dopo()
  },
})
const animando = computed(() => racconto.fx.attivo)
let alFinire = null
let ultimaVista = null     // lo scontro com'era l'ultima volta che c'era: resta lì mentre si racconta l'ultimo colpo
let ultimaScelta = null
const nemicoVivo = dallaCorsa(vistaDelloScontro)
const nemico = computed(() => {
  const v = nemicoVivo.value
  if (v) ultimaVista = v
  return v || (racconto.fx.attivo ? ultimaVista : null)
})

// com'era lo scontro prima di rispondere: i posti, le ossa di ognuno e la fila dei turni (il racconto parte da lì)
function fotoPrima(c) {
  const f = c.foglio
  if (!f || f.che !== 'scontro') return null
  const v = vistaDelloScontro(c)
  return { campo: [...f.campo], ossa: f.campo.map(m => Math.max(0, m.ossa)), morti: f.campo.map(m => !!m.morto), turni: v.turni,
           stati: v.mostri.map(m => m.stati) }
}
// come colpisce l'eroe in un'azione, per il racconto: l'effetto che si vede (dati/effetti.js: dall'abilità, o dall'arma in mano
// per l'attacco solito) e il colore del suo ramo, per il nome
function comeColpisce(a) {
  const c = corsa.value
  const nodo = a.usata ? NODI[a.usata.id] : null
  const famiglia = c && c.mano && COSE[c.mano] ? COSE[c.mano].famiglia : null
  const modo = modoDelColpo({ nodo, famiglia, tinta: nodo ? tintaDi(nodo.id) : '#ffe39a' })
  if (pittore && pittore.colpo) pittore.colpo(a, modo)   // il 3D: verso chi scatta, coi tempi e il colore dell'effetto
  return modo
}
// il colore del ramo di un'abilità: il glifo che vola verso il mostro è di quel colore
function tintaDi(id) {
  const nodo = NODI[id], c = corsa.value
  const ramo = nodo && c && (RAMI[c.io.chiave] || []).find(r => r.chiave === nodo.ramo)
  return ramo ? ramo.tinta : '#ffd23f'
}
// racconta le azioni di un turno (le sue o quelle dell'apertura); `dopo` parte a racconto finito
function raccontaLoScontro(prima, azioni, { riga = null, dopo = null } = {}) {
  alFinire = dopo
  racconto.racconta({ campo: prima.campo, prima, azioni, modo: comeColpisce, riga })
}
// l'apertura: l'agguato, la sorpresa e i mostri più veloci che colpiscono prima del primo turno dell'eroe
watch(() => { tic.value; const f = corsa.value?.foglio; return f && f.che === 'scontro' ? f : null }, f => {
  if (!f || !(f.apertura.length || f.agguato || f.sorpresa)) return
  const prima = fotoPrima(corsa.value)
  const molti = f.campo.length > 1
  raccontaLoScontro(prima, f.apertura, { riga: f.agguato ? 'Alle spalle!' : f.sorpresa ? (molti ? 'Li hai sorpresi!' : 'Lo hai sorpreso!') : null })
})
// toccare un mostro lo fa bersaglio: la scelta qui sotto si rifà coi numeri contro di lui
function scegliIlBersaglio(i) {
  const c = corsa.value
  const f = c && c.foglio
  if (!f || f.che !== 'scontro' || animando.value || !f.campo[i]) return
  if (!c.scegliBersaglio(f.campo[i])) return
  tic.value++
  suoni.passo()
}

// La scelta dello scontro in due fasi (viste/CaselleAbilita.vue, docs/sotterraneo/abilita.md): prima cosa fare, poi la
// domanda per quel colpo. `colpoPer` è la domanda per cui si è già scelto: a ogni domanda nuova si torna alla scelta
const colpoPer = ref(0)
const sceltaFatta = dallaCorsa(c => !!c.chiesta && colpoPer.value === c.chiesta.id)
const abilitaViva = dallaCorsa(c => {
  const f = c.foglio
  if (!f || f.che !== 'scontro') return null
  const m = f.chi
  const voce = id => {
    const nodo = id && NODI[id]
    if (!nodo) return null
    const ramo = RAMI[c.io.chiave].find(r => r.chiave === nodo.ramo)
    return { id, glifo: nodo.glifo, tinta: ramo && ramo.tinta, nome: nodo.nome, costo: c.costoDi(nodo),
             dice: c.descrizione(nodo, m), perche: c.perchéNonUsi(id) }
  }
  const caselle = caselleDella(c.crescita).map(voce).filter(Boolean)
  const i = c.pozioneGiusta()
  const k = i == null ? null : c.zaino[i]
  return {
    caselle, attacco: `fai ${c.colpo(m)} di danno`, energia: c.energia, energiaMax: c.energiaMax,
    bevi: i == null ? null : { cura: k && COSE[k].usa === 'cura' ? c.curaDi(k) : 0, n: c.pozioni, tipi: c.scelteDiCura().length, fatto: !!f.bevuto },
    // la pozione blu: energia per le abilità, se ne hai e il globo non è pieno
    beviEnergia: c.energia < c.energiaMax && c.zaino.some(x => COSE[x] && COSE[x].usa === 'energia')
      ? { quanto: COSE[c.zaino.find(x => COSE[x].usa === 'energia')].energia, n: c.zaino.filter(x => COSE[x] && COSE[x].usa === 'energia').length, fatto: !!f.bevuto } : null,
    scappa: c.puoScappare() ? { graffio: c.costoFuga() } : null,
    pericolo: f.pericolo ? { perche: f.pericolo, vita: c.vita, male: c.colpiInArrivo(), bevuto: !!f.bevuto } : null,
    // com'è la scelta fatta, per la riga sopra la domanda
    scelta: c.pronta ? voce(c.pronta) : null,
  }
})
const abilitaScontro = computed(() => {
  const a = abilitaViva.value
  if (a) ultimaScelta = a
  return a || (racconto.fx.attivo ? ultimaScelta : null)
})
// il tocco sulla riga: sceglie il colpo (null: l'attacco solito) e fa partire la domanda. Se il mostro aveva ringhiato,
// scegliere vuol dire riprendere: lo stop della corsa si chiude da sé (docs/sotterraneo/pericolo.md)
function scegliColpo(id) {
  const c = corsa.value
  const f = c && c.foglio
  if (!f || f.che !== 'scontro' || animando.value) return
  if (f.pericolo) c.continua()
  c.prepara(null)
  if (id && !c.prepara(id)) return
  colpoPer.value = c.chiesta ? c.chiesta.id : 0
  tic.value++
  if (c.pronta) suono.nota(659, 988, 0.14, 'triangle', 0.1)
  else suoni.passo()
  salva()
}
// la pozione blu dal menu dello scontro: l'energia sale, e si sceglie ancora (non costa il turno)
function beviEnergiaNelloScontro() {
  const c = corsa.value
  if (!c || !c.foglio || c.foglio.che !== 'scontro' || !c.beviEnergiaNelloScontro()) return
  tic.value++
  suoni.tesoro()
  salva()
}
// bere dal menu: dentro uno stop riprende da sé (beviNelPericolo), fuori beve e lascia la scelta lì
function beviNelloScontro() {
  const c = corsa.value
  if (!c || !c.foglio || c.foglio.che !== 'scontro') return
  if (c.scelteDiCura().length > 1) { sceltaPozione.value = true; return }
  if (c.foglio.pericolo) return ringhioBevi()
  bevutaNelloScontro()
}
// la pozione rossa non costa il turno (docs/sotterraneo/pozioni.md): si racconta il sorso, poi tocca ancora a chi gioca
function bevutaNelloScontro(i) {
  const c = corsa.value
  const prima = fotoPrima(c)
  const e = c.beviNelloScontro(i)
  if (!e) return
  togli()
  tic.value++
  salva()
  mostra(e, prima)
}

const pieni = dallaCorsa(c => c.postiUsati(), 0)   // sei su sei vuol dire che la prossima cosa resta per terra

const zaino = dallaCorsa(c => {
  // `nonPuoi` la scrive il motore (perchéNo), che sa chi sta scendendo
  const voce = k => (k ? { chiave: k, ...COSE[k], nonPuoi: c.perchéNo(k), ancora: c.porta(k) && !c.posso(k), prova: c.seLoMetto(k, { ancora: true }), ...((COSE[k].cura || COSE[k].tutta) ? { cura: c.curaDi(k) } : {}) } : null)
  return {
    mano: voce(c.mano), mancina: voce(c.mancina),
    corpo: voce(c.corpo), collo: voce(c.collo), dito: voce(c.dito), dito2: voce(c.dito2),
    tasche: tascheVoci(c, voce), costoTasca: c.costoTasca, cure: { n: c.pozioniDiCura, max: POZIONI_MASSIME },
  }
})

const curiosita = dallaCorsa(c => {
  const f = c.foglio
  if (!f || f.che !== 'curiosita') return {}
  return CURIOSITA_DI[f.chi.tipo] || {}
}, {})

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
  const h = new URLSearchParams(location.hash.slice(1))
  if (h.get('sotterraneo') !== 'roba') return
  // `&mano=arco-corto@7`: solo quell'arma in pugno, anche di una famiglia che l'eroe non porta (strumenti/sotterraneo-armi.mjs)
  const sola = COSE[h.get('mano')] ? h.get('mano') : null
  c.mano = 'spada-di-ghiaccio'
  c.mancina = 'scudo-ferro'
  c.corpo = 'corazza'
  c.collo = 'teschio-cercatore'
  c.dito = 'anello-verde'
  c.dito2 = 'anello-ambra'
  // le tre armature (mai visibili addosso) e i due gioielli: le cose che si vedono solo qui
  c.zaino = ['panciotto', 'manto', 'saio', 'amuleto-azzurro', 'pozione-grande', 'chiave']
  if (sola) { c.mano = c.mancina = c.corpo = c.collo = c.dito = c.dito2 = null; c.zaino = [] }
  c.gemme += 120
  // due torce (una accesa, una di scorta): la seconda fa vedere anche il "+1" nella fascia in cima
  if (!sola) { c.accendi('torcia'); c.accendi('torcia') }
  // stesso corredo per tutti e quattro: sistemaIlCorredo toglie quello che questa classe non porta, come al rientro
  c.sistemaIlCorredo()
  if (sola) c.mano = sola
}

// `#torcia=accesa` (piena, con una di scorta), `sgoccioli` (l'ultima stanza dell'ultima) o `spenta`: per guardare la luce coi suoi
// tre stati senza camminare (docs/sotterraneo/luce.md)
function torciaDaProva(c) {
  const t = new URLSearchParams(location.hash.slice(1)).get('torcia')
  if (!['accesa', 'sgoccioli', 'spenta'].includes(t)) return
  c.torciaResta = t === 'spenta' ? 0 : t === 'sgoccioli' ? 1 : c.stanzeTorcia
  c.torceInScorta = t === 'accesa' ? 1 : 0
  c.aggiornaLuce()
}

// `#verso=sx` (o `dx`, `su`, `giu`): l'eroe guarda di là, come dopo un passo, per fotografare il cono girato
function versoDaProva(c) {
  const v = { sx: [-1, 0], dx: [1, 0], su: [0, -1], giu: [0, 1] }[new URLSearchParams(location.hash.slice(1)).get('verso')]
  if (!v) return
  c.verso = { dx: v[0], dy: v[1] }
  if (v[0]) c.guarda = v[0] < 0 ? 'sx' : 'dx'
  c.aggiornaLuce()
}

// `#abisso=12` comincia già a quel piano, per guardare una schermata senza aspettare due sere di discesa
// `#piano=2` fa lo stesso in una discesa della storia (fino all'ultimo, dove aspetta il mostro grosso)
function pianoDaProva(c) {
  const h = new URLSearchParams(location.hash.slice(1))
  const n = Number(c.senzaFondo ? h.get('abisso') : h.get('piano'))
  if (!Number.isFinite(n) || n < 2) return
  c.piano = Math.min(Math.floor(n), c.quantiPiani) - 1
  c.fondo = c.piano
  c.vitaPiu += VITA_PER_PIANO * c.piano
  c.vita = c.vitaMax
  c.nuovoPiano()
  c.posaLeMissioni()
}

// `#stanza=sala` porta l'eroe nella prima stanza di quella forma (`sala`, `elle`, `tu`, `croce`, `doppia`, `smussata`,
// `cappella`, `grotta`, `bilobata`, `galleria`, `antro`) o di quel ruolo (`anticamera`, `uscita`, `tesoro`...): per guardare i piani senza girarli (docs/sotterraneo/piani.md)
function stanzaDaProva(c) {
  const q = new URLSearchParams(location.hash.slice(1)).get('stanza')
  // `#stanza=relitto` (o `acqua`, `nicchia`, `portone`, `al-portale`, `al-scala-su`): l'eroe sta a tre celle dal primo relitto (o dalla prima pozza, davanti alla prima
  // nicchia, al portone del grosso) e lo guarda, per vedere l'ombra che fa (docs/sotterraneo/piani-caverne.md)
  const liv = c.livello
  const bersaglio = q === 'relitto' ? liv.relitti[0] : q === 'acqua' ? liv.stanze.flatMap(r => r.acqua)[0]
    : q === 'nicchia' ? liv.stanze.flatMap(r => r.nicchie)[0]
      : q === 'portone' ? liv.robe.find(r => r.che === 'porta' && r.pelle === 'bella')
        : q === 'al-portale' || q === 'al-scala-su' ? liv.robe.find(r => r.che === q.slice(3)) : null
  if (bersaglio) {
    const quasi = []
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const x = bersaglio.x + dx, y = bersaglio.y + dy
      if (Math.max(Math.abs(dx), Math.abs(dy)) >= 2 && liv.calpestabile(x, y) && !liv.robeSu(x, y).length) quasi.push({ x, y, d: Math.abs(Math.hypot(dx, dy) - 3) })
    }
    const dove = quasi.sort((a, b) => a.d - b.d)[0]
    if (!dove) return
    c.eroe = { x: dove.x + 0.5, y: dove.y + 0.5 }
    c.giraVerso(bersaglio.x - dove.x, bersaglio.y - dove.y)
    c.segnaLaStanza()
    c.aggiornaLuce()
    const qui = liv.stanzaDi(dove.x, dove.y)
    if (qui) luceDaProva(c, qui)
    return
  }
  // `corridoio`: l'eroe nel tratto più lungo di corridoio (fuori dalle stanze), per guardare le pareti strette
  if (q === 'corridoio') {
    const liv = c.livello, nelle = new Set(liv.stanze.flatMap(r => r.suolo.map(k => k.y * liv.largo + k.x)))
    const fuori = (x, y) => liv.calpestabile(x, y) && !nelle.has(y * liv.largo + x)
    let meglio = null, punti = -1
    for (let y = 0; y < liv.alto; y++) for (let x = 0; x < liv.largo; x++) {
      if (!fuori(x, y) || liv.robeSu(x, y).length) continue
      let n = 0
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (fuori(x + dx, y + dy)) n++
      if (n > punti) { punti = n; meglio = { x, y } }
    }
    if (!meglio) return
    c.eroe = { x: meglio.x + 0.5, y: meglio.y + 0.5 }
    c.segnaLaStanza()
    c.aggiornaLuce()
    return
  }
  // `grande`: la stanza più grande del piano (in ogni famiglia di piante, per i confronti fra paesaggi); `angolo`: il suo angolo in alto a sinistra
  const s = q === 'grande' || q === 'angolo' ? c.livello.stanze.reduce((a, b) => (b.suolo.length > a.suolo.length ? b : a), c.livello.stanze[0])
    : q && c.livello.stanze.find(r => r.forma === q || r.ruolo === q)
  if (!s) return
  // la cella della stanza più lontana da ogni mostro (al centro c'è spesso un branco: sarebbe uno scontro subito)
  const mostri = c.livello.robe.filter(r => r.che === 'mostro')
  const lontano = r => mostri.reduce((m, o) => Math.min(m, Math.hypot(o.x - r.x, o.y - r.y)), 99)
  // `grande` sta in mezzo alla stanza (per le foto dei paesaggi: la stanza tutta intorno)
  const mx = s.suolo.reduce((a, r) => a + r.x, 0) / s.suolo.length, my = s.suolo.reduce((a, r) => a + r.y, 0) / s.suolo.length
  const quieti = s.suolo.filter(r => !c.livello.robeSu(r.x, r.y).length && lontano(r) >= 6)   // non accanto a un mostro: sarebbe uno scontro
  const dove = q === 'angolo' ? s.suolo.filter(r => !c.livello.robeSu(r.x, r.y).length).reduce((b, r) => (r.x + r.y < b.x + b.y ? r : b), s.suolo[0])
    : q === 'grande' && quieti.length ? quieti.reduce((b, r) => (Math.hypot(r.x - mx, r.y - my) < Math.hypot(b.x - mx, b.y - my) ? r : b), quieti[0])
    : s.suolo.reduce((b, r) => (lontano(r) > lontano(b) ? r : b), s.suolo[0])
  c.eroe = { x: dove.x + 0.5, y: dove.y + 0.5 }
  c.segnaLaStanza()
  c.aggiornaLuce()
  luceDaProva(c, s)
}

// `#luce=stanza` accende tutta la stanza (e il giro di muro), a piena forza: per fotografare l'arredo senza girare il cono
// `#luce=ricordo` la segna solo vista: il cono resta, il resto è memoria (roba in luce, al bordo e nel ricordo nella stessa foto)
function luceDaProva(c, s) {
  const prova = new URLSearchParams(location.hash.slice(1)).get('luce')
  if (prova !== 'stanza' && prova !== 'ricordo') return
  const base = c.aggiornaLuce.bind(c)
  c.aggiornaLuce = () => {
    base()
    for (const [x, y] of c.livello.celleDellaLuce(s)) {
      const k = y * c.livello.largo + x
      if (prova === 'stanza') { c.luce.add(k); c.forzaLuce.set(k, 1) }
      c.visto[k] = 1
    }
  }
  c.aggiornaLuce()
}

// `#sotterraneo=leggendario` posa un leggendario accanto all'ingresso, come se fosse appena caduto: per guardare la
// festa senza aspettare la fortuna di una sera intera
function leggendarioDaProva(c) {
  if (new URLSearchParams(location.hash.slice(1)).get('sotterraneo') !== 'leggendario') return
  const k = pescaLeggendario({ livello: c.livelloDelBottino, rnd: Math.random, tua: x => c.porta(x) })
  c.posaPezzo(k, { x: Math.floor(c.eroe.x) + 1, y: Math.floor(c.eroe.y) })
}

// `#preparati=1` (o `&preparati=scudo-arcano,rovi`) fa imparare all'eroe gli incantesimi che si preparano dal campo, gli riempie il globo e li
// lancia (`&preparati=impara` li fa solo imparare): per guardare il campo con un incanto addosso e lo scontro che comincia protetto (docs/sotterraneo/orologio.md). Prima di `branco`
function preparatiDaProva(c) {
  const q = new URLSearchParams(location.hash.slice(1)).get('preparati')
  if (!q) return
  const tutti = (RAMI[c.chiEro] || []).flatMap(r => r.nodi).filter(preparabile).map(n => n.id)
  const voluti = q === '1' || q === 'impara' ? tutti : q.split(',').filter(id => tutti.includes(id))
  c.crescita = { ...c.crescita, albero: { ...c.crescita.albero, ...Object.fromEntries(voluti.map(id => [id, 1])) } }
  c.energia = c.energiaMax
  if (q !== 'impara') for (const id of voluti) c.preparaDalCampo(id)
}

// `#sotterraneo=branco&mostri=6` apre subito uno scontro con quei mostri attorno all'eroe (`&grosso=ossuto` mette al centro un
// mostro grosso, `&agguato=1` fa colpire alle spalle, `&sorpresa=1` lo fa dormire), per guardare lo scontro a gruppi senza
// cercare una stanza piena (docs/sotterraneo/scontro.md, «Nei test»)
const BRANCO = ['goblin', 'scheletro', 'ratto', 'orco', 'pipistrello', 'lupo']
function brancoDaProva(c) {
  const h = new URLSearchParams(location.hash.slice(1))
  if (h.get('sotterraneo') !== 'branco') return
  const n = Math.max(1, Math.min(8, Number(h.get('mostri')) || 3))
  const ex = Math.floor(c.eroe.x), ey = Math.floor(c.eroe.y)
  const stanza = c.livello.stanzaDi(ex, ey)
  const libere = []
  for (let y = ey - 4; y <= ey + 4; y++) for (let x = ex - 4; x <= ex + 4; x++) {
    if ((x === ex && y === ey) || !c.livello.calpestabile(x, y) || c.livello.robeSu(x, y).length) continue
    if (c.livello.stanzaDi(x, y) !== stanza || Math.hypot(x + 0.5 - c.eroe.x, y + 0.5 - c.eroe.y) > 4.4) continue
    libere.push({ x, y, d: Math.hypot(x - ex, y - ey) })
  }
  // l'agguato viene da dietro (l'eroe guarda a destra); se no, davanti
  const dietro = h.get('agguato') ? -1 : 1
  libere.sort((a, b) => (a.d - b.d) || (dietro * (b.x - a.x)))
  const grosso = h.get('grosso')
  // `&tipo=scheletro` o una lista `&tipo=scheletro,zombie` (a giro); `&variante=mago&grado=raro` (anche in lista, a giro) scelgono la
  // variante armata e il suo grado (dati/varianti.js), `semplice` quella senza arma; senza, le pesca il caso del piano
  const lista = nome => (h.get(nome) || '').split(',').filter(Boolean)
  const tipi = lista('tipo'), varianti = lista('variante'), gradi = lista('grado')
  // sul campo i mostri stanno a due o tre caselle, nella luce ma non addosso all'eroe
  const scelte = h.get('campo') ? (libere.filter(l => l.d >= 2 && l.d <= 3.2).slice(0, n).length ? libere.filter(l => l.d >= 2 && l.d <= 3.2).slice(0, n) : libere.slice(-n)) : libere.slice(0, n)
  const fatti = scelte.map(({ x, y }, k) => grosso && k === 0
    ? c.livello.mostroGrosso(grosso, x, y)
    : c.livello.mostro(tipi.length ? tipi[k % tipi.length] : BRANCO[k % BRANCO.length], x, y,
                       { variante: varianti.length ? varianti[k % varianti.length] : undefined, grado: gradi.length ? gradi[k % gradi.length] : undefined }))
  if (!fatti.length) return
  c.livello.robe.push(...fatti)
  if (h.get('agguato')) fatti.sort((a, b) => a.x - b.x)
  fatti.forEach(m => { m.sveglio = !h.get('sorpresa') })
  // `&campo=1`: i mostri stanno lì, addormentati (calmi), e non si apre nessuno scontro (per guardarli sul campo); `&campo=sveglio`: svegli, e vengono
  if (h.get('campo')) { fatti.forEach(m => { m.sveglio = h.get('campo') === 'sveglio'; if (!m.sveglio) { m.fx = m.x + 0.5; m.fy = m.y + 0.5; m.casa = { x: m.x, y: m.y }; m.calmo = 600 } }); return }
  c.scontro(fatti[0], { tocco: !!h.get('sorpresa') })
}

function avvia(i, { prova = false } = {}) {
  // una discesa rossa non si scende: la guardia sta davanti all'ingresso (viste/Terra.vue, docs/sotterraneo/zone.md).
  // `prova`: il cheat `#giu=` scende lo stesso, per guardarla
  const z = tappe.value[i]
  if (!prova && z && z.colore === 'rosso') return
  togli()          // vedi `riprendiDiscesa`: si scende, non si scende in pausa
  scorda()
  tappaIdx.value = i
  fine.value = null
  domanda.value = null
  chiudiLaBarra()
  // la discesa com'è adesso: finita la storia la zona con la sua fascia, prima quella della storia
  let t = i === INDICE_ABISSO ? L_ABISSO : zonaDi(i, potenzaDi(qui.value, i, livelloOra.value, forzaOra.value))
  // `#scenario=ghiaccio` (solo nel 3D, solo col cheat che scende): la discesa vestita da quel paesaggio (dati/paesaggi.js), per guardarlo
  if (prova && in3d) t = inPaesaggio(t, new URLSearchParams(location.hash.slice(1)).get('scenario'))
  corsa.value = new Corsa(t, { seme: semeDallIndirizzo(), eroe: eroeQui(), roba: roba.value,
                               crescita: crescita.value, missioni: presePer(missioni.value, t.chiave), conti: qui.value.conti })
  corsa.value.botti = in3d   // le botti da rompere sono solo del 3D (motore/botti.js)
  corsa.value.pergameneTrovabili = dopoLaMissione(COSE['pergamena-portale'].dopo, missioni.value)   // si trova solo dopo la missione dell'incantatrice
  borsellino = borsa(CHIAVE)
  corredoDaProva(corsa.value)
  torciaDaProva(corsa.value)
  pianoDaProva(corsa.value)
  stanzaDaProva(corsa.value)
  versoDaProva(corsa.value)
  leggendarioDaProva(corsa.value)
  preparatiDaProva(corsa.value)
  brancoDaProva(corsa.value)
  nuovoGiro({ nuovo: true })
  suono.nota(180, 90, 0.4, 'sawtooth', 0.12)
  nextTick(() => accendi())
}

function accendi() {
  if (!tela.value || !corsa.value) return
  if (in3d) return accendi3d()
  // il canvas di prima è stato smontato tornando alle discese: il pittore va riagganciato al nuovo
  if (!pittore) pittore = new Tela(tela.value)
  else pittore.attacca(tela.value)
  pittore.misura()
  pittore.zoomA(Number(new URLSearchParams(location.hash.slice(1)).get('zoom')) || pittore.scala)   // `#zoom=2`: più campo, per le foto
  pittore.segui(corsa.value.livello, corsa.value.eroe.x, corsa.value.eroe.y)
  pittore.mostra({ corsa: corsa.value, orologio })   // il primo quadro c'è subito: rientrando si nasce dietro il velo della pausa, e il giro non disegna finché si è fermi
  pittore.avvia()
  giro()
}

/* ═══════════ il disegno 3D (scena3d/, docs/sotterraneo/grafica-3d.md) ═══════════
   Lo stesso posto della tela 2D: il pittore riceve la corsa a ogni fotogramma e la disegna. Il modulo (e three) si caricano solo
   qui, la prima volta che si scende. Se il contesto WebGL si perde la discesa si salva come con la ✕ e si dice cosa è successo */
const strato = ref(null)
const perso3d = ref(false)
const agganci = new Map()   // le scritte dello scontro sopra le figure (viste/Scontro3d.vue), anche prima che il pittore ci sia
function aggancia(chi, el) {
  if (el) agganci.set(chi, el); else agganci.delete(chi)
  if (pittore && pittore.aggancia) pittore.aggancia(chi, el)
}
async function accendi3d() {
  if (pittore && pittore.canvas !== tela.value) { pittore.distruggi(); pittore = null }
  if (!pittore) {
    let m = null
    try { m = await import('./scena3d/indice.js') } catch (e) { perso3d.value = true; return }
    if (!tela.value || !corsa.value || pittore) return
    const dpr = Number(new URLSearchParams(location.hash.slice(1)).get('dpr')) || undefined   // `&dpr=2`: per le foto
    const spegni = (new URLSearchParams(location.hash.slice(1)).get('spegni') || '').split(',').filter(Boolean)   // `&spegni=nebbia`: per misurare
    pittore = m.creaSotterraneo3d(tela.value, { strato: strato.value, perso: siPerdeIl3d, dpr, spegni, cieca: CIECA,
                                               bersaglio: scegliIlBersaglio, accorcia: () => racconto.accorcia(),
                                               // una botte rotta (solo il 3D, un passatempo): un tonfo di legno e basta
                                               botteRotta: () => { suono.nota(170, 70, 0.18, 'square', 0.09); suono.rumore(0.16, 0.1, 1600, 400) } })
    if (!pittore) { siPerdeIl3d(); return }
    for (const [chi, el] of agganci) pittore.aggancia(chi, el)
    if (typeof window !== 'undefined') window.__sotterraneo3d = pittore   // per le prove: grafica(), aSchermo(), statoDi()
  }
  pittore.misura()
  pittore.zoomA(Number(new URLSearchParams(location.hash.slice(1)).get('zoom')) || pittore.scala)
  pittore.mostra({ corsa: corsa.value, orologio, fx: racconto.fx })
  pittore.avvia()
  giro()
}
function siPerdeIl3d() {
  salva({ subito: true })   // come la ✕: rientrando si riprende giù, anche dal Sotterraneo di sempre
  cancelAnimationFrame(raf)
  if (pittore) { try { pittore.distruggi() } catch (e) { /* il contesto è già andato */ } }
  pittore = null
  perso3d.value = true
}

// il tempo lo tiene questo file, non il motore: passo(dt) è pura, e il banco può farla girare mille volte in un millisecondo
// misurato sul foglio vero (una quota fissa non funzionerebbe: una domanda disegnata è alta il doppio di due righe di
// testo); rilettura ogni sei fotogrammi perché è una misura del DOM. Lo scontro non c'entra: sta al centro, misura zero.
let altoFoglio = 0, contaGiri = 0
function misuraFoglio() {
  if (in3d) {
    // in 3D conta solo il pannello dello scontro, che alza i combattenti; i fogli dell'esplorazione (porta, forziere, fonte…)
    // stanno sopra la scena come un velo e la telecamera non si muove (l'utente, 16 ottobre: «è più un overlay»)
    const f = corsa.value && corsa.value.foglio && corsa.value.foglio.che === 'scontro' ? document.querySelector('[data-pannello3d]') : null
    const campo = tela.value && tela.value.getBoundingClientRect()
    altoFoglio = f && campo ? Math.max(0, campo.bottom - f.getBoundingClientRect().top) : 0
    return
  }
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
    if (!c || c.finita || fermo.value || !pittore) return
    // l'orologio si muove DOPO: contarlo anche in pausa farebbe sparire all'istante la riga lasciata a metà
    orologio += dt
    c.passo(dt)
    // col foglio aperto la telecamera alza l'eroe (lo scontro no: sta al centro e non chiede spazio)
    if ((contaGiri++ % 6) === 0) misuraFoglio()
    // ogni tanto, non a ogni fotogramma: una discesa salvata sono un paio di chilobyte
    if (orologio - ultimoSalvato > 8) salva()
    pittore.segui(c.livello, c.eroe.x, c.eroe.y, altoFoglio)
    pittore.mostra({ corsa: c, orologio, fx: racconto.fx })
    posaLaRotta(c)
    guarda(c)
    pensaGiu(c)
    posaIlPensiero(c)
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
            // tutte le caselle: uno scudo raccolto camminandoci sopra va nella mancina, un anello al dito
            `|${c.mano}|${c.mancina}|${c.corpo}|${c.collo}|${c.dito}|${c.dito2}` +
            `|${c.torciaResta}|${c.torceInScorta}` +   // la torcia cala da sola, camminando
            `|${c.foglio ? c.foglio.cosa || '' : ''}|${c.livello.robe.length}` +   // due cose trovate di fila hanno lo stesso `che`
            `|${c.crescita.esp}|${c.crescita.forza}.${c.crescita.destrezza}.${c.crescita.intelligenza}.${c.crescita.tempra}` +
            `|${c.energia}|${c.pronta}|${JSON.stringify(c.crescita.albero)}|${c.crescita.caselle}` +   // le abilità
            `|${c.preparati.map(p => p.id + Math.ceil(p.passi)).join()}` +   // gli incanti preparati, che calano camminando
            `|${c.livello.robe.reduce((n, r) => n + (r.che === 'mostro' && r.sveglio ? 1 : 0), 0)}`   // il mostro grosso che si sveglia
  if (f !== firma) { firma = f; tic.value++ }
  while (c.eventi.length) festeggia(c.eventi.shift(), c)
  if (c.avvisi.length) {
    const a = c.avvisi.shift()
    avviso.value = typeof a === 'string' ? { testo: a } : { ...a, ...(COSE[a.cosa] || {}) }
    ultimoAvviso = orologio
  } else if (avviso.value && orologio - ultimoAvviso > 1.8) avviso.value = null
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
  const prima = fotoPrima(c)
  const esito = c.rispondi(giusto, { saltata })
  tic.value++
  salva()
  if (!esito) return
  mostra(esito, prima)
}

// quello che si vede e si sente di un turno: lo scontro si racconta (viste/racconto.js) e i suoni li dà lui; il resto fa il suo
// suono giusto
function mostra(esito, prima) {
  if (esito.azioni && prima) {
    raccontaLoScontro(prima, esito.azioni, { dopo: () => {
      if (esito.ringhia) suono.nota(110, 60, 0.45, 'sawtooth', 0.1)   // il mostro ringhia
      if (esito.che === 'svenuto') suono.fine()
    } })
    return
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
// le altre due scelte dello stop (la terza, scappare, è `scappa`): bere la pozione della barra, o riprendere a rispondere
function ringhioBevi() { bevutaNelloScontro() }
function chiudiFoglio() { corsa.value.chiudi(); domanda.value = null; tic.value++ }
// "riprovo" rimette in piedi all'ingresso, tranne all'ultima occasione dove riprendi() risale e la discesa è finita
function riprendi() {
  const c = corsa.value
  c.riprendi()
  tic.value++
  if (c.finita) chiudi()
}
function usa(i, dove = null) {
  const e = corsa.value.usa(i, dove)
  // la pergamena: lo zaino si chiude, e il portale appena aperto si vede (motore/corsa.js, apriLaPergamena)
  if (e && e.che === 'portale') { zainoAperto.value = false; suono.nota(260, 880, 0.5, 'sine', 0.12) }
  tic.value++; suono.ok(); salva()
}
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
  // con più stadi si sceglie quale (ScegliPozione.vue); con un tipo solo si beve e basta
  if (c.scelteDiCura().length > 1) { sceltaPozione.value = true; return }
  usa(i)
}
// la scelta fatta: nello scontro si beve e tocca ancora a te (anche dallo stop del pericolo), fuori si beve e basta
const sceltaPozione = ref(false)
const scelteDiPozione = dallaCorsa(c => c.scelteDiCura().map(t => ({ ...t, nome: COSE[t.k].nome, em: COSE[t.k].em, sprite: COSE[t.k].sprite, tutta: !!COSE[t.k].tutta })), [])
// il foglio che non ha più niente da scegliere si spegne da sé: un `v-if` che resta vero riapparirebbe alla prossima pozione
watch(() => scelteDiPozione.value.length, n => { if (n < 2) sceltaPozione.value = false })
function bevutaScelta(i) {
  sceltaPozione.value = false
  const c = corsa.value
  if (!c) return
  if (c.foglio && c.foglio.che === 'scontro') return bevutaNelloScontro(i)
  usa(i)
}
// La casella degli incanti (docs/sotterraneo/orologio.md): apre la scelta di quelli da preparare, giù; sopra e senza incanti noti la
// stessa finestra dice perché non c'è niente da scegliere. I globi aprono l'eroe (apriPaginaEroe), non questa
function apriIncanti() {
  const c = corsa.value
  if (c && (c.foglio || c.finita)) return
  const aprire = !preparatiAperti.value
  if (c) apriDallaBarra(null)
  else { chiudiBottega(); zainoSopra.value = false; paginaEroe.value = false; diarioSopra(false) }
  preparatiAperti.value = aprire
  suono.ok()
}
// gli incantesimi che si possono preparare adesso: con quanto costano, cosa fanno, perché no e quanti passi hanno già addosso
const preparabiliVisti = dallaCorsa(c => c.preparabili().map(nodo => {
  const ramo = RAMI[c.io.chiave].find(r => r.chiave === nodo.ramo)
  const addosso = c.preparati.find(p => p.id === nodo.id)
  return { id: nodo.id, nome: nodo.nome, glifo: nodo.glifo, tinta: ramo && ramo.tinta, costo: c.costoDi(nodo), dice: c.diceIlPreparato(nodo),
           perche: c.perchéNonPrepari(nodo.id), passi: addosso ? Math.ceil(addosso.passi) : 0 }
}))
function preparaDalCampo(id) {
  const c = corsa.value
  if (!c || c.foglio || !c.preparaDalCampo(id)) return
  tic.value++
  suono.nota(659, 988, 0.14, 'triangle', 0.1)
  salva()
}
// una discesa nuova o ripresa nasce senza niente aperto sopra il campo
function chiudiLaBarra() {
  preparatiAperti.value = false
  zainoAperto.value = false
  diarioGiu.value = false
  mappaGrande.value = false
  vedutaSopra.value = false
  paginaEroe.value = false
  tesoriAperti.value = false
  zainoSopra.value = false
}
// lo zaino e il diario si aprono uno alla volta, e chiudono la mappa grande
function apriDallaBarra(che) {
  mappaGrande.value = false
  preparatiAperti.value = false
  paginaEroe.value = false
  zainoAperto.value = che === 'zaino'
  diarioGiu.value = false
}
// il diario di sopra sta in Campagna.vue (con «vai da …»): da qui lo si apre e lo si chiude
const diarioSopra = su => { if (campagnaEl.value) campagnaEl.value.apriDiario(su) }
// La finestra dell'eroe ha quattro schede (viste/SchedeEroe.vue): lo zaino, le caratteristiche, l'albero, le missioni. Si passa
// dall'una all'altra senza chiudere; sopra lo zaino è quello della terra (zainoSopra), giù quello della discesa
// passare da una scheda all'altra non rifà crescere la finestra: per 160 ms il tasto stava 20 px più in là
const cambioScheda = ref(false)
let fineCambio = 0
function apriScheda(s) {
  cambioScheda.value = true
  clearTimeout(fineCambio)
  fineCambio = setTimeout(() => { cambioScheda.value = false }, 400)
  preparatiAperti.value = false
  if (s === 'missioni') {
    paginaEroe.value = false
    tesoriAperti.value = false
    zainoAperto.value = false
    zainoSopra.value = false
    if (corsa.value) diarioGiu.value = true
    else { chiudiBottega(); diarioSopra(true) }
    return
  }
  diarioGiu.value = false
  diarioSopra(false)
  if (s === 'zaino') {
    paginaEroe.value = false
    tesoriAperti.value = false
    if (corsa.value) zainoAperto.value = true
    else { chiudiBottega(); zainoSopra.value = true }
    return
  }
  zainoAperto.value = false
  zainoSopra.value = false
  facciaEroe.value = s === 'abilita' ? 'abilita' : 'eroe'
  paginaEroe.value = true
}
watch(mappaGrande, g => { if (pittore) pittore.mappaGrande = g })
// un foglio che si apre (un mostro, una porta) chiude la mappa grande: si guarda quello
watch(foglio, f => { if (f) { mappaGrande.value = false; preparatiAperti.value = false } })

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
  preparatiAperti.value = false
  zainoAperto.value = false
  diarioGiu.value = false
  paginaEroe.value = false
  tesoriAperti.value = false
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
  nuovoGiro()      // un piano nuovo: il momento dell'entrata
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
  nellAvventura({ roba: c.roba, crescita: c.crescita, botteghe: alGiroNuovo(qui.value.botteghe), ...fatteGiu(c), ...conITrovati(c) })
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
  // Una zona vinta non tocca la storia (le stelle sono delle discese di allora), e non scrive niente: le zone le muove
  // il livello dell'eroe (motore/zone.js)
  if (e.vinta && !c.tappa.potenza) {
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

  fine.value = { vinta: e.vinta, titolo: c.tappa.nome, stelle, fatti: e,
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
  salendo = false
  if (pittore) pittore.ferma()
  // il 3D si butta col campo: la scheda video non tiene un piano che nessuno guarda (alla prossima discesa si rifà)
  if (in3d && pittore) { pittore.distruggi(); pittore = null }
  fine.value = null
  domanda.value = null
  corsa.value = null
  pensiero.value = null
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

/* ═══════════ i pensieri dell'eroe (motore/pensieri.js, docs/sotterraneo/pensieri.md) ═══════════
   Un fumetto a bolle sopra la testa, ogni tanto: come sta e cosa gli piacerebbe avere. Giù si guarda nel giro dei fotogrammi (tempo
   di gioco, fermo con la pausa), mai con un pannello, uno scontro, un avviso o una festa a schermo; sopra lo chiede la terra quando
   l'eroe è fermo (`pensa`). La memoria sta nell'avventura (`pensieri`). Un tocco su un pensiero col segno accende la cosa giusta
   (la casella della barra, il mercante) per RITMO.segno secondi, e non apre niente. `#pensieri=no` li spegne (per le prove) */
const pensieriSpenti = typeof location !== 'undefined' && new URLSearchParams(location.hash.slice(1)).get('pensieri') === 'no'
const pensiero = ref(null)          // { id, testo, icona, tono, segno, giro }
const pensieroEl = ref(null)
let pensieroFino = 0, giroDa = 0, entrataDa = null, prossimoPensiero = 0
const mercantiTrovati = ref([])
const segnoAcceso = ref(null)       // il selettore della cosa accesa dal tocco
let segnoFino = 0
usaGuida(radice, computed(() => (segnoAcceso.value ? { dove: segnoAcceso.value } : null)))
const SEGNI_DELLA_BARRA = { zaino: '[data-casella-barra="zaino"]', eroe: '[data-azione="eroe-pagina"]', abilita: '[data-azione="abilita"]',
                            incanti: '[data-casella-barra="incanti"]', pozione: '[data-casella-barra="pozione"]' }
// il giro della discesa (la tappa e il seme: ripresa è la stessa), e da quando si è entrati in un piano
function giroGiu() { return corsa.value ? giroDi(tappaIdx.value, corsa.value.seme) : null }
function nuovoGiro({ nuovo = false } = {}) {
  pensiero.value = null
  giroDa = orologio
  entrataDa = orologio
  if (nuovo && !pensieriSpenti) nellAvventura({ pensieri: entraNelGiro(qui.value.pensieri, giroGiu()) })
}
// giù: niente aperto, niente in corso, niente che si stia già leggendo
const liberoGiu = () => siGioca.value && !fermo.value && !foglio.value && !zainoAperto.value && !diarioGiu.value && !preparatiAperti.value &&
  !paginaEroe.value && !mappaGrande.value && !festa.value && !avviso.value && !sceltaPozione.value && !perdendo.value && !nemico.value
function dillo(p) {
  pensiero.value = p
  nellAvventura({ pensieri: ricordaPensiero(qui.value.pensieri, p, { adesso: Date.now() }) })
}
function pensaGiu(c) {
  if (pensieriSpenti) return
  const libero = liberoGiu()
  if (pensiero.value) {
    if (!libero || orologio >= pensieroFino) pensiero.value = null
    return
  }
  if (!libero) return
  let momento = null
  if (entrataDa != null && orologio - entrataDa >= RITMO.primoEntrata) { momento = 'entrata'; entrataDa = null }
  else if (orologio - giroDa >= RITMO.primoCammino && orologio >= prossimoPensiero) { momento = 'cammino'; prossimoPensiero = orologio + RITMO.ogni }
  if (!momento) return
  const p = scegliPensiero(situazioneDi(c), qui.value.pensieri, { momento, adesso: Date.now(), giro: giroGiu() })
  if (!p) return
  pensieroFino = orologio + RITMO.dura
  dillo(p)
}
// il fumetto sopra la testa, a ogni fotogramma: dentro il campo, e sotto i piedi se sopra non c'è posto (la coda segue l'eroe)
function posaIlPensiero(c) {
  const el = pensieroEl.value
  if (!el || !pittore || !pittore.testaDi) return
  const t = pittore.testaDi(c), W = tela.value ? tela.value.clientWidth : 0
  const w = el.offsetWidth, h = el.offsetHeight
  const left = Math.round(Math.max(6, Math.min(W - w - 6, t.x - w / 2)))
  let top = Math.round(t.y - h - 8), sotto = false
  if (top < 6) { const piedi = pittore.schermoDi(c.eroe.x, c.eroe.y + 0.6); top = Math.round(piedi.y + 10); sotto = true }
  el.style.transform = `translate(${left}px, ${top}px)`
  el.style.setProperty('--coda', Math.round(Math.max(14, Math.min(w - 14, t.x - left))) + 'px')
  if ((el.dataset.sotto === '1') !== sotto) el.dataset.sotto = sotto ? '1' : '0'
}
// sopra: la terra chiede quando l'eroe è fermo da un po' (viste/Terra.vue, `pensa`); i numeri sono quelli della roba di sopra
function pensaSopra() {
  if (pensieriSpenti || pensiero.value || corsa.value || banco.value || zainoSopra.value || paginaEroe.value || preparatiAperti.value ||
      scegliEroe.value || state.festa.length) return
  const c = new Corredo({ eroe: eroeQui(), roba: roba.value, crescita: crescita.value })
  const f = forze.value
  const s = situazioneDi(c, { mercanti: mercantiTrovati.value, vita: f ? f.vita : 0, vitaMax: f ? f.vitaMax : 0 })
  const p = scegliPensiero(s, qui.value.pensieri, { adesso: Date.now() })
  if (p) dillo(p)
}
// il tocco: accende il segno (la casella della barra, o il mercante, e allora l'eroe gli va accanto); il fumetto se ne va
function toccaPensiero(p = pensiero.value) {
  if (!p || !p.segno) return
  const k = p.segno.startsWith('mercante:') ? p.segno.slice(9) : null
  segnoAcceso.value = k ? `[data-mercante="${k}"]` : SEGNI_DELLA_BARRA[p.segno] || null
  clearTimeout(segnoFino)
  segnoFino = setTimeout(() => { segnoAcceso.value = null }, RITMO.segno * 1000)
  if (k && campagnaEl.value) campagnaEl.value.vaDaMercante(k)
  pensiero.value = null
  suoni.passo()
}
// la casella o il mercante toccati davvero: il segno ha fatto il suo
watch([zainoAperto, paginaEroe, preparatiAperti, banco, zainoSopra], v => { if (v.some(Boolean)) segnoAcceso.value = null })

/* ═══════════ il dito ═══════════ */
const dita = new Map()
let pizzico = 0, premuto = false, giu = null, ultimoTrascina = 0

function punto(e) {
  const r = tela.value.getBoundingClientRect()
  return { x: e.clientX - r.left, y: e.clientY - r.top }
}

function premi(e) {
  if (in3d && e.pointerType === 'mouse' && e.button !== 0) return   // il mouse conta solo col tasto sinistro premuto
  dita.set(e.pointerId, e)
  if (zainoAperto.value || diarioGiu.value || preparatiAperti.value || paginaEroe.value || fine.value) return
  // nello scontro in 3D il campo si tocca: un mostro lo fa bersaglio, altrove si accorcia il racconto
  if (in3d && corsa.value && corsa.value.foglio && corsa.value.foglio.che === 'scontro') { if (pittore) pittore.premi(punto(e)); return }
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
  if (!c || c.finita || !pittore) return
  // in 3D il tocco è un punta-e-clicca (scena3d/azione.js): la cosa sotto il dito, con un margine, e poi la strada del motore
  if (in3d) { if (preciso) pittore.premi(p); else pittore.trascina(p) } else c.vaiVerso(pittore.cellaDa(p.x, p.y), preciso)
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
// `#eroe=mago` sceglie l'eroe e `#giu=3` scende subito in quella discesa (l'indice della storia, o `abisso`): con gli altri
// cheat (`sotterraneo=branco`, `stanza=sala`, `seme=`) una schermata qualunque si guarda senza camminare (strumenti/scatta-app.mjs)
function scesaDaProva() {
  const h = new URLSearchParams(location.hash.slice(1))
  const e = h.get('eroe')
  if (e && EROI.some(x => x.chiave === e)) { chiEro.value = ricorda(CHIAVE, 'eroe', e); scegliEroe.value = false }
  // `#sotterraneo3d=2` scende nel 3D (anche coi giochi in prova spenti), come `#giu=2`
  const g = h.get('giu') ?? (in3d && h.get('sotterraneo3d') ? h.get('sotterraneo3d') : null)
  if (g == null || corsa.value) return
  const i = g === 'abisso' ? INDICE_ABISSO : Number(g)
  if (i === INDICE_ABISSO || (Number.isInteger(i) && i >= 0 && i < CAMPAGNA.length)) avvia(i, { prova: true })
}
scesaDaProva()
// `#bottega=armaiolo` (o `incantatrice`) apre subito quel banco (`&scheda=difese`), con l'eroe a `&livello=12` e `&roba=rara` (un raro per posto), `&roba=nuda`
// o quella attesa dalla storia, `&gemme=800` e `&zaino=pozione,ampolla-vita` (le sole cose in tasca): per guardare la bottega senza camminare
// fino al mercante (strumenti/scatta-app.mjs)
function bottegaDaProva() {
  const h = new URLSearchParams(location.hash.slice(1))
  const k = h.get('bottega')
  if (!k || !mercanteDi(k) || scegliEroe.value) return
  const L = Math.max(1, Math.min(100, Number(h.get('livello')) || 0))
  const gemme = Math.max(0, Number(h.get('gemme')) || 0)
  const tipo = h.get('roba')
  const finite = qui.value.tappa || 0
  const r = tipo === 'rara' ? robaRaraDi(eroeQui(), L || 12, { gemme }) : tipo === 'nuda' ? { ...ROBA_VUOTA(), gemme } : { ...robaAttesa(eroeQui(), finite), gemme }
  if (h.get('zaino') != null) r.zaino = h.get('zaino').split(',').filter(k => COSE[k])
  nellAvventura({ roba: r, ...(L ? { crescita: crescitaA(eroeDi(eroeQui()), L) } : {}) })
  apriBottega(k, h.get('scheda'))
}
bottegaDaProva()
if (!scegliEroe.value && !corsa.value) riprendiSeUscito()

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
  racconto.ferma()
  if (pittore) pittore.ferma()
  if (in3d && pittore) { pittore.distruggi(); pittore = null }
})
function ridimensiona() { if (pittore) pittore.misura() }
</script>

<template>
  <div class="schermo">
    <!-- il ⏸ solo dentro una discesa: sulla mappa non c'è niente da fermare -->
    <Barra :titolo="titolo" guida="sotterraneo" @aiuto="aiuto" :monete="!corsa" scura
           :pausa="siGioca" @pausa="metti()" @indietro="indietro">
      <!-- vita, gemme e zaino stanno nella barra in basso; attacco e difesa nella pagina dell'eroe (docs/sotterraneo/barra.md) -->
    </Barra>

    <!-- l'aspetto dei pannelli in prova (`#tema=legno|rilievo`, docs/sotterraneo/tema-pannelli.md) -->
    <div ref="radice" class="sot" :class="{ 'sot-cambio-scheda': cambioScheda }" :data-tema="ATTRIBUTO[tema]">
      <template v-if="!corsa">
        <!-- la chiave è l'eroe: cambiando avventura la terra di sopra rinasce con la nebbia e il posto suoi -->
        <Campagna ref="campagnaEl" :key="eroeQui()" :tappe="tappe" :ripresa="ripresa" :eroe="eroeScheda" :abisso="abisso"
                  :roba="robaSopra" :terra="qui.terra || null" @terra="ricordaTerra"
                  :disegno="in3d ? '3d' : null" :mondo="qui.mondo || null" @mondo="ricordaMondo"
                  :veduta="vedutaSopra" @veduta="v => { vedutaSopra = v }" @risposta="rispostaSopra"
                  :punti="barra.punti" :punti-abilita="barra.puntiAbilita" @scheda="apriScheda"
                  :annuncio="annuncio" @sentito="annuncioSentito" :forze="forze" @cura="curaDa"
                  :missioni="missioni" :conti="conti" :azione-missione="azioneMissione" :segui="segui" @segui="seguiMissione"
                  @gioca="i => avvia(i)" @riprendi="riprendiDiscesa" @scorda="scorda" @bottega="apriBottega"
                  :pensiero="pensiero" @pensa="pensaSopra" @pensiero="toccaPensiero" @pensiero-fine="pensiero = null"
                  @trovati="v => (mercantiTrovati = v)" />
        <p v-if="detto" class="sot-avviso sot-avviso-sopra" data-detto-sopra>{{ detto }}</p>
        <!-- la stessa barra di giù (docs/sotterraneo/barra.md): sopra la vita è piena e la mappa grande non c'è -->
        <BarraDiSotto sopra :mappa-sopra="in3d" :mappa="vedutaSopra" @mappa="vedutaSopra = !vedutaSopra" :vita="barra.vita" :vita-max="barra.vitaMax" :livello="barra.livello"
                      :esperienza="barra.esperienza" :esp-fatta="barra.espFatta" :esp-serve="barra.espServe" :punti="barra.punti" :pozioni="barra.pozioni" :pieni="barra.pieni"
                      :energia="barra.energia" :energia-max="barra.energiaMax" :punti-abilita="barra.puntiAbilita"
                      :tasche="barra.tasche" :gemme="barra.gemme" :preparabili="barra.preparabili" :missioni-pronte="barra.missioniPronte"
                      @bevi="dilloSopra(ferito ? '❤️ la guaritrice ti cura, gratis' : barra.pozioni ? '❤️ sei già in piena forma' : '🧪 non hai pozioni')"
                      @zaino="apriScheda('zaino')"
                      @incanti="apriIncanti" @eroe="apriPaginaEroe()" @abilita="apriPaginaEroe('abilita')" />
        <Zaino v-if="zainoDiSopra" v-bind="zainoDiSopra" :eroe="eroeScheda" :piano="0" sopra
               :punti="barra.punti" :punti-abilita="barra.puntiAbilita" :missioni="barra.missioniPronte" @scheda="apriScheda"
               @usa="usaSopra" @riponi="riponiSopra" @butta="() => {}" @tasca="compraTasca"
               @chiudi="zainoSopra = false" @fuori="e => { zainoSopra = false; fuoriDallaBottega(e) }" />
        <!-- gli incanti si preparano giù: sopra la casella apre la finestra che lo dice (docs/sotterraneo/barra.md) -->
        <Preparati v-if="preparatiAperti" sopra :voci="[]" :punti-abilita="barra.puntiAbilita"
                   @albero="apriPaginaEroe('abilita')" @chiudi="preparatiAperti = false" @fuori="e => { preparatiAperti = false; fuoriDallaBottega(e) }" />
        <!-- la bottega di un mercante di sopra: quasi a tutto schermo, la ✕ in alto a destra, niente domande.
             La chiave è il mercante: le linguette e la scelta ripartono da capo cambiando bottega -->
        <LaBottega v-if="banco" :key="banco.chi.chiave" v-bind="banco" :eroe="eroeScheda" :detto="dettoBanco" :scheda="schedaBanco"
                  chi-compra="al mercante, vicino al carro"
                  @compra="compraSopra" @vendi="vendiSopra" @riacquista="riacquistaSopra" @chiudi="chiudiBottega" @fuori="fuoriDallaBottega" />
        <Eroi v-if="scegliEroe" :avventure="avventure" :scelto="chiEro || ''" :primo="!chiEro"
              @scegli="scegli" @chiudi="chiudiLaScelta" />
      </template>

      <template v-else>
        <div class="sot-campo">
          <!-- il campo si tocca coi puntatori: il click che il dito lascia finirebbe sul foglio appena aperto -->
          <canvas ref="tela" class="sot-tela" :data-tela="in3d ? '3d' : '2d'"
                  @pointerdown="premi" @pointermove="muovi" @pointerup="lascia"
                  @pointercancel="lascia" @touchend="nienteClickDalCampo"
                  @wheel.prevent="rotella"></canvas>
          <!-- il 3D: le scritte sopra la scena (sonno, nomi, barre, mappina) e quelle dello scontro, agganciate alle figure -->
          <div v-if="in3d" ref="strato" class="sot3d-strato" data-strato3d></div>
          <Scontro3d v-if="in3d && nemico" v-bind="nemico" :fx="racconto.fx" :aggancia="aggancia" />

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

          <!-- il pensiero dell'eroe, sopra la testa (docs/sotterraneo/pensieri.md): si tocca solo se ha un segno da accendere,
               se no il tocco passa al campo -->
          <div v-if="pensiero" ref="pensieroEl" :key="pensiero.id + pensiero.testo" class="sot-pensiero sot-pensiero-giu"
               :class="['sot-pensiero-' + pensiero.tono, { 'sot-pensiero-tocca': pensiero.segno }]" data-pensiero
               :data-pensiero-id="pensiero.id" :data-tono="pensiero.tono" :data-segno="pensiero.segno || null"
               @pointerdown.stop @click.stop="toccaPensiero()">
            <span class="em sot-pensiero-icona">{{ pensiero.icona }}</span><span class="sot-pensiero-testo">{{ pensiero.testo }}</span>
            <i class="sot-pensiero-bolla"></i><i class="sot-pensiero-bolla sot-pensiero-bollina"></i>
          </div>

          <p class="sot-piede" :data-posto="eroe.posto || ''" :data-livello-posto="eroe.livelloPosto">
            <template v-if="eroe.posto">{{ eroe.posto }} · </template><template v-if="eroe.livelloPosto">livello {{ eroe.livelloPosto }} · </template>piano {{ eroe.piano }}<template v-if="eroe.piani"> di {{ eroe.piani }}</template> ·
            <span v-if="eroe.chiave" class="em">🗝️ la scala è aperta</span>
            <span v-else>la chiave ce l'ha qualcuno, qua sotto</span>
          </p>
          <p v-if="avviso" class="sot-avviso" :class="avviso.rarita ? 'sot-r-' + avviso.rarita : null">
            <Icona v-if="avviso.cosa" :sprite="avviso.sprite" :em="avviso.em" :emAlto="20" />
            {{ avviso.testo }}
          </p>

          <!-- il mostro grosso: la sua vita in cima, da quando ci si entra nella stanza (docs/sotterraneo/grossi.md) -->
          <div v-if="grosso" class="sot-grosso-vita" data-grosso :data-chi="grosso.chiave" :data-ossa="grosso.ossa">
            <span class="sot-grosso-faccia"><Grosso :chi="grosso.chiave" :scala="0.6" /></span>
            <span class="sot-grosso-dati">
              <b>{{ grosso.nome }}</b>
              <span class="sot-grosso-barra"><i :style="{ width: (grosso.ossa / grosso.ossaMax) * 100 + '%' }"></i>
                <small>❤️ {{ grosso.ossa }} / {{ grosso.ossaMax }}</small></span>
            </span>
          </div>

          <!-- le feste: un livello salito, un leggendario caduto. Non si toccano: il campo sotto sì -->
          <div v-if="festa && festa.che === 'livello'" class="sot-festa sot-festa-livello" data-livello-su :data-livello="festa.livello">
            <b>✨ Livello {{ festa.livello }}!</b>
            <small>Un punto per l'eroe e uno per le abilità</small>
          </div>
          <div v-else-if="festa && festa.che === 'leggendario'" class="sot-festa sot-festa-leggendario" data-leggendario
               :data-cosa="festa.cosa">
            <Icona :sprite="festa.sprite" :em="festa.em" :scala="3" :emAlto="34" />
            <b>{{ festa.nome }}</b>
            <i>{{ festa.storia }}</i>
          </div>
        </div>

        <!-- la barra in basso, come in Diablo: la vita e la luce nei globi, le caselle in mezzo. I fogli le salgono
             sopra (docs/sotterraneo/barra.md) -->
        <BarraDiSotto :vita="barra.vita" :vita-max="barra.vitaMax" :colpito="colpito" :livello="barra.livello"
                      :esperienza="barra.esperienza" :esp-fatta="barra.espFatta" :esp-serve="barra.espServe" :punti="barra.punti" :sale="sale"
                      :energia="barra.energia" :energia-max="barra.energiaMax" :punti-abilita="barra.puntiAbilita"
                      :pozioni="barra.pozioni" :pieni="barra.pieni" :tasche="barra.tasche" :gemme="barra.gemme"
                      :mappa="mappaGrande" :preparabili="barra.preparabili" :missioni-pronte="barra.missioniPronte"
                      :incanti="barra.incanti" @bevi="bevi" @zaino="apriDallaBarra('zaino')" @incanti="apriIncanti"
                      @mappa="mappaGrande = !mappaGrande" @eroe="apriPaginaEroe()" @abilita="apriPaginaEroe('abilita')" />

        <!-- lo scontro sta al centro, non sale dal basso: un mostro addosso arriva mentre si cammina, e in
             fondo allo schermo chi guarda il proprio eroe non lo vedrebbe. Niente classe `sot-foglio`
             apposta: `misuraFoglio()` cerca quella, e non trovandola la telecamera non fa spazio a un pannello -->
        <!-- in 3D lo scontro è nella scena: qui in fondo restano la scelta e la domanda (viste/Pannello3d.vue) -->
        <component :is="in3d ? Pannello3d : Cornice" v-if="nemico" scontro>
          <div :class="in3d ? 'sot3d-scelta' : 'sot-modale sot-modale-cornice'">
            <Scontro v-if="!in3d" v-bind="nemico" :fx="racconto.fx" @bersaglio="scegliIlBersaglio" @accorcia="racconto.accorcia" />
            <!-- prima si sceglie cosa fare (attacco, abilità, bere, scappare), poi compare la domanda per quel colpo
                 (docs/sotterraneo/abilita.md). Il pericolo non ha più un menu suo: è una riga sopra la stessa scelta -->
            <CaselleAbilita v-if="abilitaScontro && (!sceltaFatta || animando)" :key="animando ? 'racconto' : 'scelta'" v-bind="abilitaScontro"
                            :ferma="animando" :pericolo="animando ? null : abilitaScontro.pericolo"
                            @scegli="scegliColpo" @bevi="beviNelloScontro" @bevi-energia="beviEnergiaNelloScontro" @scappa="scappa" />
            <template v-else-if="domanda">
              <div v-if="abilitaScontro && abilitaScontro.scelta" class="sot-scelta sot-pronta sot-scelta-fatta" data-scelta-fatta>
                <Medaglione :glifo="abilitaScontro.scelta.glifo" :tinta="abilitaScontro.scelta.tinta" stato="preso" :misura="28" />
                <span class="sot-scelta-testo"><b>{{ abilitaScontro.scelta.nome }}</b><small>{{ abilitaScontro.scelta.dice }}</small></span>
              </div>
              <div class="sot-domanda">
                <Domanda :domanda="domanda.domanda" :pittori="domanda.pittori"
                         :origine="domanda" gioco="sotterraneo" :respiro="900"
                         @risposto="risposto" />
              </div>
            </template>
          </div>
        </component>

        <Foglio v-else-if="foglio && foglio.che === 'porta'" em="🚪" titolo="Una porta chiusa">
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
                :dice="foglio.chi.missione ? 'Quello che cercavi. Sbagliando non si perde: si riprova.'
                                           : 'Una domanda sola: sbagliata, resta chiuso per sempre.'">
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
                dice="Acqua limpida e fredda: rimette in forze.">
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
                :dice="foglio.chi && foglio.chi.senzaGemello ? 'Porta al villaggio. Per stasera basta: l\'abisso ti aspetta dove sei arrivato.'
                  : 'Porta al villaggio. Lassù, il suo gemello ti riporta qui.'">
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
                  ? 'Di qui si torna alla luce, con tutto quello che hai trovato.'
                  : 'Sotto è più buio, i mostri sono più duri e le domande più toste.'">
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
                dice="Il piano di sopra ti aspetta com'era.">
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
               :punti="barra.punti" :punti-abilita="barra.puntiAbilita" :missioni="barra.missioniPronte" @scheda="apriScheda"
               @usa="(t, dove) => usa(corsa.indiceDellaTasca(t), dove)" @butta="t => butta(corsa.indiceDellaTasca(t))" @riponi="riponi" @tasca="compraTasca"
               @chiudi="zainoAperto = false" @fuori="toccoFuori" />

        <!-- il diario delle missioni, giù: lo stesso di sopra, senza «vai da» (chi aspetta sta sopra) -->
        <Diario v-else-if="diarioGiu" giu :stati="missioni" :conti="conti" :tappe="tappe" :segui="segui" :punti="barra.punti" :punti-abilita="barra.puntiAbilita"
                @scheda="apriScheda" @chiudi="diarioGiu = false" @segui="seguiMissione" @fuori="toccoFuori" />

        <!-- gli incantesimi da preparare prima di uno scontro, dalla loro casella nella barra (docs/sotterraneo/orologio.md) -->
        <Preparati v-else-if="preparatiAperti" :voci="preparabiliVisti" :energia="eroe.energia" :energia-max="eroe.energiaMax" :punti-abilita="barra.puntiAbilita"
                   @prepara="preparaDalCampo" @albero="apriPaginaEroe('abilita')" @chiudi="preparatiAperti = false" @fuori="toccoFuori" />

        <Fine v-if="fine" v-bind="fine" @ancora="ancora" @esci="allaMappa" />
        <!-- quale pozione bere, con più stadi: sopra a tutto, anche allo scontro (docs/sotterraneo/roba.md, «Le pozioni») -->
        <ScegliPozione v-if="sceltaPozione && scelteDiPozione.length > 1" :scelte="scelteDiPozione" :manca="eroe.vitaMax - eroe.vita"
                       :nello-scontro="!!(foglio && foglio.che === 'scontro')"
                       @bevi="bevutaScelta" @chiudi="sceltaPozione = false"
                       @fuori="e => { sceltaPozione = false; if (!nemico) toccoFuori(e) }" />
      </template>

      <!-- la pagina dell'eroe e i Tesori, sopra e sotto: si chiudono con la ✕ o toccando fuori (e il tocco cammina) -->
      <PaginaAbilita v-if="albero && !tesoriAperti && !(corsa && foglio && foglio.che === 'scontro')" v-bind="albero" :missioni="barra.missioniPronte"
                     @impara="imparaAbilita" @casella="casellaAbilita" @dimentica="dimenticaAlbero" @scheda="apriScheda" @chiudi="paginaEroe = false"
                     @fuori="e => { paginaEroe = false; corsa ? toccoFuori(e) : fuoriDallaBottega(e) }" />
      <PaginaEroe v-else-if="pagina && facciaEroe === 'eroe' && !tesoriAperti && !(corsa && foglio && foglio.che === 'scontro')" v-bind="pagina" :missioni="barra.missioniPronte"
                  @dai="daiUnPunto" @tesori="tesoriAperti = true" @cambia="cambiaEroe" @chiudi="paginaEroe = false"
                  @scheda="apriScheda" @riassegna="riassegnaPunti"
                  @fuori="e => { paginaEroe = false; corsa ? toccoFuori(e) : fuoriDallaBottega(e) }" />
      <Tesori v-if="paginaEroe && tesoriAperti" :trovati="tesoriTrovati" @indietro="tesoriAperti = false"
              @chiudi="paginaEroe = false; tesoriAperti = false"
              @fuori="e => { paginaEroe = false; tesoriAperti = false; corsa ? toccoFuori(e) : fuoriDallaBottega(e) }" />

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
      <!-- il 3D si è fermato (la scheda video ha perso il contesto): la discesa è salvata, si esce pulito -->
      <div v-if="perso3d" class="sot3d-senza sot3d-perso" data-perso-3d>
        <h1>Il disegno 3D si è fermato</h1>
        <p>La discesa è salvata: la riprendi da qui o dal Sotterraneo di sempre.</p>
        <button type="button" class="sot-grosso" data-azione="esci-3d" @click="emit('vai', 'home')">torno ai giochi</button>
      </div>
    </div>
  </div>
</template>
