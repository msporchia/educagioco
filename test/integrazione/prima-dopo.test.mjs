/* ═══════════════════════════════════════════════════════════════════
   PRIMA E DOPO, NEL BROWSER

   Due cose che il motore non può dire, e che si vedono solo qui.

   **Quanto sono grandi i disegni.** È tutto il senso del cassetto
   disegnato: se una vignetta torna a essere un francobollo, la faccia
   che racconta la storia non si vede più e tanto valevano le emoji. La
   misura non è più fissa (`--pd-vignetta` la ricava da quante ne stanno
   in fila), quindi è esattamente il genere di cosa che si scolla in
   silenzio: qui si misura sul vetro, su un telefono da 390 px.

   **Cosa succede quando si sbaglia.** Si sbaglia apposta — posando le
   vignette nell'ordine in cui sono sparse, che il motore garantisce non
   essere mai quello giusto — e si guarda il foglio della spiegazione:
   la storia intera, un passo per riga, con sotto cos'è. Poi si preme
   «ho capito» e si controlla la cosa che nessun test di unità vede: che
   il gioco **vada avanti**, cioè che la domanda dopo si lasci toccare.
   È il guasto del `v-if` che non si spegne mai, quello che in cinque
   schermate incatenate era vivo in quattro (vedi CLAUDE.md).
   `node test/esegui.mjs prima-dopo`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, scatto, semina, attendi }
  from '../aiuto/browser.mjs'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/giochi/prima-dopo/dati/campagna.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

/* ---------- 1. si entra dalla home ---------- */
const carta = page.locator('.carta.gioco[data-gioco="prima"]')
controlla('la carta del gioco è in home', await carta.count() === 1)
await carta.click()
await page.waitForSelector('.pd-mappa', { timeout: 5000 })
uguale('la mappa elenca tutte le tappe', await page.locator('.pd-tappa').count(), CAMPAGNA.length)

/* ---------- 2. le vignette sono grosse quanto lo schermo permette ---------- */
await page.locator('.pd-tappa[data-tappa="0"]').click()
await page.waitForSelector('.pd-storia', { timeout: 5000 })
await attendi(page, 400)      // la finestra cieca dei 320 ms
await scatto(page, 'prima-tavolo')

uguale('la striscia ha tre buche', await page.locator('.pd-striscia .pd-buca').count(), 3)
uguale('e sotto ci sono tre vignette da pescare',
       await page.locator('.pd-pesca .pd-vignetta').count(), 3)
{
  const buca = await page.locator('.pd-striscia .pd-buca').first().boundingBox()
  const vign = await page.locator('.pd-pesca .pd-vignetta').first().boundingBox()
  /* su un telefono da 390 px, tre in fila con 10 px di stacco fanno
     115: sotto i 105 vuol dire che è tornata una misura fissa */
  dentro('una vignetta riempie un terzo di schermo', Math.round(buca.width), 105, 130)
  uguale('la buca e la vignetta sono uguali', Math.round(buca.width), Math.round(vign.width))
  uguale('e sono quadrate', Math.round(buca.width), Math.round(buca.height))
}

/* ---------- 3. si sbaglia apposta ---------- */
/* Posare le vignette nell'ordine in cui compaiono è **sempre** una
   risposta sbagliata: `mescolaSenzaOrdine` esclude lo spargimento già
   ordinato. Non serve sapere che storia sia. */
for (let i = 0; i < 3; i++) {
  await page.locator('.pd-pesca .pd-vignetta').first().click()
  await attendi(page, 150)
}
await page.waitForSelector('[data-spiega]', { timeout: 3000 })
controlla('una risposta sbagliata apre la spiegazione', true)

/* ---------- 4. la spiegazione dice la storia ---------- */
{
  const righe = page.locator('[data-spiega] .pd-passi li')
  uguale('la spiegazione ha una riga per passo', await righe.count(), 3)
  const frasi = await page.locator('[data-spiega] .pd-frase').allInnerTexts()
  controlla('ogni riga dice cos\'è quel disegno', frasi.every(f => f.trim().length > 3),
            JSON.stringify(frasi))
  controlla('e letta di fila è una frase: prima, poi, infine',
            frasi[0].startsWith('Prima') && frasi[2].startsWith('Infine'),
            JSON.stringify(frasi))
  const nome = (await page.locator('[data-spiega] .pd-nome').innerText()).trim()
  controlla('dice anche di che storia si trattava', nome.length > 3, nome)
  const riq = await page.locator('[data-spiega] .pd-riquadro').first().boundingBox()
  dentro('e i disegni lì sono i più grandi del gioco', Math.round(riq.width), 84, 132)
  nota(`spiegazione: «${frasi.join(' · ')}»`)
  await scatto(page, 'prima-spiegazione')
}

