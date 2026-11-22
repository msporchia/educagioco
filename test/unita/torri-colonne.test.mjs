/* ═══════════════════════════════════════════════════════════════════
   LE OPERAZIONI IN COLONNA DEL CASTELLO, SENZA BROWSER

   I generatori di `data/ops.js`: ogni operazione torna (il risultato
   letto dalle caselle è il conto giusto, la divisione col suo resto), le
   caselle sono solo cifre di risultato o prodotti parziali — nessun
   riporto da scrivere —, e ogni livello della scaletta chiede quello che
   dichiara (addendi, riporti, prestiti, parziali, resto). Stava in testa a
   `integrazione/torri` e stampava senza mai fallire.
   `node test/esegui.mjs unita/torri-colonne`
   ═══════════════════════════════════════════════════════════════════ */
import { uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'
import { colonnaAdd, colonnaSub, colonnaMul, colonnaMul2, colonnaDiv, generaAdd, generaSub,
         generaMul, generaDiv, LIVELLI } from '../../src/data/ops.js'

/* ══════════ 1. le operazioni generate tornano ══════════ */
const guasti = []
for (let i = 0; i < 4000; i++) {
  const lv = 1 + (i % LIVELLI)
  for (const op of [generaAdd(lv), generaSub(lv), generaMul(lv), generaDiv(lv)]) {
    if (op.tipo === 'div') {
      const q = Number(op.quoziente.join(''))
      if (q * op.b + op.resto !== op.a) guasti.push(`div ${op.a}:${op.b} -> ${q} r${op.resto}`)
      if (op.resto >= op.b) guasti.push(`resto troppo grande ${op.a}:${op.b}`)
      if (op.b < 2) guasti.push('divisore < 2')
    } else {
      const atteso = op.tipo === 'add' ? op.numeri.reduce((s, n) => s + n, 0)
        : op.tipo === 'sub' ? op.a - op.b : op.a * op.b
      const letto = Number([...op.ris].reverse().join(''))
      if (letto !== atteso) guasti.push(`${op.tipo} ${op.a}${op.segno}${op.b} -> ${letto} invece di ${atteso}`)
      if (op.tipo === 'sub' && op.a < op.b) guasti.push(`sottrazione negativa ${op.a}-${op.b}`)
      if (op.passi.some(p => p.atteso < 0 || p.atteso > 9)) guasti.push(`passo non cifra in ${op.tipo}`)
      if (!op.passi.length) guasti.push('nessun passo')
      // NESSUN riporto o prestito da scrivere: solo cifre di risultato o prodotti parziali
      const tipiAmmessi = new Set(['ris', 'p1', 'p2'])
      if (op.passi.some(p => !tipiAmmessi.has(p.k))) guasti.push(`casella non ammessa in ${op.tipo}: ` +
        op.passi.filter(p => !tipiAmmessi.has(p.k)).map(p => p.k).join(','))
      // il numero di passi deve corrispondere alle cifre da scrivere
      const attesiPassi = op.doppia ? op.p1.length + op.p2.length + op.ris.length : op.ris.length
      if (op.passi.length !== attesiPassi) guasti.push(`passi ${op.passi.length} invece di ${attesiPassi}`)
      // prodotti parziali coerenti
      if (op.doppia) {
        const v1 = Number([...op.p1].reverse().join('')), v2 = Number([...op.p2].reverse().join(''))
        if (v1 !== op.a * (op.b % 10)) guasti.push(`parziale1 ${op.a}x${op.b} = ${v1}`)
        if (v2 !== op.a * Math.floor(op.b / 10)) guasti.push(`parziale2 ${op.a}x${op.b} = ${v2}`)
        if (v1 + v2 * 10 !== op.a * op.b) guasti.push(`somma parziali ${op.a}x${op.b}`)
        if (String(op.b).length !== 2) guasti.push('doppia con moltiplicatore a una cifra')
      } else if (op.tipo === 'mul' && String(op.b).length > 1) {
        guasti.push(`moltiplicatore a due cifre senza parziali: ${op.a}x${op.b}`)
      }
    }
  }
}
uguale('16000 operazioni generate: i conti tornano, coi passi e i parziali giusti', guasti.slice(0, 5).join(' · '), '')

/* ══════════ 2. la scaletta: dieci gradini, uno per volta ══════════
   Il controllo è dichiarativo: per ogni livello si dice cosa DEVE avere
   l'operazione, e si guarda che i generatori lo rispettino sempre. */
const cifreDi = n => String(n).split('').reverse().map(Number)
const quantiRiporti = ns => {
  const colonne = Math.max(...ns.map(n => String(n).length))
  let quanti = 0, r = 0
  for (let c = 0; c < colonne; c++) {
    const somma = ns.reduce((s, n) => s + (cifreDi(n)[c] || 0), 0) + r
    r = Math.floor(somma / 10)
    if (r > 0) quanti++
  }
  return quanti
}
const quantiPrestiti = (a, b) => {
  const A = cifreDi(a), B = cifreDi(b)
  let quanti = 0, p = 0
  for (let c = 0; c < A.length; c++) {
    if ((A[c] || 0) - p < (B[c] || 0)) { quanti++; p = 1 } else p = 0
  }
  return quanti
}

// per ogni livello: quanti addendi, quanti riporti almeno (0 = nessuno mai)
const ATTESE_ADD = [[2, 0], [2, 1], [2, 0], [2, 1], [3, 0], [3, 1], [2, 1], [3, 2], [4, 1], [3, 2]]
const ATTESE_SUB = [0, 1, 0, 1, 1, 2, 1, 2, 2, 2]        // prestiti almeno
const ATTESE_MUL = [false, false, false, false, false, true, true, true, true, true]  // doppia?
const ATTESE_DIV = [false, true, false, true, false, true, true, false, true, true]   // resto?

const scaletta = []
for (let lv = 1; lv <= LIVELLI; lv++) {
  const [addendi, riportiMin] = ATTESE_ADD[lv - 1]
  for (let i = 0; i < 200; i++) {
    const a = generaAdd(lv), r = quantiRiporti(a.numeri)
    if (a.numeri.length !== addendi)
      scaletta.push(`add liv${lv}: ${a.numeri.length} addendi invece di ${addendi}`)
    if (riportiMin === 0 ? r > 0 : r < riportiMin)
      scaletta.push(`add liv${lv}: ${r} riporti (attesi ${riportiMin === 0 ? 'zero' : '≥' + riportiMin}) in ${a.numeri.join('+')}`)

    const b = generaSub(lv), pr = quantiPrestiti(b.a, b.b), atteso = ATTESE_SUB[lv - 1]
    if (atteso === 0 ? pr > 0 : pr < atteso)
      scaletta.push(`sub liv${lv}: ${pr} prestiti (attesi ${atteso === 0 ? 'zero' : '≥' + atteso}) in ${b.a}-${b.b}`)

    const m = generaMul(lv)
    if (!!m.doppia !== ATTESE_MUL[lv - 1])
      scaletta.push(`mul liv${lv}: ${m.a}x${m.b} ${m.doppia ? 'con' : 'senza'} prodotti parziali`)
    if (lv <= 4 && !ATTESE_MUL[lv - 1]) {
      const conRiporto = String(m.a).split('').some(d => +d * m.b > 9)
      const vuoleRiporto = lv === 2 || lv === 4
      if (conRiporto !== vuoleRiporto)
        scaletta.push(`mul liv${lv}: ${m.a}x${m.b} ${conRiporto ? 'con' : 'senza'} riporti`)
    }

    const d = generaDiv(lv)
    if ((d.resto > 0) !== ATTESE_DIV[lv - 1])
      scaletta.push(`div liv${lv}: ${d.a}:${d.b} resto ${d.resto}`)
    if (String(d.a).length !== [2, 2, 3, 3, 3, 3, 3, 4, 4, 4][lv - 1])
      scaletta.push(`div liv${lv}: dividendo ${d.a} di lunghezza sbagliata`)
  }
}
uguale(`la scaletta dei ${LIVELLI} livelli è rispettata`, scaletta.slice(0, 6).join(' · '), '')

/* ══════════ 3. riporti e prestiti attesi in casi noti ══════════ */
const casi = [
  ['add  47+38', colonnaAdd(47, 38), { ris: [5, 8] }],
  ['sub  52-27', colonnaSub(52, 27), { ris: [5, 2] }],
  ['mul  47x6',  colonnaMul(47, 6),  { ris: [2, 8, 2] }],
  ['mul2 47x23', colonnaMul2(47, 23),{ p1: [1, 4, 1], p2: [4, 9], ris: [1, 8, 0, 1] }],
  ['div  97:4',  colonnaDiv(97, 4),  { quoziente: [2, 4], resto: 1 }],
]
for (const [nome, r, atteso] of casi)
  for (const [k, v] of Object.entries(atteso)) stessaLista(`${nome}: ${k}`, r[k], v)

riassunto('le operazioni in colonna del castello')
