/* ═══════════════════════════════════════════════════════════════════
   LE ICONE DELL'APP — da `public/icona.svg` ai PNG che vuole un telefono

     node strumenti/icone.mjs

   Un SVG basta al browser ma non basta a chi installa: Android vuole un
   PNG per la schermata iniziale, iOS non guarda nemmeno il manifest e si
   prende l'`apple-touch-icon`. Quindi i PNG servono, e si generano da
   qui invece di essere disegnati a mano — così l'icona ha una sorgente
   sola e cambiarla vuol dire cambiare un file.

   Li disegna Chrome, guidato da Playwright, che è già fra le dipendenze
   di sviluppo: nessuna libreria nuova, e il vincolo dell'HTML unico resta
   intatto perché questi file stanno accanto al build e non dentro.

   LA VARIANTE MASCHERABILE. Android ritaglia l'icona nella forma che
   preferisce — cerchio, goccia, quadrato smussato — e taglia fino al 20%
   per lato. L'icona normale, che arriva fino al bordo, perderebbe gli
   angoli del dado. Quella `maskable` disegna lo stesso dado più piccolo
   dentro il fondo, così qualunque ritaglio prende solo sfondo.
   ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SORGENTE = resolve(RADICE, 'public/icona.svg')

/* quali file servono, e a chi:
     192  Android, la misura minima che un manifest deve offrire
     512  Android, la schermata iniziale e il negozio
     180  iOS, che il manifest non lo legge
     512m la variante ritagliabile */
const FORMATI = [
  { file: 'icona-192.png', lato: 192, margine: 0 },
  { file: 'icona-512.png', lato: 512, margine: 0 },
  { file: 'apple-touch-icon.png', lato: 180, margine: 0 },
  { file: 'icona-maskable.png', lato: 512, margine: 0.2 },
]

if (!existsSync(SORGENTE)) {
  console.error('manca public/icona.svg')
  process.exit(1)
}
const svg = readFileSync(SORGENTE, 'utf8')

function trovaChrome() {
  if (process.env.CHROME) return process.env.CHROME
  for (const p of ['/usr/bin/google-chrome', '/usr/bin/chromium',
                   '/usr/bin/chromium-browser', '/opt/pw-browsers/chromium'])
    if (existsSync(p)) return p
  return undefined
}

const exe = trovaChrome()
const browser = await chromium.launch(exe ? { executablePath: exe } : {})

/* La variante ritagliabile non si ottiene mettendo un bordo attorno
   all'icona: il bordo sarebbe di un colore solo e si vedrebbe lo stacco
   con la sfumatura. Si tocca il disegno — il fondo perde gli angoli
   tondi e arriva fino al bordo, il dado si rimpicciolisce — così la
   sfumatura resta una sola e il ritaglio di Android, qualunque forma
   abbia, morde soltanto cielo. */
function ritagliabile(svg) {
  return svg
    .replace('rx="112"', 'rx="0"')
    .replace('<g transform="rotate(-12 256 256)">',
             '<g transform="translate(256 256) scale(.64) translate(-256 -256) rotate(-12 256 256)">')
}

for (const { file, lato, margine } of FORMATI) {
  const page = await browser.newPage({ viewport: { width: lato, height: lato },
                                       deviceScaleFactor: 1 })
  /* Fondo trasparente per l'icona normale: gli angoli tondi devono
     restare vuoti, altrimenti si porta dietro un quadrato di colore che
     stona su qualunque schermata iniziale. */
  await page.setContent(`<!doctype html><meta charset="utf-8">
    <style>
      html,body { margin:0; width:${lato}px; height:${lato}px; overflow:hidden;
                  background:transparent }
      svg { display:block; width:${lato}px; height:${lato}px }
    </style>
    ${margine ? ritagliabile(svg) : svg}`)
  await page.screenshot({ path: resolve(RADICE, 'public', file), omitBackground: true })
  await page.close()
  console.log(`  ${file.padEnd(22)} ${lato}×${lato}${margine ? '  (ritagliabile)' : ''}`)
}

/* ══ L'ANTEPRIMA DEL LINK ══
   Quando l'indirizzo finisce in una chat, WhatsApp e i messaggi mostrano
   il riquadro di `og:image`. L'icona quadrata lì viene stretta e piccola:
   il formato che quei riquadri si aspettano è 1200×630, largo. È la prima
   cosa che vede un genitore a cui il gioco viene passato da un altro, e
   costa un file — quindi si genera qui, dalla stessa icona, invece di
   essere disegnato a mano da qualche parte.

   Non entra nel build (è `public/`, e il singolo HTML non lo inlinea):
   sta accanto alla pagina, che è l'unico posto da cui un servizio
   esterno può andarselo a prendere. */
const ANTEPRIMA = { file: 'anteprima.png', largo: 1200, alto: 630 }
{
  const { file, largo, alto } = ANTEPRIMA
  const page = await browser.newPage({ viewport: { width: largo, height: alto },
                                       deviceScaleFactor: 1 })
  await page.setContent(`<!doctype html><meta charset="utf-8">
    <style>
      html,body { margin:0; width:${largo}px; height:${alto}px; overflow:hidden;
                  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
                  background:linear-gradient(180deg,#fff7ec,#eef4ef 52%,#e3ecf3) }
      .riga { height:100%; display:flex; align-items:center; justify-content:center; gap:56px }
      svg { display:block; width:260px; height:260px; filter:drop-shadow(0 12px 24px #8593a840) }
      .dice h1 { margin:0; font-size:76px; font-weight:900; color:#37509f; letter-spacing:-1px }
      .dice p { margin:16px 0 0; font-size:32px; line-height:1.4; color:#6e7788;
                white-space:nowrap }
      .dice b { color:#37509f }
    </style>
    <div class="riga">
      ${svg}
      <div class="dice">
        <h1>Educagioco</h1>
        <p>Giochi per imparare<br><b>gratis, senza pubblicità</b></p>
      </div>
    </div>`)
  await page.screenshot({ path: resolve(RADICE, 'public', file) })
  await page.close()
  console.log(`  ${file.padEnd(22)} ${largo}×${alto}  (anteprima del link)`)
}

await browser.close()
console.log('\nfatto: i PNG stanno in public/ e finiscono accanto al build.')
