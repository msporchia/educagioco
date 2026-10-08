/* ═══════════════════════════════════════════════════════════════════
   LA BARRA IN BASSO E IL TOCCO ALTROVE, COL DITO VERO

   La barra della discesa è quella di Diablo (docs/sotterraneo/barra.md):
   il globo rosso della vita, il globo d'oro della luce, in mezzo le
   caselle. E quello che si legge e basta si chiude toccando il campo, con
   l'eroe che intanto cammina; quello che chiede una scelta no
   (docs/core/interfaccia.md, «Un tocco altrove chiude»).

   Qui, nella prima discesa scelta dal seme (`#seme=`, come
   `sotterraneo-portale`): la luce cala entrando nelle stanze e guizza
   agli sgoccioli; una curiosità, con la domanda che non si chiude
   toccando fuori e la battuta che invece sì, mentre l'eroe parte; un
   mostro che colpisce e il globo della vita che scende; la pozione bevuta
   dalla casella; lo zaino e la mappa grande chiusi da un tocco sul campo;
   «lascio perdere» che resta. Poi le foto: la vita a metà con la luce che
   guizza (da una sosta), e la barra a 320 px.
   Si tocca come un bambino (`Input.dispatchTouchEvent` via CDP).
   `node test/esegui.mjs sotterraneo-barra`
   tempo: 150
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, scendiNelSotterraneo }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { T } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { scrivi } from '../../src/giochi/sotterraneo/motore/sosta.js'
import { percorso } from '../../src/motore/passi.js'

// quattro stanze di torcia e niente alla cintura: dopo una stanza nuova la luce è agli sgoccioli. Due pozioni
const roba = { v: 1, gemme: 40, zaino: ['pozione-piccola', 'pozione'], mano: 'spada', mancina: null, corpo: null,
               dito: null, torcia: 4, torce: 0 }

/* ── il piano: una curiosità in un'altra stanza e un mostro, senza mostri né porte per strada ── */
function scegliIlPiano() {
  let meglio = null
  for (let seme = 1; seme < 600; seme++) {
    const c = new Corsa(CAMPAGNA[0], { seme, eroe: 'cavaliere', roba })
    const L = c.livello
    const da = { x: Math.floor(c.eroe.x), y: Math.floor(c.eroe.y) }
    const stanza = q => L.stanzaDi(q.x, q.y)?.id
    const libera = (x, y) => L.calpestabile(x, y) && !L.robe.some(r => r.x === x && r.y === y && r.che === 'porta')
    const mostri = L.robe.filter(r => r.che === 'mostro')
    const tranquilla = (s, salvo) => !mostri.some(m => m !== salvo && stanza(m) === s)
    const strada = (a, b, salvo) => {
      const via = percorso(libera, a, b)
      return via && via.every(q => tranquilla(stanza(q), salvo)) ? via : null
    }
    const curiosita = L.robe.filter(r => r.che === 'curiosita' && stanza(r) !== stanza(da))
      .map(r => ({ r, via: strada(da, r) })).filter(x => x.via).sort((a, b) => a.via.length - b.via.length)[0]
    if (!curiosita) continue
    const mostro = mostri.map(m => ({ m, via: strada(curiosita.r, m, m) })).filter(x => x.via)
      .sort((a, b) => a.via.length - b.via.length)[0]
    if (!mostro) continue
    const costo = curiosita.via.length + mostro.via.length
    if (!meglio || costo < meglio.costo) meglio = { seme, costo, c, curiosita: curiosita.r, mostro: mostro.m }
  }
  return meglio
}
const piano = scegliIlPiano()
controlla('c\'è un piano della prima discesa con una curiosità e un mostro senza porte per strada', !!piano)
const L = piano.c.livello

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
const avventura = extra => ({ tappa: 0, libera: false, stelle: {}, missioni: {}, roba,
  terra: { nebbia: 'f'.repeat(768), dove: [55, 11], parlato: true }, ...extra })
