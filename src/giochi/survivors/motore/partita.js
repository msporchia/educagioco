/* ═══════════════════════════════════════════════════════════════════
   UNA PARTITA — le regole, senza schermo

   L'eroe sta fermo in mezzo al mondo e spara da solo al mostro più
   vicino: il bambino ha **una cosa sola da fare col dito**, schivare. I
   mostri lasciano gemme, le gemme fanno salire di livello, e a ogni
   livello la partita si ferma e chiede di scegliere una carta — che si
   paga con una domanda (`dati/mazzo.js` dice quanto).

   Qui dentro non c'è un canvas, non c'è Vue, non c'è una moneta e non
   c'è una materia scolastica. C'è il tempo che passa (`avanza(dt)`), il
   dito ridotto a una direzione (`muovi`), e il caso che arriva da fuori
   (`rnd`) — perché una partita si deve poter rifare identica, o il banco
   di prova racconta ogni volta una storia diversa.

   Chi coordina fa tre cose e basta:

     partita.muovi(dx, dy)      dove sta andando il dito
     partita.avanza(dt)         un pezzetto di tempo
     partita.prendi(chiave)     la carta scelta (a offerta aperta)

   e legge `scena()` per disegnare, `cruscotto` per i numeri in cima,
   `svuotaEventi()` per i suoni.
   ═══════════════════════════════════════════════════════════════════ */
import { CFG, soglia, stellePerFerite } from '../dati/taratura.js'
import { MOSTRI, CHIAVI_MOSTRI, ammessi } from '../dati/mostri.js'
import { MAZZO, prezzoDomanda, palliniDelPrezzo, scalinoDelPrezzo, PALLINI }
  from '../dati/mazzo.js'

const CAMPO_MINIMO = { larghezza: 360, altezza: 620 }

/* quanto resta addosso il freddo di una freccia gelata, in secondi. Due
   secondi buoni: il gelo deve durare abbastanza da vedersi cambiare la
   scena — quello lì arranca, gli altri no — o è un lampo azzurro e basta. */
const GELO_DARDO = 2.2

export class Regole {
  static perTappa(t) { return new Regole(t) }

  constructor(t) {
    this.chiave = t.chiave
    this.nome = t.nome
    this.scenario = t.scenario
    this.durata = t.durata
    this.ritmo = t.ritmo
    this.vigore = t.vigore
    this.fretta = t.fretta
    this.rincaro = t.rincaro || 0
    this.squadra = (t.squadra || ['melma']).slice()
    this.premio = t.premio || 3
    this.cuori = t.cuori || CFG.cuoriIniziali
  }

  get infinita() { return !Number.isFinite(this.durata) }

  /* Quanta tappa è passata: 0 all'inizio, 1 al traguardo. È l'unico
     orologio che il resto del motore guarda, così una tappa da 40 secondi
     e una da 120 salgono con la stessa curva invece che a caso.

     **Oltre 1 non si ferma.** Prima c'era un tetto — 1 in campagna, 2 nel
     gioco libero — e voleva dire che dopo quattro minuti di sopravvivenza
     i mostri non diventavano più fitti né più duri mentre l'eroe
     continuava a crescere: da lì in poi non era più una partita, era
     un'attesa. Adesso la marea sale sempre, e prima o poi ti prende: è
     quello che rende un punteggio un punteggio.

     Oltre il traguardo cambia però l'orologio: non conta più la durata di
     *questa* tappa ma quella «tipo», uguale per tutti. Se no il minuto
     dopo la vittoria su una tappa da 40 secondi peserebbe tre volte lo
     stesso minuto su una da due. */
  quota(tempo) {
    if (!(tempo > 0)) return 0
    const su = this.infinita ? CFG.tappaTipo : this.durata
    if (tempo <= su) return tempo / su
    return 1 + (tempo - su) / CFG.tappaTipo
  }

  /* ═══════════ LA MAREA ═══════════
     Quanta pressione c'è addosso adesso. Non è la quota di tappa: è il
     **tempo vero**, misurato sulla tappa «tipo» e uguale per tutte.

     Prima le tre leve seguivano la quota, e voleva dire che al minuto
     quaranta di una tappa da quaranta secondi c'era la stessa piena che
     al minuto tre di una da tre minuti: allungare una tappa non la
     rendeva più lunga, la rendeva più dura per tutta la sua durata, e
     ogni volta che si spostava un secondo bisognava riabbassare i
     moltiplicatori. Adesso la marea è una sola per tutti, e quello che
     cambia da tappa a tappa è **fin dove si arriva**: quarantacinque
     secondi finiscono che l'acqua è alla caviglia, tre minuti che è al
     petto. È anche l'unico modo perché restare in campo dopo il
     traguardo sia la continuazione naturale della stessa curva. */
  marea(tempo) { return Math.max(0, tempo) / CFG.tappaTipo }

