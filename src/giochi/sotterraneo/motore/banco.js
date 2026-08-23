/* ═══════════════════════════════════════════════════════════════════
   IL BANCO DI PROVA — un giocatore finto che scende davvero

   Gioca una discesa intera senza schermo: cammina, apre le porte, batte
   il guardiano, scende. Serve a due cose che a occhio non si vedono:

   1. **che una tappa si vinca.** Non «che il codice non esploda»: che un
      bambino che risponde bene otto volte su dieci arrivi in fondo. Se
      una tappa la vince solo la fortuna, si vede qui e non dal muso
      lungo di chi ci ha provato.
   2. **quanto costa un piano, in domande.** È il numero che decide se il
      gioco è un gioco o un compito, e nel prototipo il primo giro era da
      buttare — ventiquattro risposte di fila contro un solo guardiano al
      primo piano. Quel difetto non si vedeva leggendo la tabella dei
      mostri: si vedeva solo contando.

   ── DUE MODI DI GIOCARE, E LA FORBICE FRA I DUE ───────────────────
   `minimo` fa solo quello che non si può evitare: la chiave e la scala.
   `tutto` tocca ogni cosa che vale — porte, forzieri, mostri per strada.
   La distanza fra i due numeri **è il gioco**: cinque domande per
   scendere, sessanta per non lasciare niente indietro, e in mezzo c'è
   tutto quello che si sceglie. Se i due numeri si avvicinano, vuol dire
   che non si sceglie più niente.

   Il caso arriva da fuori (`rnd`) e il seme è dichiarato: una discesa si
   deve poter rifare identica, o il test racconta ogni volta una storia
   diversa.
   ═══════════════════════════════════════════════════════════════════ */
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
/* la più economica delle cose che curano: sotto questa cifra andare dal
   mercante è una passeggiata, e il giocatore finto non la fa */
const COSTO_MINIMO = Math.min(...CURE.map(k => COSE[k].prezzo))

/* Va su una cella, un passo alla volta, e si ferma appena qualcosa si
   apre: è quello che fa anche un bambino, che smette di camminare quando
   gli compare un foglio davanti. Torna `true` se ci è arrivato. */
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

/* ── raggiungere una cosa, non una cella ──
   In due tempi, e non è pignoleria: **quello che non si vede non si
   tocca**. Un guardiano dall'altra parte del piano non è ancora
   illuminato, quindi un tocco su di lui non lo prende nemmeno di mira; e
   la sua cella è bloccata, quindi come cella non è una meta. Ci si
   avvicina, e da lì lo si tocca — che è esattamente quello che fa chi
   gioca. */
function raggiungi(corsa, r) {
  const da = { x: Math.floor(corsa.eroe.x), y: Math.floor(corsa.eroe.y) }
  const sopra = ['scala', 'mercante', 'fonte'].includes(r.che)
  const via = viaVerso(corsa.buona(), r, da, { sopra })
  if (!via) return false
  if (!cammina(corsa, via.dove)) return false
  if (corsa.foglio) return true
  corsa.vaiVerso({ x: r.x, y: r.y }, true)
  for (let i = 0; i < TETTO_PASSI && !corsa.foglio && corsa.strada; i++) corsa.passo(DT)
  /* «arrivato» non basta: conta che sia **successo qualcosa**. Un
     forziere in un angolo con un mostro davanti si raggiunge e non si
     apre — la cella da cui toccarlo è occupata — e chi si accontenta di
     esserci arrivato ci torna sopra all'infinito. Il giro esterno lo
     vedeva come una discesa che non finisce mai, senza una riga che
     dicesse perché.

     Una pozione raccolta invece non apre niente: è successa lo stesso,
     e si vede da `presa`. */
  return !!corsa.foglio || !!r.presa
}

