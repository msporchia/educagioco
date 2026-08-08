/* ═══════════════════════════════════════════════════════════════════
   I MURI

   Il pezzo di terreno che decide se una stanza si legge come una
   stanza. Sta in un file suo perché è la cosa più lunga di tutto il
   fondale, e perché la regola che lo governa è una sola e vale per
   tutti gli ambienti: **il bordo è disegnato, la massa no**.
   ═══════════════════════════════════════════════════════════════════ */
import { mescola, dado, rett, velo } from './comune.js'
import { MURI, DETTAGLI, semina } from './materiali/indice.js'

/* ═══════════════════════════════════════════════════════════════════
   I MURI, IN SEI PASSATE

   Quattro idee, tutte necessarie:
     · la muratura è **continua su tutta la mappa** e poi ritagliata
       sulla sagoma dei muri. Se le pietre si generassero cella per
       cella, ogni cella avrebbe i suoi giunti e si vedrebbe la
       griglia: è esattamente il difetto da togliere.
     · il muro ha uno **spessore**: la faccia in cima presa dalla luce,
       il fianco sotto in ombra.
     · sotto ci va l'**ombra portata**, e negli angoli il muschio.
     · in cima un filo di luce, dove il muro si affaccia sul vuoto.
   ═══════════════════════════════════════════════════════════════════ */
