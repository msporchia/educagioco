// Una discesa: le regole senza schermo, gira in Node (il banco può giocare
// seicento discese e contare le domande). L'esercizio è la chiave, la spada
// e il piede di porco — ogni cosa costa una risposta (docs/sotterraneo/regole.md).
// Il motore dice solo `chiesta` (quanto dev'essere difficile); Gioco.vue va
// a prendere la domanda vera da src/quiz/ e non nomina mai una materia qui.
// `foglio` è un dato ({ che: 'scontro', chi }): finché è aperto il tempo è fermo.
import {
  EROE, TASCHE, RAGGIO, RAGGIO_TORCIA, PASSO_EROE, PASSO_MOSTRO, PASSO_RIENTRO,
  CALMA, SORSO, RIPOSO_SCALA, VITA_PER_PIANO,
  ARREDO_DICE, ARREDO_LA_PRIMA_VOLTA,
} from '../dati/mondo.js'
import { MOSTRI } from '../dati/mostri.js'
import { SCENARI, SCENARIO } from '../dati/tessere.js'
import { eroeDi, DI_PARTENZA, portaLa, nonLaPorta } from '../dati/eroi.js'
import { COSE, CURE, NEI_FORZIERI, STANZE_TORCIA, pescaMerce, pescaCosa } from '../dati/cose.js'
import { CURIOSITA_DI, MALUS } from '../dati/curiosita.js'
import { durezzaDi, guardianoDi, svenimentiDi, formaDi, crescitaDi, brancoDi, scenarioDi, trattoDi }
  from '../dati/campagna.js'
import { generaPiano } from './livello.js'
import { percorso, viaVerso, primaLibera } from '../../../motore/passi.js'

// quanto rincara la domanda, per ogni cosa: la porta meno del piano, il forziere molto di più
const RINCARO = { porta: -0.05, forziere: 0.25, fonte: 0, mostro: 0.05, capo: 0.2,
  curiosita: 0 }

export class Corsa {
  constructor(tappa, { seme = null, rnd = Math.random, eroe = DI_PARTENZA } = {}) {
    this.tappa = tappa
    this.rnd = rnd
    this.seme = seme == null ? Math.floor(rnd() * 100000) : seme
    this.piano = 0

    // la scheda dice vita, braccio e difesa di partenza; il resto del motore non sa che esistano quattro eroi
    this.chiEro = eroe
    this.io = eroeDi(eroe)
    this.vitaBase = this.io.vita
    this.vita = this.io.vita
    this.gemme = 0
    this.zaino = []
    this.mano = null
    this.mancina = null   // seconda arma leggera, o l'ombra di una a due mani (vedi `mani` in dati/cose.js)
    this.corpo = null
    this.dito = null
    // `torciaResta`: stanze davanti alla torcia accesa (0 = spenta). `torceInScorta`: quante aspettano alla cintura, senza consumarsi
    this.torciaResta = 0
    this.torceInScorta = 0
    this.stanzaOra = null   // unità in cui brucia la torcia (bruciaLaTorcia)

    this.foglio = null          // cosa è aperto adesso, o niente
    this.chiesta = null         // la domanda che serve: { id, che, difficolta }
    this.contaChieste = 0
    this.avvisi = []            // le righe da far comparire a schermo, in coda

    this.finita = false
    this.vinta = false
    this.svenimenti = 0
    this.svenimentiQui = 0   // spesi su QUESTO piano: solo l'abisso li azzera scendendo
    this.ultimoSvenimento = false   // l'ultima occasione è stata usata: riprendi() risale invece di rimettere in piedi
    this.perche = null
    this.dettoDellArredo = false   // la regola del filo di luce si spiega una volta per discesa
    this.domande = 0
    this.giuste = 0   // quante di quelle `domande` erano giuste: paga l'abisso, risalendo (docs/sotterraneo/abisso-progetto.md)
    this.mostriBattuti = 0
    this.tesori = 0
    this.stanzeViste = 0
    this.pianiFatti = 0

    this.nuovoPiano()
  }

  get att() { return this.io.att + this.addosso('att') }   // unico posto dove si sommano

  get torciaAccesa() { return this.torciaResta > 0 }

