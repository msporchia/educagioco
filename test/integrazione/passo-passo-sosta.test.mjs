/* Passo passo lasciato a metà, nel browser. Un livello: si esce con ←, si
   rientra e la fila è lì, coi gradini del 💡 già pagati (la carta comprata
   si riaccende gratis), anche dopo aver ricaricato la pagina; vinto, il
   livello non la tiene più, e uscire mentre il coniglio entra nella tana
   non butta la tappa. Il sentiero senza fine: la mappa offre in cima
   «torno da dove ero», uscire non chiude la serie, un sentiero nuovo
   chiede prima e «lascio perdere» scrive il record; i due sentieri, del
   coniglio e del cane, hanno un record e una sosta ciascuno.
   Vedi docs/passo-passo/sosta.md e docs/passo-passo/sentiero.md.
   perché: Passo passo lasciato a metà: un livello (fila e gradini del 💡 già pagati, anche dopo la ricarica; l'uscita mentre il coniglio entra nella tana) e i sentieri senza fine («torno da dove ero», il record scritto con «lascio perdere», un record e una sosta per sentiero)
   a parte perché: la sosta si prova uscendo e rientrando dalla mappa e ricaricando la pagina, cosa che passo-passo (che apre le tappe dall'indirizzo) non fa mai; come le altre soste (pozioni-sosta, prima-dopo-sosta, lingue-sosta)
   `node test/esegui.mjs integrazione/passo-passo-sosta --niente-build` */
import { apriBrowser, apriGioco, semina, attendi, leggiProfilo, scatto, scegli, giocaSullIsola, statoSullIsola }
  from '../aiuto/browser.mjs'
import { pronto } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto, blocco } from '../aiuto/verifica.mjs'
import { CAMPAGNA, FILA_ATTUALE } from '../../src/giochi/passo-passo/dati/campagna.js'
import { Livello } from '../../src/giochi/passo-passo/motore/livello.js'
import { risolvi } from '../../src/giochi/passo-passo/motore/risolutore.js'
import { VERSIONE } from '../../src/giochi/passo-passo/motore/sosta.js'
import { chiudiIlTraguardo } from '../aiuto/passo-passo.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)

const tasto = m => m.startsWith('salto-') ? `[data-salto="${m.slice(6)}"]` : `[data-freccia="${m}"]`
const componi = async mosse => { for (const m of mosse) await page.locator(tasto(m)).click() }
// dalla home: un profilo seminato con tappe fatte festeggia il traguardo, e il suo velo copre la carta del gioco
async function allaMappaDelGioco() {
  await chiudiIlTraguardo(page)
  await scegli(page, 'passo')
  await page.waitForSelector('.pp-mappa', { timeout: 5000 })
}
// la finestra cieca dei 320 ms non ha un segno a schermo (docs/core/interfaccia.md): si aspetta a tempo
async function entraNellaTappa(i) {
  await giocaSullIsola(page, i)
  await page.waitForSelector('.pp-campo', { timeout: 5000 })
  await pronto(page, '.pp')   // la finestra cieca
}
async function indietro(attesa = '.pp-mappa') {
  await page.locator('button[aria-label="indietro"]').click()
  await page.waitForSelector(attesa, { timeout: 5000 })
}
const tessere = () => page.locator('[data-tessera]').count()
const monete = async () => (await leggiProfilo(page)).coins
const passo = async () => ((await leggiProfilo(page)).campagne || {}).passo || {}
// ⌫ fino in fondo: col cursore in testa, prima lo si porta in coda
async function svuota() {
  for (let k = 0; k < 20 && await tessere(); k++) {
    const c = page.locator('[data-azione="cancella"]')
    if (await c.isDisabled()) await page.locator('[data-tessera]').last().click()
    else await c.click()
    await attendi(page, 60)
  }
}
const suggerimento = async () => { await page.locator('[data-azione="suggerimento"]').click(); await attendi(page, 200) }
const titolo = () => page.locator('.barra-app .dove').innerText()

