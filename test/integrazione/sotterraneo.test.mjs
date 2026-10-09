/* ═══════════════════════════════════════════════════════════════════
   IL SOTTERRANEO, TOCCATO COL DITO

   Il test unitario gioca le sette discese e conta le domande; questo dice
   che **il dito ci arriva**: che la carta compaia in home coi giochi in
   prova accesi, che il campo si disegni davvero (un canvas nero non dà
   nessun errore e sembra a posto in ogni altro controllo), che un tocco
   faccia camminare, e che il foglio dello zaino salga e scenda.

   I tocchi si mandano **come tocchi** (`Input.dispatchTouchEvent` via
   CDP) e non con `page.click()`: alzato il dito il browser manda anche
   un `click`, e lo manda a chi sta sotto il dito in quel momento — cioè
   al foglio appena aperto, che si prenderebbe il tocco su un tasto che
   nessuno ha premuto. Col mouse non succede, ed è il motivo per cui
   quel guasto si vede solo dal telefono.

   Quello che qui **non** si prova è il foglio che si apre toccando una
   cosa nel campo: dov'è quella cosa a schermo lo sa solo il gioco, e un
   tocco a caso che a volte la prende e a volte no sarebbe un test che
   racconta storie diverse. Quel pezzo lo copre `unita/sotterraneo`, che
   tocca le cose per riferimento invece che per coordinate.
   `node test/esegui.mjs sotterraneo`
   tempo: 60
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, scendiNelSotterraneo, lasciaLaDiscesa, leggiProfilo }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

await semina(page, { coins: 300, settings: { sperimentali: true } })


/* ---------- 1. la carta, e le sette discese ---------- */
const carta = page.locator('.carta.gioco[data-gioco="sotterraneo"]')
controlla('la carta è in home coi giochi in prova accesi', await carta.count() === 1)
await scegli(page, 'sotterraneo')
await page.waitForSelector('.sot-tappe', { timeout: 5000 })

/* ---------- 1b. chi scende ----------
   La prima volta la scelta si presenta da sé: entrare in un gioco di
   ruolo senza sapere chi si è non ha senso, e un tasto «cambio eroe»
   che nessuno preme mai sarebbe una porta che non si apre. */
uguale('al primo ingresso si sceglie chi scende',
       await page.locator('[data-eroe]').count(), 4)
uguale('e sono quattro avventure nuove', await page.locator('.sot-eroe[data-nuova="1"]').count(), 4)
await page.locator('[data-eroe="cavaliere"]').click()
await attendi(page, 300)
uguale('scelto, la scelta sparisce', await page.locator('[data-eroe]').count(), 0)
await page.locator('[data-azione="eroe-pagina"]').click()
await page.waitForSelector('[data-pagina-eroe]', { timeout: 3000 })
controlla('e la pagina dell\'eroe dice con chi si scende',
          (await page.locator('[data-pagina-eroe] .sot-eroe-nome b').textContent()).includes('Cavaliere'))
await page.locator('[data-pagina-eroe] [data-chiudi]').click()
await page.waitForFunction(() => !document.querySelector('[data-pagina-eroe]'), null, { timeout: 3000 })
/* le discese stanno sulla terra di sopra (docs/sotterraneo/terra-di-sopra.md):
   si arriva a piedi, e lì la prova col dito vero è `integrazione/sotterraneo-terra` */
uguale('ci sono sette discese sulla mappa', await page.locator('[data-discesa]').count(), 7)
controlla('solo la prima è aperta',
          await page.locator('[data-discesa][data-aperta="1"]').count() === 1)

await scendiNelSotterraneo(page, 0)
await page.waitForSelector('.sot-tela', { timeout: 5000 })
await attendi(page, 600)

/* ---------- 2. il campo si disegna ----------
   Un canvas nero non dà nessun errore: si contano i pixel accesi, che è
   l'unico modo di accorgersi che «funziona» ma non si vede niente. */
const acceso = await page.evaluate(() => {
  const c = document.querySelector('.sot-tela')
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
  let n = 0
  for (let i = 0; i < d.length; i += 160) if (d[i] > 24 || d[i + 1] > 24) n++
  return n
})
controlla('il sotterraneo si vede, non è tutto nero', acceso > 200, `${acceso} campioni accesi`)
controlla('e la fascia dice a che piano si è',
          (await page.locator('.sot-piede').textContent()).includes('piano 1'))
await scatto(page, 'sotterraneo-campo')

/* ---------- 3. un tocco fa camminare ---------- */
const cdp = await page.context().newCDPSession(page)
const box = await page.locator('.sot-tela').boundingBox()
async function tocca(x, y) {
  const punti = [{ x, y }]
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: punti })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}

