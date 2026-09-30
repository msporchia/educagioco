/* ═══════════════════════════════════════════════════════════════════
   L'INGLESE A MONDI, NEL BROWSER
     node test/esegui.mjs inglese-mondi        (la build la fa il lanciatore)

   Quello che il motore da solo non può dire (test/unita/inglese-mondi):
     · la carta English apre la mappa del tesoro, con i mondi in arrivo
     · una frase si compone a tocchi, e sbagliandola si legge il perché,
       «Si fa così» e la frase giusta, con la tessera sbagliata colorata
     · la frase giusta paga, e l'indicatore delle monete lo diceva prima
     · la partita comincia dalle parole, e le frasi arrivano dopo
     · un tocco che costa si chiede prima, in una bolla accanto alla
       parola: col dito vero, tenendo premuta una tessera, il click che
       arriva dopo non la chiude e non muove la tessera; «No» la chiude
       e la domanda paga ancora
     · il capitolo del libro si legge, una parola si tocca e dice cosa
       vuol dire; se il tocco costa prima lo chiede, e al sì lo dice
       subito; poi si risponde
   Il progetto è in docs/lingue/mondi.md, i bersagli alla riga «Nei test».
   ═══════════════════════════════════════════════════════════════════ */
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { apriBrowser, apriGioco, azzera, semina, attendi, leggiProfilo, scatto, TELEFONO,
         SCATTI, SCATTI_ACCESI } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { tappaDi, MONDI } from '../../src/giochi/inglese/dati/mondi.js'
import { FRASI } from '../../src/giochi/inglese/dati/frasi.js'
import { PAGA } from '../../src/giochi/inglese/dati/monete.js'

// la mappa intera, non solo quello che sta nello schermo: la tela si legge
// com'è, perché le isole si giudicano a occhio (docs/lingue/mondi-vista.md)
async function scattoTela(page, nome) {
  if (!SCATTI_ACCESI) return
  const dati = await page.evaluate(() => document.querySelector('.ing-tela').toDataURL('image/png'))
  mkdirSync(SCATTI, { recursive: true })
  writeFileSync(resolve(SCATTI, nome + '.png'), Buffer.from(dati.split(',')[1], 'base64'))
}

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { viewport: TELEFONO })
await azzera(page)

/* ---------- 1. dalla home alla mappa ---------- */
const carta = page.locator('.carta.gioco[data-gioco="inglese"]')
uguale('in home c’è una carta English sola', await carta.count(), 1)
await carta.click()
await page.waitForSelector('[data-mappa-inglese] [data-tappa]', { timeout: 5000 })
uguale('la prima tappa è aperta', await page.locator('[data-tappa="che-cose-1"]').getAttribute('data-stato'), 'aperta')
uguale('la seconda no', await page.locator('[data-tappa="che-cose-2"]').getAttribute('data-stato'), 'chiusa')
uguale('a profilo vuoto il grado è zero', await page.locator('[data-tappa="che-cose-1"]').getAttribute('data-grado'), '0')
const lontani = MONDI.filter(m => !m.tappe.length).length
uguale('i mondi senza tappe si vedono in arrivo',
       await page.locator('[data-mondo][data-pronto="0"]').count(), lontani)
uguale('senza la campagna di prima finita, il gioco di prima non c’è', await page.locator('[data-prima]').count(), 0)
await scatto(page, 'inglese-mappa-vuota')
await scattoTela(page, 'inglese-mappa-vuota-intera')

/* ---------- la nave: ancorata alla tappa da fare, e su una chiusa non parte ---------- */
const nave = page.locator('[data-nave]')
uguale('la nave è ancorata alla tappa da fare', await nave.getAttribute('data-porto'), 'tappa:che-cose-1')
await page.locator('[data-tappa="che-cose-2"]').click()
await page.waitForSelector('[data-serve]', { timeout: 2000 })
controlla('una tappa chiusa dice cosa serve', (await page.locator('[data-serve]').innerText()).includes('Prima vinci «Gli animali facili»'),
          await page.locator('[data-serve]').innerText())
uguale('e la nave non parte', await nave.getAttribute('data-in-viaggio'), '0')
uguale('e resta dov’era', await nave.getAttribute('data-porto'), 'tappa:che-cose-1')
uguale('e non si entra nella tappa', await page.locator('[data-domanda]').count(), 0)
await attendi(page, 300)
await scatto(page, 'inglese-serve')

/* ---------- 2. un bambino a metà del primo mondo ----------
   Le parole della prima tappa sono sapute (forza 6) e le frasi a metà
   (forza 4): dopo il giro delle parole, le frasi si mettono in ordine. Le
   altre quattro tappe sono vinte, così il libro del mondo è aperto. */
