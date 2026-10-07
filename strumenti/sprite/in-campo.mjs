/* Una creatura del castello in campo, a guardarla camminare.

     node strumenti/sprite/in-campo.mjs lupo
     node strumenti/sprite/in-campo.mjs scorpione --tappa 'Il guado'

   Apre il gioco costruito (`dist/index.html`: dopo `vesti.py --atlante`
   ci vuole `npm run build`), entra in una tappa del vestito dove quella
   figura fa da mostro (`scena/bestiario.js`), chiama qualche ondata e fa
   di tutti i nemici quel mostro, immortale. Poi registra il campo per
   cinque secondi, un fotogramma ogni 100 ms, e scrive in
   `tmp/in-campo/<creatura>/`:

     campo.gif    il campo intero, a 0,6
     lato.gif     ingrandita ×2 attorno a chi va di più di lato
     fronte.gif   ingrandita ×1,3 attorno a chi scende di più
     f*.png       i fotogrammi, se serve guardarne uno

   Le GIF hanno una tavolozza per fotogramma: con una sola, presa dal
   primo, i lupi venivano verdi. Pesano decine di mega, e va bene così:
   si guardano in locale. */
import { mkdirSync, rmSync, writeFileSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { apriBrowser, apriGioco, azzera, semina, attendi, scegli } from '../../test/aiuto/browser.mjs'
import { TAPPE } from '../../src/data/castello.js'
import { BESTIARIO, VOLANO } from '../../src/giochi/castello/scena/bestiario.js'
import { VESTITO_DI } from '../../src/giochi/castello/scena/vestito.js'

const RADICE = new URL('../../', import.meta.url).pathname
const args = process.argv.slice(2)
const figura = args[0]
const nomeTappa = args.includes('--tappa') ? args[args.indexOf('--tappa') + 1] : null
if (!figura) { console.error('quale creatura? es. node strumenti/sprite/in-campo.mjs lupo'); process.exit(1) }

// la tappa: una dove la figura fa da mostro, meglio se quel mostro ci esce davvero
const candidate = []
for (const [i, t] of TAPPE.entries()) {
  const vestito = VESTITO_DI[t.campagna] || 'bosco'
  const mostro = Object.keys(BESTIARIO[vestito] || {}).find(m => BESTIARIO[vestito][m] === figura)
  if (mostro && (!nomeTappa || t.nome === nomeTappa)) candidate.push({ i, mostro, esce: t.mostri.includes(mostro) })
}
const scelta = candidate.find(c => c.esce) || candidate[0]
if (!scelta) { console.error(`«${figura}» non fa da mostro in nessuna tappa${nomeTappa ? ` chiamata «${nomeTappa}»` : ''}`); process.exit(1) }
const vola = VOLANO.includes(figura)

const figure = statSync(join(RADICE, 'src/giochi/castello/dati/figure.js')).mtimeMs
const dist = statSync(join(RADICE, 'dist/index.html')).mtimeMs
if (figure > dist) console.warn('⚠ figure.js è più nuovo di dist/index.html: lancia npm run build, o vedi le figure di prima')

const DOVE = join(RADICE, 'tmp/in-campo', figura)
rmSync(DOVE, { recursive: true, force: true })
mkdirSync(DOVE, { recursive: true })

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, { settings: { sperimentali: true } })
await scegli(page, 'torri')
await page.waitForSelector('.tappe')
console.log(`${TAPPE[scelta.i].nome} (${TAPPE[scelta.i].campagna}): ogni nemico è ${scelta.mostro}, cioè ${figura}`)
await page.evaluate(i => window.__td.inizia(i), scelta.i)
await attendi(page, 1200)
const togliCartelli = async () => {
  for (let k = 0; k < 6 && await page.locator('.velo .cartello').count(); k++) {
    await page.locator('.velo').first().click()
    await attendi(page, 350)
  }
}
await togliCartelli()
// senza una torre l'ondata non parte
await page.evaluate(async () => {
  const attesa = ms => new Promise(r => setTimeout(r, ms))
  const T = window.__td
  T.scegliTorre('add')
  await attesa(80)
  const tasti = [...document.querySelectorAll('.tastiera button')]
  T.op.value.passi.forEach(p => tasti.find(x => +x.textContent === p.atteso).click())
  await attesa(300)
})
await togliCartelli()

