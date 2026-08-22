/* ═══════════════════════════════════════════════════════════════════
   LA SCHERMATA DEI GENITORI

   Le tre cose che stanno dietro il PIN: salvare i progressi, rimetterli,
   cancellarli. Sono le uniche operazioni del gioco che possono far
   perdere mesi di partite, quindi vanno provate davvero e non a occhio.

   In particolare si controlla che il PIN sbagliato NON apra, che
   l'esportazione contenga i progressi veri e non un file vuoto, e che
   dopo un ripristino il gioco mostri i dati rimessi e non quelli che
   aveva in memoria un attimo prima.
   ═══════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { apriBrowser, apriGioco, semina, azzera, scatto, leggiProfilo,
         GIOCATORE } from '../aiuto/browser.mjs'
import { GIOCHI } from '../../src/data/giochi.js'
import { SAPERI } from '../../src/data/saperi.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

/* Un profilo riconoscibile: se ricompare dopo il ripristino, il giro
   completo ha funzionato. Non solo monete e contatori: anche una parola
   imparata a metà e due campagne a mezza strada, che sono le cose che il
   salvataggio deve riportare indietro e che nessuno stava controllando. */
await semina(page, { coins: 777, totals: { math: 42, en: 0, verbi: 0, frasi: 0, td: 0,
  pasti: 0, partiteMath: 0, torri: 0, perfette: 0, ondate: 0, preferiti: 0, monete: 0,
  cure: 0, capsule: 0 },
  items: { 'en:dog': { n: 3, ef: 2.2, i: 4, due: Date.now() + 3 * 86400000, r: 3, w: 1 } },
  td: { tappa: 4, libera: false, v: 2 },
  campagne: { dungeon: { tappa: 2, libera: false, stelle: {}, cfg: {} } } })

const vaiAiGenitori = async () => {
  await page.click('[data-azione="grandi"]')
  await page.waitForSelector('.tastierino', { timeout: 5000 })
}
const digita = async pin => { for (const c of pin) await page.click(`.tasto >> text="${c}"`) }
/* Le schede sono tre — bambini, domande, giochi — e si entra da
   «bambini»: chi arriva qui di corsa viene quasi sempre per un bambino.
   Il test dice ogni volta dove vuole andare, invece di dare per scontata
   quella aperta: è la differenza fra un test che si rompe quando si
   cambia il difetto e uno che si rompe quando si rompe qualcosa. */
const apriScheda = async nome => {
  await page.waitForSelector(`.schede button[data-scheda="${nome}"]`, { timeout: 5000 })
  await page.click(`.schede button[data-scheda="${nome}"]`)
  await page.waitForTimeout(150)
}

/* ── IL QUADRO, CHE È L'UNICO POSTO DOVE SI TARA ──
   Non ci sono più le due file di interruttori (uno per gioco, uno per
   classe di domande): c'è un elenco, e ogni riga ha la sua ✎. Questi
   tre aiuti fanno il gesto vero — apri il blocco, apri la tacca,
   spostala, conferma — e li usano metà dei controlli qui sotto. */
const apriBlocco = async k => {
  const sel = `[data-manopola] [data-apri="${k}"]`
  if ((await page.locator(sel).count()) === 0) return false
  if (!(await page.locator(sel).evaluate(el => el.classList.contains('aperta')))) {
    await page.click(sel)
    await page.waitForTimeout(150)
  }
  return true
}

/* La tacca si porta a fondo corsa e poi si risale: così non serve
   sapere da dove partiva, che è il genere di cosa che rende un test
   verde per il motivo sbagliato. */
const spingi = async (sel, quante) => {
  for (let i = 0; i < quante; i++) {
    /* una freccia a fondo corsa è spenta, e `click()` su un tasto spento
       aspetta finché non scade: si smette appena si arriva in fondo */
    if (await page.locator(sel).isDisabled()) break
    await page.click(sel)
    await page.waitForTimeout(60)
  }
}
const apriTutto = async () => {
  for (const k of ['facili', 'medie', 'toste', 'sotto', 'spenta']) await apriBlocco(k)
}
/* la tacca di un pezzo di scuola: `via` è l'ultimo scatto, quello che
   lo spegne; `rimetti` è la riga sotto i due tasti */
const taraSapere = async (chiave, come) => {
  await apriScheda('giochi')
  await page.waitForSelector('[data-manopola]', { timeout: 5000 })
  await apriTutto()
  /* lo stesso pezzo di scuola può avere una riga in due blocchi: si
     prende la prima, e la tacca che si apre è la sua */
  await page.locator(`[data-tara-apri="${chiave}"]`).first().click()
  await page.waitForSelector(`[data-taratura="${chiave}"]`, { timeout: 5000 })
  if (come === 'rimetti') {
    await page.click('[data-tara="rimetti"]')
  } else {
    await spingi('[data-tara="su"]', 8)
    await page.click('[data-tara="applica"]')
  }
  await page.waitForTimeout(500)
}
const taraGioco = async (chiave, verso) => {
  await apriScheda('giochi')
  await page.waitForSelector('[data-manopola]', { timeout: 5000 })
  await apriBlocco('giochi')
  await page.click(`[data-tara-apri="${chiave}"]`)
  await page.waitForSelector(`[data-in-casa="${chiave}"]`, { timeout: 5000 })
  await spingi('[data-gioco-tara="giu"]', 3)                    // fino a «Non ce l'ha»
  if (verso !== 'no') await spingi('[data-gioco-tara="su"]', verso === 'si' ? 2 : 1)
  await page.click('[data-gioco-tara="applica"]')
  await page.waitForTimeout(400)
}

/* ── 1. il gradino tiene ── */
await vaiAiGenitori()
controlla('la home non mostra più "azzera i dati"',
  !(await page.evaluate(() => document.body.innerText.includes('azzera i dati'))))

/* Chi arriva qui senza codice deve leggere di chi è la schermata e avere
   davanti una cosa da fare che non sia provare i numeri: se l'unica
   uscita è la freccia in cima, il tastierino resta il gioco più vicino. */
controlla('il tastierino dice che è roba da grandi',
  await page.evaluate(() => document.body.innerText.includes('Le cambia un grande')))
controlla('e c\'è un tasto per tornare ai giochi',
  await page.isVisible('[data-azione="torna-ai-giochi"]'))
await page.click('[data-azione="torna-ai-giochi"]')
await page.waitForTimeout(200)
controlla('che riporta davvero alla home',
  !(await page.isVisible('.tastierino')))
await vaiAiGenitori()

await digita('1234')
await page.waitForTimeout(150)
controlla('un PIN sbagliato non apre', await page.isVisible('.tastierino'))
controlla('lo dice invece di restare muto', await page.isVisible('.fermo'))

/* Sbagliare costa un'attesa, ed è tutto il punto: finché non è passata
   il tastierino non risponde, così provare i codici a raffica smette di
   essere il minigioco che era. Quanto duri lo decide `store/pin.js`. */
controlla('e il tastierino resta spento finché non passa',
  await page.isDisabled('.tasto >> text="1"'))
await page.click('.tasto >> text="1"', { force: true, timeout: 2000 }).catch(() => {})
controlla('un tasto premuto durante l\'attesa non conta',
  await page.evaluate(() => document.querySelectorAll('.pallini .pieno').length === 0))

/* ── 2. il PIN giusto apre, passata l'attesa ── */
/* il blocco dell'attesa non sparisce — tiene il posto, spento — quindi
   quello che dice che è passata è la barretta che si zittisce */
await page.waitForSelector('.fermo .barretta.muta', { state: 'attached', timeout: 15000 })
await digita('0000')
await page.waitForSelector('.carte', { timeout: 5000 })
const dentro = await page.evaluate(() => document.body.innerText)
controlla('con 0000 si entra', dentro.includes('Salva su file'))
controlla('ci sono tutte e tre le cose',
  dentro.includes('Salva su file') && dentro.includes('Rimetti da un file') && dentro.includes('Cancella'))
await scatto(page, 'genitori')

/* ── 2b. da chi arriva questo gioco ──
   In fondo alle impostazioni, e non in cima: chi entra qui viene per
   spegnere un gioco o salvare i progressi. Ma da qualche parte
   l'applicazione deve dire di chi è e dove si guarda il codice, se no
   una famiglia che l'ha ricevuta da un'altra famiglia non ha nessun
   modo di saperlo. */
