// L'istantanea che un bambino lascia nella bacheca di ogni amicizia (docs/core/amici-bacheca.md): per ogni gioco dove è arrivato
// e i suoi record, e il giorno (non l'ora: serve solo a dire quanto è vecchia). Parte pura: gira in Node.
// Cosa entra lo dichiarano i giochi, con `amici` nel manifesto (o nella loro riga di data/giochi.js): qui non si nomina nessun gioco.
import { GIOCHI } from '../data/giochi.js'
import { apriQuaderno, sfideDi, inParole, scartoInParole } from '../giochi/primati.js'

export const VERSIONE = 1
const NUMERO_MAX = 10_000_000
const GIORNO = /^\d{4}-\d{2}-\d{2}$/
const SFIDA = /^[a-z0-9-]{0,24}$/                // la chiave di una sfida senza fine; '' è quella sola

/* i giochi che mostrano gli amici: quelli con `amici` nel manifesto */
export const giochiConAmici = () => GIOCHI.filter(g => g.amici)
export const conAmici = chiave => GIOCHI.find(g => g.chiave === chiave && g.amici) || null

/* La dichiarazione di un gioco, coi valori di serie. Un gioco ha uno o più percorsi (una mappa ciascuno: Passo passo ne ha uno per
   protagonista); `{ tappe, dove, tappa? }` è il percorso solo (chiave ''), `{ percorsi: { coniglio: {…}, cane: {…} } }` più d'uno,
   `true` nessuno (solo record). Per ogni percorso: `tappe` quanti nodi ha la mappa prima della sfida senza fine (che è il nodo
   `tappe`), `tappa(p)` dove è arrivato (di serie, solo per il percorso solo, il cursore di `campagne[chiave]`, e finita la campagna
   la sfida senza fine), `dove` come si dice esserci arrivati («alla sopravvivenza»). */
export function dichiarazione(g) {
  const d = g.amici === true ? {} : g.amici
  const cursore = tappe => p => {
    const c = (p.campagne || {})[g.chiave] || {}
    return c.libera ? tappe : Math.floor(Number(c.tappa) || 0)
  }
  const percorso = (chiave, x) => {
    const tappe = Number.isInteger(x.tappe) && x.tappe > 0 ? x.tappe : 0
    const tappa = typeof x.tappa === 'function' ? x.tappa : chiave === '' ? cursore(tappe) : () => 0
    return { chiave, tappe, dove: x.dove || '', tappa: p => Math.max(0, Math.min(tappe, Math.floor(Number(tappa(p)) || 0))) }
  }
  const percorsi = d.percorsi && typeof d.percorsi === 'object'
    ? Object.entries(d.percorsi).map(([k, x]) => percorso(k, x || {}))
    : d.tappe ? [percorso('', d)] : []
  return { percorsi: percorsi.filter(x => x.tappe) }
}
export const percorsoDi = (g, chiave = '') => dichiarazione(g).percorsi.find(x => x.chiave === (chiave || '')) || null

/* i record di un gioco, per sfida ('' la sola), letti come li legge `primatoDi` (record di prima compreso) */
export function recordDel(p, g) {
  const r = {}
  for (const s of sfideDi(g.senzaFine)) {
    const best = apriQuaderno((p.campagne || {})[g.chiave] || {}, s.chiave ? s : null, s.vecchio ? s.vecchio(p) : 0).best
    if (best > 0) r[s.chiave || ''] = best
  }
  return r
}

/* Un gioco nell'istantanea: { posti: { <percorso>: nodo }, primati: { <sfida>: n } }. Chi non ha ancora fatto niente in un percorso
   non ci ha un posto, e in un gioco non c'è: un pallino sulla prima tappa direbbe che ci sta giocando. */
export function leggiGioco(p, g) {
  const posti = {}
  for (const x of dichiarazione(g).percorsi) {
    const n = x.tappa(p)
    if (n > 0) posti[x.chiave] = n
  }
  const primati = recordDel(p, g)
  return Object.keys(posti).length || Object.keys(primati).length ? { posti, primati } : null
}

const due = n => String(n).padStart(2, '0')
/* il giorno di quell'istante, sull'orologio del telefono */
export const giornoDi = ms => { const d = new Date(ms); return `${d.getFullYear()}-${due(d.getMonth() + 1)}-${due(d.getDate())}` }

export function istantanea(profilo, ora = Date.now()) {
  const giochi = {}
  for (const g of giochiConAmici()) {
    const x = leggiGioco(profilo || {}, g)
    if (x) giochi[g.chiave] = x
  }
  return { v: VERSIONE, giorno: giornoDi(ora), giochi }
}

/* due istantanee dicono la stessa cosa (il giorno a parte)? Serve a non riscrivere la bacheca per niente */
export const firma = ist => JSON.stringify(ist?.giochi || {})

const numero = x => (Number.isInteger(x) && x >= 0 && x <= NUMERO_MAX ? x : null)

