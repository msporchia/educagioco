/* I conti puri: «7 × 8 = ?», senza storia attorno. Quattro tipologie
   (somma, differenza, prodotto, quoziente), ognuna con dieci gradi che dicono
   la grandezza dei numeri: 1 sono le cose dentro il dieci e le tabelline del
   2 e del 10, 10 sono le tre cifre e le tabelline fino al 12. Esiste per chi
   vuole UN conto di UN'operazione a una grandezza precisa (Castle Battle), e
   per questo è `soloSuRichiesta`: nei mazzi generali non entra, lo chiede chi
   lo nomina (`domandaPerGioco({ moduli: ['conti'], tipi: ['prodotto'], grado: 7 })`).
   I falsi sono gli sbagli veri (il riporto perso, il prestito non restituito,
   un gruppo di troppo nella tabellina, la divisione non provata con la
   moltiplicazione); gli altri vengono da `erroriTipici` di data/calcolo.js.
   Niente Math.random: i numeri di data/ops.js non sono ripetibili, qui la
   sorte decide tutto. Prefisso SRS `conti:` (vedi docs/apprendimento/conti.md). */

import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo } from '../nucleo/domanda.js'
import { erroriTipici, senzaPrestito } from '../../data/calcolo.js'

const SCALETTA = [
  'dentro il dieci; ×2 e ×10; metà e :10',
  'dentro il venti senza passare la decina; ×2, ×5, ×10',
  'oltre la decina; le tabelline fino al 5',
  'una cifra e due, senza passaggio; fino al 7',
  'una cifra e due, passando la decina; fino al 9',
  'due cifre con due, senza riporto; le tabelline difficili (6, 7, 8, 9)',
  'due cifre con due, con riporto; le tabelline fino al 12',
  'oltre il cento; due cifre per una, senza riporto',
  'tre cifre; due cifre per una, col riporto',
  'tre cifre con tre; tre cifre per una, due per decine',
]

const TUTTI = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i + 1, 1]))

// la fascia di ogni grado, tipo per tipo (scala 0-100, 4 anni = 0): il quoziente è il più duro perché va a ritroso nella tabellina
const TIPI = [
  { chiave: 'conti:somma', nome: 'Le somme', sa: 'numeri', gradi: TUTTI,
    livello: { 1: 19, 2: 25, 3: 31, 4: 36, 5: 41, 6: 46, 7: 52, 8: 58, 9: 66, 10: 74 } },
  { chiave: 'conti:differenza', nome: 'Le differenze', sa: 'numeri', gradi: TUTTI,
    livello: { 1: 21, 2: 28, 3: 34, 4: 40, 5: 45, 6: 51, 7: 57, 8: 63, 9: 70, 10: 78 } },
  { chiave: 'conti:prodotto', nome: 'I prodotti e le tabelline', sa: 'moltiplicazioni', gradi: TUTTI,
    livello: { 1: 26, 2: 32, 3: 38, 4: 44, 5: 50, 6: 57, 7: 62, 8: 66, 9: 72, 10: 80 } },
  { chiave: 'conti:quoziente', nome: 'I quozienti e le divisioni esatte', sa: 'divisioni', gradi: TUTTI,
    livello: { 1: 32, 2: 38, 3: 44, 4: 50, 5: 56, 6: 63, 7: 68, 8: 72, 9: 78, 10: 85 } },
]

const media = g => Math.round(TIPI.reduce((s, t) => s + t.livello[g], 0) / TIPI.length)

// quante volte il conto passa la decina (o la centina) da una colonna all'altra
function riporti(a, b) {
  let r = 0, quanti = 0
  for (let x = a, y = b; x > 0 || y > 0; x = Math.floor(x / 10), y = Math.floor(y / 10)) {
    const s = (x % 10) + (y % 10) + r
    r = s >= 10 ? 1 : 0
    quanti += r
  }
  return quanti
}

function prestiti(a, b) {
  let p = 0, quanti = 0
  for (let x = a, y = b; x > 0 || y > 0; x = Math.floor(x / 10), y = Math.floor(y / 10)) {
    const sopra = (x % 10) - p
    p = sopra < (y % 10) ? 1 : 0
    quanti += p
  }
  return quanti
}

// i pezzi di un numero per posto: 457 → [400, 50, 7], senza gli zeri
const pezzi = n => String(n).split('')
  .map((c, i, tutte) => Number(c) * 10 ** (tutte.length - 1 - i)).filter(p => p > 0)

