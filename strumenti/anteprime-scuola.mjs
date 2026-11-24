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
// questi si registrano nella scena al massimo della prova: nella base i primi secondi sono una mappa ferma (le ondate devono
// ancora arrivare) o un dialogo (il sotterraneo); al massimo si vede il gioco pieno
const AL_MASSIMO = ['castle-battle', 'sotterraneo']
const SCHEDE = { id: 'schede', esercizio: { tipo: 'tabelline', tabelline: [2, 3], modo: 'prodotto' } }
// l'anteprima deve far vedere l'esercizio mentre si gioca (segnalato dall'utente: il robot fermo con le nuvole non serve a
// scegliere). Questi si prendono dalla clip del README (`npm run scatti`, strumenti/clip/), che è una partita giocata col dito:
// `da` i secondi da saltare (la mappa, la pausa della ripresa), `per` quanti tenerne; in cima si tolgono SU pixel (la barra di
// casa con le monete, che a scuola non c'è). La bancarella della clip è quella vecchia, il castello non mostra l'operazione e il
// sotterraneo è buio: quelli no
const DAL_README = {
  survivors: { da: 1.5, per: 5 }, robot: { file: 'costruttore', da: 1.6, per: 9 }, 'passo-passo': { file: 'passo', da: 1.6, per: 8 },
  inglese: { da: 1.4, per: 8 }, pozioni: { da: 1.5, per: 8 }, 'castle-battle': { file: 'arena', da: 0, per: 6.5 }, asteroidi: { da: 1.7, per: 7 },
}
const SU = 42
// questi si registrano qui con una regia che fa l'esercizio: il castello tocca una piazzola, sceglie la torre e risolve
// l'operazione in colonna cifra per cifra, poi manda l'ondata; le domande rispondono a qualche scheda
// `taglio`: cosa deve entrare nell'immagine (sotto la striscia gialla della prova), con `margine` px attorno
const REGIA = {
  castello: { esercizio: { tipo: 'castello', tappa: 'bosco/Il sentiero' }, secondi: 10, taglio: '.campo canvas, .tastiera, [data-stendardo]', margine: 16 },
  schede: { esercizio: SCHEDE.esercizio, secondi: 7, taglio: '.qz-tasto', margine: 80 },
}

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
    await page.waitForTimeout(ATTESA)
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
      const file = join(dir, `${String(i).padStart(4, '0')}.jpg`)
      writeFileSync(file, Buffer.from(f.dati, 'base64'))
      return { file, durata: Math.max(0.001, (foto[i + 1]?.t ?? fine) - f.t) }
    })
    return faiVideo(dir, elenco, r, join(cartella, `${g.id}.mp4`))
  } finally { await contesto.close() }
}

// la regia: la pagina dei bambini con una lezione di prova di quel gioco, e quello che farebbe un bambino mentre si registra
const REGISTI = {
  async castello(page) {
    await page.waitForFunction(() => window.__td?.fase?.value === 'gioco' && window.__td.postazioni?.().length, null, { timeout: 30000 })
    await page.waitForTimeout(1200)
    const dove = await page.evaluate(() => {
      const T = window.__td, p = T.postazioni()[0], q = T.versoLoSchermo(p.x, p.y), r = document.querySelector('.campo canvas').getBoundingClientRect()
      return { x: r.left + q.x, y: r.top + q.y }
    })
    await page.mouse.click(dove.x, dove.y)
    await page.waitForTimeout(1000)
    await page.evaluate(() => { const T = window.__td; T.scegliTorre(T.TAPPE[T.tappaIdx.value].torri[0]) })
    await page.waitForTimeout(900)
    const passi = await page.evaluate(() => window.__td.op.value?.passi.map(p => p.atteso) ?? [])
    for (const n of passi) {
      await page.evaluate(n => [...document.querySelectorAll('.tastiera button')].find(x => +x.textContent === n)?.click(), n)
      await page.waitForTimeout(650)
    }
    await page.waitForTimeout(600)
    await page.locator('[data-azione="chiama-onda"]').click({ timeout: 2000 }).catch(() => {})
    await page.waitForTimeout(500)
    await page.locator('[data-azione="chiudi-scheda"]').click({ timeout: 1500 }).catch(() => {})   // i potenziamenti alla prima ondata
  },
  async schede(page) {
    for (let k = 0; k < 4; k++) {
      await page.waitForSelector('.qz-tasto[data-giusta]', { timeout: 8000 })
      await page.waitForTimeout(1100)
      await page.locator('.qz-tasto[data-giusta]').first().click()
      await page.waitForTimeout(500)
    }
  },
}
async function conRegia(browser, cartella, g) {
  const { esercizio, secondi, taglio: dentro, margine } = REGIA[g.id]
  const contesto = await browser.newContext({ viewport: SCHERMO })
  const page = await contesto.newPage()
  try {
    await page.goto(linkDiProva({ id: 'prova', nome: 'Prova', blocchi: [{ esercizio, passa: null }], inTondo: false }, 'file://' + PAGINA))
    await page.waitForSelector('[data-gioco], [data-domanda]', { timeout: 30000 })
    await page.waitForTimeout(1500)
    await page.locator('[data-guida-spegni]').click({ timeout: 1500 }).catch(() => {})
    const cdp = await contesto.newCDPSession(page)
    const foto = []
    cdp.on('Page.screencastFrame', f => { foto.push({ dati: f.data, t: f.metadata.timestamp }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}) })
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: SCHERMO.width, maxHeight: SCHERMO.height })
    const t0 = Date.now()
    await REGISTI[g.id](page)
    await page.waitForTimeout(Math.max(500, secondi * 1000 - (Date.now() - t0)))
    await cdp.send('Page.stopScreencast')
    if (!foto.length) throw new Error('nessuna immagine')
    const r = await page.evaluate(([sel, m]) => {
      // quello che deve entrare (il campo e il foglio dell'operazione, la scheda), sotto la striscia gialla della prova
      const q = [...document.querySelectorAll(sel)].map(e => e.getBoundingClientRect()).filter(b => b.width > 20)
      const sopra = document.querySelector('[data-prova]')?.getBoundingClientRect().bottom ?? 0
      if (!q.length) return { x: 0, y: sopra, w: innerWidth, h: innerHeight - sopra }
      const x = Math.max(0, Math.min(...q.map(b => b.x)) - m), x2 = Math.min(innerWidth, Math.max(...q.map(b => b.right)) + m)
      const y = Math.max(sopra, Math.min(...q.map(b => b.y)) - m), y2 = Math.min(innerHeight, Math.max(...q.map(b => b.bottom)) + m)
      return { x, y, w: x2 - x, h: y2 - y }
    }, [dentro, margine])
    const dir = join(cartella, g.id)
    mkdirSync(dir, { recursive: true })
    const fine = foto[0].t + secondi
    const elenco = foto.map((f, i) => {
      const file = join(dir, `${String(i).padStart(4, '0')}.jpg`)
      writeFileSync(file, Buffer.from(f.dati, 'base64'))
      return { file, durata: Math.max(0.001, (foto[i + 1]?.t ?? fine) - f.t) }
    })
    return faiVideo(dir, elenco, r, join(cartella, `${g.id}.mp4`), secondi)
  } finally { await contesto.close() }
}

