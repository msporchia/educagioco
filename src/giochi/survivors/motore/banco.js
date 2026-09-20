/* ═══════════════════════════════════════════════════════════════════
   IL BANCO DI PROVA — un giocatore finto che va in giro

   Non serve al gioco: serve a chi lo prova. Il gioco non lo importa, e
   nel file unico non ci finisce (il build lo scarta: nessuno lo chiama).

   In questo gioco il bambino fa **tre cose col dito**, e il giocatore
   finto fa quelle:

     schiva    guarda i mostri vicini e va dove fra mezzo secondo c'è
               più spazio — e sa che chi è in fila (`rotta`) tira
               dritto invece di inseguirlo, che è quello che si vede
     raccoglie le gemme restano dove cadono e gli oggetti svaniscono: se
               non ci va nessuno, non sale di livello nessuno. Le mete
               tirano un po' la direzione, e quando non c'è nessuno
               addosso si va dritti alla più vicina
     mira      le armi direzionali colpiscono dove si sta andando, e un
               giocatore che le ha si mette a correre verso il grumo di
               mostri più fitto — non sempre, e non quando è pericoloso

   E c'è la manopola che conta davvero: `bravura`. A 1 riguarda dove
   andare sessanta volte al secondo e non sbaglia mai; a 0.5 ci ripensa
   ogni quarto di secondo, tira di sghembo e ogni tanto resta fermo — che
   è il bambino vero, ed è quello che dice se una tappa è giocabile
   davvero e non solo in teoria.

   `mira` è quante volte, avendo un'arma che guarda dove si corre e un
   grumo di mostri a tiro, sceglie di correre da quella parte fra le
   direzioni **quasi sicure quanto la migliore**. Non è «quante volte
   mira giusto»: quello lo misura il banco (`quotaMira`, la quota di
   occasioni in cui la direzione presa stava entro 45° dal grumo) — è
   quante volte ci prova. La differenza è che provarci quando tutte le
   direzioni sono pericolose non serve, e il pilota lo sa.

   `sapienza` è quanto spesso risponde giusto alla domanda che paga la
   carta: sbagliare non dà niente, e il giro dopo si riprova. Anche
   questo va misurato — una tappa che si vince **solo** rispondendo bene
   sarebbe una tappa che si perde a scuola, non nel gioco.

   Il pilota non bara: legge quello che si vede a schermo — dove sono i
   mostri, da che parte va una fila, dove stanno gemme e oggetti — e
   niente che il bambino non veda.
   ═══════════════════════════════════════════════════════════════════ */
import { Partita } from './partita.js'

const SGUARDO = 300          // fin dove il pilota guarda per decidere
const PORTATA = 420          // fin dove conta una gemma o un oggetto
const QUANTE = 16            // le direzioni che prova
const GIUSTA = Math.PI / 4   // entro quanto una direzione «guarda» il grumo
/* una direzione è abbastanza sicura per mirarci se dopo il passo nessun
   mostro è a meno di 75 pixel (il pericolo è la somma di 1/d²) */
const PERICOLO_OK = 1 / (75 * 75)
/* una finta — un'occhiata sola verso il grumo — si fa solo se il più
   vicino è ancora a più di questi pixel */
const FINTA_OK = 90
/* quanto più pericolosa della migliore può essere una direzione perché
   ci si miri lo stesso: misurato — a 1.8 il pilota che mira moriva il
   triplo (la grotta da 92% a 25%), a 1.0 non mirava quasi mai (9%) */
const QUASI = 1.15

/* quanto pesa una meta rispetto a un mostro: un oggetto vale tre gemme,
   perché svanisce e perché una cassa è un'offerta intera */
const PESO_OGGETTO = 3
const RICHIAMO = 1.0

const scarto = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)))