const firma = await page.evaluate(() => {
  const f = document.querySelector('[data-firma]')
  return f ? { testo: f.innerText, fuori: [...f.querySelectorAll('a')].map(a => a.href) } : null
})
controlla('in fondo c\'è scritto chi l\'ha fatto',
  !!firma && firma.testo.includes('Marco Sporchia'), JSON.stringify(firma)?.slice(0, 120))
controlla('e da lì si arriva al codice',
  !!firma && firma.fuori.some(u => /github\.com/.test(u)), (firma?.fuori || []).join(' '))
/* ── e un link solo ──
   Il profilo LinkedIn dell'autore stava qui accanto, ed è stato tolto
   apposta: questa è la schermata di un genitore che sta tarando le
   domande di suo figlio, e un profilo professionale in fondo trasforma
   un regalo in un biglietto da visita. Sta in «Come funziona» → «Chi
   l'ha fatto», dove è una risposta invece che un'insegna — e questo
   controllo è qui perché una riga tolta per scelta torna indietro da
   sola alla prima distrazione. */
uguale('e non c\'è nient\'altro: un link solo, il codice',
  (firma?.fuori || []).length, 1)
controlla('niente LinkedIn nelle impostazioni',
  !/linkedin/i.test(JSON.stringify(firma)), (firma?.fuori || []).join(' '))
await page.evaluate(() => document.querySelector('[data-firma]')?.scrollIntoView(false))
await page.waitForTimeout(150)
await scatto(page, 'genitori-firma')
controlla('i rimandi fuori si aprono in un\'altra scheda',
  await page.evaluate(() => [...document.querySelectorAll('[data-firma] a')]
    .every(a => a.target === '_blank' && /noopener/.test(a.rel))))

/* ── 3. il salvataggio contiene i progressi veri ──
   Le monete non si confrontano col numero seminato, e la differenza
   costa un pomeriggio a chi non la sa: il seme porta due campagne a
   mezza strada, e quelle **si meritano tre medaglie**, che alla prima
   apertura vengono pagate (`store/progressi.js`, `PREMI`). Il profilo
   che finisce nel file ha quindi 45 monete più di quelle seminate — o
   non ce le ha ancora, se il salvataggio a scatto ritardato non è
   ancora sceso, ed è così che questo controllo passava per tempismo
   invece che per merito. Si legge quanto c'è davvero un attimo prima
   di scaricare, e si confronta con quello. */
const moneteVere = (await leggiProfilo(page)).coins
controlla('il seme si è preso le medaglie che gli spettano', moneteVere >= 777,
  `${moneteVere} monete`)
const scaricato = page.waitForEvent('download', { timeout: 8000 })
await page.click('.carta >> text="Salva su file"')
const dl = await scaricato
// tenuto da parte: al punto 6 lo si rimette dentro
const salvataggio = resolve(tmpdir(), 'giochi-progressi-prova.json')
await dl.saveAs(salvataggio)
let dati = null
try { dati = JSON.parse(readFileSync(salvataggio, 'utf8')) } catch (e) { /* sotto */ }

controlla('il file si scarica', !!dl)
uguale('si chiama come deve', /^giochi-progressi-\d{4}-\d{2}-\d{2}\.json$/.test(dl.suggestedFilename()), true)
if (dati) {
  const mio = dati.profili?.[GIOCATORE]
  uguale('dentro ci sono le monete vere', mio?.coins, moneteVere)
  uguale('e i conti dei giochi', mio?.totals?.math, 42)
  controlla('è marchiato come salvataggio dei giochi', dati.tipo === 'giochi-bambini')
  /* Le monete da sole non bastano a dire che il salvataggio è buono:
     quello che un genitore chiama «i progressi» è soprattutto cosa il
     bambino sa e dov'è arrivato, e prima qui non lo guardava nessuno.
     Se un giorno l'export perdesse lo stato di apprendimento o una
     campagna, il file continuerebbe a sembrare a posto. */
  uguale('c\'è lo stato di apprendimento, elemento per elemento',
    mio?.items?.['en:dog']?.r, 3)
  uguale('e dove è arrivato nelle campagne', mio?.td?.tappa, 4)
  uguale('anche quelle dei giochi nuovi', mio?.campagne?.dungeon?.tappa, 2)
  controlla('e i traguardi presi', !!mio?.badge)
  controlla('il file si porta dietro anche i nomi', Array.isArray(dati.giocatori))
} else {
  nota('il contenuto del file non è stato leggibile dal test, controllati solo nome e download')
}

/* ── 4. cancellare chiede conferma ── */
await page.click('.carta.pericolo')
await page.waitForSelector('.carta.pericolo.aperta', { timeout: 5000 })
controlla('cancellare chiede conferma invece di fare e basta',
  await page.isVisible('text="Sì, cancella"'))

await page.click('text="No, lascia stare"')
await page.waitForTimeout(150)
controlla('si può tornare indietro', !(await page.isVisible('.carta.pericolo.aperta')))

/* ── 5. cancella davvero ── */
await page.click('.carta.pericolo')
await page.click('text="Sì, cancella"')
await page.waitForTimeout(400)
await page.click('.tondo')                       // torna alla home
await page.waitForSelector('.carte', { timeout: 5000 })
const monete = await page.evaluate(() => {
  const t = document.body.innerText.match(/🪙\s*(\d+)/)
  return t ? Number(t[1]) : null
})
uguale('dopo la cancellazione le monete sono a zero', monete, 0)

/* ── 6. e si rimettono ──
   È il controllo che dà senso a tutti gli altri: un salvataggio che non
   si riesce a rimettere dentro non è una rete di sicurezza, è un file. */
await vaiAiGenitori()
await digita('0000')
await page.waitForSelector('.carte', { timeout: 5000 })
await page.setInputFiles('input[type=file]', salvataggio)
await page.waitForTimeout(600)

const dopoImport = await page.evaluate(() => document.body.innerText)
controlla('dice chi ha rimesso',
  new RegExp('Rimessi i progressi di ' + GIOCATORE).test(dopoImport))

await page.click('.tondo')
await page.waitForSelector('.carte', { timeout: 5000 })
const monete2 = await page.evaluate(() => {
  const t = document.body.innerText.match(/🪙\s*(\d+)/)
  return t ? Number(t[1]) : null
})
uguale('le monete sono tornate quelle salvate', monete2, moneteVere)

/* Un file qualsiasi non deve entrare: sovrascriverebbe i progressi con
   spazzatura, ed è irreversibile. */
const finto = resolve(tmpdir(), 'giochi-non-mio.json')
writeFileSync(finto, JSON.stringify({ ciao: 'mondo' }))
await vaiAiGenitori()
await digita('0000')
await page.waitForSelector('.carte', { timeout: 5000 })
await page.setInputFiles('input[type=file]', finto)
await page.waitForTimeout(400)
controlla('un file estraneo viene rifiutato', await page.isVisible('.avviso'))

/* ── 7. i giochi si spengono uno per uno ──
   È l'interruttore che cambia quello che il bambino vede aprendo il
   gioco: se spegnere non togliesse la carta, o se riaccendere non la
   riportasse, i genitori se ne accorgerebbero solo dal telefono. */
const inHome = async sel => {
  await page.click('button[aria-label="indietro"]')
  await page.waitForSelector('.carte', { timeout: 5000 })
  return page.isVisible(sel)
}
controlla('di partenza il castello è in home', await inHome('.carta.td'))

await vaiAiGenitori()
await digita('0000')
await apriScheda('giochi')
await page.waitForSelector('[data-manopola]', { timeout: 5000 })
await apriBlocco('giochi')
/* quanti sono lo dice l'elenco, non un numero scritto qui: un gioco
   nuovo deve comparire nel quadro, non diventare rosso questo test.
   Quelli in prova non si contano: stanno dietro il loro cancello, e col
   cancello chiuso non c'è niente da accendere. */
const NORMALI = GIOCHI.filter(g => !g.sperimentale)
const IN_PROVA = GIOCHI.filter(g => g.sperimentale)
uguale('nel quadro c\'è una riga per gioco',
       await page.locator('[data-manopola] [data-apri="giochi"] .elenco li').count(),
       NORMALI.length)

/* ── e si spegne dalla sua ✎ ──
   Le carte-interruttore non ci sono più. Erano una fila di levette che
   non diceva niente di quello che stava succedendo: «Difendi il
   Castello» spento non lasciava capire che a quell'età sarebbe comparso
   comunque, né che a un'altra non sarebbe comparso lo stesso. La riga
   del quadro lo dice, e la tacca sceglie **chi decide**. */
