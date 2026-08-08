/* ═══════════════════════════════════════════════════════════════════
   IL CASTELLO GIOCATO A MENTE

   Fa girare `motore/battaglia.js` — le regole vere, quelle che girano
   sul telefono — con un giocatore finto al posto del bambino, e senza
   niente da disegnare. Una tappa intera costa qualche decimo di
   secondo: si possono provare mille partite nel tempo in cui il browser
   ne gioca una.

   Serve a rispondere alla sola domanda che conta per l'equilibrio:

     quanta della sua energia deve spendere, uno che gioca, per
     arrivare in fondo?

   Se la risposta è «la metà», la tappa è una passeggiata, e non importa
   quanto sia bello il modello che l'ha generata. Il giocatore finto ha
   un tetto di spesa apposta: `quota: 0.75` vuol dire che di tutta
   l'energia che la tappa gli mette in mano ne spende tre quarti e il
   resto se lo tiene. Facendo scendere quel tetto finché non perde si
   misura, in un numero, quanto la tappa è larga di manica.

   Da quando una tappa promette i suoi `calcoli`, questo strumento
   risponde anche a una seconda domanda: **quanti acquisti fa davvero**
   chi la gioca bene. Un acquisto è un'operazione in colonna, e il
   numero che esce dalla partita simulata deve essere quello scritto in
   `data/campagne-castello.js` — se non lo è, il modello di
   `data/castello.js` è sbagliato, non il dato.

   Uso:
     node strumenti/simula-castello.mjs                  # tutte e quindici
     node strumenti/simula-castello.mjs 6                # solo la sesta
     node strumenti/simula-castello.mjs --quote 1,.9,.8  # con che tetti
   ═══════════════════════════════════════════════════════════════════ */
import { TAPPE, LIBERA, CFG, costoNuovaTorre, costoSalita } from '../src/data/castello.js'
import { creaBattaglia } from '../src/motore/battaglia.js'
import { torreDebole } from '../src/data/mostri.js'

/* ── il campo su cui si tara ──
   Le misure contano davvero: un campo più largo è una strada più lunga,
   quindi più secondi sotto tiro. Si tara sul telefono in verticale,
   perché è lì che i bambini giocano — l'app è installata e il manifest
   dice `portrait`. La formula della scala è quella di `grafica/tela.js`:
   se cambia lì, cambia qui. */
export const TELEFONO = misureDi(390, 420)
export function misureDi(W, H, unita = 420) {
  return { W, H, S: Math.max(0.62, Math.min(1.5, Math.min(W, H) / unita)) }
}

/* Numeri a caso ma sempre gli stessi: una partita simulata si deve poter
   rigiocare identica, o un bilanciamento non è una misura ma un aneddoto. */
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

