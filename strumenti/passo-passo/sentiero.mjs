/* Misura i sentieri senza fine: per ogni famiglia, tanti posti fatti dal
   generatore, e di ognuno la strada più corta senza carota (in frecce
   sciolte), la deviazione della carota, le regole usate, le pecore, la
   forma, e quanto ci ha messo a nascere. I numeri di
   docs/passo-passo/sentiero.md vengono da qui.

     node strumenti/passo-passo/sentiero.mjs            mille posti per famiglia, e un giro di mille per sentiero
     node strumenti/passo-passo/sentiero.mjs --quanti=200
     node strumenti/passo-passo/sentiero.mjs --seme=7   un'altra fila di semi */
import { generaSentiero, caso, ricordoDi, INGREDIENTI, SENTIERI } from '../../src/giochi/passo-passo/motore/generatore.js'
import { Livello } from '../../src/giochi/passo-passo/motore/livello.js'
import { risolvi } from '../../src/giochi/passo-passo/motore/risolutore.js'

const argomenti = process.argv.slice(2)
const opzione = (nome, di) => {
  const a = argomenti.find(x => x.startsWith(`--${nome}=`))
  return a ? Number(a.split('=')[1]) : di
}
const QUANTI = opzione('quanti', 1000)
const SEME = opzione('seme', 1)
const TUTTI = Object.values(INGREDIENTI)

const pct = (l, p) => { const s = l.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(s.length * p))] }
const media = l => l.reduce((n, x) => n + x, 0) / Math.max(1, l.length)
const conta = l => Object.entries(l.reduce((c, x) => ({ ...c, [x]: (c[x] || 0) + 1 }), {}))
  .sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ')

/* le cose del mondo che un posto mette in scena, lette dalla mappa */
function cose(t) {
  const m = t.mappa.join('')
  const c = []
  if (t.salti) c.push('salto')
  if (/[*CMO]/.test(m)) c.push('ghiaccio')
  if (/[mM]/.test(m)) c.push('massi')
  if (/[123]/.test(m)) c.push('buche')
  if (/[rug]/.test(m)) c.push('lastre')
  return c
}

export function misuraFamiglia(strada, famiglia, quanti = QUANTI, seme = SEME) {
  const righe = []
  for (let k = 0; k < quanti; k++) {
    const rnd = caso(seme * 100003 + k * 7919)
    const t0 = performance.now()
    const t = generaSentiero(k, rnd, { sbloccati: TUTTI, famiglia, strada })
    const ms = performance.now() - t0
    if (t.famiglia !== famiglia) continue
    const liv = Livello.da(t)
    const corta = risolvi(liv, { carota: false, limite: 200000 })
    righe.push({ ms, corta: corta ? corta.length : 0, riserva: !t.misure, forma: t.forma || t.sagoma || famiglia,
                 regole: cose(t), pecore: liv.pecore.length, carte: t.zaino || 0,
                 dev: t.misure && t.misure.deviazione != null ? t.misure.deviazione : null })
  }
  return righe
}

function stampa(titolo, r) {
  if (!r.length) return
  const ms = r.map(x => x.ms), corte = r.map(x => x.corta)
  console.log(`\n── ${titolo}: ${r.length} posti`)
  console.log(`  strada più corta senza carota: min ${Math.min(...corte)} · 10% ${pct(corte, 0.1)} · mediana ${pct(corte, 0.5)} · 90% ${pct(corte, 0.9)} · max ${Math.max(...corte)}`)
  const dev = r.map(x => x.dev).filter(x => x != null)
  if (dev.length) console.log(`  deviazione della carota: min ${Math.min(...dev)} · mediana ${pct(dev, 0.5)}`)
  console.log(`  regole del mondo per posto: media ${media(r.map(x => x.regole.length)).toFixed(2)} · ${conta(r.map(x => x.regole.length))}`)
  console.log(`  quali: ${conta(r.flatMap(x => x.regole))}`)
  if (r.some(x => x.pecore)) console.log(`  pecore: ${conta(r.map(x => x.pecore))}`)
  if (r.some(x => x.carte)) console.log(`  carte nello zaino: ${conta(r.map(x => x.carte))}`)
  const forme = new Set(r.map(x => x.forma))
  console.log(`  forme: ${forme.size} · ${conta(r.map(x => x.forma))}`)
  console.log(`  riserve: ${r.filter(x => x.riserva).length}`)
  console.log(`  tempo (ms): media ${media(ms).toFixed(1)} · mediana ${pct(ms, 0.5).toFixed(1)} · 95% ${pct(ms, 0.95).toFixed(1)} · 99% ${pct(ms, 0.99).toFixed(1)} · max ${Math.max(...ms).toFixed(1)}`)
}

/* un giro come lo gioca un bambino: un posto dopo l'altro, col ricordo
   di quello di prima; quante volte la forma si ripete di fila, e quanto
   si aspetta il prossimo */
function giro(strada, quanti = QUANTI, seme = SEME) {
  let prima = null, stesse = 0, stessaFamiglia = 0
  const ms = [], forme = []
  for (let k = 0; k < quanti; k++) {
    const t0 = performance.now()
    const t = generaSentiero(k, caso(seme * 7 + k * 1009), { sbloccati: TUTTI, prima, strada })
    ms.push(performance.now() - t0)
    const ricordo = ricordoDi(t)
    if (ricordo === prima) stesse++
    if (prima && prima.split(':')[0] === t.famiglia) stessaFamiglia++
    prima = ricordo
    forme.push(t.forma)
  }
  console.log(`\n══ giro del ${strada}: ${quanti} posti di fila`)
  console.log(`  forme: ${new Set(forme).size} · ${conta(forme)}`)
  console.log(`  la stessa forma di fila: ${stesse} · la stessa famiglia di fila: ${stessaFamiglia}`)
  console.log(`  tempo (ms): media ${media(ms).toFixed(1)} · mediana ${pct(ms, 0.5).toFixed(1)} · 95% ${pct(ms, 0.95).toFixed(1)} · 99% ${pct(ms, 0.99).toFixed(1)} · max ${Math.max(...ms).toFixed(1)}`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const [strada, { famiglie }] of Object.entries(SENTIERI))
    for (const f of famiglie) stampa(`${strada} · ${f}`, misuraFamiglia(strada, f))
  for (const strada of Object.keys(SENTIERI)) giro(strada)
}
