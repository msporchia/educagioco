/* ═══════════════════════════════════════════════════════════════════
   I GRANDI: L'ETÀ, IL QUADRO, CHI GIOCA, LA DATA DI NASCITA
   perché: la manopola dell'età che muove una bozza e scrive solo con «Applica» (e dice prima cosa riscrive), il quadro coi nomi e le domande vere, la ✎ di una riga e «rimetti tutto», un pezzo di scuola spento che porta via il gioco che lo chiede, il flag vecchio migrato; aggiungere, rinominare ed eliminare un bambino; la data di nascita che tiene l'età aggiornata senza cambiare i giochi da sola
   a parte perché: i grandi sono tre file per preparazione: `genitori` (i salvataggi), `genitori-codice` (il tastierino e gli interruttori) e questo (quello che dipende dall'età); il conto età e fascia dalla data sta in `unita/nascita`, le partenze in `unita/partenze`

   Si tara col gesto vero —
   apri il blocco, apri la tacca, spostala, conferma — e si guarda il
   profilo scritto, non lo store.
   `node test/esegui.mjs integrazione/genitori-eta --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, semina, azzera, scatto, leggiProfilo, GIOCATORE } from '../aiuto/browser.mjs'
import { grandi, RICONOSCIBILE } from '../aiuto/genitori.mjs'
import { finche } from '../aiuto/soste.mjs'
import { controlla, uguale, nota, riassunto, blocco } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, RICONOSCIBILE())
const { entra, apriScheda, apriBlocco, apriTutto, taraSapere, taraGioco, inHome, moneteInHome } = grandi(page)

const etaScritta = () => leggiProfilo(page).then(p => p.settings.eta)
const tacca = async () => (await page.locator('[data-eta-ora]').first().innerText()).trim()
const muoviEta = async verso => {
  const prima = await tacca()
  await page.click(`[data-eta="${verso}"]`)
  await page.waitForFunction(p => document.querySelector('[data-eta-ora]')?.innerText.trim() !== p, prima, { timeout: 2000 }).catch(() => {})
}
const applicaEta = async () => {
  await page.click('[data-azione="eta-applica"]')
  await page.waitForSelector('[data-conferma="eta"]', { state: 'detached', timeout: 3000 })
}

/* ═══════════ 1. l'età sta nel bambino, con la manopola e il quadro sotto ═══════════ */
await blocco('la manopola dell\'età', async () => {
  await entra()
  await apriScheda('bambini')
  await page.waitForSelector('.carta.chi-gioca', { timeout: 5000 })
  await page.waitForSelector('[data-manopola] .quadro', { timeout: 5000 })
  controlla('il quadro dell\'età sta nel bambino, col suo quadro', await page.isVisible('[data-manopola] .quadro'))
  const anniPrima = await tacca()
  const etaInizio = await etaScritta()
  await muoviEta('su')
  controlla('e si sposta di mezzo anno per volta', (await tacca()) !== anniPrima, `${anniPrima} → ${await tacca()}`)
  /* muovere non è applicare: la tacca muove una bozza e il quadro sotto diventa l'anteprima; prima si scriveva a ogni tacca */
  uguale('ma muovere la tacca non scrive ancora niente', await etaScritta(), etaInizio)
  controlla('e il cartello per applicare si vede', await page.isVisible('[data-conferma="eta"]'))
  await applicaEta()
  /* il numero scritto è quello che la tacca mostrava: un profilo che si sposta di suo da fuori non si distingue */
  const inNumero = t => { const n = Number(String(t).match(/\d+/)?.[0]); return /mezzo/.test(t) ? n + 0.5 : n }
  uguale('applicando finisce nel profilo, col numero che la tacca mostrava', await etaScritta(), inNumero(await tacca()))
  uguale('applicato, il cartello se ne va', await page.locator('[data-conferma="eta"]').count(), 0)

  /* il quadro dice cosa succede a quell'età: i giochi in casa e i gruppi di domande, ognuno che si apre coi nomi dentro */
  controlla('sotto la tacca c\'è l\'elenco dei giochi con lo stato addosso', (await page.locator('[data-manopola] [data-apri="giochi"]').count()) > 0)
  controlla('e i quattro livelli di padronanza', (await page.locator('[data-manopola] [data-apri="medie"]').count()) > 0)
  await page.click('[data-manopola] [data-apri="giochi"]')
  await page.waitForSelector('[data-manopola] .elenco li', { timeout: 5000 })
  controlla('aperto, ogni gioco dice come si chiama e come sta messo', await page.evaluate(() => {
    const t = document.querySelector('[data-manopola] .elenco').innerText
    return t.includes('La fattoria') && /c'è|arriva più avanti|già passato/.test(t)
  }))
  await page.click('[data-manopola] [data-apri="giochi"]')

  /* due livelli: un blocco si apre sui pezzi di scuola, un pezzo sulle sue domande. E ogni riga si può provare: il ▶ apre la
     domanda vera, generata dallo stesso modulo; il `.stop` sul tasto è la parte che si rompe in silenzio */
  await page.click('[data-manopola] [data-apri="medie"]')
  await page.waitForSelector('[data-manopola] [data-apri="medie"] .prova', { timeout: 5000 })
  const quanteRighe = () => page.locator('[data-manopola] [data-apri="medie"] .elenco li').count()
  const soloPezzi = await quanteRighe()
  await page.locator('[data-manopola] [data-apri="medie"] .elenco li').first().click()
  await page.waitForFunction(n => document.querySelectorAll('[data-manopola] [data-apri="medie"] .elenco li').length > n, soloPezzi, { timeout: 2000 }).catch(() => {})
  controlla('un pezzo di scuola si apre sulle sue domande', (await quanteRighe()) > soloPezzi, `${soloPezzi} → ${await quanteRighe()}`)
  controlla('e le domande stanno rientrate sotto di lui', (await page.locator('[data-manopola] [data-apri="medie"] .elenco .voce-riga.dentro').count()) > 0)
  await page.locator('[data-manopola] [data-apri="medie"] .prova').first().click()
  await page.waitForSelector('.prova-velo', { timeout: 5000 })
  controlla('il ▶ di una riga apre la domanda vera', await page.isVisible('.prova-velo'))
  const conta = (await page.locator('[data-conta]').innerText().catch(() => 'nessun contatore')).trim()
  controlla('e il ▶ di un pezzo di scuola scorre solo le sue, di quella fascia', /^\d+ di \d+$/.test(conta), conta)
  controlla('e il gruppo da cui si è partiti è rimasto aperto', (await page.locator('[data-manopola] [data-apri="medie"] .prova').count()) > 0)
  await page.click('.prova-x')
  await page.waitForSelector('.prova-velo', { state: 'hidden', timeout: 5000 })
})

