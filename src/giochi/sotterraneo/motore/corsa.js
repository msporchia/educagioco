// Una discesa: le regole senza schermo, gira in Node (il banco può giocare
// seicento discese e contare le domande). L'esercizio è la chiave, la spada
// e il piede di porco — ogni cosa costa una risposta (docs/sotterraneo/regole.md).
// Il motore dice solo `chiesta` (quanto dev'essere difficile); Gioco.vue va
// a prendere la domanda vera da src/quiz/ e non nomina mai una materia qui.
// `foglio` è un dato ({ che: 'scontro', chi }): finché è aperto il tempo è fermo.
import {
  TASCHE, RAGGIO, RAGGIO_TORCIA, RAGGIO_SGOCCIOLI, SVEGLIA, PASSO_EROE, PASSO_MOSTRO, PASSO_RIENTRO,
  CALMA, SORSO, RIPOSO_SCALA, VITA_PER_PIANO,
  ARREDO_DICE, ARREDO_LA_PRIMA_VOLTA,
} from '../dati/mondo.js'
import { MOSTRI } from '../dati/mostri.js'
import { SCENARI, SCENARIO } from '../dati/tessere.js'
import { DI_PARTENZA } from '../dati/eroi.js'
import { COSE, NEI_FORZIERI, pescaCosa, aLivello } from '../dati/cose.js'
import { CURIOSITA_DI, MALUS } from '../dati/curiosita.js'
import { durezzaDi, guardianoDi, svenimentiDi, formaDi, crescitaDi, brancoDi, scenarioDi, trattoDi, livelloDelPosto }
  from '../dati/campagna.js'
import { grossoDi, GROSSI } from '../dati/grossi.js'
import { valoreDelLivello } from '../dati/pezzi.js'
import { espDi } from '../dati/livelli.js'
import { espNellaZona } from '../dati/zone.js'
import { pezzoNuovo, pezzoDelGrosso, pezzoDalMostro, livelloDelBottino } from './bottino.js'
import { generaPiano } from './livello.js'
import { percorso, viaVerso, primaLibera } from '../../../motore/passi.js'
import { Corredo } from './corredo.js'
import { dai as daiPunto } from './crescita.js'
import { indiceDella, premioPer } from './storia.js'
import { robaDellaMissione } from './missioni.js'
import { pericoloDi } from './pericolo.js'
import { NODI, ENERGIA_PER_RISPOSTA, aGrado, inVita, colpisce } from '../dati/abilita.js'

// nella storia i forzieri e i mostri di tutti i giorni danno solo quello che si consuma: la roba la dà la riga
// della storia (dati/storia.js), o la discesa diventerebbe una lotteria e la tabella una bugia
const SI_CONSUMA = k => !!(COSE[k] && COSE[k].usa)
const NEI_FORZIERI_DELLA_STORIA = NEI_FORZIERI.filter(SI_CONSUMA)

// quanto rincara la domanda, per ogni cosa: la porta meno del piano, il forziere molto di più
const RINCARO = { porta: -0.05, forziere: 0.25, fonte: 0, mostro: 0.05, capo: 0.2,
  curiosita: 0 }

// la roba dell'avventuriero (gemme, addosso, tasche, torce) sta in Corredo e scende con lui: `roba` è quella
// che si porta da sopra (motore/corredo.js); vita e piano sono della discesa, e restano giù
export class Corsa extends Corredo {
  // `missioni`: quelle prese che riguardano questa discesa (motore/missioni.js, presePer)
  // `crescita`: l'esperienza e i punti dell'avventura (motore/crescita.js): l'eroe sale di livello anche giù
  constructor(tappa, { seme = null, rnd = Math.random, eroe = DI_PARTENZA, roba = null, missioni = [], crescita = null } = {}) {
    super({ eroe, roba, crescita })
    this.tappa = tappa
    // il posto nella storia (−1 l'abisso, che pesca come sempre): dice cosa deve dare questa discesa
    this.indice = indiceDella(tappa)
    this.missioni = missioni || []
    this.missioniFatte = new Set()   // le cose trovate e i mostri col nome battuti: Gioco.vue li porta nell'avventura
    this.rnd = rnd
    this.seme = seme == null ? Math.floor(rnd() * 100000) : seme
    this.piano = 0
    this.fondo = 0              // il piano più profondo toccato in questa discesa (da 0): scendere più in là è nuovo, rifare un piano no
    this.piani = new Map()      // i piani lasciati alle spalle, com'erano (lasciaIlPiano): si risale da dove si è comparsi

    // la vita in più presa in questa discesa (i piani, l'elisir, una curiosità): resta giù, come la vita
    this.vitaPiu = 0
    // l'esperienza presa in questa discesa, e quello che si vede succedere: un livello salito, un leggendario caduto
    // (Gioco.vue li festeggia, uno alla volta). `trovati` i leggendari presi, per la pagina «Tesori»
    this.espPresa = 0
    this.eventi = []
    this.trovati = new Set()
    this.stanzaOra = null   // unità in cui brucia la torcia (bruciaLaTorcia)

    this.foglio = null          // cosa è aperto adesso, o niente
    this.pronta = null          // l'abilità preparata per la prossima risposta giusta (docs/sotterraneo/abilita.md)
    this.fiatoUsato = false     // «Ultimo fiato»: una volta per discesa
    this.chiesta = null         // la domanda che serve: { id, che, difficolta }
    this.contaChieste = 0

    this.finita = false
    this.vinta = false
    this.svenimenti = 0
    this.svenimentiQui = 0   // spesi su QUESTO piano: solo l'abisso li azzera scendendo
    this.ultimoSvenimento = false   // l'ultima occasione è stata usata: riprendi() risale invece di rimettere in piedi
    this.perche = null
    this.dettoDellArredo = false   // la regola dell'arredo si spiega una volta per discesa
    this.domande = 0
    this.giuste = 0   // quante di quelle `domande` erano giuste: paga l'abisso, risalendo (docs/sotterraneo/abisso-progetto.md)
    this.mostriBattuti = 0
    this.tesori = 0
    this.stanzeViste = 0
    this.pianiFatti = 0

    this.nuovoPiano()
    this.posaLeMissioni()
    // le torce comprate di sopra aspettano alla cintura: si scende con una accesa, come se la si fosse appena presa
    if (!this.torciaAccesa && this.torceInScorta > 0) {
      this.torceInScorta--
      this.accendi('torcia')
    }
    // la roba di prima delle avventure (una per tutti) può avere addosso quello che non porta: in tasca, o per terra
    this.sistemaIlCorredo()
    this.vita = this.vitaMax   // si scende in piedi: col dito o l'amuleto il massimo è già più alto
    this.energia = this.energiaMax   // e con l'energia piena
  }

  // la cosa da trovare e il mostro col nome stanno nel loro piano, sopra quello nato dal seme: la sosta li
  // salva fra le cose nuove, e chi riprende dopo aver preso una missione se la ritrova (motore/sosta.js)
  posaLeMissioni() {
    for (const m of this.missioni) {
      if (m.piano !== this.piano || this.missioniFatte.has(m.id)) continue
      if (this.livello.robe.some(r => r.missione === m.id)) continue
      const r = robaDellaMissione(this.livello, m, this.tappa)
      if (r) this.livello.robe.push(r)
    }
  }

  // non è un campo: cresce coi piani (vitaPiu), coi livelli (piu.vita) e con il dito, o si scorderebbe di alzarla/abbassarla
  get vitaMax() { return this.io.vita + this.piu.vita + this.vitaPiu + this.addosso('vita') + this.sempre('vitaPiu') }
  // il livello del posto (dati/campagna.js): dice il livello del bottino e quanto valgono le gemme
  get livelloQui() { return livelloDelPosto(this.tappa, this.piano) }
  get livelloDelBottino() { return livelloDelBottino(this.livelloQui, this.livelloEroe) }
  get quantiPiani() { return this.tappa.piani }

  // l'abisso non ha un ultimo piano: `piani: Infinity` lo rende già falso da sé, ma serve dirlo per nome a chi legge
  get senzaFondo() { return !!this.tappa.abisso }
  // come si disegna questo piano (null: lo scenario di ripiego), e nell'abisso il nome del posto
  get scenario() { return scenarioDi(this.tappa, this.piano) }
  get posto() { const t = trattoDi(this.tappa, this.piano); return t ? t.nome : null }

  // nella campagna il conto è di tutta la discesa, nell'abisso è di questo piano
  get svenimentiConcessi() { return svenimentiDi(this.tappa) }
  get svenimentiSpesi() { return this.senzaFondo ? this.svenimentiQui : this.svenimenti }

