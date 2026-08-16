/* ═══════════════════════════════════════════════════════════════════
   IL CIELO DEGLI ASTEROIDI — tutto il disegno del gioco delle tabelline.

   Qui dentro non entrano né vite né punti né tabelline: entrano fatti
   già decisi. La nave riceve `danno` (0 intatta, 1 a pezzi) e non sa
   quante vite siano; l'asteroide riceve `boss: true` e non sa cosa sia
   un boss. È la stessa divisione di `grafica/castello.js`, e serve alla
   stessa cosa: aggiungere un'ammaccatura non deve voler dire aprire il
   file dove si contano le risposte giuste.

   Il modulo lavora sul contesto 2D nudo — questo gioco non passa da
   `tela.js`, che è del castello — e non importa Vue: si può disegnare
   un fotogramma anche fuori dal gioco.
   ═══════════════════════════════════════════════════════════════════ */

const TAU = Math.PI * 2

/* ─────────── colore ───────────
   Le stesse due righe di `comune.js`, ricopiate perché quel file tira
   dentro `materia.js` e mezzo cassetto del castello: qui serve solo
   mescolare due tinte. */
const canale = (c, i) => parseInt(c.slice(i, i + 2), 16)
/* da 0–1 alle due cifre di trasparenza in coda a un colore: si scrive
   `'#9fd8ff' + esa(0.4)` invece di aprire un `rgba()` a mano */
const esa = q => Math.round(Math.max(0, Math.min(1, q)) * 255).toString(16).padStart(2, '0')
function mescola(a, b, q) {
  return '#' + [1, 3, 5].map(i =>
    Math.round(canale(a, i) + (canale(b, i) - canale(a, i)) * q)
      .toString(16).padStart(2, '0')).join('')
}

/* ═══════════════ IL FONDALE ═══════════════
   Nebulose e polvere di stelle non si muovono: dipingerle a ogni
   fotogramma vuol dire pagare venti gradienti radiali sessanta volte al
   secondo per un'immagine che è sempre la stessa. Si dipingono una volta
   su una tela di scorta e da lì si copiano — è il trucco dello sfondo in
   cache di `tela.js`, applicato a un cielo invece che a un prato. */

const NEBULOSE = [
  { x: 0.18, y: 0.22, r: 0.55, c: '#6a2fd0' },
  { x: 0.82, y: 0.38, r: 0.48, c: '#2f6bd0' },
  { x: 0.45, y: 0.72, r: 0.60, c: '#1c4a8a' },
  { x: 0.70, y: 0.08, r: 0.35, c: '#d02f8a' },
]

export function dipingiFondale(W, H, sorte = Math.random) {
  const cv = document.createElement('canvas')
  cv.width = Math.max(1, Math.floor(W)); cv.height = Math.max(1, Math.floor(H))
  const c = cv.getContext('2d')

  const g = c.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#05081a'); g.addColorStop(0.55, '#0a0f2e'); g.addColorStop(1, '#0e1338')
  c.fillStyle = g; c.fillRect(0, 0, W, H)

  // le nebulose: gradienti larghissimi e quasi trasparenti. Devono farsi
  // notare come un colore nel buio, non come una macchia con un bordo.
  const D = Math.max(W, H)
  for (const n of NEBULOSE) {
    const r = D * n.r
    const rg = c.createRadialGradient(W * n.x, H * n.y, 0, W * n.x, H * n.y, r)
    rg.addColorStop(0, n.c + '3a'); rg.addColorStop(0.5, n.c + '16'); rg.addColorStop(1, n.c + '00')
    c.fillStyle = rg; c.fillRect(0, 0, W, H)
  }

  // polvere di stelle: tante, piccolissime, ferme. Sono il fondo su cui
  // si muovono le poche stelle vive disegnate dal gioco.
  for (let i = 0; i < 260; i++) {
    const x = sorte() * W, y = sorte() * H, r = sorte() * 1.1 + 0.25
    c.globalAlpha = 0.18 + sorte() * 0.5
    c.fillStyle = sorte() < 0.22 ? '#9fd4ff' : '#fff'
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill()
  }
  c.globalAlpha = 1
  return cv
}