/* ═══════════ 2. la ✎ di una riga, e il tasto che rimette tutto ═══════════
   La correzione piccola vive dentro la riga: non scrive muovendosi, scrive il verso giusto (a destra più difficile, nel
   profilo il segno è l'opposto), e quello che ha spostato resta ambra anche a tacca chiusa. */
await blocco('la ✎ di una riga', async () => {
  const ritocchiScritti = async () => (await leggiProfilo(page)).settings.ritocchi || {}
  const quanteAmbra = async () => {
    for (const k of ['facili', 'medie', 'toste', 'sotto']) await apriBlocco(k)
    return page.locator('[data-manopola] .voce-riga.ritoccata').count()
  }
  const ambraPrima = await quanteAmbra()
  await apriBlocco('medie')
  controlla('una riga del quadro ha due tasti soli: la ✎ e il ▶', (await page.locator('[data-manopola] [data-apri="medie"] .matita').count()) > 0)
  uguale('e prima di toccarla non c\'è nessun ritocco nel profilo', Object.keys(await ritocchiScritti()).length, 0)
  await page.locator('[data-manopola] [data-apri="medie"] .matita').first().click()
  await page.waitForSelector('[data-taratura]', { timeout: 5000 })
  const tarata = await page.locator('[data-taratura]').first().getAttribute('data-taratura')
  const dettoPrima = (await page.locator('[data-tara-ora]').first().innerText()).trim()
  await page.click('[data-tara="su"]')
  uguale('muovere la tacca non scrive niente, come quella dell\'età', Object.keys(await ritocchiScritti()).length, 0)
  await page.click('[data-tara="applica"]')
  await page.waitForSelector('[data-taratura]', { state: 'detached', timeout: 3000 }).catch(() => {})
  const ritocchi = await ritocchiScritti()
  uguale('confermando finisce nel profilo, sotto la chiave di quella riga', Object.keys(ritocchi).join(' '), tarata)
  uguale('e uno scatto verso destra vuol dire «per lui è più difficile»', ritocchi[tarata], -1, `${dettoPrima} → ${JSON.stringify(ritocchi)}`)
  controlla('la riga spostata resta ambra, anche a tacca chiusa', (await quanteAmbra()) > ambraPrima)
  uguale('e la tacca si chiude da sé', await page.locator('[data-taratura]').count(), 0)
  /* rimettere com'era non lascia niente in giro: un ritocco a zero non si scrive (`ritocca()` lo cancella) */
  await page.locator(`[data-tara-apri="${tarata}"]`).first().click()
  await page.waitForSelector('[data-tara="rimetti"]', { timeout: 5000 })
  await page.click('[data-tara="rimetti"]')
  await page.waitForSelector('[data-taratura]', { state: 'detached', timeout: 3000 }).catch(() => {})
  uguale('e «rimettila com\'era» non lascia nemmeno uno zero', Object.keys(await ritocchiScritti()).length, 0)
  uguale('e la riga torna com\'era', await quanteAmbra(), ambraPrima)

  /* il tasto che rimette tutto: dopo un po' nessuno ricorda cosa ha toccato. Deve dire cosa perde prima di farlo (che si
     nasconda quando non c'è niente lo prova `unita/partenze`) */
  const etaDiPrima = await etaScritta()
  await page.locator(`[data-tara-apri="${tarata}"]`).first().click()
  await page.waitForSelector('[data-taratura]', { timeout: 5000 })
  await page.click('[data-tara="su"]')
  await page.click('[data-tara="applica"]')
  await page.waitForSelector('[data-azione="rimetti-difetti"]', { timeout: 5000 })
  controlla('con qualcosa a mano compare, e dice cosa hai messo', (await page.locator('[data-perde-tutto]').innerText()).includes('domanda ritoccata'),
            (await page.locator('[data-azione="rimetti-difetti"]').innerText()).replace(/\n/g, ' · '))
  await page.click('[data-azione="rimetti-difetti"]')
  await page.waitForSelector('[data-azione="rimetti-no"]', { timeout: 5000 })
  controlla('e prima di farlo chiede, dicendo che i progressi non si toccano', await page.locator('[data-azione="rimetti-si"]').isVisible())
  await page.click('[data-azione="rimetti-no"]')
  uguale('«lascia stare» non tocca niente', Object.keys(await ritocchiScritti()).length, 1)
  await page.click('[data-azione="rimetti-difetti"]')
  await page.waitForSelector('[data-azione="rimetti-si"]', { timeout: 5000 })
  await page.click('[data-azione="rimetti-si"]')
  uguale('confermando, i ritocchi spariscono', Object.keys(await ritocchiScritti()).length, 0)
  uguale('e il tasto se ne va con loro', await page.locator('[data-azione="rimetti-difetti"]').count(), 0)
  uguale('l\'età invece resta dov\'era', await etaScritta(), etaDiPrima)
  await page.click('[data-manopola] [data-apri="medie"]')
  await muoviEta('giu')      // rimesso com'era
  await applicaEta()
  await scatto(page, 'genitori-domande')
})

