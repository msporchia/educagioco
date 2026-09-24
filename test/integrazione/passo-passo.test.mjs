/* ═══════════════════════════════════════════════════════════════════
   PASSO PASSO, NEL BROWSER

   Le cose che il motore non può dire, e che si vedono solo qui:

   · **si entra dalla home**, senza accendere niente: dai quattro anni la
     carta c'è da sé;
   · **la mappa sta nello schermo**: intera in larghezza e in circa metà
     dell'altezza di un telefono da 390×844, anche la più grande;
   · **si gioca col dito**: la fila si compone toccando i tasti, ▶ la fa
     partire, e il cartello di fine arriva con le stelle giuste;
   · **uno sbaglio accende la tessera giusta** (`data-guasto`), e ⌫ la
     toglie;
   · il 💡 è una scala: due gradini gratis (fa ragionare, poi dice dove
     si sbaglia), poi la carta giusta a 🪙10 — sul tasto e dentro la fila
     — poi i pezzi di strada a 🪙50 · 100 · 200 con due tocchi, e la
     strada intera spegne la terza stella; mentre il coniglio corre non
     si spegne, si prenota;
   · ■ ferma tutto a metà, e la fila resta dov'è;
   · i salti ci sono solo dove servono;
   · lo zaino: il 🔁 c'è solo dai suoi gradini, la fila si riempie e poi
     non tiene più, una scatola nasce con la N e ▶ non parte finché non
     si sceglie, mentre gira dice a che giro è, e dove sbatte il giro
     resta scritto; il 💡 lì consiglia una scatola intera;
   · a sei anni lo zaino è chiuso, e il sentiero dei piccoli no;
   · e nessun errore in console.
   `DIST=… node test/esegui.mjs passo-passo --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, scatto, semina, attendi, leggiProfilo, TELEFONO }
  from '../aiuto/browser.mjs'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA, TAPPE_PICCOLE } from '../../src/giochi/passo-passo/dati/campagna.js'
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

/* ---------- 1. a quattro anni la carta c'è già ----------
   È uscito dai giochi in prova: non c'è niente da accendere, e i più
   piccoli lo trovano in home da soli */
await semina(page, { settings: { eta: 4 } })
uguale('a quattro anni la carta è in home, senza accendere niente',
       await page.locator('.carta.gioco[data-gioco="passo"]').count(), 1)

/* ---------- 2. si entra dalla home ----------
   Con delle monete in tasca: il 💡 si paga, e il test lo scende tutto */
await semina(page, { settings: { eta: 6 }, coins: 2000 })
const carta = page.locator('.carta.gioco[data-gioco="passo"]')
uguale('a sei anni la carta è in home', await carta.count(), 1)
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
controlla('né il ripeti, né lo zaino', await page.locator('[data-carta], [data-libero]').count() === 0)
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

/* toccare una tessera sposta il cursore subito dopo di lei, e toccarla
   di nuovo subito prima: è così che si arriva all'inizio */
await page.locator('[data-tessera="0"]').click()
await page.locator('[data-tessera="0"]').click()
await componi(['giu'])
uguale('col cursore all\'inizio la freccia nuova entra in testa',
       await page.locator('[data-tessera="0"]').getAttribute('data-mossa'), 'giu')

/* ---------- 6. il 💡: una scala, e i primi due gradini sono gratis ---------- */
const moneteQui = async () => (await leggiProfilo(page)).coins
const suggerimento = async (ms = 200) => { await page.locator('[data-azione="suggerimento"]').click(); await attendi(page, ms) }
const m0 = await moneteQui()
uguale('il primo gradino del 💡 è gratis: nessun bollino', await page.locator('[data-costa]').count(), 0)
await suggerimento()
controlla('il primo tocco fa ragionare: una frase sopra la mappa, e niente di acceso',
          await page.locator('[data-pensiero][data-che="pensa"]').count() === 1 &&
          await page.locator('.pp-brilla, [data-consiglio]').count() === 0)
await suggerimento()
controlla('il secondo dice dove si sbaglia, e non quale carta',
          await page.locator('[data-pensiero][data-che="dove"]').count() === 1 &&
          await page.locator('[data-consiglio]').count() === 0)
