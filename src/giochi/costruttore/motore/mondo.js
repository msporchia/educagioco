// Il cantiere: una griglia vista di lato (x a destra, y in basso). Regole del robot e dell'omino: docs/costruttore/linguaggio.md.
import { leggiSimbolo } from '../dati/legenda.js'
import { Inciampo } from './inciampo.js'

// Dove guarda una condizione, e dove si posa un mattone, rispetto al robot.
export const SPOSTAMENTI = {
  sotto: [0, 1], 'giu-destra': [1, 1], 'giu-sinistra': [-1, 1],
  destra: [1, 0], sinistra: [-1, 0], sopra: [0, -1],
}

export class Mondo {
  // `robot: [x, y]` serve ai livelli dove il robot parte sopra una cella del disegno, che nella mappa non ha anche la `@`.
  static daMappa(righe, { robot = null } = {}) {
    const h = righe.length
    const w = Math.max(...righe.map(r => r.length))
    const m = new Mondo(w, h)
    righe.forEach((riga, y) => {
      for (let x = 0; x < w; x++) {
        const s = leggiSimbolo(riga[x] ?? '.')
        if (!s) throw new Error(`mappa: il carattere «${riga[x]}» (riga ${y + 1}, colonna ${x + 1}) non è in legenda`)
        m.suolo[m.k(x, y)] = s.suolo
        if (s.robot) m.robot = { x, y }
        if (s.omino) m.omino = { x, y }
        if (s.bandiera) m.bandiera = { x, y }
        if (s.bersaglio) m.bersaglio.set(m.k(x, y), s.bersaglio)
        if (s.fisso) { m.mattoni.set(m.k(x, y), s.fisso); m.fissi.set(m.k(x, y), s.fisso) }
      }
    })
    if (robot) m.robot = { x: robot[0], y: robot[1] }
    if (!m.robot) m.robot = { x: 0, y: 0 }
    // Il robot parte coi piedi per terra: una mappa può metterlo più in alto, e scende prima che il programma cominci.
    m.cadutaIniziale = m.posaRobot()
    m.partenza = { ...m.robot }
    return m
  }

  // Torna le celle attraversate e come è finita: null se atterrato, 'splash' in acqua, 'fuori' se caduto dal cantiere.
  posaRobot() {
    const r = { ...this.robot }
    const celle = []
    while (!this.solido(r.x, r.y + 1)) {
      if (!this.dentro(r.x, r.y + 1)) { this.robot = r; return { celle, esito: 'fuori' } }
      r.y++
      celle.push({ ...r })
      if (this.suoloDi(r.x, r.y) === 'acqua' && !this.mattoneDi(r.x, r.y)) { this.robot = r; return { celle, esito: 'splash' } }
    }
    this.robot = r
    return { celle, esito: null }
  }

  libera(x, y) { return this.dentro(x, y) && !this.solido(x, y) }

  constructor(w, h) {
    this.w = w
    this.h = h
    this.suolo = new Array(w * h).fill('aria')
    this.mattoni = new Map()     // cella → colore, tutti: posati e già presenti
    this.fissi = new Map()       // cella → colore, quelli che c'erano all'inizio
    this.bersaglio = new Map()   // cella → colore, il disegno da costruire
    this.robot = null
    this.partenza = null
    this.omino = null
    this.bandiera = null
  }

  k(x, y) { return y * this.w + x }
  xy(k) { return { x: k % this.w, y: Math.floor(k / this.w) } }
  dentro(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h }
  suoloDi(x, y) { return this.dentro(x, y) ? this.suolo[this.k(x, y)] : null }
  mattoneDi(x, y) { return this.dentro(x, y) ? (this.mattoni.get(this.k(x, y)) || null) : null }
  solido(x, y) { return this.suoloDi(x, y) === 'terreno' || !!this.mattoneDi(x, y) }

  // Quello che il robot «vede» in una cella. Fuori dal cantiere c'è il bordo, che è una cosa e non un errore.
  cosaC(x, y) {
    if (!this.dentro(x, y)) return 'bordo'
    if (this.mattoneDi(x, y)) return 'mattone'
    const s = this.suoloDi(x, y)
    if (s === 'terreno') return 'terreno'
    if (s === 'acqua') return 'acqua'
    return 'vuoto'
  }

