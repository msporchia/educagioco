#!/usr/bin/env node
// La tabella delle figure della roba per il 3D (docs/sotterraneo/roba-3d.md): da `generati/roba.json` (238 figure) e dai foglietti
// dei tre fogli scrive `src/giochi/sotterraneo/dati/figure3d.js`, che non si tocca a mano. Due tabelle:
//   FIGURE3D      id della figura → { famiglia (il modulo 3D: lame, bastoni, scudi, vesti, gioielli), cosa, elemento, materia, stile,
//                 mani, pregio, nome, pezzo }
//   SPRITE_FIGURA lo sprite dell'atlante che non si chiama come la figura → la figura (`spada` → `spada-26`, `zanna-del-drago` →
//                 `spada-29`): come `in_gioco` di strumenti/sprite/roba.py, il centro del ritaglio cade nel rettangolo della figura
// e la firma del contenuto (un test la ricalcola).
//
//   npm run roba3d                 riscrive la tabella
//   npm run roba3d -- --controlla  non scrive: esce con 1 se la tabella è vecchia
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const GENERATI = resolve(RADICE, 'strumenti/sprite/sorgenti/sotterraneo/generati')
export const FILE_FIGURE3D = resolve(RADICE, 'src/giochi/sotterraneo/dati/figure3d.js')

// il prefisso dell'id della figura → il modulo 3D che la disegna (poc/roba-3d/<modulo>.js)
export const FAMIGLIA_DEL_PREFISSO = { spada: 'lame', ascia: 'lame', bastone: 'bastoni', arco: 'bastoni', scudo: 'scudi', veste: 'vesti', amuleto: 'gioielli' }
const CAMPI = ['cosa', 'elemento', 'materia', 'stile', 'mani', 'pregio', 'nome', 'pezzo']

export const firmaDi = tabelle => createHash('sha1').update(JSON.stringify(tabelle)).digest('hex').slice(0, 12)

export function tabelle() {
  const voci = JSON.parse(readFileSync(resolve(GENERATI, 'roba.json'), 'utf8')).figure
  const ids = new Set(voci.map(v => v.id))
  const FIGURE3D = {}
  for (const v of voci) {
    const prefisso = v.id.replace(/-\d+$/, '')
    const famiglia = FAMIGLIA_DEL_PREFISSO[prefisso]
    if (!famiglia) throw new Error(`${v.id}: prefisso senza famiglia 3D (FAMIGLIA_DEL_PREFISSO)`)
    const f = { famiglia }
    for (const c of CAMPI) if (v[c] != null) f[c] = v[c]
    FIGURE3D[v.id] = f
  }
  // gli sprite ritagliati da una figura col nome loro: il centro del ritaglio sta nel rettangolo della figura
  const fogli = {}, SPRITE_FIGURA = {}
  for (const v of voci) {
    if (!fogli[v.foglio]) {
      const fg = JSON.parse(readFileSync(resolve(GENERATI, v.foglio.replace(/\.png$/, '.json')), 'utf8'))
      const s = fg.scala || 1
      fogli[v.foglio] = Object.entries(fg.sprite || {})
        .filter(([k, p]) => p && typeof p === 'object' && p.da && !ids.has(k))
        .map(([k, p]) => [k, (p.da[0] + p.cella[0] / 2) * s, (p.da[1] + p.cella[1] / 2) * s])
    }
    const [x, y, w, h] = v.rettangolo
    for (const [k, cx, cy] of fogli[v.foglio]) if (x <= cx && cx <= x + w && y <= cy && cy <= y + h) SPRITE_FIGURA[k] = v.id
  }
  const ordinato = Object.fromEntries(Object.entries(SPRITE_FIGURA).sort(([a], [b]) => a.localeCompare(b)))
  return { FIGURE3D, SPRITE_FIGURA: ordinato }
}

export function testo(t = tabelle()) {
  const firma = firmaDi(t)
  const righe = o => Object.entries(o).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join('\n')
  return `/* GENERATO da strumenti/mappa-roba3d.mjs (\`npm run roba3d\`) dal catalogo generati/roba.json e dai foglietti — non si scrive a mano.

   Le figure della roba per il Sotterraneo 3D: per ogni figura dei fogli il modulo 3D che la disegna (\`famiglia\`) e i dati che
   servono al modello; e gli sprite dell'atlante che non si chiamano come la loro figura. Chi la legge: scena3d/roba3d.js
   (docs/sotterraneo/roba-3d.md). Dato puro, niente three.
   firma: ${firma}
*/

export const FIRMA = '${firma}'

export const FIGURE3D = {
${righe(t.FIGURE3D)}
}

export const SPRITE_FIGURA = {
${righe(t.SPRITE_FIGURA)}
}
`
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const nuovo = testo()
  const ora = existsSync(FILE_FIGURE3D) ? readFileSync(FILE_FIGURE3D, 'utf8') : null
  if (process.argv.includes('--controlla')) {
    console.log(ora === nuovo ? 'figure3d.js è aggiornato' : 'figure3d.js è vecchio: npm run roba3d')
    process.exit(ora === nuovo ? 0 : 1)
  }
  if (ora !== nuovo) writeFileSync(FILE_FIGURE3D, nuovo)
  const t = tabelle()
  console.log(`${Object.keys(t.FIGURE3D).length} figure, ${Object.keys(t.SPRITE_FIGURA).length} sprite col nome loro → ${FILE_FIGURE3D}${ora === nuovo ? ' (uguale)' : ''}`)
}
