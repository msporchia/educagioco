/* ═══════════════════════════════════════════════════════════════════
   UNA CORSA — una discesa dall'ingresso al guardiano, in tre piani

   Le regole, a classi e **senza schermo**: qui dentro non si sa cosa sia
   un canvas, un componente Vue o una moneta della cameretta. Non si sa
   nemmeno cosa sia una domanda: la corsa dice *quanto dev'essere
   difficile* (`sfida.difficolta`, da 0 a 1) e poi aspetta un `sì` o un
   `no`. Chi la domanda la va a prendere davvero — e sa che esistono le
   materie — è `Gioco.vue`, e nessun altro.

   È questa ignoranza che permette al banco di prova (`banco.js`) di
   giocare mille discese in Node con un bambino finto che ne sbaglia una
   su quattro, e di dire se una tappa è battibile invece di sperarlo.

   ── LO SCONTRO ──
   Un mostro non è più un contatore di risposte: ha vita, attacco e
   difesa (`dati/mostri.js`), e lo scontro è uno scambio di colpi.

     rispondi bene  → gli togli max(1, tuo attacco − sua difesa)
                      e lui ti graffia di 1
     rispondi male  → non gli togli niente
                      e lui ti picchia: max(1, suo attacco − tua difesa)

   Quindi **quante domande costa una stanza lo decide come sei messo**,
   non la stanza. Con la lama del drago un mostro cade in due scambi,
   con lo spadino in cinque: è il motivo per cui vale la pena andare a
   cercarsi il mostro grosso invece di girargli intorno, ed è tutto il
   gioco. Le formule stanno in `dati/eroe.js`, non qui: qui si applicano.

   COSA COSTA SBAGLIARE. Mai la corsa, in un colpo solo. Un mostro
   picchia e rimane lì (si riprova, o si scappa); una serratura non si
   apre e il tesoro sfuma. Si perde solo finendo la vita, e per finirla
   bisogna sbagliare parecchie volte — quante, lo dice la difesa, ed è
   per questo che l'armatura è l'altra metà del bottino.
   ═══════════════════════════════════════════════════════════════════ */
import { STANZE, gradoBottino, pianoDi, finePiano, inizioPiano,
         QUANTI_PIANI } from '../dati/stanze.js'
import { TESORI, POZIONE, bonusDi, meglioDi, tesoriPossibili } from '../dati/tesori.js'
import { EVENTI } from '../dati/eventi.js'
import { TARATURA, bottinoDi, stellePerVita } from '../dati/taratura.js'
import { faccia, ambiente, ossaDi, forzaDi } from '../dati/mostri.js'
import { statisticheBase, colpoDellEroe, colpoDelMostro, scambiPerAbbattere,
         GRAFFIO } from '../dati/eroe.js'
import { generaMappa } from './mappa.js'

export class Corsa {
  static perTappa(tappa, opzioni = {}) { return new Corsa(tappa, opzioni) }

  constructor(tappa, { rnd = Math.random, mappa = null, tappeFatte = 0 } = {}) {
    this.tappa = tappa
    this.rnd = rnd
    this.mappa = mappa || generaMappa(tappa, rnd)
    this.ambiente = ambiente(tappa.ambiente)
    /* quanto è avanti nella campagna chi sta giocando: alza le ossa dei
       mostri (`forzaDi`) e le statistiche dell'eroe (`statisticheBase`)
       insieme, che è il solo modo perché la campagna sia una salita e
       non una parete */
    this.livello = Number.isFinite(tappa.livello) ? tappa.livello : tappeFatte

    const base = statisticheBase(tappeFatte)
    this.vitaMax = base.vita
    this.vita = base.vita
    this.attaccoBase = base.attacco
    this.difesaBase = base.difesa

    this.gemme = 0
    this.mano = null            // la chiave dell'arma impugnata
    this.addosso = null         // la chiave dell'armatura indossata
    this.presi = {}             // gli oggetti senza casella già presi
    this.ultimoLasciato = null  // cosa si è lasciato prendendo l'ultima cosa
    this.qui = null             // la stanza in cui si è
    this.stanza = null          // cosa ci sta succedendo dentro
    this.esito = null           // null | 'vinta' | 'persa'

    /* i conti che servono al cartello di fine e al banco di prova */
    this.visitate = 0
    this.domande = 0
    this.sbagliate = 0
    this.persi = 0              // vita persa in tutta la discesa
    this.tesori = 0             // quanti pezzi di equipaggiamento raccolti
    this.piuGiu = 0             // la fila più profonda toccata

    this.illumina()
  }

