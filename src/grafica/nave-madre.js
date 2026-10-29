// La nave madre, il boss: i punti da cui partono i colpi (i due cannoni sotto le ali, la cupola del comandante), quelli che il
// gioco usa e che la nave in 3D rispetta (grafica/spazio3d/madre.js). Chi colpisce chi lo decide il gioco.

// i punti del disegno in coordinate locali (unità di R), rotati con la nave
function inSchermo(m, lx, ly) {
  const co = Math.cos(m.inclina || 0), si = Math.sin(m.inclina || 0)
  return { x: m.x + (lx * co - ly * si) * m.r, y: m.y + (lx * si + ly * co) * m.r }
}

// il centro del cannone (sinistro: lato = -1, destro: +1), dove va il raggio che rimbalza
export const cannoneDi = (m, lato) => inSchermo(m, lato * 1.3, 0.475)
export const cupolaDi = m => inSchermo(m, 0, -0.3)
