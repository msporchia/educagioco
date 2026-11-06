/* ═══════════════════════════════════════════════════════════════════
   IL LABORATORIO DELLE POZIONI, NEL BROWSER

   La prova unitaria dice che il motore è giusto; questa dice che il
   gioco che il bambino tocca è quel motore lì. La prima tappa si gioca
   **dallo schermo**: il rotolo del mercante è già aperto, si toccano le
   targhette e si ordina, poi si segue la ricetta. Poi la fine
   della tappa, quello che resta nel profilo, un trabocco e la spugna.
   `node test/esegui.mjs pozioni`
   tempo: 420
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, leggiProfilo, scatto, attendi, scegli }
  from '../aiuto/browser.mjs'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA, MONETE_A_DOSE } from '../../src/giochi/pozioni/dati/campagna.js'
import { prossimaMossa } from '../../src/giochi/pozioni/motore/procedimento.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
/* un bambino di nove anni: il laboratorio è in home, e le prime tappe
   dei pesi gli sono già passate — quindi aperte */
await semina(page, { settings: { eta: 9 } })

/* ---------- 1. si entra dalla home ---------- */
const carta = page.locator('.carta.gioco[data-gioco="pozioni"]')
controlla('la carta del gioco è in home', await carta.count() === 1)
await scegli(page, 'pozioni')
await page.waitForSelector('.pz-mappa', { timeout: 5000 })
uguale('la mappa elenca tutte le tappe', await page.locator('.pz-tappa:not(.pz-infinita)').count(), CAMPAGNA.length)
uguale('e in fondo il calderone senza fondo', await page.locator('[data-tappa="infinita"]').count(), 1)
uguale('quattro blocchi: tre famiglie e il calderone', await page.locator('.pz-blocco').count(), 4)
const aperte = await page.locator('.pz-tappa:not(.pz-chiusa)').count()
dentro('a nove anni sono aperte le prime tappe dei pesi', aperte, 1, 9)
nota(`${aperte} tappe aperte a nove anni`)
await scatto(page, 'pozioni-mappa')

/* ---------- 2. la prima tappa, dallo schermo ---------- */
await page.locator('.pz-tappa[data-tappa="0"]').click()
await page.waitForSelector('.pz-mercante', { timeout: 5000 })
await attendi(page, 500)
uguale('si comincia dal listino', await page.locator('.pz-mercante').getAttribute('data-fase'), 'listino')
uguale('la pergamena ha gli ingredienti della ricetta', await page.locator('[data-pergamena] [data-voce]').count(), CAMPAGNA[0].ingredienti)
controlla('il rotolo dice come si gioca', /mercante/.test(await page.locator('[data-esito]').innerText()))
controlla('la borsa dice quanto si è speso, su quanto', /Hai speso 0 su \d+/.test(await page.locator('[data-gettoni]').innerText()))
await scatto(page, 'pozioni-gioco')

await page.waitForSelector('[data-listino]')
uguale('il rotolo ha tutti gli ingredienti della ricetta, e solo quelli', await page.locator('[data-merce]').count(), CAMPAGNA[0].ingredienti)
uguale('quattro targhette a ingrediente', await page.locator('[data-targhetta]').count(), CAMPAGNA[0].ingredienti * 4)
controlla('il gettone non è una moneta: a sei lati, sul listino e nella borsa', await page.evaluate(() => {
  const tutti = [...document.querySelectorAll('[data-listino] .pz-gettone, [data-gettoni] .pz-gettone')]
  return tutti.length > 4 && tutti.every(g => { const s = getComputedStyle(g); return s.clipPath.startsWith('polygon') && s.borderRadius === '0px' })
}))
controlla('e sul banco di monete non ce ne sono', !/🪙|monet/i.test(await page.locator('[data-listino]').innerText() + await page.locator('[data-gettoni]').innerText()) || /non le tue monete/.test(await page.locator('[data-esito]').innerText()))
await scatto(page, 'pozioni-listino')