  /* ═══════════ le tre leve, che oltre il traguardo si sciolgono ═══════════
     Dentro la tappa valgono i suoi moltiplicatori. Dopo, si passa in due
     minuti a quelli di `CFG.oltre`, uguali per tutte: chi resta in campo
     dopo il prato verde non deve trovarsi in una passeggiata solo perché
     quella tappa è gentile con chi impara. Il traguardo è il punto in cui
     la tappa finisce di essere una tappa. */
  leva(nome, tempo) {
    const q = this.quota(tempo)
    if (q <= 1 || this.infinita) return this[nome]
    const k = Math.min(1, q - 1)
    return this[nome] + (CFG.oltre[nome] - this[nome]) * k
  }

  nascite(tempo) { return CFG.natePerSecondo(this.marea(tempo)) * this.leva('ritmo', tempo) }
  /* quanti ne può contenere il campo adesso: sale col tempo, o chi tira
     forte si troverebbe il mondo vuoto e la partita vinta in anticipo */
  tetto(tempo) { return CFG.maxNemici(this.marea(tempo)) }
  vitaNemico(tempo) { return CFG.vitaNemico(this.marea(tempo)) * this.leva('vigore', tempo) }
  frettaNemico(tempo) { return CFG.frettaNemico(this.marea(tempo)) * this.leva('fretta', tempo) }
  /* Chi può comparire adesso: la quota di tappa apre le bestie una per
     volta. **Oltre il traguardo entrano tutte**, anche quelle che la
     tappa non aveva: chi resta in campo dopo aver vinto il prato verde
     starebbe se no a schivare melme fino a domani, e la partita che non
     può finire non finirebbe davvero. Da lì in poi il gioco è uno solo. */
  squadraOra(tempo) {
    const q = this.quota(tempo)
    if (q <= 1) return ammessi(this.squadra, q)
    /* le bestie che la tappa non aveva entrano col loro comodo, come se
       oltre il traguardo cominciasse una seconda tappa: tutte insieme di
       colpo sarebbe un tranello, non una salita */
    const nuove = ammessi(CHIAVI_MOSTRI, Math.min(1, q - 1))
    return [...new Set([...this.squadra, ...nuove])]
  }
}

export class Partita {
  constructor(regole, { rnd = Math.random, campo = null, mazzo = MAZZO } = {}) {
    this.regole = regole
    this.rnd = rnd
    this.mazzo = mazzo
    this.campo = { ...CAMPO_MINIMO, ...(campo || {}) }

    this.eroe = {
      x: 0, y: 0, vx: 0, vy: 0,
      cuori: regole.cuori, cuoriMax: regole.cuori,
      invuln: 0, guarda: 1, passi: 0, ricarica: 0.25, mira: 0,
    }
    this.nemici = []
    this.colpi = []
    this.gemme = []
    this.effetti = []
    this.palle = []

    this.tempo = 0
    this.uccisi = 0
    this.ferite = 0
    this.livello = 1
    this.xp = 0
    this.prossima = soglia(1)
    this.potenziamenti = {}
    this.offerta = null
    this.esito = null
    this.eventi = []
    /* la tappa è stata portata a casa (e con quante ferite): si segna al
       traguardo e non cambia più, perché chi resta in campo dopo aver
       vinto non deve poter perdere le stelle che ha già guadagnato */
    this.conquistata = false
    this.feriteVinte = 0
    this.oltre = false            // si gioca oltre il traguardo

    this.dir = { x: 0, y: 0 }
    this.aNascere = 0
    this.orbita = 0
    this.tFuoco = 0
    this.tFulmine = 0

    this.ricalcola()
  }

  /* ═══════════ com'è messa ═══════════ */
  get finita() { return this.esito !== null }
  get vinta() { return this.conquistata }
  get inPausa() { return this.offerta !== null }
  /* al traguardo la partita si ferma per chiedere «continui?»: da lì in
     poi è tempo regalato, e quello che si è vinto è già vinto */
  get alTraguardo() { return this.esito === 'vinta' }
  get stelle() { return this.conquistata ? stellePerFerite(this.feriteVinte) : 0 }
  get monete() { return this.conquistata ? this.regole.premio * this.stelle : 0 }
  /* i secondi resistiti **dopo** aver vinto: il punteggio di chi continua */
  get extra() {
    return this.conquistata && !this.regole.infinita
      ? Math.max(0, this.tempo - this.regole.durata) : 0
  }
  get restano() {
    if (this.regole.infinita || this.oltre) return Infinity
    return Math.max(0, this.regole.durata - this.tempo)
  }

  /* quanto vale adesso un potenziamento */
  livelloDi(chiave) { return this.potenziamenti[chiave] || 0 }

