/* ═══════════════════════════════════════════════════════════════════
   LE CAMPAGNE DEL CASTELLO — quello che di una tappa si racconta.

   Qui dentro non c'è un solo numero di equilibrio. Una tappa dichiara
   il suo nome, il terreno su cui si combatte, il percorso che i mostri
   percorrono, chi arriva, quali operazioni mette a disposizione — e
   una cosa sola che non è racconto ma promessa:

     `calcoli`   quante operazioni in colonna costa finirla

   È il bersaglio, non una misura: `data/castello.js` ci costruisce
   sopra le ondate, l'energia, i prezzi e le postazioni, e `npm run
   tara` ci tara sopra la vita dei nemici. Prima era il contrario — il
   numero di calcoli usciva dai conti, e usciva sbagliato: ventuno per
   la prima tappa, cinquantadue per l'ultima. Una partita diventava un
   compito.

   Quattro archi da cinque tappe. I primi tre ripartono più bassi della
   fine del precedente ma arrivano più in alto; il quarto no, e apposta:

     Bosco         6 · 7 · 8 · 10 · 12
     Sotterraneo   9 · 11 · 13 · 16 · 19
     Mura         14 · 18 · 22 · 26 · 30
     Palude       12 · 14 · 18 · 21 · 24

   Alla fine delle Mura il gioco ha finito le operazioni da insegnare, e
   trenta calcoli sono già un pomeriggio: continuare a salire vorrebbe
   dire trasformare una partita in un compito, che è esattamente
   l'errore da cui questo riassetto è partito. Quindi nella Palude i
   calcoli **scendono** e a crescere è la difficoltà tattica — gli
   ingressi da cui arrivano i mostri, che diventano due e poi tre.

   Le quattro torri: `add` arciere 🏹, `sub` magica 🔮 (danno a zona),
   `mul` ghiaccio ❄️ (non fa danno: gela), `div` bombe 💣.

   ── le torri, e perché entrano tutte nel Bosco ──
   Il Bosco è il tutorial e basta: introduce le quattro torri una per
   volta, una ogni tappa o due. Dal Sotterraneo in avanti sono tutte
   aperte, perché chi arriva lì il tutorial l'ha già fatto e il gioco
   non è più «quale torre si sblocca» ma «quale torre serve adesso».

   ── i rami, e perché non nel Bosco ──
   `rami: true` accende il bivio a metà scaletta: al quarto gradino la
   torre sceglie un mestiere — cecchino o raffica, veleno o catena — e
   la scelta non costa un calcolo in più, è quello che il calcolo
   compra. Sta acceso **dal Sotterraneo in poi**, dieci tappe su
   quindici. Nel Bosco no, nemmeno nell'ultima che pure ha già tutte e
   quattro le torri: lì la lezione è ancora «salire conviene più che
   allargarsi», e un bivio davanti a chi non ha ancora capito a cosa
   serve potenziare è una domanda senza contesto. Chi arriva sotto
   terra l'ha capito, e allora il gioco può cominciare a chiedergli
   *come* vuole salire.

   ── le resistenze, e perché quasi dappertutto ──
   Ogni mostro ha un tipo di torre che gli fa **un terzo** del danno
   (`data/mostri.js`). Accenderlo in una tappa sola lo rendeva un
   dettaglio; qui è acceso **da Bosco 2 in poi**, cioè in quattordici
   tappe su quindici. Fuori resta solo la primissima, che ha una torre
   sola che spara: lì una resistenza non sarebbe una scelta ma una
   condanna, perché non c'è nient'altro da costruire.
   Due regole tengono la cosa onesta, e `strumenti/valida-percorsi.mjs`
   le verifica:
     · ogni mostro dell'elenco resiste a una torre che **quella tappa
       mette a disposizione** — se no il nastro avverte di un bottone
       chiuso, cioè di niente;
     · in un elenco compaiono almeno **due** resistenze diverse — se
       fossero tutte uguali basterebbe non comprare mai quella torre e
       la scelta sparirebbe.
   Le file qui sotto fanno di più: girano i tre bersagli in ordine, in
   modo che due ondate di fila non chiudano mai la stessa torre — e chi
   ha costruito bene per l'ondata di adesso deve rimettersi a pensare
   per la prossima. Il ghiaccio non compare mai fra le resistenze: non
   fa danno, e un terzo di zero è zero.
   ═══════════════════════════════════════════════════════════════════ */

