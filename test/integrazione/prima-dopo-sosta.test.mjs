/* La tappa di Prima e dopo lasciata a metà, nel browser: si tocca una
   vignetta, si esce con ←, la mappa offre in cima «torno da dove ero» e la
   domanda è com'era; anche dopo che la pagina è sparita (pagehide) a
   spiegazione aperta, e dopo aver ricaricato. Una tappa nuova chiede prima.
   Una tappa vinta toglie la carta. Vedi docs/prima-dopo/sosta.md.
   `node test/esegui.mjs prima-dopo-sosta` */
import { apriBrowser, apriGioco, azzera, semina, leggiProfilo, attendi, scatto }
  from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { VERSIONE } from '../../src/giochi/prima-dopo/motore/sosta.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

const entra = async () => {
  await page.locator('.carta.gioco[data-gioco="prima"]').click()
  await page.waitForSelector('.pd-mappa', { timeout: 5000 })
}
const sosta = async () => (await leggiProfilo(page))?.campagne?.prima?.sosta || null
const indietro = () => page.locator('button[aria-label="indietro"]').click()

/* com'è la domanda a schermo: le buche e le vignette da pescare, in ordine */
const stato = () => page.evaluate(() => JSON.stringify({
  buche: [...document.querySelectorAll('.pd-striscia .pd-buca')].map(b =>
    (b.getAttribute('aria-label') || '') + (b.classList.contains('pd-piena') ? '+' : '-')),
  pesca: [...document.querySelectorAll('.pd-pesca .pd-vignetta')].map(b => b.getAttribute('aria-label')),
}))
const rimanda = () => attendi(page, 400)       // la finestra cieca della domanda

/* ══════════ 1. dal vivo: una vignetta posata, ←, e si riprende ══════════ */
await semina(page, { settings: { eta: 5 } })
await entra()
uguale('senza niente a metà la mappa non ha la carta', await page.locator('[data-ripresa]').count(), 0)
await page.locator('.pd-tappa[data-tappa="0"]').click()
await page.waitForSelector('.pd-storia')
await rimanda()
await page.locator('.pd-pesca .pd-vignetta').first().click()
await attendi(page, 200)
const lasciata = await stato()
controlla('la prova parte da una vignetta posata', lasciata.includes('+'), lasciata)

await indietro()
await page.waitForSelector('.pd-mappa')
await attendi(page, 400)
{
  const s = await sosta()
  controlla('uscendo la sosta è scritta', !!s && s.v === VERSIONE && s.tappa === 'seme', JSON.stringify(s))
  uguale('con una vignetta posata', s?.quesito?.posate?.filter(x => x !== null).length, 1)
}
await page.waitForSelector('[data-ripresa]')
{
  const carta = await page.locator('[data-ripresa]').innerText()
  controlla('la carta dice la tappa e a che punto era', /Il seme cresce/.test(carta) && /0 storie su 4/.test(carta), carta)
}
await scatto(page, 'prima-ripresa')

await page.locator('[data-ripresa] [data-azione="riprendi"]').click()
await page.waitForSelector('.pd-storia')
await rimanda()
uguale('la domanda è la stessa, con la vignetta dov\'era', await stato(), lasciata)
uguale('e la carta non c\'è più mentre si gioca', await page.locator('[data-ripresa]').count(), 0)

/* ══════════ 2. la pagina sparisce a spiegazione aperta ══════════ */
/* si posano le altre due vignette nell'ordine in cui compaiono: è
   sempre sbagliato (le sparse non arrivano mai in ordine) */
for (let i = 0; i < 2; i++) {
  await page.locator('.pd-pesca .pd-vignetta').first().click()
  await attendi(page, 150)
}
await page.waitForSelector('[data-spiega]')
{
  // «mai in ordine» vale per tutte le tre insieme: con una già posata a caso potrebbe essere giusta
  const titolo = (await page.locator('[data-spiega] .pd-nome').innerText()).trim()
  await attendi(page, 300)
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')))
  await attendi(page, 300)
  const s = await sosta()
  controlla('con la spiegazione aperta lo sbaglio è già contato', s?.errori === 1, JSON.stringify(s))
  await page.reload()
  await page.waitForSelector('.carte')
  await entra()
  await page.waitForSelector('[data-ripresa]')
  uguale('dopo aver ricaricato la carta c\'è ancora', await page.locator('[data-ripresa]').count(), 1)
  await page.locator('[data-ripresa] [data-azione="riprendi"]').click()
  await page.waitForSelector('[data-spiega]')
  uguale('e riprendendo si riapre la stessa spiegazione',
         (await page.locator('[data-spiega] .pd-nome').innerText()).trim(), titolo)
  await attendi(page, 400)
  await page.locator('[data-spiega] .pd-grosso').click()
  await page.waitForSelector('[data-spiega]', { state: 'detached' })
  await rimanda()
  uguale('«ho capito» riporta a una domanda da fare',
         await page.locator('.pd-striscia .pd-buca.pd-piena').count(), 0)
  uguale('e lo sbaglio non si è azzerato', (await sosta())?.errori, 1)
}

/* ══════════ 3. una sosta fatta a mano: le storie fatte, gli errori, le monete ══════════ */
/* seme → albero: 🌰 🌱 🌳, sparse come 🌳 🌰 🌱; tre storie su quattro fatte,
   uno sbaglio, due monete già prese */
