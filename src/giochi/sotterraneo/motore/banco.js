// Il banco di prova: un giocatore finto gioca una discesa intera senza schermo. Serve a misurare che una
// tappa si vinca (non solo che il codice non esploda) e quanto costa un piano in domande. Due modi:
// `minimo` (solo chiave e scala) e `tutto` (ogni cosa che vale) — la forbice fra i due è il gioco
// (docs/sotterraneo/regole.md). Il caso arriva da fuori (`rnd`), il seme è dichiarato: una discesa si deve
// poter rifare identica.
import { Corsa } from './corsa.js'
import { Bottega } from './bottega.js'
import { ROBA_VUOTA } from './corredo.js'
import { COSE } from '../dati/cose.js'
import { TASCHE } from '../dati/mondo.js'
import { CAMPAGNA } from '../dati/campagna.js'
import { seminato } from './livello.js'
import { robaAttesa } from './storia.js'
import { viaVerso, percorso } from '../../../motore/passi.js'

const DT = 1 / 30
const TETTO_PASSI = 3000        // ~100 secondi di cammino: molto più di un piano
const TETTO_GIRI = 12000        // azioni in una discesa, prima di dire che non finisce
/* quante volte si riprova lo stesso ostacolo: sei perché una porta a cui
   si sbaglia due volte di fila capita, e arrendersi lì vorrebbe dire
   dichiarare chiusa una strada che è aperta */
const TETTO_PROVE = 6
const SORSI_PROVATI = 3   // quante volte si torna alla stessa fonte dopo un'acqua torbida

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
  const sopra = ['scala', 'fonte'].includes(r.che)
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

