/* ═══════════════════════════════════════════════════════════════════
   GLI AMICI — DUE TELEFONI, IL SERVIZIO E UN INVITO A CASTLE BATTLE

   Due pagine (due telefoni, due bambini) col gioco aperto dal file. Di base gli amici sono spenti: i grandi li accendono dalle
   impostazioni, uno crea un codice, l'altro lo scrive, e da lì i due si vedono online col nome. Uno invita l'altro a una
   battaglia, all'altro compare il cartello, tocca «Gioca» e la battaglia parte su tutte e due. Poi, senza servizio raggiungibile,
   la home resta com'è: la lista in grigio, nessun cartello, nessun errore.
   Docs: docs/core/amici.md. **Serve il servizio nuovo**: in locale `cd servizio/inoltro && npx wrangler dev`, poi
   `SERVIZIO=http://localhost:8787 node test/esegui.mjs integrazione/amici --niente-build`; senza `SERVIZIO` si prova quello
   pubblicato (dopo il deploy). Se il servizio non risponde, il test lo dice e salta.
   tempo: 60
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, semina, attendi, scegli } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const SERVIZIO = (process.env.SERVIZIO || 'https://sfida.educagioco.workers.dev').replace(/\/$/, '')
const vivo = await fetch(`${SERVIZIO}/amici/codice`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
  .then(r => r.status === 400, () => false)
if (!vivo) { console.log(`⚠️  salto: il servizio degli amici non risponde su ${SERVIZIO} (lo prova \`SERVIZIO=http://localhost:8787\` con wrangler dev)`); process.exit(0) }

const browser = await apriBrowser()
// gli errori di rete (un WebSocket che non si apre) Chrome li scrive in console: non sono errori del gioco
const veri = errori => errori.filter(e => !/WebSocket connection|Failed to load resource|net::ERR|ERR_/.test(e))

async function telefono(id, servizio = SERVIZIO) {
  const T = await apriGioco(browser, { giocatori: [id] })
  await semina(T.page, { settings: { eta: 8, sperimentali: true } }, id)
  await T.page.evaluate(s => { globalThis.__SERVIZIO_SFIDE__ = s }, servizio)
  return T
}
const digita = async (p, pin) => { for (const c of pin) await p.click(`.tasto >> text="${c}"`) }
async function daiGrandi(p) {
  await p.click('[data-azione="grandi"]')
  await p.waitForSelector('.tastierino', { timeout: 5000 })
  await digita(p, '0000')
  await p.waitForSelector('.carte', { timeout: 8000 })
  await p.click('[data-scheda="bambini"]')
  await p.waitForSelector('.carta[data-flag="amici"]', { timeout: 5000 })
}
const inHome = async p => { await p.click('button[aria-label="indietro"]'); await p.waitForSelector('.carte', { timeout: 5000 }) }

/* ── un profilo che c'era già non ha mai risposto: spento, e i grandi lo scoprono dalla posta ── */
{
  const V = await apriGioco(browser, { giocatori: ['vecchio'], amiciDecisi: false })
  await V.page.waitForSelector('[data-nastro="posta"]', { timeout: 8000 })
  controlla('un profilo che c\'era già: in home il nastro per i grandi, senza dire cosa', await V.page.locator('[data-nastro="posta"]').isVisible())
  controlla('e gli amici sono spenti', await V.page.locator('[data-azione="amici"]').count() === 0)
  await V.page.click('[data-azione="grandi"]'); await V.page.waitForSelector('.tastierino', { timeout: 5000 })
  await digita(V.page, '0000'); await V.page.waitForSelector('[data-posta]', { timeout: 8000 })
  controlla('nella posta dei grandi l\'avviso parla di amici, spento', /amici/i.test(await V.page.locator('[data-posta]').innerText()))
  await V.page.close()
}

const A = await telefono('leonardo'), B = await telefono('melody')
const a = A.page, b = B.page

/* ── di base spento ── */
controlla('di base gli amici sono spenti: in home non c\'è la riga', await a.locator('[data-azione="amici"]').count() === 0)

/* ── i grandi li accendono e abbinano ── */
await daiGrandi(a)
controlla('nelle impostazioni la carta dice che è spento', /Attiva/.test(await a.locator('[data-azione="amici-attiva"]').innerText()))
await a.click('[data-azione="amici-attiva"]')
await a.waitForSelector('[data-azione="amici-invita"]', { timeout: 5000 })
await a.click('[data-azione="amici-invita"]')
await a.waitForSelector('[data-amici-codice]', { timeout: 15000 })
const codice = (await a.locator('[data-amici-codice] .grande').innerText()).trim()
controlla('compare un codice di cinque lettere', /^[A-Z]{5}$/.test(codice), codice)

