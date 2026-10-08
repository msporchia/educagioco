/* ═══════════════════════════════════════════════════════════════════
   I MERCANTI DI SOPRA, COL DITO VERO

   La roba resta fra una discesa e l'altra, e il mercante è uscito dalle
   discese: tre botteghe sulla terra di sopra (docs/sotterraneo/
   terra-di-sopra.md). Qui il giro intero col dito: toccare un mercante e
   vedere l'eroe andarci e il banco aprirsi, comprare, vendere al
   rigattiere, scendere con la roba comprata, risalire e ritrovarla, e
   alla discesa dopo ritrovarla nello zaino.

   I tocchi sono tocchi (`Input.dispatchTouchEvent` via CDP): il click che
   il dito si lascia dietro è quello che apre il banco, e un
   `page.click()` non lo porterebbe.
   `node test/esegui.mjs sotterraneo-mercanti`
   tempo: 90
   ═══════════════════════════════════════════════════════════════════ */
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, leggiProfilo, scendiNelSotterraneo,
         lasciaLaDiscesa } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { COSE } from '../../src/giochi/sotterraneo/dati/cose.js'
import { MERCANTI, CELLA } from '../../src/giochi/sotterraneo/dati/terra-mappa.js'
import { SCALA_TERRA as S } from '../../src/giochi/sotterraneo/dati/terra.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
/* la nebbia già tolta (768 cifre esadecimali, un bit per cella): i mercanti
   si trovano camminando, e camminare la mappa lo prova `integrazione/
   sotterraneo-terra`. Nello zaino un'ascia da vendere, e le gemme */
const roba = { v: 1, gemme: 60, zaino: ['ascia'], mano: null, mancina: null, corpo: null, dito: null,
               torcia: 0, torce: 0 }
await semina(page, {
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: 2, libera: false, stelle: { 0: 3, 1: 3 },
    cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: { tappa: 2, libera: false, stelle: { 0: 3, 1: 3 }, missioni: {},
      roba, terra: { nebbia: 'f'.repeat(768), dove: [17, 41], parlato: true } } } } } },
})
await scegli(page, 'sotterraneo')
await page.waitForSelector('[data-terra]', { timeout: 5000 })
await attendi(page, 500)

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
const cella = () => page.locator('[data-eroe-terra]').getAttribute('data-cella')
const gemme = async () => Number((await page.locator('[data-roba-sopra]').innerText()).match(/💎 (\d+)/)[1])
async function alBanco(chi) {
  // i mercanti stanno lontani fra loro e fuori dallo schermo: si cammina verso la cella dove ci si ferma
  // accanto a lui (`vaiVerso`, qui sotto), poi lo si tocca. Lungo la strada un tocco può cadere su un altro
  // mercante e aprire il suo banco: `vaiVerso` lo richiude e prosegue
  // se è già sullo schermo lo si tocca e basta, come un bambino: il rigattiere sta accanto all'erborista, e i
  // tocchi di avvicinamento verso di lui cadrebbero sul banco di lei
  if (!(await aVista(chi))) await vaiVerso(...MERCANTI[chi].accanto)
  if (!(await page.locator('[data-chiudi]').count())) await toccaIl(`[data-mercante="${chi}"]`)
  await page.waitForSelector('[data-chiudi]', { timeout: 10000 })
  await attendi(page, 500)    // il banco è cieco per un attimo, contro il click fantasma (Mercante.vue, CIECO)
}

async function aVista(chi) {
  const m = page.locator(`[data-mercante="${chi}"]`)
  if (await m.evaluate(el => el.classList.contains('sot-buio'))) return false
  const b = await m.boundingBox(), v = await page.locator('[data-terra]').boundingBox()
  return !!b && b.x > v.x + 10 && b.x + b.width < v.x + v.width - 10 && b.y > v.y + 150 && b.y + b.height < v.y + v.height - 130
}

async function chiudiBanco() {
  await toccaIl('[data-chiudi]')
  await page.waitForSelector('[data-chiudi]', { state: 'detached', timeout: 3000 })
}

