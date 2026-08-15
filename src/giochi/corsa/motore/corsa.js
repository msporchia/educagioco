/* ═══════════════════════════════════════════════════════════════════
   LA CORSA — le regole, senza schermo

   Non c'è un pixel qui dentro. Gira uguale nel browser e in Node, ed è
   l'unico motivo per cui l'equilibrio di questo gioco si può *misurare*
   (vedi `banco.js`, il giocatore finto) invece di provarlo a occhio.

   ── COSA SUCCEDE ─────────────────────────────────────────────────
   Si corre da soli su tre corsie e si sceglie solo **dove**. Ogni tanto
   arriva un cancello: tre operatori, uno per corsia, che fanno alla
   truppa quello che c'è scritto. Ogni tre cancelli arriva un mostro, e
   la truppa **gli spara addosso mentre ci si avvicina**: il numero è la
   potenza di fuoco. Quello che al mostro resta di vita quando lo si
   raggiunge, te lo porta via addosso. Se la truppa arriva a zero si
   perde e si ricomincia la tappa — senza sconfitta, scegliere bene il
   cancello non varrebbe niente.

   ── LE TRE COSE CHE NON SI TOCCANO ───────────────────────────────
   1. **Il danno si conta per metro percorso, non per secondo.** Se no
      correre più forte vorrebbe dire sparare di meno, e uno scontro si
      deciderebbe su com'è andata la corsa prima invece che sui numeri.
      Vuol dire anche che la truppa stende esattamente un mostro grande
      quanto lei: sopra si passa puliti, sotto si paga all'impatto.
   2. **Il mostro si dimensiona su dove la truppa *sarà*.** I cancelli in
      volo sono già tutti generati, quindi il caso peggiore e il migliore
      si calcolano davvero. La vita sta poco sopra il caso peggiore: chi
      sceglie male una volta ci arriva col fiato corto, chi sbaglia due
      volte di fila muore — ed è una morte che si capisce.
   3. **Il cancello col libro ferma tutto.** I conti si fanno da fermi:
      leggere un esercizio mentre si corre non è calcolare, è tirare a
      indovinare. La partita non avanza di un istante finché la domanda
      è lì.
   ═══════════════════════════════════════════════════════════════════ */
import { TETTO, figure, scomponi } from '../dati/ordini.js'
import { generaCancelli, resaPrevista, tondo } from './cancelli.js'

/* Fin dove si vede la pista. Non è una scelta di disegno: è **quanto
   tempo hai per decidere**. A quattro metri al secondo, quarantasei
   metri sono undici secondi di preavviso su ogni cancello. */
export const ORIZZONTE = 46

/* Da quanto lontano la truppa comincia a sparare. Un branco grande
   esattamente quanto il mostro lo stende giusto sul filo dell'impatto:
   sopra si vince con margine, sotto si prendono le legnate. */
export const INGAGGIO = 16

const FRENO_BOSS = 0.45       // davanti al boss si rallenta, non ci si ferma

/* ═══════════ QUANTO COSTA UNO SCONTRO PERSO ═══════════
   Il mostro **non spara**. Sparava, per un giro: un fuoco di risposta
   continuo, proporzionale alla vita che gli restava. Sulla carta era
   giusto — chi ci mette di più a stenderlo ne perde di più — e a schermo
   era un disastro: il numero della truppa cambiava sessanta volte al
   secondo, e con lui la formazione in terra si rifaceva a ogni
   fotogramma. Un numero che lampeggia non è un numero che si legge, e
   qui il numero **è** il gioco.

   Adesso la truppa cala solo quando succede qualcosa che si vede: un
   cancello, una cassa, un cono, uno scontro. Lo scontro si paga tutto
   insieme **all'impatto**, e solo se il mostro è ancora in piedi: quello
   che gli resta di vita te lo porta via moltiplicato per `PEDAGGIO`.

   È anche una regola più semplice da leggere, ed è la stessa che il
   bambino vede scritta sui due numeri: **la truppa dev'essere più grossa
   di quel mostro lì**. Sopra, non si perde niente; sotto, si paga caro. */
