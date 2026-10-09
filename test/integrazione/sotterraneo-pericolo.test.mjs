/* ═══════════════════════════════════════════════════════════════════
   LO STOP DELLO SCONTRO, COL DITO VERO

   Quando l'eroe rischia di cadere (docs/sotterraneo/pericolo.md) lo
   scontro si ferma fra una domanda e l'altra: il mostro ringhia e si
   sceglie bevi / scappa / continuo. Qui, nell'ultima discesa (la miniera:
   un mago nudo al livello 8, un gradino sotto, prende un colpo da quasi
   metà della sua vita; più in basso la sentinella non lo farebbe
   scendere, docs/sotterraneo/zone.md) e con due pozioni in tasca:
   - un mostro forte, una risposta sbagliata → compare lo stop, al posto
     della domanda; per i primi 320 ms i tasti non sentono il tocco;
   - «continuo» riprende a domandare, e con una risposta giusta che lo
     lascia a un colpo dal cadere compare il secondo stop; «bevi» alza la
     vita, consuma una pozione e la battaglia riprende;
   - in un'altra discesa «scappo via» dallo stop esce dallo scontro, col
     suo graffio.
   Il mostro e la strada si scelgono dal seme (`#seme=`), e cosa succede
   alla seconda risposta lo dice lo stesso motore qui in Node.
   Si tocca come un bambino (`Input.dispatchTouchEvent` via CDP).
   `node test/esegui.mjs sotterraneo-pericolo`
   tempo: 150
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, scendiNelSotterraneo }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { T } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { percorso } from '../../src/motore/passi.js'
import { sogliaDi } from '../../src/giochi/sotterraneo/dati/livelli.js'

const MINIERA = CAMPAGNA.length - 1
const roba = { v: 1, gemme: 0, zaino: ['pozione-piccola', 'pozione'], mano: null, mancina: null, corpo: null,
               dito: null, torcia: 0, torce: 0 }
// al livello 8, un gradino sotto la miniera: più in basso il pallino è rosso e la sentinella non fa scendere
// (docs/sotterraneo/zone.md). Il mago, coi punti non dati: il più fragile, così un colpo pesa ancora
const crescita = { esp: sogliaDi(8) }
const EROE = 'mago'

/* ── il piano: il mostro più vicino all'ingresso, senza altri mostri né porte per strada, e il primo colpo che
   lo ferma. Poi, lo dice il motore: cosa succede se si continua e si risponde giusto ── */
function scegliIlPiano() {
  let meglio = null
  for (let seme = 1; seme < 400; seme++) {
    const c = new Corsa(CAMPAGNA[MINIERA], { seme, eroe: EROE, roba, crescita })
    const L = c.livello
    const da = { x: Math.floor(c.eroe.x), y: Math.floor(c.eroe.y) }
    const stanza = q => L.stanzaDi(q.x, q.y)?.id
    const libera = (x, y) => L.calpestabile(x, y) && !L.robe.some(r => r.x === x && r.y === y && r.che === 'porta')
    const mostri = L.robe.filter(r => r.che === 'mostro')
    for (const m of mostri.filter(r => !r.chiave && !r.grosso)) {
      const via = percorso(libera, da, m)
      if (!via || via.some(q => mostri.some(o => o !== m && stanza(o) === stanza(q)))) continue
      // lo stesso scontro in Node: una risposta sbagliata ferma? e continuando, una giusta?
      const s = new Corsa(CAMPAGNA[MINIERA], { seme, eroe: EROE, roba, crescita })
      const sm = s.livello.robe.find(r => r.che === 'mostro' && r.x === m.x && r.y === m.y)
      s.scontro(sm)
      const primo = s.rispondi(false)
      if (primo.ringhia !== 'duro' || s.vita <= 0 || s.graffio(sm) >= s.vita) continue   // scappando si regge
      const vita1 = s.vita
      s.continua()
      const secondo = s.rispondi(true)
      if (secondo.che === 'caduto') continue   // il mostro deve restare in piedi: dopo si sbaglia ancora, o si beve
      // il secondo stop, a risposta giusta: da lì si prova «bevi» senza dover sbagliare ancora
      if (!secondo.ringhia) continue
      if (!meglio || via.length < meglio.costo)
        meglio = { seme, costo: via.length, c, mostro: m, vita1, secondo: secondo.ringhia || null, L }
    }
  }
  return meglio
}
const piano = scegliIlPiano()
controlla('c\'è un piano della miniera con un mostro vicino che ferma al primo sbaglio', !!piano)
nota(`seme ${piano.seme}: ${piano.mostro.tipo} a ${piano.costo} passi; dopo il primo colpo ❤️ ${piano.vita1}; ` +
     `continuando e rispondendo giusto: ${piano.secondo ? 'secondo stop «' + piano.secondo + '»' : 'si domanda ancora'}`)
