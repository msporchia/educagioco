/* I SOSTITUTI DELLA SCUOLA ESPORTANO QUANTO L'ORIGINALE

   Il sostituto rimpiazza il file di casa nella build della scuola (docs/scuola/architettura.md):
   se manca un nome, l'import di chi lo usa si rompe solo a build fatta.
   `node test/esegui.mjs scuola-sostituti --niente-build` */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { SOSTITUTI } from '../../src/scuola/sostituti/elenco.js'
import { controlla, riassunto } from '../aiuto/verifica.mjs'

const RADICE = resolve(import.meta.dirname, '../..')
const leggi = p => readFileSync(resolve(RADICE, p), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

// i nomi esportati, letti dal testo: gli originali importano Vue e l'archivio, e qui niente si carica
function nomiEsportati (testo) {
  const nomi = new Set()
  for (const m of testo.matchAll(/export\s+(?:async\s+)?(?:function\*?|const|let|var|class)\s+([A-Za-z_$][\w$]*)/g)) nomi.add(m[1])
  for (const m of testo.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const p of m[1].split(',')) { const n = p.trim().split(/\s+as\s+/).pop(); if (n) nomi.add(n) }
  }
  if (/export\s+default\b/.test(testo)) nomi.add('default')
  return nomi
}

for (const [originale, sostituto] of Object.entries(SOSTITUTI)) {
  controlla(`l'originale ${originale} esiste`, existsSync(resolve(RADICE, originale)))
  if (!controlla(`il sostituto ${sostituto} esiste`, existsSync(resolve(RADICE, sostituto)))) continue
  if (originale.endsWith('.vue')) {
    const t = leggi(sostituto)
    controlla(`${sostituto} è un componente (ha un template o un render)`, /<template[\s>]/.test(t) || /\brender\b/.test(t))
    continue
  }
  const manca = [...nomiEsportati(leggi(originale))].filter(n => !nomiEsportati(leggi(sostituto)).has(n))
  controlla(`${sostituto} esporta tutto ciò che esporta ${originale}`, !manca.length, `manca: ${manca.join(', ')}`)
}

riassunto('i sostituti della scuola')
