/* Il banco del bambino: la cassa, la tenda, il carretto, la merce.
   Vedi docs/bancarella/banco.md. La promessa grossa: **chi non compra niente
   può finire il gioco**, e le giornate dei centesimi hanno i centesimi anche
   col banco di partenza.
   `node test/esegui.mjs bancarella-banco --niente-build` */
import { CAMPAGNE, LIBERA, LISTINO, BANCHI, MAX_CESTE, tappaDi, esposizione, generaCliente,
         scomponi } from '../../src/data/bancarella.js'
import { CARRETTI, TENDE, MERCE_BASE, MERCE_NUOVA, prezzoMerce, bancoPulito, merceMia, cesteDi, pazienzaDi,
         costoDi, compra, puoiComprare } from '../../src/data/bancarella-banco.js'
import { scrivi, leggi } from '../../src/motore/bancarella/sosta.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const nuovo = () => bancoPulito(null)

/* ── il catalogo ── */
const prodotti = LISTINO.map(([e]) => e)
const base = Object.values(MERCE_BASE).flat()
const daComprare = Object.values(MERCE_NUOVA).flat()
uguale('ogni prodotto è o di partenza o da comprare', base.length + daComprare.length, prodotti.length)
for (const [b, lista] of Object.entries(MERCE_BASE))
  controlla(`la merce di partenza di ${b} è di quel banco`,
            lista.every(e => LISTINO.find(p => p[0] === e)?.[3] === b))
uguale('tutti i banchi hanno la loro merce di partenza', Object.keys(MERCE_BASE).sort().join(), Object.keys(BANCHI).sort().join())
uguale('si comincia con quattro ceste', cesteDi(nuovo()), 4)
uguale('e si arriva a tutte quelle che il banco regge', CARRETTI[CARRETTI.length - 1].ceste, MAX_CESTE)
controlla('le scale salgono', [CARRETTI, TENDE].every(s => s.every((g, i) => i === 0 || g.prezzo > s[i - 1].prezzo)))
controlla('un prodotto che rende di più costa di più', prezzoMerce(500) > prezzoMerce(100))

/* ── chi non compra niente arriva in fondo ── */
const guasti = new Set()
const fini = {}
for (const camp of [...CAMPAGNE, LIBERA]) {
  const b = nuovo()
  for (let n = 0; n < camp.tappe.length; n++) {
    const t = tappaDi(camp, n)
    let conFini = 0
    for (let g = 0; g < 200; g++) {
      const e = esposizione(t, { merce: merceMia(b), ceste: cesteDi(b) })
      if (e.length !== 4) guasti.add(`${camp.id}/${t.banco}: ${e.length} ceste`)
      if (e.length < camp.articoli[1]) guasti.add(`${camp.id}/${t.banco}: poca merce`)
      if (e.some(p => !merceMia(b).has(p.emoji))) guasti.add(`${camp.id}: sul banco c'è merce non comprata`)
      const c = generaCliente(t, e)
      if (c.articoli.some(a => !e.some(p => p.emoji === a.emoji))) guasti.add(`${camp.id}: chiede roba che non c'è`)
      if (c.resto <= 0) guasti.add(`${camp.id}: resto nullo`)
      if (scomponi(c.resto, c.monete).reduce((s, v) => s + v, 0) !== c.resto) guasti.add(`${camp.id}: resto non componibile`)
      if (camp.tetto && !c.riesce && c.totale > camp.tetto) guasti.add(`${camp.id}: sopra il tetto`)
      if (camp.passo < 100 && e.some(p => p.prezzo % (camp.passo === 50 ? 100 : camp.passo === 10 ? 50 : camp.passo === 5 ? 10 : 5))) conFini++
    }
    if (camp.passo < 100) fini[`${camp.id}/${t.banco}`] = conFini
  }
}
controlla('col banco di partenza si gioca tutta la fila', guasti.size === 0, [...guasti].slice(0, 5).join(' · '))
const tonde = Object.entries(fini).filter(([, n]) => n < 200)
nota('giornate e banchi senza il cartellino del loro passo: ' + (tonde.map(([k]) => k).join(' ') || 'nessuno'))
/* non tutti i banchi hanno un prodotto a ogni passo (al frigo le decine di centesimi non ci sono), ma ogni giornata ne ha */
for (const camp of CAMPAGNE.filter(c => c.passo < 100))
  controlla(`${camp.id}: la giornata ha i cartellini del suo passo`,
            camp.tappe.some(b => fini[`${camp.id}/${b}`] === 200), camp.tappe.join(' '))

