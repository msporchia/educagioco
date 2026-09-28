// La scala degli aiuti (Generale, Passo passo, costruttore): quanto costa
// un gradino e in che ordine vengono, non cosa fa. Puro: vedi docs/core/aiuti.md.

export const RAGIONA = 'ragiona'
export const INDIZIO = 'indizio'
export const PEZZO = 'pezzo'
export const FORMA = 'forma'
export const SVELA = 'svela'

export const PREZZO_INDIZIO = 10
export const PREZZI_FINALI = [50, 100, 200]   // i gradini che scrivono, contati dalla fine
export const CONFERMA_DA = PREZZI_FINALI[0]

const CHE = [RAGIONA, INDIZIO, PEZZO, FORMA, SVELA]
export const scrive = p => !!p && (p.che === PEZZO || p.che === FORMA || p.che === SVELA)

export function conIPrezzi(passi = []) {
  const quanti = passi.filter(scrive).length
  let k = 0
  return passi.map(p => {
    if (!scrive(p)) return { ...p, prezzo: p.che === RAGIONA ? 0 : PREZZO_INDIZIO }
    const dallaFine = quanti - 1 - k++
    const i = Math.max(0, PREZZI_FINALI.length - 1 - dallaFine)
    return { ...p, prezzo: PREZZI_FINALI[i] }
  })
}

export const mancano = (monete, p) => Math.max(0, ((p && p.prezzo) || 0) - (monete || 0))
export const puoi = (monete, p) => mancano(monete, p) === 0
export const chiedeConferma = p => !!p && p.prezzo >= CONFERMA_DA

export function guastiDellaScala(passi = [], dove = 'scala') {
  const guasti = []
  if (!passi.length) return [`${dove}: è vuota`]
  for (const [i, p] of passi.entries())
    if (!CHE.includes(p.che)) guasti.push(`${dove}: il gradino ${i + 1} è «${p.che}», che non esiste`)
  if (passi[0].che !== RAGIONA) guasti.push(`${dove}: il primo gradino non è gratis`)
  const prezzi = conIPrezzi(passi).map(p => p.prezzo)
  for (let i = 1; i < prezzi.length; i++)
    if (prezzi[i] < prezzi[i - 1])
      guasti.push(`${dove}: il gradino ${i + 1} costa meno di quello prima (${prezzi[i]} dopo ${prezzi[i - 1]})`)
  if (passi.some(scrive) && passi[passi.length - 1].che !== SVELA)
    guasti.push(`${dove}: l'ultimo gradino non è la soluzione`)
  if (passi.filter(p => p.che === SVELA).length > 1) guasti.push(`${dove}: la soluzione compare due volte`)
  return guasti
}

export const quantoCostaTutta = passi => conIPrezzi(passi).reduce((n, p) => n + p.prezzo, 0)
