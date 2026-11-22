/* ═══════════════════════════════════════════════════════════════════
   LA FATTORIA 3D, COL DITO: IL PRATO — docs/fattoria3d/

   perché: il prato della fattoria 3D col dito vero: la carta in home, il prato in WebGL, i campi seminati e falciati trascinando, il silo, il guardaroba, «Compra» tenendo premuto, il fantasma da trascinare, il pezzo ripreso, il pennello (strade, staccionate, la gomma anche con un secondo dito), alberi, sassi e lotti a moneta, lo stato riletto dopo una ricarica, lo zoom col pizzico
   a parte perché: è la radice della famiglia e parte da un prato nuovo a livello 1; le macchine, gli ordini, il cortile e le feste (`fattoria3d-macchine`) partono da un livello alto, la casa e le bestie di casa hanno una preparazione loro
   Il test unitario prova le regole; questo dice che **il gioco vero sta in piedi nel browser**: la carta è in home, si apre sul
   prato, tenendo premuto su un posto libero si apre «Compra» e la carta scelta va sulla cella premuta e si paga (senza conferme;
   se la cella non basta resta il fantasma da sistemare, e un tocco su un posto che non va non perde niente), il pennello disegna
   e la gomma toglie, si semina e si raccoglie trascinando, un albero costa monete, sassi e cespugli si tolgono per una moneta, e
   lo stato sopravvive a un ricaricamento. Senza WebGL 2 si dice e si torna in home.
   Il dito è vero (`Input.dispatchTouchEvent`): un `page.click()` non trascina e non porta i pointer del tocco (docs/core/il-dito.md).
   `node test/esegui.mjs integrazione/fattoria3d --niente-build`
   tempo: 150
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, attendi, scatto, scegli, leggiProfilo, SCATTI_ACCESI } from '../aiuto/browser.mjs'
import { controlla, uguale, stessaLista, riassunto, blocco } from '../aiuto/verifica.mjs'
import { apriFattoria, nelPrato, attrezziDi, aspetta } from '../aiuto/fattoria3d.mjs'
import { PEZZI, gruppoDi } from '../../src/giochi/fattoria3d/dati/catalogo.js'
import { COLTURE } from '../../src/giochi/fattoria3d/dati/colture.js'
import { livelloDellaColtura } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { FASCIA_PX, SOPRA_UI_PX } from '../../src/giochi/fattoria3d/scena3d/trascinamento-puro.js'

const browser = await apriBrowser()
const { page, errori } = await apriFattoria(browser)
const { cdp, giu, muovi, su, tocca, toccaEl, centroDi, trascina, schermoDi, m3, stato, mon, fermo, quieta } = await attrezziDi(page)
const vaiScheda = async k => {      // prima la linguetta del taccuino, poi la scheda
  await toccaEl(`[data-gruppo="${gruppoDi(k)}"]`); await page.waitForSelector(`[data-scheda="${k}"]`, { state: 'visible', timeout: 3000 })
  await toccaEl(`[data-scheda="${k}"]`); await page.waitForSelector(`[data-scheda="${k}"].acceso`, { timeout: 3000 })
}
// le cose messe dal bambino: i magazzini arrivano da soli (docs/fattoria3d/magazzini.md) e non contano
const mie = st => st.cose.filter(c => !['silo', 'silo_bianco', 'dispensa'].includes(c.tipo))
const monete = async () => (await leggiProfilo(page)).coins
const conta = sel => page.locator(sel).count()
const testo = sel => page.locator(sel).innerText()

/* ── la carta sta in home, e si apre sul prato ── */
controlla('la carta sta in home', await conta('[data-indice="fattoria3d"]') === 1)
await nelPrato(page)
uguale('la barra dice dove siamo', (await testo('.barra-app .dove')).trim(), 'La fattoria')
uguale('in basso c\'è solo il tasto Compra', await conta('[data-f3^="az-"]'), 1)
controlla('c\'è un campo vuoto da seminare', mie(await stato()).length === 1)
const disegna = await m3(() => window.__fattoria3d.mondo.statistiche())
controlla('la scena disegna davvero (draw call e triangoli)', disegna.calls > 20 && disegna.triangoli > 2000, `${disegna.calls} draw, ${disegna.triangoli} triangoli`)
await scatto(page, 'fattoria3d-prato')

/* ── i campi col dito (docs/fattoria3d/campi.md): un tocco porta i semi accanto, il gettone si trascina sul campo ── */
const campo = (await stato()).cose[0]
const sulCampo = await schermoDi(campo.i + 1, campo.j + 1)
await blocco('i campi', async () => {
  await tocca(...sulCampo)
  await page.waitForSelector('[data-f3="attrezzi"][data-tipo="semi"]', { timeout: 3000 })
  uguale('l\'arco offre solo le colture arrivate al livello', await conta('[data-f3="attrezzi"] [data-seme]'), Object.keys(COLTURE).filter(k => livelloDellaColtura(k) <= 1).length)
  await toccaEl('[data-seme="grano"]')
  controlla('un tocco sul gettone dice cos\'è e non semina', await aspetta(async () => /Grano/.test(await testo('[data-f3="attrezzi-riga"]'))) && (await stato()).cose[0].tile.every(t => t === null))
  await trascina(await centroDi('[data-seme="grano"]'), sulCampo)
  const dopoSemina = await aspetta(async () => { const c = (await stato()).cose[0]; return c.coltura && c }) || (await stato()).cose[0]
  uguale('il campo è seminato a grano (a livello 1 si semina solo il grano)', dopoSemina.coltura, 'grano')
  controlla('le quattro tessere stanno crescendo', dopoSemina.tile.every(t => t !== null))
  controlla('fatto il campo, l\'attrezzo si posa', await aspetta(async () => await conta('[data-f3="attrezzi"]') === 0))
  await scatto(page, 'fattoria3d-seminato')

  // il falcetto: il tempo passa (si sposta l'orologio del motore: il grano ci mette cinque minuti, come in 2D)
  await m3(() => { const m = window.__fattoria3d.motore, o = m.ora; m.ora = () => o() + 6 * 60000 })
  await aspetta(async () => { await tocca(...sulCampo); return page.waitForSelector('[data-f3="attrezzi"][data-tipo="falce"]', { timeout: 700 }).then(() => true, () => false) }, 4000)
  await m3(() => { window.__fattoria3d.motore.s.merci.grano = 8 })          // lo scomparto pieno: si guarda prima di cominciare
  await trascina(await centroDi('[data-f3="falce"]'), sulCampo)
  await attendi(page, 300)                                                   // non deve succedere niente: non c'è un segno da aspettare
  uguale('con lo scomparto pieno il campo resta intero (non tre tessere su quattro)', (await stato()).cose[0].tile.filter(t => t !== null).length, 4)
  uguale('e l\'attrezzo resta lì per riprovare', await conta('[data-f3="attrezzi"]'), 1)
  await m3(() => { window.__fattoria3d.motore.s.merci.grano = 0 })
  await trascina(await centroDi('[data-f3="falce"]'), sulCampo)
  const raccolto = await aspetta(async () => { const s = await stato(); return s.merci.grano === 1 && s }) || await stato()
  uguale('un campo intero rende un grano solo (come in 2D) e il gesto è costato 🪙1', [raccolto.merci.grano, raccolto.esperienza].join(), '1,1')
  uguale('in alto c\'è solo il gettone del livello: le scorte stanno nei magazzini', await conta('[data-f3="hud"] button'), 1)
})

