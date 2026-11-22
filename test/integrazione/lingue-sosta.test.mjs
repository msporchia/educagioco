/* La tappa di una lingua a mondi lasciata a metà, nel browser, in inglese e in spagnolo: si esce con ←, si rientra, la mappa
   offre in cima «torno da dove ero» e la tappa riprende con la stessa domanda, le stesse giuste e le monete già prese (nessuna
   pagata due volte). Anche dopo aver ricaricato la pagina, e mai in silenzio: una tappa nuova chiede prima di buttarla. Una
   tappa vinta toglie la carta. I due giochi sono gemelli ma con due `Gioco.vue`: una semina prepara tutte e due le lingue, e la
   prova è la stessa. Cosa si salva e cosa si paga è nelle unità (unita/inglese-sosta, unita/spagnolo-sosta); qui il giro vero.
   Alla fine di una tappa non si arriva giocandola tutta: la sosta scritta dal gioco si risemina col bersaglio a una giusta
   da lì (`bersaglio` sta nella sosta), e si vince con l'ultima. Vedi docs/lingue/sosta.md. Il gioco di prima lasciato a metà
   lo prova integrazione/lingue-prima.
   perché: la tappa delle lingue a mondi lasciata a metà, in inglese e in spagnolo: «torno da dove ero» in cima alla mappa, stessa domanda, giuste e monete già prese (mai pagate due volte), anche dopo la ricarica
   a parte perché: POTREBBE stare dentro lingue-mondi (stessa semina e stessa mappa), ma lì si prova il gioco intero; qui la sosta, come pozioni-sosta, prima-dopo-sosta e passo-passo-sosta per i loro giochi
   `node test/esegui.mjs lingue-sosta --niente-build` */
import { apriBrowser, apriGioco, semina, leggiProfilo, scatto, scegli } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto, blocco } from '../aiuto/verifica.mjs'
import { soste } from '../aiuto/soste.mjs'
import { allaHome } from '../aiuto/bacheca.mjs'
import { orologioDelleLingue } from '../aiuto/lingue.mjs'

const LINGUE = [
  { chiave: 'inglese', prima: 'prima-colori', seconda: 'prima-animali', terza: 'prima-giocattoli' },
  { chiave: 'spagnolo', prima: 'prima-colores', seconda: 'prima-animales', terza: 'prima-juguetes' },
]
const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
const orologio = orologioDelleLingue(page)
await orologio.installa()                                    // la finestra cieca e l'esito si portano avanti
// la prima tappa vinta: la seconda è aperta, e si può cominciare l'una o l'altra; lo spagnolo è spento di base
await semina(page, { coins: 50, settings: { giochi: { spagnolo: true } }, campagne: Object.fromEntries(LINGUE.map(L =>
  [L.chiave, { tappa: 1, libera: false, stelle: {}, cfg: {}, vinte: { [L.prima]: Date.now() - 86400000 } }])) })

const conto = () => page.locator('[data-conto]').innerText().then(t => t.replace(/\s+/g, ' ').trim())
const domanda = () => page.locator('[data-domanda]').evaluate(e => e.innerText.replace(/\s+/g, ' ').trim())
// la domanda c'è e la finestra cieca è passata (`data-pronto` sulla radice: la domanda e la radice cambiano nello stesso giro)
async function domandaAperta() {
  await page.waitForSelector('[data-domanda]')
  await orologio.cieca()
}
const tocca = giusta => page.locator(`[data-domanda] [data-opzione]${giusta ? '[data-giusta]' : ':not([data-giusta])'}`).first().click()
async function rispondi() {
  await domandaAperta()
  await tocca(true)
  await page.waitForSelector('[data-esito="giusta"]')
  await orologio.dopoLEsito()                                // se ne va, o l'ultima giusta lascia il posto al cartello
}

