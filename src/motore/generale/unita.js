/* ═══════════════════════════════════════════════════════════════════
   UNITÀ — chi cammina

   Il gemello di `Elemento`: quello sa fare le cose che stanno ferme,
   questo chi si muove. La differenza non è di comodo — un'unità ha tre
   cose che una porta non ha e non avrà mai:

     una VISTA      da cui discende cosa può sapere
     una MEMORIA    `visti`, cioè dove ha visto l'ultima volta ognuno
     un PIANO       le file di ordini che sta eseguendo adesso

   ── NESSUNO LE GUARDA DENTRO ──
   Non si legge `preda.vita` e non si scrive `preda.viva = false` da
   fuori: le si chiede `eInPiedi()` e le si dice `subisci(...)`, e lei
   risponde con un resoconto. Sembra formalismo e non lo è: è dentro
   `subisci` che sta «se le prendo chiamo i miei», e un attaccante che
   scalasse la vita a mano se lo porterebbe via senza accorgersene.

   IL PATTO DELL'AZZERAMENTO è lo stesso di `Elemento`: rigiocare la
   scena non è una lista di assegnamenti scritta in `avvia()`, dove
   dimenticarsene uno era gratis e si scopriva alla seconda partita — è
   un metodo che sta accanto allo stato che rimette a posto.
   ═══════════════════════════════════════════════════════════════════ */
import { ACammino } from './distanze/a-cammino.js'
import { armaDa } from './arma.js'
import { Filo, Ascoltatore } from './filo.js'
import { Contesto } from './contesto.js'
import { Reazione } from './reazioni/reazione.js'

export class Unita {
  constructor (d) {
    /* tutto quello che il campo ha dichiarato — id, nome, fazione,
       emoji, corpo, `sa`, `nonRiesce`, le reazioni — resta come sta:
       questa classe non tiene un elenco dei campi del livello, se no
       ogni campo nuovo andrebbe aggiunto anche qui.
       Tranne quelli che qui diventano un OGGETTO invece di un numero:
       il livello scrive `vista: 6`, e da quel numero nasce un raggio. */
    const { vista, arma, ...comeLHaScritto } = d
    Object.assign(this, comeLHaScritto)
    /* dov'era all'inizio: ci si torna rigiocando, ed è anche «il mio
       posto» per chi si allontana e poi rientra */
    this.x0 = d.x
    this.y0 = d.y
    this.vitaMax = d.vita || 3
    /* il livello scrive un numero (`vista: 6`); qui diventa un raggio,
       e chi lo interroga non sa più come si misura */
    this.sguardo = new ACammino(vista || 0)
    this.armaBase = armaDa(arma)
    /* ── DUE MANI, E CI STA UNA COSA PER MANO ──
       Non è un dettaglio di colore: è la regola da cui nascono le
       sequenze. Finché uno poteva portarsi dietro il mondo intero,
       «prendi tutto quello che trovi» era sempre la mossa giusta e non
       c'era niente da decidere (il §1.1b della didattica lo chiama per
       nome: un'euristica di prudenza, non un problema). Con due mani
       contate, per prendere la terza cosa **bisogna posarne una** — e
       quale posare, e dove, è una decisione vera che si scrive con i
       verbi che si sanno già.
       Serve anche a spiegare una cosa che prima era una dichiarazione:
       il cavaliere ha `mani: 0` perché in una c'è lo scudo e nell'altra
       la spada, e posarli vorrebbe dire restare indifeso. Non è più una
       regola calata dall'alto: è aritmetica. */
    if (this.mani == null) this.mani = 2
    /* ── E LE TASCHE, PER LA ROBA PICCOLA ──
       Una chiave in mano non ci sta: ci sta in tasca, e di chiavi se ne
       portano tre senza pensarci. Senza questa distinzione ogni livello
       con due porte diventava un balletto di «posa la chiave» — una
       riga che non insegna niente e che si ripete uguale. Le mani
       restano contate per la roba vera (un sacco, un libro, una
       lanterna); il minuto sta in tasca e non pesa. */
    if (this.tasche == null) this.tasche = 3
    this.azzera()
  }

  azzera () {
    this.x = this.x0; this.y = this.y0
    this.vita = this.vitaMax
    this.inPiedi = true
    this.zaino = []
    /* le armi raccolte, per id: si svuota rigiocando come lo zaino */
    this.impugnate = {}
    /* e quello che sta in tasca invece che in mano */
    this.inTasca = {}
    this.dir = 2
    /* la memoria di chi ha visto e dove: è quello su cui lavora
       `vai [qualcuno]`, ed è il motivo per cui una ronda serve davvero */
    this.visti = {}
    /* i segnali che sono arrivati a ME: non quelli mandati nel mondo */
    this.sentiti = new Set()
    this.ordineOra = null
    this.attesa = null
    this.gridato = false
    /* la cache della mappa delle distanze (`mappa.js`): si butta */
    this._mk = null
    this._md = null
  }

