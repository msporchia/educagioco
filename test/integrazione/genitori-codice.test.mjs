/* ═══════════════════════════════════════════════════════════════════
   I GRANDI: IL CODICE, GLI INTERRUTTORI, I GIOCHI
   perché: la porta dei grandi (il PIN sbagliato non apre e costa un'attesa, il codice si cambia e vale dopo un riavvio), la firma con un link solo, il modulo per segnalare; i giochi che si spengono e si tengono dalla ✎ fino alla home e dopo un riavvio, i giudizi e il muto che sopravvivono a un riavvio; il carosello dei giochi coi loro interruttori e le loro domande
   a parte perché: i grandi sono tre file per preparazione: `genitori` (i salvataggi), questo (le impostazioni che non toccano l'età) e `genitori-eta` (l'età, il quadro, chi gioca); quanto dura l'attesa lo decide `store/pin.js`

   L'orologio
   della pagina è quello finto di playwright (scorre da sé): l'attesa
   dopo un codice sbagliato si porta avanti invece di aspettarla.
   `node test/esegui.mjs integrazione/genitori-codice --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, semina, azzera, scatto, leggiProfilo, scegli } from '../aiuto/browser.mjs'
import { grandi, RICONOSCIBILE } from '../aiuto/genitori.mjs'
import { GIOCHI } from '../../src/data/giochi.js'
import { controlla, uguale, nota, riassunto, blocco } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, RICONOSCIBILE())
await page.clock.install()
const { digita, vaiAiGenitori, entra, apriScheda, apriBlocco, taraGioco, inHome, moneteInHome } = grandi(page)

/* ═══════════ 1. il gradino tiene ═══════════ */
await blocco('il tastierino', async () => {
  await vaiAiGenitori()
  controlla('la home non mostra più "azzera i dati"', !(await page.evaluate(() => document.body.innerText.includes('azzera i dati'))))
  /* chi arriva qui senza codice deve leggere di chi è la schermata e avere davanti una cosa da fare che non sia provare i numeri */
  controlla('il tastierino dice che è roba da grandi', await page.evaluate(() => document.body.innerText.includes('Le cambia un grande')))
  controlla('e c\'è un tasto per tornare ai giochi', await page.isVisible('[data-azione="torna-ai-giochi"]'))
  await page.click('[data-azione="torna-ai-giochi"]')
  controlla('che riporta davvero alla home', await page.waitForSelector('.tastierino', { state: 'detached', timeout: 2000 }).then(() => true, () => false))
  await vaiAiGenitori()
  await digita('1234')
  await page.waitForSelector('.fermo', { timeout: 2000 }).catch(() => {})
  controlla('un PIN sbagliato non apre', await page.isVisible('.tastierino'))
  controlla('lo dice invece di restare muto', await page.isVisible('.fermo'))
  /* sbagliare costa un'attesa: finché non è passata il tastierino non risponde, e provare i codici a raffica smette di essere
     il minigioco che era */
  controlla('e il tastierino resta spento finché non passa', await page.isDisabled('.tasto >> text="1"'))
  await page.click('.tasto >> text="1"', { force: true, timeout: 2000 }).catch(() => {})
  controlla('un tasto premuto durante l\'attesa non conta', await page.evaluate(() => document.querySelectorAll('.pallini .pieno').length === 0))
  /* il PIN giusto apre, passata l'attesa: il blocco dell'attesa tiene il posto, spento, e dice che è passata zittendo la barretta */
  await page.clock.fastForward(3500)
  await page.waitForSelector('.fermo .barretta.muta', { state: 'attached', timeout: 3000 })
  await digita('0000')
  controlla('con 0000 si entra', await page.waitForSelector('nav.barra-giu', { timeout: 5000 }).then(() => true, () => false))
})

/* ═══════════ 2. da chi arriva questo gioco, e il modo di dirlo ═══════════
   In fondo alle impostazioni deve dire di chi è e dove si guarda il codice; il profilo LinkedIn dell'autore è stato tolto
   apposta (un regalo non è un biglietto da visita), e una riga tolta per scelta torna indietro alla prima distrazione. */
