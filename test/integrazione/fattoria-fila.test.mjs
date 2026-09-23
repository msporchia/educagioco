/* ═══════════════════════════════════════════════════════════════════
   LA FILA DI UNA MACCHINA, COL DITO

   Sul modello di `integrazione/albero.test.mjs`: si semina una fattoria
   col motore vero, si cerca la macchina a spirale dal centro col dito
   vero (`Input.dispatchTouchEvent`), e si legge lo stato vero dal
   profilo dopo ogni gesto — non dal DOM, che potrebbe dire la stessa
   bugia della logica che lo scrive.

   Il mulino nasce con **tre pezzi**: uno messo in fila dieci minuti fa
   (già pronto), uno messo adesso (sta lavorando) e uno messo subito
   dopo (aspetta che finisca chi lo precede) — `f.avvia(cosa, ricetta,
   ora)` con `ora` passata fa esattamente questo, perché è da `ora` che
   il motore calcola quando parte il pezzo.

   ── PERCHÉ SI RITOCCA IL FOGLIO PRIMA DI OGNI GESTO ────────────────
   Il foglio di una macchina si rifà da solo ogni 5 secondi
   (`rinfrescaLaMacchina`, dal battito della scena) e — guasto scoperto
   scrivendo questo test, segnalato a parte — quel giro lo può chiudere
   da solo anche senza che nessuno lo tocchi, perché il confronto con
   cui capisce «è ancora sul prato?» confonde l'oggetto letto da Vue
   con quello vero del motore. Aspettare 1,8 s per ogni salvataggio (il
   salvataggio è a ritardo, come negli altri test della fattoria) basta
   a volte a superare quel giro. Il rimedio qui non è aspettare meno —
   il ritardo del salvataggio non si accorcia — ma **ritoccare il
   mulino prima di ogni gesto**: un tocco in più, che se il foglio è
   già aperto non cambia niente (`chiudi()`+dito lo riapre da capo,
   fresco) e se si era chiuso da solo lo riporta in piedi. È il gesto
   che farebbe un bambino tornando a guardare la fila.
   `node test/esegui.mjs fattoria-fila`
   tempo: 90
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, leggiProfilo, scatto, attendi }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { Fattoria, borsaInfinita } from '../../src/giochi/fattoria/motore/fattoria.js'
import { sogliaDi } from '../../src/giochi/fattoria/dati/livelli.js'
import { CELLE, PRIMA, ULTIMA } from '../../src/giochi/fattoria/dati/mondo.js'
import { PREZZI_DELLA_FILA } from '../../src/giochi/fattoria/dati/coda.js'

const MINUTO = 60000

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

/* ---------- la fattoria seminata ---------- */
const f = new Fattoria({ borsa: borsaInfinita() })
f.speso = sogliaDi(10)
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
/* il mulino al centro: è quello che si tocca col dito */
controlla('il mulino si posa', !!posa('mulino'))
posa('silo')          // il grano crudo
posa('silo_bianco')   // il mangime che ne esce
f.metti('grano', 6)   // tre pezzi da 2 grano l'uno

const cosaMulino = f.cose.find(c => c.id === 'mulino')
controlla('il mulino è in mappa', !!cosaMulino)

/* Tre avvii, a tre momenti diversi: il primo lontano nel passato è già
   pronto quando si apre il foglio, il secondo parte adesso (lavora), il
   terzo si mette in coda dietro al secondo (aspetta). */
const ora = Date.now()
const r1 = f.avvia(cosaMulino, 'mangime', ora - 10 * MINUTO)
controlla('il primo pezzo parte', r1.ok, JSON.stringify(r1))
const r2 = f.avvia(cosaMulino, 'mangime', ora)
controlla('il secondo pezzo parte', r2.ok, JSON.stringify(r2))
const r3 = f.avvia(cosaMulino, 'mangime', ora)
controlla('il terzo pezzo parte', r3.ok, JSON.stringify(r3))
uguale('la fila ha tre pezzi', (cosaMulino.coda || []).length, 3)

const vecchio = await leggiProfilo(page)
await semina(page, {
  ...(vecchio || {}),
  coins: 3000,
  settings: { ...((vecchio || {}).settings || {}), sperimentali: true },
  campagne: { ...((vecchio || {}).campagne || {}),
              fattoria: { tappa: 0, libera: false, stelle: {},
                          cfg: { stato: f.serializza() } } },
})
await page.locator('.carta.gioco[data-gioco="fattoria"]').click()
await page.waitForSelector('.fa-tela', { timeout: 5000 })
await attendi(page, 700)

/* ---------- il dito, e la ricerca del mulino ---------- */
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
async function cercaIlMulino() {
  const tela = await page.locator('.fa-tela').boundingBox()
  for (const p of dalCentro(tela)) {
    await dito(p.x, p.y)
    if ((await titolo()) === 'Mulino') return p
    await chiudi()
  }
  return null
}

const dovEra = await cercaIlMulino()
const trovato = !!dovEra
controlla('col dito si apre il mulino', trovato)

