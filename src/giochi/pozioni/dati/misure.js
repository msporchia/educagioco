/* ═══════════════════════════════════════════════════════════════════
   LE MISURE — tre famiglie, tre unità a testa, tre attrezzi a testa

   Il laboratorio è rifatto da zero attorno a una cosa sola: **un
   attrezzo conta in una unità, e arriva fin lì**. La bilancia da
   cucina conta in grammi e arriva a cinque chili; quella del mercato
   conta in etti e arriva a venti; quella del magazzino conta in chili.
   La ricetta parla come le pare — «1,5 kg», «35 hg», «6000 g» — e il
   gioco è tutto lì: leggere l'unità, scegliere l'attrezzo che ci
   arriva, e tradurre.

   Le tre famiglie hanno **la stessa forma** — una unità grande (G),
   una di mezzo (M), una piccola (P) — e per questo la scaletta della
   campagna si scrive una volta sola (`campagna.js`) e si ripete tre
   volte con altri nomi. Non sono però la stessa scala: fra chilo e
   grammo ci sono tre scalini, fra metro e centimetro due. È voluto —
   il centimetro è l'unità che un bambino ha sul righello, il
   millimetro no — e il motore conta gli scalini invece di darli per
   scontati.

   Tutto quello che è un numero sta **in unità base** (grammi,
   millimetri, millilitri) come intero: niente virgole nel motore, la
   virgola compare solo quando si scrive a schermo.
   ═══════════════════════════════════════════════════════════════════ */

/* quanto vale ogni unità nella base della sua famiglia */
export const VALE = {
  kg: 1000, hg: 100, dag: 10, g: 1,
  m: 1000, dm: 100, cm: 10, mm: 1,
  l: 1000, dl: 100, cl: 10, ml: 1,
}

/* ── le taglie degli attrezzi ──
   Scritte in multipli dell'unità grande, così valgono per tutte e tre
   le famiglie: il pezzo più piccolo della bilancia da cucina è 0,05 kg
   = 50 g, quello del metro a nastro è 0,05 m = 5 cm. Il pezzo più
   piccolo divide tutti gli altri (il test lo controlla): è la
   condizione perché «prendi sempre il pezzo più grande» componga
   qualunque dose che ci sta.

     P  conta nella piccola, arriva a 5 grandi
     M  conta nella media, arriva a 20 grandi
     G  conta nella grande, arriva a 100 grandi

   I limiti non sono un dettaglio: sono **il motivo di scegliere**. Otto
   chili sulla bilancia dei grammi non ci stanno, e la tappa in cui
   arriva la bilancia degli etti esiste perché lì si capisce che quando
   i chili sono tanti si sale di unità. */
export const TAGLIE = {
  P: { limite: 5,   pezzi: [0.05, 0.1, 0.2, 0.5, 1, 2] },
  M: { limite: 20,  pezzi: [0.1, 0.2, 0.5, 1, 2, 5, 10] },
  G: { limite: 100, pezzi: [1, 2, 5, 10, 20, 50] },
}
export const ORDINE_TAGLIE = ['P', 'M', 'G']

/* Gli attrezzi si chiamano come li chiamerebbe un bambino, e il nome
   dice già la taglia. Il `pezzo` è come si chiama quello che si posa:
   un peso sul piatto, un pezzo di nastro, un misurino versato. */
