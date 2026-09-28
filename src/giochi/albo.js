// Quello che i giochi nuovi portano all'albo: vedi docs/core/convenzione-giochi.md.
import { GIOCHI_NUOVI } from './indice.js'

const CON_ALBO = GIOCHI_NUOVI.filter(g => g.albo)

export const AREE_GIOCHI = CON_ALBO.map(g => ({
  id: g.chiave, nome: g.nome, emoji: g.icona, classe: g.chiave, ...g.albo.area,
}))

export const TRAGUARDI_GIOCHI = CON_ALBO.flatMap(g =>
  (g.albo.traguardi || []).map(t => ({ ...t, area: g.chiave })))

export const XP_GIOCHI = Object.fromEntries(
  CON_ALBO.filter(g => g.albo.xp).map(g => [g.chiave, g.albo.xp]))

export const MATERIE_GIOCHI = CON_ALBO
  .filter(g => g.albo.materia)
  .map(g => ({ id: g.chiave, ...g.albo.materia }))

export const giochiNuoviProvati = m =>
  CON_ALBO.filter(g => g.albo.provato && g.albo.provato(m)).length

// il test di ogni gioco fa girare questo sul proprio manifesto, non su tutti
export function guastiDellAlbo(giochi = GIOCHI_NUOVI) {
  const guasti = []
  const idVisti = new Set()
  for (const g of giochi) {
    const dove = `gioco "${g.chiave}"`
    if (!g.chiave || !g.nome || !g.icona) { guasti.push(`${dove}: manifesto senza chiave, nome o icona`); continue }
    if (!g.albo) { guasti.push(`${dove}: non porta niente all'albo (nessun blocco "albo")`); continue }
    const a = g.albo
    if (typeof a.xp !== 'function') guasti.push(`${dove}: senza formula dell'esperienza`)
    if (typeof a.provato !== 'function') guasti.push(`${dove}: non dice come si capisce che è stato provato`)
    if (!a.area?.nome || !a.area?.emoji) guasti.push(`${dove}: l'area dell'albo è senza nome o senza emoji`)
    if (!Array.isArray(a.traguardi) || a.traguardi.length < 3)
      guasti.push(`${dove}: ${a.traguardi?.length || 0} traguardi, ne servono almeno tre perché l'area abbia senso`)
    for (const t of a.traguardi || []) {
      const qui = `${dove}, traguardo "${t.id}"`
      if (!t.id || !t.nome || !t.emoji) guasti.push(`${qui}: senza id, nome o emoji`)
      if (idVisti.has(t.id)) guasti.push(`${qui}: id ripetuto`)
      idVisti.add(t.id)
      if (typeof t.come !== 'function' || typeof t.valore !== 'function')
        guasti.push(`${qui}: "come" e "valore" devono essere funzioni`)
      if (!Array.isArray(t.soglie) || !t.soglie.length || t.soglie.length > 3)
        guasti.push(`${qui}: da una a tre soglie`)
      if ((t.soglie || []).some((s, i) => i > 0 && !(s > t.soglie[i - 1])))
        guasti.push(`${qui}: le soglie non salgono`)
      if ((t.soglie || []).some(s => !(s > 0)))
        guasti.push(`${qui}: una soglia a zero è un traguardo già preso`)
    }
  }
  return guasti
}
