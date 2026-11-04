/* ═══════════════════════════════════════════════════════════════════
   IL LABORATORIO DELLE POZIONI, NEL BROWSER

   La prova unitaria dice che il motore è giusto; questa dice che il
   gioco che il bambino tocca è quel motore lì. La prima tappa si gioca
   **dallo schermo**: si legge la ricetta sulla pergamena, si apre il
   rotolo del mercante, si toccano le targhette e si ordina. Poi un
   trabocco e la spugna, l'intruso, la fine della tappa e quello che
   resta nel profilo.
   `node test/esegui.mjs pozioni`
   tempo: 90
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, leggiProfilo, scatto, attendi, scegli }
  from '../aiuto/browser.mjs'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA, MONETE_A_DOSE } from '../../src/giochi/pozioni/dati/campagna.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
/* un bambino di nove anni: il laboratorio è in home, e le prime tappe
   dei pesi gli sono già passate — quindi aperte */
await semina(page, { settings: { eta: 9 } })

/* ---------- 1. si entra dalla home ---------- */
const carta = page.locator('.carta.gioco[data-gioco="pozioni"]')
controlla('la carta del gioco è in home', await carta.count() === 1)
await scegli(page, 'pozioni')
await page.waitForSelector('.pz-mappa', { timeout: 5000 })
uguale('la mappa elenca tutte le tappe', await page.locator('.pz-tappa').count(), CAMPAGNA.length)
uguale('quattro blocchi: tre famiglie e il calderone', await page.locator('.pz-blocco').count(), 4)
const aperte = await page.locator('.pz-tappa:not(.pz-chiusa)').count()
dentro('a nove anni sono aperte le prime tappe dei pesi', aperte, 1, 9)
nota(`${aperte} tappe aperte a nove anni`)
await scatto(page, 'pozioni-mappa')

/* ---------- 2. la prima tappa, dallo schermo ---------- */
await page.locator('.pz-tappa[data-tappa="0"]').click()
await page.waitForSelector('.pz-mercante', { timeout: 5000 })
await attendi(page, 500)
uguale('si comincia al banco', await page.locator('.pz-mercante').getAttribute('data-fase'), 'banco')
uguale('la pergamena ha gli ingredienti della ricetta', await page.locator('[data-pergamena] [data-voce]').count(), CAMPAGNA[0].ingredienti)
controlla('il cartello dice come si gioca', /mercante/.test(await page.locator('[data-esito]').innerText()))
controlla('la borsa dice quanto si è speso, su quanto', /Hai speso 0 su \d+/.test(await page.locator('[data-gettoni]').innerText()))
await scatto(page, 'pozioni-gioco')

await page.locator('[data-azione="mercante"]').click()
await page.waitForSelector('[data-listino]')
uguale('il rotolo ha tutti gli ingredienti, e un intruso', await page.locator('[data-merce]').count(), CAMPAGNA[0].ingredienti + 1)
uguale('quattro targhette a ingrediente', await page.locator('[data-targhetta]').count(), (CAMPAGNA[0].ingredienti + 1) * 4)
await scatto(page, 'pozioni-listino')

const stato = () => page.evaluate(() => {
  const b = window.__poz.bottega.value
  return { speso: b.speso, finita: b.finita, macchie: b.macchie.length, traboccate: b.traboccate, sprechi: b.sprechi,
           messi: b.ingredienti.map(g => g.messo), voci: b.ingredienti.map(g => g.nome) }
})
/* la più grande che ci sta per il primo ingrediente non finito, come farebbe chi sa */
const laGiusta = () => page.evaluate(() => {
  const b = window.__poz.bottega.value
  const i = b.ingredienti.findIndex(g => g.messo < g.dose), g = b.ingredienti[i]
  const k = g.offerte.map((o, n) => n).filter(n => g.messo + g.offerte[n].base <= g.dose)
    .sort((x, y) => g.offerte[y].base - g.offerte[x].base || g.offerte[x].prezzo - g.offerte[y].prezzo)[0]
  return `${i}:${k}`
})
async function ordinaUna(targhetta) {
  if (!(await page.locator('[data-listino]').count())) await page.locator('[data-azione="mercante"]').click()
  await page.locator(`[data-targhetta="${targhetta}"]`).click()
  await page.locator('[data-azione="ordina"]').click()
}
const fermo = () => page.waitForFunction(() => {
  const el = document.querySelector('[data-azione="mercante"], [data-azione="pulisci"], [data-fine="tappa"]')
  return el && !el.disabled
}, null, { timeout: 15000 })

