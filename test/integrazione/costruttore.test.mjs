/* ═══════════════════════════════════════════════════════════════════
   IL COSTRUTTORE, NEL BROWSER

   Quello che il motore non può dire: che il programma **si scrive col
   dito** e poi gira. Si entra dalla home, si scrive la soluzione del
   primo livello toccando «＋», i blocchi e le caselle, si preme ▶ e si
   aspetta il cartello; poi un livello con tre ordini, dove la casella
   del ripeti prende la lavagnetta dell'ordine e il programma deve
   reggere tutti e tre; poi un errore apposta, che deve accendere la
   riga dove il robot si è fermato. E il programma scritto deve
   ritrovarsi dopo una ricarica, e una riga tolta per sbaglio tornare
   con «annulla».

   E le scelte non si fanno da sole: un «vai» nasce col punto di
   domanda sulla freccia e la scelta aperta sulla riga (i passi nascono
   1, e non si chiedono), un mattone in un livello con due colori nasce
   senza colore, un ripeti con la N; ▶ con qualcosa da scegliere non
   parte ma apre la scelta che manca. E la mano: due righe scritte fuori
   da un ripeti ci entrano con ✂, e il programma vince.

   Poi il porto, la seconda parte: la cassetta con le frecce, e la gru
   giocata con la sua soluzione su tutte e due le giornate — la tela
   dall'alto, i turni del mondo e il verdetto della sera. E in fondo la
   torre del casaro, la ricorsione: le forme di formaggio sulle tre assi,
   e la fila delle carte che si allunga mentre il progetto chiama sé stesso.
   `node test/esegui.mjs integrazione/costruttore`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, scatto, semina, attendi, leggiProfilo, scegli, costruisci }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { LIVELLI } from '../../src/giochi/costruttore/dati/livelli.js'
import { FILA_ATTUALE } from '../../src/giochi/costruttore/dati/campagna.js'
import { conAttrezzi } from '../../src/giochi/costruttore/motore/attrezzi.js'
import { srotola } from '../../src/giochi/costruttore/motore/zaino.js'
import { programma } from '../../src/giochi/costruttore/dati/scrivi.js'

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

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, { coins: 0, settings: { eta: 10 } })

const tocca = async sel => { await page.locator(sel).first().click(); await attendi(page, 60) }
/* aggiunge un blocco in fondo all'elenco indicato */
async function aggiungi(dove, blocco) {
  await tocca(`[data-aggiungi="${dove}"]`)
  await page.waitForSelector('[data-cassetta]', { timeout: 3000 })
  await attendi(page, 350)      // la finestra cieca della cassetta
  await tocca(`[data-cassetta] [data-blocco="${blocco}"]`)
}

/* ---------- 1. si entra dalla home ---------- */
const carta = page.locator('.carta.gioco[data-gioco="costruttore"]')
uguale('a dieci anni la carta del costruttore è in home, senza accendere niente',
       await carta.count(), 1)
await scegli(page, 'costruttore')
await page.waitForSelector('.cst-mappa', { timeout: 5000 })
uguale('la scheda ha un led per livello', await page.locator('[data-livello]').count(), LIVELLI.length)
uguale('e in fondo il cantiere libero, chiuso finché il primo capitolo non è finito',
       await page.locator('[data-libero][data-stato="chiuso"]').count(), 1)
/* la guida del primo giro comincia sulla scheda: il led 1, poi «▶ costruisci» */
uguale('la guida indica il led del primo livello', await page.locator('[data-livello="0"][data-indicato]').count(), 1)
await scatto(page, 'costruttore-mappa')
await tocca('[data-livello="0"]')
uguale('aperto il suo fumetto, indica «▶ costruisci»',
       await page.locator('[data-fumetto-per="0"] [data-azione="costruisci"][data-indicato]').count(), 1)

/* ---------- 2. il primo livello, scritto col dito ---------- */
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
await page.waitForSelector('[data-fine="livello"]', { timeout: 15000 })
controlla('il primo livello si vince', true)
uguale('premuto ▶ il racconto si è chiuso', await page.locator('[data-racconto]').count(), 0)
await scatto(page, 'costruttore-vinto')
{
  const p = await leggiProfilo(page)
  uguale('la tappa è segnata', p.campagne.costruttore.tappa, 1)
  uguale('con due stelle: fatto da solo', p.campagne.costruttore.stelle[0], 2)
  uguale('e le monete della prima volta', p.coins, LIVELLI[0].premio)
  controlla('e il contatore dei mattoni', (p.totals.coMattoni || 0) >= 4, JSON.stringify(p.totals))
}

