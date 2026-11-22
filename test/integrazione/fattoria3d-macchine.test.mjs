/* ═══════════════════════════════════════════════════════════════════
   LA FATTORIA 3D, COL DITO: LE MACCHINE, GLI ORDINI, IL CORTILE E LE FESTE — docs/fattoria3d/

   perché: i fogli della fattoria 3D che si aprono più avanti, col dito vero: girare un pezzo con un secondo dito, il gettone e il foglio dei livelli, le carte di ogni scheda con la loro anteprima 3D, la fila della macchina (vani, trascinare la carta), gli edifici col «!», il banco degli ordini, pollaio stalla e recinto col cartello, la memoria della GPU, la pesca col molo, Natale e Halloween in scena
   a parte perché: parte da un prato nuovo con l'esperienza portata in alto dalla console, mentre `fattoria3d` prova il prato a livello 1 e ricarica la pagina; le feste si aprono dal loro cheat (`#stagione=`)
   Lo stato si prepara dalla console (`__fattoria3d`); i tasti dei fogli si premono davvero. Le cose sul prato (un edificio) si aprono
   con `azioni.fai`: arrivarci a piedi è già provato in `fattoria3d`. Le regole (prezzi, tempi, capienze, chi non si mette via) stanno
   nelle unità `unita/fattoria3d*`: qui si guarda che il foglio le mostri e che il dito le faccia.
   Il dito è vero (`Input.dispatchTouchEvent`): un `page.click()` non porta i pointer del tocco (docs/core/il-dito.md).
   `node test/esegui.mjs integrazione/fattoria3d-macchine --niente-build`
   tempo: 150
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, attendi, scatto, leggiProfilo } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto, blocco } from '../aiuto/verifica.mjs'
import { apriFattoria, nelPrato, attrezziDi, aspetta } from '../aiuto/fattoria3d.mjs'
import { PEZZI, EDIFICI, CATEGORIE, gruppoDi } from '../../src/giochi/fattoria3d/dati/catalogo.js'
import { ANIMALI } from '../../src/giochi/fattoria3d/dati/animali.js'
import { RICETTE } from '../../src/giochi/fattoria3d/dati/ricette.js'
import { POSTI } from '../../src/giochi/fattoria3d/dati/ordini.js'
import { ULTIMO } from '../../src/giochi/fattoria3d/dati/livelli.js'

const browser = await apriBrowser()
const { page, errori } = await apriFattoria(browser, { coins: 600 })
await nelPrato(page)
const { cdp, giu, muovi, su, tocca, toccaEl, centroDi, trascina, schermoDi, m3, stato, mon, fermo, quieta } = await attrezziDi(page)
const conta = sel => page.locator(sel).count()
const testo = sel => page.locator(sel).innerText()
const monete = async () => (await leggiProfilo(page)).coins
const vaiScheda = async k => {      // prima la linguetta del taccuino, poi la scheda
  await toccaEl(`[data-gruppo="${gruppoDi(k)}"]`); await page.waitForSelector(`[data-scheda="${k}"]`, { state: 'visible', timeout: 3000 })
  await toccaEl(`[data-scheda="${k}"]`); await page.waitForSelector(`[data-scheda="${k}"].acceso`, { timeout: 3000 })
}
const apriMenu = async () => { await toccaEl('[data-f3="az-costruisci"]'); await page.waitForSelector('[data-f3="costruisci-qui"]', { timeout: 3000 }) }
// la ✕ del foglio in cima: si aspetta che il foglio se ne sia andato
const chiudiFoglio = async sel => { await page.locator(`${sel} [data-chiudi]`).first().click(); await page.waitForSelector(sel, { state: 'detached', timeout: 3000 }) }
const esperienza = e => m3(e => { const { motore, mondo } = window.__fattoria3d; motore.s.esperienza = e; mondo.cambiato() }, e)

/* ── ruotare: tenuto premuto un pezzo, il tasto ↻ con un secondo dito lo gira di un quarto; rilasciato resta girato (docs/fattoria3d/rotazione.md);
   che girare costi una moneta e cambi l'ingombro lo dice `unita/fattoria3d-rotazione` ── */
await blocco('ruotare', async () => {
  await esperienza(1e6)          // il tavolo è del livello 4
  const pan = await m3(() => {
    const { motore, mondo } = window.__fattoria3d, r = mondo.canvas.getBoundingClientRect(), buoni = []
    for (let i = -14; i < 13; i++) for (let j = -12; j < 11; j++) {
      // un tavolo (3×2) che ci sta dritto e girato (2×3) col centro fermo, a metà schermo (fuori dalla fascia che scorre) e lontano dall'eroe
      if (!motore.puoMettere('tavolo', i, j).ok || !motore.puoMettere('tavolo', i + 1, j - 1, 0, 1).ok) continue
      const [px, py, v] = mondo.proietta({ x: i + 1.5, y: 0, z: j + 1 })
      let libero = true                                                    // con un giro di prato attorno: il dito che rilascia girato può cadere a una cella di distanza
      for (let a = -1; a <= 3; a++) for (let b = -2; b <= 2; b++) if (motore.cosaSu(i + a, j + b)) libero = false
      if (v && px > 110 && px < r.width - 110 && py > 200 && py < r.height - 300) buoni.push({ i, j, d: Math.hypot(i - mondo.eroe.x, j - mondo.eroe.z) - (libero ? 0 : 1000) })
    }
    buoni.sort((a, b) => b.d - a.d)
    const q = buoni[0]; if (!q) return null
    const c = motore.compraEMetti('tavolo', q.i, q.j); mondo.cambiato(); return { id: c.cosa.id, i: q.i, j: q.j }
  })
  controlla('c\'è un posto per un tavolo che gira', !!pan)
  await page.waitForFunction(id => !!window.__fattoria3d.mondo.pezzi.voce(id), pan.id, { timeout: 5000 })
  const centro = await schermoDi(pan.i + 1.5, pan.j + 1)
  const M1 = await mon()
  await giu(centro[0], centro[1])
  await page.waitForSelector('[data-f3="ruota"]', { timeout: 3000 })                // la pressione lunga solleva il pezzo
  controlla('tenuto premuto il tavolo mostra il tasto ↻', await conta('[data-f3="ruota"]') === 1 && await page.locator('[data-f3="ruota"]').getAttribute('data-rot') === '0')
  await scatto(page, 'fattoria3d-ruota')
  const bt = await page.locator('[data-f3="ruota"]').boundingBox()
  // il secondo dito tocca il tasto mentre il primo tiene il pezzo
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: centro[0], y: centro[1], id: 0 }, { x: bt.x + bt.width / 2, y: bt.y + bt.height / 2, id: 1 }] })
  await page.waitForSelector('[data-f3="ruota"][data-rot="1"]', { timeout: 2000 }).catch(() => {})
  uguale('il tasto ha girato il pezzo in mano', await page.locator('[data-f3="ruota"]').getAttribute('data-rot'), '1')
  await su()                                                             // tutti i diti su: il pezzo si rilascia dov'è
  await aspetta(async () => (await stato()).cose.find(c => c.id === pan.id).rot === 1)
  const t = (await stato()).cose.find(c => c.id === pan.id)
  uguale('rilasciato, il tavolo resta girato nello stato', t.rot, 1)
  uguale('girare è costato una moneta', M1 - await mon(), 1)
  uguale('e il modello è girato di un quarto', await m3(id => Math.round(window.__fattoria3d.mondo.pezzi.voce(id).grp.rotation.y * 1000), pan.id), Math.round(Math.PI / 2 * 1000))
  controlla('il tasto sparisce a dito alzato', await aspetta(async () => await conta('[data-f3="ruota"]') === 0))
  // il tocco: il contadino non ha niente da fare col tavolo, accanto c'è ↻
  await fermo()
  await tocca(...await schermoDi(t.i + 1, t.j + 1.5))
  await page.waitForSelector('[data-f3="attrezzi"][data-tipo="opzioni"] [data-opzione="gira"]', { timeout: 3000 })
  await scatto(page, 'fattoria3d-opzioni')
  const M2 = await mon()
  await toccaEl('[data-opzione="gira"]')
  uguale('l\'opzione ↻ gira il tavolo', await aspetta(async () => (await stato()).cose.find(c => c.id === pan.id).rot === 2) ? 2 : (await stato()).cose.find(c => c.id === pan.id).rot, 2)
  uguale('e costa come spostarlo', M2 - await mon(), 1)
  uguale('l\'arco resta per girarlo ancora', await conta('[data-opzione="gira"]'), 1)
  await m3(id => { const { motore, mondo } = window.__fattoria3d; motore.mettiVia(id, { gratis: true, forza: true }); mondo.attrezzi.chiudi(); mondo.cambiato() }, pan.id)
  await fermo()
})