/* ── il silo (docs/fattoria3d/magazzini.md): il foglio, ingrandirlo, e toccarlo nella fattoria ── */
await blocco('il silo', async () => {
  await m3(() => window.__fattoria3d.mondo.ui.apriMagazzino('terra'))
  await page.waitForSelector('[data-f3="magazzino"][data-silo="terra"]', { timeout: 5000 })
  controlla('il silo mostra il grano con la faccia e il numero', await conta('[data-f3="magazzino"] button[data-merce="grano"][data-n="1"]') === 1)
  controlla('il gettone dice quanti ce ne sono e quanti ne tiene lo scomparto (1/8)', /1\/8/.test(await testo('[data-f3="magazzino"] button[data-merce="grano"]')))
  await toccaEl('[data-f3="magazzino"] button[data-merce="grano"]')
  controlla('un tocco dice il nome e a cosa serve', await aspetta(async () => /Grano/.test(await testo('[data-f3="magazzino-riga"]'))))
  const m0 = await mon()
  controlla('il foglio del silo dice cosa cambia ingrandendolo', /da 8 a 10 per tipo/.test(await testo('[data-f3="magazzino-piu"]')))
  await toccaEl('[data-f3="magazzino-ingrandisci"]')
  await aspetta(async () => (await stato()).silo.terra === 1 && /1\/10/.test(await testo('[data-f3="magazzino"] .f3-inv-gettone[data-merce="grano"]')))
  uguale('ingrandirlo: 10 pezzi per scomparto, 🪙40 in meno', [(await stato()).silo.terra, m0 - await mon(), /1\/10/.test(await testo('[data-f3="magazzino"] .f3-inv-gettone[data-merce="grano"]'))].join(), '1,40,true')
  uguale('e il silo in mappa è cresciuto di un passo', await m3(() => { const m = window.__fattoria3d.motore; return m.tagliaDi(m.edificiDelSilo('terra')[0]) }), 1)
  await toccaEl('[data-f3="magazzino"] [data-chiudi]')
  // toccarlo nella fattoria: il contadino ci va e il foglio si apre; poi torna dov'era, la prova va avanti da lì
  const silo = await m3(() => { const c = window.__fattoria3d.motore.edificiDelSilo('terra')[0], e = window.__fattoria3d.mondo.eroe; return { i: c.i, j: c.j, x: e.x, z: e.z } })
  await page.waitForSelector('[data-f3="magazzino"]', { state: 'detached', timeout: 5000 })   // il foglio di prima se n'è andato: il tocco cade sul prato
  await attendi(page, 600)   // un tocco sul prato nell'istante dopo la ✕ non conta (misurato: a 0 ms no, a 700 sì); un dito vero ci mette di più
  await fermo()              // e nemmeno mentre il contadino fa un gesto (il raccolto di prima)
  await tocca(...await schermoDi(silo.i + 1, silo.j + 1))
  controlla('toccare il silo nella fattoria apre il suo foglio', !!await page.waitForSelector('[data-f3="magazzino"][data-silo="terra"]', { timeout: 10000 }).catch(() => null))
  if (await conta('[data-f3="magazzino"]')) await toccaEl('[data-f3="magazzino"] [data-chiudi]')
  await m3(({ x, z }) => { const { mondo } = window.__fattoria3d; mondo.eroe.ferma(); mondo.eroe.x = x; mondo.eroe.z = z; mondo.camera.segui() }, silo)
  await quieta()
})

/* ── il guardaroba (docs/fattoria3d/guardaroba.md): si apre dall'armadio in casa (docs/fattoria3d/casa.md); il contadino toccato no; i capi stanno in cfg.abito ── */
const apriGuardaroba = async () => { await m3(() => window.__fattoria3d.mondo.ui.apriGuardaroba()); await page.waitForSelector('[data-f3="guardaroba"]', { timeout: 3000 }) }
await blocco('il guardaroba', async () => {
  await fermo()
  const dove = await m3(() => {
    const m = window.__fattoria3d.mondo, r = m.canvas.getBoundingClientRect(), [x, y] = m.proietta(m.eroe.posizione, 0.5)
    return { x: r.left + x, y: r.top + y }
  })
  await tocca(dove.x, dove.y)
  await attendi(page, 300)                                                      // non deve aprirsi niente
  controlla('toccare il contadino fermo non apre più il guardaroba (lo apre l\'armadio in casa)', await conta('[data-f3="guardaroba"]') === 0)
  uguale('il tasto 👕 non c\'è più', await conta('[data-f3="apri-guardaroba"]'), 0)
  await apriGuardaroba()
  controlla('il foglio del guardaroba si apre', await conta('[data-f3="guardaroba"]') === 1)
  // l'interfaccia unica (docs/core/personalizza.md): chi si è sta dentro l'anteprima, le schede sopra, il pannello e il prezzo sotto
  const chi = (await testo('[data-f3="guardaroba"] [data-prs="chi"]')).toLowerCase()
  await toccaEl('[data-scheda-abito="persona"]')
  await page.waitForSelector('button[data-capo^="persona:"]', { timeout: 3000 })
  const lui = await conta('button[data-capo="persona:contadino"][aria-pressed="true"]') === 1
  controlla('«Chi sei» è una scheda come le altre: due gettoni, e quello acceso è chi si è (dal profilo)', lui ? /contadino/.test(chi) : /contadina/.test(chi) && await conta('button[data-capo="persona:contadina"][aria-pressed="true"]') === 1, chi)
  await page.waitForFunction(() => !!document.querySelector('[data-f3="guardaroba-ritratto"] img'), null, { timeout: 8000 })
  const foto0 = await page.locator('[data-f3="guardaroba-ritratto"] img').getAttribute('src')
  await toccaEl('[data-f3="guardaroba"] [data-prs="gira-dx"]')
  controlla('le frecce girano il ritratto (un\'altra foto)', !!await page.waitForFunction(s => { const i = document.querySelector('[data-f3="guardaroba-ritratto"] img'); return i && i.getAttribute('src') !== s }, foto0, { timeout: 5000 }).catch(() => null))
  controlla('…e non c\'è più la scelta dei personaggi in pixel', await conta('[data-f3="guardaroba"] [data-aspetto]') === 0)
  await toccaEl('[data-scheda-abito="vestiti"]')
  await toccaEl('[data-f3="guardaroba"] button[data-voce="stivali"]')
  await toccaEl('[data-f3="guardaroba"] button[data-capo="stivali:rossi"]')
  controlla('un colore cambia l\'abito e resta acceso', await aspetta(async () => await conta('button[data-capo="stivali:rossi"][aria-pressed="true"]') === 1))
  await toccaEl('[data-scheda-abito="cappello"]')
  await toccaEl('[data-f3="guardaroba"] button[data-capo="cappello:cowboy"]')
  controlla('un pezzo speciale col livello che manca si prova, ma il tasto dice a che livello arriva', await aspetta(async () => /livello 21/i.test(await testo('[data-f3="guardaroba"] [data-prs="fondo"]'))))
  // un pezzo a pagamento: il tocco lo prova soltanto, il tasto «Acquista e indossa» lo paga
  const m1 = await mon()
  await toccaEl('[data-f3="guardaroba"] button[data-capo="cappello:cilindro"]')
  const acquista = '[data-f3="guardaroba"] button[data-prs="paga"]:not([disabled])'
  controlla('un pezzo con 🪙 resta in prova: appare «Acquista e indossa» e le monete non si muovono', await aspetta(async () => await conta(acquista) === 1) && await mon() === m1)
  controlla('…e non è ancora comprato', await m3(() => !window.__fattoria3d.motore.s.armadio['cappello:cilindro']))
  if (SCATTI_ACCESI) await attendi(page, 1500)
  await scatto(page, 'fattoria3d-guardaroba-prova')
  await toccaEl('[data-f3="guardaroba"] button[data-capo="cappello:paglia"]')
  controlla('rimettere quello che si aveva toglie la prova e il tasto', await aspetta(async () => await conta(acquista) === 0) && await mon() === m1)
  await toccaEl('[data-f3="guardaroba"] button[data-capo="cappello:cilindro"]')
  await page.waitForSelector(acquista, { timeout: 3000 })
  await toccaEl(acquista)
  controlla('«Acquista e indossa» lo paga 🪙18 e lo mette addosso', await aspetta(async () => await mon() === m1 - 18 && await conta('button[data-capo="cappello:cilindro"].addosso') === 1))
  await toccaEl('[data-f3="guardaroba"] button[data-capo="cappello:paglia"]')
  await page.waitForSelector('button[data-capo="cappello:paglia"].addosso', { timeout: 3000 })
  await toccaEl('[data-f3="guardaroba"] button[data-capo="cappello:cilindro"]')
  controlla('comprato resta suo: rimetterlo è gratis e subito', await aspetta(async () => await conta('button[data-capo="cappello:cilindro"].addosso') === 1) && await mon() === m1 - 18)
  // un set: si salva quello che si ha addosso, e ci si ricambia con un tocco
  await toccaEl('[data-scheda-abito="set"]')
  await toccaEl('[data-f3="guardaroba"] [data-prs="salva-set"]')
  await toccaEl('[data-f3="guardaroba"] [data-prs="nome-ok"]')
  { const vestiti = async () => (((await leggiProfilo(page)).campagne || {}).fattoria3d || {}).cfg?.vestiti || []
    const v = await aspetta(async () => { const v = await vestiti(); return v.length ? v : null }) || []
    controlla('il set salvato sta in cfg.vestiti, col cilindro', v.length === 1 && v[0].capi.cappello === 'cilindro', JSON.stringify(v)) }
  await toccaEl('[data-f3="guardaroba"] [data-chiudi]')
  controlla('la ✕ chiude il guardaroba', await aspetta(async () => await conta('[data-f3="guardaroba"]') === 0))
  await apriGuardaroba()
  controlla('riaperto, l\'abito è rimasto', await conta('button[data-capo="stivali:rossi"]') === 0 && await conta('[data-f3="guardaroba"]') === 1)
  await toccaEl('[data-scheda-abito="vestiti"]')
  await toccaEl('[data-f3="guardaroba"] button[data-voce="stivali"]')
  controlla('…gli stivali rossi sono ancora accesi', await aspetta(async () => await conta('button[data-capo="stivali:rossi"][aria-pressed="true"]') === 1))
  await toccaEl('[data-scheda-abito="set"]')
  controlla('…e il set salvato c\'è', await aspetta(async () => await conta('[data-f3="guardaroba"] [data-prs-set-mio="0"]:not(.libero)') === 1))
  if (SCATTI_ACCESI) { await toccaEl('[data-scheda-abito="aspetto"]'); await toccaEl('[data-f3="guardaroba"] button[data-voce="capelli"]'); await attendi(page, 2500) }
  await scatto(page, 'fattoria3d-guardaroba-aspetto')
  const testi = [await testo('body')]
  await toccaEl('[data-f3="guardaroba"] [data-chiudi]')
  await page.waitForSelector('[data-f3="guardaroba"]', { state: 'detached', timeout: 3000 })
  await toccaEl('[data-f3="livello"]'); await page.waitForSelector('[data-f3="livelli"]', { timeout: 3000 }); testi.push(await testo('body'))
  await toccaEl('[data-f3="livelli"] [data-chiudi]'); await page.waitForSelector('[data-f3="livelli"]', { state: 'detached', timeout: 3000 })
  controlla('nessuna stringa visibile dice «eroe»', !testi.some(t => /\beroe\b/i.test(t)), testi.map(t => (t.match(/.{0,20}\beroe\b.{0,20}/i) || [''])[0]).join(' | '))
})

