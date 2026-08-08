import { apriBrowser, apriGioco, scatto, GIOCATORE, ALTRO } from '../aiuto/browser.mjs'

const browser = await apriBrowser()
const errors = []
const raccolti = []   // gli elenchi degli errori si riempiono mentre il test gira

/* Due giocatori, perché più sotto si prova che i profili non si
   mescolano: con uno solo la fila per cambiare bambino non c'è proprio. */
async function apri(size) {
  const { page, errori } = await apriGioco(browser, { viewport: size,
                                                      giocatori: [GIOCATORE, ALTRO] })
  raccolti.push(errori)
  return page
}

/* ══════════ 1. avvio, archivio, navigazione ══════════ */
const page = await apri({ width: 390, height: 844 })
const avvio = await page.evaluate(() => ({
  // la home non ha più un'intestazione col nome: si guarda chi è acceso
  giocatore: document.querySelector('.gioc.on')?.textContent || '(uno solo)',
  giochi: [...document.querySelectorAll('.carta b')].map(x => x.textContent),
  archivio: document.querySelector('.mini,.avviso')?.textContent.trim().slice(0, 40),
}))

/* ══════════ 2. INGLESE: si gioca, le monete arrivano ══════════
   English è a campagna: prima la mappa delle tappe, poi il gioco. Le
   risposte si toccano dall'aggancio `window.__eng`, perché il bersaglio
   ora non è più sempre una parola scritta — può essere un ascolto o una
   frase, e cercarlo nel DOM vorrebbe dire riscrivere il gioco nel test. */
await page.click('.carta.eng')
await page.waitForSelector('.tappa')
const mappaEn = await page.evaluate(() => ({
  tappe: document.querySelectorAll('.tappa').length,
  aperte: document.querySelectorAll('.tappa:not(.chiusa)').length,
}))
await page.click('.tappa')
await page.waitForSelector('.scelte .scelta')
const inglese = await page.evaluate(async () => {
  const g = window.__eng
  const visti = [], tipi = {}
  let giuste = 0
  for (let i = 0; i < 30 && g.fase.value === 'gioco'; i++) {
    const t = g.turno.value
    visti.push(t.chiave)
    tipi[t.tipo] = (tipi[t.tipo] || 0) + 1
    g.rispondi(g.giusta()); giuste++
    for (let j = 0; j < 40 && g.turno.value === t && g.fase.value === 'gioco'; j++)
      await new Promise(r => setTimeout(r, 50))
  }
  // distanza minima fra due comparse dello stesso elemento
  let minDist = 99
  const ultima = new Map()
  visti.forEach((p, i) => {
    if (ultima.has(p)) minDist = Math.min(minDist, i - ultima.get(p))
    ultima.set(p, i)
  })
  const cont = {}; visti.forEach(p => cont[p] = (cont[p] || 0) + 1)
  return {
    turni: visti.length, giuste, tipi,
    paroleDiverse: new Set(visti).size,
    distanzaMinima: minDist === 99 ? 'mai ripetute' : minDist,
    maxRipetizioni: Math.max(...Object.values(cont)),
    fase: g.fase.value,
    tappaSuperata: g.progresso.value.tappa,
  }
})

/* superata la tappa si finisce sulla schermata del premio, che non ha la
   barra in alto: prima si torna alla mappa, poi si leggono le monete */
const giusteEn = await page.evaluate(() => window.__eng.hud.giuste)
if (await page.locator('.finale').count())
  await page.getByRole('button', { name: 'La mappa' }).click()
await page.waitForSelector('.tappa')

const dopoInglese = await page.evaluate(giuste => ({
  monete: +document.querySelector('.gettone b').textContent,
  giuste,
}), giusteEn)

/* ══════════ 3. CAMERETTA condivisa: le monete dell'inglese si spendono ══════════ */
// dalla mappa dell'inglese alla home: il tasto indietro è quello della barra,
// uguale in ogni schermata
await page.click('.barra-app button[aria-label="indietro"]')
await page.waitForSelector('.carte')
// la cameretta è una stanza disegnata: al negozio ci si va dalla porta,
// e quello che si compra si ritrova da solo sulle mensole
await page.click('.carta.room')
await page.waitForSelector('#scaffali')
await page.click('.porta')
await page.waitForSelector('.scorte')
const negozio = await page.evaluate(async () => {
  const attivi = [...document.querySelectorAll('.scheda')].filter(b => !b.disabled)
  const primaMonete = +document.querySelector('.gettone b').textContent
  attivi.slice(0, 2).forEach(b => b.click())
  await new Promise(r => setTimeout(r, 60))
  const dopoMonete = +document.querySelector('.gettone b').textContent
  document.querySelector('.barra-app button[aria-label="indietro"]').click()
  await new Promise(r => setTimeout(r, 120))
  return { acquistabili: attivi.length, primaMonete, dopoMonete,
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
await page.click('.barra-app button[aria-label="indietro"]')
await page.waitForSelector('.carte')
await page.click('.carta.mate')
// non più un menu di spunte: la campagna dei pianeti, e si parte dal primo aperto
await page.waitForSelector('.pianeti')
const mate = await page.evaluate(async () => {
  document.querySelector('.pianeta:not([disabled])').click()
  await new Promise(r => setTimeout(r, 200))
  return { inGioco: !!document.querySelector('.domanda'),
           domanda: document.querySelector('.domanda')?.textContent.replace(/\s+/g, ' ').trim(),
           bersaglio: document.querySelector('.bersaglio')?.textContent.replace(/\s+/g, ' ').trim() }
})

await page.waitForTimeout(400)
await scatto(page, 'app-mate')

/* ══════════ 5. persistenza attraverso un reload ══════════
   La riga da guardare è quella della carta delle tabelline: dice a che
   pianeta è arrivato QUESTO bambino, ed è quindi anche la prova che i
   due profili non si mescolano. */
await page.reload()
await page.waitForSelector('.carte')
const dopoReload = await page.evaluate(() => ({
  riga: document.querySelector('.carta.mate i').textContent.replace(/\s+/g, ' ').trim(),
  giocatore: document.querySelector('.gioc.on')?.textContent,
}))

/* ══════════ 6. profili separati ══════════
   Si guardano le monete: il primo giocatore ha giocato e speso, il
   secondo no, quindi se i due numeri sono uguali i profili si stanno
   mescolando. La riga dei pianeti da sola non basterebbe — a inizio
   partita sono entrambi al primo. */
const separati = await page.evaluate(async ([primo, secondo]) => {
  const foto = () => ({
    monete: +document.querySelector('.fascia .numeri').textContent.replace(/\D+/g, '').slice(0, 4) || 0,
    pianeta: document.querySelector('.carta.mate i').textContent.replace(/\s+/g, ' ').trim(),
  })
  const bottone = chi => [...document.querySelectorAll('.gioc')].find(b => b.textContent === chi)
  const prima = foto()
  bottone(secondo).click()
  await new Promise(r => setTimeout(r, 400))
  const altro = foto()
  bottone(primo).click()
  await new Promise(r => setTimeout(r, 400))
  return { primo: prima, altro, tornatoAlPrimo: foto() }
}, [GIOCATORE, ALTRO])

for (const elenco of raccolti) errors.push(...elenco)
console.log(JSON.stringify({ avvio, mappaEn, inglese, dopoInglese, negozio, riordino, mate,
                             dopoReload, separati, errori: errors }, null, 1))
await browser.close()