  /* ═══════ com'è messo l'eroe adesso ═══════
     Base più allenamenti più quello che porta addosso. È l'unico posto
     dove si sommano: chi vuole sapere quanto picchia l'eroe chiede
     qui, e non va a guardare dentro le caselle. */
  get equipaggiamento() { return { mano: this.mano, addosso: this.addosso, presi: this.presi } }
  get attacco() { return this.attaccoBase + bonusDi(this.equipaggiamento).attacco }
  get difesa() { return this.difesaBase + bonusDi(this.equipaggiamento).difesa }

  /* ═══════ dove siamo ═══════ */
  /* La stanza viene prima dell'esito apposta: battuto il guardiano, il
     cartello «sconfitto!» si deve poter leggere. Si va al riepilogo
     quando si esce dalla stanza, non un attimo prima. */
  get dove() { return this.stanza ? 'stanza' : this.esito ? 'fine' : 'mappa' }
  get finita() { return this.esito !== null }
  get vinta() { return this.esito === 'vinta' }
  get riga() { return this.qui ? this.qui.riga : 0 }
  get quanteFile() { return this.mappa.quanteFile }
  get piano() { return pianoDi(this.riga, this.quanteFile) }
  get quantiPiani() { return QUANTI_PIANI }

  illumina() {
    this.mappa.illumina(this.riga, TARATURA.vista, !!this.presi.lanterna)
  }

  /* Le stanze in cui si può entrare adesso. Dentro una stanza o a corsa
     finita non se ne apre nessuna: la mappa aspetta. */
  aperte() {
    if (this.dove !== 'mappa') return []
    return this.qui ? this.qui.verso.slice() : this.mappa.ingressi.slice()
  }

  /* ═══════ entrare ═══════ */
  entra(quale) {
    if (this.dove !== 'mappa') return null
    const id = typeof quale === 'number' ? quale : quale?.id
    const s = this.aperte().find(x => x.id === id)
    if (!s) return null

    this.qui = s
    s.fatta = true
    this.visitate++
    this.piuGiu = Math.max(this.piuGiu, s.riga)
    this.illumina()

    const scheda = STANZE[s.tipo]
    this.stanza = scheda.taglia
      ? this.apriSfida(s)
      : s.tipo === 'fuoco' ? this.apriRiposo(s)
      : s.tipo === 'negozio' ? this.apriMercato()
      : this.apriStranezza()
    return this.stanza
  }

  apriSfida(s) {
    const scheda = STANZE[s.tipo]
    const forza = forzaDi(this.livello, s.profondita(this.quanteFile))
    const ossa = ossaDi(scheda.taglia, forza, this.rnd)
    return {
      che: 'sfida', tipo: s.tipo,
      momento: 'domanda',            // domanda | colpito | esito
      nome: s.tipo === 'boss' ? this.ambiente.bossNome : scheda.nome,
      /* Una serratura non è un mostro e non deve avere una faccia:
         `faccia()` non sa cosa sia uno scrigno e, non sapendolo,
         pescava fra i mostri di casa — così davanti al forziere si
         presentava un ragno. Le cose che non sono vive mostrano la
         loro icona, che è quella che il bambino ha già visto sulla
         mappa un attimo prima. */
      faccia: scheda.taglia === 'serratura'
        ? scheda.icona
        : faccia(this.tappa.ambiente, s.tipo, this.rnd),
      /* quanto è grossa la figura in scena, e se le tocca l'aura: chi
         disegna non deve sapere che il capo ha vita tripla, gli basta
         sapere che è un capo */
      taglia: scheda.taglia,
      colore: scheda.colore,
      mostro: { ...ossa, vitaMax: ossa.vita },
      /* quanto dev'essere tosta la domanda: se l'è segnata la stanza
         quando la mappa è nata, ed è la stessa che il bollino ⚡ ha
         mostrato sulla mappa prima di entrare */
      difficolta: s.difficolta,
      sfuma: !!scheda.sfuma,
      scappabile: !!scheda.scappabile,
      colpito: null,
      esito: null,
    }
  }

