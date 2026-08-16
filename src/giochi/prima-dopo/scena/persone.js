/* ═══════════════════════════════════════════════════════════════════
   LE PERSONE DI QUESTO GIOCO — un bambino, una bambina, un grande

   Sono tre schede per `grafica/corpo.js`, esattamente come il cavaliere
   e la principessa: `persona()` mette gambe, braccia, ombra e stati, e
   qui c'è solo quello che li distingue. Non stanno in
   `grafica/personaggi/` perché quel cassetto è il mondo del Generale e
   del castello — spade, elmi, corone — e questo è il mondo di casa. Il
   giorno che serviranno a due giochi si spostano di lì, con un import in
   più e nient'altro (vedi la nota del prototipo in `dati/scene.js`).

   ── LA FACCIA È IL MOTIVO PER CUI ESISTE QUESTO FILE ──
   Un'emoji ha una faccia sola. Qui la faccia è un dato che chi mette in
   scena sceglie — `{ che: 'bimba', faccia: 'piange' }` — e `persona()`
   passa `cosa` alla testa senza sapere cosa ci sia dentro. È tutta la
   differenza fra «una bambina» e «una bambina che si è fatta male»:

     serena     la faccia di chi sta facendo una cosa qualsiasi
     contenta   l'arco della bocca in su, gli occhi stretti
     triste     la bocca in giù e le sopracciglia che cadono all'infuori
     piange     gli occhi chiusi ad arco, due lacrime, la bocca aperta
     spavento   occhi grandi, sopracciglia alte, la bocca a o
     assonnata  gli occhi chiusi dritti e la bocca dello sbadiglio
     arrabbiata le sopracciglia che scendono verso il naso, la bocca dura

   `arrabbiata` e `triste` sono l'una il rovescio dell'altra e si
   disegnano con lo stesso tratto girato: le sopracciglia cadono
   all'infuori in una e all'indentro nell'altra. È il segno più
   affidabile che si abbia — a settanta pixel la bocca si perde, le
   sopracciglia no.

   Le sopracciglia contano quanto la bocca: senza, «triste» e «serena»
   si distinguono solo da un arco di due pixel, e a vignetta piccola
   quell'arco non si legge.

   ── LE TAGLIE DICONO CHI È CHI ──
   `taglia` 0.78 i bambini, 1.06 il grande: in una vignetta dove ci sono
   tutti e due, chi è il bambino si capisce dalla statura prima che dai
   vestiti. È la stessa leva che nel castello distingue il goblin dal
   capitano.
   ═══════════════════════════════════════════════════════════════════ */
import { capsula, poligono, tondo, mescola } from '../../../grafica/comune.js'
import { occhi } from '../../../grafica/segni.js'

/* ─────────── la bocca ───────────
   Un tratto solo, ma è il tratto che porta l'informazione. */
function bocca(q, s, faccia) {
  const c = q.ctx
  if (faccia === 'piange') {
    // aperta: un ovale scuro, non un arco — chi piange forte apre la bocca
    tondo(q, 0, 3.1 * s, 0.95 * s, 1.15 * s, '#8c3a30')
    tondo(q, 0, 3.5 * s, 0.6 * s, 0.55 * s, '#d4726a')
    return
  }
  if (faccia === 'spavento') {
    tondo(q, 0, 3.2 * s, 0.75 * s, 0.9 * s, '#8c3a30')
    return
  }
  if (faccia === 'assonnata') {
    // lo sbadiglio: un ovale alto, non largo come quello dello spavento
    tondo(q, 0, 3.3 * s, 0.65 * s, 1.05 * s, '#8c3a30')
    return
  }
  c.strokeStyle = '#8c4530'; c.lineWidth = 0.8 * s; c.lineCap = 'round'
  c.beginPath()
  if (faccia === 'contenta') {
    c.moveTo(-1.2 * s, 2.6 * s); c.quadraticCurveTo(0, 4.3 * s, 1.2 * s, 2.6 * s)
  } else if (faccia === 'arrabbiata') {
    // dura e storta: una riga dritta sarebbe «serio», non «arrabbiato»
    c.lineWidth = 0.95 * s
    c.moveTo(-1.2 * s, 3.5 * s); c.quadraticCurveTo(0, 2.6 * s, 1.2 * s, 3.4 * s)
  } else if (faccia === 'triste') {
    c.moveTo(-1.1 * s, 3.7 * s); c.quadraticCurveTo(0, 2.3 * s, 1.1 * s, 3.7 * s)
  } else {
    c.moveTo(-0.85 * s, 3.1 * s); c.lineTo(0.85 * s, 3.1 * s)
  }
  c.stroke()
}

