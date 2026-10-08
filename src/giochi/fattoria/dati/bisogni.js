/* Come sta una bestia e cosa le serve (dato puro; il conto è nel motore, il disegno nella scena).
   Vedi docs/fattoria/animali.md per il perché di ogni numero. */
import { RICETTE, PRODOTTI } from './coltivazioni.js'

export const FONDO = 0.15

export const BISOGNI = {
  pancia: { nome: 'Pancia', icona: '🍖', ore: 14, colore: '#e0a33c' },
  pelo:   { nome: 'Pelo',   icona: '🪮', ore: 30, colore: '#7fb4e0' },
  gioco:  { nome: 'Voglia di giocare', icona: '🎾', ore: 20, colore: '#8fcf6f' },
}

export const CHIAVI = Object.keys(BISOGNI)

// La ciotola: due cibi per famiglia (uno da poco, uno buono); per sono le famiglie di dati/animali.js.
export const CIBI = [
  { id: 'osso',    nome: 'Osso',    emoji: '🦴', prezzo: 5,  quanto: 0.30, per: ['cane'] },
  { id: 'bistecca', nome: 'Bistecca', emoji: '🥩', prezzo: 14, quanto: 0.70, per: ['cane'] },
  { id: 'pesce',   nome: 'Pesce',   emoji: '🐟', prezzo: 5,  quanto: 0.30, per: ['gatto'] },
  { id: 'pate',    nome: 'Paté',    emoji: '🥫', prezzo: 14, quanto: 0.70, per: ['gatto'] },
  { id: 'semi',    nome: 'Semini',  emoji: '🌰', prezzo: 5,  quanto: 0.30, per: ['pappagallo'] },
  { id: 'frutta',  nome: 'Frutta',  emoji: '🍎', prezzo: 14, quanto: 0.70, per: ['pappagallo'] },
  { id: 'carota',  nome: 'Carota',  emoji: '🥕', prezzo: 5,  quanto: 0.30, per: ['coniglio'] },
  { id: 'insalata', nome: 'Insalata', emoji: '🥬', prezzo: 14, quanto: 0.70, per: ['coniglio'] },
  // quelli che non si comprano: costano zero monete e un pezzo di granaio — vedi docs/fattoria/animali.md
  { id: 'mangime', nome: 'Mangime', emoji: '🥣', prezzo: 0, da: 'mangime',
    quanto: 0.30, per: ['cane', 'gatto', 'pappagallo', 'coniglio'] },
  // Solo quello che a quella bestia fa bene davvero: il gioco insegna anche questo. Niente latte al
  // gatto (da grande non lo digerisce), niente pane o formaggio al coniglio (è erbivoro), niente
  // tartufo (il cane lo cerca, non lo mangia) — vedi docs/fattoria/animali.md.
  { id: 'uova', nome: 'Uovo', emoji: '🥚', prezzo: 0, da: 'uova',
    quanto: 0.45, per: ['cane', 'gatto', 'pappagallo'] },
  { id: 'pastone', nome: 'Pappa di mais', emoji: '🍲', prezzo: 0, da: 'pastone',
    quanto: 0.70, per: ['cane', 'gatto', 'pappagallo'] },
  // Il fieno è il cibo vero del coniglio, quello che mangia tutto il giorno.
  { id: 'fieno', nome: 'Fieno', emoji: '🌿', prezzo: 0, da: 'fieno',
    quanto: 0.60, per: ['coniglio'] },
  // Il formaggio e il minestrone: solo al cane, e un po'.
  { id: 'formaggio', nome: 'Formaggio', emoji: '🧀', prezzo: 0, da: 'formaggio',
    quanto: 0.85, per: ['cane'] },
  { id: 'minestrone', nome: 'Minestrone', emoji: '🍜', prezzo: 0, da: 'minestrone',
    quanto: 0.50, per: ['cane'] },
]

export const cibiPer = famiglia => CIBI.filter(c => c.per.includes(famiglia))
export const gradisce = (cibo, famiglia) => !!cibo && cibo.per.includes(famiglia)
// I cibi comprati (non da granaio): serve a confrontare i prezzi, che col mangime a zero non ha senso.
export const cibiComprati = CIBI.filter(c => !c.da)