  // metà arrotondata per eccesso: due armi non fanno il doppio, o le pesanti non si prenderebbe più nessuno
  get attaccoMancino() {
    const c = COSE[this.mancina]
    return c ? Math.ceil((c.att || 0) / 2) : 0
  }

  // quanto picchierebbero due mani messe così: per decidere dove mettere un'arma trovata, non tocca niente
  attaccoDelleMani(destra, sinistra) {
    const d = COSE[destra] ? (COSE[destra].att || 0) : 0
    const s = COSE[sinistra] ? Math.ceil((COSE[sinistra].att || 0) / 2) : 0
    return d + s
  }

  aDueMani(k) { return !!(COSE[k] && COSE[k].mani === 2) }
  get dif() { return this.io.dif + this.addosso('dif') }
  // non è un campo: cresce coi piani (vitaBase) e con il dito, o si scorderebbe di alzarla/abbassarla
  get vitaMax() { return this.vitaBase + this.addosso('vita') }
  get quantiPiani() { return this.tappa.piani }

  // l'abisso non ha un ultimo piano: `piani: Infinity` lo rende già falso da sé, ma serve dirlo per nome a chi legge
  get senzaFondo() { return !!this.tappa.abisso }
  // come si disegna questo piano (null: lo scenario di ripiego), e nell'abisso il nome del posto
  get scenario() { return scenarioDi(this.tappa, this.piano) }
  get posto() { const t = trattoDi(this.tappa, this.piano); return t ? t.nome : null }

  // nella campagna il conto è di tutta la discesa, nell'abisso è di questo piano
  get svenimentiConcessi() { return svenimentiDi(this.tappa) }
  get svenimentiSpesi() { return this.senzaFondo ? this.svenimentiQui : this.svenimenti }

  addosso(campo) {
    let n = 0
    for (const k of [this.mano, this.corpo, this.dito])
      if (k && COSE[k]) n += COSE[k][campo] || 0
    // la seconda arma vale piena per tutto il resto (la luce illumina uguale in qualunque mano), metà solo per il braccio
    if (this.mancina && COSE[this.mancina])
      n += campo === 'att' ? this.attaccoMancino : (COSE[this.mancina][campo] || 0)
    return n
  }

  // il limite è sull'indossare, mai sul prendere: `posso` non blocca la raccolta, solo il vestirsi da sé
  posso(k) { return portaLa(this.io, COSE[k]) }
  perchéNo(k) { return nonLaPorta(this.io, COSE[k]) }

