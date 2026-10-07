// La grande storia in movimento: la roba con cui ci si aspetta che un eroe entri in una discesa, quello che una
// discesa e un banco devono dare per arrivarci, e chi è sotto. I numeri stanno in dati/storia.js; qui le regole,
// che girano in Node (il banco di prova ci misura sopra). Vedi docs/sotterraneo/la-grande-storia.md.
import { COSE, A_SORTE, pescaMerce } from '../dati/cose.js'
import { CAMPAGNA } from '../dati/campagna.js'
import { CASELLE, passoDi, POZIONI_ATTESE } from '../dati/storia.js'
import { VERSIONE_ROBA } from './corredo.js'

// l'indice di una tappa nella storia (−1 l'abisso, che non ne fa parte)
export const indiceDella = tappa => (!tappa || tappa.abisso ? -1 : CAMPAGNA.findIndex(t => t.chiave === tappa.chiave))

// la roba di un eroe che entra nella discesa `k` come dice la tabella; `pozioni` quelle attese, o nessuna
export function robaAttesa(eroe, k, { pozioni = true, gemme = 0 } = {}) {
  const r = passoDi(eroe, k)
  return {
    v: VERSIONE_ROBA, gemme,
    zaino: pozioni ? [...POZIONI_ATTESE[Math.max(0, Math.min(k, POZIONI_ATTESE.length - 1))]] : [],
    mano: r.mano, mancina: r.mancina, corpo: r.corpo, dito: r.dito, torcia: 0, torce: 0,
  }
}

// mettersela addosso servirebbe? Un'arma o una difesa che non fa meglio di quello che c'è non è un passo avanti
// (chi è già oltre la tabella non riceve una spada peggiore della sua); al dito conta solo non averla già
export function migliora(corredo, k) {
  const c = COSE[k]
  if (!c || !c.dove || !corredo.posso(k) || corredo.possiedo(k)) return false
  if (c.dove === 'dito') return true
  if (c.dove === 'mancina') {
    if (corredo.aDueMani(corredo.mano)) return false
    const ora = corredo.mancina && COSE[corredo.mancina]
    return !ora || ora.dove === 'mano' || (c.dif || 0) > (ora.dif || 0)
  }
  const conf = corredo.confronto(k)
  return !conf.addosso || conf.delta > 0
}

// La discesa `k` dà la riga dopo: chi porta la chiave dell'ultimo piano e i forzieri (motore/corsa.js). Torna la
// prima cosa di quella riga che a chi scende serve ancora, o null
export function premioPer(corredo, k, { evita = () => false } = {}) {
  if (k < 0) return null
  const dopo = passoDi(corredo.chiEro, k + 1)
  for (const c of CASELLE) {
    const x = dopo[c]
    if (x && migliora(corredo, x) && !evita(x)) return x
  }
  return null
}

// Il banco di un mercante del villaggio (dati/mercanti.js, `passo`): i pezzi della riga con cui si entra nella
// prossima discesa che mancano, e qualche cosa che costa non più di quel pezzo (`altre`), pescate come prima.
// Così il banco porta al passo dopo e non oltre: chi ha le gemme non scende col meglio della miniera
export function bancoDelPasso(m, corredo, finite, { rnd = Math.random, ammessa = () => true } = {}) {
  const riga = passoDi(corredo.chiEro, finite)
  const caselle = m.passo || []
  const delPasso = caselle.map(c => riga[c]).filter(x => x && migliora(corredo, x) && ammessa(x))
  const tetto = Math.max(0, ...caselle.map(c => (riga[c] ? COSE[riga[c]].prezzo : 0)))
  const dopo = new Set(CASELLE.map(c => passoDi(corredo.chiEro, finite + 1)[c]))
  const altre = m.altre ? pescaMerce(null, {
    quante: m.altre, rnd,
    ammessa: k => A_SORTE.includes(k) && ammessa(k) && !delPasso.includes(k) && !corredo.possiedo(k) &&
      COSE[k].prezzo <= tetto && !dopo.has(k),
    tua: k => corredo.posso(k),
  }) : []
  return [...delPasso, ...altre]
}

// Sotto il livello atteso per entrare nella discesa `k`: braccio o difesa sotto quelli della riga. Torna cosa
// manca ('arma' prima, poi 'difesa') e i due numeri, o null (docs/sotterraneo/la-grande-storia.md)
export function sottoIlLivello(scheda, attesa) {
  if (scheda.att < attesa.att) return { manca: 'arma', ha: scheda.att, serve: attesa.att }
  if (scheda.dif < attesa.dif) return { manca: 'difesa', ha: scheda.dif, serve: attesa.dif }
  return null
}
