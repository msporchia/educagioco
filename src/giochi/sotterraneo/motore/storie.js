// La storia giocata di fila da un giocatore tipo (docs/sotterraneo/giocatori-tipo.md): le sette discese una dopo l'altra, con quello che si
// trova davvero e si compra (il caso dei drop resta), rifacendo la discesa persa. Un passo è una discesa: serve anche alla ricerca
// (`--cerca`), che ricomincia da dove una discesa ha lasciato la roba e non rigioca le prime. Gira in Node.
import { gioca, allaBottega } from './banco.js'
import { alGiroNuovo } from './bottega.js'
import { CAMPAGNA } from '../dati/campagna.js'
import { COSE } from '../dati/cose.js'
import { ROBA_VUOTA, Corredo } from './corredo.js'
import { CRESCITA_NUOVA } from './crescita.js'
import { forzaDelCorredo } from './forza.js'
import { GIOCATORI_TIPO, NOMI_TIPO, STRADE, NOMI_STRADA, STRADA_BASE, stileDi, TENTATIVI, RISALITA } from '../dati/giocatori-tipo.js'
import { livelloAtteso } from './storia.js'
import { dannoPerRisposta, colpoBase, valoreDellaRoba, utiliComprati } from './fine.js'

const copia = o => JSON.parse(JSON.stringify(o))
const intero = (v, d = 0) => (Number.isFinite(v) ? v : d)

export const STATO_NUOVO = () => ({ roba: ROBA_VUOTA(), crescita: CRESCITA_NUOVA() })

const pozioniDi = zaino => zaino.filter(k => COSE[k] && COSE[k].usa === 'cura').length

// com'è l'eroe quando entra nella discesa k: livello, braccio, difesa, vita, la forza che il gioco gli dà (motore/forza.js), il danno di
// una risposta giusta al mostro di riferimento di quella discesa, quanto vale la roba e i pezzi che porta
export function ingressoDi(eroe, { roba, crescita }, k = 0) {
  const c = new Corredo({ eroe, roba, crescita })
  c.sistemaIlCorredo()
  return { liv: c.livelloEroe, att: c.att, dif: c.dif, vita: c.vitaConLaRoba, forza: forzaDelCorredo(c), dpa: dannoPerRisposta(c, livelloAtteso(k)), col: colpoBase(c, livelloAtteso(k)),
           valore: valoreDellaRoba(c), pezzi: [c.mano, c.mancina, c.corpo, c.collo, c.dito, c.dito2], poz: pozioniDi(c.zaino), gemme: c.gemme }
}

// una discesa giocata, ridotta a quello che il rapporto legge: l'esito, le domande, le pozioni, i piani e uno scontro per riga
function registro(g) {
  const e = g.esito
  return { v: e.vinta ? 1 : 0, sv: e.svenimenti, dom: e.domande, giu: e.giuste, pz: g.pozioni || 0, fo: g.fonti || 0, tt: g.alTetto ? 1 : 0, tc: g.toccaIlTetto ? 1 : 0, ct: g.cureTrovate || {}, cr: g.cureRifiutate || 0, sl: g.scale || [], ge: e.gemme,
           mo: e.mostri, liv: g.corsa.livelloEroe, pp: (g.perPiano || []).map(n => intero(n)), sc: g.scontri || [], guasto: g.guasto || null,
           ri: g.risalite || [], ar: g.armi || { trovati: 0, inutili: 0, rimandati: 0 } }
}

// il seme della partita n di una discesa: lo stesso per chi gioca la discesa dallo stesso ingresso, così il sotterraneo è lo stesso
export const semeDella = (seme, k, n = 0) => 100 + seme * 37 + k * 3 + n * 7919

function giocaCome(tipo, k, stato, { eroe, seme, n = 0, strada = STRADA_BASE, bravura = null }) {
  const botteghe = RISALITA.scaffale ? copia(stato.botteghe || {}) : null
  const g = GIOCATORI_TIPO[tipo]
  return gioca(CAMPAGNA[k], { seme: semeDella(seme, k, n), bravura: bravura ?? g.bravura, come: g.come, stile: stileDi(tipo, strada), eroe,
                              roba: copia(stato.roba), crescita: copia(stato.crescita),
                              risalita: { spesa: STRADE[strada].spesa, finite: k, seme: seme * 211 + k * 7 + n * 31 + 5, botteghe, obiettivo: stato.obiettivo ?? null } })
}

