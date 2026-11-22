/* ═══════════════════════════════════════════════════════════════════
   LO SCONTRO 3D DEL SOTTERRANEO, COL DITO
   tempo: 300

   perché: lo scontro 3D: sei mostri a 390 e 320 px nel palco, il tocco sul corpo, le scritte agganciate, gli effetti delle abilità, la caduta del modello
   a parte perché: parte dal cheat `branco&mostri=6` e non dall'eroe; sotterraneo-scontro-eroe prova i pannelli dell'eroe sopra la barra

   Quello che dello scontro esiste solo nel browser: la scena WebGL, le scritte agganciate alle figure, il tocco
   sul corpo di un mostro, il racconto a tempo. Le regole (chi colpisce, in che ordine, l'agguato, la sorpresa, le
   resistenze, gli incanti preparati) le provano le unità senza disegnare: unita/sotterraneo-gruppi, -iniziativa,
   -elementi, -orologio, -mostri-3d, -anteprime-3d. Uno Chrome solo; ogni scontro si apre dal cheat dell'indirizzo
   (`#sotterraneo=1&seme=11&sotterraneo=branco&mostri=6`, docs/core/comandi.md) e ci si fanno tutte le prove che il suo
   stato permette. Si tocca come un bambino (`Input.dispatchTouchEvent` via CDP).
   - sei mostri a 390 e a 320 px (docs/sotterraneo/scontro-interfaccia.md): tutti nel palco, tre colonne, altezze diverse,
     la barra e il nome solo dove serve, la fila col busto 3D; un tocco sul corpo fa bersaglio; un tocco a vuoto accorcia
     il racconto senza scegliere; il Grido di guerra su tutti, raccontato un'azione alla volta nell'ordine della fila;
   - il grosso più alto e senza coprire; l'agguato e la sorpresa dicono la loro riga; tre mostri in due colonne;
   - un mago contro tre melme, con lo Scudo arcano già addosso (docs/sotterraneo/orologio.md) e gli effetti delle
     abilità (docs/sotterraneo/scontro-effetti.md): la pastiglia, la barriera, il badge nella fila, il segno «resiste» e
     «teme» prima di rispondere, la catena, il ghiaccio col fermo addosso, la palla di fuoco;
   - i mostri sono modelli 3D, un effetto nasce e si libera (docs/sotterraneo/mostri-3d.md); chi cade si rovescia, col
     modello e con la sagoma (`&spegni=mostri3d`; docs/sotterraneo/scontro-interfaccia.md, «La caduta»).
   Le foto (`--scatti`) per guardarli; le misure dei pannelli sopra la barra a sei larghezze stanno in
   `sotterraneo-sopra-barra-misura`.
   `node test/esegui.mjs integrazione/sotterraneo-scontro`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, scatto, attendi, ditoDi } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto, blocco } from '../aiuto/verifica.mjs'
import { scendiCon, primoDisegno, scelta, finitoIlRacconto, raccontoInCorso, rispondiGiusto, osserva, visti, corpoDi, accorciaIlRacconto }
  from '../aiuto/sotterraneo-scontro.mjs'
import { sogliaDi } from '../../src/giochi/sotterraneo/dati/livelli.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
const { tocca, toccaIl } = await ditoDi(page)

const roba = { v: 1, gemme: 0, zaino: ['pozione-piccola', 'pozione'], mano: null, mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 }
const caselle = sel => page.locator(sel).evaluateAll(es => es.map(e => {
  const r = e.getBoundingClientRect()
  return { i: e.dataset.i, x: r.x, y: r.y, w: r.width, h: r.height, b: r.bottom, r: r.right }
}))
const palco = () => page.locator('[data-duello]').boundingBox()
const dentroIlPalco = (ms, p) => ms.every(m => m.x >= p.x - 1 && m.r <= p.x + p.width + 1 && m.y >= p.y - 1 && m.b <= p.y + p.height + 1)
// quante colonne verticali fanno i mostri: i centri ordinati, una colonna nuova ogni salto di 30 px
const colonne = ms => [...ms].map(m => m.x + m.w / 2).sort((a, b) => a - b).reduce((n, x, k, v) => (k && x - v[k - 1] > 30 ? n + 1 : n), 1)
const bersagli = () => page.locator('[data-mostro][data-bersaglio]').evaluateAll(es => es.map(e => e.dataset.i))
const fila = () => page.locator('[data-fila] [data-turno]').evaluateAll(es => es.map(e => e.dataset.chi))
const ossa = () => page.locator('[data-mostro] [data-vita]').evaluateAll(es => es.map(e => Number(e.dataset.ossa)))
const grafica = () => page.evaluate(() => window.__sotterraneo3d.grafica())
// aspetta che il bersaglio sia `i` (un tocco arriva in un fotogramma o due), poi lo dice
const bersaglioDiventa = i => page.waitForFunction(i => {
  const b = [...document.querySelectorAll('[data-mostro][data-bersaglio]')].map(e => e.dataset.i)
  return b.length === 1 && b[0] === i
}, i, { timeout: 3000 }).catch(() => {})
// le anteprime 3D della fila: il busto dell'eroe sul suo turno e i mostri (di quella specie), arrivate (nascono poco dopo le caselle)
async function anteprimeDellaFila(specie) {
  await page.waitForFunction(specie => {
    const eroe = document.querySelector('[data-fila] [data-turno][data-chi="eroe"] [data-anteprima-chiave]')
    const k = [...document.querySelectorAll('[data-fila] [data-anteprima-chiave]')].map(e => e.dataset.anteprimaChiave)
    return eroe && eroe.dataset.anteprimaChiave.startsWith('busto:') && k.some(x => x.startsWith('mostro:' + specie))
  }, specie, { timeout: 15000 }).catch(() => {})
  const eroe = await page.locator('[data-fila] [data-turno][data-chi="eroe"] [data-anteprima-chiave]').evaluateAll(es => es.map(e => e.dataset.anteprimaChiave))
  controlla('nella fila l\'eroe è a mezzo busto 3D', eroe.length > 0 && eroe.every(k => k.startsWith('busto:')), eroe.join(' '))
  const chiavi = await page.locator('[data-fila] [data-turno]:not([data-chi="eroe"]) [data-anteprima-chiave]').evaluateAll(es => es.map(e => e.dataset.anteprimaChiave))
  controlla(`e i mostri col loro modello${specie ? ` (${specie})` : ''}`, chiavi.length > 0 && chiavi.every(k => k.startsWith('mostro:' + specie)), chiavi.join(' '))
}

/* ══════════ 1. sei mostri, un cavaliere col Grido di guerra ══════════
   livello 12 con l'intelligenza per l'energia del Grido, e la tempra per reggere due giri di sei mostri */
