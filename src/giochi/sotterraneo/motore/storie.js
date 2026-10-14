// La storia giocata di fila da un giocatore tipo (docs/sotterraneo/giocatori-tipo.md): le sette discese una dopo l'altra, con quello che si
// trova davvero e si compra (il caso dei drop resta), rifacendo la discesa persa. Un passo è una discesa: serve anche alla ricerca
// (`--cerca`), che ricomincia da dove una discesa ha lasciato la roba e non rigioca le prime. Gira in Node.
import { gioca, allaBottega } from './banco.js'
import { CAMPAGNA } from '../dati/campagna.js'
import { COSE } from '../dati/cose.js'
import { ROBA_VUOTA, Corredo } from './corredo.js'
import { CRESCITA_NUOVA } from './crescita.js'
import { forzaDelCorredo } from './forza.js'
import { GIOCATORI_TIPO, stileDi, TENTATIVI } from '../dati/giocatori-tipo.js'

const copia = o => JSON.parse(JSON.stringify(o))
const intero = (v, d = 0) => (Number.isFinite(v) ? v : d)

export const STATO_NUOVO = () => ({ roba: ROBA_VUOTA(), crescita: CRESCITA_NUOVA() })

// com'è l'eroe quando entra: livello, braccio, difesa, vita, la forza che il gioco gli dà (motore/forza.js) e i pezzi che porta
export function ingressoDi(eroe, { roba, crescita }) {
  const c = new Corredo({ eroe, roba, crescita })
  c.sistemaIlCorredo()
  return { liv: c.livelloEroe, att: c.att, dif: c.dif, vita: c.vitaConLaRoba, forza: forzaDelCorredo(c),
           pezzi: [c.mano, c.mancina, c.corpo, c.dito], poz: c.zaino.filter(k => COSE[k] && COSE[k].usa === 'cura').length, gemme: c.gemme }
}

// una discesa giocata, ridotta a quello che il rapporto legge: l'esito, le domande, le pozioni, i piani e uno scontro per riga
function registro(g) {
  const e = g.esito
  return { v: e.vinta ? 1 : 0, sv: e.svenimenti, dom: e.domande, giu: e.giuste, pz: g.pozioni || 0, fo: g.fonti || 0, ge: e.gemme,
           mo: e.mostri, liv: g.corsa.livelloEroe, pp: (g.perPiano || []).map(n => intero(n)), sc: g.scontri || [], guasto: g.guasto || null }
}

// il seme della partita n di una discesa: lo stesso per chi gioca la discesa dallo stesso ingresso, così il sotterraneo è lo stesso
export const semeDella = (seme, k, n = 0) => 100 + seme * 37 + k * 3 + n * 7919

function giocaCome(tipo, k, stato, { eroe, seme, n = 0 }) {
  const g = GIOCATORI_TIPO[tipo]
  return gioca(CAMPAGNA[k], { seme: semeDella(seme, k, n), bravura: g.bravura, come: g.come, stile: stileDi(tipo), eroe,
                              roba: copia(stato.roba), crescita: copia(stato.crescita) })
}

/* Un passo della storia di `tipo`: la spesa di sopra, poi la discesa `k` giocata fino a vincerla (al più `tentativi` volte, rifacendo la
   spesa dopo ogni sconfitta). `sonde`: giocatori tipo che giocano la stessa discesa una volta, dallo stesso ingresso (lo sbadato è il
   curioso in una giornata storta); `rifai`: discese già vinte da rifare con la roba di adesso. k = CAMPAGNA.length è solo la spesa
   in uscita dalla storia. Torna il passo (per il rapporto) e lo stato con cui si esce */
export function passoDellaStoria(k, stato, { tipo, eroe, seme, sonde = [], rifai = [], tentativi = TENTATIVI }) {
  let { roba, crescita } = stato
  roba = allaBottega(roba, { finite: k, eroe, seme: seme * 101 + k, crescita })
  const passo = { tipo, eroe, seme, k, ingresso: ingressoDi(eroe, { roba, crescita }), tentativi: [], sonde: {}, rifatte: {} }
  for (const j of rifai) passo.rifatte[j] = registro(giocaCome(tipo, j, { roba, crescita }, { eroe, seme, n: 100 }))
  if (k >= CAMPAGNA.length) return { passo, stato: { roba, crescita } }
  for (const s of sonde) passo.sonde[s] = registro(giocaCome(s, k, { roba, crescita }, { eroe, seme }))
  for (let n = 0; n < tentativi; n++) {
    const g = giocaCome(tipo, k, { roba, crescita }, { eroe, seme, n })
    passo.tentativi.push(registro(g))
    roba = g.corsa.roba
    crescita = g.corsa.crescita
    if (g.esito.vinta) break
    roba = allaBottega(roba, { finite: k, eroe, seme: seme * 101 + k + n * 17, crescita })
  }
  return { passo, stato: { roba, crescita } }
}

// quali discese già vinte si rifanno al passo k: quella di due prima (la roba di chi è un po' più avanti), le ultime due all'uscita
export const rifatteAl = k => (k >= CAMPAGNA.length ? [CAMPAGNA.length - 2, CAMPAGNA.length - 1] : k >= 2 ? [k - 2] : [])

/* La storia intera di un eroe e un seme, per un giocatore di fila: `tipo` la gioca; il curioso porta con sé lo sbadato come sonda e le
   rifatte. `da`/`fino`: da quale discesa a quale (il passo `da` parte dalla roba attesa se `stato` manca, vedi `statoAtteso`) */
export function storiaDi({ tipo, eroe, seme, fino = CAMPAGNA.length, stato = null, da = 0 }) {
  const curioso = tipo === 'curioso'
  const passi = []
  let s = stato || STATO_NUOVO()
  for (let k = da; k <= fino; k++) {
    const r = passoDellaStoria(k, s, { tipo, eroe, seme, sonde: curioso ? ['sbadato'] : [], rifai: curioso ? rifatteAl(k).filter(j => j >= da) : [] })
    passi.push(r.passo)
    s = r.stato
  }
  return passi
}
