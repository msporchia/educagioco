// Una partita: le regole, senza schermo. L'eroe spara da solo al
// mostro più vicino, il dito serve ad andare in giro (le gemme restano
// dove cadono). Le gemme fanno salire di livello, e a ogni livello la
// partita si ferma e offre una carta, pagata con una domanda
// (dati/mazzo.js dice quanto). Niente canvas, niente Vue, niente
// monete, niente materie: il tempo che passa (avanza(dt)), il dito
// ridotto a una direzione (muovi), il caso da fuori (rnd). Il perché di
// ogni regola: docs/survivors/regole.md e docs/survivors/taratura.md.
//
// Chi coordina fa tre cose: partita.muovi(dx, dy), partita.avanza(dt),
// partita.prendi(chiave); e legge scena(), cruscotto, svuotaEventi().
import { CFG, soglia, stellePerFerite } from '../dati/taratura.js'
import { MOSTRI, CHIAVI_MOSTRI, ammessi } from '../dati/mostri.js'
import { OGGETTI, pescaOggetto } from '../dati/oggetti.js'
import { MAZZO, prezzoDomanda, palliniDelPrezzo, scalinoDelPrezzo, PALLINI,
         resa, tettoDi }
  from '../dati/mazzo.js'
import { Terreno, semeDi, ATTENZIONE } from './terreno.js'

const CAMPO_MINIMO = { larghezza: 360, altezza: 620 }

const GELO_DARDO = 2.2       // quanto resta il freddo di una freccia gelata, in secondi

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
    this.cuori = t.cuori || CFG.cuoriIniziali
  }

  get infinita() { return !Number.isFinite(this.durata) }

  // quanta tappa è passata: 0 all'inizio, 1 al traguardo. Oltre 1 non si
  // ferma (la marea sale sempre, prima o poi prende anche chi gioca
  // bene); oltre il traguardo l'orologio passa alla durata "tipo",
  // uguale per tutti.
  quota(tempo) {
    if (!(tempo > 0)) return 0
    const su = this.infinita ? CFG.tappaTipo : this.durata
    if (tempo <= su) return tempo / su
    return 1 + (tempo - su) / CFG.tappaTipo
  }

  // la marea: pressione vera, misurata sul tempo (non sulla quota),
  // uguale per tutte le tappe — quello che cambia da tappa a tappa è
  // fin dove si arriva, non quanto è dura
  marea(tempo) { return Math.max(0, tempo) / CFG.tappaTipo }

  // le tre leve valgono quelle della tappa dentro la tappa; oltre il
  // traguardo si passa in due minuti a quelle di CFG.oltre, uguali per tutte
  leva(nome, tempo) {
    const q = this.quota(tempo)
    if (q <= 1 || this.infinita) return this[nome]
    const k = Math.min(1, q - 1)
    return this[nome] + (CFG.oltre[nome] - this[nome]) * k
  }

  // il riscaldamento (CFG.avvio): da `quanto` a 1 nei primi secondi
  avvio(tempo, quanto) {
    const k = Math.min(1, Math.max(0, tempo) / CFG.avvio.secondi)
    return quanto + (1 - quanto) * k
  }

  nascite(tempo) {
    return CFG.natePerSecondo(this.marea(tempo)) * this.leva('ritmo', tempo) *
           this.avvio(tempo, CFG.avvio.nascite)
  }
  tetto(tempo) { return CFG.maxNemici(this.marea(tempo)) }
  vitaNemico(tempo) { return CFG.vitaNemico(this.marea(tempo)) * this.leva('vigore', tempo) }
  frettaNemico(tempo) { return CFG.frettaNemico(this.marea(tempo)) * this.leva('fretta', tempo) }
  // la fretta del riscaldamento frena tutti al passo, non alla nascita:
  // chi nasce presto non resta lento per tutta la tappa
  frenoAvvio(tempo) { return this.avvio(tempo, CFG.avvio.fretta) }
  // chi può comparire adesso: la quota apre le bestie una per volta;
  // oltre il traguardo entrano tutte (anche quelle non previste dalla
  // tappa), o chi resta in campo dopo aver vinto schiverebbe melme per sempre
  squadraOra(tempo) {
    const q = this.quota(tempo)
    if (q <= 1) return ammessi(this.squadra, q)
    const nuove = ammessi(CHIAVI_MOSTRI, Math.min(1, q - 1))
    return [...new Set([...this.squadra, ...nuove])]
  }
}

export class Partita {
  constructor(regole, { rnd = Math.random, campo = null, mazzo = MAZZO } = {}) {
    this.regole = regole
    this.rnd = rnd
    this.mazzo = mazzo
    this.carte = new Map(mazzo.map(c => [c.chiave, c]))
    this.campo = { ...CAMPO_MINIMO, ...(campo || {}) }
    // la carta dei boschi, delle rocce e degli stagni: dal nome della
    // tappa, così riprendendo si ritrova la stessa
    this.terreno = new Terreno(regole.scenario, semeDi(regole.chiave || regole.scenario))

    this.eroe = {
      x: 0, y: 0, vx: 0, vy: 0,
      cuori: regole.cuori, cuoriMax: regole.cuori,
      invuln: 0, guarda: 1, passi: 0, ricarica: 0.25, mira: 0,
      rotta: 0,   // dove si sta andando, in radianti: la mira delle armi direzionali
      bombe: 0,   // quante bombe in tasca (CFG.bomba.tasca al massimo)
    }
    this.nemici = []
    this.colpi = []
    this.gemme = []
    this.oggetti = []
    this.effetti = []
    this.palle = []
    this.risucchio = 0    // la calamita trovata a terra: finché dura, le gemme entro il suo raggio volano
    this.tOggetto = CFG.oggetti.primo
    this.tMuro = CFG.muro.primo
    this.tBomba = CFG.bomba.prima
    this.tCapo = null     // quando arriva il prossimo capo (si fissa al primo battito)
    this.casse = 0        // quante casse sono comparse finora (il tetto, cassaAmmessa)

    this.tempo = 0
    this.uccisi = 0
    this.ferite = 0
    this.livello = 1
    this.xp = 0
    this.prossima = soglia(1)
    this.potenziamenti = {}
    this.offerta = null
    this.motivoOfferta = null   // 'livello' o 'cassa': una cassa non deve dire "livello 4"
    this.esito = null
    this.eventi = []
    this.conquistata = false    // la tappa è già in tasca: chi resta in campo non perde le stelle
    this.feriteVinte = 0
    this.oltre = false           // si gioca oltre il traguardo

    this.dir = { x: 0, y: 0 }
    this.aNascere = 0
    this.orbita = 0
    this.tFuoco = 0
    this.tGelo = 0
    this.daSpendere = 0   // i potenziamenti guadagnati e non ancora scelti: li apre chi gioca    this.tFulmine = 0
    this.tLancia = 0
    this.tFendente = 0

    this.ricalcola()
  }

