/* ═══════════════════════════════════════════════════════════════════
   LE STAZIONI DEL CALCOLO A MENTE, NEL BROWSER
     node test/esegui.mjs calcolo        (ricompila e apre Chrome)

   Quattro cose che i test unitari non possono dire, perché riguardano il
   gioco vero e non il catalogo:

     · negli asteroidi c'è una scaletta sola, e comincia proprio dai
       conti a mente — 3+4 non aspetta le tabelline
     · dentro una stazione le domande sono davvero i suoi concetti, e
       ogni ondata ha uno e un solo asteroide giusto
     · il bersaglio chiude la stazione, paga, e resta chiusa anche dopo
       aver riaperto il gioco
     · sbagliando due volte lo stesso concetto arriva il trucco
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, scatto, TELEFONO } from '../aiuto/browser.mjs'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'
import { CONCETTI, STAZIONI, concettoDiChiave } from '../../src/data/calcolo.js'
import { eNuovo } from '../../src/store/calcolo.js'
import { SCALETTA } from '../../src/data/asteroidi.js'
import { CAMPAGNA as PIANETI } from '../../src/data/tabelline.js'
import { statoDellaTappa, PASSATA } from '../../src/data/portata.js'
import { ETA_DIFETTO } from '../../src/store/profile.js'

/* Quante voci della fila nascono aperte. Erano due — una per mestiere,
   con i due contatori a zero — e adesso a quelle si aggiungono tutte
   quelle che a questa età sono **roba già passata**: `portata` sulla
   tappa, il conto in `data/portata.js`. Si calcola invece di cablarlo,
   così se i livelli si spostano il test si sposta con loro. */
const giaSapute = fila => fila.filter(t => statoDellaTappa(t, { eta: ETA_DIFETTO }) === PASSATA).length
const APERTE_ALL_INIZIO = 2 + giaSapute(STAZIONI.slice(1)) + giaSapute(PIANETI.slice(1))

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { viewport: TELEFONO })
await azzera(page)

/* ---------- 1. una mappa sola, coi due mestieri mescolati ---------- */
await page.getByText('Asteroidi', { exact: true }).click()
await page.waitForSelector('.scaletta', { timeout: 5000 })

const mappa = await page.evaluate(() => ({
  // l'ordine è quello del DOM, cioè quello della fila
  fila: [...document.querySelectorAll('.pianeta, .stazione')]
    .map(b => ({ mente: b.classList.contains('stazione'), chiusa: b.disabled })),
  stazioni: [...document.querySelectorAll('.stazione')]
    .map(b => ({ testo: b.innerText, chiusa: b.disabled })),
  schede: !!document.querySelector('.campagna .schede'),
  volo: !![...document.querySelectorAll('.bottone')].find(b => /Volo a mente/.test(b.textContent)),
  testo: document.body.innerText,
}))
uguale('c\'è un bottone per ogni stazione', mappa.stazioni.length, STAZIONI.length)
uguale('e uno per ogni pianeta', mappa.fila.filter(v => !v.mente).length, 10)
controlla('le due linguette non ci sono più: è una fila sola', !mappa.schede)
/* la fila comincia dai conti a mente: 3+4 viene prima di qualunque
   tabellina, ed è la prima giunzione dell'ordine (vedi `data/asteroidi.js`) */
controlla('la scaletta comincia da una tappa a mente', mappa.fila[0].mente)
controlla('la prima tappa è aperta a chi comincia adesso', !mappa.fila[0].chiusa)
/* due sole tappe aperte in tutta la fila, una per mestiere: è quello che
   si vede quando i contatori restano due — e che permette a chi era
   avanti coi pianeti di non perdere niente */
uguale('le aperte sono una per mestiere, più quelle già sapute per età',
       mappa.fila.filter(v => !v.chiusa).length, APERTE_ALL_INIZIO)
controlla('si vede di che calcoli si tratta', /3\+4/.test(mappa.testo), mappa.stazioni[0].testo)
controlla('il volo a mente è ancora chiuso', !mappa.volo)

await scatto(page, 'calcolo-mappa')

/* ---------- 2. si gioca la prima stazione ---------- */
await page.locator('.stazione').first().click()
await page.waitForTimeout(300)

