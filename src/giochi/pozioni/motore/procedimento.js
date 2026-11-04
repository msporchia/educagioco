// Il procedimento: quello che si fa con la roba comprata. La ricetta è un
// testo, e da lì si ricava cosa pestare insieme, cosa versare, quando
// mescolare e scaldare. Puro: il caso arriva da fuori. Le regole in
// docs/pozioni/procedimento.md.

export const MORTAIO = -1       // nel `cosa` di una versata: quello che è stato pestato

export const AZIONI = {
  pesta: { nome: 'Pesta', emoji: '🪨', fare: 'Pestare', vuole: true },
  versa: { nome: 'Nel calderone', emoji: '🫗', fare: 'Versare', vuole: true },
  mescola: { nome: 'Mescola', emoji: '🥄', fare: 'Mescolare', vuole: false },
  scalda: { nome: 'Scalda', emoji: '🔥', fare: 'Scaldare', vuole: false },
  diluisci: { nome: 'Diluisci', emoji: '💧', fare: 'Diluire', vuole: false },
}

const inFila = (rnd, lista) => lista.map(x => [rnd(), x]).sort((a, b) => a[0] - b[0]).map(x => x[1])
const elenco = nomi => (nomi.length < 2 ? nomi.join('') : `${nomi.slice(0, -1).join(', ')} e ${nomi.at(-1)}`)

// `livello` (dati/campagna.js): 1 versa e mescola, 2 anche scalda, 3 si
// pesta o si versa a metà, 4 si diluisce, 5 come il 4 ma col testo intrecciato.
// L'ordine di mescola e scalda cambia: se no si impara una filastrocca e la ricetta non si legge.
export function ricetta(rnd, ingredienti, livello) {
  const tutti = ingredienti.map((_, i) => i)
  const duri = tutti.filter(i => ingredienti[i].famiglia !== 'capacita')
  const finale = inFila(rnd, [{ azione: 'mescola', cosa: [] }, ...(livello >= 2 ? [{ azione: 'scalda', cosa: [] }] : [])])
  if (livello === 1) finale.sort(a => (a.azione === 'mescola' ? -1 : 1))
  const passi = []
  if (livello >= 3 && duri.length >= 2) {
    const insieme = inFila(rnd, duri).slice(0, 2)
    const resto = tutti.filter(i => !insieme.includes(i))
    passi.push({ azione: 'pesta', cosa: insieme.sort() }, { azione: 'versa', cosa: [MORTAIO] })
    if (resto.length) passi.push({ azione: 'versa', cosa: resto })
    passi.push(...finale)
  } else if (livello >= 3) {
    // solo liquidi: una parte, il fuoco o il mestolo in mezzo, poi il resto
    const [primo, ...resto] = inFila(rnd, tutti)
    passi.push({ azione: 'versa', cosa: [primo] }, finale[0], { azione: 'versa', cosa: resto.sort() }, finale[1])
  } else passi.push({ azione: 'versa', cosa: tutti }, ...finale)
  if (livello >= 4) passi.splice(passi.length - (rnd() < 0.5 ? 0 : 1), 0, { azione: 'diluisci', cosa: [] })
  return passi
}

// una frase per passo, senza maiuscola né punto
export function frase(p, ingredienti) {
  const nomi = p.cosa.filter(i => i !== MORTAIO).map(i => ingredienti[i].nome)
  if (p.azione === 'pesta') return nomi.length > 1 ? `pesta insieme ${elenco(nomi)}` : `pesta ${nomi[0]}`
  if (p.azione === 'versa') return p.cosa.includes(MORTAIO) ? 'versa il pestato nel calderone' : `versa ${elenco(nomi)} nel calderone`
  return { mescola: 'mescola bene', scalda: 'scalda sul fuoco', diluisci: 'diluisci con l\'acqua' }[p.azione]
}

const Maiuscola = t => t[0].toUpperCase() + t.slice(1)

// Il testo della pergamena: [{ testo, passi: [indici] }]. Intrecciato, una
// coppia di passi si dice al contrario («scalda, ma prima mescola»).
export function testo(rnd, passi, ingredienti, intrecciato) {
  const girata = intrecciato && passi.length > 2 ? 1 + Math.floor(rnd() * (passi.length - 2)) : -1
  const righe = []
  for (let k = 0; k < passi.length; k++) {
    const ultima = k === passi.length - 1 || (k === girata && k + 1 === passi.length - 1)
    const attacco = k === 0 ? '' : ultima ? 'Infine ' : 'Poi '
    if (k === girata) {
      righe.push({ testo: `${attacco}${(attacco ? (x => x) : Maiuscola)(frase(passi[k + 1], ingredienti))}, ma prima ${frase(passi[k], ingredienti)}.`, passi: [k, k + 1] })
      k++
    } else righe.push({ testo: `${attacco}${(attacco ? (x => x) : Maiuscola)(frase(passi[k], ingredienti))}.`, passi: [k] })
  }
  return righe
}

export const stesse = (a, b) => a.length === b.length && [...a].sort().join() === [...b].sort().join()