// ripete finché la condizione non regge, poi tiene l'ultimo (stessa scelta di ops.js: un conto buono è sempre meglio di nessuno)
function finoA(prova, vale, tentativi = 200) {
  let x = prova()
  for (let i = 0; i < tentativi && !vale(x); i++) x = prova()
  return x
}

/* i falsi: a ondate (tier), dal più istruttivo al più generico. Ne esce sempre
   `quanti`: dagli errori veri del grado, poi ±1 e ±2, poi gli errori tipici
   del calcolo a mente, infine i vicini. Mai negativi, mai il risultato, mai
   fuori dal mondo del risultato (un 7 accanto a un 650 non lo tocca nessuno): a più di sei di distanza o del 60%. */
function scegliFalsi(sorte, ris, ondate, quanti = 3) {
  const visti = new Set([ris])
  const raggio = Math.max(6, ris * 0.6)
  const credibile = v => Math.abs(v - ris) <= raggio
  const buoni = ondata => {
    const out = []
    for (const [v, perche] of ondata) {
      if (!Number.isInteger(v) || v < 1 || visti.has(v) || !credibile(v)) continue
      visti.add(v)
      out.push(testo(v, perche))
    }
    return out
  }
  // due errori veri al massimo: gli altri posti sono per i vicini, se no sarebbe sempre uno scarto a occhio
  const veri = buoni(sorte.mescola(ondate[0]))
  const resto = []
  for (const ondata of ondate.slice(1)) resto.push(...buoni(sorte.mescola(ondata)))
  const prima = veri.slice(0, 2)
  const altri = [...veri.slice(2), ...resto]
  return [...prima, ...altri].slice(0, quanti)
}

const vicini = ris => [
  [ris + 1, 'sei fuori di uno: ricontalo con calma'],
  [ris - 1, 'sei fuori di uno: ricontalo con calma'],
  [ris + 2, 'sei fuori di due: ricontalo con calma'],
  [ris - 2, 'sei fuori di due: ricontalo con calma'],
]

const intorno = ris => {
  const out = []
  for (let d = 3; d <= 12; d++) out.push([ris + d, `ti sei sbagliato di ${d}: rifai il conto`],
    [ris - d, `ti sei sbagliato di ${d}: rifai il conto`])
  return out
}

// gli errori tipici di data/calcolo.js, con una frase che vale per tutti
const dalCalcolo = (a, segno, b, ris) =>
  erroriTipici({ a, b, segno, ris }).map(v => [v, 'è un errore che capita: rifai il conto con il metodo'])

/* ══════════════ le somme ══════════════ */

function numeriSomma(grado, sorte) {
  switch (grado) {
    case 1: { const a = sorte.fra(1, 9); return [a, sorte.fra(1, 10 - a)] }
    case 2: { // entro il venti senza passare la decina
      const a = sorte.fra(11, 18)
      const b = sorte.fra(1, 9 - (a - 10))
      return sorte.forse(0.4) ? [b, a] : [a, b]
    }
    case 3: { const a = sorte.fra(3, 9); return [a, sorte.fra(11 - a, 9)] } // passa la decina
    case 4: { // due cifre più una senza passare, o decine tonde
      if (sorte.forse(0.35)) return [10 * sorte.fra(1, 5), 10 * sorte.fra(1, 4)]
      const a = 10 * sorte.fra(1, 8) + sorte.fra(1, 8)
      return [a, sorte.fra(1, 9 - (a % 10))]
    }
    case 5: { const u = sorte.fra(2, 9); return [10 * sorte.fra(1, 8) + u, sorte.fra(10 - u, 9)] }
    case 6: { // due più due senza riporto
      const u1 = sorte.fra(1, 8), t1 = sorte.fra(1, 7)
      return [10 * t1 + u1, 10 * sorte.fra(1, 9 - t1) + sorte.fra(1, 9 - u1)]
    }
    case 7: { // riporto sulle unità, il totale resta sotto il cento
      const u1 = sorte.fra(2, 9), t1 = sorte.fra(1, 7)
      return [10 * t1 + u1, 10 * sorte.fra(1, 8 - t1) + sorte.fra(10 - u1, 9)]
    }
    case 8: { // sopra il cento: due più due che lo passano, o tre cifre più decine tonde
      if (sorte.forse(0.5)) return [sorte.fra(100, 899), 10 * sorte.fra(1, 9)]
      return finoA(() => [sorte.fra(41, 99), sorte.fra(41, 99)], ([a, b]) => a + b >= 100)
    }
    case 9: return finoA(() => [sorte.fra(100, 899), sorte.fra(11, 99)], ([a, b]) => riporti(a, b) >= 1)
    default: return finoA(() => [sorte.fra(101, 899), sorte.fra(101, 899)], ([a, b]) => riporti(a, b) >= 2)
  }
}