  get finita() { return this.esito !== null }
  get vinta() { return this.conquistata }
  get inPausa() { return this.offerta !== null }
  get alTraguardo() { return this.esito === 'vinta' }
  get stelle() { return this.conquistata ? stellePerFerite(this.feriteVinte) : 0 }
  get extra() {
    return this.conquistata && !this.regole.infinita
      ? Math.max(0, this.tempo - this.regole.durata) : 0
  }
  get restano() {
    if (this.regole.infinita || this.oltre) return Infinity
    return Math.max(0, this.regole.durata - this.tempo)
  }

  livelloDi(chiave) { return this.potenziamenti[chiave] || 0 }

  tettoDi(c) { return tettoDi(c, this.regole.infinita) }

  // quanto rende adesso un potenziamento: dentro il tetto è il numero
  // di copie, oltre (solo nel gioco libero) una frazione sempre più piccola
  resaDi(chiave) {
    const preso = this.livelloDi(chiave)
    const c = this.carte.get(chiave)
    return c && !c.intera ? resa(preso, c.max) : preso
  }

  misuraCampo(larghezza, altezza) {
    if (larghezza > 0 && altezza > 0) this.campo = { larghezza, altezza }
  }

  muovi(dx = 0, dy = 0) {
    const l = Math.sqrt(dx * dx + dy * dy)
    if (l < 0.001) { this.dir.x = 0; this.dir.y = 0; return }
    this.dir.x = dx / l
    this.dir.y = dy / l
  }

  fermati() { this.dir.x = 0; this.dir.y = 0 }

  // i numeri dell'eroe, ricalcolati solo quando cambia qualcosa (non
  // sessanta volte al secondo): l'unico posto in cui una carta diventa un numero
  ricalcola() {
    // `lv` è la resa (dentro il tetto = numero di copie, oltre una
    // frazione); `quanti` arrotonda per le carte che danno cose intere
    const lv = k => this.resaDi(k)
    const quanti = k => Math.round(this.resaDi(k))
    this.f = {
      velocita: CFG.velocitaEroe * (1 + 0.17 * lv('stivali')),
      raggio: CFG.raggioEroe,
      // le carte forti rendono tanto: i mostri hanno vita da vendere e
      // con l'arco di partenza non si bucano
      cadenza: CFG.cadenza * Math.pow(0.75, lv('mani')),
      frecce: 1 + quanti('frecce'),
      danno: 1 + 2.1 * lv('grandi'),
      gittata: CFG.gittata * (1 + 0.26 * lv('lunghe')),
      velColpo: CFG.velocitaFreccia * (1 + 0.16 * lv('lunghe')),
      raggioColpo: 5 + 1.6 * lv('grandi'),
      // zero senza la carta Calamita: le gemme si prendono a contatto
      calamita: lv('magnete') > 0
        ? CFG.calamita.prima + CFG.calamita.inPiu * (Math.floor((lv('magnete') + 1) / 2) - 1) : 0,
      forzaCalamita: 1 + CFG.calamita.forza * Math.floor(lv('magnete') / 2),
      // lo scudo di ghiaccio e l'anello di fuoco vanno a impulsi: radi
      // alla prima copia, sempre più fitti potenziandoli
      gelo: lv('gelo') ? 90 + 22 * lv('gelo') : 0,
      freno: Math.max(0.30, 0.75 - 0.12 * lv('gelo')),
      cadenzaGelo: Math.max(2.4, 5.5 - 1.0 * (lv('gelo') - 1)),
      cadenzaFuoco: Math.max(2.2, 5.5 - 1.1 * (lv('fuoco') - 1)),
      // il dardo gelato: quante frecce su cento congelano, e quanto
      // pesa il gelo lasciato — separato dall'aura dello scudo
      dardo: 0.15 * lv('dardo'),
      frenoDardo: lv('dardo') ? Math.max(0.35, 0.60 - 0.05 * lv('dardo')) : 1,
      valoreGemma: 1 + lv('gemme'),
      fortuna: 0.14 * lv('stella'),
      perfora: quanti('occhi'),
      invuln: CFG.invulnerabilita + 0.5 * lv('fantasma'),
      palle: quanti('palla'),
      fuoco: lv('fuoco'),
      fulmine: lv('fulmine'),
      // le armi che guardano dove corri: picchiano più dell'arco perché
      // mirare costa (bisogna correre verso i mostri)
      lancia: lv('lancia'),
      dannoLancia: 3 + 2.5 * lv('lancia'),
      cadenzaLancia: Math.max(0.55, 1.6 - 0.25 * lv('lancia')),
      fendente: lv('fendente'),
      raggioFendente: 80 + 14 * lv('fendente'),
      dannoFendente: 2.5 + 2 * lv('fendente'),
      cadenzaFendente: Math.max(0.6, 1.4 - 0.18 * lv('fendente')),
    }
  }