const PEDAGGIO = 3

/* ═══════════ LA SPINTA ═══════════
   Ogni tocco dà una spintarella, e tenendo il ritmo si vola. Serve a una
   cosa sola: **saltare i tratti in cui non c'è niente da decidere**. Fra
   un cancello e l'altro ci sono venti metri di strada vuota, e aspettare
   che passino non insegna niente a nessuno.

   Ma la spinta **si spegne da sola** quando la scelta si avvicina, e il
   limite è **in secondi, non in metri**. La prima versione frenava sotto
   i sedici metri dal cancello, con una rampa di dodici: sembrava
   ragionevole finché non si è fatto il conto — i cancelli distano
   diciassette-ventun metri, quindi la rampa cominciava *prima* del
   cancello precedente e la spinta piena non arrivava mai. Un vincolo
   scritto in metri non sa quanto sono distanti i cancelli di quella
   tappa; scritto in secondi lo sa da sé.

   La regola è una riga: **all'avvicinamento restano sempre almeno
   `RESPIRO` secondi**. La velocità massima concessa è quella che ancora
   li garantisce, e sotto il passo della tappa non si scende comunque. È
   il tempo per leggere tre numeri, e non è una cosa che un bambino di sei
   anni sappia di dover pretendere: chi ha fretta salta i tratti vuoti,
   non la scelta. */
const SPINTA = 0.45           // quanta ne dà un tocco secco
const RIEMPI = 2.4            // ...e quanta al secondo se si tiene premuto
const SPINTA_MAX = 1.4        // fin dove si accumula: si arriva a più del doppio
const CALO = 1.6              // quanto in fretta si esaurisce, mollato il dito
const RESPIRO = 2.8           // i secondi di avvicinamento che nessuno può togliere

export class Regole {
  constructor(t) {
    this.chiave = t.chiave
    this.nome = t.nome
    this.veste = t.veste
    this.metri = t.metri
    this.passo = t.passo
    this.punta = t.punta
    this.spinta = t.spinta
    this.fraCancelli = t.fraCancelli
    this.fraScontri = t.fraScontri
    this.tetto = Math.min(t.tetto ?? TETTO, TETTO)
    this.truppa = t.truppa
    this.libri = t.libri
    this.studio = t.studio
    this.mira = t.mira
    this.coni = t.coni
    this.premio = t.premio
  }

  get infinita() { return !Number.isFinite(this.metri) }
}

export class Partita {
  constructor(regole, { rnd = Math.random } = {}) {
    this.regole = regole
    this.rnd = rnd

    this.dist = 0
    this.v = regole.passo
    this.corsia = 0            // dove vuoi essere
    this.corsiaX = 0           // dove sei davvero: l'interpolazione fa lo scarto
    this.truppa = regole.truppa
    this.cose = []
    this.prossima = 24         // il primo cancello arriva dopo un respiro
    this.colpi = []
    this.scossa = 0
    this.fretta = 0            // la spinta accumulata
    this.tieni = false         // il dito è giù adesso

    this.daScontro = 0
    this.scontri = 0
    this.daColpo = 0

    this.vinti = 0             // scontri chiusi prima dell'impatto
    this.persi = 0             // mostri arrivati addosso ancora in piedi
    this.cancelli = 0          // cancelli attraversati
    this.meglio = 0            // quante volte hai preso il migliore dei tre
    this.libriProvati = 0
    this.libriGiusti = 0
    this.eccesso = 0           // i soldati oltre il tetto, che non entrano in terra
    this.causa = ''

    this.offerta = null        // il cancello d'oro appena attraversato
    this.esito = null
    this.eventi = []

    if (!regole.infinita) this.cose.push({ tipo: 'traguardo', z: regole.metri, fatto: false })
    this.generaAvanti()
  }

