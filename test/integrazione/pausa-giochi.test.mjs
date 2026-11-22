/* ═══════════════════════════════════════════════════════════════════
   LA PAUSA, COL DITO — gli asteroidi, Survivors e il sotterraneo
   perché: la pausa (`giochi/pausa.js`) montata su tre orologi diversi: il cielo degli asteroidi (e il `?` che lo ferma, e il cronometro della risposta che dietro il velo non conta nello SRS), la giostra a fotogrammi di Survivors e il giro di Gioco.vue del sotterraneo; il telefono posato (`visibilityState`) ferma e il ritorno non riprende
   a parte perché: ogni gioco ha qui il suo blocco; i soli altri file che aprono la pausa (le soste) provano l'uscita a metà, non che il tempo di gioco si fermi

   La stessa prova su orologi diversi, ognuno col suo testimone che si
   muove se la pausa non funziona (le `y` dei sassi, i secondi della
   marea, l'eroe che cammina).

   Il telefono posato si finge con `visibilityState`: la pagina resta
   davvero visibile, quindi gli orologi continuano a girare — se la pausa
   non funzionasse si vedrebbe muovere qualcosa. Con una scheda nascosta
   per davvero i giochi si fermerebbero da sé e il controllo non direbbe
   niente.

   L'orologio della pagina è quello finto di playwright (`clock.install`):
   scorre da sé, e per i cinque secondi di pausa del cronometro si porta
   avanti invece di aspettarli.

   `node test/esegui.mjs integrazione/pausa-giochi --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, attendi, scatto, scegli, parti, leggiProfilo,
         scendiNelSotterraneo, scegliAvventura } from '../aiuto/browser.mjs'
import { chiudiTraguardi } from '../aiuto/traguardi.mjs'
import { controlla, uguale, nota, riassunto, blocco } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await page.clock.install()
await azzera(page)

const veli = () => page.locator('[data-pausa]').count()
const pausaInBarra = () => page.locator('button[aria-label="pausa"]').count()
const bottoni = nome => page.locator(`button[aria-label="${nome}"]`)
const aCasa = async () => {
  await page.locator('button[aria-label="indietro"]').click()
  await attendi(page, 400)
}
/* Posare il telefono e riprenderlo. `bubbles: true` perché quello vero risale: chi ascolta sulla finestra lo sente solo così. */
const posa = () => page.evaluate(() => {
  Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
  document.dispatchEvent(new Event('visibilitychange', { bubbles: true }))
})
const riprendiIlTelefono = () => page.evaluate(() => {
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
  document.dispatchEvent(new Event('visibilitychange', { bubbles: true }))
})
/* il fantasma: il dito che ha premuto ⏸ si lascia dietro un click, che arriva a chi sta sotto in quel momento — cioè al velo
   appena nato, che si toglierebbe da solo */
const fantasma = () => page.evaluate(() => document.querySelector('[data-azione="riprendi"]')?.click())

/* ═══════════ 1. GLI ASTEROIDI — le `y` dei sassi sono il testimone ═══════════
   Le cose degli asteroidi: il `?` (c'era da sempre e non fermava niente: leggere la spiegazione costava le vite) e il
   cronometro della risposta, che misura da quando il sasso giusto è in scena (`prontaIl`) e finisce in `store/srs.js`. */
