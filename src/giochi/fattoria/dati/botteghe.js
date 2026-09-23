/* ═══════════════════════════════════════════════════════════════════
   LE BOTTEGHE DEL PAESE: I NUMERI

   Dato puro, come `dati/mercato.js` di cui è la sorella: qui quanto
   rende una consegna, quanto si aspetta il cliente dopo e quanta fama
   serve per crescere. Le regole — chi arriva, cosa chiede, cosa
   succede consegnando — stanno in `motore/botteghe.js`. **Chi** chiede
   **cosa** sta nel catalogo, sulla voce stessa (`posto: { chiede,
   clienti }` in `dati/catalogo.js`), perché è la cosa che si compra:
   una bottega e il suo elenco nascono insieme e muoiono insieme.

   ── PERCHÉ UNA FORMA DIVERSA DAL BANCO ────────────────────────────
   Il banco è il camion di Hay Day: tanti ordini piccoli, di tutto, e
   sempre pieno. Le botteghe sono **i visitatori** (`docs/fattoria-
   albero.md` §8.3): qualcuno che vuole *una* cosa sua. Perciò la
   forma è stretta apposta —

     · **un cliente per bancone, una merce sola, 2–4 pezzi.** «La
       pasticcera vuole 3 biscotti» si legge in un'occhiata e dice da
       sola cosa produrre;
     · **il cliente dopo non arriva subito**, ma fra 10 e 20 minuti. È
       il motivo per tornare, non una punizione: e chi aspetta aspetta
       per sempre, come tutto il resto della fattoria;
     · **rende il 25% in più** del banco, perché è merce di mestiere e
       non si sceglie fra tre;
     · **la fama**: ogni consegna è un cuore, e a cinque cuori la
       bottega cresce di un bancone, fino a tre. È la progressione per
       posto che il banco unico non può avere.

   E come il banco **non paga monete**: il perché per esteso sta in
   testa a `dati/mercato.js`, e vale parola per parola.
   ═══════════════════════════════════════════════════════════════════ */
import { CATALOGO } from './catalogo.js'
import { PRODOTTI } from './coltivazioni.js'
import { CLIENTI, premioPer, minutiPer, MONETE_AL_MINUTO } from './mercato.js'

/* Quanti pezzi chiede un cliente: da due a quattro. Uno solo sarebbe
   un ordine del banco con un altro vestito; più di quattro non si
   conta più sulle dita, e con le lasagne a 29 gesti l'uno sarebbe un
   pomeriggio. Quattro stanno nello scomparto più piccolo, che ne
   tiene otto. */
export const PEZZI_MIN = 2
export const PEZZI_MAX = 4

/* Quanto in più del banco, per la stessa roba. */
export const PIU_DEL_BANCO = 1.25

/* Dopo una consegna — o un «non mi va» — il cliente dopo arriva fra
   `ATTESA_MIN` e `ATTESA_MAX` minuti veri. Dieci è il tempo di un
   giro nei campi; venti è abbastanza perché valga la pena tornare, e
   poco abbastanza perché nella stessa sera si torni. Il «non mi va»
   costa quanto una consegna, e non di più: qui non c'è niente da
   scorrere, il cliente è uno solo e la merce una sola, quindi non
   serve un freno alla slot machine — serve solo che rifiutare non sia
   **più svelto** che consegnare. */
export const ATTESA_MIN = 10
export const ATTESA_MAX = 20

/* La fama: cinque consegne per un bancone in più, fino a tre. Tre è il
   numero del banco del mercato, e per la stessa ragione — tre stanno
   in uno schermo verticale senza scorrere. */
export const CUORI = 5
export const BANCONI_MAX = 3

/* Quanto rende consegnare `n` pezzi di una merce. Lo stesso conto del
   banco (`premioPer`, base compresa) per un quarto in più: se le
   botteghe avessero una formula loro, il giorno che si ritocca il
   banco le due cose smetterebbero di stare in proporzione senza che
   niente lo dica. */
export const premioInBottega = (prodotto, n) =>
  Math.round(premioPer({ [prodotto]: n }) * PIU_DEL_BANCO)

/* Le voci del catalogo che sono botteghe. */
export const POSTI = CATALOGO.filter(v => v.posto)

/* I clienti di una bottega che vogliono **questa** merce. Stessa regola
   di `clientiPer` al banco — `vuole` restringe, e chi non lo dichiara
   prende di tutto — ma fra i clienti **della bottega**: il fornaio non
   entra in merceria. Se nessuno di loro la vuole per mestiere (il sushi
   all'osteria), la chiede uno di casa qualunque: una faccia sbagliata
   costa meno di un bancone vuoto. */
export function clientiDellaBottega(posto, prodotto) {
  const suoi = ((posto && posto.clienti) || [])
    .map(id => CLIENTI.find(c => c.id === id)).filter(Boolean)
  const vogliono = suoi.filter(c => !c.vuole || c.vuole.includes(prodotto))
  return vogliono.length ? vogliono : suoi
}

export function guastiDelleBotteghe() {
  const g = []
  if (!(PEZZI_MIN >= 1 && PEZZI_MIN <= PEZZI_MAX && PEZZI_MAX <= 8))
    g.push('i pezzi di una bottega non stanno fra uno e uno scomparto')
  if (!(ATTESA_MIN > 0 && ATTESA_MIN <= ATTESA_MAX))
    g.push('l\'attesa del cliente dopo è impossibile')
  if (!(CUORI >= 1 && BANCONI_MAX >= 1)) g.push('la fama non fa crescere niente')
  for (const v of POSTI) {
    const { chiede, clienti } = v.posto
    if (!v.unico) g.push(`${v.id}: una bottega va «unico», se no la seconda non fa niente`)
    if (!Array.isArray(chiede) || !chiede.length) g.push(`${v.id}: non chiede niente`)
    if (!Array.isArray(clienti) || !clienti.length) g.push(`${v.id}: non ha clienti`)
    for (const id of clienti || [])
      if (!CLIENTI.some(c => c.id === id)) g.push(`${v.id}: il cliente «${id}» non esiste`)
    /* ── IL TETTO, COME AL BANCO ───────────────────────────────────
       Un quarto in più del banco, e il banco sta già sotto `🪙6·minuti`
       — ma «sta sotto» non vuol dire «sta sotto di un quarto», e il
       conto va rifatto qui sul caso peggiore di ogni merce, per ogni
       quantità che si può chiedere. È il freno che impedisce alla
       bottega di diventare la scorciatoia per salire di livello senza
       fare esercizi. */
    for (const p of chiede || []) {
      if (!PRODOTTI[p]) continue                  // lo dice guastiDegliSblocchi
      for (let n = PEZZI_MIN; n <= PEZZI_MAX; n++) {
        const reso = premioInBottega(p, n)
        const tempo = MONETE_AL_MINUTO * minutiPer({ [p]: n })
        if (!(reso <= tempo))
          g.push(`${v.id}: ${n} ${p} rendono ${reso} e costano ${tempo} di tempo: troppo`)
      }
    }
  }
  return g
}
