// La tela: un pezzetto di motore grafico in casa, non una libreria (vedi
// docs/core/grafica.md). Il gioco descrive una SCENA (lista di cose),
// la grafica ha un PITTORE per nome: fra i due passa solo la lista.

// Il pennello: il contesto 2D più poche scorciatoie. Non nasconde `ctx`.
export function pennello(ctx, misure) {
  const p = {
    ctx, ...misure, tempo: 0,

    ellisse(x, y, rx, ry, col) {
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 6.29); ctx.fill()
    },
    cerchio(x, y, r, col) { p.ellisse(x, y, r, r, col) },
    rett(x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(x, y, w, h) },
    figura(punti, col) {
      ctx.fillStyle = col; ctx.beginPath()
      punti.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))
      ctx.closePath(); ctx.fill()
    },
    linea(punti, col, spessore) {
      ctx.strokeStyle = col; ctx.lineWidth = spessore
      ctx.beginPath()
      punti.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))
      ctx.stroke()
    },
    testo(t, x, y, col, dim, peso = 900) {
      ctx.fillStyle = col; ctx.font = `${peso} ${dim}px "Emoji Gioco", system-ui`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(t, x, y)
    },
    // disegna in coordinate locali (origine spostata, magari ruotata)
    in(x, y, fn, rotazione = 0) {
      ctx.save(); ctx.translate(x, y); if (rotazione) ctx.rotate(rotazione)
      fn(p); ctx.restore()
    },
    velo(quanto, fn) { const a = ctx.globalAlpha; ctx.globalAlpha = quanto; fn(p); ctx.globalAlpha = a },
  }
  return p
}

