/* ═══════════════════════════════════════════════════════════════════
   UNA DISCESA — le regole, senza schermo

   Tiene tutto quello che succede da quando si mette piede al primo piano
   a quando si risale: dove sei, quanta vita hai, cosa hai nello zaino,
   chi ti sta venendo addosso, e **cosa il gioco sta chiedendo adesso**.
   Non disegna, non conosce Vue, non sa cosa sia una moneta del profilo:
   gira in Node, ed è per questo che il banco di prova può giocare
   seicento discese e contare le domande invece di indovinarle.

   ── IL PREZZO DI OGNI COSA È RISPONDERE ───────────────────────────
   La tentazione, in un gioco di esplorazione, è mettere l'esercizio
   *accanto* al gioco: cammina, e ogni tanto un quiz. Non funziona,
   perché quel quiz è un pedaggio che interrompe la cosa bella. Qui è il
   contrario: **l'esercizio è la chiave, la spada e il piede di porco**.
   Non c'è nessuna azione interessante che si compia senza rispondere, e
   nessuna risposta che non apra qualcosa che si vede.

     🚪 una porta chiusa   una domanda facile — sbagliando si riprova
     🎁 un forziere        una domanda sola, tosta: se sbagli resta chiuso
     👹 un mostro          una domanda per colpo, finché non cade — e
                           lui picchia comunque: un graffio se rispondi
                           bene, il colpo intero se sbagli
     ⛲ una fonte          una domanda, e ti ridà vita
     🏪 un mercante        niente domande: qui si spende quello che hanno fruttato

   ── CHI FA LA DOMANDA NON È QUESTO FILE ───────────────────────────
   Qui si dice soltanto **quanto dev'essere difficile** (`chiesta`), e
   chi la va a prendere è `Gioco.vue` dai moduli di `src/quiz/`. Il
   motore non nomina mai una materia e non sa nemmeno che esistano: alla
   fine gli torna un `rispondi(giusto)` e basta. È la stessa divisione
   del Dungeon a bivi, e serve a poter provare tutto il gioco in Node
   rispondendo a monetina.

   ── IL FOGLIO È UN DATO, NON UN PANNELLO ──────────────────────────
   `foglio` dice cosa c'è aperto (`{ che: 'scontro', chi }`) e chi
   disegna decide come si presenta. Finché è aperto **il tempo è fermo**:
   niente si muove, e nessun mostro arriva addosso mentre si sta
   leggendo una domanda.
   ═══════════════════════════════════════════════════════════════════ */
import {
  EROE, TASCHE, RAGGIO, RAGGIO_TORCIA, PASSO_EROE, PASSO_MOSTRO, PASSO_RIENTRO,
  CALMA, SORSO, RIPOSO_SCALA, VITA_PER_PIANO,
  ARREDO_DICE, ARREDO_LA_PRIMA_VOLTA,
} from '../dati/mondo.js'
import { MOSTRI } from '../dati/mostri.js'
import { eroeDi, DI_PARTENZA, portaLa, nonLaPorta } from '../dati/eroi.js'
import { COSE, CURE, NEI_FORZIERI, pescaMerce, pescaCosa } from '../dati/cose.js'
import { CURIOSITA_DI, MALUS } from '../dati/curiosita.js'
import { durezzaDi, guardianoDi, svenimentiDi, formaDi, crescitaDi } from '../dati/campagna.js'
import { generaPiano } from './livello.js'
import { percorso, viaVerso, primaLibera } from '../../../motore/passi.js'

/* Quanto rincara la domanda, per ogni cosa. Sono i numeri che fanno la
   differenza fra un bambino prudente e uno che va a caccia di scrigni:
   la porta costa meno del piano, il forziere molto di più, e il capo sta
   in mezzo perché la sua durezza vera sono le ossa, non la domanda. */
const RINCARO = { porta: -0.05, forziere: 0.25, fonte: 0, mostro: 0.05, capo: 0.2,
  /* una curiosità chiede una domanda normale: non è un tesoro da
     guadagnarsi, è una cosa che si tocca per vedere che succede */
  curiosita: 0 }

export class Corsa {
  constructor(tappa, { seme = null, rnd = Math.random, eroe = DI_PARTENZA } = {}) {
    this.tappa = tappa
    this.rnd = rnd
    this.seme = seme == null ? Math.floor(rnd() * 100000) : seme
    this.piano = 0

    /* Chi scende. La scheda dice vita, braccio e difesa di partenza, e
       tutto il resto del motore non sa che esistano quattro eroi: somma
       quello che trova qui. */
    this.chiEro = eroe
    this.io = eroeDi(eroe)
    this.vitaBase = this.io.vita
    this.vita = this.io.vita
    this.gemme = 0
    this.zaino = []
    this.mano = null
    /* la mano debole: ci sta una seconda arma leggera, o l'ombra di
       quella che si tiene con tutte e due le mani (vedi `mani` in
       `dati/cose.js`) */
    this.mancina = null
    this.corpo = null
    this.dito = null
    this.torcia = false

    this.foglio = null          // cosa è aperto adesso, o niente
    this.chiesta = null         // la domanda che serve: { id, che, difficolta }
    this.contaChieste = 0
    this.avvisi = []            // le righe da far comparire a schermo, in coda

    this.finita = false
    this.vinta = false
    this.svenimenti = 0
    /* ── e quante se ne sono spese **su questo piano** ──
       Serve solo all'abisso, dove il conto riparte scendendo: scendere è
       la cosa che si è guadagnata e rinnova le occasioni, accamparsi su
       un piano no. Nella campagna resta a zero e non lo guarda nessuno. */
    this.svenimentiQui = 0
    /* l'ultima occasione è stata usata: `riprendi()` allora risale
       invece di rimettere in piedi */
    this.ultimoSvenimento = false
    this.perche = null
    /* la regola del filo di luce si spiega una volta per discesa: vedi
       `diCheCosaC` */
    this.dettoDellArredo = false
    /* i conti che l'albo vuole a fine discesa: si tengono qui perché
       sono fatti della partita, non del profilo */
    this.domande = 0
    this.mostriBattuti = 0
    this.tesori = 0
    this.stanzeViste = 0
    this.pianiFatti = 0

    this.nuovoPiano()
  }

  /* ── com'è messo l'eroe ──
     L'unico posto dove si sommano: chi vuole sapere quanto picchia
     chiede qui, e non va a guardare dentro le tasche. */
  get att() { return this.io.att + this.addosso('att') }

  /* ── la mano debole colpisce la metà ──
     Due armi non fanno il doppio, o portarne due sarebbe l'unica cosa
     sensata da fare e le armi pesanti non se le prenderebbe più
     nessuno. Metà, arrotondata per eccesso: **due armi di secondo
     gradino valgono un terzo gradino**, che è il patto — le leggere si
     sdoppiano, le pesanti no, e le due strade si equivalgono. */
  get attaccoMancino() {
    const c = COSE[this.mancina]
    return c ? Math.ceil((c.att || 0) / 2) : 0
  }

  /* Quanto picchierebbero due mani messe così: serve a decidere dove
     conviene mettere un'arma trovata, e non tocca niente. */
  attaccoDelleMani(destra, sinistra) {
    const d = COSE[destra] ? (COSE[destra].att || 0) : 0
    const s = COSE[sinistra] ? Math.ceil((COSE[sinistra].att || 0) / 2) : 0
    return d + s
  }

  aDueMani(k) { return !!(COSE[k] && COSE[k].mani === 2) }
  get dif() { return this.io.dif + this.addosso('dif') }
  /* La vita massima **non è un campo**: cresce coi piani (`vitaBase`) e
     con quello che si porta al dito. Tenerla come numero voleva dire
     ricordarsi di alzarla e abbassarla ogni volta che l'amuleto entra o
     esce, cioè dimenticarsene una volta su due. */
  get vitaMax() { return this.vitaBase + this.addosso('vita') }
  get quantiPiani() { return this.tappa.piani }

  /* ── questa discesa ha un ultimo piano? ──
     L'abisso no, e le uniche tre righe che se ne accorgono sono
     `allaScala()`, `scendi()` e chi mostra «piano 3 di 4»: con
     `piani: Infinity` il confronto è già falso da sé, ma dirlo per nome
     serve a chi legge — e serve alle regole che cambiano quaggiù senza
     passare da un numero (lo zaino che si perde svenendo, il conto degli
     svenimenti che riparte). */
  get senzaFondo() { return !!this.tappa.abisso }

  /* Quante occasioni restano prima di risalire, e quante se ne sono
     spese: nella campagna il conto è di tutta la discesa, nell'abisso è
     di questo piano. Due getter e non due `if` sparsi, perché sono la
     stessa domanda fatta in tre posti (`svieni`, il cartello, il banco). */
  get svenimentiConcessi() { return svenimentiDi(this.tappa) }
  get svenimentiSpesi() { return this.senzaFondo ? this.svenimentiQui : this.svenimenti }