  /* ═══════════ com'è messa ═══════════ */
  get finita() { return this.esito !== null }
  get vinta() { return this.esito === 'vinta' }
  get inPausa() { return this.offerta !== null }
  get restano() { return this.regole.infinita ? Infinity : Math.max(0, this.regole.metri - this.dist) }

  /* Quanti dei cancelli attraversati erano il migliore dei tre. È
     l'unica misura in tutto il gioco che dica **se il conto è venuto**,
     e non dipende da come è andata la corsa. */
  get precisione() { return this.cancelli ? this.meglio / this.cancelli : 0 }

  /* ⭐ arrivare · ⭐⭐ senza perdere uno scontro · ⭐⭐⭐ e aver scelto il
     cancello migliore abbastanza spesso. La seconda premia il risultato
     — un mostro si abbatte prima dell'impatto solo se la truppa è grossa
     — la terza premia il conto. */
  get stelle() {
    if (!this.vinta) return 0
    let s = 1
    if (this.persi === 0) s++
    if (this.cancelli >= 3 && this.precisione >= this.regole.mira) s++
    return s
  }

  /* I soldati che non entrano più in terra corrono al traguardo e
     diventano monete: chi ha tenuto la truppa piena per mezza tappa non
     deve vedere quel lavoro sparire in un tetto. */
  get avanzo() { return Math.min(15, Math.floor(this.eccesso / 40)) }

  get monete() {
    if (this.regole.infinita) return Math.min(20, Math.floor(this.dist / 60)) + this.avanzo
    return this.vinta ? this.regole.premio * this.stelle + this.avanzo : 0
  }

  segnala(che) { if (this.eventi.length < 60) this.eventi.push(che) }
  svuotaEventi() { const e = this.eventi; this.eventi = []; return e }

  /* ═══════════ il dito ═══════════ */
  vai(delta) {
    const n = Math.max(-1, Math.min(1, this.corsia + delta))
    if (n === this.corsia) return false
    this.corsia = n
    this.segnala('cambio')
    return true
  }

  punta(corsia) { return this.vai(Math.max(-1, Math.min(1, corsia)) - this.corsia) }

  /* Un tocco secco = una spintarella. Vale anche quando la corsia è già
     quella giusta: il gesto è «voglio andare», non «voglio spostarmi». */
  spingi() {
    if (this.finita || this.inPausa) return 0
    this.fretta = Math.min(SPINTA_MAX, this.fretta + SPINTA)
    return this.fretta
  }

  /* Il dito tenuto giù. È il modo in cui la spinta si chiede davvero —
     col mouse, e anche col pollice, «premere» viene prima di «battere» —
     e senza questo restava un gioco in cui bisognava martellare lo
     schermo per andare avanti, cioè una cosa che non fa nessuno. */
  premi(giu) {
    this.tieni = !!giu && !this.finita && !this.inPausa
    return this.tieni
  }

  /* Quanto vale la spinta **adesso**, tenuto conto di cosa c'è davanti:
     tanta quanta ne resta dopo aver messo da parte `RESPIRO` secondi di
     avvicinamento al prossimo cancello. Sotto il passo della tappa non si
     scende mai — la spinta accelera, non frena. */
  get spintaOra() {
    if (!this.fretta) return 1
    const scelta = this.cose
      .filter(c => c.tipo === 'cancelli' && !c.fatto && c.z - this.dist > 0)
      .sort((a, b) => a.z - b.z)[0]
    const libera = 1 + this.fretta
    if (!scelta) return libera
    const concessa = (scelta.z - this.dist) / (RESPIRO * this.v)
    return Math.min(libera, Math.max(1, concessa))
  }

