/* ═══════════════════════════════════════════════════════════════════
   LA MAREA — quello che sta sotto il livello del bambino si dimentica
   più piano.

   Il motore (`store/srs.js`) ha una curva dell'oblio sola, uguale per
   ogni elemento: un fatto non visto da dieci giorni perde forza, chiunque
   sia il bambino e qualunque sia il fatto. Per le parole inglesi va
   bene — «butterfly» e «dog» non stanno su una scala. Per le tabelline
   e il calcolo a mente no, ed è il guasto che si vedeva giocando: un
   bambino che sa tutto fino all'8 si vedeva chiedere 2×3 nel volo
   libero, perché 2×3 «arrugginiva» — dieci giorni senza vederlo e la
   forza efficace scendeva da 4 a 3 — e un elemento arrugginito pesa più
   di un 7×8 imparato ieri. La curva è giusta; è cieca a un fatto che un
   maestro vede subito: chi sa 7×8 non ha dimenticato 2×3.

   Qui si stima IL LIVELLO DEL BAMBINO — la frontiera — e da lì si dà a
   ogni elemento una LENTEZZA: quante volte più lungo è il suo intervallo
   di ripasso. Alla frontiera e sopra è 1, cioè la curva di sempre;
   sotto, cresce con la distanza. Il motore riceve il numero e non sa da
   dove viene (`lentezza` in `overdue`/`strength`/`weight`/`activeSet`).

   DUE STIME SEPARATE, perché sono due mestieri: le tabelline sono fatti
   da sapere a memoria, il calcolo a mente è una strategia da applicare,
   e chi sa 47+29 non ha nessun titolo su 7×8. Ognuna guarda la sua
   scala — le tabelline dal 2 al 9, le stazioni nell'ordine di
   `STAZIONI` — e nessuna delle due tocca l'altra.

   TRE COSE CHE LA MAREA NON FA, ed è quello che la tiene onesta:

   1. NON TOCCA LA FRONTIERA NÉ QUELLO CHE STA SOPRA. Chi lavora sul 9
      vede il 9 e l'8 alla cadenza di sempre: è quello che sta imparando.
   2. NON TOCCA QUELLO CHE È STATO SBAGLIATO DI RECENTE. Un 2×3 sbagliato
      ieri torna comunque, alla curva normale, per un mese (`RIENTRO`):
      lo sbaglio è la prova che la stima era ottimista per quella
      casella, e per un mese si torna a misurarla come tutte le altre.
      La data la scrive `record` (`errAt`), perché `err` conta e non
      dice quando.
   3. NON RENDE NIENTE ETERNO: c'è un tetto (`MAREA_MAX`), e in fondo
      alla scala l'intervallo più lungo del motore (21 giorni) diventa
      sette mesi, non mai.

   LA FRONTIERA SI LEGGE DALLA FORZA NOMINALE, non da quella efficace.
   È fatta apposta per non essere circolare: la forza efficace dipende
   dalla lentezza, e la lentezza dalla frontiera — se la frontiera
   leggesse la forza efficace si morderebbe la coda. La nominale è
   quello che il bambino ha dimostrato: sale con le giuste e scende con
   gli sbagli, e basta. Se un bambino torna dopo un anno la frontiera
   nominale dice ancora «fino all'8», la forza efficace dell'8 (senza
   lentezza) è a zero, e le prime partite gli rimettono in fila quello
   che regge davvero: sbagliare 7×8 abbassa `s`, la frontiera scende, e
   con lei tornano a farsi vedere anche le tabelline sotto.

   Puro: riceve `items` e un `now`, non importa il profilo, e si prova
   in `unita/asteroidi`.
   ═══════════════════════════════════════════════════════════════════ */
import { SRS } from './srs.js'
import { fattoriDi, calcoliTabellina } from '../data/tabelline.js'
import { STAZIONI, chiaviDi, concettoDiChiave } from '../data/calcolo.js'

const GIORNO = 86400000

/* Quante caselle possono mancare perché un gradino «si sappia»: una su
   cinque, e comunque una. Non zero, perché una tabellina si sa anche
   con una casella ancora in lavorazione — pretendere il cento per cento
   terrebbe la frontiera ferma per un 7×8 mai visto, e uno sbaglio solo
   la farebbe crollare (con lei tutta la marea, per un mese). E «comunque
   una» perché i gradini bassi sono piccoli — la tabellina del 3 sono due
   caselle, 2×3 e 3×3 — e un quinto di due è zero. */
export const TOLLERANZA = 0.2

/* Il tetto della lentezza: dieci volte. L'intervallo più lungo del
   motore è di tre settimane, per dieci fa sette mesi — è quanto può
   stare via un 2×3 per un bambino che sa tutto, e non è «mai». */
export const MAREA_MAX = 10

/* Per quanto uno sbaglio tiene fuori un elemento dalla marea: un mese.
   È il tempo di due ripassi giusti alla curva normale da una forza
   ammaccata (3 + 8 giorni, `IVL` in `srs.js`) con un buon margine:
   dopo, l'elemento è tornato dov'era e la marea lo riprende. */
