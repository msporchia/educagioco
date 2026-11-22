/* ═══════════════════════════════════════════════════════════════════
   PASSO PASSO, NEL BROWSER
   perché: la tappa di Passo passo col dito: l'ingresso dalla home, la prima tappa fino alle stelle, la tessera guasta, il 💡 sul tasto e dentro la fila, ■, le mappe grandi in 390×844, lo zaino, il «fino a» e il «se», il guerriero e la fila trascinata col dito vero
   a parte perché: la mappa delle isole (passo-passo-mappa) e la partita lasciata a metà (passo-passo-sosta) sono altre schermate con un'altra semina; qui tutto parte da una tappa aperta

   Le cose che il motore non può dire, e che si vedono solo qui:

   · **si entra dalla home**, senza accendere niente: dai quattro anni la
     carta c'è da sé;
   · **si gioca col dito**: la fila si compone toccando i tasti, ▶ la fa
     partire, e il cartello di fine arriva con le stelle giuste (una
     tappa sola fino al cartello, più la sua rigiocata con la strada
     lunga e quella della principessa);
   · **uno sbaglio accende la tessera giusta** (`data-guasto`), e ⌫ la
     toglie;
   · il 💡: i due gradini gratis dicono una frase e non accendono niente,
     il bollino dice il prezzo prima, la carta si accende sul tasto e
     dentro la fila, il pezzo di strada vuole due tocchi; mentre il
     coniglio corre non si spegne, si prenota (la scala dei prezzi e le
     stelle che spegne sono conti: `unita/aiuti`, `unita/passo-passo-sosta`);
   · ■ ferma tutto a metà, e la fila resta dov'è;
   · le mappe più grandi stanno nello schermo del telefono;
   · lo zaino: il 🔁 c'è solo dai suoi gradini, la fila si riempie e poi
     non tiene più, una scatola nasce con la N e ▶ non parte finché non
     si sceglie, mentre gira dice a che giro è, e dove sbatte il giro
     resta scritto;
   · il «fino a», il «se» e le scatole del guerriero si scrivono col dito
     (la fila scritta è la soluzione dei dati: che vinca lo dicono
     `unita/passo-passo` e `unita/passo-passo-guerriero`);
   · la fila si trascina col dito vero (CDP: un `page.click()` non porta
     i pointer del dito, docs/core/il-dito.md);
   · a casa la tastiera tace (a scuola: `integrazione/scuola`);
   · e nessun errore in console.
   Le tappe si aprono col cheat `#passo=<chiave>` quando non serve la
   mappa per arrivarci (docs/core/comandi.md).
   `node test/esegui.mjs integrazione/passo-passo --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, scatto, semina, attendi, leggiProfilo, TELEFONO, scegli, parti,
         giocaSullIsola, statoSullIsola, SCATTI_ACCESI } from '../aiuto/browser.mjs'
import { pronto } from '../aiuto/browser.mjs'
import { controlla, uguale, dentro, nota, riassunto, blocco } from '../aiuto/verifica.mjs'
import { CAMPAGNA, TAPPE_PICCOLE, TAPPE_PRIME, FILA_ATTUALE, delGuerriero } from '../../src/giochi/passo-passo/dati/campagna.js'
import { STRADE } from '../../src/giochi/passo-passo/motore/strade.js'
import { Livello } from '../../src/giochi/passo-passo/motore/livello.js'
import { risolvi } from '../../src/giochi/passo-passo/motore/risolutore.js'
import { filaScritta, filaDi, chiudiIlTraguardo } from '../aiuto/passo-passo.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

/* il tasto di una mossa: le frecce hanno `data-freccia`, i salti `data-salto` */
const tasto = m => m.startsWith('salto-') ? `[data-salto="${m.slice(6)}"]` : `[data-freccia="${m}"]`
const componi = async mosse => { for (const m of mosse) await page.locator(tasto(m)).click() }
/* compone un programma qualunque come lo compone un bambino: le frecce coi loro tasti, una scatola col suo tasto e la sua
   testa nella scelta, e la fine di una scatola toccandone il bordo */
async function scrivi(programma) {
  let cursore = 0
  for (const t of programma) {
    if (t === 'fine') await page.locator(`[data-coda="${cursore}"]`).click()
    else if (t.startsWith('ripeti-') || t.startsWith('se-')) {
      await page.locator(t.startsWith('se-') ? '[data-carta="se"]' : '[data-carta="ripeti"]').click()
      await page.locator(`[data-volte-scegli="${t.slice(t.indexOf('-') + 1)}"]`).click()
    } else await page.locator(tasto(t)).click()
    cursore++
  }
}
// la finestra cieca dei 320 ms senza un segno a schermo (docs/core/interfaccia.md): si aspetta a tempo, e il primo fotogramma
const finestraCieca = () => pronto(page, '.pp')
async function entraNellaTappa(i) {
  await giocaSullIsola(page, i)
  await page.waitForSelector('.pp-campo', { timeout: 5000 })
  await finestraCieca()
}
/* una tappa aperta dall'indirizzo (`#passo=<chiave>`), col profilo che c'è: si ricarica, e l'indirizzo torna pulito, se no
   la prossima `semina` riaprirebbe la tappa invece della home */
