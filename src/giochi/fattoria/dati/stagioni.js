/* ═══════════════════════════════════════════════════════════════════
   LE STAGIONI DELLA FATTORIA — NEVE A NATALE, ZUCCHE A HALLOWEEN

   Dato puro: nessun canvas, nessun Vue, nessun `Date.now()` dentro
   una funzione che non lo riceva come argomento. Chi vuole sapere
   che periodo è passa una data (`stagioneDi`), chi vuole sapere dove
   mettere le zucche passa la mappa delle celle libere
   (`addobbiStagionali`), e la scena riceve fatti già decisi — «una
   🎃 in questa cella», «una ⭐ su quel tetto» — come riceve i
   cappelli delle bestie (`dati/addobbi.js`).

   ── PERCHÉ ESISTE ─────────────────────────────────────────────────
   La fattoria è il posto dove si torna tutti i giorni, e tutti i
   giorni è uguale a ieri. Un periodo dell'anno in cui il prato si
   riempie di zucche, o nevica sui tetti, è **una cosa che succede**
   senza che nessuno l'abbia comprata: si apre il gioco a dicembre e
   c'è la neve. Non si tinge la scena e non ci sono sprite nuovi — è
   un velo sopra il disegno di sempre, più qualche emoji posata dove
   c'è posto.

   ── DUE COSE DIVERSE, E LA DIFFERENZA CONTA ───────────────────────
   **Gli addobbi effimeri** (questa tabella): compaiono da soli, non
   si salvano, non si posano, e ogni giorno sono in celle diverse —
   il seme è il giorno, così la stessa giornata è uguale a sé stessa
   e domani è un'altra. Non occupano niente: una bestia ci cammina
   attraverso, e una cosa posata lì sopra li copre.

   **Le voci stagionali del catalogo** (`stagione:` in
   `dati/catalogo.js`): si comprano nel baule **solo nella loro
   finestra**, ma quello che si è comprato resta — posato tutto
   l'anno, o nel baule finché lo si rimette giù. Niente sparisce mai
   dal salvataggio: è la regola di tutta la fattoria, e una zucca
   pagata a ottobre che si dissolve a novembre la romperebbe.

   ── LE FINESTRE SONO IN DATA LOCALE ───────────────────────────────
   `stagioneDi` legge mese e giorno con `getMonth`/`getDate`, non in
   UTC: la vigilia alle 23:30 è ancora la vigilia anche se a Greenwich
   è già domani. Natale scavalca l'anno (6 dicembre → 6 gennaio), ed è
   il caso che una finestra scritta come «da ≤ giorno ≤ a» sbaglia.
   ═══════════════════════════════════════════════════════════════════ */
import { caso } from './mondo.js'

/* `[mese, giorno]`, estremi compresi. Si ritoccano qui e in nessun
   altro posto: i test provano i bordi leggendo questa tabella, non
   dei numeri ricopiati. */
export const FINESTRE = {
  halloween: { da: [10, 20], a: [11, 2], nome: 'Halloween', icona: '🎃' },
  natale:    { da: [12, 6],  a: [1, 6],  nome: 'Natale',    icona: '🎄' },
}

const giornoDellAnno = (mese, giorno) => mese * 100 + giorno

/* Una finestra che finisce prima di cominciare (`da > a`) scavalca
   l'anno: dentro vuol dire «dopo l'inizio **oppure** prima della
   fine», non «e». */
function dentroLa(nome, data) {
  const f = FINESTRE[nome]
  const n = giornoDellAnno(data.getMonth() + 1, data.getDate())
  const da = giornoDellAnno(...f.da), a = giornoDellAnno(...f.a)
  return da <= a ? (n >= da && n <= a) : (n >= da || n <= a)
}

/* Che stagione è, o `null` per «un giorno qualunque». */
export function stagioneDi(data = new Date()) {
  return Object.keys(FINESTRE).find(nome => dentroLa(nome, data)) || null
}

/* Il seme di una giornata: cambia a mezzanotte (locale) e non prima.
   È un intero, così `caso()` lo mescola come mescola una cella. */
export function semeDelGiorno(data = new Date()) {
  return data.getFullYear() * 10000 + (data.getMonth() + 1) * 100 + data.getDate()
}

/* ── QUANTE ZUCCHE, E DOVE ────────────────────────────────────────
   Una ogni tanto, non un tappeto: `OGNI` celle libere ne esce una,
   con un minimo perché una fattoria appena nata ne abbia comunque
   un paio e un tetto perché una grande non diventi un campo di
   zucche. Le celle si ordinano per un caso **seminato dal giorno**:
   stesse celle per tutta la giornata, altre domani. */