export const RIENTRO = 30 * GIORNO

/* LA CURVA. Continua e senza gradini — `1 + (d/2)²` — perché un
   gradino a una distanza precisa vorrebbe dire che 5×6 e 4×6 si
   dimenticano in modi diversi, e non è vero. Parte piano e cresce in
   fretta, che è quello che si voleva: a un gradino sotto la frontiera
   si è quasi alla curva normale (1,25×: è roba appena imparata, e si
   controlla ancora), a due si raddoppia, a quattro si quintuplica, a
   sei si tocca il tetto. Per un bambino che sa fino all'8: le tabelline
   del 7 e del 6 sono ancora lì quasi come prima, il 5 e il 4 si vedono
   una volta ogni tre o cinque, il 3 e il 2 una volta ogni dieci. */
export const lentezzaDa = distanza =>
  distanza <= 0 ? 1 : Math.min(MAREA_MAX, 1 + (distanza / 2) ** 2)

const VUOTO = { s: 0 }
const forzaNominale = (items, k) => ((items && items[k]) || VUOTO).s
const sa = (items, k) => forzaNominale(items, k) >= SRS.masterS
/* un gradino regge se ne manca al più la tolleranza — e se almeno una
   casella è saputa, se no un gradino da una casella mai vista reggerebbe */
function regge(items, chiavi) {
  const saputi = chiavi.filter(k => sa(items, k)).length
  const mancano = chiavi.length - saputi
  return saputi >= 1 && mancano <= Math.max(1, Math.floor(chiavi.length * TOLLERANZA))
}

/* La lentezza di una chiave, data la sua distanza sotto la frontiera:
   l'unica regola in comune fra i due mestieri, sbaglio recente compreso */
function lentezzaDi(items, k, now, distanza) {
  const it = items && items[k]
  if (it && it.errAt && now - it.errAt < RIENTRO) return 1
  return lentezzaDa(distanza)
}

/* ═══════════ LE TABELLINE ═══════════
   La frontiera è la tabellina più alta fin dove si sa TUTTO, contando
   dal 2: se il 2, il 3 e il 4 reggono e il 5 no, la frontiera è 4 —
   anche se il 7 regge, perché il 7 saputo col 5 vuoto non dice che il
   bambino «è arrivato al 7», dice che ha un buco.

   IL GRADINO DI UN CALCOLO È IL SUO FATTORE PIÙ ALTO: la fatica di 3×7
   è quella del 7, non quella del 3, e «sapere la tabellina del 2» non
   può voler dire sapere 2×9 — quello è roba del 9. Quindi la scala è
   triangolare: il gradino 3 è 2×3 e 3×3, il gradino 8 va da 2×8 a 8×8.
   ×1 e ×10 non contano: sono regole, non fatti (vedi `banale` in
   `store/tabelline.js`), e nella scala stanno in fondo per principio —
   la loro distanza è la massima, come se fossero la tabellina dell'1.
   Zero = nessun gradino regge, e allora la marea non c'è. */
const eBanale = k => { const [lo, hi] = fattoriDi(k); return lo === 1 || hi === 10 }
const gradinoTabellina = k => (eBanale(k) ? 1 : fattoriDi(k)[1])
const caselleDelGradino = n => calcoliTabellina(n).filter(k => gradinoTabellina(k) === n)

export function frontieraTabelline(items) {
  let f = 0
  for (let n = 2; n <= 9; n++) {
    if (!regge(items, caselleDelGradino(n))) break
    f = n
  }
  return f
}

export function mareaTabelline(items, now = Date.now()) {
  const f = frontieraTabelline(items)
  return k => lentezzaDi(items, k, now, f - gradinoTabellina(k))
}

/* ═══════════ IL CALCOLO A MENTE ═══════════
   La scala è la fila delle stazioni: la frontiera è quante ne reggono
   di seguito dalla prima — una stazione regge quando ognuno dei suoi
   concetti nuovi regge (per un concetto a fatti, con la stessa
   tolleranza dei gradini; per una strategia, il suo unico elemento). Gli esami
   (`nuovi: []`) non contano: non insegnano niente. Il gradino di una
   chiave è la stazione del suo concetto, e per un fatto che sta in due
   concetti — 4+5 è una somma entro il dieci ed è un quasi doppio — vale
   il padrone, cioè il più elementare (`concettoDiChiave`). */
const STAZIONE_DEL = new Map()
STAZIONI.forEach(S => S.nuovi.forEach(id => STAZIONE_DEL.set(id, S.i + 1)))

const reggeConcetto = (items, id) => regge(items, chiaviDi(id))

export function frontieraCalcolo(items) {
  let f = 0
  for (const S of STAZIONI) {
    if (!S.nuovi.length) break
    if (!S.nuovi.every(id => reggeConcetto(items, id))) break
    f = S.i + 1
  }
  return f
}

const gradinoCalcolo = k => STAZIONE_DEL.get(concettoDiChiave(k)) || 0

export function mareaCalcolo(items, now = Date.now()) {
  const f = frontieraCalcolo(items)
  return k => lentezzaDi(items, k, now, f - gradinoCalcolo(k))
}