const ora = Date.now()
const sa = s => ({ s, ok: 5, err: 0, last: ora, seen: 5, t: 0 })
const t1 = tappaDi('che-cose-1')
const items = {}
for (const p of t1.parole) items['en:' + p] = sa(6)
for (const f of FRASI.filter(f => f.tappa === 'che-cose-1')) items['frase:' + f.id] = sa(4)
items['forma:it-is'] = sa(4)
const vinte = Object.fromEntries(['che-cose-1', 'che-cose-2', 'che-cose-3', 'che-cose-4', 'che-cose-5']
  .map((id, i) => [id, ora - (5 - i) * 86400000]))
await semina(page, { coins: 100, items,
                     campagne: { inglese: { tappa: 5, libera: false, stelle: {}, cfg: {}, vinte } } })
await carta.click()
await page.waitForSelector('[data-mappa-inglese] [data-tappa]')
uguale('la tappa saputa è piena', await page.locator('[data-tappa="che-cose-1"]').getAttribute('data-grado'), '10')
uguale('la bandiera si è aperta', await page.locator('[data-tappa="che-cose-bandiera"]').getAttribute('data-stato'), 'aperta')
uguale('il libro è aperto', await page.locator('[data-libro="che-cose"]').getAttribute('data-stato'), 'aperta')
uguale('il cassetto è aperto', await page.locator('[data-cassetto="che-cose"]').getAttribute('data-stato'), 'aperta')
uguale('il secondo mondo resta chiuso fino alla bandiera',
       await page.locator('[data-tappa="mie-cose-1"]').getAttribute('data-stato'), 'chiusa')
await scatto(page, 'inglese-mappa')
await scattoTela(page, 'inglese-mappa-intera')
if (SCATTI_ACCESI) {
  // lo schermo più stretto che si prova: le isole si ridisegnano, e restano isole
  await page.setViewportSize({ width: 320, height: 640 })
  await attendi(page, 300)
  await scattoTela(page, 'inglese-mappa-intera-320')
  await scatto(page, 'inglese-mappa-320')
  await page.setViewportSize(TELEFONO)
  await attendi(page, 300)
}

/* ---------- 3. una frase composta a tocchi, prima storta ----------
   La nave sta alla bandiera, la tappa da fare: toccata la prima tappa ci
   naviga per mare, e arrivata la tappa si apre. */
uguale('la nave sta alla tappa da fare', await nave.getAttribute('data-porto'), 'tappa:che-cose-bandiera')
const partenza = Date.now()
await page.locator('[data-tappa="che-cose-1"]').click()
await page.waitForSelector('[data-nave][data-in-viaggio="1"]', { timeout: 1000 })
await attendi(page, 300)
await scatto(page, 'inglese-nave')
await page.waitForSelector('[data-domanda]', { timeout: 4000 })
const viaggio = Date.now() - partenza
controlla('il viaggio dura poco', viaggio < 2500, viaggio + ' ms')
nota(`dal tocco alla domanda: ${viaggio} ms`)
// il primo giro fa solo parole (motore/sessione.js): si risponde giusto finché arriva una frase
async function finoAllaFrase() {
  let parole = 0
  for (;;) {
    await page.waitForSelector('[data-domanda]')
    if (await page.locator('[data-domanda]').getAttribute('data-genere') === 'frase') return parole
    if (parole++ > 30) return parole
    await attendi(page, 400)                               // la finestra cieca
    await page.locator('[data-domanda] [data-opzione][data-giusta]').click()
    await page.waitForSelector('[data-esito="giusta"]')
    await page.waitForSelector('[data-esito]', { state: 'detached', timeout: 6000 })
  }
}
uguale('si comincia da una parola', await page.locator('[data-domanda]').getAttribute('data-genere'), 'parola')
const giroParole = await finoAllaFrase()
controlla('le frasi arrivano dopo le parole', giroParole >= t1.parole.length, `${giroParole} parole prima`)
uguale('la frase a metà si mette in ordine', await page.locator('[data-domanda]').getAttribute('data-formato'), 'monta')
uguale('l’indicatore dice che la domanda paga',
       await page.locator('[data-paga]').getAttribute('data-paga-si'), '1')
controlla('e quanto', (await page.locator('[data-paga]').textContent()).includes('+' + PAGA.monta))

// le tessere in ordine di posto nella frase giusta; per sbagliare, al contrario
const posti = async () => page.locator('[data-banco] [data-tessera]').evaluateAll(
  els => els.map(e => ({ id: e.dataset.tessera, posto: Number(e.dataset.posto) })))