/* ── i livelli: un livello che sale porta l'avviso e il pallino sul gettone, e il foglio lo toglie ── */
await blocco('il livello che sale', async () => {
  await m3(() => { const m = window.__fattoria3d.motore; m.s.esperienza = 256; m._spendi(5) })
  controlla('compare l\'avviso del livello', await aspetta(async () => await conta('[data-f3="avviso-livello"]') === 1))
  uguale('il gettone dice il livello 2', (await testo('[data-f3="livello"]')).includes('2'), true)
  controlla('e il pallino sul gettone', await conta('[data-f3="livello-nuovo"]') === 1)
  await page.locator('[data-f3="livello"]').click()
  await page.waitForSelector('[data-f3="livelli"]', { timeout: 3000 })
  controlla('il foglio dei livelli ha il titolo corto', /Livello 2/.test(await testo('[data-f3="livelli"] h2')))
  controlla('e il pallino è spento', await aspetta(async () => await conta('[data-f3="livello-nuovo"]') === 0))
  await chiudiFoglio('[data-f3="livelli"]')
  controlla('la ✕ chiude il foglio dei livelli', await conta('[data-f3="livelli"]') === 0)
})

/* ── le carte di tutte le schede, dai dati: i pezzi, gli edifici unici da costruire, gli strumenti del pennello e le bestie da adottare;
   ognuna (che non sia uno strumento) mostra la sua anteprima 3D, non l'emoji ── */
await blocco('le carte del menu', async () => {
  await apriMenu()
  let carte = 0, senzaFoto = []
  const posseduti = await m3(() => ({ ...window.__fattoria3d.motore.s.posseduti }))   // un edificio già comprato non si offre
  const daMettere = await m3(() => ({ ...window.__fattoria3d.motore.s.magazzino }))   // un magazzino si offre solo se ce n'è uno da mettere
  const stagioneOra = await m3(() => { const st = window.__fattoria3d.mondo.stagione; return st && st.nome || null })
  const visibili = Object.keys(CATEGORIE).filter(k => k !== 'feste' || stagioneOra === 'natale')          // «Feste» è nascosta senza carte: la fiera si vince e l'albero è di Natale
  for (const k of visibili) {
    await vaiScheda(k)
    const pronte = await page.waitForFunction(() => [...document.querySelectorAll('[data-carta]')].every(c => /^(strada|staccionata|cancello|gomma)$/.test(c.dataset.carta) || c.querySelector('img[data-anteprima="pronta"]')), null, { timeout: 30000 }).then(() => true, () => false)
    if (!pronte) senzaFoto.push(k)
    carte += await conta('[data-carta]')
  }
  controlla('ogni carta di pezzo o edificio mostra l\'anteprima 3D, non l\'emoji', senzaFoto.length === 0, senzaFoto.join())
  uguale('le schede hanno tutti i pezzi e gli edifici dei dati e i quattro strumenti', carte, Object.entries(PEZZI).filter(([t, d]) => !d.fiera && !d.dono && (!d.magazzino || daMettere[t] > 0) && (!d.stagione || d.stagione === stagioneOra)).length + Object.keys(EDIFICI).filter(t => !posseduti[t]).length + 4 + 15)          // + le carte degli animali da adottare (scheda Animali: dieci razze e cinque compagni, docs/fattoria3d/adozioni.md)
  await vaiScheda('animali')
  controlla('il recinto non è arrivato: carta in grigio col livello', await conta('[data-carta="recinto"].bloccata') === 1 && /Livello 14/.test(await testo('[data-carta="recinto"]')))
  const schede = await m3(() => [document.documentElement.scrollWidth, innerWidth])
  controlla('le schede non escono dallo schermo di lato', schede[0] <= schede[1], JSON.stringify(schede))
  await vaiScheda('edifici')
  await toccaEl('[data-carta="mulino"]')
  controlla('un edificio unico chiuso dice il livello e non apre l\'offerta', await aspetta(async () => /livello 4/.test(await testo('[data-f3="costruisci-msg"]'))) && await conta('[data-f3="dialogo"]') === 0)
  await chiudiFoglio('[data-f3="costruisci-qui"]')
})