  // Torna null se è andato, o il motivo per cui no.
  metti(x, y, colore) {
    if (!this.dentro(x, y)) return 'fuori'
    if (this.mattoneDi(x, y)) return 'gia-mattone'
    if (this.suoloDi(x, y) === 'terreno') return 'terreno'
    this.mattoni.set(this.k(x, y), colore)
    return null
  }

  // L'esecutore passa qui le righe che non sono sue (`vai`, `metti`); `es` è l'esecuzione, per i valori e per contare i passi.
  *fai(i, es) {
    switch (i.tipo) {
      case 'vai': {
        if (i.verso !== 'destra' && i.verso !== 'sinistra') throw new Inciampo('verso-da-scegliere', i.id)
        const n = es.valuta(i.quanto, i.id)
        if (n < 0) throw new Inciampo('negativo', i.id, { quanto: n })
        for (let k = 0; k < n; k++) {
          if (k > 0) es.conta(i.id)
          yield* this.passo(i.verso === 'destra' ? 1 : -1, i.id)
        }
        break
      }
      case 'metti': {
        const colore = es.valutaColore(i.colore, i.id)
        const r = this.robot
        if (i.dove === null) throw new Inciampo('posto-da-scegliere', i.id)
        const dove = i.dove || 'sotto'
        if (dove === 'sotto') {
          // Il mattone va sotto i piedi, e il robot ci sale sopra: serve posto sopra la testa.
          if (!this.libera(r.x, r.y - 1)) throw new Inciampo('testa', i.id, { x: r.x, y: r.y - 1 })
          const no = this.metti(r.x, r.y, colore)
          if (no) throw new Inciampo(no, i.id, { x: r.x, y: r.y })
          yield { tipo: 'metti', x: r.x, y: r.y, colore, dove }
          const a = { x: r.x, y: r.y - 1 }
          this.robot = a
          yield { tipo: 'muovi', da: { ...r }, a: { ...a }, come: 'sale' }
        } else {
          const [dx, dy] = SPOSTAMENTI[dove] || [0, 1]
          const x = r.x + dx, y = r.y + dy
          const no = this.metti(x, y, colore)
          if (no) throw new Inciampo(no, i.id, { x, y })
          yield { tipo: 'metti', x, y, colore, dove }
        }
        break
      }
      default:
        break
    }
  }

  // Stessa regola dell'omino, tranne che il robot cade da qualunque altezza senza farsi male.
  *passo(dx, id) {
    const r = this.robot
    const nx = r.x + dx
    if (!this.dentro(nx, r.y)) throw new Inciampo('fuori', id, { x: nx, y: r.y })
    if (!this.solido(nx, r.y)) {
      const a = { x: nx, y: r.y }
      this.robot = a
      yield { tipo: 'muovi', da: { ...r }, a: { ...a }, come: 'passo' }
      if (this.suoloDi(a.x, a.y) === 'acqua' && !this.mattoneDi(a.x, a.y)) throw new Inciampo('splash', id, a)
      yield* this.cadi(id)
    } else if (this.libera(nx, r.y - 1) && this.libera(r.x, r.y - 1)) {
      const a = { x: nx, y: r.y - 1 }
      this.robot = a
      yield { tipo: 'muovi', da: { ...r }, a: { ...a }, come: 'sale' }
    } else throw new Inciampo('muro', id, { x: nx, y: r.y })
  }

  *cadi(id) {
    while (!this.solido(this.robot.x, this.robot.y + 1)) {
      const r = this.robot
      if (!this.dentro(r.x, r.y + 1)) throw new Inciampo('fuori', id, { x: r.x, y: r.y + 1 })
      const a = { x: r.x, y: r.y + 1 }
      this.robot = a
      yield { tipo: 'muovi', da: { ...r }, a: { ...a }, come: 'cade' }
      if (this.suoloDi(a.x, a.y) === 'acqua' && !this.mattoneDi(a.x, a.y)) throw new Inciampo('splash', id, a)
    }
  }