/* ══════════ 1. un livello: la fila e gli aiuti restano ══════════ */
await blocco('la fila di un livello', async () => {
  await semina(page, { settings: { eta: 6 }, coins: 500, campagne: { passo: { tappa: 2, stelle: { 0: 4, 1: 1 }, cfg: {} } } })
  await allaMappaDelGioco()
  const cespuglio = CAMPAGNA[1]
  await entraNellaTappa(1)
  await componi(['su', 'destra'])
  const m0 = await monete()
  await suggerimento(); await suggerimento(); await suggerimento()
  controlla('la prova parte da una fila scritta e una carta del 💡 comprata',
            await tessere() === 2 && await monete() === m0 - 10 && await page.locator('.pp-brilla').count() === 1)

  await indietro()
  controlla('sulla mappa il livello lasciato a metà ha la matita',
            await page.locator(`[data-mappa] [data-tappa="1"] [data-a-meta]`).count() === 1)
  uguale('e la carta in cima non c\'è: la fila si ritrova entrando', await page.locator('[data-ripresa]').count(), 0)
  {
    const s = (await passo()).sosta
    controlla('la fila sta nella sosta, sotto la chiave del livello',
              s && s.v === VERSIONE && s.livelli[cespuglio.chiave] && s.livelli[cespuglio.chiave].presi === 3, JSON.stringify(s))
  }
  await scatto(page, 'passo-sosta-mappa')

  await entraNellaTappa(1)
  uguale('rientrando la fila è quella', await tessere(), 2)
  await suggerimento()
  controlla('il 💡 rimette la carta già comprata', await page.locator('.pp-brilla').count() === 1)
  uguale('senza farla ripagare', await monete(), m0 - 10)
  await page.locator('[data-consiglio]').click()
  await attendi(page, 100)
  await suggerimento()
  uguale('messa la carta, il prossimo gradino è quello dopo, non di nuovo il primo', await monete(), m0 - 20)

  /* la pagina che sparisce: si ricarica e la fila c'è ancora */
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')))
  await attendi(page, 500)
  await page.reload()
  await page.waitForSelector('.carte')
  await allaMappaDelGioco()
  await entraNellaTappa(1)
  uguale('anche dopo aver ricaricato la pagina', await tessere(), 3)
  uguale('e i gradini scesi restano scesi', (await passo()).sosta.livelli[cespuglio.chiave].presi, 4)

  /* vinto, il livello non tiene più la fila: rigiocarlo è una partita nuova */
  await svuota()
  await componi(risolvi(Livello.da(cespuglio)))
  await page.locator('[data-azione="via"]').click()
  await page.waitForSelector('[data-fine="tappa"]', { timeout: 12000 })
  uguale('vinto, la sosta non tiene più quel livello', ((await passo()).sosta || { livelli: {} }).livelli[cespuglio.chiave], undefined)
  // i tasti del cartello restano spenti per la sua finestra cieca: il click aspetta che si accendano
  await page.locator('[data-azione="rigioca"]').click()
  await page.waitForSelector('.pp-campo')
  await pronto(page, '.pp')   // la finestra cieca
  uguale('e rigiocato riparte vuoto', await tessere(), 0)

  /* uscire mentre il coniglio entra nella tana non butta la tappa: la prima, a profilo nuovo */
  await semina(page, { settings: { eta: 6 }, campagne: {} })
  await allaMappaDelGioco()
  await entraNellaTappa(0)
  await componi(risolvi(Livello.da(CAMPAGNA[0])))
  await page.locator('[data-azione="via"]').click()
  await attendi(page, 1500)             // tre passi, e il coniglio sta entrando nella tana
  await scatto(page, 'passo-esce')
  await indietro()
  const c = ((await leggiProfilo(page)).campagne || {}).passo
  controlla('uscendo mentre entra nella tana, la tappa resta vinta', c && c.tappa === 1, JSON.stringify(c))
})

