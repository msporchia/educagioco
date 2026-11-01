// La mappina del sotterraneo: solo quello che si è visto, più i punti che servono (dove sei, la scala, chi ha la chiave, la roba
// da toccare). In alto a destra, o grande al centro dalla 🗺️ della barra. La usa il 3D, che la
// disegna su una tela piccola sopra la scena (scena3d/indice.js). `L`, `A`: la misura del campo, in px.
// Lo stile (docs/sotterraneo/luce.md, «La mappina»): carta scura, pavimento chiaro col bordo dei muri in linea, e ogni punto ha
// una forma sua con il contorno scuro, così si distingue anche dove le celle sono piccole e senza fidarsi del solo colore.
import { ROCCIA, RELITTO, ACQUA } from '../dati/mondo.js'

// la forma e il colore di una cosa sulla mappina: `s` = quanto è grande (px), il resto lo fa `segno`
const FINESTRA = 24   // la mappina piccola mostra al più tante celle per lato attorno all'eroe
const FORME = {
  scala: { colore: '#6fc6ff', forma: 'triangolo', nome: 'Scala' },
  portale: { colore: '#b48cff', forma: 'rombo', nome: 'Portale' },
  chiave: { colore: '#ffd23f', forma: 'rombo', nome: 'Chiave' },
  porta: { colore: '#e0b23a', forma: 'quadro', nome: 'Porta' },
  cosa: { colore: '#7ee08a', forma: 'tondo', nome: 'Cosa' },
  forziere: { colore: '#ff9b3d', forma: 'quadro', nome: 'Forziere' },
  missione: { colore: '#ff7ad9', forma: 'tondo', nome: 'Missione' },
}

function segno(ctx, f, cx, cy, s) {
  ctx.beginPath()
  if (f.forma === 'tondo') ctx.arc(cx, cy, s, 0, Math.PI * 2)
  else if (f.forma === 'quadro') ctx.rect(cx - s, cy - s, s * 2, s * 2)
  else if (f.forma === 'rombo') { ctx.moveTo(cx, cy - s * 1.25); ctx.lineTo(cx + s * 1.25, cy); ctx.lineTo(cx, cy + s * 1.25); ctx.lineTo(cx - s * 1.25, cy); ctx.closePath() }
  else { ctx.moveTo(cx, cy - s * 1.2); ctx.lineTo(cx + s * 1.2, cy + s); ctx.lineTo(cx - s * 1.2, cy + s); ctx.closePath() }
  ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(8,10,18,.95)'; ctx.stroke()
  ctx.fillStyle = f.colore; ctx.fill()
}

