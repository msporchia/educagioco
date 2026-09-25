/* Il sotterraneo: si cammina al buio toccando il campo, e il prezzo di
   ogni cosa che vale è rispondere. Prima questa clip mostrava una porta;
   e una porta resta chiusa gioco docile — quello che manca è vedere un
   nemico vero: ti viene addosso, prende colpi finché non cade, e ogni
   colpo è una domanda.

   NIENTE NUMERI MISURATI A MANO (come `passo.mjs` col risolutore, o
   `fattoria.mjs` col motore): la ricerca gira **qui**, in Node, quando
   `scatti.mjs` importa questo file — non a mano fuori dal repo. Si
   prova un seme dopo l'altro con `new Corsa(tappaDi(0), …)`, la stessa
   classe che gioca il gioco vero, e `viaVerso` (lo stesso pathfinder di
   `vaiVerso`) per sapere se ci si arriva davvero:

     1. si cerca una porta raggiungibile e già illuminata dalla stanza
        di partenza (come nella versione precedente di questa clip);
        se non c'è, va bene lo stesso — un mostro può stare a portata
        senza che nessuna porta sia in mezzo;
     2. **aprendola** (si simula la stessa `interagisci` + `rispondi(true)`
        che userebbe un giocatore) si cerca un mostro raggiungibile da lì.

   Il primo seme che soddisfa questo — porta compresa solo se serve — è
   quello buono: deterministico, quindi la ricerca dà sempre la stessa
   risposta finché il gioco resta lo stesso, e ne trova una diversa da
   sola se `motore/livello.js` cambia la generazione dei piani. Restano
   solo tre numeri derivati da qui: `PIXEL_PER_CELLA` da `T` e
   `SCALA_INIZIALE` di `dati/mondo.js`, e i due scarti in celle che la
   ricerca stessa calcola (dove sta l'ultima cella libera prima del
   mostro, e dove sta il mostro da lì).

   IL DITO, NON LE COORDINATE FISSE. Ogni tocco riparte da
   `data-eroe-schermo` letto un attimo prima: la telecamera segue
   l'eroe, quindi lo schermo si muove sotto ai piedi da un tocco
   all'altro, e uno scarto in celle vale lo stesso scarto in pixel
   (`× PIXEL_PER_CELLA`) indipendentemente da dove sta la telecamera in
   quel momento — finché nessuno pizzica per zoomare, e qui non si
   pizzica mai. Il primo tocco cammina fino a un passo dal mostro (una
   cella non ancora illuminata non si può mirare: ci si limita a
   camminarci); il secondo, da lì, lo mira davvero e apre lo scontro.

   UNA DOMANDA PER COLPO. Come `dungeon.mjs`: `Domanda.vue` non si
   rimonta da un colpo all'altro, quindi una domanda è «nuova» quando il
   suo tasto giusto (`data-giusta`) non ha ancora nessuno dei tre colori
   (`giusta`/`sbagliata`/`spenta`). Si aspetta che sia nuova, si legge
   un momento, si preme quella giusta; si ripete finché ne compaiono di
   nuove o finisce il tempo — è così che si vede la vita del mostro
   scendere colpo per colpo, e che cade se il conto lo permette.

   SE QUALCOSA NON TORNA, LA CLIP LO DICE. Niente ripieghi silenziosi:
   se la ricerca non trova nessun seme entro il tetto, o se dopo i tocchi
   non parte nessuno scontro, `durante` lancia un errore — `registra()`
   in `scatti.mjs` lo stampa come «(la partita: …)» nella riga di
   `npm run scatti`.

   Dipende da: `.sot-tappa[data-tappa="0"]`, `.sot-tela` (e
   `data-eroe-schermo`), `.sot-domanda`, `.qz-tasto[data-giusta]` con le
   sue tre classi di colore. */
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { tappaDi } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { viaVerso } from '../../src/motore/passi.js'
import { T, SCALA_INIZIALE, PASSO_EROE } from '../../src/giochi/sotterraneo/dati/mondo.js'

