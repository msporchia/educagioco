/* ═══════════════════════════════════════════════════════════════════
   LE REGOLE DEL MONDO — cosa succede a ogni freccia

   Otto regole, e **valgono sempre, uguali in ogni livello**: un mondo
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
        rifà il viaggio;
     8. **le pecore scappano dal cane.** Quando il cane si ferma sulla
        riga o sulla colonna di una pecora, a una o due caselle da lei
        (`VISTA`) e senza niente di alto in mezzo — dopo un passo, una
        scivolata, un salto o una buca — lei fa un passo dalla parte
        opposta: si scansa prima che il cane le arrivi addosso. E se
        davanti ha un'altra pecora la spinge, e quella si sposta con lei:
        le pecore non sono sassi, si muovono a pezzetti di gregge. Se in
        fondo alla fila c'è un ostacolo, l'acqua, un masso, la tana o una
        buca, o se lì finisce la mappa, non si muove nessuna (e la prima
        fa «bee»). Sul ghiaccio scivola, come un masso,
        e si ferma sull'ultima cella prima di quello che la fermerebbe:
        nell'acqua non ci va. Una pecora che entra nel recinto ci resta,
        e non occupa più il posto. Il cane contro una pecora sbatte, e
        nel recinto non entra: sbatte anche lì. E una pecora che finisce
        dove non si recupera più — in un angolo, contro un muro lungo
        che non ha un «dietro» (`celleIncastro` in `motore/livello.js`)
        — **si incastra**, e la fila si ferma lì come contro un albero:
        la partita è già persa, e la freccia che l'ha persa lampeggia.

   E la meta. Il coniglio arriva alla tana: arrivarci, in qualunque modo
   e in qualunque momento, **vince subito** — le frecce dopo non
   contano. Il cane non ha una tana: vince quando l'ultima pecora entra
   nel recinto, allo stesso modo, subito.

   ── TRE SCELTE CHE LE REGOLE NON DICEVANO ─────────────────────────
   Le ha dovute prendere il motore, e stanno scritte qui perché sono
   regole anche loro:
     · saltando **non** si prende la carota che sta in mezzo, e non si
       entra nella tana che sta in mezzo: si prende quello che c'è dove
       si mette la zampa. Saltare oltre la tana è il modo più chiaro di
       vedere che il salto è lungo due;
     · non si atterra su un masso: lo si spinge solo camminando. Un masso
       spinto dall'alto era un caso che nessun bambino si aspetta;
     · una buca in mezzo a un salto si scavalca, come l'acqua;
     · una pecora no: è alta come un sasso, e contro si sbatte. Il
       recinto in mezzo a un salto invece si scavalca, è terra;
     · le pecore scappano **una volta per freccia**, quando il cane si
       è fermato: una scivolata lunga sei celle accanto a un gregge le
       spaventa solo dove finisce. Vedono sopra l'acqua e le cose basse,
       non attraverso un albero, un masso o un'altra pecora: quella
       dietro a una pecora il cane non lo vede. E scappano tutte insieme, ognuna
       dalla sua parte, in un ordine fisso (su, giù, sinistra, destra)
       che conta solo quando una scivola dove un'altra voleva andare;
     · la pecora passa sopra la carota (l'osso, per il cane) e la
       lascia lì: il cane la prende quando la pecora se n'è andata.

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
import { MOSSE, VERSI, CHIAVI_VERSI, VISTA } from '../dati/mondo.js'
import { albero, conCicli, eFine, CASA } from '../dati/carte.js'

export const TANA = 'tana'
export const SBATTE = 'sbatte'
export const SPLASH = 'splash'
export const STANCO = 'stanco'
export const PERSA = 'persa'
export const FINITA = 'finita'
/* un errore ferma la fila; la tana (o il recinto pieno) la chiude vincendo */
export const eErrore = esito => esito === SBATTE || esito === SPLASH || esito === STANCO || esito === PERSA

/* ── QUANTI PASSI PRIMA DI STANCARSI ──
   Coi cicli un programma corto può fare un sacco di strada, e anche
   girare a vuoto: `🔁9 (🔁9 (→ ←))` sono centosessantadue passi avanti e
   indietro, un minuto e mezzo di coniglio che fa la spola senza sbattere
   mai. Oltre questo numero gli gira la testa, e la fila si ferma lì
   come contro un sasso. Nessuna strada vera ci arriva vicino: una mappa
   da sette per nove ha sessantatré celle, e un livello che ne chiede
   più di cinquanta è un livello da rifare. */
