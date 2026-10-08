/* La giornata della bancarella lasciata a metà: si scrive, si rilegge, e
   ripresa è la stessa giornata — banco, cuori, le ceste nello stesso ordine,
   la stessa fila, e il cliente a metà con quello che ha già sul banco.
   Vedi docs/bancarella/regole.md, «Lasciare a metà».
   `node test/esegui.mjs bancarella-sosta --niente-build` */
import { CAMPAGNE, LIBERA, campagnaDi, tappaDi, esposizione, generaCliente,
         CLIENTI_PER_TAPPA } from '../../src/data/bancarella.js'
import { scrivi, leggi, dice, VERSIONE } from '../../src/motore/bancarella/sosta.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

// una giornata apparecchiata come la apparecchia la schermata
function giornata(idx, nTappa, banco = {}) {
  const t = tappaDi(campagnaDi(idx), nTappa)
  const esposti = esposizione(t)
  const coda = Array.from({ length: CLIENTI_PER_TAPPA }, (_, k) => {
    const c = generaCliente(t, esposti)
    return { ...c, restaPazienza: c.pazienza - 3.25 * (k + 1) }
  })
  return { idx, nTappa, hud: { cuori: 2, serviti: 4, perfetti: 1, incasso: 2350, intoppi: 1 },
           esposti, coda, momento: 'raccolta', presi: [], piatto: [], digitato: '',
           contoFatto: false, rifiuti: 0, cartello: false, trascorso: 4200,
           monete: { chiesto: 9, dato: 9 }, ...banco }
}

const viaJSON = d => JSON.parse(JSON.stringify(d))
// `uguale` confronta con ===: liste e oggetti si confrontano scritti
const stessi = (cosa, avuto, atteso) => uguale(cosa, JSON.stringify(avuto), JSON.stringify(atteso))
const firma = c => JSON.stringify([c.articoli.map(a => [a.emoji, a.quanti, a.prezzo]), c.totale,
                                   c.paga, c.resto, c.pagaCon, c.chiave, c.minimo, c.pazienza,
                                   c.faccia, c.vestito, c.chiediTotale, c.chiediResto])

/* ══════════ 1. il cliente a metà della raccolta ══════════ */
{
  const g = giornata(1, 1)
  const primo = g.coda[0].articoli[0]
  g.presi = [primo.emoji]
  const dato = viaJSON(scrivi(g))
  uguale('il salvataggio dice la sua versione', dato.v, VERSIONE)
  uguale('e la giornata per id', dato.giornata, CAMPAGNE[1].id)
  controlla('e sta in poco spazio', JSON.stringify(dato).length < 2000,
            `${JSON.stringify(dato).length} byte`)

  const r = leggi(dato)
  controlla('si rilegge', !!r)
  stessi('la stessa giornata e lo stesso banco', [r.idx, r.nTappa], [1, 1])
  stessi('cuori, serviti, perfetti, incasso e intoppi', r.hud, g.hud)
  stessi('le ceste nello stesso ordine', r.esposti.map(p => p.emoji), g.esposti.map(p => p.emoji))
  stessi('la stessa fila, cliente per cliente', r.coda.map(firma), g.coda.map(firma))
  stessi('con la pazienza che avevano', r.coda.map(c => c.restaPazienza),
         g.coda.map(c => c.restaPazienza))
  stessi('il cliente ha già quello che gli era stato dato', r.banco.presi, [primo.emoji])
  uguale('e il tempo passato al banco conta ancora', r.banco.trascorso, 4200)
  stessi('le monete prese restano nel conto', r.monete, { chiesto: 9, dato: 9 })
  uguale('niente cartello: il cliente era già al banco', r.cartello, false)

  const d = dice(dato)
  stessi('la carta sulla mappa dice dove si era', [d.nome, d.n, d.di, d.cuori, d.serviti],
         [CAMPAGNE[1].nome, 2, CAMPAGNE[1].tappe.length, 2, 4])
}

/* ══════════ 2. alla cassa, con le monete posate e gli errori ══════════ */
{
  // La cassa rotta: il totale indovinato, il resto da contare
  const i = CAMPAGNE.findIndex(c => c.conto === 'tutto')
  const g = giornata(i, 0)
  const c = g.coda[0]
  const pezzo = Math.min(...c.monete)
  Object.assign(g, { momento: 'cassa', contoFatto: true, rifiuti: 2,
                     presi: c.articoli.flatMap(a => Array(a.quanti).fill(a.emoji)),
                     piatto: [pezzo, pezzo] })
  const r = leggi(viaJSON(scrivi(g)))
  controlla('alla cassa si rilegge', !!r)
  stessi('le monete posate restano sul banco', r.banco.piatto, [pezzo, pezzo])
  uguale('il totale già indovinato non si rifà', r.banco.contoFatto, true)
  uguale('e gli sbagli non si azzerano', r.banco.rifiuti, 2)

  // a metà del totale: la cifra battuta resta sul display
  const h = giornata(i, 0)
  Object.assign(h, { momento: 'cassa', digitato: '4,3',
                     presi: h.coda[0].articoli.flatMap(a => Array(a.quanti).fill(a.emoji)) })
  uguale('la cifra battuta a metà resta', leggi(viaJSON(scrivi(h))).banco.digitato, '4,3')
}

/* ══════════ 3. fra un banco e l'altro, e la giornata libera ══════════ */
{
  const g = giornata(-1, 7, { cartello: true })
  const dato = viaJSON(scrivi(g))
  uguale('la giornata libera si ritrova per id', dato.giornata, LIBERA.id)
  const r = leggi(dato)
  controlla('col cartello del banco su si rilegge', !!r && r.cartello && r.banco === null)
  uguale('al banco giusto del giro', r.t.banco, tappaDi(LIBERA, 7).banco)
  uguale('e la carta sa che è la libera', dice(dato).libera, true)
}

/* ══════════ 4. quello che non torna non si legge ══════════ */
{
  const g = giornata(2, 0)
  const dato = viaJSON(scrivi(g))
  uguale('una versione diversa non si legge', leggi({ ...dato, v: VERSIONE + 1 }), null)
  uguale('una giornata che non c\'è più', leggi({ ...dato, giornata: 'sparita' }), null)
  uguale('e la mappa non offre niente', dice({ ...dato, giornata: 'sparita' }), null)
  uguale('un banco oltre la fine della giornata',
         leggi({ ...dato, tappa: CAMPAGNE[2].tappe.length }), null)
  uguale('una cesta tolta dal listino', leggi({ ...dato, esposti: [...dato.esposti, '🛸'] }), null)
  const altro = viaJSON(dato)
  altro.fila[0].articoli[0][0] = '🛸'
  uguale('un cliente che chiede roba che non c\'è', leggi(altro), null)
  const troppi = viaJSON(dato)
  troppi.banco.presi = Array(9).fill(troppi.fila[0].articoli[0][0])
  uguale('più roba data di quella chiesta', leggi(troppi), null)
  const cassa = viaJSON(dato)
  cassa.banco.momento = 'cassa'
  uguale('alla cassa senza aver preso tutto', leggi(cassa), null)
  uguale('senza cuori la giornata era già persa', leggi({ ...dato, cuori: 0 }), null)

  uguale('una giornata finita non si scrive', scrivi({ ...g, finita: true }), null)
  uguale('senza salvataggio nessuna carta', dice(null), null)
}

riassunto('bancarella — la giornata lasciata a metà')
