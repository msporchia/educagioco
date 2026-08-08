/* ═══════════════════════════════════════════════════════════════════
   LA CAMPAGNA DELLE TABELLINE, NEL BROWSER
     node test/integrazione/campagna-mate.mjs   (dopo `npm run build`)

   Tre cose che nessun test unitario può dire:
     · aprendo il gioco si vede la mappa dei pianeti, non più la domanda
       "quali tabelline vuoi allenare?"
     · dentro una tappa le domande sono per lo più della tabellina nuova
     · superato il bersaglio la tappa si chiude, paga, e resta superata
       anche dopo aver richiuso il gioco
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, scatto, TELEFONO } from '../aiuto/browser.mjs'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { viewport: TELEFONO })
await azzera(page)

/* ---------- 1. si entra e c'è la mappa ---------- */
await page.getByText('Asteroidi', { exact: true }).click()
await page.waitForSelector('.pianeti', { timeout: 5000 })

const testo = await page.evaluate(() => document.body.innerText)
controlla('la mappa dei pianeti sostituisce la scelta delle tabelline',
          !/Quali tabelline vuoi allenare/i.test(testo))
controlla('si vede il primo pianeta', /Il pianeta del 2/.test(testo))
controlla('e il volo libero è ancora chiuso', !/Volo libero ♾️/.test(testo))

const pianeti = await page.evaluate(() =>
  [...document.querySelectorAll('.pianeta')].map(b => ({ testo: b.innerText, chiuso: b.disabled })))
uguale('dieci pianeti in fila', pianeti.length, 10)
uguale('solo il primo è aperto', pianeti.filter(p => !p.chiuso).length, 1)

await scatto(page, 'campagna-mate-mappa')

/* ---------- 2. si gioca il primo pianeta ---------- */
await page.locator('.pianeta').first().click()
await page.waitForTimeout(300)

const partita = await page.evaluate(async () => {
  const m = window.__mate
  const bersaglio = m.tappa.value.bersaglio
  const viste = []
  // si risponde sempre giusto: interessa dove porta il bersaglio, non la bravura
  for (let i = 0; i < 200 && m.fase.value === 'gioco'; i++) {
    viste.push([m.domanda.a, m.domanda.b])
    const giusto = m.asteroidi().find(x => x.ok && !x.morto)
    if (!giusto) break
    m.colpisci(giusto)
    await new Promise(r => setTimeout(r, 15))
  }
  return { viste, bersaglio, fase: m.fase.value, giuste: m.hud.giuste,
           mirate: m.hud.mirate, tappa: m.progresso.value.tappa }
})

uguale('il bersaglio chiude la tappa', partita.fase, 'vinta')
uguale('e la tappa risulta superata', partita.tappa, 1)
controlla('senza chiedere più centri del bersaglio',
          partita.giuste >= partita.bersaglio && partita.giuste <= partita.bersaglio + 4,
          `${partita.giuste} centri per un bersaglio di ${partita.bersaglio}`)

/* la tabellina del pianeta deve essere la maggioranza di quello che esce:
   è tutta la differenza fra una tappa e una partita qualsiasi */
const suoi = partita.viste.filter(([a, b]) => a === 2 || b === 2).length
const quota = suoi / partita.viste.length
dentro('la tabellina nuova è la maggior parte delle domande', Math.round(quota * 100), 50, 95)
nota(`${suoi} domande su ${partita.viste.length} erano della tabellina del 2`)

const fuori = partita.viste.filter(([a, b]) => ![1, 2].includes(a) && ![1, 2].includes(b))
uguale('e non esce nessuna tabellina non ancora aperta', fuori.length, 0)

await scatto(page, 'campagna-mate-vinta')

/* ---------- 3. il progresso resta dopo aver chiuso ---------- */
await page.reload()
await page.waitForSelector('.carte', { timeout: 10000 })
const home = await page.evaluate(() => document.body.innerText)
controlla('la home dice a che pianeta si è arrivati', /pianeta 2 di 10/.test(home),
          home.split('\n').find(r => /pianeta/i.test(r)) || 'nessuna riga sui pianeti')

await page.getByText('Asteroidi', { exact: true }).click()
await page.waitForSelector('.pianeti', { timeout: 5000 })
const dopo = await page.evaluate(() =>
  [...document.querySelectorAll('.pianeta')].filter(b => !b.disabled).length)
uguale('dopo la ricarica sono aperti due pianeti', dopo, 2)

/* ---------- 4. "Cosa so" è una schermata come le altre ---------- */
await page.getByRole('button', { name: /Cosa so/ }).click()
await page.waitForSelector('.cella', { timeout: 5000 })

const tavola = await page.evaluate(() => ({
  celle: document.querySelectorAll('.cella').length,
  barra: !!document.querySelector('.barra-app button[aria-label="indietro"]'),
  titolo: document.querySelector('.barra-app .dove')?.textContent.trim(),
  // il fondo dello spazio non deve arrivare fin qui: è una pagina di progressi
  velo: !!document.querySelector('.velo'),
}))
uguale('la tavola pitagorica è intera', tavola.celle, 100)
controlla('si esce dal tasto della barra, come ovunque', tavola.barra)
uguale('e la barra dice dove si è', tavola.titolo, 'Cosa so')
controlla('non è un velo sopra la partita', !tavola.velo)

await scatto(page, 'campagna-mate-cosa-so')

await page.locator('.barra-app button[aria-label="indietro"]').click()
await page.waitForSelector('.pianeti', { timeout: 5000 })
controlla('e il tasto riporta alla mappa', await page.locator('.pianeti').isVisible())

/* ---------- 5. niente errori per strada ---------- */
uguale('nessun errore in console', errori.length, 0)
if (errori.length) errori.forEach(e => nota(e))

await browser.close()
riassunto('Campagna delle tabelline')
