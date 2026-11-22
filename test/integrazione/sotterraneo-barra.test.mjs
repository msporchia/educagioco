/* ═══════════════════════════════════════════════════════════════════
   LA BARRA IN BASSO E IL TOCCO ALTROVE, COL DITO VERO


   perché: la barra di Diablo sopra e sotto, i globi e le caselle, e quali fogli si chiudono con un tocco sul campo (la curiosità no, la battuta sì)
   a parte perché: parte da una sosta in Node con vita a metà e mostri spenti, e prova la barra; la pozione che apre la scelta sta in sotterraneo-scontro-eroe
   La barra è quella di Diablo, la stessa sopra e sotto (docs/sotterraneo/barra.md): il globo rosso della vita, il globo
   dell'energia, in mezzo le caselle tutte della stessa forma. E quello che si legge e basta si chiude toccando il campo, con
   l'eroe che intanto cammina; quello che chiede una scelta no (docs/core/interfaccia.md, «Un tocco altrove chiude»).

   Sopra: la barra, i globi che aprono la finestra dell'eroe, gli incanti. Giù, da una sosta in Node con la vita a metà e i mostri
   spenti: la stessa barra, nello schermo a 390 e a 320 px; la pozione bevuta dalla casella, e una buttata e raccolta col dito che
   fa risalire la casella; una curiosità, la cui domanda non si chiude toccando fuori e la battuta sì, mentre l'eroe parte; lo
   zaino e la mappa grande chiusi da un tocco sul campo; «lascio perdere» che resta. Col dito vero (`ditoDi`).
   `node test/esegui.mjs sotterraneo-barra`
   tempo: 120
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, mondoPronto, ditoDi, pronto } from '../aiuto/browser.mjs'
import { viaLaFesta } from '../aiuto/sotterraneo-sopra.mjs'
import { controlla, uguale, dentro, blocco, riassunto } from '../aiuto/verifica.mjs'
import { profiloDelSotterraneo, fermoGiu, cellaGiu, schermoDi, eroeIn, riprendiLaSosta } from '../aiuto/sotterraneo-discesa.mjs'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { scrivi } from '../../src/giochi/sotterraneo/motore/sosta.js'

// due pozioni dello stesso stadio: la 🧪 beve al tocco; con stadi diversi apre la scelta (integrazione/sotterraneo-scontro-eroe)
const roba = { v: 1, gemme: 40, zaino: ['pozione', 'pozione'], mano: 'spada', mancina: null, corpo: null, dito: null, torcia: 2, torce: 0 }
const profilo = avventura => profiloDelSotterraneo({ tappa: 0, avventura: { roba, ...avventura } })

// il piano: il primo seme della prima discesa con una curiosità in un'altra stanza
let piano = null
for (let seme = 1; seme < 200 && !piano; seme++) {
  const c = new Corsa(CAMPAGNA[0], { seme, eroe: 'cavaliere', roba })
  const L = c.livello, qui = L.stanzaDi(Math.floor(c.eroe.x), Math.floor(c.eroe.y))
  const cur = L.robe.find(r => r.che === 'curiosita' && L.stanzaDi(r.x, r.y) !== qui)
  if (cur) piano = { seme, c, curiosita: L.robe.indexOf(cur) }
}
controlla('c\'è un piano della prima discesa con una curiosità', !!piano)

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
const { tocca, toccaIl } = await ditoDi(page)
await semina(page, profilo({}))
await viaLaFesta(page)
await scegli(page, 'sotterraneo')
await mondoPronto(page)

const forma = () => page.locator('[data-barra-giu] [data-casella-barra]').evaluateAll(es => es.map(e => e.dataset.casellaBarra).join())
const globi = () => page.locator('[data-barra-giu] [data-globo]').evaluateAll(es => es.map(e => e.dataset.globo).join())
const quota = async tipo => Number(await page.locator(`[data-globo="${tipo}"]`).getAttribute('data-quota'))
const numeroDel = async tipo => Number((await page.locator(`[data-globo="${tipo}"] .sot-globo-numero`).textContent()) || 0)
const pozioni = async () => Number(await page.locator('[data-casella-barra="pozione"]').getAttribute('data-n'))
// chiude una finestra con la sua ✕ e aspetta che se ne vada
async function chiudi(sel, che = sel) {
  await toccaIl(`${sel} [data-chiudi]`)
  await page.waitForSelector(che, { state: 'detached', timeout: 3000 })
}

/* ---------- sopra: la barra, con la stessa forma di giù ---------- */
let formaSopra = '', globiSopra = ''
await blocco('sopra, la barra', async () => {
  uguale('sopra c\'è la barra in basso', await page.locator('[data-barra="sopra"]').count(), 1)
  formaSopra = await forma(); globiSopra = await globi()
  uguale('coi due globi: la vita e l\'energia', globiSopra, 'vita,energia')
  uguale('le caselle: niente diario, c\'è quella degli incanti', formaSopra, 'pozione,zaino,incanti,mappa,gemme')
  uguale('sopra la vita è piena', await quota('vita'), 1)
  uguale('sopra la mappa grande è accesa: apre la veduta d\'insieme del mondo', await page.locator('[data-casella-barra="mappa"]').isDisabled(), false)
  uguale('il tasto del globo sa il livello', await page.locator('[data-azione="eroe-pagina"]').getAttribute('data-livello'), '1')
  controlla('il globo dice fatta/serve, da zero', /^0\/\d+$/.test((await page.locator('[data-esperienza-barra] .sot-esp-numero').textContent()).trim()))
  uguale('le gemme sono una casella come le altre', await page.locator('[data-casella-barra="gemme"]').evaluate(e => e.tagName), 'BUTTON')
  await scatto(page, 'barra-sopra')
})