  /* Quanto danno, in tutto, le tre caselle addosso. Un posto solo: chi
     vuole sapere quanto picchia chiede qui, e non va a guardare dentro
     le tasche. */
  addosso(campo) {
    let n = 0
    for (const k of [this.mano, this.corpo, this.dito])
      if (k && COSE[k]) n += COSE[k][campo] || 0
    /* la seconda arma vale **piena** per tutto il resto — la luce di
       una lama che brucia illumina uguale in qualunque mano — e metà
       solo per il braccio */
    if (this.mancina && COSE[this.mancina])
      n += campo === 'att' ? this.attaccoMancino : (COSE[this.mancina][campo] || 0)
    return n
  }

  /* ── quello che questa classe può mettersi addosso ──
     Il motore non nomina nessun eroe e non conosce nessuna famiglia:
     chiede al dato (`porta` in `dati/eroi.js`, `famiglia` in
     `dati/cose.js`) e basta. Le due righe stanno qui perché **è il
     motore l'unico che sa chi sta scendendo**, e chi disegna non deve
     mettersi a confrontare due elenchi per sapere se un tasto va acceso.

     Il limite è sull'indossare e mai sul prendere: `posso` non compare
     in `trovata` per rifiutare la raccolta, ma solo per non vestire da
     sé una cosa che poi non si toglierebbe più. */
  posso(k) { return portaLa(this.io, COSE[k]) }
  perchéNo(k) { return nonLaPorta(this.io, COSE[k]) }

  /* ── quello che si aveva addosso e adesso non si porta più ──
     Serve a una cosa sola, ed è il rientro: un salvataggio di ieri può
     avere in pugno un'ascia scritta quando le asce le impugnavano tutti.
     Non si butta e non resta addosso di nascosto — va in tasca, o per
     terra se le tasche sono piene, che è la stessa regola dello
     sfratto in `sistemaLeMani`. Detto, perché una spada che cambia posto
     da sola senza una riga si legge come un salvataggio andato storto. */
  sistemaIlCorredo() {
    for (const dove of ['mano', 'mancina', 'corpo', 'dito']) {
      const k = this.casella(dove)
      if (!k || this.posso(k)) continue
      this.metti(dove, null)
      if (this.zaino.length < TASCHE) this.zaino.push(k)
      else this.posaRoba({ che: 'cosa', cosa: k, em: COSE[k].em },
                         { x: Math.floor(this.eroe.x), y: Math.floor(this.eroe.y) })
      this.dillo(`${COSE[k].em} ${COSE[k].nome}: ${this.perchéNo(k).toLowerCase()}`)
    }
    /* la vita segue il tetto: togliendo un amuleto o un saio il massimo
       scende, e restare sopra il proprio massimo è uno stato che nessuna
       altra riga del motore sa produrre */
    this.vita = Math.min(this.vita, this.vitaMax)
  }

  /* Dov'è la casella di una cosa, e cosa c'è dentro adesso. */
  casella(dove) {
    if (dove === 'mano') return this.mano
    if (dove === 'mancina') return this.mancina
    if (dove === 'corpo') return this.corpo
    return this.dito
  }

  metti(dove, k) {
    if (dove === 'mano') this.mano = k
    else if (dove === 'mancina') this.mancina = k
    else if (dove === 'corpo') this.corpo = k
    else this.dito = k
  }

  /* ── la mano debole è libera davvero ──
     Vuota, e non impegnata dall'arma che sta nell'altra. È la stessa
     domanda in tre posti — quello che si trova per terra, quello che si
     compra, quello che il banco di prova si mette addosso — e finché
     era scritta tre volte bastava ritoccarne due per averne una che
     diceva un'altra cosa. */
  mancinaLibera() { return !this.mancina && !this.aDueMani(this.mano) }

  /* ── le due mani devono stare d'accordo ──
     Un'arma a due mani sfratta quello che c'era nella sinistra, e
     quella che se ne va **non si perde**: torna in tasca, o per terra
     se le tasche sono piene. È la stessa regola dello scambio in mano,
     e per lo stesso motivo — una spada che sparisce perché ne hai
     raccolta un'altra è la cosa che fa arrabbiare di più.

     C'era una riga che sfrattava anche **a pugno vuoto** (`!this.mano`),
     e voleva dire un'altra cosa: che un'arma finita nella mano debole
     con la destra libera sta nel posto sbagliato, perché di là colpisce
     la metà. Scritta così però diceva pure «niente in pugno sfratta lo
     scudo», ed è il guasto che si vedeva giocando — il tasto dello
     zaino diceva «me lo imbraccio», il motore lo rispediva in tasca
     nello stesso istante, e a mani nude uno scudo non si imbracciava
     mai. Adesso i due casi sono due: un'arma **passa in pugno**, uno
     scudo **resta dov'è**. */
  sistemaLeMani() {
    if (!this.mancina) return
    /* l'arma rimasta di là col pugno vuoto ci passa: niente da sfrattare
       e niente da dire, è la stessa arma che cambia mano */
    if (!this.mano && COSE[this.mancina] && COSE[this.mancina].dove === 'mano') {
      this.mano = this.mancina
      this.mancina = null
      return
    }
    if (this.aDueMani(this.mano) || this.aDueMani(this.mancina)) {
      const sfrattata = this.mancina
      this.mancina = null
      if (this.zaino.length < TASCHE) this.zaino.push(sfrattata)
      else this.posaRoba({ che: 'cosa', cosa: sfrattata, em: COSE[sfrattata].em },
                         { x: Math.floor(this.eroe.x), y: Math.floor(this.eroe.y) })
      this.dillo(`${COSE[sfrattata].em} ${COSE[sfrattata].nome}: serve l'altra mano`)
    }
  }

  /* ── dove conviene metterla, e quanto si guadagna ──
     Un'arma può andare in due posti, e non è sempre il pugno: con la
     spada già in mano, una seconda spada leggera vale di più nella
     sinistra che al posto di quella che c'è. Si provano le sistemazioni
     possibili e si tiene la migliore — che è quello che farebbe
     chiunque, ma a mente e sbagliando. */
  postoDellArma(k) {
    const c = COSE[k]
    const ora = this.attaccoDelleMani(this.mano, this.mancina)
    const scelte = [{
      dove: 'mano',
      /* mettendola in pugno la sinistra sopravvive solo se nessuna
         delle due chiede tutte e due le mani */
      att: this.attaccoDelleMani(k, this.aDueMani(k) ? null : this.mancina),
    }]
    /* ── la mano debole si riempie da sola solo se è vuota ──
       Là dentro possono andare due cose che fanno mestieri diversi — una
       seconda arma o uno scudo — e fra «più braccio» e «più pelle» non
       esiste un più forte: è la stessa ragione per cui i gioielli non si
       cambiano da soli. Senza questa riga i due si scambiavano di posto
       a ogni tocco, all'infinito: la spada scalzava lo scudo, lo scudo
       finiva per terra, toccarlo lo rimetteva scalzando la spada. Il
       banco di prova ci ha girato dentro seimila volte; un bambino ci
       avrebbe girato finché non si stancava. */
    if (!this.aDueMani(k) && this.mano && !this.aDueMani(this.mano) && !this.mancina)
      scelte.push({ dove: 'mancina', att: this.attaccoDelleMani(this.mano, k) })
    const meglio = scelte.sort((a, b) => b.att - a.att)[0]
    return { dove: meglio.dove, delta: meglio.att - ora }
  }

  colpo(m) { return Math.max(1, this.att - m.dif) }
  colpiPer(m) { return Math.max(1, Math.ceil(m.ossa / this.colpo(m))) }
  danno(m) { return Math.max(1, m.att - this.dif) }

  /* ── quello che passa comunque ──
     Un mostro **picchia sempre**: rispondendo bene si para il colpo e ne
     resta un graffio, sbagliando arriva tutto. Prima chi rispondeva bene
     usciva da una battaglia senza un livido, e allora le pozioni non
     servivano a niente: si accumulavano in fondo allo zaino, e con loro
     spariva il motivo di cercare una fonte, di comprare dal mercante, di
     scegliere se scappare.

     Il graffio è metà del colpo pieno, quindi **il conto vero è la
     lunghezza della battaglia**: chi ha l'arma buona fa fuori il gigante
     in quattro risposte e ne esce con otto graffi, chi va a mani nude ne
     prende il doppio. È lo stesso motivo per cui si va a cercare una
     spada, detto in vita invece che in domande. */
  graffio(m) { return Math.max(1, Math.floor(this.danno(m) / 2)) }

  /* La difficoltà della domanda: la porta il piano, e ogni cosa ha il
     suo rincaro. Un posto solo, come vuole la campagna. */
  durezza(rincaro = 0) {
    return Math.max(0, Math.min(1, durezzaDi(this.tappa, this.piano) + rincaro))
  }

  dillo(testo) { this.avvisi.push(testo) }