  /* Il campo si misura da fuori: in Node è una stanza qualunque, nel
     browser è il canvas vero. Serve per sapere da dove entrano i mostri —
     appena oltre il bordo, non su un cerchio largo: da un angolo lontano
     ci metterebbero dieci secondi ad arrivare, e i primi quindici secondi
     sono quelli che decidono se il gioco piace. */
  misuraCampo(larghezza, altezza) {
    if (larghezza > 0 && altezza > 0) this.campo = { larghezza, altezza }
  }

  /* ═══════════ il dito ═══════════
     Non arriva un punto dello schermo ma una direzione: chi coordina sa
     cos'è un dito, il motore no. */
  muovi(dx = 0, dy = 0) {
    const l = Math.sqrt(dx * dx + dy * dy)
    if (l < 0.001) { this.dir.x = 0; this.dir.y = 0; return }
    this.dir.x = dx / l
    this.dir.y = dy / l
  }

  fermati() { this.dir.x = 0; this.dir.y = 0 }

  /* ═══════════ i numeri dell'eroe ═══════════
     Si ricalcolano solo quando cambia qualcosa, non sessanta volte al
     secondo: sono venti moltiplicazioni, ma sono anche l'unico posto in
     cui una carta diventa un numero, e va guardato tutto insieme. */
  ricalcola() {
    const lv = k => this.livelloDi(k)
    this.f = {
      velocita: CFG.velocitaEroe * (1 + 0.17 * lv('stivali')),
      raggio: CFG.raggioEroe,
      /* ── quanto rende una carta tosta ──
         Alte apposta. I mostri hanno vita da vendere (vedi `vigore` in
         `campagna.js`) e con l'arco di partenza non si bucano: la
         differenza fra chi le carte forti se le è guadagnate rispondendo
         e chi ne ha perse due per strada deve essere la differenza fra
         passare e non passare. Se il moltiplicatore fosse gentile,
         sbagliare costerebbe un fastidio invece di una tappa. */
      cadenza: CFG.cadenza * Math.pow(0.75, lv('mani')),
      frecce: 1 + lv('frecce'),
      danno: 1 + 2.1 * lv('grandi'),
      gittata: CFG.gittata * (1 + 0.26 * lv('lunghe')),
      velColpo: CFG.velocitaFreccia * (1 + 0.16 * lv('lunghe')),
      raggioColpo: 5 + 1.6 * lv('grandi'),
      calamita: CFG.calamita + 48 * lv('magnete'),
      gelo: lv('gelo') ? 66 + 20 * lv('gelo') : 0,
      freno: Math.max(0.30, 1 - 0.20 * lv('gelo')),
      /* il dardo gelato: quante frecce su cento congelano, e quanto pesa
         il gelo che lasciano addosso. Sono due cose separate dall'aura —
         un mostro può essere gelato senza avere lo scudo di ghiaccio, e
         chi ha tutte e due si tiene il freno più forte dei due */
      dardo: 0.15 * lv('dardo'),
      frenoDardo: lv('dardo') ? Math.max(0.35, 0.60 - 0.05 * lv('dardo')) : 1,
      spine: lv('spine') ? 2 + 3 * lv('spine') : 0,
      valoreGemma: 1 + lv('gemme'),
      fortuna: 0.14 * lv('stella'),
      perfora: lv('occhi'),
      invuln: CFG.invulnerabilita + 0.5 * lv('fantasma'),
      palle: lv('palla'),
      fuoco: lv('fuoco'),
      fulmine: lv('fulmine'),
    }
  }

  /* ═══════════ i suoni, senza fare rumore ═══════════
     Il motore non suona: dice cosa è successo, e chi coordina decide se
     quello è un «pew» o niente. */
  segnala(che) { if (this.eventi.length < 60) this.eventi.push(che) }
  svuotaEventi() { const e = this.eventi; this.eventi = []; return e }

  /* ═══════════ IL PASSO ═══════════ */
  avanza(dt) {
    if (this.finita || this.inPausa || !(dt > 0)) return this.esito
    if (dt > 0.05) dt = 0.05                      // una scheda tornata in primo piano

    this.tempo += dt
    /* il traguardo si guarda per primo: chi resiste fino allo scadere ha
       resistito, anche se al tocco dopo lo avrebbero preso. La tappa è
       vinta qui — le stelle si contano adesso — e la partita si ferma per
       chiedere se si vuole restare (`continua()`). */
    if (!this.regole.infinita && !this.conquistata && this.tempo >= this.regole.durata) {
      this.conquistata = true
      this.feriteVinte = this.ferite
      return this.finisci('vinta')
    }

    /* il livello avanzato dal passo di prima (l'esperienza può bastare
       per due livelli di fila: uno alla volta, con la sua offerta) */
    if (this.xp >= this.prossima) { this.salgo(); return this.esito }

    this.muoviEroe(dt)
    this.nascite(dt)
    if (this.camminaNemici(dt)) return this.esito     // l'ultimo cuore
    this.tira(dt)
    this.muoviColpi(dt)
    this.pallaGirante(dt)
    this.anelloDiFuoco(dt)
    this.saetta(dt)
    this.raccogliMorti()
    this.muoviGemme(dt)
    this.muoviEffetti(dt)
    return this.esito
  }

