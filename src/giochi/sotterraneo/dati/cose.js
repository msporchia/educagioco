/* ═══════════════════════════════════════════════════════════════════
   COSA SI TROVA, E COSA DICE UNA PORTA

   Tre caselle addosso — la mano, il corpo, il dito — e sei tasche
   (`TASCHE` in `mondo.js`). Le tasche non sono decorazione: sono **il
   limite**. Uno zaino pieno vuol dire scegliere cosa lasciare per terra,
   ed è la stessa domanda del bivio fatta con le mani invece che con una
   freccia.

   ── QUATTRO FAMIGLIE D'ARMA, TRE GRADINI L'UNA ────────────────────
   Spade, asce, archi e bacchette: **valgono lo stesso**, a parità di
   gradino. È la stessa regola dei due rami di una torre nel castello —
   cambia la forma, mai la quantità — e senza di quella regola il gioco
   avrebbe una famiglia giusta e tre da evitare, che è peggio di averne
   una sola. Quello che cambia davvero è il gradino: +1, +2, +3, e si
   legge nel confronto («⚔️ +1 rispetto alla spada corta») senza dover
   sapere niente d'altro.

   ── «VALGONO LO STESSO» CONTA ANCHE LA MANO CHE RESTA LIBERA ──────
   Per un pezzo quella regola è stata scritta come *stesso attacco e
   stesso prezzo, gradino per gradino*, ed era falsa in un modo che non
   si vedeva leggendo la tabella. Al primo gradino la spada corta e
   l'arco corto costavano 🪙8 e picchiavano 1 tutti e due, solo che
   l'arco **mangia anche la sinistra**: chi teneva la spada ci metteva
   uno scudo di ferro (+2 di pelle) o una seconda lama (+1 di braccio),
   chi teneva l'arco no. Stesso numero, stesso prezzo, e una delle due
   strettamente peggiore. Al secondo gradino la stessa cosa fra spada e
   ascia; al terzo il difetto spariva soltanto perché a una mano non
   esisteva più niente.

   Adesso il conto è fatto per intero: **un'arma a due mani picchia uno
   più del suo gradino** (`LA_MANO_CHE_RESTA`), che è esattamente quello
   che la mano libera avrebbe portato. La mano debole colpisce la metà
   (`attaccoMancino` in `motore/corsa.js`), quindi a ogni gradino dove
   esistono tutte e due le forme il conto torna in pari:

     gradino 1 → una mano 1 + 1 di rimbalzo = 2, due mani 2
     gradino 2 → una mano 2 + 1 di rimbalzo = 3, due mani 3

   Due armi leggere valgono una pesante **dello stesso gradino**, non
   più «una del gradino dopo»: la parità è dove serve, cioè fra due cose
   che costano uguale, e la scelta torna a essere quella vera — braccio
   subito e una mano sola, o due caselle da riempire e in una ci può
   andare anche uno scudo.

   Perché l'attacco e non il prezzo: il prezzo lo guarda solo il
   mercante, e le armi si **trovano** molto più di quanto si comprino —
   ritoccare i listini avrebbe lasciato l'arco trovato per terra
   strettamente peggiore della spada trovata per terra, cioè il difetto
   intero. Alzare invece il gradino a parità d'attacco avrebbe voluto
   dire mentire sul confronto («⚔️ +1» che non c'è). Il braccio è la
   manopola velenosa e si tocca a malincuore: qui si è toccata di uno,
   e cosa costa in domande sta misurato in `test/unita/sotterraneo`, eroe
   per eroe.

   ── E OGNI CLASSE PORTA LE SUE ───────────────────────────────────
   `famiglia` dice **a chi serve** una cosa, e la classe dichiara cosa
   porta (`porta` in `dati/eroi.js`, dove sta anche il perché non è un
   tratto nascosto). Chi non ha famiglia la porta chiunque, ed è la parte
   più grossa del catalogo. Il limite è sull'indossare e mai sul
   prendere: quello che non si può usare si raccoglie, si porta al banco
   e si vende a metà prezzo come tutto il resto.

   ── L'ARMATURA SI VEDE SOLO NELL'ICONA, E VA BENE COSÌ ────────────
   Per due fogli su tre l'armatura non c'era affatto: 0x72 e il foglio
   degli oggetti equipaggiano solo le mani, e panciotto, corazza e manto
   restavano **emoji** — un giubbotto da cantiere e uno scudo prestato,
   in mezzo a uno schermo disegnato a mano. Adesso il pezzo c'è
   (`item3.png`, banda delle armature e banda dei mantelli), e i tre si
   leggono come una scala senza dover leggere il numero: cuoio, piastre,
   manto.

   Quello che continua a non esserci è **l'armatura addosso all'eroe**.
   0x72 non ha un solo fotogramma in cui il personaggio impugni o
   indossi qualcosa — l'arma il gioco la disegna *accanto* a lui
   (`scena/tela.js`) — e la figura di ogni classe è fissa. Un'armatura
   vive quindi **solo come icona**: nello zaino, per terra, al banco.
   Non è una mancanza da rattoppare, è il patto del set, e va detto qui
   perché è la prima cosa che verrebbe da provare.

   ── IL GIOIELLO È L'UNICA COSA CHE NON PICCHIA ────────────────────
   Al dito ci va qualcosa che cambia **come si gira**, non quanto si fa
   male: vedere più lontano, tornare su con più gemme, reggere un colpo
   in più. È il posto dove sta la varietà che le armi non hanno, e ce n'è
   uno solo addosso: si sceglie.

   ── IL PREZZO È DAL MERCANTE, NON PER TERRA ───────────────────────
   `prezzo` serve solo al banco del mercante: quello che si trova in
   giro non costa niente, si raccoglie toccandolo.
   ═══════════════════════════════════════════════════════════════════ */
