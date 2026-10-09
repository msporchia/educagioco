/* ═══════════════════════════════════════════════════════════════════
   LE ZONE E IL PALLINO COLORATO, COL DITO

   (docs/sotterraneo/zone.md)
   1. Nella storia, un cavaliere al livello 1 con la torre aperta: il
      pallino della cripta è verde, quello della scalinata arancio,
      quello della torre rosso, e davanti alla torre c'è la guardia.
      Toccando la torre la guardia lo ferma: niente «scendo».
   2. Finita la storia, al livello 14: il minatore ha il «!», la riga in
      fondo dice che ha una notizia e la zona nuova pulsa; toccato, dice
      cosa è cambiato e racconta la zona nata per ultima (la scalinata,
      superata al 14 e rinata 20–23), e il «!» si spegne. I colori sono
      quelli delle fasce (due grigie, due verdi, due arancio, la rossa
      con la sentinella); la verde ha il suo nome e «livello 12–15». Si
      scende nella torre: cinque piani, «livello 12» sotto il campo, la
      sosta scrive la potenza; quel piano, rifatto dal seme, ha i mostri
      di una zona del 12.
   Si tocca come un bambino (`Input.dispatchTouchEvent` via CDP).
   `node test/esegui.mjs sotterraneo-zone`
   tempo: 150
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, leggiProfilo, camminaVerso, nelDialogo }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { POSTI, MINATORE } from '../../src/giochi/sotterraneo/dati/terra-mappa.js'
import { POSTO_DI } from '../../src/giochi/sotterraneo/dati/terra.js'
import { VOLTI, PRIMA_NOTIZIA, zonaPotenziata } from '../../src/giochi/sotterraneo/dati/zone.js'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { robaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'
import { robaAttesaA, crescitaAttesaA } from '../../src/giochi/sotterraneo/motore/zone.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'

const TORRE = CAMPAGNA.findIndex(t => t.chiave === 'torre')
const tutte = Object.fromEntries(CAMPAGNA.map((_, k) => [k, 3]))
const profilo = avventura => ({
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: avventura.tappa, libera: avventura.libera, stelle: avventura.stelle,
    cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: { missioni: {}, ...avventura } } } } },
})

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
const cdp = await page.context().newCDPSession(page)
async function tocca(x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
async function toccaIl(sel) {
  const b = await page.locator(sel).first().boundingBox()
  await tocca(b.x + b.width / 2, b.y + b.height / 2)
}
const vaiA = meta => camminaVerso(page, meta, { tocca })
const pallino = nome => page.locator(`[data-pallino="${nome}"]`)
async function apriIlPosto(chiave) {
  const nome = POSTO_DI[chiave]
  // sotto carico un tocco può cadere mentre la vista ancora scorre: si riprova, come farebbe un bambino
  for (let n = 0; n < 3 && !(await page.locator(`[data-fumetto-di="${nome}"]`).count()); n++) {
    await vaiA(POSTI[nome].piede)
    await toccaIl(`[data-posto="${nome}"]`)
    await page.waitForSelector(`[data-fumetto-di="${nome}"]`, { timeout: 8000 }).catch(() => {})
  }
  await page.waitForSelector(`[data-fumetto-di="${nome}"]`, { timeout: 2000 })
  await attendi(page, 300)
}

/* ---------- 1. nella storia: la torre è rossa, e la guardia non fa scendere ---------- */
await semina(page, profilo({ tappa: TORRE, libera: false, stelle: { 0: 3, 1: 3 }, roba: robaAttesa('cavaliere', TORRE),
                             crescita: { esp: 0 },
                             terra: { nebbia: 'f'.repeat(768), dove: POSTI[POSTO_DI.torre].piede, parlato: true } }))
await scegli(page, 'sotterraneo')
await page.waitForSelector('[data-terra]', { timeout: 5000 })
await attendi(page, 600)
uguale('la cripta, al livello 1, è verde', await pallino('altare').getAttribute('data-colore'), 'verde')
uguale('la scalinata è arancio: un gradino sopra', await pallino('arco').getAttribute('data-colore'), 'arancio')
uguale('la torre è rossa: due gradini sopra', await pallino('torre').getAttribute('data-colore'), 'rosso')
uguale('davanti alla torre c\'è la guardia', await page.locator('[data-guardia="torre"] svg').count(), 1)
uguale('una sola: davanti alle altre no', await page.locator('[data-guardia]').count(), 1)
await toccaIl('[data-posto="torre"]')
await page.waitForSelector('[data-fumetto-di="torre"]', { timeout: 8000 })
await attendi(page, 300)
uguale('la guardia lo ferma', await page.locator('[data-fumetto] [data-ferma]').count(), 1)
controlla('e lo dice', /troppo pericoloso/.test(await page.locator('[data-ferma]').innerText()))
uguale('niente «scendo»', await page.locator('[data-fumetto] [data-azione="scendi"]').count(), 0)
uguale('il fumetto dice il livello della torre', await page.locator('[data-livello-zona]').getAttribute('data-livello'), '3')
await scatto(page, 'zone-guardia')

/* ---------- 2. finita la storia, al livello 14: la notizia, le fasce, e giù in una zona ---------- */
// al 14: la grotta (8–11) e la botola (10–13) grigie, la torre (12–15) e la miniera (14–17) verdi, la scala sommersa
// (16–19) e la cripta (18–21) arancio, e la scalinata, superata al 14, rinata rossa: 20–23, col nome della seconda volta
await semina(page, profilo({ tappa: CAMPAGNA.length, libera: true, stelle: tutte, roba: robaAttesaA('cavaliere', 14),
                             crescita: crescitaAttesaA('cavaliere', 14),
                             terra: { nebbia: 'f'.repeat(768), dove: MINATORE.accanto, parlato: true } }))
