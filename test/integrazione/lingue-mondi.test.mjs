/* ═══════════════════════════════════════════════════════════════════
   LE LINGUE A MONDI, NEL BROWSER: L'INGLESE E LO SPAGNOLO
     node test/esegui.mjs lingue-mondi --niente-build
   perché: English ed Español a mondi nel browser: la mappa del tesoro, le tappe di parole e di frasi, la bolla del tocco che costa col dito vero, il libro con le storie e la sesta isola con la «Puntata 2»
   a parte perché: è la prova di tutte le schermate delle due lingue; lingue-sosta prova solo la tappa lasciata a metà, lingue-prima il gioco libero di prima in fondo alla mappa

   I due giochi sono gemelli (stessi bersagli, `data-mappa-inglese` compreso;
   dati diversi): ogni regola si scrive una volta e si prova in tutte e due
   le lingue, con le parole, le tappe e le storie di ognuna nella tabella
   LINGUE. Un profilo porta tutte e due le campagne, quindi una semina
   prepara le due lingue insieme. Quello che il motore da solo non può dire
   (test/unita/inglese-mondi, test/unita/spagnolo-mondi):
     · la carta apre la mappa del tesoro, un mondo per anno di scuola; l'età
       non apre mondi, si comincia dalla prima
     · una tappa di parole fa domande sulle parole del suo argomento: fra
       i colori, solo colori
     · una frase si compone a tocchi, e sbagliandola si legge il perché,
       «Si fa così» e la frase giusta, con la tessera sbagliata colorata
     · la frase giusta paga, e l'indicatore delle monete lo diceva prima
     · un tocco che costa si chiede prima, in una bolla accanto alla
       parola: col dito vero, tenendo premuta una tessera, il click che
       arriva dopo non la chiude e non muove la tessera; «No» la chiude
       e la domanda paga ancora
     · il libro apre la storia non ancora letta; una parola si tocca e
       dice cosa vuol dire; se il tocco costa prima lo chiede, e al sì lo
       dice subito; poi si risponde, e la storia è letta
     · «Un'altra storia» apre un'altra storia, che si sfoglia con le
       frecce, anche durante le domande
     · nella sesta isola una parola della storia si tocca gratis e non segna
       niente; si risponde toccando la frase e componendo l'ordine; il
       cartello offre «Puntata 2», con le variabili della puntata 1
   Il gioco di prima, in fondo alla mappa, lo prova integrazione/lingue-prima.
   Il progetto è in docs/lingue/mondi.md e spagnolo.md, i bersagli alla riga «Nei test».
   ═══════════════════════════════════════════════════════════════════ */
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { apriBrowser, apriGioco, semina, attendi, leggiProfilo, scatto, TELEFONO,
         SCATTI, SCATTI_ACCESI, scegli } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto, blocco } from '../aiuto/verifica.mjs'
import { finche } from '../aiuto/soste.mjs'
import { allaHome } from '../aiuto/bacheca.mjs'
import { orologioDelleLingue } from '../aiuto/lingue.mjs'
import { WORDS } from '../../src/data/words.js'
import { PAROLE_ES } from '../../src/data/parole-es.js'
import * as EN_MONDI from '../../src/giochi/inglese/dati/mondi.js'
import * as ES_MONDI from '../../src/giochi/spagnolo/dati/mondi.js'
import { FRASI as FRASI_EN } from '../../src/giochi/inglese/dati/frasi.js'
import { FRASI as FRASI_ES } from '../../src/giochi/spagnolo/dati/frasi.js'
import { PAGA as PAGA_EN } from '../../src/giochi/inglese/dati/monete.js'
import { PAGA as PAGA_ES } from '../../src/giochi/spagnolo/dati/monete.js'
import { concettiDellaTappa } from '../../src/giochi/spagnolo/motore/concetti.js'

