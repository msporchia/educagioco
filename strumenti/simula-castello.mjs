// Il castello giocato a mente: fa girare `motore/battaglia.js` (le regole
// vere) con un giocatore finto, senza disegnare — una tappa costa qualche
// decimo di secondo. Risponde a due domande: quanta energia serve per
// arrivare in fondo (`quota`) e quanti acquisti fa davvero chi gioca bene
// (deve tornare uguale a `calcoli`). Vedi docs/castello/taratura.md.
//   node strumenti/simula-castello.mjs                  # tutte e venti
//   node strumenti/simula-castello.mjs 6                # solo la sesta
//   node strumenti/simula-castello.mjs libera-mura      # una partita libera
//   node strumenti/simula-castello.mjs --quote 1,.9,.8  # con che tetti
import { TAPPE, LIBERE, liberaDi, CFG, MONDO, costoNuovaTorre,
         sequenzaTorri, prossimoAcquisto } from '../src/data/castello.js'
import { creaBattaglia } from '../src/motore/battaglia.js'
import { TORRI } from '../src/data/ops.js'
import { immuniDellOnda } from '../src/data/mostri.js'

// Il campo su cui si tara è uno solo (`MONDO`): la formula della scala è
// quella di `grafica/tela.js`, se cambia lì cambia qui.
export const TELEFONO = { ...MONDO }
export function misureDi(W, H, unita = 420) {
  return { W, H, S: Math.max(0.62, Math.min(1.5, Math.min(W, H) / unita)) }
}

