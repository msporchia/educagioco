// La marea: sotto il livello del bambino (la frontiera) si dimentica più
// piano — chi sa 7×8 non ha dimenticato 2×3. Due stime separate (tabelline,
// calcolo a mente); dettagli e perché in docs/apprendimento/srs.md.
// Puro: riceve `items` e un `now`, non importa il profilo.
import { SRS } from './srs.js'
import { fattoriDi, calcoliTabellina } from '../data/tabelline.js'
import { STAZIONI, chiaviDi, concettoDiChiave } from '../data/calcolo.js'

const GIORNO = 86400000

// una su cinque può mancare, e comunque una (i gradini piccoli, tipo la
// tabellina del 3, non pretendono lo zero)
export const TOLLERANZA = 0.2

// dieci volte: l'intervallo più lungo del motore (tre settimane) diventa
// sette mesi, non "mai"
export const MAREA_MAX = 10

// un mese: il tempo di due ripassi giusti alla curva normale da una forza
// ammaccata, con margine — poi la marea riprende l'elemento
export const RIENTRO = 30 * GIORNO

// continua e senza gradini, se no 5×6 e 4×6 si dimenticherebbero in modi
// diversi (docs/apprendimento/srs.md)
export const lentezzaDa = distanza =>
  distanza <= 0 ? 1 : Math.min(MAREA_MAX, 1 + (distanza / 2) ** 2)

const VUOTO = { s: 0 }
const forzaNominale = (items, k) => ((items && items[k]) || VUOTO).s
const sa = (items, k) => forzaNominale(items, k) >= SRS.masterS
// regge se manca al più la tolleranza e almeno una casella è saputa (se no
// un gradino da una casella mai vista reggerebbe)
function regge(items, chiavi) {
  const saputi = chiavi.filter(k => sa(items, k)).length
  const mancano = chiavi.length - saputi
  return saputi >= 1 && mancano <= Math.max(1, Math.floor(chiavi.length * TOLLERANZA))
}

// l'unica regola in comune fra i due mestieri, sbaglio recente compreso
function lentezzaDi(items, k, now, distanza) {
  const it = items && items[k]
  if (it && it.errAt && now - it.errAt < RIENTRO) return 1
  return lentezzaDa(distanza)
}

// Frontiera delle tabelline: la più alta fin dove si sa tutto dal 2 (un buco
// al 5 la ferma al 4 anche se il 7 regge). Il gradino di un calcolo è il suo
// fattore più alto, quindi la scala è triangolare; ×1 e ×10 non contano
// (docs/apprendimento/srs.md).
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

// Frontiera del calcolo: quante stazioni reggono di seguito dalla prima (gli
// esami, `nuovi: []`, non contano). Il gradino di una chiave è la stazione
// del suo concetto padrone (`concettoDiChiave`).
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
