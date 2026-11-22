/* ═══════════════════════════════════════════════════════════════════
   LE ANTEPRIME DEI GIOCHI DELLA SCUOLA, REGISTRATE DAI GIOCHI VERI

     npm run anteprime scuola              ricompila la scuola, poi riscrive src/scuola/maestra/anteprime-giochi.js
     npm run anteprime scuola -- --niente-build     con il dist-scuola/ che c'è (solo se è di questo codice)
     npm run anteprime scuola -- --giochi=castello,robot   rifà solo quelli, e tiene gli altri del file
     ANTEPRIME_DEBUG=1 npm run anteprime scuola     e lascia i video in tmp/scatti/anteprime-scuola/

   Nella pagina della maestra, scegliendo il gioco di un blocco, sotto il carosello gira qualche secondo del gioco vero.
   Si registra dalla pagina dei bambini costruita: i dieci giochi dalla prova del computer (`#prova-computer`, coi suoi
   esercizi e i piloti che li fanno muovere), «Le domande» da una lezione di prova. Il video della pagina si taglia sul
   gioco e diventa un MP4 piccolo, in un file GENERATO. Vedi docs/scuola/editor.md («La scelta del gioco»).
   ═══════════════════════════════════════════════════════════════════ */
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, copyFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { GIOCHI_PROVA } from '../src/scuola/bambini/prova-pc.js'
import { linkDiProva } from '../src/scuola/maestra/quaderno.js'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const FILE = resolve(RADICE, 'src/scuola/maestra/anteprime-giochi.js')
const PAGINA = resolve(RADICE, 'dist-scuola/index.html')
const SCHERMO = { width: 1280, height: 800 }
export const LARGO = 480            // nel carosello sta a ~360 px CSS
const SECONDI = 4
// da quando il gioco è in scena, quanto si aspetta prima di registrare: la guida si chiude, il pilota lo fa muovere
const ATTESA = 3500
const ATTESA_DI = { castello: 8000 }            // le ondate chiamate devono arrivare sul sentiero (al massimo le torri le fermano all'ingresso)
// questi si registrano nella scena al massimo della prova: nella base i primi secondi sono una mappa ferma (le ondate devono
// ancora arrivare) o un dialogo (il sotterraneo); al massimo si vede il gioco pieno
const AL_MASSIMO = ['castle-battle', 'survivors', 'sotterraneo']
const SCHEDE = { id: 'schede', esercizio: { tipo: 'tabelline', tabelline: [2, 3], modo: 'prodotto' } }

// il gioco in scena nella pagina: montato e, se disegna, con una tela visibile (come la prova del computer)
const inScena = ([sel, massimo]) => {
  const p = document.querySelector(sel)
  if (massimo && !/al massimo/.test(document.querySelector('[data-prova-pc-corre]')?.innerText || '')) return false
  const tele = [...(p?.querySelectorAll('canvas') || [])].filter(c => c.width > 0 && c.getBoundingClientRect().width > 50)
  return massimo ? tele.length > 0 : !!p?.querySelector('[data-gioco], [data-domanda]') && (!p.querySelector('canvas') || tele.length > 0)
}
// dove tagliare: le tele visibili del gioco, se stanno in una colonna (i giochi in verticale), se no tutto il palco
const taglio = sel => {
  const p = document.querySelector(sel), b = p.getBoundingClientRect()
  const tele = [...p.querySelectorAll('canvas')].map(c => c.getBoundingClientRect()).filter(r => r.width > 50 && r.height > 50)
  if (!tele.length) return { x: b.x, y: b.y, w: b.width, h: b.height }
  const x = Math.max(b.x, Math.min(...tele.map(r => r.x))), y = Math.max(b.y, Math.min(...tele.map(r => r.y)))
  const x2 = Math.min(b.right, Math.max(...tele.map(r => r.right))), y2 = Math.min(b.bottom, Math.max(...tele.map(r => r.bottom)))
  return x2 - x < 0.75 * b.width ? { x, y, w: x2 - x, h: y2 - y } : { x: b.x, y: b.y, w: b.width, h: b.height }
}

