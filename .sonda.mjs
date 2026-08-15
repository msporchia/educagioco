import { chromium } from 'playwright'
import { existsSync } from 'node:fs'
const exe = ['/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync)
const b = await chromium.launch({ executablePath: exe })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
  hasTouch: true, isMobile: true })
const p = await ctx.newPage()
p.on('pageerror', e => console.log('PAGEERR', e.message))
const url = 'file:///home/cronos/workspace/personal/games/poc/fattoria-gfx.html'
await p.goto(url); await p.evaluate(() => localStorage.clear())
await p.goto(url); await p.waitForTimeout(900)
await p.evaluate(() => { S.monete = 500; aggiornaBorsa()
  const b = statoBestia('bobtail'); b.pancia = .3; b.pelo = .5; b.gioco = .4 })

// 1. trascinare dall'inventario, col dito
await p.tap('#tMagazzino'); await p.waitForTimeout(400)
const carta = await p.evaluate(() => { const v = document.querySelector('.griglia .voce')
  const r = v.getBoundingClientRect()
  return { id: v.dataset.id, x: Math.round(r.x+r.width/2), y: Math.round(r.y+r.height/2) } })
const cdp = await ctx.newCDPSession(p)
const tocco = (t, x, y) => cdp.send('Input.dispatchTouchEvent', { type: t,
  touchPoints: t === 'touchEnd' ? [] : [{ x, y }] })
const quante0 = await p.evaluate(() => S.cose.length)
await tocco('touchStart', carta.x, carta.y); await p.waitForTimeout(60)
await tocco('touchMove', carta.x, carta.y - 30); await p.waitForTimeout(80)
await tocco('touchMove', 300, 620); await p.waitForTimeout(120)
await p.screenshot({ path: '/home/cronos/workspace/personal/games/.q1-tira.png' })
await tocco('touchEnd', 300, 620); await p.waitForTimeout(250)
console.log('cose', quante0, '→', await p.evaluate(() => S.cose.length))

// 2. Watson: tieni premuto
await p.evaluate(() => { scelto = null; const a = attori.find(a => a.cura); a.meta = null })
const cane = await p.evaluate(() => { const a = attori.find(a => a.cura)
  const r = a.riquadro; return { x: Math.round(r.x+r.w/2), y: Math.round(r.y+r.h*0.7) } })
await tocco('touchStart', cane.x, cane.y); await p.waitForTimeout(600)
console.log('Watson scelto:', await p.evaluate(() => scelto && scelto.chi))
await tocco('touchEnd', cane.x, cane.y); await p.waitForTimeout(300)
await p.screenshot({ path: '/home/cronos/workspace/personal/games/.q2-watson.png' })
const prima = await p.evaluate(() => statoBestia('bobtail').pancia)
await p.click('#attrezzi [data-g="pancia"]'); await p.waitForTimeout(300)
console.log('pancia', prima.toFixed(2), '→', await p.evaluate(() => statoBestia('bobtail').pancia.toFixed(2)))
await p.screenshot({ path: '/home/cronos/workspace/personal/games/.q3-dopo.png' })
await b.close()