/* Ritocca il mulino prima di ogni gesto: se il foglio è già aperto lo
   richiude e riapre (un tocco che non cambia niente), se si era
   chiuso da solo lo rimette in piedi. Vedi la nota in testa al file. */
async function assicuraIlMulinoAperto() {
  if ((await titolo()) === 'Mulino') return true
  await chiudi()
  await dito(dovEra.x, dovEra.y)
  return (await titolo()) === 'Mulino'
}

if (trovato) {
  /* Il foglio **resta aperto** mentre il battito lo rinfresca (ogni
     cinque secondi). Si chiudeva da solo: il rinfresco confrontava la
     cosa dentro il pannello, avvolta nel proxy di Vue, con quella vera
     del motore, e non la trovava mai. */
  await attendi(page, 6500)
  uguale('dopo sei secondi e mezzo il foglio è ancora aperto', await titolo(), 'Mulino')
  await scatto(page, 'fila-mulino-aperto')
  /* ---------- la fila si vede ---------- */
  uguale('tre caselle occupate', await page.locator('[data-fila-posto]').count(), 3)
  uguale('la prima è pronta', await page.locator('[data-fila-posto="0"] em').first().innerText(), '✓')
  controlla('la seconda lavora',
            !!(await page.locator('[data-fila-posto="1"] .fa-livello').count()))
  controlla('la terza aspetta e ha la ✕',
            await page.locator('[data-fila-togli="2"]').count() === 1)
  /* la prima e la seconda non hanno la ✕: non sono in attesa */
  uguale('la prima non si toglie', await page.locator('[data-fila-togli="0"]').count(), 0)
  uguale('la seconda non si toglie', await page.locator('[data-fila-togli="1"]').count(), 0)

  /* ---------- 1. togliere un pezzo in attesa rende la roba ---------- */
  const primaDiTogliere = await leggiProfilo(page)
  const granoPrima = primaDiTogliere.campagne.fattoria.cfg.stato.granaio.grano || 0
  controlla('il mulino è aperto', await assicuraIlMulinoAperto())
  await page.locator('[data-fila-togli="2"]').click()
  await attendi(page, 1800)               // il salvataggio è a ritardo
  const dopoTogliere = await leggiProfilo(page)
  const statoDopoTogliere = dopoTogliere.campagne.fattoria.cfg.stato
  uguale('il grano torna nel granaio', statoDopoTogliere.granaio.grano, granoPrima + 2)
  const mulinoDopoTogliere = statoDopoTogliere.cose.find(c => c.id === 'mulino')
  uguale('in fila restano due pezzi', (mulinoDopoTogliere.coda || []).length, 2)

  /* ---------- 2. allungare la fila costa e aggiunge un posto ---------- */
  const prezzo = PREZZI_DELLA_FILA[0]
  controlla('il mulino è aperto', await assicuraIlMulinoAperto())
  const moneteAssert = page.locator('[data-fila-ingrandisci]')
  uguale('il tasto per allungare la fila c\'è', await moneteAssert.count(), 1)
  controlla('col prezzo giusto sul tasto',
            (await moneteAssert.innerText()).includes(String(prezzo)))
  const moneteCoinsPrima = dopoTogliere.coins
  await moneteAssert.click()
  await attendi(page, 1800)               // il salvataggio è a ritardo
  const dopoIngrandire = await leggiProfilo(page)
  const statoDopoIngrandire = dopoIngrandire.campagne.fattoria.cfg.stato
  const mulinoDopoIngrandire = statoDopoIngrandire.cose.find(c => c.id === 'mulino')
  uguale('la fila del mulino è stata ingrandita una volta', mulinoDopoIngrandire.fila, 1)
  uguale('costa 🪙 quanto dichiarato', dopoIngrandire.coins, moneteCoinsPrima - prezzo)

  /* ---------- 3. ritirare mette il pronto nel silo ---------- */
  const mangimePrima = statoDopoIngrandire.granaio.mangime || 0
  controlla('il mulino è aperto', await assicuraIlMulinoAperto())
  const ritira = page.locator('[data-ritira]')
  uguale('il tasto ritira c\'è', await ritira.count(), 1)
  controlla('e non è spento', await ritira.isDisabled() === false)
  await ritira.click()
  await attendi(page, 1800)               // il salvataggio è a ritardo
  const dopoRitiro = await leggiProfilo(page)
  const statoDopoRitiro = dopoRitiro.campagne.fattoria.cfg.stato
  uguale('il mangime pronto è entrato nel silo', statoDopoRitiro.granaio.mangime, mangimePrima + 1)
  const mulinoDopoRitiro = statoDopoRitiro.cose.find(c => c.id === 'mulino')
  uguale('in fila resta solo quello che lavora ancora', (mulinoDopoRitiro.coda || []).length, 1)
  await scatto(page, 'fila-dopo-ritiro')
}

nota(`errori in console: ${errori.length}`)
uguale('nessun errore in console', errori.join(' | '), '')
await browser.close()
riassunto('la fila di una macchina, col dito')