// La copertina è la prima coccola pagata col granaio: dà un mestiere alla lana.
export const COCCOLE = [
  { id: 'spazzola', bisogno: 'pelo',  nome: 'Spazzolalo',   emoji: '🪮', quanto: 0.5,  prezzo: 1 },
  { id: 'gioca',    bisogno: 'gioco', nome: 'Gioca con lui', emoji: '🎾', quanto: 0.55, prezzo: 1 },
  { id: 'copertina', bisogno: 'pelo', nome: 'Copertina di lana', emoji: '🧶',
    quanto: 0.95, prezzo: 0, da: 'lana' },
  // La festa: il compleanno del cane, tre catene che si incontrano in una torta. Riempie tutto (1).
  { id: 'festa', bisogno: 'gioco', nome: 'Festa con la torta', emoji: '🎂',
    quanto: 1, prezzo: 0, da: 'torta' },
  // Il bagnetto fa per il pelo quello che la festa fa per il gioco.
  { id: 'bagnetto', bisogno: 'pelo', nome: 'Bagnetto', emoji: '🧼',
    quanto: 1, prezzo: 0, da: 'sapone' },
]

export const nuovo = (ora = Date.now()) =>
  ({ pancia: 0.8, pelo: 0.9, gioco: 0.7, quando: ora })

// Una fotografia (oggetto nuovo), mai la bestia viva: senza, un gesto pagato col granaio (prezzo:0) non
// muove le monete e Vue non ridisegna, e la barra restava ferma finché un gesto a pagamento ne alzava due insieme.
export const foto = b => Object.fromEntries(CHIAVI.map(k => [k, (b || {})[k] ?? 0]))

// Si applica leggendo: il calo non dipende da quanto spesso si guarda.
export function scendi(b, ora = Date.now()) {
  const ore = Math.max(0, (ora - (b.quando || ora)) / 3600000)
  if (ore > 0.02) {
    for (const k of CHIAVI)
      b[k] = Math.max(FONDO, Math.min(1, (b[k] ?? 0.8) - ore / BISOGNI[k].ore))
    b.quando = ora
  }
  riarma(b)
  return b
}

// Le due soglie di comeSta, le stesse che decidono il premio.
export const BENISSIMO = 0.78
export const BENE = 0.55

export const umore = b => CHIAVI.reduce((s, k) => s + (b[k] ?? 0), 0) / CHIAVI.length
export const haBisogno = b => CHIAVI.some(k => (b[k] ?? 1) < 0.35)

// Tutti e tre nella fascia alta, non la media: pancia piena e pelo arruffato non è "a posto".
export const tuttoAPosto = b => CHIAVI.every(k => ((b || {})[k] ?? 0) > BENISSIMO)

// Si riarma quando almeno un bisogno scende sotto "sta bene": da lì il prossimo tutto-a-posto è di nuovo una notizia.
export function riarma(b) {
  if (b.premiato && CHIAVI.some(k => (b[k] ?? 0) <= BENE)) b.premiato = false
  return b
}

// Una volta per ciclo; eraAPosto (prima del gesto) evita di premiare un salvataggio già in forma.
export function premiaSeStaBene(b, eraAPosto = false) {
  if (!b || eraAPosto || b.premiato || !tuttoAPosto(b)) return false
  b.premiato = true
  return true
}

// Le frasi valgono per tutte le bestie (anche il pappagallo).
export function comeSta(b, nome = 'Sta') {
  const u = umore(b)
  if (u > BENISSIMO) return `${nome} sta benissimo. Ti viene incontro appena ti vede.`
  if (u > BENE) return `${nome} sta bene.`
  if (b.pancia < 0.35) return `${nome} ha fame: guarda te, poi la ciotola.`
  if (b.gioco < 0.35) return `${nome} si annoia: gira in tondo e ti guarda.`
  if (b.pelo < 0.35) return `${nome} ha il pelo tutto arruffato.`
  return `${nome} potrebbe stare meglio.`
}

// A cosa serve una roba del silo: tre uscite su cinque (ricette, ciotola, coccole) — il conto intero è in dati/usi.js.
// I gesti che riempiono un bisogno, a blocchi (uno per bisogno); famiglia toglie quello che la bestia rifiuta.
export function gestiPer(bisogno, famiglia = null) {
  if (bisogno === 'pancia')
    return CIBI.filter(c => !famiglia || c.per.includes(famiglia))
      .map(c => ({ che: 'cibo', ...c }))
  return COCCOLE.filter(c => c.bisogno === bisogno).map(c => ({ che: 'coccola', ...c }))
}