/* ── quello che cambia da una lingua all'altra ── */
const LINGUE = [
  {
    chiave: 'inglese', nome: 'English', parole: WORDS, M: EN_MONDI, FRASI: FRASI_EN, PAGA: PAGA_EN,
    voce: 'en:', frase: 'frase:', forme: ['forma:it-is', 'forma:is-it'], totaleFrasi: 'frasi',
    colori: 'prima-colori', animali: 'prima-animali', giocattoli: 'prima-giocattoli', conFrasi: 'prima-che-cose',
    bandiera: 'prima-bandiera', seconda: 'seconda-cibo', quarta: 'quarta-ora', quartaVinta: 'quarta-giornata',
    libroSiApre: 'Si apre quando vinci «Ciao! Come ti chiami?»', finisciPrima: 'Prima finisci «Il prato in fiore»',
    maiuscola: /^[A-Z]/, concetto: 'it-is:e',
    // il primo libro: due storie su tre già lette, «Il cane di Laura» da più tempo; quella da leggere sta in una pagina
    lette: { 'il-cane-di-laura': 2, 'il-gioco-di-tom': 1 },
    storia: { id: 'lo-zaino-di-leo', titolo: 'Lo zaino di Leo', pagine: 1, chi: ['Leo', 'Laura'], struttura: 'is' },
    // la parola saputa da toccare a pagamento: «backpack», nella sola pagina
    parolaSaputa: async () => ({ parola: 'backpack', it: 'zaino', allaSeconda: false }),
    altra: { id: 'il-cane-di-laura', titolo: 'Il cane di Laura', pagina2: /Pip/ },
    // la sesta isola: lette tutte tranne «La vecchia mappa»; «tree» è della storia (del cassetto della terza), alla seconda pagina
    sesta: { lette: ['pip-scappa', 'la-gita-al-castello', 'una-voce-nella-notte', 'chi-ha-mangiato-la-torta'],
             parola: 'tree', it: /albero/, allaPagina: 2, serie: 'la-vecchia-mappa', tipi1: ['frase', 'chi'], tipi2: ['ordine'],
             valori: v => v.nonno && v.mezzo,
             stessaSerie: (testo, v) => [
               ['con lo stesso nonno della puntata 1', testo.includes(v.nonno === 'nonno' ? 'Grandfather' : 'Grandmother')],
               ['e lo stesso mezzo', testo.includes(`by ${v.mezzo}`)]] },
  },
  {
    chiave: 'spagnolo', nome: 'Español', parole: PAROLE_ES, M: ES_MONDI, FRASI: FRASI_ES, PAGA: PAGA_ES,
    voce: 'es:', frase: 'frase-es:', forme: ['forma-es:es-un'], totaleFrasi: 'frasiEs',
    colori: 'prima-colores', animali: 'prima-animales', giocattoli: 'prima-juguetes', conFrasi: 'prima-es-un',
    bandiera: 'prima-bandera', seconda: 'seconda-comida', quarta: 'quarta-hora', quartaVinta: 'quarta-dia',
    libroSiApre: 'Si apre quando vinci «È un cane, è una mucca»', finisciPrima: 'Prima finisci «La valle dei girasoli»',
    maiuscola: /^[¿¡\s]*[A-ZÁÉÍÓÚÑ]/, concetto: concettiDellaTappa(ES_MONDI.tappaDi('prima-es-un'))[0].id,
    lette: { 'chi-c-e-sotto': 3, 'la-scatola-di-leo': 2, 'i-palloncini': 1 },
    storia: { id: 'indovina-il-disegno', titolo: 'Indovina il disegno', pagine: 2, chi: ['Leo', 'Tom', 'Laura'], struttura: 'es' },
    /* un animale (il disegno è di un animale a caso) è saputo: toccarlo costa. Gli animali sono pescati a caso, e la rana e la
       pecora (fuori dal primo mondo, quindi gratis) possono riempire la prima pagina da sole: allora si cerca nella seconda */
    async parolaSaputa(page) {
      const ANIMALI = ES_MONDI.MONDI[0].tappe.find(t => t.id === 'prima-animales').parole
      const inPagina = () => page.locator('[data-libro-testo] [data-parola]').evaluateAll(
        (els, animali) => (els.map(e => e.dataset.parola).find(p => animali.includes(p)) || null), ANIMALI)
      let parola = await inPagina()
      const allaSeconda = !parola
      if (allaSeconda) {
        await attendi(page, 350)
        await page.locator('[data-azione="pagina-avanti"]').click()
        await page.waitForSelector('[data-libro-testo][data-pagina="2"]')
        parola = await finche(inPagina, p => !!p, 1000)       // la pagina che gira
      }
      nota(`l'animale da toccare: ${parola}`)
      return { parola, it: (PAROLE_ES.find(w => w[0] === parola) || [])[1], allaSeconda }
    },
    altra: { id: 'chi-c-e-sotto', titolo: 'Chi c’è sotto', pagina2: null },
    sesta: { lette: ['l-orologio-della-mamma', 'la-palla-sul-tetto', 'la-porta-del-nonno'],
             parola: 'anillo', it: /anello/, allaPagina: 1, serie: 'il-mercato-della-nonna', tipi1: ['frase', 'ordine'], tipi2: ['chi', 'frase'],
             valori: v => v.frutta && v.colore && v.mezzo,
             stessaSerie: (testo, v) => [['con la stessa frutta della puntata 1', testo.includes(v.frutta)]] },
  },
]

