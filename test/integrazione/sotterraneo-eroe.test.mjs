/* ═══════════════════════════════════════════════════════════════════
   L'EROE CHE SALE DI LIVELLO, IL MOSTRO GROSSO E UN LEGGENDARIO, COL DITO

   (docs/sotterraneo/livelli.md, grossi.md, rarita.md)
   Sopra: il «+» d'oro sul globo dell'esperienza dice che ci sono punti
   da dare; la pagina dell'eroe si apre dal globo e dal ritratto, dice
   livello, esperienza e i numeri, e il «+» di una caratteristica che
   correrebbe troppo avanti è spento mentre quella rimasta indietro
   brilla (la regola del bilanciamento); un punto dato si vede subito; i
   Tesori mostrano il leggendario trovato e il posto vuoto degli altri.
   Giù, all'ultimo piano della cripta (`#piano=2`): un leggendario caduto
   accanto all'ingresso (`#sotterraneo=leggendario`) col nome in oro e la
   sua storia, che si raccoglie col dito e finisce fra i Tesori; Re Ossuto
   nella stanza della scala, con la sua vita in cima allo schermo e la sua
   figura nello scontro; battuto, l'eroe sale di livello e lo si festeggia.
   Si tocca come un bambino (`Input.dispatchTouchEvent` via CDP).
   `node test/esegui.mjs sotterraneo-eroe`
   tempo: 150
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, scendiNelSotterraneo }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { T } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { COSE } from '../../src/giochi/sotterraneo/dati/cose.js'
import { sogliaDi } from '../../src/giochi/sotterraneo/dati/livelli.js'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { percorso } from '../../src/motore/passi.js'

const roba = { v: 1, gemme: 40, zaino: ['pozione'], mano: 'spada@6.r.att.fuoco.vita', mancina: 'scudo-legno@4',
               corpo: 'panciotto@4', dito: null, torcia: 12, torce: 0 }
const avventura = extra => ({ tappa: 1, libera: false, stelle: { 0: 3 }, missioni: {}, roba,
  terra: { nebbia: 'f'.repeat(768), dove: [55, 11], parlato: true }, ...extra })

/* ── il piano: l'ultimo della cripta, dove il mostro grosso si raggiunge senza altri mostri né porte per strada ── */
function scegliIlPiano() {
  for (let seme = 1; seme < 800; seme++) {
    const c = new Corsa(CAMPAGNA[0], { seme, eroe: 'cavaliere', roba })
    c.piano = CAMPAGNA[0].piani - 1
    c.nuovoPiano()
    const L = c.livello
    const da = { x: Math.floor(c.eroe.x), y: Math.floor(c.eroe.y) }
    const g = L.robe.find(r => r.che === 'mostro' && r.grosso)
    if (!g) continue
    const stanza = q => L.stanzaDi(q.x, q.y)?.id
    const libera = (x, y) => L.calpestabile(x, y) && !L.robe.some(r => r.x === x && r.y === y && ['porta', 'mostro'].includes(r.che))
    const mostri = L.robe.filter(r => r.che === 'mostro' && r !== g)
    const via = percorso(libera, da, g, { arrivoLibero: false })
    if (!via || via.some(q => mostri.some(m => stanza(m) === stanza(q)))) continue
    // dove cade il leggendario della prova: accanto all'ingresso, come lo posa il gioco
    const dove = c.posaPezzo('spada', { x: da.x + 1, y: da.y })
    return { seme, g, dove, L }
  }
  return null
}
const piano = scegliIlPiano()
controlla('c\'è un ultimo piano della cripta col mostro grosso a portata, senza altri mostri per strada', !!piano)
const L = piano.L

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
// livello 12 con nove punti dati alla forza e due ancora da dare: il decimo alla forza la staccherebbe di dieci dalle altre
await semina(page, {
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: 1, libera: false, stelle: { 0: 3 },
    cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: avventura({
      crescita: { esp: sogliaDi(12), forza: 9, tempra: 0, scorza: 0, fortuna: 0 }, tesori: ['zanna-del-drago'] }) } } } },
})
await scegli(page, 'sotterraneo')
await page.waitForSelector('[data-terra]', { timeout: 5000 })
await attendi(page, 600)

