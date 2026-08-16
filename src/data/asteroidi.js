/* ═══════════════════════════════════════════════════════════════════
   LA SCALETTA DEGLI ASTEROIDI — una fila sola, i pianeti e le stazioni
   mescolati per difficoltà vera.

   Prima erano due campagne dietro due linguette: 🪐 i pianeti (una
   tabellina a testa, `data/tabelline.js`) e 🛰️ le stazioni del calcolo a
   mente (`data/calcolo.js`). Sono due facce della stessa moneta — la
   stessa aritmetica, gli stessi asteroidi, lo stesso motore — e tenerle
   separate obbligava a scegliere una scheda prima di scegliere una
   tappa, cioè a rispondere alla domanda «preferisci le tabelline o i
   conti a mente?», che è un'altra di quelle a cui un bambino non sa
   rispondere. Qui la fila è una, e l'ordine è già deciso.

   ═══════════ COME È STATO DECISO L'ORDINE ═══════════

   Non è un'alternanza a turno («uno di qua, uno di là»): quella si
   scrive in tre righe e non vuol dire niente. Le due liste si fondono
   **una volta**, guardando cosa chiede davvero ogni tappa, e da lì in
   poi la fila è dato puro. Tre criteri, in quest'ordine di autorità:

   1. **I VINCOLI MISURATI.** Il grafo dei prerequisiti di
      `store/calcolo.js` è già scritto: un concetto non si apre finché i
      suoi `prereq` non reggono, e i concetti moltiplicativi dichiarano
      anche `tabelline: N` — quante tabelline devono stare in piedi. Sono
      i punti dove le due campagne si toccano per davvero, e sono numeri,
      non opinioni: `spezza-prodotto` (4×23) vuole quattro tabelline
      salde, `divide-tabellina` (56:8) pure. Nessuna tappa può stare
      prima di quello che le serve, e `unita/asteroidi` lo verifica
      camminando la fila con un finto bambino: a ogni tappa controlla che
      quello che sta per essere chiesto sia già **aperto**.
   2. **QUANTI PEZZI SI TENGONO A MENTE.** È l'unica moneta che le due
      liste hanno in comune, ed è già dichiarata: un concetto porta il
      suo `peso` (1..3, «quanto costa in testa»), una tabellina è un
      fatto solo da ricordare — il gioco infatti le dà `peso` 1 — la cui
      fatica sta in quanti dei due fattori vanno saputi a memoria
      (`durezza` in `store/tabelline.js`).
   3. **IL RITMO.** A pari difficoltà si alterna, perché dieci pianeti di
      fila prima di un conto a mente sono di nuovo due campagne
      appiccicate, e perché passare dalla memoria (una tabellina) al
      ragionamento (una strategia) e ritorno è il modo in cui le due cose
      si sostengono a vicenda invece di farsi concorrenza.

   Voce per voce, il perché delle giunzioni — che è la parte che non si
   ricava rileggendo la fila:

   · **«Fino al dieci» e «Oltre la decina» prima di ogni tabellina.**
     3+4 e 8+5 sono il pavimento di tutto il resto, e la tabellina del 2
     è i *doppi*, che stanno dentro «Fino al dieci»: chi non sa che 7+7
     fa 14 non ha modo di sapere che 2×7 fa 14, ce l'ha solo di
     impararlo a memoria.
   · **Il pianeta del 10 prima di «Amici e decine».** 30+40 è «3 decine
     più 4 decine»: è la regola dello zero applicata alla somma. Impararla
     con la tabellina del 10 già in mano costa una frase; il contrario
     costa una tappa.
   · **«Due cifre e una» (12+6, 34+20) prima del pianeta del 3.** Chiede
     solo le decine tonde, che sono appena arrivate, e non chiede niente
     di moltiplicativo: è il gradino additivo più basso rimasto.
   · **Il pianeta del 3 chiude il quartetto delle regole.** Con 2, 10, 5 e
     3 saldi si arriva a quattro tabelline, che è la soglia dichiarata da
     `spezza-prodotto` e `divide-tabellina`: da qui in poi il grafo non
     sbarra più niente, e l'ordine lo decidono i pezzi da tenere a mente.
   · **«Passa la decina» (26+7) prima di «Due cifre» (23+45).** È la
     scelta già presa dentro le stazioni e regge anche qui: 26+7 è 6+7
     con davanti una decina che si muove di uno, 23+45 sono due colonne
     che non si parlano. Fra i due si infilano i pianeti del 4 e del 6,
     che sono raddoppi di roba già saputa (4 è il 2 due volte, 6 è il 3
     raddoppiato) e non chiedono niente di nuovo alla testa.
   · **«Riporti e prestiti» (27+38) e i pianeti del 7 e dell'8 nello
     stesso capitolo.** Sono i quattro gradini più alti dei rispettivi
     mestieri: il riporto è la prima volta che due colonne si parlano, il
     7 e l'8 sono le uniche tabelline che non hanno una regola da dire a
     voce. Vanno insieme perché costano uguale, alternati perché
     costano tanto.
   · **«I quasi tondi» (47+29) dopo il riporto e prima di moltiplicare.**
     Non porta numeri più grandi, porta una furbizia: si arrotonda e si
     aggiusta. Ha senso solo dopo aver fatto 27+38 alla maniera lunga, se
     no non c'è nessuna scorciatoia da riconoscere.
   · **Moltiplicare e dividere a mente dopo TUTTE le tabelline.** Il grafo
     ne chiederebbe quattro; quattro bastano a non sbagliare, non a
     imparare. 4×23 e 56:8 pescano il fattore fra le tabelline che
     reggono (`tabVera` in `data/calcolo.js`): con quattro esce sempre lo
     stesso pugno di numeri, con nove escono tutte. E 56:8 è
     letteralmente la tabellina dell'8 girata: chiederla prima del
     pianeta dell'8 vorrebbe dire insegnare il contrario di una cosa che
     non si sa ancora.
   · **«Fino a mille» in fondo, con i due esami.** 497+298 è il riporto
     con una cifra in più, e il Sole e «La prova» non portano niente di
     nuovo: sono le due verifiche, una per mestiere.

   ═══════════ I PROGRESSI NON SI TOCCANO ═══════════

   La fila è nuova, i contatori sono quelli di sempre: `mate.tappa` per i
   pianeti, `calc.tappa` per le stazioni. Una voce della scaletta è
   superata se il progresso **della sua campagna** la copriva, ed è
   aperta con la stessa regola di prima (`tappaAperta`). Non c'è nessuna
   migrazione da fare — e non poteva esserci: un contatore solo o
   regalerebbe le stazioni a chi è avanti coi pianeti, o richiuderebbe i
   pianeti a chi è avanti con le stazioni. Chi era al quinto pianeta e
   alla seconda stazione ritrova esattamente quello, dentro una fila
   sola.

   Da qui viene anche la cosa che sembra strana e non lo è: in mezzo alla
   scaletta possono esserci due tappe aperte invece di una, una per
   mestiere. È il prezzo — giusto — di non aver perso niente.

   ═══════════ SPENTO IL CALCOLO A MENTE ═══════════

   `settings.varianti['asteroidi:mente']` (pagina dei grandi): spento, le
   voci a mente spariscono e i pianeti si richiudono in fila senza buchi,
   nell'ordine di sempre. I progressi restano dove sono, e riaccendendo
   la fila torna intera.
   ═══════════════════════════════════════════════════════════════════ */