async function componi(storta) {
  await attendi(page, 400)                                 // la finestra cieca
  const t = (await posti()).sort((a, b) => (storta ? b.posto - a.posto : a.posto - b.posto))
  for (const x of t) await page.locator(`[data-banco] [data-tessera="${x.id}"]`).click()
  return t.length
}
/* Tenere premuta una tessera chiede cosa vuol dire. «dog» e le altre sono
   sapute, quindi il tocco costerebbe il guadagno: prima una domanda, in una
   bolla. Col dito vero (Input.dispatchTouchEvent, docs/core/il-dito.md): il
   click che arriva dopo l'alzata non deve né chiuderla né muovere la tessera. */
const cdp = await page.context().newCDPSession(page)
async function dito(x, y, tieni = 60) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, tieni)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await attendi(page, 250)                                 // il click fantasma arriva qui dentro
}
const centro = async loc => { const b = await loc.boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2] }
await attendi(page, 400)
const nome = page.locator('[data-banco] [data-tessera]').filter({
  has: page.locator(t1.parole.map(p => `[data-parola="${p}"]`).join(', ')) }).first()
const idNome = await nome.getAttribute('data-tessera')
await dito(...await centro(nome), 700)
controlla('tenuta premuta una parola saputa, prima si chiede', await page.locator('[data-svela]').count() === 1)
controlla('la bolla dice che la domanda non darà monete',
          /non ti darà monete/.test(await page.locator('[data-svela]').innerText()))
uguale('il click dopo il dito non ha mosso la tessera',
       await page.locator(`[data-banco] [data-tessera="${idNome}"]`).count(), 1)
uguale('e non ha tolto il guadagno', await page.locator('[data-paga]').getAttribute('data-paga-si'), '1')
controlla('la traduzione non c’è ancora', await page.locator('[data-traduzione]').count() === 0)
await scatto(page, 'inglese-chiede')
await attendi(page, 350)
await dito(...await centro(page.locator('[data-svela] [data-azione="svela-no"]')))
uguale('«No, ci provo» chiude la bolla', await page.locator('[data-svela]').count(), 0)
uguale('e la domanda paga ancora', await page.locator('[data-paga]').getAttribute('data-paga-si'), '1')
uguale('la tessera è ancora nel banco', await page.locator(`[data-banco] [data-tessera="${idNome}"]`).count(), 1)

const quante = await componi(true)
uguale('le tessere sono tutte in fila', await page.locator('[data-fila] [data-in-fila]').count(), quante)
uguale('il banco è vuoto', await page.locator('[data-banco] [data-tessera]').count(), 0)
const frase = await page.locator('[data-fila]').innerText()
controlla('la fila mette la maiuscola da sé', /^[A-Z]/.test(frase.trim()), frase)
// una tessera ritoccata torna nel banco, e rimessa torna in coda
const prima = page.locator('[data-fila] [data-in-fila]').first()
const idPrima = await prima.getAttribute('data-in-fila')
await prima.click()
uguale('ritoccata, torna nel banco', await page.locator(`[data-banco] [data-tessera="${idPrima}"]`).count(), 1)
await page.locator(`[data-banco] [data-tessera="${idPrima}"]`).click()
await page.locator('[data-azione="consegna"]').click()
await page.waitForSelector('[data-esito]')
uguale('la frase storta è sbagliata', await page.locator('[data-esito]').getAttribute('data-esito'), 'sbagliata')
controlla('c’è «Si fa così»', await page.locator('[data-si-fa]').count() === 1)
controlla('c’è la frase giusta', await page.locator('[data-giusta-era]').count() === 1)
controlla('almeno una tessera è colorata', await page.locator('[data-sbagliata]').count() >= 1)
controlla('l’attesa si vede', await page.locator('[data-attesa]').count() === 1)
await scatto(page, 'inglese-sbaglio')

/* ---------- 4. la seconda, giusta: paga ---------- */
await page.waitForSelector('[data-esito]', { state: 'detached', timeout: 12000 })
await finoAllaFrase()
uguale('niente si perde: si va avanti con un’altra frase',
       await page.locator('[data-domanda]').getAttribute('data-formato'), 'monta')
const monetePrima = (await leggiProfilo(page)).coins
await componi(false)
await scatto(page, 'inglese-componi')
await page.locator('[data-azione="consegna"]').click()
await page.waitForSelector('[data-esito="giusta"]')
await attendi(page, 700)
const dopo = await leggiProfilo(page)
uguale('la frase giusta paga', dopo.coins - monetePrima, PAGA.monta)
controlla('la frase sbagliata è segnata nello SRS',
          Object.entries(dopo.items).some(([k, v]) => k.startsWith('frase:') && v.err > 0))