const cdp = await page.context().newCDPSession(page)
async function tocca(x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
async function toccaIl(sel) {
  const b = await page.locator(sel).first().boundingBox()
  await tocca(b.x + b.width / 2, b.y + b.height / 2)
}
const riga = k => page.locator(`[data-caratteristica="${k}"]`)

/* ---------- 1. sopra: i punti da dare si vedono sulla barra ---------- */
uguale('il tasto del globo sa il livello', await page.locator('[data-azione="eroe-pagina"]').getAttribute('data-livello'), '12')
controlla('il globo dice fatta/serve', /^\d+\/\d+$/.test((await page.locator('[data-globo="esperienza"] .sot-globo-numero').textContent()).trim()))
uguale('e il «+» d\'oro dice che ci sono punti da dare', await page.locator('[data-azione="eroe-pagina"]').getAttribute('data-punti'), '2')
uguale('sopra non c\'è la carta di chi scende: il livello sta sul globo e nella pagina',
       await page.locator('[data-chi-sopra], [data-roba-sopra], [data-azione="ritratto"], [data-azione="eroe"]').count(), 0)
{
  /* la mappa si guarda tutta fino alla barra: l'eroe non finisce sotto, e in fondo non c'è una fascia vuota */
  const eroe = await page.locator('[data-eroe-terra]').boundingBox()
  const barra = await page.locator('[data-barra-giu]').boundingBox()
  controlla('l\'eroe sta sopra la barra', eroe.y + eroe.height < barra.y, `${eroe.y + eroe.height} contro ${barra.y}`)
}

/* ---------- 2. la pagina dell'eroe, dal globo ---------- */
await toccaIl('[data-azione="eroe-pagina"]')
await page.waitForSelector('[data-pagina-eroe]', { timeout: 3000 })
await attendi(page, 300)
uguale('il globo apre la pagina dell\'eroe', await page.locator('[data-livello-eroe]').getAttribute('data-livello'), '12')
controlla('e c\'è «Cambia eroe», che sta nella pagina e non sulla mappa',
          /cambia eroe/i.test(await page.locator('[data-pagina-eroe] [data-azione="eroe"]').innerText()))
await toccaIl('[data-pagina-eroe] [data-chiudi]')
await attendi(page, 300)
uguale('la ✕ la chiude', await page.locator('[data-pagina-eroe]').count(), 0)
await toccaIl('[data-azione="eroe-pagina"]')
await page.waitForSelector('[data-pagina-eroe]', { timeout: 3000 })
await attendi(page, 300)
uguale('e il globo la riapre', await page.locator('[data-pagina-eroe]').count(), 1)
uguale('dice i punti da dare', await page.locator('[data-punti-da-dare]').getAttribute('data-n'), '2')
const att = Number(await page.locator('[data-numero="att"] b').textContent())
controlla('e i numeri che decidono uno scontro: attacco e difesa stanno qui', att > 3 && (await page.locator('[data-numero="dif"]').count()) === 1, String(att))
uguale('la forza correrebbe troppo avanti: il suo «+» è spento', await riga('forza').locator('[data-azione="dai"]').isDisabled(), true)
uguale('e lo dice', await riga('forza').getAttribute('data-trattenuta'), '1')
uguale('la tempra, rimasta indietro, brilla', await riga('tempra').getAttribute('data-indietro'), '1')
controlla('«prima un po\' di questa»', /prima un po' di questa/.test(await riga('tempra').innerText()), await riga('tempra').innerText())
await scatto(page, 'eroe-pagina')
{
  const vita0 = Number(await page.locator('[data-numero="vita"] b').textContent())
  await toccaIl('[data-caratteristica="tempra"] [data-azione="dai"]')
  await attendi(page, 300)
  uguale('un punto alla tempra: la tempra sale', await riga('tempra').getAttribute('data-dati'), '1')
  uguale('e la vita con lei, subito', Number(await page.locator('[data-numero="vita"] b').textContent()), vita0 + 3)
  uguale('resta un punto', await page.locator('[data-punti-da-dare]').getAttribute('data-n'), '1')
  uguale('e il «+» sul globo lo dice', await page.locator('[data-azione="eroe-pagina"]').getAttribute('data-punti'), '1')
}

/* ---------- 3. i Tesori ---------- */
await toccaIl('[data-azione="tesori"]')
await page.waitForSelector('[data-tesori]', { timeout: 3000 })
await attendi(page, 300)
uguale('il leggendario trovato c\'è, col suo nome', await page.locator('[data-tesoro="zanna-del-drago"]').getAttribute('data-trovato'), '1')
controlla('e la sua storia', /drago/.test(await page.locator('[data-tesoro="zanna-del-drago"]').innerText()))
controlla('gli altri sono un posto vuoto', (await page.locator('[data-tesoro][data-trovato="0"]').count()) >= 10)
controlla('senza dire «in arrivo»', !/in arrivo/i.test(await page.locator('[data-tesori]').innerText()))
await scatto(page, 'eroe-tesori')
{
  const s = await page.locator('.sot-sipario').boundingBox(), c = await page.locator('.sot-cornice').boundingBox()
  await tocca(s.x + s.width / 2, Math.max(s.y + 4, (s.y + c.y) / 2))
  await attendi(page, 300)
  uguale('un tocco fuori chiude i Tesori e la pagina', await page.locator('[data-tesori], [data-pagina-eroe]').count(), 0)
}

/* ---------- 4. giù: un leggendario caduto ---------- */
// un eroe nuovo per la discesa: a un soffio dal livello 2, per vederlo salire battendo il mostro grosso
await semina(page, {
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: 1, libera: false, stelle: { 0: 3 },
    cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: avventura({ crescita: { esp: sogliaDi(2) - 3 } }) } } } },
})
await scegli(page, 'sotterraneo')
await page.waitForSelector('[data-terra]', { timeout: 5000 })
await page.evaluate(s => { location.hash = `seme=${s}&piano=2&sotterraneo=leggendario` }, piano.seme)
await scendiNelSotterraneo(page, 0)
await page.waitForSelector('.sot-tela', { timeout: 5000 })
await page.waitForSelector('[data-leggendario]', { timeout: 3000 })
const leggendario = await page.locator('[data-leggendario]').getAttribute('data-cosa')
controlla('cade un leggendario: il nome in oro, la sua storia', COSE[leggendario]?.rarita === 'leggendario' &&
          (await page.locator('[data-leggendario]').innerText()).includes(COSE[leggendario].nome) &&
          (await page.locator('[data-leggendario]').innerText()).includes(COSE[leggendario].storia), leggendario)
