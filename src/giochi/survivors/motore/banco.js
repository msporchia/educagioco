/* ═══════════════════════════════════════════════════════════════════
   IL BANCO DI PROVA — un giocatore finto che schiva

   Non serve al gioco: serve a chi lo prova. Il gioco non lo importa, e
   nel file unico non ci finisce (il build lo scarta: nessuno lo chiama).

   In questo gioco il bambino fa **una cosa sola**: sposta il dito per non
   farsi toccare. Quindi il giocatore finto fa quella: guarda i mostri
   vicini e va dalla parte opposta, pesando di più quelli addosso. È il
   ragionamento che il gioco chiede — «di là ce ne sono troppi» — ridotto
   all'osso.

   E c'è la manopola che conta davvero: `bravura`. A 1 riguarda dove
   scappare sessanta volte al secondo e non sbaglia mai; a 0.5 ci ripensa
   ogni quarto di secondo, tira di sghembo e ogni tanto resta fermo — che
   è il bambino vero, ed è quello che dice se una tappa è giocabile
   davvero e non solo in teoria.

   `sapienza` è quanto spesso risponde giusto alla domanda che paga la
   carta: sbagliare non toglie niente, fa prendere la carta debole. Anche
   questo va misurato — una tappa che si vince **solo** rispondendo bene
   sarebbe una tappa che si perde a scuola, non nel gioco.
   ═══════════════════════════════════════════════════════════════════ */
import { Partita } from './partita.js'

const SGUARDO = 260          // fin dove il pilota guarda per decidere

export class Pilota {
  constructor({ rnd = Math.random, bravura = 1, sapienza = 0.8, gusto = 'forte',
                esattezza = null } = {}) {
    this.rnd = rnd
    this.bravura = bravura
    this.sapienza = sapienza
    /* Quante ne indovina, sempre, indipendentemente da quanto è cara la
       carta. Serve a **misurare quanto pesa sbagliare**: con `sapienza` la
       probabilità dipende dal prezzo, e allora «ne sbaglia il 10%» non si
       può nemmeno scrivere. Nel gioco vero non esiste: è lo strumento con
       cui si tara la domanda «quanto si può sbagliare e finirla lo
       stesso». */
    this.esattezza = esattezza
    this.gusto = gusto
    this.pensa = 0             // quanto manca alla prossima occhiata
    this.ultima = 0            // la direzione di adesso, in radianti
    this.domande = 0
    this.giuste = 0
  }

  /* Ogni quanto ci ripensa: chi è sveglio corregge in continuazione, chi
     lo è meno tiene la direzione di prima anche quando non va più bene. */
  get riflesso() { return 0.06 + (1 - this.bravura) * 0.45 }

  /* Scappare dritti non basta: chi fugge in linea retta si trova la folla
     davanti (i mostri nascono tutto intorno, anche dove sta andando) e si
     lascia indietro le gemme. Quindi il pilota fa quello che fa un
     giocatore vero: **guarda dove sarà fra mezzo secondo**. Prova sedici
     direzioni, immagina i mostri che nel frattempo gli sono venuti
     incontro, e sceglie il varco più largo.

     È il ragionamento che il gioco chiede, ridotto all'osso — «di là non
     ci passo più» — e serve che sia fatto bene: un pilota sciocco direbbe
     che tutte le tappe sono dure, e non si saprebbe quali lo sono davvero. */
  guida(partita, dt) {
    this.pensa -= dt
    if (this.pensa > 0) return
    this.pensa = this.riflesso

    /* chi è distratto ogni tanto non decide proprio: tiene la direzione
       di prima anche quando non va più bene */
    if (this.rnd() > 0.55 + 0.45 * this.bravura) return

    const e = partita.eroe
    const avanti = 0.55                       // di quanto si guarda avanti
    const passo = partita.f.velocita * avanti

    /* i mostri che contano, già spostati di dove saranno */
    const vicini = []
    for (const n of partita.nemici) {
      const dx = n.x - e.x, dy = n.y - e.y
      const d2 = dx * dx + dy * dy
      if (d2 > SGUARDO * SGUARDO) continue
      const d = Math.sqrt(d2) || 1
      const q = n.passo * avanti
      vicini.push({ x: n.x - dx / d * q, y: n.y - dy / d * q })
    }

    if (!vicini.length) {
      /* nessuno addosso: si va a prendere la gemma più lontana, che è
         quella che rischia di restare indietro */
      const g = this.gemmaLontana(partita)
      if (!g) { partita.fermati(); return }
      const a = Math.atan2(g.y - e.y, g.x - e.x)
      partita.muovi(Math.cos(a), Math.sin(a))
      return
    }

    let miglioreA = 0, migliore = Infinity
    const QUANTE = 16
    for (let i = 0; i < QUANTE; i++) {
      const a = i / QUANTE * 6.283
      const px = e.x + Math.cos(a) * passo, py = e.y + Math.sin(a) * passo
      let costo = 0
      for (const v of vicini) {
        const dx = v.x - px, dy = v.y - py
        costo += 1 / Math.max(900, dx * dx + dy * dy)
      }
      /* cambiare idea di colpo costa: chi zigzaga a vuoto non va da
         nessuna parte, e nemmeno un bambino lo fa */
      const svolta = Math.abs(Math.atan2(Math.sin(a - this.ultima), Math.cos(a - this.ultima)))
      costo *= 1 + 0.12 * svolta
      if (costo < migliore) { migliore = costo; miglioreA = a }
    }

    /* la mano storta: quanto meno è bravo, tanto più tira di sghembo */
    const storto = (this.rnd() - 0.5) * (1 - this.bravura) * 2.2
    const a = miglioreA + storto
    this.ultima = a
    partita.muovi(Math.cos(a), Math.sin(a))
  }