async function dallIndirizzo(chiave) {
  await page.evaluate(k => { location.hash = 'passo=' + k; location.reload() }, chiave)
  await page.waitForSelector('.pp-campo', { timeout: 8000 })
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
  await chiudiIlTraguardo(page)
  await finestraCieca()
}
async function allaMappaDiPasso(profilo) {
  await semina(page, profilo)
  await chiudiIlTraguardo(page)
  await scegli(page, 'passo')
  await page.waitForSelector('[data-mappa] [data-tappa]', { timeout: 5000 })
}
const allaMappa = async () => {
  await page.locator('button[aria-label="indietro"]').click()
  await page.waitForSelector('.pp-mappa', { timeout: 5000 })
}
// aspetta la condizione e dice se è arrivata: un'attesa scaduta è un controllo che fallisce
const arriva = (sel, timeout) => page.waitForSelector(sel, { timeout }).then(() => true, () => false)
const fineTappa = () => page.waitForSelector('[data-fine="tappa"]', { timeout: 15000 })
const stelle = () => page.locator('[data-stelle-prese]').getAttribute('data-quante')

/* ══════════ 1. dalla home, e la prima tappa fino alle stelle ══════════ */
await blocco('la prima tappa', async () => {
  /* è uscito dai giochi in prova: a quattro anni non c'è niente da accendere */
  await semina(page, { settings: { eta: 4 } })
  uguale('a quattro anni la carta è in home, senza accendere niente',
         await page.locator('.carta.gioco[data-gioco="passo"]').count(), 1)
  // con delle monete in tasca: il 💡 si paga
  await allaMappaDiPasso({ settings: { eta: 6 }, coins: 2000 })
  // col coniglio la valle ha le sue tappe prima delle carte; quelle stanno di là dalla tana (docs/passo-passo/mappa.md)
  uguale('col coniglio la valle ha le sue tappe dei piccoli',
         await page.locator('[data-mappa] [data-tappa]:not([data-tappa^="senza-fine"])').count(), TAPPE_PRIME)
  uguale('la prima tappa è quella di adesso', await statoSullIsola(page, 0), 'ora')
  uguale('la seconda no, finché non si fa la prima', await statoSullIsola(page, 1), 'chiusa')
  uguale('il sentiero senza fine è chiuso a campagna da fare', await statoSullIsola(page, 'senza-fine'), 'chiusa')
  await scatto(page, 'passo-mappa')

  await entraNellaTappa(0)
  controlla('nella prima tappa non ci sono i salti', await page.locator('[data-salto]').count() === 0)
  controlla('né il ripeti, né lo zaino', await page.locator('[data-carta], [data-libero]').count() === 0)
  /* la manina della prima volta (la guida comune): indica la freccia, poi ▶, poi se ne va */
  controlla('la prima volta una manina indica la freccia',
            await page.locator('[data-freccia="destra"][data-indicato="mano"]').count() === 1)
  {
    const tela = await page.locator('.pp-tela').boundingBox()
    controlla('la mappa è disegnata', tela && tela.width > 100 && tela.height > 80, JSON.stringify(tela))
    dentro('e sta intera in larghezza', Math.round(tela.x + tela.width), 1, TELEFONO.width)
  }
  const soluzione = risolvi(Livello.da(CAMPAGNA[0]))
  await componi(soluzione)
  uguale('la fila ha una tessera per freccia', await page.locator('[data-tessera]').count(), soluzione.length)
  controlla('con la fila scritta, la manina passa su ▶',
            await page.locator('[data-azione="via"][data-indicato="mano"]').count() === 1)
  await scatto(page, 'passo-fila')
  await page.locator('[data-azione="via"]').click()
  await page.waitForSelector('[data-tessera][data-corrente]', { timeout: 3000 })
  controlla('mentre corre, ▶ diventa ■', await page.locator('[data-azione="ferma"]').count() === 1)
  controlla('e la manina se n\'è andata', await page.locator('[data-indicato]').count() === 0)
  uguale('e una tessera è accesa', await page.locator('[data-tessera][data-corrente]').count(), 1)
  await scatto(page, 'passo-corsa')
  await fineTappa()
  uguale('il cartello di fine dice quattro stelle: la strada del risolutore è la più corta', await stelle(), '4')
  uguale('e nessuna riga dice di accorciarla', await page.locator('[data-accorcia]').count(), 0)
  controlla('e dice le monete della prima vittoria', (await page.locator('.pp-monete').innerText()).includes('4'))
  if (SCATTI_ACCESI) await attendi(page, 900)          // le stelle entrano una dopo l'altra: la foto le vuole tutte
  await scatto(page, 'passo-fine')
  const p = await leggiProfilo(page)
  const c = p.campagne && p.campagne.passo
  controlla('la tappa è salvata', c && c.tappa === 1 && c.stelle[0] === 4, JSON.stringify(c))
  /* almeno quattro: il traguardo della prima tappa paga le sue a parte */
  controlla('le monete sono arrivate', p.coins >= 2004, `sono ${p.coins}`)
  uguale('e il contatore delle tane è salito', p.totals.ppTane, 1)

  /* rigiocata non paga di nuovo, e la strada lunga si dice: un giro in giù e di nuovo su, con due frecce di troppo.
     I tasti del cartello sono spenti per la sua finestra cieca, e il click aspetta che si accendano; la prima tana è un
     traguardo, e il suo velo li copre */
  await chiudiIlTraguardo(page)
  await page.locator('[data-azione="rigioca"]').click()
  await page.waitForSelector('.pp-campo')
  await finestraCieca()
  await componi(['destra', 'giu', 'su', 'destra', 'destra'])
  await page.locator('[data-azione="via"]').click()
  await fineTappa()
  uguale('rigiocata, il cartello non promette monete', await page.locator('.pp-monete').count(), 0)
  uguale('e la tappa non paga di nuovo', (await leggiProfilo(page)).coins, p.coins)
  uguale('per la strada lunga, tre stelle', await stelle(), '3')
  controlla('e la quarta, spenta', await page.locator('[data-stella-corta].pp-spenta').count() === 1)
  const riga = page.locator('[data-accorcia]')
  controlla('una riga dice che si poteva fare con meno, coi due numeri',
            await riga.getAttribute('data-minimo') === '3' && await riga.getAttribute('data-usate') === '5',
            await riga.count() ? await riga.innerText() : 'nessuna riga')
  await scatto(page, 'passo-fine-lunga')
  uguale('e le stelle salvate restano quattro: è il primato della tappa',
         (await leggiProfilo(page)).campagne.passo.stelle[0], 4)
})

