/* ═══════════════════════════════════════════════════════════════════
   IL BANCO DELLE PERDITE DEL SOTTERRANEO 3D (soak test)

   Apre il file costruito in Chrome senza schermo (col GC a mano) e ripete
   a ciclo, senza mai ricaricare la pagina, quello che fa chi gioca: uno
   scontro in una discesa (paesaggi a giro), lo zaino con le anteprime e
   un cambio di roba, la risalita, il mondo di sopra attraversando le
   zone, uno scontro sul prato, un dialogo e una bottega coi ritratti, la
   discesa in un dungeon dal suo ingresso, l'uscita in home. Dopo ogni
   ciclo forza il GC e conta: oggetti di three vivi (geometrie,
   materiali, trame, Object3D), contesti WebGL e tele vivi, heap, nodi
   DOM, ascoltatori, timer, i callback di requestAnimationFrame per
   fotogramma, e quello che dice la scena. Alla fine una retta per ogni
   grandezza (pendenza per ciclo, r²): cresce sempre con r² alto = perde.
   Esce con 1 se una pendenza passa la sua soglia. Non misura tempi: i
   conteggi valgono anche sul computer carico.

     npm run build && node strumenti/perdite-3d.mjs
     node strumenti/perdite-3d.mjs --cicli 40 --caldi 5 --solo discesa,zaino,mondo,dialoghi,dungeon
     node strumenti/perdite-3d.mjs --resta --solo zaino,mondo,dialoghi   # sempre nella stessa scena del mondo di sopra
     node strumenti/perdite-3d.mjs --giu                                 # nell'abisso, un piano più giù a ciclo
     node strumenti/perdite-3d.mjs --veri fps-sot,fps-villaggio --corto  # gli fps veri della misura del telefono, una riga per scena

   Per cercare chi tiene una cosa che cresce: `--chi WebGL2RenderingContext` (la via più corta dalle
   radici, dalla fotografia dello heap), `--nuovi materiali` (nati nel penultimo ciclo e vivi alla fine,
   per tipo, e chi li tiene), `--segna 'geometrie:o => …'`, `--elenca materiali`, `--senza-dispose` (le
   geometrie e le trame lasciate al GC senza `dispose()`).

   docs/sotterraneo/prestazioni-3d-perdite.md
   ═══════════════════════════════════════════════════════════════════ */
import { existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const argv = process.argv.slice(2)
const opz = (nome, difetto = null) => { const i = argv.indexOf('--' + nome); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : difetto }
const CICLI = Number(opz('cicli', 30)), CALDI = Number(opz('caldi', 5))
const FASI = new Set((opz('solo', 'discesa,zaino,mondo,dialoghi,dungeon')).split(','))
const RESTA = argv.includes('--resta'), GIU = argv.includes('--giu')
const dist = resolve(opz('dist', 'dist/index.html'))
if (!existsSync(dist)) { console.error(`manca ${dist}: prima npm run build`); process.exit(1) }
process.env.DIST = dist
const { apriBrowser, apriGioco, semina, attendi, scegliAttacco, mondoPronto, toccaNelMondo, nelDialogo, lasciaLaDiscesa, scendiNelMondo } =
  await import('../test/aiuto/browser.mjs')
const { campagnaSeminata } = await import('../test/aiuto/sotterraneo-semina.mjs')
const { ilMondoIntero } = await import('../src/giochi/sotterraneo/motore/mondo-sopra.js')

// le soglie: pendenza per ciclo oltre la quale (con r² ≥ 0,5) è una perdita. `--soglia geometrie=2,heapMB=1`
const SOGLIE = { geometrie: 1, materiali: 1, trame: 0.5, oggetti3d: 5, contesti: 0.05, tele: 0.5, heapMB: 0.5, nodi: 5, ascoltatori: 1, timer: 0.5, rafPerFot: 0.05,
  ...Object.fromEntries((opz('soglia', '') || '').split(',').filter(Boolean).map(s => s.split('=')).map(([k, v]) => [k, Number(v)])) }

const SCENARI = ['grotta', 'neve', 'ghiaccio', 'palude', 'tempio', 'miniera']
const TIPI = ['scheletro', 'goblin', 'ratto,goblin', 'zombie', 'ragno', 'orco']
const ZAINO = ['spada', 'scudo-ferro', 'corazza', 'elmo']

// ── la pagina: GC a mano, e i contatori messi prima del gioco (ascoltatori, timer, rAF, contesti WebGL) ──
const browser = await apriBrowser({ args: ['--js-flags=--expose-gc', '--enable-precise-memory-info'] })
const { page, errori } = await apriGioco(browser, { attesa: null, indirizzo: 'file://' + dist, pixel: 1 })
await page.addInitScript(contatori)
const cdp = await page.context().newCDPSession(page)
// una maniglia di Playwright (waitForSelector, waitForFunction) tiene vivo il suo elemento finché non la si butta: in un banco lungo
// tiene in vita le scene vecchie attraverso i loro elementi staccati (nello heap: «DevTools console»), una perdita finta. Si buttano subito
for (const k of ['waitForSelector', 'waitForFunction']) {
  const o = page[k].bind(page)
  page[k] = async (...a) => { const h = await o(...a); if (h) await h.dispose().catch(() => {}); return !!h }
}

function contatori() {
  // gli ascoltatori: ogni (bersaglio, tipo, funzione, cattura) una volta; quando il bersaglio muore i suoi escono dal conto
  const per = new WeakMap(), fine = new FinalizationRegistry(n => { C.ascoltatori -= n.n })
  const C = window.__perdite = { ascoltatori: 0, timer: new Set(), intervalli: new Set(), raf: 0, contesti: [], fot: 0 }
  const T = EventTarget.prototype, add = T.addEventListener, rem = T.removeEventListener
  const chiave = (tipo, fn, o) => tipo + '|' + (typeof o === 'boolean' ? o : !!(o && o.capture))
  T.addEventListener = function (tipo, fn, o) {
    if (fn) {
      let m = per.get(this)
      if (!m) { m = { mappa: new Map(), conto: { n: 0 } }; per.set(this, m); fine.register(this, m.conto) }
      const k = chiave(tipo, fn, o)
      let s = m.mappa.get(k); if (!s) m.mappa.set(k, s = new Set())
      if (!s.has(fn)) { s.add(fn); m.conto.n++; C.ascoltatori++ }
    }
    return add.call(this, tipo, fn, o)
  }
  T.removeEventListener = function (tipo, fn, o) {
    const m = per.get(this), s = m && m.mappa.get(chiave(tipo, fn, o))
    if (s && s.delete(fn)) { m.conto.n--; C.ascoltatori-- }
    return rem.call(this, tipo, fn, o)
  }
  // i timer vivi: un setTimeout finché non scatta o si cancella, un setInterval finché non si cancella
  const st = window.setTimeout, ct = window.clearTimeout, si = window.setInterval, ci = window.clearInterval
  window.setTimeout = function (f, ms, ...a) { const id = st.call(window, (...b) => { C.timer.delete(id); if (typeof f === 'function') f(...b) }, ms, ...a); C.timer.add(id); return id }
  window.clearTimeout = id => { C.timer.delete(id); return ct.call(window, id) }
  window.setInterval = function (...a) { const id = si.apply(window, a); C.intervalli.add(id); return id }
  window.clearInterval = id => { C.intervalli.delete(id); return ci.call(window, id) }
  // requestAnimationFrame: quanti callback per fotogramma (un giro che si raddoppia dopo un'entrata e un'uscita si vede qui)
  const raf = window.requestAnimationFrame
  window.requestAnimationFrame = function (f) { C.raf++; return raf.call(window, f) }
  ;(function conta() { C.fot++; raf.call(window, conta) })()
  // i contesti WebGL chiesti, tenuti deboli: quanti vivi e quanti non persi
  const gc = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (tipo, ...a) {
    const x = gc.call(this, tipo, ...a)
    if (x && /webgl/.test(tipo) && !C.contesti.some(w => w.deref() === x)) C.contesti.push(new WeakRef(x))
    return x
  }
}

// ── la misura: GC due volte, poi i conteggi in pagina e gli oggetti vivi per prototipo (CDP queryObjects) ──
async function quantiCon(espr, fn = 'function () { return this.length }') {
  const { result } = await cdp.send('Runtime.evaluate', { expression: espr, objectGroup: 'perdite' })
  if (!result.objectId) return null
  const { objects } = await cdp.send('Runtime.queryObjects', { prototypeObjectId: result.objectId, objectGroup: 'perdite' })
  const { result: n } = await cdp.send('Runtime.callFunctionOn', { functionDeclaration: fn, objectId: objects.objectId, returnByValue: true })
  return n.value
}
async function misura(dove) {
  // la console tiene vivo quello che vi si è scritto (un avviso con un oggetto): non è del gioco, si butta prima di contare
  await cdp.send('Runtime.discardConsoleEntries').catch(() => {})
  await page.evaluate(async () => { for (let i = 0; i < 2; i++) { window.gc(); await new Promise(r => setTimeout(r, 120)) } })
  const p = await page.evaluate(async () => {
    const C = window.__perdite, f0 = C.fot, r0 = C.raf
    await new Promise(r => setTimeout(r, 1000))
    const fot = Math.max(1, C.fot - f0), S = window.__sotterraneo3d, A = window.__anteprime3d
    let mesh = 0, figli = 0
    const sc = S && S.scena
    // le mesh per elemento della scena (grafica/elementi3d.js, `userData.elemento3d`, ereditato dai figli): dice chi cresce
    const per = {}
    const conta = (o, e) => { e = (o.userData && o.userData.elemento3d) || e; if (o.isMesh || o.isPoints || o.isLine || o.isSprite) { mesh++; per[e || '?'] = (per[e || '?'] || 0) + 1 } for (const c of o.children) conta(c, e) }
    if (sc) { figli = sc.children.length; conta(sc, null) }
    const g = S && S.grafica ? S.grafica() : null, a = A && A.stato ? A.stato() : null
    return {
      heapMB: performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null, totMB: performance.memory ? performance.memory.totalJSHeapSize / 1048576 : null,
      nodi: document.getElementsByTagName('*').length, teleDom: document.querySelectorAll('canvas').length,
      ascoltatori: C.ascoltatori, timer: C.timer.size, intervalli: C.intervalli.size,
      rafPerFot: Math.round((C.raf - r0) / fot * 100) / 100,
      contestiVivi: C.contesti.filter(w => { const x = w.deref(); return x && !x.isContextLost() }).length,
      scena: g ? { dove: g.mondo ? 'mondo' : 'giu', figli, mesh, geo: g.memoria.geometries, tex: g.memoria.textures, programmi: g.programmi, chiamate: g.chiamate, ...(g.modelli3d != null ? { modelli: g.modelli3d } : {}), ...(g.effetti3d != null ? { effetti: g.effetti3d } : {}), ...(g.zone ? { zone: g.zone.length } : {}), per } : null,
      anteprime: a ? { disegnate: a.disegnate, renderer: a.renderer, aperto: a.aperto } : null,
    }
  })
  // gli oggetti di three vivi: i prototipi si prendono dalla prima scena vista (le classi del pacchetto, con i nomi minimizzati)
  await page.evaluate(() => {
    if (window.__protiTre || !window.__sotterraneo3d || !window.__sotterraneo3d.scena) return
    const base = o => { let p = Object.getPrototypeOf(o); while (Object.getPrototypeOf(Object.getPrototypeOf(p)) !== Object.prototype) p = Object.getPrototypeOf(p); return p }
    let m = null
    window.__sotterraneo3d.scena.traverse(o => { if (!m && o.isMesh && o.material && !Array.isArray(o.material) && o.material.map) m = o })
    if (!m) return
    window.__protiTre = { geometrie: base(m.geometry), materiali: base(m.material), trame: base(m.material.map), oggetti3d: base(m), dispatcher: Object.getPrototypeOf(base(m)) }
  })
  // `--senza-dispose`: le geometrie e le trame caricate da un renderer e poi perse senza `dispose()` (le prende il GC, e con loro la
  // memoria della GPU: ma il GC non sa quanta GPU tengono, e su un telefono può non passare per un pezzo). Per tipo, a fine prova
  if (argv.includes('--senza-dispose')) await page.evaluate(() => {
    const P = window.__protiTre && window.__protiTre.dispatcher
    if (!P || P.__senzaDispose) return
    P.__senzaDispose = true
    const conto = window.__senzaDispose = {}
    const fr = new FinalizationRegistry(d => { conto[d] = (conto[d] || 0) + 1 })
    const add = P.addEventListener, dis = P.dispatchEvent
    const descr = o => o.isBufferGeometry ? `geometria ${o.type} ${Object.keys(o.attributes).join('+')} ${o.attributes.position ? o.attributes.position.count : 0}v${o.name ? ' «' + o.name + '»' : ''}`
      : o.isTexture ? `trama ${o.constructor.name}${o.image && o.image.width ? ' ' + o.image.width + 'x' + o.image.height : ''}${o.name ? ' «' + o.name + '»' : ''}` : null
    P.addEventListener = function (tipo, fn) {
      if (tipo === 'dispose' && !this.__seguita) { const d = descr(this); if (d) { this.__seguita = true; fr.register(this, d, this) } }
      return add.call(this, tipo, fn)
    }
    P.dispatchEvent = function (e) { if (e && e.type === 'dispose' && this.__seguita) { fr.unregister(this); this.__seguita = false } return dis.call(this, e) }
  })
  for (const k of ['geometrie', 'materiali', 'trame', 'oggetti3d'])
    p[k] = await quantiCon(`window.__protiTre && window.__protiTre.${k}`)
  // gli ArrayBuffer (i vertici, gli indici, i pixel delle trame in JS) stanno fuori dallo heap di performance.memory
  try { const u = await cdp.send('Runtime.getHeapUsage'); if (u.backingStorageSize != null) p.bufferMB = u.backingStorageSize / 1048576 } catch (e) { /* Chrome vecchio */ }
  p.contesti = await quantiCon('WebGL2RenderingContext.prototype')
  p.contesti1 = await quantiCon('WebGLRenderingContext.prototype')
  p.tele = await quantiCon('HTMLCanvasElement.prototype')
  p.tele2d = await quantiCon('CanvasRenderingContext2D.prototype')
  p.bitmap = await quantiCon('ImageBitmap.prototype')
  await cdp.send('Runtime.releaseObjectGroup', { objectGroup: 'perdite' })
  p.dove = dove
  return p
}

// ── i gesti ──
const passi = []   // cosa è andato e cosa no, per ciclo
// `--foto`: un passo che non riesce lascia la sua schermata in tmp/scatti/perdite-<passo>.png (dove si era fermato)
const prova = async (nome, fn) => {
  try { await fn(); passi.push(nome) } catch (e) {
    passi.push(nome + '✗'); console.log(`    ${nome}: ${e.message.split('\n')[0].slice(0, 140)}`)
    if (argv.includes('--foto')) await page.screenshot({ path: resolve(`tmp/scatti/perdite-${nome}.png`) }).catch(() => {})
  }
}
const via = () => page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
const aCasa = async () => {
  for (let n = 0; n < 4 && !(await page.locator('.carte').count()); n++) {
    const b = page.locator('button[aria-label="indietro"]').first()
    if (await b.count()) await b.click().catch(() => {})
    await attendi(page, 800)
  }
  await page.waitForSelector('.carte', { timeout: 10000 })
}
// lo scontro (giù o sul prato) fino alla fine, rispondendo giusto; i mostri a un osso e l'eroe guarito a ogni turno, perché finisca presto
async function finoAllaFine(inScontro) {
  for (let n = 0; n < 20 && await inScontro(); n++) {
    await page.evaluate(() => { const c = window.__sotterraneo3d && window.__sotterraneo3d.corsa; if (!c) return; if (c.vitaMax) c.vita = c.vitaMax; for (const m of (c.foglio && c.foglio.campo) || []) if (m.ossa > 1) m.ossa = 1 })
    if (await page.locator('[data-caselle-abilita][data-pronto], .sot-domanda .qz-tasto').count()) {
      await scegliAttacco(page)
      await page.waitForSelector('.sot-domanda .qz-tasto', { timeout: 8000 })
      await attendi(page, 400)
      await page.locator('.sot-domanda .qz-tasto[data-giusta]').first().click()
      await page.waitForSelector('[data-scontro-3d][data-racconto]', { timeout: 8000 }).catch(() => {})
      await page.waitForFunction(() => !document.querySelector('[data-scontro-3d][data-racconto]'), null, { timeout: 30000 }).catch(() => {})
      await attendi(page, 300)
    } else await attendi(page, 500)
  }
  // la fine dello scontro (giù): un foglio da chiudere, se c'è
  const ok = page.locator('[data-azione="avanti"], [data-azione="chiudi-fine"]')
  if (await ok.count()) await ok.first().click().catch(() => {})
}
const scontroGiu = () => page.evaluate(() => { const c = window.__sotterraneo3d && window.__sotterraneo3d.corsa; return !!(c && c.foglio && c.foglio.che === 'scontro') })
const scontroSopra = () => page.evaluate(() => !!(window.__mondo3d && window.__mondo3d.inScontro()))
// qualche effetto in più (le abilità che il giocatore non ha), per far girare il gestore degli effetti
const effetti = i => page.evaluate(i => { const S = window.__sotterraneo3d; if (!S || !S.prova) return; for (const k of ['palla', 'gelo', 'fulmine']) try { S.prova(k, i % 2) } catch (e) { /* non c'è */ } }, i)

async function zaino(i) {
  await page.click('[data-azione="zaino"]')
  await page.waitForSelector('[data-zaino]', { timeout: 5000 })
  await attendi(page, 1500)   // le anteprime
  // un pezzo della tasca che si indossa (a giro), così l'eroe si riveste e il pezzo tolto torna in tasca
  const tasche = await page.locator('[data-zaino] [data-tasca][data-cosa]').evaluateAll(l => l.map(e => e.dataset.cosa))
  const scelte = tasche.map((k, j) => [k, j]).filter(([k]) => !/pozion|ampoll|elisir/.test(k))
  if (scelte.length) {
    const [, j] = scelte[i % scelte.length]
    await page.click(`[data-zaino] [data-tasca="${j}"]`)
    const usa = page.locator('[data-zaino] [data-azione="usa"]:not([disabled])')
    if (await usa.count()) { await usa.first().click(); await attendi(page, 1200) }
  }
  await page.click('[data-zaino] [data-azione="chiudi"]')
  await page.waitForSelector('[data-zaino]', { state: 'detached', timeout: 5000 })
}

// il mondo fermo: i pezzi e le zone attorno all'eroe non cambiano per tre secondi (si caricano uno per fotogramma)
async function mondoFermo() {
  let prec = null, da = Date.now()
  for (const fine = Date.now() + 60000; Date.now() < fine;) {
    const v = await page.evaluate(() => { const g = window.__sotterraneo3d && window.__sotterraneo3d.grafica && window.__sotterraneo3d.grafica(); return g && g.pezzi ? g.pezzi.join() + '|' + g.zone.join() : null })
    if (v !== prec) { prec = v; da = Date.now() } else if (v && Date.now() - da > 3000) return
    await attendi(page, 250)
  }
}
const alVillaggio = async () => {
  await page.evaluate(() => window.__mondo3d.vai('personaggio:villaggio:capitano'))
  await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.pronto, null, { timeout: 30000 })
  await mondoFermo()
}

