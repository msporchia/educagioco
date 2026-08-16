/* ═══════════════════════════════════════════════════════════════════
   ORDINE — un'azione che punta a una cosa

   ── IL MOTO STA QUI, E NON IN `VAI` ─────────────────────────────
   Prendere, aprire, premere, attaccare: si spostano tutti. Muoversi
   verso quello che si vuole toccare non è il mestiere di un verbo
   particolare, è il tronco comune — e infatti `vai` era diventato il
   più grosso di tutti mentre gli altri se lo riscrivevano ognuno un po'
   a modo suo. Adesso questa classe fa una cosa sola:

       se non sei a portata, avvicinati di un passo;
       quando ci sei, `fa()`.

   e ogni verbo scrive **solo cosa fa una volta arrivato**. `Vai` si
   ferma, `Prendi` dice «prendi» all'oggetto, `Attacca` mena. Tre righe
   per uno.

   ── E NON SI CLASSIFICANO I BERSAGLI ────────────────────────────
   C'era una tabella `MOBILE` che divideva le cose in «ferme» e «che si
   muovono», e serviva a due domande che con la mobilità non c'entrano:

     da dove si tocca?   lo dice la COSA (`raggioDiPresa`): su un posto
                         ci si sale, un'unità e una porta chiusa si
                         toccano da accanto;
     dove credi che sia? lo dice il MONDO (`dovePensiCheSia`): quello
                         che vedi è dov'è, quello che non vedi è al
                         massimo un ricordo — e vale per un orco come
                         per una chiave che qualcuno si è messo in tasca.

   Non è affare di chi cammina sapere se il bersaglio scappa: si va
   verso dove si crede che sia, e se si muove lo si insegue. Che poi ci
   si arrivi o no è un fatto del gioco, non una previsione del verbo.
   ═══════════════════════════════════════════════════════════════════ */
import { Azione } from './azione.js'
import { Esito } from './esiti.js'
import { VERBI, saFare, nonRiesce } from '../vocabolario.js'
import { verso, VERSO } from '../mappa.js'
import { SCELTE, eScelta } from '../scelte.js'

export class Ordine extends Azione {
  /* ── E QUANDO IL BERSAGLIO È UNA SCHIERA, QUALE DI LORO ──
     `quale` è facoltativo e vale solo per le fazioni: è il criterio con
     cui si sceglie uno del gruppo (`scelte.js`). Sta sul tronco comune
     e non dentro `Attacca` perché non è affare di un verbo — «vai dagli
     orchi, il più lontano» è la stessa domanda di «attaccali». */
  constructor (via, bersaglio, quale) {
    super(via)
    this.bersaglio = bersaglio
    this.quale = quale || null
    /* chi della schiera si è già scelto: vedi `mira` qui sotto */
    this.scelto = null
  }
  static compila (dato, via) { return new this(via, dato.complemento, dato.quale) }

  azzera () { super.azzera(); this.scelto = null }

  esegui (contesto) {
    const { mondo, chi } = contesto
    const cosa0 = mondo.laCosa(this.bersaglio, chi)
    if (!cosa0) return this.nonVa(contesto, this.bersaglio
      ? `«${this.bersaglio}»? qui non c'è niente che si chiami così`
      : 'questo ordine non dice su cosa')

    const guaio = this.perchePosso(contesto, cosa0)
    if (guaio) return this.nonVa(contesto, guaio)

    const cosa = this.mira(contesto, cosa0)

    /* ── QUELLO CHE NON GLI RIESCE, LO DICE QUANDO CI È ARRIVATO ──
       Non è `sa`: quel verbo è in cassetta, l'ordine si scrive, e la
       scena parte. Poi arriva il suo turno e il cavaliere risponde «ho
       le mani occupate: scudo e spada» — e a quel punto è UNA COSA
       SUCCESSA, non un tasto che non c'era. Fallire da fermo,
       dall'altra parte della corte, sembrerebbe un ordine mai partito:
       ci si va, e si allargano le braccia sul posto. */
    const scusa = nonRiesce(chi, this.parola)

    if (!this.aPortata(contesto, cosa)) return this.avvicinati(contesto, cosa, scusa)
    return scusa ? this.nonVa(contesto, scusa, 'allarga le braccia') : this.fa(contesto, cosa)
  }

  /* la parte che è davvero di ogni verbo, con la cosa già a portata */
  fa (contesto, cosa) { return this.nonVa(contesto, `non so cosa fare con ${cosa.nome}`) }