import { CAMPAGNA } from './tabelline.js'
import { STAZIONI } from './calcolo.js'

/* la chiave dell'interruttore dei grandi: sta in `settings.varianti`,
   come elenco di eccezioni — chi non dichiara niente ce l'ha acceso */
export const CHIAVE_MENTE = 'asteroidi:mente'

/* I capitoli. Servono a due cose insieme: raccontare la salita («adesso
   si fanno le decine») e spezzare ventidue righe in blocchi da tre o
   quattro, che su un telefono stretto è la differenza fra una lista che
   si scorre e un muro. Le voci sono codici: `p` + indice del pianeta in
   `CAMPAGNA`, `m` + indice della stazione in `STAZIONI`. */
const CAPITOLI_ORDINE = [
  { emoji: '🚀', titolo: 'Si comincia',
    che: 'I primi conti e le prime due tabelline, quelle che sono una regola.',
    voci: ['m0', 'm1', 'p0', 'p1'] },
  { emoji: '🌑', titolo: 'Le decine',
    che: 'Le decine tonde, gli amici del dieci, e le tabelline che si contano.',
    voci: ['m2', 'p2', 'm3', 'p3'] },
  { emoji: '🌓', titolo: 'Due cifre',
    che: 'I numeri diventano grandi, ma le colonne non si parlano ancora.',
    voci: ['m4', 'p4', 'm5', 'p5'] },
  { emoji: '☄️', titolo: 'I conti che si portano',
    che: 'Il riporto e il prestito, e le due tabelline senza scorciatoie.',
    voci: ['m6', 'p6', 'm7', 'p7'] },
  { emoji: '🌠', titolo: 'Moltiplicare e dividere a mente',
    che: 'Adesso che le tabelline ci sono tutte, si può moltiplicare in grande.',
    voci: ['p8', 'm8', 'm9'] },
  { emoji: '⭐', titolo: 'Fino a mille, e la prova',
    che: 'I numeri grandi, e poi le due verifiche: niente di nuovo, nessuno sconto.',
    voci: ['m10', 'p9', 'm11'] },
]

