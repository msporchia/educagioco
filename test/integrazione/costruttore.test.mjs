/* ═══════════════════════════════════════════════════════════════════
   IL COSTRUTTORE, NEL BROWSER

   perché: il programma del robot si scrive col dito (＋, blocchi, caselle) e poi gira: ▶, cartello, riga accesa all'errore, «annulla», scelte che non nascono fatte, ✂, il porto e la torre del casaro; e si salva anche se la pagina sparisce
   a parte perché: è il giro intero del Robot dentro un cantiere; la scheda dei led (scheda-costruttore) è un'altra schermata, col dito vero e i viaggi del robot, e il linguaggio in sé lo prova il motore senza browser
   Quello che il motore non può dire: che il programma **si scrive col
   dito** e poi gira. Si entra dalla home, si scrive la soluzione del
   primo livello toccando «＋», i blocchi e le caselle, si preme ▶ e si
   aspetta il cartello; poi un livello con tre ordini, dove la casella
   del ripeti prende la lavagnetta dell'ordine e il programma deve
   reggere tutti e tre; poi un errore apposta, che deve accendere la
   riga dove il robot si è fermato. E il programma scritto deve
   ritrovarsi dopo una ricarica, anche quando la pagina sparisce prima
   del salvataggio pigro (`visibilitychange` o `pagehide`, prima dei
   500 ms del costruttore e dei 350 dell'archivio: docs/costruttore/campagna.md),
   e una riga tolta per sbaglio tornare con «annulla».

   E le scelte non si fanno da sole: un «vai» nasce col punto di
   domanda sulla freccia e la scelta aperta sulla riga (i passi nascono
   1, e non si chiedono), un mattone in un livello con due colori nasce
   senza colore, un ripeti con la N; ▶ con qualcosa da scegliere non
   parte ma apre la scelta che manca. E la mano: due righe scritte fuori
   da un ripeti ci entrano con ✂, e il programma vince.

   Poi il porto, la seconda parte: la cassetta con le frecce. E in fondo
   la torre del casaro, la ricorsione: la fila delle carte che si allunga
   mentre il progetto chiama sé stesso.

   Un livello solo si gioca fino al cartello, il primo; degli altri il
   programma scritto col dito si rilegge dall'archivio e lo prova il
   motore (`provaLivello`): che ogni soluzione vinca lo dice già
   `unita/costruttore`, e guardare il robot che la esegue costava minuti.
   `node test/esegui.mjs integrazione/costruttore --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, scatto, semina, attendi, leggiProfilo, scegli, costruisci }
  from '../aiuto/browser.mjs'
import { pronto } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto, blocco } from '../aiuto/verifica.mjs'
import { chiudiIlTraguardo } from '../aiuto/passo-passo.mjs'
import { LIVELLI } from '../../src/giochi/costruttore/dati/livelli.js'
import { FILA_ATTUALE } from '../../src/giochi/costruttore/dati/campagna.js'
import { conAttrezzi } from '../../src/giochi/costruttore/motore/attrezzi.js'
import { srotola } from '../../src/giochi/costruttore/motore/zaino.js'
import { programma } from '../../src/giochi/costruttore/dati/scrivi.js'
import { provaLivello } from '../../src/giochi/costruttore/motore/prova.js'

/* L'archivio dei programmi sta fuori dal profilo (`costruttore:<id>`):
   per provarne la lettura lo si scrive a mano, come fa `semina` coi
   profili. */
const scriviArchivio = (page, dato) => page.evaluate(d => new Promise((ok, ko) => {
  const r = indexedDB.open('giochi-bambini', 1)
  r.onerror = () => ko(new Error('IndexedDB non si apre'))
  r.onsuccess = () => {
    const tx = r.result.transaction('kv', 'readwrite')
    tx.objectStore('kv').put(d, 'costruttore:uno')
    tx.oncomplete = ok
    tx.onerror = () => ko(new Error('scrittura fallita'))
  }
}), dato)
/* il programma di un livello come l'ha salvato il gioco: si salva mezzo secondo dopo l'ultimo tocco, poi l'archivio rimanda
   di 350 ms; si aspetta finché il programma letto ha `righe` righe in cima (`null` se non arriva) */