// la mappa intera, non solo quello che sta nello schermo: la tela si legge com'è (docs/lingue/mondi-vista.md)
async function scattoTela(page, nome) {
  if (!SCATTI_ACCESI) return
  const dati = await page.evaluate(() => document.querySelector('.ing-tela').toDataURL('image/png'))
  mkdirSync(SCATTI, { recursive: true })
  writeFileSync(resolve(SCATTI, nome + '.png'), Buffer.from(dati.split(',')[1], 'base64'))
}

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { viewport: TELEFONO })
const orologio = orologioDelleLingue(page)
await orologio.installa()                                  // la finestra cieca e l'esito si portano avanti
const nave = page.locator('[data-nave]')
const ora = Date.now()
const sa = s => ({ s, ok: 5, err: 0, last: ora, seen: 5, t: 0 })
const giorni = n => ora - n * 86400000
// tutte e due le campagne insieme; lo spagnolo è spento di base e qui si accende (l'età non apre mondi: lo prova il punto 6)
const seminaLe = (eta, perLingua, resto = {}) => semina(page, {
  ...resto, settings: { eta, giochi: { spagnolo: true } },
  campagne: Object.fromEntries(LINGUE.map(L => [L.chiave, perLingua(L)])),
})
const attr = (sel, a) => page.locator(sel).getAttribute(a)
const tappa = id => `[data-tappa="${id}"]`
async function allaMappa(L) {
  await allaHome(page)
  await scegli(page, L.chiave)
  await page.waitForSelector('[data-mappa-inglese] [data-tappa]', { timeout: 5000 })
}
const indietro = () => page.locator('button[aria-label="indietro"]').click()
const campagna = async L => (await leggiProfilo(page)).campagne[L.chiave] || {}
// risponde giusto a una domanda del libro e torna il tipo e l'esito che ha detto (null se è arrivato prima il cartello)
async function rispondiNelLibro(L) {
  await page.waitForSelector('[data-libro-domanda]')
  await orologio.cieca()
  const tipo = await attr('[data-libro-domanda]', 'data-tipo')
  if (tipo === 'frase') {
    // la frase giusta può stare in un'altra pagina: si sfoglia dalla prima (un testo di una pagina non ha frecce)
    const dietro = page.locator('[data-azione="pagina-indietro"]')
    while (await dietro.count() && !(await dietro.isDisabled())) await dietro.click()
    for (let i = 0; i < 4 && !(await page.locator('[data-libro-testo] [data-frase][data-giusta]').count()); i++)
      await page.locator('[data-azione="pagina-avanti"]').click()
    uguale('«tocca la frase»: il testo è a frasi', await attr('[data-libro-testo]', 'data-a-frasi'), '1')
    await scatto(page, `${L.chiave}-libro-frase`)
    await page.locator('[data-libro-testo] [data-frase][data-giusta]').click()
  } else if (tipo === 'ordine') {
    const n = await page.locator('[data-libro-domanda] [data-banco] [data-tessera]').count()
    for (let i = 0; i < n; i++) await page.locator(`[data-libro-domanda] [data-tessera][data-posto="${i}"]`).click()
    uguale('«metti in ordine»: i fatti sono tutti in fila', await page.locator('[data-libro-domanda] [data-in-fila]').count(), n)
    await scatto(page, `${L.chiave}-libro-ordine`)
    await page.locator('[data-libro-domanda] [data-azione="consegna"]').click()
  } else await page.locator('[data-libro-domanda] [data-giusta]').click()
  await page.waitForSelector('[data-libro-domanda] [data-esito], [data-fine]')
  const esito = await page.locator('[data-libro-domanda] [data-esito]').count()
    ? await attr('[data-libro-domanda] [data-esito]', 'data-esito') : null
  await orologio.dopoLEsito('[data-libro-domanda]')
  return { tipo, esito }
}
// tutte le domande del libro fino al cartello: ognuna detta giusta (l'ultima può lasciare il posto al cartello prima)
async function tuttoIlLibro(L, cosa) {
  const tipi = [], esiti = []
  while (!(await page.locator('[data-fine]').count())) {
    const { tipo, esito } = await rispondiNelLibro(L)
    tipi.push(tipo); esiti.push(esito)
  }
  uguale(`${cosa}: ogni risposta detta è giusta`, esiti.filter(e => e !== null && e !== 'giusta').join(), '')
  controlla(`${cosa}: l'esito si vede, tranne al più l'ultima`, esiti.slice(0, -1).every(e => e === 'giusta'), esiti.join())
  return tipi
}
// le monete scritte, quando sono arrivate a `attese` (l'archivio scrive dopo): torna quelle che ci sono
const moneteQuando = attese => finche(async () => (await leggiProfilo(page)).coins, c => c === attese, 4000, 50)

/* ══════════ 1. dalla home alla mappa, a profilo vuoto ══════════ */
await seminaLe(6.5, () => ({}))
for (const L of LINGUE) await blocco(`${L.chiave}: la mappa vuota`, async () => {
  await allaHome(page)
  uguale(`in home c’è una carta ${L.nome} sola`, await page.locator(`.carta.gioco[data-gioco="${L.chiave}"]`).count(), 1)
  await allaMappa(L)
  uguale('nessun mondo «in arrivo» che non arriva', await page.locator('[data-mondo][data-pronto="0"]').count(), 0)
  uguale('senza la campagna di prima finita, il gioco di prima non c’è', await page.locator('[data-prima]').count(), 0)
  await scatto(page, `${L.chiave}-mappa-vuota`)
  await scattoTela(page, `${L.chiave}-mappa-vuota-intera`)

  /* la nave: ancorata alla tappa da fare, e su una chiusa non parte */
  uguale('la nave è ancorata alla tappa da fare', await nave.getAttribute('data-porto'), 'tappa:' + L.colori)
  await page.locator(tappa(L.animali)).click()
  await page.waitForSelector('[data-serve]', { timeout: 2000 })
  controlla('una tappa chiusa dice cosa serve', (await page.locator('[data-serve]').innerText()).includes('Prima vinci «I colori»'),
            await page.locator('[data-serve]').innerText())
  uguale('e la nave non parte', await nave.getAttribute('data-in-viaggio'), '0')
  uguale('e resta dov’era', await nave.getAttribute('data-porto'), 'tappa:' + L.colori)
  uguale('e non si entra nella tappa', await page.locator('[data-domanda]').count(), 0)
  await scatto(page, `${L.chiave}-serve`)
  // il libro chiuso dice quale tappa lo apre: quella della prima storia, a metà isola
  await page.locator('[data-libro="prima"]').click()
  await page.waitForSelector('[data-serve-per="libro:prima"]', { timeout: 2000 })
  controlla('il libro chiuso dice quale tappa vincere', (await page.locator('[data-serve]').innerText()).includes(L.libroSiApre),
            await page.locator('[data-serve]').innerText())
  // il secondo mondo, chiuso, chiede il primo finito (quali mondi sono aperti, anche a dieci anni, lo dicono le unità)
  await page.locator(tappa(L.seconda)).click()
  await page.waitForSelector(`[data-serve-per="tappa:${L.seconda}"]`, { timeout: 2000 })
  controlla('il cartiglio del secondo mondo chiede la prima finita', (await page.locator('[data-serve]').innerText()).includes(L.finisciPrima),
            await page.locator('[data-serve]').innerText())

  /* le parole di una tappa: fra i colori, solo colori. Era il difetto: con una categoria piccola le risposte sbagliate
     venivano da tutta la lingua (🔴 fra 🏥🐶📓). Trenta domande di fila le fanno le unità (unita/<lingua>-mondi, DIFETTI):
     qui la prima, com'è a schermo */
  const colori = new Set(L.parole.filter(w => w[3] === 'c').flatMap(w => [w[0], w[1], w[2]]).filter(Boolean))
  await page.locator(tappa(L.colori)).click()
  await page.waitForSelector('[data-domanda]')
  uguale('una tappa di parole fa domande sulle parole', await attr('[data-domanda]', 'data-genere'), 'parola')
  const testi = await page.locator('[data-domanda] [data-opzione]').evaluateAll(els => els.map(e => e.textContent.trim()))
  controlla('con più risposte da scegliere', testi.length > 1, testi.join(' '))
  uguale('le risposte sono tutte colori', testi.filter(t => !colori.has(t)).join(' '), '')
})

