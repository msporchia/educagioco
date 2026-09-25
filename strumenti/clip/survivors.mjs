/* Survivors: si scappa e si combatte a ondate, muovendosi col dito. Il
   controllo vero è un trascinamento — si preme sul campo e si tiene
   premuto, e l'eroe va verso dove punta il dito rispetto al centro
   (`viste/Campo.vue`, `verso(e)`: la direzione è `puntoDelDito - centro
   della tela`, non una posizione assoluta) — quindi la clip lo pilota
   con `page.mouse`, che genera gli stessi eventi `pointerdown` /
   `pointermove` che userebbe un dito, e MAI con coordinate cablate: il
   centro della tela si legge a runtime da `getBoundingClientRect`.

   LA PARTITA È GIÀ AVANTI PRIMA CHE IL BROWSER SI APRA. Le versioni
   precedenti di questa ricetta facevano giocare un pilota alla cieca
   *dentro* il browser per una ventina di secondi, sperando che
   bastassero a far salire un livello senza farsi ammazzare — e infatti
   no: un pilota che non vede dove sono i mostri (`window.__survivors`
   esiste solo in dev, e questa ricetta apre `dist/index.html`, il
   build) muore quasi sempre in una manciata di secondi, qualunque fosse
   la tappa, e la clip usciva diversa — a volte viva e piena, a volte
   ripartita da zero — a ogni giro. Il gioco però sa già portare avanti
   una partita fuori dallo schermo: `motore/partita.js` (`Partita`,
   `Regole`) gira uguale in Node e nel browser, e `motore/banco.js` ha
   un `Pilota` che *vede* tutto — mostri, gemme, oggetti — perché legge
   lo stato del motore invece dello schermo. All'IMPORT di questo file,
   in Node, prima ancora che Playwright apra una pagina, si gioca una
   partita vera sulla tappa «ghiacciaio» (`data-tappa` si legge
   dall'indice di questa chiave in `CAMPAGNA`, mai un numero scritto a
   mano) con un seme fisso (`caso(SEME)`, lo stesso generatore
   deterministico che usano i test): stessi mostri, stesse gemme, stesso
   risultato a ogni giro, un livello avanzato e un paio di potenziamenti
   già presi. Quella partita si congela con `scrivi()` (lo stesso
   formato di `motore/sosta.js` che il gioco scrive quando si esce a
   metà) e finisce dentro il profilo finto, in
   `campagne.survivors.sosta` — esattamente dove il gioco la cercherebbe
   se un bambino avesse premuto «indietro» a metà partita. Il browser
   non deve più giocare *prima* di registrare: deve solo **riprendere**.

   PERCHÉ IL PILOTA E NON UN TRASCINAMENTO A CASO. `Pilota` con
   `bravura: 1` ed `esattezza: 1` è il giocatore perfetto che
   `motore/banco.js` usa per misurare se una tappa si può vincere
   davvero (`gioca`, `misura`): vede i mostri, va a raccogliere le
   gemme, sceglie sempre la carta più forte e risponde sempre giusto.
   Fargli giocare settanta secondi di «ghiacciaio» (durata vera: 145s,
   quindi con largo margine dal traguardo — un salvataggio a partita
   *vinta* è vuoto: `scrivi()` torna `null`) è deterministico e
   affidabile in un modo che nessun trascinamento sul campo, giocato
   alla cieca dal browser, potrà mai essere.

   DURANTE LA REGISTRAZIONE SI GIOCA COL DITO PER DAVVERO, non con lo
   stesso pilota: qui la clip deve mostrare il tocco che muove l'eroe,
   che è la promessa del gioco. Il rischio non è azzerato — sono comunque
   otto secondi veri, e chi schiva è un cerchio che cammina a caso, non
   il pilota che vede tutto — ma è basso: riprendere una sosta pulisce
   sempre lo spazio intorno all'eroe (`SPAZIO` in `giochi/campagne.js`,
   la stessa regola per cui rientrare non trova mai un mostro già
   addosso). **Se muore lo stesso, la clip lo dice**: lancia un errore
   invece di far ripartire tutto in silenzio, così il riepilogo di
   `scatti.mjs` lo segna come intoppo e non nasconde un giro storto
   dietro una clip diversa dalle altre. `clip.coda` chiude la
   registrazione poco dopo che `durante` ha finito (bene o male) invece
   di tenere per il resto degli otto secondi un fotogramma fermo.

   RIPRENDERE VUOLE DUE TOCCHI, NON UNO. La mappa apre la sosta con
   «torno in campo da dove ero» (`button[data-azione="riprendi"]` in
   `viste/Mappa.vue`) — ma ogni ripresa nasce **in pausa**
   (`Gioco.vue`, `riprendiPartita`: `metti({ auto: true })`, la stessa
   regola di `giochi/pausa.js`: non si riprende mai da soli), quindi
   dietro compare il velo con lo stesso identico
   `button[data-azione="riprendi"]` («tocca per continuare»,
   `VeloPausa.vue`) — cieco per 320 ms (`CIECA`) prima di rispondere. I
   `passi` toccano quel selettore due volte, con un'attesa in mezzo più
   lunga della finestra cieca.

   PERCHÉ NON C'È MAI UNA DOMANDA RISPOSTA MALE. Le carte di
   potenziamento (`.sv-carte`) portano anch'esse `quiz/Domanda.vue`, con
   la stessa attesa lunga di ogni domanda sbagliata (vedi `dungeon.mjs`
   per come la si aggirerebbe col `page.clock`). Qui però non serve
   aggirare niente: come nota `test/integrazione/survivors.test.mjs`,
   sbagliare una carta «non toglie niente» — niente cuori, niente
   game over, solo un potenziamento in meno. Ma nel filmato uno sbaglio
   vuol dire quattro secondi fermi sulla spiegazione, quindi si tocca
   sempre il tasto che `quiz/Domanda.vue` segna con `data-giusta`
   (invisibile a schermo).

   Dipende da: la forma di `motore/sosta.js` (`scrivi`/`VERSIONE` — se
   cambia, questa ricetta scrive un salvataggio che il gioco non
   riconosce più e la ripresa parte da zero, non si pianta), la chiave
   `ghiacciaio` dentro `CAMPAGNA`, `button[data-azione="riprendi"]` (due
   volte: mappa e velo pausa), `.sv-campo`, `.sv-carte`/`.sv-carta`,
   `.sv-fine` e `.qz-tasto[data-giusta]`. Se uno di questi cambia forma
   la parte in Node lancia un errore leggibile all'import (non un
   crash muto), e la parte nel browser smette di muovere l'eroe o di
   pagare le carte senza lanciare eccezioni — tranne la morte durante la
   registrazione, che è l'unico caso in cui questa ricetta vuole essere
   vista fallire. */
