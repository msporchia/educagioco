/* ═══════════════════════════════════════════════════════════════════
   L'EROE NELLO SCONTRO E SOPRA: IL PERICOLO, LE POZIONI, GLI INCANTI, IL LIVELLO, COL DITO
   tempo: 300

   perché: l'eroe nello scontro: il pericolo e i suoi tasti, la pozione scelta, gli incanti dalla barra, la festa del livello, la pagina dell'eroe
   a parte perché: parte dal cheat dell'indirizzo con un mago al livello 9 contro leggendari e Re Ossuto; sotterraneo-scontro prova la scena dei mostri, non l'eroe

   Quello che dell'eroe esiste solo nel browser: la riga del pericolo e i suoi tasti, la scelta della pozione, la casella degli
   incanti nella barra, la festa del livello, la pagina dell'eroe e i Tesori. Le regole stanno nelle unità
   (unita/sotterraneo-pericolo, -pozioni, -orologio, -livelli, -rarita). Uno Chrome solo; ogni scena si apre dal cheat
   dell'indirizzo (docs/core/comandi.md). Si tocca come un bambino (`Input.dispatchTouchEvent` via CDP).
   - gli incanti dal campo (docs/sotterraneo/orologio.md): la casella apre la scelta, un tocco lancia lo Scudo arcano e paga,
     il secondo no, e l'albero dice cosa si prepara;
   - lo stop del pericolo (docs/sotterraneo/pericolo.md): un mago al livello 9 nella scalinata contro sei leggendari. La finestra
     cieca, «duro» al primo turno, la scelta della pozione e la ✕, «continuo» senza costo, il secondo stop «ultimo», il sorso che
     basta (lo stop sparisce, una pozione per turno) e quello che non basta (lo stop resta), «scappo via» col suo costo. Lì si
     misura anche che i pannelli non coprano i globi, col tema legno a 390 px (le sei larghezze: sotterraneo-sopra-barra-misura);
   - Re Ossuto all'ultimo piano della cripta (docs/sotterraneo/grossi.md): la sua vita in cima, battuto l'eroe sale di livello e
     lo si festeggia; poi un leggendario caduto accanto all'ingresso (docs/sotterraneo/rarita.md), raccolto col dito; risaliti, la
     pagina dell'eroe col «+» d'oro, il bilanciamento dei punti, le schede e i Tesori (docs/sotterraneo/livelli.md).
   `node test/esegui.mjs integrazione/sotterraneo-scontro-eroe`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, scatto, attendi, ditoDi, finestraFerma, lasciaLaDiscesa } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto, blocco } from '../aiuto/verifica.mjs'
import { scendiCon, scelta, finitoIlRacconto, raccontoInCorso, rispondiGiusto, globo, sopraLaBarra } from '../aiuto/sotterraneo-scontro.mjs'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { COSE } from '../../src/giochi/sotterraneo/dati/cose.js'
import { sogliaDi, VITA_PER_TEMPRA } from '../../src/giochi/sotterraneo/dati/livelli.js'
import { NODI } from '../../src/giochi/sotterraneo/dati/abilita.js'
import { LIVELLI_ATTESI } from '../../src/giochi/sotterraneo/dati/storia.js'
import { forzaDi } from '../../src/giochi/sotterraneo/motore/forza.js'
import { coloreNellaStoria } from '../../src/giochi/sotterraneo/motore/zone.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
const { tocca, toccaIl } = await ditoDi(page)

// un pannello sopra la barra: non copre i globi e, dove c'è la scena, ne lascia almeno 80 px sopra
function nonCopre(cosa, m, { scena = true } = {}) {
  if (!controlla(`${cosa}: il pannello c'è`, !!m)) return
  controlla(`${cosa}: non copre i globi (bordo basso ${m.basso}, cima dei globi ${m.cima})`, m.sopra <= 0, String(m.sopra))
  if (scena) controlla(`${cosa}: sopra resta scena (${m.scena} px)`, m.scena >= 80, String(m.scena))
}

/* ══════════ 1. gli incanti preparati dal campo ══════════
   un mago del livello 12 con lo Scudo arcano (si prepara), la Fonte arcana e il Dardo (no) */
