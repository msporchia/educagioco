/* ═══════════════════════════════════════════════════════════════════
   LA CAMPAGNA — sei discese, una sotto l'altra

   Una tappa è **lo stesso sotterraneo con altri numeri**: un piano più
   largo, più stanze, più piani da fare prima di risalire, e domande più
   toste. Non c'è un motore diverso per nessuna di loro.

   ── COSA RESTA FRA UNA DISCESA E L'ALTRA: NIENTE ──────────────────
   È la domanda grossa che il prototipo lasciava aperta, e la risposta
   scelta qui è la più semplice delle due: **dentro** una discesa
   l'equipaggiamento scende con te di piano in piano, e quello è l'arco
   che dà senso a cercare una spada; **fra** una discesa e l'altra si
   riparte nudi. Quello che resta è la campagna — le tappe superate, le
   stelle — e le monete vere, che stanno nel profilo e si spendono
   altrove.

   Il motivo non è pigrizia: un equipaggiamento che persiste vuole
   un'economia (dove si ripara, cosa si rivende, come si evita che la
   tappa 6 sia una passeggiata per chi ha l'ascia) e quella economia è
   un altro gioco. Se un giorno la si vuole, si cambia qui e in
   `Gioco.vue` dove nasce la `Corsa` — il motore non se ne accorge.

   ── LA DIFFICOLTÀ È UNA MANOPOLA SOLA, E SALE IN DUE MODI ─────────
   `dif` sono i due estremi da 0 a 1 (come vuole `quiz/scelta.js`): la
   prima è la difficoltà al primo piano, la seconda quella dell'ultimo.
   Fra i due si sale in linea retta (`durezzaDi`). Poi ogni cosa
   **rincara per conto suo** — un forziere chiede più di una porta — e
   quello sta in `motore/corsa.js` con i suoi motivi. Così un bambino
   prudente vede domande più facili di uno che va a caccia di scrigni,
   e le vede nella stessa tappa.

   ── LE STANZE SONO POCHE ALL'INIZIO, E NON È UN CASO ──────────────
   Il prototipo faceva sedici stanze in un piano 52×52, e la prima cosa
   scritta sotto «cosa manca» era che sono forse troppe per una seduta:
   se il piano non si finisce mai, la scala smette di essere un
   traguardo. Qui `giri` è il numero di tagli del BSP — 2 giri fanno
   quattro stanze, 4 ne fanno sedici — e la campagna comincia da quattro.
   ═══════════════════════════════════════════════════════════════════ */

/* `portata` è dove sta la tappa sulla scala 0-100 di `data/portata.js`,
   e dice a chi va offerta. Qui NON c'è `scuola`, ed è una dichiarazione,
   non una dimenticanza: quello che questa campagna insegna non lo dà
   nessuna scuola, quindi la sua testa non si taglia mai per età — le
   prime tappe restano a disposizione anche di chi arriva grande, che
   altrimenti non imparerebbe mai come si gioca. Si taglia solo in alto. */