  finisci(esito) {
    this.esito = esito
    this.offerta = null
    this.segnala(esito === 'vinta' ? 'trionfo' : 'fine')
    return esito
  }

  /* ═══════════ SI RESTA IN CAMPO ═══════════
     Dopo il traguardo la tappa è in tasca: stelle e monete sono contate e
     non si toccano più. Chi vuole può restare, e da qui in poi c'è una
     cosa sola da fare — resistere — con la marea che continua a salire
     (vedi `Regole.quota`). Non si può vincere di nuovo: si può solo
     durare, e alla fine ti prendono. È quello il punteggio. */
  continua() {
    if (this.esito !== 'vinta' || this.regole.infinita) return false
    this.esito = null
    this.oltre = true
    return true
  }

  /* ── l'eroe ── */
  muoviEroe(dt) {
    const e = this.eroe
    if (this.dir.x || this.dir.y) {
      const v = this.f.velocita
      e.vx = this.dir.x * v
      e.vy = this.dir.y * v
      e.x += e.vx * dt
      e.y += e.vy * dt
      if (this.dir.x > 0.5) e.guarda = 1
      else if (this.dir.x < -0.5) e.guarda = -1
      e.passi += v * dt
      /* polvere sotto i piedi: si vede che gli stivali fanno effetto */
      if (this.rnd() < dt * (6 + v / 26))
        this.effetti.push({ che: 'briciola', x: e.x - e.vx * 0.06, y: e.y + 12,
                            vx: -e.vx * 0.15, vy: -12, r: 2.5, colore: '#e9dcae',
                            vita: 0.35, tot: 0.35 })
    } else { e.vx = 0; e.vy = 0 }
    if (e.invuln > 0) e.invuln -= dt
  }

  /* ── chi nasce ── */
  nascite(dt) {
    this.aNascere += this.regole.nascite(this.tempo) * dt
    while (this.aNascere >= 1) { this.aNascere -= 1; this.nasceNemico() }
  }

  tipoDelMomento() {
    const buoni = this.regole.squadraOra(this.tempo)
    /* gli ultimi arrivati sono più probabili, ma i primi non spariscono mai */
    let totale = 0
    for (const k of buoni) totale += MOSTRI[k].peso
    let s = this.rnd() * totale
    for (const k of buoni) { s -= MOSTRI[k].peso; if (s <= 0) return k }
    return buoni[0]
  }

  /* Da dove entra un mostro: appena oltre il bordo, e per più della metà
     delle volte **davanti a chi corre**. Il resto arriva da un lato
     qualunque, o scappare in una direzione a caso sarebbe altrettanto
     buono che scappare bene. */
  angoloDiNascita() {
    const e = this.eroe
    const corre = e.vx || e.vy
    if (corre && this.rnd() < CFG.nasconoAvanti)
      return Math.atan2(e.vy, e.vx) + (this.rnd() * 2 - 1) * CFG.aperturaNascita
    return this.rnd() * 6.283
  }

  nasceNemico() {
    if (this.nemici.length >= this.regole.tetto(this.tempo)) return
    const t = this.tipoDelMomento(), m = MOSTRI[t]
    const mx = this.campo.larghezza / 2 + 34, my = this.campo.altezza / 2 + 34
    const a = this.angoloDiNascita()
    const cx = Math.cos(a), cy = Math.sin(a)
    /* dall'angolo al bordo del rettangolo: si allunga il raggio finché
       non esce dallo schermo, sul lato che si incontra per primo */
    const quanto = Math.min(mx / Math.max(0.0001, Math.abs(cx)),
                            my / Math.max(0.0001, Math.abs(cy)))
    const ox = cx * quanto, oy = cy * quanto
    const mult = this.regole.vitaNemico(this.tempo)
    const vita = Math.ceil(m.vita * mult)
    this.nemici.push({
      tipo: t, x: this.eroe.x + ox, y: this.eroe.y + oy,
      r: m.r, vita, vitaMax: vita,
      passo: m.passo * (0.85 + this.rnd() * 0.3) * this.regole.frettaNemico(this.tempo),
      /* quanto costa spostarlo e quanto poco lo prende il freddo: si
         decide alla nascita, da quanto è salita la marea (`CFG.stazza`).
         Dentro la campagna vale 1 e non si sente */
      massa: CFG.stazza(mult),
      spx: 0, spy: 0, lampo: 0, gelato: 0, freno: 1, attesa: 0, fase: this.rnd() * 6.3,
    })
  }

