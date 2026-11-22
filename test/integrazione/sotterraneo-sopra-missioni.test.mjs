/* ═══════════════════════════════════════════════════════════════════
   LE MISSIONI, I DIALOGHI E IL DIARIO, COL DITO VERO
   docs/sotterraneo/missioni.md, dialoghi.md, missioni-freccina.md

   perché: i «!» e i «?», il dialogo a pagine, il diario con il dettaglio, la freccina e «vai dal mugnaio» che porta da lui e consegna, col salvataggio
   a parte perché: una semina sola: cavaliere davanti alla torre, collana consegnata, Rosicchione da riportare; la bacheca delle taglie sta in sotterraneo-sopra-bacheca

   Un Chrome e una semina sola: il cavaliere davanti alla torre, la
   collana consegnata, Rosicchione battuto e da riportare, il minatore
   mai sentito. Sul villaggio due «!» e un «?» d'oro, il mugnaio lontano
   ha l'indicatore sul bordo; la ragazza si tocca e parla a pagine (la
   storia, le novità, «ci penso io»), un tocco sul prato chiude e
   cammina; la guardia dà le chiavi; il diario le mostra e il dettaglio
   dice chi, cosa, dove e il premio; giù nella torre il promemoria e la
   freccina, e «segui questa» la cambia (stesso piano: stesso seme);
   «vai dal mugnaio» porta da lui, si consegna e lui dice il premio; il
   diario dopo; il minatore si presenta e dice la strada; la storia in
   cima al diario, con le sette porte. I mercanti che dal dialogo aprono
   la bottega (e «ho roba da vendere» sulla linguetta delle tasche) li
   prova sotterraneo-bottega.
   Le regole (lo sblocco, il tetto, i segni, il diario, il promemoria, la
   freccina con la scelta, i dialoghi) sono in unita/sotterraneo-missioni,
   sotterraneo-missioni-conteggio e sotterraneo-dialoghi: qui si guarda
   che il dito le apra e che il salvataggio le tenga.
   L'eroe va da chi parla col salto delle prove (`__mondo3d.vai`); i
   tocchi sono tocchi (`Input.dispatchTouchEvent` via CDP).
   `node test/esegui.mjs sotterraneo-sopra-missioni`
   tempo: 300
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, scatto, attendi, leggiProfilo, ditoDi, lasciaLaDiscesa, fermoNelMondo } from '../aiuto/browser.mjs'
import { entraSopra, avventuraDi, vaiETocca, toccaFermo, scendiDa, nelDialogo, voltaPagina } from '../aiuto/sotterraneo-sopra.mjs'
import { controlla, uguale, stessaLista, nota, riassunto, blocco } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { missioneDi, personaDi } from '../../src/giochi/sotterraneo/dati/missioni.js'
import { DIALOGHI } from '../../src/giochi/sotterraneo/dati/dialoghi.js'
import { GROSSI, GROSSO_DELLA_DISCESA } from '../../src/giochi/sotterraneo/dati/grossi.js'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { daLui, titoloDi } from '../../src/giochi/sotterraneo/motore/missioni.js'
import { robaAttesa, crescitaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'
import { ilMondo, terraDelMondo } from '../../src/giochi/sotterraneo/motore/mondo-sopra.js'

const DISCESA = CAMPAGNA.findIndex(t => t.chiave === 'torre')
const TORRE = CAMPAGNA[DISCESA]
const roba = robaAttesa('cavaliere', DISCESA, { gemme: 5 })
// la forza dell'eroe atteso è sotto il livello (docs/sotterraneo/forza.md): due livelli in più perché la torre non abbia la sentinella
const crescita = crescitaAttesa('cavaliere', DISCESA + 2)
const ROSICCHIONE = missioneDi('rosicchione'), GOBLIN = missioneDi('goblin')
const SEME = 11   // le due discese nella torre nascono uguali: la freccina cambia per la scelta, non per il piano

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
const { tocca } = await ditoDi(page)
const toccaIl = sel => toccaFermo(page, sel, tocca)
const avventura = () => avventuraDi(page)
// chi ha un segno e quale: `nuova` («!» d'oro), `attesa` («?» grigio), `consegna` («?» d'oro che pulsa)
const segni = () => page.locator('[data-personaggio][data-segno]').evaluateAll(els => els.map(e => e.dataset.personaggio + ':' + e.dataset.segno).sort().join(','))
const pagina = async () => Number(await page.locator('[data-dialogo]').getAttribute('data-pagina'))
const pulito = t => t.replace(/\s+/g, ' ').trim().replace(/^\S+ /, '')   // il testo di un tasto, senza la sua icona
const apriIlDiario = async () => {
  await toccaIl('[data-azione="vita"]')   // il diario è una scheda della finestra dell'eroe
  await page.waitForSelector('[data-pagina-eroe]', { timeout: 5000 })
  await toccaIl('[data-scheda="missioni"]')
  await page.waitForSelector('[data-diario]', { timeout: 5000 })
}
const chiudiIlDiario = async () => {
  await toccaIl('[data-diario] [data-chiudi]')
  await page.waitForSelector('[data-diario]', { state: 'detached', timeout: 5000 })
}
const apriLaVoce = async id => {
  await toccaIl(`[data-diario] li[data-missione="${id}"]`)
  await page.waitForSelector(`[data-dettaglio][data-missione="${id}"]`, { timeout: 3000 })
}
// giù nella torre, sempre lo stesso piano: il fumetto dell'ingresso (letto e passato a chi chiama), poi la discesa
async function scendiNellaTorre() {
  await page.evaluate(s => { location.hash = 'pensieri=no&seme=' + s }, SEME)
  await scendiDa(page, TORRE.chiave, tocca, { scendi: false })
  const qui = await page.locator('[data-fumetto-di] [data-missioni-qui]').innerText()
  await toccaIl(`[data-fumetto-di="${TORRE.chiave}"] [data-azione="scendi"]`)
  await page.waitForSelector('[data-tela="3d"]', { timeout: 30000 })
  await page.waitForSelector('[data-rotta]', { state: 'attached', timeout: 15000 })
  return qui
}

await entraSopra(page, {
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: DISCESA, libera: false, stelle: { 0: 3, 1: 3 },
    cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: { tappa: DISCESA, libera: false, stelle: { 0: 3, 1: 3 },
      // la collana è consegnata, Rosicchione battuto e da riportare, la Dama Grigia mai presa; il minatore mai sentito
      missioni: { collana: 'consegnata', rosicchione: 'fatta' }, roba, crescita, mondo: { parlato: false } } } } } },
})

/* ---------- 1. il villaggio: due «!» e un «?», e chi aspetta lontano ha l'indicatore sul bordo ---------- */
await blocco('i segni e la bussola', async () => {
  uguale('la guardia e la ragazza hanno un favore, il mugnaio aspetta Rosicchione', await segni(), 'guardia:nuova,mugnaio:consegna,ragazza:nuova')
  uguale('l\'eremita no: la sua Dama Grigia aspetta che si liberi un posto', await page.locator('[data-personaggio="eremita"]').getAttribute('data-segno'), null)
  uguale('il globo rosso dice che c\'è una missione da consegnare', await page.locator('[data-azione="vita"]').getAttribute('data-missioni-pronte'), '1')
  await scatto(page, 'missioni-villaggio')
  await page.waitForSelector('[data-consegna-fuori="mugnaio"]', { timeout: 10000 })
  uguale('il mugnaio è lontano: un solo indicatore, il suo', await page.locator('[data-consegna-fuori]').count(), 1)
  const v = await page.locator('[data-mondo3d]').boundingBox(), b = await page.locator('[data-consegna-fuori="mugnaio"]').boundingBox()
  controlla('sta sul bordo della vista, tutto dentro', b.x >= v.x && b.y >= v.y && b.x + b.width <= v.x + v.width && b.y + b.height <= v.y + v.height, JSON.stringify([v, b]))
  controlla('ed è abbastanza grande per un dito', b.width >= 40 && b.height >= 40, JSON.stringify(b))
  await toccaIl('[data-consegna-fuori="mugnaio"]')
  const parte = await page.waitForFunction(() => document.querySelector('[data-eroe-mondo]')?.dataset.cammina === '1', null, { timeout: 15000 }).then(() => true, () => false)
  controlla('toccandolo l\'eroe si mette in cammino', parte)
})

