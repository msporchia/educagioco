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
import { RESA } from '../resa.js'
import { lastra, concio, crepa } from './semina.js'

/* ── il pavimento a lastroni ──

   ── la misura, che era sbagliata ──
   Qui sopra c'è scritto che i lastroni stanno «il doppio» dei conci
   del muro, e la regola è giusta: pavimento e muratura devono restare
   due tessuti diversi, se no la stanza perde l'architettura. Sbagliata
   era la misura con cui la si applicava. Un lastrone era largo da 0,95
   a 2,10 celle, e un personaggio è alto 1,1: si camminava su pietre
   **larghe il doppio di chi ci passa sopra**, lunghe quattro volte la
   loro altezza. Quello non è un pavimento a lastre, sono strisce; e
   con pochi pezzi enormi non c'è trama da guardare, solo campiture
   grandi separate da una riga.

   Il metro giusto era già in casa, ed è la muratura: tanti pezzi
   piccoli, ognuno di una tinta un filo diversa. La lastra scende a
   0,45-0,93 celle di larghezza e 0,34 di altezza — resta più grossa
   del concio (0,26), quindi la distinzione dei due tessuti regge, ma
   torna una lastra invece che un lastrone, e in un personaggio ce ne
   stanno tre in larghezza invece di mezza.

   La variazione di tinta cresce insieme: con pezzi piccoli la tinta è
   quasi tutto quello che si vede, e due lastre vicine identiche
   rifanno la campitura che si stava cercando di togliere. */