import { Partita, Regole } from '../../src/giochi/survivors/motore/partita.js'
import { Pilota, caso } from '../../src/giochi/survivors/motore/banco.js'
import { CAMPAGNA } from '../../src/giochi/survivors/dati/campagna.js'
import { scrivi } from '../../src/giochi/survivors/motore/sosta.js'

const CHIAVE_TAPPA = 'ghiacciaio'      // scalino «tutti insieme»: neve, mostri di ogni specie
const INDICE_TAPPA = CAMPAGNA.findIndex(t => t.chiave === CHIAVE_TAPPA)
if (INDICE_TAPPA < 0)
  throw new Error(`strumenti/clip/survivors.mjs: la tappa "${CHIAVE_TAPPA}" non esiste più`)
const TAPPA = CAMPAGNA[INDICE_TAPPA]

const SEME = 20260925                  // fisso: stessa partita, stesso salvataggio, ogni giro
const SECONDI_DI_PARTITA = 70          // meno della durata vera (145s): niente traguardo, niente scrivi()==null

/* Gioca una partita vera in Node, con lo stesso motore che gira nel
   browser, e la ferma a un tempo di gioco preciso invece che a un esito
   (vinta/persa) — uno `scrivi()` a partita finita torna `null`. */
function precomputaLaSosta() {
  const rnd = caso(SEME)
  const partita = new Partita(new Regole(TAPPA), { rnd })
  const pilota = new Pilota({ rnd, bravura: 1, esattezza: 1 })
  const dt = 1 / 30
  const passiMax = Math.ceil(SECONDI_DI_PARTITA / dt) + 200   // margine per le pause a offerta

  for (let i = 0; i < passiMax && partita.tempo < SECONDI_DI_PARTITA && !partita.finita; i++) {
    if (partita.inPausa) { pilota.rispondi(partita); continue }
    pilota.guida(partita, dt)
    partita.avanza(dt)
    if (partita.eventi.length) partita.svuotaEventi()
  }
  /* non si lascia un'offerta a metà: la clip deve riprendere dentro il
     campo, non davanti a tre carte già scadute nel salvataggio */
  while (partita.inPausa && !partita.finita) pilota.rispondi(partita)

  if (partita.finita)
    throw new Error(`strumenti/clip/survivors.mjs: il pilota è morto o ha vinto prima di ` +
      `${SECONDI_DI_PARTITA}s su "${CHIAVE_TAPPA}" (esito: ${partita.esito}) — abbassa SECONDI_DI_PARTITA`)

  return scrivi(partita, INDICE_TAPPA)
}

