// La tappa lasciata a metà: uscire non butta via niente (la stessa promessa
// del castello). Si scrive solo quello che è successo: la tappa (il suo id),
// le giuste e gli errori, le monete già prese, la domanda aperta com'era
// (con la fila di tessere e le parole già toccate), e quel poco della
// Sessione che non si rifà dal codice. Le monete e il grado di ogni risposta
// sono già nel profilo: niente si ripaga. Il perché: docs/lingue/sosta.md.
// Lo spagnolo ha il suo (src/giochi/spagnolo/motore/sosta.js): le lingue non
// si mescolano, e i due motori sono fratelli, non lo stesso file.
import { Sessione } from './sessione.js'
import { tappaDi, mondoDi } from '../dati/mondi.js'
import { fraseDi } from '../dati/frasi.js'
import { cassettoDi } from './grafo.js'
import { voceDi } from '../../../data/lessico.js'

// sale quando un campo cambia significato: un salvataggio di un'altra
// versione si butta e la tappa ricomincia
export const VERSIONE = 1

const numero = (n, max = 1e6) => Number.isFinite(n) && n >= 0 && n <= max
const lista = x => Array.isArray(x) ? x : []

// La tappa (o il cassetto di un mondo) di una sosta, come sta nei dati.
export const tappaDella = dato => dato.cassetto ? cassettoDi(dato.cassetto) : tappaDi(dato.tappa)

/* `s` è lo stato di chi gioca: { tappa, sessione, conti, domanda, pagina,
   fila, tocchi, pagaQui, visto }. Torna null se non c'è niente da salvare
   (nessuna tappa, o è già finita): chi chiama toglie la sosta. */
export function scrivi(s) {
  const { tappa, sessione, conti } = s
  if (!tappa || !sessione || sessione.finita) return null
  const aperta = s.domanda || null
  return {
    v: VERSIONE,
    tappa: tappa.id,
    ...(tappa.cassetto ? { cassetto: tappa.mondo } : {}),
    presenta: sessione.daPresentare.length > 0,
    bersaglio: sessione.bersaglio,
    giuste: sessione.giuste,
    errori: sessione.errori,
    monete: conti.monete,
    chieste: conti.chieste,
    gradoPrima: conti.gradoPrima,
    // quel poco di Sessione che non si rifà: dove si è nella presentazione e
    // cosa è già stato indovinato o sbagliato (le frasi pronte dipendono da qui)
    // il primo giro (dalla più debole) e le voci tra cui si pesca, com'erano: rifarli
    // rimetterebbe in testa quello che è appena stato chiesto
    primoGiro: [...sessione.primoGiro],
    pool: [...sessione.pool],
    passo: sessione.passo,
    paginaFatta: sessione.paginaFatta,
    giusteQui: sessione.giusteQui,
    chiesteQui: [...sessione.chiesteQui],
    indovinate: [...sessione.indovinate],
    sbagliate: [...sessione.sbagliate],
    sbagliDi: [...sessione.sbagliDi],
    // la domanda aperta (o la pagina che la precede) com'era, mai rifatta
    aperta,
    pagina: aperta ? null : (s.pagina || null),
    ...(aperta ? {
      fila: lista(s.fila),
      toccate: s.tocchi ? [...s.tocchi.toccate] : [],
      pagaQui: s.pagaQui !== false,
      visto: Math.round((s.visto || 0) * 10) / 10,
    } : {}),
  }
}

// la domanda salvata si può ancora mostrare? (la voce o la frase c'è, le tessere tornano)
function domandaBuona(q) {
  if (!q || typeof q !== 'object') return false
  if (q.genere === 'frase') return !!fraseDi(q.frase) && Array.isArray(q.tessere || []) && !!q.formato
  if (q.genere === 'parola') return !!q.chiave && !!voceDi(q.chiave) && Array.isArray(q.opzioni)
  return false
}
const paginaBuona = p => !!p && typeof p === 'object' && p.genere === 'pagina'

