/* ═══════════════════════════════════════════════════════════════════
   L'INGLESE A MONDI, NEL BROWSER
     node test/esegui.mjs spagnolo-mondi        (la build la fa il lanciatore)

   Quello che il motore da solo non può dire (test/unita/spagnolo-mondi):
     · la carta Español apre la mappa del tesoro, un mondo per anno di
       scuola; l'età non apre mondi, si comincia dalla prima
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
     · nella sesta isola una parola della storia si tocca gratis e non segna
       niente; si risponde toccando la frase e componendo l'ordine; il
       cartello offre «Puntata 2», che ha la stessa frutta
   Il progetto è in docs/lingue/spagnolo.md e mondi.md, i bersagli alla riga «Nei test».
   Il gemello di integrazione/inglese-mondi: stessi bersagli (data-mappa-inglese compreso), dati spagnoli.
   ═══════════════════════════════════════════════════════════════════ */
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { apriBrowser, apriGioco, azzera, semina, attendi, leggiProfilo, scatto, TELEFONO,
         SCATTI, SCATTI_ACCESI } from '../aiuto/browser.mjs'
import { PAROLE_ES as PAROLE } from '../../src/data/parole-es.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { tappaDi, MONDI } from '../../src/giochi/spagnolo/dati/mondi.js'
import { FRASI } from '../../src/giochi/spagnolo/dati/frasi.js'
import { concettiDellaTappa } from '../../src/giochi/spagnolo/motore/concetti.js'
import { PAGA } from '../../src/giochi/spagnolo/dati/monete.js'

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
// l'età non apre mondi (lo prova il punto 6)
const conEta = async (eta, resto = {}) => {
  const vecchio = await leggiProfilo(page)
  await semina(page, { ...resto, settings: { ...((vecchio || {}).settings || {}), eta } })
}
await conEta(6.5)

/* ---------- 1. dalla home alla mappa ---------- */
const carta = page.locator('.carta.gioco[data-gioco="spagnolo"]')
uguale('in home c’è una carta Español sola', await carta.count(), 1)
await carta.click()
await page.waitForSelector('[data-mappa-inglese] [data-tappa]', { timeout: 5000 })
uguale('la prima tappa è aperta', await page.locator('[data-tappa="prima-colores"]').getAttribute('data-stato'), 'aperta')
uguale('la seconda no', await page.locator('[data-tappa="prima-animales"]').getAttribute('data-stato'), 'chiusa')
uguale('a profilo vuoto il grado è zero', await page.locator('[data-tappa="prima-colores"]').getAttribute('data-grado'), '0')
uguale('nessun mondo «in arrivo» che non arriva', await page.locator('[data-mondo][data-pronto="0"]').count(), 0)
uguale('senza la campagna di prima finita, il gioco di prima non c’è', await page.locator('[data-prima]').count(), 0)
await scatto(page, 'spagnolo-mappa-vuota')
await scattoTela(page, 'spagnolo-mappa-vuota-intera')

/* ---------- la nave: ancorata alla tappa da fare, e su una chiusa non parte ---------- */
const nave = page.locator('[data-nave]')
uguale('la nave è ancorata alla tappa da fare', await nave.getAttribute('data-porto'), 'tappa:prima-colores')
await page.locator('[data-tappa="prima-animales"]').click()
await page.waitForSelector('[data-serve]', { timeout: 2000 })
controlla('una tappa chiusa dice cosa serve', (await page.locator('[data-serve]').innerText()).includes('Prima vinci «I colori»'),
          await page.locator('[data-serve]').innerText())
uguale('e la nave non parte', await nave.getAttribute('data-in-viaggio'), '0')
uguale('e resta dov’era', await nave.getAttribute('data-porto'), 'tappa:prima-colores')
uguale('e non si entra nella tappa', await page.locator('[data-domanda]').count(), 0)
await attendi(page, 300)
await scatto(page, 'spagnolo-serve')
// il libro chiuso dice quale tappa lo apre: quella della prima storia, a metà isola
await page.locator('[data-libro="prima"]').click()
await page.waitForSelector('[data-serve-per="libro:prima"]', { timeout: 2000 })
controlla('il libro chiuso dice quale tappa vincere',
          (await page.locator('[data-serve]').innerText()).includes('Si apre quando vinci «È un cane, è una mucca»'),
          await page.locator('[data-serve]').innerText())