/* ---------- 5. si resta il tempo di guardarla ---------- */
/* Il lampo di prima durava 700 ms e se ne andava da solo: qui il foglio
   deve essere ancora lì dopo un secondo e mezzo, e ad andarsene ci
   pensa il tasto — o, se non lo tocca nessuno, i sette secondi della
   barra, che il test non aspetta. */
await attendi(page, 1500)
uguale('dopo un secondo e mezzo la spiegazione è ancora a schermo',
       await page.locator('[data-spiega]').count(), 1)

/* ---------- 6. «ho capito», e il gioco va avanti ---------- */
await page.locator('[data-spiega] .pd-grosso').click()
await page.waitForSelector('[data-spiega]', { state: 'detached', timeout: 3000 })
uguale('il foglio si chiude', await page.locator('[data-spiega]').count(), 0)
await attendi(page, 400)      // la finestra cieca della domanda nuova

uguale('e si torna a una striscia vuota',
       await page.locator('.pd-striscia .pd-buca.pd-piena').count(), 0)
await page.locator('.pd-pesca .pd-vignetta').first().click()
await attendi(page, 200)
uguale('la domanda dopo si lascia toccare davvero',
       await page.locator('.pd-striscia .pd-buca.pd-piena').count(), 1)

/* ---------- 7. quattro vignette non stanno in fila, stanno in quadrato ---------- */
/* Quattro su una riga verrebbero da 84 px, che per un disegno con
   dentro una faccia è di nuovo un francobollo. Due e due ne fanno 158,
   e l'ordine lo dicono i numeri nelle buche. */
await semina(page, { campagne: { prima: { tappa: 9, stelle: {}, cfg: {} } } })
await page.locator('.carta.gioco[data-gioco="prima"]').click()
await page.waitForSelector('.pd-mappa', { timeout: 5000 })
await page.locator('.pd-tappa[data-tappa="3"]').click()
await page.waitForSelector('.pd-storia', { timeout: 5000 })
await attendi(page, 400)
{
  const buche = page.locator('.pd-striscia .pd-buca')
  uguale('la striscia dei quattro passi ha quattro buche', await buche.count(), 4)
  const prima = await buche.nth(0).boundingBox()
  const terza = await buche.nth(2).boundingBox()
  dentro('in quadrato una vignetta è larga il doppio', Math.round(prima.width), 130, 176)
  controlla('la terza buca va a capo sotto la prima', terza.y > prima.y + prima.height / 2,
            `prima a y=${Math.round(prima.y)}, terza a y=${Math.round(terza.y)}`)
  uguale('e le quattro da pescare sono grandi uguale',
         Math.round((await page.locator('.pd-pesca .pd-vignetta').first().boundingBox()).width),
         Math.round(prima.width))
  await scatto(page, 'prima-quadrato')
}
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('.pd-mappa', { timeout: 5000 })

/* ---------- 8. l'intruso: la spiegazione dice anche chi non c'entrava ---------- */
await page.locator('.pd-tappa[data-tappa="8"]').click()
await page.waitForSelector('.pd-storia', { timeout: 5000 })
await attendi(page, 400)

uguale('nell\'intruso ci sono quattro vignette', await page.locator('.pd-striscia .pd-buca').count(), 4)
{
  /* e stanno in quadrato, non in fila: sotto non c'è niente da pescare,
     quindi lo schermo è tutto loro e si fanno il doppio */
  const prima = await page.locator('.pd-striscia .pd-buca').nth(0).boundingBox()
  const terza = await page.locator('.pd-striscia .pd-buca').nth(2).boundingBox()
  dentro('in quadrato le vignette sono il doppio', Math.round(prima.width), 140, 200)
  controlla('la terza va a capo sotto la prima', terza.y > prima.y + prima.height / 2,
            `prima a y=${Math.round(prima.y)}, terza a y=${Math.round(terza.y)}`)
}

/* si tocca una vignetta a caso finché una è quella sbagliata: tre volte
   su quattro basta la prima */
for (let i = 0; i < 4; i++) {
  if (await page.locator('[data-spiega]').count()) break
  await page.locator('.pd-striscia .pd-buca').nth(i).click()
  await attendi(page, 250)
}
if (await page.locator('[data-spiega]').count()) {
  uguale('la spiegazione dell\'intruso fa vedere la storia vera, senza intruso',
         await page.locator('[data-spiega] .pd-passi li').count(), 4)
  const fuori = await page.locator('[data-spiega] .pd-fuori').count()
  uguale('e dice qual era la vignetta di un\'altra storia', fuori, 1)
  await scatto(page, 'prima-intruso')
} else {
  nota('intruso: indovinato al primo colpo, la spiegazione non si è aperta')
}

controlla('nessun errore in console', errori.length === 0, errori.join(' · '))
await browser.close()
riassunto('prima e dopo, nel browser')
