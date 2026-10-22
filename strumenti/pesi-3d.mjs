/* ═══════════════════════════════════════════════════════════════════
   I PESI DEI MODELLI 3D — la classifica di chi costa di più

   Serve Vite da sé (niente build), apre `strumenti/banco/pesi-3d.html` nel computer rallentato come il vecchio telefono
   (SwiftShader su 4 core e la CPU ×5 di strumenti/vecchio-telefono/profilo.json, `--gpu sw`) e stampa per ogni modello
   chiamate, triangoli, mesh, punti, ms di disegno e di animazione per copia, in ordine di costo. docs/sotterraneo/limiti-3d.md.

     node strumenti/pesi-3d.mjs                          # tutti: mostri, persone, eroi, roba (e gli aloni), fattoria
     node strumenti/pesi-3d.mjs --gruppo mostri --primi 15
     node strumenti/pesi-3d.mjs --gruppo eroi,roba --q leggendario
     node strumenti/pesi-3d.mjs --copie 6 --giri 15 --cpu 5 --senzasalda --json tmp/pesi.json

   Una misura a computer carico dà numeri sbagliati: a macchina calma, e le voci dubbie si rifanno con `--q`.
   ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const opz = (nome, difetto) => { const i = args.indexOf('--' + nome); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : difetto }
const tarato = (() => { try { return JSON.parse(readFileSync(resolve(RADICE, 'strumenti/vecchio-telefono/profilo.json'), 'utf8')).sw || {} } catch (e) { return {} } })()
const core = Number(opz('core', tarato.core || 4)), cpu = Number(opz('cpu', tarato.cpu || 5))
// la GPU finta gira su `core` core soltanto, come strumenti/vecchio-telefono.mjs
if (core > 0 && !process.env.VT_CORE) {
  const r = spawnSync('taskset', ['-c', `0-${core - 1}`, process.execPath, ...process.argv.slice(1)], { stdio: 'inherit', env: { ...process.env, VT_CORE: String(core) } })
  if (!r.error) process.exit(r.status ?? 1)
  console.error('taskset non c\'è: si va avanti su tutti i core')
}
const indirizzo = new URLSearchParams()
for (const k of ['gruppo', 'q', 'copie', 'giri']) if (opz(k)) indirizzo.set(k, opz(k))
if (args.includes('--senzasalda')) indirizzo.set('senzasalda', '1')
const primi = Number(opz('primi', 0))

const server = await createServer({ root: RADICE, server: { port: 0, strictPort: false, open: false }, logLevel: 'error' })
await server.listen()
const porta = server.httpServer.address().port
const exe = process.env.CHROME || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(existsSync)
const browser = await chromium.launch({ ...(exe ? { executablePath: exe } : {}), args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
let dati
try {
  const page = await browser.newPage({ viewport: { width: 420, height: 700 } })
  page.on('pageerror', e => console.error('errore JS:', e.message))
  await page.goto(`http://localhost:${porta}/strumenti/banco/pesi-3d.html?${indirizzo}`, { waitUntil: 'load', timeout: 120000 })
  // la CPU rallentata dopo il caricamento dei moduli (Vite li serve uno per uno: rallentati sarebbero minuti)
  await page.waitForFunction(() => window.__pesiCaricata, null, { timeout: 300000 })
  if (cpu > 1) await (await page.context().newCDPSession(page)).send('Emulation.setCPUThrottlingRate', { rate: cpu })
  await page.evaluate(() => { window.__pesiVia = true })
  await page.waitForFunction(() => window.__pesi, null, { timeout: 300000 })
  let ultimo = ''
  while (!(await page.evaluate(() => window.__pesi && window.__pesi.pronto))) {
    const s = await page.textContent('#esito')
    if (s !== ultimo) { process.stderr.write(`\r${s.slice(0, 70).padEnd(70)}`); ultimo = s }
    await page.waitForTimeout(1000)
  }
  process.stderr.write('\n')
  dati = await page.evaluate(() => window.__pesi)
} finally {
  await browser.close(); await server.close()
}
if (dati.errore) { console.error(dati.errore); process.exit(1) }
console.log(`CPU ×${cpu}, ${process.env.VT_CORE || 'tutti i'} core, SwiftShader; ${dati.copie} copie per voce; fondo vuoto ${dati.base.ms} ms (${dati.base.chiamate} chiamate)`)
const guasti = dati.righe.filter(r => r.errore)
const buone = dati.righe.filter(r => !r.errore).sort((a, b) => b.msCopia + b.msAnima - (a.msCopia + a.msAnima))
const tabella = (righe, titolo) => {
  console.log(`\n${titolo}\n  ms/copia  anima   chiam.   tri    mesh punti mat luci  crea(1ª/poi)  voce`)
  for (const r of righe) console.log(`  ${r.msCopia.toFixed(2).padStart(7)} ${r.msAnima.toFixed(3).padStart(6)} ${String(r.chiamate).padStart(7)} ${String(r.tri).padStart(7)} ${String(r.mesh).padStart(5)} ${String(r.punti).padStart(4)} ${String(r.materiali).padStart(4)} ${String(r.luci).padStart(3)}  ${(r.msPrimo.toFixed(0) + '/' + r.msCrea.toFixed(1)).padStart(11)}   ${r.gruppo}: ${r.nome}`)
}
for (const g of [...new Set(buone.map(r => r.gruppo))]) {
  const l = buone.filter(r => r.gruppo === g)
  tabella(primi ? l.slice(0, primi) : l, `── ${g} (${l.length}) ──`)
}
tabella(buone.slice(0, 10), '── i dieci più cari di tutti ──')
if (guasti.length) { console.log('\nnon si costruiscono:'); for (const r of guasti) console.log(`  ${r.gruppo}: ${r.nome} — ${r.errore}`) }
console.log('\nms/copia = (banco con le copie − fondo vuoto) / copie; anima = ms di animazione per copia a fotogramma; tutto con la CPU rallentata')
if (opz('json')) { const f = resolve(RADICE, opz('json')); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, JSON.stringify(dati, null, 1)); console.log(`scritto ${opz('json')}`) }
