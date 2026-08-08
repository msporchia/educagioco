/* ═══════════════════════════════════════════════════════════════════
   IL BANCO DI PROVA — un bambino finto che scende nel dungeon

   Non serve al gioco: serve a chi lo prova. Il gioco non lo importa e
   nel file unico non ci finisce (il build lo scarta: nessuno lo chiama).

   Il finto giocatore fa le cose che fa un bambino vero: sceglie una
   strada guardando cosa promette e come sta messo a vita, si equipaggia
   quando può, risponde alle domande — giusto `bravura` volte su una — e
   quando le prende scappa invece di insistere. Non sa niente delle
   materie del quiz: una domanda, qui, è una moneta lanciata. È
   esattamente il punto — **se una tappa la vince solo chi sa tutto, si
   vede qui** e non dal muso lungo di un bambino a metà campagna.

     bravura 1     risponde sempre giusto: deve arrivare in fondo quasi sempre
     bravura 0.75  ne sbaglia una su quattro: è il bambino vero
     bravura 0.3   tira a indovinare: NON deve arrivare in fondo

   ── PERCHÉ ADESSO IL BANCO DEVE SAPER GIOCARE, NON SOLO RISPONDERE ──
   Prima bastava rispondere: due giuste e il mostro cadeva, per tutti
   allo stesso modo. Adesso il numero di domande dipende da come ci si
   equipaggia, e un giocatore finto che non compra e non si allena
   misurerebbe **il caso peggiore** e lo chiamerebbe difficoltà. Quindi
   qui dentro c'è una testa che si potenzia: prende l'arma quando può,
   si cura quando è basso, e davanti a un capo ci arriva con quello che
   ha trovato. Non gioca bene come un adulto — sceglie con due regole in
   croce — e va benissimo così: è la soglia di chi ci sta provando.

   Le soglie stanno in `dati/taratura.js` (`ATTESE`), non qui: chi tara
   il gioco cambia i dati, non il banco.
   ═══════════════════════════════════════════════════════════════════ */
import { STANZE } from '../dati/stanze.js'
import { TESORI, POZIONE, inCasella } from '../dati/tesori.js'
import { colpoDelMostro } from '../dati/eroe.js'
import { Corsa } from './corsa.js'

/* Il caso ripetibile: due prove uguali devono raccontare la stessa
   storia, o un test rosso non si sa se è un guasto o sfortuna. */
export function caso(seme = 1) {
  let s = seme >>> 0 || 1
  return () => {
    s ^= s << 13; s >>>= 0
    s ^= s >>> 17
    s ^= s << 5; s >>>= 0
    return s / 4294967296
  }
}

/* Quanto sta messo male, da 0 (intero) a 1 (in fin di vita) */
const conciato = corsa => 1 - corsa.vita / Math.max(1, corsa.vitaMax)

/* ── quale strada ──
   Chi sta bene va a caccia di bottino, chi è ferito cerca il fuoco e
   gira largo dai mostri. In più — ed è la regola nuova — chi ha le
   mani vuote **cerca apposta le stanze che lasciano equipaggiamento**,
   perché è quello che serve per arrivare in fondo. È la stessa testa
   che fa un bambino, ridotta all'osso: se con questa il dungeon non si
   finisce, non è difficile, è ingiusto. */
function scegliStrada(corsa, rnd) {
  const aperte = corsa.aperte()
  if (!aperte.length) return null
  const male = conciato(corsa)
  const ferito = male > 0.55
  const nudo = !corsa.mano || !corsa.addosso
  const votate = aperte.map(s => {
    const scheda = STANZE[s.tipo]
    let voto = scheda.ricchezza
    if (s.tipo === 'fuoco') voto = ferito ? 7 : 1.5
    if (s.tipo === 'negozio') voto = corsa.gemme >= TESORI.spadino.prezzo ? 4 : 1
    /* la roba buona sta dietro i mostri grossi: se manca, si va a
       prendersela, ma solo se si è in piedi per farlo */
    if (nudo && !ferito && scheda.grado >= 2) voto += 2.5
    /* quanto costa questa strada adesso: una stanza che chiede cinque
       scambi quando si è conciati è come non averla vista */
    if (scheda.taglia && s.tipo !== 'scrigno') voto -= male * corsa.scambiPer(s) * 0.6
    return { s, voto: voto + rnd() * 0.5 }
  })
  return votate.reduce((a, b) => (b.voto > a.voto ? b : a)).s
}

