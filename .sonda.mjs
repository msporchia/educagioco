import { chromium } from 'playwright'
import { existsSync } from 'node:fs'
const exe = ['/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync)
const b = await chromium.launch({ executablePath: exe })
const p = await b.newPage({ viewport: { width: 1200, height: 900 } })
p.on('pageerror', e => console.log('PAGEERR', e.message))
await p.goto('http://localhost:8899/strumenti/sprite/anteprima.html', { waitUntil: 'networkidle' })
await p.waitForTimeout(1500)
console.log(await p.evaluate(() => ({ carte: document.querySelectorAll('.carta').length,
  vuoti: [...document.querySelectorAll('canvas')].filter(c=>!c.width).length,
  guasti: document.querySelector('.guasti')?.textContent.slice(0,120) || 'nessuno' })))
await b.close()
