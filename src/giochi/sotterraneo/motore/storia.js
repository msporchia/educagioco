// La grande storia in movimento: la roba con cui ci si aspetta che un eroe entri in una discesa, quello che una
// discesa e un banco devono dare per arrivarci, e chi è sotto. I numeri stanno in dati/storia.js; qui le regole,
// che girano in Node (il banco di prova ci misura sopra). Vedi docs/sotterraneo/la-grande-storia.md.
import { COSE, A_SORTE, pescaMerce, baseDi, aLivello, chiaveDelPezzo } from '../dati/cose.js'
import { CAMPAGNA, QUANTE_TAPPE } from '../dati/campagna.js'
import { PASSI, CASELLE, passoDi, POZIONI_ATTESE, LIVELLI_ATTESI } from '../dati/storia.js'
import { eroeDi } from '../dati/eroi.js'
import { VERSIONE_ROBA, Corredo } from './corredo.js'
import { crescitaA } from './crescita.js'
import { pescaAbilita, pezzoDelGrosso } from './bottino.js'
import { GROSSI, GROSSO_DELLA_DISCESA } from '../dati/grossi.js'

// l'indice di una tappa nella storia (−1 l'abisso, che non ne fa parte)
export const indiceDella = tappa => (!tappa || tappa.abisso ? -1 : CAMPAGNA.findIndex(t => t.chiave === tappa.chiave))

// Con che crescita si entra nella discesa `k` (docs/sotterraneo/livelli.md): il livello atteso (dati/storia.js,
// LIVELLI_ATTESI), coi punti dati come li dà il banco
const fuori = (fila, k) => fila[Math.max(0, Math.min(k, fila.length - 1))]
export const livelloAtteso = k => fuori(LIVELLI_ATTESI, k)
export const crescitaAttesa = (eroe, k, come = null) => crescitaA(eroeDi(eroe), livelloAtteso(k), come)
// i pezzi della riga sono del livello di chi l'ha portata fin lì: uno sotto il suo
export const livelloDeiPezzi = k => Math.max(1, livelloAtteso(k) - 1)

// La roba di un eroe che entra nella discesa `k`, come la porta chi fa la storia: discesa dopo discesa riceve i pezzi
// della riga dopo (dati/storia.js, a un livello sotto quello atteso) e il pezzo col nome del mostro grosso
// (dati/grossi.js, che lo lascia di sicuro), e tiene addosso quello che rende di più, come fa il gioco per terra (il
// resto lo vende). Il pezzo raro che il grosso lascia insieme no: è pescato a caso, è il premio della fortuna.
// `pozioni` quelle attese, o nessuna. Provato: la riga e basta, coi pezzi dei grossi solo nelle caselle vuote; chi
// gioca davvero era molto più forte della tabella (la mazza di Grumo batte la spada corta), e la tabella mentiva
export function robaAttesa(eroe, k, { pozioni = true, gemme = 0 } = {}) {
  const c = new Corredo({ eroe, roba: { v: VERSIONE_ROBA, gemme, zaino: [], torcia: 0, torce: 0 } })
  const fino = Math.max(0, Math.min(k, CAMPAGNA.length))
  for (let j = 0; j < fino; j++) {
    const L = livelloDeiPezzi(j + 1)
    const riga = passoDi(eroe, j + 1)
    const g = GROSSI[GROSSO_DELLA_DISCESA[CAMPAGNA[j].chiave]]
    const nuovi = [...CASELLE.map(x => riga[x]).filter(Boolean).map(x => aLivello(x, L)),
                   ...(g ? [pezzoDelGrosso(g.pezzo, L)] : [])]
    // i pezzi della riga prima: si rimettono al livello nuovo (la stessa riga, comprata e ritrovata a tono)
    // (solo quelli comuni: un pezzo col nome resta quello che è)
    for (const x of CASELLE) {
      const ora = c.casella(x)
      if (ora && !ora.includes('.') && riga[x] === baseDi(ora)) c.metti(x, aLivello(ora, L))
    }
    for (let giro = 0; giro < 2; giro++) for (const p of nuovi) {
      if (!COSE[p] || c.possiedo(p)) continue
      const d = COSE[p].dove
      const meglio = c.vaAddosso(p) || (d === 'dito' && c.confronto(p).meglio > 0) ||
        (d === 'mancina' && c.posso(p) && !c.aDueMani(c.mano) && c.confronto(p).meglio > 0)
      if (!meglio) continue
      const dove = c.confronto(p).dove
      c.metti(dove, p)
      c.sistemaLeMani()
    }
    c.zaino = []
  }
  const fuori = c.roba
  fuori.zaino = pozioni ? [...POZIONI_ATTESE[Math.max(0, Math.min(k, POZIONI_ATTESE.length - 1))]] : []
  return fuori
}

