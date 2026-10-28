/* ═══════════════════════════════════════════════════════════════════
   CASTLE BATTLE — LA SFIDA IN DUE, DUE PAGINE, IL SERVIZIO VERO E UNA RETE CATTIVA

   Due pagine (due telefoni) aprono il gioco dal file locale (origine `null`, come un doppio click), una crea la sfida e
   riceve il codice, l'altra lo scrive; il servizio di inoltro (`servizio/inoltro`, docs/core/insieme.md) le mette in
   contatto. Ognuna ci parla attraverso un proxy suo (test/aiuto/proxy-cattivo.mjs) che guasta la rete a comando: il filo
   che cade, il filo che muore in silenzio, la rete spenta per venti secondi, la rete piantata. La sfida non deve mai
   rompersi: chi ha perso la linea lo vede scritto, l'altro aspetta, e quando torna la battaglia riparte uguale su tutti
   e due. Poi uno esce e l'altro lo sa subito.
   **Serve il servizio in locale**: `cd servizio/inoltro && npx wrangler dev`, poi
   `node test/esegui.mjs arena-sfida` (`SERVIZIO=` per un altro indirizzo http); senza servizio **salta**.
   tempo: 420
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, attendi, scegli, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { proxyCattivo } from '../aiuto/proxy-cattivo.mjs'

const SERVIZIO = (process.env.SERVIZIO || 'http://localhost:8787').replace(/\/$/, '')
const vivo = await fetch(`${SERVIZIO}/`).then(r => r.ok, () => false)
if (!vivo) { console.log(`⚠️  salto: il servizio non risponde su ${SERVIZIO} (in servizio/inoltro: \`npx wrangler dev\`)`); process.exit(0) }
const porta = Number(new URL(SERVIZIO).port || 80)
const [reteA, reteB] = await Promise.all([proxyCattivo(porta), proxyCattivo(porta)])

const browser = await apriBrowser()
const A = await apriGioco(browser)
const B = await apriGioco(browser)
const a = A.page, b = B.page
for (const [p, rete] of [[a, reteA], [b, reteB]]) {
  await azzera(p)
  await semina(p, { settings: { eta: 8, sperimentali: true } })
  await p.evaluate(s => { globalThis.__SERVIZIO_SFIDE__ = s }, `http://localhost:${rete.porta}`)
  await scegli(p, 'arena')
  await p.waitForSelector('.ar-mappa', { timeout: 8000 })
}

/* ── chi crea la sfida ── */
await a.locator('[data-sfida-apri]').click()
await a.locator('[data-sfida-crea]').click()
controlla('chi crea sceglie terreno e velocità', await a.locator('[data-terreno]').count() === 4 && await a.locator('[data-ritmo]').count() === 3)
await a.locator('[data-terreno="palude"]').click()
await a.locator('[data-ritmo="normale"]').click()
await a.locator('[data-sfida-vai]').click()
await a.waitForSelector('[data-codice]', { timeout: 15000 })
await scatto(a, 'arena-sfida-attesa')
const codice = (await a.locator('[data-codice]').innerText()).trim()
controlla('riceve un codice di cinque lettere', /^[A-Z]{5}$/.test(codice), codice)

/* ── chi entra ── */
await b.locator('[data-sfida-apri]').click()
await b.locator('[data-sfida-entra]').click()
controlla('con il codice a metà non si entra', await b.locator('[data-sfida-vai]').isDisabled())
await b.locator('[data-sfida-codice-input]').fill(codice.toLowerCase())
await b.locator('[data-sfida-vai]').click()

for (const [nome, p] of [['chi crea', a], ['chi entra', b]]) {
  await p.waitForSelector('[data-piazzola="0"]', { timeout: 20000 })
  controlla(`${nome}: la battaglia è partita, sei piazzole libere e il castello`,
            await p.locator('[data-piazzola]:not([data-variante])').count() === 6 && await p.locator('[data-castello]').count() === 1)
  controlla(`${nome}: l'orologio conta quanto si resiste (♾️), e non c'è il tasto pausa`,
            /♾️/.test(await p.locator('.ar-hud').innerText()) && await p.locator('button[aria-label="pausa"]').count() === 0)
}
const secondi = async p => { const [m, s] = (await p.locator('.ar-hud b').first().innerText()).split(':').map(Number); return m * 60 + s }

/* ── tutti e due costruiscono, rispondendo giusto (si riprova finché la caserma nasce) ── */
async function costruisciDa(p, truppa, posto) {
  let fatto = false
  for (let giro = 0; giro < 14 && !fatto; giro++) {
    if (!(await p.locator('.ar .qz-tasto').count())) {
      if (await p.locator(`[data-piazzola="${posto}"][data-variante]`).count() === 1) break
      await p.locator(`[data-piazzola="${posto}"]`).click().catch(() => {})
      await p.locator(`[data-costruisci="${truppa}"]`).click({ timeout: 4000 }).catch(() => {})
      await p.waitForSelector('.ar .qz-tasto', { timeout: 6000 }).catch(() => {})
    }
    await attendi(p, 450)
    await p.locator('.ar .qz-tasto').nth(giro % 4).click().catch(() => {})
    await attendi(p, 1200)
    await p.waitForSelector('.ar .qz-velo', { state: 'detached', timeout: 12000 }).catch(() => {})
    await attendi(p, 900)                              // la mossa vale fra qualche decimo di secondo, non subito
    fatto = await p.locator(`[data-piazzola="${posto}"][data-variante="${truppa}"]`).count() === 1
  }
  return fatto
}
const [fa, fb] = await Promise.all([costruisciDa(a, 'guardiano', 0), costruisciDa(b, 'scheletri', 1)])
controlla('chi crea costruisce la sua cripta (con gli opliti)', fa)
controlla('e anche chi entra (con gli arcieri), sul suo schermo e sulla sua piazzola', fb)

