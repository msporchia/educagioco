// Un foglio di sprite e come si posa: vedi docs/core/grafica.md. Non
// sostituisce PITTORI, gli sta accanto.
// `nitidi` ({ pezzi, immagine }): gli stessi pezzi presi dal foglio dipinto, più grandi; la misura resta quella
// di `pezzi`, e `pezzo` disegna con loro ammorbidendo (docs/core/sprite.md, «I pezzi nitidi»)
export function creaFoglio({ pezzi, immagine, tessera = 32, nitidi = null }) {
  let img = null
  let attesa = null
  let imgN = null
  if (nitidi && typeof Image !== 'undefined') {
    const i = new Image()
    i.onload = () => { imgN = i }
    i.src = nitidi.immagine
  }

  // una promessa sola: chiamarla due volte non scarica due volte
  function carica() {
    if (attesa) return attesa
    attesa = new Promise((risolvi, rifiuta) => {
      const i = new Image()
      i.onload = () => { img = i; risolvi(foglio) }
      i.onerror = () => rifiuta(new Error('atlante non caricato'))
      i.src = immagine
    })
    return attesa
  }

  const misura = nome => {
    const p = pezzi[nome]
    return p ? { w: p[2], h: p[3] } : null
  }

  // il disegno crudo, angolo in alto a sinistra; specchia riflette destra/sinistra
  function pezzo(ctx, nome, x, y, { alfa = 1, specchia = false } = {}) {
    const p = pezzi[nome]
    if (!p || !img) return false
    const [sx, sy, w, h] = p
    const n = imgN && nitidi.pezzi[nome]
    const [fonte, fx, fy, fw, fh] = n ? [imgN, ...n] : [img, sx, sy, w, h]
    const prima = ctx.globalAlpha
    if (alfa !== 1) ctx.globalAlpha = alfa
    if (n) { ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high' }
    if (specchia) {
      ctx.save()
      ctx.translate(Math.round(x) + w, Math.round(y))
      ctx.scale(-1, 1)
      ctx.drawImage(fonte, fx, fy, fw, fh, 0, 0, w, h)
      ctx.restore()
    } else {
      ctx.drawImage(fonte, fx, fy, fw, fh, Math.round(x), Math.round(y), w, h)
    }
    if (n) ctx.imageSmoothingEnabled = false
    if (alfa !== 1) ctx.globalAlpha = prima
    return true
  }

  // un pezzo di un pezzo (rx,ry,rw,rh in pixel del pezzo): per disegnare a fette senza tagliare 16 nomi diversi
  function ritaglio(ctx, nome, rx, ry, rw, rh, x, y, { alfa = 1 } = {}) {
    const p = pezzi[nome]
    if (!p || !img) return false
    const [sx, sy, w, h] = p
    const lw = Math.min(rw, w - rx), lh = Math.min(rh, h - ry)
    if (lw <= 0 || lh <= 0) return false
    const prima = ctx.globalAlpha
    if (alfa !== 1) ctx.globalAlpha = alfa
    ctx.drawImage(img, sx + rx, sy + ry, lw, lh, Math.round(x), Math.round(y), lw, lh)
    if (alfa !== 1) ctx.globalAlpha = prima
    return true
  }

  // appoggiato: x è il centro, y è dove tocca terra
  function posa(ctx, nome, x, y, opz = {}) {
    const m = misura(nome)
    if (!m) return false
    return pezzo(ctx, nome, x - m.w / 2 + (opz.dx || 0), y - m.h + (opz.dy || 0), opz)
  }

  // in celle: una figura più alta della cella sborda verso l'alto, appoggiata al fondo della sua cella
  function posaTessera(ctx, nome, cx, cy, opz = {}) {
    return posa(ctx, nome, (cx + 0.5) * tessera, (cy + 1) * tessera, opz)
  }

  // source-in sostituisce i pixel disegnati col colore: la figura piena, per farne un bordo
  const sagome = new Map()
  function sagoma(nome, colore) {
    const chiave = nome + '|' + colore
    if (sagome.has(chiave)) return sagome.get(chiave)
    const p = pezzi[nome]
    if (!p || !img) return null
    const [sx, sy, w, h] = p
    const c = document.createElement('canvas')
    c.width = w; c.height = h
    const g = c.getContext('2d')
    g.imageSmoothingEnabled = false
    g.drawImage(img, sx, sy, w, h, 0, 0, w, h)
    g.globalCompositeOperation = 'source-in'
    g.fillStyle = colore
    g.fillRect(0, 0, w, h)
    sagome.set(chiave, c)
    return c
  }

  // appoggiato come posa; va chiamato PRIMA della figura, o le mangia i bordi. raggio: 1 = filo, 2 = fiamma
  const INTORNO = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]
  function alone(ctx, nome, x, y, { colore = '#ffd27a', alfa = 1, raggio = 1,
                                    specchia = false } = {}) {
    const m = misura(nome)
    const s = sagoma(nome, colore)
    if (!m || !s) return false
    const prima = ctx.globalAlpha
    ctx.globalAlpha = prima * alfa
    const x0 = Math.round(x - m.w / 2), y0 = Math.round(y - m.h)
    for (const [dx, dy] of INTORNO) {
      if (specchia) {
        ctx.save()
        ctx.translate(x0 + dx * raggio + m.w, y0 + dy * raggio)
        ctx.scale(-1, 1)
        ctx.drawImage(s, 0, 0)
        ctx.restore()
      } else {
        ctx.drawImage(s, x0 + dx * raggio, y0 + dy * raggio)
      }
    }
    ctx.globalAlpha = prima
    return true
  }

  const foglio = {
    carica, misura, pezzo, ritaglio, posa, posaTessera, tessera, alone,
    get pronto() { return !!img },
    get immagine() { return img },
    ha: nome => !!pezzi[nome],
    nomi: () => Object.keys(pezzi),
  }
  return foglio
}

// va rimesso ogni fotogramma: cambiare la trasformazione lo azzera su qualche browser
export function netto(ctx) {
  ctx.imageSmoothingEnabled = false
  return ctx
}

// il numero più grande fra 1 e massimo che fa entrare il mondo nello spazio senza mezze scale (mondo.S della tela)
export function scalaIntera(spazio, mondo, massimo = 4) {
  const k = Math.min(spazio.W / mondo.W, spazio.H / mondo.H)
  return Math.max(1, Math.min(massimo, Math.floor(k)))
}
