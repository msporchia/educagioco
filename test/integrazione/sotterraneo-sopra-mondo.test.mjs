/* ═══════════════════════════════════════════════════════════════════
   IL MONDO DI SOPRA IN 3D, COL DITO — docs/sotterraneo/mondo-3d.md,
   mondo-3d-telecamera.md, mondo-3d-la-meta.md

   perché: il villaggio in 3D col dito: tutti i personaggi, la vista (scorre, pizzica, torna all'eroe), la meta, la veduta, il cartello, la cripta, il portale
   a parte perché: parte dal cavaliere alla prima partita, senza discese; mostri e scontri sul prato stanno in sotterraneo-sopra-mostri

   Un Chrome, un eroe alla prima partita (il cavaliere, nessuna discesa
   finita), e tutto quello che si vede e si tocca sul mondo di sopra:
   dalla partenza si vedono tutti quelli del villaggio e il tocco va a
   ognuno, e quanto costa; la carta della meta; la vista col dito (un
   dito che scorre la sposta e l'eroe resta, il pizzico zooma e non è un
   tocco, il tocco cammina e la vista lo riprende, «torna all'eroe», il
   mouse e la rotella, la vista lontana carica dove si guarda); la
   ragazza toccata parla col ritratto 3D, la bottega del fabbro; la
   pietra del villaggio con la sua domanda; la veduta d'insieme (la meta
   sotto le nuvole, nessuna tana non trovata, un tocco manda a piedi);
   il cartello; la tana del cimitero nella veduta, viva e morta; un
   salto in una zona lontana; la cripta, giù e su, con la nebbia e la
   pietra salvate. Poi un'altra semina: saliti dal portale, il gemello e
   il capitano col «!» stanno nel villaggio.
   Le regole sotto (lo zoom e i suoi limiti, la scia sulla strada, il
   velo che non si salva, il portale) sono in unita/sotterraneo-mondo-vista,
   sotterraneo-meta-sopra e sotterraneo-mondo-salva.
   Si tocca come un telefono (`Input.dispatchTouchEvent`, id diversi per le dita).
   `node test/esegui.mjs sotterraneo-sopra-mondo`
   tempo: 300
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, scatto, attendi, leggiProfilo, mondoPronto, fermoNelMondo, ditoDi, lasciaLaDiscesa, nelDialogo }
  from '../aiuto/browser.mjs'
import { domandaPronta } from '../aiuto/browser.mjs'
import { campagnaSeminata } from '../aiuto/sotterraneo-semina.mjs'
import { entraSopra, cellaEroe as cella, grafica, toccaSopra, vaiETocca, toccaFermo, fermoASchermo, scendiDa, veduta, scenaPronta }
  from '../aiuto/sotterraneo-sopra.mjs'
import { controlla, uguale, dentro, nota, riassunto, blocco } from '../aiuto/verifica.mjs'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { scrivi, PORTALE as VIA_PORTALE } from '../../src/giochi/sotterraneo/motore/sosta.js'
import { robaAttesa, crescitaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { ilMondo, postiDi, terraDelMondo, zonaDi } from '../../src/giochi/sotterraneo/motore/mondo-sopra.js'
import { campoVersoLaMeta } from '../../src/giochi/sotterraneo/motore/meta-sopra.js'
import { stradaDelMondo } from '../../src/giochi/sotterraneo/motore/strada-sopra.js'
import { INGRESSI_DEL_MONDO } from '../../src/giochi/sotterraneo/dati/mondo-aperto.js'

const m = ilMondo(), terra = terraDelMondo(m)
const cripta = postiDi(m, 'ingresso').find(p => p.chiave === 'altare')
const campo = campoVersoLaMeta(terra, cripta.accanto, stradaDelMondo(m))
const CIMITERO = m.regioni.find(r => r.chiave === 'cimitero')

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
const { tocca, cdp } = await ditoDi(page)
const dita = (type, punti) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: punti.map(([x, y], id) => ({ x, y, id })) })
// un dito da (x0, y0) a (x1, y1) in `n` passi, poi si alza
async function trascina(x0, y0, x1, y1, n = 8) {
  await dita('touchStart', [[x0, y0]])
  for (let i = 1; i <= n; i++) { await dita('touchMove', [[x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n]]); await attendi(page, 30) }
  await dita('touchEnd', [])
  await attendi(page, 150)
}
// due dita: dal centro (cx, cy) a distanza `d0` una dall'altra fino a `d1`, in orizzontale
async function pizzica(cx, cy, d0, d1, n = 8) {
  await dita('touchStart', [[cx - d0 / 2, cy], [cx + d0 / 2, cy]])
  for (let i = 1; i <= n; i++) { const d = d0 + (d1 - d0) * i / n; await dita('touchMove', [[cx - d / 2, cy], [cx + d / 2, cy]]); await attendi(page, 30) }
  await dita('touchEnd', [])
  await attendi(page, 200)
}
const cam = () => page.evaluate(() => { const c = window.__sotterraneo3d.cam; return { libera: c.libera.on, lx: c.libera.x, lz: c.libera.z, x: c.camera.position.x, z: c.camera.position.z, zoom: c.zoom, larghi: c.celleInLargo, lim: c.limitiZoom } })
const segue = () => page.waitForFunction(() => !window.__sotterraneo3d.cam.libera.on, null, { timeout: 5000 }).then(() => true, () => false)
// un punto del campo che non sta sotto una carta o un fumetto (lì il dito non sposta la vista): lungo la riga `y`, il più vicino a `x`
const puntoLibero = (x, y) => page.evaluate(([x0, y0]) => {
  for (let d = 0; d < 400; d += 10) for (const x1 of [x0 + d, x0 - d]) {
    const e = document.elementFromPoint(x1, y0)
    if (e && !e.closest('.sot-terra-sopra > *, .sot-terra-sotto > *, [data-fumetto], .sot-foglio, [data-torna-eroe]')) return x1
  }
  return x0
}, [x, y])
// dove cade a schermo un punto del mondo (in celle, a terra), in px della pagina
async function schermoDi(x, z) {
  const p = await page.evaluate(([a, b]) => { const s = window.__sotterraneo3d; const q = s.aSchermo(a, s.quota(a, b), b); return [q.x, q.y] }, [x, z])
  const b = await page.locator('[data-mondo3d]').boundingBox()
  return { x: b.x + p[0], y: b.y + p[1] }
}
const carta = sel => page.locator(`[data-meta-carta] ${sel}`)
const nomiTana = () => page.locator('[data-nome-posto^="tana:"]')

await entraSopra(page, { coins: 300, settings: { sperimentali: true }, campagne: { sotterraneo: campagnaSeminata({ finite: 0 }) } })
const b0 = await page.locator('[data-mondo3d]').boundingBox()
const cx = b0.x + b0.width / 2, cy = b0.y + b0.height * 0.55

/* ---------- 1. si entra: il mondo in 3D, chi sta nel villaggio, e quanto costa ---------- */
await blocco('il villaggio', async () => {
  // i pezzi attorno si costruiscono uno per fotogramma e le persone si vestono dopo: si aspetta che ci siano, poi si conta
  await page.waitForFunction(() => { const g = window.__sotterraneo3d.grafica(); return g.pezzi.length >= 9 && g.persone3d && g.persone3d.visibili >= 7 },
    null, { timeout: 20000 }).catch(() => {})
  await fermoASchermo(page, '[data-personaggio="ragazza"]')
  uguale('sopra c\'è il mondo in 3D', await page.locator('[data-mondo3d]').count(), 1)
  uguale('e non la terra dipinta', await page.locator('[data-terra]').count(), 0)
  const g = await grafica(page)
  uguale('lo disegna il mondo di sopra', g.mondo, true)
  controlla('i nove pezzi attorno al villaggio', g.pezzi.length === 9, g.pezzi.join())
  // le persone del villaggio in 3D (docs/sotterraneo/persone-3d.md): quattro o cinque chiamate l'una
  dentro('sotto le 200 chiamate', g.chiamate, 10, 200)
  controlla('le persone del villaggio hanno il modello 3D', g.persone3d && g.persone3d.visibili >= 7, JSON.stringify(g.persone3d))
  dentro('sotto i 400 mila triangoli', g.triangoli, 1000, 400000)
  nota(`dal villaggio: ${g.chiamate} chiamate, ${Math.round(g.triangoli / 1000)}k triangoli, ${g.figure} figure, un pezzo in ${g.msPezzi} ms`)
  // dalla partenza si vedono tutti quelli del villaggio, senza muoversi né girare, e il tocco va a ognuno (non a chi gli sta accanto)
  const gente = await page.evaluate(() => [...document.querySelectorAll('[data-bersaglio][data-citta="villaggio"]')].filter(e => e.matches('[data-personaggio],[data-mercante],[data-minatore]')).map(e => {
    const r = e.getBoundingClientRect(), t = document.elementFromPoint(r.x + r.width / 2, r.y + r.height * 0.6)
    const preso = t && t.closest('[data-bersaglio]')
    return { chi: e.dataset.personaggio || e.dataset.mercante || 'minatore', vis: e.dataset.vis, suo: t === e || e.contains(t),
             preso: preso ? Object.entries(preso.dataset).map(([k, v]) => `${k}=${v}`).join(' ') : t && t.outerHTML.slice(0, 120) }
  }))
  uguale('nel villaggio ci sono i cinque mercanti, la ragazza, il capitano, il tintore e il minatore', gente.map(q => q.chi).sort().join(','),
         ['armaiolo', 'capitano', 'carovaniere', 'erborista', 'incantatrice', 'minatore', 'ragazza', 'rigattiere', 'tintore'].sort().join(','))
  controlla('tutti a schermo dalla partenza', gente.every(q => q.vis === '1'), JSON.stringify(gente.filter(q => q.vis !== '1')))
  controlla('e ognuno si tocca lui', gente.every(q => q.suo), JSON.stringify(gente.filter(q => !q.suo)))
  uguale('niente grate', await page.locator('[data-grata]').count(), 0)
  uguale('i quattordici ingressi, ognuno con la sua zona', await page.locator('[data-posto][data-zona]').count(), Object.keys(INGRESSI_DEL_MONDO).length)
  uguale('otto pietre: il villaggio e una per zona', await page.locator('[data-pietra]').count(), 8)
  uguale('le pietre di zona', await page.locator('[data-pietra^="zona:"][data-zona]').count(), 7)
  await scatto(page, 'sotterraneo-mondo-villaggio')
})

