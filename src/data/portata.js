/* ═══════════════════════════════════════════════════════════════════
   COSA È ALLA PORTATA DI QUESTO BAMBINO — le tappe, non le domande.

   `quiz/nucleo/classi.js` risponde a questa domanda per una DOMANDA di
   quiz. Qui si risponde per una TAPPA di campagna, e sono due mestieri
   diversi che condividono la scala ma non la larghezza. Il perché sta
   tutto in una riga: **una domanda si pesca, una tappa si macina**.

   ── PERCHÉ NON SI RIUSA `finestraDi` ─────────────────────────────
   Nei quiz il taglio della finestra è netto, ma quello che rende
   accettabile una finestra larga non è la larghezza: è `pesoDi`, la
   campana che trasforma «fuori misura» in «raro». Una classe a tre anni
   dal bersaglio pesa il due per cento — c'è, e capita ogni tanto. È per
   quello che l'ammissione è larga tre anni e mezzo sotto: serve a non
   far sparire *del tutto* le ore intere dell'orologio a un bambino di
   nove anni, che devono solo diventare rare.

   In una campagna quella campana non esiste. C'è una fila, e la fila si
   macina tutta, una tappa dopo l'altra: non esiste un «due per cento
   delle volte» — o la tappa c'è, o non c'è. Quindi il taglio è l'unica
   leva e va stretto, se no non taglia niente. Il conto, sul caso da cui
   è nato tutto questo: a nove anni l'ammissione è [18,5 – 87,5] e la
   tabellina del 2 sta a 37,5, cioè **dentro** — un bambino di nove anni
   si macinerebbe 2×2 per delle sere prima di arrivare dov'è. Con la
   mira ([50,5 – 81,5]) esce.

   Due larghezze per due mestieri, e vanno tenute separate anche nel
   nome: `finestraDi` è l'ammissione e riguarda le domande, `miraDi` è
   la mira e riguarda le tappe. Le costanti stanno di là e qui si
   importano: la scala è una sola, e due copie diverterebbero.

   ── NESSUNA TAPPA ESCE MAI DALLA FILA ────────────────────────────
   Questo modulo non toglie tappe: **cambia il cancello**. È la cosa più
   importante che c'è scritta qui, e non è gentilezza — è l'unico modo
   di non rompere i salvataggi. L'avanzamento di una campagna sta in
   `profile.campagne[<chiave>]` ed è **un numero**, l'indice della
   tappa: se una campagna si accorciasse in testa, un bambino che era
   «alla terza» si ritroverebbe da un'altra parte, senza che nessun
   errore scatti da nessuna parte. Il precedente da guardare è la
   variante `asteroidi:mente`, che leva delle tappe e per questo
   rinumera i pianeti senza buchi lasciando i progressi dove sono.

   Qui non serve nemmeno rinumerare, perché la fila resta intera. Le
   tappe cambiano solo stato:

     PASSATA    sotto la mira: roba che sa già fare. Non sparisce e non
                si nasconde — **nasce aperta**, così chi vuole ci torna
                e chi non vuole ci passa sopra. La differenza con oggi
                non è «non ce l'hai», è «l'hai già passato».
     IN_PORTATA dentro la mira: è lì che si gioca.
     AVANTI     sopra la mira: chiusa. Non «campagna finita», che
                sarebbe una bugia — il resto arriva quando sarà più
                grande, e va detto così.

   ── LA TESTA NON SI TAGLIA SEMPRE ────────────────────────────────
   E qui sta la differenza fra i due esempi che sembrano uguali:

     · «2×2 a nove anni» — gliel'ha data la scuola in seconda, e
       macinarla è tempo perso.
     · «dog a dieci anni» — a dieci anni non la sai *per il fatto di
       avere dieci anni*. Nessuna scuola gliel'ha data, e il gioco è
       l'unica fonte che ha.

   Quindi una tappa si dichiara PASSATA solo se quello che insegna sta
   nel programma di scuola, ed è una cosa che il repo sa già dire: sono
   le chiavi di `data/saperi.js`. Una tappa che dichiara `scuola:
   'moltiplicazioni'` si può considerare saputa per età; una che non
   dichiara niente — il vocabolario di una lingua straniera, le regole
   di un gioco — non si taglia mai in testa, per quanto sia facile.

   E siccome i saperi sono **per bambino e spegnibili a mano**, la
   cautela finale: se un grande ha spento «moltiplicazioni» perché quel
   bambino a scuola non le ha fatte, la testa deve tornare. Se no il
   gioco perde le tappe proprio a chi servivano — che è il contrario
   esatto di quello che si sta cercando di fare.

   Questo file non importa Vue né lo store: gira in Node, e
   `test/unita/portata` ci conta sopra.
   ═══════════════════════════════════════════════════════════════════ */