/* ── il giocatore finto ──

   Non è un'intelligenza artificiale: è un bambino diligente. Costruisce
   le prime due torri per non restare scoperto, poi sceglie il gradino
   più conveniente — che è quasi sempre potenziare, ed è il punto di
   tutto il gioco. Ogni acquisto gli costa il tempo di un'operazione in
   colonna, durante il quale il campo va avanti senza di lui.

   I parametri sono quelli che distinguono un bambino dall'altro:

     quota     quanta parte dell'energia ricevuta si lascia spendere
     strategia 'potenzia' | 'costruisci' — torri alte o torri tante
     tOp       secondi per fare un'operazione in colonna
     sbaglia   con che probabilità sbaglia (ogni errore è una penale)
     svelto    se chiama l'ondata subito e si prende il bonus fretta
     traOndate se compra soltanto a campo pulito, prima di chiamare
               l'ondata, invece che anche mentre i mostri camminano
     debolezze se guarda la scheda del mostro e costruisce la torre che
               gli fa doppio danno
*/
export const PROFILI = {
  /* Il metro su cui si tarano le tappe: spende tutto, non sbaglia un
     conto — e **non corre**. Il bonus della fretta non entra nel conto
     apposta: chi si prende il tempo di calcolare bene non deve trovarsi
     in debito per questo, e i cinque punti a ondata di chi è svelto
     restano quello che devono essere, un cuscinetto in più. */
  misura:      { quota: 1.00, strategia: 'potenzia', tOp: 10, sbaglia: 0, svelto: false,
                 traOndate: true },
  /* chi ne tiene da parte un decimo: deve passare, ma sentirlo. Uguale
     al metro in tutto il resto — se no «spendere il 90%» non vuol dire
     niente: prendersi il bonus della fretta ne vale già il sette. */
  parco:       { quota: 0.90, strategia: 'potenzia', tOp: 10, sbaglia: 0, svelto: false,
                 traOndate: true },
  /* chi ne tiene da parte un quarto: non deve passare */
  pigro:       { quota: 0.75, strategia: 'potenzia', tOp: 10, sbaglia: 0, svelto: false,
                 traOndate: true },
  /* il tetto di quello che si può avere: spende tutto, corre, e compra
     anche mentre i mostri camminano */
  pieno:       { quota: 1.00, strategia: 'potenzia', tOp: 10, sbaglia: 0, svelto: true },
  /* il bambino vero: spende tutto ma sbaglia un conto su quattro, ci
     mette il suo tempo e la fretta non se la prende. Deve passare lo
     stesso, se no la tappa è tarata per un adulto */
  pasticcione: { quota: 1.00, strategia: 'potenzia', tOp: 22, sbaglia: 0.25, svelto: false },
  /* chi non ha capito che potenziare conviene: riempie il campo di
     torri di livello 1. Deve arrivare meno lontano dell'altro */
  largo:       { quota: 1.00, strategia: 'costruisci', tOp: 10, sbaglia: 0,  svelto: true },
  /* Chi legge il preavviso: uguale al metro in tutto, ma quando
     costruisce sceglie la torre a cui l'ondata **in arrivo** è debole,
     e le fa il doppio del danno.
     Non è su di lui che si tara, ed è una decisione, non una
     dimenticanza: se le tappe fossero misurate su chi sfrutta le
     debolezze, leggere il nastro delle ondate future diventerebbe
     obbligatorio e chi non ci è ancora arrivato si troverebbe la tappa
     ingiocabile. Tarando sul metro, il preavviso resta quello che deve
     essere — un vantaggio per chi impara a leggerlo. Questo profilo
     serve a **misurare quanto vale** quel vantaggio, non a fissarlo. */
  previdente:  { quota: 1.00, strategia: 'potenzia', tOp: 10, sbaglia: 0, svelto: false,
                 traOndate: true, debolezze: true },
}

