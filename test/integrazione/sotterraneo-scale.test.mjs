/* ═══════════════════════════════════════════════════════════════════
   LA SCALA CHE SALE E IL BERSAGLIO DELLA MISSIONE, COL DITO VERO

   (docs/sotterraneo/scala-che-sale.md, docs/sotterraneo/missioni.md «Dove sta»)
   In ogni piano, dove l'eroe compare arrivando dall'alto, c'è una scala che
   sale. Toccarla porta al piano di sopra, accanto alla scala che scende, col
   piano com'era; dal primo piano è l'uscita, ma col foglio di «lascio
   perdere» (mai un modo gratis di saltare il portale). Il bersaglio di una
   missione si vede da lontano: più grande, con un'aura rosa che pulsa e il
   suo nome sopra la testa.

   Le discese si cominciano dalla sosta scritta in Node (lo stesso motore
   che gira nel gioco): si sa dov'è la scala, dove si compare e cosa è
   cambiato, e il dito si controlla su quello. Si tocca come un telefono
   (`Input.dispatchTouchEvent` via CDP).
   `node test/esegui.mjs sotterraneo-scale`
   tempo: 90
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, leggiProfilo }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { T } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { presePer, PRESA } from '../../src/giochi/sotterraneo/motore/missioni.js'
import { scrivi, leggi } from '../../src/giochi/sotterraneo/motore/sosta.js'
import { robaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'

const TORRE = CAMPAGNA.findIndex(t => t.chiave === 'torre')   // tre piani, e la missione del goblin ladro al primo
const roba = robaAttesa('cavaliere', TORRE, { gemme: 5 })
const SEME = 11

/* ── in Node: il primo piano com'è lasciato, e la sosta al secondo, sulla scala che sale ── */
const giu = c => c.livello.robe.find(r => r.che === 'scala')
const su = c => c.livello.robe.find(r => r.che === 'scala-su')
const cella = c => ({ x: Math.floor(c.eroe.x), y: Math.floor(c.eroe.y) })
const nuova = (missioni = []) => new Corsa(CAMPAGNA[TORRE], { seme: SEME, eroe: 'cavaliere', roba, missioni })

const sotto = nuova()
const mostro = sotto.livello.robe.find(r => r.che === 'mostro' && !r.chiave)
const porta = sotto.livello.robe.find(r => r.che === 'porta')
mostro.morto = true
porta.aperta = true; porta.presa = true
const indiceMostro = sotto.livello.robe.indexOf(mostro)
sotto.chiaveDelPiano = true
sotto.interagisci(giu(sotto))
sotto.scendi()
const salita = scrivi(sotto, TORRE)       // la sosta al secondo piano, sulla scala che sale
const scalaSu = cella(sotto)

// dove si deve ricomparire risalendo: lo dice il motore, rileggendo la sosta come farà il gioco
const prova = leggi(salita, CAMPAGNA[TORRE], roba)
prova.interagisci(su(prova)); prova.sali()
const attesa = cella(prova)
const scalaGiu = { x: giu(prova).x, y: giu(prova).y }