await taraGioco('torri', 'no')
controlla('spegnere lo scrive nel profilo',
  (await leggiProfilo(page)).settings.giochi?.torri === false,
  JSON.stringify((await leggiProfilo(page)).settings.giochi || {}))
controlla('e la riga lo dice, senza doverla riaprire',
  (await page.locator('[data-manopola] [data-riga="torri"]').innerText()).includes('spento'))
controlla('la riga di un gioco messo a mano si vede in mezzo alle altre',
  (await page.locator('[data-manopola] [data-riga="torri"] .voce-riga.ritoccata').count()) > 0)

controlla('il castello sparisce dalla home', !(await inHome('.carta.td')))
controlla('gli altri giochi restano', await page.isVisible('.carta.mate'))

/* spegnere non è cancellare: le monete e i progressi non si toccano */
const moneteDopoSpegnimento = await page.evaluate(() => {
  const t = document.body.innerText.match(/🪙\s*(\d+)/)
  return t ? Number(t[1]) : null
})
uguale('spegnere non tocca i progressi', moneteDopoSpegnimento, moneteVere)

/* e la scelta deve sopravvivere alla chiusura del gioco */
await page.waitForTimeout(700)   // il salvataggio è a scatto ritardato
await page.reload()
await page.waitForSelector('.carte', { timeout: 8000 })
controlla('la scelta resta dopo un riavvio', !(await page.isVisible('.carta.td')))

await vaiAiGenitori()
await digita('0000')
await taraGioco('torri', 'difetto')
controlla('rimessa su «come dice l\'età», il castello torna in home',
  await inHome('.carta.td'))

/* ── e la tacca sa dire anche il contrario ──
   «Ce l'ha» è la posizione che prima non esisteva: tiene un gioco in
   casa **anche se l'età dice di no**. Serve al caso in cui l'età
   sbaglia — il fratello piccolo che gioca col grande — e prima non
   c'era nessun modo di dirlo: accendere un gioco «che arriva più
   avanti» non lo faceva comparire, e nessuno diceva perché. */
{
  await vaiAiGenitori()
  await digita('0000')
  await apriScheda('giochi')
  await page.waitForSelector('[data-manopola]', { timeout: 5000 })
  await apriBlocco('giochi')
  const fuori = await page.evaluate(() => {
    const righe = [...document.querySelectorAll('[data-manopola] [data-apri="giochi"] .elenco li')]
    const f = righe.find(r => /arriva più avanti|già passato/.test(r.innerText))
    return f ? f.dataset.riga : null
  })
  if (fuori) {
    controlla(`«${fuori}» a quest'età non è in home`, !(await inHome(`.carta[data-gioco="${fuori}"]`)))
    await vaiAiGenitori()
    await digita('0000')
    await taraGioco(fuori, 'si')
    controlla('tenuto a mano, compare lo stesso in home',
      await inHome(`.carta[data-gioco="${fuori}"]`))
    await vaiAiGenitori()
    await digita('0000')
    await taraGioco(fuori, 'difetto')
    controlla('e rimesso all\'età sparisce di nuovo',
      !(await inHome(`.carta[data-gioco="${fuori}"]`)))
  } else {
    nota('a quest\'età nessun gioco è fuori portata: la forzatura non si può provare qui')
  }
}

/* ── 7b. i giochi in prova ──
   Un gioco che sto ancora scrivendo non deve arrivare ai bambini prima
   che l'abbia deciso io. Non è la ✎ di una riga messa su «non ce
   l'ha»: è un cancello, e col cancello chiuso quel gioco non esiste —
   non è in home e **non è nemmeno nel quadro**, perché non c'è niente
   da accendere. */
if (IN_PROVA.length) {
  /* Il gioco si cerca **dal manifesto**, non da una chiave scritta a
     mano: questo blocco è rimasto fermo finché nessun gioco era in
     prova, e si è risvegliato col selettore di un gioco che nel
     frattempo era stato promosso. Un test che nomina un gioco per
     esteso scade da solo. */
  const primo = IN_PROVA[0]
  const suaCarta = '.carta.gioco[data-gioco="' + primo.chiave + '"]'
  const suaRiga = '[data-manopola] [data-riga="' + primo.chiave + '"]'
  /* qui siamo in home, dove l'ultimo controllo ci ha lasciati */
  controlla('col cancello chiuso, un gioco in prova non è in home',
            !(await page.isVisible(suaCarta)))

  await vaiAiGenitori()
  await digita('0000')
  await apriScheda('giochi')
  await page.waitForSelector('.carta[data-flag="sperimentali"]', { timeout: 5000 })
  await apriBlocco('giochi')
  uguale('e non c\'è nemmeno la sua riga nel quadro',
         await page.locator(suaRiga).count(), 0)

  await page.click('.carta[data-flag="sperimentali"]')
  await page.waitForTimeout(300)
  await apriBlocco('giochi')
  uguale('acceso il cancello, i giochi in prova entrano nel quadro',
         await page.locator('[data-manopola] [data-apri="giochi"] .elenco li').count(),
         NORMALI.length + IN_PROVA.length)
  controlla('adesso in home c\'è', await inHome(suaCarta))

  /* dietro il cancello vale la ✎ di sempre: un gioco in prova si spegne
     e si riaccende come tutti gli altri */
  await vaiAiGenitori()
  await digita('0000')
  await taraGioco(primo.chiave, 'no')
  controlla('e dietro il cancello vale la tacca di sempre',
            !(await inHome(suaCarta)))

  /* e il cancello si richiude: quello che si accende si deve poter
     rispegnere, e da chiuso non conta più cosa c'è dietro */
  await vaiAiGenitori()
  await digita('0000')
  await taraGioco(primo.chiave, 'difetto')          // riacceso il singolo
  await apriScheda('giochi')
  await page.click('.carta[data-flag="sperimentali"]')
  await page.waitForTimeout(200)
  controlla('richiuso il cancello, sparisce di nuovo', !(await inHome(suaCarta)))
}

/* ── 7b-bis. il calcolo a mente dentro gli asteroidi ──
   Il terzo tipo di interruttore, e la differenza conta: non spegne un
   gioco (la carta degli asteroidi resta in home) e non spegne un pezzo
   di scuola. Spegne un MODO di giocare — le tappe a mente spariscono
   dalla fila e i pianeti si richiudono in ordine — e i progressi
   restano dove sono. Chi vuole solo le tabelline passa da qui. */
{
  const contaMappa = async () => {
    await page.click('button[aria-label="indietro"]')
    await page.waitForSelector('.carte', { timeout: 5000 })
    await page.getByText('Asteroidi', { exact: true }).click()
    await page.waitForSelector('.scaletta', { timeout: 5000 })
    const conto = await page.evaluate(() => ({
      pianeti: document.querySelectorAll('.pianeta').length,
      stazioni: document.querySelectorAll('.stazione').length,
      numeri: [...document.querySelectorAll('.pianeta b')].map(b => parseInt(b.textContent, 10)),
    }))
    await page.click('button[aria-label="indietro"]')
    await page.waitForSelector('.carte', { timeout: 5000 })
    return conto
  }

  await vaiAiGenitori()
  await digita('0000')
  await apriScheda('giochi')
  await page.waitForSelector('.carta[data-flag="mente"]', { timeout: 5000 })
  controlla('di partenza il calcolo a mente è acceso',
            !(await page.evaluate(() =>
              document.querySelector('.carta[data-flag="mente"]').className.includes('spento'))))

  const intera = await contaMappa()
  uguale('a fila intera ci sono tutti i pianeti', intera.pianeti, 10)
  controlla('e anche le stazioni', intera.stazioni > 0)

  await vaiAiGenitori()
  await digita('0000')
  await apriScheda('giochi')
  await page.click('.carta[data-flag="mente"]')
  await page.waitForTimeout(200)
  const corta = await contaMappa()
  uguale('spento, le tappe a mente spariscono dalla mappa', corta.stazioni, 0)
  uguale('e i pianeti restano tutti', corta.pianeti, 10)
  /* «senza buchi» è la parte che si vedrebbe solo dal telefono: se la
     numerazione restasse quella della fila intera, i pianeti sarebbero
     il 3, il 4, il 6… cioè numerati sui vuoti di quello che non c'è */
  controlla('numerati da uno in fila, senza buchi',
            corta.numeri.every((n, i) => n === i + 1), corta.numeri.join(', '))
  controlla('e la carta degli asteroidi è ancora in home',
            await page.isVisible('.carta.mate'))

  await vaiAiGenitori()
  await digita('0000')
  await apriScheda('giochi')
  await page.click('.carta[data-flag="mente"]')      // rimesso com'era
  await page.waitForTimeout(200)
  const tornata = await contaMappa()
  uguale('riacceso, le tappe a mente tornano', tornata.stazioni, intera.stazioni)
}