/* ---------- 1b. le parole di una tappa: fra i colori, solo colori ----------
   Era il difetto: con una categoria piccola le risposte sbagliate venivano
   da tutta la lingua (🔴 fra 🏥🐶📓). */
const colori = new Set(PAROLE.filter(w => w[3] === 'c').flatMap(w => [w[0], w[1], w[2]]).filter(Boolean))
await page.locator('[data-tappa="prima-colores"]').click()
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
   «È un cane, è una mucca» a metà (forza 4): si mettono in ordine. Tutte le tappe
   tranne la bandiera sono vinte, così il libro del mondo è aperto; tre
   storie su quattro sono già lette, «Chi c’è sotto?» da più tempo. */
const ora = Date.now()
const sa = s => ({ s, ok: 5, err: 0, last: ora, seen: 5, t: 0 })
const t1 = tappaDi('prima-es-un')
const paroleDelMondo = MONDI[0].tappe.flatMap(t => t.parole || [])
const items = {}
for (const p of paroleDelMondo) items['es:' + p] = sa(6)
for (const f of FRASI.filter(f => f.tappa === t1.id)) items['frase-es:' + f.id] = sa(4)
items['forma-es:es-un'] = sa(4)
const vinte = Object.fromEntries(MONDI[0].tappe.filter(t => !t.bandiera)
  .map((t, i) => [t.id, ora - (20 - i) * 86400000]))
const lette = { 'chi-c-e-sotto': ora - 3 * 86400000, 'la-scatola-di-leo': ora - 2 * 86400000,
                'i-palloncini': ora - 86400000 }
await semina(page, { coins: 100, items,
                     campagne: { spagnolo: { tappa: Object.keys(vinte).length, libera: false, stelle: {}, cfg: {}, vinte,
                                            lette } } })
await carta.click()
await page.waitForSelector('[data-mappa-inglese] [data-tappa]')
uguale('la tappa di parole saputa è piena', await page.locator('[data-tappa="prima-animales"]').getAttribute('data-grado'), '10')
uguale('la bandiera si è aperta', await page.locator('[data-tappa="prima-bandera"]').getAttribute('data-stato'), 'aperta')
uguale('il libro è aperto', await page.locator('[data-libro="prima"]').getAttribute('data-stato'), 'aperta')
uguale('il cassetto è aperto', await page.locator('[data-cassetto="prima"]').getAttribute('data-stato'), 'aperta')
uguale('il secondo mondo resta chiuso fino alla bandiera',
       await page.locator('[data-tappa="seconda-comida"]').getAttribute('data-stato'), 'chiusa')
await scatto(page, 'spagnolo-mappa')
await scattoTela(page, 'spagnolo-mappa-intera')
if (SCATTI_ACCESI) {
  // lo schermo più stretto che si prova: le isole si ridisegnano, e restano isole
  await page.setViewportSize({ width: 320, height: 640 })
  await attendi(page, 300)
  await scattoTela(page, 'spagnolo-mappa-intera-320')
  await scatto(page, 'spagnolo-mappa-320')
  await page.setViewportSize(TELEFONO)
  await attendi(page, 300)
}

/* ---------- 3. una frase composta a tocchi, prima storta ----------
   La nave sta alla bandiera, la tappa da fare: toccata «È un cane, è una mucca» ci
   naviga per mare, e arrivata la tappa si apre. Le parole le sa già: in una
   tappa di frasi si comincia dalle frasi (motore/sessione.js). */
uguale('la nave sta alla tappa da fare', await nave.getAttribute('data-porto'), 'tappa:prima-bandera')
const partenza = Date.now()
await page.locator('[data-tappa="prima-es-un"]').click()
await page.waitForSelector('[data-nave][data-in-viaggio="1"]', { timeout: 1000 })
await attendi(page, 300)
await scatto(page, 'spagnolo-nave')
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
await scatto(page, 'spagnolo-chiede')
await attendi(page, 350)
await dito(...await centro(page.locator('[data-svela] [data-azione="svela-no"]')))
uguale('«No, ci provo» chiude la bolla', await page.locator('[data-svela]').count(), 0)
uguale('e la domanda paga ancora', await page.locator('[data-paga]').getAttribute('data-paga-si'), '1')
uguale('la tessera è ancora nel banco', await page.locator(`[data-banco] [data-tessera="${idNome}"]`).count(), 1)

