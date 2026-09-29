// Il banco di prova: un giocatore finto gioca una discesa intera senza schermo. Serve a misurare che una
// tappa si vinca (non solo che il codice non esploda) e quanto costa un piano in domande. Due modi:
// `minimo` (solo chiave e scala) e `tutto` (ogni cosa che vale) — la forbice fra i due è il gioco
// (docs/sotterraneo/regole.md). Il caso arriva da fuori (`rnd`), il seme è dichiarato: una discesa si deve
// poter rifare identica.
import { Corsa } from './corsa.js'
import { COSE, CURE } from '../dati/cose.js'
import { TASCHE } from '../dati/mondo.js'
import { seminato } from './livello.js'
import { viaVerso, percorso } from '../../../motore/passi.js'

const DT = 1 / 30
const TETTO_PASSI = 3000        // ~100 secondi di cammino: molto più di un piano
const TETTO_GIRI = 12000        // azioni in una discesa, prima di dire che non finisce
/* quante volte si riprova lo stesso ostacolo: sei perché una porta a cui
   si sbaglia due volte di fila capita, e arrendersi lì vorrebbe dire
   dichiarare chiusa una strada che è aperta */
const TETTO_PROVE = 6
const COSTO_MINIMO = Math.min(...CURE.map(k => COSE[k].prezzo))   // la più economica: sotto, il giocatore finto non va dal mercante

// va su una cella, un passo alla volta, e si ferma appena qualcosa si apre. Torna true se ci è arrivato
function cammina(corsa, meta) {
  corsa.vaiVerso(meta, false)
  if (!corsa.strada && !corsa.foglio)
    return Math.floor(corsa.eroe.x) === meta.x && Math.floor(corsa.eroe.y) === meta.y
  for (let i = 0; i < TETTO_PASSI; i++) {
    corsa.passo(DT)
    if (corsa.foglio) return true
    if (!corsa.strada) return true
  }
  return false
}

// in due tempi: quello che non si vede non si tocca (un guardiano lontano non è illuminato, e la sua
// cella è bloccata, quindi non è una meta) — ci si avvicina, e da lì lo si tocca
function raggiungi(corsa, r) {
  const da = { x: Math.floor(corsa.eroe.x), y: Math.floor(corsa.eroe.y) }
  const sopra = ['scala', 'mercante', 'fonte'].includes(r.che)
  const via = viaVerso(corsa.buona(), r, da, { sopra })
  if (!via) return false
  if (!cammina(corsa, via.dove)) return false
  if (corsa.foglio) return true
  corsa.vaiVerso({ x: r.x, y: r.y }, true)
  for (let i = 0; i < TETTO_PASSI && !corsa.foglio && corsa.strada; i++) corsa.passo(DT)
  // "arrivato" non basta: conta che sia successo qualcosa, o ci si torna sopra all'infinito
  return !!corsa.foglio || !!r.presa
}

// un mostro che dorme o una porta chiusa sono muri finché non si paga: si sbriga solo chi sta davvero in
// mezzo (ricalcolando la strada a sotterraneo vuoto), non "il più vicino" che farebbe combattere mezzo
// piano per niente. `provati` conta i tentativi per oggetto, o si girerebbe intorno alla stessa serratura per sempre
function sblocca(corsa, meta, provati) {
  const da = { x: Math.floor(corsa.eroe.x), y: Math.floor(corsa.eroe.y) }
  const sgombro = percorso((x, y) => corsa.livello.calpestabile(x, y), da, meta)
  if (!sgombro) return false
  for (const c of sgombro) {
    const r = corsa.livello.robe.find(v => v.x === c.x && v.y === c.y && !v.morto && !v.presa &&
      (v.che === 'mostro' || (v.che === 'porta' && !v.aperta)))
    if (!r || (provati.get(r) || 0) >= TETTO_PROVE) continue
    const arrivato = raggiungi(corsa, r)
    // il tentativo si conta solo se non è successo niente, o tre scontri persi sullo stesso goblin farebbero saltare per sempre chi ci sta dietro
    if (!r.morto && !r.aperta) provati.set(r, (provati.get(r) || 0) + 1)
    if (arrivato) return true
  }
  return false
}

