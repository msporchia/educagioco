/* ═══════════════════════════════════════════════════════════════════
   LE AVVENTURE, LE TERRE E GLI AMICI SUL MONDO DI SOPRA, COL DITO
   docs/sotterraneo/avventure.md, terre-successive.md, docs/core/amici-nei-giochi.md

   perché: le quattro avventure (cambio cavaliere-mago e ripresa), la porta alla seconda terra che si ricorda dopo il reload, e il pallino degli amici
   a parte perché: tre semine: un profilo di prima, tombe ripulite, un amico sul servizio che non risponde; le altre sopra-* hanno una semina sola

   Un Chrome, tre semine.
   1. Le quattro avventure: un profilo di prima si azzera aprendo il
      gioco (il record di fuori e le monete restano); un cavaliere con la
      sua roba lascia a metà una discesa e dal velo della pausa passa al
      mago, che comincia dalla piazza a zaino vuoto; tornati al cavaliere
      si riprende giù dov'era, e «riprendi da qui» in home riprende la sua
      discesa, con l'icona del suo posto.
   2. Le terre: con le tombe ripulite la porta in fondo alla landa è
      aperta, il minatore la annuncia, toccandola si passa nella seconda
      terra (e l'avventura lo ricorda anche ricaricando), il minatore
      racconta i volti nuovi, la pietra del villaggio riporta alla prima.
   3. Gli amici (pagina sua: il servizio non risponde e la console lo
      dice): il pallino di chi è arrivato a una discesa accanto al suo
      ingresso, il nome nel fumetto, in cima chi è da raggiungere.
   Le regole sotto (le avventure, le terre, la bacheca degli amici) sono in
   unita/sotterraneo-avventure, sotterraneo-terre e amici-bacheca.
   I tocchi sono tocchi (`Input.dispatchTouchEvent` via CDP).
   `node test/esegui.mjs sotterraneo-sopra-terre`
   tempo: 240
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, seminaAmici, amicoDiProva, scatto, attendi, scegli, leggiProfilo, mondoPronto, ditoDi,
         nelDialogo } from '../aiuto/browser.mjs'
import { entraSopra, avventuraDi, cellaEroe, vaiETocca, toccaSopra, toccaFermo, scendiDa, fermoASchermo, scenaPronta } from '../aiuto/sotterraneo-sopra.mjs'
import { controlla, uguale, riassunto, blocco } from '../aiuto/verifica.mjs'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { ilMondo } from '../../src/giochi/sotterraneo/motore/mondo-sopra.js'
import { CAMPAGNA, QUANTE_TAPPE } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { TERRE } from '../../src/giochi/sotterraneo/dati/mondo-aperto.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
const { tocca } = await ditoDi(page)
const toccaIl = sel => toccaFermo(page, sel, tocca)
const cella = async () => (await cellaEroe(page)).join(',')
// aspetta che il profilo salvato dica quello che `vale` vuole (il gioco scrive un attimo dopo, e a volte dopo aver chiuso una scena)
async function profiloQuando(vale, entro = 6000) {
  const fine = Date.now() + entro
  let p = await leggiProfilo(page)
  while (!vale(p) && Date.now() < fine) { await attendi(page, 200); p = await leggiProfilo(page) }
  return p
}

/* ══════════ 1. le quattro avventure ══════════ */
const roba = { v: 1, gemme: 60, zaino: ['pozione'], mano: 'spada', mancina: null, corpo: 'corazza', dito: null, torcia: 0, torce: 0 }
const gemme = async () => Number(await page.locator('[data-gemme-barra]').getAttribute('data-n'))
// chi scende lo dice la pagina dell'eroe (si apre dal globo): sulla mappa non c'è più la carta
async function chiScende() {
  await toccaIl('[data-azione="eroe-pagina"]')
  await page.waitForSelector('[data-pagina-eroe]', { timeout: 3000 })
  const chi = await page.locator('[data-pagina-eroe] .sot-eroe-nome b').innerText()
  await toccaIl('[data-pagina-eroe] [data-chiudi]')
  await page.waitForSelector('[data-pagina-eroe]', { state: 'detached', timeout: 3000 })
  return chi
}
// l'eroe si porta davanti al rigattiere del villaggio (il salto delle prove): non è la piazza da cui si parte
async function unPasso() {
  const prima = await cella()
  await page.evaluate(() => window.__mondo3d.vai('mercante:villaggio:rigattiere'))
  await page.waitForFunction(c => document.querySelector('[data-eroe-mondo]')?.dataset.cella !== c, prima, { timeout: 5000 }).catch(() => {})
}
async function scegliCol(eroe) {
  await toccaIl(`.sot-eroe[data-eroe="${eroe}"]`)
  await page.waitForSelector('.sot-eroe[data-eroe]', { state: 'detached', timeout: 3000 })
  await mondoPronto(page)
}

