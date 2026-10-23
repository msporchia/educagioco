/* ═══════════════════════════════════════════════════════════════════
   CHI PESA, UN ELEMENTO ALLA VOLTA (docs/core/vecchio-telefono-elementi.md)

   Dalla zona dei grandi parte «Chi pesa»: qualche scena per scena grande
   (scene corte), tutto spento che non disegna niente, un elemento da
   solo e tolto, le leve; il resoconto ha la tabella e la LETTURA.
   tempo: 300
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, apriTendine, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const SOLO = ['el-sot:0', 'el-sot:b0', 'el-sot+pavimento', 'el-sot+fuochi', 'el-sot+mostri', 'el-sot:tutto', 'el-sot-pavimento', 'el-sot-fuochi', 'el-sot:com-era', 'el-sot:semplice',
  'el-sopra:0', 'el-sopra:b0', 'el-sopra+case', 'el-sopra:tutto', 'el-sopra-terreno', 'el-sopra-case',
  'el-fat:0', 'el-fat+edifici', 'el-fat:tutto', 'el-fat-edifici', 'el-fat:com-era', 'el-fat:semplice', 'el-ast:0', 'el-ast+sassi', 'el-ast:tutto', 'el-ast-post']

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await page.addInitScript(solo => { window.__benchmarkCorto = true; window.__benchmarkSolo = solo }, SOLO)
await page.reload()
await page.waitForSelector('.carte')
await azzera(page)
await page.click('[data-azione="grandi"]')
await page.waitForSelector('.tastierino', { timeout: 5000 })
for (const c of '0000') await page.click(`.tasto >> text="${c}"`)
await page.click('[data-scheda="impostazioni"]')
await apriTendine(page)
await page.click('[data-azione="benchmark"]')
await page.click('[data-azione="benchmark-elementi"]')
// il lettore in diretta: fps e secondi nella scena, in alto a sinistra e nel riquadro (il telefono non sembra fermo)
await page.waitForSelector('[data-benchmark-lettore]', { timeout: 5000 })
await page.waitForFunction(() => /\d+ fps · [1-9]\d* s in questa scena/.test(document.querySelector('[data-benchmark-lettore]').textContent), null, { timeout: 30000 })
controlla('il riquadro dice la scena, i secondi e gli fps', /scena \d+ di \d+/.test(await page.textContent('[data-benchmark-corre]')) && /sono \d+ s in questa scena · \d+ fps/.test(await page.textContent('[data-benchmark-secondi]')))
controlla('il telefono risponde', !(await page.isVisible('[data-benchmark-muto]')))
await page.waitForSelector('[data-benchmark-log]', { timeout: 290000 })
const log = await page.inputValue('[data-benchmark-log]')
console.log(log)
if (errori.length) console.log('ERRORI DELLA PAGINA:', errori)
const v = await page.evaluate(() => window.__benchmarkVeri)
const r = id => v.risultati.find(x => x.id === id)
uguale('tutte le scene chieste', v.risultati.length, SOLO.length)
uguale('nessuna «non regge»', v.risultati.filter(x => x.errore).map(x => `${x.id}: ${x.errore}`).join('; '), '')
uguale('tutto spento non disegna niente, nelle discese', r('el-sot:0').ch, 0)
uguale('e di sopra', r('el-sopra:0').ch, 0)
uguale('e nella fattoria', r('el-fat:0').ch, 0)
controlla('e negli asteroidi solo il passaggio finale', r('el-ast:0').ch <= 1, r('el-ast:0').ch)
controlla('gli edifici e i sassi da soli disegnano', r('el-fat+edifici').ch > 0 && r('el-ast+sassi').ch > 0, JSON.stringify([r('el-fat+edifici').ch, r('el-ast+sassi').ch]))
controlla('il pavimento da solo disegna poco', r('el-sot+pavimento').ch > 0 && r('el-sot+pavimento').ch < 10, r('el-sot+pavimento').ch)
controlla('i mostri da soli hanno le loro chiamate', r('el-sot+mostri').ch >= 3, r('el-sot+mostri').ch)
// (le chiamate di una scena cambiano col fotogramma: gli effetti vanno e vengono)
controlla('la scena intera disegna di più', r('el-sot:tutto').ch > 30 && r('el-sopra:tutto').ch > r('el-sopra-case').ch,
  JSON.stringify([r('el-sot:tutto').ch, r('el-sopra:tutto').ch, r('el-sopra-case').ch]))
controlla('la tabella e la LETTURA', /CHI PESA \(elemento/.test(log) && /\[elementi sot\]/.test(log) && /\[elementi sopra\]/.test(log) && /\n- CHI PESA nel Sotterraneo/.test(log) && /SEMPLIFICARE \(sot\)/.test(log) && /LEVE \(sot/.test(log) && /\[elementi fat\]/.test(log) && /\[elementi ast\]/.test(log) && /LEVE \(fat, erba:false\)/.test(log))
nota(`discese: tutto spento ${r('el-sot:0').ch} ch, pavimento ${r('el-sot+pavimento').ch} ch ${r('el-sot+pavimento').tri} tri, mostro ${r('el-sot+mostri').ch} ch, intera ${r('el-sot:tutto').ch} ch ${r('el-sot:tutto').tri} tri`)
nota(`sopra: terreno ${r('el-sopra:b0').ch} ch, case ${r('el-sopra+case').ch} ch, intera ${r('el-sopra:tutto').ch} ch ${r('el-sopra:tutto').tri} tri`)
await scatto(page, 'benchmark-elementi')
await page.click('[data-azione="benchmark-chiudi"]')
await page.reload()
await page.waitForSelector('.carte')
await browser.close()
riassunto('chi pesa, un elemento alla volta')
