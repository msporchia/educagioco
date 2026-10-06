/* Gli asteroidi lasciati a metà, nel browser: si esce con ←, la mappa offre
   in cima «torno da dove ero», e si riprende com'era — vite, punti, gettoni,
   la stessa domanda — dietro il velo della pausa, anche dopo aver ricaricato
   la pagina. Una tappa nuova chiede prima. Il record di un volo lasciato a
   metà si scrive quando il volo finisce o si lascia perdere. Vedi
   docs/asteroidi/sosta.md.
   `node test/esegui.mjs asteroidi-sosta`
   tempo: 60 */
import { apriBrowser, apriGioco, azzera, attendi, scatto, leggiProfilo, scegli } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

async function entra() {
  await scegli(page, 'mate')
  await page.waitForSelector('.scaletta', { timeout: 5000 })
}
const indietro = () => page.click('button[aria-label="indietro"]')

// colpisce il sasso giusto n volte (o uno sbagliato: `giusto: false`)
const colpisci = (n, giusto = true) => page.evaluate(([n, giusto]) => {
  const m = window.__mate
  for (let i = 0; i < n && m.fase.value === 'gioco'; i++)
    m.colpisci(m.asteroidi().find(a => !a.morto && a.ok === giusto))
}, [n, giusto])

// com'è la partita adesso: quello che la sosta deve rimettere
const comEra = () => page.evaluate(() => {
  const m = window.__mate
  const g = m.asteroidi().find(a => a.ok && !a.morto)
  return { fase: m.fase.value, vite: m.hud.vite, punti: m.hud.punti, giuste: m.hud.giuste,
           mirate: m.hud.mirate, serie: m.hud.serie, livello: m.hud.livello,
           testo: m.domanda.testo, gelo: m.gelo(), gettoni: `${m.tasca.gelo}/${m.tasca.mirino}`,
           vivi: m.asteroidi().filter(a => !a.morto).length,
           incassato: m.incassato(), posizione: m.posizione.value,
           quota: g ? Math.round(1000 * g.y / window.innerHeight) / 1000 : null }
})

/* ══════════ 1. la tappa: ← e si ritrova ══════════ */
await entra()
await page.locator('.pianeta:not(.chiuso)').first().click()
await page.waitForSelector('button[aria-label="pausa"]', { timeout: 5000 })
// sei centri e uno sbagliato, un gelo e un mirino in tasca (spesi, e il mirino toglie un falso)
await colpisci(6)
await colpisci(1, false)
await page.evaluate(() => {
  const m = window.__mate
  m.tasca.gelo = 2; m.tasca.mirino = 1
  m.usaGelo(); m.usaMirino()
})
const prima = await comEra()
controlla('la prova parte da una tappa cominciata',
          prima.giuste === 6 && prima.vite === 2 && prima.gelo === true && prima.gettoni === '1/0',
          JSON.stringify(prima))

await indietro()
await page.waitForSelector('[data-ripresa]')
const carta = await page.locator('[data-ripresa]').textContent()
controlla('la carta dice a che punto si era', /6\/\d+ centri/.test(carta) && /❤️ 2/.test(carta), carta)
await scatto(page, 'asteroidi-ripresa')

await page.click('[data-ripresa] [data-azione="riprendi"]')
await attendi(page, 300)
const dopo = await comEra()
uguale('si riprende in volo', dopo.fase, 'gioco')
for (const k of ['vite', 'punti', 'giuste', 'mirate', 'serie', 'livello', 'testo', 'gelo',
                 'gettoni', 'vivi', 'incassato', 'posizione'])
  uguale(`${k} com'era`, dopo[k], prima[k])
controlla('il sasso giusto alla stessa quota', Math.abs(dopo.quota - prima.quota) < 0.02,
          `${prima.quota} → ${dopo.quota}`)
uguale('il cielo ripreso aspetta un tocco', await page.locator('[data-pausa]').count(), 1)

/* ricominciare da capo non è una mossa: una risposta giusta continua dal conto di prima */
await page.click('[data-pausa] [data-azione="riprendi"]', { delay: 400 })
await attendi(page, 300)
await colpisci(1)
const poi = await comEra()
uguale('il conto prosegue', poi.giuste, 7)
controlla('le monete di prima restano nel conto', poi.incassato >= prima.incassato,
          `${prima.incassato} → ${poi.incassato}`)