await blocco('gli incanti dal campo', async () => {
  const roba = { v: 1, gemme: 0, zaino: ['pozione-piccola'], mano: null, mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 }
  const crescita = { v: 2, esp: sogliaDi(12), forza: 1, destrezza: 0, intelligenza: 4, tempra: 0,
    albero: { 'scudo-arcano': 1, 'fonte-arcana': 1, 'dardo-di-fuoco': 1 }, caselle: ['dardo-di-fuoco', 'scudo-arcano', null] }
  await scendiCon(page, 'sotterraneo=1&seme=11', { eroe: 'mago', roba, extra: { crescita }, aspetta: '[data-barra-giu] [data-casella-barra="incanti"]' })
  const casella = () => page.locator('[data-casella-barra="incanti"]').evaluate(e => `${e.dataset.n}/${e.dataset.preparabili}`)
  uguale('prima di lanciare niente è addosso', await page.locator('[data-incanti]').count(), 0)
  uguale('la casella sa quanti ne puoi preparare, e nessuno è addosso', await casella(), '0/1')
  const piena = await globo(page, 'energia')
  await toccaIl('[data-barra-giu] [data-azione="incanti"]')
  await page.waitForSelector('[data-preparati][data-pronto]', { timeout: 3000 })
  uguale('la casella apre la scelta degli incantesimi, non l\'albero', await page.locator('[data-pagina-abilita]').count(), 0)
  uguale('una riga per quello che si prepara (lo Scudo arcano, non la Fonte né il Dardo)', await page.locator('[data-azione="prepara-campo"]').evaluateAll(es => es.map(e => e.dataset.abilita).join()), 'scudo-arcano')
  await scatto(page, 'incanti-scelta')
  await toccaIl('[data-azione="prepara-campo"][data-abilita="scudo-arcano"]')
  await page.waitForFunction(p => Number(document.querySelector('[data-globo="energia"] .sot-globo-numero').textContent) < p, piena, { timeout: 3000 }).catch(() => {})
  uguale('lanciarlo paga l\'energia di sempre', await globo(page, 'energia'), piena - NODI['scudo-arcano'].costo)
  controlla('e lo Scudo arcano è addosso con i suoi passi', Number(await page.locator('[data-azione="prepara-campo"]').first().getAttribute('data-addosso')) >= 30)
  await toccaIl('[data-preparati] [data-chiudi]')
  await page.waitForSelector('[data-preparati]', { state: 'detached', timeout: 3000 })
  uguale('sopra il globo c\'è la pastiglia dell\'incanto', await page.locator('[data-incanti] [data-incanto="scudo-arcano"]').count(), 1)
  uguale('e la casella dice 1 addosso su 1', await casella(), '1/1')
  controlla('coi passi che restano', Number(await page.locator('[data-incanto="scudo-arcano"]').getAttribute('data-passi')) >= 30)
  await scatto(page, 'incanti-campo')
  // un secondo tocco (dalla pastiglia, che si tocca come la casella): ce l'ha già, e l'energia non si muove
  const dopo = await globo(page, 'energia')
  await toccaIl('[data-barra-giu] [data-incanti]')
  await page.waitForSelector('[data-preparati][data-pronto]', { timeout: 3000 })
  await toccaIl('[data-azione="prepara-campo"][data-abilita="scudo-arcano"]')
  await attendi(page, 400)
  uguale('rilanciarlo mentre è in forze non costa niente', await globo(page, 'energia'), dopo)
  // l'albero è a un tocco, e il riquadro del nodo dice che si prepara
  await toccaIl('[data-azione="apri-albero"]')
  await page.waitForSelector('[data-pagina-abilita]', { timeout: 3000 })
  uguale('l\'albero è la scheda Abilità della finestra dell\'eroe', await page.locator('[data-scheda][aria-selected="true"]').getAttribute('data-scheda'), 'abilita')
  await toccaIl('[data-azione="ramo"][data-ramo-scheda="arcano"]')
  await page.waitForSelector('[data-azione="nodo"][data-nodo="scudo-arcano"]', { timeout: 3000 })
  await toccaIl('[data-azione="nodo"][data-nodo="scudo-arcano"]')
  await page.waitForSelector('[data-nodo-dettaglio] [data-preparabile]', { timeout: 3000 }).catch(() => {})
  uguale('nell\'albero lo Scudo arcano dice che si può preparare', await page.locator('[data-nodo-dettaglio] [data-preparabile]').count(), 1)
  await toccaIl('[data-azione="nodo"][data-nodo="fonte-arcana"]')
  await page.waitForFunction(() => !document.querySelector('[data-nodo-dettaglio] [data-preparabile]'), null, { timeout: 3000 }).catch(() => {})
  uguale('la Fonte arcana no', await page.locator('[data-nodo-dettaglio] [data-preparabile]').count(), 0)
})