/* ─────────── le sopracciglia ───────────
   Non ci sono quando la faccia è serena: due trattini sopra gli occhi
   di chi non sta provando niente fanno *sembrare* che stia provando
   qualcosa. */
function sopracciglia(q, s, faccia) {
  const usa = ['triste', 'piange', 'spavento', 'arrabbiata']
  if (!usa.includes(faccia)) return
  const c = q.ctx
  c.strokeStyle = '#5b3720'; c.lineWidth = faccia === 'arrabbiata' ? 0.8 * s : 0.65 * s
  c.lineCap = 'round'
  const alto = faccia === 'spavento' ? -1.6 : -1
  for (const v of [-1, 1]) {
    c.beginPath()
    if (faccia === 'spavento') {
      // dritte e alte: la sorpresa spalanca la faccia
      c.moveTo(v * 0.85 * s, alto * s); c.lineTo(v * 2.3 * s, alto * s - 0.15 * s)
    } else if (faccia === 'arrabbiata') {
      // cadenti verso l'**interno**: è tutta qui la differenza col
      // dispiacere, e a vignetta piccola è l'unica che si legga
      c.moveTo(v * 0.8 * s, alto * s + 0.55 * s); c.lineTo(v * 2.4 * s, alto * s - 0.45 * s)
    } else {
      // cadenti verso l'esterno: il segno del dispiacere
      c.moveTo(v * 0.85 * s, alto * s - 0.5 * s); c.lineTo(v * 2.3 * s, alto * s + 0.5 * s)
    }
    c.stroke()
  }
}

/* ─────────── gli occhi ───────────
   Da fermo sono quelli di `segni.js`, che li hanno tutti. Cambiano solo
   quando la faccia lo chiede: chiusi ad arco per chi piange, spalancati
   per chi si spaventa. */
function sguardo(q, s, faccia, stato, pupilla) {
  if (faccia === 'piange') {
    const c = q.ctx
    c.strokeStyle = pupilla; c.lineWidth = 0.78 * s; c.lineCap = 'round'
    for (const v of [-1, 1]) {
      c.beginPath()
      c.moveTo(v * 1.5 * s - 0.75 * s, 0.9 * s)
      c.quadraticCurveTo(v * 1.5 * s, -0.1 * s, v * 1.5 * s + 0.75 * s, 0.9 * s)
      c.stroke()
    }
    // le lacrime: due gocce che scendono, e sono la cosa che si vede da lontano
    for (const v of [-1, 1]) {
      poligono(q, [[v * 1.5 * s - 0.45 * s, 1.2 * s], [v * 1.5 * s + 0.45 * s, 1.2 * s],
                   [v * 1.5 * s, 3.4 * s]], '#5fb8e8')
      tondo(q, v * 1.5 * s, 3.2 * s, 0.5 * s, 0.6 * s, '#5fb8e8')
    }
    return
  }
  if (faccia === 'assonnata') {
    // due righe dritte: gli occhi chiusi di chi dorme non sono archi,
    // quelli sono gli occhi di chi ride
    const c = q.ctx
    c.strokeStyle = pupilla; c.lineWidth = 0.7 * s; c.lineCap = 'round'
    for (const v of [-1, 1]) {
      c.beginPath()
      c.moveTo(v * 1.5 * s - 0.8 * s, 0.5 * s); c.lineTo(v * 1.5 * s + 0.8 * s, 0.5 * s)
      c.stroke()
    }
    return
  }
  if (faccia === 'contenta') {
    // occhi stretti da sorriso: due archi all'insù
    const c = q.ctx
    c.strokeStyle = pupilla; c.lineWidth = 0.8 * s; c.lineCap = 'round'
    for (const v of [-1, 1]) {
      c.beginPath()
      c.moveTo(v * 1.5 * s - 0.75 * s, 0.6 * s)
      c.quadraticCurveTo(v * 1.5 * s, -0.6 * s, v * 1.5 * s + 0.75 * s, 0.6 * s)
      c.stroke()
    }
    return
  }
  occhi(q, s, 1.5, 0.5, faccia === 'spavento' ? 0.95 : 0.72, stato, pupilla)
}

/* ─────────── la testa ───────────
   Una sola per tutti e tre: cambia il ciuffo, non il cranio. `chioma`
   la sceglie la scheda ('corti', 'code', 'raccolti'). */
