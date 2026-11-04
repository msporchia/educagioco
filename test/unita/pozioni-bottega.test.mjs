/* La bottega del mercante (in prova): ogni pozione si compone, il
   minimo è davvero il minimo, il trucco del mercante c'è, l'ordine si
   paga tutto e si versa in fila, e traboccare costa l'ampolla e la pulizia. Vedi docs/pozioni/bottega.md.
   `node test/esegui.mjs pozioni-bottega --niente-build` */
import { PROVE, PULIZIA, MONETE_A_DOSE } from '../../src/giochi/pozioni/dati/bottega.js'
import { Bottega, ottimo, giocaBene, giocaGoloso } from '../../src/giochi/pozioni/motore/bottega.js'
import { caso } from '../../src/giochi/pozioni/motore/banco.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const SEMI = 300

/* ---------- ogni pozione si fa, e chi fa il minimo prende tre stelle ---------- */
for (const t of PROVE) {
  let rotte = 0, gemelli = 0, sotto = 0, golosoTre = 0, extraGoloso = 0
  for (let s = 1; s <= SEMI; s++) {
    const b = new Bottega(t, { rnd: caso(s) })
    for (const g of b.ingredienti) {
      if (!g.ottimo || g.offerte.length !== 4) rotte++
      const etichette = new Set(g.offerte.map(o => `${o.base} ${o.unita}`))
      if (etichette.size !== 4) rotte++
      if (new Set(g.offerte.map(o => o.base)).size < 4) gemelli++
    }
    giocaBene(b)
    if (!b.finita || b.stelle !== 3 || b.resto !== t.margine || b.traboccate) sotto++
    const c = giocaGoloso(new Bottega(t, { rnd: caso(s) }))
    if (!c.finita) rotte++
    if (c.stelle === 3) golosoTre++
    extraGoloso += c.extra
  }
  uguale(`${t.chiave}: ogni banchetto ha quattro ampolle diverse, la dose si compone e il goloso non s'incastra`, rotte, 0)
  uguale(`${t.chiave}: chi compra il minimo finisce con tre stelle e il margine intatto`, sotto, 0)
  controlla(`${t.chiave}: il trucco del mercante c'è spesso`, gemelli > SEMI * t.ingredienti * 0.5, `${gemelli} gemelli`)
  nota(`${t.chiave}: il goloso (la più grande che ci sta) fa tre stelle ${golosoTre}/${SEMI}, spende ${(extraGoloso / SEMI).toFixed(1)} gettoni in più`)
}

/* ---------- il minimo è il minimo: contro la forza bruta ---------- */
{
  const offerte = [{ base: 50, prezzo: 1 }, { base: 200, prezzo: 2 }, { base: 500, prezzo: 3 }, { base: 500, prezzo: 4 }]
  const bruta = dose => {
    let meglio = Infinity
    for (let a = 0; a * 50 <= dose; a++) for (let b = 0; b * 200 <= dose; b++) for (let c = 0; c * 500 <= dose; c++)
      if (a * 50 + b * 200 + c * 500 === dose) meglio = Math.min(meglio, a + b * 2 + c * 3)
    return meglio
  }
  for (const d of [50, 250, 700, 1200, 1500, 2450]) uguale(`il minimo per ${d}`, ottimo(d, offerte).costo, bruta(d))
  const o = ottimo(1500, offerte)
  uguale('il minimo non usa la copia che costa di più', o.pezzi.includes(3), false)
}

/* ---------- l'ordine: pagato tutto insieme, versato in fila ---------- */
{
  const b = new Bottega(PROVE[1], { rnd: caso(7) })
  const g = b.ingredienti[0]
  const k = g.offerte.reduce((m, o, k) => (o.base > g.offerte[m].base ? k : m), 0)
  uguale('più ampolle di quante se ne ordinano non si ordinano', b.ordina(Array(b.quanteInOrdine + 1).fill({ i: 0, k })), null)
  // si riempie fino a non far più stare la più grande
  while (g.messo + g.offerte[k].base <= g.dose) b.ordina([{ i: 0, k }])
  const prima = g.messo, spesoPrima = b.speso
  const altro = b.ingredienti[1], piccola = altro.offerte.reduce((m, o, kk) => (o.base < altro.offerte[m].base ? kk : m), 0)
  const r = b.ordina([{ i: 0, k }, { i: 1, k: piccola }])
  uguale('due esiti, nell\'ordine scritto', r.esiti.map(e => e.tipo).join(','), 'trabocca,giusto')
  uguale('il misurino traboccato resta com\'era', g.messo, prima)
  uguale('l\'altra ampolla dell\'ordine si versa lo stesso', altro.messo, altro.offerte[piccola].base)
  uguale('l\'ordine si paga tutto', b.speso, spesoPrima + g.offerte[k].prezzo + altro.offerte[piccola].prezzo)
  controlla('il perché ha i numeri di quel momento', r.esiti[0].righe.length === 2 && r.esiti[0].righe[1].includes('oltre la tacca'), r.esiti[0].righe.join(' | '))
  uguale('con la macchia non si ordina', b.ordina([{ i: 1, k: piccola }]), null)
  controlla('ma il listino si sfoglia', b.scegli(1))
  uguale('si pulisce', b.pulisci(), 1)
  uguale('pulire costa', b.speso, spesoPrima + g.offerte[k].prezzo + altro.offerte[piccola].prezzo + PULIZIA)
  uguale('due pulizie non si pagano', b.pulisci(), 0)
  // due misurini traboccati: due macchie, due gettoni
  const c = new Bottega(PROVE[1], { rnd: caso(8) })
  const troppo = i => ({ i, k: c.ingredienti[i].offerte.reduce((m, o, kk) => (o.base > c.ingredienti[i].offerte[m].base ? kk : m), 0) })
  for (const i of [0, 1]) while (c.ingredienti[i].messo + c.ingredienti[i].offerte[troppo(i).k].base <= c.ingredienti[i].dose) c.ordina([troppo(i)])
  c.ordina([troppo(0), troppo(1)])
  uguale('due misurini traboccati fanno due macchie', c.macchie.length, 2)
  uguale('e la spugna costa due gettoni', c.pulisci(), 2)
  // finito l'ingrediente traboccato non paga monete; gli altri sì
  const pagate = []
  for (const [i, h] of b.ingredienti.entries())
    while (h.messo < h.dose) {
      const kk = h.offerte.map((o, kk) => kk).filter(kk => h.messo + h.offerte[kk].base <= h.dose)
        .sort((a, c) => h.offerte[c].base - h.offerte[a].base)[0]
      const e = b.ordina([{ i, k: kk }]).esiti[0]
      if (e.pieno) pagate.push(e.monete)
    }
  uguale('l\'ingrediente traboccato non paga, gli altri sì', pagate.filter(m => m === MONETE_A_DOSE).length, b.ingredienti.length - 1)
  controlla('la pozione è finita', b.finita)
  controlla('e le stelle non sono tre', b.stelle < 3, `extra ${b.extra}`)
}

riassunto('pozioni-bottega')
