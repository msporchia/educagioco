/* ═══════════════════════════════════════════════════════════════════
   I CONCETTI DELL'INGLESE — senza browser.
   `node test/esegui.mjs inglese-concetti`

   Ogni frase delle tappe di frasi appartiene a un concetto, e ogni
   concetto ne ha abbastanza da presentarlo; gli esempi delle pagine usano
   solo parole note. La prima volta una tappa presenta i concetti uno alla
   volta (la pagina, poi tre giuste su quello); rigiocando no. La pagina
   torna ogni cinque sbagli di grammatica sullo stesso concetto, mai per
   uno sbaglio di parola. Il progetto è in docs/lingue/concetti.md.
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { newItem, record } from '../../src/store/srs.js'
import { TAPPE, tappaDi } from '../../src/giochi/inglese/dati/mondi.js'
import { FRASI } from '../../src/giochi/inglese/dati/frasi.js'
import { guastiDeiConcetti, concettoDi, concettiDellaTappa, inPezzi, paginaDi, PER_CONCETTO,
         SBAGLI_PER_LA_PAGINA } from '../../src/giochi/inglese/motore/concetti.js'
import { Sessione } from '../../src/giochi/inglese/motore/sessione.js'
import { sorte, ordineGiusto } from '../../src/giochi/inglese/motore/guasti.js'

const titolo = t => console.log('\n' + t)
const nessuno = (cosa, guasti) => controlla(cosa, guasti.length === 0, guasti.slice(0, 12).join(' · '))

titolo('IL DATO')
nessuno('i concetti stanno in piedi', guastiDeiConcetti())
const diTappe = FRASI.filter(f => tappaDi(f.tappa)?.frasi)
uguale('ogni frase delle tappe ha il suo concetto', diTappe.filter(f => !concettoDi(f.id)).map(f => f.id).join(), '')
controlla('ogni tappa di frasi ne presenta almeno due',
  TAPPE.filter(t => t.frasi).every(t => concettiDellaTappa(t).length >= 2),
  TAPPE.filter(t => t.frasi && concettiDellaTappa(t).length < 2).map(t => t.id).join())
uguale('«Non mi piace» prende le frasi col not', concettoDi(FRASI.find(f => f.en === 'I do not like milk').id).id,
       'i-like:no')
uguale('la domanda va alla domanda', concettoDi(FRASI.find(f => f.en === 'do you like pizza').id).id, 'i-like:domanda')
const pz = inPezzi('I [do not] like milk')
controlla('gli esempi in pezzi: quello che cambia è forte',
  pz.length === 3 && pz[1].forte && pz[1].testo === 'do not' && !pz[0].forte, JSON.stringify(pz))
const p = paginaDi('i-like:no')
controlla('la pagina ha titolo, regola e due esempi', p.genere === 'pagina' && p.titolo && p.spiega && p.esempi.length === 2)

/* Una partita giocata da un bambino: risponde giusto, o sbaglia come gli si chiede. */
function partita(id, { presenta, sbaglia = () => false, quante = 40, bersaglio = null } = {}) {
  const items = new Map()
  const itemDi = k => { if (!items.has(k)) items.set(k, newItem()); return items.get(k) }
  const s = new Sessione({ tappa: tappaDi(id), itemDi, rnd: sorte(4), presenta, partenza: 2, bersaglio })
  const fila = []
  for (let i = 0; i < quante && !s.finita; i++) {
    const q = s.prossima()
    if (!q) break
    if (q.genere === 'pagina') { fila.push({ pagina: q.concetto }); continue }
    const male = sbaglia(q)
    // sbagliare di grammatica: una trappola che pesa sulla forma, o le tessere in un ordine storto
    const trappola = q.opzioni && q.opzioni.find(o => !o.giusta && o.trappola && o.trappola.pesa !== 'parola')
    const giusta = q.opzioni ? q.opzioni.find(o => o.giusta) : ordineGiusto(q)
    const risposta = !male ? giusta : q.opzioni ? (trappola || giusta) : [...giusta].reverse()
    const e = s.rispondi(q, risposta)
    for (const r of e.registra) record(itemDi(r.chiave), { correct: r.correct, now: Date.now() })
    fila.push({ concetto: concettoDi(q.frase)?.id, giusta: e.giusta, pagina: e.pagina ? e.pagina.concetto : null,
                ripresa: !!e.pagina, formato: q.formato })
  }
  return { s, fila }
}

