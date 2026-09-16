/* ═══════════════════════════════════════════════════════════════════
   LA DIFFICOLTÀ, TUTTA IN DATO

   Qui non si gioca e non si disegna: si dichiara soltanto quanto è duro
   un codice. Il motore non sa fare altro che leggere questa tabella —
   aggiungere uno scaglione vuol dire aggiungere una riga, non mettere le
   mani nel gioco.

   Le leve sono quattro, e tirano tutte nella stessa direzione:

     caselle       quanto è lungo il codice
     simboli       quanti disegni del tema sono in gioco (i primi n)
     prove         quante righe ha il tabellone
     ripetizioni   se il codice può ripetere lo stesso disegno

   `ripetizioni: false` è la leva più gentile di tutte, ed è il motivo per
   cui il primo scaglione esiste: senza doppioni «l'ho già visto qui,
   quindi là non c'è» è un ragionamento che regge sempre, e il bambino lo
   scopre da solo. Acceso il doppione, quel ragionamento salta ed è lì che
   il gioco comincia a chiedere davvero.

   Lo spazio di ricerca (`simboli ^ caselle`, o le disposizioni semplici
   senza doppioni) è il modo di non fare scaglioni diversi solo di nome:

     facile   4·3·2  =     24  in  9 prove
     normale  5^4    =    625  in 10 prove
     tosto    6^4    =  1.296  in 11 prove
     esperto  7^5    = 16.807  in 12 prove

   ── PERCHÉ LE PROVE CRESCONO ──────────────────────────────────────

   Sono cresciute due volte, e tutte e due dopo averle misurate. La prima
   volta erano sei per tutti tranne l'ultimo — e sei prove su 24 codici e
   sei prove su 1.296 sono due giochi diversi con lo stesso vestito — e
   sono diventate 6 · 7 · 8 · 9, tarate sul bambino finto di
   `motore/banco.js` con `attenzione: 0.55`, cioè uno che il ragionamento
   lo fa poco più di una volta su due.

   La seconda volta è stato **guardare giocare dei bambini veri**, e dice
   che quello 0,55 era ottimistico: a sei o sette righe si perde troppo
   spesso, e una partita persa dopo aver ragionato non si legge come «ho
   sbagliato», si legge come «è andata male» — cioè il gioco diventa un
   gioco di fortuna proprio a chi stava imparando a dedurre. Rimisurato
   col banco più in basso (2.000 partite per casella), **% di partite
   perse**:

                    prove di prima          prove di adesso
     attenzione    6 ·  7 ·  8 ·  9       9 · 10 · 11 · 12
       0,55       5,4  7,6  7,3  5,8     0,3  0,7  0,7  0,8
       0,45       9,7 14,5 12,8 12,8     1,6  2,7  1,8  2,5
       0,40      13,2 19,0 17,5 16,9     2,5  5,0  4,0  3,7
       0,35      18,6 25,6 22,3 21,3     4,8  7,8  6,1  6,2

   Il bersaglio è **una partita persa su venti con un bambino a 0,40**, ed
   è il primo punto in cui ci si arriva: a +2 righe «normale» ne perdeva
   ancora l'8,3%, e anche adesso è lui a stare esattamente sul filo (5,0%).
   Non gli si è dato l'undicesimo per non appiattire la scala su «tosto»:
   dieci righe per 625 codici il filo lo tengono, e la riga in più è quella
   che separa uno scaglione dal successivo, non un margine da spendere
   qui. Il tetto non è quindi un numero tondo: è **quanto serve al
   ragionatore nel suo giorno peggiore, più il respiro per chi ragiona a
   sprazzi** — e il respiro adesso è tarato su quanti sprazzi ha davvero un
   bambino, non su quanti ne ha il modello. Il ragionatore perfetto chiude
   quasi sempre entro 4 · 5 · 6 · 7 prove; tutto il resto è respiro.

   Righe in più **non regalano stelle**: `perfetto` e `bene` non si sono
   mossi (vedi sotto), quindi quello che cresce è solo quanto si può
   sbagliare prima di perdere. Nel banco le tre stelle restano dove erano —
   a 0,55 le prende il 44 · 34 · 21 · 23% delle partite, come prima — e a
   crescere è la fetta di chi la porta a casa con una stella sola.

   Uno scaglione nuovo si tara così, non a occhio: `guastiDegliScaglioni`
   pretende almeno che le prove non calino quando lo spazio cresce, e il
   test di unità gioca le partite a `0.55` **e a `0.4`**, e pretende che
   chi ragiona a sprazzi porti a casa almeno il 90%.

   Quante righe entrino nello schermo, invece, **non è un vincolo**: il
   tabellone scorre e le righe hanno un'altezza minima sotto la quale non
   scendono (`stile.css`), e dopo ogni consegna la riga da scrivere si
   porta in vista da sé (`viste/Tavolo.vue`) — senza quella, un tabellone
   che non ci sta si presenta come un gioco che non ha reagito al dito. Chi
   alza il tetto guarda la taratura e basta: con dodici righe su uno
   schermo da 320×568 si scorre già, e `integrazione/codice-segreto` lo
   prova lì, chiedendo allo scaglione quante righe siano invece di
   scriverselo.

   ── E PERCHÉ LE STELLE NON SONO PIÙ UNA FRAZIONE ──────────────────

   `perfetto` e `bene` sono le prove entro cui la partita vale tre stelle e
   due. Prima erano una frazione del tabellone («meno di metà»), e questo
   le legava al tetto in modo perverso: allungare il tabellone di una riga
   spostava anche l'asticella delle stelle, e su «tosto» tre stelle
   volevano dire chiudere in tre prove — cioè quasi mai (misurato: 8% a chi
   ragiona sempre). Adesso il tetto dice quando si perde e le soglie dicono
   quanto si è stati bravi, e sono due discorsi separati.
   ═══════════════════════════════════════════════════════════════════ */