/* ═══════════ 3. spegnere un pezzo di scuola, e il gioco che lo chiede ═══════════
   Si spegne «Le conversioni»: è il pezzo di scuola che porta via il laboratorio delle pozioni, e quindi l'unico il cui effetto
   si vede anche dalla home. Il gesto è l'ultimo scatto della tacca. La catena va fino al profilo, a un riavvio e alla home. */
await blocco('un pezzo di scuola spento', async () => {
  await apriScheda('bambini')
  await apriTutto()
  controlla('c\'è la riga delle conversioni, con la sua ✎', (await page.locator('[data-tara-apri="conversioni"]').count()) > 0)
  await taraSapere('conversioni', 'via')
  const dopoSpento = await leggiProfilo(page)
  uguale('l\'ultimo scatto spegne il pezzo di scuola, nel profilo', dopoSpento.settings.sa.conversioni, false)
  /* i decimali li ha spenti «rimetti com'era»: la fascia «quarta» li spegne da sé */
  uguale('e solo quello: acceso resta l\'assenza', Object.keys(dopoSpento.settings.sa).sort().join(' '), 'conversioni decimali')
  await apriBlocco('spenta')
  controlla('e le sue domande finiscono nel blocco di quello che hai tolto',
            (await page.locator('[data-manopola] [data-apri="spenta"] [data-riga="conversioni"]').count()) > 0)
  /* il laboratorio delle pozioni è fatto tutto di conversioni: sparisce dalla home, e nel quadro la sua riga dice perché */
  const POZIONI = '.carta.gioco[data-gioco="pozioni"]'
  controlla('il laboratorio delle pozioni sparisce dalla home', !(await inHome(POZIONI)))
  await entra()
  await apriScheda('bambini')
  await page.waitForSelector('[data-manopola]', { timeout: 5000 })
  await apriBlocco('giochi')
  const riga = (await page.locator('[data-manopola] [data-riga="pozioni"]').innerText()).replace(/\n/g, ' · ')
  controlla('e la sua riga dice perché, invece di dire solo «spento»', riga.toLowerCase().includes('conversioni'), riga)
  /* riacceso, torna tutto, da dove è finito: il blocco in fondo è il posto dove si va a ripescare */
  await taraSapere('conversioni', 'rimetti')
  uguale('rimettendola, la voce sparisce dal profilo', (await leggiProfilo(page)).settings.sa?.conversioni, undefined)
  controlla('e il gioco torna in home', await inHome(POZIONI))

  /* la migrazione del flag vecchio: `settings.divisioni: false` diventa il macrogruppo spento, e le divisioni restano spente
     (riaccenderle rimetterebbe nel castello i calcoli che quel bambino non sa fare) */
  const vecchio = await leggiProfilo(page)
  await semina(page, { settings: { ...vecchio.settings, sa: {}, divisioni: false } })
  const migrato = await finche(() => leggiProfilo(page), p => p.settings.divisioni === undefined, 3000)
  uguale('il vecchio flag diventa il macrogruppo spento', migrato.settings.sa?.divisioni, false)
  uguale('e il flag vecchio sparisce', migrato.settings.divisioni, undefined)
})

