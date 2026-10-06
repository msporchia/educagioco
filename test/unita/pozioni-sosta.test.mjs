/* La tappa delle pozioni lasciata a metà: si scrive, si rilegge, e quella
   ripresa è la stessa partita — la ricetta aperta, cosa c'è sul banco, le
   perfette e gli errori. Vedi docs/pozioni/sosta.md.
   `node test/esegui.mjs pozioni-sosta --niente-build` */
import { CAMPAGNA } from '../../src/giochi/pozioni/dati/campagna.js'
import { Partita } from '../../src/giochi/pozioni/motore/partita.js'
import { caso, dosaBene } from '../../src/giochi/pozioni/motore/banco.js'
import { scomponi } from '../../src/giochi/pozioni/motore/misura.js'
import { scrivi, leggi, dice, tappaDi, VERSIONE } from '../../src/giochi/pozioni/motore/sosta.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const via = p => JSON.parse(JSON.stringify(scrivi(p, CAMPAGNA.indexOf(p.tappa))))
const firma = p => JSON.stringify({
  n: p.n, sbagli: p.sbagli, pozioni: p.pozioni, perfette: p.perfette,
  sbagliQui: p.sbagliQui, sbagliRicetta: p.sbagliRicetta, dosi: p.dosi,
  pozione: p.ricetta.nome, cliente: p.ricetta.cliente, scaffale: p.ricetta.scaffale,
  ing: p.ricetta.ingredienti.map(i => [i.nome, i.dose.testo, i.fatto]),
  corrente: p.corrente, inMano: p.inMano, strumento: p.strumento && p.strumento.chiave,
  messi: p.messi, esito: p.esito && [p.esito.tipo, p.esito.codice],
  ultime: p.ultime.map(d => d.testo),
})
const nuova = (t, seme = 3) => new Partita(t, { rnd: caso(seme) })

function finisci(p) {
  if (p.esito) p.riprendi()
  let giri = 0
  while (!p.finita && giri++ < 500) dosaBene(p)
  return [p.stelle, p.pozioni, p.perfette, p.sbagli, p.monete, p.dosiGiuste].join('/')
}

// la dose in corso, fatta fino a metà: ingrediente preso, attrezzo posato, qualche pezzo
function finoAI(p, quanto) {
  const ing = p.daFare[0]
  p.prendi(ing.nome)
  if (quanto === 'preso') return
  p.posa(p.consigliato().chiave)
  if (quanto === 'posato') return
  const pezzi = scomponi(ing.dose.base, p.strumento.pezzi)
  p.metti(pezzi[0])
}

const prima = CAMPAGNA[0], grandi = CAMPAGNA.find(t => t.gradino === 'inverse'), finale = CAMPAGNA.at(-1)

/* ---------- la stessa partita, in ogni punto della dose ---------- */
for (const t of [prima, CAMPAGNA[9], grandi, finale]) {
  for (const quanto of ['niente', 'preso', 'posato', 'pezzo']) {
    const p = nuova(t)
    dosaBene(p)                       // una dose fatta: dosi, monete, ricetta già in corso
    if (quanto !== 'niente') finoAI(p, quanto)
    const dato = via(p)
    const q = leggi(dato)
    controlla(`${t.chiave} (${quanto}): si legge`, !!q)
    uguale(`${t.chiave} (${quanto}): è la stessa partita`, firma(q), firma(p))
    uguale(`${t.chiave} (${quanto}): e finisce allo stesso modo`, finisci(q), finisci(p))
  }
}

