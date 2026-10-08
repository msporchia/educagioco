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
import { robaAttesa, crescitaAttesa, livelloAtteso } from './storia.js'
import { puntiDaDare, CRESCITA_NUOVA, crescitaA, prossimoPunto } from './crescita.js'
import { eroeDi } from '../dati/eroi.js'
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

// i punti da dare, come li dà il banco (motore/crescita.js, COME_LI_DA): `come` per provare un altro modo
function daiIPunti(corsa, come) {
  while (puntiDaDare(corsa.crescita) > 0) corsa.daiUnPunto(prossimoPunto(corsa.crescita, corsa.chiEro, come))
}

// senza questa funzione il banco gioca tutta la campagna a mani nude, misurando il costo di giocare male
function equipaggia(corsa) {
  for (let i = corsa.zaino.length - 1; i >= 0; i--) {
    const k = corsa.zaino[i]
    const c = COSE[k]
    // quello che questa classe non porta non si prova nemmeno, o il costo misurato è quello di un mago con un'ascia
    if (c.dove && !corsa.posso(k)) continue
    // un pezzo si giudica su tutto quello che dà (confronto: `meglio`), un'arma sul totale delle due mani
    if (c.dove && c.dove !== 'dito' && !(c.dove === 'mancina' && corsa.aDueMani(corsa.mano))) {
      const conf = corsa.confronto(k)
      if (!conf.addosso ? (c.dove !== 'mancina' || corsa.mancinaLibera()) : conf.meglio > 0) { corsa.usa(i); continue }
    }
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
                              eroe = undefined, fino = null, tettoGiri = TETTO_GIRI, roba = null,
                              crescita = null, punti = null } = {}) {
  const sorte = rnd || seminato(seme * 31 + 17)
  const corsa = da || new Corsa(tappa, { seme, rnd: sorte, eroe, roba, crescita })
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
    daiIPunti(corsa, punti)
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
                                       eroe = undefined, roba = null, crescita = null } = {}) {
  const giri = 400 + fino * 900
  const minimo = gioca(tappa, { seme, bravura, come: 'minimo', fino, tettoGiri: giri, eroe, roba, crescita })
  const tutto = gioca(tappa, { seme, bravura, come: 'tutto', fino, tettoGiri: giri, eroe, roba, crescita })
  return {
    minimo: minimo.perPiano, tutto: tutto.perPiano,
    arrivato: [minimo.corsa.piano, tutto.corsa.piano],   // chi sviene troppe volte si ferma prima
    svenimenti: [minimo.esito.svenimenti, tutto.esito.svenimenti],
  }
}

export function finoADove(tappa, { bravura = 0.8, semi = [7, 41, 99, 203],
                                   tetto = 40, eroe = undefined, roba = null, crescita = null } = {}) {
  const fondi = []
  for (const seme of semi) {
    const g = gioca(tappa, { seme, bravura, come: 'minimo', fino: tetto,
                             tettoGiri: 400 + tetto * 900, eroe, roba, crescita })
    fondi.push(g.corsa.piano + 1)
  }
  return { fondi, peggio: Math.min(...fondi), meglio: Math.max(...fondi),
           medio: fondi.reduce((a, b) => a + b, 0) / fondi.length }
}

// se il minimo cresce, scendere diventa un compito; se la forbice si stringe, non si sceglie più.
// `roba`: quella che ci si porta giù (robaPer), da quando le discese dopo la prima contano su di lei
export function costoDi(tappa, { seme = 7, bravura = 1, eroe = undefined, roba = null, crescita = null } = {}) {
  const minimo = gioca(tappa, { seme, bravura, come: 'minimo', eroe, roba, crescita })
  const tutto = gioca(tappa, { seme, bravura, come: 'tutto', eroe, roba, crescita })
  return {
    minimo: minimo.esito.domande,
    tutto: tutto.esito.domande,
    vinte: [minimo.esito.vinta, tutto.esito.vinta],
    guasti: [minimo.guasto, tutto.guasto].filter(Boolean),
  }
}