/* ══════════ 2. il cespuglio: lo sbaglio, il 💡 e ■ ══════════ */
await blocco('lo sbaglio, il 💡 e ■', async () => {
  await semina(page, { settings: { eta: 6 }, coins: 2000, campagne: { passo: { tappa: 2, stelle: { 0: 4, 1: 1 }, cfg: {} } } })
  await dallIndirizzo('cespuglio')
  /* dritti a destra si sbatte subito, alla prima tessera */
  await componi(['destra', 'destra', 'destra'])
  await page.locator('[data-azione="via"]').click()
  await page.waitForSelector('[data-tessera][data-guasto]', { timeout: 5000 })
  uguale('la tessera che lampeggia è la prima, quella contro il cespuglio',
         await page.locator('[data-tessera][data-guasto]').getAttribute('data-tessera'), '0')
  await scatto(page, 'passo-sbatte')
  /* la scenetta finisce e si torna alla partenza: ▶ ricompare */
  await page.waitForSelector('[data-azione="via"]', { timeout: 6000 })
  controlla('finita la scenetta la tessera resta segnata', await page.locator('[data-tessera="0"][data-guasto]').count() === 1)
  controlla('nessun cartello: sbagliare non chiude niente', await page.locator('[data-fine]').count() === 0)
  /* ⌫ toglie proprio lei: il cursore le si è messo subito dopo */
  await page.locator('[data-azione="cancella"]').click()
  uguale('⌫ toglie una tessera', await page.locator('[data-tessera]').count(), 2)
  controlla('e il segno del guasto se ne va con la fila che cambia', await page.locator('[data-guasto]').count() === 0)
  /* toccare una tessera sposta il cursore subito dopo di lei, e toccarla di nuovo subito prima: così si arriva all'inizio */
  await page.locator('[data-tessera="0"]').click()
  await page.locator('[data-tessera="0"]').click()
  await componi(['giu'])
  uguale('col cursore all\'inizio la freccia nuova entra in testa',
         await page.locator('[data-tessera="0"]').getAttribute('data-mossa'), 'giu')

  /* il 💡: due gradini gratis che fanno ragionare, poi la carta giusta; i prezzi della scala li prova `unita/aiuti` */
  const moneteQui = async () => (await leggiProfilo(page)).coins
  const suggerimento = async (ms = 200) => { await page.locator('[data-azione="suggerimento"]').click(); await attendi(page, ms) }
  const prezzo = async () => Number(await page.locator('[data-costa]').getAttribute('data-prezzo'))
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
  const carta = await prezzo()
  controlla('il terzo ha il bollino col prezzo, prima di toccarlo', carta > 0, String(carta))
  await suggerimento()
  controlla('la carta accende una freccia', await page.locator('.pp-brilla').count() === 1)
  uguale('e costa quello che diceva il bollino', await moneteQui(), m0 - carta)
  await suggerimento(150)
  uguale('ripremuto con la fila com\'era, la stessa carta si riaccende gratis', await moneteQui(), m0 - carta)
  await scatto(page, 'passo-aiuto')
  /* il consiglio sta anche dentro la fila, dove andrà: l'anello attorno al tasto, da solo, non lo vedeva nessuno («ci premi
     e non fa nulla»). È la stessa freccia del tasto che brilla, e toccarla la mette */
  {
    const consiglio = await page.locator('[data-consiglio]').getAttribute('data-consiglio')
    const brilla = page.locator('.pp-brilla').first()
    const sulTasto = consiglio && consiglio.startsWith('salto-')
      ? 'salto-' + await brilla.getAttribute('data-salto') : await brilla.getAttribute('data-freccia')
    uguale('nella fila compare la freccia che brilla sul tasto', consiglio, sulTasto)
    const prima = await page.locator('[data-tessera]').count()
    await page.locator('[data-consiglio]').click()
    uguale('toccata nella fila, la freccia ci entra', await page.locator('[data-tessera]').count(), prima + 1)
    controlla('e il consiglio se ne va', await page.locator('[data-consiglio], .pp-brilla').count() === 0)
    await suggerimento(150)
    controlla('ripremuto, il 💡 risponde ancora: la carta dopo', await page.locator('[data-consiglio], .pp-brilla').count() >= 1)
  }

  /* ■ ferma a metà, e la fila resta */
  for (let k = 0; k < 3; k++) await page.locator('[data-azione="cancella"]').click()
  await componi(['giu', 'destra', 'destra', 'su', 'destra', 'sinistra', 'destra'])
  const quante = await page.locator('[data-tessera]').count()
  /* un doppio tocco su ▶ non ferma la corsa appena partita: ■ sta nello stesso posto, e per mezzo secondo non risponde */
  await page.locator('[data-azione="via"]').dblclick()
  await attendi(page, 150)
  controlla('un doppio tocco su ▶ non ferma la corsa', await page.locator('[data-azione="ferma"]').count() === 1)
  await attendi(page, 550)
  /* il 💡 non si spegne mentre il coniglio corre — è lì, mentre lo si vede sbattere, che lo si cerca: si prenota, e arriva
     quando si ferma */
  await page.locator('[data-azione="suggerimento"]').click()
  controlla('premuto durante la corsa, il 💡 si prenota', await page.locator('[data-in-coda]').count() === 1)
  await page.locator('[data-azione="ferma"]').click()
  await attendi(page, 150)
  controlla('■ ferma la corsa: torna ▶', await page.locator('[data-azione="via"]').count() === 1)
  uguale('e la fila resta dov\'era', await page.locator('[data-tessera]').count(), quante)
  controlla('niente tessera accesa', await page.locator('[data-corrente]').count() === 0)
  controlla('e l\'aiuto prenotato arriva', await page.locator('[data-in-coda]').count() === 0 &&
            await page.locator('.pp-brilla').count() === 1)

  /* i pezzi di strada: finite le carte il 💡 scrive nella fila, e vuole due tocchi. Il primo arma e non spende */
  const pezzo = await prezzo()
  controlla('finite le carte il gradino costa di più', pezzo > carta, `${pezzo} dopo ${carta}`)
  const prima = await moneteQui()
  await suggerimento(150)
  controlla('il primo tocco arma il 💡 e non spende',
            await page.locator('[data-armato]').count() === 1 && await moneteQui() === prima)
  await suggerimento()
  controlla('il secondo scrive un pezzo di strada, e spende quello che diceva il bollino',
            await page.locator('[data-pensiero][data-che="pezzo"]').count() === 1 && await moneteQui() === prima - pezzo)
  await scatto(page, 'passo-strada-pezzo')
})

