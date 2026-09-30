/* ═══════════════════════════════════════════════════════════════════
   L'INGLESE A MONDI, NEL BROWSER
     node test/esegui.mjs inglese-mondi        (la build la fa il lanciatore)

   Quello che il motore da solo non può dire (test/unita/inglese-mondi):
     · la carta English apre la mappa del tesoro, un mondo per anno di
       scuola; a otto anni la prima è «passata», aperta da ripassare
     · una tappa di parole fa domande sulle parole del suo argomento: fra
       i colori, solo colori
     · una frase si compone a tocchi, e sbagliandola si legge il perché,
       «Si fa così» e la frase giusta, con la tessera sbagliata colorata
     · la frase giusta paga, e l'indicatore delle monete lo diceva prima
     · un tocco che costa si chiede prima, in una bolla accanto alla
       parola: col dito vero, tenendo premuta una tessera, il click che
       arriva dopo non la chiude e non muove la tessera; «No» la chiude
       e la domanda paga ancora
     · il libro apre la storia non ancora letta; una parola si tocca e
       dice cosa vuol dire; se il tocco costa prima lo chiede, e al sì lo
       dice subito; poi si risponde, e la storia è letta
     · «Un'altra storia» apre un'altra storia, che si sfoglia con le
       frecce, anche durante le domande
   Il progetto è in docs/lingue/mondi.md, i bersagli alla riga «Nei test».
   ═══════════════════════════════════════════════════════════════════ */
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { apriBrowser, apriGioco, azzera, semina, attendi, leggiProfilo, scatto, TELEFONO,
         SCATTI, SCATTI_ACCESI } from '../aiuto/browser.mjs'
import { WORDS } from '../../src/data/words.js'
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
// l'età decide quali mondi sono «passati»: a sei anni e mezzo nessuno
const conEta = async (eta, resto = {}) => {
  const vecchio = await leggiProfilo(page)
  await semina(page, { ...resto, settings: { ...((vecchio || {}).settings || {}), eta } })
}
await conEta(6.5)

/* ---------- 1. dalla home alla mappa ---------- */
const carta = page.locator('.carta.gioco[data-gioco="inglese"]')
uguale('in home c’è una carta English sola', await carta.count(), 1)
await carta.click()
await page.waitForSelector('[data-mappa-inglese] [data-tappa]', { timeout: 5000 })
uguale('la prima tappa è aperta', await page.locator('[data-tappa="prima-colori"]').getAttribute('data-stato'), 'aperta')
uguale('la seconda no', await page.locator('[data-tappa="prima-ciao"]').getAttribute('data-stato'), 'chiusa')
uguale('a profilo vuoto il grado è zero', await page.locator('[data-tappa="prima-colori"]').getAttribute('data-grado'), '0')
const lontani = MONDI.filter(m => !m.tappe.length).length
uguale('i mondi senza tappe si vedono in arrivo',
       await page.locator('[data-mondo][data-pronto="0"]').count(), lontani)
uguale('a sei anni e mezzo nessun mondo è passato', await page.locator('[data-mondo][data-passato]').count(), 0)
uguale('senza la campagna di prima finita, il gioco di prima non c’è', await page.locator('[data-prima]').count(), 0)
await scatto(page, 'inglese-mappa-vuota')
await scattoTela(page, 'inglese-mappa-vuota-intera')

/* ---------- la nave: ancorata alla tappa da fare, e su una chiusa non parte ---------- */
const nave = page.locator('[data-nave]')
uguale('la nave è ancorata alla tappa da fare', await nave.getAttribute('data-porto'), 'tappa:prima-colori')
await page.locator('[data-tappa="prima-ciao"]').click()
await page.waitForSelector('[data-serve]', { timeout: 2000 })
controlla('una tappa chiusa dice cosa serve', (await page.locator('[data-serve]').innerText()).includes('Prima vinci «I colori»'),
          await page.locator('[data-serve]').innerText())