/* ══════════ 2. lo stop del pericolo ══════════
   il mago di livello 9 senza punti in tempra ha 29 vita contro un giro di sei leggendari della scalinata: lo stop «duro» (vita ≤ due
   giri) c'è al primo turno, e dopo un giro quello «ultimo» (vita ≤ un giro). Il pallino della scalinata non deve essere rosso (la
   sentinella non lo farebbe scendere): lo dice la forza (docs/sotterraneo/forza.md) */
const MAGO = 'mago'
const robaMago = { v: 1, gemme: 0, zaino: ['pozione-piccola', 'pozione-grande'], mano: null, mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 }
const crescitaMago = { esp: sogliaDi(9), tempra: 0 }
const colore = coloreNellaStoria(LIVELLI_ATTESI[1], forzaDi(MAGO, robaMago, crescitaMago))
controlla('la scalinata non è rossa per questo eroe', colore !== 'rosso', colore)
const PERICOLO = 'sotterraneo=1&seme=11&sotterraneo=branco&mostri=6&grado=leggendario'
const pozioni = async () => Number(await page.locator('[data-casella-barra="pozione"]').getAttribute('data-n'))
const stop = () => page.locator('[data-ringhio]')
const pronto = () => page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 8000 })
async function attaccaGiusto() {
  await pronto()
  await toccaIl('[data-caselle-abilita] [data-azione="attacco"]')
  await rispondiGiusto(page)
  await raccontoInCorso(page)
  await finitoIlRacconto(page)
}
// il numero verde del sorso dura poco: un osservatore dentro la pagina lo ricorda appena compare
const guardaLeCure = () => page.evaluate(() => {
  window.__cure = []
  if (window.__cureOss) window.__cureOss.disconnect()
  window.__cureOss = new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
    if (n.nodeType !== 1) return
    for (const e of [n, ...n.querySelectorAll('*')]) if (e.classList && e.classList.contains('sot-numero-cura')) window.__cure.push(e.textContent.trim())
  })))
  window.__cureOss.observe(document.body, { childList: true, subtree: true })
})