const res = await page.evaluate(async ({ mostro, vola }) => {
  const attesa = ms => new Promise(r => setTimeout(r, ms))
  const T = window.__td, m = T.motore()
  let id = 0
  const tutti = () => m.nemici.forEach(n => {
    n.bestia = mostro; n.vola = vola; n.vita = n.vitaMax = 1e9; n._id ??= ++id
  })
  // quattordici secondi perché si spargano per tutta la strada
  for (let t = 0; t < 140; t++) { tutti(); if (t % 25 === 0) T.chiamaOnda(); await attesa(100) }
  const c = document.querySelector('.campo canvas'), r = c.getBoundingClientRect()
  const fr = []
  for (let t = 0; t < 50; t++) {
    tutti()
    fr.push({ img: c.toDataURL('image/png'),
              chi: m.nemici.map(n => {
                const p = m.viaDi(n).puntoA(n.d), q = T.versoLoSchermo(p.x, p.y)
                return [n._id, q.x, q.y]
              }) })
    await attesa(100)
  }
  return { fr, k: c.width / r.width }
}, { mostro: scelta.mostro, vola })
await browser.close()
if (errori.length) console.warn('errori in console:', errori)

res.fr.forEach((f, n) => writeFileSync(join(DOVE, `f${String(n).padStart(2, '0')}.png`),
                                       Buffer.from(f.img.split(',')[1], 'base64')))

// chi ha fatto più strada di lato, e chi più in giù, per tutti i fotogrammi
const tracce = {}
res.fr.forEach(f => f.chi.forEach(([id, x, y]) => (tracce[id] ||= []).push([x * res.k, y * res.k])))
const intere = Object.values(tracce).filter(t => t.length === res.fr.length)
// quanti passi fa lungo l'asse (0 di lato, 1 in giù) più che lungo l'altro
const quanto = (t, asse) => t.slice(1).filter((q, i) =>
  Math.abs(q[asse] - t[i][asse]) > Math.abs(q[1 - asse] - t[i][1 - asse])).length
const riquadro = (t, margine) => {
  const xs = t.map(p => p[0]), ys = t.map(p => p[1])
  return [Math.min(...xs) - margine, Math.min(...ys) - margine * 1.5, Math.max(...xs) + margine, Math.max(...ys) + margine]
    .map(Math.round)
}
const migliore = asse => [...intere].sort((a, b) => quanto(b, asse) - quanto(a, asse))[0]
const lato = migliore(0), fronte = migliore(1)
const gif = [['campo', null, 0.6]]
if (lato && quanto(lato, 0) > 0) gif.push(['lato', riquadro(lato, 90), 2])
if (fronte && quanto(fronte, 1) > 0) gif.push(['fronte', riquadro(fronte, 90), 1.3])

const py = spawnSync('python3', ['-c', `
import sys, json, glob
from PIL import Image
dove, gif = sys.argv[1], json.loads(sys.argv[2])
fr = [Image.open(f).convert('RGB') for f in sorted(glob.glob(dove + '/f*.png'))]
for nome, box, k in gif:
    ims = [f.crop(box) if box else f for f in fr]
    ims = [i.resize((int(i.width * k), int(i.height * k)), Image.LANCZOS if k < 1 else Image.NEAREST) for i in ims]
    q = [i.quantize(256, method=Image.MEDIANCUT, dither=Image.NONE) for i in ims]
    q[0].save(f'{dove}/{nome}.gif', save_all=True, append_images=q[1:], duration=100, loop=0)
`, DOVE, JSON.stringify(gif)], { stdio: 'inherit' })
if (py.status) process.exit(py.status)
for (const [nome] of gif) console.log(join(DOVE, `${nome}.gif`))