// le immagini della pagina dallo screencast di Chrome (arrivano quando cambia qualcosa, ognuna col suo istante): il registratore
// di Playwright vorrebbe scaricare un suo ffmpeg, questo usa quello che c'è
async function registraUno(browser, cartella, g) {
  const contesto = await browser.newContext({ viewport: SCHERMO })
  const page = await contesto.newPage()
  try {
    let sel
    if (g.id === 'schede') {
      await page.goto(linkDiProva({ id: 'prova', nome: 'Prova', blocchi: [{ esercizio: g.esercizio, passa: null }], inTondo: false }, 'file://' + PAGINA))
      sel = 'body'
    } else {
      await page.addInitScript(id => { window.__provaSolo = [id]; window.__provaSogliaB = 0 }, g.id)
      await page.goto('file://' + PAGINA + '#prova-computer')
      await page.click('[data-azione="prova-pc-avvia"]')
      sel = '[data-prova-pc-palco]'
    }
    const massimo = AL_MASSIMO.includes(g.id)
    await page.waitForFunction(inScena, [sel, massimo], { timeout: massimo ? 80000 : 40000, polling: 200 })
    await page.waitForTimeout(ATTESA_DI[g.id] ?? ATTESA)
    const r = await page.evaluate(taglio, sel)
    const cdp = await contesto.newCDPSession(page)
    const foto = []
    cdp.on('Page.screencastFrame', f => { foto.push({ dati: f.data, t: f.metadata.timestamp }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}) })
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: SCHERMO.width, maxHeight: SCHERMO.height })
    await page.waitForTimeout(SECONDI * 1000)
    await cdp.send('Page.stopScreencast')
    if (!foto.length) throw new Error('nessuna immagine')     // una sola: la pagina è ferma (le domande), resta quella
    // ogni immagine resta fino alla dopo; l'ultima fino alla fine dei secondi
    const dir = join(cartella, g.id)
    mkdirSync(dir, { recursive: true })
    const fine = foto[0].t + SECONDI
    const elenco = foto.map((f, i) => {
      const nome = join(dir, `${String(i).padStart(4, '0')}.jpg`)
      writeFileSync(nome, Buffer.from(f.dati, 'base64'))
      return `file '${nome}'\nduration ${Math.max(0.001, ((foto[i + 1]?.t ?? fine) - f.t)).toFixed(3)}`
    })
    writeFileSync(join(dir, 'elenco.txt'), elenco.join('\n') + `\nfile '${join(dir, `${String(foto.length - 1).padStart(4, '0')}.jpg`)}'\n`)
    const fuori = join(cartella, `${g.id}.mp4`)
    const pari = n => Math.floor(n / 2) * 2
    const ff = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', join(dir, 'elenco.txt'),
      '-vf', `crop=${pari(r.w)}:${pari(r.h)}:${Math.round(r.x)}:${Math.round(r.y)},scale=${LARGO}:-2,fps=12`, '-t', String(SECONDI),
      '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '33', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', fuori])
    if (ff.status) throw new Error(`ffmpeg: ${ff.stderr}`)
    return fuori
  } finally { await contesto.close() }
}

/** Registra ogni gioco: → { id: 'data:video/mp4;base64,…' }, e quelli che non sono andati. */
export async function registraScuola(browser, { solo = null } = {}) {
  const cartella = mkdtempSync(join(tmpdir(), 'anteprime-scuola-'))
  const video = {}, mancano = []
  const debug = process.env.ANTEPRIME_DEBUG && resolve(RADICE, 'tmp/scatti/anteprime-scuola')
  if (debug) mkdirSync(debug, { recursive: true })
  for (const g of [SCHEDE, ...GIOCHI_PROVA].filter(x => !solo || solo.includes(x.id))) {
    try {
      const f = await registraUno(browser, cartella, g)
      video[g.id] = 'data:video/mp4;base64,' + readFileSync(f).toString('base64')
      if (debug) copyFileSync(f, join(debug, `${g.id}.mp4`))
      console.log(`  ${g.id}: ${Math.round(video[g.id].length / 1024)} KB`)
    } catch (e) { mancano.push(`${g.id} (${e.message.split('\n')[0]})`) }
  }
  rmSync(cartella, { recursive: true, force: true })
  return { video, mancano }
}

export async function scriviScuola(nuovi, { solo = null } = {}) {
  const video = solo ? { ...(await import(pathToFileURL(FILE).href + '?' + Date.now()).then(m => m.ANTEPRIME, () => ({}))), ...nuovi } : nuovi
  const righe = Object.entries(video).map(([k, v]) => `  ${JSON.stringify(k)}: '${v}',`)
  writeFileSync(FILE, `/* GENERATO da strumenti/anteprime-scuola.mjs (\`npm run anteprime scuola\`) — non si scrive a mano.

   Qualche secondo di ogni gioco della scuola, registrato dalla pagina dei bambini: MP4 largo ${LARGO} px, ${SECONDI} secondi,
   ${Object.keys(video).length} in tutto. Lo mostra la scelta del gioco della maestra. Vedi docs/scuola/editor.md.
*/

export const ANTEPRIME = {
${righe.join('\n')}
}
`)
}

export function costruisciScuola() {
  const b = spawnSync('npm', ['run', 'build:scuola'], { cwd: RADICE, stdio: 'inherit' })
  if (b.status) process.exit(b.status)
}