/* IL PIANETA IN BASSO NON C'È PIÙ. Era un bel disegno che non faceva
   niente: non si difendeva, non si perdeva, non cambiava mai. In un
   gioco per bambini una cosa in scena che non fa niente è una domanda
   senza risposta — e per giunta diceva una bugia, perché il sasso che
   arrivava in fondo colpiva lui e la botta la prendeva la nave. Adesso
   il fondo dello schermo è l'altezza della nave, e il sasso che passa
   la colpisce: si vede quello che succede. */

/* ═══════════════ L'ASTRONAVE ═══════════════
   Tre scafi, uno per livello raggiunto nella partita, e sotto lo stesso
   disegno: quello che cambia sono ali e propulsori, non la silhouette —
   il bambino deve riconoscere che è diventata *la sua* nave più grossa,
   non che gliene hanno data un'altra.

   IL DANNO È L'UNICO POSTO DOVE SI LEGGONO LE VITE. Il gettone dei
   cuori nella fascia in alto non c'è più — diceva una seconda volta
   quello che la nave dice già, e la fascia serviva ad altro. Quindi
   questo disegno non è più un contorno: è il cruscotto.

   Per questo il danno si legge **a gradini e non a sfumatura**. Un
   numero continuo fa una nave un po' più sporca a ogni botta, e «un po'
   più sporca» con l'occhio non si conta; tre stati che non si
   assomigliano si contano da lontano e di sfuggita, che è come li si
   guarda mentre si sta fissando il cielo:

     0  intatta      bianca, vetro azzurro, fiamme regolari
     1  ammaccata    scafo bruciacchiato, un'ala squarciata, fumo
     2  in fiamme    luce rossa che lampeggia, vetro rotto, motore a
                     singhiozzo, scintille

   Chi chiama passa `danno` da 0 a 1 e non sa niente di vite: la
   traduzione la fa il gioco. `statoScafo` è esportata perché il fumo lo
   soffia il gioco (sono particelle, non disegno) e i gradini devono
   restare scritti in un posto solo.

   Il muso guarda in su; `mira` è l'angolo del cannone, in radianti,
   con -π/2 dritto verso l'alto. */

export const statoScafo = d => (d < 0.34 ? 0 : d < 0.67 ? 1 : 2)

const SCAFO = [[0, -1.18], [0.30, -0.42], [0.36, 0.34], [0.24, 0.74],
               [-0.24, 0.74], [-0.36, 0.34], [-0.30, -0.42]]

function traccia(ctx, punti, R) {
  ctx.beginPath()
  punti.forEach(([x, y], i) => i ? ctx.lineTo(x * R, y * R) : ctx.moveTo(x * R, y * R))
  ctx.closePath()
}

/* le ali crescono con il livello: corte e tozze la navetta, lunghe e
   spezzate il caccia, doppie l'incrociatore */
function ali(lv) {
  if (lv <= 1) return [[[0.30, -0.10], [0.92, 0.46], [0.86, 0.72], [0.34, 0.60]]]
  if (lv === 2) return [[[0.30, -0.24], [1.16, 0.40], [1.20, 0.66], [0.86, 0.72], [0.34, 0.60]]]
  return [[[0.30, -0.30], [1.26, 0.30], [1.30, 0.58], [0.88, 0.66], [0.34, 0.52]],
          [[0.34, 0.30], [1.04, 0.78], [0.96, 0.98], [0.32, 0.80]]]
}

const PROPULSORI = { 1: [[0, 0.78, 0.20]], 2: [[-0.20, 0.76, 0.17], [0.20, 0.76, 0.17]],
                     3: [[-0.30, 0.74, 0.15], [0, 0.80, 0.19], [0.30, 0.74, 0.15]] }

