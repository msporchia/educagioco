// leggere le lancette e contare il tempo che passa. Due modi: leggere l'ora, e dire che ora sarà fra un po' (un terzo, indovinare il quadrante fra quattro piccoli, è stato scartato: 8:29 e 8:34 non si distinguono a quella scala). Il quadrante sta sempre nel soggetto, grande. I falsi sono gli errori veri delle lancette: scambiate, minuti letti come tacca, un'ora avanti o indietro.
import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo, scena } from '../nucleo/domanda.js'
import { PITTORI_OROLOGIO } from '../grafica/pittori/orologio.js'

const scritta = (o, m) => `${o === 0 ? 12 : o}:${String(m).padStart(2, '0')}`

// i minuti ammessi a ogni grado, e come si chiama quel passo
const SCALETTA = [
  { dice: 'le ore intere', minuti: [0], salto: [60] },
  { dice: 'le mezze ore', minuti: [0, 30], salto: [30, 60] },
  { dice: 'i quarti d\'ora', minuti: [0, 15, 30, 45], salto: [15, 30] },
  { dice: 'i cinque minuti', minuti: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55], salto: [5, 10, 20] },
  { dice: 'i minuti spicci e le durate', minuti: null, salto: [7, 12, 25, 40] },
]

// la chiave dipende da dove finisce la lancetta lunga: qui il verso contrario, dato il tipo quali minuti lo producono
const MINUTI_DI = {
  'ora:intere': m => m === 0,
  'ora:quarti': m => m !== 0 && m % 15 === 0,
  'ora:minuti': m => m % 15 !== 0,
}

// tutte dichiarano lo stesso sapere `orologio`: il dettaglio serve a fermarsi a metà (chi sa le mezze ma si perde sui minuti spicci spegne solo quelli)
const TIPI = [
  { chiave: 'ora:intere', nome: 'Le ore intere', sa: 'orologio',
    gradi: { 1: 1, 2: 0.54, 3: 0.25 } },
  { chiave: 'ora:quarti', nome: "Le mezze e i quarti d'ora", sa: 'orologio',
    gradi: { 2: 0.46, 3: 0.75, 4: 0.15, 5: 0.05 } },
  { chiave: 'ora:minuti', nome: 'I minuti', sa: 'orologio',
    gradi: { 4: 0.46, 5: 0.62 } },
  { chiave: 'ora:durata', nome: "Che ora sarà fra un po'", sa: 'orologio',
    gradi: { 4: 0.39, 5: 0.33 } },
]

const numeriDel = grado => grado <= 4 ? true : 'quarti'

// se l'incrocio grado×tipo è vuoto, si torna ai minuti del grado: meglio la chiave sbagliata che nessuna domanda
function minutiPer(passo, tipo, sorte) {
  const tutti = passo.minuti || Array.from({ length: 60 }, (_, i) => i)
  const filtro = MINUTI_DI[tipo]
  const buoni = filtro ? tutti.filter(filtro) : tutti
  return sorte.uno(buoni.length ? buoni : tutti)
}

// l'aiuto insegna il pezzo che manca (un numero del quadrante vale 5 minuti), non «lancetta corta=ora» che chi è ai minuti spicci sa già
function comeSiLegge(minuti) {
  if (minuti === 0) return 'la lancetta corta è l\'ora, quella lunga rossa sono i minuti'
  const tacca = minuti / 5
  if (Number.isInteger(tacca))
    return 'ogni numero del quadrante vale 5 minuti: la lancetta lunga è arrivata a '
         + `${tacca}, e ${tacca} × 5 fa ${minuti}`
  const numero = Math.floor(tacca)
  if (numero === 0)
    return 'le tacchette piccole valgono un minuto l\'una: la lancetta lunga ha passato '
         + `il 12 di ${minuti} ${minuti === 1 ? 'tacchetta' : 'tacchette'}`
  return 'ogni numero del quadrante vale 5 minuti e ogni tacchetta 1: arrivata a '
       + `${numero} sono ${numero * 5}, più ${minuti - numero * 5} fa ${minuti}`
}

