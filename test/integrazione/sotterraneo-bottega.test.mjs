/* ═══════════════════════════════════════════════════════════════════
   LE BOTTEGHE DI SOPRA E LO ZAINO, COL DITO
   tempo: 300

   perché: il tocco sul mercante che apre il banco, comprare e vendere, i cartellini e il confronto a 390 px, la roba che scende e risale
   a parte perché: cinque eroi seminati sul mondo di sopra che saltano dal mercante con `alBancoDi`; sotterraneo-sopra-mondo prova la strada a piedi e i dialoghi

   Quello che di botteghe e zaino esiste solo nel browser: il tocco sul mercante che apre il banco (il click che il dito si lascia
   dietro: docs/core/il-dito.md), un tocco che sceglie e il tasto che compra, i cartellini e il confronto affiancato a 390 px, la
   roba che scende e risale e il profilo riletto. Le regole (prezzi, vetrina, una riga avanti, il tetto delle pozioni, i due
   anelli, il copricapo di serie, l'elmo, la tinta, il riacquisto) le provano le unità senza disegnare: unita/sotterraneo-roba,
   -pozioni, -gioielli, -elmo, -copricapo-di-serie, -tintore, -zaino, -anteprime-3d. Uno Chrome solo e cinque eroi seminati sul
   mondo di sopra (docs/sotterraneo/mondo-3d.md); l'eroe va dal mercante col salto delle prove (`alBancoDi`): la strada a piedi la
   prova integrazione/sotterraneo-sopra-mondo.
   - i cinque mercanti del villaggio, comprare, vendere, il confronto, scendere con la roba e ritrovarla risalendo
     (docs/sotterraneo/bottega-finestra.md, «La bottega e lo zaino»);
   - il rigattiere tiene da parte gli ultimi cinque venduti, allo stesso prezzo, e la sua griglia scorre a 390 px (bottega.md, «Riacquista»);
   - un cavaliere vestito: i due anelli e la collana (roba.md), le anteprime 3D dello zaino (anteprime-3d.md), il copricapo di
     serie e l'elmo (elmo.md), il confronto con più abilità dal fabbro, il tintore (tintore.md);
   - il mago dall'incantatrice: niente roba che non porta, lo scettro una riga avanti, un pezzo col 🔒 (livello-dei-pezzi.md);
   - la guaritrice (roba.md, «Le pozioni»): le quattro cure, al più otto in tasca, l'ampolla della vita nello zaino.
   `node test/esegui.mjs integrazione/sotterraneo-bottega`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, leggiProfilo, scendiNelSotterraneo, mondoPronto, lasciaLaDiscesa,
         vendiNellaBottega, riacquistaNellaBottega, allaLinguettaDi, finestraFerma, alBancoDi, senzaPensieri, sopraVaDa, nelDialogo, ditoDi }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto, blocco } from '../aiuto/verifica.mjs'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { COSE, CURE_IN_VENDITA, chiaveDelPezzo } from '../../src/giochi/sotterraneo/dati/cose.js'
import { POZIONI_MASSIME } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { EROI } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { prezzoAvanti } from '../../src/giochi/sotterraneo/dati/mercanti.js'
import { COSTO } from '../../src/giochi/sotterraneo/dati/tinte.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
const { tocca, toccaIl, striscia } = await ditoDi(page)

// un eroe sul mondo di sopra con `finite` discese fatte e quella roba; senza pensieri, che col loro segno prendono il tocco
async function sopraCon(eroe, finite, roba) {
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
  await azzera(page)
  const stelle = Object.fromEntries(Array.from({ length: finite }, (_, i) => [i, 3]))
  await semina(page, {
    coins: 300,
    campagne: { sotterraneo: { tappa: finite, libera: false, stelle,
      cfg: { mondo: MONDO, eroe, avventure: { [eroe]: { tappa: finite, libera: false, stelle, missioni: {}, roba, mondo: { parlato: true } } } } } },
  })
  await senzaPensieri(page)
  await scegli(page, 'sotterraneo')
  await mondoPronto(page)
}
const gemmeBottega = async () => Number((await page.locator('[data-gemme-bottega]').innerText()).match(/\d+/)[0])
const gemme = async () => Number(await page.locator('[data-gemme-barra]').getAttribute('data-n'))
// le gemme del banco arrivano a `n` (il tasto paga in un fotogramma o due); poi le si confronta
const gemmeA = n => page.waitForFunction(n => Number((document.querySelector('[data-gemme-bottega]')?.innerText.match(/\d+/) || [])[0]) === n, n, { timeout: 3000 }).catch(() => {})
const testo = async sel => (await page.locator(sel).innerText()).replace(/\s+/g, ' ').trim()
const alBanco = (chi, opz = {}) => alBancoDi(page, chi, { tocca, toccaIl, ...opz })
async function chiudiBanco() {
  await toccaIl('[data-bottega] [data-chiudi]')
  await page.waitForSelector('[data-bottega]', { state: 'detached', timeout: 3000 })
}
async function scegliNelBanco(sel, cosa) {
  await toccaIl(sel)
  await page.waitForSelector(`[data-pannello][data-cosa="${cosa}"]`, { timeout: 3000 })
}
const linguette = () => page.locator('[data-bottega] [data-scheda]').evaluateAll(els => els.map(e => e.dataset.scheda))
// passa alla linguetta `s` col dito, e aspetta che sia lei quella accesa (un tocco nei 320 ms ciechi del banco non la cambia: si ritocca)
async function allaLinguetta(s) {
  const sel = `[data-bottega] [data-scheda="${s}"][aria-selected="true"]`
  for (let i = 0; i < 3 && !(await page.locator(sel).count()); i++) {
    await toccaIl(`[data-bottega] [data-scheda="${s}"]`)
    await page.waitForSelector(sel, { timeout: 1500 }).catch(() => {})
  }
  if (!(await page.locator(sel).count())) {
    const b = await page.locator(`[data-bottega] [data-scheda="${s}"]`).boundingBox()
    const accesa = await page.locator('[data-bottega] [data-scheda][aria-selected="true"]').getAttribute('data-scheda').catch(() => null)
    throw new Error(`la linguetta «${s}» non si accende col dito (è accesa «${accesa}», lei sta a ${JSON.stringify(b)})`)
  }
}
async function tuttiIPezzi() {
  const tutti = []
  for (const sc of await linguette()) {
    await allaLinguetta(sc)
    tutti.push(...await page.locator('[data-casella-pezzo]').evaluateAll(els => els.map(e => e.dataset.casellaPezzo)))
  }
  return tutti
}
async function apriLoZaino() {
  await toccaIl('[data-azione="zaino"]')
  await page.waitForSelector('[data-zaino]', { timeout: 3000 })
  await finestraFerma(page)
}
async function chiudiLoZaino() {
  await toccaIl('[data-zaino] [data-chiudi]')
  await page.waitForSelector('[data-zaino]', { state: 'detached', timeout: 3000 })
}
const addosso = dove => page.locator(`[data-zaino] [data-casella="${dove}"]`).getAttribute('data-cosa')
// un tocco su una tasca o una casella dello zaino, e il pannello di quel pezzo
async function nelloZaino(sel, cosa) {
  await toccaIl(`[data-zaino] ${sel}`)
  await page.waitForSelector(`[data-zaino] [data-pannello][data-cosa="${cosa}"]`, { timeout: 3000 })
}
async function usa() {
  await toccaIl('[data-zaino] [data-azione="usa"]')
  await attendi(page, 300)
}

/* ══════════ 1. i cinque mercanti: un cavaliere con un'ascia, un medaglione, un amuleto e cento gemme, due discese finite ══════════ */
const GEMME = 100
let spese = 0, dopo = 0
await blocco('i mercanti stanno nel villaggio', async () => {
  await sopraCon('cavaliere', 2, { v: 1, gemme: GEMME, zaino: ['ascia', 'medaglione', 'amuleto-rosso'], mano: null, mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 })
  uguale('nel villaggio ci sono cinque mercanti', await page.locator('[data-mercante][data-citta="villaggio"]').count(), 5)
  uguale('e la barra dice le gemme', await gemme(), GEMME)
})
await blocco('l\'erborista: un tocco sceglie, il tasto compra', async () => {
  await alBanco('erborista')
  uguale('la bottega si apre, con la sola linguetta delle pozioni', (await linguette()).join(), 'pozioni')
  controlla('in griglia la pozione', await page.locator('[data-casella-pezzo="pozione"]').count() === 1)
  uguale('l\'energia non è sua: la boccetta blu sta dall\'incantatrice', await page.locator('[data-casella-pezzo="pozione-blu"]').count(), 0)
  uguale('le gemme dell\'eroe in vista', await gemmeBottega(), GEMME)
  controlla('niente di scelto: parla l\'erborista, e dice chi compra la roba', (await page.locator('[data-chi-compra]').innerText()).includes('al mercante'))
  await scegliNelBanco('[data-casella-pezzo="pozione"]', 'pozione')
  controlla('un tocco sceglie, e il pannello dice i numeri', (await page.locator('[data-pannello]').innerText()).includes(`+${COSE.pozione.cura} vita`), await page.locator('[data-pannello]').innerText())
  uguale('ma non compra', await gemmeBottega(), GEMME)
  await toccaIl('[data-azione="compra"]')
  await gemmeA(GEMME - COSE.pozione.prezzo)
  uguale('il tasto compra: le gemme scendono del suo prezzo', await gemmeBottega(), GEMME - COSE.pozione.prezzo)
  controlla('e la bottega lo dice', (await page.locator('[data-detto-banco]').innerText()).includes('Pozione'))
  // il secondo tocco sulla stessa casella compra, se non arriva insieme al primo
  await scegliNelBanco('[data-casella-pezzo="pozione-piccola"]', 'pozione-piccola')
  await attendi(page, 600)
  await toccaIl('[data-casella-pezzo="pozione-piccola"]')
  spese = COSE.pozione.prezzo + COSE['pozione-piccola'].prezzo
  await gemmeA(GEMME - spese)
  uguale('un secondo tocco sulla boccetta la compra', await gemmeBottega(), GEMME - spese)
  uguale('la torcia non è sua: sta dal carovaniere', await page.locator('[data-casella-pezzo="torcia"]').count(), 0)
  await scatto(page, 'bottega-erborista')
  await chiudiBanco()
  uguale('e la barra di sopra ha le gemme di adesso', await gemme(), GEMME - spese)
})
await blocco('il carovaniere: le torce', async () => {
  await alBanco('carovaniere')
  uguale('la sua linguetta è «Torce»', await page.locator('[data-scheda="torce"][aria-selected="true"]').count(), 1)
  uguale('e sotto la torcia', await page.locator('[data-casella-pezzo="torcia"]').count(), 1)
  await chiudiBanco()
})
await blocco('l\'incantatrice: a un cavaliere solo l\'energia', async () => {
  await alBanco('incantatrice')
  uguale('una linguetta sola: l\'energia', (await linguette()).join(), 'energia')
  uguale('sotto «Energia» le due boccette blu', await page.locator('[data-casella-pezzo="pozione-blu"], [data-casella-pezzo="ampolla-blu"]').count(), 2)
  uguale('e non compra: dice chi lo fa', await page.locator('[data-chi-compra]').count(), 1)
  await scegliNelBanco('[data-casella-pezzo="pozione-blu"]', 'pozione-blu')
  await attendi(page, 600)
  await toccaIl('[data-casella-pezzo="pozione-blu"]')
  spese += COSE['pozione-blu'].prezzo
  await gemmeA(GEMME - spese)
  uguale('un secondo tocco sulla boccetta blu la compra', await gemmeBottega(), GEMME - spese)
  await chiudiBanco()
})
await blocco('il rigattiere: si vende, e si vede cosa riprendere', async () => {
  await alBanco('rigattiere')
  uguale('il rigattiere ha la linguetta «Vendi»', await page.locator('[data-scheda="vendi"]').count(), 1)
  controlla('e il banco non è mai vuoto: i gioielli più su si vedono, col prezzo alto', await page.locator('[data-casella-pezzo][data-avanti]').count() > 0)
  uguale('niente «non ho niente per te»', await page.locator('[data-banco-vuoto]').count(), 0)
  await vendiNellaBottega(page, 'ascia', { tocca })
  dopo = GEMME - spese + COSE.ascia.prezzo / 2
  await gemmeA(dopo)
  uguale('venduta, l\'ascia non c\'è più', await page.locator('[data-vendo="ascia"]').count(), 0)
  uguale('e le gemme salgono di metà del suo prezzo', await gemmeBottega(), dopo)
  await scegliNelBanco('[data-vendo="medaglione"]', 'medaglione')
  controlla('il medaglione si può vendere', (await page.locator('[data-azione="vendi"]').innerText()).includes(String(COSE.medaglione.prezzo / 2 | 0)))
  const pagata = COSE.ascia.prezzo / 2 | 0
  await toccaIl('[data-scheda="riacquista"]')
  await page.waitForSelector('[data-riacquisto="ascia"]', { timeout: 3000 })
  uguale('«Riacquista» ha l\'ascia venduta', (await page.locator('[data-riacquisto]').evaluateAll(els => els.map(e => e.dataset.riacquisto))).join(), 'ascia')
  await scegliNelBanco('[data-riacquisto="ascia"]', 'ascia')
  uguale('e il tasto dice il prezzo a cui l\'ha pagata', await testo('[data-azione="riacquista"]'), `Riacquista 💎 ${pagata}`)
  await scatto(page, 'bottega-riacquista')
  await chiudiBanco()
  uguale('e sulla barra di sopra', await gemme(), dopo)
})
await blocco('l\'armaiolo: le linguette, una riga avanti, il confronto', async () => {
  await alBanco('armaiolo')
  uguale('armi, difese ed elmi, e non «Vendi»', (await linguette()).length, 3)
  uguale('e non compra: dice chi lo fa', await page.locator('[data-chi-compra]').count(), 1)
  // il banco porta la riga della storia della prossima discesa (la torre): la spada corta, lo scudo di legno e il panciotto
  for (const k of ['spada-corta', 'scudo-legno', 'panciotto']) {
    uguale(`l'armaiolo ha ${COSE[k].nome.toLowerCase()}, del passo dopo`, await allaLinguettaDi(page, k, { tocca }), true)
    uguale('e si compra al prezzo pieno', await page.locator(`[data-casella-pezzo="${k}"]:not([data-avanti])`).count(), 1)
  }
  // la spada è della riga dopo ancora: si vede, costa il doppio, e con le gemme si compra (niente lucchetto)
  uguale('la spada si vede', await allaLinguettaDi(page, 'spada', { tocca }), true)
  uguale('una riga avanti', await page.locator('[data-casella-pezzo="spada"]').getAttribute('data-avanti'), '1')
  await scegliNelBanco('[data-casella-pezzo="spada"]', 'spada')
  uguale('il prezzo alto lo dice il cartellino, senza una riga che lo spieghi né «quando avrai finito»', await page.locator('[data-avanti-costa], [data-quando]').count(), 0)
  uguale('col tasto al doppio del prezzo', await testo('[data-azione="compra"]'), `Compra 💎 ${prezzoAvanti(COSE.spada.prezzo, 1)}`)
  uguale('e acceso, perché le gemme bastano', await page.locator('[data-azione="compra"]').isDisabled(), false)
  const tutti = await tuttiIPezzi()
  uguale('il cavaliere non vede la verga né i pezzi che non porta', tutti.filter(k => ['bacchette', 'archi', 'stoffa'].includes(COSE[k].famiglia)).join(), '')
  // il confronto: a mani nude contro la spada corta
  await allaLinguettaDi(page, 'spada-corta', { tocca })
  await scegliNelBanco('[data-casella-pezzo="spada-corta"]', 'spada-corta')
  uguale('il confronto dice il netto sul braccio, in verde', `${await testo('[data-confronto="att"]')} ${await page.locator('[data-confronto="att"]').getAttribute('data-verso')}`, '⚔️ +1 su')
  controlla('a sinistra «Addosso»: niente', (await page.locator('[data-affianca] [data-colonna="addosso"] [data-niente]').innerText()).includes('niente'))
  uguale('e nessun pezzo', await page.locator('[data-affianca] [data-colonna="addosso"] [data-pezzo]').count(), 0)
  uguale('a destra «Questo»: la spada corta', await page.locator('[data-affianca] [data-colonna="questo"] [data-pezzo]').getAttribute('data-pezzo'), 'spada-corta')
  uguale('un numero solo, +1 nel cartellino di destra', `${await page.locator('[data-affianca] [data-valore]').count()} ${await page.locator('[data-valore="att-questo"]').getAttribute('data-n')}`, '1 +1')
  const pannello = await page.locator('[data-pannello]').boundingBox()
  const destra = await page.locator('[data-colonna="questo"]').boundingBox()
  const larghezza = await page.evaluate(() => document.documentElement.clientWidth)
  controlla('a 390 px le due colonne stanno nel pannello e nello schermo',
            destra.x + destra.width <= pannello.x + pannello.width + 1 && pannello.x + pannello.width <= larghezza + 1, JSON.stringify({ pannello, destra, larghezza }))
  uguale('e la casella della mano si accende', await page.locator('[data-casella="mano"].sot-accesa').count(), 1)
  await scatto(page, 'bottega-armaiolo')
  await toccaIl('[data-azione="compra"]')
  dopo -= COSE['spada-corta'].prezzo
  await page.waitForSelector('[data-casella="mano"][data-cosa="spada-corta"]', { timeout: 3000 }).catch(() => {})
  uguale('comprata, la spada corta va in mano da sé', await page.locator('[data-casella="mano"][data-cosa="spada-corta"]').count(), 1)
  uguale('e se ne va dal banco', await page.locator('[data-casella-pezzo="spada-corta"]').count(), 0)
  await scegliNelBanco('[data-casella="mano"]', 'spada-corta')
  uguale('toccando la mano il pannello dice la spada corta', await page.locator('[data-pannello][data-cosa="spada-corta"]').count(), 1)
  await chiudiBanco()
  uguale('le gemme sono scese della spada', await gemme(), dopo)
})
await blocco('si scende con la roba comprata, e lo zaino la usa', async () => {
  await scendiNelSotterraneo(page, 0, { tocca })
  await page.waitForSelector('[data-tela="3d"]', { timeout: 30000 })
  await page.waitForSelector('[data-azione="zaino"]', { timeout: 10000 })
  await apriLoZaino()
  uguale('nello zaino c\'è la pozione comprata sopra', await page.locator('[data-tasca][data-cosa="pozione"]').count(), 1)
  uguale('e la spada in mano', await page.locator('[data-zaino] [data-casella="mano"][data-cosa="spada-corta"]').count(), 1)
  // il medaglione dalla tasca: il confronto dice la difesa, e «Indossa» lo mette al collo
  await nelloZaino('[data-tasca][data-cosa="medaglione"]', 'medaglione')
  uguale('il medaglione alza la difesa di uno', await testo('[data-zaino] [data-confronto="dif"]'), '🛡️ +1')
  uguale('il tasto dice «Indossa»', await testo('[data-zaino] [data-azione="usa"]'), 'Indossa')
  await usa()
  uguale('indossato, sta al collo', await addosso('collo'), 'medaglione')
  // l'amuleto rosso contro il medaglione: due abilità in riga, una meglio e una peggio
  await nelloZaino('[data-tasca][data-cosa="amuleto-rosso"]', 'amuleto-rosso')
  uguale('a sinistra il medaglione, a destra l\'amuleto', `${await page.locator('[data-zaino] [data-colonna="addosso"] [data-pezzo]').getAttribute('data-pezzo')} ${await page.locator('[data-zaino] [data-colonna="questo"] [data-pezzo]').getAttribute('data-pezzo')}`, 'medaglione amuleto-rosso')
  uguale('la difesa del medaglione a sinistra, la vita dell\'amuleto a destra', `${await page.locator('[data-zaino] [data-valore="dif-addosso"]').getAttribute('data-n')} ${await page.locator('[data-zaino] [data-valore="vita-questo"]').getAttribute('data-n')}`, '+1 +6')
  uguale('il netto: la difesa scende in rosso, la vita sale in verde', `${await page.locator('[data-zaino] [data-confronto="dif"]').getAttribute('data-verso')} ${await page.locator('[data-zaino] [data-confronto="vita"]').getAttribute('data-verso')}`, 'giu su')
  await scatto(page, 'bottega-zaino-affiancato')
  await nelloZaino('[data-tasca][data-cosa="pozione"]', 'pozione')
  uguale('per la pozione il tasto dice «Bevi»', await testo('[data-zaino] [data-azione="usa"]'), 'Bevi')
  await usa()
  uguale('bevuta, la tasca è vuota', await page.locator('[data-tasca][data-cosa="pozione"]').count(), 0)
  await chiudiLoZaino()
})
await blocco('lasciata perdere la discesa, la roba resta', async () => {
  // la ✕ non porta di sopra (docs/sotterraneo/portale-e-sosta.md): si risale lasciando perdere la discesa
  await lasciaLaDiscesa(page)
  const p = await leggiProfilo(page)
  const av = p?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere
  const su = av?.roba
  controlla('la roba è nel profilo: la spada comprata in mano, il medaglione messo giù al collo', !!su && su.mano === 'spada-corta' && su.collo === 'medaglione', JSON.stringify(su))
  uguale('con le gemme di prima', su && su.gemme, dopo)
  uguale('e la barra di sopra le dice', await gemme(), dopo)
  uguale('la discesa no: nessuna sosta scritta', !!av?.sosta, false)
  nota(`gemme: ${GEMME} → ${GEMME - spese} (pozione, boccetta e boccetta blu) → ${dopo} (ascia venduta, spada corta comprata)`)
})