const daCodice = c => {
  const i = +c.slice(1)
  return c[0] === 'p'
    ? { tipo: 'pianeta', i, T: CAMPAGNA[i] }
    : { tipo: 'mente', i, T: STAZIONI[i] }
}

/* La scaletta intera, com'è scritta qui sopra. `cap` è l'indice del
   capitolo, e serve alla mappa per stampare il titolino una volta sola. */
export const SCALETTA = CAPITOLI_ORDINE.flatMap((c, cap) =>
  c.voci.map(codice => ({ ...daCodice(codice), cap })))

export const CAPITOLI = CAPITOLI_ORDINE.map(({ emoji, titolo, che }) => ({ emoji, titolo, che }))

/* ═══════════ le domande che si fanno sulla fila ═══════════
   `prog` è la coppia di contatori del profilo, nella forma in cui la
   scaletta la vuole: `{ pianeta: mate.tappa, mente: calc.tappa }`. Sono
   funzioni pure — girano in Node e non importano il profilo. */
export const progressiDa = (mate, calc) => ({
  pianeta: (mate && mate.tappa) || 0,
  mente: (calc && calc.tappa) || 0,
})

/* superata: il contatore della SUA campagna l'aveva già passata */
export const superata = (v, prog) => v.i < prog[v.tipo]
/* raggiunta: è la prossima della sua campagna, o una già fatta. Chi
   chiama ci mette davanti `tuttoAperto()` (vedi `tappaAperta`). */
export const raggiunta = (v, prog) => v.i <= prog[v.tipo]

/* La fila come la vede questo bambino: senza le voci a mente se i
   grandi le hanno spente. `n` è il numero stampato accanto al nome, e si
   ricalcola sulla fila filtrata — se no spegnendo il calcolo a mente i
   pianeti resterebbero numerati 3, 4, 6, 8… cioè con i buchi di quello
   che non c'è. */
export function scaletta(menteAccesa = true) {
  const voci = menteAccesa ? SCALETTA : SCALETTA.filter(v => v.tipo === 'pianeta')
  return voci.map((v, n) => ({ ...v, n: n + 1 }))
}

/* dove si è arrivati: la prima voce non ancora superata. È il numero che
   la home mostra («tappa 7 di 22») e il posto su cui si apre la mappa. */
export function posizioneOra(prog, menteAccesa = true) {
  const fila = scaletta(menteAccesa)
  const i = fila.findIndex(v => !superata(v, prog))
  return i < 0 ? fila.length : i
}

/* la voce dopo, seguendo la fila e non la campagna: è quella che il
   cartello di fine tappa annuncia e che il tasto «avanti» gioca. Salta
   quelle già superate — chi rigioca una vecchia tappa vuole tornare dov'era
   — e quelle ancora chiuse, che nella fila mescolata possono capitare. */
export function dopoDi(voce, prog, menteAccesa = true, aperta = raggiunta) {
  const fila = scaletta(menteAccesa)
  const da = fila.findIndex(v => v.tipo === voce.tipo && v.i === voce.i)
  if (da < 0) return null
  return fila.slice(da + 1).find(v => aperta(v, prog) && !superata(v, prog)) ||
         fila.slice(da + 1).find(v => aperta(v, prog)) || null
}