/* ── costruire: tenere premuto su un posto libero apre «Compra»; la carta va sulla cella premuta ──
   Il dito è vero e la pressione lunga ha la sua attesa (450 ms in `dito.js`). Le monete e l'esperienza si rimettono com'erano dopo
   ogni acquisto: i fogli che seguono partono dal livello di prima. */
const premuto = async (x, y, ms = 750) => { await giu(x, y); await attendi(page, ms); await su() }
const menuAperto = () => conta('[data-f3="costruisci-qui"]')
const apriMenu = () => page.waitForSelector('[data-f3="costruisci-qui"]', { timeout: 3000 })
const chiuso = sel => aspetta(async () => await conta(sel) === 0)
// tenere premuto: se in quel momento un compagno (Watson, un gatto) passa sulla cella, il menu non si apre: si riprova
const premiEApri = async dove => {
  for (let k = 0; k < 4; k++) {
    await premuto(...await dove())
    try { await page.waitForSelector('[data-f3="costruisci-qui"]', { timeout: 1500 }); return } catch (e) { await attendi(page, 1200) }
  }
  await apriMenu()
}
const E0 = await m3(() => window.__fattoria3d.motore.s.esperienza)
const M0 = await mon()
const riposo = () => m3(([e, m]) => {
  const { motore, mondo } = window.__fattoria3d
  for (const c of motore.s.cose.filter(c => (c.tipo === 'campo' && c.id !== 1) || c.tipo === 'aiuola')) motore.mettiVia(c.id, { gratis: true })   // anche le aiuole: intorno all'eroe chiudono la strada
  motore.s.magazzino = {}; motore.s.esperienza = e; motore.eventi = []; motore.borsa.paga(motore.monete() - m); mondo.cambiato()
}, [E0, M0])
// una cella libera e propria, con attorno (5×5) solo prato, a schermo fra la barra in alto e le azioni: un campo 2×2 ci sta con l'angolo lì
const cella = (escludi = [], tipo = 'campo') => m3(([escludi, tipo]) => {
  const { motore, mondo } = window.__fattoria3d, e = mondo.eroe, r = mondo.canvas.getBoundingClientRect(), buoni = []
  for (let i = -14; i < 13; i++) for (let j = -12; j < 11; j++) {
    if (!motore.puoMettere(tipo, i, j).ok || escludi.some(([a, b]) => Math.abs(a - i) < 5 && Math.abs(b - j) < 5)) continue
    let pulita = true
    for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) if (motore.blocca(i + a, j + b)) pulita = false
    const [px, py, v] = mondo.proietta({ x: i + 0.5, y: 0, z: j + 0.5 })
    if (pulita && v && px > 60 && px < r.width - 60 && py > 150 && py < r.height - 220) buoni.push({ i, j, d: Math.hypot(i - e.x, j - e.z) })
  }
  buoni.sort((a, b) => a.d - b.d)
  return buoni.find(b => b.d >= 3) || buoni[0] || null          // non sotto l'eroe
}, [escludi, tipo])
const posto = await cella()
controlla('c\'è una cella libera a schermo', !!posto)
const sulPosto = () => schermoDi(posto.i + 0.5, posto.j + 0.5)
await blocco('Compra tenendo premuto', async () => {
  // un dito che si muove prima della soglia non apre niente (il dito non è un mouse)
  const [x, y] = await sulPosto()
  await giu(x, y); await muovi(x + 13, y); await attendi(page, 700); await su()
  await attendi(page, 200)
  controlla('un dito che scorre prima dell\'attesa non apre il menu', await menuAperto() === 0)
  await fermo(); await tocca(...await sulPosto()); await attendi(page, 300)
  controlla('e un tocco corto nemmeno', await menuAperto() === 0)
  await quieta()        // l'eroe è andato a vedere, la telecamera lo segue: si aspetta che si fermino
  // tenuto fermo: si apre, con le schede e la griglia di carte
  await premiEApri(sulPosto)
  controlla('tenuto premuto su un posto libero si apre «Compra»', await menuAperto() === 1 && /Cosa compriamo/.test(await testo('[data-f3="costruisci-qui"] h2')))
  controlla('la prima scheda è quella dei campi e ha la carta del campo', await conta('[data-scheda="campi"].acceso') === 1 && await conta('[data-carta="campo"]') === 1)
  controlla('non esiste più la barra del costruire', await conta('[data-f3="vassoio"]') === 0)
  const largo = await m3(() => [document.documentElement.scrollWidth, innerWidth, document.querySelector('.f3-corpo').scrollHeight >= document.querySelector('.f3-corpo').clientHeight])
  controlla('il foglio non esce dallo schermo di lato', largo[0] <= largo[1] && largo[2], JSON.stringify(largo))
  await scatto(page, 'fattoria3d-costruisci-qui')
  // senza monete: la carta dice cosa servono, il menu resta e non cambia niente
  await m3(() => { const m = window.__fattoria3d.motore; m.borsa.paga(m.monete() - 5) })
  await toccaEl('[data-carta="campo"]')
  controlla('senza monete: «Servono 🪙 35», il menu resta aperto e niente cambia', await aspetta(async () => /Servono 🪙 35/.test(await testo('[data-f3="costruisci-msg"]'))) && await menuAperto() === 1 && mie(await stato()).length === 1 && await mon() === 5)
  await m3(n => { window.__fattoria3d.motore.borsa.paga(-n) }, M0 - 5)
  // con le monete: si compra e si mette sulla cella premuta in un gesto, il menu si chiude, niente conferme
  await toccaEl('[data-carta="campo"]')
  const costruito = await aspetta(async () => { const s = await stato(); return mie(s).length === 2 && s }) || await stato()
  uguale('un campo in più sulla mappa', mie(costruito).length, 2)
  uguale('il magazzino resta vuoto: compra e mette in un gesto', costruito.magazzino.campo || 0, 0)
  controlla('il campo copre la cella premuta', await m3(([i, j]) => { const c = window.__fattoria3d.motore.cosaSu(i, j); return !!c && c.tipo === 'campo' && c.id !== 1 }, [posto.i, posto.j]))
  controlla('le monete vere sono scese del prezzo', M0 - await mon() === 35, `da ${M0} a ${await mon()}`)
  controlla('il menu si è chiuso e nessuna conferma d\'acquisto', await chiuso('[data-f3="costruisci-qui"]') && await conta('[data-f3="dialogo"]') === 0)
  await scatto(page, 'fattoria3d-costruito')
  await riposo()
  // una carta non ancora arrivata: il tasto 🛒 apre lo stesso menu, la carta trema e dice il livello
  await toccaEl('[data-f3="az-costruisci"]')
  await apriMenu()
  controlla('il tasto 🛒 apre lo stesso menu', await menuAperto() === 1)
  await vaiScheda('animali')
  controlla('la scheda degli animali ha il recinto chiuso, col lucchetto e il livello', await conta('[data-carta="recinto"].bloccata') === 1 && /Livello 14/.test(await testo('[data-carta="recinto"]')))
  await toccaEl('[data-carta="recinto"]')
  controlla('toccarla la fa tremare e dice il livello', await aspetta(async () => await conta('[data-carta="recinto"].trema') === 1) && /livello 14/.test(await testo('[data-f3="costruisci-msg"]')))
  controlla('e non chiede di comprare né cambia niente', await conta('[data-f3="dialogo"]') === 0 && mie(await stato()).length === 1 && await mon() === M0)
  await toccaEl('[data-chiudi]')
  controlla('la ✕ chiude il menu', await chiuso('[data-f3="costruisci-qui"]'))
  // un tocco sul velo fuori dal foglio lo chiude lo stesso
  await toccaEl('[data-f3="az-costruisci"]')
  await apriMenu()
  { const r = await page.locator('[data-f3="costruisci-velo"]').boundingBox(); await tocca(r.x + r.width / 2, r.y + 24) }
  controlla('un tocco fuori dal foglio chiude il menu', await chiuso('[data-f3="costruisci-qui"]'))
})