await blocco('asteroidi', async () => {
  // dove stanno i sassi, in una riga: la sola cosa che si muove a ogni fotogramma e che nessuno può muovere di nascosto
  const cielo = () => page.evaluate(() => window.__mate.asteroidi().filter(a => !a.morto).map(a => Math.round(a.y)).join(','))
  const cieloCambia = (da, ms = 4000) => page.waitForFunction(d => window.__mate.asteroidi().filter(a => !a.morto)
    .map(a => Math.round(a.y)).join(',') !== d, da, { timeout: ms }).then(() => true, () => false)

  await scegli(page, 'mate')
  await page.waitForSelector('[data-rotta]', { timeout: 5000 })
  uguale('asteroidi: sulla mappa non c\'è niente da fermare', await pausaInBarra(), 0)
  await parti(page, '[data-rotta] [data-tipo="pianeta"]')
  await page.waitForSelector('button[aria-label="pausa"]', { timeout: 5000 })
  uguale('in volo il ⏸ c\'è', await pausaInBarra(), 1)
  // la prima partita porta il cartello di un traguardo, che ferma il cielo come tutto il resto: lo si chiude come un bambino
  await chiudiTraguardi(page)
  controlla('e intanto i sassi scendono', await cieloCambia(await cielo()))

  /* il ⏸ ferma il cielo */
  await bottoni('pausa').click()
  uguale('il velo compare', await veli(), 1)
  await fantasma()
  uguale('il click che il dito si lascia dietro non la toglie', await veli(), 1)
  const fermi = await cielo()
  await attendi(page, 1200)
  uguale('e i sassi non scendono di un pixel', await cielo(), fermi)
  controlla('il velo dice dove si era', (await page.locator('[data-pausa]').textContent()).includes('tappa'))
  await scatto(page, 'pausa-asteroidi')
  /* otto secondi di pausa, portando avanti l'orologio: è quello che il cronometro, più avanti, non deve contare */
  await page.clock.fastForward(8000)
  await attendi(page, 200)
  uguale('nemmeno dopo otto secondi', await cielo(), fermi)

  /* si riprende al tocco */
  await page.locator('[data-azione="riprendi"]').click()
  uguale('il velo sparisce', await veli(), 0)
  controlla('e il cielo riparte', await cieloCambia(fermi))

  /* il cronometro della risposta sta fermo col cielo: si aspetta che il sasso giusto sia in scena (da lì parte il
     cronometro), si colpisce e si guarda `t`, il tempo che l'SRS ha registrato. La forbice è larga apposta: si separa
     un secondo da dieci, e il pavimento conta quanto il tetto (`t` assente è un sasso colpito prima di esserci) */
  await page.waitForFunction(() => window.__mate.asteroidi().some(a => a.ok && !a.morto && a.y > a.r + 20), null, { timeout: 8000 })
  const colpito = await page.evaluate(() => {
    const m = window.__mate, giusto = m.asteroidi().find(a => a.ok && !a.morto)
    if (!giusto) return null
    const chiave = m.domanda.chiave
    m.colpisci(giusto)
    return chiave
  })
  controlla('c\'era un sasso da colpire', !!colpito)
  const t = (await leggiProfilo(page)).items?.[colpito]?.t
  controlla('la pausa non finisce nel tempo di risposta', t > 0 && t < 6000, `${Math.round(t)} ms per ${colpito}`)
  nota(`otto secondi fermo e l'SRS ha segnato ${Math.round(t)} ms`)

  /* col foglio del testo aperto il cielo aspetta: il `?` accende la guida, e il foglio sta dietro il 📖 della sua riga.
     Non è una pausa e non mostra il velo (due veli uno sull'altro sono un gioco rotto), ma ferma la partita lo stesso */
  await bottoni('aiuto').click()
  await page.locator('[data-guida-regole]').click({ timeout: 5000 })
  await page.waitForSelector('[data-azione="chiudi-aiuto"]', { timeout: 5000 })
  uguale('il ? non mette un secondo velo', await veli(), 0)
  const letti = await cielo()
  await attendi(page, 1200)
  uguale('ma il cielo aspetta lo stesso', await cielo(), letti)
  await page.locator('[data-azione="chiudi-aiuto"]').click()
  await page.locator('[data-guida-spegni]').click()   // la guida richiamata si spegne: il resto della prova non la cerca
  controlla('e chiuso il foglio si riparte', await cieloCambia(letti))

  /* il telefono posato */
  await posa()
  uguale('posare il telefono mette in pausa', await veli(), 1)
  const posati = await cielo()
  await riprendiIlTelefono()
  await attendi(page, 800)
  uguale('riaprendo il telefono il volo NON riparte da solo', await veli(), 1)
  uguale('e nemmeno di un pixel', await cielo(), posati)

  /* uscire non lascia niente acceso */
  await page.locator('[data-azione="riprendi"]').click()
  await bottoni('indietro').click()
  await page.waitForSelector('[data-rotta]', { timeout: 5000 })
  await posa()
  uguale('sulla mappa il velo non compare', await veli(), 0)
  await riprendiIlTelefono()
  // la partita lasciata a metà è in cima alla mappa (docs/asteroidi/sosta.md): qui si vuole una tappa nuova
  await page.click('[data-ripresa] [data-azione="scorda"]')
  await parti(page, '[data-rotta] [data-tipo="pianeta"]')
  await page.waitForSelector('button[aria-label="pausa"]', { timeout: 5000 })
  uguale('e la tappa nuova non nasce in pausa', await veli(), 0)
  controlla('si vola da subito', await cieloCambia(await cielo(), 1500))
  await page.locator('button[aria-label="indietro"]').click()
  await page.waitForSelector('[data-rotta]', { timeout: 5000 })
  await aCasa()
})