/* ---------- sopra: i globi aprono la finestra dell'eroe, il diario è una sua scheda, gli incanti hanno la casella ---------- */
await blocco('sopra, i globi e gli incanti', async () => {
  await toccaIl('[data-barra-giu] [data-azione="vita"]')
  await page.waitForSelector('[data-pagina-eroe]', { timeout: 3000 })
  uguale('il globo rosso apre la finestra dell\'eroe, sulla scheda Eroe', await page.locator('[data-scheda][aria-selected="true"]').getAttribute('data-scheda'), 'eroe')
  uguale('con quattro linguette', await page.locator('[data-scheda]').evaluateAll(es => es.map(e => e.dataset.scheda).join()), 'zaino,eroe,abilita,missioni')
  await toccaIl('[data-scheda="missioni"]')
  await page.waitForSelector('[data-diario]', { timeout: 3000 })
  uguale('le missioni sono la quarta scheda', await page.locator('[data-scheda][aria-selected="true"]').getAttribute('data-scheda'), 'missioni')
  uguale('con la storia in cima', await page.locator('[data-diario] [data-sezione]').first().getAttribute('data-sezione'), 'storia')
  await toccaIl('[data-scheda="abilita"]')
  await page.waitForSelector('[data-pagina-abilita]', { timeout: 3000 })
  await chiudi('[data-pagina-abilita]', '.sot-cornice')
  uguale('la ✕ chiude la finestra', await page.locator('.sot-cornice').count(), 0)
  await toccaIl('[data-barra-giu] [data-azione="abilita"]')
  await page.waitForSelector('[data-pagina-abilita]', { timeout: 3000 })
  uguale('il globo blu apre l\'eroe sulla scheda Abilità', await page.locator('[data-scheda][aria-selected="true"]').getAttribute('data-scheda'), 'abilita')
  await chiudi('[data-pagina-abilita]', '.sot-cornice')
  uguale('sopra la casella degli incanti è spenta, ma si tocca', await page.locator('[data-casella-barra="incanti"]').evaluate(e => e.classList.contains('sot-vuota') && !e.disabled), true)
  await toccaIl('[data-casella-barra="incanti"]')
  await page.waitForSelector('[data-preparati]', { timeout: 3000 })
  uguale('e dice che si preparano giù', await page.locator('[data-prep-sopra]').count(), 1)
  uguale('senza elenco da scegliere', await page.locator('[data-azione="prepara-campo"]').count(), 0)
  await chiudi('[data-preparati]')
  uguale('la ✕ la chiude', await page.locator('[data-preparati]').count(), 0)
})

