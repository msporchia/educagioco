/* ═══════════════════════════════════════════════════════════════════
   I GRANDI: LE SCHEDE, E I SALVATAGGI
   perché: salvare, rimettere e cancellare i progressi dietro il PIN, col file vero scritto su disco: un profilo riconoscibile torna uguale dopo il ripristino, un file estraneo non entra, un bambino nuovo dal file non cambia chi gioca; e la barra in basso dei grandi, con le cose che cancellano chiuse in tendine
   a parte perché: i grandi sono tre file per preparazione: questo (i salvataggi, su un profilo riconoscibile), `genitori-codice` (il tastierino, la firma, gli interruttori, i giochi) e `genitori-eta` (l'età, il quadro, chi gioca, la data di nascita); `posta` prova il cestino e il codice dimenticato

   Le tre cose che stanno dietro il PIN: salvare i progressi, rimetterli,
   cancellarli. Sono le uniche operazioni del gioco che possono far
   perdere mesi di partite, quindi vanno provate davvero e non a occhio:
   l'esportazione contiene i progressi veri e non un file vuoto, e dopo
   un ripristino il gioco mostra i dati rimessi e non quelli che aveva in
   memoria un attimo prima.
   `node test/esegui.mjs integrazione/genitori --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { apriBrowser, apriGioco, semina, azzera, scatto, leggiProfilo, GIOCATORE } from '../aiuto/browser.mjs'
import { grandi, RICONOSCIBILE } from '../aiuto/genitori.mjs'
import { controlla, uguale, nota, riassunto, blocco } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, RICONOSCIBILE())
const { entra, apriScheda, moneteInHome } = grandi(page)
// la cartella è sua e non un nome fisso in /tmp: due giri di test insieme, da due worktree, si porterebbero via il file a vicenda
const cartella = mkdtempSync(resolve(tmpdir(), 'giochi-genitori-'))

/* ═══════════ 1. la barra in basso e le tendine ═══════════
   Cinque schede nella barra in basso, ognuna «di chi è»; le cose che cancellano e gli strumenti da sviluppatore stanno in
   tendine chiuse (docs/genitori/riordino.md). Qui non si aprono le tendine da programma: si guarda che nascano chiuse. */
