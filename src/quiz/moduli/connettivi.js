/* ═══════════════════════════════════════════════════════════════════
   CONNETTIVI — le paroline che legano due frasi e dicono che rapporto
   c'è fra loro: perché, quindi, ma, quando, se, anche se…

   Non sono lessico da ricordare: sono LOGICA da leggere. La stessa
   coppia di fatti — «pioveva» e «ho preso l'ombrello» — sta in piedi
   con «perché» e con «quindi», e cade con «ma» (non c'è nessun
   contrasto) o con «quindi» messo dalla parte sbagliata (l'effetto non
   può causare la causa). I FALSI SONO GLI ERRORI VERI: la direzione
   girata di causa ed effetto, il contrasto inventato dove le due cose
   vanno d'accordo, l'ipotesi («se») su un fatto già successo.

   LE COPPIE SONO GENERATE da un elenco di situazioni quotidiane, con
   la relazione già dichiarata nel dato (`CAUSALI`, `CONTRASTI`,
   `CONDIZIONI`, `QUANDO`, `MENTRE`): la risposta giusta si ricava dalla
   relazione, non da una frase scritta a mano parola per parola.

   PERCHÉ LA CAUSA REGGE SEMPRE «QUINDI»/«QUANDO»/«SE» COME FALSI, E
   MAI «MA». In `CAUSALI` la causa è un tratto abituale (presente:
   «ha molta paura dei temporali») e l'effetto un fatto specifico e
   datato (passato con «ieri», «stamattina»…): con questo scarto di
   tempo «quando» e «se» stonano sempre (non è un'ipotesi, è già
   successo; non è un istante, è un modo di essere) e «quindi» capovolge
   la direzione. «Ma» invece resta per il contrasto (`CONTRASTI`), dove
   NON deve mai comparire insieme a «però»/«invece» fra le risposte di
   una stessa domanda: sono sinonimi, e messi insieme la domanda avrebbe
   due risposte giuste — sono i tre nomi della stessa relazione, mai
   tre risposte alternative.

   «PRIMA CHE» NON C'È. Vorrebbe il congiuntivo, che in questa casa
   nasce spento di default (`congiuntivo` in `data/saperi.js`,
   `difetto: false`): un connettivo che funziona solo con un modo
   verbale che la maggioranza dei bambini non ha ancora incontrato non
   insegnerebbe i connettivi, insegnerebbe il congiuntivo. «Prima di» e
   «dopo aver» restano fuori per lo stesso motivo dall'altro lato: senza
   verbi coniugati per ogni situazione la frase richiederebbe un
   infinito o un participio combinato a mano per ogni voce, ed è un
   lavoro diverso da quello che questo file fa (coppie di fatti intere,
   non pezzi di frase da incollare).

   IL SAPERE È «LESSICO», RIUSATO. Capire cosa dice una parolina è la
   stessa famiglia di capire cosa dice un modo di dire — non c'è una
   lezione di grammatica da aver fatto, c'è da sapere cosa vuol dire
   quella parola lì — e `lessico.js` dichiara già lo stesso `sa` per
   tutte le sue tipologie: chi lo spegne toglie il modulo intero, ed è
   la stessa scelta qui.
   ═══════════════════════════════════════════════════════════════════ */

import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo } from '../nucleo/domanda.js'

const maiuscola = s => s.charAt(0).toUpperCase() + s.slice(1)
const minuscola = s => s.charAt(0).toLowerCase() + s.slice(1)

/* ── CAUSALI: causa (un tratto abituale, al presente) → effetto (un
   fatto specifico e datato, al passato). Lo scarto di tempo è quello
   che rende sempre falsi «quando» e «se»: vedi il cappello del file. */