uguale('i due gradini gratis non spendono niente', await moneteQui(), m0)
uguale('il terzo costa dieci, e il bollino lo dice prima',
       await page.locator('[data-costa]').getAttribute('data-prezzo'), '10')
await suggerimento()
controlla('la carta da dieci accende una freccia', await page.locator('.pp-brilla').count() === 1)
uguale('e costa dieci monete', await moneteQui(), m0 - 10)
await suggerimento(150)
uguale('ripremuto con la fila com\'era, la stessa carta si riaccende gratis', await moneteQui(), m0 - 10)
await scatto(page, 'passo-aiuto')
/* Il consiglio sta anche dentro la fila, dove andrà: l'anello attorno al
   tasto, da solo, non lo vedeva nessuno («ci premi e non fa nulla»).
   È la stessa freccia del tasto che brilla, e toccarla la mette. */
{
  const consiglio = await page.locator('[data-consiglio]').getAttribute('data-consiglio')
  const tasto = page.locator('.pp-brilla').first()
  const sulTasto = consiglio && consiglio.startsWith('salto-')
    ? 'salto-' + await tasto.getAttribute('data-salto') : await tasto.getAttribute('data-freccia')
  uguale('nella fila compare la freccia che brilla sul tasto', consiglio, sulTasto)
  const prima = await page.locator('[data-tessera]').count()
  await page.locator('[data-consiglio]').click()
  uguale('toccata nella fila, la freccia ci entra', await page.locator('[data-tessera]').count(), prima + 1)
  controlla('e il consiglio se ne va', await page.locator('[data-consiglio], .pp-brilla').count() === 0)
  await suggerimento(150)
  controlla('ripremuto, il 💡 risponde ancora', await page.locator('[data-consiglio], .pp-brilla').count() >= 1)
  uguale('e la carta nuova si paga', await moneteQui(), m0 - 20)
}

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
/* il 💡 non si spegne mentre il coniglio corre — è lì, mentre lo si vede
   sbattere, che lo si cerca: si prenota, e arriva quando si ferma */
await page.locator('[data-azione="suggerimento"]').click()
controlla('premuto durante la corsa, il 💡 si prenota', await page.locator('[data-in-coda]').count() === 1)
await page.locator('[data-azione="ferma"]').click()
await attendi(page, 150)
controlla('■ ferma la corsa: torna ▶', await page.locator('[data-azione="via"]').count() === 1)
uguale('e la fila resta dov\'era', await page.locator('[data-tessera]').count(), quante)
controlla('niente tessera accesa', await page.locator('[data-corrente]').count() === 0)
controlla('e l\'aiuto prenotato arriva', await page.locator('[data-in-coda]').count() === 0 &&
          await page.locator('.pp-brilla').count() === 1)

/* ---------- 7b. i pezzi di strada: due tocchi, e la terza stella ----------
   Finite le tre carte, il 💡 scrive la strada nella fila: un pezzo a
   cinquanta, un altro a cento, tutta a duecento. Il primo tocco arma e
   non spende; la strada intera vince, ma la stella «l'hai trovata tu»
   resta spenta. */
{
  uguale('dopo tre carte il gradino costa cinquanta',
         await page.locator('[data-costa]').getAttribute('data-prezzo'), '50')
  const prima = await moneteQui()
  await suggerimento(150)
  controlla('il primo tocco arma il 💡 e non spende',
            await page.locator('[data-armato]').count() === 1 && await moneteQui() === prima)
  await suggerimento()
  controlla('il secondo scrive un pezzo di strada',
            await page.locator('[data-pensiero][data-che="pezzo"]').count() === 1 &&
            await moneteQui() === prima - 50)
  await suggerimento(150); await suggerimento()
  uguale('il secondo pezzo costa cento', await moneteQui(), prima - 150)
  await suggerimento(150); await suggerimento()
  controlla('e tutta la strada duecento',
            await page.locator('[data-pensiero][data-che="svela"]').count() === 1 &&
            await moneteQui() === prima - 350, `${await moneteQui()} su ${prima}`)
  await page.locator('[data-azione="via"]').click()
  await page.waitForSelector('[data-fine="tappa"]', { timeout: 12000 })
  controlla('la strada scritta dal gioco vince, e la stella «l\'hai trovata tu» resta spenta',
            await page.locator('[data-stella-pensata].pp-spenta').count() === 1)
  await scatto(page, 'passo-strada-svelata')
}