// senza questa funzione il banco gioca tutta la campagna a mani nude, misurando il costo di giocare male
function equipaggia(corsa) {
  const meglio = (k, addosso, campo) => {
    const mio = addosso ? (COSE[addosso][campo] || 0) : 0
    return (COSE[k][campo] || 0) > mio
  }
  for (let i = corsa.zaino.length - 1; i >= 0; i--) {
    const k = corsa.zaino[i]
    const c = COSE[k]
    // quello che questa classe non porta non si prova nemmeno, o il costo misurato è quello di un mago con un'ascia
    if (c.dove && !corsa.posso(k)) continue
    // un'arma si giudica sul totale delle due mani (postoDellArma), o due leggere entrambe migliori si scambierebbero all'infinito
    if (c.dove === 'mano') {
      const posto = corsa.postoDellArma(k)
      if (posto.delta > 0) { corsa.usa(i); continue }
    }
    if (c.dove === 'corpo' && meglio(k, corsa.corpo, 'dif')) { corsa.usa(i); continue }
    // stessa domanda del gioco (mancinaLibera): un'arma a due mani in pugno rifiuta lo scudo
    if (c.dove === 'mancina' && corsa.mancinaLibera()) { corsa.usa(i); continue }
    // al dito la prima cosa che capita: i gioielli non si confrontano su un numero solo
    if (c.dove === 'dito' && !corsa.dito) { corsa.usa(i); continue }
    if (c.usa === 'cura' && corsa.vita < corsa.vitaMax * 0.45) corsa.usa(i)   // beve quando serve, non appena trova
  }
}

// si prende solo quello che è a due passi: equivalente onesto della vecchia raccolta al passaggio, senza
// mandare il banco a fare il giro del piano (quello lo fa il modo `tutto`). `persi` evita di riprovare all'infinito
function raccogliVicino(corsa, persi) {
  const da = { x: Math.floor(corsa.eroe.x), y: Math.floor(corsa.eroe.y) }
  const vicina = corsa.livello.robe.find(r => r.che === 'cosa' && !r.presa &&
    !persi.includes(r) && Math.abs(r.x - da.x) + Math.abs(r.y - da.y) <= 2)
  if (!vicina) return false
  raggiungi(corsa, vicina)
  // presa o no, non ci si torna: un mostro che intercetta per strada aprirebbe uno scontro a ogni giro
  if (!vicina.presa) persi.push(vicina)
  return true
}

// il giocatore finto non gira a caso, va a colpo sicuro: si vuole misurare il costo, non la bravura a orientarsi
function robeInteressanti(corsa, quali) {
  const da = { x: Math.floor(corsa.eroe.x), y: Math.floor(corsa.eroe.y) }
  return corsa.livello.robe
    .filter(r => quali.includes(r.che) && !r.morto && !r.presa &&
                 !(r.che === 'porta' && r.aperta) && !(r.che === 'forziere' && r.aperto))
    .map(r => ({ r, d: Math.abs(r.x - da.x) + Math.abs(r.y - da.y) }))
    .sort((a, b) => a.d - b.d)
    .map(v => v.r)
}