/* ── togliersi di mezzo quello che sbarra ──
   Non tutto quello che serve è raggiungibile subito: un mostro che dorme
   in un corridoio stretto e una porta chiusa sono muri, finché non si
   paga quello che chiedono. Il controllo della generazione garantisce
   che **la scala** si raggiunga senza aprire niente, non che ci si
   arrivi senza incontrare nessuno — e infatti incontrare qualcuno è il
   gioco. Qui si fa quello che farebbe un bambino: si sbriga l'ostacolo
   più vicino e si riprova.

   Si sbriga **solo chi sta davvero in mezzo**, e per saperlo si ricalcola
   la strada fingendo che il sotterraneo sia vuoto: il primo ostacolo che
   ci cade sopra è quello da pagare. Prendere invece «il più vicino» —
   che è la prima cosa che viene in mente — fa combattere mezzo piano per
   arrivare a una porta che era libera, e il conto delle domande esce
   doppio senza che niente sembri sbagliato.

   `provati` conta i tentativi per oggetto: una porta a cui si sbaglia
   resta chiusa, e senza un tetto si girerebbe intorno alla stessa
   serratura per sempre. */
function sblocca(corsa, meta, provati) {
  const da = { x: Math.floor(corsa.eroe.x), y: Math.floor(corsa.eroe.y) }
  const sgombro = percorso((x, y) => corsa.livello.calpestabile(x, y), da, meta)
  if (!sgombro) return false
  for (const c of sgombro) {
    const r = corsa.livello.robe.find(v => v.x === c.x && v.y === c.y && !v.morto && !v.presa &&
      (v.che === 'mostro' || (v.che === 'porta' && !v.aperta)))
    if (!r || (provati.get(r) || 0) >= TETTO_PROVE) continue
    const arrivato = raggiungi(corsa, r)
    /* Il tentativo si conta **solo se non è successo niente**. Prima si
       contava sempre, e bastavano tre scontri finiti male sullo stesso
       goblin — uno svenimento è un tentativo come un altro — perché il
       banco lo saltasse per sempre e dichiarasse irraggiungibile un
       guardiano che stava dietro di lui. Succedeva una volta su
       duecento, e il test lo pescava o no a seconda del seme: il livello
       era sano, era il giocatore finto ad arrendersi. */
    if (!r.morto && !r.aperta) provati.set(r, (provati.get(r) || 0) + 1)
    if (arrivato) return true
  }
  return false
}

/* ── mettersi addosso quello che si è trovato ──
   Senza questa riga il banco gioca **tutta la campagna a mani nude**, e
   il numero che ne esce non è il costo del gioco: è il costo di giocarlo
   male. Con attacco 3 il gigante dell'ultimo piano costa quattordici
   risposte di fila, con l'ascia quattro — ed è tutta la ragione per cui
   si va a cercare una spada. Un bambino la spada se la mette; il
   giocatore finto deve fare almeno quello, o misura un gioco che nessuno
   gioca. */
function equipaggia(corsa) {
  const meglio = (k, addosso, campo) => {
    const mio = addosso ? (COSE[addosso][campo] || 0) : 0
    return (COSE[k][campo] || 0) > mio
  }
  for (let i = corsa.zaino.length - 1; i >= 0; i--) {
    const k = corsa.zaino[i]
    const c = COSE[k]
    /* ── quello che questa classe non porta non si prova nemmeno ──
       Senza questa riga il giocatore finto misura **un gioco che nessuno
       può giocare**: si mette addosso l'ascia che un mago non impugna, e
       il costo in domande che ne esce è quello di un mago armato di
       ascia. Peggio ancora, `usa` la rifiuterebbe e la tasca resterebbe
       lì: il giro dopo ci riprova, e il tetto dei dodicimila giri
       diventa una discesa che non finisce mai — lo stesso muro del
       ciclo infinito raccontato qui sotto, con un'altra causa. */
    if (c.dove && !corsa.posso(k)) continue
    /* Un'arma si giudica sul **totale delle due mani**, che è quello che
       sa il motore: confrontarla con quella nel pugno mandava il banco
       in tondo per sempre. Con due armi leggere entrambe più forti di
       quella in mano, `usa` metteva la seconda nella mano debole e
       rispediva la prima in tasca; al giro dopo la prima era di nuovo
       «meglio di quella in pugno», e si scambiavano di posto
       all'infinito — dodicimila giri, novanta secondi di prova, e
       nessun errore da nessuna parte. */
    if (c.dove === 'mano') {
      const posto = corsa.postoDellArma(k)
      if (posto.delta > 0) { corsa.usa(i); continue }
    }
    if (c.dove === 'corpo' && meglio(k, corsa.corpo, 'dif')) { corsa.usa(i); continue }
    /* lo scudo va nella mano debole, e solo se là ci si può mettere
       qualcosa: con un'arma a due mani in pugno il motore lo rifiuta.
       La domanda è la stessa che si fa il gioco (`mancinaLibera`), e
       ripeterla qui vorrebbe dire misurare un giocatore che segue regole
       sue — è così che il banco è rimasto senza scudo a mani nude per
       tutta una campagna, rimettendoselo e perdendolo a ogni giro. */
    if (c.dove === 'mancina' && corsa.mancinaLibera()) { corsa.usa(i); continue }
    /* al dito ci va la prima cosa che capita: i gioielli non si
       confrontano su un numero solo — vedere più lontano e reggere un
       colpo in più non stanno sulla stessa scala — e un giocatore finto
       che ne scegliesse uno «meglio» misurerebbe una preferenza
       inventata qui invece che una regola del gioco */
    if (c.dove === 'dito' && !corsa.dito) { corsa.usa(i); continue }
    /* la pozione si beve quando serve, non appena si trova: berla piena
       è buttarla, ed è un errore che un bambino non fa due volte */
    if (c.usa === 'cura' && corsa.vita < corsa.vitaMax * 0.45) corsa.usa(i)
  }
}

