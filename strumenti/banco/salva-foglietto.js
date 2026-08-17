/* ═══════════════════════════════════════════════════════════════════
   SCRIVERE UN FOGLIETTO DAL BANCO

   L'editor dei ritagli corregge un foglietto — quattro numeri storti, un
   nome sbagliato, un rettangolo da cancellare — e quella correzione deve
   finire nel file, non negli appunti di chi guarda. La convenzione di
   casa per gli attrezzi che si aprono col doppio click è la clipboard
   (`strumenti/mappe/editor.html`), e lì è l'unica strada possibile: da
   `file://` non c'è nessuno dall'altra parte.

   Il banco dei mondi passa da Vite comunque — importa i moduli veri dei
   giochi, e senza server non partirebbe — quindi dall'altra parte c'è
   già qualcuno. Tanto vale che scriva: incollare a mano duecento sprite
   di JSON è il genere di passaggio dove si perde una riga e non si sa
   quale.

   ── i due paletti ──
   · `apply: 'serve'` — questo plugin **non esiste** nel build. Il
     prodotto finale è un HTML che si apre col doppio click: un pezzo che
     scrive file non ci deve nemmeno arrivare vicino.
   · si scrive solo dentro `strumenti/sprite/sorgenti/` e solo `.json`.
     Non perché ci si aspetti un attacco su localhost, ma perché un
     attrezzo che può scrivere ovunque prima o poi scrive altrove per un
     percorso costruito male, e il difetto si presenta come un file
     sparito.
   ═══════════════════════════════════════════════════════════════════ */
import { writeFileSync, existsSync } from 'node:fs'
import { resolve, relative, sep } from 'node:path'

const RADICE = 'strumenti/sprite/sorgenti'

export function salvaFoglietto () {
  return {
    name: 'salva-foglietto',
    apply: 'serve',
    configureServer (server) {
      server.middlewares.use('/__foglietto', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; return res.end('solo POST') }
        let corpo = ''
        req.on('data', c => { corpo += c })
        req.on('end', () => {
          const dillo = (codice, testo) => {
            res.statusCode = codice
            res.setHeader('content-type', 'text/plain; charset=utf-8')
            res.end(testo)
          }
          try {
            const { file, testo } = JSON.parse(corpo)
            const dentro = resolve(process.cwd(), RADICE)
            const pieno = resolve(process.cwd(), String(file).replace(/^\//, ''))
            const dopo = relative(dentro, pieno)
            if (dopo.startsWith('..') || dopo.startsWith(sep) || !pieno.endsWith('.json'))
              return dillo(403, `fuori da ${RADICE}: ${file}`)
            if (!existsSync(pieno))
              return dillo(404, `non esiste: ${file} — il banco corregge, non crea`)
            JSON.parse(testo)                 // se non è JSON valido non si scrive niente
            writeFileSync(pieno, testo)
            console.log(`  ✎ ${dopo} scritto dal banco`)
            dillo(200, 'scritto')
          } catch (e) {
            dillo(400, String(e && e.message || e))
          }
        })
      })
    },
  }
}
