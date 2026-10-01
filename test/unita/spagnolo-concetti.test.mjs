/* ═══════════════════════════════════════════════════════════════════
   I CONCETTI DELLO SPAGNOLO — senza browser.
   `node test/esegui.mjs spagnolo-concetti --niente-build`

   Il gemello di unita/inglese-concetti. Ogni frase delle tappe di frasi
   appartiene a un concetto, e ogni concetto ne ha abbastanza da presentarlo;
   gli esempi delle pagine usano solo parole note. La prima volta una tappa
   presenta i concetti uno alla volta (la pagina, poi tre giuste su quello);
   rigiocando no. La pagina torna ogni cinque sbagli di grammatica sullo
   stesso concetto, mai per uno sbaglio di parola. I concetti li scrivono
   altri e cambiano: i controlli sulla presentazione scelgono da sé una tappa
   di frasi pronta (ogni concetto con le sue frasi) e, se non ce n'è, lo
   dicono come «contenuto». Il progetto: docs/lingue/concetti.md e
   spagnolo-motore.md.
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { newItem, record } from '../../src/store/srs.js'
import { TAPPE, tappaDi } from '../../src/giochi/spagnolo/dati/mondi.js'
import { FRASI } from '../../src/giochi/spagnolo/dati/frasi.js'
import { CONCETTI } from '../../src/giochi/spagnolo/dati/concetti.js'
import { eDomanda } from '../../src/giochi/spagnolo/motore/testo.js'
import { guastiDeiConcetti, concettoDi, concettiDellaTappa, frasiDelConcetto, inPezzi, paginaDi, PER_CONCETTO,
         SBAGLI_PER_LA_PAGINA } from '../../src/giochi/spagnolo/motore/concetti.js'
import { Sessione } from '../../src/giochi/spagnolo/motore/sessione.js'
import { sorte, ordineGiusto } from '../../src/giochi/spagnolo/motore/guasti.js'

const titolo = t => console.log('\n' + t)
const nessuno = (cosa, guasti) => controlla(cosa, guasti.length === 0, guasti.slice(0, 12).join(' · '))

titolo('IL DATO')
nessuno('i concetti stanno in piedi', guastiDeiConcetti())
const diTappe = FRASI.filter(f => tappaDi(f.tappa)?.frasi)
controlla('ci sono frasi nelle tappe (contenuto)', diTappe.length > 0)
nessuno('ogni frase delle tappe ha il suo concetto (contenuto)', diTappe.filter(f => !concettoDi(f.id)).map(f => f.id))
{
  const senza = TAPPE.filter(t => t.frasi && concettiDellaTappa(t).length < 2).map(t => t.id)
  controlla('ogni tappa di frasi ne presenta almeno due (contenuto)', senza.length === 0, senza.join())
  // ogni forma delle tappe ha almeno un concetto (una pagina da mostrare)
  const senzaPagina = [...new Set(TAPPE.filter(t => t.frasi).flatMap(t => t.forme))].filter(f => !(CONCETTI[f] || []).length)
  controlla('ogni forma di una tappa di frasi ha dei concetti (contenuto)', senzaPagina.length === 0, senzaPagina.join())
  // dove il primo concetto è «la domanda», prende tutte le domande: i segni ¿? non cambiano il resto
  for (const [forma, lista] of Object.entries(CONCETTI))
    if (lista[0] && /:domanda$/.test(lista[0].id))
      uguale(`${forma}: ogni domanda va al concetto della domanda`,
        FRASI.filter(f => f.forma === forma && eDomanda(f) && concettoDi(f.id)?.id !== lista[0].id).map(f => f.id).join(), '')
}
const pz = inPezzi('es [un] gato negro')
controlla('gli esempi in pezzi: quello che cambia è forte',
  pz.length === 3 && pz[1].forte && pz[1].testo === 'un' && !pz[0].forte, JSON.stringify(pz))
const pd = inPezzi('[¿]es un gato[?]')
controlla('anche i segni della domanda si possono segnare', pd.some(x => x.forte && x.testo === '¿'), JSON.stringify(pd))

/* La tappa di prova: la prima di frasi con almeno due concetti, tutti coi loro frasi. */
const pronta = TAPPE.find(t => t.frasi && concettiDellaTappa(t).length >= 2 &&
  concettiDellaTappa(t).every(c => frasiDelConcetto(c.id, t.id).length >= PER_CONCETTO))
