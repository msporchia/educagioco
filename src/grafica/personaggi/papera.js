/* ═════ LA PAPERA ═════
   Non è un quarto quadrupede: le zampe sono due, il corpo è tondo e
   sta basso — quasi tutto pancia, niente slancio — e il segno che la
   fa riconoscere in un'occhiata, anche schiacciata a 36 px, è uno
   solo: il **becco arancione**, un cuneo piatto che sporge sempre in
   avanti. Senza quello un cerchio bianco con due zampette è soltanto
   una palla di pelo — ed è esattamente l'errore che ha fatto nascere
   questo file: nella storia di Bibi la papera era disegnata come un
   lupo, con l'emoji 🦆 appiccicata accanto a coprire la differenza.

   Usa comunque `bestia()` di `corpo.js` e non `persona()` — la scheda
   dice `quadrupede: true`, ma per `bestia()` non vuol dire «ha quattro
   zampe»: vuol dire «cammina rasoterra e non regge un'arma», ed è lì
   che stanno l'ombra per terra, il lampeggio rosso dell'errore, la
   caduta di lato quando è sconfitta. A `bestia()` non importa quante
   gambe disegni dentro `disegna()` — qui sono due, non quattro, e il
   passo (`sw`) le fa scattare a turno come per qualunque altro
   animale.

   Corpo basso e collo corto — il contrario del lupo, tutto slancio —
   coda a **ventaglio** invece che folta o sottile, zampe **palmate**
   invece che a cuscinetto. E una posa che nessun quadrupede può fare:
   **a mollo**, mezza immersa nell'acqua con solo il dorso e la testa
   fuori. Serve alla storia («Bibi allo stagno») e ignora `dir`, come
   `seduto` per il gatto e `ritto` per l'orso — una posa sola, sempre
   di fronte. */
import { capsula, poligono, tondo } from '../comune.js'
import { occhi } from '../segni.js'

export const MANTI = {
  bianca: {
    piuma: '#f5f1e4', piumaS: '#d8d1ba', piumaC: '#ffffff',
    pancia: '#ffffff',
    becco: '#f0a83c', beccoS: '#cf8a28',
    occhio: '#3a3230', bordo: '#5a5340',
  },
  germano: {
    // il maschio del germano reale: testa verde, petto vinato, dorso
    // grigio-bruno — la papera "da stagno" per antonomasia
    piuma: '#8a7452', piumaS: '#3f6e4a', piumaC: '#5e4c30',
    pancia: '#d9c49a',
    becco: '#e8c23c', beccoS: '#c9a028',
    occhio: '#241a12', bordo: '#2c2014',
  },
  gialla: {
    // il paperotto: giallo pulcino, becco più chiaro
    piuma: '#f2d84a', piumaS: '#d9b82e', piumaC: '#fff3ae',
    pancia: '#fff3c2',
    becco: '#e8822c', beccoS: '#c96a1e',
    occhio: '#3a3230', bordo: '#8a6a1a',
  },
  grigia: {
    piuma: '#a8adb5', piumaS: '#7c828c', piumaC: '#c8ccd2',
    pancia: '#dfe2e6',
    becco: '#e8963c', beccoS: '#c9782a',
    occhio: '#241a12', bordo: '#3a3d44',
  },
}

