/* ═══════════════════════════════════════════════════════════════════
   DI COSA PARLA UN GIOCO, E CHE TIPO DI GIOCO È

   Due domande diverse, e la home fino a ieri non rispondeva a nessuna
   delle due. Tredici carte in fila, ognuna con una riga scritta a mano
   che diceva a che punto sei — «pianeta 3 di 10» — e niente che
   dicesse *perché* aprirlo. Chi arrivava da fuori vedeva un elenco di
   nomi di fantasia; un genitore che cercava «qualcosa sulle tabelline»
   doveva aprirne cinque per scoprirlo.

   ── LE DUE DOMANDE ───────────────────────────────────────────────
   `area` è **di cosa parla**: numeri, parole, ragionare, avventure. È
   grossa apposta — quattro scatole, non undici materie — perché serve
   a spezzare la fila in blocchi che si saltano con un pollice, non a
   catalogare. Con undici gruppi da tre carte l'una si torna a
   scorrere, che è il problema di partenza.

   `come` è **che tipo di cose fai**: rispondere a domande, pensarci
   su, muoverti in fretta, decidere prima e guardare dopo, fare con le
   mani. Questa non c'entra con la materia e non ci si raggruppa: due
   giochi di numeri possono chiedere cose oppostissime — gli asteroidi
   sono domande a raffica, la bancarella è contare monete con calma —
   e per chi sceglie stasera quella differenza pesa più della materia.

   Tenerle separate è il punto. Fuse in un campo solo — «quiz di
   matematica» — non si potrebbe più né raggruppare per materia né
   dire che il castello e le pozioni non si somigliano per niente.

   ── DOVE STANNO SCRITTE ──────────────────────────────────────────
   Non qui: qui ci sono solo i nomi e le emoji. **Chi dichiara è il
   gioco** — i sette vecchi in `data/giochi.js`, i cinque nuovi nel
   proprio `gioco.js` — esattamente come per i saperi, dove chi fa la
   domanda dichiara cosa dà per scontato. Così un gioco nuovo si
   descrive da sé e non c'è nessuna tabella da tenere allineata a mano.

   `test/unita/aree.test.mjs` controlla che le due parti si parlino:
   un gioco senza `area` o senza `come`, o che ne cita una che qui non
   esiste, è un guasto. Meglio rosso subito che una carta che sparisce
   dalla home mesi dopo perché è finita in un gruppo che non c'è.

   ── L'ORDINE È QUELLO DELLA HOME ─────────────────────────────────
   I gruppi compaiono in quest'ordine, e non è alfabetico: davanti va
   quello che il bambino apre più spesso. Un gruppo senza nemmeno un
   gioco acceso non si disegna affatto — un titolo su una fila vuota è
   una promessa non mantenuta.
   ═══════════════════════════════════════════════════════════════════ */

export const AREE = [
  { chiave: 'numeri',    emoji: '🔢', nome: 'Numeri' },
  { chiave: 'parole',    emoji: '🔤', nome: 'Parole' },
  { chiave: 'logica',    emoji: '🧩', nome: 'Ragionare' },
  { chiave: 'avventure', emoji: '🗺️', nome: 'Avventure' },
]

/* `nome` è un'etichetta e non una frase, ed è una lezione presa a
   schermo: scritti per esteso — «decidi prima, guardi dopo» — stavano
   sulla stessa riga di «tappa 1 di 13» e la mandavano a capo su quasi
   tutte le carte. Tredici carte alte una riga in più fanno mezza
   schermata di scorrimento in più, cioè il problema che questa
   schermata doveva risolvere. Una parola sola, e la riga tiene. */
export const MODI = {
  domande:   { emoji: '🎯', nome: 'domande' },
  pensare:   { emoji: '🧠', nome: 'da ragionare' },
  riflessi:  { emoji: '🎮', nome: 'riflessi' },
  strategia: { emoji: '♟️', nome: 'strategia' },
  fare:      { emoji: '🛠️', nome: 'con le mani' },
}

export const CHIAVI_AREE = AREE.map(a => a.chiave)
export const area = chiave => AREE.find(a => a.chiave === chiave) || null
export const modo = chiave => MODI[chiave] || null