import { livelloDegliAnni, anniDelLivello, MIRA_SOTTO, MIRA_SOPRA,
         LIVELLO_MIN, LIVELLO_MAX } from '../quiz/nucleo/classi.js'

export { livelloDegliAnni, anniDelLivello, LIVELLO_MIN, LIVELLO_MAX }

/* ── LA MIRA, PURA ──
   Da non confondere con `bersaglio()` di `classi.js`, che la mira non
   la restituisce: la *interpola* con la manopola 0..1 della carta
   (`qui − MIRA_SOTTO + (MIRA_SOTTO + MIRA_SOPRA) · d`). Serve a un
   altro mestiere — dove punta una singola pescata — e usarla qui vorrebbe
   dire una soglia che si sposta con la difficoltà della tappa che si sta
   guardando: un guasto che non si vede finché qualcuno non conta le
   tappe offerte. Qui la finestra è la stessa per tutte. */
/* ── PERCHÉ IL CAMPO SI CHIAMA `portata` E NON `livello` ──
   Perché `livello` era già preso, e non dove ci si aspetterebbe: una
   tappa del Dungeon ce l'ha da sempre, e vuol dire tutt'altro — la
   potenza a cui si scende, che regola la forza dei mostri e il grado del
   bottino (`giochi/dungeon/motore/corsa.js`). Scriverci sopra un numero
   sulla scala 0-100 non dava nessun errore: faceva solo credere al gioco
   che un bambino alla prima tappa fosse al livello diciotto, e i mostri
   diventavano imbattibili. L'ha trovato `unita/dungeon`, non un occhio.

   Da cui la regola, se un giorno servisse un campo nuovo: **cercarlo
   prima nei motori**, non solo nei dati. `portata` è libero in tutto il
   repo, e dice quello che fa. */
export const miraDi = eta => {
  if (eta == null) return null
  const qui = livelloDegliAnni(eta)
  return [qui - MIRA_SOTTO, qui + MIRA_SOPRA]
}

/* I tre stati di una tappa. Stringhe e non numeri perché finiscono in
   un `v-if` e in un test, e `stato === 'avanti'` si legge. */
export const PASSATA = 'passata'
export const IN_PORTATA = 'portata'
export const AVANTI = 'avanti'

/* Lo stesso pelo di tolleranza di `adatta()`: il livello di una tappa
   può essere una media, e una media di dieci noni fa 95.000000001. */
const PELO = 1e-9

/* ── il verdetto su una tappa ──
   `tappa` è dato puro e le serve solo `livello` (0..100) e, se ce l'ha,
   `scuola` (una chiave di `data/saperi.js`). Tutto il resto —
   quanti anni ha il bambino, cosa gli hanno spento — arriva da fuori,
   così questa funzione non sa cosa sia un profilo.

   `spenti` sono i macrogruppi che i genitori hanno tolto. Entra qui per
   un motivo solo, ed è la cautela di sopra: un sapere spento riapre la
   testa. */