/* ---------- 2. alla prima partita la carta in cima dice dove andare e quanto manca ---------- */
await blocco('la carta della meta', async () => {
  uguale('la meta è la cripta dei re', await page.locator('[data-meta-carta]').getAttribute('data-meta'), 'altare')
  uguale('col suo nome', await carta('[data-meta-nome]').innerText(), 'La cripta dei re')
  const passi = Number(await carta('[data-meta-passi]').getAttribute('data-passi'))
  const [x, y] = await cella(page)
  dentro('e i passi della strada vera', passi, Math.floor(campo.passi(x, y)) - 1, Math.ceil(campo.passi(x, y)) + 1)
  controlla('detti al bambino', /^a \d+ passi$/.test(await carta('[data-meta-passi]').innerText()), await carta('[data-meta-passi]').innerText())
  const ic = await carta('.sot3d-meta-icona').boundingBox()
  controlla('l\'icona si legge (almeno 44 px)', ic.width >= 44 && ic.height >= 44, `${ic.width}×${ic.height}`)
  uguale('niente «portami lì»: per terra ci sono già le luci', await page.locator('[data-azione="portami"]').count(), 0)
  uguale('l\'icona è la cripta fotografata', await carta('[data-ritaglio]').count(), 1)
  const g = await grafica(page)
  controlla('per terra c\'è la scia di luci', g.scia > 10, g.scia)
  // il velo della strada si vede ma non si salva (il bit della nebbia: unita/sotterraneo-meta-sopra): la cripta non è «trovata»
  uguale('la cripta non è trovata per finta', await page.locator('[data-posto="altare"]').getAttribute('data-trovato'), '0')
  await scatto(page, 'sotterraneo-meta-carta')
})