// la cella non basta: quattro aiuole attorno a una cella la lasciano sola; la carta chiude il menu e il fantasma resta lì, rosso
await blocco('il fantasma da sistemare', async () => {
  const buco = await cella()
  await m3(([a, b, m]) => {
    const { motore, mondo } = window.__fattoria3d
    motore.s.magazzino.aiuola = 4        // quattro aiuole (basse: non coprono la cella) attorno: nessun campo 2×2 ci sta, in nessun verso
    for (const [i, j] of [[a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]]) motore.mettiPezzo('aiuola', i, j)
    mondo.cambiato()
    motore.borsa.paga(motore.monete() - m)      // cinque pezzi messi sono un traguardo che paga monete (gioco.js): si rimettono com'erano
  }, [buco.i, buco.j, M0])
  const sulBuco = () => schermoDi(buco.i + 0.5, buco.j + 0.5)
  await premiEApri(sulBuco)
  await toccaEl('[data-carta="campo"]')
  controlla('se la cella non basta il menu si chiude e il fantasma aspetta lì', await aspetta(async () => await menuAperto() === 0 && await m3(() => window.__fattoria3d.mondo.costruzione.parcheggiato)))
  controlla('e non si è comprato niente', mie(await stato()).length === 5 && await mon() === M0, `${mie(await stato()).length} cose, ${await mon()} vs ${M0}`)
  controlla('la fascia in basso dice di trascinarlo o annullare', await conta('[data-f3="zona-via"]') === 1 && /annullare/.test(await testo('[data-f3="zona-via"]')))
  // un tocco su un posto che non va lo annulla, senza perdere niente
  await tocca(...await sulBuco())
  controlla('un tocco su un posto non valido annulla il fantasma', await aspetta(async () => !await m3(() => window.__fattoria3d.mondo.costruzione.attivo) && await conta('[data-f3="zona-via"]') === 0))
  controlla('e non cambia niente: né pezzi né monete', mie(await stato()).length === 5 && await mon() === M0, `${mie(await stato()).length} cose, ${await mon()} vs ${M0}`)
  // il fantasma si trascina in un posto libero e al rilascio paga e mette
  await premiEApri(sulBuco)
  await toccaEl('[data-carta="campo"]')
  await aspetta(() => m3(() => window.__fattoria3d.mondo.costruzione.parcheggiato))
  await page.waitForSelector('[data-f3="zona-via"]', { timeout: 3000 })
  // fuori dalla fascia che scorre: lì la mappa va da sola e il fantasma cambia cella anche a dito fermo (il pezzo va dove si vede, ma la cella letta prima è vecchia)
  const libero = await m3(([fascia, sopra]) => {
    const { motore, mondo } = window.__fattoria3d, r = mondo.canvas.getBoundingClientRect(), top = document.querySelector('[data-f3="zona-via"]').getBoundingClientRect().top, buoni = [], m = fascia + 30
    for (let i = -14; i < 13; i++) for (let j = -12; j < 11; j++) {
      if (!motore.puoMettere('campo', i, j).ok) continue
      const [px, py, v] = mondo.proietta({ x: i + 1, y: 0, z: j + 1 })        // il centro del fantasma
      if (v && px > m && px < r.width - m && py > sopra + m && r.top + py < top - m) buoni.push({ i, j, d: Math.hypot(i + 1 - mondo.eroe.x, j + 1 - mondo.eroe.z) })
    }
    buoni.sort((a, b) => b.d - a.d)
    return buoni[0] || null
  }, [FASCIA_PX, SOPRA_UI_PX])
  controlla('c\'è un posto libero a schermo dove portare il fantasma', !!libero)
  const prezzoOra = await m3(() => window.__fattoria3d.motore.prezzoPezzo('campo'))
  // il dito preme sul fantasma (dito in buco+0,5) e lo porta con sé tenendo il punto preso (lo scarto fra il centro e il dito, che con
  // un 2×2 su una cella è ±0,5 a seconda di come arrotonda il punto esatto del dito): il fantasma che si vede sotto il dito è dove si
  // costruisce (WYSIWYG). Si legge il fantasma prima di alzare il dito e si confronta col pezzo messo.
  const scarto = await m3(([bi, bj]) => { const D = window.__fattoria3d.mondo.costruzione.D; return { x: D.i + 1 - (bi + 0.5), z: D.j + 1 - (bj + 0.5) } }, [buco.i, buco.j])
  const da = await sulBuco(), a = await schermoDi(libero.i + 1 - scarto.x, libero.j + 1 - scarto.z)
  await giu(da[0], da[1])
  for (let k = 1; k <= 10; k++) { await muovi(da[0] + (a[0] - da[0]) * k / 10, da[1] + (a[1] - da[1]) * k / 10); await attendi(page, 30) }
  await attendi(page, 120)
  const vistoFant = await m3(() => { const D = window.__fattoria3d.mondo.costruzione.D; return { i: D.i, j: D.j, ok: D.ok, x: D.fant.position.x, z: D.fant.position.z } })
  const fantSch = await schermoDi(vistoFant.x, vistoFant.z)
  controlla('il fantasma sta sotto il dito tenendo il punto preso (a meno di mezza cella)', Math.hypot(fantSch[0] - a[0] - scarto.x * 38, fantSch[1] - a[1] - scarto.z * 31) < 45, `${fantSch.map(Math.round)} vs ${a.map(Math.round)}`)
  stessaLista('portato sul posto scelto il fantasma è verde nella cella voluta', [vistoFant.i, vistoFant.j, vistoFant.ok], [libero.i, libero.j, true])
  await su()
  const messo = await aspetta(async () => { const s = await stato(); return mie(s).length === 6 && s }) || await stato()
  controlla('e il pezzo messo è nella cella del fantasma', messo.cose.some(c => c.tipo === 'campo' && c.id !== 1 && c.i === vistoFant.i && c.j === vistoFant.j), JSON.stringify({ vistoFant, dito: a, campi: messo.cose.filter(c => c.tipo === 'campo').map(c => [c.id, c.i, c.j]) }))
  controlla('rilasciato in un posto buono il campo si costruisce e si paga', mie(messo).length === 6 && M0 - await mon() === prezzoOra, `${mie(messo).length} cose, da ${M0} a ${await mon()}`)
  controlla('e il fantasma non c\'è più', !await m3(() => window.__fattoria3d.mondo.costruzione.attivo) && await conta('[data-f3="zona-via"]') === 0)
})
await riposo()

