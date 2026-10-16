/* ═══════════════════════════════════════════════════════════════════
   I PENSIERI DELL'EROE, A SCHERMO — docs/sotterraneo/pensieri.md

   Si scende senza torcia, nel Sotterraneo di sempre e nel 3D: entrando
   compare il fumetto della torcia sopra la testa, sopra l'eroe e non
   addosso, e non si tocca (il tocco passa al campo). Uscendo e
   rientrando nella stessa discesa non torna: la memoria sta
   nell'avventura. Sulla terra di sopra, fermo, l'eroe pensa alla torcia
   della guaritrice; toccando il fumetto lei si illumina e l'eroe le va
   accanto, senza aprire la bottega.
   `--scatti` lascia `sotterraneo-pensieri-2d`, `-3d`, `-sopra`, `-segno`.
   `node test/esegui.mjs sotterraneo-pensieri`
   tempo: 120
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, scatto, attendi, scegli, leggiProfilo } from '../aiuto/browser.mjs'
import { seminaIlSotterraneo } from '../aiuto/sotterraneo-semina.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()

// il fumetto sta sopra la testa: il suo fondo sopra il centro dell'eroe di almeno mezza figura, e dentro lo schermo
async function sopraLaTesta(page, nome) {
  const f = await page.locator('[data-pensiero]').boundingBox()
  const tela = page.locator('.sot-tela')
  const b = await tela.boundingBox()
  const [ex, ey] = (await tela.getAttribute('data-eroe-schermo')).split(',').map(Number)
  controlla(`${nome}: il fumetto sta sopra l'eroe, non addosso`, f.y + f.height < b.y + ey - 12, JSON.stringify({ f, ey }))
  controlla(`${nome}: e la sua coda è sopra di lui`, Math.abs(f.x + f.width / 2 - (b.x + ex)) < f.width / 2 + 4)
  controlla(`${nome}: dentro lo schermo`, f.x >= 0 && f.x + f.width <= 390 && f.y >= b.y)
  uguale(`${nome}: non prende il tocco`, await page.locator('[data-pensiero]').evaluate(e => getComputedStyle(e).pointerEvents), 'none')
}

/* ---------- 1. il Sotterraneo di sempre: entrando senza torcia ---------- */
{
  const { page, errori } = await apriGioco(browser, { hash: 'sotterraneo&eroe=cavaliere&giu=0&seme=5', attesa: '.sot-tela' })
  await page.waitForSelector('[data-pensiero]', { timeout: 6000 }).catch(() => {})
  uguale('2D: entrando senza torcia, il pensiero della torcia', await page.locator('[data-pensiero]').getAttribute('data-pensiero-id').catch(() => null), 'senza-torcia')
  controlla('2D: dice la torcia', /torcia/.test(await page.locator('[data-pensiero]').innerText().catch(() => '')))
  await sopraLaTesta(page, '2D')
  await scatto(page, 'sotterraneo-pensieri-2d')
  // resta qualche secondo, poi se ne va da solo
  await attendi(page, 6500)
  uguale('2D: dopo cinque secondi e mezzo se ne va', await page.locator('[data-pensiero]').count(), 0)
  // si esce con la ✕ e si rientra: la stessa discesa, lo stesso giro, e il pensiero non torna
  const p = await leggiProfilo(page)
  const mem = p.campagne.sotterraneo.cfg.avventure.cavaliere.pensieri
  controlla('2D: la memoria sta nell\'avventura', !!(mem && mem.detti && mem.detti['senza-torcia']), JSON.stringify(mem))
  await page.click('button[aria-label="indietro"]')
  await page.waitForSelector('.carte', { timeout: 5000 })
  await scegli(page, 'sotterraneo')
  await page.waitForSelector('.sot-tela', { timeout: 8000 })
  if (await page.locator('[data-azione="riprendi"]').count()) await page.click('[data-azione="riprendi"]')
  await attendi(page, 3000)
  uguale('2D: rientrando nella stessa discesa non torna', await page.locator('[data-pensiero-id="senza-torcia"]').count(), 0)
  controlla('2D: nessun errore', !errori.length, errori.join(' · '))
  await page.close()
}

/* ---------- 2. il Sotterraneo 3D: lo stesso fumetto, col tema legno ---------- */
{
  const { page, errori } = await apriGioco(browser, { hash: 'eroe=cavaliere&sotterraneo3d=0&seme=5', attesa: '.sot-tela' })
  await page.waitForSelector('[data-pensiero]', { timeout: 15000 }).catch(() => {})
  uguale('3D: entrando senza torcia, il pensiero della torcia', await page.locator('[data-pensiero]').getAttribute('data-pensiero-id').catch(() => null), 'senza-torcia')
  if (await page.locator('[data-pensiero]').count()) {
    await sopraLaTesta(page, '3D')
    controlla('3D: col tema legno', /Palatino|serif/.test(await page.locator('[data-pensiero]').evaluate(e => getComputedStyle(e).fontFamily)))
  }
  await scatto(page, 'sotterraneo-pensieri-3d')
  controlla('3D: nessun errore', !errori.length, errori.join(' · '))
  await page.close()
}

