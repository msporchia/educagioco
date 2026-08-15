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
  await page.click('.carta[data-azione="grandi"]')
  await page.waitForSelector('.tastierino', { timeout: 5000 })
}
const digita = async pin => { for (const c of pin) await page.click(`.tasto >> text="${c}"`) }

/* ── 1. il gradino tiene ── */
await vaiAiGenitori()
controlla('la home non mostra più "azzera i dati"',
  !(await page.evaluate(() => document.body.innerText.includes('azzera i dati'))))

await digita('1234')
await page.waitForTimeout(150)
controlla('un PIN sbagliato non apre', await page.isVisible('.tastierino'))
controlla('lo dice invece di restare muto', await page.isVisible('.avviso'))

/* ── 2. il PIN giusto apre ── */
await digita('0000')
await page.waitForSelector('.carte', { timeout: 5000 })
const dentro = await page.evaluate(() => document.body.innerText)
controlla('con 0000 si entra', dentro.includes('Salva su file'))
controlla('ci sono tutte e tre le cose',
  dentro.includes('Salva su file') && dentro.includes('Rimetti da un file') && dentro.includes('Cancella'))
await scatto(page, 'genitori')

/* ── 3. il salvataggio contiene i progressi veri ── */
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
  uguale('dentro ci sono le monete vere', mio?.coins, 777)
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
uguale('le monete sono tornate quelle salvate', monete2, 777)

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
uguale('spegnere non tocca i progressi', moneteDopoSpegnimento, 777)

/* e la scelta deve sopravvivere alla chiusura del gioco */
await page.waitForTimeout(700)   // il salvataggio è a scatto ritardato
await page.reload()
await page.waitForSelector('.carte', { timeout: 8000 })
controlla('la scelta resta dopo un riavvio', !(await page.isVisible('.carta.td')))

await vaiAiGenitori()
await digita('0000')
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
  await page.click(suaCarta)
  await page.waitForTimeout(200)
  controlla('e dietro il cancello vale l\'interruttore di sempre',
            !(await inHome(suaCarta)))

  /* e il cancello si richiude: quello che si accende si deve poter
     rispegnere, e da chiuso non conta più cosa c'è dietro */
  await vaiAiGenitori()
  await digita('0000')
  await page.click(suaCarta)                        // riacceso il singolo
  await page.waitForTimeout(150)
  await page.click('.carta[data-flag="sperimentali"]')
  await page.waitForTimeout(200)
  controlla('richiuso il cancello, sparisce di nuovo', !(await inHome(suaCarta)))
}

/* ── 7c. cosa sa il bambino ──
   La seconda scheda. Spegnere un macrogruppo non si vede in home come
   una carta che sparisce: si vede nelle domande che il bambino riceve,
   che da qui non si possono guardare. Quello che si prova qui è la
   catena fino al profilo — l'interruttore resta giù, la scelta è
   scritta, e sopravvive a un riavvio — più la migrazione, che è la
   parte che può fare danno: chi le divisioni le aveva spente non se le
   deve ritrovare accese. Che poi le domande spente non arrivino
   davvero lo prova `unita/saperi`, giocandone quattrocento. */
await vaiAiGenitori()
await digita('0000')
await page.waitForSelector('.schede', { timeout: 5000 })
controlla('si entra dalla scheda dei giochi', await page.isVisible('.carta.gioco'))

await page.click('.schede button[data-scheda="sa"]')
await page.waitForSelector('.carta[data-sapere="misure"]', { timeout: 5000 })
uguale('c\'è una carta per macrogruppo',
       await page.locator('.carta.sapere').count(), SAPERI.length)
controlla('e i giochi non sono più a schermo: sono due elenchi diversi',
          !(await page.isVisible('.carta.gioco')))
controlla('la carta dice anche che domanda sparisce',
          (await page.locator('.carta[data-sapere="misure"]').innerText()).includes('per esempio'))
await scatto(page, 'genitori-sa')

await page.click('.carta[data-sapere="misure"]')
await page.waitForTimeout(200)
controlla('spegnere lo dice invece di restare muto',
  (await page.evaluate(() => document.body.innerText)).includes('spento per'))
controlla('l\'interruttore resta giù',
  await page.isVisible('.carta[data-sapere="misure"].spento'))

await page.waitForTimeout(700)   // il salvataggio è a scatto ritardato
const dopoSpento = await leggiProfilo(page)
uguale('la scelta finisce nel profilo', dopoSpento.settings.sa.misure, false)
uguale('e solo quella: acceso resta l\'assenza',
       Object.keys(dopoSpento.settings.sa).length, 1)

