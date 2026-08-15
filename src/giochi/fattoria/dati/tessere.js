/* ═══════════════════════════════════════════════════════════════════
   IL DIZIONARIO DELLE TESSERE — L'UNICO POSTO DOVE STANNO LE COORDINATE

   Questo file è la risposta alla domanda «come aggiungo uno sprite?».
   Una riga qui, e c'è. Non si tocca nient'altro: né il generatore
   dell'atlante, né il catalogo, né il codice che disegna — quelli
   parlano solo di **nomi**, e il nome è l'unica cosa che sanno.

   ── COSA C'È IN UNA RIGA ──────────────────────────────────────────
       nome: [colonna, riga, larghezza, altezza]

   Le quattro misure sono in **tessere da 16 px**, contate sul foglio
   sorgente, con l'origine in alto a sinistra. `albero: [5, 16, 2, 2]`
   vuol dire: sesta colonna, diciassettesima riga, grande due per due.

   ── DA DOVE ARRIVANO ──────────────────────────────────────────────
   Dal foglio `Overworld.png` del set CC0 di ArMM1998
   (https://opengameart.org/content/zelda-like-tilesets-and-sprites),
   che non è versionato: si scarica, e `poc/atlante-gfx.py` ritaglia da
   lì. Il modo pratico di trovare le coordinate di una tessera nuova è
   lanciare il generatore con `--provini`, che sputa un foglio con ogni
   pezzo e il suo nome: le coordinate si sbagliano, e guardarle tutte
   insieme è il modo più rapido di accorgersene.

   ── GLI ATTORI NON STANNO QUI ─────────────────────────────────────
   Chi cammina (la bambina, Watson, la prossima gallina) non ha
   coordinate da dichiarare: ha un formato fisso — 16×32, quattro
   fotogrammi per riga, tre versi — e basta mettere il png in
   `poc/attori/` perché il generatore lo trovi da sé. Vedi `poc/attori.py`.

   ── SE UNA TESSERA VIENE MALE ─────────────────────────────────────
   Quasi sempre è il ritaglio, non il disegno. Un paio di casi già
   visti e già corretti, che valgono da avvertimento:
     · `erba*` — le prime scelte avevano dei **pixel trasparenti**, e
       sul prato ripetuto comparivano dei buchi scuri a scacchiera;
     · sempre `erba*` — venivano da due famiglie di verde diverse, e
       mescolate facevano dei quadrati più chiari che tradivano la
       ripetizione. Le quattro buone condividono lo stesso fondo.
   ═══════════════════════════════════════════════════════════════════ */

export const TESSERE = {
  /* ── il prato ────────────────────────────────────────────────────
     Tutte e quattro sullo stesso verde di fondo (#35a541), scelte
     misurandole e non a occhio: nessuna trasparenza, poco disegno. */
  erba0: [15, 30, 1, 1],
  erba1: [18, 30, 1, 1],
  erba2: [18, 29, 1, 1],
  erba3: [17, 29, 1, 1],

  /* ── quello che si trova nel bosco ────────────────────────────── */
  albero:   [5, 16, 2, 2],
  siepe:    [0, 16, 2, 1],
  ceppo:    [1, 0, 1, 1],
  sasso:    [7, 5, 1, 1],
  sassi:    [6, 5, 1, 1],
  tronco:   [3, 5, 3, 1],
  cartello: [6, 6, 2, 3],

  /* ── acqua ───────────────────────────────────────────────────────
     La fontana ha tre fotogrammi ed è l'unica cosa animata: stanno
     uno accanto all'altro, tre tessere di distanza. */
  stagno:   [2, 6, 3, 3],
  ninfea:   [2, 0, 1, 1],
  ninfee:   [4, 0, 2, 1],
  fontana0: [22, 9, 3, 3],
  fontana1: [25, 9, 3, 3],
  fontana2: [28, 9, 3, 3],

  /* ── costruzioni ─────────────────────────────────────────────────
     Sono alte più del loro piede: la casa occupa 4×2 celle per terra
     ma è cinque tessere, e il tetto sta sopra. Il piede si dichiara
     nel catalogo, non qui — qui c'è solo la figura. */
  casa:    [7, 0, 4, 5],
  fienile: [12, 0, 4, 5],
  casetta: [13, 5, 2, 3],
  pozzo:   [33, 5, 2, 2],

  /* ── recinti ─────────────────────────────────────────────────────
     `staccionata` e `palo` sono la stessa staccionata, sdraiata e in
     piedi: è per questo che nel catalogo sono una voce sola che si
     gira, invece di due voci diverse. */
  staccionata: [0, 19, 2, 1],
  palo:        [0, 17, 1, 2],
  cancello:    [3, 17, 2, 2],
  ringhiera:   [27, 8, 3, 1],

  /* ── arredo ──────────────────────────────────────────────────── */
  panchina:  [28, 4, 3, 2],
  panchina2: [28, 6, 3, 2],
  tavolo:    [35, 2, 1, 1],
  bancone:   [36, 2, 1, 1],
  cassa:     [31, 0, 1, 2],
  barile:    [33, 0, 1, 2],
  barile2:   [34, 0, 1, 2],
  sacco:     [32, 0, 1, 1],
  colonna:   [36, 0, 1, 3],

  /* ── piante e decorazioni ──────────────────────────────────────── */
  vaso_fiore:   [35, 0, 1, 1],
  vaso_pianta:  [32, 1, 1, 2],
  vaso_azzurro: [33, 2, 1, 1],
  fiori0:       [0, 8, 1, 1],
  fiori1:       [1, 8, 1, 1],
  fiori2:       [3, 11, 1, 1],
  radura:       [0, 6, 2, 3],
  orto:         [0, 34, 2, 2],
  cassetta0:    [26, 20, 1, 2],
  cassetta1:    [27, 20, 1, 2],
  cassetta2:    [28, 20, 1, 2],
  cassetta3:    [29, 20, 1, 2],
}

/* Il foglio da cui si ritaglia, e quanto è grande: serve al generatore
   per accorgersi che una coordinata cade fuori invece di ritagliare
   un rettangolo vuoto e farlo scoprire a schermo. */
export const SORGENTE = { file: 'Overworld.png', colonne: 40, righe: 36, lato: 16 }

export function guastiDelleTessere() {
  const g = []
  for (const [nome, t] of Object.entries(TESSERE)) {
    if (!Array.isArray(t) || t.length !== 4 || t.some(n => !Number.isInteger(n))) {
      g.push(`${nome}: serve [colonna, riga, larghezza, altezza] di numeri interi`)
      continue
    }
    const [c, r, w, h] = t
    if (w < 1 || h < 1) g.push(`${nome}: larghezza o altezza a zero`)
    if (c < 0 || r < 0) g.push(`${nome}: coordinate negative`)
    if (c + w > SORGENTE.colonne || r + h > SORGENTE.righe)
      g.push(`${nome}: cade fuori dal foglio (${SORGENTE.colonne}×${SORGENTE.righe} tessere)`)
  }
  if (!Object.keys(TESSERE).length) g.push('nessuna tessera dichiarata')
  return g
}