export function lastre(c, reg, A, lato, tinte, scoperto, opz = {}) {
  const modo = opz.modo || 'normale', sm = (opz.seme || 0) * 29
  /* `consumato` sbecca di più e allarga i giunti; `rotto` perde delle
     lastre e sotto si vede il sottofondo scuro. Come per i mattoni:
     il modo è una cosa che questa tessitura sa fare, non una vernice */
  const perde = modo === 'rotto' ? 0.78 : modo === 'consumato' ? 0.96 : 2
  /* i corsi devono **non tornare mai** al passo della cella, se no la
     griglia rispunta a bande larghe: 53/100 coincide dopo
     cinquantatré celle, 41/100 dopo quarantuno — oltre la mappa più
     grande che c'è, in tutti e due i casi */
  const h = lato * (RESA.grana ? 0.34 : 0.53), g = lato * 0.028
  for (let k = Math.floor(reg.y0 / h) - 1; k < Math.ceil(reg.y1 / h); k++) {
    // ogni corso comincia spostato di suo: senza, i giunti verticali si
    // incolonnano ogni tanto e la griglia rispunta
    let x = Math.floor(reg.x0 / lato) * lato - lato * (1 + dado(k, 7, 60))
    while (x < reg.x1 + lato) {
      const chiave = Math.round(x / 3)
      const r = m => dado(chiave, k, 10 + m + sm)
      const w = lato * (RESA.grana ? 0.45 + r(1) * 0.48 : 0.95 + r(1) * 1.15)
      if (x + w > reg.x0 - lato && (!scoperto || scoperto(x, k * h, w, h))) {
        /* la lastra che manca: si vede il sottofondo, che è scuro */
        if (r(8) > perde) {
          rett(c, x + g, k * h + g, w - g * 2, h - g * 2,
               mescola(tinte[1], '#100e10', 0.55))
          x += w; continue
        }
        let col = mescola(tinte[0], tinte[1], r(2))
        // ogni pietra è di suo un po' più chiara o più scura delle
        // vicine: è il tono, più della forma, quello che a colpo
        // d'occhio dice «tante pietre» invece di «una superficie»
        if (RESA.grana) col = mescola(col, r(6) > 0.5 ? '#ffffff' : '#000000',
                                      Math.abs(r(7) - 0.5) * 0.22)
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
lastre.modi = ['normale', 'consumato', 'rotto']

/* ── il pavimento di mattoni antichi ──
   la griglia è globale, sfalsata riga per riga, e non si accorge
   nemmeno di dove finisce una cella */
export function mattoniPosa(c, reg, A, lato, tinte, scoperto, opz = {}) {
  /* i mattoni del pavimento sono **più piccoli** dei conci del muro,
     al contrario dei lastroni: un pavimento di mattonelle è fatto così,
     e nelle fogne è quello che lo distingue dalla volta. Ma non troppo
     piccoli — a un sesto di cella erano diciottomila mattoni su una
     mappa grande, quaranta millisecondi di fondale per un tessuto che
     a 36 px si legge identico a un quarto di cella. */
  /* nemmeno qui una frazione tonda della cella: `lato/3` e `lato/1.8`
     erano tre file di mattoni per cella e cinque mattoni ogni nove,
     cioè il reticolo della griglia ridisegnato in piccolo. */
  const modo = opz.modo || 'normale', sm = (opz.seme || 0) * 31
  /* `consumato` sbiadisce e sbecca di più; `rotto` perde mattonelle e
     sotto si vede il sottofondo, come nel muro gemello di `mattoni` */
  const perde = modo === 'rotto' ? 0.86 : modo === 'consumato' ? 0.97 : 2
  const sogliaCrepa = modo === 'consumato' ? 0.8 : 0.93
  const h = lato * 0.34, w = lato * 0.57, g = h * 0.12
  const vuoto = mescola(tinte[1], '#0b0a0c', 0.55)
  for (let k = Math.floor(reg.y0 / h); k < Math.ceil(reg.y1 / h); k++) {
    const off = (k % 2) * w * 0.5
    for (let i = Math.floor((reg.x0 - off) / w); i < Math.ceil((reg.x1 - off) / w); i++) {
      const r = m => dado(i, k, 100 + m + sm)
      const x = i * w + off, y = k * h
      if (scoperto && !scoperto(x, y, w, h)) continue
      if (r(6) > perde) {
        rett(c, x + g, y + g, w - g * 2, h - g * 2, vuoto)
        rett(c, x + g, y + g, w - g * 2, (h - g * 2) * 0.3, mescola(vuoto, '#000000', 0.5))
        continue
      }
      let col = mescola(tinte[0], tinte[1], r(1))
      rett(c, x + g, y + g, w - g * 2, h - g * 2, col)
      rett(c, x + g, y + g, w - g * 2, (h - g * 2) * 0.28, mescola(col, '#ffffff', 0.14))
      rett(c, x + g, y + h - g - (h - g * 2) * 0.22, w - g * 2, (h - g * 2) * 0.22,
           mescola(col, '#000000', 0.14))
      // il consumato ha la faccia sbiancata dal passaggio, a chiazze
      if (modo === 'consumato' && r(7) > 0.4)
        rett(c, x + g, y + g, w - g * 2, h - g * 2, mescola(col, '#ffffff', 0.05 + r(8) * 0.08))
      if (r(2) > sogliaCrepa) crepa(c, x + w * 0.2, y + h * 0.3, w * 0.6,
                             mescola(col, '#000000', 0.35), m => dado(i, k, 130 + m + sm))
    }
  }
}
mattoniPosa.modi = ['normale', 'consumato', 'rotto']

/* ── il muro di pietra da taglio ──
   corsi bassi, pietre di larghezza variabile, giunti sfalsati: è il
   muro «da castello». La larghezza resta ampia apposta — ogni corso in
   più moltiplica anche le colonne, e il conto dei tracciati esplode
   (era successo: 101 ms su 34×22 invece dei ~15 di prima). */
export function pietra(c, reg, A, lato, tinte, dentro, opz = {}) {
  const modo = opz.modo || 'normale', sm = (opz.seme || 0) * 47
  /* `vecchio` sbianca la pietra e sbecca gli spigoli più spesso;
     `rotto` perde qualche concio e si vede il vuoto dietro, come nel
     pavimento di `lastre` che gli sta appena sotto */
  const perde = modo === 'rotto' ? 0.87 : 2
  const g = lato * (modo === 'vecchio' ? 0.03 : 0.018)
  const h = lato * 0.26
  const vuoto = mescola(tinte[1], '#0b0a0c', 0.6)
  for (let k = Math.floor(reg.y0 / h); k < Math.ceil(reg.y1 / h); k++) {
    let x = Math.floor(reg.x0 / lato) * lato - lato
    while (x < reg.x1 + lato) {
      const r = m => dado(Math.round(x / 3), k, 400 + m + sm)
      const w = lato * (0.42 + r(1) * 0.5)
      if (x + w > reg.x0 - lato && (!dentro || dentro(x, k * h, w, h))) {
        if (r(5) > perde) {
          rett(c, x + g, k * h + g, w - g * 2, h - g * 2, vuoto)
          rett(c, x + g, k * h + g, w - g * 2, (h - g * 2) * 0.3, mescola(vuoto, '#000000', 0.5))
          x += w; continue
        }
        let col = mescola(tinte[0], tinte[1], r(2))
        if (modo === 'vecchio') col = mescola(col, '#8f897c', 0.22)
        concio(c, x + g, k * h + g, w - g * 2, h - g * 2, col,
               m => dado(Math.round(x / 3) + m, k, 420 + sm),
               r(3) > (modo === 'vecchio' ? 0.72 : 0.9))
      }
      x += w
    }
  }
}
pietra.modi = ['normale', 'vecchio', 'rotto']

/* ── il muro di mattoni ──
   tutto regolare, sfalsato di mezzo mattone. Il muro vecchio si
   riconosce da qui, e dalle crepe che ci passano sopra.

   ── I MODI STANNO QUI DENTRO ──
   Un muro rovinato non è una macchia stesa sopra da qualcun altro: è
   **questo muro, fatto in un altro modo**. Chi chiama dice `modo:
   'rotto'` e non deve sapere altro; qui si sa che un mattone che manca
   lascia vedere il vuoto dietro, e che il vuoto è scuro e ha un bordo.
   Quando questi tre modi non bastano, la risposta è un pittore nuovo —
   non un velo — così ogni tessitura resta provabile da sola nel
   catalogo.

   `seme` sposta tutto il caso: due voci uguali con due semi diversi
   sono due muri parenti, non gemelli. È il modo più economico che
   abbiamo di togliere monotonia — una riga in più nella lista. */
export function mattoni(c, reg, A, lato, tinte, dentro, opz = {}) {
  const modo = opz.modo || 'normale', sm = (opz.seme || 0) * 37
  /* il vecchio ha i giunti più larghi e i mattoni più slavati; il
     rotto ne perde uno ogni quattro o cinque */
  const g0 = modo === 'vecchio' ? 0.2 : 0.13
  const perde = modo === 'rotto' ? 0.76 : modo === 'vecchio' ? 0.955 : 2
  const h = lato * 0.26, w = lato * 0.62, g = h * g0
  const vuoto = mescola(tinte[1], '#0b0a0c', 0.62)
  for (let k = Math.floor(reg.y0 / h); k < Math.ceil(reg.y1 / h); k++) {
    const off = (k % 2) * w * 0.5
    for (let i = Math.floor((reg.x0 - off) / w) - 1; i < Math.ceil((reg.x1 - off) / w); i++) {
      const r = m => dado(i, k, 500 + m + sm)
      const x = i * w + off, y = k * h
      if (dentro && !dentro(x, y, w, h)) continue
      /* il mattone che non c'è più: il buco si dipinge, se no resta il
         colore di quello che sta sotto e sembra trasparenza */
      if (r(4) > perde) {
        rett(c, x + g, y + g, w - g * 2, h - g * 2, vuoto)
        rett(c, x + g, y + g, w - g * 2, (h - g * 2) * 0.34, mescola(vuoto, '#000000', 0.5))
        continue
      }
      /* ── IL MATTONE DI RECUPERO ──
         Uno su dodici è di un'altra partita: più rosso o più chiaro,
         perché un muro vecchio è fatto di quello che c'era. È il
         dettaglio che costa meno di tutti e si vede da lontano — senza,
         una parete è una tinta sola ripetuta trecento volte. */
      const fuori = r(5) > 0.92
      let col = mescola(tinte[0], tinte[1], r(1))
      if (fuori) col = mescola(col, r(6) > 0.5 ? '#c98b52' : '#6d6360', 0.3)
      const bx = x + g, by = y + g, bw = w - g * 2, bh = h - g * 2
      rett(c, bx, by, bw, bh, col)
      rett(c, bx, by, bw, bh * 0.3, mescola(col, '#ffffff', 0.18))
      rett(c, bx, by + bh - bh * 0.24, bw, bh * 0.24, mescola(col, '#000000', 0.16))

      /* ── LA FACCIA NON È LISCIA ──
         Un mattone cotto ha la faccia sbucciata: due o tre chiazze
         chiare o scure, larghe un terzo di lui. A 36 px sono due
         pixel, e sono esattamente quello che manca a una campitura per
         smettere di sembrare una campitura. Ne prende metà dei mattoni:
         se le prendessero tutti tornerebbe un motivo. */
      if (r(7) > 0.5) {
        const q = 2 + Math.floor(r(8) * 2)
        for (let m = 0; m < q; m++) {
          const d = z => dado(i * 7 + m, k * 5, 560 + z + sm)
          const cw = bw * (0.14 + d(1) * 0.22), ch = bh * (0.22 + d(2) * 0.3)
          rett(c, bx + bw * d(3) * 0.8, by + bh * d(4) * 0.6, cw, ch,
               mescola(col, d(5) > 0.45 ? '#000000' : '#ffffff', 0.07 + d(6) * 0.07))
        }
      }
      /* lo spigolo scheggiato: il mattone perde un angolo e sotto si
         vede il giunto. Uno su sei, e sempre lo stesso angolo per lo
         stesso mattone — è una rottura, non uno sfarfallio */
      if (r(9) > 0.84) {
        const sw = bw * (0.14 + r(10) * 0.16), sh = bh * 0.45
        rett(c, r(11) > 0.5 ? bx : bx + bw - sw, r(12) > 0.5 ? by : by + bh - sh,
             sw, sh, mescola(A.giunto || '#241a14', col, 0.25))
      }
      const soglia = modo === 'normale' ? 0.96 : 0.88
      if (r(2) > soglia) crepa(c, x + w * 0.1, y + h * 0.4, w * 0.9,
                               mescola(col, '#000000', 0.4), m => dado(i, k, 520 + m + sm))
    }
  }
}
mattoni.modi = ['normale', 'vecchio', 'rotto']