let vita0 = 0
await blocco('lo stop al primo turno, e la finestra cieca', async () => {
  await scendiCon(page, PERICOLO + '&tema=legno', { eroe: MAGO, roba: robaMago, extra: { crescita: crescitaMago }, aspetta: '[data-pannello3d] [data-caselle-abilita]' })
  vita0 = await globo(page, 'vita')
  uguale('due pozioni sulla casella', await pozioni(), 2)
  // appena il racconto finisce la scelta si rimonta e per 320 ms non sente il tocco. Si aspetta quel momento nella pagina stessa
  // (un fotogramma alla volta) e si tocca subito: letti in due passi, la finestra si chiuderebbe in mezzo
  const cieco = await page.evaluate(() => new Promise(fine => {
    const t0 = performance.now()
    const guarda = () => {
      const b = document.querySelector('[data-caselle-abilita]:not([data-ferma]):not([data-pronto]) [data-azione="bevi-scontro"]')
      if (b) { b.click(); fine(true) } else if (performance.now() - t0 > 15000) fine(false)
      else requestAnimationFrame(guarda)
    }
    guarda()
  }))
  controlla('si vede la finestra cieca, dopo il racconto', cieco)
  await attendi(page, 80)
  uguale('un tocco subito non sceglie niente', await stop().count(), 1)
  uguale('né beve', await pozioni(), 2)
  uguale('lo stop scatta già al primo turno, con la ragione «duro»', await stop().getAttribute('data-perche'), 'duro')
  uguale('al posto della domanda', await page.locator('.sot-domanda').count(), 0)
  uguale('nella stessa scelta di sempre, con bere e scappare', await page.locator('[data-caselle-abilita] [data-azione="attacco"], [data-caselle-abilita] [data-azione="bevi-scontro"], [data-caselle-abilita] [data-azione="scappa"]').evaluateAll(es => es.map(e => e.dataset.azione).join()),
         'attacco,bevi-scontro,scappa')
  controlla('l\'avviso è generico, senza nome di mostro', /Attenzione/.test(await stop().innerText()))
  controlla('e dice i colpi che arrivano, tutti insieme', /ti toglie \d+/.test(await stop().innerText()), await stop().innerText())
  controlla('lo scontro è ancora lì, col suo pannello', await page.locator('[data-scontro-3d]').count() === 1 && await page.locator('[data-pannello3d]').count() === 1)
  uguale('con i mostri in vista', await page.locator('[data-mostro]').count(), 6)
  await pronto()
  nonCopre('390 px, tema legno, cosa fare (col pericolo)', await sopraLaBarra(page, '[data-pannello3d]'))
  await scatto(page, 'pericolo')
})
await blocco('bere apre la scelta, e la ✕ non beve', async () => {
  await toccaIl('[data-azione="bevi-scontro"]')
  await page.waitForSelector('[data-scegli-pozione][data-pronto]', { timeout: 3000 })
  uguale('una riga per stadio, dalla più piccola, con quanto cura e quante ne ha', await page.locator('[data-azione="bevi-questa"]')
    .evaluateAll(b => b.map(x => `${x.dataset.cosa}:${x.dataset.cura}:${x.dataset.n}`).join()),
         `pozione-piccola:${COSE['pozione-piccola'].cura}:1,pozione-grande:${COSE['pozione-grande'].cura}:1`)
  controlla('nello scontro dice che poi tocca ancora a te', /tocca ancora a te/.test(await page.locator('[data-scegli-pozione]').innerText()))
  uguale('la ✕ in alto a destra', await page.locator('[data-scegli-pozione] [data-chiudi]').count(), 1)
  nonCopre('390 px, tema legno, quale pozione', await sopraLaBarra(page, '[data-scegli-pozione] .sot-cornice'), { scena: false })
  await scatto(page, 'pericolo-scelta-pozione')
  await toccaIl('[data-scegli-pozione] [data-chiudi]')
  await page.waitForSelector('[data-scegli-pozione]', { state: 'detached', timeout: 3000 })
  uguale('chiusa la scelta non si è bevuto niente', await pozioni(), 2)
  uguale('e lo stop è ancora lì', await stop().getAttribute('data-perche'), 'duro')
})
await blocco('«continuo» domanda senza costare, e il secondo stop è «ultimo»', async () => {
  await pronto()
  const vita1 = await globo(page, 'vita')
  uguale('prima di scegliere la vita è quella dell\'inizio', vita1, vita0)
  await toccaIl('[data-caselle-abilita] [data-azione="attacco"]')
  await page.waitForSelector('[data-pannello3d] .sot-domanda', { timeout: 5000 })
  uguale('«continuo» toglie lo stop', await stop().count(), 0)
  uguale('e non costa vita', await globo(page, 'vita'), vita1)
  nonCopre('390 px, tema legno, la domanda', await sopraLaBarra(page, '[data-pannello3d]'))
  await rispondiGiusto(page)
  await raccontoInCorso(page)
  uguale('a racconto in corso lo stop non c\'è ancora', await stop().count(), 0)
  await finitoIlRacconto(page)
  await pronto()
  controlla('i mostri hanno colpito', (await globo(page, 'vita')) < vita1, `${vita1} → ${await globo(page, 'vita')}`)
  uguale('un colpo pieno e cade: secondo stop «ultimo»', await stop().getAttribute('data-perche'), 'ultimo')
})
await blocco('il sorso che basta: lo stop sparisce, una pozione per turno', async () => {
  const v = await globo(page, 'vita'), n = await pozioni()
  await toccaIl('[data-azione="bevi-scontro"]')
  await page.waitForSelector('[data-scegli-pozione][data-pronto]', { timeout: 3000 })
  await guardaLeCure()
  await toccaIl('[data-azione="bevi-questa"][data-cosa="pozione-grande"]')
  await raccontoInCorso(page)
  await finitoIlRacconto(page)
  uguale('il sorso si vede: il numero che sale', (await page.evaluate(() => window.__cure))[0], `+${COSE['pozione-grande'].cura}`)
  await pronto()
  uguale('«bevi» consuma una pozione', await pozioni(), n - 1)
  uguale('la vita è salita della cura, senza i colpi dei mostri', await globo(page, 'vita'), v + COSE['pozione-grande'].cura)
  uguale('ora la vita basta: lo stop sparisce', await stop().count(), 0)
  uguale('una pozione sola per turno: «bevi» è spento', await page.locator('[data-azione="bevi-scontro"]').isDisabled(), true)
  controlla('e dice perché', /una per turno/.test(await page.locator('[data-azione="bevi-scontro"]').innerText()))
  await scatto(page, 'pericolo-bevuto')
  // il turno è ancora suo: attacca, i mostri colpiscono, e al turno dopo si beve di nuovo
  await attaccaGiusto()
  await pronto()
  uguale('il turno dopo «bevi» è acceso', await page.locator('[data-azione="bevi-scontro"]').isDisabled(), false)
})
await blocco('il sorso che non basta: lo stop resta', async () => {
  await scendiCon(page, PERICOLO, { eroe: MAGO, roba: robaMago, extra: { crescita: crescitaMago }, aspetta: '[data-pannello3d] [data-caselle-abilita]' })
  await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 20000 })
  const v = await globo(page, 'vita'), n = await pozioni()
  uguale('lo stop è lì', await stop().getAttribute('data-perche'), 'duro')
  await toccaIl('[data-azione="bevi-scontro"]')
  await page.waitForSelector('[data-scegli-pozione][data-pronto]', { timeout: 3000 })
  await toccaIl('[data-azione="bevi-questa"][data-cosa="pozione-piccola"]')
  await raccontoInCorso(page)
  await finitoIlRacconto(page)
  await pronto()
  uguale('una pozione in meno', await pozioni(), n - 1)
  uguale('la vita è salita della boccetta, senza colpi', await globo(page, 'vita'), v + COSE['pozione-piccola'].cura)
  uguale('non basta ancora: lo stop resta', await stop().getAttribute('data-perche'), 'duro')
  controlla('e dice che hai bevuto e cosa puoi fare', /puoi scappare o continuare/.test(await page.locator('[data-ringhio-bevuto]').innerText()))
  uguale('«bevi» è spento', await page.locator('[data-azione="bevi-scontro"]').isDisabled(), true)
  uguale('niente domanda', await page.locator('.sot-domanda').count(), 0)
  await scatto(page, 'pericolo-dopo-sorso')
})
await blocco('«scappo via» dallo stop, col suo costo', async () => {
  uguale('«scappo via» c\'è ancora', await page.locator('[data-azione="scappa"]:not([disabled])').count(), 1)
  const v = await globo(page, 'vita'), n = await pozioni()
  const costo = Number(((await page.locator('[data-azione="scappa"] small').innerText()).match(/\d+/) || [0])[0])
  // i mostri del cheat nascono dentro lo scontro e non hanno mai fatto un passo: il motore dà loro il posto al primo passo e lì azzera la
  // calma che la fuga ha appena dato (muoviUnMostro, `fx == null`). In una discesa vera chi arriva allo scontro ha già camminato
  await page.evaluate(() => { for (const m of window.__sotterraneo3d.corsa.livello.robe) if (m.che === 'mostro' && m.fx == null) { m.fx = m.x + 0.5; m.fy = m.y + 0.5; m.casa = { x: m.x, y: m.y }; m.calmo = 0 } })
  await toccaIl('[data-azione="scappa"]')
  await page.waitForSelector('[data-scontro-3d]', { state: 'detached', timeout: 15000 })
  uguale('scappando lo scontro si chiude, e lo stop con lui', await page.locator('[data-ringhio], [data-scontro-3d]').count(), 0)
  // il numero del globo scende a poco a poco: si legge quando arriva
  await page.waitForFunction(a => Number(document.querySelector('[data-globo="vita"] .sot-globo-numero').textContent) === a, v - costo, { timeout: 10000 }).catch(() => {})
  uguale('col costo fisso detto sul tasto', await globo(page, 'vita'), v - costo)
  uguale('le pozioni non si toccano', await pozioni(), n)
})

