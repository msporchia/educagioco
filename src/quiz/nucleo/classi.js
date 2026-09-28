/* Le classi di domande (coppia modulo+grado) e a che età servono: la scala
   0-100 dichiarata, le due finestre (ammissione/mira) e la banda che si
   allarga dove il mazzo si dirada. Vedi docs/apprendimento/quiz-livelli.md
   — leggerlo prima di toccare questo file. Gira in Node, non importa
   niente: la distribuzione la conta test/unita/quiz-pesi. */
export const LIVELLO_MIN = 0
export const LIVELLO_MAX = 100

// il ponte con gli anni, la lingua in cui un genitore giudica: 4 anni = 0, 12 anni = 100
export const ANNI_MIN = 4
export const ANNI_MAX = 12
export const PUNTI_PER_ANNO = (LIVELLO_MAX - LIVELLO_MIN) / (ANNI_MAX - ANNI_MIN)
export const livelloDegliAnni = anni => (anni - ANNI_MIN) * PUNTI_PER_ANNO
export const anniDelLivello = livello => ANNI_MIN + livello / PUNTI_PER_ANNO

// due larghezze (ammissione, mira), non una: vedi docs/apprendimento/quiz-livelli.md
export const TAGLIO_SOTTO = 44
export const TAGLIO_SOPRA = 25
export const MIRA_SOTTO = 12
export const MIRA_SOPRA = 25

export const finestraDi = eta => {
  if (eta == null) return null
  const qui = livelloDegliAnni(eta)
  return [qui - TAGLIO_SOTTO, qui + TAGLIO_SOPRA]
}

// larghezza della campana intorno al bersaglio: a quella distanza il peso è a un terzo (provato 19: troppo largo)
export const BANDA = 11

// dove il mazzo si dirada la banda si allarga a tentativi, finché le classi che contano davvero non bastano
export const VARIETA_MINIMA = 14
export const ALLARGO_BANDA = 3
export const BANDA_MASSIMA = 25

const dentro01 = x => Math.min(1, Math.max(0, x || 0))

// il gioco chiede 0..1 senza sapere l'età: il bersaglio non è il fondo/cima dell'ammissione, che è larga apposta
export const bersaglio = (difficolta, eta = null) => {
  if (eta == null) return (LIVELLO_MIN + LIVELLO_MAX) / 2
  const qui = livelloDegliAnni(eta)
  return qui - MIRA_SOTTO + (MIRA_SOTTO + MIRA_SOPRA) * dentro01(difficolta)
}

// PELO evita che una media come 95.000000001 cada fuori da una finestra che finisce a 95
const PELO = 1e-9
export const adatta = (livello, finestra) =>
  !finestra || (livello >= finestra[0] - PELO && livello <= finestra[1] + PELO)

export const pesoDi = (livello, target, banda = BANDA) =>
  Math.exp(-((Math.abs(livello - target) / banda) ** 2))

// il numero effettivo: uno solo vuol dire che una classe si prende tutto
export const quanteContano = pesi => {
  const tot = pesi.reduce((s, p) => s + p, 0)
  if (!(tot > 0)) return 0
  return 1 / pesi.reduce((s, p) => s + (p / tot) ** 2, 0)
}

// allargata a tentativi finché il mazzo intorno al bersaglio non è abbastanza vario
export const bandaPer = (livelli, target) => {
  let banda = BANDA
  while (banda < BANDA_MASSIMA &&
         quanteContano(livelli.map(l => pesoDi(l, target, banda))) < VARIETA_MINIMA)
    banda += ALLARGO_BANDA
  return Math.min(banda, BANDA_MASSIMA)
}

// quanto è complicata per chi la riceve: zero al fondo della sua finestra, uno in cima
export const quantoPesa = (livello, finestra) => {
  if (!finestra) return dentro01(livello / LIVELLO_MAX)
  const [da, a] = finestra
  return dentro01((livello - da) / (a - da))
}

export const postoDi = livello => dentro01(livello / LIVELLO_MAX) // dove cade un livello sulla barra 0..1

// regole = { eta, livelli }: senza, non si taglia niente per età (banco di prova, schermata dei grandi)
// bisogno (il ripasso) è un parametro e non un import: questo file non deve sapere che esista un profilo
export function classiDi(moduli, { spenti = [], difficolta = 0, bisogno = null,
                                   regole = null } = {}) {
  // la finestra si calcola una volta e si passa già fatta: un `{ eta: 6 }` senza non taglierebbe niente, silenziosamente
  const finestra = regole?.finestra ?? finestraDi(regole?.eta ?? null)
  const qui = regole ? { ...regole, finestra } : null
  const target = bersaglio(difficolta, regole?.eta ?? null)

  // due passate: la banda dipende da quante classi ci sono intorno al bersaglio, non si sa prima di averle contate
  const fuori = []
  for (const m of moduli)
    for (const g of m.gradiLiberi(spenti, qui))
      fuori.push({
        modulo: m,
        grado: g,
        livello: m.livelloDi(g, spenti, qui),
        visto: m.livelloVisto(g, spenti, qui), // come lo vede questo bambino: il ritocco sposta la classe, non la finestra
      })

  // la banda si misura sulla sola distanza dal bersaglio, prima del ripasso: altrimenti si allargherebbe per il motivo sbagliato
  const banda = bandaPer(fuori.map(v => v.visto), target)
  for (const v of fuori) {
    v.peso = pesoDi(v.visto, target, banda) *
             v.modulo.bisognoMedio(v.grado, spenti, bisogno, qui)
    delete v.visto
  }
  return fuori
}

// sorte.frazione una volta sola: a parità di seme esce sempre la stessa classe, e si prova la distribuzione
export function pescaClasse(sorte, voci) {
  if (!voci.length) return null
  const tot = voci.reduce((s, v) => s + v.peso, 0)
  if (!(tot > 0)) return sorte.uno(voci)
  let x = sorte.frazione * tot
  for (const v of voci) { x -= v.peso; if (x <= 0) return v }
  return voci[voci.length - 1]
}
