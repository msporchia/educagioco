/* ═══════════════════════════════════════════════════════════════════
   LE GUIDE — DATO PURO

   Due registri, perché sono due pubblici diversi.

   `GUIDE` sono per i grandi, e stanno nella schermata «Come funziona»
   (`src/guide/Guide.vue`), **fuori dal codice di casa**: un genitore che
   riceve il link per la prima volta deve poter leggere come si installa
   senza sapere che il codice di partenza è 0000.

   `AIUTI` sono uno per gioco, e li apre il `?` della barra
   (`components/Barra.vue`). Li legge chi ha il gioco già aperto — spesso
   un bambino — quindi frasi corte, niente strategia in venti righe, e
   soprattutto **le cose che dallo schermo non si vedono**: che il dito va
   tenuto premuto, che la cifra si scrive una alla volta. Come si tocca un
   tasto lo scopre da sé; che esista il tocco lungo, no.

   ── PERCHÉ NON STANNO NEI MANIFESTI ──
   Sarebbe stato il posto naturale per i giochi nuovi (`gioco.js`), ma
   metà dei giochi non ce l'ha un manifesto: quelli in `src/views/` sono
   più vecchi della convenzione. Con l'aiuto nel manifesto ci sarebbero
   due posti dove cercarlo, e il tower defense — che è quello che ne ha
   più bisogno di tutti — sarebbe finito in quello sbagliato.

   ── LE PRIME DUE RISPONDONO A «COS'È QUESTA ROBA» ──
   L'elenco cominciava da «come si installa», e prometteva più di quello
   che manteneva: erano otto guide che spiegavano **le manopole** a chi
   non sapeva ancora cosa fosse l'applicazione sotto. Chi riceve il link
   da un'altra famiglia si trova davanti un gioco senza nome, senza
   nessuno dietro, e la prima schermata che vede gli chiede di scrivere
   il nome di suo figlio: le domande che si fa in quel momento sono
   *cos'è*, *chi me l'ha dato*, *cosa ci guadagna*, *dove finisce quello
   che scrivo* — e nessuna delle otto rispondeva. Le manopole vengono
   dopo, e restano tutte dov'erano.

   ── LA FORMA DI UN BLOCCO ──
   Una stringa è un paragrafo. Un oggetto può avere:
     titolo   un'intestazione sopra il blocco
     testo    uno o più paragrafi dentro il blocco (stringa o elenco)
     righe    un elenco puntato
     passi    un elenco numerato (le istruzioni da seguire in ordine)
     collegamenti  [{ url, testo, sotto }] — porta fuori dall'app, e si
              vede che porta fuori. Solo `http(s)`.
     chiuso   il blocco nasce ripiegato: si vede il titolo, si apre
              toccandolo (vedi sotto)
     dove     'android' | 'ios' | 'computer' — il blocco c'è sempre, ma
              sta aperto solo su quella piattaforma e ripiegato sulle
              altre; i blocchi `dove` si riordinano da sé, il proprio
              davanti
     se       'android' | 'ios' | 'computer' | 'installata' | 'da-installare'
              — il blocco compare **solo** lì e altrove non esiste (vedi
              `guide/aiuto.js`). Da usare quando altrove sarebbe una
              frase falsa, non solo inutile: per «i passi di un altro
              telefono» c'è `dove`
   Niente HTML: quello che si può scrivere è quello che c'è qui sopra, e
   una chiave sconosciuta non viene disegnata.

   ── DUE LIVELLI, E IL SECONDO STA CHIUSO ──
   `chiuso: true` è quello che tiene corte le risposte. Di roba scritta
   ce n'era parecchia — nel README, in `LEGGIMI.md`, nei documenti dei
   singoli giochi — e nessuna stava qui dentro, per un motivo giusto:
   messa in fila avrebbe seppellito la risposta di tre righe che serve a
   quasi tutti. Chiusa in una fisarmonica invece convive: sopra la
   risposta corta, sotto una freccia che dice che c'è dell'altro e non
   costa niente a chi tira dritto. La regola per decidere dove va un
   paragrafo è **se serve a fare qualcosa sta fuori, se spiega perché è
   fatto così sta dentro**.

   ── `subito` ──
   Le guide marcate così le legge chi non ha ancora un profilo: sono
   quelle che il velo del primo avvio (`guide/VeloGuide.vue`) offre
   prima che il gioco esista. Le altre parlano di manopole che stanno
   dentro le impostazioni, e le impostazioni di un bambino che non c'è
   ancora non si aprono.
   ═══════════════════════════════════════════════════════════════════ */

import { GIOCHI } from '../data/giochi.js'
import { AREE, MODI } from '../data/aree.js'
import { CHI, CODICE, AUTORE, SEGNALA } from './aiuto.js'

/* ── L'ELENCO DEI GIOCHI NON SI SCRIVE A MANO ──
   Sarebbe stata la cosa più naturale: quindici righe di testo. Ma un
   elenco scritto a mano è un elenco che il giorno dopo dice il falso —
   si aggiunge un gioco e nessuno torna qui — e per di più direbbe cose
   diverse da quelle che il bambino ha sotto gli occhi in home, che i
   nomi e le descrizioni li prende dallo stesso registro. Qui si
   raggruppa e si impagina, punto: `data/giochi.js` resta l'unico posto
   dove un gioco si descrive.

   Gli sperimentali restano fuori: di partenza non esistono per nessuno,
   e prometterli in una guida vorrebbe dire farli cercare a vuoto. */
const perArea = () => AREE.map(a => ({
  titolo: a.emoji + ' ' + a.nome,
  righe: GIOCHI.filter(g => g.area === a.chiave && !g.sperimentale)
    .map(g => '**' + g.ico + ' ' + g.nome + '** — ' + g.che
      + (MODI[g.come] ? ' · ' + MODI[g.come].emoji + ' ' + MODI[g.come].nome : '')),
})).filter(b => b.righe.length)

const quanti = GIOCHI.filter(g => !g.sperimentale).length