/* ═══════════════ I PERCORSI ═══════════════

   Una `forma` è una spezzata in coordinate 0–1 sul riquadro del campo.
   `motore/battaglia.js` la smussa (Chaikin, `grafica/geometria.js`) e
   ci dispone le postazioni ai lati, alternate, **partendo
   dall'ingresso**: ogni torre nuova allunga la difesa verso il
   castello.

   ── il riquadro vero ──
   Il campo è **verticale**, come il gioco: `MONDO` in
   `data/castello.js` dice 420×760, uguale su ogni schermo. Non è più il
   riquadro quasi quadrato di prima (390×420 sul telefono, 520×420 sul
   computer, e le mappe che si stiravano fra i due): il banco dei
   bottoni non c'è più, il campo si prende tutta la schermata, e quello
   che cambia da un telefono a un monitor è solo quanto lo si vede
   grande.

   ── i margini, e perché ──
     x ∈ [0.05, 0.95]   una strada che tocca il bordo sembra tagliata
     y ∈ [0.04, 0.95]   il castello in fondo al percorso è alto una
                        cinquantina di unità sopra il suo piede
   Il percorso entra sempre dal bordo **di sopra** ed esce **in fondo**:
   da lì scendono i nemici, e in fondo — vicino al pollice, dove si
   difende — c'è il castello.

   ── quanto due tratti possono avvicinarsi ──
   Una postazione sta a 34 unità dal centro della strada e la sua
   piazzola ne è larga 15; mezza strada ne misura 17. Fanno 66: sotto,
   una piazzola finisce sopra l'altra corsia. Ma il conto vale fra
   **corsie parallele**, non dentro un gomito — nell'incavo di una
   curva la torre ci sta apposta, ed è metà del mestiere di chi la
   piazza. Il validatore quindi distingue i due casi dalla distanza
   *lungo il cammino*: fino a 200 unità è un gomito (minimo 52), oltre
   sono due corsie diverse (minimo 62).

   ── la difficoltà che sta nella mappa ──
   Il raggio di una torre va da 86 a 132 unità: su un campo largo 420
   una torre ne vede un bel pezzo. Quello che conta non è la lunghezza
   in sé ma **quanta strada ogni torre tiene sotto tiro** — un
   tracciato che si ripiega si fa battere due o tre volte dalla stessa
   torre, uno diritto una volta sola. Il validatore la chiama
   `presidio` (strada per postazione, misurata in raggi d'arciere), e
   scende di campagna in campagna:

     Bosco        ~2,4     serpentine che si ripiegano: perdonano
     Sotterraneo  ~2,1     cunicoli: qualche gomito, meno regali
     Mura         ~1,9     rettifili: una torre, un tratto, e basta

   È il numero che regge la difficoltà, e **non è cambiato** con il
   campo nuovo: le strade sono più lunghe — un riquadro 420×760 ha più
   posto di uno 390×420 — ma quanto si ripiegano su sé stesse è la
   stessa promessa di prima.

   Il verso, invece, è cambiato tutto: si scende. Le corsie sono
   orizzontali e stanno una sotto l'altra, e la distanza fra due corsie
   è la manopola del presidio — settanta-novanta unità e una torre in
   mezzo ne batte due, oltre centocinquanta ne batte una sola. */

/* ── BOSCO: sentieri che si perdono nel verde ──
   Serpentine larghe, diagonali, niente spigoli. Le anse stanno vicine:
   qui una torre lavora due volte, ed è il regalo che il bosco fa a chi
   sta imparando. */

