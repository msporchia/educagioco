/* ═══════════════════════════════════════════════════════════════════
   I LIVELLI DEL GENERALE — dati puri, niente logica

   Un livello è una coreografia da far funzionare. Il giocatore firma
   gli ordini di una fazione, il livello quelli dell'altra: stesso
   linguaggio (`motore/generale.js`), autore diverso.

   ── com'è fatto un livello ────────────────────────────────────────
     id, nome, idea          come si chiama e cosa insegna
     dritta, racconto, aiuti le parole: la riga sotto la scena, il
                             cartello del 💡, e i tre suggerimenti a
                             scalare (il primo è gratis).

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
     griglia                 righe di caratteri: '#' muro, il resto
                             pavimento
     posti, porte, oggetti,
     segnali, nomi           le cose, ognuna col suo tipo (è il tipo che
                             decide quali verbi la accettano)
     celle: true             apre anche le CASELLE come complementi: sono
                             i punti fra cui si fa un giro di ronda, e si
                             toccano sulla mappa
     unita, fazioni          chi c'è e chi lo comanda
     complementi             QUALI cose si possono nominare: è la
                             manopola della difficoltà, perché da lì
                             discende anche quali verbi compaiono in
                             cassetta (un verbo senza complementi non si
                             offre). Toglierla vuol dire dare tutto.
     verbi                   e QUALI VERBI, quando la manopola di sopra
                             non basta: «gli orchi» servono ad `attacca`
                             e si tirano dietro `aspetta di vedere`, che
                             in quel livello non serve a niente. È una
                             manopola del livello — i verbi si
                             introducono a scaglioni — e per questo NON
                             chiede spiegazioni, mentre un divieto
                             addosso a un personaggio sì (`nonRiesce`).
     obiettivo, sconfitta    quando è vinta e quando è persa
     varianti                TRE almeno, e sono la lezione del gioco: il
                             piano si firma prima di sapere quale tocca,
                             e un piano che funziona su una mappa sola è
                             fortuna. Ognuna è una toppa sulle
                             posizioni, non un livello nuovo. Di più se
                             le varianti sono la scelta stessa (i
                             quattro ingressi del forte) — ma allora
                             `prove` dev'essere alto abbastanza da
                             giocarsele tutte.
     par, soluzioni          la promessa («si può fare con questi») e la
                             prova che la promessa è mantenuta: il test
                             GIOCA le soluzioni su tutte e tre le
                             varianti, e se una non vince il livello è
                             rotto. Il par conta anche gli ordini dentro
                             un `quando`.

   Una soluzione `fragile` è quella che il gioco vuole far CADERE: una
   fila di mete esplicite che regge in un mondo e non negli altri. Se
   vincesse sempre non dimostrerebbe niente, se non vincesse mai non
   sarebbe una tentazione.

   I PRIMI SEI SONO IL TUTORIAL — un ordine, una fila, un giro, un
   segnale, una scelta, il rumore — e vanno fatti in fila. Dopo ne
   restano due, e sono due esami: la settima mette insieme l'evento e
   la decisione su un'informazione rubata al nemico, l'ottava è la
   mappa grande, dove le mete a una a una non bastano più.

   QUI NON SI FA IL DEBUG DEL PIANO DI UN ALTRO. Per un pezzo dopo la
   settima c'erano quattro prove costruite su un errore deliberato nel
   piano avversario — l'ordine invertito, il segnale con il nome
   sbagliato, l'attesa che dipende da uno solo, i due orchi mandati
   nello stesso posto — e si vincevano leggendo il piano e trovandoci
   la falla. Sono state tolte: il linguaggio lo insegnano le sei prove
   del tutorial, e a quel punto si impara battendoci la testa, non
   correggendo lo sbaglio di qualcun altro — che è un mestiere diverso
   dallo scrivere un piano proprio.

   Restano due difetti avversari, e nessuno dei due è un bug: sono
   abitudini, cioè cose che si notano giocando invece che leggendo.
     6  la reazione prevedibile  — chi accorre lascia il posto, e ci
                                   mette un pezzo ad arrivare
     7  la parola di troppo      — la ronda annuncia quando è lontana,
                                   e un segnale non ha destinatari
   ═══════════════════════════════════════════════════════════════════ */

/* ── L'ELENCO, E PERCHÉ È SCRITTO A MANO ──
   Ogni prova sta nel suo file, in `livelli/tutorial/`, col numero
   davanti: `3-il-giro-delle-mura.js`. Prima stavano tutte qui dentro,
   ottocento righe in fila, e per trovare la terza si scorreva.

   L'elenco però resta **esplicito**, e non è pigrizia: l'ordine delle
   prove è la lezione. Un ordine, poi una sequenza, poi un giro, poi un
   segnale, poi una scelta, poi il rumore, e infine tenere insieme due
   che non si vedono — chi cambia quest'ordine sta cambiando il modo in
   cui si impara, e deve farlo scrivendolo, non rinominando un file.
   (Le storie invece si raccolgono da sole: là l'ordine lo dice il
   capitolo, qui lo dice questa lista.) */
