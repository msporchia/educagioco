// Il nemico: gioca con le stesse regole e le stesse monete del giocatore, e
// non bara (non vede niente che a schermo non si veda). Segue una SCALETTA — una
// serie di mosse buone, scelta a caso fra poche all'inizio — e la interrompe
// quando serve: la bomba e la riparazione se lo stanno schiacciando, il castello
// e le difese se vede che l'avversario sta vincendo. Spende quello che ha:
// finite le mosse della scaletta continua con una regola sola, senza lasciare
// monete ferme. Perché così e cosa si è provato: docs/arena/nemico.md.
import { TRUPPE, LIV_MAX, MINIERA_MAX, BOMBA } from '../dati/regole.js'

/* Una scaletta parla di ruoli, non di truppe: per ogni tappa il ruolo diventa la
   prima truppa che c'è (quelle di una tappa sono poche). */
const RUOLI = {
  base: ['scheletri'],
  tank: ['guardiano', 'golem'],
  veloce: ['lupi'],
  splash: ['negromante', 'diavoletto'],
  volo: ['pipistrelli', 'drago'],
}

const SCALETTE = {
  // tante truppe e presto: chi non si difende bene perde la corsa
  assalto: [['costruisci', 'tank'], ['costruisci', 'veloce'], ['potenzia', 'base'], ['costruisci', 'splash'],
            ['potenzia', 'tank'], ['costruisci', 'volo'], ['castello'], ['miniera'], ['potenzia', 'veloce']],
  // prima le monete, poi tutto insieme
  economia: [['miniera'], ['costruisci', 'tank'], ['miniera'], ['costruisci', 'splash'], ['castello'],
             ['costruisci', 'veloce'], ['miniera'], ['costruisci', 'volo'], ['potenzia', 'splash']],
  // il castello e chi ferisce a gruppi: resiste, poi rovescia
  bastione: [['castello'], ['costruisci', 'splash'], ['costruisci', 'tank'], ['castello'], ['miniera'],
             ['costruisci', 'volo'], ['potenzia', 'splash'], ['costruisci', 'veloce']],
}

/* sale a ogni ritocco del modo di giocare del nemico: entra nella firma dell'equilibrio (`firma.js`),
   così un'IA cambiata senza ritarare è un test rosso */
export const VERSIONE_IA = 2

export function creaIA(rnd) {
  const nomi = Object.keys(SCALETTE)
  const nome = nomi[Math.floor(rnd() * nomi.length)]
  return { nome, passo: 0 }
}

/* il ruolo di un passo → quale truppa, per costruire (una che non c'è ancora) o potenziare (una che c'è) */
function truppaDel(p, ruolo, costruire) {
  const mie = new Set(p.casermeDi('nem').map(c => c.id))
  return RUOLI[ruolo].find(id => p.truppeAmmesse.includes(id) && (costruire ? !mie.has(id) : mie.has(id))) || null
}

/* una mossa si può fare adesso? */
const si = (p, azione, id) => p.puoFare('nem', azione, id)

/* il nemico si sente in svantaggio quando il suo castello sta peggio di quello dell'avversario o
   l'avversario ha molte più caserme */
function sottoPressione(p) {
  const a = p.vitaBase('nem'), b = p.vitaBase('io')
  const livelli = lato => p.casermeDi(lato).reduce((s, c) => s + c.liv, 0)
  return a < b - 0.1 || livelli('io') > livelli('nem') * 1.3 + 1
}

/* una mossa dall'emergenza: la bomba su un ammasso che arriva, o una riparazione */
function emergenza(p) {
  const l = p.lati.nem
  const colpo = l.bombe > 0 ? p.puntoDellaBomba('nem') : null
  if (colpo && colpo.peso >= 600 && p.fai('nem', 'bomba')) return true
  const messi = p.riparabili('nem')
  const muro = p.muro('nem')
  const crollato = !!muro && muro.hp <= 0
  const quasiMorti = messi.some(e => e.hp < e.max * 0.5)
  if ((crollato || quasiMorti) && si(p, 'ripara') && p.fai('nem', 'ripara')) return true
  return false
}

