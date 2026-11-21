/* ═══════════════════════════════════════════════════════════════════
   LA SCUOLA — UNA MAESTRA, UN BAMBINO, UNA LEZIONE A DUE BLOCCHI

   Le due pagine costruite (`dist-scuola/maestra.html` e `index.html`,
   aperte dal file come dalla chiavetta) in due contesti di Chrome, e il
   servizio in locale con la logica vera (`aiuto/servizio-scuola.mjs`).
   La maestra crea dai tasti la classe (Lorenzo e Marta) e la lezione:
   la tabellina del 2 a schede, che passa dopo 2 giuste, poi gli
   Asteroidi finché lo dice lei. Avvia, e il codice si legge dalla sala.
   Il bambino lo scrive, tocca il suo nome e la maestra lo vede preso;
   al «Via» risponde giusto a due schede, vede il passaggio, «Continua»,
   e negli Asteroidi un colpo arriva nel pannello (senza 3D si torna alle
   schede, e si risponde lì). La maestra gli dà «Le domande» al posto del
   gioco, e sul suo PC il tasto «Maestra», col codice a tempo, apre il
   menu. «Avanti tutti» una volta: lui era già da solo al blocco «quando
   lo dice la maestra», e arriva a «Hai finito!». «Chiudi lezione»: lui vede che è finita, la maestra il
   resoconto con le sue giuste blocco per blocco. E alla fine la pagina
   dei bambini non ha lasciato niente sul PC: IndexedDB vuoto, in
   localStorage solo chiavi `scuola:*`. Gli Asteroidi si giocano dalla
   tastiera (← → e Invio), e una prova di Passo passo pure.
   Docs: docs/scuola/ (le righe «Nei test»). `node test/esegui.mjs scuola`
   costruisce anche `dist-scuola/` (`npm run build:scuola`).
   ═══════════════════════════════════════════════════════════════════ */
import { resolve } from 'node:path'
import { apriBrowser, attendi, scatto, RADICE, SCRIVANIA } from '../aiuto/browser.mjs'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'
import { servizioScuola } from '../aiuto/servizio-scuola.mjs'
import { linkDiProva } from '../../src/scuola/maestra/quaderno.js'

const CARTELLA = resolve(RADICE, 'dist-scuola')
const servizio = await servizioScuola()
const browser = await apriBrowser({ file: resolve(CARTELLA, 'index.html') })
// un WebSocket che si chiude o si rifà Chrome lo scrive in console: non è un errore delle pagine
const veri = errori => errori.filter(e => !/WebSocket|ERR_|Failed to load resource/.test(e))

/* una pagina in un contesto suo (i due PC non si dividono localStorage né IndexedDB), col servizio locale */
async function apri(file) {
  const page = await browser.newPage({ viewport: SCRIVANIA, hasTouch: true })
  const errori = []
  page.on('pageerror', e => errori.push('errore JS: ' + e.message))
  page.on('console', m => m.type() === 'error' && errori.push('console: ' + m.text()))
  await page.addInitScript(s => { globalThis.__SERVIZIO_SFIDE__ = s }, servizio.indirizzo)
  await page.goto('file://' + resolve(CARTELLA, file))
  const cdp = await page.context().newCDPSession(page)
  // un tocco vero (docs/core/il-dito.md), al centro del primo elemento visibile
  async function tocca(sel) {
    const el = page.locator(sel).first()
    await el.waitFor({ state: 'visible', timeout: 8000 })
    await el.scrollIntoViewIfNeeded()
    const b = await el.boundingBox()
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }] })
    await attendi(page, 40)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await attendi(page, 60)
  }
  return { page, errori, tocca }
}
const testo = (page, sel) => page.locator(sel).first().innerText()
const schermata = (page, nome, timeout = 8000) => page.waitForSelector(`[data-schermata="${nome}"]`, { timeout })

const M = await apri('maestra.html'), B = await apri('index.html')
const m = M.page, b = B.page

/* ── la classe, dai tasti ── */
await schermata(m, 'inizio')
await M.tocca('[data-azione="nuova-classe"]')
await schermata(m, 'classe')
await m.fill('[data-campo="nome-classe"]', '3ª B')
await m.fill('[data-campo="alunni"]', 'Lorenzo\nMarta')
controlla('la classe conta due alunni', /^2 alunni/.test(await testo(m, '[data-conta-alunni]')), await testo(m, '[data-conta-alunni]'))
await M.tocca('[data-azione="salva-classe"]')
await schermata(m, 'inizio')
uguale('nel quaderno c\'è una classe', await m.locator('[data-classi] [data-classe]').count(), 1)

