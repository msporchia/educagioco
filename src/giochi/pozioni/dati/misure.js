// Tre famiglie di misure, tre unità a testa. Le regole in
// docs/pozioni/regole.md.

// quanto vale ogni unità nella base della sua famiglia
export const VALE = {
  kg: 1000, hg: 100, dag: 10, g: 1,
  m: 1000, dm: 100, cm: 10, mm: 1,
  l: 1000, dl: 100, cl: 10, ml: 1,
}

export const FAMIGLIE = [
  { chiave: 'massa', nome: 'I pesi', emoji: '⚖️', tipo: 'polvere',
    unita: { G: 'kg', M: 'hg', P: 'g' }, scala: ['kg', 'hg', 'dag', 'g'],
    parole: { G: ['chilo', 'chili'], M: ['etto', 'etti'], P: ['grammo', 'grammi'] } },
  { chiave: 'lunghezza', nome: 'Le lunghezze', emoji: '📏', tipo: 'radice',
    unita: { G: 'm', M: 'dm', P: 'cm' }, scala: ['m', 'dm', 'cm', 'mm'],
    parole: { G: ['metro', 'metri'], M: ['decimetro', 'decimetri'], P: ['centimetro', 'centimetri'] } },
  { chiave: 'capacita', nome: 'I liquidi', emoji: '🫗', tipo: 'liquido',
    unita: { G: 'l', M: 'dl', P: 'ml' }, scala: ['l', 'dl', 'cl', 'ml'],
    parole: { G: ['litro', 'litri'], M: ['decilitro', 'decilitri'], P: ['millilitro', 'millilitri'] } },
]

export const FAMIGLIA = Object.fromEntries(FAMIGLIE.map(f => [f.chiave, f]))
export const famigliaDi = u => FAMIGLIE.find(f => f.scala.includes(u)) || null

// quanto è grande, con una cosa che si ha in mano invece che un'icona
export const QUANTO_E = {
  kg: 'un pacco di zucchero', hg: 'un etto di prosciutto', g: 'una graffetta',
  m: 'un passo lungo', dm: 'una spanna di mano', cm: 'la larghezza di un dito',
  l: 'una bottiglia grande', dl: 'un bicchiere', ml: 'una goccia',
}

// solo bestie, piante e cose del cielo: nessun ingrediente è un recipiente
export const INGREDIENTI = [
  { emoji: '🐉', nome: 'bava di drago',     tipo: 'liquido', colore: '#5ec46a' },
  { emoji: '🐸', nome: 'essenza di rana',   tipo: 'liquido', colore: '#7fd4c1' },
  { emoji: '🌊', nome: 'acqua di sirena',   tipo: 'liquido', colore: '#4aa3ff' },
  { emoji: '🦉', nome: 'sciroppo di gufo',  tipo: 'liquido', colore: '#e2a53a' },
  { emoji: '🩸', nome: 'succo di rapa',     tipo: 'liquido', colore: '#d0455e' },
  { emoji: '🫧', nome: 'schiuma di nuvola', tipo: 'liquido', colore: '#c3d9ef' },
  { emoji: '🍇', nome: 'mosto di strega',   tipo: 'liquido', colore: '#8b5cc4' },
  { emoji: '🌙', nome: 'polvere di luna',   tipo: 'polvere', colore: '#d9defc' },
  { emoji: '⭐', nome: 'stelle tritate',     tipo: 'polvere', colore: '#ffd85e' },
  { emoji: '🍄', nome: 'funghi secchi',     tipo: 'polvere', colore: '#c06a4a' },
  { emoji: '🐚', nome: 'conchiglia pestata', tipo: 'polvere', colore: '#eef1f5' },
  { emoji: '☄️', nome: 'cenere di cometa',  tipo: 'polvere', colore: '#8b8f9a' },
  { emoji: '🌰', nome: 'ghiande macinate',  tipo: 'polvere', colore: '#a97142' },
  { emoji: '🌿', nome: 'radice di mandragora', tipo: 'radice', colore: '#4f9e4a' },
  { emoji: '🪵', nome: 'ramo di quercia',      tipo: 'radice', colore: '#a9713c' },
  { emoji: '🦴', nome: 'osso di troll',        tipo: 'radice', colore: '#e8e2d2' },
  { emoji: '🪱', nome: 'verme di palude',      tipo: 'radice', colore: '#d08fa0' },
  { emoji: '🌾', nome: 'stelo dorato',         tipo: 'radice', colore: '#e0c25a' },
].map(i => ({ ...i, famiglia: FAMIGLIE.find(f => f.tipo === i.tipo).chiave }))

