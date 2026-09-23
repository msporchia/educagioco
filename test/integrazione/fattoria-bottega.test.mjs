/* ═══════════════════════════════════════════════════════════════════
   UNA BOTTEGA DEL PAESE, COL DITO

   Sul modello di `integrazione/albero.test.mjs`: fattoria seminata col
   motore vero, dito vero (`Input.dispatchTouchEvent`) a cercare la
   pasticceria a spirale dal centro, stato vero riletto dal profilo.

   La pasticceria nasce con **due banconi**, seminati a mano in
   `f.botteghe` con la forma che `motore/botteghe.js` documenta in
   testa — niente `Math.random`, perché il test deve sapere già prima
   di aprire il foglio chi chiede cosa. Il primo cliente vuole delle
   uova, che sono già in granaio (pronto da consegnare); il secondo ne
   vuole del burro, che non c'è (il tasto 🌳 apre l'albero). Il premio
   e i minuti d'attesa si leggono da `premioInBottega`/`minutiPer`, non
   si scrivono a mano: sono gli stessi numeri che sceglie il motore, e
   possono cambiare.
   `node test/esegui.mjs fattoria-bottega`
   tempo: 90
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, leggiProfilo, scatto, attendi }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { Fattoria, borsaInfinita } from '../../src/giochi/fattoria/motore/fattoria.js'
import { sogliaDi } from '../../src/giochi/fattoria/dati/livelli.js'
import { CELLE, PRIMA, ULTIMA } from '../../src/giochi/fattoria/dati/mondo.js'
import { premioInBottega } from '../../src/giochi/fattoria/dati/botteghe.js'
import { minutiPer } from '../../src/giochi/fattoria/dati/mercato.js'
import { famaDi } from '../../src/giochi/fattoria/motore/botteghe.js'
import { TRAGUARDI } from '../../src/data/traguardi.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

/* ---------- la fattoria seminata ---------- */
const f = new Fattoria({ borsa: borsaInfinita() })
f.speso = sogliaDi(25)
f.reclamaTutto()
const centro = ((PRIMA + ULTIMA + 1) / 2) * CELLE
const posa = id => {
  for (let r = 0; r <= CELLE * 2; r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue
        const x = Math.round(centro + dx), y = Math.round(centro + dy)
        if (f.posa(id, x, y).ok) return { x, y }
      }
  return null
}
/* la pasticceria al centro: è quella che si tocca col dito */
controlla('la pasticceria si posa', !!posa('pasticceria'))
posa('silo_bianco')   // le uova, che sono roba della stalla
posa('dispensa')      // il burro, che è roba di bottega
f.metti('uova', 3)    // ce l'ha già: il primo cliente si può consegnare

const clienteUova = { id: 1, chi: 'pasticcera', chiede: { uova: 3 },
                      xp: premioInBottega('uova', 3), minuti: minutiPer({ uova: 3 }), nato: 0 }
const clienteBurro = { id: 2, chi: 'maestra', chiede: { burro: 2 },
                       xp: premioInBottega('burro', 2), minuti: minutiPer({ burro: 2 }), nato: 0 }
f.botteghe = { pasticceria: { consegne: 0, prossimo: 3, banconi: [clienteUova, clienteBurro] } }
uguale('la fama parte da zero cuori', famaDi(f.botteghe.pasticceria).cuori, 0)

/* I traguardi (badge) sono un sistema trasversale a tutta l'app: una
   consegna alza `totals.fattoriaOrdini`, e qualunque `segna()` fa
   ricontrollare TUTTI i traguardi — anche quelli di un'altra materia
   che il livello appena guadagnato in fattoria fa scattare per conto
   suo, con delle monete in premio (`PREMI` in `data/traguardi.js`).
   È giusto che succeda in partita, ma qui contaminerebbe il conto
   delle monete che si vuole isolare: si segnano già presi a un grado
   che nessuno stato di questo test può più superare, così il sistema
   dei traguardi non ha niente da dare. */
const badge = {}
for (const t of TRAGUARDI) badge[t.id] = { g: t.soglie.length, t: 0 }

const vecchio = await leggiProfilo(page)
await semina(page, {
  ...(vecchio || {}),
  coins: 3000,
  badgeInit: 1,
  badge,
  settings: { ...((vecchio || {}).settings || {}), sperimentali: true },
  campagne: { ...((vecchio || {}).campagne || {}),
              fattoria: { tappa: 0, libera: false, stelle: {},
                          cfg: { stato: f.serializza() } } },
})
await page.locator('.carta.gioco[data-gioco="fattoria"]').click()
await page.waitForSelector('.fa-tela', { timeout: 5000 })
await attendi(page, 700)