/* ── la macchina (docs/fattoria3d/file.md): il pastificio (id `pasticceria`) in mappa, le ricette chiuse, la fila come in Hay Day ── */
// gli edifici sono pezzi liberi: si mettono nello stato dalla console (come se li avesse costruiti, al loro posto di una volta o dove ci stanno)
const piazza = tipo => m3(t => {
  const { motore, mondo } = window.__fattoria3d, [i, j] = motore.postoPer(t)
  const c = { id: motore.s.prossimoId++, tipo: t, i, j }
  motore.s.cose.push(c); motore._occupa(c, c.id); motore.s.posseduti[t] = true; mondo.cambiato()
}, tipo)
const codaPasta = async () => (await stato()).macchine.pasticceria
await blocco('la macchina', async () => {
  await piazza('pasticceria')
  await m3(() => { const { motore, mondo } = window.__fattoria3d; motore.s.prodotti.farina = 4; motore.s.prodotti.uova = 2; mondo.cambiato() })
  await m3(() => window.__fattoria3d.mondo.azioni.fai({ kind: 'edificio', tipo: 'pasticceria' }))
  await page.waitForSelector('[data-f3="macchina"][data-macchina="pasticceria"]', { timeout: 3000 })
  controlla('il menu della pasticceria porta anche il suo bersaglio', await conta('[data-f3="pasticceria"]') === 1)
  uguale('mostra tutte le ricette della pasticceria', await conta('[data-f3="macchina"] [data-ricetta]'), Object.values(RICETTE).filter(r => r.dove === 'pasticceria').length)
  controlla('una ricetta chiusa dice il livello', new RegExp('livello ' + RICETTE.pasta.liv).test(await page.locator('[data-f3="macchina"] .ricetta.chiusa').first().innerText()))
  await page.locator('[data-ricetta="pasta"]').click({ force: true })
  controlla('toccarla non la fa partire e dice perché', await aspetta(async () => await conta('[data-f3="macchina-msg"]') === 1) && (await codaPasta()).coda.length === 0)
  await esperienza(1e6)
  await page.waitForSelector('[data-ricetta="pasta"]:not(.chiusa)', { timeout: 3000 })
  await page.locator('[data-ricetta="pasta"]').click()
  const cotto = await aspetta(async () => { const s = await stato(); return s.macchine.pasticceria.coda.length === 1 && s }) || await stato()
  controlla('aperta, la ricetta parte e scala gli ingredienti', cotto.macchine.pasticceria.coda.length === 1 && cotto.prodotti.farina === 2 && cotto.prodotti.uova === 1)
  await page.waitForFunction(() => document.querySelector('[data-f3="macchina"] [data-ricetta="pasta"] [data-merce="farina"] canvas'), null, { timeout: 5000 }).catch(() => {})   // la faccia arriva quando lo sprite ha disegnato
  controlla('gli ingredienti hanno la loro faccia (il disegno, non l\'emoji)', await conta('[data-f3="macchina"] [data-ricetta="pasta"] [data-merce="farina"] canvas') === 1)
  await m3(() => { const m = window.__fattoria3d.motore, o = m.ora; m.ora = () => o() + 8 * 60000 })          // la pasta ci mette sette minuti
  await page.waitForSelector('[data-f3="ritira"]', { timeout: 3000 })
  await page.locator('[data-f3="ritira"]').click()
  uguale('«Ritira tutto» porta la pasta in dispensa', await aspetta(async () => (await stato()).prodotti.pasta === 1) ? 1 : (await stato()).prodotti.pasta, 1)
  // il foglio come in Hay Day: il posto di partenza e i cinque vani da comprare, la pila dei pronti, il numero sulla carta, e il dito che trascina
  uguale('la fila parte con un posto, libero', await conta('[data-f3="posto"][data-stato="libero"]') + ':' + await conta('[data-f3="posto"]'), '1:1')
  uguale('…e cinque vani chiusi col prezzo, il primo in evidenza (🪙 20)', [await conta('[data-f3="posto-chiuso"]'), await conta('[data-f3="posto-chiuso"][data-prossimo="true"]'), (await testo('[data-f3="posto-chiuso"][data-prossimo="true"]')).replace(/\s+/g, ' ').trim()].join('|'), '5|1|＋ 🪙 20')
  uguale('la sezione porta il nome della macchina: il pastificio ha il forno', (await page.locator('[data-f3="macchina-dentro"]').textContent()).trim(), 'Nel forno')
  controlla('c\'è la pila dei pronti', await conta('[data-f3="pronti"]') === 1)
  await m3(() => { const { motore, mondo } = window.__fattoria3d; motore.s.prodotti.farina = 4; motore.s.prodotti.uova = 3; mondo.cambiato() })
  await page.waitForSelector('[data-ricetta="pasta"][data-n="1"]', { timeout: 3000 }).catch(() => {})
  uguale('il numero sulla carta dice quanta pasta c\'è in magazzino (non quante se ne fanno)', await page.locator('[data-ricetta="pasta"]').getAttribute('data-n'), '1')
  controlla('niente riga «In dispensa» in fondo al foglio', !(await testo('[data-f3="macchina"]')).includes('In dispensa'))
  // un tocco vero (CDP) mette in fila
  await toccaEl('[data-ricetta="pasta"]')
  uguale('un tocco sulla carta la mette in fila', await aspetta(async () => (await codaPasta()).coda.length === 1) ? 1 : (await codaPasta()).coda.length, 1)
  controlla('il primo posto non è più libero', await aspetta(async () => (await page.locator('[data-f3="posto"][data-posto="0"]').getAttribute('data-stato')) !== 'libero'))
  // il secondo posto si compra con un tocco sul vano: senza monete il rifiuto dice quante servono e non cambia niente; con le monete il vano diventa libero
  const espPrima = (await stato()).esperienza
  await m3(() => { const m = window.__fattoria3d.motore; m.borsa.paga(m.monete() - 5); window.__fattoria3d.mondo.cambiato() })
  await toccaEl('[data-f3="posto-chiuso"][data-prossimo="true"]')
  controlla('senza monete: «Servono 🪙 20», il posto non c\'è', await aspetta(async () => /Servono.*20/.test(await testo('[data-f3="macchina-msg"]'))) && (await codaPasta()).posti === 1 && await mon() === 5)
  await m3(() => { const m = window.__fattoria3d.motore; m.borsa.paga(-(5000 + 20)); window.__fattoria3d.mondo.cambiato() })
  const prePosto = await mon()
  await toccaEl('[data-f3="posto-chiuso"][data-prossimo="true"]')
  const conPosto = await aspetta(async () => { const s = await stato(); return s.macchine.pasticceria.posti === 2 && s }) || await stato()
  controlla('con le monete il secondo posto si compra (🪙 20, senza conferma) e conta come esperienza', conPosto.macchine.pasticceria.posti === 2 && prePosto - await mon() === 20 && conPosto.esperienza - espPrima === 20, JSON.stringify([conPosto.macchine.pasticceria.posti, prePosto - await mon(), conPosto.esperienza - espPrima]))
  await aspetta(async () => await conta('[data-f3="posto"]') === 2)
  uguale('ora i posti sono due e i vani chiusi quattro, col prossimo a 🪙 40', [await conta('[data-f3="posto"]'), await conta('[data-f3="posto-chiuso"]'), (await testo('[data-f3="posto-chiuso"][data-prossimo="true"]')).replace(/\s+/g, ' ').trim()].join('|'), '2|4|＋ 🪙 40')
  // il dito tenuto e poi trascinato: la carta è un fantasma che segue, e lasciata su un posto libero va in fila
  async function portaCarta(sel, verso) {
    const da = await centroDi(sel)
    await giu(da[0], da[1]); await attendi(page, 260)
    for (let k = 1; k <= 8; k++) { await muovi(da[0] + (verso[0] - da[0]) * k / 8, da[1] + (verso[1] - da[1]) * k / 8); await attendi(page, 30) }
    return async () => { await attendi(page, 60); await su() }
  }
  let lascia = await portaCarta('[data-ricetta="pasta"]', await centroDi('[data-f3="posto"][data-posto="1"]'))
  controlla('mentre si trascina c\'è il fantasma', await conta('[data-f3="trascina-fantasma"]') === 1)
  await lascia()
  const inFila = async () => { const q = await codaPasta(); return q.coda.length + (q.pronti.pasta || 0) }
  uguale('lasciata su un posto, va in fila (la prima pasta può aver finito: contano anche i pronti)', await aspetta(async () => await inFila() === 2) ? 2 : await inFila(), 2)
  controlla('finito il gesto il fantasma sparisce', await aspetta(async () => await conta('[data-f3="trascina-fantasma"]') === 0))
  // lasciata altrove non succede niente: né ingredienti persi né posti presi
  await m3(() => { const { motore, mondo } = window.__fattoria3d; motore.s.prodotti.farina = 4; motore.s.prodotti.uova = 3; mondo.cambiato() })
  await attendi(page, 300)                                                  // il foglio rilegge le scorte al battito
  const codaPrima = (await codaPasta()).coda.length   // non fisso a 2: il primo posto può finire di cuocere (7 s) mentre il test va
  const dove = await page.locator('[data-ricetta="pasta"]').boundingBox()
  lascia = await portaCarta('[data-ricetta="pasta"]', [dove.x + dove.width / 2 + (dove.x > 195 ? -90 : 90), dove.y + dove.height / 2])
  await lascia()
  await aspetta(async () => await conta('[data-f3="trascina-fantasma"]') === 0)
  await attendi(page, 300)                                                  // non deve succedere niente: non c'è un segno da aspettare
  const dopoDrag = await stato()
  controlla('lasciata fuori dalla fila annulla senza perdere niente', dopoDrag.macchine.pasticceria.coda.length <= codaPrima && dopoDrag.prodotti.farina === 4 && dopoDrag.prodotti.uova === 3, JSON.stringify([dopoDrag.macchine.pasticceria.coda.length, dopoDrag.prodotti.farina, dopoDrag.prodotti.uova]))
  await chiudiFoglio('[data-f3="macchina"]')
})