await semina(page, {
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: 0, libera: false, stelle: {},
    cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: avventura() } } } },
})
await scegli(page, 'sotterraneo')
await page.waitForSelector('[data-terra]', { timeout: 5000 })

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

/* ---------- 0. sopra: il diario si chiude toccando il prato, e l'eroe ci va ---------- */
await toccaIl('[data-azione="diario"]')
await page.waitForSelector('[data-diario]', { timeout: 3000 })
await attendi(page, 300)
{
  const prima = await page.locator('[data-eroe-terra]').getAttribute('data-cella')
  const m = await page.locator('[data-diario] .sot-modale').boundingBox()
  const v = await page.locator('[data-terra]').boundingBox()
  const su = (await page.locator('.sot-terra-sopra').boundingBox())?.height || 0
  const y = Math.max(v.y + su + 20, m.y - 40)
  controlla('sopra il diario c\'è prato da toccare', y < m.y - 10, `${y} / ${m.y}`)
  await tocca(v.x + v.width / 2 + 60, y)
  await attendi(page, 300)
  uguale('sopra, il diario si chiude toccando fuori', await page.locator('[data-diario]').count(), 0)
  await attendi(page, 500)
  controlla('e quel tocco porta l\'eroe sul prato', (await page.locator('[data-eroe-terra]').getAttribute('data-cella')) !== prima, prima)
  await page.waitForFunction(() => document.querySelector('[data-eroe-terra]')?.dataset.cammina === '0', null, { timeout: 15000 })
}

await page.evaluate(s => { location.hash = 'seme=' + s }, piano.seme)
await scendiNelSotterraneo(page, 0)
await page.waitForSelector('.sot-tela', { timeout: 5000 })
await attendi(page, 700)

/* ── giù: dov'è l'eroe lo dice la tela (come in sotterraneo-portale) ── */
const tela = page.locator('.sot-tela')
const cellaGiu = () => tela.getAttribute('data-eroe')
async function schermoDi(c) {
  const [ex, ey] = (await cellaGiu()).split(',').map(Number)
  const [sx, sy] = (await tela.getAttribute('data-eroe-schermo')).split(',').map(Number)
  const s = Number(await tela.getAttribute('data-scala')) * T
  const b = await tela.boundingBox()
  return { x: b.x + sx + (c.x - ex) * s, y: b.y + sy + (c.y - ey) * s, b }
}
// sullo schermo e lontano dalla mappina (in alto a destra) e dalla riga in fondo; la barra sta fuori dalla tela
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
const vuota = (x, y) => L.calpestabile(x, y) && !L.robe.some(r => r.x === x && r.y === y && r.che !== 'gemme')
// fin accanto alla cosa, toccando la cella più lontana della strada che sta sullo schermo; poi la si tocca
async function vaiGiu(a, { toccala = true } = {}) {
  for (let giro = 0; giro < 30; giro++) {
    if (a.che !== 'mostro' && await page.locator('[data-azione="scappa"]').count()) {
      await page.locator('[data-azione="scappa"]').click()
      await attendi(page, 300)
      continue
    }
    if (await page.locator('.sot-domanda, [data-azione="scappa"]').count()) break
    const [ex, ey] = (await cellaGiu()).split(',').map(Number)
    const via = percorso(vuota, { x: ex, y: ey }, a, { arrivoLibero: false }) || []
    if (via.length <= 1) {
      const qui = await schermoDi(a)
      if (toccala && dentro(qui)) await tocca(qui.x, qui.y)
      await attendi(page, 300)
      await fermoGiu()
      return
    }
    let tappa = null
    for (const q of via.slice(0, -1)) { const s = await schermoDi(q); if (dentro(s)) tappa = s }
    if (!tappa) break
    await tocca(tappa.x, tappa.y)
    await attendi(page, 300)
    await fermoGiu()
  }
}
// una cella vuota sullo schermo, a qualche passo dall'eroe, dove si arriva: per il tocco che chiude e cammina
async function unaCellaLibera(min = 3) {
  const [ex, ey] = (await cellaGiu()).split(',').map(Number)
  let meglio = null
  for (let y = 0; y < L.alto; y++) for (let x = 0; x < L.largo; x++) {
    const d = Math.abs(x - ex) + Math.abs(y - ey)
    if (d < min || !vuota(x, y)) continue
    const via = percorso(vuota, { x: ex, y: ey }, { x, y })
    if (!via) continue
    const s = await schermoDi({ x, y })
    if (!dentro(s)) continue
    if (!meglio || d < meglio.d) meglio = { x, y, d, s }
  }
  return meglio
}
async function rispondi(giusto = true) {
  await page.waitForSelector('.sot-domanda .qz-tasto', { timeout: 5000 })
  await attendi(page, 400)
  const tasto = page.locator(giusto ? '.sot-domanda .qz-tasto[data-giusta]' : '.sot-domanda .qz-tasto:not([data-giusta])')
  await ((await tasto.count()) ? tasto.first() : page.locator('.sot-domanda .qz-tasto').first()).click()
  await attendi(page, 1300)
}
const globo = async (tipo, campo = 'data-quota') => page.locator(`[data-globo="${tipo}"]`).getAttribute(campo)
const quota = async tipo => Number(await globo(tipo))
const numeroDel = async tipo => Number((await page.locator(`[data-globo="${tipo}"] .sot-globo-numero`).textContent()) || 0)
const pozioni = async () => Number(await page.locator('[data-casella-barra="pozione"]').getAttribute('data-n'))