/* ══════════ 2. il rigattiere tiene da parte gli ultimi cinque venduti ══════════ */
await blocco('il rigattiere: sei vendite, cinque da parte', async () => {
  const vendibili = ['ascia', 'medaglione', 'amuleto-rosso', 'scudo-legno', 'pozione-piccola', 'spada']
  await sopraCon('cavaliere', 2, { v: 1, gemme: 20, zaino: [...vendibili], mano: null, mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 })
  await alBanco('rigattiere')
  uguale('tre linguette: gioielli, vendi, riacquista', (await linguette()).join(), 'gioielli,vendi,riacquista')
  await toccaIl('[data-scheda="riacquista"]')
  await page.waitForSelector('[data-riacquisto-vuoto]', { timeout: 3000 }).catch(() => {})
  uguale('all\'inizio non ha tenuto niente da parte', await page.locator('[data-riacquisto-vuoto]').count(), 1)
  const pagati = Object.fromEntries(vendibili.map(k => [k, Math.max(1, Math.floor(COSE[k].prezzo / 2))]))
  for (const k of vendibili) await vendiNellaBottega(page, k, { tocca })
  const tutte = 20 + vendibili.reduce((n, k) => n + pagati[k], 0)
  await gemmeA(tutte)
  uguale('vendute le sei cose, le gemme salgono', await gemmeBottega(), tutte)
  const daRiprendere = () => page.locator('[data-riacquisto]').evaluateAll(els => els.map(e => e.dataset.riacquisto))
  await toccaIl('[data-scheda="riacquista"]')
  await page.waitForSelector('[data-riacquisto]', { timeout: 3000 })
  uguale('da parte le ultime cinque, la più recente per prima: l\'ascia è uscita', (await daRiprendere()).join(), vendibili.slice(1).reverse().join())
  controlla('ognuna col prezzo a cui l\'ha pagata il mercante', (await page.locator('[data-riacquisto="spada"]').innerText()).includes(String(pagati.spada)), await page.locator('[data-riacquisto="spada"]').innerText())
  await scatto(page, 'bottega-riacquisto')
  await riacquistaNellaBottega(page, 'spada', { tocca })
  await gemmeA(tutte - pagati.spada)
  uguale('si riprende al prezzo pagato, non a quello del banco', await gemmeBottega(), tutte - pagati.spada)
  uguale('la spada ripresa va in mano da sé', await page.locator('[data-casella="mano"][data-cosa="spada"]').count(), 1)
  uguale('e non è più da riprendere', (await daRiprendere()).join(), 'pozione-piccola,scudo-legno,amuleto-rosso,medaglione')
  const prima = await gemmeBottega()
  await riacquistaNellaBottega(page, 'amuleto-rosso', { tocca })
  await gemmeA(prima - pagati['amuleto-rosso'])
  uguale('anche un gioiello si riprende, e va al collo', await page.locator('[data-casella="collo"][data-cosa="amuleto-rosso"]').count(), 1)
  const venduti = (await leggiProfilo(page))?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.venduti
  uguale('l\'elenco sta nell\'avventura, coi prezzi', JSON.stringify((venduti || []).map(x => [x.k, x.prezzo])),
         JSON.stringify(['medaglione', 'scudo-legno', 'pozione-piccola'].map(k => [k, pagati[k]])))
})
await blocco('il banco di chi veste, a 390 px', async () => {
  await allaLinguetta('gioielli')
  const caselle = await page.locator('[data-casella-pezzo]').count()
  controlla('i gioielli hanno una decina di caselle', caselle >= 8, String(caselle))
  const larghezza = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth])
  controlla('e la pagina non scorre di lato', larghezza[0] <= larghezza[1] + 1, larghezza.join(' / '))
  const griglia = await page.locator('.sot-banco-griglia').first().evaluate(e => ({ alto: e.clientHeight, pieno: e.scrollHeight }))
  controlla('scorre solo la griglia: dieci caselle non stanno tutte insieme', griglia.pieno > griglia.alto, JSON.stringify(griglia))
  const ultima = page.locator('[data-casella-pezzo]').last()
  await ultima.scrollIntoViewIfNeeded()
  const b = await ultima.boundingBox()
  controlla('l\'ultima casella si raggiunge scorrendo', b && b.y >= 0 && b.y + b.height <= await page.evaluate(() => innerHeight), JSON.stringify(b))
  const bottoni = await page.locator('.sot-linguette .sot-linguetta').evaluateAll(els => els.map(e => [e.getBoundingClientRect().left, e.getBoundingClientRect().right]))
  controlla('le tre linguette stanno nella larghezza', bottoni.every(([l, r]) => l >= 0 && r <= larghezza[1] + 1), JSON.stringify(bottoni))
  await scatto(page, 'bottega-gioielli-390')
  await chiudiBanco()
})