/* Rimette la tappa: torna { tappa, sessione, conti, aperta, pagina, fila,
   toccate, pagaQui, visto }, o null se il salvataggio non torna (chi chiama
   in quel caso lo butta e la tappa ricomincia). `opzioni` sono quelle di
   `new Sessione`: itemDi, haVoce, eta, partenza; `siGioca(tappa)` dice se la
   tappa si può ancora giocare (un grande può averla richiusa). */
export function leggi(dato, opzioni, { siGioca = () => true } = {}) {
  if (!dato || dato.v !== VERSIONE) return null
  try {
    const tappa = tappaDella(dato)
    if (!tappa || !siGioca(tappa)) return null
    const bersaglio = dato.bersaglio
    if (!numero(bersaglio, 100) || bersaglio < 1 || !numero(dato.giuste, 100) || !numero(dato.errori, 1000)) return null
    if (dato.aperta && !domandaBuona(dato.aperta)) return null
    if (dato.pagina && !paginaBuona(dato.pagina)) return null

    const sessione = new Sessione({ ...opzioni, tappa, bersaglio, presenta: !!dato.presenta })
    sessione.giuste = dato.giuste
    sessione.errori = dato.errori
    const chiavi = x => lista(x).filter(k => typeof k === 'string')
    if (chiavi(dato.pool).length) sessione.pool = chiavi(dato.pool)
    sessione.primoGiro = chiavi(dato.primoGiro).filter(k => sessione.pool.includes(k))
    sessione.passo = Math.min(numero(dato.passo, 99) ? dato.passo : 0, sessione.daPresentare.length)
    sessione.giusteQui = numero(dato.giusteQui, 99) ? dato.giusteQui : 0
    sessione.paginaFatta = !!dato.paginaFatta || !!(dato.aperta || dato.pagina)
    sessione.chiesteQui = chiavi(dato.chiesteQui)
    sessione.indovinate = new Set(chiavi(dato.indovinate))
    sessione.sbagliate = new Set(chiavi(dato.sbagliate))
    sessione.sbagliDi = new Map(lista(dato.sbagliDi).filter(x => Array.isArray(x) && numero(x[1], 999)))
    // chi riprende non rivede subito la stessa voce dopo la risposta
    if (dato.aperta && dato.aperta.chiave) sessione.picker.annota(dato.aperta.chiave)
    if (sessione.finita) return null

    let fila = lista(dato.fila)
    if (dato.aperta && dato.aperta.tessere) {
      const ids = new Set(dato.aperta.tessere.map(t => t.id))
      if (!fila.every(x => x === null || ids.has(x))) fila = null
    }
    if (dato.aperta && fila === null) return null
    return {
      tappa, sessione,
      conti: { giuste: dato.giuste, errori: dato.errori, monete: numero(dato.monete) ? dato.monete : 0,
               chieste: numero(dato.chieste) ? dato.chieste : 0, bersaglio,
               gradoPrima: Number.isFinite(dato.gradoPrima) ? dato.gradoPrima : null },
      aperta: dato.aperta || null,
      pagina: dato.aperta ? null : (dato.pagina || null),
      fila,
      toccate: lista(dato.toccate).filter(x => Array.isArray(x) && x[1] && typeof x[1] === 'object'),
      pagaQui: dato.pagaQui !== false,
      visto: numero(dato.visto, 600) ? dato.visto : 0,
    }
  } catch {
    // un salvataggio storto non porta giù il gioco: la tappa ricomincia
    return null
  }
}

// Due righe per la carta «torno da dove ero»: la legge la mappa senza
// aprire la partita. Null se la tappa non c'è più.
export function dice(dato) {
  if (!dato || dato.v !== VERSIONE) return null
  const t = tappaDella(dato)
  if (!t) return null
  const m = mondoDi(t.mondo)
  const resta = Math.max(0, dato.bersaglio - dato.giuste)
  return {
    nome: t.nome,
    mondo: m ? m.nome : '',
    giuste: dato.giuste,
    bersaglio: dato.bersaglio,
    errori: dato.errori,
    resta,
    cassetto: !!dato.cassetto,
  }
}
