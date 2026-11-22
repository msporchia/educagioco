/* ═══════════════════════════════════════════════════════════════════
   IL PORTALE, CHI CURA, LE TORCE E LA RIPRESA ESATTA, COL DITO
   (docs/sotterraneo/portale-e-sosta.md, docs/sotterraneo/chi-cura.md, docs/sotterraneo/roba.md «La torcia si accende da sé»)

   perché: il portale e la ripresa esatta: sopra la vita di giù, chi cura, le torce, il gemello che riporta giù nel punto preciso, la pergamena
   a parte perché: parte da una sosta in Node di eroe salito dal portale ferito e senza torce; porte-scale parte da una sosta a un piano diverso

   Un giro solo, da una sosta in Node: l'eroe è salito dal portale, ferito, scarico e senza torce. Sopra la barra dice la vita di
   giù, chi cura chiama e cura gratis, la pagina dell'eroe dice chi vende le torce, tre torce dal carovaniere. Il gemello riporta
   giù nel punto esatto, in forze, con la torcia in mano; la pergamena apre un varco che riporta su senza errori; il gemello resta
   e l'ingresso riprende; la ✕ lascia un'uscita e «riprendi da qui» riporta giù dietro il velo. Le regole le provano le unità
   (`sotterraneo-sosta`, `-roba`, `-pergamena`): qui il dito, lo schermo e il salvataggio riletto.
   `node test/esegui.mjs sotterraneo-portale`
   tempo: 200
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, leggiProfilo, nelDialogo, finestraFerma, mondoPronto,
         alBancoDi, compraNellaBottega, sopraVaDa, senzaPensieri, scendiNelSotterraneo, ditoDi } from '../aiuto/browser.mjs'
import { pronto } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, blocco, riassunto } from '../aiuto/verifica.mjs'
import { profiloDelSotterraneo, giuPronto, fermoGiu, cellaGiu, schermoDi, vitaInBarra } from '../aiuto/sotterraneo-discesa.mjs'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { COSE, STANZE_TORCIA } from '../../src/giochi/sotterraneo/dati/cose.js'
import { ilMondo, postiDi } from '../../src/giochi/sotterraneo/motore/mondo-sopra.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { scrivi, PORTALE as VIA_PORTALE } from '../../src/giochi/sotterraneo/motore/sosta.js'

const P = 'pergamena-portale'
const COMPRATE = 3
const roba = { v: 1, gemme: 60, zaino: [P], mano: 'spada', mancina: null, corpo: 'corazza', dito: null, torcia: 0, torce: 0 }
// una discesa lasciata dal portale, ferito e senza energia
const c = new Corsa(CAMPAGNA[0], { seme: 21, eroe: 'cavaliere', roba, rnd: seminato(21) })
c.vita = Math.max(1, Math.floor(c.vitaMax / 3))
c.energia = 0
const VITA_MAX = c.vitaMax, ENERGIA_MAX = c.energiaMax
const DOV_ERA = `${Math.floor(c.eroe.x)},${Math.floor(c.eroe.y)}`
controlla('l\'eroe di prova ha energia da perdere', ENERGIA_MAX > 0)

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
const { tocca } = await ditoDi(page)
// tocca il centro di `sel` quando sta fermo: un fumetto del mondo (e la mappa dopo un dialogo) scorre con la telecamera
async function toccaIl(sel) {
  await finestraFerma(page)
  let b = await page.locator(sel).first().boundingBox()
  for (let i = 0; i < 20; i++) {
    await attendi(page, 150)
    const n = await page.locator(sel).first().boundingBox()
    const fermo = Math.abs(n.x - b.x) < 1 && Math.abs(n.y - b.y) < 1
    b = n
    if (fermo) break
  }
  await tocca(b.x + b.width / 2, b.y + b.height / 2)
}
const avventura = async () => (await leggiProfilo(page))?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere || {}
const riga = sel => page.locator(sel).evaluate(e => ({ n: Number(e.dataset.torce), resta: Number(e.dataset.resta),
                                                       scorta: Number(e.dataset.scorta), testo: e.innerText.replace(/\s+/g, ' ') }))
async function paginaEroe() {
  await toccaIl('[data-azione="eroe-pagina"]')
  await page.waitForSelector('[data-pagina-eroe] [data-torcia-eroe]', { timeout: 5000 })
  return riga('[data-torcia-eroe]')
}
async function chiudi(sel) {
  await toccaIl(`${sel} [data-chiudi]`)
  await page.waitForSelector(sel, { state: 'detached', timeout: 3000 })
}
const daChiCura = (chi, atteso = `[data-dialogo="${chi}"]`) => sopraVaDa(page, `[data-mercante="${chi}"][data-citta="villaggio"]`, `mercante:villaggio:${chi}`, { tocca, atteso })

await semina(page, profiloDelSotterraneo({ tappa: 0, settings: { sperimentali: true },
  avventura: { roba, sosta: scrivi(c, 0, { via: VIA_PORTALE }), mondo: { dove: { portale: true }, parlato: true } } }))
await senzaPensieri(page)   // senza torcia l'eroe fermo pensa alla guaritrice, e il fumetto prende il tocco
await scegli(page, 'sotterraneo')
await mondoPronto(page)

/* ---------- sopra: salendo non si guarisce, e chi cura chiama ---------- */
await blocco('salito dal portale', async () => {
  uguale('la barra dice la vita di giù', (await vitaInBarra(page, 'sopra')).join('/'), `${c.vita}/${VITA_MAX}`)
  uguale('il gemello sta nel villaggio', await page.locator('[data-portale]').count(), 1)
  await page.waitForSelector('[data-mercante="erborista"] [data-richiamo]', { timeout: 5000 }).catch(() => {})
  uguale('la guaritrice chiama', await page.locator('[data-mercante="erborista"] [data-richiamo]').innerText(), 'Sei ferito. Vieni, ti curo.')
  controlla('l\'incantatrice chiama per l\'energia', /ricarico/.test(await page.locator('[data-mercante="incantatrice"] [data-richiamo]').innerText()))
  uguale('il fabbro e il mercante no', await page.locator('[data-mercante="armaiolo"] [data-richiamo], [data-mercante="rigattiere"] [data-richiamo]').count(), 0)
  await scatto(page, 'cura-richiamo')
})