  /* ── i mostri camminano verso l'eroe ──
     Torna `true` se qui è finita: è l'unico punto in cui si perde. */
  camminaNemici(dt) {
    const e = this.eroe
    const rg = this.f.gelo, freno = this.f.freno, raggio = this.f.raggio
    const limite = Math.hypot(this.campo.larghezza, this.campo.altezza) * CFG.troppoLontano
    const smorza = Math.pow(0.02, dt)
    for (const n of this.nemici) {
      const ddx = e.x - n.x, ddy = e.y - n.y
      const d = Math.sqrt(ddx * ddx + ddy * ddy) || 1
      if (d > limite) { n.sparito = true; continue }
      /* il freddo scende, e quando è finito il mostro riparte come nuovo;
         chi è dentro l'aura se lo prende di nuovo a ogni battito */
      n.gelato = Math.max(0, n.gelato - dt)
      if (n.gelato <= 0) n.freno = 1
      if (rg && d < rg) this.gela(n, 0.5, freno)
      const p = n.passo * n.freno
      n.x += ddx / d * p * dt + n.spx * dt
      n.y += ddy / d * p * dt + n.spy * dt
      n.spx *= smorza; n.spy *= smorza          // la spinta si spegne
      n.lampo = Math.max(0, n.lampo - dt * 4)
      n.attesa = Math.max(0, n.attesa - dt)
      n.fase += dt * 6

      if (d < n.r + raggio) {
        if (this.f.spine && n.attesa <= 0) { n.attesa = 0.5; this.ferisci(n, this.f.spine, '#ffd257') }
        if (e.invuln <= 0) {
          e.cuori--
          this.ferite++
          e.invuln = this.f.invuln
          this.segnala('ahia')
          this.anello(e.x, e.y, 70, '#ff5470')
          /* tutti indietro: un attimo di respiro, o si perdono tre cuori
             nello stesso mucchio senza aver potuto fare niente */
          for (const m of this.nemici) {
            const sx = m.x - e.x, sy = m.y - e.y
            const sd = Math.sqrt(sx * sx + sy * sy) || 1
            if (sd < 160) { m.spx += sx / sd * 460; m.spy += sy / sd * 460 }
          }
          if (e.cuori <= 0) { this.finisci('persa'); return true }
        } else {
          /* ti tocca mentre lampeggi: si scosta, ma i grossi tornano
             subito addosso — la stazza qui pesa a metà, perché quella
             spinta è anche il modo di non perdere due cuori in un
             battito, e il respiro non si toglie a chi è messo male */
          const s = -140 / Math.sqrt(n.massa || 1)
          n.spx += ddx / d * s; n.spy += ddy / d * s
        }
      }
    }
    return false
  }

  /* ── l'arco spara da solo al più vicino ── */
  tira(dt) {
    const e = this.eroe
    e.ricarica -= dt
    const bersaglio = this.piuVicino(e.x, e.y, this.f.gittata * 1.1)
    if (bersaglio) e.mira = Math.atan2(bersaglio.y - e.y, bersaglio.x - e.x)
    if (!bersaglio || e.ricarica > 0) return
    e.ricarica = this.f.cadenza
    const n = this.f.frecce
    for (let i = 0; i < n; i++) {
      const a = e.mira + (i - (n - 1) / 2) * CFG.apertura
      const fortunato = this.rnd() < this.f.fortuna
      /* si decide alla partenza, non all'impatto: così la freccia gelata
         si vede azzurra mentre vola, e il bambino capisce *perché* quel
         mostro ha cominciato ad arrancare */
      const gelida = this.rnd() < this.f.dardo
      this.colpi.push({
        x: e.x + Math.cos(a) * 14, y: e.y + Math.sin(a) * 14,
        vx: Math.cos(a) * this.f.velColpo, vy: Math.sin(a) * this.f.velColpo,
        a, danno: this.f.danno * (fortunato ? 2 : 1), oro: fortunato, gelida,
        r: this.f.raggioColpo, vita: this.f.gittata / this.f.velColpo,
        restano: this.f.perfora, presi: [],
      })
    }
    this.segnala('tiro')
  }

  muoviColpi(dt) {
    for (const c of this.colpi) {
      c.x += c.vx * dt; c.y += c.vy * dt; c.vita -= dt
      for (const n of this.nemici) {
        if (n.vita <= 0 || c.presi.includes(n)) continue
        const dx = n.x - c.x, dy = n.y - c.y, s = n.r + c.r
        if (dx * dx + dy * dy < s * s) {
          this.ferisci(n, c.danno, c.gelida ? '#9fe4ff' : c.oro ? '#ffd257' : '#fff')
          if (c.gelida) this.gela(n, GELO_DARDO, this.f.frenoDardo)
          const rinculo = 0.18 / (n.massa || 1)
          n.spx += c.vx * rinculo; n.spy += c.vy * rinculo
          c.presi.push(n)
          if (c.restano-- <= 0) { c.vita = 0; break }
        }
      }
    }
    this.colpi = this.colpi.filter(c => c.vita > 0)
  }

