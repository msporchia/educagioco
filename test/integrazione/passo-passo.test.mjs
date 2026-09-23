/* ═══════════════════════════════════════════════════════════════════
   PASSO PASSO, NEL BROWSER

   Le cose che il motore non può dire, e che si vedono solo qui:

   · **si entra dalla home** (è un gioco in prova: senza il flag non c'è);
   · **la mappa sta nello schermo**: intera in larghezza e in circa metà
     dell'altezza di un telefono da 390×844, anche la più grande;
   · **si gioca col dito**: la fila si compone toccando i tasti, ▶ la fa
     partire, e il cartello di fine arriva con le stelle giuste;
   · **uno sbaglio accende la tessera giusta** (`data-guasto`), e ⌫ la
     toglie;
   · il 💡 accende una freccia, e da lì non costa più;
   · ■ ferma tutto a metà, e la fila resta dov'è;
   · i salti ci sono solo dove servono;
   · e nessun errore in console.
   `DIST=… node test/esegui.mjs passo-passo --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, scatto, semina, attendi, leggiProfilo, TELEFONO }
  from '../aiuto/browser.mjs'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/giochi/passo-passo/dati/campagna.js'
import { Livello } from '../../src/giochi/passo-passo/motore/livello.js'
import { risolvi } from '../../src/giochi/passo-passo/motore/risolutore.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

/* il tasto di una mossa: le frecce hanno `data-freccia`, i salti `data-salto` */
const tasto = m => m.startsWith('salto-') ? `[data-salto="${m.slice(6)}"]` : `[data-freccia="${m}"]`
async function componi(mosse) {
  for (const m of mosse) {
    await page.locator(tasto(m)).click()
    await attendi(page, 60)
  }
}
async function entraNellaTappa(i) {
  await page.locator(`.pp-tappa[data-tappa="${i}"]`).click()
  await page.waitForSelector('.pp-campo', { timeout: 5000 })
  await attendi(page, 450)            // la finestra cieca dei 320 ms, e il primo fotogramma
}
async function allaMappa() {
  await page.locator('button[aria-label="indietro"]').click()
  await page.waitForSelector('.pp-mappa', { timeout: 5000 })
}

/* ---------- 1. senza il flag dei giochi in prova, in home non c'è ---------- */
await semina(page, { settings: { eta: 6 } })
uguale('senza «giochi in prova» la carta non c\'è',
       await page.locator('.carta.gioco[data-gioco="passo"]').count(), 0)

/* ---------- 2. col flag si entra dalla home ---------- */
await semina(page, { settings: { sperimentali: true, eta: 6 } })
const carta = page.locator('.carta.gioco[data-gioco="passo"]')
uguale('con «giochi in prova» la carta è in home', await carta.count(), 1)
await carta.click()
await page.waitForSelector('.pp-mappa', { timeout: 5000 })
uguale('la mappa elenca tutte le tappe', await page.locator('.pp-tappa').count(), CAMPAGNA.length)
controlla('la prima tappa è aperta', await page.locator('.pp-tappa[data-tappa="0"]').isEnabled())
controlla('la seconda no, finché non si fa la prima',
          !(await page.locator('.pp-tappa[data-tappa="1"]').isEnabled()))
controlla('il sentiero senza fine è chiuso a campagna da fare',
          !(await page.locator('[data-tappa="senza-fine"]').isEnabled()))
await scatto(page, 'passo-mappa')

/* ---------- 3. la prima tappa, giocata col dito ---------- */
await entraNellaTappa(0)
controlla('nella prima tappa non ci sono i salti', await page.locator('[data-salto]').count() === 0)
/* la manina della prima volta: indica la freccia, poi ▶, poi se ne va */
controlla('la prima volta una manina indica la freccia',
          await page.locator('[data-freccia="destra"] [data-manina]').count() === 1)
{
  const tela = await page.locator('.pp-tela').boundingBox()
  controlla('la mappa è disegnata', tela && tela.width > 100 && tela.height > 80, JSON.stringify(tela))
  dentro('e sta intera in larghezza', Math.round(tela.x + tela.width), 1, TELEFONO.width)
}
const soluzione = risolvi(Livello.da(CAMPAGNA[0]))
await componi(soluzione)
uguale('la fila ha una tessera per freccia', await page.locator('[data-tessera]').count(), soluzione.length)
controlla('con la fila scritta, la manina passa su ▶',
          await page.locator('[data-azione="via"] [data-manina]').count() === 1)
await scatto(page, 'passo-fila')
await page.locator('[data-azione="via"]').click()
await attendi(page, 350)
controlla('mentre corre, ▶ diventa ■', await page.locator('[data-azione="ferma"]').count() === 1)
controlla('e la manina se n\'è andata', await page.locator('[data-manina]').count() === 0)
controlla('e una tessera è accesa', await page.locator('[data-tessera][data-corrente]').count() === 1)
await scatto(page, 'passo-corsa')
await page.waitForSelector('[data-fine="tappa"]', { timeout: 12000 })
uguale('il cartello di fine dice tre stelle',
       await page.locator('[data-stelle-prese]').getAttribute('data-quante'), '3')