// `--giu`: una discesa sola (l'abisso), un piano più giù a ogni ciclo, con uno scontro: la scena delle discese resta la stessa, e
// crescono le sue riserve (i modelli dei mostri, gli effetti, le trame dei paesaggi)
async function cicloGiu(i) {
  passi.length = 0
  if (i === 0) await prova('abisso', async () => {
    await via()
    await page.evaluate(() => { location.hash = 'sotterraneo=abisso&abisso=1&eroe=cavaliere&qualita=bassa&dpr=1' })
    await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.corsa && window.__sotterraneo3d.grafica().figure > 0, null, { timeout: 30000 })
    await attendi(page, 3000)
  })
  else await prova('scende', async () => {
    const piano = await page.evaluate(() => { const c = window.__sotterraneo3d.corsa; c.chiaveDelPiano = true; c.interagisci(c.livello.robe.find(r => r.che === 'scala')); return c.piano })
    await page.locator('[data-azione="scendi"]').first().click({ timeout: 8000 })
    await page.waitForFunction(p => window.__sotterraneo3d.corsa.piano === p + 1, piano, { timeout: 15000 })
    await attendi(page, 3000)
  })
  await prova('scontro', async () => {
    // il mostro vivo più vicino, toccato dal motore: lo scontro si apre con lui e il suo branco
    await page.evaluate(() => {
      const c = window.__sotterraneo3d.corsa, e = c.eroe
      const m = c.livello.robe.filter(r => r.che === 'mostro' && !r.morto).sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y))[0]
      if (!m) throw new Error('nessun mostro nel piano')
      c.interagisci(m)
    })
    await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 20000 })
    await effetti(i)
    await finoAllaFine(scontroGiu)
  })
  if (FASI.has('zaino')) await prova('zaino', () => zaino(i))
  await attendi(page, 1500)
  return { sopra: await misura('giu'), casa: {}, passi: passi.slice() }
}