  /* ── le comete in orbita ──
     Era una pallina che sfiorava piano e sembrava un ornamento. Adesso è
     una cometa: più ne prendi e più l'orbita si allarga, gira più svelta e
     picchia più forte, e chi la incassa vola via. A quattro copie sono
     quattro comete che spazzano un cerchio largo: è la carta che si vede
     da lontano, ed è giusto che chi la sceglie senta di aver scelto. */
  pallaGirante(dt) {
    const q = this.f.palle
    if (!q) { if (this.palle.length) this.palle = []; return }
    this.orbita += dt * (2.3 + 0.45 * q)
    const R = 72 + 10 * q, danno = 3 + 3 * q, urto = 15 + 2 * q
    this.palle.length = q
    for (let i = 0; i < q; i++) {
      const a = this.orbita + i * (6.283 / q)
      const px = this.eroe.x + Math.cos(a) * R, py = this.eroe.y + Math.sin(a) * R
      this.palle[i] = { x: px, y: py, a, r: urto }
      for (const n of this.nemici) {
        const dx = n.x - px, dy = n.y - py, s = n.r + urto
        if (n.attesa <= 0 && dx * dx + dy * dy < s * s) {
          n.attesa = 0.35
          this.ferisci(n, danno, '#ffd9a0')
          this.spingi(n, 300)
        }
      }
    }
  }

  /* ── l'anello di fuoco ── */
  anelloDiFuoco(dt) {
    if (!this.f.fuoco) return
    this.tFuoco -= dt
    if (this.tFuoco > 0) return
    this.tFuoco = Math.max(1.5, 3.4 - 0.45 * this.f.fuoco)
    const R = 78 + 20 * this.f.fuoco, danno = 2 + 2.6 * this.f.fuoco
    this.anello(this.eroe.x, this.eroe.y, R, '#ff9f1c')
    this.segnala('fuoco')
    for (const n of this.nemici) {
      const dx = n.x - this.eroe.x, dy = n.y - this.eroe.y
      if (dx * dx + dy * dy < R * R) { this.ferisci(n, danno, '#ffb347'); this.spingi(n, 220) }
    }
  }

  /* ── il fulmine ── */
  saetta(dt) {
    if (!this.f.fulmine) return
    this.tFulmine -= dt
    if (this.tFulmine > 0) return
    this.tFulmine = Math.max(0.7, 2.3 - 0.4 * this.f.fulmine)
    const L = this.campo.larghezza, H = this.campo.altezza
    const vicini = this.nemici.filter(n => n.vita > 0 &&
      Math.abs(n.x - this.eroe.x) < L && Math.abs(n.y - this.eroe.y) < H)
    if (!vicini.length) return
    const n = vicini[Math.floor(this.rnd() * vicini.length)]
    this.effetti.push({ che: 'saetta', x: n.x, y: n.y, vita: 0.22, tot: 0.22 })
    this.ferisci(n, 3 + 3.5 * this.f.fulmine, '#ffffff')
    this.segnala('tuono')
  }

  /* ── chi è morto lascia la gemma ── */
  raccogliMorti() {
    let caduti = false
    for (const n of this.nemici) {
      if (n.vita > 0) continue
      caduti = true
      this.uccisi++
      this.scoppio(n.x, n.y, MOSTRI[n.tipo].colore, 9)
      this.gemme.push({ x: n.x, y: n.y, vx: (this.rnd() - 0.5) * 60,
                        vy: (this.rnd() - 0.5) * 60,
                        val: this.f.valoreGemma, fase: this.rnd() * 6.3 })
      this.segnala('morto')
    }
    if (caduti || this.nemici.some(n => n.sparito))
      this.nemici = this.nemici.filter(n => n.vita > 0 && !n.sparito)
  }

  /* ── le gemme: la calamita è la sensazione da non perdere ── */
  muoviGemme(dt) {
    const e = this.eroe
    const cal = this.f.calamita
    const preso = this.f.raggio + 12
    const attrito = Math.pow(0.25, dt)
    let prese = false
    for (const g of this.gemme) {
      const gdx = e.x - g.x, gdy = e.y - g.y
      const gd = Math.sqrt(gdx * gdx + gdy * gdy) || 1
      if (gd < cal) {
        const tira = 260 + (cal - gd) * 5.5
        g.vx += gdx / gd * tira * dt; g.vy += gdy / gd * tira * dt
      } else {
        /* fuori dalla calamita si incamminano lo stesso, piano, e tanto
           più in fretta quanto più sono rimaste indietro: una gemma persa
           per sempre è una fatica buttata, e il codino di gemme che
           insegue è anche una bella cosa da vedere */
        const deriva = Math.min(CFG.derivaMax, CFG.derivaGemma + gd * 0.30)
        g.x += gdx / gd * deriva * dt
        g.y += gdy / gd * deriva * dt
      }
      g.vx *= attrito; g.vy *= attrito
      g.x += g.vx * dt; g.y += g.vy * dt
      g.fase += dt * 4
      if (gd < preso && !this.offerta) { g.presa = true; prese = true; this.prendiGemma(g) }
    }
    if (prese) this.gemme = this.gemme.filter(g => !g.presa)
  }

