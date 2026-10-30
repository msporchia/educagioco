/* ═══════════════════════════════════════════════════════════════════
   IL SOTTERRANEO 3D IN DUE — DUE PAGINE E IL SERVIZIO VERO

   Due pagine (due telefoni) aprono il Sotterraneo 3D, ognuna col suo eroe; una crea la discesa in due (il posto e la
   difficoltà) e riceve il codice, l'altra lo scrive (docs/sotterraneo/in-due.md). Partiti, tutti e due sono nella stessa
   discesa con tutti e due gli eroi, il compagno ha il suo nome sopra la testa, un passo dell'uno si vede sull'altro telefono,
   non ci si allontana oltre LONTANO, e quando uno se ne va l'altro lo sa. Le reti cattive le prova unita/sotterraneo-sfida.
   **Serve il servizio in locale**: `cd servizio/inoltro && npx wrangler dev`, poi
   `node test/esegui.mjs sotterraneo-sfida` (`SERVIZIO=` per un altro indirizzo http); senza servizio **salta**.
   tempo: 400
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, attendi, scegli, scegliAvventura, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { LONTANO } from '../../src/giochi/sotterraneo/motore/in-due.js'

const SERVIZIO = (process.env.SERVIZIO || 'http://localhost:8787').replace(/\/$/, '')
const vivo = await fetch(`${SERVIZIO}/`).then(r => r.ok, () => false)
if (!vivo) { console.log(`⚠️  salto: il servizio non risponde su ${SERVIZIO} (in servizio/inoltro: \`npx wrangler dev\`)`); process.exit(0) }

const browser = await apriBrowser()
const A = await apriGioco(browser)
const B = await apriGioco(browser)
const a = A.page, b = B.page
for (const [p, eroe] of [[a, 'cavaliere'], [b, 'mago']]) {
  await azzera(p)
  await semina(p, { settings: { eta: 8, sperimentali: true } })
  await p.evaluate(s => { globalThis.__SERVIZIO_SFIDE__ = s }, SERVIZIO)
  await scegli(p, 'sotterraneo3d')
  await scegliAvventura(p, eroe)
}
const corsaDi = p => p.evaluate(() => {
  const c = window.__sotterraneo3d && window.__sotterraneo3d.corsa
  return c && { piano: c.piano, passi: c.passi, persone: c.persone.map(q => ({ eroe: q.chiEro, x: q.eroe.x, y: q.eroe.y, vita: q.vita, foglio: q.foglio ? q.foglio.che : null })), mia: c.indiceDi() }
})

/* ── chi crea ── */
await a.locator('[data-sfida-apri]').click()
await a.locator('[data-sfida-crea]').click()
controlla('chi crea sceglie il posto fra i tredici dungeon e la difficoltà', await a.locator('[data-posto-in-due]').count() === 13 && await a.locator('[data-difficolta]').count() === 4)
await a.locator('[data-posto-in-due="altare"]').click()
await a.locator('[data-difficolta="facile"]').click()
await a.locator('[data-sfida-vai]').click()
await a.waitForSelector('[data-codice]', { timeout: 15000 })
const codice = (await a.locator('[data-codice]').innerText()).trim()
controlla('riceve un codice di cinque lettere', /^[A-Z]{5}$/.test(codice), codice)
await scatto(a, 'sotterraneo-sfida-attesa')

/* ── chi entra ── */
await b.locator('[data-sfida-apri]').click()
await b.locator('[data-sfida-entra]').click()
await b.locator('[data-sfida-codice-input]').fill(codice)
await b.locator('[data-sfida-vai]').click()

for (const [nome, p] of [['chi crea', a], ['chi entra', b]]) {
  await p.waitForSelector('[data-tela="3d"]', { timeout: 30000 })
  await p.waitForFunction(() => { const c = window.__sotterraneo3d && window.__sotterraneo3d.corsa; return c && c.persone.length === 2 }, null, { timeout: 30000 })
  const c = await corsaDi(p)
  uguale(`${nome}: la stessa discesa con tutti e due gli eroi`, c.persone.map(q => q.eroe).join(' '), 'cavaliere mago')
  uguale(`${nome}: il suo eroe è il suo`, c.mia, p === a ? 0 : 1)
  controlla(`${nome}: in due non c'è il tasto pausa`, await p.locator('button[aria-label="pausa"]').count() === 0)
  await p.waitForSelector('[data-strato3d] [data-compagno]', { state: 'attached', timeout: 15000 })
  controlla(`${nome}: il compagno ha il nome sopra la testa`, await p.locator('[data-strato3d] [data-compagno]').count() === 1)
}
await scatto(a, 'sotterraneo-sfida-in-due')

