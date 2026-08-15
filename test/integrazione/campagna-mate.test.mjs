/* ═══════════════════════════════════════════════════════════════════
   LA CAMPAGNA DELLE TABELLINE, NEL BROWSER
     node test/integrazione/campagna-mate.mjs   (dopo `npm run build`)

   Tre cose che nessun test unitario può dire:
     · aprendo il gioco si vede la mappa dei pianeti, non più la domanda
       "quali tabelline vuoi allenare?"
     · dentro una tappa le domande sono per lo più della tabellina nuova
     · superato il bersaglio la tappa si chiude, paga, e resta superata
       anche dopo aver richiuso il gioco
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, scatto, leggiProfilo, TELEFONO } from '../aiuto/browser.mjs'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { viewport: TELEFONO })
await azzera(page)

/* ---------- 1. si entra e c'è la mappa ---------- */
await page.getByText('Asteroidi', { exact: true }).click()
await page.waitForSelector('.pianeti', { timeout: 5000 })

const testo = await page.evaluate(() => document.body.innerText)
controlla('la mappa dei pianeti sostituisce la scelta delle tabelline',
          !/Quali tabelline vuoi allenare/i.test(testo))
controlla('si vede il primo pianeta', /Il pianeta del 2/.test(testo))
controlla('e il volo libero è ancora chiuso', !/Volo libero ♾️/.test(testo))

const pianeti = await page.evaluate(() =>
  [...document.querySelectorAll('.pianeta')].map(b => ({ testo: b.innerText, chiuso: b.disabled })))
uguale('dieci pianeti in fila', pianeti.length, 10)
uguale('solo il primo è aperto', pianeti.filter(p => !p.chiuso).length, 1)

await scatto(page, 'campagna-mate-mappa')

/* ---------- 2. si gioca il primo pianeta ---------- */
await page.locator('.pianeta').first().click()
await page.waitForTimeout(300)

/* Il cannone della nave non deve **mai** inseguire un asteroide prima che
   il dito abbia scelto: quando i sassi sbagliati sono già morti finirebbe
   per indicare proprio quello giusto. Spazza il cielo avanti e indietro
   con un moto che dipende dal solo tempo, e qui si controllano le due
   facce della stessa cosa: che spazzi davvero da una parte all'altra, e
   che l'angolo verso il sasso giusto gli scorra sotto senza agganciarsi. */
const GRADI = 180 / Math.PI
const puntamento = await page.evaluate(async () => {
  const m = window.__mate
  const letture = []
  for (let i = 0; i < 24; i++) {
    await new Promise(r => setTimeout(r, 120))
    const giusto = m.asteroidi().find(a => a.ok && !a.morto)
    letture.push({
      mira: m.nave.mira,
      vivi: m.asteroidi().filter(a => !a.morto).length,
      // dove sarebbe puntato il cannone se stesse seguendo la risposta
      verso: giusto ? Math.atan2(giusto.y - m.nave.y, giusto.x - m.nave.x) : null,
    })
  }
  return letture
})
const scarti = puntamento.map(l => (l.mira + Math.PI / 2) * GRADI)
const inScena = Math.max(...puntamento.map(l => l.vivi))
controlla('ci sono asteroidi in scena mentre si guarda il cannone', inScena >= 2)
controlla('il cannone spazza il cielo da una parte all\'altra',
          Math.min(...scarti) < -25 && Math.max(...scarti) > 25,
          `è andato da ${Math.round(Math.min(...scarti))}° a ${Math.round(Math.max(...scarti))}°`)

/* se inseguisse la risposta, questa distanza resterebbe intorno a zero
   per tutte le letture: è il controllo che vale davvero */
const addosso = puntamento.filter(l => l.verso !== null)
  .map(l => Math.abs(l.mira - l.verso) * GRADI)
dentro('e non resta addosso all\'asteroide giusto',
       Math.round(Math.max(...addosso) - Math.min(...addosso)), 25, 180)

const partita = await page.evaluate(async () => {
  const m = window.__mate
  const bersaglio = m.tappa.value.bersaglio
  const viste = []
  let doppio = false
  // si risponde sempre giusto: interessa dove porta il bersaglio, non la bravura
  for (let i = 0; i < 200 && m.fase.value === 'gioco'; i++) {
    const giusto = m.asteroidi().find(x => x.ok && !x.morto)
    if (!giusto) break
    viste.push([m.domanda.a, m.domanda.b, !!giusto.boss])
    m.colpisci(giusto)
    doppio = doppio || m.nave.doppio
    await new Promise(r => setTimeout(r, 15))
  }
  return { viste, bersaglio, fase: m.fase.value, giuste: m.hud.giuste, doppio,
           mirate: m.hud.mirate, tappa: m.progresso.value.tappa }
})

uguale('il bersaglio chiude la tappa', partita.fase, 'vinta')
uguale('e la tappa risulta superata', partita.tappa, 1)
controlla('senza chiedere più centri del bersaglio',
          partita.giuste >= partita.bersaglio && partita.giuste <= partita.bersaglio + 4,
          `${partita.giuste} centri per un bersaglio di ${partita.bersaglio}`)

