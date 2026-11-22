/* perché: il tocco vero sulla stanza della cucina: il cuoco cammina al posto giusto e fa la mossa, le ordinazioni scadono, il foglio del resto non si prende il click e i livelli si aprono vincendo; in due il pulsantino, la consegna e i conti che non fermano l'orologio, e due pagine vere se il servizio risponde
   a parte perché: è il solo file nel browser della cucina (la cucina in due ci sta dentro, dal 22/11): `soldi` guarda la carta dei soldi, non la stanza
   LA CUCINA
     node test/integrazione/bancarella-cucina.test.mjs   (dopo `npm run build`)

   Quello che `unita/bancarella-cucina` non vede: un tocco vero sulla stanza trova
   il posto giusto, il cuoco ci cammina e fa la mossa; le ordinazioni si fanno in
   qualsiasi ordine, scadono, e quella finita apre il foglio del resto, che sta
   sotto il dito e non deve prendersi il suo click. La ricetta ferma il tempo,
   i livelli si aprono vincendo. In fondo la cucina in due: da soli nella
   partita di prova, e due pagine vere se il servizio risponde (`SERVIZIO=`
   come in verifiche/arena-sfida, senza salta). Vedi docs/bancarella/cucina.md e
   in-due.md. */
import { apriBrowser, apriGioco, azzera, semina, leggiProfilo, attendi, scatto, TELEFONO } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { TAGLI } from '../../src/motore/bancarella/cucina.js'
import { CUCINE } from '../../src/data/bancarella-cucine.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { viewport: TELEFONO })
await azzera(page)
await semina(page, { settings: { eta: 6 } })   // più grandi, le prime sono già passate
await page.evaluate(() => { location.hash = 'bancarella=cucina&dpr=1' })
await page.waitForSelector('[data-cucine]', { timeout: 8000 })
uguale('si vedono tutti i livelli', await page.locator('[data-cucina-n]').count(), CUCINE.length)
controlla('la prima è aperta', await page.locator('[data-cucina-n="1"]').isEnabled())
controlla('la seconda no', await page.locator('[data-cucina-n="2"]').isDisabled())
await scatto(page, 'cucina-scelta')

const cdp = await page.context().newCDPSession(page)
await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 })
const stato = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__shop.cucina.value)))
const apri = async n => {
  await page.click(`[data-cucina-n="${n}"]`)
  await page.waitForFunction(() => window.__cucina3d?.grafica()?.fotogrammi > 3 && !window.__shop.cambio.value && window.__shop.cliente.value, undefined, { timeout: 20000 })
}
const dove = id => page.evaluate(id => window.__cucina3d.dove(id), id)
async function tocco(p) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [p] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
const fermo = () => page.waitForFunction(() => {
  const c = window.__shop.cucina.value
  return !c.fila.length && !c.strada.length && !c.arrivato
}, undefined, { timeout: 30000 })

// il tocco è vero; la camminata no, se non si prova quella: senza scheda grafica i fotogrammi sono pochi
const PANE = 'pane', SUGO = 'sugo', FORMAGGIO = 'formaggio', INSALATA = 'insalata', PIATTI = 'piatti', TAGLIERE = 'tagliere', CONSEGNA = 'consegna', LAVELLO = 'lavello'
const cella = nome => page.evaluate(n => { const k = window.__shop.cucina.value.celle.find(q => q.cosa === n || q.nome === n || q.tipo === n); return { ...k } }, nome)
async function premi(nome) {
  const k = await cella(nome)
  await page.evaluate(([x, z]) => {
    const c = window.__shop.cucina.value
    Object.assign(c.cuoco, { x: Math.max(1, Math.min(c.largo - 2, x)) + 0.5, z: Math.max(1, Math.min(c.fondo - 2, z)) + 0.5 })
  }, [k.x, k.z])
  await tocco(await dove(k.id))
  await fermo()
  await attendi(page, 40)
}
const tagliato = () => page.waitForFunction(() => !window.__shop.cucina.value.tagliando, undefined, { timeout: 30000 })
async function fai(piatto) {
  await premi(FORMAGGIO); await premi(TAGLIERE); await tagliato()
  await premi(PANE); await premi(TAGLIERE); await premi(PIATTI)
}
const ordini = () => page.evaluate(() => window.__shop.coda.value.map(c => c.articoli[0].emoji))
async function daiResto() {
  await page.waitForSelector('.cassa', { timeout: 2000 })
  await page.evaluate(() => {
    const S = window.__shop
    for (const v of S.scomponi(S.cliente.value.resto, S.cliente.value.monete)) S.metti(v)
    S.proponi()
  })
}