  prendiGemma(g) {
    this.xp += g.val
    this.segnala('gemma')
    if (this.xp >= this.prossima) this.salgo()
  }

  muoviEffetti(dt) {
    if (!this.effetti.length) return
    for (const e of this.effetti) {
      e.vita -= dt
      if (e.che === 'briciola') { e.x += e.vx * dt; e.y += e.vy * dt; e.vy += 220 * dt }
    }
    this.effetti = this.effetti.filter(e => e.vita > 0)
  }

  /* ═══════════ le botte ═══════════ */
  ferisci(n, danno, colore) {
    n.vita -= danno
    n.lampo = 1
    this.scoppio(n.x, n.y, colore, 3)
  }

  /* ── il freddo addosso ──
     Un mostro gelato porta con sé **quanto** gli dura e **quanto** lo
     frena: l'aura dello scudo lo rinfresca finché resta dentro, il dardo
     glielo appiccica per qualche secondo anche in mezzo al campo. Chi le
     becca tutte e due si tiene il freno più forte, non l'ultimo arrivato.

     **Il freddo prende meno chi è grosso**, nella stessa misura in cui le
     botte lo spostano meno (vedi `CFG.massa`): sullo scudo di ghiaccio si
     reggeva mezza partita infinita — un'aura da un metro e mezzo che
     lasciava tutti al trenta per cento della loro andatura vale come un
     muro, e con un muro addosso non importa quanti siano né quanto siano
     duri. Adesso la melma di fine partita che pesa cinque volte si
     congela la metà, e il colosso quasi per niente. */
  gela(n, quanto, freno) {
    n.gelato = Math.max(n.gelato, quanto)
    const suo = 1 - (1 - freno) / Math.sqrt(n.massa || 1)
    n.freno = Math.min(n.freno, suo)
  }

  /* Spingere via un mostro costa quanto pesa: la stessa cometa butta
     fuori dal cerchio una melma e sposta di un palmo un colosso di fine
     partita. È quello che impedisce alle magie ad area di diventare uno
     scudo che nessuno attraversa mai. */
  spingi(n, forza) {
    const sx = n.x - this.eroe.x, sy = n.y - this.eroe.y
    const sd = Math.sqrt(sx * sx + sy * sy) || 1
    const f = forza / (n.massa || 1)
    n.spx += sx / sd * f; n.spy += sy / sd * f
  }

  piuVicino(x, y, entro) {
    let migliore = null, md = entro * entro
    for (const n of this.nemici) {
      const d = (n.x - x) ** 2 + (n.y - y) ** 2
      if (d < md) { md = d; migliore = n }
    }
    return migliore
  }

  scoppio(x, y, colore, quanti = 8) {
    if (this.effetti.length > 260) return         // in Node nessuno li guarda
    for (let i = 0; i < quanti; i++) {
      const a = this.rnd() * 6.3, v = 40 + this.rnd() * 110
      this.effetti.push({ che: 'briciola', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
                          r: 2 + this.rnd() * 3, colore, vita: 0.45, tot: 0.45 })
    }
  }

  anello(x, y, r, colore) {
    this.effetti.push({ che: 'anello', x, y, r0: 8, r, colore, vita: 0.4, tot: 0.4 })
  }

  /* ═══════════ SALIRE DI LIVELLO ═══════════
     Qui la partita si ferma: `offerta` piena vuol dire «non si gioca
     finché non si è scelto». Il motore non sa che quella scelta costa una
     domanda — sa solo che ogni carta ha un prezzo, e che chi paga poco
     prende poco. */
  salgo() {
    this.xp -= this.prossima
    this.livello++
    this.prossima = soglia(this.livello)
    this.segnala('livello')
    this.anello(this.eroe.x, this.eroe.y, 120, '#ffe98a')
    this.fermati()                                 // il dito non conta più
    this.offerta = this.offri()
    if (!this.offerta) this.offerta = null         // mazzo finito: si tira dritto
  }

  /* Tre carte, **una per fascia**: la facile, la media e la tosta. Non
     tre a caso — se capitassero tre carte dello stesso prezzo la scelta
     tornerebbe a essere «quale disegno mi piace», e il prezzo in
     difficoltà, che è il punto di tutto il gioco, non si vedrebbe. */
  offri() {
    const libere = this.mazzo.filter(c => this.livelloDi(c.chiave) < c.max)
    if (!libere.length) return null
    const scelte = []
    for (const f of ['debole', 'media', 'forte']) {
      const dentro = libere.filter(c => c.fascia === f && !scelte.includes(c))
      if (dentro.length) scelte.push(dentro[Math.floor(this.rnd() * dentro.length)])
    }
    /* una fascia esaurita non lascia un buco: si pesca dalle altre */
    while (scelte.length < 3 && scelte.length < libere.length) {
      const resto = libere.filter(c => !scelte.includes(c))
      scelte.push(resto[Math.floor(this.rnd() * resto.length)])
    }
    return scelte
      .map(c => this.vestiCarta(c))
      .sort((a, b) => a.prezzo - b.prezzo)
  }