  // per il rientro: un salvataggio vecchio può avere in pugno cose che la classe non porta più
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
    this.vita = Math.min(this.vita, this.vitaMax)   // togliendo un amuleto il massimo scende, e la vita lo segue
  }

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

  // stessa domanda in tre posti (per terra, comprato, banco di prova): vuota e non impegnata dall'altra mano
  mancinaLibera() { return !this.mancina && !this.aDueMani(this.mano) }

  // un'arma a due mani sfratta la sinistra, che non si perde: torna in tasca o per terra
  sistemaLeMani() {
    if (!this.mancina) return
    // l'arma rimasta di là col pugno vuoto ci passa: è la stessa arma che cambia mano, niente da sfrattare
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

  // si provano le sistemazioni possibili e si tiene la migliore
  postoDellArma(k) {
    const c = COSE[k]
    const ora = this.attaccoDelleMani(this.mano, this.mancina)
    const scelte = [{
      dove: 'mano',
      att: this.attaccoDelleMani(k, this.aDueMani(k) ? null : this.mancina),
    }]
    // la mano debole si riempie da sola solo se è vuota: fra "più braccio" e "più pelle" non c'è un più forte
    if (!this.aDueMani(k) && this.mano && !this.aDueMani(this.mano) && !this.mancina)
      scelte.push({ dove: 'mancina', att: this.attaccoDelleMani(this.mano, k) })
    const meglio = scelte.sort((a, b) => b.att - a.att)[0]
    return { dove: meglio.dove, delta: meglio.att - ora }
  }

  colpo(m) { return Math.max(1, this.att - m.dif) }
  colpiPer(m) { return Math.max(1, Math.ceil(m.ossa / this.colpo(m))) }
  danno(m) { return Math.max(1, m.att - this.dif) }

  // un mostro picchia sempre: metà del colpo pieno anche rispondendo bene, o le pozioni non servirebbero a niente (docs/sotterraneo/regole.md)
  graffio(m) { return Math.max(1, Math.floor(this.danno(m) / 2)) }

  durezza(rincaro = 0) {
    return Math.max(0, Math.min(1, durezzaDi(this.tappa, this.piano) + rincaro))
  }

  dillo(testo) { this.avvisi.push(testo) }

  // l'avviso porta la chiave (non una stringa già scritta), così a schermo compare lo sprite vero e non l'emoji di ripiego
  dilloDi(k, coda = '') {
    const c = COSE[k]
    if (!c) return
    this.avvisi.push({ cosa: k, testo: c.nome + coda })
  }

  nuovoPiano() {
    const t = this.tappa
    // la forma la chiede alla tappa per QUESTO piano (nell'abisso gira fra tre); il piano è funzione del seme, rientrando torna identico
    const forma = formaDi(t, this.piano)
    this.livello = generaPiano({
      seme: this.seme + this.piano * 7919, piano: this.piano,
      largo: forma.misura, alto: forma.misura, giri: forma.giri,
      guardiano: guardianoDi(t, this.piano),
      crescita: crescitaDi(t),
      branco: brancoDi(t, this.piano),
    })
    const dentro = this.livello.stanze[0]
    this.eroe = { x: dentro.cx + 0.5, y: dentro.cy + 0.5 }
    this.guarda = 'dx'
    this.strada = null
    this.mira = null
    this.bersaglio = null
    // dal piano generato, non dalla tappa: da quando l'abisso cambia forma scendendo, potevano divergere
    this.visto = new Uint8Array(this.livello.largo * this.livello.alto)
    this.luce = new Set()
    this.segnaLaStanza()
    this.chiaveDelPiano = false
    this.stanzeDentro = new Set()
    this.aggiornaLuce()
  }

  // dentro una stanza si accende tutta; in corridoio solo un pezzo attorno (da cui la fretta del corridoio)
  aggiornaLuce() {
    const L = this.livello.largo, A = this.livello.alto
    const cx = Math.floor(this.eroe.x), cy = Math.floor(this.eroe.y)
    this.luce = new Set()
    const accendi = (x, y) => {
      if (x < 0 || y < 0 || x >= L || y >= A) return
      this.luce.add(y * L + x)
      this.visto[y * L + x] = 1
    }
    const raggio = (this.torciaAccesa ? RAGGIO_TORCIA : RAGGIO) + this.addosso('luce')
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
    if (!this.luce.has(r.y * this.livello.largo + r.x)) return false
    if (r.che === 'porta') return !r.aperta
    if (r.che === 'forziere') return !r.aperto
    if (r.che === 'curiosita') return !r.visto   // una volta sola, poi è arredo
    return ['mostro', 'mercante', 'fonte', 'scala', 'cosa', 'gemme'].includes(r.che)
  }

  // le gemme si prendono camminandoci sopra: restano toccabili senza rubare il tocco a un forziere accanto
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

  // la prima volta spiega la regola del filo di luce, dopo dice solo cos'è (una volta per discesa, o diventa rumore)
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

  sopra(che) { return ['scala', 'mercante', 'fonte', 'cosa', 'gemme'].includes(che) }

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

  // un mostro dorme finché non entri nella sua stanza, e smette appena esci: è la regola che rende la stanza un confine
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
      // non esce mai dalla sua stanza: il muro ferma l'asse che lo porterebbe fuori e lascia libero l'altro
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
      this.bruciaLaTorcia()
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
      const quante = Math.round(r.quante * (1 + this.addosso('gemme')))
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
    if (c.dove && this.posso(r.cosa)) {
      // uno scudo si imbraccia da sé solo a mano libera: con un'arma leggera già lì, la scelta la fa chi gioca, dallo zaino
      const stretto = c.dove === 'mancina' && !this.mancinaLibera()
      const conf = this.confronto(r.cosa)
      if (!stretto && (!conf.addosso || conf.delta > 0)) return this.vesti(r, conf)
    }
    if (this.zaino.length >= TASCHE) { this.dillo('🎒 lo zaino è pieno'); return }
    this.zaino.push(r.cosa)
    r.presa = true
    // detto qui, nel momento in cui si prende: senza una parola sembra che il gioco l'abbia ignorata
    const perché = this.perchéNo(r.cosa)
    this.dilloDi(r.cosa, perché ? ` · ${perché.charAt(0).toLowerCase()}${perché.slice(1)}` : '')
  }

  // una torcia si prende sempre: la prima si accende, le altre aspettano alla cintura senza tetto (docs/sotterraneo/roba.md)
  accendi(k) {
    const quante = (COSE[k] && COSE[k].stanze) || STANZE_TORCIA
    if (this.torciaAccesa) {
      this.torceInScorta++
      this.dilloDi(k, ` alla cintura · ne hai ${this.torceInScorta} di scorta`)
      return true
    }
    this.torciaResta = quante
    this.aggiornaLuce()
    this.dilloDi(k, ` accesa · si vede più lontano · ${quante} stanze`)
    return true
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
    if (this.torciaResta > 0) return
    // quella dopo si accende da sé: aprire lo zaino per "l'accendo" sarebbe la scelta che non è una scelta
    if (this.torceInScorta > 0) {
      this.torceInScorta--
      this.torciaResta = STANZE_TORCIA
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

  // rispetto a quella che si ha già addosso: il motore lo sa, chi disegna non deve sommare niente
  confronto(k) {
    const c = COSE[k]
    if (!c || !c.dove) return null
    // le armi hanno due caselle: il confronto è col totale delle mani, non "uguale a quella che hai"
    if (c.dove === 'mano') {
      const posto = this.postoDellArma(k)
      return { dove: posto.dove, campo: 'att', addosso: this.casella(posto.dove), delta: posto.delta }
    }
    const campo = c.dove === 'corpo' || c.dove === 'mancina' ? 'dif' : 'dono'
    const addosso = this.casella(c.dove)
    // `?.`: un salvataggio vecchio può avere una chiave che non esiste più, e non deve spegnersi su una schermata nera
    const mio = addosso ? (COSE[addosso]?.[campo] || 0) : 0
    return { dove: c.dove, campo, addosso, delta: (c[campo] || 0) - mio }
  }

  interagisci(r) {
    if (r.morto || r.presa || this.finita) return
    if (r.che === 'mostro') return this.scontro(r)
    if (r.che === 'porta') return this.apri('porta', r, RINCARO.porta)
    // un forziere già aperto non arriva nemmeno qui: `toccabile` lo ha già spento
    if (r.che === 'forziere') return r.aperto ? undefined : this.apri('forziere', r, RINCARO.forziere)
    if (r.che === 'fonte') return this.apri('fonte', r, RINCARO.fonte)
    if (r.che === 'mercante') return this.mercante(r)
    if (r.che === 'scala') return this.allaScala()
    if (r.che === 'cosa') return this.trovata(r)
    if (r.che === 'gemme') return this.raccogli()
    if (r.che === 'curiosita') return r.visto ? undefined : this.apri('curiosita', r, RINCARO.curiosita)
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

  scontro(m) {
    this.foglio = { che: 'scontro', chi: m }
    this.chiedi('scontro', MOSTRI[m.tipo].capo ? RINCARO.capo : RINCARO.mostro)
  }

  // unico ingresso dall'esterno quando un foglio chiede qualcosa; torna cosa è successo per il suono e la scossa giusti
  rispondi(giusto) {
    const f = this.foglio
    if (!f) return null
    this.domande++
    if (giusto) this.giuste++

    if (f.che === 'scontro') return this.rispostaScontro(f.chi, giusto)
    if (f.che === 'porta') return this.rispostaPorta(f.chi, giusto)
    if (f.che === 'forziere') return this.rispostaForziere(f.chi, giusto)
    if (f.che === 'fonte') return this.rispostaFonte(f.chi, giusto)
    if (f.che === 'curiosita') return this.rispostaCuriosita(f, giusto)
    return null
  }

  // ogni esito dice lo scambio per intero (tolto e preso): senza il numero, un bambino che risponde bene
  // e vede la vita calare crede di aver sbagliato (docs/sotterraneo/regole.md)
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
      const male = this.graffio(m)   // il mostro è ancora in piedi, quindi restituisce: chi è caduto no
      this.ferisci(male)
      if (this.vita <= 0) { this.svieni(); return { che: 'svenuto', dato, preso: male } }
      this.chiedi('scontro', MOSTRI[m.tipo].capo ? RINCARO.capo : RINCARO.mostro)
      return { che: 'colpo', restano: this.colpiPer(m), male, dato, preso: male }
    }
    this.cade(m)
    this.chiudi()
    return { che: 'caduto', chi: m, dato, preso: 0 }
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
      if (p.vitaPiu) { this.vitaBase += p.vitaPiu; this.vita += p.vitaPiu }
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

  // svenire non fa perdere la discesa finché ci sono occasioni (svenimentiDi); all'ultima si risveglia fuori (docs/sotterraneo/regole.md)
  svieni() {
    this.svenimenti++
    this.svenimentiQui++
    this.ultimoSvenimento = this.svenimentiSpesi >= this.svenimentiConcessi
    this.foglio = { che: 'svenuto', ultimo: this.ultimoSvenimento,
                    restano: Math.max(0, this.svenimentiConcessi - this.svenimentiSpesi) }
    this.chiesta = null
  }

  riprendi() {
    // nella campagna l'ultima è la risalita (tappa non superata); nell'abisso finisce la sera, non la discesa: ci si rimette in piedi comunque
    if (this.ultimoSvenimento && !this.senzaFondo) { this.perche = 'svenuto'; this.risali(); return }
    this.rimettiInPiedi()
    if (this.ultimoSvenimento) { this.perche = 'svenuto'; this.risali(); return }
    this.chiudi()
  }

  // metà gemme, mezza vita, mostri a casa loro: risvegliarsi con l'orco ancora addosso non sarebbe una seconda occasione
  rimettiInPiedi() {
    this.gemme = Math.floor(this.gemme / 2)
    this.vita = Math.max(6, Math.round(this.vitaMax / 2))
    // nell'abisso si svuotano le sei tasche (quello addosso resta): punisce il margine, non il lavoro di dieci piani
    if (this.senzaFondo && this.zaino.length) {
      const quante = this.zaino.length
      this.zaino = []
      this.dillo(`🎒 ${quante === 1 ? 'quello che avevi in tasca' : 'quello che avevi nelle tasche'} non c'è più`)
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
      this.dillo(insieme.length > 1 ? '🚪 la stanza si apre' : '🚪 la porta si apre')
      this.chiudi()
      return { che: 'aperta' }
    }
    this.dillo('la serratura non si muove')
    this.chiudi()
    return { che: 'chiusa' }
  }

  // l'unica cosa che si perde per sempre, apposta: senza, niente nel sotterraneo fa un po' di batticuore
  rispostaForziere(f, giusto) {
    f.aperto = true
    if (!giusto) {
      f.vuoto = true
      this.dillo('🎁 il forziere resta chiuso')
      this.chiudi()
      return { che: 'niente' }
    }
    this.tesori++
    // il bottino cade davanti al baule, mai dentro (posaRoba); predilige la classe che l'ha aperto (PESO_ALTRUI)
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

  // tre secondi di vantaggio (non immunità: chi resta nella stanza se lo ritrova addosso), e costa un
  // graffio (docs/sotterraneo/regole.md): gratis era la mossa migliore del gioco
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

  // ce l'ho già? Addosso o in tasca è lo stesso: una seconda spada uguale non serve. Pozioni fanno eccezione
  possiedo(k) {
    return this.mano === k || this.mancina === k || this.corpo === k ||
           this.dito === k || this.zaino.includes(k)
  }

  quanteNeHo(k) {
    // la torcia non sta in nessuna tasca: quella che brucia più quelle alla cintura
    if (COSE[k] && COSE[k].usa === 'luce')
      return (this.torciaAccesa ? 1 : 0) + this.torceInScorta
    return this.zaino.filter(x => x === k).length +
           (this.mano === k || this.corpo === k || this.dito === k ? 1 : 0)
  }

  mercante(m) {
    if (!m.roba) {
      // cinque e non tre (docs/sotterraneo/roba.md); non si offre quello che si ha già addosso, tranne quello che si consuma
      const siAccumula = k => !!COSE[k].usa
      const utile = k => siAccumula(k) || !this.possiedo(k)
      // pescato pesando per prezzo/profondità (pescaMerce), non a caso uniforme; il peso della classe (tua) non è un filtro
      m.roba = pescaMerce(this.durezza(), { quante: 5, rnd: () => this.rnd(),
                                            ammessa: utile, tua: k => this.posso(k) })
    }
    this.foglio = { che: 'mercante', chi: m }
  }

  // le tre che curano (sempre lì) più i cinque pescati; `sempre` lo dice a chi disegna, o una riga che non si esaurisce sembra un guasto
  mercanzia() {
    const f = this.foglio
    if (!f || f.che !== 'mercante') return []
    return [
      ...CURE.map(chiave => ({ chiave, sempre: true })),
      ...(f.chi.roba || []).map(chiave => ({ chiave, sempre: false })),
    ]
  }

  // a metà prezzo: comprare e rivendere è una perdita, non un modo di fare gemme girando in tondo (docs/sotterraneo/roba.md)
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
    // comprare quello che non si può impugnare sarebbe l'unico modo di perdere gemme senza guadagnare niente
    if (c.dove && !this.posso(k)) { this.dillo(this.perchéNo(k)); return { che: 'niente' } }
    if (this.gemme < c.prezzo) return { che: 'niente' }
    // lo zaino pieno non ferma quello che si mette addosso: la casella è un altro posto
    const vaAddosso = c.dove &&
      (c.dove !== 'mancina' || this.mancinaLibera()) && (() => {
      const conf = this.confronto(k)
      return !conf.addosso || conf.delta > 0
    })()
    const siAccende = c.usa === 'luce'   // come quella trovata per terra: non chiede una tasca
    const serveTasca = !siAccende && (!vaAddosso || !!this.casella(this.confronto(k).dove))
    if (serveTasca && this.zaino.length >= TASCHE) {
      this.dillo('🎒 lo zaino è pieno')
      return { che: 'pieno' }
    }
    this.gemme -= c.prezzo
    if (scorta) f.chi.roba.splice(f.chi.roba.indexOf(k), 1)   // il pescato è unico e se ne va; una cura no
    if (siAccende) { this.accendi(k); return { che: 'comprato', cosa: k, addosso: true } }
    // comprata e messa, come la roba per terra (trovata): chi spende gemme per una corazza migliore la sta comprando per metterla
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

  // una tasca toccata apre le sue azioni invece di eseguirne una: usa/butta/riponi. Il verbo lo sceglie chi
  // disegna dai dati (dove, usa): il motore non scrive "bevo" da nessuna parte
  usa(i) {
    const k = this.zaino[i]
    if (!k) return null
    const c = COSE[k]
    if (c.dove) {
      // rete sotto (chi disegna già sa `posso` e lo scrive sulla tasca): il tasto dice perché no, mai muto
      if (!this.posso(k)) { this.dillo(this.perchéNo(k)); return { che: 'niente' } }
      // quello che si aveva addosso torna nello zaino, non sparisce; per un'arma il posto lo sceglie `confronto`
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
    this.dillo(`${COSE[k].em} per terra`)
    return { che: 'buttata', cosa: k }
  }

  riponi(dove) {
    const k = this.casella(dove)
    if (!k) return null
    if (this.zaino.length >= TASCHE) { this.dillo('🎒 lo zaino è pieno'); return { che: 'pieno' } }
    this.metti(dove, null)
    this.vita = Math.min(this.vita, this.vitaMax)   // togliendosi l'amuleto il tetto scende, e la vita lo segue
    this.zaino.push(k)
    this.dillo(`${COSE[k].em} nello zaino`)
    return { che: 'riposta', cosa: k }
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
    this.pianiFatti++
    if (this.piano >= this.quantiPiani - 1) {
      this.finita = true
      this.vinta = true
      this.foglio = null
      this.chiesta = null
      return { che: 'finita' }
    }
    this.piano++
    this.svenimentiQui = 0   // le occasioni si rinnovano scendendo, e solo scendendo (svenimentiSpesi)
    this.vitaBase += VITA_PER_PIANO
    this.vita = Math.min(this.vitaMax, this.vita + RIPOSO_SCALA)
    this.nuovoPiano()
    this.chiudi()
    this.dillo(`piano ${this.piano + 1}`)
    return { che: 'sceso', piano: this.piano }
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
      mostri: this.mostriBattuti, tesori: this.tesori,
      gemme: this.gemme, stanze: this.stanzeViste,
    }
  }
}