const stato = () => page.evaluate(() => {
  const b = window.__poz.bottega.value
  return { speso: b.speso, finita: b.finita, macchie: b.macchie.length, traboccate: b.traboccate,
           messi: b.ingredienti.map(g => g.messo), voci: b.ingredienti.map(g => g.nome) }
})
/* la più grande che ci sta per il primo ingrediente non finito, come farebbe chi sa */
const laGiusta = () => page.evaluate(() => {
  const b = window.__poz.bottega.value
  const i = b.ingredienti.findIndex(g => g.messo < g.dose), g = b.ingredienti[i]
  const k = g.offerte.map((o, n) => n).filter(n => g.messo + g.offerte[n].base <= g.dose)
    .sort((x, y) => g.offerte[y].base - g.offerte[x].base || g.offerte[x].prezzo - g.offerte[y].prezzo)[0]
  return `${i}:${k}`
})
async function ordinaUna(targhetta) {
  if (!(await page.locator('[data-listino]').count())) await page.locator('[data-azione="mercante"]').click()
  await page.locator(`[data-targhetta="${targhetta}"]`).click()
  await page.locator('[data-azione="ordina"]').click()
}
const fermo = () => page.waitForFunction(() => {
  const el = document.querySelector('[data-azione="mercante"], [data-azione="pulisci"], [data-fase="procedimento"], [data-fine]')
  return el && !el.disabled
}, null, { timeout: 25000 })

/* un posto dell'ordine toccato si toglie */
await page.locator(`[data-targhetta="${await laGiusta()}"]`).click()
uguale('la targhetta va nello scontrino', await page.locator('[data-scontrino] [data-posto]').count(), 1)
{ const prezzo = await page.evaluate(() => { const v = window.__poz.bozza.value[0]; return window.__poz.bottega.value.ingredienti[v.i].offerte[v.k].prezzo })
  controlla('la spedizione si vede', /Spedizione/.test(await page.locator('[data-spedizione]').innerText()))
  uguale('e il totale la conta', (await page.locator('[data-totale] b').innerText()).trim(), String(prezzo + 1)) }
controlla('la borsa fa vedere quanto costa l\'ordine', /ordine \d+/.test(await page.locator('[data-gettoni]').innerText()))
await page.locator('[data-posto="0"]').click()
uguale('e dallo scontrino si toglie', await page.locator('[data-scontrino] [data-posto]').count(), 0)
await page.locator('[data-chiudi]').click()
uguale('la ✕ chiude il rotolo', await page.locator('[data-listino]').count(), 0)

/* si fanno le dosi, con le targhette vere */
for (let g = 0; g < 40 && !(await page.locator('[data-fase="procedimento"]').count()); g++) {
  await page.waitForFunction(() => document.querySelector('[data-azione="mercante"]')?.disabled === false || document.querySelector('[data-listino]'), null, { timeout: 15000 })
  await ordinaUna(await laGiusta())
  await fermo()
}
uguale('fatta la spesa si passa al procedimento', await page.locator('.pz-mercante').getAttribute('data-fase'), 'procedimento')
controlla('la pergamena dice cosa fare', (await page.locator('[data-ricetta]').innerText()).length > 10)
await scatto(page, 'pozioni-procedimento')

/* si trascina col dito: dalla roba sotto, e dagli attrezzi sul tavolo */
/* mentre la scena suona una mossa il banco non si prende: come il dito, si aspetta */
const scenaFerma = () => page.waitForFunction(() => window.__bottega3d.ferma?.(), null, { timeout: 30000 })
const trascina = async (da, a) => {
  await scenaFerma()
  await page.mouse.move(da.x, da.y); await page.mouse.down()
  await page.mouse.move((da.x + a.x) / 2, (da.y + a.y) / 2, { steps: 4 }); await page.mouse.move(a.x, a.y, { steps: 4 })
  await page.mouse.up()
}
const dove = id => page.evaluate(id => window.__bottega3d.dove(id), id)
/* i gesti: l'attrezzo si porta sul bersaglio e lì lo muove il dito */
const porta = async (da, a) => {
  await scenaFerma()
  await page.mouse.move(da.x, da.y); await page.mouse.down()
  await page.mouse.move((da.x + a.x) / 2, (da.y + a.y) / 2, { steps: 4 }); await page.mouse.move(a.x, a.y, { steps: 4 })
}
const giro = async c => { for (let n = 0; n <= 56; n++) await page.mouse.move(c.x + Math.cos(n / 24 * Math.PI * 2) * 36, c.y + Math.sin(n / 24 * Math.PI * 2) * 30) }
const avanti = (asse, volte) => async c => { for (let n = 0; n < volte; n++) for (const v of [-34, 34]) await page.mouse.move(c.x + (asse === 'x' ? v : 0), c.y + (asse === 'y' ? v : 0), { steps: 4 }) }
/* versa finché è piegato: quanto dura lo dice l'orologio dei fotogrammi, che su una macchina carica è lento */
const fatte = () => { const b = window.__poz.bottega.value; return b.passo + b.dentro.length + b.mortaio.length }
/* basta arrivare: una volta si stacca il dito, una volta si sta fermi e poi si scappa via, e deve finire lo stesso */
let versate = 0
const inclina = foto => async c => {
  const n = await page.evaluate(fatte)
  if (foto) await scatto(page, foto)
  if (versate++ % 2) await page.mouse.up()
  else { await attendi(page, 1500); await page.mouse.move(c.x + 300, c.y + 200, { steps: 3 }) }
  await page.waitForFunction(`(${fatte})() > ${n}`, null, { timeout: 13000 })
}
const GESTO = { mestolo: giro, pestello: avanti('y', 6), coltello: avanti('y', 6), roba: avanti('y', 6), fiammifero: avanti('x', 4),
                bacchetta: avanti('x', 5), sale: avanti('y', 4), pepe: avanti('y', 4), brocca: inclina(), mortaio: inclina(), tagliere: inclina(), ciotolino: inclina('pozioni-ciotolino') }
