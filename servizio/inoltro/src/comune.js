/* La fattoria in comune di un'amicizia (docs/fattoria3d/in-comune.md): la fila delle mosse dei due, numerate, e l'ultima
   fotografia della fattoria. Il servizio non legge né le mosse né la fotografia: le mette in fila, controlla chi scrive e la
   misura. Qui solo le regole; il Durable Object che le tiene è in index.js. */
import { CHIAVE, ID } from './presenza.js'

export const SCADENZA = 60 * 24 * 60 * 60 * 1000          // due mesi senza nessuno che scrive, poi non resta niente (i telefoni ne hanno una copia)
export const MAX_MOSSA = 1024                              // byte di una mossa
export const MAX_MOSSE = 20                                // mosse in una richiesta
export const MAX_FILA = 400                                // mosse tenute: oltre, le più vecchie (chi torna dopo tanto riparte dalla fotografia)
export const MAX_FOTO = 64 * 1024                          // byte della fotografia (una fattoria grande ne pesa ~9 KB)
export const COMUNE_ORA = 3000                             // richieste all'ora da uno stesso indirizzo: due telefoni che giocano, una ogni tre secondi

/* la richiesta del telefono: { chiave, id, dopo, mosse, foto } — `dopo` l'ultimo numero che ha già (-1 se non ha niente), `mosse`
   le sue nuove (oggetti), `foto` { seq, stato } la sua fattoria com'è dopo la mossa `seq`, o niente.
   Torna { ok, chiave, id, dopo, mosse (testi), foto ({ seq, testo } | null) } o { ok: false, errore } */
export function leggiRichiesta(corpo) {
  if (!corpo || typeof corpo !== 'object') return { ok: false, errore: 'richiesta storta' }
  if (!CHIAVE.test(corpo.chiave || '')) return { ok: false, errore: 'chiave storta' }
  if (!ID.test(corpo.id || '')) return { ok: false, errore: 'id storto' }
  const dopo = corpo.dopo === undefined ? -1 : corpo.dopo
  if (!Number.isInteger(dopo) || dopo < -1) return { ok: false, errore: 'dopo storto' }
  const lista = corpo.mosse === undefined ? [] : corpo.mosse
  if (!Array.isArray(lista) || lista.length > MAX_MOSSE) return { ok: false, errore: 'mosse storte' }
  const mosse = []
  for (const m of lista) {
    if (!m || typeof m !== 'object' || Array.isArray(m)) return { ok: false, errore: 'mossa storta' }
    const t = JSON.stringify(m)
    if (t.length > MAX_MOSSA) return { ok: false, errore: 'mossa troppo grande' }
    mosse.push(t)
  }
  let foto = null
  if (corpo.foto !== undefined && corpo.foto !== null) {
    const f = corpo.foto
    if (!f || typeof f !== 'object' || !Number.isInteger(f.seq) || f.seq < 0 || !f.stato || typeof f.stato !== 'object') return { ok: false, errore: 'foto storta' }
    const testo = JSON.stringify(f.stato)
    if (testo.length > MAX_FOTO) return { ok: false, errore: 'foto troppo grande' }
    foto = { seq: f.seq, testo }
  }
  return { ok: true, chiave: corpo.chiave, id: corpo.id, dopo, mosse, foto }
}

export const vuota = () => ({ soci: [], ultimo: 0, mosse: [], foto: null, letto: {} })

/* `stato` quello tenuto ({ soci, ultimo, mosse: [{ s, id, m }], foto: { s, testo } | null, letto: { [id]: s } }), la richiesta letta.
   Torna { stato (il nuovo), rifiutato, scritto, risposta: { ultimo, corsia, foto: { seq, testo } | null, mosse: [{ s, id, m }] } }.
   `corsia` è il posto di chi chiede fra i due (0 il primo arrivato): separa gli id delle cose che mettono.
   - È di due: il terzo id è rifiutato anche solo per leggere (come la bacheca).
   - Le mosse nuove prendono i numeri dopo `ultimo`, nell'ordine in cui arrivano.
   - La fotografia vince se non è più vecchia di quella tenuta; una più avanti di `ultimo` solo su una fattoria vuota (scaduta,
     e un telefono ne ha la copia). Le mosse che tutti e due hanno già letto e che la fotografia contiene si buttano.
   - Chi è più indietro della fotografia la riceve, con le mosse dopo di lei; gli altri ricevono solo le mosse dopo `dopo`. */
export function usa(stato, { id, dopo, mosse, foto }) {
  const s = { ...vuota(), ...(stato || {}) }
  s.soci = [...s.soci]; s.mosse = [...s.mosse]; s.letto = { ...s.letto }
  if (!s.soci.includes(id)) {
    if (s.soci.length >= 2) return { stato: s, rifiutato: true, scritto: false, risposta: null }
    s.soci.push(id)
  }
  let scritto = !stato || !(stato.soci || []).includes(id)
  if (foto) {
    const vuoto = !s.foto && !s.mosse.length
    const vale = foto.seq <= s.ultimo ? (!s.foto || foto.seq >= s.foto.s) : vuoto
    if (vale) { s.foto = { s: foto.seq, testo: foto.testo }; s.ultimo = Math.max(s.ultimo, foto.seq); scritto = true }
  }
  for (const m of mosse) { s.ultimo++; s.mosse.push({ s: s.ultimo, id, m }); scritto = true }
  // cosa ha chi chiede, dopo questa risposta
  const indietro = s.foto && dopo < s.foto.s
  const da = indietro ? s.foto.s : dopo
  const risposta = { ultimo: s.ultimo, corsia: s.soci.indexOf(id), foto: indietro ? { seq: s.foto.s, testo: s.foto.testo } : null, mosse: s.mosse.filter(x => x.s > da) }
  s.letto[id] = s.ultimo
  // si butta ciò che non serve più a nessuno: le mosse lette da tutti e due e già nella fotografia; e oltre il tetto le più vecchie
  const letteDaTutti = s.soci.length === 2 ? Math.min(...s.soci.map(x => s.letto[x] ?? -1)) : -1
  const via = s.foto ? Math.min(letteDaTutti, s.foto.s) : -1
  s.mosse = s.mosse.filter(x => x.s > via)
  if (s.mosse.length > MAX_FILA) s.mosse = s.mosse.slice(-MAX_FILA)
  return { stato: s, rifiutato: false, scritto, risposta }
}