/* ── comprare ── */
{
  const b = bancoPulito({ cassa: 1000 })
  uguale('senza soldi non si compra', compra(b, { che: 'tenda' }), null)
  controlla('e il pallino resta spento se non basta niente', !puoiComprare(bancoPulito({ cassa: 999 })))
  const ricco = bancoPulito({ cassa: 100000 })
  const t = compra(ricco, { che: 'tenda' })
  uguale('la tenda sale di un gradino', t.tenda, 1)
  uguale('e la cassa scende del suo prezzo', t.cassa, 100000 - TENDE[1].prezzo)
  uguale('il banco di prima non si tocca', ricco.tenda, 0)
  uguale('la tenda fa aspettare i clienti', pazienzaDi(t), TENDE[1].pazienza)
  const c = compra(ricco, { che: 'carretto' })
  uguale('il carretto porta una cesta in più', cesteDi(c), 5)
  const m = daComprare[0]
  const dopo = compra(ricco, { che: 'merce', emoji: m.emoji })
  controlla('il prodotto comprato è sul banco', merceMia(dopo).has(m.emoji))
  uguale('e non si ricompra', costoDi(dopo, { che: 'merce', emoji: m.emoji }), null)
  uguale('la merce di partenza non si vende', costoDi(ricco, { che: 'merce', emoji: base[0] }), null)
  const cima = bancoPulito({ cassa: 100000, tenda: 99, carretto: 99 })
  uguale('in cima alla scala non si sale', compra(cima, { che: 'tenda' }), null)
  uguale('con la bottega si riempie il banco', esposizione(tappaDi(LIBERA, 0), { merce: merceMia(cima), ceste: cesteDi(cima) }).length, MAX_CESTE)
}

/* ── il salvataggio ── */
uguale('chi giocava prima trova in cassa quello che aveva incassato', bancoPulito(null, 4250).cassa, 4250)
uguale('ma una volta salvata comanda la cassa', bancoPulito({ cassa: 100 }, 4250).cassa, 100)
uguale('una cassa rotta si rifà', bancoPulito({ cassa: -5 }, 300).cassa, 300)
uguale('un prodotto sparito dal listino si lascia andare', bancoPulito({ merce: ['🦄', daComprare[0].emoji] }).merce.length, 1)

/* ── la sosta: i soldi in mano e chi riesce si ritrovano ── */
{
  const camp = CAMPAGNE.findIndex(c => c.id === 'tutte')
  const t = tappaDi(CAMPAGNE[camp], 0)
  const esposti = esposizione(t)
  let c = null
  for (let i = 0; i < 50 && !c; i++) c = generaCliente(t, esposti, { riesce: true })
  c = { ...c, pazienza: c.pazienza + 12, restaPazienza: c.pazienza + 5 }
  const foto = presi => ({ idx: camp, nTappa: 0, hud: { cuori: 3, serviti: 0, perfetti: 0, incasso: 0, intoppi: 0 },
                           esposti, coda: [c], momento: 'raccolta', presi, piatto: [], digitato: '',
                           contoFatto: false, rifiuti: 0, cartello: false, trascorso: 100, monete: {} })
  const emoji = c.articoli[0].emoji
  const dato = JSON.parse(JSON.stringify(scrivi(foto(Array(c.articoli[0].quanti + 2).fill(emoji)))))
  const g = leggi(dato)
  controlla('anche con una di troppo sul banco si riprende', !!g)
  uguale('chi riesce resta chi riesce', g && g.coda[0].riesce, true)
  uguale('coi suoi stessi soldi in mano', JSON.stringify(g && g.coda[0].pagaCon), JSON.stringify(c.pagaCon))
  uguale('e la pazienza della tenda', g && g.coda[0].pazienza, c.pazienza)
}

riassunto('il banco della bancarella')
