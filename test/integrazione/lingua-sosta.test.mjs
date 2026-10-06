/* Il gioco di lingua di prima (views/LinguaGame.vue) lasciato a metà, nel
   browser. Due strade: il libero di chi aveva finito la campagna (si entra
   dal fondo della mappa del tesoro) e le tappe della campagna (#verbi).
   Si esce con ←, si rientra, la carta c'è e la partita riprende con la
   stessa domanda, le stesse giuste e le monete già prese (nessuna pagata
   due volte). Anche dopo aver ricaricato la pagina. Una partita nuova non
   butta la vecchia in silenzio. Lo spagnolo ha la sua sosta, a parte.
   Vedi docs/lingue/sosta.md.
   `node test/esegui.mjs lingua-sosta` */
import { apriBrowser, apriGioco, azzera, semina, attendi, leggiProfilo, scegli } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

const monete = async () => { await attendi(page, 500); return (await leggiProfilo(page)).coins }
const indietro = () => page.click('button[aria-label="indietro"]')
// la domanda com'è sullo schermo: la voce, il tipo e le risposte nell'ordine
const domanda = () => page.evaluate(() => {
  const t = window.__lingua.turno.value
  return t && JSON.stringify([t.chiave, t.tipo, t.opzioni.map(o => o.testo)])
})
const conto = () => page.evaluate(() => { const h = window.__lingua.hud; return `${h.giuste}/${h.errori}` })
// una risposta data dal gioco, poi si aspetta la domanda dopo
async function rispondi(giusta = true) {
  await page.evaluate(g => {
    const q = window.__lingua
    const t = q.turno.value
    q.rispondi(g ? q.giusta() : t.opzioni.find(o => !o.giusta))
  }, giusta)
  await page.waitForFunction(() => {
    const q = window.__lingua
    return q.fase.value !== 'gioco' || (q.turno.value && !document.querySelector('.scelta.bene, .scelta.male'))
  }, null, { timeout: 6000 })
}

/* ================= 1. il libero dell'inglese ================= */
await semina(page, { coins: 50, eng: { tappa: 13, libera: true } })
const entraLibero = async () => {
  await scegli(page, 'inglese')
  await page.waitForSelector('[data-prima]', { timeout: 5000 })
  await page.locator('[data-prima]').click()
}
await entraLibero()
await page.waitForSelector('.scelte .scelta', { timeout: 5000 })
uguale('senza una partita a metà si entra dritti nel gioco', await page.locator('[data-ripresa]').count(), 0)
const m0 = await monete()
for (let i = 0; i < 3; i++) await rispondi(true)
await rispondi(false)
await rispondi(true)
await attendi(page, 300)
const lasciata = await domanda()
const contoLasciato = await conto()
const m1 = await monete()
uguale('la prova parte da quattro giuste e uno sbaglio', contoLasciato, '4/1')
controlla('le giuste hanno pagato', m1 > m0, `${m0} → ${m1}`)

await indietro()
await page.waitForSelector('[data-mappa-inglese]')
await page.locator('[data-prima]').click()
await page.waitForSelector('[data-ripresa]')
const carta = await page.locator('[data-ripresa]').innerText()
controlla('la carta dice dove si era', /✅ 4 giuste/.test(carta), carta)
uguale('uscire non ha pagato né tolto niente', await monete(), m1)

await page.click('[data-ripresa] [data-azione="riprendi"]')
await page.waitForSelector('.scelte .scelta')
uguale('si riprende con la stessa domanda, risposte comprese', await domanda(), lasciata)
uguale('con gli stessi conti', await conto(), contoLasciato)
uguale('la carta sparisce', await page.locator('[data-ripresa]').count(), 0)
uguale('rientrare non ha pagato niente', await monete(), m1)
await rispondi(true)
controlla('una giusta in più conta una volta e paga una volta',
          (await monete()) > m1 && (await conto()) === '5/1', await conto())

/* il telefono in tasca: la pagina sparisce, l'app si ricarica */
const lasciata2 = await domanda()
const m2 = await monete()
await page.evaluate(() => window.dispatchEvent(new Event('pagehide')))
await attendi(page, 500)
await page.reload()
await page.waitForSelector('.carte')
await entraLibero()
await page.waitForSelector('[data-ripresa]')
await page.click('[data-ripresa] [data-azione="riprendi"]')
await page.waitForSelector('.scelte .scelta')
uguale('anche dopo aver ricaricato la domanda è quella', await domanda(), lasciata2)
uguale('e i conti anche', await conto(), '5/1')
uguale('e le monete', await monete(), m2)
const p1 = await leggiProfilo(page)
controlla('la sosta sta in una chiave sua, non in quella dei mondi',
          !!p1.campagne['inglese-prima'].sosta && !(p1.campagne.inglese && p1.campagne.inglese.sosta))
