/* perché: la tappa di Conta lasciata a metà: stessa domanda (stessi gettoni negli stessi posti), l'errore resta nelle stelle, le monete non si ripagano, anche dopo una ricarica
   a parte perché: ogni gioco ha il suo tavolo da ritrovare; questo parte dal gioco dei piccoli (età 5) con i gettoni, e non somiglia alle altre soste
   La tappa di Conta lasciata a metà, nel browser: si risponde, si sbaglia,
   si esce con ←, e rientrando la mappa offre in cima «torno da dove ero»:
   la domanda è la stessa (stessi gettoni negli stessi posti), l'errore
   resta nelle stelle, le monete non si ripagano. Anche dopo aver
   ricaricato la pagina, e mai in silenzio: una tappa nuova chiede prima.
   Vedi docs/conta/regole.md.
   `node test/esegui.mjs conta-sosta` */
import { apriBrowser, apriGioco, attendi, scatto, semina, leggiProfilo, scegli }
  from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { soste, finche } from '../aiuto/soste.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await semina(page, { settings: { eta: 5 } })     // il gioco dei piccoli, in home

async function entra() {
  await scegli(page, 'conta')
  await page.waitForSelector('.ct-tappa[data-tappa="0"]')
}
const pronta = () => page.waitForSelector('.ct-cifra:not([disabled])', { timeout: 8000 })
const quanti = () => page.locator('.ct-gettone').count()
async function rispondi(giusta) {
  await pronta()
  const n = await quanti()
  const cifre = await page.locator('.ct-cifra').allInnerTexts()
  const scelta = giusta ? String(n) : cifre.find(c => c !== String(n))
  await page.locator('.ct-cifra', { hasText: new RegExp(`^${scelta}$`) }).first().click()
}
// la domanda com'è a schermo: la frase e dove sta ogni gettone
const come = () => page.evaluate(() => ({
  frase: document.querySelector('.ct-frase')?.textContent,
  gettoni: [...document.querySelectorAll('.ct-gettone')]
    .map(g => `${g.dataset.specie}@${g.style.left},${g.style.top}`).join(' '),
}))
const S = soste(page, { entra, chiave: 'conta', alla: '.ct-tappa[data-tappa="0"]' })
// la sosta sul disco quando è quella attesa (l'archivio scrive 350 ms dopo): `null` aspetta che non ci sia più
const sosta = (attesa = s => s === null) => S.sosta(attesa)
const monete = () => S.monete()

/* ── 1. una giusta, uno sbaglio, e ← ── */
await entra()
await page.click('.ct-tappa[data-tappa="0"]')
await rispondi(true)
await attendi(page, 500)
await rispondi(false)
// il «conta insieme» dopo uno sbaglio: le cifre si spengono mentre si conta, e si riaccendono sulla stessa domanda
await page.waitForSelector('.ct-cifra[disabled]', { timeout: 3000 })
await pronta()
const lasciata = await come()
const moneteLasciate = await monete()
controlla('la prova parte con una giusta e uno sbaglio',
          lasciata.gettoni.length > 0 && moneteLasciate > 0, JSON.stringify(lasciata))

await page.click('button[aria-label="indietro"]')
await page.waitForSelector('[data-ripresa]')
controlla('la carta dice a che domanda si era',
          /domanda 2 di 4/.test(await page.locator('[data-ripresa]').textContent()))
{
  const s = await sosta(x => x?.fatte === 1 && x?.errori === 1)
  controlla('e la sosta è scritta nel profilo', s?.fatte === 1 && s?.errori === 1, JSON.stringify(s))
}
await scatto(page, 'conta-ripresa')

/* ── 2. si riprende: la stessa domanda, senza ripagare ── */
await page.click('[data-ripresa] [data-azione="riprendi"]')
await pronta()
const ripresa = await come()
uguale('la domanda è la stessa, gettone per gettone', ripresa.gettoni, lasciata.gettoni)
uguale('con la stessa consegna', ripresa.frase, lasciata.frase)
uguale('e le monete non si ripagano', await monete(), moneteLasciate)

await rispondi(true)
await attendi(page, 500)
await rispondi(true)
await attendi(page, 500)
await rispondi(true)
await page.waitForSelector('.ct-velo', { timeout: 8000 })
uguale('lo sbaglio di prima conta ancora nelle stelle: due stelle', (await page.locator('.ct-punteggio').innerText()).trim(), '⭐⭐')
uguale('a tappa finita non resta sosta', await sosta(), null)
await page.click('.ct-velo .ct-grosso')
await page.waitForSelector('.ct-tappa[data-tappa="1"]:not(.ct-chiusa)')
uguale('e la mappa è pulita', await page.locator('[data-ripresa]').count(), 0)

/* ── 3. la pagina che sparisce: si ricarica e la carta c'è ancora ── */
await page.click('.ct-tappa[data-tappa="1"]')
await rispondi(true)
await attendi(page, 500)
await S.ricarica(s => s?.fatte === 1)
uguale('anche dopo aver ricaricato la pagina', await page.locator('[data-ripresa]').count(), 1)
controlla('e dice la tappa lasciata', /Il cortile/.test(await page.locator('[data-ripresa]').textContent()))
await page.click('[data-ripresa] [data-azione="riprendi"]')
await pronta()
controlla('ripresa dopo la ricarica: una domanda a schermo', (await come()).gettoni.length > 0)

/* ── 4. una tappa nuova chiede prima ── */
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('[data-ripresa]')
await page.click('.ct-tappa[data-tappa="0"]')
uguale('toccare un\'altra tappa chiede prima', await page.locator('[data-chiede]').count(), 1)
uguale('e non si è mosso niente', await page.locator('.ct-frase').count(), 0)
await page.click('[data-chiede] [data-azione="riprendi-invece"]')
await pronta()
controlla('«torno a quella di prima» riprende', (await come()).gettoni.length > 0)
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('[data-ripresa]')
await page.click('.ct-tappa[data-tappa="0"]')
await page.click('[data-chiede] [data-azione="comincia"]')
await pronta()
uguale('«comincio» butta quella di prima', await sosta(), null)
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('[data-ripresa]')
controlla('la nuova, lasciata, ha la sua carta', /Il primo gregge/.test(await page.locator('[data-ripresa]').textContent()))

/* ── 5. «lascio perdere» ── */
await page.click('[data-ripresa] [data-azione="scorda"]')
uguale('«lascio perdere» toglie la carta', await page.locator('[data-ripresa]').count(), 0)
uguale('e la sosta', await sosta(), null)

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('conta — la tappa lasciata a metà, nel browser')