const programmaSalvato = async (chiave, righe) => {
  for (let k = 0; k < 30; k++) {
    const d = await page.evaluate(() => new Promise(ok => {
      const r = indexedDB.open('giochi-bambini', 1)
      r.onsuccess = () => { const g = r.result.transaction('kv', 'readonly').objectStore('kv').get('costruttore:uno'); g.onsuccess = () => ok(g.result || null) }
      r.onerror = () => ok(null)
    }))
    const p = d && d.programmi && d.programmi[chiave]
    if (p && p.principale && p.principale.length === righe) return p
    await attendi(page, 100)
  }
  return null
}
// aspetta la condizione e dice se è arrivata: un'attesa scaduta è un controllo che fallisce, non un'eccezione
const arriva = (sel, timeout) => page.waitForSelector(sel, { timeout }).then(() => true, () => false)

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

// il click aspetta da sé che il bersaglio sia fermo e libero, e il gioco ridisegna prima della domanda dopo: niente attese
const tocca = sel => page.locator(sel).first().click()
/* aggiunge un blocco in fondo all'elenco indicato */
async function aggiungi(dove, blocco) {
  await tocca(`[data-aggiungi="${dove}"]`)
  await page.waitForSelector('[data-cassetta]', { timeout: 3000 })
  await pronto(page, '[data-cassetta]')   // la finestra cieca della cassetta
  await tocca(`[data-cassetta] [data-blocco="${blocco}"]`)
}
/* dalla home alla scheda, e da lì al cantiere di un livello (o del cantiere libero): un profilo con dei livelli vinti
   festeggia i traguardi in home, e il velo copre la carta del gioco tre secondi l'uno */
async function allaScheda() {
  await chiudiIlTraguardo(page)
  await scegli(page, 'costruttore')
  await page.waitForSelector('.cst-mappa', { timeout: 5000 })
}
async function alCantiere(quale, attesa = '[data-editor]') {
  await allaScheda()
  await costruisci(page, quale)
  await page.waitForSelector(attesa, { timeout: 5000 })
}
const seminaAlLivello = (tappa, stelle = {}) => semina(page, { settings: { eta: 10 },
  campagne: { costruttore: { tappa, libera: false, stelle, cfg: { velocita: 'veloce', fila: FILA_ATTUALE } } } })

