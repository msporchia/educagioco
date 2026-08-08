/* ═══════════════════════════════════════════════════════════════════
   LA PIETRA — lastroni, mattoni, e i muri che ne vengono

   Il materiale di base del castello, e quello dove i «cubetti» si
   vedono di più. Due regole che valgono per tutto il file:

   · **la posa non è una cella**: i lastroni sono messi a corsi che
     corrono da un capo all'altro della stanza, e il corso dopo parte
     sfalsato. Un lastrone per casella e il pavimento diventa la
     scacchiera della griglia — è esattamente quello che non deve
     sembrare.
   · **la scala è la persona, non la cella**: un corso di muratura vale
     circa un quinto dell'altezza di un personaggio (`lato * 0.26`),
     così in chi cammina ci stanno quattro o cinque corsi. I lastroni
     del pavimento restano **il doppio** dei conci del muro: fatti
     uguali, pavimento e muratura diventano lo stesso tessuto e la
     stanza perde l'architettura.
   ═══════════════════════════════════════════════════════════════════ */
import { mescola, dado, rett } from '../comune.js'
import { lastra, concio, crepa } from './semina.js'

/* ── il pavimento a lastroni ── */
export function lastre(c, reg, A, lato, scoperto) {
  /* 0.53 e non 0.52: i corsi devono **non tornare mai** al passo della
     cella. Con 0.52 (cioè 13/25) ogni tredici celle il giunto ricadeva
     esattamente dov'era, e la griglia rispuntava a bande larghe; con
     53/100 la coincidenza arriva dopo cinquantatré celle, cioè oltre
     la mappa più grande che c'è. */
  const h = lato * 0.53, g = lato * 0.028
  for (let k = Math.floor(reg.y0 / h) - 1; k < Math.ceil(reg.y1 / h); k++) {
    // ogni corso comincia spostato di suo: senza, i giunti verticali si
    // incolonnano ogni tanto e la griglia rispunta
    let x = Math.floor(reg.x0 / lato) * lato - lato * (1 + dado(k, 7, 60))
    while (x < reg.x1 + lato) {
      const chiave = Math.round(x / 3)
      const r = m => dado(chiave, k, 10 + m)
      const w = lato * (0.95 + r(1) * 1.15)
      if (x + w > reg.x0 - lato && (!scoperto || scoperto(x, k * h, w, h))) {
        const col = mescola(A.lastra[0], A.lastra[1], r(2))
        lastra(c, x + g, k * h + g, w - g * 2, h - g * 2,
               col, mescola(col, '#ffffff', 0.15), mescola(col, '#000000', 0.16),
               m => dado(chiave + m, k, 30))
        if (r(3) > 0.9) crepa(c, x + w * 0.2, k * h + h * 0.3, w * 0.6,
                              mescola(col, '#000000', 0.3), m => dado(chiave, k, 40 + m))
      }
      x += w
    }
  }
}

/* ── il pavimento di mattoni antichi ──
   la griglia è globale, sfalsata riga per riga, e non si accorge
   nemmeno di dove finisce una cella */
export function mattoniPosa(c, reg, A, lato, scoperto) {
  /* i mattoni del pavimento sono **più piccoli** dei conci del muro,
     al contrario dei lastroni: un pavimento di mattonelle è fatto così,
     e nelle fogne è quello che lo distingue dalla volta. Ma non troppo
     piccoli — a un sesto di cella erano diciottomila mattoni su una
     mappa grande, quaranta millisecondi di fondale per un tessuto che
     a 36 px si legge identico a un quarto di cella. */
  /* nemmeno qui una frazione tonda della cella: `lato/3` e `lato/1.8`
     erano tre file di mattoni per cella e cinque mattoni ogni nove,
     cioè il reticolo della griglia ridisegnato in piccolo. */
  const h = lato * 0.34, w = lato * 0.57, g = h * 0.12
  for (let k = Math.floor(reg.y0 / h); k < Math.ceil(reg.y1 / h); k++) {
    const off = (k % 2) * w * 0.5
    for (let i = Math.floor((reg.x0 - off) / w); i < Math.ceil((reg.x1 - off) / w); i++) {
      const r = m => dado(i, k, 100 + m)
      const x = i * w + off, y = k * h
      if (scoperto && !scoperto(x, y, w, h)) continue
      const col = mescola(A.lastra[0], A.lastra[1], r(1))
      rett(c, x + g, y + g, w - g * 2, h - g * 2, col)
      rett(c, x + g, y + g, w - g * 2, (h - g * 2) * 0.28, mescola(col, '#ffffff', 0.14))
      rett(c, x + g, y + h - g - (h - g * 2) * 0.22, w - g * 2, (h - g * 2) * 0.22,
           mescola(col, '#000000', 0.14))
      if (r(2) > 0.93) crepa(c, x + w * 0.2, y + h * 0.3, w * 0.6,
                             mescola(col, '#000000', 0.35), m => dado(i, k, 130 + m))
    }
  }
}

/* ── il muro di pietra da taglio ──
   corsi bassi, pietre di larghezza variabile, giunti sfalsati: è il
   muro «da castello». La larghezza resta ampia apposta — ogni corso in
   più moltiplica anche le colonne, e il conto dei tracciati esplode
   (era successo: 101 ms su 34×22 invece dei ~15 di prima). */
export function pietra(c, reg, A, lato, tinte, dentro) {
  const h = lato * 0.26, g = lato * 0.018
  for (let k = Math.floor(reg.y0 / h); k < Math.ceil(reg.y1 / h); k++) {
    let x = Math.floor(reg.x0 / lato) * lato - lato
    while (x < reg.x1 + lato) {
      const r = m => dado(Math.round(x / 3), k, 400 + m)
      const w = lato * (0.42 + r(1) * 0.5)
      if (x + w > reg.x0 - lato && (!dentro || dentro(x, k * h, w, h))) {
        const col = mescola(tinte[0], tinte[1], r(2))
        concio(c, x + g, k * h + g, w - g * 2, h - g * 2, col,
               m => dado(Math.round(x / 3) + m, k, 420), r(3) > 0.9)
      }
      x += w
    }
  }
}

/* ── il muro di mattoni ──
   tutto regolare, sfalsato di mezzo mattone. Il muro vecchio si
   riconosce da qui, e dalle crepe che ci passano sopra. */
export function mattoni(c, reg, A, lato, tinte, dentro) {
  const h = lato * 0.26, w = lato * 0.62, g = h * 0.13
  for (let k = Math.floor(reg.y0 / h); k < Math.ceil(reg.y1 / h); k++) {
    const off = (k % 2) * w * 0.5
    for (let i = Math.floor((reg.x0 - off) / w) - 1; i < Math.ceil((reg.x1 - off) / w); i++) {
      const r = m => dado(i, k, 500 + m)
      const x = i * w + off, y = k * h
      if (dentro && !dentro(x, y, w, h)) continue
      const col = mescola(tinte[0], tinte[1], r(1))
      rett(c, x + g, y + g, w - g * 2, h - g * 2, col)
      rett(c, x + g, y + g, w - g * 2, (h - g * 2) * 0.3, mescola(col, '#ffffff', 0.18))
      rett(c, x + g, y + h - g - (h - g * 2) * 0.24, w - g * 2, (h - g * 2) * 0.24,
           mescola(col, '#000000', 0.16))
      if (r(2) > 0.96) crepa(c, x + w * 0.1, y + h * 0.4, w * 0.9,
                             mescola(col, '#000000', 0.4), m => dado(i, k, 520 + m))
    }
  }
}