/* ══════════ 2. a metà del primo mondo ══════════
   Le parole delle tappe di parole sono sapute (forza 6) e le frasi della tappa di frasi a metà (forza 4): si mettono in
   ordine. Tutte le tappe tranne la bandiera sono vinte, così il libro del mondo è aperto; le storie tranne una già lette. */
{
  const items = {}, perLingua = {}
  for (const L of LINGUE) {
    const t1 = L.M.tappaDi(L.conFrasi)
    for (const p of L.M.MONDI[0].tappe.flatMap(t => t.parole || [])) items[L.voce + p] = sa(6)
    for (const f of L.FRASI.filter(f => f.tappa === t1.id)) items[L.frase + f.id] = sa(4)
    for (const k of L.forme) items[k] = sa(4)
    const vinte = Object.fromEntries(L.M.MONDI[0].tappe.filter(t => !t.bandiera).map((t, i) => [t.id, giorni(20 - i)]))
    perLingua[L.chiave] = { tappa: Object.keys(vinte).length, libera: false, stelle: {}, cfg: {}, vinte,
                            lette: Object.fromEntries(Object.entries(L.lette).map(([id, n]) => [id, giorni(n)])) }
  }
  await allaHome(page)
  await seminaLe(6.5, L => perLingua[L.chiave], { coins: 100, items })
}
for (const L of LINGUE) await blocco(`${L.chiave}: a metà del primo mondo`, async () => {
  const paroleDelMondo = L.M.MONDI[0].tappe.flatMap(t => t.parole || [])
  await allaMappa(L)
  uguale('la tappa di parole saputa è piena', await attr(tappa(L.animali), 'data-grado'), '10')
  uguale('la bandiera si è aperta', await attr(tappa(L.bandiera), 'data-stato'), 'aperta')
  uguale('il libro è aperto', await attr('[data-libro="prima"]', 'data-stato'), 'aperta')
  uguale('il cassetto è aperto', await attr('[data-cassetto="prima"]', 'data-stato'), 'aperta')
  uguale('il secondo mondo resta chiuso fino alla bandiera', await attr(tappa(L.seconda), 'data-stato'), 'chiusa')
  await scatto(page, `${L.chiave}-mappa`)
  await scattoTela(page, `${L.chiave}-mappa-intera`)
  if (SCATTI_ACCESI) {
    // lo schermo più stretto che si prova: le isole si ridisegnano, e restano isole
    await page.setViewportSize({ width: 320, height: 640 })
    await attendi(page, 300)
    await scattoTela(page, `${L.chiave}-mappa-intera-320`)
    await scatto(page, `${L.chiave}-mappa-320`)
    await page.setViewportSize(TELEFONO)
    await attendi(page, 300)
  }

  /* ── 3. una frase composta a tocchi, prima storta. La nave sta alla bandiera, la tappa da fare: toccata la tappa delle
        frasi ci naviga per mare, e arrivata la tappa si apre. Le parole le sa già: si comincia dalle frasi ── */
  uguale('la nave sta alla tappa da fare', await nave.getAttribute('data-porto'), 'tappa:' + L.bandiera)
  const partenza = Date.now()
  await page.locator(tappa(L.conFrasi)).click()
  await page.waitForSelector('[data-nave][data-in-viaggio="1"]', { timeout: 1000 })
  await scatto(page, `${L.chiave}-nave`)
  await page.waitForSelector('[data-domanda]', { timeout: 4000 })
  const viaggio = Date.now() - partenza
  controlla('il viaggio dura poco', viaggio < 2500, viaggio + ' ms')
  nota(`${L.chiave}: dal tocco alla domanda ${viaggio} ms`)
  async function finoAllaFrase() {
    for (let parole = 0; parole <= 30; parole++) {
      await page.waitForSelector('[data-domanda]')
      if (await attr('[data-domanda]', 'data-genere') === 'frase') return
      await orologio.cieca()
      await page.locator('[data-domanda] [data-opzione][data-giusta]').click()
      await page.waitForSelector('[data-esito="giusta"]')
      await orologio.dopoLEsito()
    }
  }
  uguale('le parole sono sapute: si comincia da una frase', await attr('[data-domanda]', 'data-genere'), 'frase')
  await finoAllaFrase()
  uguale('la frase a metà si mette in ordine', await attr('[data-domanda]', 'data-formato'), 'monta')
  uguale('l’indicatore dice che la domanda paga', await attr('[data-paga]', 'data-paga-si'), '1')
  controlla('e quanto', (await page.locator('[data-paga]').textContent()).includes('+' + L.PAGA.monta))

  // le tessere in ordine di posto nella frase giusta; per sbagliare, al contrario
  const posti = () => page.locator('[data-banco] [data-tessera]').evaluateAll(
    els => els.map(e => ({ id: e.dataset.tessera, posto: Number(e.dataset.posto) })))
  async function componi(storta) {
    await orologio.cieca()
    const t = (await posti()).sort((a, b) => (storta ? b.posto - a.posto : a.posto - b.posto))
    for (const x of t) await page.locator(`[data-banco] [data-tessera="${x.id}"]`).click()
    return t.length
  }
  /* Tenere premuta una tessera chiede cosa vuol dire. Le parole sono sapute, quindi il tocco costerebbe il guadagno: prima
     una domanda, in una bolla. Col dito vero (Input.dispatchTouchEvent, docs/core/il-dito.md): il click che arriva dopo
     l'alzata non deve né chiuderla né muovere la tessera. */
  const cdp = await page.context().newCDPSession(page)
  async function dito(x, y, tieni = 60) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    await attendi(page, tieni)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await attendi(page, 250)                               // il click fantasma arriva qui dentro
  }
  const centro = async loc => { const b = await loc.boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2] }
  await orologio.cieca()
  const nome = page.locator('[data-banco] [data-tessera]').filter({
    has: page.locator(paroleDelMondo.map(p => `[data-parola="${p}"]`).join(', ')) }).first()
  const idNome = await nome.getAttribute('data-tessera')
  await dito(...await centro(nome), 700)
  uguale('tenuta premuta una parola saputa, prima si chiede', await page.locator('[data-svela]').count(), 1)
  controlla('la bolla dice che la domanda non darà monete', /non ti darà monete/.test(await page.locator('[data-svela]').innerText()))
  uguale('il click dopo il dito non ha mosso la tessera', await page.locator(`[data-banco] [data-tessera="${idNome}"]`).count(), 1)
  uguale('e non ha tolto il guadagno', await attr('[data-paga]', 'data-paga-si'), '1')
  uguale('la traduzione non c’è ancora', await page.locator('[data-traduzione]').count(), 0)
  await scatto(page, `${L.chiave}-chiede`)
  await orologio.bollaPronta()
  await dito(...await centro(page.locator('[data-svela] [data-azione="svela-no"]')))
  uguale('«No, ci provo» chiude la bolla', await page.locator('[data-svela]').count(), 0)
  uguale('e la domanda paga ancora', await attr('[data-paga]', 'data-paga-si'), '1')
  uguale('la tessera è ancora nel banco', await page.locator(`[data-banco] [data-tessera="${idNome}"]`).count(), 1)

  const quante = await componi(true)
  uguale('le tessere sono tutte in fila', await page.locator('[data-fila] [data-in-fila]').count(), quante)
  uguale('il banco è vuoto', await page.locator('[data-banco] [data-tessera]').count(), 0)
  const frase = await page.locator('[data-fila]').innerText()
  controlla('la fila mette la maiuscola da sé', L.maiuscola.test(frase.trim()), frase)
  // una tessera ritoccata torna nel banco, e rimessa torna in coda
  const prima = page.locator('[data-fila] [data-in-fila]').first()
  const idPrima = await prima.getAttribute('data-in-fila')
  await prima.click()
  uguale('ritoccata, torna nel banco', await page.locator(`[data-banco] [data-tessera="${idPrima}"]`).count(), 1)
  await page.locator(`[data-banco] [data-tessera="${idPrima}"]`).click()
  await page.locator('[data-azione="consegna"]').click()
  await page.waitForSelector('[data-esito]')
  uguale('la frase storta è sbagliata', await attr('[data-esito]', 'data-esito'), 'sbagliata')
  uguale('c’è «Si fa così»', await page.locator('[data-si-fa]').count(), 1)
  uguale('c’è la frase giusta', await page.locator('[data-giusta-era]').count(), 1)
  controlla('almeno una tessera è colorata', await page.locator('[data-sbagliata]').count() >= 1)
  uguale('l’attesa si vede', await page.locator('[data-attesa]').count(), 1)
  await scatto(page, `${L.chiave}-sbaglio`)

  /* ── 4. la seconda, giusta: paga ── */
  await orologio.dopoLEsito()
  await finoAllaFrase()
  uguale('niente si perde: si va avanti con un’altra frase', await attr('[data-domanda]', 'data-formato'), 'monta')
  const monetePrima = (await leggiProfilo(page)).coins
  await componi(false)
  await scatto(page, `${L.chiave}-componi`)
  await page.locator('[data-azione="consegna"]').click()
  await page.waitForSelector('[data-esito="giusta"]')
  uguale('la frase giusta paga', (await moneteQuando(monetePrima + L.PAGA.monta)) - monetePrima, L.PAGA.monta)
  const dopo = await leggiProfilo(page)
  controlla('la frase sbagliata è segnata nello SRS', Object.entries(dopo.items).some(([k, v]) => k.startsWith(L.frase) && v.err > 0))
  controlla('e il contatore delle frasi è salito', (dopo.totals[L.totaleFrasi] || 0) >= 1)
  await orologio.dopoLEsito()

  /* ── 5. il libro ── */
  await indietro()
  await page.waitForSelector('[data-libro="prima"]')
  uguale('tornati alla mappa, la nave è dove si era giocato', await nave.getAttribute('data-porto'), 'tappa:' + L.conFrasi)
  // un tocco durante il viaggio lo chiude: la nave arriva e il libro si apre subito
  await page.locator('[data-libro="prima"]').click()
  await page.waitForSelector('[data-viaggio]', { timeout: 1000 })
  const tocco = Date.now()
  await page.mouse.click(195, 500)
  await page.waitForSelector('[data-libro-testo]', { timeout: 1500 })
  controlla('un tocco durante il viaggio lo chiude subito', Date.now() - tocco < 700, (Date.now() - tocco) + ' ms')
  uguale('il libro dice quanto può rendere', await attr('[data-paga]', 'data-paga-si'), '1')
  controlla('il libro apre la storia non ancora letta',
            (await page.locator('[data-libro-testo] .ing-capitolo').innerText()).includes(L.storia.titolo))
  uguale(`${L.storia.pagine} pagine: le frecce ci sono se più d'una`, await page.locator('[data-azione="pagina-avanti"]').count(),
         L.storia.pagine > 1 ? 1 : 0)
  // chi parla: ogni battuta va a capo col nome davanti, e le parole si toccano lo stesso
  const battute = await page.locator('[data-libro-testo] [data-battuta]').evaluateAll(els =>
    els.map(e => [e.dataset.chi, e.querySelector('.ing-chi').textContent.trim(), e.querySelectorAll('[data-parola]').length]))
  controlla(`le battute dicono chi parla: ${L.storia.chi.join(', ')}`,
            L.storia.chi.every(n => battute.some(b => b[0] === n && b[1] === n)), JSON.stringify(battute))
  controlla('e le loro parole si toccano', battute.every(b => b[2] > 0))
  uguale('il nome non si tocca', await page.locator('[data-libro-testo] .ing-chi [data-parola]').count(), 0)
  await scatto(page, `${L.chiave}-libro`)
  // una parola di struttura è sempre gratis: si dice e basta
  await page.locator(`[data-libro-testo] [data-parola="${L.storia.struttura}"]`).first().click()
  await page.waitForSelector('[data-traduzione]')
  uguale('una parola gratis non chiede niente', await page.locator('[data-svela]').count(), 0)
  // una parola saputa: toccarla costerebbe il guadagno di una domanda, e prima lo si chiede
  const { parola, it, allaSeconda } = await L.parolaSaputa(page)
  controlla('nel testo c’è la parola saputa da toccare', !!parola && !!it, `${parola} = ${it}`)
  const saputa = page.locator(`[data-libro-testo] [data-parola="${parola}"]`).first()
  await saputa.click()
  await page.waitForSelector('[data-svela]')
  const chiede = await page.locator('[data-svela]').innerText()
  controlla('la bolla dice perché costa', /la conosci già/.test(chiede), chiede)
  controlla('e che nel libro è una domanda sola', /Una domanda del libro/.test(chiede), chiede)
  uguale('chiedere non toglie niente', await attr('[data-paga]', 'data-paga-si'), '1')
  await orologio.bollaPronta()
  await page.locator('[data-azione="svela-no"]').click()
  uguale('«No» chiude', await page.locator('[data-svela]').count(), 0)
  await saputa.click()
  await orologio.bollaPronta()
  await page.locator('[data-azione="svela-si"]').click()
  await page.waitForSelector('[data-traduzione]')
  controlla('la parola toccata dice cosa vuol dire', (await page.locator('[data-traduzione]').innerText()).includes(it), it)
  controlla('e che quella domanda non paga', /non paga/.test(await page.locator('[data-traduzione]').innerText()))
  uguale('l’indicatore lo dice prima di rispondere', await attr('[data-paga]', 'data-paga-si'), '0')
  await scatto(page, `${L.chiave}-parola`)
  const moneteLibro = (await leggiProfilo(page)).coins
  if (L.storia.pagine > 1 && !allaSeconda) {
    uguale('«Ho letto» c’è solo all’ultima pagina', await page.locator('[data-azione="ho-letto"]').count(), 0)
    await attendi(page, 350)
    await page.locator('[data-azione="pagina-avanti"]').click()
  }
  await page.locator('[data-azione="ho-letto"]').click()
  await page.waitForSelector('[data-libro-domanda]')
  const domande = await page.evaluate(() => document.querySelector('[data-libro-domanda] .ing-etichetta').textContent)
  nota(domande)
  await tuttoIlLibro(L, 'il libro')
  await scatto(page, `${L.chiave}-libro-fine`)
  const nDomande = Number((domande.match(/di (\d+)/) || [])[1])
  uguale('il tocco a pagamento ha tolto il guadagno di una domanda',
         (await moneteQuando(moneteLibro + (nDomande - 1) * 4)) - moneteLibro, (nDomande - 1) * 4)
  controlla('la parola chiesta conta come non saputa', ((await leggiProfilo(page)).items[L.voce + parola] || {}).err > 0)
  const letteDopo = await finche(async () => (await campagna(L)).lette || {}, l => l[L.storia.id] >= ora, 3000)
  controlla('arrivati al cartello la storia è letta', letteDopo[L.storia.id] >= ora, JSON.stringify(letteDopo))

  /* ── 5b. un'altra storia, a pagine: lette tutte, «Un'altra storia» apre quella letta da più tempo (non quella appena
        finita), su due pagine ── */
  uguale('il cartello offre un’altra storia', (await page.locator('[data-fine] [data-azione="avanti"]').innerText()).trim(), 'Un’altra storia →')
  await page.locator('[data-fine] [data-azione="avanti"]').click()
  await page.waitForSelector('[data-libro-testo][data-pagine="2"]')
  controlla('è un’altra storia', (await page.locator('[data-libro-testo] .ing-capitolo').innerText()).includes(L.altra.titolo))
  uguale('comincia dalla prima pagina', await attr('[data-libro-testo]', 'data-pagina'), '1')
  uguale('e lo dice', (await page.locator('[data-pagina-di]').innerText()).trim(), 'pagina 1 di 2')
  uguale('prima dell’ultima pagina non si chiude', await page.locator('[data-azione="ho-letto"]').count(), 0)
  controlla('indietro, alla prima, non va', await page.locator('[data-azione="pagina-indietro"]').isDisabled())
  await attendi(page, 350)
  const testoPagina1 = await page.locator('[data-libro-testo]').innerText()
  await page.locator('[data-azione="pagina-avanti"]').click()
  uguale('la freccia sfoglia', await attr('[data-libro-testo]', 'data-pagina'), '2')
  const testo2 = await page.locator('[data-libro-testo]').innerText()
  controlla('la seconda pagina è un’altra', testo2.trim().length > 0 && testo2 !== testoPagina1 && (!L.altra.pagina2 || L.altra.pagina2.test(testo2)),
            testo2.slice(0, 120))
  await scatto(page, `${L.chiave}-libro-pagine`)
  await page.locator('[data-azione="ho-letto"]').click()
  await page.waitForSelector('[data-libro-domanda]')
  await page.locator('[data-azione="pagina-indietro"]').click()
  uguale('durante le domande si sfoglia ancora', await attr('[data-libro-testo]', 'data-pagina'), '1')
  uguale('e la domanda resta', await page.locator('[data-libro-domanda]').count(), 1)
  await tuttoIlLibro(L, 'l’altra storia')
  const lette2 = await finche(async () => (await campagna(L)).lette || {}, l => l[L.altra.id] >= ora, 3000)
  controlla('anche questa è letta', lette2[L.altra.id] >= ora, JSON.stringify(lette2))
  await page.locator('[data-fine] [data-azione="mappa"]').click()
  await page.waitForSelector('[data-mappa-inglese]')
})