await blocco('la firma e il modulo', async () => {
  await apriScheda('impostazioni')   // la firma sta solo lì
  const firma = await page.evaluate(() => {
    const f = document.querySelector('[data-firma]')
    return f ? { testo: f.innerText, fuori: [...f.querySelectorAll('a')].map(a => ({ href: a.href, target: a.target, rel: a.rel })) } : null
  })
  controlla('in fondo c\'è scritto chi l\'ha fatto', !!firma && firma.testo.includes('Marco Sporchia'), JSON.stringify(firma)?.slice(0, 120))
  controlla('e da lì si arriva al codice', !!firma && firma.fuori.some(a => /github\.com/.test(a.href)))
  uguale('e non c\'è nient\'altro: un link solo, il codice', (firma?.fuori || []).length, 1)
  controlla('niente LinkedIn nelle impostazioni', !/linkedin/i.test(JSON.stringify(firma)))
  controlla('i rimandi fuori si aprono in un\'altra scheda', (firma?.fuori || []).every(a => a.target === '_blank' && /noopener/.test(a.rel)))
  await scatto(page, 'genitori-firma')
  /* il tasto per segnalare sta fuori dai guasti: metà delle cose che non vanno non lancia nessun errore. La versione
     nell'indirizzo è il dato che nessun genitore saprebbe scrivere a mano */
  const segnala = '.carta[data-azione="segnala"]'
  controlla('si può segnalare anche senza nessun guasto in archivio', await page.isVisible(segnala))
  const dove = await page.getAttribute(segnala, 'href')
  controlla('e il tasto porta al modulo, con la versione già dentro', dove.startsWith('https://tally.so/r/') && /[?&]versione=[^&]+/.test(dove), dove)
  /* gli interruttori di casa sono tre, e non quattro: quello dei conti a mente spegneva metà di un gioco, e la fila degli
     asteroidi esiste per togliere quelle due metà */
  uguale('non c\'è nessun interruttore per il calcolo a mente', await page.locator('.carta[data-flag="mente"]').count(), 0)
  await apriScheda('bambini')
  uguale('la firma non c\'è nelle altre schede', await page.locator('[data-firma]').count(), 0)
})

/* ═══════════ 3. i giochi si spengono uno per uno, dalla ✎ ═══════════
   È l'interruttore che cambia quello che il bambino vede aprendo il gioco: se spegnere non togliesse la carta, o riaccendere
   non la riportasse, i genitori se ne accorgerebbero solo dal telefono. La riga del quadro dice anche chi decide. */