  /* ═══════ rispondere ═══════
     L'unica cosa che la corsa vuole sapere di una domanda: se è andata
     bene. Torna cosa è successo, che a chi coordina serve per i suoni,
     per le animazioni e per capire se serve un'altra domanda. */
  rispondi(giusto) {
    const st = this.stanza
    if (!st || st.che !== 'sfida' || st.momento !== 'domanda') return null
    this.domande++
    const m = st.mostro

    if (giusto) {
      const danno = colpoDellEroe(this.attacco, m.difesa)
      m.vita = Math.max(0, m.vita - danno)
      if (m.vita <= 0) return this.vinceSfida(danno)
      /* il graffio: uno scambio vinto costa comunque qualcosa, ed è
         quello che rende «curati» una scelta vera al fuoco da campo.
         La serratura non graffia: non è viva. */
      const graffio = st.tipo === 'scrigno' ? 0 : GRAFFIO
      if (graffio && this.ferisci(graffio)) return { che: 'morto', danno, graffio }
      return { che: 'colpo', danno, graffio, vita: m.vita, vitaMax: m.vitaMax }
    }

    this.sbagliate++
    if (st.sfuma) {
      st.momento = 'esito'
      st.esito = { em: '🔒', tit: 'Resta chiuso',
                   testo: 'La serratura scatta al contrario. Il tesoro rimane lì dentro.' }
      return { che: 'sfumato' }
    }
    const colpo = colpoDelMostro(m.attacco, this.difesa)
    if (this.ferisci(colpo)) return { che: 'morto', colpo }
    st.momento = 'colpito'
    st.colpito = { em: '💥', tit: 'Ahia!',
                   testo: `${st.nome} ti colpisce: −${colpo}. Ti restano ${this.vita} punti vita.` }
    return { che: 'ferito', colpo, vita: this.vita }
  }

  /* dopo il colpo: si riprova… */
  continua() {
    const st = this.stanza
    if (!st || st.momento !== 'colpito') return false
    st.momento = 'domanda'
    st.colpito = null
    return true
  }

  /* …oppure si molla lì. La stanza resta fatta e non dà niente: scappare
     costa il bottino, non la pelle. */
  scappa() {
    const st = this.stanza
    if (!st || !st.scappabile) return false
    st.momento = 'esito'
    st.esito = { em: '🏃', tit: 'Via di corsa',
                 testo: 'Lo lasci lì. Niente gemme e niente bottino, ma la strada continua.' }
    return true
  }

  vinceSfida(ultimoDanno = 0) {
    const st = this.stanza
    st.momento = 'esito'
    if (st.tipo === 'boss') {
      this.esito = 'vinta'
      st.esito = { em: '👑', tit: `${st.nome} è sconfitto!`,
                   testo: 'La strada verso l\'uscita è libera.' }
      return { che: 'trionfo', danno: ultimoDanno }
    }
    const scheda = STANZE[st.tipo]
    const profondita = this.qui.profondita(this.quanteFile)
    /* IL PATTO DEL BOTTINO: chi è più grosso lascia più spesso e lascia
       roba migliore — ma non oltre quello che il piano si può
       permettere, perché al terzo piano un'arma nuova arriverebbe
       troppo tardi per essere giocata (vedi `gradoBottino`). */
    const quando = TARATURA.lascia[st.tipo] ?? 0
    const grado = gradoBottino(st.tipo, this.piano, this.livello)
    const conTesoro = grado > 0 && this.rnd() < quando
    const tesoro = conTesoro ? this.dammiTesoro(grado) : null
    /* lo scrigno che contiene equipaggiamento non contiene anche le
       gemme: se no aprire uno scrigno sarebbe sempre meglio di
       qualunque altra cosa e il bivio non sarebbe più una scelta */
    const gemme = tesoro && st.tipo === 'scrigno'
      ? 0 : bottinoDi(scheda.ricchezza, profondita, this.rnd)
    if (gemme) this.gemme += gemme
    st.esito = {
      em: st.tipo === 'scrigno' ? '🎁' : st.tipo === 'capo' ? '💀' : '🎉',
      tit: st.tipo === 'scrigno' ? 'Aperto!' : 'Sconfitto!',
      testo: gemme ? `Hai raccolto ${gemme} gemme.` : 'Dentro c\'era qualcosa di meglio delle gemme.',
      gemme,
      /* alla vista serve già leggibile: qui si sa cosa vuol dire una
         chiave, in `viste/` no — ed è giusto che resti così */
      tesoro: tesoro ? { chiave: tesoro, em: TESORI[tesoro].em, nome: TESORI[tesoro].nome } : null,
    }
    return { che: 'vinto', gemme, tesoro, danno: ultimoDanno }
  }