/* ---------- giù, da una sosta con la vita a metà; i mostri del piano spenti ---------- */
{
  const c = piano.c
  c.vita = Math.ceil(c.vitaMax / 2)
  await riprendiLaSosta(page, profilo({ sosta: scrivi(c, 0) }))
  // non si tolgono dalla lista (la sosta conta le cose per indice): si spengono
  await page.evaluate(() => { const c = window.__sotterraneo3d.corsa; c.ricomparsa = false; for (const m of c.livello.robe) if (m.che === 'mostro') { m.morto = true; m.presa = true; m.sveglio = false } })
}

// la barra sta nello schermo: le caselle fra i due globi, tutte uguali e non troppo strette, niente che sbordi di lato
async function nelloSchermo(largo) {
  const sx = await page.locator('[data-globo="vita"]').boundingBox()
  const dx = await page.locator('[data-globo="energia"]').boundingBox()
  const celle = await page.locator('.sot-cella').evaluateAll(es => es.map(e => e.getBoundingClientRect()).map(r => [r.left, r.right, r.width]))
  controlla(`${largo} px: le caselle stanno fra i globi`, celle.length > 0 && celle.every(([l, r]) => l >= sx.x + sx.width && r <= dx.x), JSON.stringify(celle))
  controlla(`${largo} px: nessuna casella più stretta di 22 px`, celle.every(([, , w]) => w >= 22), JSON.stringify(celle))
  controlla(`${largo} px: tutte le caselle della stessa larghezza`, new Set(celle.map(([, , w]) => Math.round(w))).size === 1, JSON.stringify(celle))
  const barra = await page.locator('[data-barra-giu]').boundingBox()
  controlla(`${largo} px: la barra è bassa (al più 70 px)`, barra.height <= 70, String(barra.height))
  const scorre = await page.evaluate(() => document.documentElement.scrollWidth)
  controlla(`${largo} px: niente scorrimento di lato`, scorre <= largo, `${scorre} px`)
}

await blocco('giù, la stessa barra', async () => {
  uguale('la barra in basso c\'è', await page.locator('[data-barra="giu"]').count(), 1)
  uguale('con le stesse caselle di sopra', await forma(), formaSopra)
  uguale('e gli stessi globi', await globi(), globiSopra)
  dentro('la vita a metà', await quota('vita'), 0.44, 0.56)
  uguale('le due pozioni sulla casella', await pozioni(), 2)
  uguale('niente globo della luce né casella delle torce: la luce si vede nella scena', await page.locator('[data-globo="luce"], [data-casella-barra="torcia"]').count(), 0)
  uguale('niente scanalatura dell\'esperienza: è il globo', await page.locator('[data-barra-giu] [data-esperienza]').count(), 0)
  uguale('attacco e difesa non stanno più in cima: si leggono sull\'eroe', await page.locator('[data-azione="zaino-barra"]').count(), 0)
  await nelloSchermo(390)
  await scatto(page, 'barra-meta')
  await page.setViewportSize({ width: 320, height: 640 })
  await page.waitForFunction(() => document.documentElement.clientWidth === 320, null, { timeout: 3000 })
  await page.evaluate(() => new Promise(f => requestAnimationFrame(() => requestAnimationFrame(f))))
  await nelloSchermo(320)
  await scatto(page, 'barra-320')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.evaluate(() => new Promise(f => requestAnimationFrame(() => requestAnimationFrame(f))))
})