/* ── gli edifici col «!»: la gelateria (livello 34) non c'è finché non la si compra; chiusa dice il livello, aperta ha il «!» e si compra dal menu ── */
await blocco('gli edifici da costruire', async () => {
  await esperienza(0)
  await fermo()                                                             // l'eroe esulta se è salito di livello: il tocco sarebbe ignorato
  controlla('un edificio non costruito non è in scena: né fantasma né cartello', await m3(() => !window.__fattoria3d.mondo.pezzi.voci.has('gelateria') && ![...window.__fattoria3d.mondo.pezzi.voci.values()].some(v => v.tipo === 'gelateria')))
  controlla('a livello 1 niente «!» sul tasto Compra', await aspetta(async () => await conta('[data-f3="costruisci-esclama"]') === 0))
  await apriMenu()
  await vaiScheda('edifici')
  await toccaEl('[data-carta="gelateria"]')
  controlla('un edificio chiuso dice il livello dalla sua carta', await aspetta(async () => /livello 34/.test(await testo('[data-f3="costruisci-msg"]'))) && await conta('[data-carta="gelateria"].bloccata') === 1 && await conta('[data-f3="dialogo"]') === 0)
  await chiudiFoglio('[data-f3="costruisci-qui"]')
  await m3(() => { window.__fattoria3d.motore.s.esperienza = 1e6; window.__fattoria3d.motore.borsa.paga(-1000) })
  controlla('aperto dal livello e non costruito: il «!» pulsa sul tasto Compra', await aspetta(async () => await conta('[data-f3="az-costruisci"] [data-f3="costruisci-esclama"]') === 1))
  await fermo()
  await apriMenu()
  await vaiScheda('edifici')
  controlla('e sulla scheda Edifici, e sulle carte da costruire', await conta('[data-scheda="edifici"] [data-f3="scheda-esclama"]') === 1 && await conta('[data-carta="gelateria"] [data-f3="carta-esclama"]') === 1 && await conta('[data-scheda="campi"] [data-f3="scheda-esclama"]') === 0)
  controlla('nella scheda Edifici le carte col «!» stanno in cima', await m3(() => { const c = [...document.querySelectorAll('[data-carta]')]; const k = c.findIndex(x => !x.querySelector('[data-f3="carta-esclama"]')); return k < 0 || c.slice(k).every(x => !x.querySelector('[data-f3="carta-esclama"]')) }))
  await vaiScheda('decori')
  controlla('le decorazioni non hanno mai il «!»', await conta('[data-carta]') > 0 && await conta('[data-carta] [data-f3="carta-esclama"]') === 0)
  await vaiScheda('edifici')
  const prima = await stato(), monPrima = await mon()
  await toccaEl('[data-carta="gelateria"]')
  const dopoGel = await aspetta(async () => { const s = await stato(); return s.posseduti.gelateria && s }) || await stato(), gel = dopoGel.cose.find(c => c.tipo === 'gelateria')
  controlla('dalla carta si compra e si mette: l\'edificio è una cosa nello stato, sul terreno suo', !!gel && dopoGel.posseduti.gelateria === true && prima.cose.length + 1 === dopoGel.cose.length)
  controlla('si paga il prezzo al rilascio, e non c\'è nessun dialogo di conferma', monPrima - await mon() === EDIFICI.gelateria.prezzo && await conta('[data-f3="dialogo"]') === 0)
  controlla('costruito, il «!» sparisce (resta se ne mancano altri)', await m3(() => window.__fattoria3d.motore.edificiDaCostruire().includes('gelateria')) === false)
  controlla('la gelateria è in scena, dove l\'abbiamo messa', await aspetta(() => m3(() => [...window.__fattoria3d.mondo.pezzi.voci.values()].some(v => v.tipo === 'gelateria' && v.edificio))))
  // toccare l'edificio apre il SUO menu
  await piazza('mulino')
  await m3(() => window.__fattoria3d.mondo.azioni.fai({ kind: 'edificio', tipo: 'mulino' }))
  await page.waitForSelector('[data-f3="macchina"][data-macchina="mulino"]', { timeout: 5000 })
  uguale('il mulino mostra le sue ricette (mangime, farina, pappa di mais)', await conta('[data-f3="macchina"] [data-ricetta]'), 3)
  await chiudiFoglio('[data-f3="macchina"]')
})

/* ── il banco degli ordini (docs/fattoria3d/ordini.md): il foglio, consegnare, la roba che manca, cambiare. Lo stato si prepara dalla
   console; il tasto «Consegna» si preme col dito vero. Quando la bacheca si chiede lo dice `unita/fattoria3d-ordini`. ── */