// errori tipici come coppie ore-minuti, diverse dalla giusta e fra loro
function sbagli(ore, minuti, sorte) {
  const dodici = o => ((o % 12) + 12) % 12
  const proposte = [
    [dodici(Math.round(minuti / 5)), (ore % 12) * 5],      // lancette scambiate
    [ore, Math.round(minuti / 5)],                          // minuti letti come tacca
    [dodici(ore + 1), minuti],                              // un'ora avanti
    [ore, (minuti + 5) % 60],                               // cinque minuti di là
    [dodici(ore - 1), minuti],                              // un'ora indietro
    [ore, (minuti + 30) % 60],                              // mezz'ora di là
  ]
  // confronto sulla scritta, non sui numeri: 0:00 e 12:00 sono numeri diversi ma la stessa risposta
  const viste = new Set([scritta(ore, minuti)])
  const buoni = []
  for (const [o, m] of proposte) {
    const k = scritta(o, m)
    if (viste.has(k)) continue
    viste.add(k)
    buoni.push([o, m])
  }
  return sorte.mescola(buoni)
}

class Orologio extends Modulo {
  constructor() {
    super({
      id: 'orologio',
      nome: 'Orologio',
      icona: '🕰️',
      materia: 'tempo',
      chiaro: 'leggere le lancette e contare quanto manca',
      scaletta: SCALETTA.map(s => s.dice),
      livelli: [25, 38, 44, 56, 75], // scala 0-100 comune a tutte le materie, 12,5 punti per anno (vedi docs/apprendimento/quiz-livelli.md)
      tipi: TIPI,
      pittori: PITTORI_OROLOGIO,
    })
  }

  genera(grado, sorte, tipo) {
    const passo = SCALETTA[grado - 1]
    const ore = sorte.fra(1, 12)
    const minuti = minutiPer(passo, tipo, sorte)
    if (tipo === 'ora:durata') return this.dopo(passo, ore, minuti, sorte)
    return this.leggi(grado, ore, minuti, sorte)
  }

  leggi(grado, ore, minuti, sorte) { // guarda il quadrante, scegli l'ora
    const falsi = sbagli(ore, minuti, sorte).slice(0, 3)
    return domanda({
      testo: 'Che ora segna?',
      soggetto: scena({ che: 'orologio', ore, minuti, numeri: numeriDel(grado) }),
      buona: testo(scritta(ore, minuti)),
      falsi: falsi.map(([o, m]) => testo(scritta(o, m), 'la lancetta corta dice le ore, quella lunga i minuti')),
      chiave: minuti === 0 ? 'ora:intere' : minuti % 15 === 0 ? 'ora:quarti' : 'ora:minuti',
      aiuto: comeSiLegge(minuti),
      sorte,
    })
  }

  dopo(passo, ore, minuti, sorte) { // che ora sarà fra un po'
    const salto = sorte.uno(passo.salto)
    const tot = (ore % 12) * 60 + minuti + salto
    const o2 = Math.floor(tot / 60) % 12 || 12
    const m2 = tot % 60
    const falsi = [
      [ore, m2],                                   // scordarsi l'ora che gira
      [o2, (m2 + 10) % 60],                        // conto sballato di dieci
      [(o2 % 12) + 1, m2],                         // un'ora di troppo
    ].filter(([o, m]) => scritta(o, m) !== scritta(o2, m2))
    return domanda({
      testo: `Che ora sarà fra ${salto} minuti?`,
      soggetto: scena({ che: 'orologio', ore, minuti, numeri: true }),
      buona: testo(scritta(o2, m2)),
      falsi: sorte.mescola(falsi).slice(0, 3).map(([o, m]) =>
        testo(scritta(o, m), 'dopo il 60 i minuti ripartono da zero e l\'ora avanza')),
      chiave: 'ora:durata',
      aiuto: 'arriva prima all\'ora tonda, poi conta quello che avanza',
      sorte,
    })
  }
}

export default new Orologio()