/* ---------- 3. la vista col dito ---------- */
await blocco('la vista coi gesti', async () => {
  const c0 = await cam()
  controlla('di norma la vista segue l\'eroe', !c0.libera)
  uguale('e non c\'è il tasto «torna all\'eroe»', await page.locator('[data-torna-eroe]').count(), 0)
  nota(`schermo ${Math.round(b0.width)}×${Math.round(b0.height)}: ${c0.larghi.toFixed(1)} celle in largo a zoom ${c0.zoom}, limiti ${c0.lim.min}–${c0.lim.max.toFixed(2)}`)

  // un dito che scorre sposta la vista, l'eroe resta fermo
  const eroe0 = await cella(page)
  { const x = await puntoLibero(cx + 80, cy); await trascina(x, cy, x - 160, cy) }
  const torna = await page.waitForSelector('[data-torna-eroe]', { timeout: 5000 }).then(() => true, () => false)
  {
    const c = await cam()
    controlla('la vista si è staccata', c.libera)
    controlla('e si è spostata verso destra (il dito è andato a sinistra)', c.x - c0.x > 3, `${c0.x.toFixed(1)} → ${c.x.toFixed(1)}`)
    uguale('l\'eroe è rimasto dov\'era', (await cella(page)).join(), eroe0.join())
    uguale('e non cammina', await page.locator('[data-eroe-mondo]').getAttribute('data-cammina'), '0')
    controlla('compare «torna all\'eroe»', torna)
    await scatto(page, 'sotterraneo-mondo-vista-trascinata')
  }

  // un tocco sul prato nella vista spostata: l'eroe ci va, e la vista lo riprende
  {
    // un prato a 3–6 passi, il più lontano da chi sta fermo (vicino a una persona o alla bacheca il tocco è un'altra cosa)
    const gente = await page.evaluate(() => window.__mondo3d.bersagli().map(q => q.accanto))
    const io = await page.evaluate(() => window.__mondo3d.io)
    let meta = null, voto = 0
    for (let dz = -6; dz <= 6; dz++) for (let dx = -6; dx <= 6; dx++) {
      const c = { x: Math.floor(io.x) + dx, y: Math.floor(io.z) + dz }, r = Math.hypot(dx, dz)
      if (r < 3 || r > 6 || !terra.passa(c.x, c.y)) continue
      const d = Math.min(...gente.map(g => Math.hypot(g.x - c.x, g.y - c.y)))
      if (d > voto) { voto = d; meta = c }
    }
    controlla('c\'è un prato lontano da tutti (almeno 2 passi)', voto >= 2, String(voto))
    const p = await schermoDi(meta.x + 0.5, meta.y + 0.5)
    await tocca(p.x, p.y)
    controlla('toccando il prato la vista torna a seguire l\'eroe', await segue())
    await page.waitForFunction(c => document.querySelector('[data-eroe-mondo]').dataset.cella !== c, eroe0.join(), { timeout: 10000 }).catch(() => {})
    await fermoNelMondo(page)
    const e1 = await cella(page)
    controlla('e l\'eroe è arrivato dove si è toccato', Math.hypot(e1[0] - meta.x, e1[1] - meta.y) <= 1, `${eroe0} → ${e1} (toccato ${meta.x},${meta.y})`)
  }

  // «torna all'eroe»: verso est, e se il bordo del mondo lo impedisce verso ovest
  for (const verso of [-1, 1]) {
    const x = await puntoLibero(cx - verso * 90, cy)
    await trascina(x, cy, x + verso * 180, cy)
    if (await page.locator('[data-torna-eroe]').count()) break
  }
  await page.waitForSelector('[data-torna-eroe]', { timeout: 5000 })
  controlla('di nuovo staccata', (await cam()).libera)
  const eroe1 = await cella(page)
  await page.click('[data-torna-eroe]')
  controlla('il tasto riporta la vista all\'eroe', await segue())
  const via = await page.waitForSelector('[data-torna-eroe]', { state: 'detached', timeout: 3000 }).then(() => true, () => false)
  controlla('e sparisce', via)
  uguale('senza muovere l\'eroe', (await cella(page)).join(), eroe1.join())

  // il pizzico zooma, e non è un tocco (i limiti in numeri: unita/sotterraneo-mondo-vista)
  {
    const prima = await cam()
    await pizzica(cx, cy, 240, 120)   // le dita si avvicinano: la telecamera si allontana
    const lontano = await cam()
    controlla('avvicinando le dita si allontana', lontano.zoom > prima.zoom + 0.1, `${prima.zoom} → ${lontano.zoom}`)
    controlla('e si vedono più celle', lontano.larghi > prima.larghi + 1, `${prima.larghi.toFixed(1)} → ${lontano.larghi.toFixed(1)}`)
    uguale('il pizzico non ha fatto camminare l\'eroe', (await cella(page)).join(), eroe1.join())
    controlla('né staccato la vista', !lontano.libera)
    await pizzica(cx, cy, 80, 600)    // si allargano molto: ci si avvicina fino al minimo
    const vicino = await cam()
    controlla('allargando le dita ci si avvicina', vicino.zoom < lontano.zoom)
    uguale('e si ferma al minimo', vicino.zoom, vicino.lim.min)
    await pizzica(cx, cy, 300, 20)    // e al massimo
    const max = await cam()
    uguale('stringendo molto si ferma al massimo', max.zoom, max.lim.max)
    await scatto(page, 'sotterraneo-mondo-vista-zoom-massimo')
    await page.evaluate(() => { window.__sotterraneo3d.zoom = 1.1 })
  }

  // col mouse: a tasto premuto si trascina, la rotella zooma
  {
    const prima = await cam()
    const mx = await puntoLibero(cx + 60, cy)
    await page.mouse.move(mx, cy)
    await page.mouse.down()
    for (let i = 1; i <= 8; i++) { await page.mouse.move(mx - i * 15, cy + i * 4); await attendi(page, 30) }
    await page.mouse.up()
    await attendi(page, 300)
    const dopo = await cam()
    controlla('il mouse a tasto premuto sposta la vista', dopo.libera && Math.hypot(dopo.x - prima.x, dopo.z - prima.z) > 2, `${prima.x.toFixed(1)},${prima.z.toFixed(1)} → ${dopo.x.toFixed(1)},${dopo.z.toFixed(1)}`)
    await page.mouse.move(cx + 100, cy - 60)   // senza tasto premuto no
    await attendi(page, 300)
    const fermo = await cam()
    // il punto guardato, non la telecamera: quella sta ancora finendo di avvicinarsi dopo lo zoom di prima
    controlla('senza tasto non sposta nulla', Math.abs(fermo.lx - dopo.lx) < 0.2 && Math.abs(fermo.lz - dopo.lz) < 0.2)
    await page.mouse.wheel(0, 300)
    const ruota = await page.waitForFunction(() => window.__sotterraneo3d.cam.zoom > 1.1, null, { timeout: 3000 }).then(() => true, () => false)
    controlla('la rotella zooma', ruota, `${(await cam()).zoom}`)
    await page.click('[data-torna-eroe]')
    await segue()
  }

  // la vista lontana dall'eroe: le zone dell'eroe restano, e i pezzi di dove si guarda si costruiscono
  {
    const prima = await page.evaluate(() => window.__sotterraneo3d.grafica().pezzi)
    { const x = await puntoLibero(cx + 140, cy); for (let i = 0; i < 4; i++) await trascina(x, cy, x - 280, cy, 6) }
    await page.waitForFunction(p => window.__sotterraneo3d.grafica().pezzi.some(k => !p.includes(k)), prima, { timeout: 15000 }).catch(() => {})
    const eroe = await page.evaluate(() => ({ x: window.__mondo3d.io.x, z: window.__mondo3d.io.z }))
    const dopo = await page.evaluate(() => ({ zone: window.__mondo3d.m.zonaCaricata.map((v, k) => v ? k : -1).filter(k => k >= 0), pezzi: window.__sotterraneo3d.grafica().pezzi, chiamate: window.__sotterraneo3d.grafica().chiamate }))
    const kEroe = zonaDi(m, Math.floor(eroe.x), Math.floor(eroe.z))
    controlla('la zona dell\'eroe resta caricata', dopo.zone.includes(kEroe), `eroe ${kEroe}, caricate ${dopo.zone}`)
    controlla('i pezzi attorno a dove si guarda si costruiscono', dopo.pezzi.some(p => !prima.includes(p)), `${prima} → ${dopo.pezzi}`)
    dentro('niente più di 12 pezzi', dopo.pezzi.length, 1, 12)
    dentro('sotto le 150 chiamate', dopo.chiamate, 10, 150)
    nota(`vista spostata: ${dopo.pezzi.length} pezzi, ${dopo.chiamate} chiamate, zone ${dopo.zone} (eroe nella ${kEroe})`)
    await scatto(page, 'sotterraneo-mondo-vista-lontana')
    uguale('l\'eroe non si è mosso', (await cella(page)).join(), eroe1.join())
    await page.click('[data-torna-eroe]')
    await segue()
  }
})