/* ── la lezione a due blocchi, dall'editor ── */
await M.tocca('[data-azione="nuova-lezione"]')
await schermata(m, 'lezione')
await m.fill('[data-campo="nome-lezione"]', 'Il 2 e gli Asteroidi')
// una lezione nuova non ha scelte fatte: tutti gli undici giochi in vista (le domande e i dieci veri), nessuno scelto, e non si salva
uguale('tutti gli undici giochi in vista', await m.locator('[data-blocco="0"] [data-scegli-gioco] [data-gioco]').count(), 11)
uguale('nessuno scelto', await m.locator('[data-blocco="0"] [data-scegli-gioco] [data-gioco][aria-pressed="true"]').count(), 0)
controlla('e la lezione dice di scegliere il gioco', /scegli il gioco/.test(await testo(m, '[data-problema]')))
// a passi: scelto il gioco si richiude in una riga sopra, e sotto si apre cosa si chiede
await M.tocca('[data-blocco="0"] [data-gioco="schede"]')
uguale('il gioco scelto è una riga', await m.locator('[data-blocco="0"] [data-fatta="gioco"]').count(), 1)
uguale('e i giochi non si vedono più', await m.locator('[data-blocco="0"] [data-scegli-gioco]').count(), 0)
uguale('e nessuna domanda accesa', await m.locator('[data-blocco="0"] [data-elenco-domande] [data-voce][aria-pressed="true"]').count(), 0)
controlla('«Fatto» aspetta una scelta', await m.locator('[data-blocco="0"] [data-azione="cosa-fatta"]').isDisabled())
// cosa si chiede è un elenco per materia con la spunta: si aprono la matematica e le tabelline
await M.tocca('[data-blocco="0"] [data-materia-elenco="matematica"] .testa-materia')
await M.tocca('[data-blocco="0"] [data-voce="tabelline"]')
const premuto = sel => m.locator(sel).first().getAttribute('aria-pressed')
uguale('il primo blocco parte dalla tabellina del 2', await premuto('[data-blocco="0"] [data-tabellina="2"]'), 'true')
uguale('col risultato', await premuto('[data-blocco="0"] [data-modo="prodotto"]'), 'true')
controlla('con la domanda vera accanto', await m.locator('[data-blocco="0"] [data-esempio]').count() === 1)
await M.tocca('[data-blocco="0"] [data-azione="cosa-fatta"]')
uguale('tutto deciso: il blocco si chiude in una riga', await m.locator('[data-blocco="0"]').getAttribute('data-chiuso'), 'true')
controlla('che dice il gioco e cosa si fa', /Le domande[\s\S]*Tabellina del 2/.test(await testo(m, '[data-blocco="0"] [data-riassunto-blocco]')))
// un blocco solo va finché la maestra chiude: niente «quando si passa»; il blocco dopo si aggiunge
uguale('un blocco solo: niente «quando si passa»', await m.locator('[data-passa-scelto]').count(), 0)
await M.tocca('[data-azione="aggiungi-blocco"]')
await m.waitForSelector('[data-blocco="1"]', { timeout: 5000 })
uguale('il blocco nuovo nasce aperto e senza gioco', await m.locator('[data-blocco="1"] [data-scegli-gioco] [data-gioco][aria-pressed="true"]').count(), 0)
await M.tocca('[data-blocco="1"] [data-gioco="asteroidi"]')
// negli Asteroidi la sola materia è già aperta, e le tabelline si accendono; poi quanto è difficile
uguale('negli Asteroidi resta solo quello che sanno fare: niente materie da scegliere', await m.locator('[data-blocco="1"] [data-materia]').count(), 0)
await M.tocca('[data-blocco="1"] [data-voce="tabelline"]')
await M.tocca('[data-blocco="1"] [data-azione="cosa-fatta"]')
await M.tocca('[data-blocco="1"] [data-difficolta="normale"]')
uguale('scelta anche la difficoltà, il secondo si chiude', await m.locator('[data-blocco="1"]').getAttribute('data-chiuso'), 'true')
controlla('e dice quando finisce: quando lo dice la maestra', /lo dice la maestra/.test(await testo(m, '[data-blocco="1"] [data-riassunto-blocco]')))
// per il primo, quando si passa: si riapre, le scelte sono righe, e sotto il passaggio
await M.tocca('[data-blocco="0"] [data-azione="apri-blocco"]')
uguale('riaperto, le scelte sono righe compatte: il gioco, cosa si chiede, quando si passa', await m.locator('[data-blocco="0"] [data-fatta]').count(), 3)
uguale('col blocco dopo, di base si passa quando lo dice la maestra', await m.locator('[data-blocco="0"] [data-passa-scelto]').getAttribute('data-passa-scelto'), 'maestra')
await M.tocca('[data-blocco="0"] [data-cambia="passa"]')
await M.tocca('[data-blocco="0"] [data-passa="giuste"]')
await m.fill('[data-blocco="0"] [data-campo="soglia"]', '2')
await M.tocca('[data-blocco="0"] [data-azione="passa-fatto"]')
uguale('si passa dopo 2 risposte giuste', (await testo(m, '[data-blocco="0"] [data-fatta="passa"] .valore')).trim(), 'dopo 2 risposte giuste')
await M.tocca('[data-blocco="0"] [data-azione="chiudi-blocco"]')
uguale('la lezione è completa', await m.locator('[data-problema]').count(), 0)
await scatto(m, 'scuola-editor')
await M.tocca('[data-azione="salva-lezione"]')
await schermata(m, 'inizio')
uguale('nel quaderno c\'è una lezione', await m.locator('[data-lezioni] [data-lezione]').count(), 1)
await scatto(m, 'scuola-inizio')