/* ══════════ 3. i salti, e le mappe grandi nello schermo ══════════ */
await blocco('i salti e le mappe grandi', async () => {
  await dallIndirizzo(CAMPAGNA[5].chiave)
  uguale('nel ruscello ci sono le quattro frecce-salto', await page.locator('[data-salto]').count(), 4)
  await scatto(page, 'passo-salto')
  /* la più grande della valle (sette per nove) e la più grande di tutte (nove per undici): intere in larghezza, coi tasti
     sotto sullo schermo e una cella dove il coniglio si vede */
  for (const [chiave, larga, alta, minimo, altezza] of [[CAMPAGNA[CAMPAGNA.findLastIndex(t => !delGuerriero(t))].chiave, 7, 9, 30, [250, 470]],
                                                         ['bosco-ghiacciato', 9, 11, 26, null]]) {
    await dallIndirizzo(chiave)
    const tela = await page.locator('.pp-tela').boundingBox()
    const sotto = await page.locator('[data-azione="via"]').boundingBox()
    controlla(`la mappa ${larga}×${alta} sta intera in larghezza`, tela.x >= 0 && tela.x + tela.width <= TELEFONO.width,
              JSON.stringify(tela))
    if (altezza) dentro('e occupa fra un terzo e poco più di metà dell\'altezza', Math.round(tela.height), ...altezza)
    controlla(`con la mappa ${larga}×${alta} i tasti sono tutti sullo schermo`, sotto.y + sotto.height <= TELEFONO.height,
              JSON.stringify(sotto))
    const cella = tela.width / larga
    dentro(`nella ${larga}×${alta} una cella è abbastanza grande da vedere il coniglio`, Math.round(cella), minimo, 60)
    nota(`mappa ${larga}×${alta}: ${Math.round(tela.width)}×${Math.round(tela.height)} px, cella ${cella.toFixed(1)} px`)
    await scatto(page, `passo-grande-${larga}`)
  }
})

