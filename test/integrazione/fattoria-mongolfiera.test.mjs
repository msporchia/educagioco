/* ═══════════════════════════════════════════════════════════════════
   LA MONGOLFIERA, COL DITO

   Sul modello di `integrazione/albero.test.mjs`: fattoria seminata col
   motore vero, dito vero (`Input.dispatchTouchEvent`) a cercare la
   piazzola a spirale dal centro, stato vero riletto dal profilo dopo
   ogni gesto.

   Il pallone atterra **a mano** in `f.mongolfiera`, con la forma che
   `motore/mongolfiera.js` documenta in testa — una fila sola, di uova
   (`profonditaDi >= 2`, non è mangime: passa il filtro di
   `merceDaCassa`), due casse. Il premio di una cassa si legge da
   `premioDellaCassa`, non si scrive a mano: è lo stesso numero che
   sceglierebbe il motore, e può cambiare.

   Come nel test del mulino (`fattoria-fila.test.mjs`), il foglio di
   una cosa in mappa si può richiudere da solo dal battito della scena:
   qui si ritocca la piazzola prima di ogni gesto per la stessa
   ragione — vedi la nota lì.
   `node test/esegui.mjs fattoria-mongolfiera`
   tempo: 90
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, leggiProfilo, scatto, attendi }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { Fattoria, borsaInfinita } from '../../src/giochi/fattoria/motore/fattoria.js'
import { sogliaDi } from '../../src/giochi/fattoria/dati/livelli.js'
import { CELLE, PRIMA, ULTIMA } from '../../src/giochi/fattoria/dati/mondo.js'
import { premioDellaCassa } from '../../src/giochi/fattoria/dati/mongolfiera.js'
import { TRAGUARDI } from '../../src/data/traguardi.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

/* ---------- la fattoria seminata ---------- */
const f = new Fattoria({ borsa: borsaInfinita() })
f.speso = sogliaDi(30)
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
/* la mongolfiera al centro: è quella che si tocca col dito */
controlla('la mongolfiera si posa', !!posa('mongolfiera'))
posa('silo_bianco')   // le uova della cassa
f.metti('uova', 2)    // basta per la prima cassa, non per la seconda

/* Due pezzi bastano per la prima cassa e non per la seconda, che ne
   vuole tre: `cassaPronta` guarda il totale in granaio, non lo riserva
   fra le casse, quindi due casse dello stesso peso risulterebbero
   pronte entrambe insieme. */
const xpCassa = premioDellaCassa('uova', 2)
const xpCassa2 = premioDellaCassa('uova', 3)
f.mongolfiera = {
  n: 1, nata: Date.now(),
  file: [{ merce: 'uova', casse: [
    { pezzi: 2, xp: xpCassa, piena: false },
    { pezzi: 3, xp: xpCassa2, piena: false },
  ] }],
}

/* Vedi `fattoria-bottega.test.mjs`: si isolano i traguardi, che
   altrimenti contaminerebbero il conto delle monete e dell'esperienza
   con un premio che non c'entra con la mongolfiera. */
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

/* ---------- il dito, e la ricerca della mongolfiera ---------- */
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
async function cercaLaMongolfiera() {
  const tela = await page.locator('.fa-tela').boundingBox()
  for (const p of dalCentro(tela)) {
    await dito(p.x, p.y)
    if ((await titolo()) === 'La mongolfiera') return p
    await chiudi()
  }
  return null
}

const dovEra = await cercaLaMongolfiera()
const trovata = !!dovEra
controlla('col dito si apre la mongolfiera', trovata)

/* Come per il mulino: ritocca la piazzola prima di ogni gesto, perché
   il foglio si può richiudere da solo dal battito della scena. */
async function assicuraLaMongolfieraAperta() {
  if ((await titolo()) === 'La mongolfiera') return true
  await chiudi()
  await dito(dovEra.x, dovEra.y)
  return (await titolo()) === 'La mongolfiera'
}

if (trovata) {
  /* Il foglio **resta aperto** mentre il battito lo rinfresca (ogni
     cinque secondi). Si chiudeva da solo: il rinfresco confrontava la
     cosa dentro il pannello, avvolta nel proxy di Vue, con quella vera
     del motore, e non la trovava mai. */
  await attendi(page, 6500)
  uguale('dopo sei secondi e mezzo il foglio è ancora aperto', await titolo(), 'La mongolfiera')
  await scatto(page, 'mongolfiera-aperta')
  uguale('una fila', await page.locator('[data-fila]').count(), 1)
  uguale('due casse', await page.locator('[data-cassa]').count(), 2)
  uguale('la prima cassa è pronta: le uova ci sono già',
         await page.locator('[data-cassa="0-0"]').isDisabled(), false)
  uguale('la seconda no: mancano ancora le uova',
         await page.locator('[data-cassa="0-1"]').isDisabled(), true)

  /* ---------- 1. caricare una cassa: la merce esce, l'esperienza sale ---------- */
  const primaDiCaricare = await leggiProfilo(page)
  const statoPrima = primaDiCaricare.campagne.fattoria.cfg.stato
  const guadagnatoPrima = statoPrima.guadagnato || 0
  const coinsPrima = primaDiCaricare.coins
  uguale('le uova ci sono, due', statoPrima.granaio.uova, 2)

  controlla('la mongolfiera è aperta', await assicuraLaMongolfieraAperta())
  await page.locator('[data-cassa="0-0"]').click()
  await attendi(page, 1800)               // il salvataggio è a ritardo
  const dopoCaricare = await leggiProfilo(page)
  const statoDopo = dopoCaricare.campagne.fattoria.cfg.stato

  uguale('le uova sono uscite dal granaio', statoDopo.granaio.uova || 0, 0)
  uguale('l\'esperienza è salita esattamente del premio della cassa',
         statoDopo.guadagnato, guadagnatoPrima + xpCassa)
  uguale('le monete non si sono mosse', dopoCaricare.coins, coinsPrima)
  uguale('la cassa caricata è segnata piena',
         statoDopo.mongolfiera.file[0].casse[0].piena, true)

  /* ---------- 2. «Parti!» a metà chiede conferma ---------- */
  controlla('la mongolfiera è aperta', await assicuraLaMongolfieraAperta())
  await page.locator('[data-azione="parti"]').click()
  await attendi(page, 300)
  uguale('chiede conferma, non parte subito',
         await page.locator('[data-conferma="parti"]').count(), 1)
  uguale('e il pallone è ancora a terra', await page.locator('[data-cassa]').count(), 2)

  await page.locator('[data-azione="parti-davvero"]').click()
  await attendi(page, 1800)               // il salvataggio è a ritardo
  const dopoPartenza = await leggiProfilo(page)
  const statoDopoPartenza = dopoPartenza.campagne.fattoria.cfg.stato
  controlla('il pallone è partito', statoDopoPartenza.mongolfiera.via > 0,
            JSON.stringify(statoDopoPartenza.mongolfiera))
  await scatto(page, 'mongolfiera-partita')

  /* ---------- 3. riaprendo, si vede l'attesa ---------- */
  controlla('la mongolfiera è aperta', await assicuraLaMongolfieraAperta())
  uguale('il cielo è vuoto', await page.locator('[data-cielo]').count(), 1)
  controlla('e non ci sono più casse da caricare',
            await page.locator('[data-cassa]').count() === 0)
  await scatto(page, 'mongolfiera-attesa')
}

nota(`errori in console: ${errori.length}`)
uguale('nessun errore in console', errori.join(' | '), '')
await browser.close()
riassunto('la mongolfiera, col dito')