  /* come si chiama in una riga di registro */
  get comeSiChiama () { return this.nome || this.id }
  /* quanto lontano vede, per chi vuole scriverlo in una scheda */
  get vista () { return this.sguardo.limite }

  /* ═══════════ quello che sa ═══════════ */
  eInPiedi () { return this.inPiedi }

  /* «al buio vedi un passo; con la lanterna vedi come sempre — e ti
     vedono come sempre». Non è più `this.sguardo.arriva(...)` da solo:
     serve `limiteVista` per decidere, bersaglio per bersaglio, fin
     dove arriva ADESSO — la misura (`ACammino.distanza`) resta la
     stessa di sempre, cambia solo dove si ferma. */
  vede (mondo, altro) {
    return !!altro && this.sguardo.distanza(mondo, this, altro) <= this.limiteVista(mondo, altro)
  }

  /* ═══════════ IL TETTO DEL BUIO, E L'ECCEZIONE DELLA LUCE ═══════════
     Tre regole, in tre righe:

     1. IL TETTO. Un ambiente buio non inventa un numero nuovo: ABBASSA
        `vista` a un tetto (`mondo.vistaAlBuio`, `mondo.js`) con un
        `Math.min` — un muro in mezzo faceva già la stessa cosa alla
        DISTANZA, questo lo fa al LIMITE. Il tetto di default è
        INFINITO: se il livello non lo dichiara, `Math.min(vista,
        Infinity)` è sempre `vista`, e questo metodo si comporta
        ESATTAMENTE come `this.sguardo.limite` da solo — è la
        condizione che rende sicuro questo lavoro, per ogni livello
        scritto finora.
     2. CHI PORTA LUCE NON HA IL TETTO. Sta dentro il proprio cerchio
        (o quello di una lanterna posata dove si trova, che è la
        stessa domanda): `mondo.illuminato(this)` lo dice, ed è vero
        anche a distanza zero da sé stessi.
     3. E CHI È ILLUMINATO SI VEDE DA LONTANO ANCHE DA CHI È AL BUIO —
        `mondo.illuminato(altro)`. Questa è la riga che ROMPE APPOSTA
        una cosa che finora era sempre stata vera per costruzione: «se
        io non ti vedo, tu non vedi me», perché tutti misuravano con
        lo stesso righello (`ACammino`, simmetrico). Con la luce non
        più — un orco al buio, senza lanterna, VEDE l'eroe che sta nel
        cerchio della sua lanterna, anche se l'eroe (che guarda verso
        il buio, senza luce addosso) non vede l'orco: la luce che ti
        fa vedere è la stessa che ti fa scoprire. È la parte più utile
        della lanterna e anche la più insidiosa, e per questo va letta
        sulla mappa — il cerchio si vede — prima di scoprirla a proprie
        spese. */
  limiteVista (mondo, altro) {
    const tetto = mondo.vistaAlBuio ?? Infinity
    if (tetto >= this.sguardo.limite) return this.sguardo.limite
    if (mondo.illuminato(this) || mondo.illuminato(altro)) return this.sguardo.limite
    return Math.min(this.sguardo.limite, tetto)
  }

  haSentito (segnale) { return this.sentiti.has(segnale) }

  /* ha visto qualcuno: da adesso sa dove cercarlo */
  ricorda (z) { this.visti[z.id] = { x: z.x, y: z.y } }
  /* e dove l'aveva visto — di un'unità o di tutta una schiera */
  ricordoDi (...chiavi) {
    for (const k of chiavi) if (k && this.visti[k]) return this.visti[k]
    return null
  }

  /* ── le cose che si porta dietro ──
     Non ci si scrive da fuori: chi cambia mano è l'oggetto, e l'oggetto
     lo dice qui. Sono i due gemelli di `Oggetto.passaA` / `.lascia`, e
     si chiamano sempre in coppia con quelli. */
  ha (id) { return this.zaino.includes(id) }
  /* quante mani ha ancora libere: una cosa ingombrante, una mano — la
     roba da tasca non conta */
  get maniLibere () { return this.mani - (this.zaino.length - this.quanteInTasca) }
  get quanteInTasca () { return this.zaino.filter(id => this.inTasca[id]).length }
  get tascheLibere () { return this.tasche - this.quanteInTasca }
  /* lo dice l'oggetto quando cambia mano, come per le armi */
  metteInTasca (id) { this.inTasca[id] = true }
  metteInZaino (id) { if (!this.ha(id)) this.zaino.push(id) }
  togliDaZaino (id) {
    const k = this.zaino.indexOf(id)
    if (k >= 0) this.zaino.splice(k, 1)
    delete this.impugnate[id]
    delete this.inTasca[id]
  }