/* la roba nel suo recipiente si versa piegandola, come il mortaio */
const nelRecipiente = id => page.evaluate(i => { const b = window.__poz.bottega.value, g = b.ingredienti[i]; return g.famiglia === 'capacita' || (g.famiglia === 'massa' && !b.passi.some(p => p.azione === 'gratta' && p.cosa.includes(i))) }, Number(id.slice(5)))
const conGesto = async (id, su) => {
  const a = await dove(su), da = await dove(id), calderone = await dove('calderone')
  /* la fiala non si tuffa: il mestolo pesca nel calderone e il brodo lo porta lui */
  if (su === 'fiala') { await porta(da, calderone); await page.mouse.move(a.x, a.y, { steps: 6 }) }
  else await porta(da, a)
  await attendi(page, 100)
  const gesto = su === 'fiala' ? inclina('pozioni-fiala') : id.startsWith('roba:') && su !== 'grattugia' ? inclina('pozioni-ciotola') : GESTO[id.split(':')[0]]
  await gesto(a)
  await attendi(page, 150)
  await page.mouse.up()
}
const prossimo = () => page.evaluate(() => { const b = window.__poz.bottega.value, p = b.passi[b.passo]; return p ? { p: { azione: p.azione, cosa: [...p.cosa] }, manca: b.mancaAl(p) } : null })
async function giocaRicetta(viste) {
  for (let g = 0; g < 30; g++) {
    const q = await prossimo()
    if (!q || await page.evaluate(() => window.__poz.bottega.value.finita)) return
    const { da, su } = prossimaMossa(q.p, q.manca)
    viste.add(q.p.azione)
    const prima = await page.evaluate(() => { const b = window.__poz.bottega.value; return b.passo + b.mortaio.length + b.tagliere.length + b.dentro.length })
    if (da.startsWith('roba:') && su !== 'grattugia' && !await nelRecipiente(da)) await trascina(await dove(da), await dove(su))
    else await conGesto(da, su)
    await page.waitForFunction(n => { const b = window.__poz.bottega.value; return b.finita || b.passo + b.mortaio.length + b.tagliere.length + b.dentro.length > n }, prima, { timeout: 15000 })
      .catch(() => controlla(`la mossa ${da} → ${su} va`, false, q.p.azione))
    await attendi(page, 1100)
  }
}
const libero = () => page.waitForFunction(() => window.__poz.finale.value || !document.querySelector('.pz-attesa'), null, { timeout: 25000 })
await attendi(page, 500)

/* un pasticcio: mescolare a calderone vuoto, prima di versare */
{
  const prima = (await stato()).speso
  /* lasciato lì senza gesto non è successo niente, e la freccia dice come si fa */
  await trascina(await dove('mestolo'), await dove('calderone'))
  await page.waitForSelector('[data-suggerimento="giro"]', { timeout: 5000 })
  uguale('un attrezzo lasciato lì non è un pasticcio', (await stato()).speso, prima)
  await scatto(page, 'pozioni-suggerimento')
  await attendi(page, 500)
  await conGesto('mestolo', 'calderone')
  await page.waitForSelector('[data-esito][data-codice="trabocca"]', { timeout: 25000 })
  controlla('il cartello dice cosa diceva la ricetta', /La ricetta dice/.test(await page.locator('[data-esito]').innerText()))
  uguale('il pasticcio costa un gettone', (await stato()).speso, prima + 1)
  await libero()
  await attendi(page, 600)
}

