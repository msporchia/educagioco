/* Il giro del mondo della bancarella, col dito vero: il tocco su una città
   apre subito il fumetto e intanto l'aereo ci va — gira sul posto se deve
   cambiare verso, vola su un arco e arriva girato com'era, senza rigirarsi —;
   una città chiusa dice cosa fare prima e l'aereo non si muove; «▶ entra»
   porta nella piazza, dove un banco apre il suo fumetto e il carretto ci va;
   il cartello in scena riporta al mondo e l'aereo è dov'era, girato com'era.
   Finita l'ultima giornata di una città, tornando sul mondo l'aereo vola
   alla nuova. Il dito passa da CDP (docs/core/il-dito.md).
   Vedi docs/bancarella/mappa.md.
   `node test/esegui.mjs bancarella-mondo --niente-build` */
import { apriBrowser, apriGioco, azzera, semina, attendi, scegli, scatto, giocaGiornata } from '../aiuto/browser.mjs'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'
import { CITTA, posteggio } from '../../src/data/bancarella-mondo.js'
import { arco, versoIniziale, versoFinale } from '../../src/motore/bancarella/mondo.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
const cdp = await page.context().newCDPSession(page)
await azzera(page)

// un tocco di dito vero: tocca e lascia, e il click lo fa il browser
async function tocco(x, y, dopo = 350) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  if (dopo) await attendi(page, dopo)
}
const toccaSu = async (sel, dopo) => {
  const nodo = page.locator(sel).first()
  await nodo.scrollIntoViewIfNeeded()
  const b = await nodo.boundingBox()
  await tocco(Math.round(b.x + b.width / 2), Math.round(b.y + b.height / 2), dopo)
}
const citta = id => CITTA.find(c => c.id === id)
const grad = r => r * 180 / Math.PI
const diff = (a, b) => ((b - a + 540) % 360) - 180                 // il giro più corto, in gradi
const aereo = () => page.evaluate(() => {
  const { al, inViaggio, verso } = document.querySelector('[data-aereo]').dataset
  return { al, inViaggio, verso }
})
const stato = id => page.locator(`[data-citta="${id}"]`).getAttribute('data-stato')

/* una registrazione dell'aereo a ogni fotogramma: dove sta, come è girato, quanto è alto */
const registra = () => page.evaluate(() => {
  window.__traccia = []
  const a = document.querySelector('[data-aereo]')
  const giro = () => {
    const m = /translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\) scale\(([\d.]+)\)/.exec(a.getAttribute('transform') || '')
    if (m) window.__traccia.push({ x: +m[1], y: +m[2], r: +m[3], s: +m[4], v: a.dataset.inViaggio })
    if (window.__traccia.length < 3000) requestAnimationFrame(giro)
  }
  requestAnimationFrame(giro)
})
const traccia = () => page.evaluate(() => window.__traccia)

/* ══════════ 1. il mondo si apre sull'aereo, alla città da fare ══════════ */
// tre città finite (Bologna, Roma, Parigi): tocca a New York
// con qualche voto già preso: le altre giornate fatte partono con una stella
await semina(page, { mercato: { tappa: 9, libera: false, v: 2,
  stelle: { banchetto: 3, paese: 2, 'conto-tre': 2, 'conto-venti': 3 } } })
await scegli(page, 'bancarella')
await page.waitForSelector('[data-mondo] [data-citta]')
await attendi(page, 400)
uguale('sette città: sei e la libera', await page.locator('[data-citta]').count(), 7)
uguale('le finite si vedono finite',
       await page.locator('[data-citta][data-stato="fatta"]').evaluateAll(l => l.map(e => e.dataset.citta).join()),
       'bologna,roma,parigi')
uguale('una sola da fare adesso', await page.locator('[data-citta][data-stato="ora"]').evaluateAll(l => l.map(e => e.dataset.citta).join()), 'new-york')
uguale('le altre sono chiuse, ma si vedono',
       await page.locator('[data-citta][data-stato="chiusa"]').evaluateAll(l => l.map(e => e.dataset.citta).join()),
       'rio,tokyo,cairo')
uguale('le stelle sono accanto alle città finite, una pillola per città con la somma e il massimo',
       await page.locator('[data-stelle-citta]').evaluateAll(l => l.map(e => e.textContent).join()), '★5/6,★7/12,★3/9')
const a0 = await aereo()
uguale('l\'aereo è alla città da fare', a0.al, 'new-york')
uguale('e sta fermo', a0.inViaggio, '0')
const vista = await page.locator('[data-aereo]').boundingBox()
controlla('la vista si apre sull\'aereo', vista && vista.x > 0 && vista.x + vista.width < 390 && vista.y > 60 && vista.y + vista.height < 844,
          JSON.stringify(vista))
