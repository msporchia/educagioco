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
await page.waitForSelector('.carta.gioco', { timeout: 5000 })
/* quanti sono lo dice l'elenco, non un numero scritto qui: un gioco nuovo
   deve far comparire il suo interruttore, non diventare rosso questo test.
   Quelli in prova non si contano: stanno dietro il loro cancello, e col
   cancello chiuso non c'è niente da accendere. */
const NORMALI = GIOCHI.filter(g => !g.sperimentale)
const IN_PROVA = GIOCHI.filter(g => g.sperimentale)
uguale('c\'è un interruttore per gioco',
       await page.locator('.carta.gioco').count(), NORMALI.length)

await page.click('.carta.gioco[data-gioco="torri"]')
await page.waitForTimeout(150)
controlla('spegnere lo dice invece di restare muto',
  (await page.evaluate(() => document.body.innerText)).includes('sparisce dalla home'))
controlla('l\'interruttore resta giù',
  await page.isVisible('.carta.gioco[data-gioco="torri"].spento'))

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
await apriScheda('giochi')
await page.waitForSelector('.carta.gioco', { timeout: 5000 })
await page.click('.carta.gioco[data-gioco="torri"]')
await page.waitForTimeout(150)
controlla('il castello torna in home', await inHome('.carta.td'))

/* ── 7b. i giochi in prova ──
   Un gioco che sto ancora scrivendo non deve arrivare ai bambini prima
   che l'abbia deciso io. Non è l'interruttore di sempre messo giù: è un
   cancello, e col cancello chiuso quel gioco non esiste — non è in home
   e non è nemmeno qui fra le carte da accendere. */