// il sentiero: quattro anse che attraversano il bosco da parte a
// parte, una sotto l'altra e vicine. È la prima tappa: chi comincia ha
// bisogno di tempo, non di sconti sui nemici — e con le corsie così
// strette ogni torre lavora due volte.
const BOSCO_SENTIERO = [
  [0.36, 0.04], [0.30, 0.13], [0.72, 0.19], [0.76, 0.28], [0.30, 0.34],
  [0.26, 0.43], [0.70, 0.49], [0.74, 0.60], [0.34, 0.68], [0.30, 0.82],
  [0.54, 0.95]]

// il guado: si scende alla riva, si costeggia l'acqua da una sponda
// all'altra e si torna giù
const BOSCO_GUADO = [
  [0.30, 0.04], [0.26, 0.14], [0.66, 0.20], [0.70, 0.30], [0.28, 0.37],
  [0.24, 0.48], [0.68, 0.55], [0.72, 0.66], [0.36, 0.73], [0.40, 0.86],
  [0.62, 0.95]]

// la radura: il sentiero gira **attorno** alla radura e poi se ne va.
// L'anello è il regalo del bosco: una torre in mezzo batte due tratti.
const BOSCO_RADURA = [
  [0.46, 0.04], [0.26, 0.11], [0.22, 0.22], [0.54, 0.28], [0.76, 0.22],
  [0.80, 0.34], [0.44, 0.40], [0.24, 0.48], [0.28, 0.60], [0.66, 0.66],
  [0.62, 0.80], [0.44, 0.95]]

// il folto: cinque denti stretti fra i tronchi, avanti e indietro
// senza respiro. Il tracciato più ripiegato del gioco.
const BOSCO_FOLTO = [
  [0.38, 0.04], [0.30, 0.12], [0.74, 0.18], [0.78, 0.28], [0.28, 0.35],
  [0.22, 0.45], [0.66, 0.51], [0.70, 0.61], [0.26, 0.68], [0.30, 0.81],
  [0.58, 0.88], [0.52, 0.95]]

// la radice: tre tornanti attorno alla radice affiorata, e via. Il
// bosco si apre: da qui i tracciati cominciano ad accorciarsi.
const BOSCO_RADICE = [
  [0.32, 0.04], [0.26, 0.16], [0.70, 0.23], [0.74, 0.34], [0.30, 0.41],
  [0.26, 0.54], [0.68, 0.61], [0.64, 0.76], [0.36, 0.84], [0.44, 0.95]]

/* ── SOTTERRANEO: cunicoli ──
   Gomiti netti e rettifili: sotto terra le gallerie le ha scavate
   qualcuno. Più corti del bosco, e via via meno ripiegati. */

// la grotta: la caverna più larga di tutte, con il pilastro in mezzo
const SOTTO_GROTTA = [
  [0.34, 0.04], [0.28, 0.16], [0.70, 0.24], [0.74, 0.38], [0.30, 0.46],
  [0.26, 0.60], [0.68, 0.68], [0.60, 0.82], [0.40, 0.95]]

// la miniera: gallerie a squadra, una sotto l'altra
const SOTTO_MINIERA = [
  [0.28, 0.04], [0.26, 0.18], [0.72, 0.24], [0.74, 0.40], [0.28, 0.48],
  [0.26, 0.64], [0.68, 0.72], [0.66, 0.95]]

/* ── le fogne: la prima tappa con due ingressi ──
   Due collettori che scendono e sboccano nella stessa vasca. Da qui in
   avanti qualche tappa ne ha due: strade diverse, un castello solo, e
   una difesa che va divisa. Le due si avvicinano solo in fondo, dove
   la porta è una — se si unissero prima si difenderebbe il tratto
   comune e i due ingressi non li guarderebbe più nessuno. */
const SOTTO_FOGNE = [
  [[0.22, 0.04], [0.13, 0.16], [0.32, 0.26], [0.14, 0.38], [0.32, 0.50], [0.16, 0.62],
   [0.30, 0.76], [0.50, 0.95]],
  [[0.74, 0.04], [0.83, 0.16], [0.64, 0.26], [0.82, 0.38], [0.64, 0.50], [0.80, 0.62],
   [0.66, 0.76], [0.50, 0.95]]]