async function ciclo(i) {
  passi.length = 0
  // `--resta`: dal secondo ciclo si resta nel mondo di sopra (la stessa scena per tutta la prova): le zone che si caricano e si
  // scaricano, gli scontri sul prato, i dialoghi; la misura è sempre al villaggio
  if (!(RESTA && i > 0)) {
    // (a) una discesa con uno scontro, nel paesaggio del giro
    await via()
    const h = `sotterraneo=1&eroe=cavaliere&seme=${11 + i}&sotterraneo=branco&mostri=3&tipo=${TIPI[i % TIPI.length]}&stanza=sala&scenario=${SCENARI[i % SCENARI.length]}&qualita=bassa&dpr=1`
    if (FASI.has('discesa')) await prova('discesa', async () => {
      await page.evaluate(h => { location.hash = h }, h)
      await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 30000 })
      await via()   // i cheat tolti appena dentro: se no il dungeon dal mondo li rilegge (lo scontro col branco all'ingresso)
      await effetti(i)
      await finoAllaFine(scontroGiu)
    })
    else {
      await page.evaluate(h => { location.hash = h.replace(/&sotterraneo=branco&mostri=3&tipo=[^&]*/, '') }, h)
      await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.grafica && window.__sotterraneo3d.grafica().figure > 0, null, { timeout: 30000 }).catch(() => {})
      await via()
    }
    // (b) lo zaino: le anteprime e un cambio di roba
    if (FASI.has('zaino')) await prova('zaino', async () => { await page.waitForSelector('[data-azione="zaino"]', { timeout: 20000 }); await zaino(i) })
    // su, nel mondo di sopra
    await prova('risale', async () => { await lasciaLaDiscesa(page); await mondoPronto(page) })
  } else if (FASI.has('zaino')) await prova('zaino', () => zaino(i))
  // (c) il mondo: tre zone a giro, e un branco vicino fino allo scontro sul prato
  if (FASI.has('mondo')) {
    await prova('zone', async () => {
      const pietre = await page.evaluate(() => window.__mondo3d.bersagli().filter(b => b.ruolo === 'pietra').map(b => b.chiave))
      for (let k = 0; k < 3; k++) {
        await page.evaluate(c => window.__mondo3d.vai(c), pietre[(i * 3 + k) % pietre.length])
        await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.pronto, null, { timeout: 30000 })
        await attendi(page, 2500)
      }
    })
    await prova('prato', async () => {
      // un mostro vivo (a giro), a cinque celle: il branco viene addosso
      const ok = await page.evaluate(i => {
        const M = window.__mondo3d, vivi = M.stato().mostri.map((q, k) => [q, k]).filter(([q]) => q && !q.morto)
        for (let n = 0; n < vivi.length; n++) { const [, k] = vivi[(i * 7 + n) % vivi.length]; if (M.vicinoAl(k, 5)) return true }
        return false
      }, i)
      if (!ok) throw new Error('nessun mostro vivo da avvicinare')
      await page.waitForFunction(() => window.__mondo3d && window.__mondo3d.inScontro(), null, { timeout: 40000 })
      await page.waitForSelector('[data-scontro-sopra] [data-pannello3d]', { timeout: 30000 })
      await effetti(i)
      await finoAllaFine(scontroSopra)
      if (await page.locator('[data-risveglio-sopra]').count()) await page.click('[data-azione="risveglio"]').catch(() => {})
    })
  }
  // (d) un dialogo e una bottega, coi ritratti 3D
  if (FASI.has('dialoghi')) await prova('dialoghi', async () => {
    await alVillaggio()
    await toccaNelMondo(page, '[data-personaggio="capitano"]')
    await nelDialogo(page, '[data-scelta="ciao"]')
    await page.waitForSelector('[data-dialogo]', { state: 'detached', timeout: 5000 })
    await toccaNelMondo(page, '[data-mercante="armaiolo"][data-citta="villaggio"]')
    await nelDialogo(page, '[data-scelta="bottega"]')
    await page.waitForSelector('[data-bottega]', { timeout: 8000 })
    await attendi(page, 2000)
    await page.click('[data-bottega] [data-chiudi]')
  })
  // la misura nel mondo: sempre al villaggio, con le sue zone attorno e i pezzi fatti
  await prova('villaggio', alVillaggio)
  const sopra = await misura('mondo')
  if (RESTA) return { sopra, casa: {}, passi: passi.slice() }
  // (e) giù dall'ingresso della prima discesa (le altre già finite chiedono altro nel fumetto), qualche effetto, e di nuovo su
  if (FASI.has('dungeon')) await prova('dungeon', async () => {
    await scendiNelMondo(page, 0)
    // una discesa lasciata a metà (il portale dello scontro di prima): si comincia questa
    await attendi(page, 800)
    const comincia = page.locator('[data-azione="comincia"]')
    if (await comincia.count()) await comincia.first().click()
    await page.waitForFunction(() => document.querySelector('[data-tela="3d"]') && window.__sotterraneo3d && window.__sotterraneo3d.grafica && !window.__sotterraneo3d.grafica().mondo && window.__sotterraneo3d.grafica().figure > 0, null, { timeout: 30000 })
    await attendi(page, 2500)
    if (await scontroGiu()) await finoAllaFine(scontroGiu)   // un branco appostato all'ingresso
    await effetti(i)
    await attendi(page, 1500)
    await lasciaLaDiscesa(page)
    await mondoPronto(page)
  })
  await prova('casa', aCasa)
  const casa = await misura('casa')
  return { sopra, casa, passi: passi.slice() }
}

