/* ── IL PORTONE ──
   Un varco nel pavimento, non una porta disegnata su una parete. In
   una griglia vista dall'alto un muro orizzontale offre una faccia su
   cui appoggiare un arco; un muro verticale no — è visto di taglio, e
   un architrave «in faccia» lì non ha superficie su cui stare.

   Qui non c'è nessuna faccia da disegnare: soglia, quattro stipiti
   d'angolo e un vuoto scuro, tutto piatto sul pavimento. Funziona
   identico qualunque sia il verso del corridoio, perché non deve
   voltarsi verso nessuno. Chiuso, il vuoto ha la sua serratura;
   aperto, i due battenti si vedono spalancati **nella stanza**, come
   li vedrebbe davvero chi guarda dall'alto. */
import { mescola, tondo } from '../../comune.js'
import { LATO, SIGILLI } from '../attrezzi.js'

export function portone(p, cosa, S = p.S) {
  const { x, y, aperto = false, lato = LATO, sigillo, sbarrata = false, sfondabile = false } = cosa
  const L = lato * S, h = L / 2
  const c = p.ctx
  const pietra = '#8b8071', pietraS = '#6f6455', pietraC = mescola(pietra, '#ffffff', 0.22)
  const T = sigillo && SIGILLI[sigillo]

  // l'ombra portata e la soglia: una lastra chiara che segna il
  // passaggio sul pavimento, non un muro
  p.velo(0.45, () => p.ellisse(x, y + L * 0.05, h * 1.02, h * 0.72, '#000000'))
  p.rett(x - h * 1.02, y - h * 0.9, L * 1.02, L * 0.9, pietraS)
  p.rett(x - h * 1.02, y - h * 0.9, L * 1.02, L * 0.9 * 0.18, pietraC)

  // i quattro stipiti d'angolo: il «telaio» del varco. Ai quattro
  // angoli invece che su due lati soli funzionano identici qualunque
  // sia il verso del corridoio
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const bx = x + sx * h * 0.84, by = y + sy * h * 0.72, b = L * 0.22
    p.rett(bx - b / 2 + L * 0.03, by - b / 2 + L * 0.045, b, b, pietraS)
    p.rett(bx - b / 2, by - b / 2, b, b, pietra)
    p.rett(bx - b / 2, by - b / 2, b, b * 0.3, pietraC)
  }

  // il sigillo, se la porta ne ha uno: una borchia sull'architrave, la
  // stessa tinta della chiave che apre. Sta sul telaio, non sulla
  // serratura, così resta visibile anche a battenti spalancati
  if (T) tondo(p, x, y - h * 0.86, L * 0.1, L * 0.1, T, mescola(T, '#000000', 0.5), Math.max(1, L * 0.03))

  // il vuoto: scuro al centro, sfumato ai bordi — dice «qui si passa
  // sotto» senza bisogno di un arco disegnato in prospettiva
  const vg = c.createRadialGradient(x, y, h * 0.08, x, y, h * 0.92)
  vg.addColorStop(0, '#100d0a'); vg.addColorStop(0.7, '#100d0aee'); vg.addColorStop(1, '#100d0a00')
  c.fillStyle = vg
  c.beginPath(); c.ellipse(x, y, h * 0.92, h * 0.68, 0, 0, 6.29); c.fill()

  if (aperto) {
    // i battenti spalancati **nella stanza**: due assi, ognuna
    // incernierata a uno stipite diverso e aperta dalla propria parte,
    // così restano due tavole distinte e non un'unica freccia
    const battente = (cx, cy, ang, colore) => {
      c.save(); c.translate(cx, cy); c.rotate(ang)
      p.velo(0.35, () => p.rett(0, -L * 0.01, L * 0.44, L * 0.15, '#000000'))
      p.rett(0, -L * 0.1, L * 0.4, L * 0.15, colore)
      p.rett(0, -L * 0.1, L * 0.4, L * 0.05, mescola(colore, '#ffffff', 0.22))
      p.rett(0, -L * 0.02, L * 0.4, L * 0.03, mescola(colore, '#000000', 0.3))
      c.restore()
    }
    battente(x - h * 0.7, y - h * 0.55, -1.15, '#a2703f')
    battente(x - h * 0.7, y + h * 0.55, 1.15, '#8d5f33')
  } else if (sbarrata) {
    /* ── SBARRATA: DUE TRAVI INCHIODATE, E NESSUNA TOPPA ──
       Una toppa dice «cerca la chiave». Questa porta la chiave non ce
       l'ha e non ce l'avrà: dirlo con una serratura è mandare un
       bambino a girare la mappa per niente. Le due travi di traverso
       si leggono al primo colpo d'occhio — «di qui non si passa
       aprendo» — e i chiodi agli estremi dicono che qualcuno le ha
       messe lì apposta.
       Il legno è più chiaro del battente: deve staccarsi dal vuoto
       scuro anche quando la cella è in ombra. */
    const trave = (ang) => {
      c.save(); c.translate(x, y); c.rotate(ang)
      p.velo(0.4, () => p.rett(-L * 0.46, -L * 0.05, L * 0.92, L * 0.16, '#000000'))
      p.rett(-L * 0.46, -L * 0.08, L * 0.92, L * 0.16, '#a2703f')
      p.rett(-L * 0.46, -L * 0.08, L * 0.92, L * 0.05, mescola('#a2703f', '#ffffff', 0.3))
      p.rett(-L * 0.46, L * 0.03, L * 0.92, L * 0.05, mescola('#a2703f', '#000000', 0.28))
      /* i chiodi: due per trave, agli estremi, dove morde lo stipite */
      for (const v of [-1, 1])
        tondo(p, v * L * 0.38, 0, L * 0.035, L * 0.035, '#6b7280', '#3a3f4c', Math.max(1, L * 0.012))
      c.restore()
    }
    trave(-0.42); trave(0.42)
    /* ── E SE SI PUÒ BUTTARE GIÙ, SI VEDE CHE IL LEGNO HA CEDUTO ──
       Una crepa sola, in mezzo: non è decorazione, è la differenza fra
       «questa strada è chiusa» e «questa strada costa venti spallate».
       Le due cose si scrivono uguali nel livello (`chiave` che non
       esiste, più `forza`), quindi a schermo devono distinguersi. */
    if (sfondabile) {
      c.strokeStyle = '#2b2119'; c.lineWidth = Math.max(1, L * 0.03); c.lineCap = 'round'
      c.beginPath()
      c.moveTo(x - L * 0.1, y - L * 0.3)
      c.lineTo(x + L * 0.04, y - L * 0.06)
      c.lineTo(x - L * 0.06, y + L * 0.1)
      c.lineTo(x + L * 0.09, y + L * 0.3)
      c.stroke()
    }
  } else {
    // la toppa e gli anelli, sul vuoto: chiuso a chiave
    tondo(p, x, y, L * 0.1, L * 0.1, '#3a3f4c')
    tondo(p, x, y, L * 0.045, L * 0.045, '#c9a83c')
    for (const v of [-1, 1]) {
      c.strokeStyle = '#3a3f4c'; c.lineWidth = Math.max(1, L * 0.035)
      c.beginPath(); c.arc(x + v * L * 0.15, y + L * 0.02, L * 0.06, 0, 6.29); c.stroke()
    }
  }
}
