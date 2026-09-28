// La scala degli aiuti del costruttore, composta per livello.
// Prezzi e regole comuni: docs/core/aiuti.md. Cosa dà ogni gradino: docs/costruttore/campagna.md.
import { conIPrezzi, RAGIONA, INDIZIO, PEZZO, FORMA, SVELA } from '../../aiuti.js'
import { copia, numera } from '../dati/scrivi.js'
import { chiamaSeStesso } from './zaino.js'

const senzaId = x => JSON.stringify(x, (k, v) => (k === 'id' ? undefined : v))
const RAMI = ['corpo', 'allora', 'altrimenti']
// Solo le RIGHE perdono l'id: quello di un progetto è il suo nome, e lo scollerebbe dalle chiamate che lo usano.
const riga = i => {
  const q = { ...i }
  delete q.id
  for (const r of RAMI) if (Array.isArray(q[r])) q[r] = q[r].map(riga)
  return q
}
const sfila = p => {
  const c = copia(p)
  return { ...c, principale: (c.principale || []).map(riga),
           progetti: (c.progetti || []).map(q => ({ ...q, corpo: (q.corpo || []).map(riga) })) }
}
/* quello che un'istruzione ha di suo: senza id e senza i rami */
const testa = i => JSON.stringify(i, (k, v) => (k === 'id' || RAMI.includes(k) ? undefined : v))

/* ═══════════ la scala ═══════════ */
export function scalaDi(liv) {
  if (!liv) return []
  const passi = [
    ...(liv.ragiona || []).map(testo => ({ che: RAGIONA, testo })),
    ...(liv.indizi || []).map(testo => ({ che: INDIZIO, testo })),
  ]
  const sol = liv.soluzione
  if (sol) {
    const p = pezzoDi(liv)
    if (p) passi.push({ che: PEZZO, ...p })
    const f = formaDi(liv, p ? p.dati : [])
    if (senzaId(f.principale) !== senzaId(sol.principale) || senzaId(f.progetti) !== senzaId(sol.progetti))
      passi.push({ che: FORMA, sostituisce: 'tutto', programma: f })
    passi.push({ che: SVELA, sostituisce: 'tutto', programma: copia(sol) })
  }
  return conIPrezzi(passi)
}

// Torna { sostituisce, programma, dati, testo }, o null se il programma è troppo piccolo per averne una metà.
export function pezzoDi(liv) {
  const sol = liv.soluzione
  const attrezzi = new Set((liv.attrezzi || []).map(p => p.id))
  const suoi = (sol.progetti || []).filter(p => !attrezzi.has(p.id) && !p.attrezzo)
  const lavagnette = [...(sol.lavagnette || [])]
  if (suoi.length && chiamaSeStesso({ progetti: suoi })) {
    const loro = new Set(suoi.map(p => p.id))
    const senzaChiamate = fila => (fila || []).filter(i => !(i.tipo === 'chiama' && loro.has(i.progetto))).map(i => {
      const q = copia(i)
      for (const r of RAMI) if (Array.isArray(q[r])) q[r] = senzaChiamate(q[r])
      return q
    })
    const pezzi = suoi.map(p => ({ ...copia(p), corpo: senzaChiamate(p.corpo) }))
    return { sostituisce: 'progetti', programma: { principale: [], progetti: pezzi, lavagnette },
             dati: pezzi.flatMap(p => p.corpo),
             testo: `Ti ho scritto il progetto «${suoi[0].nome}» con le sue misure e quello che fa lui. Dove chiama sé stesso, e con quali misure, lo scrivi tu.` }
  }
  if (suoi.length)
    return { sostituisce: 'progetti', programma: { principale: [], progetti: copia(suoi), lavagnette },
             dati: suoi.map(p => ({ progetto: p.id })),
             testo: suoi.length === 1
               ? `Ti ho scritto il progetto «${suoi[0].nome}». Il programma che lo usa, con le sue misure, è tuo.`
               : `Ti ho scritto i progetti: ${suoi.map(p => `«${p.nome}»`).join(', ')}. Il programma che li usa è tuo.` }
  const righe = sol.principale || []
  if (righe.length >= 2) {
    const meta = righe.slice(0, Math.floor(righe.length / 2)).map(senzaDomande)
    return { sostituisce: 'principale', programma: { principale: meta, progetti: [], lavagnette },
             dati: meta, testo: 'Ti ho scritto la prima metà del programma, con le domande da scegliere: il resto è tuo.' }
  }
  const blocco = righe[0]
  const dentro = blocco ? RAMI.flatMap(r => (Array.isArray(blocco[r]) ? blocco[r] : [])) : []
  if (dentro.length) {
    const giro = dentro.map(senzaDomande)
    return { sostituisce: 'principale', programma: { principale: giro, progetti: [], lavagnette },
             dati: giro,
             testo: 'Ti ho scritto il lavoro di un giro, fuori dal blocco che lo contiene. Quale blocco, quante volte o fino a quando, e le domande: quelle le scegli tu.' }
  }
  return null
}