/* ── un passo dell'uno si vede sull'altro ── */
{
  const prima = await corsaDi(a)
  const io = prima.persone[0]
  // una cella libera poco più in là, scelta dove la discesa la sa camminabile
  const meta = await a.evaluate(() => {
    const c = window.__sotterraneo3d.corsa, e = c.eroe, L = c.livello
    for (let r = 3; r < 8; r++) for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r]]) {
      const x = Math.floor(e.x) + dx, y = Math.floor(e.y) + dy
      if (L.calpestabile(x, y)) return { x, y }
    }
    return null
  })
  controlla('c\'è una cella dove andare', !!meta)
  await a.evaluate(m => window.__sotterraneo3d.corsa.vaiVerso(m, false), meta)
  // senza scheda video i fotogrammi sono lenti e il tempo del gioco corre più piano: si aspetta che arrivi
  // (fermo, non appena entrato nella cella: lì è ancora a 10,04 e l'altro telefono, più avanti, già a 10,5)
  await a.waitForFunction(m => { const c = window.__sotterraneo3d.corsa, q = c.persone[0].eroe; return Math.floor(q.x) === m.x && Math.floor(q.y) === m.y && !c.strada }, meta, { timeout: 60000 }).catch(() => {})
  const [ca, cb] = [await corsaDi(a), await corsaDi(b)]
  const mosso = Math.abs(ca.persone[0].x - io.x) + Math.abs(ca.persone[0].y - io.y)
  controlla(`il cavaliere ha camminato fino alla cella toccata (${mosso.toFixed(1)} celle)`, Math.floor(ca.persone[0].x) === meta.x && Math.floor(ca.persone[0].y) === meta.y)
  // le due copie vanno un poco sfasate (il lockstep): si guarda dove sono arrivati, fermi
  await b.waitForFunction(([x, y]) => { const q = window.__sotterraneo3d.corsa.persone[0]; return Math.abs(q.eroe.x - x) < 0.01 && Math.abs(q.eroe.y - y) < 0.01 }, [ca.persone[0].x, ca.persone[0].y], { timeout: 8000 }).catch(() => {})
  const cb2 = await corsaDi(b)
  uguale('e sull\'altro telefono è arrivato nello stesso punto', `${cb2.persone[0].x},${cb2.persone[0].y}`, `${ca.persone[0].x},${ca.persone[0].y}`)
  nota(`passi: ${ca.passi} e ${cb.passi}`)
  await scatto(a, 'sotterraneo-sfida-passo')
  await scatto(b, 'sotterraneo-sfida-passo-altro')
}

/* ── non ci si allontana oltre LONTANO ── */
{
  const lontana = await b.evaluate(() => {
    const c = window.__sotterraneo3d.corsa, e = c.eroe
    return c.livello.stanze.reduce((m, s) => (Math.abs(s.cx - e.x) + Math.abs(s.cy - e.y) > Math.abs(m.cx - e.x) + Math.abs(m.cy - e.y) ? s : m))
  })
  await b.evaluate(s => window.__sotterraneo3d.corsa.vaiVerso({ x: s.cx, y: s.cy }, false), lontana)
  // finché cammina: si ferma al limite, o arriva
  await b.waitForFunction(() => { const c = window.__sotterraneo3d.corsa; return c.passi > 0 && !c.strada }, null, { timeout: 90000 }).catch(() => {})
  const c = await corsaDi(b)
  const [p0, p1] = c.persone
  const dx = Math.abs(p0.x - p1.x), dy = Math.abs(p0.y - p1.y)
  controlla(`il mago si ferma a non più di ${LONTANO} celle dal cavaliere (${dx.toFixed(1)}, ${dy.toFixed(1)})`, dx <= LONTANO + 0.5 && dy <= LONTANO + 0.5)
}

/* ── uno se ne va: l'altro lo sa ── */
await a.locator('button[aria-label="indietro"], [data-indietro]').first().click()
await b.waitForSelector('[data-sfida-rotta]', { timeout: 20000 })
controlla('chi resta vede che la discesa in due è finita, col perché', /andato/.test(await b.locator('[data-sfida-rotta]').innerText()))
await scatto(b, 'sotterraneo-sfida-rotta')
await b.locator('[data-sfida-esci]').click()
await b.waitForSelector('[data-mondo3d]', { state: 'attached', timeout: 20000 })
controlla('e torna su, sulla terra di sopra', await b.locator('[data-mondo3d]').count() === 1)

uguale('nessun errore nelle due pagine', [...A.errori, ...B.errori].join(' | '), '')
await browser.close()
riassunto('Il Sotterraneo 3D in due, due pagine')
