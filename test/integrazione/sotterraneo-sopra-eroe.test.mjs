/* ═══════════════════════════════════════════════════════════════════
   L'EROE: IL PERSONAGGIO, L'ALBERO DELLE ABILITÀ, I PENSIERI, COL DITO
   docs/sotterraneo/personaggio.md, abilita.md («Il tech-tree più largo»), pensieri.md

   perché: il personaggio e l'albero delle abilità col dito: editor dalla ✎, frecce, set salvati, i rami a 390 px, e il fumetto dei pensieri che non prende il tocco
   a parte perché: parte dal cavaliere sul mondo di sopra e dal mago guerriero al livello 12; la pagina dell'eroe nello scontro sta in sotterraneo-scontro-eroe

   Un Chrome, una pagina.
   1. Il personaggio: l'editor si apre dalla ✎ della scelta senza
      scrivere niente; parte dal sesso della persona del profilo; l'eroe
      grande si gira con le frecce e col dito; toccare un modello, una
      pelle, i capelli, la barba li scrive subito nell'avventura (gratis)
      e il pannello non sposta niente sopra di lui; i set si salvano con
      un nome e si rimettono con un tocco; la pagina dell'eroe dice «la
      maga» e, passando da una scheda all'altra, la finestra non sparisce
      né si rianima a nessun fotogramma.
   2. L'albero: un mago guerriero del livello 12 apre la pagina delle
      abilità dal globo, un ramo alla volta toccando lo stendardo, il
      medaglione toccato dice l'elemento e chi prende il colpo, un punto
      dato accende il nodo, e a 390 px niente sborda.
   3. I pensieri: giù senza torcia il fumetto sta sopra la testa e non
      prende il tocco; sopra, fermo, l'eroe pensa al carovaniere e il
      tocco lo illumina senza aprire la bottega; a mani vuote e con le
      gemme pensa all'arma, dal fabbro.
   Le regole (i rami, le righe, i costi; i modelli e la chiave
   dell'aspetto; quale pensiero e quando) sono in unita/sotterraneo-abilita,
   sotterraneo-personaggio e sotterraneo-pensieri.
   `node test/esegui.mjs sotterraneo-sopra-eroe`
   tempo: 150
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scegli, leggiProfilo, mondoPronto, attendi, scatto, fermoNelMondo, ditoDi, SCATTI_ACCESI }
  from '../aiuto/browser.mjs'
import { seminaIlSotterraneo } from '../aiuto/sotterraneo-semina.mjs'
import { viaLaFesta } from '../aiuto/sotterraneo-sopra.mjs'
import { controlla, uguale, stessaLista, riassunto, blocco } from '../aiuto/verifica.mjs'
import { sogliaDi } from '../../src/giochi/sotterraneo/dati/livelli.js'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { RAMI } from '../../src/giochi/sotterraneo/dati/abilita.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
const { cdp } = await ditoDi(page)
// le foto del 3D vogliono il modello disegnato: l'attesa serve solo a loro
const foto = async nome => { if (SCATTI_ACCESI) { await attendi(page, 1500); await scatto(page, nome) } }
const ed = '[data-editor-personaggio]'
const rett = sel => page.locator(`${ed} ${sel}`).first().evaluate(e => { const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, d: b.right, g: b.bottom } })
const mago = async () => (await leggiProfilo(page))?.campagne?.sotterraneo?.cfg?.avventure?.mago || {}

/* ══════════ 1. il personaggio ══════════ */
await blocco('l\'editor dalla scelta', async () => {
  await azzera(page)
  await semina(page, { coins: 300, settings: { sperimentali: true }, campagne: { sotterraneo: { tappa: 0, libera: false, stelle: {} } } })
  await viaLaFesta(page)
  await scegli(page, 'sotterraneo')
  await page.waitForSelector('.sot-eroe[data-eroe]', { timeout: 30000 })
  await foto('personaggio-1-scelta')
  // la ✎ apre l'editor senza scegliere l'eroe, e senza scrivere niente finché non si tocca
  await page.locator('[data-personaggio-di="mago"]').click()
  await page.waitForSelector(ed, { timeout: 3000 })
  uguale('l\'editor è quello del mago', await page.locator(ed).getAttribute('data-eroe-editor'), 'mago')
  // il profilo di prova ha la persona di serie (la bambina): l'editor parte dalla femmina
  uguale('parte da come è la persona del profilo', await page.locator(ed).getAttribute('data-sesso-scelto'), 'f')
  await foto('personaggio-2-editor-mago')
  uguale('i due modelli ci sono', await page.locator('[data-sesso]').count(), 2)
  controlla('aprirlo non scrive niente', !(await leggiProfilo(page))?.campagne?.sotterraneo?.cfg?.avventure)
  stessaLista('le schede: chi sei, aspetto, set', await page.locator(`${ed} [data-prs-scheda]`).evaluateAll(l => l.map(b => b.dataset.prsScheda)), ['chi', 'aspetto', 'set'])
  // la ✕ in alto a destra, e le zone nell'ordine delle dipendenze: anteprima, schede, griglia, pannello, fondo
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
  await foto('personaggio-2b-girato')
})