const toccaSu = async sel => { await page.locator(sel).first().scrollIntoViewIfNeeded(); await toccaEl(sel) }
const apriBanco = async () => { await m3(() => window.__fattoria3d.mondo.ui.apriBanco()); await page.waitForSelector('[data-f3="banco"]', { timeout: 3000 }) }
await blocco('il banco degli ordini', async () => {
  // livello alto ma senza bacheca: il foglio spiega cosa fare
  await apriBanco()
  controlla('banco chiuso: il foglio dice di mettere una bacheca (o una bancarella)', /bacheca.*bancarella/i.test(await testo('[data-f3="banco-chiuso"]')))
  uguale('e non mostra ordini', await conta('[data-ordine]'), 0)
  await chiudiFoglio('[data-f3="banco"]')
  // la bacheca messa sul prato: il banco si riempie (e i suoi foglietti sono gli ordini)
  const messa = await m3(() => {
    const { motore, mondo } = window.__fattoria3d; motore.s.magazzino.bacheca = (motore.s.magazzino.bacheca || 0) + 1
    for (let i = -14; i < 14; i++) for (let j = -12; j < 12; j++) if (motore.mettiPezzo('bacheca', i, j).ok) { mondo.pezzi.sincronizza(); mondo.cambiato(); return true }
    return false
  })
  controlla('una bacheca si mette sul prato', messa)
  uguale('i posti sono quelli del livello (esperienza altissima)', await aspetta(() => m3(() => window.__fattoria3d.motore.ordini().length)), POSTI(ULTIMO))
  // i primi due ordini si fissano: uno è una cosa sola (giallo), l'altro due raccolti (verde). Il caso li farebbe tutti rosa una volta su sei, e il test dei colori sarebbe ballerino
  await m3(() => { const o = window.__fattoria3d.motore.s.ordini.aperti; o[0].chiede = { grano: 1 }; o[1].chiede = { grano: 1, mais: 1 }; window.__fattoria3d.mondo.cambiato() })
  // la roba per tutti gli ordini
  await m3(() => {
    const { motore, mondo } = window.__fattoria3d
    for (const o of motore.ordini()) for (const c of o.chiede || []) { if (c.prodotto) motore.s.prodotti[c.k] = 9; else motore.s.merci[c.k] = 9 }
    mondo.cambiato()
  })
  const fogli = () => m3(() => { const g = window.__fattoria3d.mondo.pezzi.gruppi().find(x => x.userData.mostraFogli); return !!g && g.userData.fogli.filter(f => f.visible).length === Math.min(6, window.__fattoria3d.motore.ordini().length) })
  controlla('sulla bacheca i foglietti appuntati sono al più sei, uno per ordine', await aspetta(fogli))
  // i tipi degli ordini escono a caso (verde, rosa, giallo): i colori dei foglietti sono tanti quanti i tipi diversi, non «più di uno»
  controlla('e hanno un colore per ogni tipo di ordine', await m3(() => { const { motore, mondo } = window.__fattoria3d, g = mondo.pezzi.gruppi().find(x => x.userData.mostraFogli); return new Set(g.userData.fogli.filter(f => f.visible).map(f => f.userData.carta.material.color.getHex())).size === new Set(motore.ordini().filter(o => !o.attesa).slice(0, 6).map(o => o.tipo || 'verde')).size }))
  controlla('e il cartello dice «🧺 N pronti!»', await aspetta(() => m3(n => [...document.querySelectorAll('.f3-badge')].some(e => !e.hidden && new RegExp('🧺 ' + n + ' pronti').test(e.textContent)), POSTI(ULTIMO))))
  await apriBanco()
  uguale('il foglio mostra un biglietto per posto', await conta('[data-f3="biglietto"]'), POSTI(ULTIMO))
  uguale('tutti consegnabili', await conta('[data-ordine][data-pronto="true"]'), POSTI(ULTIMO))
  uguale('uno solo è scelto (il primo consegnabile)', await conta('[data-sel="true"]'), 1)
  controlla('il dettaglio dice cosa si chiede (le merci)', await conta('[data-dettaglio="0"] [data-chiede]') >= 1)
  controlla('il premio è in esperienza, non in monete', /^\+\d+ ⭐$/.test((await testo('[data-dettaglio] [data-f3="premio"]')).trim()))
  await toccaSu('[data-ordine="1"]')
  controlla('toccando un altro biglietto lo si sceglie', await aspetta(async () => await conta('[data-ordine="1"][data-sel="true"]') === 1 && await conta('[data-dettaglio="1"]') === 1))
  await toccaSu('[data-ordine="0"]')
  await page.waitForSelector('[data-ordine="0"][data-sel="true"]', { timeout: 3000 })
  // consegnare: l'esperienza sale del premio, la roba scende, il posto si riempie e il contatore avanza
  const ordPrima = await m3(() => { const m = window.__fattoria3d.motore, o = m.ordini()[0]; return { xp: m.esperienza(), premio: o.premio, id: o.id } })
  const monetePrima = await monete()
  await toccaSu('[data-dettaglio="0"] [data-f3="consegna"]')
  await aspetta(() => m3(xp => window.__fattoria3d.motore.esperienza() !== xp, ordPrima.xp))
  const dopo = await m3(() => { const m = window.__fattoria3d.motore, o = m.ordini()[0]; return { xp: m.esperienza(), id: o.id, nuovo: !o.attesa } })
  uguale('consegnando, l\'esperienza sale del premio', dopo.xp - ordPrima.xp, ordPrima.premio)
  controlla('e il posto ha un ordine nuovo', dopo.nuovo && dopo.id !== ordPrima.id)
  controlla('il foglio dice a chi e quanto', await aspetta(async () => /Consegnato a .+: \+\d+ ⭐/.test(await testo('[data-f3="banco-msg"]'))))
  uguale('non entrano monete', await monete(), monetePrima)
  uguale('il contatore degli ordini avanza', ((await leggiProfilo(page)).totals || {}).fattoria3dOrdini, 1)
  // roba che manca: il tasto è grigio, il tocco non consegna e dice cosa manca
  await m3(() => { const m = window.__fattoria3d.motore; for (const k of Object.keys(m.s.merci)) m.s.merci[k] = 0; m.s.prodotti = {}; window.__fattoria3d.mondo.cambiato() })
  uguale('senza roba nessun ordine è consegnabile', await aspetta(async () => await conta('[data-ordine][data-pronto="true"]') === 0) ? 0 : 1, 0)
  await toccaSu('[data-ordine="1"]')
  await page.waitForSelector('[data-dettaglio="1"] [data-f3="consegna"]', { timeout: 3000 })
  uguale('e il tasto è spento', await page.locator('[data-dettaglio="1"] [data-f3="consegna"]').getAttribute('aria-disabled'), 'true')
  const xpPrima = await m3(() => window.__fattoria3d.motore.esperienza())
  await toccaSu('[data-dettaglio="1"] [data-f3="consegna"]')
  controlla('toccarlo dice cosa manca', await aspetta(async () => /Ti mancano/.test(await testo('[data-f3="banco-msg"]'))))
  uguale('e non consegna niente', await m3(() => window.__fattoria3d.motore.esperienza()), xpPrima)
  uguale('il posto resta occupato', await conta('[data-ordine="1"][data-pronto="false"]'), 1)
  // cambiare: il posto riposa e mostra il conto alla rovescia
  await toccaSu('[data-dettaglio="1"] [data-f3="cambia"]')
  await page.waitForSelector('[data-ordine="1"] [data-f3="ordine-attesa"]', { timeout: 3000 })
  controlla('il posto in riposo dice quando torna', /Torna fra (4:5\d|5:00)/.test(await testo('[data-ordine="1"] [data-f3="ordine-attesa"]')))
  uguale('cambiare non dà esperienza', await m3(() => window.__fattoria3d.motore.esperienza()), xpPrima)
  await scatto(page, 'fattoria3d-banco')
  await chiudiFoglio('[data-f3="banco"]')
})

/* ── gli animali da cortile (docs/fattoria3d/animali.md): nutrire, aspettare, raccogliere, comprare un'altra bestia dal cartello ──
   Il tocco arriva dove arriva l'eroe: qui si chiama `azioni.fai` come farebbe lui. I numeri vengono dai dati; che un pollaio con le
   bestie non si metta via lo dice `unita/fattoria3d`. */