/* La tabellina del pianeta è la maggioranza larga di quello che esce: la
   miscela è dichiarata (`QUOTA_TAPPA`, sette su dieci) e le altre tre sono
   ripasso. Qui si guarda una partita sola, quindi la forbice è larga —
   la quota esatta la misura `unita/calcolo`, che ne tira quattromila. */
const suoi = partita.viste.filter(([a, b]) => a === 2 || b === 2).length
const quota = suoi / partita.viste.length
dentro('la tabellina nuova è la maggior parte delle domande', Math.round(quota * 100), 55, 95)
nota(`${suoi} domande su ${partita.viste.length} erano della tabellina del 2`)

/* ═══════════ IL BOSS VIENE DAL PIANETA DOPO ═══════════
   È la sola domanda che può stare fuori dalle tabelline aperte, ed è il
   motivo per cui è un boss e non un asteroide più grosso: al pianeta del 2
   porta un calcolo del 10, che è la tappa dopo. Un assaggio, non un muro. */
const boss = partita.viste.filter(([, , b]) => b)
const fuori = partita.viste.filter(([a, b]) => ![1, 2].includes(a) && ![1, 2].includes(b))
controlla('il boss arriva almeno una volta nella tappa', boss.length >= 1)
controlla('e porta la tabellina del pianeta dopo',
          boss.every(([a, b]) => a === 10 || b === 10),
          boss.map(([a, b]) => `${a}×${b}`).join(', '))
controlla('fuori dalle tabelline aperte non esce nient\'altro che il boss',
          fuori.every(([, , b]) => b),
          fuori.filter(([, , b]) => !b).map(([a, b]) => `${a}×${b}`).join(', '))

await scatto(page, 'campagna-mate-vinta')

/* ---------- 2b. il cannone doppio non risponde al posto del bambino ----------
   Il potenziamento porta via anche i sassi sbagliati vicini: è l'unico
   punto del gioco dove qualcosa succede a un asteroide che nessuno ha
   toccato, ed è invisibile giocando. Se quelle esplosioni finissero nel
   motore come risposte, il bambino risulterebbe più bravo o più scarso
   di quello che è, e le domande di domani sarebbero sbagliate. */
controlla('il cannone doppio si accende durante la tappa', partita.doppio)
const profilo = await leggiProfilo(page)
const risposte = Object.entries(profilo.items || {})
  .filter(([k]) => k.startsWith('math:'))
  .reduce((n, [, it]) => n + (it.ok || 0) + (it.err || 0), 0)
/* Una risposta per colpo, meno gli assaggi del pianeta dopo: quelli si
   giocano — vite e punti veri — ma non si segnano, perché misurare una
   cosa che nessuno ha ancora insegnato non dice niente di vero, e un
   errore lì marchierebbe come debole un calcolo mai visto. */
uguale('e in archivio c\'è una risposta per colpo, non una per esplosione',
       risposte, partita.viste.length - boss.length)
const chiuse = Object.keys(profilo.items || {})
  .filter(k => k.startsWith('math:'))
  .filter(k => k.slice(5).split('x').map(Number).every(n => ![1, 2].includes(n)))
controlla('e il boss non lascia niente in archivio', chiuse.length === 0, chiuse.join(', '))

/* ---------- 3. il progresso resta dopo aver chiuso ---------- */
await page.reload()
await page.waitForSelector('.carte', { timeout: 10000 })
const home = await page.evaluate(() => document.body.innerText)
controlla('la home dice a che pianeta si è arrivati', /pianeta 2 di 10/.test(home),
          home.split('\n').find(r => /pianeta/i.test(r)) || 'nessuna riga sui pianeti')

await page.getByText('Asteroidi', { exact: true }).click()
await page.waitForSelector('.pianeti', { timeout: 5000 })
const dopo = await page.evaluate(() =>
  [...document.querySelectorAll('.pianeta')].filter(b => !b.disabled).length)
uguale('dopo la ricarica sono aperti due pianeti', dopo, 2)

/* ---------- 4. "Cosa so" è una schermata come le altre ---------- */
await page.getByRole('button', { name: /Cosa so/ }).click()
await page.waitForSelector('.cella', { timeout: 5000 })

const tavola = await page.evaluate(() => ({
  celle: document.querySelectorAll('.cella').length,
  barra: !!document.querySelector('.barra-app button[aria-label="indietro"]'),
  titolo: document.querySelector('.barra-app .dove')?.textContent.trim(),
  // il fondo dello spazio non deve arrivare fin qui: è una pagina di progressi
  velo: !!document.querySelector('.velo'),
}))
uguale('la tavola pitagorica è intera', tavola.celle, 100)
controlla('si esce dal tasto della barra, come ovunque', tavola.barra)
uguale('e la barra dice dove si è', tavola.titolo, 'Cosa so')
controlla('non è un velo sopra la partita', !tavola.velo)

await scatto(page, 'campagna-mate-cosa-so')

await page.locator('.barra-app button[aria-label="indietro"]').click()
await page.waitForSelector('.pianeti', { timeout: 5000 })
controlla('e il tasto riporta alla mappa', await page.locator('.pianeti').isVisible())

/* ---------- 5. niente errori per strada ---------- */
uguale('nessun errore in console', errori.length, 0)
if (errori.length) errori.forEach(e => nota(e))

await browser.close()
riassunto('Campagna delle tabelline')