/* ── avvia: il codice si legge dalla sala ── */
await M.tocca('[data-lezioni] [data-azione="avvia"]')
await schermata(m, 'avvia')
await M.tocca('[data-azione="avvia-lezione"]')
await schermata(m, 'diretta', 10000)
await m.waitForSelector('[data-sala] [data-codice]', { timeout: 8000 })
const codice = (await testo(m, '[data-sala] [data-codice]')).trim()
controlla('in sala un codice di quattro cifre', /^\d{4}$/.test(codice), codice)
const sulServizio = servizio.lezioni.get(codice)?.stato
controlla('il servizio ha la lezione', !!sulServizio)
stessaLista('i blocchi arrivati al servizio sono quelli dell\'editor', sulServizio?.lezione.blocchi, [
  { esercizio: { tipo: 'tabelline', tabelline: [2], modo: 'prodotto' }, passa: { giuste: 2 } },
  { esercizio: { tipo: 'tabelline', tabelline: [2], modo: 'prodotto', gioco: 'asteroidi' }, passa: null },
])
stessaLista('con i due alunni della classe', sulServizio?.alunni.map(a => a.nome), ['Lorenzo', 'Marta'])
await m.waitForSelector('[data-linea="su"]', { timeout: 8000 })
await scatto(m, 'scuola-sala')

/* ── il bambino: il codice, il nome; la maestra lo vede preso ── */
await schermata(b, 'codice')
await b.fill('[data-codice]', codice)
await B.tocca('[data-entra]')
await schermata(b, 'nome', 10000)
uguale('i nomi della classe come tasti', await b.locator('[data-nomi] [data-nome]').count(), 2)
const lorenzo = await b.locator('[data-nome]', { hasText: 'Lorenzo' }).getAttribute('data-nome')
const marta = await b.locator('[data-nome]', { hasText: 'Marta' }).getAttribute('data-nome')
await B.tocca(`[data-nome="${lorenzo}"]`)
await schermata(b, 'aspetta')
controlla('il bambino aspetta il via col suo nome', /Lorenzo/.test(await testo(b, '[data-aspetta]')))
await m.waitForSelector(`[data-sala] [data-alunno="${lorenzo}"][data-preso="true"]`, { timeout: 5000 })
uguale('in sala Marta non è presa', await m.locator(`[data-sala] [data-alunno="${marta}"]`).getAttribute('data-preso'), 'false')
await scatto(b, 'scuola-aspetta')