  /* La carta come la vede chi la deve mostrare: nome, disegno, a che
     livello la porta, e **quanto costa** — che è un numero da 0 a 1, non
     una materia e non una domanda.

     Il prezzo è di *questa* carta a *questo* livello: chi l'ha già presa
     quattro volte la paga più cara. E quello che si vede — pallini,
     parola, colore — si legge dal prezzo vero, non dalla fascia, o la
     quinta freccia sembrerebbe costare quanto la prima. */
  vestiCarta(c) {
    const preso = this.livelloDi(c.chiave)
    const prezzo = prezzoDomanda(c.fascia, this.regole.rincaro, preso, c.max)
    const scalino = scalinoDelPrezzo(prezzo)
    return {
      chiave: c.chiave, nome: c.nome, icona: c.icona, chiaro: c.chiaro,
      fascia: c.fascia, etichetta: scalino.nome, colore: scalino.colore,
      tinta: scalino.chiave,          // il colore della carta è quello del prezzo
      pallini: palliniDelPrezzo(prezzo), pallinoTot: PALLINI,
      livello: preso + 1, nuova: preso === 0, max: c.max,
      prezzo,
    }
  }

  /* ═══════════ SI RINUNCIA ═══════════
     Chi sbaglia la domanda non prende niente: l'offerta si chiude e la
     partita riparte. Nessuna punizione oltre a questa — niente cuori
     tolti, niente ondate di castigo. **Il potenziamento mancato è la
     punizione**, e si fa sentire da sé perché i mostri hanno abbastanza
     vita da non morire con l'arco di partenza: chi si lascia indietro
     due o tre carte toste smette di bucarli, se li tira dietro tutti e
     alla fine lo chiudono. Non è il gioco che ti castiga per la risposta
     sbagliata, è la marea che non aspetta. */
  rinuncia() {
    if (!this.offerta) return null
    this.offerta = null
    this.segnala('niente')
    return null
  }

  /* Si prende una carta e la partita riparte. Una chiave che non è
     nell'offerta non è una schermata bianca: vale la prima, che essendo
     l'offerta ordinata è la più a buon mercato. */
  prendi(chiave) {
    if (!this.offerta) return null
    const c = this.offerta.find(x => x.chiave === chiave) || this.offerta[0]
    this.potenziamenti[c.chiave] = this.livelloDi(c.chiave) + 1
    if (c.chiave === 'cuore') {
      this.eroe.cuoriMax++
      this.eroe.cuori = this.eroe.cuoriMax
    }
    if (c.chiave === 'mela')
      this.eroe.cuori = Math.min(this.eroe.cuoriMax, this.eroe.cuori + 1)
    this.offerta = null
    this.ricalcola()
    return c
  }

  /* ═══════════ quello che si vede ═══════════
     Fatti già decisi, non regole: chi disegna non deve sapere cos'è un
     potenziamento — riceve «il gelo ha questo raggio» e lo dipinge. */
  scena() {
    const e = this.eroe
    return {
      scenario: this.regole.scenario,
      tempo: this.tempo,
      eroe: {
        x: e.x, y: e.y, mira: e.mira, guarda: e.guarda, passi: e.passi,
        fermo: !e.vx && !e.vy, raggio: this.f.raggio,
        lampeggia: e.invuln > 0, spine: this.f.spine > 0,
      },
      gelo: this.f.gelo,
      nemici: this.nemici,
      colpi: this.colpi,
      gemme: this.gemme,
      effetti: this.effetti,
      palle: this.palle,
      dolore: e.invuln > 0 ? Math.min(1, e.invuln / this.f.invuln) : 0,
    }
  }

  /* I numeri in cima allo schermo. Si legge quattro volte al secondo, non
     sessanta: è una riga di testo, non un'animazione. */
  get cruscotto() {
    return {
      cuori: this.eroe.cuori,
      cuoriMax: this.eroe.cuoriMax,
      livello: this.livello,
      quota: Math.max(0, Math.min(1, this.xp / this.prossima)),
      tempo: this.tempo,
      restano: this.restano,
      /* dopo il traguardo il cronometro non conta più alla rovescia: conta
         in su, come nella sopravvivenza, perché non c'è più niente da
         raggiungere */
      infinita: this.regole.infinita || this.oltre,
      oltre: this.oltre,
      extra: this.extra,
      uccisi: this.uccisi,
      presi: this.mazzo
        .filter(c => this.livelloDi(c.chiave) > 0)
        .map(c => ({ chiave: c.chiave, icona: c.icona, quante: this.livelloDi(c.chiave) })),
    }
  }
}
