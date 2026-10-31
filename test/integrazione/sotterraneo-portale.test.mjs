/* ═══════════════════════════════════════════════════════════════════
   IL PORTALE E LA RIPRESA ESATTA, COL DITO VERO

   La stanza che era del mercante ha un portale (docs/sotterraneo/
   portale-e-sosta.md): toccandolo si sale al villaggio, e nel villaggio compare il
   gemello che riporta giù esattamente dov'eri, col piano com'era. Qui il
   giro intero: si scende nella scalinata antica (la seconda discesa), si apre una porta, si ferisce
   un mostro e si scappa, si entra nel portale, sopra la vita resta quella di giù e la
   guaritrice la rimette (docs/sotterraneo/chi-cura.md), si compra dall'erborista, si torna
   giù dal gemello e si ritrova tutto, a vita piena; poi si esce con la ✕ e si
   riprende da «riprendi da qui» in home, nello stesso punto. Uscire con la ✕
   non è un portale: lì la sosta è un'«uscita», sopra non c'è il gemello e
   rientrando si è già giù, dietro il velo della pausa. Il giro della cura in
   sé, con le due che curano, è `sotterraneo-cura`.

   Il piano non è raro: si parte DENTRO la stanza del portale (`#stanza=portale`,
   che mette l'eroe nella cella più lontana dai mostri) e il seme (`#seme=`) si
   sceglie fra i primi ottanta perché porta e mostro stiano lì vicino. Lo stesso
   generatore gira qui in Node (`Corsa` col seme dell'indirizzo) e dice dove stanno
   porta, mostro e portale. Si sceglie la scalinata e non la cripta perché là i
   mostri hanno due ossa e a mani nude cadono in un colpo: uno «ferito» non
   c'è. Si cammina toccando la tela come un bambino, una cella lontana alla
   volta (`Input.dispatchTouchEvent` via CDP; la cella sullo schermo la dà la
   scena 3D, `aSchermo`), e si risponde col tasto giusto della domanda
   (`data-giusta`). Sopra l'eroe va dall'erborista e dal gemello col salto delle
   prove (`__mondo3d.vai`).
   `node test/esegui.mjs sotterraneo-portale`
   tempo: 600
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, scegliAttacco, leggiProfilo, scendiNelSotterraneo,
         compraNellaBottega, nelDialogo, finestraFerma, mondoPronto, toccaNelMondo }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { ilMondo, postiDi } from '../../src/giochi/sotterraneo/motore/mondo-sopra.js'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { percorso } from '../../src/motore/passi.js'

const DISCESA = 1   // la scalinata antica: i suoi mostri hanno ossa da reggere a un colpo
const TAPPA = CAMPAGNA[DISCESA]
// a mani nude: un mostro della scalinata regge a un colpo, e qui serve un mostro che sopravvive a uno
const roba = { v: 1, gemme: 60, zaino: [], mano: null, mancina: null, corpo: 'corazza', dito: null,
               torcia: 0, torce: 0 }

/* ── dove comincia l'eroe con `#stanza=portale`: la cella della stanza più lontana da ogni mostro (lo stesso conto di
   `stanzaDaProva` in Gioco.vue; più sotto il test controlla che la tela dica la stessa cella) ── */
function partenzaDelCheat(L) {
  const s = L.stanze.find(r => r.ruolo === 'portale')
  const mostri = L.robe.filter(r => r.che === 'mostro')
  const lontano = r => mostri.reduce((m, o) => Math.min(m, Math.hypot(o.x - r.x, o.y - r.y)), 99)
  return s.suolo.reduce((b, r) => (lontano(r) > lontano(b) ? r : b), s.suolo[0])
}

/* ── il piano: la stanza del portale vuota di mostri, una porta e un mostro da ferire vicini, e la strada fra
   l'una, l'altro e il portale senza altri mostri. Fra i primi semi ce n'è sempre uno ── */
