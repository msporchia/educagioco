// Il verdetto del porto: cosa dichiara `obiettivo` è in docs/costruttore/porto.md.
import { coloreAlFemminile, eFemminile, nel } from './mondo.js'

const maiuscola = s => (s ? s[0].toUpperCase() + s.slice(1) : s)
const casse = n => (n === 1 ? '1 cassa' : `${n} casse`)
// Nel sacco della posta sono lettere, e «3 casse» sarebbe falso.
const cose = pila => (pila.length && pila.every(c => c.tipo === 'biglietto')
  ? (pila.length === 1 ? '1 lettera' : `${pila.length} lettere`) : casse(pila.length))

export function esitoDelPorto(porto) {
  const frasi = []
  const mancano = [], sbagliati = []
  const obiettivo = porto.obiettivo || {}

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

  for (const [id, voglio] of Object.entries(obiettivo.cassoni || {})) {
    const k = porto.cassone(id)
    if (k < 0) { frasi.push(`Il cassone «${id}» non c'è.`); continue }
    const a = porto.arredo[k]
    const n = porto.pile[k].length
    const ci = n === 1 ? 'c\'è' : 'ci sono'
    if (voglio.vuoto && n)
      frasi.push(`${maiuscola(a.nome)} a sera doveva essere ${eFemminile(a.nome) ? 'vuota' : 'vuoto'}, e ${ci} ancora ${cose(porto.pile[k])}.`)
    if (typeof voglio.quante === 'number' && n !== voglio.quante)
      frasi.push(n === 0 ? `${maiuscola(nel(a.nome))} non c'è nessuna cassa, e ne volevano ${voglio.quante}.`
        : n < voglio.quante ? `${maiuscola(nel(a.nome))} ${ci} ${casse(n)}, e ne volevano ${voglio.quante}.`
          : `${maiuscola(nel(a.nome))} ${ci} ${casse(n)}: ne volevano solo ${voglio.quante}.`)
  }

  const c = porto.clienti
  if (c && obiettivo.serviti !== false && c.serviti < c.totale)
    frasi.push(c.serviti === 0
      ? `Nessun cliente è stato servito: ne sono venuti ${c.totale}.`
      : `Hai servito ${c.serviti} clienti su ${c.totale}.`)

  const g = porto.gru
  if (g && obiettivo.gru !== false) {
    if (g.casse.length)
      frasi.push(`La gru aveva ancora ${casse(g.casse.length)} da calare: il suo punto non si è mai liberato.`)
    else if (porto.pile[porto.k(g.x, g.y)].length)
      frasi.push('Sotto la gru è rimasta una cassa: nessuno l\'ha portata via.')
  }

  const cm = porto.camion
  if (cm && obiettivo.camion !== false && cm.partiti < cm.totale)
    frasi.push(cm.partiti === 0
      ? `Nessun camion è ripartito pieno: ne sono arrivati ${cm.totale}.`
      : `Sono ripartiti pieni ${cm.partiti} camion su ${cm.totale}.`)

  if (obiettivo.inOrdine) frasi.push(...inOrdine(porto, obiettivo.inOrdine))

  if (porto.mano && obiettivo.mani !== false)
    frasi.push(`Il robot ha ancora in mano ${porto.mano.tipo === 'cassa' ? 'una cassa' : 'un biglietto'}: non è arrivata da nessuna parte.`)

  return { vinto: frasi.length === 0, frasi, mancano, sbagliati }
}

// Con `colori` le cose sono casse, e il loro posto in fila è quello del colore nell'elenco; senza, lettere col loro numero.
function inOrdine(porto, { y, da, a, cassone = null, colori = null }) {
  const frasi = []
  const cose = []
  if (cassone != null) {
    const k = porto.cassone(cassone)
    if (k < 0) return [`Il cassone «${cassone}» non c'è.`]
    cose.push(...porto.pile[k])
  } else {
    for (let x = da; x <= a; x++) cose.push(porto.cimaDi(porto.k(x, y)))
  }
  const giuste = c => (colori ? c && c.tipo === 'cassa' && colori.includes(c.colore) : c && c.tipo === 'biglietto')
  const vuote = cose.filter(c => !giuste(c)).length
  const nome = colori ? ['cassa', 'casse'] : ['lettera', 'lettere']
  if (cassone == null && vuote) {
    frasi.push(vuote === 1 ? `Sullo scaffale manca una ${nome[0]}: è rimasta da qualche altra parte.`
      : `Sullo scaffale mancano ${vuote} ${nome[1]}: sono rimaste da qualche altra parte.`)
    return frasi
  }
  const posto = c => (colori ? colori.indexOf(c.colore) : c.numero)
  const fila = cose.filter(giuste)
  const k = fila.findIndex((c, i) => i > 0 && posto(c) < posto(fila[i - 1]))
  if (k > 0) {
    const di = c => (colori ? `una ${coloreAlFemminile(c.colore)}` : `il ${c.numero}`)
    const dove = cassone != null ? 'Nel sacco le lettere non sono in ordine, dal fondo in su' : `Le ${nome[1]} non sono in ordine`
    frasi.push(`${dove}: ${di(fila[k - 1])} viene prima ${colori ? 'di' : 'del'} ${colori ? di(fila[k]) : fila[k].numero}.`)
  }
  return frasi
}