const PIXEL_PER_CELLA = T * SCALA_INIZIALE
const LETTURA = 1000          // oltre i 320ms di finestra cieca di Domanda.vue
const TETTO_SEMI = 8000
const DISTANZA_PORTA_MASSIMA = 6
const DISTANZA_MOSTRO_MASSIMA = 7

/* ── la ricerca, una volta sola, quando questo file viene importato ──
   Il primo seme in cui un mostro sta a portata dalla stanza di
   partenza — direttamente, o aprendo l'unica porta che ci sta in
   mezzo. Ritorna gli scarti in celle dei due tocchi che servono:
   avvicinarsi (fino alla cella libera più vicina al mostro) e poi
   mirarlo. */
function cercaSemeConMostro () {
  const tappa = tappaDi(0)
  for (let seme = 1; seme <= TETTO_SEMI; seme++) {
    const c = new Corsa(tappa, { seme, eroe: 'cavaliere' })
    const da0 = { x: Math.floor(c.eroe.x), y: Math.floor(c.eroe.y) }

    /* le basi da cui provare a raggiungere un mostro: la partenza da
       sola, e la partenza dopo aver aperto ciascuna porta che si vede e
       si raggiunge subito (una porta capita **solo se serve**: se il
       mostro si vede già da qui, la lista ha un solo elemento) */
    const basi = [{ da: da0, portaDelta: null }]
    for (const r of c.livello.robe) {
      if (r.che !== 'porta') continue
      if (!c.luce.has(r.y * c.livello.largo + r.x)) continue
      const dx = r.x + 0.5 - da0.x, dy = r.y + 0.5 - da0.y
      if (Math.hypot(dx, dy) > DISTANZA_PORTA_MASSIMA) continue
      const via = viaVerso(c.buona(), r, da0, { sopra: false })
      if (!via || !via.strada) continue
      /* la si apre per finta, con le stesse regole del gioco vero
         (`rispostaPorta` apre tutto il gruppo, non solo il battente) */
      const gruppo = c.livello.robe.filter(x => x.che === 'porta' && !x.aperta &&
        (r.gruppo != null ? x.gruppo === r.gruppo : x === r))
      for (const x of gruppo) { x.aperta = true; x.presa = true }
      basi.push({ da: via.dove, portaDelta: { dx, dy } })
    }

    for (const base of basi) {
      for (const m of c.livello.robe) {
        if (m.che !== 'mostro' || m.morto) continue
        const dx = m.x + 0.5 - base.da.x, dy = m.y + 0.5 - base.da.y
        if (Math.hypot(dx, dy) > DISTANZA_MOSTRO_MASSIMA) continue
        /* `sopra: false`: a un mostro ci si ferma accanto, come nel
           gioco vero (non è nella lista `sopra()` di `motore/corsa.js`) */
        const via = viaVerso(c.buona(), m, base.da, { sopra: false })
        if (!via || !via.strada) continue
        return {
          seme,
          portaDelta: base.portaDelta,
          avvicinaDelta: { dx: via.dove.x + 0.5 - base.da.x, dy: via.dove.y + 0.5 - base.da.y },
          passiAvvicina: via.strada.length,
          mirinoDelta: { dx: m.x + 0.5 - (via.dove.x + 0.5), dy: m.y + 0.5 - (via.dove.y + 0.5) },
        }
      }
    }
  }
  return null
}

const TROVATO = cercaSemeConMostro()

