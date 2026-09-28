// Dodici tappe in quattro scalini, ognuna con un mondo diverso: vedi
// docs/conta/regole.md.

export const SCALINI = [
  { chiave: 'prato',    nome: 'Nel prato',    icona: '🌾',
    dritta: 'Si conta fino a cinque.' },
  { chiave: 'fattoria', nome: 'La fattoria',  icona: '🐄',
    dritta: 'Si arriva fino a dieci, e i numeri non cambiano se cambia il posto.' },
  { chiave: 'bosco',    nome: 'Nel bosco',    icona: '🌲',
    dritta: 'Gli insiemi: quelli giusti, tutti insieme, e quelli dentro gli altri.' },
  { chiave: 'mercato',  nome: 'Al mercato',   icona: '🧺',
    dritta: 'Uno in più, uno in meno, due mucchi messi insieme.' },
]

export const CAMPAGNA = [
  { chiave: 'primo-gregge', nome: 'Il primo gregge', mondo: 'prato', verbo: 'quanti',
    portata: 0, scuola: 'numeri',
    scalino: 'prato', partite: 4, min: 1, max: 5, premio: 1, disposizione: 'fila',
    racconto: 'Contali uno per uno: sono in fila apposta.' },
  { chiave: 'cortile',      nome: 'Il cortile',       mondo: 'pollaio', verbo: 'quanti',
    portata: 2, scuola: 'numeri',
    scalino: 'prato', partite: 4, min: 1, max: 5, premio: 1, disposizione: 'sparsa',
    racconto: 'Adesso sono sparsi: contali lo stesso, uno alla volta.' },
  { chiave: 'la-cesta',     nome: 'La cesta',         mondo: 'stagno', verbo: 'porta',
    portata: 4, scuola: 'numeri',
    scalino: 'prato', partite: 4, min: 1, max: 5, premio: 1,
    racconto: 'Toccane solo quante te ne chiedo, poi conferma.' },

  { chiave: 'il-branco',    nome: 'Il branco',        mondo: 'bosco', verbo: 'quanti',
    portata: 8, scuola: 'numeri',
    scalino: 'fattoria', partite: 5, min: 4, max: 10, premio: 2,
    racconto: 'Adesso sono di più: prenditi il tempo che ti serve.' },
  { chiave: 'la-consegna',  nome: 'La consegna',      mondo: 'mare', verbo: 'porta',
    portata: 10, scuola: 'numeri',
    scalino: 'fattoria', partite: 5, min: 3, max: 10, premio: 2,
    racconto: 'Porta esattamente quelli che ti chiedo, non uno di più.' },
  { chiave: 'due-recinti',  nome: 'Due recinti',      mondo: 'prato', verbo: 'dipiu',
    portata: 12, scuola: 'numeri',
    scalino: 'fattoria', partite: 4, min: 2, max: 8, premio: 2,
    racconto: 'Guarda bene: a volte sono proprio uguali.' },
  { chiave: 'lo-sparpaglio', nome: 'Lo sparpaglio',   mondo: 'pollaio', verbo: 'stessi',
    portata: 14, scuola: 'numeri',
    scalino: 'fattoria', partite: 4, min: 5, max: 9, premio: 3,
    racconto: 'Si spargono per il cortile, ma sono sempre gli stessi.' },

  { chiave: 'gli-intrusi',  nome: 'Gli intrusi',      mondo: 'bosco', verbo: 'quantiDi',
    portata: 18, scuola: 'insiemi',
    scalino: 'bosco', partite: 5, min: 3, max: 8, premio: 3,
    racconto: 'Non tutto quello che vedi è un animale: conta solo i giusti.' },
  { chiave: 'tutti-insieme', nome: 'Tutti insieme',   mondo: 'mare', verbo: 'insieme',
    portata: 20, scuola: 'insiemi',
    scalino: 'bosco', partite: 4, min: 2, max: 5, premio: 3,
    racconto: 'Due specie diverse, ma stanno tutte e due dentro «animali».' },
  { chiave: 'il-cerchio',   nome: 'Il cerchio grande', mondo: 'stagno', verbo: 'inclusione',
    portata: 22, scuola: 'insiemi',
    alterna: ['dipiu'],
    scalino: 'bosco', partite: 4, min: 2, max: 6, premio: 4,
    racconto: 'A volte due mucchi diversi, a volte le une dentro le altre.' },

  { chiave: 'ne-arriva-una', nome: "Ne arriva un'altra", mondo: 'pollaio', verbo: 'piuUno',
    portata: 26, scuola: 'numeri',
    scalino: 'mercato', partite: 5, min: 2, max: 8, premio: 4,
    racconto: 'Guarda cosa succede, poi dimmi quante sono adesso.' },
  { chiave: 'il-banco',     nome: 'Il banco della frutta', mondo: 'mercato', verbo: 'unisci',
    portata: 28, scuola: 'numeri',
    scalino: 'mercato', partite: 5, min: 2, max: 6, premio: 4,
    racconto: 'Due ceste diverse: quante cose ci sono, tutte insieme?' },
]