const passa = ms => m3(ms => { const m = window.__fattoria3d.motore, o = m.ora; m.ora = () => o() + ms }, ms)
const mettiCortile = tipo => m3(t => {
  const { motore, mondo } = window.__fattoria3d; motore.s.magazzino[t] = (motore.s.magazzino[t] || 0) + 1
  // il posto libero più vicino al centro dello schermo: la nuvoletta dei cibi gli sta accanto, e non sotto la barra in alto
  const r = mondo.canvas.getBoundingClientRect(), buoni = []
  for (let i = -14; i < 14; i++) for (let j = -12; j < 12; j++) if (motore.puoMettere(t, i, j).ok) {
    const [px, py] = mondo.proietta({ x: i + 1, y: 0, z: j + 1 }); buoni.push([Math.hypot(px - r.width / 2, py - r.height / 2), i, j])
  }
  buoni.sort((a, b) => a[0] - b[0])
  if (!buoni.length || !motore.mettiPezzo(t, buoni[0][1], buoni[0][2]).ok) return null
  mondo.pezzi.sincronizza(); mondo.cambiato()
  return motore.cosaSu(buoni[0][1], buoni[0][2]).id
}, tipo)
// un traguardo dell'albo (il quinto pezzo messo, «Tutto a posto») si presenta col suo velo: un bambino lo tocca e va avanti
const chiudiTraguardo = async () => { if (await conta('.velo')) { await toccaEl('.velo'); await page.waitForSelector('.velo', { state: 'detached', timeout: 3000 }) } }
const tocca3d = async id => { await fermo(); await chiudiTraguardo(); await m3(id => window.__fattoria3d.mondo.azioni.fai({ kind: 'cosa', id }), id); await quieta() }      // ferma anche la camera: la nuvoletta si misura a schermo
const bestieDi = id => m3(id => window.__fattoria3d.motore.cose.find(c => c.id === id).bestie.map(b => b.fine), id)
const nuvola = k => page.waitForSelector(`[data-f3="attrezzi"][data-tipo="recinto"] [data-cibo="${k}"]`, { timeout: 8000 })
const cartelloDi = e => page.locator(`[data-f3="cartello-bestie"][data-pezzo="${e}"]`)   // per pezzo: il cartello non ha più il conto
const compraDa = e => cartelloDi(e).locator('[data-f3="compra-bestia"]')
const scena3 = id => m3(id => { const v = window.__fattoria3d.mondo.pezzi.voce(id); return v && (v.grp.userData.bestie ? v.grp.userData.bestie.length : v.grp.userData.pecore.length) }, id)
const AN = ANIMALI.pollaio, ST = ANIMALI.stalla
await blocco('il pollaio', async () => {
  await m3(() => {       // niente sassi: pollaio, stalla e recinto ci stanno accanto agli edifici di prima
    const { motore, mondo } = window.__fattoria3d; motore.s.esperienza = 1e6; motore.borsa.paga(-1000)
    for (const o of motore.ostacoli) if (!o.tolto) motore._togliSenzaPagare(o)
    mondo.terreno.ridisegnaTutto(); mondo.cambiato()
  })
  const idP = await mettiCortile('pollaio')
  controlla('il pollaio si mette sul prato', !!idP)
  // senza mangime da dare: dice cosa serve, la bestia ha ancora fame (anche con i raccolti che prima si mangiavano)
  await m3(() => { const m = window.__fattoria3d.motore; for (const k of Object.keys(m.s.merci)) m.s.merci[k] = 5; delete m.s.prodotti.becchime; delete m.s.prodotti.foraggio })
  await tocca3d(idP)
  await nuvola(AN.mangia[0])
  controlla('senza becchime la nuvoletta lo mostra spento e dice cosa serve', await conta(`[data-cibo="${AN.mangia[0]}"].manca`) === 1 && /becchime/i.test(await testo('[data-f3="attrezzi-riga"]')))
  await toccaEl(`[data-cibo="${AN.mangia[0]}"]`)
  await attendi(page, 300)                                                  // non deve succedere niente
  controlla('senza becchime la gallina resta affamata, anche coi raccolti', (await bestieDi(idP))[0] === null)
  // nutrire: scala il mangime e la bestia comincia a lavorare
  await m3(([k, n]) => { window.__fattoria3d.motore.s.prodotti[k] = n }, [AN.mangia[0], AN.pasti * 5])
  await tocca3d(idP)
  await nuvola(AN.mangia[0])
  controlla('toccare il pollaio non nutre da solo: chiede', (await bestieDi(idP))[0] === null)
  uguale('la nuvoletta dice quanto mangime hai', await testo(`[data-cibo="${AN.mangia[0]}"] [data-f3="gettone-conto"]`), '×' + AN.pasti * 5)
  await toccaEl(`[data-cibo="${AN.mangia[0]}"]`)
  controlla('il mangime dato alla gallina la nutre', await aspetta(async () => (await bestieDi(idP))[0] !== null, 5000))
  uguale('e il pasto scala dal mangime', await m3(k => window.__fattoria3d.motore.s.prodotti[k], AN.mangia[0]), AN.pasti * 4)      // il mangime sta in dispensa, non fra i raccolti (docs/fattoria3d/mangime-e-catena.md)
  // lavora: toccarlo dice quanto manca e basta; le bestie in più si comprano dal cartello sopra il pollaio (niente dialogo, niente conferma)
  await tocca3d(idP)
  controlla('toccare il pollaio che lavora non apre dialoghi', await conta('[data-f3="dialogo"]') === 0)
  await compraDa('pollaio').waitFor({ timeout: 3000 })
  controlla('il cartello dice quanto costa un\'altra gallina, senza conto n/max', (await compraDa('pollaio').innerText()).includes('🪙 ' + AN.prezzoBestia) && !/\d\/\d/.test(await cartelloDi('pollaio').innerText()))
  uguale('nella scena c\'è una gallina sola', await scena3(idP), 1)
  // senza monete il pulsante è grigio ma risponde, e non compra
  await m3(() => { const m = window.__fattoria3d.motore; m.borsa.paga(m.monete()) })
  await aspetta(async () => await compraDa('pollaio').getAttribute('aria-disabled') === 'true')
  uguale('senza monete il pulsante è spento (aria-disabled)', await compraDa('pollaio').getAttribute('aria-disabled'), 'true')
  await compraDa('pollaio').dispatchEvent('click')
  await attendi(page, 300)                                                  // non deve succedere niente
  uguale('e non compra', (await bestieDi(idP)).length, 1)
  await m3(() => { const m = window.__fattoria3d.motore; m.borsa.paga(-1000) })
  await aspetta(async () => await compraDa('pollaio').getAttribute('aria-disabled') !== 'true')
  const monP = await monete()
  await compraDa('pollaio').dispatchEvent('click')
  uguale('comprarla aggiunge una bestia', await aspetta(async () => (await bestieDi(idP)).length === 2) ? 2 : (await bestieDi(idP)).length, 2)
  uguale('e costa quanto dicono i dati, più il pasto della nuova arrivata (🪙1 come in 2D)', monP - await monete(), AN.prezzoBestia + AN.costo)
  uguale('nella scena le galline sono due', await aspetta(async () => await scena3(idP) === 2) ? 2 : await scena3(idP), 2)
  controlla('il prezzo sul cartello sale', await aspetta(async () => (await compraDa('pollaio').innerText()).includes('🪙 ' + (AN.prezzoBestia + AN.rincaroBestia))))
  // il tempo passa: le uova aspettano, si raccolgono in un gesto, il contatore e il HUD le vedono
  await passa(AN.ms + 1000)
  await tocca3d(idP)
  uguale('raccogliere porta le uova in dispensa (le due galline nutrite: quella di partenza e quella comprata, che ha avuto la sua pappa)', await aspetta(async () => (await stato()).prodotti.uova === 2) ? 2 : (await stato()).prodotti.uova, 2)
  controlla('le bestie hanno di nuovo fame', (await bestieDi(idP)).every(f => f === null))
  await m3(() => { const { mondo, motore } = window.__fattoria3d; mondo.ui.apriMagazzino(motore.edificiDelSilo('stalla').length ? 'stalla' : 'terra') })
  controlla('il magazzino mostra le uova (la loro faccia)', !!await page.waitForSelector('[data-f3="magazzino"] button[data-merce="uova"]', { timeout: 3000 }).catch(() => null))
  await chiudiFoglio('[data-f3="magazzino"]')
  uguale('il contatore delle uova avanza', ((await leggiProfilo(page)).totals || {}).fattoria3dUova, 2)
})
await blocco('la stalla e il recinto', async () => {
  await m3(() => window.__fattoria3d.motore.borsa.paga(-1000))           // il pasto si paga: le monete ci sono
  const idS = await mettiCortile('stalla')
  controlla('la stalla si mette sul prato', !!idS)
  await m3(([k, n]) => { window.__fattoria3d.motore.s.prodotti[k] = n }, [ST.mangia[0], ST.pasti * 3])
  await tocca3d(idS)
  await nuvola(ST.mangia[0])
  await toccaEl(`[data-cibo="${ST.mangia[0]}"]`)
  controlla('il mangime dato alla mucca la nutre', await aspetta(async () => (await bestieDi(idS))[0] !== null, 5000), await page.locator('.f3-fumetto').allInnerTexts().then(t => t.join()))
  await passa(ST.ms + 1000)
  await tocca3d(idS)
  uguale('raccogliere porta il latte in dispensa', await aspetta(async () => (await stato()).prodotti.latte === 1) ? 1 : (await stato()).prodotti.latte, 1)
  uguale('il contatore del latte avanza', ((await leggiProfilo(page)).totals || {}).fattoria3dLatte, 1)
  await m3(() => { const { mondo, motore } = window.__fattoria3d; mondo.ui.apriMagazzino(motore.edificiDelSilo('stalla').length ? 'stalla' : 'terra') })
  controlla('il magazzino mostra anche il latte', !!await page.waitForSelector('[data-f3="magazzino"] button[data-merce="latte"]', { timeout: 3000 }).catch(() => null))
  await chiudiFoglio('[data-f3="magazzino"]')
  // la stalla e il recinto funzionano allo stesso modo: una bestia nel prezzo, le altre dal cartello, fino alla capienza
  await compraDa('stalla').waitFor({ timeout: 3000 })
  await compraDa('stalla').dispatchEvent('click')
  await aspetta(async () => await scena3(idS) === 2)
  uguale('una seconda mucca dal cartello della stalla', [(await bestieDi(idS)).length, await scena3(idS)].join(), '2,2')
  const idR = await mettiCortile('recinto')
  controlla('il recinto si mette sul prato', !!idR)
  const pecoreDi = id => m3(id => window.__fattoria3d.motore.cose.find(c => c.id === id).pecore.map(p => p.eta), id)
  uguale('il recinto parte con una pecora sola', (await pecoreDi(idR)).join(), 'adulta')
  await compraDa('recinto').waitFor({ timeout: 3000 })
  await compraDa('recinto').dispatchEvent('click')
  await aspetta(async () => await scena3(idR) === 2)
  uguale('la seconda pecora arriva adulta, anche nella scena', [(await pecoreDi(idR)).join(), await scena3(idR)].join(), 'adulta,adulta,2')
  for (let k = 0; k < 4; k++) await compraDa('recinto').dispatchEvent('click').catch(() => {})
  await aspetta(async () => await compraDa('recinto').isHidden())
  uguale('al tetto le pecore sono quattro e il pulsante sparisce', [(await pecoreDi(idR)).length, await compraDa('recinto').isHidden()].join(), '4,true')
})