export function serveA(prodotto) {
  const usi = []
  for (const r of RICETTE)
    if ((r.prende || {})[prodotto])
      usi.push({ che: 'ricetta', dove: r.dove, quanti: r.prende[prodotto],
                 emoji: r.emoji, nome: r.nome, resa: r.resa, minuti: r.minuti })
  for (const c of CIBI)
    if (c.da === prodotto)
      usi.push({ che: 'cibo', emoji: c.emoji, nome: c.nome, quanto: c.quanto })
  for (const c of COCCOLE)
    if (c.da === prodotto)
      usi.push({ che: 'coccola', emoji: c.emoji, nome: c.nome,
                 bisogno: (BISOGNI[c.bisogno] || {}).nome || c.bisogno })
  return usi
}

export function guastiDeiBisogni() {
  const g = []
  // "Non serve a niente" si controlla in dati/usi.js, che vede anche addobbi e ordini.
  if (!(FONDO > 0)) g.push('il fondo dev\'essere sopra zero: una bestia non sta mai male')
  if (!(BENE < BENISSIMO && BENISSIMO < 1))
    g.push('le due soglie di «come sta» non stanno in ordine: il premio non si riarmerebbe mai')
  // Una bestia appena comprata non nasce a posto, se no il primo premio sarebbe gratis.
  if (tuttoAPosto(nuovo()))
    g.push('una bestia appena comprata nasce già a posto: il primo premio sarebbe gratis')
  for (const [k, b] of Object.entries(BISOGNI))
    if (!(b.ore > 0)) g.push(`${k}: ore impossibili`)
  const visti = new Set()
  for (const c of CIBI) {
    if (visti.has(c.id)) g.push(`cibo doppio: ${c.id}`)
    visti.add(c.id)
    // O si paga in monete o si scala dal granaio, non entrambi.
    if (c.da && c.prezzo) g.push(`${c.id}: costa monete e roba insieme — decidi quale`)
    if (!c.da && !(c.prezzo > 0)) g.push(`${c.id}: prezzo impossibile`)
    if (!(c.quanto > 0 && c.quanto <= 1)) g.push(`${c.id}: riempie una quantità impossibile`)
    if (!Array.isArray(c.per) || !c.per.length)
      g.push(`${c.id}: non è il cibo di nessuno, e nessuno lo mangerà mai`)
  }
  // Il cibo caro non deve convenire anche al pezzo (solo fra i comprati: il mangime renderebbe all'infinito).
  for (const famiglia of new Set(CIBI.flatMap(c => c.per))) {
    const suoi = cibiPer(famiglia).filter(c => !c.da)
    for (let i = 1; i < suoi.length; i++)
      if (suoi[i].quanto / suoi[i].prezzo > suoi[i - 1].quanto / suoi[i - 1].prezzo)
        g.push(`${suoi[i].id}: rende più al pezzo di quello prima — gli altri diventano inutili`)
  }
  // Un oggetto riempie un bisogno solo, e si riconosce da un id solo condiviso con i cibi.
  for (const c of COCCOLE) {
    if (visti.has(c.id)) g.push(`${c.id}: l'id è già di un'altra roba — un oggetto, un bisogno`)
    visti.add(c.id)
    if (!BISOGNI[c.bisogno]) g.push(`${c.id}: riempie un bisogno che non esiste`)
    if (!(c.quanto > 0)) g.push(`${c.id}: non riempie niente`)
    if (!(c.prezzo >= 0)) g.push(`${c.id}: prezzo impossibile`)
    // Stessa regola dei cibi: monete o roba, non tutte e due.
    if (c.da && c.prezzo) g.push(`${c.id}: costa monete e roba insieme — decidi quale`)
  }
  // Una carezza gratis ci dev'essere sempre: chi è a zero monete deve poter toccare il suo cane.
  if (!COCCOLE.some(c => !c.prezzo))
    g.push('nessuna coccola gratis: chi è a zero monete resta con un animale intoccabile')
  return g
}
