#!/usr/bin/env node
/* Stampa i banchi dell'inglese a mondi, per rileggerli in blocco.

     node strumenti/inglese/banchi.mjs                  tutte le frasi di tutti i mondi
     node strumenti/inglese/banchi.mjs terza            le frasi di un mondo (o di una tappa: terza-c-e)
     node strumenti/inglese/banchi.mjs m-pen            una frase sola
     node strumenti/inglese/banchi.mjs --capitoli       i capitoli, in tutte le varianti
     node strumenti/inglese/banchi.mjs --capitolo=il-picnic [--max=20]

   Di una frase: le trappole col loro perché e l'italiano che ricalcano, e un
   banco per ogni formato. Di un capitolo: ogni testo diverso che può uscire,
   con le domande, la giusta (✓) e le sbagliate. In fondo i guasti, gli
   stessi di test/unita/inglese-mondi. Vedi docs/lingue/frasi.md. */
import { readdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { FRASI } from '../../src/giochi/inglese/dati/frasi.js'
import { tappaDi } from '../../src/giochi/inglese/dati/mondi.js'
import { trappoleDi } from '../../src/giochi/inglese/motore/trappole.js'
import { costruisci, contesto, FORMATI_FRASE } from '../../src/giochi/inglese/motore/formati.js'
import { inTappa } from '../../src/giochi/inglese/motore/testo.js'
import { mondiDi, racconta } from '../../src/giochi/inglese/motore/libro.js'
import { guastiDellaFrase, guastiDelCapitolo, sorte } from '../../src/giochi/inglese/motore/guasti.js'

const CARTELLA = resolve(dirname(fileURLToPath(import.meta.url)), '../../src/giochi/inglese/dati/capitoli')
const arg = process.argv.slice(2)
const opzione = nome => (arg.find(a => a.startsWith(`--${nome}=`)) || '').split('=')[1]
const filtro = arg.find(a => !a.startsWith('--'))
const max = Number(opzione('max')) || Infinity

function stampaFrase(f) {
  const tappa = tappaDi(f.tappa)
  const ctx = contesto(f, { tappa, altre: FRASI.filter(x => x.tappa === f.tappa), rnd: sorte(1) })
  console.log(`\n■ ${f.id}  [${f.tappa} · ${f.forma}]  «${f.it}»  →  ${inTappa(f.en, tappa)}`)
  for (const t of trappoleDi(f, ctx))
    console.log(`   ✗ ${inTappa(t.en, tappa).padEnd(36)} ${t.id.padEnd(20)} ${t.perche}${t.it ? `   «${t.it}»` : ''}`)
  for (const formato of FORMATI_FRASE) {
    const d = costruisci(f, formato, ctx, { forza: FORMATI_FRASE.indexOf(formato) })
    let banco
    if (d.opzioni) banco = d.opzioni.map(o => (o.giusta ? '✓ ' : '') + o.testo).join(' · ')
    else if (d.righe) banco = d.righe.map(r => (r.buco !== undefined ? '___' : r.testo)).join(' ') +
                              '   tessere: ' + d.tessere.map(t => t.testo).join(' ')
    else banco = d.tessere.map(t => t.testo).join(' · ')
    console.log(`   ${formato.padEnd(12)} ${banco}`)
  }
  for (const g of guastiDellaFrase(f, { semi: 2 })) console.log('   ⚠', g)
}

async function capitoli() {
  const tutti = []
  for (const f of readdirSync(CARTELLA).filter(x => x.endsWith('.js')).sort())
    tutti.push((await import(pathToFileURL(resolve(CARTELLA, f)))).default)
  return tutti
}

function stampaCapitolo(c) {
  const visti = new Set()
  let n = 0
  console.log(`\n══ ${c.titolo} (${c.id}, mondo ${c.mondo}) — ${mondiDi(c).length} combinazioni`)
  for (const v of mondiDi(c)) {
    const r = racconta(c, v, sorte(1))
    // come si vede: la narrazione di seguito, ogni battuta a capo col nome di chi parla
    const testo = r.blocchi.map(p => p.map(b => (b.chi ? `${b.nome.toUpperCase()} — ` : '') +
      b.righe.map(x => x.en).join(' ')).join('\n    ')).join('\n  ¶ ')
    const chiave = testo + '|' + r.domande.map(d => d.giusta).join('|')
    if (visti.has(chiave)) continue
    visti.add(chiave)
    if (++n > max) continue
    console.log(`\n  ${testo}`)
    for (const d of r.domande)
      console.log(`    ? ${d.testo}  ` + d.opzioni.map(o => (o.giusta ? '✓ ' : '') + o.testo).join(' · '))
  }
  console.log(`\n  ${visti.size} varianti diverse${visti.size > max ? ` (stampate ${max})` : ''}`)
  for (const g of guastiDelCapitolo(c)) console.log('  ⚠', g)
}

if (arg.includes('--capitoli') || opzione('capitolo')) {
  const scelto = opzione('capitolo')
  for (const c of await capitoli()) if (!scelto || c.id === scelto) stampaCapitolo(c)
} else {
  const frasi = FRASI.filter(f => !filtro || f.id === filtro || f.mondo === filtro || f.tappa === filtro)
  if (!frasi.length) console.log('Nessuna frase per', filtro)
  frasi.forEach(stampaFrase)
}
