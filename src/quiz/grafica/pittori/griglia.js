// { che:'griglia', larghezza, altezza, celle:[[x,y]], segni:[{x,y,em}], etichette }; [0,0] è A1, x cresce a destra, y in basso.
// il contorno della figura è marcato (solo i lati senza vicino): il perimetro si conta guardandolo, l'area coi quadretti uno per uno.

const PASSI = [[1, 0], [-1, 0], [0, 1], [0, -1]]

function foglio(p) { // rettangolo chiaro con angoli smussati: la griglia si stacca dal fondo scuro
  const c = p.ctx
  c.fillStyle = '#f7faff'
  c.beginPath()
  if (c.roundRect) c.roundRect(1, 1, 98, 98, 8)
  else c.rect(1, 1, 98, 98)
  c.fill()
}

export function griglia(p, scena) {
  const {
    larghezza = 5, altezza = 5,
    celle = [], segni = [], etichette = false,
  } = scena || {}

  foglio(p)

  // le etichette vogliono una fascia sopra e una a sinistra
  const sx = etichette ? 14 : 7
  const sy = etichette ? 13 : 7
  const fine = 7
  const lato = Math.min((100 - sx - fine) / larghezza, (100 - sy - fine) / altezza)
  const x0 = sx + ((100 - sx - fine) - lato * larghezza) / 2
  const y0 = sy + ((100 - sy - fine) - lato * altezza) / 2
  const mx = x => x0 + (x + 0.5) * lato
  const my = y => y0 + (y + 0.5) * lato

  for (const [x, y] of celle) p.rett(x0 + x * lato, y0 + y * lato, lato, lato, '#ffdfa2') // caselle piene, sotto a tutto

  const sottile = Math.max(0.5, lato * 0.045)
  for (let i = 0; i <= larghezza; i++)
    p.linea([{ x: x0 + i * lato, y: y0 }, { x: x0 + i * lato, y: y0 + altezza * lato }], '#b9c8e6', sottile)
  for (let j = 0; j <= altezza; j++)
    p.linea([{ x: x0, y: y0 + j * lato }, { x: x0 + larghezza * lato, y: y0 + j * lato }], '#b9c8e6', sottile)

  if (celle.length) { // il contorno: solo i lati che non hanno un vicino
    const dentro = new Set(celle.map(([x, y]) => x + ',' + y))
    const grosso = Math.max(1.4, lato * 0.16)
    for (const [x, y] of celle) {
      for (const [dx, dy] of PASSI) {
        if (dentro.has((x + dx) + ',' + (y + dy))) continue
        const a = { x: x0 + (x + Math.max(dx, 0)) * lato, y: y0 + (y + Math.max(dy, 0)) * lato }
        const b = {
          x: a.x + (dy ? lato : 0),
          y: a.y + (dx ? lato : 0),
        }
        p.linea([a, b], '#e08a2e', grosso)
      }
    }
  }

  if (etichette) { // lettere sopra, numeri di lato
    const dim = Math.min(lato * 0.6, 7.5)
    for (let i = 0; i < larghezza; i++)
      p.testo('ABCDEF'[i] || '?', mx(i), y0 - dim * 0.85, '#5d6c92', dim, 800)
    for (let j = 0; j < altezza; j++)
      p.testo(String(j + 1), x0 - dim * 0.9, my(j), '#5d6c92', dim, 800)
  }

  for (const s of segni) // le cose posate nelle caselle
    p.testo(s.em, mx(s.x), my(s.y) + lato * 0.05, '#22304f', lato * 0.7, 500)
}

export const PITTORI_GRIGLIA = { griglia }
