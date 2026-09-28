// Il banco di prova: un giocatore finto che schiva, raccoglie e mira.
// `bravura` è la manopola che conta: a 1 riguarda dove andare sessanta
// volte al secondo e non sbaglia mai, a 0.5 ci ripensa ogni quarto di
// secondo e tira di sghembo (il bambino vero). `mira` è quante volte,
// avendo un'arma che guarda dove corre e un grumo a tiro, sceglie di
// correre da quella parte fra le direzioni quasi sicure quanto la
// migliore. `raccolta` è quanto gli importa di quello che c'è per
// terra (0 = il bambino che sta al centro e schiva soltanto).
// `sapienza` è quanto risponde giusto alla domanda che paga una carta.
// Il pilota non bara: legge solo quello che si vede a schermo.
import { Partita } from './partita.js'

const SGUARDO = 300          // fin dove il pilota guarda per decidere
const PORTATA = 420          // fin dove conta una gemma o un oggetto
const QUANTE = 16            // le direzioni che prova
const GIUSTA = Math.PI / 4   // entro quanto una direzione «guarda» il grumo
// una direzione è abbastanza sicura per mirarci se dopo il passo nessun
// mostro è a meno di 75 pixel (il pericolo è la somma di 1/d²)
const PERICOLO_OK = 1 / (75 * 75)
const FINTA_OK = 90          // una finta si fa solo se il più vicino è oltre questi pixel
// quanto più pericolosa della migliore può essere una direzione perché
// ci si miri lo stesso: misurato — a 1.8 il pilota che mira moriva il
// triplo (la grotta da 92% a 25%), a 1.0 non mirava quasi mai (9%)
const QUASI = 1.15

const PESO_OGGETTO = 3       // un oggetto vale tre gemme: svanisce, e una cassa è un'offerta intera
const RACCOLTA_KERNEL = 30 * 30   // il nocciolo del richiamo: una gemma a più di 30px dal tragitto non si prende

const scarto = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)))

export class Pilota {
  constructor({ rnd = Math.random, bravura = 1, sapienza = 0.8, gusto = 'forte',
                esattezza = null, mira = 0.65, raccolta = 1 } = {}) {
    this.rnd = rnd
    this.bravura = bravura
    this.sapienza = sapienza
    this.raccolta = raccolta
    // quante ne indovina sempre, a prescindere dal prezzo: misura quanto
    // pesa sbagliare (con `sapienza` la probabilità dipende dal prezzo,
    // e "ne sbaglia il 10%" non si potrebbe scrivere). Non esiste nel gioco vero.
    this.esattezza = esattezza
    this.gusto = gusto
    this.mira = mira
    this.pensa = 0             // quanto manca alla prossima occhiata
    this.ultima = 0            // la direzione di adesso, in radianti
    this.domande = 0
    this.giuste = 0
    this.casse = 0             // offerte venute da una cassa e non da un livello
    this.occasioni = 0         // il conto della mira: occasioni con un'arma direzionale e un grumo a tiro
    this.mirate = 0
    this.ultimaFinta = null
  }

  get riflesso() { return 0.06 + (1 - this.bravura) * 0.45 }

  get quotaMira() { return this.occasioni ? this.mirate / this.occasioni : 0 }