/* ═══════════ 4. chi gioca: aggiungere, rinominare, eliminare ═══════════
   Si provano dallo schermo e non dallo store: un'API giusta dietro una schermata che non la offre non serve a niente. La
   schermata è di chi sta giocando adesso: una carta sola, gli altri sono una riga di nomi. */
await blocco('chi gioca', async () => {
  await entra()
  await apriScheda('bambini')
  await page.waitForSelector('.carta[data-azione="aggiungi-giocatore"]', { timeout: 5000 })
  uguale('la carta è una sola: quella di chi gioca adesso', await page.locator('.carta.chi-gioca').count(), 1)
  uguale('e con un bambino solo non c\'è nessuna riga di altri', await page.locator('[data-altri-giocatori]').count(), 0)
  /* aggiungere è lo stesso wizard del primo avvio, e finisce entrando in partita con lui */
  await page.click('.carta[data-azione="aggiungi-giocatore"]')
  await page.waitForSelector('.benvenuto', { timeout: 5000 })
  controlla('si aggiunge dalla stessa schermata del primo avvio, e si può lasciare stare', await page.isVisible('[data-azione="lascia-stare"]'))
  uguale('col campo vuoto non si va avanti', await page.isDisabled('.via'), true)
  await page.fill('.benvenuto .nome', 'Federica')
  await page.click('.benvenuto .via')
  await page.waitForSelector('[data-nascita-domanda]', { timeout: 5000 })
  /* col solo nome non si aggiunge: l'età esce dalla data */
  uguale('senza la data non si entra', await page.isDisabled('[data-azione="si-gioca"]'), true)
  const oggi = new Date()
  const annoScol = oggi.getMonth() >= 8 ? oggi.getFullYear() : oggi.getFullYear() - 1
  await page.selectOption('[data-nascita-mese]', String(oggi.getMonth()))
  await page.selectOption('[data-nascita-anno]', String(annoScol - 8))
  await page.waitForSelector('[data-nascita-eta]', { timeout: 3000 })
  controlla('e la data dice in che classe è', /terza elementare/.test(await page.locator('[data-nascita-eta]').innerText()))
  await page.click('[data-azione="si-gioca"]')
  await page.waitForSelector('.carte', { timeout: 8000 })
  controlla('finito il wizard si è in home, a giocare con lui', await page.isVisible('.carta.gioco'))
  const altriNelProfilo = async () => {   // gli altri bambini si scelgono dal profilo, dalla riga in cima alla home
    await page.click('[data-azione="profilo"]')
    await page.waitForSelector('[data-profilo]', { timeout: 5000 })
    const n = await page.locator('[data-giocatore]').count()
    await page.click('button[aria-label="indietro"]')
    await page.waitForSelector('.carta.gioco', { timeout: 5000 })
    return n
  }
  uguale('e adesso il profilo lascia scegliere l\'altro', await altriNelProfilo(), 1)
  uguale('chi entra la prima volta parte da zero, non con le monete dell\'altro', await moneteInHome(), 0)
  /* l'età ha fatto qualcosa, vista dalla home: otto anni toglie i giochi per i più piccoli e lascia il resto */
  controlla('a chi comincia a otto anni i giochi per i piccoli non compaiono',
            !(await page.isVisible('.carta[data-gioco="conta"]')) && !(await page.isVisible('.carta[data-gioco="prima"]')))
  controlla('ma il castello c\'è, e gli asteroidi pure', await page.isVisible('.carta.gioco[data-gioco="torri"]') && await page.isVisible('.carta.mate'))

  /* rinominare tocca l'etichetta e non i progressi */
  await entra()
  await apriScheda('bambini')
  await page.waitForSelector('.carta.chi-gioca', { timeout: 5000 })
  controlla('la carta è di chi gioca, cioè Federica', await page.isVisible('.carta.chi-gioca:has-text("Federica")'))
  uguale('e gli altri sono una riga di nomi, col fratello', await page.locator(`[data-altri-giocatori]:has-text("${GIOCATORE}")`).count(), 1)
  await page.click('.carta.chi-gioca button[data-azione="rinomina"]')
  await page.waitForSelector('.carta.aperta .nome', { timeout: 5000 })
  await page.fill('.carta.aperta .nome', 'Fede')
  await page.click('.carta.aperta button[type="submit"]')
  controlla('il nome cambia', await page.waitForSelector('.carta.chi-gioca:has-text("Fede"):not(:has-text("Federica"))', { timeout: 3000 }).then(() => true, () => false))
  controlla('e non se n\'è creato un altro: gli altri restano uno', await page.isVisible(`[data-altri-giocatori]:has-text("${GIOCATORE}")`))
  uguale('con una carta sola, che è di chi gioca', await page.locator('.carta.chi-gioca').count(), 1)
  /* eliminare chiede conferma: l'unico gesto che butta via i progressi di qualcuno senza ritorno */
  await page.click('.carta.chi-gioca button[data-azione="elimina"]')
  await page.waitForSelector('.carta.pericolo.aperta', { timeout: 5000 })
  controlla('eliminare chiede conferma', await page.isVisible('text="Sì, elimina"'))
  await page.click('text="No, lascia stare"')
  controlla('e si può tornare indietro', await page.waitForSelector('.carta.pericolo.aperta', { state: 'detached', timeout: 2000 }).then(() => true, () => false) &&
            await page.isVisible('.carta.chi-gioca:has-text("Fede")'))
  await page.click('.carta.chi-gioca button[data-azione="elimina"]')
  await page.click('text="Sì, elimina"')
  await page.waitForSelector('.carta.gioco', { timeout: 8000 })
  /* si eliminava chi stava giocando: si va in home, dove si sceglie chi gioca */
  controlla('eliminato chi giocava si torna in home', await page.isVisible('.carta.gioco'))
  uguale('e resta un bambino solo', await altriNelProfilo(), 0)
  controlla('e con lui è sparito il suo salvataggio', !(await page.evaluate(() => new Promise(ok => {
    const r = indexedDB.open('giochi-bambini', 1)
    r.onsuccess = () => {
      const g = r.result.transaction('kv', 'readonly').objectStore('kv').getAllKeys()
      g.onsuccess = () => ok(g.result.some(k => String(k).startsWith('profilo:g')))
    }
  }))))
})

