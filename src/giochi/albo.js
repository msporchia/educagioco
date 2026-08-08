/* ═══════════════════════════════════════════════════════════════════
   QUELLO CHE I GIOCHI NUOVI PORTANO ALL'ALBO

   I traguardi dei giochi vecchi stanno scritti a mano in
   `data/traguardi.js`, la loro esperienza in `store/progressi.js`, e le
   misure che leggono in una terza lista: aggiungere un gioco voleva dire
   mettere le mani in tre posti lontani fra loro, e sbagliarne uno dava
   un'area a 0/5 o un traguardo che nessuno poteva prendere.

   Qui invece **è il gioco a presentarsi**: nel suo manifesto dichiara un
   blocco `albo` con la sua famiglia, i suoi traguardi, quanto vale in
   esperienza e come si capisce che è stato provato. Questo file li mette
   in fila, e i due file dell'albo li accodano ai propri senza sapere che
   gioco sia. Un gioco nuovo non tocca né `traguardi.js` né `progressi.js`.

   Il blocco, per esteso:

     albo: {
       area:      { nome, emoji }            la famiglia nell'albo
       xp:        m => numero                l'esperienza (vedi XP_AREA)
       provato:   m => vero/falso            per il traguardo «Tuttofare»
       materia:   { prefisso, nome, emoji, totale }   se il gioco insegna
                                             elementi con l'SRS (facoltativo)
       traguardi: [{ id, emoji, nome, come, soglie, valore }]
     }

   L'`id` dell'area è la chiave del gioco: non si dichiara, così non può
   essere diversa da quella con cui il gioco si registra altrove.
   ═══════════════════════════════════════════════════════════════════ */
import { GIOCHI_NUOVI } from './indice.js'

const CON_ALBO = GIOCHI_NUOVI.filter(g => g.albo)

export const AREE_GIOCHI = CON_ALBO.map(g => ({
  id: g.chiave, nome: g.nome, emoji: g.icona, classe: g.chiave, ...g.albo.area,
}))

/* L'area di un traguardo non si scrive nel traguardo: è il gioco che lo
   porta. Così non esiste il caso «traguardo nell'area sbagliata». */
export const TRAGUARDI_GIOCHI = CON_ALBO.flatMap(g =>
  (g.albo.traguardi || []).map(t => ({ ...t, area: g.chiave })))

export const XP_GIOCHI = Object.fromEntries(
  CON_ALBO.filter(g => g.albo.xp).map(g => [g.chiave, g.albo.xp]))

export const MATERIE_GIOCHI = CON_ALBO
  .filter(g => g.albo.materia)
  .map(g => ({ id: g.chiave, ...g.albo.materia }))

/* Quanti dei giochi nuovi sono stati provati almeno una volta: entra nel
   conto del traguardo trasversale «Tuttofare». */
export const giochiNuoviProvati = m =>
  CON_ALBO.filter(g => g.albo.provato && g.albo.provato(m)).length

/* Un blocco `albo` sbagliato non si vede a schermo: si vede come un
   traguardo che non scatta mai o un'area sempre a zero. Il test unitario
   di ogni gioco fa girare questo **sul proprio manifesto**
   (`guastiDellAlbo([manifesto])`): il test di un gioco non deve diventare
   rosso per come è fatto un altro gioco. */
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