await scatto(page, 'bancarella-mondo-apertura')

/* ══════════ 2. il dito su una città: il fumetto subito, e l'aereo ci va ══════════ */
await registra()
await toccaSu('[data-citta="bologna"]', 0)
await attendi(page, 120)
uguale('il fumetto si apre subito, sopra la città', await page.locator('[data-fumetto]').getAttribute('data-fumetto-per'), 'bologna')
uguale('e intanto l\'aereo è partito', (await aereo()).inViaggio, '1')
uguale('il click che il dito lascia dietro non fa entrare', await page.locator('[data-piazza]').count(), 0)
const testo = await page.locator('[data-fumetto]').innerText()
controlla('il fumetto dice città, racconto e stelle', /Bologna/.test(testo) && /cassa fa tutti i conti/.test(testo) && /Tutte fatte/.test(testo) && /entra/.test(testo), testo)
controlla('e quante stelle ha preso la città, su quante', /★ 5 di 6/i.test(testo), testo)
await page.waitForSelector('[data-aereo][data-in-viaggio="0"]', { timeout: 6000 })
await attendi(page, 500)
uguale('arrivato, l\'aereo è a Bologna', (await aereo()).al, 'bologna')
await scatto(page, 'bancarella-mondo-arrivo')

const T = await traccia()
const ni = T.findIndex(p => p.v === '1')
const nf = T.findIndex((p, i) => i > ni && p.v === '0')
const viaggio = T.slice(ni, nf)
const da = posteggio(citta('new-york')), a = posteggio(citta('bologna'))
const arcoVolo = arco(da, a)
// prima gira sul posto: fermo nello stesso punto, cambia il verso, e arriva a quello della rotta che parte
const fermi = viaggio.findIndex(p => Math.hypot(p.x - da.x, p.y - da.y) > 0.8)
controlla('prima di partire gira sul posto', fermi > 6, `${fermi} fotogrammi fermi`)
const finePerno = viaggio[fermi]
controlla('e riparte già girato verso la rotta', Math.abs(diff(finePerno.r, grad(versoIniziale(arcoVolo)))) < 6,
          `${finePerno.r.toFixed(1)}° invece di ${grad(versoIniziale(arcoVolo)).toFixed(1)}°`)
controlla('girando dalla parte giusta, senza sbalzi', viaggio.slice(0, fermi).every((p, i, l) => !i || Math.abs(diff(l[i - 1].r, p.r)) < 25))
// poi vola: si alza (l'ombra se ne stacca) e riatterra
const alto = Math.max(...viaggio.map(p => p.s))
controlla('in volo l\'aereo si alza', alto > 1.15, `scala massima ${alto}`)
uguale('e a terra è alla sua misura', T[T.length - 1].s, 1)
// arriva girato com'è arrivato: l'ultimo verso del volo è la fine dell'arco, e poi non si muove più
const ultimoVolo = viaggio[viaggio.length - 1], fermo = T.slice(nf)
controlla('arriva girato come finisce l\'arco', Math.abs(diff(fermo[0].r, grad(versoFinale(arcoVolo)))) < 5,
          `${fermo[0].r.toFixed(1)}° invece di ${grad(versoFinale(arcoVolo)).toFixed(1)}°`)
controlla('e non si rigira all\'arrivo: nessuno scatto sull\'ultimo tratto', Math.abs(diff(ultimoVolo.r, fermo[0].r)) < 3,
          `${ultimoVolo.r.toFixed(1)}° → ${fermo[0].r.toFixed(1)}°`)
controlla('fermo, resta com\'è', fermo.every(p => Math.abs(diff(fermo[0].r, p.r)) < 0.5 && Math.hypot(p.x - a.x, p.y - a.y) < 0.5))
const versoArrivo = (await aereo()).verso
nota(`volo New York → Bologna: ${fermi} fotogrammi di giro sul posto, ${nf - ni} in tutto, arrivo a ${versoArrivo}°`)

/* il fumetto non si chiude da solo mentre ci si ferma, e un tocco sul mare lo chiude */
uguale('arrivato, il fumetto è ancora lì', await page.locator('[data-fumetto]').count(), 1)
await tocco(8, 760)
uguale('un tocco fuori lo chiude', await page.locator('[data-fumetto]').count(), 0)