import { EROI, FAMIGLIE, portaLa } from './eroi.js'

/* I tre gradini, uguali per tutte le famiglie: il numero sta qui una
   volta sola, così una famiglia nuova non può nascere sbilanciata.
   `att` è quanto picchia **a una mano**; chi ne chiede due prende quello
   che la mano libera avrebbe reso (vedi in cima). */
const GRADINI = [
  { att: 1, prezzo: 8 },
  { att: 2, prezzo: 16 },
  { att: 3, prezzo: 26 },
]

/* Quanto rende la mano che un'arma pesante ti mangia. Uno, e non è
   scelto a occhio: è `Math.ceil(att / 2)` di un'arma dello stesso
   gradino, cioè quello che la sinistra rende davvero ai primi due
   gradini — che sono gli unici dove le due forme convivono e dove
   quindi il confronto si fa. Alzarlo a due vorrebbe dire pareggiare col
   terzo gradino, dove a una mano non c'è niente con cui pareggiare, e
   comprare quella simmetria finta con un'altra risposta risparmiata su
   ogni mostro del gioco. */
const LA_MANO_CHE_RESTA = 1

/* ── una mano o due ──
   `mani: 2` vuol dire che l'arma **occupa anche la sinistra**: un
   bastone, un arco, uno spadone non si tengono con una mano sola, e nel
   corredo la casella di sinistra mostra la stessa arma in ombra invece
   di restare vuota — così si vede *perché* non ci si può mettere niente
   altro, che è la sola cosa che un elenco di caselle non dice mai.

   Chi ne ha una sola ne può portare due, ed è il patto: le armi
   leggere si sdoppiano, quelle pesanti no. Due armi leggere di un
   gradino valgono la pesante dello **stesso** gradino (vedi in cima, e
   `attaccoMancino` in `motore/corsa.js`: la sinistra colpisce la metà),
   quindi la scelta resta una scelta e non una scorciatoia. */
const arma = (famiglia, grado, nome, sprite, dice, mani = 1) => ({
  em: '⚔️', nome, sprite, dove: 'mano', famiglia, grado, mani,
  att: GRADINI[grado - 1].att + (mani === 2 ? LA_MANO_CHE_RESTA : 0),
  prezzo: GRADINI[grado - 1].prezzo, dice,
})