export const PAPERA = {
  taglia: 0.62, quadrupede: true,
  col: MANTI.bianca,
  disegna(q, s, C, dir, sw, stato) {
    const b = C.bordo, sp = 0.65 * s
    const bob = -Math.abs(sw) * 0.4 * s

    // il piede palmato: un ventaglio piatto invece della capsula a
    // cuscinetto di lupo, gatto e orso — è la seconda cosa, dopo il
    // becco, che dice "uccello" e non "bestia a quattro zampe"
    const piede = (x, y, avanti, col) => {
      capsula(q, x, y - 0.4 * s, 0.5 * s, 0.55 * s, 0.45 * s, col, b, sp * 0.55)
      poligono(q, [
        [x - 0.85 * s, y],
        [x + avanti * 0.3 * s, y - 0.55 * s],
        [x + avanti * 1.7 * s, y - 0.15 * s],
        [x + avanti * 1.6 * s, y + 0.45 * s],
        [x + avanti * 0.2 * s, y + 0.6 * s],
        [x - 0.85 * s, y + 0.3 * s],
      ], col, b, sp * 0.45)
    }

    // il becco: un cuneo piatto e sempre arancione, orientato con un
    // vettore (dx, dy) invece che con un verso solo — così la stessa
    // funzione lo punta avanti nel profilo e in giù di fronte, senza
    // due disegni diversi. Se a 36 px sparisce, la proporzione è
    // sbagliata: è la prima cosa da controllare nella vetrina.
    const becco = (r, dx, dy) => {
      const px = -dy * 0.35 * s, py = dx * 0.35 * s
      const mx = dx * 1.5 * s, my = dy * 1.5 * s
      const tx = dx * 2.7 * s, ty = dy * 2.7 * s
      poligono(r, [
        [px, py], [mx + px * 0.75, my + py * 0.75], [tx, ty],
        [mx - px * 0.75, my - py * 0.75], [-px, -py],
      ], C.becco, b, sp * 0.5)
      tondo(r, mx, my, 0.22 * s, 0.16 * s, C.beccoS)
    }

    // la coda a ventaglio: tre lamelle che si aprono, mai un ciuffo
    // folto come nel lupo o affusolato come nel gatto
    const coda = (bx, by, verso) => {
      for (const d of [-1, 0, 1])
        poligono(q, [
          [bx, by],
          [bx - verso * 1.7 * s, by + d * 1.3 * s - 1.3 * s],
          [bx - verso * 2.7 * s, by + d * 1.7 * s - 1.3 * s],
        ], d === 0 ? C.piumaC : C.piumaS, b, sp * 0.4)
    }

    if (stato === 'mollo') {
      // a mollo: l'acqua nasconde le zampe e mezzo corpo, resta fuori
      // solo il dorso — appiattito, non più tondo — e la testa
      const c = q.ctx
      c.fillStyle = '#bcd8e8b0'
      c.beginPath(); c.ellipse(0, -0.6 * s, 6.4 * s, 2.5 * s, 0, 0, 6.29); c.fill()
      coda(-3.6 * s, -2.4 * s, -1)
      capsula(q, 0, -2.4 * s, 4.2 * s, 1.9 * s, 1.7 * s, C.piuma, b, sp)
      capsula(q, 0.4 * s, -1.6 * s, 2.6 * s, 0.7 * s, 0.6 * s, C.pancia)
      c.strokeStyle = '#ffffff90'; c.lineWidth = 0.35 * s; c.lineCap = 'round'
      for (const v of [-1, 1]) {
        c.beginPath()
        c.moveTo(v * 2.4 * s, -0.2 * s)
        c.quadraticCurveTo(v * 4 * s, -0.7 * s, v * 5.6 * s, -0.1 * s)
        c.stroke()
      }
      q.in(2.4 * s, -4.4 * s, r => {
        tondo(r, 0, 0, 1.9 * s, 1.8 * s, C.piuma, b, sp)
        becco(r, 1, 0.15)
        if (stato === 'ko') occhi(r, s, 0.85, -0.3, 0.5, 'ko')
        else tondo(r, 0.75 * s, -0.3 * s, 0.48 * s, 0.52 * s, C.occhio, b, sp * 0.4)
      })
      return
    }

    if (dir === 'dx') {
      // di profilo: il becco si vede meglio da qui, il collo corto si
      // allunga appena per portarlo avanti, la coda a ventaglio resta
      // dietro e bassa — mai alta come quella del lupo
      const d = sw * 1.3 * s
      piede(-0.7 * s - d, 0, -1, C.beccoS)
      coda(-3.3 * s, -3.2 * s + bob, -1)
      capsula(q, 0, -3 * s + bob, 3.6 * s, 2.3 * s, 1.9 * s, C.piuma, b, sp)
      // l'ala chiusa: una lama scura appoggiata sul fianco, non un arto
      capsula(q, -0.2 * s, -3.4 * s + bob, 1.8 * s, 1 * s, 0.8 * s, C.piumaS, b, sp * 0.5)
      capsula(q, 0.5 * s, -2 * s + bob, 2.4 * s, 0.9 * s, 0.8 * s, C.pancia)
      piede(0.7 * s + d, 0, 1, C.becco)
      capsula(q, 3 * s, -5 * s + bob, 1.3 * s, 1.5 * s, 1.1 * s, C.piuma, b, sp)
      q.in(4.1 * s, -6.2 * s + bob, r => {
        tondo(r, 0, 0, 1.9 * s, 1.8 * s, C.piuma, b, sp)
        becco(r, 1, 0)
        if (stato === 'ko') occhi(r, s, -0.2, -0.4, 0.55, stato)
        else {
          tondo(r, 0.6 * s, -0.4 * s, 0.5 * s, 0.55 * s, C.occhio, b, sp * 0.4)
          tondo(r, 0.72 * s, -0.32 * s, 0.22 * s, 0.28 * s, '#20182e')
        }
      })
      return
    }

    if (dir === 'su') {
      // di spalle: niente becco da vedere, resta la sagoma — dorso
      // tondo, ali chiuse sui fianchi, la coda a ventaglio in cima
      for (const v of [-1, 1]) piede(v * 1.5 * s, 0, v, C.beccoS)
      coda(0, -4.2 * s + bob, 1)
      capsula(q, 0, -3.4 * s + bob, 3.8 * s, 2.9 * s, 2.3 * s, C.piuma, b, sp)
      for (const v of [-1, 1])
        capsula(q, v * 2.9 * s, -3.6 * s + bob, 0.9 * s, 1.9 * s, 0.8 * s, C.piumaS, b, sp * 0.55)
      q.in(0, -6.4 * s + bob, r => tondo(r, 0, 0, 1.6 * s, 1.5 * s, C.piuma, b, sp))
      return
    }

    // di faccia: il becco punta in giù verso chi guarda, le due zampe
    // palmate si vedono ai lati, larghe — è la posa più "papera" delle
    // quattro insieme al profilo
    capsula(q, 0, -3.4 * s + bob, 3.4 * s, 2.6 * s, 2.1 * s, C.piuma, b, sp)
    for (const v of [-1, 1])
      capsula(q, v * 2.6 * s, -3.6 * s + bob, 0.9 * s, 1.7 * s, 0.7 * s, C.piumaS, b, sp * 0.5)
    capsula(q, 0.2 * s, -2.4 * s + bob, 2.2 * s, 1 * s, 0.9 * s, C.pancia)
    for (const v of [-1, 1]) {
      const alza = (v < 0 ? sw : -sw) > 0 ? 0.5 * s : 0
      piede(v * 1.3 * s, -alza, v, C.becco)
    }
    q.in(0, -6.2 * s + bob, r => {
      tondo(r, 0, 0, 2 * s, 1.9 * s, C.piuma, b, sp)
      becco(r, 0, 1)
      if (stato === 'ko') occhi(r, s, 0.9, -0.5, 0.6, stato)
      else for (const v of [-1, 1]) {
        tondo(r, v * 0.85 * s, -0.5 * s, 0.55 * s, 0.6 * s, C.occhio, b, sp * 0.4)
        tondo(r, v * 0.85 * s + 0.14 * s, -0.42 * s, 0.24 * s, 0.3 * s, '#20182e')
      }
    })
  },
}