/* ── 7c. spegnere un pezzo di scuola, dalla scheda delle domande ──
   «Cosa sa» non c'è più: era la stessa roba della scheda «Le domande»
   detta in un altro modo, e due elenchi della stessa cosa sono due
   posti dove guardare e uno dove sbagliarsi. Il ✕ di una riga fa
   quello che faceva l'interruttore di quella scheda — spegne **il
   gruppo di scuola**, non la singola tipologia — e la differenza non è
   un dettaglio: i saperi li leggono anche i giochi, e il laboratorio
   delle pozioni senza le conversioni non ha più niente da chiedere.

   Quello che si prova qui è la catena intera fino al profilo, perché è
   quella che può fare danno: quello che si tocca deve essere scritto,
   deve sopravvivere a un riavvio, e deve arrivare fino alla home. */
await vaiAiGenitori()
await digita('0000')
await page.waitForSelector('.schede', { timeout: 5000 })
/* Tre, e rispondono a tre domande diverse: *chi gioca*, *cosa gli
   arriva*, *come sta andando*. «Come va» è tornata dopo essere stata
   sospesa — mostrava solo i segnali, e tre righe senza il resto non
   dicono se sono tre su dieci o tre su centoventi. Quello che fa
   adesso lo prova `integrazione/come-va`; qui basta che ci sia. */
controlla('le schede sono tre: bambini, giochi e domande, come va',
  (await page.locator('.schede button').count()) === 3)
uguale('e «Come va» è una di loro',
  await page.locator('.schede button[data-scheda="comeva"]').count(), 1)
/* «Cosa sa» era la scheda delle domande detta in un altro modo, e
   «Domande» era l'elenco delle classi con quattro tondi per riga: tutte
   e due dicevano quello che il quadro dell'età dice già, e la seconda
   ci aggiungeva una tacca dell'età che era la stessa manopola in un
   altro posto. Si tara nel quadro, e basta. */
for (const morta of ['sa', 'domande'])
  uguale(`la scheda «${morta}» non c'è più`,
         await page.locator(`.schede button[data-scheda="${morta}"]`).count(), 0)

/* ── l'età si legge dove sta il bambino, si cambia dove si tara ──
   La manopola col quadro sotto è alta due schermate, e stava in mezzo
   alla carta di chi gioca: per cambiare il nome a un bambino bisognava
   scorrere tutto l'elenco delle domande. Qui resta la riga che la dice,
   col rimando; la manopola vive nella scheda dove si tara. */
await page.click('.schede button[data-scheda="bambini"]')
await apriScheda('bambini')
await page.waitForSelector('.carta.chi-gioca', { timeout: 5000 })
controlla('la carta di chi gioca dice quanti anni ha',
  (await page.locator('[data-azione="vai-alla-tara"]').innerText()).includes('anni'))
uguale('e la manopola non è più qui in mezzo',
  await page.locator('[data-manopola]').count(), 0)
await page.click('[data-azione="vai-alla-tara"]')
await page.waitForSelector('[data-manopola] .quadro', { timeout: 5000 })
controlla('il rimando porta dove si tara, col quadro già aperto',
  await page.isVisible('[data-manopola] .quadro'))
const anniPrima = (await page.locator('[data-eta-ora]').innerText()).trim()
const etaScritta = () => leggiProfilo(page).then(p => p.settings.eta)
const etaInizio = await etaScritta()
await page.click('[data-eta="su"]')
await page.waitForTimeout(600)
controlla('e si sposta di mezzo anno per volta',
  (await page.locator('[data-eta-ora]').innerText()).trim() !== anniPrima,
  `${anniPrima} → ${(await page.locator('[data-eta-ora]').innerText()).trim()}`)

/* ── muovere non è applicare ──
   La tacca muove una bozza e il quadro sotto diventa l'anteprima; il
   profilo si tocca solo premendo «Applica». Prima si scriveva a ogni
   tacca, e quando lo spostamento cambiava fascia la manopola si
   fermava ad aspettare un cartello che stava in fondo alla colonna,
   fuori dallo schermo: da sopra si vedeva solo una freccia che aveva
   smesso di rispondere. */
uguale('ma muovere la tacca non scrive ancora niente', await etaScritta(), etaInizio)
controlla('e il cartello per applicare si vede', await page.isVisible('[data-conferma="eta"]'))
await page.click('[data-azione="eta-applica"]')
await page.waitForTimeout(600)
uguale('applicando finisce nel profilo', typeof (await etaScritta()), 'number')
/* e il numero scritto è **quello che la tacca mostrava**: un profilo
   che si sposta di suo, o che si ferma mezzo anno prima, da fuori non
   si distingue da uno che non si è mosso affatto. */
const inNumero = t => {
  const n = Number(String(t).match(/\d+/)?.[0])
  return /mezzo/.test(t) ? n + 0.5 : n
}
uguale('e dice il numero che la tacca mostrava', await etaScritta(),
  inNumero((await page.locator('[data-eta-ora]').first().innerText()).trim()))
uguale('applicato, il cartello se ne va',
  await page.locator('[data-conferma="eta"]').count(), 0)

/* ── il quadro dice cosa succede a quell'età ──
   È il motivo per cui la manopola ha preso il posto delle quattro
   carte: sotto la tacca ci sono i giochi in casa, quello che si dà per
   scontato e i quattro gruppi di domande, ognuno che si apre coi nomi
   dentro. Senza, è la manopola muta di prima — e la cosa peggiore è
   che non sembrerebbe rotta. */
controlla('sotto la tacca c\'è l\'elenco dei giochi con lo stato addosso',
  (await page.locator('[data-manopola] [data-apri="giochi"]').count()) > 0)
controlla('e i quattro livelli di padronanza',
  (await page.locator('[data-manopola] [data-apri="medie"]').count()) > 0)

/* Aprire un blocco mostra i nomi: è tutta la differenza fra «57
   domande» e un elenco che si può giudicare. Al primo avvio nessuno sa
   cosa siano dodici emoji in fila, e questo è il modo di scoprirlo
   senza uscire dalla schermata. */
await page.click('[data-manopola] [data-apri="giochi"]')
await page.waitForSelector('[data-manopola] .elenco li', { timeout: 5000 })
controlla('aperto, ogni gioco dice come si chiama e come sta messo',
  await page.evaluate(() => {
    const t = document.querySelector('[data-manopola] .elenco').innerText
    return t.includes('La fattoria') && /c'è|arriva più avanti|già passato/.test(t)
  }))
await page.click('[data-manopola] [data-apri="giochi"]')
await page.waitForTimeout(200)

/* ── e ogni riga si può provare ──
   Un nome non basta e non è colpa del nome: «le analogie fra figure»
   non dice a un grande che aspetto abbia la domanda, e senza vederla
   non può giudicare se sia roba da suo figlio. Il ▶ apre quella vera,
   generata dallo stesso modulo che la darebbe in partita.

   Il `.stop` sul tasto è la parte che si rompe in silenzio: il
   riquadro intero si apre e si chiude al tocco, quindi senza fermarlo
   il ▶ aprirebbe la domanda e nello stesso gesto richiuderebbe
   l'elenco da cui è stata chiesta. */
/* ── DUE LIVELLI, E LO STESSO PEZZO IN PIÙ BLOCCHI ──
   Un blocco si apre sui **pezzi di scuola**, un pezzo sulle sue
   domande. C'era un blocco a parte fatto di gruppi mentre gli altri
   erano fatti di classi: due unità di misura per la stessa roba, e
   nessuna delle due diceva l'altra. */
await page.click('[data-manopola] [data-apri="medie"]')
await page.waitForSelector('[data-manopola] [data-apri="medie"] .prova', { timeout: 5000 })
const quanteRighe = () =>
  page.locator('[data-manopola] [data-apri="medie"] .elenco li').count()
const soloPezzi = await quanteRighe()
await page.locator('[data-manopola] [data-apri="medie"] .elenco li').first().click()
await page.waitForTimeout(300)
controlla('un pezzo di scuola si apre sulle sue domande',
  (await quanteRighe()) > soloPezzi, `${soloPezzi} → ${await quanteRighe()}`)
controlla('e le domande stanno rientrate sotto di lui',
  (await page.locator('[data-manopola] [data-apri="medie"] .elenco .voce-riga.dentro').count()) > 0)