/* ═══════════ 5. la manopola che riscrive, e la conferma ═══════════
   Spostarsi di fascia riscrive giochi e saperi, ma lo dice prima e solo quando c'è davvero qualcosa da riscrivere: chiedere
   sempre è un questionario, non chiedere mai è una trappola. Riscrive, quindi sta in fondo. */
await blocco('la manopola che riscrive', async () => {
  await entra()
  await taraGioco('sotterraneo', 'no')   // un gioco spento a mano: è quello che la conferma deve annunciare
  await apriScheda('bambini')
  await page.waitForSelector('[data-manopola]', { timeout: 5000 })
  const monetePrima = (await leggiProfilo(page)).coins
  const etaPrima = await etaScritta()

  /* mezzo anno dentro la stessa fascia: si sposta solo la mira, e quello messo a mano resta */
  await page.click('[data-eta="su"]')
  await page.waitForSelector('[data-conferma="eta"]', { timeout: 5000 })
  controlla('dentro la stessa fascia il cartello dice che non porta via niente',
            await page.evaluate(() => document.querySelector('[data-conferma="eta"]').innerText.includes('si sposta solo la mira')))
  uguale('e non c\'è nessun avviso di roba che se ne va', await page.locator('[data-conferma="eta"] [data-perde]').count(), 0)
  uguale('finché non si applica, l\'età non si muove', await etaScritta(), etaPrima)
  await applicaEta()
  const mezzo = await leggiProfilo(page)
  uguale('applicando si sposta davvero', mezzo.settings.eta, etaPrima + 0.5)
  controlla('col gioco spento a mano rimasto spento', mezzo.settings.giochi.sotterraneo === false)
  await muoviEta('giu')          // rimesso com'era
  await applicaEta()

  /* la tacca che cambia fascia: le scelte a mano tornerebbero al difetto, e va detto prima, coi numeri */
  await page.click('[data-eta="giu"]')
  await page.waitForSelector('[data-conferma="eta"] [data-perde]', { timeout: 5000 })
  const conferma = await page.locator('[data-conferma="eta"]').innerText()
  controlla('cambiando fascia con roba sistemata a mano lo si legge prima', conferma.includes('tornano di partenza'), conferma)
  controlla('e si dice cosa si perde, non «sei sicuro?»', conferma.includes('a mano'), conferma)
  uguale('e finché non si applica l\'età non si muove', await etaScritta(), etaPrima)
  /* il cartello sta appiccicato in fondo allo schermo: in coda alla colonna nessuno lo vedeva */
  const doveIlCartello = await page.locator('[data-conferma="eta"]').boundingBox()
  controlla('e si vede senza scorrere, appiccicato in fondo',
            !!doveIlCartello && doveIlCartello.y + doveIlCartello.height <= page.viewportSize().height + 2, JSON.stringify(doveIlCartello))
  /* «Annulla» non sposta niente, e rimette la tacca sull'età vera */
  await page.click('[data-azione="eta-annulla"]')
  await page.waitForSelector('[data-conferma="eta"]', { state: 'detached', timeout: 3000 }).catch(() => {})
  const annullato = await leggiProfilo(page)
  controlla('annullando, il gioco spento resta spento', annullato.settings.giochi.sotterraneo === false)
  uguale('e l\'età nemmeno', annullato.settings.eta, etaPrima)
  uguale('la tacca torna sull\'età vera', await tacca(), etaPrima % 1 ? `${Math.floor(etaPrima)} anni e mezzo` : `${etaPrima} anni`)
  uguale('e il cartello sparisce', await page.locator('[data-conferma="eta"]').count(), 0)
  await page.click('[data-eta="giu"]')
  await page.waitForSelector('[data-conferma="eta"]', { timeout: 5000 })
  await applicaEta()
  controlla('applicando lo dice invece di restare muta', await page.waitForFunction(() => document.body.innerText.includes('è tarato su'), null, { timeout: 2000 }).then(() => true, () => false))
  const sceso = await leggiProfilo(page)
  uguale('e stavolta si è mosso', sceso.settings.eta, etaPrima - 0.5)
  controlla('con le scelte a mano ripartite dai difetti', sceso.settings.giochi.sotterraneo === undefined)
  /* sei tacche sono un solo Applica: la bozza si muove quanto si vuole e si scrive una volta */
  for (let i = 0; i < 6; i++) await muoviEta('giu')
  uguale('sei tacche, e il profilo è ancora fermo', await etaScritta(), etaPrima - 0.5)
  await applicaEta()
  uguale('un Applica solo, fino in fondo', await etaScritta(), etaPrima - 3.5)
  await page.click('button[aria-label="indietro"]')
  await page.waitForSelector('.carte', { timeout: 5000 })
  const dopoFascia = await page.evaluate(() => [...document.querySelectorAll('.carta.gioco[data-gioco]')].map(c => c.dataset.gioco))
  controlla('e in home restano solo i giochi per i piccoli', dopoFascia.includes('conta') && !dopoFascia.includes('torri'), dopoFascia.join(','))
  /* l'età decide cosa si vede, non cancella niente di quello che è stato guadagnato */
  uguale('i progressi non si sono mossi', (await leggiProfilo(page)).coins, monetePrima)
})