function aiutoSomma(grado, a, b, ris) {
  const u = a % 10
  switch (grado) {
    case 1: return `${a} + ${b}: parti da ${a} e conta avanti di ${b}: arrivi a ${ris}`
    case 2: {
      const [grande, piccolo] = a >= 10 ? [a, b] : [b, a]
      return `${grande} è 10 e ${grande - 10}: ${grande - 10} + ${piccolo} fa ${grande - 10 + piccolo}, e con il 10 fa ${ris}`
    }
    case 3: {
      const [grande, piccolo] = a >= b ? [a, b] : [b, a]
      return `${grande} + ${piccolo}: da ${grande} a 10 mancano ${10 - grande}; li prendi da ${piccolo} e ne restano ${piccolo - (10 - grande)}: 10 + ${piccolo - (10 - grande)} = ${ris}`
    }
    case 4: return a % 10 === 0 && b % 10 === 0
      ? `${a / 10} decine + ${b / 10} decine = ${ris / 10} decine, cioè ${ris}`
      : `${a} + ${b}: le unità, ${u} + ${b}, fanno ${u + b}; le decine restano, e viene ${ris}`
    case 5: return `${a} + ${b}: da ${a} a ${a + 10 - u} mancano ${10 - u}; poi ne restano ${b - (10 - u)} da aggiungere → ${ris}`
    default: {
      const parti = pezzi(b)
      let corrente = a
      const passi = parti.map(p => { const da = corrente; corrente += p; return `${da} + ${p} = ${corrente}` })
      return passi.join(', poi ')
    }
  }
}

function falsiSomma(sorte, grado, a, b, ris) {
  const vero = []
  if ((a % 10) + (b % 10) >= 10) {
    vero.push([ris - 10, 'hai dimenticato il riporto: quando le unità fanno 10 o più, una decina passa alle decine'])
    vero.push([ris + 10, 'il riporto l\'hai messo due volte'])
  }
  if ((a % 100) + (b % 100) >= 100)
    vero.push([ris - 100, 'le centinaia: il riporto delle decine non l\'hai aggiunto'])
  if (a !== b) vero.push([Math.abs(a - b), 'hai tolto invece di aggiungere'])
  return scegliFalsi(sorte, ris, [vero, vicini(ris), dalCalcolo(a, '+', b, ris), intorno(ris)])
}

/* ══════════════ le differenze ══════════════ */

function numeriDifferenza(grado, sorte) {
  switch (grado) {
    case 1: { const a = sorte.fra(2, 10); return [a, sorte.fra(1, a - 1)] }
    case 2: { const a = sorte.fra(11, 19); return [a, sorte.fra(1, a - 10)] }
    case 3: { const a = sorte.fra(11, 18); return [a, sorte.fra(a - 9, 9)] } // passa la decina all'indietro
    case 4: { // due cifre meno una senza prestito, o decine tonde
      if (sorte.forse(0.35)) { const a = 10 * sorte.fra(3, 9); return [a, 10 * sorte.fra(1, a / 10 - 1)] }
      const a = 10 * sorte.fra(1, 9) + sorte.fra(1, 9)
      return [a, sorte.fra(1, a % 10)]
    }
    case 5: { const u = sorte.fra(0, 8); return [10 * sorte.fra(2, 9) + u, sorte.fra(u + 1, 9)] }
    case 6: { // due meno due senza prestito
      return finoA(() => {
        const t1 = sorte.fra(2, 9), u1 = sorte.fra(0, 9)
        return [10 * t1 + u1, 10 * sorte.fra(1, t1) + sorte.fra(0, u1)]
      }, ([a, b]) => a > b)
    }
    case 7: { // due meno due col prestito
      const t1 = sorte.fra(3, 9), u1 = sorte.fra(0, 8)
      return [10 * t1 + u1, 10 * sorte.fra(1, t1 - 1) + sorte.fra(u1 + 1, 9)]
    }
    case 8: return [sorte.fra(120, 999), sorte.fra(11, 99)]
    case 9: return finoA(() => { const a = sorte.fra(200, 999); return [a, sorte.fra(101, a - 1)] },
      ([a, b]) => prestiti(a, b) === 1)
    default: return finoA(() => { const a = sorte.fra(201, 999); return [a, sorte.fra(101, a - 1)] },
      ([a, b]) => prestiti(a, b) >= 2)
  }
}