await page.locator('[data-manopola] [data-apri="medie"] .prova').first().click()
await page.waitForSelector('.prova-velo', { timeout: 5000 })
controlla('il ▶ di una riga apre la domanda vera',
  await page.isVisible('.prova-velo'))
/* il ▶ di un pezzo di scuola non pesca nel gruppo intero: scorre le sue
   domande **di quella fascia**, e il contatore è la prova che lo fa */
controlla('e il ▶ di un pezzo di scuola scorre solo le sue',
  /^\d+ di \d+$/.test((await page.locator('[data-conta]').innerText().catch(() => '')).trim()),
  (await page.locator('[data-conta]').innerText().catch(() => 'nessun contatore')).trim())
controlla('e il gruppo da cui si è partiti è rimasto aperto',
  (await page.locator('[data-manopola] [data-apri="medie"] .prova').count()) > 0)
await page.click('.prova-x')
await page.waitForSelector('.prova-velo', { state: 'hidden', timeout: 5000 })
/* ── LA CORREZIONE PICCOLA: LA ✎ DI UNA RIGA ──
   L'età è la manopola grossa e sta sopra. Questa è la riga per volta —
   *le stagioni le davamo per sapute, e a scuola sono indietro di mezzo
   anno* — e vive dentro la riga, non su di lei: a elenco chiuso ci sono
   due tasti soli, ✎ e ▶.

   Le tre cose da tenere ferme sono le tre che rendono onesta la tacca:
   **non scrive muovendosi** (come quella dell'età), **scrive il verso
   giusto** (a destra più difficile, e nel profilo il segno è
   l'opposto), e quello che ha spostato **resta ambra** anche a tacca
   chiusa — se no un grande non ha nessun modo di ritrovare, scorrendo,
   cosa ha messo a mano. */
const ritocchiScritti = async () =>
  (await leggiProfilo(page)).settings.ritocchi || {}
const quanteAmbra = async () => {
  for (const k of ['facili', 'medie', 'toste', 'sotto']) await apriBlocco(k)
  return page.locator('[data-manopola] .voce-riga.ritoccata').count()
}

await apriBlocco('medie')
controlla('una riga del quadro ha due tasti soli: la ✎ e il ▶',
  (await page.locator('[data-manopola] [data-apri="medie"] .matita').count()) > 0)
uguale('e prima di toccarla non c\'è nessun ritocco nel profilo',
  Object.keys(await ritocchiScritti()).length, 0)

await page.locator('[data-manopola] [data-apri="medie"] .matita').first().click()
await page.waitForSelector('[data-taratura]', { timeout: 5000 })
const tarata = await page.locator('[data-taratura]').first().getAttribute('data-taratura')
const dettoPrima = (await page.locator('[data-tara-ora]').first().innerText()).trim()
await page.click('[data-tara="su"]')
await page.waitForTimeout(200)
uguale('muovere la tacca non scrive niente, come quella dell\'età',
  Object.keys(await ritocchiScritti()).length, 0)

await page.click('[data-tara="applica"]')
await page.waitForTimeout(500)
const ritocchi = await ritocchiScritti()
uguale('confermando finisce nel profilo, sotto la chiave di quella riga',
  Object.keys(ritocchi).join(' '), tarata)
uguale('e uno scatto verso destra vuol dire «per lui è più difficile»',
  ritocchi[tarata], -1, `${dettoPrima} → ${JSON.stringify(ritocchi)}`)
controlla('la riga spostata resta ambra, anche a tacca chiusa',
  (await quanteAmbra()) > 0)
uguale('e la tacca si chiude da sé',
  await page.locator('[data-taratura]').count(), 0)

/* Rimettere com'era è una riga sola dentro la tacca, e non lascia
   niente in giro: un ritocco a zero non si scrive (`ritocca()` lo
   cancella), se no il profilo si riempirebbe di zeri che nessuno
   saprebbe più distinguere da una taratura vera. */
await page.locator(`[data-tara-apri="${tarata}"]`).first().click()
await page.waitForSelector('[data-tara="rimetti"]', { timeout: 5000 })
await page.click('[data-tara="rimetti"]')
await page.waitForTimeout(500)
uguale('e «rimettila com\'era» non lascia nemmeno uno zero',
  Object.keys(await ritocchiScritti()).length, 0)
uguale('e la riga torna com\'era', await quanteAmbra(), 0)

/* ── E IL TASTO CHE RIMETTE TUTTO ──
   Le correzioni sono tante e piccole, e dopo un po' nessuno ricorda
   cosa ha toccato: senza un modo di tornare indietro tutti insieme
   l'unica strada era spostare l'età avanti e indietro finché non
   cambiava fascia. Le due cose da tenere ferme sono che **si nasconda
   quando non c'è niente da rimettere** — se no si dubita di aver
   capito cosa fa — e che **dica cosa perde** prima di farlo. */
/* che si nasconda quando non c'è niente lo prova `unita/partenze`
   (`cambia: false`): qui il bambino di prova ha già delle eccezioni
   sue, ed è il caso normale di chi apre questa schermata. */
const etaDiPrima = await etaScritta()

await page.locator(`[data-tara-apri="${tarata}"]`).first().click()
await page.waitForSelector('[data-taratura]', { timeout: 5000 })
await page.click('[data-tara="su"]')
await page.click('[data-tara="applica"]')
await page.waitForTimeout(400)
await page.waitForSelector('[data-azione="rimetti-difetti"]', { timeout: 5000 })
controlla('con qualcosa a mano compare, e dice cosa hai messo',
  (await page.locator('[data-perde-tutto]').innerText()).includes('domanda ritoccata'),
  (await page.locator('[data-azione="rimetti-difetti"]').innerText()).replace(/\n/g, ' · '))

await page.click('[data-azione="rimetti-difetti"]')
await page.waitForSelector('[data-azione="rimetti-no"]', { timeout: 5000 })
controlla('e prima di farlo chiede, dicendo che i progressi non si toccano',
  (await page.locator('[data-azione="rimetti-si"]').isVisible()))
await page.click('[data-azione="rimetti-no"]')
await page.waitForTimeout(200)
uguale('«lascia stare» non tocca niente',
  Object.keys(await ritocchiScritti()).length, 1)

await page.click('[data-azione="rimetti-difetti"]')
await page.waitForSelector('[data-azione="rimetti-si"]', { timeout: 5000 })
await page.click('[data-azione="rimetti-si"]')
await page.waitForTimeout(600)
uguale('confermando, i ritocchi spariscono',
  Object.keys(await ritocchiScritti()).length, 0)
uguale('e il tasto se ne va con loro',
  await page.locator('[data-azione="rimetti-difetti"]').count(), 0)
uguale('l\'età invece resta dov\'era', await etaScritta(), etaDiPrima)

await page.click('[data-manopola] [data-apri="medie"]')
await page.waitForTimeout(200)

await page.click('[data-eta="giu"]')      // rimesso com'era
await page.waitForTimeout(300)
await page.click('[data-azione="eta-applica"]')
await page.waitForTimeout(600)

await apriScheda('giochi')
await page.waitForSelector('[data-manopola] .quadro', { timeout: 5000 })
await scatto(page, 'genitori-domande')

/* Si spegne «Le conversioni»: è il pezzo di scuola che porta via il
   laboratorio, e quindi l'unico il cui effetto si vede anche dalla
   home. Il gesto è l'ultimo scatto della tacca — dopo «un anno e mezzo
   più difficile» non c'è un muro, c'è «non ancora spiegate» — e non
   più il ✕ che stava sulla riga di una domanda spegnendone otto. */
await apriTutto()
controlla('c\'è la riga delle conversioni, con la sua ✎',
  (await page.locator('[data-tara-apri="conversioni"]').count()) > 0)
await taraSapere('conversioni', 'via')

const dopoSpento = await leggiProfilo(page)
uguale('l\'ultimo scatto spegne il pezzo di scuola, nel profilo',
       dopoSpento.settings.sa.conversioni, false)
uguale('e solo quello: acceso resta l\'assenza',
       Object.keys(dopoSpento.settings.sa).length, 1)
await apriBlocco('spenta')
controlla('e le sue domande finiscono nel blocco di quello che hai tolto',
  (await page.locator('[data-manopola] [data-apri="spenta"] [data-riga="conversioni"]').count()) > 0)

