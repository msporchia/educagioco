/* ═══════════════════════════════════════════════════════════════════
   LA BOLLA DELLA FATTORIA: SEMI, CESTO E RICETTE TRASCINATI COL DITO

   Toccato un campo o una macchina, sopra compare la bolla coi gettoni;
   un gettone si porta sul prato e lavora dove passa — un seme
   strisciato su quattro campi vuoti li semina tutti e quattro. Qui si
   prova quello che l'unità non vede: che il dito tenga il gettone
   fuori dalla bolla (la cattura del puntatore) e che passando sopra i
   campi li trovi davvero. Le regole stanno in
   docs/fattoria/come-si-tocca.md («La bolla»).
   `node test/esegui.mjs fattoria-bolla`
   tempo: 60
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, leggiProfilo, scatto, attendi, scegli }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { Fattoria, borsaInfinita } from '../../src/giochi/fattoria/motore/fattoria.js'
import { sogliaDi } from '../../src/giochi/fattoria/dati/livelli.js'
import { CELLE, PRIMA, ULTIMA } from '../../src/giochi/fattoria/dati/mondo.js'

const MINUTO = 60000

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

/* ---------- la fattoria: quattro campi in fila, i silos, il mulino ----------
   I campi sono larghi due celle e stanno attaccati, sulla stessa riga:
   così una strisciata orizzontale li attraversa tutti senza sapere dove
   sono a schermo. */
const f = new Fattoria({ borsa: borsaInfinita() })
f.speso = sogliaDi(10)
f.reclamaTutto()
const centro = Math.round(((PRIMA + ULTIMA + 1) / 2) * CELLE)
for (let i = 0; i < 4; i++)
  controlla(`il campo ${i + 1} si posa`, f.posa('orto', centro - 4 + i * 2, centro).ok)
controlla('il silo si posa', f.posa('silo', centro + 6, centro - 4).ok)
controlla('il silo bianco si posa', f.posa('silo_bianco', centro - 9, centro - 4).ok)
controlla('il mulino si posa', f.posa('mulino', centro - 2, centro + 4).ok)
f.metti('grano', 2)

async function metti(stato) {
  const vecchio = await leggiProfilo(page)
  await semina(page, {
    ...(vecchio || {}), coins: 3000,
    campagne: { ...((vecchio || {}).campagne || {}),
                fattoria: { tappa: 0, libera: false, stelle: {}, cfg: { stato } } },
  })
  await scegli(page, 'fattoria')
  await page.waitForSelector('.fa-tela', { timeout: 5000 })
  await attendi(page, 700)
}
async function esci() {
  await page.locator('button[aria-label="indietro"]').click()
  await page.waitForSelector('.carte', { timeout: 5000 })
  await attendi(page, 400)
}
const statoSalvato = async () =>
  (((await leggiProfilo(page)).campagne || {}).fattoria || {}).cfg.stato

await metti(f.serializza())

const cdp = await page.context().newCDPSession(page)
const giu = (x, y) => cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
const va = (x, y) => cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] })
const su = () => cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
async function dito(x, y) {
  await giu(x, y); await attendi(page, 60); await su(); await attendi(page, 260)
}
/* Una strisciata a passi da dieci pixel: un dito vero manda un
   pointermove ogni pochi pixel, e un salto lungo proverebbe solo la
   rete che riempie i buchi. */
async function striscia(da, punti, foto = '') {
  await giu(da.x, da.y)
  let ora = da
  for (const [k, p] of punti.entries()) {
    // la foto a metà gesto: il gettone in mano, i campi già fatti e quelli che restano
    if (k === punti.length - 1 && foto) await scatto(page, foto)
    const n = Math.max(1, Math.ceil(Math.hypot(p.x - ora.x, p.y - ora.y) / 10))
    for (let i = 1; i <= n; i++) {
      await va(Math.round(ora.x + (p.x - ora.x) * i / n), Math.round(ora.y + (p.y - ora.y) * i / n))
      await attendi(page, 12)
    }
    ora = p
  }
  await attendi(page, 80)
  await su()
  await attendi(page, 300)
}
/* I gettoni sono disegnati sulla tela: dove stanno e quale bolla è aperta lo dice il gancio
   `window.__fattoria` (vedi docs/fattoria/come-si-tocca.md). */
const laBolla = () => page.evaluate(() => (window.__fattoria && window.__fattoria.bolla()) || null)
const gettone = k => page.evaluate(k => (window.__fattoria.gettoni().find(g => g.chiave === k) || null), k)