export const GUIDE = [
  {
    id: 'cose',
    emoji: '🎲',
    titolo: 'Cos\'è questo gioco',
    sommario: 'Esercizi di scuola travestiti da giochi, tarati su quanti anni ha',
    subito: true,
    blocchi: [
      'Sono ' + quanti + ' giochi per bambini **dai quattro ai dieci anni**: tabelline, conti in colonna, inglese e spagnolo con la pronuncia registrata, misure, soldi e resto — e roba che di scuola non ha niente, un castello da difendere, un sotterraneo da esplorare, una fattoria da far crescere.',
      { titolo: 'Il patto è questo', testo: [
        'Le domande **si pagano e rendono**: una risposta giusta apre una porta, abbatte un mostro, compra una torre, e alla fine diventa una moneta.',
        'Le monete si spendono dove non si studia — la fattoria, gli animali. Un bambino non apre il gioco per esercitarsi: lo apre per comprarsi la mucca, e le tabelline sono la strada per arrivarci.',
      ] },
      { titolo: 'Cosa non c\'è', righe: [
        'Nessun account, nessuna registrazione, nessuna email da dare.',
        'Nessuna pubblicità, niente da comprare, nessun abbonamento.',
        'Nessun altro bambino dall\'altra parte: niente chat, niente classifiche, nessuno con cui parlare.',
        'Niente internet, dopo la prima apertura: funziona in aereo e in montagna.',
        'Niente notifiche e niente vite che si ricaricano: non c\'è nessun meccanismo che chiami a tornare.',
      ] },
      { titolo: 'Le manopole stanno dietro un codice', testo:
        'Quelle per i grandi sono in fondo alla schermata dei giochi, sotto **⚙︎ Impostazioni**, e chiedono quattro cifre: **di partenza è 0000**. Quali siano, come si cambiano e cosa fare se le hai dimenticate: c\'è la guida **«Il codice dei genitori»**.' },
      { titolo: 'Tutto si tara su un numero solo', testo:
        'Quanti anni ha il bambino, che si dice al primo avvio e si sposta quando si vuole: da lì dipende **quali giochi trova in home**, **cosa si dà per scontato che a scuola abbia già fatto** e **quanto sono difficili le domande**. Non è un\'anagrafe e il numero non si vede da nessuna parte mentre si gioca.' },
      { titolo: 'Perché l\'ho fatto', chiuso: true, testo: [
        'È nato per i miei due figli, per fargli ripassare quello che stavano facendo a scuola e per avere qualcosa di meglio da dargli quando chiedevano il telefono. È cresciuto guardandoli giocare: quello che funzionava restava, il resto lo buttavo.',
        'Una cosa da sapere prima di darlo a un bambino: **è tarato sulla scuola italiana**, e su quello che i miei figli stavano facendo in quel momento. Il resto se lo aggiusta da sé a partire da quanti anni ha, e quello che resta storto si spegne.',
        'Se serve a un altro bambino, tanto meglio: è gratis, è aperto, e non ci guadagno niente.',
      ] },
      { titolo: 'Quanto ci si gioca', chiuso: true, righe: [
        'Si chiude quando si vuole: una tappa dura pochi minuti e quello che si è fatto è già salvato. Non c\'è nessuna partita che si perde uscendo.',
        'Non c\'è niente costruito per farlo restare: nessun premio giornaliero, nessuna serie da non spezzare, nessuna vita che si ricarica fra un\'ora.',
        'L\'unica cosa che usa il tempo vero è la fattoria — un campo seminato si raccoglie più tardi — ma **niente marcisce mai**: se si torna dopo una settimana è tutto lì.',
        'Quanto ci deve stare non lo decide il gioco. Dieci minuti al giorno su una cosa fatta bene valgono più di un\'ora di domande a caso, e questo vale anche qui.',
      ] },
      { titolo: 'Cosa non è', chiuso: true, testo: [
        'Non è un corso e non insegna da zero: dà per scontato che le cose le spieghi la scuola, e serve a **fare esercizio** su quelle. Un bambino che non ha mai visto le divisioni non le impara qui — e infatti si possono spegnere finché non le hanno fatte.',
        '**Non è una valutazione.** Un resoconto c\'è, e sta nelle impostazioni, nella scheda «Come va»: quanto ha giocato e a cosa, e a quali domande fa fatica. Serve a farsi un\'idea di massima — «l\'orologio a lancette gli va storto, forse a scuola non l\'hanno ancora fatto» — non a dargli un voto: nessuna pagella, nessuna media, nessun confronto con altri bambini, e nessuna soglia oltre la quale il gioco dica che qualcosa è tanto o poco. Dove i tentativi sono pochi lo scrive, invece di far finta che tre risposte siano un giudizio.',
        'E il bambino quel resoconto non lo vede: sta dietro il codice di casa. Mentre gioca le uniche cifre che gli arrivano sono monete e traguardi.',
      ] },
    ],
  },

  {
    id: 'giochi-elenco',
    emoji: '🕹️',
    titolo: 'Che giochi ci sono',
    sommario: 'Tutti quelli che esistono, e cosa allena ognuno',
    subito: true,
    blocchi: [
      'Non arrivano tutti insieme e non li vede tutti lo stesso bambino: **quali compaiono in home lo decide l\'età**. Questo è l\'elenco intero.',
      ...perArea(),
      'Dentro ogni gioco, il **?** in cima spiega come si gioca a quello, e in fondo dice cosa allena.',
      { titolo: 'Perché non li vede tutti', chiuso: true, testo: [
        'Ogni tappa di ogni gioco dichiara quanto è difficile, sulla stessa scala per tutte le materie. Un gioco compare in home quando qualcuna delle sue tappe cade alla portata di chi guarda: la bancarella non prima dei sei anni, il laboratorio delle pozioni non prima dei sette e mezzo.',
        'Nell\'altro verso vale uguale: «Conta gli animali» smette di essere offerto verso i sette anni, «Prima e dopo» verso gli otto. Quindici carte in home a un bambino di quattro anni non sono una scelta, sono un muro.',
        '**Quello che è cominciato però non sparisce mai.** L\'età decide cosa si offre a chi arriva, non cosa si toglie a chi c\'è già: un gioco aperto anche una volta sola resta in home. E se una scelta non torna, si tiene in casa a mano — dalle impostazioni, la ✎ della sua riga.',
      ] },
    ],
  },

  {
    id: 'installare',
    emoji: '📲',
    titolo: 'Mettilo sul telefono',
    sommario: 'Si installa come un\'app, e poi funziona anche senza internet',
    subito: true,
    blocchi: [
      { se: 'installata', titolo: '✅ È già installato',
        righe: ['Stai giocando dall\'icona sulla schermata iniziale: è così che va bene.'] },
      'Il gioco è una pagina web, ma si può aggiungere alla schermata iniziale del telefono. Da lì in poi si apre con un\'icona come tutte le altre app, a schermo intero, e **funziona anche senza internet**.',
      'I passi cambiano da telefono a telefono. **Quello che hai in mano è già aperto qui sotto**; gli altri si aprono toccandoli — servono quando lo installi sul telefono di qualcun altro, che è quasi sempre il caso di chi legge dal computer.',
      { dove: 'android', titolo: '🤖 Su Android', passi: [
        'Apri il gioco con **Chrome**, e da lì il menu ⋮ (i tre puntini in alto a destra).',
        'Tocca «Installa app», oppure «Aggiungi a schermata Home».',
        'Conferma. L\'icona compare fra le altre app.',
      ] },
      { dove: 'ios', titolo: '🍎 Su iPhone e iPad', passi: [
        'Serve **Safari**: da Chrome il tasto non c\'è. Se il link è stato aperto con un altro browser, va riaperto con Safari.',
        'Tocca il tasto Condividi in basso (il quadrato con la freccia che esce).',
        'Scorri l\'elenco e tocca «Aggiungi a Home».',
        'Conferma in alto a destra.',
      ] },
      { dove: 'computer', titolo: '💻 Sul computer', righe: [
        'Da Chrome o Edge: l\'icona con la freccia dentro lo schermo, in fondo alla barra dell\'indirizzo.',
        'Non è necessario: sul computer va bene anche una scheda del browser, basta salvarla fra i preferiti.',
        'Per metterlo sul telefono di un figlio, il modo più corto è **mandarsi il link** — il tasto sta in fondo all\'elenco delle guide — e aprirlo da lì.',
      ] },
      { titolo: 'Perché conviene', righe: [
        'Si apre con un tocco, senza cercare l\'indirizzo.',
        'Funziona in aereo, in macchina, dove non prende.',
        'Niente barra del browser: i bambini non finiscono su altre pagine.',
      ] },
      { se: 'da-installare', titolo: '⚠️ Una cosa da sapere', righe: [
        'I progressi restano **dentro questo telefono**: non c\'è nessun account e niente va su internet. Se un giorno cancelli i dati del browser, spariscono. Per questo c\'è «Salva su file» nelle impostazioni.',
      ] },
      { titolo: 'Come fa a funzionare senza rete', chiuso: true, testo: [
        'Perché non c\'è nessun server con cui parlare: il gioco **è** una pagina sola, e dentro c\'è tutto — il codice, i disegni, e anche le voci che pronunciano le parole inglesi e spagnole, che sono registrate e non chieste a un servizio. Alla prima apertura il telefono se la tiene, e da lì in poi la rete non serve più.',
        'Serve solo per prendere le versioni nuove, e succede da sé quando c\'è: in fondo alla schermata iniziale è scritto di quando è quella in uso, così due telefoni si confrontano a colpo d\'occhio.',
      ] },
    ],
  },

  {
    id: 'codice',
    emoji: '🔑',
    titolo: 'Il codice dei genitori',
    sommario: 'Qual è (0000), come si cambia, e se l\'hai dimenticato',
    subito: true,
    blocchi: [
      'Le impostazioni chiedono quattro cifre. **Di partenza è 0000**: se nessuno l\'ha mai cambiato, è quello.',
      { titolo: 'Dove si entra', passi: [
        'In fondo alla schermata dei giochi, il tasto grigio **⚙︎ Impostazioni**.',
        'Quattro cifre: **0000**, la prima volta.',
      ] },
      { titolo: 'Cambialo, e conviene farlo subito', righe: [
        'Impostazioni → **🔑 Cambia il codice**. Te lo chiede due volte, così un dito storto non ti chiude fuori.',
        '**0000** è come non avere un codice, e la carta te lo dice finché non lo cambi.',
        'Vale per tutta la casa, non per un bambino: è uno solo anche se giocano in tre.',
      ] },
      { titolo: 'Se l\'hai dimenticato', righe: [
        'Sul tastierino, in fondo, **«Non ricordi il codice?»**: si risponde a una domanda di cultura generale e il codice torna a **0000**, così puoi sceglierne subito uno nuovo.',
        '**I progressi non si toccano**, in nessun caso: né il recupero né il cambio del codice sfiorano monete, animali o campagne.',
        'Se sbagli più volte il tastierino si ferma qualche secondo, poi di più: non è rotto, sta aspettando.',
      ] },
      { titolo: 'Cosa c\'è dietro, e perché entrarci', chiuso: true, righe: [
        'Quanti anni ha il bambino, che è quello che decide i giochi in home e la difficoltà delle domande.',
        'Ritoccare una materia da sola, o dire che a scuola non l\'hanno ancora fatta.',
        'Spegnere un gioco che non va bene.',
        '**Come va**: quanto ha giocato e a cosa, e a quali domande fa fatica.',
        'Salvare i progressi su file, rimetterli, e il cestino di quello che è stato cancellato.',
        'Chi gioca su questo telefono: aggiungere un fratello, cambiare un nome.',
      ] },
      { titolo: 'Perché non è una vera password', chiuso: true, testo: [
        'Perché non deve esserlo. Serve a **fermare il dito distratto** — il bambino che gira le maniglie e trova il tasto rosso che cancella i progressi — non un ragazzino determinato: la risposta della domanda di recupero sta su internet, e chi ci arriva la trova.',
        'Le alternative sono state pesate e sono tutte peggio: un codice lungo scritto da qualche parte è il codice vero scritto più in grande, e a leggerlo arriva prima il bambino; un recupero via posta vuole un server, e qui non ce n\'è nessuno; ventiquattr\'ore di attesa non fermano chi ci tiene davvero.',
        'Quello che regge il colpo non è la porta, è il **cestino**: prima di cancellare i progressi di un bambino il gioco ne mette da parte una copia, e si rimette. Se entrare non distrugge più niente, il recupero può permettersi di essere facile — e chi entra senza titolo lascia comunque una traccia scritta: il codice rimesso a **0000** diventa un avviso che trovi qui dentro.',
      ] },
    ],
  },

  {
    id: 'eta',
    emoji: '🎂',
    titolo: 'Quanti anni ha il bambino',
    sommario: 'È il numero che decide quanto sono difficili le domande',
    subito: true,
    blocchi: [
      'Ogni domanda del gioco ha una difficoltà, e ogni bambino ha un\'età: il gioco pesca solo quello che sta attorno a lui — un po\' indietro per ripassare, un po\' avanti per imparare. Non è una classifica e non lo boccia nessuno: serve a non chiedere le divisioni a chi fa la prima, e a non chiedere «con che lettera comincia 🐝» a chi ne ha dieci.',
      { titolo: 'Dove si cambia', passi: [
        'Impostazioni (il tasto grigio in fondo alla home).',
        'Scheda «Giochi e domande» → la manopola in cima.',
        'Sotto compare il quadro di quell\'età: cosa trova in home e che domande gli arrivano. Si guarda, poi si preme «Applica».',
      ] },
      'Se non sei sicuro, **metti l\'età vera**. Se poi le domande sembrano fuori misura si aggiusta materia per materia, senza spostare l\'età: vedi la guida qui accanto.',
      { titolo: 'Quando l\'hai appena creato', righe: [
        'Al primo avvio il gioco chiede in che classe è: da lì decide quali giochi far vedere e cosa dare per scontato. Si può rifare più tardi dalla scheda del bambino.',
      ] },
      { titolo: 'Perché l\'età e non la classe', chiuso: true, testo: [
        'Sotto c\'è **una scala sola, da zero a cento** — zero il primo giorno di materna, cento la fine della primaria, dodici punti e mezzo per anno di scuola — e ci stanno sopra tutte le materie insieme: una tabellina, una parola inglese, l\'orologio a lancette, una tappa del castello. L\'età è una finestra su quella scala, e i giochi pescano lì dentro.',
        'Gli anni si spostano di mezzo per volta perché è la misura della correzione vera: un bambino è avanti o indietro di un semestre, non di un ciclo. La classe invece è uno scalino da un anno, e mezzo anno non lo saprebbe dire.',
      ] },
      { titolo: 'Cosa succede spostandola', chiuso: true, righe: [
        'Di poco, dentro la stessa fascia di scuola: si sposta **solo la mira delle domande**, e quello che hai sistemato a mano resta dov\'è.',
        'Tanto da cambiare fascia: il gioco lo dice **prima** di scrivere, con quante cose tue si perdono — «2 giochi messi a mano, 1 domanda ritoccata». Nessuna sorpresa e nessun «sei sicuro?» senza numeri.',
        'In nessun caso si toccano monete, animali, campagne e traguardi: quelli non dipendono dall\'età.',
      ] },
    ],
  },

  {
    id: 'domande',
    emoji: '🧠',
    titolo: 'Come sceglie le domande',
    sommario: 'Le cose incerte tornano spesso, quelle sicure spariscono per settimane',
    subito: true,
    blocchi: [
      'Le domande non escono a caso e non escono in fila. Ogni cosa da imparare — una tabellina, una parola inglese, l\'orologio — ha una sua **forza**, che sale quando la risposta è giusta e scende quando è sbagliata. Quello che è incerto torna presto; quello che è saputo sparisce per settimane, e poi rispunta per un controllo.',
      { titolo: 'Quello che si nota giocando', righe: [
        'Una parola sbagliata **ritorna**, e non alla fine della partita: poco dopo.',
        'Rispondendo giusto due volte di fila su una stessa cosa, quella non si rivede più per il resto della partita — è tempo tolto a quello che non sa.',
        'Nei giochi d\'avventura la domanda è un pedaggio, non una lezione: lì il ripasso c\'è ma è lieve, altrimenti aprire una porta diventerebbe una punizione.',
      ] },
      { titolo: 'Perché una parola torna anche se non l\'ha sbagliata', chiuso: true, testo: [
        'Perché la forza **cala da sola col tempo**. Una parola imparata dieci giorni fa non vale quanto una imparata ieri, e torna a farsi vedere senza che nessuno l\'abbia sbagliata: è la ripetizione dilazionata, la stessa idea delle scatole di schede che si rivedono a distanze crescenti.',
        'È il motivo per cui il gioco è più utile venti minuti al giorno che due ore il sabato: quello che conta è **quante volte una cosa torna a distanza**, non quanto si sta seduti.',
      ] },
      { titolo: 'Due meccanismi diversi, che non si pestano i piedi', chiuso: true, testo: [
        'L\'**età** dice **cosa può arrivare**: taglia fuori quello che è troppo indietro e quello che è troppo avanti, e non lo fa una volta sola ma a ogni domanda.',
        'La **forza** dice **quando torna** quello che è già arrivato, e non sa niente di età.',
        'Sono separati apposta: se fossero una cosa sola, un bambino che va male in una materia si vedrebbe abbassare l\'età per tutto il resto.',
      ] },
      { titolo: 'Se una cosa gli va storta sempre', chiuso: true, righe: [
        'Non serve accorgersene per caso: **Impostazioni → «Come va»** mette in cima proprio quelle, e dice a quante risposte è arrivato — che è il numero senza cui «7 sbagliate» non vuol dire niente.',
        'Poi si guarda se è una difficoltà o un buco: il **▶** accanto a una materia apre una domanda vera, quella che gli arriverebbe. Spesso basta guardarla per capire.',
        'Se è tarata male, la **✎** la sposta di mezzo anno per volta senza toccare il resto.',
        'Se a scuola non l\'hanno ancora fatta, l\'ultimo scatto è «non ancora spiegate»: quelle domande **non escono più**, in nessun gioco. Non è una difficoltà in meno, è una domanda muta in meno — chi non ha mai visto i litri non può ragionare su «quanti centilitri sono due litri», può solo tirare a indovinare.',
        'C\'è anche un interruttore che mette tre tastini sopra ogni domanda — 😴 troppo facile, 😰 troppo difficile, 🐛 storta: serve a segnalarmi le tarature sbagliate, che è il difetto che nessun controllo automatico trova.',
      ] },
    ],
  },

  {
    id: 'difficolta',
    emoji: '🎚️',
    titolo: 'Se le domande sono troppo difficili',
    sommario: 'O troppo facili: si aggiusta una materia per volta',
    blocchi: [
      'L\'età sposta tutto insieme. Ma un bambino può essere avanti in lettura e indietro nelle tabelline, quindi ogni materia si ritocca da sola.',
      { titolo: 'Come si fa', passi: [
        'Impostazioni → scheda «Giochi e domande» → sotto la manopola, il quadro.',
        'Le materie stanno in blocchi, rispetto a lui: quelle che sa già fare, quelle che sta imparando, quelle difficili.',
        'Apri il blocco, poi la **✎** della materia: una tacca la sposta di mezzo anno per volta, e dice dove va a finire. Si conferma.',
        'Il **▶** ti fa provare una domanda vera, prima di decidere.',
      ] },
      { titolo: 'Se a scuola non l\'hanno ancora fatta', righe: [
        'Nella stessa tacca, l\'ultimo scatto a destra è «non ancora spiegate»: fa sparire le **domande** che danno per scontata quella materia, in tutti i giochi. Si rimette quando l\'avranno fatta.',
      ] },
      { titolo: 'Il gioco te lo dice da sé', righe: [
        'La scheda **«Come va»** elenca tutte le domande che gli arrivano, dalla peggiore alla migliore: le tre righe che contano stanno in cima da sole, senza doverle cercare.',
        'Il punteggio è anche il tasto: si preme e si aprono i numeri di quella riga, con lì accanto il ritocco.',
        'Dove ha risposto poche volte il punteggio è **sbiadito**, ed è un\'avvertenza: una su tre non è un terzo, è un bambino che quella cosa l\'ha vista tre volte.',
        'E il **▶** apre una domanda vera: è lì che si vede se la taratura è sbagliata o se era solo una brutta giornata.',
      ] },
      'Quello che hai messo a mano resta **color ambra** nell\'elenco, e in fondo al quadro c\'è il tasto che rimette tutto com\'è di partenza a quell\'età. I progressi non si toccano.',
      { titolo: 'Perché non lo aggiusta da sé', chiuso: true, testo: [
        'Il conto per farlo c\'è: il gioco sa dire quando una materia ha abbastanza tentativi con meno di metà risposte giuste — un muro — o più di nove su dieci — un pedaggio inutile. Ma **consiglia e non ritocca**: un pomeriggio storto, una domanda letta di fretta, un fratello che gioca col profilo dell\'altro, e la taratura si sposterebbe da sola nella direzione sbagliata. Chi guarda la faccia del bambino ne sa più di qualunque contatore.',
      ] },
    ],
  },

  {
    id: 'giochi',
    emoji: '🎮',
    titolo: 'Se un gioco non va bene',
    sommario: 'Si toglie dalla home, e i progressi restano dove sono',
    blocchi: [
      'Quindici giochi sono tanti per un bambino piccolo. Si possono spegnere quelli che non servono: la carta sparisce dalla home e il gioco non esiste più, per lui.',
      { titolo: 'Come si fa', passi: [
        'Impostazioni → scheda «Giochi e domande» → il primo blocco, «In casa».',
        'La **✎** accanto al gioco: «Non ce l\'ha», «Come dice l\'età», «Ce l\'ha». Si conferma.',
      ] },
      { titolo: 'Se l\'età sbaglia', righe: [
        'Alcuni giochi arrivano più avanti, altri il bambino li ha già passati: lo dice la riga. Con «Ce l\'ha» lo tieni in home lo stesso — serve quando il piccolo gioca col fratello grande.',
      ] },
      { titolo: 'Cosa succede ai progressi', righe: [
        'Niente: restano dove sono. Riaccendendo il gioco si riparte da dov\'era.',
        'La scelta è **per bambino**: fratelli diversi vedono home diverse.',
      ] },
      'C\'è anche un interruttore per i «giochi in prova»: sono quelli non ancora finiti, spenti di partenza.',
    ],
  },

  {
    id: 'bambini',
    emoji: '👧🧒',
    titolo: 'Se giocano in due (o in tre)',
    sommario: 'Ogni bambino ha monete, progressi ed età tutti suoi',
    blocchi: [
      'Sullo stesso telefono possono giocare più fratelli, e non si pestano i piedi: monete, animali, traguardi, età e perfino **quali giochi si vedono** sono separati. Quello che uno impara non conta per l\'altro, e le domande le pesca ognuno sulla sua misura.',
      { titolo: 'Aggiungerne uno', passi: [
        'Impostazioni → scheda «Bambini» → «Aggiungi un giocatore».',
        'Il nome, e in che classe è: da lì il gioco decide cosa fargli vedere.',
      ] },
      { titolo: 'Passare dall\'uno all\'altro', righe: [
        'In cima alla home compare una **fila coi nomi**: si tocca il proprio e si gioca. Con un bambino solo la fila non c\'è, perché non c\'è niente da scegliere.',
        'Il gioco riapre sempre sull\'ultimo che ha giocato: chi si siede deve ricordarsi di toccare il proprio nome.',
      ] },
      { titolo: 'Le cose che restano di casa', righe: [
        'Il **codice dei genitori** è uno solo per tutti.',
        'Il **salvataggio** li porta via tutti insieme, in un file solo.',
        'Cancellare un bambino cancella i suoi progressi, ma per un po\' ne resta una copia da rimettere.',
      ] },
    ],
  },

  {
    id: 'monete',
    emoji: '🪙',
    titolo: 'A cosa servono le monete',
    sommario: 'Si guadagnano studiando e si spendono nella fattoria',
    blocchi: [
      'Ogni risposta giusta, ogni tappa vinta, dà monete. Le monete non servono a niente dentro gli esercizi: servono **fuori**, nella fattoria, dove si comprano terra, animali e cose da mettere.',
      'È fatto apposta così. La fattoria è il posto dove si spende, gli altri giochi sono il posto dove si guadagna: chi vuole la mucca deve passare dalle tabelline.',
      { titolo: 'Se sembra che non arrivino mai', righe: [
        'Vuol dire che le domande sono troppo difficili: si sbaglia, e chi sbaglia non guadagna. Prima di alzare i premi, guarda la difficoltà.',
      ] },
      { titolo: 'Quanto vale una moneta', chiuso: true, testo: [
        'Una moneta vale **una decina di secondi di esercizio**, ed è da lì che si ricavano tutti i prezzi: quello che costa cento monete costa un quarto d\'ora di lavoro. Non è un numero messo a occhio, e serve a una cosa sola — che una cosa cara si senta cara e una cosa piccola si compri in una sera.',
        'Le monete non si comprano con soldi veri, non si regalano e non si ricaricano aspettando. L\'unica strada è rispondere: se ce ne fosse un\'altra, il gioco si sgonfierebbe in un pomeriggio.',
      ] },
    ],
  },

  {
    id: 'progressi',
    emoji: '💾',
    titolo: 'Dove stanno i progressi',
    sommario: 'Dentro il telefono, e come portarli su un altro',
    subito: true,
    blocchi: [
      'Non c\'è nessun account, nessuna registrazione, e niente esce da qui: monete, animali, traguardi e risposte stanno **dentro questo telefono**. Il gioco funziona senza internet proprio per questo.',
      { titolo: 'Il rovescio della medaglia', righe: [
        'Se cancelli i dati del sito dal browser, spariscono.',
        'Se cambi telefono, non ti seguono da soli.',
      ] },
      { titolo: 'Il salvataggio', passi: [
        'Impostazioni → in fondo, «Salva su file».',
        'Tienilo dove tieni le foto, o mandalo a te stesso.',
        'Sul telefono nuovo: Impostazioni → «Rimetti da un file».',
      ] },
      { titolo: 'Se cancelli per sbaglio', righe: [
        'Prima di cancellare i progressi di un bambino, il gioco ne mette da parte una copia: la trovi in fondo a **Impostazioni → Progressi**, e ne tiene le ultime tre.',
        'Vale anche per un bambino eliminato: rimetterlo lo riporta anche nell\'elenco di chi gioca.',
        'Le copie stanno sullo stesso telefono: se lo perdi, perdi anche quelle. Il file salvato no.',
      ] },
      'Il file contiene i nomi dei bambini e cosa hanno giocato. È roba tua: non mandarlo in giro più di quanto serve.',
      { titolo: 'Cosa vedo io di tuo figlio: niente', chiuso: true, testo: [
        'Non c\'è un server dall\'altra parte, quindi non è una promessa di non guardare: **non c\'è proprio niente da guardare**. Nessuna statistica parte da qui, nessun nome, nessun risultato, nessun indirizzo. Il gioco non chiede permessi al telefono, non usa la fotocamera né la posizione, e l\'unica volta che tocca la rete è per vedere se c\'è una versione nuova di sé stesso.',
        'L\'unica cosa che esce di qui è quella che decidi tu di mandare: il modulo di segnalazione, che porta la versione del gioco e l\'ultimo inciampo — e se hai acceso i giudizi sulle domande, quelle che hai segnato. Si vedono prima di mandarle.',
      ] },
      { titolo: 'Dove stanno davvero', chiuso: true, testo: [
        'Nella memoria del browser di questo dispositivo (IndexedDB), sotto il nome del sito da cui il gioco è stato aperto. Vuol dire due cose che è meglio sapere prima: **il gioco installato dall\'icona e la stessa pagina aperta da un altro indirizzo non condividono niente**, e «cancella i dati del sito» dalle impostazioni del browser porta via tutto — è l\'unico gesto, fuori dal gioco, che lo può fare.',
        'Il tasto «Riscarica il gioco» dentro le impostazioni **non** è quello: butta via la copia della pagina e la riprende da internet, e i progressi non li tocca.',
      ] },
    ],
  },

  {
    id: 'guasti',
    emoji: '🩹',
    titolo: 'Se qualcosa non funziona',
    sommario: 'Cosa provare prima di scrivere, e cosa scrivere',
    blocchi: [
      { titolo: 'Nell\'ordine', passi: [
        'Chiudi il gioco e riaprilo: la maggior parte delle volte basta.',
        'Impostazioni → «Riscarica il gioco»: lo riscarica da internet e riparte pulito. Ci vuole la connessione, e **i progressi restano dove sono.**',
        'Se ancora non va, segnalalo: Impostazioni → «Dimmelo».',
      ] },
      { titolo: 'Il numero in fondo alla home', righe: [
        'È la versione. Serve a sapere se il telefono ha preso l\'aggiornamento: se due telefoni mostrano numeri diversi, uno dei due è indietro e basta riaprirlo.',
      ] },
      { titolo: 'Se hai dimenticato il codice', righe: [
        'Di partenza è **0000**. Se l\'hai cambiato e non te lo ricordi, sul tastierino c\'è **«Non ricordi il codice?»** — tutto scritto nella guida **«Il codice dei genitori»**. **I progressi non si toccano.**',
      ] },
      'Il tasto rosso «cancella tutto» è l\'unico che porta via i progressi, chiede conferma, e per un po\' ne resta comunque una copia da rimettere. Nessun altro li tocca.',
      { titolo: 'Cosa mi serve sapere per aggiustarlo', chiuso: true, righe: [
        'Cosa stavi facendo: quale gioco, e cosa hai toccato per ultimo.',
        'Cosa ti aspettavi che succedesse, e cosa è successo invece. «Non funziona» è la cosa più difficile da aggiustare che esista.',
        'La versione e l\'errore, che nel modulo aperto dalle impostazioni sono **già dentro**: sono i due dati che nessuno saprebbe scrivere a mano, ed è il motivo per cui quella è la strada buona.',
        'Se riguarda una domanda sbagliata o fuori misura, accendi i giudizi (Impostazioni → «Giudicare le domande»): i tastini 😴 😰 🐛 si annotano da soli il modulo, il grado e com\'è andata.',
      ] },
    ],
  },

  {
    id: 'chi',
    emoji: '👋',
    titolo: 'Chi l\'ha fatto',
    sommario: 'E dov\'è il codice, per chi lo vuole guardare',
    subito: true,
    blocchi: [
      'L\'ho scritto io, ' + CHI + ', per i miei due figli. Non è il prodotto di nessuno e non c\'è un\'azienda dietro: è un progetto di casa, regalato così com\'è.',
      { titolo: 'Cosa ci guadagno', testo:
        'Niente, e non è modestia: non c\'è pubblicità, non c\'è niente da comprare, non raccolgo dati e non ho nessun modo di sapere chi ci gioca — non esiste un server a cui potrebbe arrivare qualcosa. Se serve a un altro bambino, tanto meglio: è il motivo per cui è in giro.' },
      { titolo: 'Il codice è aperto', collegamenti: [
        { url: CODICE, testo: 'Il codice su GitHub',
          sotto: 'Tutto quello che c\'è dentro, com\'è fatto e perché. Licenza MIT: si scarica, si modifica, si ridà via.' },
        { url: AUTORE, testo: 'Marco Sporchia su LinkedIn',
          sotto: 'Per un\'idea, una domanda, o del lavoro.' },
      ] },
      { titolo: 'Dirmi che qualcosa non va', testo:
        'Dentro il gioco c\'è la strada buona — Impostazioni → «Dimmelo» — perché quel modulo parte già con la versione e l\'ultimo inciampo dentro. Da fuori è lo stesso modulo, e non chiede di registrarsi da nessuna parte.',
        collegamenti: [
          { url: SEGNALA, testo: 'Il modulo per segnalare',
            sotto: 'Un livello impossibile, una parola sbagliata, un tasto che fa la cosa storta.' },
        ] },
      { titolo: 'Cosa vuol dire «licenza MIT»', chiuso: true, testo: [
        'Che si può prendere e farci quello che si vuole — scaricarlo, cambiarlo, metterlo su un proprio indirizzo, anche usarlo per lavoro — a due condizioni sole: lasciare il nome di chi l\'ha scritto, e non chiedere conto a me se qualcosa va storto.',
        'In pratica: se conosci qualcuno che lo vuole per la sua scuola o per i suoi figli, e vuole cambiarci le parole o i numeri, può farlo senza chiedere niente a nessuno.',
      ] },
      { titolo: 'Com\'è fatto', chiuso: true, testo: [
        'È **una pagina HTML sola**, con dentro tutto: codice, disegni, suoni e le voci registrate che pronunciano le parole inglesi e spagnole. Si può perfino scaricare il file e aprirlo con doppio click su un computer che non ha mai visto internet.',
        'Da questo vincolo — un file solo, offline — viene quasi ogni altra scelta: nessuna libreria pesante, suoni sintetizzati invece che registrati, la grafica disegnata a mano su una tela invece che con un motore di gioco. E siccome i giochi girano anche senza schermo, l\'equilibrio non è tarato a occhio: un simulatore gioca migliaia di partite e i numeri si riallineano da soli.',
        'L\'ho scritto con Claude Code, e sono partito da un\'idea precisa di cosa dovesse fare: le decisioni — le meccaniche, il modello di apprendimento, i vincoli — sono la parte che conta, e sono mie.',
      ] },
    ],
  },
]