/* ---------- 8. i salti ci sono solo dove servono ---------- */
await allaMappa()
await semina(page, { settings: { eta: 6 },
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
await semina(page, { settings: { eta: 8, tuttoAperto: true } })
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
await semina(page, { settings: { eta: 6 }, campagne: {} })
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
await semina(page, { settings: { eta: 8 },
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
   💡 — e scendere solo lui deve bastare ad arrivare a casa: si tocca il
   💡, si tocca quello che brilla (e un gradino caro si conferma col
   secondo tocco), finché non brilla ▶. È la scala intera, pagata. */
{
  let giri = 0
  for (; giri < 40; giri++) {
    await page.locator('[data-azione="suggerimento"]').click()
    await attendi(page, 80)
    if (await page.locator('[data-azione="via"].pp-brilla').count()) break
    if (await page.locator('[data-armato]').count()) continue
    if (await page.locator('.pp-brilla').count()) {
      await page.locator('.pp-brilla').first().click()
      await attendi(page, 60)
    }
  }
  controlla('scendendo il 💡 la fila si compone', giri < 40, `${giri} giri`)
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

/* ---------- 12. lo zaino, col dito ---------- */
await semina(page, { settings: { eta: 8 },
                     campagne: { passo: { tappa: TAPPE_PICCOLE, stelle: {}, cfg: {} } } })
await page.locator('.carta.gioco[data-gioco="passo"]').click()
await page.waitForSelector('.pp-mappa')
controlla('a otto anni la prima tappa dello zaino è aperta',
          await page.locator(`.pp-tappa[data-tappa="${TAPPE_PICCOLE}"]`).isEnabled())
await entraNellaTappa(TAPPE_PICCOLE)
const viale = CAMPAGNA[TAPPE_PICCOLE]
uguale('c\'è il tasto del ripeti', await page.locator('[data-carta="ripeti"]').count(), 1)
controlla('e la prima volta la manina lo indica',
          await page.locator('[data-carta="ripeti"] [data-manina]').count() === 1)
uguale('lo zaino mostra i suoi posti vuoti', await page.locator('[data-libero]').count(), viale.zaino)
await componi(['destra', 'destra', 'destra'])
controlla('pieno lo zaino, le frecce non entrano più',
          await page.locator('[data-freccia="destra"]').isDisabled() &&
          await page.locator('[data-carta="ripeti"]').isDisabled())
for (let k = 0; k < 3; k++) await page.locator('[data-azione="cancella"]').click()
await page.locator('[data-carta="ripeti"]').click()
await attendi(page, 150)
uguale('🔁 mette una scatola', await page.locator('[data-scatola]').count(), 1)
controlla('che nasce con la N da scegliere, e la scelta aperta',
          await page.locator('[data-testa][data-volte="N"]').count() === 1 &&
          await page.locator('[data-scelta-volte]').count() === 1)
controlla('nessun numero è già scelto', await page.locator('[data-scelta-volte] .pp-ora').count() === 0)
await page.locator('[data-azione="via"]').click()
await attendi(page, 200)
controlla('con una N ▶ non parte', await page.locator('[data-azione="ferma"]').count() === 0 &&
          await page.locator('[data-scelta-volte]').count() === 1)
await page.locator('[data-volte-scegli="5"]').click()
await attendi(page, 150)
controlla('scelto il numero, la scelta si chiude e la testa lo dice',
          await page.locator('[data-scelta-volte]').count() === 0 &&
          await page.locator('[data-testa][data-volte="5"]').count() === 1)
await componi(['destra'])
uguale('la freccia dopo entra nella scatola', await page.locator('[data-scatola] [data-tessera]').count(), 1)
await page.locator('[data-coda]').click()
await componi(['giu'])
uguale('toccato il bordo, la freccia dopo sta fuori', await page.locator('[data-scatola] [data-tessera]').count(), 1)
uguale('e lo zaino è pieno', await page.locator('[data-libero]').count(), 0)
await scatto(page, 'passo-zaino')
await page.locator('[data-azione="via"]').click()
await attendi(page, 1200)
{
  const giro = await page.locator('[data-testa]').getAttribute('data-giro')
  controlla('mentre corre, la testa della scatola dice a che giro è', /^[1-5]\/5$/.test(giro || ''), giro)
}
await scatto(page, 'passo-zaino-corre')
await page.waitForSelector('[data-fine="tappa"]', { timeout: 15000 })
uguale('il viale col ripeti vale tre stelle',
       await page.locator('[data-stelle-prese]').getAttribute('data-quante'), '3')
await attendi(page, 500)
await page.locator('[data-azione="rigioca"]').click()
await page.waitForSelector('.pp-campo')
await attendi(page, 450)

/* dove sbatte dentro una scatola, il giro resta scritto */
await page.locator('[data-carta="ripeti"]').click()
await page.locator('[data-volte-scegli="6"]').click()
await componi(['destra'])
await page.locator('[data-azione="via"]').click()
await page.waitForSelector('[data-tessera][data-guasto]', { timeout: 8000 })
await page.waitForSelector('[data-azione="via"]', { timeout: 8000 })
uguale('sbattuto al sesto giro, la testa lo dice', await page.locator('[data-testa]').getAttribute('data-giro'), '6/6')
await scatto(page, 'passo-zaino-sbatte')

/* il 💡 con lo zaino: a fila vuota consiglia una scatola intera */
await page.locator('[data-azione="cancella"]').click()
await page.locator('[data-coda]').click()
await page.locator('[data-azione="cancella"]').click()
uguale('⌫ dopo la scatola la toglie intera', await page.locator('[data-scatola]').count(), 0)
/* i due gradini gratis, poi la carta */
await page.locator('[data-azione="suggerimento"]').click()
await page.locator('[data-azione="suggerimento"]').click()
await page.locator('[data-azione="suggerimento"]').click()
await attendi(page, 150)
controlla('il 💡 consiglia una scatola, e il 🔁 brilla',
          (await page.locator('[data-consiglio]').getAttribute('data-consiglio')) === 'ripeti-5' &&
          await page.locator('[data-carta="ripeti"].pp-brilla').count() === 1)
await page.locator('[data-consiglio]').click()
controlla('toccata, la scatola entra già col suo numero',
          await page.locator('[data-testa][data-volte="5"]').count() === 1 &&
          await page.locator('[data-scelta-volte]').count() === 0)
await scatto(page, 'passo-zaino-aiuto')

/* ---------- 13. a sei anni lo zaino è chiuso, e il sentiero no ---------- */
await allaMappa()
await semina(page, { settings: { eta: 6 },
                     campagne: { passo: { tappa: TAPPE_PICCOLE, stelle: {}, cfg: {} } } })
await page.locator('.carta.gioco[data-gioco="passo"]').click()
await page.waitForSelector('.pp-mappa')
controlla('a sei anni la prima tappa dello zaino è chiusa',
          !(await page.locator(`.pp-tappa[data-tappa="${TAPPE_PICCOLE}"]`).isEnabled()))
controlla('e il sentiero senza fine, alla fine delle tappe dei piccoli, è aperto',
          await page.locator('[data-tappa="senza-fine"]').isEnabled())
await scatto(page, 'passo-zaino-chiuso')

/* ---------- 14. il «fino a» e il «se», col dito ---------- */
/* compone un programma qualunque come lo compone un bambino: le frecce
   coi loro tasti, una scatola col suo tasto e la sua testa nella scelta,
   e la fine di una scatola toccandone il bordo */
async function scrivi(programma) {
  let cursore = 0
  for (const t of programma) {
    if (t === 'fine') await page.locator(`[data-coda="${cursore}"]`).click()
    else if (t.startsWith('ripeti-') || t.startsWith('se-')) {
      await page.locator(t.startsWith('se-') ? '[data-carta="se"]' : '[data-carta="ripeti"]').click()
      await page.locator(`[data-volte-scegli="${t.slice(t.indexOf('-') + 1)}"]`).click()
    } else await page.locator(tasto(t)).click()
    cursore++
    await attendi(page, 50)
  }
}
async function vinci(chiave) {
  const t = CAMPAGNA.find(x => x.chiave === chiave)
  await scrivi(t.soluzioni[0])
  await page.locator('[data-azione="via"]').click()
  await page.waitForSelector('[data-fine="tappa"]', { timeout: 40000 })
  return page.locator('[data-stelle-prese]').getAttribute('data-quante')
}
await semina(page, { settings: { eta: 10, tuttoAperto: true },
                     campagne: { passo: { tappa: CAMPAGNA.length - 1, stelle: {}, cfg: {} } } })
await page.locator('.carta.gioco[data-gioco="passo"]').click()
await page.waitForSelector('.pp-mappa')
await entraNellaTappa(CAMPAGNA.findIndex(t => t.chiave === 'gradini-storti'))
controlla('nel «fino a» c\'è il 🔁 e non ancora il ❓',
          await page.locator('[data-carta="ripeti"]').count() === 1 && await page.locator('[data-carta="se"]').count() === 0)
await page.locator('[data-carta="ripeti"]').click()
controlla('la scelta della testa offre i numeri e il colore della mappa',
          await page.locator('[data-volte-scegli="3"]').count() === 1 &&
          await page.locator('[data-volte-scegli="rosso"]').count() === 1 &&
          await page.locator('[data-volte-scegli="blu"], [data-volte-scegli="casa"]').count() === 0)
await scatto(page, 'passo-fino-scelta')
await page.locator('[data-azione="cancella"]').click()
uguale('i gradini storti si fanno col «fino al rosso»', await vinci('gradini-storti'), '3')
await attendi(page, 500)
await page.locator('[data-azione="mappa"]').click()
await page.waitForSelector('.pp-mappa')

await entraNellaTappa(CAMPAGNA.findIndex(t => t.chiave === 'segni'))
uguale('nel «se» c\'è anche il ❓', await page.locator('[data-carta="se"]').count(), 1)
await page.locator('[data-carta="se"]').click()
controlla('la scelta del ❓ offre solo i colori, tutti e tre',
          await page.locator('[data-volte-scegli="3"]').count() === 0 &&
          await page.locator('[data-volte-scegli="rosso"], [data-volte-scegli="blu"], [data-volte-scegli="giallo"]').count() === 3)
await page.locator('[data-azione="cancella"]').click()
uguale('il sentiero dei segni si fa leggendo le lastre', await vinci('segni'), '3')
await scatto(page, 'passo-se')
await attendi(page, 500)
await page.locator('[data-azione="mappa"]').click()
await page.waitForSelector('.pp-mappa')

/* la mappa più grande di tutte, nove per undici, sta nello schermo */
await entraNellaTappa(CAMPAGNA.findIndex(t => t.chiave === 'bosco-ghiacciato'))
{
  const tela = await page.locator('.pp-tela').boundingBox()
  const sotto = await page.locator('[data-azione="via"]').boundingBox()
  controlla('la mappa nove per undici sta intera in larghezza', tela.x >= 0 && tela.x + tela.width <= TELEFONO.width,
            JSON.stringify(tela))
  controlla('e i tasti sono tutti sullo schermo', sotto.y + sotto.height <= TELEFONO.height, JSON.stringify(sotto))
  const cella = tela.width / 9
  dentro('una cella resta grande abbastanza da vedere il coniglio', Math.round(cella), 26, 60)
  nota(`mappa 9×11: ${Math.round(tela.width)}×${Math.round(tela.height)} px, cella ${cella.toFixed(1)} px`)
}
uguale('il bosco ghiacciato si fa leggendo i segnali sul ghiaccio', await vinci('bosco-ghiacciato'), '3')

controlla('nessun errore in console', errori.length === 0, errori.join(' · '))
await browser.close()
riassunto('passo passo, nel browser')