  /* ═══════ le stanze in cui non si risponde ═══════ */
  apriRiposo(s) {
    /* il fuoco prima di un capo rimette in sesto del tutto: si arriva a
       un capo interi, o la strada fatta prima diventa una lotteria */
    const primaDelCapo = TARATURA.curaPrimaDelCapo &&
      s.riga === finePiano(pianoDi(s.riga, this.quanteFile), this.quanteFile) - 1
    const chiave = this.tesoroACaso(gradoBottino('grosso', this.piano, this.livello))
    const pieno = this.vita >= this.vitaMax
    const voci = [
      { chiave: 'riposa', em: '❤️', nome: primaDelCapo ? 'Riposa a lungo' : 'Riposa',
        desc: pieno ? 'Sei già a posto: ti farà bene lo stesso.'
              : primaDelCapo ? 'Recuperi tutta la vita: là dietro c\'è il capo.'
              : `Recuperi ${TARATURA.cura} punti vita.` },
      { chiave: 'allena:attacco', em: '⚔️', nome: 'Allena il braccio',
        desc: `+${TARATURA.allenamento} attacco per il resto della discesa.` },
      { chiave: 'allena:difesa', em: '🛡️', nome: 'Allena la guardia',
        desc: `+${TARATURA.allenamento} difesa per il resto della discesa.` },
    ]
    if (chiave)
      voci.push({ chiave: 'roba', em: TESORI[chiave].em, nome: TESORI[chiave].nome,
                  desc: TESORI[chiave].desc, invece: this.chiLascia(chiave) })
    return {
      che: 'scelte', tipo: 'fuoco', em: '🔥', tit: 'Un fuoco da campo',
      colore: STANZE.fuoco.colore,
      testo: primaDelCapo
        ? 'Le braci scaldano, e dietro la porta si sente respirare qualcosa di grosso.'
        : 'Ti siedi vicino alle braci. C\'è tempo per una cosa sola.',
      esito: null, voci, tesoroOfferto: chiave, primaDelCapo,
    }
  }

  apriMercato() {
    const merce = this.mescola(tesoriPossibili(this.equipaggiamento, gradoBottino('scrigno', this.piano, this.livello)))
      .slice(0, 3).map(k => ({ chiave: k, prezzo: TESORI[k].prezzo, venduto: false }))
    const st = {
      che: 'scelte', tipo: 'negozio', em: '🏪', tit: 'Un mercante',
      colore: STANZE.negozio.colore,
      testo: 'Ha una bancarella pieghevole e un sorriso che non convince.',
      merce, voci: [], esito: null,
    }
    this.stanza = st
    this.rifaiVetrina()
    return st
  }

  rifaiVetrina() {
    const st = this.stanza
    if (!st || st.tipo !== 'negozio') return
    st.voci = st.merce.filter(m => !m.venduto).map(m => ({
      chiave: 'compra:' + m.chiave, em: TESORI[m.chiave].em, nome: TESORI[m.chiave].nome,
      desc: TESORI[m.chiave].desc, prezzo: m.prezzo, spento: this.gemme < m.prezzo,
      invece: this.chiLascia(m.chiave),
    }))
    if (this.vita < this.vitaMax)
      st.voci.push({ chiave: 'pozione', em: POZIONE.em, nome: POZIONE.nome,
                     desc: POZIONE.desc, prezzo: POZIONE.prezzo, spento: this.gemme < POZIONE.prezzo })
    st.voci.push({ chiave: 'via', em: '🚪', nome: 'Vai via', desc: 'La strada aspetta.' })
  }