import PRIMO from './livelli/tutorial/1-primo-ordine.js'
import CHIAVE from './livelli/tutorial/2-la-chiave-e-il-portone.js'
import RONDA from './livelli/tutorial/3-il-giro-delle-mura.js'
import ATTESA from './livelli/tutorial/4-mettetevi-daccordo.js'
import DUE_STRADE from './livelli/tutorial/5-due-strade.js'
import RICHIAMO from './livelli/tutorial/6-il-richiamo.js'
import DUE_VIE from './livelli/tutorial/7-da-una-parte-e-dallaltra.js'
/* ── L'OTTAVA STA IN CODA, MA IL SUO POSTO È IL QUINTO ──
   Il ciclo che conta viene subito dopo il giro delle mura: là il
   `ripeti` si ferma su una cosa che si vede, qui su un numero, ed è la
   stessa struttura con l'uscita cambiata. In mezzo alla fila però la
   sposterebbero anche le prove dal quarto al settimo, e quelle sono
   ancora in travaso — quindi per ora si prova in fondo, e il giorno in
   cui la si infila al quinto posto **è questa riga** che si sposta. Gli
   `id` non c'entrano e non si toccano: sono le chiavi dei progressi. */
/* IL TOTEM È FERMO IN PANCHINA. Il livello c'è ed è finito, ma il
   congegno che insegna è appena nato e va guardato giocare da vicino
   prima di metterlo davanti a un bambino. Il file resta dov'è: per
   rimetterlo in campo basta togliere i commenti a queste due righe. */
// import TOTEM from './livelli/tutorial/8-il-totem.js'

/* ── E POI IL CORTILE DI ROSA, che è la prima CAMPAGNA ──
   Cinque capitoli con una storia sola dentro: Rosa, la papera Bibi e il
   cane del vicino. Non sono altre prove — sono un'altra cosa, e si
   vede dal primo minuto: **la papera non la comandi**. Ha un piano suo
   di una riga, che si legge toccandola, e tutto quello che puoi fare è
   spostare il pane. Chi ha finito il tutorial ha in mano esattamente
   le parole che servono.

   Stanno in coda a questa lista perché oggi il gioco ha una fila sola
   di livelli. Il giorno che le campagne avranno una schermata loro —
   una fila di storie invece di una fila di prove — queste cinque righe
   escono di qui e ci vanno da sole, e gli `id` (`cortile-…`) restano
   quelli, perché sono le chiavi dei progressi. */
/* ── E POI LE QUATTRO CAMPAGNE DI CONSOLIDAMENTO ──
   Il tutorial insegna un costrutto per prova; queste lo fanno usare
   finché non è in mano, e sono quattro cartelle sotto `livelli/` — una
   per costrutto, nell'ordine in cui si imparano. Le regole con cui sono
   scritte stanno in `docs/generale-didattica.md`: un livello muove un
   asse solo (o il vocabolario o il mondo), il primo di ogni campagna
   acquisisce e gli altri consolidano MESCOLANDO (mai due volte di fila
   lo stesso pattern: si impara a riconoscere la forma di un problema,
   non a ripetere una ricetta), e ogni livello si gioca su più scene,
   perché il piano si firma prima di sapere quale tocca.

   ── STANNO DOPO IL TUTORIAL, E NON È LA FILA DEFINITIVA ──
   La fila giusta le vorrebbe INTERLACCIATE — la prova che insegna il
   bivio, poi i suoi drill, poi quella che insegna il ciclo, e così via
   — e vorrebbe anche il tutorial in un altro ordine (la decisione prima
   del ciclo: l'uscita di un ciclo è la stessa domanda di un bivio, e
   incontrarla dove costa meno è un concetto per volta invece di due).
   Quel riordino cambia il modo in cui si impara e si fa guardando
   giocare, non a tavolino: finché non è stato provato, queste stanno in
   coda in blocco, che è la cosa reversibile. Il §3 e il §4 della
   didattica dicono dove dovranno andare.

   `azioni/1-la-ronda-che-decide.js` NON è in questa lista, ed è
   scritto in testa al suo file: srotolato vince tutte le scene, cioè
   non dimostra ancora che la struttura serva. Il file resta lì, fuori
   dal gioco, finché non è ridisegnato. */
