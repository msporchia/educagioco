/* ═══════════════════════════════════════════════════════════════════
   L'UNIONE DELLE FORME SCARTA SENZA CAMBIARE IL RISULTATO
   `node test/esegui.mjs costa-unione`

   `unione` (scena/costa.js, inglese e spagnolo) salta le forme che non possono
   cambiare il minimo né il raccordo morbido: è la parte che pesava sull'apertura
   delle mappe. Qui si confronta con la somma completa, forma per forma, su
   forme a caso, con e senza raccordo, dentro e fuori dalle scatole.
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, riassunto } from '../aiuto/verifica.mjs'

function seme(n) { let s = n; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296 }

for (const lingua of ['inglese', 'spagnolo']) {
  const { unione, distanza, tondo, tratto, riquadro } = await import(`../../src/giochi/${lingua}/scena/costa.js`)
  // la somma completa di una volta, senza scarti
  const completa = (forme, x, y, k) => {
    let d = Infinity
    for (const f of forme) {
      const v = distanza(f, x, y)
      if (k && d !== Infinity) { const h = Math.max(k - Math.abs(d - v), 0) / k; d = Math.min(d, v) - h * h * k / 4 } else d = Math.min(d, v)
    }
    return d
  }
  const r = seme(7)
  let diversi = 0, prove = 0, scartabili = 0
  for (let giro = 0; giro < 60; giro++) {
    const forme = []
    for (let i = 0, n = 5 + Math.floor(r() * 40); i < n; i++) {
      const x = r() * 400, y = r() * 600, q = r()
      forme.push(q < 0.5 ? tondo(x, y, 6 + r() * 30) : q < 0.85 ? tratto(x, y, x + (r() - 0.5) * 120, y + (r() - 0.5) * 120, 4 + r() * 12) : riquadro(x, y, 8 + r() * 40, 8 + r() * 40))
    }
    for (let p = 0; p < 200; p++) {
      const x = r() * 520 - 60, y = r() * 720 - 60
      for (const k of [0, 26]) {
        prove++
        const a = unione(forme, x, y, k), b = completa(forme, x, y, k)
        if (Math.abs(a - b) > 1e-9) diversi++
        if (b > 60) scartabili++
      }
    }
  }
  controlla(`${lingua}: unione con scarto = unione completa (${prove} punti, ${diversi} diversi)`, diversi === 0)
  controlla(`${lingua}: la prova tocca anche punti lontani dalle forme`, scartabili > 100, `solo ${scartabili}`)
}

riassunto('l’unione delle forme scarta senza cambiare il risultato')