/* la roba nel calderone, una alla volta */
const fermaLaScena = () => page.waitForFunction(() => !window.__poz.occupato.value, null, { timeout: 25000 })
for (let i = 0; i < CAMPAGNA[0].ingredienti; i++) {
  await conGesto(`roba:${i}`, 'calderone')
  await page.waitForFunction(n => window.__poz.bottega.value.dentro.length === n, i + 1, { timeout: 25000 })
  await fermaLaScena()   // un gesto a scena occupata non conta: quanto dura lo decide la macchina
}
uguale('il calderone si è riempito', await page.evaluate(() => window.__poz.bottega.value.dentro.length), CAMPAGNA[0].ingredienti)
await scatto(page, 'pozioni-sale-e-pepe')
{
  /* già la prima tappa ha il fuoco, la bacchetta, un pizzico e la fiala */
  const viste = new Set()
  await giocaRicetta(viste)
  for (const a of ['scalda', 'agita', 'imbottiglia']) controlla(`alla prima tappa col dito si fa «${a}»`, viste.has(a), [...viste].join())
  controlla('e un pizzico', viste.has('sale') || viste.has('pepe'), [...viste].join())
}
await page.waitForSelector('[data-fine="tappa"]', { timeout: 30000 })
uguale('la tappa finisce', await page.locator('[data-fine="tappa"]').count(), 1)
controlla('il cartello di fine dice quanto si è speso', /Hai speso \d+ gettoni: il minimo era \d+/.test(await page.locator('[data-righe]').innerText()))
controlla('le monete: tre a ingrediente, e il passo del pasticcio non paga', (await page.locator('[data-monete]').innerText()).trim() === `+${CAMPAGNA[0].ingredienti * MONETE_A_DOSE + await page.evaluate(() => window.__poz.bottega.value.passi.length) - 1} 🪙`, await page.locator('[data-monete]').innerText())
await scatto(page, 'pozioni-fine')
await page.locator('[data-fine] [data-azione="mappa"]').click()
await page.waitForSelector('.pz-mappa')
await attendi(page, 500)
const p1 = await leggiProfilo(page)
uguale('la tappa è segnata', p1.campagne.pozioni.stelle[0] > 0, true)
uguale('la pozione è contata', p1.totals.pozioni, 1)
uguale('con un pasticcio non è perfetta', p1.totals.pozioniPerfette || 0, 0)
controlla('le dosi sono contate', p1.totals.misure >= CAMPAGNA[0].ingredienti, `${p1.totals.misure}`)

/* ---------- 3. un trabocco, la barra di lettura e la spugna ---------- */
await page.locator('.pz-tappa[data-tappa="1"]').click()
await page.waitForSelector('.pz-mercante')
await attendi(page, 500)
{
  /* la più grande del listino finché non ci sta più, poi una di troppo */
  const troppo = () => page.evaluate(() => {
    const b = window.__poz.bottega.value, g = b.ingredienti[0]
    const k = g.offerte.reduce((m, o, n) => (o.base > g.offerte[m].base ? n : m), 0)
    return { t: `0:${k}`, ci: g.messo + g.offerte[k].base <= g.dose, fatto: g.messo === g.dose }
  })
  for (let g = 0; g < 10; g++) {
    const d = await troppo()
    if (!d.ci) break
    await ordinaUna(d.t); await fermo()
  }
  const d = await troppo()
  if (d.fatto) nota('la più grande ha riempito giusto: niente trabocco con questo caso')
  else {
    const prima = await stato()
    await ordinaUna(d.t)
    await page.waitForSelector('[data-azione="pulisci"]', { timeout: 15000 })
    await page.waitForSelector('[data-esito][data-codice="trabocca"]', { timeout: 15000 })
    uguale('il misurino resta com\'era', (await stato()).messi.join(), prima.messi.join())
    controlla('il cartello dice perché', /oltre la tacca/.test(await page.locator('[data-esito]').innerText()))
    controlla('e si legge, prima di pulire', await page.locator('[data-azione="pulisci"]').isDisabled())
    await scatto(page, 'pozioni-trabocco')
    uguale('la scena è in macchia', await page.locator('.pz-mercante').getAttribute('data-fase'), 'macchia')
    await page.waitForFunction(() => !document.querySelector('[data-azione="pulisci"]').disabled, null, { timeout: 15000 })
    const spesoPrima = (await stato()).speso
    await page.locator('[data-azione="pulisci"]').click()
    await fermo()
    uguale('la spugna costa un gettone', (await stato()).speso, spesoPrima + 1)
    uguale('e la macchia non c\'è più', (await stato()).macchie, 0)
  }
}