/* ── «Via»: due schede giuste, il passaggio ── */
await M.tocca('[data-azione="via"]')
await schermata(b, 'blocco')
await b.waitForSelector('[data-domanda][data-blocco="0"] .qz-tasto', { timeout: 8000 })
controlla('il segno conta le giuste', /0 di 2 giuste/.test(await testo(b, '[data-segno]')), await testo(b, '[data-segno]'))
// una domanda nuova, ancora da rispondere: la giusta si trova dal DOM di Domanda.vue (`data-giusta`)
const nuova = () => b.waitForFunction(() => document.querySelector('.qz-tasto[data-giusta]')
  && !document.querySelector('.qz-tasto.giusta, .qz-tasto.sbagliata, .qz-tasto.spenta'), null, { timeout: 8000 })
async function giustaAllaScheda() {
  await nuova()
  await attendi(b, 450)                         // la finestra cieca di una domanda appena comparsa
  await B.tocca('.qz-tasto[data-giusta]')
  await b.waitForSelector('.qz-tasto.giusta', { timeout: 3000 })
}
const inCorso = () => m.locator(`[data-pannello] [data-alunno="${lorenzo}"] [data-blocco-in-corso]`).innerText().catch(() => '')
await giustaAllaScheda()
await m.waitForFunction(id => /1\s*giuste su 2/.test(document.querySelector(`[data-pannello] [data-alunno="${id}"] [data-blocco-in-corso]`)?.innerText || ''),
                        lorenzo, { timeout: 5000 }).catch(() => {})
controlla('la prima giusta è nel pannello della maestra', /1\s*giuste su 2 · 1 fatte/.test(await inCorso()), await inCorso())
await giustaAllaScheda()
await schermata(b, 'passaggio')
controlla('il passaggio dice cosa viene: gli Asteroidi', /Asteroidi/.test(await testo(b, '[data-passaggio]')), await testo(b, '[data-passaggio]'))
await m.waitForSelector(`[data-pannello] [data-alunno="${lorenzo}"][data-dove="1"]`, { timeout: 5000 })
controlla('la maestra lo vede nel blocco 2', /blocco 2 di 2/.test(await testo(m, `[data-pannello] [data-alunno="${lorenzo}"]`)))
await scatto(b, 'scuola-passaggio')

/* ── «Continua»: gli Asteroidi, un colpo che arriva alla maestra ── */
await B.tocca('[data-continua]')
await b.waitForSelector('[data-domanda][data-blocco="1"]', { timeout: 5000 })
await b.waitForSelector('[data-domanda][data-blocco="1"] [data-gioco="asteroidi"], [data-domanda][data-blocco="1"] .qz-tasto', { timeout: 10000 })
let nelGioco = await b.locator('[data-gioco="asteroidi"]').count() === 1
if (nelGioco) {
  // il cielo scende e un sasso giusto c'è; se intanto la vista si guasta (niente WebGL 2) si torna alle schede
  nelGioco = await b.waitForFunction(() => window.__mate?.asteroidi?.().some(a => !a.morto && a.ok) || !document.querySelector('[data-gioco="asteroidi"]'),
                                     null, { timeout: 20000, polling: 100 }).then(() => b.evaluate(() => !!document.querySelector('[data-gioco="asteroidi"]')))
}
if (nelGioco) {
  controlla('il gioco ha il cielo in 3D', await b.evaluate(() => window.__mate.grafica?.()?.tre === true))
  await scatto(b, 'scuola-asteroidi')
  // a scuola la tastiera comanda (docs/asteroidi/grafica-3d.md, «La tastiera»): ← → fino al giusto, e Invio
  // le frecce scelgono fra i sassi già in vista: si aspetta che il giusto sia sceso nello schermo
  await b.waitForFunction(() => window.__mate.asteroidi().some(a => !a.morto && a.ok && a.y > 80), null, { timeout: 15000, polling: 100 })
  await b.keyboard.press('ArrowLeft')
  controlla('una freccia sceglie un sasso, e i tasti si vedono in fondo',
            await b.evaluate(() => !!window.__mate.puntato()) && await b.locator('[data-tasti-nave]').isVisible())
  for (let i = 0; i < 6; i++) await b.keyboard.press('ArrowLeft')
  for (let i = 0; i < 6 && !(await b.evaluate(() => window.__mate.puntato()?.ok)); i++) await b.keyboard.press('ArrowRight')
  controlla('con le frecce si arriva al sasso giusto', await b.evaluate(() => window.__mate.puntato()?.ok))
  await b.keyboard.press('Enter')
} else {
  nota('niente 3D in questo Chrome: il blocco degli Asteroidi è tornato alle schede')
  await giustaAllaScheda()
}
await m.waitForFunction(id => /1\s*fatte · 1\s*giuste/.test(document.querySelector(`[data-pannello] [data-alunno="${id}"] [data-blocco-in-corso]`)?.innerText || ''),
                        lorenzo, { timeout: 8000 }).catch(() => {})
