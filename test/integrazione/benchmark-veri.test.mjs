/* ═══════════════════════════════════════════════════════════════════
   LA MISURA COI MODELLI VERI (docs/core/vecchio-telefono-veri.md)

   Dalla zona dei grandi partono gli fps veri coi giochi veri (scene
   corte), a schermo mentre girano: le nove scene senza aspettare la
   GPU, nessuna «non regge», la riga DATI; le note finiscono nell'invio;
   l'ultima si riapre dopo una ricarica.
   `node test/esegui.mjs benchmark-veri --scatti` per la foto del resoconto.
   tempo: 300
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, apriTendine, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await page.addInitScript(() => { window.__benchmarkCorto = true })
await page.reload()
await page.waitForSelector('.carte')
await azzera(page)

async function apriLaMisura() {
  await page.click('[data-azione="grandi"]')
  await page.waitForSelector('.tastierino', { timeout: 5000 })
  for (const c of '0000') await page.click(`.tasto >> text="${c}"`)
  await page.click('[data-scheda="impostazioni"]')
  await apriTendine(page)      // «Avanzate» nasce chiusa
  await page.click('[data-azione="benchmark"]')
}

await apriLaMisura()
controlla('il foglio dice la fascia e c\'è il tasto', /fascia \w+/.test(await page.textContent('[data-benchmark-fascia]')) && await page.isVisible('[data-azione="benchmark-veri"]'))
await page.click('[data-azione="benchmark-veri"]')
await page.waitForSelector('[data-benchmark-corre]', { timeout: 5000 })
// mentre gira la scena si vede: una tela nel palco, a tutto schermo
await page.waitForFunction(() => { const c = document.querySelector('[data-benchmark-palco] canvas'); return c && c.getBoundingClientRect().width > 300 }, null, { timeout: 60000 })
controlla('le scene si vedono mentre girano', await page.evaluate(() => getComputedStyle(document.querySelector('[data-benchmark-palco]')).visibility === 'visible'))
controlla('c\'è «Interrompi»', await page.isVisible('[data-azione="benchmark-interrompi"]'))
await page.waitForSelector('[data-benchmark-log]', { timeout: 280000 })
const log = await page.inputValue('[data-benchmark-log]')
console.log(log)
if (errori.length) console.log('ERRORI DELLA PAGINA:', errori)
const vd = await page.evaluate(() => window.__benchmarkVeri)
const fpsV = vd.risultati.filter(r => r.gruppo === 'fps')
// nei tempi corti la prima scena di un gioco può avere un fotogramma solo (gli shader che si compilano): basta che ne abbia
controlla('gli fps veri: le nove scene, senza aspettare la GPU, coi fotogrammi misurati e quelli sotto i 30', vd.risultati.length === 9 && fpsV.length === 9 && fpsV.every(r => !r.errore && r.vero && r.n > 0 && r.sotto30 != null && r.gpu === 0),
  JSON.stringify(vd.risultati.map(r => [r.id, r.errore || r.fps])))
controlla('il resoconto: una riga per scena e la lettura degli fps veri', /\(fps veri\)/.test(log.split('\n')[0]) && /scontro sul prato, 3 mostri: \d+ fps \(sotto i 30 il \d+%/.test(log) && /FPS VERI \(fascia [a-z?]+, il gioco com'è\): camminare in un piano del sotterraneo \d+ fps/.test(log), log.slice(-1500))
uguale('nessuna scena «non regge»', (log.match(/non regge/g) || []).length, 0)
uguale('la riga DATI è quella coi modelli veri', JSON.parse(log.split('DATI ')[1]).k, 'veri')
uguale('nessun contesto perso', vd.contesto.persi, 0)

// le note vanno nell'invio, prima dei DATI
await page.fill('[data-benchmark-note]', 'la nebbia fa le strisce')
const inviati = await page.$$eval('[data-azione="benchmark-manda"]', a => a.map(x => new URLSearchParams(x.href.split('?')[1]).get('giudizi')))
controlla('le note sono nell\'invio', inviati.some(t => /NOTE\n- la nebbia fa le strisce/.test(t)))
nota(`resoconto di ${log.length} caratteri: ${inviati.length} invii`)
controlla('ogni invio sta nel campo', inviati.every(t => t.length <= 3400))
await scatto(page, 'benchmark-veri')

// chiusa e riaperta dopo una ricarica, l'ultima c'è ancora
await page.click('[data-azione="benchmark-chiudi"]')
await page.reload()
await page.waitForSelector('.carte')
await apriLaMisura()
await page.waitForSelector('[data-azione="benchmark-ultima"][data-tipo="fps"]', { timeout: 5000 })
await page.click('[data-azione="benchmark-ultima"][data-tipo="fps"]')
controlla('l\'ultima si riapre', /MISURA COI MODELLI VERI/.test(await page.inputValue('[data-benchmark-log]')))

controlla('niente errori', errori.length === 0, errori.join(' | '))
await browser.close()
riassunto('la misura coi modelli veri')