/* le mosse da fare in ordine di priorità quando non c'è una scaletta da seguire (o è finita) */
function candidate(p, difesa) {
  const l = p.lati.nem
  const castello = p.castello('nem')
  const mie = p.casermeDi('nem')
  const mediaLiv = mie.length ? mie.reduce((s, c) => s + c.liv, 0) / mie.length : 1
  const lista = []
  const aggiungi = (azione, id) => { const pr = p.prezzo('nem', azione, id); if (pr !== null) lista.push({ azione, id, prezzo: pr }) }
  const costruibili = Object.keys(TRUPPE).filter(id => p.prezzo('nem', 'costruisci', id) !== null)
    .sort((a, b) => TRUPPE[a].costo - TRUPPE[b].costo)
  const bassa = [...mie].filter(c => c.liv < LIV_MAX).sort((a, b) => a.liv - b.liv)

  if (difesa) {
    // chi sta perdendo rafforza: castello, riparazioni, poi chi ferisce a gruppi e chi vola
    if (castello.liv <= mediaLiv + 2) aggiungi('castello')
    if (p.riparabili('nem').some(e => e.hp < e.max * 0.85)) aggiungi('ripara')
    for (const c of bassa.slice(0, 2)) aggiungi('potenzia', c.id)
    for (const id of costruibili.slice(0, 2)) aggiungi('costruisci', id)
  } else {
    if (costruibili.length && mie.length < 4) aggiungi('costruisci', costruibili[0])
    if (castello.liv < mediaLiv - 0.5) aggiungi('castello')
    if (l.miniera < Math.min(MINIERA_MAX, 4) && p.t < 100) aggiungi('miniera')
    for (const c of bassa.slice(0, 2)) aggiungi('potenzia', c.id)
    for (const id of costruibili.slice(0, 1)) aggiungi('costruisci', id)
    aggiungi('castello')
  }
  return lista
}

/* Una sola mossa; torna true se l'ha fatta. Le monete non restano ferme: se la prima scelta
   costa più di quanto ha e non è lontana, aspetta; se è lontana, passa alla successiva. */
function mossa(p) {
  if (emergenza(p)) return true
  const l = p.lati.nem
  const difesa = sottoPressione(p)

  if (!difesa && p.ia.passo < SCALETTE[p.ia.nome].length) {
    const passo = SCALETTE[p.ia.nome][p.ia.passo]
    const [azione, ruolo] = passo
    let id = null
    if (ruolo) id = truppaDel(p, ruolo, azione === 'costruisci')
    const possibile = azione === 'miniera' || azione === 'castello' ? p.prezzo('nem', azione) !== null : id !== null && p.prezzo('nem', azione, id) !== null
    if (!possibile) { p.ia.passo++; return true }           // questo passo non c'è in questa tappa: si salta
    if (si(p, azione, id)) { p.fai('nem', azione, id); p.ia.passo++; return true }
    return false                                            // si aspetta di avere le monete per il passo
  }

  const lista = candidate(p, difesa)
  if (!lista.length) return false
  const prima = lista[0]
  if (l.monete >= prima.prezzo) return p.fai('nem', prima.azione, prima.id)
  if (l.monete >= prima.prezzo * 0.6) return false          // ci siamo quasi: si risparmia
  const altra = lista.find(o => l.monete >= o.prezzo)
  return altra ? p.fai('nem', altra.azione, altra.id) : false
}

export function pensaNemico(p, dt) {
  p.pensa -= dt
  if (p.pensa > 0) return
  p.pensa = p.nemicoCfg.pensa
  for (let giro = 0; giro < 4; giro++) if (!mossa(p)) break   // più mosse di fila se le monete ci sono
}
