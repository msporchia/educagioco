// Il mazzo: le carte offerte a ogni salita di livello, e come si
// pagano. Il perché del prezzo, della maturità e delle copie oltre il
// tetto nel gioco libero: docs/survivors/regole.md.

export const FASCE = [
  { chiave: 'debole', nome: 'facile', prezzo: 0.15, colore: '#3fa34d' },
  { chiave: 'media',  nome: 'media',  prezzo: 0.50, colore: '#e08c1a' },
  { chiave: 'forte',  nome: 'tosta',  prezzo: 0.85, colore: '#d1481f' },
]

export const fascia = chiave => FASCE.find(f => f.chiave === chiave) || FASCE[0]

// `max` è quante volte si può cumulare, `chiaro` è cosa dà in una riga
// sola (si legge sulla carta prima di sceglierla). `intera: true` vuol
// dire che quello che dà non si può dare a metà (una freccia, un
// cuore): sono le carte che nel gioco libero hanno un tetto vero.
export const MAZZO = [
  { chiave: 'mela',     nome: 'Mela curativa',   icona: '🍎', fascia: 'debole', max: 9, intera: true,
    chiaro: 'ti torna un cuore, subito' },
  // la calamita di base non c'è più (le gemme si prendono a contatto):
  // questa carta è l'unico modo di averne una, il raggio si allarga copia
  // dopo copia
  { chiave: 'magnete',  nome: 'Calamita',        icona: '🧲', fascia: 'debole', max: 5,
    chiaro: 'le gemme vicine volano da te: le copie, a turno, allargano il raggio e tirano più forte' },
  { chiave: 'stella',   nome: 'Stella fortunata',icona: '⭐', fascia: 'debole', max: 4,
    chiaro: 'ogni tanto una freccia fa il doppio del male' },
  { chiave: 'dardo',    nome: 'Dardo di ghiaccio', icona: '🧊', fascia: 'debole', max: 4,
    chiaro: 'ogni tanto una freccia congela chi colpisce' },
  { chiave: 'fantasma', nome: 'Piedi fantasma',  icona: '👻', fascia: 'debole', max: 3,
    chiaro: 'dopo un colpo resti intoccabile più a lungo' },

  { chiave: 'stivali',  nome: 'Stivali leggeri', icona: '👟', fascia: 'media', max: 5,
    chiaro: 'corri di più' },
  { chiave: 'lunghe',   nome: 'Frecce lunghe',   icona: '🎯', fascia: 'media', max: 4,
    chiaro: 'le frecce arrivano molto più lontano' },
  { chiave: 'gelo',     nome: 'Scudo di ghiaccio', icona: '❄️', fascia: 'media', max: 4,
    chiaro: 'ogni tanto un\'ondata di gelo rallenta chi ti è vicino' },
  { chiave: 'gemme',    nome: 'Gemme doppie',    icona: '💎', fascia: 'media', max: 3,
    chiaro: 'ogni gemma vale di più: sali di livello prima' },
  { chiave: 'palla',    nome: 'Cometa in orbita', icona: '☄️', fascia: 'media', max: 4, intera: true,
    chiaro: 'una cometa ti gira intorno e travolge chi tocca' },
  // la chiave resta `occhi` (è nei salvataggi), il nome dice cosa fa
  { chiave: 'occhi',    nome: 'Frecce perforanti', icona: '📌', fascia: 'media', max: 3, intera: true,
    chiaro: 'le frecce passano attraverso i mostri' },
  // le armi che guardano dove corri, non al più vicino: mirare costa, e
  // picchiano più delle altre apposta
  { chiave: 'fendente', nome: 'Fendente',        icona: '⚔️', fascia: 'media', max: 4,
    chiaro: 'un colpo largo davanti a te, dove corri' },

  { chiave: 'frecce',   nome: 'Frecce gemelle',  icona: '🏹', fascia: 'forte', max: 5, intera: true,
    chiaro: 'una freccia in più a ogni tiro' },
  { chiave: 'mani',     nome: 'Mani veloci',     icona: '⚡', fascia: 'forte', max: 5,
    chiaro: 'spari molto più spesso' },
  { chiave: 'grandi',   nome: 'Frecce grosse',   icona: '💥', fascia: 'forte', max: 4,
    chiaro: 'le frecce fanno molto più male' },
  { chiave: 'cuore',    nome: 'Vita aggiuntiva', icona: '❤️', fascia: 'forte', max: 3, intera: true,
    chiaro: 'un cuore in più, e te lo riempie' },
  { chiave: 'fuoco',    nome: 'Anello di fuoco', icona: '🔥', fascia: 'forte', max: 4,
    chiaro: 'ogni tanto esplodi tutto intorno a te' },
  { chiave: 'fulmine',  nome: 'Fulmine',         icona: '🌩️', fascia: 'forte', max: 4,
    chiaro: 'ogni tanto un mostro viene incenerito' },
  { chiave: 'lancia',   nome: 'Lancia',          icona: '🗡️', fascia: 'forte', max: 4,
    chiaro: 'una lancia parte dove corri e trapassa tutti' },
]

