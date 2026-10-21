/* ═══════════════════════════════════════════════════════════════════
   I MOSTRI DEL MONDO DI SOPRA, COL DITO — docs/sotterraneo/mondo-aperto-mostri-scena.md
   tempo: 480

   Nel Sotterraneo 3D i branchi dormono nelle regioni del mondo generato. Qui: entrando nei campi la riga in fondo dice la zona
   col suo colore; un branco vicino si sveglia e viene incontro, e lo scontro si apre sul prato, col pannello delle discese; un
   mostro toccato nella scena è il bersaglio; si vince rispondendo, e i caduti restano morti nel salvataggio. Lasciato con la ✕ a
   metà, rientrando i rimasti sono lì accanto e lo scontro si riapre da sé. Svenuti ci si sveglia nella città più vicina con metà
   delle gemme, e in tasca restano solo i pezzi rari; la guaritrice cura le ferite di sopra. Una caccia aperta della bacheca si
   chiude battendo l'ultimo mostro che mancava; il bottino rimasto per terra si raccoglie toccandolo. E quanto costa lo scontro.
   Si tocca come un telefono (`Input.dispatchTouchEvent`).
   Nei test: `[data-mostro-sopra]` (`data-i`, `data-sveglio`, `data-caporale`, `data-signore`), `[data-avviso-terra][data-annuncio]`,
   `[data-scontro-sopra]` col pannello `[data-pannello3d]` e `[data-scontro-3d]`, `[data-risveglio-sopra]` (`data-citta`) e il tasto
   `[data-azione="risveglio"]`, `[data-per-terra]` (`data-cosa`); `window.__mondo3d` (`porta`, `stato()`, `inScontro()`, `palco()`).
   `node test/esegui.mjs sotterraneo-mostri-sopra`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, scegliAvventura, leggiProfilo, mondoPronto, scegliAttacco,
         toccaNelMondo, nelDialogo } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { campagnaSeminata } from '../aiuto/sotterraneo-semina.mjs'
import { ilMondoIntero, terraDelMondo, cittaInCella } from '../../src/giochi/sotterraneo/motore/mondo-sopra.js'
import { popolaMondo, alSicuro, annuncioDi, BLOCCO_ZONA, VERSIONE_SOPRA } from '../../src/giochi/sotterraneo/motore/aperta.js'
import { pezzoNuovo } from '../../src/giochi/sotterraneo/motore/bottino.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'

// i posti di prova (cavaliere, giro 0), letti dal mondo a percorso coi suoi branchi: una cella del luogo a cinque o sei passi da un
// branco fatto così (`tipi`: le specie in fila, una delle date), lontana dagli altri branchi, da cui il branco arriva addosso
const m = ilMondoIntero(), terra = terraDelMondo(m)
const vivi = popolaMondo({ mondo: m, eroe: 'cavaliere', giro: 0 }).mostri.filter(Boolean)
function vicinoAlBranco(luogo, tipi) {
  const ri = m.regioni.findIndex(r => r.chiave === luogo), branchi = new Map()
  for (const q of vivi) if (q.regione === ri) branchi.set(q.branco, [...(branchi.get(q.branco) || []), q])
  for (const [b, l] of branchi) {
    if (!tipi.includes(l.map(q => q.tipo).sort().join())) continue
    for (let r = 5; r <= 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const x = Math.floor(l[0].fx) + dx, y = Math.floor(l[0].fy) + dy
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || !terra.passa(x, y) || alSicuro(m, x, y) || m.reg[y * m.W + x] !== ri) continue
      if (vivi.some(q => q.branco !== b && Math.hypot(q.fx - x - 0.5, q.fy - y - 0.5) < 9)) continue
      return { x: x + 0.5, z: y + 0.5 }
    }
  }
  throw new Error(`nessun branco ${tipi} nel luogo ${luogo}`)
}
const VESPE = vicinoAlBranco('campi', ['vespa,vespa'])          // la prima zona (livello 1–3): due vespe
const GOBLIN = vicinoAlBranco('colle', ['goblin,goblin'])       // il colle: due goblin
const ROVINE = vicinoAlBranco('rovine', ['scheletro,zombie', 'fantasma,zombie', 'zombie,zombie'])   // le rovine: uno zombie e un altro
const CACCIA = 't:villaggio:caccia-aperta:rovine.zombie:0'
const DETTO_VESPE = annuncioDi(m, VESPE.x, VESPE.z, null).testo.replace(/^\S+ /, '')   // «I prati… · livello 1–3», senza il segno del colore
// la pozione per terra accanto alle rovine
const POZIONE = (() => { for (let d = 2; d < 6; d++) for (const [dx, dy] of [[-d, 0], [d, 0], [0, -d], [0, d]]) { const x = Math.floor(ROVINE.x) + dx, y = Math.floor(ROVINE.z) + dy; if (terra.passa(x, y)) return { x, y } } })()
const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
const cdp = await page.context().newCDPSession(page)
async function tocca(x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
const avventura = async () => (await leggiProfilo(page))?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere || {}
const inScontro = () => page.evaluate(() => !!(window.__mondo3d && window.__mondo3d.inScontro()))
const g3d = () => page.evaluate(() => window.__sotterraneo3d.grafica())
const cella = async () => (await page.locator('[data-eroe-mondo]').getAttribute('data-cella')).split(',').map(Number)

async function entra(finite, mondo = {}, avv = {}) {
  const c = campagnaSeminata({ finite, eroe: 'cavaliere' })
  // con la firma della mappa: un salvato senza (o di un'altra mappa) perde `dove` e `sopra` (motore/mondo-sopra.js, mondoDaSalvato)
  Object.assign(c.cfg.avventure.cavaliere, { mondo: { giro: 0, parlato: true, firma: m.firma, ...mondo }, ...avv })
  await azzera(page)
  await semina(page, { coins: 0, settings: { sperimentali: true }, campagne: { sotterraneo: c } })
  await scegli(page, 'sotterraneo3d')
  await scegliAvventura(page, 'cavaliere')
  await mondoPronto(page)
  await attendi(page, 1500)
}
async function aspettaLoScontro() {
  await page.waitForFunction(() => window.__mondo3d && window.__mondo3d.inScontro(), null, { timeout: 60000 })
  await page.waitForSelector('[data-scontro-sopra] [data-pannello3d], [data-risveglio-sopra]', { timeout: 30000 })
}
async function rispondi(giusto) {
  // la casella toccata mentre il pannello torna pronto si perde: si ritocca (l'ha visto il test a macchina carica)
  for (let n = 0; n < 3 && !(await page.locator('.sot-domanda .qz-tasto').count()); n++) {
    if (n) nota(`l'attacco ritoccato (${n})`)
    await scegliAttacco(page)
    await page.waitForSelector('.sot-domanda .qz-tasto', { timeout: 5000 }).catch(() => {})
  }
  await page.waitForSelector('.sot-domanda .qz-tasto', { timeout: 15000 })
  await attendi(page, 400)
  await page.locator(giusto ? '.sot-domanda .qz-tasto[data-giusta]' : '.sot-domanda .qz-tasto:not([data-giusta])').first().click()
  await page.waitForSelector('[data-scontro-3d][data-racconto]', { timeout: 8000 }).catch(() => {})
  await page.waitForFunction(() => !document.querySelector('[data-scontro-3d][data-racconto]'), null, { timeout: 30000 }).catch(() => {})
  await attendi(page, 300)
}
// fino alla fine dello scontro: giusto vince, sbagliato sviene (o finché si apre il foglio del risveglio)
async function finoAllaFine(giusto, giri = 30) {
  for (let n = 0; n < giri && await inScontro(); n++) {
    if (await page.locator('[data-risveglio-sopra]').count()) return 'svenuto'
    if (await page.locator('[data-caselle-abilita][data-pronto], .sot-domanda .qz-tasto').count()) await rispondi(giusto)
    else await attendi(page, 500)
  }
  return (await page.locator('[data-risveglio-sopra]').count()) ? 'svenuto' : (await inScontro()) ? 'aperto' : 'finito'
}

/* ---------- 1. i campi: l'annuncio, il branco che si sveglia, lo scontro sul prato ---------- */
await entra(2)
await page.evaluate(p => window.__mondo3d.porta(p.x, p.z), VESPE)
{
  await page.waitForSelector('[data-avviso-terra][data-annuncio]', { timeout: 20000 })
  const a = page.locator('[data-avviso-terra]')
  controlla('entrando nella prima zona la riga dice la zona e la fascia', (await a.innerText()).includes(DETTO_VESPE), `${await a.innerText()} (atteso ${DETTO_VESPE})`)
  const colore = await a.getAttribute('data-annuncio')
  controlla('col colore per questo eroe', ['verde', 'arancio', 'rosso', 'grigio'].includes(colore), colore)
  nota(`i campi per il cavaliere dopo due discese: ${colore}`)
  await scatto(page, 'sotterraneo-mostri-sopra-annuncio')
  await page.waitForSelector('[data-mostro-sopra][data-sveglio="1"]', { state: 'attached', timeout: 30000 })
  controlla('il branco si sveglia', true)
  await aspettaLoScontro()
  uguale('lo scontro si apre sul prato: il pannello delle discese', await page.locator('[data-scontro-sopra] [data-pannello3d]').count(), 1)
  uguale('con le scritte sopra i due mostri', await page.locator('[data-scontro-3d]').getAttribute('data-mostri'), '2')
  uguale('il mondo resta sotto (niente tela delle discese)', await page.locator('[data-tela="3d"]').count(), 0)
  await attendi(page, 1500)
  const g = await g3d()
  nota(`lo scontro sul prato: ${g.chiamate} chiamate, ${Math.round(g.triangoli / 1000)}k triangoli, ${g.figure} figure`)
  uguale('lo disegna il palco del mondo', g.palco, true)
  controlla('sotto le 260 chiamate', g.chiamate < 260, g.chiamate)   // coi mostri e l'eroe in 3D: come lo scontro delle discese (sotterraneo-3d)
  controlla('e i 400 mila triangoli', g.triangoli < 400000, g.triangoli)
  // il secondo mostro toccato nella scena è il bersaglio
  await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 20000 })
  const pt = await page.evaluate(() => {
    const p = window.__mondo3d.palco(), s = p.palco.stati[1]
    return p.aSchermo(s.x, (s.alto || 1) * 0.5, s.z)
  })
  const b = await page.locator('[data-mondo3d]').boundingBox()
  await tocca(b.x + pt[0], b.y + pt[1])
  await attendi(page, 400)
  uguale('toccato nella scena, il secondo è il bersaglio', await page.locator('[data-scontro-3d] [data-mostro][data-bersaglio]').getAttribute('data-i'), '1')
  await scatto(page, 'sotterraneo-mostri-sopra-scontro')
}