/* il degrado che si vede: il laboratorio delle pozioni è fatto tutto
   di conversioni, e senza quelle non è difficile, è da indovinare.
   Quindi sparisce dalla home, e nella scheda dei giochi la sua carta
   resta lì con scritto perché — invece di sparire senza motivo. */
controlla('il laboratorio delle pozioni sparisce dalla home',
          !(await inHome('.carta.poz')))
await vaiAiGenitori()
await digita('0000')
await page.waitForSelector('.carta.gioco[data-gioco="pozioni"]', { timeout: 5000 })
controlla('e la sua carta dice perché',
  (await page.locator('.carta.gioco[data-gioco="pozioni"]').innerText()).includes('Cosa sa'))
await page.click('.carta.gioco[data-gioco="pozioni"]')
await page.waitForTimeout(200)
controlla('e da lì non si riaccende: si accende dall\'altra scheda',
  (await page.evaluate(() => document.body.innerText)).includes('è fatto tutto di quello'))

await page.reload()
await page.waitForSelector('.carte', { timeout: 8000 })
await vaiAiGenitori()
await digita('0000')
await page.click('.schede button[data-scheda="sa"]')
await page.waitForSelector('.carta[data-sapere="misure"]', { timeout: 5000 })
controlla('la scelta resta dopo un riavvio',
  await page.isVisible('.carta[data-sapere="misure"].spento'))
await page.click('.carta[data-sapere="misure"]')          // rimesso com'era
await page.waitForTimeout(200)
controlla('e riacceso il macrogruppo il gioco torna in home', await inHome('.carta.poz'))
await vaiAiGenitori()
await digita('0000')
await page.click('.schede button[data-scheda="sa"]')
await page.waitForSelector('.carta[data-sapere="misure"]', { timeout: 5000 })

/* la migrazione: il profilo di ieri aveva `settings.divisioni: false` e
   non sapeva cosa fossero i macrogruppi. Le divisioni devono restare
   spente — riaccenderle vorrebbe dire rimettere nel castello proprio i
   calcoli che quel bambino non sa fare. */
const vecchio = await leggiProfilo(page)
await semina(page, { settings: { ...vecchio.settings, sa: {}, divisioni: false } })
await vaiAiGenitori()
await digita('0000')
await page.click('.schede button[data-scheda="sa"]')
await page.waitForSelector('.carta[data-sapere="divisioni"]', { timeout: 5000 })
controlla('il vecchio flag delle divisioni diventa il macrogruppo spento',
  await page.isVisible('.carta[data-sapere="divisioni"].spento'))
await page.waitForTimeout(700)
const migrato = await leggiProfilo(page)
uguale('e nel profilo è scritto nella forma nuova', migrato.settings.sa.divisioni, false)
uguale('il flag vecchio sparisce', migrato.settings.divisioni, undefined)

await page.click('.carta[data-sapere="divisioni"]')       // rimesso com'era
await page.waitForTimeout(200)

/* ── 7d. il dettaglio di un gruppo, e la domanda fatta vedere ──
   Due cose che senza browser non si possono provare, perché sono
   gesti: aprire il dettaglio di un gruppo e spegnerne una voce sola, e
   il tasto che apre una domanda VERA di quella voce.

   Il pannello di prova è la risposta a un problema pratico: le tre
   righe sulla carta dicono cosa sparisce, ma un genitore che non ha
   presente cos'è «l'accento tonico» spegne a naso. Quello che conta
   qui è che la domanda arrivi davvero (non un pannello vuoto), che sia
   della voce da cui si è partiti, e soprattutto che **guardare non
   spenga**: se provare una domanda la togliesse, sarebbe la trappola
   peggiore della schermata. */
await page.click('.schede button[data-scheda="sa"]')
await page.waitForSelector('.carta[data-sapere="accenti"]', { timeout: 5000 })

/* due gruppi non hanno domande di quiz, e sono le due operazioni che
   vivono nel castello: lì non sparisce una domanda, scende un'operazione */
controlla('ogni gruppo che fa domande ha il tasto per provarle',
  (await page.locator('.prova-tasto[data-prova]').count()) >= SAPERI.length - 2)
uguale('tranne le divisioni, che le domande le fa il castello',
  await page.locator('.prova-tasto[data-prova="divisioni"]').count(), 0)
uguale('e le moltiplicazioni, per lo stesso motivo',
  await page.locator('.prova-tasto[data-prova="moltiplicazioni"]').count(), 0)

/* il dettaglio: chiuso di suo, si apre e mostra le sue voci */
uguale('il dettaglio sta chiuso finché non lo si chiede',
       await page.locator('.dettaglio .voce').count(), 0)
await page.click('button[data-dettaglio="accenti"]')
await page.waitForSelector('.dettaglio .voce', { timeout: 5000 })
const voci = await page.locator('.dettaglio .voce').count()
controlla('«accenti e apostrofi» si apre in più voci', voci >= 4)
uguale('e ognuna si può provare', await page.locator('.dettaglio .prova-tasto').count(), voci)