// ── di che tipo sono gli oggetti di three vivi (in home, alla fine): per tipo e nome, i più numerosi ──
async function elenca(k, quanti = 15) {
  const { result } = await cdp.send('Runtime.evaluate', { expression: `window.gc(), window.__protiTre && window.__protiTre.${k}`, objectGroup: 'perdite' })
  if (!result.objectId) return [`${k}: nessun prototipo (nessuna scena vista)`]
  const { objects } = await cdp.send('Runtime.queryObjects', { prototypeObjectId: result.objectId, objectGroup: 'perdite' })
  const { result: r } = await cdp.send('Runtime.callFunctionOn', { objectId: objects.objectId, returnByValue: true, arguments: [{ value: quanti }],
    functionDeclaration: `function (quanti) {
      const per = new Map()
      for (const o of this) {
        const ud = o.userData && Object.keys(o.userData).slice(0, 4).join('+')
        const k = [o.type || o.constructor.name, o.name || '', ud || '', o.isMaterial ? (o.color ? '#' + o.color.getHexString() : '') : o.isBufferGeometry ? Object.keys(o.attributes).join('+') : ''].join(' ')
        per.set(k, (per.get(k) || 0) + 1)
      }
      return [...per].sort((a, b) => b[1] - a[1]).slice(0, quanti).map(([k, n]) => String(n).padStart(6) + '  ' + k)
    }` })
  await cdp.send('Runtime.releaseObjectGroup', { objectGroup: 'perdite' })
  return [`\n${k} vivi, per tipo:`, ...r.value]
}

