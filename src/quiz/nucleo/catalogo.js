/* Tutte le domande che il gioco sa fare, in fila: una classe è la terna
   (modulo, grado, tipologia), la stessa unità che nucleo/classi.js pesca.
   La difficoltà è quella vera (il livello dichiarato), non una posizione
   in scaletta — così moduli con gradi diversi si confrontano. Non importa
   niente, gira in Node (test/unita/catalogo). Vedi
   docs/apprendimento/quiz-livelli.md e docs/genitori/quadro.md. */

import { pesoDi, bersaglio, finestraDi, anniDelLivello,
         livelloDegliAnni, MIRA_SOTTO } from './classi.js'
import { livelloVoluto } from './modulo.js'

// fasce in età, non gradini astratti: dividono l'elenco e pescano come farebbe un gioco per un bambino di quell'età
export const FASCE = [
  { chiave: 'piccoli', nome: 'Prima della scuola', eta: 5, fino: 25 },
  { chiave: 'facili', nome: 'Prima e seconda', eta: 6.5, fino: 50 },
  { chiave: 'medie', nome: 'Terza e quarta', eta: 8.5, fino: 75 },
  { chiave: 'toste', nome: 'Quinta e oltre', eta: 10.5, fino: 101 },
]

export const fasciaDi = livello => FASCE.find(f => livello < f.fino) || FASCE[FASCE.length - 1]

// relative a chi gioca (non assolute come FASCE sopra): i due estremi sono le escluse, e si mostrano lo stesso
// qui e non in quiz/catalogo.js perché la usano in due (l'elenco e data/quadro.js): due copie divergerebbero
export const FASCE_ETA = [
  { chiave: 'sotto', nome: 'Troppo facili', che: 'tolte: le indovinerebbe senza pensarci' },
  { chiave: 'facili', nome: 'Facili', che: 'roba che sa già fare: esce quando il gioco chiede poco' },
  { chiave: 'medie', nome: 'Nel segno', che: 'la sua misura: sono quelle che vede più spesso' },
  { chiave: 'toste', nome: 'Difficili', che: 'un passo avanti: escono quando il gioco chiede molto' },
  { chiave: 'sopra', nome: 'Troppo difficili', che: 'tolte: non ha ancora di che ragionarle' },
]

// il blocco di mezzo è stretto (non la mira della pesca): con il confine sulla mira si mangiava tre quarti delle righe
const SEGNO_SOPRA = 6

// si chiede una volta e si usa su tutte le righe: ricalcolare la finestra duecento volte per un elenco è lavoro buttato
export function doveCadeCon (eta) {
  const qui = livelloDegliAnni(eta)
  const finestra = finestraDi(eta)
  if (!finestra) return () => 'medie'
  const [giu, su] = finestra
  return livello =>
    livello < giu ? 'sotto'
      : livello > su ? 'sopra'
        : livello < qui - MIRA_SOTTO ? 'facili'
          : livello > qui + SEGNO_SOPRA ? 'toste' : 'medie'
}

// una riga per (grado, tipologia); i moduli senza tipi hanno una riga per grado, col nome della scaletta
export function classiDelModulo(modulo) {
  const fuori = []
  for (let g = 1; g <= modulo.gradi; g++) {
    const scaletta = modulo.scaletta[g - 1] || ''
    const tipi = modulo.tipiDi(g)
    if (tipi.length) {
      // la riga di scaletta descrive il grado, non la tipologia: si mostra solo se il grado è tutto di quella tipologia
      const sola = tipi.length === 1
      for (const t of tipi)
        fuori.push(voce(modulo, g, {
          tipo: t.chiave, nome: t.nome, sa: t.sa, peso: t.peso,
          scaletta: sola ? scaletta : '',
        }))
    } else {
      fuori.push(voce(modulo, g, { tipo: null, nome: scaletta, sa: modulo.serve(g), peso: 1, scaletta }))
    }
  }
  return fuori
}