/* ══════════ 2. il sentiero senza fine ══════════ */
await blocco('il sentiero lasciato a metà', async () => {
  const sentieroLasciato = { seme: 4242, sentieri: 2, serie: 2, prima: 'prato', chiusa: null, posto: null, fila: null }
  await semina(page, { settings: { eta: 8 }, coins: 500,
                       campagne: { passo: { tappa: CAMPAGNA.length, libera: true, stelle: {}, cfg: {},
                                            sosta: { v: VERSIONE, livelli: {}, sentiero: sentieroLasciato } } } })
  await allaMappaDelGioco()
  await page.waitForSelector('[data-ripresa]')
  {
    const testo = await page.locator('[data-ripresa]').textContent()
    controlla('la carta in cima dice a che sentiero si era, e la serie', /sentiero 3/.test(testo) && /2 di fila/.test(testo), testo)
  }
  await scatto(page, 'passo-sosta-ripresa')
  await page.click('[data-ripresa] [data-azione="riprendi"]')
  await page.waitForSelector('.pp-campo')
  await pronto(page, '.pp')   // la finestra cieca
  const nome = await titolo()
  controlla('si riprende dal sentiero dopo i due vinti', nome.includes('3'), nome)
  controlla('il sentiero ha una mappa', (await page.locator('.pp-tela').boundingBox()).width > 100)
  await componi(['destra'])

  await indietro()
  await page.waitForSelector('[data-ripresa]')
  {
    const testo = await page.locator('[data-ripresa]').textContent()
    controlla('uscire non chiude la serie', /2 di fila/.test(testo), testo)
    const p = await passo()
    uguale('e non scrive il record', (p.primato || {}).best || 0, 0)
    controlla('il posto in gioco è salvato, con la sua fila',
              p.sosta.sentiero.posto && p.sosta.sentiero.fila && p.sosta.sentiero.fila.fila.length === 1,
              JSON.stringify(p.sosta.sentiero.fila))
  }

  /* ripreso, è lo stesso posto con la stessa fila */
  const mappaPrima = (await passo()).sosta.sentiero.posto.mappa.join('/')
  await page.click('[data-ripresa] [data-azione="riprendi"]')
  await page.waitForSelector('.pp-campo')
  await pronto(page, '.pp')   // la finestra cieca
  uguale('ripreso, la fila è quella', await tessere(), 1)
  uguale('il titolo è lo stesso', await titolo(), nome)
  await indietro()
  uguale('e il posto non è cambiato', (await passo()).sosta.sentiero.posto.mappa.join('/'), mappaPrima)

  /* un sentiero nuovo chiede prima */
  await giocaSullIsola(page, 'senza-fine')
  uguale('il tasto del sentiero chiede prima', await page.locator('[data-chiede]').count(), 1)
  await page.click('[data-chiede] [data-azione="riprendi-invece"]')
  await page.waitForSelector('.pp-campo')
  await pronto(page, '.pp')   // la finestra cieca
  uguale('«no, torno a quella» riprende il sentiero lasciato', await tessere(), 1)
  await indietro()

  /* «lascio perdere»: la serie finisce davvero, e il record si scrive una volta */
  await page.click('[data-ripresa] [data-azione="scorda"]')
  await attendi(page, 200)
  uguale('«lascio perdere» toglie la carta', await page.locator('[data-ripresa]').count(), 0)
  {
    const p = await passo()
    /* la sosta di prima non diceva quale sentiero: era del coniglio, e il record va lì (il posto vecchio, `primato`, se ne va) */
    uguale('e scrive il record della serie, nel sentiero del coniglio', ((p.primati || {}).coniglio || {}).best, 2)
    uguale('una volta sola', ((p.primati || {}).coniglio || {}).partite, 1)
    uguale('il sentiero del cane non lo tocca', (p.primati || {}).cane, undefined)
    uguale('la sosta non tiene più il sentiero', (p.sosta || {}).sentiero || null, null)
  }
  await giocaSullIsola(page, 'senza-fine')
  await page.waitForSelector('.pp-campo')
  uguale('senza sosta il sentiero parte senza chiedere', (await titolo()).includes('1'), true)
  await indietro()
})

/* ══════════ 3. i due sentieri: il cane, e un record e una sosta ciascuno ══════════
   Un profilo di prima, col record di quando il sentiero era uno: lo ritrova il sentiero del coniglio, e quello del cane
   non ne ha. Che il 💡 da solo porti a casa lo dice `unita/passo-passo-sentiero` */
