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
   localStorage solo chiavi `scuola:*`.
   Docs: docs/scuola/ (le righe «Nei test»). `node test/esegui.mjs scuola`
   costruisce anche `dist-scuola/` (`npm run build:scuola`).
   ═══════════════════════════════════════════════════════════════════ */
import { resolve } from 'node:path'
import { apriBrowser, attendi, scatto, RADICE, SCRIVANIA } from '../aiuto/browser.mjs'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'
import { servizioScuola } from '../aiuto/servizio-scuola.mjs'

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
await schermata(m, 'nuova')
await M.tocca('[data-azione="preparala-tu"]')
await schermata(m, 'lezione')
await m.fill('[data-campo="nome-lezione"]', 'Il 2 e gli Asteroidi')
// da zero il primo blocco mostra tutti i giochi, con le domande scelte; poi Matematica, che comincia con le tabelline (del 2, col risultato)
uguale('da zero, tutti e dieci i giochi in vista', await m.locator('[data-blocco="0"] [data-scegli-gioco] [data-gioco]').count(), 10)
await M.tocca('[data-blocco="0"] [data-gioco="schede"]')
uguale('scelto il gioco, resta solo quello', await m.locator('[data-blocco="0"] [data-scegli-gioco] [data-gioco]').count(), 1)
await M.tocca('[data-blocco="0"] [data-materia="matematica"]')
await M.tocca('[data-blocco="0"] [data-voce="tabelline"]')
const premuto = sel => m.locator(sel).first().getAttribute('aria-pressed')
uguale('il primo blocco parte dalla tabellina del 2', await premuto('[data-blocco="0"] [data-tabellina="2"]'), 'true')
uguale('col risultato', await premuto('[data-blocco="0"] [data-modo="prodotto"]'), 'true')
uguale('a schede', await premuto('[data-blocco="0"] [data-gioco="schede"]'), 'true')
uguale('e passa dopo le giuste', await premuto('[data-blocco="0"] [data-passa="giuste"]'), 'true')
await m.fill('[data-blocco="0"] [data-campo="soglia"]', '2')
await M.tocca('[data-azione="aggiungi-blocco"]')
await m.waitForSelector('[data-blocco="1"]', { timeout: 5000 })
await M.tocca('[data-blocco="1"] [data-azione="cambia-gioco"]')
await M.tocca('[data-blocco="1"] [data-gioco="asteroidi"]')
uguale('negli Asteroidi resta solo quello che sanno fare: niente materie da scegliere', await m.locator('[data-blocco="1"] [data-materia]').count(), 0)
await M.tocca('[data-blocco="1"] [data-passa="maestra"]')
uguale('il secondo blocco negli Asteroidi', await premuto('[data-blocco="1"] [data-gioco="asteroidi"]'), 'true')
uguale('finché lo dice la maestra', await premuto('[data-blocco="1"] [data-passa="maestra"]'), 'true')
uguale('la lezione è completa', await m.locator('[data-problema]').count(), 0)
await scatto(m, 'scuola-editor')
await M.tocca('[data-azione="salva-lezione"]')
await schermata(m, 'inizio')
uguale('nel quaderno c\'è una lezione', await m.locator('[data-lezioni] [data-lezione]').count(), 1)

/* ── avvia: il codice si legge dalla sala ── */
await M.tocca('[data-lezioni] [data-azione="avvia"]')
await schermata(m, 'avvia')
await M.tocca('[data-azione="avvia-lezione"]')
await schermata(m, 'diretta', 10000)
await m.waitForSelector('[data-sala] [data-codice]', { timeout: 8000 })
const codice = (await testo(m, '[data-sala] [data-codice]')).trim()
controlla('in sala un codice di cinque lettere', /^[A-Z]{5}$/.test(codice), codice)
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
await b.fill('[data-codice]', codice.toLowerCase())
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
  await b.evaluate(() => { const g = window.__mate; g.colpisci(g.asteroidi().find(a => !a.morto && a.ok)) })
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

/* ── i ripieghi (docs/scuola/ripieghi.md): le domande per lui solo, il menu della maestra sul suo PC ── */
const card = `[data-pannello] [data-alunno="${lorenzo}"]`
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
controlla('la maestra sa che «Avanti tutti» chiude la lezione', /finisce la lezione/.test(await testo(m, '[data-avanti]')), await testo(m, '[data-avanti]'))
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
const riga = `[data-tabella-resoconto] tr[data-alunno="${lorenzo}"]`
uguale('nel resoconto, il blocco 1 di Lorenzo', (await testo(m, `${riga} td[data-blocco="0"]`)).trim(), '2 fatte, 2 giuste')
uguale('e il blocco 2', (await testo(m, `${riga} td[data-blocco="1"]`)).trim(), '1 fatte, 1 giuste')
controlla('Marta non c\'era', /non c'era/.test(await testo(m, `[data-tabella-resoconto] tr[data-alunno="${marta}"]`)))
await scatto(m, 'scuola-resoconto')

/* ── la pagina dei bambini non ha lasciato niente sul PC ── */
const disco = await b.evaluate(async () => ({
  basi: await indexedDB.databases().then(d => d.map(x => x.name), e => ['errore: ' + e.message]),
  chiavi: Object.keys(localStorage),
}))
stessaLista('IndexedDB della pagina dei bambini è vuoto', disco.basi, [])
controlla('in localStorage solo chiavi scuola:*', disco.chiavi.every(k => k.startsWith('scuola:')), disco.chiavi.join(', '))

controlla('nessun errore nella pagina della maestra', veri(M.errori).length === 0, veri(M.errori).join(' | '))
controlla('nessun errore nella pagina dei bambini', veri(B.errori).length === 0, veri(B.errori).join(' | '))
nota(nelGioco ? 'il secondo blocco giocato negli Asteroidi in 3D' : 'il secondo blocco a schede')

await browser.close()
await servizio.chiudi()
riassunto('la scuola: maestra e bambino')