/* ---------- 2. la ragazza: le pagine col dito, la storia, le novità, e la missione presa ---------- */
await blocco('la ragazza', async () => {
  await vaiETocca(page, '[data-personaggio="ragazza"]', 'ragazza', tocca, { atteso: '[data-dialogo="ragazza"]' })
  uguale('toccandola si apre il dialogo, sulla prima pagina', await pagina(), 1)
  uguale('col ritratto', await page.locator('[data-dialogo] [data-ritratto-dialogo]').count(), 1)
  // chi sta fermo saluta per un attimo quando gli si parla, e torna fermo
  uguale('lei alza la mano', await page.locator('[data-personaggio="ragazza"]').getAttribute('data-saluta'), '1')
  controlla('il nome è il suo', (await page.locator('.sot-dialogo-nome').innerText()).includes('ragazza del pozzo'))
  uguale('chiede il seguito della collana', await page.locator('[data-riga]').getAttribute('data-missione'), 'goblin')
  const quante = Number(await page.locator('[data-dialogo]').getAttribute('data-pagine'))
  controlla('la richiesta sta in più pagine', quante >= 2, String(quante))
  uguale('e le domande non ci sono finché non si è all\'ultima', await page.locator('[data-scelte]').count(), 0)
  await scatto(page, 'dialogo-pagina')
  let chiede = await page.locator('[data-dialogo] [data-riga]').innerText()
  await voltaPagina(page, toccaIl).catch(() => {})   // il testo appena aperto è cieco per 320 ms: si ritocca finché gira
  const avanti = await page.waitForSelector('[data-dialogo][data-pagina="2"]', { timeout: 3000 }).then(() => true, () => false)
  controlla('un tocco sul testo va alla pagina dopo', avanti)
  for (let n = 0; n < 6 && !(await page.locator('[data-dialogo][data-ultima]').count()); n++) {
    chiede += ' ' + await page.locator('[data-dialogo] [data-riga]').innerText()
    await voltaPagina(page, toccaIl)
  }
  await page.waitForSelector('[data-dialogo][data-ultima] [data-scelte]', { timeout: 3000 })
  chiede += ' ' + await page.locator('[data-dialogo] [data-riga]').innerText() + ' ' + await page.locator('[data-scelta="prendi"]').innerText()
  uguale('all\'ultima le domande: ci penso io, novità, cosa si dice al pozzo, arrivederci',
         await page.locator('[data-scelta]').evaluateAll(els => els.map(e => e.dataset.scelta).join(',')), 'prendi,novita,racconta,ciao')
  controlla('e dicono cosa, dove, il premio e le monete', chiede.includes('Grattanaso') && chiede.includes('torre bruciata') && chiede.includes('primo piano')
            && chiede.includes(`💎 ${GOBLIN.premio.gemme}`) && (!GOBLIN.premio.monete || chiede.includes(`🪙 ${GOBLIN.premio.monete}`)), chiede)
  const ferma = await page.waitForSelector('[data-personaggio="ragazza"][data-saluta="0"]', { state: 'attached', timeout: 5000 }).then(() => true, () => false)
  controlla('e dopo un attimo torna ferma', ferma)
  await scatto(page, 'dialogo-scelte')

  // la storia: la risposta, e la domanda non torna
  await toccaIl('[data-scelta="racconta"]')
  await page.waitForSelector('[data-riga][data-racconto]', { timeout: 3000 })
  uguale('la risposta riparte dalla prima pagina', await pagina(), 1)
  await nelDialogo(page, null, { tocca: toccaIl })
  uguale('chiesta, la storia non si richiede', await page.locator('[data-scelta="racconta"]').count(), 0)

  // «Novità?»: una frase sua, ricordata nell'avventura
  await toccaIl('[data-scelta="novita"]')
  await page.waitForSelector('[data-riga][data-novita]', { timeout: 3000 })
  const novita = await page.locator('[data-riga]').innerText()
  controlla('«Novità?» risponde con una frase, senza segnaposti', novita.length > 10 && !/[{}]/.test(novita), novita)
  await nelDialogo(page, null, { tocca: toccaIl })
  uguale('chiesta, la novità non si richiede', await page.locator('[data-scelta="novita"]').count(), 0)
  uguale('e l\'avventura ricorda che gliel\'hai chiesto', (await avventura()).mondo?.novita?.ragazza?.n, 1)

  // «ci penso io»: la missione presa
  await toccaIl('[data-scelta="prendi"][data-missione="goblin"]')
  await page.waitForSelector('[data-riga][data-fase="presa"]', { timeout: 3000 })
  uguale('lei ringrazia con la sua frase', await page.locator('[data-riga]').innerText(), DIALOGHI.ragazza.presa)
  uguale('nell\'avventura il goblin è preso', (await avventura()).missioni?.goblin, 'presa')
  uguale('sopra la testa il «?» grigio', await page.locator('[data-personaggio="ragazza"]').getAttribute('data-segno'), 'attesa')
})

