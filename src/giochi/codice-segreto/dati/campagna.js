// Nove tappe in tre scalini, ognuna con un tema diverso: vedi
// docs/codice-segreto/presentazione.md.

export const SCALINI = [
  { chiave: 'facile',  nome: 'Le prime chiavi', icona: '🗝️',
    dritta: 'Tre caselle e nessun disegno ripetuto.' },
  { chiave: 'normale', nome: 'Serrature vere',  icona: '🔑',
    dritta: 'Quattro caselle, e adesso un disegno può tornare due volte.' },
  { chiave: 'tosto',   nome: 'La cassaforte',   icona: '🔐',
    dritta: 'Sei disegni diversi, e un tabellone più lungo per arrivarci.' },
]

// `portata` (0-100, vedi docs/apprendimento/eta-e-portata.md): niente
// `scuola` qui, il ragionamento deduttivo non lo insegna la scuola, quindi
// non si taglia mai in testa.
export const CAMPAGNA = [
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

  { chiave: 'palestra',  nome: 'La palestra',      tema: 'sport',
    portata: 50,
    scalino: 'tosto',   difficolta: 'tosto',   partite: 3,
    racconto: 'Sei palloni per quattro caselle. Guarda bene prima di posare.' },
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
  const ordine = SCALINI.map(s => s.chiave)
  const fila = campagna.map(t => ordine.indexOf(t.scalino))
  if (fila.some((n, i) => i > 0 && n < fila[i - 1]))
    guasti.push('gli scalini non sono in fila: una tappa facile viene dopo una tosta')
  for (const s of SCALINI)
    if (!campagna.some(t => t.scalino === s.chiave))
      guasti.push(`lo scalino "${s.chiave}" non ha nemmeno una tappa`)
  for (let i = 1; i < campagna.length; i++)
    if (campagna[i].tema === campagna[i - 1].tema)
      guasti.push(`tappa ${i + 1}: stesso tema della precedente ("${campagna[i].tema}")`)
  return guasti
}