/* ══════════ 3. Re Ossuto, il livello salito, il leggendario, la pagina dell'eroe ══════════
   un cavaliere di livello 12 a un punto d'esperienza dal 13 (un mostro ne dà almeno uno: dati/livelli.js, esperienzaDi), con nove punti dati alla forza (il decimo la staccherebbe di dieci dalle altre),
   40 gemme e la Zanna del drago fra i Tesori */
const roba = { v: 1, gemme: 40, zaino: ['pozione'], mano: 'spada@6.r.att.fuoco.vita', mancina: 'scudo-legno@4', corpo: 'panciotto@4', dito: null, torcia: 12, torce: 0 }
const crescita = { v: 2, esp: sogliaDi(13) - 1, forza: 9, destrezza: 0, intelligenza: 0, tempra: 0 }
const riga = k => page.locator(`[data-caratteristica="${k}"]`)
const tasto = () => page.locator('[data-azione="eroe-pagina"]')
async function apriLaPagina() {
  await toccaIl('[data-azione="eroe-pagina"]')
  await page.waitForSelector('[data-pagina-eroe]', { timeout: 3000 })
  await finestraFerma(page)
}

await blocco('Re Ossuto, la sua vita in cima, e il livello salito', async () => {
  await scendiCon(page, 'sotterraneo=0&piano=2&sotterraneo=branco&grosso=ossuto&mostri=1',
                  { roba, extra: { crescita, tesori: ['zanna-del-drago'] }, aspetta: '[data-scontro-3d]' })
  uguale('la vita del mostro grosso è in cima allo schermo', await page.locator('[data-grosso]').getAttribute('data-chi'), 'ossuto')
  controlla('col suo nome', (await page.locator('[data-grosso]').innerText()).includes('Re Ossuto'))
  uguale('nello scontro c\'è lui, il grande', await page.locator('[data-scontro-3d] [data-mostro][data-grande]').count(), 1)
  await scatto(page, 'eroe-grosso')
  // la festa del livello dura 2,6 s e comincia quando il mostro cade: un osservatore la ricorda appena compare
  await page.evaluate(() => {
    new MutationObserver(() => { const f = document.querySelector('[data-livello-su]'); if (f) window.__livelloSu = f.dataset.livello })
      .observe(document.body, { subtree: true, childList: true, attributes: true })
  })
  const ossa0 = Number(await page.locator('[data-grosso]').getAttribute('data-ossa'))
  let calata = false
  const storia = []
  for (let n = 0; n < 12 && (await page.locator('[data-scontro-3d]').count()); n++) {
    await page.waitForFunction(() => !document.querySelector('[data-scontro-3d]') || document.querySelector('[data-caselle-abilita][data-pronto]'), null, { timeout: 30000 })
    if (!(await page.locator('[data-scontro-3d]').count())) break
    await toccaIl('[data-azione="attacco"]')
    await rispondiGiusto(page)
    await page.waitForFunction(() => !document.querySelector('[data-scontro-3d]') || document.querySelector('[data-caselle-abilita][data-pronto]'), null, { timeout: 30000 })
    const o = await page.locator('[data-grosso]').count() ? Number(await page.locator('[data-grosso]').getAttribute('data-ossa')) : null
    if (o !== null && o < ossa0) calata = true
    storia.push(o ?? '·')
  }
  controlla('rispondendo giusto la sua vita in cima cala (o cade al primo colpo)', calata || storia[0] === '·', storia.join())
  uguale('battuto, la sua vita in cima se ne va', await page.locator('[data-grosso]').count(), 0)
  await page.waitForFunction(() => window.__livelloSu, null, { timeout: 6000 }).catch(() => {})
  uguale('la festa del livello', await page.evaluate(() => window.__livelloSu || null), '13')
  await scatto(page, 'eroe-livello')
  uguale('il tasto del globo sa il livello nuovo', await tasto().getAttribute('data-livello'), '13')
  uguale('e il «+» d\'oro: tre punti da dare', await tasto().getAttribute('data-punti'), '3')
})
await blocco('giù, un punto alla tempra alza subito la vita', async () => {
  await apriLaPagina()
  const vita0 = Number(await page.locator('[data-numero="vita"] b').textContent())
  await toccaIl('[data-caratteristica="tempra"] [data-azione="dai"]')
  await page.waitForFunction(() => document.querySelector('[data-caratteristica="tempra"]').dataset.dati === '1', null, { timeout: 3000 }).catch(() => {})
  uguale('un punto alla tempra: la tempra sale', await riga('tempra').getAttribute('data-dati'), '1')
  uguale('e la vita con lei, subito', Number(await page.locator('[data-numero="vita"] b').textContent()), vita0 + VITA_PER_TEMPRA)
  uguale('restano due punti, e il «+» sul globo lo dice', `${await page.locator('[data-punti-da-dare]').getAttribute('data-n')} ${await tasto().getAttribute('data-punti')}`, '2 2')
  await toccaIl('[data-pagina-eroe] [data-chiudi]')
  await page.waitForSelector('[data-pagina-eroe]', { state: 'detached', timeout: 3000 })
  await lasciaLaDiscesa(page)
})

