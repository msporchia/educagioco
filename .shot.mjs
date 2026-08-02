import { chromium } from 'playwright'
const OUT = '/tmp/claude-1000/-home-cronos-workspace-personal-games/23ae54f3-1d36-488c-a5b2-48155051291e/scratchpad/'
const b = await chromium.launch()
const errs = []
const page = await b.newPage({ viewport:{width:390,height:844}, deviceScaleFactor:2, hasTouch:true })
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message))
page.on('console', m => m.type()==='error' && errs.push('CONSOLE ' + m.text()))
await page.goto('file:///home/cronos/workspace/personal/games/dist/index.html')
await page.waitForSelector('.carte', { timeout:8000 })
await page.screenshot({ path: OUT+'1-home.png' })

await page.click('.carta.pets')
await page.waitForSelector('.tabs')
await page.screenshot({ path: OUT+'2-negozio.png' })
const senzaMonete = await page.$$eval('.adozione', a => a.map(x=>x.disabled))

// niente monete: guadagniamole giocando sarebbe lungo, le mettiamo nel profilo
// passando dal gioco di inglese non basta -> tocchiamo IndexedDB direttamente
await page.evaluate(() => new Promise(res => {
  const r = indexedDB.open('giochi-bambini', 1)
  r.onsuccess = () => {
    const db = r.result, tx = db.transaction('kv','readwrite'), s = tx.objectStore('kv')
    const g = s.get('profilo:Leonardo')
    g.onsuccess = () => {
      const p = g.result || {}
      p.coins = 120
      s.put(p, 'profilo:Leonardo'); tx.oncomplete = res
    }
  }
}))
await page.reload(); await page.waitForSelector('.carte')
await page.click('.carta.pets'); await page.waitForSelector('.adozioni')
await page.screenshot({ path: OUT+'3-negozio-ricco.png' })

// adotta tutti e tre
for (let i = 0; i < 3; i++) {
  await page.click('.adozione')
  await page.waitForTimeout(300)
  const t = await page.$('.tabs button:nth-child(2)')
  await t.click(); await page.waitForTimeout(200)
}
await page.click('.tabs button:nth-child(1)'); await page.waitForTimeout(400)
await page.screenshot({ path: OUT+'4-stanza.png' })

// compra cibo
await page.click('.tabs button:nth-child(2)'); await page.waitForSelector('.cibi')
const schede = await page.$$('.cibi .scheda')
for (const s of [schede[0], schede[1], schede[2], schede[5]]) { await s.click(); await page.waitForTimeout(120) }
await page.screenshot({ path: OUT+'5-cibo.png' })
await page.click('.tabs button:nth-child(1)'); await page.waitForSelector('.dispensa')
await page.screenshot({ path: OUT+'6-stanza-con-cibo.png' })

// dà da mangiare al primo (Watson ama il pollo)
const prima = await page.$$eval('.pancia i', e => e.map(x=>x.style.width))
await page.click('.dispensa .piatto')
await page.waitForTimeout(500)
await page.screenshot({ path: OUT+'7-mangia.png' })
await page.waitForTimeout(1200)
const dopo = await page.$$eval('.pancia i', e => e.map(x=>x.style.width))
const frasi = await page.$$eval('.frase', e => e.map(x=>x.textContent.trim()))
const dispensa = await page.$$eval('.piatto .q', e => e.map(x=>x.textContent))
await page.screenshot({ path: OUT+'8-dopo-pasto.png' })

await page.click('.tondo')
await page.waitForSelector('.carte')
const cartaPets = await page.$eval('.carta.pets', e => e.textContent.replace(/\s+/g,' ').trim())
await page.screenshot({ path: OUT+'9-home-con-animali.png' })

await b.close()
console.log(JSON.stringify({ senzaMonete, prima, dopo, frasi, dispensa, cartaPets }, null, 1))
console.log(errs.length ? '\nERRORI:\n'+errs.join('\n') : '\nnessun errore in console')
