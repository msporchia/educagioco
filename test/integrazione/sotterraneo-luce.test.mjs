/* ═══════════════════════════════════════════════════════════════════
   LA LUCE A CONO, A SCHERMO

   (docs/sotterraneo/luce.md). Lo stesso piano, lo stesso punto: la luce è
   un cono davanti all'eroe e un alone corto attorno, l'ombra è dietro, e
   la torcia allunga il cono ma non accende la stanza. Si contano i pixel
   accesi della tela (un canvas buio non dà nessun errore) con la torcia,
   senza e agli sgoccioli, e si guarda che la luce segua il verso: dopo
   un passo a sinistra, quello che stava davanti (a destra) torna ricordo.
   `--scatti` lascia le foto: `sotterraneo-luce-con`, `-senza`,
   `-sgoccioli`, e `-voltato` (il passo indietro, con la torcia).
   `node test/esegui.mjs sotterraneo-luce`
   tempo: 60
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, scendiNelSotterraneo }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { T } from '../../src/giochi/sotterraneo/dati/mondo.js'

const SEME = 12   // la stanza dell'ingresso è di dieci per otto: si vede la forma del cono
const roba = torcia => ({ v: 1, gemme: 40, zaino: ['pozione'], mano: 'spada@6.r.att.fuoco.vita', mancina: 'scudo-legno@4',
                          corpo: 'panciotto@4', dito: null, torcia, torce: 0 })
const avventura = torcia => ({ tappa: 1, libera: false, stelle: { 0: 3 }, missioni: {}, roba: roba(torcia),
  terra: { nebbia: 'f'.repeat(768), dove: [55, 11], parlato: true } })

const browser = await apriBrowser()

/* quanti campioni della tela sono accesi, e quanto; `avanti` è la striscia a più di due celle e mezza a destra
   dell'eroe, sulla sua riga (±1 cella e mezza): lì arriva il cono quando guarda a destra */
const misura = page => page.evaluate(T => {
  const c = document.querySelector('.sot-tela')
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
  const r = c.width / c.getBoundingClientRect().width   // data-eroe-schermo è in pixel CSS, la tela in pixel suoi
  const [ex, ey] = c.dataset.eroeSchermo.split(',').map(v => Number(v) * r)
  const s = Number(c.dataset.scala) * T * r
  let n = 0, luce = 0, avanti = 0
  for (let y = 0; y < c.height; y += 2) for (let x = 0; x < c.width; x += 2) {
    const i = (y * c.width + x) * 4
    const v = Math.max(d[i], d[i + 1], d[i + 2])
    if (y % 4 === 0 && x % 4 === 0 && v > 24) { n++; luce += v }
    if (x > ex + 2.5 * s && Math.abs(y - ey) < 1.5 * s) avanti += v
  }
  return { n, luce, avanti }
}, T)

async function campo(torcia, nome, { voltati = false } = {}) {
  const { page, errori } = await apriGioco(browser)
  await azzera(page)
  await semina(page, {
    coins: 300, settings: { sperimentali: true },
    campagne: { sotterraneo: { tappa: 1, libera: false, stelle: { 0: 3 },
      cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: avventura(torcia) } } } },
  })
  await scegli(page, 'sotterraneo')
  await page.waitForSelector('[data-terra]', { timeout: 5000 })
  await page.evaluate(s => { location.hash = `seme=${s}&piano=1` }, SEME)
  await scendiNelSotterraneo(page, 0)
  await page.waitForSelector('.sot-tela', { timeout: 5000 })
  await attendi(page, 900)
  const prima = await misura(page)
  await scatto(page, nome)
  let dopo = null
  if (voltati) {
    // un passo a sinistra: il verso diventa quello, e la luce con lui
    const tela = page.locator('.sot-tela')
    const b = await tela.boundingBox()
    const [sx, sy] = (await tela.getAttribute('data-eroe-schermo')).split(',').map(Number)
    const s = Number(await tela.getAttribute('data-scala')) * T
    await page.mouse.click(b.x + sx - s, b.y + sy)   // data-eroe-schermo è in pixel CSS, come il riquadro
    for (let i = 0; i < 20; i++) {
      const c1 = await tela.getAttribute('data-eroe')
      await attendi(page, 200)
      if (c1 === await tela.getAttribute('data-eroe')) break
    }
    await attendi(page, 300)
    dopo = await misura(page)
    await scatto(page, `${nome}-voltato`)
  }
  return { ...prima, dopo, errori }
}

const con = await campo(12, 'sotterraneo-luce-con', { voltati: true })
const senza = await campo(0, 'sotterraneo-luce-senza')
const sgoccioli = await campo(1, 'sotterraneo-luce-sgoccioli')   // l'ultima stanza della torcia
nota(`campioni accesi con la torcia ${con.n} (luce ${con.luce}), agli sgoccioli ${sgoccioli.n}, senza ${senza.n} (luce ${senza.luce})`)
nota(`la striscia davanti (a destra): con la torcia ${con.avanti}, voltati ${con.dopo && con.dopo.avanti}`)
controlla('anche senza torcia qualcosa si vede', senza.n > 100, `${senza.n} campioni accesi`)
controlla('senza torcia si vede meno: il cono è corto', senza.n < con.n * 0.8, `${senza.n} contro ${con.n}`)
controlla('e la scena è più buia', senza.luce < con.luce * 0.7, `${senza.luce} contro ${con.luce}`)
controlla('agli sgoccioli il cono si accorcia: si vede più che al buio e meno che con la torcia piena',
          sgoccioli.n > senza.n && sgoccioli.n < con.n, `${senza.n} < ${sgoccioli.n} < ${con.n}`)
controlla('la luce segue il verso: voltando le spalle a quello che si vedeva, resta solo il ricordo',
          con.dopo && con.dopo.avanti < con.avanti * 0.75, `${con.avanti} → ${con.dopo && con.dopo.avanti}`)
uguale('nessun errore in console', [...con.errori, ...senza.errori, ...sgoccioli.errori].join(' · '), '')

await browser.close()
riassunto('la luce a cono, a schermo')
