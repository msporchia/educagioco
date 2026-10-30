// La bacheca sul telefono (docs/core/amici-bacheca.md): lascia la propria istantanea in ogni amicizia e ritira quella dell'amico,
// che resta qui anche offline. Si scrive all'avvio (così la bacheca non scade per chi gioca), qualche secondo dopo un cambio, e
// uscendo dall'app se c'era un cambio in coda; si rilegge rientrando e quando l'amico online avvisa. Mai un errore.
import { watch } from 'vue'
import { state } from '../store/profile.js'
import { dati, ricorda, segnaSorpassi } from '../store/amici.js'
import { scambiaBacheca } from './rete.js'
import { istantanea, firma, quandoInParole, sorpassi, davantiIn } from './istantanea.js'
import { quandoBacheca, avvisaPresenti } from './servizio.js'
import { bacheca as avviso } from './messaggi.js'

export const RITARDO = 5000              // ms dopo un cambio: una tappa vinta e il suo record sono un cambio solo
export const PRIMA_LETTURA = 3000        // ms dopo l'avvio: gli amici non rallentano l'ingresso
const RILETTURA_MIN = 30000              // rientrare due volte di fila non rilegge due volte

let profilo = () => state.profile
let opzioni = {}                          // servizio, fetchImpl: per le prove
let scritta = null                       // la firma dell'ultima istantanea arrivata in tutte le bacheche
let ferma = null, attesa = 0, avvio = 0, letta = 0, giro = 0

/* tiene l'istantanea arrivata, e se dice che l'amico ci è passato davanti lo segna per la home */
function arrivata(chiave, altro) {
  const a = dati.amici.find(x => x.chiave === chiave)
  const prima = a?.bacheca
  if (ricorda(chiave, altro)) segnaSorpassi(chiave, sorpassi(prima, a.bacheca, istantanea(profilo())))
}

/* scrive (se `scrivi` e il bambino si fa vedere online) e rilegge tutte le amicizie; `forza` riscrive anche senza cambi */
export async function sincronizza({ scrivi = true, forza = false, keepalive = false } = {}) {
  if (!dati.attivo || !dati.amici.length) return
  const mio = giro
  const ist = istantanea(profilo())
  const f = firma(ist)
  const manda = scrivi && dati.online && (forza || f !== scritta)
  let tutte = true
  await Promise.all(dati.amici.map(async a => {
    const altro = await scambiaBacheca(a.chiave, dati.id, manda ? ist : null, { ...opzioni, keepalive })
    if (mio !== giro) return                                              // un altro bambino nel frattempo
    if (altro === undefined) tutte = false
    else if (altro) arrivata(a.chiave, altro)
  }))
  if (mio !== giro) return
  letta = Date.now()
  if (manda && tutte) {
    const cambiata = f !== scritta
    scritta = f
    if (cambiata) avvisaPresenti(avviso())
  }
}

/* l'amico ha appena scritto: si rilegge solo la sua */
async function rileggi(chiave) {
  const a = dati.amici.find(x => x.chiave === chiave)
  if (!a) return
  const mio = giro
  const altro = await scambiaBacheca(a.chiave, dati.id, null, opzioni)
  if (mio === giro && altro) arrivata(a.chiave, altro)
}

/* entrando in un gioco che mostra gli amici: si rilegge, se non lo si è fatto da poco */
export function rileggiTutte() {
  if (Date.now() - letta < RILETTURA_MIN) return
  sincronizza({ scrivi: false }).catch(() => {})
}

function schermo() {
  if (typeof document === 'undefined' || !dati.attivo) return
  if (document.visibilityState === 'hidden') {
    if (attesa) { clearTimeout(attesa); attesa = 0; sincronizza({ keepalive: true }).catch(() => {}) }
  } else rileggiTutte()
}

/* per il bambino di turno: avvio.js la chiama dopo gli amici. Spento dai grandi, non parte niente. */
export function avviaBacheca({ profilo: p, ...prove } = {}) {
  fermaBacheca()
  if (p) profilo = p
  opzioni = prove
  if (!dati.attivo) return
  quandoBacheca(rileggi)
  avvio = setTimeout(() => sincronizza({ forza: true }).catch(() => {}), PRIMA_LETTURA)
  // solo i campi che l'istantanea legge: il resto del profilo può cambiare senza svegliare niente
  ferma = watch(() => firma(istantanea(profilo())), () => {
    clearTimeout(attesa)
    attesa = setTimeout(() => { attesa = 0; sincronizza().catch(() => {}) }, RITARDO)
  })
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', schermo)
}

export function fermaBacheca() {
  giro++
  ferma?.(); ferma = null
  clearTimeout(attesa); clearTimeout(avvio); attesa = 0
  scritta = null; letta = 0
  quandoBacheca(null)
  if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', schermo)
}

/* i colori dei pallini: uno per posto nella lista, quindi due amici non ne hanno mai uno uguale */
export const COLORI = ['#ff6b6b', '#4ecdc4', '#b18cff', '#ffa94d', '#69db7c', '#f783ac']

/* Gli amici da mostrare in un gioco: chi ha un nome e ha scritto qualcosa di quel gioco. { chiave, nome, iniziale, colore,
   tappa, primati: { <sfida>: n }, quando }. Le schermate passano da usaAmici.js, che ne fa le cose da mostrare. */
export function amiciNelGioco(gioco, ora = Date.now()) {
  if (!dati.attivo) return []
  return dati.amici.map((a, i) => ({ a, i })).filter(({ a }) => a.nome && a.bacheca?.giochi?.[gioco]).map(({ a, i }) => ({
    chiave: a.chiave, nome: a.nome, iniziale: ([...a.nome.trim()][0] || '?').toUpperCase(), colore: COLORI[i % COLORI.length],
    ...a.bacheca.giochi[gioco], quando: quandoInParole(a.bacheca.giorno, ora),
  }))
}

/* I sorpassi da dire in home, dal più recente: solo nei giochi che il bambino vede (`giochi`, le chiavi), solo se l'amico ha un
   nome e solo se è ancora davanti (chi l'ha già ripreso non ha niente da sentirsi dire) */
export function sorpassiDaDire(giochi, quanti = 2) {
  if (!dati.attivo) return []
  const mia = istantanea(profilo())
  return dati.sorpassi.map(x => ({ x, i: dati.amici.findIndex(a => a.chiave === x.chiave) }))
    .filter(({ x, i }) => i >= 0 && dati.amici[i].nome && giochi.includes(x.gioco) && davantiIn(dati.amici[i].bacheca, mia, x.gioco, x.tipo))
    .reverse().slice(0, quanti)
    .map(({ x, i }) => ({ ...x, nome: dati.amici[i].nome, iniziale: ([...dati.amici[i].nome.trim()][0] || '?').toUpperCase(),
      colore: COLORI[i % COLORI.length] }))
}