const L = piano.L

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
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

/* ── giù: dov'è l'eroe lo dice la tela (come in sotterraneo-barra) ── */
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
const vuota = (x, y) => L.calpestabile(x, y) && !L.robe.some(r => r.x === x && r.y === y && r.che !== 'gemme')
async function vaiAlMostro() {
  const a = piano.mostro
  for (let giro = 0; giro < 30; giro++) {
    if (await page.locator('.sot-domanda, [data-ringhio]').count()) return
    const [ex, ey] = (await cellaGiu()).split(',').map(Number)
    const via = percorso(vuota, { x: ex, y: ey }, a, { arrivoLibero: false }) || []
    if (via.length <= 1) {
      const qui = await schermoDi(a)
      if (dentro(qui)) await tocca(qui.x, qui.y)
      await attendi(page, 300)
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
async function rispondi(giusto) {
  await page.waitForSelector('.sot-domanda .qz-tasto', { timeout: 8000 })
  await attendi(page, 400)
  const tasto = page.locator(giusto ? '.sot-domanda .qz-tasto[data-giusta]' : '.sot-domanda .qz-tasto:not([data-giusta])')
  await ((await tasto.count()) ? tasto.first() : page.locator('.sot-domanda .qz-tasto').first()).click()
}
const numeroDel = async tipo => Number((await page.locator(`[data-globo="${tipo}"] .sot-globo-numero`).textContent()) || 0)
const pozioni = async () => Number(await page.locator('[data-casella-barra="pozione"]').getAttribute('data-n'))

// un eroe nudo nella miniera, davanti al mostro scelto, con la domanda aperta
async function entra() {
  await azzera(page)
  const avventura = { tappa: MINIERA, libera: false, stelle: {}, missioni: {}, roba, crescita,
    terra: { nebbia: 'f'.repeat(768), dove: [55, 11], parlato: true } }
  await semina(page, {
    coins: 300, settings: { sperimentali: true },
    campagne: { sotterraneo: { tappa: MINIERA, libera: false, stelle: {},
      cfg: { mondo: MONDO, eroe: EROE, avventure: { [EROE]: avventura } } } },
  })
  await scegli(page, 'sotterraneo')
  await page.waitForSelector('[data-terra]', { timeout: 5000 })
  await page.evaluate(s => { location.hash = 'seme=' + s }, piano.seme)
  await scendiNelSotterraneo(page, MINIERA)
  await page.waitForSelector('.sot-tela', { timeout: 5000 })
  await attendi(page, 700)
  await vaiAlMostro()
  await page.waitForSelector('.sot-velo-scontro .sot-domanda', { timeout: 10000 })
}
// sbaglia e aspetta che il mostro picchi e lo scontro si fermi
async function sbagliaEFermati() {
  await rispondi(false)
  await page.waitForSelector('[data-ringhio]', { timeout: 20000 })
}
const stop = () => page.locator('[data-ringhio]')

/* ---------- 1. lo stop, e «bevi» ---------- */
await entra()
uguale('prima di sbagliare c\'è la domanda e nessuno stop', await stop().count(), 0)
uguale('e due pozioni sulla casella', await pozioni(), 2)
const vita0 = await numeroDel('vita')
await sbagliaEFermati()
{
  // il tocco cieco per primo: le prove qui sotto fanno passare i 320 ms
  const subito = await stop().getAttribute('data-pronto')   // null: i primi 320 ms
  if (subito === null) {
    // il dito ancora premuto sulla risposta lascia un click: nei primi 320 ms non conta. Un tocco secco, senza
    // tenere il dito giù: col tocco normale (60 ms) sotto carico il click arrivava a finestra già chiusa
    const b = await page.locator('[data-azione="ringhio-bevi"]').boundingBox()
    const p = { x: b.x + b.width / 2, y: b.y + b.height / 2 }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [p] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await attendi(page, 80)
    uguale('un tocco subito non sceglie niente', await stop().count(), 1)
    uguale('né beve', await pozioni(), 2)
  } else nota('(la pagina è lenta: la finestra cieca era già passata)')
  uguale('lo stop compare con la ragione «duro»', await stop().getAttribute('data-perche'), 'duro')
  uguale('al posto della domanda', await page.locator('.sot-domanda').count(), 0)
  uguale('e del tasto «scappo via» di sempre', await page.locator('[data-azione="scappa"]').count(), 0)
  uguale('con le tre scelte', await page.locator('[data-ringhio] [data-azione^="ringhio-"]').evaluateAll(es => es.map(e => e.dataset.azione).join()),
         'ringhio-bevi,ringhio-scappa,ringhio-continua')
  controlla('il mostro ringhia col suo nome', /ringhia/.test(await stop().locator('.sot-ringhio-titolo').innerText()))
  controlla('lo scontro è ancora lì, modale', await page.locator('.sot-velo-scontro').count() === 1)
  controlla('la vita è scesa', (await numeroDel('vita')) < vita0, `${vita0} → ${await numeroDel('vita')}`)
  await scatto(page, 'pericolo')
}
await page.waitForSelector('[data-ringhio][data-pronto]', { timeout: 3000 })
await scatto(page, 'pericolo-pronto')

// continuo: si torna a domandare
{
  const vita1 = await numeroDel('vita')
  await toccaIl('[data-azione="ringhio-continua"]')
  await page.waitForSelector('.sot-velo-scontro .sot-domanda', { timeout: 5000 })
  uguale('«continuo» toglie lo stop', await stop().count(), 0)
  uguale('e non costa vita', await numeroDel('vita'), vita1)
  // una risposta giusta: il mostro graffia; se lo lascia a un colpo dal cadere, lo stop torna (la seconda soglia)
  await rispondi(true)
  if (piano.secondo) {
    await page.waitForSelector('[data-ringhio]', { timeout: 20000 })
    uguale('un colpo pieno e cade: secondo stop «ultimo»', await stop().getAttribute('data-perche'), piano.secondo)
  } else {
    await page.waitForSelector('.sot-velo-scontro .sot-domanda, [data-ringhio]', { timeout: 20000 })
    nota('rispondendo giusto non scatta il secondo stop con questo seme')
  }
}

// bevi (da qualunque stop sia aperto): la vita sale, una pozione in meno, si riprende
if (!(await stop().count())) await sbagliaEFermati()
await page.waitForSelector('[data-ringhio][data-pronto]', { timeout: 3000 })
{
  const v = await numeroDel('vita'), n = await pozioni()
  await toccaIl('[data-azione="ringhio-bevi"]')
  await page.waitForSelector('.sot-velo-scontro .sot-domanda', { timeout: 5000 })
  await attendi(page, 300)
  uguale('«bevi» consuma una pozione', await pozioni(), n - 1)
  controlla('e alza la vita', (await numeroDel('vita')) > v, `${v} → ${await numeroDel('vita')}`)
  uguale('lo stop è passato', await stop().count(), 0)
  uguale('e la battaglia riprende: lo scontro è aperto con la sua domanda', await page.locator('.sot-velo-scontro .sot-domanda').count(), 1)
  await scatto(page, 'pericolo-bevuto')
}

/* ---------- 2. «scappo via» dallo stop ---------- */
await entra()
await sbagliaEFermati()
await page.waitForSelector('[data-ringhio][data-pronto]', { timeout: 3000 })
{
  const v = await numeroDel('vita')
  await toccaIl('[data-azione="ringhio-scappa"]')
  await page.waitForSelector('.sot-velo-scontro', { state: 'detached', timeout: 5000 })
  uguale('scappando lo scontro si chiude', await page.locator('[data-ringhio], .sot-velo-scontro').count(), 0)
  controlla('col graffio di sempre (o svenuto, se non regge)', (await numeroDel('vita')) <= v, `${v} → ${await numeroDel('vita')}`)
  uguale('le pozioni non si toccano', await pozioni(), 2)
}

uguale('nessun errore in pagina', errori.length, 0)
if (errori.length) console.log(errori)
await browser.close()
riassunto('lo stop dello scontro, col dito')