  /* L'avviso di una cosa trovata, presa o comprata dice **quale cosa**,
     non come si scrive: a schermo ci va la sua faccia vera — lo sprite
     del foglio — e l'emoji resta il ripiego di chi uno sprite non ce
     l'ha. Scrivendo `${c.em} ${c.nome}` dentro la stringa, la stessa
     boccetta finiva disegnata a mano per terra e in emoji nella riga
     che diceva di averla presa. */
  dilloDi(k, coda = '') {
    const c = COSE[k]
    if (!c) return
    this.avvisi.push({ cosa: k, testo: c.nome + coda })
  }

  /* ═══════════ il piano ═══════════ */
  nuovoPiano() {
    const t = this.tappa
    /* La forma la chiede alla tappa **per questo piano**: nella campagna
       è sempre la stessa, nell'abisso gira fra tre. Il piano è comunque
       una funzione del seme, quindi rientrando si ritrova identico. */
    const forma = formaDi(t, this.piano)
    this.livello = generaPiano({
      seme: this.seme + this.piano * 7919, piano: this.piano,
      largo: forma.misura, alto: forma.misura, giri: forma.giri,
      guardiano: guardianoDi(t, this.piano),
      crescita: crescitaDi(t),
    })
    const dentro = this.livello.stanze[0]
    this.eroe = { x: dentro.cx + 0.5, y: dentro.cy + 0.5 }
    this.guarda = 'dx'
    this.strada = null
    this.mira = null
    this.bersaglio = null
    /* la misura si prende dal piano generato e non dalla tappa: da
       quando l'abisso cambia forma scendendo, le due potevano divergere
       — e una mappa vista lunga la metà non dà nessun errore, spegne la
       luce su mezzo piano */
    this.visto = new Uint8Array(this.livello.largo * this.livello.alto)
    this.luce = new Set()
    this.chiaveDelPiano = false
    this.stanzeDentro = new Set()
    this.aggiornaLuce()
  }

  /* ── le tre luci ──
     Dentro una stanza si accende la stanza intera: si è entrati, la si è
     vista. In corridoio si vede un pezzo attorno, ed è il motivo per cui
     i corridoi mettono addosso una fretta che le stanze non hanno. */
  aggiornaLuce() {
    const L = this.livello.largo, A = this.livello.alto
    const cx = Math.floor(this.eroe.x), cy = Math.floor(this.eroe.y)
    this.luce = new Set()
    const accendi = (x, y) => {
      if (x < 0 || y < 0 || x >= L || y >= A) return
      this.luce.add(y * L + x)
      this.visto[y * L + x] = 1
    }
    const raggio = (this.torcia ? RAGGIO_TORCIA : RAGGIO) + this.addosso('luce')
    const r = Math.ceil(raggio) + 1
    for (let x = cx - r; x <= cx + r; x++) for (let y = cy - r; y <= cy + r; y++)
      if (Math.hypot(x - cx, y - cy) <= raggio) accendi(x, y)

    const st = this.livello.stanzaDi(cx, cy)
    if (st && cx >= st.x - 1 && cy >= st.y - 1 && cx <= st.x + st.w && cy <= st.y + st.h) {
      for (let x = st.x - 1; x <= st.x + st.w; x++)
        for (let y = st.y - 1; y <= st.y + st.h; y++) accendi(x, y)
      if (!this.stanzeDentro.has(st.id)) { this.stanzeDentro.add(st.id); this.stanzeViste++ }
    }
  }

  luceDi(x, y) {
    const k = y * this.livello.largo + x
    return this.luce.has(k) ? 2 : this.visto[k] ? 1 : 0
  }

  /* Una cella bloccata non si attraversa camminando: ci si gira intorno,
     o si paga quello che chiede. Un mostro che **dorme** è un ostacolo da
     aggirare, ed è il senso di tutto: si sceglie chi pagare. Uno sveglio
     no — si sta muovendo, e un percorso calcolato su dov'era un secondo
     fa manderebbe l'eroe a sbattere in un posto vuoto. */
  bloccata(x, y) {
    return this.livello.robe.some(r => r.x === x && r.y === y && !r.morto && !r.presa &&
      ((r.che === 'mostro' && !r.sveglio) || (r.che === 'porta' && !r.aperta)))
  }

  /* dove si può mettere il piede, per chi cerca una strada */
  buona() {
    return (x, y) => this.livello.calpestabile(x, y) && !this.bloccata(x, y)
  }

  /* ═══════════ dove si vuole andare ═══════════
     Il dito di un bambino non centra la cella: si guarda **prima
     esattamente dove è caduto**, e solo se lì non c'è niente si allarga
     di poco. Guardando subito nel raggio, un mostro che passa di lì si
     prende il tocco destinato alla scala che gli sta accanto — e chi
     tocca si vede aprire una cosa che non aveva puntato, che è il modo
     più rapido di far sembrare il gioco impreciso.

     ── UN FORZIERE VUOTO È SCENOGRAFIA ─────────────────────────────
     Finché restava toccabile succedeva questo: il tocco sulla sua cella
     prendeva **lui** invece della roba che ci stava sopra, e siccome a
     un forziere ci si ferma *accanto* e non sopra, quella roba non si
     raccoglieva mai. Un baule già aperto non ha più niente da dire: si
     spegne, e da lì in poi è pavimento dipinto.

     ── E LA ROBA PER TERRA SÌ ───────────────────────────────────────
     Prima le cose si prendevano soltanto calpestandole, quindi una
     spada dietro una cassa era una spada persa e un tocco su di lei non
     faceva niente — che a schermo si legge come un gioco rotto. */
  toccabile(r) {
    if (r.presa || r.morto) return false
    if (!this.luce.has(r.y * this.livello.largo + r.x)) return false
    if (r.che === 'porta') return !r.aperta
    if (r.che === 'forziere') return !r.aperto
    /* una curiosità si tocca una volta sola: dopo è una cosa già vista,
       e resta lì come arredo */
    if (r.che === 'curiosita') return !r.visto
    return ['mostro', 'mercante', 'fonte', 'scala', 'cosa', 'gemme'].includes(r.che)
  }

  /* Le gemme si prendono camminandoci sopra, quindi non c'è mai bisogno
     di *mirarle*: restano toccabili per chi ci cade sopra col dito, ma
     non rubano il tocco a un forziere che gli sta a fianco. */
  cosaC(c, largo = 1.2) {
    const dritto = this.livello.robe.find(r => r.x === c.x && r.y === c.y && this.toccabile(r))
    if (dritto) return dritto
    let vicina = null, quanto = 9
    for (const r of this.livello.robe) {
      if (r.che === 'gemme' || !this.toccabile(r)) continue
      const d = Math.hypot(r.x - c.x, r.y - c.y)
      if (d <= largo && d < quanto) { quanto = d; vicina = r }
    }
    return vicina
  }

  /* La riga di una cosa che non risponde: la prima volta spiega la
     regola del filo di luce, dopo dice cos'è e basta. Una volta per
     discesa la spiegazione, perché ripetuta a ogni barile diventa
     rumore. */
  diCheCosaC(c) {
    const a = this.livello.robe.find(r => r.che === 'arredo' && r.x === c.x && r.y === c.y)
    if (!a) return
    if (!this.dettoDellArredo) {
      this.dettoDellArredo = true
      this.dillo(ARREDO_LA_PRIMA_VOLTA)
      return
    }
    this.dillo(ARREDO_DICE[a.pezzo] || 'Non c\'è niente da fare, qui.')
  }

  /* Su cosa ci si sale, e a cosa ci si ferma accanto. Le cose per terra
     stanno fra le prime: raccoglierle vuol dire arrivarci sopra. */
  sopra(che) { return ['scala', 'mercante', 'fonte', 'cosa', 'gemme'].includes(che) }

  /* `preciso` distingue il tocco dal trascinamento: tenendo premuto e
     muovendo il dito l'eroe insegue, e non deve aprire pannelli per ogni
     cosa che sfiora. */
  vaiVerso(c, preciso = true) {
    if (this.foglio || this.finita) return
    const mira = preciso ? this.cosaC(c) : null
    /* ── un tocco su una cassa non resta muto ──
       Non la rende toccabile — l'arredo non è un bersaglio e non deve
       rubare il tocco a un forziere che gli sta accanto (vedi `cosaC`):
       si guarda **solo la cella premuta**, e solo quando lì non c'è
       niente da mirare. Poi si cammina come sempre. */
    if (preciso && !mira) this.diCheCosaC(c)
    const da = { x: Math.floor(this.eroe.x), y: Math.floor(this.eroe.y) }
    const buona = this.buona()
    /* Su una scala, da un mercante o a una fonte ci si sale sopra; a un
       mostro o a un forziere ci si ferma accanto — e accanto vuol dire
       **da un lato a cui si arriva**, non dal più vicino in linea
       d'aria: un mostro fermo in un corridoio ha due fianchi, e quello
       che mi guarda può essere proprio quello di là dal suo corpo.
       `viaVerso` prova i lati in ordine di comodità e torna il primo che
       ha una strada, insieme alla strada. */
    const via = mira
      ? viaVerso(buona, mira, da, { sopra: this.sopra(mira.che) })
      : (buona(c.x, c.y) ? { dove: c, strada: percorso(buona, da, c) } : null)

    /* un tocco che non porta da nessuna parte spegne il segno di dove si
       stava andando: lasciarlo acceso è un cerchietto che pulsa su un
       posto dove non si sta andando più */
    if (!via) { this.bersaglio = null; return }
    if (!via.strada) { this.bersaglio = null; this.dillo('di là non si passa'); return }
    if (!via.strada.length) {
      this.strada = null
      this.bersaglio = null
      if (mira) this.interagisci(mira)
      return
    }
    this.strada = via.strada
    this.mira = mira
    this.bersaglio = mira ? { x: mira.x, y: mira.y } : via.dove
  }

