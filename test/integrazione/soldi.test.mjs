/* ═══════════════════════════════════════════════════════════════════
   I SOLDI IN MANO, A SCHERMO

   «Hai in mano questi soldi: quanto fanno in tutto?» mostrava cerchi e
   rettangoli piatti in una griglia stretta: non si capiva quale fosse
   quale. Adesso le monete e le banconote sono quelle della bancarella
   (`grafica/soldi.js`), posate in file ordinate. Qui si guarda cosa
   nessun test unitario vede, cioè lo **spazio**: a 390 e a 320 px nessun
   pezzo ne copre un altro, nessuno esce dalla carta, e quello che si
   vede somma davvero alla risposta giusta. Le regole dell'ordine stanno
   in `unita/soldi-disegnati`.
   Si arriva alla domanda dal banco di prova dei grandi, per classe
   (`[data-prova="soldi:2:sol:conta"]`), e si chiede «un'altra» finché
   la scena è fatta di soldi (l'altra metà delle volte il soggetto è
   l'elenco scritto).
   `node test/esegui.mjs soldi --scatti`
   tempo: 60
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, attendi, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

await page.click('[data-azione="grandi"]')
await page.waitForSelector('.tastierino', { timeout: 5000 })
for (const c of '0000') await page.click(`.tasto >> text="${c}"`)
await page.waitForSelector('.carte', { timeout: 5000 })
await page.click('[data-scheda="giochi"]')
await page.waitForSelector('[data-manopola] .quadro', { timeout: 5000 })

const apriQuadro = async k => {
  const sel = `[data-manopola] [data-apri="${k}"]`
  if ((await page.locator(sel).count()) === 0) return
  if (!(await page.locator(sel).evaluate(el => el.classList.contains('aperta')))) await page.click(sel)
  await page.waitForTimeout(150)
}
/* dove sta ogni classe dipende dall'età del profilo di prova: si aprono
   i blocchi e le righe finché il bersaglio compare (come in `domanda`) */
async function trova(bersaglio) {
  for (const k of ['facili', 'medie', 'toste', 'sotto']) {
    if (await page.locator(bersaglio).count()) break
    await apriQuadro(k)
    const chiuse = page.locator(`[data-manopola] [data-apri="${k}"] .voce-riga.apribile:not(.aperta)`)
    while (!(await page.locator(bersaglio).count()) && await chiuse.count()) {
      await chiuse.first().click()
      await page.waitForTimeout(60)
    }
  }
  return page.locator(bersaglio).count()
}

// i soldi disegnati nella domanda: valore, scatola
const leggi = () => page.evaluate(() => {
  const m = document.querySelector('[data-soldi]')
  if (!m) return null
  const r = e => { const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height } }
  const carta = r(document.querySelector('.qz-carta'))
  const giusta = document.querySelector('.qz-tasto[data-giusta]').textContent.trim()
  return {
    carta, mazzo: r(m), giusta,
    file: [...m.querySelectorAll('.fila')].map(f => ({ nome: f.dataset.fila, y: r(f).y })),
    soldi: [...m.querySelectorAll('.soldo')].map(e => ({
      cents: Number(e.dataset.cents), ...r(e), fila: e.parentElement.dataset.fila,
      sfondo: getComputedStyle(e).backgroundImage, carta: e.classList.contains('carta'),
      finestra: !!e.querySelector('.finestra'),
    })),
  }
})
const centesimiDi = testo => {
  const n = testo.replace(/[^\d,]/g, '').replace(',', '.')
  return Math.round(parseFloat(n) * 100)
}

// si chiede «un'altra» finché la scena è fatta di soldi
async function conSoldi() {
  for (let i = 0; i < 60; i++) {
    await page.waitForSelector('.qz-tasto', { timeout: 5000 })
    const q = await leggi()
    if (q) return q
    await page.click('.prova-altra')
    await attendi(page, 90)
  }
  return null
}