/* Un passo della storia di `tipo`: la spesa di sopra, poi la discesa `k` giocata fino a vincerla (al più `tentativi` volte, rifacendo la
   spesa dopo ogni sconfitta). `sonde`: giocatori tipo che giocano la stessa discesa una volta, dallo stesso ingresso (lo sbadato è il
   curioso in una giornata storta); `rifai`: discese già vinte da rifare con la roba di adesso. k = CAMPAGNA.length è solo la spesa
   in uscita dalla storia. `strada`: come spende e quanto beve (dati/giocatori-tipo.js, STRADE). Torna il passo (per il rapporto) e lo stato
   con cui si esce; `prima` è quello che si aveva uscendo dalla discesa di prima, ancora da spendere */
export function passoDellaStoria(k, stato, { tipo, eroe, seme, sonde = [], rifai = [], tentativi = TENTATIVI, strada = STRADA_BASE }) {
  let { roba, crescita } = stato
  let botteghe = RISALITA.scaffale ? copia(stato.botteghe || {}) : null   // i banchi pescati: restano gli stessi finché la discesa non finisce
  const prima = { gemme: roba.gemme, poz: pozioniDi(roba.zaino) }
  const spesa = STRADE[strada].spesa
  const scaffale = !!RISALITA.scaffale
  const spesaFatta = { pezzi: [], pozioni: 0, speso: 0, venduto: 0, obiettivo: null }
  const robaDiPrima = roba
  roba = allaBottega(roba, { finite: k, eroe, seme: seme * 101 + k, crescita, spesa, scaffale, botteghe, registro: spesaFatta })
  let obiettivo = spesaFatta.obiettivo   // il salto che non poteva pagare: scende sapendo quanto gli serve per tornare a prenderlo
  const passo = { tipo, strada, eroe, seme, k, prima, ingresso: ingressoDi(eroe, { roba, crescita }, k), tentativi: [], sonde: {}, rifatte: {}, pre: utiliComprati(eroe, crescita, robaDiPrima, roba) }
  for (const j of rifai) passo.rifatte[j] = registro(giocaCome(tipo, j, { roba, crescita }, { eroe, seme, n: 100, strada }))
  const stati = () => ({ roba, crescita, obiettivo, ...(botteghe ? { botteghe } : {}) })
  if (k >= CAMPAGNA.length) return { passo, stato: stati() }
  for (const s of sonde) passo.sonde[s] = registro(giocaCome(s, k, stati(), { eroe, seme }))
  for (let n = 0; n < tentativi; n++) {
    const g = giocaCome(tipo, k, stati(), { eroe, seme, n, strada })
    passo.tentativi.push(registro(g))
    roba = g.corsa.roba
    crescita = g.corsa.crescita
    if (botteghe) botteghe = alGiroNuovo(g.botteghe) || g.botteghe   // finita la discesa i banchi ruotano
    if (g.esito.vinta) break
    const dopo = { pezzi: [], pozioni: 0, speso: 0, venduto: 0, obiettivo: null }
    const robaPersa = roba
    roba = allaBottega(roba, { finite: k, eroe, seme: seme * 101 + k + n * 17, crescita, spesa, scaffale, botteghe, registro: dopo })
    obiettivo = dopo.obiettivo
    passo.pre += utiliComprati(eroe, crescita, robaPersa, roba)
  }
  return { passo, stato: stati() }
}

/* Il metro delle unità (docs/sotterraneo/giocatori-tipo.md, «Il metro è il curioso»): la discesa k giocata dal curioso (o da chi si dice) con la
   roba e la crescita con cui la sua storia ci arriva, la spesa di sopra già fatta. Un ingresso è una storia (`seme`) e un eroe; la fila degli
   ingressi si gioca una volta e si tiene. `n` cambia il sotterraneo (il seme della partita), `bravura` le risposte giuste. */
