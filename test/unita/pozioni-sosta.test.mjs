/* La tappa delle pozioni lasciata a metà: si scrive, si rilegge, e quella
   ripresa è la stessa pozione — il listino, i misurini, i gettoni e le
   macchie. Vedi docs/pozioni/sosta.md.
   `node test/esegui.mjs pozioni-sosta --niente-build` */
import { CAMPAGNA, INFINITA, giroInfinito } from '../../src/giochi/pozioni/dati/campagna.js'
import { TAGLIERE } from '../../src/giochi/pozioni/motore/procedimento.js'
import { Bottega, caso, giocaBene, seguiLaRicetta, prossimoPasso } from '../../src/giochi/pozioni/motore/bottega.js'
import { MORTAIO } from '../../src/giochi/pozioni/motore/procedimento.js'
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
  seguiLaRicetta(b)
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

/* a metà procedimento: la ricetta è la stessa, e si riparte dal passo dov'era */
{
  const t = CAMPAGNA.find(x => x.chiave === 'massa-virgole')
  const b = new Bottega(t, { rnd: caso(5) })
  for (const [i, g] of b.ingredienti.entries()) for (const k of g.ottimo.pezzi) b.ordina([{ i, k }])
  b.fai('diluisci'); prossimoPasso(b)
  const q = leggi(via(b))
  uguale('la ricetta è la stessa', JSON.stringify([q.passi, q.righe]), JSON.stringify([b.passi, b.righe]))
  uguale('il passo e quello che c\'è', JSON.stringify([q.passo, q.mortaio, q.pestato, q.dentro, q.pasticci]), JSON.stringify([b.passo, b.mortaio, b.pestato, b.dentro, b.pasticci]))
  uguale('il minimo pure', q.minimo, b.minimo)
  seguiLaRicetta(q)
  controlla('e la pozione si finisce', q.finita)
}

/* il tagliere a metà: la roba appoggiata e il coperchio restano; una sosta di prima del tagliere si legge lo stesso */
{
  let b = null
  for (let s = 1; s < 80 && !b; s++) {
    const x = new Bottega(CAMPAGNA.find(t => t.chiave === 'lunghezza-virgole'), { rnd: caso(s) })
    if (['sminuzza', 'copri'].every(a => x.passi.some(p => p.azione === a))) b = x
  }
  for (const [i, g] of b.ingredienti.entries()) for (const k of g.ottimo.pezzi) b.ordina([{ i, k }])
  prossimoPasso(b); prossimoPasso(b)
  const [r] = b.passi[b.passo].cosa
  b.fai('appoggia', [r])
  const dato = JSON.parse(JSON.stringify(scrivi(b, 0)))
  const q = leggi(dato)
  uguale('la roba sul tagliere resta', q.tagliere.join(), String(r))
  uguale('e la si sminuzza', q.fai('sminuzza').giusto, true)
  uguale('il tritato si versa ancora', q.fai('versa', [TAGLIERE]).giusto, true)
  const { tagliere, tagliato, coperto, incantato, ...vecchia } = dato
  uguale('senza quei campi è un tagliere vuoto', leggi(vecchia).tagliere.length, 0)
  /* una sosta di quando c'era il mantice: il suo passo è diventato il coperchio, e si finisce */
  const k = dato.passi.findIndex(p => p.azione === 'copri'), riga = dato.righe.find(r => r.passi.includes(k))
  const m = leggi({ ...dato, passi: dato.passi.map(p => (p.azione === 'copri' ? { ...p, azione: 'soffia' } : p)),
                    righe: dato.righe.map(r => (r === riga ? { ...r, testo: 'Soffia sul fuoco col mantice.' } : r)) })
  uguale('il passo del mantice è il coperchio', m.passi[k].azione, 'copri')
  controlla('e la riga lo dice', m.righe.some(r => r.testo === 'Metti il coperchio sul calderone.'))
}

