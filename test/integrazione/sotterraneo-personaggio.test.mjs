/* ═══════════════════════════════════════════════════════════════════
   IL PERSONAGGIO, MASCHIO O FEMMINA, COL DITO — docs/sotterraneo/personaggio.md

   Scegliere un eroe non passa da nessun passo in più: il sesso di partenza
   è quello della persona del profilo. L'editor si apre dalla ✎ della
   scelta delle avventure o dalla pagina dell'eroe, e toccare un modello
   scrive subito il sesso nell'avventura di quell'eroe (gratis): il nome
   nella pagina dell'eroe cambia, i numeri no.
   `node test/esegui.mjs sotterraneo-personaggio`
   tempo: 120
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scegli, leggiProfilo, mondoPronto, attendi, scatto } from '../aiuto/browser.mjs'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, { coins: 300, settings: { sperimentali: true }, campagne: { sotterraneo: { tappa: 0, libera: false, stelle: {} } } })
await scegli(page, 'sotterraneo')
await page.waitForSelector('.sot-eroe[data-eroe]', { timeout: 30000 })

await attendi(page, 1500)
await scatto(page, 'personaggio-1-scelta')
// 1. la ✎ apre l'editor senza scegliere l'eroe, e senza scrivere niente finché non si tocca
await page.locator('[data-personaggio-di="mago"]').click()
await page.waitForSelector('[data-editor-personaggio]', { timeout: 3000 })
uguale('l\'editor è quello del mago', await page.locator('[data-editor-personaggio]').getAttribute('data-eroe-editor'), 'mago')
// il profilo di prova ha la persona di serie (la bambina): l'editor parte dalla femmina
uguale('parte da come è la persona del profilo', await page.locator('[data-editor-personaggio]').getAttribute('data-sesso-scelto'), 'f')
await attendi(page, 1500)
await scatto(page, 'personaggio-2-editor-mago')
uguale('i due modelli ci sono', await page.locator('[data-sesso]').count(), 2)
let prima = await leggiProfilo(page)
controlla('aprirlo non scrive niente', !(((prima.campagne || {}).sotterraneo || {}).cfg || {}).avventure)
const ed = '[data-editor-personaggio]'
stessaLista('le schede: chi sei, aspetto, set', await page.locator(`${ed} [data-prs-scheda]`).evaluateAll(l => l.map(b => b.dataset.prsScheda)), ['chi', 'aspetto', 'set'])
// la ✕ in alto a destra, e le zone nell'ordine delle dipendenze: anteprima, schede, griglia, pannello, fondo
const rett = sel => page.locator(`${ed} ${sel}`).first().evaluate(e => { const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, d: b.right, g: b.bottom } })
const x = await rett('[data-chiudi]'), larga = await page.evaluate(() => innerWidth)
controlla('la ✕ sta in alto a destra', x.y < 80 && larga - x.d < 40, JSON.stringify(x))
const zoneY = []
for (const z of ['anteprima', 'schede', 'griglia', 'pannello', 'fondo']) zoneY.push((await rett(`[data-prs="${z}"]`)).y)
controlla('le zone vanno dall\'alto in basso: anteprima, schede, griglia, pannello, fondo', zoneY.every((y, i) => !i || y > zoneY[i - 1]), zoneY.join(' '))

// l'eroe grande si gira: con le frecce, e trascinando il dito sull'anteprima (la pagina non scorre)
const giro = () => page.locator(`${ed} [data-prs="giro"]`).getAttribute('data-giro')
await page.locator(`${ed} [data-prs="gira-dx"]`).click()
uguale('la freccia a destra gira di uno scatto', await giro(), '7')
await page.locator(`${ed} [data-prs="gira-sx"]`).click()
uguale('e quella a sinistra lo rimette', await giro(), '0')
const a = await rett('[data-prs="anteprima"]')
await page.mouse.move(a.x + 60, (a.y + a.g) / 2); await page.mouse.down(); await page.mouse.move(a.x + 160, (a.y + a.g) / 2, { steps: 8 }); await page.mouse.up()
controlla('trascinando gira di più scatti', !['0', null].includes(await giro()), await giro())
uguale('e il foglio non si è spostato', (await rett('[data-chiudi]')).y, x.y)
await attendi(page, 600)
await scatto(page, 'personaggio-2b-girato')

// 2. chi sei: toccare la maga la sceglie e la scrive
await page.locator('[data-sesso="m"]').click()
await attendi(page, 300)
await page.locator('[data-sesso="f"]').click()
await attendi(page, 1500)
await scatto(page, 'editor-personaggio')
uguale('il sesso scelto è femmina', await page.locator(ed).getAttribute('data-sesso-scelto'), 'f')
let p = await leggiProfilo(page)
uguale('e sta nel salvataggio, nell\'avventura del mago', p.campagne.sotterraneo.cfg.avventure.mago.sesso, 'f')
controlla('il nome è cambiato nella scheda', (await page.locator('[data-sesso="f"]').innerText()).includes('Maga'))

// l'aspetto: la griglia (pelle, capelli, barba) e sotto il pannello; un tocco nel pannello non sposta niente sopra di lui
await page.locator(`${ed} [data-prs-scheda="aspetto"]`).click()
const sopra = () => page.locator(`${ed} [data-prs-scheda], ${ed} [data-prs-voce]`).evaluateAll(l => l.map(e => { const b = e.getBoundingClientRect(); return `${e.dataset.prsScheda || e.dataset.prsVoce}@${Math.round(b.left)},${Math.round(b.top)}` }).join(' '))
const pannello = () => rett('[data-prs="pannello"]')
const fermo = async (cosa, fai) => {
  const s0 = await sopra(), p0 = await pannello()
  await fai()
  await attendi(page, 200)
  uguale(`${cosa}: le schede e la griglia restano dove sono`, await sopra(), s0)
  uguale(`${cosa}: il pannello non cambia altezza`, JSON.stringify(await pannello()), JSON.stringify(p0))
}
await fermo('la pelle ambra', () => page.locator('[data-pelle="ambra"]').click())
await fermo('aprire i capelli', () => page.locator(`${ed} [data-prs-voce="capelli"]`).click())
const formeY = () => page.locator(`${ed} [data-prs-forma]`).evaluateAll(l => l.map(e => Math.round(e.getBoundingClientRect().top)).join(' '))
const f0 = await formeY()
await fermo('il colore blu', () => page.locator('[data-capelli="blu"]').click())
uguale('il colore non sposta le forme sopra di lui', await formeY(), f0)
await fermo('il taglio a coda', () => page.locator('[data-taglio="coda"]').click())
await attendi(page, 1500)
await scatto(page, 'personaggio-3-colori')
p = await leggiProfilo(page)
uguale('la pelle scelta sta nell\'avventura', p.campagne.sotterraneo.cfg.avventure.mago.aspetto.pelle, 'ambra')
uguale('e i capelli', p.campagne.sotterraneo.cfg.avventure.mago.aspetto.capelli, 'blu')
uguale('il taglio sta nell\'avventura', p.campagne.sotterraneo.cfg.avventure.mago.aspetto.taglio, 'coda')
uguale('la tinta scelta è segnata', await page.locator('[data-capelli="blu"][aria-pressed="true"]').count(), 1)
await fermo('aprire la barba', () => page.locator(`${ed} [data-prs-voce="barba"]`).click())
await fermo('il pizzetto', () => page.locator('[data-barba="pizzetto"]').click())
await attendi(page, 1500)
await scatto(page, 'personaggio-3b-taglio-barba')
p = await leggiProfilo(page)
uguale('e la barba', p.campagne.sotterraneo.cfg.avventure.mago.aspetto.barba, 'pizzetto')
await page.locator(`${ed} [data-prs-voce="capelli"]`).click()
await page.locator('[data-capelli="-"]').click()
await attendi(page, 300)
p = await leggiProfilo(page)
uguale('«Di serie» rimette i capelli del modello', p.campagne.sotterraneo.cfg.avventure.mago.aspetto.capelli, null)

// 3. i set: si salva quello che si ha addosso, con un nome, e ci si ricambia con un tocco
await page.locator(`${ed} [data-prs-scheda="set"]`).click()
uguale('sei posti per i miei set', await page.locator(`${ed} [data-prs-set-mio]`).count(), 6)
await page.locator(`${ed} [data-prs="salva-set"]`).click()
uguale('il nome è già scritto', await page.locator(`${ed} [data-prs="nome"]`).inputValue(), 'Il mio set 1')
await page.locator(`${ed} [data-prs="nome"]`).fill('Festa')
await page.locator(`${ed} [data-prs="nome-ok"]`).click()
await attendi(page, 300)
p = await leggiProfilo(page)
uguale('il set sta nell\'avventura, col suo nome', JSON.stringify(p.campagne.sotterraneo.cfg.avventure.mago.vestiti.map(v => [v.posto, v.nome, v.aspetto.pelle])), JSON.stringify([[0, 'Festa', 'ambra']]))
await page.locator(`${ed} [data-prs-scheda="aspetto"]`).click()
await page.locator(`${ed} [data-prs-voce="pelle"]`).click()
await page.locator('[data-pelle="scura"]').click()
await page.locator(`${ed} [data-prs-scheda="set"]`).click()
await page.locator(`${ed} [data-prs-set-mio="0"]`).click()
await attendi(page, 300)
p = await leggiProfilo(page)
uguale('toccare il set lo rimette', p.campagne.sotterraneo.cfg.avventure.mago.aspetto.pelle, 'ambra')
await attendi(page, 1200)
await scatto(page, 'personaggio-3c-set')
await page.locator(`${ed} [data-chiudi]`).click()
// scelto l'eroe, si parte subito (niente passi in più) e la maga resta maga
await page.locator('.sot-eroe[data-eroe="mago"]').click()
await mondoPronto(page)

// 3. la pagina dell'eroe dice «Maga» e offre l'editor
await page.locator('[data-azione="eroe-pagina"]').click()
await page.waitForSelector('[data-pagina-eroe] [data-azione="personaggio"]', { timeout: 3000 })
await attendi(page, 800)
await scatto(page, 'personaggio-4-pagina-eroe')
controlla('la pagina parla della maga', (await page.locator('[data-pagina-eroe] [data-azione="personaggio"]').getAttribute('aria-label')).includes('la maga'))
// passando da una scheda all'altra la finestra non si chiude e non si riapre: dal tocco in poi la cornice c'è a ogni fotogramma e non si
// rianima (niente lampeggio). Si campiona nello stesso tocco, con un tocco vero: un click di Playwright arriva dopo ~2 s e non dice niente
await attendi(page, 800)   // l'apertura della pagina dell'eroe finisce la sua animazione
for (const [da, a] of [['eroe', 'zaino'], ['zaino', 'abilita'], ['abilita', 'eroe']]) {
  await page.evaluate(sel => {
    window.__vuoti = 0; window.__info = null
    const b = document.querySelector(sel)
    b.addEventListener('click', () => {
      const t0 = performance.now()
      const f = () => {
        const c = document.querySelector('.sot-cornice'), v = document.querySelector('.sot-sipario')
        if (!c) { window.__vuoti++; window.__info = 'senza cornice' }
        else if (document.getAnimations().some(x => x.playState === 'running' && x.effect && x.effect.target && x.effect.target.matches('.sot-cornice, .sot-sipario') && x.effect.getComputedTiming().activeDuration > 0)) { window.__vuoti++; window.__info = 'la cornice si rianima' }
        if (performance.now() - t0 < 800) requestAnimationFrame(f)
      }
      requestAnimationFrame(f)
    }, { once: true })
  }, `[data-scheda="${a}"]`)
  await page.locator(`[data-scheda="${a}"]`).click()
  await attendi(page, 1000)
  uguale(`da ${da} a ${a}: la finestra resta aperta e ferma a ogni fotogramma (né sparisce né si rianima)`, await page.evaluate(() => window.__vuoti), 0)
}
await page.waitForSelector('[data-pagina-eroe] [data-azione="personaggio"]', { timeout: 3000 })
await page.locator('[data-pagina-eroe] [data-azione="personaggio"]').click()
await page.waitForSelector('[data-editor-personaggio]', { timeout: 3000 })
uguale('lo stesso editor, già femmina', await page.locator('[data-editor-personaggio]').getAttribute('data-sesso-scelto'), 'f')
await page.locator('[data-sesso="m"]').click()
await attendi(page, 300)
p = await leggiProfilo(page)
uguale('si può ripensarci, gratis', p.campagne.sotterraneo.cfg.avventure.mago.sesso, 'm')
uguale('e le monete non si sono mosse', p.coins, 300)
await page.locator('[data-editor-personaggio] [data-chiudi]').click()

controlla('nessun errore in pagina', errori.length === 0, errori.join(' | '))
await browser.close()
riassunto('il personaggio, maschio o femmina, col dito')
