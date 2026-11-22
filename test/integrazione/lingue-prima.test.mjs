/* ═══════════════════════════════════════════════════════════════════
   IL GIOCO DI LINGUA DI PRIMA (views/LinguaGame.vue), NEL BROWSER
     node test/esegui.mjs lingue-prima --niente-build
   perché: il gioco di lingua di prima (views/LinguaGame.vue) nelle due lingue: libero in fondo alla mappa del tesoro solo per chi ha finito la campagna vecchia, ci si gioca davvero e si torna alla mappa
   a parte perché: il gioco di prima è un'altra schermata dalle lingue a mondi (lingue-mondi) e ha un'altra campagna: è una view vecchia, con bersagli suoi

   Le carte English ed Español aprono le lingue a mondi (integrazione/lingue-mondi).
   Qui resta quello che il gioco di prima deve ancora fare, nelle due lingue:
     · chi aveva finito la campagna vecchia trova il suo gioco libero in
       fondo alla mappa del tesoro, e ci gioca davvero; chi non l'aveva
       finita non lo vede; uscendo si torna alla mappa
     · le due lingue non si toccano: giocare in spagnolo non muove l'inglese
     · la partita lasciata a metà: si esce con ←, si rientra, la carta c'è e
       la partita riprende con la stessa domanda, le stesse giuste e le
       monete già prese (nessuna pagata due volte), anche dopo aver
       ricaricato; ogni lingua ha la sua sosta; le tappe della campagna
       (#verbi) non buttano la vecchia in silenzio
     · la voce non passa mai da speechSynthesis
   Vedi docs/lingue/sosta.md.
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, semina, attendi, leggiProfilo, TELEFONO, scegli } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto, blocco } from '../aiuto/verifica.mjs'
import { soste, finche } from '../aiuto/soste.mjs'
import { allaHome } from '../aiuto/bacheca.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { viewport: TELEFONO })
// dopo una risposta il gioco aspetta 620 ms (2100 dopo uno sbaglio) prima della domanda dopo: l'orologio della pagina si porta
// avanti invece di aspettarli (`page.clock`, installato prima della semina; il tempo scorre lo stesso)
await page.clock.install()
await page.addInitScript(() => {
  Object.defineProperty(window, 'speechSynthesis', {
    value: { getVoices: () => { window.__sintesi = true; return [] }, cancel() {},
             speak() { window.__sintesi = true } },
    configurable: true,
  })
})
const LINGUE = { inglese: { chiave: 'inglese', vecchia: 'eng', porta: '__eng' },
                 spagnolo: { chiave: 'spagnolo', vecchia: 'esp', porta: '__es' } }
const SPAGNOLO_ACCESO = { giochi: { spagnolo: true } }        // lo spagnolo è spento di base
const indietro = () => page.click('button[aria-label="indietro"]')
/* una risposta data dal gioco (`__lingua`, il gioco aperto), poi la domanda dopo: un'altra, e senza l'esito di prima. Se la
   risposta vince la tappa, il gioco esce dalla fase `gioco` */
async function rispondi(giusta = true) {
  await page.evaluate(g => {
    const q = window.__lingua
    const t = window.__turnoPrima = q.turno.value
    q.rispondi(g ? q.giusta() : t.opzioni.find(o => !o.giusta))
  }, giusta)
  await page.clock.fastForward(giusta ? 650 : 2150)
  await page.waitForFunction(() => {
    const q = window.__lingua
    return q.fase.value !== 'gioco' ||
      (q.turno.value && q.turno.value !== window.__turnoPrima && !document.querySelector('.scelta.bene, .scelta.male'))
  }, null, { timeout: 6000 })
}
async function allaMappa(L) {
  await allaHome(page)
  await scegli(page, L.chiave)
  await page.waitForSelector('[data-mappa-inglese] [data-tappa]', { timeout: 5000 })
}