  // guarda dove sarà fra mezzo secondo (non dove sono adesso i mostri),
  // sceglie il varco più largo tirato dalle cose da raccogliere, e se ha
  // un'arma che colpisce dove corre prende — fra le direzioni quasi
  // sicure — quella che guarda il grumo
  guida(partita, dt) {
    this.pensa -= dt
    if (this.pensa > 0) return
    this.pensa = this.riflesso

    if (this.rnd() > 0.55 + 0.45 * this.bravura) return

    const e = partita.eroe
    const avanti = 0.55                       // di quanto si guarda avanti
    const passo = partita.f.velocita * avanti

    const vicini = []
    for (const n of partita.nemici) {
      const dx = n.x - e.x, dy = n.y - e.y
      const d2 = dx * dx + dy * dy
      if (d2 > SGUARDO * SGUARDO) continue
      const d = Math.sqrt(d2) || 1
      const q = n.passo * avanti
      if (n.rotta) vicini.push({ x: n.x + n.rotta.x * q, y: n.y + n.rotta.y * q })
      else vicini.push({ x: n.x - dx / d * q, y: n.y - dy / d * q })
    }
    const mete = this.mete(partita)

    if (!vicini.length) {
      const m = this.metaMigliore(mete, e)
      if (!m) { partita.fermati(); return }
      const a = Math.atan2(m.y - e.y, m.x - e.x)
      this.vai(partita, a)
      return
    }

    // sedici direzioni a ventaglio più la direzione esatta verso le tre
    // mete migliori: da quando una gemma si prende a contatto, "più o
    // meno di là" non basta
    const direzioni = []
    for (let i = 0; i < QUANTE; i++) direzioni.push(i / QUANTE * 6.283)
    for (const m of this.meteMigliori(mete, e, 3)) direzioni.push(Math.atan2(m.y - e.y, m.x - e.x))

    const prove = []
    let minPericolo = Infinity
    for (const a of direzioni) {
      const ux = Math.cos(a), uy = Math.sin(a)
      const px = e.x + ux * passo, py = e.y + uy * passo
      let pericolo = 0
      for (const v of vicini) {
        const dx = v.x - px, dy = v.y - py
        pericolo += 1 / Math.max(900, dx * dx + dy * dy)
      }
      // conta quanto il tragitto del passo (non il punto d'arrivo) passa
      // vicino alle mete: una gemma si prende passandoci sopra
      let richiamo = 0
      for (const m of mete) {
        const mx = m.x - e.x, my = m.y - e.y
        const t = Math.max(0, Math.min(passo, mx * ux + my * uy))
        const dx = mx - ux * t, dy = my - uy * t
        richiamo += m.peso / (dx * dx + dy * dy + RACCOLTA_KERNEL)
      }
      const svolta = scarto(a, this.ultima)   // cambiare idea di colpo costa
      prove.push({ a, pericolo, richiamo, svolta, costo: pericolo * (1 + 0.12 * svolta) })
      if (pericolo < minPericolo) minPericolo = pericolo
    }
    // prima la pelle, poi le gemme: fra le direzioni quasi sicure quanto
    // la meno pericolosa, si prende quella che passa sopra più roba
    const sogliaSicura = Math.max(minPericolo * QUASI, PERICOLO_OK)
    let scelta = prove[0]
    for (const p of prove) if (p.costo < scelta.costo) scelta = p
    for (const p of prove) {
      if (p.pericolo > sogliaSicura) continue
      if (p.richiamo - 1e-5 * p.svolta > scelta.richiamo - 1e-5 * scelta.svolta) scelta = p
    }

    // la mira: con un'arma direzionale e un grumo a tiro, fra le
    // direzioni sicure si prende quella che guarda il grumo (non
    // sempre, mai a costo di finirci dentro); se nessuna guarda il
    // grumo ma nessuno è ancora addosso, una finta sola
    const grumo = this.grumo(partita)
    if (grumo !== null) {
      this.occasioni++
      if (this.rnd() < this.mira) {
        const sicure = prove.filter(p => p.pericolo <= Math.max(minPericolo * QUASI, PERICOLO_OK))
        let vicina = scelta
        for (const p of sicure) if (scarto(p.a, grumo.a) < scarto(vicina.a, grumo.a)) vicina = p
        if (scarto(vicina.a, grumo.a) <= GIUSTA) scelta = vicina
        else if (grumo.vicino > FINTA_OK && this.ultimaFinta !== grumo.a) {
          scelta = { a: grumo.a, pericolo: 0, costo: 0 }
          this.ultimaFinta = grumo.a         // una finta sola, non due di fila
        }
      }
    }

    const storto = (this.rnd() - 0.5) * (1 - this.bravura) * 2.2   // la mano storta
    const a = scelta.a + storto
    if (grumo !== null && scarto(a, grumo.a) <= GIUSTA) this.mirate++
    else this.ultimaFinta = null
    this.vai(partita, a)
  }

  vai(partita, a) {
    this.ultima = a
    partita.muovi(Math.cos(a), Math.sin(a))
  }

  mete(partita) {
    const e = partita.eroe
    const mete = []
    if (!(this.raccolta > 0)) return mete          // chi sta al centro non le guarda
    const entro = PORTATA * PORTATA
    for (const o of partita.oggetti || [])
      if ((o.x - e.x) ** 2 + (o.y - e.y) ** 2 < entro)
        mete.push({ x: o.x, y: o.y, peso: PESO_OGGETTO * this.raccolta })
    for (const g of partita.gemme)
      if ((g.x - e.x) ** 2 + (g.y - e.y) ** 2 < entro)
        mete.push({ x: g.x, y: g.y, peso: (g.val || 1) * this.raccolta })
    return mete
  }

  metaMigliore(mete, e) {
    return this.meteMigliori(mete, e, 1)[0] || null
  }

  meteMigliori(mete, e, quante) {
    const pesate = []
    for (const m of mete) {
      const d = Math.hypot(m.x - e.x, m.y - e.y)
      if (d < 20) continue
      pesate.push({ m, p: m.peso / (d + 60) })
    }
    pesate.sort((a, b) => b.p - a.p)
    return pesate.slice(0, quante).map(x => x.m)
  }