  // Torna la risposta e la cella guardata (la regia ci mette l'occhio sopra).
  guarda(c, es, id) {
    const [dx, dy] = SPOSTAMENTI[c.dove] || [0, 0]
    const x = this.robot.x + dx, y = this.robot.y + dy
    const cosa = this.cosaC(x, y)
    let trovato = c.cosa === 'pieno' ? (cosa === 'mattone' || cosa === 'terreno') : cosa === c.cosa
    if (trovato && c.cosa === 'mattone' && c.colore) trovato = this.mattoneDi(x, y) === es.valutaColore(c.colore, id)
    return { esito: c.c === false ? !trovato : trovato, x, y, cosa }
  }

  copia() {
    const m = new Mondo(this.w, this.h)
    m.suolo = this.suolo.slice()
    m.mattoni = new Map(this.mattoni)
    m.fissi = new Map(this.fissi)
    m.bersaglio = new Map(this.bersaglio)
    m.robot = this.robot && { ...this.robot }
    m.partenza = this.partenza && { ...this.partenza }
    m.omino = this.omino && { ...this.omino }
    m.bandiera = this.bandiera && { ...this.bandiera }
    return m
  }

  // Tre elenchi perché a schermo si dicono in tre modi diversi: manca lampeggia in trasparenza, troppo una croce, sbagliato tutte e due.
  confronta() {
    const mancano = [], troppi = [], sbagliati = []
    const atteso = new Map([...this.fissi, ...this.bersaglio])
    for (const [k, c] of atteso) {
      const ce = this.mattoni.get(k)
      if (!ce) mancano.push(this.xy(k))
      else if (ce !== c) sbagliati.push({ ...this.xy(k), atteso: c, trovato: ce })
    }
    for (const [k] of this.mattoni) if (!atteso.has(k)) troppi.push(this.xy(k))
    return { giusto: !mancano.length && !troppi.length && !sbagliati.length, mancano, troppi, sbagliati }
  }
}

// Cammina verso la bandiera un passo per volta (docs/costruttore/linguaggio.md); arriva stando nella sua colonna,
// a qualunque altezza. Torna { esito, passi }, coi passi come ci è arrivato (cammina/sale/cade).
export function camminaOmino(mondo, { massimo = 400, cadutaMassima = 3 } = {}) {
  if (!mondo.omino || !mondo.bandiera) return { esito: 'niente', passi: [] }
  const o = { ...mondo.omino }
  const passi = []
  const verso = mondo.bandiera.x >= o.x ? 1 : -1
  const bagnato = () => mondo.suoloDi(o.x, o.y) === 'acqua' && !mondo.mattoneDi(o.x, o.y)

  const cadi = () => {
    let giu = 0
    while (!mondo.solido(o.x, o.y + 1)) {
      if (!mondo.dentro(o.x, o.y + 1)) return 'fuori'
      o.y++
      giu++
      passi.push({ ...o, come: 'cade' })
      if (bagnato()) return 'splash'
    }
    return giu > cadutaMassima ? 'caduta' : null
  }

  const prima = cadi()
  if (prima) return { esito: prima, passi }
  for (let n = 0; n < massimo; n++) {
    if (o.x === mondo.bandiera.x) return { esito: 'arrivato', passi }
    const nx = o.x + verso
    if (!mondo.dentro(nx, o.y)) return { esito: 'fuori', passi }
    if (!mondo.solido(nx, o.y)) {
      o.x = nx
      passi.push({ ...o, come: 'cammina' })
      if (bagnato()) return { esito: 'splash', passi }
      const dopo = cadi()
      if (dopo) return { esito: dopo, passi }
    } else if (mondo.dentro(nx, o.y - 1) && !mondo.solido(nx, o.y - 1) && !mondo.solido(o.x, o.y - 1)) {
      o.x = nx
      o.y--
      passi.push({ ...o, come: 'sale' })
    } else {
      return { esito: 'muro', passi }
    }
  }
  return { esito: 'perso', passi }
}
