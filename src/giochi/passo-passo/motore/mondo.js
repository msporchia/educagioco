/* ═══════════════════════════════════════════════════════════════════
   LE REGOLE DEL MONDO — cosa succede a ogni freccia

   Sette regole, e **valgono sempre, uguali in ogni livello**: un mondo
   che in un posto fa una cosa e in un altro un'altra non si può
   programmare, si può solo indovinare. Un livello non ne cambia
   nessuna: ne mette in scena qualcuna.

     1. il prato si cammina;
     2. contro un ostacolo o contro il bordo della mappa si sbatte, e la
        fila si ferma lì;
     3. nell'acqua si fa splash, e la fila si ferma lì;
     4. il salto porta due celle più in là scavalcando quella in mezzo,
        se in mezzo c'è acqua, prato, ghiaccio o un ostacolo **basso**.
        Contro uno alto (o un masso) si sbatte. Dove si atterra valgono
        le regole di sempre;
     5. sul ghiaccio si continua nella stessa direzione finché la cella
        dopo non si può entrare (ostacolo, bordo, masso: ci si ferma sul
        ghiaccio, e **non è un errore**), finché il ghiaccio finisce (ci
        si ferma sulla prima cella che non è ghiaccio) o finché si cade
        in acqua (splash). Scivolando si prende la carota e si entra
        nella tana;
     6. camminando contro un masso lo si spinge di una cella, se oltre
        c'è posto. Oltre c'è ghiaccio: il masso scivola finché non si
        ferma. Oltre c'è acqua: il masso affonda e diventa un sasso
        piatto su cui si cammina — un ponte. Il masso non va su un
        ostacolo, su un altro masso, sulla tana, sulla carota o su una
        buca: lì non si muove, e il coniglio sbatte. Spinto il masso, il
        coniglio entra nella cella che ha lasciato;
     7. entrando in una buca si esce dalla sua gemella (stesso anello),
        e il movimento finisce lì, anche scivolando. Ripassarci sopra
        rifà il viaggio.

   E la tana: arrivarci, in qualunque modo e in qualunque momento,
   **vince subito** — le frecce dopo non contano.

   ── TRE SCELTE CHE LE REGOLE NON DICEVANO ─────────────────────────
   Le ha dovute prendere il motore, e stanno scritte qui perché sono
   regole anche loro:
     · saltando **non** si prende la carota che sta in mezzo, e non si
       entra nella tana che sta in mezzo: si prende quello che c'è dove
       si mette la zampa. Saltare oltre la tana è il modo più chiaro di
       vedere che il salto è lungo due;
     · non si atterra su un masso: lo si spinge solo camminando. Un masso
       spinto dall'alto era un caso che nessun bambino si aspetta;
     · una buca in mezzo a un salto si scavalca, come l'acqua.

   ── IL MOTORE NON SA DI ESSERE GUARDATO ───────────────────────────
   Ogni mossa lascia una **traccia**: una fila di fatti già decisi —
   «passo da qui a lì», «il masso scivola fin là», «splash qui» — che la
   scena (`scena/proiezione.js`) mette in movimento. Il motore non sa
   quanto dura un passo né com'è fatto uno splash; la scena non sa
   perché il coniglio si è fermato. Il risolutore la traccia la spegne
   (`eventi: false`) e va dieci volte più svelto.

   `senza` spegne una regola, e serve a una domanda sola: **questo
   livello ha bisogno della sua regola?** Un livello del ghiaccio che si
   vince anche col ghiaccio trattato da prato non insegna il ghiaccio
   (`motore/risolutore.js`, `serveLaRegola`). Nel gioco non si usa mai.
   ═══════════════════════════════════════════════════════════════════ */
import { MOSSE } from '../dati/mondo.js'

export const TANA = 'tana'
export const SBATTE = 'sbatte'
export const SPLASH = 'splash'
export const FINITA = 'finita'
/* un errore ferma la fila; la tana la chiude vincendo */
export const eErrore = esito => esito === SBATTE || esito === SPLASH

/* le regole che si possono spegnere col `senza` di `Mondo` (e le
   chiavi che i gradini della campagna dichiarano in `regola`) */
export const REGOLE = ['salto', 'ghiaccio', 'spinta', 'buche']

export class Mondo {
  constructor(liv, { senza = null, eventi = true } = {}) {
    this.liv = liv
    this.senza = senza
    this.p = liv.partenza
    this.presa = false
    this.massi = liv.massi.slice()
    this.ponti = []
    this.traccia = eventi ? [] : null
  }