/* ---------- 2. si vince: i caduti restano morti, l'esperienza è presa, il mondo riprende ---------- */
{
  const prima = await avventura()
  const campo = await page.evaluate(() => window.__mondo3d.palco().corsa.livello.robe.filter(r => r.che === 'mostro').map(r => r.mondo))
  uguale('lo scontro finisce rispondendo giusto', await finoAllaFine(true), 'finito')
  await attendi(page, 1200)
  const a = await avventura()
  // i morti stanno per zona, col numero dentro la zona (motore/aperta.js, inSalvo)
  const morti = Object.entries(a.mondo?.sopra?.morti || {}).flatMap(([z, l]) => l.map(([j]) => m.zone.findIndex(Z => Z.chiave === z) * BLOCCO_ZONA + j))
  controlla('i due caduti sono morti nel salvataggio', campo.every(i => morti.includes(i)), `${campo} in ${morti}`)
  controlla('l\'esperienza è salita', (a.crescita?.esp || 0) > (prima.crescita?.esp || 0), `${prima.crescita?.esp} → ${a.crescita?.esp}`)
  uguale('nessuno scontro in sospeso', a.mondo?.sopra?.scontro || null, null)
  uguale('il pannello se ne va', await page.locator('[data-scontro-sopra]').count(), 0)
  for (const i of campo) uguale(`il mostro ${i} non si vede più`, await page.locator(`[data-mostro-sopra][data-i="${i}"]`).count(), 0)
  await scatto(page, 'sotterraneo-mostri-sopra-vinto')
}