// due frasi dicono la stessa cosa se una contiene l'altra (a meno di maiuscole e articoli)
const nudo = s => String(s || '').toLowerCase().replace(/[^a-zà-ù ]/g, ' ').replace(/\s+/g, ' ').trim()
const ripete = (a, b) => {
  const [x, y] = [nudo(a), nudo(b)]
  return !!x && !!y && (x.includes(y) || y.includes(x))
}

function voce(modulo, grado, { tipo, nome, sa, peso, scaletta }) {
  const t = modulo.tipi.find(x => x.chiave === tipo)
  const livello = t ? modulo.livelloDelTipo(t, grado) : modulo.livelli[grado - 1]
  return {
    sorgente: { modulo, grado, tipo, nome }, // per rigenerarla: la stessa forma delle sorgenti di esempi.js
    livello,
    anni: Math.round(anniDelLivello(livello) * 10) / 10, // la lingua della schermata dei grandi
    chiave: `${modulo.id}:${grado}:${tipo || 'grado'}`,
    modulo: modulo.id,
    icona: modulo.icona,
    nomeModulo: modulo.nome,
    materia: modulo.materia,
    grado,
    gradi: modulo.gradi,
    tipo,
    nome,
    scaletta: scaletta && !ripete(scaletta, nome) ? scaletta : '', // si tace quando ripete il nome della tipologia
    sa: [...sa],
    suo: t ? livelloVoluto(t, grado) !== undefined : false, // l'ha dichiarato lei, o è quello del suo grado?
    peso, // quanto spesso esce dentro il suo grado: 1 se è l'unica, meno se se lo divide
    fascia: fasciaDi(livello).chiave,
  }
}

// spenti non toglie niente: un catalogo che nasconde ciò che il genitore ha tolto non gli fa vedere cosa ha tolto
export function catalogoDi(moduli, { spenti = [], giudizi = [] } = {}) {
  const detti = contaGiudizi(giudizi)
  return moduli.map(m => {
    const classi = classiDelModulo(m).map(c => ({
      ...c,
      spenta: c.sa.some(s => spenti.includes(s)) || (c.tipo ? spenti.includes(c.tipo) : false),
      detti: detti.get(c.tipo) || null, // cosa ne è stato detto giocando (vedi contaGiudizi): vale più della nostra età
    }))
    return {
      id: m.id,
      nome: m.nome,
      icona: m.icona,
      materia: m.materia,
      chiaro: m.chiaro,
      gradi: m.gradi,
      classi,
      // da che età a che età arriva questo modulo: si stringe quando un genitore spegne qualcosa
      da: classi.length ? Math.min(...classi.map(c => c.livello)) : 0,
      a: classi.length ? Math.max(...classi.map(c => c.livello)) : 0,
      livelloDichiarato: !!m.livelloDichiarato,
      spente: classi.filter(c => c.spenta).length,
    }
  })
}

// il quaderno dei giudizi (store/giudizi.js): 😴 troppo facile, 😰 troppo difficile, 🐛 storta, per chiave di tipologia
// arriva già letto da fuori: questo file non tocca l'archivio, deve girare anche in Node
export function contaGiudizi(lista = []) {
  const fuori = new Map()
  for (const v of lista) {
    if (!v?.chiave || !v?.verdetto) continue
    const c = fuori.get(v.chiave) || { facile: 0, difficile: 0, storta: 0, quanti: 0 }
    if (c[v.verdetto] === undefined) continue
    c[v.verdetto]++
    c.quanti++
    fuori.set(v.chiave, c)
  }
  return fuori
}

// le spente restano fuori: qui non si guarda cosa esiste, si guardano le domande che arriverebbero
export function giroDellaFascia(moduli, fascia, { spenti = [] } = {}) {
  return catalogoDi(moduli, { spenti })
    .flatMap(m => m.classi)
    .filter(c => c.fascia === fascia && !c.spenta)
    .sort((x, y) => x.livello - y.livello || x.modulo.localeCompare(y.modulo))
}

// solo per raccontarlo nel pannello («a otto anni esce una volta su venti»): il conto è quello di classi.js, non una copia
export const quantoEsce = (classe, eta, difficolta = 0.5) =>
  pesoDi(classe.livello, bersaglio(difficolta, eta))