export const carta = chiave => MAZZO.find(c => c.chiave === chiave) || null

// Il prezzo (0..1) ha tre pezzi: la fascia, il rincaro della tappa, e la
// maturità (a che punto è quella carta). MATURITA dice quanta strada
// verso 1 mangia l'ultima copia possibile: a 0.7 una carta media
// all'ultimo livello costa quanto una tosta appena vista.
export const MATURITA = 0.7

// da 0 (mai presa) a 1 (l'ultima copia possibile), normalizzata sul max della carta
export const maturita = (lv = 0, max = 1) =>
  max > 1 ? Math.max(0, Math.min(1, lv / (max - 1))) : 0

export const prezzoDomanda = (chiaveFascia, rincaro = 0, lv = 0, max = 1) => {
  const base = Math.max(0, Math.min(1, fascia(chiaveFascia).prezzo + rincaro))
  return base + (1 - base) * MATURITA * maturita(lv, max)
}

// Oltre il tetto (solo dove la partita non finisce): le copie in più
// rendono ogni volta meno (serie geometrica di ragione RESA_OLTRE), e
// la somma di tutte non arriva mai a RESA_TOTALE gradi in più — così il
// mazzo non finisce mai ma nessuno diventa immortale.
export const RESA_OLTRE = 0.6
export const RESA_TOTALE = RESA_OLTRE / (1 - RESA_OLTRE)

export const resa = (lv = 0, max = 1) => {
  if (!(lv > max)) return Math.max(0, lv)
  const n = lv - max
  return max + RESA_TOTALE * (1 - Math.pow(RESA_OLTRE, n))
}

// fin dove si può cumulare una carta: in campagna è sempre il suo max
export const tettoDi = (c, infinita = false) =>
  infinita && !c.intera ? Infinity : c.max

// il prezzo come si vede: cinque pallini, uno ogni due decimi — devono
// dire il prezzo di adesso, non quello della fascia
export const PALLINI = 5

export const palliniDelPrezzo = prezzo =>
  Math.max(1, Math.min(PALLINI, Math.round(prezzo * PALLINI)))

// la fascia più alta che quel prezzo si è già guadagnata: una carta
// debole cresciuta può dire «media» in arancione
export const scalinoDelPrezzo = prezzo => {
  let trovata = FASCE[0]
  for (const f of FASCE) if (prezzo >= f.prezzo - 1e-9) trovata = f
  return trovata
}

