/* ═══════════════════════════════════════════════════════════════════
   I GIOCHI CHE SI POSSONO SPEGNERE
   Una carta della home per riga, con la stessa chiave che usa `App.vue`
   per scegliere la schermata. Serve ai genitori: un bambino che non ha
   ancora visto le divisioni, o che davanti a nove carte non ne apre
   nessuna, deve poter trovare in home solo quello che gli serve adesso.

   Fuori dall'elenco restano di proposito la cameretta — è il posto delle
   monete e degli animali, non una materia — e l'albo dei progressi.

   ── I GIOCHI IN PROVA ────────────────────────────────────────────
   `sperimentale: true` non è un interruttore in più: è un **cancello**.
   Finché un gioco porta quel segno **non si vede**, e non c'è niente da
   spegnere perché non c'è niente da accendere — a meno che nei
   settaggi non sia acceso il flag «giochi in prova»
   (`settings.sperimentali`).

   Il flag è **uno solo**, non uno per gioco: dice «fammi vedere anche
   le cose non finite», e vale per tutti quelli in prova insieme. È
   spento di partenza, così un gioco a metà non arriva ai bambini prima
   che un grande abbia deciso che è pronto.

   Il giorno che un gioco è finito si toglie una riga qui, e da quel
   momento è un gioco come gli altri: acceso per tutti, spegnibile uno
   per uno come tutti.

   ── LE DUE ESTREMITÀ: `piccoli` E `grandi` ───────────────────────
   Due dichiarazioni, e nessuna delle due è un interruttore: servono
   alle partenze (`data/partenze.js`) per accendere il set giusto a un
   bambino appena arrivato, senza che nessuno debba tenere a mano
   l'elenco di cosa va bene a che età.

   `piccoli: true` è la fascia dei quattro-sei anni: consegna iconica,
   niente da leggere, non si può perdere. `grandi: true` è l'altra
   punta — **dà per scontato che il bambino legga da solo, o la
   matematica delle classi alte**: le tabelline, le operazioni in
   colonna, l'euro e il resto, una lingua straniera scritta, le domande
   di quiz che oggi partono dalla terza.

   Chi non dichiara né l'uno né l'altro sta in mezzo, ed è la
   maggioranza silenziosa che nessuna partenza spegne tranne quella dei
   piccolissimi.

   ── E POI C'È `posto`, CHE NON STA SULLA SCALA ───────────────────
   La fattoria non è né facile né difficile: è il prato dove si spende
   quello che si guadagna altrove. Non ha una campagna, non si vince,
   non si perde — e `data/portata.js` lo dice già per conto suo, che i
   giochi senza scaletta «sono posti, non scalette», quindi non li
   giudica. `posto: true` dice la stessa cosa **alle partenze**, che
   invece ragionano per bandierine: senza, il prato sparirebbe a un
   bambino di quattro anni per il solo fatto di non essersi dichiarato
   `piccoli` — e dichiararsi `piccoli` lo farebbe sparire a quello di
   nove. Un grande può sempre spegnerlo a mano: qui si evita solo che
   lo spegniamo noi.

   È già successo una volta, ed è il modo giusto di usarla: il Dungeon,
   Survivors e il sotterraneo hanno portato `grandi` finché le domande
   che aprono le porte partivano tutte dalla terza. Non era il gioco a
   essere troppo grande — schivare un mostro e scegliere una strada si
   sa fare a sei anni — era il pedaggio. Quando il mazzo dei piccoli è
   arrivato (`quiz/moduli/lettere.js`, e la fascia in
   `store/profile.js`) quelle tre righe sono sparite, e i tre giochi
   sono ricomparsi in home a chi entra in prima **senza toccare una
   riga dei giochi**.

   ── E `quiz`, CHE DICE DA DOVE VIENE IL PEDAGGIO ─────────────────
   `quiz: true` vuol dire che le domande di questo gioco escono dai
   moduli di `src/quiz/`, cioè dal mazzo che l'età taglia. Non è «fa
   domande»: Conta gli animali ne fa, ma sono sue e vivono dentro il
   gioco. Serve al quadro di un'età (`data/quadro.js`) per non elencare
   a un genitore quattro blocchi di domande quando in casa non c'è
   nessun gioco che le peschi — che è quello che succedeva da quattro a
   cinque anni e mezzo, dove i giochi accesi sono tre e nessuno passa
   di lì.

   ── QUELLO CHE UN GIOCO DÀ PER SCONTATO ──────────────────────────
   `serve: ['conversioni']` sono i macrogruppi di `data/saperi.js`
   senza i quali quel gioco non è difficile: è impossibile. Il
   laboratorio delle pozioni è **tutto** conversioni — mezzo litro in
   millilitri, due etti in grammi — e a chi non le ha mai viste non
   resta niente da ragionare. Gli altri giochi non dichiarano niente
   perché degradano da soli: il castello senza divisioni chiede
   moltiplicazioni, i quiz scendono di grado.

   Non è l'interruttore dei genitori messo giù: è la stessa carta che
   non si può accendere finché quel sapere è spento, e la schermata dei
   genitori lo scrive invece di far sparire una carta senza motivo.
   ═══════════════════════════════════════════════════════════════════ */