const quante = await componi(true)
uguale('le tessere sono tutte in fila', await page.locator('[data-fila] [data-in-fila]').count(), quante)
uguale('il banco è vuoto', await page.locator('[data-banco] [data-tessera]').count(), 0)
const frase = await page.locator('[data-fila]').innerText()
controlla('la fila mette la maiuscola da sé', /^[¿¡\s]*[A-ZÁÉÍÓÚÑ]/.test(frase.trim()), frase)
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
await scatto(page, 'spagnolo-sbaglio')

/* ---------- 4. la seconda, giusta: paga ---------- */
await page.waitForSelector('[data-esito]', { state: 'detached', timeout: 12000 })
await finoAllaFrase()
uguale('niente si perde: si va avanti con un’altra frase',
       await page.locator('[data-domanda]').getAttribute('data-formato'), 'monta')
const monetePrima = (await leggiProfilo(page)).coins
await componi(false)
await scatto(page, 'spagnolo-componi')
await page.locator('[data-azione="consegna"]').click()
await page.waitForSelector('[data-esito="giusta"]')
await attendi(page, 700)
const dopo = await leggiProfilo(page)
uguale('la frase giusta paga', dopo.coins - monetePrima, PAGA.monta)
controlla('la frase sbagliata è segnata nello SRS',
          Object.entries(dopo.items).some(([k, v]) => k.startsWith('frase-es:') && v.err > 0))
controlla('e il contatore delle frasi è salito', (dopo.totals.frasiEs || 0) >= 1)
await page.waitForSelector('[data-esito]', { state: 'detached', timeout: 6000 })

/* ---------- 5. il libro ---------- */
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('[data-libro="prima"]')
uguale('tornati alla mappa, la nave è dove si era giocato', await nave.getAttribute('data-porto'), 'tappa:prima-es-un')
// un tocco durante il viaggio lo chiude: la nave arriva e il libro si apre subito
await page.locator('[data-libro="prima"]').click()
await page.waitForSelector('[data-viaggio]', { timeout: 1000 })
const tocco = Date.now()
await page.mouse.click(195, 500)
await page.waitForSelector('[data-libro-testo]', { timeout: 1500 })
controlla('un tocco durante il viaggio lo chiude subito', Date.now() - tocco < 700, (Date.now() - tocco) + ' ms')
uguale('il libro dice quanto può rendere', await page.locator('[data-paga]').getAttribute('data-paga-si'), '1')
controlla('il libro apre la storia non ancora letta',
          (await page.locator('[data-libro-testo] .ing-capitolo').innerText()).includes('Indovina il disegno'))
uguale('due pagine: le frecce ci sono', await page.locator('[data-azione="pagina-avanti"]').count(), 1)
// chi parla: ogni battuta va a capo col nome davanti, e le parole si toccano lo stesso
const battute = await page.locator('[data-libro-testo] [data-battuta]').evaluateAll(els =>
  els.map(e => [e.dataset.chi, e.querySelector('.ing-chi').textContent.trim(), e.querySelectorAll('[data-parola]').length]))
nota(battute.map(b => b[1]).join(' · '))
controlla('le battute dicono chi parla: Leo, Tom e Laura',
          ['Leo', 'Tom', 'Laura'].every(n => battute.some(b => b[0] === n && b[1] === n)),
          JSON.stringify(battute))
controlla('e le loro parole si toccano', battute.every(b => b[2] > 0))
uguale('il nome non si tocca', await page.locator('[data-libro-testo] .ing-chi [data-parola]').count(), 0)
await scatto(page, 'spagnolo-libro')
// una parola di struttura è sempre gratis: si dice e basta
await page.locator('[data-libro-testo] [data-parola="es"]').first().click()
await page.waitForSelector('[data-traduzione]')
controlla('una parola gratis non chiede niente', await page.locator('[data-svela]').count() === 0)
// un animale (il disegno è di un animale a caso) è saputo: toccarlo costerebbe il guadagno di una
// domanda, e prima lo si chiede
const ANIMALI = MONDI[0].tappe.find(t => t.id === 'prima-animales').parole
const parolaAnimale = await page.locator('[data-libro-testo] [data-parola]').evaluateAll(
  (els, animali) => (els.map(e => e.dataset.parola).find(p => animali.includes(p)) || null), ANIMALI)