uguale('e la nave non parte', await nave.getAttribute('data-in-viaggio'), '0')
uguale('e resta dov’era', await nave.getAttribute('data-porto'), 'tappa:prima-colori')
uguale('e non si entra nella tappa', await page.locator('[data-domanda]').count(), 0)
await attendi(page, 300)
await scatto(page, 'inglese-serve')
// il libro chiuso dice quale tappa lo apre: quella della prima storia, a metà isola
await page.locator('[data-libro="prima"]').click()
await page.waitForSelector('[data-serve-per="libro:prima"]', { timeout: 2000 })
controlla('il libro chiuso dice quale tappa vincere',
          (await page.locator('[data-serve]').innerText()).includes('Si apre quando vinci «Che cos’è?»'),
          await page.locator('[data-serve]').innerText())

/* ---------- 1b. le parole di una tappa: fra i colori, solo colori ----------
   Era il difetto: con una categoria piccola le risposte sbagliate venivano
   da tutta la lingua (🔴 fra 🏥🐶📓). */
const colori = new Set(WORDS.filter(w => w[3] === 'c').flatMap(w => [w[0], w[1], w[2]]).filter(Boolean))
await page.locator('[data-tappa="prima-colori"]').click()
const estranee = []
for (let i = 0; i < 4; i++) {
  await page.waitForSelector('[data-domanda]')
  uguale(`una tappa di parole fa domande sulle parole (${i + 1})`,
         await page.locator('[data-domanda]').getAttribute('data-genere'), 'parola')
  const testi = await page.locator('[data-domanda] [data-opzione]').evaluateAll(els => els.map(e => e.textContent.trim()))
  estranee.push(...testi.filter(t => !colori.has(t)))
  await attendi(page, 400)                                 // la finestra cieca
  await page.locator('[data-domanda] [data-opzione][data-giusta]').click()
  await page.waitForSelector('[data-esito="giusta"]')
  await page.waitForSelector('[data-esito]', { state: 'detached', timeout: 6000 })
}
uguale('le risposte sono tutte colori', estranee.join(' '), '')
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('[data-mappa-inglese]')
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('.carte')

/* ---------- 2. un bambino a metà del primo mondo ----------
   Le parole delle tappe di parole sono sapute (forza 6) e le frasi di
   «Che cos'è?» a metà (forza 4): si mettono in ordine. Tutte le tappe
   tranne la bandiera sono vinte, così il libro del mondo è aperto; due
   storie su tre sono già lette, «Il cane di Laura» da più tempo. */
const ora = Date.now()
const sa = s => ({ s, ok: 5, err: 0, last: ora, seen: 5, t: 0 })
const t1 = tappaDi('prima-che-cose')
const paroleDelMondo = MONDI[0].tappe.flatMap(t => t.parole)
const items = {}
for (const p of paroleDelMondo) items['en:' + p] = sa(6)
for (const f of FRASI.filter(f => f.tappa === t1.id)) items['frase:' + f.id] = sa(4)
items['forma:it-is'] = sa(4)
items['forma:is-it'] = sa(4)
const vinte = Object.fromEntries(MONDI[0].tappe.filter(t => !t.bandiera)
  .map((t, i) => [t.id, ora - (20 - i) * 86400000]))
const lette = { 'il-cane-di-laura': ora - 2 * 86400000, 'il-gioco-di-tom': ora - 86400000 }
await semina(page, { coins: 100, items,
                     campagne: { inglese: { tappa: Object.keys(vinte).length, libera: false, stelle: {}, cfg: {}, vinte,
                                            lette } } })
await carta.click()
await page.waitForSelector('[data-mappa-inglese] [data-tappa]')
uguale('la tappa di parole saputa è piena', await page.locator('[data-tappa="prima-animali"]').getAttribute('data-grado'), '10')
uguale('la bandiera si è aperta', await page.locator('[data-tappa="prima-bandiera"]').getAttribute('data-stato'), 'aperta')
uguale('il libro è aperto', await page.locator('[data-libro="prima"]').getAttribute('data-stato'), 'aperta')
uguale('il cassetto è aperto', await page.locator('[data-cassetto="prima"]').getAttribute('data-stato'), 'aperta')
uguale('il secondo mondo resta chiuso fino alla bandiera',
       await page.locator('[data-tappa="seconda-cibo"]').getAttribute('data-stato'), 'chiusa')
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
   La nave sta alla bandiera, la tappa da fare: toccata «Che cos'è?» ci
   naviga per mare, e arrivata la tappa si apre. Le parole le sa già: in una
   tappa di frasi si comincia dalle frasi (motore/sessione.js). */