/* i due giochi si tengono in casa a mano: il test non deve dipendere da quale fascia d'età li offra oggi, né da quali siano
   ancora in prova */
await semina(page, { settings: { eta: 9, sperimentali: true, giochi: { survivors: true, sotterraneo: true } } })

/* ═══════════ 2. SURVIVORS — l'orologio del cruscotto è il testimone ═══════════ */
await blocco('survivors', async () => {
  const secondi = async () => {
    const [m, s] = (await page.locator('.sv-gettone').first().textContent()).replace(/\D+/, '').split(':')
    return Number(m) * 60 + Number(s)
  }
  const scendeSotto = (n, ms = 4000) => page.waitForFunction(n => {
    const [m, s] = document.querySelector('.sv-gettone').textContent.replace(/\D+/, '').split(':')
    return Number(m) * 60 + Number(s) < n
  }, n, { timeout: ms }).then(() => true, () => false)

  await scegli(page, 'survivors')
  await page.waitForSelector('.sv-mappa', { timeout: 5000 })
  uguale('survivors: sulla mappa non c\'è niente da fermare', await pausaInBarra(), 0)
  await page.locator('.sv-tappa[data-tappa="0"]').click()
  await page.waitForSelector('.sv-tela', { timeout: 5000 })
  uguale('in campo il ⏸ c\'è', await pausaInBarra(), 1)
  const svIniziali = await secondi()
  controlla('e intanto l\'orologio scende', await scendeSotto(svIniziali), `all'ingresso ${svIniziali}s, e non scende`)

  await page.locator('button[aria-label="pausa"]').click()
  uguale('il velo compare', await veli(), 1)
  await fantasma()
  uguale('il click che il dito si lascia dietro non la toglie', await veli(), 1)
  controlla('la pausa dice dove si era', (await page.locator('[data-pausa]').textContent()).includes('livello'))
  await scatto(page, 'pausa-survivors')
  /* il numero si legge dopo che il cruscotto si è riallineato (si rinfresca ogni 0,2 s) */
  await attendi(page, 300)
  const svFermi = await secondi()
  await attendi(page, 1300)
  uguale('e la marea sta ferma', await secondi(), svFermi)
  /* nemmeno con le frecce: sotto il velo il campo non si muove (il cartello di una partita ripresa stava dentro il campo,
     e bastava una freccia a mandarlo via) */
  await page.keyboard.down('ArrowRight')
  await attendi(page, 600)
  await page.keyboard.up('ArrowRight')
  uguale('nemmeno muovendosi sotto il velo', await secondi(), svFermi)

  await page.locator('[data-azione="riprendi"]').click()
  uguale('il velo sparisce al tocco', await veli(), 0)
  controlla('e la partita riparte', await scendeSotto(svFermi), `ferma a ${svFermi}s`)

  /* il telefono posato ferma, e il ritorno NON riprende */
  await posa()
  uguale('posare il telefono mette in pausa', await veli(), 1)
  await riprendiIlTelefono()
  await attendi(page, 600)
  uguale('riaprendolo la partita NON riparte da sola', await veli(), 1)
  await page.locator('[data-azione="riprendi"]').click()
  uguale('si riparte solo toccando', await veli(), 0)
  await aCasa()                        // alla mappa
  await aCasa()                        // in home
})

/* ═══════════ 3. IL SOTTERRANEO — l'eroe che cammina è il testimone ═══════════
   Il motore gira sul `requestAnimationFrame` di Gioco.vue (`giro`), e quello la pausa ferma. La scena 3D disegna di continuo
   anche dietro il velo, e i suoi pixel non si rileggono: quello che la pausa ferma davvero è il tempo di gioco. Si manda
   l'eroe a camminare (un tocco lontano dalla scala che sale sotto di lui) e si guarda dov'è, a pausa e fuori. */