/* si prova una voce sola */
const laVoce = await page.locator('.dettaglio .voce').first().getAttribute('data-sapere')
await page.locator('.dettaglio .prova-tasto').first().click()
await page.waitForSelector('.prova-velo .qz-consegna', { timeout: 5000 })
controlla('si apre una domanda vera, con le sue risposte',
  (await page.locator('.prova-velo .qz-tasto').count()) >= 2)
controlla('e dice da che modulo arriva e a che grado',
  /grado \d/.test(await page.locator('.prova-chi').innerText()))
await scatto(page, 'genitori-prova')

/* si risponde: l'esito arriva, e poi si può chiederne un'altra */
await page.click('.prova-velo .qz-tasto')
await page.waitForTimeout(1800)
controlla('rispondere dice com\'è andata',
  (await page.locator('.prova-velo .qz-esito').innerText()).trim().length > 0)
uguale('e il tasto diventa quello per la prossima',
  (await page.locator('.prova-altra').innerText()).trim(), "Un'altra")

await page.click('.prova-fine')
await page.waitForTimeout(250)
uguale('«basta» chiude il pannello', await page.locator('.prova-velo').count(), 0)
controlla('e si torna dove si era, col dettaglio ancora aperto',
  await page.isVisible('.dettaglio .voce'))
controlla('guardare una domanda non l\'ha spenta',
  !(await page.isVisible(`.voce[data-sapere="${laVoce}"].spento`)))

/* spegnere UNA voce: nel profilo va la chiave della tipologia, e il
   gruppo che se la porta dietro resta acceso */
await page.click(`.voce[data-sapere="${laVoce}"]`)
await page.waitForTimeout(800)
const conVoce = await leggiProfilo(page)
uguale('spenta una voce sola, nel profilo va la sua chiave', conVoce.settings.sa[laVoce], false)
uguale('e il gruppo resta acceso', conVoce.settings.sa.accenti, undefined)
controlla('la carta del gruppo lo dice, senza aprire il dettaglio',
  (await page.locator('button[data-dettaglio="accenti"]').innerText()).includes('spent'))
await page.click(`.voce[data-sapere="${laVoce}"]`)        // rimesso com'era
await page.waitForTimeout(200)

await page.click('button[aria-label="indietro"]')
await page.waitForSelector('.carte', { timeout: 5000 })

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
   schermata che non la offre non serve a niente. */
await page.click('button[aria-label="indietro"]')   // il punto 9 finisce dentro i genitori
await page.waitForSelector('.carte', { timeout: 5000 })
await vaiAiGenitori()
await digita('0000')
await page.waitForSelector('.carta[data-azione="aggiungi-giocatore"]', { timeout: 5000 })
uguale('di partenza c\'è un giocatore solo',
  await page.locator('.carta.chi-gioca').count(), 1)

await page.click('.carta[data-azione="aggiungi-giocatore"]')
await page.waitForSelector('.carta[data-azione="nuovo-nome"]', { timeout: 5000 })
await page.fill('.carta[data-azione="nuovo-nome"] .nome', 'Federica')

/* ── da dove parte ──
   Col solo nome non si aggiunge: la partenza decide cosa il bambino si
   troverà in home la prima volta, e una scelta preselezionata si preme
   senza leggerla. Il tasto spento è il modo di chiederlo senza
   scriverlo, e qui si prova che lo sia davvero. */
controlla('col solo nome il tasto non si può ancora premere',
  await page.locator('.carta[data-azione="nuovo-nome"] .bottone:not(.chiaro)').isDisabled())
uguale('le partenze offerte sono tre',
  await page.locator('.partenza').count(), 3)
await page.click('.partenza[data-partenza="terza"]')
await page.waitForTimeout(150)
controlla('scelta la partenza, il tasto si accende',
  !(await page.locator('.carta[data-azione="nuovo-nome"] .bottone:not(.chiaro)').isDisabled()))
await page.click('.carta[data-azione="nuovo-nome"] .bottone:not(.chiaro)')
await page.waitForTimeout(500)
uguale('aggiungerne uno lo mette nell\'elenco',
  await page.locator('.carta.chi-gioca').count(), 2)
/* Aggiungere non butta fuori chi sta giocando: la schermata resta
   aperta, e non richiede di nuovo il codice. */
controlla('e la schermata dei genitori resta aperta',
  await page.isVisible('.carta[data-azione="aggiungi-giocatore"]'))

