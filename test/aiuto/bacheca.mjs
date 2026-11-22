/* ═══════════════════════════════════════════════════════════════════
   GLI AMICI SULLE MAPPE, PREPARATI IN UNA VOLTA (docs/core/amici-nei-giochi.md)

   La bacheca di un amico porta tutti i giochi insieme (`giochi: { conta, arena, … }`):
   una sola semina mette gli amici su tutte le mappe, e si passa da un
   gioco all'altro dalla home senza ricaricare. `semina` + `seminaAmici`
   ricaricavano due volte la pagina da 36 MB: qui profilo e amici si
   scrivono insieme e si ricarica una volta.
   ═══════════════════════════════════════════════════════════════════ */
import { attendi, amicoDiProva, GIOCATORE } from './browser.mjs'

// chi sono gli amici di prova: una lettera (la chiave), l'id e il nome; `c` è abbinato ma mai incontrato, senza nome
export const AMICI = {
  a: ['lorenzo01', 'Lorenzo'], b: ['marta0001', 'Marta'], c: [null, ''], d: ['ugo000001', 'Ugo'],
  e: ['sara000001', 'Sara'], f: ['dario00001', 'Dario'],
}

// la voce di un gioco nella bacheca di un amico: `tappa` 0 vuol dire che lì non ha fatto niente
export const voce = (chiave, tappa, record) =>
  ({ [chiave]: { posti: tappa ? { '': tappa } : {}, primati: record ? { '': record } : {} } })

/* Gli amici di più giochi insieme: `perGioco` è un elenco di { lettera: giochi } (uno per gioco), `fa` i giorni dalla
   lettura di ognuno. Un amico che non compare in nessun gioco non c'è. */
export function amiciDi(perGioco, fa) {
  const giochi = {}
  for (const g of perGioco) for (const [l, v] of Object.entries(g || {})) giochi[l] = { ...(giochi[l] || {}), ...v }
  return Object.keys(giochi).sort().map(l => amicoDiProva(l, AMICI[l][0], AMICI[l][1], { fa: fa[l] ?? 0, giochi: giochi[l] }))
}

/* Scrive il profilo (sopra quello che c'è, come `semina`) e gli amici accesi dai grandi, poi ricarica una volta.
   Prima lascia finire le scritture in coda: l'archivio rimanda di 350 ms, e al `pagehide` scriverebbe il profilo di prima
   sopra quello seminato. Si chiama dalla home: un indirizzo col nome di un gioco lo riaprirebbe. */
export async function seminaConAmici(page, profilo, amici, { sorpassi = [], giocatore = GIOCATORE } = {}) {
  await attendi(page, 400)
  const amiciSalvati = { id: 'banco' + giocatore.replace(/[^a-z0-9]/g, '').padEnd(8, '0').slice(0, 10),
                         deciso: true, attivo: true, online: true, amici, sorpassi }
  await page.evaluate(([p, a, chi]) => new Promise((ok, ko) => {
    history.replaceState(null, '', location.pathname + location.search)
    const r = indexedDB.open('giochi-bambini', 1)
    r.onerror = () => ko(new Error('IndexedDB non si apre'))
    r.onsuccess = () => {
      const tx = r.result.transaction('kv', 'readwrite'), s = tx.objectStore('kv')
      const g = s.get('profilo:' + chi)
      g.onsuccess = () => {
        const x = g.result
        const busta = x && typeof x === 'object' && '__v' in x && typeof x.__t === 'number'
        s.put({ ...((busta ? x.__v : x) || {}), ...p }, 'profilo:' + chi)
      }
      s.put(a, 'amici:' + chi)
      tx.oncomplete = ok
      tx.onerror = () => ko(new Error('scrittura fallita'))
    }
  }), [profilo, amiciSalvati, giocatore])
  await page.reload()
  await page.waitForSelector('.carte', { timeout: 10000 })
  await viaITraguardi(page)
}

/* Un profilo seminato a campagne finite fa scattare i traguardi (components/Traguardo.vue): un cartello per volta, 3,2 s
   l'uno, sopra la home. Un bambino lo tocca e se ne vanno tutti; il test fa lo stesso, se no aspetta la coda (mezzo minuto)
   o tocca il velo invece della carta. Arrivano un attimo dopo il caricamento: si guarda per un po'. */
export async function viaITraguardi(page, ms = 600) {
  const fine = Date.now() + ms
  do {
    const c = page.locator('.velo:has(.occhiello)')
    if (await c.count()) { await c.first().click().catch(() => {}); continue }
    await attendi(page, 100)
  } while (Date.now() < fine)
}

/* Torna in home da dove si è (una mappa, un fumetto aperto, una partita): ← finché si può, e se un velo lo copre si
   ricarica. Serve fra un gioco e l'altro, anche quando la prova di prima si è fermata a metà. */
export async function allaHome(page) {
  for (let i = 0; i < 4 && !(await page.locator('.carte').count()); i++) {
    const b = page.locator('button[aria-label="indietro"]')
    if (!(await b.count())) break
    await b.first().click({ timeout: 2000 }).catch(() => {})
    await page.waitForSelector('.carte', { timeout: 2000 }).catch(() => {})
  }
  if (await page.locator('.carte').count()) return viaITraguardi(page, 0)
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
  await page.reload()
  await page.waitForSelector('.carte', { timeout: 10000 })
  await viaITraguardi(page)
}