export function statoDellaTappa (tappa, { eta = null, spenti = [] } = {}) {
  const mira = miraDi(eta)
  /* Senza età non si taglia niente: è il caso del banco di prova e di un
     profilo nato prima che questa domanda esistesse. Il modo giusto di
     non sapere è dare tutto, non dare niente. */
  if (!mira || tappa?.portata == null) return IN_PORTATA

  if (tappa.portata > mira[1] + PELO) return AVANTI
  if (tappa.portata < mira[0] - PELO) {
    /* sotto la mira, ma si taglia la testa solo a quello che la scuola
       ha già dato — e solo se quel pezzo di scuola è ancora acceso */
    const daScuola = tappa.scuola && !spenti.includes(tappa.scuola)
    return daScuola ? PASSATA : IN_PORTATA
  }
  return IN_PORTATA
}

/* ── la fila, con lo stato addosso ──
   Non filtra: **restituisce tante voci quante gliene arrivano**, nello
   stesso ordine, ognuna con `{ stato, indice }`. Chi la usa decide cosa
   farne, ma gli indici sono quelli veri della campagna e restano buoni
   per `profile.campagne`. */
export const filaConPortata = (tappe = [], regole = {}) =>
  tappe.map((t, indice) => ({ ...t, indice, stato: statoDellaTappa(t, regole) }))

/* Da dove comincia chi apre il gioco per la prima volta: la prima tappa
   che non sia già saputa. Se sono tutte PASSATA torna 0 — un gioco che
   non ha più niente da dare non si apre affatto (`restaQualcosa`), e se
   qualcuno lo apre lo stesso è meglio la prima che l'ultima. */
export function primaDaGiocare (tappe = [], regole = {}) {
  const i = filaConPortata(tappe, regole).findIndex(t => t.stato !== PASSATA)
  return i < 0 ? 0 : i
}

/* ── il gioco si vede o no ──
   Questa è la domanda da cui è partito tutto, e la risposta non è più un
   criterio suo: **è la conseguenza**. Se non resta nessuna tappa da
   giocare alla sua portata, la carta non ha niente da offrire.

   `fatte` è quante ne ha già portate a casa (`profile.campagne[…]`):
   entra perché una tappa già fatta non è più un motivo per tenere la
   carta in home, e senza questo conto un gioco finito resterebbe lì per
   sempre. Chi non lo sa passa 0, che è il caso di chi non ha mai aperto
   il gioco — ed è quello che conta davvero, perché la fascia decide
   **cosa si offre a chi arriva**, non cosa si toglie a chi c'è già. */
export function restaQualcosa (tappe = [], { fatte = 0, ...regole } = {}) {
  return filaConPortata(tappe, regole)
    .some(t => t.stato === IN_PORTATA && t.indice >= fatte)
}

/* ── la carta si mette in home o no ──
   `restaQualcosa` da sola non basta, e il caso che le manca è quello che
   conta di più: **un gioco che il bambino ha già cominciato non sparisce
   mai.** Un gioco che c'era e un giorno non c'è più è peggio di un gioco
   che non serve — i progressi restano, ma lui vede solo che è sparito, e
   non c'è nessun modo di spiegarglielo dentro il gioco.

   È anche il motivo per cui questa regola può permettersi una mira
   stretta: la finestra decide **cosa si offre a chi arriva**, non cosa si
   toglie a chi c'è già. `provato` è il `albo.provato` che ogni manifesto
   dichiara già — «l'ha aperto almeno una volta» — e non un campo nuovo. */
export const giocoDaOffrire = (tappe = [], { provato = false, ...resto } = {}) =>
  provato || restaQualcosa(tappe, resto)

/* ── dove sta un gioco intero, per chi deve scriverlo su una schermata ──
   Il minimo e il massimo dei livelli delle sue tappe, in anni. Non è un
   dato dichiarato: è quello che esce dalle tappe, e serve solo a
   raccontarlo a un grande («questo gioco va dai 5 ai 9 anni»). Nessuna
   decisione passa di qui. */
export function arcoDelGioco (tappe = []) {
  const l = tappe.map(t => t.portata).filter(x => x != null)
  if (!l.length) return null
  return { da: Math.min(...l), a: Math.max(...l),
           anniDa: anniDelLivello(Math.min(...l)), anniA: anniDelLivello(Math.max(...l)) }
}