  gemmaLontana(partita) {
    let migliore = null, peggio = 0
    for (const g of partita.gemme) {
      const d = (g.x - partita.eroe.x) ** 2 + (g.y - partita.eroe.y) ** 2
      if (d > peggio) { peggio = d; migliore = g }
    }
    return peggio > 60 * 60 ? migliore : null
  }

  /* La pausa dei potenziamenti: si sceglie una carta e si paga la
     domanda. Sbagliare costa il giro — niente carta — ed è per questo che
     `sapienza` è una manopola che sposta davvero l'ago: giocare bene con
     le tabelline sbagliate deve restare possibile, ma non gratis. */
  rispondi(partita) {
    const offerta = partita.offerta
    if (!offerta?.length) return null
    const voluta = this.scegli(offerta)
    this.domande++
    const giusto = this.rnd() < this.probabilita(voluta.prezzo)
    if (giusto) this.giuste++
    return giusto ? partita.prendi(voluta.chiave) : partita.rinuncia()
  }

  scegli(offerta) {
    if (this.gusto === 'debole') return offerta[0]
    if (this.gusto === 'caso') return offerta[Math.floor(this.rnd() * offerta.length)]
    return offerta[offerta.length - 1]          // la più cara
  }

  /* Quanto spesso ci prende: più cara è la carta, più tosta è la domanda.
     Se il banco ha fissato l'esattezza, quella vince su tutto. */
  probabilita(prezzo) {
    if (this.esattezza !== null) return this.esattezza
    return Math.max(0.05, Math.min(0.98, this.sapienza - 0.35 * prezzo))
  }
}

/* Una partita giocata dal finto giocatore. `dt` fisso: il tempo di questo
   gioco non è quello dell'orologio, è quello che gli si dà. */
export function gioca(regole, {
  rnd = Math.random, dt = 1 / 30, bravura = 1, sapienza = 0.8, gusto = 'forte',
  esattezza = null, campo = null, fermo = false, fino = 180, oltre = 0, da = null,
} = {}) {
  /* `da` è una partita già cominciata — quella che serve a provare che
     una partita **ripresa** arriva in fondo (`motore/sosta.js`): il
     pilota la prende in mano dove qualcun altro l'ha lasciata. */
  const partita = da || new Partita(regole, { rnd, campo })
  const pilota = new Pilota({ rnd, bravura, sapienza, gusto, esattezza })
  const durata = Number.isFinite(regole.durata) ? regole.durata : fino
  /* `oltre` sono i secondi che il pilota resta in campo dopo aver vinto:
     serve a provare che la marea continua a salire e che prima o poi
     prende anche chi gioca bene */
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

/* Quante volte su cento questo giocatore porta a casa la tappa, quanto
   resiste quando non ce la fa, a che livello arriva. È il numero che dice
   se una tappa è tarata: sotto una certa soglia non è difficile, è
   ingiusta — e sopra un'altra non è una tappa, è un'attesa. */
export function misura(regole, {
  volte = 20, rnd = Math.random, ...resto
} = {}) {
  let vinte = 0, tempo = 0, livello = 0, uccisi = 0, domande = 0, ferite = 0
  for (let i = 0; i < volte; i++) {
    const { partita, pilota } = gioca(regole, { rnd, ...resto })
    if (partita.vinta) vinte++
    tempo += partita.tempo
    livello += partita.livello
    uccisi += partita.uccisi
    ferite += partita.ferite
    domande += pilota.domande
  }
  return {
    volte, vinte, quota: vinte / volte,
    tempoMedio: tempo / volte,
    livelloMedio: livello / volte,
    ucciseMedie: uccisi / volte,
    feriteMedie: ferite / volte,
    domandeMedie: domande / volte,
  }
}

/* Il caso ripetibile: due prove uguali devono raccontare la stessa
   storia, o un test rosso non si sa se è un guasto o sfortuna. */
export function caso(seme = 1) {
  let s = seme >>> 0 || 1
  return () => {
    s ^= s << 13; s >>>= 0
    s ^= s >>> 17
    s ^= s << 5; s >>>= 0
    return s / 4294967296
  }
}
