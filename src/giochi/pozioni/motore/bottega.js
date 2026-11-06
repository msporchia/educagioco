// La bottega del mercante: una tappa è una pozione con tanti ingredienti,
// un listino di ampolle a prezzo per ognuno, e i gettoni contati. Si
// ordinano fino a cinque ampolle, con la spedizione a ogni ordine, e il mercante le versa nei loro misurini;
// oltre la tacca d'oro trabocca, e prima di ordinare ancora si pulisce.
// Fatta la spesa si segue il procedimento (motore/procedimento.js).
// Puro: il caso arriva da fuori (`rnd`). Le regole in docs/pozioni/regole.md.
import { FAMIGLIA, INGREDIENTI, VALE, scrivi, mescola } from '../dati/misure.js'
import { PEZZI, PREZZI, TONDI, PREZZI_TONDI, AMPOLLE_A_ORDINE, SPEDIZIONE, PULIZIA, PASTICCIO } from '../dati/bottega.js'
import { MONETE_A_DOSE, MONETE_A_PASSO } from '../dati/campagna.js'
import { chiaveDi } from './misura.js'
import { AZIONI, MORTAIO, TAGLIERE, GRATTATO, ricetta, testo, frase } from './procedimento.js'

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

// le unità in cui una quantità si scrive bene: almeno 0,1, un decimale al più
// (`interi`: nessuno), e non cifre da capogiro
export function unitaBuone(base, famiglia, interi = false) {
  const f = FAMIGLIA[famiglia], decimi = interi ? 1 : 10
  return [f.unita.G, f.unita.M, f.unita.P].filter(u => {
    const x = base / VALE[u]
    return x >= 0.1 && x <= 20000 && Math.abs(x * decimi - Math.round(x * decimi)) < 1e-9
  })
}