/* il degrado che si vede: il laboratorio delle pozioni è fatto tutto di
   conversioni, e senza quelle non è difficile, è da indovinare. Quindi
   sparisce dalla home, e nel quadro la sua riga resta lì con scritto
   perché — invece di sparire senza motivo. */
controlla('il laboratorio delle pozioni sparisce dalla home',
          !(await inHome('.carta.poz')))
await vaiAiGenitori()
await digita('0000')
await apriScheda('giochi')
await page.waitForSelector('[data-manopola]', { timeout: 5000 })
await apriBlocco('giochi')
controlla('e la sua riga dice perché, invece di dire solo «spento»',
  (await page.locator('[data-manopola] [data-riga="pozioni"]').innerText())
    .toLowerCase().includes('conversioni'),
  (await page.locator('[data-manopola] [data-riga="pozioni"]').innerText()).replace(/\n/g, ' · '))

/* riacceso, torna tutto. E si riaccende **da dove è finito**: il blocco
   in fondo non è un cimitero, è il posto dove si va a ripescare. */
await taraSapere('conversioni', 'rimetti')
uguale('rimettendola, la voce sparisce dal profilo',
       (await leggiProfilo(page)).settings.sa?.conversioni, undefined)
controlla('e il gioco torna in home', await inHome('.carta.poz'))

/* ── 7d. la migrazione del flag vecchio ──
   Il profilo di ieri aveva `settings.divisioni: false` e non sapeva
   cosa fossero i macrogruppi. Le divisioni devono restare spente:
   riaccenderle vorrebbe dire rimettere nel castello proprio i calcoli
   che quel bambino non sa fare. */
const vecchio = await leggiProfilo(page)
await semina(page, { settings: { ...vecchio.settings, sa: {}, divisioni: false } })
await page.reload()
await page.waitForSelector('.carte', { timeout: 8000 })
await page.waitForTimeout(700)
const migrato = await leggiProfilo(page)
uguale('il vecchio flag diventa il macrogruppo spento', migrato.settings.sa.divisioni, false)
uguale('e il flag vecchio sparisce', migrato.settings.divisioni, undefined)

/* ── 8. il codice si cambia ──
   Se non si potesse, resterebbe 0000 per sempre: il primo bambino che lo
   legge da sopra la spalla entra dove si cancellano i progressi. E il
   codice nuovo deve valere anche domani, cioè dopo un riavvio. */
await vaiAiGenitori()
await digita('0000')
await page.waitForSelector('.carte', { timeout: 5000 })
await page.click('.carta[data-azione="cambia-codice"]')
await page.waitForSelector('.tastierino', { timeout: 5000 })

/* due volte diverse non passano: chiedere conferma serve a questo */
await digita('1234')
await digita('9999')
await page.waitForTimeout(200)
controlla('due codici diversi non cambiano niente', await page.isVisible('.avviso'))
controlla('e si resta a scegliere il codice nuovo', await page.isVisible('.tastierino'))

await digita('1234')
await digita('1234')
await page.waitForSelector('.carta[data-azione="cambia-codice"]', { timeout: 5000 })
controlla('due volte uguali lo cambiano',
  (await page.evaluate(() => document.body.innerText)).includes('Codice cambiato'))

await page.waitForTimeout(500)
await page.reload()
await page.waitForSelector('.carte', { timeout: 8000 })
await vaiAiGenitori()
await digita('0000')
await page.waitForTimeout(200)
controlla('il vecchio codice non apre più', await page.isVisible('.tastierino'))
await digita('1234')
await page.waitForSelector('.carte', { timeout: 5000 })
controlla('quello nuovo apre, anche dopo un riavvio',
  await page.isVisible('.carta[data-azione="cambia-codice"]'))

/* rimesso com'era: il codice sta fuori dai profili apposta, quindi
   nemmeno «cancella i progressi» lo riporterebbe a 0000 */
await page.click('.carta[data-azione="cambia-codice"]')
await page.waitForSelector('.tastierino', { timeout: 5000 })
await digita('0000')
await digita('0000')
await page.waitForSelector('.carta[data-azione="cambia-codice"]', { timeout: 5000 })

/* ── 9. il modo di dirlo ──
   Il tasto per segnalare sta fuori dalla sezione dei guasti, e qui si
   prova proprio quello: siamo su un profilo che non ha mai rotto niente,
   e deve esserci lo stesso. Metà delle cose che non vanno — un livello
   troppo difficile, una parola sbagliata — non lancia nessun errore, e
   un canale che si apre solo dopo un errore mancherebbe quei casi lì.
   Della versione nell'indirizzo si controlla che ci sia e che sia piena:
   è il dato che nessun genitore saprebbe scrivere a mano, ed è tutto il
   motivo per cui il link si costruisce invece di essere una costante. */
const segnala = '.carta[data-azione="segnala"]'
controlla('si può segnalare anche senza nessun guasto in archivio',
  await page.isVisible(segnala))
const dove = await page.getAttribute(segnala, 'href')
controlla('e il tasto porta al modulo', dove.startsWith('https://tally.so/r/'))
controlla('con la versione già dentro', /[?&]versione=[^&]+/.test(dove))

/* ── 10. chi gioca: aggiungere, rinominare, eliminare ──
   I tre gesti che prima non esistevano — i giocatori erano due scritti
   nel codice. Si provano dallo schermo e non dallo store, perché quello
   che conta è che un genitore ci arrivi: un'API giusta dietro una
   schermata che non la offre non serve a niente.

   ── LA SCHERMATA È DI CHI STA GIOCANDO ADESSO ──
   Qui c'era il roster intero, con «Cambia nome» ed «Elimina» su ogni
   riga: sei bottoni per tre bambini, in una schermata dove tutto il
   resto (giochi, saperi, domande, età) parla di **uno solo** — e per
   giunta metà di quei comandi funzionava solo per quello, perché il
   profilo degli altri in memoria non c'è. Adesso la carta è una, gli
   altri sono una riga di nomi, e si passa a loro dalla home. */
await page.click('button[aria-label="indietro"]')   // il punto 9 finisce dentro i genitori
await page.waitForSelector('.carte', { timeout: 5000 })
await vaiAiGenitori()
await digita('0000')
await apriScheda('bambini')
await page.waitForSelector('.carta[data-azione="aggiungi-giocatore"]', { timeout: 5000 })
uguale('la carta è una sola: quella di chi gioca adesso',
  await page.locator('.carta.chi-gioca').count(), 1)
uguale('e con un bambino solo non c\'è nessuna riga di altri',
  await page.locator('[data-altri-giocatori]').count(), 0)

/* ── aggiungere è lo stesso wizard del primo avvio ──
   Erano due moduli diversi per la stessa domanda, e quello di qui era
   la copia peggiore: il bambino nuovo nasceva e restava fermo, e per
   farlo giocare bisognava uscire, tornare in home e sceglierlo mentre
   lui guardava. Adesso è la stessa schermata, e finisce **entrando in
   partita con lui**. */
await page.click('.carta[data-azione="aggiungi-giocatore"]')
await page.waitForSelector('.benvenuto', { timeout: 5000 })
controlla('si aggiunge dalla stessa schermata del primo avvio',
  await page.isVisible('.benvenuto'))
controlla('e si può lasciare stare',
  await page.isVisible('[data-azione="lascia-stare"]'))
uguale('col campo vuoto non si va avanti', await page.isDisabled('.via'), true)

await page.fill('.benvenuto .nome', 'Federica')
await page.click('.benvenuto .via')
await page.waitForSelector('[data-manopola]', { timeout: 5000 })

/* ── quanti anni ha ──
   Col solo nome non si aggiunge: l'età decide cosa il bambino si
   troverà in home la prima volta, e una risposta preselezionata si
   preme senza leggerla. Il tasto spento è il modo di chiederlo senza
   scriverlo. */
/* La manopola nasce sui quattro anni: chi aggiunge un bambino sta
   quasi sempre aggiungendo il più piccolo di casa, e da lì si sale
   finché l'elenco di quello che si dà per scontato non comincia a dire
   cose che non sa. Otto tocchi per arrivare a otto anni. */
uguale('la manopola nasce sui quattro anni',
  (await page.locator('[data-eta-ora]').innerText()).trim(), '4 anni')
for (let i = 0; i < 8; i++) await page.click('[data-eta="su"]')
await page.waitForTimeout(250)
uguale('la manopola dice a che età si è fermata',
  (await page.locator('[data-eta-ora]').innerText()).trim(), '8 anni')
controlla('e il quadro dice cosa sta per succedere',
  await page.isVisible('[data-manopola] .quadro'))

