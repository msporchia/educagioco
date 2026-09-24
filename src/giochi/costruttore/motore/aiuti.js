/* ═══════════════════════════════════════════════════════════════════
   LA SCALA DEGLI AIUTI DEL COSTRUTTORE — cosa dice, e cosa scrive

   La scala è quella di tutti i giochi che si sbloccano pensando
   (`giochi/aiuti.js`, dove stanno i prezzi). Qui si compone per un
   livello del costruttore:

     ragiona   gratis   `liv.ragiona`: cosa chiede il livello, e la
                        domanda giusta da farsi
     indizio   🪙10     `liv.indizi`: dal più largo al più stretto
     pezzo  ┐
     forma  ├ 🪙50 · 100 · 200   scrivono nel programma, e li ricava da sé
     svela  ┘           dalla `soluzione` del livello

   ── PERCHÉ I GRADINI CHE SCRIVONO NON LI SCRIVE CHI FA IL LIVELLO ──
   Escono dalla soluzione, cioè dal programma che il banco gioca a ogni
   giro (`unita/costruttore`): se il pezzo o la forma fossero scritti a
   mano, il giorno che la soluzione cambia direbbero un'altra cosa, e
   nessuno se ne accorgerebbe fino a quando un bambino non li paga.

   ── IL PEZZO ────────────────────────────────────────────────────────
   Metà del lavoro, e mai il nodo. Tre casi, nell'ordine:
     · il livello ha **progetti suoi** (non gli attrezzi): il
       pezzo sono i progetti, interi. Il programma principale che li usa
       resta del bambino — ed è lì che stanno le misure dell'ordine;
     · il programma principale ha **più righe in cima**: la prima metà
       (per difetto), intera;
     · il programma è **un blocco solo** (un «ripeti», un «ripeti
       finché», un «ripeti per sempre»): il pezzo è quello che il blocco
       ha dentro, scritto fuori dal blocco, **con le domande da
       scegliere**. È il lavoro di un giro; quante volte, fino a quando e
       cosa guardare resta da decidere — che è quasi sempre la lezione
       («ripeti **lungo** volte», «smetti quando c'è il terreno», «aspetta
       che ci sia una cassa»). Con le domande scritte, nel porto il
       pezzo era la soluzione senza la parola «sempre».
   Il pezzo dei progetti si aggiunge al programma del bambino (un
   progetto con lo stesso nome si sostituisce); gli altri due prendono
   il posto del programma principale, e i progetti restano.

   ── LA FORMA ────────────────────────────────────────────────────────
   Tutto il programma, coi valori da scegliere: **N** al posto dei
   numeri, la domanda da scegliere nei «se» e nei «ripeti finché», e i
   colori da scegliere se il livello ne ha più d'uno (con un colore solo
   non c'è niente da scegliere, ed è la stessa regola della cassetta).
   Il verso di un passo e il posto di un mattone restano: si scelgono
   dalla cassetta, sono la forma. Quello che il pezzo aveva già dato —
   comprato, cinquanta monete — resta intero, e anche i progetti che il
   livello dà già fatti (gli attrezzi): un gradino più caro non dà meno
   di quello prima.

   ── LA SOLUZIONE ────────────────────────────────────────────────────
   Tutta, al posto del programma. È l'unico gradino che segna il
   programma come `svelato`, e l'unico che costa la seconda stella: non
   come prezzo — il prezzo sono le monete — ma perché quel programma non
   l'ha scritto il bambino.
   ═══════════════════════════════════════════════════════════════════ */
import { conIPrezzi, RAGIONA, INDIZIO, PEZZO, FORMA, SVELA } from '../../aiuti.js'
import { copia, numera } from '../dati/scrivi.js'

/* due istruzioni sono la stessa se sono uguali a parte gli id, che il
   programma assegna da sé */
const senzaId = x => JSON.stringify(x, (k, v) => (k === 'id' ? undefined : v))
const RAMI = ['corpo', 'allora', 'altrimenti']
/* un programma con le righe senza id, che `numera` rifarà nuovi. Solo le
   RIGHE: l'id di un progetto è il suo nome, ed è quello con cui lo
   chiamano le righe che lo usano — toglierlo lo scollerebbe da tutte */
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

/* ═══════════ il pezzo ═══════════
   Torna `{ sostituisce, programma, dati, testo }`, o `null` se il
   programma è troppo piccolo per averne una metà. `dati` sono le
   istruzioni già date, che la forma terrà intere. */
export function pezzoDi(liv) {
  const sol = liv.soluzione
  const attrezzi = new Set((liv.attrezzi || []).map(p => p.id))
  const suoi = (sol.progetti || []).filter(p => !attrezzi.has(p.id) && !p.attrezzo)
  const lavagnette = [...(sol.lavagnette || [])]
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

/* una copia con le domande da scegliere, a ogni profondità */
function senzaDomande(i) {
  const q = copia(i)
  if ('cond' in q) q.cond = null
  for (const r of RAMI) if (Array.isArray(q[r])) q[r] = q[r].map(senzaDomande)
  return q
}

/* tutte le istruzioni di una fila, a ogni profondità: quelle date da un
   pezzo si riconoscono anche dentro un blocco */
function tutte(fila) {
  const out = []
  const giro = l => (l || []).forEach(i => { out.push(i); for (const r of RAMI) if (Array.isArray(i[r])) giro(i[r]) })
  giro(fila)
  return out
}

/* ═══════════ la forma ═══════════ */
export function formaDi(liv, dati = []) {
  const sol = liv.soluzione
  const conColori = (liv.colori || []).length > 1
  const attrezzi = new Set((liv.attrezzi || []).map(p => p.id))
  const interi = new Set([...attrezzi, ...dati.filter(d => d.progetto).map(d => d.progetto)])
  /* Si confronta **riga per riga**: la testa di un'istruzione (quello
     che ha di suo, senza i rami) già data resta intera, e i rami si
     guardano uno per uno. Confrontando i blocchi interi, un «ripeti 8»
     dato col suo «se» da scegliere dentro non combaciava con quello
     della soluzione, e la forma gli rimetteva la N: un gradino più caro
     che toglie quello che uno più economico aveva dato.
     Una testa data ne tiene intera una sola della soluzione, la prima
     uguale non ancora presa. */
  const date = tutte(dati.filter(d => !d.progetto)).map(testa)
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

/* un'istruzione coi valori da scegliere, e i suoi rami passati a `dentro` */
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

/* ═══════════ scrivere un gradino nel programma ═══════════
   Torna il programma nuovo, e non tocca quello che riceve. Gli id di
   quello che entra si rifanno (`numera`): due righe con lo stesso id si
   accenderebbero insieme. Le lavagnette della soluzione si aggiungono a
   quelle del bambino — un pezzo che usa «h» senza «h» si fermerebbe
   alla prima riga. */
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
