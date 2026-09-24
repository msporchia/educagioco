/* ═══════════════════════════════════════════════════════════════════
   LA PAGINA DEI TRUCCHI (`#admin`)

   I cheat di casa, uno per tasto: la pagina non fa niente di suo, scrive
   nell'indirizzo il cheat che esiste già e porta dove si legge. Qui si
   prova che la strada regga per davvero:
     · `#admin` apre la pagina, senza codice;
     · un tasto delle monete le fa arrivare, e si resta lì;
     · il bambino di prova nasce e diventa quello attivo **restando
       sulla pagina** — cambiare bambino altrove riporta in home;
     · un tasto della fattoria porta dentro la fattoria di prova;
     · gli interruttori scrivono nel profilo del bambino attivo.

   `node test/esegui.mjs admin`
   tempo: 60
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, leggiProfilo, scatto, attendi } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { Fattoria } from '../../src/giochi/fattoria/motore/fattoria.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { hash: 'admin', attesa: '[data-admin]' })
await attendi(page, 400)

/* ── 1. la pagina c'è, e ha i suoi tasti ── */
controlla('#admin apre la pagina dei trucchi', await page.locator('[data-admin]').count() > 0)
controlla('con i trucchi', await page.locator('[data-trucco]').count() >= 12,
          `${await page.locator('[data-trucco]').count()} tasti`)
controlla('e un tasto per ogni gioco', await page.locator('[data-apri="fattoria"]').count() > 0)
await scatto(page, 'admin')

/* ── 2. le monete ── */
const prima = (await leggiProfilo(page))?.coins || 0
await page.locator('[data-trucco="monete=500"]').click()
await attendi(page, 700)
const dopo = (await leggiProfilo(page))?.coins || 0
controlla('+500 le fa arrivare', dopo - prima >= 500, `da ${prima} a ${dopo}`)
controlla('e si resta sulla pagina', await page.locator('[data-admin]').count() > 0)

/* ── 3. il bambino di prova ── */
await page.locator('[data-azione="bambino-prova"]').click()
await page.waitForSelector('[data-admin] [data-giocatore].ora', { timeout: 5000 })
await attendi(page, 500)
uguale('il bambino di prova è quello attivo',
       (await page.locator('[data-giocatore].ora').innerText()).trim(), 'Prova')
controlla('cambiando bambino si resta sulla pagina', await page.locator('[data-admin]').count() > 0)
const prova = await page.locator('[data-giocatore].ora').getAttribute('data-giocatore')

/* un secondo tocco ci torna, non ne fa un altro */
await page.locator('[data-azione="bambino-prova"]').click()
await attendi(page, 500)
uguale('e non se ne fanno due', await page.locator('[data-giocatore]', { hasText: 'Prova' }).count(), 1)

/* ── 4. gli interruttori ── */
await page.locator('[data-azione="sperimentali"]').click()
await attendi(page, 500)
uguale('i giochi in prova si accendono per il bambino attivo',
       (await leggiProfilo(page, prova))?.settings?.sperimentali, true)
controlla('e la leva lo dice', await page.locator('[data-azione="sperimentali"].acceso').count() === 1)

/* ── 5. la fattoria di prova, da un tasto ── */
await page.locator('[data-trucco="fattoria-tipo=10"]').click()
await page.waitForSelector('.fa-tela', { timeout: 8000 })
await attendi(page, 900)
await scatto(page, 'admin-fattoria-10')
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('.carte', { timeout: 5000 })
await attendi(page, 400)
const stato = (await leggiProfilo(page, prova))?.campagne?.fattoria?.cfg?.stato
uguale('il tasto porta la fattoria del bambino di prova al livello 10',
       stato && new Fattoria({ dato: stato }).livello, 10)

uguale('nessun errore in console', errori.length, 0)
errori.slice(0, 4).forEach(e => nota('·', e))

await page.close()
await browser.close()
riassunto('la pagina dei trucchi')
