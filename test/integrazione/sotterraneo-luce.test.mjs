/* ═══════════════════════════════════════════════════════════════════
   LA LUCE A CONO, NELLA DISCESA

   (docs/sotterraneo/luce.md). Lo stesso piano, lo stesso punto: la luce è
   un cono davanti all'eroe e un alone corto attorno, l'ombra è dietro, e
   la torcia allunga il cono ma non accende la stanza. La scena 3D disegna
   la luce come una maschera in WebGL che non si rilegge (di pixel si
   vede solo con `--scatti`): quello che si prova è la luce che il motore
   ha acceso nella discesa vera (`__sotterraneo3d.corsa.luce`, `forzaLuce`),
   cioè che la torcia della roba seminata arriva al piano e allunga il
   cono. Si contano le caselle accese con la torcia, senza e agli
   sgoccioli, e si guarda che la luce segua il verso: dopo un passo a
   sinistra, quello che stava davanti (a destra) torna ombra. La
   geometria del cono è provata da `unita/sotterraneo-luce`.
   `--scatti` lascia le foto: `sotterraneo-luce-con`, `-senza`,
   `-sgoccioli`, e `-voltato` (il passo indietro, con la torcia).
   `node test/esegui.mjs sotterraneo-luce`
   tempo: 120
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'

const SEME = 12   // la stanza dell'ingresso è di dieci per otto: si vede la forma del cono
const roba = torcia => ({ v: 1, gemme: 40, zaino: ['pozione'], mano: 'spada@6.r.att.fuoco.vita', mancina: 'scudo-legno@4',
                          corpo: 'panciotto@4', dito: null, torcia, torce: 0 })
const avventura = torcia => ({ tappa: 1, libera: false, stelle: { 0: 3 }, missioni: {}, roba: roba(torcia), mondo: { parlato: true } })

const browser = await apriBrowser()

/* le caselle accese dal motore adesso: quante, quanta luce in tutto (la forza di ognuna), e `avanti`, quelle a più di due celle e
   mezza a destra dell'eroe sulla sua riga (±1 cella e mezza): lì arriva il cono quando guarda a destra */
const misura = page => page.evaluate(() => {
  const c = window.__sotterraneo3d.corsa, L = c.livello
  const ex = c.eroe.x, ey = c.eroe.y
  let n = 0, luce = 0, avanti = 0
  for (const k of c.luce) {
    const f = c.forzaLuce.get(k) ?? 1, x = (k % L.largo) + 0.5, y = Math.floor(k / L.largo) + 0.5
    n++; luce += f
    if (x > ex + 2.5 && Math.abs(y - ey) < 1.5) avanti += f
  }
  return { n, luce: Math.round(luce * 10) / 10, avanti: Math.round(avanti * 10) / 10 }
})

async function campo(torcia, nome, { voltati = false } = {}) {
  const { page, errori } = await apriGioco(browser)
  await azzera(page)
  await semina(page, {
    coins: 300,
    campagne: { sotterraneo: { tappa: 1, libera: false, stelle: { 0: 3 },
      cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: avventura(torcia) } } } },
  })
  await page.evaluate(s => { location.hash = `sotterraneo=0&seme=${s}&piano=1` }, SEME)
  await page.waitForSelector('[data-tela="3d"]', { timeout: 40000 })
  await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.grafica().figure > 0, null, { timeout: 30000 })
  await attendi(page, 3000)   // la telecamera morbida arriva all'eroe, e il primo tocco trova la scena ferma
  const prima = await misura(page)
  await scatto(page, nome)
  let dopo = null
  if (voltati) {
    // qualche passo a sinistra (un tocco sulla cella accanto all'eroe cade sull'eroe stesso, e sulla scala che sale sotto di lui): il verso diventa quello, e la luce con lui
    const tela = page.locator('[data-tela="3d"]')
    const b = await tela.boundingBox()
    const [ex, ey] = (await tela.getAttribute('data-eroe')).split(',').map(Number)
    const passi = await page.evaluate(([x, y]) => { const c = window.__sotterraneo3d.corsa, b = c.buona(); let k = 0; while (k < 4 && b(x - k - 1, y)) k++; return k }, [ex, ey])
    controlla('c\'è posto per tre passi a sinistra', passi >= 3, String(passi))
    const [sx, sy] = await page.evaluate(([x, y]) => window.__sotterraneo3d.aSchermo(x, 0.05, y), [ex - passi + 0.5, ey + 0.5])
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x + sx, y: b.y + sy }] })
    await attendi(page, 60)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    for (let i = 0; i < 20; i++) {
      const c1 = await tela.getAttribute('data-eroe')
      await attendi(page, 600)
      if (c1 === await tela.getAttribute('data-eroe') && c1 !== `${ex},${ey}`) break
    }
    await attendi(page, 600)
    dopo = await misura(page)
    await scatto(page, `${nome}-voltato`)
  }
  return { ...prima, dopo, errori }
}

const con = await campo(12, 'sotterraneo-luce-con', { voltati: true })
const senza = await campo(0, 'sotterraneo-luce-senza')
const sgoccioli = await campo(1, 'sotterraneo-luce-sgoccioli')   // l'ultima stanza della torcia
nota(`caselle accese con la torcia ${con.n} (luce ${con.luce}), agli sgoccioli ${sgoccioli.n}, senza ${senza.n} (luce ${senza.luce})`)
nota(`la striscia davanti (a destra): con la torcia ${con.avanti}, voltati ${con.dopo && con.dopo.avanti}`)
controlla('anche senza torcia qualcosa si vede', senza.n > 8, `${senza.n} caselle accese`)
controlla('senza torcia si vede meno: il cono è corto', senza.n < con.n * 0.8, `${senza.n} contro ${con.n}`)
controlla('e la luce è meno', senza.luce < con.luce * 0.7, `${senza.luce} contro ${con.luce}`)
controlla('agli sgoccioli il cono si accorcia: si vede più che al buio e meno che con la torcia piena',
          sgoccioli.n > senza.n && sgoccioli.n < con.n, `${senza.n} < ${sgoccioli.n} < ${con.n}`)
controlla('la luce segue il verso: voltando le spalle a quello che si vedeva, davanti resta l\'ombra',
          con.dopo && con.dopo.avanti < con.avanti * 0.75, `${con.avanti} → ${con.dopo && con.dopo.avanti}`)
uguale('nessun errore in console', [...con.errori, ...senza.errori, ...sgoccioli.errori].join(' · '), '')

await browser.close()
riassunto('la luce a cono, nella discesa')
