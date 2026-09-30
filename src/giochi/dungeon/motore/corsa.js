// Una corsa: le regole a classi, senza schermo (niente canvas, Vue o
// monete). Non sa nemmeno cosa sia una domanda: chiede una difficoltà 0..1 e
// aspetta un sì/no — Gioco.vue è l'unico che sa cos'è una materia. Questa
// ignoranza è ciò che permette al banco di giocare mille discese in Node.
// Le formule dello scontro sono in dati/eroe.js: vedi COMBATTIMENTO.md.
// Sbagliare non finisce mai la corsa in un colpo solo: si perde solo finendo la vita.
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
    // alza insieme le ossa dei mostri (forzaDi) e le statistiche dell'eroe (statisticheBase)
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

  get equipaggiamento() { return { mano: this.mano, addosso: this.addosso, presi: this.presi } }
  get attacco() { return this.attaccoBase + bonusDi(this.equipaggiamento).attacco }
  get difesa() { return this.difesaBase + bonusDi(this.equipaggiamento).difesa }

  // la stanza viene prima dell'esito: battuto il guardiano si deve poter leggere "sconfitto!" prima del riepilogo
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
      // una serratura non è viva: mostra la sua icona, non pesca fra i mostri di casa
      faccia: scheda.taglia === 'serratura'
        ? scheda.icona
        : faccia(this.tappa.ambiente, s.tipo, this.rnd),
      taglia: scheda.taglia,   // chi disegna sa solo che è un "capo", non che ha vita tripla
      colore: scheda.colore,
      mostro: { ...ossa, vitaMax: ossa.vita },
      difficolta: s.difficolta,   // la stessa che il bollino ⚡ ha già mostrato sulla mappa
      sfuma: !!scheda.sfuma,
      scappabile: !!scheda.scappabile,
      colpito: null,
      esito: null,
    }
  }

  rispondi(giusto) {
    const st = this.stanza
    if (!st || st.che !== 'sfida' || st.momento !== 'domanda') return null
    this.domande++
    const m = st.mostro

    if (giusto) {
      const danno = colpoDellEroe(this.attacco, m.difesa)
      m.vita = Math.max(0, m.vita - danno)
      if (m.vita <= 0) return this.vinceSfida(danno)
      const graffio = st.tipo === 'scrigno' ? 0 : GRAFFIO   // la serratura non graffia: non è viva
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

  continua() {
    const st = this.stanza
    if (!st || st.momento !== 'colpito') return false
    st.momento = 'domanda'
    st.colpito = null
    return true
  }

  // scappare costa il bottino, non la pelle: la stanza resta fatta e non dà niente
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
    // chi è più grosso lascia più spesso, ma non oltre quanto il piano si può permettere: COMBATTIMENTO.md
    const quando = TARATURA.lascia[st.tipo] ?? 0
    const grado = gradoBottino(st.tipo, this.piano, this.livello)
    const conTesoro = grado > 0 && this.rnd() < quando
    const tesoro = conTesoro ? this.dammiTesoro(grado) : null
    // lo scrigno con equipaggiamento non dà anche gemme, o sarebbe sempre la scelta migliore
    const gemme = tesoro && st.tipo === 'scrigno'
      ? 0 : bottinoDi(scheda.ricchezza, profondita, this.rnd)
    if (gemme) this.gemme += gemme
    st.esito = {
      em: st.tipo === 'scrigno' ? '🎁' : st.tipo === 'capo' ? '💀' : '🎉',
      tit: st.tipo === 'scrigno' ? 'Aperto!' : 'Sconfitto!',
      testo: gemme ? `Hai raccolto ${gemme} gemme.` : 'Dentro c\'era qualcosa di meglio delle gemme.',
      gemme,
      // già leggibile qui: in viste/ non si sa cosa vuol dire una chiave
      tesoro: tesoro ? { chiave: tesoro, em: TESORI[tesoro].em, nome: TESORI[tesoro].nome } : null,
    }
    return { che: 'vinto', gemme, tesoro, danno: ultimoDanno }
  }

  apriRiposo(s) {
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
        azzardo: s.esiti.some(x => x.da?.danno),   // ricavato dagli esiti dichiarati, non scritto a mano
      })),
    }
  }

  // torna il cartello da mostrare, o null se la stanza resta aperta (il mercante)
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
        // chi è già pieno non spreca la sosta: sale la vita massima, per tutta la discesa
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

    // pescato fra gli esiti dichiarati, col loro peso
    const totale = scelta.esiti.reduce((n, x) => n + x.peso, 0)
    let tiro = this.rnd() * totale
    const esito = scelta.esiti.find(x => (tiro -= x.peso) < 0) || scelta.esiti[0]

    const da = esito.da || {}
    const coda = []
    if (da.gemme) { this.gemme += da.gemme; coda.push(`+${da.gemme} 💎`) }
    // le stranezze parlano di "cuori" (il racconto), qui si traducono in punti vita
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

  esci() {
    if (this.stanza?.che === 'scelte' && this.stanza.tipo === 'negozio' && !this.stanza.esito)
      this.stanza.esito = { em: '🚪', tit: 'Alla prossima', testo: '' }
    this.stanza = null
    return this.dove
  }

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

  tesoroACaso(gradoMax = 3) {
    const possibili = tesoriPossibili(this.equipaggiamento, gradoMax)
    return possibili.length ? possibili[Math.floor(this.rnd() * possibili.length)] : null
  }

  // cosa verrebbe lasciato prendendo `chiave`, già scritto (chi disegna non sa cosa vuol dire una chiave)
  chiLascia(chiave) {
    const t = TESORI[chiave]
    if (!t?.casella) return null
    const vecchio = this[t.casella]
    return vecchio ? `${TESORI[vecchio].em} ${TESORI[vecchio].nome}` : null
  }

  // se non resta niente che valga, torna null e chi chiama dà gemme
  dammiTesoro(gradoMax = 3) {
    const k = this.tesoroACaso(gradoMax)
    if (!k) return null
    this.prendi(k)
    return k
  }

  // torna la chiave sostituita, o null. Un oggetto peggiore di quello che si ha non si prende
  prendi(chiave) {
    const t = TESORI[chiave]
    if (!t) return null
    if (t.casella && !meglioDi(chiave, this.equipaggiamento)) return null
    this.tesori++
    if (t.casella) {
      const lasciato = this[t.casella]
      this[t.casella] = chiave
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

  get stelle() { return this.vinta ? stellePerVita(this.vita, this.vitaMax) : 0 }

  // dove si è dentro il piano: la riga sotto la mappa ("piano 2 di 3 — fila 5 di 14")
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
        scambi: this.scambiPer(s),   // come sei messo ADESSO: cambia quando trovi una spada
        stato: this.qui?.id === s.id ? 'qui'
          : aperta ? 'aperta'
          : s.fatta ? 'fatta'
          : s.vista ? 'chiusa' : 'buio',
        // da dove si arriva e con che curva, per chi anima la pedina (chi entra viene da sotto la mappa)
        partenza: !aperta ? null : da ? { x: da.xn, y: y(da.riga) } : { x: s.xn, y: -0.14 },
        curva: k >= 0 ? da.curve[k] : 0,
      }
    })
  }

  // ossa medie della taglia, senza tirare il caso: o la mappa prometterebbe un numero e lo scontro ne userebbe un altro
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