  /* ═══════════ il tempo che passa ═══════════
     Un passo di `dt` secondi. Col foglio aperto non si muove niente: si
     sta leggendo, e un mostro che arriva addosso mentre si legge è un
     colpo che nessuno ha visto arrivare. */
  passo(dt) {
    if (this.foglio || this.finita) return
    this.muoviMostri(Math.min(0.05, dt))
    if (this.foglio) return                 // un mostro ci ha raggiunti
    this.muoviEroe(Math.min(0.05, dt))
  }

  /* ── i mostri, e la stanza come confine ──
     Un mostro dorme finché non entri **nella sua stanza**: da lì ti viene
     addosso, e smette appena esci. Non è una gentilezza, è la regola che
     rende la stanza una stanza. Il corridoio diventa il posto dove si è
     al sicuro, la soglia diventa una decisione, e «scappo via» vuol dire
     davvero uscire di lì invece di premere un tasto e restare dov'eri. */
  muoviMostri(dt) {
    const cella = { x: Math.floor(this.eroe.x), y: Math.floor(this.eroe.y) }
    const mia = this.livello.stanzaDi(cella.x, cella.y)
    for (const m of this.livello.robe) {
      if (m.che !== 'mostro' || m.morto) continue
      if (m.fx == null) { m.fx = m.x + 0.5; m.fy = m.y + 0.5; m.casa = { x: m.x, y: m.y }; m.calmo = 0 }
      if (m.calmo > 0) m.calmo -= dt
      const sua = this.livello.stanzaDi(m.casa.x, m.casa.y)
      const sveglio = !!(mia && sua && mia === sua && m.calmo <= 0)
      m.sveglio = sveglio

      const meta = sveglio ? this.eroe : { x: m.casa.x + 0.5, y: m.casa.y + 0.5 }
      const dx = meta.x - m.fx, dy = meta.y - m.fy
      const d = Math.hypot(dx, dy)

      if (sveglio && d < 0.75) {                 // ti ha preso
        this.strada = null; this.mira = null; this.bersaglio = null
        this.scontro(m)
        return
      }
      if (d < 0.05) continue
      const v = (sveglio ? PASSO_MOSTRO : PASSO_RIENTRO) * dt
      let nx = m.fx + dx / d * Math.min(v, d), ny = m.fy + dy / d * Math.min(v, d)
      /* non esce mai dalla sua stanza: è tutto il patto. Il muro lo ferma
         sull'asse che lo porterebbe fuori e lascia libero l'altro, così
         ti insegue lungo la parete invece di incastrarsi in un angolo e
         sembrare rotto. */
      if (sua) {
        if (nx < sua.x || nx > sua.x + sua.w) nx = m.fx
        if (ny < sua.y || ny > sua.y + sua.h) ny = m.fy
      }
      if (Math.abs(dx) > 0.05) m.guarda = dx < 0 ? 'sx' : 'dx'
      if (this.livello.calpestabile(Math.floor(nx), Math.floor(m.fy))) m.fx = nx
      if (this.livello.calpestabile(Math.floor(m.fx), Math.floor(ny))) m.fy = ny
      m.x = Math.floor(m.fx); m.y = Math.floor(m.fy)
    }
  }

  muoviEroe(dt) {
    if (!this.strada || !this.strada.length) {
      if (this.mira) { const m = this.mira; this.mira = null; this.interagisci(m) }
      return
    }
    const meta = this.strada[0]
    const mx = meta.x + 0.5, my = meta.y + 0.5
    const dx = mx - this.eroe.x, dy = my - this.eroe.y
    const d = Math.hypot(dx, dy)
    const v = PASSO_EROE * dt
    if (d <= v) {
      this.eroe.x = mx; this.eroe.y = my
      this.strada.shift()
      this.aggiornaLuce()
      this.raccogli()
      if (!this.strada.length) {
        this.strada = null
        this.bersaglio = null
        if (this.mira) { const m = this.mira; this.mira = null; this.interagisci(m) }
      }
    } else {
      if (Math.abs(dx) > 0.05) this.guarda = dx < 0 ? 'sx' : 'dx'
      this.eroe.x += dx / d * v
      this.eroe.y += dy / d * v
    }
  }

  /* ── quello che si prende senza pensarci ──
     Le gemme, e soltanto loro: sono il conto in tasca, non una scelta —
     nessuno ha mai lasciato per terra una moneta perché lo zaino era
     pieno. Tutto il resto **si tocca**: una spada che entra nello zaino
     mentre passavo di lì è una spada che non ho scelto, e il senso di
     sei tasche è che ogni cosa dentro ci sia entrata per volontà di
     qualcuno. */
  raccogli() {
    const cx = Math.floor(this.eroe.x), cy = Math.floor(this.eroe.y)
    for (const r of this.livello.robe) {
      if (r.presa || r.morto || r.che !== 'gemme' || r.x !== cx || r.y !== cy) continue
      const quante = Math.round(r.quante * (1 + this.addosso('gemme')))
      this.gemme += quante
      r.presa = true
      this.dillo(`💎 +${quante}`)
    }
  }

  /* ── una cosa per terra, toccata ──
     Quello che si beve o si accende va in tasca e via: nessuna domanda,
     perché non c'è niente da decidere.

     ── E QUELLO CHE È MEGLIO SE LO METTE DA SÉ ─────────────────────
     Prima si apriva un foglio col confronto («⚔️ +2 rispetto alla spada
     corta»), e la ragione era buona: è il solo numero che dice quanto
     vale un'arma, e un bambino l'arma la sceglie dal disegno. Solo che
     quel foglio chiedeva **una decisione che non è una decisione** —
     davanti a un'arma migliore di quella che si ha in pugno non esiste
     un secondo tasto sensato — e la chiedeva nel momento peggiore, cioè
     mentre si gira per una stanza. Tre tocchi per un sì scontato.

     Adesso quello che è meglio va addosso da solo, e il numero si legge
     **dopo**, nella riga che compare («Spada ⚔️ +2»): la stessa
     informazione, senza la finta scelta in mezzo. Quello che è peggio o
     uguale finisce in tasca, e lì lo si confronta con calma nello
     zaino, che è il posto dove si sceglie davvero. Una casella vuota
     conta come «meglio»: a mani nude qualunque spada è un guadagno.

     I gioielli restano fuori dall'automatismo quando il dito è già
     occupato: fra due anelli non c'è un «più forte», c'è un modo di
     giocare diverso — vedere lontano, tornare su con più gemme — e
     quella è una scelta vera. */
  trovata(r) {
    const c = COSE[r.cosa]
    if (!c) return
    /* la torcia non va in tasca: si accende, e basta averla */
    if (c.usa === 'luce') {
      if (!this.accendi(r.cosa)) { this.dillo('🔦 ne hai già una accesa'); return }
      r.presa = true
      return
    }
    /* Quello che la classe non porta si raccoglie **come tutto il
       resto** — vale gemme al banco — solo che non si veste da sé: la
       riga che dice perché la si legge nello zaino, dove si è andati a
       guardarla. Dirlo qui, in mezzo a una stanza, vorrebbe dire un
       cartello a ogni cosa che si tocca. */
    if (c.dove && this.posso(r.cosa)) {
      /* uno scudo con un'arma a due mani in pugno non si mette da solo:
         `sistemaLeMani` glielo toglierebbe subito, e a schermo si
         vedrebbe una cosa presa e persa nello stesso istante */
      /* uno scudo si imbraccia da sé solo a mano libera, per la stessa
         ragione: con un'arma leggera già lì, quale delle due valga di
         più lo decide chi gioca, dallo zaino */
      const stretto = c.dove === 'mancina' && !this.mancinaLibera()
      const conf = this.confronto(r.cosa)
      if (!stretto && (!conf.addosso || conf.delta > 0)) return this.vesti(r, conf)
    }
    if (this.zaino.length >= TASCHE) { this.dillo('🎒 lo zaino è pieno'); return }
    this.zaino.push(r.cosa)
    r.presa = true
    /* Raccolta lo stesso, e la riga dice perché non è finita in pugno.
       Si dice **qui**, nel momento in cui la si prende, e non solo
       aprendo lo zaino: chi trova un'ascia e la vede sparire in una
       tasca senza una parola crede che il gioco l'abbia ignorata, e la
       ritocca. */
    const perché = this.perchéNo(r.cosa)
    this.dilloDi(r.cosa, perché ? ` · ${perché.charAt(0).toLowerCase()}${perché.slice(1)}` : '')
  }