  apriStranezza() {
    const e = EVENTI[Math.floor(this.rnd() * EVENTI.length)]
    return {
      che: 'scelte', tipo: 'bivio', em: e.em, tit: e.tit, testo: e.testo,
      colore: STANZE.bivio.colore, evento: e.chiave, esito: null,
      voci: e.scelte.map((s, i) => ({
        chiave: 'scelta:' + i, em: '👉', nome: s.nome, desc: s.desc,
        prezzo: s.costo, spento: s.costo ? this.gemme < s.costo : false,
        /* «questa può finire male»: si ricava dagli esiti dichiarati e
           non si scrive a mano, così una stranezza nuova lo dice da sé */
        azzardo: s.esiti.some(x => x.da?.danno),
      })),
    }
  }

  /* Una scelta presa. Torna il cartello da mostrare, o `null` se la
     stanza resta aperta (il mercante: si compra e si resta lì). */
  scegli(chiave) {
    const st = this.stanza
    if (!st || st.che !== 'scelte' || st.esito) return null
    const voce = st.voci.find(v => v.chiave === chiave)
    if (!voce || voce.spento) return null

    if (st.tipo === 'negozio') return this.compra(chiave)
    if (st.tipo === 'fuoco') return this.alFuoco(chiave)
    return this.decidi(Number(chiave.split(':')[1]))
  }

  compra(chiave) {
    const st = this.stanza
    if (chiave === 'via') {
      st.esito = { em: '🚪', tit: 'Alla prossima', testo: 'Il mercante ti saluta con la mano.' }
      return st.esito
    }
    if (chiave === 'pozione') {
      this.gemme -= POZIONE.prezzo
      this.curati(POZIONE.cura)
    } else {
      const k = chiave.split(':')[1]
      const m = st.merce.find(x => x.chiave === k)
      this.gemme -= m.prezzo
      m.venduto = true
      this.prendi(k)
    }
    this.rifaiVetrina()
    return null                    // il mercante resta lì: si può comprare ancora
  }

  alFuoco(chiave) {
    const st = this.stanza
    if (chiave === 'riposa') {
      if (this.vita >= this.vitaMax) {
        /* chi è già pieno non spreca la sosta: la vita massima sale, e
           resta su per tutta la discesa */
        this.vitaMax += TARATURA.cura
        this.vita = this.vitaMax
        st.esito = { em: '❤️', tit: 'Più resistente',
                     testo: `Eri già a posto: il fuoco ti ha irrobustito. +${TARATURA.cura} vita massima.` }
      } else {
        const prima = this.vita
        this.curati(st.primaDelCapo ? this.vitaMax : TARATURA.cura)
        st.esito = { em: '❤️', tit: 'Riposato',
                     testo: `+${this.vita - prima} punti vita. Si riparte.` }
      }
    } else if (chiave.startsWith('allena:')) {
      const quale = chiave.split(':')[1]
      if (quale === 'attacco') this.attaccoBase += TARATURA.allenamento
      else this.difesaBase += TARATURA.allenamento
      st.esito = { em: quale === 'attacco' ? '⚔️' : '🛡️',
                   tit: quale === 'attacco' ? 'Braccio più forte' : 'Guardia più solida',
                   testo: `+${TARATURA.allenamento} ${quale}. Adesso sei ${this.attacco} e ${this.difesa}.` }
    } else {
      const k = st.tesoroOfferto
      const lasciato = this.prendi(k)
      st.esito = { em: TESORI[k].em, tit: TESORI[k].nome,
                   testo: lasciato ? `${TESORI[k].desc} Lasci ${TESORI[lasciato].nome}.` : TESORI[k].desc }
    }
    return st.esito
  }

