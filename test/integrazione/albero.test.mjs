/* ═══════════════════════════════════════════════════════════════════
   L'ALBERO DI UNA MERCE, COL DITO

   L'unità (`unita/albero`) prova che l'albero si compone giusto. Qui si
   prova che **si arrivi alla pagina** dal silo — si preme una merce,
   si preme 🌳 — e che le righe siano quelle, con lo stato che tornano
   dal granaio seminato; poi che il tasto di una riga ambra porti dove
   promette: la riga del telaio che manca apre il baule sul telaio.

   La fattoria si semina col motore vero, a livello 40 e con i tre
   silos, il telaio no: così la stoffa ha una strada aperta ma una
   macchina da comprare, che è la riga più utile da provare.

   Poi c'è un **secondo atto**, e vuole una fattoria sua: il maglione
   alla lavanda è la catena più lunga del gioco — sei fasi — e arriva
   al 52, quindi a livello 40 l'albero si fermerebbe alla prima riga
   dicendo «arriva al 52». È giusto e non prova niente, perciò lì si
   semina di nuovo a 60. Non si alza e basta il livello del primo atto
   perché a 60 gli alpaca sono aperti e l'albero della stoffa
   sceglierebbe **loro** invece dell'ovile: la strada è la più
   economica fra quelle aperte, non quella che si possiede.
   `node test/esegui.mjs albero`
   tempo: 90
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, leggiProfilo, scatto, attendi }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { Fattoria, borsaInfinita } from '../../src/giochi/fattoria/motore/fattoria.js'
import { sogliaDi } from '../../src/giochi/fattoria/dati/livelli.js'
import { CELLE, PRIMA, ULTIMA } from '../../src/giochi/fattoria/dati/mondo.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

/* ---------- la fattoria seminata ---------- */
const f = new Fattoria({ borsa: borsaInfinita() })
f.speso = sogliaDi(40)
f.reclamaTutto()
const centro = ((PRIMA + ULTIMA + 1) / 2) * CELLE
const posa = id => {
  for (let r = 0; r <= CELLE * 2; r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue
        const x = Math.round(centro + dx), y = Math.round(centro + dy)
        if (f.posa(id, x, y).ok) return { x, y }
      }
  return null
}
/* la dispensa al centro: è quella che si tocca col dito */
controlla('la dispensa si posa', !!posa('dispensa'))
posa('silo'); posa('silo_bianco'); posa('ovile'); posa('orto')
f.metti('lana', 1)
f.metti('fieno', 2)

const vecchio = await leggiProfilo(page)
await semina(page, {
  ...(vecchio || {}),
  coins: 3000,
  settings: { ...((vecchio || {}).settings || {}), sperimentali: true },
  campagne: { ...((vecchio || {}).campagne || {}),
              fattoria: { tappa: 0, libera: false, stelle: {},
                          cfg: { stato: f.serializza() } } },
})
await page.locator('.carta.gioco[data-gioco="fattoria"]').click()
await page.waitForSelector('.fa-tela', { timeout: 5000 })
await attendi(page, 700)

/* ---------- il dito, e la ricerca della dispensa ---------- */
const cdp = await page.context().newCDPSession(page)
async function dito(x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await attendi(page, 260)
}
async function chiudi() {
  if (await page.locator('.fa-velo').count()) {
    await page.locator('.fa-velo').click({ position: { x: 5, y: 5 } })
    await attendi(page, 200)
  }
}
const titolo = () => page.evaluate(
  /* dall'`h2`, non dalla prima riga di `innerText`: da quando ogni
     foglio ha la ✕ in alto a destra (`viste/Chiudi.vue`) la prima riga
     è quella. Il titolo è il titolo. */
  () => ((document.querySelector('.fa-foglio h2') || {}).innerText || '').trim())

/* ── DOVE SI CERCA LA DISPENSA, E PERCHÉ NON A TAPPETO ──
   La dispensa è **una casella sola** in tutta la fattoria, e cercarla
   spazzando la tela dall'angolo in alto a sinistra costava 960 tocchi
   da 320 ms l'uno — cinque minuti, due volte, per un file che si
   dichiara `tempo: 90`. In `integrazione/fattoria` lo stesso giro
   funziona perché lì il bersaglio (un pezzo di terra da comprare) è
   abbondante: la spazzata lo trova al terzo tocco. Qui arrivava quasi
   sempre in fondo.

   Ma dov'è la dispensa non è un mistero: `posa()` prova a spirale **dal
   centro del mondo**, e la dispensa è la prima cosa che posa, quindi
   finisce al centro o a una cella da lì. E il gioco apre la telecamera
   sul centro delle terre possedute (`vaiACasa` in `Gioco.vue`), che con
   `reclamaTutto()` è lo stesso punto. Il bersaglio è **sotto il primo
   tocco**, non in fondo alla spazzata.

   Quindi si cerca a spirale anche col dito: gli stessi punti di prima,
   ordinati per distanza dal centro della tela invece che per riga. La
   copertura non cambia — nel caso peggiore si tocca tutto lo stesso —
   ma il caso normale è un tocco invece di novecento. E il punto che ha
   funzionato si tiene da parte: il secondo atto rifà la stessa
   fattoria, quindi la dispensa sta dove stava. */
