// La bottega del mercante (in prova): una pozione con tanti ingredienti,
// un banchetto di ampolle a prezzo per ognuno, e i gettoni contati. Si
// compra un'ampolla e finisce nel suo misurino; oltre la tacca d'oro
// trabocca, e prima di comprare ancora si pulisce. Puro: il caso arriva
// da fuori (`rnd`). Le regole in docs/pozioni/bottega.md.
import { FAMIGLIA, INGREDIENTI, POZIONI, CLIENTI, VALE, scrivi } from '../dati/misure.js'
import { PEZZI, PREZZO, PULIZIA, MONETE_A_DOSE, DOSI } from '../dati/bottega.js'
import { chiaveDi } from './misura.js'

const pesca = (rnd, lista) => lista[Math.floor(rnd() * lista.length)]
function mescolata(rnd, lista) {
  const a = [...lista]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const grande = famiglia => VALE[FAMIGLIA[famiglia].unita.G]

// le unità in cui una quantità si scrive bene: almeno 0,1 e un decimale al più
export function unitaBuone(base, famiglia) {
  const f = FAMIGLIA[famiglia]
  return [f.unita.G, f.unita.M, f.unita.P].filter(u => {
    const x = base / VALE[u]
    return x >= 0.1 && Math.abs(x * 10 - Math.round(x * 10)) < 1e-9
  })
}

// il mercante scrive come gli pare: di solito non nell'unità della ricetta
function etichetta(rnd, base, famiglia, evita) {
  const ok = unitaBuone(base, famiglia)
  const altre = ok.filter(u => u !== evita)
  return altre.length && rnd() < 0.8 ? pesca(rnd, altre) : pesca(rnd, ok)
}

/* Il banchetto di un ingrediente: quattro ampolle. Un pezzo piccolo che
   divide la dose (così si compone sempre), due più grandi che ci stanno,
   e il trucco del mercante — la stessa quantità di una delle tre scritta
   in un'altra unità, a un altro prezzo — o un altro pezzo qualunque. */
export function banchetto(rnd, dose, famiglia, unita, { gemelli = true } = {}) {
  const G = grande(famiglia)
  const tutti = PEZZI.map(p => ({ base: Math.round(p * G), prezzo: PREZZO[p] }))
  const piccolo = pesca(rnd, tutti.slice(0, 2).filter(p => dose % p.base === 0))
  // il piccolo divide tutti gli altri, se no un avanzo resta senza ampolla (0,1 e 0,25)
  const buoni = tutti.filter(p => p.base % piccolo.base === 0)
  const altri = mescolata(rnd, buoni.filter(p => p.base > piccolo.base && p.base <= dose)).slice(0, 2)
  const o = [piccolo, ...altri].map(p => ({ ...p, unita: etichetta(rnd, p.base, famiglia, unita) }))
  const doppiabili = o.filter(p => unitaBuone(p.base, famiglia).length > 1)
  if (gemelli && doppiabili.length && rnd() < 0.75) {
    const a = pesca(rnd, doppiabili)
    const gemello = { base: a.base, prezzo: a.prezzo, unita: pesca(rnd, unitaBuone(a.base, famiglia).filter(u => u !== a.unita)) }
    // una delle due costa un gettone in più: quale, lo decide il caso
    if (rnd() < 0.5) gemello.prezzo += 1; else a.prezzo += 1
    o.push(gemello)
  }
  for (const p of mescolata(rnd, buoni)) {
    if (o.length >= 4) break
    if (!o.some(x => x.base === p.base)) o.push({ ...p, unita: etichetta(rnd, p.base, famiglia, unita) })
  }
  return mescolata(rnd, o)
}

const mcd = (a, b) => (b ? mcd(b, a % b) : a)

// il modo più economico di fare la dose con quelle ampolle (si ricompra
// quante volte si vuole): { costo, pezzi: [indici], o null se non si fa
export function ottimo(dose, offerte) {
  const passo = offerte.reduce((g, o) => mcd(g, o.base), dose)
  const n = dose / passo
  const costo = new Array(n + 1).fill(Infinity), scelto = new Array(n + 1).fill(-1)
  costo[0] = 0
  for (let x = 1; x <= n; x++)
    offerte.forEach((o, k) => {
      const q = o.base / passo
      if (q <= x && costo[x - q] + o.prezzo < costo[x]) { costo[x] = costo[x - q] + o.prezzo; scelto[x] = k }
    })
  if (!isFinite(costo[n])) return null
  const pezzi = []
  for (let x = n; x > 0; x -= offerte[scelto[x]].base / passo) pezzi.push(scelto[x])
  return { costo: costo[n], pezzi: pezzi.sort((a, b) => offerte[b].base - offerte[a].base) }
}

export class Bottega {
  constructor(tappa, { rnd = Math.random } = {}) {
    this.tappa = tappa
    // ogni famiglia della tappa almeno una volta, poi a caso
    const famiglie = mescolata(rnd, [...mescolata(rnd, tappa.famiglie),
      ...Array.from({ length: tappa.ingredienti }, () => pesca(rnd, tappa.famiglie))].slice(0, tappa.ingredienti))
    const usati = new Set()
    this.ingredienti = famiglie.map(famiglia => {
      const i = pesca(rnd, INGREDIENTI.filter(x => x.famiglia === famiglia && !usati.has(x.nome)))
      usati.add(i.nome)
      const dose = Math.round(pesca(rnd, DOSI[famiglia]) * grande(famiglia))
      const f = FAMIGLIA[famiglia]
      const unita = tappa.ricettaInGrande || rnd() < 0.5 ? f.unita.G : pesca(rnd, unitaBuone(dose, famiglia))
      const offerte = banchetto(rnd, dose, famiglia, unita, tappa)
      return { nome: i.nome, emoji: i.emoji, colore: i.colore, famiglia, unita, dose, messo: 0,
               offerte, ottimo: ottimo(dose, offerte), traboccate: 0, pezzi: [] }
    })
    const p = pesca(rnd, POZIONI)
    this.pozione = { nome: p.nome, emoji: p.emoji, colore: p.colore, cliente: pesca(rnd, CLIENTI) }
    this.minimo = this.ingredienti.reduce((s, i) => s + i.ottimo.costo, 0)
    this.gettoni = this.minimo + tappa.margine
    this.speso = 0
    this.corrente = 0
    this.macchia = null          // { ingrediente, colore }: quello che è traboccato, da pulire
    this.traboccate = 0
    this.pulizie = 0
    this.monete = 0              // quante ne ha rese la pozione (le paga Gioco.vue)
    this.finita = false
  }

  get resto() { return this.gettoni - this.speso }
  get extra() { return this.speso - this.minimo }
  // le stelle dicono quanto si è speso, non quante volte si è sbagliato
  get stelle() { return this.extra <= 0 ? 3 : this.extra <= 3 ? 2 : 1 }
  fatto(i) { const g = this.ingredienti[i]; return g.messo >= g.dose }
  manca(i) { const g = this.ingredienti[i]; return scrivi(g.dose - g.messo, g.unita) }

  scegli(i) {
    if (this.finita || this.macchia || !this.ingredienti[i] || this.fatto(i)) return false
    this.corrente = i
    return true
  }

  compra(k) {
    if (this.finita || this.macchia) return null
    const i = this.corrente, g = this.ingredienti[i], o = g.offerte[k]
    if (!o || this.fatto(i)) return null
    this.speso += o.prezzo
    const u = g.unita, letto = scrivi(o.base, o.unita)
    const vale = o.unita === u ? letto : `${letto} = ${scrivi(o.base, u)}`
    const chiave = chiaveDi(o.unita, u)
    if (g.messo + o.base > g.dose) {
      this.traboccate++; g.traboccate++
      this.macchia = { ingrediente: i, colore: g.colore }
      return { tipo: 'trabocca', ampolla: k, ingrediente: i, prezzo: o.prezzo,
               annota: chiave && { chiave, giusto: false },
               righe: [`Trabocca! ${vale}.`,
                       `Di ${g.nome} c'erano ${scrivi(g.messo, u)}: ${scrivi(g.messo, u)} + ${scrivi(o.base, u)} = ${scrivi(g.messo + o.base, u)}, oltre la tacca di ${scrivi(g.dose, u)}.`,
                       `Ne mancavano ${scrivi(g.dose - g.messo, u)}. Ora c'è da pulire.`] }
    }
    g.messo += o.base
    g.pezzi.push(o.base)
    const pieno = g.messo === g.dose
    const monete = pieno && !g.traboccate ? MONETE_A_DOSE : 0
    this.monete += monete
    if (pieno) {
      const dopo = this.ingredienti.findIndex((_, j) => j !== i && !this.fatto(j))
      if (dopo >= 0) this.corrente = dopo
      else this.finita = true
    }
    return { tipo: 'giusto', ampolla: k, ingrediente: i, prezzo: o.prezzo, pieno, finita: this.finita, monete,
             annota: chiave && { chiave, giusto: true },
             righe: [`${vale}: ${g.nome} arriva a ${scrivi(g.messo, u)}${pieno ? ', giusto sulla tacca d\'oro' : ''}.`] }
  }

  pulisci() {
    if (!this.macchia) return false
    this.speso += PULIZIA
    this.pulizie++
    this.macchia = null
    return true
  }

  // il modo più economico, ingrediente per ingrediente, da dire alla fine
  piuEconomico() {
    return this.ingredienti.map(g => ({
      nome: g.nome, costo: g.ottimo.costo,
      pezzi: g.ottimo.pezzi.map(k => scrivi(g.offerte[k].base, g.offerte[k].unita)),
    }))
  }
}

// Due giocatori finti, per i test e per tarare: chi fa sempre il minimo,
// e il goloso che prende ogni volta l'ampolla più grande che ci sta.
export function giocaBene(b) {
  b.ingredienti.forEach((g, i) => {
    b.scegli(i)
    for (const k of g.ottimo.pezzi) b.compra(k)
  })
  return b
}
export function giocaGoloso(b) {
  for (let giri = 0; !b.finita && giri < 500; giri++) {
    const g = b.ingredienti[b.corrente]
    const k = g.offerte.map((o, k) => k).filter(k => g.messo + g.offerte[k].base <= g.dose)
      .sort((a, c) => g.offerte[c].base - g.offerte[a].base || g.offerte[a].prezzo - g.offerte[c].prezzo)[0]
    if (k == null) break
    b.compra(k)
  }
  return b
}