/* ══════════ 3. una città chiusa dice cosa fare prima, e l'aereo non si muove ══════════ */
await toccaSu('[data-citta="tokyo"]')
const serve = await page.locator('[data-fumetto] [data-serve]').innerText()
controlla('dice cosa fare prima', /Prima finisci le giornate di «New York»/.test(serve), serve)
uguale('senza il tasto per entrare', await page.locator('[data-fumetto] [data-azione="entra"]').count(), 0)
uguale('e l\'aereo non si muove', JSON.stringify(await aereo()), JSON.stringify({ al: 'bologna', inViaggio: '0', verso: versoArrivo }))
await toccaSu('[data-citta="cairo"]')
controlla('la libera dice che si apre alla fine', /tutte le giornate/.test(await page.locator('[data-fumetto] [data-serve]').innerText()))
await tocco(8, 760)

/* ══════════ 4. cambiare meta in volo: l'aereo riparte da dov'è ══════════ */
await toccaSu('[data-citta="roma"]', 0)
// a metà volo: l'aereo è alto, e l'ombra se ne è staccata
await page.waitForFunction(() => +/scale\(([\d.]+)\)/.exec(document.querySelector('[data-aereo]').getAttribute('transform'))[1] > 1.2, null, { timeout: 5000 })
uguale('l\'aereo è in volo verso Roma', (await aereo()).inViaggio, '1')
await scatto(page, 'bancarella-mondo-volo')
await toccaSu('[data-citta="parigi"]', 0)
await attendi(page, 150)
uguale('un altro tocco cambia meta: il fumetto è quello nuovo', await page.locator('[data-fumetto]').getAttribute('data-fumetto-per'), 'parigi')
await tocco(8, 760, 100)
uguale('un tocco fuori, in volo, non chiude il fumetto', await page.locator('[data-fumetto]').count(), 1)
await page.waitForSelector('[data-aereo][data-in-viaggio="0"]', { timeout: 8000 })
uguale('l\'aereo arriva alla meta nuova', (await aereo()).al, 'parigi')

/* ══════════ 5. dentro la città: la piazza, i banchi, il carretto ══════════ */
await toccaSu('[data-citta="roma"]')
await page.waitForSelector('[data-aereo][data-in-viaggio="0"]', { timeout: 8000 })
const versoRoma = (await aereo()).verso
await toccaSu('[data-fumetto] [data-azione="entra"]')
await page.waitForSelector('[data-piazza][data-citta-di="roma"]')
uguale('la barra dice dove si è', await page.locator('.barra-app .dove').innerText(), 'Roma')
uguale('un banco per giornata, nello stesso ordine',
       await page.locator('[data-camp]').evaluateAll(l => l.map(e => e.dataset.camp).join()),
       'conto-dieci,conto-tre,conto-venti,grande')
uguale('coi numeri della scaletta, in tondi',
       await page.locator('[data-camp] .tondo').evaluateAll(l => l.map(e => e.textContent).join()), '3,4,5,6')
uguale('sono tutte fatte, con la stella accanto', await page.locator('[data-camp][data-stato="fatta"]').count(), 4)
uguale('una stella per banco', await page.locator('[data-stella-banco]').count(), 4)
await page.waitForSelector('[data-carretto][data-in-viaggio="0"]', { timeout: 8000 })
uguale('il carretto è arrivato all\'ultimo banco aperto', await page.locator('[data-carretto]').getAttribute('data-al'), '3')
await scatto(page, 'bancarella-piazza')

await toccaSu('[data-camp="conto-dieci"]', 0)
await attendi(page, 120)
uguale('il tocco apre subito il fumetto del banco', await page.locator('[data-fumetto]').getAttribute('data-fumetto-per'), 'conto-dieci')
uguale('e il carretto ci va', await page.locator('[data-carretto]').getAttribute('data-in-viaggio'), '1')
uguale('il click che il dito lascia dietro non comincia la giornata', await page.evaluate(() => window.__shop.fase.value), 'piazza')
const fum = await page.locator('[data-fumetto]').innerText()
controlla('dice giornata, nome, cosa c\'è di nuovo e le stelle', /giornata 3/i.test(fum) && /Il conto lo fai tu/.test(fum) &&
          /totale della spesa/.test(fum) && /Superata/.test(fum) && /gioca/.test(fum), fum)
controlla('e il voto: una stella, e cosa serve per la seconda', /1 stella/.test(fum) && /per la seconda/.test(fum), fum)
uguale('le stelle sui banchi di Roma, una a una', await page.locator('[data-stella-banco]').evaluateAll(l => l.map(e => e.dataset.stelle).join()), '1,2,3,1')
uguale('piene e vuote: tre stelline a banco, tante piene quanto il voto',
       await page.locator('[data-camp="conto-venti"] [data-stella-banco] i.piena').count(), 3)
uguale('e a una stella ce n\'è una piena sola', await page.locator('[data-camp="conto-dieci"] [data-stella-banco] i.piena').count(), 1)
await attendi(page, 500)
await scatto(page, 'bancarella-piazza-fumetto')
await page.waitForSelector('[data-carretto][data-in-viaggio="0"]', { timeout: 8000 })
uguale('il carretto è al banco toccato', await page.locator('[data-carretto]').getAttribute('data-al'), '0')