/* ══════════ 4. lo zaino, col dito ══════════ */
await blocco('lo zaino', async () => {
  await allaMappaDiPasso({ settings: { eta: 8 }, coins: 500, campagne: { passo: { tappa: TAPPE_PICCOLE, stelle: {}, cfg: {} } } })
  controlla('a otto anni la prima tappa dello zaino è aperta', await statoSullIsola(page, TAPPE_PICCOLE) !== 'chiusa')
  await entraNellaTappa(TAPPE_PICCOLE)
  uguale('c\'è il tasto del ripeti', await page.locator('[data-carta="ripeti"]').count(), 1)
  controlla('e la prima volta la manina lo indica', await page.locator('[data-carta="ripeti"][data-indicato="mano"]').count() === 1)
  uguale('lo zaino mostra i suoi posti vuoti', await page.locator('[data-libero]').count(), CAMPAGNA[TAPPE_PICCOLE].zaino)
  await componi(['destra', 'destra', 'destra'])
  controlla('pieno lo zaino, le frecce non entrano più',
            await page.locator('[data-freccia="destra"]').isDisabled() && await page.locator('[data-carta="ripeti"]').isDisabled())
  for (let k = 0; k < 3; k++) await page.locator('[data-azione="cancella"]').click()
  await page.locator('[data-carta="ripeti"]').click()
  await attendi(page, 150)
  uguale('🔁 mette una scatola', await page.locator('[data-scatola]').count(), 1)
  controlla('che nasce con la N da scegliere, e la scelta aperta',
            await page.locator('[data-testa][data-volte="N"]').count() === 1 && await page.locator('[data-scelta-volte]').count() === 1)
  controlla('nessun numero è già scelto', await page.locator('[data-scelta-volte] .pp-ora').count() === 0)
  await page.locator('[data-azione="via"]').click()
  await attendi(page, 200)
  controlla('con una N ▶ non parte', await page.locator('[data-azione="ferma"]').count() === 0 &&
            await page.locator('[data-scelta-volte]').count() === 1)
  await page.locator('[data-volte-scegli="5"]').click()
  await attendi(page, 150)
  controlla('scelto il numero, la scelta si chiude e la testa lo dice',
            await page.locator('[data-scelta-volte]').count() === 0 && await page.locator('[data-testa][data-volte="5"]').count() === 1)
  await componi(['destra'])
  uguale('la freccia dopo entra nella scatola', await page.locator('[data-scatola] [data-tessera]').count(), 1)
  await page.locator('[data-coda]').click()
  await componi(['giu'])
  uguale('toccato il bordo, la freccia dopo sta fuori', await page.locator('[data-scatola] [data-tessera]').count(), 1)
  uguale('e lo zaino è pieno', await page.locator('[data-libero]').count(), 0)
  await scatto(page, 'passo-zaino')
  /* mentre corre la testa dice a che giro è; visto, lo si ferma (che la soluzione vinca con quattro stelle lo dice l'unità).
     Al terzo giro: ■ non risponde nel primo mezzo secondo della corsa */
  await page.locator('[data-azione="via"]').click()
  controlla('mentre corre, la testa della scatola dice a che giro è', await arriva('[data-testa][data-giro="3/5"]', 3000),
            await page.locator('[data-testa]').getAttribute('data-giro'))
  await scatto(page, 'passo-zaino-corre')
  await chiudiIlTraguardo(page)          // la prima corsa con lo zaino festeggia «lo zaino del coniglio», e il velo copre ■
  await page.locator('[data-azione="ferma"]').click()
  uguale('■ ferma la scatola a metà, senza cartello', await arriva('[data-azione="via"]', 3000) && await page.locator('[data-fine]').count(), 0)

  /* dove sbatte dentro una scatola, il giro resta scritto: sei volte a destra, e alla sesta c'è l'albero */
  await page.locator('[data-testa]').click()
  await page.locator('[data-volte-scegli="6"]').click()
  await page.locator('[data-azione="via"]').click()
  await page.waitForSelector('[data-tessera][data-guasto]', { timeout: 8000 })
  await page.waitForSelector('[data-azione="via"]', { timeout: 8000 })
  uguale('sbattuto al sesto giro, la testa lo dice', await page.locator('[data-testa]').getAttribute('data-giro'), '6/6')
  await scatto(page, 'passo-zaino-sbatte')

  /* il 💡 con lo zaino: a fila vuota consiglia una scatola intera. Il cursore è dopo la freccia che ha sbattuto */
  await page.locator('[data-azione="cancella"]').click()
  await page.locator('[data-coda]').click()
  await page.locator('[data-azione="cancella"]').click()
  uguale('⌫ dopo la scatola la toglie intera', await page.locator('[data-scatola]').count(), 0)
  await page.locator('[data-tessera]').click()          // resta il «giù»: toccato, il cursore gli va dopo
  await page.locator('[data-azione="cancella"]').click()
  uguale('la fila è vuota', await page.locator('[data-tessera]').count(), 0)
  for (let k = 0; k < 3; k++) await page.locator('[data-azione="suggerimento"]').click()      // i due gradini gratis, poi la carta
  await attendi(page, 150)
  controlla('il 💡 consiglia una scatola, e il 🔁 brilla',
            (await page.locator('[data-consiglio]').getAttribute('data-consiglio')) === 'ripeti-5' &&
            await page.locator('[data-carta="ripeti"].pp-brilla').count() === 1)
  await page.locator('[data-consiglio]').click()
  controlla('toccata, la scatola entra già col suo numero',
            await page.locator('[data-testa][data-volte="5"]').count() === 1 && await page.locator('[data-scelta-volte]').count() === 0)
  await scatto(page, 'passo-zaino-aiuto')

  /* a casa la tastiera tace: si gioca col telefono (docs/core/tastiera.md) */
  const prima = await page.locator('[data-tessera], [data-scatola]').count()
  await page.keyboard.press('ArrowRight')
  uguale('a casa una freccia della tastiera non scrive niente', await page.locator('[data-tessera], [data-scatola]').count(), prima)
  uguale('e sui pulsanti non c\'è il tasto da premere', await page.locator('[data-tasto-tastiera]').count(), 0)

  /* a sei anni lo zaino è aperto a chi ci arriva, e il sentiero aspetta la fine */
  await allaMappaDiPasso({ settings: { eta: 6 }, campagne: { passo: { tappa: TAPPE_PICCOLE, stelle: {}, cfg: {} } } })
  controlla('a sei anni la prima tappa dello zaino è aperta: l\'età non ferma chi ci arriva',
            await statoSullIsola(page, TAPPE_PICCOLE) !== 'chiusa')
  uguale('e il sentiero senza fine aspetta la fine della strada', await statoSullIsola(page, 'senza-fine'), 'chiusa')
  await scatto(page, 'passo-zaino-chiuso')
})