  /* ═══════════ il giro ═══════════ */
  avanza(dt) {
    if (this.finita || this.inPausa) return

    /* Davanti a un boss si rallenta e lo si affronta: non ci si ferma.
       Fermarsi spezza la corsa e trasforma uno scontro in una schermata;
       il rallentamento invece è **tempo di fuoco in più**, che è l'unica
       cosa che serve contro qualcosa che ha il triplo della vita. */
    const capo = this.cose.find(c => c.tipo === 'nemici' && c.boss && !c.fatto &&
                                     c.z - this.dist < 18 && c.vita > 0)
    const freno = capo ? FRENO_BOSS : 1

    const metri = this.v * freno * this.spintaOra * dt
    if (this.tieni) this.fretta = Math.min(SPINTA_MAX, this.fretta + dt * RIEMPI)
    else this.fretta = Math.max(0, this.fretta - dt * CALO)
    this.dist += metri
    this.v = Math.min(this.regole.punta, this.v + dt * this.regole.spinta)
    this.corsiaX += (this.corsia - this.corsiaX) * Math.min(1, dt * 12)
    this.scossa = Math.max(0, this.scossa - dt * 45)

    this.generaAvanti()
    this.sparatoria(metri)

    for (const e of this.cose) {
      if (e.fatto || e.z - this.dist > 0.5) continue
      e.fatto = true
      this.attraversa(e)
      if (this.finita || this.inPausa) return
    }
    this.cose = this.cose.filter(e => e.z - this.dist > -3)

    for (const c of this.colpi) { c.z += 42 * dt; c.meta -= metri }
    this.colpi = this.colpi.filter(c => c.z < c.meta)

    if (this.truppa <= 0) {
      if (!this.causa) this.causa = 'la truppa è finita'
      this.finisci('persa')
    }
  }

  finisci(esito) {
    if (this.finita) return
    this.esito = esito
    this.segnala(esito === 'vinta' ? 'vittoria' : 'fine')
  }

  /* ═══════════ la pista che si genera da sé ═══════════
     Sempre una quarantina di metri più avanti dello sguardo, e mai oltre
     il traguardo: un cancello sul filo dell'arrivo è una scelta che non
     si fa in tempo a fare. */
  generaAvanti() {
    const r = this.regole
    const fine = r.infinita ? Infinity : r.metri - r.fraCancelli * 0.5
    let giri = 0
    while (this.prossima < this.dist + ORIZZONTE && this.prossima < fine && giri++ < 40)
      this.generaPezzo()
  }

  /* Con quanti soldati si arriverà fin lì, nel caso peggiore e nel
     migliore: i cancelli in volo sono già tutti generati, quindi il conto
     è esatto e non una stima. Il tetto vale anche qui — senza, il mostro
     veniva dimensionato su una truppa che il tetto poi tagliava, e
     arrivava cinque volte troppo grosso proprio contro chi stava giocando
     meglio di tutti. */
  previsione() {
    const tetto = this.regole.tetto
    let min = this.truppa, max = this.truppa
    for (const c of this.cose) {
      if (c.tipo !== 'cancelli' || c.fatto) continue
      const v = c.ops.flatMap(o => [resaPrevista(o)(min), resaPrevista(o)(max)])
      min = Math.min(...v, tetto)
      max = Math.min(Math.max(...v), tetto)
    }
    return { min: Math.max(1, min), max: Math.max(1, max) }
  }