/* ══════════ 5c. la sesta isola: parole della storia, domande nuove, puntate ══════════
   Tutti i mondi vinti, e nella sesta lette tutte le storie tranne quella a puntate: il libro apre la sua prima puntata. Una
   parola della storia è saputa: toccarla sarebbe a pagamento, ma è gratis e non segna niente. Poi si risponde a tutto,
   toccando la frase e componendo l'ordine, e «Puntata 2» apre la puntata con le variabili della prima. */
{
  const items = {}
  for (const L of LINGUE) items[L.voce + L.sesta.parola] = sa(6)
  await allaHome(page)
  await seminaLe(6.5, L => {
    const tutte = Object.fromEntries(L.M.MONDI.flatMap(m => m.tappe).map((t, i) => [t.id, ora - (60 - i) * 3600000]))
    return { tappa: Object.keys(tutte).length, libera: false, stelle: {}, cfg: {}, vinte: tutte,
             lette: Object.fromEntries(L.sesta.lette.map(id => [id, giorni(1)])) }
  }, { coins: 100, items })
}
for (const L of LINGUE) await blocco(`${L.chiave}: la sesta isola`, async () => {
  const S = L.sesta
  await allaHome(page)
  await scegli(page, L.chiave)
  await page.waitForSelector('[data-libro="sesta"]')
  await page.locator('[data-libro="sesta"]').scrollIntoViewIfNeeded()
  await page.locator('[data-libro="sesta"]').click()
  await page.waitForSelector('[data-libro-testo]', { timeout: 4000 })
  uguale('il libro apre la prima puntata', (await page.locator('[data-puntata]').innerText()).trim().toLowerCase(), 'puntata 1')
  const vecchio = JSON.stringify(((await leggiProfilo(page)).items || {})[L.voce + S.parola] || null)
  for (let p = 1; p < S.allaPagina; p++) await page.locator('[data-azione="pagina-avanti"]').click()
  const parolaStoria = page.locator(`[data-libro-testo] [data-parola="${S.parola}"][data-storia]`).first()
  uguale('le parole della storia sono segnate', await parolaStoria.count(), 1)
  await parolaStoria.click()
  await page.waitForSelector('[data-traduzione]')
  uguale('una parola della storia non chiede niente', await page.locator('[data-svela]').count(), 0)
  controlla('dice cosa vuol dire, e che è gratis', S.it.test(await page.locator('[data-traduzione]').innerText()) &&
            await page.locator('[data-traduzione] [data-della-storia]').count() === 1)
  uguale('e il libro paga ancora tutto', await attr('[data-paga]', 'data-paga-si'), '1')
  await scatto(page, `${L.chiave}-libro-puntata`)
  for (let i = 0; i < 4 && !(await page.locator('[data-azione="ho-letto"]').count()); i++)
    await page.locator('[data-azione="pagina-avanti"]').click()
  await page.locator('[data-azione="ho-letto"]').click()
  const monetePuntata = (await leggiProfilo(page)).coins
  const tipi1 = await tuttoIlLibro(L, 'la puntata 1')
  nota(`${L.chiave}: ${tipi1.join(' · ')}`)
  controlla(`la prima puntata chiede anche ${S.tipi1.join(' e ')}`, S.tipi1.every(t => tipi1.includes(t)), tipi1.join(' · '))
  uguale('ogni domanda ha pagato: la parola della storia era gratis',
         (await moneteQuando(monetePuntata + tipi1.length * 4)) - monetePuntata, tipi1.length * 4)
  const dopoP1 = await leggiProfilo(page)
  uguale('e nello SRS non ha segnato niente', JSON.stringify(dopoP1.items[L.voce + S.parola] || null), vecchio)
  const serie = await finche(async () => ((await campagna(L)).serie || {})[S.serie] || {}, s => s.fatte === 1, 3000)
  controlla('la serie ha salvato le sue variabili', serie.valori && S.valori(serie.valori), JSON.stringify(serie))
  uguale('e fin dove si è arrivati', serie.fatte, 1)
  uguale('il cartello offre la puntata dopo', (await page.locator('[data-fine] [data-azione="avanti"]').innerText()).trim(), 'Puntata 2 →')
  uguale('e accanto un’altra storia', await page.locator('[data-fine] [data-azione="altra-storia"]').count(), 1)
  await scatto(page, `${L.chiave}-libro-puntata-fine`)
  await page.locator('[data-fine] [data-azione="avanti"]').click()
  await page.waitForSelector('[data-libro-testo] [data-riassunto]')
  uguale('è la puntata 2', (await page.locator('[data-puntata]').innerText()).trim().toLowerCase(), 'puntata 2')
  const testo = await page.locator('[data-libro-testo]').innerText()
  for (const [cosa, ok] of S.stessaSerie(testo, serie.valori || {})) controlla(cosa, ok, JSON.stringify(serie.valori) + ' — ' + testo.slice(0, 300))
  controlla('comincia con «Nella puntata prima»', /nella puntata prima/i.test(await page.locator('[data-libro-testo] [data-riassunto]').innerText()))
  for (let i = 0; i < 4 && !(await page.locator('[data-azione="ho-letto"]').count()); i++)
    await page.locator('[data-azione="pagina-avanti"]').click()
  await page.locator('[data-azione="ho-letto"]').click()
  const tipi2 = await tuttoIlLibro(L, 'la puntata 2')
  controlla(`e la puntata 2 chiede ${S.tipi2.join(' e ')}`, S.tipi2.every(t => tipi2.includes(t)), tipi2.join(' · '))
  const serie2 = await finche(async () => ((await campagna(L)).serie || {})[S.serie] || {}, s => s.fatte === 2, 3000)
  uguale('la puntata 2 è letta, e la serie lo sa', serie2.fatte, 2)
  await page.locator('[data-fine] [data-azione="mappa"]').click()
  await page.waitForSelector('[data-mappa-inglese]')
})