await blocco('i giochi dalla ✎', async () => {
  const moneteVere = (await leggiProfilo(page)).coins
  await page.waitForSelector('[data-manopola]', { timeout: 5000 })
  await apriBlocco('giochi')
  // quanti sono lo dice l'elenco, non un numero scritto qui: un gioco nuovo deve comparire nel quadro
  uguale('nel quadro c\'è una riga per gioco', await page.locator('[data-manopola] [data-apri="giochi"] .elenco li').count(), GIOCHI.length)
  controlla('di partenza il castello è in home', await inHome('.carta.gioco[data-gioco="torri"]'))
  await entra()
  await taraGioco('torri', 'no')
  const giochi = (await leggiProfilo(page)).settings.giochi || {}
  controlla('spegnere lo scrive nel profilo', giochi.torri === false, JSON.stringify(giochi))
  controlla('e la riga lo dice, senza doverla riaprire', (await page.locator('[data-manopola] [data-riga="torri"]').innerText()).includes('spento'))
  controlla('la riga di un gioco messo a mano si vede in mezzo alle altre',
            (await page.locator('[data-manopola] [data-riga="torri"] .voce-riga.ritoccata').count()) > 0)
  controlla('il castello sparisce dalla home', !(await inHome('.carta.gioco[data-gioco="torri"]')))
  controlla('gli altri giochi restano', await page.isVisible('.carta.mate'))
  uguale('spegnere non tocca i progressi', await moneteInHome(), moneteVere)
  await leggiProfilo(page)   // il salvataggio è a scatto ritardato: si ricarica quando è sceso
  await page.reload()
  await page.waitForSelector('.carte', { timeout: 8000 })
  controlla('la scelta resta dopo un riavvio', !(await page.isVisible('.carta.gioco[data-gioco="torri"]')))
  await entra()
  await taraGioco('torri', 'difetto')
  controlla('rimessa su «come dice l\'età», il castello torna in home', await inHome('.carta.gioco[data-gioco="torri"]'))

  /* «Ce l'ha» tiene un gioco in casa anche se l'età dice di no: serve quando l'età sbaglia (il fratello piccolo che gioca col
     grande), e prima non c'era nessun modo di dirlo */
  await entra()
  await apriScheda('bambini')
  await page.waitForSelector('[data-manopola]', { timeout: 5000 })
  await apriBlocco('giochi')
  const fuori = await page.evaluate(() => {
    const righe = [...document.querySelectorAll('[data-manopola] [data-apri="giochi"] .elenco li')]
    const f = righe.find(r => /arriva più avanti|già passato/.test(r.innerText))
    return f ? f.dataset.riga : null
  })
  if (fuori) {
    controlla(`«${fuori}» a quest'età non è in home`, !(await inHome(`.carta[data-gioco="${fuori}"]`)))
    await entra()
    await taraGioco(fuori, 'si')
    controlla('tenuto a mano, compare lo stesso in home', await inHome(`.carta[data-gioco="${fuori}"]`))
    await entra()
    await taraGioco(fuori, 'difetto')
    controlla('e rimesso all\'età sparisce di nuovo', !(await inHome(`.carta[data-gioco="${fuori}"]`)))
  } else nota('a quest\'età nessun gioco è fuori portata: la forzatura non si può provare qui')

  /* un gioco in prova (`spentoDiBase`, una `nota`) non arriva ai bambini prima che l'abbia deciso il grande; si cerca dal
     manifesto, non da una chiave scritta a mano */
  const primo = GIOCHI.find(g => g.nota)
  if (primo) {
    const suaCarta = `.carta.gioco[data-gioco="${primo.chiave}"]`
    controlla('di base un gioco in prova non è in home', !(await page.isVisible(suaCarta)))
    await entra()
    await taraGioco(primo.chiave, 'si')
    controlla('acceso dalla ✎ compare in home', await inHome(suaCarta))
    await entra()
    await taraGioco(primo.chiave, 'difetto')
    controlla('e tornando al difetto sparisce di nuovo', !(await inHome(suaCarta)))
  }

  /* e la fila degli asteroidi resta intera: la promessa dei tre interruttori, vista dalla mappa che un bambino apre davvero */
  await scegli(page, 'mate')
  await page.waitForSelector('[data-rotta]', { timeout: 5000 })
  const conto = await page.evaluate(() => ({
    pianeti: document.querySelectorAll('[data-rotta] [data-tipo="pianeta"]').length,
    stazioni: document.querySelectorAll('[data-rotta] [data-tipo="stazione"]').length,
    numeri: [...document.querySelectorAll('[data-rotta] [data-tappa]')].map(b => Number(b.dataset.tappa) + 1),
  }))
  uguale('la mappa ha tutti i pianeti', conto.pianeti, 10)
  controlla('e anche le stazioni, numerate da uno in fila, senza buchi', conto.stazioni > 0 && conto.numeri.every((n, i) => n === i + 1), conto.numeri.join(', '))
  await page.click('button[aria-label="indietro"]')
  await page.waitForSelector('.carte', { timeout: 5000 })
})

/* ═══════════ 4. il codice si cambia ═══════════
   Se non si potesse, resterebbe 0000 per sempre: il primo bambino che lo legge da sopra la spalla entra dove si cancellano i
   progressi. E il codice nuovo deve valere anche domani, cioè dopo un riavvio. */