await page.click('[data-azione="si-gioca"]')
await page.waitForSelector('.carte', { timeout: 8000 })

/* ── si esce giocando con lui ──
   È il cambiamento che si nota di più: prima si tornava alle
   impostazioni del bambino di prima. Adesso il gioco è suo. */
controlla('finito il wizard si è in home', await page.isVisible('.carta.gioco'))
uguale('e adesso la home lascia scegliere', await page.locator('.gioc').count(), 2)

/* Il profilo nuovo è suo e parte da zero: se ereditasse le monete
   dell'altro, i due bambini starebbero giocando lo stesso profilo. */
const moneteNuovo = await page.evaluate(() => {
  const t = document.body.innerText.match(/🪙\s*(\d+)/)
  return t ? Number(t[1]) : null
})
uguale('chi entra la prima volta parte da zero, non con le monete dell\'altro',
  moneteNuovo, 0)

/* ── l'età ha fatto qualcosa ──
   Si guarda dalla home di Federica e non dallo store: quello che conta è
   che il bambino non veda quelle carte, non che una chiave sia scritta
   da qualche parte. Otto anni toglie i giochi per i più piccoli e
   lascia tutto il resto — se togliesse anche il castello sarebbe una
   partenza che spegne troppo, e nessuno se ne accorgerebbe fino a che
   un bambino non chiede dov'è finito. */
controlla('a chi comincia a otto anni i giochi per i piccoli non compaiono',
  !(await page.isVisible('.carta[data-gioco="conta"]')))
controlla('e nemmeno il secondo dei due',
  !(await page.isVisible('.carta[data-gioco="prima-dopo"]')))
controlla('ma il castello c\'è', await page.isVisible('.carta.td'))
controlla('e gli asteroidi pure', await page.isVisible('.carta.mate'))

/* Rinominare tocca l'etichetta e non i progressi: è tutto il senso di
   avere un id separato dal nome. Si fa su Federica, che è quella che
   sta giocando adesso — l'unica che questa schermata offre. */
await vaiAiGenitori()
await digita('0000')
await apriScheda('bambini')
await page.waitForSelector('.carta.chi-gioca', { timeout: 5000 })
controlla('la carta è di chi gioca, cioè Federica',
  await page.isVisible('.carta.chi-gioca:has-text("Federica")'))
controlla('e gli altri sono una riga di nomi',
  await page.isVisible('[data-altri-giocatori]'))
uguale('con dentro il fratello', 1,
  await page.locator(`[data-altri-giocatori]:has-text("${GIOCATORE}")`).count())

await page.click('.carta.chi-gioca button[data-azione="rinomina"]')
await page.waitForSelector('.carta.aperta .nome', { timeout: 5000 })
await page.fill('.carta.aperta .nome', 'Fede')
await page.click('.carta.aperta button[type="submit"]')
await page.waitForTimeout(500)
controlla('il nome cambia', await page.isVisible('.carta.chi-gioca:has-text("Fede")'))
controlla('e non se n\'è creato un altro: gli altri restano uno',
  await page.isVisible(`[data-altri-giocatori]:has-text("${GIOCATORE}")`))
uguale('con una carta sola, che è di chi gioca',
  await page.locator('.carta.chi-gioca').count(), 1)

/* Eliminare chiede conferma: è l'unico gesto di questa schermata che
   butta via i progressi di qualcuno senza possibilità di tornare. */
await page.click('.carta.chi-gioca button[data-azione="elimina"]')
await page.waitForSelector('.carta.pericolo.aperta', { timeout: 5000 })
controlla('eliminare chiede conferma', await page.isVisible('text="Sì, elimina"'))
await page.click('text="No, lascia stare"')
await page.waitForTimeout(200)
controlla('e si può tornare indietro',
  await page.isVisible('.carta.chi-gioca:has-text("Fede")'))

await page.click('.carta.chi-gioca button[data-azione="elimina"]')
await page.click('text="Sì, elimina"')
await page.waitForSelector('.carta.gioco', { timeout: 8000 })
/* Si eliminava chi stava giocando: restare nelle impostazioni vorrebbe
   dire il tastierino del codice davanti, su un profilo che non esiste
   più. Si va in home, dove si sceglie chi gioca. */
controlla('eliminato chi giocava si torna in home', await page.isVisible('.carta.gioco'))
uguale('e resta un bambino solo', await page.locator('.gioc').count(), 0)
controlla('e con lui è sparito il suo salvataggio', !(await page.evaluate(() =>
  new Promise(ok => {
    const r = indexedDB.open('giochi-bambini', 1)
    r.onsuccess = () => {
      const s = r.result.transaction('kv', 'readonly').objectStore('kv')
      const g = s.getAllKeys()
      g.onsuccess = () => ok(g.result.some(k => String(k).startsWith('profilo:g')))
    }
  }))))

await vaiAiGenitori()
await digita('0000')
await apriScheda('bambini')
await page.waitForSelector('.carta.chi-gioca', { timeout: 5000 })

/* ── 10b. giudicare una domanda ──
   Il giro completo di quello che non lancia nessun errore: una domanda
   giusta ma fuori misura. Si accende l'interruttore, si apre una
   domanda vera dalla scheda «cosa sa» — è il posto dove le domande si
   scorrono apposta — si tocca 😰, e quello che si è toccato deve
   ritrovarsi qui dentro pronto da mandare.

   Il pezzo che conta è la RICARICA: giudizi e interruttore stanno fuori
   dai profili, come il codice dei genitori, e devono sopravvivere a un
   riavvio e a un cambio di bambino. Se finissero in `settings` questo
   controllo li perderebbe. */
await apriScheda('giochi')        // i giudizi stanno dove si guardano le domande
controlla('l\'interruttore dei giudizi c\'è', await page.isVisible('.carta[data-flag="giudizi"]'))
controlla('e parte spento',
  await page.evaluate(() => document.querySelector('.carta[data-flag="giudizi"]').className.includes('spento')))
uguale('spento non c\'è niente da mandare',
  await page.locator('.carta[data-azione="giudizi"]').count(), 0)

await page.click('.carta[data-flag="giudizi"]')
await page.waitForTimeout(200)

/* la domanda si apre dal quadro, che è l'unico posto da cui si aprono:
   il ▶ di un pezzo di scuola scorre le sue, una per una */
await page.waitForSelector('[data-manopola] .quadro', { timeout: 5000 })
await apriBlocco('medie')
await page.locator('[data-manopola] [data-apri="medie"] .prova').first().click()
await page.waitForSelector('.prova-velo', { timeout: 5000 })
controlla('sopra la domanda compaiono i tre tasti',
  await page.isVisible('[data-che="giudizio"]'))
await scatto(page, 'giudizio')

await page.click('[data-verdetto="difficile"]')
await page.waitForTimeout(400)
await page.click('.prova-x')
await page.waitForTimeout(300)

/* riaperta da capo: è il controllo vero */
await page.reload()
await page.waitForSelector('.carte', { timeout: 8000 })
await vaiAiGenitori()
await digita('0000')
await apriScheda('giochi')
await page.waitForSelector('.carta[data-flag="giudizi"]', { timeout: 5000 })
controlla('l\'interruttore è rimasto acceso dopo il riavvio',
  !(await page.evaluate(() => document.querySelector('.carta[data-flag="giudizi"]').className.includes('spento'))))

const carta = page.locator('.carta[data-azione="giudizi"]')
uguale('il giudizio è in archivio', await carta.count(), 1)
const scritto = await carta.innerText()
controlla('e dice cosa parte', scritto.includes('1 domanda segnata'), scritto)
controlla('con dentro il verdetto e il modulo', scritto.includes('difficile'), scritto)

const modulo = await page.getAttribute('[data-azione="manda-giudizi"]', 'href')
controlla('il modulo si apre già compilato',
  modulo.includes('giudizi=') && modulo.includes('versione='), modulo)
controlla('e ci sta dentro un indirizzo', modulo.length < 6500, modulo.length + ' caratteri')

await page.click('[data-azione="scorda-giudizi"]')
await page.waitForTimeout(300)
uguale('cancellati spariscono', await page.locator('.carta[data-azione="giudizi"]').count(), 0)
await page.click('.carta[data-flag="giudizi"]')   // rimesso com'era
await page.waitForTimeout(200)