  // quello che non trova posto in tasca resta per terra, dove ci si può tornare: nella discesa non si perde niente
  nonCiSta(k) {
    this.posaRoba({ che: 'cosa', cosa: k, em: COSE[k].em },
                  { x: Math.floor(this.eroe.x), y: Math.floor(this.eroe.y) })
  }

  luceCambiata() { if (this.livello) this.aggiornaLuce() }

  // togliendo un amuleto il massimo scende, e la vita lo segue
  sistemaIlCorredo() {
    super.sistemaIlCorredo()
    this.vita = Math.min(this.vita, this.vitaMax)
  }

  // il fuoco dei pezzi brucia anche chi para: si somma dopo la difesa del mostro. Con un'abilità (`nodo`, dati/abilita.js)
  // il colpo vale `per` volte, e `passa` o un mostro rotto non contano la difesa. Un mostro gelato prende di più (Gelo profondo)
  colpo(m, nodo = null) {
    const g = nodo ? this.grado(nodo.id) : 0
    const st = m.stati || {}
    const passa = st.rotto || (nodo && (nodo.passa || this.delRamo(nodo, 'passa')))
    // Gelo profondo è una percentuale: un +1 fisso non terrebbe il passo con l'attacco che cresce
    const gelo = st.debole > 0 ? 1 + this.sempre('geloPiu') / 100 : 1
    const base = Math.max(1, Math.round((this.att + this.sempre('colpoPiu') + this.delRamo(nodo, 'piu') - (passa ? 0 : m.dif)) * gelo))
    let per = nodo ? (aGrado(nodo, 'per', g) || 1) : 1
    if (nodo && nodo.seStordito && !(st.veleno || st.debole > 0 || st.fermo > 0)) per = nodo.altrimenti || 1
    return Math.round(base * per) + this.addosso('fuoco')
  }
  colpiPer(m) { return Math.max(1, Math.ceil(m.ossa / this.colpo(m))) }
  danno(m) { return Math.max(1, m.att - this.dif) }

  // un mostro picchia sempre: metà del colpo pieno anche rispondendo bene, o le pozioni non servirebbero a niente (docs/sotterraneo/regole.md).
  // La Parata del cavaliere lo limatura (fino a zero)
  graffio(m) { return Math.max(this.sempre('graffioMeno') ? 0 : 1, Math.floor(this.danno(m) / 2) - this.sempre('graffioMeno')) }

  // Quanto arriva davvero a questo scambio, con gli effetti delle abilità (docs/sotterraneo/abilita.md): stordito non
  // colpisce, parato non graffia, gelato colpisce a metà, «Testa dura» dimezza i primi colpi pieni, «Montagna» non fa
  // passare niente. Non tocca niente: lo scudo e lo specchio si consumano in rispostaScontro. È anche il numero detto
  // prima di rispondere («ti graffia 2 · se sbagli 4»)
  botta(m, giusto, { quieto = false } = {}) {
    const f = this.foglio && this.foglio.che === 'scontro' ? this.foglio : null
    const io = (f && f.io) || {}
    const st = m.stati || {}
    if (st.fermo > 0 || io.intoccabile > 0) return 0
    if (giusto && (quieto || io.parato > 0)) return 0
    let x = giusto ? this.graffio(m) : this.danno(m)
    if (!giusto && f && (f.pieni || 0) < this.sempre('testaDura')) x = Math.ceil(x / 2)
    if (st.debole > 0) x = Math.floor(x / 2)
    return Math.max(0, x)
  }
  // scappare costa un graffio: se il graffio fa cadere non è una fuga, e il tasto non si offre
  puoScappare(m) { return this.graffio(m) < this.vita }

  durezza(rincaro = 0) {
    return Math.max(0, Math.min(1, durezzaDi(this.tappa, this.piano) + rincaro))
  }

  // il piano `p` dal seme, con la scala che sale nel punto esatto dove si arriva (docs/sotterraneo/scala-che-sale.md)
  faiIlPiano(p) {
    const t = this.tappa
    // la forma la chiede alla tappa per QUESTO piano (nell'abisso gira fra tre); il piano è funzione del seme, rientrando torna identico
    const forma = formaDi(t, p)
    const livello = generaPiano({
      seme: this.seme + p * 7919, piano: p,
      largo: forma.largo, alto: forma.alto, giri: forma.giri,
      guardiano: guardianoDi(t, p),
      grosso: grossoDi(t, p),
      crescita: crescitaDi(t),
      branco: brancoDi(t, p),
    })
    // nell'abisso il primo piano non ha da dove risalire: là la strada su è il portale
    if (p > 0 || !t.abisso) {
      const dentro = livello.stanze[0]
      livello.robe = livello.robe.filter(r => !(r.che === 'gemme' && r.x === dentro.cx && r.y === dentro.cy))
      livello.robe.push({ che: 'scala-su', x: dentro.cx, y: dentro.cy, em: '🪜', nome: 'La scala che sale' })
    }
    return livello
  }

  nuovoPiano() {
    this.livello = this.faiIlPiano(this.piano)
    this.fondo = Math.max(this.fondo, this.piano)
    // com'è nato: la sosta salva solo quello che cambia rispetto a qui (motore/sosta.js)
    this.robeDelSeme = this.livello.robe.map(r => ({ ...r }))
    const dentro = this.livello.stanze[0]
    this.eroe = { x: dentro.cx + 0.5, y: dentro.cy + 0.5 }
    this.guarda = 'dx'
    this.strada = null
    this.mira = null
    this.bersaglio = null
    // dal piano generato, non dalla tappa: da quando l'abisso cambia forma scendendo, potevano divergere
    this.visto = new Uint8Array(this.livello.largo * this.livello.alto)
    this.luce = new Set()
    this.occhi = new Set()
    this.stanzaIntera = null
    this.segnaLaStanza()
    this.chiaveDelPiano = false
    this.stanzeDentro = new Set()
    this.aggiornaLuce()
  }

  // con la torcia piena una stanza si accende tutta e il raggio è lungo; senza, o agli sgoccioli, si vede solo attorno
  // all'eroe, anche dentro una stanza (docs/sotterraneo/regole.md, «La luce»)
  get torciaAgliSgoccioli() { return this.torciaAccesa && this.torciaResta <= 1 && !this.torceInScorta }
  get stanzaTuttaAccesa() { return this.torciaAccesa && !this.torciaAgliSgoccioli }
  get raggioDellaLuce() {
    const base = !this.torciaAccesa ? RAGGIO : this.torciaAgliSgoccioli ? RAGGIO_SGOCCIOLI : RAGGIO_TORCIA
    return base + this.addosso('luce')
  }

  aggiornaLuce() {
    const L = this.livello.largo, A = this.livello.alto
    const cx = Math.floor(this.eroe.x), cy = Math.floor(this.eroe.y)
    this.luce = new Set()
    const accendi = (x, y) => {
      if (x < 0 || y < 0 || x >= L || y >= A) return
      this.luce.add(y * L + x)
      this.visto[y * L + x] = 1
    }
    const raggio = this.raggioDellaLuce
    const r = Math.ceil(raggio) + 1
    for (let x = cx - r; x <= cx + r; x++) for (let y = cy - r; y <= cy + r; y++)
      if (Math.hypot(x - cx, y - cy) <= raggio) accendi(x, y)

    const st = this.livello.stanzaDi(cx, cy)
    this.stanzaIntera = null
    if (st && cx >= st.x - 1 && cy >= st.y - 1 && cx <= st.x + st.w && cy <= st.y + st.h) {
      if (this.stanzaTuttaAccesa) {
        this.stanzaIntera = st.id
        for (let x = st.x - 1; x <= st.x + st.w; x++)
          for (let y = st.y - 1; y <= st.y + st.h; y++) accendi(x, y)
      }
      // entrare in una stanza si conta anche al buio: è l'eroe a esserci, non la luce
      if (!this.stanzeDentro.has(st.id)) { this.stanzeDentro.add(st.id); this.stanzeViste++ }
    }
  }

  // un mostro sveglio si vede sempre, anche fuori dal raggio: l'hai visto svegliarsi, e uno che ti insegue dal buio senza
  // farsi vedere sarebbe un colpo preso senza poterlo evitare
  inLuce(k) { return this.luce.has(k) || this.occhi.has(k) }

  luceDi(x, y) {
    const k = y * this.livello.largo + x
    return this.inLuce(k) ? 2 : this.visto[k] ? 1 : 0
  }