const CAUSALI = [
  { causa: 'ha molta paura dei temporali', effetto: 'Ieri sera si è nascosto sotto il letto', emoji: '⛈️' },
  { causa: 'è allergico ai gatti', effetto: 'Stamattina ha starnutito dieci volte', emoji: '🐱' },
  { causa: 'non sa ancora nuotare', effetto: 'Oggi è rimasto seduto sul bagnasciuga', emoji: '🏖️' },
  { causa: 'ha sempre una fame tremenda dopo la scuola', effetto: 'Oggi ha mangiato due merende', emoji: '🍞' },
  { causa: 'si stanca subito in salita', effetto: 'Ieri si è seduto a metà del sentiero', emoji: '⛰️' },
  { causa: 'non sopporta i rumori forti', effetto: "Stamattina si è tappato le orecchie ai fuochi d'artificio", emoji: '🎆' },
  { causa: 'ama disegnare gli animali', effetto: 'Oggi ha riempito tre pagine di elefanti', emoji: '🐘' },
  { causa: "dimentica sempre l'ombrello", effetto: 'Ieri è arrivato a casa fradicio', emoji: '☔' },
  { causa: 'ha il sonno leggerissimo', effetto: 'Stanotte si è svegliato al minimo rumore', emoji: '😴' },
  { causa: 'è molto goloso di cioccolato', effetto: 'Ieri ha finito tutta la tavoletta', emoji: '🍫' },
  { causa: 'ha paura del buio', effetto: 'Stanotte ha lasciato la luce accesa', emoji: '🌙' },
  { causa: 'è molto ordinato', effetto: 'Ieri sera ha rifatto il letto due volte', emoji: '🛏️' },
  { causa: "soffre il mal d'auto", effetto: 'Oggi ha aperto il finestrino durante il viaggio', emoji: '🚗' },
  { causa: 'adora osservare gli insetti', effetto: "Ieri ha passato un'ora a guardare le formiche", emoji: '🐜' },
  { causa: 'è molto timido con gli sconosciuti', effetto: 'Oggi si è nascosto dietro la mamma', emoji: '🙈' },
  { causa: 'ha una memoria di ferro', effetto: 'Ieri ha ricordato tutti i nomi dei compagni nuovi', emoji: '🧠' },
  { causa: 'si emoziona facilmente', effetto: 'Ieri ha pianto guardando il film', emoji: '🎬' },
  { causa: 'è molto curioso', effetto: 'Oggi ha fatto cento domande alla maestra', emoji: '❓' },
  { causa: 'ha le mani sempre fredde', effetto: 'Stamattina ha indossato i guanti anche in casa', emoji: '🧤' },
  { causa: 'è appassionato di dinosauri', effetto: 'Ieri ha chiesto tre libri sui dinosauri in biblioteca', emoji: '🦖' },
  { causa: 'ha una paura tremenda dei ragni', effetto: 'Ieri è scappato dalla cantina di corsa', emoji: '🕷️' },
  { causa: 'adora i cani più di ogni altro animale', effetto: 'Stamattina ha accarezzato ogni cane incontrato al parco', emoji: '🐶' },
  { causa: 'si annoia facilmente in macchina', effetto: 'Ieri ha fatto cento domande durante il viaggio', emoji: '🚗' },
  { causa: 'ha una passione per i pirati', effetto: "Ieri si è disegnato una benda sull'occhio", emoji: '🏴‍☠️' },
  { causa: 'è molto competitivo', effetto: 'Stamattina ha corso per arrivare primo in fila', emoji: '🏁' },
  { causa: 'ha paura degli aghi', effetto: 'Ieri ha pianto prima della vaccinazione', emoji: '💉' },
  { causa: 'adora le storie di fantasmi', effetto: 'Ieri sera ha chiesto tre racconti spaventosi', emoji: '👻' },
  { causa: 'è molto attento ai dettagli', effetto: 'Oggi ha notato un errore che nessun altro aveva visto', emoji: '🔍' },
  { causa: 'ha una grande passione per i treni', effetto: 'Ieri ha guardato passare cinque treni dal ponte', emoji: '🚂' },
  { causa: 'si sente male in barca', effetto: 'Ieri è rimasto pallido tutto il tragitto', emoji: '⛵' },
  { causa: 'ama collezionare francobolli', effetto: "Ieri ha passato un pomeriggio intero a ordinare l'album", emoji: '📮' },
  { causa: 'ha una memoria pessima per i nomi', effetto: 'Stamattina ha chiamato la nuova compagna con un altro nome', emoji: '🤦' },
  { causa: 'è molto geloso dei suoi giocattoli', effetto: 'Ieri ha nascosto la macchinina preferita sotto il letto', emoji: '🚙' },
  { causa: 'adora aiutare in cucina', effetto: 'Ieri ha impastato la pizza da solo', emoji: '🍕' },
  { causa: 'ha una paura folle dei clown', effetto: 'Ieri ha voluto lasciare la festa appena ne è arrivato uno', emoji: '🤡' },
  { causa: 'è molto testardo', effetto: 'Ieri non ha voluto cambiare idea nemmeno davanti alle prove', emoji: '😤' },
  { causa: 'ama guardare le stelle', effetto: 'Ieri sera è rimasto sveglio con il naso al telescopio', emoji: '🔭' },
  { causa: 'ha un debole per i dolci alla panna', effetto: 'Ieri ha scelto la torta più grande sul vassoio', emoji: '🍰' },
  { causa: 'è molto generoso con i compagni', effetto: 'Oggi ha diviso la sua merenda con tutta la fila', emoji: '🤝' },
  { causa: 'ha paura di volare', effetto: 'Ieri ha tenuto la mano della mamma per tutto il decollo', emoji: '✈️' },
  { causa: 'è appassionato di robot', effetto: 'Ieri ha costruito un robot con gli scatoloni', emoji: '🤖' },
  { causa: 'si commuove facilmente con la musica', effetto: 'Ieri ha avuto gli occhi lucidi durante il concerto', emoji: '🎻' },
  { causa: 'adora le formiche e gli insetti che scavano', effetto: 'Ieri ha scavato un formicaio finto in giardino', emoji: '🐜' },
  { causa: 'è molto paziente con i fratelli piccoli', effetto: 'Ieri ha ripetuto lo stesso gioco dieci volte di fila', emoji: '👶' },
  { causa: 'ha una passione per i vulcani', effetto: 'Ieri ha costruito un vulcano con il bicarbonato', emoji: '🌋' },
  { causa: 'è molto goloso di frutta', effetto: 'Ieri ha finito tutta la fruttiera in un pomeriggio', emoji: '🍓' },
  { causa: 'ha paura dei cani grandi', effetto: 'Ieri ha attraversato la strada per evitarne uno', emoji: '🐕‍🦺' },
  { causa: 'è molto curioso di come funzionano le cose', effetto: 'Ieri ha smontato la sveglia per guardare dentro', emoji: '⏰' },
  { causa: 'ama travestirsi da supereroe', effetto: 'Ieri è andato a fare la spesa vestito da supereroe', emoji: '🦸' },
  { causa: 'ha una grande paura del dentista', effetto: 'Ieri si è nascosto in macchina prima della visita', emoji: '🦷' },
  { causa: 'è molto premuroso con gli animali feriti', effetto: "Ieri ha portato a casa un uccellino con l'ala rotta", emoji: '🐦' },
  { causa: 'adora le costruzioni con i mattoncini', effetto: 'Ieri ha costruito un castello alto come lui', emoji: '🧱' },
  { causa: 'è molto timido a parlare davanti alla classe', effetto: 'Ieri ha tremato per tutta la presentazione', emoji: '🎤' },
  { causa: 'ha un fiuto incredibile per i dolci nascosti', effetto: 'Ieri ha trovato i biscotti nascosti in cinque minuti', emoji: '🍪' },
  { causa: 'è molto pignolo con i colori', effetto: 'Ieri ha ricolorato il disegno tre volte prima di essere contento', emoji: '🎨' },
  { causa: 'ha paura dei fulmini', effetto: 'Ieri sera si è coperto le orecchie a ogni tuono', emoji: '⚡' },
  { causa: 'adora osservare le nuvole e trovarci forme', effetto: "Ieri ha passato un'ora sdraiato a guardare il cielo", emoji: '☁️' },
  { causa: 'è molto bravo a fare le imitazioni', effetto: 'Ieri ha fatto ridere tutta la classe imitando la maestra', emoji: '🎭' },
  { causa: 'ha una grande paura di perdersi', effetto: 'Ieri ha tenuto la mano della mamma per tutto il centro commerciale', emoji: '🏬' },
  { causa: 'è molto attaccato al suo peluche', effetto: 'Ieri ha voluto portarlo anche in piscina', emoji: '🧸' },
  { causa: 'adora i puzzle difficili', effetto: 'Ieri ne ha finito uno da mille pezzi', emoji: '🧩' },
  { causa: 'ha una passione per gli aquiloni', effetto: 'Ieri è rimasto al parco fino al tramonto per farlo volare', emoji: '🪁' },
  { causa: 'è molto sensibile al freddo', effetto: 'Stamattina ha voluto tre maglioni uno sopra l\'altro', emoji: '🧣' },
  { causa: 'adora raccogliere sassi e conchiglie', effetto: 'Ieri ha riportato a casa un intero secchiello di conchiglie', emoji: '🐚' },
  { causa: 'è molto orgoglioso dei suoi disegni', effetto: 'Ieri ha voluto attaccarne uno su ogni porta di casa', emoji: '🖼️' },
]
const FALSI_CAUSA = {
  quindi: 'quindi introduce quello che viene DOPO la causa: qui verrebbe prima',
  se: "«se» serve per un'ipotesi: questo invece è già successo davvero",
  'anche se': "«anche se» segnala un ostacolo: qui invece l'effetto è proprio quello che ci si aspetta dalla causa",
}
/* usati anche nella forma «causa, connettivo effetto» di `senso()` */
const FALSI_CAUSA_GIRATA = {
  'perché': "così sembra che l'effetto sia la causa: è al contrario",
  ma: "qui non c'è nessun contrasto: le due cose vanno perfettamente d'accordo",
  se: "con «se» sembra un'ipotesi, ma questo è già successo davvero",
}

/* ── CONTRASTI: cosa ci aspettavamo (atteso) → cosa succede davvero,
   contro quell'aspettativa (sorpresa). `spiegazioneAttesa` è la stessa
   aspettativa detta a parole, e serve a «cosa dice la parolina». */