controlla('e il contatore delle frasi è salito', (dopo.totals.frasi || 0) >= 1)
await page.waitForSelector('[data-esito]', { state: 'detached', timeout: 6000 })

/* ---------- 5. il libro ---------- */
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('[data-libro="che-cose"]')
uguale('tornati alla mappa, la nave è dove si era giocato', await nave.getAttribute('data-porto'), 'tappa:che-cose-1')
// un tocco durante il viaggio lo chiude: la nave arriva e il libro si apre subito
await page.locator('[data-libro="che-cose"]').click()
await page.waitForSelector('[data-viaggio]', { timeout: 1000 })
const tocco = Date.now()
await page.mouse.click(195, 500)
await page.waitForSelector('[data-libro-testo]', { timeout: 1500 })
controlla('un tocco durante il viaggio lo chiude subito', Date.now() - tocco < 700, (Date.now() - tocco) + ' ms')
uguale('il libro dice quanto può rendere', await page.locator('[data-paga]').getAttribute('data-paga-si'), '1')
await scatto(page, 'inglese-libro')
// una parola di struttura è sempre gratis: si dice e basta
await page.locator('[data-libro-testo] [data-parola="is"]').first().click()
await page.waitForSelector('[data-traduzione]')
controlla('una parola gratis non chiede niente', await page.locator('[data-svela]').count() === 0)
// «cat» è saputa: toccarla costerebbe il guadagno di una domanda, e prima lo si chiede
const gatto = page.locator('[data-libro-testo] [data-parola="cat"]').first()
await gatto.click()
await page.waitForSelector('[data-svela]')
const chiede = await page.locator('[data-svela]').innerText()
controlla('la bolla dice perché costa', /la conosci già/.test(chiede), chiede)
controlla('e che nel libro è una domanda sola', /Una domanda del libro/.test(chiede), chiede)
uguale('chiedere non toglie niente', await page.locator('[data-paga]').getAttribute('data-paga-si'), '1')
await attendi(page, 400)
await page.locator('[data-azione="svela-no"]').click()
uguale('«No» chiude', await page.locator('[data-svela]').count(), 0)
await gatto.click()
await page.waitForSelector('[data-svela]')
await attendi(page, 400)
await page.locator('[data-azione="svela-si"]').click()
await page.waitForSelector('[data-traduzione]')
controlla('la parola toccata dice cosa vuol dire',
          (await page.locator('[data-traduzione]').innerText()).includes('gatto'))
controlla('e che quella domanda non paga', /non paga/.test(await page.locator('[data-traduzione]').innerText()))
uguale('l’indicatore lo dice prima di rispondere', await page.locator('[data-paga]').getAttribute('data-paga-si'), '0')
await scatto(page, 'inglese-parola')
const moneteLibro = (await leggiProfilo(page)).coins
await page.locator('[data-azione="ho-letto"]').click()
await page.waitForSelector('[data-libro-domanda]')
const domande = await page.evaluate(() => document.querySelector('[data-libro-domanda] .ing-etichetta').textContent)
nota(domande)
while (await page.locator('[data-libro-domanda]').count()) {
  await attendi(page, 400)
  await page.locator('[data-libro-domanda] [data-giusta]').click()
  await page.waitForSelector('[data-libro-domanda] [data-esito], [data-fine]')
  await page.waitForFunction(() => !document.querySelector('[data-libro-domanda] [data-esito]') ||
                                   document.querySelector('[data-fine]'), null, { timeout: 8000 })
  if (await page.locator('[data-fine]').count()) break
}
await page.waitForSelector('[data-fine]')
await attendi(page, 2400)      // la nuvoletta se ne va, il cartello finisce di comparire
await scatto(page, 'inglese-libro-fine')
const nDomande = Number((domande.match(/di (\d+)/) || [])[1])
await attendi(page, 600)
const pagato = (await leggiProfilo(page)).coins - moneteLibro
uguale('il tocco a pagamento ha tolto il guadagno di una domanda', pagato, (nDomande - 1) * 4)
controlla('la parola chiesta conta come non saputa',
          ((await leggiProfilo(page)).items['en:cat'] || {}).err > 0)
await page.locator('[data-fine] [data-azione="mappa"]').click()
await page.waitForSelector('[data-mappa-inglese]')

controlla('nessun errore in console', errori.length === 0, errori.join(' · '))
await browser.close()
riassunto('L’inglese a mondi nel browser')