await blocco('senza torce, la pagina dell\'eroe dice chi le vende', async () => {
  const r = await paginaEroe()
  uguale('ne conta zero', r.n, 0)
  controlla('e dice che le vende il carovaniere', /nessuna torcia/.test(r.testo) && /carovaniere/.test(r.testo), r.testo)
  await chiudi('[data-pagina-eroe]')
})

/* ---------- la guaritrice: «Curami», e la seconda volta «sei già in forze» ---------- */
await blocco('la guaritrice cura', async () => {
  await daChiCura('erborista')
  uguale('mentre si parla il suo fumetto tace', await page.locator('[data-mercante="erborista"] [data-richiamo]').count(), 0)
  await nelDialogo(page)
  uguale('ferito, «Curami» è la prima domanda', await page.locator('[data-scelte] [data-scelta]').first().getAttribute('data-scelta'), 'cura')
  await toccaIl('[data-dialogo] [data-scelta="cura"]')
  await page.waitForSelector('[data-cura-fiocco][data-risorsa="vita"]', { timeout: 3000 }).catch(() => {})
  uguale('«Curami»: il numero che sale', await page.locator('[data-cura-fiocco][data-risorsa="vita"]').count(), 1)
  await scatto(page, 'cura-vita')
  controlla('il numero che sale dice quanti punti', (await page.locator('[data-cura-fiocco]').innerText()).includes(`+${VITA_MAX - c.vita}`))
  uguale('la guaritrice risponde a voce sua', await page.locator('[data-riga][data-cura]').count(), 1)
  await page.waitForFunction(m => /vita (\d+) su/.exec(document.querySelector('[data-barra="sopra"] [data-azione="vita"]').getAttribute('aria-label'))?.[1] === String(m), VITA_MAX, { timeout: 3000 }).catch(() => {})
  uguale('la barra è piena', (await vitaInBarra(page, 'sopra')).join('/'), `${VITA_MAX}/${VITA_MAX}`)
  const s = (await avventura()).sosta || {}
  uguale('la sosta è scritta a vita piena, e l\'energia non è sua', `${s.vita}|${s.energia}`, `${VITA_MAX}|0`)
  await nelDialogo(page)
  uguale('la domanda non torna nello stesso dialogo', await page.locator('[data-scelta="cura"]').count(), 0)
  await toccaIl('[data-dialogo] [data-scelta="ciao"]')
  await page.waitForSelector('[data-dialogo]', { state: 'detached', timeout: 3000 }).catch(() => {})
  uguale('curato, il fumetto se ne va', await page.locator('[data-mercante="erborista"] [data-richiamo]').count(), 0)
  uguale('quello dell\'incantatrice resta, non blocca niente', await page.locator('[data-mercante="incantatrice"] [data-richiamo]').count(), 1)
  await daChiCura('erborista')
  await nelDialogo(page, '[data-scelta="cura"]', { tocca: toccaIl })
  await page.waitForSelector('[data-riga][data-in-forze]', { timeout: 3000 }).catch(() => {})
  controlla('di nuovo: in forze lo dice, senza far finta', (await page.locator('[data-riga][data-in-forze]').innerText()).includes('in forze'))
  uguale('e non ci sono numeri che salgono', await page.locator('[data-cura-fiocco]').count(), 0)
  await nelDialogo(page, '[data-scelta="ciao"]', { tocca: toccaIl })   // le domande tornano cieche per 320 ms
  await page.waitForSelector('[data-dialogo]', { state: 'detached', timeout: 3000 }).catch(() => {})
  uguale('«ciao» chiude il dialogo', await page.locator('[data-dialogo]').count(), 0)
})