/* ══════════ 3. un cavaliere vestito, con un salvataggio di prima ══════════
   spada, scudo borchiato e panciotto addosso, un amuleto «al dito» (prima i gioielli avevano un posto solo) e niente `testa`; in tasca tre
   anelli (l'ambra magico di vita, il verde, e un verde magico di difesa e vita che arriva a due anelli pieni) e un elmo cornuto. Sei discese:
   l'armaiolo ha lo spadone e, in vetrina, lo scudo del teschio */
const nuovo = chiaveDelPezzo('anello-verde', 1, 'magico', ['dif', 'vita'])
const buono = chiaveDelPezzo('anello-ambra', 1, 'magico', ['vita'])
await blocco('lo zaino: sette caselle, e l\'amuleto di prima al collo', async () => {
  await sopraCon('cavaliere', 6, { v: 1, gemme: 60, zaino: [nuovo, 'anello-verde', buono, 'elmo-cornuto'], mano: 'spada', mancina: 'scudo-borchiato',
                                   corpo: 'panciotto', dito: 'amuleto-rosso', torcia: 0, torce: 0 })
  await apriLoZaino()
  uguale('le caselle intorno all\'eroe', (await page.locator('[data-zaino] [data-casella]').evaluateAll(es => es.map(e => e.dataset.casella))).sort().join(),
         ['mano', 'mancina', 'corpo', 'collo', 'dito', 'dito2', 'testa'].sort().join())
  uguale('l\'amuleto che era «al dito» sta al collo', await addosso('collo'), 'amuleto-rosso')
  uguale('i due anelli sono liberi', `${await addosso('dito')}|${await addosso('dito2')}`, 'null|null')
  const caselle = await page.locator('[data-zaino] [data-casella]').evaluateAll(els => els.map(e => {
    const r = e.getBoundingClientRect()
    return { dove: e.dataset.casella, x: r.x, y: r.y, w: r.width, h: r.height }
  }))
  uguale('ogni casella si tocca bene col dito (almeno 44 px)', caselle.filter(c => c.w < 44 || c.h < 44).map(c => c.dove).join(), '')
  const larghezza = await page.evaluate(() => document.documentElement.clientWidth)
  controlla('a 390 px niente esce dallo schermo', larghezza <= 390 && caselle.every(c => c.x >= 0 && c.x + c.w <= larghezza), JSON.stringify({ larghezza, caselle }))
  const c = Object.fromEntries(caselle.map(x => [x.dove, x]))
  controlla('i due anelli uno sopra l\'altro a destra, la collana sotto il corpo a sinistra', c.dito.x === c.dito2.x && c.dito2.y > c.dito.y && c.collo.x < c.dito.x && c.collo.y > c.corpo.y)
})
await blocco('le anteprime 3D dello zaino e della pagina dell\'eroe', async () => {
  // le caselle ci sono subito, vuote; poi arrivano le anteprime
  await page.waitForFunction(() => document.querySelector('.sot-armato[data-anteprima="3d"]') && document.querySelector('[data-casella="mano"] [data-anteprima="3d"]')
    && document.querySelector('[data-casella="collo"] [data-anteprima-chiave]'), null, { timeout: 15000 }).catch(() => {})
  const chiavi = await page.locator('[data-zaino] [data-anteprima-chiave]').evaluateAll(es => es.map(e => e.dataset.anteprimaChiave))
  controlla('l\'arma in mano è il modello 3D', chiavi.some(k => k.startsWith('arma:')), chiavi.join(' '))
  controlla('lo scudo anche', chiavi.some(k => k.startsWith('scudo:')), chiavi.join(' '))
  controlla('e l\'armatura, su chi la porta', chiavi.some(k => /^armatura:\w+:\d:cavaliere:/.test(k)), chiavi.join(' '))
  const collana = await page.locator('[data-zaino] [data-casella="collo"] [data-anteprima-chiave]').evaluateAll(es => es.map(e => e.dataset.anteprimaChiave))
  controlla('la collana: la sua figura 3D', collana.length === 1 && collana[0].startsWith('gioiello:'), collana.join(' '))
  uguale('il ritratto 3D tiene i segni della roba in mano', await page.locator('[data-zaino] .sot-armato[data-anteprima="3d"] [data-in-mano]').count(), 1)
  const stato = await page.evaluate(() => window.__anteprime3d.stato())
  controlla('un renderer solo', stato.renderer === 1 && !stato.rotto, JSON.stringify(stato))
  await scatto(page, 'bottega-zaino-anteprime')
  await toccaIl('[data-scheda="eroe"]')
  await page.waitForFunction(() => document.querySelector('[data-pagina-eroe] .sot-armato[data-anteprima="3d"]'), null, { timeout: 10000 }).catch(() => {})
  uguale('la pagina dell\'eroe ha il ritratto 3D', await page.locator('[data-pagina-eroe] .sot-armato[data-anteprima="3d"]').count(), 1)
  await toccaIl('[data-scheda="zaino"]')
  await page.waitForSelector('[data-zaino]', { timeout: 3000 })
  await finestraFerma(page)
})
await blocco('i due anelli', async () => {
  await nelloZaino(`[data-tasca][data-cosa="${buono}"]`, buono)
  uguale('il primo anello: il confronto è con un dito libero, senza il tasto dell\'altro anello', `${await page.locator('[data-colonna="addosso"] [data-niente]').count()} ${await page.locator('[data-azione="altro-anello"]').count()}`, '1 0')
  uguale('si accende il primo dito', await page.locator('[data-zaino] [data-casella="dito"]').evaluate(e => e.classList.contains('sot-accesa')), true)
  await usa()
  uguale('indossato sul primo dito', await addosso('dito'), buono)
  await nelloZaino('[data-tasca][data-cosa="anello-verde"]', 'anello-verde')
  await usa()
  uguale('il secondo sull\'altro dito', await addosso('dito2'), 'anello-verde')
  // i due anelli pieni: il nuovo dice quale sostituirebbe (quello che rende meno), e si può scegliere l'altro
  await nelloZaino(`[data-tasca][data-cosa="${nuovo}"]`, nuovo)
  const aSinistra = () => page.locator('[data-zaino] [data-colonna="addosso"] [data-pezzo]').getAttribute('data-pezzo')
  const acceso = d => page.locator(`[data-zaino] [data-casella="${d}"]`).evaluate(e => e.classList.contains('sot-accesa'))
  uguale('a sinistra l\'anello che rende meno, il verde, sul secondo dito acceso', `${await aSinistra()} ${await acceso('dito2')}`, 'anello-verde true')
  await scatto(page, 'bottega-anello-verde')
  await toccaIl('[data-azione="altro-anello"]')
  await page.waitForFunction(b => document.querySelector('[data-zaino] [data-colonna="addosso"] [data-pezzo]')?.dataset.pezzo === b, buono, { timeout: 3000 }).catch(() => {})
  uguale('«l\'altro anello» ribalta: a sinistra l\'ambra, acceso il primo dito e non il secondo', `${await aSinistra()} ${await acceso('dito')} ${await acceso('dito2')}`, `${buono} true false`)
  const larghezza = await page.evaluate(() => document.documentElement.clientWidth)
  const pannello = await page.locator('[data-zaino] [data-pannello]').boundingBox()
  controlla('a 390 px il pannello con il tasto sta', pannello.x >= 0 && pannello.x + pannello.width <= larghezza + 1, JSON.stringify(pannello))
  await usa()
  uguale('«Indossa» mette il nuovo sul primo dito', await addosso('dito'), nuovo)
  uguale('il verde resta al secondo, la collana al collo', `${await addosso('dito2')} ${await addosso('collo')}`, 'anello-verde amuleto-rosso')
  uguale('e l\'ambra torna in tasca', await page.locator(`[data-tasca][data-cosa="${buono}"]`).count(), 1)
  const roba = (await leggiProfilo(page))?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.roba
  controlla('il profilo ha il collo e i due diti', !!roba && roba.collo === 'amuleto-rosso' && roba.dito === nuovo && roba.dito2 === 'anello-verde', JSON.stringify(roba))
})
await blocco('il copricapo di serie e l\'elmo', async () => {
  const difesa = () => page.locator('[data-zaino] .sot-intorno-numeri').innerText().then(t => Number((/🛡️\s*(\d+)/.exec(t) || [])[1]))
  uguale('in testa il suo copricapo di serie: il salvataggio di prima lo riceve', await addosso('testa'), 'serie-cavaliere')
  uguale('e dice come si chiama', await page.locator('[data-zaino] [data-casella="testa"]').getAttribute('aria-label'), 'Elmo da cavaliere')
  await nelloZaino('[data-casella="testa"]', 'serie-cavaliere')
  await toccaIl('[data-zaino] [data-azione="riponi"]')
  await page.waitForSelector('[data-zaino] [data-tasca][data-cosa="serie-cavaliere"]', { timeout: 3000 }).catch(() => {})
  let roba = (await leggiProfilo(page))?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.roba
  controlla('riposto: la testa è nuda e il pezzo è in tasca', !!roba && !roba.testa && roba.zaino.includes('serie-cavaliere'), JSON.stringify(roba))
  await nelloZaino('[data-tasca][data-cosa="serie-cavaliere"]', 'serie-cavaliere')
  await usa()
  roba = (await leggiProfilo(page))?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.roba
  controlla('rimesso: torna in testa, e non è più in tasca', !!roba && roba.testa === 'serie-cavaliere' && !roba.zaino.includes('serie-cavaliere'), JSON.stringify(roba))
  const prima = await difesa()
  await nelloZaino('[data-tasca][data-cosa="elmo-cornuto"]', 'elmo-cornuto')
  await usa()
  uguale('«Indossa» mette l\'elmo in testa', await addosso('testa'), 'elmo-cornuto')
  uguale('la difesa sale di uno', await difesa(), prima + 1)
  await page.waitForFunction(() => /^copricapo:/.test(document.querySelector('[data-zaino] [data-casella="testa"] [data-anteprima-chiave]')?.dataset.anteprimaChiave || ''), null, { timeout: 15000 }).catch(() => {})
  const k = await page.locator('[data-zaino] [data-casella="testa"] [data-anteprima-chiave]').getAttribute('data-anteprima-chiave')
  controlla('la casella ha l\'anteprima del copricapo', /^copricapo:[\w-]+:c$/.test(k || ''), k)
  await scatto(page, 'bottega-elmo')
  await chiudiLoZaino()
  roba = (await leggiProfilo(page))?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.roba
  uguale('e il profilo lo sa', roba && roba.testa, 'elmo-cornuto')
})
await blocco('dal fabbro: lo spadone contro spada e scudo', async () => {
  await alBanco('armaiolo')
  const n = sel => page.locator(sel).getAttribute('data-n')
  uguale('lo spadone sta al banco', await allaLinguettaDi(page, 'spadone', { tocca }), true)
  await toccaIl('[data-casella-pezzo="spadone"]')
  await page.waitForSelector('[data-pannello][data-cosa="spadone"] [data-affianca]', { timeout: 3000 })
  uguale('a sinistra due pezzi: la spada e lo scudo', (await page.locator('[data-colonna="addosso"] [data-pezzo]').evaluateAll(els => els.map(e => e.dataset.pezzo))).join(), 'spada,scudo-borchiato')
  uguale('a destra lo spadone', await page.locator('[data-colonna="questo"] [data-pezzo]').getAttribute('data-pezzo'), 'spadone')
  controlla('e lo dice chiaro: a due mani lo scudo torna nello zaino', /due mani.*scudo borchiato torna nello zaino/i.test(await page.locator('[data-due-mani]').innerText()), await testo('[data-due-mani]'))
  uguale('il braccio: +2 a sinistra, quello del catalogo a destra', `${await n('[data-valore="att-addosso"]')} ${await n('[data-valore="att-questo"]')}`, `+2 +${COSE.spadone.att}`)
  uguale('la difesa e la vita dello scudo stanno solo a sinistra', await page.locator('[data-valore="dif-questo"], [data-valore="vita-questo"]').count(), 0)
  controlla('ogni cartellino dice livello e rarità', (await page.locator('[data-colonna="questo"]').innerText()).includes('liv. 1 · comune'))
  const verso = async k => page.locator(`[data-confronto="${k}"]`).getAttribute('data-verso')
  uguale('il netto: il braccio sale, la difesa e la vita scendono', `${await verso('att')} ${await verso('dif')} ${await verso('vita')}`, 'su giu giu')
  const pannello = await page.locator('[data-pannello]').boundingBox()
  const destra = await page.locator('[data-colonna="questo"]').boundingBox()
  const larghezza = await page.evaluate(() => document.documentElement.clientWidth)
  controlla('a 390 px le due colonne stanno nel pannello', larghezza <= 390 && destra.x + destra.width <= pannello.x + pannello.width + 1 && pannello.x + pannello.width <= larghezza + 1,
            JSON.stringify({ pannello, destra, larghezza }))
  const fuori = await page.locator('[data-affianca] *').evaluateAll(els => els.filter(e => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).display !== 'inline').map(e => e.className))
  uguale('e niente testo che esce dal suo riquadro', fuori.join(), '')
  await scatto(page, 'bottega-spadone')
  // lo scudo del teschio in vetrina, contro lo scudo borchiato
  uguale('gli scudi stanno sotto un\'altra linguetta', await allaLinguettaDi(page, 'scudo-teschio', { tocca }), true)
  await toccaIl('[data-casella-pezzo="scudo-teschio"]')
  await page.waitForSelector('[data-pannello][data-cosa="scudo-teschio"] [data-affianca]', { timeout: 3000 })
  uguale('a sinistra lo scudo borchiato', await page.locator('[data-colonna="addosso"] [data-pezzo]').getAttribute('data-pezzo'), 'scudo-borchiato')
  uguale('la difesa: +1 a sinistra, +3 a destra', `${await n('[data-valore="dif-addosso"]')} ${await n('[data-valore="dif-questo"]')}`, '+1 +3')
  uguale('la vita dello scudo borchiato sta solo a sinistra', `${await n('[data-valore="vita-addosso"]')} ${await page.locator('[data-valore="vita-questo"]').count()}`, '+3 0')
  uguale('le mani non cambiano: niente da dire', await page.locator('[data-due-mani]').count(), 0)
  uguale('il netto: la difesa sale, la vita scende', `${await verso('dif')} ${await verso('vita')}`, 'su giu')
  // gli elmi hanno la loro linguetta, e l'eroe la sua settima casella anche qui
  await allaLinguetta('elmi')
  const elmi = await page.locator('[data-bottega] [data-casella-pezzo]').evaluateAll(es => es.map(e => e.dataset.casellaPezzo))
  controlla('sotto «Elmi» solo elmi, almeno tre', elmi.length >= 3 && elmi.every(k => /^(elmo|elmo-cornuto|cuffia)(@|$)/.test(k)), elmi.join())
  uguale('e l\'eroe ha la casella della testa, con l\'elmo', await page.locator('[data-bottega] [data-casella="testa"]').getAttribute('data-cosa'), 'elmo-cornuto')
  await chiudiBanco()
})
await blocco('dal rigattiere, anelli e collane sotto la stessa linguetta', async () => {
  await alBanco('rigattiere')
  uguale('la linguetta dei gioielli', await page.locator('[data-bottega] [data-scheda="gioielli"]').count(), 1)
  const tipi = await page.locator('[data-bottega] [data-casella-pezzo]').evaluateAll(els => els.map(e => e.dataset.casellaPezzo))
  controlla('il banco ha anelli e collane', tipi.some(k => /anello/.test(k)) && tipi.some(k => /amuleto|medaglione|teschio/.test(k)), tipi.join())
  uguale('e le sette caselle dell\'eroe sono anche qui', await page.locator('[data-bottega] [data-casella]').count(), 7)
  uguale('con la collana al collo', await page.locator('[data-bottega] [data-casella="collo"]').getAttribute('data-cosa'), 'amuleto-rosso')
  await chiudiBanco()
})
await blocco('il tintore', async () => {
  await sopraVaDa(page, '[data-personaggio="tintore"]', 'personaggio:villaggio:tintore')
  await page.waitForSelector('[data-dialogo="tintore"]', { timeout: 30000 })
  await nelDialogo(page, '[data-scelta="bottega"]')
  await page.waitForSelector('[data-tintore]', { timeout: 10000 })
  const t = '[data-tintore]', tingi = '[data-tintore] [data-prs="paga"]'
  const pezzi = () => page.locator(`${t} [data-pezzo]`).evaluateAll(l => l.map(e => e.dataset.pezzo))
  const roba = async () => (await leggiProfilo(page)).campagne.sotterraneo.cfg.avventure.cavaliere.roba
  uguale('le gemme sono quelle della roba', await page.locator(t).getAttribute('data-gemme'), '60')
  controlla('fra le armi la spada', (await pezzi()).includes('spada'), (await pezzi()).join())
  await page.locator(`${t} [data-prs-scheda="difese"]`).click()
  controlla('fra le difese il panciotto', (await pezzi()).includes('panciotto'), (await pezzi()).join())
  await page.locator(`${t} [data-prs-scheda="armi"]`).click()
  uguale('senza un colore in prova non c\'è il tasto', await page.locator(tingi).count(), 0)
  await page.locator(`${t} [data-pezzo="spada"]`).click()
  await page.locator(`${t} [data-tinta="rosso"]`).click()
  await page.waitForSelector(tingi, { timeout: 3000 })
  uguale('il colore in prova non si paga da solo', (await roba()).gemme, 60)
  await scatto(page, 'bottega-tintore')
  await page.locator(tingi).click()
  await page.waitForFunction(g => document.querySelector('[data-tintore]').dataset.gemme === g, String(60 - COSTO), { timeout: 3000 }).catch(() => {})
  let r = await roba()
  uguale('la tinta sta nella roba', r.tinte && r.tinte.spada, 'rosso')
  uguale('le gemme sono scese di COSTO, e il foglio le mostra', `${r.gemme} ${await page.locator(t).getAttribute('data-gemme')}`, `${60 - COSTO} ${60 - COSTO}`)
  uguale('il pezzo dice il suo colore, e il rosso è acceso', `${await page.locator(`${t} [data-pezzo="spada"]`).getAttribute('data-tinto')} ${await page.locator(`${t} [data-tinta="rosso"][aria-pressed="true"]`).count()}`, 'rosso 1')
  // un secondo pezzo ancora si può, un terzo no: restano 10 gemme
  await page.locator(`${t} [data-prs-scheda="difese"]`).click()
  await page.locator(`${t} [data-pezzo="panciotto"]`).click()
  await page.locator(`${t} [data-tinta="blu"]`).click()
  await page.locator(tingi).click()
  await page.waitForFunction(g => document.querySelector('[data-tintore]').dataset.gemme === g, String(60 - 2 * COSTO), { timeout: 3000 }).catch(() => {})
  await page.locator(`${t} [data-prs-scheda="armi"]`).click()
  await page.locator(`${t} [data-pezzo="spada"]`).click()
  await page.locator(`${t} [data-tinta="verde"]`).click()
  uguale('con meno gemme il tasto è spento', await page.locator(tingi).isDisabled(), true)
  await page.locator(`${t} [data-chiudi]`).click()
  await page.waitForSelector(t, { state: 'detached', timeout: 3000 })
  r = await roba()
  uguale('chiuso il foglio, le tinte restano e il terzo non si è pagato', `${r.tinte.spada} ${r.tinte.panciotto} ${r.gemme}`, `rosso blu ${60 - 2 * COSTO}`)
})