await blocco('un profilo di prima si azzera', async () => {
  await azzera(page)
  // un profilo di prima: la roba in cfg (una sola per tutti), il pozzo a metà, la nebbia già tolta
  await semina(page, { coins: 300, settings: { sperimentali: true },
    campagne: { sotterraneo: { tappa: 1, libera: false, stelle: { 0: 3 }, sosta: { v: 3, tappa: 1, robe: [] },
      cfg: { eroe: 'cavaliere', roba, terra: { nebbia: 'f'.repeat(384), dove: [17, 41], parlato: true } } } } })
  await scegli(page, 'sotterraneo')
  await mondoPronto(page)
  const p = await profiloQuando(p => p?.campagne?.sotterraneo?.cfg?.mondo === MONDO)
  const sot = p?.campagne?.sotterraneo
  uguale('aprendo il gioco il profilo di prima si azzera', sot?.cfg?.mondo, MONDO)
  uguale('la roba di prima non c\'è più', sot?.cfg?.roba, undefined)
  uguale('e nemmeno la discesa a metà', sot?.sosta, undefined)
  uguale('il record di fuori resta: una discesa', sot?.tappa, 1)
  uguale('con le sue stelle', sot?.stelle?.[0], 3)
  uguale('le monete restano', p?.coins, 300)
  controlla('si riparte col cavaliere, l\'eroe di prima', /Cavaliere|Guerriera/.test(await chiScende()))
  uguale('senza gemme', await gemme(), 0)
  await scatto(page, 'avventure-azzerata')
})

let doveCav = null, tGiu = 0
await blocco('il cavaliere lascia a metà una discesa', async () => {
  await toccaIl('button[aria-label="indietro"]')
  await page.waitForSelector('.carte', { timeout: 5000 })
  await semina(page, { campagne: { sotterraneo: { tappa: 1, libera: false, stelle: { 0: 3 },
    cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: { tappa: 1, libera: false, stelle: { 0: 3 }, missioni: {}, roba, mondo: { parlato: true } } } } } } })
  await scegli(page, 'sotterraneo')
  await mondoPronto(page)
  await page.evaluate(() => window.__mondo3d.senzaMostri())
  controlla('la pagina dell\'eroe è del cavaliere', /Cavaliere|Guerriera/.test(await chiScende()))
  uguale('e sul mondo non c\'è la carta di chi scende né il «cambio»', await page.locator('[data-chi-sopra], [data-azione="eroe"]').count(), 0)
  uguale('con le sue gemme', await gemme(), 60)
  const casa = await cella()
  await unPasso()
  controlla('il cavaliere si sposta', (await cella()) !== casa, await cella())
  await scendiDa(page, CAMPAGNA[1].chiave, tocca, { scendi: false })   // davanti all'ingresso, col fumetto aperto
  doveCav = await cella()   // dove il mondo lo ricorderà: davanti all'ingresso da cui scende
  await toccaIl('[data-fumetto-di] [data-azione="scendi"]')
  await page.waitForSelector('[data-tela="3d"]', { timeout: 30000 })
  tGiu = Date.now()
  // da dentro la discesa: ⏸, «scelgo un altro eroe» (la discesa si salva com'è, come un'uscita)
  await page.waitForSelector('button[aria-label="pausa"]', { timeout: 15000 })
  await page.click('button[aria-label="pausa"]')
  await page.waitForSelector('[data-pausa] [data-azione="eroe-giu"]', { timeout: 3000 })
  await attendi(page, 400)   // il velo è cieco per un attimo (CIECA)
  await page.click('[data-azione="eroe-giu"]')
  await page.waitForSelector('.sot-eroe[data-eroe]', { timeout: 3000 })
  const p = await profiloQuando(p => p?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.sosta)
  uguale('la discesa resta a metà, col cavaliere, lasciata con un\'uscita', p?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.sosta?.via, 'uscita')
})