const dalCentro = tela => {
  const cx = tela.x + tela.width / 2, cy = tela.y + tela.height / 2
  const punti = []
  for (let y = tela.y + 16; y < tela.y + tela.height - 16; y += 16)
    for (let x = tela.x + 16; x < tela.x + tela.width - 16; x += 16)
      punti.push({ x: Math.round(x), y: Math.round(y), d: (x - cx) ** 2 + (y - cy) ** 2 })
  return punti.sort((a, b) => a.d - b.d)
}
/* Si cerca col dito, come negli altri file: la vista dipende dallo schermo. */
async function cerca(vale) {
  const tela = await page.locator('.fa-tela').boundingBox()
  for (const p of dalCentro(tela)) {
    await dito(p.x, p.y)
    if (vale(await laBolla() || {})) return p
    if (await page.locator('.fa-velo').count()) {
      await page.locator('.fa-velo').click({ position: { x: 5, y: 5 } })
      await attendi(page, 200)
    }
  }
  return null
}
const tela = await page.locator('.fa-tela').boundingBox()

/* ---------- 1. toccare un campo vuoto apre la bolla dei semi ---------- */
const campo = await cerca(b => b.tipo === 'semina')
controlla('toccando un campo vuoto spuntano i semi', !!campo)
uguale('e non un foglio', await page.locator('.fa-velo').count(), 0)
controlla('fra i semi c\'è il grano da trascinare', !!(await gettone('grano')))
await scatto(page, 'bolla-semi')

/* ---------- 2. il seme strisciato sulla fila li semina tutti ---------- */
if (campo) {
  const seme = await gettone('grano')
  await striscia(seme, [{ x: Math.round(tela.x + 4), y: campo.y },
                        { x: campo.x, y: campo.y },
                        { x: Math.round(tela.x + tela.width - 4), y: campo.y }], 'bolla-trascina')
  uguale('lasciato il seme, i gettoni se ne vanno', await laBolla(), null)
  await esci()
  const s = await statoSalvato()
  uguale('i quattro campi sono seminati a grano',
         s.cose.filter(c => c.id === 'orto' && c.coltura === 'grano').length, 4)

  /* ---------- 3. passa la notte: il cesto li raccoglie tutti ---------- */
  for (const c of s.cose) if (c.seminato) c.seminato -= 20 * MINUTO
  const granoPrima = s.granaio.grano || 0
  await metti(s)
  await dito(campo.x, campo.y)
  uguale('toccando un campo pronto spunta il cesto', (await laBolla() || {}).tipo, 'raccogli')
  await scatto(page, 'bolla-cesto')
  const cesto = await gettone('cesto')
  await striscia(cesto, [{ x: Math.round(tela.x + 4), y: campo.y },
                         { x: Math.round(tela.x + tela.width - 4), y: campo.y }])
  await esci()
  const s2 = await statoSalvato()
  uguale('i quattro campi sono tornati vuoti', s2.cose.filter(c => c.coltura).length, 0)
  uguale('e il grano è nel silo', s2.granaio.grano, granoPrima + 4)
  await metti(s2)
}

/* ---------- 4. il mulino: la ricetta trascinata sopra ---------- */
const mulino = await cerca(b => b.nome === 'Mulino')
controlla('toccando il mulino si apre la sua bolla', !!mulino)
if (mulino) {
  const r = await gettone('mangime')
  controlla('con la ricetta del mangime', !!r)
  await giu(r.x, r.y)
  await attendi(page, 120)
  controlla('premendola dice cosa prende', await page.evaluate(() => window.__fattoria.dettaglio()))
  await scatto(page, 'bolla-ricetta')
  for (let i = 1; i <= 10; i++) {
    await va(Math.round(r.x + (mulino.x - r.x) * i / 10), Math.round(r.y + (mulino.y - r.y) * i / 10))
    await attendi(page, 16)
  }
  await su()
  await attendi(page, 300)
  uguale('dopo, le ricette restano per metterne un\'altra', (await laBolla() || {}).nome, 'Mulino')
  uguale('e la fila mostra il pezzo partito', await page.evaluate(() => window.__fattoria.fila()), 1)

  await esci()
  const s3 = await statoSalvato()
  uguale('nel mulino c\'è un mangime in fila',
         (s3.cose.find(c => c.id === 'mulino').coda || []).length, 1)

  /* ---------- 6. pronto: il tocco lo ritira ----------
     Come in Hay Day: quello che è pronto si prende toccando la macchina,
     e poi si apre la bolla per rimetterci altro. */
  const m3 = s3.cose.find(c => c.id === 'mulino')
  m3.coda[0].da -= 10 * MINUTO
  const mangimePrima = s3.granaio.mangime || 0
  await metti(s3)
  await dito(mulino.x, mulino.y)
  uguale('toccato, il mulino mostra le sue ricette', (await laBolla() || {}).nome, 'Mulino')
  await esci()
  const s4 = await statoSalvato()
  uguale('e il mangime pronto è nel silo', s4.granaio.mangime, mangimePrima + 1)
  uguale('e la fila è vuota', (s4.cose.find(c => c.id === 'mulino').coda || []).length, 0)
}

nota(`campo a ${campo && campo.x},${campo && campo.y}; mulino a ${mulino && mulino.x},${mulino && mulino.y}`)
uguale('nessun errore in console', errori.join(' · '), '')
riassunto('La bolla della fattoria')
await browser.close()