await blocco('la barra in basso e le tendine', async () => {
  await entra()
  uguale('cinque schede nella barra', await page.locator('nav.barra-giu [data-scheda]').count(), 5)
  const barra = await page.locator('nav.barra-giu').boundingBox()
  controlla('la barra sta in fondo allo schermo', Math.abs(barra.y + barra.height - 844) < 2, JSON.stringify(barra))
  controlla('si entra dal bambino', await page.locator('[data-scheda="bambini"].ora').count() === 1 && await page.locator('.carta.chi-gioca').count() === 1)
  for (const morta of ['sa', 'domande'])   // «Cosa sa» e «Domande» dicevano quello che il quadro dell'età dice già
    uguale(`la scheda «${morta}» non c'è più`, await page.locator(`[data-scheda="${morta}"]`).count(), 0)
  uguale('e «Come va» è una di loro', await page.locator('[data-scheda="comeva"]').count(), 1)

  await page.click('[data-scheda="giochi"]')
  await page.waitForSelector('[data-giochi-impostazioni]', { timeout: 5000 })
  controlla('i giochi: il carosello, e l\'età sta nel bambino', await page.locator('[data-giochi-impostazioni] .scaffale').count() === 1 && await page.locator('[data-manopola]').count() === 0)
  controlla('gli interruttori di casa non stanno più fra i giochi', await page.locator('.carta[data-flag="sperimentali"]').count() === 0 && await page.locator('.carta[data-flag="fps"]').count() === 0)

  /* Salvataggi: salvare e rimettere, e le cose che cancellano in una tendina chiusa */
  await page.click('[data-scheda="salvataggi"]')
  await page.waitForSelector('[data-copia-avviso]', { timeout: 5000 })
  controlla('«Zona delicata» è chiusa: i tasti che cancellano non si vedono', !(await page.locator('.carta.pericolo').first().isVisible()))
  await scatto(page, 'impostazioni-salvataggi')
  await page.click('[data-delicata] > summary')
  controlla('aperta, ci sono', await page.locator('.carta.pericolo').first().isVisible())
  await page.click('[data-delicata] > summary')

  /* Impostazioni: il telefono, e in fondo una tendina «Avanzate» */
  await page.click('[data-scheda="impostazioni"]')
  await page.waitForSelector('.carta[data-azione="cambia-codice"]', { timeout: 5000 })
  controlla('impostazioni: il codice, passare il gioco, segnalare', await page.locator('.carta[data-azione="cambia-codice"]').isVisible() && await page.locator('[data-azione="condividi-gioco"]').isVisible() && await page.locator('.carta[data-azione="segnala"]').isVisible())
  /* l'avviso sul salvataggio: mai salvato, e ci sono progressi */
  await page.click('[data-scheda="salvataggi"]')
  controlla('mai salvato: in cima a «Salvataggi» un avviso', await page.locator('[data-copia-avviso]').isVisible() && /mai stati salvati/.test(await page.locator('[data-copia-avviso]').innerText()))
  const [scaricato] = await Promise.all([page.waitForEvent('download', { timeout: 8000 }), page.click('[data-copia-avviso]')])
  controlla('toccarlo salva su file', /giochi-progressi-.*\.json$/.test(scaricato.suggestedFilename()))
  controlla('e l\'avviso sparisce', await page.waitForSelector('[data-copia-avviso]', { state: 'detached', timeout: 3000 }).then(() => true, () => false))
  await page.click('[data-scheda="impostazioni"]')
  controlla('«Avanzate» è chiusa: l\'fps non si vede', !(await page.locator('.carta[data-flag="fps"]').isVisible()))
  await scatto(page, 'impostazioni-impostazioni')
  await page.click('[data-sviluppo] > summary')
  await page.locator('.carta[data-flag="fps"]').scrollIntoViewIfNeeded()
  controlla('aperta, c\'è il contatore fps e si può premere (la barra non lo copre)', await page.locator('.carta[data-flag="fps"]').isVisible())
  await page.click('.carta[data-flag="fps"]', { trial: true })
  /* l'ultima cosa di ogni scheda si raggiunge: la barra non la copre */
  await page.evaluate(() => { const c = document.querySelector('.centro'); c.scrollTop = c.scrollHeight })
  await page.waitForFunction(() => { const c = document.querySelector('.centro'); return c.scrollTop + c.clientHeight >= c.scrollHeight - 1 }, null, { timeout: 2000 }).catch(() => {})
  const ultima = await page.evaluate(() => {
    const nav = document.querySelector('nav.barra-giu').getBoundingClientRect()
    const carte = [...document.querySelectorAll('.centro details[open] .carta, .centro > .carte .carta, .centro > details .carta')]
    const g = carte.map(e => e.getBoundingClientRect()).filter(r => r.height > 0).sort((a, b) => b.bottom - a.bottom)[0]
    return { navTop: nav.top, ultimaBottom: g ? g.bottom : 0 }
  })
  controlla('in fondo alla scheda l\'ultima carta sta sopra la barra', ultima.ultimaBottom <= ultima.navTop + 1, JSON.stringify(ultima))
  await page.click('.tondo')
  await page.waitForSelector('.carte', { timeout: 5000 })
})