function senzaDomande(i) {
  const q = copia(i)
  if ('cond' in q) q.cond = null
  for (const r of RAMI) if (Array.isArray(q[r])) q[r] = q[r].map(senzaDomande)
  return q
}

// A ogni profondità: quelle date da un pezzo si riconoscono anche dentro un blocco.
function tutte(fila) {
  const out = []
  const giro = l => (l || []).forEach(i => { out.push(i); for (const r of RAMI) if (Array.isArray(i[r])) giro(i[r]) })
  giro(fila)
  return out
}

export function formaDi(liv, dati = []) {
  const sol = liv.soluzione
  const conColori = (liv.colori || []).length > 1
  const attrezzi = new Set((liv.attrezzi || []).map(p => p.id))
  const eSegno = d => !!d.progetto && !d.tipo
  const interi = new Set([...attrezzi, ...dati.filter(eSegno).map(d => d.progetto)])
  // Confronto per testa (senza rami), non a blocchi interi: se no un ramo già scelto viene rimesso a N.
  const date = tutte(dati.filter(d => !eSegno(d))).map(testa)
  const svuota = i => {
    const k = date.indexOf(testa(i))
    if (k < 0) return vuota(i, conColori, svuota)
    date.splice(k, 1)
    const q = copia(i)
    for (const r of RAMI) if (Array.isArray(q[r])) q[r] = i[r].map(svuota)
    return q
  }
  return {
    principale: (sol.principale || []).map(svuota),
    progetti: (sol.progetti || []).map(p => (interi.has(p.id) ? copia(p)
      : { ...copia(p), corpo: (p.corpo || []).map(svuota) })),
    lavagnette: [...(sol.lavagnette || [])],
  }
}

function vuota(i, conColori, dentro) {
  const N = () => ({ vuoto: true })
  const q = { ...i }
  if ('quanto' in q) q.quanto = N()
  if ('volte' in q) q.volte = N()
  if (q.tipo === 'assegna') q.valore = N()
  if (q.tipo === 'chiama') q.argomenti = (q.argomenti || []).map(N)
  if ('cond' in q) q.cond = null
  if (q.tipo === 'metti' && conColori) q.colore = null
  for (const r of RAMI) if (Array.isArray(q[r])) q[r] = q[r].map(dentro)
  return q
}

// Torna il programma nuovo senza toccare quello vecchio; gli id di quello che entra si rifanno con numera().
export function applica(prog, passo) {
  const vecchio = prog || { principale: [], progetti: [], lavagnette: [] }
  const entra = sfila(passo.programma)
  const lavagnette = [...new Set([...(vecchio.lavagnette || []), ...(entra.lavagnette || [])])]
  let nuovo
  if (passo.sostituisce === 'progetti') {
    const nomi = new Set(entra.progetti.map(p => p.id))
    nuovo = { ...copia(vecchio), lavagnette,
              progetti: [...copia(vecchio.progetti || []).filter(p => !nomi.has(p.id)), ...entra.progetti] }
  } else if (passo.sostituisce === 'principale') {
    nuovo = { ...copia(vecchio), lavagnette, principale: entra.principale }
  } else {
    nuovo = { ...entra, lavagnette: entra.lavagnette || [] }
  }
  delete nuovo.svelato
  return numera(nuovo)
}