/* ══════════ 5. il «fino a» e il «se», col dito ══════════
   Scritte col dito, le file sono le soluzioni dei dati: che vincano lo dice `unita/passo-passo` */
await blocco('il «fino a» e il «se»', async () => {
  await dallIndirizzo('gradini-storti')
  controlla('nel «fino a» c\'è il 🔁 e non ancora il ❓',
            await page.locator('[data-carta="ripeti"]').count() === 1 && await page.locator('[data-carta="se"]').count() === 0)
  await page.locator('[data-carta="ripeti"]').click()
  controlla('la scelta della testa offre i numeri e il colore della mappa',
            await page.locator('[data-volte-scegli="3"]').count() === 1 &&
            await page.locator('[data-volte-scegli="rosso"]').count() === 1 &&
            await page.locator('[data-volte-scegli="blu"], [data-volte-scegli="casa"]').count() === 0)
  await scatto(page, 'passo-fino-scelta')
  await page.locator('[data-azione="cancella"]').click()
  const fino = CAMPAGNA.find(x => x.chiave === 'gradini-storti').soluzioni[0]
  await scrivi(fino)
  uguale('col dito si scrive la soluzione dei gradini storti, col «fino al rosso»',
         (await filaScritta(page)).join(' '), filaDi(fino).join(' '))

  await dallIndirizzo('segni')
  uguale('nel «se» c\'è anche il ❓', await page.locator('[data-carta="se"]').count(), 1)
  await page.locator('[data-carta="se"]').click()
  controlla('la scelta del ❓ offre solo i colori, tutti e tre',
            await page.locator('[data-volte-scegli="3"]').count() === 0 &&
            await page.locator('[data-volte-scegli="rosso"], [data-volte-scegli="blu"], [data-volte-scegli="giallo"]').count() === 3)
  await page.locator('[data-azione="cancella"]').click()
  const se = CAMPAGNA.find(x => x.chiave === 'segni').soluzioni[0]
  await scrivi(se)
  uguale('col dito si scrive la soluzione dei segni: le scatole, i colori e le frecce al loro posto',
         (await filaScritta(page)).join(' '), filaDi(se).join(' '))
  await scatto(page, 'passo-se')
})

/* ══════════ 6. il guerriero: il selettore a tre, la sua strada, la principessa ══════════
   Che la grata senza pulsante fermi la fila lo dice `unita/passo-passo-guerriero`; la tessera guasta a schermo è quella
   del cespuglio, qui sopra */