const partita = await page.evaluate(async () => {
  const m = window.__mate
  const viste = [], ondate = []
  for (let i = 0; i < 300 && m.fase.value === 'gioco'; i++) {
    viste.push({ testo: m.domanda.testo, ris: m.domanda.ris, chiave: m.domanda.chiave,
                 anticipo: m.anticipo() })
    const vivi = m.asteroidi().filter(x => !x.morto)
    ondate.push({ quanti: vivi.length, giusti: vivi.filter(x => x.ok).length,
                  valori: vivi.map(x => x.v) })
    const giusto = vivi.find(x => x.ok)
    if (!giusto) break
    m.colpisci(giusto)
    await new Promise(r => setTimeout(r, 12))
  }
  return { viste, ondate, fase: m.fase.value, giuste: m.hud.giuste, mirate: m.hud.mirate,
           bersaglio: m.tappa.value.bersaglio, tappa: m.progressoMente.value.tappa,
           modo: m.modo.value, dopo: m.prossima.value?.nuovi || [],
           suoi: m.tappa.value.concetti }
})

uguale('si sta giocando la campagna del calcolo a mente', partita.modo, 'mente')
uguale('il bersaglio chiude la stazione', partita.fase, 'vinta')
uguale('e la stazione risulta superata', partita.tappa, 1)
dentro('senza chiedere molto più del bersaglio', partita.giuste,
       partita.bersaglio, partita.bersaglio + 4)

/* ogni ondata: un asteroide giusto e uno solo, e nessun doppione fra i falsi */
const sbagliate = partita.ondate.filter(o => o.giusti !== 1)
uguale('ogni ondata ha un asteroide giusto e uno solo', sbagliate.length, 0)
const doppioni = partita.ondate.filter(o => new Set(o.valori).size !== o.valori.length)
uguale('e nessun bersaglio ripetuto', doppioni.length, 0)
const magre = partita.ondate.filter(o => o.quanti < 3)
uguale('gli asteroidi non scendono mai sotto tre', magre.length, 0)

/* ═══════════ L'ASSAGGIO DELLA STAZIONE DOPO ═══════════
   Il boss è la sola domanda che può stare fuori da quello che la stazione
   ha presentato, ed è quello che lo rende un boss. Arriva ogni otto
   domande, quindi in una partita corta può non farsi vedere: quello che
   qui si pretende è che, quando arriva, venga davvero dalla stazione dopo
   e non sia roba che si stava già chiedendo. */
const assaggi = partita.viste.filter(v => v.anticipo)
/* «viene dalla stazione dopo» si chiede a `eNuovo`, non a
   `concettoDiChiave`: i concetti a fatti si accavallano, e 4+5 è un
   quasi-doppio **anche se** la prima cosa che se lo prende è la somma
   entro il dieci. Il boss è onesto lo stesso, e il test deve saperlo. */
controlla('l\'assaggio, quando arriva, viene dalla stazione dopo',
          assaggi.every(v => eNuovo({ nuovi: partita.dopo }, v.chiave)),
          assaggi.map(v => `${v.testo} (${concettoDiChiave(v.chiave)})`).join(', '))
nota(assaggi.length ? `il boss ha portato: ${assaggi.map(v => v.testo).join(' · ')}`
                    : 'la stazione dopo non è ancora aperta: nessun assaggio')

/* le domande sono quelle della stazione: somme e sottrazioni entro il dieci,
   più gli amici del dieci. Niente moltiplicazioni, niente numeri grandi. */
const fuori = partita.viste.filter(v => !v.anticipo && (v.ris > 20 || /[×:]/.test(v.testo)))
uguale('non esce niente che la stazione non abbia presentato', fuori.length, 0,)
controlla('non esce niente che la stazione non abbia presentato', !fuori.length,
          fuori.length ? fuori[0].testo : '')
const suoi = partita.viste.filter(v => v.chiave.startsWith('calc:')).length
uguale('e tutte le domande sono del calcolo a mente', suoi, partita.viste.length)

/* varietà: i fatti entrano in lavorazione in ordine di fatica, non in
   quello in cui sono scritti. Senza, una partita intera esce "1+2, 1+3,
   1+4…" — cioè si passa la serata a sommare uno. */
const distinte = [...new Map(partita.viste.map(v => [v.chiave, v.testo])).values()]
const conteggio = {}
for (const testo of distinte)
  for (const n of new Set(testo.match(/\d+/g) || [])) conteggio[n] = (conteggio[n] || 0) + 1
const piuVisto = Object.entries(conteggio).sort((a, b) => b[1] - a[1])[0]
controlla('nessun numero entra in quasi tutti i calcoli',
          piuVisto[1] <= distinte.length * 0.65,
          `il ${piuVisto[0]} è in ${piuVisto[1]} calcoli diversi su ${distinte.length}`)