  /* ── UN'ARMA RACCOLTA È UN'ARMA ──
     Un oggetto che dichiara `arma: { danno: 2 }` non è un oggetto come
     gli altri: chi lo raccoglie colpisce con quello. Lo registra
     l'oggetto stesso quando cambia mano (`Oggetto.passaA`), come per lo
     zaino — qui non ci si scrive da fuori.
     È la riga che rende raccontabile una storia intera invece di un
     livello: **la ladra a cui hanno preso i pugnali non fa male a
     nessuno, e quando li ritrova torna pericolosa**. Prima l'arma era
     un dato fisso della scheda, e «disarmato» non si poteva dire. */
  impugna (id, arma) { this.impugnate[id] = arma }

  /* la migliore fra quelle che porta, se no quella di serie */
  get arma () {
    let scelta = this.armaBase
    for (const k in this.impugnate)
      if (this.impugnate[k].danno > scelta.danno) scelta = this.impugnate[k]
    return scelta
  }

  /* ═══════════ quello che le succede ═══════════ */
  /* ── LE PRENDE, E LO RACCONTA LEI ──
     Chi colpisce non le scala la vita e non le legge lo stato: le dice
     `subisci` e riceve il resoconto. Ed è qui dentro, non nell'ordine
     `attacca`, che sta «se le prendo chiamo i miei»: la reazione al
     colpo è di chi il colpo lo incassa. */
  subisci (danno, da, mondo) {
    this.vita -= danno
    const caduto = this.vita <= 0
    const colpo = { da: da && da.id, a: this.id, x: this.x, y: this.y,
                    vita: Math.max(0, this.vita), vitaMax: this.vitaMax, mortale: caduto }
    if (mondo) {
      /* ── È CHI LE PRENDE A DIRE CHE COSA GLI È SUCCESSO ──
         Il colpo che si vede e la caduta li pubblica lei, non chi ha
         menato: uno scontro dura, e chi disegna deve sapere chi ha
         incassato e dove — sono quei battiti la finestra in cui
         l'altro corre al forziere. Chi attacca racconta solo il proprio
         gesto. */
      mondo.eventi.push('colpo')
      mondo.colpi.push(colpo)
    }
    if (caduto) {
      this.inPiedi = false
      this.ordineOra = null
      if (mondo) mondo.eventi.push('morte')
    } else if (mondo) {
      /* e se è fatta per chiamare i suoi, li chiama: la reazione al
         colpo è di chi il colpo lo incassa */
      mondo.gridaSe(this, 'colpito')
    }
    return colpo
  }

  puoiColpire (mondo, preda) { return this.arma.puoiColpire(mondo, this, preda) }
  get danno () { return this.arma.danno }

  /* ═══════════ quello che sta facendo ═══════════
     ── L'ORCHESTRATORE ──
     Un personaggio ha un piano, e può avere più FILI: quello
     principale, uno per ogni «quando senti» che è scattato, uno per
     ogni reazione che gli è addosso. Ne gira sempre uno solo — c'è un
     puntatore all'attivo, gli altri stanno in pausa, e quando l'attivo
     finisce il puntatore torna a chi aspettava.
     Da qui in poi il battito non conosce più i fili: chiede a ogni
     personaggio di fare il suo passo, e basta. */
  parti (pianoCompilato) {
    this.principale = new Filo(pianoCompilato, 'principale')
    this.fili = [this.principale]
    this.ascoltatori = []
    this.attivo = this.principale
    this.principale.azzera()
    /* ── LE REAZIONI SCRITTE NELLA SCHEDA ──
       Non sono ordini che qualcuno le ha dato: sono come è fatta lei, e
       valgono da subito. Il motore non sa cosa facciano — dentro c'è
       una fila di ordini scritta nel livello, come quella del bambino. */
    for (const dato of (this.reagisce || [])) this.ascoltatori.push(new Reazione(dato))
  }

  /* «se arriva questo segnale, fai questa fila». Non parte adesso: sta
     appeso finché il segnale non arriva. */
  mettiInAscolto (segnale, fila, comeSiChiama, priorita) {
    if (this.ascoltatori.some(a => a.segnale === segnale && a.filo.fila === fila)) return
    this.ascoltatori.push(new Ascoltatore(segnale, fila, comeSiChiama, priorita))
  }