const cavaliere = { v: 2, esp: sogliaDi(12), forza: 1, destrezza: 0, intelligenza: 4, tempra: 8, albero: { grido: 1 }, caselle: ['grido', null, null] }
await blocco('sei mostri: si entra', async () => {
  await scendiCon(page, 'sotterraneo=1&seme=11&sotterraneo=branco&mostri=6', { roba, extra: { crescita: cavaliere }, aspetta: '[data-duello]' })
  await primoDisegno(page)
  await scelta(page)
})
await blocco('sei mostri a 390 px', async () => {
  const ms = await caselle('[data-mostro]')
  uguale('sei mostri in campo', ms.length, 6)
  const p = await palco()
  controlla('tutti dentro il palco', dentroIlPalco(ms, p), JSON.stringify(p))
  uguale('in tre colonne verticali, non in file', colonne(ms), 3)
  controlla('i piedi a altezze diverse, niente file orizzontali', new Set(ms.map(m => Math.round(m.b / 12))).size >= 5, JSON.stringify(ms.map(m => Math.round(m.b))))
  uguale('sotto ognuno la sua barra', await page.locator('[data-mostro] [data-vita]').count(), 6)
  controlla('e nessun numero di vita sul palco', !/\d+ ?\/ ?\d+/.test(await page.locator('[data-duello]').innerText()))
  uguale('niente «ti colpisce N» sul palco', await page.locator('[data-minaccia]').count(), 0)
  // il nome, senza articolo, solo sul bersaglio e su chi ha un grado: sei nomi affollano il palco
  const nomi = await page.locator('[data-mostro] [data-nome-mostro]').evaluateAll(es => es.map(e => e.textContent.trim()))
  const conNome = await page.locator('[data-mostro][data-bersaglio], [data-mostro][data-grado]').count()
  controlla('il nome solo sul bersaglio e su chi ha un grado, senza articolo', nomi.length === conNome && nomi.length >= 1 && nomi.length < 6 && nomi.every(t => t && !/^(Un|Uno|Una|Il|Lo|La) /.test(t)), nomi.join(' | '))
  uguale('il bersaglio, uno solo, ha il suo nome', await page.locator('[data-mostro][data-bersaglio] [data-nome-mostro]').count(), 1)
  const f = await fila()
  uguale('la fila mostra sette turni, dall\'eroe', `${f.length} ${f[0]}`, '7 eroe')
  const col = await page.locator('[data-fila]').boundingBox()
  controlla('in una colonna sul bordo destro del palco, in sovrimpressione', col.x > p.x + p.width * 0.8 && col.y >= p.y && col.width < 60, JSON.stringify(col))
  uguale('senza il posto del compagno finché il compagno non c\'è', await page.locator('[data-posto-compagno]').count(), 0)
  await anteprimeDellaFila('')
  await scatto(page, 'scontro-sei')
})
await blocco('sei mostri a 320 px', async () => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.waitForFunction(() => document.querySelector('[data-duello]').getBoundingClientRect().right <= 320, null, { timeout: 3000 }).catch(() => {})
  await attendi(page, 300)   // la telecamera rifà l'inquadratura al fotogramma dopo
  const p = await palco()
  const ms = await caselle('[data-mostro]')
  controlla('a 320 px il palco sta nella finestra', p.x >= 0 && p.x + p.width <= 320, JSON.stringify(p))
  controlla('e i sei mostri nel palco', ms.every(m => m.x >= p.x - 1 && m.r <= p.x + p.width + 1), JSON.stringify(ms.map(m => [Math.round(m.x), Math.round(m.r)])))
  uguale('la pagina non scorre di lato', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  const sopra = await page.evaluate(() => document.querySelector('[data-pannello3d]').getBoundingClientRect().top)
  const fuori = []
  for (let i = 0; i < 6; i++) { const c = await corpoDi(page, i); if (c.x < 0 || c.x > 320 || c.y > sopra) fuori.push(`${i}: ${Math.round(c.x)},${Math.round(c.y)}`) }
  controlla('i sei corpi stanno nella scena, sopra il pannello', fuori.length === 0, fuori.join(' | ') + ` (pannello a ${Math.round(sopra)})`)
  await scatto(page, 'scontro-sei-320')
  await page.setViewportSize({ width: 390, height: 844 })
  await attendi(page, 300)
})
await blocco('un tocco sul corpo di un mostro lo fa bersaglio', async () => {
  uguale('all\'inizio il bersaglio è chi ha aperto lo scontro', (await bersagli()).join(), '0')
  let p = await corpoDi(page, 3)
  await tocca(p.x, p.y)
  await bersaglioDiventa('3')
  uguale('toccato il quarto è lui il bersaglio', (await bersagli()).join(), '3')
  p = await corpoDi(page, 5)
  await tocca(p.x, p.y)
  await bersaglioDiventa('5')
  uguale('e poi il sesto', (await bersagli()).join(), '5')
})
// quanto dura un racconto accorciato da un tocco, contro quello del Grido lasciato andare: si confrontano in fondo
let accorciato = 0, intero = 0
await blocco('un tocco a vuoto accorcia il racconto e non sceglie', async () => {
  await scelta(page)
  await toccaIl('[data-azione="attacco"]')
  await rispondiGiusto(page)
  await raccontoInCorso(page)
  const t0 = Date.now()
  await attendi(page, 150)
  await tocca(195, 400)   // in mezzo alla scena, lontano dai corpi
  await finitoIlRacconto(page)
  accorciato = Date.now() - t0
  await scelta(page)
  uguale('il tocco non ha scelto un bersaglio: resta il sesto', (await bersagli()).join(), '5')
})
await blocco('il Grido di guerra su tutti, un\'azione alla volta', async () => {
  await toccaIl('[data-abilita="grido"]')
  await page.waitForSelector('.sot-domanda .qz-tasto', { timeout: 8000 })
  uguale('il Grido prepara tutti: tutti col contorno', await page.locator('[data-mostro][data-colpito]').count(), 6)
  const prima = await ossa()
  const f = await fila()
  const attesi = []
  for (const c of f.slice(1)) { if (c === 'eroe') break; attesi.push(c) }
  // chi scatta (l'assalto nella scena), nell'ordine in cui compare: un campionatore dentro la pagina, perché un colpo dura poco
  await page.evaluate(() => {
    window.__scatti = []
    window.__scattiGiro = setInterval(() => {
      const p = window.__sotterraneo3d && window.__sotterraneo3d.palco
      if (p) p.stati.forEach((s, k) => { if (s.assalto && !window.__scatti.includes(String(k))) window.__scatti.push(String(k)) })
    }, 20)
  })
  await rispondiGiusto(page)
  await raccontoInCorso(page)
  const t0 = Date.now()
  uguale('a racconto in corso non c\'è la domanda', await page.locator('.sot-domanda').count(), 0)
  uguale('né la scelta è accesa', await page.locator('[data-caselle-abilita][data-pronto]').count(), 0)
  await page.waitForFunction(() => [...document.querySelectorAll('[data-cifra]')].filter(e => e.closest('[data-mostro]')).length >= 2, null, { timeout: 5000 }).catch(() => {})
  const numeri = await page.locator('[data-cifra]').evaluateAll(es => es.map(e => e.closest('[data-mostro]') ? e.closest('[data-mostro]').dataset.i : 'eroe'))
  controlla('i numeri salgono sui mostri colpiti', numeri.filter(x => x !== 'eroe').length >= 2, numeri.join())
  await scatto(page, 'scontro-racconto')
  await finitoIlRacconto(page)
  intero = Date.now() - t0
  const dopo = await ossa()
  controlla('il Grido ha colpito tutti: la vita di ognuno è scesa', dopo.every((o, i) => o < prima[i]), `${prima.join()} → ${dopo.join()}`)
  const scattati = await page.evaluate(() => { clearInterval(window.__scattiGiro); return window.__scatti })
  // chi cade sotto il Grido non colpisce: scattano quelli rimasti in piedi, nell'ordine della fila
  const inPiedi = attesi.filter(x => dopo[Number(x)] > 0)
  controlla('i mostri hanno colpito uno alla volta', scattati.length >= Math.min(2, inPiedi.length), `${scattati.join()} (in piedi: ${inPiedi.join()})`)
  const distinti = scattati.filter((x, i) => scattati.indexOf(x) === i)
  uguale('nell\'ordine della fila', distinti.join(), attesi.filter(x => distinti.includes(x)).join())
  await scelta(page)
  uguale('a racconto finito torna la scelta', await page.locator('[data-caselle-abilita][data-pronto]').count(), 1)
  uguale('i colpiti restano al loro posto (niente salti)', (await caselle('[data-mostro]')).length, 6)
  nota(`racconto accorciato ${accorciato} ms, intero ${intero} ms`)
  // il tempo del racconto va a setTimeout, non a fotogrammi: un tocco lo fa sei volte più svelto (viste/racconto.js, VELOCE)
  controlla('il racconto toccato finisce in meno di metà del tempo di uno intero', accorciato > 0 && intero > 0 && accorciato < intero / 2, `${accorciato} contro ${intero} ms`)
})

