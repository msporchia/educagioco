/* ═══════════════════════════════════════════════════════════════════
   LE STRADE DELLA FATTORIA, COL DITO — docs/fattoria3d/terreno.md

   La gomma: una strada disegnata se ne va, e se ne va anche quella di serie, che a vederla è uguale; una passata che attraversa le due le toglie
   tutte. Un secondo dito che si appoggia e si stacca non ferma la gomma. Che una strada tolta resti tolta lo dice `unita/fattoria3d`.
   Il dito è vero (`Input.dispatchTouchEvent`): un `page.click()` non trascina (docs/core/il-dito.md).
   `node test/esegui.mjs fattoria3d-strade`
   tempo: 40
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, attendi, scegli } from '../aiuto/browser.mjs'
import { controlla, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, { coins: 300, settings: { eta: 8, sperimentali: true } })

const cdp = await page.context().newCDPSession(page)
const dita = (type, punti) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: punti.map(([x, y], id) => ({ x, y, id })) })
const schermoDi = (x, z) => page.evaluate(([x, z]) => {
  const { mondo } = window.__fattoria3d, r = mondo.canvas.getBoundingClientRect(), [px, py] = mondo.proietta({ x, y: 0, z })
  return [r.left + px, r.top + py]
}, [x, z])
async function passata(da, a, passi = 12) {
  await dita('touchStart', [da])
  for (let k = 1; k <= passi; k++) { await dita('touchMove', [[da[0] + (a[0] - da[0]) * k / passi, da[1] + (a[1] - da[1]) * k / passi]]); await attendi(page, 25) }
  await attendi(page, 60); await dita('touchEnd', []); await attendi(page, 120)
}
const strada = (i, j) => page.evaluate(([i, j]) => window.__fattoria3d.motore.stradaSu(i, j), [i, j])
const impugna = k => page.evaluate(k => {
  const { mondo } = window.__fattoria3d
  mondo.imposta({ strumento: k, pennello: { tipo: 'terra', bordo: 'nessuno' } })
}, k)
/** La vista ferma sopra la cella (i, j): le prove non inseguono il contadino. */
const guarda = async (i, j) => {
  await page.evaluate(([i, j]) => Object.assign(window.__fattoria3d.mondo.camera.libera, { on: true, x: i, z: j }), [i, j])
  await page.waitForFunction(([i, j]) => { const c = window.__fattoria3d.mondo.camera; return Math.hypot(c.x - i, c.z - j) < 0.02 }, [i, j], { timeout: 15000 })
}

await scegli(page, 'fattoria3d')
await page.waitForSelector('[data-f3="campo"] canvas', { timeout: 10000 })
await page.waitForFunction(() => !!(window.__fattoria3d && window.__fattoria3d.mondo), null, { timeout: 15000 })
await attendi(page, 900)

/* ── quella disegnata se ne va ── */
await guarda(-3, 2)
await impugna('strada')
await passata(await schermoDi(-4.5, 2.5), await schermoDi(-2.5, 2.5))
stessaLista('il dito disegna', [await strada(-5, 2), await strada(-4, 2), await strada(-3, 2)], [1, 1, 1])
await impugna('gomma')
await passata(await schermoDi(-4.5, 2.5), await schermoDi(-2.5, 2.5))
stessaLista('la gomma toglie quella disegnata', [await strada(-5, 2), await strada(-4, 2), await strada(-3, 2)], [0, 0, 0])

/* ── quella di serie: a vederla è uguale, e se ne va uguale ── */
stessaLista('la strada di serie c\'è', [await strada(-1, 3), await strada(0, 3)], [2, 2])
await passata(await schermoDi(-2.5, 3.5), await schermoDi(1.5, 3.5))
stessaLista('una passata toglie anche quella di serie', [await strada(-1, 3), await strada(0, 3)], [0, 0])

/* ── un secondo dito che si appoggia e si stacca non ferma la gomma ── */
await guarda(-3, 5)
await page.evaluate(() => { const { motore, mondo } = window.__fattoria3d; for (let i = -6; i < -1; i++) motore.disegnaStrada(i, 6, { gratis: true }); mondo.terreno.ridisegnaStrade() })
{
  const a = await schermoDi(-5.5, 6.5), b = await schermoDi(-2.5, 6.5), altro = [a[0] + 120, a[1] - 160]
  await dita('touchStart', [a])
  await dita('touchMove', [[a[0] + 6, a[1]]]); await attendi(page, 40)
  await dita('touchStart', [[a[0] + 6, a[1]], altro]); await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: altro[0], y: altro[1], id: 1 }] }); await attendi(page, 60)       // il secondo dito si stacca (l'elenco dice chi si alza), il primo resta giù
  controlla('resta un dito solo', await page.evaluate(() => window.__fattoria3d.mondo.dito.punti.size) === 1)
  for (let k = 1; k <= 12; k++) { await dita('touchMove', [[a[0] + (b[0] - a[0]) * k / 12, a[1]]]); await attendi(page, 25) }
  await attendi(page, 60); await dita('touchEnd', []); await attendi(page, 120)
  nota('celle rimaste dopo il secondo dito: ' + (await Promise.all([-5, -4, -3].map(i => strada(i, 6)))).join())
  stessaLista('dopo il secondo dito la gomma continua', [await strada(-4, 6), await strada(-3, 6)], [0, 0])
}

controlla('nessun errore in console', errori.length === 0, errori.join(' | '))
await browser.close()
riassunto('le strade della fattoria col dito')
