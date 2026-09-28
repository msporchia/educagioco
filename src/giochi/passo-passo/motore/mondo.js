/* LE REGOLE DEL MONDO — cosa succede a ogni freccia. Valgono sempre,
   uguali in ogni livello: un livello non ne cambia nessuna, ne mette in
   scena qualcuna. Vedi docs/passo-passo/regole.md per le otto regole e
   i casi decisi apposta (il salto, i massi, le pecore).

   Ogni mossa lascia una **traccia** di fatti già decisi che la scena
   mette in movimento; il risolutore la spegne (`eventi: false`) e va
   dieci volte più svelto. `senza` spegne una regola per chiedersi se un
   livello ne ha davvero bisogno (`serveLaRegola`); nel gioco non si usa
   mai. */
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

/* oltre questi passi al coniglio gira la testa, come contro un sasso
   (vedi docs/passo-passo/zaino.md) */
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

  /* il cane si è fermato: chi lo vede scappa dalla parte opposta. Ogni
     pecora lascia un fatto solo (la strada fatta, o `ferma`), così la
     scena le fa scappare tutte insieme. */
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

  /* si parte dalla testa della fila (la pecora che scappa per prima),
     così chi scivola dietro si ferma contro chi è davanti e i fatti
     escono nello stesso ordine in cui la scena deve muoverli */
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

/* gioca la fila dall'inizio e torna { esito, dove, carota, passi, mondo }:
   `esito` è TANA·SBATTE·SPLASH·STANCO·FINITA (fila finita prima della
   tana, non un errore), `dove` l'indice della carta su cui è finita,
   `passi` un { i, mossa, eventi, giri } per freccia eseguita (coi cicli
   la stessa carta torna a ogni giro, e `giri` dice a che giro è ogni
   ciclo aperto). */
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

  /* coi cicli si cammina l'albero (vedi docs/passo-passo/zaino.md per
     «fino a» e «se»); una N non scelta vale zero giri */
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

/* le quattro stelle di una tappa vinta (vedi docs/passo-passo/stelle-e-aiuti.md) */
export const stelleDellaVittoria = ({ carota = false, svelato = false, corta = false } = {}) =>
  1 + (carota ? 1 : 0) + (svelato ? 0 : 1) + (corta ? 1 : 0)

/* la quarta stella, chiesta «al più»: chi trova una strada più corta di
   quella che il gioco conosce non perde niente */
export const eCorta = ({ usate, carota, minimo }) =>
  !!minimo && (carota || !minimo.carota) && usate <= minimo.carte