  segnala(che) { if (this.eventi.length < 60) this.eventi.push(che) }
  svuotaEventi() { const e = this.eventi; this.eventi = []; return e }

  avanza(dt) {
    if (this.finita || this.inPausa || !(dt > 0)) return this.esito
    if (dt > 0.05) dt = 0.05                      // una scheda tornata in primo piano

    this.tempo += dt
    // il traguardo si guarda per primo: chi resiste fino allo scadere
    // ha resistito, e la partita si ferma per chiedere se restare (continua())
    if (!this.regole.infinita && !this.conquistata && this.tempo >= this.regole.durata) {
      this.conquistata = true
      this.feriteVinte = this.ferite
      return this.finisci('vinta')
    }

    if (this.xp >= this.prossima) this.salgo()

    this.muoviEroe(dt)
    this.nascite(dt)
    this.muri(dt)
    this.capi(dt)
    this.compaiono(dt)
    this.bombaATerra(dt)
    if (this.camminaNemici(dt)) return this.esito     // l'ultimo cuore
    this.tira(dt)
    this.muoviColpi(dt)
    this.pallaGirante(dt)
    this.anelloDiFuoco(dt)
    this.ondataDiGelo(dt)
    this.saetta(dt)
    this.lanciaDritta(dt)
    this.fendenteDavanti(dt)
    this.raccogliMorti()
    this.muoviGemme(dt)
    this.raccogliOggetti(dt)
    this.muoviEffetti(dt)
    return this.esito
  }

  finisci(esito) {
    this.esito = esito
    this.offerta = null
    this.segnala(esito === 'vinta' ? 'trionfo' : 'fine')
    return esito
  }

  // dopo il traguardo si può restare: la marea continua a salire, non
  // si può vincere di nuovo, solo durare finché non prende
  continua() {
    if (this.esito !== 'vinta' || this.regole.infinita) return false
    this.esito = null
    this.oltre = true
    return true
  }

  muoviEroe(dt) {
    const e = this.eroe
    if (this.dir.x || this.dir.y) {
      const v = this.f.velocita
      e.vx = this.dir.x * v
      e.vy = this.dir.y * v
      e.x += e.vx * dt
      e.y += e.vy * dt
      this.terreno.spingiFuori(e, this.f.raggio)
      if (this.dir.x > 0.5) e.guarda = 1
      else if (this.dir.x < -0.5) e.guarda = -1
      e.rotta = Math.atan2(this.dir.y, this.dir.x)
      e.passi += v * dt
      if (this.rnd() < dt * (6 + v / 26))   // polvere sotto i piedi
        this.effetti.push({ che: 'briciola', x: e.x - e.vx * 0.06, y: e.y + 12,
                            vx: -e.vx * 0.15, vy: -12, r: 2.5, colore: '#e9dcae',
                            vita: 0.35, tot: 0.35 })
    } else { e.vx = 0; e.vy = 0 }
    if (e.invuln > 0) e.invuln -= dt
  }

  nascite(dt) {
    this.aNascere += this.regole.nascite(this.tempo) * dt
    while (this.aNascere >= 1) { this.aNascere -= 1; this.nasceNemico() }
  }

  tipoDelMomento() {
    const buoni = this.regole.squadraOra(this.tempo)
    let totale = 0
    for (const k of buoni) totale += MOSTRI[k].peso
    let s = this.rnd() * totale
    for (const k of buoni) { s -= MOSTRI[k].peso; if (s <= 0) return k }
    return buoni[0]
  }

  // da dove entra un mostro: appena oltre il bordo, più della metà
  // delle volte davanti a chi corre
  angoloDiNascita() {
    const e = this.eroe
    const corre = e.vx || e.vy
    if (corre && this.rnd() < CFG.nasconoAvanti)
      return Math.atan2(e.vy, e.vx) + (this.rnd() * 2 - 1) * CFG.aperturaNascita
    return this.rnd() * 6.283
  }

  // i capi: il primo a una quota della tappa, poi a tempo. Nel gioco
  // libero, che non ha durata, il primo arriva dopo un minuto
  capi(dt) {
    const { da, ogni } = CFG.capo
    if (this.tCapo === null)
      this.tCapo = Number.isFinite(this.regole.durata) ? this.regole.durata * da : 60
    if (this.tempo < this.tCapo) return
    this.tCapo = this.tempo + ogni
    this.nasceCapo()
  }

  nasceCapo() {
    const buoni = this.regole.squadraOra(this.tempo)
    // fra quelli ammessi adesso, uno dei più duri
    const duri = buoni.slice().sort((a, b) => MOSTRI[b].vita - MOSTRI[a].vita).slice(0, 2)
    const t = duri[Math.floor(this.rnd() * duri.length)]
    const a = this.angoloDiNascita()
    const d = Math.hypot(this.campo.larghezza, this.campo.altezza) / 2 + 40
    const n = this.mostroNuovo(t, this.eroe.x + Math.cos(a) * d, this.eroe.y + Math.sin(a) * d)
    const { taglia, vita, passo, massa } = CFG.capo
    n.capo = true
    n.r *= taglia
    n.vita = n.vitaMax = n.vita * vita
    n.passo *= passo
    n.massa *= massa
    this.nemici.push(n)
    this.segnala('capo')
    return n
  }