controlla('nel testo c’è un animale da toccare', !!parolaAnimale)
const itAnimale = (PAROLE.find(w => w[0] === parolaAnimale) || [])[1]
const gatto = page.locator(`[data-libro-testo] [data-parola="${parolaAnimale}"]`).first()
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
          (await page.locator('[data-traduzione]').innerText()).includes(itAnimale), itAnimale)
controlla('e che quella domanda non paga', /non paga/.test(await page.locator('[data-traduzione]').innerText()))
uguale('l’indicatore lo dice prima di rispondere', await page.locator('[data-paga]').getAttribute('data-paga-si'), '0')
await scatto(page, 'spagnolo-parola')
const moneteLibro = (await leggiProfilo(page)).coins
uguale('«Ho letto» c’è solo all’ultima pagina', await page.locator('[data-azione="ho-letto"]').count(), 0)
await attendi(page, 350)
await page.locator('[data-azione="pagina-avanti"]').click()
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
await scatto(page, 'spagnolo-libro-fine')
const nDomande = Number((domande.match(/di (\d+)/) || [])[1])
await attendi(page, 600)
const pagato = (await leggiProfilo(page)).coins - moneteLibro
uguale('il tocco a pagamento ha tolto il guadagno di una domanda', pagato, (nDomande - 1) * 4)
controlla('la parola chiesta conta come non saputa',
          ((await leggiProfilo(page)).items['es:' + parolaAnimale] || {}).err > 0)
const letteDopo = (await leggiProfilo(page)).campagne.spagnolo.lette || {}
controlla('arrivati al cartello la storia è letta', letteDopo['indovina-il-disegno'] >= ora, JSON.stringify(letteDopo))

/* ---------- 5b. un'altra storia, a pagine ----------
   Lette tutte e tre, «Un'altra storia» apre quella letta da più tempo (non
   quella appena finita): «Chi c’è sotto?», su due pagine. */
uguale('il cartello offre un’altra storia', (await page.locator('[data-fine] [data-azione="avanti"]').innerText()).trim(),
       'Un’altra storia →')
await page.locator('[data-fine] [data-azione="avanti"]').click()
await page.waitForSelector('[data-libro-testo][data-pagine="2"]')
controlla('è un’altra storia', (await page.locator('[data-libro-testo] .ing-capitolo').innerText()).includes('Chi c’è sotto'))
uguale('comincia dalla prima pagina', await page.locator('[data-libro-testo]').getAttribute('data-pagina'), '1')
uguale('e lo dice', (await page.locator('[data-pagina-di]').innerText()).trim(), 'pagina 1 di 2')
uguale('prima dell’ultima pagina non si chiude', await page.locator('[data-azione="ho-letto"]').count(), 0)
controlla('indietro, alla prima, non va', await page.locator('[data-azione="pagina-indietro"]').isDisabled())
await attendi(page, 350)
const testoPagina1 = await page.locator('[data-libro-testo]').innerText()
await page.locator('[data-azione="pagina-avanti"]').click()
uguale('la freccia sfoglia', await page.locator('[data-libro-testo]').getAttribute('data-pagina'), '2')
{
  const testo2 = await page.locator('[data-libro-testo]').innerText()
  controlla('la seconda pagina è un’altra', testo2.trim().length > 0 && testo2 !== testoPagina1, testo2.slice(0, 120))
}
await scatto(page, 'spagnolo-libro-pagine')
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
const lette2 = (await leggiProfilo(page)).campagne.spagnolo.lette
controlla('anche questa è letta', lette2['chi-c-e-sotto'] >= ora)
await page.locator('[data-fine] [data-azione="mappa"]').click()
await page.waitForSelector('[data-mappa-inglese]')

/* ---------- 5c. la sesta isola: parole della storia, domande nuove, puntate ----------
   Tutti i mondi vinti, e nella sesta lette tutte le storie tranne «Il
   mercato della nonna»: il libro apre la sua prima puntata. «anillo» è una
   parola della storia (di un cassetto) ed è saputa: toccarla
   sarebbe a pagamento, ma è gratis e non segna niente. Poi si risponde a
   tutto, toccando la frase e componendo l'ordine, e «Puntata 2» apre la
   puntata con la stessa frutta. */