// ── chi tiene vivo cosa: la fotografia dello heap, la via più corta dalle radici a ogni oggetto di quelle classi ──
async function chiTiene(classi, quanti) {
  await page.evaluate(() => { window.gc(); window.gc() })
  let testo = ''
  const pezzo = e => { testo += e.chunk }
  cdp.on('HeapProfiler.addHeapSnapshotChunk', pezzo)
  await cdp.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false })
  cdp.off('HeapProfiler.addHeapSnapshotChunk', pezzo)
  const H = JSON.parse(testo); testo = ''
  const { node_fields: NF, edge_fields: EF, node_types: [TN], edge_types: [TE] } = H.snapshot.meta
  const nN = NF.length, nE = EF.length, N = H.nodes, E = H.edges, S = H.strings
  const iTipo = NF.indexOf('type'), iNome = NF.indexOf('name'), iConti = NF.indexOf('edge_count'), iId = NF.indexOf('id')
  const eTipo = EF.indexOf('type'), eNome = EF.indexOf('name_or_index'), eA = EF.indexOf('to_node')
  const quante = N.length / nN, primo = new Uint32Array(quante + 1)
  for (let i = 0, e = 0; i < quante; i++) { primo[i] = e; e += N[i * nN + iConti] * nE } primo[quante] = E.length
  const padre = new Int32Array(quante).fill(-1), via = new Int32Array(quante).fill(-1)
  padre[0] = 0
  const coda = [0]
  for (let q = 0; q < coda.length; q++) {
    const n = coda[q]
    for (let e = primo[n]; e < primo[n + 1]; e += nE) {
      const t = TE[E[e + eTipo]]
      if (t === 'weak' || t === 'shortcut') continue
      // una voce di WeakMap vive se vivono la chiave E la tavola: si segue solo l'arco dalla tavola, che dice chi tiene la mappa
      if (t === 'internal' && typeof E[e + eNome] === 'number') { const m = /pair in WeakMap \(table @(\d+)\)/.exec(S[E[e + eNome]] || ''); if (m && Number(m[1]) !== N[n * nN + iId]) continue }
      const a = E[e + eA] / nN
      if (padre[a] !== -1) continue
      padre[a] = n; via[a] = e; coda.push(a)
    }
  }
  const nome = n => S[N[n * nN + iNome]], tipo = n => TN[N[n * nN + iTipo]]
  const arco = e => { const t = TE[E[e + eTipo]], v = E[e + eNome]; return t === 'element' || t === 'hidden' ? `[${v}]` : t === 'context' ? `(${S[v]})` : S[v] }
  const righe = []
  for (const cl of classi) {
    const tutti = []
    for (let n = 0; n < quante; n++) if (tipo(n) === 'native' || tipo(n) === 'object') if (nome(n) === cl || nome(n).startsWith(cl + ' ')) tutti.push(n)
    righe.push(`\n${cl}: ${tutti.length} vivi`)
    for (const n of tutti.slice(0, quanti)) {
      if (padre[n] === -1) { righe.push('   (non raggiungibile dalle radici)'); continue }
      const passi = []
      // in una tavola (Map, Set) l'elemento prima del valore è la sua chiave: la si scrive, dice quale voce della cache è
      const indice = f => { const t = TE[E[f + eTipo]], v = E[f + eNome]; return t === 'element' || t === 'hidden' ? v : t === 'internal' && /^\d+$/.test(S[v]) ? Number(S[v]) : null }
      const chiave = x => {
        const e = via[x], p = padre[x], i = indice(e)
        if (i == null || nome(p) !== '') return ''
        for (let f = primo[p]; f < primo[p + 1]; f += nE) if (indice(f) === i - 1) return ` {chiave ${nome(E[f + eA] / nN).slice(0, 80)}}`
        return ''
      }
      for (let x = n; x !== 0 && passi.length < 40; x = padre[x]) passi.unshift(`${arco(via[x])}${chiave(x)} → ${nome(x).slice(0, 40)}`)
      righe.push('   ' + passi.join('  ·  '))
    }
  }
  return righe
}

// ── la regressione: pendenza per ciclo e r² ──
function retta(ys) {
  const p = ys.map((y, x) => [x, y]).filter(([, y]) => typeof y === 'number' && isFinite(y))
  const n = p.length
  if (n < 3) return null
  const mx = p.reduce((s, [x]) => s + x, 0) / n, my = p.reduce((s, [, y]) => s + y, 0) / n
  let sxy = 0, sxx = 0, syy = 0
  for (const [x, y] of p) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2 }
  const b = sxx ? sxy / sxx : 0
  return { pendenza: b, r2: syy ? (sxy * sxy) / (sxx * syy) : 0, primo: p[0][1], ultimo: p[n - 1][1] }
}