// lo stagno: acqua che si costruisce dalla scheda dei decori, e un ponte che ci sta sopra (docs/fattoria3d/laghi.md); che stagno e ponte
// non si possano mettere via o spostare l'uno senza l'altro lo dice `unita/fattoria3d`
await blocco('lo stagno e il ponte', async () => {
  await m3(() => window.__fattoria3d.mondo.costruzione.annullaTrascinamento())          // un fantasma rimasto dal giro di prima non deve coprire la pressione
  const pStagno = await cella([], 'stagno')
  controlla('c\'è una cella libera a schermo per lo stagno', !!pStagno)
  await m3(() => { const m = window.__fattoria3d.motore; m.s.esperienza = 1e6; m.borsa.paga(-500) })     // il livello e le monete bastano; `riposo` rimette tutto
  await premiEApri(() => schermoDi(pStagno.i + 0.5, pStagno.j + 0.5))
  await vaiScheda('decori')
  uguale('nella scheda dei decori ci sono lo stagno e il laghetto, aperti', await conta('[data-carta="stagno"]:not(.bloccata), [data-carta="laghetto"]:not(.bloccata)'), 2)
  controlla('la carta dello stagno dice il prezzo dei dati', new RegExp('🪙 ' + PEZZI.stagno.prezzo).test(await testo('[data-carta="stagno"]')))
  await page.waitForFunction(() => document.querySelector('[data-carta="stagno"] img[data-anteprima="pronta"]'), null, { timeout: 30000 })
  await scatto(page, 'fattoria3d-stagno-carta')
  await toccaEl('[data-carta="stagno"]')
  const acquaMessa = await aspetta(() => m3(([i, j]) => { const m = window.__fattoria3d.motore, c = m.cosaSu(i, j); return c ? { tipo: c.tipo, acqua: m.acqua(i, j), passo: m.libera(i, j), i: c.i, j: c.j, id: c.id } : null }, [pStagno.i, pStagno.j]))
  controlla('la carta Stagno si mette sulla cella premuta: è acqua e non si cammina', !!acquaMessa && acquaMessa.tipo === 'stagno' && acquaMessa.acqua && !acquaMessa.passo, JSON.stringify(acquaMessa))
  controlla('nella scena c\'è il suo gruppo con l\'acqua', await aspetta(() => m3(id => { const v = window.__fattoria3d.mondo.pezzi.voce(id); return !!v && v.grp.children.length > 1 }, acquaMessa.id)))
  // un ponte con un'estremità a terra: l'eroe ci sale toccandolo (tocco vero) e cammina sopra l'acqua
  const { i: si, j: sj, id: sid } = acquaMessa
  const ponte = await m3(([si, sj]) => {
    const { motore, mondo } = window.__fattoria3d
    for (const [i, j] of [[si - 2, sj + 1], [si + 2, sj + 1], [si - 2, sj], [si + 2, sj + 2]]) {
      if (!motore.puoMettere('ponte', i, j).ok) continue
      const r = motore.compraEMetti('ponte', i, j); mondo.cambiato(); return r.ok ? { i, j, id: r.cosa.id } : null
    }
    return null
  }, [si, sj])
  controlla('il ponte ci sta sopra (con un\'estremità a terra)', !!ponte)
  await page.waitForFunction(id => !!window.__fattoria3d.mondo.pezzi.voce(id), ponte.id, { timeout: 5000 })
  await tocca(...await schermoDi(ponte.i + 1.5, ponte.j + 0.5))
  await page.waitForFunction(([i, j]) => { const e = window.__fattoria3d.mondo.eroe; return e.x >= i && e.x < i + 3 && e.z >= j && e.z < j + 1 }, [ponte.i, ponte.j], { timeout: 10000 })
  controlla('l\'eroe è salito sul ponte che sta sopra l\'acqua', await m3(() => { const { motore, mondo } = window.__fattoria3d; return motore.quotaPasso(mondo.eroe.x, mondo.eroe.z) > 0 }))
  await scatto(page, 'fattoria3d-stagno-ponte')
  // si toglie tutto: il ponte e poi lo stagno (🪙 1 ciascuno, gratis qui), il prato torna com'era
  await fermo()
  await m3(([pid, sid]) => { const { motore, mondo } = window.__fattoria3d; motore.mettiVia(pid, { gratis: true }); motore.mettiVia(sid, { gratis: true }); mondo.cambiato() }, [ponte.id, sid])
  controlla('tolto tutto la cella torna terra', await m3(([i, j]) => !window.__fattoria3d.motore.acqua(i, j) && window.__fattoria3d.motore.libera(i, j), [si, sj]))
})
await riposo()