  generaPezzo() {
    const r = this.regole
    const { min, max } = this.previsione()

    if (this.daScontro >= r.fraScontri) {
      this.daScontro = 0
      /* Ogni tanto una banda di mostri. È lei che tiene i numeri in una
         fascia dove il conto si fa ancora a mente: senza qualcosa che
         consuma, la truppa arriva a novecento e «×3» smette di essere una
         domanda. Quanti ne servono sta fra il peggio e il meglio — ma **in
         proporzione**, non a metà strada: qui si moltiplica, e fra 1 e 135
         la metà aritmetica è praticamente il massimo. */
      const base = Math.max(2, Math.round(min * Math.pow(max / Math.max(1, min), 0.42)))
      /* Ogni quarto scontro è un boss: vale quasi il doppio, ma **mai più
         di quanto la truppa possa diventare**. Un nemico che non si può
         battere non è difficile, è rotto — e lo prenderebbe in faccia
         proprio chi ha scelto meglio di tutti.

         I due tetti non sono lo stesso numero, e il motivo si vede solo
         misurando: al massimo previsto non ci si arriva mai davvero,
         perché durante l'avvicinamento il mostro spara e la truppa si
         consuma. Un boss tarato sul 90% del massimo teorico arrivava
         addosso a chi aveva scelto tutto giusto ed era comunque sceso a
         quattro quinti — uno scontro perso in partenza, sempre. */
      const boss = ++this.scontri % 4 === 0
      const quanti = Math.max(2, Math.min(boss ? Math.round(base * 1.9) : base,
                                          Math.round(max * (boss ? 0.72 : 0.82))))
      this.cose.push({ tipo: 'nemici', z: this.prossima, quanti, vita: quanti, boss, fatto: false })
      this.prossima += r.fraCancelli * (boss ? 2 : 1.45)
      return
    }

    this.daScontro++
    const mezzo = Math.round((min + max) / 2)
    this.cose.push({
      tipo: 'cancelli', z: this.prossima, fatto: false,
      ops: generaCancelli(mezzo, { rnd: this.rnd, libri: r.libri, tetto: r.tetto }),
    })

    /* fra un cancello e l'altro le mani devono fare qualcosa: un cono da
       scansare e una cassa da prendere. Niente da leggere — è il riposo
       fra due conti, e serve tanto quanto i conti. */
    for (let i = 0; i < r.coni; i++)
      this.cose.push({ tipo: 'cono', z: this.prossima + this.fra(4, r.fraCancelli - 3),
                       corsia: this.fra(-1, 1), fatto: false })
    if (this.rnd() < 0.65)
      this.cose.push({ tipo: 'cassa', z: this.prossima + this.fra(5, r.fraCancelli - 3),
                       corsia: this.fra(-1, 1), quanti: Math.max(1, tondo(mezzo, 0.06)), fatto: false })

    this.prossima += r.fraCancelli
  }

  fra(a, b) { return a + Math.floor(this.rnd() * (b - a + 1)) }

  /* ═══════════ cosa succede quando ci passi sopra ═══════════ */
  attraversa(e) {
    const qui = Math.round(this.corsiaX)

    if (e.tipo === 'traguardo') return this.finisci('vinta')

    if (e.tipo === 'cancelli') {
      const op = e.ops[qui + 1]
      const prima = this.truppa
      this.cancelli++
      /* ── il conto della mira, e le due cose che protegge ──
         Si guarda **prima** di applicare, sul valore nominale.

         Chi prende il cancello d'oro ha sempre scelto bene, anche se poi
         l'esercizio va male: sbagliare una domanda non toglie una stella,
         o l'offerta torna a essere un pedaggio.

         Chi **non** lo prende viene confrontato con i due cancelli
         normali, non con l'oro: se no la stella della mira sarebbe
         irraggiungibile per chi tira dritto, e «non è mai obbligatorio»
         sarebbe una bugia scritta in un commento. */
      const dove = o => Math.min(this.regole.tetto, o.f(prima))
      const migliore = op.libro
        ? dove(op)
        : Math.max(...e.ops.filter(o => !o.libro).map(dove))
      if (dove(op) === migliore) this.meglio++

      /* il cancello col libro ferma tutto: si risponde da fermi */
      if (op.libro) {
        this.libriProvati++
        this.offerta = { seg: op.seg, f: op.f, prima }
        this.segnala('libro')
        return
      }
      this.applica(op.f(prima))
      this.segnala(this.truppa > prima ? 'meglio' : 'peggio')
      return
    }

    if (e.tipo === 'nemici') {
      /* Il conto è già stato fatto durante l'avvicinamento: la truppa ha
         sparato per tutto il tragitto. Qui si tira solo la riga. */
      if (e.vita <= 0) {
        this.vinti++
        this.segnala('abbattuto')
        return
      }
      const resta = Math.ceil(e.vita)
      const persi = Math.min(this.truppa, resta * PEDAGGIO)
      /* chi ti ha steso, con quanta vita gli era rimasta e quanto ti è
         costato: è la prima cosa che si vuole sapere davanti a una
         schermata di sconfitta */
      this.causa = `${e.boss ? 'un boss' : 'un mostro'} da ${e.quanti}: ` +
                   `era ancora in piedi con ${resta}, e te ne ha presi ${persi}`
      this.persi++
      this.truppa -= persi
      this.scossa = 20
      this.segnala('colpito')
      return
    }

    if (e.tipo === 'cassa') {
      if (e.corsia !== qui) return
      this.applica(this.truppa + e.quanti)
      this.segnala('cassa')
      return
    }

    if (e.tipo === 'cono') {
      if (e.corsia !== qui) return
      this.truppa = Math.max(0, this.truppa - 1)
      this.scossa = 14
      this.segnala('cono')
      if (this.truppa <= 0) this.causa = 'un cono, con un soldato solo rimasto'
    }
  }

