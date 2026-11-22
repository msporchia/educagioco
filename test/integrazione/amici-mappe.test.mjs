/* perché: ogni mappa di gioco mostra gli amici dalla loro bacheca (pallino e nome sulla tappa, chi è da raggiungere, i record della sfida senza fine), anche senza servizio
   a parte perché: `amici` prova il giro dei due telefoni col servizio; qui gli amici sono già salvati, il servizio non risponde e si guarda solo come ogni gioco li mette sulla propria mappa
   Gli amici sulle mappe dei giochi, dalla loro bacheca (docs/core/amici-nei-giochi.md): sulla tappa di ognuno il pallino e
   il nome, in cima chi è da raggiungere, sulla sfida senza fine i loro record dal più alto e chi c'è senza record; un amico
   senza nome non si vede. Gli amici sono già salvati sul telefono e il servizio non risponde: niente deve rompersi. Le regole
   (le frasi, chi è davanti, chi ha superato chi) le prova `unita/amici-bacheca`; qui ogni gioco le mette al posto giusto.
   Un Chrome solo: la bacheca di un amico porta tutti i giochi, quindi una semina mette gli amici su tutte le mappe della
   stessa età, e si passa da un gioco all'altro dalla home. Tre momenti per età: a metà campagna, uno già in fondo, campagna
   finita. Prima, «ti ha superato» in home.
   `node test/esegui.mjs amici-mappe --niente-build` */
import { apriBrowser, apriGioco, amicoDiProva, scegli, scatto, difendi, GIOCATORE } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto, blocco } from '../aiuto/verifica.mjs'
import { voce, amiciDi, seminaConAmici, allaHome } from '../aiuto/bacheca.mjs'
import { finche } from '../aiuto/soste.mjs'
import { QUANTE_TAPPE as T_ARENA } from '../../src/giochi/arena/dati/campagna.js'
import { QUANTE_TAPPE as T_CODICE } from '../../src/giochi/codice-segreto/dati/campagna.js'
import { QUANTE_TAPPE as T_CONTA } from '../../src/giochi/conta/dati/campagna.js'
import { QUANTE_TAPPE as T_ROBOT, FILA_ATTUALE as FILA_ROBOT } from '../../src/giochi/costruttore/dati/campagna.js'
import { QUANTE_TAPPE as T_GIARDINO } from '../../src/giochi/giardino/dati/campagna.js'
import { QUANTE_TAPPE as T_POZIONI } from '../../src/giochi/pozioni/dati/campagna.js'
import { QUANTE_TAPPE as T_PRIMA } from '../../src/giochi/prima-dopo/dati/campagna.js'
import { QUANTE_TAPPE as T_SURVIVORS } from '../../src/giochi/survivors/dati/campagna.js'
import { TAPPE as TAPPE_EN } from '../../src/giochi/inglese/dati/mondi.js'
import { TAPPE as TAPPE_ES } from '../../src/giochi/spagnolo/dati/mondi.js'
import { RACCONTO } from '../../src/data/campagne-castello.js'
import { SCALETTA } from '../../src/data/asteroidi.js'
import { STRADE } from '../../src/giochi/passo-passo/motore/strade.js'
import { FILA_ATTUALE as FILA_PASSO } from '../../src/giochi/passo-passo/dati/campagna.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await page.addInitScript(() => { globalThis.__SERVIZIO_SFIDE__ = 'http://127.0.0.1:9' })
const veri = () => errori.filter(e => !/WebSocket connection|Failed to load resource|net::ERR|ERR_/.test(e))

const testo = sel => page.locator(sel).first().textContent().then(t => t.replace(/\s+/g, ' ').trim())
const testi = sel => page.$$eval(sel, l => l.map(e => e.textContent.replace(/\s+/g, ' ').trim()))
const conta = sel => page.locator(sel).count()
const pallini = al => conta(`[data-amici-qui][data-al="${al}"] [data-pallino-amico]`)
const stelle = n => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 2]))
// il centro orizzontale di una cosa sulla mappa
const centroX = sel => page.locator(sel).first().evaluate(e => { const r = e.getBoundingClientRect(); return r.left + r.width / 2 })
const centro = async sel => { const b = await page.locator(sel).first().boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 } }
// il fumetto aperto su un segnalino, quando dice quello che si aspetta (o, scaduta l'attesa, quello che dice)
const fumettoQuando = ok => finche(() => page.locator('[data-fumetto]').count().then(n => n ? testo('[data-fumetto]') : ''), ok, 3000)

/* I giorni dalla lettura di ogni amico, per momento: la bacheca è una per amico, uguale in tutti i giochi */
const FA = { meta: { a: 0, b: 3, c: 0, d: 1 }, fondo: { a: 0 }, fine: { a: 1, b: 0, d: 2, e: 1, f: 2 } }
// quello che c'è sulla mappa appena aperta, per sapere che gli amici sono disegnati: un pallino, o la riga in cima
const SEGNO = { meta: '[data-pallino-amico], [data-amico-in-rotta]', fondo: '[data-amico-davanti]',
                fine: '[data-pallino-amico], [data-amico-in-rotta]' }

/* ── Le mappe semplici: una carta per tappa, `[data-amici-qui][data-al]` sopra (Conta, Prima e dopo, pozioni, giardino,
      Castle Battle); finite le tappe chi c'è arrivato ha solo la riga in cima ── */