export const COSE = {
  /* ── le spade: quello che tutti si aspettano di trovare ── */
  'spada-corta': arma('spade', 1, 'Spada corta', 'spada-corta', 'I mostri cadono un po\' prima.'),
  spada: arma('spade', 2, 'Spada', 'spada', 'Ogni risposta giusta fa più male.'),
  spadone: arma('spade', 3, 'Spadone', 'spadone', 'Anche i grossi cadono in pochi colpi. Due mani.', 2),

  /* ── le asce: pesanti, e si vede ── */
  accetta: arma('asce', 1, 'Accetta', 'accetta', 'Piccola, ma taglia.'),
  ascia: arma('asce', 2, 'Ascia', 'ascia', 'Due mani, e si sente.', 2),
  bipenne: arma('asce', 3, 'Bipenne', 'bipenne', 'Una lama per parte: non perdona. Due mani.', 2),

  /* ── gli archi: la stessa forza, da lontano ── */
  'arco-corto': arma('archi', 1, 'Arco corto', 'arco-corto', 'Colpisce prima che ti arrivino addosso. Due mani.', 2),
  'arco-lungo': arma('archi', 2, 'Arco lungo', 'arco-lungo', 'Freccia lunga, colpo pesante. Due mani.', 2),
  balestra: arma('archi', 3, 'Balestra', 'balestra', 'Un colpo solo, e fa un buco. Due mani.', 2),

  /* ── le bacchette: per chi scende da mago ──
     Lo scettro è **a una mano**, ed è l'unica arma di terzo gradino che
     lo sia. Non è una concessione: uno scettro si regge in una mano e
     un bastone no, e il disegno lo dice prima del numero. Quello che
     cambia nel gioco è che il mago — l'unico che porta bacchette, con
     zero di difesa e dodici di vita — arrivato in fondo può finalmente
     imbracciare uno scudo, che è la strada per cui gli scudi esistono
     («braccio o pelle»). Con tutte e tre le bacchette a due mani quella
     strada gli era chiusa per costruzione, e la misura diceva che era
     l'unico dei quattro a non arrivare in fondo. */
  verga: arma('bacchette', 1, 'Verga', 'verga', 'Una scintilla a ogni risposta giusta.'),
  'bastone-magico': arma('bacchette', 2, 'Bastone magico', 'bastone-magico', 'La punta brucia. Due mani.', 2),
  scettro: arma('bacchette', 3, 'Scettro', 'scettro', 'Quello che tocca non si rialza.'),

  /* ── quello che si mette addosso ──
     I tre sono una scala e si devono leggere come una scala **a colpo
     d'occhio**, senza il numero: stoffa e cuoio, poi il ferro, poi
     qualcosa di ricco. È l'unico posto dove queste tre cose si vedono
     mai (vedi in cima), quindi il disegno non è decorazione: è tutta
     l'informazione che c'è.

     Il cuoio **non ha famiglia**: è la prima armatura che si trova — la
     lascia lo scheletro, cioè il mostro del primo piano — e negarla a
     qualcuno vorrebbe dire mandarlo giù nudo finché non trova di
     meglio. Il ferro e la stoffa sì, e sono le due strade: chi para di
     suo (cavaliere e nano) veste ferro, chi non para niente (elfa e
     mago) veste stoffa, che infatti para di più. */
  panciotto: { em: '🦺', nome: 'Panciotto', sprite: 'corpo-cuoio', dove: 'corpo', dif: 1, prezzo: 9,
               dice: 'Sbagliare fa un po\' meno male.' },
  corazza: { em: '🛡️', nome: 'Corazza', sprite: 'corpo-piastre', dove: 'corpo', famiglia: 'ferro',
             dif: 2, prezzo: 18, dice: 'Sbagliare fa molto meno male.' },
  manto: { em: '🧥', nome: 'Manto', sprite: 'corpo-manto', dove: 'corpo', famiglia: 'stoffa',
           dif: 3, prezzo: 28, dice: 'Sbagliare non fa quasi più male.' },
  /* ── e la quarta, che non sta nella scala ──
     Le tre qui sopra sono una fila: chi ha il manto non guarda più il
     resto, e la casella del corpo smette di essere una scelta appena la
     si è riempita bene. Il saio la rimette in gioco **senza aggiungere
     un numero nuovo**: para come il panciotto e tiene in piedi come un
     amuleto d'ossa, cioè fa il mestiere che nella mano debole fanno già
     lo scudo borchiato e quello del leone. La domanda torna a essere
     «pelle o fiato?», che è una domanda. */
  saio: { em: '🥋', nome: 'Saio', sprite: 'corpo-saio', dove: 'corpo', famiglia: 'stoffa',
          dif: 1, vita: 4, prezzo: 20,
          dice: 'Para poco, ma ti tiene in piedi quattro punti di vita più a lungo.' },

  /* ── quello che si porta al dito ──
     Il più economico costava quattordici gemme, e nelle prime tappe
     quella casella non offriva **niente di comprabile**: al primo
     banco delle cantine si arriva con una dozzina di gemme, e il dito
     era l'unico posto addosso che non si potesse riempire. L'amuleto
     azzurro è il fratello piccolo di quello rosso, e il prezzo è quella
     proporzione e nient'altro: metà vita, metà prezzo. */
  'amuleto-azzurro': { em: '💙', nome: 'Amuleto azzurro', sprite: 'amuleto-azzurro', dove: 'dito',
                       vita: 3, prezzo: 9, dice: 'Tre punti di vita in più, finché lo porti.' },
  'anello-ambra': { em: '💍', nome: 'Anello d\'ambra', sprite: 'anello-ambra', dove: 'dito',
                    luce: 2.5, prezzo: 14, dice: 'Al buio vedi molto più lontano.' },
  'anello-verde': { em: '💚', nome: 'Anello verde', sprite: 'anello-verde', dove: 'dito',
                    gemme: 0.5, prezzo: 16, dice: 'Ogni gemma che raccogli ne vale una e mezza.' },
  'amuleto-rosso': { em: '❤️', nome: 'Amuleto rosso', sprite: 'amuleto-rosso', dove: 'dito',
                     vita: 6, prezzo: 18, dice: 'Sei punti di vita in più, finché lo porti.' },
  medaglione: { em: '🥇', nome: 'Medaglione', sprite: 'medaglione', dove: 'dito',
                dif: 1, prezzo: 15, dice: 'Para un pochino, come mezza corazza.' },

  /* ═══ LE ARMI CHE HANNO UN NOME PROPRIO ═══
     Le quattro famiglie valgono lo stesso a parità di gradino, ed è la
     regola che tiene in piedi tutto il resto (vedi in cima). Queste non
     la rompono: **stanno un gradino sopra la scala**, non dentro.
     Non ce n'è una per famiglia — sono pezzi unici, come si conviene a
     una cosa che ha un nome — e quello che le distingue non è quanto
     fanno male, ma **un tratto che di solito sta al dito**: fanno luce,
     fruttano di più, tengono in piedi, parano. È lo stesso mestiere dei
     gioielli, portato in mano, e sono quattro perché quattro sono i
     doni che il gioco conosce.

     Perché si possa scegliere davvero, nessuna batte lo spadone sul suo
     terreno: due hanno il suo stesso braccio, il pugnale e la spada di
     ghiaccio ne hanno meno. Si comprano care, e si trovano solo in
     fondo a un forziere.

     **La famiglia ce l'hanno anche loro**, e per la stessa ragione per
     cui il nome dice quello che il foglio disegna: una bipenne è una
     bipenne, e se il nano la impugna e il mago no, quella col nome
     proprio non fa eccezione — se no il limite di classe sarebbe una
     regola che vale per la roba normale e salta proprio sui pezzi che
     si vanno a cercare. L'unica senza famiglia è il pugnale: è un
     pugnale, lo impugna chiunque, ed è l'unica lama che un mago possa
     toccare. */
  /* Il nome dice quello che il foglio disegna, e non il contrario: la
     prima stesura chiamava «spada fiammeggiante» un'ascia bipenne e
     «ascia del ladro» una spada, e a schermo la cosa si legge subito —
     una casella con dentro una figura che il suo nome smentisce sembra
     un guasto anche quando non lo è. */
  /* Il braccio è 4 e non più 3, e non è un ritocco a sé: è la stessa
     riga di prima — «il suo stesso braccio dello spadone» — riletta
     dopo che lo spadone è salito a 4 perché tiene due mani. Lasciarle a
     3 avrebbe voluto dire un pezzo unico che costa dieci gemme più di
     una bipenne di banco e picchia uno meno: un premio che si vende. */
  'bipenne-solare': {
    em: '🔥', nome: 'Bipenne solare', sprite: 'arma-3', dove: 'mano', famiglia: 'asce', mani: 2,
    att: 4, luce: 2, prezzo: 36,
    dice: 'Le lame brillano di loro: al buio vedi molto più lontano. Due mani.',
  },
  'spada-del-ladro': {
    em: '💰', nome: 'Spada del ladro', sprite: 'arma-2', dove: 'mano', famiglia: 'spade', mani: 2,
    att: 4, gemme: 0.5, prezzo: 34,
    dice: 'Ogni gemma che raccogli ne vale una e mezza. Due mani.',
  },
  'pugnale-vampiro': {
    em: '🩸', nome: 'Pugnale vampiro', sprite: 'arma-1', dove: 'mano', mani: 1,
    att: 2, vita: 6, prezzo: 30,
    dice: 'Corto e cattivo: finché lo tieni, sei punti di vita in più.',
  },
  /* La quarta, e il tratto è **la difesa**: era l'unico dei quattro
     doni che nessuna arma portava, e `addosso('dif')` somma già anche
     quello che si ha in pugno — non c'è niente da aggiungere al motore.
     Una mano sola apposta: così si sceglie fra tenerla con uno scudo
     (e parare due volte) o con una seconda lama, che è la scelta che il
     due mani toglie. E `att: 2` apposta: la regola che tiene oneste le
     armi col nome proprio è che nessuna batta lo spadone sul suo
     terreno, e questa lo batterebbe se picchiasse uguale e in più
     parasse.

     Il prezzo esce dal listino come tutti gli altri: secondo gradino
     16, più quel che costa parare di 1 (il medaglione, 15), meno lo
     sconto che si fa già al pugnale vampiro (16 + 18 di amuleto rosso
     fa 34, e sta in banco a 30). Vengono 26 — che è anche il prezzo di
     uno spadone, ed è un confronto che si legge da sé: stessa spesa, e
     da una parte due bracci in più con tutte e due le mani occupate,
     dall'altra un po' di pelle e la sinistra libera, dove una lama
     leggera rimette in pari quasi tutto il braccio. */
  'spada-di-ghiaccio': {
    em: '🧊', nome: 'Spada di ghiaccio', sprite: 'spada-runica', dove: 'mano', famiglia: 'spade',
    mani: 1, att: 2, dif: 1, prezzo: 26,
    dice: 'La lama gela chi ti sta addosso: sbagliare fa un po\' meno male.',
  },

  /* ═══ GLI SCUDI: LA MANO DEBOLE HA UNA SECONDA STRADA ═══
     Fino a ieri nella mano debole ci stava solo una seconda arma, e la
     scelta era una sola — più braccio. Con gli scudi diventa **braccio
     o pelle**: due lame fanno cadere prima chi hai davanti, uno scudo
     ti fa arrivare in fondo. È la stessa domanda del bivio, fatta con
     le mani.

     I numeri restano bassi apposta. Il danno di un mostro è
     `attacco − difesa` col pavimento a 1: fra corazza, gioiello e
     scudo si arriva presto a non prendere quasi più niente, e un gioco
     dove sbagliare non costa nulla non è più un gioco. Il più prezioso
     dà 3, e non ha altro. */
  'scudo-legno': { em: '🛡️', nome: 'Scudo di legno', sprite: 'scudo-legno', dove: 'mancina',
                   dif: 1, prezzo: 10, dice: 'Assi e borchie: para il primo colpo.' },
  'scudo-borchiato': { em: '🛡️', nome: 'Scudo borchiato', sprite: 'scudo-borchiato',
                       dove: 'mancina', dif: 1, vita: 3, prezzo: 16,
                       dice: 'Para, e ti tiene in piedi un po\' di più.' },
  'scudo-ferro': { em: '🛡️', nome: 'Scudo di ferro', sprite: 'scudo-ferro', dove: 'mancina',
                   dif: 2, prezzo: 22, dice: 'Pesante: sbagliare fa parecchio meno male.' },
  'scudo-crociato': { em: '✝️', nome: 'Scudo crociato', sprite: 'scudo-crociato', dove: 'mancina',
                      dif: 2, luce: 1, prezzo: 28,
                      dice: 'Lo stemma manda luce: pari, e vedi un po\' più in là.' },
  'scudo-leone': { em: '🦁', nome: 'Scudo del leone', sprite: 'scudo-leone', dove: 'mancina',
                   dif: 2, vita: 4, prezzo: 32,
                   dice: 'Para bene, e ti dà quattro punti di vita in più.' },
  'scudo-teschio': { em: '💀', nome: 'Scudo del teschio', sprite: 'scudo-teschio', dove: 'mancina',
                     dif: 3, prezzo: 34, dice: 'Il più duro che ci sia. Non fa altro, e basta così.' },

  /* ── altre due cose da portarsi addosso ── */
  'amuleto-osso': { em: '🦴', nome: 'Amuleto d\'ossa', sprite: 'ossa', dove: 'dito',
                    dif: 1, vita: 4, prezzo: 24,
                    dice: 'Para un pochino, e ti tiene in piedi un po\' di più.' },
  /* Portava addosso il teschio **dell'arredamento** — lo stesso pezzo
     che sta per terra in una stanza — perché quando è nato non c'era
     nient'altro: al dito si vedeva un soprammobile. Adesso c'è un
     ciondolo vero (`item3.png`, la banda degli amuleti), e la chiave
     resta quella: gli id non si rinominano. */
  'teschio-cercatore': { em: '💀', nome: 'Teschio del cercatore', sprite: 'amuleto-teschio',
                         dove: 'dito', gemme: 1, prezzo: 32,
                         dice: 'Ogni gemma che raccogli vale il doppio.' },

  /* ── quello che si usa e finisce ── */
  'pozione-piccola': { em: '🧪', nome: 'Boccetta', sprite: 'pozione-piccola', usa: 'cura', cura: 6,
                       prezzo: 6, dice: 'Sei punti di vita, subito.' },
  pozione: { em: '🧪', nome: 'Pozione', sprite: 'pozione', usa: 'cura', cura: 10, prezzo: 10,
             dice: 'Dieci punti di vita, subito.' },
  'pozione-grande': { em: '🍷', nome: 'Ampolla', sprite: 'pozione-grande', usa: 'cura', cura: 18,
                      prezzo: 16, dice: 'Diciotto punti di vita: ti rimette in piedi.' },
  /* L'unica cosa che si beve e **non torna indietro**: alza la vita
     massima per il resto della discesa, quindi vale di più giù in fondo
     che al primo piano — ed è il motivo per cui si tengono da parte le
     gemme invece di spenderle subito. */
  'elisir-toro': { em: '🐂', nome: 'Elisir del toro', sprite: 'pozione-rossa',
                   usa: 'cresci', cresce: 3, prezzo: 22,
                   dice: 'Tre punti di vita massima, per tutta la discesa.' },
  /* ── la torcia non si accende: si ha ──
     Era una cosa da usare: la raccoglievi, occupava una tasca, e poi
     bisognava aprire lo zaino e premere «l'accendo». Ma quella scelta
     non è una scelta — non esiste il momento in cui uno preferisce
     restare al buio — ed era per giunta l'unico modo di scoprire che la
     torcia serviva a qualcosa. Adesso si accende **appena la prendi**,
     e non entra nemmeno nello zaino: una tasca in meno da spendere per
     una cosa che non si può sbagliare. */
  torcia: { em: '🔦', nome: 'Torcia', sprite: 'torcia', usa: 'luce', prezzo: 7,
            dice: 'La prendi e si accende: da lì in avanti vedi più lontano.' },
  chiave: { em: '🗝️', nome: 'Chiave', sprite: 'chiave-oro', usa: 'porta', prezzo: 6,
            dice: 'Apre una porta senza rispondere.' },
}