/* ══════════ 1. senza la campagna vecchia finita, il gioco di prima non c'è ══════════ */
await semina(page, { eng: { tappa: 4, libera: false }, esp: { tappa: 4, libera: false }, settings: SPAGNOLO_ACCESO })
await blocco('la carta in home', async () => {
  uguale('la carta dello spagnolo c’è', await page.locator('.carta.gioco[data-gioco="spagnolo"]').count(), 1)
  uguale('e quella inglese è rimasta al suo posto', await page.locator('.carta.gioco[data-gioco="inglese"]').count(), 1)
})
for (const L of Object.values(LINGUE)) await blocco(`${L.chiave}: campagna vecchia a metà`, async () => {
  await allaMappa(L)
  uguale('a campagna vecchia a metà il gioco di prima non c’è', await page.locator('[data-prima]').count(), 0)
})

/* ══════════ 2. chi l'aveva finita ce l'ha in fondo alla mappa, e ci gioca davvero ══════════
   Prima lo spagnolo: dopo, l'inglese non si deve essere mosso. */
await allaHome(page)
await semina(page, { eng: { tappa: 13, libera: true }, esp: { tappa: 13, libera: true }, settings: SPAGNOLO_ACCESO })
for (const L of [LINGUE.spagnolo, LINGUE.inglese]) await blocco(`${L.chiave}: il gioco libero di prima`, async () => {
  await allaMappa(L)
  await page.waitForSelector('[data-prima]', { timeout: 5000 })
  await page.locator('[data-prima]').scrollIntoViewIfNeeded()
  await page.locator('[data-prima]').click()
  await page.waitForSelector('.scelte .scelta', { timeout: 5000 })
  const gioco = () => page.evaluate(porta => {
    const g = window[porta]
    return { fase: g.fase.value, lingua: g.lingua, libero: g.tappaIdx.value, dopo: g.hud.giuste, qui: window.__lingua === g }
  }, L.porta)
  const partita = await gioco()
  uguale('il gioco aperto è quello della lingua', partita.qui, true)
  let giuste = 0
  while (giuste < 12 && (await gioco()).fase === 'gioco') { await rispondi(true); giuste++ }
  Object.assign(partita, { giuste, dopo: (await gioco()).dopo })
  uguale('si entra dritti nel gioco', partita.fase, 'gioco')
  uguale('ed è il gioco libero, non una tappa', partita.libero, -1)
  uguale('e si gioca davvero', partita.dopo, partita.giuste)
  nota(`${L.chiave}: ${partita.giuste} risposte nel gioco di prima`)
  const contatori = p => L.chiave === 'inglese' ? (p.totals.en || 0) + (p.totals.verbi || 0) + (p.totals.frasi || 0)
                                                : (p.totals.es || 0) + (p.totals.verbiEs || 0) + (p.totals.frasiEs || 0)
  const p = await finche(() => leggiProfilo(page), q => contatori(q) >= partita.giuste, 3000)
  controlla('le risposte finiscono nei contatori di sempre della lingua', contatori(p) >= partita.giuste, JSON.stringify(p.totals))
  if (L.chiave === 'spagnolo') {
    uguale('ed è davvero lo spagnolo', partita.lingua, 'es')
    uguale('le due lingue non si mescolano: l’inglese non si è mosso', (p.totals.en || 0) + (p.totals.verbi || 0), 0)
    controlla('le chiavi imparate sono tutte spagnole', Object.keys(p.items).every(k => /^(es:|verbo-es:|frase-es:)/.test(k)),
              Object.keys(p.items).filter(k => !/^(es:|verbo-es:|frase-es:)/.test(k)).join(', '))
  }
  uguale('la campagna vecchia resta finita', p[L.vecchia].libera, true)
  await indietro()
  await page.waitForSelector('[data-mappa-inglese]', { timeout: 5000 })
  uguale('indietro si torna alla mappa del tesoro, col gioco di prima in fondo', await page.locator('[data-prima]').count(), 1)
})