/* ═══════════ UNO PER GIOCO, dietro il `?` della barra ═══════════
   La chiave è quella della schermata (`App.vue` / `giochi/schermate.js`),
   così chi monta la barra scrive `guida="torri"` e non deve inventarsi
   un altro nome. Manca un gioco? Il `?` non compare: chi non ha niente
   da spiegare non deve avere un tasto che apre una schermata vuota. */
export const AIUTI = {
  torri: {
    emoji: '🏹', titolo: 'La difesa del castello',
    blocchi: [
      'Dei nemici camminano lungo la strada. Se arrivano in fondo, il castello perde una vita.',
      { titolo: 'Come si gioca', righe: [
        'Tocca una **piazzola vuota** lungo la strada per costruirci una torre.',
        'Tocca una **torre già in piedi** per potenziarla.',
        'Per costruire e potenziare servono soldi, e i soldi si prendono **facendo i conti**.',
      ] },
      { titolo: 'Le cose che si capiscono tardi', righe: [
        'Le torri sparano solo a chi passa **vicino a loro**: metterle tutte insieme all\'inizio lascia scoperto il resto.',
        'Una torre potenziata vale più di due torri deboli.',
        'A metà scaletta una torre sceglie un mestiere: cambia **come** colpisce, non quanto. Nessuno dei due è quello sbagliato.',
        'Il campo non si ferma mentre fai i conti: i nemici camminano.',
      ] },
      { titolo: 'Cosa allena', righe: [
        'Le quattro operazioni **in colonna**, coi riporti e i prestiti, su numeri che crescono tappa dopo tappa.',
        'E la parte che non è matematica: decidere dove spendere quello che si ha, che è la cosa che il gioco chiede davvero.',
      ] },
    ],
  },

  castello: {
    emoji: '🏰', titolo: 'Il castello',
    blocchi: [
      'Ogni tappa è un assedio: i nemici arrivano da una parte, tu costruisci le torri lungo la strada.',
      { titolo: 'Come si gioca', righe: [
        'Tocca il campo dove vuoi costruire: si apre il foglio con le torri e i prezzi.',
        'I conti danno i soldi per costruire. Più ne fai, più torri metti.',
        'Le torri si potenziano toccandole.',
      ] },
      { titolo: 'Consigli', righe: [
        'Una torre sola tenuta forte regge più di quattro appena messe.',
        'Guarda da dove entrano: in certe tappe gli ingressi sono due.',
      ] },
      { titolo: 'Cosa allena', righe: [
        'Il calcolo in colonna, come il tower defense, ma dentro una mappa che si guarda dall\'alto.',
        'E il conto della spesa: quanto costa una torre nuova contro quanto costa alzare quella che c\'è.',
      ] },
    ],
  },

  fattoria: {
    emoji: '🚜', titolo: 'La fattoria',
    blocchi: [
      'Qui non si vince: è il posto dove si spendono le monete guadagnate negli altri giochi. Cresce piano, e resta com\'era lasciata.',
      { titolo: 'I due tocchi', righe: [
        '**Un tocco** apre o raccoglie.',
        '**Tenere il dito premuto** su una cosa già messa la prende, per spostarla.',
        '**Tenere premuto sul prato vuoto** apre il baule, senza andare fino al tasto in alto.',
      ] },
      { titolo: 'Le prime cose da fare', righe: [
        'Compra un pezzo di terra: la fattoria diventa più grande.',
        'Sgombra il bosco per fare posto.',
        'Semina un campo, e **torna più tardi** a raccoglierlo: ci mette qualche minuto vero.',
        'Niente marcisce mai: se ti dimentichi un campo, lo trovi lì.',
      ] },
      { titolo: 'Gli animali', righe: [
        'Si comprano dal baule e poi girano per il prato per conto loro.',
        'Hanno fame, voglia di giocare e di essere spazzolati: ogni gesto costa una monetina.',
        'Nessuno sta mai male davvero e **nessuno muore**: se il gioco resta chiuso una settimana, al ritorno hanno solo fame.',
        'Per metterne uno nel recinto lo si **prende e si posa** dentro, tenendo il dito premuto: da solo la staccionata non la passa.',
      ] },
      { titolo: 'Le cose nuove nel baule', righe: [
        'Non c\'è tutto dal primo giorno: il baule si riempie **spendendo**. Più monete si spendono qui, più sale il livello della fattoria e più roba arriva.',
        'Cosa arriva al livello dopo si legge nella pagina dei livelli — così si sa per cosa si sta risparmiando.',
      ] },
      { titolo: 'La catena', righe: [
        'Il raccolto non si mangia così com\'è: al **fienile** diventa mangime, e il mangime si dà ai recinti.',
        'Un recinto che ha fame lo dice da solo: sopra gli galleggia **proprio quello che aspetta**.',
        'Quello che ne torna — uova, latte, lana — finisce nella ciotola o addosso a un animale di casa.',
        'Se una cosa non si può fare, il foglio dice **cosa fare adesso** e porta il tasto per farlo.',
      ] },
      { titolo: 'Cosa allena', righe: [
        'Niente domande: qui non si studia, si **spende**. È il motivo per cui vale la pena esercitarsi negli altri giochi.',
        'Quello che chiede davvero è aspettare e fare un progetto: risparmiare per il pezzo di terra invece di comprare subito la cosa piccola.',
      ] },
    ],
  },

  mate: {
    emoji: '➕', titolo: 'I conti in colonna',
    blocchi: [
      { titolo: 'Si scrive una cifra alla volta', righe: [
        'Se il risultato della colonna è **12**, non si scrive «12»: si scrive **2** sotto la colonna, e l\'**1** è il riporto — nel gioco non si scrive da nessuna parte, si tiene a mente per la colonna accanto.',
        'Si parte sempre da destra.',
      ] },
      'Il gioco segue da sé: scritta una cifra, passa alla colonna dopo. E se si sbaglia, la riga sotto smette di ripetere la regola e **fa vedere il conto di quella colonna**, riporto compreso.',
      { titolo: 'Cosa allena', righe: [
        'Le tabelline e il calcolo a mente, e la procedura della colonna — quella che a scuola si chiama «l\'algoritmo».',
        'Le domande arrivano più spesso su quello che va male: chi sbaglia il 7×8 lo rivede presto, chi lo sa se lo ritrova di rado.',
      ] },
    ],
  },

  generale: {
    emoji: '🎖️', titolo: 'Il generale',
    blocchi: [
      'Tu non giochi: **dai gli ordini**, e poi guardi come va a finire. Se qualcosa non torna, si cambia il piano e si riprova.',
      { titolo: 'Come si gioca', righe: [
        'Metti in fila gli ordini, uno sotto l\'altro.',
        'Poi manda avanti e guarda: gli ordini vengono eseguiti in quell\'ordine.',
        'Se finisce male, non hai perso niente: cambia un ordine e rilancia.',
      ] },
      'Le prime prove insegnano una cosa per volta. Non c\'è fretta e non c\'è punteggio a tempo.',
      { titolo: 'Cosa allena', righe: [
        'Pensare per passi e prevedere le conseguenze: è programmare, senza chiamarlo così.',
        'E l\'idea che un errore si legge — «è andata storta qui» — invece di riprovare a caso.',
      ] },
    ],
  },

  sotterraneo: {
    emoji: '🗝️', titolo: 'Il sotterraneo',
    blocchi: [
      'Si scende di stanza in stanza cercando la chiave e la scala. Quasi tutto quello che c\'è dentro chiede una domanda.',
      { titolo: 'Cosa chiede cosa', righe: [
        '🚪 **una porta chiusa** — una domanda facile: se sbagli si riprova.',
        '🎁 **un forziere** — una domanda sola, tosta: se sbagli resta chiuso.',
        '⛲ **una fonte** — una domanda, e ti ridà vita.',
        '👹 **un mostro** — una domanda a colpo, finché uno dei due cade.',
        '📖🔮⏳🍷 **le curiosità** — un libro, una sfera, una clessidra, un calice: una domanda, e poi si vede cosa succede. Può andare bene o male, e spesso male vuol dire solo una risata.',
      ] },
      { titolo: 'Le armi', righe: [
        'Un\'arma migliore di quella che hai **te la metti da sola** appena la tocchi, e la riga che compare dice quanto ci guadagni: «⚔️ +2».',
        'Le armi leggere — spade corte, accette, pugnali — si portano **due alla volta**, una per mano; la mano debole colpisce la metà. Due leggere valgono una pesante.',
        'Quelle grosse (spadoni, asce, archi, bastoni) vogliono **tutte e due le mani**: nello zaino lo vedi dall\'ombra nella casella di sinistra.',
        'Un\'arma non fa più danno a ogni colpo: fa **cadere prima** chi hai davanti, e siccome il mostro ti graffia a ogni scambio, chi cade prima ti costa meno vita.',
      ] },
      { titolo: 'Le pozioni', righe: [
        'Si bevono dallo zaino, quando vuoi tu: la 🧪 boccetta ridà 6 punti, la pozione 10, la 🍷 ampolla 18. Non scadono e non si sprecano — bevute a vita piena, la parte che avanza è persa.',
        'Il mostro ti prende qualcosa **anche quando rispondi giusto** (un graffio, metà del colpo), e per questo le pozioni servono: senza, una discesa lunga finisce con uno svenimento.',
        'Le tasche sono sei. Quando sono piene, quello che trovi resta per terra: dal mercante puoi vendere a metà prezzo quello che non usi.',
        '🔦 **La torcia non si accende**: basta prenderla, e da lì in avanti vedi più lontano. Non occupa nemmeno una tasca.',
      ] },
      { titolo: 'Consigli', righe: [
        'Non serve aprire tutto: alla scala si arriva anche saltando qualcosa.',
        'Se la vita è quasi finita, la fonte vale più di un forziere.',
        'Le gemme si prendono camminandoci sopra: quello che luccica intorno a una cosa vuol dire che quella cosa si tocca.',
      ] },
      { titolo: 'Cosa allena', righe: [
        'Le domande sono di tutte le materie, tarate sull\'età del bambino: matematica, italiano, le lingue, quello che è acceso nelle impostazioni.',
        'In più c\'è da decidere dove andare con quello che si ha, che è la parte che nessun quiz da solo insegna.',
      ] },
    ],
  },

  dungeon: {
    emoji: '⚔️', titolo: 'Il dungeon',
    blocchi: [
      'Si scende in fondo al sotterraneo e si combatte rispondendo: ogni risposta giusta è un colpo dato, ogni sbaglio è un colpo preso.',
      { titolo: 'Consigli', righe: [
        'Dopo uno sbaglio il gioco si ferma un paio di secondi **apposta**: serve a leggere la risposta giusta, non è un tasto rotto.',
        'Le pozioni e i tesori raccolti restano per gli scontri dopo: non conviene tenerli da parte fino alla fine.',
      ] },
      { titolo: 'Cosa allena', righe: [
        'Le stesse domande del sotterraneo — tutte le materie, sulla misura del bambino — ma chieste una dietro l\'altra, senza mappa da guardare.',
        'È il gioco giusto per fare tanti esercizi in poco tempo.',
      ] },
    ],
  },

  corsa: {
    emoji: '🏁', titolo: 'La corsa dei numeri',
    blocchi: [
      'Si corre lungo una strada e ai cancelli si sceglie da che parte passare: la scelta si fa **col conto**, al volo.',
      { titolo: 'Consigli', righe: [
        'Sbagliare un cancello non toglie niente: si è perso solo il tempo di provarci.',
        'Ma il tempo conta: chi arriva agli scontri col fiato corto fa più fatica.',
      ] },
      { titolo: 'Cosa allena', righe: [
        'Il calcolo **rapido**: non i conti difficili, ma quelli facili fatti senza fermarsi a pensare.',
        'È l\'esercizio che rende automatico quello che si è già capito altrove.',
      ] },
    ],
  },

  codice: {
    emoji: '🔐', titolo: 'Il codice segreto',
    blocchi: [
      'Devi indovinare un codice nascosto. A ogni tentativo il gioco dice **quanti** ne hai azzeccati, non quali.',
      { titolo: 'Come si ragiona', righe: [
        'Un tentativo che sbaglia serve lo stesso: dice qualcosa.',
        'Cambia **una cosa per volta** e guarda se il conto sale o scende.',
      ] },
      'Alla fine di una partita si può rivedere la spiegazione: fa vedere il ragionamento passo per passo.',
      { titolo: 'Cosa allena', righe: [
        'Il ragionamento per esclusione: dedurre quello che non si vede da quello che si vede.',
        'Non c\'è niente da sapere a memoria — si può giocare senza saper leggere bene.',
      ] },
    ],
  },

  bancarella: {
    emoji: '🍎', titolo: 'Al mercato',
    blocchi: [
      'Un banco per volta, tre clienti a banco: si legge il cartellino, si conta quello che chiedono e si dà il resto giusto.',
      { titolo: 'La cosa da sapere', righe: [
        'I clienti **hanno una loro pazienza**: se ci si mette troppo si lamentano, e la giornata si può chiudere male.',
        'Tappa dopo tappa il tempo si stringe: è lì che il gioco diventa difficile, non nei numeri più grandi.',
      ] },
      { titolo: 'Cosa allena', righe: [
        'I soldi veri: euro e centesimi, comporre una cifra coi tagli che si hanno, e **il resto**.',
        'Contare avendo un po\' di fretta addosso — che è come si conta alla cassa vera.',
      ] },
    ],
  },

  pozioni: {
    emoji: '🧪', titolo: 'Le pozioni',
    blocchi: [
      'La ricetta è scritta in unità grandi (0,75 l), gli attrezzi del banco sono tarati in unità piccole (ml): convertire non è una domanda, è il modo di usare l\'attrezzo.',
      { titolo: 'I tre attrezzi', righe: [
        '🫗 **versa** — tieni premuto per riempire in fretta, poi la goccia fine.',
        '⚖️ **pesa** — metti i pesi sul piatto finché fanno la quantità.',
        '✂️ **taglia** — trascina la lama sul righello e taglia.',
      ] },
      'Si sbaglia col troppo: la boccia trabocca e la pozione fa BOOM. Non costa una vita, costa tempo.',
      { titolo: 'Cosa allena', righe: [
        'Le misure e le unità: litri e millilitri, chili e grammi, metri e centimetri — e passare dall\'una all\'altra.',
        'I decimali visti come quantità e non come numeri sulla carta: 0,75 l è tre quarti di boccia.',
      ] },
    ],
  },

  survivors: {
    emoji: '🏹', titolo: 'Survivors',
    blocchi: [
      'Si scappa dai mostri, e si spara da soli: il dito serve solo a **muoversi**.',
      { titolo: 'Come si gioca', righe: [
        'Trascina il dito sullo schermo per spostarti.',
        'I mostri arrivano da tutte le parti: stare fermi non conviene mai.',
        'Ogni tanto si sceglie un potenziamento. Prendere sempre lo stesso lo rende molto forte, prenderne di diversi copre più situazioni.',
      ] },
      { titolo: 'Cosa allena', righe: [
        'Riflessi e colpo d\'occhio, non materie di scuola: è uno dei giochi che si prendono come ricompensa.',
        'L\'unica scelta che ragiona è quella dei potenziamenti, e si impara perdendo.',
      ] },
    ],
  },

  conta: {
    emoji: '🔢', titolo: 'Conta gli animali',
    blocchi: [
      'Si conta quello che si vede e si tocca il numero giusto. Niente da leggere: la consegna in cima è tutta disegni.',
      'Non c\'è tempo che stringe e non si perde: se la risposta è sbagliata si conta insieme e si riprova la stessa domanda, finché non riesce.',
      { titolo: 'Cosa allena', righe: [
        'Contare, e riconoscere «quanti sono» senza contarli uno a uno.',
        'È il primo gioco che un bambino di quattro anni apre da solo.',
      ] },
    ],
  },

  prima: {
    emoji: '⏭️', titolo: 'Prima e dopo',
    blocchi: [
      'Ci sono dei disegni fuori ordine: raccontano una storia, e va rimessa in fila.',
      { titolo: 'Come si gioca', righe: [
        'Tocca i disegni **nell\'ordine in cui succedono**: prima quello che viene prima.',
        'Un tocco sbagliato lampeggia e basta: non si perde niente, si continua da lì.',
      ] },
      { titolo: 'Cosa allena', righe: [
        'Il tempo: prima, dopo, che cosa fa succedere che cosa.',
        'E raccontare — guardare quattro disegni e capire che sono una storia sola.',
      ] },
    ],
  },

  lingua: {
    emoji: '🗣️', titolo: 'Le parole',
    blocchi: [
      'Si impara una parola alla volta: prima la si sente, poi la si riconosce, poi la si scrive.',
      { titolo: 'Come si gioca', righe: [
        'Tocca **l\'altoparlante** per risentire la parola: si può quante volte si vuole.',
        'Una parola sbagliata non è persa: torna più avanti, e più spesso di quelle che vanno bene.',
      ] },
      { titolo: 'Cosa allena', righe: [
        'Vocaboli e frasi, con la pronuncia incisa da voci vere — non la voce del telefono.',
        'Le due lingue restano separate: quello che si impara in inglese non si mescola con lo spagnolo, e viceversa.',
      ] },
    ],
  },

  cameretta: {
    emoji: '🛏️', titolo: 'La cameretta',
    blocchi: [
      'Il posto degli animali: si comprano coi soldi guadagnati negli altri giochi, e poi hanno bisogno di qualcosa — mangiare, giocare, essere lavati.',
      { titolo: 'Cosa allena', righe: [
        'Niente: è la ricompensa, come la fattoria. Serve a dare un motivo per esercitarsi.',
        'Prendersene cura è l\'unica cosa che chiede, e non si può sbagliare.',
      ] },
    ],
  },
}

export const guida = id => GUIDE.find(g => g.id === id) || null
export const aiutoDi = chiave => AIUTI[chiave] || null