dentro('e i calcoli diversi sono parecchi', distinte.length,
       Math.round(partita.viste.length * 0.5), partita.viste.length)
dentro('le risposte mirate contano quasi tutte', partita.mirate,
       Math.round(partita.giuste * 0.8), partita.giuste)
nota(`${partita.viste.length} domande, per esempio: ` +
     partita.viste.slice(0, 4).map(v => v.testo).join(' · '))

await scatto(page, 'calcolo-vinta')

/* ---------- 3. il trucco arriva alla seconda volta storta ---------- */
await page.evaluate(() => window.__mate.iniziaStazione(0))
await page.waitForTimeout(200)
const trucco = await page.evaluate(async () => {
  const m = window.__mate
  const visti = []
  // si sbaglia apposta finché lo stesso concetto non torna due volte
  for (let i = 0; i < 30; i++) {
    const id = m.domanda.chiave
    const falso = m.asteroidi().find(x => !x.ok && !x.morto)
    if (!falso) break
    visti.push(id)
    m.colpisci(falso)
    await new Promise(r => setTimeout(r, 12))
    if (document.querySelector('.trucco')) return { arrivato: true, dopo: i + 1 }
    if (m.hud.vite <= 0) break
  }
  return { arrivato: false, dopo: visti.length }
})
controlla('dopo due errori sullo stesso trucco, il trucco si dice', trucco.arrivato,
          `nessun cartello dopo ${trucco.dopo} errori`)

/* ---------- 4. il progresso resta dopo aver chiuso ---------- */
await page.reload()
await page.waitForSelector('.carte', { timeout: 10000 })
const home = await page.evaluate(() => document.body.innerText)
controlla('la home conta le tappe della fila unica',
          new RegExp(`1 tappa su ${SCALETTA.length}`).test(home),
          home.split('\n').find(r => /tapp/i.test(r)) || 'nessuna riga sugli asteroidi')

await page.getByText('Asteroidi', { exact: true }).click()
await page.waitForSelector('.scaletta', { timeout: 5000 })
const dopo = await page.evaluate(() =>
  [...document.querySelectorAll('.stazione')].filter(b => !b.disabled).length)
/* Le stazioni sole, non la fila intera: una per il contatore a zero più
   quelle che a nove anni sono già passate. */
uguale('dopo la ricarica sono aperte le stazioni giuste',
       dopo, 2 + giaSapute(STAZIONI.slice(2)))

/* ---------- 5. «Cosa so» ha la faccia dei trucchi ---------- */
await page.getByRole('button', { name: /Cosa so/ }).click()
await page.waitForSelector('.schede', { timeout: 5000 })
await page.getByRole('button', { name: /A mente/ }).click()
await page.waitForSelector('.voce', { timeout: 5000 })

const tavola = await page.evaluate(() => {
  const voci = [...document.querySelectorAll('.voce')]
  return {
    quante: voci.length,
    chiuse: voci.filter(v => v.classList.contains('chiuso')).length,
    avviati: voci.filter(v => v.classList.contains('lavoro')).length,
    titolo: document.querySelector('.barra-app .dove')?.textContent.trim(),
  }
})
uguale('c\'è una riga per ogni trucco', tavola.quante, CONCETTI.length)
controlla('quelli che non si sono ancora aperti si vedono chiusi', tavola.chiuse > 10,
          `solo ${tavola.chiuse} chiusi`)
/* dopo una partita sola non c'è ancora niente «in mano», ed è giusto: un
   trucco si tiene quando regge anche fra una settimana. Quello che deve
   già vedersi è che il lavoro è cominciato. */
controlla('e su quelli della prima stazione il lavoro è cominciato',
          tavola.avviati >= 1, `nessuna barra avviata`)
uguale('la barra dice sempre dove si è', tavola.titolo, 'Cosa so')

// il trucco si legge toccando la riga: è lì che la strategia si spiega
await page.locator('.voce').first().click()
await page.waitForSelector('.spiega', { timeout: 5000 })
const spiega = await page.evaluate(() => document.querySelector('.spiega').innerText)
controlla('e toccando un trucco lo si legge', spiega.length > 20, spiega)

await scatto(page, 'calcolo-cosa-so')

/* ---------- 6. niente errori per strada ---------- */
uguale('nessun errore in console', errori.length, 0)
if (errori.length) errori.forEach(e => nota(e))

await browser.close()
riassunto('Stazioni del calcolo a mente')