export const QUANTE_TAPPE = CAMPAGNA.length

export const tappa = indice => CAMPAGNA[Math.max(0, Math.min(indice, CAMPAGNA.length - 1))]

export const scalino = chiave => SCALINI.find(s => s.chiave === chiave) || SCALINI[0]

export const tappeDelloScalino = chiave =>
  CAMPAGNA.map((t, i) => ({ ...t, indice: i })).filter(t => t.scalino === chiave)

function mondoBasta(m, richiede = {}) {
  const animali = m.specie.filter(s => s.categoria === 'animali').length
  const cose = m.specie.filter(s => s.categoria === 'cose').length
  if ((richiede.animali || 0) > animali) return false
  if ((richiede.cose || 0) > cose) return false
  if ((richiede.totale || 0) > m.specie.length) return false
  return true
}

export function guastiDellaCampagna(campagna = CAMPAGNA, mondi, verbi) {
  const guasti = []
  const viste = new Set()
  for (const [i, t] of campagna.entries()) {
    const dove = `tappa ${i + 1} ("${t.chiave}")`
    if (viste.has(t.chiave)) guasti.push(`${dove}: chiave ripetuta`)
    viste.add(t.chiave)
    if (!t.nome || !t.racconto) guasti.push(`${dove}: senza nome o senza racconto`)
    if (!(t.partite >= 1)) guasti.push(`${dove}: ${t.partite} domande`)
    if (!(t.min >= 0) || !(t.max >= t.min)) guasti.push(`${dove}: intervallo ${t.min}..${t.max} impossibile`)
    if (!(t.premio > 0)) guasti.push(`${dove}: premio ${t.premio}`)
    if (!SCALINI.some(s => s.chiave === t.scalino))
      guasti.push(`${dove}: lo scalino "${t.scalino}" non esiste`)

    const m = mondi && mondi[t.mondo]
    // il verbo della tappa e quelli di `alterna` si controllano allo
    // stesso modo: un verbo alternato che il mondo non regge fa
    // schiantare la seconda domanda, a tappa già cominciata
    for (const chiave of [t.verbo, ...(t.alterna || [])]) {
      const v = verbi && verbi[chiave]
      if (verbi && !v) guasti.push(`${dove}: il verbo "${chiave}" non esiste`)
      if (m && v && !mondoBasta(m, v.richiede))
        guasti.push(`${dove}: il mondo "${t.mondo}" non ha abbastanza specie per "${chiave}"`)
    }
    if (mondi && !m) guasti.push(`${dove}: il mondo "${t.mondo}" non esiste`)
    if ((t.alterna || []).includes(t.verbo))
      guasti.push(`${dove}: "${t.verbo}" si alterna con sé stesso`)
  }
  const ordine = SCALINI.map(s => s.chiave)
  const fila = campagna.map(t => ordine.indexOf(t.scalino))
  if (fila.some((n, i) => i > 0 && n < fila[i - 1]))
    guasti.push('gli scalini non sono in fila: una tappa di prima viene dopo una di dopo')
  for (const s of SCALINI)
    if (!campagna.some(t => t.scalino === s.chiave))
      guasti.push(`lo scalino "${s.chiave}" non ha nemmeno una tappa`)
  for (let i = 1; i < campagna.length; i++)
    if (campagna[i].mondo === campagna[i - 1].mondo)
      guasti.push(`tappa ${i + 1}: stesso mondo della precedente ("${campagna[i].mondo}")`)
  return guasti
}