/* ══════════ la pagina di un concetto ══════════
   La prima volta nella tappa di frasi viene prima la pagina del primo concetto, ferma finché non si tocca «Ho capito»; poi
   le frasi (docs/lingue/concetti.md). */
await allaHome(page)
await seminaLe(6.5, L => ({ tappa: 3, libera: false, stelle: {}, cfg: {},
                            vinte: Object.fromEntries([L.colori, L.animali, L.giocattoli].map((id, i) => [id, i + 1])) }))
for (const L of LINGUE) await blocco(`${L.chiave}: la pagina di un concetto`, async () => {
  await allaMappa(L)
  await page.waitForSelector(`${tappa(L.conFrasi)}[data-stato="aperta"]`)
  await page.locator(tappa(L.conFrasi)).click()
  await page.waitForSelector('[data-pagina]', { timeout: 5000 })
  uguale('la pagina è del primo concetto', await attr('[data-pagina]', 'data-concetto'), L.concetto)
  uguale('non è una ripresa', await attr('[data-pagina]', 'data-ripresa'), '0')
  uguale('due esempi', await page.locator('[data-pagina] [data-esempio]').count(), 2)
  controlla('quello che conta è colorato', await page.locator('[data-pagina] [data-forte]').count() > 0)
  uguale('nessuna domanda sotto', await page.locator('[data-domanda]').count(), 0)
  // è la cosa da provare: non se ne va da sola. L'orologio della pagina va avanti di tre secondi, e un timer che la
  // chiudesse scatterebbe
  await page.clock.fastForward(3000)
  await attendi(page, 100)
  uguale('e nessuna attesa: dopo tre secondi è ancora lì', await page.locator('[data-pagina]').count(), 1)
  await scatto(page, `${L.chiave}-pagina`)
  await page.locator('[data-azione="capito"]').click()
  await page.waitForSelector('[data-domanda][data-genere="frase"]', { timeout: 3000 })
  uguale('«Ho capito» porta alle frasi', await page.locator('[data-pagina]').count(), 0)
})

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('Le lingue a mondi nel browser')