function testaDiCasa(q, s, C, dir, stato, cosa, chioma, raggio = 4.3) {
  const b = C.bordo, sp = 0.7 * s, R = raggio * s
  const faccia = (cosa && cosa.faccia) || 'serena'
  q.rett(-1.2 * s, 2 * s, 2.4 * s, 2.2 * s, C.pelleS)               // collo

  if (dir === 'su') {
    tondo(q, 0, 0, R * 0.92, R, C.capelli, b, sp)
    if (chioma === 'code') for (const v of [-1, 1])
      tondo(q, v * R * 0.95, R * 0.15, 1.2 * s, 1.6 * s, C.capelli, b, sp)
    return
  }

  const laterale = dir === 'dx'
  tondo(q, laterale ? 0.2 * s : 0, 0.35 * s, R * 0.84, R * 0.94, C.pelle, b, sp)

  // la calotta: la stessa per tutti, poi ognuno il suo
  poligono(q, [[-R * 0.9, R * 0.25], [-R * 0.87, -R * 0.55], [0, -R * 1.08],
               [R * 0.87, -R * 0.55], [R * 0.9, R * 0.25], [R * 0.5, -R * 0.15],
               [0, -R * 0.4], [-R * 0.5, -R * 0.15]], C.capelli, b, sp)
  if (chioma === 'code') {
    /* due code lunghe che scendono, non due tondi ai lati: erano
       riccioli, e la bimba si distingueva dal bimbo solo per il colore
       della maglietta — cioè per uno stereotipo, e nemmeno leggibile */
    for (const v of [-1, 1]) {
      poligono(q, [[v * R * 0.76, -R * 0.42], [v * R * 1.02, -R * 0.2],
                   [v * R * 1.06, R * 0.95], [v * R * 0.8, R * 0.85]], C.capelli, b, sp)
      tondo(q, v * R * 0.93, R * 1.02, 0.62 * s, 0.55 * s, C.capelliS, b, sp * 0.8)
    }
  } else if (chioma === 'raccolti') {
    tondo(q, 0, -R * 1.15, 1.5 * s, 1.2 * s, C.capelli, b, sp)      // lo chignon
  }

  if (laterale) {
    // di profilo: un occhio solo, e il naso che sporge
    tondo(q, R * 0.55, 0.4 * s, 0.66 * s, 0.78 * s, '#ffffff')
    tondo(q, R * 0.68, 0.5 * s, 0.34 * s, 0.46 * s, '#3a2a1a')
    poligono(q, [[R * 0.82, 0.6 * s], [R * 1.2, 1.3 * s], [R * 0.78, 1.5 * s]], C.pelle)
    if (faccia === 'piange') {
      poligono(q, [[R * 0.42, 1.2 * s], [R * 0.78, 1.2 * s], [R * 0.6, 3.4 * s]], '#5fb8e8')
    }
    const c = q.ctx
    c.strokeStyle = '#8c4530'; c.lineWidth = 0.8 * s; c.lineCap = 'round'
    c.beginPath()
    if (faccia === 'contenta') {
      c.moveTo(R * 0.35, 2.6 * s); c.quadraticCurveTo(R * 0.75, 3.6 * s, R * 0.95, 2.5 * s)
    } else if (faccia === 'triste' || faccia === 'piange' || faccia === 'arrabbiata') {
      c.moveTo(R * 0.35, 3.3 * s); c.quadraticCurveTo(R * 0.72, 2.4 * s, R * 0.95, 3.1 * s)
    } else {
      c.moveTo(R * 0.4, 2.9 * s); c.lineTo(R * 0.95, 2.9 * s)
    }
    c.stroke()
    return
  }

  /* la faccia cresce con la testa: gli occhi e la bocca sono in unità
     del corpo, e su una testa più grossa restavano due puntini in mezzo
     a un cerchio. `F` è l'unità della faccia, e vale `s` solo quando la
     testa è quella di serie. */
  const F = s * (raggio / 4.3)
  sguardo(q, F, faccia, stato, '#3a2a1a')
  sopracciglia(q, F, faccia)
  poligono(q, [[0, 1.4 * F], [0.55 * F, 2.2 * F], [-0.55 * F, 2.2 * F]], C.pelleS)   // naso
  bocca(q, F, faccia)
  if (faccia === 'contenta') for (const v of [-1, 1])                 // le guance
    tondo(q, v * 2.6 * F, 1.9 * F, 0.7 * F, 0.5 * F, '#f0a0a0aa')
}

/* ─────────── il busto ───────────
   Una maglietta: il collo, il corpo, e una banda più scura in fondo che
   la stacca dai pantaloni. Vale per tutti e tre — quello che cambia è
   il colore, che è quanto basta a riconoscersi. */