titolo('LA PRESENTAZIONE')
{
  const { s, fila } = partita('seconda-mi-piace', { presenta: true })
  const ordine = concettiDellaTappa(tappaDi('seconda-mi-piace')).map(c => c.id)
  uguale('si comincia con la pagina del primo concetto', fila[0].pagina, ordine[0])
  const pagine = fila.filter(x => x.pagina && !x.ripresa).map(x => x.pagina)
  uguale('una pagina per concetto, nell’ordine', pagine.join(), ordine.join())
  // fra una pagina e l'altra, solo frasi di quel concetto, PER_CONCETTO giuste
  const blocchi = []
  for (const x of fila) {
    if (x.pagina && !x.ripresa) blocchi.push({ id: x.pagina, frasi: [] })
    else if (blocchi.length && blocchi.length <= ordine.length && x.concetto) blocchi[blocchi.length - 1].frasi.push(x)
  }
  for (const b of blocchi.slice(0, -1))
    controlla(`«${b.id}»: ${PER_CONCETTO} frasi sue, poi il concetto dopo`,
      b.frasi.length === PER_CONCETTO && b.frasi.every(x => x.concetto === b.id), b.frasi.map(x => x.concetto).join())
  controlla('finita la presentazione, si mescola e si arriva in fondo', s.finita && !s.inPresentazione)
  const ultimo = blocchi[blocchi.length - 1]
  controlla('dopo l’ultimo blocco vengono anche gli altri concetti',
    new Set(ultimo.frasi.slice(PER_CONCETTO).map(x => x.concetto)).size > 1)

  const rigiocata = partita('seconda-mi-piace', { presenta: false })
  uguale('rigiocando nessuna pagina', rigiocata.fila.filter(x => x.pagina).length, 0)
  const parole = partita('seconda-cibo', { presenta: true })
  uguale('una tappa di parole non ha pagine', parole.fila.filter(x => x.pagina).length, 0)
}

titolo('LA PAGINA TORNA')
{
  // sbaglia sempre «Non mi piace», a tappa già vinta: la pagina torna al quinto sbaglio
  const { fila } = partita('seconda-mi-piace', { presenta: false, quante: 80, bersaglio: 99,
    sbaglia: q => concettoDi(q.frase)?.id === 'i-like:no' })
  const suoi = fila.filter(x => x.concetto === 'i-like:no' && !x.giusta)
  controlla(`ci sono almeno ${SBAGLI_PER_LA_PAGINA} sbagli da contare`, suoi.length >= SBAGLI_PER_LA_PAGINA, suoi.length)
  const conPagina = suoi.map((x, i) => (x.ripresa ? i + 1 : 0)).filter(Boolean)
  uguale('torna al quinto sbaglio e non prima', conPagina[0], SBAGLI_PER_LA_PAGINA)
  controlla('e poi ogni cinque', conPagina.every(n => n % SBAGLI_PER_LA_PAGINA === 0), conPagina.join())
  uguale('la pagina è quella del concetto sbagliato', fila.find(x => x.ripresa).pagina, 'i-like:no')
  const r = paginaDi('i-like:no', { ripresa: true, giustaEra: 'I do not like milk.' })
  controlla('la pagina di ripresa dice la frase giusta', r.ripresa && r.giustaEra === 'I do not like milk.')
}
{
  // gli sbagli di parola (una parola vicina) non riportano la pagina
  const items = new Map()
  const itemDi = k => { if (!items.has(k)) items.set(k, newItem()); return items.get(k) }
  const s = new Sessione({ tappa: tappaDi('seconda-mi-piace'), itemDi, rnd: sorte(2), partenza: 2 })
  let pagine = 0, tentate = 0
  for (let i = 0; i < 60; i++) {
    const q = s.prossima()
    const diParola = q.opzioni && q.opzioni.find(o => !o.giusta && o.trappola && o.trappola.pesa === 'parola')
    const e = s.rispondi(q, diParola || (q.opzioni ? q.opzioni.find(o => o.giusta) : ordineGiusto(q)))
    if (diParola) tentate++
    if (e.pagina) pagine++
  }
  controlla('si sono provati sbagli di parola', tentate >= SBAGLI_PER_LA_PAGINA, tentate)
  uguale('e la pagina non torna mai', pagine, 0)
}

riassunto('I concetti dell’inglese')