// `bravura`: 1 è un adulto attento, 0.75 un bambino normale. `conto` è il taccuino della discesa
function sbriga(corsa, bravura, sorte, conto) {
  const f = corsa.foglio
  if (!f) return false
  switch (f.che) {
    case 'scontro':
    case 'porta':
    case 'forziere':
    case 'fonte':
      corsa.rispondi(sorte() < bravura)
      return true
    // una curiosità apre due volte: prima la domanda, poi la battuta che resta finché non la si legge
    case 'curiosita':
      if (f.esito) { corsa.chiudi(); return false }
      corsa.rispondi(sorte() < bravura)
      return true
    case 'svenuto':
      corsa.riprendi()
      return false
    // sul banco c'è sempre qualcosa che cura: passare oltre misurerebbe un gioco che nessuno gioca. Si
    // prende la più piccola che basta (berne una grossa a mezza vita butta via metà dell'effetto)
    case 'mercante': {
      let comprate = 0
      while (corsa.vita < corsa.vitaMax * 0.6) {
        const manca = corsa.vitaMax - corsa.vita
        const posso = CURE.filter(k => COSE[k].prezzo <= corsa.gemme)
          .sort((a, b) => COSE[a].cura - COSE[b].cura)
        const quale = posso.find(k => COSE[k].cura >= manca) || posso[posso.length - 1]
        if (!quale) break
        const preso = corsa.compra(quale)
        if (!preso || preso.che !== 'comprato') break
        const i = corsa.zaino.lastIndexOf(quale)
        if (i < 0) break
        corsa.usa(i)
        comprate++
      }
      conto.cure += comprate
      corsa.chiudi()
      return false
    }
    case 'chiusa':
      corsa.chiudi()
      return false
    case 'scala':
      corsa.scendi()
      return false
    default:
      corsa.chiudi()
      return false
  }
}

// `come`: 'minimo' (chiave e scala) o 'tutto' (ogni cosa che vale). `da`: una discesa già cominciata (per
// provare che una partita ripresa a metà si finisce davvero). `fino`: il piano oltre cui si smette di
// scendere, per misurare l'abisso (che non ha un ultimo piano). `perPiano`: quante domande è costato ognuno
export function gioca(tappa, { bravura = 0.8, seme = 7, come = 'minimo', rnd = null, da = null,
                              eroe = undefined, fino = null, tettoGiri = TETTO_GIRI } = {}) {
  const sorte = rnd || seminato(seme * 31 + 17)
  const corsa = da || new Corsa(tappa, { seme, rnd: sorte, eroe })
  if (da) da.rnd = sorte
  let giri = 0
  const persi = []
  const provati = new Map()
  const conto = { cure: 0 }
  const banchiVisti = new Set()
  const perPiano = []
  let pianoOra = corsa.piano, domandeAllInizio = corsa.domande
  const chiudiIlPiano = () => {
    perPiano[pianoOra] = (perPiano[pianoOra] || 0) + (corsa.domande - domandeAllInizio)
    pianoOra = corsa.piano
    domandeAllInizio = corsa.domande
  }

  while (!corsa.finita && giri++ < tettoGiri) {
    if (corsa.piano !== pianoOra) chiudiIlPiano()
    if (fino != null && corsa.piano >= fino) break
    if (corsa.foglio) { sbriga(corsa, bravura, sorte, conto); continue }   // finché un foglio è aperto non si cammina
    equipaggia(corsa)
    if (raccogliVicino(corsa, persi)) continue

    // mezzo morto e con le gemme: si va dal mercante in tutti e due i modi di giocare, come chiave e scala
    if (corsa.vita < corsa.vitaMax * 0.45 && corsa.gemme >= COSTO_MINIMO) {
      const banco = corsa.livello.robe.find(r => r.che === 'mercante' && !banchiVisti.has(r))
      if (banco) { banchiVisti.add(banco); raggiungi(corsa, banco); continue }
    }

    if (come === 'tutto') {
      const roba = robeInteressanti(corsa, ['porta', 'forziere', 'fonte', 'mostro', 'cosa'])
        .filter(r => !persi.includes(r))
      if (roba.length) {
        const meta = roba[0]
        if (!raggiungi(corsa, meta) && !sblocca(corsa, { x: meta.x, y: meta.y }, provati))
          persi.push(meta)
        continue
      }
    }

    if (!corsa.chiaveDelPiano) {
      const chi = corsa.livello.robe.find(r => r.che === 'mostro' && r.chiave && !r.morto)
      if (!chi) return { corsa, esito: corsa.esito, guasto: 'nessuno porta la chiave' }
      if (!raggiungi(corsa, chi) && !sblocca(corsa, { x: chi.x, y: chi.y }, provati))
        return { corsa, esito: corsa.esito, guasto: 'al guardiano non si arriva' }
      continue
    }

    const scala = corsa.livello.robe.find(r => r.che === 'scala')
    if (!raggiungi(corsa, scala) && !sblocca(corsa, { x: scala.x, y: scala.y }, provati))
      return { corsa, esito: corsa.esito, guasto: 'alla scala non si arriva' }
  }

  chiudiIlPiano()
  return {
    corsa,
    esito: corsa.esito,
    cure: conto.cure,   // non sta nell'esito: è il modo in cui il giocatore finto gioca, non il gioco
    perPiano,
    guasto: corsa.finita || (fino != null && corsa.piano >= fino)
      ? null : 'la discesa non finisce mai',
  }
}