/* il cartello in scena riporta al mondo, e l'aereo è com'era */
await toccaSu('[data-azione="al-mondo"]')
await page.waitForSelector('[data-mondo]')
await attendi(page, 300)
const rientro = await aereo()
uguale('tornati sul mondo l\'aereo è a Roma', rientro.al, 'roma')
uguale('fermo', rientro.inViaggio, '0')
uguale('e girato com\'era arrivato', rientro.verso, versoRoma)
uguale('e il ← della barra, dal mondo, torna alla home', await page.locator('button[aria-label="indietro"]').count(), 1)

/* ══════════ 6. una piazza con un banco chiuso, e il ← che la lascia ══════════ */
await toccaSu('[data-citta="new-york"]')
await toccaSu('[data-fumetto] [data-azione="entra"]')
await page.waitForSelector('[data-piazza][data-citta-di="new-york"]')
await page.waitForSelector('[data-carretto][data-in-viaggio="0"]', { timeout: 8000 })
uguale('New York: una da fare e una chiusa',
       await page.locator('[data-camp]').evaluateAll(l => l.map(e => e.dataset.stato).join()), 'ora,chiusa')
await toccaSu('[data-camp="fiera"]')
const chiusa = await page.locator('[data-fumetto] [data-serve]').innerText()
controlla('il banco chiuso dice cosa fare prima', /Prima tocca a «I mezzi euro»/.test(chiusa), chiusa)
uguale('senza il tasto per giocare', await page.locator('[data-fumetto] [data-azione="gioca"]').count(), 0)
uguale('e il carretto resta dov\'è', await page.locator('[data-carretto]').getAttribute('data-al'), '0')
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('[data-mondo]')
uguale('il ← della barra, dalla piazza, riporta al mondo', await page.locator('[data-citta]').count(), 7)

/* ══════════ 7. si gioca dal dito, e finita l'ultima giornata la città nuova si apre ══════════ */
await toccaSu('[data-citta="new-york"]')
await toccaSu('[data-fumetto] [data-azione="entra"]')
await page.waitForSelector('[data-piazza][data-citta-di="new-york"]')
await toccaSu('[data-camp="resto-mezzi"]')
await toccaSu('[data-fumetto] [data-azione="gioca"]')
await page.waitForSelector('.banco', { timeout: 5000 })
uguale('«▶ gioca» comincia la giornata', await page.evaluate(() => window.__shop.fase.value), 'gioco')
await page.evaluate(() => window.__shop.chiudi('vinta'))
await page.locator('[data-azione="le-giornate"]').click()
await page.waitForSelector('[data-piazza][data-citta-di="new-york"]')
uguale('finita una giornata, se ne resta una nella città, si torna alla piazza',
       await page.locator('[data-camp]').evaluateAll(l => l.map(e => e.dataset.stato).join()), 'fatta,ora')
await giocaGiornata(page, 'fiera')
await page.evaluate(() => window.__shop.chiudi('vinta'))
await page.locator('[data-azione="le-giornate"]').click()
await page.waitForSelector('[data-mondo]')
uguale('finita l\'ultima della città si torna sul mondo, dove l\'aereo parte da New York',
       await page.locator('[data-citta="new-york"]').getAttribute('data-stato'), 'fatta')
uguale('e la città nuova si è aperta', await stato('rio'), 'ora')
await page.waitForSelector('[data-aereo][data-in-viaggio="1"]', { timeout: 4000 })
await page.waitForSelector('[data-aereo][data-in-viaggio="0"]', { timeout: 9000 })
uguale('l\'aereo ci vola e si posa a Rio', (await aereo()).al, 'rio')
await scatto(page, 'bancarella-mondo-nuova-citta')

/* ══════════ 8. la partita lasciata a metà resta in cima, sul mondo e nella piazza ══════════ */
await giocaGiornata(page, 'resto-decine')
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('.carte')
await scegli(page, 'bancarella')
await page.waitForSelector('[data-mondo]')
uguale('sul mondo la carta c\'è', await page.locator('[data-ripresa]').count(), 1)
await toccaSu('[data-citta="rio"]')
await toccaSu('[data-fumetto] [data-azione="entra"]')
await page.waitForSelector('[data-piazza]')
uguale('e anche nella piazza', await page.locator('[data-ripresa]').count(), 1)
await scatto(page, 'bancarella-piazza-ripresa')

uguale('nessun errore in console', errori.join(' · '), '')
riassunto('bancarella — il giro del mondo, col dito')
await browser.close()