const CONTRASTI = [
  { atteso: 'Luca era stanchissimo', sorpresa: 'Ha continuato a correre', spiegazioneAttesa: 'che si sarebbe fermato a riposare', emoji: '🏃' },
  { atteso: 'Il cane aveva molta fame', sorpresa: 'Non ha toccato la ciotola', spiegazioneAttesa: 'che avrebbe mangiato subito tutto', emoji: '🐕' },
  { atteso: 'Il cielo era pieno di nuvole nere', sorpresa: 'Non è caduta nemmeno una goccia', spiegazioneAttesa: 'che sarebbe arrivato un temporale', emoji: '⛈️' },
  { atteso: 'Aveva studiato pochissimo', sorpresa: 'Ha preso un voto ottimo', spiegazioneAttesa: 'che avrebbe preso un voto brutto', emoji: '📝' },
  { atteso: 'La torta sembrava bruciata', sorpresa: 'Era buonissima', spiegazioneAttesa: 'che avesse un sapore cattivo', emoji: '🎂' },
  { atteso: 'Era il giocatore più basso della squadra', sorpresa: 'Ha segnato più canestri di tutti', spiegazioneAttesa: 'che avrebbe segnato pochi canestri', emoji: '🏀' },
  { atteso: 'Pioveva a dirotto', sorpresa: 'I bambini sono usciti a giocare lo stesso', spiegazioneAttesa: 'che sarebbero rimasti in casa', emoji: '🌧️' },
  { atteso: 'Non aveva mai sciato prima', sorpresa: 'È arrivato primo alla fine della pista', spiegazioneAttesa: 'che sarebbe stato lentissimo', emoji: '⛷️' },
  { atteso: 'Il vaso era caduto a terra', sorpresa: 'Non si è rotto', spiegazioneAttesa: 'che si sarebbe rotto in mille pezzi', emoji: '🏺' },
  { atteso: "Era arrivato con mezz'ora di ritardo", sorpresa: 'Ha trovato ancora tutti ad aspettarlo', spiegazioneAttesa: 'che gli altri se ne sarebbero già andati', emoji: '⏰' },
  { atteso: "Il gatto odiava l'acqua", sorpresa: 'È saltato in piscina senza pensarci', spiegazioneAttesa: "che sarebbe scappato lontano dall'acqua", emoji: '🐱' },
  { atteso: 'Era buio pesto in giardino', sorpresa: 'Ha trovato subito le chiavi cadute', spiegazioneAttesa: 'che avrebbe faticato a trovarle', emoji: '🔑' },
  { atteso: 'Non conosceva nessuno alla festa', sorpresa: 'Dopo un\'ora aveva già dieci nuovi amici', spiegazioneAttesa: 'che sarebbe rimasto in un angolo da solo', emoji: '🎉' },
  { atteso: 'Il ghiaccio sembrava sottilissimo', sorpresa: 'Ha retto benissimo il peso di tutti', spiegazioneAttesa: 'che si sarebbe rotto sotto il peso', emoji: '🧊' },
  { atteso: 'Aveva perso tutte le partite quella settimana', sorpresa: 'Ha vinto il torneo il sabato dopo', spiegazioneAttesa: 'che avrebbe perso anche quella volta', emoji: '🏆' },
  { atteso: 'La strada era piena di buche', sorpresa: 'Siamo arrivati senza il minimo problema', spiegazioneAttesa: 'che avremmo avuto qualche guaio', emoji: '🚗' },
  { atteso: 'Il pacco sembrava piccolissimo', sorpresa: "Dentro c'era una bicicletta intera", spiegazioneAttesa: 'che dentro ci fosse qualcosa di piccolo', emoji: '📦' },
  { atteso: "Era il compito più difficile dell'anno", sorpresa: 'Lo ha finito in dieci minuti', spiegazioneAttesa: 'che ci avrebbe messo molto tempo', emoji: '📚' },
  { atteso: 'Il nuovo compagno sembrava scontroso', sorpresa: 'È stato gentilissimo con tutti', spiegazioneAttesa: 'che sarebbe stato antipatico', emoji: '🙂' },
  { atteso: 'La ricetta sembrava complicatissima', sorpresa: "L'abbiamo preparata in dieci minuti", spiegazioneAttesa: 'che ci avremmo messo molto tempo', emoji: '🍳' },
  { atteso: 'Il cielo era sereno tutto il giorno', sorpresa: 'È arrivato un temporale improvviso alla sera', spiegazioneAttesa: 'che sarebbe rimasto sereno anche di notte', emoji: '🌦️' },
  { atteso: 'Aveva vinto tutte le gare quella stagione', sorpresa: 'È arrivato ultimo nella finale', spiegazioneAttesa: 'che avrebbe vinto anche quella volta', emoji: '🥉' },
  { atteso: 'Il computer sembrava rotto per sempre', sorpresa: 'Si è riacceso al primo tentativo', spiegazioneAttesa: 'che sarebbe stato da buttare', emoji: '💻' },
  { atteso: 'La pianta era secca da settimane', sorpresa: 'È rifiorita in due giorni', spiegazioneAttesa: 'che non sarebbe più cresciuta', emoji: '🌱' },
  { atteso: 'Il pubblico era silenzioso e freddo', sorpresa: 'Alla fine ha applaudito per cinque minuti', spiegazioneAttesa: 'che non avrebbe applaudito affatto', emoji: '👏' },
  { atteso: 'Il nonno diceva di non saper usare il telefono', sorpresa: 'Ha imparato a fare le videochiamate in un giorno', spiegazioneAttesa: 'che ci avrebbe messo molto più tempo', emoji: '📱' },
  { atteso: 'La torre di cubi sembrava troppo alta per stare in piedi', sorpresa: 'È rimasta in piedi tutta la notte', spiegazioneAttesa: 'che sarebbe caduta subito', emoji: '🧱' },
  { atteso: 'Il cane non aveva mai obbedito a un comando', sorpresa: 'Si è seduto al primo tentativo', spiegazioneAttesa: 'che non avrebbe ascoltato', emoji: '🐕' },
  { atteso: 'Era il compleanno più piovoso di sempre', sorpresa: 'Tutti si sono divertiti lo stesso in casa', spiegazioneAttesa: 'che la festa sarebbe stata rovinata', emoji: '🎂' },
  { atteso: 'La valigia sembrava troppo piccola per tutto quel bagaglio', sorpresa: 'Ci è entrato tutto perfettamente', spiegazioneAttesa: 'che non ci sarebbe entrato tutto', emoji: '🧳' },
  { atteso: 'Il vulcano di cartapesta sembrava fragile', sorpresa: 'Ha retto tre eruzioni di bicarbonato', spiegazioneAttesa: 'che si sarebbe rotto alla prima prova', emoji: '🌋' },
  { atteso: 'La squadra avversaria era molto più alta', sorpresa: 'Abbiamo vinto noi la partita', spiegazioneAttesa: 'che avrebbe vinto la squadra più alta', emoji: '🏐' },
  { atteso: 'Il violino era stonato da mesi', sorpresa: 'Ha suonato perfettamente al concerto', spiegazioneAttesa: 'che avrebbe suonato stonato', emoji: '🎻' },
  { atteso: 'Il sentiero era segnato come pericoloso', sorpresa: 'Siamo arrivati in cima senza il minimo problema', spiegazioneAttesa: 'che avremmo trovato qualche difficoltà', emoji: '🥾' },
  { atteso: 'Il gattino era il più piccolo della cucciolata', sorpresa: 'È diventato il gatto più grande di tutti', spiegazioneAttesa: 'che sarebbe rimasto piccolo', emoji: '🐈' },
  { atteso: 'La torta era rimasta in frigo tre giorni', sorpresa: 'Era ancora buonissima', spiegazioneAttesa: 'che sarebbe stata da buttare', emoji: '🍰' },
  { atteso: 'Il vecchio robottino non si accendeva più da un anno', sorpresa: 'Ha funzionato appena cambiate le pile', spiegazioneAttesa: 'che fosse rotto per sempre', emoji: '🤖' },
  { atteso: "Nessuno in classe sapeva risolvere quell'indovinello", sorpresa: "Il più piccolo della classe l'ha risolto in un minuto", spiegazioneAttesa: 'che nessuno ci sarebbe riuscito', emoji: '🧩' },
  { atteso: 'Il tempo sembrava perfetto per il picnic', sorpresa: 'Un vento fortissimo ha rovesciato tutto il cestino', spiegazioneAttesa: 'che il picnic sarebbe andato benissimo', emoji: '🧺' },
  { atteso: 'La chiave sembrava incastrata per sempre nella serratura', sorpresa: 'È uscita con un piccolo colpetto', spiegazioneAttesa: 'che avremmo dovuto chiamare un fabbro', emoji: '🔑' },
]
const FALSI_CONTRASTO = {
  'perché': "qui non c'è nessun motivo da spiegare: le due cose non si spiegano a vicenda",
  quindi: 'con «quindi» sembra che la seconda cosa venga proprio da questa: qui invece è il contrario',
  se: "«se» serve per un'ipotesi: questo invece è già successo davvero",
}