/* ---------- 3. un tocco sul prato chiude il dialogo, e cammina ---------- */
await blocco('il tocco sul prato', async () => {
  const terra = terraDelMondo(ilMondo())
  const [x0, y0] = (await page.locator('[data-eroe-mondo]').getAttribute('data-cella')).split(',').map(Number)
  let meta = null
  // in linea retta (nord, ovest o est: sotto c'è il dialogo), tutta strada libera
  for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0]]) for (let k = 5; k >= 3 && !meta; k--)
    if (Array.from({ length: k }, (_, i) => i + 1).every(i => terra.passa(x0 + dx * i, y0 + dy * i))) meta = { x: x0 + dx * k, y: y0 + dy * k }
  const p = await page.evaluate(([a, b]) => { const s = window.__sotterraneo3d; const q = s.aSchermo(a, s.quota(a, b), b); return [q.x, q.y] }, [meta.x + 0.5, meta.y + 0.5])
  const v = await page.locator('[data-mondo3d]').boundingBox()
  const prima = `${x0},${y0}`
  await tocca(v.x + p[0], v.y + p[1])
  const chiuso = await page.waitForSelector('[data-dialogo]', { state: 'detached', timeout: 3000 }).then(() => true, () => false)
  controlla('un tocco sul prato chiude il dialogo', chiuso)
  const va = await page.waitForFunction(c => document.querySelector('[data-eroe-mondo]').dataset.cella !== c, prima, { timeout: 20000 }).then(() => true, () => false)
  controlla('e l\'eroe va dove si è toccato', va)
  await fermoNelMondo(page)
  uguale('e la barra in basso è al suo posto', await page.locator('[data-barra-giu]').count(), 1)
})