/* ══════════ 2. il mostro grosso ══════════ */
await blocco('il mostro grosso, più alto e senza coprire', async () => {
  await scendiCon(page, 'sotterraneo=1&seme=11&sotterraneo=branco&mostri=5&grosso=grumo', { roba, extra: { crescita: cavaliere }, aspetta: '[data-duello]' })
  await primoDisegno(page)
  await scelta(page)
  const n = await page.locator('[data-mostro]').count()
  uguale('con il grosso, cinque in campo', n, 5)
  const gi = Number(await page.locator('[data-mostro][data-grande]').getAttribute('data-i'))
  const corpi = []
  for (let i = 0; i < n; i++) corpi.push({ i, ...(await corpoDi(page, i)) })
  const g = corpi[gi], altri = corpi.filter(m => m.i !== gi)
  controlla('il grosso è più alto di tutti gli altri (nella scena)', altri.every(m => g.alto > m.alto), `${g.alto} contro ${altri.map(m => m.alto)}`)
  // chi viene prima sta più vicino all'eroe, il grosso un passo più in là (grafica-3d.md, «Lo scontro»)
  controlla('e non copre nessuno: a schermo ogni altro è a più di 40 px dal suo centro',
            altri.every(m => Math.hypot(m.x - g.x, m.y - g.y) > 40), altri.map(m => `${Math.round(m.x - g.x)},${Math.round(m.y - g.y)}`).join(' | '))
  controlla('tutti dentro il palco', dentroIlPalco(await caselle('[data-mostro]'), await palco()))
  uguale('il grosso ha il suo nome sul palco', await page.locator('[data-mostro][data-grande] [data-nome-mostro]').count(), 1)
  await scatto(page, 'scontro-grosso')
})