/* ═══════════ 6. la data di nascita ═══════════
   Nel modulo del bambino nuovo mese e anno sono obbligatori; nelle impostazioni c'è «Quando è nato». Se la data dice un'età
   diversa da quella su cui il gioco è tarato: nella stessa fascia si aggiorna in silenzio, se cambia la fascia c'è un avviso
   nella posta dei grandi e la scelta si fa dalle impostazioni (docs/genitori/riordino.md). Ognuno su una pagina sua. */
const oggi = new Date()
/* la classe in cui sta adesso corrisponde a `n` anni (terza = 8): conta l'anno scolastico, che cambia a settembre */
const annoScol = oggi.getMonth() >= 8 ? oggi.getFullYear() : oggi.getFullYear() - 1
const nato = n => ({ m: oggi.getMonth(), a: annoScol - n })
const pagine = []
const paginaCon = async settings => {
  const p = await apriGioco(browser)
  pagine.push(p)
  await semina(p.page, { settings })
  return p.page
}
const etaDi = async (p, id) => (await leggiProfilo(p, id))?.settings

await blocco('la data nel bambino nuovo', async () => {
  const p = await apriGioco(browser, { giocatori: null, attesa: '.benvenuto' })
  pagine.push(p)
  const q = p.page
  await q.fill('.benvenuto .nome', 'Prova')
  await q.click('.benvenuto .via')
  await q.waitForSelector('[data-nascita-domanda]', { timeout: 5000 })
  await q.selectOption('[data-nascita-mese]', String(nato(7).m))
  await q.selectOption('[data-nascita-anno]', String(nato(7).a))
  await q.waitForSelector('[data-nascita-eta]', { timeout: 3000 })
  controlla('con la data dice in che classe è', /seconda elementare/.test(await q.locator('[data-nascita-eta]').innerText()))
  await q.click('[data-azione="si-gioca"]')
  await q.waitForSelector('.carte', { timeout: 8000 })
  // il bambino nuovo ha un id che non conosciamo: è l'unico profilo in archivio
  const id = await q.evaluate(() => new Promise(ok => {
    const r = indexedDB.open('giochi-bambini', 1)
    r.onsuccess = () => { const k = r.result.transaction('kv', 'readonly').objectStore('kv').getAllKeys(); k.onsuccess = () => ok(k.result.find(x => String(x).startsWith('profilo:')).slice(8)) }
  }))
  const s = await finche(() => etaDi(q, id), s => !!s?.nascita, 3000)
  controlla('il profilo ha la data e l\'età', s?.nascita?.a === nato(7).a && s.nascita.m === nato(7).m && s.eta === 7, JSON.stringify(s))
  uguale('e nessuno scarto: i giochi sono tarati sui suoi anni', s?.scarto, 0)
})

