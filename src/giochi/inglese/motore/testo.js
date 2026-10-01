// Le frasi come stringhe: parole, forma lunga e contratta, confronto.
// Una risposta è giusta se, espansa e senza punteggiatura né maiuscole, è
// uguale alla frase o a una delle sue varianti: «it's» e «it is» valgono
// sempre tutte e due (docs/lingue/mondi.md, «Forma lunga prima…»).
import { CONTRAZIONI } from '../dati/contrazioni.js'

// le parole dopo cui 's è is (o has): le altre lo tengono come genitivo
export const CON_LA_S = new Set(['it', 'he', 'she', 'that', 'what', 'where', 'there', 'who', 'here', 'how', 'when', 'this',
                          'let'])

export const apostrofi = s => s.replace(/[’‘`]/g, '\'')

// le parole di una frase, con l'apostrofo tipografico e la maiuscola dov'erano
export const parole = s => String(s).replace(/[.,!?;:"“”«»()]/g, ' ').split(/\s+/).filter(Boolean)

// forma lunga → contratta, sulle righe di dati/contrazioni.js
export function contrai(s) {
  let out = ` ${s} `
  for (const [lunga, corta, seguita] of CONTRAZIONI) {
    const re = new RegExp(`(^|[\\s])${lunga.replace(/ /g, '\\s+')}(?=\\s${seguita ? '+[A-Za-z]' : ''})`, 'g')
    out = out.replace(re, (_, prima) => prima + corta)
  }
  return out.trim()
}

// contratta → lunga, in minuscolo: serve solo a confrontare
export function espandi(s) {
  const t = parole(apostrofi(String(s)).toLowerCase())
  const out = []
  for (let i = 0; i < t.length; i++) {
    let w = t[i]
    if (w === 'can\'t' || w === 'cannot') { out.push('cannot'); continue }
    if (w === 'can' && t[i + 1] === 'not') { out.push('cannot'); i++; continue }
    if (w === 'won\'t') { out.push('will', 'not'); continue }
    if (w === 'let\'s') { out.push('let', 'us'); continue }
    let m
    if ((m = w.match(/^(\w+)n't$/))) { out.push(m[1], 'not'); continue }
    if ((m = w.match(/^(\w+)'m$/))) { out.push(m[1], 'am'); continue }
    if ((m = w.match(/^(\w+)'re$/))) { out.push(m[1], 'are'); continue }
    if ((m = w.match(/^(\w+)'ve$/))) { out.push(m[1], 'have'); continue }
    if ((m = w.match(/^(\w+)'ll$/))) { out.push(m[1], 'will'); continue }
    // «he's got» è has, «he's happy» è is; dopo un nome è di chi è (Tom's dog) e resta com'è
    if ((m = w.match(/^(\w+)'s$/)) && CON_LA_S.has(m[1])) { out.push(m[1], t[i + 1] === 'got' ? 'has' : 'is'); continue }
    out.push(w)
  }
  return out
}

export const normalizza = s => espandi(s).join(' ')

export const uguali = (a, b) => normalizza(a) === normalizza(b)

// le forme accettate di una frase componibile: la sua, le varianti
export const accettate = frase => [frase.en, ...(frase.varianti || [])].map(normalizza)

export const accetta = (risposta, frase) => accettate(frase).includes(normalizza(risposta))

export const eDomanda = frase => /\?\s*$/.test(frase.it)

// come la frase si vede in una tappa: lunga o contratta
export const inTappa = (en, tappa) => (tappa && tappa.contratta ? contrai(en) : en)

// una frase italiana a schermo: maiuscola in testa e sempre il punto o il «?»,
// perché «è un cane» e «è un cane?» si distinguono solo lì
export function aSchermo(testo, domanda = /\?\s*$/.test(testo)) {
  const s = String(testo).trim().replace(/[.?!]+$/, '').trim()
  if (!s) return s
  return s[0].toUpperCase() + s.slice(1) + (domanda ? '?' : '.')
}

// la fila delle tessere composta: maiuscola in testa e il «?» se è una domanda.
// La punteggiatura non è una tessera: la mette la fila.
export function inBella(tessere, { domanda = false } = {}) {
  const s = (Array.isArray(tessere) ? tessere.join(' ') : String(tessere)).trim()
  if (!s) return s
  return s[0].toUpperCase() + s.slice(1) + (domanda ? '?' : '')
}