/* ══════════ 3. l'agguato, poi tre mostri in due colonne ══════════
   chi guarda la riga dell'apertura non aspetta il primo disegno: il racconto parte subito e dura poco */
await blocco('l\'agguato, e tre mostri in due colonne', async () => {
  await scendiCon(page, 'sotterraneo=1&seme=11&sotterraneo=branco&mostri=3&agguato=1', { roba, extra: { crescita: cavaliere }, aspetta: '[data-duello]' })
  await page.waitForSelector('[data-apertura]', { timeout: 3000 })
  uguale('l\'agguato lo dice', (await page.locator('[data-apertura]').innerText()).trim(), 'Alle spalle!')
  await page.waitForSelector('[data-eroe-scontro] .sot-numero-preso', { timeout: 3000 })   // chi arriva alle spalle colpisce per primo
  await scatto(page, 'scontro-agguato')
  await accorciaIlRacconto(page, tocca)   // visto il colpo alle spalle, il resto dell'apertura va in fretta
  await finitoIlRacconto(page)
  uguale('la riga poi sparisce', await page.locator('[data-apertura]').count(), 0)
  await scelta(page)
  uguale('tre mostri', await page.locator('[data-mostro]').count(), 3)
  uguale('in due colonne', colonne(await caselle('[data-mostro]')), 2)
})

