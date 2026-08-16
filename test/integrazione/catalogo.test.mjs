/* ═══════════════════════════════════════════════════════════════════
   LA SCHEDA «LE DOMANDE» — l'elenco, e i due modi di provarle.

   Il catalogo lo prova già senza browser `unita/catalogo`: che l'elenco
   sia completo, che ogni riga sappia rigenerare la sua domanda, che le
   difficoltà siano quelle vere. Quello che lì non si può vedere è se il
   pannello **si apre davvero e mostra quello che ha promesso** — ed è
   tutto quello che conta per chi la usa, perché questa scheda esiste
   solo per guardare.

   Quattro gesti, che sono i quattro modi di arrivare a una domanda:

     · aprire un modulo e vedere le sue classi in fila, con la
       difficoltà di fianco;
     · il ▶ di una riga: si apre **quella** domanda, non una a caso —
       che è il difetto da cui nasce tutta la scheda;
     · «scorrile tutte»: il contatore avanza, il tasto indietro torna;
     · «come le vede il bambino»: si pesca a quella difficoltà, e la
       domanda che arriva può essere di un modulo qualunque.

   L'attesa dopo l'apertura non è un contorno: una domanda appena
   comparsa non si lascia toccare per 320 ms (`quiz/Domanda.vue`), e
   senza il test racconterebbe che rispondere non fa niente.
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, semina, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const CIECA = 400          // la finestra cieca di Domanda.vue, con margine

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await semina(page, { coins: 100 })

/* ── dentro la pagina dei grandi ── */
await page.click('.carta[data-azione="grandi"]')
await page.waitForSelector('.tastierino', { timeout: 5000 })
for (const c of '0000') await page.click(`.tasto >> text="${c}"`)
await page.waitForSelector('.carte', { timeout: 5000 })

controlla('c\'è la terza scheda', await page.isVisible('.schede button[data-scheda="domande"]'))
await page.click('.schede button[data-scheda="domande"]')
await page.waitForSelector('.catalogo', { timeout: 5000 })

/* ── 1. l'elenco ── */
const moduli = await page.locator('.modulo[data-modulo]').count()
controlla('i moduli sono tutti in elenco', moduli >= 15, `ne vedo ${moduli}`)
controlla('e stanno sotto la loro materia',
  (await page.locator('.materia').count()) >= 4)
uguale('le classi stanno chiuse finché non si apre un modulo',
       await page.locator('.classe').count(), 0)

await page.click('.modulo[data-modulo="problemi"]')
await page.waitForSelector('.classi[data-classi="problemi"]', { timeout: 5000 })
const classi = await page.locator('.classi[data-classi="problemi"] .classe').count()
uguale('«Problemi» apre le sue dieci classi', classi, 10)

/* la difficoltà di fianco a ognuna: è la ragione per cui l'elenco
   esiste, e senza sarebbe solo un indice */
const numeri = await page.locator('.classi[data-classi="problemi"] .dif b').allInnerTexts()
uguale('ogni riga porta la sua difficoltà', numeri.length, classi)
uguale('la prima sta a 0 e l\'ultima a 100',
       `${numeri[0].trim()}–${numeri.at(-1).trim()}`, '0–100')
controlla('e crescono scendendo',
  numeri.every((n, i) => i === 0 || Number(numeri[i - 1]) <= Number(n)),
  numeri.join(' '))
await scatto(page, 'catalogo-modulo')

/* ── 2. il ▶ di una riga apre QUELLA domanda ── */
const riga = page.locator('.classi[data-classi="problemi"] .classe').nth(9)
const nomeRiga = (await riga.locator('.classe-chi b').innerText()).trim()
await riga.locator('[data-prova-classe]').click()
await page.waitForSelector('.prova-velo .qz-consegna', { timeout: 5000 })
await page.waitForTimeout(CIECA)
const titolo = (await page.locator('.prova-chi').innerText()).trim()
controlla('il ▶ di una riga apre proprio quella', titolo.includes(nomeRiga),
          `«${titolo}» invece di «${nomeRiga}»`)