/* ---------- 1. i mercanti stanno sulla mappa ---------- */
uguale('sulla terra di sopra ci sono tre mercanti', await page.locator('[data-mercante]').count(), 3)
controlla('e la carta di chi scende dice le gemme', (await gemme()) === 60, String(await gemme()))
await scatto(page, 'mercanti-mappa-casa')

/* ---------- 1b. la mappa è larga due schermi e mezzo: la vista scorre verso destra, oltre la giunta ---------- */
const camera = async () => (await page.locator('[data-terra]').getAttribute('data-camera')).split(',').map(Number)
async function vaiVerso(cx, cy) {
  // un tocco dentro lo schermo, nella direzione giusta: l'eroe va alla cella raggiungibile più vicina
  for (let giro = 0; giro < 14; giro++) {
    const [x, y] = (await cella()).split(',').map(Number)
    if (x === cx && y === cy) return
    const v = await page.locator('[data-terra]').boundingBox()
    const [camx, camy] = await camera()
    // un tocco sul prato, non su chi ci sta sopra: se il punto cade su un mercante, o così vicino che il
    // telefono gli attribuisce il tocco (Chrome aggiusta il dito verso il bottone più vicino), si cambia fila
    let punto = null
    for (const dy of [0, 1, -1, 2, -2]) {
      const sx = v.x + ((x + 0.5 + Math.max(-3, Math.min(3, cx - x))) * CELLA - camx) * S
      const sy = v.y + ((y + 0.5 + dy + Math.max(-3, Math.min(3, cy - y))) * CELLA - camy) * S
      punto = [Math.max(v.x + 30, Math.min(v.x + v.width - 30, sx)), Math.max(v.y + 150, Math.min(v.y + v.height - 130, sy))]
      const sopra = await page.evaluate(([px, py]) => [...document.querySelectorAll('[data-mercante]')].some(m => {
        const r = m.getBoundingClientRect()
        return px > r.left - 24 && px < r.right + 24 && py > r.top - 24 && py < r.bottom + 24
      }), punto)
      if (!sopra) break
    }
    await tocca(...punto)
    await page.waitForFunction(() => document.querySelector('[data-eroe-terra]')?.dataset.cammina === '0',
                               null, { timeout: 15000 })
    await attendi(page, 150)
    // un banco aperto per sbaglio (il tocco è caduto su un mercante): si chiude e si va avanti,
    // tranne all'arrivo, dove il banco è quello giusto
    const [ax, ay] = (await cella()).split(',').map(Number)
    if ((await page.locator('[data-chiudi]').count()) && !(ax === cx && ay === cy)) await chiudiBanco()
  }
}
const [cam0] = await camera()
await vaiVerso(31, 35)                 // il sentiero esce dal bordo della prima mappa
const allaGiunta = (await cella()).split(',').map(Number)
controlla('l\'eroe arriva alla giunta', allaGiunta[0] >= 30, allaGiunta.join(','))
await attendi(page, 400)
await scatto(page, 'terra-giunta')
await vaiVerso(34, 36)                 // e la passa, dentro il bosco
const oltre = (await cella()).split(',').map(Number)
controlla('passa la giunta: il sentiero continua nel pezzo nuovo', oltre[0] >= 33, oltre.join(','))
const [cam1] = await camera()
controlla('e la vista è scorsa verso destra, fino oltre la giunta', cam1 > cam0 + 300 && cam1 + 390 / S > 1024 + 100,
          `${cam0} → ${cam1}`)
await scatto(page, 'terra-giunta-oltre')

/* ---------- 2. l'erborista: ci si va, e si compra ---------- */
await alBanco('erborista')
{
  const [x, y] = (await cella()).split(',').map(Number)
  uguale('l\'eroe si è fermato accanto all\'erborista', `${x},${y}`, MERCANTI.erborista.accanto.join(','))
}
controlla('il banco ha le pozioni', await page.locator('[data-merce="pozione"]').count() === 1)
controlla('e chi compra la roba lo dice', (await page.locator('[data-chi-compra]').innerText()).includes('rigattiere'))
await toccaIl('[data-merce="pozione"]')
await attendi(page, 300)
controlla('comprata, il banco lo dice', (await page.locator('[data-detto-banco]').innerText()).includes('Pozione'))
await scatto(page, 'mercanti-banco-erborista')
await chiudiBanco()
uguale('e le gemme sono scese del suo prezzo', await gemme(), 60 - COSE.pozione.prezzo)

