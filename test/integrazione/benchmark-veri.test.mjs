/* ═══════════════════════════════════════════════════════════════════
   LA MISURA COI MODELLI VERI (docs/core/vecchio-telefono-veri.md)

   Dalla zona dei grandi partono le due prove coi giochi veri (scene
   corte), a schermo mentre girano. Dove pesa: le due scale intere, la
   LETTURA gradino per gradino, la riga DATI; le note finiscono
   nell'invio; l'ultima si riapre dopo una ricarica. Gli fps veri: le
   sette scene senza aspettare la GPU, nessuna «non regge».
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

// dove pesa
await apriLaMisura()
controlla('il foglio dice la fascia e le due prove', /fascia \w+/.test(await page.textContent('[data-benchmark-fascia]')) &&
  await page.isVisible('[data-azione="benchmark-veri"]') && await page.isVisible('[data-azione="benchmark-scale"]'))
await page.click('[data-azione="benchmark-scale"]')
await page.waitForSelector('[data-benchmark-corre]', { timeout: 5000 })
// mentre gira la scena si vede: una tela nel palco, a tutto schermo
await page.waitForFunction(() => { const c = document.querySelector('[data-benchmark-palco] canvas'); return c && c.getBoundingClientRect().width > 300 }, null, { timeout: 60000 })
controlla('le scene si vedono mentre girano', await page.evaluate(() => getComputedStyle(document.querySelector('[data-benchmark-palco]')).visibility === 'visible'))
controlla('c\'è «Interrompi»', await page.isVisible('[data-azione="benchmark-interrompi"]'))
await page.waitForSelector('[data-benchmark-log]', { timeout: 280000 })
const log = await page.inputValue('[data-benchmark-log]')
console.log(log)
if (errori.length) console.log('ERRORI DELLA PAGINA:', errori)

controlla('il resoconto dice la prova e i due gruppi', /\(dove pesa\)/.test(log.split('\n')[0]) && /\n\[scala\] /.test(log) && /\n\[scala-sopra\] /.test(log))
uguale('nessuna scena «non regge»', (log.match(/non regge/g) || []).length, 0)
const vs = await page.evaluate(() => window.__benchmarkVeri)
uguale('le due scale intere', vs.risultati.length, 21)
controlla('la lettura dice le due scale e il rumore', /SCALA \(lo scontro con 3 mostri/.test(log) && /SCALA \(il villaggio di sopra/.test(log) && /  9 \+ mostri: [\d.]+ ms/.test(log) && /Rumore: il gradino 3 rifatto/.test(log),
  log.slice(log.indexOf('LETTURA'), log.indexOf('LETTURA') + 2500))
controlla('e dove va il JS in cima a ognuna', /Dove va il JS \(lo scontro, [^)]+\): [\d.]+ ms, di cui il giro del gioco [\d.]+, il disegno di three [\d.]+/.test(log) && /Dove va il JS \(il villaggio, /.test(log))
const ch = id => vs.risultati.find(r => r.id === id).ch
controlla('la scala: il gradino 0 non disegna, la cima disegna più del fondo', ch('scala-sopra-0') === 0 && ch('scala-sopra-9') > ch('scala-sopra-1') && ch('scala-0') === 0 && ch('scala-8') > ch('scala-1'),
  JSON.stringify(['scala-0', 'scala-1', 'scala-8', 'scala-sopra-0', 'scala-sopra-1', 'scala-sopra-9'].map(ch)))
const dati = JSON.parse(log.split('DATI ')[1])
uguale('la riga DATI è quella coi modelli veri, della prova', `${dati.k} ${dati.p}`, 'veri scale')
controlla('ogni scena ha la CPU e la GPU a parte', ['scala-3', 'scala-sopra-5'].every(id => { const r = dati.r.find(x => x[0] === id); return typeof r[8] === 'number' && typeof r[9] === 'number' }))
controlla('ogni gruppo ha il riferimento del calore', /\[scala\][^\n]*rif [\d.]+ ms x[\d.]+/.test(log))
uguale('nessun contesto perso', vs.contesto.persi, 0)

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
await page.waitForSelector('[data-azione="benchmark-ultima"][data-tipo="scale"]', { timeout: 5000 })
await page.click('[data-azione="benchmark-ultima"][data-tipo="scale"]')
controlla('l\'ultima si riapre', /MISURA COI MODELLI VERI/.test(await page.inputValue('[data-benchmark-log]')))

// gli fps veri (chiuso il foglio si è ancora nella zona dei grandi)
await page.click('[data-azione="benchmark-chiudi"]')
await page.click('[data-azione="benchmark"]')
await page.click('[data-azione="benchmark-veri"]')
await page.waitForSelector('[data-benchmark-log]', { timeout: 280000 })
const breve = await page.inputValue('[data-benchmark-log]')
const vd = await page.evaluate(() => window.__benchmarkVeri)
const fpsV = vd.risultati.filter(r => r.gruppo === 'fps')
controlla('gli fps veri: le sette scene e basta, senza aspettare la GPU, con gli fps e i fotogrammi sotto i 30', vd.risultati.length === 7 && fpsV.length === 7 && fpsV.every(r => !r.errore && r.vero && r.fps > 0 && r.sotto30 != null && r.gpu === 0),
  JSON.stringify(vd.risultati.map(r => [r.id, r.errore || r.fps])))
controlla('il resoconto: una riga per scena e la lettura degli fps veri', /\(fps veri\)/.test(breve.split('\n')[0]) && /scontro sul prato, 3 mostri: \d+ fps \(sotto i 30 il \d+%/.test(breve) && /FPS VERI \(fascia [a-z?]+, il gioco com'è\): camminare in un piano del sotterraneo \d+ fps/.test(breve), breve.slice(-1500))
uguale('nessuna scena «non regge» negli fps veri', (breve.match(/non regge/g) || []).length, 0)

controlla('niente errori', errori.length === 0, errori.join(' | '))
await browser.close()
riassunto('la misura coi modelli veri')