await blocco('le quattro schede', async () => {
  uguale('quattro schede', await page.locator('.sot-eroe[data-eroe]').count(), 4)
  const schedaCav = await page.locator('.sot-eroe[data-eroe="cavaliere"]').innerText()
  uguale('quella del cavaliere è cominciata', await page.locator('.sot-eroe[data-eroe="cavaliere"]').getAttribute('data-nuova'), '0')
  controlla('e dice a che punto è: discese, stelle, gemme', schedaCav.includes('1 di 7') && schedaCav.includes('⭐ 3') && schedaCav.includes('💎 60'), schedaCav)
  uguale('la roba principale addosso', await page.locator('.sot-eroe[data-eroe="cavaliere"] [data-addosso="spada"]').count(), 1)
  controlla('e la discesa a metà', schedaCav.includes('a metà: le cantine dei goblin'), schedaCav)
  uguale('con l\'icona del suo posto, non un\'emoji', await page.locator('.sot-eroe[data-eroe="cavaliere"] [data-a-meta] [data-ritaglio]').count(), 1)
  // la spada (braccio 2) e la corazza (difesa 2) sopra i 18 · 3 · 1 di base; innerText mette un a capo fra icona e numero
  const compatto = t => t.replace(/\s+/g, ' ')
  controlla('i numeri sono quelli con la roba: ❤️ 18 · ⚔️ 5 · 🛡️ 3', compatto(schedaCav).includes('❤️ 18 ⚔️ 5 🛡️ 3') && !compatto(schedaCav).includes('⚔️ 3 '), compatto(schedaCav))
  uguale('la spada è in mano al ritratto', await page.locator('.sot-eroe[data-eroe="cavaliere"] .sot-armato [data-in-mano="spada"]').count(), 1)
  uguale('la corazza è accanto, in iconcina', await page.locator('.sot-eroe[data-eroe="cavaliere"] [data-addosso="corazza"]').count(), 1)
  controlla('l\'elfa nuova ha i numeri di base e le mani vuote',
            compatto(await page.locator('.sot-eroe[data-eroe="elfa"]').innerText()).includes('❤️ 15 ⚔️ 4 🛡️ 1')
            && await page.locator('.sot-eroe[data-eroe="elfa"] [data-in-mano]').count() === 0)
  for (const e of ['elfa', 'mago', 'nano']) uguale(`${e}: nuova avventura`, await page.locator(`.sot-eroe[data-eroe="${e}"]`).getAttribute('data-nuova'), '1')
  await scatto(page, 'avventure-scelta')
})

let doveMago = null
await blocco('il mago comincia da capo', async () => {
  await scegliCol('mago')
  controlla('la pagina dell\'eroe è del mago', /Mag[oa]/.test(await chiScende()))
  // un eroe nuovo comincia dalla partenza del villaggio, non da dove stava l'altro
  uguale('dalla partenza del villaggio', await cella(), `${ilMondo().partenza.x},${ilMondo().partenza.y}`)
  uguale('con lo zaino vuoto', await gemme(), 0)
  await scatto(page, 'avventure-mago-mondo')
  await unPasso()
  doveMago = await cella()
})