/* ══════════ 4. un mago contro tre melme, colto di sorpresa e con lo Scudo arcano già addosso ══════════
   le melme resistono al fulmine e temono il fuoco; l'intelligenza dà l'energia per tre incantesimi, la tempra la vita per tre giri.
   Quello che compare durante il racconto dura poco: l'osservatore dentro la pagina lo ricorda, e le prove si fanno su quello */
const mago = { esp: sogliaDi(16), intelligenza: 6, tempra: 8, caselle: ['sfera-di-fuoco', 'catena-di-fulmini', 'prigione-di-ghiaccio'],
  albero: Object.fromEntries(['dardo-di-fuoco', 'fiamma-viva', 'sfera-di-fuoco', 'scudo-arcano', 'fonte-arcana', 'raggio-arcano', 'catena-di-fulmini',
                              'raggio-di-gelo', 'gelo-profondo', 'scheggia', 'prigione-di-ghiaccio'].map(id => [id, 1])) }
await blocco('la sorpresa', async () => {
  await scendiCon(page, 'sotterraneo=1&seme=11&sotterraneo=branco&mostri=3&tipo=melma&sorpresa=1&preparati=scudo-arcano',
                  { eroe: 'mago', roba: { ...roba, mano: 'verga' }, extra: { crescita: mago }, aspetta: '[data-duello]' })
  await page.waitForSelector('[data-apertura]', { timeout: 3000 })
  controlla('la sorpresa lo dice', /sorpres/i.test(await page.locator('[data-apertura]').innerText()))
  uguale('e il primo turno nella fila è dell\'eroe', (await fila())[0], 'eroe')
  await accorciaIlRacconto(page, tocca)
  await finitoIlRacconto(page)
  await primoDisegno(page)
  await scelta(page)
})
await blocco('lo Scudo arcano preparato, nello scontro', async () => {
  await page.waitForSelector('[data-stati-eroe] [data-preparato="scudo-arcano"]', { timeout: 5000 })
  controlla('la pastiglia sotto il palco, coi passi che restano', Number(await page.locator('[data-stati-eroe] [data-preparato]').first().getAttribute('data-passi')) >= 30)
  controlla('la barriera è disegnata sull\'eroe', (await page.locator('[data-eroe-scontro] [data-segno="scudo"]').count()) >= 1)
  uguale('sul primo turno dell\'eroe, nella fila, il badge coi passi', await page.locator('[data-fila] [data-incanto-fila]').count(), 1)
  await anteprimeDellaFila('melma')
  await scatto(page, 'scontro-incanto')
})
await blocco('la catena di fulmini: le melme resistono', async () => {
  await toccaIl('[data-abilita="catena-di-fulmini"]')
  await page.waitForSelector('.sot-domanda .qz-tasto', { timeout: 8000 })
  uguale('prima di rispondere le tre melme hanno il segno «resiste»', await page.locator('[data-segno-pre="resiste"]').count(), 3)
  uguale('e il segno lo dice a chi lo guarda', (await page.locator('[data-segno-pre="resiste"]').first().getAttribute('title')).trim(), 'resiste al fulmine')
  await osserva(page)
  await rispondiGiusto(page)
  await raccontoInCorso(page)
  await attendi(page, 150)
  await scatto(page, 'scontro-catena')
  // visto l'effetto e chi resiste, il resto del racconto va in fretta
  await accorciaIlRacconto(page, tocca, { quando: () => window.__visti.effetti3d >= 1 && window.__visti.testi.includes('resiste') })
  await finitoIlRacconto(page)
  const v = await visti(page)
  controlla('la catena è un effetto vivo nella scena durante il racconto', v.effetti3d >= 1, String(v.effetti3d))
  controlla('chi resiste ha il numero piccolo e la scritta «resiste»', v.numeri.includes('sot-numero-resiste') && v.testi.includes('resiste'), v.numeri.join() + ' | ' + v.testi.join())
  await scelta(page)
})
await blocco('la prigione di ghiaccio: il fermo addosso', async () => {
  await toccaIl('[data-abilita="prigione-di-ghiaccio"]')
  await osserva(page)
  await rispondiGiusto(page)
  await page.waitForSelector('[data-mostro] [data-stato="fermo"]', { timeout: 6000, state: 'attached' })
  await scatto(page, 'scontro-gelo')
  await accorciaIlRacconto(page, tocca, { quando: () => window.__visti.effetti3d >= 1 && window.__visti.stati.includes('fermo') })
  await finitoIlRacconto(page)
  const v = await visti(page)
  // la pastiglia di gelo è quella del fermo, col fiocco; il blocco di ghiaccio è un modello nella scena
  controlla('il gelato ha la pastiglia del fermo, e il ghiaccio si forma nella scena', v.stati.includes('fermo') && v.effetti3d >= 1, v.stati.join() + ' | ' + v.effetti3d)
  await scelta(page)
})
await blocco('la palla di fuoco: le melme la temono', async () => {
  await toccaIl('[data-abilita="sfera-di-fuoco"]')
  await page.waitForSelector('.sot-domanda .qz-tasto', { timeout: 8000 })
  const teme = await page.locator('[data-segno-pre="teme"]').count()
  controlla('prima di rispondere le melme prese hanno il segno «teme»', teme >= 2, 'segni «teme»: ' + teme)
  uguale('e il segno lo dice', (await page.locator('[data-segno-pre="teme"]').first().getAttribute('title')).trim(), 'teme il fuoco')
  await osserva(page)
  await rispondiGiusto(page)
  await raccontoInCorso(page)
  await attendi(page, 200)
  await scatto(page, 'scontro-palla')
  await accorciaIlRacconto(page, tocca, { quando: () => window.__visti.effetti3d >= 1 && window.__visti.testi.includes('lo teme!') })
  await finitoIlRacconto(page)
  const v = await visti(page)
  controlla('la palla di fuoco è un effetto vivo nella scena', v.effetti3d >= 1, String(v.effetti3d))
  controlla('chi teme il fuoco: numero grande e «lo teme!»', v.numeri.includes('sot-numero-teme') && v.testi.includes('lo teme!'), v.numeri.join() + ' | ' + v.testi.join())
})

