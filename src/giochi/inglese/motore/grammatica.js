// Il controllo che una frase inglese stia in piedi sul numero: a/an davanti
// alla parola giusta, niente a/an davanti a una cosa che non si conta o che
// è già plurale («a trousers», «a hair»), il plurale dopo un numero. Non è
// una grammatica: è quello che le trappole generate sbagliavano. Lo usano i
// controlli (motore/guasti.js) su ogni frase e ogni trappola; le trappole
// che sbagliano apposta queste cose stanno in APPOSTA.
import { espandi } from './testo.js'
import { nomeDi, eAggettivo, eNumero, eContabile, conAn, SEMPRE_UGUALI } from './lessico.js'

// le righe di dati/trappole.js il cui errore è proprio questo
export const APPOSTA = new Set(['a-an', 'plurale-senza-s'])

const ORDINALI = new Set(['first', 'second', 'third'])

// il nome dopo T[i], saltando gli aggettivi: { j, n } o null
function nomeDopo(T, i) {
  let j = i
  while (j < T.length && eAggettivo(T[j])) j++
  const n = j < T.length ? nomeDi(T[j]) : null
  return n ? { j, n } : null
}

// Il primo errore di numero della frase, in parole; null se non ce n'è.
export function sgrammaticata(en) {
  const T = espandi(en)
  for (let i = 0; i < T.length; i++) {
    const w = T[i]
    if (w === 'a' || w === 'an') {
      const dopo = T[i + 1]
      if (!dopo) return `«${w}» in fondo`
      if (w === 'a' && conAn(dopo)) return `«a ${dopo}»: ci vuole an`
      if (w === 'an' && !conAn(dopo)) return `«an ${dopo}»: ci vuole a`
      const x = nomeDopo(T, i + 1)
      if (x && x.n.plurale) return `«${w} … ${T[x.j]}»: è plurale`
      if (x && !eContabile(x.n.base)) return `«${w} … ${T[x.j]}»: non si conta`
    }
    if (eNumero(w) && !ORDINALI.has(w)) {
      const x = nomeDopo(T, i + 1)
      if (!x || SEMPRE_UGUALI.has(x.n.base)) continue
      if (w === 'one' && x.n.plurale) return `«one … ${T[x.j]}»: ci vuole il singolare`
      if (w !== 'one' && !x.n.plurale && eContabile(x.n.base)) return `«${w} … ${T[x.j]}»: ci vuole il plurale`
    }
  }
  return null
}