controlla('e lo spagnolo non ne ha', !p1.campagne['spagnolo-prima'])

/* «lascio perdere»: si parte da zero, e uscire a zero non lascia niente */
await indietro()
await page.waitForSelector('[data-mappa-inglese]')
await page.locator('[data-prima]').click()
await page.waitForSelector('[data-ripresa]')
await page.click('[data-ripresa] [data-azione="scorda"]')
await page.waitForSelector('.scelte .scelta')
uguale('«lascio perdere» comincia un libero nuovo', await conto(), '0/0')
await indietro()
await page.waitForSelector('[data-mappa-inglese]')
await attendi(page, 400)
controlla('e non resta nessuna sosta', !(await leggiProfilo(page)).campagne['inglese-prima'].sosta)
await page.locator('[data-prima]').click()
await page.waitForSelector('.scelte .scelta')
uguale('rientrando non c\'è nessuna carta', await page.locator('[data-ripresa]').count(), 0)

/* ================= 2. lo spagnolo ha la sua, a parte ================= */
await indietro()
await page.waitForSelector('[data-mappa-inglese]')
await indietro()
await page.waitForSelector('.carte')
await semina(page, { esp: { tappa: 13, libera: true } })
await scegli(page, 'spagnolo')
await page.waitForSelector('[data-prima]')
await page.locator('[data-prima]').click()
await page.waitForSelector('.scelte .scelta')
uguale('lo spagnolo non vede la sosta dell\'inglese', await page.locator('[data-ripresa]').count(), 0)
await rispondi(true)
await rispondi(true)
await indietro()
await page.waitForSelector('[data-mappa-inglese]')
await attendi(page, 500)
const p2 = await leggiProfilo(page)
controlla('la sosta spagnola è sua', !!p2.campagne['spagnolo-prima'].sosta
          && p2.campagne['spagnolo-prima'].sosta.lingua === 'es')

/* ================= 3. le tappe della campagna (#verbi) ================= */
await indietro()
await page.waitForSelector('.carte')
await semina(page, { eng: { tappa: 2, libera: false }, campagne: {} })
await page.evaluate(() => { location.hash = 'verbi' })
await page.waitForSelector('.mappa .tappa[data-tappa-lingua]')
const tappa = i => page.locator(`.mappa [data-tappa-lingua="${i}"]`)
uguale('senza una sosta la mappa non ha la carta', await page.locator('[data-ripresa]').count(), 0)
await tappa(0).click()
await page.waitForSelector('.scelte .scelta')
for (let i = 0; i < 3; i++) await rispondi(true)
await rispondi(false)
await attendi(page, 300)
const t0 = await domanda(), c0 = await conto()
const m3 = await monete()
uguale('la prova parte da tre giuste e uno sbaglio', c0, '3/1')

await indietro()
await page.waitForSelector('.mappa [data-ripresa]')
const carta2 = await page.locator('[data-ripresa]').innerText()
controlla('la carta dice la tappa e il bersaglio', /Gli animali/.test(carta2) && /✅ 3 di 12/.test(carta2), carta2)
uguale('uscire non ha pagato niente', await monete(), m3)

/* un'altra tappa non butta la sosta in silenzio */
await tappa(1).click()
await page.waitForSelector('[data-chiede]')
uguale('una tappa nuova chiede prima', await page.locator('[data-chiede]').count(), 1)
await page.click('[data-chiede] [data-azione="riprendi-invece"]')
await page.waitForSelector('.scelte .scelta')
uguale('«torno a quella di prima» riprende la prima', await domanda(), t0)
uguale('con gli stessi conti', await conto(), c0)
uguale('e senza pagare', await monete(), m3)

await indietro()
await page.waitForSelector('.mappa [data-ripresa]')
await tappa(1).click()
await page.waitForSelector('[data-chiede]')
await page.click('[data-chiede] [data-azione="comincia"]')
await page.waitForSelector('.scelte .scelta')
uguale('scelta la nuova, si gioca quella da capo', await conto(), '0/0')

/* una tappa vinta non lascia niente */
let giri = 0
while (await page.evaluate(() => window.__lingua.fase.value) === 'gioco' && giri++ < 60) await rispondi(true)
await page.waitForSelector('[data-monete-prese]', { timeout: 6000 })
await page.getByText('La mappa').click()
await page.waitForSelector('.mappa')
uguale('vinta la tappa, la carta non c\'è', await page.locator('[data-ripresa]').count(), 0)
await attendi(page, 500)
const p3 = await leggiProfilo(page)
controlla('e nessuna sosta resta nel profilo', !p3.campagne['inglese-prima'].sosta)

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('lingua — il gioco di prima lasciato a metà, nel browser')
