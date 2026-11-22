/* La tappa di una lingua a mondi lasciata a metà, nel browser, in inglese e in spagnolo: si esce con ←, si rientra, la mappa
   offre in cima «torno da dove ero» e la tappa riprende con la stessa domanda, le stesse giuste e le monete già prese (nessuna
   pagata due volte). Anche dopo aver ricaricato la pagina, e mai in silenzio: una tappa nuova chiede prima di buttarla. Una
   tappa vinta toglie la carta. I due giochi sono gemelli: una semina prepara tutte e due le lingue, e la prova è la stessa.
   Vedi docs/lingue/sosta.md. Il gioco di prima lasciato a metà lo prova integrazione/lingue-prima.
   perché: la tappa delle lingue a mondi lasciata a metà, in inglese e in spagnolo: «torno da dove ero» in cima alla mappa, stessa domanda, giuste e monete già prese (mai pagate due volte), anche dopo la ricarica
   a parte perché: POTREBBE stare dentro lingue-mondi (stessa semina e stessa mappa), ma lì si prova il gioco intero; qui la sosta, come pozioni-sosta, prima-dopo-sosta e passo-passo-sosta per i loro giochi
   `node test/esegui.mjs lingue-sosta --niente-build` */
import { apriBrowser, apriGioco, semina, attendi, leggiProfilo, scatto, scegli } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto, blocco } from '../aiuto/verifica.mjs'
import { soste } from '../aiuto/soste.mjs'
import { allaHome } from '../aiuto/bacheca.mjs'

const LINGUE = [
  { chiave: 'inglese', prima: 'prima-colori', seconda: 'prima-animali', terza: 'prima-giocattoli' },
  { chiave: 'spagnolo', prima: 'prima-colores', seconda: 'prima-animales', terza: 'prima-juguetes' },
]
const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
// la prima tappa vinta: la seconda è aperta, e si può cominciare l'una o l'altra; lo spagnolo è spento di base
await semina(page, { coins: 50, settings: { giochi: { spagnolo: true } }, campagne: Object.fromEntries(LINGUE.map(L =>
  [L.chiave, { tappa: 1, libera: false, stelle: {}, cfg: {}, vinte: { [L.prima]: Date.now() - 86400000 } }])) })

const conto = () => page.locator('[data-conto]').innerText().then(t => t.replace(/\s+/g, ' ').trim())
const domanda = () => page.locator('[data-domanda]').evaluate(e => e.innerText.replace(/\s+/g, ' ').trim())
async function rispondi(giusta = true) {
  await page.waitForSelector('[data-domanda]')
  await attendi(page, 400)                                   // la finestra cieca
  await page.locator(`[data-domanda] [data-opzione]${giusta ? '[data-giusta]' : ':not([data-giusta])'}`).first().click()
  await page.waitForSelector(`[data-esito="${giusta ? 'giusta' : 'sbagliata'}"]`)
  // l'esito se ne va, o l'ultima giusta lascia il posto al cartello
  await page.waitForFunction(() => !document.querySelector('[data-esito]') || document.querySelector('[data-fine]'),
                             null, { timeout: 9000 })
}