  /* Accendere è una cosa sola: o è accesa o non lo è, e una seconda
     torcia non fa più luce della prima. Torna `false` se era già
     accesa, così chi chiama sa che non è successo niente. */
  accendi(k) {
    if (this.torcia) return false
    this.torcia = true
    this.aggiornaLuce()
    this.dilloDi(k, ' 🔦 si vede più lontano')
    return true
  }

  /* Se lo mette, e quello che aveva **non si perde**: va nello zaino, o
     per terra se le tasche sono piene. Una spada lasciata cadere per
     prenderne un'altra è la cosa che fa arrabbiare di più, e succede
     proprio quando lo zaino è pieno — cioè sempre quando conta. */
  vesti(r, conf) {
    const dove = conf.dove
    const vecchio = this.casella(dove)
    this.metti(dove, r.cosa)
    r.presa = true
    if (vecchio) {
      if (this.zaino.length < TASCHE) this.zaino.push(vecchio)
      else this.livello.robe.push({ che: 'cosa', cosa: vecchio, x: r.x, y: r.y,
                                    em: COSE[vecchio].em })
    }
    this.sistemaLeMani()
    const segno = conf.campo === 'att' ? '⚔️' : conf.campo === 'dif' ? '🛡️' : ''
    this.dilloDi(r.cosa, conf.delta > 0 && segno ? ` ${segno} +${conf.delta}` : '')
    return { che: 'addosso', cosa: r.cosa }
  }

  /* Quanto vale una cosa **rispetto a quella che si ha già addosso**: il
     motore lo sa perché è l'unico che sa cosa c'è in mano, e chi disegna
     non deve sommare niente. */
  confronto(k) {
    const c = COSE[k]
    if (!c || !c.dove) return null
    /* le armi hanno due caselle, e il confronto è con **il totale delle
       mani**: con la spada in pugno una seconda spada leggera non è
       «uguale a quella che hai», è un braccio in più */
    if (c.dove === 'mano') {
      const posto = this.postoDellArma(k)
      return { dove: posto.dove, campo: 'att', addosso: this.casella(posto.dove), delta: posto.delta }
    }
    /* nella mano debole ci va uno scudo, e quello che cambia è la
       pelle: stesso campo dell'armatura */
    const campo = c.dove === 'corpo' || c.dove === 'mancina' ? 'dif' : 'dono'
    const addosso = this.casella(c.dove)
    /* la guardia non è pignoleria: un salvataggio scritto quando le cose
       si chiamavano in un altro modo arriva qui con una chiave che non
       esiste più, e senza il `?.` il gioco si spegne su una schermata
       nera invece di ignorare un oggetto */
    const mio = addosso ? (COSE[addosso]?.[campo] || 0) : 0
    return { dove: c.dove, campo, addosso, delta: (c[campo] || 0) - mio }
  }

  /* ═══════════ toccare una cosa ═══════════ */
  interagisci(r) {
    if (r.morto || r.presa || this.finita) return
    if (r.che === 'mostro') return this.scontro(r)
    if (r.che === 'porta') return this.apri('porta', r, RINCARO.porta)
    /* un forziere già aperto non arriva nemmeno qui: `toccabile` lo ha
       spento, e chi ci cammina sopra ci passa e basta */
    if (r.che === 'forziere') return r.aperto ? undefined : this.apri('forziere', r, RINCARO.forziere)
    if (r.che === 'fonte') return this.apri('fonte', r, RINCARO.fonte)
    if (r.che === 'mercante') return this.mercante(r)
    if (r.che === 'scala') return this.allaScala()
    if (r.che === 'cosa') return this.trovata(r)
    if (r.che === 'gemme') return this.raccogli()
    if (r.che === 'curiosita') return r.visto ? undefined : this.apri('curiosita', r, RINCARO.curiosita)
  }

  /* ── dove si posa quello che salta fuori ──
     Mai **sopra** quello che l'ha lasciato: una spada in cima al baule
     che l'ha data era invisibile (la disegnava il baule) e irraggiungibile
     (al baule ci si ferma accanto). Si cerca la prima cella libera
     davvero — calpestabile e senza niente sopra — e se non ce n'è nessuna
     nel raggio si posa dov'era, che è comunque meglio che perderla. */
  libera(x, y) {
    return this.livello.calpestabile(x, y) && !this.livello.robeSu(x, y).length
  }

  posaRoba(roba, vicino) {
    const dove = primaLibera((x, y) => this.libera(x, y), vicino, 3) || vicino
    this.livello.robe.push({ ...roba, x: dove.x, y: dove.y })
    return dove
  }

  /* Apre un foglio che chiede una domanda. La domanda vera la va a
     prendere chi ci sta sopra: qui si dice solo quanto pesa. */
  apri(che, chi, rincaro) {
    this.foglio = { che, chi }
    this.chiedi(che, rincaro)
  }

  chiedi(che, rincaro) {
    this.chiesta = { id: ++this.contaChieste, che, difficolta: this.durezza(rincaro) }
  }

  scontro(m) {
    this.foglio = { che: 'scontro', chi: m }
    this.chiedi('scontro', MOSTRI[m.tipo].capo ? RINCARO.capo : RINCARO.mostro)
  }

  /* ═══════════ la risposta ═══════════
     L'unico ingresso dall'esterno quando un foglio chiede qualcosa.
     Torna cosa è successo, perché chi disegna faccia il suono giusto e
     la scossa giusta: `{ che: 'colpo' | 'caduto' | 'ferito' | 'svenuto' |
     'aperta' | 'chiusa' | 'tesoro' | 'niente' | 'bevuto' }`. */
  rispondi(giusto) {
    const f = this.foglio
    if (!f) return null
    this.domande++

    if (f.che === 'scontro') return this.rispostaScontro(f.chi, giusto)
    if (f.che === 'porta') return this.rispostaPorta(f.chi, giusto)
    if (f.che === 'forziere') return this.rispostaForziere(f.chi, giusto)
    if (f.che === 'fonte') return this.rispostaFonte(f.chi, giusto)
    if (f.che === 'curiosita') return this.rispostaCuriosita(f, giusto)
    return null
  }

  /* Ogni esito di uno scontro dice **lo scambio per intero**: quanto hai
     tolto e quanto hai preso. Serve a schermo, e serve perché un
     bambino che risponde bene e vede la propria vita calare senza un
     numero accanto conclude di aver sbagliato — che è esattamente
     quello che succedeva, aiutato da un suono di botta uguale a quello
     dell'errore. Il graffio non è una punizione nascosta: è il prezzo
     di una battaglia lunga, e va detto in faccia. */
  rispostaScontro(m, giusto) {
    if (!giusto) {
      const male = this.danno(m)
      this.ferisci(male)
      if (this.vita <= 0) { this.svieni(); return { che: 'svenuto', dato: 0, preso: male } }
      this.chiedi('scontro', MOSTRI[m.tipo].capo ? RINCARO.capo : RINCARO.mostro)
      return { che: 'ferito', quanto: male, dato: 0, preso: male }
    }
    const dato = this.colpo(m)
    m.ossa -= dato
    if (m.ossa > 0) {
      /* il mostro è ancora in piedi, quindi restituisce: chi è caduto no */
      const male = this.graffio(m)
      this.ferisci(male)
      if (this.vita <= 0) { this.svieni(); return { che: 'svenuto', dato, preso: male } }
      this.chiedi('scontro', MOSTRI[m.tipo].capo ? RINCARO.capo : RINCARO.mostro)
      return { che: 'colpo', restano: this.colpiPer(m), male, dato, preso: male }
    }
    this.cade(m)
    this.chiudi()
    return { che: 'caduto', chi: m, dato, preso: 0 }
  }

  /* ── una curiosità, aperta ──
     L'esito **non chiude il foglio**: ci resta dentro, perché la frase
     è il premio vero e una battuta che compare mezzo secondo in mezzo
     al campo non la legge nessuno. Si chiude col tasto, dopo averla
     letta.

     Quello che va bene porta un premio; quello che va male, metà delle
     volte, non porta niente — hai starnutito, e basta. */
  rispostaCuriosita(f, giusto) {
    const r = f.chi
    const c = CURIOSITA_DI[r.tipo]
    if (!c) { this.chiudi(); return null }
    r.visto = true
    this.chiesta = null
    if (giusto) {
      const b = c.bene[Math.floor(this.rnd() * c.bene.length)]
      const p = b.premio || {}
      if (p.gemme) this.gemme += p.gemme
      if (p.cura) this.vita = Math.min(this.vitaMax, this.vita + p.cura)
      if (p.vitaPiu) { this.vitaBase += p.vitaPiu; this.vita += p.vitaPiu }
      if (p.torcia && !this.torcia) { this.torcia = true; this.aggiornaLuce() }
      this.tesori++
      f.esito = { buono: true, dice: b.dice, conto: this.dettoIlPremio(p) }
      return { che: 'curiosita', buono: true }
    }
    const m = c.male[Math.floor(this.rnd() * c.male.length)]
    const costo = m.costo || {}
    let conto = ''
    if (costo.vita) {
      this.ferisci(MALUS.vita)
      conto = `❤️ −${MALUS.vita}`
      if (this.vita <= 0) {
        f.esito = { buono: false, dice: m.dice, conto }
        this.svieni()
        return { che: 'svenuto' }
      }
    }
    if (costo.gemme) {
      const quante = Math.min(this.gemme, MALUS.gemme[0] +
        Math.floor(this.rnd() * (MALUS.gemme[1] - MALUS.gemme[0] + 1)))
      this.gemme -= quante
      conto = quante ? `💎 −${quante}` : ''
    }
    f.esito = { buono: false, dice: m.dice, conto }
    return { che: 'curiosita', buono: false }
  }