/* ---------- 3. il rigattiere: si vende ---------- */
await alBanco('rigattiere')
await scatto(page, 'mercanti-banco-rigattiere')
controlla('il rigattiere mostra le tasche', await page.locator('[data-vendo="ascia"]').count() === 1)
await toccaIl('[data-vendo="ascia"]')
await attendi(page, 300)
uguale('venduta, l\'ascia non c\'è più', await page.locator('[data-vendo="ascia"]:visible').count(), 0)
await chiudiBanco()
const dopo = 60 - COSE.pozione.prezzo + COSE.ascia.prezzo / 2
uguale('e le gemme sono salite di metà del suo prezzo', await gemme(), dopo)
await scatto(page, 'mercanti-mappa-rigattiere')

/* ---------- 4. l'armaiolo si vede anche lui ---------- */
await alBanco('armaiolo')
uguale('l\'eroe si è fermato accanto all\'armaiolo', await cella(), MERCANTI.armaiolo.accanto.join(','))
controlla('l\'armaiolo ha il suo banco', await page.locator('[data-merce]').count() >= 3)
/* il banco porta la riga della storia con cui si entra nella prossima discesa (la torre): chi non ha niente ci
   trova la spada corta, lo scudo di legno e il panciotto (dati/storia.js) */
for (const k of ['spada-corta', 'scudo-legno', 'panciotto'])
  uguale(`l'armaiolo ha ${COSE[k].nome.toLowerCase()}, del passo dopo`, await page.locator(`[data-merce="${k}"]`).count(), 1)
uguale('e niente della riga dopo ancora (la spada)', await page.locator('[data-merce="spada"]').count(), 0)
uguale('e non compra: dice chi lo fa', await page.locator('[data-chi-compra]').count(), 1)
await chiudiBanco()
await scatto(page, 'mercanti-mappa-armaiolo')

/* ---------- 5. si scende con la roba comprata ---------- */
await scendiNelSotterraneo(page, 0)
await page.waitForSelector('.sot-tela', { timeout: 5000 })
await attendi(page, 500)
await page.locator('[data-azione="zaino"]').click()
await page.waitForSelector('.sot-centrale', { timeout: 3000 })
uguale('nello zaino c\'è la pozione comprata sopra', await page.locator('[data-tasca][data-cosa="pozione"]').count(), 1)
await page.locator('[data-azione="chiudi"]').click()
await attendi(page, 200)

/* ---------- 6. si risale, e la roba è ancora lì ---------- */
// la ✕ non porta di sopra (docs/sotterraneo/portale-e-sosta.md): si risale lasciando perdere la discesa, e la roba resta
await lasciaLaDiscesa(page)
await attendi(page, 400)
const p = await leggiProfilo(page)
const su = p?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.roba
controlla('la roba è nel profilo, nell\'avventura del cavaliere', !!su && su.zaino.includes('pozione'), JSON.stringify(su))
uguale('con le gemme di prima', su && su.gemme, dopo)
uguale('lasciata perdere la discesa, la roba resta', await gemme(), dopo)
uguale('e la discesa no: ricomincia da capo, nessuna carta', await page.locator('[data-ripresa]').count(), 0)

/* ---------- 7. e alla discesa dopo si ritrova ---------- */
await scendiNelSotterraneo(page, 0)
await page.waitForSelector('.sot-tela', { timeout: 5000 })
await attendi(page, 500)
await page.locator('[data-azione="zaino"]').click()
await page.waitForSelector('.sot-centrale', { timeout: 3000 })
uguale('la discesa dopo ritrova la pozione', await page.locator('[data-tasca][data-cosa="pozione"]').count(), 1)
await attendi(page, 400)   // il foglio entra con un'animazione: la foto la aspetta
await scatto(page, 'mercanti-zaino-ritrovato')

uguale('nessun errore in console', errori.join(' · '), '')
nota(`gemme: 60 → ${60 - COSE.pozione.prezzo} (pozione) → ${dopo} (ascia venduta)`)
await browser.close()
riassunto('i mercanti di sopra col dito')