/* ── la cache dei modelli (scena3d/cache-modelli.js): 50 pose e 50 rimozioni, e 10 fantasmi, non fanno crescere le geometrie né le trame ──
   Si misura dopo un primo giro di prova (una geometria o una trama si carica in GPU la prima volta che si vede), poi il resto deve restare piatto. */
await blocco('la memoria della GPU', async () => {
  const r = await m3(async () => {
    const { motore, mondo } = window.__fattoria3d, info = mondo.renderer.info, quadro = () => new Promise(ok => requestAnimationFrame(() => requestAnimationFrame(ok)))
    const celle = []
    for (let i = -14; i < 13; i++) for (let j = -12; j < 11; j++) if (motore.puoMettere('aiuola', i, j).ok) celle.push([i, j])
    const soldi = motore.monete(); motore.borsa.paga(-5000)
    const ids = []
    const giro = async (da, a) => {
      for (let n = da; n < a; n++) {
        const [i, j] = celle[1 + (n % (celle.length - 1))], r = motore.compraEMetti('aiuola', i, j); mondo.pezzi.sincronizza()
        if (r.ok) ids.push(r.cosa.id)
        await quadro()
        if (n % 2 && ids.length) { motore.mettiVia(ids.pop(), { gratis: true }); mondo.pezzi.sincronizza() }
        if (n % 5 === 0) { mondo.costruzione.parcheggia('panchina', celle[0][0], celle[0][1]); await quadro(); mondo.costruzione.annullaTrascinamento() }
      }
    }
    for (let n = 0; n < 60 && mondo.scaldo && mondo.scaldo.restanti; n++) await quadro()       // il riscaldamento ha finito (o ha rinunciato)
    await giro(0, 10)
    const prima = { g: info.memory.geometries, t: info.memory.textures }
    await giro(10, 60)
    for (const id of ids.splice(0)) { motore.mettiVia(id, { gratis: true }); mondo.pezzi.sincronizza() }
    await quadro(); await quadro()
    const dopo = { g: info.memory.geometries, t: info.memory.textures }
    const a = mondo.pezzi.modello('aiuola'), b = mondo.pezzi.modello('aiuola')
    const condivisa = a.children[0].geometry === b.children[0].geometry
    motore.borsa.paga(motore.monete() - soldi)
    return { prima, dopo, condivisa, scaldo: mondo.scaldo ? mondo.scaldo.restanti : -1 }
  })
  uguale('dopo 50 pose, 50 rimozioni e 10 fantasmi le geometrie in GPU non crescono', r.dopo.g, r.prima.g)
  uguale('…e le trame nemmeno', r.dopo.t, r.prima.t)
  controlla('due istanze dello stesso modello condividono la geometria', r.condivisa)
  nota(`geometrie in GPU: ${r.prima.g} → ${r.dopo.g}; trame ${r.prima.t} → ${r.dopo.t}; riscaldamento: ancora ${r.scaldo} compiti`)
})

/* ── la pesca: il molo sul lago, un tocco sull'acqua, il galleggiante, il pesce (docs/fattoria3d/geografia-e-pesca.md); il mare che vuole
   il porticciolo e la sua resa li dice `unita/fattoria3d-geografia` ── */
await blocco('la pesca', async () => {
  await fermo()
  const pronto = await m3(() => {
    const { motore, mondo } = window.__fattoria3d
    motore.s.esperienza = Math.max(motore.s.esperienza, 1e6); motore.borsa.paga(-3000)                      // il livello e le monete ci sono: la prova è sul gesto, non sul prezzo
    for (const id of ['5_3', '6_3', '7_3', '8_3', '9_3']) motore.compraLotto(id)
    for (const o of motore.ostacoli) if (!o.tolto) motore._togliSenzaPagare(o)
    for (const a of motore.alberi) if (!a.tagliato) { a.tagliato = true; motore.tagliati.add(a.n); motore.s.tagliati.push(a.n) }
    mondo.terreno.ridisegnaTutto()
    let posto = null
    for (let j = 0; j < 4 && !posto; j++) for (let i = 17; i < 30 && !posto; i++) if (!motore.acqua(i, j) && motore.acqua(i + 1, j) && motore.acqua(i + 2, j) && motore.puoMettere('molo', i, j).ok) posto = [i, j]
    if (!posto) return null
    const m = motore.compraEMetti('molo', posto[0], posto[1]); mondo.cambiato()
    mondo.eroe.x = posto[0] - 1.5; mondo.eroe.z = posto[1] + 0.5; mondo.eroe.percorso = []; mondo.camera.segui()
    return { posto, ok: m.ok, id: m.ok && m.cosa.id }
  })
  controlla('un lago a est e un posto dove il molo parte dalla riva', !!pronto && pronto.ok, JSON.stringify(pronto))
  const [mi, mj] = pronto.posto
  await page.waitForFunction(id => !!window.__fattoria3d.mondo.pezzi.voce(id), pronto.id, { timeout: 5000 })
  controlla('il molo è una cosa in scena, calpestabile', await m3(([i, j]) => { const { motore } = window.__fattoria3d; return motore.libera(i + 1, j) && motore.quotaPasso(i + 1.5, j + 0.5) > 0 }, [mi, mj]))
  { const [px, py] = await schermoDi(mi + 3.5, mj + 0.5); await m3(([x, y]) => window.__fattoria3d.mondo.tocca(x, y), [px, py]) }      // l'acqua accanto al molo: va in punta e lancia
  await page.waitForFunction(() => window.__fattoria3d.motore.lenze().length === 1, null, { timeout: 9000 }).catch(() => {})
  uguale('toccando l\'acqua parte la lenza (una sola)', await m3(() => window.__fattoria3d.motore.lenze().length), 1)
  controlla('il contadino ha la canna alzata', await m3(() => !!window.__fattoria3d.mondo.eroe.pescando))
  await scatto(page, 'fattoria3d-pesca')
  // il tempo passa (anche a pagina chiusa: l'ora è assoluta): il pesce abbocca e il contadino, ancora lì, lo ritira da sé
  await m3(() => { const m = window.__fattoria3d.motore, o = m.ora; m.ora = () => o() + 6 * 60000 })         // (cinque minuti di attesa) si somma all'orologio di adesso: più avanti di prima, mai indietro
  await page.waitForFunction(() => (window.__fattoria3d.motore.s.prodotti.pesce || 0) >= 1, null, { timeout: 15000 }).catch(() => {})
  const diag = () => m3(() => { const { motore, mondo } = window.__fattoria3d; return JSON.stringify({ pesca: motore.s.pesca, pesce: motore.s.prodotti.pesce, pescando: !!mondo.eroe.pescando, az: mondo.eroe.az && mondo.eroe.az.tipo, og: [...mondo.pesca3d.oggetti.values()].map(o => o.stato) }) })
  controlla('il pesce è in magazzino', await m3(() => (window.__fattoria3d.motore.s.prodotti.pesce || 0) >= 1), await diag())
  uguale('il banco si ripopola (riposo)', await m3(() => window.__fattoria3d.motore.bancoDi(Object.keys(window.__fattoria3d.motore.s.pesca)[0]).stato), 'riposo')
  controlla('il contatore dei pesci avanza', !!await aspetta(async () => ((await leggiProfilo(page)).totals || {}).fattoria3dPesci >= 1))
  controlla('i pesciolini sono in scena (una InstancedMesh sola)', await m3(() => window.__fattoria3d.mondo.terreno.pesci.mesh.isInstancedMesh))
})
controlla('nessun errore in console', errori.length === 0, errori.join(' · '))
await page.context().close().catch(() => {})