await blocco('un compleanno nella stessa fascia', async () => {
  const q = await paginaCon({ eta: 9, nascita: nato(10), scarto: 0 })
  const s = await finche(() => etaDi(q), s => s?.eta === 10, 4000)
  uguale('9 e 10 anni sono la stessa fascia: l\'età va a 10 da sola', s?.eta, 10)
  controlla('e nessun avviso per i grandi', await q.locator('[data-nastro="posta"]').count() === 0)
})

await blocco('un compleanno che cambia fascia: tenerlo', async () => {
  const q = await paginaCon({ eta: 7, nascita: nato(9), scarto: 0 })
  await q.waitForSelector('[data-nastro="posta"]', { timeout: 6000 })
  controlla('in home il nastro per i grandi, senza dire cosa', await q.locator('[data-nastro="posta"]').isVisible())
  uguale('l\'età non si è mossa da sola', (await etaDi(q)).eta, 7)
  const g = grandi(q)
  await g.entra()
  await q.waitForSelector('[data-posta]', { timeout: 5000 })
  const posta = await q.locator('[data-posta]').innerText()
  controlla('nella posta: dice 9 anni e non cambia niente da solo', /9 anni/.test(posta) && /Non cambio niente/.test(posta), posta)
  await q.click('[data-scheda="bambini"]')
  await q.waitForSelector('[data-nascita-avviso]', { timeout: 5000 })
  const avviso = await q.locator('[data-nascita-avviso]').innerText()
  controlla('nelle impostazioni dice cosa succede passando ai 9 anni', /9 anni/.test(avviso) && /7/.test(avviso), avviso)
  await q.click('[data-azione="nascita-tieni"]')
  await q.waitForSelector('[data-nascita-avviso]', { state: 'detached', timeout: 3000 }).catch(() => {})
  controlla('«tienilo a 7»: l\'avviso sparisce e resta lo scarto di due anni',
            await q.locator('[data-nascita-avviso]').count() === 0 && /due anni più indietro|2 anni più indietro/.test(await q.locator('[data-nascita-scarto]').innerText()),
            await q.locator('[data-nascita]').innerText())
  uguale('e nel profilo lo scarto è −2', (await etaDi(q)).scarto, -2)
})

