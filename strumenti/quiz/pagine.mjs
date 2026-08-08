/* ═══════════════════════════════════════════════════════════════════
   LE PAGINE DI PROVA DEI MODULI — scritte da qui, non a mano.

   Ogni modulo ha in `poc/` una pagina che lo apre nella palestra. Sono
   tutte identiche tranne il nome del modulo, quindi scriverle a mano
   vuol dire solo dimenticarsene una o lasciarne indietro una vecchia.

     node strumenti/quiz/pagine.mjs          rifà le pagine mancanti
     node strumenti/quiz/pagine.mjs --tutte  le riscrive tutte

   Il cartello del doppio click non è un vezzo: queste pagine caricano
   moduli ES veri e da `file://` il browser li blocca (regola sua). Chi
   ci prova vedrebbe una pagina bianca e un errore CORS nella console —
   così invece legge cosa deve fare.
   ═══════════════════════════════════════════════════════════════════ */

import { readdirSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'

const QUI = dirname(fileURLToPath(import.meta.url))
const RADICE = resolve(QUI, '../..')
const MODULI = resolve(RADICE, 'src/quiz/moduli')
const POC = resolve(RADICE, 'poc')

export const pagina = (id, nome) => `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${nome} — prova</title>
</head>
<body>
<!-- Pagina generata da strumenti/quiz/pagine.mjs: non si scrive a mano. -->
<script>
  /* Col doppio click il browser blocca gli import dei moduli: meglio
     dirlo che mostrare una pagina bianca. */
  if (location.protocol === 'file:') document.write(\`
    <div style="max-width:420px;margin:60px auto;padding:22px;border-radius:18px;
                background:#1d2a4a;color:#e8edf7;border:1px solid rgba(255,255,255,.12);
                font:16px/1.6 system-ui,sans-serif">
      <h1 style="font-size:20px;margin:0 0 10px">Serve un server</h1>
      <p style="color:#b9c6e6">Questa pagina carica moduli veri, e col doppio
         click il browser li blocca. Dal terminale, nella cartella del progetto:</p>
      <p><code style="background:rgba(255,255,255,.08);padding:6px 10px;border-radius:8px;
                      display:inline-block">npm run quiz</code></p>
      <p style="color:#93a0bd;font-size:14px">Si apre l'elenco dei moduli;
         questo è <b>${nome}</b>.</p>
    </div>\`)
</script>
<script type="module">
  import modulo from '../src/quiz/moduli/${id}.js'
  import { palestra } from '../src/quiz/grafica/palestra.js'
  palestra(modulo)
</script>
</body>
</html>
`

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const tutte = process.argv.includes('--tutte')
  let scritte = 0
  for (const f of readdirSync(MODULI).sort().filter(x => x.endsWith('.js'))) {
    const id = f.replace(/\.js$/, '')
    /* un modulo rotto (o a metà scrittura) non deve fermare gli altri:
       la pagina si scrive lo stesso, sarà il banco a dire cos'ha */
    let mod = null
    try { mod = (await import(pathToFileURL(resolve(MODULI, f)).href)).default }
    catch (e) { console.log(`⚠ ${id}: non si importa — ${e.message.split('\n')[0]}`) }
    const dove = resolve(POC, `quiz-${id}.html`)
    if (!tutte && existsSync(dove)) continue
    writeFileSync(dove, pagina(id, mod?.nome || id))
    console.log('scritta poc/quiz-' + id + '.html')
    scritte++
  }
  console.log(scritte ? `${scritte} pagine` : 'niente da fare')
}