function mappaSemplice({ chiave, eta, prefisso, tappe, mezza, alto, fondo, infinita, settings }) {
  const campagna = tappa => ({ campagne: { [chiave]: { tappa, libera: tappa === tappe, stelle: stelle(tappa), cfg: {} } } })
  return {
    chiave, eta, settings, pronta: `.${prefisso}-tappa[data-tappa="0"]`,
    profilo: { meta: campagna(mezza), fine: campagna(tappe) },
    amici: {
      meta: { a: voce(chiave, alto), b: voce(chiave, mezza), d: voce(chiave, alto), c: voce(chiave, alto + 2) },
      fondo: { a: voce(chiave, tappe) },
      fine: { a: voce(chiave, tappe), b: voce(chiave, tappe - 1), d: voce(chiave, 0) },
    },
    async meta() {
      uguale('il segno del bambino è sulla tappa da fare',
             await page.locator(`.${prefisso}-tappa.${prefisso}-adesso`).getAttribute('data-tappa'), String(mezza))
      uguale('in cima chi è da raggiungere', await testo('[data-amico-davanti]'), `Lorenzo è ${alto - mezza} tappe più avanti di te.`)
      uguale(`sulla tappa ${alto} due pallini`, await pallini(alto), 2)
      uguale('sul nome: Lorenzo e Ugo', await testo(`[data-amici-qui][data-al="${alto}"]`), 'LULorenzo e Ugo sono qui')
      uguale('sulla tappa del bambino, Marta', await testo(`[data-amici-qui][data-al="${mezza}"]`), 'MMarta è qui')
      uguale('tre pallini in tutto, non quello senza nome', await conta('[data-amici-qui] [data-pallino-amico]'), 3)
      uguale('le altre tappe non hanno la riga', await conta('[data-amici-qui]'), 2)
      uguale('nessun record: niente sfida senza fine coi record', await conta('[data-record-amico], [data-record-amici]'), 0)
      await page.locator(`.${prefisso}-tappa[data-tappa="${alto}"]`).scrollIntoViewIfNeeded()
      await scatto(page, `amici-${chiave}-mappa`)
    },
    async fondo() {
      if (infinita) {
        uguale('in cima chi è alla battaglia infinita', await testo('[data-amico-davanti]'), 'Lorenzo è già alla battaglia infinita.')
        uguale('e ha il pallino sulla battaglia infinita', await pallini('infinita'), 1)
        uguale('e il nome', await testo('[data-infinita] [data-amici-qui]'), 'LLorenzo è qui')
        uguale('sulle tappe non c\'è nessuno', await conta('[data-tappa] [data-amici-qui]'), 0)
        await scatto(page, `amici-${chiave}-infinita`)
      } else {
        uguale('in cima chi è in fondo', await testo('[data-amico-davanti]'), `Lorenzo è già ${fondo}.`)
        uguale('ma sulla mappa non ha un pallino', await conta('[data-amici-qui]'), 0)
      }
    },
    async fine() {
      uguale('nessuno è più avanti di chi ha finito', await conta('[data-amico-davanti]'), 0)
      uguale('Marta è sull\'ultima tappa', await pallini(tappe - 1), 1)
      if (infinita) {
        uguale('il segno del bambino è sulla battaglia infinita, aperta', await conta('[data-infinita]:not([disabled])'), 1)
        uguale('Lorenzo è con lui sulla battaglia infinita', await testo('[data-infinita] [data-amici-qui]'), 'LLorenzo è qui')
        uguale('due pallini in tutto', await conta('[data-amici-qui] [data-pallino-amico]'), 2)
      } else uguale('un pallino in tutto', await conta('[data-amici-qui] [data-pallino-amico]'), 1)
    },
  }
}

/* ── Le mappe del tesoro delle lingue: la tappa è la prima non vinta nella fila dei mondi; il pallino sta sotto il nome della
      tappa, `[data-nave][data-porto]` dice dove sta il segno del bambino ── */
function mappaDelTesoro(chiave, TAPPE, settings) {
  const vinte = n => ({ campagne: { [chiave]: { vinte: Object.fromEntries(TAPPE.slice(0, n).map(t => [t.id, 1])), tappa: n,
                                                libera: false, stelle: {}, cfg: {} } } })
  return {
    chiave, eta: 6.5, settings, pronta: '[data-mappa-inglese] [data-tappa]', nave: true,
    profilo: { meta: vinte(3), fine: vinte(TAPPE.length) },
    amici: {
      meta: { a: voce(chiave, 7), b: voce(chiave, 3), d: voce(chiave, 7), c: voce(chiave, 9) },
      fondo: { a: voce(chiave, TAPPE.length) },
      fine: { a: voce(chiave, TAPPE.length), b: voce(chiave, TAPPE.length - 1), d: voce(chiave, 0) },
    },
    async meta() {
      uguale('la nave del bambino è sulla tappa da fare', await page.locator('[data-nave]').getAttribute('data-porto'), 'tappa:' + TAPPE[3].id)
      uguale('in cima chi è da raggiungere', await testo('[data-amico-davanti]'), 'Lorenzo è 4 tappe più avanti di te.')
      uguale('la riga in cima sta fuori da quello che scorre', await conta('[data-mappa-inglese] [data-amico-davanti]'), 0)
      uguale('sulla tappa 7 due pallini', await pallini(7), 2)
      uguale('e i nomi: Lorenzo e Ugo', await testo('[data-amici-qui][data-al="7"]'), 'LULorenzo e Ugo sono qui')
      uguale('sulla tappa del bambino, Marta', await testo('[data-amici-qui][data-al="3"]'), 'MMarta è qui')
      uguale('tre pallini in tutto, non quello senza nome', await conta('[data-amici-qui] [data-pallino-amico]'), 3)
      uguale('le altre tappe non hanno la riga', await conta('[data-amici-qui]'), 2)
      uguale('nessun record: il gioco non ha una sfida senza fine', await conta('[data-record-amico], [data-record-amici]'), 0)
      // lo stesso nodo del segno del bambino: il pallino di Marta sta sotto il tasto della tappa su cui è ferma la nave
      const sotto = await centroX('[data-amici-qui][data-al="3"]'), nodo = await centroX(`[data-tappa="${TAPPE[3].id}"]`)
      controlla('il pallino di Marta è sotto la tappa della nave', Math.abs(sotto - nodo) < 4, `${sotto} contro ${nodo}`)
      await page.locator('[data-amici-qui][data-al="7"]').scrollIntoViewIfNeeded()
      await scatto(page, `amici-${chiave}-mappa`)
    },
    async fondo() {
      uguale('in cima chi è in fondo', await testo('[data-amico-davanti]'), 'Lorenzo è già in fondo alla mappa.')
      uguale('ma sulla mappa non ha un pallino', await conta('[data-amici-qui]'), 0)
    },
    async fine() {
      uguale('nessuno è più avanti di chi ha finito', await conta('[data-amico-davanti]'), 0)
      uguale('Marta è sulla sua tappa', await pallini(TAPPE.length - 1), 1)
      uguale('un pallino in tutto', await conta('[data-amici-qui] [data-pallino-amico]'), 1)
    },
  }
}