export function disegnaNave(ctx, n) {
  const R = n.r, lv = Math.max(1, Math.min(3, n.lv || 1))
  const st = statoScafo(Math.max(0, Math.min(1, n.danno || 0)))
  const d = st / 2                       // 0, 0.5, 1: i gradini, non la sfumatura
  const t = n.t || 0
  // lo scafo si sporca e si annerisce: il colore fa metà del lavoro,
  // prima ancora che si vedano le ammaccature
  const chiaro = mescola('#e8eefc', '#5a4a44', d * 0.75)
  const scuro = mescola('#7d8aa6', '#2a1f1c', d * 0.8)
  const accento = mescola('#2f7bff', '#7a3a20', d * 0.7)

  ctx.save()
  ctx.translate(n.x, n.y)

  // luce d'emergenza: sta *dietro* la nave, se no la ridipinge di rosso
  // e lo squarcio nell'ala smette di vedersi
  if (st === 2) {
    const l = 0.35 + 0.65 * Math.abs(Math.sin(t * 5))
    const rg = ctx.createRadialGradient(0, 0, R * 0.7, 0, 0, R * 2.1)
    rg.addColorStop(0, `rgba(255,60,60,${0.34 * l})`); rg.addColorStop(1, 'rgba(255,60,60,0)')
    ctx.fillStyle = rg
    ctx.beginPath(); ctx.arc(0, 0, R * 2.1, 0, TAU); ctx.fill()
  }

  /* le fiamme dei propulsori, sotto lo scafo: pulsano sempre, e sotto
     spinta si allungano. Una nave ferma con la fiamma fissa sembra un
     disegno; una nave che respira sembra accesa. */
  const sp = 0.8 + (n.spinta || 0) * 1.1 + Math.sin(t * 22) * 0.14
  for (const [px, py, pr] of PROPULSORI[lv]) {
    const x = px * R, y = py * R, w = pr * R
    // il motore rotto va a singhiozzo: la fiamma sinistra sparisce e torna
    const lung = w * (3.4 * sp) * (st === 2 && ((px < 0) === (Math.sin(t * 9) > 0)) ? 0.35 : 1)
    const alone = ctx.createRadialGradient(x, y + lung * 0.3, 0, x, y + lung * 0.3, lung * 1.1)
    alone.addColorStop(0, '#7fe3ff55'); alone.addColorStop(1, '#7fe3ff00')
    ctx.fillStyle = alone
    ctx.beginPath(); ctx.arc(x, y + lung * 0.3, lung * 1.1, 0, TAU); ctx.fill()
    const g = ctx.createLinearGradient(x, y, x, y + lung)
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, '#bff2ff')
    g.addColorStop(0.62, '#4aa3ff'); g.addColorStop(1, '#2f7bff00')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(x - w * 0.75, y); ctx.quadraticCurveTo(x, y + lung * 1.15, x + w * 0.75, y)
    ctx.fill()
    ctx.fillStyle = scuro
    ctx.fillRect(x - w * 0.7, y - w * 0.5, w * 1.4, w * 0.8)
  }

  // le ali
  for (const [i, a] of ali(lv).entries()) {
    for (const verso of [1, -1]) {
      /* uno squarcio: l'ala sinistra si accorcia già alla prima botta.
         È il gradino che si vede da più lontano di tutti — la
         silhouette cambia — ed è quello che deve dire «me ne resta una
         sola» senza far contare niente a nessuno. */
      const rovinata = st >= 1 && verso < 0 && i === 0
      const p = rovinata ? a.map(([x, y]) => [x * 0.62, y]) : a
      traccia(ctx, p.map(([x, y]) => [x * verso, y]), R)
      const g = ctx.createLinearGradient(0, -R * 0.4, 0, R * 0.8)
      g.addColorStop(0, chiaro); g.addColorStop(1, scuro)
      ctx.fillStyle = g; ctx.fill()
      ctx.lineWidth = Math.max(1, R * 0.05); ctx.strokeStyle = accento; ctx.stroke()
      if (rovinata) {   // il bordo bruciato dello squarcio
        ctx.strokeStyle = '#1a0f0c'; ctx.lineWidth = Math.max(2, R * 0.09); ctx.stroke()
      }
    }
  }

  // lo scafo
  traccia(ctx, SCAFO, R)
  const g = ctx.createLinearGradient(-R * 0.4, -R, R * 0.5, R)
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, chiaro); g.addColorStop(1, scuro)
  ctx.fillStyle = g; ctx.fill()
  ctx.lineWidth = Math.max(1.5, R * 0.06); ctx.strokeStyle = accento; ctx.stroke()

  // ammaccature: macchie scure sempre negli stessi punti, così la nave
  // non «brulica» da un fotogramma all'altro
  if (st >= 1) {
    ctx.fillStyle = '#00000055'
    const macchie = [[0.16, 0.10, 0.16], [-0.18, 0.38, 0.12], [0.06, -0.55, 0.10]]
    macchie.slice(0, st === 2 ? 3 : 2).forEach(([x, y, r]) => {
      ctx.beginPath(); ctx.arc(x * R, y * R, r * R, 0, TAU); ctx.fill()
    })
  }

  // la cabina
  const cy = -R * 0.42
  ctx.beginPath(); ctx.ellipse(0, cy, R * 0.21, R * 0.30, 0, 0, TAU)
  const cg = ctx.createLinearGradient(0, cy - R * 0.3, 0, cy + R * 0.3)
  cg.addColorStop(0, st === 2 ? '#ffb3b3' : '#dffaff')
  cg.addColorStop(1, st === 2 ? '#7a1f1f' : '#2f7bff')
  ctx.fillStyle = cg; ctx.fill()
  ctx.lineWidth = Math.max(1, R * 0.045); ctx.strokeStyle = chiaro; ctx.stroke()
  if (st === 2) {   // il vetro crepato
    ctx.strokeStyle = '#ffffffcc'; ctx.lineWidth = Math.max(1, R * 0.03)
    ctx.beginPath()
    ctx.moveTo(-R * 0.18, cy - R * 0.1); ctx.lineTo(R * 0.04, cy + R * 0.02)
    ctx.lineTo(R * 0.16, cy + R * 0.2); ctx.moveTo(R * 0.04, cy + R * 0.02)
    ctx.lineTo(R * 0.12, cy - R * 0.22); ctx.stroke()
  }

  /* il cannone: gira verso il bersaglio. È l'unico pezzo che si muove
     davvero con il gioco, ed è quello che fa sembrare il tocco un colpo
     e non un tasto. */
  ctx.save()
  ctx.translate(0, -R * 0.18)
  // la torretta su cui è montato: un tondo fermo, che non ruota. Senza,
  // il cannone puntato di traverso sembra staccato e appoggiato lì
  ctx.beginPath(); ctx.arc(0, 0, R * 0.26, 0, TAU)
  const tg = ctx.createRadialGradient(-R * 0.08, -R * 0.1, 0, 0, 0, R * 0.26)
  tg.addColorStop(0, chiaro); tg.addColorStop(1, scuro)
  ctx.fillStyle = tg; ctx.fill()
  ctx.lineWidth = Math.max(1, R * 0.045); ctx.strokeStyle = accento; ctx.stroke()
  ctx.rotate((n.mira ?? -Math.PI / 2) + Math.PI / 2)
  // il fusto, con una fascia più scura sotto: senza, a schermo piccolo
  // il cannone sembra un'antenna appiccicata al muso
  ctx.fillStyle = mescola('#b9c6dd', '#5a4a44', d * 0.7)
  ctx.fillRect(-R * 0.13, -R * 0.50, R * 0.26, R * 0.50)
  ctx.fillStyle = mescola('#8f9fbb', '#5a4a44', d * 0.7)
  ctx.fillRect(-R * 0.10, -R * 0.95, R * 0.20, R * 0.50)
  // la bocca. Diventa azzurra col gelo acceso: il potere si spende dalla
  // tasca in basso, ma a sparare è la nave, e deve vedersi che è la sua
  ctx.fillStyle = n.gelo > 0 ? '#9fd8ff' : '#ffd94a'
  ctx.fillRect(-R * 0.14, -R * 1.03, R * 0.28, R * 0.15)
  ctx.restore()

  // la botta appena presa: la nave sbianca per un attimo
  if (n.botta > 0) {
    traccia(ctx, SCAFO, R)
    ctx.fillStyle = `rgba(255,120,120,${Math.min(0.8, n.botta)})`; ctx.fill()
  }
  // la riparazione: un lampo verde, il contrario esatto della botta
  if (n.riparata > 0) {
    traccia(ctx, SCAFO, R)
    ctx.fillStyle = `rgba(140,255,180,${Math.min(0.8, n.riparata)})`; ctx.fill()
  }

  /* il gelo acceso: una brina esagonale attorno alla nave. Un cerchio si
     confonderebbe con la luce dei motori; un esagono è evidentemente un
     oggetto, e si vede che c'è o non c'è. */
  if (n.gelo > 0) {
    const q = Math.min(1, n.gelo)
    const k = 1 + Math.sin(t * 3) * 0.04
    const rr = R * 1.75 * k
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const ang = -Math.PI / 2 + i * TAU / 6
      const x = Math.cos(ang) * rr, y = Math.sin(ang) * rr * 1.05
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
    }
    ctx.closePath()
    const sg = ctx.createRadialGradient(0, 0, rr * 0.55, 0, 0, rr)
    sg.addColorStop(0, '#9fd8ff00'); sg.addColorStop(1, '#9fd8ff' + esa(0.22 * q))
    ctx.fillStyle = sg; ctx.fill()
    ctx.strokeStyle = '#dff6ff' + esa(0.8 * q); ctx.lineWidth = Math.max(2, R * 0.07); ctx.stroke()
  }
  ctx.restore()
}