  /* Cosa è cambiato, in due parole: la battuta racconta, questa riga
     conta. Senza, un bambino non sa se ha guadagnato qualcosa o se ha
     solo riso — e le due cose vanno distinte, o il premio non è un
     premio. */
  dettoIlPremio(p) {
    const parti = []
    if (p.gemme) parti.push(`💎 +${p.gemme}`)
    if (p.cura) parti.push(`❤️ +${p.cura}`)
    if (p.vitaPiu) parti.push(`❤️ +${p.vitaPiu} per sempre`)
    if (p.torcia) parti.push('🔦 torcia accesa')
    return parti.join(' · ')
  }

  /* Il bottino grosso lo lasciano i mostri grossi: è il patto che fa
     venire voglia di andarseli a cercare invece di girargli intorno. */
  cade(m) {
    m.morto = true
    m.sveglio = false
    this.mostriBattuti++
    /* la chiave non cade per terra: la si ha e basta. Una chiave da
       raccogliere è una cosa in più che si può dimenticare lì, e
       dimenticarla vorrebbe dire rifare la strada per niente */
    if (m.chiave) {
      this.chiaveDelPiano = true
      this.dillo('🗝️ la chiave della scala!')
    }
    const scheda = MOSTRI[m.tipo]
    this.livello.robe.push({ che: 'gemme', x: m.x, y: m.y, em: '💎',
                             quante: scheda.gemme + Math.floor(this.piano * 1.5) })
    const possibili = scheda.lascia || []
    if (possibili.length && this.rnd() < (scheda.droppa != null ? scheda.droppa : 0.5)) {
      const cosa = pescaCosa(possibili, { rnd: () => this.rnd(), tua: k => this.posso(k) })
      this.posaRoba({ che: 'cosa', cosa, em: COSE[cosa].em }, { x: m.x + 1, y: m.y })
    }
    this.dillo(`${m.em} è caduto!`)
  }

  ferisci(quanto) {
    this.vita = Math.max(0, this.vita - quanto)
  }

  /* Svenire non fa perdere la discesa **finché ci sono occasioni**: ci
     si risveglia all'ingresso con metà gemme e mezza vita, e quello che
     si aveva addosso resta — perdere anche la spada vorrebbe dire
     ricominciare, e ricominciare dopo venti minuti di strada è il modo
     di far chiudere il gioco.

     Le occasioni però sono contate (`svenimentiDi`): all'ultima ci si
     risveglia **fuori**, e la tappa resta lì da rigiocare. Il foglio lo
     dice prima di chiudere, perché una discesa che finisce senza che
     nessuno abbia spiegato perché si legge come un guasto. */
  svieni() {
    this.svenimenti++
    this.svenimentiQui++
    this.ultimoSvenimento = this.svenimentiSpesi >= this.svenimentiConcessi
    this.foglio = { che: 'svenuto', ultimo: this.ultimoSvenimento,
                    restano: Math.max(0, this.svenimentiConcessi - this.svenimentiSpesi) }
    this.chiesta = null
  }

  riprendi() {
    /* Nella campagna l'ultima non è una ripresa: è la risalita, e la
       tappa non è superata — la stessa fine di chi smette per suo conto.
       Nell'abisso invece **quello che finisce è la sera, non la
       discesa**: ci si rimette in piedi comunque, e quello che si scrive
       è il punto da cui si rientra. Non è gentilezza, è che qui non c'è
       nessuna tappa da fallire: il contatore serve a rendere la serata
       leggibile, non a difendere l'economia — quella si difende da sé,
       perché ogni svenimento porta via proprio le gemme che servono a
       scendere ancora. */
    if (this.ultimoSvenimento && !this.senzaFondo) { this.perche = 'svenuto'; this.risali(); return }
    this.rimettiInPiedi()
    if (this.ultimoSvenimento) { this.perche = 'svenuto'; this.risali(); return }
    this.chiudi()
  }

  /* Il risveglio all'ingresso: metà gemme, mezza vita, e i mostri a
     casa loro — risvegliarsi con l'orco ancora addosso non è una
     seconda occasione. */
  rimettiInPiedi() {
    this.gemme = Math.floor(this.gemme / 2)
    this.vita = Math.max(6, Math.round(this.vitaMax / 2))
    /* ── e nell'abisso si svuotano le tasche ──
       Quello che si ha **addosso** resta — l'arma, la mano debole, il
       corpo, il dito — e si perdono le sei tasche. Punisce senza
       umiliare: se ne va il margine accumulato, non il lavoro di dieci
       piani, che in una discesa senza fine sarebbe una brutta sera che
       cancella una settimana. È anche l'unica regola che tiene in piedi
       la richiesta di partenza — l'ascia leggendaria non si butta *mai*,
       né a fine tappa né a fine serata né svenendo — e insieme rende
       vera una cosa che il gioco già raccontava: il cartello dice da
       sempre «le gemme che avevi in tasca non ci sono più, ma quello che
       avevi addosso sì», e qui «in tasca» smette di voler dire solo le
       gemme.
       Non si rovescia per terra: la roba se ne va. Ritrovarla
       all'ingresso vorrebbe dire non aver perso niente, con in più un
       giro a piedi. E una pozione bevuta vale da adesso più di una
       tenuta da parte, che è esattamente il comportamento che si voleva
       togliere. La torcia non è nello zaino (è un interruttore sulla
       corsa) e la vita cresciuta con l'elisir sta in `vitaBase`: chi
       sviene non si ritrova al buio né più piccolo di prima. */
    if (this.senzaFondo && this.zaino.length) {
      const quante = this.zaino.length
      this.zaino = []
      this.dillo(`🎒 ${quante === 1 ? 'quello che avevi in tasca' : 'quello che avevi nelle tasche'} non c'è più`)
    }
    const dentro = this.livello.stanze[0]
    this.eroe = { x: dentro.cx + 0.5, y: dentro.cy + 0.5 }
    this.strada = null; this.mira = null; this.bersaglio = null
    for (const m of this.livello.robe) if (m.che === 'mostro') { m.sveglio = false; m.calmo = CALMA }
    this.aggiornaLuce()
  }

  /* Una porta chiusa: il segno dice cosa promette, la domanda è il
     prezzo. Sbagliando non si perde niente — si riprova — perché una
     porta che si chiude per sempre trasformerebbe il girare in una
     partita a scacchi. Quello che si perde per sempre è il forziere. */
  rispostaPorta(p, giusto) {
    if (giusto) {
      /* si apre la **stanza**, non il battente: le porte dello stesso
         gruppo sono i varchi dello stesso posto, e lasciarne chiuso uno
         vorrebbe dire far pagare due volte per entrare dove si è già
         pagato (o, peggio, far girare intorno per trovare quello aperto) */
      const insieme = this.livello.robe.filter(r => r.che === 'porta' && !r.aperta &&
        (p.gruppo != null ? r.gruppo === p.gruppo : r === p))
      for (const r of insieme) { r.aperta = true; r.presa = true }
      this.dillo(insieme.length > 1 ? '🚪 la stanza si apre' : '🚪 la porta si apre')
      this.chiudi()
      return { che: 'aperta' }
    }
    this.dillo('la serratura non si muove')
    this.chiudi()
    return { che: 'chiusa' }
  }

  /* Il forziere è l'unica cosa che si può perdere per sempre, ed è
     apposta: senza una cosa che si perde non c'è niente, in tutto il
     sotterraneo, che faccia un po' di batticuore. E va detto **prima**
     del tocco, mai dopo. */
  rispostaForziere(f, giusto) {
    f.aperto = true
    if (!giusto) {
      f.vuoto = true
      this.dillo('🎁 il forziere resta chiuso')
      this.chiudi()
      return { che: 'niente' }
    }
    this.tesori++
    /* il bottino cade **davanti** al baule, mai dentro: vedi `posaRoba`.
       E predilige la classe che ha aperto il baule (`PESO_ALTRUI` in
       `dati/cose.js`): un forziere è la cosa che si è pagata più cara di
       tutte, ed è il posto dove trovarci roba d'altri pesa di più. */
    const cosa = pescaCosa(NEI_FORZIERI, { rnd: () => this.rnd(), tua: k => this.posso(k) })
    this.posaRoba({ che: 'cosa', cosa, em: COSE[cosa].em }, { x: f.x, y: f.y + 1 })
    this.posaRoba({ che: 'gemme', em: '💎', quante: 6 + this.piano * 3 }, { x: f.x + 1, y: f.y + 1 })
    this.dillo('🎁 si apre!')
    this.chiudi()
    return { che: 'tesoro', cosa }
  }