  /* Il tetto della truppa. Senza, chi sceglie bene arriva a un milione in
     un minuto e mezzo e «×3» non è più una domanda di matematica, è una
     scritta. Quelli in più non spariscono: si contano a parte, e il
     cartello di fine li dice. */
  applica(n) {
    const tetto = this.regole.tetto
    const v = Math.max(0, Math.floor(n))
    if (v > tetto) { this.eccesso += v - tetto; this.truppa = tetto }
    else this.truppa = v
  }

  /* ═══════════ la sparatoria ═══════════
     La truppa spara da sola per tutto l'avvicinamento, e **il numero è la
     potenza di fuoco**: è questo che dà un senso ai soldati raccolti.
     Finché il mostro è in piedi spara anche lui — chi ci mette di più a
     stenderlo ne perde di più, ed è per questo che la truppa non cresce
     all'infinito. */
  sparatoria(metri) {
    if (metri <= 0) return
    const bersaglio = this.cose.find(e => e.tipo === 'nemici' && !e.fatto &&
                                          e.z - this.dist <= INGAGGIO && e.z - this.dist > 0)
    if (!bersaglio || bersaglio.vita <= 0) return

    /* Si spara e basta: durante l'avvicinamento **la truppa non cambia di
       un soldato**. Quello che si vede scendere è la barra del mostro, e
       il conto da fare è sempre lo stesso — il mio numero è più grosso
       del suo? */
    bersaglio.vita -= this.truppa * metri / INGAGGIO
    if (bersaglio.vita <= 0) {
      bersaglio.vita = 0
      this.segnala('caduto')
    }

    this.daColpo += metri
    if (this.daColpo > 0.55) {
      this.daColpo = 0
      this.colpi.push({ z: 0.5, corsia: this.corsiaX + (this.rnd() - 0.5) * 0.5,
                        meta: bersaglio.z - this.dist })
      this.segnala('sparo')
    }
  }

  /* ═══════════ il cancello d'oro ═══════════
     Si risponde da fermi. Chi ci prende moltiplica la truppa, chi sbaglia
     resta com'era: **sbagliare non toglie niente**, si è perso solo il
     tempo di provarci — ed è tutta la differenza fra un'offerta e un
     pedaggio. */
  rispondi(giusto) {
    const o = this.offerta
    if (!o) return null
    this.offerta = null
    if (giusto) {
      this.libriGiusti++
      this.applica(o.f(o.prima))
      this.segnala('meglio')
    } else {
      this.segnala('peggio')
    }
    return { giusto, prima: o.prima, dopo: this.truppa }
  }