/* ---------- 4. la guardia: la seconda missione presa non è fermata dalla prima ---------- */
await blocco('la guardia', async () => {
  await vaiETocca(page, '[data-personaggio="guardia"]', 'guardia', tocca, { atteso: '[data-dialogo="guardia"] [data-missione="chiavi"][data-fase="offre"]' })
  await scatto(page, 'missioni-guardia')
  await nelDialogo(page, '[data-scelta="prendi"][data-missione="chiavi"]', { tocca: toccaIl })
  await page.waitForSelector('[data-dialogo="guardia"] [data-fase="presa"]', { timeout: 3000 }).catch(() => {})
  const dopoDue = (await avventura()).missioni
  uguale('la guardia dà le sue chiavi', dopoDue?.chiavi, 'presa')
  uguale('tutte insieme: Rosicchione fatta, il goblin e le chiavi prese', JSON.stringify(Object.entries(dopoDue).sort()),
         JSON.stringify([['chiavi', 'presa'], ['collana', 'consegnata'], ['goblin', 'presa'], ['rosicchione', 'fatta']]))
  uguale('adesso tre punti di domanda e nessun «!»', await segni(), 'guardia:attesa,mugnaio:consegna,ragazza:attesa')
})

/* ---------- 5. il diario, e il dettaglio di una missione ---------- */
await blocco('il diario e il dettaglio', async () => {
  await apriIlDiario()
  uguale('la linguetta delle missioni porta lo stesso numero del globo', await page.locator('[data-scheda="missioni"] [data-missioni-pronte]').innerText(), '1')
  const righe = await page.locator('[data-diario] [data-sezione="da-consegnare"] li, [data-diario] [data-sezione="da-fare"] li').evaluateAll(
    els => els.map(e => ({ id: e.dataset.missione, stato: e.dataset.stato, sezione: e.closest('[data-sezione]').dataset.sezione, testo: e.innerText, ritaglio: !!e.querySelector('[data-ritaglio]') })))
  stessaLista('il diario le ha tutte e tre: la da consegnare in cima, poi le altre nell\'ordine della storia', righe.map(r => r.id), ['rosicchione', 'goblin', 'chiavi'])
  stessaLista('la consegna sta nel suo elenco, le altre due fra le da fare', righe.map(r => r.sezione), ['da-consegnare', 'da-fare', 'da-fare'])
  const ros = righe.find(r => r.id === 'rosicchione') || {}, gob = righe.find(r => r.id === 'goblin') || {}
  controlla('Rosicchione è fatta: torna dal mugnaio', ros.stato === 'fatta' && ros.testo.includes('Torna dal mugnaio: hai battuto Rosicchione'), ros.testo)
  controlla('il goblin è da fare, con la discesa, il piano e chi lo vuole', gob.stato === 'presa' && gob.testo.includes('da fare') &&
            gob.testo.includes('La torre bruciata, piano 1') && gob.testo.toLowerCase().includes('ragazza del pozzo'), gob.testo)
  controlla('ogni riga ha l\'icona ritagliata della discesa', righe.length && righe.every(r => r.ritaglio))
  controlla('il premio è nella riga', ros.testo.includes('Amuleto azzurro') && ros.testo.includes(`🪙 ${ROSICCHIONE.premio.monete}`))
  controlla('tre in mano, e il diario dice perché non ne arrivano altre', (await page.locator('[data-diario-tetto]').innerText()).includes('3 missioni'))
  await scatto(page, 'missioni-diario')

  uguale('finché non si tocca una voce l\'elenco resta aperto', await page.locator('[data-dettaglio]').count(), 0)
  await apriLaVoce('goblin')
  const dett = page.locator('[data-dettaglio]'), P = personaDi(GOBLIN.da)
  uguale('è una missione presa', await dett.getAttribute('data-stato'), 'presa')
  uguale('l\'elenco non c\'è più, nella stessa finestra', await page.locator('[data-sezione]').count(), 0)
  uguale('chi te l\'ha data: il suo nome', (await dett.locator('[data-dettaglio-chi] b').innerText()).trim(), P.nome)
  const faccia = await page.waitForSelector('[data-dettaglio-chi] [data-anteprima="3d"]', { timeout: 5000 }).then(() => true, () => false)
  controlla('e la sua faccia: la foto del suo modello', faccia)
  uguale('il racconto è la sua battuta', (await dett.locator('[data-racconto]').innerText()).trim(), `«${GOBLIN.dice}»`)
  const dove = await dett.locator('[data-dettaglio-dove]').innerText()
  controlla('dove: il nome della discesa e il piano, col ritaglio della mappa',
            dove.includes(TORRE.nome) && dove.includes(`piano ${GOBLIN.piano + 1}`) && await dett.locator('[data-dettaglio-dove] [data-ritaglio]').count() === 1, dove)
  const cosa = await dett.locator('[data-dettaglio-cosa]').innerText()
  controlla('cosa: il mostro col nome', cosa.includes(titoloDi(GOBLIN)) && (await dett.locator('[data-dettaglio-cosa]').getAttribute('data-tipo')) === GOBLIN.tipo, cosa)
  const premio = await dett.locator('[data-dettaglio-premio]').innerText()
  controlla('il premio: gemme e monete', (!GOBLIN.premio.gemme || premio.includes(`💎 ${GOBLIN.premio.gemme}`)) && (!GOBLIN.premio.monete || premio.includes(`🪙 ${GOBLIN.premio.monete}`)), premio)
  uguale('lo stato', (await dett.locator('[data-esito]').innerText()).trim(), 'Da fare')
  controlla('il tasto «segui questa» c\'è, e non si sta ancora seguendo',
            (await page.locator('[data-azione="segui"]').innerText()).includes('segui questa') && !(await page.locator('[data-azione="segui"]').getAttribute('data-segui-attivo')))
  uguale('non c\'è «vai da»: la missione è già presa', await page.locator('[data-azione="vai-da"]').count(), 0)
  await scatto(page, 'missioni-dettaglio')
  await toccaIl('[data-azione="indietro-diario"]')
  await page.waitForSelector('[data-diario] [data-sezione]', { timeout: 3000 })
  await chiudiIlDiario()
})