/* ---------- 4. un tocco su una persona resta un tocco: l'eroe va da lei, la vista lo segue, e lei parla ---------- */
await blocco('la ragazza toccata', async () => {
  await toccaSopra(page, '[data-personaggio="ragazza"]', tocca)   // porta la vista da lei, poi la tocca
  const parla = await page.waitForSelector('[data-dialogo="ragazza"]', { timeout: 60000 }).then(() => true, () => false)
  controlla('toccata la ragazza, l\'eroe va da lei e si apre il suo dialogo', parla)
  controlla('e la vista lo segue', await segue())
  const ok = await page.waitForSelector('[data-ritratto-dialogo] [data-anteprima-chiave="persona:ragazza"]', { state: 'attached', timeout: 15000 }).then(() => true, () => false)
  controlla('il ritratto del dialogo è la faccia del modello 3D', ok, await page.evaluate(() => (document.querySelector('[data-ritratto-dialogo]') || {}).innerHTML))
  await scatto(page, 'sotterraneo-mondo-ragazza')
  await nelDialogo(page, '[data-scelta="ciao"]')
  await page.waitForSelector('[data-dialogo]', { state: 'detached', timeout: 5000 })
})

/* ---------- 5. il fabbro: si va da lui e si apre la bottega ---------- */
await blocco('la bottega del fabbro', async () => {
  await toccaSopra(page, '[data-mercante="armaiolo"][data-citta="villaggio"]', tocca)
  await page.waitForSelector('[data-dialogo="armaiolo"]', { timeout: 60000 })
  await nelDialogo(page, '[data-scelta="bottega"]')
  const aperta = await page.waitForSelector('[data-bottega][data-mercante-aperto="armaiolo"]', { timeout: 8000 }).then(() => true, () => false)
  controlla('la bottega del fabbro si apre', aperta)
  const ok = await page.waitForSelector('[data-bottega] .sot-targa [data-anteprima-chiave="persona:armaiolo"]', { state: 'attached', timeout: 30000 }).then(() => true, () => false)
  controlla('col ritratto 3D del fabbro', ok, await page.evaluate(() => (document.querySelector('[data-bottega] .sot-targa') || {}).innerHTML))
  await scatto(page, 'sotterraneo-mondo-bottega')
  await page.click('[data-bottega] [data-chiudi]')
  await page.waitForSelector('[data-bottega]', { state: 'detached', timeout: 5000 })
})