// la cripta: una scala regolare che scende di loculo in loculo, tutta
// ad angoli retti — l'unica mappa che si potrebbe disegnare col righello
const SOTTO_CRIPTA = [
  [0.22, 0.04], [0.22, 0.24], [0.66, 0.24], [0.66, 0.46], [0.26, 0.46],
  [0.26, 0.68], [0.70, 0.68], [0.70, 0.86], [0.48, 0.95]]

// la gola: stretta e quasi diritta, tre gomiti e sei fuori
const SOTTO_GOLA = [
  [0.36, 0.04], [0.30, 0.16], [0.68, 0.24], [0.72, 0.40], [0.32, 0.50],
  [0.28, 0.66], [0.62, 0.76], [0.54, 0.95]]

/* ── MURA: dentro il castello ──
   Rettifili e angoli retti, e soprattutto **corti**: qui i nemici
   arrivano addosso, e una torre batte un tratto solo. */

// il cortile: si gira attorno al pozzo e si scende alla porta
const MURA_CORTILE = [
  [0.30, 0.04], [0.32, 0.26], [0.74, 0.36], [0.70, 0.62], [0.30, 0.72],
  [0.36, 0.95]]

// il camminamento: la ronda sopra le mura, un lungo rettifilo e giù
const MURA_CAMMINAMENTO = [
  [0.24, 0.04], [0.28, 0.30], [0.76, 0.42], [0.72, 0.68], [0.44, 0.95]]

// il corridoio: un dritto, un gomito, un dritto
const MURA_CORRIDOIO = [
  [0.70, 0.04], [0.64, 0.26], [0.24, 0.38], [0.28, 0.60], [0.66, 0.72],
  [0.56, 0.95]]

// la sala del trono: si entra, si taglia la sala in diagonale, si esce
// dal fondo. Nessun tornante: chi sbaglia a comprare lo vede subito.
const MURA_TRONO = [
  [0.34, 0.04], [0.38, 0.34], [0.72, 0.50], [0.64, 0.78], [0.44, 0.95]]

// il torrione: la rampa e la scala di servizio, tutte e due alla porta
// in cima. I due tracciati più esposti del gioco, l'uno di fronte
// all'altro: qui non c'è più niente da imparare, solo da difendere.
const MURA_TORRIONE = [
  [[0.24, 0.04], [0.34, 0.22], [0.16, 0.40], [0.32, 0.58], [0.22, 0.76], [0.48, 0.95]],
  [[0.76, 0.04], [0.66, 0.24], [0.84, 0.42], [0.68, 0.60], [0.78, 0.78], [0.48, 0.95]]]


/* ── PALUDE: acqua ferma e più di una strada ──
   La quarta campagna, e la prima che non cresce chiedendo più conti.
   Dalle Mura in giù il gioco aveva finito le operazioni da insegnare —
   trenta calcoli sono un pomeriggio, e più di così diventa un compito.
   Quindi qui i calcoli **scendono** (dodici, come a metà bosco) e a
   crescere è quello che si deve capire: da dove arrivano, quanti fronti
   ci sono, quale torre dove.

   E ognuna ha una **forma diversa**, che è il punto:

     il guado     una Y: due bracci, un tronco corto
     il canneto   un'immissione: una strada lunga, un canale che entra
     le isole     un anello: una bocca sola che si sdoppia e si richiude
     il pantano   due strade che si allontanano e non si toccano mai
     la foce      una clessidra: due bocche, un nodo, due rami, una porta

   Le strade si possono fondere perché il `Percorso` non chiede che
   restino separate — chiede solo che ognuna sappia dov'è il suo
   ingresso e dove il castello. Due forme che finiscono negli stessi
   punti *sono* una Y; due che cominciano dagli stessi punti sono un
   anello. Quello che il validatore non lascia passare è la via di
   mezzo: un tratto lungo in cui due strade stanno a venti o trenta
   unità, che a schermo si legge come una strada sola sbavata e in
   gioco sono due che nessuna torre copre insieme. */