if (IN_PROVA.length) {
  const primo = IN_PROVA[0]
  /* La carta si cerca **dal manifesto**, non da una classe scritta a mano:
     questo blocco è rimasto fermo finché nessun gioco era in prova, e si è
     risvegliato con il selettore di un gioco che nel frattempo era stato
     promosso. Un test che nomina un gioco per esteso scade da solo. */
  const suaCarta = '.carta.gioco[data-gioco="' + primo.chiave + '"]'
  /* qui siamo in home, dove l'ultimo controllo ci ha lasciati */
  controlla('col cancello chiuso, un gioco in prova non è in home',
            !(await page.isVisible(suaCarta)))

  await vaiAiGenitori()
  await digita('0000')
  await apriScheda('giochi')
  await page.waitForSelector('.carta[data-flag="sperimentali"]', { timeout: 5000 })
  uguale('e non c\'è nemmeno il suo interruttore',
         await page.locator('.carta.gioco.prova').count(), 0)

  await page.click('.carta[data-flag="sperimentali"]')
  await page.waitForTimeout(200)
  uguale('acceso il cancello, gli interruttori dei giochi in prova compaiono',
         await page.locator('.carta.gioco.prova').count(), IN_PROVA.length)
  controlla('e la carta dice che è roba a metà',
            (await page.locator('.carta.gioco.prova').first().innerText()).toLowerCase()
              .includes('in prova'))
  controlla('adesso in home c\'è', await inHome(suaCarta))

  /* dietro il cancello resta l'interruttore di sempre: un gioco in prova
     si spegne e si riaccende come tutti gli altri */
  await vaiAiGenitori()
  await digita('0000')
  await apriScheda('giochi')
  await page.click(suaCarta)
  await page.waitForTimeout(200)
  controlla('e dietro il cancello vale l\'interruttore di sempre',
            !(await inHome(suaCarta)))

  /* e il cancello si richiude: quello che si accende si deve poter
     rispegnere, e da chiuso non conta più cosa c'è dietro */
  await vaiAiGenitori()
  await digita('0000')
  await apriScheda('giochi')
  await page.click(suaCarta)                        // riacceso il singolo
  await page.waitForTimeout(150)
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
controlla('le schede sono tre: bambini, domande, giochi',
  (await page.locator('.schede button').count()) === 3)
controlla('e «Cosa sa» non c\'è più',
  (await page.locator('.schede button[data-scheda="sa"]').count()) === 0)

/* ── l'età sta dove uno la cerca ──
   È il numero da cui dipende tutto quello che il gioco chiede, e stava
   solo in fondo alla scheda delle domande. Adesso è nella riga del
   bambino, dove uno guarda quando pensa «quanti anni ha». */
await page.click('.schede button[data-scheda="bambini"]')
await apriScheda('bambini')
await page.waitForSelector('.carta.chi-gioca', { timeout: 5000 })
controlla('la carta di chi gioca mostra l\'età', await page.isVisible('[data-eta-ora]'))
controlla('e sotto c\'è il quadro di quell\'età, senza dover muovere niente',
  await page.isVisible('[data-manopola] .quadro'))
const anniPrima = (await page.locator('[data-eta-ora]').innerText()).trim()
await page.click('[data-eta="su"]')
await page.waitForTimeout(600)
controlla('e si sposta di mezzo anno per volta',
  (await page.locator('[data-eta-ora]').innerText()).trim() !== anniPrima,
  `${anniPrima} → ${(await page.locator('[data-eta-ora]').innerText()).trim()}`)
uguale('finendo nel profilo', typeof (await leggiProfilo(page)).settings.eta, 'number')

/* ── il quadro dice cosa succede a quell'età ──
   È il motivo per cui la manopola ha preso il posto delle quattro
   carte: sotto la tacca ci sono i giochi in casa, quello che si dà per
   scontato e i quattro gruppi di domande, ognuno che si apre coi nomi
   dentro. Senza, è la manopola muta di prima — e la cosa peggiore è
   che non sembrerebbe rotta. */
controlla('sotto la tacca c\'è l\'elenco dei giochi con lo stato addosso',
  (await page.locator('[data-manopola] [data-apri="giochi"]').count()) > 0)
controlla('e quello che si dà per scontato che sappia',
  (await page.locator('[data-manopola] [data-apri="sa"]').count()) > 0)
controlla('e i gruppi di domande',
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
await page.click('[data-manopola] [data-apri="medie"]')
await page.waitForSelector('[data-manopola] [data-apri="medie"] .prova', { timeout: 5000 })
await page.locator('[data-manopola] [data-apri="medie"] .prova').first().click()
await page.waitForSelector('.prova-velo', { timeout: 5000 })
controlla('il ▶ di una riga apre la domanda vera',
  await page.isVisible('.prova-velo'))
controlla('e il gruppo da cui si è partiti è rimasto aperto',
  (await page.locator('[data-manopola] [data-apri="medie"] .prova').count()) > 0)
await page.click('.prova-x')
await page.waitForSelector('.prova-velo', { state: 'hidden', timeout: 5000 })
await page.click('[data-manopola] [data-apri="medie"]')
await page.waitForTimeout(200)

await page.click('[data-eta="giu"]')      // rimesso com'era
await page.waitForTimeout(600)

await apriScheda('domande')
await page.waitForSelector('.blocco .riga', { timeout: 5000 })
await scatto(page, 'genitori-domande')

/* si cerca la riga di una conversione: è quella che porta via il
   laboratorio, e quindi l'unica che si vede anche dalla home */
const rigaMis = await page.evaluate(() => {
  const r = [...document.querySelectorAll('.riga')]
    .find(x => x.querySelector('[data-spegni]')?.getAttribute('aria-label')?.includes('conversioni'))
  return r ? r.dataset.classe : null
})
controlla('c\'è una riga che spegne le conversioni', !!rigaMis, String(rigaMis))
await page.click(`[data-spegni="${rigaMis}"]`)
await page.waitForTimeout(700)

const dopoSpento = await leggiProfilo(page)
uguale('spegnere finisce nel profilo', dopoSpento.settings.sa.conversioni, false)
uguale('e solo quello: acceso resta l\'assenza',
       Object.keys(dopoSpento.settings.sa).length, 1)
controlla('le sue domande finiscono nel blocco delle spente',
  (await page.locator('.blocco.spenta .riga').count()) === 0 ||
  await page.isVisible('[data-apri="spenta"]'))

/* il degrado che si vede: il laboratorio delle pozioni è fatto tutto di
   conversioni, e senza quelle non è difficile, è da indovinare. Quindi
   sparisce dalla home, e nella scheda dei giochi la sua carta resta lì
   con scritto perché — invece di sparire senza motivo. */
controlla('il laboratorio delle pozioni sparisce dalla home',
          !(await inHome('.carta.poz')))
await vaiAiGenitori()
await digita('0000')
await apriScheda('giochi')
await page.waitForSelector('.carta.gioco[data-gioco="pozioni"]', { timeout: 5000 })
controlla('e la sua carta dice perché',
  (await page.locator('.carta.gioco[data-gioco="pozioni"]').innerText()).includes('spento'))

/* riacceso, torna tutto */
await apriScheda('domande')
await page.waitForSelector('.blocco', { timeout: 5000 })
await page.click('[data-apri="spenta"]')
await page.waitForTimeout(300)
controlla('le spente si ritrovano, in fondo',
  (await page.locator('.blocco.spenta .riga').count()) > 0)
await page.locator('.blocco.spenta [data-riaccendi]').first().click()
await page.waitForTimeout(700)
uguale('riaccendere toglie la voce dal profilo',
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
await apriScheda('domande')       // i giudizi stanno con le domande, non coi giochi
controlla('l\'interruttore dei giudizi c\'è', await page.isVisible('.carta[data-flag="giudizi"]'))
controlla('e parte spento',
  await page.evaluate(() => document.querySelector('.carta[data-flag="giudizi"]').className.includes('spento')))
uguale('spento non c\'è niente da mandare',
  await page.locator('.carta[data-azione="giudizi"]').count(), 0)

await page.click('.carta[data-flag="giudizi"]')
await page.waitForTimeout(200)

await page.waitForSelector('.blocco .riga', { timeout: 5000 })
await page.locator('.blocco.medie [data-prova-classe]').first().click()
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
await apriScheda('domande')
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
await apriScheda('bambini')
await page.waitForSelector('[data-manopola]', { timeout: 5000 })

/* Prima si spegne un gioco a mano: è quello che rende questo bambino
   «su misura», ed è quello che la conferma deve annunciare. */
await apriScheda('giochi')
await page.waitForSelector('.carta.gioco', { timeout: 5000 })
await page.click('.carta.gioco[data-gioco="dungeon"]')
await page.waitForTimeout(300)
await apriScheda('bambini')
await page.waitForSelector('[data-manopola]', { timeout: 5000 })

/* ── mezzo anno dentro la stessa fascia: muto ──
   È la promessa che rende la manopola usabile. Se chiedesse conferma
   anche qui, spostare l'età diventerebbe una cosa che non si fa. */
const monetePrima = (await leggiProfilo(page)).coins
const etaPrima = (await leggiProfilo(page)).settings.eta
await page.click('[data-eta="su"]')
await page.waitForTimeout(500)
uguale('mezzo anno dentro la stessa fascia non chiede niente',
  await page.locator('[data-conferma="eta"]').count(), 0)
uguale('e si sposta davvero', (await leggiProfilo(page)).settings.eta, etaPrima + 0.5)
controlla('col gioco spento a mano rimasto spento',
  (await leggiProfilo(page)).settings.giochi.dungeon === false)
await page.click('[data-eta="giu"]')          // rimesso com'era
await page.waitForTimeout(400)

/* ── la tacca che cambia fascia: chiede ──
   Le scelte fatte a mano tornerebbero al difetto, e questo va detto
   prima. Un tocco solo, e la conferma resta lì: finché è aperta la
   manopola non si sposta, che è il motivo per cui esiste. */
await page.click('[data-eta="giu"]')
await page.waitForSelector('[data-conferma="eta"]', { timeout: 5000 })
controlla('cambiando fascia con roba sistemata a mano si chiede prima',
  await page.isVisible('[data-conferma="eta"]'))
controlla('e si dice cosa si perde, non «sei sicuro?»',
  await page.evaluate(() =>
    document.querySelector('[data-conferma="eta"]').innerText.includes('giochi spenti a mano')))
uguale('e finché non si risponde l\'età non si muove',
  (await leggiProfilo(page)).settings.eta, etaPrima)

/* «Lascia stare» non deve spostare niente: una conferma che ha già
   fatto la cosa non è una conferma. */
await page.click('[data-azione="eta-lascia"]')
await page.waitForTimeout(400)
controlla('lasciando stare, il gioco spento resta spento',
  (await leggiProfilo(page)).settings.giochi.dungeon === false)
uguale('e l\'età nemmeno', (await leggiProfilo(page)).settings.eta, etaPrima)

await page.click('[data-eta="giu"]')
await page.waitForSelector('[data-conferma="eta"]', { timeout: 5000 })
await page.click('[data-azione="eta-conferma"]')
await page.waitForTimeout(600)
controlla('confermando lo dice invece di restare muta',
  await page.evaluate(() => document.body.innerText.includes('è tarato su')))
uguale('e stavolta si è mosso', (await leggiProfilo(page)).settings.eta, etaPrima - 0.5)
controlla('con le scelte a mano ripartite dai difetti',
  (await leggiProfilo(page)).settings.giochi.dungeon === undefined)

/* Da qui in giù non c'è più niente di suo da perdere, quindi le fasce
   si attraversano in silenzio: è l'altra metà della regola, e senza si
   finirebbe a rispondere alla stessa domanda a ogni tacca. */
for (let i = 0; i < 6; i++) { await page.click('[data-eta="giu"]'); await page.waitForTimeout(160) }
await page.waitForTimeout(500)
uguale('sui difetti si scende senza che chieda più niente',
  await page.locator('[data-conferma="eta"]').count(), 0)
uguale('fino in fondo', (await leggiProfilo(page)).settings.eta, etaPrima - 3.5)

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