export const CHIAVI_COSE = Object.keys(COSE)

/* Le armi per gradino: chi deve pescare «un'arma da orco» chiede il
   gradino e non un elenco scritto a mano, che si scollerebbe il giorno
   in cui si aggiunge una famiglia. */
export const ARMI_DI = grado =>
  CHIAVI_COSE.filter(k => COSE[k].dove === 'mano' && COSE[k].grado === grado)

/* Quello che il mercante può avere in banco, e quello che salta fuori da
   un forziere. Sono due elenchi diversi apposta: dal forziere non escono
   chiavi né boccette — è la cosa che si è pagata cara, e deve valere. */
export const IN_VENDITA = CHIAVI_COSE.filter(k => COSE[k].prezzo)
export const SCUDI = CHIAVI_COSE.filter(k => COSE[k].dove === 'mancina')

/* ── quello che cura sta sempre sul banco, e non finisce mai ──
   Il mercante pescava cinque righe a caso da tutto il catalogo, e le
   tre cose che curano erano tre righe su trenta: capitava — spesso — di
   arrivarci mezzi morti e di trovarci tre spade e un anello. Un negozio
   che non vende bende è una stanza attraversata, e per giunta proprio
   nel momento in cui ci si è andati apposta.

   Perciò stanno **fuori dal sorteggio**: ci sono sempre tutte e tre, e
   comprarne una non la toglie dal banco. Senza la seconda metà la prima
   non basta — `compra()` toglieva dal banco quello che si comprava,
   quindi anche trovandola se ne comprava esattamente una.

   L'elisir del toro **non è qui**, ed è deliberato: è l'unica cosa che
   non torna indietro (alza la vita massima per tutta la discesa, vedi
   il suo commento sopra), e a scorta infinita diventerebbe «compro vita
   massima finché ho gemme» — che è un'altra cosa dal potersi curare.
   Resta fra i pescati, come una spada. */