await blocco('si torna al cavaliere, e si riprende giù', async () => {
  // «Cambia eroe» sta in fondo alla pagina dell'eroe: la pagina si chiude e si apre la scelta
  await toccaIl('[data-azione="eroe-pagina"]')
  await toccaIl('[data-pagina-eroe] [data-azione="eroe"]')
  await page.waitForSelector('[data-pagina-eroe]', { state: 'detached', timeout: 3000 })
  await page.waitForSelector('.sot-eroe[data-eroe]', { timeout: 3000 })
  uguale('la scelta segna il mago', await page.locator('.sot-eroe.sot-scelto[data-eroe="mago"]').count(), 1)
  await toccaIl('.sot-eroe[data-eroe="cavaliere"]')
  await page.waitForSelector('[data-tela="3d"]', { timeout: 30000 })
  tGiu = Date.now()
  uguale('scegliere il cavaliere riprende la sua discesa, senza il mondo di sopra', await page.locator('[data-mondo3d]').count(), 0)
  controlla('nel pozzo, a metà', (await page.locator('.sot-piede').innerText()).includes('piano 1'))
  await page.waitForSelector('[data-pausa]', { timeout: 3000 })
  const p = await profiloQuando(p => { const a = p?.campagne?.sotterraneo?.cfg?.avventure; return a?.mago?.mondo?.dove && a?.cavaliere?.mondo?.dove && p.campagne.sotterraneo.cfg.eroe === 'cavaliere' })
  const av = p?.campagne?.sotterraneo?.cfg?.avventure || {}
  const cellaDi = d => d && d.x != null ? `${d.x},${d.y}` : ''
  uguale('il mondo del cavaliere è dov\'era rimasto', cellaDi(av.cavaliere?.mondo?.dove), doveCav.replace(/\b0+(\d)/g, '$1'))
  // almeno le sue 60: ripresa la discesa, l'eroe può raccogliere una gemma prima che il profilo si legga
  controlla('e le sue gemme', av.cavaliere?.roba?.gemme >= 60, av.cavaliere?.roba?.gemme)
  uguale('nel profilo il mago ha il suo mondo', cellaDi(av.mago?.mondo?.dove), doveMago.replace(/\b0+(\d)/g, '$1'))
  controlla('e non ha la roba del cavaliere', !av.mago?.roba?.mano && !(av.mago?.roba?.gemme > 0), JSON.stringify(av.mago?.roba))
  uguale('il cavaliere ha la sua sosta', av.cavaliere?.sosta?.tappa, 1)
  uguale('l\'avventura aperta è del cavaliere', p?.campagne?.sotterraneo?.cfg?.eroe, 'cavaliere')
})

await blocco('«riprendi da qui» in home', async () => {
  // sotto i cinque secondi non è una partita (store/sessioni.js): la home non la offrirebbe
  await attendi(page, Math.max(0, 5200 - (Date.now() - tGiu)))
  await toccaIl('[data-pausa] [data-azione="esci"]')   // il velo copre anche la ✕: da lì si esce senza ripartire
  await page.waitForSelector('.carte', { timeout: 5000 })
  uguale('in home si riprende il sotterraneo', await page.locator('[data-riprendi]').getAttribute('data-riprendi'), 'sotterraneo')
  controlla('e dice la discesa a metà', (await page.locator('[data-riprendi]').innerText()).includes('cantine dei goblin'), await page.locator('[data-riprendi]').innerText())
  uguale('con il pozzo ritagliato dalla mappa al posto della copertina', await page.locator('[data-riprendi] [data-ritaglio]').count(), 1)
  await scatto(page, 'avventure-riprendi-home')
  await toccaIl('[data-riprendi]')
  await page.waitForSelector('[data-tela="3d"]', { timeout: 30000 })
  controlla('e si torna giù nel pozzo, col cavaliere', (await page.locator('.sot-piede').innerText()).includes('piano 1'))
  await page.waitForSelector('[data-pausa] [data-azione="riprendi"]', { timeout: 5000 })
  await attendi(page, 400)   // il velo è cieco per un attimo (CIECA)
  await toccaIl('[data-pausa] [data-azione="riprendi"]')
  await page.waitForSelector('[data-pausa]', { state: 'detached', timeout: 3000 })
  await page.locator('[data-azione="zaino"]').click()
  await page.waitForSelector('[data-zaino]', { timeout: 3000 })
  uguale('con la sua pozione in tasca', await page.locator('[data-tasca][data-cosa="pozione"]').count(), 1)
})