export const CAMPAGNA = [
  { chiave: 'cantine', nome: 'Le cantine', icona: '🕯️',
    portata: 25,
    dritta: 'due piani corti: si impara la strada',
    piani: 2, misura: 30, giri: 2, dif: [0.05, 0.22],
    guardiano: 'scheletro', capo: 'scheletro', premio: 10 },

  { chiave: 'pozzo', nome: 'Il pozzo', icona: '🪣',
    portata: 32,
    dritta: 'più stanze, e qualcuno che vende',
    piani: 3, misura: 34, giri: 3, dif: [0.12, 0.34],
    guardiano: 'scheletro', capo: 'orco', premio: 14 },

  { chiave: 'gallerie', nome: 'Le gallerie', icona: '🪨',
    portata: 40,
    dritta: 'ci si picchia sul serio',
    piani: 3, misura: 40, giri: 3, dif: [0.22, 0.5],
    guardiano: 'orco', capo: 'orco', premio: 18 },

  { chiave: 'cisterna', nome: 'La cisterna', icona: '💧',
    portata: 48,
    dritta: 'larga, e in fondo c\'è qualcosa di grosso',
    piani: 4, misura: 44, giri: 3, dif: [0.32, 0.62],
    guardiano: 'orco', capo: 'gigante', premio: 22 },

  { chiave: 'labirinto', nome: 'Il labirinto', icona: '🌀',
    portata: 56,
    dritta: 'sedici stanze: senza mappina ci si perde',
    piani: 3, misura: 52, giri: 4, dif: [0.42, 0.76],
    guardiano: 'orco', capo: 'gigante', premio: 26 },

  { chiave: 'fondo', nome: 'Il fondo', icona: '🕳️',
    portata: 64,
    dritta: 'stretto, profondo, e le domande non perdonano',
    /* stretto apposta: quattro piani da sedici stanze l'uno portavano la
       discesa oltre le novanta risposte obbligate, cioè fuori da una
       seduta. Il posto largo è il labirinto, qui si scende. */
    piani: 4, misura: 42, giri: 3, dif: [0.52, 0.92],
    /* il gigante **solo in fondo**: metterlo a guardia di ogni piano
       portava la discesa a novantasei risposte obbligate, cioè fuori da
       una seduta. Il numero non si vedeva leggendo la tabella — si vede
       solo contando, ed è il banco a contarlo */
    guardiano: 'orco', capo: 'gigante', premio: 34 },
]

export const QUANTE_TAPPE = CAMPAGNA.length

/* Quanto è difficile una domanda al piano `piano` (da 0) di una tappa.
   Un solo piano vuol dire un solo numero: si prende il primo, e non la
   media, perché il primo è quello che il bambino vede appena entra. */
export function durezzaDi(tappa, piano) {
  const [da, a] = tappa.dif
  if (tappa.piani <= 1) return da
  const q = Math.max(0, Math.min(1, piano / (tappa.piani - 1)))
  return da + (a - da) * q
}

/* Chi porta la chiave, piano per piano: l'ultimo è il capo della tappa,
   gli altri il suo guardiano di tutti i giorni. La chiave della scala è
   l'unica cosa che in tutto il sotterraneo **non si può aggirare**, e
   per questo chi la porta lo dichiara la tappa e non il caso. */
export const guardianoDi = (tappa, piano) =>
  piano >= tappa.piani - 1 ? tappa.capo : tappa.guardiano

/* Le stelle: si arriva in fondo, e la seconda e la terza dicono **come**.
   Svenire non fa perdere la discesa (ci si risveglia all'ingresso), ma
   si vede. */
export function stelleDella(esito) {
  if (!esito.vinta) return 0
  if (esito.svenimenti === 0) return 3
  if (esito.svenimenti === 1) return 2
  return 1
}

export function guastiDellaCampagna() {
  const g = []
  const viste = new Set()
  for (const t of CAMPAGNA) {
    if (viste.has(t.chiave)) g.push(`due tappe con la chiave "${t.chiave}"`)
    viste.add(t.chiave)
    if (!t.nome || !t.icona || !t.dritta) g.push(`${t.chiave}: senza nome, icona o dritta`)
    if (t.piani < 1) g.push(`${t.chiave}: zero piani`)
    if (t.misura < 24) g.push(`${t.chiave}: un piano ${t.misura}×${t.misura} non tiene le stanze`)
    if (t.giri < 2 || t.giri > 4) g.push(`${t.chiave}: ${t.giri} giri di taglio, fuori da 2..4`)
    const [da, a] = t.dif
    if (da < 0 || a > 1 || da > a) g.push(`${t.chiave}: difficoltà ${da}..${a} storta`)
    if (t.premio <= 0) g.push(`${t.chiave}: non paga niente`)
  }
  /* la campagna deve **salire**: due tappe di fila alla stessa
     difficoltà si giocano uguali e la seconda sembra una ripetizione */
  for (let i = 1; i < CAMPAGNA.length; i++)
    if (CAMPAGNA[i].dif[1] <= CAMPAGNA[i - 1].dif[1])
      g.push(`${CAMPAGNA[i].chiave} non chiede più di ${CAMPAGNA[i - 1].chiave}`)
  return g
}