/* ---------- 6. giù nella torre: il fumetto lo ricorda, in cima il promemoria, e la freccina segue una delle due ---------- */
let dDifetto = null
await blocco('giù, il promemoria', async () => {
  const qui = await scendiNellaTorre()
  controlla('prima di scendere il fumetto della torre ricorda le due prese (non quella già fatta)',
            qui.includes('Grattanaso') && qui.includes('piano 1') && qui.includes('chiavi') && qui.includes('piano 3') && !qui.includes('Rosicchione'), qui)
  const promemoria = await page.locator('[data-promemoria] li').evaluateAll(els => els.map(e => ({ id: e.dataset.missione, dove: e.dataset.dove, testo: e.innerText })))
  stessaLista('in cima, una riga per missione, nell\'ordine della storia', promemoria.map(r => r.id), ['goblin', 'rosicchione', 'chiavi'])
  controlla('il goblin è su questo piano, e dice cosa cercare', promemoria[0]?.dove === 'qui' && /Grattanaso.*cerca il mostro con la corona/.test(promemoria[0]?.testo), promemoria[0]?.testo)
  controlla('Rosicchione è fatto: si ricorda a chi riportarlo', promemoria[1]?.dove === 'fatta' && /torna dal mugnaio/.test(promemoria[1]?.testo), promemoria[1]?.testo)
  controlla('le chiavi sono più giù, al terzo piano', promemoria[2]?.dove === 'sopra' && /il mazzo di chiavi della torre è al terzo piano/.test(promemoria[2]?.testo), promemoria[2]?.testo)
  controlla('e la discesa è al primo piano', (await page.locator('.sot-piede').textContent()).includes('piano 1'))
  dDifetto = await page.locator('[data-rotta]').getAttribute('data-missione-rotta')
  controlla('di difetto la freccina segue una delle due prese', ['goblin', 'chiavi'].includes(dDifetto), dDifetto)
  uguale('«qui» se è il goblin, «scala» se sono le chiavi', await page.locator('[data-rotta]').getAttribute('data-verso'), dDifetto === 'goblin' ? 'qui' : 'scala')
  uguale('e la sua riga è segnata', await page.locator('[data-promemoria] li[data-segui]').getAttribute('data-missione'), dDifetto)
  await scatto(page, 'missioni-promemoria')
  await lasciaLaDiscesa(page)
})