/* ---------- 3. la ✕ a metà: rientrando i rimasti sono lì, e lo scontro si riapre ---------- */
{
  await page.evaluate(p => window.__mondo3d.porta(p.x, p.z), GOBLIN)
  await aspettaLoScontro()
  const campo = await page.evaluate(() => window.__mondo3d.palco().corsa.livello.robe.filter(r => r.che === 'mostro').map(r => r.mondo))
  await page.locator('button[aria-label="indietro"]').click()
  await page.waitForSelector('.carte', { timeout: 15000 })
  const a = await avventura()
  const s = a.mondo?.sopra?.scontro
  controlla('uscendo, chi è in campo resta scritto', !!s && s.campo.length === campo.length, JSON.stringify(s))
  await scegli(page, 'sotterraneo3d')
  await mondoPronto(page)
  await aspettaLoScontro()
  const di = await page.evaluate(() => window.__mondo3d.palco().corsa.livello.robe.filter(r => r.che === 'mostro').map(r => r.mondo))
  uguale('rientrando lo scontro si riapre con gli stessi', di.sort().join(), campo.sort().join())
  await scatto(page, 'sotterraneo-mostri-sopra-ripreso')
  await page.locator('[data-azione="scappa"]').click().catch(() => {})
  await page.waitForFunction(() => !window.__mondo3d.inScontro(), null, { timeout: 20000 }).catch(() => {})
}

