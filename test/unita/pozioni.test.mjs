/* Il laboratorio delle pozioni: ogni tappa della campagna si gioca dal
   mercante. Ogni pozione si compone, il minimo è davvero il minimo, il
   listino segue la scaletta, l'ordine si paga tutto e si versa in fila, e
   traboccare costa l'ampolla e la pulizia. Vedi docs/pozioni/regole.md.
   `node test/esegui.mjs unita/pozioni --niente-build` */
import { CAMPAGNA, BLOCCHI, QUANTE_TAPPE, MONETE_A_DOSE, guastiDellaCampagna } from '../../src/giochi/pozioni/dati/campagna.js'
import { FAMIGLIA, VALE, mescola, guastiDelleMisure } from '../../src/giochi/pozioni/dati/misure.js'
import { PULIZIA, PEZZI, PREZZI } from '../../src/giochi/pozioni/dati/bottega.js'
import { Bottega, banchetto, ottimo, giocaBene, giocaGoloso, caso, unitaBuone, scalaDi } from '../../src/giochi/pozioni/motore/bottega.js'
import { regola, chiaveDi } from '../../src/giochi/pozioni/motore/misura.js'
import { CONVERSIONI } from '../../src/giochi/pozioni/gioco.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const SEMI = 120
const tappa = chiave => CAMPAGNA.find(t => t.chiave === chiave)

/* ---------- i dati ---------- */
uguale('le misure sono a posto', guastiDelleMisure().join(' | '), '')
const siCompone = (d, t) => [1, 2, 3, 4, 5, 6].every(s => !!ottimo(d.base, banchetto(caso(s), d.base, d.famiglia, d.unita, t)))
uguale('la campagna è a posto', guastiDellaCampagna(siCompone).join(' | '), '')
uguale('ventinove tappe: le chiavi tengono i progressi di chi ha già giocato', QUANTE_TAPPE, 29)
uguale('la fila è quella di sempre', [CAMPAGNA[0].chiave, CAMPAGNA[8].chiave, CAMPAGNA[9].chiave, CAMPAGNA[26].chiave, CAMPAGNA[28].chiave].join(),
       'massa-banco,massa-inverse,lunghezza-banco,capacita-inverse,maestro')
uguale('quattro blocchi sulla mappa', BLOCCHI.length, 4)
uguale('ogni tappa sta in un blocco', BLOCCHI.reduce((n, b) => n + b.tappe.length, 0), QUANTE_TAPPE)
{ const [r, v, b] = [1, 3, 5].map(i => parseInt(mescola(['#ffff00', '#0000ff']).slice(i, i + 2), 16))
  controlla('due colori si mescolano con la media geometrica, non in grigio', r === v && b < 60 + r, `${r},${v},${b}`) }
uguale('«1 kg = 1000 g» dalla grande alla piccola, nei due versi', [regola('kg', 'g'), regola('g', 'kg')].join(), '1 kg = 1000 g,1 kg = 1000 g')
uguale('kg-g e g-kg sono due cose da sapere', [chiaveDi('kg', 'g'), chiaveDi('g', 'kg'), chiaveDi('g', 'g')].join(), 'pozioni:kg-g,pozioni:g-kg,')
controlla('ogni chiave possibile è fra le conversioni seguite', CONVERSIONI.includes('dl-l') && CONVERSIONI.includes('m-cm'))

