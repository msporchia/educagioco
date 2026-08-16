/* ═══════════════════════════════════════════════════════════════════
   I CORPI DEI MOSTRI — dieci bestie della stessa famiglia.

   Stesso paio d'occhi tondi, stessa taglia: cambia il corpo e cambia la
   cattiveria. Sono disegnate a mano e non emoji perché le emoji cambiano
   faccia da telefono a telefono e non stanno insieme al resto del campo.

   Chi sono — nome, resistenza, se volano — sta in `data/mostri.js`,
   indicizzato con lo stesso `id`. Qui c'è solo come si disegnano.

   ── la firma, che è un contratto ──
   Un pittore di mostro è `(p, s)`: il pennello e l'unità di misura.
   Disegna **attorno all'origine**, in coordinate locali (chi lo chiama
   ha già spostato e fatto ondeggiare), non tocca la barra della vita e
   non sa se quel mostro vola: quelle sono cose di `mostro.js`. Se serve
   il tempo per animarlo, è `p.tempo`.

   Questo file è **isolato apposta**: la tabella `BESTIE` si sostituisce
   con un'altra cambiando una riga sola di `mostro.js`.
   ═══════════════════════════════════════════════════════════════════ */


function occhi(p, s, dx = 2.4, cattivo = false) {
  p.ellisse(-dx * s, -1.6 * s, 2.1 * s, 2.4 * s, '#fff')
  p.ellisse(dx * s, -1.6 * s, 2.1 * s, 2.4 * s, '#fff')
  p.ellisse(-dx * s + 0.3 * s, -1.2 * s, 1 * s, 1.2 * s, '#1b1430')
  p.ellisse(dx * s + 0.3 * s, -1.2 * s, 1 * s, 1.2 * s, '#1b1430')
  if (!cattivo) return
  p.ctx.strokeStyle = '#1b1430'; p.ctx.lineWidth = 1.1 * s; p.ctx.lineCap = 'round'
  p.ctx.beginPath()
  p.ctx.moveTo(-dx * s - 2 * s, -4.6 * s); p.ctx.lineTo(-dx * s + 1.4 * s, -3.4 * s)
  p.ctx.moveTo(dx * s + 2 * s, -4.6 * s); p.ctx.lineTo(dx * s - 1.4 * s, -3.4 * s)
  p.ctx.stroke()
}