  clona() {
    const m = Object.create(Mondo.prototype)
    m.liv = this.liv
    m.senza = this.senza
    m.p = this.p
    m.presa = this.presa
    m.massi = this.massi.slice()
    m.ponti = this.ponti.slice()
    m.traccia = null
    return m
  }

  /* lo stato in una parola, per il risolutore: due mondi con la stessa
     chiave sono lo stesso punto della partita. I massi si ordinano
     perché due massi uguali scambiati di posto sono la stessa cosa. */
  chiave() {
    const massi = this.massi.length > 1 ? this.massi.slice().sort((a, b) => a - b) : this.massi
    const ponti = this.ponti.length > 1 ? this.ponti.slice().sort((a, b) => a - b) : this.ponti
    return `${this.p}|${this.presa ? 1 : 0}|${massi.join(',')}|${ponti.join(',')}`
  }

  get pos() { return this.liv.xy(this.p) }

  /* ═══════════ cosa c'è in una cella, adesso ═══════════ */
  eAcqua(i) { return this.liv.terreno[i] === 'acqua' && !this.ponti.includes(i) }
  eGhiaccio(i) { return this.senza !== 'ghiaccio' && this.liv.terreno[i] === 'ghiaccio' }
  /* una buca senza gemella (una mappa scritta male: lo dice
     `guastiDellaMappa`) resta una buca in cui non si cade */
  eBuca(i) { return this.senza !== 'buche' && this.liv.terreno[i] === 'buca' && this.liv.gemella[i] >= 0 }
  eTana(i) { return i === this.liv.tana }
  haCarota(i) { return !this.presa && i === this.liv.carota }
  masso(i) { return this.massi.indexOf(i) }
  ostacolo(i) { return this.liv.ostacolo[i] }

  /* dove può andare a finire un masso: dappertutto dove c'è terra o
     acqua libera. Non copre la tana, la carota o una buca — sarebbero
     sparite sotto un sasso, e un livello non deve potersi rompere così */
  liberoPerMasso(i) {
    return i >= 0 && !this.ostacolo(i) && this.masso(i) < 0 &&
           !this.eTana(i) && !this.haCarota(i) && !this.eBuca(i)
  }

  segna(fatto) { if (this.traccia) this.traccia.push(fatto) }
  xy(i) { return this.liv.xy(i) }
  oltre(i, dx, dy) { const { x, y } = this.xy(i); return { x: x + dx, y: y + dy } }

  /* ═══════════ una mossa ═══════════
     Torna l'esito: `null` se la fila può andare avanti, altrimenti
     TANA, SBATTE o SPLASH. */
  mossa(m) {
    const d = MOSSE[m]
    if (!d) throw new Error(`mossa sconosciuta: ${m}`)
    return d.salto ? this.salta(d.dx, d.dy) : this.cammina(d.dx, d.dy)
  }

  cammina(dx, dy) {
    const p = this.p
    const q = this.liv.vicino(p, dx, dy)
    if (q < 0) return this.sbatte(p, this.oltre(p, dx, dy), 'bordo')
    if (this.ostacolo(q)) return this.sbatte(p, this.xy(q), this.ostacolo(q))
    const k = this.masso(q)
    if (k >= 0) {
      if (this.senza === 'spinta' || !this.spingi(k, p, dx, dy))
        return this.sbatte(p, this.xy(q), 'masso')
      this.p = q
      return this.arriva(q, dx, dy)
    }
    if (this.eAcqua(q)) return this.tuffo(p, q, 'passo')
    this.segna({ che: 'passo', da: this.xy(p), a: this.xy(q) })
    this.p = q
    return this.arriva(q, dx, dy)
  }

  salta(dx, dy) {
    const p = this.p
    const m = this.liv.vicino(p, dx, dy)
    if (m < 0) return this.sbatte(p, this.oltre(p, dx, dy), 'bordo', true)
    if (this.liv.alto(m)) return this.sbatte(p, this.xy(m), this.ostacolo(m), true)
    if (this.masso(m) >= 0) return this.sbatte(p, this.xy(m), 'masso', true)
    const q = this.liv.vicino(m, dx, dy)
    if (q < 0) return this.sbatte(p, this.oltre(m, dx, dy), 'bordo', true)
    if (this.ostacolo(q)) return this.sbatte(p, this.xy(q), this.ostacolo(q), true)
    if (this.masso(q) >= 0) return this.sbatte(p, this.xy(q), 'masso', true)
    if (this.eAcqua(q)) return this.tuffo(p, q, 'salto')
    this.segna({ che: 'salto', da: this.xy(p), a: this.xy(q) })
    this.p = q
    return this.arriva(q, dx, dy)
  }

