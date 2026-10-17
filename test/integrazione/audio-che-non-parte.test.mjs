/* ═══════════════════════════════════════════════════════════════════
   L'AUDIO CHE NON PARTE, NEL BROWSER
     node test/esegui.mjs audio-che-non-parte

   Un AudioContext finto che resta `suspended` per sempre (come un telefono
   dove la pronuncia parte fuori da un tocco) fa vedere cosa succede a chi
   gioca. Un volume a 0 non si può simulare, né il gioco lo può leggere:
   per quello c'è il tasto. Vedi docs/lingue/voce.md.
     · la pronuncia che non si sveglia finisce fra i guasti, con lo stato
     · sotto una domanda con la voce c'è «non posso ascoltare»
     · «non si sente» scrive nel libretto e ripete
     · «continua senza audio» spegne il suono del profilo, e il tasto sparisce
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, attendi, leggiProfilo, scegli, TELEFONO } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { viewport: TELEFONO })

// un contesto che non si sveglia mai: `resume()` non risponde, il tempo non passa
await page.addInitScript(() => {
  const nodo = () => ({ connect() { return nodo() }, start() {}, stop() {}, gain: { value: 1, setValueAtTime() {} },
                        frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} } })
  window.AudioContext = window.webkitAudioContext = class {
    constructor() { this.state = 'suspended'; this.currentTime = 0; this.sampleRate = 48000; this.destination = {} }
    resume() { return new Promise(() => {}) }
    decodeAudioData() { return Promise.resolve({ duration: 1 }) }
    createBufferSource() { return nodo() }
    createGain() { return nodo() }
    createOscillator() { return nodo() }
  }
})
await azzera(page)

const incidenti = () => page.evaluate(() => new Promise(ok => {
  const r = indexedDB.open('giochi-bambini', 1)
  r.onsuccess = () => {
    const g = r.result.transaction('kv', 'readonly').objectStore('kv').get('incidenti')
    g.onsuccess = () => { const x = g.result; ok((x && x.__v) || x || []) }
  }
}))

await scegli(page, 'inglese')
await page.waitForSelector('[data-mappa-inglese] [data-tappa]', { timeout: 5000 })
await page.locator('[data-tappa="prima-colori"]').click()

const tasto = page.locator('[data-azione="non-si-sente"]')
for (let i = 0; i < 8 && !(await tasto.count()); i++) {
  await page.waitForSelector('[data-domanda]')
  await attendi(page, 400)
  await page.locator('[data-domanda] [data-opzione][data-giusta]').click()
  await page.waitForSelector('[data-esito]', { state: 'detached', timeout: 6000 })
}
controlla('sotto una domanda con la voce c’è «non posso ascoltare»', await tasto.count() === 1)

await page.locator('[data-azione="ascolta"]').first().click()   // la voce parte al tocco
await attendi(page, 1500)   // il tempo che il gioco aspetta il risveglio, e il registro scrive
const prima = await incidenti()
controlla('la pronuncia che non si sveglia è fra i guasti',
          prima.some(g => /contesto non attivo \(suspended\)/.test(g.testo)), JSON.stringify(prima.map(g => g.testo)))
controlla('e dice com’era l’audio', prima.some(g => (g.dettagli || []).some(r => r.startsWith('contesto: suspended'))))

await tasto.click()
await page.locator('[data-azione="nss-riprova"]').click()
await attendi(page, 500)
const dopo = await incidenti()
controlla('«non si sente» scrive nel libretto', dopo.some(g => g.perche === 'tasto'), JSON.stringify(dopo.map(g => g.testo)))

await page.locator('[data-azione="nss-senza"]').click()
await attendi(page, 500)
uguale('«senza audio» spegne il suono del profilo', (await leggiProfilo(page)).settings.sound, false)
controlla('e il tasto non c’è più', await page.locator('[data-azione="non-si-sente"]').count() === 0)

uguale('nessun errore JS', errori.join('|'), '')
await browser.close()
riassunto('l\'audio che non parte')