uguale('e non è un giro, quindi niente contatore', await page.locator('[data-conta]').count(), 0)

/* si può rispondere, come nel gioco vero */
await page.click('.prova-velo .qz-tasto')
await page.waitForTimeout(1800)
controlla('rispondere dice com\'è andata',
  (await page.locator('.prova-velo .qz-esito').innerText()).trim().length > 0)
await page.click('.prova-fine')
await page.waitForTimeout(250)

/* ── 3. scorrile tutte: il contatore avanza e torna ── */
await page.click('[data-modulo-giro="problemi"]')
await page.waitForSelector('.prova-velo .qz-consegna', { timeout: 5000 })
await page.waitForTimeout(CIECA)
uguale('il giro parte dalla prima', (await page.locator('[data-conta]').innerText()).trim(), '1 di 10')
const prima = (await page.locator('.prova-chi').innerText()).trim()

await page.click('.prova-altra')
await page.waitForTimeout(CIECA)
uguale('«la prossima» avanza', (await page.locator('[data-conta]').innerText()).trim(), '2 di 10')
controlla('e cambia domanda',
  (await page.locator('.prova-chi').innerText()).trim() !== prima)

await page.click('[data-indietro]')
await page.waitForTimeout(CIECA)
uguale('il tasto indietro torna a quella di prima',
       (await page.locator('[data-conta]').innerText()).trim(), '1 di 10')

/* e in fondo si ricomincia, invece di finire in un vicolo cieco */
for (let i = 0; i < 10; i++) { await page.click('.prova-altra'); await page.waitForTimeout(120) }
uguale('dopo l\'ultima si torna alla prima',
       (await page.locator('[data-conta]').innerText()).trim(), '1 di 10')
await scatto(page, 'catalogo-giro')
await page.click('.prova-fine')
await page.waitForTimeout(250)

/* ── 4. come le vede il bambino: si pesca ── */
await page.click('[data-fascia-pesca="facili"]')
await page.waitForSelector('.prova-velo .qz-consegna', { timeout: 5000 })
await page.waitForTimeout(CIECA)
uguale('pescando non c\'è nessun contatore', await page.locator('[data-conta]').count(), 0)
const dove = (await page.locator('.prova-chi').innerText()).trim()
controlla('e si legge da dove è arrivata', /grado \d/.test(dove), dove)
nota(`fascia facile → ${dove.replace(/\n+/g, ' · ')}`)

/* «un'altra» pesca ancora: qui non si scorre niente, quindi il tasto
   non deve promettere una prossima */
await page.click('.prova-altra')
await page.waitForTimeout(CIECA)
controlla('e se ne può chiedere un\'altra',
  (await page.locator('.prova-velo .qz-consegna').innerText()).trim().length > 0)
await page.click('.prova-fine')
await page.waitForTimeout(250)

/* ── 5. guardare non ha spento niente ── */
await page.click('.schede button[data-scheda="sa"]')
await page.waitForSelector('.carta[data-sapere="problemi"]', { timeout: 5000 })
controlla('dopo tutto questo guardare, niente è spento',
  !(await page.isVisible('.carta[data-sapere="problemi"].spento')))

/* ── 6. e nel dettaglio di «Cosa sa» la difficoltà si vede ── */
await page.click('button[data-dettaglio="problemi"]')
await page.waitForSelector('.dettaglio .voce', { timeout: 5000 })
const voce = (await page.locator('.dettaglio .voce').first().innerText()).replace(/\s+/g, ' ')
controlla('ogni voce dice modulo, grado e difficoltà', /grado .* difficoltà \d+/.test(voce), voce)

uguale('nessun errore in console', errori.length, 0, errori.join(' | '))
await browser.close()
riassunto('la scheda «Le domande»')
