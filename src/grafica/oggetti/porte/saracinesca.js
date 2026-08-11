/* ── LA SARACINESCA ──
   La grata che scende dall'alto: `alzata` da 0 (giù, chiusa) a 1 (su,
   passa). Non gira come un cancello — **scorre**, e la si disegna in
   scorcio: chiusa occupa tutta la cella, alzata resta una fascia
   spessa in cima con le punte che pendono. È la porta che fa più paura
   di tutte, e per questo le punte sono smussate. */
import { mescola, poligono, tondo } from '../../comune.js'
import { LATO, LEGNO, SIGILLI } from '../attrezzi.js'

export function saracinesca(p, cosa, S = p.S) {
  const { x, y, alzata = 0, lato = LATO, sigillo } = cosa
  const L = lato * S, h = L / 2
  const a = Math.max(0, Math.min(1, alzata))
  const c = p.ctx
  // la guida nel pavimento: due scanalature ai lati
  for (const v of [-1, 1])
    p.rett(x + v * h * 0.86 - L * 0.05, y - h, L * 0.1, L, '#4a4640')
  // la grata: alta quanto la cella, tirata su di `a`
  const alt = L * (1 - a * 0.78)
  const cima = y - h
  c.save()
  c.beginPath(); c.rect(x - h, cima, L, alt); c.clip()
  // le sbarre verticali
  for (let i = 0; i <= 4; i++) {
    const bx = x - h * 0.82 + i * (L * 0.82 / 4)
    p.rett(bx - L * 0.035, cima, L * 0.07, alt, LEGNO.ferro)
    p.rett(bx - L * 0.035, cima, L * 0.025, alt, LEGNO.ferroL)
  }
  // le orizzontali
  for (let k = 0; k < 4; k++) {
    const by = cima + L * 0.1 + k * L * 0.24
    if (by > cima + alt) break
    p.rett(x - h * 0.86, by, L * 0.86, L * 0.05, LEGNO.ferroS)
  }
  c.restore()
  // le punte in fondo: smussate apposta — a punta di lancia facevano
  // paura, e chi gioca ha sei anni
  for (let i = 0; i <= 4; i++) {
    const bx = x - h * 0.82 + i * (L * 0.82 / 4)
    poligono(p, [[bx - L * 0.035, cima + alt], [bx + L * 0.035, cima + alt],
                 [bx, cima + alt + L * 0.07]], mescola(LEGNO.ferro, '#000000', 0.15))
  }
  // l'ombra sotto la grata alzata: dice che è sospesa
  if (a > 0.2) p.velo(0.3 * a, () => p.rett(x - h, cima + alt, L, L * 0.12, '#000000'))

  // il sigillo, se la grata ne ha uno: una placca agganciata alle
  // sbarre, ben visibile finché la saracinesca è giù — appena si alza
  // sparisce insieme al resto della grata, coerente col fatto che non è
  // più chiusa
  const T = sigillo && SIGILLI[sigillo]
  if (T && a < 0.15) tondo(p, x, y, L * 0.11, L * 0.11, T, mescola(T, '#000000', 0.5), Math.max(1, L * 0.03))
}