  decidi(quale) {
    const st = this.stanza
    const e = EVENTI.find(x => x.chiave === st.evento)
    const scelta = e.scelte[quale]
    if (scelta.costo) this.gemme -= scelta.costo

    /* l'esito si pesca fra quelli dichiarati, col loro peso */
    const totale = scelta.esiti.reduce((n, x) => n + x.peso, 0)
    let tiro = this.rnd() * totale
    const esito = scelta.esiti.find(x => (tiro -= x.peso) < 0) || scelta.esiti[0]

    const da = esito.da || {}
    const coda = []
    if (da.gemme) { this.gemme += da.gemme; coda.push(`+${da.gemme} 💎`) }
    /* le stranezze parlano ancora di «cuori» perché è la parola che usa
       il racconto: qui si traducono in punti vita, una volta sola */
    if (da.cuore) { const q = TARATURA.cura * da.cuore; this.curati(q); coda.push(`+${q} ❤️`) }
    if (da.cuoriMax) {
      const q = TARATURA.cura * da.cuoriMax
      this.vitaMax += q; this.vita += q; coda.push(`+${q} ❤️ per sempre`)
    }
    if (da.tesoro) {
      const k = this.dammiTesoro(gradoBottino('grosso', this.piano, this.livello))
      coda.push(k ? `${TESORI[k].em} ${TESORI[k].nome}` : '+ gemme')
    }
    if (da.danno) {
      const q = Math.max(1, colpoDelMostro(TARATURA.cura * da.danno, this.difesa))
      if (this.ferisci(q)) { this.stanza = null; return null }
      coda.push(`−${q} ❤️`)
    }

    st.esito = { em: esito.em, tit: esito.tit, testo: esito.testo, coda: coda.join(' · ') }
    return st.esito
  }

  /* Si esce dalla stanza. Se era il guardiano, la corsa è finita. */
  esci() {
    if (this.stanza?.che === 'scelte' && this.stanza.tipo === 'negozio' && !this.stanza.esito)
      this.stanza.esito = { em: '🚪', tit: 'Alla prossima', testo: '' }
    this.stanza = null
    return this.dove
  }

  /* ═══════ i conti ═══════ */
  ferisci(quanti = 1) {
    this.vita -= quanti
    this.persi += quanti
    if (this.vita <= 0) {
      this.vita = 0
      this.esito = 'persa'
      this.stanza = null
      return true
    }
    return false
  }

  curati(quanti = 1) { this.vita = Math.min(this.vitaMax, this.vita + quanti) }

  /* Un pezzo di equipaggiamento fra quelli che varrebbe la pena
     prendere, non oltre il grado che quella stanza si può permettere. */
  tesoroACaso(gradoMax = 3) {
    const possibili = tesoriPossibili(this.equipaggiamento, gradoMax)
    return possibili.length ? possibili[Math.floor(this.rnd() * possibili.length)] : null
  }

  /* Cosa verrebbe lasciato prendendo `chiave`: serve alla schermata per
     scrivere «al posto di 🗡️ Spadino» **prima** che si tocchi, che è
     l'unico momento in cui l'informazione serve. Torna già scritto,
     non una chiave: chi disegna non sa cosa vuol dire "spadino". */
  chiLascia(chiave) {
    const t = TESORI[chiave]
    if (!t?.casella) return null
    const vecchio = this[t.casella]
    return vecchio ? `${TESORI[vecchio].em} ${TESORI[vecchio].nome}` : null
  }

  /* Il bottino di una stanza vinta. Se non c'è più niente che valga la
     pena, torna `null` e chi ha chiamato dà gemme: un premio che non
     arriva è peggio di un premio piccolo. */
  dammiTesoro(gradoMax = 3) {
    const k = this.tesoroACaso(gradoMax)
    if (!k) return null
    this.prendi(k)
    return k
  }

  /* Mette addosso un oggetto. Torna la chiave di quello che ha
     sostituito, o `null`. Un oggetto peggiore di quello che si ha già
     non si prende: sarebbe un premio che toglie. */
  prendi(chiave) {
    const t = TESORI[chiave]
    if (!t) return null
    if (t.casella && !meglioDi(chiave, this.equipaggiamento)) return null
    this.tesori++
    if (t.casella) {
      const lasciato = this[t.casella]
      this[t.casella] = chiave
      /* quello che si è appena lasciato, già scritto: serve al cartello
         del bottino, che deve poter dire «lasci lì 🗡️ Spadino» senza
         andare a rovistare in una casella che ormai è cambiata */
      this.ultimoLasciato = lasciato
        ? `${TESORI[lasciato].em} ${TESORI[lasciato].nome}` : null
      return lasciato
    }
    this.ultimoLasciato = null
    this.presi[chiave] = true
    if (t.vitaMax) { this.vitaMax += t.vitaMax; this.curati(t.vitaMax) }
    if (t.effetto === 'lontano') this.illumina()
    return null
  }