/* Attorno all'eroe, e da più parti: un tocco solo può cadere sulla
   roccia — di là non si passa, e non si è mosso niente senza che niente
   sia rotto. Si prova in quattro versi e basta che uno lo sposti, che è
   quello che farebbe anche un bambino.

   Dov'è l'eroe lo dice la tela (`data-eroe-schermo`, e la cella in
   `data-eroe`), e non il centro dei pixel: il piano nasce a caso, e con
   la stanza di partenza in cima alla mappa la telecamera si ferma sul
   bordo e l'eroe non sta al centro — i tocchi attorno al centro cadevano
   sul buio, e la prova passava o no secondo il seme. E lo spostamento si
   legge dalla cella, non dai pixel, che le torce fanno tremare anche con
   l'eroe fermo. */
const tela = page.locator('.sot-tela')
const cellaEroe = () => tela.getAttribute('data-eroe')
const prima = await cellaEroe()
controlla('la tela dice dov\'è l\'eroe', !!prima && !!(await tela.getAttribute('data-eroe-schermo')))
let mosso = false
for (const [dx, dy] of [[0, -70], [70, 0], [0, 70], [-70, 0]]) {
  const [ex, ey] = (await tela.getAttribute('data-eroe-schermo')).split(',').map(Number)
  await tocca(box.x + ex + dx, box.y + ey + dy)
  await attendi(page, 800)
  if (await cellaEroe() !== prima) { mosso = true; break }
}
controlla('dopo un tocco l\'eroe si è mosso', mosso, `sempre in ${prima}`)

/* ---------- 4. lo zaino si apre in mezzo, e si chiude ----------
   In mezzo e non in fondo: mentre è aperto il gioco sta fermo, e un
   pannello incollato al bordo di sotto non lo dice — si continua a
   toccare il campo senza capire perché non si va da nessuna parte. */
await page.locator('[data-azione="zaino"]').click()
await page.waitForSelector('[data-zaino]', { timeout: 3000 })
uguale('lo zaino ha sei tasche', await page.locator('[data-zaino] [data-tasca]').count(), 6)
uguale('e quattro caselle addosso: le due mani, il corpo, il dito',
       await page.locator('[data-casella]').count(), 4)
uguale('e non è il foglio che sale dal basso',
       await page.locator('.sot-foglio').count(), 0)
await page.locator('[data-azione="chiudi"]').click()
await attendi(page, 300)
uguale('e si richiude', await page.locator('[data-zaino]').count(), 0)

/* ---------- 5. si esce a metà, e la discesa resta lì ----------
   La cosa che rende giocabile una discesa da venti minuti: si chiude e
   si riprende. Il giro si prova **dall'archivio vero** — si esce, si
   rientra, si riprende — perché il salvataggio passa dal profilo e il test
   unitario quel pezzo non lo tocca. Uscire con la ✕ non è un portale
   (docs/sotterraneo/portale-e-sosta.md): si va in home, e rientrando si è già giù
   nel punto esatto, senza la terra di sopra, i mercanti o un gemello. */
const dovEro = await cellaEroe()
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('.carte', { timeout: 5000 })
uguale('la ✕ dalla discesa porta in home, non sulla terra di sopra', await page.locator('[data-terra]').count(), 0)
await attendi(page, 300)
let p = await leggiProfilo(page)
let sosta = p?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.sosta
uguale('la discesa è nella sosta, lasciata con un\'uscita', sosta?.via, 'uscita')
uguale('al piano 1', sosta?.piano, 0)
uguale('e dov\'era l\'eroe', `${Math.floor(sosta?.dove?.x)},${Math.floor(sosta?.dove?.y)}`, dovEro)

/* ---------- 6. rientrando si è già giù ----------
   Tornando dalla terra di sopra il `v-if` smonta il campo, quindi la
   discesa dopo trova **un altro canvas**: un pittore rimasto agganciato al
   primo continuava a dipingere su una tela staccata dal DOM. Niente
   errori, niente di rotto in nessun altro controllo — solo lo schermo
   nero, e solo dalla seconda in poi. Per questo il conto dei pixel si
   rifà invece di darlo per buono al primo giro. */