import DUE_CHIAVI from './livelli/parole/1-due-chiavi.js'
import DUE_LAVORI from './livelli/parole/3-due-lavori.js'
import PRINCIPESSA from './livelli/parole/4-la-principessa-e-lorco.js'
import BUIO from './livelli/parole/5-il-buio-e-la-lanterna.js'
import SCELTA_PORTE from './livelli/scelta/1-le-due-porte.js'
import SCELTA_SPIA from './livelli/scelta/2-la-spia.js'
import SCELTA_BIVI from './livelli/scelta/3-due-bivi.js'
import SCELTA_KEY from './livelli/scelta/4-quale-chiave.js'
import GIRO_TROVATO from './livelli/giro/3-chi-hai-trovato.js'
import GIRO_ASPETTA from './livelli/giro/4-non-contare-aspetta.js'
import ACCORDO_STAFFETTA from './livelli/accordo/1-la-staffetta.js'
import ACCORDO_AVVISA from './livelli/accordo/2-il-giro-che-avvisa.js'
import ACCORDO_PASSAMANO from './livelli/accordo/3-il-passamano.js'
import ACCORDO_LIBERO from './livelli/accordo/4-chi-e-libero-ascolta.js'

import BIBI from './livelli/cortile/1-bibi.js'
import AIA from './livelli/cortile/2-laia.js'
import BOMBO from './livelli/cortile/3-bombo.js'
import ORTO from './livelli/cortile/4-lorto.js'
import STAGNO from './livelli/cortile/5-lo-stagno.js'

/* ── LA FILA È FATTA DI TRATTI, E I TRATTI HANNO UN NOME ──
   Erano una lista piatta finché erano otto prove tutte uguali di
   intenzione. Adesso sono ventisei e vengono da cinque posti diversi:
   una lista piatta di ventisei righe non dice più che dopo la settima
   comincia un'altra cosa, e chi la scorre non sa se sta ancora
   imparando o se sta già consolidando.
   Il tratto si dichiara QUI, accanto all'ordine, perché è la stessa
   decisione: **l'ordine delle prove è la lezione**, e dove finisce una
   campagna e comincia l'altra ne fa parte. `LIVELLI` e i titoli escono
   dallo stesso dato, così non si possono scollare — che è il difetto
   che avrebbe una lista di indici scritti a mano da un'altra parte. */
/* ── UNA COSA NUOVA, POI LA SI USA FINCHÉ NON È IN MANO ──
   Per un pezzo la fila è stata: sette prove che introducevano sette
   idee di fila, e solo dopo i livelli per consolidarle. È il difetto
   che il documento chiama la curva ripida — **tutto l'apprendimento in
   una volta**, e il rinforzo dopo, quando la prima idea è già
   evaporata. Adesso ogni tratto comincia con la prova che INSEGNA e
   prosegue con quelle che la fanno usare in situazioni diverse, prima
   di introdurre la cosa dopo.

   E l'ordine dei costrutti lo decide quanto costano, non quanto
   servono al mondo: **la decisione prima del ciclo**, perché l'uscita
   di un ciclo («smetti quando vedi qualcuno») è la stessa domanda di
   un bivio messa in un altro posto — incontrarla dove costa meno vuol
   dire imparare un concetto per volta invece di due. Il giro delle
   mura, che era la terza prova, arriva dopo quattro livelli di scelta:
   quando ci si arriva, «smetti quando» è già una parola nota.

   ⚠ Cambiare quest'ordine sposta le stelle già prese: i progressi del
   Generale sono per POSIZIONE (`stelle[i]`), non per id. Finché il
   gioco è in prova va bene; il giorno che è pubblicato, spostare una
   riga qui dentro va fatto sapendo che rimescola i voti di chi ha già
   giocato. */
