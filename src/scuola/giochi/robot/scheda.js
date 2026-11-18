// Il Robot a scuola (docs/costruttore/scuola.md): la maestra sceglie i capitoli, il bambino ne gioca i livelli in fila.
// La forma di una scheda e del suo `tipo`: docs/scuola/giochi.md. Puro: i dati dei livelli e niente store.
import { CAPITOLI, LIVELLI } from '../../../giochi/costruttore/dati/livelli.js'

const oggetto = x => !!x && typeof x === 'object' && !Array.isArray(x)
const minuscola = s => s.charAt(0).toLowerCase() + s.slice(1)

// i capitoli per l'editor della maestra, con quanti livelli ha ognuno
export const CAPITOLI_ROBOT = CAPITOLI.map(c => ({
  chiave: c.chiave, nome: c.nome, icona: c.icona, dice: c.dice,
  livelli: LIVELLI.filter(l => l.capitolo === c.chiave).length,
}))
const perChiave = k => CAPITOLI_ROBOT.find(c => c.chiave === k)

// { tipo: 'robot', capitoli: [chiavi di CAPITOLI] }: almeno uno, senza doppioni, nell'ordine della campagna
function valido(e) {
  if (!oggetto(e) || e.tipo !== 'robot') return false
  if (Object.keys(e).some(k => k !== 'tipo' && k !== 'capitoli')) return false
  const c = e.capitoli
  if (!Array.isArray(c) || !c.length || new Set(c).size !== c.length) return false
  if (!c.every(k => typeof k === 'string' && perChiave(k))) return false
  const posto = k => CAPITOLI_ROBOT.indexOf(perChiave(k))
  return c.every((k, i) => i === 0 || posto(c[i - 1]) < posto(k))
}

function descrivi(e) {
  if (!valido(e)) return 'Esercizio non valido'
  const nomi = e.capitoli.map(k => {
    const n = minuscola(perChiave(k).nome)
    return / e /.test(n) ? `«${n}»` : n
  })
  const elenco = nomi.length > 1 ? `${nomi.slice(0, -1).join(', ')} e ${nomi[nomi.length - 1]}` : nomi[0]
  const quanti = e.capitoli.reduce((n, k) => n + perChiave(k).livelli, 0)
  return `Il Robot · ${elenco} · ${quanti === 1 ? '1 livello' : `${quanti} livelli`}`
}

export default {
  id: 'robot',
  nome: 'Il Robot',
  nei: 'col Robot',
  spiega: 'Il bambino scrive il programma e il robot costruisce, una riga alla volta: i livelli dei capitoli scelti, in fila.',
  tred: false,
  tipo: {
    id: 'robot',
    materia: 'programmazione',
    voce: {
      nome: 'Il Robot',
      icona: '🤖',
      spiega: 'Programmare un robot che costruisce: si scelgono i capitoli, e i loro livelli si fanno in fila. Finiti, si ricomincia.',
      base: { tipo: 'robot', capitoli: ['cantiere'] },
    },
    valido,
    descrivi,
  },
}
