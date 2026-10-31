/* ═══════════════════════════════════════════════════════════════════
   LA SCALA CHE SALE E IL BERSAGLIO DELLA MISSIONE, COL DITO VERO

   (docs/sotterraneo/scala-che-sale.md, docs/sotterraneo/missioni.md «Dove sta»)
   In ogni piano, dove l'eroe compare arrivando dall'alto, c'è una scala che
   sale. Toccarla porta al piano di sopra, accanto alla scala che scende, col
   piano com'era; dal primo piano è l'uscita, ma col foglio di «lascio
   perdere» (mai un modo gratis di saltare il portale). Il bersaglio di una
   missione si vede da lontano: più grande (1,4 volte), con un'aura rosa che pulsa e il
   suo nome sopra la testa. L'aura e il nome sono disegnati nella scena WebGL, che non si rilegge: la prova misura la sua
   grandezza (`statoDi(...).alto`, con e senza la missione) e la freccina che lo indica; l'aura si guarda nelle foto (`--scatti`).

   Le discese si cominciano dalla sosta scritta in Node (lo stesso motore
   che gira nel gioco): si sa dov'è la scala, dove si compare e cosa è
   cambiato, e il dito si controlla su quello. Dov'è una cella sullo schermo lo dice `__sotterraneo3d.aSchermo`, dov'è
   l'eroe la tela (`data-eroe`). Si tocca come un telefono
   (`Input.dispatchTouchEvent` via CDP). Quando si lascia la discesa si sale sul mondo 3D di sopra.
   `node test/esegui.mjs sotterraneo-scale`
   tempo: 120
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, leggiProfilo }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
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
  coins: 300,
  campagne: { sotterraneo: { tappa: TORRE, libera: false, stelle: {},
    cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: { tappa: TORRE, libera: false, stelle: {},
      missioni, roba, sosta, mondo: { parlato: true } } } } } },
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
const tela = page.locator('[data-tela="3d"]')
const cellaOra = async () => (await tela.getAttribute('data-eroe')).split(',').map(Number)
// dove cade sullo schermo una cella (a quota `su`), in px della pagina
async function schermoDi(c, su = 0.4) {
  const [sx, sy] = await page.evaluate(([a, b, q]) => window.__sotterraneo3d.aSchermo(a, q, b), [c.x + 0.5, c.y + 0.5, su])
  const b = await tela.boundingBox()
  return { x: b.x + sx, y: b.y + sy }
}
const toccaLaCella = async c => { const p = await schermoDi(c); await tocca(p.x, p.y) }
const piede = async () => (await page.locator('.sot-piede').innerText()).replace(/\s+/g, ' ')
// il motore non ha più strada da fare e la telecamera morbida ha finito (in SwiftShader un fotogramma è lento)
async function fermoGiu() {
  await page.waitForFunction(() => { const c = window.__sotterraneo3d && window.__sotterraneo3d.corsa; return c && !(c.strada && c.strada.length) }, null, { timeout: 20000 })
  await attendi(page, 1200)
}
async function riprendi(sosta, missioni = {}) {
  await semina(page, profilo(sosta, missioni))
  await scegli(page, 'sotterraneo')
  await page.waitForSelector('[data-pausa]', { timeout: 20000 })   // si rientra già giù, dietro il velo della pausa
  await attendi(page, 500)
  await page.locator('[data-pausa] [data-azione="riprendi"]').click()
  await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.grafica().figure > 0, null, { timeout: 30000 })
  await attendi(page, 600)
}

/* ---------- 1. si compare sulla scala che sale, e toccandola si risale ---------- */
await riprendi(salita)
uguale('si è al secondo piano', (await piede()).includes('piano 2 di 3'), true)
uguale('si compare dove la scala che sale c\'è', (await cellaOra()).join(','), `${scalaSu.x},${scalaSu.y}`)
controlla('la scala che sale c\'è nel piano, sotto l\'eroe', await page.evaluate(([x, y]) => window.__sotterraneo3d.corsa.livello.robe.some(r => r.che === 'scala-su' && r.x === x && r.y === y), [scalaSu.x, scalaSu.y]))
await scatto(page, 'scala-su-arrivo')
await toccaLaCella(scalaSu)
await page.waitForSelector('[data-azione="sali"]', { timeout: 3000 })
controlla('il foglio dice a che piano si torna', (await page.locator('[data-azione="sali"]').innerText()).includes('piano 1'))
uguale('non è l\'uscita: niente «lascio perdere»', await page.locator('[data-lascio-perdere]').count(), 0)
await scatto(page, 'scala-su-foglio')
// «resto qui» chiude e non si sale
await page.locator('[data-azione="dopo"]').click()
await attendi(page, 600)
uguale('«resto qui»: ancora al secondo piano', (await piede()).includes('piano 2 di 3'), true)
await toccaLaCella(scalaSu)
await page.waitForSelector('[data-azione="sali"]', { timeout: 3000 })
await page.locator('[data-azione="sali"]').click()
await attendi(page, 1500)
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
await attendi(page, 1500)
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
uguale('«no, tengo la discesa»: si resta giù', await page.locator('[data-tela="3d"]').count(), 1)
uguale('e il foglio se ne va', await page.locator('[data-lascio-perdere]').count(), 0)
await toccaLaCella(nascita)
await page.waitForSelector('[data-lascio-perdere]', { timeout: 3000 })
await page.locator('[data-lascio-perdere] [data-azione="scorda-si"]').click()
await page.waitForSelector('[data-mondo3d]', { timeout: 15000 })
uguale('«sì, risalgo»: si è sul mondo di sopra', await page.locator('[data-mondo3d]').count(), 1)
await attendi(page, 600)
{
  const p = await leggiProfilo(page)
  uguale('e la discesa è buttata, come con «lascio perdere»', p?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.sosta ?? null, null)
}