/* ---------- l'incantatrice: «Ricaricami» ---------- */
await blocco('l\'incantatrice ricarica', async () => {
  await daChiCura('incantatrice')
  await nelDialogo(page, '[data-scelta="cura"]', { tocca: toccaIl })
  await page.waitForSelector('[data-cura-fiocco][data-risorsa="energia"]', { timeout: 3000 })
  const s = (await avventura()).sosta || {}
  uguale('la sosta è scritta a energia piena, e la vita resta piena', `${s.energia}|${s.vita}`, `${ENERGIA_MAX}|${VITA_MAX}`)
  await nelDialogo(page, '[data-scelta="ciao"]', { tocca: toccaIl })
  await page.waitForSelector('[data-dialogo]', { state: 'detached', timeout: 3000 }).catch(() => {})
  // (senza torce il carovaniere chiama lui: `richiamoTorce`, non è una cura)
  uguale('chi cura non chiama più', await page.locator('[data-richiamo-di="vita"], [data-richiamo-di="energia"]').count(), 0)
})

/* ---------- tre torce dal carovaniere: la pagina dell'eroe e lo zaino di sopra le contano alla cintura ---------- */
await blocco('tre torce dal carovaniere', async () => {
  await alBancoDi(page, 'carovaniere', { tocca, toccaIl })
  // la prima la sceglie e la compra col tasto; poi la casella è già scelta, e un tocco su di lei compra di nuovo. Le comprate le
  // contano le gemme della bottega, che cambiano subito (il profilo si scrive dopo)
  const comprate = async () => (roba.gemme - Number((await page.locator('[data-gemme-bottega]').innerText()).match(/\d+/)[0])) / COSE.torcia.prezzo
  await compraNellaBottega(page, 'torcia', { tocca })
  for (let i = 0; i < 8 && await comprate() < COMPRATE; i++) {
    await toccaIl('[data-bottega] [data-casella-pezzo="torcia"]')
    await page.waitForFunction(([n, g, p]) => (g - Number(document.querySelector('[data-gemme-bottega]').innerText.match(/\d+/)[0])) / p > n,
      [i + 1, roba.gemme, COSE.torcia.prezzo], { timeout: 2000 }).catch(() => {})
  }
  uguale('tre torce comprate', await comprate(), COMPRATE)
  await chiudi('[data-bottega]')
  const dopo = (await avventura()).roba
  uguale('comprate, aspettano alla cintura nella roba dell\'avventura', `${dopo?.torcia}|${dopo?.torce}`, `0|${COMPRATE}`)
  const r = await paginaEroe()
  uguale('la pagina dell\'eroe ne conta tre, tutte alla cintura', `${r.n}|${r.resta}|${r.scorta}`, `${COMPRATE}|0|${COMPRATE}`)
  controlla('e dice che scendendo se ne accende una', /3 torce alla cintura/.test(r.testo) && /scendendo/.test(r.testo), r.testo)
  await scatto(page, 'torce-eroe-sopra')
  await toccaIl('[data-scheda="zaino"]')
  await page.waitForSelector('[data-zaino] [data-torcia-zaino]', { timeout: 5000 })
  uguale('anche lo zaino di sopra le dice', (await riga('[data-torcia-zaino]')).scorta, COMPRATE)
  await chiudi('[data-zaino]')
})