const FAMIGLIE_GREZZE = [
  { chiave: 'massa', nome: 'I pesi', gesto: 'pesa', verbo: 'Pesa', emoji: '⚖️',
    di: 'polvere', tipo: 'polvere',
    unita: { G: 'kg', M: 'hg', P: 'g' }, scala: ['kg', 'hg', 'dag', 'g'],
    parole: { G: ['chilo', 'chili'], M: ['etto', 'etti'], P: ['grammo', 'grammi'] },
    dove: 'sulla bilancia', cosa: 'una bilancia', pezzo: 'peso',
    strumenti: {
      P: { chiave: 'cucina',    nome: 'bilancia da cucina',     emoji: '⚖️' },
      M: { chiave: 'mercato',   nome: 'bilancia del mercato',   emoji: '🧺' },
      G: { chiave: 'magazzino', nome: 'bilancia del magazzino', emoji: '📦' },
    } },
  { chiave: 'lunghezza', nome: 'Le lunghezze', gesto: 'taglia', verbo: 'Taglia', emoji: '📏',
    di: 'radice', tipo: 'radice',
    unita: { G: 'm', M: 'dm', P: 'cm' }, scala: ['m', 'dm', 'cm', 'mm'],
    parole: { G: ['metro', 'metri'], M: ['decimetro', 'decimetri'], P: ['centimetro', 'centimetri'] },
    dove: 'sul metro', cosa: 'un metro', pezzo: 'pezzo',
    strumenti: {
      P: { chiave: 'nastro',  nome: 'metro a nastro',      emoji: '📏' },
      M: { chiave: 'spanne',  nome: 'corda a spanne',      emoji: '🪢' },
      G: { chiave: 'rotella', nome: 'rotella da cantiere', emoji: '🧵' },
    } },
  { chiave: 'capacita', nome: 'I liquidi', gesto: 'versa', verbo: 'Versa', emoji: '🫗',
    di: 'liquido', tipo: 'liquido',
    unita: { G: 'l', M: 'dl', P: 'ml' }, scala: ['l', 'dl', 'cl', 'ml'],
    parole: { G: ['litro', 'litri'], M: ['decilitro', 'decilitri'], P: ['millilitro', 'millilitri'] },
    dove: 'nella caraffa', cosa: 'una caraffa', pezzo: 'misurino',
    strumenti: {
      P: { chiave: 'caraffa', nome: 'caraffa graduata',  emoji: '🫙' },
      M: { chiave: 'brocca',  nome: 'brocca a bicchieri', emoji: '🥛' },
      G: { chiave: 'botte',   nome: 'botte',              emoji: '🛢️' },
    } },
]

/* gli attrezzi con i numeri già in unità base: `limite` e `pezzi` sono
   interi, e `unita` è quella in cui l'attrezzo conta */
function attrezzoCompleto(fam, taglia) {
  const s = fam.strumenti[taglia]
  const G = VALE[fam.unita.G], unita = fam.unita[taglia]
  return {
    ...s, taglia, famiglia: fam.chiave, unita, gesto: fam.gesto,
    limite: Math.round(TAGLIE[taglia].limite * G),
    pezzi: TAGLIE[taglia].pezzi.map(p => Math.round(p * G)),
  }
}

export const FAMIGLIE = FAMIGLIE_GREZZE.map(f => ({
  ...f,
  strumenti: Object.fromEntries(ORDINE_TAGLIE.map(t => [t, attrezzoCompleto(f, t)])),
}))

export const FAMIGLIA = Object.fromEntries(FAMIGLIE.map(f => [f.chiave, f]))

/* tutti gli attrezzi per chiave: `STRUMENTO.mercato` */
export const STRUMENTO = Object.fromEntries(
  FAMIGLIE.flatMap(f => ORDINE_TAGLIE.map(t => [f.strumenti[t].chiave, f.strumenti[t]])))

/* la famiglia di un'unità: `famigliaDi('hg')` → la massa */
export const famigliaDi = u => FAMIGLIE.find(f => f.scala.includes(u)) || null

/* ── quanto è grande, detto con una cosa che si ha in mano ──
   Il pezzo che le tabelle di scuola non danno mai. Parole e non
   disegnini: qualunque icona somiglierebbe a uno degli attrezzi sullo
   scaffale, e l'attrezzo si sceglierebbe accoppiando i simboli. */
export const QUANTO_E = {
  kg: 'un pacco di zucchero', hg: 'un etto di prosciutto', g: 'una graffetta',
  m: 'un passo lungo', dm: 'una spanna di mano', cm: 'la larghezza di un dito',
  l: 'una bottiglia grande', dl: 'un bicchiere', ml: 'una goccia',
}

/* ---------- la dispensa ----------
   Nessun ingrediente può essere un recipiente: 🧪 e 🍯 stavano accanto
   alla dose e somigliavano agli attrezzi sullo scaffale, così l'attrezzo
   si sceglieva accoppiando le figure. Qui dentro solo bestie, piante e
   cose del cielo. Il `tipo` dice il gesto: la polvere si pesa, il
   liquido si versa, la radice si taglia — ed è la prima cosa che il
   gioco chiede di sapere. */
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
  { nome: 'Elisir di Volo',             emoji: '🪽', colore: '#6ec6ff' },
  { nome: 'Filtro della Risata',        emoji: '😂', colore: '#f2c33d' },
  { nome: 'Pozione della Forza',        emoji: '💪', colore: '#c0453f' },
  { nome: 'Sciroppo dei Sogni',         emoji: '🌜', colore: '#8b7ed8' },
  { nome: 'Elisir di Velocità',         emoji: '⚡', colore: '#ffd400' },
  { nome: 'Pozione Parlante',           emoji: '🗣️', colore: '#4bb37b' },
  { nome: 'Filtro Antipuzza',           emoji: '🌸', colore: '#e58fb8' },
  { nome: 'Pozione del Gigante',        emoji: '🗿', colore: '#8d9aa5' },
]