const dalCentro = tela => {
  const cx = tela.x + tela.width / 2, cy = tela.y + tela.height / 2
  const punti = []
  for (let y = tela.y + 16; y < tela.y + tela.height - 16; y += 20)
    for (let x = tela.x + 16; x < tela.x + tela.width - 16; x += 24)
      punti.push({ x: Math.round(x), y: Math.round(y), d: (x - cx) ** 2 + (y - cy) ** 2 })
  return punti.sort((a, b) => a.d - b.d)
}
async function cercaLaDispensa(gia = null) {
  const tela = await page.locator('.fa-tela').boundingBox()
  for (const p of (gia ? [gia, ...dalCentro(tela)] : dalCentro(tela))) {
    await dito(p.x, p.y)
    if ((await titolo()) === 'Dispensa') return p
    await chiudi()
  }
  return null
}

const dovEra = await cercaLaDispensa()
const trovata = !!dovEra
controlla('col dito si apre la dispensa', trovata)

/* ---------- dal silo all'albero ---------- */
if (trovata) {
  const stoffa = page.locator('.fa-scomparto', { hasText: 'Stoffa' })
  uguale('nella dispensa c\'è lo scomparto della stoffa', await stoffa.count(), 1)
  await stoffa.click()
  await attendi(page, 200)
  const tasto = page.locator('[data-azione="albero"]')
  uguale('e sotto «chi la usa» c\'è il tasto 🌳', await tasto.count(), 1)
  await tasto.click()
  await attendi(page, 300)

  uguale('si apre l\'albero', await page.locator('[data-albero]').count(), 1)
  uguale('della stoffa', await page.locator('[data-albero]').getAttribute('data-albero-di'), 'stoffa')
  await scatto(page, 'albero-stoffa')

  const riga = id => page.locator(`[data-albero-riga="${id}"]`)
  uguale('la stoffa sta in cima', await riga('stoffa').count(), 1)
  uguale('e manca', await riga('stoffa').getAttribute('data-stato'), 'manca')
  uguale('sotto c\'è la lana', await riga('lana').count(), 1)
  controlla('con uno su due', /ne hai 1/.test(await riga('lana').innerText()))
  uguale('e sotto ancora il foraggio', await riga('foraggio').count(), 1)
  /* ── LE QUANTITÀ SI MOLTIPLICANO, E SI LEGGONO ──
     Una stoffa vuole 2 lane, ogni lana 1 foraggio, ogni foraggio 2
     erbe: la colonna dice `×2 · ×2 · ×4`. Passando giù la quantità
     della ricetta senza moltiplicarla diceva `×2 · ×1 · ×2`, e il
     fieno risultava **verde** con due in granaio — cioè la colonna
     diceva «ce l'hai» a chi era a metà. Qui si guarda proprio quel
     numero, perché è l'unico dei cinque difetti che cambiava cosa
     legge un bambino. */
  for (const [id, quanti] of [['lana', 2], ['foraggio', 2], ['fieno', 4]])
    controlla(`di ${id} ne servono ${quanti}`,
              new RegExp(`×${quanti}\\b`).test(await riga(id).innerText()),
              await riga(id).innerText())
  uguale('e i due fieni in granaio non bastano per quattro',
         await riga('fieno').getAttribute('data-stato'), 'manca')
  controlla('lo dice contando', /ne hai 2, mancano 2/.test(await riga('fieno').innerText()))
  /* le macchine in mezzo */
  const telaio = page.locator('[data-albero-macchina="telaio"]')
  uguale('fra la stoffa e la lana c\'è il telaio', await telaio.count(), 1)
  controlla('che non ho, col prezzo', /non ce l'hai.*🪙/.test(await telaio.innerText()))
  uguale('e l\'ovile, che ho', await page.locator('[data-albero-macchina="ovile"]').count(), 1)

  /* la riga ambra della stoffa porta al baule sul telaio */
  const compra = riga('stoffa').locator('[data-albero-azione="compra"]')
  uguale('la riga della stoffa ha il tasto del baule', await compra.count(), 1)
  await compra.click()
  await attendi(page, 400)
  uguale('l\'albero si è chiuso', await page.locator('[data-albero]').count(), 0)
  const indicata = page.locator('.fa-voce.indicata')
  uguale('e il baule è aperto sulla voce indicata', await indicata.count(), 1)
  controlla('che è il telaio', /Telaio/.test(await indicata.innerText()))
  await scatto(page, 'albero-baule-telaio')
}

/* ---------- secondo atto: la catena più lunga ----------
   Il maglione alla lavanda è il punto in cui due rami si toccano — il
   filo e il colore — ed è la ragione per cui la pagina dell'albero
   esiste: sei fasi non stanno in un consiglio da una riga. Qui si
   guarda che la colonna le srotoli **tutte fino ai campi**, e che
   nessuna si fermi a metà.

   Fattoria nuova a livello 60, col perché in testa al file. */
{
  const g = new Fattoria({ borsa: borsaInfinita() })
  g.speso = sogliaDi(60)
  g.reclamaTutto()
  const posaIn = id => {
    for (let r = 0; r <= CELLE * 2; r++)
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue
          const x = Math.round(centro + dx), y = Math.round(centro + dy)
          if (g.posa(id, x, y).ok) return true
        }
    return false
  }
  controlla('la dispensa si posa anche nella seconda fattoria', posaIn('dispensa'))
  posaIn('silo'); posaIn('silo_bianco'); posaIn('orto')
  const prima = await leggiProfilo(page)
  await semina(page, {
    ...(prima || {}),
    campagne: { ...((prima || {}).campagne || {}),
                fattoria: { tappa: 0, libera: false, stelle: {},
                            cfg: { stato: g.serializza() } } },
  })
  await page.locator('.carta.gioco[data-gioco="fattoria"]').click()
  await page.waitForSelector('.fa-tela', { timeout: 5000 })
  await attendi(page, 700)

  /* La seconda fattoria posa le stesse cose nello stesso ordine, quindi
     la dispensa sta dove stava: si riprova quel punto per primo. */
  const aperta2 = !!(await cercaLaDispensa(dovEra))
  controlla('col dito si apre la dispensa della seconda fattoria', aperta2)

  const viola = page.locator('.fa-scomparto', { hasText: 'Maglione alla lavanda' })
  uguale('c\'è lo scomparto del maglione alla lavanda', await viola.count(), 1)
  await viola.click()
  await attendi(page, 200)
  await page.locator('[data-azione="albero"]').click()
  await attendi(page, 300)

  uguale('l\'albero è quello del maglione alla lavanda',
         await page.locator('[data-albero]').getAttribute('data-albero-di'), 'maglione_lavanda')
  const riga2 = id => page.locator(`[data-albero-riga="${id}"]`)
  /* Le sei fasi, dalla cima ai campi: il ramo del filo scende fino al
     foraggio e al fieno, quello del colore si ferma alla lavanda —
     sotto non c'è niente perché sotto c'è la terra. */
  for (const id of ['maglione_lavanda', 'maglione', 'stoffa', 'lana',
                    'foraggio', 'fieno', 'tintura', 'lavanda'])
    uguale(`c'è la riga di ${id}`, await riga2(id).count(), 1)
  /* La tintoria compare **due volte** — sopra il maglione alla lavanda
     e sopra la tintura — ed è giusto: è la stessa macchina che fa due
     passi della stessa colonna. */
  for (const id of ['tintoria', 'sartoria', 'telaio', 'fienile'])
    controlla(`e la macchina ${id} sta fra due righe`,
              await page.locator(`[data-albero-macchina="${id}"]`).count() >= 1)
  /* Nessuna riga «arriva più avanti»: a livello 60 la strada è tutta
     aperta, e una riga che si ferma lì vorrebbe dire una catena che
     dal livello non si può percorrere. */
  uguale('e niente si ferma dicendo «arriva più avanti»',
         await page.locator('[data-albero-riga][data-stato="arriva"]').count(), 0)
  await scatto(page, 'albero-maglione-lavanda')

  /* ── E LA VOCE INDICATA SI VEDE ──
     Nel primo atto il telaio sta alla seconda riga dello scaffale, e
     che la voce accesa ci sia basta a dire che si vede. Qui no: la lana
     manda a chi la fa, che a livello 60 è un recinto, e i recinti
     stanno in fondo a «la fattoria» — trentasei voci, sotto lo schermo.
     Il baule deve aprirsi **con la voce dentro lo scaffale**, dove
     l'occhio la trova (`punta` in `viste/Roba.vue`): prima si apriva in
     cima, e la voce accesa non la vedeva nessuno. */
  const compra2 = riga2('lana').locator('[data-albero-azione="compra"]')
  uguale('la riga della lana ha il tasto del baule', await compra2.count(), 1)
  await compra2.click()
  await attendi(page, 400)
  const vista = await page.evaluate(() => {
    const s = document.querySelector('.fa-scaffale')
    const v = document.querySelector('.fa-voce.indicata')
    if (!s || !v) return null
    const rs = s.getBoundingClientRect(), rv = v.getBoundingClientRect()
    return { nome: v.querySelector('.fa-nome').innerText, scorso: Math.round(s.scrollTop),
             dentro: rv.top >= rs.top && rv.bottom <= rs.bottom }
  })
  controlla('il baule si apre con la voce indicata dove si vede',
            !!vista && vista.dentro, JSON.stringify(vista))
  nota(`la lana manda a «${vista && vista.nome}», scaffale scorso di ${vista && vista.scorso} px`)
  await scatto(page, 'albero-baule-in-fondo')
}

nota(`errori in console: ${errori.length}`)
uguale('nessun errore in console', errori.join(' | '), '')
await browser.close()
riassunto('l\'albero di una merce, col dito')