  /* ═══════════ quello che si vede ═══════════
     Fatti già decisi, mai regole: chi disegna riceve «questo cancello è
     d'oro» e non sa cosa sia un esercizio; riceve i gradi dei soldati e
     non sa cosa sia il raggruppamento. */
  scena() {
    const cose = []
    for (const e of this.cose) {
      const z = e.z - this.dist
      if (z < -1.2 || z > ORIZZONTE) continue
      if (e.tipo === 'cancelli') {
        cose.push({ che: 'cancelli', z, passato: e.fatto, ops: e.ops.map(o => ({
          /* si consegna il conto e basta. Non si dice se è un cancello
             buono, perché **il buono è quello che il bambino deve
             ricavare**: dirlo qui vorrebbe dire risolvergli il gioco un
             fotogramma prima che ci provi. Il libro sì — quello non è la
             risposta, è il prezzo. */
          testo: o.seg, oro: !!o.libro,
        })) })
      } else if (e.tipo === 'nemici') {
        /* Un mostro abbattuto **sparisce**. Restava in scena, con la barra
           a zero, fino a che non gli si passava sopra: una carcassa in
           mezzo alla strada che sembra ancora un ostacolo, proprio nei
           secondi in cui bisogna guardare il cancello dopo. Lo scontro è
           già finito — il colpo che lo chiude si sente e si vede — e
           quello che resta da fare è correre. */
        if (e.vita <= 0) continue
        cose.push({ che: 'nemici', z, quanti: e.quanti, boss: e.boss,
                    quota: e.vita / e.quanti, resta: Math.ceil(e.vita) })
      } else if (e.tipo === 'traguardo') {
        cose.push({ che: 'traguardo', z })
      } else {
        cose.push({ che: e.tipo, z, corsia: e.corsia, quanti: e.quanti })
      }
    }
    /* Il cancello su cui si sta decidendo è **uno solo**: quello dopo si
       intravede appena, perché sei numeri in fila non sono una decisione
       più ricca, sono confusione.

       È il primo **non ancora attraversato**, non il più vicino: quello
       appena passato resta in scena un metro o due mentre sfila via, e
       finché ci restava teneva il proprio turno — così la scelta dopo
       compariva sbiadita proprio nell'istante in cui bisognava leggerla. */
    const attivo = cose.filter(c => c.che === 'cancelli' && !c.passato)
      .sort((a, b) => a.z - b.z)[0]
    if (attivo) attivo.attivo = true

    return {
      veste: this.regole.veste,
      dist: this.dist, corsia: this.corsiaX, scossa: this.scossa,
      /* quanto sta spingendo **davvero**: davanti a un cancello è zero
         anche col dito che martella, e chi disegna le righe di corsa deve
         far vedere quella, non l'intenzione */
      spinta: this.spintaOra - 1,
      truppa: this.truppa, soldati: figure(this.truppa),
      cose: cose.sort((a, b) => b.z - a.z),
      colpi: this.colpi.map(c => ({ z: c.z, corsia: c.corsia })),
    }
  }

  get cruscotto() {
    /* l'avviso parla solo di chi è ancora in piedi: annunciare «in arrivo
       un mostro da 40» quando quel mostro è già a terra è la stessa
       carcassa, detta a parole */
    const avanti = this.cose.filter(c => c.tipo === 'nemici' && !c.fatto && c.vita > 0)
      .sort((a, b) => a.z - b.z)[0]
    return {
      truppa: this.truppa,
      gruppi: scomponi(this.truppa),
      piena: this.truppa >= this.regole.tetto,
      metri: Math.floor(this.dist),
      restano: Math.max(0, Math.ceil(this.restano)),
      infinita: this.regole.infinita,
      quota: this.regole.infinita ? 0 : Math.min(1, this.dist / this.regole.metri),
      vinti: this.vinti,
      /* l'avviso arriva presto apposta: sapere che fra poco c'è un mostro
         da quaranta è quello che rende la scelta del cancello una
         decisione invece di un riflesso */
      mostro: avanti && avanti.z - this.dist < 44
        ? { quanti: avanti.quanti, boss: avanti.boss, fra: Math.ceil(avanti.z - this.dist) }
        : null,
    }
  }
}