  rispostaFonte(f, giusto) {
    if (giusto) {
      this.vita = Math.min(this.vitaMax, this.vita + SORSO)
      f.morto = true
      this.dillo(`❤️ +${SORSO}`)
      this.chiudi()
      return { che: 'bevuto' }
    }
    this.dillo('l\'acqua è torbida')
    this.chiudi()
    return { che: 'niente' }
  }

  /* Scappare dà tre secondi di vantaggio, non l'immunità: il mostro resta
     fermo il tempo di uscire dalla stanza, e chi resta lì dentro a girare
     se lo ritrova addosso. Senza quei tre secondi lo scontro si
     riaprirebbe al fotogramma dopo, e «scappo via» sarebbe un tasto che
     non fa niente.

     ── E COSTA UN GRAFFIO ──
     Girare le spalle a un mostro che ti sta addosso non è gratis: si
     prende quello che si prenderebbe rispondendo bene, cioè `graffio`.
     Gratis era la mossa migliore che ci fosse — tutta la fuga e nessuna
     domanda — e un tasto così accanto a una domanda è la risposta a
     un'altra domanda, quella su cosa costa meno. Il conto è quello del
     mostro che si ha davanti, quindi scappare dal goblin costa un
     graffio e dal gigante ne costa tre: la fuga resta la mossa giusta
     quando serve, e smette di essere quella giusta sempre. */
  scappa() {
    const f = this.foglio
    if (!f || f.che !== 'scontro') { this.chiudi(); return { che: 'niente' } }
    f.chi.calmo = CALMA; f.chi.sveglio = false
    const preso = this.graffio(f.chi)
    this.ferisci(preso)
    this.dillo(`🏃 scappi — ${f.chi.em} ti graffia ❤️ −${preso}`)
    if (this.vita <= 0) { this.svieni(); return { che: 'svenuto', preso } }
    this.chiudi()
    return { che: 'scappato', preso }
  }

  chiudi() {
    this.foglio = null
    this.chiesta = null
  }

  /* ═══════════ il mercante ═══════════
     Non chiede domande: è il posto dove **si spende** quello che le
     domande hanno fruttato. Un gioco in cui ogni singola cosa costa un
     esercizio diventa un compito lungo; ci vuole un posto dove il lavoro
     già fatto valga da solo. */
  /* Ce l'ho già? Addosso o in tasca, per il banco è lo stesso: una
     seconda spada uguale alla prima non serve a niente. Le cose che si
     bevono o si accendono fanno eccezione — di pozioni se ne portano
     quante ne stanno, ed è il senso stesso di una pozione. */
  possiedo(k) {
    if (COSE[k] && COSE[k].usa === 'luce' && this.torcia) return true
    return this.mano === k || this.mancina === k || this.corpo === k ||
           this.dito === k || this.zaino.includes(k)
  }

  quanteNeHo(k) {
    return this.zaino.filter(x => x === k).length +
           (this.mano === k || this.corpo === k || this.dito === k ? 1 : 0)
  }

  mercante(m) {
    if (!m.roba) {
      /* cinque e non tre: con trenta voci in catalogo, tre pezzi
         pescati a caso facevano un banco in cui non c'era mai niente
         che servisse — e un mercante da cui non si compra mai è una
         stanza attraversata.

         E non si offre quello che si ha già addosso: il banco è di
         cinque righe, e una riga occupata da una spada identica a
         quella in pugno è una riga buttata. Quello che si consuma fa
         eccezione — di chiavi se ne portano quante ne stanno — ma non
         la torcia: accesa è accesa, e una seconda non illumina niente
         di più. */
      const siAccumula = k => COSE[k].usa && COSE[k].usa !== 'luce'
      const utile = k => siAccumula(k) || !this.possiedo(k)
      /* Non è più un mescolamento uniforme: si pesca **pesando per
         livello**, e il peso è il prezzo (`pescaMerce` in `dati/cose.js`
         dice perché il prezzo e non altro). La profondità è la stessa
         `durezza()` che decide quanto sono toste le domande qui — una
         manopola sola per «quanto siamo giù», invece di una seconda
         scala da tenere allineata alla campagna a mano.

         Il secondo peso è la classe (`tua`), e non è un filtro: una
         riga che questa classe non impugna può ancora capitare, e
         quando capita il banco dice perché. Un banco che mostrasse
         soltanto il portabile non insegnerebbe mai che le altre tre
         classi esistono — e quella riga lì si può comunque non
         comprare, mica raccogliere per terra. */
      m.roba = pescaMerce(this.durezza(), { quante: 5, rnd: () => this.rnd(),
                                            ammessa: utile, tua: k => this.posso(k) })
    }
    this.foglio = { che: 'mercante', chi: m }
  }

  /* ── quello che c'è sul banco adesso ──
     In cima le tre che curano, sempre le stesse e sempre lì; sotto i
     cinque pescati, che cambiano da un mercante all'altro. Chi disegna
     riceve anche `sempre`, perché una riga che non si esaurisce **deve
     dirlo**: se le altre spariscono comprandole e questa no, senza una
     parola sembra un guasto. */
  mercanzia() {
    const f = this.foglio
    if (!f || f.che !== 'mercante') return []
    return [
      ...CURE.map(chiave => ({ chiave, sempre: true })),
      ...(f.chi.roba || []).map(chiave => ({ chiave, sempre: false })),
    ]
  }

  /* ── vendere ──
     A metà prezzo, ed è la parte che conta: comprare e rivendere è una
     perdita, quindi il banco non diventa un modo di fare gemme girando
     in tondo. Serve invece a due cose vere — liberare una tasca senza
     buttare per terra quello che c'è dentro, e trasformare in gemme la
     spada di gradino 2 che non si userà più adesso che se ne ha una
     migliore. Si vende solo dallo zaino: quello che si ha addosso lo si
     ripone prima, che è già un gesto che c'è.

     Il prezzo non scende mai sotto 1: una cosa che si vende per zero
     gemme è una cosa che il gioco ti dice di buttare. */
  quantoVale(k) {
    const c = COSE[k]
    return c && c.prezzo ? Math.max(1, Math.floor(c.prezzo / 2)) : 0
  }

  vendi(i) {
    const f = this.foglio
    if (!f || f.che !== 'mercante') return null
    const k = this.zaino[i]
    if (!k) return null
    const preso = this.quantoVale(k)
    if (!preso) return null
    this.zaino.splice(i, 1)
    this.gemme += preso
    this.dillo(`💎 +${preso}`)
    return { che: 'venduto', cosa: k, gemme: preso }
  }

  compra(k) {
    const f = this.foglio
    if (!f || f.che !== 'mercante') return null
    const c = COSE[k]
    /* le cure si comprano anche se non stanno fra i cinque pescati:
       sono sul banco per conto loro, e ci restano */
    const scorta = f.chi.roba.includes(k)
    if (!c || !(scorta || CURE.includes(k))) return null
    /* Comprare quello che non si può impugnare sarebbe l'unico modo di
       perdere gemme senza guadagnare niente: si rivende a metà, quindi
       è una tassa e basta. La riga compare lo stesso sul banco — dice
       perché no, come nello zaino e per terra — ma non si compra. */
    if (c.dove && !this.posso(k)) { this.dillo(this.perchéNo(k)); return { che: 'niente' } }
    if (this.gemme < c.prezzo) return { che: 'niente' }
    /* Lo zaino pieno non ferma quello che si mette addosso: la casella
       è un altro posto, e chi ha una casella vuota può comprare anche
       con le sei tasche occupate. Fermava tutto, ed era il caso in cui
       si sta al banco proprio perché non si ha più posto. */
    const vaAddosso = c.dove &&
      (c.dove !== 'mancina' || this.mancinaLibera()) && (() => {
      const conf = this.confronto(k)
      return !conf.addosso || conf.delta > 0
    })()
    /* la torcia comprata si accende e non chiede una tasca, come quella
       trovata per terra */
    const siAccende = c.usa === 'luce'
    const serveTasca = !siAccende && (!vaAddosso || !!this.casella(this.confronto(k).dove))
    if (serveTasca && this.zaino.length >= TASCHE) {
      this.dillo('🎒 lo zaino è pieno')
      return { che: 'pieno' }
    }
    this.gemme -= c.prezzo
    /* Il pezzo pescato è unico e se ne va dal banco; una cura no, e
       questa è la seconda metà del «si può sempre comprare vita». Con
       la sola prima — le tre in listino fisso — se ne comprava
       esattamente una, e il mercante restava di nuovo senza bende
       proprio quando servivano. */
    if (scorta) f.chi.roba.splice(f.chi.roba.indexOf(k), 1)
    if (siAccende) { this.accendi(k); return { che: 'comprato', cosa: k, addosso: true } }
    /* comprata e messa: è la stessa regola della roba per terra
       (`trovata`), e per lo stesso motivo — chi ha appena speso venti
       gemme per una corazza migliore non sta scegliendo se metterla,
       la sta comprando **per** metterla. Quello che è peggio o uguale
       va in tasca, che al banco capita: si compra una seconda arma per
       rivenderla, o un anello che si userà più giù. */
    if (vaAddosso) {
      const conf = this.confronto(k)
      const vecchio = this.casella(conf.dove)
      this.metti(conf.dove, k)
      if (vecchio) this.zaino.push(vecchio)
      this.sistemaLeMani()
      const segno = conf.campo === 'att' ? '⚔️' : conf.campo === 'dif' ? '🛡️' : ''
      this.dilloDi(k, conf.delta > 0 && segno ? ` ${segno} +${conf.delta}` : '')
      return { che: 'comprato', cosa: k, addosso: true }
    }
    this.zaino.push(k)
    this.dilloDi(k)
    return { che: 'comprato', cosa: k }
  }

