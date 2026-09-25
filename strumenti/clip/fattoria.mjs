/* La fattoria: un orto grande — dodici campi a stadi diversi, colture
   diverse — i recinti e il mulino al lavoro sotto, e tre campi maturi che
   si raccolgono uno dopo l'altro. È il posto dove finiscono le monete, e
   quello che ha da mostrare è che **è viva**: roba che cresce, roba che
   si raccoglie, animali che lavorano. Un orto di due campi (la prima
   versione) era quasi tutto prato.

   La fattoria non si scrive a mano: la si gioca col motore vero
   (`motore/fattoria.js`) e con le sue porte (`posa`, `seminaCampo`,
   `avvia`), a un livello dove le colture sono tante (`LIVELLO`). Tutto
   sta **dentro la terra di partenza** (`PRIMA`…`ULTIMA`): lì la
   telecamera si apre sul centro senza toccare il bordo del mondo, e il
   punto da toccare si ricava esatto. `motore/tipo.js` farebbe una
   fattoria più piena, ma allarga la terra e la telecamera finisce
   fermata dal bordo: il conto di `puntoSchermo` non varrebbe più.

   Il punto sullo schermo **non è mai un pixel scritto a mano**: è lo
   stesso conto di `vaiACasa`/`centroDelleTerre` in `Gioco.vue` e di
   `puntoDellaCella` in `scena/tela.js`, fatto con le costanti vere di
   `dati/mondo.js` (`T`, `SCALA_INIZIALE`, `CELLE`, `PRIMA`, `ULTIMA`) e il
   riquadro di `.fa-tela` misurato a runtime. Si tocca il centro di un
   campo 2×2 (`piedeDi`), non il suo angolo. Se Gioco.vue cambia come
   inquadra, il tocco manca il campo e la clip resta su un prato senza
   fogli: è lì che si guarda.

   Il resto dipende da `viste/Campo.vue`: `.fa-foglio` quando si apre e
   `.fa-bot.forte` col testo «Raccogli».

   Watson sta in fondo, sotto i recinti, e non in mezzo ai campi: cammina
   da solo, e un cane sopra il campo si prende il tocco e apre la sua
   scheda al posto del raccolto (è successo). Si compra dopo
   `reclamaTutto()`: il bobtail va reclamato, non basta il livello
   (`bestiaAperta`), se no `compraBestia` torna `non-sbloccato` in
   silenzio. */
import { Fattoria } from '../../src/giochi/fattoria/motore/fattoria.js'
import { PRIMA, ULTIMA, CELLE, T, SCALA_INIZIALE } from '../../src/giochi/fattoria/dati/mondo.js'
import { COLTURE, PER_COLTURA, PER_RICETTA, MINUTO } from '../../src/giochi/fattoria/dati/coltivazioni.js'
import { PER_ID, piedeDi } from '../../src/giochi/fattoria/dati/catalogo.js'
import { sogliaDi } from '../../src/giochi/fattoria/dati/livelli.js'

const ADESSO = Date.now()
const LIVELLO = 30

/* L'orto: quattro colonne per tre file, con una cella d'erba in mezzo.
   Ogni campo ha il suo `stadio`, quanto è cresciuto, da 0 (appena
   seminato) a 1 (pronto): i tre della prima fila sono quelli che la clip
   raccoglie. Le colture non si scrivono: sono quelle che il motore dà per
   aperte a `LIVELLO`, in giro — una lista a mano si rompe il giorno che
   una coltura cambia livello (è successo coi pomodori). */
const STADI = [1, 1, 1, 0.6, 0.8, 0.3, 0.5, 0.1, 0.7, 0.4, 0.2, 0.9]

/* mettere in moto una macchina con quello che le serve: la roba che
   chiede la si mette nel granaio prima, come l'avrebbe raccolta chi gioca */
function inMoto (f, cosa, ricetta, fatto) {
  for (const m of f.cheMancaPer(ricetta)?.manca || []) f.metti(m.prodotto, m.quanti)
  return f.avvia(cosa, ricetta, ADESSO - PER_RICETTA[ricetta].minuti * fatto * MINUTO)
}

/* quello che il motore ha rifiutato mentre si costruiva: una cosa che
   non si posa (un livello spostato, un posto occupato) o una bestia che
   non si compra. La clip lo dice come intoppo invece di uscire con un
   buco nel prato che nessuno nota. */
const GUASTI = []
const bada = (che, esito) => { if (!esito?.ok) GUASTI.push(`${che}: ${esito?.motivo}`); return esito }