const SENZA_URTI = 1 // i pezzi si toccano al più per un pixel di arrotondamento
function urti(q) {
  const guasti = []
  const s = q.soldi
  for (let i = 0; i < s.length; i++) {
    const a = s[i]
    if (a.x < q.carta.x || a.x + a.w > q.carta.x + q.carta.w) guasti.push(`${a.cents} esce dalla carta`)
    for (let j = i + 1; j < s.length; j++) {
      const b = s[j]
      const dx = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
      const dy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
      if (dx > SENZA_URTI && dy > SENZA_URTI) guasti.push(`${a.cents} e ${b.cents} si sovrappongono`)
    }
  }
  return guasti
}
const ordinate = q => {
  const rango = { carte: 0, monete: 1, centesimi: 2 }
  const dalAlto = q.file.every((f, i) => i === 0 || (rango[f.nome] > rango[q.file[i - 1].nome] && f.y > q.file[i - 1].y))
  const discesa = q.soldi.every((s, i) => i === 0 || rango[s.fila] > rango[q.soldi[i - 1].fila]
    || (s.fila === q.soldi[i - 1].fila && s.cents <= q.soldi[i - 1].cents))
  return dalAlto && discesa
}

let provate = 0
let viste = 0
let fotoPoche = false
let fotoMiste = false
let fotoTante = false
let fotoTante320 = false
for (const classe of ['soldi:1:sol:conta', 'soldi:2:sol:conta', 'soldi:3:sol:conta']) {
  const bersaglio = `[data-prova="${classe}"]`
  if (!(await trova(bersaglio))) { nota(`${classe}: non è nel quadro di questo profilo`); continue }
  provate++
  await page.click(bersaglio)
  await page.waitForSelector('.qz-tasto', { timeout: 5000 })
  for (const larghezza of [390, 320]) {
    await page.setViewportSize({ width: larghezza, height: larghezza === 390 ? 844 : 640 })
    await attendi(page, 200)
    for (let giro = 0; giro < 6; giro++) {
      const q = await conSoldi()
      if (!q) { controlla(`${classe} a ${larghezza} px: esce una scena di soldi`, false, 'mai in 60 domande'); break }
      viste++
      const somma = q.soldi.reduce((t, s) => t + s.cents, 0)
      const dove = `${classe} a ${larghezza} px (${q.soldi.map(s => s.cents).join('+')})`
      uguale(`${dove}: quello che si vede somma alla risposta giusta`, somma, centesimiDi(q.giusta))
      const guasti = urti(q)
      controlla(`${dove}: nessun pezzo ne copre un altro o esce dalla carta`, guasti.length === 0, guasti.join(' · '))
      controlla(`${dove}: banconote, poi monete, poi centesimi, dal più alto`, ordinate(q))
      controlla(`${dove}: ogni pezzo ha il suo colore, e le banconote la finestra`,
                q.soldi.every(s => s.sfondo !== 'none' && (!s.carta || s.finestra)))
      controlla(`${dove}: i pezzi si leggono (monete 40 px, banconote 70)`,
                q.soldi.every(s => (s.carta ? s.w >= 70 : s.w >= 40) && s.h >= 40))
      if (larghezza === 390) {
        const piccolo = q.soldi.length <= 3 && q.soldi.every(s => !s.carta)
        const misto = q.soldi.some(s => s.carta) && q.soldi.some(s => s.cents < 100)
        if (piccolo && !fotoPoche) { fotoPoche = true; await scatto(page, 'soldi-poche-monete') }
        if (misto && !fotoMiste) { fotoMiste = true; await scatto(page, 'soldi-banconote-e-centesimi') }
        if (q.soldi.length >= 5 && !fotoTante) { fotoTante = true; await scatto(page, 'soldi-tanti-pezzi') }
      }
      if (larghezza === 320 && q.soldi.length >= 5 && !fotoTante320) { fotoTante320 = true; await scatto(page, 'soldi-tanti-pezzi-320') }
      await page.click('.prova-altra')
      await attendi(page, 90)
    }
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.click('.prova-x')
  await page.waitForSelector('.prova-velo', { state: 'hidden', timeout: 5000 })
}
controlla('almeno una classe dei soldi si è provata', provate > 0, 'nel quadro non ce n\'era nessuna')
nota(`provate ${provate} classi, ${viste} domande con i soldi disegnati`)

uguale('nessun errore in console', errori.length, 0, errori.join('\n'))
await browser.close()
riassunto('i soldi in mano, a schermo')