  // il grumo di mostri più fitto a tiro dell'arma direzionale: `null`
  // se non c'è un'arma così o nessuno è a tiro
  grumo(partita) {
    const f = partita.f
    if (!(f.lancia > 0 || f.fendente > 0)) return null
    const e = partita.eroe
    const R = Math.max(f.lancia > 0 ? f.gittata * 1.4 : 0, f.fendente > 0 ? f.raggioFendente : 0)
    const dentro = []
    let vicino = Infinity
    for (const n of partita.nemici) {
      const dx = n.x - e.x, dy = n.y - e.y
      const d = Math.hypot(dx, dy)
      if (d < vicino) vicino = d
      if (d < R) dentro.push({ a: Math.atan2(dy, dx), peso: 1 / (1 + d / 100) })
    }
    if (!dentro.length) return null
    let miglioreA = null, migliore = 0
    for (let i = 0; i < QUANTE; i++) {
      const a = i / QUANTE * 6.283
      let somma = 0
      for (const n of dentro) if (scarto(n.a, a) < 0.55) somma += n.peso
      if (somma > migliore) { migliore = somma; miglioreA = a }
    }
    return miglioreA === null ? null : { a: miglioreA, vicino }
  }

  rispondi(partita) {
    const offerta = partita.offerta
    if (!offerta?.length) return null
    const voluta = this.scegli(offerta)
    this.domande++
    if (partita.motivoOfferta === 'cassa') this.casse++
    const giusto = this.rnd() < this.probabilita(voluta.prezzo)
    if (giusto) this.giuste++
    return giusto ? partita.prendi(voluta.chiave) : partita.rinuncia()
  }

  scegli(offerta) {
    if (this.gusto === 'debole') return offerta[0]
    if (this.gusto === 'caso') return offerta[Math.floor(this.rnd() * offerta.length)]
    return offerta[offerta.length - 1]          // la più cara
  }

  probabilita(prezzo) {
    if (this.esattezza !== null) return this.esattezza
    return Math.max(0.05, Math.min(0.98, this.sapienza - 0.35 * prezzo))
  }
}

export function gioca(regole, {
  rnd = Math.random, dt = 1 / 30, bravura = 1, sapienza = 0.8, gusto = 'forte',
  esattezza = null, mira = 0.65, raccolta = 1, campo = null, fermo = false,
  fino = 180, oltre = 0, da = null,
} = {}) {
  // `da` è una partita già cominciata: serve a provare che una partita
  // ripresa (motore/sosta.js) arriva in fondo
  const partita = da || new Partita(regole, { rnd, campo })
  const pilota = new Pilota({ rnd, bravura, sapienza, gusto, esattezza, mira, raccolta })
  const durata = Number.isFinite(regole.durata) ? regole.durata : fino
  // `oltre` sono i secondi che il pilota resta in campo dopo aver vinto,
  // per provare che la marea prende anche chi gioca bene
  const finoA = durata + oltre
  const massimo = Math.ceil(finoA / dt) + 200
  let passi = 0
  while (passi++ < massimo) {
    if (partita.alTraguardo && oltre > 0 && partita.tempo < finoA) { partita.continua(); continue }
    if (partita.finita) break
    if (partita.inPausa) { pilota.rispondi(partita); continue }
    if (!fermo) pilota.guida(partita, dt)
    partita.avanza(dt)
    if (partita.eventi.length) partita.svuotaEventi()
    if ((regole.infinita || partita.oltre) && partita.tempo >= finoA) break
  }
  return { partita, pilota }
}

export function misura(regole, {
  volte = 20, rnd = Math.random, ...resto
} = {}) {
  let vinte = 0, tempo = 0, livello = 0, uccisi = 0, domande = 0, ferite = 0
  let occasioni = 0, mirate = 0, casse = 0
  for (let i = 0; i < volte; i++) {
    const { partita, pilota } = gioca(regole, { rnd, ...resto })
    if (partita.vinta) vinte++
    tempo += partita.tempo
    livello += partita.livello
    uccisi += partita.uccisi
    ferite += partita.ferite
    domande += pilota.domande
    casse += pilota.casse
    occasioni += pilota.occasioni
    mirate += pilota.mirate
  }
  return {
    volte, vinte, quota: vinte / volte,
    tempoMedio: tempo / volte,
    livelloMedio: livello / volte,
    ucciseMedie: uccisi / volte,
    feriteMedie: ferite / volte,
    domandeMedie: domande / volte,
    casseMedie: casse / volte,
    quotaMira: occasioni ? mirate / occasioni : null,
    occasioniMedie: occasioni / volte,
  }
}

export function caso(seme = 1) {
  let s = seme >>> 0 || 1
  return () => {
    s ^= s << 13; s >>>= 0
    s ^= s >>> 17
    s ^= s << 5; s >>>= 0
    return s / 4294967296
  }
}