/* ---------- 6. la pietra del villaggio: si accende con una domanda, e solo rispondendo giusto ---------- */
await blocco('la pietra del villaggio', async () => {
  const allaPietra = () => vaiETocca(page, '[data-pietra="villaggio"]', 'pietra:villaggio', tocca, { atteso: '[data-pietra-domanda] .qz-tasto' })
  await allaPietra()
  await scatto(page, 'sotterraneo-mondo-pietra-domanda')
  await domandaPronta(page)   // i 320 ms ciechi della domanda appena nata (CIECA, quiz/Domanda.vue)
  await page.locator('[data-pietra-domanda] .qz-tasto:not([data-giusta])').first().click()
  // sbagliando la domanda resta a dire il perché e come si fa, il tempo di leggerlo (quiz/Domanda.vue)
  await page.waitForSelector('[data-pietra-domanda]', { state: 'detached', timeout: 40000 })
  uguale('sbagliando la pietra resta spenta', await page.locator('[data-pietra="villaggio"]').getAttribute('data-accesa'), '0')
  await allaPietra()
  await attendi(page, 400)
  await page.locator('[data-pietra-domanda] .qz-tasto[data-giusta]').first().click()
  const accesa = await page.waitForSelector('[data-pietra="villaggio"][data-accesa="1"]', { timeout: 8000 }).then(() => true, () => false)
  controlla('rispondendo giusto la pietra si accende', accesa)
  await page.waitForSelector('[data-fumetto-di="pietra"]', { timeout: 8000 })
  uguale('e dice che da sola non porta ancora da nessuna parte', await page.locator('[data-fumetto-di="pietra"] [data-nessuna-meta]').count(), 1)
  await scatto(page, 'sotterraneo-mondo-pietra')
})