await scatto(page, 'eroe-leggendario')

const tela = page.locator('.sot-tela')
const cellaGiu = () => tela.getAttribute('data-eroe')
async function schermoDi(c) {
  const [ex, ey] = (await cellaGiu()).split(',').map(Number)
  const [sx, sy] = (await tela.getAttribute('data-eroe-schermo')).split(',').map(Number)
  const s = Number(await tela.getAttribute('data-scala')) * T
  const b = await tela.boundingBox()
  return { x: b.x + sx + (c.x - ex) * s, y: b.y + sy + (c.y - ey) * s, b }
}
const dentro = ({ x, y, b }) => x > b.x + 30 && x < b.x + b.width - 30 && y > b.y + 140 && y < b.y + b.height - 50
async function fermoGiu() {
  let prima = null
  for (let i = 0; i < 40; i++) {
    const ora = await cellaGiu()
    if (ora === prima) return
    prima = ora
    await attendi(page, 300)
  }
}
await attendi(page, 4500)   // la festa del leggendario sparisce da sé
uguale('la festa del leggendario va via da sola', await page.locator('[data-leggendario]').count(), 0)
{
  const s = await schermoDi(piano.dove)
  await tocca(s.x, s.y)
  await attendi(page, 900)
  await fermoGiu()
}
uguale('toccato, il leggendario finisce nello zaino o addosso', await page.locator('.sot-tela').count(), 1)