  /* ═══════════ lo zaino ═══════════
     Una tasca toccata **apre le sue azioni** invece di eseguirne una:
     `usa` fa la cosa sensata per quell'oggetto (si impugna quello che si
     impugna, si beve quello che si beve), `butta` lo lascia per terra,
     `riponi` toglie dalle mani quello che si ha addosso. Erano tre gesti
     che prima non esistevano affatto — l'unico modo di liberare una
     tasca era usare quello che c'era dentro, che con sei tasche e le
     armature pesanti vuol dire buttare via una pozione per fare posto.

     Il verbo lo sceglie chi disegna, dai dati (`dove`, `usa`): il motore
     non scrive «bevo» da nessuna parte. */
  usa(i) {
    const k = this.zaino[i]
    if (!k) return null
    const c = COSE[k]
    if (c.dove) {
      /* Il tasto c'è comunque e dice perché non si preme, che è la
         regola di casa: quanto manca, mai un tasto spento e muto. Chi
         disegna lo sa già (`posso`) e lo scrive addosso alla tasca —
         questa riga è la rete sotto, per il caso in cui ci si arrivi
         lo stesso. */
      if (!this.posso(k)) { this.dillo(this.perchéNo(k)); return { che: 'niente' } }
      /* quello che si aveva addosso torna nello zaino: non sparisce,
         perché una spada lasciata cadere per prenderne un'altra è la cosa
         che fa arrabbiare di più. Per un'arma il posto lo sceglie
         `confronto`: col pugno pieno e la sinistra libera, una seconda
         arma leggera va di là. */
      if (c.dove === 'mancina' && this.aDueMani(this.mano)) {
        this.dillo(`✋ ${COSE[this.mano].nome} vuole tutte e due le mani`)
        return { che: 'niente' }
      }
      const dove = c.dove === 'mano' ? this.postoDellArma(k).dove : c.dove
      const vecchio = this.casella(dove)
      this.metti(dove, k)
      this.zaino.splice(i, 1)
      if (vecchio) this.zaino.push(vecchio)
      this.sistemaLeMani()
      this.dilloDi(k)
      return { che: 'addosso', cosa: k }
    }
    if (c.usa === 'cura') {
      this.vita = Math.min(this.vitaMax, this.vita + c.cura)
      this.zaino.splice(i, 1)
      this.dillo(`❤️ +${c.cura}`)
      return { che: 'curato' }
    }
    if (c.usa === 'cresci') {
      this.vitaBase += c.cresce
      this.vita += c.cresce
      this.zaino.splice(i, 1)
      this.dillo(`❤️ ${this.vita}/${this.vitaMax}`)
      return { che: 'cresciuto' }
    }
    /* Una torcia in tasca adesso non ci finisce più — si accende
       raccogliendola — ma un salvataggio di prima ce l'ha ancora, e un
       oggetto che non si può né usare né togliere sarebbe una tasca
       murata. Il tasto resta per loro. */
    if (c.usa === 'luce') {
      this.zaino.splice(i, 1)
      if (!this.accendi(k)) this.dillo('🔦 ne hai già una accesa')
      return { che: 'luce' }
    }
    if (c.usa === 'porta') {
      const vicina = this.livello.robe.find(r => r.che === 'porta' && !r.aperta &&
        Math.abs(r.x + 0.5 - this.eroe.x) < 2 && Math.abs(r.y + 0.5 - this.eroe.y) < 2)
      if (!vicina) { this.dillo('nessuna porta qui vicino'); return { che: 'niente' } }
      vicina.aperta = true
      vicina.presa = true
      this.zaino.splice(i, 1)
      this.dillo('🗝️ la porta si apre')
      return { che: 'aperta' }
    }
    return null
  }

  /* ── lasciare per terra ──
     Dove si è, non dove capita: la roba buttata resta **dove l'hai
     lasciata**, e ci si può tornare. Se sotto i piedi c'è già qualcosa
     si posa accanto, come tutto il resto (`posaRoba`). */
  butta(i) {
    const k = this.zaino[i]
    if (!k) return null
    this.zaino.splice(i, 1)
    this.posaRoba({ che: 'cosa', cosa: k, em: COSE[k].em },
                  { x: Math.floor(this.eroe.x), y: Math.floor(this.eroe.y) })
    this.dillo(`${COSE[k].em} per terra`)
    return { che: 'buttata', cosa: k }
  }

  /* Togliersi di mano o di dosso quello che si porta, senza buttarlo. */
  riponi(dove) {
    const k = this.casella(dove)
    if (!k) return null
    if (this.zaino.length >= TASCHE) { this.dillo('🎒 lo zaino è pieno'); return { che: 'pieno' } }
    this.metti(dove, null)
    /* togliendosi l'amuleto il tetto scende: la vita lo segue, o
       resterebbe un numero più alto del suo massimo */
    this.vita = Math.min(this.vita, this.vitaMax)
    this.zaino.push(k)
    this.dillo(`${COSE[k].em} nello zaino`)
    return { che: 'riposta', cosa: k }
  }

  /* ═══════════ la scala ═══════════
     Chiusa finché non si è battuto chi porta la chiave: è l'unica cosa
     che in tutto il sotterraneo non si può aggirare, e quindi è il
     pavimento sotto a tutto il resto — il minimo di esercizi che un piano
     costa comunque. */
  allaScala() {
    if (!this.chiaveDelPiano) {
      const chi = this.livello.robe.find(r => r.che === 'mostro' && r.chiave && !r.morto)
      const visto = !!(chi && this.visto[chi.y * this.livello.largo + chi.x])
      this.foglio = { che: 'chiusa', chi, visto }
      return
    }
    this.foglio = { che: 'scala', ultimo: this.piano >= this.quantiPiani - 1 }
  }

  scendi() {
    if (!this.foglio || this.foglio.che !== 'scala') return null
    this.pianiFatti++
    if (this.piano >= this.quantiPiani - 1) {
      this.finita = true
      this.vinta = true
      this.foglio = null
      this.chiesta = null
      return { che: 'finita' }
    }
    this.piano++
    /* le occasioni si rinnovano scendendo, e solo scendendo: è la cosa
       che si è guadagnata (vedi `svenimentiSpesi`) */
    this.svenimentiQui = 0
    this.vitaBase += VITA_PER_PIANO
    this.vita = Math.min(this.vitaMax, this.vita + RIPOSO_SCALA)
    this.nuovoPiano()
    this.chiudi()
    this.dillo(`piano ${this.piano + 1}`)
    return { che: 'sceso', piano: this.piano }
  }

  /* Si può smettere e risalire: la discesa non è vinta, ma non è nemmeno
     una sconfitta — è quello che succede quando un bambino ha finito il
     tempo, e non deve costargli tutto. */
  risali() {
    this.finita = true
    this.vinta = false
    this.foglio = null
    this.chiesta = null
  }

  /* Com'è andata, per chi deve scriverlo nel profilo e mostrarlo. */
  get esito() {
    return {
      vinta: this.vinta, svenimenti: this.svenimenti, domande: this.domande,
      /* perché è finita: `'svenuto'` se il fondo degli svenimenti è
         stato toccato, niente se si è risaliti per scelta o si è vinto */
      perche: this.perche || null,
      piani: this.pianiFatti,
      /* l'abisso non ha un «su quanti»: dirlo `Infinity` metterebbe a
         schermo «3 piani su ∞», che non è un conto */
      quantiPiani: this.senzaFondo ? null : this.quantiPiani,
      /* il più giù che si è arrivati, contato come lo conta un bambino
         (il primo piano è l'1): è il record dell'abisso, e nella
         campagna è semplicemente il piano dove si è finiti */
      fondo: this.piano + 1,
      mostri: this.mostriBattuti, tesori: this.tesori,
      gemme: this.gemme, stanze: this.stanzeViste,
    }
  }
}