/* ── quello che capita sotto i piedi ──
   Da quando la roba non si raccoglie più camminandoci sopra ma
   toccandola, un giocatore finto che non tocca niente gioca tutta la
   campagna a mani nude — e il numero che ne esce non è il costo del
   gioco, è il costo di giocarlo male. Qui si prende **solo quello che è
   a due passi**: è l'equivalente onesto della vecchia raccolta al
   passaggio, e non manda il banco a fare il giro del piano per una
   pozione (quello lo fa il modo `tutto`, ed è un'altra misura).

   `persi` tiene fuori quello che non si è riusciti a prendere, o si
   riproverebbe all'infinito sulla stessa cosa irraggiungibile. */
function raccogliVicino(corsa, persi) {
  const da = { x: Math.floor(corsa.eroe.x), y: Math.floor(corsa.eroe.y) }
  const vicina = corsa.livello.robe.find(r => r.che === 'cosa' && !r.presa &&
    !persi.includes(r) && Math.abs(r.x - da.x) + Math.abs(r.y - da.y) <= 2)
  if (!vicina) return false
  raggiungi(corsa, vicina)
  /* Presa o no, non ci si torna: un mostro che intercetta per strada
     apre uno scontro, la cosa resta per terra, e chi riprova gira in
     tondo pagando una battaglia a ogni giro. È il difetto che ha fatto
     salire il costo «minimo» del pozzo da una decina di domande a
     trentasette senza che niente sembrasse rotto. */
  if (!vicina.presa) persi.push(vicina)
  return true
}

/* Le cose che si possono toccare, dalla più vicina: il giocatore finto
   non gira a caso, va a colpo sicuro — quello che si vuole misurare è il
   costo, non la sua bravura a orientarsi. */
function robeInteressanti(corsa, quali) {
  const da = { x: Math.floor(corsa.eroe.x), y: Math.floor(corsa.eroe.y) }
  return corsa.livello.robe
    .filter(r => quali.includes(r.che) && !r.morto && !r.presa &&
                 !(r.che === 'porta' && r.aperta) && !(r.che === 'forziere' && r.aperto))
    .map(r => ({ r, d: Math.abs(r.x - da.x) + Math.abs(r.y - da.y) }))
    .sort((a, b) => a.d - b.d)
    .map(v => v.r)
}

