/* ═══════════════════════════════════════════════════════════════════
   LA FATTORIA DI PROVA, DALL'INDIRIZZO

   L'unità (`unita/fattoria-tipo`) prova che la fattoria costruita sta in
   piedi. Qui si prova la strada per arrivarci, che è quella di un
   grande col telefono in mano:
     · `#fattoria-tipo=30` porta **dentro** la fattoria, non in home;
     · si somma a `#monete=`, che adesso toglie solo il suo pezzo;
     · l'indirizzo si ripulisce, e ricaricare non la rifà;
     · prima di buttare la fattoria di prima, il profilo va nel cestino.

   `node test/esegui.mjs fattoria-tipo`
   tempo: 60
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, leggiProfilo, scatto, attendi, GIOCO }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { Fattoria } from '../../src/giochi/fattoria/motore/fattoria.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, { coins: 100 })

/* il cestino sta fuori dai profili: si legge dall'archivio come loro */
const cestino = () => page.evaluate(() => new Promise((ok, ko) => {
  const r = indexedDB.open('giochi-bambini', 1)
  r.onerror = () => ko(new Error('IndexedDB non si apre'))
  r.onsuccess = () => {
    const g = r.result.transaction('kv', 'readonly').objectStore('kv').get('cestino')
    g.onsuccess = () => ok((g.result && g.result.voci) || [])
    g.onerror = () => ko(new Error('lettura fallita'))
  }
}))

/* Uscire è il modo di salvare subito (`onBeforeUnmount`), come negli
   altri test della fattoria. */
async function esci() {
  await page.locator('button[aria-label="indietro"]').click()
  await page.waitForSelector('.carte', { timeout: 5000 })
  await attendi(page, 400)
}
const fattoria = async () => {
  const p = await leggiProfilo(page)
  const stato = p && p.campagne && p.campagne.fattoria && p.campagne.fattoria.cfg.stato
  return { p, f: stato ? new Fattoria({ dato: stato }) : null }
}

/* ── 0. una fattoria sua, da non perdere ──
   Il bambino ci è già entrato: la sua fattoria appena nata è salvata,
   ed è quella che il cestino deve tenere. */
await page.locator('.carta.gioco[data-gioco="fattoria"]').click()
await page.waitForSelector('.fa-tela', { timeout: 5000 })
await attendi(page, 600)
await esci()
uguale('prima del cheat la fattoria è quella di un bambino nuovo', (await fattoria()).f?.livello, 1)

/* ── 1. a pagina aperta, insieme alle monete ──
   È il modo in cui lo si usa davvero: gioco aperto in home, si scrive in
   fondo all'indirizzo e si preme invio. */
await page.evaluate(() => { location.hash = 'fattoria-tipo=30&monete=2000' })
await page.waitForSelector('.fa-tela', { timeout: 8000 })
await attendi(page, 900)
controlla('l\'indirizzo porta dentro la fattoria', await page.locator('.fa-tela').count() > 0)
uguale('e si ripulisce', await page.evaluate(() => location.hash), '')
await scatto(page, 'fattoria-tipo-30')
await esci()
{
  const { p, f } = await fattoria()
  controlla('le monete sono arrivate anche loro', p.coins >= 2100, `ne ha ${p.coins}`)
  uguale('la fattoria è al livello chiesto', f && f.livello, 30)
  controlla('e ha già la sua roba', f && f.cose.length > 40, `${f && f.cose.length} cose`)
  const voci = await cestino()
  uguale('prima di buttarla, il profilo è finito nel cestino', voci.length, 1)
  uguale('col suo motivo', voci[0] && voci[0].motivo, 'fattoria tipo')
  /* le monete del cheat arrivano prima (le riscuote l'app appena legge
     l'indirizzo), la fattoria dopo, entrando: la copia ha le une e non
     l'altra */
  const vecchia = voci[0] && voci[0].profilo.campagne.fattoria.cfg.stato
  uguale('e dentro c\'è la fattoria di prima', vecchia && new Fattoria({ dato: vecchia }).livello, 1)
}

/* ── 2. ricaricare non la rifà ── */
await page.reload()
await page.waitForSelector('.carte', { timeout: 10000 })
await page.locator('.carta.gioco[data-gioco="fattoria"]').click()
await page.waitForSelector('.fa-tela', { timeout: 5000 })
await attendi(page, 600)
await esci()
uguale('un aggiornamento non la ricostruisce', (await cestino()).length, 1)

/* ── 3. aprendo la pagina con l'indirizzo già scritto ── */
await page.goto(GIOCO + '#fattoria-tipo=3')
await page.waitForSelector('.fa-tela', { timeout: 10000 })
await attendi(page, 900)
await scatto(page, 'fattoria-tipo-3')
await esci()
{
  const { f } = await fattoria()
  uguale('aperta dall\'indirizzo, la fattoria è quella nuova', f && f.livello, 3)
  uguale('e la copia nel cestino è una in più', (await cestino()).length, 2)
}

uguale('nessun errore in console', errori.length, 0)
errori.slice(0, 4).forEach(e => nota('·', e))

await page.close()
await browser.close()
riassunto('la fattoria di prova')