/* ---------- dopo gli sbagli: il conto resta, e le stelle non tornano ---------- */
{
  const p = nuova(CAMPAGNA[1])
  p.prendi(p.ricetta.scaffale.find(s => !p.ricetta.ingredienti.some(i => i.nome === s.nome)).nome)
  p.riprendi()
  const ing = p.daFare[0]
  p.prendi(ing.nome)
  const e = p.posa(p.consigliato().chiave)
  p.metti(p.strumento.pezzi[0]); p.metti(p.strumento.pezzi[0])
  const sbagliato = p.conferma()
  controlla('la prova dà uno sbaglio vero', sbagliato.tipo === 'sbaglio' && p.sbagli === 2, JSON.stringify(sbagliato.codice))
  // con lo sbaglio ancora aperto: si rilegge e si può riprovare
  const q = leggi(via(p))
  controlla('lo sbaglio aperto si legge', !!q)
  uguale('gli sbagli restano due', q.sbagli, 2)
  uguale('e sulla dose', q.sbagliQui, p.sbagliQui)
  controlla('l\'aiuto resta quello detto dopo lo sbaglio', q.aiuto && q.aiuto.livello === 'svolto')
  controlla('lo sbaglio è già letto: niente esito', q.esito === null && q.occupato === false)
  uguale('e finisce con le stesse stelle e senza perfette in più', finisci(q), (p.riprendi(), finisci(p)))
  uguale('uscire non ha dato più di una stella in meno del giusto', q.stelle <= 2, true)
}

/* ---------- la dose già nel calderone: pagata e imparata, manca solo andare avanti ---------- */
{
  const p = nuova(CAMPAGNA[2])
  const ing = p.daFare[0]
  p.prendi(ing.nome); p.posa(p.consigliato().chiave)
  for (const pz of scomponi(ing.dose.base, p.strumento.pezzi)) p.metti(pz)
  p.conferma()
  controlla('la prova ha un esito giusto aperto', p.esito && p.esito.tipo === 'giusto')
  const dato = via(p)
  uguale('si scrive lo stato dell\'esito', dato.esito.tipo, 'giusto')
  const q = leggi(dato)
  controlla('si legge', !!q)
  uguale('la dose è già nella conta', q.dosi.length, 1)
  controlla('e l\'esito aspetta chi va avanti', q.esito && q.esito.tipo === 'giusto')
  uguale('uguale a se non si fosse uscito', finisci(q), finisci(p))
}

/* ---------- a tappa finita non si scrive ---------- */
{
  const p = nuova(prima)
  while (!p.finita) dosaBene(p)
  uguale('una tappa finita non si scrive', scrivi(p, 0), null)
  uguale('niente partita, niente sosta', scrivi(null, 0), null)
}

/* ---------- quello che non torna non si legge ---------- */
{
  const p = nuova(CAMPAGNA[5])
  dosaBene(p); finoAI(p, 'pezzo')
  const buono = via(p)
  controlla('il salvataggio buono si legge', !!leggi(buono))
  const rotto = (cosa, muta) => {
    const d = JSON.parse(JSON.stringify(buono))
    muta(d)
    uguale(cosa, leggi(d), null)
  }
  uguale('nessun dato', leggi(null), null)
  uguale('niente', leggi({}), null)
  rotto('un\'altra versione', d => { d.v = VERSIONE + 1 })
  rotto('una tappa che non c\'è più', d => { d.chiave = 'sparita' })
  rotto('un ingrediente sparito', d => { d.ricetta.ingredienti[0].nome = 'polvere di niente' })
  rotto('una dose che la tappa non ha', d => { d.ricetta.ingredienti[0].dose.base = 7777777 })
  rotto('un attrezzo che la tappa non ha', d => { d.strumento = 'botte' })
  rotto('un pezzo che l\'attrezzo non ha', d => { d.messi = [123456] })
  rotto('un cliente fuori dalla tappa', d => { d.n = 99 })
  rotto('un esito senza dose fatta', d => { d.esito = { tipo: 'giusto', pozioneFinita: false } })
  rotto('la ricetta mancante', d => { delete d.ricetta })
  rotto('l\'ingrediente non sullo scaffale', d => { d.ricetta.scaffale = [] })
}

/* ---------- la mappa dice dove si era, senza aprire la partita ---------- */
{
  const p = nuova(CAMPAGNA[4])
  dosaBene(p)
  const d = dice(via(p))
  uguale('il nome della tappa', d.nome, CAMPAGNA[4].nome)
  uguale('l\'indice', d.indice, 4)
  uguale('il cliente in corso', d.cliente, 1)
  uguale('di quanti', d.clienti, CAMPAGNA[4].clienti)
  uguale('niente da dire se la tappa non c\'è', dice({ v: VERSIONE, chiave: 'sparita' }), null)
  uguale('la tappa si ritrova per chiave', tappaDi({ ...via(p), tappa: 0 }).indice, 4)
}

riassunto('pozioni — la tappa lasciata a metà')