function aiutoDifferenza(grado, a, b, ris) {
  const u = a % 10
  switch (grado) {
    case 1: return `${a} − ${b}: parti da ${a} e torna indietro di ${b}: arrivi a ${ris}`
    case 2: return `${a} è 10 e ${u}: ${u} − ${b} fa ${u - b}, e con il 10 fa ${ris}`
    case 3: return `${a} − ${b}: prima togli ${u} e arrivi a 10, poi altri ${b - u} → ${ris}`
    case 4: return a % 10 === 0 && b % 10 === 0
      ? `${a / 10} decine − ${b / 10} decine = ${ris / 10} decine, cioè ${ris}`
      : `${a} − ${b}: le unità, ${u} − ${b}, fanno ${u - b}; le decine restano, e viene ${ris}`
    case 5: return u === 0
      ? `${a} − ${b} = ${a} − 10 + ${10 - b}: togli una decina intera e ne rendi ${10 - b} → ${ris}`
      : `${a} − ${b}: prima togli ${u} e arrivi a ${a - u}, poi altri ${b - u} → ${ris}`
    default: {
      let corrente = a
      return pezzi(b).map(p => { const da = corrente; corrente -= p; return `${da} − ${p} = ${corrente}` }).join(', poi ')
    }
  }
}

function falsiDifferenza(sorte, grado, a, b, ris) {
  const vero = []
  if (grado >= 3 && prestiti(a, b) > 0) {
    vero.push([senzaPrestito(a, b), 'hai tolto la cifra piccola dalla grande, pezzo per pezzo: ma sopra le unità sono meno, e togliendole si scende sotto la decina'])
    vero.push([ris + 10, 'togliendo le unità sei sceso sotto la decina, ma la decina di prima l\'hai tenuta'])
    vero.push([ris - 10, 'hai tolto una decina di troppo'])
  }
  if (a % 100 < b % 100)
    vero.push([ris + 100, 'le centinaia: il prestito dalle decine non l\'hai tolto'])
  vero.push([a + b, 'hai sommato invece di togliere'])
  return scegliFalsi(sorte, ris, [vero, vicini(ris), dalCalcolo(a, '−', b, ris), intorno(ris)])
}

/* ══════════════ i prodotti ══════════════ */

function numeriProdotto(grado, sorte) {
  const invertiti = (a, b) => (sorte.forse(0.5) ? [a, b] : [b, a])
  switch (grado) {
    case 1: return invertiti(sorte.fra(2, 10), sorte.uno([2, 10]))
    case 2: return invertiti(sorte.fra(2, 10), sorte.uno([2, 5, 10]))
    case 3: return invertiti(sorte.fra(2, 10), sorte.uno([3, 4, 3, 4, 2, 5]))
    case 4: return invertiti(sorte.fra(2, 10), sorte.uno([6, 7, 4, 3, 5, 6, 7]))
    case 5: return invertiti(sorte.fra(2, 10), sorte.uno([6, 7, 8, 9, 6, 7, 8, 9, 4]))
    case 6: return [sorte.fra(6, 9), sorte.fra(6, 10)]
    case 7: return sorte.forse(0.6) ? invertiti(sorte.fra(3, 12), sorte.uno([11, 12])) : [sorte.fra(6, 12), sorte.fra(6, 12)]
    case 8: { // due cifre per una, nessuna colonna supera il nove
      const m = sorte.fra(2, 4), alto = Math.floor(9 / m)
      return [10 * sorte.fra(1, alto) + sorte.fra(0, alto), m]
    }
    case 9: { // col riporto, o decine tonde
      if (sorte.forse(0.3)) return [10 * sorte.fra(2, 9), sorte.fra(3, 9)]
      return finoA(() => [sorte.fra(12, 49), sorte.fra(3, 9)], ([a, m]) => (a % 10) * m >= 10)
    }
    default: return sorte.forse(0.6) ? [sorte.fra(105, 499), sorte.fra(2, 8)] : [sorte.fra(12, 25), 10 * sorte.fra(2, 4)]
  }
}