export const TRATTI = [
  /* `CHIAVE_FORSE` è fuori, e il perché sta in testa al suo file: la
     mossa giusta lì si ricava senza guardare la situazione («prendi
     tutto quello che trovi»), e un'abitudine di prudenza non è un
     problema. Tornerà quando ci saranno le ombre sui posti possibili e
     il bivio già in mano — cioè quando ci sarà qualcosa da DECIDERE. */
  /* ── I PRIMI ORDINI, E POI I MODI DI USARLI ──
     I primi due insegnano la forma di un ordine e la fila; i quattro
     dopo non insegnano nessuna parola nuova — le stesse tre, `vai
     prendi apri` — e cambiano il MONDO sotto (§2 della didattica): una
     porta vuole la sua chiave, una si sfonda, qualcuno guarda, e al
     buio non si vede. Erano due soli, e facevano tutti la stessa cosa
     in stanze da tredici caselle: un blocco che «funzionava» e non
     mostrava niente di quello che le tre parole sanno fare. */
  { titolo: 'i primi ordini — un verbo, una cosa, e tutti i modi di usarli',
    livelli: [PRIMO, CHIAVE, DUE_CHIAVI, DUE_LAVORI, PRINCIPESSA, BUIO] },
  { titolo: 'la scelta — guarda prima di decidere',
    livelli: [DUE_STRADE, SCELTA_PORTE, SCELTA_SPIA, SCELTA_BIVI, SCELTA_KEY] },
  { titolo: 'ancora e ancora — quando non sai dov\'è, girare è l\'unico modo',
    livelli: [RONDA, GIRO_TROVATO, GIRO_ASPETTA] },
  { titolo: 'mettersi d\'accordo — quello che non vedi te lo deve dire qualcuno',
    livelli: [ATTESA, ACCORDO_STAFFETTA, ACCORDO_AVVISA, ACCORDO_PASSAMANO, ACCORDO_LIBERO] },
  { titolo: 'il rumore — e poi tutto insieme',
    livelli: [RICHIAMO, DUE_VIE] },
  { titolo: 'il cortile di Rosa — e qualcuno che non comandi',
    campagna: true,
    livelli: [BIBI, AIA, BOMBO, ORTO, STAGNO] },
]

export const LIVELLI = TRATTI.flatMap(t => t.livelli)

/* dove comincia ogni tratto: `{ [indice]: titolo }`, per chi disegna
   l'elenco. Si deriva, non si scrive. */
export const TITOLI = TRATTI.reduce((out, t) => {
  out.mappa[out.i] = t.titolo
  out.i += t.livelli.length
  return out
}, { i: 0, mappa: {} }).mappa

export const QUANTI = LIVELLI.length
/* ── IL TUTORIAL SONO TUTTE ──
   Non è un allenamento facoltativo: sono le cose senza le quali una
   storia non si può nemmeno leggere — un ordine, una sequenza, un
   giro, un segnale, una scelta, il rumore, e poi origliare e tenere
   insieme due che non si vedono. Stavano in fondo alla home sotto «e
   poi, quando vuoi», e il risultato era che si entrava in una storia
   senza sapere cosa fosse un ordine. Adesso vengono prima, e le
   avventure aspettano.

   E LA SOGLIA È IN FONDO, non a metà. Per un pezzo `TUTORIAL` valeva
   sei e le prove dopo erano «quelle dove le idee si mescolano»: una
   divisione che a schermo prometteva un cambio di passo che non
   c'era. Adesso la soglia coincide con l'ultima prova — cioè non c'è
   più nessun «dopo» finché le avventure restano chiuse — e resta una
   costante invece di un `QUANTI` scritto due volte, perché il giorno
   in cui le avventure si riaprono qui si torna a decidere DA DOVE si
   parte, che è una domanda diversa da QUANTE prove ci sono. */
/* ⚠ E DA OGGI NON COINCIDE PIÙ CON `QUANTI`: dopo le sette prove
   vengono i cinque capitoli del cortile, che tutorial non sono. La
   barra in `SceltaAvventura.vue` conta su questo numero, e deve
   continuare a dire «7 prove per impararlo» anche adesso che i livelli
   in fila sono dodici. */
/* ── E ADESSO SI DERIVA ──
   Era un 7 scritto a mano accanto a una fila che ne conteneva sette:
   due posti da tenere allineati, e uno dei due si sarebbe scollato al
   primo livello aggiunto in mezzo. Il tutorial è **il primo tratto**,
   per definizione — quello che si fa prima di consolidare — quindi la
   soglia è quanto è lungo quel tratto, e non un numero. */
export const TUTORIAL = TRATTI.filter(t => !t.campagna)
                              .reduce((n, t) => n + t.livelli.length, 0)
export const livelloDi = i => LIVELLI[Math.max(0, Math.min(LIVELLI.length - 1, i))]
/* su quanti mondi si prova il piano: i primi due livelli sono un
   tutorial e ne giocano uno solo, così il primo piano che si scrive
   funziona davvero. Dal terzo in poi sono tre, e i piani rigidi
   cominciano a cadere. */
/* ── QUANTE SCENE SI GIOCANO ──
   Il livello dichiara quante ne vuole (`prove`) e quante ne ha
   (`varianti`), e si gioca la più piccola delle due. **Ma mai zero**:
   un livello senza varianti ha comunque una scena, la sua — e prima
   questo conto dava 0, quindi la partita si vinceva e il velo di fine
   non si alzava mai, perché il gioco stava ancora aspettando una scena
   che non esisteva. */
export const proveDi = liv =>
  Math.max(1, Math.min(liv.prove || 3, (liv.varianti || []).length || 1))