/* ---------- 4. il mortaio: la roba, il pestello, poi il mortaio nel calderone, tutto col dito ---------- */
await page.evaluate(() => { const Z = window.__poz; Z.allaMappa(); Z.avviaTappa(4) })
await page.waitForSelector('.pz-mercante')
await attendi(page, 900)
for (let i = 0; i < 3; i++) { await page.evaluate(() => window.__poz.salta()); await attendi(page, 500) }
await page.waitForSelector('[data-fase="procedimento"]', { timeout: 25000 })
await attendi(page, 1200)
{
  const passo = () => page.evaluate(() => window.__poz.bottega.value.passo)
  /* quello che dà fastidio si sposta, e resta lì */
  const prima = await dove('fiala')
  await trascina(prima, { x: prima.x + 45, y: prima.y + 30 })
  await attendi(page, 900)
  const dopo = await dove('fiala')
  controlla('lasciato sul tavolo resta dove lo si è messo', Math.hypot(dopo.x - prima.x, dopo.y - prima.y) > 30, JSON.stringify([prima, dopo]))
  /* quello che sta appeso torna al suo gancio */
  const appeso = await dove('mestolo')
  await trascina(appeso, { x: appeso.x - 20, y: appeso.y + 90 })
  await attendi(page, 900)
  const tornato = await dove('mestolo')
  controlla('il mestolo torna al gancio', Math.hypot(tornato.x - appeso.x, tornato.y - appeso.y) < 3, JSON.stringify([appeso, tornato]))
  uguale('e spostare non è un pasticcio', await page.evaluate(() => window.__poz.bottega.value.pasticci), 0)
  const sulMortaio = await page.evaluate(() => [...window.__poz.bottega.value.passi[0].cosa])
  uguale('la ricetta comincia dal mortaio', await page.evaluate(() => window.__poz.bottega.value.passi[0].azione), 'pesta')
  for (const i of sulMortaio) {
    if (await nelRecipiente(`roba:${i}`)) await conGesto(`roba:${i}`, 'mortaio')
    else await trascina(await dove(`roba:${i}`), await dove('mortaio'))
    await fermaLaScena()
  }
  uguale('la roba portata sul mortaio ci entra', await page.evaluate(() => window.__poz.bottega.value.mortaio.length), 2)
  /* il pestello fermo sul mortaio non pesta: passato un attimo, la freccia */
  {
    const a = await dove('mortaio')
    await porta(await dove('pestello'), a)
    await page.waitForSelector('[data-suggerimento="su-giu"]', { timeout: 5000 })
    await scatto(page, 'pozioni-fermo-sul-mortaio')
    uguale('fermo non è successo niente', await passo(), 0)
    await avanti('y', 6)(a)
    await attendi(page, 150)
    await page.mouse.up()
  }
  await page.waitForFunction(() => window.__poz.bottega.value.passo === 1, null, { timeout: 25000 })
  uguale('e facendolo la freccia se ne va', await page.locator('[data-suggerimento]').count(), 0)
  await fermaLaScena()
  await conGesto('mortaio', 'calderone')
  await page.waitForFunction(() => window.__poz.bottega.value.passo === 2, null, { timeout: 25000 })
  uguale('il pestato è nel calderone', await page.evaluate(() => window.__poz.bottega.value.dentro.length), 2)
  nota(`passo ${await passo()}`)
}

