/* ═══════════════════════════════════════════════════════════════════
   I LIVELLI DEL GENERALE — dati puri, niente logica

   Un livello è una coreografia da far funzionare. Il giocatore firma
   gli ordini di una fazione, il livello quelli dell'altra: stesso
   linguaggio (`motore/generale.js`), autore diverso.

   ── com'è fatto un livello ────────────────────────────────────────
     id, nome, idea          come si chiama e cosa insegna
     dritta, racconto, aiuti le parole: la riga sotto la scena, il
                             cartello del 💡, e la scala degli aiuti
                             (`aiuto.dice/scrive/forma/svela` in
                             `livelli/scrivi.js`).

                             LA REGOLA È UNA SOLA: si dice soltanto
                             quello che la mappa NON mostra. Dov'è il
                             tesoro, dove sono le porte, chi sta dove
                             — quello si vede, e ridirlo a parole è
                             una pagina da saltare. Restano quattro
                             cose, e sono invisibili per davvero:
                             cosa vuol dire vincere (la `dritta`, e
                             quasi sempre basta lei), cosa CAMBIA da
                             una battaglia all'altra, chi non vede
                             cosa, e i numeri che decidono («cade al
                             primo colpo», «venti spallate»). Il
                             `racconto` sono due frasi, non un
                             paragrafo; quello che si scopre toccando
                             un personaggio è materia da aiuto, non da
                             cartello.
     scena                   la mappa a token e la sua legenda
                             (`campo(righe, legenda)`)
     celle: true             apre anche le CASELLE come complementi: sono
                             i punti fra cui si fa un giro di ronda, e si
                             toccano sulla mappa
     complementi             QUALI cose si possono nominare: è la
                             manopola della difficoltà, perché da lì
                             discende anche quali verbi compaiono in
                             cassetta (un verbo senza complementi non si
                             offre). Toglierla vuol dire dare tutto.
     verbi                   e QUALI VERBI, quando la manopola di sopra
                             non basta. È una manopola del livello — i
                             verbi si introducono a scaglioni — e per
                             questo NON chiede spiegazioni, mentre un
                             divieto addosso a un personaggio sì
                             (`nonRiesce`).
     vince, perde            quando è vinta e quando è persa
     varianti                le scene su cui il piano si prova. Servono
                             solo dove c'è qualcosa da indovinare: il
                             piano si firma prima di sapere quale tocca,
                             e un piano che funziona su una mappa sola è
                             fortuna. Dove non c'è niente da indovinare
                             la scena è una sola (`prove: 1`): tre scene
                             che non cambiano il piano non sono una
                             prova, sono un'attesa.
     soluzioni               la prova che il livello si vince: il banco
                             (`test/aiuto/livello.mjs`) le GIOCA su tutte
                             le scene, e se una non vince il livello è
                             rotto.

   Una soluzione `fragile` è quella che il gioco vuole far CADERE: una
   fila di mete esplicite che regge in un mondo e non negli altri. Se
   vincesse sempre non dimostrerebbe niente, se non vincesse mai non
   sarebbe una tentazione.

   QUI NON SI FA IL DEBUG DEL PIANO DI UN ALTRO. Per un pezzo c'erano
   prove costruite su un errore deliberato nel piano avversario, e si
   vincevano leggendo il piano e trovandoci la falla. Sono state tolte:
   il debug si fa sul proprio piano, non su quello di qualcun altro.
   Leggere la scheda di un personaggio per capire COME È FATTO (a cosa
   reagisce, dove va) è un'altra cosa, ed è permesso: è il «Richiamo».
   ═══════════════════════════════════════════════════════════════════ */

/* ── L'ELENCO, E PERCHÉ È SCRITTO A MANO ──
   Ogni prova sta nel suo file, in `livelli/`, col numero davanti. L'elenco
   però resta **esplicito**, e non è pigrizia: l'ordine delle prove è la
   lezione, e chi lo cambia sta cambiando il modo in cui si impara — deve
   farlo scrivendolo, non rinominando un file.

   ── E SONO RIMASTI I SEI PUBBLICATI ──
   Qui dentro c'erano ventisei livelli: il tutorial, quattro campagne di
   consolidamento (la scelta, il giro, mettersi d'accordo, le parole) e
   il cortile di Rosa, più le cinque avventure a capitoli spente e le
   campagne progettate e mai mappate. Erano stati scritti a tavolino, e
   giocati si sono rivelati quello che il banco non sa misurare:
   stanzette con una decisione sola, varianti che non cambiavano niente,
   la stessa missione — il tesoro — in venti vestiti. Sono stati tolti
   tutti, e restano i sei che un bambino ha giocato e che vanno bene.
   Stanno in git, se servisse riguardarli. */
import PRIMO from './livelli/tutorial/1-primo-ordine.js'
import CHIAVE from './livelli/tutorial/2-la-chiave-e-il-portone.js'
import MULINO from './livelli/parole/1-due-chiavi.js'
import DUE_STRADE from './livelli/tutorial/5-due-strade.js'
import ATTESA from './livelli/tutorial/4-mettetevi-daccordo.js'
import RICHIAMO from './livelli/tutorial/6-il-richiamo.js'
/* ── E POI LE STORIE A PUNTATE ──
   Dopo il tutorial non vengono altre prove: vengono **storie**, una
   serie di pagine nello stesso posto, dove ognuna comincia da come
   l'ha lasciata quella prima. Non insegnano un costrutto per volta — lo
   hanno già fatto le sei prove — e ogni pagina si vince in più modi.
   Nascono dietro il cancello dei giochi in prova, come ogni livello
   nuovo. */
import TORTA from './livelli/torta/1-dalla-cucina-al-forno.js'