// giù, come sopra: i globi aprono l'eroe, la casella degli incanti c'è anche senza incanti e dice perché (e porta all'albero)
await blocco('giù, la finestra dell\'eroe e gli incanti', async () => {
  await toccaIl('[data-barra-giu] [data-azione="vita"]')
  await page.waitForSelector('[data-pagina-eroe]', { timeout: 3000 })
  await toccaIl('[data-scheda="missioni"]')
  await page.waitForSelector('[data-diario]', { timeout: 3000 })
  uguale('giù le missioni sono la stessa scheda, senza «vai da»', await page.locator('[data-diario] [data-azione="vai-da"]').count(), 0)
  await chiudi('[data-diario]', '.sot-cornice')
  uguale('senza incanti da preparare la casella è spenta, a 0/0', await page.locator('[data-casella-barra="incanti"]').evaluate(e => e.classList.contains('sot-vuota') && e.textContent.trim() === '0/0'), true)
  await toccaIl('[data-casella-barra="incanti"]')
  await page.waitForSelector('[data-preparati]', { timeout: 3000 })
  uguale('si apre lo stesso e dice che non ne sa nessuno', await page.locator('[data-prep-nessuno]').count(), 1)
  await pronto(page, '[data-preparati]')   // i 320 ms ciechi: il tocco che ha aperto la finestra non deve premere i suoi tasti
  await toccaIl('[data-preparati] [data-azione="apri-albero"]')
  await page.waitForSelector('[data-pagina-abilita]', { timeout: 3000 })
  uguale('e porta all\'albero, senza lasciare la finestra di prima aperta', await page.locator('[data-preparati]').count(), 0)
  await chiudi('[data-pagina-abilita]', '.sot-cornice')
})

// una cella vuota sullo schermo, a qualche passo dall'eroe, dove si arriva: per il tocco che chiude e cammina
const unaCellaLibera = (min = 3) => page.evaluate(min => {
  const s = window.__sotterraneo3d, c = s.corsa, L = c.livello
  const t = document.querySelector('[data-tela="3d"]').getBoundingClientRect()
  const vuota = (x, y) => L.calpestabile(x, y) && !L.robe.some(r => r.x === x && r.y === y && r.che !== 'gemme')
  const da = { x: Math.floor(c.eroe.x), y: Math.floor(c.eroe.y) }
  const visti = new Map([[da.x + ',' + da.y, 0]]), coda = [da]
  let mig = null
  for (let i = 0; i < coda.length; i++) {
    const q = coda[i], d = visti.get(q.x + ',' + q.y)
    if (d >= min && (!mig || d < mig.d)) {
      const [sx, sy] = s.aSchermo(q.x + 0.5, 0.05, q.y + 0.5)
      const x = t.x + sx, y = t.y + sy
      if (x > t.x + 20 && x < t.right - 20 && y > t.y + 30 && y < t.bottom - 60 && !(x > t.right - 150 && y < t.y + 150)) mig = { x: q.x, y: q.y, d, sx: x, sy: y }
    }
    if (d >= 12) continue
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = q.x + dx, y = q.y + dy
      if (vuota(x, y) && !visti.has(x + ',' + y)) { visti.set(x + ',' + y, d + 1); coda.push({ x, y }) }
    }
  }
  return mig
}, min)

/* ---------- la pozione si beve dalla casella (prima della curiosità, che può far salire di livello e rimettere la vita) ---------- */
await blocco('la pozione dalla casella', async () => {
  const n0 = await pozioni(), v0 = await numeroDel('vita')
  await toccaIl('[data-azione="bevi"]')
  await page.waitForFunction(n => Number(document.querySelector('[data-casella-barra="pozione"]').dataset.n) === n, n0 - 1, { timeout: 3000 }).catch(() => {})
  uguale('un tocco sulla 🧪 beve, e il numero cala', await pozioni(), n0 - 1)
  controlla('e la vita risale', (await numeroDel('vita')) > v0, `${v0} → ${await numeroDel('vita')}`)
  uguale('senza aprire lo zaino', await page.locator('[data-zaino]').count(), 0)
})