for (const L of LINGUE) await blocco(L.chiave, async () => {
  const entra = async () => {
    await scegli(page, L.chiave)
    await page.waitForSelector('[data-mappa-inglese] [data-tappa]')
  }
  const S = soste(page, { entra, chiave: L.chiave, alla: '[data-mappa-inglese]' })
  const tappa = id => page.locator(`[data-tappa="${id}"]`)
  // la sosta scritta dal gioco, riseminata a una giusta dalla fine: poi si torna alla mappa
  async function aUnaDallaFine() {
    const s = await S.sosta(x => !!x)
    const { campagne } = await leggiProfilo(page)
    await semina(page, { campagne: { ...campagne, [L.chiave]: { ...campagne[L.chiave], sosta: { ...s, bersaglio: s.giuste + 1 } } } })
    await entra()
  }

  /* ── una tappa a metà: una giusta, la seconda domanda aperta ── */
  await allaHome(page)
  await entra()
  uguale('senza tappe a metà la carta non c\'è', await S.quanteCarte(), 0)
  const m0 = await S.monete()
  await tappa(L.prima).click()
  await rispondi()
  await domandaAperta()
  const lasciata = await domanda()
  const contoLasciato = await conto()
  const m1 = await S.monete()
  controlla('la giusta ha pagato', m1 > m0, `${m0} → ${m1}`)
  controlla('la prova parte da una giusta', /^✅ 1 \//.test(contoLasciato), contoLasciato)

  /* ← in mezzo alla tappa: si torna alla mappa, e la carta c'è */
  await S.esci()
  const carta = await S.cartaDice()
  controlla('la carta dice dove si era', /✅ 1 di \d+/.test(carta), carta)
  await scatto(page, `${L.chiave}-ripresa`)
  uguale('uscire non ha pagato né tolto niente', await S.monete(), m1)

  await S.riprendi()
  await page.waitForSelector('[data-domanda]')
  uguale('si riprende con la stessa domanda, risposte comprese', await domanda(), lasciata)
  uguale('con le stesse giuste', await conto(), contoLasciato)
  uguale('la carta sparisce', await S.quanteCarte(), 0)
  uguale('rientrare non ha pagato niente', await S.monete(), m1)
  await rispondi()
  const m1b = await S.monete()
  controlla('una giusta in più conta una volta e paga una volta', m1b > m1 && /^✅ 2 \//.test(await conto()), `${m1} → ${m1b}, ${await conto()}`)
  await domandaAperta()

  /* ── la pagina che sparisce: il telefono in tasca, l'app chiusa ── */
  const lasciata2 = await domanda()
  await S.ricarica(s => s?.giuste === 2)                    // la sosta scritta è quella con la seconda giusta
  uguale('anche dopo aver ricaricato la pagina la carta c\'è', await S.quanteCarte(), 1)
  await S.riprendi()
  await page.waitForSelector('[data-domanda]')
  uguale('e la domanda è quella', await domanda(), lasciata2)
  uguale('e le giuste anche', (await conto()).slice(0, 3), '✅ 2')

  /* ── toccare un'altra tappa non butta la sosta in silenzio ── */
  await S.esci()
  await S.cartaDice()
  await S.chiede(() => tappa(L.seconda).click())
  uguale('una tappa nuova chiede prima', await page.locator('[data-chiede]').count(), 1)
  await page.click('[data-chiede] [data-azione="riprendi-invece"]')
  await page.waitForSelector('[data-domanda]')
  uguale('«torno a quella di prima» riprende la prima', await domanda(), lasciata2)
  await S.esci()
  const m2 = await S.monete()
  await S.chiede(() => tappa(L.seconda).click(), 'comincia')
  await page.waitForSelector('[data-domanda]')
  uguale('scelta la nuova, si gioca quella da capo', (await conto()).slice(0, 3), '✅ 0')

  /* ── una tappa vinta non lascia niente: la carta non torna. Una giusta, ←, e la sosta a una dalla fine ── */
  await rispondi()
  await S.esci()
  controlla('e la carta parla della nuova', (await S.cartaDice()).includes('✅ 1 di'))
  await aUnaDallaFine()
  await S.riprendi()
  await rispondi()
  await page.waitForSelector('[data-monete-fine]', { timeout: 9000 })
  const premio = Number(await page.locator('[data-monete-fine]').getAttribute('data-monete'))
  uguale('il cartello dice tutte le monete della tappa, anche di prima della sosta', premio, (await S.monete()) - m2)
  await page.click('[data-fine] [data-azione="mappa"]')
  await page.waitForSelector('[data-mappa-inglese]')
  uguale('vinta la tappa, la carta non c\'è', await S.quanteCarte(), 0)
  const profilo = await leggiProfilo(page)
  controlla('e la tappa è segnata vinta', !!(profilo.campagne[L.chiave].vinte || {})[L.seconda])
  controlla('e nessuna sosta resta nel profilo', !profilo.campagne[L.chiave].sosta)

  /* ── «lascio perdere» toglie la carta ── */
  await tappa(L.terza).click()
  await rispondi()
  await S.esci()
  await S.cartaDice()
  await S.scorda()
  uguale('«lascio perdere» toglie la carta', await S.quanteCarte(), 0)

  /* ── uscire subito dopo l'ultima giusta non perde la vittoria ── */
  await tappa(L.terza).click()
  uguale('e la tappa riparte da capo', (await domandaAperta(), await conto()).slice(0, 3), '✅ 0')
  await rispondi()
  await S.esci()
  await aUnaDallaFine()
  await S.riprendi()
  await domandaAperta()
  await tocca(true)
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