/* ── Le mappe con una sfida senza fine coi record sotto (Codice Segreto, Survivors) ── */
function mappaColLibero({ chiave, pronta, tappe, record, mio, sulTasto }) {
  return {
    chiave, eta: 9, pronta,
    profilo: {
      meta: { campagne: { [chiave]: { tappa: 2, libera: false, stelle: { 0: 1, 1: 1 }, cfg: {} } } },
      fine: { campagne: { [chiave]: { tappa: tappe, libera: true, stelle: {}, cfg: {},
                                      primato: { best: mio, quando: 1, partite: 3, ultime: [] } } } },
    },
    amici: {
      meta: { a: voce(chiave, 5), b: voce(chiave, 2), d: voce(chiave, 5), c: voce(chiave, 7) },
      fine: { a: voce(chiave, tappe, record.a), b: voce(chiave, tappe), d: voce(chiave, tappe, record.d) },
    },
    async meta() {
      uguale('in cima chi è da raggiungere', await testo('[data-amico-davanti]'), 'Lorenzo è 3 tappe più avanti di te.')
      uguale('sulla tappa 5 tutti e due, col nome', await testo('[data-amici-qui][data-al="5"]'), 'LULorenzo e Ugo sono qui')
      uguale('sulla mia, Marta', await testo('[data-amici-qui][data-al="2"]'), 'MMarta è qui')
      uguale('un pallino per amico col nome, non per quello senza', await conta('[data-amici-qui] [data-pallino-amico]'), 3)
      uguale('e nessuno alla sfida senza fine', await conta('[data-record-amico]'), 0)
      await page.locator('[data-amici-qui][data-al="5"]').scrollIntoViewIfNeeded()
      await scatto(page, `amici-${chiave}-tappe`)
    },
    async fine() {
      uguale('nessuno è più avanti di chi è alla sfida senza fine', await conta('[data-amico-davanti]'), 0)
      uguale('sotto la sfida senza fine i record degli amici, dal più alto', (await testi('[data-record-amico]')).join(' | '), record.righe)
      uguale('e chi c\'è senza record', await testo('[data-amici-qui][data-al="libero"]'), 'MMarta è qui')
      controlla('il mio record resta sul tasto', sulTasto.test(await testo('[data-tappa="libero"]')))
      await page.locator('[data-record-amico]').first().scrollIntoViewIfNeeded()
      await scatto(page, `amici-${chiave}-libero`)
    },
  }
}