await blocco('chi sei e l\'aspetto, scritti subito', async () => {
  await page.locator('[data-sesso="m"]').click()
  await page.locator('[data-sesso="f"]').click()
  uguale('il sesso scelto è femmina', await page.locator(ed).getAttribute('data-sesso-scelto'), 'f')
  uguale('e sta nel salvataggio, nell\'avventura del mago', (await mago()).sesso, 'f')
  controlla('il nome è cambiato nella scheda', (await page.locator('[data-sesso="f"]').innerText()).includes('Maga'))
  await foto('editor-personaggio')
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
  await foto('personaggio-3-colori')
  let asp = (await mago()).aspetto || {}
  uguale('la pelle scelta sta nell\'avventura', asp.pelle, 'ambra')
  uguale('e i capelli', asp.capelli, 'blu')
  uguale('il taglio sta nell\'avventura', asp.taglio, 'coda')
  uguale('la tinta scelta è segnata', await page.locator('[data-capelli="blu"][aria-pressed="true"]').count(), 1)
  await fermo('aprire la barba', () => page.locator(`${ed} [data-prs-voce="barba"]`).click())
  await fermo('il pizzetto', () => page.locator('[data-barba="pizzetto"]').click())
  await foto('personaggio-3b-taglio-barba')
  uguale('e la barba', (await mago()).aspetto?.barba, 'pizzetto')
  await page.locator(`${ed} [data-prs-voce="capelli"]`).click()
  await page.locator('[data-capelli="-"]').click()
  uguale('«Di serie» rimette i capelli del modello', (await mago()).aspetto?.capelli, null)
})

await blocco('i set', async () => {
  // si salva quello che si ha addosso, con un nome, e ci si ricambia con un tocco
  await page.locator(`${ed} [data-prs-scheda="set"]`).click()
  uguale('sei posti per i miei set', await page.locator(`${ed} [data-prs-set-mio]`).count(), 6)
  await page.locator(`${ed} [data-prs="salva-set"]`).click()
  uguale('il nome è già scritto', await page.locator(`${ed} [data-prs="nome"]`).inputValue(), 'Il mio set 1')
  await page.locator(`${ed} [data-prs="nome"]`).fill('Festa')
  await page.locator(`${ed} [data-prs="nome-ok"]`).click()
  uguale('il set sta nell\'avventura, col suo nome', JSON.stringify(((await mago()).vestiti || []).map(v => [v.posto, v.nome, v.aspetto.pelle])), JSON.stringify([[0, 'Festa', 'ambra']]))
  await page.locator(`${ed} [data-prs-scheda="aspetto"]`).click()
  await page.locator(`${ed} [data-prs-voce="pelle"]`).click()
  await page.locator('[data-pelle="scura"]').click()
  await page.locator(`${ed} [data-prs-scheda="set"]`).click()
  await page.locator(`${ed} [data-prs-set-mio="0"]`).click()
  uguale('toccare il set lo rimette', (await mago()).aspetto?.pelle, 'ambra')
  await foto('personaggio-3c-set')
  await page.locator(`${ed} [data-chiudi]`).click()
})

