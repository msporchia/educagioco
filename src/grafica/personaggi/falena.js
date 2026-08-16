/* ═════ LA FALENA ═════
   Nasce da un difetto vero: nelle storie del generale le falene sono
   una regola del mondo («vanno dove c'è luce», il capitolo 3 dei
   Fondi ci costruisce sopra un intero enigma) ma **non hanno un
   pittore loro** — sui livelli spenti compaiono con `chi: 'goblin'`,
   e il commento lì dice esplicitamente «il giorno che arriva un
   pittore `falena` si cambia questa parola e basta». Eccolo.

   Non cammina: **vola**, e la differenza deve leggersi dalla sagoma,
   non da un'etichetta. Quattro ali a farfalla — due grandi sopra, due
   piccole sotto — un corpicino peloso in mezzo, due antenne piumate.
   Niente braccia, niente gambe da vedere: usa `bestia()` come lupo,
   gatto e papera (`quadrupede: true`, che per `bestia()` vuol dire
   solo «non regge un'arma»), ma **`sw` non muove zampe: muove le
   ali**. Il battito è sempre acceso e più veloce del passo — una
   falena non sta mai ferma sulle ali, nemmeno in `attesa` — e pesca il
   suo ritmo da `q.tempo`, la stessa orologeria che fa tremare la
   campana quando suona.

   Colori tenui e pallidi apposta: bianco-crema, mai gli stessi verdi
   del goblin e dell'orco, così un bambino non le scambia per mostri
   della stessa famiglia. */
import { poligono, tondo } from '../comune.js'
import { occhi } from '../segni.js'

export const FALENA = {
  taglia: 0.56, quadrupede: true,
  col: {
    ala: '#d8d0ba', alaS: '#b2a684', alaC: '#f2ecd8',
    corpo: '#8f8266', corpoS: '#6b604a',
    occhio: '#241f18', bordo: '#453c2c',
  },
  disegna(q, s, C, dir, sw, stato) {
    const b = C.bordo, sp = 0.55 * s
    const t = q.tempo || 0
    // lo sbattito: fra 0.3 (ali quasi chiuse) e 1 (spalancate), mai a
    // zero — è quello che dice «viva» anche da ferma
    const apri = 0.32 + 0.68 * Math.abs(Math.sin(t * 15 + s))
    const bob = -Math.abs(sw) * 0.3 * s

    /* un'ala: un cuneo a cinque punte dalla base stretta (attaccata al
       corpo) alla punta larga. `apri` allontana la punta dal corpo —
       è tutto il meccanismo del battito, niente rotazioni */
    const ala = (v, alto, largo) => {
      const px = v * largo * (0.68 + apri * 0.5) * s
      const py = -alto * (0.5 + apri * 0.16) * s
      poligono(q, [
        [0, -1 * s],
        [v * 1.1 * s, -1.5 * s],
        [px, py],
        [v * largo * 0.32 * s, -alto * 0.9 * s],
        [v * 0.5 * s, -2.3 * s],
      ], v < 0 ? C.alaS : C.ala, b, sp * 0.6)
      // una macchia più chiara: senza, un'ala tinta unita si legge
      // come un triangolo di carta, non come un'ala
      tondo(q, px * 0.68, py * 0.72, largo * 0.22 * s, largo * 0.15 * s, C.alaC)
    }
    // le antenne piumate: un tratto curvo più tre trattini corti — il
    // pettine che le distingue da un filo liscio
    const antenna = (r, v) => {
      const c = r.ctx
      c.strokeStyle = b; c.lineWidth = 0.34 * s; c.lineCap = 'round'
      c.beginPath()
      c.moveTo(v * 0.25 * s, 0)
      c.quadraticCurveTo(v * 1.5 * s, -2 * s, v * 2.3 * s, -1.5 * s)
      c.stroke()
      for (const k of [0.42, 0.72, 1]) {
        const px = v * (0.25 + k * 2.05) * s, py = -k * 1.75 * s
        c.beginPath(); c.moveTo(px, py); c.lineTo(px + v * 0.4 * s, py - 0.35 * s); c.stroke()
      }
    }

    if (dir === 'su') {
      // di spalle: le quattro ali spiegate, il corpo appena visibile
      for (const v of [-1, 1]) { ala(v, 6.2, 5.2); ala(v, 4, 3.5) }
      q.rett(-0.9 * s, -4.6 * s + bob, 1.8 * s, 3.2 * s, C.corpo)
      return
    }

    if (dir === 'dx') {
      /* di profilo, a riposo: le ali si ripiegano a tenda sul dorso —
         è così che si vede ferma di lato una falena vera, non a ali
         spiegate come di fronte. Una forma sola, non due mirate: due
         cunei mirati all'origine facevano una "V", non un'ala */
      const largo = 6.2 * (0.85 + apri * 0.3) * s
      const alto = 3.6 * (0.85 + apri * 0.25) * s
      poligono(q, [
        [-largo * 0.75, -0.6 * s], [-largo * 0.15, -alto],
        [largo * 0.55, -alto * 0.62], [largo * 0.35, -0.4 * s],
      ], C.ala, b, sp * 0.65)
      tondo(q, largo * 0.05, -alto * 0.55, largo * 0.16, largo * 0.11, C.alaC)
      // il corpo, che sbuca da sotto la tenda
      q.rett(-largo * 0.4, -2.4 * s + bob, largo * 0.9, 1.3 * s, C.corpo)
      q.in(largo * 0.42, -2.8 * s + bob, r => {
        antenna(r, 1)
        tondo(r, 0.6 * s, 0, 1.1 * s, 1 * s, C.corpoS, b, sp)
        if (stato === 'ko') occhi(r, s, 0.3, -0.1, 0.4, stato)
        else tondo(r, 0.85 * s, -0.15 * s, 0.3 * s, 0.32 * s, C.occhio)
      })
      return
    }

    // di fronte: due paia d'ali, il corpo peloso al centro, le due
    // antenne piumate sopra la testa — la sagoma a farfalla è quello
    // che deve leggersi per primo, a 36 px prima ancora del resto
    for (const v of [-1, 1]) { ala(v, 6.4, 5.4); ala(v, 4.2, 3.7) }
    q.rett(-1 * s, -4.8 * s + bob, 2 * s, 3.6 * s, C.corpo)
    q.in(0, -6.6 * s + bob, r => {
      for (const v of [-1, 1]) antenna(r, v)
      tondo(r, 0, 0, 1.5 * s, 1.4 * s, C.corpoS, b, sp)
      if (stato === 'ko') occhi(r, s, 0.5, -0.1, 0.4, stato)
      else for (const v of [-1, 1]) tondo(r, v * 0.5 * s, -0.1 * s, 0.3 * s, 0.32 * s, C.occhio)
    })
  },
}
