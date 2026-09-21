/* ═══════════════════════════════════════════════════════════════════
   IL VOLO INFINITO — un volo solo, tabelline e calcolo a mente insieme,
   che si complica col livello della partita.

   Erano due: «Volo libero» (tutte le tabelline) e «Volo a mente» (tutti
   i trucchi), aperti insieme a fila finita. Due voli per un gioco che è
   uno — la fila è una, mescolata apposta — ed erano il posto in cui le
   due metà tornavano a dividersi. E nessuno dei due si complicava: il
   livello alzava la velocità del cielo e basta, quindi a livello nove
   scendeva 2×3 alla stessa cadenza di 7×8.

   Adesso il volo è uno, e il LIVELLO SPOSTA UNA MIRA sulla scala della
   difficoltà: a livello 1 si pesca dal basso (le tabelline del 2 e del
   3, le somme entro il dieci), a livello 9 dall'alto (7×8, 9×7, le
   centinaia). Attorno alla mira c'è una campana stretta — lo stesso
   attrezzo dei quiz (`pesoDi` in `quiz/nucleo/classi.js`), riscritto
   qui su una scala 0..1 perché quella dei quiz è in anni di scuola e
   questa non c'entra con la scuola: è quanto è tosta una casella
   rispetto alle altre dello stesso magazzino.

   DUE SCALE, UNA MIRA. Le tabelline si misurano con `stima` (quanti dei
   due fattori vanno saputi a memoria: `store/tabelline.js`), il calcolo
   a mente con la stazione in cui il concetto è arrivato (la stessa scala
   della marea). Tutte e due sono riportate a 0..1, e la mira è un numero
   solo sulle due: «livello 5» vuol dire «a metà scala» per tutti e due i
   magazzini, e non serve una taratura per ciascuno.

   Tre cose che il volo NON fa:

   1. NON SCAVALCA LA MAREA (`store/marea.js`). La mira dice cosa è
      tosto, la marea dice cosa il bambino sa da un pezzo: quello che sta
      sotto la sua frontiera esce comunque di rado, perché il picker lo
      pesa con la stessa lentezza. Sono due filtri in fila, non uno.
   2. NON PESCA FUORI DA QUELLO CHE È STATO INSEGNATO. Il volo si apre a
      fila finita, e a fila finita è stato insegnato tutto: il magazzino
      è tutto, e il filtro è la mira.
   3. NON FA UN CICLO. Una campana è un peso, non una lista: a livello 5
      può uscire 9×9, solo di rado.

   I DUE MAGAZZINI SI ALTERNANO, non si mescolano in un pool solo: un
   pool unico lo pescherebbe il motore per bisogno, e il bisogno delle
   tabelline (55 fatti, un peso ciascuno) non si confronta con quello di
   una strategia (una chiave che vale infinite domande). Si sceglie prima
   il magazzino — a monetina, con un tetto di tre di fila — e poi, dentro
   quello, decide la campana e infine il motore. È la stessa idea della
   miscela di una tappa (`creaMiscela` in `store/calcolo.js`), con la
   differenza che qui i lati sono due e pari, e la memoria conta le
   ripetizioni invece della quota.

   Puro: riceve `items` e un `now`, non importa il profilo, e si prova in
   `unita/asteroidi`.
   ═══════════════════════════════════════════════════════════════════ */
import { stima, banale, chiaviDelle, TUTTE_LE_TABELLE } from './tabelline.js'
import { STAZIONI, CONCETTI, chiaviDi, concettoDiChiave } from '../data/calcolo.js'

/* ── LA MIRA ──
   A che punto della scala si pesca, dato il livello della partita
   (1 + giuste/5). Parte da `MIRA_MIN` e non da zero: zero sarebbe ×1 e
   ×10, che sono regole e non fatti, e la prima domanda del volo deve
   essere una domanda. Arriva in cima a `LIVELLO_TETTO`: da lì in poi il
   livello continua ad alzare solo la velocità del cielo (`ritmo()` in
   `views/MathGame.vue`), mai a chiedere di più — di più non c'è. */
export const LIVELLO_TETTO = 9
export const MIRA_MIN = 0.15
export const miraDelLivello = livello =>
  MIRA_MIN + (1 - MIRA_MIN) * dentro01((livello - 1) / (LIVELLO_TETTO - 1))

/* ── LA CAMPANA ──
   Quanto pesa una casella a distanza `altezza − mira`. A 0.2 di banda
   una classe intera di distanza (le tabelline del 2-3-5 contro quelle
   del 4-6-7-8-9 stanno a ~0.35) pesa il 5%: esiste, capita di rado.
   È la stessa forma di `pesoDi` dei quiz, dove la banda vale 11 su 100. */
export const BANDA = 0.2
export const pesoAltezza = (altezza, mira, banda = BANDA) =>
  Math.exp(-(((altezza - mira) / banda) ** 2))

/* ── LE DUE SCALE, RIPORTATE A 0..1 ──
   Tabelline: `stima` va da ~2 (2×2) a ~4.4 (9×9) — è la somma di quanto
   vanno saputi a memoria i due fattori, più un pelo per la taglia — e
   qui diventa 0.14 (2×2) · 0.5 (3×7) · 0.93 (9×9). ×1 e ×10 stanno a
   zero: sono regole. */
