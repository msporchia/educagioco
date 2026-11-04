// La bottega del mercante: una tappa è una pozione con tanti ingredienti,
// un listino di ampolle a prezzo per ognuno, e i gettoni contati. Si
// ordinano due o tre ampolle e il mercante le versa nei loro misurini;
// oltre la tacca d'oro trabocca, e prima di ordinare ancora si pulisce.
// Puro: il caso arriva da fuori (`rnd`). Le regole in docs/pozioni/regole.md.
import { FAMIGLIA, INGREDIENTI, POZIONI, CLIENTI, VALE, scrivi } from '../dati/misure.js'
import { PEZZI, PREZZI, PULIZIA } from '../dati/bottega.js'
import { MONETE_A_DOSE } from '../dati/campagna.js'
import { chiaveDi } from './misura.js'

export function caso(seme = 1) {
  let s = seme >>> 0 || 1
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0
    return (s % 100000) / 100000
  }
}

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

// le unità in cui una quantità si scrive bene: almeno 0,1, un decimale al più, e non cifre da capogiro
export function unitaBuone(base, famiglia) {
  const f = FAMIGLIA[famiglia]
  return [f.unita.G, f.unita.M, f.unita.P].filter(u => {
    const x = base / VALE[u]
    return x >= 0.1 && x <= 20000 && Math.abs(x * 10 - Math.round(x * 10)) < 1e-9
  })
}

// il mercante scrive come gli pare, dentro le unità che la tappa conosce:
// di solito non quella della ricetta
function etichetta(rnd, base, famiglia, ammesse, evita) {
  const buone = unitaBuone(base, famiglia)
  const ok = buone.filter(u => ammesse.includes(u))
  const scelte = ok.length ? ok : buone
  const altre = scelte.filter(u => u !== evita)
  return altre.length && rnd() < 0.8 ? pesca(rnd, altre) : pesca(rnd, scelte)
}

// il fattore del listino: per le dosi grandi tutto sale di dieci o di
// cento, così bastano poche ampolle e i prezzi restano piccoli
export function scalaDi(dose, famiglia) {
  const G = grande(famiglia)
  return [100, 10].find(k => dose >= 0.25 * k * G && dose % Math.round(PEZZI[0] * k * G) === 0) || 1
}

/* Il listino di un ingrediente: quattro ampolle. Un pezzo piccolo che
   divide la dose e gli altri pezzi (così si compone sempre), il più grande
   che ci sta e uno in mezzo, e il trucco del mercante — la stessa quantità di
   una delle tre scritta in un'altra unità, a un altro prezzo — o un altro
   pezzo qualunque. */