export function dipingiMuri(c, { A, lato, larghezza, altezza, muro }) {
  const sp = lato * 0.34                       // lo spessore che si vede
  const s = lato / 20
  const celle = []
  for (let k = 0; k < altezza; k++)
    for (let i = 0; i < larghezza; i++) if (muro(i, k)) celle.push([i, k])
  if (!celle.length) return

  /* ── il bordo e la massa ──
     La cosa che cambia una stanza più di ogni altra: **non tutta la
     muratura è superficie**. Una cella di muro circondata da altri
     muri non è una parete che qualcuno guarda, è la roccia che ci sta
     dietro; disegnarci sopra i conci riempie mezza mappa di tessuto
     che non dice niente e stanca l'occhio — «i muri sono sempre pieni
     e diventa quasi fastidioso», ed era vero.

     Quindi: le celle che toccano il pavimento (anche solo con un
     angolo) portano tutto il dettaglio — conci, giunti, spessore,
     ombra, muschio — e quelle sepolte dentro restano **massa piatta e
     scura**. Il salto fra le due è netto apposta: è quel salto a fare
     leggere la forma della stanza, perché l'occhio segue il perimetro
     invece di perdersi nella texture. E costa molto meno da dipingere,
     che è il solito regalo di quando una scelta è giusta. */
  const bordo = [], massa = []
  for (const [i, k] of celle) {
    let libero = false
    for (let dk = -1; dk <= 1 && !libero; dk++)
      for (let di = -1; di <= 1; di++)
        if ((di || dk) && !muro(i + di, k + dk)) { libero = true; break }
    ;(libero ? bordo : massa).push([i, k])
  }

  /* 1 ─ l'ombra portata sul pavimento, solo dove il muro finisce */
  for (const [i, k] of celle) {
    if (muro(i, k + 1)) continue
    const x = i * lato, y = (k + 1) * lato
    const og = c.createLinearGradient(0, y, 0, y + lato * 0.55)
    og.addColorStop(0, '#00000055'); og.addColorStop(1, '#00000000')
    c.fillStyle = og; c.fillRect(x - lato * 0.06, y, lato * 1.12, lato * 0.55)
  }

  /* 2 ─ la sagoma: tutti i blocchi alzati dello spessore, uniti in un
         solo tracciato. È questa unione che permette alla muratura di
         non accorgersi delle celle. */
  const sagoma = new Path2D()
  for (const [i, k] of celle)
    sagoma.rect(i * lato, k * lato - sp, lato, lato + sp)
  c.fillStyle = A.giunto; c.fill(sagoma)

  /* 2b ─ la massa: piatta, scura, con appena un fiato di macchia
          perché non sembri un buco di vernice. Niente conci, niente
          giunti: qui non c'è una superficie da guardare. */
  if (massa.length) {
    const dentroMassa = new Path2D()
    for (const [i, k] of massa) dentroMassa.rect(i * lato, k * lato - sp, lato, lato + sp)
    c.save(); c.clip(dentroMassa)
    const x0 = Math.min(...massa.map(m => m[0])) * lato
    const y0 = Math.min(...massa.map(m => m[1])) * lato - sp
    const x1 = Math.max(...massa.map(m => m[0])) * lato + lato
    const y1 = Math.max(...massa.map(m => m[1])) * lato + lato
    rett(c, x0, y0, x1 - x0, y1 - y0, mescola(A.muro[1], '#000000', 0.42))
    semina({ x0, y0, x1, y1 }, lato * 2.6, 51, 1, null, (x, y, r) => {
      velo(c, 0.05 + r(1) * 0.05, () => {
        c.fillStyle = r(2) > 0.5 ? A.muro[0] : '#000000'
        c.beginPath()
        c.ellipse(x, y, lato * (0.8 + r(3) * 1.4), lato * (0.5 + r(4) * 0.8), r(5) * 3, 0, 6.29)
        c.fill()
      })
    })
    c.restore()
  }

  /* 3 ─ la muratura continua, ritagliata dentro la sagoma.

     `dentro` è il risparmio che tiene il fondale sotto i venti
     millisecondi: la muratura si genera su **tutta** la mappa perché i
     giunti non devono accorgersi delle celle, ma i blocchi che
     cascano dove muro non ce n'è verrebbero comunque buttati via dal
     ritaglio. Costruirne il tracciato è la parte cara, e questa prova
     — quattro conti interi — la salta prima di cominciare. Su una
     mappa dove i muri sono un terzo delle celle il muro costa un
     terzo. Nessuna muratura *deve* usarla: chi non la chiama disegna
     tutto, come prima. */
  const suBordo = new Set(bordo.map(([i, k]) => i + ',' + k))
  const dentro = (x, y, w, h) => {
    const i0 = Math.floor(x / lato), i1 = Math.floor((x + w) / lato)
    const k0 = Math.floor(y / lato), k1 = Math.floor((y + h + sp) / lato)
    for (let k = k0; k <= k1; k++)
      for (let i = i0; i <= i1; i++) if (suBordo.has(i + ',' + k)) return true
    return false
  }
  const orlo = new Path2D()
  for (const [i, k] of bordo) orlo.rect(i * lato, k * lato - sp, lato, lato + sp)
  c.save(); c.clip(orlo)
  MURI[A.muratura](c, { x0: -lato, y0: -lato - sp, x1: larghezza * lato + lato, y1: altezza * lato },
                   A, lato, A.muro, dentro)
  c.restore()
  // il filo scuro che stacca il bordo dalla massa: senza, il salto fra
  // i conci e il piatto sembra un errore invece che una scelta
  c.save()
  c.strokeStyle = mescola(A.giunto, '#000000', 0.5)
  c.lineWidth = Math.max(1, lato * 0.05)
  for (const [i, k] of massa) {
    for (const [di, dk] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      if (!muro(i + di, k + dk)) continue
      if (!suBordo.has((i + di) + ',' + (k + dk))) continue
      c.beginPath()
      if (di) c.moveTo(i * lato + (di > 0 ? lato : 0), k * lato - sp),
              c.lineTo(i * lato + (di > 0 ? lato : 0), (k + 1) * lato)
      else c.moveTo(i * lato, k * lato + (dk > 0 ? lato : -sp)),
           c.lineTo((i + 1) * lato, k * lato + (dk > 0 ? lato : -sp))
      c.stroke()
    }
  }
  c.restore()

  /* 4 ─ il fianco in ombra: dove sotto non c'è muro, la faccia
         verticale del blocco. Senza questa il muro è un disegno per
         terra, con questa è un muro. */
  for (const [i, k] of celle) {
    if (muro(i, k + 1)) continue
    const x = i * lato, y = (k + 1) * lato - sp
    velo(c, 0.55, () => rett(c, x, y, lato, sp, '#0b0d12'))
    const fg = c.createLinearGradient(0, y, 0, y + sp)
    fg.addColorStop(0, '#ffffff18'); fg.addColorStop(1, '#00000038')
    c.fillStyle = fg; c.fillRect(x, y, lato, sp)
    // il filo di malta che chiude in basso
    rett(c, x, y + sp - sp * 0.16, lato, sp * 0.16, mescola(A.giunto, '#000000', 0.35))
  }

  /* 5 ─ il filo di luce in cima, dove il muro si affaccia sul vuoto */
  for (const [i, k] of celle) {
    if (muro(i, k - 1)) continue
    const x = i * lato, y = k * lato - sp
    velo(c, 0.5, () => rett(c, x, y, lato, lato * 0.05, mescola(A.muro[0], '#ffffff', 0.6)))
  }

  /* 6 ─ muschio e ragnatele negli angoli interni: gli angoli sono
         l'unico posto dove l'occhio va a cercare il dettaglio */
  for (const [i, k] of celle) {
    const giu = !muro(i, k + 1)
    if (giu && A.dettagli.some(d => d[0] === 'muschio') && dado(i, k, 900) > 0.55)
      DETTAGLI.muschio(c, i * lato + lato * dado(i, k, 901), (k + 1) * lato, s, A,
                       m => dado(i, k, 910 + m))
    // la ragnatela guarda la **muratura**, non la posa del pavimento:
    // guardando la posa non compariva mai, perché nessuna stanza ha il
    // pavimento di mattoni e quella dei mattoni ce li ha sui muri
    if (giu && A.muratura === 'mattoni' && dado(i, k, 920) > 0.8)
      DETTAGLI.ragnatele(c, i * lato + lato * 0.06, (k + 1) * lato + lato * 0.04, s, A,
                         m => dado(i, k, 930 + m))
  }
}

