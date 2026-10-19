/* ═══════════════════════════════════════════════════════════════════
   CASTLE BATTLE — LA SFIDA IN DUE, DUE PAGINE E IL SERVIZIO VERO

   Due pagine (due telefoni) aprono il gioco dal file locale (origine `null`, come un doppio click), una crea la sfida e
   riceve il codice, l'altra lo scrive; il servizio di inoltro su Cloudflare (`servizio/inoltro`, docs/arena/multigiocatore.md)
   le mette in contatto. Si controlla che la battaglia parta su tutte e due, che le mosse dell'uno e dell'altro passino
   (ognuno costruisce, rispondendo al suo calcolo) e che le due copie restino uguali: ogni cinque secondi di gioco si
   confrontano le impronte, e se si separano compare il cartello «la sfida è finita qui». Poi uno esce e l'altro lo sa.
   **Serve internet** (il servizio sta su `sfida.educagioco.workers.dev`).
   `node test/esegui.mjs arena-sfida --niente-build`
   tempo: 90
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, attendi, scegli, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const A = await apriGioco(browser)
const B = await apriGioco(browser)
const a = A.page, b = B.page
for (const p of [a, b]) {
  await azzera(p)
  await semina(p, { settings: { eta: 8, sperimentali: true } })
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
const t0 = Math.min(await secondi(a), await secondi(b))
for (let t = 0; t < 60 && Math.min(await secondi(a), await secondi(b)) < t0 + 12; t++) await attendi(a, 500)
controlla('la battaglia è andata avanti su tutti e due', Math.abs(await secondi(a) - await secondi(b)) <= 3, `${await secondi(a)} / ${await secondi(b)}`)
controlla('e nessuno dei due ha visto le copie separarsi', await a.locator('[data-sfida-rotta]').count() === 0 && await b.locator('[data-sfida-rotta]').count() === 0)

/* ── uno esce: l'altro lo sa ── */
await a.click('button[aria-label="indietro"]')
await a.waitForSelector('.ar-mappa', { timeout: 6000 })
await b.waitForSelector('[data-sfida-rotta]', { timeout: 15000 })
controlla('chi resta lo sa, con una frase', /se n'è andato/.test(await b.locator('[data-sfida-rotta]').innerText()))
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

const errori = [...A.errori, ...B.errori].filter(e => !/favicon|manifest|ZZZZZ/.test(e))   // il codice sbagliato lo scrive il browser in console
controlla('nessun errore nel browser', errori.length === 0, errori.join(' | '))
await browser.close()
riassunto('arena in due: la sfida col servizio vero')