function costruisci () {
  const f = new Fattoria()
  const posa = (id, x, y) => bada(id, f.posa(id, x, y))
  f.speso = sogliaDi(LIVELLO)
  f.reclamaTutto()

  /* l'angolo in alto a sinistra di quello che la telecamera vede: il
     centro delle terre meno sei celle, che è metà di uno schermo largo
     390 — e comunque dentro la terra di partenza */
  const x0 = (PRIMA + ULTIMA + 1) / 2 * CELLE - 6
  const y0 = PRIMA * CELLE + 1
  const [lw, lh] = piedeDi(PER_ID.orto)
  const aperte = COLTURE.map(c => c.id).filter(id => f.colturaAperta(id))
  if (!aperte.length) GUASTI.push(`nessuna coltura aperta al livello ${LIVELLO}`)
  const campi = STADI.map((stadio, i) => {
    const coltura = aperte[i % aperte.length]
    const x = x0 + (i % 4) * (lw + 1), y = y0 + Math.floor(i / 4) * (lh + 1)
    const cosa = posa('orto', x, y)?.cosa
    const minuti = PER_COLTURA[coltura].minuti
    bada(coltura, f.seminaCampo(cosa, coltura, ADESSO - (stadio >= 1 ? minuti + 1 : minuti * stadio) * MINUTO))
    return { x: x + lw / 2, y: y + lh / 2, pronto: stadio >= 1 }
  })

  /* sotto l'orto, i recinti e le macchine, già al lavoro. In mezzo ai
     due recinti resta un prato: è dove nasce la bambina — due celle sotto
     il centro delle terre (`Gioco.vue`, `casa`) — e se lì c'è una cosa il
     gioco la sposta alla cella libera più vicina, cioè fra i recinti,
     dove non si vede. */
  const y1 = y0 + 3 * (lh + 1)
  /* prima dove si tiene la roba, poi chi la consuma: senza silo e
     fienile la roba che le macchine chiedono non ha dove stare */
  posa('fienile', x0 + 4, y1 + 4)
  posa('silo', x0 + 10, y1 + 4)          // il raccolto
  posa('silo_bianco', x0 + 10, y1 + 5)   // i mangimi: becchime, foraggio
  bada('pollaio in moto', inMoto(f, posa('pollaio', x0, y1)?.cosa, 'uova', 0.5))
  bada('ovile in moto', inMoto(f, posa('ovile', x0 + 8, y1)?.cosa, 'lana', 0.3))
  posa('covone', x0 + 5, y1)
  bada('mulino in moto', inMoto(f, posa('mulino', x0, y1 + 4)?.cosa, 'mangime', 0.4))
  for (const [id, dx] of [['fiori1', 0], ['farfalle', 2], ['fiori2', 9], ['pulcino', 11]])
    posa(id, x0 + dx, y1 + 7)

  bada('Watson', f.compraBestia('cane-bobtail', 0, 'Watson', { x: x0 + 6, y: y1 + 6 }))
  return { stato: f.serializza(), pronti: campi.filter(c => c.pronto) }
}

const FATTORIA = costruisci()

/* lo stesso conto di `Tela.puntoDellaCella` con la telecamera di
   `vaiACasa`: centro delle terre di partenza al centro della tela */
function puntoSchermo (box, cx, cy) {
  const cellaPx = T * SCALA_INIZIALE
  const centro = (PRIMA + ULTIMA + 1) / 2 * CELLE
  return {
    x: box.x + box.width / 2 + (cx - centro) * cellaPx,
    y: box.y + box.height / 2 + (cy - centro) * cellaPx,
  }
}

export default {
  file: 'clip-fattoria', dove: 'fattoria', attesa: '.fa-tela',
  /* I contatori della fattoria oltre l'ultima soglia dei suoi traguardi
     (`gioco.js`): il profilo finto non ha mai raccolto niente, e il
     terzo raccolto della clip farebbe scattare «Buon raccolto», un velo
     che copre la scena fino a un tocco. */
  profilo: p => {
    p.aspetto = 'bambina'                   // chi cammina: `PERSONE` di `dati/atlante.js`
    Object.assign(p.totals, { fattoriaTerre: 50, fattoriaSgomberi: 80, fattoriaPosati: 200,
                              fattoriaRaccolti: 60, fattoriaOrdini: 50 })
    p.campagne = { ...p.campagne,
      fattoria: { tappa: 0, libera: false, stelle: {}, cfg: { stato: FATTORIA.stato } } }
    return p
  },
  passi: [['.fa-tela', 900]],
  clip: {
    secondi: 8,
    async durante (page) {
      if (GUASTI.length) throw new Error('la fattoria della clip: ' + GUASTI.join(', '))
      const box = await page.locator('.fa-tela').boundingBox()
      if (!box) throw new Error('la tela della fattoria non c\'è')
      await page.waitForTimeout(700)                    // l'orto si vede, si guarda
      for (const campo of FATTORIA.pronti) {
        const { x, y } = puntoSchermo(box, campo.x, campo.y)
        await page.mouse.click(x, y)
        await page.waitForSelector('.fa-foglio', { timeout: 2000 }).catch(() => {})
        await page.waitForTimeout(650)                  // si legge «È pronto!»
        await page.locator('.fa-bot.forte', { hasText: 'Raccogli' })
          .click({ timeout: 2000 }).catch(() => {})
        await page.waitForTimeout(900)                  // il campo si svuota, «+1 nel silo!»
      }
    },
  },
}