  // un mostro che dorme è un ostacolo da aggirare (si sceglie chi pagare); uno sveglio no, perché si sta muovendo
  bloccata(x, y) {
    return this.livello.robe.some(r => r.x === x && r.y === y && !r.morto && !r.presa &&
      ((r.che === 'mostro' && !r.sveglio) || (r.che === 'porta' && !r.aperta)))
  }

  buona() {
    return (x, y) => this.livello.calpestabile(x, y) && !this.bloccata(x, y)
  }

  // si guarda prima esattamente dove il dito è caduto, e solo se lì non c'è niente si allarga: un
  // forziere già aperto smette di essere toccabile (spegne, non ruba il tocco alla roba sopra); la roba
  // per terra invece resta toccabile anche senza calpestarla
  toccabile(r) {
    if (r.presa || r.morto) return false
    if (!this.inLuce(r.y * this.livello.largo + r.x)) return false
    if (r.che === 'porta') return !r.aperta
    if (r.che === 'forziere') return !r.aperto
    if (r.che === 'curiosita') return !r.visto   // una volta sola, poi è arredo
    return ['mostro', 'fonte', 'scala', 'scala-su', 'cosa', 'gemme', 'portale'].includes(r.che)
  }

  // le gemme si prendono camminandoci sopra: restano toccabili senza rubare il tocco a un forziere accanto
  cosaC(c, largo = 1.2) {
    const dritto = this.livello.robe.find(r => r.x === c.x && r.y === c.y && this.toccabile(r))
    if (dritto) return dritto
    let vicina = null, quanto = 9
    for (const r of this.livello.robe) {
      // la scala che sale si tocca solo sulla sua cella: l'eroe ci nasce sopra, e un tocco vicino non deve aprirla
      if (r.che === 'gemme' || r.che === 'scala-su' || !this.toccabile(r)) continue
      const d = Math.hypot(r.x - c.x, r.y - c.y)
      if (d <= largo && d < quanto) { quanto = d; vicina = r }
    }
    return vicina
  }

  // la prima volta spiega la regola dell'arredo, dopo dice solo cos'è (una volta per discesa, o diventa rumore)
  diCheCosaC(c) {
    const a = this.livello.robe.find(r => r.che === 'arredo' && r.x === c.x && r.y === c.y)
    if (!a) return
    if (!this.dettoDellArredo) {
      this.dettoDellArredo = true
      this.dillo(ARREDO_LA_PRIMA_VOLTA)
      return
    }
    const sua = (SCENARI[this.scenario || SCENARIO] || {}).dice || {}
    this.dillo(sua[a.pezzo] || ARREDO_DICE[a.pezzo] || 'Non c\'è niente da fare, qui.')
  }

  sopra(che) { return ['scala', 'scala-su', 'fonte', 'cosa', 'gemme'].includes(che) }

