/* ═══════════════════════════════════════════════════════════════════
   LE ANTEPRIME DEI GIOCHI 3D, FOTOGRAFATE SUL COMPUTER

     npm run anteprime                       ricompila, poi la Fattoria 3D e il sotterraneo
     npm run anteprime fattoria              solo la fattoria (strumenti/anteprime-fattoria3d.mjs)
     npm run anteprime sotterraneo           solo il sotterraneo (strumenti/anteprime-sotterraneo3d.mjs), sagome comprese
     npm run anteprime sagome                solo le sagome del sotterraneo (strumenti/sagome-sotterraneo3d.mjs)
     npm run anteprime -- --niente-build     con il dist/ che c'è (solo se è di questo codice)
     ANTEPRIME_DEBUG=1 npm run anteprime     e lascia i WebP in tmp/scatti/anteprime-fattoria3d/ e -sotterraneo/

   Il telefono non disegna più le immagini dei menu: le legge dai file generati. Vedi docs/core/comandi.md.
   ═══════════════════════════════════════════════════════════════════ */
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fotografaFattoria, scriviAnteprime } from './anteprime-fattoria3d.mjs'
import { fotografaSotterraneo, scriviFatte } from './anteprime-sotterraneo3d.mjs'
import { fotografaSagome, scriviSagome } from './sagome-sotterraneo3d.mjs'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const nomi = args.filter(a => !a.startsWith('--'))
const fa = n => !nomi.length || nomi.includes(n) || (n === 'sagome' && nomi.includes('sotterraneo'))
const kb = foto => Math.round(Object.values(foto).reduce((s, u) => s + u.length, 0) / 1024)

if (!args.includes('--niente-build')) {
  const b = spawnSync('npm', ['run', 'build'], { cwd: RADICE, stdio: 'inherit' })
  if (b.status) process.exit(b.status)
}
const { apriBrowser } = await import('../test/aiuto/browser.mjs')
const browser = await apriBrowser()
let esito = 0
if (fa('fattoria')) {
  const { foto, mancano } = await fotografaFattoria(browser)
  if (mancano.length) { console.error(`fattoria, senza foto (il modello non c'è o non si disegna): ${mancano.join(', ')}`); esito = 1 }
  else { scriviAnteprime(foto); console.log(`fattoria: ${Object.keys(foto).length} anteprime, ${kb(foto)} KB di testo`) }
}
if (fa('sotterraneo')) {
  const { foto, senza } = await fotografaSotterraneo(browser)
  scriviFatte(foto, senza)
  console.log(`sotterraneo: ${Object.keys(foto).length} anteprime, ${kb(foto)} KB di testo; senza modello (resta lo sprite): ${senza.length ? senza.join(' ') : 'nessuna'}`)
}
if (fa('sagome')) {
  const s = await fotografaSagome(browser)
  scriviSagome(s)
  console.log(`sagome: ${Object.keys(s.sagome).length} modelli, atlante ${s.largo}×${s.alto}, ${Math.round(s.immagine.length / 1024)} KB di testo; senza: ${s.senza.length ? s.senza.join(' ') : 'nessuno'}`)
  if (s.senza.length) esito = 1
}
await browser.close()
process.exit(esito)