await blocco('la pagina dell\'eroe', async () => {
  // scelto l'eroe, si parte subito (niente passi in più) e la maga resta maga
  await page.locator('.sot-eroe[data-eroe="mago"]').click()
  await mondoPronto(page)
  await page.locator('[data-azione="eroe-pagina"]').click()
  await page.waitForSelector('[data-pagina-eroe] [data-azione="personaggio"]', { timeout: 3000 })
  await foto('personaggio-4-pagina-eroe')
  controlla('la pagina parla della maga', (await page.locator('[data-pagina-eroe] [data-azione="personaggio"]').getAttribute('aria-label')).includes('la maga'))
  // passando da una scheda all'altra la finestra non si chiude e non si riapre: dal tocco in poi la cornice c'è a ogni fotogramma e
  // non si rianima (niente lampeggio). Si campiona nello stesso tocco
  await attendi(page, 800)   // l'apertura della pagina dell'eroe finisce la sua animazione
  for (const [da, a] of [['eroe', 'zaino'], ['zaino', 'abilita'], ['abilita', 'eroe']]) {
    await page.evaluate(sel => {
      window.__vuoti = 0; window.__fine = false
      document.querySelector(sel).addEventListener('click', () => {
        const t0 = performance.now()
        const f = () => {
          const c = document.querySelector('.sot-cornice')
          if (!c) window.__vuoti++
          else if (document.getAnimations().some(x => x.playState === 'running' && x.effect && x.effect.target && x.effect.target.matches('.sot-cornice, .sot-sipario') && x.effect.getComputedTiming().activeDuration > 0)) window.__vuoti++
          if (performance.now() - t0 < 800) requestAnimationFrame(f)
          else window.__fine = true
        }
        requestAnimationFrame(f)
      }, { once: true })
    }, `[data-scheda="${a}"]`)
    await page.locator(`[data-scheda="${a}"]`).click()
    await page.waitForFunction(() => window.__fine, null, { timeout: 5000 })
    uguale(`da ${da} a ${a}: la finestra resta aperta e ferma a ogni fotogramma (né sparisce né si rianima)`, await page.evaluate(() => window.__vuoti), 0)
  }
  await page.waitForSelector('[data-pagina-eroe] [data-azione="personaggio"]', { timeout: 3000 })
  await page.locator('[data-pagina-eroe] [data-azione="personaggio"]').click()
  await page.waitForSelector(ed, { timeout: 3000 })
  uguale('lo stesso editor, già femmina', await page.locator(ed).getAttribute('data-sesso-scelto'), 'f')
  await page.locator('[data-sesso="m"]').click()
  const p = await leggiProfilo(page)
  uguale('si può ripensarci, gratis', p?.campagne?.sotterraneo?.cfg?.avventure?.mago?.sesso, 'm')
  uguale('e le monete non si sono mosse', p?.coins, 300)
  await page.locator(`${ed} [data-chiudi]`).click()
})

