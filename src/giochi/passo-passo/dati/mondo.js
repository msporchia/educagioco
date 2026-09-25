/* ═══════════════════════════════════════════════════════════════════
   IL VOCABOLARIO DEL MONDO — cosa può stare in una cella, e le mosse

   Dato puro: le lettere con cui si scrive una mappa, gli ostacoli (alti
   e bassi), le otto mosse. Le regole che dicono cosa succede entrandoci
   stanno in `motore/mondo.js`; qui si dice solo **cosa esiste**.

   ── UNA LETTERA PER CELLA ─────────────────────────────────────────
   Una mappa è un elenco di righe tutte lunghe uguali, e ogni carattere
   è una cella. La legenda è questa e non ce n'è un'altra: una lettera
   che qui non c'è è un guasto (`guastiDellaMappa`), non una cella vuota.

     .  prato                    ~  acqua              *  ghiaccio
     @  la tana (l'arrivo)       P  la partenza, su un prato
     c  la carota, su un prato   C  la carota, sul ghiaccio
     m  un masso, su un prato    M  un masso, sul ghiaccio
     A  albero      B  cespuglio      S  sasso        (alti)
     O  sasso piantato nel ghiaccio                   (alto)
     t  tronco      -  staccionata                    (bassi)
     1 2 3  le buche collegate: la stessa cifra, la stessa coppia
     r u g  le lastre colorate: rossa, blu (u, perché B è il
            cespuglio), gialla
     p  una pecora, su un prato   #  il recinto (dove vanno le pecore)

   Perché la carota e il masso hanno due lettere e l'albero una sola:
   sotto la carota e sotto il masso il terreno **conta per le regole**
   (chi ci passa sopra scivola o no), sotto un albero no — un albero non
   lo attraversa nessuno. Il sasso nel ghiaccio ha la sua lettera solo
   per come si disegna: un sasso su un'isola d'erba in mezzo al lago
   ghiacciato si leggeva come un posto dove fermarsi.

   ── ALTI E BASSI ─────────────────────────────────────────────────
   Tutti gli ostacoli fermano chi ci cammina contro. La differenza è il
   salto: uno basso (il tronco, la staccionata) si scavalca, uno alto no.
   Sono disegni diversi apposta — il bambino deve poterlo dire guardando,
   senza provarlo — e la differenza sta in questa tabella e basta.

   ── LE PECORE E IL RECINTO ────────────────────────────────────────
   Dove ci sono le pecore non c'è la tana: il livello è del **cane**,
   e si vince quando le pecore sono tutte nel recinto. Il recinto è un
   pezzo di terra (`#`), largo quanto si vuole: le pecore ci entrano da
   qualunque lato che dia su un posto dove si cammina, e il cane non ci
   entra mai. Quali lati sono chiusi lo dice la mappa, con gli ostacoli
   attorno — e il disegno mette la staccionata proprio lì, così quello
   che si vede e quello che vale sono la stessa cosa. La carota, in un
   livello del cane, si disegna come un osso: per il motore è la stessa
   cosa da prendere.

   ── LE LASTRE ─────────────────────────────────────────────────────
   Una lastra colorata per terra non fa niente: si cammina come il prato
   (e come il prato ferma chi scivola). Serve a **guardarla**: dal
   gradino del «fino a» il coniglio può ripetere finché non ci arriva
   sopra, e dal «se» può decidere cosa fare a seconda del colore che ha
   sotto i piedi (`dati/carte.js`). Ogni colore ha anche la sua forma —
   il rosso un cerchio, il blu un quadrato, il giallo un triangolo — perché
   un bambino su dodici i colori non li distingue tutti, e la carta deve
   potersi leggere lo stesso.
   ═══════════════════════════════════════════════════════════════════ */

/* quanto è grande una mappa, al massimo: su un telefono da 390 px la
   mappa deve stare intera in larghezza e in circa metà dell'altezza, a
   ingrandimento intero (vedi `scena/tela.js`). Sette per nove bastava ai
   piccoli; i gradini dei grandi mescolano più regole e vogliono più
   posto, e a nove per undici una cella resta sui trenta pixel */
export const COLONNE_MAX = 9
export const RIGHE_MAX = 11
/* e al minimo: sotto le tre celle per lato non c'è un posto, c'è un
   corridoio */
export const LATO_MIN = 3