export const BESTIE = {
  slime: (p, s) => {
    p.ctx.fillStyle = '#7b4fd4'; p.ctx.beginPath()
    p.ctx.moveTo(-7 * s, 5 * s)
    p.ctx.quadraticCurveTo(-8 * s, -8 * s, 0, -8 * s)
    p.ctx.quadraticCurveTo(8 * s, -8 * s, 7 * s, 5 * s)
    p.ctx.closePath(); p.ctx.fill()
    p.ellisse(-2.4 * s, -3.6 * s, 2.6 * s, 2 * s, '#a97ef0')
    occhi(p, s)
  },
  fantasma: (p, s) => {
    p.ctx.fillStyle = '#e8eaf6'; p.ctx.beginPath()
    p.ctx.moveTo(-6.4 * s, 4 * s); p.ctx.lineTo(-6.4 * s, -1.6 * s)
    p.ctx.arc(0, -1.6 * s, 6.4 * s, Math.PI, 0); p.ctx.lineTo(6.4 * s, 4 * s)
    for (let i = 0; i < 3; i++)
      p.ctx.quadraticCurveTo((4.3 - i * 4.3) * s, 7.6 * s, (2.1 - i * 4.3) * s, 4 * s)
    p.ctx.closePath(); p.velo(0.93, () => p.ctx.fill())
    occhi(p, s)
  },
  pipistrello: (p, s) => {
    p.ctx.fillStyle = '#4b3a63'
    for (const v of [-1, 1]) {
      p.ctx.beginPath(); p.ctx.moveTo(0, 0)
      p.ctx.quadraticCurveTo(v * 6 * s, -6 * s, v * 9 * s, -1 * s)
      p.ctx.quadraticCurveTo(v * 5.5 * s, 1 * s, 0, 4 * s); p.ctx.fill()
    }
    p.ellisse(0, 0, 6.2 * s, 6.4 * s, '#7d63a0')
    p.ellisse(-1.8 * s, -2 * s, 2.6 * s, 2 * s, '#9a80bd')
    p.figura([[-4.6 * s, -4 * s], [-2 * s, -8.6 * s], [-0.6 * s, -4 * s]], '#7d63a0')
    p.figura([[4.6 * s, -4 * s], [2 * s, -8.6 * s], [0.6 * s, -4 * s]], '#7d63a0')
    occhi(p, s, 2.2, true)
  },
  ragno: (p, s) => {
    p.ctx.strokeStyle = '#2c2438'; p.ctx.lineWidth = 1.4 * s; p.ctx.lineCap = 'round'
    for (const v of [-1, 1]) for (let i = 0; i < 3; i++) {
      p.ctx.beginPath(); p.ctx.moveTo(0, 1 * s)
      p.ctx.quadraticCurveTo(v * (7 + i * 1.6) * s, (-2 + i * 2.6) * s, v * (9 + i * 0.8) * s, (2 + i * 2.4) * s)
      p.ctx.stroke()
    }
    p.ellisse(0, 0, 6 * s, 5.4 * s, '#3c3350')
    p.ellisse(-1.6 * s, -1.6 * s, 2.6 * s, 2 * s, '#584a70')
    occhi(p, s, 2, true)
  },
  golem: (p, s) => {
    p.figura([[-6.6 * s, 5 * s], [-7.4 * s, -3 * s], [-3.4 * s, -7.4 * s],
              [3.4 * s, -7.4 * s], [7.4 * s, -3 * s], [6.6 * s, 5 * s]], '#6f6a58')
    p.figura([[-6.6 * s, 5 * s], [-7.4 * s, -3 * s], [-3.4 * s, -7.4 * s],
              [-1 * s, -7.4 * s], [-2 * s, 5 * s]], '#8d8776')
    p.rett(-5.4 * s, -5.6 * s, 2 * s, 2 * s, '#a8422f')
    p.rett(3.4 * s, -4.6 * s, 2 * s, 2 * s, '#a8422f')
    occhi(p, s, 2.4, true)
  },
  drago: (p, s) => {
    // ali da pipistrello aperte ai lati, con le dita: in alto sembravano
    // corna e il drago pareva un toro
    const battito = Math.sin(p.tempo * 5) * 0.22
    for (const v of [-1, 1]) p.in(0, -1 * s, q => {
      q.figura([[0, 0], [v * 6 * s, -6.4 * s], [v * 12.4 * s, -4.6 * s],
                [v * 11 * s, 0.6 * s], [v * 7 * s, -1 * s], [v * 8.6 * s, 2.6 * s],
                [v * 4 * s, 1.6 * s]], '#8f3423')
      q.figura([[0, 0], [v * 5 * s, -4.6 * s], [v * 9 * s, -3.4 * s],
                [v * 6.6 * s, 0.4 * s]], '#a8422f')
    }, battito * v)
    p.ellisse(0, 0, 6.4 * s, 6 * s, '#c9563c')
    p.ellisse(-1.8 * s, -1.8 * s, 2.6 * s, 2 * s, '#e0765c')
    p.figura([[-3.6 * s, -4.8 * s], [-2.4 * s, -8.4 * s], [-1 * s, -5.2 * s]], '#f2d24b')
    p.figura([[3.6 * s, -4.8 * s], [2.4 * s, -8.4 * s], [1 * s, -5.2 * s]], '#f2d24b')
    p.figura([[0, 2 * s], [2.6 * s, 5.4 * s], [-2.6 * s, 5.4 * s]], '#8f3423')  // muso
    occhi(p, s, 2.4, true)
  },
  /* piccolo, verde, tutto orecchie: il goblin è il nemico che si sente
     furbo. Corre davanti a tutti e cade per primo. */
  goblin: (p, s) => {
    p.figura([[-4.4 * s, -1.6 * s], [-9.6 * s, -6.4 * s], [-4 * s, -4.6 * s]], '#4f8f3f')
    p.figura([[4.4 * s, -1.6 * s], [9.6 * s, -6.4 * s], [4 * s, -4.6 * s]], '#4f8f3f')
    p.ellisse(0, 0.6 * s, 5.4 * s, 5.8 * s, '#6bb04c')
    p.ellisse(-1.6 * s, -1.4 * s, 2.4 * s, 1.9 * s, '#8ec96a')
    p.figura([[0, -0.4 * s], [1.8 * s, 2.2 * s], [-1.8 * s, 2.2 * s]], '#4f8f3f')  // naso
    p.ctx.strokeStyle = '#2f5c26'; p.ctx.lineWidth = 1.1 * s; p.ctx.lineCap = 'round'
    p.ctx.beginPath(); p.ctx.moveTo(-2.6 * s, 3.6 * s); p.ctx.lineTo(2.6 * s, 3.6 * s); p.ctx.stroke()
    p.figura([[1.4 * s, 3.6 * s], [2.4 * s, 3.6 * s], [1.9 * s, 5 * s]], '#f7f4ea')  // dentino
    occhi(p, s, 2.2, true)
  },
  /* grosso, spalle larghe, zanne in su: l'orco è il muro che arriva
     piano. Contro di lui una torre sola non basta mai. */
  orco: (p, s) => {
    // spalle larghe in basso e testa piccola incassata: è la forma che
    // dice «pesante» prima ancora che si veda la faccia
    p.ellisse(-6.4 * s, 3.4 * s, 3.4 * s, 3.6 * s, '#3d6630')     // braccia
    p.ellisse(6.4 * s, 3.4 * s, 3.4 * s, 3.6 * s, '#3d6630')
    p.figura([[-8.6 * s, 6.4 * s], [-6.6 * s, -1.6 * s], [-3.2 * s, -5.4 * s],
              [3.2 * s, -5.4 * s], [6.6 * s, -1.6 * s], [8.6 * s, 6.4 * s]], '#4a7a3a')
    p.figura([[-8.6 * s, 6.4 * s], [-6.6 * s, -1.6 * s], [-3.2 * s, -5.4 * s],
              [-1 * s, -5.4 * s], [-2.4 * s, 6.4 * s]], '#5f9349')
    p.figura([[-3.2 * s, 3.4 * s], [-2 * s, 3.4 * s], [-2.6 * s, 0.8 * s]], '#f7f4ea')  // zanne
    p.figura([[3.2 * s, 3.4 * s], [2 * s, 3.4 * s], [2.6 * s, 0.8 * s]], '#f7f4ea')
    p.ctx.strokeStyle = '#2c4a24'; p.ctx.lineWidth = 1.2 * s
    p.ctx.beginPath(); p.ctx.moveTo(-3 * s, 3.6 * s); p.ctx.lineTo(3 * s, 3.6 * s); p.ctx.stroke()
    occhi(p, s, 2.6, true)
  },
  /* ossa e niente altro: gli occhi sono due buchi, e funzionano meglio
     di qualunque faccia cattiva */
  scheletro: (p, s) => {
    p.ctx.strokeStyle = '#e8e4d8'; p.ctx.lineWidth = 1.4 * s; p.ctx.lineCap = 'round'
    p.ctx.beginPath(); p.ctx.moveTo(0, 1.4 * s); p.ctx.lineTo(0, 6 * s); p.ctx.stroke()
    for (let i = 0; i < 3; i++) {
      const yy = (2.4 + i * 1.6) * s
      p.ctx.beginPath(); p.ctx.moveTo(-3.4 * s, yy); p.ctx.lineTo(3.4 * s, yy); p.ctx.stroke()
    }
    p.ellisse(0, -1.6 * s, 5.4 * s, 5 * s, '#f2eee2')
    p.rett(-2.6 * s, 2 * s, 5.2 * s, 1.8 * s, '#f2eee2')          // mascella
    p.ellisse(-2.2 * s, -1.8 * s, 1.9 * s, 2.1 * s, '#2b2438')    // orbite vuote
    p.ellisse(2.2 * s, -1.8 * s, 1.9 * s, 2.1 * s, '#2b2438')
    p.ellisse(-1.9 * s, -1.4 * s, 0.7 * s, 0.8 * s, '#ff6b6b')
    p.ellisse(2.5 * s, -1.4 * s, 0.7 * s, 0.8 * s, '#ff6b6b')
    p.figura([[0, 0.4 * s], [0.9 * s, 1.8 * s], [-0.9 * s, 1.8 * s]], '#2b2438')
  },
  /* mezza donna e mezzo uccello, ali larghe che battono: l'arpia è la
     cosa che vola e si vede da lontano */
  arpia: (p, s) => {
    const battito = Math.sin(p.tempo * 7) * 0.28
    for (const v of [-1, 1]) p.in(0, -1 * s, q => {
      q.figura([[0, 0], [v * 12 * s, -5 * s], [v * 13 * s, 0.6 * s],
                [v * 7 * s, 1.4 * s]], '#8a6bb0')
      q.figura([[0, 0], [v * 8 * s, -2.6 * s], [v * 8.6 * s, 0.4 * s]], '#a98ad0')
    }, battito * v)
    p.ellisse(0, 0, 5 * s, 5.6 * s, '#d8c9ea')
    p.ellisse(-1.6 * s, -1.8 * s, 2.2 * s, 1.8 * s, '#f0e6fa')
    p.figura([[0, 0.6 * s], [3.4 * s, 2 * s], [0, 3.2 * s]], '#f2c94c')   // becco
    p.figura([[-4.6 * s, -3.8 * s], [-2.2 * s, -8.4 * s], [-0.8 * s, -4.4 * s]], '#8a6bb0')
    p.figura([[4.6 * s, -3.8 * s], [2.2 * s, -8.4 * s], [0.8 * s, -4.4 * s]], '#8a6bb0')
    occhi(p, s, 2.2, true)
  },
}