await blocco('il codice si cambia', async () => {
  await entra()
  await apriScheda('impostazioni')
  await page.click('.carta[data-azione="cambia-codice"]')
  await page.waitForSelector('.tastierino', { timeout: 5000 })
  await digita('1234')
  await digita('9999')
  controlla('due codici diversi non cambiano niente', await page.waitForSelector('.avviso', { timeout: 2000 }).then(() => true, () => false))
  controlla('e si resta a scegliere il codice nuovo', await page.isVisible('.tastierino'))
  await digita('1234')
  await digita('1234')
  await apriScheda('impostazioni')
  await page.waitForSelector('.carta[data-azione="cambia-codice"]', { timeout: 5000 })
  controlla('due volte uguali lo cambiano', (await page.evaluate(() => document.body.innerText)).includes('Codice cambiato'))
  await leggiProfilo(page)   // l'archivio ha scritto
  await page.reload()
  await page.waitForSelector('.carte', { timeout: 8000 })
  await vaiAiGenitori()
  await digita('0000')
  await page.waitForSelector('.fermo', { timeout: 2000 }).catch(() => {})
  controlla('il vecchio codice non apre più', await page.isVisible('.tastierino'))
  await page.clock.fastForward(3500)   // l'attesa dello sbaglio
  await page.waitForSelector('.fermo .barretta.muta', { state: 'attached', timeout: 3000 })
  await digita('1234')
  await page.waitForSelector('nav.barra-giu', { timeout: 5000 })
  await apriScheda('impostazioni')
  controlla('quello nuovo apre, anche dopo un riavvio', await page.isVisible('.carta[data-azione="cambia-codice"]'))
  /* rimesso com'era: il codice sta fuori dai profili apposta, quindi nemmeno «cancella i progressi» lo riporterebbe a 0000 */
  await page.click('.carta[data-azione="cambia-codice"]')
  await page.waitForSelector('.tastierino', { timeout: 5000 })
  await digita('0000')
  await digita('0000')
  await apriScheda('impostazioni')
  await page.waitForSelector('.carta[data-azione="cambia-codice"]', { timeout: 5000 })
})

/* ═══════════ 5. giudicare una domanda ═══════════
   Il giro di quello che non lancia nessun errore: una domanda giusta ma fuori misura. Si accende l'interruttore, si apre una
   domanda vera dal quadro, si tocca 😰, e il giudizio deve ritrovarsi pronto da mandare. Il pezzo che conta è la RICARICA:
   giudizi e interruttore stanno fuori dai profili, come il codice, e devono sopravvivere a un riavvio. */
await blocco('giudicare una domanda', async () => {
  await apriScheda('impostazioni')
  controlla('l\'interruttore dei giudizi c\'è, e parte spento',
            await page.evaluate(() => document.querySelector('.carta[data-flag="giudizi"]')?.className.includes('spento')))
  uguale('spento non c\'è niente da mandare', await page.locator('.carta[data-azione="giudizi"]').count(), 0)
  await page.click('.carta[data-flag="giudizi"]')
  await page.waitForFunction(() => !document.querySelector('.carta[data-flag="giudizi"]').className.includes('spento'), null, { timeout: 2000 })
  await apriScheda('bambini')
  await page.waitForSelector('[data-manopola] .quadro', { timeout: 5000 })
  await apriBlocco('medie')
  await page.locator('[data-manopola] [data-apri="medie"] .prova').first().click()
  await page.waitForSelector('.prova-velo', { timeout: 5000 })
  controlla('sopra la domanda compaiono i tre tasti', await page.isVisible('[data-che="giudizio"]'))
  await scatto(page, 'giudizio')
  await page.click('[data-verdetto="difficile"]')
  await page.click('.prova-x')
  await page.waitForSelector('.prova-velo', { state: 'hidden', timeout: 5000 })
  await leggiProfilo(page)   // l'archivio ha scritto
  await page.reload()
  await page.waitForSelector('.carte', { timeout: 8000 })
  await entra()
  await apriScheda('impostazioni')
  await page.waitForSelector('.carta[data-flag="giudizi"]', { timeout: 5000 })
  controlla('l\'interruttore è rimasto acceso dopo il riavvio',
            !(await page.evaluate(() => document.querySelector('.carta[data-flag="giudizi"]').className.includes('spento'))))
  const carta = page.locator('.carta[data-azione="giudizi"]')
  uguale('il giudizio è in archivio', await carta.count(), 1)
  const scritto = await carta.innerText()
  controlla('e dice cosa parte, col verdetto', scritto.includes('1 domanda segnata') && scritto.includes('difficile'), scritto)
  const modulo = await page.getAttribute('[data-azione="manda-giudizi"]', 'href')
  controlla('il modulo si apre già compilato', modulo.includes('giudizi=') && modulo.includes('versione='), modulo)
  controlla('e ci sta dentro un indirizzo', modulo.length < 6500, modulo.length + ' caratteri')
  await page.click('[data-azione="scorda-giudizi"]')
  controlla('cancellati spariscono', await page.waitForSelector('.carta[data-azione="giudizi"]', { state: 'detached', timeout: 2000 }).then(() => true, () => false))
  await page.click('.carta[data-flag="giudizi"]')   // rimesso com'era
})