function maglietta(q, s, C, dir, sw, cfg) {
  const b = C.bordo, sp = 0.7 * s
  const w = (cfg.spalle + 1.1) * s
  capsula(q, 0, -8.8 * s, w, 3.9 * s, 1.6 * s, C.veste, b, sp)
  q.rett(-w * 0.94, -6.2 * s, w * 1.88, 1.3 * s, C.vesteS)
  if (dir !== 'su')
    poligono(q, [[-1.5 * s, -12.6 * s], [1.5 * s, -12.6 * s], [0, -10.6 * s]], C.pelleS)  // il colletto
  void sw
}

const PELLE = { pelle: '#f6d9bb', pelleS: '#dcb894' }
const BORDO = '#2a2036'

export const BIMBA = {
  spalle: 3.1, taglia: 0.78, arti: 0.92,
  col: {
    ...PELLE,
    manica: '#ff9db1', manicaS: '#d97a91',
    veste: '#ff9db1', vesteS: '#d97a91',
    gambe: '#5b8dd9', gambeS: '#4570b3',
    scarpe: '#f2c94c', scarpeS: '#c9a13e',
    capelli: '#8a5a35', capelliS: '#6b4326',
    bordo: BORDO,
  },
  tronco: maglietta,
  testa: (q, s, C, dir, stato, cosa) => testaDiCasa(q, s, C, dir, stato, cosa, 'code', 5.1),
}

export const BIMBO = {
  spalle: 3.1, taglia: 0.78, arti: 0.92,
  col: {
    ...PELLE,
    manica: '#63c9a6', manicaS: '#48a184',
    veste: '#63c9a6', vesteS: '#48a184',
    gambe: '#e08a4a', gambeS: '#b96c36',
    scarpe: '#6a7fa0', scarpeS: '#4f6180',
    capelli: '#3f2c1e', capelliS: '#2a1c12',
    bordo: BORDO,
  },
  tronco: maglietta,
  testa: (q, s, C, dir, stato, cosa) => testaDiCasa(q, s, C, dir, stato, cosa, 'corti', 5.1),
}

/* Il grande non è «la mamma» né «il papà»: è chi c'è. Le storie di
   questo gioco funzionano uguale in tutt'e due i casi, e mettere un
   genitore preciso avrebbe escluso metà delle case che ci giocano. */
export const GRANDE = {
  spalle: 3.9, taglia: 1.06, arti: 1,
  col: {
    ...PELLE,
    manica: '#9b7fd4', manicaS: '#7a60b0',
    veste: '#9b7fd4', vesteS: '#7a60b0',
    gambe: '#4a4f66', gambeS: '#363a4d',
    scarpe: '#8a5a35', scarpeS: '#6b4326',
    capelli: '#4a3423', capelliS: '#33230f',
    bordo: BORDO,
  },
  tronco: maglietta,
  testa: (q, s, C, dir, stato, cosa) => testaDiCasa(q, s, C, dir, stato, cosa, 'raccolti', 4.6),
}

export const PERSONE = { bimba: BIMBA, bimbo: BIMBO, grande: GRANDE }

/* il cerotto e la sbucciatura si disegnano *addosso a qualcuno*, quindi
   stanno qui e non fra le cose: chi li mette in scena li dichiara sulla
   persona (`ginocchio: 'sbucciato' | 'cerotto'`) e non deve sapere a che
   altezza cade un ginocchio. */
export function ginocchio(q, s, come) {
  if (come === 'sbucciato') {
    tondo(q, -2.5 * s, -2.6 * s, 1.35 * s, 1.1 * s, '#e03131', BORDO, 0.4 * s)
    tondo(q, -2.5 * s, -2.85 * s, 0.55 * s, 0.42 * s, '#ff8f8f')
  } else if (come === 'cerotto') {
    /* grande abbastanza da vedersi. Il primo giro lo faceva largo tre
       unità su cento: in mano c'era il disegno giusto e a schermo non
       c'era niente, che è il modo più facile di credere che una scena
       funzioni quando non funziona */
    q.in(-2.5 * s, -2.6 * s, r => {
      capsula(r, 0, 0, 2.5 * s, 1.05 * s, 0.7 * s, '#fff0cc', BORDO, 0.5 * s)
      r.rett(-0.8 * s, -0.9 * s, 1.6 * s, 1.8 * s, mescola('#fff0cc', '#8c6a3d', 0.35))
    }, -0.35)
  }
}
