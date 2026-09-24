/* ═══════════════════════════════════════════════════════════════════
   COM'È ANDATA LA GIORNATA — il verdetto del porto

   Nel cantiere il verdetto era uno: il disegno è venuto? Nel porto una
   giornata può chiedere più cose, e il livello le **dichiara** invece di
   scriverle in codice (`obiettivo`, nel livello o nell'ordine):

     bersagli    le casse disegnate in trasparenza (la lettera minuscola
                 nella mappa) sono al loro posto, del colore giusto. Vale
                 da sé se la mappa ne ha
     cassoni     { <nome>: { quante: 5 } } — quante casse ci devono
                 essere alla fine in quel cassone; `vuoto: true` per dire
                 che deve restare vuoto
     serviti     tutti i clienti se ne sono andati contenti. Vale da sé
                 se nella giornata ci sono clienti
     gru         la gru ha calato tutte le sue casse, e sotto di lei non
                 ne è rimasta nessuna. Vale da sé se c'è la gru
     mani        a sera il robot non ha niente in mano: una cassa in
                 mano non è consegnata. Vale sempre

   Quello che va storto **durante** la giornata — una cassa in mare, un
   cliente arrabbiato, una cassa del colore sbagliato — non arriva fin
   qui: ferma la giornata nel momento in cui succede (`Inciampo`), perché
   è lì che si vede. Qui si guarda solo com'è finita.

   Le frasi dicono cosa manca con i numeri, non «riprova»: «nel camion ci
   sono 3 casse, e ne volevano 5» è una cosa su cui si può ragionare.
   ═══════════════════════════════════════════════════════════════════ */
import { coloreAlFemminile, eFemminile, nel } from './mondo.js'

const maiuscola = s => (s ? s[0].toUpperCase() + s.slice(1) : s)
const casse = n => (n === 1 ? '1 cassa' : `${n} casse`)

export function esitoDelPorto(porto) {
  const frasi = []
  const mancano = [], sbagliati = []
  const obiettivo = porto.obiettivo || {}

  /* le casse disegnate in trasparenza */
  if (obiettivo.bersagli !== false) {
    for (const [k, colore] of porto.bersaglio) {
      const cima = porto.cimaDi(k)
      if (!cima || cima.tipo !== 'cassa') mancano.push(porto.xy(k))
      else if (cima.colore !== colore) sbagliati.push({ ...porto.xy(k), atteso: colore, trovato: cima.colore })
    }
    if (mancano.length)
      frasi.push(mancano.length === 1 ? 'Manca una cassa al suo posto.' : `Mancano ${mancano.length} casse al loro posto.`)
    for (const s of sbagliati)
      frasi.push(`Dove ci voleva una cassa ${coloreAlFemminile(s.atteso)} ce n'è una ${coloreAlFemminile(s.trovato)}.`)
  }

  /* quante casse ci sono nei cassoni */
  for (const [id, voglio] of Object.entries(obiettivo.cassoni || {})) {
    const k = porto.cassone(id)
    if (k < 0) { frasi.push(`Il cassone «${id}» non c'è.`); continue }
    const a = porto.arredo[k]
    const n = porto.pile[k].length
    const ci = n === 1 ? 'c\'è' : 'ci sono'
    if (voglio.vuoto && n)
      frasi.push(`${maiuscola(a.nome)} doveva restare ${eFemminile(a.nome) ? 'vuota' : 'vuoto'}, e ${ci} ancora ${casse(n)}.`)
    if (typeof voglio.quante === 'number' && n !== voglio.quante)
      frasi.push(n === 0 ? `${maiuscola(nel(a.nome))} non c'è nessuna cassa, e ne volevano ${voglio.quante}.`
        : n < voglio.quante ? `${maiuscola(nel(a.nome))} ${ci} ${casse(n)}, e ne volevano ${voglio.quante}.`
          : `${maiuscola(nel(a.nome))} ${ci} ${casse(n)}: ne volevano solo ${voglio.quante}.`)
  }

  /* i clienti */
  const c = porto.clienti
  if (c && obiettivo.serviti !== false && c.serviti < c.totale)
    frasi.push(c.serviti === 0
      ? `Nessun cliente è stato servito: ne sono venuti ${c.totale}.`
      : `Hai servito ${c.serviti} clienti su ${c.totale}.`)

  /* la gru: ha calato tutto, e tutto è stato portato via */
  const g = porto.gru
  if (g && obiettivo.gru !== false) {
    if (g.casse.length)
      frasi.push(`La gru aveva ancora ${casse(g.casse.length)} da calare: il suo punto non si è mai liberato.`)
    else if (porto.pile[porto.k(g.x, g.y)].length)
      frasi.push('Sotto la gru è rimasta una cassa: nessuno l\'ha portata via.')
  }

  /* a sera le mani sono vuote: una cassa in mano non è consegnata */
  if (porto.mano && obiettivo.mani !== false)
    frasi.push(`Il robot ha ancora in mano ${porto.mano.tipo === 'cassa' ? 'una cassa' : 'un biglietto'}: non è arrivata da nessuna parte.`)

  return { vinto: frasi.length === 0, frasi, mancano, sbagliati }
}
