/* ═══════════════════════════════════════════════════════════════════
   QUALE GIOCO HA ANCORA QUALCOSA DA DARE A QUESTO BAMBINO

   Il ponte fra le campagne (che adesso dicono dove sta ogni tappa, in
   `portata`) e chi deve decidere se una carta va messa in home.
   `data/portata.js` fa il conto e non sa cosa sia un profilo; qui si
   mettono insieme le due cose, e si va a prendere l'età dove sta.

   ── PERCHÉ UN FILE E NON UNA RIGA IN `giochiAcceso` ──────────────
   Perché le campagne stanno in quattordici file diversi e importarle
   tutte da `store/profile.js` vorrebbe dire tirarsi dentro mezza
   applicazione da un modulo che oggi è quasi solo stato — e un anello di
   import è un guasto che si presenta mesi dopo, senza un motivo
   visibile. Qui invece l'unica cosa che si importa dallo store sono due
   letture (`etaDelBambino`, `saperiSpenti`), e la catena resta a senso
   unico.

   ── COSA NON FA ──────────────────────────────────────────────────
   Non spegne niente e non tocca `settings`. Un gioco che qui risulta
   fuori portata **non è spento**: l'interruttore dei genitori resta
   l'ultima parola, e questo è solo il conto che decide se la carta si
   offre da sola a chi non l'ha mai aperta. La differenza è quella di
   sempre — «acceso è l'assenza» — e qui si aggiunge una domanda, non un
   secondo interruttore.
   ═══════════════════════════════════════════════════════════════════ */
import { giocoDaOffrire, filaConPortata, primaDaGiocare, arcoDelGioco,
         statoDellaTappa, PASSATA, AVANTI } from './portata.js'
import { state, etaDelBambino, saperiSpenti, tappaAperta, tuttoAperto } from '../store/profile.js'
import { misure } from '../store/progressi.js'
import { GIOCHI_NUOVI } from '../giochi/indice.js'

import { SCALETTA } from './asteroidi.js'
import { CAMPAGNA as PIANETI } from './tabelline.js'
import { STAZIONI } from './calcolo.js'
import { CAMPAGNA as INGLESE } from './campagna-inglese.js'
import { CAMPAGNA as SPAGNOLO } from './campagna-spagnolo.js'
import { RACCONTO as CASTELLO } from './campagne-castello.js'
import { TAPPE as POZIONI } from './pozioni.js'
import { FILA as BANCARELLA } from './bancarella.js'
import { CAMPAGNE as GENERALE } from './campagne-generale.js'
import { CAMPAGNA as CONTA } from '../giochi/conta/dati/campagna.js'
import { CAMPAGNA as PRIMA_DOPO } from '../giochi/prima-dopo/dati/campagna.js'
import { CAMPAGNA as CODICE } from '../giochi/codice-segreto/dati/campagna.js'
import { CAMPAGNA as DUNGEON } from '../giochi/dungeon/dati/campagna.js'
import { CAMPAGNA as SURVIVORS } from '../giochi/survivors/dati/campagna.js'
import { CAMPAGNA as CORSA } from '../giochi/corsa/dati/campagna.js'
import { CAMPAGNA as SOTTERRANEO } from '../giochi/sotterraneo/dati/campagna.js'

/* La fila di tappe di ogni gioco, per la chiave con cui la home lo
   conosce. Chi non è qui dentro non ha una campagna — la fattoria e la
   cameretta sono posti, non scalette — e resta sempre alla portata di
   tutti: l'assenza vuol dire «non si giudica», non «si nasconde». */
export const TAPPE_DEL_GIOCO = {
  mate: SCALETTA.map(v => v.T),
  /* Gli asteroidi sono una fila sola a schermo ma **due campagne
     sotto**, con due contatori separati (`mate.tappa` per i pianeti,
     `calc.tappa` per le stazioni). Il lucchetto lavora su quegli indici
     lì, quindi gli servono le due file separate: `mate` è la fila intera
     e serve solo a decidere se la carta si vede in home. */
  'mate-pianeti': PIANETI,
  'mate-mente': STAZIONI,
  inglese: INGLESE,
  spagnolo: SPAGNOLO,
  torri: CASTELLO,
  castello: CASTELLO,
  pozioni: POZIONI,
  bancarella: BANCARELLA,
  generale: GENERALE.flatMap(c => c.tappe),
  conta: CONTA,
  'prima-dopo': PRIMA_DOPO,
  'codice-segreto': CODICE,
  dungeon: DUNGEON,
  survivors: SURVIVORS,
  corsa: CORSA,
  sotterraneo: SOTTERRANEO,
}

