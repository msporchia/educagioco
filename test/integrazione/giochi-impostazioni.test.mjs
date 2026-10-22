/* ═══════════════════════════════════════════════════════════════════
   LE IMPOSTAZIONI PER GIOCO — IL CAROSELLO DELLA HOME, CON LE IMPOSTAZIONI SOTTO

   Nella scheda «Giochi e domande» dei grandi c'è lo stesso carosello della home, coi giochi che in casa non ci sono in grigio, e
   sotto le impostazioni di quello in mezzo: «In casa» a tre posizioni, il tempo che ci passa, le domande che chiede. Docs:
   docs/genitori/giochi.md.
   `node test/esegui.mjs giochi-impostazioni --niente-build`
   tempo: 25
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, semina, attendi, leggiProfilo, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await semina(page, { settings: { eta: 8, sperimentali: true }, campagne: { fattoria: { cfg: { stato: {} } }, fattoria3d: { cfg: { stato: {} } } } })
const digita = async pin => { for (const c of pin) await page.click(`.tasto >> text="${c}"`) }
await page.click('[data-azione="grandi"]')
await page.waitForSelector('.tastierino', { timeout: 5000 })
await digita('0000')
await page.waitForSelector('.carte', { timeout: 8000 })
await page.click('[data-scheda="giochi"]')
await page.waitForSelector('[data-giochi-impostazioni]', { timeout: 5000 })

const inMezzo = () => page.locator('[data-pannello-gioco]').getAttribute('data-pannello-gioco')
const vai = async k => { await page.click(`[data-indice="${k}"]`); await attendi(page, 450) }

controlla('c\'è il carosello, come in home', await page.locator('[data-giochi-impostazioni] .scaffale').count() === 1 && await page.locator('[data-giochi-impostazioni] .carta.gioco').count() > 8)
controlla('senza «gioca»: qui non si entra nei giochi', await page.locator('[data-giochi-impostazioni] .gioca').count() === 0)

/* ── fuori dalla home per l'età: «troppo facile» (un gioco per i piccoli) o «per più grandi», mai un «non è ancora adatto» sbagliato ── */
await vai('conta')
const contaDice = await page.locator('[data-gioco-esito]').innerText()
controlla('Conta gli animali, a 8 anni, è troppo facile: non «non ancora adatto»', /troppo facile/.test(contaDice) && !/ancora adatto|da solo quando/.test(contaDice), contaDice)

/* ── Castle Battle: a 8 anni sta in casa; il sotterraneo e i giochi in prova no ── */
await vai('arena')
uguale('in mezzo c\'è Castle Battle', await inMezzo(), 'arena')
controlla('non è grigio, e dice che segue l\'età', await page.locator('[data-giochi-impostazioni] [data-gioco="arena"].spenta').count() === 0 && await page.locator('[data-gioco-modo="segui"].su').count() === 1)
await page.locator('[data-gioco-tempo]').scrollIntoViewIfNeeded()
await scatto(page, 'giochi-impostazioni-arena')
controlla('l\'esito lo dice in parole', /anni/.test(await page.locator('[data-gioco-esito]').innerText()), await page.locator('[data-gioco-esito]').innerText())

await page.click('[data-gioco-modo="spento"]')
await attendi(page, 700)
uguale('spento: la scelta si ricorda nel profilo', (await leggiProfilo(page)).settings.giochi?.arena, false)
controlla('e il carosello lo mette in grigio', await page.locator('[data-giochi-impostazioni] [data-gioco="arena"].spenta').count() === 1)
await page.click('[data-gioco-modo="segui"]')
await attendi(page, 200)
controlla('«come dice l\'età» lo rimette com\'era', await page.locator('[data-giochi-impostazioni] [data-gioco="arena"].spenta').count() === 0)
await page.click('[data-gioco-modo="acceso"]')
await attendi(page, 700)
uguale('acceso comunque: si scrive `true`', (await leggiProfilo(page)).settings.giochi?.arena, true)
await page.click('[data-gioco-modo="segui"]')

/* ── il tempo: c'è sempre, anche a zero ── */
controlla('il tempo ha sette giorni e tre numeri', await page.locator('[data-gioco-tempo] .col').count() === 7 && await page.locator('[data-gioco-tempo] .num div').count() === 3)

const apriTutte = () => page.evaluate(() => document.querySelectorAll('[data-gioco-tutte]').forEach(d => { d.open = true }))
/* ── le domande di Castle Battle: i saperi dei suoi moduli, con dove altro valgono ── */
await apriTutte()
const saperi = await page.locator('[data-gioco-sapere]').evaluateAll(l => l.map(x => x.dataset.giocoSapere))
controlla('Castle Battle chiede numeri, moltiplicazioni e divisioni', ['numeri', 'moltiplicazioni', 'divisioni'].every(s => saperi.includes(s)), saperi.join(','))
const div = page.locator('[data-gioco-sapere="divisioni"]')
controlla('ogni domanda dice a chi altro appartiene', /vale anche in/.test(await div.innerText()) || saperi.length > 0)
await div.locator('[data-gioco-sapere-tasto]').click()
await attendi(page, 700)
controlla('spegnere una domanda la spegne nel profilo (vale per tutti)', (await leggiProfilo(page)).settings.sa?.divisioni === false)
controlla('e la riga si vede spenta', await page.locator('[data-gioco-sapere="divisioni"].spenta').count() === 1)
await div.locator('[data-gioco-sapere-tasto]').click()

