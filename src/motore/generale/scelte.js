/* ═══════════════════════════════════════════════════════════════════
   QUALE DI LORO — chi si sceglie, quando il bersaglio è una schiera

   «attacca gli orchi» nomina una CLASSE, non un orco: è una scelta
   voluta del vocabolario (vedi `elenco: true` in `vocabolario.js`), e
   un piano si firma prima della battaglia, quando l'orco è ancora dove
   gli pare. Ma finché la schiera si risolveva sempre nel PIÙ VICINO, il
   piano poteva nominare il gruppo e non poteva mai dire *chi*: due
   guardie mandate sullo stesso nemico, e un gruppo diviso in due posti
   che nessun piano riusciva a ripulire — si accalcavano tutti sul primo
   che capitava.

   Adesso l'ordine porta un `quale`, che non è un nome ma un CRITERIO:

       { verbo: 'attacca', complemento: 'orchi', quale: 'lontano' }

   Chi non lo scrive resta al più vicino, che è quello che facevano
   tutti prima e continua a essere il caso normale. La differenza fra un
   criterio e un nome è tutta la ragione per cui questo file esiste:
   «quello laggiù» invecchia con la mappa, «il più lontano» no — e i
   piani devono reggere tre scene diverse.

   ── CHI NON SI RAGGIUNGE NON È «IL PIÙ LONTANO» ──
   La BFS risponde `-1` per una cella dove non si arriva. Preso alla
   lettera sarebbe la distanza più corta di tutte (per il vicino) e la
   più lunga di tutte (per il lontano): in un caso ci si butta addosso a
   chi sta dietro un muro, nell'altro ci si incammina verso qualcuno a
   cui non si arriverà mai. Qui vale per tutti la stessa regola —
   irraggiungibile è **l'ultima scelta**, quale che sia il criterio.
   ═══════════════════════════════════════════════════════════════════ */
import { mappaDi } from './mappa.js'

/* quanti passi ci sono da chi guarda a ognuno, con l'irraggiungibile
   messo all'infinito invece che a -1 */
const passiDa = (mondo, chi) => {
  const d = mappaDi(mondo, chi)
  return u => {
    const q = d[u.y * mondo.w + u.x]
    return q < 0 ? Infinity : q
  }
}

/* Ogni criterio dà un VOTO, e vince il più basso. È una tabella:
   aggiungerne uno è aggiungere una riga, e nessun verbo lo sa. */
export const SCELTE = {
  vicino: {
    nome: 'il più vicino',
    voto: (mondo, chi) => { const p = passiDa(mondo, chi); return u => p(u) },
  },
  lontano: {
    nome: 'il più lontano',
    voto: (mondo, chi) => {
      const p = passiDa(mondo, chi)
      return u => { const q = p(u); return q === Infinity ? Infinity : -q }
    },
  },
  /* chi è messo peggio: si finisce il ferito invece di cominciarne un
     altro, ed è il modo di dire «finiscilo» senza un verbo in più */
  debole: { nome: 'quello messo peggio', voto: () => u => u.vita ?? 0 },
  forte:  { nome: 'quello più in forze', voto: () => u => -(u.vita ?? 0) },
}

export const QUALI = Object.keys(SCELTE)
export const eScelta = q => !q || Object.prototype.hasOwnProperty.call(SCELTE, q)

/* ── E A PARITÀ VINCE IL PRIMO DELL'ELENCO ──
   Cioè l'ordine in cui le unità stanno scritte nel livello, che è già
   la leva che decide chi colpisce per primo e chi viene visto per primo
   (`partita.js`). Una sola regola per tutti e tre, invece di tre. */
export function scegliFra (mondo, chi, schiera, quale) {
  if (!schiera || !schiera.length) return null
  const voto = (SCELTE[quale] || SCELTE.vicino).voto(mondo, chi)
  let scelto = schiera[0], meglio = voto(scelto)
  for (const u of schiera) {
    const v = voto(u)
    if (v < meglio) { scelto = u; meglio = v }
  }
  return scelto
}