for (const L of LINGUE) await blocco(L.chiave, async () => {
  const entra = async () => {
    await scegli(page, L.chiave)
    await page.waitForSelector('[data-mappa-inglese] [data-tappa]')
  }
  const S = soste(page, { entra, chiave: L.chiave, alla: '[data-mappa-inglese]' })
  const tappa = id => page.locator(`[data-tappa="${id}"]`)

  /* ── una tappa a metà: tre giuste, uno sbaglio, la quinta domanda aperta ── */
  await allaHome(page)
  await entra()
  uguale('senza tappe a metà la carta non c\'è', await S.quanteCarte(), 0)
  const m0 = await S.monete()
  await tappa(L.prima).click()
  for (let i = 0; i < 3; i++) await rispondi(true)
  await rispondi(false)
  await page.waitForSelector('[data-domanda]')
  const lasciata = await domanda()
  const contoLasciato = await conto()
  const m1 = await S.monete()
  controlla('le tre giuste hanno pagato', m1 > m0, `${m0} → ${m1}`)
  controlla('la prova parte da tre giuste', /^✅ 3 \//.test(contoLasciato), contoLasciato)

  /* ← in mezzo alla tappa: si torna alla mappa, e la carta c'è */
  await S.esci()
  const carta = await S.cartaDice()
  controlla('la carta dice dove si era', /✅ 3 di \d+/.test(carta), carta)
  await scatto(page, `${L.chiave}-ripresa`)
  uguale('uscire non ha pagato né tolto niente', await S.monete(), m1)

  await S.riprendi()
  await page.waitForSelector('[data-domanda]')
  uguale('si riprende con la stessa domanda, risposte comprese', await domanda(), lasciata)
  uguale('con le stesse giuste', await conto(), contoLasciato)
  uguale('la carta sparisce', await S.quanteCarte(), 0)
  uguale('rientrare non ha pagato niente', await S.monete(), m1)
  await rispondi(true)
  const m1b = await S.monete()
  controlla('una giusta in più conta una volta e paga una volta', m1b > m1 && /^✅ 4 \//.test(await conto()), `${m1} → ${m1b}, ${await conto()}`)
  await page.waitForSelector('[data-domanda]')

  /* ── la pagina che sparisce: il telefono in tasca, l'app chiusa ── */
  const lasciata2 = await domanda()
  await S.ricarica(s => s?.giuste === 4)                    // la sosta scritta è quella con la quarta giusta
  uguale('anche dopo aver ricaricato la pagina la carta c\'è', await S.quanteCarte(), 1)
  await S.riprendi()
  await page.waitForSelector('[data-domanda]')
  uguale('e la domanda è quella', await domanda(), lasciata2)
  uguale('e le giuste anche', (await conto()).slice(0, 3), '✅ 4')

  /* ── toccare un'altra tappa non butta la sosta in silenzio ── */
  await S.esci()
  await S.cartaDice()
  await S.chiede(() => tappa(L.seconda).click())
  uguale('una tappa nuova chiede prima', await page.locator('[data-chiede]').count(), 1)
  await page.click('[data-chiede] [data-azione="riprendi-invece"]')
  await page.waitForSelector('[data-domanda]')
  uguale('«torno a quella di prima» riprende la prima', await domanda(), lasciata2)
  await S.esci()
  await S.chiede(() => tappa(L.seconda).click(), 'comincia')
  await page.waitForSelector('[data-domanda]')
  uguale('scelta la nuova, si gioca quella da capo', (await conto()).slice(0, 3), '✅ 0')
  await S.esci()
  controlla('e la carta parla della nuova', (await S.cartaDice()).includes('✅ 0 di'))
  await S.scorda()
  uguale('«lascio perdere» toglie la carta', await S.quanteCarte(), 0)

  /* ── una tappa vinta non lascia niente: la carta non torna ── */
  const m2 = await S.monete()
  await tappa(L.seconda).click()
  let fatte = 0
  while (fatte++ < 40) {
    await page.waitForSelector('[data-domanda], [data-fine]')
    if (await page.locator('[data-fine]').count()) break
    await rispondi(true)
    // ← a metà, una volta: rientrando si riprende e si continua, senza pagare due volte
    if (fatte === 3) {
      await S.esci()
      await S.cartaDice()
      await S.riprendi()
    }
  }
  await page.waitForSelector('[data-monete-fine]', { timeout: 9000 })
  const premio = Number(await page.locator('[data-monete-fine]').getAttribute('data-monete'))
  uguale('il cartello dice tutte le monete della tappa, anche di prima della sosta', premio, (await S.monete()) - m2)
  await page.click('[data-fine] [data-azione="mappa"]')
  await page.waitForSelector('[data-mappa-inglese]')
  uguale('vinta la tappa, la carta non c\'è', await S.quanteCarte(), 0)
  const profilo = await leggiProfilo(page)
  controlla('e la tappa è segnata vinta', !!(profilo.campagne[L.chiave].vinte || {})[L.seconda])
  controlla('e nessuna sosta resta nel profilo', !profilo.campagne[L.chiave].sosta)

  /* ── uscire subito dopo l'ultima giusta non perde la vittoria ── */
  await tappa(L.terza).click()
  for (let i = 0; i < 40; i++) {
    await page.waitForSelector('[data-domanda]')
    const [g, b] = (await conto()).match(/(\d+) \/ (\d+)/).slice(1).map(Number)
    if (g === b - 1) break
    await rispondi(true)
  }
  await attendi(page, 400)                                   // la finestra cieca
  await page.locator('[data-domanda] [data-opzione][data-giusta]').first().click()
  await page.click('button[aria-label="indietro"]')          // prima del cartello, a esito in corso
  await page.waitForSelector('[data-mappa-inglese]')
  uguale('uscito a risposta finale data, la carta non c\'è', await S.quanteCarte(), 0)
  const dopo = await leggiProfilo(page)
  controlla('e la tappa è vinta', !!(dopo.campagne[L.chiave].vinte || {})[L.terza])
  controlla('senza una sosta nel profilo', !dopo.campagne[L.chiave].sosta)
})

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('le lingue a mondi — la tappa lasciata a metà, nel browser')