/* ── 11. il muto è del bambino, non del telefono ──
   `settings.sound` c'era dal principio e non lo leggeva nessuno:
   l'audio era una variabile globale riaccesa a ogni avvio. */
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('.carte', { timeout: 5000 })
// il tasto sta nella barra, e la home non ce l'ha: si passa dall'albo
await page.click('.fascia')
await page.waitForSelector('button[aria-label="suono"]', { timeout: 5000 })
await page.click('button[aria-label="suono"]')
await page.waitForTimeout(700)
uguale('spegnere il suono finisce nel profilo',
  (await leggiProfilo(page)).settings.sound, false)

await page.reload()
await page.waitForSelector('.carte', { timeout: 8000 })
await page.click('.fascia')
await page.waitForSelector('button[aria-label="suono"]', { timeout: 5000 })
uguale('e resta spento anche riaprendo il gioco',
  await page.evaluate(() => document.querySelector('button[aria-label="suono"]').textContent.trim()), '🔇')
await page.click('button[aria-label="suono"]')   // rimesso com'era
await page.waitForTimeout(500)

/* ── 12. la manopola che riscrive, e la conferma ──
   Qui c'era «Rimetti giochi e domande»: quattro carte che riscrivevano
   tutto in blocco, dieci pixel sotto un `− anni +` che spostava solo
   l'età. Due manopole per la stessa cosa, indistinguibili a guardarle,
   e una delle due cancellava le scelte fatte a mano senza dirlo.

   Adesso la manopola è una e il tasto non c'è più: quello che faceva
   succede spostandosi di fascia, ma **detto prima invece che dopo** e
   solo quando c'è davvero qualcosa da riscrivere. I due casi si
   provano tutti e due, perché sbagliare la condizione è invisibile —
   chiedere sempre è un questionario, non chiedere mai è una trappola.

   Sta in fondo apposta: riscrive giochi e saperi, quindi lo stato che
   lascia non deve arrivare a nessun altro punto del test. */
await page.click('button[aria-label="indietro"]')   // il punto 11 finisce nell'albo
await page.waitForSelector('.carte', { timeout: 5000 })
await vaiAiGenitori()
await digita('0000')
/* Prima si spegne un gioco a mano: è quello che rende questo bambino
   «su misura», ed è quello che la conferma deve annunciare. */
await taraGioco('dungeon', 'no')
await apriScheda('giochi')
await page.waitForSelector('[data-manopola]', { timeout: 5000 })

/* ── mezzo anno dentro la stessa fascia: si applica, e lo dice ──
   Il cartello c'è sempre — muovere e applicare sono due gesti, in
   tutti i casi — ma qui dice l'altra metà della regola: si sposta solo
   la mira delle domande, e quello che il grande ha messo a mano resta
   dov'era. Senza quella riga «Applica» sembrerebbe pericoloso quanto
   il caso che riscrive. */
const monetePrima = (await leggiProfilo(page)).coins
const etaPrima = (await leggiProfilo(page)).settings.eta
await page.click('[data-eta="su"]')
await page.waitForSelector('[data-conferma="eta"]', { timeout: 5000 })
controlla('dentro la stessa fascia il cartello dice che non porta via niente',
  await page.evaluate(() => document.querySelector('[data-conferma="eta"]')
    .innerText.includes('si sposta solo la mira')))
uguale('e non c\'è nessun avviso di roba che se ne va',
  await page.locator('[data-conferma="eta"] [data-perde]').count(), 0)
uguale('finché non si applica, l\'età non si muove',
  (await leggiProfilo(page)).settings.eta, etaPrima)
await page.click('[data-azione="eta-applica"]')
await page.waitForTimeout(500)
uguale('applicando si sposta davvero', (await leggiProfilo(page)).settings.eta, etaPrima + 0.5)
controlla('col gioco spento a mano rimasto spento',
  (await leggiProfilo(page)).settings.giochi.dungeon === false)
await page.click('[data-eta="giu"]')          // rimesso com'era
await page.waitForTimeout(300)
await page.click('[data-azione="eta-applica"]')
await page.waitForTimeout(400)

/* ── la tacca che cambia fascia: lo dice, e dice quanto costa ──
   Le scelte fatte a mano tornerebbero al difetto, e questo va detto
   **prima**, con dei numeri: «2 giochi messi a mano, 1 domanda
   ritoccata» è una domanda a cui si può rispondere, «sei sicuro?» no. */
await page.click('[data-eta="giu"]')
await page.waitForSelector('[data-conferma="eta"] [data-perde]', { timeout: 5000 })
controlla('cambiando fascia con roba sistemata a mano lo si legge prima',
  await page.evaluate(() => document.querySelector('[data-conferma="eta"]')
    .innerText.includes('tornano di partenza')))
controlla('e si dice cosa si perde, non «sei sicuro?»',
  await page.evaluate(() =>
    document.querySelector('[data-conferma="eta"]').innerText.includes('a mano')))
uguale('e finché non si applica l\'età non si muove',
  (await leggiProfilo(page)).settings.eta, etaPrima)

/* Il cartello sta **appiccicato in fondo allo schermo**, e non è un
   dettaglio di stile: prima stava in coda alla colonna, sotto un
   quadro alto due schermate, e chi spostava la manopola non lo vedeva
   mai — vedeva una freccia che aveva smesso di rispondere. */
const doveIlCartello = await page.locator('[data-conferma="eta"]').boundingBox()
const altoSchermo = page.viewportSize().height
controlla('e si vede senza scorrere, appiccicato in fondo',
  !!doveIlCartello && doveIlCartello.y + doveIlCartello.height <= altoSchermo + 2,
  JSON.stringify(doveIlCartello))

/* «Annulla» non deve spostare niente: una conferma che ha già fatto la
   cosa non è una conferma. E rimette la tacca dov'era, se no resterebbe
   a schermo un numero che non è quello del bambino. */
await page.click('[data-azione="eta-annulla"]')
await page.waitForTimeout(400)
controlla('annullando, il gioco spento resta spento',
  (await leggiProfilo(page)).settings.giochi.dungeon === false)
uguale('e l\'età nemmeno', (await leggiProfilo(page)).settings.eta, etaPrima)
uguale('la tacca torna sull\'età vera',
  (await page.locator('[data-eta-ora]').first().innerText()).trim(),
  etaPrima % 1 ? `${Math.floor(etaPrima)} anni e mezzo` : `${etaPrima} anni`)
uguale('e il cartello sparisce', await page.locator('[data-conferma="eta"]').count(), 0)

await page.click('[data-eta="giu"]')
await page.waitForSelector('[data-conferma="eta"]', { timeout: 5000 })
await page.click('[data-azione="eta-applica"]')
await page.waitForTimeout(600)
controlla('applicando lo dice invece di restare muta',
  await page.evaluate(() => document.body.innerText.includes('è tarato su')))
uguale('e stavolta si è mosso', (await leggiProfilo(page)).settings.eta, etaPrima - 0.5)
controlla('con le scelte a mano ripartite dai difetti',
  (await leggiProfilo(page)).settings.giochi.dungeon === undefined)

/* Scendere di sei tacche è **un solo Applica**: la bozza si muove
   quanto si vuole e si scrive una volta. Prima ogni tacca era una
   scrittura, e attraversare tre fasce voleva dire tre riscritture di
   giochi e saperi per arrivare dove si voleva arrivare. */
for (let i = 0; i < 6; i++) { await page.click('[data-eta="giu"]'); await page.waitForTimeout(120) }
await page.waitForTimeout(300)
uguale('sei tacche, e il profilo è ancora fermo',
  (await leggiProfilo(page)).settings.eta, etaPrima - 0.5)
await page.click('[data-azione="eta-applica"]')
await page.waitForTimeout(600)
uguale('un Applica solo, fino in fondo',
  (await leggiProfilo(page)).settings.eta, etaPrima - 3.5)

await page.click('button[aria-label="indietro"]')
await page.waitForSelector('.carte', { timeout: 5000 })
const dopoFascia = await page.evaluate(() =>
  [...document.querySelectorAll('.carta.gioco[data-gioco]')].map(c => c.dataset.gioco))
controlla('e in home restano solo i giochi per i piccoli',
  dopoFascia.includes('conta') && !dopoFascia.includes('torri'), dopoFascia.join(','))
/* Quello che non deve succedere: l'età decide cosa si vede, non
   cancella niente di quello che è stato guadagnato. */
uguale('i progressi non si sono mossi', (await leggiProfilo(page)).coins, monetePrima)

rmSync(salvataggio, { force: true })
rmSync(finto, { force: true })

uguale('nessun errore in console', errori.length, 0)
if (errori.length) errori.forEach(e => nota(e))

await browser.close()
riassunto('la schermata dei genitori')