/* ---------- 1. si tocca dove si vuole andare ---------- */
await apri(1)
nota(`la scena: ${JSON.stringify(await page.evaluate(() => window.__cucina3d.grafica()))}`)
uguale('niente persone', await page.locator('[data-cliente]').count(), 0)
uguale('e niente ceste del mercato', await page.locator('.ceste').count(), 0)
uguale('tre ordinazioni in lista', await page.locator('[data-ordine]').count(), 3)
controlla('e sono foto, non icone', (await page.locator('[data-ordinato] img').first().getAttribute('src')).startsWith('data:image/webp'))
await tocco(await dove('1,3'))
await fermo()
const k = (await stato()).cuoco
uguale('toccando il pavimento il cuoco va lì', `${k.x},${k.z}`, '1.5,3.5')
await page.evaluate(() => Object.assign(window.__shop.cucina.value.cuoco, { x: 2.5, z: 3.5 }))
await tocco(await dove((await cella(PANE)).id))
await tocco(await dove((await cella(TAGLIERE)).id))
uguale('l\'ultimo tocco comanda', (await stato()).fila.join(' '), (await cella(TAGLIERE)).id)
await fermo()
await page.evaluate(() => { window.__shop.cucina.value.cuoco.mano = null })
await premi(PANE)
await premi(FORMAGGIO)
await page.waitForSelector('[data-detto]', { timeout: 1500 })
uguale('quello che non si unisce lo dice', await page.locator('[data-detto]').innerText(), 'Prima si taglia')
await page.evaluate(() => { window.__shop.cucina.value.cuoco.mano = null })

/* ---------- 2. toccando un piatto ordinato si legge la ricetta, e il tempo sta fermo ---------- */
{
  await page.locator('[data-ordinato]').first().click()
  await page.waitForSelector('[data-ricetta]', { timeout: 2000 })
  await scatto(page, 'cucina-ricetta')
  const prima = await page.evaluate(() => window.__shop.cliente.value.restaPazienza)
  await attendi(page, 400)   // che non si muova si vede solo lasciando passare il tempo
  uguale('l\'ordinazione aspetta', await page.evaluate(() => window.__shop.cliente.value.restaPazienza), prima)
  await page.click('[data-chiudi-ricetta]')
  controlla('chiusa, il tempo riparte', await page.waitForFunction(p => window.__shop.cliente.value.restaPazienza < p, prima, { timeout: 3000 }).then(() => true, () => false))
}

/* ---------- 3. si servono in qualsiasi ordine ---------- */
await page.evaluate(() => {
  const o = window.__shop.coda.value
  o[0].articoli[0] = { ...o[0].articoli[0], emoji: '🥖' }; o[1].articoli[0] = { ...o[1].articoli[0], emoji: '🥪' }; o[2].articoli[0] = { ...o[2].articoli[0], emoji: '🥖' }
})
await fai('🥪')
uguale('il piatto è pronto', (await stato()).cuoco.mano?.pronto, '🥪')
await premi(CONSEGNA)
await page.waitForSelector('.cassa', { timeout: 2000 })
uguale('la seconda ordinazione è servita per prima', (await ordini())[0], '🥪')
await attendi(page, 500)
uguale('e il dito che si alza non preme una moneta', await page.evaluate(() => window.__shop.dato.value), 0)
controlla('il foglio mostra i soldi che danno', await page.locator('[data-porge]').count() > 0)
await scatto(page, 'cucina-il-resto')

/* ---------- 4. alla cassa è tutto fermo, e si esce solo dando il resto ---------- */
{
  const prima = await page.evaluate(() => window.__shop.coda.value[1].restaPazienza)
  await attendi(page, 400)
  uguale('col foglio aperto le ordinazioni aspettano', await page.evaluate(() => window.__shop.coda.value[1].restaPazienza), prima)
  uguale('il foglio non si mette da parte', await page.locator('[data-chiudi], [data-azione="al-resto"]').count(), 0)
}
await daiResto()
await page.waitForFunction(() => window.__shop.hud.serviti === 1, undefined, { timeout: 4000 })
const p = await leggiProfilo(page)
controlla('l\'incasso finisce nei conti', p.totals.incasso > 0)

/* ---------- 5. un'ordinazione che scade costa un cuore e sparisce ---------- */
{
  const cuori = await page.evaluate(() => window.__shop.hud.cuori)
  await page.evaluate(() => { window.__shop.coda.value.at(-1).restaPazienza = 0.05 })
  await page.waitForFunction(c => window.__shop.hud.cuori === c - 1, cuori, { timeout: 8000 })
  uguale('resta quella che non è scaduta', await page.locator('[data-ordine]').count(), 1)
}