/* ══════════ 2. l'albero delle abilità ══════════ */
const toccaIlNodo = async sel => {
  await page.locator(sel).first().scrollIntoViewIfNeeded()   // l'albero scorre dentro la sua cornice
  const b = await page.locator(sel).first().boundingBox()
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await attendi(page, 120)   // il click che il tocco lascia dietro, e il fotogramma che lo disegna
}
let rami = []
await blocco('l\'albero: un ramo alla volta', async () => {
  // un mago guerriero del livello 12: i primi tre nodi di tre rami già imparati, un punto ancora da dare
  const roba = { v: 1, gemme: 40, zaino: ['pozione'], mano: 'spada', mancina: 'verga', corpo: 'manto', dito: null, torcia: 12, torce: 0 }
  const albero = { 'dardo-di-fuoco': 1, 'fiamma-viva': 1, 'sfera-di-fuoco': 1, 'scudo-arcano': 1, 'fonte-arcana': 1, 'lama-incantata': 1, incanto: 1, 'lama-di-fuoco': 1, 'falciata-arcana': 1 }
  const avv = { tappa: 1, libera: false, stelle: { 0: 3 }, missioni: {}, roba, mondo: { parlato: true },
    crescita: { v: 2, esp: sogliaDi(12), forza: 1, destrezza: 0, intelligenza: 4, tempra: 0, albero, caselle: ['sfera-di-fuoco', 'lama-incantata', 'scudo-arcano'] } }
  await azzera(page)
  await semina(page, { coins: 300, campagne: { sotterraneo: { tappa: 1, libera: false, stelle: { 0: 3 }, cfg: { mondo: MONDO, eroe: 'mago', avventure: { mago: avv } } } } })
  await viaLaFesta(page)
  await scegli(page, 'sotterraneo')
  await mondoPronto(page)
  await toccaIlNodo('[data-azione="eroe-pagina"]')
  await page.waitForSelector('[data-pagina-eroe]', { timeout: 3000 })
  await toccaIlNodo('[data-scheda="abilita"]')
  await page.waitForSelector('[data-pagina-abilita]', { timeout: 3000 })
  rami = await page.locator('[data-azione="ramo"]').evaluateAll(es => es.map(e => e.dataset.ramoScheda))
  uguale('quattro stendardi per il mago', rami.join(), RAMI.mago.map(r => r.chiave).join())
  uguale('si apre quello dove c\'è qualcosa da fare, uno solo alla volta', await page.locator('[data-ramo]').count(), 1)
  const righe = await page.locator('[data-ramo] [data-riga]').evaluateAll(es => es.map(e => e.querySelectorAll('[data-azione="nodo"]').length))
  uguale('a schermo le sue righe: un nodo, un nodo, due, due, uno', righe.join(), '1,1,2,2,1')
  await scatto(page, 'albero-aperto')
  await toccaIlNodo('[data-azione="ramo"][data-ramo-scheda="lama-arcana"]')
  uguale('toccando lo stendardo si apre il ramo', await page.locator('[data-ramo]').getAttribute('data-ramo'), 'lama-arcana')
  controlla('lo stendardo dice che vuole la spada', /spada/.test(await page.locator('[data-ramo] .sot-ramo-arma').innerText()))
  controlla('e che colpisce con l\'intelligenza', /intelligenza/.test(await page.locator('[data-ramo] [data-car]').innerText()))
  uguale('con la spada in mano il ramo non è «manca»', await page.locator('[data-ramo] .sot-ramo-arma.sot-manca').count(), 0)
  await scatto(page, 'albero-lama-arcana')
})

