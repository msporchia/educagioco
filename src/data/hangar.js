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

// un pezzo è `t:<tinta>`, `d:<disegno>` o `s:<stemma>`
export const pezzo = (tipo, id) => tipo + ':' + id
export const tipoDi = p => p.slice(0, 1)
export const idDi = p => p.slice(2)

// quello che si ha senza aver vinto niente
export const DI_SERIE = ['t:bianco', 't:azzurro', 't:rosso', 't:giallo']

export const REGALI_PER_TAPPA = 2
export const BOSS_VOLO_OGNI = 3          // il volo ha un boss ogni tre livelli

// Le tappe regalano tinte, disegni e stemmi a turno, nell'ordine della
// fila; il volo regala i pezzi suoi, e i migliori solo dalle navi madri alte.
const intreccia = (...file) => {
  const out = []
  for (let i = 0; file.some(f => i < f.length); i++)
    for (const f of file) if (i < f.length) out.push(f[i])
  return out
}
const ordinarie = TINTE.filter(t => !t.lucida).map(t => pezzo('t', t.id))
  .filter(p => !DI_SERIE.includes(p))
export const FILA_REGALI = intreccia(
  ordinarie,
  DISEGNI.map(d => pezzo('d', d)),
  STEMMI.filter(s => s !== 'stella').map(s => pezzo('s', s)),
)
// `da`: il livello da cui una nave madre del volo può regalarlo
export const REGALI_VOLO = [
  { p: 's:stella', da: 3 }, { p: 't:argento', da: 6 }, { p: 't:bronzo', da: 9 },
  { p: 't:smeraldo', da: 12 }, { p: 't:zaffiro', da: 15 }, { p: 't:rubino', da: 18 },
  { p: 't:oro', da: 21 },
]

export const regaliDellaTappa = pos =>
  FILA_REGALI.slice(pos * REGALI_PER_TAPPA, (pos + 1) * REGALI_PER_TAPPA)