// ── via ──
const m = ilMondoIntero()
const c = campagnaSeminata({ finite: 3, eroe: 'cavaliere', zaino: ZAINO, gemme: 400 })
Object.assign(c.cfg.avventure.cavaliere, { mondo: { giro: 0, parlato: true, firma: m.firma } })
await semina(page, { coins: 0, settings: { sperimentali: true }, campagne: { sotterraneo: c } })
await page.waitForSelector('.carte', { timeout: 15000 })
// `--veri fps-sot,fps-villaggio`: la misura del telefono (zona dei grandi → «Misura questo telefono» → gli fps veri), con le scene
// chiesti, e i conteggi dopo OGNI scena: le scene di un gruppo accendono e spengono elementi della stessa scena, i gruppi la rifanno
if (opz('veri')) await banco(opz('veri').split(','))
async function banco(solo) {
  // prima una discesa, per prendere i prototipi di three (la misura non espone le sue scene), poi in home
  await page.evaluate(() => { location.hash = 'sotterraneo=1&eroe=cavaliere&seme=11&qualita=bassa&dpr=1' })
  await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.grafica().figure > 0, null, { timeout: 30000 })
  await misura('discesa')
  await aCasa()
  await page.click('[data-azione="grandi"]'); await page.waitForSelector('.tastierino')
  for (const c of '0000') await page.click(`.tasto >> text="${c}"`)
  await page.click('[data-scheda="impostazioni"]')
  await page.evaluate(() => document.querySelectorAll('details.tendina').forEach(d => { d.open = true }))
  await page.evaluate(([so, co]) => { window.__benchmarkSolo = so; window.__benchmarkCorto = co }, [solo, argv.includes('--corto')])
  await page.click('[data-azione="benchmark"]')
  await page.click('[data-azione="benchmark-veri"]')
  console.log(`la misura degli fps veri: ${solo.join(', ')}${argv.includes('--corto') ? ' (corta)' : ''}; una riga per scena`)
  const righe = [], campiB = ['geometrie', 'materiali', 'trame', 'oggetti3d', 'contesti', 'tele', 'bitmap', 'heapMB', 'bufferMB', 'nodi', 'ascoltatori', 'timer']
  let prima = null
  for (const fine = Date.now() + 3 * 3600e3; Date.now() < fine;) {
    if (await page.locator('[data-benchmark-fine]').count()) break
    const ora = await page.evaluate(() => { const e = document.querySelector('[data-benchmark-corre]'); return e ? e.innerText.split('\n')[0].replace(/\s*sono \d+ s.*$/, '') : null })
    if (ora && ora !== prima) {
      if (prima) {
        const r = await misura(prima)
        righe.push(r)
        console.log(`${String(righe.length).padStart(3)} ${prima.slice(0, 70)}\n     ${campiB.map(k => `${k} ${typeof r[k] === 'number' ? Math.round(r[k] * 10) / 10 : '-'}`).join(' · ')}`)
      }
      prima = ora
    }
    await attendi(page, 300)
  }
  // ogni scena butta il gioco di prima: scena dopo scena non deve crescere niente (contesti, geometrie, heap)
  let rossi = 0
  const stampa = (titolo, lista, unita) => {
    console.log(`\n${titolo}`)
    for (const k of campiB) {
      const R = retta(lista.map(r => r[k]))
      if (!R) continue
      const rosso = SOGLIE[k] != null && R.pendenza > SOGLIE[k] && R.r2 >= 0.5
      if (rosso) rossi++
      console.log(`  ${rosso ? '✗' : ' '} ${k.padEnd(12)} ${R.pendenza >= 0 ? '+' : ''}${R.pendenza.toFixed(3).padStart(8)}/${unita}  r² ${R.r2.toFixed(2)}  (${Math.round(R.primo * 10) / 10} → ${Math.round(R.ultimo * 10) / 10})`)
    }
  }
  if (righe.length >= 3) stampa(`scena dopo scena (${righe.length} scene; pendenza per scena, r²)`, righe, 'scena')
  if (opz('json')) writeFileSync(resolve(opz('json')), JSON.stringify({ veri: solo, righe }, null, 1))
  if (errori.length) console.log(`errori della pagina: ${errori.length}\n  ${[...new Set(errori)].slice(0, 6).join('\n  ')}`)
  await browser.close()
  process.exit(rossi ? 1 : 0)
}
console.log(`${CICLI} cicli (${CALDI} di riscaldamento), fasi: ${[...FASI].join(', ')}`)
const righe = []
const campi = ['geometrie', 'materiali', 'trame', 'oggetti3d', 'contesti', 'tele', 'bitmap', 'heapMB', 'bufferMB', 'nodi', 'ascoltatori', 'timer', 'rafPerFot']
const corto = r => campi.map(k => `${k} ${typeof r[k] === 'number' ? Math.round(r[k] * 10) / 10 : '-'}`).join(' · ')
for (let i = 0; i < CICLI; i++) {
  const t0 = Date.now()
  // `--nuovi`: quelli vivi prima del penultimo ciclo prendono 1, quelli nati nel penultimo 2: alla fine, i 2 ancora vivi sono nati un
  // ciclo fa e sono sopravvissuti a un ciclo intero (l'eroe rivestito, il piano di prima: dovevano andarsene)
  if (opz('nuovi') && i >= CICLI - 2) await page.evaluate(() => window.gc()).then(() => quantiCon(`window.__protiTre && window.__protiTre.${opz('nuovi')}`,
    `function () { for (const o of this) if (!Object.hasOwn(o, '__visto') && !Object.hasOwn(o, 'constructor')) o.__visto = ${i === CICLI - 2 ? 1 : 2}; return this.length }`)).then(() => cdp.send('Runtime.releaseObjectGroup', { objectGroup: 'perdite' }))
  const r = GIU ? await cicloGiu(i) : await ciclo(i)
  righe.push(r)
  console.log(`ciclo ${String(i + 1).padStart(2)} (${Math.round((Date.now() - t0) / 1000)} s) [${r.passi.join(' ')}]`)
  if (!RESTA && !GIU) console.log(`   casa : ${corto(r.casa)}`)
  console.log(`   mondo: ${corto(r.sopra)}${r.sopra.scena ? ` · scena ${JSON.stringify({ ...r.sopra.scena, per: undefined })}` : ''}${r.sopra.anteprime ? ` · anteprime ${JSON.stringify(r.sopra.anteprime)}` : ''}`)
}
if (opz('json')) writeFileSync(resolve(opz('json')), JSON.stringify({ cicli: CICLI, caldi: CALDI, fasi: [...FASI], righe }, null, 1))