// I numeri con cui si dovrebbe entrare nella discesa `k`: la riga della tabella, al livello atteso
export function numeriAttesi(eroe, k) {
  const c = new Corredo({ eroe, roba: robaAttesa(eroe, k, { pozioni: false }), crescita: crescitaAttesa(eroe, k) })
  return { att: c.att, dif: c.dif, vita: c.vitaConLaRoba, livello: c.livelloEroe }
}

// quando compare per la prima volta nella fila di un eroe (−1: non c'è): dice chi è avanti e chi indietro. Conta la
// base del pezzo, non il livello né la rarità
const rangoDi = (eroe, k) => (PASSI[eroe] || []).findIndex(riga => CASELLE.some(c => riga[c] === baseDi(k)))

// È un passo avanti, per chi ce l'ha addosso adesso? Una cosa che non si ha, nella casella dove c'è qualcosa che
// nella fila viene prima (o che costa meno, se non è nella fila); a pari posto nella fila (lo stesso pezzo a un
// livello più alto, o magico) se rende di più. Chi è già oltre la tabella non riceve una spada peggiore della sua,
// chi è indietro riceve il pezzo che gli manca
export function migliora(corredo, k) {
  const c = COSE[k]
  if (!c || !c.dove || !corredo.posso(k) || corredo.possiedo(k)) return false
  const ora = corredo.casella(c.dove)
  if (!ora || !COSE[ora]) return true
  // un pezzo magico, raro o col nome si giudica sui numeri, non sul posto della sua base nella fila
  const comune = x => !COSE[x].rarita || COSE[x].rarita === 'comune'
  if (!comune(ora) || !comune(k)) {
    const conf = corredo.confronto(k)
    return !!conf && conf.meglio > 0
  }
  const a = rangoDi(corredo.chiEro, ora), b = rangoDi(corredo.chiEro, k)
  // un'arma a due mani che fa posare uno scudo speciale si giudica sui numeri: lo scudo che si perde conta
  const mancina = corredo.casella('mancina')
  if (c.mani === 2 && mancina && COSE[mancina] && !comune(mancina)) {
    const conf = corredo.confronto(k)
    return !!conf && conf.meglio > 0
  }
  if (a >= 0 && b >= 0 && a !== b) return b > a
  if (baseDi(ora) === baseDi(k) || (a >= 0 && a === b)) {
    const conf = corredo.confronto(k)
    return !!conf && conf.meglio > 0
  }
  return (COSE[ora].prezzo || 0) < (c.prezzo || 0)
}

// La discesa `k` dà la riga dopo: chi porta la chiave dell'ultimo piano e i forzieri (motore/corsa.js). Torna la
// prima cosa di quella riga che a chi scende serve ancora, al livello `livello` (il bottino a tono), o null
export function premioPer(corredo, k, { evita = () => false, livello = 1 } = {}) {
  if (k < 0) return null
  const dopo = passoDi(corredo.chiEro, k + 1)
  // un pezzo che si ha già (a qualunque livello) non è il passo dopo: il passo dopo è un pezzo nuovo
  const gia = new Set([...CASELLE.map(c => corredo.casella(c)), ...corredo.zaino].filter(Boolean).map(baseDi))
  for (const c of CASELLE) {
    const x = dopo[c]
    if (x && !gia.has(x) && migliora(corredo, aLivello(x, livello)) && !evita(x)) return aLivello(x, livello)
  }
  return null
}

// Quante righe avanti al passo sta un pezzo nella fila di un eroe: 0 se è il pezzo con cui si entra nella prossima
// discesa (o non è della fila), 1 se è della riga dopo, e così via. Dice quanto costa in più al banco (sovrapprezzo)
export function righeAvanti(eroe, finite, k) {
  const fila = PASSI[eroe] || PASSI.cavaliere
  for (let r = Math.max(0, finite); r < fila.length; r++)
    if (CASELLE.some(c => fila[r][c] === baseDi(k))) return r - Math.max(0, finite)
  return 0
}

// i banchi sono a tono col livello dell'eroe (docs/sotterraneo/rarita.md): un pezzo in più su tre è magico
export const MAGICI_SUL_BANCO = 1 / 3
function aTono(k, L, rnd) {
  if (!COSE[k] || !COSE[k].dove) return k
  if (rnd() >= MAGICI_SUL_BANCO) return aLivello(k, L)
  const abilita = pescaAbilita(baseDi(k), 1 + Math.floor(rnd() * 2), rnd)
  return chiaveDelPezzo(baseDi(k), L, abilita.length ? 'magico' : 'comune', abilita)
}

