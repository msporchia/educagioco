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
import { SCALETTA } from '../../src/data/asteroidi.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { viewport: TELEFONO })
await azzera(page)

/* ---------- 1. si entra e c'è la mappa ---------- */
await page.getByText('Asteroidi', { exact: true }).click()
await page.waitForSelector('.scaletta', { timeout: 5000 })

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
  const viste = [], ritardi = []
  let gettoni = 0, tolti = 0
  const tipi = new Set()
  // si risponde sempre giusto: interessa dove porta il bersaglio, non la bravura
  for (let i = 0; i < 200 && m.fase.value === 'gioco'; i++) {
    const giusto = m.asteroidi().find(x => x.ok && !x.morto)
    if (!giusto) break
    /* IL MIRINO, UNA VOLTA, A METÀ COVATA. Si mette in tasca a mano
       invece di aspettare i quindici di fila che lo pagano: il bersaglio
       di questa tappa è più corto, quindi giocando non arriverebbe mai —
       e quello che c'è da provare non è la soglia (la conta
       `unita/asteroidi`) ma il fatto che un sasso sparito così **non
       lasci niente in archivio**, che è invisibile giocando. */
    if (i === 3) {
      m.tasca.mirino = 1
      const prima = m.asteroidi().filter(x => !x.morto).length
      m.usaMirino()
      tolti = prima - m.asteroidi().filter(x => !x.morto).length
    }
    viste.push([m.domanda.a, m.domanda.b, !!giusto.boss])
    /* fra quanto il sasso con la risposta giusta sarà in scena: nasce
       sopra il bordo (y negativa) e ci mette (r + quanto sta sopra) / vy.
       Si legge adesso perché la covata è appena nata. */
    ritardi.push((giusto.r - giusto.y) / giusto.vy)
    m.colpisci(giusto)
    // i gettoni arrivano col filotto e dal boss, e restano in tasca: qui
    // non si spendono più, quindi il massimo osservato dice se sono
    // arrivati, e `tipi` **quali** — che è la cosa che si era rotta
    gettoni = Math.max(gettoni, m.tasca.gelo + m.tasca.mirino)
    if (m.tasca.gelo) tipi.add('gelo')
    if (m.tasca.mirino) tipi.add('mirino')
    await new Promise(r => setTimeout(r, 15))
  }
  return { viste, bersaglio, ritardi, fase: m.fase.value, giuste: m.hud.giuste, gettoni, tolti,
           tipi: [...tipi], mirate: m.hud.mirate, tappa: m.progresso.value.tappa }
})

/* LA RISPOSTA NON SI FA ASPETTARE. Gli asteroidi nascono sfalsati — se no
   sono una fila e non una covata — ma quello con la risposta giusta non
   può nascere in fondo alla covata: la domanda sarebbe a schermo da
   cinque secondi mentre l'unica cosa da toccare deve ancora affacciarsi,
   e il bambino che aspetta risulterebbe lento anche nell'SRS. */
dentro('la risposta giusta è in scena entro tre secondi dalla domanda',
       Math.round(Math.max(...partita.ritardi) * 10) / 10, 0, 3.2)
nota(`il sasso giusto entra dopo ${Math.min(...partita.ritardi).toFixed(1)}–` +
     `${Math.max(...partita.ritardi).toFixed(1)} s`)

uguale('il bersaglio chiude la tappa', partita.fase, 'vinta')
uguale('e la tappa risulta superata', partita.tappa, 1)
controlla('senza chiedere più centri del bersaglio',
          partita.giuste >= partita.bersaglio && partita.giuste <= partita.bersaglio + 4,
          `${partita.giuste} centri per un bersaglio di ${partita.bersaglio}`)

/* La tabellina del pianeta è la maggioranza larga di quello che esce: la
   miscela è dichiarata (`QUOTA_TAPPA`, otto su dieci) e il resto è
   ripasso. Qui si guarda una partita sola, quindi la forbice è larga — la
   quota esatta, e il fatto che non ci siano mai sei domande di fila fuori
   tabellina, li misura `unita/asteroidi` giocando le tappe per davvero. */
const suoi = partita.viste.filter(([a, b]) => a === 2 || b === 2).length
const quota = suoi / partita.viste.length
dentro('la tabellina nuova è la maggior parte delle domande', Math.round(quota * 100), 65, 100)
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

/* ---------- 2b. i gettoni non rispondono al posto del bambino ----------
   Il mirino porta via un sasso sbagliato: è l'unico punto del gioco dove
   qualcosa succede a un asteroide che nessuno ha toccato, ed è
   invisibile giocando. Se quell'esplosione finisse nel motore come una
   risposta, il bambino risulterebbe più bravo o più scarso di quello che
   è, e le domande di domani sarebbero sbagliate. */
controlla('i gettoni arrivano già durante la tappa, non alla fine',
          partita.gettoni > 0, `in tasca al massimo ${partita.gettoni}`)
/* E ARRIVANO TUTTI E DUE. Questo controllo nasce da un difetto che si
   vedeva solo giocando: i poteri erano due e in partita usciva sempre e
   solo il gelo, perché l'alternanza era calcolata sul filotto (cinque il
   gelo, quindici il mirino) e una tappa si chiude prima dei quindici.
   Contare cosa esce in una tappa vera è l'unico modo di accorgersene —
   la funzione pura, da sola, alternava benissimo. */
uguale('e in una tappa si vedono tutti e due i poteri, non sempre lo stesso',
       partita.tipi.sort().join(' '), 'gelo mirino')
uguale('e il mirino toglie un sasso sbagliato, uno solo', partita.tolti, 1)
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
/* La home conta le tappe della FILA, che è una sola: quante ne sono
   state fatte e da dove si riprende. Qui è stato superato un pianeta e
   nessuna stazione, quindi «1 tappa» — e «ora» indica la prima della
   fila, che è a mente: è giusto che lo dica, quella è la più facile di
   tutte ed è ancora lì. */
controlla('la home conta le tappe della fila unica',
          new RegExp(`1 tappa su ${SCALETTA.length}`).test(home),
          home.split('\n').find(r => /tapp/i.test(r)) || 'nessuna riga sugli asteroidi')

await page.getByText('Asteroidi', { exact: true }).click()
await page.waitForSelector('.scaletta', { timeout: 5000 })
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
await page.waitForSelector('.scaletta', { timeout: 5000 })
// `.scaletta` è un blocco per capitolo: la mappa è tornata se c'è il primo
controlla('e il tasto riporta alla mappa', await page.locator('.scaletta').first().isVisible())

/* ---------- 5. niente errori per strada ---------- */
uguale('nessun errore in console', errori.length, 0)
if (errori.length) errori.forEach(e => nota(e))

await browser.close()
riassunto('Campagna delle tabelline')
