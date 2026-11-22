/* ═══════════════════════════════════════════════════════════════════
   LA PORTA DEI GRANDI (le prove `integrazione/genitori*`)

   Il tastierino, le schede della barra in basso e il quadro dell'età:
   i gesti veri (apri il blocco, apri la tacca, spostala, conferma), con
   le attese sullo stato che il gesto produce e non a tempo. Erano dentro
   `genitori`, e servono ai suoi tre pezzi.
   ═══════════════════════════════════════════════════════════════════ */
import { apriTendine } from './browser.mjs'
import { chiudiTraguardi } from './traguardi.mjs'

export function grandi(page) {
  const digita = async pin => { for (const c of pin) await page.click(`.tasto >> text="${c}"`) }
  // il profilo seminato si prende le medaglie che gli spettano, e i loro cartelli coprono la home: si chiudono col dito
  const vaiAiGenitori = async () => {
    await chiudiTraguardi(page)
    await page.click('[data-azione="grandi"]')
    await page.waitForSelector('.tastierino', { timeout: 5000 })
  }
  // dalla home dentro, col codice di partenza
  const entra = async (pin = '0000') => {
    await vaiAiGenitori()
    await digita(pin)
    await page.waitForSelector('nav.barra-giu', { timeout: 5000 })
  }
  /* Si dice ogni volta in che scheda si vuole andare, invece di dare per scontata quella aperta: è la differenza fra un test
     che si rompe quando si cambia il difetto e uno che si rompe quando si rompe qualcosa. Le tendine nascono chiuse: qui si
     prova quello che c'è dentro, e si aprono */
  const apriScheda = async nome => {
    await page.waitForSelector(`[data-scheda="${nome}"]`, { timeout: 5000 })
    await page.click(`[data-scheda="${nome}"]`)
    await page.waitForSelector(`[data-scheda="${nome}"].ora`, { timeout: 3000 })
    await apriTendine(page)
  }
  /* il quadro: un blocco si apre al tocco (e resta aperto) */
  const apriBlocco = async k => {
    const sel = `[data-manopola] [data-apri="${k}"]`
    if ((await page.locator(sel).count()) === 0) return false
    if (!(await page.locator(sel).evaluate(el => el.classList.contains('aperta')))) {
      await page.click(sel)
      await page.waitForSelector(`${sel}.aperta`, { timeout: 3000 })
    }
    return true
  }
  const apriTutto = async () => { for (const k of ['facili', 'medie', 'toste', 'sotto', 'spenta']) await apriBlocco(k) }
  /* La tacca si porta a fondo corsa e poi si risale: così non serve sapere da dove partiva. Una freccia a fondo corsa è
     spenta, e `click()` su un tasto spento aspetta finché non scade: si smette appena si arriva in fondo */
  const spingi = async (sel, quante) => {
    for (let i = 0; i < quante; i++) {
      if (await page.locator(sel).isDisabled()) break
      await page.click(sel)
    }
  }
  /* la tacca di un pezzo di scuola: `via` è l'ultimo scatto, quello che lo spegne; `rimetti` è la riga sotto i due tasti.
     Lo stesso pezzo può avere una riga in due blocchi: si prende la prima. Applicata, la tacca si chiude da sé */
  const taraSapere = async (chiave, come) => {
    await apriScheda('bambini')
    await page.waitForSelector('[data-manopola]', { timeout: 5000 })
    await apriTutto()
    await page.locator(`[data-tara-apri="${chiave}"]`).first().click()
    await page.waitForSelector(`[data-taratura="${chiave}"]`, { timeout: 5000 })
    if (come === 'rimetti') await page.click('[data-tara="rimetti"]')
    else {
      await spingi('[data-tara="su"]', 8)
      await page.click('[data-tara="applica"]')
    }
    await page.waitForSelector(`[data-taratura="${chiave}"]`, { state: 'detached', timeout: 3000 })
  }
  /* la ✎ di un gioco nel quadro: `no` lo spegne, `si` lo tiene anche se l'età dice di no, `difetto` torna all'età */
  const taraGioco = async (chiave, verso) => {
    await apriScheda('bambini')
    await page.waitForSelector('[data-manopola]', { timeout: 5000 })
    await apriBlocco('giochi')
    await page.click(`[data-tara-apri="${chiave}"]`)
    await page.waitForSelector(`[data-in-casa="${chiave}"]`, { timeout: 5000 })
    await spingi('[data-gioco-tara="giu"]', 3)                    // fino a «Non ce l'ha»
    if (verso !== 'no') await spingi('[data-gioco-tara="su"]', verso === 'si' ? 2 : 1)
    await page.click('[data-gioco-tara="applica"]')
    await page.waitForSelector(`[data-in-casa="${chiave}"]`, { state: 'detached', timeout: 3000 })
  }
  // dai grandi alla home, e se lì c'è `sel`
  const inHome = async sel => {
    await page.click('button[aria-label="indietro"]')
    await page.waitForSelector('.carte', { timeout: 5000 })
    return page.isVisible(sel)
  }
  const moneteInHome = () => page.evaluate(() => {
    const t = document.body.innerText.match(/🪙\s*(\d+)/)
    return t ? Number(t[1]) : null
  })
  return { digita, vaiAiGenitori, entra, apriScheda, apriBlocco, apriTutto, spingi, taraSapere, taraGioco, inHome, moneteInHome }
}

/* Un profilo riconoscibile: se ricompare dopo il ripristino, il giro completo ha funzionato. Non solo monete e contatori:
   anche una parola imparata a metà e due campagne a mezza strada */
export const RICONOSCIBILE = () => ({
  coins: 777,
  totals: { math: 42, en: 0, verbi: 0, frasi: 0, td: 0, partiteMath: 0, torri: 0, perfette: 0, ondate: 0, monete: 0 },
  items: { 'en:dog': { n: 3, ef: 2.2, i: 4, due: Date.now() + 3 * 86400000, r: 3, w: 1 } },
  td: { tappa: 4, libera: false, v: 2 },
  campagne: { sotterraneo: { tappa: 2, libera: false, stelle: {}, cfg: {} } },
})