  nasceNemico() {
    if (this.nemici.length >= this.regole.tetto(this.tempo)) return
    const t = this.tipoDelMomento()
    const mx = this.campo.larghezza / 2 + 34, my = this.campo.altezza / 2 + 34
    const a = this.angoloDiNascita()
    const cx = Math.cos(a), cy = Math.sin(a)
    const quanto = Math.min(mx / Math.max(0.0001, Math.abs(cx)),
                            my / Math.max(0.0001, Math.abs(cy)))
    this.nemici.push(this.mostroNuovo(t, this.eroe.x + cx * quanto, this.eroe.y + cy * quanto))
  }

  mostroNuovo(t, x, y) {
    const m = MOSTRI[t]
    const mult = this.regole.vitaNemico(this.tempo)
    const vita = Math.ceil(m.vita * mult)
    return {
      tipo: t, x, y,
      r: m.r, vita, vitaMax: vita,
      passo: m.passo * (0.85 + this.rnd() * 0.3) * this.regole.frettaNemico(this.tempo),
      massa: CFG.stazza(mult),   // dentro la campagna vale 1 e non si sente
      spx: 0, spy: 0, lampo: 0, gelato: 0, freno: 1, attesa: 0, fase: this.rnd() * 6.3,
    }
  }

  // i muri: una fila di mostri deboli attraversa lo schermo con un
  // varco; costringe a muoversi anche chi ha già raccolto tutto
  muri(dt) {
    this.tMuro -= dt
    if (this.tMuro > 0) return
    this.tMuro = CFG.muro.ogni(this.regole.marea(this.tempo))
    if (this.rnd() < CFG.sciame.quota) {
      if (this.rnd() < CFG.anello.quota) this.nasceAnello()
      else this.nasceSciame()
    }
    else this.nasceMuro()
  }

  // l'anello: tutto intorno all'eroe, appena fuori dallo schermo, con
  // un'apertura; chiude da sé perché ogni mostro va verso l'eroe
  nasceAnello() {
    const e = this.eroe
    const { passo, varco } = CFG.anello
    const R = Math.hypot(this.campo.larghezza, this.campo.altezza) / 2 + 50
    const vuoto = this.rnd() * Math.PI * 2, mezzo = varco / R / 2
    const t = this.tipoDelMuro()
    const tetto = this.regole.tetto(this.tempo)
    const quanti = Math.floor(2 * Math.PI * R / passo)
    let nati = 0
    for (let i = 0; i < quanti && this.nemici.length < tetto; i++) {
      const a = (i / quanti) * Math.PI * 2
      const da = Math.abs(Math.atan2(Math.sin(a - vuoto), Math.cos(a - vuoto)))
      if (da < mezzo) continue
      this.nemici.push(this.mostroNuovo(t, e.x + Math.cos(a) * R, e.y + Math.sin(a) * R))
      nati++
    }
    if (nati) this.segnala('muro')
  }