/* ── Passo passo: una mappa per protagonista, il coniglio e il cane, ognuna coi suoi amici e il suo sentiero ── */
const { coniglio, cane } = STRADE
const piccoli = coniglio.filter(i => i < cane[0])          // le tappe del coniglio fatte, prima che cominci il cane
const segnalinoAl = () => page.locator('[data-segnalino]').getAttribute('data-al')
const passo = {
  chiave: 'passo', eta: 9, pronta: '[data-mappa] [data-tappa]',
  profilo: {
    meta: { campagne: { passo: { tappa: 4, stelle: {}, cfg: { fila: FILA_PASSO } } } },
    // il cane a due tappe, coi suoi record; il coniglio ai passi dopo i piccoli
    fine: { campagne: { passo: { tappa: 0, stelle: Object.fromEntries([...piccoli, ...cane.slice(0, 2)].map(i => [i, 1])),
                                 cfg: { fila: FILA_PASSO, ultima: cane[1] } } } },
  },
  amici: {
    meta: { a: { passo: { posti: { coniglio: 7 }, primati: {} } }, b: { passo: { posti: { coniglio: 4 }, primati: {} } },
            d: { passo: { posti: { coniglio: 7 }, primati: {} } }, c: { passo: { posti: { coniglio: 9 }, primati: {} } } },
    fine: {
      a: { passo: { posti: { cane: 5, coniglio: piccoli.length + 2 }, primati: {} } },
      b: { passo: { posti: { coniglio: coniglio.length }, primati: { coniglio: 12 } } },
      d: { passo: { posti: { cane: cane.length }, primati: { cane: 8 } } },
      e: { passo: { posti: { cane: cane.length, coniglio: coniglio.length }, primati: {} } },
      f: { passo: { posti: {}, primati: { cane: 4 } } },             // un record e nessun posto
    },
  },
  async meta() {
    uguale('il segnalino del coniglio sta sul suo posto 4', await segnalinoAl(), String(coniglio[4]))
    uguale('in cima chi è da raggiungere', await testo('[data-amico-davanti]'), 'Lorenzo è 3 tappe più avanti di te.')
    uguale('sulla tappa 7 due pallini', await conta('[data-amici-casella][data-al="7"] [data-pallino-amico]'), 2)
    uguale('sulla mia, Marta', await conta('[data-amici-casella][data-al="4"] [data-pallino-amico]'), 1)
    uguale('un pallino per amico col nome, non per quello senza', await conta('[data-amici-casella] [data-pallino-amico]'), 3)
    await page.locator(`[data-mappa] [data-tappa="${coniglio[7]}"]`).click()
    await page.waitForSelector('[data-fumetto] [data-amici-qui]', { timeout: 3000 })
    uguale('toccando la tappa il nome nel fumetto', await testo('[data-fumetto] [data-amici-qui]'), 'LULorenzo e Ugo sono qui')
    await page.locator('[data-fumetto]').scrollIntoViewIfNeeded()
    await scatto(page, 'amici-passo-coniglio')
  },
  async fine() {
    uguale('si apre sul cane, che ha giocato per ultimo', await page.locator('[data-mappa]').getAttribute('data-protagonista'), 'cane')
    uguale('il segnalino del cane sta sul suo posto 2', await segnalinoAl(), String(cane[2]))
    uguale('in cima chi è da raggiungere sulla sua strada', await testo('[data-amico-davanti]'), 'Lorenzo è 3 tappe più avanti di te.')
    uguale('un pallino solo: gli altri sono al sentiero o sull\'altra strada', await conta('[data-amici-casella] [data-pallino-amico]'), 1)
    uguale('sulla tappa 5 del cane', await conta('[data-amici-casella][data-al="5"] [data-pallino-amico]'), 1)
    uguale('i record del sentiero del cane, dal più alto', (await testi('.pp-sentiero-nome [data-record-amico]')).join(' | '), 'UUgo: 8 di fila | DDario: 4 di fila')
    uguale('e chi c\'è senza record', await testo('.pp-sentiero-nome [data-amici-qui]'), 'SSara è qui')
    await page.locator('.pp-sentiero-nome').scrollIntoViewIfNeeded()
    await scatto(page, 'amici-passo-cane-sentiero')
    // cambiando protagonista, la mappa e gli amici sono quelli giusti
    await page.click('[data-scegli="coniglio"]')
    await page.waitForSelector('[data-mappa][data-protagonista="coniglio"] [data-tappa]', { timeout: 8000 })
    const dopoIPiccoli = String(coniglio[piccoli.length])
    uguale('il segnalino del coniglio sta sulla prima tappa dopo i piccoli', await finche(segnalinoAl, v => v === dopoIPiccoli, 3000), dopoIPiccoli)
    uguale('in cima chi è da raggiungere sulla strada del coniglio', await testo('[data-amico-davanti]'), 'Lorenzo è 2 tappe più avanti di te.')
    uguale('un pallino sulla sua tappa', await conta(`[data-amici-casella][data-al="${piccoli.length + 2}"] [data-pallino-amico]`), 1)
    uguale('i record del sentiero del coniglio', (await testi('.pp-sentiero-nome [data-record-amico]')).join(' | '), 'MMarta: 12 di fila')
    uguale('e chi c\'è senza record', await testo('.pp-sentiero-nome [data-amici-qui]'), 'SSara è qui')
    await page.locator('.pp-sentiero-nome').scrollIntoViewIfNeeded()
    await scatto(page, 'amici-passo-coniglio-sentiero')
  },
}

/* ── Il Robot: i pallini sotto i led, il nome nel fumetto ── */
const nomeSulLed = async livello => {
  await page.locator(`[data-livello="${livello}"]`).scrollIntoViewIfNeeded()
  await page.locator(`[data-livello="${livello}"]`).click()
  await page.waitForSelector(`[data-fumetto-per="${livello}"]`, { timeout: 3000 })
  return page.locator(`[data-fumetto-per="${livello}"] [data-amici-qui]`).count()
    .then(n => n ? testo(`[data-fumetto-per="${livello}"] [data-amici-qui]`) : null)
}
const robot = {
  chiave: 'costruttore', eta: 10, pronta: '[data-scheda-robot] [data-livello]',
  profilo: {
    meta: { campagne: { costruttore: { tappa: 4, libera: false, stelle: { 0: 2, 1: 2, 2: 1, 3: 2 }, cfg: { fila: FILA_ROBOT } } } },
    fine: { campagne: { costruttore: { tappa: T_ROBOT, libera: true,
                                       stelle: Object.fromEntries(Array.from({ length: T_ROBOT }, (_, i) => [i, 1])), cfg: { fila: FILA_ROBOT } } } },
  },
  amici: {
    meta: { a: voce('costruttore', 7), b: voce('costruttore', 4), d: voce('costruttore', 7), c: voce('costruttore', 9) },
    fine: { a: voce('costruttore', T_ROBOT), b: voce('costruttore', T_ROBOT - 1), d: voce('costruttore', 0) },
  },
  async meta() {
    uguale('il robot sta sul livello da fare', await page.locator('[data-robot]').getAttribute('data-al'), '4')
    uguale('in cima chi è da raggiungere', await testo('[data-amico-davanti]'), 'Lorenzo è 3 tappe più avanti di te.')
    uguale('sotto il led 7 due pallini', await conta('[data-amici-led][data-al="7"] [data-pallino-amico]'), 2)
    uguale('sotto il mio, Marta', await conta('[data-amici-led][data-al="4"] [data-pallino-amico]'), 1)
    uguale('un pallino per amico col nome, non per quello senza', await conta('[data-amici-led] [data-pallino-amico]'), 3)
    uguale('nessun record: il gioco non ha una sfida senza fine', await conta('[data-record-amico]'), 0)
    uguale('il nome nel fumetto del led 7', await nomeSulLed(7), 'LULorenzo e Ugo sono qui')
    await scatto(page, 'amici-costruttore-led')
    uguale('e su quello dove c\'è Marta', await nomeSulLed(4), 'MMarta è qui')
    uguale('un led senza amici non ha la riga', await nomeSulLed(2), null)
  },
  async fine() {
    uguale('nessuno è più avanti di chi ha finito', await conta('[data-amico-davanti]'), 0)
    uguale('Lorenzo è sotto il connettore', await conta('[data-amici-led][data-al="libero"] [data-pallino-amico]'), 1)
    uguale('e Marta sotto il suo led', await conta(`[data-amici-led][data-al="${T_ROBOT - 1}"] [data-pallino-amico]`), 1)
    uguale('due pallini in tutto', await conta('[data-amici-led] [data-pallino-amico]'), 2)
    await page.locator('[data-libero]').scrollIntoViewIfNeeded()
    await page.locator('[data-libero]').click()
    await page.waitForSelector('[data-fumetto-per="libero"]', { timeout: 3000 })
    uguale('il nome nel fumetto del cantiere libero', await testo('[data-fumetto] [data-amici-qui]'), 'LLorenzo è qui')
    await scatto(page, 'amici-costruttore-libero')
  },
}

