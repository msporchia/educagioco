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
  { chiave: 'mate',       ico: '☄️', nome: 'Asteroidi',
    che: 'tabelline e calcolo a mente' },
  { chiave: 'inglese',    ico: '🌐', nome: 'English',
    che: 'parole, verbi e frasi in inglese' },
  { chiave: 'spagnolo',   ico: '🇪🇸', nome: 'Spagnolo',
    che: 'parole, verbi e frasi in spagnolo' },
  { chiave: 'torri',      ico: '🏰', nome: 'Difendi il Castello',
    che: 'operazioni in colonna, torri e nemici' },
  { chiave: 'pozioni',    ico: '⚗️', nome: 'Il laboratorio delle pozioni',
    che: 'litri, chili e metri', serve: ['misure', 'conversioni'] },
  { chiave: 'bancarella', ico: '🛒', nome: 'La bancarella',
    che: 'euro, centesimi e resto' },
  { chiave: 'generale',   ico: '🎖️', nome: 'Il generale',
    che: 'sequenze, cicli ed eventi' },
  /* I giochi scritti con la convenzione nuova (`src/giochi/`) si
     aggiungono da soli: il loro manifesto dice già chiave, nome e icona,
     e ripeterli qui vorrebbe dire tenerli allineati a mano. Il registro è
     dato puro apposta — importarlo qui non tira dentro né Vue né lo
     store, e non si chiude nessun anello di import. */
  ...GIOCHI_NUOVI.map(g => ({ chiave: g.chiave, ico: g.icona, nome: g.nome, che: g.che,
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