await daiGrandi(b)
await b.click('[data-azione="amici-attiva"]')
await b.waitForSelector('[data-amici-codice-input]', { timeout: 5000 })
controlla('con il codice a metà non si può riscattare', await b.locator('[data-azione="amici-riscatta"]').isDisabled())
await b.fill('[data-amici-codice-input]', codice.toLowerCase())
await b.click('[data-azione="amici-riscatta"]')
await b.waitForSelector('[data-amici-messaggio]', { timeout: 15000 })
controlla('riscattato: l\'amico è in elenco', await b.locator('[data-amici-elenco] li').count() === 1)
await b.fill('[data-amici-codice-input]', codice)
await b.click('[data-azione="amici-riscatta"]')
await b.waitForSelector('[data-amici-messaggio]', { timeout: 15000 })
controlla('lo stesso codice non vale due volte', /non c'è|scaduto/.test(await b.locator('[data-amici-messaggio]').innerText()))

/* ── tornati in home, si vedono online col nome ── */
await inHome(a); await inHome(b)
for (const [nome, p] of [['leonardo', a], ['melody', b]]) {
  await p.waitForSelector('[data-azione="amici"]', { timeout: 5000 })
  controlla(`${nome}: ora in home c'è la riga degli amici`, await p.locator('[data-azione="amici"]').isVisible())
}
await a.waitForFunction(() => /1 online/.test(document.querySelector('[data-azione="amici"]')?.innerText || ''), null, { timeout: 15000 })
await b.waitForFunction(() => /1 online/.test(document.querySelector('[data-azione="amici"]')?.innerText || ''), null, { timeout: 15000 })
await a.click('[data-azione="amici"]')
await a.waitForSelector('[data-amici] [data-amico]', { timeout: 5000 })
controlla('nella lista c\'è il nome dell\'amico, online', /melody/i.test(await a.locator('[data-amici]').innerText()))
await a.click('[data-azione="chiudi-amici"]')

/* ── uno invita l'altro a Castle Battle ── */
await scegli(a, 'arena'); await a.waitForSelector('.ar-mappa', { timeout: 8000 })
await a.locator('[data-sfida-apri]').click()
await a.waitForSelector('[data-sfida-amici]', { timeout: 5000 })
const amicoA = a.locator('[data-sfida] button[data-amico]').first()
controlla('c\'è l\'amico, pronto da invitare', await amicoA.isEnabled())
await amicoA.click()
await a.locator('[data-terreno="palude"]').click()
await a.locator('[data-sfida-vai]').click()
await a.waitForSelector('[data-sfida-invitato]', { timeout: 15000 })
controlla('chi invita aspetta, senza codice da dire', /melody/i.test(await a.locator('[data-sfida]').innerText()) && await a.locator('[data-codice]').count() === 0)

await b.waitForSelector('[data-invito]', { timeout: 15000 })
const cartello = await b.locator('[data-invito]').innerText()
controlla('all\'altro compare il cartello, con chi lo invita e a cosa', /leonardo/i.test(cartello) && /Castle Battle/.test(cartello), cartello)
await b.click('[data-invito-gioca]')
for (const [nome, p] of [['chi invita', a], ['chi accetta', b]]) {
  await p.waitForSelector('[data-piazzola="0"]', { timeout: 25000 })
  controlla(`${nome}: la battaglia è partita`, await p.locator('[data-castello]').count() === 1)
}

controlla('nessun errore vero in console, da nessuna parte', veri([...A.errori, ...B.errori]).length === 0, veri([...A.errori, ...B.errori]).join(' | '))

/* ── senza servizio raggiungibile: tutto tace ── */
const D = await telefono('offline', 'http://localhost:9')
await daiGrandi(D.page)
await D.page.click('[data-azione="amici-attiva"]')
await D.page.waitForSelector('[data-azione="amici-invita"]', { timeout: 5000 })
await D.page.click('[data-azione="amici-invita"]')
await D.page.waitForSelector('[data-amici-messaggio]', { timeout: 20000 })
controlla('senza servizio il grande legge una frase chiara', /internet|non risponde/.test(await D.page.locator('[data-amici-messaggio]').innerText()))
await inHome(D.page)
await attendi(D.page, 600)
controlla('e la home resta com\'è: finché non c\'è un amico non c\'è nemmeno la riga («ancora nessuno» sarebbe triste), e nessun cartello', await D.page.locator('[data-azione="amici"]').count() === 0 && await D.page.locator('[data-invito]').count() === 0)
controlla('nessun errore del gioco', veri(D.errori).length === 0, veri(D.errori).join(' | '))

await browser.close()
riassunto('amici: due telefoni, un invito, e il silenzio quando manca la rete')
