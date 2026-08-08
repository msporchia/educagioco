/* ═══════════════════════════════════════════════════════════════════
   IL PITTORE DELLA GRIGLIA

   Un foglio a quadretti dentro il quadrato 100×100 del riquadro. Sa
   disegnare una scena sola, e tutto quello che serve al modulo sta nei
   suoi campi:

     {
       che: 'griglia',
       larghezza: 5, altezza: 5,        // quante caselle
       celle: [[1,2],[2,2]],            // le caselle colorate (la figura)
       segni: [{ x:0, y:3, em:'⭐' }],   // le cose posate nelle caselle
       etichette: true,                 // le lettere sopra e i numeri di lato
     }

   `x` cresce verso destra e `y` verso il basso: la casella [0,0] è
   quella in alto a sinistra, cioè A1. Questa è l'unica convenzione da
   ricordare, e vale identica nel modulo.

   LE ETICHETTE SOLO NEL SOGGETTO. Il riquadro di una risposta è largo
   118 pixel: lettere e numeri lì dentro sarebbero macchie. Chi disegna
   non lo decide — lo dice la scena — ma il campo esiste apposta per
   questo.

   IL BORDO DELLA FIGURA È MARCATO. Il perimetro si conta guardando il
   contorno: senza una linea grossa che segue solo i lati esterni, la
   domanda «quanto è lungo il bordo» chiede di indovinare. I quadretti
   restano visibili anche dentro la figura, perché l'area si conta
   uno per uno.
   ═══════════════════════════════════════════════════════════════════ */

const PASSI = [[1, 0], [-1, 0], [0, 1], [0, -1]]

/* il foglio: un rettangolo chiaro con gli angoli smussati, così la
   griglia si stacca dal fondo scuro della scheda */
function foglio(p) {
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

  /* le etichette vogliono una fascia sopra e una a sinistra */
  const sx = etichette ? 14 : 7
  const sy = etichette ? 13 : 7
  const fine = 7
  const lato = Math.min((100 - sx - fine) / larghezza, (100 - sy - fine) / altezza)
  const x0 = sx + ((100 - sx - fine) - lato * larghezza) / 2
  const y0 = sy + ((100 - sy - fine) - lato * altezza) / 2
  const mx = x => x0 + (x + 0.5) * lato
  const my = y => y0 + (y + 0.5) * lato

  /* le caselle piene, sotto a tutto */
  for (const [x, y] of celle) p.rett(x0 + x * lato, y0 + y * lato, lato, lato, '#ffdfa2')

  /* i quadretti, sopra il colore: l'area si conta uno per uno */
  const sottile = Math.max(0.5, lato * 0.045)
  for (let i = 0; i <= larghezza; i++)
    p.linea([{ x: x0 + i * lato, y: y0 }, { x: x0 + i * lato, y: y0 + altezza * lato }], '#b9c8e6', sottile)
  for (let j = 0; j <= altezza; j++)
    p.linea([{ x: x0, y: y0 + j * lato }, { x: x0 + larghezza * lato, y: y0 + j * lato }], '#b9c8e6', sottile)

  /* il contorno della figura: solo i lati che non hanno un vicino */
  if (celle.length) {
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

  /* le lettere sopra e i numeri di lato */
  if (etichette) {
    const dim = Math.min(lato * 0.6, 7.5)
    for (let i = 0; i < larghezza; i++)
      p.testo('ABCDEF'[i] || '?', mx(i), y0 - dim * 0.85, '#5d6c92', dim, 800)
    for (let j = 0; j < altezza; j++)
      p.testo(String(j + 1), x0 - dim * 0.9, my(j), '#5d6c92', dim, 800)
  }

  /* le cose posate nelle caselle */
  for (const s of segni)
    p.testo(s.em, mx(s.x), my(s.y) + lato * 0.05, '#22304f', lato * 0.7, 500)
}

export const PITTORI_GRIGLIA = { griglia }
