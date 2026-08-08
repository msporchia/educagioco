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
     normale  5^4    =    625  in 6 prove
     tosto    6^4    =  1.296  in 6 prove
     esperto  7^5    = 16.807  in 8 prove
   ═══════════════════════════════════════════════════════════════════ */

export const SCAGLIONI = [
  { chiave: 'facile',  nome: 'facile',  icona: '🐣',
    caselle: 3, simboli: 4, prove: 6, ripetizioni: false, premio: 2 },
  { chiave: 'normale', nome: 'normale', icona: '🐨',
    caselle: 4, simboli: 5, prove: 6, ripetizioni: true,  premio: 3 },
  { chiave: 'tosto',   nome: 'tosto',   icona: '🦁',
    caselle: 4, simboli: 6, prove: 6, ripetizioni: true,  premio: 4 },
  { chiave: 'esperto', nome: 'esperto', icona: '🐉',
    caselle: 5, simboli: 7, prove: 8, ripetizioni: true,  premio: 6 },
]

export const PREDEFINITO = 'normale'

export const scaglione = chiave =>
  SCAGLIONI.find(s => s.chiave === chiave) ||
  SCAGLIONI.find(s => s.chiave === PREDEFINITO)

/* Le stelle di fine partita: quante prove sono avanzate rispetto a quelle
   concesse. Tre stelle chiedono di averne consumata meno di metà, e con i
   doppioni accesi non è un regalo. La prima riga che va bene vince. */
export const STELLE = [
  { avanzate: 0.5, stelle: 3 },
  { avanzate: 0.2, stelle: 2 },
  { avanzate: 0,   stelle: 1 },
]

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
  }
  /* gli scaglioni sono una scala: se il secondo non è più largo del primo,
     è un nome diverso per la stessa cosa */
  for (let i = 1; i < scaglioni.length; i++)
    if (quantiCodici(scaglioni[i]) <= quantiCodici(scaglioni[i - 1]))
      guasti.push(`"${scaglioni[i].chiave}" non è più duro di "${scaglioni[i - 1].chiave}"`)
  if (!scaglioni.some(s => s.chiave === PREDEFINITO))
    guasti.push(`il predefinito "${PREDEFINITO}" non è nella tabella`)
  return guasti
}