export const SCAGLIONI = [
  { chiave: 'facile',  nome: 'facile',  icona: '🐣',
    caselle: 3, simboli: 4, prove: 9, ripetizioni: false, premio: 2,
    perfetto: 3, bene: 4 },
  { chiave: 'normale', nome: 'normale', icona: '🐨',
    caselle: 4, simboli: 5, prove: 10, ripetizioni: true, premio: 3,
    perfetto: 4, bene: 5 },
  { chiave: 'tosto',   nome: 'tosto',   icona: '🦁',
    caselle: 4, simboli: 6, prove: 11, ripetizioni: true, premio: 4,
    perfetto: 4, bene: 6 },
  { chiave: 'esperto', nome: 'esperto', icona: '🐉',
    caselle: 5, simboli: 7, prove: 12, ripetizioni: true, premio: 6,
    perfetto: 5, bene: 7 },
]

export const PREDEFINITO = 'normale'

export const scaglione = chiave =>
  SCAGLIONI.find(s => s.chiave === chiave) ||
  SCAGLIONI.find(s => s.chiave === PREDEFINITO)

/* Le stelle di fine partita: si contano le prove consumate e si guarda
   dove cadono rispetto alle due soglie dello scaglione. Vincere all'ultima
   riga concessa vale comunque una stella — si perde solo finendo le prove. */
export function stellePer(scaglione, usate) {
  if (usate <= scaglione.perfetto) return 3
  if (usate <= scaglione.bene) return 2
  return 1
}

/* Quanti codici diversi esistono con questi numeri: è il metro con cui si
   dice che uno scaglione è più duro di un altro davvero. */
export function quantiCodici({ simboli, caselle, ripetizioni }) {
  if (ripetizioni) return Math.pow(simboli, caselle)
  let n = 1
  for (let i = 0; i < caselle; i++) n *= (simboli - i)
  return n
}

/* Uno scaglione può essere sbagliato in modi che a schermo non si vedono
   subito: un codice senza doppioni più lungo dei disegni disponibili non
   esiste, e il generatore girerebbe a vuoto per sempre. */
export function guastiDegliScaglioni(scaglioni = SCAGLIONI, quantiSimboli = 8) {
  const guasti = []
  const viste = new Set()
  for (const s of scaglioni) {
    const dove = `scaglione "${s.chiave}"`
    if (viste.has(s.chiave)) guasti.push(`${dove}: chiave ripetuta`)
    viste.add(s.chiave)
    if (!(s.caselle >= 2)) guasti.push(`${dove}: ${s.caselle} caselle non fanno un codice`)
    if (!(s.prove >= 3)) guasti.push(`${dove}: ${s.prove} prove sono troppo poche`)
    if (!(s.simboli >= 2)) guasti.push(`${dove}: ${s.simboli} disegni non fanno un codice`)
    if (s.simboli > quantiSimboli)
      guasti.push(`${dove}: chiede ${s.simboli} disegni, i temi ne hanno ${quantiSimboli}`)
    if (!s.ripetizioni && s.simboli < s.caselle)
      guasti.push(`${dove}: senza doppioni ${s.simboli} disegni non riempiono ${s.caselle} caselle`)
    if (!(s.premio > 0)) guasti.push(`${dove}: premio ${s.premio}`)
    if (!s.icona || !s.nome) guasti.push(`${dove}: senza nome o senza icona`)
    /* le soglie delle stelle stanno dentro il tabellone e in quest'ordine,
       o una stella diventa irraggiungibile senza che si veda */
    if (!(s.perfetto >= 1)) guasti.push(`${dove}: tre stelle in ${s.perfetto} prove`)
    if (!(s.bene >= s.perfetto)) guasti.push(`${dove}: due stelle (${s.bene}) prima di tre (${s.perfetto})`)
    if (s.bene >= s.prove)
      guasti.push(`${dove}: due stelle fino a ${s.bene} prove su ${s.prove} concesse, una stella non capita mai`)
  }
  /* gli scaglioni sono una scala: se il secondo non è più largo del primo,
     è un nome diverso per la stessa cosa */
  for (let i = 1; i < scaglioni.length; i++) {
    if (quantiCodici(scaglioni[i]) <= quantiCodici(scaglioni[i - 1]))
      guasti.push(`"${scaglioni[i].chiave}" non è più duro di "${scaglioni[i - 1].chiave}"`)
    /* e le prove salgono con lui: lo stesso tetto su uno spazio più largo
       non è uno scaglione più difficile, è uno scaglione più ingiusto */
    if (scaglioni[i].prove < scaglioni[i - 1].prove)
      guasti.push(`"${scaglioni[i].chiave}" è più duro di "${scaglioni[i - 1].chiave}" ` +
                  `ma concede meno prove (${scaglioni[i].prove} contro ${scaglioni[i - 1].prove})`)
  }
  if (!scaglioni.some(s => s.chiave === PREDEFINITO))
    guasti.push(`il predefinito "${PREDEFINITO}" non è nella tabella`)
  return guasti
}