controlla('la risposta del secondo blocco è nel pannello della maestra', /1\s*fatte · 1\s*giuste/.test(await inCorso()), await inCorso())
const risposte = servizio.lezioni.get(codice).stato.risposte[lorenzo] || []
stessaLista('il servizio ha le tre risposte di Lorenzo, coi blocchi', risposte.map(r => [r.blocco, r.chiave, r.giusta]),
            [[0, 'tab:prodotto', true], [0, 'tab:prodotto', true], [1, 'tab:prodotto', true]])
if (nelGioco) controlla('quella del gioco racconta la tabellina del 2', /^2 × \d+$/.test(risposte[2]?.fatto || ''), risposte[2]?.fatto)
{
  // il riassunto sotto il nome: chiuso dice i conti, aperto le risposte per blocco
  const sotto = `[data-pannello] [data-alunno="${lorenzo}"] [data-risposte]`
  controlla('sotto il nome, le sue risposte in breve', /3 giuste/.test(await testo(m, `${sotto} summary`)), await testo(m, `${sotto} summary`))
  await m.locator(`${sotto} summary`).click()
  stessaLista('aperte: due giuste nel blocco 1 e una nel 2',
         [await m.locator(`${sotto} [data-risposte-blocco="0"] [data-esito="si"]`).count(), await m.locator(`${sotto} [data-risposte-blocco="1"] [data-esito="si"]`).count()], [2, 1])
}
uguale('nella panoramica della classe Lorenzo sta nel blocco 2', await m.locator('[data-panoramica] [data-colonna="1"] .iniziali').count(), 1)
await m.locator('[data-panoramica]').scrollIntoViewIfNeeded()
await scatto(m, 'scuola-pannello')

/* ── i ripieghi (docs/scuola/ripieghi.md): le domande per lui solo, il menu della maestra sul suo PC ── */
const card = `[data-pannello] [data-alunno="${lorenzo}"]`
await M.tocca(`${card} [data-azione="altro"]`)   // i comandi rari stanno nel menu «⋯»
await M.tocca(`${card} [data-azione="domande"]`)
await m.waitForSelector(`${card} [data-solo-domande]`, { timeout: 5000 })
await b.waitForSelector('[data-domanda][data-blocco="1"] .qz-tasto', { timeout: 8000 })
uguale('«Le domande» dalla maestra: sul suo PC il gioco lascia il posto alle schede', await b.locator('[data-gioco="asteroidi"]').count(), 0)
uguale('e il servizio lo sa', servizio.lezioni.get(codice).stato.alunni.find(a => a.id === lorenzo).domande, true)
const { codiceAl } = await import('../../src/scuola/comune/codice-maestra.js')
await B.tocca('[data-azione="maestra"]')
await b.fill('[data-menu-maestra] [data-campo="codice-maestra"]', codiceAl(Date.now()))
await B.tocca('[data-menu-maestra] [data-azione="codice-maestra"]')
await b.waitForSelector('[data-menu-maestra] [data-azione="salta"]', { timeout: 3000 })
uguale('col codice della maestra il menu ha «Cambia nome»', await b.locator('[data-menu-maestra] [data-azione="cambia-nome"]').count(), 1)
await scatto(b, 'scuola-menu-maestra')
await B.tocca('[data-azione="chiudi-menu"]')
uguale('la ✕ lo chiude', await b.locator('[data-menu-maestra]').count(), 0)

