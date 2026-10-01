/* English: la mappa del tesoro, la nave che naviga fino a «Che cos'è?», la
   pagina del primo concetto, e tre frasi composte toccando le tessere: la
   prima sbagliata apposta, per far vedere cosa insegna il gioco dopo uno
   sbaglio (il perché, la frase giusta, «Si fa così»), le altre due giuste.

   Il profilo ha vinto le prime tre tappe della prima isola: la nave è
   ancorata a «I giocattoli», e toccata «Che cos'è?» ci naviga. È la prima
   volta, quindi viene la pagina del concetto (docs/lingue/concetti.md). Le
   parole degli animali sono sapute e le strutture it is / is it a metà
   (forza 4), così le frasi arrivano già come tessere (il gradino in
   `motore/sessione.js`).

   Le tessere si toccano in ordine di `data-posto`, letto dal banco a ogni
   domanda (mai scritto a mano: il banco è mescolato); quelle di troppo non
   hanno posto e restano lì. Lo sbaglio scambia le prime due: «is it a dog»
   al posto di «it is a dog», che ha il suo perché nella tabella.

   Dipende da `[data-tappa]`, `[data-nave]`, `[data-pagina]`,
   `[data-azione="capito"]`, `[data-domanda]` (e `data-formato`),
   `[data-banco] [data-tessera][data-posto]`, `[data-azione="consegna"]`,
   `[data-opzione][data-giusta]`, `[data-esito]`. */
const ORA = Date.now()
const sa = s => ({ s, ok: 5, err: 0, last: ORA, seen: 5, t: 0 })
const ANIMALI = ['dog', 'cat', 'fish', 'bird', 'mouse', 'rabbit', 'horse', 'cow', 'pig', 'duck']
const GIOCATTOLI = ['ball', 'doll', 'teddy bear', 'kite', 'puzzle', 'game', 'car', 'train', 'plane', 'boat']

export default {
  file: 'clip-inglese', dove: 'inglese', attesa: '[data-mappa-inglese] [data-nave]',
  profilo: p => {
    p.settings.eta = 7
    p.campagne.inglese = { tappa: 3, libera: false, stelle: {}, cfg: {},
                           vinte: { 'prima-colori': ORA - 3 * 864e5, 'prima-animali': ORA - 2 * 864e5,
                                    'prima-giocattoli': ORA - 864e5 } }
    p.items = { ...(p.items || {}) }
    for (const w of [...ANIMALI, ...GIOCATTOLI]) p.items['en:' + w] = sa(6)
    p.items['forma:it-is'] = sa(4)
    p.items['forma:is-it'] = sa(4)
    return p
  },
  clip: {
    secondi: 34, coda: 900,
    async durante (page) {
      await page.waitForTimeout(1000)                         // la mappa, e la nave in porto
      await page.locator('[data-tappa="prima-che-cose"]').click()
      await page.waitForSelector('[data-pagina]', { timeout: 5000 })
      await page.waitForTimeout(2600)                         // leggere la pagina
      await page.locator('[data-azione="capito"]').click()
      for (let n = 0; n < 3; n++) {
        const sbaglia = n === 0
        await page.waitForSelector('[data-domanda]:not(:has([data-esito]))', { timeout: 6000 })
        // leggere l'italiano; prima dello sbaglio di più, se no è «troppo di fretta»
        await page.waitForTimeout(sbaglia ? 3200 : 700)
        const formato = await page.locator('[data-domanda]').getAttribute('data-formato')
        if (['completa', 'monta', 'scegliMonta'].includes(formato)) {
          const tessere = await page.locator('[data-banco] [data-tessera][data-posto]').evaluateAll(
            els => els.map(e => ({ id: e.dataset.tessera, posto: Number(e.dataset.posto) })))
          tessere.sort((a, b) => a.posto - b.posto)
          if (sbaglia) tessere.splice(0, 2, tessere[1], tessere[0])
          for (const t of tessere) {
            await page.locator(`[data-banco] [data-tessera="${t.id}"]`).click()
            await page.waitForTimeout(380)
          }
          await page.locator('[data-azione="consegna"]').click()
        } else await page.locator(`[data-domanda] [data-opzione]${sbaglia ? ':not([data-giusta])' : '[data-giusta]'}`)
          .first().click()
        await page.waitForSelector(`[data-esito="${sbaglia ? 'sbagliata' : 'giusta'}"]`, { timeout: 3000 })
        await page.waitForSelector('[data-esito]', { state: 'detached', timeout: 12000 })
      }
    },
  },
}