const profilo = (sosta, missioni = {}) => ({
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: TORRE, libera: false, stelle: {},
    cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: { tappa: TORRE, libera: false, stelle: {},
      missioni, roba, sosta, terra: { nebbia: 'f'.repeat(768), dove: [55, 11], parlato: true } } } } } },
})

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
const cdp = await page.context().newCDPSession(page)
async function tocca(x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
const tela = page.locator('.sot-tela')
const cellaOra = async () => (await tela.getAttribute('data-eroe')).split(',').map(Number)
// dove cade sullo schermo una cella, partendo da dove sta l'eroe (la tela lo scrive)
async function schermoDi(c) {
  const [ex, ey] = await cellaOra()
  const [sx, sy] = (await tela.getAttribute('data-eroe-schermo')).split(',').map(Number)
  const s = Number(await tela.getAttribute('data-scala')) * T
  const b = await tela.boundingBox()
  return { x: b.x + sx + (c.x - ex) * s, y: b.y + sy + (c.y - ey) * s }
}
const toccaLaCella = async c => { const p = await schermoDi(c); await tocca(p.x, p.y) }
const piede = async () => (await page.locator('.sot-piede').innerText()).replace(/\s+/g, ' ')
// quanti pixel della tela sono del rosa del bersaglio (BERSAGLIO.colore, #ff7ad9)
const rosa = () => page.evaluate(() => {
  const c = document.querySelector('.sot-tela')
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
  let n = 0
  for (let i = 0; i < d.length; i += 4) if (d[i] > 235 && d[i + 1] > 100 && d[i + 1] < 150 && d[i + 2] > 195 && d[i + 2] < 235) n++
  return n
})
async function riprendi(sosta) {
  await semina(page, profilo(sosta))
  await scegli(page, 'sotterraneo')
  await page.waitForSelector('.sot-tela', { timeout: 8000 })   // si rientra già giù, dietro il velo della pausa
  await page.waitForSelector('[data-pausa]', { timeout: 3000 })
  await attendi(page, 500)
  await page.locator('[data-pausa] [data-azione="riprendi"]').click()
  await attendi(page, 300)
}

/* ---------- 1. si compare sulla scala che sale, e toccandola si risale ---------- */
await riprendi(salita)
uguale('si è al secondo piano', (await piede()).includes('piano 2 di 3'), true)
uguale('si compare dove la scala che sale c\'è', (await cellaOra()).join(','), `${scalaSu.x},${scalaSu.y}`)
controlla('la scala che sale si disegna in codice, non sparisce', await rosa() < 200)   // niente rosa: qui non c'è una missione
await scatto(page, 'scala-su-arrivo')
await toccaLaCella(scalaSu)
await page.waitForSelector('[data-azione="sali"]', { timeout: 3000 })
controlla('il foglio dice a che piano si torna', (await page.locator('[data-azione="sali"]').innerText()).includes('piano 1'))
uguale('non è l\'uscita: niente «lascio perdere»', await page.locator('[data-lascio-perdere]').count(), 0)
await scatto(page, 'scala-su-foglio')
// «resto qui» chiude e non si sale
await page.locator('[data-azione="dopo"]').click()
await attendi(page, 300)
uguale('«resto qui»: ancora al secondo piano', (await piede()).includes('piano 2 di 3'), true)
await toccaLaCella(scalaSu)
await page.waitForSelector('[data-azione="sali"]', { timeout: 3000 })
await page.locator('[data-azione="sali"]').click()
await attendi(page, 500)
uguale('si è al primo piano', (await piede()).includes('piano 1 di 3'), true)
uguale('accanto alla scala che scende, non all\'inizio del piano', (await cellaOra()).join(','), `${attesa.x},${attesa.y}`)
controlla('e non sopra di lei', !((await cellaOra())[0] === scalaGiu.x && (await cellaOra())[1] === scalaGiu.y))
uguale('e la distanza è una cella', Math.abs(attesa.x - scalaGiu.x) + Math.abs(attesa.y - scalaGiu.y), 1)
await scatto(page, 'scala-su-risalito')

/* il piano di sopra è com'era, e la sosta lo dice: il mostro battuto resta battuto */
await attendi(page, 900)
{
  const p = await leggiProfilo(page)
  const s = p?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.sosta
  uguale('la sosta dice che si è al primo piano', s?.piano, 0)
  uguale('col secondo alle spalle', s?.dietro?.map(d => d.p).join(), '1')
  uguale('il mostro battuto resta battuto', s?.robe?.cambi?.[indiceMostro]?.morto, true)
  uguale('e la scala è aperta', s?.chiave, true)
}

/* si riscende toccando la scala che scende, e si ricompare sulla scala che sale */
await toccaLaCella(scalaGiu)
await page.waitForSelector('[data-azione="scendi"]', { timeout: 5000 })
await page.locator('[data-azione="scendi"]').click()
await attendi(page, 500)
uguale('si è di nuovo al secondo piano', (await piede()).includes('piano 2 di 3'), true)
uguale('e si compare sulla scala che sale', (await cellaOra()).join(','), `${scalaSu.x},${scalaSu.y}`)

/* ---------- 2. dal primo piano la scala porta fuori, ma col foglio di «lascio perdere» ---------- */
const primo = nuova()
const nascita = cella(primo)
await riprendi(scrivi(primo, TORRE))
uguale('al primo piano', (await piede()).includes('piano 1 di 3'), true)
uguale('si compare dove c\'è la scala che sale', (await cellaOra()).join(','), `${nascita.x},${nascita.y}`)
await toccaLaCella(nascita)
await page.waitForSelector('[data-lascio-perdere]', { timeout: 3000 })
uguale('è il foglio di «lascio perdere», non una scorciatoia', await page.locator('[data-azione="sali"]').count(), 0)
controlla('che dice quello che si perde', (await page.locator('[data-lascio-perdere]').innerText()).includes('ricomincia da capo'))
await scatto(page, 'scala-su-primo-piano')
await page.locator('[data-lascio-perdere] [data-azione="scorda-no"]').click()
await attendi(page, 300)
uguale('«no, tengo la discesa»: si resta giù', await page.locator('.sot-tela').count(), 1)
uguale('e il foglio se ne va', await page.locator('[data-lascio-perdere]').count(), 0)
await toccaLaCella(nascita)
await page.waitForSelector('[data-lascio-perdere]', { timeout: 3000 })
await page.locator('[data-lascio-perdere] [data-azione="scorda-si"]').click()
await page.waitForSelector('[data-terra]', { timeout: 5000 })
uguale('«sì, risalgo»: si è sulla terra di sopra', await page.locator('[data-terra]').count(), 1)
await attendi(page, 600)
{
  const p = await leggiProfilo(page)
  uguale('e la discesa è buttata, come con «lascio perdere»', p?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.sosta ?? null, null)
}

/* ---------- 3. il bersaglio di una missione si vede ---------- */
const m = nuova(presePer({ goblin: PRESA }, 'torre'))
const g = m.livello.robe.find(r => r.missione === 'goblin')
const lui = { x: g.x, y: g.y }
// l'eroe sta a due celle, in vista: si guarda cosa la tela disegna
let accanto = null
for (const d of [-2, 2, -3, 3]) if (m.livello.calpestabile(g.x + d, g.y)) { accanto = { x: g.x + d, y: g.y }; break }
m.eroe = { x: accanto.x + 0.5, y: accanto.y + 0.5 }
m.aggiornaLuce()
await semina(page, profilo(scrivi(m, TORRE), { goblin: 'presa' }))
await scegli(page, 'sotterraneo')
await page.waitForSelector('.sot-tela', { timeout: 8000 })
await page.waitForSelector('[data-pausa]', { timeout: 3000 })
await attendi(page, 500)
await page.locator('[data-pausa] [data-azione="riprendi"]').click()
await attendi(page, 900)
const colorato = await rosa()
controlla('in vista il bersaglio ha il suo rosa: aura, contorno e targhetta col nome', colorato > 600, `${colorato} pixel rosa`)
uguale('la freccina lo indica ancora', await page.locator('[data-rotta]').getAttribute('data-verso'), 'qui')
await scatto(page, 'bersaglio-in-vista')

uguale('nessun errore in console', errori.join(' · '), '')
nota(`seme ${SEME}: scala che sale in ${scalaSu.x},${scalaSu.y}, risalendo si ricompare in ${attesa.x},${attesa.y}; ` +
     `bersaglio in ${lui.x},${lui.y}, ${colorato} pixel rosa`)
await browser.close()
riassunto('la scala che sale e il bersaglio, col dito')