const SOSTA = precomputaLaSosta()

/* Se in questo momento c'è un'offerta di carte, la si prende e si paga
   con la domanda giusta. */
async function rispondiSeCEUnaCarta (page) {
  if (!(await page.locator('.sv-carte').count())) return false
  await page.locator('.sv-carta').first().click({ timeout: 1500 }).catch(() => {})
  const tasto = await page.waitForSelector('.qz-tasto', { timeout: 3000 }).catch(() => null)
  if (tasto) {
    await page.waitForTimeout(900)   // la finestra cieca, e un momento per leggerla
    await page.locator('.qz-tasto[data-giusta]').click({ timeout: 1500 }).catch(() => {})
    await page.waitForTimeout(900)   // «Giusto!» si legge un momento
  }
  return true
}

/* Schiva e cammina col dito sempre giù per `ms` millisecondi veri.
   Angolo e raggio camminano a caso passo per passo — mai lo stesso giro
   due volte, mai un ritorno al centro dello schermo (che manderebbe un
   istante di dito fermo: la direzione è `puntoDelDito - centro`, vedi
   sopra). Se il cartello di fine compare, lancia: vedi il commento in
   testa al file sul perché una morte qui non si nasconde. */
async function schiva (page, ms) {
  const box = await page.locator('.sv-campo').boundingBox()
  if (!box) return
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  const corto = Math.min(box.width, box.height)
  const punto = a => [cx + corto * 0.3 * Math.cos(a), cy + corto * 0.3 * Math.sin(a)]

  let angolo = Math.random() * Math.PI * 2
  await page.mouse.move(...punto(angolo))
  await page.mouse.down()

  const fine = Date.now() + ms
  while (Date.now() < fine) {
    if (await page.locator('.sv-fine').count()) {
      await page.mouse.up().catch(() => {})
      throw new Error('l\'eroe è morto durante la registrazione')
    }
    if (await page.locator('.sv-carte').count()) {
      await page.mouse.up()
      await rispondiSeCEUnaCarta(page)
      if (await page.locator('.sv-fine').count())
        throw new Error('l\'eroe è morto pagando una carta durante la registrazione')
      await page.mouse.move(...punto(angolo))
      await page.mouse.down()
      continue
    }
    angolo += (Math.random() - 0.28) * Math.PI * 0.85
    const raggio = corto * (0.20 + Math.random() * 0.20)
    await page.mouse.move(cx + raggio * Math.cos(angolo), cy + raggio * Math.sin(angolo),
      { steps: 6 })
    await page.waitForTimeout(340 + Math.random() * 160)
  }
  await page.mouse.up()
}

export default {
  file: 'clip-survivors', dove: 'survivors', attesa: '.sv-mappa',
  /* il profilo finto porta già la sosta precalcolata: la mappa la trova
     e offre «torno in campo da dove ero» */
  profilo: p => { p.campagne.survivors.sosta = SOSTA; return p },
  passi: [
    ['button[data-azione="riprendi"]', 700],   // la mappa: si rientra nella tappa lasciata a metà
    ['button[data-azione="riprendi"]', 500],   // il velo della pausa, che ogni ripresa apre da sé
  ],
  clip: {
    secondi: 8,
    coda: 500,     // chiude poco dopo che `durante` finisce, bene o male
    async durante (page) {
      await schiva(page, 7000)
    },
  },
}