await blocco('un compleanno che cambia fascia: passare', async () => {
  const q = await paginaCon({ eta: 7, nascita: nato(9), scarto: 0 })
  await grandi(q).entra()
  await q.click('[data-scheda="bambini"]')
  await q.waitForSelector('[data-nascita-avviso]', { timeout: 5000 })
  await q.click('[data-azione="nascita-passa"]')
  const e = await finche(async () => (await q.locator('[data-conferma]').count()) ? 'conferma' : (await etaDi(q)).eta, v => v === 9 || v === 'conferma', 3000)
  controlla('«passa ai 9 anni»: l\'età va a 9 (con la conferma della manopola, se serve)', e === 9 || e === 'conferma', String(e))
})

await blocco('una data messa dopo', async () => {
  const q = await paginaCon({ eta: 8 })
  await grandi(q).entra()
  await q.click('[data-scheda="bambini"]')
  await q.waitForSelector('[data-nascita]', { timeout: 5000 })
  controlla('senza data la carta la chiede', await q.locator('[data-nascita-mese]').count() === 1)
  await q.selectOption('[data-nascita-mese]', String(nato(8).m))
  await q.selectOption('[data-nascita-anno]', String(nato(8).a))
  await q.click('[data-azione="nascita-salva"]')
  await q.waitForSelector('[data-nascita-eta]', { timeout: 3000 })
  controlla('la data si ricorda e dice 8 anni', /8 anni/.test(await q.locator('[data-nascita-eta]').innerText()))
  controlla('l\'età combacia: nessun avviso', await q.locator('[data-nascita-avviso]').count() === 0)
  uguale('nel profilo lo scarto è zero', (await etaDi(q)).scarto, 0)
  await q.click('[data-azione="nascita-togli"]')
  controlla('si può togliere', await q.waitForSelector('[data-nascita-mese]', { timeout: 3000 }).then(() => true, () => false))
})

const tutti = [...errori, ...pagine.flatMap(p => p.errori)]
uguale('nessun errore in console', tutti.length, 0)
if (tutti.length) tutti.forEach(e => nota(e))
await browser.close()
riassunto('i grandi: l\'età, il quadro, chi gioca, la data di nascita')