/* ---------- 1. la barra: due globi pieni, le caselle ---------- */
uguale('la barra in basso c\'è', await page.locator('[data-barra-giu]').count(), 1)
uguale('il globo della vita è pieno', await quota('vita'), 1)
const luce0 = await quota('luce')
controlla('il globo della luce dice la torcia (4 stanze su 12)', Math.abs(luce0 - 4 / 12) < 0.01, String(luce0))
uguale('le due pozioni sulla casella', await pozioni(), 2)
uguale('le carte di prima non ci sono più', await page.locator('[data-torcia], .sot-zaino-tasto').count(), 0)
uguale('il posto per l\'esperienza c\'è, vuoto', await page.locator('[data-esperienza]').count(), 1)
await scatto(page, 'barra-piena')

/* ---------- 2. la curiosità: la domanda resta, la battuta si chiude toccando il campo ---------- */
await vaiGiu(piano.curiosita)
await page.waitForSelector('.sot-domanda', { timeout: 8000 })
const luce1 = await quota('luce')
controlla('entrando in un\'altra stanza il globo della luce scende', luce1 < luce0, `${luce0} → ${luce1}`)
uguale('agli sgoccioli e senza scorta guizza', await globo('luce', 'data-guizza'), '1')
{
  const prima = await cellaGiu()
  const altrove = await unaCellaLibera()
  await tocca(altrove.s.x, altrove.s.y)
  await attendi(page, 700)
  uguale('una domanda non si chiude toccando fuori', await page.locator('.sot-domanda').count(), 1)
  uguale('e quel tocco non fa camminare', await cellaGiu(), prima)
}
await rispondi(true)
await page.waitForSelector('.sot-storia', { timeout: 5000 })
controlla('la battuta dice cosa si è guadagnato', (await page.locator('.sot-cambio').count()) === 1)
await scatto(page, 'barra-battuta')
{
  const prima = await cellaGiu()
  const altrove = await unaCellaLibera()
  await tocca(altrove.s.x, altrove.s.y)
  await attendi(page, 150)
  uguale('un tocco sul campo chiude la battuta', await page.locator('.sot-storia').count(), 0)
  await attendi(page, 600)
  controlla('e intanto l\'eroe cammina verso dove si è toccato', (await cellaGiu()) !== prima, prima)
  await fermoGiu()
  uguale('arrivato dove si è toccato', await cellaGiu(), `${altrove.x},${altrove.y}`)
  uguale('e il tocco non ha aperto nient\'altro', await page.locator('.sot-foglio, .sot-velo, .sot-sipario').count(), 0)
}