/* le regole che dipendono da questo bambino, lette una volta sola */
const regole = () => ({ eta: etaDelBambino(), spenti: saperiSpenti() })

/* ── l'ha già aperto? ──
   La domanda che salva tutto il resto: **un gioco cominciato non
   sparisce mai.** I giochi nuovi lo sanno dire da soli — ogni manifesto
   dichiara `albo.provato`, che è lì da prima e per un altro motivo (il
   traguardo «Tuttofare») — e i sette vecchi si riconoscono dal loro
   contatore, come già fa `store/progressi.js`. Nessun campo nuovo nel
   profilo: la domanda si sapeva già rispondere, non la si era mai fatta
   qui. */
const CONTATORE_VECCHIO = {
  mate: 'math', inglese: 'en', spagnolo: 'es', torri: 'torri',
  pozioni: 'pozioni', bancarella: 'clienti', generale: 'missioni',
}

export function giaProvato (chiave) {
  const t = (state.profile && state.profile.totals) || {}
  const vecchio = CONTATORE_VECCHIO[chiave]
  if (vecchio) return (t[vecchio] || 0) > 0 ||
    (chiave === 'inglese' && (t.verbi || 0) > 0)
  const g = GIOCHI_NUOVI.find(x => x.chiave === chiave)
  if (!g || !g.albo || typeof g.albo.provato !== 'function') return false
  try { return !!g.albo.provato(misure(state.profile)) } catch { return false }
}

/* ── la domanda che fa la home ──
   Un gioco senza campagna (la fattoria, la cameretta) non si giudica: è
   un posto, non una scaletta, e resta a disposizione di tutti. */
export function giocoDaVedere (chiave, { provato = null, fatte = 0 } = {}) {
  const tappe = TAPPE_DEL_GIOCO[chiave]
  if (!tappe) return true
  const gia = provato == null ? giaProvato(chiave) : provato
  return giocoDaOffrire(tappe, { ...regole(), provato: gia, fatte })
}

/* ── e le due che serviranno alle mappe ──
   Da dove comincia chi apre adesso, e come sta messa la fila. Non le usa
   ancora nessuno: stanno qui perché il conto è lo stesso e sparpagliarlo
   sarebbe il modo di farlo divergere. */
export const filaDelGioco = chiave =>
  filaConPortata(TAPPE_DEL_GIOCO[chiave] || [], regole())

export const daDoveComincia = chiave =>
  primaDaGiocare(TAPPE_DEL_GIOCO[chiave] || [], regole())

/* per la schermata dei grandi: «questo gioco va dai 5 ai 9 anni» */
export const arcoDi = chiave => arcoDelGioco(TAPPE_DEL_GIOCO[chiave] || [])


/* ── il lucchetto, con dentro l'età ──
   `store/profile.js` ha la regola unica di quando una tappa è aperta
   (`tappaAperta`: la prossima sì, quelle dopo no). Qui si aggiungono le
   due cose che la portata sa e quella non può sapere — sta in questo
   file e non là perché `profile.js` non deve importarsi quattordici
   campagne per rispondere a una domanda sul lucchetto.

     · quello che il bambino ha già passato **nasce aperto**: a nove
       anni non si comincia da «2×2» per arrivare al 7. Non è un regalo,
       è il contrario — è roba che sa già fare, e obbligarlo a rifarla
       era il difetto di partenza.
     · quello che gli sta ancora davanti resta **chiuso comunque**,
       anche se il progresso ci sarebbe arrivato: a sei anni «7×8» non
       si apre.

   La seconda metà è quella che va guardata due volte, perché toglie
   qualcosa: chi ha già superato quelle tappe le rivede chiuse. Ma
   `tuttoAperto()` (il lucchetto dei grandi) passa davanti a tutto e
   resta la scappatoia, ed è la stessa che c'era prima. */
export function apertaQui (tappa, i, fatte) {
  const stato = tappa ? statoDellaTappa(tappa, regole()) : null
  if (stato === PASSATA) return true
  if (stato === AVANTI && !tuttoAperto()) return false
  return tappaAperta(i, fatte)
}

/* la stessa cosa per chi ha in mano la chiave del gioco invece della
   tappa: le campagne dei giochi nuovi passano tutte da `giochi/campagne.js` */
export const tappaApertaQui = (chiave, i, fatte) =>
  apertaQui((TAPPE_DEL_GIOCO[chiave] || [])[i], i, fatte)