/* ── Il regno del castello: i pallini sotto gli scudi, il nome nel fumetto, i record sui torrioni delle libere ── */
const N = RACCONTO.length
const apriFumetto = async quale => {
  await page.locator(`[data-tappa="${quale}"]`).click()
  await page.waitForSelector('[data-fumetto]', { timeout: 3000 })
}
const castello = {
  chiave: 'torri', eta: 10, pronta: '.tappe',
  profilo: { meta: { td: { tappa: 5, libera: false, v: 2 } }, fine: { td: { tappa: N, libera: true, v: 2 } } },
  amici: {
    meta: { a: voce('torri', 9), b: voce('torri', 5), d: voce('torri', 9), c: voce('torri', 12) },
    fine: {
      a: { torri: { posti: { '': N }, primati: { 'libera-bosco': 30, 'libera-mura': 12 } } },
      b: voce('torri', N),                                     // alle libere, ma non ha ancora un record
      d: voce('torri', N - 1),                                 // sull'ultimo scudo
      e: voce('torri', 0),                                     // non ha fatto niente: non c'è
    },
  },
  async meta() {
    uguale('il cavaliere sta sulla tappa da fare', await page.locator('[data-eroe]').getAttribute('data-dove'), '5')
    uguale('in cima chi è da raggiungere', await testo('[data-amico-davanti]'), 'Lorenzo è 4 tappe più avanti di te.')
    uguale('la riga sta fuori dalla parte che si trascina', await conta('.banco [data-amico-davanti]'), 0)
    uguale('sullo scudo 9 due pallini', await conta('[data-amici-scudo][data-al="9"] [data-pallino-amico]'), 2)
    uguale('sotto il mio, Marta: lo stesso nodo del cavaliere', await conta('[data-amici-scudo][data-al="5"] [data-pallino-amico]'), 1)
    uguale('un pallino per amico col nome, non per quello senza', await conta('[data-amici-scudo] [data-pallino-amico]'), 3)
    const scudo = await centro('.tap[data-tappa="5"]'), sotto = await centro('[data-amici-scudo][data-al="5"]')
    controlla('il pallino sta sotto il suo scudo', Math.abs(sotto.x - scudo.x) < 3 && sotto.y > scudo.y + 15 && sotto.y < scudo.y + 45, JSON.stringify({ scudo, sotto }))
    uguale('nessuno è al centro', await conta('[data-amici-scudo][data-al="libere"]'), 0)
    uguale('nessun record: le libere sono chiuse e nessuno ne ha', await conta('[data-record-amico]'), 0)
    await apriFumetto('9')
    uguale('il nome nel fumetto dello scudo 9', await testo('[data-fumetto] [data-amici-qui]'), 'LULorenzo e Ugo sono qui')
    await scatto(page, 'amici-castello-scudo')
    await page.locator('[data-tappa="5"]').click()
    controlla('e su quello dove c\'è Marta', /Marta è qui/.test(await fumettoQuando(t => /Marta/.test(t))))
    uguale('solo lei', await testo('[data-fumetto] [data-amici-qui]'), 'MMarta è qui')
    await page.locator('[data-tappa="2"]').click()
    await fumettoQuando(t => t && !/Marta/.test(t))
    uguale('uno scudo senza amici non ha la riga', await conta('[data-fumetto] [data-amici-qui]'), 0)
  },
  async fine() {
    uguale('nessuno è più avanti di chi ha finito', await conta('[data-amico-davanti]'), 0)
    uguale('Marta è al centro, una volta sola', await conta('[data-amici-scudo][data-al="libere"] [data-pallino-amico]'), 1)
    uguale('Ugo è sul suo scudo', await conta(`[data-amici-scudo][data-al="${N - 1}"] [data-pallino-amico]`), 1)
    uguale('Lorenzo è sui torrioni dove ha un record, non al centro', await conta('[data-amici-scudo][data-al^="libera-"] [data-pallino-amico]'), 2)
    uguale('quattro gruppi in tutto: lo scudo di Ugo, i due torrioni e il centro', await conta('[data-amici-scudo]'), 4)
    await page.locator('[data-amici-scudo][data-al="libere"]').scrollIntoViewIfNeeded()
    await scatto(page, 'amici-castello-centro')
    const record = []
    for (const q of ['libera-bosco', 'libera-sotterraneo', 'libera-mura', 'libera-palude']) {
      await apriFumetto(q)
      record.push({ record: await page.locator('[data-fumetto] [data-record-amico]').allTextContents(),
                    qui: await page.locator('[data-fumetto] [data-amici-qui]').allTextContents() })
      await page.locator(`[data-tappa="${q}"]`).click()                // lo richiude
      await page.waitForSelector('[data-fumetto]', { state: 'detached', timeout: 3000 })
    }
    controlla('il bosco dice il record di Lorenzo', /Lorenzo: 30/.test(record[0].record.join(' ')), JSON.stringify(record[0]))
    controlla('e chi è alle libere senza un record lì', /Marta/.test(record[0].qui.join(' ')) && !/Lorenzo/.test(record[0].qui.join(' ')), JSON.stringify(record[0]))
    controlla('il sotterraneo non ha record, ma chi c\'è', record[1].record.length === 0 && /Lorenzo.*Marta/.test(record[1].qui.join(' ')), JSON.stringify(record[1]))
    controlla('le mura dicono il record di Lorenzo', /Lorenzo: 12/.test(record[2].record.join(' ')), JSON.stringify(record[2]))
    uguale('Ugo, sull\'ultimo scudo, non è alle libere', record.filter(r => /Ugo/.test(r.qui.join(' '))).length, 0)
    await apriFumetto('libera-bosco')
    await scatto(page, 'amici-castello-libera')
    await page.locator('[data-tappa="libera-bosco"]').click()          // chiude il fumetto
    await page.waitForSelector('[data-fumetto]', { state: 'detached', timeout: 3000 })
    /* a fine partita libera, contro i record: si cade alla ventesima ondata, sopra i 12 di Lorenzo alle mura */
    await difendi(page, '[data-tappa="libera-mura"]')
    await page.waitForFunction(() => window.__td && window.__td.fase.value === 'gioco', null, { timeout: 5000 })
    const fase = await page.evaluate(async () => {
      const attesa = ms => new Promise(r => setTimeout(r, ms))
      const T = window.__td
      T.scegliTorre('add')
      T.operazioneFinita({ errori: 0, ms: 900 })
      await attesa(100)
      T.velocita.value = 60
      T.hud.onda = 20
      for (let giro = 0; giro < 600 && T.fase.value === 'gioco'; giro++) {
        if (T.regaloAperto.value) T.prendiRegalo('frecce')
        if (T.inAttesa.value) T.chiamaOnda()
        await attesa(25)
      }
      return T.fase.value
    })
    uguale('si cade', fase, 'fine')
    await page.waitForSelector('[data-contro-amici]', { timeout: 3000 })
    const frase = await testo('[data-contro-amici]')
    controlla('il cartello dice che Lorenzo è stato superato (12 ondate)', /Hai superato Lorenzo \(12 ondate\)/.test(frase), frase)
    await scatto(page, 'amici-castello-fine')
    uguale('e il record di prima c\'è ancora una frase sola', await conta('[data-contro-amici]'), 1)
  },
}