/* ---------- giù dal gemello: nel punto esatto, in forze, con una torcia accesa in mano ---------- */
await blocco('il gemello riporta giù', async () => {
  await sopraVaDa(page, '[data-portale]', 'portale', { tocca, atteso: '[data-fumetto-di="portale"] [data-azione="portale-giu"]' })
  await scatto(page, 'portale-gemello-fumetto')
  await toccaIl('[data-fumetto-di="portale"] [data-azione="portale-giu"]')
  await giuPronto(page)
  uguale('si torna giù nel punto esatto', await cellaGiu(page), DOV_ERA)
  uguale('a vita piena', (await vitaInBarra(page, 'giu')).join('/'), `${VITA_MAX}/${VITA_MAX}`)
  await page.waitForFunction(() => !!(window.__sotterraneo3d.eroe && window.__sotterraneo3d.eroe.mano), null, { timeout: 5000 }).catch(() => {})
  uguale('e la torcia si vede in mano', await page.evaluate(() => !!(window.__sotterraneo3d.eroe && window.__sotterraneo3d.eroe.mano)), true)
  await scatto(page, 'torce-giu-accesa')
  const r = await paginaEroe()
  uguale('la pagina dell\'eroe giù: una accesa e due alla cintura', `${r.n}|${r.resta}|${r.scorta}`, `${COMPRATE}|${STANZE_TORCIA}|${COMPRATE - 1}`)
  controlla('a parole', r.testo.includes(`ancora ${STANZE_TORCIA} stanze`) && r.testo.includes(`${COMPRATE - 1} alla cintura`), r.testo)
  await toccaIl('[data-scheda="zaino"]')
  await page.waitForSelector('[data-zaino] [data-torcia-zaino]', { timeout: 5000 })
  uguale('e lo zaino di giù', (await riga('[data-torcia-zaino]')).resta, STANZE_TORCIA)
  await chiudi('[data-zaino]')
})

/* ---------- giù la pergamena apre un portale: toccato, si sale senza domande, accanto al gemello ---------- */
let dovEro = null
await blocco('la pergamena apre il portale, e si sale', async () => {
  await toccaIl('[data-azione="zaino"]')
  await page.waitForSelector('[data-zaino]', { timeout: 3000 })
  await toccaIl(`[data-tasca][data-cosa="${P}"]`)
  await page.waitForSelector('[data-azione="usa"]', { timeout: 5000 })
  uguale('nello zaino dice cosa fa', (await page.locator('[data-azione="usa"]').innerText()).trim(), 'Apri il portale')
  await toccaIl('[data-azione="usa"]')
  await page.waitForFunction(() => !!window.__sotterraneo3d.corsa.portaleDellaPergamena, null, { timeout: 5000 }).catch(() => {})
  const v = await page.evaluate(() => { const p = window.__sotterraneo3d.corsa.portaleDellaPergamena; return p && { x: p.x, y: p.y } })
  controlla('accanto all\'eroe si è aperto un portale', !!v)
  await page.waitForSelector('[data-zaino]', { state: 'detached', timeout: 3000 }).catch(() => {})
  await fermoGiu(page)
  await attendi(page, 600)   // il varco si accende dal basso
  await scatto(page, 'sotterraneo-pergamena-portale')
  dovEro = await cellaGiu(page)
  const q = await schermoDi(page, v.x + 0.5, v.y + 0.5, 0.6)
  await tocca(q.x, q.y)
  await page.waitForSelector('[data-azione="portale"]', { timeout: 15000 })
  uguale('il portale non chiede niente', await page.locator('.sot-domanda').count(), 0)
  await scatto(page, 'portale-foglio')
  await toccaIl('[data-azione="portale"]')
  await mondoPronto(page)
  uguale('si arriva sopra, senza la discesa in 3D', await page.locator('[data-tela="3d"]').count(), 0)
  const gemello = postiDi(ilMondo(), 'portale').find(q => q.citta === 'villaggio')
  uguale('si sbuca accanto al portale gemello', await page.locator('[data-eroe-mondo]').getAttribute('data-cella'), `${gemello.accanto.x},${gemello.accanto.y}`)
  const a = await avventura()
  uguale('la sosta ricorda che si è saliti dal portale', a.sosta?.via, 'portale')
  uguale('e dov\'era l\'eroe', `${Math.floor(a.sosta?.dove?.x)},${Math.floor(a.sosta?.dove?.y)}`, dovEro)
  uguale('la pergamena è spesa', (a.roba?.zaino || []).filter(k => k === P).length, 0)
  await attendi(page, 300)   // qualche fotogramma di sopra, dove un pittore rimasto agganciato alla discesa si rompeva
  uguale('salendo, nessun errore in console', errori.splice(0).join(' | '), '')
})