const ingressi = new Map()
export function ingressoDelCurioso(k, { eroe = 'cavaliere', seme = 1, strada = STRADA_BASE } = {}) {
  const chiave = `${eroe}|${seme}|${strada}`
  let fila = ingressi.get(chiave)
  if (!fila) { fila = []; ingressi.set(chiave, fila) }
  let s = fila.length ? fila[fila.length - 1].dopo : STATO_NUOVO()
  while (fila.length <= k) {
    const j = fila.length
    const opz = { tipo: 'curioso', eroe, seme, strada }
    const entrato = passoDellaStoria(j, s, { ...opz, tentativi: 0 }).stato
    s = passoDellaStoria(j, s, opz).stato
    fila.push({ entrato, dopo: s })
  }
  return copia(fila[k].entrato)
}
// `ritocca`: una funzione che riceve l'ingresso ({ roba, crescita }, una copia) e torna quello con cui si gioca davvero (le misure provano
// un livello in più o in meno, la roba di un'altra discesa, niente roba: test/aiuto/misure-curioso.mjs)
export function giocaDalCurioso(k, { eroe = 'cavaliere', seme = 1, n = 0, bravura = null, strada = STRADA_BASE, ritocca = null } = {}) {
  const ingresso = ingressoDelCurioso(k, { eroe, seme, strada })
  return giocaCome('curioso', k, ritocca ? ritocca(ingresso) : ingresso, { eroe, seme, n, strada, bravura })
}

// quali discese già vinte si rifanno al passo k: quella di due prima (la roba di chi è un po' più avanti), le ultime due all'uscita
export const rifatteAl = k => (k >= CAMPAGNA.length ? [CAMPAGNA.length - 2, CAMPAGNA.length - 1] : k >= 2 ? [k - 2] : [])

/* La storia intera di un eroe e un seme, per un giocatore di fila: `tipo` la gioca; il curioso porta con sé lo sbadato come sonda e le
   rifatte. `da`/`fino`: da quale discesa a quale (il passo `da` parte dalla roba attesa se `stato` manca, vedi `statoAtteso`) */
export function storiaDi({ tipo, eroe, seme, fino = CAMPAGNA.length, stato = null, da = 0, strada = STRADA_BASE }) {
  const curioso = tipo === 'curioso'
  const passi = []
  let s = stato || STATO_NUOVO()
  for (let k = da; k <= fino; k++) {
    const r = passoDellaStoria(k, s, { tipo, eroe, seme, strada, sonde: curioso ? ['sbadato'] : [], rifai: curioso ? rifatteAl(k).filter(j => j >= da) : [] })
    passi.push(r.passo)
    s = r.stato
  }
  return passi
}

/* Le linee di un giro (docs/sotterraneo/fine-discesa-e-strade.md): ogni giocatore tipo su ogni strada, una storia per eroe e per seme. Il curioso e
   il bravo di arma prima sono la `base` dei bersagli; le altre sono più corte (`semiStrade`) e compatte: serve l'esito, non ogni scontro. */
export function lineeDelGiro({ giocatori = NOMI_TIPO, strade = NOMI_STRADA, eroi, semi, semiStrade, semeDa = 1 }) {
  const lista = []
  for (const strada of strade) for (const tipo of giocatori) {
    const base = strada === STRADA_BASE && tipo !== 'sbadato'
    const n = base ? semi : semiStrade
    lista.push({ id: `${strada}·${tipo}`, tipo, strada, base, compatta: !base, sonde: base && tipo === 'curioso' ? ['sbadato'] : [], rifai: base && tipo === 'curioso',
                 storie: eroi.flatMap(eroe => Array.from({ length: n }, (_, i) => ({ eroe, seme: semeDa + i }))) })
  }
  return lista
}

// un passo senza gli scontri uno per uno (i registri tengono l'esito, le domande, le pozioni): per le linee che non sono la base
export function compatta(passo) {
  const senza = r => { const { sc, ...resto } = r; return resto }
  return { ...passo, tentativi: passo.tentativi.map(senza), rifatte: Object.fromEntries(Object.entries(passo.rifatte).map(([j, r]) => [j, senza(r)])),
           sonde: Object.fromEntries(Object.entries(passo.sonde).map(([j, r]) => [j, senza(r)])) }
}