/* ---------- 4. svenuti: la città più vicina, metà delle gemme, i rari restano; la guaritrice cura ---------- */
{
  const raro = pezzoNuovo({ livello: 3, rarita: 'raro', rnd: seminato(3) })
  await entra(2, { sopra: { v: VERSIONE_SOPRA, eroe: 'cavaliere', giro: 0, passi: 0, morti: {}, forze: { vita: 1, energia: 0 }, perTerra: [] } },
              { roba: { ...campagnaSeminata({ finite: 2 }).cfg.avventure.cavaliere.roba, gemme: 40, zaino: [raro, 'pozione-piccola'] } })
  await page.evaluate(p => window.__mondo3d.porta(p.x, p.z), VESPE)
  await aspettaLoScontro()
  uguale('con una vita sola si sviene', await finoAllaFine(false), 'svenuto')
  const f = page.locator('[data-risveglio-sopra]')
  uguale('il foglio dice la città più vicina', await f.getAttribute('data-citta'), 'villaggio')
  await scatto(page, 'sotterraneo-mostri-sopra-svenuto')
  await page.locator('[data-azione="risveglio"]').click()
  await page.waitForFunction(() => !window.__mondo3d.inScontro(), null, { timeout: 20000 })
  await attendi(page, 1500)
  const a = await avventura()
  uguale('metà delle gemme', a.roba.gemme, 20)
  controlla('il pezzo raro è ancora in tasca', a.roba.zaino.includes(raro), a.roba.zaino.join())
  controlla('la pozione no', !a.roba.zaino.includes('pozione-piccola'), a.roba.zaino.join())
  const [x, y] = await cella()
  uguale('ci si sveglia nel villaggio', (cittaInCella(m, x, y) || {}).chiave, 'villaggio')
  controlla('con mezza vita', a.mondo?.sopra?.forze && a.mondo.sopra.forze.vita < 20, JSON.stringify(a.mondo?.sopra?.forze))
  await scatto(page, 'sotterraneo-mostri-sopra-risveglio')
  // la guaritrice cura le ferite di sopra
  await page.evaluate(() => window.__mondo3d.vai('mercante:villaggio:erborista'))
  await attendi(page, 1500)
  await toccaNelMondo(page, '[data-mercante="erborista"][data-citta="villaggio"]', { tocca })
  await nelDialogo(page, '[data-scelta="cura"]', { tocca: async sel => { const r = await page.locator(sel).boundingBox(); await tocca(r.x + r.width / 2, r.y + r.height / 2) } })
  await attendi(page, 1200)
  const c = await avventura()
  controlla('curati: la vita di sopra è piena', !c.mondo?.sopra?.forze || c.mondo.sopra.forze.vita >= 20, JSON.stringify(c.mondo?.sopra?.forze))
}