// il guado: due bracci che si fondono a due terzi di strada. È la Y
// più semplice del gioco, e la prima volta che due file di mostri
// diventano una sola: sul tronco si difende una volta per tutti, ma il
// tronco è corto e prima ci sono due strade da guardare.
const PALUDE_TRONCO = [[0.36, 0.66], [0.46, 0.80], [0.50, 0.95]]
const PALUDE_GUADO = [
  [[0.14, 0.04], [0.08, 0.28], [0.18, 0.52], ...PALUDE_TRONCO],
  [[0.84, 0.04], [0.92, 0.28], [0.82, 0.52], [0.62, 0.62], ...PALUDE_TRONCO]]

// il canneto: una strada lunga che serpeggia e un canale che le si
// immette contro, ma **in fondo**: fino a lì sono due strade da
// guardare, e il tratto in cui bastano gli stessi occhi è corto.
const PALUDE_SBOCCO = [[0.44, 0.86], [0.50, 0.95]]
const PALUDE_CANNETO = [
  [[0.18, 0.04], [0.12, 0.22], [0.30, 0.36], [0.14, 0.54], [0.28, 0.72], ...PALUDE_SBOCCO],
  [[0.86, 0.04], [0.90, 0.28], [0.80, 0.54], [0.68, 0.74], ...PALUDE_SBOCCO]]

// le isole: una bocca sola, e la strada si sdoppia attorno all'isola
// per richiudersi in fondo. Un anello vero: i mostri di un'ondata si
// dividono da soli, e la torre in mezzo all'isola guarda tutte e due.
const ISOLE_TESTA = [[0.50, 0.04], [0.50, 0.14]]
const ISOLE_CODA = [[0.50, 0.78], [0.50, 0.95]]
const PALUDE_ISOLE = [
  [...ISOLE_TESTA, [0.14, 0.22], [0.10, 0.48], [0.30, 0.70], ...ISOLE_CODA],
  [...ISOLE_TESTA, [0.86, 0.22], [0.90, 0.48], [0.70, 0.70], ...ISOLE_CODA]]

// il pantano: due strade che si allontanano invece di avvicinarsi, e si
// ritrovano solo davanti alla porta. Qui una torre non guarda mai
// dall'altra parte, ed è l'opposto esatto dell'anello di prima.
const PALUDE_PANTANO = [
  [[0.16, 0.04], [0.10, 0.24], [0.26, 0.44], [0.10, 0.64], [0.26, 0.82], [0.50, 0.95]],
  [[0.84, 0.04], [0.90, 0.24], [0.74, 0.44], [0.90, 0.64], [0.74, 0.82], [0.50, 0.95]]]

// la foce: una clessidra. Due bocche che si fondono in un nodo a metà
// campo, e dal nodo due rami che si riaprono e si richiudono davanti
// alla porta. Il nodo è il posto d'oro — lì passano tutti — ma è uno
// solo, e quello che gli scappa poi si divide di nuovo.
const FOCE_NODO = [[0.50, 0.56]]
const FOCE_PORTA = [[0.50, 0.95]]
const PALUDE_FOCE = [
  [[0.14, 0.04], [0.08, 0.26], [0.26, 0.42], ...FOCE_NODO,
   [0.28, 0.70], [0.38, 0.86], ...FOCE_PORTA],
  [[0.86, 0.04], [0.92, 0.26], [0.74, 0.42], ...FOCE_NODO,
   [0.72, 0.70], [0.62, 0.86], ...FOCE_PORTA]]

/* ═══════════════ LE TAPPE ═══════════════

   `ambiente` è la chiave di `grafica/terreni/indice.js`: tre terreni
   veri — bosco, sotterraneo, mura — e quindici tavolozze, una per
   tappa, perché il viaggio si veda anche dove il terreno è lo stesso.

   `mostri` è la fila da cui `mostroDiOnda` pesca, un tipo per ondata,
   a giro. Il commento accanto a ogni fila è la sequenza delle torri
   **che quell'ondata chiude** — quella che le fa un terzo del danno,
   cioè quella da non comprare adesso: 🏹 arciere, 🔮 magica, 💣 bombe. */