function scegliIlPiano() {
  let meglio = null
  for (let seme = 1; seme <= 80; seme++) {
    const c = new Corsa(TAPPA, { seme, eroe: 'cavaliere', roba })
    const L = c.livello
    const sala = L.stanze.find(r => r.ruolo === 'portale')
    const portale = L.robe.find(r => r.che === 'portale')
    if (!sala || !portale) continue
    const mostri = L.robe.filter(r => r.che === 'mostro')
    if (mostri.some(r => L.stanzaDi(r.x, r.y) === sala)) continue
    const da = partenzaDelCheat(L)
    const via = (a, b) => percorso((x, y) => L.calpestabile(x, y), a, b)
    const lungo = q => (via(da, q) || { length: 999 }).length
    const porta = L.robe.filter(r => r.che === 'porta').sort((a, b) => lungo(a) - lungo(b))[0]
    if (!porta) continue
    for (const mostro of mostri.filter(r => !r.chiave && r.ossa > c.colpo(r))) {
      const tratti = [via(da, porta), via(porta, mostro), via(mostro, portale)]
      if (tratti.some(t => !t)) continue
      // i mostri di altre stanze sulla strada: quelli della stanza del bersaglio vengono con lui, ed è giusto
      const sua = L.stanzaDi(mostro.x, mostro.y)
      const stanze = new Set(tratti.flat().map(q => L.stanzaDi(q.x, q.y)?.id))
      const intrusi = mostri.filter(r => L.stanzaDi(r.x, r.y) !== sua && stanze.has(L.stanzaDi(r.x, r.y)?.id)).length
      const costo = tratti.reduce((n, t) => n + t.length, 0) + 40 * intrusi
      if (!meglio || costo < meglio.costo) meglio = { seme, costo, c, da, porta, mostro, portale }
    }
  }
  return meglio
}
const piano = scegliIlPiano()
controlla('c\'è un piano della scalinata col portale, una porta e un mostro da ferire vicini', !!piano)
const L = piano.c.livello
const indice = r => L.robe.indexOf(r)
const aperte = new Set()   // i gruppi di porte aperti, per camminare nel modello come nel gioco

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
// la discesa 3D è pronta: la tela, e la scena con le sue figure
const giuPronto = async () => {
  await page.waitForSelector('[data-tela="3d"]', { timeout: 20000 })
  await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.corsa && window.__sotterraneo3d.grafica().figure > 0 && !window.__sotterraneo3d.grafica().mondo, null, { timeout: 30000 })
}
await azzera(page)
await semina(page, {
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: DISCESA, libera: false, stelle: { 0: 3 },
    cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: { tappa: DISCESA, libera: false, stelle: { 0: 3 }, missioni: {},
      roba, mondo: { parlato: true } } } } } },
})
await scegli(page, 'sotterraneo')
await mondoPronto(page)
await page.evaluate(s => { location.hash = 'sotterraneo&seme=' + s + '&stanza=portale' }, piano.seme)
await scendiNelSotterraneo(page, DISCESA)
await giuPronto()
await attendi(page, 700)