await scatto(a, 'arena-sfida-chi-crea')
await scatto(b, 'arena-sfida-chi-entra')
/* ── si gioca qualche secondo: le impronte (ogni 5 s di gioco) dicono se le copie sono uguali ── */
const rotte = async () => (await a.locator('[data-sfida-rotta]').count()) + (await b.locator('[data-sfida-rotta]').count())
async function giocaUnPo(quanto, cosa) {
  const t0 = Math.min(await secondi(a), await secondi(b))
  for (let t = 0; t < 80 && Math.min(await secondi(a), await secondi(b)) < t0 + quanto; t++) await attendi(a, 500)
  controlla(`${cosa}: la battaglia va avanti su tutti e due, alla pari`, Math.min(await secondi(a), await secondi(b)) >= t0 + quanto && Math.abs(await secondi(a) - await secondi(b)) <= 2,
            `${t0} → ${await secondi(a)} / ${await secondi(b)}`)
  controlla(`${cosa}: e nessuno ha visto la sfida finire`, await rotte() === 0, (await a.locator('.ar-velo').allInnerTexts()).join() + (await b.locator('.ar-velo').allInnerTexts()).join())
}
await giocaUnPo(8, 'senza guasti')

/* ── la rete cattiva ── */
reteB.taglia()
await attendi(a, 1500)
await giocaUnPo(6, 'il filo di chi entra cade')

reteA.buco()                                      // il filo di chi crea muore senza dirlo a nessuno
await attendi(a, 1500)
const fermoDa = await secondi(b)
await attendi(a, 3000)
// chi ha il filo morto se ne accorge in sei secondi e si ricollega prima che all'altro esca il cartello (dopo sei e mezzo)
controlla('filo morto in silenzio: intanto il campo aspetta, non va avanti da solo', await secondi(b) - fermoDa <= 1, `${fermoDa} → ${await secondi(b)}`)
await a.waitForSelector('[data-sfida-linea]', { state: 'detached', timeout: 15000 }).catch(() => {})
await b.waitForSelector('[data-sfida-linea]', { state: 'detached', timeout: 15000 }).catch(() => {})
await giocaUnPo(6, 'chi aveva il filo morto se ne accorge da solo e si ricollega')

reteB.spegni(20000)                               // venti secondi senza rete
await b.waitForSelector('[data-sfida-linea="io"]', { timeout: 12000 }).catch(() => {})
controlla('senza rete: chi l\'ha persa lo vede («mi ricollego»)', /Hai perso la linea/.test(await b.locator('[data-sfida-linea]').innerText().catch(() => '')))
controlla('e l\'altro vede che lo si aspetta', /L'altro ha perso la linea/.test(await a.locator('[data-sfida-linea]').innerText().catch(() => '')))
await scatto(a, 'arena-sfida-aspetta')
await a.waitForSelector('[data-sfida-linea]', { state: 'detached', timeout: 40000 }).catch(() => {})
await giocaUnPo(6, 'torna la rete dopo venti secondi')

reteA.ferma(6000)                                 // la rete si pianta e poi consegna tutto in blocco
await attendi(a, 7000)
await giocaUnPo(6, 'la rete piantata per sei secondi')

/* ── uno esce: l'altro lo sa subito ── */
await a.click('button[aria-label="indietro"]')
await a.waitForSelector('.ar-mappa', { timeout: 6000 })
await b.waitForSelector('[data-sfida-rotta]', { timeout: 6000 })
controlla('chi resta lo sa subito, con una frase', /se n'è andato/.test(await b.locator('[data-sfida-rotta]').innerText()))
controlla('e può tornare alla mappa', await b.locator('[data-sfida-esci]').count() === 1)
await b.locator('[data-sfida-esci]').click()
await b.waitForSelector('.ar-mappa', { timeout: 6000 })

/* ── un codice che non esiste ── */
await b.locator('[data-sfida-apri]').click()
await b.locator('[data-sfida-entra]').click()
await b.locator('[data-sfida-codice-input]').fill('ZZZZZ')
await b.locator('[data-sfida-vai]').click()
await b.waitForSelector('[data-sfida-messaggio]', { timeout: 15000 })
controlla('un codice che non esiste si dice', /nessuna sfida/.test(await b.locator('[data-sfida-messaggio]').innerText()))

// la rete guastata apposta: Chrome scrive in console i fili che non si aprono, e la sfida scrive com'è finita
const errori = [...A.errori, ...B.errori].filter(e => !/favicon|manifest|ZZZZZ|WebSocket|ERR_|Failed to load|\[insieme\]/.test(e))
controlla('nessun errore nel browser', errori.length === 0, errori.join(' | '))
await browser.close()
reteA.chiudi(); reteB.chiudi()
riassunto('arena in due: la sfida col servizio vero')