let rossi = 0
console.log(`\nla retta dopo ${CALDI} cicli di riscaldamento (pendenza per ciclo, r²; soglia: pendenza oltre il limite con r² ≥ 0,5)`)
for (const dove of RESTA || GIU ? ['sopra'] : ['casa', 'sopra']) {
  console.log(` ${dove === 'casa' ? 'in home (tutto il 3D chiuso)' : GIU ? 'nella discesa' : 'nel mondo di sopra'}`)
  const extra = dove === 'sopra' ? [['scena.geo', r => r.scena && r.scena.geo], ['scena.tex', r => r.scena && r.scena.tex], ['scena.programmi', r => r.scena && r.scena.programmi], ['scena.mesh', r => r.scena && r.scena.mesh], ['scena.modelli', r => r.scena && r.scena.modelli]] : []
  for (const [k, leggi] of [...campi.map(k => [k, r => r[k]]), ['intervalli', r => r.intervalli], ['contestiVivi', r => r.contestiVivi], ['teleDom', r => r.teleDom], ['tele2d', r => r.tele2d], ...extra]) {
    const R = retta(righe.slice(CALDI).map(r => leggi(r[dove])))
    if (!R) continue
    const soglia = SOGLIE[k.replace('scena.', '')] ?? SOGLIE[{ 'scena.geo': 'geometrie', 'scena.tex': 'trame', 'scena.programmi': 'trame', 'scena.mesh': 'oggetti3d', 'scena.modelli': 'trame' }[k]]
    const rosso = soglia != null && R.pendenza > soglia && R.r2 >= 0.5
    if (rosso) rossi++
    console.log(`  ${rosso ? '✗' : ' '} ${k.padEnd(16)} ${R.pendenza >= 0 ? '+' : ''}${R.pendenza.toFixed(3).padStart(8)}/ciclo  r² ${R.r2.toFixed(2)}  (${Math.round(R.primo * 10) / 10} → ${Math.round(R.ultimo * 10) / 10})${soglia != null ? `  soglia ${soglia}` : ''}`)
  }
}
// `--chi WebGL2RenderingContext,HTMLCanvasElement`: chi tiene vivi quegli oggetti, dalla fotografia dello heap (in home)
if (opz('elenca')) for (const k of opz('elenca').split(',')) for (const riga of await elenca(k, Number(opz('quanti', 15)))) console.log(riga)
// `--segna 'materiali:o => o.color && o.color.getHexString() === "b2306e"'`: chi tiene vivi gli oggetti di three che la funzione sceglie
// (gli si appende un segno, PerditaSegnata, e si cerca chi tiene il segno: la via passa dall'oggetto)
async function segna(k, f, quanti) {
  const { result } = await cdp.send('Runtime.evaluate', { expression: `window.gc(), window.__protiTre && window.__protiTre.${k}`, objectGroup: 'perdite' })
  const { objects } = await cdp.send('Runtime.queryObjects', { prototypeObjectId: result.objectId, objectGroup: 'perdite' })
  const { result: r } = await cdp.send('Runtime.callFunctionOn', { objectId: objects.objectId, returnByValue: true, arguments: [{ value: f }, { value: quanti }],
    functionDeclaration: `function (f, quanti) {
      const scegli = (0, eval)(f), S = window.__Segno || (window.__Segno = class PerditaSegnata {}), per = new Map()
      let n = 0
      for (const o of this) if (scegli(o)) {
        o.__segno = new S(); n++
        const ud = o.userData && Object.keys(o.userData).slice(0, 4).join('+')
        const k = [o.type, o.name || '', ud || '', o.isMaterial && o.color ? '#' + o.color.getHexString() : o.isBufferGeometry ? Object.keys(o.attributes).join('+') : ''].join(' ')
        per.set(k, (per.get(k) || 0) + 1)
      }
      return [n + ' su ' + this.length, [...per].sort((a, b) => b[1] - a[1]).slice(0, quanti).map(([k, n]) => String(n).padStart(6) + '  ' + k)]
    }` })
  await cdp.send('Runtime.releaseObjectGroup', { objectGroup: 'perdite' })
  console.log(`\n${k} segnati: ${r.value[0]}\n${r.value[1].join('\n')}`)
  for (const riga of await chiTiene(['PerditaSegnata'], quanti)) console.log(riga)
}
// `--segna 'materiali:o => o.color && o.color.getHexString() === "b2306e"'`: chi tiene vivi gli oggetti di three che la funzione sceglie
// (gli si appende un segno, PerditaSegnata, e si cerca chi tiene il segno: la via passa dall'oggetto)
if (opz('segna')) { const [k, ...f] = opz('segna').split(':'); await segna(k, f.join(':'), Number(opz('quanti', 4))) }
// `--nuovi materiali`: quelli nati nel penultimo ciclo e ancora vivi alla fine dell'ultimo, per tipo, e chi li tiene (i prototipi delle
// sottoclassi non si segnano: il segno lo erediterebbero tutti)
if (opz('nuovi')) await segna(opz('nuovi'), "o => Object.hasOwn(o, '__visto') && o.__visto === 2", Number(opz('quanti', 6)))
if (argv.includes('--senza-dispose')) {
  await page.evaluate(async () => { for (let i = 0; i < 3; i++) { window.gc(); await new Promise(r => setTimeout(r, 300)) } })
  const c = await page.evaluate(() => window.__senzaDispose || {})
  const l = Object.entries(c).sort((a, b) => b[1] - a[1])
  console.log(`\nperse senza dispose (le ha prese il GC): ${l.reduce((n, [, v]) => n + v, 0)}`)
  for (const [k, v] of l.slice(0, Number(opz('quanti', 15)))) console.log(`  ${String(v).padStart(5)}  ${k}`)
}
if (opz('chi')) for (const riga of await chiTiene(opz('chi').split(','), Number(opz('quanti', 4)))) console.log(riga)
// chi cresce nella scena: le mesh per elemento al primo ciclo dopo il riscaldamento e all'ultimo
{
  const a = righe[Math.min(CALDI, righe.length - 1)], b = righe[righe.length - 1]
  const pa = a && a.sopra && a.sopra.scena && a.sopra.scena.per, pb = b && b.sopra && b.sopra.scena && b.sopra.scena.per
  if (pa && pb && a !== b) {
    const d = Object.keys({ ...pa, ...pb }).map(k => [k, (pb[k] || 0) - (pa[k] || 0), pb[k] || 0]).filter(([, x]) => x).sort((x, y) => y[1] - x[1])
    if (d.length) console.log(`\nmesh della scena per elemento, dal ciclo ${CALDI + 1} all'ultimo: ${d.map(([k, x, n]) => `${k} ${x > 0 ? '+' : ''}${x} (${n})`).join(', ')}`)
  }
}
const guasti = righe.flatMap(r => r.passi.filter(p => p.endsWith('✗')))
if (guasti.length) console.log(`\npassi non riusciti: ${guasti.length} (${[...new Set(guasti)].join(', ')})`)
if (errori.length) console.log(`errori della pagina: ${errori.length}\n  ${[...new Set(errori)].slice(0, 6).join('\n  ')}`)
await browser.close()
console.log(rossi ? `\n${rossi} grandezze crescono oltre la soglia: una perdita` : '\nnessuna grandezza cresce oltre la soglia')
process.exit(rossi ? 1 : 0)