/* ---------- 6. vincere apre il livello dopo, e nella scelta non si compra niente ---------- */
await page.evaluate(() => { const S = window.__shop; S.hud.serviti = 8; S.tappa.value = 2; S.coda.value = S.coda.value.slice(0, 1); S.chiudi('vinta') })
await page.waitForFunction(() => window.__shop.fase.value === 'fine', undefined, { timeout: 4000 })
/* il primo livello vinto è un traguardo, e il suo cartello copre la fine per 3,2 s: si chiude toccandolo, come fa il bambino */
await page.waitForSelector('.velo', { timeout: 1500 }).then(() => page.click('.velo'), () => {})
await page.click('[data-azione="le-cucine"]')
await page.waitForSelector('[data-cucine]', { timeout: 3000 })
controlla('il secondo livello si è aperto', await page.locator('[data-cucina-n="2"]').isEnabled())
uguale('non c\'è niente da comprare', await page.locator('.cucine button:not(.livello):not(.in-due):not([data-il-cuoco])').count(), 0)

/* ---------- 6b. il cuoco si sceglie, e resta (docs/bancarella/cuoco.md) ---------- */
await page.click('[data-il-cuoco]')
await page.waitForSelector('[data-personalizza] [data-prs-voce="gatto"]', { timeout: 4000 })
await page.click('[data-prs-voce="gatto"]')
await page.click('[data-personalizza] [data-chiudi]')
uguale('il cuoco scelto è il gatto', await page.evaluate(() => window.__shop.mioBanco.value.cuoco.split('.')[0]), 'gatto')
uguale('e niente cassa', await page.locator('.cucine .cassa').count(), 0)
await apri(2)

/* ---------- 7. l'insalata: un tocco la posa e il cuoco taglia da sé, poi si prende ---------- */
await premi(INSALATA); await premi(TAGLIERE)
controlla('l\'insalata va sul tagliere e il cuoco taglia', (await stato()).tagliando)
await tagliato()
uguale('senza altri tocchi', (await stato()).stazioni.tagliere.colpi, TAGLI)
await premi(PIATTI)
await premi(TAGLIERE)
uguale('col piatto si prende', (await stato()).cuoco.mano?.cose?.join(), 'insalata')

/* ---------- 8. il lavello ---------- */
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('[data-cucine]', { timeout: 3000 })
/* il sesto livello, aperto come se gli altri fossero vinti: senza ricaricare la pagina */
await page.evaluate(() => { const S = window.__shop; S.mioBanco.value = { ...S.mioBanco.value, cucina: { fatte: 5 } }; S.inizia(5) })
await page.waitForFunction(() => window.__cucina3d?.grafica()?.fotogrammi > 3 && window.__shop?.cliente.value && !window.__shop.cambio.value, undefined, { timeout: 30000 })
await page.evaluate(() => { const c = window.__shop.cucina.value; c.puliti = 0; c.sporchi = 1 })
await premi(PIATTI)
await page.waitForSelector('[data-detto]', { timeout: 1500 })
uguale('senza piatti puliti lo dice', await page.locator('[data-detto]').innerText(), 'Non ci sono piatti puliti: lavali')
await premi(LAVELLO)
await page.waitForFunction(() => window.__shop.cucina.value.puliti === 1, undefined, { timeout: 30000 })
await scatto(page, 'cucina-lavello')

/* ---------- 9. uscire non butta il livello ---------- */
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('[data-ripresa]', { timeout: 3000 })
await page.click('[data-azione="riprendi"]')
await page.waitForFunction(() => window.__shop.fase.value === 'gioco', undefined, { timeout: 3000 })
uguale('riprendendo la stanza è com\'era', (await stato()).puliti, 1)