await blocco('il guerriero', async () => {
  const stelleFino = n => Object.fromEntries([...Array(n)].map((_, i) => [i, 3]))
  await allaMappaDiPasso({ settings: { eta: 8 }, campagne: { passo: { tappa: 3, stelle: stelleFino(3), cfg: { fila: FILA_ATTUALE } } } })
  await page.locator('[data-scegli="guerriero"]').click()
  controlla('il guerriero chiuso dice chi deve finire prima',
            /Il guerriero comincia quando il coniglio finisce/.test(await page.locator('[data-serve-guerriero]').innerText()))
  uguale('e la mappa resta al coniglio', await page.locator('[data-mappa]').getAttribute('data-protagonista'), 'coniglio')

  const aperto = CAMPAGNA.findIndex(t => t.chiave === 'tutto') + 1
  await allaMappaDiPasso({ settings: { eta: 8 }, campagne: { passo: { tappa: aperto, stelle: stelleFino(aperto), cfg: { fila: FILA_ATTUALE } } } })
  await page.locator('[data-scegli="guerriero"]').click()
  await page.waitForSelector('[data-mappa][data-protagonista="guerriero"] [data-tappa]', { timeout: 8000 })
  controlla('i tre protagonisti stanno nello schermo del telefono', await page.evaluate(() => {
    const b = document.querySelector('.pp-protagonisti').getBoundingClientRect()
    return b.right <= innerWidth && b.left >= 0
  }))
  const prima = STRADE.guerriero[0]
  uguale('il segnalino è il guerriero, sulla prima tappa', await page.locator('[data-segnalino]').getAttribute('data-animale'), 'guerriero')
  uguale('che è la tappa di adesso', await page.locator(`[data-tappa="${prima}"]`).getAttribute('data-stato'), 'ora')
  uguale('ci sono solo le sue', await page.locator('[data-mappa] [data-strada="coniglio"]').count(), 0)
  uguale('di sentieri senza fine non ne ha', await page.locator('[data-sentiero-di]').count(), 0)
  await scatto(page, 'passo-guerriero-mappa')
  await page.waitForSelector('[data-segnalino][data-in-viaggio="0"]', { timeout: 8000 })
  await parti(page, `[data-tappa="${prima}"]`)
  await page.waitForSelector('.pp-campo', { timeout: 5000 })
  await finestraCieca()
  await componi(risolvi(Livello.da(CAMPAGNA[prima])))
  await page.locator('[data-azione="via"]').click()
  await fineTappa()
  uguale('dalla principessa, con la corona', await stelle(), '4')
  controlla('il cartello ha la principessa', (await page.locator('[data-fine]').innerText()).includes('👸'))
  await scatto(page, 'passo-guerriero-vittoria')
  controlla('e ▶ porta avanti sulla sua strada', await page.locator('[data-azione="avanti"]').count() === 1)
})

/* una caduta: senza spada il nemico ferma la fila, e si torna alla partenza */
await blocco('la caduta del guerriero', async () => {
  await dallIndirizzo('la-spada')
  await componi(['su', 'destra', 'destra', 'destra', 'destra', 'destra', 'destra'])
  await page.locator('[data-azione="via"]').click()
  controlla('la fila si ferma sulla freccia colpevole', await arriva('[data-tessera="6"][data-guasto]', 10000))
  await scatto(page, 'passo-guerriero-caduto')
  controlla('e finita la caduta si torna alla partenza', await arriva('[data-azione="via"]', 8000))
  uguale('e la partita non è finita', await page.locator('[data-fine]').count(), 0)
})

/* le carte del guerriero: 🔁 fino a casa, e dentro i ❓ con le frecce */
await blocco('il corridoio del guerriero, col dito', async () => {
  await dallIndirizzo('corridoio-storto')
  await page.locator('[data-carta="ripeti"]').click()
  await page.locator('[data-volte-scegli="casa"]').click()
  await componi(['attacca'])
  uguale('⚔️ sta nella fila come una freccia', await page.locator('[data-tessera][data-mossa="attacca"]').count(), 1)
  await page.locator('[data-carta="se"]').click()
  uguale('il ❓ offre le quattro frecce',
         await page.locator('[data-volte-scegli="su"], [data-volte-scegli="giu"], [data-volte-scegli="sinistra"], [data-volte-scegli="destra"]').count(), 4)
  await scatto(page, 'passo-guerriero-se')
  await page.locator('[data-volte-scegli="destra"]').click()
  await componi(['destra'])
  await page.locator('.pp-scatola[data-tipo="se"] .pp-coda').last().click()
  await page.locator('[data-carta="se"]').click()
  await page.locator('[data-volte-scegli="giu"]').click()
  await componi(['giu'])
  await scatto(page, 'passo-guerriero-programma')
  uguale('col dito si scrive la soluzione del corridoio, scatole e ❓ al loro posto',
         (await filaScritta(page)).join(' '), filaDi(CAMPAGNA.find(t => t.chiave === 'corridoio-storto').soluzioni[0]).join(' '))
})

