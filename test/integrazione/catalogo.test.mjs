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
await page.click('[data-azione="grandi"]')
await page.waitForSelector('.tastierino', { timeout: 5000 })
for (const c of '0000') await page.click(`.tasto >> text="${c}"`)
await page.waitForSelector('.carte', { timeout: 5000 })

controlla('c\'è la terza scheda', await page.isVisible('.schede button[data-scheda="domande"]'))
await page.click('.schede button[data-scheda="domande"]')
await page.waitForSelector('.catalogo', { timeout: 5000 })

/* ── 1. i cinque blocchi ── */
const conta = async () => Object.fromEntries(await page.evaluate(() =>
  [...document.querySelectorAll('.blocco')].map(b => [b.dataset.fascia,
    Number(b.querySelector('.conta').textContent)])))

controlla('c\'è il selettore dell\'età in cima', await page.isVisible('[data-eta="su"]'))
/* quante ne sono spente all'arrivo: non zero, perché qualche sapere
   nasce spento (`difetto: false` in `data/saperi.js`) — quello che
   conta è che questo numero non si muova mentre si guarda */
const spenteInizio = (await page.locator('.blocco.spenta .conta').innerText()).trim()
const blocchi = await conta()
controlla('ci sono i cinque blocchi più le spente',
  ['sotto', 'facili', 'medie', 'toste', 'sopra'].every(k => k in blocchi),
  Object.keys(blocchi).join(','))
controlla('e le domande sono tutte da qualche parte',
  Object.values(blocchi).reduce((a, b) => a + b, 0) >= 150, JSON.stringify(blocchi))
controlla('quelle escluse si vedono lo stesso, contate',
  blocchi.sotto + blocchi.sopra > 0, JSON.stringify(blocchi))
uguale('ma stanno chiuse', await page.locator('.blocco.sotto .riga').count(), 0)
await page.click('[data-apri="sotto"]')
await page.waitForTimeout(200)
controlla('e si aprono toccandole', (await page.locator('.blocco.sotto .riga').count()) > 0)
await scatto(page, 'catalogo-blocchi')

/* ── 1b. l'età sposta tutto, la freccia sposta una riga ──
   È il feedback che questa scheda esiste per dare: si tocca, e si vede
   il mazzo muoversi. Senza, i numeri sarebbero un'altra opinione. */
await page.click('[data-eta="giu"]')
await page.waitForTimeout(300)
const piuGiovane = await conta()
controlla('abbassare l\'età sposta il mazzo',
  piuGiovane.medie !== blocchi.medie || piuGiovane.toste !== blocchi.toste,
  `${JSON.stringify(blocchi)} → ${JSON.stringify(piuGiovane)}`)
await page.click('[data-eta="su"]')
await page.waitForTimeout(300)

const riga = await page.locator('.blocco.medie .riga').first().getAttribute('data-classe')
await page.click(`[data-giu="${riga}"]`)
await page.waitForTimeout(300)
const dopo = await conta()
controlla('e la freccia sposta la singola riga di blocco',
  dopo.medie < blocchi.medie || dopo.facili > blocchi.facili,
  `${JSON.stringify(blocchi)} → ${JSON.stringify(dopo)}`)
controlla('lo scrive nella riga', await page.evaluate(() =>
  document.body.innerText.includes('spostata di')))
await page.click(`[data-su="${riga}"]`)     // rimesso com'era
await page.waitForTimeout(300)

/* ── 2. il ▶ di una riga apre QUELLA domanda ── */
const quale = page.locator('.blocco.medie .riga').nth(2)
const nomeRiga = (await quale.locator('.chi b').innerText()).trim().replace(/^\S+\s/, '')
await quale.locator('[data-prova-classe]').click()
await page.waitForSelector('.prova-velo .qz-consegna', { timeout: 5000 })
await page.waitForTimeout(CIECA)
const titolo = (await page.locator('.prova-chi').innerText()).trim()
controlla('il ▶ di una riga apre proprio quella', titolo.includes(nomeRiga),
          `«${titolo}» invece di «${nomeRiga}»`)
uguale('e non è un giro, quindi niente contatore', await page.locator('[data-conta]').count(), 0)

/* si risponde come nel gioco: la barra si riempie e poi si prosegue da
   soli, senza premere niente fra una domanda e l'altra */
await page.click('.prova-velo .qz-tasto')
await page.waitForSelector('.qz-avanti', { timeout: 3000 })
controlla('rispondendo compare la stessa barra del gioco',
  await page.isVisible('.qz-avanti.saltabile'))
