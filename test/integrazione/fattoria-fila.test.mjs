/* ═══════════════════════════════════════════════════════════════════
   LA FILA DI UNA MACCHINA, COL DITO

   Sul modello di `integrazione/albero.test.mjs`: si semina una fattoria
   col motore vero, si cerca la macchina a spirale dal centro col dito
   vero (`Input.dispatchTouchEvent`), e si legge lo stato vero dal
   profilo dopo ogni gesto — non dal DOM, che potrebbe dire la stessa
   bugia della logica che lo scrive.

   Il mulino ha **tre posti** — i due oltre quello con cui nasce si
   comprano col motore, come farebbe il dito (`dati/coda.js`) — e **tre
   pezzi**: uno messo adesso (sta lavorando) e due subito dopo (aspettano
   che finisca chi li precede). Nessuno è pronto: toccare il mulino
   ritira da sé quello che è pronto, prima di aprire la bolla, e la fila
   cambierebbe sotto il test. Il ritiro al tocco si prova in
   `integrazione/fattoria-bolla`. La fila non ha un foglio: sta sul
   prato sotto il mulino, e i suoi posti si toccano lì.

   ── PERCHÉ SI RITOCCA IL MULINO PRIMA DI OGNI GESTO ─────────────────
   La fila si rifà ogni cinque secondi dal battito della scena, e fra un
   gesto e l'altro il test aspetta il salvataggio (1,8 s, a ritardo). Se
   intanto la fila si è chiusa, un tocco sul mulino la riporta: è il
   gesto che farebbe un bambino tornando a guardarla.
   `node test/esegui.mjs fattoria-fila`
   tempo: 90
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, leggiProfilo, scatto, attendi, scegli }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { Fattoria, borsaInfinita } from '../../src/giochi/fattoria/motore/fattoria.js'
import { sogliaDi } from '../../src/giochi/fattoria/dati/livelli.js'
import { CELLE, PRIMA, ULTIMA } from '../../src/giochi/fattoria/dati/mondo.js'
import { PREZZI_DELLA_FILA } from '../../src/giochi/fattoria/dati/coda.js'

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
/* Un mulino nasce con un posto solo: per tenerne tre se ne comprano due. */
for (let k = 0; k < 2; k++)
  controlla(`il posto ${k + 2} si compra`, f.ingrandisciLaFila(cosaMulino).ok)
const comprati = cosaMulino.fila

/* Tre avvii: il primo parte adesso (lavora), gli altri due si mettono
   in coda dietro (aspettano). */
const ora = Date.now()
const r1 = f.avvia(cosaMulino, 'mangime', ora)
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
await scegli(page, 'fattoria')
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
const dalCentro = tela => {
  const cx = tela.x + tela.width / 2, cy = tela.y + tela.height / 2
  const punti = []
  for (let y = tela.y + 16; y < tela.y + tela.height - 16; y += 20)
    for (let x = tela.x + 16; x < tela.x + tela.width - 16; x += 24)
      punti.push({ x: Math.round(x), y: Math.round(y), d: (x - cx) ** 2 + (y - cy) ** 2 })
  return punti.sort((a, b) => a.d - b.d)
}
/* La fila è disegnata sulla tela, sotto il mulino: dove stanno i posti e
   cosa c'è dentro lo dice il gancio `window.__fattoria`
   (docs/fattoria/come-si-tocca.md). */
const laBolla = () => page.evaluate(() => (window.__fattoria && window.__fattoria.bolla()) || null)
const posti = () => page.evaluate(() => window.__fattoria.posti())
async function cercaIlMulino() {
  const tela = await page.locator('.fa-tela').boundingBox()
  for (const p of dalCentro(tela)) {
    await dito(p.x, p.y)
    if ((await laBolla() || {}).nome === 'Mulino') return p
    await chiudi()
  }
  return null
}

const dovEra = await cercaIlMulino()
const trovato = !!dovEra
controlla('col dito si apre il mulino', trovato)

/* Se nel frattempo la fila si è chiusa (un tocco fuori, un rinfresco),
   un tocco sul mulino la riporta: è il gesto di chi torna a guardare. */
async function assicuraIlMulinoAperto() {
  if ((await laBolla() || {}).nome === 'Mulino') return true
  await dito(dovEra.x, dovEra.y)
  return (await laBolla() || {}).nome === 'Mulino'
}
async function tocca(come) {
  const p = (await posti()).find(q => q.come === come)
  if (controlla(`sotto il mulino c'è un posto «${come}»`, !!p)) await dito(p.x, p.y)
  await attendi(page, 1800)               // il salvataggio è a ritardo
}
const statoSalvato = async () => (await leggiProfilo(page)).campagne.fattoria.cfg.stato

if (trovato) {
  /* La fila **resta** mentre il battito la rinfresca (ogni cinque
     secondi): il rinfresco rifà i numeri, non richiude. */
  await attendi(page, 6500)
  uguale('dopo sei secondi e mezzo la fila è ancora lì', (await laBolla() || {}).nome, 'Mulino')
  await scatto(page, 'fila-mulino-aperto')
  /* ---------- la fila si vede, sul prato ---------- */
  const visti = (await posti()).map(p => p.come)
  uguale('tre posti occupati: uno lavora, due aspettano', visti.slice(0, 3).join(' '),
         'lavora aspetta aspetta')
  /* il posto da comprare sta in fondo, tratteggiato, col prezzo del
     **prossimo**: due sono già comprati, quindi il terzo della curva */
  const prezzo = PREZZI_DELLA_FILA[comprati]
  const piu = (await posti()).find(p => p.come === 'piu')
  uguale('in fondo c\'è il posto da comprare, col prezzo giusto', piu && piu.prezzo, prezzo)

  /* ---------- 1. togliere un pezzo in attesa rende la roba ---------- */
  const granoPrima = (await statoSalvato()).granaio.grano || 0
  controlla('il mulino è aperto', await assicuraIlMulinoAperto())
  await tocca('aspetta')
  const dopoTogliere = await statoSalvato()
  uguale('il grano torna nel granaio', dopoTogliere.granaio.grano, granoPrima + 2)
  uguale('in fila restano due pezzi',
         (dopoTogliere.cose.find(c => c.id === 'mulino').coda || []).length, 2)

  /* ---------- 2. il «+» costa e aggiunge un posto ---------- */
  const moneteCoinsPrima = (await leggiProfilo(page)).coins
  controlla('il mulino è aperto', await assicuraIlMulinoAperto())
  await tocca('piu')
  const dopoIngrandire = await leggiProfilo(page)
  uguale('la fila del mulino è stata ingrandita un\'altra volta',
         dopoIngrandire.campagne.fattoria.cfg.stato.cose.find(c => c.id === 'mulino').fila,
         comprati + 1)
  uguale('costa 🪙 quanto dichiarato', dopoIngrandire.coins, moneteCoinsPrima - prezzo)
  await scatto(page, 'fila-dopo')
}

nota(`errori in console: ${errori.length}`)
uguale('nessun errore in console', errori.join(' | '), '')
await browser.close()
riassunto('la fila di una macchina, col dito')