// stesso seme, stesso bosco: una texture che cambia a ogni ridisegno è sbagliata
export function seminato(seme) {
  let s = seme | 0
  return () => {
    s = s + 0x6d2b79f5 | 0
    let t = Math.imul(s ^ s >>> 15, 1 | s)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

// `pittori`: tabella nome -> funzione(pennello, cosa). Un tipo nuovo è una
// riga lì, non una modifica qui.
export function creaTela(canvas, pittori,
                         { unita = 420, minimo = 0.62, massimo = 1.5, mondo = null } = {}) {
  let ctx = null, W = 0, H = 0, S = 1, dpr = 1     // il mondo: quello che i pittori misurano
  let Wc = 0, Hc = 0                               // il canvas: i pixel veri sullo schermo
  let fondale = null, qualita = 1                  // la tela nascosta con lo sfondo fermo

  // la telecamera: `ora` è dove sta, `mira` dov'è diretta, con un avvicinamento morbido fra le due
  const ora = { k: 1, x: 0, y: 0 }
  const mira = { k: 1, x: 0, y: 0 }
  // lo zoom del dito, sopra quello della telecamera: la mappa resta incorniciata
  let zoom = 1, panX = 0, panY = 0

  const fra = (min, v, max) => Math.max(min, Math.min(max, v))

  function ridimensiona() {
    const r = canvas.parentElement.getBoundingClientRect()
    Wc = r.width; Hc = r.height
    dpr = window.devicePixelRatio || 1
    canvas.width = Math.floor(Wc * dpr); canvas.height = Math.floor(Hc * dpr)
    canvas.style.width = Wc + 'px'; canvas.style.height = Hc + 'px'
    ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    // un mondo dichiarato non si piega allo schermo: è lo schermo che si adatta a lui
    W = mondo ? mondo.W : Wc
    H = mondo ? mondo.H : Hc
    S = mondo && mondo.S ? mondo.S
                         : Math.max(minimo, Math.min(massimo, Math.min(W, H) / unita))
    fondale = null                        // cambiata la misura, lo sfondo va rifatto
    inquadra(true)
    return { W, H, S }
  }

  // dove cade il mondo nel canvas, centrato; `subito` salta l'avvicinamento morbido
  function inquadra(subito = false) {
    const visibile = Hc
    const base = Math.min(Wc / W, visibile / H)
    mira.k = base * zoom
    // passoIntero: si arrotonda il prodotto S·k (non k), che è quello che finisce sullo schermo
    if (mondo && mondo.passoIntero) {
      const passo = Math.max(1, Math.floor(mira.k * S))
      mira.k = passo / S
    }
    // lo scostamento è quello che centra il mondo nella fascia libera, più
    // quanto l'ha spostato il dito; oltre il bordo non si va
    const spanX = Math.max(0, W * mira.k - Wc), spanY = Math.max(0, H * mira.k - visibile)
    panX = fra(-spanX / 2, panX, spanX / 2); panY = fra(-spanY / 2, panY, spanY / 2)
    mira.x = (Wc - W * mira.k) / 2 + panX
    mira.y = (visibile - H * mira.k) / 2 + panY
    if (subito) Object.assign(ora, mira)
    return mira
  }

  function pizzica(fattore) { zoom = fra(1, zoom * fattore, 3); return inquadra() }
  function trascina(dx, dy) { panX += dx; panY += dy; return inquadra() }
  function rimetti() { zoom = 1; panX = panY = 0; return inquadra() }

  const versoIlMondo = (x, y) => ({ x: (x - ora.x) / ora.k, y: (y - ora.y) / ora.k })
  const versoLoSchermo = (x, y) => ({ x: x * ora.k + ora.x, y: y * ora.k + ora.y })

  // dipinto alla scala della vista PIENA (la più grande possibile): rimpicciolire una copia
  // grande è sempre bello, il contrario (ingrandire una copia piccola) sarebbe una sfocatura
  function dipingiFondale(dipingi) {
    if (!W || !H || !Wc || !Hc) return
    qualita = Math.max(1, Math.min(Wc / W, Hc / H))
    const cv = document.createElement('canvas')
    cv.width = Math.max(1, Math.floor(W * dpr * qualita))
    cv.height = Math.max(1, Math.floor(H * dpr * qualita))
    const c = cv.getContext('2d')
    c.setTransform(dpr * qualita, 0, 0, dpr * qualita, 0, 0)
    dipingi(pennello(c, { W, H, S }))
    fondale = cv
  }

  // `scena`: lista di cose con `che` (chi la dipinge). Ordine: strato
  // (-1 sotto, 0 a terra, 1 sopra), a terra per `y` crescente (più vicino
  // sopra) — così un mostro passa dietro o davanti a una torre da solo.
  function disegna(scena, tempo = 0, luce = null) {
    if (!ctx) return
    avvicina()
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, Wc, Hc)
    ctx.setTransform(dpr * ora.k, 0, 0, dpr * ora.k, dpr * ora.x, dpr * ora.y)
    if (fondale) ctx.drawImage(fondale, 0, 0, W, H)
    const p = pennello(ctx, { W, H, S })
    p.tempo = tempo
    // funzione e non dato: la luce dipende da dove sta la cosa, e lo sa solo il pittore
    p.luce = luce
    const ordinata = scena.slice().sort((a, b) =>
      (a.strato || 0) - (b.strato || 0) || (a.y || 0) - (b.y || 0))
    for (const cosa of ordinata) {
      const pittore = pittori[cosa.che]
      if (!pittore) continue
      // `alone: true` marca «una cosa che si nomina» (vs. arredo dipinto sul
      // fondale): un fiato a terra più un bordo luminoso che segue la sagoma
      // vera (l'ombra la disegna il canvas seguendo l'alfa, non un pittore).
      if (cosa.alone) {
        fiato(p, cosa)
        ctx.save()
        ctx.shadowColor = '#fffbe8'
        ctx.shadowBlur = 3.5 * S
        pittore(p, cosa)
        ctx.restore()
      } else if (cosa.velo != null) p.velo(cosa.velo, () => pittore(p, cosa))
      else pittore(p, cosa)
    }
  }

  function fiato(p, cosa) {
    const R = S * 13
    const g = p.ctx.createRadialGradient(cosa.x, cosa.y, R * 0.2, cosa.x, cosa.y, R)
    g.addColorStop(0, '#ffe9b422'); g.addColorStop(0.7, '#ffe9b40e'); g.addColorStop(1, '#ffe9b400')
    p.ctx.save()
    p.ctx.translate(cosa.x, cosa.y); p.ctx.scale(1, 0.5); p.ctx.translate(-cosa.x, -cosa.y)
    p.ctx.fillStyle = g
    p.ctx.beginPath(); p.ctx.arc(cosa.x, cosa.y, R, 0, 6.29); p.ctx.fill()
    p.ctx.restore()
  }

  function avvicina() {   // un quinto della strada che manca a ogni fotogramma, poi si posa
    for (const k of ['k', 'x', 'y']) {
      const d = mira[k] - ora[k]
      ora[k] = Math.abs(d) < (k === 'k' ? 0.001 : 0.3) ? mira[k] : ora[k] + d * 0.2
    }
  }

  return {
    ridimensiona, dipingiFondale, disegna,
    inquadra, pizzica, trascina, rimetti, versoIlMondo, versoLoSchermo,
    get misure() { return { W, H, S } },
    get vista() { return { ...ora, Wc, Hc } },   // per mettere qualcosa accanto al campo senza coprirlo
  }
}
