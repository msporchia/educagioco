/* Gli attrezzi delle prove del mondo di sopra del Sotterraneo (`integrazione/sotterraneo-sopra-*`, docs/sotterraneo/mondo-3d.md):
   entrare con un profilo seminato, portare l'eroe accanto a qualcuno (il salto delle prove, `__mondo3d.vai`) e toccarlo quando
   sta fermo a schermo. Al posto delle attese fisse si aspetta la condizione: il salto rimette la telecamera sull'eroe di colpo
   (`salta()`), quindi basta che la scena sia pronta e che il bersaglio non si muova più fra tre letture di fila. */
import { azzera, semina, scegli, mondoPronto, leggiProfilo, attendi, senzaPensieri, pronto, finestraFerma } from './browser.mjs'

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
  await viaLaFesta(page)
  await scegli(page, 'sotterraneo')
  await mondoPronto(page)
  if (!mostri) await page.evaluate(() => window.__mondo3d.senzaMostri())
}

/* Un profilo seminato con discese finite fa scattare in home i traguardi (components/Traguardo.vue): un cartello di 3,2 s l'uno, in
   fila, sopra la home, e il clic sull'indice dei giochi aspettava che finissero (sette secondi con due). Il velo si chiude toccandolo */
export async function viaLaFesta(page) {
  if (!(await page.locator('.velo').count())) return
  await page.locator('.velo').first().click()
  await page.waitForSelector('.velo', { state: 'detached', timeout: 5000 })
}

// aspetta che il primo `sel` stia fermo a schermo (tre letture uguali di fila) e ne torna il rettangolo
export async function fermoASchermo(page, sel, { ogni = 60, volte = 3, entro = 15000 } = {}) {
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

/* Il dialogo fino all'ultima pagina, poi (se c'è `sel`) quella scelta: come `nelDialogo` di aiuto/browser.mjs, ma senza i 360 ms
   fissi prima di ogni pagina. Il testo è cieco 320 ms appena aperto e 180 dopo ogni pagina (viste/Dialogo.vue): un tocco
   che cade lì non gira, e si ritocca appena si vede che la pagina non è cambiata. `tocca`: il tocco su un selettore (di
   difetto il mouse) */
export async function nelDialogo(page, sel = null, { tocca = null } = {}) {
  await page.waitForSelector('[data-dialogo]', { timeout: 15000 })
  const premi = tocca || (s => page.click(s))
  for (let n = 0; n < 12 && !(await page.locator('[data-dialogo][data-ultima]').count()); n++) await voltaPagina(page, premi)
  await page.waitForSelector('[data-dialogo][data-ultima]', { timeout: 3000 })
  await pronto(page, '[data-dialogo] [data-scelte]')   // anche senza `sel`: chi chiama tocca una scelta subito dopo
  if (sel) await premi(`[data-dialogo] ${sel}`)
}

// un tocco sul testo del dialogo, e la pagina dopo: se il tocco cade nei ciechi la pagina non cambia, e si ritocca
export async function voltaPagina(page, premi) {
  const p = await page.locator('[data-dialogo]').getAttribute('data-pagina')
  for (let n = 0; n < 6; n++) {
    await premi('[data-dialogo-testo]')
    if (await page.waitForFunction(p => document.querySelector('[data-dialogo]')?.dataset.pagina !== p, p, { timeout: 250 }).then(() => true, () => false)) return
  }
  throw new Error(`il dialogo resta a pagina ${p}`)
}

/* Al banco di un mercante del villaggio per la strada vera ma senza camminare: l'eroe salta accanto a lui, il dito lo tocca (accanto
   si apre subito il dialogo), «fammi vedere» nel dialogo e la bottega pronta al tocco. Con i pensieri spenti il tocco non cade
   sull'eroe; la strada a piedi la prova integrazione/sotterraneo-sopra-mondo. `toccaIl`: il dito sulle scelte del dialogo */
export async function alBanco(page, chi, { tocca, toccaIl, scelta = 'bottega' }) {
  await vaiETocca(page, `[data-mercante="${chi}"][data-citta="villaggio"]`, `mercante:villaggio:${chi}`, tocca, { atteso: `[data-dialogo="${chi}"]` })
  await nelDialogo(page, `[data-scelta="${scelta}"]`, { tocca: toccaIl })
  await page.waitForSelector(`[data-bottega][data-mercante-aperto="${chi}"]`, { timeout: 10000 })
  await pronto(page, '[data-bottega]')
  await finestraFerma(page)
}