/* ---------- 3. il programma resta dov'era ---------- */
await tocca('[data-azione="resta"]')
await attendi(page, 700)       // il salvataggio si fa un attimo dopo
await page.reload()
await page.waitForSelector('.carte', { timeout: 10000 })
await scegli(page, 'costruttore')
await page.waitForSelector('.cst-mappa', { timeout: 5000 })
await costruisci(page, 0)
await page.waitForSelector('[data-editor]', { timeout: 5000 })
uguale('dopo una ricarica il programma c\'è ancora', await page.locator('[data-editor] .cst-riga').count(), 7)

/* ---------- 4. una freccia lasciata vuota: ▶ non parte ---------- */
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

/* ---------- 5. un errore apposta: la riga si accende ---------- */
/* nove passi a destra dopo l'ultimo mattone: si esce dal cantiere. Il
   passo è nato 1, e si cambia toccandolo */
await tocca('[data-scelta="verso"] [data-verso="destra"]')
await tocca('[data-editor] .cst-riga >> nth=-1 >> [data-casella="quanto"]')
await page.waitForSelector('[data-scelta="numero"]', { timeout: 3000 })
await tocca('[data-scelta="numero"] [data-cifra="9"]')
await tocca('[data-azione="via"]')
await page.waitForSelector('[data-guasto]', { timeout: 10000 })
{
  const msg = await page.locator('[data-messaggio]').innerText()
  controlla('il robot dice perché si è fermato', /uscire dal cantiere/.test(msg), msg)
}
await scatto(page, 'costruttore-errore')

/* ---------- 5-bis. due colori: il mattone nasce senza ---------- */
await semina(page, { settings: { eta: 10 },
                     campagne: { costruttore: { tappa: 1, libera: false, stelle: { 0: 2 }, cfg: { velocita: 'veloce', fila: FILA_ATTUALE } } } })
await scegli(page, 'costruttore')
await page.waitForSelector('.cst-mappa', { timeout: 5000 })
await costruisci(page, 1)
await page.waitForSelector('[data-editor]', { timeout: 5000 })
{
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
}

/* ---------- 6. tre ordini, una lavagnetta, e la mano ---------- */
await semina(page, { settings: { eta: 10 },
                     campagne: { costruttore: { tappa: 3, libera: false, stelle: { 0: 2, 1: 2, 2: 2 }, cfg: { velocita: 'veloce', fila: FILA_ATTUALE } } } })
await scegli(page, 'costruttore')
await page.waitForSelector('.cst-mappa', { timeout: 5000 })
await costruisci(page, 3)
await page.waitForSelector('[data-editor]', { timeout: 5000 })
uguale('tre gettoni per tre ordini', await page.locator('[data-gettone]').count(), 3)
await aggiungi('principale', 'ripeti')
const ripeti = await page.locator('[data-editor] .cst-riga').first().getAttribute('data-riga')
/* «ripeti N volte»: la scelta si apre da sola, e al posto di N va la
   lavagnetta dell'ordine */
await page.waitForSelector('[data-scelta="numero"]', { timeout: 3000 })
await tocca('[data-scelta="numero"] [data-nome="lungo"]')
await tocca('[data-scelta="numero"] [data-azione="fatto"]')
/* si costruisce a pezzi: le due righe scritte fuori, e poi portate dentro */
await aggiungi('principale', 'metti')
await aggiungi('principale', 'vai')
await tocca('[data-scelta="verso"] [data-verso="destra"]')
{
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
}
await scatto(page, 'costruttore-ripeti')
await tocca('[data-azione="via"]')
await page.waitForSelector('[data-fine="livello"]', { timeout: 20000 })
uguale('il programma regge tutti e tre gli ordini', await page.locator('[data-gettone].cst-vinto').count(), 3)

/* ---------- 7. il cantiere libero, e i progetti che restano ---------- */
/* il tempio vinto con la sua colonna: dal cantiere libero la si riprende */
await scriviArchivio(page, { v: 2, programmi: { tempio: JSON.parse(JSON.stringify(LIVELLI.find(l => l.chiave === 'tempio').soluzione)) } })
await semina(page, { settings: { eta: 10 },
                     campagne: { costruttore: { tappa: 7, libera: false, stelle: {}, cfg: { velocita: 'veloce', fila: FILA_ATTUALE } } } })
await scegli(page, 'costruttore')
await page.waitForSelector('.cst-mappa', { timeout: 5000 })
uguale('finito il primo capitolo il cantiere libero è aperto', await page.locator('[data-libero][data-stato="aperto"]').count(), 1)
await costruisci(page, 'libero')
await page.waitForSelector('[data-editor]', { timeout: 5000 })
await tocca('[data-aggiungi="principale"]')
await page.waitForSelector('[data-cassetta]', { timeout: 3000 })
await attendi(page, 350)
uguale('nella cassetta ci sono i progetti degli altri cantieri', await page.locator('[data-importa="colonna"]').count(), 1)
await tocca('[data-importa="colonna"]')
uguale('ripreso, il progetto ha la sua scheda', await page.locator('[data-scheda="colonna"]').count(), 1)
await tocca('[data-scheda="principale"]')