async function rispondiGiusto() {
  await page.waitForSelector('[data-libro-domanda]')
  await attendi(page, 400)                                 // la finestra cieca
  const tipo = await page.locator('[data-libro-domanda]').getAttribute('data-tipo')
  if (tipo === 'frase') {
    // la frase giusta può stare in un'altra pagina: si sfoglia dalla prima
    const indietro = page.locator('[data-azione="pagina-indietro"]')
    if (await indietro.count()) while (!(await indietro.isDisabled())) await indietro.click()
    while (!(await page.locator('[data-libro-testo] [data-frase][data-giusta]').count()))
      await page.locator('[data-azione="pagina-avanti"]').click()
    uguale('«tocca la frase»: il testo è a frasi', await page.locator('[data-libro-testo]').getAttribute('data-a-frasi'), '1')
    await scatto(page, 'spagnolo-libro-frase')
    await page.locator('[data-libro-testo] [data-frase][data-giusta]').click()
  } else if (tipo === 'ordine') {
    const n = await page.locator('[data-libro-domanda] [data-banco] [data-tessera]').count()
    for (let i = 0; i < n; i++) await page.locator(`[data-libro-domanda] [data-tessera][data-posto="${i}"]`).click()
    uguale('«metti in ordine»: i fatti sono tutti in fila', await page.locator('[data-libro-domanda] [data-in-fila]').count(), n)
    await scatto(page, 'spagnolo-libro-ordine')
    await page.locator('[data-libro-domanda] [data-azione="consegna"]').click()
  } else await page.locator('[data-libro-domanda] [data-giusta]').click()
  await page.waitForSelector('[data-libro-domanda] [data-esito], [data-fine]')
  const esito = await page.locator('[data-libro-domanda] [data-esito]').getAttribute('data-esito').catch(() => null)
  await page.waitForFunction(() => !document.querySelector('[data-libro-domanda] [data-esito]') ||
                                   document.querySelector('[data-fine]'), null, { timeout: 8000 })
  return { tipo, esito }
}
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('.carte')
{
  const tutte = Object.fromEntries(MONDI.flatMap(m => m.tappe).map((t, i) => [t.id, ora - (60 - i) * 3600000]))
  const giaLette = ['l-orologio-della-mamma', 'la-palla-sul-tetto', 'la-porta-del-nonno']
  await semina(page, { coins: 100, items: { 'es:anillo': sa(6) },
                       campagne: { spagnolo: { tappa: Object.keys(tutte).length, libera: false, stelle: {}, cfg: {},
                                              vinte: tutte, lette: Object.fromEntries(giaLette.map(id => [id, ora - 86400000])) } } })
}
await carta.click()
await page.waitForSelector('[data-libro="sesta"]')
await page.locator('[data-libro="sesta"]').scrollIntoViewIfNeeded()
await page.locator('[data-libro="sesta"]').click()
await page.waitForSelector('[data-libro-testo]', { timeout: 4000 })
uguale('il libro apre la prima puntata', (await page.locator('[data-puntata]').innerText()).trim().toLowerCase(), 'puntata 1')
const vecchio = await leggiProfilo(page)
const vecchioTree = JSON.stringify((vecchio.items || {})['es:anillo'] || null)
const parolaStoria = page.locator('[data-libro-testo] [data-parola="anillo"][data-storia]').first()
uguale('le parole della storia sono segnate', await parolaStoria.count(), 1)
await parolaStoria.click()
await page.waitForSelector('[data-traduzione]')
uguale('una parola della storia non chiede niente', await page.locator('[data-svela]').count(), 0)
controlla('dice cosa vuol dire, e che è gratis', /anello/.test(await page.locator('[data-traduzione]').innerText()) &&
          await page.locator('[data-traduzione] [data-della-storia]').count() === 1)
uguale('e il libro paga ancora tutto', await page.locator('[data-paga]').getAttribute('data-paga-si'), '1')
await scatto(page, 'spagnolo-libro-puntata')
for (let i = 0; i < 4 && !(await page.locator('[data-azione="ho-letto"]').count()); i++)
  await page.locator('[data-azione="pagina-avanti"]').click()