/* un posto dell'ordine toccato si toglie */
await page.locator(`[data-targhetta="${await laGiusta()}"]`).click()
uguale('la targhetta va nell\'ordine', await page.locator('[data-posto]:not(.pz-libero)').count(), 1)
controlla('la borsa fa vedere quanto costa l\'ordine', /ordine \d+/.test(await page.locator('[data-gettoni]').innerText()))
await page.locator('[data-posto="0"]').click()
uguale('e dall\'ordine si toglie', await page.locator('[data-posto]:not(.pz-libero)').count(), 0)
await page.locator('[data-chiudi]').click()
uguale('la ✕ chiude il rotolo', await page.locator('[data-listino]').count(), 0)

/* l'intruso: si paga, trema sul bancone e il mercante se lo riprende */
{
  const prima = await stato()
  const intruso = await page.evaluate(() => window.__poz.bottega.value.ingredienti.length)
  await ordinaUna(`${intruso}:0`)
  await attendi(page, 300)
  uguale('il rotolo si richiude', await page.locator('[data-listino]').count(), 0)
  await fermo()
  const dopo = await stato()
  controlla('i gettoni se ne vanno', dopo.speso > prima.speso, `${prima.speso} → ${dopo.speso}`)
  uguale('i misurini no', dopo.messi.join(), prima.messi.join())
  controlla('il cartello dice che non era nella ricetta', /non è nella ricetta/.test(await page.locator('[data-esito]').innerText()))
  uguale('e conta come spreco', dopo.sprechi, 1)
}

/* si fanno le dosi, con le targhette vere */
for (let g = 0; g < 40 && !(await page.locator('[data-fine="tappa"]').count()); g++) {
  await ordinaUna(await laGiusta())
  await fermo()
}
uguale('la tappa finisce', await page.locator('[data-fine="tappa"]').count(), 1)
controlla('il cartello di fine dice quanto si è speso', /Hai speso \d+ gettoni: il minimo era \d+/.test(await page.locator('[data-righe]').innerText()))
uguale('l\'intruso toglie la stella del minimo', (await page.locator('[data-stelle]').innerText()).trim().length < 3 * 2, true)
uguale('le monete: tre a ingrediente', (await page.locator('[data-monete]').innerText()).trim(), `+${CAMPAGNA[0].ingredienti * MONETE_A_DOSE} 🪙`)
await scatto(page, 'pozioni-fine')
await page.locator('[data-fine] [data-azione="mappa"]').click()
await page.waitForSelector('.pz-mappa')
await attendi(page, 500)
const p1 = await leggiProfilo(page)
uguale('la tappa è segnata', p1.campagne.pozioni.stelle[0] > 0, true)
uguale('la pozione è contata', p1.totals.pozioni, 1)
uguale('una pozione con un intruso non è perfetta', p1.totals.pozioniPerfette || 0, 0)
controlla('le dosi sono contate', p1.totals.misure >= CAMPAGNA[0].ingredienti, `${p1.totals.misure}`)

/* ---------- 3. un trabocco, la barra di lettura e la spugna ---------- */
await page.locator('.pz-tappa[data-tappa="1"]').click()
await page.waitForSelector('.pz-mercante')
await attendi(page, 500)
{
  /* la più grande del listino finché non ci sta più, poi una di troppo */
  const troppo = () => page.evaluate(() => {
    const b = window.__poz.bottega.value, g = b.ingredienti[0]
    const k = g.offerte.reduce((m, o, n) => (o.base > g.offerte[m].base ? n : m), 0)
    return { t: `0:${k}`, ci: g.messo + g.offerte[k].base <= g.dose, fatto: g.messo === g.dose }
  })
  for (let g = 0; g < 10; g++) {
    const d = await troppo()
    if (!d.ci) break
    await ordinaUna(d.t); await fermo()
  }
  const d = await troppo()
  if (d.fatto) nota('la più grande ha riempito giusto: niente trabocco con questo caso')
  else {
    const prima = await stato()
    await ordinaUna(d.t)
    await page.waitForSelector('[data-azione="pulisci"]', { timeout: 15000 })
    await page.waitForSelector('[data-esito][data-codice="trabocca"]', { timeout: 15000 })
    uguale('il misurino resta com\'era', (await stato()).messi.join(), prima.messi.join())
    controlla('il cartello dice perché', /oltre la tacca/.test(await page.locator('[data-esito]').innerText()))
    controlla('e si legge, prima di pulire', await page.locator('[data-azione="pulisci"]').isDisabled())
    await scatto(page, 'pozioni-trabocco')
    uguale('la scena è in macchia', await page.locator('.pz-mercante').getAttribute('data-fase'), 'macchia')
    await page.waitForFunction(() => !document.querySelector('[data-azione="pulisci"]').disabled, null, { timeout: 15000 })
    const spesoPrima = (await stato()).speso
    await page.locator('[data-azione="pulisci"]').click()
    await fermo()
    uguale('la spugna costa un gettone', (await stato()).speso, spesoPrima + 1)
    uguale('e la macchia non c\'è più', (await stato()).macchie, 0)
  }
}

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('il laboratorio delle pozioni, nel browser')