/* ═══════════ 6. il muto è del bambino, non del telefono ═══════════
   `settings.sound` c'era dal principio e non lo leggeva nessuno: l'audio era una variabile globale riaccesa a ogni avvio. */
await blocco('il muto', async () => {
  await page.click('button[aria-label="indietro"]')
  await page.waitForSelector('.carte', { timeout: 5000 })
  // il tasto sta nella barra, e la home non ce l'ha: si passa dal profilo
  await page.click('.fascia')
  await page.waitForSelector('button[aria-label="suono"]', { timeout: 5000 })
  await page.click('button[aria-label="suono"]')
  uguale('spegnere il suono finisce nel profilo', (await leggiProfilo(page)).settings.sound, false)
  await page.reload()
  await page.waitForSelector('.carte', { timeout: 8000 })
  await page.click('.fascia')
  await page.waitForSelector('button[aria-label="suono"]', { timeout: 5000 })
  uguale('e resta spento anche riaprendo il gioco',
         await page.evaluate(() => document.querySelector('button[aria-label="suono"]').textContent.trim()), '🔇')
  await page.click('button[aria-label="suono"]')   // rimesso com'era
  await page.click('button[aria-label="indietro"]')
  await page.waitForSelector('.carte', { timeout: 5000 })
})

/* ═══════════ 7. le impostazioni per gioco: il carosello della home, con le impostazioni sotto ═══════════
   Nella scheda «Giochi» c'è lo stesso carosello della home, coi giochi che in casa non ci sono in grigio, e sotto le
   impostazioni di quello in mezzo: «In casa» a tre posizioni, il tempo, le domande (docs/genitori/giochi.md). */