/* Risponde a quello che c'è aperto, e dice se ha risposto a una domanda.
   `bravura` è la probabilità di azzeccarla: 1 è un adulto attento, 0.75
   un bambino nel suo pomeriggio normale. `conto` è il taccuino della
   discesa: quello che non sta nell'esito ma serve a capire la misura. */
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
    /* una curiosità apre due volte: prima la domanda, poi la battuta
       che resta a schermo finché non la si è letta */
    case 'curiosita':
      if (f.esito) { corsa.chiudi(); return false }
      corsa.rispondi(sorte() < bravura)
      return true
    /* Il caso 'trovata' non c'è più, e non è una semplificazione del
       banco: quello che è meglio se lo mette **il motore** (`vesti`),
       che è esattamente la regola scritta qui prima. Il banco continua
       a misurare il gioco che si gioca davvero, senza doverla ripetere. */
    case 'svenuto':
      corsa.riprendi()
      return false
    /* ── al banco si compra da curarsi ──
       Finché le tre boccette capitavano una volta su sei, chiudere e
       andarsene era una fotografia onesta del gioco. Adesso che sul
       banco c'è **sempre** qualcosa che cura, un giocatore finto che
       passa oltre misura un gioco che nessuno gioca: chi arriva mezzo
       morto davanti a un mercante con le gemme in tasca compra, ed è
       proprio quel gesto a decidere se la discesa si può ancora
       perdere. Questa riga sposta il metro, quindi va letta come parte
       della misura e non come un dettaglio del banco.

       Si prende **la più piccola che basta**: l'ampolla bevuta a mezza
       vita butta via metà del suo effetto, ed è lo stesso ragionamento
       per cui `equipaggia` non beve appena trova. Se nessuna arriva a
       tappare il buco si prende la più grossa che le gemme permettono,
       che è quello che farebbe chiunque. */
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

/* ── una discesa intera ──
   `come` è `'minimo'` (chiave e scala, il pavimento sotto a tutto) o
   `'tutto'` (ogni cosa che vale). */
/* `da` è una discesa **già cominciata**: serve a provare che una partita
   ripresa a metà si finisce davvero, che è l'unica prova seria che il
   salvataggio non ha perso niente per strada. */
export function gioca(tappa, { bravura = 0.8, seme = 7, come = 'minimo', rnd = null, da = null,
                              eroe = undefined } = {}) {
  const sorte = rnd || seminato(seme * 31 + 17)
  const corsa = da || new Corsa(tappa, { seme, rnd: sorte, eroe })
  if (da) da.rnd = sorte
  let giri = 0
  const persi = []
  const provati = new Map()
  const conto = { cure: 0 }
  const banchiVisti = new Set()

  while (!corsa.finita && giri++ < TETTO_GIRI) {
    /* prima si sbriga quello che si ha davanti: finché un foglio è
       aperto non si cammina */
    if (corsa.foglio) { sbriga(corsa, bravura, sorte, conto); continue }
    equipaggia(corsa)
    if (raccogliVicino(corsa, persi)) continue

    /* ── mezzo morto, e le gemme in tasca: si va dal mercante ──
       Vale in tutti e due i modi di giocare, e non è una svista:
       comprarsi da curare non è «ripulire il piano», è restare in
       piedi, e sta accanto alla chiave e alla scala fra le cose che
       non si scelgono. Una volta per banco (`banchiVisti`), o chi
       arriva senza gemme abbastanza ci tornerebbe sopra all'infinito
       — ed è lo stesso difetto di `persi` qui sopra. */
    if (corsa.vita < corsa.vitaMax * 0.45 && corsa.gemme >= COSTO_MINIMO) {
      const banco = corsa.livello.robe.find(r => r.che === 'mercante' && !banchiVisti.has(r))
      if (banco) { banchiVisti.add(banco); raggiungi(corsa, banco); continue }
    }

    /* la roba facoltativa, se si sta giocando tutto */
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

    /* la chiave: senza, la scala non si apre */
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

  return {
    corsa,
    esito: corsa.esito,
    /* quante cure ha comprato: non sta nell'esito perché non è una cosa
       del gioco, è il modo in cui questo giocatore finto lo gioca — e
       serve a leggere i numeri qui sotto senza confondere «la tappa è
       più facile» con «il metro compra le pozioni» */
    cure: conto.cure,
    guasto: corsa.finita ? null : 'la discesa non finisce mai',
  }
}

/* Quante domande costa un piano, nei due modi. È la misura che va
   guardata quando si tocca l'equilibrio: se il minimo cresce, scendere
   diventa un compito; se la forbice si stringe, non si sceglie più. */
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

/* Quante volte si vince, su N discese diverse. Una tappa che si vince
   sei volte su dieci non è difficile: è una lotteria. */
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

/* Quanti piani si generano sani. Il prototipo ne provava seicento e ne
   trovava zero storti: è il controllo che tiene onesta la generazione
   quando si cambiano le misure di una tappa. */
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