export const PASSI_MAX = 90

/* le regole che si possono spegnere col `senza` di `Mondo` (e le
   chiavi che i gradini della campagna dichiarano in `regola`) */
export const REGOLE = ['salto', 'ghiaccio', 'spinta', 'buche', 'pecore']

export class Mondo {
  constructor(liv, { senza = null, eventi = true } = {}) {
    this.liv = liv
    this.senza = senza
    this.p = liv.partenza
    this.presa = false
    this.massi = liv.massi.slice()
    this.ponti = []
    /* le pecore ancora fuori dal recinto: quelle dentro non contano più,
       non occupano un posto e non si muovono */
    this.pecore = liv.pecore.slice()
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
    m.pecore = this.pecore.slice()
    m.traccia = null
    return m
  }

  /* lo stato in una parola, per il risolutore: due mondi con la stessa
     chiave sono lo stesso punto della partita. I massi si ordinano
     perché due massi uguali scambiati di posto sono la stessa cosa, e
     lo stesso le pecore. */
  chiave() {
    const ordina = v => (v.length > 1 ? v.slice().sort((a, b) => a - b) : v)
    const k = `${this.p}|${this.presa ? 1 : 0}|${ordina(this.massi).join(',')}|${ordina(this.ponti).join(',')}`
    return this.liv.cane ? `${k}|${ordina(this.pecore).join(',')}` : k
  }

  get pos() { return this.liv.xy(this.p) }

  /* ═══════════ cosa c'è in una cella, adesso ═══════════ */
  eAcqua(i) { return this.liv.terreno[i] === 'acqua' && !this.ponti.includes(i) }
  eGhiaccio(i) { return this.senza !== 'ghiaccio' && this.liv.terreno[i] === 'ghiaccio' }
  /* una buca senza gemella (una mappa scritta male: lo dice
     `guastiDellaMappa`) resta una buca in cui non si cade */
  eBuca(i) { return this.senza !== 'buche' && this.liv.terreno[i] === 'buca' && this.liv.gemella[i] >= 0 }
  eTana(i) { return i === this.liv.tana }
  /* la lastra che il coniglio ha sotto i piedi, se ce n'è una: è tutto
     quello che il «fino a» e il «se» guardano */
  lastra() { return this.liv.lastra ? this.liv.lastra[this.p] : null }
  haCarota(i) { return !this.presa && i === this.liv.carota }
  masso(i) { return this.massi.indexOf(i) }
  pecora(i) { return this.pecore.indexOf(i) }
  ostacolo(i) { return this.liv.ostacolo[i] }

  /* dove può andare a finire un masso: dappertutto dove c'è terra o
     acqua libera. Non copre la tana, la carota, una buca o una lastra —
     sarebbero sparite sotto un sasso, e un livello non deve potersi
     rompere così */
  liberoPerMasso(i) {
    return i >= 0 && !this.ostacolo(i) && this.masso(i) < 0 &&
           !this.eTana(i) && !this.haCarota(i) && !this.eBuca(i) &&
           !(this.liv.lastra && this.liv.lastra[i]) &&
           this.pecora(i) < 0 && !this.liv.eRecinto(i)
  }

  /* dove può scappare una pecora: dove si cammina e nel recinto. Non
     nell'acqua (un ponte sì), non contro un masso o un'altra pecora,
     non sulla tana e non in una buca */
  liberoPerPecora(i) {
    return i >= 0 && !this.ostacolo(i) && this.masso(i) < 0 && this.pecora(i) < 0 &&
           !this.eAcqua(i) && !this.eTana(i) && !this.eBuca(i)
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
    const esito = d.salto ? this.salta(d.dx, d.dy) : this.cammina(d.dx, d.dy)
    return esito || !this.liv.cane ? esito : this.spaventa()
  }