export const CURE = CHIAVI_COSE.filter(k => COSE[k].usa === 'cura')

/* Quello che il banco pesca a sorte: tutto il vendibile meno le cure,
   che una riga se la prendono già di diritto e non devono rubarne una
   seconda alle cinque. */
export const A_SORTE = IN_VENDITA.filter(k => !CURE.includes(k))

/* ═══ QUANTO È BUONA UNA COSA: IL SUO PREZZO ═══
   Più si scende, più la roba buona deve diventare normale; in cima deve
   essere rara e cara. Per pesarla ci vuole un numero solo che valga per
   tutto il catalogo, e `att`/`dif`/`dono` non lo sono: un anello che fa
   vedere più lontano e una spada non si confrontano su nessuno dei tre
   (sta scritto in `motore/banco.js`, ed è il motivo per cui lì il
   gioiello si sceglie a caso).

   Il prezzo invece quel confronto **lo ha già fatto**: chi ha scritto 36
   sulla bipenne solare e 7 sulla torcia stava dicendo quanto vale l'una
   rispetto all'altra, ed è l'unica scala su cui stanno tutte e trenta le
   voci. Inventarne una seconda (`bonta: 3` su ogni riga) vorrebbe dire
   tenerne allineate due, e la seconda si scollerebbe al primo prezzo
   ritoccato. */
