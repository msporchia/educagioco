/* La tappa delle pozioni lasciata a metà: si scrive, si rilegge, e quella
   ripresa è la stessa pozione — il listino, i misurini, i gettoni e le
   macchie. Vedi docs/pozioni/sosta.md.
   `node test/esegui.mjs pozioni-sosta --niente-build` */
import { CAMPAGNA } from '../../src/giochi/pozioni/dati/campagna.js'
import { Bottega, caso, giocaBene } from '../../src/giochi/pozioni/motore/bottega.js'
import { scrivi, leggi, dice, tappaDi, VERSIONE } from '../../src/giochi/pozioni/motore/sosta.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

// `monete` è il borsellino, come lo passa Gioco.vue: non deve pestare i piedi a quelle della pozione
const via = b => JSON.parse(JSON.stringify(scrivi(b, CAMPAGNA.indexOf(b.tappa), { monete: { chiesto: 3, dato: 3 } })))
const firma = b => JSON.stringify({
  pozione: b.pozione, ingredienti: b.ingredienti.map(g => [g.nome, g.dose, g.unita, g.messo, g.pezzi, g.traboccate, g.offerte, g.ottimo.costo]),
  gettoni: b.gettoni, speso: b.speso, minimo: b.minimo,
  macchie: b.macchie, traboccate: b.traboccate, pulizie: b.pulizie, monete: b.monete, saltate: b.saltate,
})
const finisci = b => { b.pulisci(); for (const [i, g] of b.ingredienti.entries())
  while (g.messo < g.dose) b.ordina([{ i, k: g.offerte.map((o, n) => n).filter(n => g.messo + g.offerte[n].base <= g.dose).sort((a, c) => g.offerte[c].base - g.offerte[a].base)[0] }])
  return [b.finita, b.stelle, b.speso, b.monete].join('/') }

for (const t of [CAMPAGNA[0], CAMPAGNA[9], CAMPAGNA[26], CAMPAGNA.at(-1)]) {
  const b = new Bottega(t, { rnd: caso(3) })
  const g = b.ingredienti[0]
  b.ordina([{ i: 0, k: g.ottimo.pezzi[0] }])
  const q = leggi(via(b))
  controlla(`${t.chiave}: si legge`, !!q)
  uguale(`${t.chiave}: è la stessa pozione`, firma(q), firma(b))
  uguale(`${t.chiave}: e finisce allo stesso modo`, finisci(q), finisci(b))
}

/* con la macchia ancora da pulire */
{
  const t = CAMPAGNA.find(x => x.chiave === 'massa-miste')
  const b = new Bottega(t, { rnd: caso(5) })
  const g = b.ingredienti[0]
  g.messo = g.dose - 1 // quasi pieno: qualunque ampolla trabocca
  g.pezzi = [g.messo]
  b.ordina([{ i: 0, k: 0 }])
  uguale('la prova trabocca', b.macchie.join(), '0')
  const q = leggi(via(b))
  uguale('la macchia resta', q.macchie.join(), '0')
  uguale('e prima di ordinare si pulisce', q.ordina([{ i: 1, k: 0 }]), null)
  const d = dice(via(b))
  uguale('la mappa dice le traboccate', d.traboccate, 1)
  uguale('e quanti ingredienti', `${d.fatti}/${d.quanti}`, `0/${t.ingredienti}`)
}

/* quello che non torna non si legge */
{
  const b = new Bottega(CAMPAGNA[3], { rnd: caso(6) })
  const buono = via(b)
  uguale('la versione vecchia del banco non si legge', leggi({ ...buono, v: 1 }), null)
  uguale('né la si dice alla mappa', dice({ ...buono, v: 1 }), null)
  uguale('una tappa sparita non si legge', tappaDi({ ...buono, chiave: 'sparita' }), null)
  uguale('un ingrediente sparito non si legge', leggi({ ...buono, ingredienti: buono.ingredienti.map((g, i) => (i ? g : { ...g, nome: 'niente' })) }), null)
  uguale('un misurino oltre la dose non si legge', leggi({ ...buono, ingredienti: buono.ingredienti.map((g, i) => (i ? g : { ...g, messo: g.dose + 1 })) }), null)
  uguale('un listino bucato non si legge', leggi({ ...buono, ingredienti: buono.ingredienti.map((g, i) => (i ? g : { ...g, offerte: [] })) }), null)
  uguale('i gettoni negativi non si leggono', leggi({ ...buono, speso: -1 }), null)
  uguale('il numero di versione è quello nuovo', buono.v, VERSIONE)
  uguale('una pozione finita non si scrive', scrivi(giocaBene(new Bottega(CAMPAGNA[1], { rnd: caso(2) })), 1), null)
}

riassunto('pozioni — la tappa lasciata a metà')
