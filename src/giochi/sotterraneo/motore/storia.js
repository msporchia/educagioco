// La grande storia in movimento: la roba con cui ci si aspetta che un eroe entri in una discesa, quello che una
// discesa e un banco devono dare per arrivarci, e chi è sotto. I numeri stanno in dati/storia.js; qui le regole,
// che girano in Node (il banco di prova ci misura sopra). Vedi docs/sotterraneo/la-grande-storia.md.
import { COSE, A_SORTE, pescaMerce } from '../dati/cose.js'
import { CAMPAGNA } from '../dati/campagna.js'
import { PASSI, CASELLE, passoDi, POZIONI_ATTESE, numeriDel } from '../dati/storia.js'
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

// quando compare per la prima volta nella fila di un eroe (−1: non c'è): dice chi è avanti e chi indietro
const rangoDi = (eroe, k) => (PASSI[eroe] || []).findIndex(riga => CASELLE.some(c => riga[c] === k))

// È un passo avanti, per chi ce l'ha addosso adesso? Una cosa che non si ha, nella casella dove c'è qualcosa che
// nella fila viene prima (o che costa meno, se non è nella fila): chi è già oltre la tabella non riceve una
// spada peggiore della sua, chi è indietro riceve il pezzo che gli manca
export function migliora(corredo, k) {
  const c = COSE[k]
  if (!c || !c.dove || !corredo.posso(k) || corredo.possiedo(k)) return false
  const ora = corredo.casella(c.dove)
  if (!ora || !COSE[ora]) return true
  const a = rangoDi(corredo.chiEro, ora), b = rangoDi(corredo.chiEro, k)
  if (a >= 0 && b >= 0) return b > a
  return (COSE[ora].prezzo || 0) < (c.prezzo || 0)
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

// «quella spada corta», «quello spadone», «quell'ascia», «quel bastone»: il nome della cosa in mezzo a una frase
const FEMMINILI = /^(spada|accetta|ascia|bipenne|verga|balestra|corazza)/i
export function quellaCosa(k) {
  const n = COSE[k].nome.toLowerCase()
  if (FEMMINILI.test(n)) return /^[aeiou]/.test(n) ? `quell'${n}` : `quella ${n}`
  if (/^[aeiou]/.test(n)) return `quell'${n}`
  return /^(s[^aeiou]|z|gn|ps)/.test(n) ? `quello ${n}` : `quel ${n}`
}

// La frase del minatore a chi tocca una discesa con la roba sotto la riga d'entrata (dati/storia.js): dice cosa
// manca con le cose che si hanno in mano, e da chi andare. `scheda`: schedaConLaRoba (att, dif e le caselle)
export function dettoDelLivello(eroe, scheda, tappa, k) {
  const manca = sottoIlLivello(scheda, numeriDel(eroe, k))
  if (!manca) return null
  if (manca.manca === 'arma') {
    const con = scheda.mano ? `Con ${quellaCosa(scheda.mano)}` : 'A mani nude'
    return { manca: 'arma', detto: `${con} ${tappa.dove} non duri: passa dall'armaiolo.` }
  }
  const senza = !scheda.mancina && !(scheda.mano && COSE[scheda.mano].mani === 2) ? 'senza scudo'
    : !scheda.corpo ? 'senza niente addosso' : `con ${quellaCosa(scheda.corpo)}`
  const dove = tappa.dove.charAt(0).toUpperCase() + tappa.dove.slice(1)
  return { manca: 'difesa', detto: `${dove} picchiano forte, e ${senza} non reggi: passa dall'armaiolo.` }
}