// Il banco di un mercante del villaggio (dati/mercanti.js, `passo`): i pezzi della riga con cui si entra nella
// prossima discesa che mancano, e qualche cosa che costa non più di quel pezzo (`altre`), pescate come prima.
// Pezzi che l'eroe non porta non ci sono mai, e quelli delle righe dopo non arrivano per questa via: stanno nella
// vetrina, a un prezzo più alto (vetrinaDelPasso)
export function bancoDelPasso(m, corredo, finite, { rnd = Math.random, ammessa = () => true } = {}) {
  const L = corredo.livelloEroe
  const riga = passoDi(corredo.chiEro, finite)
  const caselle = m.passo || []
  const delPasso = caselle.map(c => riga[c]).filter(x => x && ammessa(x) && migliora(corredo, aLivello(x, L)))
  const tetto = Math.max(0, ...caselle.map(c => (riga[c] ? COSE[riga[c]].prezzo : 0)))
  const avanti = new Set()
  for (let r = finite + 1; r <= QUANTE_TAPPE; r++) for (const c of CASELLE) avanti.add(passoDi(corredo.chiEro, r)[c])
  const altre = m.altre ? pescaMerce(null, {
    quante: m.altre, rnd,
    ammessa: k => A_SORTE.includes(k) && ammessa(k) && corredo.posso(k) && !delPasso.includes(k) && !corredo.possiedo(k) &&
      COSE[k].prezzo <= tetto && !avanti.has(k),
    tua: k => corredo.posso(k),
  }) : []
  return [...delPasso.map(x => aLivello(x, L)), ...altre.map(x => aTono(x, L, rnd))]
}

// La vetrina: i pezzi delle righe dopo che il banco non porta ancora, al più `quanti` per casella, ognuno con la
// discesa da finire perché arrivi sul banco (`finita`, indice di CAMPAGNA) e le righe di distanza (`avanti`, da
// cui il sovrapprezzo). Si comprano lo stesso, se hai le gemme: il banco non resta mai vuoto, e chi guarda sa
// cosa l'aspetta (docs/sotterraneo/bottega.md, "I mercanti di sopra")
export function vetrinaDelPasso(m, corredo, finite, { quanti = 2, banco = [] } = {}) {
  const L = corredo.livelloEroe
  const fuori = []
  const visti = new Set(banco.map(baseDi))
  for (const c of m.passo || []) {
    let n = 0
    for (let r = finite + 1; r <= QUANTE_TAPPE && n < quanti; r++) {
      const x = passoDi(corredo.chiEro, r)[c]
      if (!x || visti.has(x) || !migliora(corredo, aLivello(x, L))) continue
      visti.add(x)
      fuori.push({ chiave: aLivello(x, L), finita: r - 1, avanti: r - finite })
      n++
    }
  }
  return fuori
}

// Sotto il livello atteso per entrare nella discesa `k`: braccio o difesa sotto quelli della riga. Torna cosa
// manca ('arma' prima, poi 'difesa') e i due numeri, o null (docs/sotterraneo/la-grande-storia.md)
export function sottoIlLivello(scheda, attesa) {
  // due livelli sotto quello atteso: i mostri laggiù sono più forti, e la roba non basta a dirlo
  if (scheda.livello != null && attesa.livello != null && scheda.livello < attesa.livello - 1)
    return { manca: 'livello', ha: scheda.livello, serve: attesa.livello }
  if (scheda.att < attesa.att) return { manca: 'arma', ha: scheda.att, serve: attesa.att }
  if (scheda.dif < attesa.dif) return { manca: 'difesa', ha: scheda.dif, serve: attesa.dif }
  return null
}

// «quella spada corta», «quello spadone», «quell'ascia», «quel bastone»: il nome della cosa in mezzo a una frase
export function quellaCosa(k) {
  const c = COSE[k]
  const n = c.nome.toLowerCase()
  if (c.genere === 'f') return /^[aeiou]/.test(n) ? `quell'${n}` : `quella ${n}`
  if (/^[aeiou]/.test(n)) return `quell'${n}`
  return /^(s[^aeiou]|z|gn|ps)/.test(n) ? `quello ${n}` : `quel ${n}`
}

// La frase del minatore a chi tocca una discesa con la roba sotto la riga d'entrata (dati/storia.js): dice cosa
// manca con le cose che si hanno in mano, e da chi andare. `scheda`: schedaConLaRoba (att, dif e le caselle)
export function dettoDelLivello(eroe, scheda, tappa, k) {
  const manca = sottoIlLivello(scheda, numeriAttesi(eroe, k))
  if (!manca) return null
  if (manca.manca === 'livello')
    return { manca: 'livello', detto: `${tappa.dove.charAt(0).toUpperCase() + tappa.dove.slice(1)} i mostri sono più forti di te: fatti le ossa nelle discese di prima.` }
  if (manca.manca === 'arma') {
    const con = scheda.mano ? `Con ${quellaCosa(scheda.mano)}` : 'A mani nude'
    return { manca: 'arma', detto: `${con} ${tappa.dove} non duri: passa dall'armaiolo.` }
  }
  const senza = !scheda.mancina && !(scheda.mano && COSE[scheda.mano].mani === 2) ? 'senza scudo'
    : !scheda.corpo ? 'senza niente addosso' : `con ${quellaCosa(scheda.corpo)}`
  const dove = tappa.dove.charAt(0).toUpperCase() + tappa.dove.slice(1)
  return { manca: 'difesa', detto: `${dove} picchiano forte, e ${senza} non reggi: passa dall'armaiolo.` }
}