/* ── la difficoltà di una domanda: una tacca alla volta, e zero non si scrive ── */
const molt = page.locator('[data-gioco-sapere="moltiplicazioni"]')
controlla('di partenza «come dice l\'età»', /come dice l'età/.test(await molt.locator('[data-diff-testo]').innerText()))
await molt.locator('[data-diff="su"]').click()
await attendi(page, 700)
controlla('una tacca più facile: il testo e il profilo', /1 tacca più facili/.test(await molt.locator('[data-diff-testo]').innerText()) && (await leggiProfilo(page)).settings.ritocchi?.moltiplicazioni === 1)
await molt.locator('[data-diff="giu"]').click(); await molt.locator('[data-diff="giu"]').click()
await attendi(page, 700)
controlla('due tacche giù: una più difficile', /1 tacca più difficili/.test(await molt.locator('[data-diff-testo]').innerText()) && (await leggiProfilo(page)).settings.ritocchi?.moltiplicazioni === -1)
await molt.locator('[data-diff="su"]').click()
await attendi(page, 700)
controlla('tornata a zero: la voce sparisce dal profilo', (await leggiProfilo(page)).settings.ritocchi?.moltiplicazioni === undefined)

/* ── gli Asteroidi: i pezzi di scuola delle sue tappe sono interruttori (spegnere le divisioni toglie la tappa che le vuole) ── */
await vai('mate')
await apriTutte()
const saperiMate = await page.locator('[data-gioco-sapere]').evaluateAll(l => l.map(x => x.dataset.giocoSapere))
controlla('gli Asteroidi elencano i pezzi di scuola delle loro tappe', ['moltiplicazioni', 'divisioni', 'decine', 'stima', 'numeri'].every(k => saperiMate.includes(k)), saperiMate.join(','))
controlla('e dicono cosa chiedono, sopra', /tabelline/i.test(await page.locator('[data-gioco-insegna]').innerText()))

/* ── un gioco che ha bisogno di un sapere per esserci: lo dice ── */
await vai('pozioni')
await apriTutte()
controlla('le pozioni dicono che senza misure e conversioni non ci sono', /senza questa il gioco non c'è/.test(await page.locator('[data-gioco-sapere="misure"]').innerText()) && await page.locator('[data-gioco-sapere="conversioni"]').count() === 1)

/* ── un gioco che pesca da tutto il mazzo, e uno senza domande ── */
await vai('sotterraneo')
await page.locator('[data-pannello-gioco]').scrollIntoViewIfNeeded()
await scatto(page, 'giochi-impostazioni-sotterraneo')
controlla('il sotterraneo pesca da tutte le domande: lo dice e non le elenca', /tutte le domande/.test(await page.locator('[data-gioco-domande]').innerText()) && await page.locator('[data-gioco-sapere]').count() === 0)
await vai('fattoria')
controlla('la fattoria non fa domande di scuola: lo dice', /non fa domande|dove si spendono/i.test(await page.locator('[data-gioco-domande]').innerText()))

/* ── Avanzate della fattoria: riconverti dalla 2D e ricomincia, ognuno con la sua conferma ── */
await vai('fattoria3d')
controlla('la fattoria 3D ha le Avanzate coi due reset', await page.locator('[data-gioco-avanzate]').count() === 1)
await page.locator('[data-gioco-avanzate] summary').click()
await page.click('[data-azione="riconverti-fattoria"]')
controlla('«Riconverti» chiede conferma e non fa niente da sola', await page.locator('[data-azione="riconverti-fattoria-si"]').count() === 1 && !!(await leggiProfilo(page)).campagne.fattoria3d)
await page.click('[data-azione="riconverti-fattoria-si"]')
await attendi(page, 600)
const dopoRiconverti = (await leggiProfilo(page)).campagne || {}
controlla('«Riconverti» butta la 3D e lascia la 2D', !dopoRiconverti.fattoria3d && !!dopoRiconverti.fattoria, JSON.stringify(Object.keys(dopoRiconverti)))
await vai('fattoria')
controlla('sul foglio della 2D non c\'è «Riconverti»', await page.locator('[data-azione="riconverti-fattoria"]').count() === 0)
if (!await page.locator('[data-gioco-avanzate]').evaluate(d => d.open)) await page.locator('[data-gioco-avanzate] summary').click()
await page.click('[data-azione="azzera-fattoria"]')
await page.click('[data-azione="azzera-fattoria-si"]')
await attendi(page, 600)
const dopoAzzera = (await leggiProfilo(page)).campagne || {}
controlla('«Ricomincia» azzera 2D e 3D insieme', !dopoAzzera.fattoria && !dopoAzzera.fattoria3d, JSON.stringify(Object.keys(dopoAzzera)))

controlla('nessun errore in console', errori.length === 0, errori.join(' | '))
await browser.close()
riassunto('impostazioni per gioco')