const sosteSeme = (fatte, extra = {}) => ({
  campagne: { prima: { tappa: 3, stelle: {}, cfg: {}, sosta: {
    v: VERSIONE, tappa: 'seme', fatte, errori: 1, recenti: ['seme-albero'],
    verbo: 'ordina3', storia: 'seme-albero',
    quesito: { tipo: 'ordina', sparse: [2, 0, 1], posate: [null, null, null] },
    serie: 3, monete: { chiesto: 2, dato: 2 }, ...extra } } },
})
const soluzione = async () => {
  for (const e of ['🌰', '🌱', '🌳']) {
    await page.locator(`.pd-pesca .pd-vignetta[aria-label="vignetta ${e}"]`).click()
    await attendi(page, 100)
  }
}

await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('.pd-mappa')
await indietro()
await page.waitForSelector('.carte')
await semina(page, sosteSeme(3))
await entra()
{
  const carta = await page.locator('[data-ripresa]').innerText()
  controlla('la carta dice quante storie erano fatte', /3 storie su 4/.test(carta), carta)
}
await page.locator('[data-ripresa] [data-azione="riprendi"]').click()
await page.waitForSelector('.pd-storia')
await rimanda()
uguale('le vignette sono sparse come erano',
       JSON.stringify((await page.evaluate(() => [...document.querySelectorAll('.pd-pesca .pd-vignetta')]
         .map(b => b.getAttribute('aria-label')))).map(a => a.slice(-2))),
       JSON.stringify(['🌳', '🌰', '🌱']))
await soluzione()
await page.waitForSelector('[data-fine="tappa"]', { timeout: 4000 })
{
  const t = await page.locator('[data-fine="tappa"]').innerText()
  controlla('l\'ultima storia chiude la tappa, con le due stelle dello sbaglio di prima',
            (t.match(/⭐/g) || []).length === 2, t)
  const m = +(await page.locator('[data-monete-prese]').innerText()).match(/\d+/)[0]
  controlla('le monete già prese restano nel conto', m >= 2, `+${m}`)
}
uguale('finita la tappa la sosta si toglie', await sosta(), null)
await page.locator('[data-fine="tappa"] .pd-grosso').click()
await page.waitForSelector('.pd-mappa')
uguale('e la carta non c\'è', await page.locator('[data-ripresa]').count(), 0)

/* ══════════ 4. ← nel respiro dell'ultima storia: la tappa si porta a casa ══════════ */
await indietro()
await page.waitForSelector('.carte')
await semina(page, sosteSeme(3))
await entra()
await page.locator('[data-ripresa] [data-azione="riprendi"]').click()
await page.waitForSelector('.pd-storia')
await rimanda()
await soluzione()
await indietro()                  // dentro il ✔️, prima del cartello
await page.waitForSelector('.pd-mappa')
await attendi(page, 300)
uguale('uscendo a un passo dalla fine la tappa è finita lo stesso',
       await page.locator('.pd-tappa[data-tappa="0"] .pd-stelle').innerText().then(t => (t.match(/⭐/g) || []).length), 2)
uguale('senza sosta', await sosta(), null)
uguale('e senza carta', await page.locator('[data-ripresa]').count(), 0)

/* ══════════ 5. una tappa nuova chiede prima ══════════ */
await indietro()
await page.waitForSelector('.carte')
await semina(page, sosteSeme(1))
await entra()
await page.waitForSelector('[data-ripresa]')
await page.locator('.pd-tappa[data-tappa="1"]').click()
uguale('toccare un\'altra tappa chiede', await page.locator('[data-chiede]').count(), 1)
await scatto(page, 'prima-chiede')
await page.locator('[data-chiede] [data-azione="riprendi-invece"]').click()
await page.waitForSelector('.pd-storia')
await rimanda()
uguale('«no, torno a quella di prima» rimette la tappa a metà',
       (await page.locator('.barra-app .dove').innerText()).includes('Il seme cresce'), true)
await indietro()
await page.waitForSelector('[data-ripresa]')
await page.locator('.pd-tappa[data-tappa="1"]').click()
await page.locator('[data-chiede] [data-azione="comincia"]').click()
await page.waitForSelector('.pd-storia')
await rimanda()
uguale('«va bene, comincio» apre la tappa nuova',
       (await page.locator('.barra-app .dove').innerText()).includes('Buongiorno'), true)
await indietro()
await page.waitForSelector('[data-ripresa]')
{
  const carta = await page.locator('[data-ripresa]').innerText()
  controlla('e adesso la carta è quella nuova', /Buongiorno/.test(carta) && /0 storie su 4/.test(carta), carta)
}
await page.locator('[data-ripresa] [data-azione="scorda"]').click()
uguale('«lascio perdere» toglie la carta', await page.locator('[data-ripresa]').count(), 0)
uguale('e la sosta', await sosta(), null)
await page.locator('.pd-tappa[data-tappa="1"]').click()
await page.waitForSelector('.pd-storia')
uguale('senza niente a metà una tappa si apre senza chiedere', await page.locator('[data-chiede]').count(), 0)

/* ══════════ 6. un salvataggio che non torna si butta ══════════ */
await indietro()
await page.waitForSelector('.pd-mappa')
await indietro()
await page.waitForSelector('.carte')
await semina(page, sosteSeme(1, { storia: 'storia-che-non-esiste' }))
await entra()
await page.waitForSelector('[data-ripresa]')
await page.locator('[data-ripresa] [data-azione="riprendi"]').click()
await attendi(page, 300)
uguale('la carta sparisce e la mappa resta', await page.locator('[data-ripresa]').count(), 0)
uguale('senza aprire niente', await page.locator('.pd-storia').count(), 0)
uguale('e la sosta si toglie', await sosta(), null)

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('prima e dopo — la tappa lasciata a metà, nel browser')