/* ══════════ 3. la partita lasciata a metà, nel libero dell'inglese; lo spagnolo ha la sua ══════════ */
const domanda = () => page.evaluate(() => {
  const t = window.__lingua.turno.value
  return t && JSON.stringify([t.chiave, t.tipo, t.opzioni.map(o => o.testo)])
})
const conto = () => page.evaluate(() => { const h = window.__lingua.hud; return `${h.giuste}/${h.errori}` })
const sostaDi = async chiave => ((await leggiProfilo(page)).campagne || {})[chiave]?.sosta || null

await allaHome(page)
await semina(page, { coins: 50, eng: { tappa: 13, libera: true }, esp: { tappa: 13, libera: true }, campagne: {}, settings: SPAGNOLO_ACCESO })
await blocco('inglese: il libero lasciato a metà', async () => {
  const entraLibero = async () => {
    await allaMappa(LINGUE.inglese)
    await page.waitForSelector('[data-prima]', { timeout: 5000 })
    await page.locator('[data-prima]').click()
  }
  const S = soste(page, { entra: entraLibero, chiave: 'inglese-prima', alla: '[data-mappa-inglese]' })
  await entraLibero()
  await page.waitForSelector('.scelte .scelta', { timeout: 5000 })
  uguale('senza una partita a metà si entra dritti nel gioco', await S.quanteCarte(), 0)
  const m0 = await S.monete()
  for (let i = 0; i < 3; i++) await rispondi(true)
  await rispondi(false)
  await rispondi(true)
  const lasciata = await domanda()
  const contoLasciato = await conto()
  const m1 = await S.monete()
  uguale('la prova parte da quattro giuste e uno sbaglio', contoLasciato, '4/1')
  controlla('le giuste hanno pagato', m1 > m0, `${m0} → ${m1}`)

  await S.esci()
  await page.locator('[data-prima]').click()
  const carta = await S.cartaDice()
  controlla('la carta dice dove si era', /✅ 4 giuste/.test(carta), carta)
  uguale('uscire non ha pagato né tolto niente', await S.monete(), m1)

  await S.riprendi()
  await page.waitForSelector('.scelte .scelta')
  uguale('si riprende con la stessa domanda, risposte comprese', await domanda(), lasciata)
  uguale('con gli stessi conti', await conto(), contoLasciato)
  uguale('la carta sparisce', await S.quanteCarte(), 0)
  uguale('rientrare non ha pagato niente', await S.monete(), m1)
  await rispondi(true)
  const m2 = await S.monete()
  controlla('una giusta in più conta una volta e paga una volta', m2 > m1 && (await conto()) === '5/1', `${m1} → ${m2}, ${await conto()}`)

  /* il telefono in tasca: la pagina sparisce, l'app si ricarica */
  const lasciata2 = await domanda()
  await S.ricarica(s => JSON.stringify(s || {}).includes('"giuste":5'))
  await S.cartaDice()
  await S.riprendi()
  await page.waitForSelector('.scelte .scelta')
  uguale('anche dopo aver ricaricato la domanda è quella', await domanda(), lasciata2)
  uguale('e i conti anche', await conto(), '5/1')
  uguale('e le monete', await S.monete(), m2)
  const p1 = await leggiProfilo(page)
  controlla('la sosta sta in una chiave sua, non in quella dei mondi',
            !!p1.campagne['inglese-prima'].sosta && !(p1.campagne.inglese && p1.campagne.inglese.sosta))
  controlla('e lo spagnolo non ne ha', !p1.campagne['spagnolo-prima'])

  /* «lascio perdere»: si parte da zero, e uscire a zero non lascia niente */
  await S.esci()
  await page.locator('[data-prima]').click()
  await S.cartaDice()
  await page.click('[data-ripresa] [data-azione="scorda"]')
  await page.waitForSelector('.scelte .scelta')
  uguale('«lascio perdere» comincia un libero nuovo', await conto(), '0/0')
  await S.esci()
  uguale('e non resta nessuna sosta', await S.sosta(s => !s), null)
  await page.locator('[data-prima]').click()
  await page.waitForSelector('.scelte .scelta')
  uguale('rientrando non c\'è nessuna carta', await S.quanteCarte(), 0)
})
await blocco('spagnolo: il libero ha la sua sosta, a parte', async () => {
  await allaMappa(LINGUE.spagnolo)
  await page.waitForSelector('[data-prima]')
  await page.locator('[data-prima]').click()
  await page.waitForSelector('.scelte .scelta')
  uguale('lo spagnolo non vede la sosta dell\'inglese', await page.locator('[data-ripresa]').count(), 0)
  await rispondi(true)
  await rispondi(true)
  await indietro()
  await page.waitForSelector('[data-mappa-inglese]')
  const s = await finche(() => sostaDi('spagnolo-prima'), x => !!x, 3000)
  controlla('la sosta spagnola è sua', !!s && s.lingua === 'es', JSON.stringify(s))
})