await blocco('i due sentieri', async () => {
  await semina(page, { settings: { eta: 8 },
                       campagne: { passo: { tappa: CAMPAGNA.length, libera: true, cfg: { fila: FILA_ATTUALE },
                                            // le due strade finite: ognuno si apre in fondo alla sua
                                            stelle: Object.fromEntries(CAMPAGNA.map((_, i) => [i, 1])),
                                            primato: { best: 4, quando: 1, partite: 3, ultime: [] } } } })
  await allaMappaDelGioco()
  const fumettoDi = async quale => {
    await page.waitForSelector('[data-segnalino][data-in-viaggio="0"]', { timeout: 8000 })
    await page.locator(`[data-mappa] [data-tappa="${quale}"]`).click()
    await page.waitForSelector(`[data-fumetto][data-fumetto-per="${quale}"]`, { timeout: 3000 })
    const testo = await page.locator('[data-fumetto] [data-record]').innerText()
    await page.waitForSelector('[data-segnalino][data-in-viaggio="0"]', { timeout: 8000 })
    return testo
  }
  // ognuno sulla mappa del suo protagonista, in fondo alla sua strada
  controlla('a campagna finita il sentiero del coniglio è aperto', await statoSullIsola(page, 'senza-fine') !== 'chiusa')
  uguale('col coniglio è il suo', await page.locator('[data-tappa="senza-fine"] [data-sentiero-di]').getAttribute('data-sentiero-di'), 'coniglio')
  controlla('il record di prima è del sentiero del coniglio', /4 di fila/.test(await fumettoDi('senza-fine')))
  controlla('c\'è anche il sentiero del cane, aperto', await statoSullIsola(page, 'senza-fine-cane') !== 'chiusa')
  uguale('col cane è il suo', await page.locator('[data-tappa="senza-fine-cane"] [data-sentiero-di]').getAttribute('data-sentiero-di'), 'cane')
  uguale('quello del cane non ne ha ancora', await fumettoDi('senza-fine-cane'), 'Ancora nessun record')
  await scatto(page, 'passo-due-sentieri')
  await page.click('[data-fumetto] [data-azione="parti"]')
  await page.waitForSelector('.pp-campo', { timeout: 5000 })
  controlla('il sentiero del cane si gioca col cane', (await titolo()).startsWith('🐕'), await titolo())
  // una freccia nella fila (passata la finestra cieca): un sentiero non toccato non si tiene
  await pronto(page, '.pp')   // la finestra cieca
  await page.locator('[data-freccia="destra"]').first().click()
  await attendi(page, 150)
  await indietro()
  /* uscito, la carta in cima dice che era il sentiero del cane; toccare quello del coniglio chiede prima */
  const s = ((((await leggiProfilo(page)).campagne || {}).passo || {}).sosta || {}).sentiero || {}
  controlla('la sosta è del sentiero del cane, e il posto ha le pecore',
            s.strada === 'cane' && !!s.posto && s.posto.mappa.join('').includes('p'), JSON.stringify(s).slice(0, 200))
  const testo = await page.locator('[data-ripresa]').innerText().catch(() => '')
  controlla('la carta in cima dice il sentiero del cane', /cane/.test(testo), testo)
  await giocaSullIsola(page, 'senza-fine')
  uguale('il sentiero del coniglio chiede prima di lasciare quello del cane', await page.locator('[data-chiede]').count(), 1)
  controlla('e dice quale', /coniglio/.test(await page.locator('[data-chiede]').innerText()))
  await page.click('[data-azione="comincia"]')
  await page.waitForSelector('.pp-campo', { timeout: 5000 })
  controlla('«comincio» parte il sentiero del coniglio', (await titolo()).startsWith('🐇'), await titolo())
  controlla('e il sentiero del coniglio ha la sua mappa', (await page.locator('.pp-tela').boundingBox()).width > 100)
  await scatto(page, 'passo-sentiero')
})

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('Passo passo — la fila e il sentiero lasciati a metà, nel browser')
