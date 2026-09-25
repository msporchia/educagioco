/* ═══════════════════════════════════════════════════════════════════
   IL PROGRAMMA PIÙ CORTO — cercato davvero, nei livelli con lo zaino

     node strumenti/passo-passo/minimi.mjs              tutti i livelli con lo zaino
     node strumenti/passo-passo/minimi.mjs lago stalle  solo quelli col nome che contiene…
     node strumenti/passo-passo/minimi.mjs --scatola=7  scatole fino a sette carte, testa compresa (di serie 6)
     node strumenti/passo-passo/minimi.mjs --secondi=60 quanto provarci per livello (di serie 30)

   La quarta stella di Passo passo è la strada più corta **in carte**,
   con la carota. Senza zaino la trova il risolutore, esatta: la fila è
   fatta solo di frecce. Con lo zaino no — i cicli non si trovano con
   una ricerca in ampiezza sulle mosse — e il minimo è la più corta
   delle `soluzioni` scritte a mano (`minimoDi` in `motore/risolutore.js`).
   Una soluzione scritta a mano può non essere la più corta: questo
   strumento la mette alla prova.

   ── COME CERCA ────────────────────────────────────────────────────
   Un programma è una fila di **pezzi in cima**: una freccia, o una
   scatola intera con dentro quello che ha. Ogni pezzo fa la sua cosa a
   partire da come ha trovato il mondo, e non sa niente di quelli prima:
   quindi si cerca per stati del mondo, come il risolutore, ma ogni
   passo costa le carte del pezzo — una freccia 1, una scatola 1 più il
   suo corpo. Uno stato già raggiunto con meno carte non si riguarda.

   Il limite onesto è la grandezza delle scatole: i corpi possibili
   crescono in fretta (più di centomila scatole da sei carte, con dieci
   teste), quindi si guardano le scatole fino a `--scatola` carte, testa
   compresa.
   Quello che trova è **sempre vero** (lo rigioca col motore vero, e lo
   stampa); quello che non trova vuol dire «non con scatole così».

   L'esecuzione dei pezzi qui è una copia snella di `esegui`
   (`motore/mondo.js`), per andare veloce: per questo ogni programma
   trovato si rigioca col motore vero prima di dirlo.
   ═══════════════════════════════════════════════════════════════════ */
import { CAMPAGNA } from '../../src/giochi/passo-passo/dati/campagna.js'
import { Livello } from '../../src/giochi/passo-passo/motore/livello.js'
import { Mondo, esegui, TANA, PASSI_MAX } from '../../src/giochi/passo-passo/motore/mondo.js'
import { PASSI, SALTI } from '../../src/giochi/passo-passo/dati/mondo.js'
import { albero, apri, apriSe, carteDi, CASA, FINE, VOLTE, eApri, valoreDi, eSe } from '../../src/giochi/passo-passo/dati/carte.js'

const argomenti = process.argv.slice(2)
const opzione = (nome, di) => {
  const a = argomenti.find(x => x.startsWith(`--${nome}=`))
  return a ? Number(a.split('=')[1]) : di
}
const SCATOLA = opzione('scatola', 6)
const SECONDI = opzione('secondi', 30)
const filtri = argomenti.filter(a => !a.startsWith('--'))

const STANCO = 'stanco'
const FRECCE = { su: '↑', giu: '↓', sinistra: '←', destra: '→',
                 'salto-su': '⇑', 'salto-giu': '⇓', 'salto-sinistra': '⇐', 'salto-destra': '⇒' }
const SEGNO = { rosso: '🔴', blu: '🔵', giallo: '🟡', casa: '🏠' }

/* ── un pezzo, eseguito a partire da un mondo ──
   torna `null` se il pezzo finisce e la fila può andare avanti, se no
   com'è finita (la tana, uno sbaglio, stanco) */
function corri(nodi, w, conto) {
  for (const nodo of nodi) {
    if (nodo.che === 'ripeti') {
      if (nodo.fino) {
        for (;;) {
          const prima = conto.passi
          const e = corri(nodo.corpo, w, conto)
          if (e) return e
          if (nodo.fino !== CASA && w.lastra() === nodo.fino) break
          if (conto.passi === prima) return STANCO
        }
      } else {
        for (let g = 0; g < nodo.volte; g++) {
          const e = corri(nodo.corpo, w, conto)
          if (e) return e
        }
      }
      continue
    }
    if (nodo.che === 'se') {
      if (w.lastra() === nodo.colore) {
        const e = corri(nodo.corpo, w, conto)
        if (e) return e
      }
      continue
    }
    if (conto.passi >= PASSI_MAX) return STANCO
    conto.passi++
    const e = w.mossa(nodo.m)
    if (e) return e
  }
  return null
}