/* ── CONDIZIONI: un'ipotesi vera — non ancora decisa — e quello che
   succederebbe. Sempre al futuro o su un esito ancora sconosciuto:
   è quello che rende «se» l'unica scelta onesta, e «quando» (che dà
   per certo l'esito) sempre un po' troppo sicuro di sé. */
const CONDIZIONI = [
  { condizione: 'domani non piove', conseguenza: 'Andremo al parco', emoji: '🌳' },
  { condizione: 'la squadra vince la partita', conseguenza: 'Festeggeremo con una pizza', emoji: '⚽' },
  { condizione: 'trovo il tempo stasera', conseguenza: 'Ti aiuterò con i compiti', emoji: '📖' },
  { condizione: 'il pullman arriva in orario', conseguenza: 'Non perderemo la lezione di nuoto', emoji: '🚌' },
  { condizione: 'riesci a finire il livello', conseguenza: 'Sbloccherai un nuovo personaggio', emoji: '🎮' },
  { condizione: 'nevica abbastanza', conseguenza: 'Potremo fare la slitta', emoji: '⛄' },
  { condizione: 'i biglietti non sono già finiti', conseguenza: 'Andremo al cinema sabato', emoji: '🎬' },
  { condizione: 'il veterinario ci dà il permesso', conseguenza: 'Lo rimetteremo nella vasca grande', emoji: '🐠' },
  { condizione: 'vinco alla lotteria della scuola', conseguenza: 'Comprerò un gelato per tutti', emoji: '🍦' },
  { condizione: 'il campo non è troppo bagnato', conseguenza: 'Usciremo a giocare a pallone', emoji: '⚽' },
  { condizione: 'trovi le chiavi', conseguenza: 'Potremo entrare in casa', emoji: '🔑' },
  { condizione: 'il gufo esce dal nascondiglio', conseguenza: 'Riusciremo a fotografarlo', emoji: '🦉' },
  { condizione: 'finiamo presto la cena', conseguenza: 'Avremo tempo per un gioco', emoji: '🍽️' },
  { condizione: 'riusciamo a evitare il traffico', conseguenza: 'Arriveremo in tempo per il film', emoji: '🚗' },
  { condizione: "superi l'esame di nuoto", conseguenza: 'Potrai fare la gara vera', emoji: '🏊' },
  { condizione: 'restano ancora posti liberi', conseguenza: 'Ci iscriveremo anche noi', emoji: '📋' },
  { condizione: 'riesco a indovinare il numero pensato', conseguenza: 'Vincerai tu il prossimo giro', emoji: '🔢' },
  { condizione: 'il negozio ha ancora la taglia giusta', conseguenza: 'Compreremo le scarpe nuove oggi', emoji: '👟' },
  { condizione: 'riusciamo a prenotare in tempo', conseguenza: 'Andremo al ristorante preferito sabato', emoji: '🍽️' },
  { condizione: 'riesci a fare centro al primo tiro', conseguenza: 'Vincerai il peluche del tiro a segno', emoji: '🎯' },
  { condizione: 'il coniglio esce dalla tana prima di sera', conseguenza: 'Riusciremo a vederlo mangiare', emoji: '🐰' },
  { condizione: 'l\'aquilone prende il vento giusto', conseguenza: 'Volerà più in alto degli altri', emoji: '🪁' },
  { condizione: 'il maestro ci dà il permesso', conseguenza: 'Faremo la gita in bicicletta', emoji: '🚲' },
  { condizione: 'riesco a raccogliere abbastanza punti', conseguenza: 'Sblocco il livello segreto', emoji: '🎮' },
  { condizione: 'l\'aereo di carta plana bene', conseguenza: 'Vincerai la gara di carta', emoji: '✈️' },
  { condizione: 'la giuria ci sceglie', conseguenza: 'Reciteremo sul palco grande', emoji: '🎭' },
  { condizione: 'il portiere para il rigore decisivo', conseguenza: 'La nostra squadra vincerà la coppa', emoji: '🏆' },
  { condizione: 'riesci a stare in equilibrio sul monopattino', conseguenza: 'Potrai partecipare alla gara', emoji: '🛴' },
  { condizione: 'il gelato non si squaglia prima di arrivare a casa', conseguenza: 'Lo mangeremo tutti insieme', emoji: '🍦' },
  { condizione: "l'uovo di Pasqua contiene la sorpresa che aspetti", conseguenza: 'Lo scambierai con quello di tuo cugino', emoji: '🥚' },
  { condizione: 'riusciamo a costruire la tenda prima del buio', conseguenza: 'Dormiremo sotto le stelle', emoji: '⛺' },
  { condizione: 'il messaggio arriva prima di mezzanotte', conseguenza: 'Sapremo subito il risultato', emoji: '✉️' },
  { condizione: 'la torre di carte non crolla al primo piano', conseguenza: 'Continueremo a costruire fino al quinto', emoji: '🃏' },
  { condizione: "il pesce abbocca entro un'ora", conseguenza: 'Torneremo a casa con qualcosa da cucinare', emoji: '🎣' },
  { condizione: 'riusciamo a raccogliere abbastanza firme', conseguenza: 'Organizzeremo la festa di classe', emoji: '✍️' },
  { condizione: 'il mago indovina la carta scelta', conseguenza: 'Gli applaudiremo per cinque minuti', emoji: '🎩' },
  { condizione: 'arriviamo prima che chiuda la biglietteria', conseguenza: 'Vedremo lo spettacolo delle sette', emoji: '🎫' },
  { condizione: 'il robot capisce il comando vocale', conseguenza: 'Si muoverà da solo verso la porta', emoji: '🤖' },
  { condizione: 'il vento gonfia bene la vela', conseguenza: 'Arriveremo al molo prima degli altri', emoji: '⛵' },
  { condizione: 'riesci a pescare la carta fortunata', conseguenza: 'Sarai tu a scegliere il gioco dopo', emoji: '🃏' },
  { condizione: 'il panda allo zoo si sveglia mentre siamo lì', conseguenza: 'Lo vedremo giocare con il bambù', emoji: '🐼' },
  { condizione: 'riusciamo a finire il puzzle prima di cena', conseguenza: 'Lo incorniceremo sul muro', emoji: '🧩' },
  { condizione: "il costume ti sta ancora bene quest'anno", conseguenza: 'Lo useremo di nuovo per Carnevale', emoji: '🎭' },
  { condizione: 'il postino porta il pacco entro venerdì', conseguenza: 'Lo apriremo prima del weekend', emoji: '📦' },
  { condizione: 'riusciamo a convincere la maestra', conseguenza: 'Faremo la lezione in giardino oggi', emoji: '🌳' },
  { condizione: 'riesco a memorizzare la poesia per intero', conseguenza: 'La reciterò senza guardare il foglio', emoji: '📜' },
  { condizione: 'il criceto trova la strada del labirinto', conseguenza: 'Riceverà il pezzo di formaggio', emoji: '🐹' },
  { condizione: "il vulcano di bicarbonato fa un'eruzione bella grande", conseguenza: 'Lo rifaremo per mostrarlo ai compagni', emoji: '🌋' },
  { condizione: 'il numero della tombola è quello giusto', conseguenza: 'Griderai «tombola!» per primo', emoji: '🎉' },
  { condizione: 'riusciamo a evitare le pozzanghere', conseguenza: 'Arriveremo a scuola con le scarpe asciutte', emoji: '💧' },
  { condizione: 'il vigile ci fa attraversare subito', conseguenza: 'Prenderemo il pullman delle otto', emoji: '🚸' },
  { condizione: 'la squadra segna nel primo tempo', conseguenza: 'Il pubblico esploderà di gioia', emoji: '🥅' },
  { condizione: 'il fioraio ha ancora rose rosse', conseguenza: 'Le porteremo alla nonna oggi', emoji: '🌹' },
  { condizione: 'riesci a saltare più in alto del record della classe', conseguenza: 'Il tuo nome finirà sul cartellone', emoji: '📈' },
  { condizione: 'il traghetto parte nonostante il vento', conseguenza: "Arriveremo sull'isola per pranzo", emoji: '⛴️' },
  { condizione: 'il dentista dice che il dentino è pronto', conseguenza: 'Ti darà il permesso di toglierlo', emoji: '🦷' },
  { condizione: 'la nonna trova la ricetta segreta', conseguenza: 'Ci cucinerà la torta di una volta', emoji: '📖' },
  { condizione: 'riusciamo a raccogliere tutte le tessere mancanti', conseguenza: 'Completeremo la collezione', emoji: '🃏' },
  { condizione: "il tuo aquilone non si impiglia nell'albero", conseguenza: 'Lo faremo volare ancora domani', emoji: '🪁' },
  { condizione: 'la classe raccoglie abbastanza soldi', conseguenza: 'Adotteremo un animale dello zoo', emoji: '🐘' },
  { condizione: 'riesci a finire la maratona di lettura', conseguenza: 'Riceverai il diploma di lettore', emoji: '📚' },
  { condizione: 'il forno del panettiere si accende in tempo', conseguenza: 'Il pane sarà pronto per colazione', emoji: '🍞' },
  { condizione: 'riusciamo a prenotare due posti vicini', conseguenza: "Guarderemo il film uno accanto all'altro", emoji: '🎬' },
  { condizione: 'il chiosco ha ancora il gusto che vuoi', conseguenza: 'Prenderemo il gelato prima di tornare a casa', emoji: '🍨' },
  { condizione: 'riesci a risolvere l\'enigma del castello', conseguenza: 'Passerai alla stanza segreta del gioco', emoji: '🏰' },
  { condizione: 'il pallone aerostatico si gonfia bene', conseguenza: 'Potremo salire a bordo per il volo di prova', emoji: '🎈' },
]
const FALSI_CONDIZIONE = {
  quando: '«quando» dà per certo che succederà; qui invece non si sa ancora',
  'perché': "«perché» spiega un motivo già certo; qui invece non sappiamo se succederà",
  quindi: 'con «quindi» sembra che questo causi quello che sta scritto dopo: qui è al contrario',
}

