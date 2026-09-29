// La varietà a monete: stare tanto sullo stesso gioco rende sempre meno.
// Perché così e non un tetto di tempo: docs/genitori/varieta.md. Puro
// (niente Vue, niente archivio): chi legge il profilo e il registro delle
// sessioni è store/varieta.js.
import { chiaveGiorno } from '../store/sessioni.js'

export const DIFETTO = { pieno: 20, meta: 20 }   // minuti al giorno sullo stesso gioco
export const DOPPIO = 20          // minuti del ×2 di un gioco consigliato
export const DORMIENTE = 5        // giorni senza aprirlo: un gioco di scuola si sveglia col ×2
export const TETTO_MINUTI = 180   // quello che un grande può scrivere, per soglia
export const AVVISO_DA = 5        // sotto, è la monetina di un colpo: la dice la soglia, non il premio
export const AREE_DI_SCUOLA = ['numeri', 'parole']
// giochi che non danno monete: niente salvadanaio sulla carta (unita/varieta lo verifica sui sorgenti)
export const NON_PAGANO = ['generale', 'castello']
// una schermata che è un altro nome dello stesso gioco (App.vue)
export const ALIAS = { verbi: 'inglese' }

export const chiaveDelGioco = k => ALIAS[k] || k
export const paga = g => !!g && !g.posto && !NON_PAGANO.includes(g.chiave)
export const diScuola = g => paga(g) && AREE_DI_SCUOLA.includes(g.area)

const minuti = (v, d) => {
  const n = Math.round(Number(v))
  return Number.isFinite(n) && n >= 0 ? Math.min(TETTO_MINUTI, n) : d
}

// settings.varieta, com'è salvato → con tutti i campi e i numeri sani
export function regoleDi(v) {
  const r = v && typeof v === 'object' ? v : {}
  return {
    pieno: minuti(r.pieno, DIFETTO.pieno),
    meta: minuti(r.meta, DIFETTO.meta),
    giochi: r.giochi && typeof r.giochi === 'object' ? r.giochi : {},
    consigliati: r.consigliati && typeof r.consigliati === 'object' ? r.consigliati : {},
    dormienti: r.dormienti === true,
    ridato: r.ridato && typeof r.ridato === 'object' ? r.ridato : null,
  }
}

// 'tutti' · 'libero' · 'suoi': come la tacca dei genitori legge una riga
export function comeDi(regole, k) {
  const g = regole.giochi[k]
  if (g === 'libero') return 'libero'
  return g && typeof g === 'object' ? 'suoi' : 'tutti'
}

// null = nessun tetto
export function tettiDi(regole, k) {
  const g = regole.giochi[k]
  if (g === 'libero') return null
  if (g && typeof g === 'object')
    return { pieno: minuti(g.pieno, regole.pieno), meta: minuti(g.meta, regole.meta) }
  return { pieno: regole.pieno, meta: regole.meta }
}

export const eConsigliato = (regole, k) => regole.consigliati[k] === true

const mezzanotte = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime() }
// giorni di calendario, in ora locale: round e non floor, per l'ora legale
export const giorniFra = (a, b) => Math.round((mezzanotte(b) - mezzanotte(a)) / 86400000)

// l'ultima volta che l'ha aperto PRIMA di oggi: aprirlo oggi non lo fa smettere di dormire
function ultimaPrimaDiOggi(voci, k, oggi) {
  const g = chiaveGiorno(oggi)
  let ultima = 0
  for (const v of voci)
    if (chiaveDelGioco(v.g) === k && chiaveGiorno(v.t) < g && v.t > ultima) ultima = v.t
  return ultima || null
}

// Un bambino arrivato da meno di cinque giorni non ha giochi addormentati:
// senza questa riga il primo giorno avrebbe ogni gioco di scuola a ×2.
export function dormiente(voci, k, oggi) {
  let prima = Infinity
  for (const v of voci) if (v.t < prima) prima = v.t
  if (!Number.isFinite(prima) || giorniFra(prima, oggi) < DORMIENTE) return false
  const ultima = ultimaPrimaDiOggi(voci, k, oggi)
  return !ultima || giorniFra(ultima, oggi) >= DORMIENTE
}

// perché oggi vale doppio: 'consigliato' · 'dormiente' · null
export function doppioDi({ regole, gioco, voci = [], oggi = Date.now() }) {
  if (!paga(gioco)) return null
  if (eConsigliato(regole, gioco.chiave)) return 'consigliato'
  if (regole.dormienti && diScuola(gioco) && dormiente(voci, gioco.chiave, oggi)) return 'dormiente'
  return null
}