// uno scudo al posto della seconda arma leggera: lo sceglie chi gioca, dallo zaino (vaAddosso non lo fa da sé)
function scudoMeglio(chi, k) {
  const c = COSE[k]
  return c.dove === 'mancina' && chi.posso(k) && !chi.aDueMani(chi.mano) && !!chi.mancina &&
    COSE[chi.mancina].dove === 'mano' && (c.dif || 0) * 2 > chi.attaccoMancino
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
    // con un'arma leggera nella mano debole, lo scudo che para più di quanto quell'arma picchi (la difesa conta doppio)
    if (c.dove === 'mancina' && scudoMeglio(corsa, k)) { corsa.usa(i); continue }
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
// scendere, per misurare l'abisso (che non ha un ultimo piano). `perPiano`: quante domande è costato ognuno.
// `roba`: quella che si porta giù da sopra (motore/corredo.js); torna in `corsa.roba` a discesa finita
export function gioca(tappa, { bravura = 0.8, seme = 7, come = 'minimo', rnd = null, da = null,
                              eroe = undefined, fino = null, tettoGiri = TETTO_GIRI, roba = null } = {}) {
  const sorte = rnd || seminato(seme * 31 + 17)
  const corsa = da || new Corsa(tappa, { seme, rnd: sorte, eroe, roba })
  if (da) da.rnd = sorte
  let giri = 0
  const persi = []
  const provati = new Map()
  const conto = { fonti: 0 }
  const sorsi = new Map()
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

    // mezzo morto e senza pozioni (equipaggia le beve prima): si va a una fonte in tutti e due i modi di
    // giocare, come chiave e scala. Era il mercante, che adesso sta sopra
    if (corsa.vita < corsa.vitaMax * 0.45) {
      const fonte = robeInteressanti(corsa, ['fonte']).find(r => (sorsi.get(r) || 0) < SORSI_PROVATI)
      if (fonte) {
        sorsi.set(fonte, (sorsi.get(fonte) || 0) + 1)
        conto.fonti++
        if (!raggiungi(corsa, fonte)) sorsi.set(fonte, SORSI_PROVATI)
        continue
      }
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
    fonti: conto.fonti,   // non sta nell'esito: è il modo in cui il giocatore finto gioca, non il gioco
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

// se il minimo cresce, scendere diventa un compito; se la forbice si stringe, non si sceglie più.
// `roba`: quella che ci si porta giù (robaPer), da quando le discese dopo la prima contano su di lei
export function costoDi(tappa, { seme = 7, bravura = 1, eroe = undefined, roba = null } = {}) {
  const minimo = gioca(tappa, { seme, bravura, come: 'minimo', eroe, roba })
  const tutto = gioca(tappa, { seme, bravura, come: 'tutto', eroe, roba })
  return {
    minimo: minimo.esito.domande,
    tutto: tutto.esito.domande,
    vinte: [minimo.esito.vinta, tutto.esito.vinta],
    guasti: [minimo.guasto, tutto.guasto].filter(Boolean),
  }
}

// una tappa che si vince sei volte su dieci non è difficile: è una lotteria
export function quanteVolteSiVince(tappa, { quante = 8, bravura = 0.8, eroe = undefined, roba = null } = {}) {
  let vinte = 0
  const guasti = []
  for (let i = 0; i < quante; i++) {
    const g = gioca(tappa, { seme: 100 + i * 37, bravura, come: 'minimo', eroe, roba })
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

// Il giocatore finto davanti ai mercanti di sopra: vende quello che ha in tasca e non mette, compra quello che
// migliora (arma, armatura, scudo; al dito se è libero) e con quello che resta riempie le tasche di pozioni.
// È il caso peggiore per l'equilibrio, chi scende con lo zaino pieno (docs/sotterraneo/regole.md)
export function allaBottega(roba, { finite = 0, eroe = undefined, seme = 1 } = {}) {
  const b = new Bottega({ eroe, roba, finite, rnd: seminato(seme * 53 + 11) })
  const vendiIlSuperfluo = () => {
    for (let i = b.zaino.length - 1; i >= 0; i--)
      if (COSE[b.zaino[i]].dove && !scudoMeglio(b, b.zaino[i])) b.vendiA('rigattiere', i)
  }
  // al dito si mette la prima cosa che capita, come fa equipaggia: i gioielli non si confrontano su un numero
  const meglio = k => b.quantoCosta(k) <= b.gemme && !b.possiedo(k) &&
    ((b.vaAddosso(k) && (COSE[k].dove === 'dito' || b.confronto(k).delta > 0)) || scudoMeglio(b, k))
  vendiIlSuperfluo()
  for (let giro = 0; giro < 8; giro++) {
    // un punto di difesa vale due di braccio (si para a ogni scambio, docs/sotterraneo/abisso.md); a pari, il più caro
    const vale = k => (COSE[k].dove === 'dito' ? 1 : scudoMeglio(b, k) && !b.vaAddosso(k)
      ? COSE[k].dif * 2 - b.attaccoMancino
      : b.confronto(k).delta * (b.confronto(k).campo === 'dif' ? 2 : 1))
    const scelte = ['armaiolo', 'rigattiere']
      .flatMap(chi => b.mercanzia(chi).filter(r => meglio(r.chiave)).map(r => ({ chi, k: r.chiave })))
      .sort((x, y) => vale(y.k) - vale(x.k) || b.quantoCosta(y.k) - b.quantoCosta(x.k))
    if (!scelte.length) break
    b.compraDa(scelte[0].chi, scelte[0].k)
    vendiIlSuperfluo()
  }
  const POZIONI = ['pozione-grande', 'pozione', 'pozione-piccola']
  while (b.zaino.length < TASCHE) {
    const k = POZIONI.find(p => COSE[p].prezzo <= b.gemme)
    const e = k && b.compraDa('erborista', k)
    if (!e || e.che !== 'comprato') break
  }
  return b.roba
}

// La campagna con la roba che resta. Per ogni seme si gioca la fila delle sei discese ad `allenata` (otto su
// dieci), rigiocando quella persa come farebbe un bambino e facendo la spesa fra una e l'altra; prima di ogni
// discesa se ne gioca una copia a ognuna delle `prove`, con lo zaino che ha in quel momento chi la fila la sta
// facendo bene. `fila`: 'tutto' è chi gira tutto e si porta giù più roba (il caso peggiore per l'equilibrio),
// 'minimo' chi va dritto alla scala. Torna, per bravura e per tappa, quante volte si arriva in fondo, e com'è
// lo zaino in media
export function misuraConLaRoba({ semi = 20, prove = [0.8, 0.6, 0.4], allenata = 0.8, eroe = undefined,
                                  tentativi = 4, spesa = true, fila = 'tutto' } = {}) {
  const vinte = prove.map(() => CAMPAGNA.map(() => 0))
  const zaini = CAMPAGNA.map(() => ({ gemme: 0, att: 0, dif: 0, pozioni: 0 }))
  for (let s = 0; s < semi; s++) {
    let roba = ROBA_VUOTA()
    for (let k = 0; k < CAMPAGNA.length; k++) {
      const t = CAMPAGNA[k]
      if (spesa) roba = allaBottega(roba, { finite: k, eroe, seme: s * 101 + k })
      const prima = new Bottega({ eroe, roba })
      zaini[k].gemme += roba.gemme / semi
      zaini[k].att += prima.att / semi
      zaini[k].dif += prima.dif / semi
      zaini[k].pozioni += roba.zaino.filter(x => COSE[x].usa === 'cura').length / semi
      prove.forEach((bravura, j) => {
        const g = gioca(t, { seme: 5000 + s * 97 + k * 13 + j * 7, bravura, roba, eroe })
        if (g.esito.vinta) vinte[j][k]++
      })
      for (let n = 0; n < tentativi; n++) {
        const g = gioca(t, { seme: 100 + s * 37 + k * 3 + n * 7919, bravura: allenata, roba, eroe, come: fila })
        roba = g.corsa.roba
        if (g.esito.vinta) break
        if (spesa) roba = allaBottega(roba, { finite: k, eroe, seme: s * 101 + k + n * 17 })
      }
    }
  }
  return { vinte, semi, zaini, prove }
}

// La tabella della storia sotto il banco (dati/storia.js, docs/sotterraneo/la-grande-storia.md): ogni discesa
// giocata con la roba della riga sua spostata di `scarto` (0 la roba attesa, −1 quella di una discesa prima, 2
// quella di due discese avanti), con le pozioni attese, a ognuna delle `prove`. Torna, per scarto, per bravura e
// per discesa, quante volte si arriva in fondo; e le gemme con cui si esce con la roba attesa (`gemme[k]`, la
// media), che sono quelle che il banco del passo dopo deve far tornare
export function misuraLaStoria({ eroe = 'cavaliere', semi = 20, prove = [0.8, 0.6, 0.4], scarti = [0, -1, 2],
                                 come = 'minimo', quali = null } = {}) {
  const discese = quali || CAMPAGNA.map((_, k) => k)
  const vinte = {}
  const gemme = {}
  for (const scarto of scarti) {
    vinte[scarto] = prove.map(() => ({}))
    for (const k of discese) {
      const riga = Math.max(0, Math.min(CAMPAGNA.length, k + scarto))
      prove.forEach((bravura, j) => {
        let n = 0
        for (let s = 0; s < semi; s++) {
          const g = gioca(CAMPAGNA[k], { seme: 7000 + s * 89 + k * 11 + j * 5, bravura, eroe, come,
                                        roba: robaAttesa(eroe, riga) })
          if (g.esito.vinta) n++
          if (scarto === 0 && j === 0) gemme[k] = (gemme[k] || 0) + g.esito.gemme / semi
        }
        vinte[scarto][j][k] = n
      })
    }
  }
  return { vinte, gemme, semi, prove, scarti, discese }
}

// La roba con cui si arriva alla discesa `indice` andando dritti alla scala e rispondendo bene otto volte su
// dieci, con la spesa fra una discesa e l'altra: la fila di misuraConLaRoba con un seme solo. È lo zaino con
// cui si misurano le discese dopo la prima (unita/sotterraneo), il più povero che un bambino abbia davvero
const fileGiocate = new Map()
export function robaPer(indice, { eroe = undefined, seme = 1, fila = 'minimo', tentativi = 4 } = {}) {
  const chiave = `${eroe}|${seme}|${fila}`
  let zaini = fileGiocate.get(chiave)
  if (!zaini) {
    zaini = []
    let roba = ROBA_VUOTA()
    for (let k = 0; k < CAMPAGNA.length; k++) {
      roba = allaBottega(roba, { finite: k, eroe, seme: seme * 101 + k })
      zaini.push(roba)
      for (let n = 0; n < tentativi; n++) {
        const g = gioca(CAMPAGNA[k], { seme: 100 + seme * 37 + k * 3 + n * 7919, bravura: 0.8, roba, eroe, come: fila })
        roba = g.corsa.roba
        if (g.esito.vinta) break
        roba = allaBottega(roba, { finite: k, eroe, seme: seme * 101 + k + n * 17 })
      }
    }
    zaini.push(allaBottega(roba, { finite: CAMPAGNA.length, eroe, seme: seme * 101 + CAMPAGNA.length }))
    fileGiocate.set(chiave, zaini)
  }
  return zaini[Math.max(0, Math.min(indice, zaini.length - 1))]
}