/* ── «Tutti alle domande» e «Cambia la lezione»: la lezione cambia a metà, senza un codice nuovo ── */
await M.tocca('[data-azione="tutti-alle-domande"]')
await M.tocca('[data-se-non-va] [data-azione="conferma"]')
await m.waitForFunction(() => /senza giochi/.test(document.querySelector('[data-messaggio]')?.innerText || ''), null, { timeout: 5000 })
const sulServizioOra = () => servizio.lezioni.get(codice).stato
controlla('«Tutti alle domande»: il blocco degli Asteroidi lascia il gioco', !('gioco' in sulServizioOra().lezione.blocchi[1].esercizio) && sulServizioOra().rifatta === 1)
await b.waitForSelector('[data-domanda][data-blocco="1"] .qz-tasto', { timeout: 8000 })
await M.tocca('[data-azione="cambia-lezione"]')
await schermata(m, 'lezione')
controlla('«Cambia la lezione» apre l\'editor con la lezione in corso', await m.locator('[data-cambia-in-corso]').count() === 1 && await m.locator('[data-blocco="1"]').count() === 1)
await M.tocca('[data-azione="manda-lezione"]')
await schermata(m, 'diretta')
await m.waitForFunction(() => true)
await attendi(m, 300)
uguale('mandata: il servizio ha la lezione rifatta un\'altra volta', sulServizioOra().rifatta, 2)
await b.waitForSelector('[data-domanda][data-blocco="1"]', { timeout: 5000 })
controlla('e Lorenzo resta nel blocco 2', true)

/* ── «Avanti tutti»: Lorenzo è già da solo nel blocco 2, «quando lo dice la maestra»: una pressione e finisce ── */
controlla('la maestra sa che chiudere il blocco fa finire la lezione a Lorenzo', /Lorenzo finisce la lezione/.test(await testo(m, '[data-avanti]')), await testo(m, '[data-avanti]'))
uguale('il tasto dice quale blocco chiude', (await testo(m, '[data-azione="avanti-tutti"]')).trim(), 'Chiudi il blocco 2')
await M.tocca('[data-azione="avanti-tutti"]')
await schermata(b, 'finito')
controlla('il bambino ha finito', /Hai finito!/.test(await testo(b, '[data-finito]')))
await m.waitForSelector(`[data-pannello] [data-alunno="${lorenzo}"][data-dove="finito"]`, { timeout: 5000 })
controlla('la maestra lo vede finito', /ha finito/.test(await testo(m, `[data-pannello] [data-alunno="${lorenzo}"]`)))
uguale('«Avanti tutti» non serve più', await m.locator('[data-azione="avanti-tutti"]').isDisabled(), true)