/* ── La rotta degli asteroidi: un pallino con l'iniziale sotto la tappa, nel fumetto chi c'è e da quando, nel volo i record,
      e a fine volo la notizia contro di loro ── */
const inRotta = () => page.$$eval('[data-amico-in-rotta]', l => l.map(e => ({ al: e.dataset.al, testo: e.textContent.trim() })))
const rotta = {
  chiave: 'mate', eta: 9, pronta: '[data-rotta] [data-tappa]',
  profilo: { meta: { mate: { tappa: 0, fila: 3, libera: false } }, fine: { mate: { tappa: 10, fila: SCALETTA.length, libera: true } } },
  amici: {
    meta: { a: voce('mate', 5), b: voce('mate', 3), c: voce('mate', 8) },
    fine: { a: voce('mate', SCALETTA.length, 3400), b: voce('mate', 4, 1) },
  },
  async meta() {
    const p = await inRotta()
    uguale('un pallino per amico col nome, non per quello senza', p.length, 2)
    controlla('Lorenzo sotto la tappa 5, con la sua iniziale', p.some(x => x.al === '5' && x.testo === 'L'), JSON.stringify(p))
    controlla('Marta sotto la mia, la 3', p.some(x => x.al === '3' && x.testo === 'M'), JSON.stringify(p))
    uguale('in cima chi è da raggiungere', await testo('[data-amico-davanti]'), 'Lorenzo è 2 tappe più avanti di te.')
    const colori = await page.$$eval('[data-amico-in-rotta]', l => l.map(e => getComputedStyle(e).backgroundColor))
    controlla('due amici, due colori', colori[0] !== colori[1], colori.join(' / '))
    // i pallini non coprono il nome della tappa né la stella
    const sovrapposti = await page.evaluate(() => {
      const dentro = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
      const pp = [...document.querySelectorAll('[data-amico-in-rotta]')].map(e => e.getBoundingClientRect())
      const altri = [...document.querySelectorAll('.nome b, [data-stelle-tappa]')].map(e => e.getBoundingClientRect())
      return pp.filter(r => altri.some(a => dentro(r, a))).length
    })
    uguale('i pallini non coprono nomi e stelle', sovrapposti, 0)
    await page.click('[data-tappa="5"]')
    await page.waitForSelector('[data-fumetto-per="5"] [data-amici-qui]', { timeout: 3000 })
    uguale('nel fumetto chi c\'è e da quando', await testo('[data-fumetto] [data-amici-qui]'), 'LLorenzo è qui · oggi')
    await scatto(page, 'amici-rotta-tappa')
    await page.click('[data-tappa="3"]')
    await page.waitForSelector('[data-fumetto-per="3"]', { timeout: 3000 })
    controlla('e Marta dice da quanti giorni', /Marta è qui · 3 giorni fa/.test(await testo('[data-fumetto]')), await testo('[data-fumetto]'))
  },
  async fine() {
    uguale('nessuno è più avanti di chi è al volo: in cima non si dice niente', await conta('[data-amico-davanti]'), 0)
    uguale('il suo pallino sta al volo', (await inRotta()).find(x => x.testo === 'L')?.al, String(SCALETTA.length))
    await page.click('[data-volo]')
    await page.waitForSelector('[data-fumetto] [data-record-amici]', { timeout: 3000 })
    uguale('nel volo i record degli amici, dal più alto', (await testi('[data-fumetto] [data-record-amico]')).join(' | '), 'LLorenzo: 3400 punti | MMarta: 1 punto')
    uguale('chi ha un record non si ripete come «è qui»', await conta('[data-fumetto] [data-amici-qui]'), 0)
    await scatto(page, 'amici-rotta-volo')
    await page.click('[data-fumetto] [data-azione="parti"]')
    await page.waitForFunction(() => window.__mate && window.__mate.fase.value === 'gioco', null, { timeout: 5000 })
    const fine = await page.evaluate(async () => {
      const m = window.__mate
      // qualche giusta per fare punti, poi si sbaglia fino alla fine
      for (let i = 0; i < 80 && m.fase.value === 'gioco'; i++) {
        const vivi = m.asteroidi().filter(x => !x.morto)
        if (!vivi.length) { await new Promise(r => setTimeout(r, 50)); continue }
        const giusto = vivi.find(x => x.ok)
        m.colpisci(i < 4 || !vivi.find(x => !x.ok) ? giusto : vivi.find(x => !x.ok))
        await new Promise(r => setTimeout(r, 15))
      }
      return { fase: m.fase.value, punti: m.hud.punti }
    })
    uguale('la partita finisce', fine.fase, 'fine')
    await page.waitForSelector('[data-contro-amici]', { timeout: 3000 })
    const frase = await testo('[data-contro-amici]')
    controlla('a fine volo: superata Marta, con la misura', /^Hai superato Marta \(1 punto\)!$/.test(frase), `${fine.punti} punti: «${frase}»`)
    // i cartelli dei traguardi coprono il velo: per la foto si tolgono
    await page.evaluate(() => document.querySelectorAll('.velo').forEach(v => v.querySelector('.occhiello') && v.click()))
    await scatto(page, 'amici-rotta-fine')
  },
}