/* ══════════ 7. la fila trascinata col dito vero ══════════
   Il + di una scatola che c'è già, il posto acceso, una carta trascinata dentro e fuori, una scatola intera, una carta
   lasciata fuori dalla fila che torna indietro (docs/passo-passo/zaino.md) */
await blocco('la fila col dito', async () => {
  await dallIndirizzo('corridoio-storto')
  const cdp = await page.context().newCDPSession(page)
  const centro = async sel => { const r = await page.locator(sel).first().boundingBox(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } }
  const trascina = async (da, a, { aMeta } = {}) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [da] })
    await attendi(page, 40)
    for (let i = 1; i <= 6; i++) {
      const p = { x: da.x + (a.x - da.x) * i / 6, y: da.y + (a.y - da.y) * i / 6 }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [p] })
      await attendi(page, 30)
      if (i === 5 && aMeta) await aMeta()
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await attendi(page, 120)
  }
  const programma = () => page.evaluate(() => [...document.querySelectorAll('[data-tessera],[data-testa]')].map(e => e.dataset.mossa || 'testa'))
  const nellaScatola = i => page.locator(`[data-scatola="${i}"] [data-tessera]`).count()

  /* una scatola, e il suo + */
  await page.locator('[data-carta="ripeti"]').click()
  await page.locator('[data-volte-scegli="casa"]').click()
  uguale('la scatola nuova ha il suo +', await page.locator('[data-bocca]').count(), 1)
  controlla('acceso: la prossima carta entra lì', await page.locator('[data-bocca].pp-qui').count() === 1)
  controlla('e la scatola si accende con lui', await page.locator('[data-scatola="0"].pp-qui').count() === 1)
  await page.locator('[data-freccia="destra"]').click()
  uguale('la freccia è entrata', await nellaScatola(0), 1)
  /* fuori dalla scatola: il primo posto libero ha il suo + */
  await page.locator('[data-libero]').first().click()
  controlla('toccato il posto fuori, la scatola si spegne', await page.locator('[data-scatola="0"].pp-qui').count() === 0)
  controlla('e il posto si accende', await page.locator('[data-libero].pp-qui').count() === 1)
  await page.locator('[data-freccia="giu"]').click()
  uguale('la carta sta fuori', await nellaScatola(0), 1)
  await scatto(page, 'passo-fila-posti')
  /* tornare in una scatola che c'è già: il suo + */
  await page.locator('[data-bocca]').click()
  controlla('il + riporta dentro', await page.locator('[data-bocca].pp-qui').count() === 1)
  await page.locator('[data-freccia="su"]').click()
  uguale('e la carta nuova entra nella scatola di prima', await nellaScatola(0), 2)

  /* trascinare: fuori → dentro */
  let visto = {}
  await trascina(await centro('[data-mossa="giu"]'), await centro('[data-bocca]'), {
    aMeta: async () => {
      visto = await page.evaluate(() => {
        const p = document.querySelector('[data-pupazzo]')
        return { copia: p.children.length, data: p.querySelectorAll('[data-tessera]').length,
                 sbiadita: !!document.querySelector('[data-mossa="giu"].pp-presa'),
                 qui: !!document.querySelector('[data-bocca].pp-qui') }
      })
      await scatto(page, 'passo-fila-al-dito')
    },
  })
  controlla('al dito c\'è una copia, senza i suoi bersagli', visto.copia === 1 && visto.data === 0, JSON.stringify(visto))
  controlla('la carta vera è sbiadita, e il + dice dove cade', visto.sbiadita && visto.qui, JSON.stringify(visto))
  uguale('la carta è dentro la scatola', await nellaScatola(0), 3)
  uguale('e al dito non resta niente', await page.locator('[data-pupazzo] > *').count(), 0)
  /* dentro → fuori */
  await trascina(await centro('[data-mossa="destra"]'), await centro('[data-libero]'))
  uguale('trascinata sul posto libero esce', await nellaScatola(0), 2)
  uguale('ed è l\'ultima della fila', (await programma()).at(-1), 'destra')
  /* lasciata fuori dalla fila torna al suo posto */
  const prima = await programma()
  const su = await centro('[data-mossa="su"]')
  await trascina(su, { x: su.x, y: su.y - 300 })
  uguale('lasciata sulla mappa non cambia niente', JSON.stringify(await programma()), JSON.stringify(prima))
  /* una scatola intera, presa dalla testa */
  await trascina(await centro('[data-testa]'), await centro('[data-libero]'))
  uguale('la scatola va in fondo con quello che ha dentro', (await programma()).join(), 'destra,testa,su,giu')
  /* un tocco resta un tocco */
  await page.locator('[data-mossa="destra"]').click()
  uguale('toccare una carta sposta il cursore e non la carta', (await programma()).join(), 'destra,testa,su,giu')
  const t = await centro('[data-testa]')
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [t] })
  await attendi(page, 50)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await attendi(page, 150)
  uguale('toccare la testa riapre la scelta', await page.locator('[data-scelta-volte]').count(), 1)
})

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('passo passo, nel browser')
