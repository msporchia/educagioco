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

     facile   4·3·2  =     24  in 6 prove
     normale  5^4    =    625  in 7 prove
     tosto    6^4    =  1.296  in 8 prove
     esperto  7^5    = 16.807  in 9 prove

   ── PERCHÉ LE PROVE CRESCONO ──────────────────────────────────────

   Sono cresciute dopo averle misurate: prima erano sei per tutti tranne
   l'ultimo, e sei prove su 24 codici e sei prove su 1.296 sono due giochi
   diversi con lo stesso vestito. Il banco di prova
   (`motore/banco.js`) dice quanto costava davvero, facendo giocare un
   bambino che ragiona ma si distrae (`attenzione: 0.55`):

     con sei prove per tutti      facile 5% di partite perse → tosto 23%
     con 6 · 7 · 8 · 9 prove      fra il 5% e il 6% ovunque

   Il tetto non è quindi un numero tondo: è **quanto serve al ragionatore
   nel suo giorno peggiore, più il respiro per chi ragiona a sprazzi**. Il
   ragionatore perfetto chiude quasi sempre entro 4 · 5 · 6 · 7 prove; il
   respiro sono le due righe che restano. Uno scaglione nuovo si tara così,
   non a occhio: `guastiDegliScaglioni` pretende almeno che le prove non
   calino quando lo spazio cresce, e il test di unità gioca le partite e
   pretende che chi ragiona a sprazzi porti a casa almeno il 90%.

   Quante righe entrino nello schermo, invece, **non è un vincolo**: il
   tabellone scorre e le righe hanno un'altezza minima sotto la quale non
   scendono (`stile.css`). Chi alza il tetto guarda la taratura e basta.

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
    caselle: 3, simboli: 4, prove: 6, ripetizioni: false, premio: 2,
    perfetto: 3, bene: 4 },
  { chiave: 'normale', nome: 'normale', icona: '🐨',
    caselle: 4, simboli: 5, prove: 7, ripetizioni: true,  premio: 3,
    perfetto: 4, bene: 5 },
  { chiave: 'tosto',   nome: 'tosto',   icona: '🦁',
    caselle: 4, simboli: 6, prove: 8, ripetizioni: true,  premio: 4,
    perfetto: 4, bene: 6 },
  { chiave: 'esperto', nome: 'esperto', icona: '🐉',
    caselle: 5, simboli: 7, prove: 9, ripetizioni: true,  premio: 6,
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
