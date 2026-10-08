// L'hangar degli asteroidi: i pezzi con cui si dipinge la nave, e quale
// boss li regala. Vedi docs/asteroidi/hangar.md.
// Gli id sono chiavi di salvataggio: non si rinominano.

// `lucida`: una tinta speciale, col riflesso del metallo (le regala il volo)
export const TINTE = [
  { id: 'bianco', c: '#f1f1f1' }, { id: 'azzurro', c: '#4cc9f0' },
  { id: 'rosso', c: '#e63946' }, { id: 'giallo', c: '#ffd60a' },
  { id: 'arancio', c: '#f77f00' }, { id: 'lime', c: '#9ef01a' },
  { id: 'verde', c: '#2a9d8f' }, { id: 'blu', c: '#3a86ff' },
  { id: 'viola', c: '#8338ec' }, { id: 'rosa', c: '#ff70a6' },
  { id: 'nero', c: '#2b2d42' }, { id: 'grigio', c: '#8d99ae' },
  { id: 'marrone', c: '#8b5a2b' }, { id: 'menta', c: '#7ae7c7' },
  { id: 'corallo', c: '#ff7f6b' }, { id: 'lavanda', c: '#b8a1ff' },
  { id: 'notte', c: '#1d3557' }, { id: 'sabbia', c: '#e9c46a' },
  { id: 'ciliegia', c: '#9d0208' }, { id: 'turchese', c: '#00b4a6' },
  { id: 'oro', c: '#e0b020', lucida: true }, { id: 'argento', c: '#c0c7d4', lucida: true },
  { id: 'bronzo', c: '#b0703a', lucida: true }, { id: 'smeraldo', c: '#1fae6a', lucida: true },
  { id: 'rubino', c: '#d0103a', lucida: true }, { id: 'zaffiro', c: '#2050d0', lucida: true },
]

// i disegni sulle ali e gli stemmi: li disegna grafica/livrea.js, qui solo gli id
export const DISEGNI = ['fiamme', 'strisce', 'punte', 'scacchi', 'pois', 'onde',
                        'zigzag', 'stelline', 'banda', 'cuori', 'squame', 'gessato']
export const STEMMI = ['stella', 'fulmine', 'cuore', 'corona', 'zampa', 'alieno', 'pianeta',
                       'luna', 'razzo', 'fiore', 'fiocco', 'diamante', 'sole', 'ancora',
                       'nota', 'quadrifoglio', 'scudo']

// i posti della nave che si colorano: ognuno sblocca i suoi colori
export const POSTI_COLORE = ['scafo', 'ali', 'fiamma', 'colDisegno', 'colStemma']

// un pezzo è `<posto>:<tinta>`, `d:<disegno>` o `s:<stemma>`; `t:<tinta>` è un
// colore dei salvataggi vecchi, che valeva per tutti i posti
export const pezzo = (tipo, id) => tipo + ':' + id
export const tipoDi = p => p.slice(0, p.indexOf(':'))
export const idDi = p => p.slice(p.indexOf(':') + 1)

// quello che si ha senza aver vinto niente: quattro colori in ogni posto
export const TINTE_DI_SERIE = ['bianco', 'azzurro', 'rosso', 'giallo']
export const DI_SERIE = POSTI_COLORE.flatMap(c => TINTE_DI_SERIE.map(t => pezzo(c, t)))

export const REGALI_PER_TAPPA = 2
export const BOSS_VOLO_OGNI = 3          // il volo ha un boss ogni tre livelli

// Le tappe regalano colori dello scafo, disegni e stemmi a turno, nell'ordine
// della fila; il volo regala i pezzi suoi, poi tutto il resto.
const intreccia = (...file) => {
  const out = []
  for (let i = 0; file.some(f => i < f.length); i++)
    for (const f of file) if (i < f.length) out.push(f[i])
  return out
}
const ordinarie = TINTE.filter(t => !t.lucida && !TINTE_DI_SERIE.includes(t.id)).map(t => t.id)
const lucide = TINTE.filter(t => t.lucida).map(t => t.id)
export const FILA_REGALI = intreccia(
  ordinarie.map(t => pezzo('scafo', t)),
  DISEGNI.map(d => pezzo('d', d)),
  STEMMI.filter(s => s !== 'stella').map(s => pezzo('s', s)),
)
// i pezzi del volo, nell'ordine in cui arrivano
export const REGALI_VOLO = ['s:stella', 'scafo:argento', 'scafo:bronzo', 'scafo:smeraldo',
                            'scafo:zaffiro', 'scafo:rubino', 'scafo:oro']
// i colori degli altri posti li dà solo il volo, un posto per volta
const ALTRI_COLORI = intreccia(...POSTI_COLORE.filter(c => c !== 'scafo')
  .map(c => [...ordinarie, ...lucide].map(t => pezzo(c, t))))
// quello che il volo può dare, in ordine: i suoi, poi quelli delle tappe e gli altri colori a turno
export const CATALOGO_VOLO = [...REGALI_VOLO, ...intreccia(FILA_REGALI, ALTRI_COLORI)]
// quanto spesso la nave madre del volo lascia il pacco, dal livello `da` in su
export const PACCO_VOLO = [
  { da: 0, volte: 1 / 3 }, { da: 6, volte: 1 / 2 }, { da: 9, volte: 2 / 3 }, { da: 12, volte: 1 },
]

export const regaliDellaTappa = pos =>
  FILA_REGALI.slice(pos * REGALI_PER_TAPPA, (pos + 1) * REGALI_PER_TAPPA)
