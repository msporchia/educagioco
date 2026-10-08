/* La nave madre, i suoi pacchi e l'hangar degli asteroidi, nel browser.
   Vedi docs/asteroidi/boss.md e docs/asteroidi/hangar.md.
   `node test/esegui.mjs asteroidi-hangar` */
import { apriBrowser, apriGioco, azzera, semina, scegli, parti, scatto, leggiProfilo, attendi, TELEFONO }
  from '../aiuto/browser.mjs'
import { SCALETTA } from '../../src/data/asteroidi.js'
import { regaliDellaTappa, REGALI_VOLO, tipoDi, idDi } from '../../src/data/hangar.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { viewport: TELEFONO })
await azzera(page)
await semina(page, { mate: { tappa: 10, fila: SCALETTA.length, libera: true }, settings: { eta: 11 } })
await scegli(page, 'mate')
await page.waitForSelector('[data-rotta]', { timeout: 5000 })

const hangar = async () => ((await leggiProfilo(page)).campagne?.mate?.hangar) || {}

/* si risponde sempre giusto, finché `basta` non dice di fermarsi */
const gioca = basta => page.evaluate(async basta => {
  const m = window.__mate, specie = new Set()
  const stop = new Function('m', 'return ' + basta)
  for (let i = 0; i < 300 && m.fase.value === 'gioco' && !stop(m); i++) {
    const giusto = m.asteroidi().find(x => x.ok && !x.morto)
    if (!giusto) break
    specie.add(giusto.specie)
    m.colpisci(giusto)
    await new Promise(r => setTimeout(r, 12))
  }
  return { fase: m.fase.value, madre: m.madre(), specie: [...specie], livello: m.hud.livello }
}, basta)

/* ---------- 1. sulla rotta: il tasto dell'hangar e i pacchi ---------- */
controlla('col volo aperto c\'è il tasto dell\'hangar', await page.locator('[data-azione="hangar"]').isVisible())
const piene = await page.locator('[data-pacchi][data-quanti="2"]').count()
controlla('le tappe aperte hanno due pacchi', piene >= 15, `${piene} tappe con due pacchi`)

/* ---------- 2. una tappa: la nave madre in fondo, e il pacco ---------- */
const POS = 5
const tappa = SCALETTA[POS]
for (let giro = 0; giro < 3; giro++) {
  await parti(page, `[data-tappa="${POS}"]`)
  await page.waitForTimeout(300)
  if (giro === 0) {
    const a = await gioca('m.madre().colpi >= 1')
    controlla('a bersaglio fatto arriva la nave madre', a.madre.attiva && a.madre.chiamata)
    controlla('e tira bombe', a.specie.includes('bomba'), a.specie.join(', '))
    await attendi(page, 700)
    await scatto(page, 'asteroidi-madre')
  }
  const fine = await gioca('false')
  uguale(`giro ${giro + 1}: la tappa è vinta`, fine.fase, 'vinta')
  const regalo = await page.locator('[data-regalo]').getAttribute('data-pezzo').catch(() => null)
  if (giro < 2) {
    uguale(`giro ${giro + 1}: la nave madre lascia il ${giro + 1}° pacco della tappa`, regalo,
           regaliDellaTappa(POS)[giro])
    if (giro === 0) { await attendi(page, 900); await scatto(page, 'asteroidi-regalo') }
  } else {
    uguale('al terzo giro niente pacco', regalo, null)
    controlla('e il cartello lo dice', await page.locator('[data-pacchi-finiti]').isVisible())
  }
  await page.click('.velo .bottone.chiaro')            // «Mappa»
  await page.waitForSelector('[data-rotta]')
  if (giro === 0) {
    uguale('sulla rotta la tappa ha un pacco in meno',
           await page.locator(`[data-pacchi-di="${POS}"]`).getAttribute('data-quanti'), '1')
    uguale('e il tasto dell\'hangar dice che c\'è un pezzo nuovo',
           (await page.locator('[data-azione="hangar"] [data-nuovi]').innerText()).trim(), '1')
  }
}
uguale('vinta tre volte, la tappa non ha più pacchi',
       await page.locator(`[data-pacchi-di="${POS}"]`).count(), 0)
const h1 = await hangar()
uguale('due pezzi presi, e non di più', (h1.presi || []).length, 2)
uguale('e le vittorie della tappa sono contate', h1.vinte?.[tappa.tipo === 'mente' ? 'm' + tappa.i : 'p' + tappa.i], 2)

/* ---------- 3. l'hangar ---------- */
await page.click('[data-azione="hangar"]')
await page.waitForSelector('[data-hangar]')
const primo = regaliDellaTappa(POS)[0]
const linguetta = { t: 'scafo', d: 'disegno', s: 'stemma' }[tipoDi(primo)]
controlla('la linguetta del pezzo nuovo ha il pallino',
          await page.locator(`[data-linguetta="${linguetta}"] [data-nuovo]`).count() === 1)
await page.click(`[data-linguetta="${linguetta}"]`)
uguale('il pezzo vinto si può scegliere',
       await page.locator(`[data-scelta="${primo}"]`).getAttribute('data-preso'), '1')
uguale('e il pezzo pure', await page.locator(`[data-scelta="${primo}"] [data-nuovo]`).count(), 1)
await page.click(`[data-scelta="${primo}"]`)
await page.click('[data-linguetta="scafo"]')
controlla('un colore non preso ha il lucchetto', await page.locator('[data-scelta="t:oro"]').isDisabled())
await page.click('[data-scelta="t:rosso"]')
await attendi(page, 500)
await scatto(page, 'asteroidi-hangar')
const nave = (await hangar()).nave || {}
uguale('la scelta resta', nave.scafo, 'rosso')
uguale('anche quella del pezzo vinto', nave[linguetta], idDi(primo))
await page.click('[data-hangar] [data-chiudi]')
uguale('chiuso l\'hangar, niente più di nuovo', await page.locator('[data-azione="hangar"] [data-nuovi]').count(), 0)

/* ---------- 4. il volo: un posto per livello, e la nave madre al terzo ---------- */
await parti(page, '[data-volo]')
await page.waitForTimeout(300)
const volo = await gioca('!!m.regaloVolo.value')
uguale('al livello 3 la nave madre del volo lascia un pacco',
       await page.locator('[data-regalo-volo] [data-regalo]').getAttribute('data-pezzo'), REGALI_VOLO[0].p)
controlla('il volo comincia dal primo posto della storia', volo.specie[0] === 'rottami', volo.specie.join(', '))
await attendi(page, 900)
await scatto(page, 'asteroidi-volo-regalo')
await page.click('[data-regalo-volo] [data-azione="avanti"]')
uguale('«Avanti» lo chiude', await page.locator('[data-regalo-volo]').count(), 0)
uguale('e il pacco è nell\'hangar', (await hangar()).voloMax, 3)
const dopo = await gioca('m.hud.livello >= 4 && m.asteroidi().some(a => !a.morto && a.specie === "ghiaccio")')
controlla('al livello 4 si è al pianeta del 10, fra le comete', dopo.livello >= 4 && dopo.fase === 'gioco')
await attendi(page, 1200)
await scatto(page, 'asteroidi-volo-ghiaccio')

uguale('nessun errore in console', errori.length, 0, errori.join(' | '))
await browser.close()
riassunto('asteroidi — la nave madre e l\'hangar')