/* ══════════ 4. le tappe della campagna (#verbi) ══════════ */
await allaHome(page)
await semina(page, { eng: { tappa: 2, libera: false }, campagne: {} })
await blocco('inglese: le tappe della campagna (#verbi)', async () => {
  const S = soste(page, { entra: async () => {}, chiave: 'inglese-prima', alla: '.mappa' })
  await page.evaluate(() => { location.hash = 'verbi' })
  await page.waitForSelector('.mappa .tappa[data-tappa-lingua]')
  const tappa = i => page.locator(`.mappa [data-tappa-lingua="${i}"]`)
  uguale('senza una sosta la mappa non ha la carta', await S.quanteCarte(), 0)
  await tappa(0).click()
  await page.waitForSelector('.scelte .scelta')
  for (let i = 0; i < 3; i++) await rispondi(true)
  await rispondi(false)
  const t0 = await domanda(), c0 = await conto()
  const m3 = await S.monete()
  uguale('la prova parte da tre giuste e uno sbaglio', c0, '3/1')

  await S.esci()
  const carta = await S.cartaDice()
  controlla('la carta dice la tappa e il bersaglio', /Gli animali/.test(carta) && /✅ 3 di 12/.test(carta), carta)
  uguale('uscire non ha pagato niente', await S.monete(), m3)

  /* un'altra tappa non butta la sosta in silenzio */
  await S.chiede(() => tappa(1).click())
  uguale('una tappa nuova chiede prima', await page.locator('[data-chiede]').count(), 1)
  await page.click('[data-chiede] [data-azione="riprendi-invece"]')
  await page.waitForSelector('.scelte .scelta')
  uguale('«torno a quella di prima» riprende la prima', await domanda(), t0)
  uguale('con gli stessi conti', await conto(), c0)
  uguale('e senza pagare', await S.monete(), m3)

  await S.esci()
  await S.cartaDice()
  await S.chiede(() => tappa(1).click(), 'comincia')
  await page.waitForSelector('.scelte .scelta')
  uguale('scelta la nuova, si gioca quella da capo', await conto(), '0/0')

  /* una tappa vinta non lascia niente */
  for (let giri = 0; giri < 60 && await page.evaluate(() => window.__lingua.fase.value) === 'gioco'; giri++) await rispondi(true)
  await page.waitForSelector('[data-monete-prese]', { timeout: 6000 })
  await page.getByText('La mappa').click()
  await page.waitForSelector('.mappa')
  uguale('vinta la tappa, la carta non c\'è', await S.quanteCarte(), 0)
  uguale('e nessuna sosta resta nel profilo', await S.sosta(s => !s), null)
})

controlla('non si usa speechSynthesis', !(await page.evaluate(() => !!window.__sintesi)))
uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('le lingue — il gioco di prima, nel browser')