/* ═══════════════ GLI ASTEROIDI ═══════════════
   Erano un poligono con un gradiente. Restano un poligono con un
   gradiente — la forma la sceglie il gioco e non cambia — ma con tre
   cose in più che si notano tutte da un metro di distanza: i crateri,
   il bordo caldo di chi entra in atmosfera, e l'ombra portata. */

export function disegnaAsteroide(ctx, a, S, t) {
  const R = a.r
  ctx.save(); ctx.translate(a.x, a.y)

  if (a.boss) {
    const k = 1 + Math.sin(t * 4 + a.ph) * 0.06
    const h = ctx.createRadialGradient(0, 0, R * 0.8, 0, 0, R * 1.9 * k)
    h.addColorStop(0, '#ff6b6b55'); h.addColorStop(0.6, '#ff9d1c22'); h.addColorStop(1, '#ff6b6b00')
    ctx.fillStyle = h; ctx.beginPath(); ctx.arc(0, 0, R * 1.9 * k, 0, TAU); ctx.fill()
    ctx.scale(k, k)
  }

  /* L'attrito sta **davanti**, non dietro: il sasso scende, quindi la
     parte che si scalda è quella di sotto. Un cono di fumo sopra la
     testa — che è quello che viene da disegnare per primo — su fondo blu
     legge come un'ombra sporca, e mette il calore dalla parte sbagliata. */
  /* col gelo acceso l'attrito diventa azzurro: il sasso non sta più
     bruciando, sta scendendo piano dentro il ghiaccio. `a.gelo` è un
     fatto già deciso da 0 a 1, e questo modulo non sa che esista un
     gettone da premere. */
  const brina = Math.max(0, Math.min(1, a.gelo || 0))
  const caldo = brina > 0 ? '#9fd8ff' : a.boss ? '#ff6b6b' : '#ff9d1c'
  const bg = ctx.createRadialGradient(0, R * 0.55, R * 0.2, 0, R * 0.55, R * 1.25)
  bg.addColorStop(0, caldo + (a.boss ? '77' : '55')); bg.addColorStop(1, caldo + '00')
  ctx.fillStyle = bg
  ctx.beginPath(); ctx.arc(0, R * 0.55, R * 1.25, 0, TAU); ctx.fill()
  // e dietro resta una traccia corta, appena accennata
  const sc = ctx.createLinearGradient(0, -R * 1.7, 0, 0)
  sc.addColorStop(0, caldo + '00'); sc.addColorStop(1, caldo + '1c')
  ctx.fillStyle = sc
  ctx.beginPath(); ctx.moveTo(-R * 0.34, 0); ctx.lineTo(0, -R * 1.7); ctx.lineTo(R * 0.34, 0)
  ctx.closePath(); ctx.fill()

  ctx.save()
  ctx.rotate(a.rot)
  ctx.beginPath()
  a.forma.forEach((m, i) => {
    const ang = i / a.forma.length * TAU
    const x = Math.cos(ang) * R * m, y = Math.sin(ang) * R * m
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
  })
  ctx.closePath()
  const rg = ctx.createRadialGradient(-R * 0.34, -R * 0.34, R * 0.12, 0, 0, R * 1.05)
  if (a.boss) { rg.addColorStop(0, '#e07068'); rg.addColorStop(0.6, '#8f2a22'); rg.addColorStop(1, '#3a0f0c') }
  else { rg.addColorStop(0, '#b3a591'); rg.addColorStop(0.6, '#6d6153'); rg.addColorStop(1, '#3a332b') }
  ctx.fillStyle = rg; ctx.fill()
  ctx.save(); ctx.clip()
  // i crateri: dischi scuri con un bordo chiaro in alto, cioè la stessa
  // regola di tutto il gioco — la luce viene dall'alto
  for (const [cx, cy, cr] of a.crateri || []) {
    ctx.beginPath(); ctx.arc(cx * R, cy * R, cr * R, 0, TAU)
    ctx.fillStyle = a.boss ? '#00000044' : '#00000038'; ctx.fill()
    ctx.beginPath(); ctx.arc(cx * R, cy * R - cr * 0.18, cr * R, Math.PI * 1.1, Math.PI * 1.9)
    ctx.strokeStyle = '#ffffff22'; ctx.lineWidth = Math.max(1, R * 0.04); ctx.stroke()
  }
  // l'ombra sul lato in basso a destra: dà volume più di dieci crateri
  const og = ctx.createLinearGradient(-R * 0.3, -R * 0.3, R, R)
  og.addColorStop(0, '#00000000'); og.addColorStop(1, '#00000066')
  ctx.fillStyle = og; ctx.fillRect(-R, -R, R * 2, R * 2)
  ctx.restore()
  ctx.lineWidth = (a.boss ? 4.5 : 2.5) * S
  ctx.strokeStyle = a.boss ? '#ffd94a' : '#241f19'
  ctx.stroke()
  ctx.restore()

  ctx.restore()

  // il numero: è la cosa che si deve leggere, quindi si disegna per
  // ultima, dritta, e non ruota con il sasso
  ctx.fillStyle = '#fff'
  ctx.font = `900 ${R * 0.85}px system-ui, sans-serif`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.lineWidth = 5 * S; ctx.strokeStyle = '#000000aa'
  ctx.strokeText(a.v, a.x, a.y); ctx.fillText(a.v, a.x, a.y)
}