export class Pilota {
  constructor({ rnd = Math.random, bravura = 1, sapienza = 0.8, gusto = 'forte',
                esattezza = null, mira = 0.65 } = {}) {
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
    this.mira = mira
    this.pensa = 0             // quanto manca alla prossima occhiata
    this.ultima = 0            // la direzione di adesso, in radianti
    this.domande = 0
    this.giuste = 0
    /* il conto della mira: le occasioni in cui c'era un'arma che guarda
       dove si corre e un grumo a tiro, e quante volte la direzione presa
       stava entro `GIUSTA` dal grumo */
    this.occasioni = 0
    this.mirate = 0
    this.ultimaFinta = null
  }

  /* Ogni quanto ci ripensa: chi è sveglio corregge in continuazione, chi
     lo è meno tiene la direzione di prima anche quando non va più bene. */
  get riflesso() { return 0.06 + (1 - this.bravura) * 0.45 }

  /* quante volte su cento, avendone l'occasione, ha guardato dalla
     parte giusta: è il numero che dice se «mirare» sta succedendo */
  get quotaMira() { return this.occasioni ? this.mirate / this.occasioni : 0 }

  /* Scappare dritti non basta: chi fugge in linea retta si trova la folla
     davanti (i mostri nascono anche dove sta andando) e si lascia
     indietro le gemme, che adesso restano dove cadono. Quindi il pilota
     fa quello che fa un giocatore vero: **guarda dove sarà fra mezzo
     secondo**. Prova sedici direzioni, immagina i mostri che nel
     frattempo si sono mossi — verso di lui, o dritti se sono in fila —
     e sceglie il varco più largo, tirato un po' dalle cose da
     raccogliere. Se ha un'arma che colpisce dove corre, fra le direzioni
     quasi sicure quanto la migliore prende quella che guarda il grumo.

     È il ragionamento che il gioco chiede, ridotto all'osso, e serve che
     sia fatto bene: un pilota sciocco direbbe che tutte le tappe sono
     dure, e non si saprebbe quali lo sono davvero. */
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
      if (n.rotta) vicini.push({ x: n.x + n.rotta.x * q, y: n.y + n.rotta.y * q })
      else vicini.push({ x: n.x - dx / d * q, y: n.y - dy / d * q })
    }
    const mete = this.mete(partita)

    if (!vicini.length) {
      /* nessuno addosso: si va a prendere la cosa più vicina che vale
         di più, e se non c'è niente si sta fermi */
      const m = this.metaMigliore(mete, e)
      if (!m) { partita.fermati(); return }
      const a = Math.atan2(m.y - e.y, m.x - e.x)
      this.vai(partita, a)
      return
    }

    const prove = []
    let minPericolo = Infinity
    for (let i = 0; i < QUANTE; i++) {
      const a = i / QUANTE * 6.283
      const px = e.x + Math.cos(a) * passo, py = e.y + Math.sin(a) * passo
      let pericolo = 0
      for (const v of vicini) {
        const dx = v.x - px, dy = v.y - py
        pericolo += 1 / Math.max(900, dx * dx + dy * dy)
      }
      /* le cose da raccogliere tirano: poco, perché una gemma non vale
         un cuore, ma abbastanza da far curvare la fuga verso di loro */
      let richiamo = 0
      for (const m of mete) {
        const dx = m.x - px, dy = m.y - py
        richiamo += m.peso / (dx * dx + dy * dy + 12000)
      }
      /* cambiare idea di colpo costa: chi zigzaga a vuoto non va da
         nessuna parte, e nemmeno un bambino lo fa */
      const svolta = scarto(a, this.ultima)
      const costo = pericolo * (1 + 0.12 * svolta) - RICHIAMO * richiamo + 1e-5 * svolta
      prove.push({ a, pericolo, costo })
      if (pericolo < minPericolo) minPericolo = pericolo
    }
    let scelta = prove[0]
    for (const p of prove) if (p.costo < scelta.costo) scelta = p

    /* ── la mira ──
       Con un'arma che colpisce dove si corre e un grumo a tiro, fra le
       direzioni **abbastanza sicure** — quasi quanto la migliore, o con
       nessuno a meno di `SPAZIO_OK` dopo il passo — si prende quella
       che guarda il grumo. Non sempre (`mira`), e mai a costo di
       finirci dentro. Se nessuna direzione sicura guarda il grumo ma
       nessuno è ancora addosso, si fa **una finta**: un'occhiata sola
       verso di loro, che punta l'arma, e al battito dopo si torna a
       scappare. È quello che fa un bambino col fendente in mano: un
       passo verso i mostri e via. */
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

    /* la mano storta: quanto meno è bravo, tanto più tira di sghembo */
    const storto = (this.rnd() - 0.5) * (1 - this.bravura) * 2.2
    const a = scelta.a + storto
    if (grumo !== null && scarto(a, grumo.a) <= GIUSTA) this.mirate++
    else this.ultimaFinta = null
    this.vai(partita, a)
  }

  vai(partita, a) {
    this.ultima = a
    partita.muovi(Math.cos(a), Math.sin(a))
  }

  /* Le cose da andare a prendere, con quanto valgono: gli oggetti più
     delle gemme (svaniscono, e una cassa è un'offerta intera), le gemme
     quanto la loro esperienza. Solo quelle a portata di una schermata:
     una gemma a tre schermate non la vede nessuno. */
  mete(partita) {
    const e = partita.eroe
    const mete = []
    const entro = PORTATA * PORTATA
    for (const o of partita.oggetti || [])
      if ((o.x - e.x) ** 2 + (o.y - e.y) ** 2 < entro) mete.push({ x: o.x, y: o.y, peso: PESO_OGGETTO })
    for (const g of partita.gemme)
      if ((g.x - e.x) ** 2 + (g.y - e.y) ** 2 < entro) mete.push({ x: g.x, y: g.y, peso: g.val || 1 })
    return mete
  }

  metaMigliore(mete, e) {
    let migliore = null, punteggio = 0
    for (const m of mete) {
      const d = Math.hypot(m.x - e.x, m.y - e.y)
      if (d < 20) continue                    // già sotto i piedi: la prende da sé
      const p = m.peso / (d + 60)
      if (p > punteggio) { punteggio = p; migliore = m }
    }
    return migliore
  }

  /* Dove sta il grumo di mostri più fitto a tiro dell'arma che guarda
     dove si corre: la direzione, fra sedici, con più mostri nel suo
     spicchio, pesati per vicinanza — e quanto è vicino il più vicino di
     tutti, che decide se una finta è ancora possibile. `null` se non
     c'è un'arma così o non c'è nessuno a tiro: allora mirare non vuol
     dire niente. */
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
  esattezza = null, mira = 0.65, campo = null, fermo = false, fino = 180, oltre = 0, da = null,
} = {}) {
  /* `da` è una partita già cominciata — quella che serve a provare che
     una partita **ripresa** arriva in fondo (`motore/sosta.js`): il
     pilota la prende in mano dove qualcun altro l'ha lasciata. */
  const partita = da || new Partita(regole, { rnd, campo })
  const pilota = new Pilota({ rnd, bravura, sapienza, gusto, esattezza, mira })
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
   resiste quando non ce la fa, a che livello arriva, e quante volte ha
   guardato dalla parte giusta. È il numero che dice se una tappa è
   tarata: sotto una certa soglia non è difficile, è ingiusta — e sopra
   un'altra non è una tappa, è un'attesa. */
export function misura(regole, {
  volte = 20, rnd = Math.random, ...resto
} = {}) {
  let vinte = 0, tempo = 0, livello = 0, uccisi = 0, domande = 0, ferite = 0
  let occasioni = 0, mirate = 0
  for (let i = 0; i < volte; i++) {
    const { partita, pilota } = gioca(regole, { rnd, ...resto })
    if (partita.vinta) vinte++
    tempo += partita.tempo
    livello += partita.livello
    uccisi += partita.uccisi
    ferite += partita.ferite
    domande += pilota.domande
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
    /* la quota di occasioni in cui ha guardato dalla parte giusta, su
       tutte le partite insieme: `null` se non ne ha mai avuta una */
    quotaMira: occasioni ? mirate / occasioni : null,
    occasioniMedie: occasioni / volte,
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