/* ══════════ 1. dalla home, il primo livello scritto col dito fino al cartello ══════════ */
await blocco('il primo livello', async () => {
  await semina(page, { coins: 0, settings: { eta: 10 } })
  uguale('a dieci anni la carta del costruttore è in home, senza accendere niente',
         await page.locator('.carta.gioco[data-gioco="costruttore"]').count(), 1)
  await allaScheda()
  uguale('il gioco si chiama Il Robot', (await page.locator('b.dove').first().innerText()).trim(), 'Il Robot')
  uguale('la scheda ha un led per livello', await page.locator('[data-livello]').count(), LIVELLI.length)
  uguale('e in fondo il cantiere libero, chiuso finché il primo capitolo non è finito',
         await page.locator('[data-libero][data-stato="chiuso"]').count(), 1)
  /* la guida del primo giro comincia sulla scheda: il led 1, poi «▶ costruisci» */
  uguale('la guida indica il led del primo livello', await page.locator('[data-livello="0"][data-indicato]').count(), 1)
  await scatto(page, 'costruttore-mappa')
  await tocca('[data-livello="0"]')
  uguale('aperto il suo fumetto, indica «▶ costruisci»',
         await page.locator('[data-fumetto-per="0"] [data-azione="costruisci"][data-indicato]').count(), 1)

  await tocca('[data-fumetto-per="0"] [data-azione="costruisci"]')
  await page.waitForSelector('[data-editor]', { timeout: 5000 })
  const canvas = await page.locator('.cst-campo canvas').boundingBox()
  controlla('il cantiere si vede', canvas && canvas.width > 200 && canvas.height > 80, JSON.stringify(canvas))
  /* si parte col primo mattone già scritto, e la guida dice cosa toccare */
  uguale('il primo muretto parte con metti e un passo già scritti', await page.locator('[data-editor] .cst-riga').count(), 2)
  uguale('e la guida indica ▶', await page.locator('[data-azione="via"][data-indicato]').count(), 1)
  uguale('con la sua riga', await page.locator('[data-guida-riga]').count(), 1)
  uguale('il racconto si legge entrando', await page.locator('[data-racconto]').count(), 1)
  await tocca('[data-aggiungi="principale"]')
  await page.waitForSelector('[data-cassetta]', { timeout: 3000 })
  uguale('con la cassetta aperta dopo un vai, la guida indica metti', await page.locator('[data-cassetta] [data-blocco="metti"][data-indicato]').count(), 1)
  await tocca('[data-chiudi]')
  for (let k = 1; k < 4; k++) {
    await aggiungi('principale', 'metti')
    if (k < 3) {
      await aggiungi('principale', 'vai')
      /* la freccia: la scelta si è aperta da sola, sulla riga */
      await page.waitForSelector('[data-scelta="verso"]', { timeout: 3000 })
      if (k === 1) controlla('un «vai» nuovo nasce col punto di domanda sulla freccia',
                        (await page.locator('[data-editor] .cst-riga').last().locator('[data-casella="verso"]').innerText()).startsWith('?'))
      await tocca('[data-scelta="verso"] [data-verso="destra"]')
      if (k === 1) {
        uguale('scelta la freccia, i passi non si chiedono', await page.locator('[data-scelta]').count(), 0)
        uguale('e sono uno', (await page.locator('[data-editor] .cst-riga').last().locator('[data-casella="quanto"]').innerText()).trim().replace('▾', ''), '1')
      }
    }
  }
  uguale('sette righe scritte', await page.locator('[data-editor] .cst-riga').count(), 7)
  uguale('con un colore solo e un posto solo il mattone non ha scelte: le sue caselle sono ferme',
         await page.locator('[data-editor] [data-casella="colore"].cst-fissa, [data-editor] [data-casella="dove"].cst-fissa').count(), 8)
  await scatto(page, 'costruttore-programma')
  await tocca('[data-velocita="veloce"]')
  await tocca('[data-azione="via"]')
  controlla('il primo livello si vince: il cartello arriva', await arriva('[data-fine="livello"]', 15000))
  uguale('sul cartello c\'è il robot, contento', await page.locator('[data-fine="livello"] [data-robot-contento]').count(), 1)
  uguale('premuto ▶ il racconto si è chiuso', await page.locator('[data-racconto]').count(), 0)
  await scatto(page, 'costruttore-vinto')
  const p = await leggiProfilo(page)
  uguale('la tappa è segnata', p.campagne.costruttore.tappa, 1)
  uguale('con due stelle: fatto da solo', p.campagne.costruttore.stelle[0], 2)
  uguale('e le monete della prima volta', p.coins, LIVELLI[0].premio)
  controlla('e il contatore dei mattoni', (p.totals.coMattoni || 0) >= 4, JSON.stringify(p.totals))

  /* il programma resta dov'era: salvato, si ricarica */
  await tocca('[data-azione="resta"]')
  controlla('il programma vinto si salva', !!(await programmaSalvato(LIVELLI[0].chiave, 7)))
  await page.reload()
  await page.waitForSelector('.carte', { timeout: 10000 })
  await alCantiere(0)
  uguale('dopo una ricarica il programma c\'è ancora', await page.locator('[data-editor] .cst-riga').count(), 7)

  /* una freccia lasciata vuota: ▶ non parte */
  await aggiungi('principale', 'vai')
  await page.waitForSelector('[data-scelta="verso"]', { timeout: 3000 })
  await tocca('[data-scelta="verso"] [data-chiudi]')
  controlla('la freccia non scelta si vede', await page.locator('.cst-casella.cst-manca').count() === 1)
  await tocca('[data-azione="via"]')
  await page.waitForSelector('[data-messaggio]', { timeout: 3000 })
  {
    const msg = await page.locator('[data-messaggio]').innerText()
    controlla('▶ con una freccia vuota dice cosa manca', /Da che parte/.test(msg), msg)
    uguale('e apre la scelta della freccia', await page.locator('[data-scelta="verso"]').count(), 1)
  }

  /* un errore apposta: nove passi a destra dopo l'ultimo mattone, e si esce dal cantiere. Il passo è nato 1, e si cambia
     toccandolo */
  await tocca('[data-scelta="verso"] [data-verso="destra"]')
  await tocca('[data-editor] .cst-riga >> nth=-1 >> [data-casella="quanto"]')
  await page.waitForSelector('[data-scelta="numero"]', { timeout: 3000 })
  await tocca('[data-scelta="numero"] [data-cifra="9"]')
  await tocca('[data-azione="via"]')
  await page.waitForSelector('[data-guasto]', { timeout: 10000 })
  const msg = await page.locator('[data-messaggio]').innerText()
  controlla('il robot dice perché si è fermato', /uscire dal cantiere/.test(msg), msg)
  await scatto(page, 'costruttore-errore')
})