/* ---------- uscendo dal villaggio il gemello resta, e l'ingresso della stessa discesa riprende da dove si era ---------- */
await blocco('il gemello resta, e l\'ingresso riprende', async () => {
  await toccaIl('button[aria-label="indietro"]')
  await page.waitForSelector('.carte', { timeout: 5000 })
  await scegli(page, 'sotterraneo')
  await mondoPronto(page)
  uguale('uscendo dal villaggio e rientrando, il gemello c\'è ancora', await page.locator('[data-portale]').count(), 1)
  uguale('in cima niente carta «torno giù»', await page.locator('[data-ripresa]').count(), 0)
  await scendiNelSotterraneo(page, 0, { tocca, scendi: false })
  const k = CAMPAGNA[0].chiave
  uguale('l\'ingresso della stessa discesa dice «riprendo da dove ero»', await page.locator(`[data-fumetto-di="${k}"] [data-azione="scendi"][data-sosta="1"]`).count(), 1)
  await toccaIl(`[data-fumetto-di="${k}"] [data-azione="scendi"]`)
  await giuPronto(page)
  uguale('e non chiede di lasciar perdere niente', await page.locator('[data-chiede]').count(), 0)
  uguale('si riprende nel punto di prima', await cellaGiu(page), dovEro)
})

/* ---------- la ✕ dalla discesa non è un portale: in home, la sosta è un'uscita, e «riprendi da qui» riporta giù ----------
   Senza il mondo di sopra né il gemello, dietro il velo della pausa. Tornando dal mondo di sopra il `v-if` smonta il campo, quindi
   la discesa ripresa trova un altro canvas: un pittore rimasto agganciato al primo dipingeva su una tela staccata (lo schermo nero,
   e nessun errore). Per questo il disegno si riguarda */
await blocco('la ✕ e «riprendi da qui»', async () => {
  await toccaIl('button[aria-label="indietro"]')
  await page.waitForSelector('.carte', { timeout: 5000 })
  uguale('la ✕ dalla discesa porta in home', await page.locator('[data-mondo3d]').count(), 0)
  const s = (await avventura()).sosta
  uguale('la sosta ora è un\'uscita, non un portale', s?.via, 'uscita')
  uguale('e l\'eroe è dove era', `${Math.floor(s?.dove?.x)},${Math.floor(s?.dove?.y)}`, dovEro)
  uguale('in home si riprende il sotterraneo', await page.locator('[data-riprendi]').getAttribute('data-riprendi'), 'sotterraneo')
  controlla('e dice dove', (await page.locator('[data-riprendi]').innerText()).includes(`${CAMPAGNA[0].nome} · piano 1 di`), await page.locator('[data-riprendi]').innerText())
  await scatto(page, 'portale-riprendi-home')
  await toccaIl('[data-riprendi]')
  await page.waitForSelector('[data-pausa]', { timeout: 20000 })
  await page.waitForFunction(() => document.querySelector('[data-tela="3d"]')?.dataset.eroe, null, { timeout: 30000 })   // la tela scrive la cella al primo fotogramma
  uguale('si è già giù, senza il mondo di sopra né il gemello', await page.locator('[data-mondo3d], [data-portale]').count(), 0)
  uguale('nel punto esatto', await cellaGiu(page), dovEro)
  controlla('fermi, dietro il velo della pausa che dice a che piano si è', (await page.locator('[data-pausa]').innerText()).includes('piano 1'))
  await pronto(page, '[data-pausa]')   // il velo è cieco per un attimo (CIECA)
  await toccaIl('[data-pausa] [data-azione="riprendi"]')
  await page.waitForSelector('[data-pausa]', { state: 'detached', timeout: 3000 }).catch(() => {})
  uguale('toccato il velo, la discesa riparte', await page.locator('[data-pausa]').count(), 0)
  await page.waitForFunction(() => { const g = window.__sotterraneo3d && window.__sotterraneo3d.grafica(); return g && !g.entrando && g.chiamate > 10 && g.figure > 0 }, null, { timeout: 20000 }).catch(() => {})
  const g = await page.evaluate(() => { const g = window.__sotterraneo3d.grafica(); return { chiamate: g.chiamate, figure: g.figure } })
  controlla('e la discesa ripresa si vede', g.chiamate > 10 && g.figure > 0, JSON.stringify(g))
  await scatto(page, 'portale-ripresa')
})

uguale('nessun errore in console', errori.join(' · '), '')
nota(`sosta del portale: seme 21, l'eroe in ${DOV_ERA}, vita ${c.vita}/${VITA_MAX}`)
await browser.close()
riassunto('il portale, chi cura, le torce e la ripresa esatta')