/* ---------- il dito, e la ricerca della pasticceria ---------- */
const cdp = await page.context().newCDPSession(page)
async function dito(x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await attendi(page, 260)
}
async function chiudi() {
  if (await page.locator('.fa-velo').count()) {
    await page.locator('.fa-velo').click({ position: { x: 5, y: 5 } })
    await attendi(page, 200)
  }
}
const titolo = () => page.evaluate(
  () => ((document.querySelector('.fa-foglio h2') || {}).innerText || '').trim())

const dalCentro = tela => {
  const cx = tela.x + tela.width / 2, cy = tela.y + tela.height / 2
  const punti = []
  for (let y = tela.y + 16; y < tela.y + tela.height - 16; y += 20)
    for (let x = tela.x + 16; x < tela.x + tela.width - 16; x += 24)
      punti.push({ x: Math.round(x), y: Math.round(y), d: (x - cx) ** 2 + (y - cy) ** 2 })
  return punti.sort((a, b) => a.d - b.d)
}
async function cercaLaPasticceria() {
  const tela = await page.locator('.fa-tela').boundingBox()
  for (const p of dalCentro(tela)) {
    await dito(p.x, p.y)
    if ((await titolo()) === 'Pasticceria') return p
    await chiudi()
  }
  return null
}

const dovEra = await cercaLaPasticceria()
const trovata = !!dovEra
controlla('col dito si apre la pasticceria', trovata)

if (trovata) {
  await scatto(page, 'bottega-aperta')
  uguale('è la bottega giusta', await page.locator('[data-bottega-id]').getAttribute('data-bottega-id'),
         'pasticceria')
  uguale('due clienti al bancone', await page.locator('[data-cliente]').count(), 2)

  const bancone1 = page.locator('[data-cliente="1"]')
  const bancone2 = page.locator('[data-cliente="2"]')
  uguale('il primo è pronto: le uova ci sono già',
         await bancone1.locator('[data-azione="consegna"]').isDisabled(), false)
  uguale('il secondo aspetta: manca il burro',
         await bancone2.locator('[data-azione="consegna"]').isDisabled(), true)
  uguale('e ha il tasto per andare a produrlo',
         await bancone2.locator('[data-albero-apri="burro"]').count(), 1)

  /* ---------- 1. consegnare: la merce esce, l'esperienza sale, il cuore si accende ---------- */
  const primaDiConsegnare = await leggiProfilo(page)
  const statoPrima = primaDiConsegnare.campagne.fattoria.cfg.stato
  const guadagnatoPrima = statoPrima.guadagnato || 0
  const coinsPrima = primaDiConsegnare.coins
  uguale('le uova ci sono, tre', statoPrima.granaio.uova, 3)

  await bancone1.locator('[data-azione="consegna"]').click()
  await attendi(page, 1800)               // il salvataggio è a ritardo
  const dopoConsegnare = await leggiProfilo(page)
  const statoDopo = dopoConsegnare.campagne.fattoria.cfg.stato

  uguale('le uova sono uscite dal granaio', statoDopo.granaio.uova || 0, 0)
  uguale('l\'esperienza è salita esattamente del premio dichiarato',
         statoDopo.guadagnato, guadagnatoPrima + clienteUova.xp)
  uguale('le monete non si sono mosse: qui non si paga in monete',
         dopoConsegnare.coins, coinsPrima)
  const famaDopo = famaDi(statoDopo.botteghe.pasticceria)
  controlla('un cuore si è acceso', famaDopo.cuori >= 1, JSON.stringify(famaDopo))
  uguale('e lo dice anche il quadratino in cima',
         Number(await page.locator('[data-fama]').getAttribute('data-cuori')), famaDopo.cuori)

  /* ---------- 2. la merce che manca porta all'albero ---------- */
  await bancone2.locator('[data-albero-apri="burro"]').click()
  await attendi(page, 300)
  uguale('si apre l\'albero', await page.locator('[data-albero]').count(), 1)
  uguale('del burro', await page.locator('[data-albero]').getAttribute('data-albero-di'), 'burro')
  await scatto(page, 'bottega-albero-burro')
}

nota(`errori in console: ${errori.length}`)
uguale('nessun errore in console', errori.join(' | '), '')
await browser.close()
riassunto('una bottega del paese, col dito')
