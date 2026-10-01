// Le frasi come stringhe: parole, confronto, come si scrivono a schermo.
// Una risposta è giusta se, senza punteggiatura né maiuscole, è uguale alla
// frase o a una delle sue varianti. Gli accenti contano (él non è el, qué
// non è que); ¿ ? ¡ ! e la punteggiatura non sono parole; al e del restano
// una parola sola. Vedi docs/lingue/spagnolo-motore.md.

// le parole di una frase, con gli accenti e la maiuscola dov'erano (anche «Leo… hoy»)
export const parole = s => String(s).replace(/[.,!?¿¡;:"“”«»()…]/g, ' ').split(/\s+/).filter(Boolean)

// le parole in minuscolo: serve a confrontare e a cercare
export const minuscole = s => parole(s).map(w => w.toLowerCase())

export const normalizza = s => minuscole(s).join(' ')

export const uguali = (a, b) => normalizza(a) === normalizza(b)

// le forme accettate di una frase componibile: la sua, le varianti
export const accettate = frase => [frase.es, ...(frase.varianti || [])].map(normalizza)

export const accetta = (risposta, frase) => accettate(frase).includes(normalizza(risposta))

// una frase è una domanda se lo è il suo italiano: lo spagnolo non gira il
// verbo, la domanda la dicono solo ¿ e ?
export const eDomanda = frase => /\?\s*$/.test(frase.it)

const maiuscola = s => {
  const i = s.search(/[^¿¡]/)
  return i < 0 ? s : s.slice(0, i) + s[i].toUpperCase() + s.slice(i + 1)
}

// Una frase a schermo: maiuscola in testa e sempre il punto o il «?». In
// spagnolo (`lingua: 'es'`) la domanda prende ¿ davanti e ? in fondo.
export function aSchermo(testo, domanda = /\?\s*$/.test(testo), lingua = 'it') {
  const s = String(testo).trim().replace(/^[¿¡]+/, '').replace(/[.?!]+$/, '').trim()
  if (!s) return s
  if (!domanda) return maiuscola(s) + '.'
  return lingua === 'es' ? '¿' + maiuscola(s) + '?' : maiuscola(s) + '?'
}

// La fila delle tessere, o un'opzione spagnola: maiuscola in testa e, se è
// una domanda, ¿ e ?. Senza punto: la punteggiatura non è una tessera.
export function inBella(tessere, { domanda = false } = {}) {
  const s = (Array.isArray(tessere) ? tessere.join(' ') : String(tessere)).trim()
  if (!s) return s
  return domanda ? '¿' + maiuscola(s) + '?' : maiuscola(s)
}