export const altezzaTabellina = k => (banale(k) ? 0 : dentro01((stima(k) - 1.6) / 3))

/* Calcolo a mente: la stazione in cui il concetto è arrivato, sulla fila
   delle stazioni che insegnano qualcosa (l'esame in coda non conta). Un
   fatto che sta in due concetti vale per il padrone, il più elementare
   (`concettoDiChiave`), come nella marea. */
const STAZIONE_DEL = new Map()
STAZIONI.forEach(S => S.nuovi.forEach(id => STAZIONE_DEL.set(id, S.i)))
const ULTIMA = Math.max(1, ...STAZIONI.filter(S => S.nuovi.length).map(S => S.i))
export const altezzaMente = k => dentro01((STAZIONE_DEL.get(concettoDiChiave(k)) || 0) / ULTIMA)

/* ── I DUE MAGAZZINI ──
   Le tabelline sono 55 caselle. ×1 e ×10 sono 19 di quelle, e sono una
   regola sola: se pesassero come le altre, a livello 1 la metà delle
   domande sarebbe 1×7. In fondo alla scala le caselle vere sono sei
   (2-3-5 fra loro), quindi diciannove regole si dividono **mezza**
   casella: a livello 1 ne esce una ogni dieci, non una ogni tre. */
export const PESO_BANALE = 0.03
export const CASELLE = chiaviDelle(TUTTE_LE_TABELLE)
export const pesoTabellina = (k, mira) =>
  pesoAltezza(altezzaTabellina(k), mira) * (banale(k) ? PESO_BANALE : 1)

/* Il calcolo a mente è fatto di concetti, e un concetto a fatti (le
   somme entro il dieci) ha decine di chiavi mentre una strategia ne ha
   una: perché due concetti alla stessa altezza pesino uguale, le chiavi
   di un concetto si dividono il suo peso. */
export const CHIAVI_MENTE = CONCETTI.flatMap(c => chiaviDi(c.id))
const QUANTE_DEL = new Map(CONCETTI.map(c => [c.id, chiaviDi(c.id).length]))
export const pesoMente = (k, mira) =>
  pesoAltezza(altezzaMente(k), mira) / (QUANTE_DEL.get(concettoDiChiave(k)) || 1)

/* ── IL POOL DI UNA DOMANDA ──
   `quanti` chiavi pescate senza rimessa, ognuna con la probabilità del
   suo peso: è la campana fatta elenco. Poi il picker del gioco sceglie
   dentro con la lentezza della marea e il bisogno di ripasso, che è il
   punto 1 di sopra. `items` qui non serve: la scala non dipende dal
   bambino, e quello che dipende da lui lo fa il picker dopo. */
export const QUANTI = 8

export function pescaPesati(chiavi, peso, quanti, sorte = Math.random) {
  const resto = chiavi.map(k => ({ k, p: peso(k) })).filter(x => x.p > 0)
  const out = []
  while (out.length < quanti && resto.length) {
    const tot = resto.reduce((s, x) => s + x.p, 0)
    let r = sorte() * tot, i = 0
    for (; i < resto.length - 1; i++) { r -= resto[i].p; if (r < 0) break }
    out.push(resto[i].k)
    resto.splice(i, 1)
  }
  return out
}

export const poolVoloTabelline = (livello, quanti = QUANTI, sorte = Math.random) =>
  pescaPesati(CASELLE, k => pesoTabellina(k, miraDelLivello(livello)), quanti, sorte)

export const poolVoloMente = (livello, quanti = QUANTI, sorte = Math.random) =>
  pescaPesati(CHIAVI_MENTE, k => pesoMente(k, miraDelLivello(livello)), quanti, sorte)

/* tutto quello che il volo può chiedere, per il «da ripassare» di fine
   partita: lì si guarda cosa è andato storto, non cosa è alla mira */
export const chiaviDelVolo = () => [...CASELLE, ...CHIAVI_MENTE]

/* ── L'ALTERNANZA ──
   Da quale magazzino esce la prossima domanda. A monetina, e mai più di
   `MAX_DI_FILA` di seguito dallo stesso: una monetina da sola fa quattro
   tabelline di fila una volta ogni sedici, e a chi gioca sembra che il
   calcolo a mente sia sparito. Il boss non passa di qui — chiede dal
   magazzino dell'ultima domanda, e non si conta. */
export const MAX_DI_FILA = 3
export const MAGAZZINI = ['tabelline', 'mente']

export function creaAlternanza(max = MAX_DI_FILA) {
  let ultimo = null, fila = 0
  return {
    prossimo(sorte = Math.random) {
      if (ultimo && fila >= max) return MAGAZZINI.find(m => m !== ultimo)
      return sorte() < 0.5 ? MAGAZZINI[0] : MAGAZZINI[1]
    },
    segna(magazzino) {
      fila = magazzino === ultimo ? fila + 1 : 1
      ultimo = magazzino
    },
    azzera() { ultimo = null; fila = 0 },
    get max() { return max },
  }
}

function dentro01(x) { return Math.max(0, Math.min(1, x)) }