/* ---------- 3. un mostro colpisce: il globo della vita scende ---------- */
await vaiGiu(piano.mostro)
await page.waitForSelector('[data-azione="scappa"]', { timeout: 10000 })
const vita0 = await numeroDel('vita')
await rispondi(false)
// dopo uno sbaglio la domanda si ferma a spiegare: il colpo arriva quando l'esito scade
await page.waitForFunction(v => Number(document.querySelector('[data-globo="vita"] .sot-globo-numero')?.textContent) < v,
                           vita0, { timeout: 15000 }).catch(() => {})
const vita1 = await numeroDel('vita')
controlla('sbagliando, il mostro colpisce e il numero cala', vita1 < vita0, `${vita0} → ${vita1}`)
controlla('e il globo si svuota', (await quota('vita')) < 1, await globo('vita'))
await page.locator('[data-azione="scappa"]').click()
await attendi(page, 500)
await fermoGiu()
await scatto(page, 'barra-colpito')

/* ---------- 4. la pozione si beve dalla casella ---------- */
{
  const n0 = await pozioni(), v0 = await numeroDel('vita')
  await toccaIl('[data-azione="bevi"]')
  await attendi(page, 500)
  uguale('un tocco sulla 🧪 beve, e il numero cala', await pozioni(), n0 - 1)
  controlla('e la vita risale', (await numeroDel('vita')) > v0, `${v0} → ${await numeroDel('vita')}`)
  uguale('senza aprire lo zaino', await page.locator('[data-zaino]').count(), 0)
}

/* ---------- 5. lo zaino si chiude toccando il campo fuori dalla cornice ---------- */
await toccaIl('[data-azione="zaino"]')
await page.waitForSelector('[data-zaino]', { timeout: 3000 })
await attendi(page, 300)
{
  const sip = await page.locator('.sot-sipario').boundingBox()
  const cor = await page.locator('.sot-cornice').boundingBox()
  const t = await tela.boundingBox()
  const prima = await cellaGiu()
  const y = (sip.y + cor.y) / 2
  if (cor.y - sip.y > 24 && y > t.y) {
    await tocca(t.x + t.width / 2, y)
    await attendi(page, 300)
    uguale('lo zaino si chiude toccando fuori', await page.locator('[data-zaino]').count(), 0)
    await attendi(page, 500)
    controlla('e l\'eroe va dove si è toccato', (await cellaGiu()) !== prima || (await page.locator('.sot-avviso').count()) > 0,
              prima)
    await fermoGiu()
  } else {
    nota('lo zaino riempie lo schermo: niente posto fuori dalla cornice da toccare')
    await toccaIl('[data-zaino] [data-chiudi]')
  }
}

/* ---------- 6. la mappa grande si apre dalla casella e si chiude toccando il campo ---------- */
await toccaIl('[data-azione="mappina"]')
await attendi(page, 200)
uguale('la 🗺️ apre la mappa grande', await page.locator('[data-azione="mappina"]').getAttribute('aria-pressed'), 'true')
await scatto(page, 'barra-mappa')
{
  const prima = await cellaGiu()
  const altrove = await unaCellaLibera()
  await tocca(altrove.s.x, altrove.s.y)
  await attendi(page, 600)
  uguale('un tocco sul campo la chiude', await page.locator('[data-azione="mappina"]').getAttribute('aria-pressed'), 'false')
  controlla('e l\'eroe cammina', (await cellaGiu()) !== prima, prima)
  await fermoGiu()
}