export function gioca(tappa, opzioni = {}) {
  const { quota = 1, strategia = 'potenzia', tOp = 10, sbaglia = 0, svelto = true,
          traOndate = false, debolezze = false, misure = TELEFONO, s = 7, finoA = tappa.ondate,
          da = null, istantanee = null } = opzioni
  const caso = seme(s)
  const stato = { cuori: 0, onda: 0, uccisi: 0, torri: 0, energia: 0 }
  const motore = creaBattaglia({ tappa, misure, stato, caso })
  motore.inizia()

  let speso = 0                 // quanto ha messo in torri, penali comprese
  let occupato = 0              // secondi che ancora mancano all'operazione in corso
  let inCorso = null            // cosa sta comprando mentre calcola
  let t = 0
  const storia = []
  let cuoriPrima = stato.cuori
  /* Si può ripartire da un'ondata di mezzo invece che dall'inizio: al
     taratore serve riprovare la stessa ondata cento volte con nemici
     diversi, e rigiocarsi ogni volta tutta la tappa da capo costerebbe
     cento volte tanto. L'istantanea porta con sé anche quanto è stato
     speso fin lì, altrimenti il tetto di spesa ripartirebbe da zero. */
  if (da) { motore.riprendi(da); speso = da.speso || 0 }
  let ondaVista = stato.onda     // per accorgersi che ne è partita una nuova
  let foto = null                // com'era il campo prima che partisse

  /* quanto può ancora spendere: dell'energia che la tappa gli ha dato in
     tutto, la sua quota — il resto se lo tiene in tasca */
  const disponibile = () => (stato.energia + speso) * quota - speso

  /* a quale torre è debole l'ondata **in arrivo** — non quella in corso:
     si compra a campo pulito, fra un'ondata e l'altra, e la torre che
     serve è quella per chi deve ancora arrivare. È l'informazione che il
     nastro del preavviso mette sotto gli occhi del bambino. */
  function deboleInArrivo() {
    if (!debolezze) return null
    const inArrivo = motore.prossime ? motore.prossime(1)[0] : null
    const debole = inArrivo ? inArrivo.debole : torreDebole(motore.bestia.id)
    return debole && tappa.torri.includes(debole) ? debole : null
  }

  /* cosa comprerebbe adesso, se potesse */
  function mossa() {
    const torri = motore.torri
    const nuova = { che: 'nuova', costo: costoNuovaTorre(torri.length) }
    /* Si sale sempre la torre più bassa, anche chi legge il preavviso:
       inseguire la debolezza col potenziamento è stato misurato ed è
       una mossa peggiore — un gradino alto costa di più, e a fine tappa
       ci si ritrova con meno livelli in tutto di chi ha tenuto le torri
       pari. Il preavviso paga su *cosa costruire*, non su cosa alzare. */
    const bassa = torri.filter(x => x.lv < tappa.cap).sort((a, b) => a.lv - b.lv)[0]
    const salita = bassa ? { che: 'salita', torre: bassa, costo: costoSalita(bassa.lv) } : null
    const cistanno = torri.length < tappa.posti
    if (torri.length < 2 && cistanno) return nuova
    if (strategia === 'costruisci' && cistanno) return nuova
    if (!salita) return cistanno ? nuova : null
    if (!cistanno) return salita
    return salita.costo <= nuova.costo ? salita : nuova
  }

  /* Che torre costruire: a giro fra quelle che la tappa dà, così il campo
     finisce per avere una torre di ogni mestiere — compreso il ghiaccio,
     che non fa danno ma vale come tempo in più per sparare. Chi legge il
     preavviso anticipa il tipo che gli serve, ma solo se non ce l'ha già:
     riempire il campo del tipo dell'ondata in arrivo vorrebbe dire
     restare senza gelo, e il gelo vale più del doppio danno. */
  function tipoNuovo() {
    const giusta = deboleInArrivo()
    if (giusta && !motore.torri.some(t => t.tipo === giusta)) return giusta
    return tappa.torri[motore.torri.length % tappa.torri.length]
  }

  while (t < LIMITE) {
    // sta calcolando: il campo va avanti, lui no
    if (occupato > 0) {
      occupato -= PASSO
      if (occupato <= 0 && inCorso) {
        const penale = caso() < sbaglia ? CFG.malusErrore : 0
        const conto = { prezzo: inCorso.costo, penale }
        speso += inCorso.costo + penale
        if (inCorso.che === 'nuova') motore.costruisci(tipoNuovo(), conto)
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
    /* Quanto vicino al castello è arrivato il più avanti di loro. È la
       misura su cui si tarano le ondate: dice «di poco» o «di tanto»
       dove i cuori dicono soltanto sì o no, e serve un numero che
       cambi poco alla volta per poterci cercare sopra. */
    if (storia.length) {
      const corsa = storia[storia.length - 1]
      for (const n of motore.nemici)
        corsa.avanzata = Math.max(corsa.avanzata, n.d / motore.via.lunghezza)
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
      esito, onda: stato.onda, cuori: stato.cuori, uccisi: stato.uccisi,
      livelli: motore.torri.map(x => x.lv), speso: Math.round(speso),
      guadagnato: Math.round(guadagnato), avanzo: Math.round(stato.energia),
      /* il numero che riassume tutto: quanta dell'energia ricevuta è
         rimasta in tasca a fine partita */
      inTasca: guadagnato ? stato.energia / guadagnato : 0,
      secondi: Math.round(t), storia,
    }
  }
}

/* ── quanto poco basta spendere ──
   Abbassa il tetto di spesa finché la tappa non si perde più. Il numero
   che esce è la larghezza di manica della tappa: 1 vuol dire che serve
   tutto, 0.6 che ne bastano sei decimi e il resto è decorazione. */
export function quotaMinima(tappa, opzioni = {}, passo = 0.05) {
  for (let q = 0.4; q <= 1.001; q += passo) {
    const r = gioca(tappa, { ...opzioni, quota: Math.round(q * 100) / 100 })
    if (r.esito === 'vinta') return { quota: Math.round(q * 100) / 100, esito: r }
  }
  return { quota: null, esito: gioca(tappa, { ...opzioni, quota: 1 }) }
}

/* ── quando è chiamato a mano ── */
if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2)
  const quali = argv.filter(a => /^\d+$/.test(a)).map(Number)
  const iQuote = argv.indexOf('--quote')
  const quote = iQuote >= 0 ? argv[iQuote + 1].split(',').map(Number) : null
  const tappe = quali.length ? quali.map(n => [n - 1, TAPPE[n - 1]]) : [...TAPPE.entries()]

  for (const [i, t] of tappe) {
    console.log(`\n${i + 1}. ${t.nome} — ${t.calcoli} calcoli promessi · ${t.ondate} ondate · ` +
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