const OGNI = 14, ALMENO = 2, AL_MASSIMO = 12

/* La misura è in pixel dello sprite, come per i cappelli delle bestie
   (`dati/addobbi.js`): così una zucca resta grande uguale a qualunque
   zoom rispetto alle cose attorno. */
const MISURA = { terra: 13, tetto: 9, angolo: 10 }

/* Gli addobbi di una stagione, già decisi cella per cella.

     stagione   'halloween' | 'natale' | null
     libere     `[[x, y], …]` le celle di prato su cui si posa
                qualcosa: terra tua, senza cose, senza bosco
     edifici    `[{ x, y, w, h, alto }]` le cose posate: piede in
                celle e altezza del disegno in celle — è quello che
                serve per sapere dov'è un tetto (`y + h - alto`)
     seme       un intero, di solito `semeDelGiorno()`

   Torna `[{ testo, x, y, misura, ondeggia? }]` con `x`, `y` in celle — il punto
   in cui va il **centro** dell'emoji — e `misura` in pixel dello
   sprite. La scena non sa se è una zucca o una stella: disegna. */
export function addobbiStagionali(stagione, { libere = [], edifici = [], seme = 0 } = {}) {
  if (!stagione || !FINESTRE[stagione]) return []
  const fuori = []
  const ordinate = libere
    .map(([x, y]) => ({ x, y, q: caso(x, y, seme) }))
    .sort((a, b) => a.q - b.q || a.x - b.x || a.y - b.y)
  const quante = Math.min(AL_MASSIMO, Math.max(Math.min(ALMENO, ordinate.length),
    Math.round(ordinate.length / OGNI)))
  /* solo le cose alte almeno due celle hanno un tetto su cui posare
     qualcosa: una panchina addobbata è una panchina coperta */
  const alti = edifici.filter(e => e.alto >= 2)

  if (stagione === 'halloween') {
    for (const c of ordinate.slice(0, quante))
      fuori.push({ testo: '🎃', x: c.x + .5, y: c.y + .55, misura: MISURA.terra })
    for (const e of alti) {
      const q = caso(e.x, e.y, seme + 1)
      if (q > .75) continue
      const cima = e.y + e.h - e.alto
      fuori.push(q < .4
        ? { testo: '🕸️', x: e.x + .4, y: cima + .45, misura: MISURA.angolo }
        : { testo: '🦇', x: e.x + e.w - .4, y: cima + .35, misura: MISURA.angolo, ondeggia: true })
    }
  } else if (stagione === 'natale') {
    const libereK = new Set(libere.map(([x, y]) => x + ',' + y))
    for (const e of alti) {
      const q = caso(e.x, e.y, seme + 2)
      const cima = e.y + e.h - e.alto
      fuori.push({ testo: q < .5 ? '⭐' : '🔔', x: e.x + e.w / 2, y: cima + .35,
                   misura: MISURA.tetto })
      /* un alberello **accanto**, sulla prima cella libera a fianco del
         piede: a destra se c'è posto, se no a sinistra, se no niente */
      const fianchi = [[e.x + e.w, e.y + e.h - 1], [e.x - 1, e.y + e.h - 1]]
      const posto = fianchi.find(([x, y]) => libereK.has(x + ',' + y))
      if (posto && q < .85)
        fuori.push({ testo: '🎄', x: posto[0] + .5, y: posto[1] + .5, misura: MISURA.terra })
    }
  }
  return fuori
}

export function guastiDelleStagioni() {
  const g = []
  for (const [nome, f] of Object.entries(FINESTRE)) {
    for (const [m, d] of [f.da, f.a])
      if (!(m >= 1 && m <= 12 && d >= 1 && d <= 31))
        g.push(`la finestra di ${nome} ha una data impossibile: ${m}/${d}`)
    if (!f.nome || !f.icona) g.push(`la stagione ${nome} non ha nome o icona`)
  }
  /* due finestre che si accavallano darebbero una stagione a caso —
     quella che `Object.keys` elenca prima */
  const nomi = Object.keys(FINESTRE)
  for (let m = 1; m <= 12; m++) for (let d = 1; d <= 31; d++) {
    const data = new Date(2026, m - 1, d)
    if (data.getMonth() !== m - 1) continue        // il 31 aprile non esiste
    const dentro = nomi.filter(n => dentroLa(n, data))
    if (dentro.length > 1) { g.push(`${dentro.join(' e ')} si accavallano il ${d}/${m}`); return g }
  }
  return g
}