controlla('e dice le monete della prima vittoria', (await page.locator('.pp-monete').innerText()).includes('4'))
await attendi(page, 900)          // le stelle entrano una dopo l'altra: la foto le vuole tutte
await scatto(page, 'passo-fine')
{
  const p = await leggiProfilo(page)
  const c = p.campagne && p.campagne.passo
  controlla('la tappa è salvata', c && c.tappa === 1 && c.stelle[0] === 3, JSON.stringify(c))
  /* almeno quattro: il traguardo della prima tappa paga le sue a parte */
  controlla('le monete sono arrivate', p.coins >= 4, `sono ${p.coins}`)
  uguale('e il contatore delle tane è salito', p.totals.ppTane, 1)
}
const monetePrima = (await leggiProfilo(page)).coins

/* ---------- 4. rigiocata non paga di nuovo ---------- */
await attendi(page, 400)
await page.locator('[data-azione="rigioca"]').click()
await page.waitForSelector('.pp-campo')
await attendi(page, 450)
await componi(soluzione)
await page.locator('[data-azione="via"]').click()
await page.waitForSelector('[data-fine="tappa"]', { timeout: 12000 })
uguale('rigiocata, il cartello non promette monete', await page.locator('.pp-monete').count(), 0)
uguale('e la tappa non paga di nuovo', (await leggiProfilo(page)).coins, monetePrima)
await attendi(page, 400)
await page.locator('[data-azione="avanti"]').click()
await page.waitForSelector('.pp-campo')
await attendi(page, 450)

/* ---------- 5. una fila sbagliata: la tessera giusta lampeggia ---------- */
/* Il cespuglio: dritti a destra si sbatte subito, alla prima tessera. */
await componi(['destra', 'destra', 'destra'])
await page.locator('[data-azione="via"]').click()
await page.waitForSelector('[data-tessera][data-guasto]', { timeout: 5000 })
uguale('la tessera che lampeggia è la prima, quella contro il cespuglio',
       await page.locator('[data-tessera][data-guasto]').getAttribute('data-tessera'), '0')
await scatto(page, 'passo-sbatte')
/* la scenetta finisce e si torna alla partenza: ▶ ricompare */
await page.waitForSelector('[data-azione="via"]', { timeout: 6000 })
controlla('finita la scenetta la tessera resta segnata',
          await page.locator('[data-tessera="0"][data-guasto]').count() === 1)
controlla('nessun cartello: sbagliare non chiude niente', await page.locator('[data-fine]').count() === 0)

/* ⌫ toglie proprio lei: il cursore le si è messo subito dopo */
await page.locator('[data-azione="cancella"]').click()
uguale('⌫ toglie una tessera', await page.locator('[data-tessera]').count(), 2)
controlla('e il segno del guasto se ne va con la fila che cambia',
          await page.locator('[data-guasto]').count() === 0)

/* toccare una tessera sposta il cursore subito dopo di lei */
await page.locator('[data-inizio]').click()
await componi(['giu'])
uguale('col cursore all\'inizio la freccia nuova entra in testa',
       await page.locator('[data-tessera="0"]').getAttribute('data-mossa'), 'giu')

/* ---------- 6. il 💡 ---------- */
controlla('il 💡 dice prima quanto costa', await page.locator('[data-costa]').count() === 1)
await page.locator('[data-azione="suggerimento"]').click()
await attendi(page, 200)
controlla('l\'aiuto accende una freccia', await page.locator('.pp-brilla').count() === 1)
controlla('e da lì non costa più', await page.locator('[data-costa]').count() === 0)
await scatto(page, 'passo-aiuto')

/* ---------- 7. ■ ferma a metà, e la fila resta ---------- */
await page.locator('[data-azione="cancella"]').click()
await page.locator('[data-azione="cancella"]').click()
await page.locator('[data-azione="cancella"]').click()
await componi(['giu', 'destra', 'destra', 'su', 'destra', 'sinistra', 'destra'])
const quante = await page.locator('[data-tessera]').count()
/* un doppio tocco su ▶ non ferma la corsa appena partita: ■ sta nello
   stesso posto, e per mezzo secondo non risponde */
await page.locator('[data-azione="via"]').dblclick()
await attendi(page, 150)
controlla('un doppio tocco su ▶ non ferma la corsa', await page.locator('[data-azione="ferma"]').count() === 1)
await attendi(page, 550)
await page.locator('[data-azione="ferma"]').click()
await attendi(page, 150)
controlla('■ ferma la corsa: torna ▶', await page.locator('[data-azione="via"]').count() === 1)
uguale('e la fila resta dov\'era', await page.locator('[data-tessera]').count(), quante)
controlla('niente tessera accesa', await page.locator('[data-corrente]').count() === 0)

/* ---------- 8. i salti ci sono solo dove servono ---------- */
await allaMappa()
await semina(page, { settings: { sperimentali: true, eta: 6 },
                     campagne: { passo: { tappa: 6, stelle: { 0: 3, 1: 1 }, cfg: {} } } })
