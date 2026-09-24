/* ═══════════════════════════════════════════════════════════════════
   UN LIVELLO LETTO — la mappa ASCII diventata celle

   La mappa sta nel dato come righe di lettere (`dati/campagna.js`, la
   legenda in `dati/mondo.js`); qui si legge **una volta** e si tiene in
   tabelle piatte, una voce per cella, indicizzate `y · colonne + x`.
   Piatte perché il risolutore ci passa sopra decine di migliaia di volte
   per livello, e un indice intero costa niente.

   Quello che sta qui non cambia mai durante una partita: il terreno, gli
   ostacoli, le coppie di buche, dove si parte, dov'è la tana, dove stava
   la carota e dove stavano i massi **all'inizio**. Quello che cambia —
   il coniglio, la carota presa, i massi spinti, i ponti — sta nel mondo
   (`motore/mondo.js`), che parte da qui e non lo tocca.
   ═══════════════════════════════════════════════════════════════════ */
import { LEGENDA, OSTACOLI } from '../dati/mondo.js'

export class Livello {
  /* `tappa` è una voce della campagna (o un livello generato): basta
     che abbia `mappa` e, se il livello usa i salti, `salti: true`. Dal
     gradino del ripeti anche lo `zaino` (quante carte tiene la fila),
     le `carte` che mette in mano oltre alle frecce, e le `soluzioni`
     scritte, da cui partono gli aiuti (`motore/risolutore.js`) */
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
    this.partenza = -1
    this.tana = -1
    this.carota = -1
    this.massi = []

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
      if (d.coppia) {
        this.coppia[i] = d.coppia
        ;(buche[d.coppia] = buche[d.coppia] || []).push(i)
      }
    }
    for (const [a, b] of Object.values(buche)) {
      if (b === undefined) continue          // una buca sola: lo dice `guastiDellaMappa`
      this.gemella[a] = b
      this.gemella[b] = a
    }
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

  /* un ostacolo alto non si scavalca col salto; uno basso sì */
  alto(i) {
    const o = this.ostacolo[i]
    return !!o && OSTACOLI[o].alto
  }
}