/* ══════════ 2. le terre successive ══════════ */
const EROE = 'cavaliere'
const avventura = () => avventuraDi(page, EROE)
const nuovaTerraDetta = nome => page.waitForFunction(v => [...document.querySelectorAll('[data-avviso-terra]')].some(e => e.textContent.includes(v)), nome, { timeout: 30000 }).then(() => true, () => false)
const minatoreInVista = () => page.waitForSelector('[data-minatore][data-vis="1"]', { state: 'attached', timeout: 10000 }).then(() => true, () => false)
const ciao = async () => {
  await nelDialogo(page, '[data-scelta="ciao"]', { tocca: toccaIl })
  await page.waitForSelector('[data-dialogo]', { state: 'detached', timeout: 10000 })
}

await blocco('nella prima terra, la porta aperta', async () => {
  // la storia finita e le tombe ripulite nella prima terra; il minatore conosciuto (parla subito della porta)
  const terraRoba = { v: 1, gemme: 0, zaino: [], mano: 'spada', mancina: 'scudo-ferro', corpo: 'corazza', dito: null, torcia: 0, torce: 0 }
  const a = { tappa: 7, libera: true, stelle: { 0: 3 }, missioni: {}, roba: terraRoba, mondo: { parlato: true, dungeon: { tombe: { rifatti: 1 } } } }
  await entraSopra(page, { coins: 300, settings: { sperimentali: true },
    campagne: { sotterraneo: { tappa: 7, libera: true, stelle: { 0: 3 }, cfg: { mondo: MONDO, eroe: EROE, avventure: { [EROE]: a } } } } })
  uguale('si comincia nella prima terra', await page.locator('[data-mondo3d]').getAttribute('data-terra-ora'), '1')
  uguale('la porta delle terre è aperta', await page.locator('[data-bersaglio][data-terre]').getAttribute('data-terre'), '1')
  await vaiETocca(page, '[data-minatore]', 'minatore', tocca, { atteso: '[data-dialogo-testo]' })
  const detto = await page.locator('[data-dialogo-testo]').innerText()
  controlla('il minatore dice la porta, per prima cosa', /porta di pietra/.test(detto), detto)
  await scatto(page, 'sotterraneo-terre-minatore')
  await ciao()
})

await blocco('la porta, toccata col dito: nella seconda terra', async () => {
  await vaiETocca(page, '[data-bersaglio][data-terre]', 'terre:porta-delle-terre', tocca, { atteso: '[data-azione="passa-terra"]' })
  const aperta = await page.waitForSelector('[data-terre-dice][data-aperta="1"]', { timeout: 5000 }).then(() => true, () => false)
  controlla('toccata, la porta dice che è aperta e si può passare', aperta)
  await scatto(page, 'sotterraneo-terre-porta')
  await toccaIl('[data-azione="passa-terra"]')
  await page.waitForSelector('[data-mondo3d][data-terra-ora="2"]', { timeout: 30000 })
  const benvenuto = await nuovaTerraDetta(TERRE[1].villaggio)   // appena nata la scena la riga dice dove si è arrivati (un paio di secondi)
  await mondoPronto(page)
  const av = await avventura()
  uguale('l\'avventura ricorda la seconda terra', av.terraOra, 2)
  uguale('la prima terra resta com\'era: le tombe ripulite', av.mondo?.dungeon?.tombe?.rifatti, 1)
  uguale('il primato della terra raggiunta', (await leggiProfilo(page)).best?.sotTerra, 2)
  uguale('il mondo è quello della seconda terra', await page.evaluate(() => window.__mondo3d.m.terra), 2)
  uguale('di qua la porta è chiusa: le tombe di questa terra non sono ripulite', await page.locator('[data-bersaglio][data-terre]').getAttribute('data-terre'), '0')
  controlla('si riparte dal villaggio', await minatoreInVista())
  controlla('arrivando, il nome della terra nuova e del suo villaggio', benvenuto)
  await scatto(page, 'sotterraneo-terre-seconda')
})