/* ══════════ 4. il mago dall'incantatrice: tre discese finite, la verga in mano, 250 gemme ══════════
   lo scettro è nella riga dopo: una riga avanti e costa il doppio; un pezzo col 🔒 si compra lo stesso */
await blocco('l\'incantatrice: solo roba per il mago', async () => {
  await sopraCon('mago', 3, { v: 1, gemme: 250, zaino: [], mano: 'verga', mancina: null, corpo: 'saio', collo: 'amuleto-azzurro', torcia: 0, torce: 0 })
  await alBanco('incantatrice')
  uguale('quattro linguette: bacchette, vesti, cappelli, energia', (await linguette()).join(), 'bacchette,vesti,cappelli,energia')
  const mago = EROI.find(e => e.chiave === 'mago')
  const mostrati = []
  let col = 0
  /* quattro linguette sono tante, a 390 px: l'ultima spunta dal bordo e la fila scorre di lato col dito (docs/sotterraneo/
     bottega-finestra.md). Prima usciva dallo schermo e basta: il dito non la poteva toccare */
  const fuoriSchermo = () => page.locator('[data-bottega] [data-scheda]').evaluateAll(es => es.filter(e => {
    const r = e.getBoundingClientRect()
    return r.left < -1 || r.right > document.documentElement.clientWidth + 1
  }).map(e => e.dataset.scheda))
  uguale('a 390 px l\'ultima linguetta esce dal bordo', (await fuoriSchermo()).join(), 'energia')
  controlla('ma spunta: si vede che ce n\'è un\'altra', await page.locator('[data-bottega] [data-scheda="energia"]')
    .evaluate(e => e.getBoundingClientRect().left < document.documentElement.clientWidth - 16))
  for (const s of await linguette()) {
    if ((await fuoriSchermo()).includes(s)) {
      // si tira dentro strisciando la fila verso sinistra, col dito vero
      const b = await page.locator('[data-bottega] .sot-linguette').boundingBox()
      await striscia(b.x + b.width - 40, b.y + b.height / 2, b.x + 40, b.y + b.height / 2)
      await page.waitForFunction(k => {
        const r = document.querySelector(`[data-bottega] [data-scheda="${k}"]`).getBoundingClientRect()
        return r.left >= -1 && r.right <= document.documentElement.clientWidth + 1
      }, s, { timeout: 3000 }).catch(() => {})
      uguale(`strisciando la fila la linguetta «${s}» entra nello schermo`, (await fuoriSchermo()).includes(s), false)
      controlla('e strisciare non ha cambiato linguetta', await page.locator(`[data-bottega] [data-scheda="${s}"][aria-selected="true"]`).count() === 0)
    }
    await allaLinguetta(s)
    const qui = await page.locator('[data-casella-pezzo]').evaluateAll(els => els.map(e => ({ k: e.dataset.casellaPezzo, chiuso: /🔒/.test(e.querySelector('.sot-casella-segno')?.textContent || '') })))
    mostrati.push(...qui.map(q => q.k))
    // ogni linguetta ha un pezzo da mettersi subito e altri col 🔒 (docs/sotterraneo/livello-dei-pezzi.md)
    if (s !== 'energia') controlla(`la linguetta «${s}» ha almeno tre pezzi, uno che si mette subito`, qui.length >= 3 && qui.some(q => !q.chiuso), JSON.stringify(qui))
    col += qui.filter(q => q.chiuso).length
  }
  controlla('e dei pezzi da tenere per dopo, col 🔒', col > 0, String(col))
  uguale('il mago non vede armi o armature che non porta', mostrati.filter(k => COSE[k].famiglia && !mago.porta.includes(COSE[k].famiglia)).join(), '')
  uguale('né la ✋ di quello che non fa per lui, né «Hai già il meglio che ho»', await page.locator('[data-non-puoi], [data-banco-vuoto]').count(), 0)
})
await blocco('lo scettro, una riga avanti', async () => {
  const prezzo = prezzoAvanti(COSE.scettro.prezzo, 1)
  uguale('lo scettro sta al banco', await allaLinguettaDi(page, 'scettro', { tocca }), true)
  uguale('segnato come una riga avanti, ma acceso: niente lucchetto', `${await page.locator('[data-casella-pezzo="scettro"]').getAttribute('data-avanti')} ${await page.locator('[data-casella-pezzo="scettro"]').getAttribute('data-posso')}`, '1 1')
  controlla('col prezzo del doppio sotto', (await page.locator('[data-casella-pezzo="scettro"]').innerText()).includes(String(prezzo)), await page.locator('[data-casella-pezzo="scettro"]').innerText())
  await scegliNelBanco('[data-casella-pezzo="scettro"]', 'scettro')
  uguale('il prezzo alto lo dice il cartellino: niente riga che lo spiega', await page.locator('[data-avanti-costa], [data-quando]').count(), 0)
  uguale('il tasto compra, acceso', `${await testo('[data-azione="compra"]')} ${await page.locator('[data-azione="compra"]').isDisabled()}`, `Compra 💎 ${prezzo} false`)
  await toccaIl('[data-azione="compra"]')
  await gemmeA(250 - prezzo)
  uguale('si paga il prezzo alto', await gemmeBottega(), 250 - prezzo)
  uguale('e se ne va dalla vetrina', await page.locator('[data-casella-pezzo="scettro"]').count(), 0)
})
await blocco('un pezzo col 🔒 si compra, e nello zaino aspetta il suo livello', async () => {
  await allaLinguetta('bacchette')
  const chiusa = page.locator('[data-casella-pezzo]').filter({ has: page.locator('.sot-casella-segno', { hasText: '🔒' }) }).first()
  await chiusa.evaluate(el => el.scrollIntoView())
  const chiave = await chiusa.getAttribute('data-casella-pezzo')
  await scegliNelBanco(`[data-casella-pezzo="${chiave}"]`, chiave)
  controlla('il pannello dice «Serve livello N (hai M)»', /Serve livello \d+ \(hai \d+\)/.test(await page.locator('[data-serve]').innerText()), await page.locator('[data-serve]').innerText())
  const costo = await gemmeBottega()
  await toccaIl('[data-azione="compra"]')
  await page.waitForFunction(c => Number(document.querySelector('[data-gemme-bottega]').innerText.match(/\d+/)[0]) < c, costo, { timeout: 3000 }).catch(() => {})
  controlla('si paga', (await gemmeBottega()) < costo)
  await chiudiBanco()
  await apriLoZaino()
  await nelloZaino(`[data-tasca][data-cosa="${chiave}"]`, chiave)
  controlla('nello zaino il pezzo ha la nota 🔒 col livello', /Serve livello \d+ \(hai \d+\)/.test(await page.locator('[data-ancora-no]').innerText()), await page.locator('[data-ancora-no]').innerText())
  uguale('e niente tasto per indossarlo', await page.locator('[data-zaino] [data-azione="usa"]').count(), 0)
  await scatto(page, 'bottega-pezzo-col-lucchetto')
  await chiudiLoZaino()
})