// i secondi di oggi che contano: il registro, più la partita aperta, meno il tempo ridato
export function secondiContati({ voci = [], gioco, oggi = Date.now(), inCorso = 0, ridato = null }) {
  const g = chiaveGiorno(oggi)
  let s = inCorso
  for (const v of voci) if (chiaveDelGioco(v.g) === gioco && chiaveGiorno(v.t) === g) s += v.s
  if (ridato && ridato.g === g) s -= (ridato.s || {})[gioco] || 0
  return Math.max(0, s)
}

// fase · fattore · restano (secondi al prossimo cambio, null se non cambia più)
export function fase({ tetti, secondi, doppio = false }) {
  if (doppio && secondi < DOPPIO * 60)
    return { fase: 'doppio', fattore: 2, restano: DOPPIO * 60 - secondi }
  if (!tetti) return { fase: 'libero', fattore: 1, restano: null }
  const pieno = tetti.pieno * 60, meta = (tetti.pieno + tetti.meta) * 60
  if (secondi < pieno) return { fase: 'pieno', fattore: 1, restano: pieno - secondi }
  if (secondi < meta) return { fase: 'meta', fattore: 0.5, restano: meta - secondi }
  return { fase: 'vuoto', fattore: 0, restano: null }
}

// tutto quello che serve a una carta, al conto delle monete e alla riga «Oggi»
export function statoDelGioco({ regole, gioco, voci = [], oggi = Date.now(), inCorso = 0 }) {
  if (!paga(gioco)) return { paga: false, fase: 'libero', fattore: 1, restano: null, secondi: 0, doppio: null }
  const secondi = secondiContati({ voci, gioco: gioco.chiave, oggi, inCorso, ridato: regole.ridato })
  const doppio = doppioDi({ regole, gioco, voci, oggi })
  return { paga: true, secondi, doppio,
           ...fase({ tetti: tettiDi(regole, gioco.chiave), secondi, doppio: !!doppio }) }
}

// A metà, una moneta sì e una no: il resto si porta alla volta dopo, se
// no un gioco che paga una moneta alla volta non calerebbe mai (o
// calerebbe a zero). Col ×1 e col ×2 il conto è intero e il resto non serve.
export function incasso(n, fattore, resto = 0) {
  if (!(n > 0)) return { dato: n, resto }
  const esatto = n * fattore
  if (Number.isInteger(esatto)) return { dato: esatto, resto }
  const conResto = esatto + resto
  const dato = Math.floor(conResto + 1e-9)
  return { dato, resto: conResto - dato }
}

// dove andare quando qui è finito: prima un ×2, poi il più pieno
export function suggerisci(candidati) {
  const peso = c => c.stato.fase === 'doppio' ? 3e6 + c.stato.restano
    : c.stato.fase === 'pieno' ? 2e6 + c.stato.restano
    : c.stato.fase === 'libero' ? 1e6 : -1
  const buoni = candidati.filter(c => peso(c) >= 0).sort((a, b) => peso(b) - peso(a))
  return buoni[0] || null
}

// ── le parole ──
const primi = s => Math.max(1, Math.ceil(s / 60))

// la carta in home: null quando non c'è niente da dire
export function sullaCarta(stato) {
  if (!stato.paga) return null
  switch (stato.fase) {
    case 'doppio': return { segno: 'doppio', testo: `🪙×2 · ancora ${primi(stato.restano)}′` }
    case 'pieno': return stato.secondi > 0
      ? { segno: 'pieno', testo: `ancora ${primi(stato.restano)}′ piene` } : null
    case 'meta': return { segno: 'meta', testo: `a metà · ancora ${primi(stato.restano)}′` }
    case 'vuoto': return { segno: 'vuoto', testo: 'finite per oggi' }
    default: return null
  }
}

// la scritta piccola dentro il gioco, quando cambia la fase
export const ALLA_SOGLIA = {
  pieno: '🪙 da qui normali',
  meta: '🪙 da qui metà',
  vuoto: '🪙 per oggi finite',
}

// fine tappa: il premio com'era e com'è
export function premioInParole({ chiesto, dato, nome, prova = '' }) {
  if (dato === chiesto) return ''
  if (dato > chiesto) return `🪙 ${chiesto} → ${dato} · ⭐ oggi ${nome} vale doppio`
  if (dato > 0) return `🪙 ${chiesto} → ${dato} · ${nome}: il salvadanaio è stanco, domani torna pieno`
  return prova ? `${nome}: monete finite per oggi · prova ${prova}`
               : `${nome}: monete finite per oggi · domani tornano`
}

// la riga «Oggi» dei genitori
export const FASE_BREVE = {
  doppio: '🪙×2', pieno: '🪙 piene', meta: '🪙 a metà', vuoto: '🪙 finite', libero: '🪙 senza tetto',
}