  mescola(lista) {
    const a = lista.slice()
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.rnd() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  /* ═══════ com'è finita ═══════ */
  get stelle() { return this.vinta ? stellePerVita(this.vita, this.vitaMax) : 0 }
  /* le monete vere della cameretta: le porta la tappa, non il bottino */
  get monete() { return this.vinta ? this.tappa.premio * this.stelle : 0 }

  /* ═══════ quello che serve a chi disegna ═══════
     La vista non guarda dentro la mappa: riceve una fila di fatti già
     decisi. Qui non si disegna niente — si dice **cosa** c'è, mai come
     va dipinto. */
  /* dove si è dentro il piano: serve solo alla riga sotto la mappa
     («piano 2 di 3 — fila 5 di 14»), che è come si legge una discesa
     lunga senza contare quaranta pallini */
  get filaNelPiano() { return this.riga - inizioPiano(this.piano, this.quanteFile) + 1 }
  get fileDelPiano() {
    return finePiano(this.piano, this.quanteFile) - inizioPiano(this.piano, this.quanteFile) + 1
  }

  vetrina() {
    const apertiId = new Set(this.aperte().map(s => s.id))
    const y = r => this.quanteFile > 1 ? r / (this.quanteFile - 1) : 1
    const da = this.qui
    return this.mappa.tutte.map(s => {
      const aperta = apertiId.has(s.id)
      const k = da ? da.verso.findIndex(v => v.id === s.id) : -1
      return {
        id: s.id, riga: s.riga, x: s.xn, y: y(s.riga),
        tipo: s.tipo, icona: s.icona, colore: s.colore, rischio: s.rischio,
        piano: pianoDi(s.riga, this.quanteFile),
        nome: STANZE[s.tipo].nome, dritta: STANZE[s.tipo].dritta,
        /* quanti scambi costerebbe **come sei messo adesso**: è la
           promessa del bivio, e cambia quando trovi una spada. Senza,
           il bollino direbbe una cosa vera ieri. */
        scambi: this.scambiPer(s),
        stato: this.qui?.id === s.id ? 'qui'
          : aperta ? 'aperta'
          : s.fatta ? 'fatta'
          : s.vista ? 'chiusa' : 'buio',
        /* da dove ci si arriva e con che curva: serve a chi anima la
           pedina, che così non deve andarsi a cercare il sentiero
           giusto fra tutti quelli disegnati. Chi entra adesso nel
           dungeon viene da sotto la mappa. */
        partenza: !aperta ? null : da ? { x: da.xn, y: y(da.riga) } : { x: s.xn, y: -0.14 },
        curva: k >= 0 ? da.curve[k] : 0,
      }
    })
  }

  /* Quanti scambi costa una stanza con l'equipaggiamento di adesso.
     Il conto è quello di `eroe.js` sulle ossa medie della taglia: non
     si tira il caso qui, o la mappa prometterebbe un numero e lo
     scontro ne userebbe un altro. */
  scambiPer(s) {
    const scheda = STANZE[s.tipo]
    if (!scheda.taglia) return 0
    const forza = forzaDi(this.livello, s.profondita(this.quanteFile))
    const ossa = ossaDi(scheda.taglia, forza, () => 0.5)
    return scambiPerAbbattere(ossa.vita, this.attacco, ossa.difesa)
  }

  sentieri() {
    const apertiId = new Set(this.aperte().map(s => s.id))
    const fuori = []
    const y = r => this.quanteFile > 1 ? r / (this.quanteFile - 1) : 1
    for (const s of this.mappa.tutte)
      s.verso.forEach((b, k) => fuori.push({
        ax: s.xn, ay: y(s.riga), bx: b.xn, by: y(b.riga), curva: s.curve[k],
        stato: this.qui?.id === s.id && apertiId.has(b.id) ? 'acceso'
          : s.fatta && b.fatta ? 'fatto' : 'spento',
      }))
    return fuori
  }
}
