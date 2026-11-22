/* Gli attrezzi delle prove del mondo di sopra del Sotterraneo (`integrazione/sotterraneo-sopra-*`, docs/sotterraneo/mondo-3d.md):
   entrare con un profilo seminato, portare l'eroe accanto a qualcuno (il salto delle prove, `__mondo3d.vai`) e toccarlo quando
   sta fermo a schermo. Al posto delle attese fisse si aspetta la condizione: il salto rimette la telecamera sull'eroe di colpo
   (`salta()`), quindi basta che la scena sia pronta e che il bersaglio non si muova più fra tre letture di fila. */
import { azzera, semina, scegli, mondoPronto, leggiProfilo, attendi, senzaPensieri } from './browser.mjs'

export const avventuraDi = async (page, eroe = 'cavaliere') => (await leggiProfilo(page))?.campagne?.sotterraneo?.cfg?.avventure?.[eroe] || {}
export const cellaEroe = async page => (await page.locator('[data-eroe-mondo]').getAttribute('data-cella')).split(',').map(Number)
export const grafica = page => page.evaluate(() => window.__sotterraneo3d.grafica())
export const scenaPronta = page => page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.pronto, null, { timeout: 30000 })

/* A nuovo, col profilo `profilo`, dentro il mondo di sopra. `pensieri: false` spegne il fumetto dell'eroe fermo (prende il tocco
   di chi gli sta accanto); `mostri: false` li toglie (un branco che arriva apre uno scontro e porta via i bersagli) */
export async function entraSopra(page, profilo, { pensieri = false, mostri = false } = {}) {
  await azzera(page)
  if (!pensieri) await senzaPensieri(page)
  await semina(page, profilo)
  await scegli(page, 'sotterraneo')
  await mondoPronto(page)
  if (!mostri) await page.evaluate(() => window.__mondo3d.senzaMostri())
}

// aspetta che il primo `sel` stia fermo a schermo (tre letture uguali di fila) e ne torna il rettangolo
export async function fermoASchermo(page, sel, { ogni = 120, volte = 3, entro = 15000 } = {}) {
  let ultimo = '', uguali = 0, b = null
  const fine = Date.now() + entro
  while (Date.now() < fine) {
    b = await page.locator(sel).first().boundingBox().catch(() => null)
    const ora = b ? `${Math.round(b.x)},${Math.round(b.y)}` : ''
    uguali = ora && ora === ultimo ? uguali + 1 : 0
    ultimo = ora
    if (uguali >= volte) return b
    await attendi(page, ogni)
  }
  throw new Error(`${sel} non sta fermo a schermo`)
}

/* Tocca un bersaglio del mondo (un elemento sopra la tela) quando sta fermo. Se è fuori dalla vista la telecamera ci si porta
   come farebbe il dito (`cam.guarda`, il gancio di toccaNelMondo in aiuto/browser.mjs), e si aspetta che sia arrivata */
export async function toccaSopra(page, sel, tocca) {
  await scenaPronta(page)
  const dentro = async () => {
    const r = await page.locator(sel).first().boundingBox().catch(() => null), v = page.viewportSize()
    return !!r && r.x + r.width / 2 > 8 && r.x + r.width / 2 < v.width - 8 && r.y + r.height * 0.6 > 8 && r.y + r.height * 0.6 < v.height - 8
  }
  if (!(await page.locator(`${sel}[data-vis="1"]`).count()) || !(await dentro())) {
    await page.evaluate(s => {
      const el = document.querySelector(s), M = window.__mondo3d, d = el.dataset
      const b = M.bersagli().find(q => (d.personaggio && q.ruolo === 'personaggio' && q.k === d.personaggio) || (d.mercante && q.ruolo === 'mercante' && q.k === d.mercante && (!d.citta || q.citta === d.citta))
        || (d.posto && q.ruolo === 'ingresso' && q.k === d.posto) || (d.pietra && q.ruolo === 'pietra' && q.k === d.pietra) || (d.minatore !== undefined && q.ruolo === 'minatore'))
      if (b) M.scena.cam.guarda(b.accanto.x + 0.5, b.accanto.y + 0.5, M.io)
    }, sel)
  }
  await page.waitForSelector(`${sel}[data-vis="1"]`, { timeout: 20000 })
  const b = await fermoASchermo(page, sel)
  await tocca(b.x + b.width / 2, b.y + b.height * 0.6)
}

/* L'eroe salta accanto a `k` (la chiave di un bersaglio: 'ragazza', 'mercante:villaggio:erborista', 'ingresso:torre'…) e si tocca
   `sel` finché non compare `atteso` (di difetto il dialogo): un bersaglio che sta uscendo dalla vista lascia cadere il tocco sul
   prato, e allora si riprova. Con i pensieri accesi il fumetto dell'eroe può prendere il tocco: chi li vuole accesi lo sa */
export async function vaiETocca(page, sel, k, tocca, { atteso = '[data-dialogo]' } = {}) {
  for (let giro = 0; giro < 4; giro++) {
    await page.evaluate(k => { window.__mondo3d.senzaMostri(); window.__mondo3d.vai(k) }, k)
    await toccaSopra(page, sel, tocca)
    if (await page.waitForSelector(atteso, { timeout: 8000 }).then(() => true, () => false)) return
  }
  throw new Error(`toccato ${sel} quattro volte e non compare ${atteso}`)
}

// un tocco vero al centro del primo `sel` (un foglio, un tasto), quando la finestra ha finito di crescere e il tasto sta fermo
export async function toccaFermo(page, sel, tocca) {
  await page.waitForSelector(sel, { timeout: 10000 })
  await page.locator(sel).first().scrollIntoViewIfNeeded().catch(() => {})
  const b = await fermoASchermo(page, sel, { ogni: 60, volte: 2 })
  await tocca(b.x + b.width / 2, b.y + b.height / 2)
}

/* Davanti all'ingresso `chiave` (salto delle prove), lo si tocca e si aspetta il «scendo» nel fumetto; con `scendi` si scende e si
   aspetta la discesa 3D disegnata */
export async function scendiDa(page, chiave, tocca, { scendi = true } = {}) {
  await vaiETocca(page, `[data-posto="${chiave}"]`, 'ingresso:' + chiave, tocca, { atteso: `[data-fumetto-di="${chiave}"] [data-azione="scendi"]` })
  if (!scendi) return
  await toccaFermo(page, `[data-fumetto-di="${chiave}"] [data-azione="scendi"]`, tocca)
  await page.waitForSelector('[data-tela="3d"]', { timeout: 30000 })
  await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.corsa && window.__sotterraneo3d.grafica().figure > 0 && !window.__sotterraneo3d.grafica().mondo,
    null, { timeout: 30000 })
}

// la veduta d'insieme dalla barra: aperta e arrivata (la telecamera si alza), o chiusa
export async function veduta(page, aperta) {
  await page.evaluate(() => document.querySelector('[data-casella-barra="mappa"]').click())
  if (!aperta) return page.waitForSelector('[data-veduta]', { state: 'detached', timeout: 5000 })
  await page.waitForSelector('[data-veduta]', { timeout: 5000 })
  await page.waitForFunction(() => window.__sotterraneo3d.cam.k > 0.97, null, { timeout: 10000 })
}