/* ---------- 5. tutte le mosse col dito: si gioca la ricetta intera ---------- */
const apri = async (chiave, servono) => {
  for (let g = 0; g < 200; g++) {
    await page.evaluate(chiave => { const Z = window.__poz; Z.allaMappa(); Z.avviaTappa(Z.CAMPAGNA.findIndex(t => t.chiave === chiave), true) }, chiave)
    await page.waitForSelector('.pz-mercante')
    if (await page.evaluate(servono => servono.every(a => window.__poz.bottega.value.passi.some(p => p.azione === a)), servono)) break
  }
  await attendi(page, 500)
  await page.evaluate(async () => { const Z = window.__poz; while (!Z.bottega.value.pronta) Z.bottega.value.salta() })
  await page.waitForSelector('[data-fase="procedimento"]', { timeout: 25000 })
  await attendi(page, 900)
}
{
  const viste = new Set()
  await apri('lunghezza-virgole', ['sminuzza'])
  /* il fiammifero sul calderone non fa niente: il fuoco si accende sulla legna */
  await trascina(await dove('fiammifero'), await dove('calderone'))
  await page.waitForSelector('[data-suggerimento="strada"]', { timeout: 5000 })
  await attendi(page, 500)
  const q = await page.evaluate(() => { const b = window.__poz.bottega.value; return { fuoco: b.scaldato, pasticci: b.pasticci } })
  uguale('il fiammifero sul calderone non accende', q.fuoco, false)
  uguale('e non è un pasticcio', q.pasticci, 0)
  await scatto(page, 'pozioni-fiammifero-sbagliato')
  /* col tocco vero (docs/core/il-dito.md): si prende, si gira un po' e si lascia */
  {
    const cdp = await page.context().newCDPSession(page)
    const tocco = (type, p) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: p ? [p] : [] })
    const da = await dove('mestolo'), a = await dove('calderone')
    await scenaFerma()
    await tocco('touchStart', da)
    for (let n = 1; n <= 8; n++) await tocco('touchMove', { x: da.x + (a.x - da.x) * n / 8, y: da.y + (a.y - da.y) * n / 8 })
    for (let n = 0; n <= 16; n++) await tocco('touchMove', { x: a.x + Math.cos(n / 24 * Math.PI * 2) * 36, y: a.y + Math.sin(n / 24 * Math.PI * 2) * 30 })
    await attendi(page, 200)
    await tocco('touchEnd')
    await page.waitForSelector('[data-suggerimento="giro"]', { timeout: 5000 })
    uguale('a metà giro non è una mossa', await page.evaluate(() => window.__poz.bottega.value.pasticci), 0)
  }
  await giocaRicetta(viste)
  await page.waitForSelector('[data-fine="tappa"]', { timeout: 30000 })
  await apri('massa-virgole', ['gratta', 'agita'])
  await giocaRicetta(viste)
  for (const a of ['pesta', 'sminuzza', 'gratta', 'versa', 'mescola', 'scalda', 'agita'])
    controlla(`col dito si fa anche «${a}»`, viste.has(a), [...viste].join())
  uguale('e senza un pasticcio', await page.evaluate(() => window.__poz.bottega.value.pasticci), 0)
  await page.waitForSelector('[data-fine="tappa"]', { timeout: 30000 })
  await page.locator('[data-fine] [data-azione="mappa"]').click()
  await attendi(page, 300)
}

/* ---------- 6. il calderone senza fondo: va avanti finché non si è in rosso ---------- */
await page.evaluate(() => { const Z = window.__poz; Z.allaMappa(); Z.avviaInfinita() })
await page.waitForSelector('.pz-mercante')
await attendi(page, 900)
const finisciPozione = async () => {
  const prima = await page.evaluate(() => window.__poz.serie.value)
  for (let g = 0; g < 16 && prima === await page.evaluate(() => window.__poz.serie.value); g++) { await page.evaluate(() => window.__poz.salta()); await attendi(page, 500) }
}
await finisciPozione()
await page.waitForFunction(() => !window.__poz.bottega.value.finita, null, { timeout: 25000 })
uguale('dopo la festa c\'è già la pozione dopo', await page.locator('[data-fine]').count(), 0)
uguale('e la serie conta', await page.evaluate(() => window.__poz.serie.value), 1)
await attendi(page, 900)
await page.evaluate(() => { window.__poz.bottega.value.speso = window.__poz.bottega.value.gettoni + 1 })
await finisciPozione()
await page.waitForSelector('[data-fine="tappa"]', { timeout: 25000 })
controlla('in rosso è finita, e dice quante', /2 pozioni di fila/.test(await page.locator('[data-righe]').innerText()), await page.locator('[data-righe]').innerText())
uguale('il record sta nella campagna', (await page.evaluate(async () => { await new Promise(r => setTimeout(r, 300)); return window.__poz.serie.value })), 2)

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('il laboratorio delle pozioni, nel browser')