/* il calderone senza fondo */
{
  const b = new Bottega(giroInfinito(4, ['Elisir di Volo', '🪶', '#6ec6ff']), { rnd: caso(5), scorta: 3 })
  const dato = JSON.parse(JSON.stringify(scrivi(b, -1, { monete: { chiesto: 3, dato: 3 } })))
  const q = leggi(dato)
  uguale('si rilegge', firma(q), firma(b))
  uguale('a che giro era', q.tappa.giro, 4)
  uguale('la mappa dice il suo nome', dice(dato).nome, INFINITA.nome)
}

/* una sosta di quando si partiva con qualcosa in casa: si carica e si finisce com'era */
{
  const t = CAMPAGNA.find(x => x.chiave === 'capacita-inverse')
  const b = new Bottega(t, { rnd: caso(8) })
  const vecchia = via(b)
  const i = b.ingredienti.findIndex(g => g.ottimo.pezzi.length > 1)
  const g = b.ingredienti[i], casa = g.offerte[g.ottimo.pezzi[0]].base
  vecchia.ingredienti = vecchia.ingredienti.map((x, n) => (n === i ? { ...x, casa, messo: casa, pezzi: [casa] } : { ...x, casa: 0 }))
  const q = leggi(vecchia)
  controlla('si carica', !!q)
  uguale('lo strumento è dove era', q.ingredienti[i].messo, casa)
  uguale('il minimo è solo quello che mancava', q.ingredienti[i].ottimo.pezzi.reduce((n, k) => n + q.ingredienti[i].offerte[k].base, 0), g.dose - casa)
  const r = leggi(via(q))
  uguale('e riscrivendola non cambia', r.minimo, q.minimo)
  controlla('il resto delle dosi non ne sa niente', q.ingredienti.filter((_, n) => n !== i).every(x => !('casa' in x)))
  giocaBene(q)
  controlla('e la pozione si finisce con tre stelle', q.finita && q.stelle === 3)
  uguale('una scorta oltre la dose non si legge', leggi({ ...vecchia, ingredienti: vecchia.ingredienti.map((x, n) => (n === i ? { ...x, casa: x.dose + 1 } : x)) }), null)
}

/* una sosta di quando i liquidi avevano la roba secca in dispensa: il mortaio torna sul tavolo */
{
  const t = CAMPAGNA.find(x => x.chiave === 'capacita-inverse')
  const vecchia = via(new Bottega(t, { rnd: caso(8) }))
  const secca = vecchia.ingredienti.length
  vecchia.ingredienti.push({ nome: 'ghiande', unita: 'g', dose: 1, messo: 1, casa: 1, f: true, dispensa: true, traboccate: 0, pezzi: [], offerte: [] })
  vecchia.passi = [{ azione: 'pesta', cosa: [secca] }, { azione: 'versa', cosa: [MORTAIO] },
                   ...vecchia.passi]
  vecchia.righe = [{ testo: 'Pesta ghiande e versa il pestato.', passi: [0, 1] }, ...vecchia.righe.map(r => ({ ...r, passi: r.passi.map(k => k + 2) }))]
  const q = leggi(vecchia)
  controlla('si carica', !!q)
  controlla('per quella pozione il mortaio c\'è', q.tappa.azioni.includes('pesta'))
  uguale('la roba secca non si compra', q.comprati.length, t.ingredienti)
  uguale('e riscrivendola resta', leggi(JSON.parse(JSON.stringify(scrivi(q, CAMPAGNA.indexOf(t), { monete: { chiesto: 0, dato: 0 } })))).ingredienti.filter(g => g.dispensa).length, 1)
  giocaBene(q)
  controlla('e la pozione si finisce con tre stelle', q.finita && q.stelle === 3)
  uguale('le tappe di adesso non cambiano', t.azioni.includes('pesta'), false)
}

/* quello che non torna non si legge */
{
  const b = new Bottega(CAMPAGNA[3], { rnd: caso(6) })
  const buono = via(b)
  uguale('la versione vecchia del banco non si legge', leggi({ ...buono, v: 1 }), null)
  uguale('né quella di prima del procedimento', leggi({ ...buono, v: 3 }), null)
  uguale('una ricetta bucata non si legge', leggi({ ...buono, passi: [{ azione: 'balla', cosa: [] }] }), null)
  uguale('né un passo oltre la fine', leggi({ ...buono, passo: 99 }), null)
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