await page.locator('[data-azione="ho-letto"]').click()
const monetePuntata = (await leggiProfilo(page)).coins
const tipiVisti = []
while (!(await page.locator('[data-fine]').count())) {
  const { tipo, esito } = await rispondiGiusto()
  tipiVisti.push(tipo)
  if (esito) uguale(`una domanda «${tipo}» risposta giusta`, esito, 'giusta')
}
nota(tipiVisti.join(' · '))
controlla('la prima puntata chiede anche la frase e di metterle in ordine', tipiVisti.includes('frase') && tipiVisti.includes('ordine'), tipiVisti.join(' · '))
await attendi(page, 900)
const dopoP1 = await leggiProfilo(page)
uguale('ogni domanda ha pagato: la parola della storia era gratis', dopoP1.coins - monetePuntata, tipiVisti.length * 4)
uguale('e nello SRS non ha segnato niente', JSON.stringify(dopoP1.items['es:anillo'] || null), vecchioTree)
const serie = (dopoP1.campagne.spagnolo.serie || {})['il-mercato-della-nonna'] || {}
controlla('la serie ha salvato le sue variabili', serie.valori && serie.valori.frutta && serie.valori.colore && serie.valori.mezzo, JSON.stringify(serie))
uguale('e fin dove si è arrivati', serie.fatte, 1)
uguale('il cartello offre la puntata dopo', (await page.locator('[data-fine] [data-azione="avanti"]').innerText()).trim(),
       'Puntata 2 →')
controlla('e accanto un’altra storia', await page.locator('[data-fine] [data-azione="altra-storia"]').count() === 1)
await scatto(page, 'spagnolo-libro-puntata-fine')
await page.locator('[data-fine] [data-azione="avanti"]').click()
await page.waitForSelector('[data-libro-testo] [data-riassunto]')
uguale('è la puntata 2', (await page.locator('[data-puntata]').innerText()).trim().toLowerCase(), 'puntata 2')
{
  const testo = await page.locator('[data-libro-testo]').innerText()
  controlla('con la stessa frutta della puntata 1', testo.includes(serie.valori.frutta), serie.valori.frutta + ' — ' + testo.slice(0, 300))
}
controlla('comincia con «Nella puntata prima»',
          /nella puntata prima/i.test(await page.locator('[data-libro-testo] [data-riassunto]').innerText()))
for (let i = 0; i < 4 && !(await page.locator('[data-azione="ho-letto"]').count()); i++)
  await page.locator('[data-azione="pagina-avanti"]').click()
await page.locator('[data-azione="ho-letto"]').click()
const tipi2 = []
while (!(await page.locator('[data-fine]').count())) {
  const { tipo, esito } = await rispondiGiusto()
  tipi2.push(tipo)
  if (esito) uguale(`puntata 2: «${tipo}» giusta`, esito, 'giusta')
}
controlla('e la puntata 2 chiede chi l’ha detto', tipi2.includes('chi') && tipi2.includes('frase'), tipi2.join(' · '))
await attendi(page, 900)
uguale('la puntata 2 è letta, e la serie lo sa',
       ((await leggiProfilo(page)).campagne.spagnolo.serie['il-mercato-della-nonna'] || {}).fatte, 2)
await page.locator('[data-fine] [data-azione="mappa"]').click()
await page.waitForSelector('[data-mappa-inglese]')

/* ---------- la pagina di un concetto ----------
   La prima volta in «È un cane, è una mucca» viene prima la pagina del primo concetto,
   ferma finché non si tocca «Ho capito»; poi le frasi (docs/lingue/concetti.md). */
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('.carte')
const primeTre = Object.fromEntries(['prima-colores', 'prima-animales', 'prima-juguetes'].map((id, i) => [id, i + 1]))
await conEta(6.5, { campagne: { spagnolo: { tappa: 3, libera: false, stelle: {}, cfg: {}, vinte: primeTre } } })
await carta.click()
await page.waitForSelector('[data-tappa="prima-es-un"][data-stato="aperta"]')
await page.locator('[data-tappa="prima-es-un"]').click()
await page.waitForSelector('[data-pagina]', { timeout: 5000 })
uguale('la pagina è del primo concetto', await page.locator('[data-pagina]').getAttribute('data-concetto'), concettiDellaTappa(tappaDi('prima-es-un'))[0].id)
uguale('non è una ripresa', await page.locator('[data-pagina]').getAttribute('data-ripresa'), '0')
uguale('due esempi', await page.locator('[data-pagina] [data-esempio]').count(), 2)
controlla('quello che conta è colorato', await page.locator('[data-pagina] [data-forte]').count() > 0)
uguale('nessuna domanda sotto', await page.locator('[data-domanda]').count(), 0)
await attendi(page, 2000)
uguale('e nessuna attesa: dopo due secondi è ancora lì', await page.locator('[data-pagina]').count(), 1)
await scatto(page, 'spagnolo-pagina')
await page.locator('[data-azione="capito"]').click()
await page.waitForSelector('[data-domanda][data-genere="frase"]', { timeout: 3000 })
uguale('«Ho capito» porta alle frasi', await page.locator('[data-pagina]').count(), 0)
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('[data-mappa-inglese]')