/* ── i pezzi possibili, per grandezza ──
   `file(s)`: tutte le file di carte lunghe s (in carte: le chiusure
   non contano); `pezzi(s)`: i pezzi in cima lunghi s — una freccia se
   s = 1, se no una testa col suo corpo lungo s − 1. Si generano man
   mano e non si tengono: sono milioni, e in memoria non ci stanno. */
function catalogo(liv) {
  const frecce = liv.salti ? [...PASSI, ...SALTI] : PASSI.slice()
  const colori = [...new Set(liv.lastra.filter(Boolean))]
  const teste = []
  if (liv.carte.includes('ripeti')) teste.push(...VOLTE.map(v => apri(v)))
  if (liv.carte.includes('fino')) teste.push(...colori.map(c => apri(c)))
  if (liv.carte.includes('casa')) teste.push(apri(CASA))
  if (liv.carte.includes('se')) teste.push(...colori.map(c => apriSe(c)))

  function* file(s) {
    if (s === 0) { yield []; return }
    for (let k = 1; k <= s; k++)
      for (const p of pezzi(k)) for (const r of file(s - k)) yield [...p, ...r]
  }
  function* pezzi(s) {
    if (s === 1) { for (const m of frecce) yield [m]; return }
    for (const corpo of file(s - 1)) for (const t of teste) {
      /* un «se» che comincia con un «se» dello stesso colore non dice
         niente di più: tanto vale non guardarlo */
      if (eSe(t) && corpo[0] === t) continue
      yield [t, ...corpo, FINE]
    }
  }
  return pezzi
}

/* ── la ricerca ──
   in ampiezza per carte spese: una coda per costo, e per ogni stato il
   costo più basso con cui ci si è arrivati. Il primo arrivo a casa con
   la carota è il programma più corto (con scatole così) */
function cerca(liv, tetto, scadenza) {
  const pezzi = catalogo(liv)
  const inizio = new Mondo(liv, { eventi: false })
  const visti = new Map([[inizio.chiave(), 0]])
  const code = [[{ w: inizio, passi: 0, fila: [] }]]
  let migliore = null
  for (let costo = 0; costo < tetto; costo++) {
    for (const nodo of code[costo] || []) {
      for (let s = 1; s <= Math.min(SCATOLA, tetto - costo); s++) {
        let n = 0
        for (const p of pezzi(s)) {
          if (++n % 2000 === 0 && Date.now() > scadenza) return { scaduto: true, migliore }
          const c = costo + s
          if (c > tetto) break
          const w = nodo.w.clona()
          const conto = { passi: nodo.passi }
          const e = corri(albero(p), w, conto)
          if (e === TANA) {
            if (w.presa) {
              const fila = [...nodo.fila, ...p]
              const r = esegui(liv, fila, { eventi: false })
              if (r.esito === TANA && r.carota) { tetto = c - 1; migliore = fila }
            }
            continue
          }
          if (e) continue
          const k = w.chiave()
          if (visti.has(k) && visti.get(k) <= c) continue
          visti.set(k, c)
          ;(code[c] = code[c] || []).push({ w, passi: conto.passi, fila: [...nodo.fila, ...p] })
        }
      }
    }
  }
  return { fila: migliore }
}

const inParole = f => f.map(t => {
  if (t === FINE) return ')'
  if (eApri(t)) return (eSe(t) ? '❓' : '🔁') + (SEGNO[valoreDi(t)] || valoreDi(t)) + '('
  return FRECCE[t] || t
}).join(' ')

for (const t of CAMPAGNA) {
  if (!t.zaino) continue
  if (filtri.length && !filtri.some(f => t.chiave.includes(f) || t.nome.toLowerCase().includes(f))) continue
  const liv = Livello.da(t)
  const scritta = Math.min(...t.soluzioni.map(carteDi))
  const scadenza = Date.now() + SECONDI * 1000
  const partito = Date.now()
  const r = cerca(liv, scritta - 1, scadenza)
  const tempo = ((Date.now() - partito) / 1000).toFixed(1)
  const nome = `${t.nome} (${t.chiave})`.padEnd(40)
  if (!r.fila && r.migliore) r.fila = r.migliore
  if (r.fila) console.log(`✂️  ${nome} scritta ${scritta}, ne bastano ${carteDi(r.fila)}:  ${inParole(r.fila)}   [${tempo}s]`)
  else if (r.scaduto) console.log(`⏱  ${nome} scritta ${scritta}: niente di più corto trovato in ${SECONDI}s (non finito)`)
  else console.log(`✅ ${nome} scritta ${scritta}: niente di più corto, con scatole fino a ${SCATOLA} carte   [${tempo}s]`)
}