export default {
  file: 'clip-sotterraneo', dove: 'sotterraneo', attesa: '.sot-tappe',
  profilo: p => {
    p.campagne = { ...p.campagne,
      sotterraneo: { tappa: 3, libera: false, stelle: {}, cfg: { eroe: 'cavaliere' } } }
    return p
  },
  passi: [
    /* il seme si scrive nell'indirizzo **prima** di toccare la tappa:
       `avvia()` lo legge in quell'istante, come in `domanda.test.mjs` */
    async page => {
      if (!TROVATO) return
      await page.evaluate(seme => { location.hash = 'seme=' + seme }, TROVATO.seme)
    },
    ['.sot-tappa[data-tappa="0"]', 900],
  ],
  clip: {
    secondi: 10,
    coda: 2200,             // resta un momento sul mostro caduto, prima di chiudere
    async durante (page) {
      if (!TROVATO)
        throw new Error(`nessun seme con un mostro a portata entro ${TETTO_SEMI} tentativi`)

      const tela = page.locator('.sot-tela')
      const box = await tela.boundingBox()
      if (!box) throw new Error('la tela del sotterraneo non c\'è')
      const cdp = await page.context().newCDPSession(page)
      async function tocca (x, y) {
        const punti = [{ x, y }]
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: punti }).catch(() => {})
        await page.waitForTimeout(60)
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }).catch(() => {})
      }
      async function schermoEroe () {
        const s = await tela.getAttribute('data-eroe-schermo').catch(() => null)
        if (!s) return null
        const [x, y] = s.split(',').map(Number)
        return { x, y }
      }
      async function toccaVerso ({ dx, dy }) {
        const s = await schermoEroe()
        if (!s) return
        await tocca(box.x + s.x + dx * PIXEL_PER_CELLA, box.y + s.y + dy * PIXEL_PER_CELLA)
      }
      async function rispondiFinche (fine) {
        while (Date.now() < fine) {
          /* un tetto corto per il singolo tentativo: appena il mostro
             cade il foglio si chiude e non arriva più nessuna domanda
             nuova, e aspettare il tetto intero (`fine`) per scoprirlo
             vorrebbe dire una clip che sta ferma sui titoli di coda */
          const nuova = await page.waitForFunction(() =>
            document.querySelector('.qz-tasto[data-giusta]') &&
            !document.querySelector('.qz-tasto.giusta, .qz-tasto.sbagliata, .qz-tasto.spenta'),
            null, { timeout: Math.min(800, Math.max(100, fine - Date.now())) }).then(() => true, () => false)
          if (nuova) {
            await page.waitForTimeout(LETTURA)
            await page.locator('.qz-tasto[data-giusta]').click({ timeout: 1000 }).catch(() => {})
            continue
          }
          if (await page.locator('.sot-domanda').count() === 0) return   // il mostro è caduto
        }
      }

      /* ── se una porta è in mezzo, si apre prima di tutto ── */
      if (TROVATO.portaDelta) {
        await toccaVerso(TROVATO.portaDelta)
        const domandaPorta = await page.waitForSelector('.sot-domanda', { timeout: 4000 }).catch(() => null)
        if (!domandaPorta)
          throw new Error(`toccata la porta del seme ${TROVATO.seme}, ma nessuna domanda è comparsa`)
        await page.waitForTimeout(LETTURA)
        await page.locator('.qz-tasto[data-giusta]').click({ timeout: 2000 })
        await page.waitForTimeout(1200)               // «la stanza si apre», e si legge
      }

      /* ── ci si avvicina (una cella non ancora illuminata non si mira:
         qui si cammina e basta), poi si mira il mostro da vicino ── */
      await toccaVerso(TROVATO.avvicinaDelta)
      await page.waitForTimeout(400 + (TROVATO.passiAvvicina / PASSO_EROE) * 1000)
      await toccaVerso(TROVATO.mirinoDelta)

      const scontro = await page.waitForSelector('.sot-domanda', { timeout: 4000 }).catch(() => null)
      if (!scontro)
        throw new Error(`avvicinato al mostro del seme ${TROVATO.seme}, ma lo scontro non è partito`)

      /* una domanda per colpo, finché il mostro non cade o il tempo non
         finisce: il resto del budget della clip, meno un margine per la
         `coda` che tiene inquadrato il mostro caduto */
      await rispondiFinche(Date.now() + 7000)
    },
  },
}