// il mercante scrive come gli pare, dentro le unità che la tappa conosce:
// di solito non quella della ricetta
function etichetta(rnd, base, famiglia, ammesse, evita, interi) {
  const buone = unitaBuone(base, famiglia, interi)
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

// nelle tappe tonde il pezzo più piccolo è un intero anche nell'unità della
// ricetta: per «3 kg» il listino va da 1 a 10 kg, e la pergamena non dice mai 0,5 kg
function scalaTonda(dose, famiglia, unita) {
  const G = grande(famiglia)
  const possibili = [1, 10, 100].filter(k => { const p = Math.round(TONDI[0] * k * G); return dose % p === 0 && p % VALE[unita] === 0 })
  return possibili.filter(k => dose >= 0.25 * k * G).at(-1) ?? possibili[0]
}

// tutti i pezzi che il mercante può vendere per quella dose, dal più piccolo
export function pezziDi(dose, famiglia, unita, tappa) {
  const G = grande(famiglia)
  const [pezzi, prezzi, k] = tappa.tondi ? [TONDI, PREZZI_TONDI, scalaTonda(dose, famiglia, unita)] : [PEZZI, PREZZI, scalaDi(dose, famiglia)]
  return pezzi.map((p, i) => ({ base: Math.round(p * k * G), prezzo: prezzi[i] }))
}

/* Il listino di un ingrediente: quattro ampolle. Si parte dai pezzi che
   fanno davvero la dose (per 1,2 m: 1 m e 20 cm), così a ogni punto c'è
   un'ampolla sensata; poi il pezzo piccolo che divide tutti, così un
   avanzo non resta mai senza ampolla (0,1 e 0,25 insieme lo lasciavano);
   poi il trucco del mercante — la stessa quantità in un'altra unità, a un
   altro prezzo — e, se avanza un posto, un altro pezzo. */
export function banchetto(rnd, dose, famiglia, unita, tappa) {
  const f = FAMIGLIA[famiglia], interi = !!tappa.tondi
  const ammesse = (tappa.etichette || ['G', 'M', 'P']).map(t => f.unita[t])
  const tutti = pezziDi(dose, famiglia, unita, tappa)
  const servono = [...new Set(ottimo(dose, tutti).pezzi)].map(n => tutti[n])
  const passo = servono.reduce((g, p) => mcd(g, p.base), dose)
  // sempre uno dei due più piccoli, e che lasci quattro pezzi: una dose da un pezzo solo non resta con un listino di un'ampolla
  const multipli = p => tutti.filter(q => q.base % p.base === 0)
  const piccolo = tutti.slice(0, 2).filter(p => passo % p.base === 0 && multipli(p).length >= 4).at(-1)
  const buoni = multipli(piccolo)
  const o = [...new Set([...servono, piccolo])].map(p => ({ ...p, unita: etichetta(rnd, p.base, famiglia, ammesse, unita, interi) }))
  const altreDi = p => unitaBuone(p.base, famiglia, interi).filter(u => u !== p.unita && ammesse.includes(u))
  const doppiabili = o.filter(p => altreDi(p).length)
  if (tappa.gemelli && o.length < 4 && doppiabili.length && rnd() < 0.75) {
    const a = pesca(rnd, doppiabili)
    const gemello = { base: a.base, prezzo: a.prezzo, unita: pesca(rnd, altreDi(a)) }
    // una delle due costa un gettone in più: quale, lo decide il caso
    if (rnd() < 0.5) gemello.prezzo += 1; else a.prezzo += 1
    o.push(gemello)
  }
  // se avanza un posto, prima un pezzo che ci sta
  for (const p of [...mescolata(rnd, buoni.filter(x => x.base <= dose)), ...buoni.filter(x => x.base > dose)]) {
    if (o.length >= 4) break
    if (!o.some(x => x.base === p.base)) o.push({ ...p, unita: etichetta(rnd, p.base, famiglia, ammesse, unita, interi) })
  }
  return mescolata(rnd, o)
}

const mcd = (a, b) => (b ? mcd(b, a % b) : a)

// il modo più economico di fare la dose con quelle ampolle (si ricompra
// quante volte si vuole), a parità di gettoni con meno ampolle:
// { costo, pezzi: [indici] }, o null se non si fa
export function ottimo(dose, offerte) {
  const passo = offerte.reduce((g, o) => mcd(g, o.base), dose)
  const n = dose / passo, AMPOLLA = 1 / 1024     // pesa meno di un gettone, e si somma senza errori
  const costo = new Array(n + 1).fill(Infinity), scelto = new Array(n + 1).fill(-1)
  costo[0] = 0
  for (let x = 1; x <= n; x++)
    offerte.forEach((o, k) => {
      const q = o.base / passo, c = q <= x ? costo[x - q] + o.prezzo + AMPOLLA : Infinity
      if (c < costo[x]) { costo[x] = c; scelto[x] = k }
    })
  if (!isFinite(costo[n])) return null
  const pezzi = []
  for (let x = n; x > 0; x -= offerte[scelto[x]].base / passo) pezzi.push(scelto[x])
  return { costo: pezzi.reduce((s, k) => s + offerte[k].prezzo, 0), pezzi: pezzi.sort((a, b) => offerte[b].base - offerte[a].base) }
}

// quanti ordini bastano per quello che manca, e quanto costa la spesa più
// economica: le ampolle e la spedizione. Pagare un gettone in più per
// risparmiare un'ampolla è pari, quindi `ottimo` ingrediente per ingrediente regge
const ordiniMinimi = ingredienti => Math.ceil(ingredienti.reduce((n, g) => n + g.ottimo.pezzi.length, 0) / AMPOLLE_A_ORDINE)
export const minimoDi = ingredienti => ingredienti.reduce((s, g) => s + g.ottimo.costo, 0) + ordiniMinimi(ingredienti) * SPEDIZIONE

// la mossa è quella del passo `p`: chi aveva cominciato quello prima è già andato avanti
const INIZIA = { metti: 'pesta', appoggia: 'sminuzza' }
const seguente = (p, azione, cosa) => p && (INIZIA[azione] || azione) === p.azione && (!cosa.length || cosa.some(i => p.cosa.includes(i)))

export class Bottega {
  // `scorta`: i gettoni che il calderone senza fondo si porta dalla pozione prima
  constructor(tappa, { rnd = Math.random, scorta = 0 } = {}) {
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
      return { nome: i.nome, f: !!i.f, art: i.art, lavoro: i.lavoro, colore: i.colore, famiglia, unita: d.unita, dose: d.base, messo: 0,
               offerte, ottimo: ottimo(d.base, offerte), traboccate: 0, pezzi: [] }
    })
    this.pozione = { nome: tappa.nome, emoji: tappa.emoji, colore: tappa.colore }
    this.passi = ricetta(rnd, this.ingredienti, tappa.procedimento, tappa.azioni)
    this.righe = testo(rnd, this.passi, this.ingredienti, tappa.procedimento >= 5)
    this.passo = 0               // il prossimo da fare
    this.mortaio = []            // quello che è nel mortaio
    this.pestato = false         // ed è già stato pestato
    this.tagliere = []           // quello che è sul tagliere
    this.tagliato = false        // ed è già stato sminuzzato
    this.grattato = []           // quello che è caduto nel ciotolino
    this.iniziato = false        // il dito ha cominciato il passo e l'ha lasciato lì
    this.dentro = []             // quello che è nel calderone
    this.scaldato = false
    this.incantato = false       // la bacchetta
    this.mescolato = false       // dall'ultima versata: se no nel calderone c'è l'arcobaleno
    this.pasticci = 0
    this.pasticciato = false     // il passo in corso ha già avuto uno sbaglio: non paga
    this.minimo = minimoDi(this.ingredienti)
    this.gettoni = this.minimo + tappa.margine + scorta
    this.speso = 0
    this.macchie = []            // gli strumenti con la macchia attorno, da pulire prima del prossimo ordine
    this.traboccate = 0
    this.pulizie = 0
    this.monete = 0              // quante ne ha rese la pozione (le paga Gioco.vue)
    this.saltate = 0             // dosi date per fatte dal tasto dei grandi
    this.finita = false
  }

  get resto() { return this.gettoni - this.speso }
  // tutti, tranne la roba secca che una sosta di prima si porta dietro (motore/sosta.js)
  get comprati() { return this.ingredienti.filter(g => !g.dispensa) }
  get extra() { return this.speso - this.minimo }
  // le stelle dicono quanto si è speso, non quante volte si è sbagliato
  get stelle() { return this.saltate ? 1 : this.extra <= 0 ? 3 : this.extra <= 3 ? 2 : 1 }
  get perfetta() { return !this.traboccate && !this.pasticci && !this.saltate }
  // il colore del calderone: dentro tutto e mescolato, è quello della pozione
  get brodo() {
    if (this.mescolato && this.dentro.length === this.ingredienti.length) return this.pozione.colore
    return mescola(this.dentro.map(i => this.ingredienti[i].colore))
  }
  // la spesa è fatta: tutti gli strumenti sono all'oro
  get pronta() { return this.ingredienti.every((_, j) => this.fatto(j)) }
  get quanteInOrdine() { return AMPOLLE_A_ORDINE }
  fatto(i) { const g = this.ingredienti[i]; return g.messo >= g.dose }

  /* L'ordine al mercante: fino a cinque ampolle (`voci`: { i, k }, anche di
     ingredienti diversi), pagate tutte insieme con una spedizione e versate in fila. Ognuna
     ci sta o trabocca da sola, nell'ordine scritto. Torna gli esiti, uno
     per ampolla, già decisi: la scena li suona uno dopo l'altro. */
  ordina(voci) {
    if (this.pronta || this.macchie.length || !voci || !voci.length || voci.length > this.quanteInOrdine) return null
    if (voci.some(v => !this.ingredienti[v.i] || !this.ingredienti[v.i].offerte[v.k])) return null
    const costo = voci.reduce((s, v) => s + this.ingredienti[v.i].offerte[v.k].prezzo, SPEDIZIONE)
    this.speso += costo
    const esiti = voci.map(v => this.versaUna(v.i, v.k))
    return { costo, esiti, pronta: this.pronta }
  }

  /* Un'azione del procedimento. Giusta se fa avanzare il prossimo passo: le
     cose entrano una alla volta, nel mortaio (`metti`) o nel calderone. Se no è
     un pasticcio: non cambia niente, costa un gettone, e il cartello dice cosa
     diceva la ricetta. */
  fai(azione, cosa = []) {
    if (!this.pronta || this.finita || this.macchie.length || !AZIONI[azione]) return null
    const atteso = this.passi[this.passo]
    const manca = this.mancaAl(atteso)
    const fra = cosa.length && cosa.every(i => manca.includes(i))
    const giusto = azione === 'metti' ? atteso.azione === 'pesta' && fra
      : azione === 'pesta' ? atteso.azione === 'pesta' && !manca.length
      : azione === 'appoggia' ? atteso.azione === 'sminuzza' && fra
      : azione === 'sminuzza' ? atteso.azione === 'sminuzza' && !manca.length
      : azione === 'gratta' ? atteso.azione === 'gratta' && fra
      : azione === 'versa' ? atteso.azione === 'versa' && fra && (!cosa.includes(MORTAIO) || this.pestato) && (!cosa.includes(TAGLIERE) || this.tagliato) && (!cosa.includes(GRATTATO) || this.grattato.length)
      : azione === atteso.azione
    if (!giusto) {
      if (this.iniziato && seguente(this.passi[this.passo + 1], azione, cosa)) { const m = this.chiudi(atteso).monete, r = this.fai(azione, cosa); return { ...r, monete: (r.monete || 0) + m } }
      if (this.iniziato || manca.length < atteso.cosa.length)
        return { giusto: false, gratis: true, azione, righe: ['Manca ancora un pezzo.', `La ricetta dice: ${frase(atteso.azione === 'versa' ? { ...atteso, cosa: manca } : atteso, this.ingredienti)}.`] }
      this.speso += PASTICCIO
      this.pasticci++
      this.pasticciato = true
      const qui = azione === atteso.azione ? 'Non è quella la cosa' : `${AZIONI[azione].fare} adesso non va`
      return { giusto: false, azione, righe: [`Pasticcio! ${qui}.`, `La ricetta dice: ${frase(atteso, this.ingredienti)}. Il pasticcio costa un gettone.`] }
    }
    if (azione === 'metti') { this.mortaio = [...this.mortaio, ...cosa]; return { giusto: true, azione, cosa, versati: cosa, monete: 0, finita: false } }
    if (azione === 'appoggia') { this.tagliere = [...this.tagliere, ...cosa]; return { giusto: true, azione, cosa, versati: cosa, monete: 0, finita: false } }
    if (azione === 'versa' && cosa.length < manca.length) { this.dentro = [...this.dentro, ...cosa]; this.mescolato = false; return { giusto: true, azione, cosa, versati: cosa, monete: 0, finita: false } }
    return this.chiudi(atteso)
  }

  chiudi(p) {
    const r = this.faiPasso(p)
    const monete = this.pasticciato ? 0 : MONETE_A_PASSO
    this.monete += monete
    this.pasticciato = false
    return { ...r, giusto: true, monete }
  }

  // il dito ha cominciato il passo che si aspettava, e l'ha lasciato prima della fine
  comincia(azione, cosa = []) {
    const p = this.passi[this.passo]
    if (p?.azione === azione && (azione === 'gratta' ? p.cosa.includes(cosa[0]) : !this.mancaAl(p).length)) this.iniziato = true
  }

  // quello che il passo aspetta ancora
  mancaAl(p) {
    const gia = p.azione === 'pesta' ? this.mortaio : p.azione === 'sminuzza' ? this.tagliere : p.azione === 'gratta' ? this.grattato : this.dentro
    return p.cosa.filter(i => !gia.includes(i))
  }

  faiPasso(p) {
    const versati = p.cosa.includes(MORTAIO) ? this.mortaio : p.cosa.includes(TAGLIERE) ? this.tagliere : p.cosa.includes(GRATTATO) ? this.grattato : this.mancaAl(p)
    if (p.azione === 'pesta') { this.mortaio = [...p.cosa]; this.pestato = true }
    if (p.azione === 'sminuzza') { this.tagliere = [...p.cosa]; this.tagliato = true }
    if (p.azione === 'gratta') this.grattato = [...p.cosa]
    if (p.azione === 'versa') {
      this.dentro = [...this.dentro, ...versati]
      this.mescolato = false
      if (p.cosa.includes(MORTAIO)) { this.mortaio = []; this.pestato = false }
      if (p.cosa.includes(TAGLIERE)) { this.tagliere = []; this.tagliato = false }
      if (p.cosa.includes(GRATTATO)) this.grattato = []
    }
    if (p.azione === 'mescola') this.mescolato = true
    if (p.azione === 'scalda') this.scaldato = true
    if (p.azione === 'agita') this.incantato = true
    this.passo++
    this.iniziato = false
    this.finita = this.passo >= this.passi.length
    return { azione: p.azione, cosa: [...p.cosa], versati: [...versati], finita: this.finita }
  }

  versaUna(i, k) {
    const g = this.ingredienti[i], o = g.offerte[k]
    const u = g.unita, letto = scrivi(o.base, o.unita)
    const vale = o.unita === u ? letto : `${letto} = ${scrivi(o.base, u)}`
    // col conto scritto sotto la targhetta non si è saputo niente, e dopo un
    // trabocco su questo ingrediente nemmeno (docs/pozioni/regole.md)
    const scritto = ['gioco', 'svolto'].includes(this.tappa.aiuto)
    const chiave = !scritto && !g.traboccate ? chiaveDi(o.unita, u) : null
    const base = { ingrediente: i, ampolla: k, testo: letto, base: o.base, prima: g.messo }
    if (g.messo + o.base > g.dose) {
      this.traboccate++; g.traboccate++
      if (!this.macchie.includes(i)) this.macchie.push(i)
      return { ...base, tipo: 'trabocca', dopo: g.messo, pezzi: [...g.pezzi], annota: chiave && { chiave, giusto: false },
               righe: [`${g.famiglia === 'lunghezza' ? 'Troppo lungo!' : 'Trabocca!'} ${vale} di ${g.nome}.`,
                       g.messo === g.dose
                         ? `Era già arrivato al segno: ${scrivi(g.dose, u)}.`
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

  // il tasto dei grandi (docs/core/comandi.md): l'ingrediente o il passo in
  // corso è fatto e vale le sue monete, ma nessuno l'ha fatto
  salta() {
    if (this.finita || this.macchie.length) return null
    if (this.pronta) {
      this.saltate++
      this.monete += MONETE_A_PASSO
      this.pasticciato = false
      return { ...this.faiPasso(this.passi[this.passo]), monete: MONETE_A_PASSO }
    }
    const i = this.ingredienti.findIndex((_, j) => !this.fatto(j)), g = this.ingredienti[i]
    g.pezzi = [g.dose]; g.messo = g.dose
    this.saltate++
    this.monete += MONETE_A_DOSE
    return { ingrediente: i, monete: MONETE_A_DOSE, finita: false }
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
    const ordini = ordiniMinimi(this.ingredienti)
    return [...this.comprati.map(g => ({
      nome: g.nome, costo: g.ottimo.costo,
      pezzi: g.ottimo.pezzi.map(k => scrivi(g.offerte[k].base, g.offerte[k].unita)),
    })), { nome: 'spedizione', costo: ordini * SPEDIZIONE, pezzi: [ordini === 1 ? 'un ordine solo' : `${ordini} ordini`] }]
  }
}

// Due giocatori finti, per i test e per tarare: chi ordina sempre il
// minimo, e il goloso che prende ogni volta l'ampolla più grande che ci sta.
export function giocaBene(b) {
  const voci = b.ingredienti.flatMap((g, i) => g.ottimo.pezzi.map(k => ({ i, k })))
  for (let n = 0; n < voci.length; n += b.quanteInOrdine) b.ordina(voci.slice(n, n + b.quanteInOrdine))
  return seguiLaRicetta(b)
}
// un passo come dice la ricetta, con tutti i gesti che vuole
export function prossimoPasso(b) {
  const p = b.passi[b.passo]
  if (p.azione === 'sminuzza') { b.fai('appoggia', b.mancaAl(p)); return b.fai('sminuzza') }
  if (p.azione !== 'pesta') return b.fai(p.azione, p.cosa)
  b.fai('metti', b.mancaAl(p))
  return b.fai('pesta')
}
export function seguiLaRicetta(b) {
  while (!b.finita && b.pronta) prossimoPasso(b)
  return b
}
export function giocaGoloso(b) {
  const voci = b.ingredienti.flatMap((g, i) => {
    const sue = []
    for (let messo = g.messo; messo < g.dose;) {
      const k = g.offerte.map((o, k) => k).filter(k => messo + g.offerte[k].base <= g.dose)
        .sort((a, c) => g.offerte[c].base - g.offerte[a].base || g.offerte[a].prezzo - g.offerte[c].prezzo)[0]
      if (k == null) break
      messo += g.offerte[k].base
      sue.push({ i, k })
    }
    return sue
  })
  for (let n = 0; n < voci.length; n += b.quanteInOrdine) b.ordina(voci.slice(n, n + b.quanteInOrdine))
  return seguiLaRicetta(b)
}