/* quante frecce può tenere la fila: non è un tetto di gioco (qui non
   c'è un numero di mosse da battere), è il massimo tecnico perché la
   striscia non esploda */
export const MASSIMO_FILA = 40

export const TERRENI = ['prato', 'acqua', 'ghiaccio', 'tana', 'buca', 'recinto']

export const OSTACOLI = {
  albero:      { alto: true },
  cespuglio:   { alto: true },
  sasso:       { alto: true },
  tronco:      { alto: false },
  staccionata: { alto: false },
}

/* le lastre: il colore, la forma che lo dice a chi i colori non li
   distingue, e le tinte per il disegno (`scena/pixel.js`) e per le carte */
export const LASTRE = {
  rosso:  { nome: 'rossa',  forma: 'cerchio',   colore: '#e0483a', scuro: '#a52a20' },
  blu:    { nome: 'blu',    forma: 'quadrato',  colore: '#3a78de', scuro: '#22489a' },
  giallo: { nome: 'gialla', forma: 'triangolo', colore: '#f4c430', scuro: '#b8860e' },
}

export const LEGENDA = {
  '.': { terreno: 'prato' },
  '~': { terreno: 'acqua' },
  '*': { terreno: 'ghiaccio' },
  '@': { terreno: 'tana' },
  'P': { terreno: 'prato', partenza: true },
  'c': { terreno: 'prato', carota: true },
  'C': { terreno: 'ghiaccio', carota: true },
  'm': { terreno: 'prato', masso: true },
  'M': { terreno: 'ghiaccio', masso: true },
  'A': { terreno: 'prato', ostacolo: 'albero' },
  'B': { terreno: 'prato', ostacolo: 'cespuglio' },
  'S': { terreno: 'prato', ostacolo: 'sasso' },
  'O': { terreno: 'ghiaccio', ostacolo: 'sasso' },
  't': { terreno: 'prato', ostacolo: 'tronco' },
  '-': { terreno: 'prato', ostacolo: 'staccionata' },
  '1': { terreno: 'buca', coppia: 1 },
  '2': { terreno: 'buca', coppia: 2 },
  '3': { terreno: 'buca', coppia: 3 },
  'r': { terreno: 'prato', lastra: 'rosso' },
  'u': { terreno: 'prato', lastra: 'blu' },
  'g': { terreno: 'prato', lastra: 'giallo' },
  'p': { terreno: 'prato', pecora: true },
  '#': { terreno: 'recinto' },
}

/* i colori degli anelli delle buche, uno per coppia: stanno qui e non
   nel disegno perché «la coppia 2 è viola» è un fatto del mondo che
   anche la pagina di aiuto e i test possono voler dire */
export const COPPIE = {
  1: { colore: '#ff5fa2', nome: 'rosa' },
  2: { colore: '#8d6bff', nome: 'viola' },
  3: { colore: '#ffb31a', nome: 'arancio' },
}

/* ── LE MOSSE ──
   Le frecce sono **assolute**: su è verso la cima dello schermo, sempre,
   comunque sia girato il coniglio. «Gira a destra» chiederebbe di
   ruotare la figura a mente, e a cinque anni quella capacità non c'è
   ancora: si sbaglierebbe per la ragione sbagliata.

   `salto-…` sposta di due celle scavalcando quella in mezzo. La fila del
   bambino è un elenco di queste chiavi, e basta. */
export const VERSI = {
  su:       { dx: 0,  dy: -1, nome: 'su' },
  giu:      { dx: 0,  dy: 1,  nome: 'giù' },
  sinistra: { dx: -1, dy: 0,  nome: 'a sinistra' },
  destra:   { dx: 1,  dy: 0,  nome: 'a destra' },
}
export const CHIAVI_VERSI = Object.keys(VERSI)

export const MOSSE = Object.fromEntries([
  ...CHIAVI_VERSI.map(v => [v, { verso: v, salto: false, ...VERSI[v] }]),
  ...CHIAVI_VERSI.map(v => ['salto-' + v, { verso: v, salto: true, ...VERSI[v] }]),
])
export const PASSI = CHIAVI_VERSI.slice()
export const SALTI = CHIAVI_VERSI.map(v => 'salto-' + v)

/* come si dice una mossa a chi non vede lo schermo (e ai test) */
export const nomeDellaMossa = m => {
  const d = MOSSE[m]
  if (!d) return ''
  return (d.salto ? 'salto ' : 'passo ') + d.nome
}