/* ---------- 7. la veduta d'insieme: costa poco, ha la meta e nessuna tana non trovata, e un tocco manda a piedi ---------- */
await blocco('la veduta d\'insieme', async () => {
  await veduta(page, true)
  await fermoASchermo(page, '[data-nome-posto="citta:villaggio"]')
  const g = await grafica(page)
  uguale('la veduta è accesa', g.veduta, true)
  dentro('nella veduta sotto le 100 chiamate', g.chiamate, 5, 100)
  nota(`la veduta: ${g.chiamate} chiamate, ${Math.round(g.triangoli / 1000)}k triangoli`)
  uguale('il nome del villaggio', await page.locator('[data-nome-posto="citta:villaggio"]').count(), 1)
  uguale('la meta c\'è, anche non trovata', await page.locator('[data-nome-posto="meta:altare"]').count(), 1)
  controlla('col suo nome', (await page.locator('[data-nome-posto="meta:altare"]').innerText()).includes('La cripta dei re'))
  uguale('e il segno «tu»', await page.locator('[data-nome-posto="eroe"]').count(), 1)
  // la tana si segna solo da quando la sua cella è stata vista (docs/sotterraneo/mondo-3d.md, «La tana»): dalla piazza, nessuna
  uguale('nessuna tana: non se n\'è trovata nessuna', await nomiTana().count(), 0)
  await scatto(page, 'sotterraneo-mondo-veduta')
  await toccaFermo(page, '[data-nome-posto="meta:altare"]', tocca)
  await page.waitForSelector('[data-veduta]', { state: 'detached', timeout: 5000 })
  const va = await page.waitForSelector('[data-eroe-mondo][data-cammina="1"]', { state: 'attached', timeout: 5000 }).then(() => true, () => false)
  controlla('toccata la meta, la veduta si chiude e l\'eroe ci va a piedi', va)

  // si riparte dalla piazza (il salto delle prove) e si tocca la strada maestra, a una trentina di celle: nella veduta una cella è
  // meno di due pixel e i nomi dei posti coprono quello che hanno attorno (l'eroe arriva a qualche cella: il tocco cade sul terreno che sale)
  await page.evaluate(() => window.__mondo3d.vai('ragazza'))
  await veduta(page, true)
  await fermoASchermo(page, '[data-nome-posto="citta:villaggio"]')
  const [x0, y0] = await cella(page)
  const t = m.tracciato.find(q => q.s >= 30), meta = { x: Math.round(t.x), y: Math.round(t.y) }
  const p = await schermoDi(meta.x + 0.5, meta.y + 0.5)
  await tocca(p.x, p.y)
  const chiusa = await page.waitForSelector('[data-veduta]', { state: 'detached', timeout: 3000 }).then(() => true, () => false)
  controlla('toccando la strada, la veduta si chiude', chiusa)
  await page.waitForSelector('[data-eroe-mondo][data-cammina="1"]', { state: 'attached', timeout: 5000 }).catch(() => {})
  await fermoNelMondo(page)
  const [x1, y1] = await cella(page)
  controlla('e l\'eroe ci è andato a piedi', Math.hypot(x1 - meta.x, y1 - meta.y) <= 6 && Math.hypot(x1 - x0, y1 - y0) > 20, `${x0},${y0} → ${x1},${y1} (toccato ${meta.x},${meta.y})`)
})