const PREZZI = A_SORTE.map(k => COSE[k].prezzo)
const MENO_CARO = Math.min(...PREZZI)
const PIU_CARO = Math.max(...PREZZI)

/* Quanto è sfocato il tiro, in gemme. La corsa dei prezzi è una
   trentina: a 10 una cosa che costa il giusto pesa 1, una che sta dieci
   gemme fuori pesa mezzo, e una ai due estremi opposti resta a un
   decimo. **Un decimo e non zero**, ed è la riga che decide: la bipenne
   solare intravista al primo piano delle cantine — cara, fuori portata,
   spenta — è il motivo per tornare (`viste/Mercante.vue`), e un banco
   che offre solo quello che ci si può permettere quel motivo non lo dà
   mai. Pesare per livello non è «mostra solo il comprabile». */
const LARGHEZZA = 10

/* Il prezzo che ci si aspetta a quella profondità: 0 è il primo piano
   delle cantine, 1 l'ultimo del fondo. Passa `durezzaDi` della campagna
   — la stessa manopola che decide quanto sono toste le domande — perché
   una seconda scala della profondità sarebbe una seconda cosa da tenere
   allineata a mano. */
export const prezzoAtteso = profondita =>
  MENO_CARO + (PIU_CARO - MENO_CARO) * Math.max(0, Math.min(1, profondita))

/* ═══ IL BOTTINO PREDILIGE LA TUA CLASSE ═══
   Quanto pesa, nel sorteggio, una cosa che la tua classe non può usare.
   **Predilige, non garantisce**: un terzo e non zero, perché la
   frustrazione ogni tanto ci vuole — quello che non puoi impugnare si
   vende, e vendere è un gesto del gioco come gli altri. A zero il
   sotterraneo diventerebbe un distributore della tua roba, e un
   forziere smetterebbe di essere una notizia.

   Cosa vale in pratica, misurato su ventimila tiri (lo rifà
   `test/unita/sotterraneo`, che tiene fermo il pavimento):

     da un forziere, la roba che si può usare   79% → 92% (cavaliere)
                                                64% → 85% (mago)
     ...contando solo le armi                   66% → 85% (cavaliere)
                                                24% → 50% (mago)
     da un orco                                 57% → 80% (cavaliere)
     sul banco, righe che si possono comprare   3,8 → 4,5 su cinque

   Il mago è quello che si vede di più perché è quello che porta meno:
   metà delle armi che gli cadono davanti sono sue, contro una su
   quattro di prima. Metà e non sette su dieci, ed è la riga da leggere
   se un giorno sembrerà troppo poco — per portarlo a sette servirebbe
   un peso di un settimo, cioè quasi il filtro, e a quel punto un
   forziere gli direbbe sempre la stessa cosa.

   Il peso si moltiplica a quello del prezzo, non lo sostituisce: al
   banco valgono tutti e due, e una bacchetta fuori portata resta cara
   anche per un mago. */
export const PESO_ALTRUI = 1 / 3

/* Un tiro solo, pesato: `tua` dice se quella cosa è della classe che sta
   scendendo. Un posto solo, perché i posti da cui esce bottino sono tre
   — il forziere, quello che lascia un mostro, il banco — e finché la
   riga era `elenco[floor(rnd * elenco.length)]` copiata tre volte,
   prediligere in due su tre sarebbe stato un difetto invisibile. */