export function guastiDelMazzo(mazzo = MAZZO, fasce = FASCE) {
  const guasti = []
  const viste = new Set()
  for (const c of mazzo) {
    const dove = `carta "${c.chiave}"`
    if (viste.has(c.chiave)) guasti.push(`${dove}: chiave ripetuta`)
    viste.add(c.chiave)
    if (!c.nome || !c.icona || !c.chiaro) guasti.push(`${dove}: senza nome, icona o spiegazione`)
    if (!(c.max >= 1)) guasti.push(`${dove}: max ${c.max}`)
    if (!fasce.some(f => f.chiave === c.fascia)) guasti.push(`${dove}: fascia "${c.fascia}" sconosciuta`)
    if (c.nome.length > 22) guasti.push(`${dove}: nome lungo ${c.nome.length} caratteri`)
  }
  for (const f of fasce) {
    const quante = mazzo.filter(c => c.fascia === f.chiave).length
    if (quante < 3) guasti.push(`la fascia "${f.chiave}" ha solo ${quante} carte`)
  }
  for (let i = 1; i < fasce.length; i++)
    if (!(fasce[i].prezzo > fasce[i - 1].prezzo))
      guasti.push(`la fascia "${fasce[i].chiave}" non costa più di "${fasce[i - 1].chiave}"`)
  if (!(fasce[0].prezzo >= 0 && fasce.at(-1).prezzo <= 1))
    guasti.push('i prezzi escono da 0..1: la difficoltà dei quiz è una manopola da 0 a 1')
  if (!(MATURITA > 0 && MATURITA <= 1))
    guasti.push(`la maturità vale ${MATURITA}: non è una fetta di 0..1`)

  for (const c of mazzo) {
    if (!fasce.some(f => f.chiave === c.fascia)) continue
    for (const rincaro of [0, 0.15, 0.3]) {
      let prima = -1
      for (let lv = 0; lv < Math.max(1, c.max); lv++) {
        const p = prezzoDomanda(c.fascia, rincaro, lv, c.max)
        if (!(p >= 0 && p <= 1))
          guasti.push(`carta "${c.chiave}" a livello ${lv} (rincaro ${rincaro}): prezzo ${p.toFixed(3)} fuori da 0..1`)
        if (p < prima - 1e-9)
          guasti.push(`carta "${c.chiave}": a livello ${lv} costa meno che a ${lv - 1}`)
        prima = p
      }
    }
    const nuova = prezzoDomanda(c.fascia, 0, 0, c.max)
    const matura = prezzoDomanda(c.fascia, 0, c.max - 1, c.max)
    if (nuova !== fascia(c.fascia).prezzo)
      guasti.push(`carta "${c.chiave}": la prima copia non costa quanto la sua fascia`)
    if (c.max > 1 && !(matura - nuova >= 0.05))
      guasti.push(`carta "${c.chiave}": dalla prima all'ultima copia il prezzo sale di ${(matura - nuova).toFixed(3)}`)
  }

  if (!(RESA_OLTRE > 0 && RESA_OLTRE < 1))
    guasti.push(`la resa delle copie in più vale ${RESA_OLTRE}: sopra 1 non è una serie che si chiude`)
  for (const c of mazzo) {
    if (tettoDi(c, false) !== c.max)
      guasti.push(`carta "${c.chiave}": in campagna il tetto non è il suo max`)
    const senzaFine = tettoDi(c, true)
    if (c.intera ? senzaFine !== c.max : Number.isFinite(senzaFine))
      guasti.push(`carta "${c.chiave}": nel gioco libero il tetto è ${senzaFine}, ` +
                  `e la carta ${c.intera ? 'è' : 'non è'} dichiarata intera`)
    if (c.intera) continue
    for (let lv = 0; lv <= c.max; lv++)
      if (resa(lv, c.max) !== lv) {
        guasti.push(`carta "${c.chiave}": dentro il tetto la resa non è il numero di copie`)
        break
      }
    let prima = 1
    for (let n = 1; n <= 12; n++) {
      const passo = resa(c.max + n, c.max) - resa(c.max + n - 1, c.max)
      if (!(passo > 0)) guasti.push(`carta "${c.chiave}": la ${n}ª copia in più non dà niente`)
      if (!(passo < prima)) guasti.push(`carta "${c.chiave}": la ${n}ª copia in più rende quanto la precedente`)
      prima = passo
    }
    if (!(resa(c.max + 300, c.max) - c.max < RESA_TOTALE + 1e-9))
      guasti.push(`carta "${c.chiave}": prendendola per sempre supera i ` +
                  `${RESA_TOTALE.toFixed(2)} gradi in più`)
  }
  for (const f of fasce) {
    const ancora = mazzo.filter(c => c.fascia === f.chiave && !c.intera).length
    if (ancora < 3)
      guasti.push(`la fascia "${f.chiave}" ha solo ${ancora} carte che crescono oltre il tetto`)
  }
  return guasti
}