/* ══════════ 5. i mostri 3D, un effetto, e lo zombie che cade ══════════
   un cavaliere forte (livello 20, spada) contro uno zombie, uno scheletro e un lupo: i modelli, un effetto che nasce e
   si libera, gli attacchi che lasciano i modelli; poi si colpisce lo zombie finché cade. Un campionatore dentro la pagina
   legge l'altezza del caduto a ogni giro, perché il racconto dura poco */
const forte = { v: 2, esp: sogliaDi(20), forza: 6, destrezza: 0, intelligenza: 0, tempra: 6, albero: {}, caselle: [null, null, null] }
const armato = { ...roba, mano: 'spada' }
const campiona = () => page.evaluate(() => {
  window.__lui = null
  const v = window.__caduta = { cade: false, alto: 0, basso: 99, sagoma: false, modello: false }
  clearInterval(window.__cadutaGiro)
  window.__cadutaGiro = setInterval(() => {
    const S = window.__sotterraneo3d
    // il mostro dello scontro lo dice il palco; finito lo scontro il palco non c'è più, ma il caduto resta in scena
    if (S && S.palco && S.palco.campo[0]) window.__lui = S.palco.campo[0]
    const st = S && window.__lui && S.statoDi(window.__lui)
    if (!st) return
    if (!st.morente) v.alto = Math.max(v.alto, st.alto || 0)
    else if (st.morente < 1) { v.cade = true; v.basso = Math.min(v.basso, st.alto || 0); if (st.in3d) v.modello = true; if (st.inSagoma) v.sagoma = true }
  }, 25)
})
// colpisce il primo mostro finché cade (al più dodici turni), e aspetta che sia a terra
async function abbattiIlPrimo() {
  for (let i = 0; i < 12; i++) {
    await page.waitForFunction(() => !document.querySelector('[data-duello]') || document.querySelector('[data-caselle-abilita][data-pronto]'), null, { timeout: 20000 })
    if (!(await page.locator('[data-duello]').count()) || await page.locator('[data-mostro][data-i="0"][data-morto]').count()) break
    await toccaIl('[data-azione="attacco"]')
    await rispondiGiusto(page)
    await accorciaIlRacconto(page, tocca)   // l'ultimo colpo può chiudere lo scontro prima che lo si veda: allora niente tocco
    await finitoIlRacconto(page)
  }
  await page.waitForFunction(() => window.__caduta.cade && window.__caduta.basso < window.__caduta.alto * 0.6, null, { timeout: 8000 }).catch(() => {})
  return page.evaluate(() => { clearInterval(window.__cadutaGiro); return window.__caduta })
}
await blocco('i mostri dello scontro sono modelli 3D', async () => {
  await scendiCon(page, 'sotterraneo=0&seme=7&stanza=sala&dpr=1&luce=stanza&sotterraneo=branco&mostri=3&tipo=zombie,scheletro,lupo',
                  { tappa: 0, roba: armato, extra: { crescita: forte }, aspetta: '[data-pannello3d]' })
  await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.grafica().figure > 0, null, { timeout: 30000 })
  await primoDisegno(page)
  await scelta(page)
  const g = await grafica()
  nota(`scontro con tre mostri: ${g.mostri3d} modelli 3D, ${g.chiamate} chiamate, ${g.triangoli} triangoli`)
  controlla('i mostri dello scontro sono modelli 3D', g.mostri3d >= 3, String(g.mostri3d))
  await scatto(page, 'scontro-modelli')
  controlla('la palla di fuoco di prova è un effetto 3D', await page.evaluate(() => window.__sotterraneo3d.prova('palla', 0)))
  const nato = await page.waitForFunction(() => window.__sotterraneo3d.grafica().effetti3d > 0, null, { timeout: 3000 }).then(() => true, () => false)
  controlla('e in scena c\'è', nato)
  const libero = await page.waitForFunction(() => window.__sotterraneo3d.grafica().effetti3d === 0, null, { timeout: 15000 }).then(() => true, () => false)
  controlla('finito, si libera', libero, String((await grafica()).effetti3d))
  await page.evaluate(() => window.__sotterraneo3d.prova('cura', 0, '#7dffa0'))
  await scatto(page, 'scontro-modelli-cura')
  for (const i of [0, 1, 2]) { await page.evaluate(i => window.__sotterraneo3d.prova('mostro', i), i); await attendi(page, 700) }
  const s = await page.evaluate(() => window.__sotterraneo3d.palco.stati.map(s => !!s.in3d))
  controlla('dopo gli attacchi restano modelli', s.length === 3 && s.every(Boolean), s.join())
})
await blocco('lo zombie che cade si rovescia, col modello', async () => {
  await campiona()
  const z = await abbattiIlPrimo()
  controlla('lo zombie che cade si rovescia: col modello, e la sua altezza scende', z.cade && z.modello && z.basso < z.alto * 0.6, JSON.stringify(z))
  await scatto(page, 'scontro-caduta-zombie')
})
await blocco('senza modelli, la mummia cade con la sua sagoma', async () => {
  await scendiCon(page, 'sotterraneo=0&seme=11&sotterraneo=branco&mostri=1&tipo=mummia&spegni=mostri3d',
                  { tappa: 0, roba: armato, extra: { crescita: forte }, aspetta: '[data-duello]' })
  await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.grafica().figure > 0, null, { timeout: 30000 })
  await primoDisegno(page)
  uguale('con &spegni=mostri3d nessun modello', (await grafica()).mostri3d, 0)
  await campiona()
  const m = await abbattiIlPrimo()
  controlla('la mummia senza modello cade con la sua sagoma, a terra', m.cade && m.sagoma && m.basso < m.alto * 0.6, JSON.stringify(m))
})

uguale('nessun errore in pagina', errori.join(' | '), '')
await browser.close()
riassunto('lo scontro 3D, col dito')