/* ── UNA MAPPA SCRITTA BENE ──
   Il controllo che una mappa si può leggere, senza giocarla: la forma,
   le lettere, e le cose che devono esserci una volta sola. Se una mappa
   si **vince** lo dice il risolutore (`motore/risolutore.js`), che qui
   non si importa — il dato non sa niente del motore. */
export function guastiDellaMappa(mappa, dove = 'mappa') {
  const guasti = []
  if (!Array.isArray(mappa) || !mappa.length) return [`${dove}: nessuna riga`]
  const largo = mappa[0].length
  if (mappa.some(r => typeof r !== 'string' || r.length !== largo))
    guasti.push(`${dove}: le righe non sono tutte lunghe uguali`)
  if (largo > COLONNE_MAX || mappa.length > RIGHE_MAX)
    guasti.push(`${dove}: ${largo}×${mappa.length}, il massimo è ${COLONNE_MAX}×${RIGHE_MAX}`)
  if (largo < LATO_MIN || mappa.length < LATO_MIN)
    guasti.push(`${dove}: ${largo}×${mappa.length}, troppo piccola`)

  const conta = {}
  for (const riga of mappa) for (const ch of riga) {
    if (!LEGENDA[ch]) guasti.push(`${dove}: la lettera «${ch}» non è nella legenda`)
    conta[ch] = (conta[ch] || 0) + 1
  }
  const quante = pred => Object.entries(conta)
    .filter(([ch]) => LEGENDA[ch] && pred(LEGENDA[ch])).reduce((n, [, k]) => n + k, 0)
  if (quante(d => d.partenza) !== 1) guasti.push(`${dove}: la partenza deve esserci una volta sola`)
  /* un livello del coniglio ha la sua tana e niente recinto; uno del
     cane ha le pecore, il recinto, e nessuna tana: si vince quando sono
     tutte dentro, e una tana lì sarebbe una seconda meta */
  if (quante(d => d.pecora)) {
    if (quante(d => d.terreno === 'tana')) guasti.push(`${dove}: con le pecore non c'è la tana, c'è il recinto`)
    if (!quante(d => d.terreno === 'recinto')) guasti.push(`${dove}: ci sono le pecore e non c'è il recinto`)
  } else {
    if (quante(d => d.terreno === 'tana') !== 1) guasti.push(`${dove}: la tana deve esserci una volta sola`)
    if (quante(d => d.terreno === 'recinto')) guasti.push(`${dove}: un recinto senza pecore`)
  }
  if (quante(d => d.carota) !== 1) guasti.push(`${dove}: la carota deve esserci una volta sola`)
  for (const ch of Object.keys(LEGENDA).filter(ch => LEGENDA[ch].coppia))
    if (conta[ch] && conta[ch] !== 2)
      guasti.push(`${dove}: la buca «${ch}» c'è ${conta[ch]} volte, le buche vanno a coppie`)
  return guasti
}

export function guastiDelMondo() {
  const guasti = []
  for (const [ch, d] of Object.entries(LEGENDA)) {
    if (ch.length !== 1) guasti.push(`legenda: «${ch}» non è un carattere solo`)
    if (!TERRENI.includes(d.terreno)) guasti.push(`legenda «${ch}»: terreno «${d.terreno}» sconosciuto`)
    if (d.ostacolo && !OSTACOLI[d.ostacolo]) guasti.push(`legenda «${ch}»: ostacolo «${d.ostacolo}» sconosciuto`)
    if (d.coppia && !COPPIE[d.coppia]) guasti.push(`legenda «${ch}»: la coppia ${d.coppia} non ha un colore`)
    if (d.coppia && d.terreno !== 'buca') guasti.push(`legenda «${ch}»: una coppia che non è una buca`)
    if (d.lastra && !LASTRE[d.lastra]) guasti.push(`legenda «${ch}»: la lastra «${d.lastra}» non ha un colore`)
    /* sopra un ostacolo non ci sta nient'altro: una carota dentro un
       cespuglio non la prende nessuno */
    if (d.ostacolo && (d.carota || d.masso || d.partenza || d.pecora))
      guasti.push(`legenda «${ch}»: un ostacolo con qualcosa sopra`)
  }
  if (Object.keys(MOSSE).length !== 8) guasti.push('le mosse non sono otto')
  return guasti
}