/* ── QUANDO: uno sfondo che dura (all'imperfetto) e un fatto puntuale
   che ci arriva sopra (al passato). Le due cose non hanno NESSUN
   legame causale — è pura coincidenza di tempo — così «perché»,
   «quindi» e «se» restano falsi senza bisogno di altro. */
const QUANDO = [
  { sfondo: 'Stavo facendo la doccia', evento: 'È suonato il telefono', emoji: '🚿' },
  { sfondo: 'Stavamo guardando un film', evento: 'È saltata la luce', emoji: '🎬' },
  { sfondo: 'Il bambino dormiva', evento: 'È arrivato un temporale', emoji: '⛈️' },
  { sfondo: 'Stavamo facendo merenda', evento: 'È arrivata la zia in visita', emoji: '🍪' },
  { sfondo: 'Il gatto dormiva sul divano', evento: 'È entrato il postino', emoji: '🐱' },
  { sfondo: 'Stavo leggendo un fumetto', evento: 'Si è spenta la luce', emoji: '📖' },
  { sfondo: 'I bambini facevano merenda', evento: "È arrivato l'autobus", emoji: '🚌' },
  { sfondo: 'Stavamo giocando a carte', evento: 'È scoppiato un temporale', emoji: '🌩️' },
  { sfondo: 'La torta cuoceva nel forno', evento: 'È squillato il campanello', emoji: '🎂' },
  { sfondo: 'Stavo facendo i compiti', evento: 'Si è rotta la matita', emoji: '✏️' },
  { sfondo: 'Il cane dormiva vicino al camino', evento: 'È entrato un topolino in cucina', emoji: '🐹' },
  { sfondo: "Stavamo aspettando l'autobus", evento: 'Ha cominciato a piovere', emoji: '🚏' },
  { sfondo: 'La mamma cucinava', evento: 'È esploso il popcorn nel microonde', emoji: '🍿' },
  { sfondo: 'Stavamo facendo un puzzle', evento: 'Si è addormentato il gatto sui pezzi', emoji: '🧩' },
  { sfondo: 'Stavo annodando le scarpe', evento: 'È partito lo sparo della gara', emoji: '👟' },
  { sfondo: 'Il nonno raccontava una storia', evento: 'Si è fulminata la lampadina', emoji: '💡' },
  { sfondo: 'Stavamo colorando un disegno', evento: 'È arrivato il postino con un pacco', emoji: '🎨' },
  { sfondo: 'Il criceto correva nella ruota', evento: 'È caduto un libro dallo scaffale', emoji: '🐹' },
  { sfondo: 'Stavo cercando le chiavi', evento: 'Ha squillato il citofono', emoji: '🔑' },
  { sfondo: 'I passeggeri salivano sul traghetto', evento: 'È cominciato a soffiare un vento fortissimo', emoji: '⛴️' },
  { sfondo: 'Stavamo montando la tenda', evento: 'È caduta la prima goccia di pioggia', emoji: '⛺' },
  { sfondo: 'La maestra spiegava la lezione', evento: "È entrata un'ape dalla finestra", emoji: '🐝' },
  { sfondo: 'Stavo disegnando sulla lavagna', evento: 'Si è rotto il gessetto', emoji: '🖊️' },
  { sfondo: 'I nonni facevano un pisolino', evento: 'È squillata la sveglia del forno', emoji: '😴' },
  { sfondo: 'Stavamo aspettando il nostro turno', evento: 'È scoppiato un applauso dalla sala', emoji: '👏' },
  { sfondo: 'Il pappagallo dormiva sul trespolo', evento: 'È suonato il campanello della porta', emoji: '🦜' },
  { sfondo: "Stavo mescolando l'impasto della torta", evento: 'Si è spento improvvisamente il forno', emoji: '🎂' },
  { sfondo: 'I bambini disegnavano sul marciapiede', evento: 'È passata una macchina della polizia con la sirena', emoji: '🚓' },
  { sfondo: 'Stavamo salendo le scale', evento: 'Si sono spente tutte le luci del palazzo', emoji: '🏢' },
  { sfondo: 'Il pesce nuotava tranquillo nella vasca', evento: "È caduta una foglia sull'acqua", emoji: '🐠' },
  { sfondo: 'Stavo leggendo sotto le coperte con la torcia', evento: 'È entrata la mamma nella stanza', emoji: '🔦' },
  { sfondo: 'I turisti fotografavano il monumento', evento: 'È volato via il cappello di un signore', emoji: '📸' },
  { sfondo: 'Stavamo facendo la fila per il gelato', evento: 'È arrivato un temporale a sorpresa', emoji: '🍦' },
  { sfondo: 'Il cane annusava un cespuglio', evento: 'È saltato fuori uno scoiattolo', emoji: '🐿️' },
]
/* ── MENTRE: due azioni che durano insieme (all'imperfetto), di due
   soggetti diversi e senza nessun legame causale. */