  /* ── la spinta ──
     Il masso si sposta di una cella e poi fa quello che fa il terreno
     dove è finito: affonda nell'acqua, scivola sul ghiaccio. Il coniglio
     lo segue di un passo, e il fatto si scrive **una volta sola** per
     tutti e due: vanno insieme, e la scena li muove insieme. */
  spingi(k, p, dx, dy) {
    const q = this.massi[k]
    const r = this.liv.vicino(q, dx, dy)
    if (!this.liberoPerMasso(r)) return false
    this.segna({ che: 'spinta', da: this.xy(p), a: this.xy(q),
                 masso: { da: this.xy(q), a: this.xy(r) } })
    this.massi[k] = r
    this.massoArriva(k, dx, dy)
    return true
  }

  massoArriva(k, dx, dy) {
    let r = this.massi[k]
    for (;;) {
      if (this.eAcqua(r)) {
        this.massi.splice(k, 1)
        this.ponti.push(r)
        this.segna({ che: 'affonda', dove: this.xy(r) })
        return
      }
      if (!this.eGhiaccio(r)) return
      const n = this.liv.vicino(r, dx, dy)
      if (!this.liberoPerMasso(n)) return
      this.segna({ che: 'masso', da: this.xy(r), a: this.xy(n) })
      this.massi[k] = n
      r = n
    }
  }

  /* ── dopo essere entrati in una cella ──
     Qui vivono la carota, la tana, le buche e il ghiaccio. Il ciclo è la
     scivolata: finché si è sul ghiaccio si va avanti di una cella, e ogni
     cella nuova rifà gli stessi controlli — per questo scivolando si
     prende la carota, si entra nella tana e si cade in una buca. */
  arriva(i, dx, dy) {
    let c = i
    for (;;) {
      if (this.haCarota(c)) {
        this.presa = true
        this.segna({ che: 'carota', dove: this.xy(c) })
      }
      if (this.eTana(c)) {
        this.segna({ che: 'tana', dove: this.xy(c) })
        return TANA
      }
      if (this.eBuca(c)) {
        const g = this.liv.gemella[c]
        this.segna({ che: 'buca', da: this.xy(c), a: this.xy(g), coppia: this.liv.coppia[c] })
        this.p = g
        return null
      }
      if (!this.eGhiaccio(c)) return null
      const n = this.liv.vicino(c, dx, dy)
      if (n < 0 || this.ostacolo(n) || this.masso(n) >= 0) {
        this.segna({ che: 'frena', dove: this.xy(c), verso: this.oltre(c, dx, dy) })
        return null
      }
      if (this.eAcqua(n)) return this.tuffo(c, n, 'scivola')
      this.segna({ che: 'scivola', da: this.xy(c), a: this.xy(n) })
      this.p = n
      c = n
    }
  }

  sbatte(p, verso, contro, salto = false) {
    this.segna({ che: 'sbatte', da: this.xy(p), verso, contro, salto })
    return SBATTE
  }

  tuffo(da, a, come) {
    this.segna({ che: 'tuffo', da: this.xy(da), a: this.xy(a), come })
    this.p = a
    return SPLASH
  }
}

/* ═══════════ una fila intera ═══════════
   Si gioca la fila del bambino dall'inizio, sempre: è un programma, non
   un telecomando. Torna com'è finita e, per ogni freccia, i fatti che
   ha prodotto.

     esito   TANA · SBATTE · SPLASH · FINITA (le frecce sono finite prima
             della tana: non è un errore, è un programma non finito)
     dove    l'indice della freccia su cui è finita
     carota  se l'ha presa
     passi   [{ i, mossa, eventi }]
     mondo   com'è rimasto il mondo alla fine */
export function esegui(liv, fila, { senza = null, eventi = true } = {}) {
  const w = new Mondo(liv, { senza, eventi })
  const passi = []
  for (let i = 0; i < fila.length; i++) {
    if (eventi) w.traccia = []
    const esito = w.mossa(fila[i])
    passi.push({ i, mossa: fila[i], eventi: w.traccia || [] })
    if (esito) return { esito, dove: i, carota: w.presa, passi, mondo: w }
  }
  if (eventi) w.traccia = []
  return { esito: FINITA, dove: fila.length - 1, carota: w.presa, passi, mondo: w }
}

/* le stelle di una tappa vinta: arrivato, con la carota, senza aiuti */
export const stelleDellaVittoria = ({ carota = false, aiutato = false } = {}) =>
  1 + (carota ? 1 : 0) + (aiutato ? 0 : 1)
