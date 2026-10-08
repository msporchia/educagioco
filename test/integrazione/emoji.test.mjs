/* ═══════════════════════════════════════════════════════════════════
   LE EMOJI SONO NOSTRE, A SCHERMO

   `unita/emoji` dice che il font ha tutte le emoji; qui si guarda che
   Chrome le disegni davvero con quello e non con il font del telefono. Il
   modo: l'emoji di Twemoji è larga esattamente un em, quella di Noto
   Color Emoji un quarto di più, una famiglia spezzata due em. Misurare
   la larghezza di ogni emoji usata dice, per ognuna, chi l'ha disegnata.
   Perché e come: docs/core/emoji.md.
   ═══════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'node:fs'
import { apriBrowser, apriGioco, scatto, TELEFONO } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { ELENCO } from '../../strumenti/emoji/lib.mjs'

const elenco = JSON.parse(readFileSync(ELENCO, 'utf8')).emoji
const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { viewport: TELEFONO })

console.log('\nIL FONT È CARICATO QUANDO LA HOME COMPARE')
{
  const stato = await page.evaluate(() => ({
    caricato: document.fonts.check('16px "Emoji Gioco"', '🐰'),
    facce: [...document.fonts].filter(f => f.family.replace(/["']/g, '') === 'Emoji Gioco').map(f => f.status),
  }))
  controlla('document.fonts.check dice di sì', stato.caricato)
  uguale('una faccia, caricata', stato.facce.join(), 'loaded')
}

console.log('\nOGNI EMOJI USATA VIENE DAL NOSTRO FONT')
{
  const male = await page.evaluate(emoji => {
    const fuori = []
    const prova = document.createElement('div')
    prova.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;white-space:nowrap;font:100px "Emoji Gioco"'
    document.body.appendChild(prova)
    for (const e of emoji) {
      prova.textContent = e
      const w = prova.getBoundingClientRect().width
      if (Math.abs(w - 100) > 1) fuori.push(`${e} ${Math.round(w)}`)
    }
    prova.remove()
    return fuori
  }, elenco)
  controlla(`le ${elenco.length} emoji sono larghe un em, come le fa Twemoji`, male.length === 0,
    `${male.length} no: ${male.slice(0, 10).join(', ')}`)
}

console.log('\nLE TELE LE DISEGNANO COL NOSTRO FONT')
{
  const r = await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = c.height = 80
    const x = c.getContext('2d', { willReadFrequently: true })
    x.font = '50px "Emoji Gioco", system-ui, sans-serif'
    const larga = x.measureText('🐰').width
    x.textBaseline = 'middle'; x.fillText('🐰', 5, 40)
    const d = x.getImageData(0, 0, 80, 80).data
    let pieni = 0
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) pieni++
    // senza il nostro font la stessa scritta cade su quello del telefono
    x.font = '50px system-ui, sans-serif'
    return { larga, pieni, delTelefono: x.measureText('🐰').width }
  })
  uguale('un coniglio su una tela è largo un em', Math.round(r.larga), 50)
  controlla('e c\'è qualcosa di disegnato', r.pieni > 1000, `${r.pieni} pixel`)
  nota(`col font del telefono sarebbe largo ${Math.round(r.delTelefono)}`)
}

console.log('\nNIENTE ERRORI')
uguale('nessun errore in console', errori.length, 0)

await scatto(page, 'emoji-home')
await browser.close()
riassunto('EMOJI NEL BROWSER')