const MENTRE = [
  { azione1: 'La mamma cucinava', azione2: 'i bambini giocavano in giardino', emoji: '👩‍🍳' },
  { azione1: 'Il papà lavava la macchina', azione2: "il cane dormiva all'ombra", emoji: '🚗' },
  { azione1: 'I nonni facevano una passeggiata', azione2: 'noi guardavamo un cartone', emoji: '🚶' },
  { azione1: 'La maestra scriveva alla lavagna', azione2: 'gli alunni prendevano appunti', emoji: '📝' },
  { azione1: 'Il vento soffiava forte', azione2: 'le onde si alzavano sul mare', emoji: '🌊' },
  { azione1: 'Gli uccellini cantavano', azione2: 'il sole sorgeva piano piano', emoji: '🐦' },
  { azione1: 'Io facevo i compiti', azione2: 'mio fratello suonava il pianoforte', emoji: '🎹' },
  { azione1: 'Il fornaio impastava il pane', azione2: 'il forno si scaldava', emoji: '🍞' },
  { azione1: 'I pesci nuotavano nella vasca', azione2: 'i bambini li osservavano', emoji: '🐠' },
  { azione1: 'Il treno correva veloce', azione2: 'i passeggeri chiacchieravano', emoji: '🚆' },
  { azione1: 'La pioggia cadeva sul tetto', azione2: 'noi giocavamo a carte', emoji: '🌧️' },
  { azione1: 'Il cuoco tagliava le verdure', azione2: 'il sugo bolliva in pentola', emoji: '🍅' },
  { azione1: 'I bambini costruivano un castello di sabbia', azione2: 'i genitori prendevano il sole', emoji: '🏖️' },
  { azione1: 'Le foglie cadevano dagli alberi', azione2: 'i bambini le raccoglievano', emoji: '🍂' },
  { azione1: 'La nonna faceva la maglia', azione2: 'il nipotino colorava un disegno', emoji: '🧶' },
  { azione1: 'Il postino consegnava i pacchi', azione2: 'i cani del quartiere abbaiavano', emoji: '📦' },
  { azione1: 'Io suonavo il flauto', azione2: "mia sorella cantava in un'altra stanza", emoji: '🎵' },
  { azione1: 'Il sole tramontava dietro le montagne', azione2: 'i pescatori tiravano su le reti', emoji: '🌅' },
  { azione1: 'I bambini saltavano sul trampolino', azione2: 'i genitori chiacchieravano vicino al cancello', emoji: '🤸' },
  { azione1: 'Il fabbro batteva il ferro', azione2: "le scintille volavano nell'officina", emoji: '🔥' },
  { azione1: 'La maestra correggeva i quaderni', azione2: 'gli alunni facevano educazione fisica', emoji: '📓' },
  { azione1: 'Il vento muoveva le tende', azione2: 'le candele tremolavano piano', emoji: '🕯️' },
  { azione1: 'Il contadino mungeva le vacche', azione2: 'i galli cantavano nel pollaio', emoji: '🐄' },
  { azione1: 'Noi giocavamo a scacchi', azione2: 'la pioggia batteva sui vetri', emoji: '♟️' },
  { azione1: 'Il panettiere infornava il pane', azione2: 'i clienti facevano la fila fuori dal negozio', emoji: '🥖' },
  { azione1: "I delfini saltavano fuori dall'acqua", azione2: 'i turisti scattavano foto dalla barca', emoji: '🐬' },
  { azione1: 'Il nonno leggeva il giornale', azione2: 'il gatto dormiva sulle sue ginocchia', emoji: '🐱' },
  { azione1: 'Gli operai costruivano il ponte', azione2: 'le macchine aspettavano in coda', emoji: '🚧' },
  { azione1: 'Io facevo i compiti di matematica', azione2: 'papà riparava la bicicletta in garage', emoji: '🔧' },
  { azione1: 'Le rondini volavano basse sul prato', azione2: 'i bambini rincorrevano una farfalla', emoji: '🦋' },
  { azione1: 'Il cuoco decorava la torta', azione2: 'gli ospiti aspettavano seduti a tavola', emoji: '🎂' },
  { azione1: 'La maestra suonava il pianoforte', azione2: 'i bambini imparavano una canzone nuova', emoji: '🎹' },
  { azione1: 'Il fiume scorreva lento sotto il ponte', azione2: 'i ragazzi pescavano dalla riva', emoji: '🎣' },
  { azione1: 'I nonni giocavano a bocce nel parco', azione2: 'noi mangiavamo un gelato sulla panchina', emoji: '🍨' },
]
const FALSI_TEMPO = {
  'perché': "qui non c'è nessun motivo: le due cose capitano insieme per caso, non una per colpa dell'altra",
  quindi: "con «quindi» sembra che una causi l'altra: qui invece capitano solo insieme",
  se: "«se» serve per un'ipotesi: queste invece sono cose che succedono davvero",
}

/* ── MENTRE_SENSO: lo stesso «mentre» può dire due cose diverse, e qui
   non si sceglie una parola — si capisce quale delle due sta dicendo
   questa frase. Metà delle voci è temporale (due cose insieme), metà
   è di contrasto (due cose diverse, quasi opposte). */
const MENTRE_SENSO = [
  { frase: 'La mamma stirava mentre il bambino faceva i compiti.', senso: 'tempo' },
  { frase: 'I nonni giocavano a carte mentre i nipoti guardavano un cartone.', senso: 'tempo' },
  { frase: 'Il cuoco preparava la pasta mentre il camino scoppiettava.', senso: 'tempo' },
  { frase: 'Il postino suonava il campanello mentre il cane abbaiava furioso.', senso: 'tempo' },
  { frase: 'Le foglie cadevano mentre il vento soffiava forte.', senso: 'tempo' },
  { frase: 'Il pubblico applaudiva mentre gli attori uscivano dal palco.', senso: 'tempo' },
  { frase: 'Il treno partiva mentre correvo verso il binario.', senso: 'tempo' },
  { frase: 'La pioggia cadeva mentre aspettavamo sotto la pensilina.', senso: 'tempo' },
  { frase: 'Io adoro la verdura, mentre mio fratello non la mangia mai.', senso: 'contrasto' },
  { frase: 'La mia squadra ha vinto, mentre quella di Marco ha perso.', senso: 'contrasto' },
  { frase: 'A me piace il mare, mentre a mia sorella piace la montagna.', senso: 'contrasto' },
  { frase: 'Alcuni bambini erano già pronti, mentre altri dormivano ancora.', senso: 'contrasto' },
  { frase: 'Il gatto ama dormire tutto il giorno, mentre il cane vuole sempre giocare.', senso: 'contrasto' },
  { frase: "Un fratello è alto e magro, mentre l'altro è basso e robusto.", senso: 'contrasto' },
  { frase: 'La maglietta rossa costava poco, mentre quella blu costava il triplo.', senso: 'contrasto' },
  { frase: "Metà della classe ha scelto il disegno, mentre l'altra metà ha scelto la musica.", senso: 'contrasto' },
  { frase: 'Il fabbro batteva il ferro mentre le scintille volavano.', senso: 'tempo' },
  { frase: 'I nonni giocavano a bocce mentre noi mangiavamo un gelato.', senso: 'tempo' },
  { frase: 'Il vento muoveva le tende mentre le candele tremolavano.', senso: 'tempo' },
  { frase: 'Gli operai costruivano il ponte mentre le macchine aspettavano in coda.', senso: 'tempo' },
  { frase: 'Il fiume era calmo a monte, mentre a valle correva impetuoso.', senso: 'contrasto' },
  { frase: "Il primo capitolo era lentissimo, mentre l'ultimo si leggeva tutto d'un fiato.", senso: 'contrasto' },
  { frase: 'Da piccolo era timidissimo, mentre oggi non ha paura di nessuno.', senso: 'contrasto' },
  { frase: 'Il piatto sembrava piccolo, mentre in realtà saziava moltissimo.', senso: 'contrasto' },
]
const SENSO_MENTRE = {
  tempo: 'che due cose succedono nello stesso momento',
  contrasto: 'che due cose sono diverse, quasi il contrario',
}