await scegli(page, 'sotterraneo')
await page.waitForSelector('[data-terra]', { timeout: 5000 })
await attendi(page, 600)
uguale('il minatore ha il «!»: una notizia', await page.locator('[data-minatore] [data-segno-di="annuncio"]').count(), 1)
controlla('e la riga in fondo lo dice', /notizia/.test(await page.locator('.sot-terra-sotto').innerText()))
controlla('la zona nuova pulsa', /sot-adesso/.test(await pallino('arco').getAttribute('class')))
await toccaIl('[data-minatore]')
await page.waitForSelector('[data-dialogo="minatore"] [data-annuncio]', { timeout: 8000 })
const detto = await page.locator('[data-dialogo] [data-annuncio]').innerText()
controlla('la prima volta dice cosa è cambiato', PRIMA_NOTIZIA.startsWith(detto.slice(0, 40)), detto)
await scatto(page, 'zone-annuncio')
await nelDialogo(page, '[data-scelta="ciao"]')
await attendi(page, 600)
uguale('sentito, il «!» si spegne', await page.locator('[data-minatore] [data-segno-di="annuncio"]').count(), 0)
uguale('e l\'avventura lo ricorda', (await leggiProfilo(page))?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.zone?.sentita, 'cantine:20')
controlla('e la zona nuova non pulsa più', !/sot-adesso/.test(await pallino('arco').getAttribute('class')))

for (const [k, colore] of [['gallerie', 'grigio'], ['labirinto', 'grigio'], ['torre', 'verde'], ['fondo', 'verde'],
                           ['cisterna', 'arancio'], ['altare', 'arancio'], ['cantine', 'rosso']])
  uguale(`${k}: ${colore}`, await pallino(POSTO_DI[k]).getAttribute('data-colore'), colore)
uguale('una sola guardia, davanti alla scalinata', await page.locator('[data-guardia]').count(), 1)
uguale('alla scalinata', await page.locator('[data-guardia="arco"] svg').count(), 1)

await apriIlPosto('cantine')
controlla('la rossa ha il nome della seconda volta', (await page.locator('[data-fumetto]').innerText()).includes(VOLTI.cantine[1].nome))
uguale('e la sua fascia', await page.locator('[data-livello-zona]').getAttribute('data-fascia'), '20-23')
uguale('la sentinella non fa scendere', await page.locator('[data-fumetto] [data-ferma]').count(), 1)
uguale('niente «scendo»', await page.locator('[data-fumetto] [data-azione="scendi"]').count(), 0)
await scatto(page, 'zone-rossa')

await apriIlPosto('gallerie')
uguale('nel fumetto di una grigia qualcuno lo dice', await page.locator('[data-detto-colore="grigio"]').count(), 1)
uguale('ma si può scendere', await page.locator('[data-fumetto] [data-azione="scendi"]').count(), 1)

await apriIlPosto('torre')
controlla('la verde ha il suo nome', (await page.locator('[data-fumetto]').innerText()).includes(VOLTI.torre[0].nome))
uguale('e la sua fascia', await page.locator('[data-livello-zona]').getAttribute('data-fascia'), '12-15')
controlla('scritta «livello 12–15»', /livello 12–15/.test(await page.locator('[data-livello-zona]').innerText()))
controlla('cinque piani', /5 piani/.test(await page.locator('[data-fumetto]').innerText()))
uguale('niente da dire', await page.locator('[data-fumetto] [data-detto-colore]').count(), 0)
await scatto(page, 'zone-verde')
await toccaIl('[data-fumetto] [data-azione="scendi"]')
await page.waitForSelector('.sot-tela', { timeout: 8000 })
await attendi(page, 900)
uguale('giù, sotto il campo: livello 12', await page.locator('.sot-piede').getAttribute('data-livello-posto'), '12')
controlla('piano 1 di 5', /piano 1 di 5/.test(await page.locator('.sot-piede').innerText()), await page.locator('.sot-piede').innerText())
uguale('il titolo è quello della zona', (await page.locator('.barra').innerText().catch(() => '')).includes(VOLTI.torre[0].nome) ||
       (await page.locator('body').innerText()).includes(VOLTI.torre[0].nome), true)
await scatto(page, 'zone-giu')
await toccaIl('button[aria-label="indietro"]')
await attendi(page, 800)
{
  const s = (await leggiProfilo(page))?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.sosta
  uguale('uscendo, la sosta scrive la potenza', s?.potenza, 12)
  uguale('della torre', s?.tappa, TORRE)
  // il piano di quella sosta, rifatto dal seme: i mostri sono quelli di una zona del 12, non della torre di allora
  const zona = new Corsa(zonaPotenziata(TORRE, 12), { seme: s.seme, eroe: 'cavaliere' })
  const storia = new Corsa(CAMPAGNA[TORRE], { seme: s.seme, eroe: 'cavaliere' })
  const ossa = c => c.livello.robe.filter(r => r.che === 'mostro').map(r => r.ossa)
  uguale('le cose del piano tornano', zona.livello.robe.length, s.robe.n)
  controlla('e i mostri hanno le ossa di una zona del 12', Math.max(...ossa(zona)) > 2 * Math.max(...ossa(storia)),
            `${Math.max(...ossa(zona))} contro ${Math.max(...ossa(storia))}`)
  nota(`seme ${s.seme}: ossa ${ossa(zona).join(' ')}`)
}

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('le zone col dito')
