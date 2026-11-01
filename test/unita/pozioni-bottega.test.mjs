/* La bottega del mercante (in prova): ogni pozione si compone, il
   minimo è davvero il minimo, il trucco del mercante c'è, e traboccare
   costa l'ampolla e la pulizia. Vedi docs/pozioni/bottega.md.
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

/* ---------- traboccare: si perde l'ampolla, si pulisce, e il misurino resta ---------- */
{
  const b = new Bottega(PROVE[1], { rnd: caso(7) })
  const g = b.ingredienti[b.corrente]
  const k = g.offerte.reduce((m, o, k) => (o.base > g.offerte[m].base ? k : m), 0)
  // si riempie fino a non far più stare la più grande
  while (g.messo + g.offerte[k].base <= g.dose) b.compra(k)
  const prima = g.messo, spesoPrima = b.speso
  const e = b.compra(k)
  uguale('oltre la tacca trabocca', e.tipo, 'trabocca')
  uguale('il misurino resta com\'era', g.messo, prima)
  uguale('l\'ampolla si paga lo stesso', b.speso, spesoPrima + g.offerte[k].prezzo)
  controlla('il perché ha i numeri di quel momento', e.righe.length === 3 && e.righe[1].includes('oltre la tacca'), e.righe.join(' | '))
  uguale('con la macchia non si compra', b.compra(0), null)
  uguale('né si cambia ingrediente', b.scegli((b.corrente + 1) % b.ingredienti.length), false)
  controlla('si pulisce', b.pulisci())
  uguale('pulire costa', b.speso, spesoPrima + g.offerte[k].prezzo + PULIZIA)
  uguale('due pulizie non si pagano', b.pulisci(), false)
  // finito l'ingrediente traboccato non paga monete; gli altri sì
  const pagate = []
  for (const [i, h] of b.ingredienti.entries()) {
    b.scegli(i)
    while (h.messo < h.dose) {
      const kk = h.offerte.map((o, kk) => kk).filter(kk => h.messo + h.offerte[kk].base <= h.dose)
        .sort((a, c) => h.offerte[c].base - h.offerte[a].base)[0]
      const r = b.compra(kk)
      if (r.pieno) pagate.push(r.monete)
    }
  }
  uguale('l\'ingrediente traboccato non paga, gli altri sì', pagate.filter(m => m === MONETE_A_DOSE).length, b.ingredienti.length - 1)
  controlla('la pozione è finita', b.finita)
  controlla('e le stelle non sono tre', b.stelle < 3, `extra ${b.extra}`)
}

riassunto('pozioni-bottega')