/* ---------- 5. il mostro grosso: la sua vita in cima, la sua figura nello scontro ---------- */
const vuota = (x, y) => L.calpestabile(x, y) && !L.robe.some(r => r.x === x && r.y === y && !['gemme', 'scala-su', 'cosa'].includes(r.che))
for (let giro = 0; giro < 30 && !(await page.locator('.sot-velo-scontro').count()); giro++) {
  // un tocco accanto a una curiosità la apre: si lascia perdere e si va avanti
  if (await page.locator('[data-azione="dopo"]').count()) { await page.locator('[data-azione="dopo"]').first().click(); await attendi(page, 300) }
  const [ex, ey] = (await cellaGiu()).split(',').map(Number)
  const via = percorso(vuota, { x: ex, y: ey }, piano.g, { arrivoLibero: false }) || []
  let tappa = null
  for (const q of via.slice(0, -1)) { const s = await schermoDi(q); if (dentro(s)) tappa = s }
  if (via.length <= 1) { const s = await schermoDi(piano.g); if (dentro(s)) await tocca(s.x, s.y) } else if (tappa) await tocca(tappa.x, tappa.y)
  await attendi(page, 500)
  await fermoGiu()
}
await page.waitForSelector('.sot-velo-scontro', { timeout: 10000 })   // lo scontro: il tasto della fuga può mancare
uguale('la vita del mostro grosso è in cima allo schermo', await page.locator('[data-grosso]').getAttribute('data-chi'), 'ossuto')
controlla('col suo nome', (await page.locator('[data-grosso]').innerText()).includes('Re Ossuto'))
uguale('nello scontro c\'è la sua figura, disegnata in codice', await page.locator('.sot-modale [data-figura-grosso]').count(), 1)
await scatto(page, 'eroe-grosso')
const ossa0 = Number(await page.locator('[data-grosso]').getAttribute('data-ossa'))
let calata = false
for (let n = 0; n < 12 && (await page.locator('.sot-velo-scontro').count()); n++) {
  await page.waitForSelector('.sot-domanda .qz-tasto', { timeout: 5000 }).catch(() => {})
  await attendi(page, 400)
  const t = page.locator('.sot-domanda .qz-tasto[data-giusta]')
  if (await t.count()) await t.first().click()
  await attendi(page, 1200)
  if (await page.locator('[data-grosso]').count() && Number(await page.locator('[data-grosso]').getAttribute('data-ossa')) < ossa0) calata = true
}
controlla('rispondendo giusto la sua vita in cima cala (o cade al primo colpo)', calata || ossa0 <= 0 ||
          !(await page.locator('[data-grosso]').count()))
uguale('battuto, la sua vita in cima se ne va', await page.locator('[data-grosso]').count(), 0)

/* ---------- 6. il livello salito si festeggia ---------- */
await page.waitForSelector('[data-livello-su]', { timeout: 4000 })
uguale('la festa del livello', await page.locator('[data-livello-su]').getAttribute('data-livello'), '2')
await scatto(page, 'eroe-livello')
uguale('il tasto del globo sa il livello nuovo', await page.locator('[data-azione="eroe-pagina"]').getAttribute('data-livello'), '2')
uguale('e il «+» d\'oro: un punto da dare', await page.locator('[data-azione="eroe-pagina"]').getAttribute('data-punti'), '1')
await toccaIl('[data-azione="eroe-pagina"]')
await page.waitForSelector('[data-pagina-eroe]', { timeout: 3000 })
await attendi(page, 300)
{
  const att = Number(await page.locator('[data-numero="att"] b').textContent())
  await toccaIl('[data-caratteristica="forza"] [data-azione="dai"]')
  await attendi(page, 300)
  uguale('giù, un punto alla forza alza subito l\'attacco', Number(await page.locator('[data-numero="att"] b').textContent()), att + 1)
}
await toccaIl('[data-azione="tesori"]')
await page.waitForSelector('[data-tesori]', { timeout: 3000 })
uguale('e il leggendario raccolto è fra i Tesori', await page.locator(`[data-tesoro="${COSE[leggendario].unico}"]`).getAttribute('data-trovato'), '1')
await toccaIl('[data-tesori] [data-chiudi]')
await attendi(page, 300)

uguale('nessun errore in console', errori.join(' · '), '')
nota(`il piano della prova: seme ${piano.seme}, ${piano.g.nome} in ${piano.g.x},${piano.g.y}`)
await browser.close()
riassunto('l\'eroe, il mostro grosso e il leggendario col dito')