// tenere premuto su un pezzo già messo lo riprende (non apre il menu): si solleva, segue il dito, e il bordo fa scorrere la camera
await blocco('riprendere un pezzo', async () => {
  // un campo messo a metà schermo, fuori dalla fascia che scorre (72 px dal bordo): tenuto premuto lì non si muove niente da sé
  const posto0 = await m3(() => {
    const { motore, mondo } = window.__fattoria3d, r = mondo.canvas.getBoundingClientRect(), buoni = []
    for (let i = -14; i < 13; i++) for (let j = -12; j < 11; j++) {
      if (!motore.puoMettere('campo', i, j).ok) continue
      const [px, py, v] = mondo.proietta({ x: i + 1, y: 0, z: j + 1 })
      if (v && px > 110 && px < 190 && py > 200 && py < r.height - 300) buoni.push({ i, j, d: Math.hypot(i - mondo.eroe.x, j - mondo.eroe.z) })
    }
    buoni.sort((a, b) => b.d - a.d)
    return buoni[0] || null
  })
  controlla('c\'è un posto a metà schermo per un campo da riprendere', !!posto0)
  const idCampo = await m3(([i, j]) => {
    const { motore, mondo } = window.__fattoria3d
    motore.s.magazzino.campo = (motore.s.magazzino.campo || 0) + 1; const c = motore.mettiPezzo('campo', i, j); motore.eventi = []; mondo.cambiato(); return c.cosa ? c.cosa.id : c.id
  }, [posto0.i, posto0.j])
  await page.waitForFunction(id => !!window.__fattoria3d.mondo.pezzi.voce(id), idCampo, { timeout: 5000 })
  const dellaCosa = async () => (await stato()).cose.find(c => c.id === idCampo)
  const c0 = await dellaCosa()
  const [x, y] = await schermoDi(c0.i + 0.3, c0.j + 0.3)          // preso vicino all'angolo, non al centro
  await giu(x, y)
  const preso = await aspetta(() => m3(() => window.__fattoria3d.mondo.costruzione.attivo), 2000)
  controlla('tenuto premuto su un pezzo lo solleva e non apre il menu', preso && await menuAperto() === 0)
  const fant = () => m3(() => { const D = window.__fattoria3d.mondo.costruzione.D; return D.fant ? { i: D.i, j: D.j, x: D.fant.position.x, z: D.fant.position.z } : null })
  const f0 = await fant()
  stessaLista('al sollevarlo il fantasma sta dov\'era il pezzo: non salta verso il dito', [f0.i, f0.j], [c0.i, c0.j])
  // si porta il dito di tre celle a destra: il pezzo si sposta di tre celle (tiene il punto preso)
  const [x1, y1] = await schermoDi(c0.i + 3.3, c0.j + 0.3)
  for (let k = 1; k <= 6; k++) { await muovi(x + (x1 - x) * k / 6, y + (y1 - y) * k / 6); await attendi(page, 30) }
  const f1 = await aspetta(async () => { const f = await fant(); return f.i === c0.i + 3 && f }, 1000) || await fant()
  stessaLista('portato il dito di 3 celle il pezzo si sposta di 3 celle', [f1.i, f1.j], [c0.i + 3, c0.j])
  // contro il bordo sinistro la camera scorre da sola, e il fantasma resta sotto il dito (cella ricalcolata a ogni fotogramma)
  const r = await m3(() => { const q = window.__fattoria3d.mondo.canvas.getBoundingClientRect(); return { l: q.left, t: q.top, h: q.height } })
  const camX = () => m3(() => window.__fattoria3d.mondo.camera.x)
  const cam0 = await camX()
  await muovi(r.l + 14, r.t + r.h / 2); await attendi(page, 150); await muovi(r.l + 12, r.t + r.h / 2)
  const scorsa = await aspetta(async () => await camX() < cam0 - 3, 3000)
  controlla('dito contro il bordo sinistro: la camera scorre a sinistra', scorsa, `${cam0.toFixed(2)} → ${(await camX()).toFixed(2)}`)
  const f2 = await fant(), sch2 = await schermoDi(f2.x, f2.z)
  controlla('e il fantasma resta sotto il dito', Math.abs(sch2[0] - (r.l + 12)) < 60 && Math.abs(sch2[1] - (r.t + r.h / 2)) < 60, sch2.map(Math.round).join(','))
  await muovi(r.l + 200, r.t + r.h / 2); await attendi(page, 150)
  const cam2 = await camX(); await attendi(page, 400)                       // ferma vuol dire che non cambia: si guarda dopo un po'
  controlla('uscito dalla fascia la camera si ferma', await camX() === cam2)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
  await aspetta(async () => !await m3(() => window.__fattoria3d.mondo.costruzione.attivo), 2000)
  controlla('e se il dito viene via senza lasciarlo, resta dov\'era', !await m3(() => window.__fattoria3d.mondo.costruzione.attivo) && (await dellaCosa()).i === c0.i && (await dellaCosa()).j === c0.j && await mon() === M0)
  await m3(id => { const { motore, mondo } = window.__fattoria3d; motore.mettiVia(id, { gratis: true }); motore.eventi = []; mondo.cambiato(); mondo.tornaAllEroe() }, idCampo)
  await quieta()                                                    // la camera torna all'eroe: i posti scelti prima sono di nuovo a schermo
})

/* ── il pennello: la scheda «Strade» ha la strada e la gomma; scegliendo la strada il menu si chiude e compare la sua barra ── */
await blocco('il pennello', async () => {
  await toccaEl('[data-f3="az-costruisci"]')
  await apriMenu()
  await vaiScheda('passaggi')
  controlla('la scheda delle strade ha la strada e la gomma', await conta('[data-carta="strada"]') === 1 && await conta('[data-carta="gomma"]') === 1)
  await toccaEl('[data-carta="strada"]')
  controlla('scegliere la strada chiude il menu e porta la sua barra', await aspetta(async () => await menuAperto() === 0 && await conta('[data-f3="barra-strade"]') === 1) && await conta('[data-f3^="az-"]') === 0)
  const strade = () => m3(() => Array.from(window.__fattoria3d.motore.strada.values()).filter(v => v === 1).length)
  const strade0 = await strade()
  await trascina(await schermoDi(posto.i + 0.5, posto.j + 0.5), await schermoDi(posto.i + 3.5, posto.j + 0.5))
  controlla('il dito sulla mappa disegna la strada (🪙 1 a pezzo)', await aspetta(async () => await strade() > strade0))
  // le staccionate e i cancelli: stessa barra, altri due strumenti; si apre col livello (qui lo si alza per la prova e si rimette), il cancello si attraversa
  const xp0 = await m3(() => window.__fattoria3d.motore.s.esperienza)
  await m3(() => { const { motore } = window.__fattoria3d; motore.s.esperienza = Math.max(motore.s.esperienza, 2000) })
  await attendi(page, 400)                                                  // la barra rilegge il livello al battito
  await toccaEl('[data-strumento="staccionata"]')
  controlla('la staccionata ha i suoi tipi nella barra', await aspetta(async () => await conta('[data-f3="staccionate-tipi"] [data-staccionata]') === 5))
  const celle = () => m3(() => window.__fattoria3d.motore.staccionata.size)
  const c0 = await celle()
  const j = posto.j + 2
  await trascina(await schermoDi(posto.i + 0.5, j + 0.5), await schermoDi(posto.i + 3.5, j + 0.5))
  controlla('il dito sulla mappa disegna la staccionata', await aspetta(async () => await celle() > c0))
  await toccaEl('[data-strumento="cancello"]')
  await page.waitForSelector('[data-strumento="cancello"].acceso', { timeout: 3000 })
  await trascina(await schermoDi(posto.i + 0.5, j + 0.5), await schermoDi(posto.i + 1.5, j + 0.5))
  controlla('il cancello su un pezzo si attraversa, il resto della staccionata no', await aspetta(() => m3(() => {
    const tutte = [...window.__fattoria3d.motore.staccionata.values()]
    return tutte.some(a => a.cancello) && tutte.some(a => !a.cancello)
  })))
  await toccaEl('[data-strumento="gomma"]')
  await page.waitForSelector('[data-strumento="gomma"].acceso', { timeout: 3000 })
  await trascina(await schermoDi(posto.i + 0.5, j + 0.5), await schermoDi(posto.i + 3.5, j + 0.5))
  controlla('la gomma le toglie', await aspetta(async () => await celle() === c0))
  await m3(x => { window.__fattoria3d.motore.s.esperienza = x }, xp0)
})

/* ── la gomma (docs/fattoria3d/terreno.md): toglie anche la strada di serie, che a vederla è uguale; una passata le toglie tutte;
   un secondo dito che si appoggia e si stacca non la ferma. Che una strada tolta resti tolta lo dice `unita/fattoria3d`. ── */
