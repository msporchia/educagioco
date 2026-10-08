/* ═══════════════════════════════════════════════════════════════════
   LA TORCIA CONTA, A SCHERMO

   (docs/sotterraneo/regole.md, «La luce»). Lo stesso piano, lo stesso
   punto: con la torcia la stanza dell'ingresso è accesa tutta e il
   raggio è lungo; senza si vede solo un cerchio attorno all'eroe, e la
   scena è visibilmente più buia. Si contano i pixel accesi della tela
   (un canvas buio non dà nessun errore) e si lasciano i due scatti
   (`--scatti`: `sotterraneo-luce-senza`, `-con`, `-sgoccioli`).
   `node test/esegui.mjs sotterraneo-luce`
   tempo: 60
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, scendiNelSotterraneo }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'

const SEME = 5
const roba = torcia => ({ v: 1, gemme: 40, zaino: ['pozione'], mano: 'spada@6.r.att.fuoco.vita', mancina: 'scudo-legno@4',
                          corpo: 'panciotto@4', dito: null, torcia, torce: 0 })
const avventura = torcia => ({ tappa: 1, libera: false, stelle: { 0: 3 }, missioni: {}, roba: roba(torcia),
  terra: { nebbia: 'f'.repeat(768), dove: [55, 11], parlato: true } })

const browser = await apriBrowser()

/* il campo dell'ingresso del piano 1, con quella torcia: quanti campioni della tela sono accesi, e quanto */
async function campo(torcia, nome) {
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
  const misura = await page.evaluate(() => {
    const c = document.querySelector('.sot-tela')
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
    let n = 0, luce = 0
    for (let i = 0; i < d.length; i += 160) { const v = Math.max(d[i], d[i + 1], d[i + 2]); if (v > 24) { n++; luce += v } }
    return { n, luce }
  })
  await scatto(page, nome)
  return { ...misura, errori }
}

const con = await campo(12, 'sotterraneo-luce-con')
const senza = await campo(0, 'sotterraneo-luce-senza')
const sgoccioli = await campo(1, 'sotterraneo-luce-sgoccioli')   // l'ultima stanza della torcia
nota(`campioni accesi con la torcia ${con.n} (luce ${con.luce}), agli sgoccioli ${sgoccioli.n}, senza ${senza.n} (luce ${senza.luce})`)
controlla('anche senza torcia qualcosa si vede', senza.n > 100, `${senza.n} campioni accesi`)
controlla('senza torcia si vede molto meno: la stanza non si accende tutta', senza.n < con.n * 0.7, `${senza.n} contro ${con.n}`)
controlla('e la scena è più buia', senza.luce < con.luce * 0.6, `${senza.luce} contro ${con.luce}`)
controlla('agli sgoccioli il raggio si stringe: si vede più che al buio e meno che con la torcia piena',
          sgoccioli.n > senza.n && sgoccioli.n < con.n, `${senza.n} < ${sgoccioli.n} < ${con.n}`)
uguale('nessun errore in console', [...con.errori, ...senza.errori, ...sgoccioli.errori].join(' · '), '')

await browser.close()
riassunto('la torcia conta, a schermo')