/* ---------- 7. «lascio perdere» è una scelta: non si chiude toccando fuori ---------- */
await toccaIl('button[aria-label="pausa"]')
await page.waitForSelector('[data-pausa] [data-azione="lascia-discesa"]', { timeout: 3000 })
await attendi(page, 400)
await toccaIl('[data-azione="lascia-discesa"]')
await page.waitForSelector('[data-lascio-perdere]', { timeout: 3000 })
{
  const m = await page.locator('[data-lascio-perdere] .sot-modale').boundingBox()
  await tocca(m.x + m.width / 2, Math.max(8, m.y - 30))
  await attendi(page, 300)
  uguale('«lascio perdere» non si chiude toccando fuori', await page.locator('[data-lascio-perdere]').count(), 1)
}
await toccaIl('[data-azione="scorda-no"]')
await attendi(page, 300)
uguale('nessun errore in console', errori.join(' · '), '')
await page.close()

/* ---------- 8. le foto: la vita a metà con la luce che guizza, e a 320 px ----------
   La vita a metà viene da una sosta scritta qui (si riprende giù, dietro il velo della pausa); la luce dalla roba */
async function aMeta(viewport, nome) {
  const c = new Corsa(CAMPAGNA[0], { seme: piano.seme, eroe: 'cavaliere', roba: { ...roba, torcia: 2 } })
  c.vita = Math.ceil(c.vitaMax / 2)
  const { page: p, errori: e } = await apriGioco(browser, { viewport })
  await azzera(p)
  await semina(p, {
    coins: 300, settings: { sperimentali: true },
    campagne: { sotterraneo: { tappa: 0, libera: false, stelle: {},
      cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: avventura({
        roba: { ...roba, torcia: 2 }, sosta: scrivi(c, 0) }) } } } },
  })
  await scegli(p, 'sotterraneo')
  await p.waitForSelector('[data-pausa]', { timeout: 5000 })
  await attendi(p, 400)
  await p.click('[data-pausa] [data-azione="riprendi"]')
  await p.waitForSelector('[data-pausa]', { state: 'detached', timeout: 3000 })
  await attendi(p, 700)
  const q = Number(await p.locator('[data-globo="vita"]').getAttribute('data-quota'))
  controlla(`${viewport.width} px: la vita a metà`, Math.abs(q - 0.5) < 0.06, String(q))
  uguale(`${viewport.width} px: la luce guizza`, await p.locator('[data-globo="luce"]').getAttribute('data-guizza'), '1')
  // tutto dentro lo schermo: le caselle fra i due globi, niente che sbordi di lato
  const sx = await p.locator('[data-globo="vita"]').boundingBox()
  const dx = await p.locator('[data-globo="luce"]').boundingBox()
  const celle = await p.locator('.sot-cella').evaluateAll(es => es.map(e => e.getBoundingClientRect()).map(r => [r.left, r.right, r.width]))
  controlla(`${viewport.width} px: le caselle stanno fra i globi`,
            celle.every(([l, r]) => l >= sx.x + sx.width && r <= dx.x), JSON.stringify(celle))
  controlla(`${viewport.width} px: nessuna casella più stretta di 22 px`, celle.every(([, , w]) => w >= 22), JSON.stringify(celle))
  const barra = await p.locator('[data-barra-giu]').boundingBox()
  controlla(`${viewport.width} px: la barra è bassa (al più 70 px)`, barra.height <= 70, String(barra.height))
  const largo = await p.evaluate(() => document.documentElement.scrollWidth)
  controlla(`${viewport.width} px: niente scorrimento di lato`, largo <= viewport.width, `${largo} px`)
  await scatto(p, nome)
  uguale(`${viewport.width} px: nessun errore in console`, e.join(' · '), '')
  await p.close()
}
await aMeta({ width: 390, height: 844 }, 'barra-meta-guizza')
await aMeta({ width: 320, height: 640 }, 'barra-320')

await browser.close()
riassunto('la barra in basso e il tocco altrove')