await page.waitForTimeout(1800)
controlla('e poi la domanda dopo arriva da sola',
  (await page.locator('.prova-velo .qz-consegna').count()) === 1)
/* ── e l'attesa qui si salta ──
   Nel gioco l'attesa dopo una risposta serve, e si vede apposta. Qui
   chi guarda è un grande che sta scorrendo venti domande per
   giudicarle: aspettare un secondo e mezzo per ognuna è solo tempo, e
   un tocco manda avanti. */
controlla('nel pannello l\'attesa si può saltare',
  await page.isVisible('.qz-avanti.saltabile') ||
  (await page.locator('.prova-velo .qz-esito').count()) > 0)
await page.click('.prova-fine')
await page.waitForTimeout(250)

/* ── 3. scorrile tutte: il contatore avanza e torna ── */
const quante = await page.locator('.blocco.toste .riga').count()
await page.click('[data-fascia-giro="toste"]')
await page.waitForSelector('.prova-velo .qz-consegna', { timeout: 5000 })
await page.waitForTimeout(CIECA)
uguale('il giro parte dalla prima',
       (await page.locator('[data-conta]').innerText()).trim(), `1 di ${quante}`)
const prima = (await page.locator('.prova-chi').innerText()).trim()

await page.click('.prova-altra')
await page.waitForTimeout(CIECA)
uguale('«la prossima» avanza',
       (await page.locator('[data-conta]').innerText()).trim(), `2 di ${quante}`)

controlla('e cambia domanda',
  (await page.locator('.prova-chi').innerText()).trim() !== prima)

await page.click('[data-indietro]')
await page.waitForTimeout(CIECA)
uguale('il tasto indietro torna a quella di prima',
       (await page.locator('[data-conta]').innerText()).trim(), `1 di ${quante}`)

/* e in fondo si ricomincia, invece di finire in un vicolo cieco */
for (let i = 0; i < quante; i++) { await page.click('.prova-altra'); await page.waitForTimeout(120) }
uguale('dopo l\'ultima si torna alla prima',
       (await page.locator('[data-conta]').innerText()).trim(), `1 di ${quante}`)

/* ── il giro veloce ──
   Rispondere fa avanzare da solo — la barra si riempie e si prosegue,
   come nel gioco — e toccare la barra accorcia l'attesa. Sono le due
   cose che rendono possibile scorrerne venti di fila, e il contatore le
   conta: è così che si vede se una sola risposta ne facesse saltare
   due. */
await page.waitForTimeout(CIECA)     // la domanda è appena comparsa: finestra cieca
const daDove = Number((await page.locator('[data-conta]').innerText()).trim().split(' ')[0])
await page.click('.prova-velo .qz-tasto')
await page.waitForSelector('.qz-avanti.saltabile', { timeout: 3000 })
await page.click('.qz-avanti.saltabile')
await page.waitForTimeout(300)
uguale('toccando la barra si va avanti di UNA domanda',
       (await page.locator('[data-conta]').innerText()).trim(),
       `${(daDove % quante) + 1} di ${quante}`)
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
uguale('dopo tutto questo guardare, niente si è spento',
       (await page.locator('.blocco.spenta .conta').innerText()).trim(), spenteInizio)

/* ── 6. il ✕ spegne il gruppo, non la riga ──
   È l'unica cosa che questa scheda fa oltre a mostrare, e la si prova
   qui perché tocca anche i giochi: il ✕ dice sempre quante domande
   porta via, e sono quelle del gruppo di scuola. */
const conSpegni = page.locator('.blocco.medie .riga [data-spegni]').first()
const dice = await conSpegni.getAttribute('aria-label')
controlla('il ✕ dice cosa toglie', /togli le domande su .+/.test(dice || ''), String(dice))
const primaSpente = Number(spenteInizio)
await conSpegni.click()
await page.waitForTimeout(400)
const poiSpente = Number((await page.locator('.blocco.spenta .conta').innerText()).trim())
controlla('e ne spegne più di una: sono quelle del suo gruppo',
  poiSpente > primaSpente, `${primaSpente} → ${poiSpente}`)
await page.click('[data-apri="spenta"]')
await page.waitForTimeout(300)
await page.locator('.blocco.spenta [data-riaccendi]').first().click()
await page.waitForTimeout(400)
uguale('e il ↺ le rimette tutte',
  (await page.locator('.blocco.spenta .conta').innerText()).trim(), String(primaSpente))

uguale('nessun errore in console', errori.length, 0, errori.join(' | '))
await browser.close()
riassunto('la scheda «Le domande»')