await scegli(page, 'sotterraneo')
await page.waitForSelector('.sot-tela', { timeout: 5000 })
uguale('rientrando nel sotterraneo si è giù, senza passare dalla terra di sopra', await page.locator('[data-terra]').count(), 0)
uguale('non c\'è nessuna carta da toccare', await page.locator('[data-ripresa]').count(), 0)
uguale('e non c\'è nessun gemello', await page.locator('[data-portale]').count(), 0)
await page.waitForSelector('[data-pausa]', { timeout: 3000 })
controlla('si nasce fermi, dietro il velo della pausa (docs/core/ripresa.md)', await page.locator('[data-pausa]').count() === 1)
controlla('che dice a che piano si è', (await page.locator('[data-pausa]').textContent()).includes('piano 1'))
uguale('nel punto esatto', await cellaEroe(), dovEro)
await attendi(page, 400)
await page.locator('[data-pausa] [data-azione="riprendi"]').click()
await attendi(page, 600)
const ancora = await page.evaluate(() => {
  const c = document.querySelector('.sot-tela')
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
  let n = 0
  for (let i = 0; i < d.length; i += 160) if (d[i] > 24 || d[i + 1] > 24) n++
  return n
})
controlla('anche la discesa ripresa si vede', ancora > 200, `${ancora} campioni accesi`)

/* ---------- 7. e si può anche lasciar perdere ----------
   Dal velo della pausa, con un foglio che dice prima cosa resta (la roba)
   e cosa no (la discesa ricomincia da capo). Si risale sulla terra di sopra. */
await page.click('button[aria-label="pausa"]')
await page.waitForSelector('[data-pausa] [data-azione="lascia-discesa"]', { timeout: 3000 })
await attendi(page, 400)
await page.click('[data-azione="lascia-discesa"]')
await page.waitForSelector('[data-lascio-perdere]', { timeout: 3000 })
const frase = await page.locator('[data-lascio-perdere]').textContent()
controlla('il foglio dice che la roba resta', /resta tutto tuo/.test(frase), frase)
controlla('e che la discesa ricomincia da capo', /ricomincia da capo/.test(frase), frase)
await page.click('[data-lascio-perdere] [data-azione="scorda-no"]')
await attendi(page, 200)
uguale('«no, tengo la discesa»: si resta in pausa, giù', await page.locator('[data-pausa]').count(), 1)
await page.click('[data-azione="lascia-discesa"]')
await page.click('[data-lascio-perdere] [data-azione="scorda-si"]')
await page.waitForSelector('[data-terra]', { timeout: 5000 })
await attendi(page, 300)
uguale('lasciata perdere, sulla terra di sopra non c\'è la carta', await page.locator('[data-ripresa]').count(), 0)
uguale('né il gemello', await page.locator('[data-portale]').count(), 0)
p = await leggiProfilo(page)
uguale('e la sosta non c\'è più', p?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.sosta, undefined)
await scendiNelSotterraneo(page, 0)
await page.waitForSelector('.sot-tela', { timeout: 5000 })
controlla('e si ricomincia senza che nessuno chieda niente',
          await page.locator('.sot-velo').count() === 0)

/* ---------- 8. la luce che resta si vede ----------
   La torcia si consuma, quindi il buio che torna deve vedersi arrivare:
   nella scena (il buio che si stringe), con una riga agli sgoccioli, e
   per esteso nello zaino, che è dove si va a guardare *quante ne ho*. La
   barra in basso non ha più il globo della luce né la casella delle
   torce (l'utente, 8 ottobre: «la fiamma che indica le torce la
   toglierei»): il globo di destra è l'esperienza. Si passa dal cheat di
   casa (`#sotterraneo=roba`), che scende con una accesa e una alla
   cintura. */
await lasciaLaDiscesa(page)
await page.evaluate(() => { location.hash = 'sotterraneo=roba' })
await scendiNelSotterraneo(page, 0)
await page.waitForSelector('.sot-tela', { timeout: 5000 })
await attendi(page, 400)

uguale('la barra in basso non ha il globo della luce', await page.locator('[data-globo="luce"]').count(), 0)
uguale('né la casella delle torce', await page.locator('[data-casella-barra="torcia"]').count(), 0)
uguale('il globo di destra è l\'esperienza', await page.locator('[data-globo="esperienza"]').count(), 1)

await page.locator('[data-azione="zaino"]').click()
await page.waitForSelector('[data-zaino]', { timeout: 3000 })
const riga = await page.locator('[data-torcia-zaino]').textContent()
controlla('e lo zaino lo dice per esteso', /stanze/.test(riga) && /cintura/.test(riga), riga)
await page.locator('[data-azione="chiudi"]').click()
await attendi(page, 300)

uguale('nessun errore in console', errori.join(' · '), '')
nota('il tocco che apre un foglio dal campo lo prova unita/sotterraneo')

await browser.close()
riassunto('il sotterraneo col dito')
