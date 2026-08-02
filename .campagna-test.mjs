import { chromium } from 'playwright'

const browser = await chromium.launch()
const errori = []
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
page.on('pageerror', e => errori.push('[pageerror] ' + e.message))
page.on('console', m => m.type() === 'error' && errori.push('[console] ' + m.text()))
await page.goto('file:///home/cronos/workspace/personal/games/dist/index.html')
await page.waitForSelector('.carte')
await page.click('.carta.td')
await page.waitForSelector('.tappe')

// 1. mappa: solo la prima tappa deve essere aperta
const mappa = await page.evaluate(() => ({
  tappe: [...document.querySelectorAll('.tap')].map(b => ({
    testo: b.innerText.replace(/\n/g, ' '), chiusa: b.classList.contains('chiusa') })),
  libera: !!document.querySelector('.bottone')?.textContent.includes('libera'),
}))

// 2. tappa 1: solo l'arciere sbloccato, nessuna ondata prima della prima torre
const primaTappa = await page.evaluate(async () => {
  const attesa = ms => new Promise(r => setTimeout(r, ms))
  const T = window.__td
  T.inizia(0)
  await attesa(1600)                              // ben oltre la pausa iniziale
  const primaDellaTorre = { onda: T.hud.onda, nemici: T.nemici().length }
  const bloccate = [...document.querySelectorAll('.tsc')].map(b =>
    ({ t: b.innerText.replace(/\n/g, ' '), bloccata: b.classList.contains('bloccata') }))
  T.scegliTorre('sub')                            // deve essere rifiutata
  const rifiutata = T.op.value === null
  T.scegliTorre('add')
  await attesa(80)
  const op = T.op.value
  const tasti = [...document.querySelectorAll('.tastiera button')]
  op.passi.forEach(p => tasti.find(x => +x.textContent === p.atteso).click())
  await attesa(120)
  const torre = T.torri()[0], posti = T.postazioni()
  await attesa(1600)
  return { primaDellaTorre, bloccate, rifiutata, capOp: T.livelloOp('add'),
           torreSullaPrimaPostazione: torre && Math.abs(torre.x - posti[0].x) < 0.5,
           postoVicinoAlCastello: posti[0].x > posti[posti.length - 1].x,
           dopoLaTorre: { onda: T.hud.onda, nemici: T.nemici().length } }
})

// 3. gioca la tappa 1 fino in fondo, con torri infinite e nemici indeboliti
const finita = await page.evaluate(async () => {
  const attesa = ms => new Promise(r => setTimeout(r, ms))
  const T = window.__td
  for (let i = 0; i < 400; i++) {
    if (T.fase.value !== 'gioco') break
    if (!T.scelta.value && T.torri().length < 8) {
      T.scegliTorre('add')
      await attesa(20)
      const op = T.op.value
      if (op) {
        const tasti = [...document.querySelectorAll('.tastiera button')]
        op.passi.forEach(p => tasti.find(x => +x.textContent === p.atteso).click())
      }
    }
    T.nemici().forEach(n => { n.vita = Math.min(n.vita, 1) })   // accelera la battaglia
    await attesa(60)
  }
  return { fase: T.fase.value, onda: T.hud.onda, cuori: T.hud.cuori,
           testo: document.querySelector('.banco h2')?.textContent }
})

// 4. il progresso è salvato e la tappa 2 si è aperta
await page.click('.banco .bottone.chiaro')          // torna alla mappa
await page.waitForSelector('.tappe')
const dopo = await page.evaluate(() => ({
  chiuse: [...document.querySelectorAll('.tap')].map(b => b.classList.contains('chiusa')),
  fatte: [...document.querySelectorAll('.tap')].map(b => b.classList.contains('fatta')),
}))
await page.reload()
await page.waitForSelector('.carte')
await page.click('.carta.td')
await page.waitForSelector('.tappe')
const dopoRicarica = await page.evaluate(() =>
  [...document.querySelectorAll('.tap')].map(b => b.classList.contains('chiusa')))

// 5. partita libera: tutte e quattro le torri disponibili
const libera = await page.evaluate(async () => {
  const attesa = ms => new Promise(r => setTimeout(r, ms))
  const T = window.__td
  T.iniziaLibera()
  await attesa(100)
  const ok = []
  for (const tipo of ['add', 'sub', 'mul', 'div']) {
    T.scegliTorre(tipo)
    await attesa(60)
    const op = T.op.value
    if (!op) { ok.push(tipo + ':RIFIUTATA'); continue }
    const tasti = [...document.querySelectorAll('.tastiera button')]
    op.passi.forEach(p => tasti.find(x => +x.textContent === p.atteso).click())
    await attesa(80)
    ok.push(tipo + ':' + T.torri().length)
  }
  await attesa(500)
  return { costruite: ok, ondate: T.hud.onda, campagna: T.tappaIdx.value }
})

// 6. tutte le tappe: percorso dentro il campo e postazioni distinte
const percorsi = await page.evaluate(async () => {
  const attesa = ms => new Promise(r => setTimeout(r, ms))
  const T = window.__td, out = []
  for (let i = 0; i < T.TAPPE.length; i++) {
    T.inizia(i)
    await attesa(60)
    const p = T.postazioni()
    const c = document.querySelector('canvas').getBoundingClientRect()
    out.push({ tappa: T.TAPPE[i].nome, posti: p.length,
               dentro: p.every(q => q.x > -20 && q.x < c.width + 20 && q.y > -20 && q.y < c.height + 20) })
  }
  return out
})

await page.screenshot({ path: '/tmp/claude-1000/-home-cronos-workspace-personal-games/09c853ad-7e7d-47c6-82d0-3f03af946401/scratchpad/campagna.png' })
console.log(JSON.stringify({ mappa, primaTappa, finita, dopo, dopoRicarica, libera, percorsi }, null, 1))
console.log(errori.length ? 'ERRORI:\n' + errori.join('\n') : 'nessun errore JS')
await browser.close()