// il metro dell'abisso: costoDeiPiani conta le domande piano per piano (se cresce, la discesa diventa lunga
// invece che difficile); finoADove dice dove si ferma un giocatore finto, cioè dove il bottino non regge più
export function costoDeiPiani(tappa, { fino = 12, seme = 7, bravura = 0.8,
                                       eroe = undefined } = {}) {
  const giri = 400 + fino * 900
  const minimo = gioca(tappa, { seme, bravura, come: 'minimo', fino, tettoGiri: giri, eroe })
  const tutto = gioca(tappa, { seme, bravura, come: 'tutto', fino, tettoGiri: giri, eroe })
  return {
    minimo: minimo.perPiano, tutto: tutto.perPiano,
    arrivato: [minimo.corsa.piano, tutto.corsa.piano],   // chi sviene troppe volte si ferma prima
    svenimenti: [minimo.esito.svenimenti, tutto.esito.svenimenti],
  }
}

export function finoADove(tappa, { bravura = 0.8, semi = [7, 41, 99, 203],
                                   tetto = 40, eroe = undefined } = {}) {
  const fondi = []
  for (const seme of semi) {
    const g = gioca(tappa, { seme, bravura, come: 'minimo', fino: tetto,
                             tettoGiri: 400 + tetto * 900, eroe })
    fondi.push(g.corsa.piano + 1)
  }
  return { fondi, peggio: Math.min(...fondi), meglio: Math.max(...fondi),
           medio: fondi.reduce((a, b) => a + b, 0) / fondi.length }
}

// se il minimo cresce, scendere diventa un compito; se la forbice si stringe, non si sceglie più
export function costoDi(tappa, { seme = 7, bravura = 1, eroe = undefined } = {}) {
  const minimo = gioca(tappa, { seme, bravura, come: 'minimo', eroe })
  const tutto = gioca(tappa, { seme, bravura, come: 'tutto', eroe })
  return {
    minimo: minimo.esito.domande,
    tutto: tutto.esito.domande,
    vinte: [minimo.esito.vinta, tutto.esito.vinta],
    guasti: [minimo.guasto, tutto.guasto].filter(Boolean),
  }
}

// una tappa che si vince sei volte su dieci non è difficile: è una lotteria
export function quanteVolteSiVince(tappa, { quante = 8, bravura = 0.8, eroe = undefined } = {}) {
  let vinte = 0
  const guasti = []
  for (let i = 0; i < quante; i++) {
    const g = gioca(tappa, { seme: 100 + i * 37, bravura, come: 'minimo', eroe })
    if (g.esito.vinta) vinte++
    if (g.guasto) guasti.push(`seme ${100 + i * 37}: ${g.guasto}`)
  }
  return { vinte, quante, guasti }
}

// tiene onesta la generazione quando si cambiano le misure di una tappa
export function pianiSani(tappa, quanti = 60) {
  const storti = []
  for (let i = 0; i < quanti; i++) {
    const c = new Corsa(tappa, { seme: 1 + i * 613, rnd: seminato(i + 1) })
    for (let p = 0; p < tappa.piani; p++) {
      const g = c.livello.guasti()
      if (g.length) storti.push(`seme ${1 + i * 613} piano ${p}: ${g.join(', ')}`)
      if (p < tappa.piani - 1) { c.piano++; c.nuovoPiano() }
    }
  }
  return storti
}

