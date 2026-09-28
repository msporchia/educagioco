/* UN LIVELLO LETTO — la mappa ASCII diventata celle, in tabelle piatte
   (indicizzate `y · colonne + x`, perché il risolutore ci passa sopra
   decine di migliaia di volte per livello). Quello che sta qui non
   cambia mai durante una partita: quello che cambia (la posizione, i
   massi spinti, le pecore) sta nel mondo (`motore/mondo.js`), che parte
   da qui e non lo tocca. */
import { LEGENDA, OSTACOLI, VISTA } from '../dati/mondo.js'

export class Livello {
  /* `tappa` è una voce della campagna (o un livello generato): basta
     `mappa`, più `salti`/`zaino`/`carte`/`soluzioni` se il livello li usa */
  static da(tappa) {
    return new Livello(tappa.mappa, { salti: !!tappa.salti, zaino: tappa.zaino || null,
                                      carte: tappa.carte || [], soluzioni: tappa.soluzioni || [] })
  }

  constructor(mappa, { salti = false, zaino = null, carte = [], soluzioni = [] } = {}) {
    this.mappa = mappa.slice()
    this.righe = mappa.length
    this.colonne = mappa[0].length
    this.salti = salti
    this.zaino = zaino
    this.carte = carte
    this.soluzioni = soluzioni
    const n = this.righe * this.colonne
    this.n = n
    this.terreno = new Array(n)
    this.ostacolo = new Array(n).fill(null)
    this.coppia = new Array(n).fill(0)
    this.gemella = new Array(n).fill(-1)
    this.lastra = new Array(n).fill(null)
    this.partenza = -1
    this.tana = -1
    this.carota = -1
    this.massi = []
    this.pecore = []

    const buche = {}
    for (let y = 0; y < this.righe; y++) for (let x = 0; x < this.colonne; x++) {
      const i = y * this.colonne + x
      const d = LEGENDA[mappa[y][x]]
      if (!d) throw new Error(`lettera «${mappa[y][x]}» sconosciuta in (${x},${y})`)
      this.terreno[i] = d.terreno
      if (d.ostacolo) this.ostacolo[i] = d.ostacolo
      if (d.partenza) this.partenza = i
      if (d.terreno === 'tana') this.tana = i
      if (d.carota) this.carota = i
      if (d.masso) this.massi.push(i)
      if (d.pecora) this.pecore.push(i)
      if (d.lastra) this.lastra[i] = d.lastra
      if (d.coppia) {
        this.coppia[i] = d.coppia
        ;(buche[d.coppia] = buche[d.coppia] || []).push(i)
      }
    }
    this.cane = this.pecore.length > 0
    for (const [a, b] of Object.values(buche)) {
      if (b === undefined) continue          // una buca sola: lo dice `guastiDellaMappa`
      this.gemella[a] = b
      this.gemella[b] = a
    }
    this.incastro = this.cane ? celleIncastro(this) : null
  }

  x(i) { return i % this.colonne }
  y(i) { return (i / this.colonne) | 0 }
  xy(i) { return { x: this.x(i), y: this.y(i) } }
  indice(x, y) { return y * this.colonne + x }
  dentro(x, y) { return x >= 0 && y >= 0 && x < this.colonne && y < this.righe }

  /* la cella accanto, o -1 se si esce dalla mappa */
  vicino(i, dx, dy) {
    const x = this.x(i) + dx, y = this.y(i) + dy
    return this.dentro(x, y) ? this.indice(x, y) : -1
  }

  eRecinto(i) { return this.terreno[i] === 'recinto' }

  /* un ostacolo alto non si scavalca col salto; uno basso sì */
  alto(i) {
    const o = this.ostacolo[i]
    return !!o && OSTACOLI[o].alto
  }
}

/* le celle da cui una pecora non torna più al recinto (vedi
   docs/passo-passo/regole.md): il conto più largo possibile — nessun'altra
   pecora in mezzo, l'acqua conta come ponte se ci sono massi — così dice
   «incastrata» solo quando è vero in ogni caso. */
export function celleIncastro(liv) {
  const n = liv.n
  const ponti = liv.massi.length > 0
  const acqua = i => liv.terreno[i] === 'acqua' && !ponti
  const perPecora = i => i >= 0 && !liv.ostacolo[i] && !acqua(i) &&
    liv.terreno[i] !== 'tana' && liv.terreno[i] !== 'buca'
  const perCane = i => i >= 0 && !liv.ostacolo[i] && !acqua(i) && liv.terreno[i] !== 'recinto'
  const salva = new Array(n).fill(false)
  for (let i = 0; i < n; i++) if (liv.terreno[i] === 'recinto') salva[i] = true
  const VERSI = [[0, -1], [0, 1], [-1, 0], [1, 0]]
  for (let cambiato = true; cambiato;) {
    cambiato = false
    for (let c = 0; c < n; c++) {
      if (salva[c] || !perPecora(c)) continue
      for (const [dx, dy] of VERSI) {
        /* il cane dietro di lei, a una casella o fin dove lei lo vede */
        let dietro = false
        for (let q = c, passo = 1; passo <= VISTA; passo++) {
          q = liv.vicino(q, -dx, -dy)
          if (q < 0) break
          if (perCane(q)) { dietro = true; break }
          if (liv.alto(q)) break
        }
        if (!dietro) continue
        let r = liv.vicino(c, dx, dy)
        if (!perPecora(r)) continue
        while (liv.terreno[r] === 'ghiaccio') {
          const q = liv.vicino(r, dx, dy)
          if (!perPecora(q)) break
          r = q
        }
        if (salva[r]) { salva[c] = true; cambiato = true; break }
      }
    }
  }
  return salva.map((s, i) => !s && perPecora(i))
}