/* ---------- 7. «segui questa» sull'altra: la scelta resta nell'avventura e guida la freccina giù; «smetti» la toglie ---------- */
await blocco('segui questa', async () => {
  const scelta = dDifetto === 'goblin' ? 'chiavi' : 'goblin'
  await apriIlDiario()
  await apriLaVoce(scelta)
  await toccaIl('[data-azione="segui"]')
  const attivo = await page.waitForSelector('[data-azione="segui"][data-segui-attivo="1"]', { timeout: 3000 }).then(() => true, () => false)
  controlla('adesso si segue', attivo)
  uguale('la scelta sta nell\'avventura', (await avventura()).segui, scelta)
  await toccaIl('[data-azione="indietro-diario"]')
  await page.waitForSelector('[data-diario] li[data-segui]', { timeout: 3000 })
  uguale('«‹ indietro» riporta all\'elenco, con la voce seguita segnata', await page.locator('[data-diario] li[data-segui]').getAttribute('data-missione'), scelta)
  const v = await page.locator('[data-diario]').boundingBox()
  await tocca(v.x + 6, v.y + v.height - 6)
  const chiuso = await page.waitForSelector('[data-diario]', { state: 'detached', timeout: 3000 }).then(() => true, () => false)
  controlla('il tocco fuori chiude il diario', chiuso)

  await scendiNellaTorre()
  uguale('giù, sullo stesso piano, la freccina segue la scelta', await page.locator('[data-rotta]').getAttribute('data-missione-rotta'), scelta)
  uguale('e la riga che segue ha il suo segno', await page.locator('[data-promemoria] li[data-segui]').getAttribute('data-missione'), scelta)
  await lasciaLaDiscesa(page)

  await apriIlDiario()
  await apriLaVoce(scelta)
  uguale('riaprendo, la missione si segue ancora', await page.locator('[data-azione="segui"]').getAttribute('data-segui-attivo'), '1')
  await toccaIl('[data-azione="segui"]')
  await page.waitForSelector('[data-azione="segui"]:not([data-segui-attivo])', { timeout: 3000 }).catch(() => {})
  uguale('smesso: la scelta non c\'è più nell\'avventura', (await avventura()).segui, undefined)
  await chiudiIlDiario()
})