await blocco('sotterraneo', async () => {
  const eroePos = () => page.evaluate(() => { const e = window.__sotterraneo3d.corsa.eroe; return `${e.x.toFixed(3)},${e.y.toFixed(3)}` })
  await scegli(page, 'sotterraneo')
  await scegliAvventura(page, 'cavaliere')   // la prima volta si sceglie chi scende
  uguale('sotterraneo: sul mondo di sopra non c\'è niente da fermare', await pausaInBarra(), 0)
  await scendiNelSotterraneo(page, 0)
  await page.waitForSelector('[data-tela="3d"]', { timeout: 15000 })
  await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.grafica().figure > 0, null, { timeout: 30000 })
  uguale('nella discesa il ⏸ c\'è', await pausaInBarra(), 1)

  /* L'eroe va a spasso lungo una strada libera (un tocco a caso può finire su una porta o addosso a un mostro, e si apre
     un foglio). La telecamera morbida arriva all'eroe: il tocco aspetta che il punto da toccare stia fermo sullo schermo */
  const cdp = await page.context().newCDPSession(page)
  const [ex, ey] = (await page.locator('[data-tela="3d"]').getAttribute('data-eroe')).split(',').map(Number)
  const versi = await page.evaluate(([x, y]) => {
    const b = window.__sotterraneo3d.corsa.buona()
    return [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => { let k = 0; while (k < 6 && b(x + dx * (k + 1), y + dy * (k + 1))) k++; return { dx, dy, k } }).sort((a, c) => c.k - a.k)
  }, [ex, ey])
  controlla('c\'è una strada libera di almeno quattro celle', versi[0].k >= 4, JSON.stringify(versi))
  const { dx, dy, k } = versi[0]
  const meta = [ex + dx * k + 0.5, ey + dy * k + 0.5]
  let punto = null
  for (let i = 0; i < 40; i++) {
    const ora = await page.evaluate(([a, b]) => window.__sotterraneo3d.aSchermo(a, 0.05, b), meta)
    if (punto && Math.abs(ora[0] - punto[0]) < 0.5 && Math.abs(ora[1] - punto[1]) < 0.5) break
    punto = ora
    await attendi(page, 150)
  }
  const box = await page.locator('[data-tela="3d"]').boundingBox()
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + punto[0], y: box.y + punto[1] }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  const sotPrima = await eroePos()
  // l'eroe è partito: la pausa si preme mentre cammina, a metà strada
  await page.waitForFunction(p => { const e = window.__sotterraneo3d.corsa.eroe; return `${e.x.toFixed(3)},${e.y.toFixed(3)}` !== p }, sotPrima, { timeout: 15000 })
  controlla('e intanto l\'eroe cammina', await eroePos() !== sotPrima, sotPrima)

  await page.locator('button[aria-label="pausa"]').click()
  uguale('il velo compare', await veli(), 1)
  controlla('e dice a che piano si era', (await page.locator('[data-pausa]').textContent()).includes('piano 1'))
  await scatto(page, 'pausa-sotterraneo')
  await attendi(page, 300)
  const sotFermo = await eroePos()
  controlla('la pausa è arrivata a metà strada: all\'eroe resta strada da fare',
            await page.evaluate(() => { const c = window.__sotterraneo3d.corsa; return !!(c.strada && c.strada.length) }))
  await attendi(page, 1000)
  uguale('e l\'eroe non si muove di un millimetro', await eroePos(), sotFermo)

  await page.locator('[data-azione="riprendi"]').click()
  uguale('il velo sparisce al tocco', await veli(), 0)
  controlla('e la discesa riparte', await page.waitForFunction(p => { const e = window.__sotterraneo3d.corsa.eroe; return `${e.x.toFixed(3)},${e.y.toFixed(3)}` !== p },
                                                               sotFermo, { timeout: 4000 }).then(() => true, () => false), sotFermo)

  await posa()
  uguale('posare il telefono mette in pausa', await veli(), 1)
  await riprendiIlTelefono()
  await attendi(page, 600)
  uguale('riaprendolo la discesa NON riparte da sola', await veli(), 1)
  await page.locator('[data-azione="riprendi"]').click()
  uguale('si riparte solo toccando', await veli(), 0)
  await aCasa()                        // in home: la ✕ dalla discesa non passa dal mondo di sopra
  uguale('uscendo dal sotterraneo si è in casa', await page.locator('.carte').count() > 0, true)
})

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('la pausa negli asteroidi, in Survivors e nel sotterraneo')