export const POZIONI = [
  { nome: 'Pozione del Coraggio',       emoji: '🦁', colore: '#e2603a' },
  { nome: 'Pozione dell\'Invisibilità', emoji: '👻', colore: '#9fb8d4' },
  { nome: 'Elisir di Volo',             emoji: '🪶', colore: '#6ec6ff' },
  { nome: 'Filtro della Risata',        emoji: '😂', colore: '#f2c33d' },
  { nome: 'Pozione della Forza',        emoji: '💪', colore: '#c0453f' },
  { nome: 'Sciroppo dei Sogni',         emoji: '🌜', colore: '#8b7ed8' },
  { nome: 'Elisir di Velocità',         emoji: '⚡', colore: '#ffd400' },
  { nome: 'Pozione Parlante',           emoji: '🗣️', colore: '#4bb37b' },
  { nome: 'Filtro Antipuzza',           emoji: '🌸', colore: '#e58fb8' },
  { nome: 'Pozione del Gigante',        emoji: '🗿', colore: '#8d9aa5' },
]

export const CLIENTI = ['🧙', '🧝', '🧚', '🧛', '🧜', '🦉', '🐈‍⬛', '🐸', '🦇', '🧌', '👽', '🤖']

// media geometrica dei canali: giallo e blu fanno verde, l'aritmetica farebbe grigio
export function mescola(colori, vuoto = '#4b3f7d') {
  if (!colori || !colori.length) return vuoto
  const canali = colori.map(h => [1, 3, 5].map(i => Math.max(10, parseInt(h.slice(i, i + 2), 16))))
  const uno = n => Math.round(canali.reduce((p, c) => p * c[n], 1) ** (1 / canali.length))
  return '#' + [0, 1, 2].map(n => uno(n).toString(16).padStart(2, '0')).join('')
}

export function guastiDelleMisure() {
  const g = []
  for (const f of FAMIGLIE) {
    const dove = `famiglia "${f.chiave}"`
    for (const u of Object.values(f.unita)) if (!f.scala.includes(u)) g.push(`${dove}: l'unità ${u} non sta nella scala`)
    for (let i = 1; i < f.scala.length; i++)
      if (VALE[f.scala[i - 1]] !== VALE[f.scala[i]] * 10)
        g.push(`${dove}: fra ${f.scala[i - 1]} e ${f.scala[i]} non c'è un ×10`)
    for (const u of f.scala) if (!(u in QUANTO_E) && u !== 'dag' && u !== 'mm' && u !== 'cl')
      g.push(`${dove}: manca «quanto è» per ${u}`)
  }
  const nomi = new Set()
  for (const i of INGREDIENTI) {
    if (nomi.has(i.nome)) g.push(`ingrediente "${i.nome}" ripetuto`)
    nomi.add(i.nome)
    if (!i.famiglia) g.push(`ingrediente "${i.nome}": tipo "${i.tipo}" senza famiglia`)
  }
  for (const f of FAMIGLIE)
    if (INGREDIENTI.filter(i => i.famiglia === f.chiave).length < 4)
      g.push(`famiglia "${f.chiave}": meno di quattro ingredienti, una pozione grande non si compone`)
  return g
}

// Dalla base all'unità chiesta, con la virgola italiana. Stanno qui e
// non nel motore perché le tappe si scrivono a mano con dei numeri, e il
// testo della dose deve esistere già nel dato.
export const inUnita = (base, u) => Math.round(base / VALE[u] * 1e6) / 1e6
export const numero = v => String(v).replace('.', ',')
export const scrivi = (base, u) => numero(inUnita(base, u)) + ' ' + u