/* ---------- 8. la consegna: «vai dal mugnaio» dal diario, lui se ne accorge, e dice il premio ---------- */
await blocco('la consegna al mugnaio', async () => {
  await apriIlDiario()
  await apriLaVoce('rosicchione')
  uguale('la fatta dice a chi tornare', (await page.locator('[data-dettaglio] [data-esito]').innerText()).trim(), 'Fatta: torna dal mugnaio')
  uguale('non si segue: si porta', await page.locator('[data-azione="segui"]').count(), 0)
  uguale('«vai dal mugnaio»', pulito(await page.locator('[data-azione="vai-da"]').innerText()), 'vai dal mugnaio')
  const premio = await page.locator('[data-dettaglio-premio]').innerText()
  controlla('il premio ha il gioiello col suo nome e le monete', premio.includes('Amuleto azzurro') && premio.includes(`🪙 ${ROSICCHIONE.premio.monete}`), premio)
  await scatto(page, 'missioni-dettaglio-fatta')
  // il mugnaio sta lontano: l'eroe si porta vicino a lui (il salto delle prove), e «vai da» lo manda da lui
  await page.evaluate(() => window.__mondo3d.vai('mugnaio'))
  const monete = (await leggiProfilo(page)).coins
  const gemme = (await avventura()).roba?.gemme
  await toccaIl('[data-azione="vai-da"]')
  const chiuso = await page.waitForSelector('[data-diario]', { state: 'detached', timeout: 3000 }).then(() => true, () => false)
  controlla('«vai da» chiude il diario', chiuso)
  await page.waitForSelector('[data-dialogo="mugnaio"] [data-missione="rosicchione"][data-fase="consegna"]', { timeout: 60000 })
  uguale('e l\'eroe va dal mugnaio, che se ne accorge: la frase del ritorno', await page.locator('[data-riga]').innerText(), ROSICCHIONE.ritorno)
  uguale('arrivati, il mugnaio è in vista e l\'indicatore sul bordo sparisce', await page.locator('[data-consegna-fuori]').count(), 0)
  await nelDialogo(page, '[data-scelta="consegna"][data-missione="rosicchione"]', { tocca: toccaIl })
  await page.waitForSelector('[data-riga][data-fase="grazie"]', { timeout: 3000 })
  const a = await avventura()
  uguale('consegnata nell\'avventura', a.missioni?.rosicchione, 'consegnata')
  const base = k => (k || '').split('@')[0]   // a tono col livello dell'eroe (amuleto-azzurro@3)
  controlla('il gioiello va addosso o in tasca', base(a.roba?.collo) === 'amuleto-azzurro' || (a.roba?.zaino || []).map(base).includes('amuleto-azzurro'), JSON.stringify(a.roba))
  uguale('le gemme non cambiano (il premio è il gioiello)', a.roba?.gemme, gemme)
  uguale('le monete: il regalo', (await leggiProfilo(page)).coins, monete + ROSICCHIONE.premio.monete)
  for (let n = 0; n < 6 && !(await page.locator('[data-riga][data-premio]').count()); n++) await voltaPagina(page, toccaIl)
  const detto = await page.locator('[data-riga][data-premio]').innerText()
  controlla('e il mugnaio dice il premio in una pagina sua, monete comprese', detto.includes(`🪙 ${ROSICCHIONE.premio.monete}`) && detto.includes('Amuleto'), detto)
  await scatto(page, 'dialogo-premio')
  uguale('consegnata una, si libera un posto: il «!» del mugnaio', await segni(), 'guardia:attesa,mugnaio:nuova,ragazza:attesa')
  uguale('sul globo rosso non resta nessuna pastiglia', await page.locator('[data-azione="vita"]').getAttribute('data-missioni-pronte'), null)
  await nelDialogo(page, '[data-scelta="ciao"]', { tocca: toccaIl })
  const via = await page.waitForSelector('[data-dialogo]', { state: 'detached', timeout: 3000 }).then(() => true, () => false)
  controlla('arrivederci chiude', via)
})

/* ---------- 9. il diario dopo: il favore che aspetta, e la consegnata col suo grazie ---------- */
await blocco('il diario dopo la consegna', async () => {
  await apriIlDiario()
  const offerta = await page.locator('[data-sezione="ti-aspettano"] li').first().getAttribute('data-missione', { timeout: 3000 })
  const O = missioneDi(offerta)
  await apriLaVoce(offerta)
  uguale('il favore che aspetta ha il suo dettaglio', await page.locator('[data-dettaglio]').getAttribute('data-stato'), 'offerta')
  uguale('con il racconto di chi lo chiede', (await page.locator('[data-racconto]').innerText()).trim(), `«${O.dice}»`)
  uguale('«vai da …» per andare a prenderlo', pulito(await page.locator('[data-azione="vai-da"]').innerText()), 'vai ' + daLui(personaDi(O.da).chi))
  uguale('e non si segue ancora', await page.locator('[data-azione="segui"]').count(), 0)
  await toccaIl('[data-azione="indietro-diario"]')
  await page.waitForSelector('[data-diario] [data-sezione]', { timeout: 3000 })
  await apriLaVoce('rosicchione')
  uguale('la consegnata ha il suo stato', await page.locator('[data-dettaglio]').getAttribute('data-stato'), 'consegnata')
  uguale('e il grazie che ti ha detto', (await page.locator('[data-grazie]').innerText()).trim(), `«${ROSICCHIONE.grazie}»`)
  uguale('non c\'è niente da seguire né da portare', await page.locator('[data-azione="segui"], [data-azione="vai-da"]').count(), 0)
  await scatto(page, 'missioni-dettaglio-consegnata')
  await chiudiIlDiario()
})