/* ══════════ 5. la guaritrice, aperta dall'indirizzo (docs/core/comandi.md: `#bottega=`) ══════════
   cinque discese finite (ha tutte e quattro le cure) e sei cure di quattro stadi in tasca: due tasche al tetto di otto */
const ZAINO = ['pozione-piccola', 'pozione', 'pozione', 'pozione', 'pozione-grande', 'ampolla-vita']
await blocco('il banco della guaritrice', async () => {
  await sopraCon('cavaliere', 5, { v: 1, gemme: 2000, zaino: ZAINO, mano: null, mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 })
  await page.evaluate(z => { location.hash = `pensieri=no&bottega=erborista&gemme=2000&zaino=${z}`; location.reload() }, ZAINO.join(','))
  await page.waitForSelector('.carte', { timeout: 10000 })
  await scegli(page, 'sotterraneo')
  await page.waitForSelector('[data-bottega]', { timeout: 30000 })
  await finestraFerma(page)
  uguale('sul banco le quattro cure che si comprano, nell\'ordine degli stadi', (await page.locator('[data-casella-pezzo]').evaluateAll(es => es.map(e => e.dataset.casellaPezzo))).join(), CURE_IN_VENDITA.join())
  uguale('l\'ampolla della vita non c\'è', await page.locator('[data-casella-pezzo="ampolla-vita"]').count(), 0)
  uguale('le gemme dell\'eroe in vista', await gemmeBottega(), 2000)
  await scegliNelBanco('[data-casella-pezzo="ampolla-maggiore"]', 'ampolla-maggiore')
  controlla('un tocco sceglie, e il pannello dice quanto cura', (await page.locator('[data-pannello]').innerText()).includes(`+${COSE['ampolla-maggiore'].cura} vita, subito`), await page.locator('[data-pannello]').innerText())
  uguale('e quanto costa', await testo('[data-azione="compra"]'), `Compra 💎 ${COSE['ampolla-maggiore'].prezzo}`)
})
await blocco('al più otto cure: la nona non si compra', async () => {
  const p = COSE['ampolla-maggiore'].prezzo
  await toccaIl('[data-azione="compra"]')
  await gemmeA(2000 - p)
  uguale('la settima si compra', await gemmeBottega(), 2000 - p)
  uguale('e il tetto non si è ancora visto', await page.locator('[data-al-tetto]').count(), 0)
  await toccaIl('[data-azione="compra"]')
  await gemmeA(2000 - 2 * p)
  uguale('l\'ottava anche', await gemmeBottega(), 2000 - 2 * p)
  await scegliNelBanco('[data-casella-pezzo="pozione"]', 'pozione')
  await page.waitForSelector('[data-al-tetto]', { timeout: 3000 }).catch(() => {})
  controlla('con otto cure il banco dice «al massimo 8 pozioni»', /al massimo 8 pozioni/i.test(await page.locator('[data-al-tetto]').innerText().catch(() => '')))
  uguale('il tasto dice perché non si compra, ed è spento', `${await testo('[data-azione="compra"]')} ${await page.locator('[data-azione="compra"]').isDisabled()}`, `hai già ${POZIONI_MASSIME} pozioni true`)
  await page.locator('[data-azione="compra"]').click({ force: true })
  await attendi(page, 400)
  uguale('un tocco non compra la nona', await gemmeBottega(), 2000 - 2 * p)
  await scatto(page, 'bottega-tetto-pozioni')
  await chiudiBanco()
})
await blocco('lo zaino: quante cure, e l\'ampolla della vita', async () => {
  await apriLoZaino()
  uguale('lo zaino dice quante ne porta', await page.locator('[data-cure-zaino]').getAttribute('data-n'), String(POZIONI_MASSIME))
  controlla('«8/8»', (await page.locator('[data-cure-zaino]').innerText()).includes('8/8'), await page.locator('[data-cure-zaino]').innerText())
  await nelloZaino('[data-tasca][data-cosa="ampolla-vita"]', 'ampolla-vita')
  controlla('l\'ampolla della vita dice «tutta la vita»', (await page.locator('[data-zaino] [data-pannello]').innerText()).includes('tutta la vita'), await page.locator('[data-zaino] [data-pannello]').innerText())
  uguale('e il tetto per esteso', await page.locator('[data-cure-nota]').count(), 1)
  await chiudiLoZaino()
})

uguale('nessun errore in pagina', errori.join(' | '), '')
await browser.close()
riassunto('le botteghe di sopra e lo zaino, col dito')