export const CAMPAGNE = [
  {
    id: 'bosco', nome: 'Il bosco', emoji: '🌲',
    /* Il bosco è la scuola. Le quattro torri entrano una alla volta, i
       sentieri sono i più lunghi e i più ripiegati del gioco, e i
       mostri sono quelli che si guardano volentieri. */
    tappe: [
      { nome: 'Il sentiero', emoji: '🌱', ambiente: 'bosco-chiaro', calcoli: 6, cap: 3,
        torri: ['add'],
        // l'unica tappa senza resistenze: con una torre sola sarebbe una condanna
        mostri: ['slime', 'goblin'], forma: BOSCO_SENTIERO },
      { nome: 'Il guado', emoji: '💧', ambiente: 'bosco-guado', calcoli: 7, cap: 4,
        torri: ['add', 'sub'], resistenze: true,
        /* 🏹 🔮 — due mostri, due torri: la resistenza al suo minimo
           leggibile. Il goblin ferma le frecce e lo slime la magia,
           quindi ogni ondata lascia aperta esattamente l'altra. */
        mostri: ['goblin', 'slime'], forma: BOSCO_GUADO },
      { nome: 'La radura', emoji: '🍀', ambiente: 'bosco-radura', calcoli: 8, cap: 5,
        torri: ['add', 'sub'], resistenze: true,
        // 🏹 🔮 🏹 🔮
        mostri: ['ragno', 'slime', 'pipistrello', 'golem'], forma: BOSCO_RADURA },
      { nome: 'Il folto', emoji: '🌳', ambiente: 'bosco-fitto', calcoli: 10, cap: 6,
        torri: ['add', 'sub', 'mul'], resistenze: true,
        // 🏹 🔮 🏹 🔮 — entra il ghiaccio, che nessuno riesce a chiudere
        mostri: ['pipistrello', 'golem', 'goblin', 'fantasma'], forma: BOSCO_FOLTO },
      { nome: 'La radice', emoji: '🪵', ambiente: 'bosco-notte', calcoli: 12, cap: 7,
        // niente rami: il bosco insegna a salire, non ancora a scegliere
        torri: ['add', 'sub', 'mul', 'div'], resistenze: true,
        /* 🏹 🔮 💣 🏹 🔮 💣 — arrivano le bombe, e con loro i primi due
           che le reggono: lo scheletro (dentro non c'è niente da far
           scoppiare) e l'arpia, che vola troppo in fretta per un colpo
           lento. L'orco invece entra qui come muro di cuoio: le frecce
           le ferma, tutto il resto no. */
        mostri: ['ragno', 'fantasma', 'scheletro', 'orco', 'golem', 'arpia'],
        forma: BOSCO_RADICE },
    ],
  },
  {
    id: 'sotterraneo', nome: 'Il sotterraneo', emoji: '🕯️',
    /* Sotto terra tutte e quattro le torri sono aperte dal primo
       minuto: non si sblocca più niente, si sceglie. I cunicoli si
       raddrizzano tappa dopo tappa. */
    tappe: [
      { nome: 'La grotta', emoji: '🕳️', ambiente: 'grotta', calcoli: 9, cap: 5,
        torri: ['add', 'sub', 'mul', 'div'], resistenze: true, rami: true,
        // 🏹 🔮 💣
        mostri: ['pipistrello', 'golem', 'scheletro'], forma: SOTTO_GROTTA },
      { nome: 'La miniera', emoji: '⛏️', ambiente: 'miniera', calcoli: 11, cap: 6,
        torri: ['add', 'sub', 'mul', 'div'], resistenze: true, rami: true,
        // 💣 🏹 🔮
        mostri: ['scheletro', 'goblin', 'golem'], forma: SOTTO_MINIERA },
      { nome: 'Le fogne', emoji: '🕸️', ambiente: 'fogne', calcoli: 13, cap: 7,
        torri: ['add', 'sub', 'mul', 'div'], resistenze: true, rami: true,
        /* 🔮 💣 🔮 🏹 — l'unica fila che non gira i tre bersagli in
           parti uguali, e non è una svista. Le fogne hanno nove
           piazzole, le più larghe di manica del Sotterraneo, e con due
           bocche le prime due ondate non portano resistenze: con un
           giro pari la tappa usciva dalla taratura più dura della
           Cripta e della Gola che vengono dopo. Chiudendo la magica
           due volte su quattro invece di una su tre, la scala della
           campagna torna a salire. Il verme e la blatta ci stanno di
           casa, che è l'altra metà della ragione. */
        mostri: ['slime', 'verme', 'blatta', 'ragno'], forme: SOTTO_FOGNE },
      { nome: 'La cripta', emoji: '⚰️', ambiente: 'cripta', calcoli: 16, cap: 8,
        torri: ['add', 'sub', 'mul', 'div'], resistenze: true, rami: true,
        // 🔮 🏹 💣 🔮 🏹 💣
        mostri: ['fantasma', 'pipistrello', 'scheletro', 'golem', 'orco', 'arpia'],
        forma: SOTTO_CRIPTA },
      { nome: 'La gola', emoji: '⛰️', ambiente: 'gola', calcoli: 19, cap: 8,
        torri: ['add', 'sub', 'mul', 'div'], resistenze: true, rami: true,
        // 💣 🔮 🏹 💣 🔮 🏹
        mostri: ['scheletro', 'golem', 'orco', 'arpia', 'fantasma', 'ragno'],
        forma: SOTTO_GOLA },
    ],
  },
  {
    id: 'mura', nome: 'Le mura', emoji: '🏰',
    /* Dentro il castello i percorsi si accorciano fino alla rampa del
       torrione: niente più anelli, niente più tempo regalato. Le file
       di mostri girano i tre punti deboli senza mai ripetersi, e le
       ultime due chiamano il drago. */
    tappe: [
      { nome: 'Il cortile', emoji: '🚪', ambiente: 'cortile', calcoli: 14, cap: 7,
        torri: ['add', 'sub', 'mul', 'div'], resistenze: true, rami: true,
        // 🔮 🏹 💣
        mostri: ['golem', 'orco', 'arpia'], forma: MURA_CORTILE },
      { nome: 'Il camminamento', emoji: '🧱', ambiente: 'camminamento', calcoli: 18, cap: 8,
        torri: ['add', 'sub', 'mul', 'div'], resistenze: true, rami: true,
        // 💣 🏹 🔮 — e volano tutti e tre, che sopra le mura è il posto giusto
        mostri: ['arpia', 'pipistrello', 'fantasma'], forma: MURA_CAMMINAMENTO },
      { nome: 'Il corridoio', emoji: '🗝️', ambiente: 'corridoio', calcoli: 22, cap: 9,
        torri: ['add', 'sub', 'mul', 'div'], resistenze: true, rami: true,
        // 🏹 🔮 💣 🏹 🔮 💣
        mostri: ['pipistrello', 'slime', 'scheletro', 'orco', 'fantasma', 'arpia'],
        forma: MURA_CORRIDOIO },
      { nome: 'La sala del trono', emoji: '👑', ambiente: 'trono', calcoli: 26, cap: 10,
        torri: ['add', 'sub', 'mul', 'div'], resistenze: true, rami: true,
        // 🔮 🏹 💣 🔮 🏹 💣 — il drago chiude ogni giro
        mostri: ['golem', 'orco', 'arpia', 'fantasma', 'pipistrello', 'drago'],
        forma: MURA_TRONO },
      { nome: 'Il torrione', emoji: '🏰', ambiente: 'bastione', calcoli: 30, cap: 10,
        torri: ['add', 'sub', 'mul', 'div'], resistenze: true, rami: true,
        // 🏹 🔮 💣 🏹 🔮 💣 — sei bestie diverse sul tracciato più corto
        mostri: ['ragno', 'golem', 'arpia', 'orco', 'fantasma', 'drago'],
        forme: MURA_TORRIONE },
    ],
  },
  {
    id: 'palude', nome: 'La palude', emoji: '🐸',
    /* La campagna che non chiede più conti, ma più attenzione. I
       calcoli ripartono da dodici — meno delle Mura, meno del
       Sotterraneo — e a crescere è quanto c'è da guardare: due bocche
       in ogni tappa, e strade che si allontanano sempre di più. Tutte
       le torri, tutti i rami, e le bestie che nella palude ci vivono. */
    tappe: [
      { nome: 'Il guado', emoji: '💧', ambiente: 'palude-alba', calcoli: 12, cap: 8,
        torri: ['add', 'sub', 'mul', 'div'], resistenze: true, rami: true,
        // 🔮 🏹 💣
        mostri: ['blatta', 'lupo', 'verme'], fronti: 1.5, forme: PALUDE_GUADO },
      { nome: 'Il canneto', emoji: '🌾', ambiente: 'palude-verde', calcoli: 14, cap: 8,
        torri: ['add', 'sub', 'mul', 'div'], resistenze: true, rami: true,
        // 💣 🏹 🔮
        mostri: ['rovo', 'corvo', 'troll'], fronti: 1.9, forme: PALUDE_CANNETO },
      { nome: 'Le isole', emoji: '🏝️', ambiente: 'palude-stagno', calcoli: 18, cap: 9,
        torri: ['add', 'sub', 'mul', 'div'], resistenze: true, rami: true,
        // 💣 🔮 🏹 🔮
        mostri: ['verme', 'blatta', 'corvo', 'troll'], fronti: 1.5, forme: PALUDE_ISOLE },
      { nome: 'Il pantano', emoji: '🪵', ambiente: 'palude-marcio', calcoli: 21, cap: 10,
        torri: ['add', 'sub', 'mul', 'div'], resistenze: true, rami: true,
        // 🔮 💣 🏹 🔮 💣 🏹 — tre bocche, e il giro delle tre torri
        mostri: ['troll', 'rovo', 'lupo', 'blatta', 'verme', 'corvo'], forme: PALUDE_PANTANO },
      { nome: 'La foce', emoji: '🌊', ambiente: 'palude-torce', calcoli: 24, cap: 10,
        torri: ['add', 'sub', 'mul', 'div'], resistenze: true, rami: true,
        // 💣 🔮 🏹 🔮 💣 🏹 — e il drago chiude, come nelle Mura
        mostri: ['drago', 'blatta', 'lupo', 'troll', 'verme', 'corvo'], fronti: 1.6, forme: PALUDE_FOCE },
    ],
  },
]