/* ---------- 7-bis. gli attrezzi, annulla e lo zaino ---------- */
/* la cinta: si costruisce solo con gli attrezzi del capomastro, e un
   blocco tolto per sbaglio torna con «annulla» */
{
  const cinta = LIVELLI.findIndex(l => l.chiave === 'cinta')
  await semina(page, { settings: { eta: 10 },
                       campagne: { costruttore: { tappa: cinta, libera: false, stelle: {}, cfg: { velocita: 'veloce', fila: FILA_ATTUALE } } } })
  await scegli(page, 'costruttore')
  await page.waitForSelector('.cst-mappa', { timeout: 5000 })
  await costruisci(page, cinta)
  await page.waitForSelector('[data-editor]', { timeout: 5000 })
  await tocca('[data-aggiungi="principale"]')
  await page.waitForSelector('[data-cassetta]', { timeout: 3000 })
  await attendi(page, 350)
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
  await tocca('[data-azione="via"]')
  await page.waitForSelector('[data-fine="livello"]', { timeout: 20000 })
  uguale('la cinta regge tutti e due i baroni', await page.locator('[data-gettone].cst-vinto').count(), 2)
}
/* il bosco: il programma srotolato non sta nello zaino, e il robot non
   parte — la frase dice cosa fare */
{
  const b = LIVELLI.find(l => l.chiave === 'bosco')
  const piatta = conAttrezzi(programma(srotola(conAttrezzi(b.soluzione, b))), b)
  await scriviArchivio(page, { v: 2, programmi: { bosco: JSON.parse(JSON.stringify(piatta)) } })
  const bosco = LIVELLI.indexOf(b)
  await semina(page, { settings: { eta: 10 },
                       campagne: { costruttore: { tappa: bosco, libera: false, stelle: {}, cfg: { velocita: 'veloce', fila: FILA_ATTUALE } } } })
  await scegli(page, 'costruttore')
  await page.waitForSelector('.cst-mappa', { timeout: 5000 })
  await costruisci(page, bosco)
  await page.waitForSelector('[data-zaino]', { timeout: 5000 })
  controlla('lo zaino dice quante righe ci sono e quante ne stanno', /22\/14/.test(await page.locator('[data-zaino]').innerText()))
  await tocca('[data-azione="via"]')
  await page.waitForSelector('[data-messaggio]', { timeout: 3000 })
  controlla('con troppe righe il robot non parte, e dice di fare un progetto',
            /ne stanno 14/.test(await page.locator('[data-messaggio]').innerText()))
  await tocca('[data-aggiungi="principale"]')
  controlla('e il «＋» non apre la cassetta: dice che lo zaino è pieno',
            await page.locator('[data-cassetta]').count() === 0 && /progetto/.test(await page.locator('[data-messaggio]').innerText()))
}

/* ---------- 8. il porto ---------- */
/* la gru con la sua soluzione: la tela dall'alto, la regia coi turni del
   mondo, e il verdetto a sera — tutte e due le giornate */
{
  const primo = LIVELLI.findIndex(l => l.mondo === 'porto')
  const gru = LIVELLI.findIndex(l => l.chiave === 'gru')
  await scriviArchivio(page, { v: 2, programmi: { gru: JSON.parse(JSON.stringify(LIVELLI[gru].soluzione)) } })
  await semina(page, { settings: { eta: 10 },
                       campagne: { costruttore: { tappa: gru, libera: false, stelle: {}, cfg: { velocita: 'veloce', fila: FILA_ATTUALE } } } })
  await scegli(page, 'costruttore')
  await page.waitForSelector('.cst-mappa', { timeout: 5000 })
  controlla('il porto sta nella mappa, dopo le lavagnette', LIVELLI[primo - 1].capitolo === 'lavagnette' &&
            await page.locator(`[data-livello="${primo}"]`).count() === 1)
  await costruisci(page, gru)
  await page.waitForSelector('[data-editor]', { timeout: 5000 })
  await tocca('[data-aggiungi="principale"]')
  await page.waitForSelector('[data-cassetta]', { timeout: 3000 })
  await attendi(page, 350)
  uguale('la cassetta del porto ha un «prendi» solo',
         await page.locator('[data-cassetta] [data-blocco^="prendi"]').count(), 1)
  await tocca('[data-cassetta] [data-blocco="prendi"]')
  await page.waitForSelector('[data-scelta="lato"]', { timeout: 3000 })
  uguale('e le quattro frecce si scelgono sulla riga', await page.locator('[data-scelta="lato"] [data-lato]').count(), 4)
  await tocca('[data-azione="annulla"]')
  await tocca('[data-azione="via"]')
  await page.waitForSelector('[data-fine="livello"]', { timeout: 40000 })
  uguale('la gru: tutte e due le navi scaricate', await page.locator('[data-gettone].cst-vinto').count(), 2)
  await scatto(page, 'costruttore-porto')
}