/* ---------- 6. a dieci anni si comincia dalla prima ----------
   L'età non apre mondi; uno in cui ha già vinto una tappa resta aperto
   (chi l'aveva aperto per età lo ritrova). */
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('.carte')
await conEta(10, { campagne: { spagnolo: { tappa: 0, libera: false, stelle: {}, cfg: {}, vinte: { 'quarta-dia': 1 } } } })
await carta.click()
await page.waitForSelector('[data-mappa-inglese] [data-tappa]')
uguale('la prima comincia da capo', await page.locator('[data-tappa="prima-colores"]').getAttribute('data-stato'), 'aperta')
uguale('una tappa alla volta', await page.locator('[data-tappa="prima-animales"]').getAttribute('data-stato'), 'chiusa')
uguale('la seconda è chiusa', await page.locator('[data-tappa="seconda-comida"]').getAttribute('data-stato'), 'chiusa')
uguale('la quarta, con una tappa vinta, resta aperta',
       await page.locator('[data-tappa="quarta-hora"]').getAttribute('data-stato'), 'aperta')
uguale('il libro della prima è chiuso', await page.locator('[data-libro="prima"]').getAttribute('data-stato'), 'chiusa')
await page.locator('[data-tappa="seconda-comida"]').click()
await page.waitForSelector('[data-serve]', { timeout: 2000 })
controlla('il cartiglio chiede la prima finita',
          (await page.locator('[data-serve]').innerText()).includes('Prima finisci «La valle dei girasoli»'),
          await page.locator('[data-serve]').innerText())

/* ---------- 7. il gioco di prima, in fondo alla mappa ----------
   Chi aveva finito la campagna vecchia (profilo `esp`) ha il suo gioco libero
   in fondo alla mappa; ci gioca davvero, e uscendo torna alla mappa. */
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('.carte')
await conEta(10, { esp: { tappa: 13, libera: true } })
await carta.click()
await page.waitForSelector('[data-prima]', { timeout: 5000 })
await page.locator('[data-prima]').scrollIntoViewIfNeeded()
await page.locator('[data-prima]').click()
await page.waitForSelector('.scelte .scelta', { timeout: 5000 })
const partita = await page.evaluate(async () => {
  const g = window.__es
  const inizio = { fase: g.fase.value, libero: g.tappaIdx.value }
  let giuste = 0
  for (let i = 0; i < 12 && g.fase.value === 'gioco'; i++) {
    const t = g.turno.value
    g.rispondi(g.giusta()); giuste++
    for (let j = 0; j < 40 && g.turno.value === t; j++) await new Promise(r => setTimeout(r, 50))
  }
  return { ...inizio, giuste, dopo: g.hud.giuste }
})
uguale('il gioco di prima parte dritto', partita.fase, 'gioco')
uguale('ed è il gioco libero, non una tappa', partita.libero, -1)
uguale('e si gioca davvero', partita.dopo, partita.giuste)
await attendi(page, 500)
{
  const p = await leggiProfilo(page)
  controlla('le risposte finiscono nei contatori dello spagnolo di sempre',
            (p.totals.es || 0) + (p.totals.verbiEs || 0) + (p.totals.frasiEs || 0) >= partita.giuste, JSON.stringify(p.totals))
  uguale('e la campagna vecchia resta finita', p.esp.libera, true)
}
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('[data-mappa-inglese]', { timeout: 5000 })
controlla('uscendo si torna alla mappa del tesoro', await page.locator('[data-prima]').count() === 1)

controlla('nessun errore in console', errori.length === 0, errori.join(' · '))
await browser.close()
riassunto('Lo spagnolo a mondi nel browser')