/* la pagina che sparisce: si ricarica e la carta c'è ancora */
await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
await page.evaluate(() => window.dispatchEvent(new Event('pagehide')))
await attendi(page, 600)
await page.reload()
await page.waitForSelector('.carte')
await entra()
uguale('anche dopo aver ricaricato la pagina', await page.locator('[data-ripresa]').count(), 1)
const ricaricata = await page.locator('[data-ripresa]').textContent()
controlla('con i centri di dopo', /7\/\d+ centri/.test(ricaricata), ricaricata)

/* toccare un'altra tappa non la butta in silenzio */
await page.locator('.pianeta:not(.chiuso)').nth(1).click()
uguale('una tappa nuova chiede prima', await page.locator('[data-chiede]').count(), 1)
await page.click('[data-chiede] [data-azione="riprendi-invece"]')
await attendi(page, 300)
uguale('«torno a quella di prima» la riprende', (await comEra()).giuste, 7)
await page.click('[data-pausa] [data-azione="riprendi"]', { delay: 400 })   // il velo copre anche il ←
await indietro()
await page.waitForSelector('[data-ripresa]')
await page.locator('.pianeta:not(.chiuso)').nth(1).click()
await page.click('[data-chiede] [data-azione="comincia"]')
await attendi(page, 300)
const nuova = await comEra()
controlla('scelta la nuova, si gioca quella, da zero',
          nuova.giuste === 0 && nuova.vite === 3, JSON.stringify(nuova))
await indietro()                 // appena cominciata: niente da riprendere
await page.waitForSelector('.scaletta')
uguale('una tappa appena aperta non lascia la carta', await page.locator('[data-ripresa]').count(), 0)

/* ══════════ 2. il volo: il record non si perde ══════════ */
await page.evaluate(() => { window.__mate.progresso.value.libera = true })
await page.locator('[data-volo]').click()
await page.waitForSelector('button[aria-label="pausa"]')
await colpisci(4)
const punti = (await comEra()).punti
controlla('il volo ha fatto qualche punto', punti >= 40, String(punti))
await indietro()
await page.waitForSelector('[data-ripresa]')
controlla('la carta dice i punti', new RegExp(`${punti} punti`).test(await page.locator('[data-ripresa]').textContent()))
uguale('il record non si scrive finché il volo è a metà',
       await page.evaluate(() => window.__mate.recordVolo.value), '')

await page.click('[data-ripresa] [data-azione="riprendi"]')
await attendi(page, 300)
uguale('il volo riprende coi punti di prima', (await comEra()).punti, punti)
await page.click('[data-pausa] [data-azione="riprendi"]', { delay: 400 })

/* si perde: tre sbagli, il volo finisce davvero e il record è quello */
await page.evaluate(() => {
  const m = window.__mate
  for (let i = 0; i < 30 && m.fase.value === 'gioco'; i++) {
    const vivi = m.asteroidi().filter(a => !a.morto)
    m.colpisci(vivi.find(a => !a.ok) || vivi[0])     // senza falsi in cielo si passa alla domanda dopo
  }
})
await page.waitForSelector('[data-primato]', { timeout: 5000 })
const finale = await page.evaluate(() => ({ fase: window.__mate.fase.value,
                                            primato: window.__mate.finale.primato?.record }))
uguale('il volo è finito', finale.fase, 'fine')
const q1 = (await leggiProfilo(page)).campagne.mate
controlla('il record è scritto una volta sola', q1.primati?.[Object.keys(q1.primati)[0]]?.partite === 1 ||
          q1.primato?.partite === 1, JSON.stringify(q1.primato || q1.primati))
controlla('e la sosta si è tolta', !q1.sosta)
await page.click('.velo .bottone.chiaro')           // Mappa
await page.waitForSelector('.scaletta')
uguale('niente carta dopo una partita finita', await page.locator('[data-ripresa]').count(), 0)

/* ma un volo lasciato a metà e poi «lascio perdere» scrive il suo record */
await page.locator('[data-volo]').click()
await page.waitForSelector('button[aria-label="pausa"]')
await colpisci(12)
const alto = (await comEra()).punti
await indietro()
await page.waitForSelector('[data-ripresa]')
await page.click('[data-ripresa] [data-azione="scorda"]')
uguale('«lascio perdere» toglie la carta', await page.locator('[data-ripresa]').count(), 0)
const q2 = (await leggiProfilo(page)).campagne.mate
controlla('e il volo lasciato a metà non perde il record', !q2.sosta &&
          JSON.stringify(q2).includes(`"best":${alto}`), `${alto} in ${JSON.stringify(q2).slice(0, 300)}`)

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('asteroidi — la partita lasciata a metà, nel browser')