/* ---------- 10. l'ultimo livello: cinque minuti, niente cuori, e alla cassa l'orologio è fermo ---------- */
await page.evaluate(n => { const S = window.__shop; S.mioBanco.value = { ...S.mioBanco.value, cucina: { fatte: n } }; S.inizia(n) }, CUCINE.length - 1)
await page.waitForFunction(() => !window.__shop.cambio.value && window.__shop.cliente.value, undefined, { timeout: 5000 })
await page.waitForSelector('[data-resta]', { timeout: 3000 })
{
  const resta = () => page.evaluate(() => window.__shop.hud.resta)
  const prima = await resta()
  controlla('l\'orologio parte da cinque minuti', prima > 290 && prima <= 300)
  controlla('e scende', await page.waitForFunction(p => window.__shop.hud.resta < p, prima, { timeout: 3000 }).then(() => true, () => false))
  await page.evaluate(() => { window.__shop.coda.value[0].restaPazienza = 0.05 })
  await page.waitForFunction(() => window.__shop.coda.value.length === 2, undefined, { timeout: 3000 })
  uguale('un\'ordinazione scaduta non costa cuori', await page.evaluate(() => window.__shop.hud.cuori), 3)
  await page.evaluate(() => { window.__shop.momento.value = 'cassa' })
  const ferma = await resta()
  await attendi(page, 400)   // che sia fermo si vede solo lasciando passare il tempo
  uguale('alla cassa l\'orologio è fermo', await resta(), ferma)
  await scatto(page, 'cucina-cinque-minuti')
  await page.evaluate(() => { const S = window.__shop; S.momento.value = 'cucina'; S.hud.serviti = 7; S.hud.resta = 0.2 })
  await page.waitForFunction(() => window.__shop.fase.value === 'fine', undefined, { timeout: 3000 })
  await page.waitForSelector('[data-primato]', { timeout: 2000 })
  uguale('a zero finisce col record', await page.evaluate(() => window.__shop.esito.value), 'tempo')
}

/* ---------- 11. i lucchetti sono quelli di tutti: «tutte le tappe aperte» e l'età ---------- */
/* da capo, archivio compreso: i livelli vinti sopra aprirebbero da sé, e il gioco ancora aperto riscriverebbe il suo
   profilo sopra quello seminato al `pagehide` della ricarica */
async function daCapo(settings) {
  await azzera(page)
  await semina(page, { settings })
}
for (const [settings, n, che] of [[{ eta: 10 }, 5, 'a dieci anni le prime sono già passate'], [{ eta: 8, tuttoAperto: true }, CUCINE.length, 'col flag acceso anche l\'ultima è aperta']]) {
  await daCapo(settings)
  await page.evaluate(() => { location.hash = 'bancarella=cucina&dpr=1' })
  await page.waitForSelector('[data-cucine]', { timeout: 8000 })
  controlla(che, await page.locator(`[data-cucina-n="${n}"]`).isEnabled())
}

/* ---------- 12. la cucina in due, da soli nella partita di prova (docs/bancarella/in-due.md) ---------- */
/* il profilo è quello di otto anni qui sopra; la prova dei grandi si legge all'apertura del gioco, quindi si ricarica */
const S = fa => `(() => { const S = window.__shop.due.value.m.S; ${fa} })()`
const pronta = p => p.waitForFunction(() => window.__cucina3d?.grafica()?.fotogrammi > 3, undefined, { timeout: 20000 })
// il piatto della prima ordinazione in mano a `ruolo`, e il tocco vero sulla consegna
async function aConsegnare(p, ruolo) {
  await p.evaluate(S(`S.cuochi['${ruolo}'].cuoco.mano = { piatto: true, cose: [], pronto: S.ordini[0].piatto, daInfornare: false, forno: '' }`))
}
async function toccaConsegna(p) {
  const id = await p.evaluate(S(`return S.cucina.celle.find(k => k.tipo === 'consegna').id`))
  const d = await p.evaluate(i => window.__cucina3d.dove(i), id)
  await p.mouse.click(d.x, d.y)
}
// il resto coi soldi del cassetto: a questa età la cassa lo dice
async function daiIlResto(p) {
  const pezzi = await p.evaluate(() => { const S = window.__shop; return S.scomponi(S.cliente.value.resto, S.cliente.value.monete) })
  for (const v of pezzi) await p.click(`[data-v="${v}"]`)
}
await page.evaluate(() => { location.hash = 'bancarella=due&menu=pochi&minuti=5' })
await page.reload()
await page.waitForSelector('[data-resta]', { timeout: 8000 })
await pronta(page)
uguale('in due: quattro ordinazioni, ognuna col pulsantino', await page.locator('[data-prenota]').count(), 4)
uguale('in due: niente pausa', await page.locator('button[aria-label="pausa"]').count(), 0)
await page.locator('[data-prenota]').first().click()
await page.waitForSelector('[data-ordine][data-di="mia"]', { timeout: 2000 })
await page.locator('[data-prenota]').first().click()
await page.waitForFunction(() => !document.querySelector('[data-ordine][data-di="mia"]'), undefined, { timeout: 2000 })

