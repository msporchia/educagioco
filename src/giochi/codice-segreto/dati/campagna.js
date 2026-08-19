/* ═══════════════════════════════════════════════════════════════════
   LA CAMPAGNA — nove tappe in tre scalini

   L'ingresso al gioco non è una schermata con «scegli la difficoltà»: è
   un percorso, come le tappe del castello. Prima una fila di partite
   facili, poi normali, poi toste — e la difficoltà non la sceglie il
   bambino, gliela porta il viaggio.

   Una tappa è **lo stesso gioco con altri numeri e un altro vestito**:
   uno scaglione di `difficolta.js` più un tema di `temi.js`. Il vestito
   cambia a ogni tappa apposta: nove tappe con gli stessi otto animali
   sono la stessa schermata nove volte, e a metà non ci si torna più.

   `partite` è quanti codici bisogna indovinare per portarla a casa. Un
   codice sbagliato non toglie niente e non fa arretrare: si ricomincia da
   un altro codice, e la tappa resta lì che aspetta. A sei anni la
   punizione non insegna, insegna il giro dopo.

   Finite le nove tappe si apre il **gioco libero**, ed è l'unico posto
   dove la difficoltà si sceglie a mano — lo scaglione «esperto» vive solo
   lì, perché è quello che ci si va a prendere, non quello che ti capita.
   ═══════════════════════════════════════════════════════════════════ */

export const SCALINI = [
  { chiave: 'facile',  nome: 'Le prime chiavi', icona: '🗝️',
    dritta: 'Tre caselle e nessun disegno ripetuto.' },
  { chiave: 'normale', nome: 'Serrature vere',  icona: '🔑',
    dritta: 'Quattro caselle, e adesso un disegno può tornare due volte.' },
  { chiave: 'tosto',   nome: 'La cassaforte',   icona: '🔐',
    dritta: 'Sei disegni diversi: le prove sono sempre sei.' },
]

/* `portata` è dove sta la tappa sulla scala 0-100 di `data/portata.js`,
   e dice a chi va offerta. Qui NON c'è `scuola`, ed è una dichiarazione,
   non una dimenticanza: quello che questa campagna insegna non lo dà
   nessuna scuola, quindi la sua testa non si taglia mai per età — le
   prime tappe restano a disposizione anche di chi arriva grande, che
   altrimenti non imparerebbe mai come si gioca. Si taglia solo in alto. */
export const CAMPAGNA = [
  /* ── scalino 1: facile, senza doppioni ── */
  { chiave: 'cuccioli',  nome: 'Il canile',        tema: 'animali',
    portata: 12,
    scalino: 'facile',  difficolta: 'facile',  partite: 3,
    racconto: 'Tre cucce e tre cuccioli. Chi dorme dove?' },
  { chiave: 'fruttivendolo', nome: 'Il fruttivendolo', tema: 'frutta',
    portata: 15,
    scalino: 'facile',  difficolta: 'facile',  partite: 3,
    racconto: 'La cassetta della frutta è chiusa a chiave.' },
  { chiave: 'orto',      nome: "L'orto",           tema: 'giardino',
    portata: 18,
    scalino: 'facile',  difficolta: 'facile',  partite: 3,
    racconto: 'Il cancello dell\'orto si apre con tre fiori giusti.' },

  /* ── scalino 2: normale, i doppioni si accendono ── */
  { chiave: 'scogliera', nome: 'La scogliera',     tema: 'mare',
    portata: 30,
    scalino: 'normale', difficolta: 'normale', partite: 3,
    racconto: 'Quattro caselle. E attenzione: un pesce può ripetersi.' },
  { chiave: 'pasticceria', nome: 'La pasticceria', tema: 'dolci',
    portata: 34,
    scalino: 'normale', difficolta: 'normale', partite: 3,
    racconto: 'Due biscotti uguali nella stessa ricetta? Può capitare.' },
  { chiave: 'officina',  nome: "L'officina",       tema: 'veicoli',
    portata: 38,
    scalino: 'normale', difficolta: 'normale', partite: 3,
    racconto: 'Il garage ha una serratura a quattro mezzi.' },

  /* ── scalino 3: tosto, un disegno in più ── */
  { chiave: 'palestra',  nome: 'La palestra',      tema: 'sport',
    portata: 50,
    scalino: 'tosto',   difficolta: 'tosto',   partite: 3,
    racconto: 'Sei palloni per quattro caselle. Sempre sei prove.' },
  { chiave: 'teatro',    nome: 'Il teatro',        tema: 'faccine',
    portata: 55,
    scalino: 'tosto',   difficolta: 'tosto',   partite: 3,
    racconto: 'Le maschere si somigliano tutte. Guardale bene.' },
  { chiave: 'astronave', nome: "L'astronave",      tema: 'spazio',
    portata: 60,
    scalino: 'tosto',   difficolta: 'tosto',   partite: 3,
    racconto: 'Il portello si apre solo con il codice giusto.' },
]

export const QUANTE_TAPPE = CAMPAGNA.length

export const tappa = indice => CAMPAGNA[Math.max(0, Math.min(indice, CAMPAGNA.length - 1))]

export const scalino = chiave => SCALINI.find(s => s.chiave === chiave) || SCALINI[0]

/* Le tappe di uno scalino, per la mappa: la campagna si guarda a blocchi,
   non come una fila di nove numeri. */
export const tappeDelloScalino = chiave =>
  CAMPAGNA.map((t, i) => ({ ...t, indice: i })).filter(t => t.scalino === chiave)

export function guastiDellaCampagna(campagna = CAMPAGNA, temi, scaglioni) {
  const guasti = []
  const viste = new Set()
  for (const [i, t] of campagna.entries()) {
    const dove = `tappa ${i + 1} ("${t.chiave}")`
    if (viste.has(t.chiave)) guasti.push(`${dove}: chiave ripetuta`)
    viste.add(t.chiave)
    if (!t.nome || !t.racconto) guasti.push(`${dove}: senza nome o senza racconto`)
    if (temi && !temi[t.tema]) guasti.push(`${dove}: il tema "${t.tema}" non esiste`)
    if (scaglioni && !scaglioni.some(s => s.chiave === t.difficolta))
      guasti.push(`${dove}: la difficoltà "${t.difficolta}" non esiste`)
    if (!SCALINI.some(s => s.chiave === t.scalino))
      guasti.push(`${dove}: lo scalino "${t.scalino}" non esiste`)
    if (!(t.partite >= 1)) guasti.push(`${dove}: ${t.partite} partite`)
  }
  /* gli scalini devono arrivare in fila e nessuno può restare vuoto: una
     mappa con un blocco senza tappe è un buco a schermo */
  const ordine = SCALINI.map(s => s.chiave)
  const fila = campagna.map(t => ordine.indexOf(t.scalino))
  if (fila.some((n, i) => i > 0 && n < fila[i - 1]))
    guasti.push('gli scalini non sono in fila: una tappa facile viene dopo una tosta')
  for (const s of SCALINI)
    if (!campagna.some(t => t.scalino === s.chiave))
      guasti.push(`lo scalino "${s.chiave}" non ha nemmeno una tappa`)
  /* due tappe di fila con lo stesso vestito non sono due posti diversi */
  for (let i = 1; i < campagna.length; i++)
    if (campagna[i].tema === campagna[i - 1].tema)
      guasti.push(`tappa ${i + 1}: stesso tema della precedente ("${campagna[i].tema}")`)
  return guasti
}