/* ═══════════════ IL COLPO ═══════════════
   Un raggio che parte dalla bocca del cannone e arriva sul sasso: due
   linee sovrapposte, una larga e sfumata e una bianca sottile dentro.
   Sono i due tratti che fanno leggere «laser» invece di «riga». */

export function disegnaRaggio(ctx, r, S) {
  const q = Math.max(0, r.vita)
  ctx.save()
  ctx.globalAlpha = q
  ctx.lineCap = 'round'
  ctx.strokeStyle = r.c; ctx.lineWidth = 13 * S * q
  ctx.beginPath(); ctx.moveTo(r.x0, r.y0); ctx.lineTo(r.x1, r.y1); ctx.stroke()
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 4.5 * S * q
  ctx.beginPath(); ctx.moveTo(r.x0, r.y0); ctx.lineTo(r.x1, r.y1); ctx.stroke()
  // il bagliore alla bocca del cannone
  const g = ctx.createRadialGradient(r.x0, r.y0, 0, r.x0, r.y0, 26 * S * q)
  g.addColorStop(0, '#ffffffcc'); g.addColorStop(1, '#ffffff00')
  ctx.fillStyle = g
  ctx.beginPath(); ctx.arc(r.x0, r.y0, 26 * S * q, 0, TAU); ctx.fill()
  ctx.restore()
}

/* i pezzi dell'asteroide che si è appena rotto: spicchi della sua stessa
   forma, non cerchietti — un sasso che esplode lascia sassi */
export function disegnaFrammento(ctx, f) {
  ctx.save()
  ctx.globalAlpha = Math.max(0, f.vita)
  ctx.translate(f.x, f.y); ctx.rotate(f.rot)
  ctx.beginPath()
  f.punti.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))
  ctx.closePath()
  ctx.fillStyle = f.c; ctx.fill()
  ctx.strokeStyle = '#00000066'; ctx.lineWidth = 2; ctx.stroke()
  ctx.restore()
}