await aConsegnare(page, 'host')
await toccaConsegna(page)
await page.waitForSelector('[data-ordine][data-di="mia"]', { timeout: 2000 })
await page.waitForSelector('[data-porge]', { timeout: 8000 })
await scatto(page, 'cucina-in-due-conto')
{
  const prima = await page.evaluate(S('return S.resta'))
  controlla('mentre conti l\'orologio corre', await page.waitForFunction(`${S('return S.resta')} < ${prima}`, undefined, { timeout: 3000 }).then(() => true, () => false))
}
await daiIlResto(page)
await page.waitForFunction(() => window.__shop.hud.serviti === 1, undefined, { timeout: 5000 })
// il foglio se ne va un attimo dopo il cliente servito: si aspetta lui, non si guarda nello stesso istante
controlla('il foglio si chiude', !!await page.waitForSelector('[data-porge]', { state: 'detached', timeout: 3000 }).then(() => true, () => false))
controlla('e il cuoco torna libero', !!await page.waitForFunction(S('return S.cuochi.host.calcola === 0'), undefined, { timeout: 3000 }).then(() => true, () => false))
await page.evaluate(S('S.resta = 0.3'))
await page.waitForSelector('[data-fine-in-due]', { timeout: 4000 })
controlla('a fine partita dice quante insieme', /Insieme: 1/.test(await page.locator('[data-fine-in-due]').innerText()))

uguale('nessun errore in console', errori.length, 0)
if (errori.length) errori.forEach(e => nota(e))

/* ---------- 13. in due, con due pagine vere: solo se il servizio risponde (`SERVIZIO=` come in verifiche/arena-sfida) ---------- */
const SERVIZIO = (process.env.SERVIZIO || 'http://localhost:8787').replace(/\/$/, '')
if (await fetch(`${SERVIZIO}/`).then(r => r.status < 500, () => false)) {
  const A = await apriGioco(browser, { viewport: TELEFONO }), B = await apriGioco(browser, { viewport: TELEFONO })
  const a = A.page, b = B.page
  for (const p of [a, b]) {
    await azzera(p)
    await semina(p, { settings: { eta: 8 } })
    await p.evaluate(s => { globalThis.__SERVIZIO_SFIDE__ = s; location.hash = 'bancarella=cucina&dpr=1' }, SERVIZIO)
    await p.waitForSelector('[data-cucine]', { timeout: 8000 })
    await p.click('[data-cucina-in-due]')
  }
  await a.click('[data-sfida-crea]')
  await a.click('[data-minuti-in-due="10"]')
  await a.click('[data-menu-in-due="tante"]')
  await a.click('[data-sfida-vai]')
  await a.waitForSelector('[data-codice]', { timeout: 20000 })
  const codice = (await a.locator('[data-codice]').innerText()).trim()
  await b.click('[data-sfida-entra]')
  await b.locator('[data-sfida-codice-input]').fill(codice)
  await b.click('[data-sfida-vai]')
  for (const p of [a, b]) { await p.waitForSelector('[data-resta]', { timeout: 20000 }); await pronta(p) }
  controlla('dieci minuti su tutti e due', (await b.evaluate(S('return S.resta'))) > 590)
  uguale('la stessa lista', await b.evaluate(S('return S.ordini.map(o => o.piatto).join()')), await a.evaluate(S('return S.ordini.map(o => o.piatto).join()')))

  await a.locator('[data-prenota]').nth(1).click()
  await b.waitForSelector('[data-ordine][data-di="sua"]', { timeout: 5000 })
  controlla('sull\'altro telefono la scheda è dell\'altro', await b.locator('[data-ordine][data-di="sua"] [data-prenota]').isDisabled())
  await a.locator('[data-prenota]').nth(1).click()
  await b.waitForFunction(() => !document.querySelector('[data-ordine][data-di="sua"]'), undefined, { timeout: 5000 })

  await aConsegnare(a, 'host'); await aConsegnare(b, 'host')
  await toccaConsegna(a)
  await a.waitForSelector('[data-porge]', { timeout: 10000 })
  await b.waitForFunction(() => window.__shop.due.value.m.S.cuochi.host.calcola > 0, undefined, { timeout: 5000 })
  uguale('i conti stanno solo sul telefono di chi consegna', await b.locator('[data-porge]').count(), 0)
  await scatto(b, 'cucina-in-due-calcola')
  await daiIlResto(a)
  for (const p of [a, b]) await p.waitForFunction(() => window.__shop.due.value.m.S.serviti.host === 1, undefined, { timeout: 8000 })
  uguale('e l\'altro cuoco è libero', await b.evaluate(S('return S.cuochi.host.calcola')), 0)
  for (const [n, x] of [['chi crea', A], ['chi entra', B]]) uguale(`${n}: nessun errore in console`, x.errori.length, 0)
} else nota(`⚠️  salto le due pagine in due: il servizio non risponde su ${SERVIZIO}`)

await browser.close()
riassunto('La cucina della bancarella')
