/* ═══════════════════════════════════════════════════════════════════
   CHI PUÒ FARE DA BERSAGLIO A UN VERBO

   Un verbo dichiara cosa accetta (`vai` accetta posti, oggetti, porte,
   unità, fazioni e celle qualsiasi); il mondo dice quali di quelle cose
   esistono adesso e dove stanno. Qui si mette insieme la domanda che si
   fanno in due: l'editor, per sapere se un bersaglio si sceglie da un
   elenco o si tocca sulla mappa, e il campo, per accendere le caselle
   giuste mentre il dito cerca.

   ── LA REGOLA ────────────────────────────────────────────────────
   La LISTA mostra i nomi, la MAPPA dà le posizioni. Una casella è un
   bersaglio legittimo — «vai lì, dietro quel muro» — ma non è una voce
   di elenco: su una mappa 30×18 diventavano cinquecento righe «la
   casella 19,15», e fra quelle la chiave non si trovava più.
   ═══════════════════════════════════════════════════════════════════ */
import { VERBI, complementiDi, laCosa } from '../../motore/generale.js'

/* le cose che quel verbo accetta E che hanno un nome */
export const conNome = (mondo, v) => (mondo ? complementiDi(mondo, v) : [])
  .filter(k => { const C = laCosa(mondo, k); return C && C.tipo !== 'cella' })

/* le stesse, già pronte da mostrare: `{ id, nome, em }` */
export const cosePer = (mondo, v) =>
  conNome(mondo, v).map(k => laCosa(mondo, k)).filter(Boolean)

/* i tipi che stanno FERMI in un posto, e quindi si possono indicare col
   dito invece che leggere in un elenco */
const POSATO = { posto: 1, oggetto: 1, porta: 1, unita: 1, fazione: 1, zona: 1 }

/* questo verbo il bersaglio se lo fa dare dalla mappa o da un elenco? */
export function suMappa (mondo, v) {
  const l = conNome(mondo, v)
  /* un verbo che qui non ha nemmeno una cosa con un nome vive solo di
     caselle: allora il bersaglio si indica, per forza */
  if (!l.length) return !!(VERBI[v] && VERBI[v].accetta.includes('cella'))
  return l.every(k => POSATO[laCosa(mondo, k).tipo])
}

/* dove sono adesso, in caselle, le cose che quel verbo può prendere.
   Una cosa può essere in più posti — una fazione sono tutti i suoi — e
   un oggetto preso sta addosso a chi l'ha preso. */
export function bersagliDi (mondo, verbo) {
  if (!mondo || !verbo) return []
  const out = []
  const agg = (id, x, y) => {
    const C = laCosa(mondo, id)
    if (C) out.push({ id, x, y, nome: C.nome, em: C.em })
  }
  for (const k of conNome(mondo, verbo)) {
    const C = laCosa(mondo, k)
    if (C.tipo === 'posto') agg(k, mondo.posti[k].x, mondo.posti[k].y)
    else if (C.tipo === 'porta') agg(k, mondo.porte[k].x, mondo.porte[k].y)
    else if (C.tipo === 'zona') (mondo.zone[k] || []).forEach(t => agg(k, t.x, t.y))
    else if (C.tipo === 'oggetto') {
      const o = mondo.oggetti.find(z => z.nome === k)
      if (o && !o.preso) agg(k, o.x, o.y)
      else if (o && o.preso && mondo.perId[o.preso].viva)
        agg(k, mondo.perId[o.preso].x, mondo.perId[o.preso].y)
    } else if (C.tipo === 'unita') { const u = mondo.perId[k]; if (u && u.viva) agg(k, u.x, u.y) }
    else if (C.tipo === 'fazione')
      mondo.unita.filter(z => z.viva && z.fazione === k).forEach(z => agg(k, z.x, z.y))
  }
  return out
}

/* come si legge il nome di una cosa, e con che faccia */
export const nomeDi = (mondo, id) => { const C = mondo && laCosa(mondo, id); return C ? C.nome : id }
export const emDi = (mondo, id) => { const C = mondo && laCosa(mondo, id); return C ? C.em : '•' }