await blocco('l\'albero: il medaglione toccato e il punto dato', async () => {
  await toccaIlNodo('[data-nodo="falciata-arcana"]')
  const d = page.locator('[data-nodo-dettaglio]')
  uguale('il riquadro è quello del nodo', await d.getAttribute('data-nodo'), 'falciata-arcana')
  uguale('dice l\'elemento', await d.locator('[data-elemento]').getAttribute('data-elemento'), 'fulmine')
  controlla('e chi prende il colpo', /due accanto/.test(await d.locator('[data-chi]').innerText()), await d.innerText())
  controlla('e con cosa picchia', /intelligenza/.test(await d.locator('[data-con]').innerText()))
  await toccaIlNodo('[data-azione="ramo"][data-ramo-scheda="arcano"]')
  await toccaIlNodo('[data-nodo="catena-di-fulmini"]')
  controlla('la catena dice che salta sugli altri', /salta/.test(await page.locator('[data-nodo-dettaglio] [data-chi]').innerText()))
  await scatto(page, 'albero-catena')
  await toccaIlNodo('[data-azione="ramo"][data-ramo-scheda="gelo"]')
  await toccaIlNodo('[data-nodo="raggio-di-gelo"]')
  uguale('i punti da dare', await page.locator('p[data-punti-abilita]').getAttribute('data-n'), '2')
  uguale('prima il nodo è pronto', await page.locator('[data-azione="nodo"][data-nodo="raggio-di-gelo"]').getAttribute('data-stato'), 'pronto')
  await toccaIlNodo('[data-azione="impara"]')
  uguale('poi è preso', await page.locator('[data-azione="nodo"][data-nodo="raggio-di-gelo"]').getAttribute('data-stato'), 'preso')
  uguale('e il punto si spende', await page.locator('p[data-punti-abilita]').getAttribute('data-n'), '1')
  uguale('una riga più giù si apre', await page.locator('[data-azione="nodo"][data-nodo="gelo-profondo"]').getAttribute('data-stato'), 'pronto')
  // a 390 px niente sborda
  for (const r of rami) {
    await toccaIlNodo(`[data-azione="ramo"][data-ramo-scheda="${r}"]`)
    const m = await page.evaluate(() => {
      const a = document.querySelector('[data-albero]')
      return { pagina: document.documentElement.scrollWidth, larga: window.innerWidth, albero: a.scrollWidth, visibile: a.clientWidth }
    })
    controlla(`${r}: la pagina non scorre di lato`, m.pagina <= m.larga + 1 && m.albero <= m.visibile + 1, JSON.stringify(m))
    const fuori = await page.locator('[data-ramo] [data-azione="nodo"]').evaluateAll(es =>
      es.filter(e => { const b = e.getBoundingClientRect(); return b.left < -1 || b.right > window.innerWidth + 1 }).map(e => e.dataset.nodo))
    uguale(`${r}: nessun medaglione fuori schermo`, fuori.join(), '')
  }
  await scatto(page, 'albero-fine')
})

uguale('nessun errore in console (personaggio e albero)', errori.join(' · '), '')
errori.length = 0

/* ══════════ 3. i pensieri ══════════ */
// il fumetto sta sopra la testa: il suo fondo sopra il centro dell'eroe di almeno mezza figura, e dentro lo schermo
async function sopraLaTesta(nome) {
  const f = await page.locator('[data-pensiero]').boundingBox()
  const tela = page.locator('.sot-tela')
  const b = await tela.boundingBox()
  const [ex, ey] = (await tela.getAttribute('data-eroe-schermo')).split(',').map(Number)
  controlla(`${nome}: il fumetto sta sopra l'eroe, non addosso`, f.y + f.height < b.y + ey - 12, JSON.stringify({ f, ey }))
  controlla(`${nome}: e la sua coda è sopra di lui`, Math.abs(f.x + f.width / 2 - (b.x + ex)) < f.width / 2 + 4)
  controlla(`${nome}: dentro lo schermo`, f.x >= 0 && f.x + f.width <= 390 && f.y >= b.y)
  uguale(`${nome}: non prende il tocco`, await page.locator('[data-pensiero]').evaluate(e => getComputedStyle(e).pointerEvents), 'none')
}
// a nuovo, con un cheat dell'indirizzo (si apre il gioco al posto della home)
async function conIndirizzo(hash, attesa) {
  await azzera(page)
  await page.evaluate(h => history.replaceState(null, '', location.pathname + location.search + '#' + h), hash)
  await page.reload()
  await page.waitForSelector(attesa, { timeout: 30000 })
}

await blocco('pensieri, giù senza torcia', async () => {
  await conIndirizzo('eroe=cavaliere&sotterraneo=0&seme=5', '.sot-tela')
  await page.waitForSelector('[data-pensiero]', { timeout: 15000 })
  uguale('3D: entrando senza torcia, il pensiero della torcia', await page.locator('[data-pensiero]').getAttribute('data-pensiero-id'), 'senza-torcia')
  await sopraLaTesta('3D')
  controlla('3D: col tema legno', /Palatino|serif/.test(await page.locator('[data-pensiero]').evaluate(e => getComputedStyle(e).fontFamily)))
  await scatto(page, 'sotterraneo-pensieri-3d')
})