  // `preciso` distingue il tocco dal trascinamento: trascinando l'eroe insegue senza aprire pannelli
  vaiVerso(c, preciso = true) {
    if (this.foglio || this.finita) return
    const mira = preciso ? this.cosaC(c) : null
    // un tocco su una cassa non resta muto, ma guarda solo la cella premuta (l'arredo non ruba il tocco a un forziere accanto)
    if (preciso && !mira) this.diCheCosaC(c)
    const da = { x: Math.floor(this.eroe.x), y: Math.floor(this.eroe.y) }
    const buona = this.buona()
    // accanto vuol dire da un lato a cui si arriva, non il più vicino in linea d'aria: viaVerso prova i lati in ordine di comodità
    const via = mira
      ? viaVerso(buona, mira, da, { sopra: this.sopra(mira.che) })
      : (buona(c.x, c.y) ? { dove: c, strada: percorso(buona, da, c) } : null)

    if (!via) { this.bersaglio = null; return }   // spegne il segno: lasciarlo acceso pulsa su un posto dove non si va più
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

  // col foglio aperto non si muove niente: un mostro che arriva mentre si legge è un colpo mai visto arrivare
  passo(dt) {
    if (this.foglio || this.finita) return
    this.muoviMostri(Math.min(0.05, dt))
    if (this.foglio) return                 // un mostro ci ha raggiunti
    this.muoviEroe(Math.min(0.05, dt))
  }

  // un mostro dorme finché non ti avvicini nella sua stanza (SVEGLIA celle, con la luce o senza), e smette appena esci:
  // è la regola che rende la stanza un confine. Appena sveglio si vede, anche da lontano e al buio (inLuce): non ti
  // salta addosso da un buio in cui non potevi vederlo (docs/sotterraneo/regole.md, «La luce»)
  muoviMostri(dt) {
    const cella = { x: Math.floor(this.eroe.x), y: Math.floor(this.eroe.y) }
    const mia = this.livello.stanzaDi(cella.x, cella.y)
    const L = this.livello.largo
    this.occhi = new Set()
    for (const m of this.livello.robe) {
      if (m.che !== 'mostro' || m.morto) continue
      if (m.fx == null) { m.fx = m.x + 0.5; m.fy = m.y + 0.5; m.casa = { x: m.x, y: m.y }; m.calmo = 0 }
      if (m.calmo > 0) m.calmo -= dt
      const sua = this.livello.stanzaDi(m.casa.x, m.casa.y)
      const vicino = Math.hypot(m.fx - this.eroe.x, m.fy - this.eroe.y) <= SVEGLIA
      const sveglio = !!(mia && sua && mia === sua && m.calmo <= 0 && (m.sveglio || vicino))
      m.sveglio = sveglio

      const meta = sveglio ? this.eroe : { x: m.casa.x + 0.5, y: m.casa.y + 0.5 }
      const dx = meta.x - m.fx, dy = meta.y - m.fy
      const d = Math.hypot(dx, dy)

      if (sveglio && d < 0.75) {                 // ti ha preso
        this.strada = null; this.mira = null; this.bersaglio = null
        this.scontro(m)
        return
      }
      if (d < 0.05) { if (sveglio) this.occhi.add(m.y * L + m.x); continue }
      const v = (sveglio ? PASSO_MOSTRO : PASSO_RIENTRO) * dt
      let nx = m.fx + dx / d * Math.min(v, d), ny = m.fy + dy / d * Math.min(v, d)
      // non esce mai dalla sua stanza: il muro ferma l'asse che lo porterebbe fuori e lascia libero l'altro
      if (sua) {
        if (nx < sua.x || nx > sua.x + sua.w) nx = m.fx
        if (ny < sua.y || ny > sua.y + sua.h) ny = m.fy
      }
      if (Math.abs(dx) > 0.05) m.guarda = dx < 0 ? 'sx' : 'dx'
      if (this.livello.calpestabile(Math.floor(nx), Math.floor(m.fy))) m.fx = nx
      if (this.livello.calpestabile(Math.floor(m.fx), Math.floor(ny))) m.fy = ny
      m.x = Math.floor(m.fx); m.y = Math.floor(m.fy)
      if (sveglio) this.occhi.add(m.y * L + m.x)   // dove è arrivato, non dove era
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
      this.bruciaLaTorcia()
      this.aggiornaLuce()   // dopo: l'ultima stanza della torcia si stringe appena ci si entra
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

  // le gemme, e soltanto loro: non una scelta. Tutto il resto si tocca, o entra senza essere stato scelto
  raccogli() {
    const cx = Math.floor(this.eroe.x), cy = Math.floor(this.eroe.y)
    for (const r of this.livello.robe) {
      if (r.presa || r.morto || r.che !== 'gemme' || r.x !== cx || r.y !== cy) continue
      const quante = Math.round(r.quante * this.valoreGemme)
      this.gemme += quante
      r.presa = true
      this.dillo(`💎 +${quante}`)
    }
  }

  // quello che è meglio va addosso da solo (il numero si legge dopo, "Spada ⚔️ +2"); peggiore o uguale va in
  // tasca, dove si confronta con calma. Casella vuota conta come "meglio". I gioielli restano fuori
  // quando il dito è già occupato: fra due anelli non c'è un più forte, è una scelta vera.
  trovata(r) {
    const c = COSE[r.cosa]
    if (!c) return
    // la torcia non va in tasca: si accende, o aspetta alla cintura se una brucia già
    if (c.usa === 'luce') {
      this.accendi(r.cosa)
      r.presa = true
      return
    }
    // quello che la classe non porta si raccoglie come tutto il resto (vale gemme al banco), ma non si veste da sé
    if (c.rarita === 'leggendario') this.trovati.add(c.unico)
    // uno scudo si imbraccia da sé solo a mano libera: con un'arma leggera già lì, la scelta la fa chi gioca, dallo zaino
    if (this.vaAddosso(r.cosa)) return this.vesti(r, this.confronto(r.cosa))
    if (this.zaino.length >= TASCHE) {
      if (c.rarita === 'leggendario') this.trovati.delete(c.unico)
      this.dillo('⚠️ lo zaino è pieno'); return
    }
    this.zaino.push(r.cosa)
    r.presa = true
    // detto qui, nel momento in cui si prende: senza una parola sembra che il gioco l'abbia ignorata
    const perché = this.perchéNo(r.cosa)
    this.dilloDi(r.cosa, perché ? ` · ${perché.charAt(0).toLowerCase()}${perché.slice(1)}` : '')
  }

  // chi arriva senza camminare (piano nuovo, risveglio, ripresa) non consuma torcia
  segnaLaStanza() {
    const st = this.livello.stanzaDi(Math.floor(this.eroe.x), Math.floor(this.eroe.y))
    if (st) this.stanzaOra = st.id
  }

  // si consuma per stanza e non a tempo (col foglio aperto il tempo è fermo, docs/sotterraneo/roba.md). Si
  // conta l'entrata (stanzaOra non si azzera in corridoio, o restare sulla soglia brucerebbe torce in mezzo metro)
  bruciaLaTorcia() {
    const st = this.livello.stanzaDi(Math.floor(this.eroe.x), Math.floor(this.eroe.y))
    if (!st || st.id === this.stanzaOra) return
    this.stanzaOra = st.id
    if (!this.torciaAccesa) return
    this.torciaResta--
    // la luce non sta più nella barra (docs/sotterraneo/barra.md): agli sgoccioli, senza scorta, lo si dice
    if (this.torciaResta === 2 && !this.torceInScorta) this.dilloDi('torcia', ' sta per finire: ancora due stanze')
    if (this.torciaResta > 0) return
    // quella dopo si accende da sé: aprire lo zaino per "l'accendo" sarebbe la scelta che non è una scelta
    if (this.torceInScorta > 0) {
      this.torceInScorta--
      this.torciaResta = this.stanzeTorcia
      this.dilloDi('torcia', ` spenta, ne accendi un'altra`)
    } else {
      this.dilloDi('torcia', ' spenta')
    }
    this.aggiornaLuce()
  }

  // quello che aveva non si perde: va nello zaino o per terra se le tasche sono piene
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

  interagisci(r) {
    if (r.morto || r.presa || this.finita) return
    if (r.che === 'mostro') return this.scontro(r)
    if (r.che === 'porta') return this.apri('porta', r, RINCARO.porta)
    // un forziere già aperto non arriva nemmeno qui: `toccabile` lo ha già spento
    if (r.che === 'forziere') return r.aperto ? undefined : this.apri('forziere', r, RINCARO.forziere)
    if (r.che === 'fonte') return this.apri('fonte', r, RINCARO.fonte)
    if (r.che === 'scala') return this.allaScala()
    if (r.che === 'scala-su') return this.allaScalaSu()
    if (r.che === 'cosa') return this.trovata(r)
    if (r.che === 'gemme') return this.raccogli()
    if (r.che === 'curiosita') return r.visto ? undefined : this.apri('curiosita', r, RINCARO.curiosita)
    // il portale non chiede niente: si sale al villaggio e si torna qui (docs/sotterraneo/regole.md)
    if (r.che === 'portale') this.foglio = { che: 'portale', chi: r }
  }

  // mai sopra quello che l'ha lasciato (invisibile e irraggiungibile): si cerca la prima cella libera nel raggio
  libera(x, y) {
    return this.livello.calpestabile(x, y) && !this.livello.robeSu(x, y).length
  }

  posaRoba(roba, vicino) {
    const dove = primaLibera((x, y) => this.libera(x, y), vicino, 3) || vicino
    this.livello.robe.push({ ...roba, x: dove.x, y: dove.y })
    return dove
  }

  apri(che, chi, rincaro) {
    this.foglio = { che, chi }
    this.chiedi(che, rincaro)
  }

  chiedi(che, rincaro) {
    this.chiesta = { id: ++this.contaChieste, che, difficolta: this.durezza(rincaro) }
  }

  // il capo della tappa e il mostro grosso chiedono domande più toste
  rincaroDi(m) { return m.grosso || MOSTRI[m.tipo].capo ? RINCARO.capo : RINCARO.mostro }

  // `io`: gli effetti sull'eroe che durano lo scontro (parato, scudo, intoccabile, specchio, linfa); `pieni` i colpi pieni
  // presi (Testa dura), `tirato` se il primo tiro è già partito. L'abilità preparata non passa da uno scontro all'altro
  scontro(m) {
    this.foglio = { che: 'scontro', chi: m, fermate: 0, pericolo: null, io: {}, pieni: 0, tirato: false }
    this.pronta = null
    this.chiedi('scontro', this.rincaroDi(m))
  }

  // Dopo un colpo del mostro: la domanda dopo, o uno stop se l'eroe rischia di cadere (motore/pericolo.js). Lo stop
  // arriva fra una domanda e l'altra, mai sopra una già a schermo: `chiesta` resta vuota finché non si sceglie.
  // Torna la ragione dello stop (o null). Docs: docs/sotterraneo/pericolo.md
  chiediOFerma(m) {
    const f = this.foglio
    const perche = pericoloDi({ vita: this.vita, vitaMax: this.vitaMax, male: this.botta(m, false), fermate: f.fermate || 0 })
    // uno stop senza niente da bere né da dove scappare offrirebbe solo «continuo»: non si ferma
    const scelte = this.pozioneGiusta() != null || this.puoScappare(m)
    if (!perche || !scelte) { this.chiedi('scontro', this.rincaroDi(m)); return null }
    f.fermate = (f.fermate || 0) + 1
    f.pericolo = perche
    this.chiesta = null
    return perche
  }

  // le scelte dello stop. «scappo» è `scappa()`, com'è sempre; qui le altre due: si riprende a domandare
  continua() {
    const f = this.foglio
    if (!f || f.che !== 'scontro' || !f.pericolo) return { che: 'niente' }
    f.pericolo = null
    this.chiedi('scontro', this.rincaroDi(f.chi))
    return { che: 'continua' }
  }

  // beve la pozione che berrebbe la 🧪 della barra (pozioneGiusta), poi si riprende. Senza pozioni non fa niente (null)
  beviNelPericolo() {
    const f = this.foglio
    if (!f || f.che !== 'scontro' || !f.pericolo) return null
    const i = this.pozioneGiusta()
    if (i == null) return null
    const e = this.usa(i)
    this.continua()
    return e
  }

  // unico ingresso dall'esterno quando un foglio chiede qualcosa; torna cosa è successo per il suono e la scossa giusti
  rispondi(giusto, { saltata = false } = {}) {
    const f = this.foglio
    if (!f) return null
    // una domanda saltata (il tasto dei grandi, docs/core/comandi.md) fa il suo effetto nel
    // mondo ma non è una risposta data: non entra in `domande` né in `giuste`, che pagano l'abisso
    if (!saltata) {
      this.domande++
      if (giusto) this.giuste++
    }
    const esito = this.rispostaA(f, giusto)
    // l'energia viene dalle risposte giuste, dovunque (porte, forzieri, mostri): dopo, così un'abilità si paga con
    // l'energia che c'era quando la si è preparata. Sbagliare non la toglie
    if (giusto) this.energia = Math.min(this.energiaMax, this.energia + ENERGIA_PER_RISPOSTA)
    return esito
  }

  rispostaA(f, giusto) {
    if (f.che === 'scontro') {
      f.pericolo = null   // chi risponde da fuori (il banco) ha scelto di continuare: lo stop è roba di chi guarda lo schermo
      return this.rispostaScontro(f.chi, giusto)
    }
    if (f.che === 'porta') return this.rispostaPorta(f.chi, giusto)
    if (f.che === 'forziere') return this.rispostaForziere(f.chi, giusto)
    if (f.che === 'fonte') return this.rispostaFonte(f.chi, giusto)
    if (f.che === 'curiosita') return this.rispostaCuriosita(f, giusto)
    return null
  }

  // L'abilità da usare alla prossima risposta giusta (docs/sotterraneo/abilita.md): un tocco la prepara, un altro la
  // toglie. Si prepara solo se c'è l'energia e l'arma, ed è in una casella; sbagliando resta pronta e non si paga
  prepara(id) {
    const f = this.foglio
    if (!f || f.che !== 'scontro') return false
    if (this.pronta === id || !id) { this.pronta = null; return true }
    if (this.perchéNonUsi(id)) return false
    this.pronta = id
    return true
  }

  // Cosa farebbe l'abilità adesso, contro questo mostro, coi numeri veri (la riga della scelta nello scontro): «fai 12 di
  // danno · poi 3 a turno per 3 turni». Le difese e le cure non attaccano di più: dicono la riga dell'albero (`fa`)
  descrizione(nodo, m) {
    const g = this.grado(nodo.id) || 1
    const vale = c => aGrado(nodo, c, g)
    const turni = n => `${n} ${n === 1 ? 'turno' : 'turni'}`
    if (!colpisce(nodo)) return nodo.fa(g, this.vitaMax)
    const parti = [`fai ${this.colpo(m, nodo)} di danno${nodo.stanza ? ' a tutti i mostri della stanza' : ''}`]
    if (nodo.seStordito) parti.push('di più su chi è gelato, avvelenato o stordito')
    if (nodo.rompe) parti.push('spezza la sua difesa')
    else if (nodo.passa) parti.push('ignora la sua difesa')
    if (nodo.veleno) parti.push(`poi ${Math.max(1, Math.ceil(this.colpo(m) / 2))} a turno per ${turni(vale('veleno'))}`)
    if (nodo.debole) parti.push(`fa metà danno per ${turni(vale('debole'))}`)
    if (nodo.fermo) parti.push(`stordito per ${turni(vale('fermo'))}`)
    if (nodo.quieto) parti.push('non risponde')
    return parti.join(' · ')
  }

  // perché un'abilità delle caselle non si può usare adesso ('' se si può): la riga sul tasto spento
  perchéNonUsi(id) {
    const nodo = NODI[id]
    if (!nodo || nodo.sempre || !this.grado(id)) return 'non la sai'
    if (!this.haLArma(nodo.arma)) return nodo.arma.corto
    if (this.energia < nodo.costo) return 'poca energia'
    return ''
  }

  // L'abilità entra in gioco: gli effetti sul mostro (e sulla stanza), sull'eroe, la cura. Il colpo lo conta chi chiama
  usaAbilita(nodo, m) {
    const g = this.grado(nodo.id)
    const io = this.foglio.io
    const vale = c => aGrado(nodo, c, g)
    const sulMostro = (x, base) => {
      x.stati = { ...(x.stati || {}) }
      if (nodo.rompe) x.stati.rotto = true
      if (nodo.veleno) x.stati.veleno = { quanto: Math.max(1, Math.ceil(base / 2)), scambi: vale('veleno'), fuoco: nodo.ramo === 'fuoco' || nodo.id === 'chiodi-roventi' }
      if (nodo.debole) x.stati.debole = Math.max(x.stati.debole || 0, vale('debole'))
      // stordito non risponde al colpo che lo stordisce, e poi salta i suoi N scambi
      if (nodo.fermo) x.stati.fermo = Math.max(x.stati.fermo || 0, vale('fermo') + 1)
    }
    if (nodo.cura) {
      const c = inVita(vale('cura'), this.vitaMax)   // lo stesso conto della riga dell'albero
      this.vita = Math.min(this.vitaMax, this.vita + c)
      this.dillo(`${nodo.nome}: ❤️ +${c}`)
    }
    if (nodo.scudo) io.scudo = (io.scudo || 0) + inVita(vale('scudo'), this.vitaMax)
    if (nodo.parato) io.parato = Math.max(io.parato || 0, vale('parato'))
    if (nodo.intoccabile) io.intoccabile = Math.max(io.intoccabile || 0, vale('intoccabile'))
    if (nodo.specchio) io.specchio = vale('specchio')
    if (nodo.linfa) io.linfa = { quanto: Math.max(1, Math.round(this.vitaMax / 10)), scambi: vale('linfa') }
    const base = this.colpo(m)
    sulMostro(m, base)
    if (!nodo.stanza) return []
    // gli altri mostri svegli della stanza: lo stesso colpo e gli stessi effetti, e chi cade cade (esperienza e bottino)
    const qui = this.livello.stanzaDi(Math.floor(this.eroe.x), Math.floor(this.eroe.y))
    const altri = this.livello.robe.filter(r => r.che === 'mostro' && r !== m && !r.morto && r.sveglio &&
      this.livello.stanzaDi(r.casa ? r.casa.x : r.x, r.casa ? r.casa.y : r.y) === qui)
    const colpiti = []
    for (const o of altri) {
      sulMostro(o, this.colpo(o))
      const d = this.colpo(o, nodo)
      o.ossa -= d
      colpiti.push({ chi: o, dato: d })
      if (o.ossa <= 0) this.cade(o)
    }
    return colpiti
  }

  // ogni esito dice lo scambio per intero (tolto e preso): senza il numero, un bambino che risponde bene
  // e vede la vita calare crede di aver sbagliato (docs/sotterraneo/regole.md)
  // Uno scambio, con le abilità (docs/sotterraneo/abilita.md): il veleno che brucia (a ogni scambio, anche sbagliando),
  // il colpo dell'eroe (l'abilità preparata, se la risposta è giusta), poi il mostro che risponde, se è ancora in piedi.
  // Gli effetti «per N scambi» contano anche lo scambio in cui arrivano
  rispostaScontro(m, giusto) {
    const f = this.foglio
    const io = f.io || (f.io = {})
    const st = m.stati || {}
    let veleno = 0
    if (st.veleno && st.veleno.scambi > 0) {
      veleno = st.veleno.quanto
      m.ossa -= veleno
      m.stati = { ...st, veleno: st.veleno.scambi > 1 ? { ...st.veleno, scambi: st.veleno.scambi - 1 } : null }
    }
    if (io.linfa && io.linfa.scambi > 0) {
      this.vita = Math.min(this.vitaMax, this.vita + io.linfa.quanto)
      io.linfa = io.linfa.scambi > 1 ? { ...io.linfa, scambi: io.linfa.scambi - 1 } : null
    }

    let dato = 0, usata = null, quieto = false, colpiti = [], base = 0, primo = false
    if (giusto) {
      base = this.colpo(m)   // il colpo senza l'abilità, per dire da dove viene il danno
      const nodo = this.pronta && !this.perchéNonUsi(this.pronta) ? NODI[this.pronta] : null
      // prima gli effetti, poi il colpo: «Spaccaroccia» toglie la difesa al colpo stesso che la toglie
      if (nodo) {
        usata = nodo
        this.energia -= nodo.costo
        this.pronta = null
        quieto = !!nodo.quieto
        colpiti = this.usaAbilita(nodo, m)
      }
      // un'abilità difensiva (scudo, cura, parata…) prende il posto dell'attacco: niente colpo
      dato = !nodo || colpisce(nodo) ? this.colpo(m, nodo) : 0
      // il primo tiro dell'arco: la prima risposta giusta di uno scontro arriva da lontano, e il mostro non risponde
      if (!f.tirato && this.ha('primoTiro') && (!nodo || colpisce(nodo))) { f.tirato = true; quieto = true; primo = true; dato += this.sempre('primoTiro') }
      m.ossa -= dato
    }
    // come si è arrivati al danno, da mostrare a ogni scambio: il colpo di base, quante volte (l'abilità), il primo tiro
    const volteDi = usata ? (aGrado(usata, 'per', this.grado(usata.id)) || 1) : 1
    const detto = { dato, veleno, usata: usata ? { id: usata.id, nome: usata.nome, glifo: usata.glifo } : null, colpiti: colpiti.length,
                    base, volte: volteDi, primoTiro: primo }
    if (m.ossa <= 0) {
      this.cade(m)
      this.chiudi()
      return { che: 'caduto', chi: m, ...detto, preso: 0 }
    }

    // il mostro è ancora in piedi, quindi risponde: con gli effetti (botta), lo scudo che assorbe, lo specchio che rimanda.
    // La schivata (🌀) a volte evita il graffio
    // cosa si porta via il danno, da dire a chi guarda: stordito, invulnerabile, parato, il mostro che non fa in tempo, il gelo
    const gelato = (m.stati || {}).debole > 0
    const salvo = (m.stati || {}).fermo > 0 ? 'fermo' : io.intoccabile > 0 ? 'intoccabile' : giusto && io.parato > 0 ? 'parato' : giusto && quieto ? 'quieto' : null
    let male = this.botta(m, giusto, { quieto })
    const pieno = male
    if (!giusto) f.pieni = (f.pieni || 0) + 1
    const schiva = giusto && male > 0 && this.schivata > 0 && this.rnd() * 100 < this.schivata
    if (schiva) { male = 0; this.dillo('🌀 schivato!') }
    let assorbito = 0
    if (male > 0 && io.scudo > 0) {
      const preso = Math.min(io.scudo, male)
      io.scudo -= preso
      male -= preso
      assorbito = preso
    }
    Object.assign(detto, { salvo: male > 0 ? null : salvo, gelato: gelato && pieno > 0 ? true : false, assorbito })
    let rimandato = 0
    if (male > 0 && io.specchio) {
      rimandato = Math.round(male * io.specchio)
      io.specchio = 0
      male = 0
      m.ossa -= rimandato
    }
    // gli effetti che contano gli scambi calano qui, dopo aver deciso questo
    const ora = m.stati || {}
    if (ora.debole > 0 || ora.fermo > 0)
      m.stati = { ...ora, debole: Math.max(0, (ora.debole || 0) - 1), fermo: Math.max(0, (ora.fermo || 0) - 1) }
    if (io.parato > 0) io.parato--
    if (io.intoccabile > 0) io.intoccabile--
    if (rimandato && m.ossa <= 0) {
      this.cade(m)
      this.chiudi()
      return { che: 'caduto', chi: m, ...detto, rimandato, preso: 0 }
    }

    this.ferisci(male)
    if (this.vita <= 0 && this.resisti()) this.vita = 1
    if (this.vita <= 0) { this.svieni(); return { che: 'svenuto', ...detto, preso: male } }
    if (!giusto) return { che: 'ferito', quanto: male, ...detto, preso: male, ringhia: this.chiediOFerma(m) }
    return { che: 'colpo', restano: this.colpiPer(m), male, ...detto, preso: male, schivato: schiva, rimandato,
             ringhia: this.chiediOFerma(m) }
  }

  // «Ultimo fiato»: una volta per discesa, invece di svenire si resta in piedi con un filo di vita
  resisti() {
    if (this.fiatoUsato || !this.ha('fiato')) return false
    this.fiatoUsato = true
    this.dillo('✨ Ultimo fiato: resti in piedi')
    return true
  }

  // l'esito non chiude il foglio: la frase è il premio vero, e una battuta che compare mezzo secondo non la legge nessuno
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
      if (p.vitaPiu) { this.vitaPiu += p.vitaPiu; this.vita += p.vitaPiu }
      if (p.torcia) this.accendi('torcia')   // dalla stessa porta di tutte le altre: aspetta alla cintura se una brucia già
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

  // la battuta racconta, questa riga conta: senza, un bambino non sa se ha guadagnato qualcosa o solo riso
  dettoIlPremio(p) {
    const parti = []
    if (p.gemme) parti.push(`💎 +${p.gemme}`)
    if (p.cura) parti.push(`❤️ +${p.cura}`)
    if (p.vitaPiu) parti.push(`❤️ +${p.vitaPiu} per sempre`)
    if (p.torcia) parti.push('🔥 una torcia')   // "una torcia" e non "accesa": può finire di scorta
    return parti.join(' · ')
  }

  cade(m) {
    m.morto = true
    m.sveglio = false
    this.mostriBattuti++
    // la chiave non cade per terra: la si ha e basta, o si può dimenticarla e rifare la strada per niente
    if (m.chiave) {
      this.chiaveDelPiano = true
      this.dillo('🗝️ La chiave! Ora la scala si apre')
    }
    // l'esperienza: tanta quanto è forte la sua specie e quanto è giù il posto (dati/livelli.js), il grosso molta di più
    // e la dice un numerino «+N ✨» che sale dal campo (Gioco.vue). In una zona grigia un quarto, nell'abisso un terzo (dati/zone.js)
    const esp = Math.max(1, Math.round(espDi(MOSTRI[m.tipo], this.livelloQui, !!m.grosso) * espNellaZona(this.tappa, this.livelloEroe)))
    this.eventi.push({ che: 'esp', esp, x: m.x, y: m.y })
    this.guadagna(esp)
    // 💚 rigenera: ogni mostro battuto rimette in piedi un poco
    const rig = this.addosso('rigenera')
    if (rig && this.vita < this.vitaMax) this.vita = Math.min(this.vitaMax, this.vita + rig)
    // 🍃 Respiro del bosco: l'energia torna battendo i mostri
    const fiato = this.sempre('energiaPerMostro')
    if (fiato) this.energia = Math.min(this.energiaMax, this.energia + fiato)
    const scheda = MOSTRI[m.tipo]
    this.livello.robe.push({ che: 'gemme', x: m.x, y: m.y, em: '💎',
                             quante: Math.round((scheda.gemme + Math.floor(this.piano * 1.5)) * valoreDelLivello(this.livelloQui)) })
    const storia = this.indice >= 0
    const lascia = scheda.lascia || []
    const daBere = lascia.filter(SI_CONSUMA).length ? lascia.filter(SI_CONSUMA) : ['pozione-piccola']
    // chi porta la chiave lascia sempre qualcosa: è l'unico che non si aggira, quindi l'unico bottino che
    // arriva anche a chi va dritto alla scala. Nella storia quello dell'ultimo piano lascia il pezzo della riga
    // dopo (premio), gli altri una cosa da bere. Il tiro si fa comunque, o il caso di tutto il piano si sposterebbe
    const tiro = this.rnd()
    const premio = m.chiave && storia && this.piano >= this.quantiPiani - 1 ? this.premio() : null
    const vicino = { x: m.x + 1, y: m.y }
    if (premio) this.posaRoba({ che: 'cosa', cosa: premio, em: COSE[premio].em }, vicino)
    else if (m.chiave || tiro < (scheda.droppa != null ? scheda.droppa : 0.5)) {
      // da bere (anche nell'abisso: la roba da mettersi addosso la dà il tiro qui sotto, a tono)
      const cosa = pescaCosa(daBere, { rnd: () => this.rnd(), tua: k => this.porta(k) })
      this.posaRoba({ che: 'cosa', cosa, em: COSE[cosa].em }, vicino)
    }
    // il mostro grosso: di sicuro un pezzo raro o meglio, e il suo pezzo col nome
    if (m.grosso) {
      this.posaPezzo(pezzoNuovo({ livello: this.livelloDelBottino, chi: 'grosso', fortuna: this.fortuna,
                                  rnd: () => this.rnd(), tua: k => this.porta(k) }), { x: m.x - 1, y: m.y })
      this.posaPezzo(pezzoDelGrosso(GROSSI[m.grosso].pezzo, this.livelloDelBottino), { x: m.x, y: m.y + 1 })
    } else if (this.rnd() < pezzoDalMostro(scheda)) {
      // a volte anche un mostro qualunque lascia un pezzo da mettersi addosso, a tono col posto e con l'eroe
      this.posaPezzo(pezzoNuovo({ livello: this.livelloDelBottino, chi: 'mostro', fortuna: this.fortuna,
                                  rnd: () => this.rnd(), tua: k => this.porta(k) }), { x: m.x, y: m.y + 1 })
    }
    // un mostro che cade si vede, anche il grosso: niente avviso. Quello di una missione sì, dice cosa fare dopo
    if (m.missione) {
      this.missioniFatte.add(m.missione)
      this.dillo(`👑 ${m.nome} non si rialza più. Torna su a dirlo`)
    }
  }

  // un pezzo per terra; un leggendario lo festeggia la vista (la colonna di luce, il nome in oro: Gioco.vue)
  posaPezzo(k, vicino) {
    if (!k || !COSE[k]) return null
    const dove = this.posaRoba({ che: 'cosa', cosa: k, em: COSE[k].em }, vicino)
    if (COSE[k].rarita === 'leggendario') this.eventi.push({ che: 'leggendario', cosa: k, x: dove.x, y: dove.y })
    return dove
  }

  // L'esperienza (docs/sotterraneo/livelli.md): sale di livello quando passa la soglia, e la vita che il livello porta
  // arriva subito. Provato: tornare in piena forma, come in Diablo; a metà discesa era una pozione gratis, e chi
  // sbagliava di più saliva di più (misurato). I punti da dare li dà chi gioca, dalla pagina dell'eroe
  guadagna(esp) {
    if (!(esp > 0)) return
    const prima = this.livelloEroe
    const tetto = this.vitaMax
    this.crescita = { ...this.crescita, esp: this.crescita.esp + esp }
    this.espPresa += esp
    const ora = this.livelloEroe
    if (ora > prima) {
      this.vita = Math.min(this.vitaMax, this.vita + Math.max(0, this.vitaMax - tetto))
      // lo dice la festa (Gioco.vue), col punto da dare: un avviso sotto ripeterebbe la stessa cosa
      this.eventi.push({ che: 'livello', livello: ora })
    }
  }

  // un punto dato dalla pagina dell'eroe, anche giù: la vita che la tempra aggiunge arriva subito
  daiUnPunto(k) {
    const n = daiPunto(this.crescita, k)
    if (!n) return false
    const prima = this.vitaMax, energiaPrima = this.energiaMax
    this.crescita = n
    this.vita = Math.min(this.vitaMax, this.vita + Math.max(0, this.vitaMax - prima))
    this.energia = Math.min(this.energiaMax, this.energia + Math.max(0, this.energiaMax - energiaPrima))   // l'intelligenza
    return true
  }

  // il prossimo pezzo della riga dopo (motore/storia.js) che serve ancora e non è già per terra in questo piano, al
  // livello del bottino: la tabella dice quale pezzo, il livello lo dice dove si è
  premio() {
    return premioPer(this, this.indice, {
      livello: this.livelloDelBottino,
      evita: k => this.livello.robe.some(r => r.che === 'cosa' && r.cosa && r.cosa.split('@')[0] === k && !r.presa),
    })
  }

  ferisci(quanto) {
    this.vita = Math.max(0, this.vita - quanto)
  }

  // svenire non fa perdere la discesa finché ci sono occasioni (svenimentiDi); all'ultima si risveglia fuori (docs/sotterraneo/regole.md)
  svieni() {
    this.svenimenti++
    this.svenimentiQui++
    this.ultimoSvenimento = this.svenimentiSpesi >= this.svenimentiConcessi
    this.foglio = { che: 'svenuto', ultimo: this.ultimoSvenimento,
                    restano: Math.max(0, this.svenimentiConcessi - this.svenimentiSpesi) }
    this.chiesta = null
  }

  // all'ultima occasione si risale (la tappa non è superata; nell'abisso finisce la sera): ci si rimette in
  // piedi comunque, perché quello che si porta su lo decide rimettiInPiedi
  riprendi() {
    this.rimettiInPiedi()
    if (this.ultimoSvenimento) { this.perche = 'svenuto'; this.risali(); return }
    this.chiudi()
  }

  // metà gemme, mezza vita, mostri a casa loro: risvegliarsi con l'orco ancora addosso non sarebbe una seconda
  // occasione. L'ultimo svenimento, e ogni svenimento nell'abisso, svuota anche le sei tasche: quello addosso
  // resta sempre (la roba si porta su, docs/sotterraneo/regole.md "Svenire")
  rimettiInPiedi() {
    this.gemme = Math.floor(this.gemme / 2)
    this.vita = Math.max(6, Math.round(this.vitaMax / 2))
    if (this.zaino.length) {
      const quante = this.zaino.length
      this.zaino = []
      this.dillo(`🫳 ${quante === 1 ? 'quello che avevi in tasca' : 'quello che avevi nelle tasche'} non c'è più`)
    }
    const dentro = this.livello.stanze[0]
    this.eroe = { x: dentro.cx + 0.5, y: dentro.cy + 0.5 }
    this.segnaLaStanza()
    this.strada = null; this.mira = null; this.bersaglio = null
    for (const m of this.livello.robe) if (m.che === 'mostro') { m.sveglio = false; m.calmo = CALMA }
    this.aggiornaLuce()
  }

  // sbagliando non si perde niente (si riprova): quello che si perde per sempre è il forziere
  rispostaPorta(p, giusto) {
    if (giusto) {
      // si apre la STANZA, non il battente: le porte dello stesso gruppo sono i varchi dello stesso posto
      const insieme = this.livello.robe.filter(r => r.che === 'porta' && !r.aperta &&
        (p.gruppo != null ? r.gruppo === p.gruppo : r === p))
      for (const r of insieme) { r.aperta = true; r.presa = true }
      this.chiudi()
      return { che: 'aperta' }
    }
    this.dillo('La serratura non cede: riprova quando vuoi')
    this.chiudi()
    return { che: 'chiusa' }
  }

  // l'unica cosa che si perde per sempre, apposta: senza, niente nel sotterraneo fa un po' di batticuore
  rispostaForziere(f, giusto) {
    // il forziere di una missione non si perde: sbagliando resta chiuso e si riprova, come una porta
    if (f.missione) {
      if (!giusto) { this.dillo('Il lucchetto non cede: riprova'); this.chiudi(); return { che: 'chiusa' } }
      f.aperto = true
      this.tesori++
      this.missioniFatte.add(f.missione)
      this.dillo(`${f.em} ${f.nome}: torna su, da chi l'aspetta`)
      this.chiudi()
      return { che: 'missione', id: f.missione }
    }
    f.aperto = true
    if (!giusto) {
      f.vuoto = true
      this.dillo('🎁 Il forziere non si aprirà più')
      this.chiudi()
      return { che: 'niente' }
    }
    this.tesori++
    // il bottino cade davanti al baule, mai dentro (posaRoba); predilige la classe che l'ha aperto (PESO_ALTRUI)
    // nella storia il forziere dà il pezzo della riga dopo che manca; se no un pezzo a tono (un forziere su tre,
    // con le rarità del forziere) o una cosa da bere o da accendere
    const premio = this.indice >= 0 ? this.premio() : null
    const tiro = this.rnd()
    let cosa = premio
    if (!cosa && tiro < (this.indice >= 0 ? 0.34 : 0.6))
      cosa = pezzoNuovo({ livello: this.livelloDelBottino, chi: 'forziere', fortuna: this.fortuna,
                          rnd: () => this.rnd(), tua: k => this.porta(k) })
    if (!cosa) cosa = pescaCosa(NEI_FORZIERI_DELLA_STORIA, { rnd: () => this.rnd(), tua: k => this.porta(k) })
    this.posaPezzo(cosa, { x: f.x, y: f.y + 1 })
    this.posaRoba({ che: 'gemme', em: '💎', quante: Math.round((6 + this.piano * 3) * valoreDelLivello(this.livelloQui)) },
                  { x: f.x + 1, y: f.y + 1 })
    this.chiudi()
    return { che: 'tesoro', cosa }
  }

  rispostaFonte(f, giusto) {
    if (giusto) {
      this.vita = Math.min(this.vitaMax, this.vita + SORSO)
      f.morto = true
      // la fonte rimette anche l'energia (docs/sotterraneo/abilita.md)
      const prima = this.energia
      this.energia = this.energiaMax
      this.dillo(`❤️ +${SORSO}${this.energia > prima ? ` · 🔷 +${this.energia - prima}` : ''}`)
      this.chiudi()
      return { che: 'bevuto' }
    }
    this.dillo('L\'acqua s\'intorbida: non si beve')
    this.chiudi()
    return { che: 'niente' }
  }

  // tre secondi di vantaggio (non immunità: chi resta nella stanza se lo ritrova addosso), e costa un
  // graffio (docs/sotterraneo/regole.md): gratis era la mossa migliore del gioco
  scappa() {
    const f = this.foglio
    if (!f || f.che !== 'scontro') { this.chiudi(); return { che: 'niente' } }
    f.chi.calmo = CALMA; f.chi.sveglio = false
    const preso = this.graffio(f.chi)
    this.ferisci(preso)   // quanto costa lo dice il tasto, prima; il globo sobbalza: niente avviso dopo
    if (this.vita <= 0) { this.svieni(); return { che: 'svenuto', preso } }
    this.chiudi()
    return { che: 'scappato', preso }
  }

  chiudi() {
    this.foglio = null
    this.chiesta = null
  }

  // le pozioni in tasca, per la casella della barra (docs/sotterraneo/barra.md): le cure e l'elisir, che è una
  // boccetta rossa e un bambino la conta fra le pozioni (contarla no era il guasto della casella che non saliva)
  get pozioni() { return this.zaino.filter(k => COSE[k] && (COSE[k].usa === 'cura' || COSE[k].usa === 'cresci')).length }

  // quale bere dalla barra: ferito, la più piccola cura che riempie la vita, o la più grande se nessuna basta;
  // l'elisir quando non c'è una cura da bere (vale uguale a ogni momento). null senza pozioni, o in piena forma con
  // sole cure: un tocco per sbaglio non butta via una boccetta
  pozioneGiusta() {
    const manca = this.vitaMax - this.vita
    const cure = this.zaino.map((k, i) => ({ i, cura: COSE[k] && COSE[k].usa === 'cura' ? this.curaDi(k) : 0 }))
      .filter(p => p.cura > 0)
    if (manca > 0 && cure.length) {
      const basta = cure.filter(p => p.cura >= manca).sort((a, b) => a.cura - b.cura)[0]
      return (basta || cure.sort((a, b) => b.cura - a.cura)[0]).i
    }
    const elisir = this.zaino.findIndex(k => COSE[k] && COSE[k].usa === 'cresci')
    return elisir >= 0 ? elisir : null
  }

  // una tasca toccata apre le sue azioni invece di eseguirne una: usa/butta/riponi. Il verbo lo sceglie chi
  // disegna dai dati (dove, usa): il motore non scrive "bevo" da nessuna parte
  usa(i) {
    const k = this.zaino[i]
    if (!k) return null
    const c = COSE[k]
    if (c.dove) {
      const e = this.indossaDallaTasca(i)
      this.vita = Math.min(this.vita, this.vitaMax)   // un amuleto tolto per un altro abbassa il tetto
      return e
    }
    if (c.usa === 'cura') {
      const cura = this.curaDi(k)
      this.vita = Math.min(this.vitaMax, this.vita + cura)
      this.zaino.splice(i, 1)
      this.dillo(`❤️ +${cura}`)
      return { che: 'curato' }
    }
    if (c.usa === 'energia') {
      const prima = this.energia
      this.energia = Math.min(this.energiaMax, this.energia + c.energia)
      this.zaino.splice(i, 1)
      this.dillo(`🔷 +${this.energia - prima}`)
      return { che: 'energia' }
    }
    if (c.usa === 'cresci') {
      this.vitaPiu += c.cresce
      this.vita += c.cresce
      this.zaino.splice(i, 1)
      this.dillo(`❤️ ${this.vita}/${this.vitaMax}`)
      return { che: 'cresciuto' }
    }
    // una torcia in tasca non ci finisce più (si accende raccogliendola), ma un salvataggio vecchio può averla ancora
    if (c.usa === 'luce') {
      this.zaino.splice(i, 1)
      this.accendi(k)
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

  // resta dove l'hai lasciata, e ci si può tornare (posaRoba se sotto i piedi c'è già qualcosa)
  butta(i) {
    const k = this.zaino[i]
    if (!k) return null
    this.zaino.splice(i, 1)
    this.posaRoba({ che: 'cosa', cosa: k, em: COSE[k].em },
                  { x: Math.floor(this.eroe.x), y: Math.floor(this.eroe.y) })
    return { che: 'buttata', cosa: k }
  }

  riponi(dove) {
    const e = super.riponi(dove)
    this.vita = Math.min(this.vita, this.vitaMax)   // togliendosi l'amuleto il tetto scende, e la vita lo segue
    return e
  }

  // chiusa finché non si è battuto chi porta la chiave: l'unica cosa che non si può aggirare (docs/sotterraneo/regole.md)
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
    // un piano già toccato (si era risaliti) non dà di nuovo la vita del piano né il riposo, e non conta due volte
    const nuovo = this.piano + 1 > this.fondo
    if (nuovo || this.piano >= this.quantiPiani - 1) this.pianiFatti++
    if (this.piano >= this.quantiPiani - 1) {
      this.finita = true
      this.vinta = true
      this.foglio = null
      this.chiesta = null
      return { che: 'finita' }
    }
    this.lasciaIlPiano()
    this.piano++
    if (nuovo) {
      this.svenimentiQui = 0   // le occasioni si rinnovano scendendo, e solo scendendo (svenimentiSpesi)
      this.vitaPiu += VITA_PER_PIANO
      this.vita = Math.min(this.vitaMax, this.vita + RIPOSO_SCALA)
    }
    this.entraNelPiano({ dal: 'sopra' })
    this.chiudi()
    return { che: 'sceso', piano: this.piano }
  }

  // la scala che sale sta dove si compare arrivando dall'alto: sopra il primo piano non c'è un piano, c'è la terra, e lì si
  // esce come con «lascio perdere» (Gioco.vue, `fuori`): mai un modo gratis di saltare il portale
  allaScalaSu() {
    this.foglio = { che: 'scala-su', fuori: this.piano === 0 }
  }

  // sale al piano di sopra, e si compare accanto alla scala che scende da cui si era venuti. Dal primo piano non si sale: si esce
  sali() {
    if (!this.foglio || this.foglio.che !== 'scala-su' || this.piano === 0) return null
    this.lasciaIlPiano()
    this.piano--
    this.entraNelPiano({ dal: 'sotto' })
    this.chiudi()
    return { che: 'salito', piano: this.piano }
  }

  // il piano su cui si sta resta com'è (mostri battuti, cose prese, porte aperte, mappa girata): rientrando lo si ritrova
  lasciaIlPiano() {
    this.piani.set(this.piano, {
      livello: this.livello, robeDelSeme: this.robeDelSeme, visto: this.visto,
      stanzeDentro: this.stanzeDentro, chiave: this.chiaveDelPiano,
    })
  }

  // `dal`: 'sopra' si arriva scendendo (si compare sulla scala che sale), 'sotto' risalendo (accanto alla scala che scende).
  // Un piano non ricordato (l'abisso tiene a mente pochi piani, motore/sosta.js) si rifà dal seme
  entraNelPiano({ dal }) {
    const ricordo = this.piani.get(this.piano)
    if (!ricordo) {
      this.nuovoPiano()
      this.posaLeMissioni()
      if (dal === 'sotto') { this.chiaveDelPiano = true; this.compariAccantoAllaScala() }   // la scala l'aveva già aperta chi è sceso
      return
    }
    this.piani.delete(this.piano)
    this.livello = ricordo.livello
    this.robeDelSeme = ricordo.robeDelSeme
    this.visto = ricordo.visto
    this.stanzeDentro = ricordo.stanzeDentro
    this.chiaveDelPiano = ricordo.chiave
    this.posaLeMissioni()   // una missione presa sopra, nel frattempo, trova il suo posto anche qui
    // i mostri tornano a casa con qualche secondo di calma, come dopo uno svenimento: nessuno ti aspetta alla scala
    for (const m of this.livello.robe) if (m.che === 'mostro' && !m.morto) { m.sveglio = false; m.calmo = CALMA }
    if (dal === 'sotto') this.compariAccantoAllaScala()
    else {
      const dentro = this.livello.stanze[0]
      this.eroe = { x: dentro.cx + 0.5, y: dentro.cy + 0.5 }
    }
    this.guarda = 'dx'
    this.strada = null; this.mira = null; this.bersaglio = null
    this.segnaLaStanza()
    this.aggiornaLuce()
  }

  // risalendo si sbuca accanto alla scala che scende (la prima cella libera attorno), non all'inizio del piano
  compariAccantoAllaScala() {
    const scala = this.livello.robe.find(r => r.che === 'scala')
    const buona = (x, y) => this.libera(x, y) && !this.bloccata(x, y)
    // prima sotto la scala, poi di lato, poi sopra (dove stava il guardiano): la cella più vicina che sia libera
    const accanto = scala && [[0, 1], [1, 0], [-1, 0], [0, -1]].map(([dx, dy]) => ({ x: scala.x + dx, y: scala.y + dy }))
      .find(c => buona(c.x, c.y))
    const dove = scala && (accanto || primaLibera(buona, { x: scala.x, y: scala.y }, 3))
    const dentro = this.livello.stanze[0]
    this.eroe = dove ? { x: dove.x + 0.5, y: dove.y + 0.5 } : { x: dentro.cx + 0.5, y: dentro.cy + 0.5 }
    this.strada = null; this.mira = null; this.bersaglio = null
    this.segnaLaStanza()
    this.aggiornaLuce()
  }

  // si può smettere e risalire: non è vinta ma non è una sconfitta, non deve costare tutto
  risali() {
    this.finita = true
    this.vinta = false
    this.foglio = null
    this.chiesta = null
  }

  get esito() {
    return {
      vinta: this.vinta, svenimenti: this.svenimenti, domande: this.domande, giuste: this.giuste,
      perche: this.perche || null,   // 'svenuto' se il fondo è stato toccato, niente se risalito o vinto
      piani: this.pianiFatti,
      quantiPiani: this.senzaFondo ? null : this.quantiPiani,   // Infinity mostrerebbe "3 piani su ∞"
      fondo: this.piano + 1,   // contato come un bambino (il primo è 1): il record dell'abisso
      mostri: this.mostriBattuti, tesori: this.tesori, esp: this.espPresa,
      gemme: this.gemme, stanze: this.stanzeViste,
    }
  }
}