await blocco('la gomma', async () => {
  const dita = (type, punti) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: punti.map(([x, y], id) => ({ x, y, id })) })
  const passata = async (da, a, passi = 12) => {
    await dita('touchStart', [da])
    for (let k = 1; k <= passi; k++) { await dita('touchMove', [[da[0] + (a[0] - da[0]) * k / passi, da[1] + (a[1] - da[1]) * k / passi]]); await attendi(page, 25) }
    await attendi(page, 60); await dita('touchEnd', [])
  }
  const riga = (is, j) => m3(([is, j]) => is.map(i => window.__fattoria3d.motore.stradaSu(i, j)), [is, j])
  const diventa = async (is, j, v) => await aspetta(async () => (await riga(is, j)).every(x => x === v), 2000) ? is.map(() => v) : riga(is, j)
  const impugna = k => m3(k => window.__fattoria3d.mondo.imposta({ strumento: k, pennello: { tipo: 'terra', bordo: 'nessuno' } }), k)
  // la vista ferma sopra la cella (i, j): le prove non inseguono il contadino
  const guarda = async (i, j) => {
    await m3(([i, j]) => Object.assign(window.__fattoria3d.mondo.camera.libera, { on: true, x: i, z: j }), [i, j])
    await page.waitForFunction(([i, j]) => { const c = window.__fattoria3d.mondo.camera; return Math.hypot(c.x - i, c.z - j) < 0.02 }, [i, j], { timeout: 15000 })
  }
  await guarda(-3, 2)
  await impugna('strada')
  await passata(await schermoDi(-4.5, 2.5), await schermoDi(-2.5, 2.5))
  stessaLista('il dito disegna', await diventa([-5, -4, -3], 2, 1), [1, 1, 1])
  await impugna('gomma')
  await passata(await schermoDi(-4.5, 2.5), await schermoDi(-2.5, 2.5))
  stessaLista('la gomma toglie quella disegnata', await diventa([-5, -4, -3], 2, 0), [0, 0, 0])
  stessaLista('la strada di serie c\'è', await riga([-1, 0], 3), [2, 2])
  await passata(await schermoDi(-2.5, 3.5), await schermoDi(1.5, 3.5))
  stessaLista('una passata toglie anche quella di serie', await diventa([-1, 0], 3, 0), [0, 0])
  // un secondo dito che si appoggia e si stacca non ferma la gomma
  await guarda(-3, 5)
  await m3(() => { const { motore, mondo } = window.__fattoria3d; for (let i = -6; i < -1; i++) motore.disegnaStrada(i, 6, { gratis: true }); mondo.terreno.ridisegnaStrade() })
  const a = await schermoDi(-5.5, 6.5), b = await schermoDi(-2.5, 6.5), altro = [a[0] + 120, a[1] - 160]
  await dita('touchStart', [a])
  await dita('touchMove', [[a[0] + 6, a[1]]]); await attendi(page, 40)
  await dita('touchStart', [[a[0] + 6, a[1]], altro]); await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: altro[0], y: altro[1], id: 1 }] }); await attendi(page, 60)       // il secondo dito si stacca (l'elenco dice chi si alza), il primo resta giù
  controlla('resta un dito solo', await m3(() => window.__fattoria3d.mondo.dito.punti.size) === 1)
  for (let k = 1; k <= 12; k++) { await dita('touchMove', [[a[0] + (b[0] - a[0]) * k / 12, a[1]]]); await attendi(page, 25) }
  await attendi(page, 60); await dita('touchEnd', [])
  stessaLista('dopo il secondo dito la gomma continua', await diventa([-4, -3], 6, 0), [0, 0])
  await impugna('strada')
  await m3(() => window.__fattoria3d.mondo.camera.segui())
})
await toccaEl('[data-f3="strade-fatto"]')
controlla('«Fatto» rimette la barra delle azioni', await aspetta(async () => await conta('[data-f3="barra-strade"]') === 0 && await conta('[data-f3^="az-"]') === 1))
await m3(() => { const { motore, mondo } = window.__fattoria3d; for (const [k, v] of [...motore.strada]) if (v === 1) motore.strada.delete(k); mondo.terreno.ridisegnaStrade() })       // le strade di prova se ne vanno
await riposo()
await quieta()

/* ── gli alberi si abbattono, i sassi si tolgono, e un lotto non tuo si compra ── */
// un albero del terreno tuo che stia bene a schermo (non sotto le barre), il più vicino all'eroe
const albero = await m3(() => {
  const { motore, mondo } = window.__fattoria3d, r = mondo.canvas.getBoundingClientRect(), e = mondo.eroe
  const vis = motore.alberiNelTerreno().map(a => ({ a, p: mondo.proietta({ x: a.i + 0.5, y: 0, z: a.j + 0.5 }) }))
    .filter(({ p }) => p[2] && p[0] > 40 && p[0] < r.width - 40 && p[1] > 90 && p[1] < r.height - 170)
    .sort((u, v) => Math.hypot(u.a.i - e.x, u.a.j - e.z) - Math.hypot(v.a.i - e.x, v.a.j - e.z))
  const a = (vis[0] || { a: motore.alberiNelTerreno()[0] }).a
  return { n: a.n, i: a.i, j: a.j }
})
let sasso = null
await blocco('alberi e sassi', async () => {
  const COSTO_ALBERO = 3                              // COSTI.albero (dati/regole.js)
  // senza monete l'ascia non si alza e l'eroe dice cosa serve
  const monDa = await mon()
  await m3(() => { const m = window.__fattoria3d.motore; m.borsa.paga(m.monete() - 1) })
  await tocca(...await schermoDi(albero.i + 0.5, albero.j + 0.5))
  const detto = await aspetta(async () => /servono 🪙 3/.test(await page.locator('.f3-fumetto').innerText().catch(() => '')), 10000)
  controlla('con una moneta sola l\'albero resta in piedi e l\'eroe dice cosa servono', detto && !(await stato()).tagliati.includes(albero.n))
  await fermo()
  await m3(n => { window.__fattoria3d.motore.borsa.paga(-n) }, monDa - 1)
  const monPrimaAlbero = await monete()
  await tocca(...await schermoDi(albero.i + 0.5, albero.j + 0.5))
  const tagliato = await aspetta(async () => { const s = await stato(); return s.tagliati.includes(albero.n) && s }, 10000) || await stato()
  await fermo()
  controlla('l\'albero è abbattuto e costa monete, niente legna', tagliato.tagliati.includes(albero.n) && !('legna' in tagliato) && monPrimaAlbero - await monete() === COSTO_ALBERO, `da ${monPrimaAlbero} a ${await monete()}`)
  controlla('nel HUD non c\'è più la legna', !/🪵/.test(await testo('[data-f3="hud"]')))
  // un sasso o un cespuglio del terreno tuo: si tocca, costa 🪙 1 e la cella torna libera
  sasso = await m3(() => {
    const { motore, mondo } = window.__fattoria3d, r = mondo.canvas.getBoundingClientRect(), e = mondo.eroe
    const vis = motore.ostacoliNelTerreno().map(o => ({ o, p: mondo.proietta({ x: o.i + 0.5, y: 0, z: o.j + 0.5 }) }))
      .filter(({ p }) => p[2] && p[0] > 40 && p[0] < r.width - 40 && p[1] > 90 && p[1] < r.height - 170)
      .sort((u, v) => Math.hypot(u.o.i - e.x, u.o.j - e.z) - Math.hypot(v.o.i - e.x, v.o.j - e.z))
    const o = (vis[0] || { o: motore.ostacoliNelTerreno()[0] }).o
    return { n: o.n, id: o.id, i: o.i, j: o.j }
  })
  const monPrimaSasso = await monete()
  controlla('il sasso blocca la cella', await m3(({ i, j }) => !window.__fattoria3d.motore.libera(i, j), sasso))
  await tocca(...await schermoDi(sasso.i + 0.5, sasso.j + 0.5))
  await aspetta(async () => (await stato()).ostacoli.includes(sasso.id), 10000)
  await fermo()
  controlla('tolto: la cella è libera, il suo id è salvato, costa 🪙 1', (await stato()).ostacoli.includes(sasso.id) && await m3(({ i, j }) => window.__fattoria3d.motore.libera(i, j), sasso) && monPrimaSasso - await monete() === 1)
})
await blocco('un lotto', async () => {
  // un lotto comprabile che stia bene a schermo
  const lottoNord = await m3(() => {
    const { motore, mondo } = window.__fattoria3d, r = mondo.canvas.getBoundingClientRect()
    const c = motore.lottiComprabili().filter(l => !motore.posseduto(l) && motore.confina(l)).map(l => ({ l, p: mondo.proietta({ x: l.i + 2, y: 0, z: l.j + 2 }) }))
      .filter(({ l, p }) => p[2] && p[0] > 60 && p[0] < r.width - 60 && p[1] > 110 && p[1] < r.height - 190)
    c.sort((u, v) => v.l.j - u.l.j)       // il più a sud: lontano dalla casa e dagli alberi alti
    return c.length ? { i: c[0].l.i + 2, j: c[0].l.j + 2 } : null
  })
  if (lottoNord) await tocca(...await schermoDi(lottoNord.i, lottoNord.j))
  else await m3(() => {      // l'eroe è andato lontano a togliere un sasso e nessun lotto comprabile sta a schermo: l'offerta si chiede alla scena come farebbe il tocco
    const { motore, mondo } = window.__fattoria3d
    mondo.azioni.offriLotto(motore.lottiComprabili().find(x => !motore.posseduto(x) && motore.confina(x)))
  })
  await page.waitForSelector('[data-f3="dialogo"]', { timeout: 3000 })
  controlla('toccare un terreno non tuo apre l\'acquisto', /Terreno/.test(await testo('.f3-dialogo h2')))
  await page.locator('[data-scelta="0"]').click()
  await aspetta(async () => Object.keys((await stato()).lotti).length === 10)
  uguale('il lotto è tuo', Object.keys((await stato()).lotti).length, 10)
})