await blocco('uscendo si salva, e ricaricando si resta lì', async () => {
  await page.click('button[aria-label="indietro"]')
  await page.waitForSelector('.carte', { timeout: 15000 })
  const p = await profiloQuando(p => p?.campagne?.sotterraneo?.cfg?.avventure?.[EROE]?.mondi?.[2]?.firma)
  const av = p?.campagne?.sotterraneo?.cfg?.avventure?.[EROE] || {}
  controlla('il mondo della seconda si salva in `mondi`', !!(av.mondi && av.mondi[2] && av.mondi[2].firma), JSON.stringify(Object.keys(av.mondi || {})))
  uguale('e la prima non si tocca', av.mondo?.dungeon?.tombe?.rifatti, 1)
  await page.reload()
  await page.waitForSelector('.carte', { timeout: 15000 })
  await scegli(page, 'sotterraneo')
  await mondoPronto(page)
  await page.evaluate(() => window.__mondo3d.senzaMostri())
  uguale('ricaricando, ancora la seconda terra', await page.locator('[data-mondo3d]').getAttribute('data-terra-ora'), '2')
  // nella seconda il minatore non si presenta: racconta i volti nuovi delle discese
  await vaiETocca(page, '[data-minatore]', 'minatore', tocca, { atteso: '[data-dialogo-testo]' })
  const t = await page.locator('[data-dialogo-testo]').innerText()
  controlla('il minatore dice che le discese hanno un\'altra faccia', /un'altra faccia/.test(t), t)
  await scatto(page, 'sotterraneo-terre-volti')
  await ciao()
})

await blocco('la pietra del villaggio riporta alla prima terra', async () => {
  await vaiETocca(page, '[data-pietra="villaggio"]', 'pietra:villaggio', tocca, { atteso: '[data-pietra-domanda] .qz-tasto' })
  await attendi(page, 400)   // i 320 ms ciechi della domanda appena nata (CIECA, quiz/Domanda.vue)
  await page.locator('[data-pietra-domanda] .qz-tasto[data-giusta]').first().click()
  await page.waitForSelector('[data-pietra="villaggio"][data-accesa="1"]', { timeout: 8000 })
  await page.waitForSelector('[data-fumetto-di="pietra"] [data-azione="torna-terra"]', { timeout: 10000 })
  uguale('la pietra offre la prima terra, e nessun\'altra', await page.locator('[data-azione="torna-terra"]').evaluateAll(l => l.map(e => e.dataset.terra).join()), '1')
  uguale('e non dice «nessuna meta»', await page.locator('[data-fumetto-di="pietra"] [data-nessuna-meta]').count(), 0)
  await scatto(page, 'sotterraneo-terre-pietra')
  await toccaIl('[data-azione="torna-terra"][data-terra="1"]')
  await page.waitForSelector('[data-mondo3d][data-terra-ora="1"]', { timeout: 30000 })
  const aCasa = await nuovaTerraDetta(TERRE[0].villaggio)
  await mondoPronto(page)
  controlla('tornati, il nome della terra di casa', aCasa)
  uguale('il mondo è quello della prima terra', await page.evaluate(() => window.__mondo3d.m.terra), 1)
  uguale('la porta di qui è aperta come prima', await page.locator('[data-bersaglio][data-terre]').getAttribute('data-terre'), '1')
  controlla('si arriva nella piazza, non alla porta', await minatoreInVista())
  const av = await avventura()
  uguale('l\'avventura dice la prima terra', av.terraOra, 1)
  uguale('le tombe della prima restano ripulite', av.mondo?.dungeon?.tombe?.rifatti, 1)
  controlla('la seconda resta salvata con la pietra accesa', (av.mondi?.[2]?.pietre || []).includes('villaggio'))
  uguale('il primato resta la seconda', (await leggiProfilo(page)).best?.sotTerra, 2)
  await scatto(page, 'sotterraneo-terre-ritorno')
})

uguale('nessun errore in console (avventure e terre)', errori.join(' | '), '')
await page.close()

/* ══════════ 3. gli amici: i pallini agli ingressi, il nome nel fumetto, chi è da raggiungere ══════════ */
{
  const { page: pa, errori: err } = await apriGioco(browser)
  await pa.addInitScript(() => { globalThis.__SERVIZIO_SFIDE__ = 'http://127.0.0.1:9' })
  const dito = (await ditoDi(pa)).tocca
  const veri = () => err.filter(e => !/WebSocket connection|Failed to load resource|net::ERR|ERR_/.test(e))
  const amico = (lettera, id, nome, fa, tappa) => amicoDiProva(lettera, id, nome, { fa, giochi: { sotterraneo: { posti: tappa ? { '': tappa } : {}, primati: {} } } })
  const testo = sel => pa.locator(sel).first().textContent().then(t => t.replace(/\s+/g, ' ').trim())
  const stelle = n => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 3]))
  async function alMondo(tappa, libera, amici) {
    await azzera(pa)
    await semina(pa, { coins: 300, campagne: { sotterraneo: { tappa, libera, stelle: stelle(tappa),
      cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: { tappa, libera, stelle: stelle(tappa), missioni: {} } } } } } })
    await seminaAmici(pa, amici)
    await scegli(pa, 'sotterraneo')
    await mondoPronto(pa)
    await pa.evaluate(() => window.__mondo3d.senzaMostri())   // qui non si combatte: un mostro che attacca toglie i bersagli dallo schermo
  }
  const chiaveDi = al => (al === QUANTE_TAPPE ? 'abisso' : CAMPAGNA[al].chiave)
  const pallini = al => pa.locator(`[data-amici-posto][data-al="${al}"] [data-pallino-amico]`).count()
  // l'eroe salta davanti all'ingresso (che ne carica la zona e lo scopre) e la scena lo mette a schermo, fermo
  async function davantiA(al) {
    const k = chiaveDi(al)
    await pa.evaluate(c => window.__mondo3d.vai('ingresso:' + c), k)
    await scenaPronta(pa)
    await pa.waitForSelector(`[data-posto="${k}"][data-vis="1"]`, { timeout: 30000 })
    await fermoASchermo(pa, `[data-posto="${k}"]`)
    return k
  }
  // i pallini stanno accanto all'ingresso, in basso a destra del suo rettangolo (non sotto, dove sta l'eroe), e si vedono
  async function aiPiedi(al) {
    const k = await davantiA(al)
    const d = await pa.locator(`[data-amici-posto][data-al="${al}"]`).boundingBox(), p = await pa.locator(`[data-posto="${k}"]`).boundingBox()
    controlla(`i pallini della discesa ${al} stanno accanto al suo ingresso, in basso a destra`,
      !!d && !!p && d.x >= p.x + p.width - 1 && d.x < p.x + p.width + 12 && Math.abs(d.y + d.height - (p.y + p.height)) < 3, JSON.stringify({ d, p }))
    controlla(`e si vedono (l'ingresso ${k} è trovato)`, await pa.locator(`[data-amici-posto][data-al="${al}"]`).isVisible())
  }
  // il fumetto dell'ingresso, aperto toccandolo (aperto o chiuso che sia: il nome degli amici c'è comunque)
  async function apriIlFumetto(al) {
    const k = await davantiA(al)
    await toccaSopra(pa, `[data-posto="${k}"]`, dito)
    await pa.waitForSelector(`[data-fumetto-di="${k}"]`, { timeout: 30000 })
  }

  await blocco('amici a metà delle discese', async () => {
    await alMondo(2, false, [
      amico('a', 'lorenzo01', 'Lorenzo', 0, 4),
      amico('b', 'marta0001', 'Marta', 3, 1),
      amico('d', 'ugo000001', 'Ugo', 1, 4),
      amico('e', 'dario0001', 'Dario', 2, QUANTE_TAPPE),
      amico('c', null, '', 0, 3),                               // mai incontrato online: senza nome non si vede
    ])
    uguale('in cima chi è da raggiungere', await testo('[data-amico-davanti]'), 'Lorenzo è 2 tappe più avanti di te.')
    uguale('la riga in cima sta fuori dal mondo, con le carte di sopra', await pa.locator('.sot-terra-sopra [data-amico-davanti]').count(), 1)
    uguale('sulla discesa 4 due pallini', await pallini(4), 2)
    uguale('sulla discesa che si è già fatta, Marta', await pallini(1), 1)
    uguale('sull\'abisso, Dario', await pallini(QUANTE_TAPPE), 1)
    uguale('quattro pallini in tutto, non quello senza nome', await pa.locator('[data-amici-posto] [data-pallino-amico]').count(), 4)
    uguale('le altre discese non ne hanno', await pa.locator('[data-amici-posto]').count(), 3)
    uguale('i pallini stanno dentro il bersaglio del loro ingresso', await pa.locator(`[data-posto="${chiaveDi(4)}"] [data-amici-posto][data-al="4"]`).count(), 1)
    uguale('nessun record: il gioco non ha una sfida senza fine', await pa.locator('[data-record-amico], [data-record-amici]').count(), 0)
    await aiPiedi(1)
    await scatto(pa, 'amici-sotterraneo-mondo')
    await apriIlFumetto(1)
    uguale('nel fumetto della discesa, il nome', await testo('[data-fumetto] [data-amici-qui][data-al="1"]'), 'MMarta è qui')
    await apriIlFumetto(4)
    uguale('anche su una discesa ancora chiusa', await testo('[data-fumetto] [data-amici-qui][data-al="4"]'), 'LULorenzo e Ugo sono qui')
    await apriIlFumetto(0)
    uguale('un ingresso senza amici non ha la riga', await pa.locator('[data-fumetto] [data-amici-qui]').count(), 0)
  })

  await blocco('amici, finite le sette discese: l\'abisso', async () => {
    await alMondo(QUANTE_TAPPE, true, [amico('a', 'lorenzo01', 'Lorenzo', 0, QUANTE_TAPPE), amico('b', 'marta0001', 'Marta', 1, QUANTE_TAPPE - 1)])
    uguale('nessuno è più avanti di chi ha finito', await pa.locator('[data-amico-davanti]').count(), 0)
    uguale('Marta è sulla sua discesa', await pallini(QUANTE_TAPPE - 1), 1)
    uguale('Lorenzo è sull\'abisso', await pallini(QUANTE_TAPPE), 1)
    await aiPiedi(QUANTE_TAPPE)
    await apriIlFumetto(QUANTE_TAPPE)
    uguale('nel fumetto dell\'abisso, il nome', await testo(`[data-fumetto] [data-amici-qui][data-al="${QUANTE_TAPPE}"]`), 'LLorenzo è qui')
    await scatto(pa, 'amici-sotterraneo-abisso')
  })

  await blocco('amici: uno è già all\'abisso, e chi guarda no', async () => {
    await alMondo(2, false, [amico('a', 'lorenzo01', 'Lorenzo', 0, QUANTE_TAPPE)])
    uguale('in cima chi è all\'abisso', await testo('[data-amico-davanti]'), 'Lorenzo è già all\'abisso.')
  })
  controlla('nessun errore con gli amici, anche col servizio irraggiungibile', veri().length === 0, veri().join(' | '))
}

await browser.close()
riassunto('le avventure, le terre e gli amici sul mondo di sopra')
