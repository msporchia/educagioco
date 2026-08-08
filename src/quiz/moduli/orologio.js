/* ═══════════════════════════════════════════════════════════════════
   OROLOGIO — leggere le lancette, e contare il tempo che passa.

   È infinito per costruzione (144 posizioni solo coi cinque minuti,
   moltiplicate per le durate) ed è una di quelle cose che il digitale
   ha smesso di insegnare: un bambino che legge 15:47 sul telefono non
   sa dire quanto manca alle quattro.

   TRE MODI DI CHIEDERE la stessa ora, e cambiano di molto la fatica:
     · guarda il quadrante, scegli l'ora scritta in cifre;
     · leggi l'ora in cifre, scegli il quadrante giusto fra quattro;
     · guarda il quadrante e dì che ora sarà fra un po'.

   I FALSI SONO GLI ERRORI DELLE LANCETTE: le due scambiate (le 3:30
   lette come le 6:15), i minuti letti come numero della tacca (il 5
   invece del 25), l'ora avanti di uno quando la lancetta corta è già
   oltre la metà. Un'ora presa a caso si scarterebbe a occhio.
   ═══════════════════════════════════════════════════════════════════ */

import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo, scena } from '../nucleo/domanda.js'
import { PITTORI_OROLOGIO } from '../grafica/pittori/orologio.js'

const scritta = (o, m) => `${o === 0 ? 12 : o}:${String(m).padStart(2, '0')}`

/* i minuti ammessi a ogni grado, e come si chiama quel passo */
const SCALETTA = [
  { dice: 'le ore intere', minuti: [0], salto: [60] },
  { dice: 'le mezze ore', minuti: [0, 30], salto: [30, 60] },
  { dice: 'i quarti d\'ora', minuti: [0, 15, 30, 45], salto: [15, 30] },
  { dice: 'i cinque minuti', minuti: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55], salto: [5, 10, 20] },
  { dice: 'i minuti spicci e le durate', minuti: null, salto: [7, 12, 25, 40] },
]

/* i minuti che fanno una tipologia: la chiave non dipende dal grado ma
   da DOVE finisce la lancetta lunga, e questa tabella è il verso
   contrario — dato il tipo, quali minuti lo producono, intersecati con
   quelli che il grado ammette. */
const MINUTI_DI = {
  'ora:intere': m => m === 0,
  'ora:quarti': m => m !== 0 && m % 15 === 0,
  'ora:minuti': m => m % 15 !== 0,
}

/* Le tipologie. Tutte danno per scontata la stessa cosa — che le
   lancette si sappiano leggere — e infatti dichiarano tutte
   `orologio`: qui il dettaglio non serve a togliere un pezzo di scuola
   che manca, serve a fermarsi a metà strada. C'è chi legge le ore e le
   mezze e si perde sui minuti spicci, e a quel bambino si spengono i
   minuti lasciandogli i quarti.
   I pesi ricalcano i minuti ammessi da ogni grado: al grado 1 esistono
   solo le ore intere, al 5 quasi solo i minuti veri. */
const TIPI = [
  { chiave: 'ora:intere', nome: 'Le ore intere', sa: 'orologio',
    gradi: { 1: 1, 2: 0.54, 3: 0.19 } },
  { chiave: 'ora:quarti', nome: "Le mezze e i quarti d'ora", sa: 'orologio',
    gradi: { 2: 0.46, 3: 0.5, 4: 0.1, 5: 0.03 } },
  { chiave: 'ora:minuti', nome: 'I minuti', sa: 'orologio',
    gradi: { 4: 0.32, 5: 0.4 } },
  { chiave: 'ora:riconosci', nome: "Trovare l'orologio che segna un'ora", sa: 'orologio',
    gradi: { 3: 0.31, 4: 0.31, 5: 0.35 } },
  { chiave: 'ora:durata', nome: "Che ora sarà fra un po'", sa: 'orologio',
    gradi: { 4: 0.27, 5: 0.22 } },
]

/* i minuti buoni per quel tipo, fra quelli che il grado ammette. Se
   l'incrocio è vuoto — non capita, ma un grado nuovo potrebbe farlo — si
   torna a quelli del grado: meglio una domanda con la chiave di un'altra
   tipologia che nessuna domanda. */
function minutiPer(passo, tipo, sorte) {
  const tutti = passo.minuti || Array.from({ length: 60 }, (_, i) => i)
  const filtro = MINUTI_DI[tipo]
  const buoni = filtro ? tutti.filter(filtro) : tutti
  return sorte.uno(buoni.length ? buoni : tutti)
}

/* Gli errori tipici, come ore-minuti. Restituisce coppie diverse dalla
   giusta e fra loro: qui sta il valore del modulo, non nel disegno. */
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
  /* il confronto si fa sulla scritta, non sui numeri: le 0:00 e le
     12:00 sono numeri diversi e la stessa risposta */
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
      /* le lancette o si sanno leggere o no: non c'è un grado facile
         che si salvi, nemmeno le ore intere */
      tipi: TIPI,
      pittori: PITTORI_OROLOGIO,
    })
  }

  genera(grado, sorte, tipo) {
    const passo = SCALETTA[grado - 1]
    const ore = sorte.fra(1, 12)
    const minuti = minutiPer(passo, tipo, sorte)
    if (tipo === 'ora:riconosci') return this.quale(grado, ore, minuti, sorte)
    if (tipo === 'ora:durata') return this.dopo(passo, ore, minuti, sorte)
    return this.leggi(grado, ore, minuti, sorte)
  }

  /* guarda il quadrante, scegli l'ora */
  leggi(grado, ore, minuti, sorte) {
    const falsi = sbagli(ore, minuti, sorte).slice(0, 3)
    return domanda({
      testo: 'Che ora segna?',
      soggetto: scena({ che: 'orologio', ore, minuti, numeri: grado <= 3 }),
      buona: testo(scritta(ore, minuti)),
      falsi: falsi.map(([o, m]) => testo(scritta(o, m), 'la lancetta corta dice le ore, quella lunga i minuti')),
      chiave: minuti === 0 ? 'ora:intere' : minuti % 15 === 0 ? 'ora:quarti' : 'ora:minuti',
      aiuto: 'la lancetta corta è l\'ora, quella lunga rossa sono i minuti',
      sorte,
    })
  }

  /* leggi l'ora scritta, scegli il quadrante */
  quale(grado, ore, minuti, sorte) {
    const falsi = sbagli(ore, minuti, sorte).slice(0, 3)
    return domanda({
      testo: `Quale orologio segna le ${scritta(ore, minuti)}?`,
      buona: scena({ che: 'orologio', ore, minuti, numeri: grado <= 3 }),
      falsi: falsi.map(([o, m]) => scena({ che: 'orologio', ore: o, minuti: m, numeri: grado <= 3 })),
      chiave: 'ora:riconosci',
      aiuto: 'guarda prima dov\'è la lancetta corta',
      sorte,
    })
  }

  /* che ora sarà fra un po' */
  dopo(passo, ore, minuti, sorte) {
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
