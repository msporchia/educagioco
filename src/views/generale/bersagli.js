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
import { VERBI, nomiDi, laCosa } from '../../motore/generale.js'

/* le cose che quel verbo accetta E che hanno un nome. Le caselle sono
   sempre un bersaglio buono, ma non sono voci di elenco: la lista che
   serve qui è quella dei nomi, e il motore la sa già fare. */
export const conNome = (mondo, v) => (mondo ? nomiDi(mondo, v) : [])

/* le stesse, già pronte da mostrare: `{ id, nome, em }` */
export const cosePer = (mondo, v) =>
  conNome(mondo, v).map(k => laCosa(mondo, k)).filter(Boolean)

/* ── SI INDICA COL DITO SOLO QUELLO CHE NON SI SPOSTA ──
   Un punto sulla mappa vuol dire «quella casella lì». Va bene per le
   cose immobili — una porta, un posto, una zona: dove sono adesso è
   dove saranno sempre, e indicarle è dire il loro nome con un gesto.
   Non va bene per un tesoro e per un'unità: **la stessa cosa sta in un
   punto diverso in ogni battaglia**, e il piano si firma prima di
   sapere quale tocca. Indicare il forziere che si vede adesso insegna
   il contrario di quello che il gioco vuole insegnare — e a schermo si
   vede subito: si sceglie un bersaglio, si sfoglia la situazione dopo,
   e quel bersaglio non è più lì.
   Quindi le cose che si spostano si scelgono **per nome**, da un
   elenco: «il tesoro» segue il tesoro dovunque finisca, ed è la stessa
   ragione per cui `prendi [il tesoro]` batte `vai [8,1]`. */
const POSATO = { posto: 1, porta: 1, zona: 1 }

/* questo verbo il bersaglio se lo fa dare dalla mappa o da un elenco? */
export function suMappa (mondo, v) {
  /* c'è chi lo dichiara: `attacca` parla di CLASSI di nemici, e una
     classe non sta in un punto della mappa */
  if (VERBI[v] && VERBI[v].elenco) return false
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
  /* ── «È IN PIEDI?» SI CHIEDE A LEI ──
     Le viste leggevano `u.viva`, che non esiste più: la classe `Unita`
     tiene lo stato per sé e risponde a `eInPiedi()`. `undefined` è
     falso, quindi ogni unità risultava caduta — nessuna compariva fra i
     bersagli, e sul campo si disegnavano tutte stese. Una riga sola, e
     chi la chiama non deve sapere come è fatta dentro. */
  const inPiedi = u => !!u && (typeof u.eInPiedi === 'function' ? u.eInPiedi() : u.inPiedi !== false)

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
      /* ── SI CERCA PER `id`, NON PER `nome` ──
         Erano la stessa stringa, e questa riga diceva `z.nome === k`.
         Da quando `allestimento.js` dà a ogni cosa il nome che si legge
         in una frase («il tesoro»), cercare per nome una chiave
         (`tesoro`) non trova più niente: il bersaglio spariva
         dall'elenco, e l'ordine non si poteva nemmeno comporre. */
      const o = mondo.oggetti.find(z => z.id === k)
      if (o && !o.preso) agg(k, o.x, o.y)
      else if (o && o.preso && inPiedi(mondo.perId[o.preso]))
        agg(k, mondo.perId[o.preso].x, mondo.perId[o.preso].y)
    } else if (C.tipo === 'unita') { const u = mondo.perId[k]; if (inPiedi(u)) agg(k, u.x, u.y) }
    else if (C.tipo === 'fazione')
      mondo.unita.filter(z => inPiedi(z) && z.fazione === k).forEach(z => agg(k, z.x, z.y))
  }
  return out
}

/* come si legge il nome di una cosa, e con che faccia */
export const nomeDi = (mondo, id) => { const C = mondo && laCosa(mondo, id); return C ? C.nome : id }
export const emDi = (mondo, id) => { const C = mondo && laCosa(mondo, id); return C ? C.em : '•' }