  cammina(dx, dy) {
    const p = this.p
    const q = this.liv.vicino(p, dx, dy)
    if (q < 0) return this.sbatte(p, this.oltre(p, dx, dy), 'bordo')
    if (this.ostacolo(q)) return this.sbatte(p, this.xy(q), this.ostacolo(q))
    if (this.pecora(q) >= 0) return this.sbatte(p, this.xy(q), 'pecora')
    if (this.liv.eRecinto(q)) return this.sbatte(p, this.xy(q), 'recinto')
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
    if (this.pecora(m) >= 0) return this.sbatte(p, this.xy(m), 'pecora', true)
    const q = this.liv.vicino(m, dx, dy)
    if (q < 0) return this.sbatte(p, this.oltre(m, dx, dy), 'bordo', true)
    if (this.ostacolo(q)) return this.sbatte(p, this.xy(q), this.ostacolo(q), true)
    if (this.masso(q) >= 0) return this.sbatte(p, this.xy(q), 'masso', true)
    if (this.pecora(q) >= 0) return this.sbatte(p, this.xy(q), 'pecora', true)
    if (this.liv.eRecinto(q)) return this.sbatte(p, this.xy(q), 'recinto', true)
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
      if (n < 0 || this.ostacolo(n) || this.masso(n) >= 0 || this.pecora(n) >= 0 || this.liv.eRecinto(n)) {
        this.segna({ che: 'frena', dove: this.xy(c), verso: this.oltre(c, dx, dy) })
        return null
      }
      if (this.eAcqua(n)) return this.tuffo(c, n, 'scivola')
      this.segna({ che: 'scivola', da: this.xy(c), a: this.xy(n) })
      this.p = n
      c = n
    }
  }

  /* ── le pecore ──
     Il cane si è fermato: chi lo vede — sulla sua riga o sulla sua
     colonna, fin dove arriva la vista — scappa dalla parte opposta. Ogni pecora lascia **un fatto solo**, con tutta la strada
     che ha fatto (il passo, la scivolata, il recinto) o con `ferma` se
     non ha potuto muoversi: la scena le fa scappare tutte insieme, e il
     «bee» di quella ferma dice al bambino che ci ha provato. */
  spaventa() {
    if (this.senza === 'pecore') return null
    const cane = this.p
    for (const v of CHIAVI_VERSI) {
      const { dx, dy } = VERSI[v]
      /* la prima pecora sulla linea, fin dove si vede: quelle dietro a
         lei il cane non lo vedono */
      let c = cane
      for (let passo = 1; passo <= VISTA; passo++) {
        c = this.liv.vicino(c, dx, dy)
        if (c < 0) break
        const k = this.pecora(c)
        if (k >= 0) { this.fuggi(k, dx, dy); break }
        if (this.liv.alto(c) || this.masso(c) >= 0) break
      }
    }
    if (!this.pecore.length) {
      this.segna({ che: 'gregge', dove: this.xy(cane) })
      return TANA
    }
    const persa = this.pecore.find(i => this.liv.incastro[i])
    if (persa === undefined) return null
    this.segna({ che: 'incastrata', dove: this.xy(persa) })
    return PERSA
  }

  /* ── la fuga, e il gregge ──
     Le pecore non sono sassi: una che scappa spinge quella che ha
     davanti, e quella la sua — si muove tutta la fila, un passo, come un
     pezzetto di gregge. Se in fondo alla fila c'è qualcosa che non la
     lascia passare (l'acqua, un albero, il bordo) non si muove nessuna,
     e la prima fa «bee». Poi ognuna fa quello che fa il terreno dove è
     finita: sul ghiaccio scivola, nel recinto entra. Si parte dalla
     testa della fila, così chi scivola dietro si ferma contro chi è
     davanti, e i fatti escono nello stesso ordine: la scena le muove
     tutte insieme. */
  fuggi(k, dx, dy) {
    const fila = [this.pecore[k]]
    let r = this.liv.vicino(fila[0], dx, dy)
    while (r >= 0 && this.pecora(r) >= 0) {
      fila.push(r)
      r = this.liv.vicino(r, dx, dy)
    }
    if (!this.liberoPerPecora(r)) {
      const da = this.xy(fila[0])
      this.segna({ che: 'fugge', da, a: da, via: [], ferma: true, verso: { dx, dy } })
      return
    }
    for (let j = fila.length - 1; j >= 0; j--) {
      const da = fila[j]
      const q = this.pecora(da)
      let c = this.liv.vicino(da, dx, dy)
      const via = [this.xy(c)]
      /* sul ghiaccio si scivola finché la cella dopo si può entrare; nel
         recinto ci si ferma e si resta */
      while (!this.liv.eRecinto(c) && this.eGhiaccio(c)) {
        const n = this.liv.vicino(c, dx, dy)
        if (!this.liberoPerPecora(n)) break
        c = n
        via.push(this.xy(c))
      }
      const dentro = this.liv.eRecinto(c)
      if (dentro) this.pecore.splice(q, 1)
      else this.pecore[q] = c
      this.segna({ che: 'fugge', da: this.xy(da), a: this.xy(c), via, dentro, verso: { dx, dy }, spinta: j > 0 })
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
   un telecomando. Torna com'è finita e, per ogni passo, i fatti che ha
   prodotto.

     esito   TANA · SBATTE · SPLASH · STANCO · FINITA (le frecce sono
             finite prima della tana: non è un errore, è un programma
             non finito)
     dove    l'indice, nella fila, della carta su cui è finita
     carota  se l'ha presa
     passi   [{ i, mossa, eventi, giri }] — uno per freccia eseguita.
             Senza cicli sono le carte della fila una per una; con i
             cicli la stessa carta torna a ogni giro, e `giri` dice a
             che giro è ogni ciclo aperto, dal più esterno:
             [[indice dell'apertura, giro, di quanti]]
     mondo   com'è rimasto il mondo alla fine */
const NESSUN_GIRO = Object.freeze([])

export function esegui(liv, fila, { senza = null, eventi = true } = {}) {
  const w = new Mondo(liv, { senza, eventi })
  const passi = []
  const esce = (esito, dove) => ({ esito, dove, carota: w.presa, passi, mondo: w })

  /* la fila di sempre, senza cicli: la strada svelta, perché il
     risolutore degli aiuti ci passa migliaia di volte */
  if (!conCicli(fila)) {
    for (let i = 0; i < fila.length; i++) {
      if (eFine(fila[i])) continue
      if (passi.length >= PASSI_MAX) return esce(STANCO, i)
      if (eventi) w.traccia = []
      const esito = w.mossa(fila[i])
      passi.push({ i, mossa: fila[i], eventi: w.traccia || [], giri: NESSUN_GIRO })
      if (esito) return esce(esito, i)
    }
    if (eventi) w.traccia = []
    return esce(FINITA, fila.length - 1)
  }

  /* coi cicli: si cammina l'albero, e una carta dentro un ciclo si
     esegue tante volte quanti sono i giri. Una N non scelta vale zero
     giri — ▶ non parte, ma gli aiuti una fila così la possono leggere.

     Il «fino a» fa un giro e poi guarda sotto i piedi, e smette se è sul
     colore giusto: almeno un giro sempre. «Fino a casa» non smette mai
     da sé — ci pensa la tana. Un giro che non ha mosso il coniglio non
     cambierà mai quello che ha sotto i piedi: la fila si ferma lì come
     quando gira la testa, invece di aspettare per sempre. Il «se» guarda
     una volta, e fa quello che ha dentro o lo salta. */
  const giri = []
  let fine = null
  const corri = nodi => {
    for (const nodo of nodi) {
      if (nodo.che === 'ripeti') {
        const qui = giri.length
        if (nodo.fino) {
          for (let g = 1; ; g++) {
            giri[qui] = [nodo.i, g, nodo.fino]
            const prima = passi.length
            if (corri(nodo.corpo)) return true
            if (nodo.fino !== CASA && w.lastra() === nodo.fino) break
            if (passi.length === prima) { fine = esce(STANCO, nodo.i); return true }
          }
        } else {
          for (let g = 1; g <= (nodo.volte || 0); g++) {
            giri[qui] = [nodo.i, g, nodo.volte]
            if (corri(nodo.corpo)) return true
          }
        }
        giri.length = qui
        continue
      }
      if (nodo.che === 'se') {
        if (nodo.colore && w.lastra() === nodo.colore && corri(nodo.corpo)) return true
        continue
      }
      if (passi.length >= PASSI_MAX) { fine = esce(STANCO, nodo.i); return true }
      if (eventi) w.traccia = []
      const esito = w.mossa(nodo.m)
      passi.push({ i: nodo.i, mossa: nodo.m, eventi: w.traccia || [], giri: giri.map(g => g.slice()) })
      if (esito) { fine = esce(esito, nodo.i); return true }
    }
    return false
  }
  if (corri(albero(fila))) return fine
  if (eventi) w.traccia = []
  return esce(FINITA, passi.length ? passi.at(-1).i : -1)
}

/* Le stelle di una tappa vinta: arrivato, con la carota, e la strada
   trovata da te. La terza la toglieva qualunque 💡, ed era il prezzo
   dell'aiuto; adesso gli aiuti si pagano in monete (`motore/aiuti.js`),
   e la stella se ne va solo se la strada te l'ha scritta tutta il gioco
   (`svelato`): non è un prezzo, è un fatto. */
export const stelleDellaVittoria = ({ carota = false, svelato = false } = {}) =>
  1 + (carota ? 1 : 0) + (svelato ? 0 : 1)