controlla('c’è una tappa di frasi pronta per la presentazione (contenuto)', !!pronta)
const concettiPronti = pronta ? concettiDellaTappa(pronta) : []
const bersaglioDiPagine = concettiPronti.find(c => c.prende) || concettiPronti[0]
if (bersaglioDiPagine) {
  const p = paginaDi(bersaglioDiPagine.id)
  controlla('la pagina ha titolo, regola e almeno due esempi',
    p.genere === 'pagina' && p.titolo && p.spiega && p.esempi.length >= 2)
}
const diParole = TAPPE.find(t => t.argomento)

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
if (pronta) {
  const { s, fila } = partita(pronta.id, { presenta: true })
  const ordine = concettiPronti.map(c => c.id)
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

  const rigiocata = partita(pronta.id, { presenta: false })
  uguale('rigiocando nessuna pagina', rigiocata.fila.filter(x => x.pagina).length, 0)
}
if (diParole) {
  const parole = partita(diParole.id, { presenta: true })
  uguale('una tappa di parole non ha pagine', parole.fila.filter(x => x.pagina).length, 0)
}

titolo('LA PAGINA TORNA')
if (pronta) {
  // sbaglia sempre un concetto, a tappa già vinta: la pagina torna al quinto sbaglio
  const scelto = bersaglioDiPagine.id
  const { fila } = partita(pronta.id, { presenta: false, quante: 80, bersaglio: 99,
    sbaglia: q => concettoDi(q.frase)?.id === scelto })
  const suoi = fila.filter(x => x.concetto === scelto && !x.giusta)
  controlla(`ci sono almeno ${SBAGLI_PER_LA_PAGINA} sbagli da contare`, suoi.length >= SBAGLI_PER_LA_PAGINA, suoi.length)
  const conPagina = suoi.map((x, i) => (x.ripresa ? i + 1 : 0)).filter(Boolean)
  uguale('torna al quinto sbaglio e non prima', conPagina[0], SBAGLI_PER_LA_PAGINA)
  controlla('e poi ogni cinque', conPagina.every(n => n % SBAGLI_PER_LA_PAGINA === 0), conPagina.join())
  uguale('la pagina è quella del concetto sbagliato', fila.find(x => x.ripresa).pagina, scelto)
  const r = paginaDi(scelto, { ripresa: true, giustaEra: 'Es un perro.' })
  controlla('la pagina di ripresa dice la frase giusta', r.ripresa && r.giustaEra === 'Es un perro.')
}
if (pronta) {
  // gli sbagli di parola (una parola vicina) non riportano la pagina
  const items = new Map()
  const itemDi = k => { if (!items.has(k)) items.set(k, newItem()); return items.get(k) }
  const s = new Sessione({ tappa: pronta, itemDi, rnd: sorte(2), partenza: 2 })
  let pagine = 0, tentate = 0
  for (let i = 0; i < 60; i++) {
    const q = s.prossima()
    const diParola = q.opzioni && q.opzioni.find(o => !o.giusta && o.trappola && o.trappola.pesa === 'parola')
    const e = s.rispondi(q, diParola || (q.opzioni ? q.opzioni.find(o => o.giusta) : ordineGiusto(q)))
    if (diParola) tentate++
    if (e.pagina) pagine++
  }
  // la tappa può non avere trappole di parola (dipende dalle frasi): in quel caso il controllo non dice niente
  if (tentate >= SBAGLI_PER_LA_PAGINA) uguale('e la pagina non torna mai per una parola', pagine, 0)
  else controlla(`sbagli di parola da provare in ${pronta.id} (contenuto: una trappola «parola» a mano)`, false, `${tentate}`)
}

riassunto('I concetti dello spagnolo')