const GIOCHI = [
  mappaSemplice({ chiave: 'arena', eta: 9, prefisso: 'ar', tappe: T_ARENA, mezza: 2, alto: 6, infinita: true, settings: { sperimentali: true } }),
  mappaColLibero({ chiave: 'codice', pronta: '.cs-mappa', tappe: T_CODICE, mio: 5, sulTasto: /record 5/,
                   record: { a: 12, d: 8, righe: 'LLorenzo: 12 di fila | UUgo: 8 di fila' } }),
  mappaSemplice({ chiave: 'giardino', eta: 9, prefisso: 'gi', tappe: T_GIARDINO, mezza: 2, alto: 6, fondo: 'in fondo al giardino',
                  settings: { giochi: { giardino: true } } }),
  mappaSemplice({ chiave: 'pozioni', eta: 9, prefisso: 'pz', tappe: T_POZIONI, mezza: 3, alto: 7, fondo: 'in fondo al laboratorio' }),
  mappaColLibero({ chiave: 'survivors', pronta: '.sv-mappa', tappe: T_SURVIVORS, mio: 125, sulTasto: /primato 2:05/,
                   record: { a: 190, d: 95, righe: 'LLorenzo: 3:10 | UUgo: 1:35' } }),
  passo,
  rotta,                                                     // l'ultima: a campagna finita gioca un volo fino in fondo
  robot,
  castello,                                                  // l'ultimo: a campagna finita gioca una partita libera
  mappaSemplice({ chiave: 'conta', eta: 5, prefisso: 'ct', tappe: T_CONTA, mezza: 3, alto: 7, fondo: 'in fondo alle tappe' }),
  mappaSemplice({ chiave: 'prima', eta: 5, prefisso: 'pd', tappe: T_PRIMA, mezza: 3, alto: 7, fondo: 'in fondo alle storie' }),
  mappaDelTesoro('inglese', TAPPE_EN),
  mappaDelTesoro('spagnolo', TAPPE_ES, { giochi: { spagnolo: true } }),
]

/* ══════════ «Lorenzo ti ha superato» in home ══════════
   Per primo, sul profilo nuovo: dopo le mappe gli asteroidi sono già al volo, con un record, e nessuno è davanti.
   Una riga per il sorpasso segnato quando è arrivata la sua bacheca, col suo pallino e il gioco; niente per chi ho già
   ripreso, per un amico senza nome o per un gioco che non vedo. Toccarla apre il gioco, e tornati in home non c'è più. */
