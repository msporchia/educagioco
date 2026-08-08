/* ═══════════════════════════════════════════════════════════════════
   LE STAZIONI DEL CALCOLO A MENTE, NEL BROWSER
     node test/esegui.mjs calcolo        (ricompila e apre Chrome)

   Quattro cose che i test unitari non possono dire, perché riguardano il
   gioco vero e non il catalogo:

     · negli asteroidi ci sono due campagne, e quella del calcolo a mente
       è aperta dalla prima partita — 3+4 non aspetta le tabelline
     · dentro una stazione le domande sono davvero i suoi concetti, e
       ogni ondata ha uno e un solo asteroide giusto
     · il bersaglio chiude la stazione, paga, e resta chiusa anche dopo
       aver riaperto il gioco
     · sbagliando due volte lo stesso concetto arriva il trucco
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, scatto, TELEFONO } from '../aiuto/browser.mjs'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'
import { CONCETTI, STAZIONI } from '../../src/data/calcolo.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { viewport: TELEFONO })
await azzera(page)

/* ---------- 1. le due campagne stanno nella stessa mappa ---------- */
await page.getByText('Asteroidi', { exact: true }).click()
await page.waitForSelector('.pianeti', { timeout: 5000 })
const pianeti = await page.evaluate(() => document.querySelectorAll('.pianeta').length)
uguale('la mappa si apre sui pianeti, che restano dieci', pianeti, 10)

// le due campagne stanno in due schede: dieci pianeti da scorrere prima di
// arrivare alle stazioni sarebbero un muro su un telefono
await page.getByRole('button', { name: /A mente/ }).click()
await page.waitForSelector('.stazioni', { timeout: 5000 })

const mappa = await page.evaluate(() => ({
  stazioni: [...document.querySelectorAll('.stazione')]
    .map(b => ({ testo: b.innerText, chiusa: b.disabled })),
  volo: !![...document.querySelectorAll('.bottone')].find(b => /Volo a mente/.test(b.textContent)),
  testo: document.body.innerText,
}))
uguale('c\'è un bottone per ogni stazione', mappa.stazioni.length, STAZIONI.length)
controlla('la prima stazione è aperta a chi comincia adesso', !mappa.stazioni[0].chiusa)
uguale('e le altre no', mappa.stazioni.filter(s => !s.chiusa).length, 1)
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
    viste.push({ testo: m.domanda.testo, ris: m.domanda.ris, chiave: m.domanda.chiave })
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
           modo: m.modo.value }
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

/* le domande sono quelle della stazione: somme e sottrazioni entro il dieci,
   più gli amici del dieci. Niente moltiplicazioni, niente numeri grandi. */
const fuori = partita.viste.filter(v => v.ris > 20 || /[×:]/.test(v.testo))
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
controlla('la home dice a che stazione si è arrivati',
          new RegExp(`stazione 2 di ${STAZIONI.length}`).test(home),
          home.split('\n').find(r => /stazione/i.test(r)) || 'nessuna riga sulle stazioni')

await page.getByText('Asteroidi', { exact: true }).click()
await page.waitForSelector('.pianeti', { timeout: 5000 })
await page.getByRole('button', { name: /A mente/ }).click()
await page.waitForSelector('.stazioni', { timeout: 5000 })
const dopo = await page.evaluate(() =>
  [...document.querySelectorAll('.stazione')].filter(b => !b.disabled).length)
uguale('dopo la ricarica sono aperte due stazioni', dopo, 2)

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