/* ── cosa si sceglie dentro una stanza senza domande ── */
function scegliVoce(corsa, st, rnd) {
  const buone = st.voci.filter(v => !v.spento)
  const male = conciato(corsa)

  if (st.tipo === 'fuoco') {
    /* la cura prima di tutto quando serve — e prima di un capo conviene
       sempre, perché lì è gratis e piena */
    if (male > 0.4 || (st.primaDelCapo && male > 0.15)) return 'riposa'
    /* poi la roba, se ne offre: un oggetto vale più di un punto secco */
    const roba = buone.find(v => v.chiave === 'roba')
    if (roba) return 'roba'
    /* e in mancanza d'altro ci si allena, alternando: l'attacco se i
       mostri non cadono, la guardia se si prendono troppe botte */
    return male > 0.2 ? 'allena:difesa' : 'allena:attacco'
  }

  if (st.tipo === 'negozio') {
    if (male > 0.45 && buone.some(v => v.chiave === 'pozione') && corsa.gemme >= POZIONE.prezzo)
      return 'pozione'
    /* si compra il pezzo più caro che ci si può permettere: è anche il
       migliore, perché prezzo e grado salgono insieme (lo controlla
       `guastiDeiTesori`) */
    const compra = buone.filter(v => v.chiave.startsWith('compra:'))
      .sort((a, b) => b.prezzo - a.prezzo)
    if (compra.length) return compra[0].chiave
    if (buone.some(v => v.chiave === 'pozione') && male > 0.2) return 'pozione'
    return 'via'
  }

  /* le stranezze: azzardare quando si sta bene, andare sul sicuro quando
     si è conciati. `azzardo` lo dichiara l'evento, non lo indovina qui */
  const prudente = buone.find(v => !v.azzardo) || buone[0]
  const rischiosa = buone.find(v => v.azzardo) || buone[0]
  if (male > 0.5) return prudente.chiave
  return (rnd() < 0.6 ? rischiosa : prudente).chiave
}

/* Una discesa intera, giocata fino in fondo (o fino a finire la vita).
   `giri` è solo una rete: una corsa che non finisce è un guasto, e va
   detto invece di far girare la macchina per sempre. */
export function giocaCorsa(tappa, { rnd = Math.random, bravura = 1, mappa = null,
                                    tappeFatte = 0 } = {}) {
  const corsa = new Corsa(tappa, { rnd, mappa, tappeFatte })
  let giri = 0
  while (!corsa.finita && giri++ < 4000) {
    if (corsa.dove === 'mappa') {
      const dove = scegliStrada(corsa, rnd)
      if (!dove) break
      corsa.entra(dove)
      continue
    }
    const st = corsa.stanza
    if (!st) break
    if (st.che === 'sfida') {
      if (st.momento === 'domanda') corsa.rispondi(rnd() < bravura)
      else if (st.momento === 'colpito') {
        /* si scappa quando il prossimo sbaglio può essere l'ultimo: due
           colpi di margine, che è quanto basta per accorgersene */
        const colpo = colpoDelMostro(st.mostro.attacco, corsa.difesa)
        if (corsa.vita <= colpo * 2 && st.scappabile) corsa.scappa()
        else corsa.continua()
      } else corsa.esci()
    } else {
      if (st.esito) corsa.esci()
      else if (!corsa.scegli(scegliVoce(corsa, st, rnd)) && corsa.stanza?.esito) corsa.esci()
    }
  }
  return { corsa, bloccata: giri >= 4000 }
}

/* Quante volte su cento questo giocatore arriva al guardiano, e cosa gli
   costa arrivarci. `domandeMedie` dice quanto è lunga davvero una
   discesa; `attaccoFine` e `difesaFine` dicono **se il potenziamento è
   arrivato**, che è la cosa che questo gioco promette e la sola che il
   banco può controllare al posto di un bambino. */
export function misura(tappa, { volte = 60, bravura = 1, rnd = Math.random,
                                tappeFatte = 0 } = {}) {
  let vinte = 0, domande = 0, sbagliate = 0, stelle = 0, stanze = 0, bloccate = 0
  let tesori = 0, attacco = 0, difesa = 0, conArma = 0, conArmatura = 0
  for (let i = 0; i < volte; i++) {
    const { corsa, bloccata } = giocaCorsa(tappa, { rnd, bravura, tappeFatte })
    if (bloccata) bloccate++
    domande += corsa.domande
    sbagliate += corsa.sbagliate
    stanze += corsa.visitate
    tesori += corsa.tesori
    attacco += corsa.attacco
    difesa += corsa.difesa
    if (corsa.mano) conArma++
    if (corsa.addosso) conArmatura++
    if (corsa.vinta) { vinte++; stelle += corsa.stelle }
  }
  return {
    volte, vinte, bloccate,
    quota: vinte / volte,
    domandeMedie: domande / volte,
    sbagliateMedie: sbagliate / volte,
    stanzeMedie: stanze / volte,
    tesoriMedi: tesori / volte,
    attaccoFine: attacco / volte,
    difesaFine: difesa / volte,
    quotaArma: conArma / volte,
    quotaArmatura: conArmatura / volte,
    stelleMedie: vinte ? stelle / vinte : 0,
  }
}

/* Il grado dell'equipaggiamento con cui si arriva in fondo, contato su
   una manciata di discese. Serve a una domanda sola, ma è **la**
   domanda del gioco nuovo: chi gioca bene arriva al guardiano con roba
   migliore di chi tira dritto? Se la risposta è no, il bottino è una
   decorazione e le stanze difficili non le sceglierà più nessuno. */
export function gradoInFondo(tappa, { volte = 40, bravura = 0.85, rnd = Math.random,
                                      tappeFatte = 0 } = {}) {
  let somma = 0, quante = 0
  for (let i = 0; i < volte; i++) {
    const { corsa } = giocaCorsa(tappa, { rnd, bravura, tappeFatte })
    const arma = inCasella(corsa.equipaggiamento, 'mano')
    const armatura = inCasella(corsa.equipaggiamento, 'addosso')
    somma += (arma?.grado || 0) + (armatura?.grado || 0)
    quante++
  }
  return quante ? somma / quante : 0
}