export function banchetto(rnd, dose, famiglia, unita, tappa) {
  const f = FAMIGLIA[famiglia], k = scalaDi(dose, famiglia), G = grande(famiglia)
  const ammesse = (tappa.etichette || ['G', 'M', 'P']).map(t => f.unita[t])
  const tutti = PEZZI.map((p, i) => ({ base: Math.round(p * k * G), prezzo: PREZZI[i] }))
  // sotto il quarto, se il piccolo fosse il secondo pezzo resterebbe da solo
  const piccoli = tutti.slice(0, 2).filter(p => dose % p.base === 0)
  const piccolo = dose < tutti[3].base ? piccoli[0] : pesca(rnd, piccoli)
  // il piccolo divide tutti gli altri, se no un avanzo resta senza ampolla (0,1 e 0,25)
  const buoni = tutti.filter(p => p.base % piccolo.base === 0)
  // il più grande che ci sta c'è sempre, se no una dose chiederebbe decine di ampolle
  const sopra = buoni.filter(p => p.base > piccolo.base && p.base <= dose)
  const altri = sopra.length ? [sopra.at(-1), ...mescolata(rnd, sopra.slice(0, -1)).slice(0, 1)] : []
  const o = [piccolo, ...altri].map(p => ({ ...p, unita: etichetta(rnd, p.base, famiglia, ammesse, unita) }))
  const altreDi = p => unitaBuone(p.base, famiglia).filter(u => u !== p.unita && ammesse.includes(u))
  const doppiabili = o.filter(p => altreDi(p).length)
  if (tappa.gemelli && doppiabili.length && rnd() < 0.75) {
    const a = pesca(rnd, doppiabili)
    const gemello = { base: a.base, prezzo: a.prezzo, unita: pesca(rnd, altreDi(a)) }
    // una delle due costa un gettone in più: quale, lo decide il caso
    if (rnd() < 0.5) gemello.prezzo += 1; else a.prezzo += 1
    o.push(gemello)
  }
  for (const p of mescolata(rnd, buoni)) {
    if (o.length >= 4) break
    if (!o.some(x => x.base === p.base)) o.push({ ...p, unita: etichetta(rnd, p.base, famiglia, ammesse, unita) })
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
    const usati = new Set(), dosi = []
    this.ingredienti = famiglie.map(famiglia => {
      const i = pesca(rnd, INGREDIENTI.filter(x => x.famiglia === famiglia && !usati.has(x.nome)))
      usati.add(i.nome)
      // due ingredienti della stessa pozione non hanno la stessa dose, finché ce n'è un'altra
      const sue = tappa.dosi.filter(d => d.famiglia === famiglia)
      const libere = sue.filter(x => !dosi.some(y => y.famiglia === x.famiglia && y.base === x.base))
      const d = pesca(rnd, libere.length ? libere : sue)
      dosi.push(d)
      const offerte = banchetto(rnd, d.base, famiglia, d.unita, tappa)
      return { nome: i.nome, emoji: i.emoji, colore: i.colore, famiglia, unita: d.unita, dose: d.base, messo: 0,
               offerte, ottimo: ottimo(d.base, offerte), traboccate: 0, pezzi: [] }
    })
    // gli intrusi: il mercante vende anche quello che la ricetta non chiede
    this.estranei = mescolata(rnd, INGREDIENTI.filter(x => tappa.famiglie.includes(x.famiglia) && !usati.has(x.nome)))
      .slice(0, tappa.estranei || 0).map(i => {
        const d = pesca(rnd, tappa.dosi.filter(x => x.famiglia === i.famiglia))
        return { nome: i.nome, emoji: i.emoji, colore: i.colore, famiglia: i.famiglia, unita: d.unita, estraneo: true,
                 offerte: banchetto(rnd, d.base, i.famiglia, d.unita, tappa) }
      })
    // sul listino le righe stanno mescolate: l'ordine non dice cosa serve
    this.listino = mescolata(rnd, [...this.ingredienti, ...this.estranei].map((_, i) => i))
    const p = pesca(rnd, POZIONI)
    this.pozione = { nome: p.nome, emoji: p.emoji, colore: p.colore, cliente: pesca(rnd, CLIENTI) }
    this.minimo = this.ingredienti.reduce((s, i) => s + i.ottimo.costo, 0)
    this.gettoni = this.minimo + tappa.margine
    this.speso = 0
    this.macchie = []            // i misurini con la macchia attorno, da pulire prima del prossimo ordine
    this.traboccate = 0
    this.pulizie = 0
    this.monete = 0              // quante ne ha rese la pozione (le paga Gioco.vue)
    this.saltate = 0             // dosi date per fatte dal tasto dei grandi
    this.sprechi = 0             // ampolle comprate di quello che la ricetta non chiede
    this.finita = false
  }

  get resto() { return this.gettoni - this.speso }
  get extra() { return this.speso - this.minimo }
  // le stelle dicono quanto si è speso, non quante volte si è sbagliato
  get stelle() { return this.saltate ? 1 : this.extra <= 0 ? 3 : this.extra <= 3 ? 2 : 1 }
  get perfetta() { return !this.traboccate && !this.saltate && !this.sprechi }
  get quanteInOrdine() { return this.tappa.ordine }
  // le righe del listino: gli ingredienti della ricetta, poi gli intrusi (`i` nelle voci dell'ordine)
  riga(i) { return this.ingredienti[i] || this.estranei[i - this.ingredienti.length] }
  fatto(i) { const g = this.ingredienti[i]; return !!g && g.messo >= g.dose }

  /* L'ordine al mercante: due o tre ampolle (`voci`: { i, k }, anche di
     ingredienti diversi), pagate tutte insieme e versate in fila. Ognuna
     ci sta o trabocca da sola, nell'ordine scritto. Torna gli esiti, uno
     per ampolla, già decisi: la scena li suona uno dopo l'altro. */
  ordina(voci) {
    if (this.finita || this.macchie.length || !voci || !voci.length || voci.length > this.quanteInOrdine) return null
    if (voci.some(v => !this.riga(v.i) || !this.riga(v.i).offerte[v.k])) return null
    const costo = voci.reduce((s, v) => s + this.riga(v.i).offerte[v.k].prezzo, 0)
    this.speso += costo
    const esiti = voci.map(v => this.versaUna(v.i, v.k))
    this.finita = this.ingredienti.every((_, j) => this.fatto(j))
    return { costo, esiti, finita: this.finita }
  }

  versaUna(i, k) {
    const g = this.riga(i), o = g.offerte[k]
    if (g.estraneo) {
      this.sprechi++
      return { ingrediente: i, ampolla: k, testo: scrivi(o.base, o.unita), tipo: 'estraneo', prima: 0, dopo: 0, annota: null,
               righe: [`${g.nome[0].toUpperCase() + g.nome.slice(1)} non è nella ricetta: il mercante se la riprende, e i gettoni restano a lui.`] }
    }
    const u = g.unita, letto = scrivi(o.base, o.unita)
    const vale = o.unita === u ? letto : `${letto} = ${scrivi(o.base, u)}`
    // col conto scritto sotto la targhetta non si è saputo niente, e dopo un
    // trabocco su questo ingrediente nemmeno (docs/pozioni/regole.md)
    const scritto = ['gioco', 'svolto'].includes(this.tappa.aiuto)
    const chiave = !scritto && !g.traboccate ? chiaveDi(o.unita, u) : null
    const base = { ingrediente: i, ampolla: k, testo: letto, prima: g.messo }
    if (g.messo + o.base > g.dose) {
      this.traboccate++; g.traboccate++
      if (!this.macchie.includes(i)) this.macchie.push(i)
      return { ...base, tipo: 'trabocca', dopo: g.messo, annota: chiave && { chiave, giusto: false },
               righe: [`Trabocca! ${vale} di ${g.nome}.`,
                       g.messo === g.dose
                         ? `Il misurino era già pieno: ${scrivi(g.dose, u)}.`
                         : `C'erano ${scrivi(g.messo, u)}: ${scrivi(g.messo, u)} + ${scrivi(o.base, u)} = ${scrivi(g.messo + o.base, u)}, oltre la tacca di ${scrivi(g.dose, u)}. Ne mancavano ${scrivi(g.dose - g.messo, u)}.`] }
    }
    g.messo += o.base
    g.pezzi.push(o.base)
    const pieno = g.messo === g.dose
    const monete = pieno && !g.traboccate ? MONETE_A_DOSE : 0
    this.monete += monete
    return { ...base, tipo: 'giusto', dopo: g.messo, pezzi: [...g.pezzi], pieno, monete,
             annota: chiave && { chiave, giusto: true },
             righe: [`${vale}: ${g.nome} arriva a ${scrivi(g.messo, u)}${pieno ? ', sulla tacca d\'oro' : ''}.`] }
  }

  // il tasto dei grandi (docs/core/comandi.md): l'ingrediente in corso è
  // fatto e vale le sue monete, ma nessuno ha misurato
  salta() {
    if (this.finita || this.macchie.length) return null
    const i = this.ingredienti.findIndex((_, j) => !this.fatto(j)), g = this.ingredienti[i]
    g.pezzi = [g.dose]; g.messo = g.dose
    this.saltate++
    this.monete += MONETE_A_DOSE
    this.finita = this.ingredienti.every((_, j) => this.fatto(j))
    return { ingrediente: i, monete: MONETE_A_DOSE, finita: this.finita }
  }

  // tutte le macchie in una volta, un gettone l'una
  pulisci() {
    const n = this.macchie.length
    if (!n) return 0
    this.speso += PULIZIA * n
    this.pulizie += n
    this.macchie = []
    return n
  }

  // il modo più economico, ingrediente per ingrediente, da dire alla fine
  piuEconomico() {
    return this.ingredienti.map(g => ({
      nome: g.nome, costo: g.ottimo.costo,
      pezzi: g.ottimo.pezzi.map(k => scrivi(g.offerte[k].base, g.offerte[k].unita)),
    }))
  }
}

// Due giocatori finti, per i test e per tarare: chi ordina sempre il
// minimo, e il goloso che ordina ogni volta l'ampolla più grande che ci sta.
export function giocaBene(b) {
  const voci = b.ingredienti.flatMap((g, i) => g.ottimo.pezzi.map(k => ({ i, k })))
  for (let n = 0; n < voci.length; n += b.quanteInOrdine) b.ordina(voci.slice(n, n + b.quanteInOrdine))
  return b
}
export function giocaGoloso(b) {
  for (let giri = 0; !b.finita && giri < 500; giri++) {
    const i = b.ingredienti.findIndex((_, j) => !b.fatto(j)), g = b.ingredienti[i]
    const k = g.offerte.map((o, k) => k).filter(k => g.messo + g.offerte[k].base <= g.dose)
      .sort((a, c) => g.offerte[c].base - g.offerte[a].base || g.offerte[a].prezzo - g.offerte[c].prezzo)[0]
    if (k == null) break
    b.ordina([{ i, k }])
  }
  return b
}
