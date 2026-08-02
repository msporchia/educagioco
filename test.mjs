import { chromium } from 'playwright'

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errors = []
const URL = 'file:///home/claude/giochi/dist/index.html'

async function apri(size, touch = true) {
  const page = await browser.newPage({ viewport: size, deviceScaleFactor: 2, hasTouch: touch })
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', m => m.type() === 'error' && errors.push(m.text()))
  await page.goto(URL)
  await page.waitForSelector('.carte', { timeout: 8000 })
  return page
}

/* ══════════ 1. avvio, archivio, navigazione ══════════ */
const page = await apri({ width: 390, height: 844 })
const avvio = await page.evaluate(() => ({
  titolo: document.querySelector('h1').textContent.replace(/\s+/g, ' ').trim(),
  giochi: [...document.querySelectorAll('.carta b')].map(x => x.textContent),
  archivio: document.querySelector('.mini,.avviso')?.textContent.trim().slice(0, 40),
}))

/* ══════════ 2. INGLESE: si gioca, le monete arrivano ══════════ */
await page.click('.carta.eng')
await page.waitForSelector('#figure .figura')
const inglese = await page.evaluate(async () => {
  const attesa = ms => new Promise(r => setTimeout(r, ms))
  const parola = () => document.getElementById('parola').textContent.trim()
  const visti = []
  let giuste = 0
  for (let i = 0; i < 40; i++) {
    const p = parola(); visti.push(p)
    // la figura giusta è quella con data-en uguale alla parola
    const el = [...document.querySelectorAll('#figure .figura')].find(c => c.dataset.en === p)
    if (!el) return { errore: 'figura giusta assente per ' + p }
    el.click(); giuste++
    await attesa(30)
    // il turno avanza con un timer: forziamo l'attesa reale
    await attesa(600)
  }
  // distanza minima fra due comparse della stessa parola
  let minDist = 99
  const ultima = new Map()
  visti.forEach((p, i) => {
    if (ultima.has(p)) minDist = Math.min(minDist, i - ultima.get(p))
    ultima.set(p, i)
  })
  const cont = {}; visti.forEach(p => cont[p] = (cont[p] || 0) + 1)
  return {
    turni: visti.length, giuste,
    paroleDiverse: new Set(visti).size,
    distanzaMinima: minDist === 99 ? 'mai ripetute' : minDist,
    maxRipetizioni: Math.max(...Object.values(cont)),
    monete: window.__coins ?? null,
  }
})

const dopoInglese = await page.evaluate(() => ({
  monete: +document.querySelector('.gettone b').textContent,
  giuste: +[...document.querySelectorAll('.gettone b')][2].textContent,
}))

/* ══════════ 3. CAMERETTA condivisa: le monete dell'inglese si spendono ══════════ */
await page.click('.barra .tondo:last-child')
await page.waitForSelector('.carte')
await page.click('.carta.room')
await page.waitForSelector('#scaffali')
const negozio = await page.evaluate(async () => {
  document.querySelectorAll('.tabs button')[1].click()
  await new Promise(r => setTimeout(r, 60))
  const attivi = [...document.querySelectorAll('.scheda')].filter(b => !b.disabled)
  const primaMonete = +document.querySelector('.gettone b').textContent
  attivi.slice(0, 2).forEach(b => b.click())
  await new Promise(r => setTimeout(r, 60))
  document.querySelectorAll('.tabs button')[0].click()
  await new Promise(r => setTimeout(r, 60))
  return { acquistabili: attivi.length, primaMonete,
           dopoMonete: +document.querySelector('.gettone b').textContent,
           oggettiSuMensole: document.querySelectorAll('.ogg').length }
})

/* riordino con mouse vero */
const box = await page.evaluate(() => {
  const it = document.querySelector('.ogg')
  const righe = [...document.getElementById('scaffali').children]
  if (!it) return null
  const r = it.getBoundingClientRect(), s = righe[2].getBoundingClientRect()
  return { emoji: it.textContent, sx: r.left + r.width / 2, sy: r.top + r.height / 2,
           tx: s.right - 16, ty: s.top + s.height / 2 }
})
let riordino = 'nessun oggetto'
if (box) {
  await page.mouse.move(box.sx, box.sy)
  await page.mouse.down()
  await page.mouse.move(box.tx, box.ty, { steps: 14 })
  await page.mouse.up()
  await page.waitForTimeout(250)
  riordino = await page.evaluate(e => {
    const righe = [...document.getElementById('scaffali').children]
    return { spostato: [...righe[2].querySelectorAll('.ogg')].some(x => x.textContent === e),
             totale: document.querySelectorAll('.ogg').length }
  }, box.emoji)
}

/* ══════════ 4. MATEMATICA ══════════ */
await page.click('.barra .tondo')
await page.waitForSelector('.carte')
await page.click('.carta.mate')
await page.waitForSelector('.tabelle')
const mate = await page.evaluate(async () => {
  ;[...document.querySelectorAll('.tb')].forEach(b => { if (!b.classList.contains('on')) b.click() })
  document.querySelector('.riga .bottone:last-child').click()
  await new Promise(r => setTimeout(r, 200))
  return { inGioco: !!document.querySelector('.domanda'),
           domanda: document.querySelector('.domanda')?.textContent.replace(/\s+/g, ' ').trim() }
})

await page.waitForTimeout(400)
await page.screenshot({ path: 'shot-mate.png' })

/* ══════════ 5. persistenza attraverso un reload ══════════ */
await page.reload()
await page.waitForSelector('.carte')
const dopoReload = await page.evaluate(() => ({
  riga: document.querySelector('.testo').textContent.replace(/\s+/g, ' ').trim(),
  giocatore: document.querySelector('.gioc.on')?.textContent,
}))

/* ══════════ 6. profili separati ══════════ */
const separati = await page.evaluate(async () => {
  const prima = document.querySelector('.testo').textContent.replace(/\s+/g, ' ').trim()
  ;[...document.querySelectorAll('.gioc')].find(b => b.textContent === 'Melody').click()
  await new Promise(r => setTimeout(r, 400))
  const melody = document.querySelector('.testo').textContent.replace(/\s+/g, ' ').trim()
  ;[...document.querySelectorAll('.gioc')].find(b => b.textContent === 'Leonardo').click()
  await new Promise(r => setTimeout(r, 400))
  return { leonardo: prima, melody, tornatoLeonardo: document.querySelector('.testo').textContent.replace(/\s+/g, ' ').trim() }
})

console.log(JSON.stringify({ avvio, inglese, dopoInglese, negozio, riordino, mate,
                             dopoReload, separati, errori: errors }, null, 1))
await browser.close()