await page.locator('.carta.gioco[data-gioco="passo"]').click()
await page.waitForSelector('.pp-mappa')
await entraNellaTappa(5)
uguale('nel ruscello ci sono le quattro frecce-salto', await page.locator('[data-salto]').count(), 4)
const ruscello = risolvi(Livello.da(CAMPAGNA[5]))
await componi(ruscello)
await page.locator('[data-azione="via"]').click()
await page.waitForSelector('[data-fine="tappa"]', { timeout: 12000 })
controlla('il ruscello si passa saltando', true)
await attendi(page, 900)
await scatto(page, 'passo-salto')
await attendi(page, 400)
await page.locator('[data-azione="mappa"]').click()
await page.waitForSelector('.pp-mappa')

/* ---------- 9. la mappa più grande sta nello schermo ---------- */
/* «Tutto insieme» è sette per nove: la più grande che la campagna
   permette. Deve stare intera in larghezza e in poco più di metà
   dell'altezza, con tessere e tasti sotto. */
await semina(page, { settings: { sperimentali: true, eta: 8, tuttoAperto: true } })
await page.locator('.carta.gioco[data-gioco="passo"]').click()
await page.waitForSelector('.pp-mappa')
await entraNellaTappa(CAMPAGNA.length - 1)
{
  const tela = await page.locator('.pp-tela').boundingBox()
  const sotto = await page.locator('[data-azione="via"]').boundingBox()
  controlla('la mappa grande sta intera in larghezza', tela.x >= 0 && tela.x + tela.width <= TELEFONO.width,
            JSON.stringify(tela))
  dentro('e occupa fra un terzo e poco più di metà dell\'altezza', Math.round(tela.height), 250, 470)
  controlla('e i tasti sono tutti sullo schermo', sotto.y + sotto.height <= TELEFONO.height,
            JSON.stringify(sotto))
  const cella = tela.width / 7
  dentro('una cella è abbastanza grande da vedere il coniglio', Math.round(cella), 30, 60)
  nota(`mappa 7×9: ${Math.round(tela.width)}×${Math.round(tela.height)} px, cella ${cella.toFixed(1)} px`)
}
await scatto(page, 'passo-grande')

/* ---------- 10. uscire mentre il coniglio entra in casa non butta la tana ---------- */
await allaMappa()
await semina(page, { settings: { sperimentali: true, eta: 6 }, campagne: {} })
await page.locator('.carta.gioco[data-gioco="passo"]').click()
await page.waitForSelector('.pp-mappa')
await entraNellaTappa(0)
await componi(soluzione)
await page.locator('[data-azione="via"]').click()
await attendi(page, 1500)             // tre passi, e il coniglio sta entrando nella tana
await scatto(page, 'passo-esce')
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('.pp-mappa', { timeout: 5000 })
{
  const c = ((await leggiProfilo(page)).campagne || {}).passo
  controlla('uscendo mentre entra nella tana, la tappa resta vinta', c && c.tappa === 1, JSON.stringify(c))
}

/* ---------- 11. il sentiero senza fine, a campagna finita ---------- */
await semina(page, { settings: { sperimentali: true, eta: 8 },
                     campagne: { passo: { tappa: CAMPAGNA.length, libera: true, stelle: {}, cfg: {} } } })
await page.locator('.carta.gioco[data-gioco="passo"]').click()
await page.waitForSelector('.pp-mappa')
controlla('a campagna finita il sentiero si apre',
          await page.locator('[data-tappa="senza-fine"]').isEnabled())
await page.locator('[data-tappa="senza-fine"]').click()
await page.waitForSelector('.pp-campo', { timeout: 5000 })
await attendi(page, 450)
controlla('il sentiero ha una mappa', (await page.locator('.pp-tela').boundingBox()).width > 100)
await scatto(page, 'passo-sentiero')
/* Il sentiero è fatto a caso: la soluzione il test non la sa. La sa il
   💡 — e seguire solo lui deve bastare ad arrivare a casa: si tocca il
   💡, si tocca la freccia che brilla, finché non brilla ▶. */
{
  let giri = 0
  for (; giri < 30; giri++) {
    await page.locator('[data-azione="suggerimento"]').click()
    await attendi(page, 80)
    if (await page.locator('[data-azione="via"].pp-brilla').count()) break
    await page.locator('.pp-brilla').first().click()
    await attendi(page, 60)
  }
  controlla('seguendo il 💡 la fila si compone', giri < 30, `${giri} giri`)
  await page.locator('[data-azione="via"]').click()
  await page.waitForSelector('[data-fine="sentiero"]', { timeout: 20000 })
  controlla('il sentiero si vince seguendo gli aiuti', true)
  await attendi(page, 500)
  await page.locator('[data-azione="avanti"]').click()
  await page.waitForSelector('.pp-campo')
  const titolo = await page.locator('.barra-app .dove').innerText()
  controlla('▶ porta al sentiero dopo', titolo.includes('2'), titolo)
}
await allaMappa()

controlla('nessun errore in console', errori.length === 0, errori.join(' · '))
await browser.close()
riassunto('passo passo, nel browser')