/* ---------- 3. il bersaglio di una missione si vede ---------- */
const m = nuova(presePer({ goblin: PRESA }, 'torre'))
const g = m.livello.robe.find(r => r.missione === 'goblin')
const lui = { x: g.x, y: g.y }
// l'eroe sta a due celle, in vista: si guarda cosa la scena disegna
let accanto = null
for (const d of [-2, 2, -3, 3]) if (m.livello.calpestabile(g.x + d, g.y)) { accanto = { x: g.x + d, y: g.y }; break }
m.eroe = { x: accanto.x + 0.5, y: accanto.y + 0.5 }
m.aggiornaLuce()
await riprendi(scrivi(m, TORRE), { goblin: 'presa' })
const grandezza = () => page.evaluate(() => {
  const S = window.__sotterraneo3d, r = S.corsa.livello.robe.find(q => q.missione === 'goblin')
  return S.statoDi(r).alto
})
const colorato = await grandezza()
// la stessa figura senza la missione, un attimo dopo (la scena la ridisegna a ogni fotogramma): il bersaglio è più grande di 1,4 volte
const normale = await page.evaluate(async () => {
  const S = window.__sotterraneo3d, r = S.corsa.livello.robe.find(q => q.missione === 'goblin'), m = r.missione
  r.missione = null
  await new Promise(f => setTimeout(f, 1500))
  const a = S.statoDi(r).alto
  r.missione = m
  return a
})
controlla('in vista il bersaglio è più grande: 1,4 volte la sua figura normale', colorato > normale * 1.25 && colorato < normale * 1.55, `${colorato} contro ${normale}`)
uguale('la freccina lo indica ancora', await page.locator('[data-rotta]').getAttribute('data-verso'), 'qui')
await scatto(page, 'bersaglio-in-vista')

uguale('nessun errore in console', errori.join(' · '), '')
nota(`seme ${SEME}: scala che sale in ${scalaSu.x},${scalaSu.y}, risalendo si ricompare in ${attesa.x},${attesa.y}; ` +
     `bersaglio in ${lui.x},${lui.y}, alto ${colorato} contro ${normale}`)
await browser.close()
riassunto('la scala che sale e il bersaglio, col dito')