/* Tre modi equivalenti di fare la stessa domanda: dicono la stessa
   cosa, e serve a non far ripetere sempre la stessa consegna sulle
   stesse poche frasi — la ripetizione stanca anche quando il
   contenuto non è finito. */
const TESTO_CAPISCI = [
  'Leggendo questa frase, cosa ci aspettavamo che succedesse?',
  'Prima di leggere «ma», cosa pensavamo sarebbe successo?',
  'Cosa ci saremmo aspettati, senza leggere la fine della frase?',
]
const TESTO_MENTRE_DOPPIO = [
  'Cosa dice «mentre» in questa frase?',
  'In questa frase, cosa vuol dire «mentre»?',
  'Leggi bene: cosa comunica «mentre» qui?',
]

/* ── che cosa si chiede a ogni grado ── */
const SCALETTA = [
  'perché: la causa',
  'ma, però, invece: il contrasto',
  'quindi, quando, mentre: la conseguenza e il tempo',
  'se: la condizione',
  'anche se, e il doppio senso di «mentre»',
]

const TIPI = [
  { chiave: 'conn:causa', nome: 'Perché: la causa', sa: 'lessico', gradi: { 1: 1, 2: 0.25 } },
  { chiave: 'conn:conseguenza', nome: 'Quindi e così: la conseguenza', sa: 'lessico', gradi: { 1: 0.3, 2: 0.35, 3: 0.2 } },
  { chiave: 'conn:contrasto', nome: 'Ma, però, invece: il contrasto', sa: 'lessico', gradi: { 2: 1, 3: 0.3 } },
  { chiave: 'conn:capisci', nome: 'Cosa dice la parolina', sa: 'lessico', gradi: { 2: 0.4, 3: 0.25 } },
  { chiave: 'conn:tempo', nome: 'Quando e mentre: il tempo', sa: 'lessico', gradi: { 3: 1 } },
  { chiave: 'conn:senso', nome: 'Quale frase ha senso', sa: 'lessico', gradi: { 2: 0.3, 3: 0.4, 4: 0.2 } },
  { chiave: 'conn:condizione', nome: 'Se: la condizione', sa: 'lessico', gradi: { 4: 1 } },
  { chiave: 'conn:concessione', nome: 'Anche se, contro se', livello: 81, sa: 'lessico', gradi: { 4: 0.25, 5: 1 } },
  { chiave: 'conn:mentre-doppio', nome: 'Il doppio senso di «mentre»', livello: 85, sa: 'lessico', gradi: { 5: 0.6 } },
]

class Connettivi extends Modulo {
  constructor() {
    super({
      id: 'connettivi',
      nome: 'Connettivi',
      icona: '🧵',
      materia: 'italiano',
      chiaro: 'capire il rapporto fra due frasi legate da una parolina come perché, ma o quando',
      scaletta: SCALETTA,
      /* QUANTO È COMPLICATO OGNI GRADO, da 0 a 100 — stessa scala di
         tutte le materie, 12,5 punti per anno. «Perché» e «ma» sono
         di prima-seconda, «quindi/quando/mentre» di terza, «se» di
         quarta, «anche se» e il doppio senso di «mentre» di quarta
         inoltrata e quinta. */
      livelli: [31, 38, 50, 69, 81],
      tipi: TIPI,
    })
  }

  genera(grado, sorte, tipo) {
    switch (tipo) {
      case 'conn:conseguenza': return this.conseguenza(sorte)
      case 'conn:contrasto': return this.contrasto(sorte)
      case 'conn:capisci': return this.capisci(sorte)
      case 'conn:tempo': return this.tempo(sorte)
      case 'conn:senso': return this.senso(sorte)
      case 'conn:condizione': return this.condizione(sorte)
      case 'conn:concessione': return this.concessione(sorte)
      case 'conn:mentre-doppio': return this.mentreDoppio(sorte)
      default: return this.causa(sorte)
    }
  }

  /* grado 1 — «perché»: la parolina che manca, causa ed effetto */
  causa(sorte) {
    const c = sorte.uno(CAUSALI)
    const falsi = sorte.alcuni(Object.keys(FALSI_CAUSA), 2)
    return domanda({
      testo: `${c.effetto} ___ ${c.causa}.`,
      soggetto: { emoji: c.emoji },
      buona: testo('perché'),
      falsi: falsi.map(f => testo(f, FALSI_CAUSA[f])),
      chiave: 'conn:causa',
      aiuto: '«perché» introduce il motivo: quello che spiega come è nato l\'effetto',
      sorte,
    })
  }

  /* grado 1-3 — «quindi»/«così»: la stessa coppia, ma detta al
     contrario — prima la causa, poi quello che ne viene */
  conseguenza(sorte) {
    const c = sorte.uno(CAUSALI)
    const buona = sorte.uno(['quindi', 'così'])
    const falsi = sorte.alcuni(['perché', 'anche se', 'quando'], 2)
    const perche = { 'perché': FALSI_CAUSA_GIRATA['perché'], 'anche se': "«anche se» segnala un ostacolo, e qui non ce n'è nessuno", quando: '«quando» dà per certo un momento preciso; qui invece è solo un modo di essere' }
    return domanda({
      testo: `${maiuscola(c.causa)}, ___ ${minuscola(c.effetto)}.`,
      soggetto: { emoji: c.emoji },
      buona: testo(buona),
      falsi: falsi.map(f => testo(f, perche[f])),
      chiave: 'conn:conseguenza',
      aiuto: '«quindi» e «così» introducono l\'effetto: quello che succede dopo, per colpa della causa',
      sorte,
    })
  }

  /* grado 2 — «ma»/«però»/«invece»: il contrasto con quello che
     ci si aspettava */
  contrasto(sorte) {
    const c = sorte.uno(CONTRASTI)
    const buona = sorte.uno(['ma', 'però', 'invece'])
    const falsi = sorte.alcuni(Object.keys(FALSI_CONTRASTO), 2)
    return domanda({
      testo: `${c.atteso}, ___ ${minuscola(c.sorpresa)}.`,
      soggetto: { emoji: c.emoji },
      buona: testo(buona),
      falsi: falsi.map(f => testo(f, FALSI_CONTRASTO[f])),
      chiave: 'conn:contrasto',
      aiuto: '«ma», «però» e «invece» dicono che è successo il contrario di quello che ci si aspettava',
      sorte,
    })
  }

