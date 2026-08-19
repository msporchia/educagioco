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
} from '../dati/mondo.js'
import { MOSTRI } from '../dati/mostri.js'
import { eroeDi, DI_PARTENZA } from '../dati/eroi.js'
import { COSE, IN_VENDITA, NEI_FORZIERI } from '../dati/cose.js'
import { durezzaDi, guardianoDi } from '../dati/campagna.js'
import { generaPiano } from './livello.js'
import { percorso, viaVerso, primaLibera } from '../../../motore/passi.js'

/* Quanto rincara la domanda, per ogni cosa. Sono i numeri che fanno la
   differenza fra un bambino prudente e uno che va a caccia di scrigni:
   la porta costa meno del piano, il forziere molto di più, e il capo sta
   in mezzo perché la sua durezza vera sono le ossa, non la domanda. */
const RINCARO = { porta: -0.05, forziere: 0.25, fonte: 0, mostro: 0.05, capo: 0.2 }

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
  get dif() { return this.io.dif + this.addosso('dif') }
  /* La vita massima **non è un campo**: cresce coi piani (`vitaBase`) e
     con quello che si porta al dito. Tenerla come numero voleva dire
     ricordarsi di alzarla e abbassarla ogni volta che l'amuleto entra o
     esce, cioè dimenticarsene una volta su due. */
  get vitaMax() { return this.vitaBase + this.addosso('vita') }
  get quantiPiani() { return this.tappa.piani }

  /* Quanto danno, in tutto, le tre caselle addosso. Un posto solo: chi
     vuole sapere quanto picchia chiede qui, e non va a guardare dentro
     le tasche. */
  addosso(campo) {
    let n = 0
    for (const k of [this.mano, this.corpo, this.dito])
      if (k && COSE[k]) n += COSE[k][campo] || 0
    return n
  }

  /* Dov'è la casella di una cosa, e cosa c'è dentro adesso. */
  casella(dove) { return dove === 'mano' ? this.mano : dove === 'corpo' ? this.corpo : this.dito }
  metti(dove, k) {
    if (dove === 'mano') this.mano = k
    else if (dove === 'corpo') this.corpo = k
    else this.dito = k
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

  /* ═══════════ il piano ═══════════ */
  nuovoPiano() {
    const t = this.tappa
    this.livello = generaPiano({
      seme: this.seme + this.piano * 7919, piano: this.piano,
      largo: t.misura, alto: t.misura, giri: t.giri,
      guardiano: guardianoDi(t, this.piano),
    })
    const dentro = this.livello.stanze[0]
    this.eroe = { x: dentro.cx + 0.5, y: dentro.cy + 0.5 }
    this.guarda = 'dx'
    this.strada = null
    this.mira = null
    this.bersaglio = null
    this.visto = new Uint8Array(t.misura * t.misura)
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

  /* Su cosa ci si sale, e a cosa ci si ferma accanto. Le cose per terra
     stanno fra le prime: raccoglierle vuol dire arrivarci sopra. */
  sopra(che) { return ['scala', 'mercante', 'fonte', 'cosa', 'gemme'].includes(che) }

  /* `preciso` distingue il tocco dal trascinamento: tenendo premuto e
     muovendo il dito l'eroe insegue, e non deve aprire pannelli per ogni
     cosa che sfiora. */
  vaiVerso(c, preciso = true) {
    if (this.foglio || this.finita) return
    const mira = preciso ? this.cosaC(c) : null
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
     perché non c'è niente da decidere. Quello che si **impugna o si
     indossa** apre invece un foglio, ed è l'unico posto del gioco dove
     un numero si legge prima di sceglierlo: «questa ti dà due colpi in
     più di quella che hai». Senza quel confronto un bambino sceglie
     un'arma dal disegno, e il disegno non dice quanto fa male. */
  trovata(r) {
    const c = COSE[r.cosa]
    if (!c) return
    if (c.dove) { this.foglio = { che: 'trovata', chi: r, cosa: r.cosa, ...this.confronto(r.cosa) }; return }
    if (this.zaino.length >= TASCHE) { this.dillo('🎒 lo zaino è pieno'); return }
    this.zaino.push(r.cosa)
    r.presa = true
    this.dillo(`${c.em} ${c.nome}`)
  }

  /* Quanto vale una cosa **rispetto a quella che si ha già addosso**: il
     motore lo sa perché è l'unico che sa cosa c'è in mano, e chi disegna
     non deve sommare niente. */
  confronto(k) {
    const c = COSE[k]
    if (!c || !c.dove) return null
    const campo = c.dove === 'mano' ? 'att' : c.dove === 'corpo' ? 'dif' : 'dono'
    const addosso = this.casella(c.dove)
    /* la guardia non è pignoleria: un salvataggio scritto quando le cose
       si chiamavano in un altro modo arriva qui con una chiave che non
       esiste più, e senza il `?.` il gioco si spegne su una schermata
       nera invece di ignorare un oggetto */
    const mio = addosso ? (COSE[addosso]?.[campo] || 0) : 0
    return { dove: c.dove, campo, addosso, delta: (c[campo] || 0) - mio }
  }

  /* ── i tre modi di rispondere a una cosa trovata ──
     Impugnare non passa dallo zaino: si prende e si mette, e quello che
     si aveva **prende il posto per terra** di quello che si è raccolto
     se le tasche sono piene. Uno scambio, non una perdita: una spada
     lasciata cadere per prenderne un'altra è la cosa che fa arrabbiare
     di più, e succede proprio quando lo zaino è pieno — cioè sempre
     quando conta. */
  impugna() {
    const f = this.foglio
    if (!f || f.che !== 'trovata') return null
    const k = f.cosa, c = COSE[k], r = f.chi
    const vecchio = this.casella(c.dove)
    this.metti(c.dove, k)
    r.presa = true
    if (vecchio) {
      if (this.zaino.length < TASCHE) this.zaino.push(vecchio)
      else this.livello.robe.push({ che: 'cosa', cosa: vecchio, x: r.x, y: r.y,
                                    em: COSE[vecchio].em })
    }
    this.dillo(`${c.em} ${c.nome}`)
    this.chiudi()
    return { che: 'addosso', cosa: k }
  }

  inTasca() {
    const f = this.foglio
    if (!f || f.che !== 'trovata') return null
    if (this.zaino.length >= TASCHE) { this.dillo('🎒 lo zaino è pieno'); return { che: 'pieno' } }
    this.zaino.push(f.cosa)
    f.chi.presa = true
    this.dillo(`${COSE[f.cosa].em} ${COSE[f.cosa].nome}`)
    this.chiudi()
    return { che: 'presa', cosa: f.cosa }
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
    return null
  }

  rispostaScontro(m, giusto) {
    if (!giusto) {
      const male = this.danno(m)
      this.ferisci(male)
      if (this.vita <= 0) { this.svieni(); return { che: 'svenuto' } }
      this.chiedi('scontro', MOSTRI[m.tipo].capo ? RINCARO.capo : RINCARO.mostro)
      return { che: 'ferito', quanto: male }
    }
    m.ossa -= this.colpo(m)
    if (m.ossa > 0) {
      /* il mostro è ancora in piedi, quindi restituisce: chi è caduto no */
      const male = this.graffio(m)
      this.ferisci(male)
      if (this.vita <= 0) { this.svieni(); return { che: 'svenuto' } }
      this.chiedi('scontro', MOSTRI[m.tipo].capo ? RINCARO.capo : RINCARO.mostro)
      return { che: 'colpo', restano: this.colpiPer(m), male }
    }
    this.cade(m)
    this.chiudi()
    return { che: 'caduto', chi: m }
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
    if (possibili.length && this.rnd() < 0.7) {
      const cosa = possibili[Math.floor(this.rnd() * possibili.length)]
      this.posaRoba({ che: 'cosa', cosa, em: COSE[cosa].em }, { x: m.x + 1, y: m.y })
    }
    this.dillo(`${m.em} è caduto!`)
  }

  ferisci(quanto) {
    this.vita = Math.max(0, this.vita - quanto)
  }

  /* Svenire non fa perdere la discesa: ci si risveglia all'ingresso con
     metà gemme e mezza vita. Quello che si aveva addosso resta — perdere
     anche la spada vorrebbe dire ricominciare, e ricominciare dopo venti
     minuti di strada è il modo di far chiudere il gioco. */
  svieni() {
    this.svenimenti++
    this.foglio = { che: 'svenuto' }
    this.chiesta = null
  }

  riprendi() {
    this.gemme = Math.floor(this.gemme / 2)
    this.vita = Math.max(6, Math.round(this.vitaMax / 2))
    const dentro = this.livello.stanze[0]
    this.eroe = { x: dentro.cx + 0.5, y: dentro.cy + 0.5 }
    this.strada = null; this.mira = null; this.bersaglio = null
    /* i mostri svegli tornano a casa: risvegliarsi all'ingresso con
       l'orco ancora addosso non è una seconda occasione */
    for (const m of this.livello.robe) if (m.che === 'mostro') { m.sveglio = false; m.calmo = CALMA }
    this.aggiornaLuce()
    this.chiudi()
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
    /* il bottino cade **davanti** al baule, mai dentro: vedi `posaRoba` */
    const cosa = NEI_FORZIERI[Math.floor(this.rnd() * NEI_FORZIERI.length)]
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
     non fa niente. */
  scappa() {
    const f = this.foglio
    if (f && f.che === 'scontro') { f.chi.calmo = CALMA; f.chi.sveglio = false }
    this.chiudi()
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
  mercante(m) {
    if (!m.roba) {
      const mescolato = [...IN_VENDITA].sort(() => this.rnd() - 0.5)
      m.roba = mescolato.slice(0, 3)
    }
    this.foglio = { che: 'mercante', chi: m }
  }

  compra(k) {
    const f = this.foglio
    if (!f || f.che !== 'mercante') return null
    const c = COSE[k]
    if (!c || !f.chi.roba.includes(k)) return null
    if (this.gemme < c.prezzo) return { che: 'niente' }
    if (this.zaino.length >= TASCHE) { this.dillo('🎒 lo zaino è pieno'); return { che: 'pieno' } }
    this.gemme -= c.prezzo
    this.zaino.push(k)
    f.chi.roba.splice(f.chi.roba.indexOf(k), 1)
    this.dillo(`${c.em} ${c.nome}`)
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
      /* quello che si aveva addosso torna nello zaino: non sparisce,
         perché una spada lasciata cadere per prenderne un'altra è la cosa
         che fa arrabbiare di più */
      const vecchio = this.casella(c.dove)
      this.metti(c.dove, k)
      this.zaino.splice(i, 1)
      if (vecchio) this.zaino.push(vecchio)
      this.dillo(`${c.em} ${c.nome}`)
      return { che: 'addosso', cosa: k }
    }
    if (c.usa === 'cura') {
      this.vita = Math.min(this.vitaMax, this.vita + c.cura)
      this.zaino.splice(i, 1)
      this.dillo(`❤️ +${c.cura}`)
      return { che: 'curato' }
    }
    if (c.usa === 'luce') {
      this.torcia = true
      this.zaino.splice(i, 1)
      this.aggiornaLuce()
      this.dillo('🔦 si vede più lontano')
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
      piani: this.pianiFatti, quantiPiani: this.quantiPiani,
      mostri: this.mostriBattuti, tesori: this.tesori,
      gemme: this.gemme, stanze: this.stanzeViste,
    }
  }
}