const K = l => l.repeat(32)
const righeInHome = () => page.$$eval('[data-sorpasso]', l => l.map(e => ({ gioco: e.dataset.gioco, testo: e.textContent.replace(/\s+/g, ' ').trim() })))
await blocco('ti ha superato', async () => {
  await allaHome(page)
  await seminaConAmici(page, { mate: { tappa: 0, fila: 3, libera: false }, settings: { eta: 9 } }, [
    amicoDiProva('a', 'lorenzo01', 'Lorenzo', { giochi: voce('mate', 5) }),
    amicoDiProva('b', 'marta0001', 'Marta', { giochi: voce('mate', 2) }),      // mi aveva superato, ma l'ho ripresa
    amicoDiProva('c', null, '', { giochi: voce('mate', 9) }),                    // mai incontrato: senza nome
  ], { sorpassi: [{ chiave: K('b'), gioco: 'mate', tipo: 'tappa' }, { chiave: K('c'), gioco: 'mate', tipo: 'tappa' },
                  { chiave: K('a'), gioco: 'mate', tipo: 'tappa' }] })
  await page.waitForSelector('[data-sorpasso]', { timeout: 5000 })
  const r = await righeInHome()
  uguale('una riga sola: chi è davvero davanti e ha un nome', r.length, 1)
  controlla('Lorenzo, col suo pallino e il gioco', r[0]?.gioco === 'mate' && r[0].testo === 'LLorenzo ti ha superato☄️ Asteroidi', JSON.stringify(r))
  await scatto(page, 'amici-sorpasso-home')
  await page.click('[data-sorpasso]')
  await page.waitForSelector('[data-rotta] [data-tappa]', { timeout: 8000 })
  await page.waitForSelector('[data-amico-davanti]', { timeout: 3000 })
  controlla('toccarla porta al gioco, dove si vede chi è davanti', /Lorenzo è 2 tappe più avanti di te/.test(await testo('[data-amico-davanti]')))
  await page.click('button[aria-label="indietro"]')
  await page.waitForSelector('.carte')
  uguale('tornati in home, è detto', (await finche(righeInHome, l => l.length === 0, 3000)).length, 0)
  const salvati = await finche(() => page.evaluate(chiave => new Promise(ok => {
    const q = indexedDB.open('giochi-bambini', 1)
    q.onsuccess = () => { const g = q.result.transaction('kv').objectStore('kv').get(chiave); g.onsuccess = () => ok(g.result?.sorpassi) }
  }), 'amici:' + GIOCATORE), s => Array.isArray(s) && s.length === 0, 3000)
  uguale('e non resta nell\'archivio (gli altri, mai detti, se ne vanno col gioco aperto)', JSON.stringify(salvati), '[]')
})
await blocco('ti ha superato, in un gioco spento', async () => {
  /* un record battuto in un gioco che non si vede: niente. Accanto un sorpasso negli asteroidi, che si vedono: quando la sua
     riga c'è le righe sono disegnate, e quella di Survivors, se passasse, sarebbe lì con lei */
  await allaHome(page)
  await seminaConAmici(page, { mate: { tappa: 0, fila: 3, libera: false },
                               campagne: { survivors: { tappa: 2, primato: { best: 300, quando: 1, partite: 1, ultime: [] } } },
                               settings: { eta: 9, giochi: { survivors: false } } },
                       [amicoDiProva('a', 'lorenzo01', 'Lorenzo', { giochi: { ...voce('mate', 5), survivors: { posti: { '': 2 }, primati: { '': 500 } } } })],
                       { sorpassi: [{ chiave: K('a'), gioco: 'survivors', tipo: 'record' }, { chiave: K('a'), gioco: 'mate', tipo: 'tappa' }] })
  await page.waitForSelector('[data-sorpasso]', { timeout: 5000 })
  uguale('un gioco spento dai grandi non ha riga: c\'è solo quella degli asteroidi',
         (await righeInHome()).map(r => r.gioco).join(), 'mate')
})

/* Per ogni età, i suoi giochi nei tre momenti: una semina (profilo e amici insieme), poi un gioco dopo l'altro dalla home */
const unisci = (giochi, momento, eta) => {
  const p = { settings: { eta }, campagne: {} }
  for (const g of giochi) {
    const { campagne = {}, ...resto } = g.profilo[momento] || g.profilo.meta
    Object.assign(p.campagne, campagne)
    Object.assign(p, resto)
    p.settings = { ...p.settings, ...(g.settings || {}), giochi: { ...(p.settings.giochi || {}), ...((g.settings || {}).giochi || {}) } }
  }
  return p
}
for (const eta of [...new Set(GIOCHI.map(g => g.eta))]) {
  const giochi = GIOCHI.filter(g => g.eta === eta)
  for (const momento of ['meta', 'fondo', 'fine']) {
    const qui = giochi.filter(g => g[momento])
    if (!qui.length) continue
    await blocco(`${eta} anni, ${momento}: la semina`, async () => {
      await allaHome(page)
      await seminaConAmici(page, unisci(giochi, momento, eta), amiciDi(qui.map(g => g.amici[momento]), FA[momento]))
    })
    for (const g of qui) {
      await blocco(`${g.chiave}, ${momento}`, async () => {
        await allaHome(page)
        await scegli(page, g.chiave)
        await page.waitForSelector(g.pronta, { timeout: 8000 })
        if (g.nave) await page.waitForSelector('[data-nave][data-porto]:not([data-porto=""])', { timeout: 5000 })
        await page.waitForSelector(SEGNO[momento], { timeout: 5000 })
        await g[momento]()
      })
    }
  }
}

controlla('nessun errore, anche col servizio irraggiungibile', veri().length === 0, veri().join(' | '))
await browser.close()
riassunto('amici: la bacheca sulle mappe dei giochi')