// il metodo per UNA coppia (a, b): la tabellina si ricava da quelle vicine, il numero grande si scompone
function aiutoProdotto(grado, a, b, ris) {
  if (grado >= 8) {
    if (b % 10 === 0 && a < 100) return `${a} × ${b / 10} fa ${a * b / 10}, poi un altro zero: ${ris}`
    if (a % 10 === 0) return `${a / 10} × ${b} fa ${a * b / 10}, poi uno zero: ${ris}`
    const parti = pezzi(a)
    return `${a} × ${b} = ` + parti.map(p => `${p} × ${b}`).join(' + ') + ' = ' +
      parti.map(p => p * b).join(' + ') + ` = ${ris}`
  }
  const [piccolo, grande] = a <= b ? [a, b] : [b, a]
  if (piccolo === 10) return `${grande} × 10: basta mettere uno zero dopo ${grande} → ${ris}`
  if (piccolo === 2) return `${grande} × 2 è il doppio: ${grande} + ${grande} = ${ris}`
  if (piccolo === 5) return `${grande} × 5 è la metà di ${grande} × 10: ${grande * 10}, e la metà fa ${ris}`
  if (piccolo === 3) return `${grande} × 3 = ${grande} × 2 + ${grande} = ${grande * 2} + ${grande} = ${ris}`
  if (piccolo === 4) return `${grande} × 4 è il doppio del doppio: ${grande * 2}, e il doppio fa ${ris}`
  if (grande === 9) return `${piccolo} × 9 = ${piccolo} × 10 − ${piccolo} = ${piccolo * 10} − ${piccolo} = ${ris}`
  if (grande === 11) return `${piccolo} × 11 = ${piccolo} × 10 + ${piccolo} = ${piccolo * 10} + ${piccolo} = ${ris}`
  if (grande === 12) return `${piccolo} × 12 = ${piccolo} × 10 + ${piccolo} × 2 = ${piccolo * 10} + ${piccolo * 2} = ${ris}`
  return `${piccolo} × ${grande} = ${piccolo} × ${grande - 1} + ${piccolo} = ${piccolo * (grande - 1)} + ${piccolo} = ${ris}`
}

function falsiProdotto(sorte, grado, a, b, ris) {
  const vero = []
  if (grado <= 7) {
    // la tabellina vicina: ognuno di questi è un fatto vero, ma di un'altra riga
    vero.push([ris + a, `${ris + a} è ${a} × ${b + 1}: un gruppo di troppo`])
    vero.push([ris - a, `${ris - a} è ${a} × ${b - 1}: un gruppo in meno`])
    vero.push([ris + b, `${ris + b} è ${a + 1} × ${b}: un gruppo di troppo`])
    vero.push([ris - b, `${ris - b} è ${a - 1} × ${b}: un gruppo in meno`])
  } else {
    const riporto = Math.floor((a % 10) * b / 10)
    if (riporto) vero.push([ris - 10 * riporto, 'hai dimenticato il riporto delle unità'])
    vero.push([ris + 10, 'una decina di troppo: rifai le colonne'])
    vero.push([ris - 10, 'una decina di meno: rifai le colonne'])
    if (grado >= 10) vero.push([ris - 100, 'le centinaia: il riporto delle decine non l\'hai aggiunto'])
    vero.push([ris + a, `con ${ris + a} hai contato un gruppo di ${a} in più`])
    vero.push([ris - a, `con ${ris - a} hai contato un gruppo di ${a} in meno`])
  }
  vero.push([a + b, 'hai sommato invece di moltiplicare'])
  if (ris % 10 === 0) vero.push([ris / 10, 'uno zero di meno'], [ris * 10, 'uno zero di troppo'])
  return scegliFalsi(sorte, ris, [vero, vicini(ris), dalCalcolo(a, '×', b, ris), intorno(ris)])
}

/* ══════════════ i quozienti ══════════════ */

