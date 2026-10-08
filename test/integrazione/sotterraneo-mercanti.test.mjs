/* ═══════════════════════════════════════════════════════════════════
   I MERCANTI DI SOPRA, COL DITO VERO

   La roba resta fra una discesa e l'altra, e il mercante è uscito dalle
   discese: tre botteghe sulla terra di sopra (docs/sotterraneo/
   terra-di-sopra.md). Qui il giro intero col dito: toccare un mercante e
   vedere l'eroe andarci e il banco aprirsi, comprare, vendere al
   rigattiere, scendere con la roba comprata, risalire e ritrovarla, e
   alla discesa dopo ritrovarla nello zaino. La bottega è quella da gioco
   di ruolo (docs/sotterraneo/roba.md, «La bottega e lo zaino»): le
   linguette, un tocco che sceglie e il tasto che compra, il confronto coi
   numeri giusti, i pezzi più su che si vedono spenti; e lo zaino che
   indossa e fa bere.

   I tocchi sono tocchi (`Input.dispatchTouchEvent` via CDP): il click che
   il dito si lascia dietro è quello che apre il banco, e un
   `page.click()` non lo porterebbe.
   `node test/esegui.mjs sotterraneo-mercanti`
   tempo: 90
   ═══════════════════════════════════════════════════════════════════ */
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, leggiProfilo, scendiNelSotterraneo,
         lasciaLaDiscesa, vendiNellaBottega, allaLinguettaDi } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { COSE } from '../../src/giochi/sotterraneo/dati/cose.js'
import { MERCANTI, CELLA } from '../../src/giochi/sotterraneo/dati/terra-mappa.js'
import { SCALA_TERRA as S } from '../../src/giochi/sotterraneo/dati/terra.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
/* la nebbia già tolta (768 cifre esadecimali, un bit per cella): i mercanti
   si trovano camminando, e camminare la mappa lo prova `integrazione/
   sotterraneo-terra`. Nello zaino un'ascia da vendere, un medaglione da
   mettersi giù, e le gemme */