const cdp = await page.context().newCDPSession(page)
async function tocca(x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
async function toccaIl(sel) {
  await finestraFerma(page)   // la finestra nuova cresce per 160 ms: misurata prima, il tocco cade a lato
  const b = await page.locator(sel).first().boundingBox()
  await tocca(b.x + b.width / 2, b.y + b.height / 2)
}

/* ── giù: dov'è l'eroe lo dice la tela, e una cella si trova sullo schermo da lì ── */
const tela = page.locator('.sot-tela')
const cellaGiu = () => tela.getAttribute('data-eroe')
async function schermoDi(c, su = 0.05) {
  const [sx, sy] = await page.evaluate(([x, y, h]) => window.__sotterraneo3d.aSchermo(x + 0.5, h, y + 0.5), [c.x, c.y, su])
  const b = await tela.boundingBox()
  return { x: b.x + sx, y: b.y + sy, b }
}
// sullo schermo e lontano dalla mappina (in alto a destra), dallo zaino e dalla riga in fondo
const dentro = ({ x, y, b }) => x > b.x + 30 && x < b.x + b.width - 140 && y > b.y + 140 && y < b.y + b.height - 160
async function fermoGiu() {
  let prima = null
  for (let i = 0; i < 40; i++) {
    const ora = await cellaGiu()
    if (ora === prima) return
    prima = ora
    await attendi(page, 300)
  }
}
const apertoGiu = async () => (await page.locator('.sot-domanda, [data-azione="portale"], [data-azione="scappa"], [data-scontro-3d]').count()) > 0
// cammina verso la cosa in `a` toccando la cella più lontana della strada che sta sullo schermo, finché si è
// accanto; poi tocca la cosa, che da accanto è in luce (una cosa al buio non si tocca: si cammina lì)
async function vaiGiu(a, { toccala = true } = {}) {
  // per strada si toccano solo celle vuote: una cella con sopra una fonte o un forziere aprirebbe il suo foglio
  const buona = (x, y) => L.calpestabile(x, y) &&
    !L.robe.some(r => r.x === x && r.y === y && r.che !== 'arredo' && r.che !== 'gemme' &&
                      !(r.che === 'porta' && aperte.has(r.gruppo)))
  for (let giro = 0; giro < 30; giro++) {
    // un mostro che ci raggiunge per strada: si scappa (costa un graffio), e si va avanti
    if (a.che !== 'mostro' && await page.locator('[data-azione="scappa"]').count()) {
      await page.locator('[data-azione="scappa"]').click()
      await attendi(page, 300)
      continue
    }
    // un foglio aperto per sbaglio (una cosa toccata passando) si chiude con «dopo»
    if (await page.locator('[data-azione="dopo"]').count() && !(await page.locator('[data-azione="portale"]').count())) {
      await page.locator('[data-azione="dopo"]').first().click()
      await attendi(page, 300)
      continue
    }
    if (await apertoGiu()) break
    const [ex, ey] = (await cellaGiu()).split(',').map(Number)
    const via = percorso(buona, { x: ex, y: ey }, a, { arrivoLibero: false }) || []
    if (via.length <= 1) {
      const qui = await schermoDi(a)
      if (toccala && dentro(qui)) await tocca(qui.x, qui.y)
      await attendi(page, 300)
      await fermoGiu()
      return
    }
    let tappa = null
    for (const q of via.slice(0, -1)) { const s = await schermoDi(q); if (dentro(s)) tappa = s }
    if (!tappa) break
    await tocca(tappa.x, tappa.y)
    await attendi(page, 300)
    await fermoGiu()
  }
}
// l'eroe va (salto delle prove) accanto a `k` e lo si tocca (`sel` è il suo bersaglio nel mondo) finché non compare `atteso`: il fumetto
// del pensiero dell'eroe fermo (docs/sotterraneo/pensieri.md) può coprire chi gli sta accanto e prendere il tocco, e allora si riprova
async function vaDa(sel, k, atteso = '[data-dialogo]') {
  for (let giro = 0; giro < 5; giro++) {
    await page.evaluate(k => { window.__mondo3d.senzaMostri(); window.__mondo3d.vai(k) }, k)
    let uguali = 0, ultimo = ''   // la telecamera arriva morbida: tre letture uguali di fila, a mezzo secondo
    for (let i = 0; i < 60 && uguali < 3; i++) {
      await attendi(page, 500)
      const b = await page.locator(sel).first().boundingBox().catch(() => null)
      const ora = b ? `${Math.round(b.x)},${Math.round(b.y)}` : ''
      uguali = ora && ora === ultimo ? uguali + 1 : 0
      ultimo = ora
    }
    await page.waitForSelector('[data-pensiero]', { state: 'detached', timeout: 20000 }).catch(() => {})
    await toccaNelMondo(page, sel, { tocca })
    if (await page.waitForSelector(atteso, { timeout: 12000 }).then(() => true).catch(() => false)) return
  }
}
async function rispondi(giusto = true) {
  await scegliAttacco(page)
  await page.waitForSelector('.sot-domanda .qz-tasto', { timeout: 5000 })
  await attendi(page, 300)
  const tasto = page.locator(giusto ? '.sot-domanda .qz-tasto[data-giusta]' : '.sot-domanda .qz-tasto:not([data-giusta])')
  await ((await tasto.count()) ? tasto.first() : page.locator('.sot-domanda .qz-tasto').first()).click()
  await attendi(page, 1300)
}

const vitaInBarra = async dove =>
  (await page.locator(`[data-barra="${dove}"] [data-azione="vita"]`).getAttribute('aria-label')).match(/vita (\d+) su (\d+)/).slice(1).map(Number)

uguale('si parte nella stanza del portale (il cheat e il modello dicono la stessa cella)', await cellaGiu(), `${piano.da.x},${piano.da.y}`)

/* ---------- 1. una porta si apre ---------- */
await vaiGiu(piano.porta)
await page.waitForSelector('.sot-domanda', { timeout: 8000 })
await rispondi(true)
uguale('la porta chiede e si apre', await page.locator('.sot-domanda').count(), 0)
aperte.add(piano.porta.gruppo)

/* ---------- 2. un mostro si ferisce, e si scappa ---------- */
await vaiGiu(piano.mostro)
await page.waitForSelector('[data-azione="scappa"]', { timeout: 10000 })
await rispondi(true)
controlla('un colpo e il mostro è ancora in piedi', await page.locator('[data-azione="scappa"]').count() === 1)
await page.locator('[data-azione="scappa"]').click()
await attendi(page, 500)
await fermoGiu()

/* ---------- 3. il portale ---------- */
await vaiGiu(piano.portale, { toccala: false })
const vicino = await schermoDi(piano.portale, 0.6)
controlla('il portale si vede sullo schermo', dentro(vicino))
await attendi(page, 400)
await scatto(page, 'portale-discesa')
// sotto carico il tocco può cadere mentre la telecamera si assesta: si riprova, ricalcolando dove sta il portale
for (let i = 0; i < 3 && !(await page.locator('[data-azione="portale"]').isVisible()); i++) {
  const p = i ? await schermoDi(piano.portale, 0.6) : vicino
  await tocca(p.x, p.y)
  await page.waitForSelector('[data-azione="portale"]', { timeout: 15000 }).catch(() => null)
}
await page.waitForSelector('[data-azione="portale"]', { timeout: 5000 })
uguale('il portale non chiede niente', await page.locator('.sot-domanda').count(), 0)
await scatto(page, 'portale-foglio')
const dovEro = await cellaGiu()
const vitaGiu = await vitaInBarra('giu')
controlla('si sale ammaccati: la fuga e i colpi hanno costato vita', vitaGiu[0] < vitaGiu[1], vitaGiu.join('/'))
await page.locator('[data-azione="portale"]').click()

/* ---------- 4. su nel villaggio: il gemello ---------- */
await mondoPronto(page)
await attendi(page, 700)
const gemello = postiDi(ilMondo(), 'portale').find(q => q.citta === 'villaggio')
uguale('si sbuca accanto al portale gemello', await page.locator('[data-eroe-mondo]').getAttribute('data-cella'),
       `${gemello.accanto.x},${gemello.accanto.y}`)
uguale('che sta nel villaggio', await page.locator('[data-portale]').count(), 1)
uguale('salendo non si guarisce: la barra dice la vita di giù', (await vitaInBarra('sopra')).join('/'), vitaGiu.join('/'))
await scatto(page, 'portale-villaggio')
let p = await leggiProfilo(page)
const sosta = p?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.sosta
uguale('la sosta ricorda che si è salita dal portale', sosta?.via, 'portale')
controlla('la discesa è nella sosta, coi cambiamenti e non il piano', !!sosta?.robe?.cambi && !Array.isArray(sosta?.robe),
          JSON.stringify(sosta?.robe)?.slice(0, 120))
const cambio = i => (sosta?.robe?.cambi || {})[i] || {}
uguale('con la porta aperta', cambio(indice(piano.porta)).aperta, true)
// chi si è ferito è il primo del branco che ci ha raggiunti, non per forza quello che si cercava
const ferito = L.robe.find(r => r.che === 'mostro' && cambio(indice(r)).ossa < r.ossaMax)
controlla('e il mostro ferito', !!ferito, JSON.stringify(sosta?.robe?.cambi))
uguale('e l\'eroe dov\'era', `${Math.floor(sosta?.dove?.x)},${Math.floor(sosta?.dove?.y)}`, dovEro)
uguale('e la sosta porta la vita di giù', sosta?.vita, vitaGiu[0])
nota(`la sosta pesa ${JSON.stringify(sosta).length} byte`)

/* ---------- 5. dall'erborista: prima la cura (gratis), poi la bottega ---------- */
await vaDa('[data-mercante="erborista"][data-citta="villaggio"]', 'mercante:villaggio:erborista')
await nelDialogo(page, '[data-scelta="cura"]', { tocca: toccaIl })
await page.waitForSelector('[data-cura-fiocco][data-risorsa="vita"]', { timeout: 3000 })
await attendi(page, 500)
uguale('la guaritrice rimette la vita a posto', (await vitaInBarra('sopra')).join('/'), `${vitaGiu[1]}/${vitaGiu[1]}`)
p = await leggiProfilo(page)
uguale('e la sosta la scrive piena', p?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.sosta?.vita, vitaGiu[1])
await nelDialogo(page, '[data-scelta="bottega"]', { tocca: toccaIl })
await page.waitForSelector('[data-chiudi]', { timeout: 10000 })
await attendi(page, 500)
await compraNellaBottega(page, 'pozione', { tocca })
await attendi(page, 300)
await toccaIl('[data-chiudi]')
await page.waitForSelector('[data-chiudi]', { state: 'detached', timeout: 3000 })

/* ---------- 6. giù dal gemello: tutto com'era ---------- */
await vaDa('[data-portale]', 'portale', '[data-fumetto-di="portale"] [data-azione="portale-giu"]')
await attendi(page, 300)
await scatto(page, 'portale-gemello-fumetto')
await toccaIl('[data-fumetto-di="portale"] [data-azione="portale-giu"]')
await giuPronto()
await attendi(page, 700)
uguale('si torna giù nel punto esatto', await cellaGiu(), dovEro)
uguale('a vita piena', (await vitaInBarra('giu')).join('/'), `${vitaGiu[1]}/${vitaGiu[1]}`)
await scatto(page, 'portale-ritorno')
await page.locator('[data-azione="zaino"]').click()
await page.waitForSelector('[data-zaino]', { timeout: 3000 })
uguale('con la pozione comprata sopra', await page.locator('[data-tasca][data-cosa="pozione"]').count(), 1)
await page.locator('[data-azione="chiudi"]').click()
await attendi(page, 300)

/* ---------- 7. si esce con la ✕: non è un portale ----------
   Dalla discesa la ✕ porta in home, non sulla terra di sopra: la sosta è
   un'uscita, senza gemello, e lo stesso piano si ritrova com'era. */
await toccaIl('button[aria-label="indietro"]')
await page.waitForSelector('.carte', { timeout: 5000 })
uguale('la ✕ dalla discesa porta in home', await page.locator('[data-mondo3d]').count(), 0)
await attendi(page, 400)
p = await leggiProfilo(page)
const dopo = p?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.sosta
uguale('la sosta ora è un\'uscita, non un portale', dopo?.via, 'uscita')
uguale('la porta è ancora aperta', ((dopo?.robe?.cambi || {})[indice(piano.porta)] || {}).aperta, true)
uguale('e il mostro ha le ossa di prima', ((dopo?.robe?.cambi || {})[indice(ferito)] || {}).ossa,
       cambio(indice(ferito)).ossa)
uguale('e l\'eroe è dove era', `${Math.floor(dopo?.dove?.x)},${Math.floor(dopo?.dove?.y)}`, dovEro)

/* ---------- 8. «riprendi da qui» in home, nello stesso punto, senza passare di sopra ---------- */
uguale('in home si riprende il sotterraneo', await page.locator('[data-riprendi]').getAttribute('data-riprendi'), 'sotterraneo')
controlla('e dice dove', (await page.locator('[data-riprendi]').innerText()).includes(`${TAPPA.nome} · piano 1 di`),
          await page.locator('[data-riprendi]').innerText())
await scatto(page, 'portale-riprendi-home')
await toccaIl('[data-riprendi]')
await giuPronto()
await attendi(page, 700)
uguale('si è già giù, senza il mondo di sopra', await page.locator('[data-mondo3d]').count(), 0)
uguale('e senza gemello', await page.locator('[data-portale]').count(), 0)
uguale('e si riprende nel punto esatto', await cellaGiu(), dovEro)
await page.waitForSelector('[data-pausa]', { timeout: 3000 })
await scatto(page, 'portale-riprende-fermo')
await attendi(page, 400)
await toccaIl('[data-pausa] [data-azione="riprendi"]')
await attendi(page, 300)
uguale('toccato il velo, la discesa riparte', await page.locator('[data-pausa]').count(), 0)

/* ---------- 9. col portale vero, invece, il gemello c'è anche se si esce dal villaggio ---------- */
await vaiGiu(piano.portale, { toccala: false })
{
  const q = await schermoDi(piano.portale)
  await tocca(q.x, q.y)
}
await page.waitForSelector('[data-azione="portale"]', { timeout: 40000 })
await page.locator('[data-azione="portale"]').click()
await mondoPronto(page)
await attendi(page, 500)
await toccaIl('button[aria-label="indietro"]')
await page.waitForSelector('.carte', { timeout: 5000 })
await scegli(page, 'sotterraneo')
await mondoPronto(page)
uguale('uscendo dal villaggio e rientrando, il gemello c\'è ancora', await page.locator('[data-portale]').count(), 1)
// la carta «torno giù» non c'è più (docs/core/ripresa.md): l'ingresso della stessa discesa dice «riprendo da dove ero»
await vaDa(`[data-posto="${TAPPA.chiave}"]`, 'ingresso:' + TAPPA.chiave, `[data-fumetto-di="${TAPPA.chiave}"] [data-azione="scendi"][data-sosta="1"]`)
uguale('e l\'ingresso della stessa discesa riprende da dove si era', await page.locator(`[data-fumetto-di="${TAPPA.chiave}"] [data-azione="scendi"][data-sosta="1"]`).count(), 1)

uguale('nessun errore in console', errori.join(' · '), '')
nota(`seme ${piano.seme}: porta ${indice(piano.porta)}, mostro ${indice(piano.mostro)} (${piano.mostro.tipo}), ` +
     `portale in ${piano.portale.x},${piano.portale.y}`)
await browser.close()
riassunto('il portale e la ripresa esatta col dito')