  // lo sciame: un grumo largo `raggio` entra da un lato a caso e poi
  // insegue come ogni mostro; senza varco, quindi non si scansa
  // restando fermi ma nemmeno basta scappare in linea retta
  nasceSciame() {
    const e = this.eroe
    const { base, perMarea, massimo, raggio } = CFG.sciame
    const quanti = Math.min(massimo, Math.round(base + perMarea * Math.max(0, this.regole.marea(this.tempo))))
    const lato = Math.floor(this.rnd() * 4)
    const dir = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }][lato]
    const dist = Math.max(this.campo.larghezza, this.campo.altezza) / 2 + 60
    const lungo = (dir.x === 0 ? this.campo.larghezza : this.campo.altezza) / 2
    const lateral = (this.rnd() * 1.2 - 0.6) * lungo
    const cx = e.x - dir.x * dist + (dir.x === 0 ? lateral : 0)
    const cy = e.y - dir.y * dist + (dir.y === 0 ? lateral : 0)
    const t = this.tipoDelMuro()
    const tetto = this.regole.tetto(this.tempo)
    let nati = 0
    for (let i = 0; i < quanti && this.nemici.length < tetto; i++) {
      const a = this.rnd() * Math.PI * 2, d = Math.sqrt(this.rnd()) * raggio
      this.nemici.push(this.mostroNuovo(t, cx + Math.cos(a) * d, cy + Math.sin(a) * d))
      nati++
    }
    if (nati) this.segnala('muro')
  }

  tipoDelMuro() {
    const buoni = this.regole.squadraOra(this.tempo)
    return buoni.slice().sort((a, b) =>
      MOSTRI[a].vita - MOSTRI[b].vita || MOSTRI[b].passo - MOSTRI[a].passo)[0]
  }

  nasceMuro() {
    const e = this.eroe
    const lato = Math.floor(this.rnd() * 4)
    const rotta = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }][lato]
    const orizzontale = rotta.y === 0
    const W = this.campo.larghezza, H = this.campo.altezza
    const lunga = (orizzontale ? H : W) / 2 + 30
    const partenza = (orizzontale ? W : H) / 2 + 40
    const { passo, varco } = CFG.muro
    const centroVarco = (this.rnd() * 1.4 - 0.7) * lunga
    const t = this.tipoDelMuro()
    const tetto = this.regole.tetto(this.tempo)
    const andatura = MOSTRI[t].passo * this.regole.frettaNemico(this.tempo)
    let quanti = 0
    for (let s = -lunga; s <= lunga; s += passo) {
      if (Math.abs(s - centroVarco) < varco / 2) continue
      if (this.nemici.length >= tetto) break
      const x = orizzontale ? e.x - rotta.x * partenza : e.x + s
      const y = orizzontale ? e.y + s : e.y - rotta.y * partenza
      const n = this.mostroNuovo(t, x, y)
      n.rotta = rotta
      n.passo = andatura
      this.nemici.push(n)
      quanti++
    }
    if (!quanti) return
    this.segnala('muro')   // nessun avviso a schermo: capire da che parte scansarsi è il gioco
  }

  // torna true se qui è finita: l'unico punto in cui si perde
  camminaNemici(dt) {
    const e = this.eroe
    const raggio = this.f.raggio
    const limite = Math.hypot(this.campo.larghezza, this.campo.altezza) * CFG.troppoLontano
    const oltreIlMuro = Math.max(this.campo.larghezza, this.campo.altezza) / 2 + 80
    const smorza = Math.pow(0.02, dt)
    const avvio = this.regole.frenoAvvio(this.tempo)
    for (const n of this.nemici) {
      const ddx = e.x - n.x, ddy = e.y - n.y
      const d = Math.sqrt(ddx * ddx + ddy * ddy) || 1
      if (d > limite) { n.sparito = true; continue }
      if (n.rotta && -(ddx * n.rotta.x + ddy * n.rotta.y) > oltreIlMuro) { n.sparito = true; continue }
      n.gelato = Math.max(0, n.gelato - dt)
      if (n.gelato <= 0) n.freno = 1
      const p = n.passo * n.freno * avvio
      const [vx, vy] = this.terreno.aggira(n.x, n.y, n.r,
        n.rotta ? n.rotta.x : ddx / d, n.rotta ? n.rotta.y : ddy / d, ATTENZIONE.muso)
      n.vx = vx; n.vy = vy          // per chi disegna: da che parte guarda
      n.x += vx * p * dt + n.spx * dt
      n.y += vy * p * dt + n.spy * dt
      this.terreno.spingiFuori(n, n.r * 0.8)
      n.spx *= smorza; n.spy *= smorza
      n.lampo = Math.max(0, n.lampo - dt * 4)
      n.attesa = Math.max(0, n.attesa - dt)
      n.fase += dt * 6

      if (d < n.r + raggio) {
        if (e.invuln <= 0) {
          e.cuori--
          this.ferite++
          e.invuln = this.f.invuln
          this.segnala('ahia')
          this.anello(e.x, e.y, 70, '#ff5470')
          // tutti indietro: un attimo di respiro dopo un colpo preso
          for (const m of this.nemici) {
            const sx = m.x - e.x, sy = m.y - e.y
            const sd = Math.sqrt(sx * sx + sy * sy) || 1
            if (sd < 160) { m.spx += sx / sd * 460; m.spy += sy / sd * 460 }
          }
          if (e.cuori <= 0) { this.finisci('persa'); return true }
        } else {
          const s = -140 / Math.sqrt(n.massa || 1)
          n.spx += ddx / d * s; n.spy += ddy / d * s
        }
      }
    }
    return false
  }

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
      const gelida = this.rnd() < this.f.dardo   // deciso alla partenza: la freccia si vede azzurra in volo
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
          // la lancia lascia il segno su chi trapassa (lo disegna il campo)
          if (c.lancia) this.effetti.push({ che: 'trafitto', x: n.x, y: n.y, a: c.a, r: n.r, vita: 0.3, tot: 0.3 })
          const rinculo = 0.18 / (n.massa || 1)
          n.spx += c.vx * rinculo; n.spy += c.vy * rinculo
          c.presi.push(n)
          if (c.restano-- <= 0) { c.vita = 0; break }
        }
      }
    }
    this.colpi = this.colpi.filter(c => c.vita > 0)
  }

  // le comete in orbita: più copie, orbita più larga e veloce, più forte
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

  anelloDiFuoco(dt) {
    if (!this.f.fuoco) return
    this.tFuoco -= dt
    if (this.tFuoco > 0) return
    this.tFuoco = this.f.cadenzaFuoco
    const R = 78 + 20 * this.f.fuoco, danno = 2 + 2.6 * this.f.fuoco
    this.anello(this.eroe.x, this.eroe.y, R, '#ff9f1c')
    this.segnala('fuoco')
    for (const n of this.nemici) {
      const dx = n.x - this.eroe.x, dy = n.y - this.eroe.y
      if (dx * dx + dy * dy < R * R) { this.ferisci(n, danno, '#ffb347'); this.spingi(n, 220) }
    }
  }
  // lo scudo di ghiaccio: un'ondata ogni tanto che congela chi è vicino
  ondataDiGelo(dt) {
    if (!this.f.gelo) return
    this.tGelo -= dt
    if (this.tGelo > 0) return
    this.tGelo = this.f.cadenzaGelo
    const e = this.eroe, R = this.f.gelo
    let presi = 0
    for (const n of this.nemici) {
      if ((n.x - e.x) ** 2 + (n.y - e.y) ** 2 < R * R) { this.gela(n, 2.2, this.f.freno); presi++ }
    }
    this.effetti.push({ che: 'gelata', x: e.x, y: e.y, r: R, vita: 0.6, tot: 0.6 })
    if (presi) this.segnala('gelo')
  }


  // le armi che guardano dove corri (lancia, fendente): tirano nella
  // direzione di marcia, non al più vicino — chi sta fermo le tiene
  // puntate dov'era andato l'ultima volta
  lanciaDritta(dt) {
    if (!this.f.lancia) return
    this.tLancia -= dt
    if (this.tLancia > 0) return
    this.tLancia = this.f.cadenzaLancia
    const e = this.eroe, a = e.rotta
    const vel = CFG.velocitaFreccia * 1.2
    this.colpi.push({
      x: e.x + Math.cos(a) * 16, y: e.y + Math.sin(a) * 16,
      vx: Math.cos(a) * vel, vy: Math.sin(a) * vel,
      a, danno: this.f.dannoLancia, lancia: true,
      r: 7, vita: this.f.gittata * 1.4 / vel,
      restano: 999, presi: [],
    })
    this.segnala('lancia')
  }

  // il fendente parte solo se davanti c'è qualcuno (un colpo nel vuoto non è un'arma, è un tic)
  fendenteDavanti(dt) {
    if (!this.f.fendente) return
    this.tFendente -= dt
    if (this.tFendente > 0) return
    const e = this.eroe, R = this.f.raggioFendente, a = e.rotta
    const APERTURA = 1.15                          // radianti per lato: un arco di 130°
    const colpiti = []
    for (const n of this.nemici) {
      const dx = n.x - e.x, dy = n.y - e.y
      if (dx * dx + dy * dy > R * R) continue
      const s = Math.atan2(dy, dx) - a
      if (Math.abs(Math.atan2(Math.sin(s), Math.cos(s))) <= APERTURA) colpiti.push(n)
    }
    if (!colpiti.length) return
    this.tFendente = this.f.cadenzaFendente
    for (const n of colpiti) { this.ferisci(n, this.f.dannoFendente, '#ffffff'); this.spingi(n, 260) }
    this.effetti.push({ che: 'fendente', x: e.x, y: e.y, a, r: R, apertura: APERTURA,
                        vita: 0.22, tot: 0.22 })
    this.segnala('fendente')
  }

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

  // chi è morto lascia la gemma, e i grossi qualche volta anche un oggetto
  raccogliMorti() {
    let caduti = false
    for (const n of this.nemici) {
      if (n.vita > 0) continue
      caduti = true
      this.uccisi++
      this.scoppio(n.x, n.y, MOSTRI[n.tipo].colore, 9)
      // la figura che cade: la disegna il campo, qui c'è solo dove e chi
      this.effetti.push({ che: 'morte', tipo: n.tipo, x: n.x, y: n.y, r: n.r,
                          verso: n.vx || 0, vita: 0.4, tot: 0.4 })
      // un capo lascia una pioggia di gemme e sempre un oggetto
      const quante = n.capo ? CFG.capo.gemme : 1, spinta = n.capo ? 260 : 60
      for (let k = 0; k < quante; k++)
        this.gemme.push({ x: n.x, y: n.y, vx: (this.rnd() - 0.5) * spinta,
                          vy: (this.rnd() - 0.5) * spinta,
                          val: this.f.valoreGemma, fase: this.rnd() * 6.3 })
      if (n.capo) { this.lasciaOggetto(n.x, n.y); this.anello(n.x, n.y, n.r * 4, '#ffd257') }
      else if (MOSTRI[n.tipo].vita >= CFG.oggetti.grosso && this.rnd() < CFG.oggetti.daiGrossi)
        this.lasciaOggetto(n.x, n.y)
      this.segnala('morto')
    }
    if (caduti || this.nemici.some(n => n.sparito))
      this.nemici = this.nemici.filter(n => n.vita > 0 && !n.sparito)
  }

  // le gemme si prendono a contatto: tira solo la carta Calamita
  // (f.calamita, zero senza) e, per qualche secondo, quella a terra
  muoviGemme(dt) {
    const e = this.eroe
    const cal = this.f.calamita
    const preso = this.f.raggio + 12
    const attrito = Math.pow(0.25, dt)
    const limite = Math.hypot(this.campo.larghezza, this.campo.altezza) * CFG.troppoLontano
    const risucchio = this.risucchio > 0
    let prese = false
    for (const g of this.gemme) {
      const gdx = e.x - g.x, gdy = e.y - g.y
      const gd = Math.sqrt(gdx * gdx + gdy * gdy) || 1
      if (gd > limite) { g.presa = true; prese = true; continue }
      if (risucchio && gd < OGGETTI.calamita.raggio) {
        g.vx += gdx / gd * 1100 * dt; g.vy += gdy / gd * 1100 * dt
      } else if (cal > 0 && gd < cal) {
        const tira = (260 + (cal - gd) * 5.5) * this.f.forzaCalamita
        g.vx += gdx / gd * tira * dt; g.vy += gdy / gd * tira * dt
      }
      g.vx *= attrito; g.vy *= attrito
      g.x += g.vx * dt; g.y += g.vy * dt
      g.fase += dt * 4
      if (gd < preso && !this.offerta) { g.presa = true; prese = true; this.prendiGemma(g) }
    }
    if (prese) this.gemme = this.gemme.filter(g => !g.presa)
  }

  compaiono(dt) {
    this.tOggetto -= dt
    if (this.tOggetto > 0) return
    this.tOggetto = CFG.oggetti.ogni(this.regole.marea(this.tempo))
    this.lasciaOggetto()
  }

  // la bomba ha il suo orologio: una alla volta in campo, e mai a chi ha
  // la tasca piena (l'orologio aspetta)
  bombaATerra(dt) {
    this.tBomba -= dt
    if (this.tBomba > 0) return
    if (this.eroe.bombe >= CFG.bomba.tasca || this.oggetti.some(o => o.tipo === 'bomba')) return
    if (this.lasciaOggetto(undefined, undefined, 'bomba')) this.tBomba = CFG.bomba.ogni
  }

  // senza coordinate lo posa a caso, né sotto i piedi né oltre il bordo;
  // senza `quale` lo pesca
  lasciaOggetto(x, y, quale = null) {
    if (this.oggetti.length >= CFG.oggetti.massimo) return null
    const e = this.eroe
    if (x === undefined) {
      const { vicino, lontano } = CFG.oggetti
      const mx = this.campo.larghezza / 2 - 30, my = this.campo.altezza / 2 - 40
      const a = this.rnd() * 6.283
      const d = vicino + this.rnd() * (lontano - vicino)
      const dx = Math.cos(a) * d, dy = Math.sin(a) * d
      const scala = Math.min(1, mx / Math.max(1, Math.abs(dx)), my / Math.max(1, Math.abs(dy)))
      x = e.x + dx * scala
      y = e.y + dy * scala
      // dentro uno stagno non lo prenderebbe nessuno: si cerca un posto
      // girando intorno all'eroe, e se non c'è si rinuncia
      for (let k = 1; k < 8 && !this.terreno.libero(x, y, 20); k++) {
        const b = a + k * 0.785
        x = e.x + Math.cos(b) * d * scala
        y = e.y + Math.sin(b) * d * scala
      }
      if (!this.terreno.libero(x, y, 20)) return null
    }
    const tipo = quale || pescaOggetto(this.rnd, { feribile: e.cuori < e.cuoriMax, cassa: this.cassaAmmessa() })
    if (tipo === 'cassa') this.casse++
    const o = { tipo, x, y, resta: CFG.oggetti.durata, fase: this.rnd() * 6.3 }
    this.oggetti.push(o)
    this.segnala('oggetto')
    return o
  }

  // il tetto delle casse: mai nei primi secondi, mai due in campo, non
  // più di una ogni tot secondi di partita — vedi docs/survivors/taratura.md
  cassaAmmessa() {
    const { primaDi, ogni } = CFG.oggetti.cassa
    return this.tempo >= primaDi
      && !this.oggetti.some(o => o.tipo === 'cassa')
      && this.casse < Math.floor((this.tempo - primaDi) / ogni) + 1
  }

  raccogliOggetti(dt) {
    if (this.risucchio > 0) this.risucchio = Math.max(0, this.risucchio - dt)
    if (!this.oggetti.length) return
    const e = this.eroe
    const preso = this.f.raggio + 16
    let via = false
    for (const o of this.oggetti) {
      o.resta -= dt
      o.fase += dt * 3
      if (o.resta <= 0) { o.via = true; via = true; continue }
      const d = Math.hypot(o.x - e.x, o.y - e.y)
      if (d < preso && !this.offerta) { o.via = true; via = true; this.prendiOggetto(o) }
    }
    if (via) this.oggetti = this.oggetti.filter(o => !o.via)
  }

  prendiOggetto(o) {
    const e = this.eroe
    if (o.tipo === 'cuore') {
      e.cuori = Math.min(e.cuoriMax, e.cuori + 1)
      this.anello(e.x, e.y, 60, OGGETTI.cuore.colore)
      this.segnala('cuore')
    } else if (o.tipo === 'calamita') {
      this.risucchio = OGGETTI.calamita.secondi
      this.anello(e.x, e.y, 200, OGGETTI.calamita.colore)
      this.segnala('calamita')
    } else if (o.tipo === 'bomba') {
      e.bombe = Math.min(CFG.bomba.tasca, e.bombe + 1)
      this.anello(e.x, e.y, 50, OGGETTI.bomba.colore)
      this.segnala('presa')
    } else if (o.tipo === 'cassa') {
      // apre un'offerta come una salita di livello ma senza salire: si
      // paga con la domanda come sempre
      this.anello(e.x, e.y, 90, OGGETTI.cassa.colore)
      this.segnala('cassa')
      const offerta = this.offri()
      if (offerta) {
        this.fermati()
        this.motivoOfferta = 'cassa'
        this.offerta = offerta
      }
    }
  }

  // la bomba: scoppia sull'eroe e toglie di mezzo tutti quelli vicini,
  // grossi compresi; più in là li spinge via. Torna quanti ne ha presi
  // (null se non c'era niente da lanciare)
  lanciaBomba() {
    const e = this.eroe
    if (!(e.bombe > 0) || this.finita || this.inPausa) return null
    e.bombe--
    const { raggio, onda } = CFG.bomba
    let presi = 0
    for (const n of this.nemici) {
      const d = Math.hypot(n.x - e.x, n.y - e.y)
      // un capo non cade d'un colpo: la bomba gli toglie metà della vita
      if (d < raggio + n.r && n.capo) { this.ferisci(n, n.vitaMax / 2, '#ffd257'); presi++ }
      else if (d < raggio + n.r) { n.vita = 0; presi++ }
      else if (d < raggio * onda) this.spingi(n, 500)
    }
    this.effetti.push({ che: 'esplosione', x: e.x, y: e.y, r: raggio, vita: 0.7, tot: 0.7 })
    this.segnala('bomba')
    return presi
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

  ferisci(n, danno, colore) {
    n.vita -= danno
    n.lampo = 1
    this.scoppio(n.x, n.y, colore, 3)
  }

  // il freddo prende meno chi è grosso, nella stessa misura in cui le
  // botte lo spostano meno (CFG.stazza): senza, lo scudo di ghiaccio
  // diventava un muro che nessuno attraversa
  gela(n, quanto, freno) {
    n.gelato = Math.max(n.gelato, quanto)
    const duro = Math.sqrt(n.massa || 1) * (n.capo ? CFG.capo.gelo : 1)   // un capo il freddo lo sente appena
    const suo = 1 - (1 - freno) / duro
    n.freno = Math.min(n.freno, suo)
  }

  // spingere via un mostro costa quanto pesa: la stessa cometa butta
  // fuori una melma e sposta di un palmo un colosso di fine partita
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

  // qui la partita si ferma: offerta piena vuol dire "non si gioca
  // finché non si è scelto". Il motore sa solo che ogni carta ha un
  // prezzo, non che quel prezzo è una domanda.
  salgo() {
    this.xp -= this.prossima
    this.livello++
    this.prossima = soglia(this.livello)
    this.segnala('livello')
    this.anello(this.eroe.x, this.eroe.y, 120, '#ffe98a')
    this.effetti.push({ che: 'luce', x: this.eroe.x, y: this.eroe.y, vita: 0.9, tot: 0.9 })
    // la partita non si ferma: il potenziamento si mette da parte e lo
    // apre chi gioca quando vuole (apriOfferta). Se il mazzo è finito (solo
    // in campagna, dove ha un tetto) non c'è niente da mettere da parte
    if (this.mazzo.some(c => this.livelloDi(c.chiave) < this.tettoDi(c))) this.daSpendere++
    // e ogni tanto l'esperienza porta una bomba
    if (this.livello % CFG.bomba.ogniLivelli === 0 && this.eroe.bombe < CFG.bomba.tasca) {
      this.eroe.bombe++
      this.segnala('presa')
    }
  }

  // chi gioca apre un potenziamento messo da parte: tre carte, pagate con
  // la domanda come sempre. Torna l'offerta, o null se non ce n'era
  apriOfferta() {
    if (!(this.daSpendere > 0) || this.inPausa || this.finita) return null
    const offerta = this.offri()
    if (!offerta) { this.daSpendere = 0; return null }
    this.daSpendere--
    this.fermati()
    this.offerta = offerta
    this.motivoOfferta = 'livello'
    return offerta
  }

  // tre carte, una per fascia: se capitassero tre dello stesso prezzo
  // la scelta tornerebbe a essere "quale disegno mi piace"
  offri() {
    const libere = this.mazzo.filter(c => this.livelloDi(c.chiave) < this.tettoDi(c))
    if (!libere.length) return null
    // prima si finisce il primo giro: finché una carta qualunque ha
    // ancora un livello vero da dare, l'offerta pesca solo fra quelle
    // (il secondo giro del gioco libero comincia quando il mazzo è
    // finito davvero) — vedi docs/survivors/regole.md
    const fresche = libere.filter(c => this.livelloDi(c.chiave) < c.max)
    const banco = fresche.length ? fresche : libere
    const scelte = []
    for (const f of ['debole', 'media', 'forte']) {
      const dentro = banco.filter(c => c.fascia === f && !scelte.includes(c))
      if (dentro.length) scelte.push(dentro[Math.floor(this.rnd() * dentro.length)])
    }
    while (scelte.length < 3 && scelte.length < banco.length) {
      const resto = banco.filter(c => !scelte.includes(c))
      scelte.push(resto[Math.floor(this.rnd() * resto.length)])
    }
    return scelte
      .map(c => this.vestiCarta(c))
      .sort((a, b) => a.prezzo - b.prezzo)
  }

  // la carta come la vede chi la mostra: nome, disegno, a che livello
  // porta, e quanto costa (0..1). Il prezzo/i pallini si leggono dal
  // prezzo vero, non dalla fascia, o la quinta freccia sembrerebbe
  // costare quanto la prima. `oltreIlTetto` è la carta ripresa nel
  // gioco libero oltre il suo ultimo livello.
  vestiCarta(c) {
    const preso = this.livelloDi(c.chiave)
    const prezzo = prezzoDomanda(c.fascia, this.regole.rincaro, preso, c.max)
    const scalino = scalinoDelPrezzo(prezzo)
    return {
      chiave: c.chiave, nome: c.nome, icona: c.icona, chiaro: c.chiaro,
      fascia: c.fascia, etichetta: scalino.nome, colore: scalino.colore,
      tinta: scalino.chiave,          // il colore della carta è quello del prezzo
      livello: preso + 1, nuova: preso === 0, max: c.max,
      oltreIlTetto: preso >= c.max,
      pallini: palliniDelPrezzo(prezzo), pallinoTot: PALLINI,
      prezzo,
    }
  }

  // chi sbaglia non prende niente e la partita riparte: nessuna
  // punizione oltre a questa, il potenziamento mancato basta da sé
  rinuncia() {
    if (!this.offerta) return null
    this.offerta = null
    this.motivoOfferta = null
    this.segnala('niente')
    return null
  }

  // una chiave che non è nell'offerta vale la prima (la più a buon mercato)
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
    this.motivoOfferta = null
    this.ricalcola()
    return c
  }

  // fatti già decisi, non regole: chi disegna non sa cos'è un potenziamento
  scena() {
    const e = this.eroe
    return {
      scenario: this.regole.scenario,
      terreno: this.terreno,
      tempo: this.tempo,
      eroe: {
        x: e.x, y: e.y, mira: e.mira, guarda: e.guarda, passi: e.passi,
        rotta: this.f.lancia || this.f.fendente ? e.rotta : null,
        fermo: !e.vx && !e.vy, raggio: this.f.raggio,
        lampeggia: e.invuln > 0,
      },
      nemici: this.nemici,
      colpi: this.colpi,
      gemme: this.gemme,
      oggetti: this.oggetti,
      risucchio: this.risucchio > 0,
      effetti: this.effetti,
      palle: this.palle,
      dolore: e.invuln > 0 ? Math.min(1, e.invuln / this.f.invuln) : 0,
    }
  }

  get cruscotto() {
    return {
      cuori: this.eroe.cuori,
      cuoriMax: this.eroe.cuoriMax,
      livello: this.livello,
      quota: Math.max(0, Math.min(1, this.xp / this.prossima)),
      tempo: this.tempo,
      restano: this.restano,
      infinita: this.regole.infinita || this.oltre,
      oltre: this.oltre,
      extra: this.extra,
      uccisi: this.uccisi,
      cassa: this.motivoOfferta === 'cassa',
      bombe: this.eroe.bombe,
      daSpendere: this.daSpendere,
      presi: this.mazzo
        .filter(c => this.livelloDi(c.chiave) > 0)
        .map(c => ({ chiave: c.chiave, icona: c.icona, quante: this.livelloDi(c.chiave) })),
    }
  }
}