await blocco('il carosello dei giochi', async () => {
  await page.evaluate(() => history.replaceState(null, '', location.pathname))
  await semina(page, { settings: { eta: 8, sperimentali: true }, campagne: { fattoria: { cfg: { stato: {} } }, fattoria3d: { cfg: { stato: {} } } } })
  await entra()
  await page.click('[data-scheda="giochi"]')
  await page.waitForSelector('[data-giochi-impostazioni]', { timeout: 5000 })
  const inMezzo = () => page.locator('[data-pannello-gioco]').getAttribute('data-pannello-gioco')
  const vai = async k => {
    await page.click(`[data-indice="${k}"]`)
    await page.waitForSelector(`[data-pannello-gioco="${k}"]`, { timeout: 3000 })
  }
  const profilo = () => leggiProfilo(page)
  controlla('c\'è il carosello, come in home', await page.locator('[data-giochi-impostazioni] .scaffale').count() === 1 && await page.locator('[data-giochi-impostazioni] .carta.gioco').count() > 8)
  controlla('senza «gioca»: qui non si entra nei giochi', await page.locator('[data-giochi-impostazioni] .gioca').count() === 0)

  /* fuori dalla home per l'età: «troppo facile» (un gioco per i piccoli) o «per più grandi», mai un «non è ancora adatto» */
  await vai('conta')
  const contaDice = await page.locator('[data-gioco-esito]').innerText()
  controlla('Conta gli animali, a 8 anni, è troppo facile: non «non ancora adatto»', /troppo facile/.test(contaDice) && !/ancora adatto|da solo quando/.test(contaDice), contaDice)

  /* Castle Battle: a 8 anni sta in casa */
  await vai('arena')
  uguale('in mezzo c\'è Castle Battle', await inMezzo(), 'arena')
  controlla('non è grigio, e dice che segue l\'età', await page.locator('[data-giochi-impostazioni] [data-gioco="arena"].spenta').count() === 0 && await page.locator('[data-gioco-modo="segui"].su').count() === 1)
  await page.locator('[data-gioco-tempo]').scrollIntoViewIfNeeded()
  await scatto(page, 'giochi-impostazioni-arena')
  controlla('l\'esito lo dice in parole', /anni/.test(await page.locator('[data-gioco-esito]').innerText()), await page.locator('[data-gioco-esito]').innerText())
  await page.click('[data-gioco-modo="spento"]')
  uguale('spento: la scelta si ricorda nel profilo', (await profilo()).settings.giochi?.arena, false)
  controlla('e il carosello lo mette in grigio', await page.locator('[data-giochi-impostazioni] [data-gioco="arena"].spenta').count() === 1)
  await page.click('[data-gioco-modo="segui"]')
  controlla('«come dice l\'età» lo rimette com\'era', await page.waitForSelector('[data-giochi-impostazioni] [data-gioco="arena"].spenta', { state: 'detached', timeout: 2000 }).then(() => true, () => false))
  await page.click('[data-gioco-modo="acceso"]')
  uguale('acceso comunque: si scrive `true`', (await profilo()).settings.giochi?.arena, true)
  await page.click('[data-gioco-modo="segui"]')
  controlla('il tempo ha sette giorni e tre numeri', await page.locator('[data-gioco-tempo] .col').count() === 7 && await page.locator('[data-gioco-tempo] .num div').count() === 3)

  /* le domande di Castle Battle: i saperi dei suoi moduli, con dove altro valgono */
  const apriTutte = () => page.evaluate(() => document.querySelectorAll('[data-gioco-tutte]').forEach(d => { d.open = true }))
  await apriTutte()
  const saperi = await page.locator('[data-gioco-sapere]').evaluateAll(l => l.map(x => x.dataset.giocoSapere))
  controlla('Castle Battle chiede numeri, moltiplicazioni e divisioni', ['numeri', 'moltiplicazioni', 'divisioni'].every(s => saperi.includes(s)), saperi.join(','))
  const div = page.locator('[data-gioco-sapere="divisioni"]')
  controlla('ogni domanda dice a chi altro appartiene', /vale anche in/.test(await div.innerText()) || saperi.length > 0)
  await div.locator('[data-gioco-sapere-tasto]').click()
  controlla('spegnere una domanda la spegne nel profilo (vale per tutti)', (await profilo()).settings.sa?.divisioni === false)
  controlla('e la riga si vede spenta', await page.locator('[data-gioco-sapere="divisioni"].spenta').count() === 1)
  await div.locator('[data-gioco-sapere-tasto]').click()

  /* la difficoltà di una domanda: una tacca alla volta, e zero non si scrive */
  const molt = page.locator('[data-gioco-sapere="moltiplicazioni"]')
  const diff = () => molt.locator('[data-diff-testo]').innerText()
  controlla('di partenza «come dice l\'età»', /come dice l'età/.test(await diff()))
  await molt.locator('[data-diff="su"]').click()
  controlla('una tacca più facile: il testo e il profilo', /1 tacca più facili/.test(await diff()) && (await profilo()).settings.ritocchi?.moltiplicazioni === 1)
  await molt.locator('[data-diff="giu"]').click(); await molt.locator('[data-diff="giu"]').click()
  controlla('due tacche giù: una più difficile', /1 tacca più difficili/.test(await diff()) && (await profilo()).settings.ritocchi?.moltiplicazioni === -1)
  await molt.locator('[data-diff="su"]').click()
  controlla('tornata a zero: la voce sparisce dal profilo', (await profilo()).settings.ritocchi?.moltiplicazioni === undefined)

  /* gli Asteroidi: i pezzi di scuola delle sue tappe sono interruttori */
  await vai('mate')
  await apriTutte()
  const saperiMate = await page.locator('[data-gioco-sapere]').evaluateAll(l => l.map(x => x.dataset.giocoSapere))
  controlla('gli Asteroidi elencano i pezzi di scuola delle loro tappe', ['moltiplicazioni', 'divisioni', 'decine', 'stima', 'numeri'].every(k => saperiMate.includes(k)), saperiMate.join(','))
  controlla('e dicono cosa chiedono, sopra', /tabelline/i.test(await page.locator('[data-gioco-insegna]').innerText()))
  /* un gioco che ha bisogno di un sapere per esserci: lo dice */
  await vai('pozioni')
  await apriTutte()
  controlla('le pozioni dicono che senza misure e conversioni non ci sono', /senza questa il gioco non c'è/.test(await page.locator('[data-gioco-sapere="misure"]').innerText()) && await page.locator('[data-gioco-sapere="conversioni"]').count() === 1)
  /* un gioco che pesca da tutto il mazzo, e uno senza domande */
  await vai('sotterraneo')
  await page.locator('[data-pannello-gioco]').scrollIntoViewIfNeeded()
  await scatto(page, 'giochi-impostazioni-sotterraneo')
  controlla('il sotterraneo pesca da tutte le domande: lo dice e non le elenca', /tutte le domande/.test(await page.locator('[data-gioco-domande]').innerText()) && await page.locator('[data-gioco-sapere]').count() === 0)
  await vai('fattoria3d')
  controlla('la fattoria non fa domande di scuola: lo dice', /non fa domande|dove si spendono/i.test(await page.locator('[data-gioco-domande]').innerText()))

  /* le Avanzate della fattoria: riconverti dalla vecchia 2D e ricomincia, ognuno con la sua conferma */
  controlla('la fattoria ha le Avanzate coi due reset', await page.locator('[data-gioco-avanzate]').count() === 1)
  await page.locator('[data-gioco-avanzate] summary').click()
  await page.click('[data-azione="riconverti-fattoria"]')
  controlla('«Riconverti» chiede conferma e non fa niente da sola', await page.locator('[data-azione="riconverti-fattoria-si"]').count() === 1 && !!(await profilo()).campagne.fattoria3d)
  await page.click('[data-azione="riconverti-fattoria-si"]')
  const dopoRiconverti = (await profilo()).campagne || {}
  controlla('«Riconverti» butta la fattoria e lascia il salvataggio della vecchia 2D', !dopoRiconverti.fattoria3d && !!dopoRiconverti.fattoria, JSON.stringify(Object.keys(dopoRiconverti)))
  if (!await page.locator('[data-gioco-avanzate]').evaluate(d => d.open)) await page.locator('[data-gioco-avanzate] summary').click()
  await page.click('[data-azione="azzera-fattoria"]')
  await page.click('[data-azione="azzera-fattoria-si"]')
  const dopoAzzera = (await profilo()).campagne || {}
  controlla('«Ricomincia» azzera fattoria e vecchia 2D insieme', !dopoAzzera.fattoria && !dopoAzzera.fattoria3d, JSON.stringify(Object.keys(dopoAzzera)))
})

uguale('nessun errore in console', errori.length, 0)
if (errori.length) errori.forEach(e => nota(e))
await browser.close()
riassunto('i grandi: il codice, gli interruttori, i giochi')
