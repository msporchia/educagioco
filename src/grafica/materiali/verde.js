/* ═══════════════════════════════════════════════════════════════════
   IL VERDE — l'erba e gli alberi

   L'erba è l'unico pavimento in cui le celle spariscono del tutto: non
   c'è niente di squadrato, solo chiazze di terra dove passa la gente.

   Gli alberi sono la cosa più strana del file: **una muratura che non
   è muratura**. Le celle chiuse del bosco non sono muri, sono chiome —
   ma la macchina che dipinge i muri (ombra portata, sagoma ritagliata,
   filo di luce in cima) va bene lo stesso, e anzi il filo di luce
   diventa il sole che batte sulle cime. Questo è tutto il vantaggio di
   avere le murature come dati: un bosco costa una funzione, non un
   secondo motore.
   ═══════════════════════════════════════════════════════════════════ */
import { mescola, dado, rett, ell, velo } from '../comune.js'
import { semina } from './semina.js'

/* ── il prato ──

   `tinte` arriva per la firma comune a tutte le pose, ma l'erba non
   ha una coppia chiaro/scuro sua: il verde del prato lo dipinge il
   fondo dell'ambiente (`A.fondo`, prima di questa passata), qui
   arrivano solo le chiazze di terra scoperta, che vogliono `A.terra`.
   Il parametro resta per uniformità e non si usa qui dentro. */
export function erba(c, reg, A, lato, tinte, scoperto, opz = {}) {
  const modo = opz.modo || 'normale', sm = (opz.seme || 0) * 101
  /* `secca` scurisce l'erba viva e allarga la terra scoperta, tirandola
     verso il paglierino; `alta` fa il contrario — meno terra, il prato
     non si è consumato — e ci aggiunge ciuffi scuri isolati */
  const soglia = modo === 'secca' ? 0.72 : modo === 'alta' ? 0.32 : 0.55
  const tono = modo === 'secca' ? mescola(A.terra, '#c9a04a', 0.4) : A.terra
  /* ── LA MINA CHE NON LO ERA PIÙ ──
     Prima queste chiazze si spargevano su tutta `reg`, senza mai
     chiedere «qui tocca a me?»: usata come voce non di fondo (una
     macchia d'erba alta in un cortile di pietra, per dire) copriva
     l'intera stanza invece di restare nella sua fetta. Il controllo è
     approssimato — un riquadro largo quanto il passo della semina, non
     il contorno vero della chiazza, che non si conosce finché non si è
     già dentro `fn` — ma il predicato lo decide comunque per blocchi. */
  const dentro = scoperto ? (x, y) => scoperto(x - lato, y - lato, lato * 2, lato * 2) : null
  semina(reg, lato * 2.1, 11 + sm, 1, dentro, (x, y, r) => {
    /* piccole e tenui: grandi tre quarti di cella e al trenta per
       cento di velo erano bolle chiare, e una miniera con le bolle
       sembra una pozza di fango invece che terra battuta */
    if (r(1) > soglia) return
    const rx = lato * (0.4 + r(2) * 0.8) * (modo === 'secca' ? 1.25 : 1)
    velo(c, 0.42 + r(3) * 0.26, () => ell(c, x, y, rx, rx * (0.5 + r(4) * 0.3), tono))
    velo(c, 0.3, () => ell(c, x - rx * 0.2, y - rx * 0.15, rx * 0.6, rx * 0.3,
                           mescola(tono, '#ffffff', 0.25)))
  })
  // l'erba alta: ciuffi scuri isolati, un filo d'erba non tosata che
  // spicca sul prato raso — è quello che manca a «secca» per dire
  // «lasciata crescere» invece che «bruciata dal sole»
  if (modo === 'alta')
    semina(reg, lato * 0.7, 41 + sm, 1,
      scoperto ? (x, y) => scoperto(x - lato * 0.4, y - lato * 0.4, lato * 0.8, lato * 0.8) : null,
      (x, y, r) => {
        if (r(1) > 0.45) return
        velo(c, 0.34 + r(2) * 0.22, () => {
          c.strokeStyle = mescola(A.chiazze ? A.chiazze[1] : '#284a28', '#000000', 0.2)
          c.lineWidth = lato * 0.03; c.lineCap = 'round'
          c.beginPath()
          c.moveTo(x, y + lato * 0.16)
          c.lineTo(x + lato * (r(3) - 0.5) * 0.24, y - lato * 0.24)
          c.stroke()
        })
      })
}
erba.modi = ['normale', 'secca', 'alta']

/* ── le chiome del bosco ──
   Ciuffi tondi e fitti, due verdi, più qualche tronco che si
   intravede sotto. Un bosco visto dall'alto è chioma: il tronco si
   indovina, non si disegna. */
export function alberi(c, reg, A, lato, tinte, dentro, opz = {}) {
  const modo = opz.modo || 'normale', sm = (opz.seme || 0) * 103
  /* `autunno` sposta le chiome verso l'arancio; `secco` le spegne, le
     rimpicciolisce e ne perde qualcuna intera — il sottobosco si vede
     più spesso, come un bosco che ha già perso metà foglie */
  const vira = col => modo === 'autunno' ? mescola(col, '#c96a2c', 0.55)
                     : modo === 'secco' ? mescola(col, '#8a7a52', 0.55) : col
  // il sottobosco scuro sotto le chiome: senza, fra un ciuffo e
  // l'altro si vedrebbe il pavimento
  rett(c, reg.x0, reg.y0, reg.x1 - reg.x0, reg.y1 - reg.y0, mescola(tinte[1], '#000000', 0.35))
  const passo = lato * 0.5
  for (let k = Math.floor(reg.y0 / passo) - 1; k < Math.ceil(reg.y1 / passo) + 1; k++)
    for (let i = Math.floor(reg.x0 / passo) - 1; i < Math.ceil(reg.x1 / passo) + 1; i++) {
      if (dentro && !dentro(i * passo, k * passo, passo, passo)) continue
      const r = m => dado(i, k, 1300 + m + sm)
      if (modo === 'secco' && r(6) > 0.72) continue    // la chioma persa
      const cx = (i + 0.5 + (r(1) - 0.5) * 0.9) * passo
      const cy = (k + 0.5 + (r(2) - 0.5) * 0.9) * passo
      const rr = passo * (0.55 + r(3) * 0.45) * (modo === 'secco' ? 0.8 : 1)
      const col = vira(mescola(tinte[0], tinte[1], r(4)))
      ell(c, cx, cy + rr * 0.25, rr, rr * 0.82, mescola(col, '#000000', 0.3))
      ell(c, cx, cy, rr, rr * 0.86, col)
      // il lume in cima al ciuffo: è quello che fa la chioma tonda
      if (r(5) > 0.4)
        ell(c, cx - rr * 0.28, cy - rr * 0.3, rr * 0.45, rr * 0.32,
            mescola(col, modo === 'autunno' ? '#ffe08a' : '#ffffff', 0.22))
    }
  semina(reg, lato * 1.9, 37 + sm, 1, null, (x, y, r) => {
    // il secco dirada le chiome, quindi mostra più tronchi: è la stessa
    // logica di un bosco che sta perdendo la copertura
    if (r(1) < (modo === 'secco' ? 0.4 : 0.62)) return
    velo(c, 0.55, () => {
      ell(c, x, y, lato * 0.16, lato * 0.13, '#4a3520')
      ell(c, x - lato * 0.05, y - lato * 0.04, lato * 0.07, lato * 0.05, '#6a4f30')
    })
  })
}
alberi.modi = ['normale', 'autunno', 'secco']