uguale('la nave sta alla tappa da fare', await nave.getAttribute('data-porto'), 'tappa:prima-bandiera')
const partenza = Date.now()
await page.locator('[data-tappa="prima-che-cose"]').click()
await page.waitForSelector('[data-nave][data-in-viaggio="1"]', { timeout: 1000 })
await attendi(page, 300)
await scatto(page, 'inglese-nave')
await page.waitForSelector('[data-domanda]', { timeout: 4000 })
const viaggio = Date.now() - partenza
controlla('il viaggio dura poco', viaggio < 2500, viaggio + ' ms')
nota(`dal tocco alla domanda: ${viaggio} ms`)
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
uguale('le parole sono sapute: si comincia da una frase', await page.locator('[data-domanda]').getAttribute('data-genere'), 'frase')
await finoAllaFrase()
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
  has: page.locator(paroleDelMondo.map(p => `[data-parola="${p}"]`).join(', ')) }).first()
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
await page.waitForSelector('[data-libro="prima"]')
uguale('tornati alla mappa, la nave è dove si era giocato', await nave.getAttribute('data-porto'), 'tappa:prima-che-cose')
// un tocco durante il viaggio lo chiude: la nave arriva e il libro si apre subito
await page.locator('[data-libro="prima"]').click()
await page.waitForSelector('[data-viaggio]', { timeout: 1000 })
const tocco = Date.now()
await page.mouse.click(195, 500)
await page.waitForSelector('[data-libro-testo]', { timeout: 1500 })
controlla('un tocco durante il viaggio lo chiude subito', Date.now() - tocco < 700, (Date.now() - tocco) + ' ms')
uguale('il libro dice quanto può rendere', await page.locator('[data-paga]').getAttribute('data-paga-si'), '1')
controlla('il libro apre la storia non ancora letta',
          (await page.locator('[data-libro-testo] .ing-capitolo').innerText()).includes('Lo zaino di Leo'))
uguale('una pagina sola: niente frecce', await page.locator('[data-azione="pagina-avanti"]').count(), 0)
// chi parla: ogni battuta va a capo col nome davanti, e le parole si toccano lo stesso
const battute = await page.locator('[data-libro-testo] [data-battuta]').evaluateAll(els =>
  els.map(e => [e.dataset.chi, e.querySelector('.ing-chi').textContent.trim(), e.querySelectorAll('[data-parola]').length]))
nota(battute.map(b => b[1]).join(' · '))
controlla('le battute dicono chi parla: Leo e Laura',
          battute.some(b => b[0] === 'Leo' && b[1] === 'Leo') && battute.some(b => b[0] === 'Laura' && b[1] === 'Laura'),
          JSON.stringify(battute))
controlla('e le loro parole si toccano', battute.every(b => b[2] > 0))
uguale('il nome non si tocca', await page.locator('[data-libro-testo] .ing-chi [data-parola]').count(), 0)
await scatto(page, 'inglese-libro')
// una parola di struttura è sempre gratis: si dice e basta
await page.locator('[data-libro-testo] [data-parola="is"]').first().click()
await page.waitForSelector('[data-traduzione]')
controlla('una parola gratis non chiede niente', await page.locator('[data-svela]').count() === 0)
// «backpack» è saputa: toccarla costerebbe il guadagno di una domanda, e prima lo si chiede
const gatto = page.locator('[data-libro-testo] [data-parola="backpack"]').first()
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
          (await page.locator('[data-traduzione]').innerText()).includes('zaino'))
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
          ((await leggiProfilo(page)).items['en:backpack'] || {}).err > 0)
const letteDopo = (await leggiProfilo(page)).campagne.inglese.lette || {}
controlla('arrivati al cartello la storia è letta', letteDopo['lo-zaino-di-leo'] >= ora, JSON.stringify(letteDopo))

/* ---------- 5b. un'altra storia, a pagine ----------
   Lette tutte e tre, «Un'altra storia» apre quella letta da più tempo (non
   quella appena finita): «Il cane di Laura», su due pagine. */
uguale('il cartello offre un’altra storia', (await page.locator('[data-fine] [data-azione="avanti"]').innerText()).trim(),
       'Un’altra storia →')