/* ---------- 8. il cartello del villaggio dice quale freccia porta alla meta ---------- */
await blocco('il cartello', async () => {
  const k = await page.evaluate(() => window.__mondo3d.bersagli().find(b => b.ruolo === 'cartello' && b.citta === 'villaggio').chiave)
  await vaiETocca(page, '[data-cartello="villaggio"]', k, tocca, { atteso: '[data-fumetto-di="cartello"]' })
  uguale('una freccia sola porta alla meta', await page.locator('[data-fumetto-di="cartello"] [data-freccia-meta]').count(), 1)
  controlla('e lo dice con le luci', /cripta dei re: segui le luci azzurre/.test(await page.locator('[data-freccia-meta]').innerText()))
  await scatto(page, 'sotterraneo-meta-cartello')
})

/* ---------- 9. la tana del cimitero: davanti quanto costa; nella veduta il teschio, e grigio a signore morto ---------- */
await blocco('la tana', async () => {
  await page.evaluate(([x, y]) => window.__mondo3d.porta(x + 0.5, y + 4.5), [CIMITERO.tana.x, CIMITERO.tana.y])
  await page.waitForFunction(z => window.__sotterraneo3d.pronto && window.__sotterraneo3d.grafica().zone.includes(z), CIMITERO.zona, { timeout: 30000 })
  await page.waitForFunction(() => window.__sotterraneo3d.grafica().pezzi.length >= 6, null, { timeout: 15000 }).catch(() => {})
  // la nebbia si apre attorno all'eroe arrivato: la tana si segna nella veduta da quando il suo cuore è stato visto
  await page.waitForFunction(([x, y]) => window.__sotterraneo3d.visto(x + 0.5, y + 0.5), [CIMITERO.tana.x, CIMITERO.tana.y], { timeout: 15000 }).catch(() => {})
  const g = await grafica(page)
  dentro('davanti alla tana sotto le 150 chiamate', g.chiamate, 10, 150)
  dentro('e sotto i 400 mila triangoli', g.triangoli, 1000, 400000)
  nota(`davanti alla tana del cimitero: ${g.chiamate} chiamate, ${Math.round(g.triangoli / 1000)}k triangoli`)
  await scatto(page, 'sotterraneo-mondo-tana')
  await veduta(page, true)
  const t = page.locator('[data-nome-posto="tana:cimitero"]')
  uguale('la tana trovata è nella veduta', await t.count(), 1)
  uguale('col suo teschio', (await t.innerText()).trim(), '💀')
  controlla('acceso: il signore è vivo', !(await t.getAttribute('class')).includes('sot3d-nome-morta'), await t.getAttribute('class'))
  controlla('e le tane non trovate non ci sono', (await nomiTana().count()) <= 2, await nomiTana().count())
  await scatto(page, 'sotterraneo-mondo-tana-veduta')
  await veduta(page, false)
  await page.evaluate(() => window.__mondo3d.stato().signoriMorti.add('cimitero'))
  await veduta(page, true)
  uguale('morto il signore la tana c\'è ancora', await t.count(), 1)
  controlla('ma è spenta (grigia)', (await t.getAttribute('class')).includes('sot3d-nome-morta'), await t.getAttribute('class'))
  await veduta(page, false)
})

/* ---------- 10. un salto lontano: la zona si carica, il cartello della zona, i suoi pezzi ---------- */
await blocco('una zona lontana', async () => {
  await page.evaluate(() => window.__mondo3d.vai('ingresso:palafitta'))
  const annuncio = await page.waitForSelector('[data-annuncio-zona][data-zona="palude"]', { timeout: 20000 }).then(() => true, () => false)
  controlla('entrando, il cartello della zona dice il suo nome', annuncio)
  // le zone si caricano una per fotogramma: si aspetta che ci siano tutte e tre (e che le altre siano andate), poi si guarda
  await page.waitForFunction(() => { const g = window.__sotterraneo3d.grafica(); return window.__sotterraneo3d.pronto && g.zone.join() === '2,3,4' && g.pezzi.length >= 6 },
    null, { timeout: 30000 }).catch(() => {})
  const g = await grafica(page)
  uguale('l\'eroe è nella palude', g.zona, 3)
  controlla('caricate la palude e le due accanto, e basta', g.zone.join() === '2,3,4', g.zone.join())
  controlla('e i pezzi attorno', g.pezzi.length >= 6, g.pezzi.join())
  dentro('sotto le 200 chiamate', g.chiamate, 10, 200)
  dentro('sotto i 400 mila triangoli', g.triangoli, 1000, 400000)
  const ms = g.msZone.map(z => z.ms)
  nota(`nella palude: ${g.chiamate} chiamate, ${Math.round(g.triangoli / 1000)}k triangoli; una zona si carica in ${Math.min(...ms)}–${Math.max(...ms)} ms`)
  await scatto(page, 'sotterraneo-mondo-palude')
})