/* ── le feste: #stagione=natale accende cielo, neve e lucine con pochi disegni in più; Halloween offre le zucche ── */
await blocco('Natale', async () => {
  const { page: festa, errori: erroriFesta } = await apriFattoria(browser, { hash: 'fattoria3d&stagione=natale' })
  const n = await festa.evaluate(() => {
    const { mondo } = window.__fattoria3d, st = mondo.stagione, s = mondo.statistiche()
    return { nome: st && st.nome, chiazze: st && st.chiazze.count, fiocchi: !!(st && st.punti && st.punti.visible), calls: s.calls, tri: s.triangoli, cielo: mondo.scena.background.getHex() }
  })
  uguale('a Natale la scena lo sa', n.nome, 'natale')
  controlla('ci sono la neve sul prato e i fiocchi', n.chiazze > 5 && n.fiocchi)
  uguale('il cielo è quello di Natale', n.cielo, 0xdbe6f0)
  await scatto(festa, 'fattoria3d-natale')
  // le draw call della festa: lo stesso fotogramma disegnato con la festa accesa e poi tolta (`via()`: anche la neve sui materiali e i
  // ciuffi d'erba tornano com'erano; renderer.info si azzera a ogni render). La pagina dopo si chiude.
  const conti = await festa.evaluate(() => {
    const { mondo } = window.__fattoria3d, st = mondo.stagione, r = mondo.renderer, chiama = () => { r.info.autoReset = true; r.render(mondo.scena, mondo.camera.cam); return r.info.render.calls }
    const con = chiama(), ciuffi = mondo.terreno.ciuffi.visible, fiato = !!(st.fiato && st.fiato.punti.isPoints)
    let innevate = 0, bestieInnevate = 0
    for (const o of mondo.scena.children) if (o.userData.elemento3d === 'edifici') o.traverse(m => { if (m.isMesh && m.material.userData.innevato) innevate++ })
    mondo.compagni.lista.forEach(c => c.grp.traverse(m => { if (m.isMesh && m.material.userData.innevato) bestieInnevate++ }))
    mondo.eroe.grp.traverse(m => { if (m.isMesh && m.material.userData.innevato) bestieInnevate++ })
    st.via(); mondo.terreno.applica(mondo.q)
    return { con, senza: chiama(), ciuffi, fiato, innevate, bestieInnevate }
  })
  controlla('a Natale la casa ha la neve sul tetto, l\'erba è sotto la neve, c\'è il fiato', conti.innevate > 0 && !conti.ciuffi && conti.fiato, JSON.stringify(conti))
  uguale('il contadino, il cane e i gatti restano senza neve', conti.bestieInnevate, 0)
  controlla('Natale costa pochi disegni in più (≤ 8 draw call)', conti.con - conti.senza <= 8 && conti.con > conti.senza, `${conti.con} contro ${conti.senza}`)
  controlla('nessun errore in console a Natale', erroriFesta.length === 0, erroriFesta.join(' · '))
  await festa.context().close().catch(() => {})
})
await blocco('Halloween', async () => {
  const { page: zuc, errori: erroriZuc } = await apriFattoria(browser, { hash: 'fattoria3d&stagione=halloween' })
  const h = await zuc.evaluate(() => { const { mondo } = window.__fattoria3d; return { nome: mondo.stagione && mondo.stagione.nome } })
  uguale('a Halloween la scena lo sa', h.nome, 'halloween')
  // finché non si ha una zucca, il tasto 🛒 e la scheda dei decori portano il 🎃 (come il baule della 2D)
  await zuc.evaluate(() => { const { motore, mondo } = window.__fattoria3d; motore.s.esperienza = 1e6; mondo.cambiato() })
  controlla('a Halloween il tasto Compra porta il 🎃 finché non hai una zucca', !!await zuc.waitForSelector('[data-f3="costruisci-festa"]', { timeout: 3000 }).catch(() => null))
  await zuc.locator('[data-f3="az-costruisci"]').click()
  await zuc.locator('[data-gruppo="decori"]').click()
  await zuc.waitForSelector('[data-carta="zucca_intagliata"]', { timeout: 3000 })
  controlla('e la scheda dei decori e le sue zucche pure', await zuc.locator('[data-scheda="decori"] [data-f3="scheda-festa"]').count() === 1 && await zuc.locator('[data-carta="zucca_intagliata"] [data-f3="carta-festa"]').count() === 1)
  await zuc.locator('[data-f3="costruisci-qui"] [data-chiudi]').click()
  await zuc.waitForSelector('[data-f3="costruisci-qui"]', { state: 'detached', timeout: 3000 })
  await zuc.evaluate(() => { const { motore, mondo } = window.__fattoria3d; for (let j = -3; j < 8; j++) for (let i = -7; i < 5; i++) if (motore.puoMettere('zucche_mucchio', i, j).ok && motore.puoMettere('zucca_intagliata', i + 3, j).ok && Math.abs(i) < 3 && j > 1) { motore.compraEMetti('zucche_mucchio', i, j); motore.compraEMetti('zucca_intagliata', i + 3, j); mondo.cambiato(); return } })
  await scatto(zuc, 'fattoria3d-halloween')
  controlla('comprata la zucca il 🎃 se ne va', !!await zuc.waitForSelector('[data-f3="costruisci-festa"]', { state: 'detached', timeout: 3000 }).then(() => true, () => false))
  await zuc.locator('[data-f3="az-costruisci"]').click()
  await zuc.locator('[data-gruppo="decori"]').click()
  await zuc.waitForSelector('[data-carta="zucca_intagliata"]', { timeout: 3000 }).catch(() => {})
  controlla('e nel menu dei decori ci sono le zucche', await zuc.locator('[data-carta="zucca_intagliata"]').count() === 1 && await zuc.locator('[data-carta="zucche_mucchio"]').count() === 1)
  await scatto(zuc, 'fattoria3d-halloween-menu')
  controlla('nessun errore in console a Halloween', erroriZuc.length === 0, erroriZuc.join(' · '))
  await zuc.context().close().catch(() => {})
})

await browser.close()
riassunto('Fattoria 3D col dito: le macchine, gli ordini, il cortile e le feste')