/* quella che arriva dall'amico: torna la forma pulita (solo i giochi, i percorsi, le sfide e i campi che conosciamo) o null */
export function leggiIstantanea(x) {
  if (!x || typeof x !== 'object' || x.v !== VERSIONE || !GIORNO.test(x.giorno || '') || !x.giochi || typeof x.giochi !== 'object') return null
  const giochi = {}
  for (const g of giochiConAmici()) {
    const y = x.giochi[g.chiave]
    if (!y || typeof y !== 'object') continue
    const sfide = new Set(sfideDi(g.senzaFine).map(s => s.chiave || ''))
    const primati = {}
    for (const [k, v] of Object.entries(y.primati && typeof y.primati === 'object' ? y.primati : {})) {
      if (SFIDA.test(k) && sfide.has(k) && numero(v)) primati[k] = v
    }
    const posti = {}
    for (const p of dichiarazione(g).percorsi) {
      const n = numero(y.posti && typeof y.posti === 'object' ? y.posti[p.chiave] : null)
      if (n) posti[p.chiave] = Math.min(n, p.tappe)
    }
    if (!Object.keys(posti).length && !Object.keys(primati).length) continue
    giochi[g.chiave] = { posti, primati }
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

/* L'amico da raggiungere: il più vicino fra quelli più avanti di `qui` (un nodo della mappa). In parole; `ultimo` è il nodo della
   sfida senza fine, e `dove` come dirlo («al volo infinito»). Chi è dietro non si dice: sulla mappa basta il pallino. */
export function davantiInParole(amici, qui, { ultimo = Infinity, dove = '' } = {}) {
  const a = (amici || []).filter(x => x.tappa > qui).sort((x, y) => x.tappa - y.tappa)[0]
  if (!a) return ''
  const n = a.tappa - qui
  return a.tappa >= ultimo && dove ? `${a.nome} è già ${dove}.`
    : `${a.nome} è ${n === 1 ? 'una tappa' : n + ' tappe'} più avanti di te.`
}

/* L'amico è davanti in quel gioco? `tappa`: su una mappa è più avanti di me; `record`: in una sfida ha un record più alto del
   mio. Solo dove io ci sono già (un posto, un record): chi non ha mai giocato non è stato superato. */
function davantiPer(sua, mia, tipo) {
  const campo = tipo === 'tappa' ? 'posti' : 'primati'
  const suoi = sua?.[campo] || {}, miei = mia?.[campo] || {}
  return Object.keys(suoi).filter(k => miei[k] > 0 && suoi[k] > miei[k])
}
export const davantiIn = (sua, mia, gioco, tipo) => davantiPer(sua?.giochi?.[gioco], mia?.giochi?.[gioco], tipo).length > 0

/* «Melody ti ha superato» (docs/core/amici-nei-giochi.md): i giochi dove l'amico, fra la sua istantanea di `prima` e quella di
   `dopo`, è passato davanti a dove sono io adesso (`mia`). Al massimo uno per gioco, la tappa prima del record. La prima
   istantanea di un amico non supera nessuno: era già lì. */
export function sorpassi(prima, dopo, mia) {
  if (!prima || !dopo) return []
  const fuori = []
  for (const gioco of Object.keys(dopo.giochi || {})) {
    const d = dopo.giochi[gioco], p = prima.giochi?.[gioco], m = mia?.giochi?.[gioco]
    for (const tipo of ['tappa', 'record']) {
      const gia = new Set(davantiPer(p, m, tipo))
      if (davantiPer(d, m, tipo).some(k => !gia.has(k))) { fuori.push({ gioco, tipo }); break }
    }
  }
  return fuori
}

/* in parole, per la riga in home */
export const sorpassoInParole = (nome, tipo) => tipo === 'record' ? `${nome} ha battuto il tuo record` : `${nome} ti ha superato`

/* «Leonardo è qui», «Leonardo e Melody sono qui» */
export const quiInParole = amici => (!amici || !amici.length ? '' : amici.length === 1 ? `${amici[0].nome} è qui`
  : `${amici.slice(0, -1).map(a => a.nome).join(', ')} e ${amici[amici.length - 1].nome} sono qui`)

/* I record degli amici per l'elenco sotto il proprio, dal più alto, già in parole */
export const recordDegliAmici = (amici, misura) => (amici || []).filter(a => a.record > 0)
  .sort((x, y) => y.record - x.record).map(a => ({ ...a, record: inParole(a.record, misura) }))

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

/* la notizia porta la misura, come quella del record (docs/core/primati.md) */
export function controAmiciInParole({ superati, prossimo }, misura) {
  if (superati.length === 1) return `Hai superato ${superati[0].nome} (${inParole(superati[0].record, misura)})!`
  if (superati.length > 1) return `Hai superato ${superati.slice(0, -1).map(a => a.nome).join(', ')} e ${superati[superati.length - 1].nome}!`
  if (prossimo) return `Per ${prossimo.nome} (${inParole(prossimo.record, misura)}) ti sono mancati ${scartoInParole(prossimo.mancano, misura)}`
  return ''
}