/* ---------- 11. la cripta dei re: si tocca l'ingresso, si scende, si lascia perdere e si torna davanti, con tutto salvato ---------- */
await blocco('la cripta, giù e su', async () => {
  await scendiDa(page, 'altare', tocca)
  uguale('giù è la discesa 3D di sempre', (await grafica(page)).scenario, CAMPAGNA[0].scenario)
  await lasciaLaDiscesa(page)
  await mondoPronto(page)
  const [x, y] = await cella(page)
  controlla('risalendo si è davanti all\'ingresso della cripta', Math.hypot(x - cripta.accanto.x, y - cripta.accanto.y) <= 2, `${x},${y}`)
  const p = await leggiProfilo(page)
  const mo = p?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.mondo
  uguale('la nebbia del mondo è salvata in base64 (un bit per cella, 504×300)', mo?.nebbia?.length, Math.ceil(Math.ceil(m.W * m.H / 8) * 4 / 3))
  uguale('con la firma della mappa', mo?.firma, m.firma)
  controlla('e la pietra accesa resta accesa', (mo?.pietre || []).includes('villaggio'), JSON.stringify(mo?.pietre))
  uguale('il campo del 2D non si tocca', p?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.terra, undefined)
  await scatto(page, 'sotterraneo-mondo-ritorno')
})

/* ---------- 12. saliti dal portale (quattro porte chiuse, la quinta lasciata): il gemello e il capitano col «!» nel villaggio ---------- */
await blocco('dal portale, nel villaggio', async () => {
  const k = 4, roba = robaAttesa('cavaliere', k, { gemme: 5 }), crescita = crescitaAttesa('cavaliere', k)
  const c = new Corsa(CAMPAGNA[k], { seme: 21, eroe: 'cavaliere', roba, crescita, rnd: seminato(21) })
  const sosta = scrivi(c, k, { via: VIA_PORTALE })
  const stelle = Object.fromEntries(Array.from({ length: k }, (_, i) => [i, 3]))
  const a = { tappa: k, libera: false, stelle, missioni: {}, roba, crescita, sosta, mondo: { dove: { portale: true } } }
  await entraSopra(page, { coins: 300, settings: { sperimentali: true }, campagne: { sotterraneo: { tappa: k, libera: false, stelle, cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: a } } } } })
  uguale('il gemello della quinta discesa sta nel villaggio', await page.locator('[data-portale][data-citta="villaggio"]').count(), 1)
  uguale('nessuna fontana: il villaggio ha la guaritrice e l\'incantatrice', await page.locator('[data-fontana]').count(), 0)
  uguale('il capitano sta nel villaggio', await page.locator('[data-personaggio="capitano"][data-citta="villaggio"]').count(), 1)
  uguale('e ha il «!»', await page.locator('[data-personaggio="capitano"]').getAttribute('data-segno'), 'nuova')
  await vaiETocca(page, '[data-personaggio="capitano"]', 'capitano', tocca, { atteso: '[data-dialogo="capitano"]' })
  let detto = ''
  for (let n = 0; n < 12; n++) {
    await attendi(page, 380)
    detto += ' ' + await page.locator('[data-dialogo-testo]').innerText()
    if (await page.locator('[data-dialogo][data-ultima]').count()) break
    await page.click('[data-dialogo-testo]')
  }
  controlla('dice la quinta porta', detto.includes('Gorgo') && detto.includes('Le sale allagate'), detto)
  await scatto(page, 'sotterraneo-mondo-capitano')
  await page.click('[data-dialogo] [data-scelta="ciao"]')
  await page.waitForSelector('[data-dialogo]', { state: 'detached', timeout: 5000 })
  uguale('detto, il «!» se ne va', await page.locator('[data-personaggio="capitano"]').getAttribute('data-segno'), null)
  await page.evaluate(() => window.__mondo3d.vai(window.__mondo3d.bersagli().find(b => b.ruolo === 'portale').chiave))
  await scenaPronta(page)
  const b = await fermoASchermo(page, '[data-portale]')
  await tocca(b.x + b.width / 2, b.y + b.height * 0.6)
  const giu = await page.waitForSelector('[data-fumetto-di="portale"] [data-azione="portale-giu"]', { timeout: 20000 }).then(() => true, () => false)
  controlla('toccato, il portale riporta giù', giu)
  await scatto(page, 'sotterraneo-mondo-portale')
})

uguale('nessun errore in console', errori.join(' | '), '')
await browser.close()
riassunto('il mondo di sopra, col dito')