/* ---------- la curiosità: la domanda resta, la battuta si chiude toccando il campo ---------- */
await blocco('la curiosità e il tocco altrove', async () => {
  await fermoGiu(page)
  await page.evaluate(i => { const c = window.__sotterraneo3d.corsa; c.interagisci(c.livello.robe[i]) }, piano.curiosita)
  await page.waitForSelector('.sot-domanda .qz-tasto', { timeout: 8000 })
  let prima = await cellaGiu(page)
  let altrove = await unaCellaLibera()
  controlla('c\'è una cella libera nel campo, a qualche passo', !!altrove)
  await tocca(altrove.sx, altrove.sy)
  await attendi(page, 700)   // un tocco che facesse camminare si vedrebbe in questo tempo
  uguale('una domanda non si chiude toccando fuori', await page.locator('.sot-domanda').count(), 1)
  uguale('e quel tocco non fa camminare', await cellaGiu(page), prima)
  await page.locator('.sot-domanda .qz-tasto[data-giusta]').first().click()
  await page.waitForSelector('.sot-storia', { timeout: 5000 })
  uguale('la battuta dice cosa si è guadagnato', await page.locator('.sot-cambio').count(), 1)
  await scatto(page, 'barra-battuta')
  prima = await cellaGiu(page)
  altrove = await unaCellaLibera()
  await tocca(altrove.sx, altrove.sy)
  await page.waitForSelector('.sot-storia', { state: 'detached', timeout: 3000 }).catch(() => {})
  uguale('un tocco sul campo chiude la battuta', await page.locator('.sot-storia').count(), 0)
  await page.waitForFunction(k => document.querySelector('[data-tela="3d"]').dataset.eroe !== k, prima, { timeout: 5000 }).catch(() => {})
  controlla('e intanto l\'eroe cammina verso dove si è toccato', (await cellaGiu(page)) !== prima, prima)
  await eroeIn(page, `${altrove.x},${altrove.y}`, 15000)
  uguale('arrivato dove si è toccato', await cellaGiu(page), `${altrove.x},${altrove.y}`)
  uguale('e il tocco non ha aperto nient\'altro', await page.locator('.sot-foglio, .sot-velo, .sot-sipario').count(), 0)
})

/* ---------- una pozione raccolta col dito fa salire la casella ----------
   Il guasto dell'utente: «ho raccolto una pozione e la casella non l'ha segnata». Si butta l'ultima pozione (la casella
   si spegne) e la si raccoglie toccandola per terra: la casella si riaccende e il numero sale */
await blocco('la pozione raccolta col dito', async () => {
  await fermoGiu(page)
  const n0 = await pozioni()
  const [ex, ey] = (await cellaGiu(page)).split(',').map(Number)
  await toccaIl('[data-azione="zaino"]')
  await page.waitForSelector('[data-zaino]', { timeout: 3000 })
  await attendi(page, 400)   // i 320 ms ciechi dello zaino
  for (let i = 0; i < n0; i++) {
    const tasca = await page.locator('[data-tasca][data-cosa^="pozione"]').first().getAttribute('data-tasca')
    await toccaIl(`[data-tasca="${tasca}"]`)
    await page.waitForSelector('[data-azione="butta"]', { timeout: 3000 })
    await attendi(page, 400)
    await toccaIl('[data-azione="butta"]')
    await page.waitForFunction(t => !document.querySelector(`[data-tasca="${t}"][data-cosa^="pozione"]`), tasca, { timeout: 3000 }).catch(() => {})
  }
  await chiudi('[data-zaino]')
  uguale('buttate le pozioni, la casella è vuota', await pozioni(), 0)
  uguale('e spenta', await page.locator('[data-casella-barra="pozione"].sot-vuota').count(), 1)
  // per terra, accanto a dov'era l'eroe: si tocca una cella alla volta finché la casella non si riaccende
  for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const s = await schermoDi(page, ex + dx + 0.5, ey + dy + 0.5)
    await tocca(s.x, s.y)
    await page.waitForFunction(() => Number(document.querySelector('[data-casella-barra="pozione"]').dataset.n) > 0, null, { timeout: 1500 }).catch(() => {})
    await fermoGiu(page)
    if (await pozioni() > 0) break
  }
  uguale('raccolta col dito, la casella risale', await pozioni(), 1)
  uguale('e si riaccende', await page.locator('[data-casella-barra="pozione"].sot-vuota').count(), 0)
})

/* ---------- lo zaino si chiude toccando il campo fuori dalla cornice ----------
   Su un telefono la cornice riempie lo schermo (a 390 × 844 restano dieci pixel sopra, e la prova di prima finiva in una
   `nota`): il campo fuori si tocca su un tablet, accanto alla cornice */
