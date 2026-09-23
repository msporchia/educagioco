/* ═══════════════════════════════════════════════════════════════════
   LE NOVITÀ PER I BAMBINI — dal nastro in home al «Letto»

   Il filo è quello vero: un bambino che giocava già prima che le novità
   esistessero apre la home, trova il nastro con la notizia più fresca,
   entra, legge, preme «Letto» — e da lì il nastro non torna, nemmeno
   ricaricando. Poi la stessa casa con un gioco spento da un grande: le
   righe di quel gioco non gli arrivano, né nel nastro né nella pagina.

   Le righe vere cambiano (`guide/novita-bambini.js`), quindi il test non
   ne nomina nessuna: legge quelle a schermo e controlla che rispettino
   la regola.
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, semina, azzera, scatto, leggiProfilo } from '../aiuto/browser.mjs'
import { NOVITA, ULTIMA, PER_GIOCO } from '../../src/guide/novita-bambini.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

const NASTRO = '[data-nastro="novita"]'
const leggiPagina = () => page.evaluate(() =>
  [...document.querySelectorAll('[data-novita-gioco]')].map(s => ({
    gioco: s.dataset.novitaGioco,
    righe: [...s.querySelectorAll('[data-novita]')].map(li => ({
      id: Number(li.dataset.novita), testo: li.querySelector('.frase').textContent.trim() })),
  })))

if (!NOVITA.length) {
  nota('nessuna novità in `guide/novita-bambini.js`: si controlla solo che il nastro taccia')
  controlla('senza novità in home non c\'è nessun nastro', !(await page.isVisible(NASTRO)))
} else {
  /* ── 1. il nastro, in home ──
     Il profilo di prova non ha mai scritto il segno: è un bambino di
     ieri, e le novità le vede. */
  await page.waitForSelector(NASTRO, { timeout: 5000 })
  const nelNastro = await page.textContent(NASTRO)
  await scatto(page, 'novita-home')

  /* ── 2. la pagina ── */
  await page.click(NASTRO)
  await page.waitForSelector('[data-novita-pagina]', { timeout: 5000 })
  const pagina = await leggiPagina()
  controlla('dentro c\'è almeno un gioco con le sue righe', pagina.length > 0)
  controlla(`nessun gioco ha più di ${PER_GIOCO} righe`,
            pagina.every(g => g.righe.length >= 1 && g.righe.length <= PER_GIOCO),
            JSON.stringify(pagina.map(g => [g.gioco, g.righe.length])))
  controlla('dentro ogni gioco, dalla più fresca',
            pagina.every(g => g.righe.every((r, i) => i === 0 || r.id < g.righe[i - 1].id)))
  const fresca = pagina[0].righe[0]
  controlla('il nastro diceva già la più fresca', nelNastro.includes(fresca.testo),
            `nastro «${nelNastro}», pagina «${fresca.testo}»`)
  uguale('e la più fresca è l\'ultima dell\'elenco, se il gioco ce l\'ha in home',
         fresca.id, Math.max(...pagina.flatMap(g => g.righe.map(r => r.id))))
  await scatto(page, 'novita-pagina')

  /* ── 3. «Letto» ── */
  await page.click('[data-azione="novita-letto"]')
  await page.waitForSelector('.carte', { timeout: 5000 })
  controlla('«Letto» riporta ai giochi, e il nastro non c\'è più', !(await page.isVisible(NASTRO)))
  uguale('il segno è sul profilo, all\'ultima', (await leggiProfilo(page))?.settings?.novitaLette, ULTIMA)
  await page.reload()
  await page.waitForSelector('.carte', { timeout: 10000 })
  controlla('e ricaricando non torna', !(await page.isVisible(NASTRO)))

  /* ── 4. un gioco spento da un grande ──
     Si torna indietro col segno e si spegne il gioco della riga più
     fresca: se la pagina lo mostrasse, un bambino leggerebbe di un
     gioco che in home non trova. */
  const conGioco = pagina.find(g => g.gioco !== 'tutti')
  if (!conGioco) nota('nessuna novità legata a un gioco: il filtro non ha niente da togliere')
  else {
    const profilo = await leggiProfilo(page)
    await semina(page, { settings: { ...profilo.settings, novitaLette: 0,
                                     giochi: { ...(profilo.settings.giochi || {}), [conGioco.gioco]: false } } })
    const rimasti = pagina.filter(g => g !== conGioco)
    if (!rimasti.length) {
      controlla(`spento «${conGioco.gioco}» non resta niente: nessun nastro`, !(await page.isVisible(NASTRO)))
    } else {
      await page.waitForSelector(NASTRO, { timeout: 5000 })
      await page.click(NASTRO)
      await page.waitForSelector('[data-novita-pagina]', { timeout: 5000 })
      const dopo = await leggiPagina()
      controlla(`spento «${conGioco.gioco}», le sue righe non si leggono più`,
                !dopo.some(g => g.gioco === conGioco.gioco))
      uguale('e gli altri giochi restano', dopo.length, rimasti.length)
    }
  }
}

controlla('nessun errore in console', errori.length === 0, errori.join(' · '))
riassunto('Le novità per i bambini, dal nastro al «Letto»')
await browser.close()