/* Il profilo nuovo è suo e parte da zero: se ereditasse le monete
   dell'altro, i due bambini starebbero giocando lo stesso profilo. */
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('.carte', { timeout: 5000 })
uguale('adesso la home lascia scegliere', await page.locator('.gioc').count(), 2)
await page.click('.gioc:has-text("Federica")')
await page.waitForTimeout(500)
const moneteNuovo = await page.evaluate(() => {
  const t = document.body.innerText.match(/🪙\s*(\d+)/)
  return t ? Number(t[1]) : null
})
uguale('e chi entra la prima volta parte da zero, non con le monete dell\'altro',
  moneteNuovo, 0)

/* ── la partenza ha fatto qualcosa ──
   Si guarda dalla home di Federica e non dallo store: quello che conta è
   che il bambino non veda quelle carte, non che una chiave sia scritta
   da qualche parte. «Terza» toglie i giochi per i più piccoli e lascia
   tutto il resto — se togliesse anche il castello sarebbe una partenza
   che spegne troppo, e nessuno se ne accorgerebbe fino a che un bambino
   non chiede dov'è finito. */
controlla('a chi parte dalla terza i giochi per i piccoli non compaiono',
  !(await page.isVisible('.carta[data-gioco="conta"]')))
controlla('e nemmeno il secondo dei due',
  !(await page.isVisible('.carta[data-gioco="prima-dopo"]')))
controlla('ma il castello c\'è', await page.isVisible('.carta.td'))
controlla('e gli asteroidi pure', await page.isVisible('.carta.mate'))

// si torna sul primo: eliminare chi sta giocando è un altro caso, sotto
await page.click(`.gioc:has-text("${GIOCATORE}")`)
await page.waitForTimeout(500)

/* Rinominare tocca l'etichetta e non i progressi: è tutto il senso di
   avere un id separato dal nome. */
await vaiAiGenitori()
await digita('0000')
await page.waitForSelector('.carta.chi-gioca', { timeout: 5000 })
const suaCarta = `.carta.chi-gioca:has-text("Federica")`
await page.click(`${suaCarta} button[data-azione="rinomina"]`)
await page.waitForSelector('.carta.aperta .nome', { timeout: 5000 })
await page.fill('.carta.aperta .nome', 'Fede')
await page.click('.carta.aperta button[type="submit"]')
await page.waitForTimeout(500)
controlla('il nome cambia', await page.isVisible('.carta.chi-gioca:has-text("Fede")'))
uguale('e i giocatori restano due (non se n\'è creato un altro)',
  await page.locator('.carta.chi-gioca').count(), 2)

/* Eliminare chiede conferma: è l'unico gesto di questa schermata che
   butta via i progressi di qualcuno senza possibilità di tornare. */
await page.click('.carta.chi-gioca:has-text("Fede") button[data-azione="elimina"]')
await page.waitForSelector('.carta.pericolo.aperta', { timeout: 5000 })
controlla('eliminare chiede conferma', await page.isVisible('text="Sì, elimina"'))
await page.click('text="No, lascia stare"')
await page.waitForTimeout(200)
uguale('e si può tornare indietro', await page.locator('.carta.chi-gioca').count(), 2)

await page.click('.carta.chi-gioca:has-text("Fede") button[data-azione="elimina"]')
await page.click('text="Sì, elimina"')
await page.waitForTimeout(600)
uguale('confermando sparisce', await page.locator('.carta.chi-gioca').count(), 1)
controlla('e la schermata resta aperta: non stava giocando lui',
  await page.isVisible('.carta[data-azione="aggiungi-giocatore"]'))
controlla('e con lui il suo salvataggio', !(await page.evaluate(() =>
  new Promise(ok => {
    const r = indexedDB.open('giochi-bambini', 1)
    r.onsuccess = () => {
      const s = r.result.transaction('kv', 'readonly').objectStore('kv')
      const g = s.getAllKeys()
      g.onsuccess = () => ok(g.result.some(k => String(k).startsWith('profilo:g')))
    }
  }))))

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
controlla('l\'interruttore dei giudizi c\'è', await page.isVisible('.carta[data-flag="giudizi"]'))
controlla('e parte spento',
  await page.evaluate(() => document.querySelector('.carta[data-flag="giudizi"]').className.includes('spento')))
uguale('spento non c\'è niente da mandare',
  await page.locator('.carta[data-azione="giudizi"]').count(), 0)

await page.click('.carta[data-flag="giudizi"]')
await page.waitForTimeout(200)

await page.click('button[data-scheda="sa"]')
await page.waitForSelector('.prova-tasto', { timeout: 5000 })
await page.locator('.prova-tasto').first().click()
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

rmSync(salvataggio, { force: true })
rmSync(finto, { force: true })

uguale('nessun errore in console', errori.length, 0)
if (errori.length) errori.forEach(e => nota(e))

await browser.close()
riassunto('la schermata dei genitori')