export const CLIENTI = ['🧙', '🧝', '🧚', '🧛', '🧜', '🦉', '🐈‍⬛', '🐸', '🦇', '🧌', '👽', '🤖']

/* ═══════════ il colore del calderone ═══════════
   Media geometrica dei canali: giallo e blu fanno verde, con la media
   aritmetica farebbero grigio, e un bambino che rovescia il giallo nel
   blu si aspetta il verde. */
export function mescola(colori, vuoto = '#4b3f7d') {
  if (!colori || !colori.length) return vuoto
  const canali = colori.map(h => [1, 3, 5].map(i => Math.max(10, parseInt(h.slice(i, i + 2), 16))))
  const uno = n => Math.round(canali.reduce((p, c) => p * c[n], 1) ** (1 / canali.length))
  return '#' + [0, 1, 2].map(n => uno(n).toString(16).padStart(2, '0')).join('')
}

/* ── il controllo di forma ── */
export function guastiDelleMisure() {
  const g = []
  for (const f of FAMIGLIE) {
    const dove = `famiglia "${f.chiave}"`
    for (const t of ORDINE_TAGLIE) {
      const u = f.unita[t]
      if (!f.scala.includes(u)) g.push(`${dove}: l'unità ${t} (${u}) non sta nella scala`)
      const s = f.strumenti[t]
      const qui = `${dove}, ${s.nome}`
      if (!s.chiave || !s.nome || !s.emoji) g.push(`${qui}: senza chiave, nome o emoji`)
      /* i pezzi devono essere interi nell'unità in cui l'attrezzo conta:
         un peso da mezzo etto su una bilancia che conta in etti è un
         attrezzo che non si legge */
      for (const p of s.pezzi)
        if (p % VALE[u] !== 0) g.push(`${qui}: un pezzo da ${p} non è intero in ${u}`)
      if (s.limite % VALE[u] !== 0) g.push(`${qui}: il limite non è intero in ${u}`)
      const [minimo, ...altri] = s.pezzi
      if (altri.some(p => p % minimo !== 0))
        g.push(`${qui}: il pezzo più piccolo (${minimo}) non divide tutti gli altri`)
      if (s.pezzi.some((p, i) => i && p <= s.pezzi[i - 1])) g.push(`${qui}: i pezzi non salgono`)
      if (s.pezzi[s.pezzi.length - 1] > s.limite) g.push(`${qui}: un pezzo è più grande del limite`)
    }
    /* la scala scende di ×10 a ogni scalino, se no «conta gli scalini» è
       una bugia */
    for (let i = 1; i < f.scala.length; i++)
      if (VALE[f.scala[i - 1]] !== VALE[f.scala[i]] * 10)
        g.push(`${dove}: fra ${f.scala[i - 1]} e ${f.scala[i]} non c'è un ×10`)
    for (const u of f.scala) if (!(u in QUANTO_E) && u !== 'dag' && u !== 'mm' && u !== 'cl')
      g.push(`${dove}: manca «quanto è» per ${u}`)
  }
  const chiavi = Object.keys(STRUMENTO)
  if (chiavi.length !== FAMIGLIE.length * ORDINE_TAGLIE.length) g.push('due attrezzi con la stessa chiave')
  const nomi = new Set()
  for (const i of INGREDIENTI) {
    if (nomi.has(i.nome)) g.push(`ingrediente "${i.nome}" ripetuto`)
    nomi.add(i.nome)
    if (!i.famiglia) g.push(`ingrediente "${i.nome}": tipo "${i.tipo}" senza famiglia`)
  }
  for (const f of FAMIGLIE)
    if (INGREDIENTI.filter(i => i.famiglia === f.chiave).length < 4)
      g.push(`famiglia "${f.chiave}": meno di quattro ingredienti, una ricetta da tre più un distrattore non si compone`)
  return g
}

/* ═══════════ scrivere una misura ═══════════
   Dalla base all'unità chiesta, e con la virgola italiana. `inUnita`
   torna un numero (anche con la virgola: 250 g in hg fanno 2,5), e
   `scrivi` lo mette in parole: «1,5 kg». Stanno qui e non nel motore
   perché le tappe si scrivono a mano con dei numeri, e il testo della
   dose deve esistere già nel dato. */
export const inUnita = (base, u) => Math.round(base / VALE[u] * 1e6) / 1e6
export const numero = v => String(v).replace('.', ',')
export const scrivi = (base, u) => numero(inUnita(base, u)) + ' ' + u