/* il piano del leggendario: l'ultimo della cripta, senza mostri vicini all'ingresso, dove il pezzo cade accanto all'eroe */
function scegliIlPiano() {
  for (let seme = 1; seme < 800; seme++) {
    const c = new Corsa(CAMPAGNA[0], { seme, eroe: 'cavaliere', roba })
    c.piano = CAMPAGNA[0].piani - 1
    c.nuovoPiano()
    const da = { x: Math.floor(c.eroe.x), y: Math.floor(c.eroe.y) }
    if (c.livello.robe.some(r => r.che === 'mostro' && Math.hypot(r.x - da.x, r.y - da.y) < 9)) continue
    return { seme, dove: c.posaPezzo('spada', { x: da.x + 1, y: da.y }) }
  }
  return null
}
const piano = scegliIlPiano()
controlla("c'è un ultimo piano della cripta senza mostri vicini all'ingresso", !!piano)
let leggendario = null
await blocco('un leggendario caduto, raccolto col dito', async () => {
  // l'eroe salito di livello è salvato (risalendo); la discesa del leggendario si apre dall'indirizzo, il cheat si legge alla partenza
  await page.waitForSelector('[data-mondo3d]', { timeout: 10000 })
  await attendi(page, 400)   // le scritture rimandate dell'archivio
  await page.evaluate(s => { location.hash = `sotterraneo=0&seme=${s}&piano=2&sotterraneo=leggendario`; location.reload() }, piano.seme)
  await page.waitForSelector('[data-tela="3d"]', { timeout: 40000 })
  await page.waitForSelector('[data-leggendario]', { timeout: 30000 })
  leggendario = await page.locator('[data-leggendario]').getAttribute('data-cosa')
  const testo = await page.locator('[data-leggendario]').innerText()
  controlla('cade un leggendario: il nome in oro, la sua storia', COSE[leggendario]?.rarita === 'leggendario' &&
            testo.includes(COSE[leggendario].nome) && testo.includes(COSE[leggendario].storia), leggendario)
  await scatto(page, 'eroe-leggendario')
  const via = await page.waitForSelector('[data-leggendario]', { state: 'detached', timeout: 10000 }).then(() => true, () => false)
  controlla('la festa del leggendario va via da sola', via)
  const [sx, sy] = await page.evaluate(([a, b]) => window.__sotterraneo3d.aSchermo(a, 0.2, b), [piano.dove.x + 0.5, piano.dove.y + 0.5])
  const t = await page.locator('[data-tela="3d"]').boundingBox()
  await tocca(t.x + sx, t.y + sy)
  // l'eroe ci va e lo raccoglie: si aspetta che abbia smesso di camminare
  await attendi(page, 600)
  await page.waitForFunction(() => { const c = window.__sotterraneo3d && window.__sotterraneo3d.corsa; return c && !(c.strada && c.strada.length) }, null, { timeout: 20000 })
  await attendi(page, 600)
  // i Tesori si scrivono nell'avventura quando la discesa si chiude: si risale, e dalla terra di sopra si guardano
  await lasciaLaDiscesa(page)
})
await blocco('sopra: il livello e i punti sulla barra', async () => {
  await page.waitForSelector('[data-mondo3d][data-pronto="1"]', { timeout: 30000 })
  uguale('il tasto del globo sa il livello', await tasto().getAttribute('data-livello'), '13')
  controlla('il globo dice fatta/serve', /^\d+\/\d+$/.test((await page.locator('[data-esperienza-barra] .sot-esp-numero').textContent()).trim()))
  uguale('e il «+» d\'oro dice che ci sono punti da dare', await tasto().getAttribute('data-punti'), '2')
  uguale('sopra non c\'è la carta di chi scende: il livello sta sul globo e nella pagina',
         await page.locator('[data-chi-sopra], [data-roba-sopra], [data-azione="ritratto"], [data-azione="eroe"]').count(), 0)
  const eroe = await page.locator('[data-eroe-mondo]').boundingBox()
  const barra = await page.locator('[data-barra-giu]').boundingBox()
  controlla('l\'eroe del mondo sta sopra la barra', eroe.y + eroe.height < barra.y, `${eroe.y + eroe.height} contro ${barra.y}`)
})
await blocco('la pagina dell\'eroe', async () => {
  await apriLaPagina()
  uguale('il globo apre la pagina dell\'eroe', await page.locator('[data-livello-eroe]').getAttribute('data-livello'), '13')
  controlla('e c\'è «Cambia eroe», che sta nella pagina e non sulla mappa', /cambia eroe/i.test(await page.locator('[data-pagina-eroe] [data-azione="eroe"]').innerText()))
  await toccaIl('[data-pagina-eroe] [data-chiudi]')
  await page.waitForSelector('[data-pagina-eroe]', { state: 'detached', timeout: 3000 }).catch(() => {})
  uguale('la ✕ la chiude', await page.locator('[data-pagina-eroe]').count(), 0)
  await apriLaPagina()
  uguale('il globo la riapre, e dice i punti da dare', await page.locator('[data-punti-da-dare]').getAttribute('data-n'), '2')
  const att = Number(await page.locator('[data-numero="att"] b').textContent())
  controlla('e i numeri che decidono uno scontro: attacco e difesa stanno qui', att > 3 && (await page.locator('[data-numero="dif"]').count()) === 1, String(att))
  uguale('la forza correrebbe troppo avanti: il suo «+» è spento', await riga('forza').locator('[data-azione="dai"]').isDisabled(), true)
  uguale('e lo dice', await riga('forza').getAttribute('data-trattenuta'), '1')
  uguale('la destrezza, rimasta indietro, brilla', await riga('destrezza').getAttribute('data-indietro'), '1')
  controlla('«prima un po\' di questa»', /prima un po' di questa/.test(await riga('destrezza').innerText()), await riga('destrezza').innerText())
  uguale('quattro caratteristiche', (await page.locator('[data-caratteristica]').evaluateAll(es => es.map(e => e.dataset.caratteristica))).join(), 'forza,destrezza,intelligenza,tempra')
  // riassegnare costa cinque gemme a punto dato (nove alla forza, uno alla tempra): spento finché le gemme non bastano
  const costo = Number(await page.locator('[data-azione="riassegna"]').getAttribute('data-costo'))
  const gemme = Number(await page.locator('[data-gemme-barra]').getAttribute('data-n'))
  uguale('«Riassegna» dice quanto costa', costo, 50)
  uguale(`e con ${gemme} gemme è ${gemme < costo ? 'spento' : 'acceso'}`, await page.locator('[data-azione="riassegna"]').isDisabled(), gemme < costo)
  await scatto(page, 'eroe-pagina')
  uguale('la finestra dell\'eroe ha quattro schede', (await page.locator('[data-scheda]').evaluateAll(es => es.map(e => e.dataset.scheda))).join(), 'zaino,eroe,abilita,missioni')
  await toccaIl('[data-scheda="abilita"]')
  await page.waitForSelector('[data-pagina-abilita]', { timeout: 3000 }).catch(() => {})
  uguale('«Abilità» apre l\'albero senza chiudere', await page.locator('[data-pagina-abilita]').count(), 1)
  await toccaIl('[data-scheda="zaino"]')
  await page.waitForSelector('[data-zaino]', { timeout: 3000 }).catch(() => {})
  uguale('«Zaino» apre lo zaino', await page.locator('[data-zaino]').count(), 1)
  await toccaIl('[data-scheda="eroe"]')
  await page.waitForSelector('[data-pagina-eroe]', { timeout: 3000 }).catch(() => {})
  uguale('e «Eroe» torna qui', await page.locator('[data-pagina-eroe]').count(), 1)
})
await blocco('i Tesori', async () => {
  await toccaIl('[data-azione="tesori"]')
  await page.waitForSelector('[data-tesori]', { timeout: 3000 })
  await finestraFerma(page)
  uguale('il leggendario di prima c\'è, col suo nome', await page.locator('[data-tesoro="zanna-del-drago"]').getAttribute('data-trovato'), '1')
  controlla('e la sua storia', /drago/.test(await page.locator('[data-tesoro="zanna-del-drago"]').innerText()))
  uguale('e anche quello raccolto giù', leggendario && await page.locator(`[data-tesoro="${COSE[leggendario].unico}"]`).getAttribute('data-trovato'), '1')
  const vuoti = await page.locator('[data-tesoro][data-trovato="0"]').count(), tutti = await page.locator('[data-tesoro]').count()
  // il leggendario raccolto giù è a sorte, e può essere la zanna stessa: allora i trovati sono uno, non due
  const trovati = new Set(['zanna-del-drago', leggendario && COSE[leggendario].unico].filter(Boolean)).size
  controlla('gli altri sono un posto vuoto', vuoti > 0 && vuoti === tutti - trovati, `${vuoti} vuoti su ${tutti}, ${trovati} trovati`)
  controlla('senza dire «in arrivo»', !/in arrivo/i.test(await page.locator('[data-tesori]').innerText()))
  await scatto(page, 'eroe-tesori')
  // un tocco fuori, sul sipario sopra la cornice (misurata ferma: mentre cresce è più piccola e il tocco le cadrebbe dentro)
  const s = await page.locator('.sot-sipario').boundingBox(), c = await page.locator('.sot-cornice').boundingBox()
  await tocca(s.x + s.width / 2, Math.max(s.y + 4, (s.y + c.y) / 2))
  await page.waitForFunction(() => !document.querySelector('[data-tesori], [data-pagina-eroe]'), null, { timeout: 3000 }).catch(() => {})
  uguale('un tocco fuori chiude i Tesori e la pagina', await page.locator('[data-tesori], [data-pagina-eroe]').count(), 0)
})

uguale('nessun errore in pagina', errori.join(' | '), '')
nota(`il piano del leggendario: seme ${piano && piano.seme}`)
await browser.close()
riassunto("l'eroe nello scontro e sopra, col dito")