/* ---------- 10. il minatore: la prima volta si presenta, poi la strada ---------- */
await blocco('il minatore', async () => {
  await vaiETocca(page, '[data-minatore]', 'minatore', tocca, { atteso: '[data-dialogo="minatore"]' })
  uguale('la prima volta si presenta', await page.locator('[data-riga]').getAttribute('data-detto'), null)
  await scatto(page, 'dialogo-minatore')
  for (let n = 0; n < 4 && !(await page.locator('[data-riga][data-detto]').count()); n++) await voltaPagina(page, toccaIl)
  controlla('poi dice la strada della prossima discesa', (await page.locator('[data-riga][data-detto]').innerText()).startsWith(TORRE.nome))
  await nelDialogo(page, '[data-scelta="racconta"]', { tocca: toccaIl })
  await page.waitForSelector('[data-riga][data-racconto]', { timeout: 3000 })
  controlla('cosa c\'è laggiù: il mostro grosso della torre', (await page.locator('[data-riga]').innerText()).includes('Fiammetta'))
  await nelDialogo(page, null, { tocca: toccaIl })
  uguale('dopo un\'altra domanda, «dove vado adesso?» torna', await page.locator('[data-scelta="strada"]').count(), 1)
  await toccaIl('[data-dialogo] [data-scelta="ciao"]')
  await page.waitForSelector('[data-dialogo]', { state: 'detached', timeout: 3000 })
})

/* ---------- 11. la storia in cima al diario: le sette porte, «segui questa» e «vai alla discesa» ---------- */
await blocco('la storia nel diario', async () => {
  const grosso = GROSSI[GROSSO_DELLA_DISCESA[TORRE.chiave]].nome
  await apriIlDiario()
  const sezioni = await page.locator('[data-diario] [data-sezione]').evaluateAll(els => els.map(e => e.dataset.sezione))
  uguale('la storia è la prima sezione del diario', sezioni[0], 'storia')
  const riga = await page.locator('[data-storia]').innerText()
  controlla('dice il titolo, la porta di adesso e chi battere',
            riga.includes('Chiudi le sette porte') && riga.includes(`Porta ${DISCESA + 1} di 7`) && riga.includes(TORRE.nome) && riga.includes(grosso), riga)
  uguale('con la freccina', await page.locator('[data-freccia-storia] .sot-freccina').count(), 1)
  uguale('e la carta della meta dice la sua discesa', await page.locator('[data-meta-carta]').getAttribute('data-meta'), TORRE.chiave)
  await toccaIl('[data-storia]')
  await page.waitForSelector('[data-dettaglio][data-missione="storia"]', { timeout: 3000 })
  const porte = await page.locator('[data-porte] [data-porta]').evaluateAll(els => els.map(e => e.dataset.stato))
  uguale('le porte finite sono chiuse, una è quella di adesso, le altre avanti',
         porte.join(','), CAMPAGNA.map((_, i) => (i < DISCESA ? 'chiusa' : i === DISCESA ? 'adesso' : 'avanti')).join(','))
  controlla('il minatore la dice, con il capitolo', (await page.locator('[data-dettaglio] [data-racconto]').innerText()).includes(grosso))
  await scatto(page, 'storia-dettaglio')
  await toccaIl('[data-dettaglio] [data-azione="segui"]')
  await page.waitForSelector('[data-dettaglio] [data-azione="segui"][data-segui-attivo="1"]', { timeout: 3000 }).catch(() => {})
  uguale('«segui questa» la sceglie', (await avventura()).segui, 'storia')
  // «vai alla discesa»: il diario si chiude e l'eroe va a quella della storia, dove il fumetto lo ripete (la strada è lunga: il salto delle prove)
  await page.evaluate(k => window.__mondo3d.vai('ingresso:' + k), TORRE.chiave)
  await toccaIl('[data-dettaglio] [data-azione="vai-da"]')
  await page.waitForSelector('[data-storia-qui="adesso"]', { timeout: 60000 })
  controlla('il fumetto della discesa dice che la storia continua qui', (await page.locator('[data-storia-qui]').innerText()).includes(grosso))
  await scatto(page, 'storia-fumetto')
})

uguale('nessun errore in console', errori.join(' · '), '')
nota(`le monete di Rosicchione: ${ROSICCHIONE.premio.monete}, del goblin ${GOBLIN.premio.monete}`)
await browser.close()
riassunto('le missioni, i dialoghi e il diario, col dito')