/* ---------- 8-bis. le giornate del porto: i camion ---------- */
/* il primo camion con la sua soluzione: i camion che arrivano, si
   caricano e ripartono sulla strada, con la gru che lavora intorno */
{
  const camion = LIVELLI.findIndex(l => l.chiave === 'primo-camion')
  await scriviArchivio(page, { v: 2, programmi: { 'primo-camion': JSON.parse(JSON.stringify(LIVELLI[camion].soluzione)) } })
  await semina(page, { settings: { eta: 10 },
                       campagne: { costruttore: { tappa: camion, libera: false, stelle: {}, cfg: { velocita: 'veloce', fila: FILA_ATTUALE } } } })
  await scegli(page, 'costruttore')
  await page.waitForSelector('.cst-mappa', { timeout: 5000 })
  await costruisci(page, camion)
  await page.waitForSelector('[data-editor]', { timeout: 5000 })
  await tocca('[data-azione="via"]')
  await page.waitForSelector('[data-fine="livello"]', { timeout: 40000 })
  uguale('il primo camion: tutte e due le giornate, tutti i camion pieni', await page.locator('[data-gettone].cst-vinto').count(), 2)
  await scatto(page, 'costruttore-camion')
}

/* ---------- 8-ter. la torre del casaro: la ricorsione ---------- */
/* la soluzione chiama sé stessa: mentre gira, la fila delle carte aperte
   deve mostrare le torri una dentro l'altra — è così che la ricorsione si
   vede invece di spiegarsi — e tutti e quattro i giorni si vincono, fino
   alla torre di sei forme */
{
  const torre = LIVELLI.findIndex(l => l.chiave === 'quante-forme')
  await scriviArchivio(page, { v: 2, programmi: { 'quante-forme': JSON.parse(JSON.stringify(LIVELLI[torre].soluzione)) } })
  await semina(page, { settings: { eta: 10 },
                       campagne: { costruttore: { tappa: torre, libera: false, stelle: {}, cfg: { velocita: 'veloce', fila: FILA_ATTUALE } } } })
  await scegli(page, 'costruttore')
  await page.waitForSelector('.cst-mappa', { timeout: 5000 })
  await costruisci(page, torre)
  await page.waitForSelector('[data-editor]', { timeout: 5000 })
  await tocca('[data-azione="via"]')
  /* la terza carta aperta vuol dire tre torri una dentro l'altra */
  let fondo = 0
  for (let k = 0; k < 40 && fondo < 3; k++) {
    await attendi(page, 50)
    fondo = await page.locator('[data-pila] .cst-carta-pila').count()
  }
  controlla('mentre gira, le torri si vedono una dentro l\'altra nella fila delle carte', fondo >= 3, `al massimo ${fondo}`)
  await page.waitForSelector('[data-fine="livello"]', { timeout: 150000 })
  uguale('la torre del casaro: tutti e quattro i giorni, fino a sei forme', await page.locator('[data-gettone].cst-vinto').count(), 4)
  await scatto(page, 'costruttore-torre')
}

/* ---------- 8-quater. la domanda: una frase a caselle ----------
   Si apre solo la scelta di una casella per volta, il posto si tocca sul
   quadretto attorno al robot, e si offre tutto — anche quello che nel
   livello non serve: «Sui mattoni rossi» mette solo il giallo e chiede del
   rosso, e con la pulsantiera il rosso non c'era da scegliere. */
{
  const nidi = LIVELLI.findIndex(l => l.chiave === 'sui-rossi')
  await scriviArchivio(page, { v: 2, programmi: {} })
  await semina(page, { settings: { eta: 10 },
                       campagne: { costruttore: { tappa: nidi, libera: false, stelle: {}, cfg: { velocita: 'veloce', fila: FILA_ATTUALE } } } })
  await scegli(page, 'costruttore')
  await page.waitForSelector('.cst-mappa', { timeout: 5000 })
  await costruisci(page, nidi)
  await page.waitForSelector('[data-editor]', { timeout: 5000 })
  await aggiungi('principale', 'se')
  await page.waitForSelector('[data-scelta="cond"]', { timeout: 3000 })
  uguale('una domanda nuova apre il posto: il quadretto attorno al robot',
         await page.locator('[data-scelta="cond"] [data-intorno]').count(), 1)
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
}

/* ---------- 9. niente errori ---------- */
controlla('nessun errore in console', errori.length === 0, errori.join(' | '))
nota(`errori raccolti: ${errori.length}`)

await browser.close()
riassunto('costruttore nel browser')