/* ---------- ogni tappa: si compone, il listino segue la scaletta, chi fa il minimo prende tre stelle ---------- */
for (const t of CAMPAGNA) {
  const ammesse = fam => t.etichette.map(k => FAMIGLIA[fam].unita[k])
  let rotte = 0, sotto = 0, goloso = 0, gemelli = 0, troppe = 0, fuori = 0, doppie = 0, moneteSbagliate = 0
  for (let s = 1; s <= SEMI; s++) {
    const b = new Bottega(t, { rnd: caso(s) })
    if (b.ingredienti.length !== t.ingredienti) rotte++
    if (new Set(b.ingredienti.map(g => `${g.famiglia}:${g.dose}`)).size < b.ingredienti.length && t.dosi.length >= t.ingredienti * 3) doppie++
    for (const g of b.ingredienti) {
      if (!g.ottimo || g.offerte.length !== 4) rotte++
      if (new Set(g.offerte.map(o => `${o.base} ${o.unita}`)).size !== 4) rotte++
      if (new Set(g.offerte.map(o => o.base)).size < 4) gemelli++
      if (g.ottimo && g.ottimo.pezzi.length > 9) troppe++
      for (const o of g.offerte) {
        if (!unitaBuone(o.base, g.famiglia).includes(o.unita)) fuori++
        if (o.prezzo > 5) fuori++
      }
    }
    giocaBene(b)
    if (!b.finita || b.stelle !== 3 || b.resto !== t.margine || b.traboccate) sotto++
    if (b.monete !== t.ingredienti * MONETE_A_DOSE) moneteSbagliate++
    const c = giocaGoloso(new Bottega(t, { rnd: caso(s) }))
    if (!c.finita) rotte++
    if (c.extra > 2) goloso++
  }
  const qui = `${t.chiave}:`
  uguale(`${qui} quattro ampolle diverse, e la dose si compone`, rotte, 0)
  uguale(`${qui} due ingredienti non hanno la stessa dose`, doppie, 0)
  uguale(`${qui} chi ordina il minimo ha tre stelle e il margine intatto`, sotto, 0)
  uguale(`${qui} tre monete a ingrediente`, moneteSbagliate, 0)
  uguale(`${qui} «la più grande che ci sta» resta vicina al minimo`, goloso, 0)
  uguale(`${qui} nessuna dose chiede più di nove ampolle`, troppe, 0)
  uguale(`${qui} etichette che si leggono e prezzi piccoli`, fuori, 0)
  if (t.gemelli) controlla(`${qui} il trucco del mercante c'è`, gemelli > 0, `${gemelli}`)
  else uguale(`${qui} con un'unità sola il trucco non c'è`, gemelli, 0)
}

/* ---------- la scaletta: il listino non anticipa quello che non si è ancora imparato ---------- */
{
  for (let s = 1; s <= 30; s++) {
    for (const g of new Bottega(tappa('massa-banco'), { rnd: caso(s) }).ingredienti) {
      uguale('il banco: la ricetta in grammi', g.unita, 'g')
      controlla('e il listino anche, niente da convertire', g.offerte.every(o => o.unita === 'g'), JSON.stringify(g.offerte))
    }
    for (const g of new Bottega(tappa('capacita-inversa'), { rnd: caso(s) }).ingredienti) {
      uguale('al contrario: la ricetta in ml', g.unita, 'ml')
      controlla('e il mercante vende in unità più grandi', g.offerte.every(o => VALE[o.unita] > 1), JSON.stringify(g.offerte))
    }
  }
  const finale = new Bottega(tappa('calderone'), { rnd: caso(5) })
  uguale('il calderone mescola le famiglie', new Set(finale.ingredienti.map(g => g.famiglia)).size, 3)
}

/* ---------- il listino ha sempre un'ampolla sensata: da 1 m a 1,2 m non resta solo il 5 cm ---------- */
{
  let brutte = 0, esempio = ''
  for (const t of CAMPAGNA) for (const d of t.dosi) for (let s = 1; s <= 12; s++) {
    const o = banchetto(caso(s), d.base, d.famiglia, d.unita, t)
    const usate = ottimo(d.base, o).pezzi.length
    const meglio = ottimo(d.base, PEZZI.map((p, i) => ({ base: Math.round(p * scalaDi(d.base, d.famiglia) * VALE[FAMIGLIA[d.famiglia].unita.G]), prezzo: PREZZI[i] }))).pezzi.length
    if (usate > meglio + 1) { brutte++; esempio = `${d.testo}: ${o.map(x => x.base).join()}` }
  }
  uguale('il listino fa la dose con le ampolle che servono', brutte, 0)
  if (esempio) nota(esempio)
  const metro = { ...tappa('lunghezza-virgole') }
  for (let s = 1; s <= 40; s++) {
    const o = banchetto(caso(s), 1200, 'lunghezza', 'm', metro)
    controlla('per 1,2 m c\'è il metro', o.some(x => x.base === 1000))
    controlla('e il pezzo da 20 cm', o.some(x => x.base === 200))
  }
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
  uguale('il minimo non usa la copia che costa di più', ottimo(1500, offerte).pezzi.includes(3), false)
}