  /* ── MI È ARRIVATO UN MESSAGGIO ──
     Non è il mondo a sapere chi ascolta cosa: il mondo propaga, e ogni
     personaggio decide se gli interessa. Risponde se si è svegliato
     qualcosa, così chi ha suonato può raccontare chi ha destato. */
  senti (messaggio) {
    /* ── QUELLO CHE HO SENTITO IO ──
       Si registra qui e non nel mondo, e la differenza è diventata vera
       il giorno che il rumore ha preso una portata: prima «hai sentito
       il cigolio?» guardava un elenco globale — *qualcuno* l'ha mandato,
       da qualche parte — e rispondeva di sì anche a chi era troppo
       lontano per sentirlo. Il messaggio arriva fin qui solo se davvero
       ci arriva (`arrivaA`), quindi questa lista è la sola risposta
       onesta. */
    this.sentiti.add(messaggio.segnale)
    let destato = false
    for (const a of this.ascoltatori) {
      if (!a.riconosce(messaggio)) continue
      /* già in ballo: sentirlo di nuovo non fa partire una seconda
         esecuzione in parallelo */
      if (this.fili.includes(a.filo) && !a.filo.finito) continue
      /* ── UN ASCOLTO NON INTERROMPE, UNA REAZIONE SÌ ──
         Un ascolto è una cosa che hai scritto tu, e se ti prendesse a
         metà strada il tuo piano non si spiegherebbe più: aspetta che
         il personaggio sia libero. Una reazione è come sei fatto, e ti
         prende mentre fai altro. */
      if (a.filo.priorita === 0 && this.eImpegnata()) continue
      /* c'è chi scrive la sua fila solo adesso, perché dipende da dove
         è successo (chi corre al rumore) */
      if (typeof a.preparaPer === 'function') a.preparaPer(messaggio, this)
      else a.filo.azzera()
      if (!this.fili.includes(a.filo)) this.fili.push(a.filo)
      destato = true
    }
    return destato
  }

  /* ── E QUANDO VEDO QUALCUNO ──
     Il gemello di `senti`, e mancava: `reagisce: [quando.vedi(…)]` si
     poteva scrivere, compariva nella scheda col suo 👁 e **non
     scattava mai**, perché `Reazione.riconosce` risponde solo ai
     messaggi. Era dato morto come `accorre` prima di lui, e ci
     stavano dentro quattro livelli — una guardia che «si butta su chi
     vede» e si lasciava passare davanti senza fare niente.
     Chi chiama questo metodo è il battito (`Partita.passo`), che i
     due che si vedono li sta già scorrendo per la memoria: qui non si
     ricalcola nessuna vista. */
  vedendo (chi) {
    let destato = false
    for (const a of this.ascoltatori) {
      if (a.evento !== 'vedi') continue
      if (a.chi && a.chi !== chi.id && a.chi !== chi.fazione) continue
      if (this.fili.includes(a.filo) && !a.filo.finito) continue
      if (typeof a.preparaPer === 'function') a.preparaPer(null, this)
      else a.filo.azzera()
      if (!this.fili.includes(a.filo)) this.fili.push(a.filo)
      destato = true
    }
    return destato
  }

  /* chi tocca adesso: il filo pronto con la priorità più alta, e a
     parità quello che stava già girando (non si cambia cavallo per
     niente) */
  scegliIlFilo () {
    const pronti = this.fili.filter(f => !f.finito)
    if (!pronti.length) return null
    if (this.attivo && !this.attivo.finito &&
        !pronti.some(f => f !== this.attivo && f.scavalca(this.attivo))) return this.attivo
    return pronti.reduce((meglio, f) => (f.scavalca(meglio) ? f : meglio), pronti[0])
  }

  /* sta ancora facendo qualcosa? Serve al battito per capire se la
     scena può ancora cambiare, e a chi manda un segnale per sapere se
     questo è libero di ascoltarlo. */
  eImpegnata () { return this.fili.some(f => !f.finito) }
  get sonoInAscolto () { return this.ascoltatori.length > 0 }

  /* ── UN PASSO, E LO DECIDE LEI ──
     Il battito chiama questo, e non sa niente di fili: sceglie chi
     tocca, gli fa fare un passo, e se ha finito lo segna — il puntatore
     tornerà da sé a chi era in pausa. Risponde se il battito è stato
     speso, che è quello che serve al mondo per accorgersi di una scena
     che si è piantata. */
  esegui (mondo, registro) {
    if (!this.eInPiedi()) { this.fili = []; this.ordineOra = null; return false }
    const filo = this.scegliIlFilo()
    if (!filo) { this.ordineOra = null; return false }
    this.attivo = filo
    const esito = filo.fila.esegui(new Contesto(mondo, this, registro, filo.nome))
    if (esito.finito) { filo.finito = true; this.ordineOra = null }
    return esito.speso
  }
}