/* ── «Chiudi lezione»: il bambino vede la fine, la maestra il resoconto ── */
await M.tocca('[data-azione="chiudi-lezione"]')
await M.tocca('[data-azione="conferma-chiudi"]')
await schermata(b, 'chiusa')
controlla('il bambino vede che la lezione è finita', /La lezione è finita/.test(await testo(b, '[data-chiusa]')))
await schermata(m, 'resoconto')
const riga = `[data-pagella] [data-alunno="${lorenzo}"]`
uguale('nel resoconto, il blocco 1 di Lorenzo', (await testo(m, `${riga} [data-blocco="0"]`)).trim(), '1: 2 giuste su 2')
uguale('e il blocco 2', (await testo(m, `${riga} [data-blocco="1"]`)).trim(), '2: 1 giusta su 1')
controlla('Marta non c\'era', /non c'era/.test(await testo(m, `[data-pagella] [data-alunno="${marta}"]`)))
uguale('e la tabella per la stampa dice lo stesso', await m.locator(`[data-tabella-resoconto] tr[data-alunno="${lorenzo}"] td[data-blocco="0"]`).textContent(), '2 fatte, 2 giuste')
await scatto(m, 'scuola-resoconto')

/* ── la pagina dei bambini non ha lasciato niente sul PC ── */
const disco = await b.evaluate(async () => ({
  basi: await indexedDB.databases().then(d => d.map(x => x.name), e => ['errore: ' + e.message]),
  chiavi: Object.keys(localStorage),
}))
stessaLista('IndexedDB della pagina dei bambini è vuoto', disco.basi, [])
controlla('in localStorage solo chiavi scuola:*', disco.chiavi.every(k => k.startsWith('scuola:')), disco.chiavi.join(', '))

/* ── Passo passo dalla tastiera, in una prova (il link di ▶ Prova): ⌫, le frecce, Invio (docs/passo-passo/regole.md) ── */
{
  const P = await apri('index.html')
  const prova = linkDiProva({ id: 'prova', nome: 'Prova', inTondo: false,
    blocchi: [{ esercizio: { tipo: 'passo', protagonista: 'coniglio', gradini: ['passi'] }, passa: null }] }, P.page.url())
  await P.page.goto(prova)
  await P.page.reload()
  await P.page.waitForSelector('.pp-campo [data-freccia="destra"]', { timeout: 15000 })
  await attendi(P.page, 400)
  {
    // su un PC fila e tasti a sinistra, la mappa a destra (docs/passo-passo/scuola.md, «Lo schermo largo»)
    const [mappa, tasti] = await Promise.all(['.pp-scena', '.pp-tasti'].map(s => P.page.locator(s).boundingBox()))
    controlla('sullo schermo largo la mappa sta a destra dei tasti', tasti.x + tasti.width <= mappa.x, JSON.stringify({ mappa, tasti }))
  }
  controlla('a scuola i tasti si vedono subito, prima di premerne uno: anche sulle frecce',
            await P.page.locator('[data-freccia="destra"] [data-tasto-tastiera]').isVisible()
            && (await P.page.locator('[data-freccia="destra"] [data-tasto-tastiera]').innerText()) === '→')
  await scatto(P.page, 'scuola-passo-largo')
  await P.page.keyboard.press('ArrowRight')
  await P.page.keyboard.press('ArrowDown')
  uguale('le frecce della tastiera scrivono la fila', await P.page.locator('[data-tessera]').count(), 2)
  await P.page.keyboard.press('Backspace')
  uguale('⌫ toglie l\'ultima', await P.page.locator('[data-tessera]').count(), 1)
  controlla('sui pulsanti speciali si vede il tasto da premere', await P.page.locator('[data-azione="via"] [data-tasto-tastiera]').isVisible())
  await P.page.keyboard.press('Enter')
  controlla('Invio fa partire il coniglio', await P.page.waitForSelector('[data-azione="ferma"]', { timeout: 3000 }).then(() => true, () => false))
  controlla('nessun errore nella prova di Passo passo', veri(P.errori).length === 0, veri(P.errori).join(' | '))
  await P.page.close()
}

/* ── il Robot su un PC: il programma a sinistra, il mondo a destra (docs/costruttore/scuola.md) ── */
{
  const R = await apri('index.html')
  await R.page.goto(linkDiProva({ id: 'prova', nome: 'Prova', inTondo: false,
    blocchi: [{ esercizio: { tipo: 'robot', capitoli: ['cantiere'] }, passa: null }] }, R.page.url()))
  await R.page.reload()
  await R.page.waitForSelector('.cst-editor', { timeout: 15000 })
  await attendi(R.page, 400)
  const [editor, mondo] = await Promise.all(['.cst-editor', '.cst-sopra'].map(s => R.page.locator(s).boundingBox()))
  controlla('sullo schermo largo il programma sta a sinistra del mondo', editor.x + editor.width <= mondo.x, JSON.stringify({ editor, mondo }))
  await scatto(R.page, 'scuola-robot-largo')
  controlla('nessun errore nella prova del Robot', veri(R.errori).length === 0, veri(R.errori).join(' | '))
  await R.page.close()
}

/* ── Castle Battle da una prova: si parte nella tappa, e il primo edificio chiede un calcolo (docs/arena/scuola.md) ── */
{
  const C = await apri('index.html')
  await C.page.goto(linkDiProva({ id: 'prova', nome: 'Prova', inTondo: false,
    blocchi: [{ esercizio: { tipo: 'battaglia', tappa: 'ponte', difficolta: 'facile' }, passa: null }] }, C.page.url()))
  await C.page.reload()
  await C.page.waitForSelector('[data-gioco="castle-battle"] canvas', { timeout: 15000 })
  controlla('Castle Battle parte nella tappa scelta, senza mappa', /Il ponte di pietra/.test(await C.page.locator('[data-gioco="castle-battle"]').innerText()))
  await scatto(C.page, 'scuola-castle-battle')
  controlla('nessun errore nella prova di Castle Battle', veri(C.errori).length === 0, veri(C.errori).join(' | '))
  await C.page.close()
}

controlla('nessun errore nella pagina della maestra', veri(M.errori).length === 0, veri(M.errori).join(' | '))
controlla('nessun errore nella pagina dei bambini', veri(B.errori).length === 0, veri(B.errori).join(' | '))
nota(nelGioco ? 'il secondo blocco giocato negli Asteroidi in 3D' : 'il secondo blocco a schede')

await browser.close()
await servizio.chiudi()
riassunto('la scuola: maestra e bambino')