/* ---------- 3. sopra: fermo, pensa alla guaritrice; il tocco la illumina e ci va ---------- */
{
  const { page, errori } = await apriGioco(browser)
  await seminaIlSotterraneo(page, { finite: 2 })
  await page.waitForSelector('[data-pensiero]', { timeout: 9000 }).catch(() => {})
  const id = await page.locator('[data-pensiero]').getAttribute('data-pensiero-id').catch(() => null)
  uguale('sopra: senza torcia, pensa alla guaritrice', id, 'torcia-sopra')
  uguale('sopra: il segno è la guaritrice', await page.locator('[data-pensiero]').getAttribute('data-segno').catch(() => null), 'mercante:erborista')
  const testo = await page.locator('[data-pensiero]').innerText().catch(() => '')
  controlla('sopra: niente ordini nel fumetto', !/\b(compra|vai|devi|dovresti)\b/i.test(testo), testo)
  await scatto(page, 'sotterraneo-pensieri-sopra')
  if (id) {
    const prima = await page.locator('[data-eroe-terra]').getAttribute('data-cella')
    await page.click('[data-pensiero]')
    await attendi(page, 400)
    controlla('sopra: toccato, la guaritrice si illumina', await page.locator('[data-mercante="erborista"][data-indicato]').count() === 1)
    uguale('sopra: e la bottega non si apre da sola', await page.locator('.sot-bottega, [data-bottega]').count(), 0)
    await attendi(page, 2500)
    controlla('sopra: l\'eroe le va accanto', await page.locator('[data-eroe-terra]').getAttribute('data-cella') !== prima)
    uguale('sopra: il fumetto se n\'è andato', await page.locator('[data-pensiero]').count(), 0)
    await scatto(page, 'sotterraneo-pensieri-segno')
  }
  controlla('sopra: nessun errore', !errori.length, errori.join(' · '))
  await page.close()
}

/* ---------- 4. sopra nel Sotterraneo 3D: il mondo generato (viste/Mondo3d.vue), lo stesso pensiero e lo stesso segno ---------- */
{
  // la bottega del cheat dà le gemme a mani nude; chiusa, l'eroe fermo pensa all'arma
  const { page, errori } = await apriGioco(browser, { hash: 'sotterraneo3d=mondo&eroe=cavaliere&bottega=armaiolo&gemme=60&roba=nuda', attesa: '[data-mondo3d]' })
  await page.waitForSelector('[data-chiudi]', { timeout: 15000 })
  await page.click('[data-chiudi]')
  await page.waitForSelector('[data-mondo3d][data-pronto="1"]', { timeout: 30000 })
  await page.waitForSelector('[data-pensiero]', { timeout: 15000 }).catch(() => {})
  uguale('mondo 3D: a mani vuote con le gemme, il pensiero dell\'arma', await page.locator('[data-pensiero]').getAttribute('data-pensiero-id').catch(() => null), 'arma-vecchia')
  const t = await page.locator('[data-pensiero]').innerText().catch(() => '')
  controlla('mondo 3D: una spada, dal fabbro (la prima strada del cavaliere)', /una spada/.test(t) && /dal fabbro/.test(t), t)
  if (await page.locator('[data-pensiero]').count()) {
    const f = await page.locator('[data-pensiero]').boundingBox()
    const [ex, ey] = (await page.locator('[data-eroe-mondo]').getAttribute('data-schermo')).split(',').map(Number)
    const v = await page.locator('[data-mondo3d]').boundingBox()
    controlla('mondo 3D: il fumetto sta sopra l\'eroe', f.y + f.height < v.y + ey - 12, JSON.stringify({ f, ey }))
    await scatto(page, 'sotterraneo-pensieri-mondo3d')
    await page.click('[data-pensiero]')
    await attendi(page, 400)
    controlla('mondo 3D: toccato, il fabbro si illumina', await page.locator('[data-mercante="armaiolo"][data-indicato]').count() >= 1)
    uguale('mondo 3D: e la bottega non si apre', await page.locator('[data-chiudi]').count(), 0)
  }
  controlla('mondo 3D: nessun errore', !errori.length, errori.join(' · '))
  await page.close()
}

await browser.close()
riassunto('i pensieri dell\'eroe, a schermo')