/* ---------- 5. la caccia aperta della bacheca, e il bottino per terra ---------- */
{
  await entra(6, { quest: { stati: { [CACCIA]: 'presa' }, fatte: 0 },
                   sopra: { v: VERSIONE_SOPRA, eroe: 'cavaliere', giro: 0, passi: 0, morti: {}, forze: null, perTerra: [{ cosa: 'pozione', ...POZIONE }] } },
              { conti: { [CACCIA]: 5 } })
  await page.evaluate(p => window.__mondo3d.porta(p.x, p.z), ROVINE)
  await aspettaLoScontro()
  const tipi = await page.evaluate(() => window.__mondo3d.palco().corsa.livello.robe.filter(r => r.che === 'mostro').map(r => r.tipo))
  controlla('in campo c\'è lo zombie che manca alla caccia', tipi.includes('zombie'), tipi.join())
  // la riga resta due secondi: un osservatore in pagina ricorda tutto quello che ha detto (un poll a fotogrammi la può mancare)
  await page.evaluate(() => {
    window.__dette = []
    const guarda = () => { const t = document.querySelector('[data-detto-sopra]')?.innerText; if (t && window.__dette.at(-1) !== t) window.__dette.push(t) }
    new MutationObserver(guarda).observe(document.body, { childList: true, subtree: true, characterData: true })
  })
  uguale('lo scontro si vince', await finoAllaFine(true), 'finito')
  const dette = await page.evaluate(() => window.__dette)
  controlla('e la riga sopra il mondo dice che la caccia è fatta', dette.some(t => t.includes('Fatto')), JSON.stringify(dette))
  await attendi(page, 1200)
  const a = await avventura()
  uguale('la caccia aperta è fatta', a.mondo?.quest?.stati?.[CACCIA], 'fatta')
  await page.waitForSelector('[data-per-terra][data-cosa="pozione"]', { state: 'attached', timeout: 15000 })
  const prima = (a.roba.zaino || []).filter(k => k === 'pozione').length
  await toccaNelMondo(page, '[data-per-terra][data-cosa="pozione"]', { tocca })
  await page.waitForFunction(() => !document.querySelector('[data-per-terra][data-cosa="pozione"]'), null, { timeout: 30000 }).catch(() => {})
  await attendi(page, 1000)
  const b = await avventura()
  uguale('la pozione per terra è in tasca', (b.roba.zaino || []).filter(k => k === 'pozione').length, prima + 1)
  uguale('e non è più per terra', (b.mondo?.sopra?.perTerra || []).length, 0)
}

uguale('nessun errore nella pagina', errori.join('\n'), '')
await browser.close()
riassunto('i mostri del mondo di sopra')