/* la fila di tutte le tappe, nell'ordine in cui si giocano: è l'indice
   che il profilo salva, e i confini di campagna servono solo a
   raccontarla sulla mappa */
/* ── DOVE STA UNA TAPPA SULLA SCALA DELL'ETÀ ──
   Il livello 0-100 di `data/portata.js` non si dichiara a mano tappa per
   tappa: **si ricava dal `cap`**, che è già la misura di quanto sale la
   scaletta delle operazioni di quella tappa, e che era già lì per un
   altro motivo. Derivarlo invece di inventarlo vuol dire che chi ritocca
   l'equilibrio non deve ricordarsi di ritoccare anche un secondo numero
   che dice la stessa cosa in un'altra lingua.

   Gli estremi: `cap` 3 è la somma corta e sta a sette anni (37), `cap`
   10 è la divisione in colonna e sta a dieci (75). In mezzo, dritto.

   E NIENTE `scuola`, di proposito. Il castello si paga in operazioni,
   quindi la tentazione di scrivere `scuola: 'divisioni'` è forte — ma
   `scuola` serve solo a dire «questa tappa il bambino l'ha già passata,
   nasce aperta», e qui aprire una tappa di mezzo non è un regalo: è
   rompere l'economia. Le torri si comprano coi soldi guadagnati prima, e
   chi comincia dalla nona tappa comincia senza niente. Quindi il taglio
   agisce solo in alto: a sette anni la sala del trono è chiusa, e le
   prime tappe restano da giocare a qualunque età. */
const LIVELLO_CAP = cap => Math.round(37 + (cap - 3) * (75 - 37) / 7)

export const RACCONTO = CAMPAGNE.flatMap(c =>
  c.tappe.map(t => ({ ...t, campagna: c.id, resistenze: !!t.resistenze,
                      portata: LIVELLO_CAP(t.cap) })))

/* a che campagna appartiene la tappa numero `i` */
export const campagnaDi = i => RACCONTO[i] && RACCONTO[i].campagna