/* ═══════════ 2. salvare, cancellare, rimettere ═══════════ */
await blocco('salvare, cancellare, rimettere', async () => {
  /* Le monete non si confrontano col numero seminato: il seme porta due campagne a mezza strada, che si meritano tre medaglie
     pagate alla prima apertura (`store/progressi.js`, `PREMI`). Si legge quanto c'è davvero un attimo prima di scaricare */
  const moneteVere = (await leggiProfilo(page)).coins
  controlla('il seme si è preso le medaglie che gli spettano', moneteVere >= 777, `${moneteVere} monete`)
  await entra()
  await apriScheda('salvataggi')
  controlla('ci sono tutte e tre le cose', await page.evaluate(() => {
    const t = document.body.innerText
    return t.includes('Salva su file') && t.includes('Rimetti da un file') && t.includes('Cancella')
  }))
  await scatto(page, 'genitori')
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 8000 }), page.click('.carta >> text="Salva su file"')])
  const salvataggio = resolve(cartella, 'giochi-progressi-prova.json')
  await dl.saveAs(salvataggio)
  let dati = null
  try { dati = JSON.parse(readFileSync(salvataggio, 'utf8')) } catch (e) { /* sotto */ }
  uguale('il file si scarica, e si chiama come deve', /^giochi-progressi-\d{4}-\d{2}-\d{2}\.json$/.test(dl.suggestedFilename()), true)
  controlla('e si legge', !!dati)
  const mio = dati?.profili?.[GIOCATORE]
  uguale('dentro ci sono le monete vere', mio?.coins, moneteVere)
  uguale('e i conti dei giochi', mio?.totals?.math, 42)
  controlla('è marchiato come salvataggio dei giochi', dati?.tipo === 'giochi-bambini')
  /* quello che un genitore chiama «i progressi» è soprattutto cosa il bambino sa e dov'è arrivato */
  uguale('c\'è lo stato di apprendimento, elemento per elemento', mio?.items?.['en:dog']?.r, 3)
  uguale('e dove è arrivato nelle campagne', mio?.td?.tappa, 4)
  uguale('anche quelle dei giochi nuovi', mio?.campagne?.sotterraneo?.tappa, 2)
  controlla('e i traguardi presi', !!mio?.badge)
  controlla('il file si porta dietro anche i nomi', Array.isArray(dati?.giocatori))

  /* cancellare chiede conferma */
  await page.click('.carta.pericolo')
  await page.waitForSelector('.carta.pericolo.aperta', { timeout: 5000 })
  controlla('cancellare chiede conferma invece di fare e basta', await page.isVisible('text="Sì, cancella"'))
  await page.click('text="No, lascia stare"')
  controlla('si può tornare indietro', await page.waitForSelector('.carta.pericolo.aperta', { state: 'detached', timeout: 2000 }).then(() => true, () => false))
  /* cancella davvero */
  await page.click('.carta.pericolo')
  await page.click('text="Sì, cancella"')
  await page.waitForFunction(() => !document.querySelector('.carta.pericolo.aperta'), null, { timeout: 3000 }).catch(() => {})
  await page.click('.tondo')                       // torna alla home
  await page.waitForSelector('.carte', { timeout: 5000 })
  uguale('dopo la cancellazione le monete sono a zero', await moneteInHome(), 0)

  /* e si rimettono: un salvataggio che non si riesce a rimettere dentro non è una rete di sicurezza, è un file. Lo stesso id
     c'è già (appena cancellato, non eliminato): chiede conferma prima di sovrascriverlo (docs/genitori/cestino-e-posta.md) */
  await entra()
  await apriScheda('salvataggi')
  await page.setInputFiles('input[type=file]', salvataggio)
  await page.waitForSelector('[data-conferma="importazione"]', { timeout: 5000 })
  await page.click('[data-azione="importazione-conferma"]')
  controlla('dice chi ha rimesso', await page.waitForFunction(g => new RegExp('Rimessi i progressi di ' + g).test(document.body.innerText),
                                                               GIOCATORE, { timeout: 3000 }).then(() => true, () => false))
  await page.click('.tondo')
  await page.waitForSelector('.carte', { timeout: 5000 })
  uguale('le monete sono tornate quelle salvate', await moneteInHome(), moneteVere)

  /* un file qualsiasi non deve entrare: sovrascriverebbe i progressi con spazzatura, ed è irreversibile */
  const finto = resolve(cartella, 'giochi-non-mio.json')
  writeFileSync(finto, JSON.stringify({ ciao: 'mondo' }))
  await entra()
  await apriScheda('salvataggi')
  await page.setInputFiles('input[type=file]', finto)
  controlla('un file estraneo viene rifiutato', await page.waitForSelector('.avviso', { timeout: 3000 }).then(() => true, () => false))
})

/* ═══════════ 3. un bambino nuovo dal file ═══════════
   Non cambia chi sta giocando, quindi il gioco lo dice e offre «Passa a …» (senza, sembrava che il file non avesse fatto
   niente). In fondo: poi chi gioca è lui. */
await blocco('un bambino nuovo dal file', async () => {
  if (!(await page.locator('[data-scheda="salvataggi"].ora').count())) { await entra(); await apriScheda('salvataggi') }
  const nuovo = resolve(cartella, 'giochi-un-altro-bambino.json')
  writeFileSync(nuovo, JSON.stringify({ tipo: 'giochi-bambini', v: 2, esportato: new Date().toISOString(),
    giocatori: [{ id: 'dal-file', nome: 'Dalfile' }], profili: { 'dal-file': { v: 7, coins: 321, items: {}, settings: { eta: 8 } } } }))
  await page.setInputFiles('input[type=file]', nuovo)
  await page.waitForSelector('[data-importato]', { timeout: 5000 })
  const detto = await page.locator('[data-importato]').innerText()
  controlla('dice chi è stato rimesso e che chi gioca è ancora l\'altro', /Dalfile/.test(detto) && /ancora/.test(detto), detto)
  controlla('e offre di passare a lui', await page.locator('[data-azione="passa-a"][data-id="dal-file"]').isVisible())
  controlla('la carta di prima avvisa che i bambini nuovi si aggiungono', /i nuovi si aggiungono/.test(await page.locator('[data-azione="rimetti-da-file"]').innerText()))
  await page.click('[data-azione="passa-a"][data-id="dal-file"]')
  await page.waitForSelector('.carte .carta.gioco', { timeout: 8000 })
  uguale('passando, la home è quella di lui', (await page.locator('[data-nome]').innerText()).trim(), 'Dalfile')
  uguale('con le sue monete', (await leggiProfilo(page, 'dal-file')).coins, 321)
})

uguale('nessun errore in console', errori.length, 0)
if (errori.length) errori.forEach(e => nota(e))
rmSync(cartella, { recursive: true, force: true })
await browser.close()
riassunto('i grandi: le schede e i salvataggi')