export function pescaCosa(elenco, { rnd = Math.random, tua = () => true } = {}) {
  if (!elenco || !elenco.length) return null
  let somma = 0
  for (const k of elenco) somma += tua(k) ? 1 : PESO_ALTRUI
  let tiro = rnd() * somma
  for (const k of elenco) {
    tiro -= tua(k) ? 1 : PESO_ALTRUI
    if (tiro <= 0) return k
  }
  return elenco[elenco.length - 1]
}

/* Le cinque righe del banco, pescate senza rimpiazzo con quel peso.
   `ammessa` è il filtro di chi chiede (il motore non offre quello che si
   ha già addosso): sta fuori perché questo file non sa niente di uno
   zaino. `tua` è il secondo peso, quello della classe: non è un filtro
   — una riga che non si può impugnare compare lo stesso, ogni tanto, e
   il banco dice perché no invece di nasconderla. */
export function pescaMerce(profondita, { quante = 5, rnd = Math.random,
                                         ammessa = () => true, tua = () => true } = {}) {
  const atteso = prezzoAtteso(profondita)
  const resto = A_SORTE.filter(ammessa)
  const peso = k => {
    const scarto = (COSE[k].prezzo - atteso) / LARGHEZZA
    return (1 / (1 + scarto * scarto)) * (tua(k) ? 1 : PESO_ALTRUI)
  }
  const presi = []
  while (presi.length < quante && resto.length) {
    let somma = 0
    for (const k of resto) somma += peso(k)
    let tiro = rnd() * somma
    let i = 0
    while (i < resto.length - 1 && (tiro -= peso(resto[i])) > 0) i++
    presi.push(resto[i])
    resto.splice(i, 1)
  }
  return presi
}

export const NEI_FORZIERI = [
  ...ARMI_DI(2), ...ARMI_DI(3),
  'corazza', 'manto', 'saio',
  'anello-ambra', 'anello-verde', 'amuleto-rosso', 'medaglione',
  'amuleto-osso', 'teschio-cercatore',
  'scudo-ferro', 'scudo-crociato', 'scudo-leone', 'scudo-teschio',
  'bipenne-solare', 'spada-del-ladro', 'pugnale-vampiro', 'spada-di-ghiaccio',
  'pozione-grande', 'elisir-toro', 'torcia',
]

/* ── quello che una porta chiusa lascia intravedere ──
   È l'informazione con cui si sceglie dove andare, quindi **non mente
   mai**: dietro un teschio c'è davvero una guardia. Se un segno
   promettesse a vuoto diventerebbe una decorazione, e in due minuti
   nessuno lo guarderebbe più — e con lui se ne andrebbe l'unico motivo
   per cui tornare indietro è una scelta invece che una penitenza. */
export const SEGNI = {
  guardia: { em: '💀', dice: 'C\'è qualcosa di grosso, là dentro.' },
  tesoro: { em: '💎', dice: 'Da qui si sente odore di roba buona.' },
  mercante: { em: '🏪', dice: 'Qualcuno, là dentro, vende.' },
  fonte: { em: '⛲', dice: 'Si sente acqua.' },
  vuoto: { em: '·', dice: 'Non si sente niente.' },
}

/* `nomi` sono i pezzi che l'atlante ha davvero, e arrivano **da fuori**:
   questo file non importa la grafica, o il motore smetterebbe di girare
   in Node senza schermo. Uno sprite dichiarato e non ritagliato non dà
   nessun errore — si vede l'emoji al suo posto, che è il ripiego di
   tutto il gioco — e quindi è un difetto che solo un controllo trova. */