// si costruisce dal quoziente e dal divisore, così la divisione è sempre esatta: [dividendo, divisore]
function numeriQuoziente(grado, sorte) {
  const da = (d, q) => [d * q, d]
  switch (grado) {
    case 1: return da(sorte.uno([2, 2, 10]), sorte.fra(2, 10))
    case 2: return da(sorte.uno([2, 5, 10]), sorte.fra(2, 10))
    case 3: return da(sorte.uno([2, 3, 4, 5, 3, 4]), sorte.fra(2, 10))
    case 4: return da(sorte.uno([6, 7, 4, 3, 6, 7]), sorte.fra(2, 10))
    case 5: return da(sorte.uno([6, 7, 8, 9, 6, 7, 8, 9, 4]), sorte.fra(2, 10))
    case 6: return da(sorte.fra(6, 9), sorte.fra(6, 10))
    case 7: return sorte.forse(0.6) ? da(sorte.uno([11, 12]), sorte.fra(3, 12)) : da(sorte.fra(6, 12), sorte.uno([11, 12, 8, 9]))
    case 8: { const d = sorte.fra(2, 5); return da(d, sorte.fra(10, Math.floor(99 / d))) }
    case 9: { const d = sorte.fra(2, 5); return da(d, sorte.fra(Math.ceil(100 / d), Math.floor(450 / d))) }
    default: { const d = sorte.fra(3, 9); return da(d, sorte.fra(Math.ceil(100 / d), Math.floor(999 / d))) }
  }
}

function aiutoQuoziente(grado, a, d, ris) {
  const decine = ris - (ris % 10), unita = ris % 10
  if (grado >= 8 && decine > 0 && unita > 0)
    return `${a} : ${d}: ${d * decine} : ${d} = ${decine}, poi ${d * unita} : ${d} = ${unita}; ${decine} + ${unita} = ${ris}`
  return `${a} : ${d} = ${ris} perché ${d} × ${ris} = ${a}`
}

function falsiQuoziente(sorte, grado, a, d, ris) {
  // ogni falso si smaschera con la prova: d per quel numero non fa a
  const prova = v => `${d} × ${v} fa ${d * v}, non ${a}: la divisione si controlla con la moltiplicazione`
  const vero = [[ris + 1, prova(ris + 1)], [ris - 1, prova(ris - 1)]]
  if (ris >= 10) {
    vero.push([ris + 10, prova(ris + 10)], [ris - 10, prova(ris - 10)])
    const girato = Number(String(ris).split('').reverse().join(''))
    vero.push([girato, prova(girato)])
  }
  vero.push([a - d, 'hai tolto invece di dividere: dividere è chiedersi quante volte ci sta'])
  vero.push([ris + d, prova(ris + d)], [ris - d, prova(ris - d)])
  const vicinoConProva = ris2 => vicini(ris2).map(([v]) => [v, prova(v)])
  const intornoConProva = ris2 => intorno(ris2).map(([v]) => [v, prova(v)])
  return scegliFalsi(sorte, ris, [vero, vicinoConProva(ris), intornoConProva(ris)])
}

/* ══════════════ il modulo ══════════════ */

// una famiglia per tipologia: i numeri del grado, il risultato, il metodo, i falsi
const FAMIGLIE = {
  somma: { segno: '+', numeri: numeriSomma, vale: (a, b) => a + b, aiuto: aiutoSomma, falsi: falsiSomma },
  differenza: { segno: '−', numeri: numeriDifferenza, vale: (a, b) => a - b, aiuto: aiutoDifferenza, falsi: falsiDifferenza },
  prodotto: { segno: '×', numeri: numeriProdotto, vale: (a, b) => a * b, aiuto: aiutoProdotto, falsi: falsiProdotto },
  quoziente: { segno: ':', numeri: numeriQuoziente, vale: (a, b) => a / b, aiuto: aiutoQuoziente, falsi: falsiQuoziente },
}

class ContiPuri extends Modulo {
  constructor() {
    super({
      id: 'conti',
      nome: 'Conti puri',
      icona: '🧮',
      materia: 'matematica',
      chiaro: 'fare un conto di una sola operazione, senza storie: somme, differenze, tabelline e divisioni, dal dieci alle tre cifre',
      scaletta: SCALETTA,
      livelli: Array.from({ length: SCALETTA.length }, (_, i) => media(i + 1)),
      tipi: TIPI,
      soloSuRichiesta: true,
    })
  }

  genera(grado, sorte, tipo) {
    const chiave = tipo || sorte.uno(TIPI).chiave
    const f = FAMIGLIE[chiave.slice('conti:'.length)]
    const g = Math.max(1, Math.min(this.gradi, Math.round(grado || 1)))
    const [a, b] = f.numeri(g, sorte)
    const ris = f.vale(a, b)
    return domanda({
      testo: `${a} ${f.segno} ${b} = ?`,
      buona: testo(ris),
      falsi: f.falsi(sorte, g, a, b, ris),
      chiave,
      aiuto: f.aiuto(g, a, b, ris),
      sorte,
    })
  }
}

export default new ContiPuri()