/* ── LA FILA È FATTA DI TRATTI, E I TRATTI HANNO UN NOME ──
   Il tratto si dichiara QUI, accanto all'ordine, perché è la stessa
   decisione: **l'ordine delle prove è la lezione**, e dove finisce un
   pezzo e comincia l'altro ne fa parte. `LIVELLI` e i titoli escono
   dallo stesso dato, così non si possono scollare.

   Riordinare è permesso e costa niente: le stelle stanno sotto l'`id`
   del livello (`gen.stelle[id]`, vedi `views/generale/fila.js`), non
   sotto la sua posizione. */
export const TRATTI = [
  /* ── IL TUTORIAL, IN UN BLOCCO SOLO ──
     Erano quattro tratti (i primi ordini, la scelta, mettersi d'accordo,
     il rumore), ma sono una cosa sola: le prove che insegnano i comandi
     uno per volta, prima delle storie. Ogni livello dice accanto al nome
     cosa si impara (`impara`), che è quello che i quattro titoli
     cercavano di dire a gruppi. */
  { titolo: 'il tutorial — un comando per volta',
    livelli: [PRIMO, CHIAVE, MULINO, DUE_STRADE, ATTESA, RICHIAMO] },
  { titolo: 'la torta del re — una storia a puntate',
    campagna: true, livelli: [TORTA] },
]

/* ── QUELLI CHE SI POSSONO GIÀ DARE IN MANO A UN BAMBINO ──
   Oggi sono tutti, ma il cancello resta, perché serve al livello che
   verrà dopo: un livello nuovo **nasce nascosto**, dietro il cancello
   dei giochi in prova (`settings.sperimentali`, lo stesso flag che
   nasconde i giochi non finiti). A flag spento non compare nell'elenco
   e non si apre, a flag acceso c'è col suo 🧪 — è così che lo si guarda
   giocare prima di promuoverlo.

   Si dichiara chi è APPROVATO, non chi è in prova: un livello arriva ai
   bambini quando qualcuno lo ha deciso, non perché nessuno si è
   ricordato di aggiungere una riga. E si scrive per riferimento e non
   per id, così una prova promossa a nome sbagliato non passa
   silenziosa: un nome che non esiste è un errore di build. */
const APPROVATI = new Set([PRIMO, CHIAVE, MULINO, DUE_STRADE, ATTESA, RICHIAMO]
  .map(l => l.id))
export const inProva = liv => !APPROVATI.has(liv.id)

/* la fila PIENA, quella da cui si aprono i livelli */
export const LIVELLI = TRATTI.flatMap(t => t.livelli)

/* ── LA FILA CHE SI VEDE ──
   Una riga per livello visibile, e ognuna si porta dietro l'`i` che ha
   nella fila piena: chi disegna l'elenco scorre queste, chi apre un
   livello usa quell'indice, chi scrive i progressi usa `liv.id`. Il
   titolo del tratto va sulla prima riga VISIBILE del tratto — se le
   prime del blocco sono in prova, il titolo scivola su quella che si
   vede davvero invece di sparire con loro; un tratto rimasto senza
   righe non compare affatto.

   È una funzione e non una costante perché il flag si accende dalla
   schermata dei genitori mentre il gioco è aperto: chi la chiama la
   avvolge in un `computed` e l'elenco si rifà da sé — lo fa in un posto
   solo, `views/generale/fila.js`, che è anche dove sta il conto dei
   lucchetti. */
export function fila (conProva = false) {
  const righe = []
  let i = 0
  for (const t of TRATTI) {
    let primo = true
    for (const liv of t.livelli) {
      if (conProva || !inProva(liv)) {
        righe.push({ liv, i, campagna: !!t.campagna, prova: inProva(liv),
                     titolo: primo ? t.titolo : '' })
        primo = false
      }
      i++
    }
  }
  return righe
}

export const livelloDi = i => LIVELLI[Math.max(0, Math.min(LIVELLI.length - 1, i))]

/* ── A CHE ETÀ SI OFFRE ──
   La home decide chi vede il Generale con la regola di tutti gli altri
   giochi (`data/portata-giochi.js`): la fila delle tappe, ognuna con la
   sua `portata` sulla scala 0–100 di `data/portata.js`. Prima la prendeva
   dalle campagne progettate e mai mappate, cioè decideva a che età
   offrire il gioco guardando livelli che non esistevano. Adesso guarda
   questi, stesi sulla stessa rampa che aveva la campagna principale:
   dai sei anni (25) ai sette e mezzo (45).
   Niente `scuola`: scrivere un piano e guardarlo girare non è una materia
   che la scuola dia, quindi la testa della fila non si taglia mai — chi
   arriva a dieci anni deve comunque imparare che quello che non hai
   scritto non succede. */
const RAMPA = [25, 45]
export const TAPPE = LIVELLI.map((liv, i) => ({ id: liv.id, nome: liv.nome,
  portata: Math.round(RAMPA[0] + (RAMPA[1] - RAMPA[0]) * i / Math.max(1, LIVELLI.length - 1)) }))

/* ── QUANTE SCENE SI GIOCANO ──
   Il livello dichiara quante ne vuole (`prove`) e quante ne ha
   (`varianti`), e si gioca la più piccola delle due. **Ma mai zero**:
   un livello senza varianti ha comunque una scena, la sua — e prima
   questo conto dava 0, quindi la partita si vinceva e il velo di fine
   non si alzava mai, perché il gioco stava ancora aspettando una scena
   che non esisteva. */
export const proveDi = liv =>
  Math.max(1, Math.min(liv.prove || 3, (liv.varianti || []).length || 1))
