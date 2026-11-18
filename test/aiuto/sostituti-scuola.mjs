/* I SOSTITUTI DELLA SCUOLA ANCHE IN NODE

   Come il plugin di vite.scuola.config.js: un import relativo che arriva a un originale di
   `src/scuola/sostituti/elenco.js` prende il sostituto. Si importa PRIMA di tutto il resto, e quello che deve vederli
   si carica dopo con `await import(...)` (gli import statici si risolvono prima che questo giri). */
import { registerHooks } from 'node:module'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { SOSTITUTI } from '../../src/scuola/sostituti/elenco.js'

const RADICE = resolve(import.meta.dirname, '../..')
const MAPPA = new Map(Object.entries(SOSTITUTI).map(([da, a]) => [pathToFileURL(resolve(RADICE, da)).href, pathToFileURL(resolve(RADICE, a)).href]))

export const usati = new Set()       // quali sostituti sono entrati davvero
registerHooks({
  resolve(fonte, contesto, prossimo) {
    const r = prossimo(fonte, contesto)
    if (!fonte.startsWith('.')) return r
    const sost = MAPPA.get(r.url)
    if (!sost) return r
    usati.add(fileURLToPath(sost).slice(RADICE.length + 1))
    return { ...r, url: sost }
  },
})