// le immagini in fila, ognuna con quanto resta, diventano l'MP4 tagliato sul gioco
function faiVideo(dir, elenco, r, fuori, secondi = SECONDI) {
  writeFileSync(join(dir, 'elenco.txt'), elenco.map(x => `file '${x.file}'\nduration ${x.durata.toFixed(3)}`).join('\n') + `\nfile '${elenco.at(-1).file}'\n`)
  const pari = n => Math.floor(n / 2) * 2
  const ff = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', join(dir, 'elenco.txt'),
    '-vf', `crop=${pari(r.w)}:${pari(r.h)}:${Math.round(r.x)}:${Math.round(r.y)},scale='min(${LARGO},iw)':-2,fps=12`, '-t', String(secondi),
    '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '33', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', fuori])
  if (ff.status) throw new Error(`ffmpeg: ${ff.stderr}`)
  return fuori
}

// dalla clip del README (WebP animato, che ffmpeg non legge): Pillow, come strumenti/clip.py che la fa, ne scrive le immagini
function dalReadme(cartella, g) {
  const { da, per } = DAL_README[g.id], file = `docs/img/clip-${DAL_README[g.id].file || g.id}.webp`, dir = join(cartella, g.id)
  mkdirSync(dir, { recursive: true })
  const py = spawnSync('python3', ['-I', '-c', `
import json, sys
from PIL import Image
im = Image.open(sys.argv[1]); t = 0; fuori = []
for i in range(im.n_frames):
    im.seek(i); d = (im.info.get('duration') or 83) / 1000
    if t >= ${da} and t < ${da + per}:
        f = '%s/%04d.png' % (sys.argv[2], i); im.convert('RGB').save(f); fuori.append({'file': f, 'durata': d})
    t += d
print(json.dumps({'foto': fuori, 'largo': im.size[0], 'alto': im.size[1]}))
`, resolve(RADICE, file), dir], { encoding: 'utf8' })
  if (py.status) throw new Error(`la clip ${file}: ${py.stderr}`)
  const { foto, largo, alto } = JSON.parse(py.stdout)
  if (!foto.length) throw new Error(`la clip ${file} è più corta di ${da + per} secondi`)
  return faiVideo(dir, foto, { x: 0, y: SU, w: largo, h: alto - SU }, join(cartella, `${g.id}.mp4`), per)
}

/** Registra ogni gioco: → { id: 'data:video/mp4;base64,…' }, e quelli che non sono andati. */
export async function registraScuola(browser, { solo = null } = {}) {
  const cartella = mkdtempSync(join(tmpdir(), 'anteprime-scuola-'))
  const video = {}, mancano = []
  const debug = process.env.ANTEPRIME_DEBUG && resolve(RADICE, 'tmp/scatti/anteprime-scuola')
  if (debug) mkdirSync(debug, { recursive: true })
  for (const g of [SCHEDE, ...GIOCHI_PROVA].filter(x => !solo || solo.includes(x.id))) {
    try {
      const f = DAL_README[g.id] ? dalReadme(cartella, g) : REGIA[g.id] ? await conRegia(browser, cartella, g) : await registraUno(browser, cartella, g)
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

   Qualche secondo di ogni gioco della scuola, registrato dalla pagina dei bambini o preso dalla clip del README: MP4 largo fino a ${LARGO} px,
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