/* ══════════ 2. la pagina che sparisce prima del salvataggio pigro ══════════
   Una riga appena scritta, la scheda nascosta (o il telefono in tasca), e si ricarica prima dei ritardi: la riga c'è */
await blocco('il programma si salva se la pagina sparisce', async () => {
  await scriviArchivio(page, { v: 2, programmi: {} })
  await semina(page, { coins: 0, settings: { eta: 10 }, campagne: {} })
  const righe = () => page.locator('[data-editor] .cst-riga').count()
  // la pagina nasconde: `hidden` e `visibilityState` si ritoccano, l'evento lo manda il test
  const nascondi = () => page.evaluate(() => {
    for (const k of ['hidden', 'visibilityState'])
      Object.defineProperty(document, k, { configurable: true, get: () => k === 'hidden' ? true : 'hidden' })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  const chiudiLaPagina = () => page.evaluate(() => dispatchEvent(new Event('pagehide')))
  await alCantiere(0)
  const inizio = await righe()
  uguale('il primo muretto parte con due righe', inizio, 2)
  for (const [n, sparisce, come] of [[1, nascondi, 'nascosta la pagina'], [2, chiudiLaPagina, 'chiusa la pagina']]) {
    await aggiungi('principale', 'metti')
    uguale(`${come}: prima, una riga in più`, await righe(), inizio + n)
    await sparisce()
    await attendi(page, 120)
    await page.reload()
    await page.waitForSelector('.carte', { timeout: 10000 })
    await alCantiere(0)
    uguale(`${come}, la riga c'è dopo la ricarica`, await righe(), inizio + n)
  }
})

/* ══════════ 3. due colori: il mattone nasce senza, e «annulla» ══════════ */
await blocco('due colori e «annulla»', async () => {
  await seminaAlLivello(1, { 0: 2 })
  await alCantiere(1)
  const prima = await page.locator('[data-editor] .cst-riga').count()
  await aggiungi('principale', 'metti')
  await page.waitForSelector('[data-scelta="colore"]', { timeout: 3000 })
  uguale('con due colori il mattone nasce col punto di domanda, e la scelta aperta',
         await page.locator('[data-editor] .cst-riga').last().locator('[data-casella="colore"].cst-manca').count(), 1)
  await tocca('[data-scelta="colore"] [data-colore]')
  uguale('scelto il colore la scelta si chiude', await page.locator('[data-scelta]').count(), 0)
  /* due passi indietro: il colore, e la riga */
  await tocca('[data-azione="annulla"]')
  uguale('«annulla» toglie prima il colore', await page.locator('[data-editor] [data-casella="colore"].cst-manca').count(), 1)
  await tocca('[data-azione="annulla"]')
  uguale('e poi la riga', await page.locator('[data-editor] .cst-riga').count(), prima)
})

/* ══════════ 4. tre ordini, una lavagnetta, e la mano ══════════ */
await blocco('tre ordini e la mano', async () => {
  await seminaAlLivello(3, { 0: 2, 1: 2, 2: 2 })
  await alCantiere(3)
  uguale('tre gettoni per tre ordini', await page.locator('[data-gettone]').count(), 3)
  await aggiungi('principale', 'ripeti')
  const ripeti = await page.locator('[data-editor] .cst-riga').first().getAttribute('data-riga')
  /* «ripeti N volte»: la scelta si apre da sola, e al posto di N va la lavagnetta dell'ordine */
  await page.waitForSelector('[data-scelta="numero"]', { timeout: 3000 })
  await tocca('[data-scelta="numero"] [data-nome="lungo"]')
  await tocca('[data-scelta="numero"] [data-azione="fatto"]')
  /* si costruisce a pezzi: le due righe scritte fuori, e poi portate dentro */
  await aggiungi('principale', 'metti')
  await aggiungi('principale', 'vai')
  await tocca('[data-scelta="verso"] [data-verso="destra"]')
  const ids = await page.locator('[data-editor] .cst-riga').evaluateAll(r => r.map(x => x.dataset.riga))
  const [, mattone, passo] = ids
  for (const id of [mattone, passo]) {
    await tocca(`[data-riga="${id}"] .cst-ico`)     // l'icona: al centro della riga c'è una casella
    await tocca('[data-azione="sposta"]')
    if (id === mattone) {
      controlla('con la riga in mano la testa dice cosa si sposta', /Sposti/.test(await page.locator('[data-mano]').innerText()))
      uguale('e non offre il posto dov\'è già, né quello subito sotto',
             await page.locator(`[data-posa="prima:${mattone}"], [data-posa="prima:${passo}"]`).count(), 0)
      await scatto(page, 'costruttore-mano')
    }
    await tocca(`[data-posa="fondo:${ripeti}:corpo"]`)
  }
  uguale('le due righe sono dentro il ripeti, in ordine',
         await page.locator('.cst-righe.cst-dentro .cst-riga').evaluateAll(r => r.map(x => x.dataset.riga).join()), `${mattone},${passo}`)
  uguale('e la mano è vuota', await page.locator('[data-mano]').count(), 0)
  uguale('la riga posata resta selezionata: si vede dov\'è andata', await page.locator(`[data-riga="${passo}"].cst-sel`).count(), 1)
  /* ⧉ e poi «lascia»: niente cambia */
  await tocca('[data-azione="copia"]')
  controlla('con una copia in mano ci sono i posti dove posarla', await page.locator('[data-posa]').count() > 0)
  await tocca('[data-azione="lascia"]')
  uguale('«lascia» non copia niente', await page.locator('[data-editor] .cst-riga').count(), 3)
  await scatto(page, 'costruttore-ripeti')
  const l = LIVELLI[3], p = await programmaSalvato(l.chiave, 1)
  controlla('il programma scritto col dito si salva', !!p)
  controlla('e regge tutti e tre gli ordini', !!p && provaLivello(l, p).vinto,
            p ? provaLivello(l, p).esiti.map(e => e.esito).join() : 'non salvato')
})

/* ══════════ 5. il cantiere libero, e i progetti che restano ══════════
   Il tempio vinto con la sua colonna: dal cantiere libero la si riprende */
await blocco('il cantiere libero', async () => {
  await scriviArchivio(page, { v: 2, programmi: { tempio: JSON.parse(JSON.stringify(LIVELLI.find(l => l.chiave === 'tempio').soluzione)) } })
  await seminaAlLivello(7)
  await allaScheda()
  uguale('finito il primo capitolo il cantiere libero è aperto', await page.locator('[data-libero][data-stato="aperto"]').count(), 1)
  await costruisci(page, 'libero')
  await page.waitForSelector('[data-editor]', { timeout: 5000 })
  await tocca('[data-aggiungi="principale"]')
  await page.waitForSelector('[data-cassetta]', { timeout: 3000 })
  await pronto(page, '[data-cassetta]')   // la finestra cieca della cassetta
  uguale('nella cassetta ci sono i progetti degli altri cantieri', await page.locator('[data-importa="colonna"]').count(), 1)
  await tocca('[data-importa="colonna"]')
  uguale('ripreso, il progetto ha la sua scheda', await page.locator('[data-scheda="colonna"]').count(), 1)
})

/* ══════════ 6. gli attrezzi, annulla e lo zaino ══════════
   La cinta si costruisce solo con gli attrezzi del capomastro, e un blocco tolto per sbaglio torna con «annulla» */
await blocco('gli attrezzi della cinta', async () => {
  const cinta = LIVELLI.findIndex(l => l.chiave === 'cinta')
  await seminaAlLivello(cinta)
  await alCantiere(cinta)
  await tocca('[data-aggiungi="principale"]')
  await page.waitForSelector('[data-cassetta]', { timeout: 3000 })
  await pronto(page, '[data-cassetta]')   // la finestra cieca della cassetta
  uguale('nella cinta la cassetta dà la torre e il muro, già scritti', await page.locator('[data-attrezzi] [data-blocco^="chiama:"]').count(), 2)
  uguale('e nessun «metti»: si costruisce con gli attrezzi', await page.locator('[data-cassetta] [data-blocco^="metti"]').count(), 0)
  await tocca('[data-cassetta] [data-chiudi]')
  await aggiungi('principale', 'ripeti')
  await tocca('[data-scelta="numero"] [data-cifra="2"]')
  await tocca('[data-scelta="numero"] [data-azione="fatto"]')
  const rip = await page.locator('[data-editor] .cst-riga').first().getAttribute('data-riga')
  await aggiungi(`${rip}:corpo`, 'chiama:torre')
  await tocca('[data-scelta="numero"] [data-nome="torri"]')
  await tocca('[data-scelta="numero"] [data-azione="fatto"]')
  await aggiungi(`${rip}:corpo`, 'vai')
  await tocca('[data-scelta="verso"] [data-verso="destra"]')
  await aggiungi(`${rip}:corpo`, 'chiama:muro')
  await tocca('[data-scelta="numero"] [data-nome="muro"]')
  await tocca('[data-scelta="numero"] [data-azione="fatto"]')
  await aggiungi('principale', 'chiama:torre')
  await tocca('[data-scelta="numero"] [data-nome="torri"]')
  await tocca('[data-scelta="numero"] [data-azione="fatto"]')
  await tocca('[data-scheda="torre"]')
  controlla('la scheda di un attrezzo si legge e dice dove lascia il robot', /Finisce in cima alla torre/.test(await page.locator('[data-attrezzo]').innerText()))
  uguale('e non si cambia: niente «＋»', await page.locator('.cst-piu').count(), 0)
  await tocca('[data-scheda="principale"]')
  await tocca(`[data-riga="${rip}"]`)
  await tocca('[data-azione="togli-riga"]')
  uguale('il 🗑 sul ripeti porta via il blocco con quello che ha dentro', await page.locator('[data-editor] .cst-riga').count(), 1)
  await tocca('[data-azione="annulla"]')
  uguale('e «annulla» lo rimette tutto', await page.locator('[data-editor] .cst-riga').count(), 5)
  await scatto(page, 'costruttore-attrezzi')
  const p = await programmaSalvato('cinta', 2)
  controlla('la cinta scritta col dito regge tutti e due i baroni', !!p && provaLivello(LIVELLI[cinta], p).vinto,
            p ? provaLivello(LIVELLI[cinta], p).esiti.map(e => e.esito).join() : 'non salvata')
})

/* il bosco: il programma srotolato non sta nello zaino, e il robot non parte — la frase dice cosa fare */
await blocco('lo zaino pieno del bosco', async () => {
  const b = LIVELLI.find(l => l.chiave === 'bosco')
  const piatta = conAttrezzi(programma(srotola(conAttrezzi(b.soluzione, b))), b)
  await scriviArchivio(page, { v: 2, programmi: { bosco: JSON.parse(JSON.stringify(piatta)) } })
  const bosco = LIVELLI.indexOf(b)
  await seminaAlLivello(bosco)
  await alCantiere(bosco, '[data-zaino]')
  controlla('lo zaino dice quante righe ci sono e quante ne stanno', /22\/14/.test(await page.locator('[data-zaino]').innerText()))
  await tocca('[data-azione="via"]')
  await page.waitForSelector('[data-messaggio]', { timeout: 3000 })
  controlla('con troppe righe il robot non parte, e dice di fare un progetto',
            /ne stanno 14/.test(await page.locator('[data-messaggio]').innerText()))
  await tocca('[data-aggiungi="principale"]')
  controlla('e il «＋» non apre la cassetta: dice che lo zaino è pieno',
            await page.locator('[data-cassetta]').count() === 0 && /progetto/.test(await page.locator('[data-messaggio]').innerText()))
})

/* ══════════ 7. il porto: la cassetta della gru ══════════
   Che la sua soluzione vinca le due giornate lo dice `unita/costruttore` */
await blocco('il porto', async () => {
  const primo = LIVELLI.findIndex(l => l.mondo === 'porto')
  const gru = LIVELLI.findIndex(l => l.chiave === 'gru')
  await seminaAlLivello(gru)
  await allaScheda()
  controlla('il porto sta nella mappa, dopo le lavagnette', LIVELLI[primo - 1].capitolo === 'lavagnette' &&
            await page.locator(`[data-livello="${primo}"]`).count() === 1)
  await costruisci(page, gru)
  await page.waitForSelector('[data-editor]', { timeout: 5000 })
  await tocca('[data-aggiungi="principale"]')
  await page.waitForSelector('[data-cassetta]', { timeout: 3000 })
  await pronto(page, '[data-cassetta]')   // la finestra cieca della cassetta
  uguale('la cassetta del porto ha un «prendi» solo', await page.locator('[data-cassetta] [data-blocco^="prendi"]').count(), 1)
  await tocca('[data-cassetta] [data-blocco="prendi"]')
  await page.waitForSelector('[data-scelta="lato"]', { timeout: 3000 })
  uguale('e le quattro frecce si scelgono sulla riga', await page.locator('[data-scelta="lato"] [data-lato]').count(), 4)
  await tocca('[data-azione="annulla"]')
  await scatto(page, 'costruttore-porto')
})

/* ══════════ 8. la torre del casaro: la ricorsione ══════════
   La soluzione chiama sé stessa: mentre gira, la fila delle carte aperte deve mostrare le torri una dentro l'altra — è così
   che la ricorsione si vede invece di spiegarsi. Visto, si ferma: che vinca tutti e quattro i giorni lo dice `unita/costruttore` */
await blocco('la torre del casaro', async () => {
  const torre = LIVELLI.findIndex(l => l.chiave === 'quante-forme')
  await scriviArchivio(page, { v: 2, programmi: { 'quante-forme': JSON.parse(JSON.stringify(LIVELLI[torre].soluzione)) } })
  await seminaAlLivello(torre)
  await alCantiere(torre)
  await tocca('[data-azione="via"]')
  /* la terza carta aperta vuol dire tre torri una dentro l'altra */
  let fondo = 0
  for (let k = 0; k < 40 && fondo < 3; k++) {
    await attendi(page, 50)
    fondo = await page.locator('[data-pila] .cst-carta-pila').count()
  }
  controlla('mentre gira, le torri si vedono una dentro l\'altra nella fila delle carte', fondo >= 3, `al massimo ${fondo}`)
  await scatto(page, 'costruttore-torre')
  await tocca('[data-azione="stop"]')
  controlla('■ ferma il robot: torna ▶', await arriva('[data-azione="via"]', 3000))
})

/* ══════════ 9. la domanda: una frase a caselle ══════════
   Si apre solo la scelta di una casella per volta, il posto si tocca sul quadretto attorno al robot, e si offre tutto —
   anche quello che nel livello non serve: «Sui mattoni rossi» mette solo il giallo e chiede del rosso */
await blocco('la domanda a caselle', async () => {
  const nidi = LIVELLI.findIndex(l => l.chiave === 'sui-rossi')
  await scriviArchivio(page, { v: 2, programmi: {} })
  await seminaAlLivello(nidi)
  await alCantiere(nidi)
  await aggiungi('principale', 'se')
  await page.waitForSelector('[data-scelta="cond"]', { timeout: 3000 })
  uguale('una domanda nuova apre il posto: il quadretto attorno al robot', await page.locator('[data-scelta="cond"] [data-intorno]').count(), 1)
  uguale('e solo lui: le cose aspettano', await page.locator('[data-scelta="cond"] [data-cosa]').count(), 0)
  await scatto(page, 'costruttore-domanda-posto')
  await tocca('[data-scelta="cond"] [data-dove="sotto"]')
  uguale('scelto il posto si apre la cosa', await page.locator('[data-scelta="cond"] [data-cosa]').count() > 0, true)
  uguale('si offrono tutte le cose, anche l\'acqua che qui non c\'è', await page.locator('[data-scelta="cond"] [data-cosa="acqua"]').count(), 1)
  await tocca('[data-scelta="cond"] [data-cosa="mattone"]')
  uguale('un mattone nasce di qualunque colore, e si apre il colore',
         await page.locator('[data-scelta="cond"] [data-colore-domanda="qualunque"].cst-su').count(), 1)
  uguale('fra i colori c\'è il rosso, anche se il robot mette solo il giallo',
         await page.locator('[data-scelta="cond"] [data-colore-domanda="rosso"]').count(), 1)
  await scatto(page, 'costruttore-domanda-colore')
  await tocca('[data-scelta="cond"] [data-colore-domanda="rosso"]')
  await tocca('[data-scelta="cond"] [data-azione="fatto"]')
  controlla('la riga dice la domanda intera',
            /sotto i piedi c'è un mattone rosso/.test(await page.locator('[data-editor] .cst-riga').first().innerText()),
            await page.locator('[data-editor] .cst-riga').first().innerText())
  await scatto(page, 'costruttore-domanda')
})

controlla('nessun errore in console', errori.length === 0, errori.join(' | '))
nota(`errori raccolti: ${errori.length}`)

await browser.close()
riassunto('costruttore nel browser')