// Numeri a caso ma sempre gli stessi: una partita simulata si deve poter
// rigiocare identica.
export function seme(n) {
  let s = n >>> 0
  return () => {
    s = (s + 0x6D2B79F5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const PASSO = 1 / 60          // lo stesso passo di un telefono che va liscio
const LIMITE = 3600           // un'ora di gioco simulato: oltre, è uno stallo

// I regali che il finto giocatore prende, a giro (veleno resta fuori:
// vale solo per chi sceglie il ramo che avvelena, e lui non sceglie rami).
const GIRO_REGALI = ['frecce', 'incanto', 'polvere', 'gelo']

// Il giocatore finto: un bambino diligente, non un ottimizzatore. Compra
// con `prossimoAcquisto` (la stessa funzione del piano dei calcoli), e ogni
// acquisto gli costa il tempo di un'operazione in colonna. I parametri
// distinguono un bambino dall'altro: vedi docs/castello/taratura.md.
export const PROFILI = {
  // il metro su cui si tarano le tappe: spende tutto, non sbaglia, non corre
  misura:      { quota: 1.00, strategia: 'potenzia', tOp: 10, sbaglia: 0, svelto: false,
                 traOndate: true },
  parco:       { quota: 0.90, strategia: 'potenzia', tOp: 10, sbaglia: 0, svelto: false,
                 traOndate: true },
  pigro:       { quota: 0.75, strategia: 'potenzia', tOp: 10, sbaglia: 0, svelto: false,
                 traOndate: true },
  pieno:       { quota: 1.00, strategia: 'potenzia', tOp: 10, sbaglia: 0, svelto: true },
  // il bambino vero: sbaglia un conto su quattro, ci mette il suo tempo, deve passare lo stesso
  pasticcione: { quota: 1.00, strategia: 'potenzia', tOp: 22, sbaglia: 0.25, svelto: false },
  // solo torri di livello 1: deve arrivare meno lontano degli altri
  largo:       { quota: 1.00, strategia: 'costruisci', tOp: 10, sbaglia: 0,  svelto: true },
  previdente:  { quota: 1.00, strategia: 'potenzia', tOp: 10, sbaglia: 0, svelto: false,
                 traOndate: true, immunita: true },
  impaziente:  { quota: 1.00, strategia: 'potenzia', tOp: 10, sbaglia: 0, svelto: true,
                 impaziente: true },
}

export function gioca(tappa, opzioni = {}) {
  const { quota = 1, strategia = 'potenzia', tOp = 10, sbaglia = 0, svelto = true,
          impaziente = false,
          traOndate = false, immunita = false, misure = TELEFONO, s = 7, finoA = tappa.ondate,
          da = null, istantanee = null, regali = null, sceglie = null } = opzioni
  const caso = seme(s)
  const stato = { cuori: 0, onda: 0, uccisi: 0, torri: 0, energia: 0 }
  const motore = creaBattaglia({ tappa, misure, stato, regali })
  motore.inizia()

  let speso = 0                 // quanto ha messo in torri, penali comprese
  let presi = 0                 // quanti regali ha scelto durante la partita
  let occupato = 0              // secondi che ancora mancano all'operazione in corso
  let inCorso = null            // cosa sta comprando mentre calcola
  let t = 0
  const storia = []
  let cuoriPrima = stato.cuori
  // si può ripartire da un'ondata di mezzo (per il taratore, che riprova la
  // stessa ondata cento volte): l'istantanea porta con sé anche lo speso
  if (da) { motore.riprendi(da); speso = da.speso || 0 }
  let ondaVista = stato.onda     // per accorgersi che ne è partita una nuova
  let foto = null                // com'era il campo prima che partisse

  const disponibile = () => (stato.energia + speso) * quota - speso

  const sequenza = sequenzaTorri(tappa, Math.max(32, tappa.posti || 0))

  // a quali torri è immune l'ondata in arrivo (non quella in corso: si
  // compra a campo pulito, fra un'ondata e l'altra)
  function immuniInArrivo() {
    if (!immunita) return []
    const inArrivo = motore.prossime(1)[0]
    return immuniDellOnda(inArrivo)
  }

  // Cosa comprerebbe adesso: si sale sempre la torre più bassa (inseguire
  // l'ondata col potenziamento è una mossa peggiore, misurato).
  function mossa() {
    const torri = motore.torri.map(x => ({ tipo: x.tipo, lv: x.lv,
      via: motore.postazioni.find(p => p.x === x.x && p.y === x.y)?.via }))
    const m = prossimoAcquisto(torri, tappa, { posti: tappa.posti, sequenza, onda: stato.onda,
                                              largo: strategia === 'costruisci' })
    if (!m) return null
    if (m.che === 'salita') return { ...m, torre: motore.torri[m.indice] }
    // chi legge tutto il preavviso scarta la torre a cui l'ondata è immune
    const immuni = immuniInArrivo()
    if (immuni.includes(m.tipo)) {
      const altra = tappa.torri.find(k => TORRI[k].danno && !immuni.includes(k))
      if (altra) return { ...m, tipo: altra, costo: costoNuovaTorre(torri.length, altra) }
    }
    return m
  }


  while (t < LIMITE) {
    /* ── il regalo ──
       Nella partita libera ogni cinque ondate ce n'è uno da scegliere, e
       finché non è scelto l'ondata dopo non parte: è la regola vera, e un
       simulatore che la ignorasse aspetterebbe per sempre. Il finto
       giocatore prende quello che gli dice `sceglie` — a giro fra le
       quattro voci che toccano una torre, se non gli si dice altro. */
    if (motore.regaliDaScegliere > 0) {
      motore.prendiRegalo((sceglie || (n => GIRO_REGALI[n % GIRO_REGALI.length]))(presi))
      presi++
    }
    // sta calcolando: il campo va avanti, lui no
    if (occupato > 0) {
      occupato -= PASSO
      if (occupato <= 0 && inCorso) {
        const penale = caso() < sbaglia ? CFG.malusErrore : 0
        const conto = { prezzo: inCorso.costo, penale }
        speso += inCorso.costo + penale
        if (inCorso.che === 'nuova') {
          /* sulla strada che la fila gli dice: la prima piazzola libera di
             quella strada, e se non ce n'è la prima libera e basta */
          const posto = motore.liberi().find(i => (motore.postazioni[i].via || 0) === inCorso.strada)
          motore.costruisci(inCorso.tipo, { ...conto, posto: posto ?? null })
        }
        else motore.potenzia(inCorso.torre, conto)
        inCorso = null
      }
    } else {
      // chi compra solo fra un'ondata e l'altra aspetta che il campo sia
      // pulito: è come si gioca quando i conti si fanno con calma
      const fermo = !motore.nemici.length && !motore.inArrivo
      const m = traOndate && !fermo ? null : mossa()
      if (m && stato.energia >= m.costo && m.costo <= disponibile()) {
        inCorso = m; occupato = tOp
      } else if (motore.inAttesa()) {
        // il campo è pulito e non c'è più niente da comprare: è il momento
        // in cui si fotografa la partita, ed è anche dove ci si ferma se
        // si voleva arrivare solo fin qui
        foto = { ...motore.istantanea(), speso }
        istantanee?.set(stato.onda + 1, foto)
        if (stato.onda >= finoA) return rendiconto('arrivato')
        // chi ha fretta la chiama e si prende il bonus; l'altro non fa
        // niente e aspetta che parta da sola — a mandarla è il motore,
        // non lui, ed è per questo che l'ondata nuova si riconosce dal
        // contatore che cambia e non da chi ha premuto il tasto
        if (svelto) motore.chiamaOnda()
      } else if (impaziente && motore.puoiChiamare()) {
        // l'ondata di prima è ancora in campo, ma è uscita tutta: si
        // manda la prossima e si prende il premio più grosso
        motore.chiamaOnda()
      }
    }

    const esito = motore.avanza(PASSO, occupato > 0)
    t += PASSO
    if (stato.onda > ondaVista) {
      ondaVista = stato.onda
      const f = foto || { ...motore.istantanea(), speso }
      storia.push({ onda: stato.onda, cuori: f.stato.cuori, energia: Math.round(f.stato.energia),
                    livelli: f.torri.map(x => x.lv), speso: Math.round(f.speso), avanzata: 0 })
      cuoriPrima = stato.cuori
    }
    // quanto vicino al castello è arrivato il più avanti di loro: la misura
    // su cui si tarano le ondate (i cuori dicono solo sì o no)
    if (storia.length) {
      const corsa = storia[storia.length - 1]
      // sulla sua strada, non sulla prima: con due bocche le strade hanno
      // lunghezze diverse
      for (const n of motore.nemici)
        corsa.avanzata = Math.max(corsa.avanzata, n.d / motore.viaDi(n).lunghezza)
      if (stato.cuori < cuoriPrima) {
        corsa.persi = (corsa.persi || 0) + cuoriPrima - stato.cuori
        corsa.avanzata = 1
        cuoriPrima = stato.cuori
      }
    }
    if (esito) return rendiconto(esito)
  }
  return rendiconto('stallo')

  function rendiconto(esito) {
    const guadagnato = stato.energia + speso
    return {
      esito, onda: stato.onda, cuori: stato.cuori, uccisi: stato.uccisi, regali: presi,
      livelli: motore.torri.map(x => x.lv), speso: Math.round(speso),
      guadagnato: Math.round(guadagnato), avanzo: Math.round(stato.energia),
      inTasca: guadagnato ? stato.energia / guadagnato : 0,
      secondi: Math.round(t), storia,
    }
  }
}

// Abbassa il tetto di spesa finché la tappa non si perde più: la larghezza
// di manica (1 = serve tutto, 0.6 = ne bastano sei decimi).
export function quotaMinima(tappa, opzioni = {}, passo = 0.05) {
  for (let q = 0.4; q <= 1.001; q += passo) {
    const r = gioca(tappa, { ...opzioni, quota: Math.round(q * 100) / 100 })
    if (r.esito === 'vinta') return { quota: Math.round(q * 100) / 100, esito: r }
  }
  return { quota: null, esito: gioca(tappa, { ...opzioni, quota: 1 }) }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2)
  const quali = argv.filter(a => /^\d+$/.test(a)).map(Number)
  const iQuote = argv.indexOf('--quote')
  const quote = iQuote >= 0 ? argv[iQuote + 1].split(',').map(Number) : null
  // una libera si chiede per chiave, e si gioca come la tara: 20 ondate senza regali
  const libere = argv.filter(a => liberaDi(a)).map(a => {
    const l = liberaDi(a)
    return [TAPPE.length + LIBERE.indexOf(l), { ...l, ondate: 20, regali: false }]
  })
  const tappe = quali.length || libere.length
    ? [...quali.map(n => [n - 1, TAPPE[n - 1]]), ...libere] : [...TAPPE.entries()]

  for (const [i, t] of tappe) {
    console.log(`\n${i + 1}. ${t.nome} — ${t.calcoli ? `${t.calcoli} calcoli promessi` : 'partita libera'}` +
                ` · ${t.ondate} ondate · ` +
                `${t.posti} posti · cap ${t.cap} · durezza ${t.durezza} · torri ${t.torri.join(' ')}`)
    if (quote) {
      for (const q of quote) {
        const r = gioca(t, { ...PROFILI.pieno, quota: q })
        console.log(`   quota ${(q * 100).toFixed(0).padStart(3)}% → ${etichetta(r)}`)
      }
    } else {
      for (const [nome, p] of Object.entries(PROFILI)) {
        const r = gioca(t, p)
        console.log(`   ${nome.padEnd(12)} → ${etichetta(r)}`)
      }
      // col metro, non col giocatore perfetto: è la stessa asticella su
      // cui la tappa è stata tarata
      const { quota } = quotaMinima(t, PROFILI.misura)
      console.log(`   ➜ basta spendere il ${quota == null ? '—' : (quota * 100).toFixed(0) + '%'}` +
                  ` dell'energia per superarla`)
    }
  }
}

function etichetta(r) {
  const esito = r.esito === 'vinta' ? 'superata' : r.esito === 'persa' ? `persa a o${r.onda}` : r.esito
  // gli acquisti sono i calcoli: una torre costruita più un gradino salito
  const acquisti = r.livelli.length + r.livelli.reduce((s, lv) => s + lv - 1, 0)
  return `${esito.padEnd(12)} ${r.cuori}❤ torri [${r.livelli}] · ${String(acquisti).padStart(2)} calcoli · ` +
         `speso ${r.speso}/${r.guadagnato}⚡ (in tasca ${(r.inTasca * 100).toFixed(0)}%)`
}