await blocco('pensieri, sopra: il carovaniere', async () => {
  await azzera(page)
  await seminaIlSotterraneo(page, { finite: 2 })
  await page.waitForSelector('[data-pensiero]', { timeout: 9000 })
  uguale('sopra: senza torcia, pensa al carovaniere', await page.locator('[data-pensiero]').getAttribute('data-pensiero-id'), 'torcia-sopra')
  uguale('sopra: il segno è il carovaniere', await page.locator('[data-pensiero]').getAttribute('data-segno'), 'mercante:carovaniere')
  const testo = await page.locator('[data-pensiero]').innerText()
  controlla('sopra: niente ordini nel fumetto', !/\b(compra|vai|devi|dovresti)\b/i.test(testo), testo)
  await scatto(page, 'sotterraneo-pensieri-sopra')
  const prima = await page.locator('[data-eroe-mondo]').getAttribute('data-cella')
  await page.click('[data-pensiero]')
  const luce = await page.waitForSelector('[data-mercante="carovaniere"][data-indicato]', { state: 'attached', timeout: 3000 }).then(() => true, () => false)
  controlla('sopra: toccato, il carovaniere si illumina', luce)
  uguale('sopra: e la bottega non si apre da sola', await page.locator('.sot-bottega, [data-bottega]').count(), 0)
  await fermoNelMondo(page)
  controlla('sopra: l\'eroe gli va accanto', await page.locator('[data-eroe-mondo]').getAttribute('data-cella') !== prima)
  uguale('sopra: il fumetto se n\'è andato', await page.locator('[data-pensiero]').count(), 0)
  await scatto(page, 'sotterraneo-pensieri-segno')
})

await blocco('pensieri, sopra: l\'arma', async () => {
  // la bottega del cheat dà le gemme a mani nude; chiusa, l'eroe fermo pensa all'arma
  await conIndirizzo('sotterraneo=mondo&eroe=cavaliere&bottega=armaiolo&gemme=60&roba=nuda', '[data-mondo3d]')
  await page.waitForSelector('[data-chiudi]', { timeout: 15000 })
  await page.click('[data-chiudi]')
  await page.waitForSelector('[data-mondo3d][data-pronto="1"]', { timeout: 30000 })
  await page.waitForSelector('[data-pensiero]', { timeout: 15000 })
  uguale('mondo 3D: a mani vuote con le gemme, il pensiero dell\'arma', await page.locator('[data-pensiero]').getAttribute('data-pensiero-id'), 'arma-vecchia')
  const t = await page.locator('[data-pensiero]').innerText()
  controlla('mondo 3D: una spada, dal fabbro (la prima strada del cavaliere)', /una spada/.test(t) && /dal fabbro/.test(t), t)
  const f = await page.locator('[data-pensiero]').boundingBox()
  const [, ey] = (await page.locator('[data-eroe-mondo]').getAttribute('data-schermo')).split(',').map(Number)
  const v = await page.locator('[data-mondo3d]').boundingBox()
  controlla('mondo 3D: il fumetto sta sopra l\'eroe', f.y + f.height < v.y + ey - 12, JSON.stringify({ f, ey }))
  await scatto(page, 'sotterraneo-pensieri-mondo3d')
  await page.click('[data-pensiero]')
  const luce = await page.waitForSelector('[data-mercante="armaiolo"][data-indicato]', { state: 'attached', timeout: 3000 }).then(() => true, () => false)
  controlla('mondo 3D: toccato, il fabbro si illumina', luce)
  uguale('mondo 3D: e la bottega non si apre', await page.locator('[data-chiudi]').count(), 0)
})

uguale('nessun errore in console (pensieri)', errori.join(' · '), '')
await browser.close()
riassunto('l\'eroe: il personaggio, l\'albero e i pensieri')
