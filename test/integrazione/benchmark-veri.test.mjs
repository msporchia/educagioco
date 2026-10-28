/* ═══════════════════════════════════════════════════════════════════
   LA MISURA COI MODELLI VERI (docs/core/vecchio-telefono-veri.md)

   Dalla zona dei grandi parte la prova coi giochi veri: una scena per
   gruppo (scene corte), a schermo mentre gira; il resoconto ha tutti i
   gruppi senza «non regge», la LETTURA col limite, la riga DATI; le
   note finiscono nell'invio; l'ultima si riapre dopo una ricarica.
   `node test/esegui.mjs benchmark-veri --scatti` per la foto del resoconto.
   tempo: 300
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, apriTendine, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

// una scena per gruppo, e due di una serie per vedere il limite
const SOLO = ['ing-sot', 'ing-presto', 'ing-zaino', 'ing-mondo', 'vuoto', 'cubi', 'ab-base', 'ab-basic', 'ab-nebbia', 'cal-1', 'sot-1', 'sot-3', 'tri-1', 'tri-2', 'ch-2', 'luci-6', 'px-2', 'per-4', 'mos-4', 'zaino-15', 'roba-lame', 'fat-10', 'js']

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
// `senzaSolo` (la sessione): il secondo giro è la verifica compatta, quella che il tasto fa davvero
await page.addInitScript(solo => { window.__benchmarkCorto = true; window.__benchmarkSolo = sessionStorage.getItem('senzaSolo') ? null : solo }, SOLO)
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

for (const g of ['ingresso', 'pavimento', 'togli', 'discese', 'luci', 'pixel', 'sopra', 'roba', 'fattoria']) controlla(`il gruppo ${g} c'è`, log.includes(`[${g}]`))
uguale('nessuna scena «non regge»', (log.match(/non regge/g) || []).length, 0)
controlla('la LETTURA dice un limite', /LETTURA/.test(log) && /LIMITE/.test(log))
const dati = JSON.parse(log.split('DATI ')[1])
uguale('la riga DATI è quella coi modelli veri', dati.k, 'veri')
const scena = id => dati.r.find(r => r[0] === id)
controlla('lo scontro ha chiamate e triangoli', scena('sot-3') && scena('sot-3')[4] > 50 && scena('sot-3')[5] > 5, JSON.stringify(scena('sot-3')))
controlla('i triangoli x2 sono di più, le chiamate le stesse', scena('tri-2')[5] > scena('tri-1')[5] * 1.4 && Math.abs(scena('tri-2')[4] - scena('tri-1')[4]) < 20, JSON.stringify([scena('tri-2'), scena('tri-1')]))
controlla('le chiamate x2 sono di più, i triangoli gli stessi', scena('ch-2')[4] > scena('tri-1')[4] * 1.4 && Math.abs(scena('ch-2')[5] - scena('tri-1')[5]) < 10, JSON.stringify([scena('ch-2'), scena('tri-1')]))
const ingresso = id => dati.r.find(r => r[0] === id)
controlla('l\'ingresso: due giri da capo, i fotogrammi più lunghi e i tre attacchi', ingresso('ing-sot') && ingresso('ing-sot')[1] === 'ing' && ingresso('ing-sot')[2].length === 2 && ingresso('ing-sot')[4][0].length === 3, JSON.stringify(ingresso('ing-sot')))
controlla('l\'ingresso a riscaldamento spento e il mondo di sopra', ['ing-sot-x', 'ing-presto', 'ing-presto-x', 'ing-mondo', 'ing-mondo-x', 'ing-zaino'].every(id => ingresso(id) && ingresso(id)[1] === 'ing'))
controlla('la LETTURA dice l\'ingresso', /INGRESSO in un piano/.test(log) && /Ingresso nel mondo di sopra/.test(log))
controlla('ogni scena ha la CPU e la GPU a parte', ['vuoto', 'sot-3', 'ab-basic'].every(id => typeof scena(id)[8] === 'number' && typeof scena(id)[9] === 'number'), JSON.stringify(scena('sot-3')))
controlla('ogni gruppo ha il riferimento del calore', /\[discese\][^\n]*rif [\d.]+ ms x[\d.]+/.test(log))
controlla('la LETTURA dice cosa togliere e il pavimento', /TOGLIERE/.test(log) && /Pavimento: schermo vuoto/.test(log))
const v = await page.evaluate(() => window.__benchmarkVeri)
uguale('nessun contesto perso', v.contesto.persi, 0)
const mostri = v.risultati.find(r => r.id === 'sot-3')
nota(`scontro con 3 mostri: ${mostri.ms}/${mostri.p95} ms, ${mostri.ch} chiamate, ${mostri.tri} triangoli, primo ${mostri.primo} ms, ${mostri.nuovi} shader`)

// le note vanno nell'invio
await page.fill('[data-benchmark-note]', 'la nebbia fa le strisce')
// le note stanno prima dei DATI: nell'ultimo invio
const inviati = await page.$$eval('[data-azione="benchmark-manda"]', a => a.map(x => new URLSearchParams(x.href.split('?')[1]).get('giudizi')))
controlla('le note sono nell\'invio', inviati.some(t => /NOTE\n- la nebbia fa le strisce/.test(t)))
const parti = await page.locator('[data-azione="benchmark-manda"]').count()
nota(`resoconto di ${log.length} caratteri: ${parti} invii`)
controlla('ogni invio sta nel campo', await page.$$eval('[data-azione="benchmark-manda"]', a => a.every(x => new URLSearchParams(x.href.split('?')[1]).get('giudizi').length <= 3400)))
await scatto(page, 'benchmark-veri')

// chiusa e riaperta dopo una ricarica, l'ultima c'è ancora
await page.click('[data-azione="benchmark-chiudi"]')
await page.reload()
await page.waitForSelector('.carte')
await apriLaMisura()
await page.waitForSelector('[data-azione="benchmark-ultima"][data-tipo="veri"]', { timeout: 5000 })
await page.click('[data-azione="benchmark-ultima"][data-tipo="veri"]')
controlla('l\'ultima si riapre', /MISURA COI MODELLI VERI/.test(await page.inputValue('[data-benchmark-log]')))
controlla('una scena con riferimento dice com\'è contro l\'ultima misura vera', /rispetto all'ultima misura vera \(\d+\/\d+\): [−+]\d/.test(log) && /MIGLIORATO rispetto all'ultima misura vera/.test(log))

// la verifica compatta, senza `solo`: la scala del mondo di sopra e gli fps veri
await page.click('[data-azione="benchmark-chiudi"]')
await page.evaluate(() => sessionStorage.setItem('senzaSolo', '1'))
await page.reload()
await page.waitForSelector('.carte')
await apriLaMisura()
controlla('ci sono i due tasti', await page.isVisible('[data-azione="benchmark-veri"]') && await page.isVisible('[data-azione="benchmark-veri-lunga"]'))
await page.click('[data-azione="benchmark-veri"]')
await page.waitForSelector('[data-benchmark-log]', { timeout: 280000 })
const breve = await page.inputValue('[data-benchmark-log]')
const vd = await page.evaluate(() => window.__benchmarkVeri)
controlla('la verifica è compatta: 19 scene, senza le serie lunghe né le scene già note', vd.risultati.length === 19 && !vd.risultati.some(r => /^(tri|ch|luci|px|roba|fat|cal|sot)-/.test(r.id)), vd.risultati.map(r => r.id).join(','))
const fpsV = vd.risultati.filter(r => r.gruppo === 'fps')
controlla('gli fps veri: tutte e otto, senza aspettare la GPU, con gli fps e i fotogrammi sotto i 30', fpsV.length === 8 && fpsV.every(r => !r.errore && r.vero && r.fps > 0 && r.sotto30 != null && r.gpu === 0),
  JSON.stringify(fpsV.map(r => [r.id, r.errore || r.fps])))
controlla('il resoconto: una riga per scena e la lettura degli fps veri', /scontro sul prato, 3 mostri: \d+ fps \(sotto i 30 il \d+%/.test(breve) && /FPS VERI \(fascia [a-z?]+, il gioco com'è\): camminare in un piano del sotterraneo \d+ fps/.test(breve), breve.slice(-1500))
controlla('c\'è la scala del mondo di sopra', ['scala-sopra-0', 'scala-sopra-9', 'scala-sopra-ancora'].every(id => vd.risultati.some(r => r.id === id && !r.errore)))
controlla('il resoconto dice la verifica, la scala e l\'antialias', /\(verifica compatta\)/.test(breve) && /SCALA \(il villaggio di sopra/.test(breve) && /Rumore: il gradino 3 rifatto/.test(breve) &&
  /Antialias nel villaggio: \d+ fps con, \d+ senza/.test(breve) && /Dove va il JS \(gradino 9: \+ mostri\): [\d.]+ ms, di cui il giro del gioco [\d.]+, il disegno di three [\d.]+/.test(breve), breve.slice(breve.indexOf('LETTURA'), breve.indexOf('LETTURA') + 2500))
uguale('nessuna scena «non regge» nella verifica', (breve.match(/non regge/g) || []).length, 0)
const ch = id => vd.risultati.find(r => r.id === id).ch
controlla('la scala: il gradino 0 non disegna, la cima disegna più del fondo', ch('scala-sopra-0') === 0 && ch('scala-sopra-9') > ch('scala-sopra-1'), JSON.stringify(['scala-sopra-0', 'scala-sopra-1', 'scala-sopra-9'].map(ch)))

controlla('niente errori', errori.length === 0, errori.join(' | '))
await browser.close()
riassunto('la misura coi modelli veri')