await blocco('lo zaino si chiude toccando fuori', async () => {
  await page.setViewportSize({ width: 820, height: 1180 })
  await page.waitForFunction(() => document.documentElement.clientWidth === 820, null, { timeout: 3000 })
  await fermoGiu(page)
  await toccaIl('[data-azione="zaino"]')
  await page.waitForSelector('[data-zaino]', { timeout: 3000 })
  await attendi(page, 400)   // i 320 ms ciechi
  const sip = await page.locator('.sot-sipario').boundingBox()
  const cor = await page.locator('.sot-cornice').boundingBox()
  const t = await page.locator('[data-tela="3d"]').boundingBox()
  const prima = await cellaGiu(page)
  // il campo fuori dalla cornice, a sinistra di lei, dentro il sipario e la tela
  const [a, b] = [Math.max(sip.x, t.x), cor.x]
  controlla('accanto alla cornice resta del campo da toccare', b - a > 24, JSON.stringify({ sip, cor, t }))
  await tocca((a + b) / 2, cor.y + cor.height / 2)
  await page.waitForSelector('[data-zaino]', { state: 'detached', timeout: 3000 }).catch(() => {})
  uguale('lo zaino si chiude toccando fuori', await page.locator('[data-zaino]').count(), 0)
  await page.waitForFunction(k => document.querySelector('[data-tela="3d"]').dataset.eroe !== k || document.querySelector('.sot-avviso'), prima, { timeout: 5000 }).catch(() => {})
  controlla('e l\'eroe va dove si è toccato', (await cellaGiu(page)) !== prima || (await page.locator('.sot-avviso').count()) > 0, prima)
  await page.setViewportSize({ width: 390, height: 844 })
  await fermoGiu(page)
})

/* ---------- la mappa grande si apre dalla casella e si chiude toccando il campo ---------- */
await blocco('la mappa grande', async () => {
  await toccaIl('[data-azione="mappina"]')
  await page.waitForSelector('[data-azione="mappina"][aria-pressed="true"]', { timeout: 3000 }).catch(() => {})
  uguale('la 🗺️ apre la mappa grande', await page.locator('[data-azione="mappina"]').getAttribute('aria-pressed'), 'true')
  await scatto(page, 'barra-mappa')
  const prima = await cellaGiu(page)
  const altrove = await unaCellaLibera()
  await tocca(altrove.sx, altrove.sy)
  await page.waitForSelector('[data-azione="mappina"][aria-pressed="false"]', { timeout: 3000 }).catch(() => {})
  uguale('un tocco sul campo la chiude', await page.locator('[data-azione="mappina"]').getAttribute('aria-pressed'), 'false')
  await page.waitForFunction(k => document.querySelector('[data-tela="3d"]').dataset.eroe !== k, prima, { timeout: 5000 }).catch(() => {})
  controlla('e l\'eroe cammina', (await cellaGiu(page)) !== prima, prima)
  await fermoGiu(page)
})

/* ---------- «lascio perdere» è una scelta: non si chiude toccando fuori ---------- */
await blocco('«lascio perdere» resta', async () => {
  await toccaIl('button[aria-label="pausa"]')
  await page.waitForSelector('[data-pausa] [data-azione="lascia-discesa"]', { timeout: 3000 })
  await pronto(page, '[data-pausa]')   // il velo è cieco per un attimo
  await toccaIl('[data-azione="lascia-discesa"]')
  await page.waitForSelector('[data-lascio-perdere]', { timeout: 3000 })
  await attendi(page, 400)
  const m = await page.locator('[data-lascio-perdere] .sot-modale').boundingBox()
  await tocca(m.x + m.width / 2, Math.max(8, m.y - 30))
  await attendi(page, 400)   // un foglio si chiude un fotogramma dopo: qui deve restare
  uguale('«lascio perdere» non si chiude toccando fuori', await page.locator('[data-lascio-perdere]').count(), 1)
  await toccaIl('[data-azione="scorda-no"]')
  await page.waitForSelector('[data-lascio-perdere]', { state: 'detached', timeout: 3000 }).catch(() => {})
  uguale('«no» lo chiude', await page.locator('[data-lascio-perdere]').count(), 0)
})

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('la barra in basso e il tocco altrove')
