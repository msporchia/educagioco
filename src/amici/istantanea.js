// L'istantanea che un bambino lascia nella bacheca di ogni amicizia (docs/core/amici-bacheca.md): per ogni gioco dove è arrivato
// e il suo record, e il giorno (non l'ora: serve solo a dire quanto è vecchia). Parte pura: gira in Node.
import { GIOCHI } from '../data/giochi.js'
import { filaDi, posizioneOra } from '../data/asteroidi.js'
import { apriQuaderno, sfideDi } from '../giochi/primati.js'

export const VERSIONE = 1
const NUMERO_MAX = 10_000_000
const GIORNO = /^\d{4}-\d{2}-\d{2}$/

/* il record della sfida sola di un gioco, letto come lo legge `primatoDi` (record di prima compreso) */
function recordDi(p, chiave) {
  const s = sfideDi(GIOCHI.find(g => g.chiave === chiave)?.senzaFine)[0]
  if (!s) return 0
  return apriQuaderno((p.campagne || {})[chiave] || {}, s.chiave ? s : null, s.vecchio ? s.vecchio(p) : 0).best
}

/* I giochi nella bacheca: una riga per gioco, e solo quelli che qualcuno mostra (oggi gli Asteroidi).
   `tappa` è il nodo della mappa (negli Asteroidi la lunghezza della fila è il volo infinito), `record` il primato.
   Chi non ha ancora fatto niente in quel gioco non c'è: un pallino sulla prima tappa direbbe che ci sta giocando. */
const seFatto = (tappa, record) => (tappa || record ? { tappa, record } : null)
export const NELLA_BACHECA = {
  mate: p => seFatto(posizioneOra(filaDi(p.mate)), recordDi(p, 'mate')),
}

const due = n => String(n).padStart(2, '0')
/* il giorno di quell'istante, sull'orologio del telefono */
export const giornoDi = ms => { const d = new Date(ms); return `${d.getFullYear()}-${due(d.getMonth() + 1)}-${due(d.getDate())}` }

export function istantanea(profilo, ora = Date.now()) {
  const giochi = {}
  for (const [chiave, leggi] of Object.entries(NELLA_BACHECA)) {
    const g = leggi(profilo || {})
    if (g) giochi[chiave] = g
  }
  return { v: VERSIONE, giorno: giornoDi(ora), giochi }
}

/* due istantanee dicono la stessa cosa (il giorno a parte)? Serve a non riscrivere la bacheca per niente */
export const firma = ist => JSON.stringify(ist?.giochi || {})

const numero = x => (Number.isInteger(x) && x >= 0 && x <= NUMERO_MAX ? x : null)

/* quella che arriva dall'amico: torna la forma pulita (solo i giochi e i campi che conosciamo) o null */
export function leggiIstantanea(x) {
  if (!x || typeof x !== 'object' || x.v !== VERSIONE || !GIORNO.test(x.giorno || '') || !x.giochi || typeof x.giochi !== 'object') return null
  const giochi = {}
  for (const chiave of Object.keys(NELLA_BACHECA)) {
    const g = x.giochi[chiave]
    if (!g || typeof g !== 'object') continue
    const tappa = numero(g.tappa), record = numero(g.record)
    if (tappa === null && record === null) continue
    giochi[chiave] = { tappa: tappa ?? 0, record: record ?? 0 }
  }
  return { v: VERSIONE, giorno: x.giorno, giochi }
}

/* quanti giorni sono passati da quel giorno a oggi (0 = oggi); mai negativo, anche con l'orologio di un altro telefono avanti */
export function giorniFa(giorno, ora = Date.now()) {
  if (!GIORNO.test(giorno || '')) return null
  const [a, m, g] = giorno.split('-').map(Number)
  const oggi = new Date(ora)
  const d = Math.round((Date.UTC(oggi.getFullYear(), oggi.getMonth(), oggi.getDate()) - Date.UTC(a, m - 1, g)) / 86_400_000)
  return Math.max(0, d)
}

export function quandoInParole(giorno, ora = Date.now()) {
  const d = giorniFa(giorno, ora)
  if (d === null) return ''
  return d === 0 ? 'oggi' : d === 1 ? 'ieri' : `${d} giorni fa`
}

/* A fine partita, il risultato contro i record degli amici (`amici`: [{ nome, record }]).
   `superati`: chi aveva un record che prima non avevi passato e adesso sì; `prossimo`: il record più basso fra quelli ancora
   sopra questo risultato, e quanto è mancato. Un pareggio non supera nessuno, come nei primati. */
export function controAmici(valore, prima, amici) {
  const v = Math.max(0, Math.floor(Number(valore) || 0)), p = Math.max(0, Math.floor(Number(prima) || 0))
  const conRecord = (amici || []).filter(a => a && a.record > 0)
  const superati = conRecord.filter(a => a.record >= p && a.record < v).sort((x, y) => y.record - x.record)
  const sopra = conRecord.filter(a => a.record > v).sort((x, y) => x.record - y.record)
  return { superati, prossimo: sopra.length ? { ...sopra[0], mancano: sopra[0].record - v } : null }
}