import { GIOCHI_NUOVI } from '../giochi/indice.js'

export const GIOCHI = [
  /* Senza `grandi`, ed è la stessa correzione già fatta per il Dungeon e
     per Survivors: il flag lo teneva spento fino a otto anni, mentre la
     sua prima tappa è tarata su **sei** (`arcoDelGioco` sulle tappe di
     `data/portata-giochi.js` dà 6,0–10,2). Non è il gioco a essere da
     grandi — schivare un sasso rispondendo «3 + 2» si sa fare in prima,
     con le dita — erano le tabelline in cima alla campagna, e a quelle
     ci pensa la portata, che non offre una tappa fuori mira. Con due
     dichiarazioni che dicono cose diverse vinceva la più grossolana. */
  { chiave: 'mate',       ico: '☄️', nome: 'Asteroidi',
    che: 'tabelline e calcolo a mente', area: 'numeri', come: 'domande' },
  { chiave: 'inglese',    ico: '🌐', nome: 'English',
    che: 'parole, verbi e frasi in inglese', area: 'parole', come: 'domande', grandi: true },
  { chiave: 'spagnolo',   ico: '🇪🇸', nome: 'Spagnolo',
    che: 'parole, verbi e frasi in spagnolo', area: 'parole', come: 'domande', grandi: true },
  { chiave: 'torri',      ico: '🏰', nome: 'Difendi il Castello',
    che: 'operazioni in colonna, torri e nemici', area: 'numeri', come: 'strategia',
    grandi: true },
  { chiave: 'pozioni',    ico: '⚗️', nome: 'Il laboratorio delle pozioni',
    che: 'litri, chili e metri', serve: ['misure', 'conversioni'],
    area: 'numeri', come: 'fare', grandi: true },
  /* Senza `grandi`, ed è stato un errore di taratura: la sua prima
     giornata è tarata su 7 anni (`portata: 37` in `data/bancarella.js`),
     cioè seconda elementare — e contare le monete e dare il resto non
     chiede di saper leggere niente. Il flag la spegneva a tutta la
     partenza «prima o seconda», compresi i sette anni a cui il gioco
     dice di rivolgersi. */
  { chiave: 'bancarella', ico: '🛒', nome: 'La bancarella',
    che: 'euro, centesimi e resto', area: 'numeri', come: 'fare' },
  { chiave: 'generale',   ico: '🎖️', nome: 'Il generale',
    che: 'sequenze, cicli ed eventi', area: 'logica', come: 'strategia', grandi: true },
  /* I giochi scritti con la convenzione nuova (`src/giochi/`) si
     aggiungono da soli: il loro manifesto dice già chiave, nome e icona,
     e ripeterli qui vorrebbe dire tenerli allineati a mano. Il registro è
     dato puro apposta — importarlo qui non tira dentro né Vue né lo
     store, e non si chiude nessun anello di import. */
  ...GIOCHI_NUOVI.map(g => ({ chiave: g.chiave, ico: g.icona, nome: g.nome, che: g.che,
                              area: g.area, come: g.come, piccoli: !!g.piccoli,
                              grandi: !!g.grandi, posto: !!g.posto, quiz: !!g.quiz,
                              tinta: g.tinta,
                              sperimentale: !!g.sperimentale, serve: g.serve || [] })),
]

export const CHIAVI_GIOCHI = GIOCHI.map(g => g.chiave)
/* chi sta dietro al cancello, per chiave: lo chiede `store/profile.js`
   per decidere se un gioco si vede, e lo chiede la schermata dei
   genitori per metterli in un gruppo a parte */
export const eSperimentale = chiave => GIOCHI.some(g => g.chiave === chiave && g.sperimentale)
export const CHIAVI_SPERIMENTALI = GIOCHI.filter(g => g.sperimentale).map(g => g.chiave)
/* cosa dà per scontato un gioco: lo chiede `store/profile.js` per non
   mettere in home un gioco che il bambino non può giocare */
export const serveA = chiave => GIOCHI.find(g => g.chiave === chiave)?.serve || []
