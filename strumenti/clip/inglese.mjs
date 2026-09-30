/* English: la mappa del tesoro, la nave che naviga fino a «Che cos'è?», e
   tre frasi composte toccando le tessere nel posto giusto.

   Il profilo ha vinto le prime tre tappe della prima isola: la nave è
   ancorata a «I giocattoli», e toccata «Che cos'è?» ci naviga. Le parole
   degli animali sono sapute e le strutture it is / is it a metà (forza 4),
   così le frasi arrivano già come tessere (il gradino in
   `motore/sessione.js`, docs/lingue/mondi.md).

   Le tessere si toccano in ordine di `data-posto`, letto dal banco a ogni
   domanda (mai scritto a mano: il banco è mescolato); quelle di troppo non
   hanno posto e restano lì. Poi «Fatto ✓», il verde, e la frase dopo.

   Dipende da `[data-tappa]`, `[data-nave]`, `[data-domanda]` (e
   `data-formato`), `[data-banco] [data-tessera][data-posto]`,
   `[data-azione="consegna"]`, `[data-opzione][data-giusta]`, `[data-esito]`. */
const ORA = Date.now()
const sa = s => ({ s, ok: 5, err: 0, last: ORA, seen: 5, t: 0 })
const ANIMALI = ['dog', 'cat', 'fish', 'bird', 'mouse', 'rabbit', 'horse', 'cow', 'pig', 'duck']
const GIOCATTOLI = ['ball', 'doll', 'teddy bear', 'kite', 'puzzle', 'game', 'car', 'train', 'plane', 'boat']

export default {
  file: 'clip-inglese', dove: 'inglese', attesa: '[data-mappa-inglese] [data-nave]',
  profilo: p => {
    p.settings.eta = 7                                        // la prima non è «passata»: la nave parte da lì
    p.campagne.inglese = { tappa: 3, libera: false, stelle: {}, cfg: {},
                           vinte: { 'prima-colori': ORA - 3 * 864e5, 'prima-ciao': ORA - 2 * 864e5,
                                    'prima-animali': ORA - 864e5 } }
    p.items = { ...(p.items || {}) }
    for (const w of [...ANIMALI, ...GIOCATTOLI]) p.items['en:' + w] = sa(6)
    p.items['forma:it-is'] = sa(4)
    p.items['forma:is-it'] = sa(4)
    return p
  },
  clip: {
    secondi: 24, coda: 900,
    async durante (page) {
      await page.waitForTimeout(1000)                         // la mappa, e la nave in porto
      await page.locator('[data-tappa="prima-che-cose"]').click()
      await page.waitForSelector('[data-domanda]', { timeout: 5000 })
      for (let n = 0; n < 3; n++) {
        await page.waitForSelector('[data-domanda]:not(:has([data-esito]))', { timeout: 6000 })
        await page.waitForTimeout(700)                        // leggere l'italiano
        const formato = await page.locator('[data-domanda]').getAttribute('data-formato')
        if (['completa', 'monta', 'scegliMonta'].includes(formato)) {
          const tessere = await page.locator('[data-banco] [data-tessera][data-posto]').evaluateAll(
            els => els.map(e => ({ id: e.dataset.tessera, posto: Number(e.dataset.posto) })))
          for (const t of tessere.sort((a, b) => a.posto - b.posto)) {
            await page.locator(`[data-banco] [data-tessera="${t.id}"]`).click()
            await page.waitForTimeout(380)
          }
          await page.locator('[data-azione="consegna"]').click()
        } else await page.locator('[data-domanda] [data-opzione][data-giusta]').click()
        await page.waitForSelector('[data-esito="giusta"]', { timeout: 3000 })
        await page.waitForSelector('[data-esito]', { state: 'detached', timeout: 6000 })
      }
    },
  },
}