  /* grado 2-3 — «cosa dice la parolina»: non si completa una frase,
     si legge cosa segnala «ma» dentro una frase già scritta */
  capisci(sorte) {
    const c = sorte.uno(CONTRASTI)
    const falsi = sorte.distrattori(CONTRASTI, 3, x => x === c).map(x => x.spiegazioneAttesa)
    return domanda({
      testo: sorte.uno(TESTO_CAPISCI),
      soggetto: { testo: `${c.atteso}, ma ${minuscola(c.sorpresa)}.` },
      buona: testo(c.spiegazioneAttesa),
      falsi: falsi.map(f => testo(f, 'non è questo che dice la frase: guarda cosa c\'è scritto prima di «ma»')),
      chiave: 'conn:capisci',
      aiuto: '«ma» avverte che sta arrivando il contrario di quello che la prima parte della frase faceva pensare',
      sorte,
    })
  }

  /* grado 3 — «quando»/«mentre»: il tempo, senza nessun legame di
     causa (per questo «perché», «quindi» e «se» restano sempre falsi) */
  tempo(sorte) {
    if (sorte.forse(0.5)) {
      const c = sorte.uno(QUANDO)
      const falsi = sorte.alcuni(Object.keys(FALSI_TEMPO), 2)
      return domanda({
        testo: `${c.sfondo}, ___ ${minuscola(c.evento)}.`,
        soggetto: { emoji: c.emoji },
        buona: testo('quando'),
        falsi: falsi.map(f => testo(f, FALSI_TEMPO[f])),
        chiave: 'conn:tempo',
        aiuto: '«quando» dice IN CHE MOMENTO succede una cosa',
        sorte,
      })
    }
    const c = sorte.uno(MENTRE)
    const falsi = sorte.alcuni(Object.keys(FALSI_TEMPO), 2)
    return domanda({
      testo: `${c.azione1}, ___ ${minuscola(c.azione2)}.`,
      soggetto: { emoji: c.emoji },
      buona: testo('mentre'),
      falsi: falsi.map(f => testo(f, FALSI_TEMPO[f])),
      chiave: 'conn:tempo',
      aiuto: '«mentre» dice che due cose succedono nello stesso momento',
      sorte,
    })
  }

  /* grado 2-4 — «quale frase ha senso»: la stessa coppia di fatti,
     quattro connettivi diversi, una sola logica */
  senso(sorte) {
    const c = sorte.uno(CAUSALI)
    if (sorte.forse(0.5)) {
      const cap = maiuscola(c.causa), eff = minuscola(c.effetto)
      return domanda({
        testo: 'Quale frase ha senso?',
        soggetto: { emoji: c.emoji },
        buona: testo(`${cap}, quindi ${eff}.`),
        falsi: [
          testo(`${cap}, perché ${eff}.`, FALSI_CAUSA_GIRATA['perché']),
          testo(`${cap}, ma ${eff}.`, FALSI_CAUSA_GIRATA.ma),
          testo(`${cap}, se ${eff}.`, FALSI_CAUSA_GIRATA.se),
        ],
        chiave: 'conn:senso',
        aiuto: '«quindi» introduce quello che succede dopo, per colpa di quello che viene prima',
        sorte,
      })
    }
    const eff = c.effetto, cau = minuscola(c.causa)
    return domanda({
      testo: 'Quale frase ha senso?',
      soggetto: { emoji: c.emoji },
      buona: testo(`${eff} perché ${cau}.`),
      falsi: [
        testo(`${eff} quindi ${cau}.`, FALSI_CAUSA.quindi),
        testo(`${eff} ma ${cau}.`, "qui non c'è nessun contrasto: le due cose vanno perfettamente d'accordo"),
        testo(`${eff} se ${cau}.`, FALSI_CAUSA.se),
      ],
      chiave: 'conn:senso',
      aiuto: '«perché» introduce il motivo: quello che spiega come è nato l\'effetto',
      sorte,
    })
  }

  /* grado 4 — «se»: un'ipotesi ancora aperta, non un fatto */
  condizione(sorte) {
    const c = sorte.uno(CONDIZIONI)
    const falsi = sorte.alcuni(Object.keys(FALSI_CONDIZIONE), 2)
    return domanda({
      testo: `${c.conseguenza} ___ ${c.condizione}.`,
      soggetto: { emoji: c.emoji },
      buona: testo('se'),
      falsi: falsi.map(f => testo(f, FALSI_CONDIZIONE[f])),
      chiave: 'conn:condizione',
      aiuto: '«se» dice che non sappiamo ancora se succederà: tutto dipende da questo',
      sorte,
    })
  }

  /* grado 4-5 — «anche se» contro «se»: la condizione (non si sa
     ancora) contro la concessione (si sa già, ed è un ostacolo) */
  concessione(sorte) {
    if (sorte.forse(0.5)) {
      const c = sorte.uno(CONDIZIONI)
      const falsi = ['anche se', 'quando']
      const perche = { 'anche se': "«anche se» si usa quando la cosa è già vera; qui invece non si sa ancora", quando: FALSI_CONDIZIONE.quando }
      return domanda({
        testo: `${c.conseguenza} ___ ${c.condizione}.`,
        soggetto: { emoji: c.emoji },
        buona: testo('se'),
        falsi: falsi.map(f => testo(f, perche[f])),
        chiave: 'conn:concessione',
        aiuto: '«se» si usa quando ancora non sappiamo se succederà',
        sorte,
      })
    }
    const c = sorte.uno(CONTRASTI)
    const falsi = ['se', 'quindi']
    const perche = { se: "«se» serve per un'ipotesi: questo invece è già successo davvero", quindi: FALSI_CONTRASTO.quindi }
    return domanda({
      testo: `${c.sorpresa} ___ ${minuscola(c.atteso)}.`,
      soggetto: { emoji: c.emoji },
      buona: testo('anche se'),
      falsi: falsi.map(f => testo(f, perche[f])),
      chiave: 'conn:concessione',
      aiuto: '«anche se» dice che qualcosa è successo nonostante un ostacolo già vero',
      sorte,
    })
  }

  /* grado 5 — il doppio senso di «mentre»: nello stesso momento,
     oppure invece? Si legge tutta la frase per saperlo */
  mentreDoppio(sorte) {
    const c = sorte.uno(MENTRE_SENSO)
    const altro = c.senso === 'tempo' ? 'contrasto' : 'tempo'
    const falsi = [
      testo(SENSO_MENTRE[altro], "guarda bene: qui «mentre» non sta dicendo questo"),
      testo('che una cosa è la causa dell\'altra', '«mentre» non spiega motivi'),
      testo("che una cosa succede solo se l'altra è vera", "«mentre» non è un'ipotesi"),
    ]
    return domanda({
      testo: sorte.uno(TESTO_MENTRE_DOPPIO),
      soggetto: { testo: c.frase },
      buona: testo(SENSO_MENTRE[c.senso]),
      falsi,
      chiave: 'conn:mentre-doppio',
      aiuto: '«mentre» a volte vuol dire «nello stesso momento», a volte vuol dire «invece»: bisogna leggere tutta la frase',
      sorte,
    })
  }
}

export default new Connettivi()