export function guastiDelleCose(nomi = null) {
  const g = []
  if (nomi) for (const [k, c] of Object.entries(COSE))
    if (c.sprite && !nomi.includes(c.sprite))
      g.push(`${k}: nell'atlante non c'è lo sprite "${c.sprite}"`)
  for (const [k, c] of Object.entries(COSE)) {
    if (!c.em || !c.nome) g.push(`${k}: senza emoji o senza nome`)
    if (!c.dice) g.push(`${k}: non dice cosa fa, e il mercante lo mostra`)
    if (!c.dove && !c.usa) g.push(`${k}: né si indossa né si usa, quindi non fa niente`)
    if (c.dove && !['mano', 'mancina', 'corpo', 'dito'].includes(c.dove)) g.push(`${k}: si indossa su "${c.dove}"?`)
    /* uno scudo che non para è una casella occupata per niente */
    if (c.dove === 'mancina' && !c.dif) g.push(`${k}: nella mano debole, ma non para`)
    /* e la casella del corpo vale lo stesso: è una sola, e riempirla
       con qualcosa che non para è peggio che lasciarla vuota */
    if (c.dove === 'corpo' && !c.dif) g.push(`${k}: si mette addosso, ma non para`)
    /* Quello che si indossa **non si vede mai addosso**: il set non ha
       un fotogramma dell'eroe che porti qualcosa (vedi in cima), quindi
       l'icona è tutta l'informazione che c'è, e un'emoji al suo posto è
       un buco in mezzo a uno schermo disegnato a mano. È il difetto che
       ha tenuto le tre armature con `sprite: null` per mesi, e da qui in
       avanti si vede prima di pubblicarlo. */
    if (c.dove && !c.sprite) g.push(`${k}: si indossa, ma non ha un pezzo disegnato`)
    if (c.usa === 'cura' && !c.cura) g.push(`${k}: cura zero`)
    /* un gioiello che non dà niente è una tasca sprecata con l'aria di
       essere un premio */
    if (c.dove === 'dito' && !(c.luce || c.gemme || c.vita || c.dif))
      g.push(`${k}: al dito, ma non fa niente`)
  }
  /* le quattro famiglie devono valere lo stesso, gradino per gradino:
     è la condizione perché scegliere l'arma sia una questione di gusto
     e non una trappola per chi sceglie male. «Lo stesso» si conta **a
     parità di mani** (vedi in cima): due armi dello stesso gradino che
     chiedono lo stesso numero di mani devono picchiare uguale, e chi ne
     chiede due deve picchiare esattamente `LA_MANO_CHE_RESTA` di più —
     né meno, che era il difetto vecchio, né di più, che sarebbe quello
     opposto. */
  for (const grado of [1, 2, 3]) {
    const armi = ARMI_DI(grado)
    if (armi.length < 2) { g.push(`gradino ${grado}: solo ${armi.length} arma`); continue }
    for (const mani of [1, 2]) {
      const forze = new Set(armi.filter(k => (COSE[k].mani || 1) === mani).map(k => COSE[k].att))
      if (forze.size > 1)
        g.push(`gradino ${grado}, a ${mani} mani: forze diverse (${[...forze].join(', ')}), una famiglia sarebbe da evitare`)
    }
    const aUna = armi.filter(k => (COSE[k].mani || 1) === 1)
    const aDue = armi.filter(k => COSE[k].mani === 2)
    if (aUna.length && aDue.length && COSE[aDue[0]].att - COSE[aUna[0]].att !== LA_MANO_CHE_RESTA)
      g.push(`gradino ${grado}: a due mani ${COSE[aDue[0]].att} contro ${COSE[aUna[0]].att}, ` +
             `e la mano che resta libera ne vale ${LA_MANO_CHE_RESTA}`)
    const prezzi = new Set(armi.map(k => COSE[k].prezzo))
    if (prezzi.size > 1) g.push(`gradino ${grado}: stesse armi, prezzi diversi`)
  }
  const forzaDi = grado => Math.max(...ARMI_DI(grado).map(k => COSE[k].att))
  for (let grado = 2; grado <= 3; grado++)
    if (forzaDi(grado) <= forzaDi(grado - 1))
      g.push(`il gradino ${grado} non picchia più del ${grado - 1}`)

  /* ── la famiglia dichiarata deve esistere, e ogni classe deve avere
     una fila intera ──
     Una classe che può impugnare tre cose in tutto il catalogo non gioca
     più al gioco del bottino: apre un forziere e la risposta è quasi
     sempre no. Il minimo è **un'arma per gradino e un'armatura**, che è
     il pavimento sotto al «si trova qualcosa che serve». */
  for (const [k, c] of Object.entries(COSE))
    if (c.famiglia && !FAMIGLIE[c.famiglia]) g.push(`${k}: famiglia "${c.famiglia}", che non esiste`)
  for (const e of EROI) {
    for (const grado of [1, 2, 3])
      if (!ARMI_DI(grado).some(k => portaLa(e, COSE[k])))
        g.push(`${e.chiave}: nessuna arma di gradino ${grado}, la sua fila ha un buco`)
    const addosso = CHIAVI_COSE.filter(k => COSE[k].dove === 'corpo' && portaLa(e, COSE[k]))
    if (!addosso.length) g.push(`${e.chiave}: niente da mettersi addosso`)
  }

  /* Le armi che hanno un nome proprio stanno **fuori** dalla scala (non
     dichiarano `grado`), e la regola che le tiene oneste è questa: non
     picchiano più forte dell'ultimo gradino — se no la scala non
     servirebbe più a niente — e in cambio portano un tratto. Un'arma
     unica senza tratto e senza gradino sarebbe solo una copia con un
     altro disegno. */
  const cima = COSE[ARMI_DI(3)[0]].att
  for (const [k, c] of Object.entries(COSE)) {
    if (c.dove !== 'mano' || c.grado) continue
    if (c.att > cima) g.push(`${k}: picchia ${c.att}, più dell'ultimo gradino (${cima})`)
    if (!(c.luce || c.gemme || c.vita || c.dif))
      g.push(`${k}: arma fuori scala senza niente di suo, è una copia con un altro nome`)
  }

  for (const k of NEI_FORZIERI) if (!COSE[k]) g.push(`nei forzieri c'è "${k}", che non esiste`)
  if (!IN_VENDITA.length) g.push('il mercante non ha niente da vendere')
  /* il banco ne mostra tre sempre, e se il catalogo smette di averle si
     arriva mezzi morti a un negozio che non vende bende */
  if (!CURE.length) g.push('niente che curi, e sul banco ci sta sempre')
  if (A_SORTE.length < 5) g.push(`solo ${A_SORTE.length} cose da pescare: il banco ne vuole cinque`)
  for (const [k, s] of Object.entries(SEGNI))
    if (!s.em || !s.dice) g.push(`segno ${k}: senza emoji o senza frase`)
  return g
}