const roba = { v: 1, gemme: 60, zaino: ['ascia', 'medaglione', 'amuleto-rosso'], mano: null, mancina: null, corpo: null, dito: null,
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
const gemmeBottega = async () => Number((await page.locator('[data-gemme-bottega]').innerText()).match(/\d+/)[0])
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
  await attendi(page, 500)    // la bottega è cieca per un attimo, contro il click fantasma (Bottega.vue, CIECO)
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

/* ---------- 2. l'erborista: ci si va, si guarda, e si compra ---------- */
await alBanco('erborista')
{
  const [x, y] = (await cella()).split(',').map(Number)
  uguale('l\'eroe si è fermato accanto all\'erborista', `${x},${y}`, MERCANTI.erborista.accanto.join(','))
}
uguale('la bottega si apre', await page.locator('[data-bottega]').count(), 1)
uguale('con le sue linguette: pozioni e torce', await page.locator('[data-bottega] [data-scheda]').count(), 2)
uguale('e la prima è quella delle pozioni', await page.locator('[data-scheda="pozioni"][aria-selected="true"]').count(), 1)
controlla('in griglia la pozione', await page.locator('[data-casella-pezzo="pozione"]').count() === 1)
uguale('e le gemme dell\'eroe in vista', await gemmeBottega(), 60)
controlla('niente di scelto: parla l\'erborista, e dice chi compra la roba',
          (await page.locator('[data-chi-compra]').innerText()).includes('rigattiere'))
/* un tocco sceglie e non compra: il dito sbaglia */
await toccaIl('[data-casella-pezzo="pozione"]')
await attendi(page, 200)
uguale('un tocco sceglie la pozione', await page.locator('[data-pannello][data-cosa="pozione"]').count(), 1)
controlla('e il pannello dice i numeri', (await page.locator('[data-pannello]').innerText()).includes('+10 vita'),
          await page.locator('[data-pannello]').innerText())
uguale('ma non la compra', await gemmeBottega(), 60)
await toccaIl('[data-azione="compra"]')
await attendi(page, 300)
controlla('comprata col tasto, la bottega lo dice', (await page.locator('[data-detto-banco]').innerText()).includes('Pozione'))
uguale('e le gemme scendono del suo prezzo', await gemmeBottega(), 60 - COSE.pozione.prezzo)
/* il secondo tocco sulla stessa casella compra, se non arriva insieme al primo */
await toccaIl('[data-casella-pezzo="pozione-piccola"]')
await attendi(page, 600)
await toccaIl('[data-casella-pezzo="pozione-piccola"]')
await attendi(page, 300)
uguale('un secondo tocco sulla boccetta la compra', await gemmeBottega(),
       60 - COSE.pozione.prezzo - COSE['pozione-piccola'].prezzo)
await toccaIl('[data-scheda="torce"]')
await attendi(page, 200)
uguale('sotto «Torce» la torcia', await page.locator('[data-casella-pezzo="torcia"]').count(), 1)
await scatto(page, 'mercanti-banco-erborista')
await chiudiBanco()
const spese = COSE.pozione.prezzo + COSE['pozione-piccola'].prezzo
uguale('e la carta di sopra ha le gemme di adesso', await gemme(), 60 - spese)

/* ---------- 3. il rigattiere: si vende ---------- */
await alBanco('rigattiere')
uguale('il rigattiere ha la linguetta «Vendi»', await page.locator('[data-scheda="vendi"]').count(), 1)
controlla('e il banco non è mai vuoto: i gioielli più su si vedono, spenti',
          await page.locator('[data-casella-pezzo][data-chiusa="1"]').count() > 0)
uguale('niente «non ho niente per te»', await page.locator('[data-banco-vuoto]').count(), 0)
await vendiNellaBottega(page, 'ascia', { tocca })
uguale('venduta, l\'ascia non c\'è più', await page.locator('[data-vendo="ascia"]').count(), 0)
uguale('e le gemme salgono di metà del suo prezzo', await gemmeBottega(), 60 - spese + COSE.ascia.prezzo / 2)
await toccaIl('[data-vendo="medaglione"]')
await attendi(page, 300)
controlla('il medaglione si può vendere', (await page.locator('[data-azione="vendi"]').innerText()).includes(String(COSE.medaglione.prezzo / 2 | 0)))
await scatto(page, 'mercanti-banco-rigattiere')
await chiudiBanco()
let dopo = 60 - spese + COSE.ascia.prezzo / 2
uguale('e sulla carta di sopra', await gemme(), dopo)
await scatto(page, 'mercanti-mappa-rigattiere')

/* ---------- 4. l'armaiolo: le linguette, il confronto, i pezzi più su ---------- */
await alBanco('armaiolo')
uguale('l\'eroe si è fermato accanto all\'armaiolo', await cella(), MERCANTI.armaiolo.accanto.join(','))
uguale('l\'armaiolo ha armi e difese, e non «Vendi»', await page.locator('[data-bottega] [data-scheda]').count(), 2)
uguale('e non compra: dice chi lo fa', await page.locator('[data-chi-compra]').count(), 1)
/* il banco porta la riga della storia con cui si entra nella prossima discesa (la torre): chi non ha niente ci
   trova la spada corta, lo scudo di legno e il panciotto (dati/storia.js) */
for (const k of ['spada-corta', 'scudo-legno', 'panciotto']) {
  uguale(`l'armaiolo ha ${COSE[k].nome.toLowerCase()}, del passo dopo`, await allaLinguettaDi(page, k, { tocca }), true)
  uguale('e si compra', await page.locator(`[data-casella-pezzo="${k}"]:not([data-chiusa])`).count(), 1)
}
/* la spada è della riga dopo ancora: si vede, spenta, e dice quando arriva */
uguale('la spada si vede', await allaLinguettaDi(page, 'spada', { tocca }), true)
uguale('ma è chiusa', await page.locator('[data-casella-pezzo="spada"][data-chiusa="1"]').count(), 1)
await toccaIl('[data-casella-pezzo="spada"]')
await attendi(page, 200)
controlla('e dice dopo quale discesa', (await page.locator('[data-quando]').innerText()).includes('torre in rovina'),
          await page.locator('[data-pannello]').innerText())
uguale('col tasto spento', await page.locator('[data-azione="compra"]').isDisabled(), true)
/* il confronto: il cavaliere a mani nude ha braccio 3, con la spada corta 4 */
await allaLinguettaDi(page, 'spada-corta', { tocca })
await toccaIl('[data-casella-pezzo="spada-corta"]')
await attendi(page, 200)
uguale('il confronto dice il braccio prima e dopo', (await page.locator('[data-confronto="att"]').innerText()).trim(), '⚔️ 3 → 4')
uguale('in verde', await page.locator('[data-confronto="att"]').getAttribute('data-verso'), 'su')
/* e affiancato: a sinistra niente (la mano è vuota), a destra la spada corta, una riga sola in verde */
controlla('a sinistra «Addosso»: niente', (await page.locator('[data-affianca] [data-colonna="addosso"] [data-niente]').innerText()).includes('niente'))
uguale('e non ha nessun pezzo', await page.locator('[data-affianca] [data-colonna="addosso"] [data-pezzo]').count(), 0)
uguale('a destra «Questo»: la spada corta', await page.locator('[data-affianca] [data-colonna="questo"] [data-pezzo]').getAttribute('data-pezzo'), 'spada-corta')
uguale('una riga sola, il braccio', await page.locator('[data-affianca] [data-abilita]').count(), 1)
uguale('verde', await page.locator('[data-abilita="att"]').getAttribute('data-verso'), 'su')
uguale('«—» a sinistra', (await page.locator('[data-valore="att-addosso"]').innerText()).trim(), '—')
uguale('+1 a destra, con la freccia in su', (await page.locator('[data-valore="att-questo"]').innerText()).replace(/\s+/g, ''), '+1▲')
uguale('la sintesi', (await page.locator('[data-sintesi]').innerText()).trim(), 'meglio in 1')
/* sul telefono (390 px) le due colonne stanno dentro il pannello e lo schermo */
{
  const pannello = await page.locator('[data-pannello]').boundingBox()
  const destra = await page.locator('[data-colonna="questo"]').boundingBox()
  const larghezza = await page.evaluate(() => document.documentElement.clientWidth)
  controlla('le due colonne stanno nel pannello e nello schermo',
            destra.x + destra.width <= pannello.x + pannello.width + 1 && pannello.x + pannello.width <= larghezza + 1,
            JSON.stringify({ pannello, destra, larghezza }))
}
uguale('e la casella della mano si accende', await page.locator('[data-casella="mano"].sot-accesa').count(), 1)
await scatto(page, 'mercanti-banco-armaiolo')
await toccaIl('[data-azione="compra"]')
await attendi(page, 300)
dopo -= COSE['spada-corta'].prezzo
uguale('comprata, la spada corta va in mano da sé', await page.locator('[data-casella="mano"][data-cosa="spada-corta"]').count(), 1)
uguale('e se ne va dal banco', await page.locator('[data-casella-pezzo="spada-corta"]').count(), 0)
/* toccando una casella dell'eroe si vede quello che ha addosso */
await toccaIl('[data-casella="mano"]')
await attendi(page, 200)
uguale('toccando la mano il pannello dice la spada corta', await page.locator('[data-pannello][data-cosa="spada-corta"]').count(), 1)
await chiudiBanco()
uguale('le gemme sono scese della spada', await gemme(), dopo)
await scatto(page, 'mercanti-mappa-armaiolo')

/* ---------- 5. si scende con la roba comprata ---------- */
await scendiNelSotterraneo(page, 0)
await page.waitForSelector('.sot-tela', { timeout: 5000 })
await attendi(page, 500)
await page.locator('[data-azione="zaino"]').click()
await page.waitForSelector('[data-zaino]', { timeout: 3000 })
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

/* ---------- 7. e alla discesa dopo si ritrova, e lo zaino la usa ---------- */
await scendiNelSotterraneo(page, 0)
await page.waitForSelector('.sot-tela', { timeout: 5000 })
await attendi(page, 500)
await page.locator('[data-azione="zaino"]').click()
await page.waitForSelector('[data-zaino]', { timeout: 3000 })
uguale('la discesa dopo ritrova la pozione', await page.locator('[data-tasca][data-cosa="pozione"]').count(), 1)
uguale('e la spada in mano', await page.locator('[data-zaino] [data-casella="mano"][data-cosa="spada-corta"]').count(), 1)
/* il medaglione dalla tasca: il confronto dice la difesa, e «Indossa» lo mette al dito */
await page.locator('[data-tasca][data-cosa="medaglione"]').click()
await attendi(page, 600)   // la finestra entra con un'animazione: la foto la aspetta
uguale('il medaglione alza la difesa di uno', (await page.locator('[data-zaino] [data-confronto="dif"]').innerText()).trim(), '🛡️ 1 → 2')
await scatto(page, 'mercanti-zaino-ritrovato')
uguale('il tasto dice «Indossa»', (await page.locator('[data-azione="usa"]').innerText()).trim(), 'Indossa')
await page.locator('[data-azione="usa"]').click()
await attendi(page, 200)
uguale('indossato, sta al dito', await page.locator('[data-zaino] [data-casella="dito"][data-cosa="medaglione"]').count(), 1)
/* l'amuleto rosso contro il medaglione al dito: due abilità in riga, una meglio e una peggio */
await page.locator('[data-tasca][data-cosa="amuleto-rosso"]').click()
await attendi(page, 400)
uguale('a sinistra il medaglione', await page.locator('[data-zaino] [data-colonna="addosso"] [data-pezzo]').getAttribute('data-pezzo'), 'medaglione')
uguale('a destra l\'amuleto rosso', await page.locator('[data-zaino] [data-colonna="questo"] [data-pezzo]').getAttribute('data-pezzo'), 'amuleto-rosso')
uguale('la difesa è peggio, in rosso', await page.locator('[data-zaino] [data-abilita="dif"]').getAttribute('data-verso'), 'giu')
uguale('la vita è meglio, in verde', await page.locator('[data-zaino] [data-abilita="vita"]').getAttribute('data-verso'), 'su')
uguale('i valori della vita: «—» e +6', `${(await page.locator('[data-valore="vita-addosso"]').innerText()).trim()} ${(await page.locator('[data-valore="vita-questo"]').innerText()).replace(/\s+/g, '')}`, '— +6▲')
uguale('la sintesi dello zaino', (await page.locator('[data-zaino] [data-sintesi]').innerText()).trim(), 'meglio in 1, peggio in 1')
uguale('e il totale che cambia sull\'eroe: la vita', await page.locator('[data-zaino] [data-confronto="vita"]').getAttribute('data-verso'), 'su')
await scatto(page, 'mercanti-zaino-affiancato')
/* e la pozione si beve */
await page.locator('[data-tasca][data-cosa="pozione"]').click()
await attendi(page, 200)
uguale('per la pozione il tasto dice «Bevi»', (await page.locator('[data-azione="usa"]').innerText()).trim(), 'Bevi')
await page.locator('[data-azione="usa"]').click()
await attendi(page, 200)
uguale('bevuta, la tasca è vuota', await page.locator('[data-tasca][data-cosa="pozione"]').count(), 0)
await page.locator('[data-azione="chiudi"]').click()
await attendi(page, 200)
uguale('e lo zaino si chiude con la ✕', await page.locator('[data-zaino]').count(), 0)

uguale('nessun errore in console', errori.join(' · '), '')
nota(`gemme: 60 → ${60 - spese} (pozione e boccetta) → ${dopo} (ascia venduta, spada corta comprata)`)
await browser.close()
riassunto('i mercanti di sopra col dito')