/* ---------- l'ordine: pagato tutto insieme, versato in fila ---------- */
{
  const t = tappa('massa-miste')
  const b = new Bottega(t, { rnd: caso(7) })
  const g = b.ingredienti[0], altro = b.ingredienti[1]
  const k = g.offerte.reduce((m, o, n) => (o.base > g.offerte[m].base ? n : m), 0)
  uguale('più ampolle di quante se ne ordinano non si ordinano', b.ordina(Array(t.ordine + 1).fill({ i: 0, k })), null)
  // si riempie fino a non far più stare la più grande
  while (g.messo + g.offerte[k].base <= g.dose) b.ordina([{ i: 0, k }])
  const piccola = altro.offerte.reduce((m, o, n) => (o.base < altro.offerte[m].base ? n : m), 0)
  if (g.messo < g.dose) {
    const prima = g.messo, spesoPrima = b.speso
    const r = b.ordina([{ i: 0, k }, { i: 1, k: piccola }])
    uguale('due esiti, nell\'ordine scritto', r.esiti.map(e => e.tipo).join(), 'trabocca,giusto')
    uguale('quello traboccato resta com\'era', g.messo, prima)
    uguale('l\'altra ampolla dell\'ordine si versa lo stesso', altro.messo, altro.offerte[piccola].base)
    uguale('l\'ordine si paga tutto', b.speso, spesoPrima + g.offerte[k].prezzo + altro.offerte[piccola].prezzo)
    controlla('il perché ha i numeri di quel momento', r.esiti[0].righe.length === 2 && r.esiti[0].righe[1].includes('oltre la tacca'), r.esiti[0].righe.join(' | '))
    uguale('con la macchia non si ordina', b.ordina([{ i: 1, k: piccola }]), null)
    const speso = b.speso
    uguale('si pulisce', b.pulisci(), 1)
    uguale('pulire costa', b.speso, speso + PULIZIA)
    uguale('due pulizie non si pagano', b.pulisci(), 0)
    // finito l'ingrediente traboccato non paga monete; gli altri sì
    const pagate = []
    for (const [i, h] of b.ingredienti.entries())
      while (h.messo < h.dose) {
        const kk = h.offerte.map((o, n) => n).filter(n => h.messo + h.offerte[n].base <= h.dose)
          .sort((a, c) => h.offerte[c].base - h.offerte[a].base)[0]
        const e = b.ordina([{ i, k: kk }]).esiti[0]
        if (e.pieno) pagate.push(e.monete)
      }
    uguale('l\'ingrediente traboccato non paga, gli altri sì', pagate.filter(m => m === MONETE_A_DOSE).length, b.ingredienti.length - 1)
    controlla('la pozione è finita', b.finita)
    controlla('e non è perfetta', !b.perfetta)
  } else nota('il seme riempie giusto: nessun trabocco da provare')
}
{
  // due strumenti traboccati: due macchie, due gettoni
  const c = new Bottega(tappa('massa-miste'), { rnd: caso(9) })
  c.ingredienti.forEach(h => { h.messo = h.dose - 1 })
  c.ordina([{ i: 0, k: 0 }, { i: 1, k: 0 }])
  uguale('due strumenti traboccati fanno due macchie', c.macchie.length, 2)
  uguale('e la spugna ne pulisce due', c.pulisci(), 2)
}
/* ---------- cosa va al motore di apprendimento ---------- */
{
  const annotate = chiave => {
    const b = new Bottega(tappa(chiave), { rnd: caso(4) })
    const a = []
    for (const [i, g] of b.ingredienti.entries())
      for (const k of g.ottimo.pezzi) { const e = b.ordina([{ i, k }]).esiti[0]; if (e.annota) a.push(e.annota) }
    return a
  }
  uguale('col conto scritto sotto la targhetta niente si segna', annotate('massa-grande').length, 0)
  controlla('dove il conto lo fai tu si segna', annotate('massa-miste').length > 0)
  controlla('e sono conversioni seguite, giuste', annotate('massa-miste').every(a => a.giusto && CONVERSIONI.includes(a.chiave.replace('pozioni:', ''))))
}

/* ---------- le stelle dicono quanto si è speso ---------- */
{
  const b = new Bottega(tappa('massa-miste'), { rnd: caso(2) })
  giocaBene(b)
  uguale('al minimo tre', b.stelle, 3)
  b.speso += 2; uguale('poco di più due', b.stelle, 2)
  b.speso += 5; uguale('tanto di più una', b.stelle, 1)
  controlla('oltre il bilancio si va in rosso, e la pozione si finisce lo stesso', (b.speso = b.gettoni + 3, b.resto < 0))
}

riassunto('pozioni')