  /* ── UNA SCHIERA CON UN CRITERIO SI RISOLVE UNA VOLTA SOLA ──
     «il più lontano» è un criterio che si sposta insieme a chi guarda:
     appena hai superato quello che avevi vicino, il più lontano diventa
     lui, e si torna indietro — avanti e indietro finché la scena non
     scade. Provato, e succede al primo pareggio.
     Perciò appena il criterio ha scelto qualcuno, l'ordine si tiene
     QUELLO e da lì in poi punta a lui come se il piano l'avesse
     nominato: torna a decidere solo se cade. Chi non scrive `quale` non
     passa di qui, e continua a inseguire la schiera come ha sempre
     fatto — «vai dagli orchi» vuol dire davvero «vai da quello che ti
     capita più a tiro». */
  mira (contesto, cosa) {
    if (!this.quale || cosa.tipo !== 'fazione') return cosa
    const { mondo, chi } = contesto
    if (this.scelto) {
      const gia = mondo.perId[this.scelto]
      if (gia && gia.eInPiedi()) return mondo.cose[this.scelto] || cosa
      this.scelto = null
    }
    const uno = mondo.dove(chi, cosa, this.quale)
    if (!uno) return cosa
    this.scelto = uno.id
    return mondo.cose[uno.id] || cosa
  }

  /* ── I TRE CONTROLLI CHE VALGONO PER TUTTI ──
     Sono la rete sotto: la cassetta e il validatore li hanno già fatti,
     e servono a un livello scritto a mano che sbaglia. Restituisce il
     motivo, o niente se va bene. */
  perchePosso (contesto, cosa) {
    const verbo = VERBI[this.parola]
    if (!verbo) return `«${this.parola}»? non so cosa voglia dire`
    if (!verbo.accetta.includes(cosa.tipo)) return `${cosa.nome} non si può ${verbo.nome}`
    if (!saFare(contesto.chi, this.parola)) return `non è il mio mestiere: non so ${verbo.nome}`
    if (!eScelta(this.quale))
      return `«${this.quale}»? non so quale scegliere — ` +
             Object.values(SCELTE).map(s => s.nome).join(', ')
    return ''
  }

  /* ── SONO ABBASTANZA VICINO PER TOCCARLA? ──
     Il limite lo dichiara la cosa, non questa classe: su un posto ci si
     sale sopra, un'unità e una porta chiusa si toccano da accanto. Chi
     colpisce da lontano non passa di qui — quello è l'arma, e lo dice
     `Attacca`. */
  aPortata (contesto, cosa) {
    const { mondo, chi } = contesto
    const dove = mondo.dovePensiCheSia(chi, cosa, this.quale)
    if (!dove) return false
    return raggioDiPresa(cosa).arriva(mondo, chi, dove.posto)
  }

  /* ── UN PASSO VERSO QUELLO CHE SI VUOLE TOCCARE ──
     Con dentro le tre cose che possono andare storte, e che prima ogni
     verbo raccontava a modo suo: non so dove sia, ci sono andato e non
     c'è nessuno, la strada è chiusa. */
  avvicinati (contesto, cosa, scusa) {
    const { mondo, chi } = contesto
    const dove = mondo.dovePensiCheSia(chi, cosa, this.quale)
    if (!dove) return this.nonVa(contesto, `${cosa.nome}? non so dov'è`, 'si guarda intorno')
    /* il ricordo era vecchio: sono arrivato dove l'avevo visto e non
       c'è più nessuno */
    if (dove.ricordo && raggioDiPresa(cosa).arriva(mondo, chi, dove.posto))
      return this.nonVa(contesto, `${cosa.nome} non è più qui`, 'si guarda intorno')
    if (verso(mondo, chi, dove.posto.x, dove.posto.y) === null)
      return this.aspettando(contesto, `non riesco ad arrivare a ${cosa.nome}: la strada è chiusa`)
    this.attese = 0
    this.dice(contesto, this.raccontaIlMoto(cosa, dove, scusa), 'va verso ' + VERSO[chi.dir])
    return Esito.inCorso()
  }

  /* come si racconta il viaggio: ogni verbo può dirlo a modo suo
     («vado a prendere la chiave», «inseguo l'orco») */
  raccontaIlMoto (cosa, dove, scusa) {
    return dove.ricordo ? `vado dove ho visto ${cosa.nome}` : `vado a ${cosa.nome}`
  }
}

/* ── DA DOVE SI TOCCA UNA COSA ──
   Lo dichiara la cosa. Chi non dice niente si tocca stando sulla sua
   cella, che è il caso più comune: un posto, un oggetto per terra, una
   porta aperta sotto i piedi. */
import { AContatto } from '../distanze/a-contatto.js'
const SOPRA = new AContatto(0)
const ACCANTO = new AContatto(1)
export function raggioDiPresa (cosa) {
  if (typeof cosa.raggioDiPresa === 'function') return cosa.raggioDiPresa()
  /* un'unità non si calpesta: le si sta accanto */
  return cosa.tipo === 'unita' || cosa.tipo === 'fazione' ? ACCANTO : SOPRA
}
