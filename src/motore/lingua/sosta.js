// La tappa (o il gioco libero) di views/LinguaGame.vue lasciata a metà:
// uscire non butta via niente. Si scrive solo quello che è successo: la
// tappa, i conti, le monete già prese e la domanda aperta com'era (con le
// risposte nello stesso ordine). Il resto — parole da pescare, ordine di
// introduzione, memoria del picker — si rifà dal codice. Il perché:
// docs/lingue/sosta.md. Una sosta per lingua: il formato è questo, ma chi
// legge passa la sua lingua `L` (data/lingue.js) e un dato dell'altra si butta.
import { voceDi } from '../../data/lessico.js'
import { TIPI } from '../../data/domande.js'

// sale quando un campo cambia significato: un salvataggio di un'altra
// versione si butta e la tappa ricomincia
export const VERSIONE = 1

// dove sta la sosta nel profilo (giochi/campagne.js): una per lingua, e a
// parte da quella delle tappe a mondi, così le due non si buttano a vicenda
export const chiaveSosta = lingua => (lingua === 'es' ? 'spagnolo-prima' : 'inglese-prima')

const numero = (n, max = 1e6) => Number.isFinite(n) && n >= 0 && n <= max

/* `s`: { L, tappa (indice, -1 = gioco libero), hud: {giuste, mirate, errori,
   serie}, monete: {dato, chiesto}, mostrate, turno }. `turno` è la domanda
   aperta, o null se la risposta è già data (la prossima si pesca di nuovo).
   Torna null se non c'è niente da salvare: chi chiama toglie la sosta. */
export function scrivi({ L, tappa, hud, monete, mostrate = 0, turno = null }) {
  if (!L || !hud || hud.giuste + hud.errori === 0) return null
  const t = L.tappaDi(tappa)
  return {
    v: VERSIONE,
    lingua: L.id,
    tappa: tappa >= 0 ? tappa : -1,
    nome: t.nome,                       // la tappa si riconosce anche dal nome
    giuste: hud.giuste, mirate: hud.mirate, errori: hud.errori, serie: hud.serie,
    monete: monete.dato, chieste: monete.chiesto, mostrate,
    turno: turno ? {
      tipo: turno.tipo, chiave: turno.chiave,
      opzioni: turno.opzioni.map(o => ({ testo: o.testo, giusta: !!o.giusta,
                                         ...(o.emoji ? { emoji: o.emoji } : {}) })),
    } : null,
  }
}

const turnoBuono = (q, t) =>
  !!q && typeof q === 'object' && !!TIPI[q.tipo] && typeof q.chiave === 'string'
  && !!voceDi(q.chiave) && t.chiavi.includes(q.chiave)
  && Array.isArray(q.opzioni) && q.opzioni.length >= 2 && q.opzioni.length <= 8
  && q.opzioni.every(o => o && typeof o.testo === 'string' && typeof o.giusta === 'boolean')
  && q.opzioni.filter(o => o.giusta).length === 1

// la tappa del salvataggio, se c'è ancora com'era (stesso posto e stesso nome)
function tappaDi(dato, L) {
  if (!dato || dato.v !== VERSIONE || !L || dato.lingua !== L.id) return null
  if (!Number.isInteger(dato.tappa) || dato.tappa < -1 || dato.tappa >= L.CAMPAGNA.length) return null
  const t = L.tappaDi(dato.tappa)
  return t && (dato.tappa < 0 || t.nome === dato.nome) ? t : null
}

/* Rimette la partita: { tappa, hud, monete, mostrate, turno }, o null se il
   salvataggio non torna (chi chiama lo butta e la tappa ricomincia).
   `siGioca(i)` dice se la tappa si può ancora giocare (età, lucchetto). */
export function leggi(dato, L, { siGioca = () => true } = {}) {
  try {
    const t = tappaDi(dato, L)
    if (!t || (dato.tappa >= 0 && !siGioca(dato.tappa))) return null
    if (!numero(dato.giuste, 100000) || !numero(dato.errori, 100000) || !numero(dato.mirate, 100000)
        || !numero(dato.serie, 100000)) return null
    // una tappa già raggiunta non si riprende: sarebbe vinta (chi chiama la toglie)
    if (dato.tappa >= 0 && dato.giuste >= t.bersaglio && dato.mirate >= t.mirate) return null
    if (dato.turno && !turnoBuono(dato.turno, t)) return null
    return {
      tappa: dato.tappa,
      hud: { giuste: dato.giuste, mirate: dato.mirate, errori: dato.errori, serie: dato.serie },
      monete: { dato: numero(dato.monete) ? dato.monete : 0, chiesto: numero(dato.chieste) ? dato.chieste : 0 },
      mostrate: numero(dato.mostrate) ? dato.mostrate : 0,
      turno: dato.turno || null,
    }
  } catch {
    // un salvataggio storto non porta giù il gioco: la tappa ricomincia
    return null
  }
}

// Le righe per la carta «torno da dove ero»: la legge la mappa senza aprire
// la partita. Null se la tappa non c'è più.
export function dice(dato, L) {
  const t = tappaDi(dato, L)
  if (!t) return null
  return { nome: t.nome, emoji: t.emoji, libero: dato.tappa < 0, giuste: dato.giuste,
           errori: dato.errori, bersaglio: dato.tappa < 0 ? 0 : t.bersaglio }
}
