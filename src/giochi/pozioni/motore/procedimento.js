// Il procedimento: quello che si fa con la roba comprata. La ricetta è un
// testo, e da lì si ricava cosa pestare insieme, cosa versare, quando
// mescolare e scaldare. Puro: il caso arriva da fuori. Le regole in
// docs/pozioni/procedimento.md.

export const MORTAIO = -1       // nel `cosa` di una versata: quello che è stato pestato

// le azioni, e come si dicono sul cartello del pasticcio
export const AZIONI = {
  metti: { fare: 'Metterlo nel mortaio' },
  pesta: { fare: 'Pestare' },
  versa: { fare: 'Versare' },
  mescola: { fare: 'Mescolare' },
  scalda: { fare: 'Accendere il fuoco' },
  diluisci: { fare: 'Diluire' },
}

// gli attrezzi sul tavolo, per le azioni di una tappa
export const ATTREZZI = { pesta: ['mortaio', 'pestello'], mescola: ['mestolo'], scalda: ['fiammifero'], diluisci: ['brocca'] }

// cosa vuol dire lasciare un attrezzo su un altro: «attrezzo:dove»
export const MOSSE = {
  'pestello:mortaio': ['pesta', []],
  'mortaio:calderone': ['versa', [MORTAIO]],
  'mestolo:calderone': ['mescola', []],
  'fiammifero:calderone': ['scalda', []],
  'brocca:calderone': ['diluisci', []],
}

const inFila = (rnd, lista) => lista.map(x => [rnd(), x]).sort((a, b) => a[0] - b[0]).map(x => x[1])
const elenco = nomi => (nomi.length < 2 ? nomi.join('') : `${nomi.slice(0, -1).join(', ')} e ${nomi.at(-1)}`)

// `livello` (dati/campagna.js): 1 versa e mescola, 2 anche scalda, 3 si
// pesta, 4 si diluisce, 5 come il 4 ma col testo intrecciato.
// L'ordine di mescola e scalda cambia: se no si impara una filastrocca e la ricetta non si legge.
export function ricetta(rnd, ingredienti, livello) {
  const tutti = ingredienti.map((_, i) => i)
  const duri = tutti.filter(i => ingredienti[i].famiglia !== 'capacita')
  const finale = inFila(rnd, [{ azione: 'mescola', cosa: [] }, ...(livello >= 2 ? [{ azione: 'scalda', cosa: [] }] : [])])
  if (livello === 1) finale.sort(a => (a.azione === 'mescola' ? -1 : 1))
  const passi = []
  if (livello >= 3 && duri.length) {
    const insieme = inFila(rnd, duri).slice(0, 2)
    const resto = tutti.filter(i => !insieme.includes(i))
    passi.push({ azione: 'pesta', cosa: insieme.sort() }, { azione: 'versa', cosa: [MORTAIO] })
    if (resto.length) passi.push({ azione: 'versa', cosa: resto })
    passi.push(...finale)
  } else passi.push({ azione: 'versa', cosa: tutti }, ...finale)
  if (livello >= 4) passi.splice(passi.length - (rnd() < 0.5 ? 0 : 1), 0, { azione: 'diluisci', cosa: [] })
  return passi
}

// una frase per passo, senza maiuscola né punto
export function frase(p, ingredienti) {
  const nomi = p.cosa.filter(i => i !== MORTAIO).map(i => ingredienti[i].nome)
  if (p.azione === 'pesta') return nomi.length > 1 ? `pesta insieme ${elenco(nomi)}` : `pesta ${nomi[0]}`
  if (p.azione === 'versa') return p.cosa.includes(MORTAIO) ? 'versa il pestato nel calderone' : `versa ${elenco(nomi)} nel calderone`
  return { mescola: 'mescola bene', scalda: 'accendi il fuoco', diluisci: 'diluisci con l\'acqua' }[p.azione]
}

const Maiuscola = t => t[0].toUpperCase() + t.slice(1)

// Il testo della pergamena, un punto per riga: [{ testo, passi: [indici] }].
// Ogni tanto due passi stanno nello stesso punto («versa e scalda»), e bisogna
// leggere fino in fondo. Intrecciato, una coppia si dice al contrario («scalda,
// ma prima mescola»).
const INSIEME = 0.4
export function testo(rnd, passi, ingredienti, intrecciato) {
  // due versate di fila al contrario suonerebbero «versa, ma prima versa»
  const girabili = passi.slice(1).flatMap((p, k) => (p.azione !== passi[k].azione ? [k] : []))
  const girata = intrecciato && girabili.length ? girabili[Math.floor(rnd() * girabili.length)] : -1
  const detto = k => frase(passi[k], ingredienti)
  const righe = []
  for (let k = 0; k < passi.length; k++) {
    if (k === girata) righe.push({ testo: `${Maiuscola(detto(k + 1))}, ma prima ${detto(k)}.`, passi: [k, ++k] })
    else if (k + 1 < passi.length && k + 1 !== girata && passi.length > 2 && rnd() < INSIEME)
      righe.push({ testo: `${Maiuscola(detto(k))} e ${detto(k + 1)}.`, passi: [k, ++k] })
    else righe.push({ testo: `${Maiuscola(detto(k))}.`, passi: [k] })
  }
  return righe
}

export const stesse = (a, b) => a.length === b.length && [...a].sort().join() === [...b].sort().join()