/* ── i contatori e le monete: l'albo li legge, e lo stato sta nel profilo; si esce, si ricarica, si rientra: tutto com'era ── */
await blocco('il profilo e la ricarica', async () => {
  const profilo = await aspetta(async () => { const p = await leggiProfilo(page); return p.totals.fattoria3dTerre === 1 && p }) || await leggiProfilo(page)
  controlla('i contatori sono saliti', profilo.totals.fattoria3dRaccolti === 1 && profilo.totals.fattoria3dAlberi === 1 && profilo.totals.fattoria3dTerre === 1 && profilo.totals.fattoria3dSassi === 1 && profilo.totals.fattoria3dPezzi === 8,   // il campo comprato col menu, le quattro aiuole, il campo trascinato, lo stagno e il ponte
           JSON.stringify(profilo.totals))
  const st = profilo.campagne.fattoria3d && profilo.campagne.fattoria3d.cfg.stato
  controlla('lo stato è in campagne.fattoria3d.cfg.stato', !!st && st.merci.grano === 1, '')
  controlla('la fattoria di sempre non è stata toccata', !((profilo.campagne.fattoria || {}).cfg || {}).stato, '')
  await page.locator('button[aria-label="indietro"]').click()
  await page.waitForSelector('.carte', { timeout: 8000 })
  await page.reload()
  await page.waitForSelector('.carte', { timeout: 10000 })
  await scegli(page, 'fattoria3d')
  await page.waitForFunction(() => !!(window.__fattoria3d && window.__fattoria3d.mondo), null, { timeout: 15000 })
  const riletto = await stato()
  uguale('dopo il ricaricamento i lotti sono quelli di prima', Object.keys(riletto.lotti).length, 10)
  uguale('e l\'albero è ancora a terra', riletto.tagliati.includes(albero.n), true)
  uguale('e il sasso tolto non è tornato', riletto.ostacoli.includes(sasso && sasso.id), true)
  uguale('e il grano in scorta', riletto.merci.grano, 1)
  await scatto(page, 'fattoria3d-ritorno')
  await quieta()
})

/* ── lo zoom (docs/fattoria3d/terreno.md «La telecamera»): un tocco manda l'eroe e il pizzico zooma, ai due estremi; oltre i limiti l'elastico torna dentro ── */
await blocco('lo zoom', async () => {
  for (const [nome, z] of [['minimo', 0.28], ['massimo', 2.4]]) {
    await m3(z => { window.__fattoria3d.mondo.camera.zoom = z }, z)
    await quieta()
    const dest = await m3(() => {
      const { mondo } = window.__fattoria3d, r = mondo.canvas.getBoundingClientRect(), e = mondo.eroe
      for (const [dx, dz] of [[0, 2], [2, 0], [-2, 0], [0, -2], [1.5, 1.5]]) {
        const [px, py, v] = mondo.proietta({ x: e.x + dx, y: 0, z: e.z + dz })
        if (v && px > 40 && px < r.width - 40 && py > 150 && py < r.height - 150) return { x: r.left + px, y: r.top + py, dx, dz, ex: e.x, ez: e.z }
      }
      return null
    })
    controlla(`zoom ${nome}: c'è un punto di suolo toccabile`, !!dest)
    if (dest) {
      await tocca(dest.x, dest.y)
      const mosso = () => m3(({ ex, ez }) => { const e = window.__fattoria3d.mondo.eroe; return Math.hypot(e.x - ex, e.z - ez) }, dest)
      await aspetta(async () => await mosso() > 0.5, 3000)
      controlla(`zoom ${nome}: un tocco manda l'eroe`, await mosso() > 0.5, `mosso di ${(await mosso()).toFixed(2)}`)
    }
    await fermo()
  }
  // il pizzico: due dita che si allargano molto ingrandiscono, ma il rilascio riporta dentro i limiti
  await m3(() => { window.__fattoria3d.mondo.camera.zoom = 1 })
  const c = await m3(() => { const r = window.__fattoria3d.mondo.canvas.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })
  const due = d => cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: c.x - d, y: c.y }, { x: c.x + d, y: c.y }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: c.x - 20, y: c.y }, { x: c.x + 20, y: c.y }] })
  for (let d = 20; d <= 160; d += 20) await due(d)
  for (const d of [140, 160]) await due(d)
  const dentro = await m3(() => window.__fattoria3d.mondo.camera.zoom)
  controlla('il pizzico che allarga ingrandisce (zoom sotto 1)', dentro < 0.5, `zoom ${dentro.toFixed(2)}`)
  for (let d = 160; d >= 4; d -= 6) await due(d)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  const zoom = () => m3(() => window.__fattoria3d.mondo.camera.zoom)
  const neiLimiti = async () => { const z = await zoom(); return z <= 2.4 + 1e-6 && z >= 0.28 - 1e-6 }
  controlla('al rilascio lo zoom torna dentro i limiti (≤ 2,4)', await aspetta(neiLimiti, 2000), `zoom ${(await zoom()).toFixed(2)}`)
})

/* ── senza WebGL 2 si dice e si torna in home ── */
await blocco('senza WebGL', async () => {
  const { page: senza } = await apriGioco(browser, { hash: 'fattoria3d&tela=niente', attesa: null })
  await senza.waitForSelector('[data-senza-3d]', { timeout: 8000 })
  controlla('senza WebGL il messaggio c\'è', await senza.locator('[data-senza-3d]').count() === 1)
  await senza.locator('[data-azione="esci-3d"]').click()
  controlla('e si torna in home', !!await senza.waitForSelector('.carte', { timeout: 8000 }).catch(() => null))
})

controlla('nessun errore in console', errori.length === 0, errori.join(' · '))
await browser.close()
riassunto('Fattoria 3D col dito: il prato')