await page.locator('[data-fine] [data-azione="avanti"]').click()
await page.waitForSelector('[data-libro-testo][data-pagine="2"]')
controlla('è un’altra storia', (await page.locator('[data-libro-testo] .ing-capitolo').innerText()).includes('Il cane di Laura'))
uguale('comincia dalla prima pagina', await page.locator('[data-libro-testo]').getAttribute('data-pagina'), '1')
uguale('e lo dice', (await page.locator('[data-pagina-di]').innerText()).trim(), 'pagina 1 di 2')
uguale('prima dell’ultima pagina non si chiude', await page.locator('[data-azione="ho-letto"]').count(), 0)
controlla('indietro, alla prima, non va', await page.locator('[data-azione="pagina-indietro"]').isDisabled())
await attendi(page, 350)
await page.locator('[data-azione="pagina-avanti"]').click()
uguale('la freccia sfoglia', await page.locator('[data-libro-testo]').getAttribute('data-pagina'), '2')
controlla('la seconda pagina è un’altra', /Pip/.test(await page.locator('[data-libro-testo]').innerText()))
await scatto(page, 'inglese-libro-pagine')
await page.locator('[data-azione="ho-letto"]').click()
await page.waitForSelector('[data-libro-domanda]')
await page.locator('[data-azione="pagina-indietro"]').click()
uguale('durante le domande si sfoglia ancora', await page.locator('[data-libro-testo]').getAttribute('data-pagina'), '1')
controlla('e la domanda resta', await page.locator('[data-libro-domanda]').count() === 1)
while (await page.locator('[data-libro-domanda]').count()) {
  await attendi(page, 400)
  await page.locator('[data-libro-domanda] [data-giusta]').click()
  await page.waitForSelector('[data-libro-domanda] [data-esito], [data-fine]')
  await page.waitForFunction(() => !document.querySelector('[data-libro-domanda] [data-esito]') ||
                                   document.querySelector('[data-fine]'), null, { timeout: 8000 })
  if (await page.locator('[data-fine]').count()) break
}
await page.waitForSelector('[data-fine]')
await attendi(page, 900)       // il salvataggio arriva con un piccolo ritardo
const lette2 = (await leggiProfilo(page)).campagne.inglese.lette
controlla('anche questa è letta', lette2['il-cane-di-laura'] >= ora)
await page.locator('[data-fine] [data-azione="mappa"]').click()
await page.waitForSelector('[data-mappa-inglese]')

/* ---------- 6. a otto anni la prima è già fatta a scuola ----------
   Il mondo della prima è «passato»: aperto tutto, bandiera compresa, da
   ripassare quando vuole — ma non vinto — e il mondo dopo si apre come se
   l'avesse finito. */
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('.carte')
await conEta(8, { campagne: { inglese: { tappa: 0, libera: false, stelle: {}, cfg: {}, vinte: {} } } })
await carta.click()
await page.waitForSelector('[data-mappa-inglese] [data-tappa]')
uguale('la prima è passata', await page.locator('[data-mondo="prima"]').getAttribute('data-passato'), '1')
uguale('e lo dice', await page.locator('[data-mondo][data-passato]').count(), 1)
uguale('la sua bandiera è aperta senza averla vinta',
       await page.locator('[data-tappa="prima-bandiera"]').getAttribute('data-stato'), 'aperta')
uguale('la seconda comincia da capo', await page.locator('[data-tappa="seconda-cibo"]').getAttribute('data-stato'), 'aperta')
uguale('una tappa alla volta', await page.locator('[data-tappa="seconda-famiglia"]').getAttribute('data-stato'), 'chiusa')
uguale('la nave attracca nel primo mondo che non è passato', await nave.getAttribute('data-porto'), 'tappa:seconda-cibo')
uguale('il libro di un mondo passato è aperto', await page.locator('[data-libro="prima"]').getAttribute('data-stato'), 'aperta')
uguale('quello della seconda no', await page.locator('[data-libro="seconda"]').getAttribute('data-stato'), 'chiusa')
await page.locator('[data-tappa="terza-casa"]').click()
await page.waitForSelector('[data-serve]', { timeout: 2000 })
controlla('il cartiglio conta la prima passata come finita: manca la seconda',
          (await page.locator('[data-serve]').innerText()).includes('Prima finisci «In seconda»'),
          await page.locator('[data-serve]').innerText())
await scatto(page, 'inglese-passati')

controlla('nessun errore in console', errori.length === 0, errori.join(' · '))
await browser.close()
riassunto('L’inglese a mondi nel browser')
