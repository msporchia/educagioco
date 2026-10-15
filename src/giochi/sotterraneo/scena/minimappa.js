// La mappina del sotterraneo: solo quello che si è visto, più i punti che servono (dove sei, la scala, chi ha la chiave, la roba
// da toccare). In alto a destra, o grande al centro dalla 🗺️ della barra. La usa la tela 2D (scena/tela.js) e il 3D, che la
// disegna su una tela piccola sopra la scena (scena3d/indice.js). `L`, `A`: la misura del campo, in px.
import { ROCCIA, RELITTO, ACQUA } from '../dati/mondo.js'

// mostra solo quello che si è visto, e i tre punti che servono: dove sei, dov'è la scala, chi ha la chiave
// `mappaGrande` (la 🗺️ della barra): la stessa, al centro e grande quanto lo schermo lascia; il campo sotto si scurisce
export function disegnaMinimappa(ctx, corsa, L, A, grande) {
  const liv = corsa.livello
  const p = grande
    ? Math.max(2, Math.min((L - 36) / liv.largo, (A - 96) / liv.alto))
    : Math.max(1.4, Math.min(2.6, 120 / Math.max(liv.largo, liv.alto)))
  const larg = liv.largo * p, alt = liv.alto * p
  const x0 = grande ? Math.round((L - larg) / 2) : L - larg - 10
  const y0 = grande ? Math.round((A - alt) / 2) : 12
  ctx.save()
  if (grande) {
    ctx.fillStyle = 'rgba(4,5,10,.6)'
    ctx.fillRect(0, 0, L, A)
  }
  ctx.fillStyle = 'rgba(6,8,14,.78)'
  ctx.fillRect(x0 - 4, y0 - 4, larg + 8, alt + 8)
  ctx.strokeStyle = 'rgba(255,255,255,.14)'
  ctx.lineWidth = 1
  ctx.strokeRect(x0 - 4.5, y0 - 4.5, larg + 9, alt + 9)
  ctx.fillStyle = 'rgba(180,170,150,.5)'
  for (let x = 0; x < liv.largo; x++) for (let y = 0; y < liv.alto; y++) {
    const v = liv.a(x, y)
    if (!corsa.visto[y * liv.largo + x] || v === ROCCIA) continue
    // un relitto è quasi roccia, l'acqua è azzurra: sulla mappina si vede dove non si passa
    ctx.fillStyle = v === RELITTO ? 'rgba(96,88,80,.55)' : v === ACQUA ? 'rgba(70,140,200,.6)' : 'rgba(180,170,150,.5)'
    ctx.fillRect(x0 + x * p, y0 + y * p, p, p)
  }
  for (const r of liv.robe) {
    // il custode della chiave si segna dov'è la sua casa, mai dov'è adesso (docs/sotterraneo/regole.md, «La luce»)
    const sx = r.che === 'mostro' && r.casa ? r.casa.x : r.x, sy = r.che === 'mostro' && r.casa ? r.casa.y : r.y
    if (r.presa || r.morto || !corsa.visto[sy * liv.largo + sx]) continue
    // un baule già aperto sparisce; la roba per terra si segna, perché ora va toccata e una spada dimenticata è persa
    const colore = r.missione && !r.aperto ? '#ff7ad9'
      : r.che === 'mostro' && r.chiave ? '#ffd23f'
      : r.che === 'porta' && !r.aperta ? '#c9a227'
      : r.che === 'scala' ? '#6fc6ff'
      : r.che === 'portale' ? '#b48cff'
      : r.che === 'cosa' ? '#7ee08a'
      : r.che === 'forziere' && !r.aperto ? '#ff9b3d' : null
    if (!colore) continue
    ctx.fillStyle = colore
    ctx.fillRect(x0 + sx * p - 1, y0 + sy * p - 1, p + 2, p + 2)
  }
  ctx.fillStyle = '#fff'
  ctx.fillRect(x0 + Math.floor(corsa.eroe.x) * p - 1, y0 + Math.floor(corsa.eroe.y) * p - 1,
               p + 2, p + 2)
  ctx.restore()
}