// mostra solo quello che si è visto, e i punti che servono: dove sei, dov'è la scala, chi ha la chiave
// `mappaGrande` (la 🗺️ della barra): la stessa, al centro e grande quanto lo schermo lascia; il campo sotto si scurisce
export function disegnaMinimappa(ctx, corsa, L, A, grande) {
  const liv = corsa.livello
  // la piccola è uno zoom attorno all'eroe (FINESTRA celle per lato, o tutto il piano se è più piccolo): per vedere tutto c'è la grande
  const vw = grande ? liv.largo : Math.min(liv.largo, FINESTRA), vh = grande ? liv.alto : Math.min(liv.alto, FINESTRA)
  const vx0 = grande ? 0 : Math.max(0, Math.min(liv.largo - vw, Math.floor(corsa.eroe.x - vw / 2)))
  const vy0 = grande ? 0 : Math.max(0, Math.min(liv.alto - vh, Math.floor(corsa.eroe.y - vh / 2)))
  const p = grande
    ? Math.max(3, Math.min((L - 36) / liv.largo, (A - 120) / liv.alto))
    : Math.min(8, 160 / Math.max(vw, vh))
  const larg = vw * p, alt = vh * p
  const x0 = grande ? Math.round((L - larg) / 2) : L - larg - 12
  const y0 = grande ? Math.round((A - alt) / 2) - 10 : 12
  const s = Math.max(3, Math.min(6, p * 0.9))    // il raggio dei punti: mai più piccoli di una macchia che si legge
  ctx.save()
  if (grande) {
    ctx.fillStyle = 'rgba(4,5,10,.6)'
    ctx.fillRect(0, 0, L, A)
  }
  ctx.fillStyle = 'rgba(10,14,28,.88)'
  ctx.beginPath(); ctx.roundRect(x0 - 6, y0 - 6, larg + 12, alt + 12, 6); ctx.fill()
  ctx.strokeStyle = 'rgba(214,190,130,.55)'
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.roundRect(x0 - 6.5, y0 - 6.5, larg + 13, alt + 13, 6); ctx.stroke()
  ctx.save()
  ctx.beginPath(); ctx.rect(x0, y0, larg, alt); ctx.clip()
  const visto = (x, y) => x >= 0 && y >= 0 && x < liv.largo && y < liv.alto && corsa.visto[y * liv.largo + x]
  const muro = (x, y) => x < 0 || y < 0 || x >= liv.largo || y >= liv.alto || liv.a(x, y) === ROCCIA
  // il pavimento visto, chiaro e caldo; i relitti scuri e l'acqua azzurra (si vede dove non si passa)
  for (let x = vx0; x < vx0 + vw; x++) for (let y = vy0; y < vy0 + vh; y++) {
    const v = liv.a(x, y)
    if (!visto(x, y) || v === ROCCIA) continue
    ctx.fillStyle = v === RELITTO ? '#5d5448' : v === ACQUA ? '#3f86c4' : '#cdbf9c'
    ctx.fillRect(x0 + (x - vx0) * p, y0 + (y - vy0) * p, p + 0.4, p + 0.4)
  }
  // il bordo dei muri: una linea scura dove un pavimento visto tocca la roccia, la sagoma della stanza
  ctx.strokeStyle = '#2b2218'
  ctx.lineWidth = Math.max(1, Math.min(2, p * 0.4))
  ctx.beginPath()
  for (let x = vx0; x < vx0 + vw; x++) for (let y = vy0; y < vy0 + vh; y++) {
    if (!visto(x, y) || liv.a(x, y) === ROCCIA) continue
    const px = x0 + (x - vx0) * p, py = y0 + (y - vy0) * p
    if (muro(x, y - 1)) { ctx.moveTo(px, py); ctx.lineTo(px + p, py) }
    if (muro(x, y + 1)) { ctx.moveTo(px, py + p); ctx.lineTo(px + p, py + p) }
    if (muro(x - 1, y)) { ctx.moveTo(px, py); ctx.lineTo(px, py + p) }
    if (muro(x + 1, y)) { ctx.moveTo(px + p, py); ctx.lineTo(px + p, py + p) }
  }
  ctx.stroke()
  const usate = new Set()
  for (const r of liv.robe) {
    // il custode della chiave si segna dov'è la sua casa, mai dov'è adesso (docs/sotterraneo/regole.md, «La luce»)
    const sx = r.che === 'mostro' && r.casa ? r.casa.x : r.x, sy = r.che === 'mostro' && r.casa ? r.casa.y : r.y
    if (r.presa || r.morto || !corsa.visto[sy * liv.largo + sx] || sx < vx0 || sy < vy0 || sx >= vx0 + vw || sy >= vy0 + vh) continue
    // un baule già aperto sparisce; la roba per terra si segna, perché ora va toccata e una spada dimenticata è persa
    const k = r.missione && !r.aperto ? 'missione'
      : r.che === 'mostro' && r.chiave ? 'chiave'
      : r.che === 'porta' && !r.aperta ? 'porta'
      : r.che === 'scala' ? 'scala'
      : r.che === 'portale' ? 'portale'
      : r.che === 'cosa' ? 'cosa'
      : r.che === 'forziere' && !r.aperto ? 'forziere' : null
    if (!k) continue
    usate.add(k)
    segno(ctx, FORME[k], x0 + (sx - vx0 + 0.5) * p, y0 + (sy - vy0 + 0.5) * p, s)
  }
  // tu: un tondo bianco col cerchio d'oro attorno, il punto più grande e che si trova subito
  const ex = x0 + (Math.floor(corsa.eroe.x) - vx0 + 0.5) * p, ey = y0 + (Math.floor(corsa.eroe.y) - vy0 + 0.5) * p
  ctx.beginPath(); ctx.arc(ex, ey, s + 3, 0, Math.PI * 2)
  ctx.lineWidth = 2; ctx.strokeStyle = '#ffd86b'; ctx.stroke()
  ctx.beginPath(); ctx.arc(ex, ey, s, 0, Math.PI * 2)
  ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(8,10,18,.95)'; ctx.stroke()
  ctx.fillStyle = '#fff'; ctx.fill()
  ctx.restore()
  // la mappa grande ha la legenda: solo i segni che ci sono davvero in questo piano
  if (grande) {
    ctx.font = '13px "Emoji Gioco", system-ui, sans-serif'; ctx.textBaseline = 'middle'
    const voci = [['eroe', { colore: '#fff', forma: 'tondo', nome: 'Tu' }], ...[...usate].map(k => [k, FORME[k]])]
    const larghe = voci.map(([, f]) => 14 + 6 + ctx.measureText(f.nome).width + 14)
    let lx = Math.round((L - larghe.reduce((a, b) => a + b, 0)) / 2) + 7
    const ly = y0 + alt + 24
    voci.forEach(([, f], i) => {
      segno(ctx, f, lx, ly, 5)
      ctx.fillStyle = '#e8e2d0'; ctx.textAlign = 'left'; ctx.fillText(f.nome, lx + 12, ly)
      lx += larghe[i]
    })
  }
  ctx.restore()
}