// una tappa che si vince sei volte su dieci non è difficile: è una lotteria
export function quanteVolteSiVince(tappa, { quante = 8, bravura = 0.8, eroe = undefined, roba = null, crescita = null } = {}) {
  let vinte = 0
  const guasti = []
  for (let i = 0; i < quante; i++) {
    const g = gioca(tappa, { seme: 100 + i * 37, bravura, come: 'minimo', eroe, roba, crescita })
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
export function allaBottega(roba, { finite = 0, eroe = undefined, seme = 1, crescita = null } = {}) {
  const b = new Bottega({ eroe, roba, finite, crescita, rnd: seminato(seme * 53 + 11) })
  const vendiIlSuperfluo = () => {
    for (let i = b.zaino.length - 1; i >= 0; i--)
      if (COSE[b.zaino[i]].dove && !scudoMeglio(b, b.zaino[i])) b.vendiA('rigattiere', i)
  }
  // al dito si mette la prima cosa che capita, come fa equipaggia: i gioielli non si confrontano su un numero
  const meglio = k => b.quantoCosta(k) <= b.gemme && !b.possiedo(k) &&
    ((COSE[k].dove === 'dito' ? !b.dito : b.vaAddosso(k)) || scudoMeglio(b, k))
  vendiIlSuperfluo()
  for (let giro = 0; giro < 8; giro++) {
    // quanto migliora tutto (confronto: `meglio`, la difesa pesa il doppio); a pari, il più caro
    const vale = k => (COSE[k].dove === 'dito' ? 1 : scudoMeglio(b, k) && !b.vaAddosso(k)
      ? (COSE[k].dif || 0) * 2 - b.attaccoMancino
      : b.confronto(k).meglio)
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
                                  tentativi = 4, spesa = true, fila = 'tutto', fino = CAMPAGNA.length, solo = null } = {}) {
  const vinte = prove.map(() => CAMPAGNA.map(() => 0))
  const zaini = CAMPAGNA.map(() => ({ gemme: 0, att: 0, dif: 0, pozioni: 0, livello: 0 }))
  for (let s = 0; s < semi; s++) {
    let roba = ROBA_VUOTA()
    let crescita = CRESCITA_NUOVA()
    for (let k = 0; k < fino; k++) {
      const t = CAMPAGNA[k]
      if (spesa) roba = allaBottega(roba, { finite: k, eroe, seme: s * 101 + k, crescita })
      const prima = new Bottega({ eroe, roba, crescita })
      zaini[k].gemme += roba.gemme / semi
      zaini[k].att += prima.att / semi
      zaini[k].dif += prima.dif / semi
      zaini[k].livello += prima.livelloEroe / semi
      zaini[k].pozioni += roba.zaino.filter(x => COSE[x].usa === 'cura').length / semi
      if (solo == null || solo === k) prove.forEach((bravura, j) => {
        const g = gioca(t, { seme: 5000 + s * 97 + k * 13 + j * 7, bravura, roba, eroe, crescita })
        if (g.esito.vinta) vinte[j][k]++
      })
      for (let n = 0; n < tentativi; n++) {
        const g = gioca(t, { seme: 100 + s * 37 + k * 3 + n * 7919, bravura: allenata, roba, eroe, come: fila, crescita })
        roba = g.corsa.roba
        crescita = g.corsa.crescita
        if (g.esito.vinta) break
        if (spesa) roba = allaBottega(roba, { finite: k, eroe, seme: s * 101 + k + n * 17, crescita })
      }
    }
  }
  return { vinte, semi, zaini, prove }
}

// La tabella della storia sotto il banco (dati/storia.js, docs/sotterraneo/la-grande-storia.md): ogni discesa
// giocata con la roba della riga sua spostata di `scarto` (0 la roba attesa, −1 quella di una discesa prima, 2
// quella di due discese avanti) e il livello atteso, con le pozioni attese, a ognuna delle `prove`. `livelli`:
// gli scarti di livello da provare con la roba attesa (la chiave è 'L−2', 'L+3'…). Torna, per scarto, per
// bravura e per discesa, quante volte si arriva in fondo; e le gemme con cui si esce con la roba attesa
// (`gemme[k]`, la media), che sono quelle che il banco del passo dopo deve far tornare
export function misuraLaStoria({ eroe = 'cavaliere', semi = 20, prove = [0.8, 0.6, 0.4], scarti = [0, -1, 2],
                                 livelli = [], come = 'minimo', quali = null, punti = null } = {}) {
  const discese = quali || CAMPAGNA.map((_, k) => k)
  const vinte = {}
  const gemme = {}
  const prove2 = [...scarti.map(s => ({ chiave: s, scarto: s, piu: 0 })),
                  ...livelli.map(l => ({ chiave: `L${l > 0 ? '+' : ''}${l}`, scarto: 0, piu: l }))]
  for (const { chiave, scarto, piu } of prove2) {
    vinte[chiave] = prove.map(() => ({}))
    for (const k of discese) {
      const riga = Math.max(0, Math.min(CAMPAGNA.length, k + scarto))
      const crescita = piu ? crescitaA(eroeDi(eroe), Math.max(1, livelloAtteso(k) + piu), punti) : crescitaAttesa(eroe, k, punti)
      prove.forEach((bravura, j) => {
        let n = 0
        for (let s = 0; s < semi; s++) {
          const g = gioca(CAMPAGNA[k], { seme: 7000 + s * 89 + k * 11 + j * 5, bravura, eroe, come, punti,
                                        roba: robaAttesa(eroe, riga), crescita })
          if (g.esito.vinta) n++
          if (chiave === 0 && j === 0) gemme[k] = (gemme[k] || 0) + g.esito.gemme / semi
        }
        vinte[chiave][j][k] = n
      })
    }
  }
  return { vinte, gemme, semi, prove, scarti, livelli, discese }
}

// Chi ha messo da parte le gemme: arriva a ogni discesa con la roba attesa e `gemme` in tasca, compra il meglio che
// può (anche i pezzi delle righe dopo, a prezzo più alto) e scende. Torna, per bravura e per discesa, quante volte
// su `semi` si arriva in fondo: il sovrapprezzo deve tenere questi numeri vicini a quelli di chi non compra avanti
// (docs/sotterraneo/bottega.md, «I mercanti di sopra»)
export function misuraDiChiHaMessoDaParte({ eroe = 'cavaliere', semi = 20, gemme = 100, prove = [0.8, 0.6, 0.4] } = {}) {
  const vinte = prove.map(() => CAMPAGNA.map(() => 0))
  for (let k = 0; k < CAMPAGNA.length; k++)
    for (let s = 0; s < semi; s++) {
      const crescita = crescitaAttesa(eroe, k)
      const roba = allaBottega(robaAttesa(eroe, k, { gemme }), { finite: k, eroe, seme: s * 101 + k, crescita })
      prove.forEach((bravura, j) => {
        if (gioca(CAMPAGNA[k], { seme: 7000 + s * 89 + k * 11 + j * 5, bravura, eroe, roba, crescita }).esito.vinta) vinte[j][k]++
      })
    }
  return { vinte, semi, prove }
}

// La roba con cui si arriva alla discesa `indice` andando dritti alla scala e rispondendo bene otto volte su
// dieci, con la spesa fra una discesa e l'altra: la fila di misuraConLaRoba con un seme solo. È lo zaino con
// cui si misurano le discese dopo la prima (unita/sotterraneo), il più povero che un bambino abbia davvero
const fileGiocate = new Map()
// `crescitaPer` (sotto) dice con che crescita ci si arriva: la stessa fila
export function robaPer(indice, opz = {}) { return filaGiocata(opz)[Math.max(0, Math.min(indice, CAMPAGNA.length))].roba }
export function crescitaPer(indice, opz = {}) { return filaGiocata(opz)[Math.max(0, Math.min(indice, CAMPAGNA.length))].crescita }

function filaGiocata({ eroe = undefined, seme = 1, fila = 'minimo', tentativi = 4 } = {}) {
  const chiave = `${eroe}|${seme}|${fila}|${tentativi}`
  let zaini = fileGiocate.get(chiave)
  if (!zaini) {
    zaini = []
    let roba = ROBA_VUOTA()
    let crescita = CRESCITA_NUOVA()
    for (let k = 0; k < CAMPAGNA.length; k++) {
      roba = allaBottega(roba, { finite: k, eroe, seme: seme * 101 + k, crescita })
      zaini.push({ roba, crescita })
      for (let n = 0; n < tentativi; n++) {
        const g = gioca(CAMPAGNA[k], { seme: 100 + seme * 37 + k * 3 + n * 7919, bravura: 0.8, roba, eroe, come: fila, crescita })
        roba = g.corsa.roba
        crescita = g.corsa.crescita
        if (g.esito.vinta) break
        roba = allaBottega(roba, { finite: k, eroe, seme: seme * 101 + k + n * 17, crescita })
      }
    }
    zaini.push({ roba: allaBottega(roba, { finite: CAMPAGNA.length, eroe, seme: seme * 101 + CAMPAGNA.length, crescita }), crescita })
    fileGiocate.set(chiave, zaini)
  }
  return zaini
}
