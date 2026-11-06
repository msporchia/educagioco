/* Il laboratorio delle pozioni: ogni tappa della campagna si gioca dal
   mercante. Ogni pozione si compone, il minimo è davvero il minimo, il
   listino segue la scaletta, l'ordine si paga tutto e si versa in fila, e
   traboccare costa l'ampolla e la pulizia. Vedi docs/pozioni/regole.md.
   `node test/esegui.mjs unita/pozioni --niente-build` */
import { CAMPAGNA, BLOCCHI, QUANTE_TAPPE, MONETE_A_DOSE, MONETE_A_PASSO, INFINITA, giroInfinito, guastiDellaCampagna } from '../../src/giochi/pozioni/dati/campagna.js'
import { FAMIGLIA, VALE, mescola, guastiDelleMisure, scrivi, POZIONI } from '../../src/giochi/pozioni/dati/misure.js'
import { PULIZIA, PASTICCIO, PEZZI, PREZZI, SPEDIZIONE, AMPOLLE_A_ORDINE } from '../../src/giochi/pozioni/dati/bottega.js'
import { Bottega, banchetto, ottimo, giocaBene, giocaGoloso, seguiLaRicetta, prossimoPasso, caso, unitaBuone, scalaDi, pezziDi } from '../../src/giochi/pozioni/motore/bottega.js'
import { MORTAIO, TAGLIERE, MOSSE, ROBA_SU, ATTREZZI, attrezziDi, prossimaMossa, recipiente } from '../../src/giochi/pozioni/motore/procedimento.js'
import { GESTI, creaGesto } from '../../src/giochi/pozioni/scena3d/gesti.js'
import { MODI } from '../../src/giochi/pozioni/scena3d/bollori.js'
import { BOLLORI, bolloreDi } from '../../src/giochi/pozioni/dati/bollori.js'
import { regola, chiaveDi } from '../../src/giochi/pozioni/motore/misura.js'
import { CONVERSIONI } from '../../src/giochi/pozioni/gioco.js'
import { dentro, controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

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
    if (b.comprati.length !== t.ingredienti) rotte++
    if (new Set(b.comprati.map(g => `${g.famiglia}:${g.dose}`)).size < b.comprati.length && t.dosi.length >= t.ingredienti * 3) doppie++
    for (const g of b.comprati) {
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
    if (b.monete !== t.ingredienti * MONETE_A_DOSE + b.passi.length * MONETE_A_PASSO) moneteSbagliate++
    const c = giocaGoloso(new Bottega(t, { rnd: caso(s) }))
    if (!c.finita) rotte++
    if (c.extra > 2) goloso++
  }
  const qui = `${t.chiave}:`
  uguale(`${qui} quattro ampolle diverse, e la dose si compone`, rotte, 0)
  uguale(`${qui} due ingredienti non hanno la stessa dose`, doppie, 0)
  uguale(`${qui} chi ordina il minimo ha tre stelle e il margine intatto`, sotto, 0)
  uguale(`${qui} tre monete a ingrediente e una a passo`, moneteSbagliate, 0)
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
    for (const g of new Bottega(tappa('capacita-inversa'), { rnd: caso(s) }).comprati) {
      uguale('al contrario: la ricetta in ml', g.unita, 'ml')
      controlla('e il mercante vende in unità più grandi', g.offerte.every(o => VALE[o.unita] > 1), JSON.stringify(g.offerte))
    }
  }
  const finale = new Bottega(tappa('calderone'), { rnd: caso(5) })
  uguale('il calderone mescola le famiglie', new Set(finale.ingredienti.map(g => g.famiglia)).size, 3)
}

/* ---------- la virgola: niente fino ai liquidi, e nessun conto fa uscire un ,5 ---------- */
{
  const prima = CAMPAGNA.findIndex(t => !t.tondi)
  uguale('la virgola arriva con la tappa 22, e dopo non se ne va', [CAMPAGNA[prima].chiave, prima + 1, CAMPAGNA.slice(prima).filter(t => t.tondi).length].join(), 'capacita-virgola,22,0')
  controlla('sui liquidi si ricomincia dagli interi', ['capacita-banco', 'capacita-grande', 'capacita-grandi'].every(c => tappa(c).tondi))
  controlla('a quell\'età la scuola l\'ha fatta: metà quarta è 68,75 sulla scala', CAMPAGNA[prima].portata > 68.75, `${CAMPAGNA[prima].portata}`)
  for (const t of CAMPAGNA.filter(x => x.tondi)) {
    const scritte = new Set([t.dritta])
    for (let s = 1; s <= SEMI; s++) {
      const b = new Bottega(t, { rnd: caso(s) })
      for (const g of b.comprati) {
        scritte.add(scrivi(g.dose, g.unita))
        for (const o of g.offerte) { scritte.add(scrivi(o.base, o.unita)); scritte.add(scrivi(o.base, g.unita)) }
      }
      // tutto quello che la pergamena e i cartelli possono dire mentre si versa
      for (const [i, g] of b.ingredienti.entries()) for (const k of g.ottimo.pezzi) {
        const e = b.ordina([{ i, k }]).esiti[0]
        e.righe.forEach(r => scritte.add(r))
        scritte.add(scrivi(g.messo, g.unita)); scritte.add(scrivi(g.dose - g.messo, g.unita))
      }
      const c = new Bottega(t, { rnd: caso(s) }), g = c.comprati[0]
      const grande = g.offerte.reduce((m, o, n) => (o.base > g.offerte[m].base ? n : m), 0)
      for (let n = 0; n < 2; n++) { c.ordina([{ i: 0, k: grande }])?.esiti[0].righe.forEach(r => scritte.add(r)); c.pulisci() }
    }
    uguale(`${t.chiave}: mai una virgola, né scritta né nei conti`, [...scritte].filter(x => /\d,\d/.test(x)).join(' | '), '')
    const brutti = t.dosi.flatMap(d => pezziDi(d.base, d.famiglia, d.unita, t).map(p => p.base / VALE[d.unita]).filter(x => !Number.isInteger(x)))
    uguale(`${t.chiave}: i pezzi sono interi nell'unità della ricetta`, brutti.length, 0)
  }
  const pezzi = new Set(CAMPAGNA.filter(t => t.tondi).flatMap(t => t.dosi.flatMap(d => pezziDi(d.base, d.famiglia, d.unita, t).map(p => String(p.base).replace(/0+$/, '')))))
  uguale('nelle tappe tonde solo 1, 2 e 5, coi loro zeri', [...pezzi].sort().join(), '1,2,5')
  uguale('la dritta dice il conto giusto', tappa('lunghezza-virgola').dritta.split(':')[0], '150 centimetri sono 1 m e 50 cm')
}

/* ---------- il listino ha sempre un'ampolla sensata: da 1 m a 1,2 m non resta solo il 5 cm ---------- */
{
  let brutte = 0, esempio = ''
  for (const t of CAMPAGNA) for (const d of t.dosi) for (let s = 1; s <= 12; s++) {
    const o = banchetto(caso(s), d.base, d.famiglia, d.unita, t)
    const usate = ottimo(d.base, o).pezzi.length
    const meglio = ottimo(d.base, pezziDi(d.base, d.famiglia, d.unita, t)).pezzi.length
    if (usate > meglio + 1) { brutte++; esempio = `${d.testo}: ${o.map(x => x.base).join()}` }
  }
  uguale('il listino fa la dose con le ampolle che servono', brutte, 0)
  if (esempio) nota(esempio)
  const litro = { ...tappa('capacita-virgole') }
  for (let s = 1; s <= 40; s++) {
    const o = banchetto(caso(s), 1200, 'capacita', 'l', litro)
    controlla('per 1,2 l c\'è il litro', o.some(x => x.base === 1000))
    controlla('e il pezzo da 200 ml', o.some(x => x.base === 200))
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
  uguale('più ampolle di quante se ne ordinano non si ordinano', b.ordina(Array(AMPOLLE_A_ORDINE + 1).fill({ i: 0, k })), null)
  // si riempie fino a non far più stare la più grande
  while (g.messo + g.offerte[k].base <= g.dose) b.ordina([{ i: 0, k }])
  const piccola = altro.offerte.reduce((m, o, n) => (o.base < altro.offerte[m].base ? n : m), 0)
  if (g.messo < g.dose) {
    const prima = g.messo, spesoPrima = b.speso
    const r = b.ordina([{ i: 0, k }, { i: 1, k: piccola }])
    uguale('due esiti, nell\'ordine scritto', r.esiti.map(e => e.tipo).join(), 'trabocca,giusto')
    uguale('quello traboccato resta com\'era', g.messo, prima)
    uguale('l\'altra ampolla dell\'ordine si versa lo stesso', altro.messo, altro.offerte[piccola].base)
    uguale('l\'ordine si paga tutto, con la spedizione', b.speso, spesoPrima + g.offerte[k].prezzo + altro.offerte[piccola].prezzo + SPEDIZIONE)
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
    controlla('la spesa è finita', b.pronta)
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
/* ---------- le uguaglianze restano scritte: a memoria solo nel calderone senza fondo ---------- */
uguale('in tutte le ventinove tappe c\'è un aiuto', CAMPAGNA.filter(t => !t.aiuto).length, 0)
uguale('nel calderone senza fondo no', [0, 5, 9].map(n => giroInfinito(n).aiuto).join(''), '')

/* ---------- la spedizione: una a ordine, e il minimo la conta ---------- */
{
  const t = tappa('massa-miste')
  const voci = b => b.ingredienti.flatMap((g, i) => g.ottimo.pezzi.map(k => ({ i, k })))
  const sola = new Bottega(t, { rnd: caso(11) })
  const prezzi = voci(sola).reduce((s, v) => s + sola.ingredienti[v.i].offerte[v.k].prezzo, 0)
  uguale('il minimo è le ampolle più una spedizione ogni cinque', sola.minimo, prezzi + Math.ceil(voci(sola).length / AMPOLLE_A_ORDINE) * SPEDIZIONE)
  const a = voci(sola).slice(0, AMPOLLE_A_ORDINE)
  controlla('cinque ampolle stanno in un ordine', !!sola.ordina(Array(AMPOLLE_A_ORDINE).fill(a[0]).map((v, n) => a[n] || v)))
  const unaAllaVolta = new Bottega(t, { rnd: caso(11) })
  for (const v of voci(unaAllaVolta)) unaAllaVolta.ordina([v])
  seguiLaRicetta(unaAllaVolta)
  uguale('una per volta si paga una spedizione ad ampolla', unaAllaVolta.speso, prezzi + voci(unaAllaVolta).length * SPEDIZIONE)
  controlla('e non sono più tre stelle', unaAllaVolta.stelle < 3, `${unaAllaVolta.stelle}`)
  const riga = new Bottega(t, { rnd: caso(11) }).piuEconomico().at(-1)
  uguale('alla fine si dice anche la spedizione', riga.nome, 'spedizione')
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

/* ---------- una pozione per tappa, col suo nome ---------- */
uguale('ventinove nomi diversi', new Set(CAMPAGNA.map(t => t.nome)).size, QUANTE_TAPPE)
controlla('ogni tappa ha la sua emoji e il suo colore', CAMPAGNA.every(t => t.emoji && /^#[0-9a-f]{6}$/.test(t.colore)))

/* ---------- il procedimento ---------- */
for (const t of CAMPAGNA) {
  let rotte = 0, senzaOrdine = 0, ricetteBrutte = 0
  const ordini = new Set()
  for (let s = 1; s <= 60; s++) {
    const b = new Bottega(t, { rnd: caso(s) })
    const azioni = b.passi.map(p => p.azione)
    if (azioni.some(a => !t.azioni.includes(a))) rotte++
    // ogni ingrediente finisce nel calderone una volta sola, e si scalda e si mescola sempre dopo che c'è qualcosa dentro
    const versati = b.passi.flatMap(p => (p.azione === 'versa' ? p.cosa.filter(i => i >= 0) : ['pesta', 'sminuzza', 'gratta'].includes(p.azione) ? p.cosa : []))
    if (versati.length !== b.ingredienti.length || new Set(versati).size !== versati.length) rotte++
    if (b.passi[0].azione !== 'pesta' && b.passi[0].azione !== 'versa') senzaOrdine++
    const lette = b.righe.flatMap(r => r.passi)
    if (lette.join() !== b.passi.map((_, k) => k).join() || b.righe.some(r => !/^[A-Z].*[.»]$/.test(r.testo))) ricetteBrutte++
    ordini.add(azioni.join())
    // si mescola prima di scaldare, e il coperchio viene dopo il fuoco
    if (azioni.includes('scalda') && azioni.indexOf('mescola') > azioni.indexOf('scalda')) rotte++
    if (azioni.includes('copri') && azioni.indexOf('scalda') > azioni.indexOf('copri')) rotte++
    if (azioni.length > 10 || b.righe.length > 8) rotte++
    giocaBene(b)
    if (b.monete !== t.ingredienti * MONETE_A_DOSE + b.passi.length * MONETE_A_PASSO || !b.finita || b.pasticci) rotte++
  }
  uguale(`${t.chiave}: il procedimento si fa con le azioni della tappa, ogni cosa una volta`, rotte, 0)
  uguale(`${t.chiave}: si comincia mettendo qualcosa`, senzaOrdine, 0)
  uguale(`${t.chiave}: la ricetta dice tutti i passi`, ricetteBrutte, 0)
  if (t.procedimento >= 2) controlla(`${t.chiave}: l'ordine cambia, se no non si legge`, ordini.size > 1, [...ordini].join(' | '))
  if (t.azioni.includes('pesta')) controlla(`${t.chiave}: col mortaio sul tavolo si pesta sempre`, [...ordini].every(o => o.startsWith('pesta')), [...ordini].join(' | '))
}
{
  const b = new Bottega(tappa('massa-miste'), { rnd: caso(3) })
  uguale('prima della spesa niente azioni', b.fai('mescola'), null)
  const tutte = b.ingredienti.flatMap((g, i) => g.ottimo.pezzi.map(k => ({ i, k })))
  for (let n = 0; n < tutte.length; n += AMPOLLE_A_ORDINE) b.ordina(tutte.slice(n, n + AMPOLLE_A_ORDINE))
  controlla('fatta la spesa la pozione non è finita', b.pronta && !b.finita)
  uguale('il calderone è ancora vuoto', b.dentro.length, 0)
  uguale('niente più ordini', b.ordina([{ i: 0, k: 0 }]), null)
  const speso = b.speso, primo = b.passi[0]
  const sbaglio = b.fai('scalda')
  uguale('fuori ordine è un pasticcio', sbaglio.giusto, false)
  uguale('costa un gettone', b.speso, speso + PASTICCIO)
  uguale('e non cambia niente', b.passo, 0)
  controlla('il cartello dice cosa diceva la ricetta', sbaglio.righe[1].includes('La ricetta dice'), sbaglio.righe.join(' | '))
  uguale('una cosa che non c\'entra è un pasticcio anche lei', b.fai('versa', [9]).giusto, false)
  uguale('un passo sbagliato prima non paga', prossimoPasso(b).monete, 0)
  uguale('quello dopo sì', prossimoPasso(b).monete, MONETE_A_PASSO)
  seguiLaRicetta(b)
  controlla('e la pozione si finisce', b.finita)
  controlla('non è perfetta', !b.perfetta)
  uguale('ma le stelle dicono i gettoni', b.stelle, 2)
}
{
  /* le cose entrano una alla volta, nel mortaio e nel calderone */
  const b = new Bottega(tappa('massa-virgole'), { rnd: caso(3) })
  for (const [i, g] of b.ingredienti.entries()) for (const k of g.ottimo.pezzi) b.ordina([{ i, k }])
  const [a, c] = b.passi[0].cosa, altro = b.ingredienti.findIndex((_, i) => i !== a && i !== c)
  uguale('il mortaio non si pesta vuoto', b.fai('pesta').giusto, false)
  uguale('quello che la ricetta non dice non ci va', b.fai('metti', [altro]).giusto, false)
  uguale('una cosa nel mortaio', b.fai('metti', [a]).giusto, true)
  uguale('non basta ancora', b.fai('pesta').giusto, false)
  uguale('il passo non si muove', b.passo, 0)
  uguale('il mortaio non si versa prima di pestare', b.fai('versa', [MORTAIO]).giusto, false)
  uguale('l\'altra', b.fai('metti', [c]).giusto, true)
  const pestato = b.fai('pesta')
  controlla('adesso si pesta', pestato.giusto && b.passo === 1)
  uguale('il pestato si versa intero', b.fai('versa', [MORTAIO]).versati.length, 2)
  uguale('e il mortaio è vuoto', b.mortaio.length, 0)
}
{
  const b = new Bottega(tappa('massa-banco'), { rnd: caso(1) })
  for (const [i, g] of b.ingredienti.entries()) for (const k of g.ottimo.pezzi) b.ordina([{ i, k }])
  uguale('una versata a metà non fa passo', (b.fai('versa', [0]), b.passo), 0)
  uguale('due volte la stessa cosa è un pasticcio', b.fai('versa', [0]).giusto, false)
  uguale('la seconda chiude il passo', (b.fai('versa', [1]), b.passo), 1)
}
{
  const b = new Bottega(tappa('lunghezza-miste'), { rnd: caso(9) })
  const g = b.ingredienti[0]
  g.messo = g.dose - 1
  const e = b.ordina([{ i: 0, k: 0 }]).esiti[0]
  controlla('una radice non trabocca: è troppo lunga', e.righe[0].startsWith('Troppo lungo!'), e.righe[0])
}
{
  /* il testo intrecciato dice una coppia al contrario */
  let girate = 0
  for (let s = 1; s <= 30; s++) girate += new Bottega(tappa('massa-inverse'), { rnd: caso(s) }).righe.some(r => r.testo.includes('dopo aver'))
  controlla('in fondo alla scaletta capita di leggere al contrario', girate > 8, `${girate}`)
  let brutte = 0
  for (const t of CAMPAGNA) for (let s = 1; s <= 30; s++)
    for (const r of new Bottega(t, { rnd: caso(s) }).righe) if (/ma prima|^Versa.*dopo aver|^Pesta.*dopo aver/.test(r.testo)) brutte++
  uguale('mai «versa, ma prima pesta»', brutte, 0)
  const b = new Bottega(tappa('massa-banco'), { rnd: caso(1) })
  controlla('già all\'inizio il fuoco, la bacchetta, un pizzico e la fiala', b.passi.length === 6 && ['scalda', 'agita', 'imbottiglia'].every(a => b.passi.some(p => p.azione === a)), b.passi.map(p => p.azione).join())
}

/* ---------- i liquidi non si pestano: niente mortaio, e niente già in dispensa ---------- */
for (const t of CAMPAGNA.filter(x => x.famiglie.join() === 'capacita')) {
  uguale(`${t.chiave}: il mortaio non è sul tavolo`, t.azioni.includes('pesta'), false)
  for (let s = 1; s <= 30; s++) {
    const b = new Bottega(t, { rnd: caso(s) })
    uguale(`${t.chiave}: tutto quello che serve si compra`, b.ingredienti.length, t.ingredienti)
    uguale(`${t.chiave}: la ricetta non pesta`, b.passi.some(p => p.azione === 'pesta'), false)
    giocaBene(b)
    controlla(`${t.chiave}: e la pozione si finisce`, b.finita && b.stelle === 3)
  }
}
controlla('nelle finali, con pesi e lunghezze, il mortaio c\'è', ['calderone', 'maestro'].every(c => tappa(c).azioni.includes('pesta')))

/* ---------- il calderone senza fondo ---------- */
{
  let scorta = INFINITA.scorta
  for (let n = 0; n < 40; n++) {
    const t = giroInfinito(n, null, caso(n + 1))
    const b = new Bottega(t, { rnd: caso(n + 3), scorta })
    uguale(`giro ${n}: la scorta passa`, b.gettoni, b.minimo + scorta)
    giocaBene(b)
    if (!b.finita) nota(`giro ${n} non finisce`)
    uguale(`giro ${n}: al minimo non si perde niente`, b.resto, scorta)
    scorta = b.resto
  }
  uguale('cresce: quattro ingredienti', giroInfinito(5).ingredienti, 4)
  uguale('e il procedimento arriva in fondo', giroInfinito(9).procedimento, 5)
  uguale('la pozione di una sosta resta quella', giroInfinito(2, ['X', '🧪', '#123456']).nome, 'X')
}

/* ---------- si parte sempre da zero: niente è già in casa ---------- */
{
  let gia = 0
  for (const t of [...CAMPAGNA, giroInfinito(1), giroInfinito(3)]) for (let s = 1; s <= 30; s++)
    for (const g of new Bottega(t, { rnd: caso(s) }).comprati) if (g.messo || g.pezzi.length || 'casa' in g) gia++
  uguale('ogni strumento parte vuoto, in ogni tappa', gia, 0)
  controlla('e nessuna tappa ha la scorta in casa', CAMPAGNA.every(t => !('casa' in t)))
}

/* ---------- le azioni nuove ---------- */
{
  const fatti = new Set()
  for (const t of CAMPAGNA) for (let s = 1; s <= 40; s++) for (const p of new Bottega(t, { rnd: caso(s) }).passi) fatti.add(p.azione)
  for (const a of ['sminuzza', 'gratta', 'copri', 'agita']) controlla(`${a} entra nelle ricette`, fatti.has(a))
  uguale('alla prima tappa niente mortaio né coperchio', tappa('massa-banco').azioni.join(), 'versa,mescola,scalda,agita,sale,pepe,imbottiglia')
  controlla('il coperchio arriva alla seconda', tappa('massa-grande').azioni.includes('copri'))
  /* quello che si è misurato arriva com'era: non si versa una stella, né un gufo */
  const passi = [{ azione: 'gratta', cosa: [2] }]
  uguale('la polvere sta in una ciotola', recipiente({ famiglia: 'massa' }, 0, passi), 'ciotola')
  uguale('il liquido in un bicchiere', recipiente({ famiglia: 'capacita' }, 0, passi), 'bicchiere')
  uguale('la radice resta intera', recipiente({ famiglia: 'lunghezza' }, 0, passi), null)
  uguale('e pure quello che si gratta', recipiente({ famiglia: 'massa' }, 2, passi), null)
  for (const c of ['massa-banco', 'lunghezza-banco', 'capacita-banco', 'capacita-grandi', 'capacita-virgole'])
    controlla(`${c}: una ricetta che non sia misera`, Array.from({ length: 30 }, (_, s) => new Bottega(tappa(c), { rnd: caso(s + 1) })).every(x => x.passi.length >= 6))
  /* la fiala chiude sempre, e il pizzico è uno, quando c'è tutto nel calderone */
  let storte = 0
  const pizzichi = new Set()
  for (const t of CAMPAGNA) for (let s = 1; s <= 40; s++) {
    const azioni = new Bottega(t, { rnd: caso(s) }).passi.map(p => p.azione)
    const quanti = azioni.filter(a => a === 'sale' || a === 'pepe')
    quanti.forEach(a => pizzichi.add(a))
    if (azioni.at(-1) !== 'imbottiglia' || azioni.filter(a => a === 'imbottiglia').length !== 1 || quanti.length > 1) storte++
    if (quanti.length && azioni.slice(azioni.indexOf(quanti[0])).some(a => ['versa', 'gratta', 'pesta', 'sminuzza'].includes(a))) storte++
  }
  uguale('la fiala è l\'ultimo passo, e il pizzico viene dopo la roba', storte, 0)
  uguale('capita il sale e capita il pepe', [...pizzichi].sort().join(), 'pepe,sale')
  /* il barattolo sbagliato è un pasticcio come gli altri, e il pizzico non si compra */
  {
    const c = Array.from({ length: 40 }, (_, s) => new Bottega(tappa('massa-banco'), { rnd: caso(s + 1) })).find(x => x.passi.some(p => p.azione === 'pepe'))
    const riga = c.righe.find(r => r.passi.some(k => c.passi[k].azione === 'pepe'))
    controlla('la ricetta dice quale', /pizzico di pepe|aggiunto il pepe/.test(riga.testo), riga.testo)
    uguale('sul listino non c\'è', c.ingredienti.some(g => /sale|pepe/.test(g.nome)), false)
    const voci = c.ingredienti.flatMap((g, i) => g.ottimo.pezzi.map(k => ({ i, k })))
    for (let n = 0; n < voci.length; n += c.quanteInOrdine) c.ordina(voci.slice(n, n + c.quanteInOrdine))
    while (c.passi[c.passo].azione !== 'pepe') prossimoPasso(c)
    const speso = c.speso
    uguale('col sale al posto del pepe è un pasticcio', c.fai('sale').giusto, false)
    uguale('e costa un gettone', c.speso, speso + 1)
    uguale('il pepe invece va', c.fai('pepe').giusto, true)
  }
  /* la bacchetta ha la sua formula, su una riga sola */
  const b = Array.from({ length: 40 }, (_, s) => new Bottega(tappa('massa-grande'), { rnd: caso(s + 1) })).find(x => x.passi.some(p => p.azione === 'agita'))
  const riga = b.righe.find(r => r.passi.some(k => b.passi[k].azione === 'agita'))
  controlla('l\'incantesimo si dice', /^Agita la bacchetta sul calderone e (sussurra|grida): «.*!»$/.test(riga.testo), riga.testo)
  uguale('e sta da solo', riga.passi.length, 1)
  /* il tagliere si tira fuori solo se c'è da tagliare */
  uguale('senza niente da tagliare niente tagliere', attrezziDi(['sminuzza', 'mescola'], [{ lavoro: 'gratta' }]).join(), 'mestolo')
  uguale('con la radice sì', attrezziDi(['sminuzza'], [{ lavoro: 'sminuzza' }]).join(), 'tagliere,coltello')
}
{
  /* il tagliere va come il mortaio: si appoggia, si sminuzza, si versa */
  let b = null
  for (let s = 1; s < 80 && !b; s++) {
    const x = new Bottega(tappa('lunghezza-virgole'), { rnd: caso(s) })
    if (x.passi.some(p => p.azione === 'sminuzza')) b = x
  }
  for (const [i, g] of b.ingredienti.entries()) for (const k of g.ottimo.pezzi) b.ordina([{ i, k }])
  prossimoPasso(b); prossimoPasso(b)
  uguale('dopo il pestato c\'è il tagliere', b.passi[b.passo].azione, 'sminuzza')
  const [r] = b.passi[b.passo].cosa
  uguale('il suggerimento porta la roba sul tagliere', prossimaMossa(b.passi[b.passo], b.mancaAl(b.passi[b.passo])).su, 'tagliere')
  uguale('il tagliere vuoto non si sminuzza', b.fai('sminuzza').giusto, false)
  uguale('si appoggia', b.fai('appoggia', [r]).giusto, true)
  uguale('prima di tagliare non si versa', b.fai('versa', [TAGLIERE]).giusto, false)
  uguale('poi il coltello', prossimaMossa(b.passi[b.passo], b.mancaAl(b.passi[b.passo])).da, 'coltello')
  controlla('si sminuzza', b.fai('sminuzza').giusto)
  controlla('la riga dice tutto', /^Sminuzza (la|il|lo) .* e versal[oa] nel calderone\.$/.test(b.righe.find(x => x.passi.includes(b.passo - 1)).testo), b.righe.map(x => x.testo).join(' | '))
  const v = b.fai('versa', [TAGLIERE])
  uguale('il tritato si versa', v.versati.join(), String(r))
  uguale('e il tagliere è vuoto', b.tagliere.length, 0)
  controlla('e sta nel calderone', b.dentro.includes(r))
}
{
  /* ogni mossa ha il suo gesto, e ogni attrezzo la sua mossa */
  for (const k of Object.keys(MOSSE)) controlla(`${k} ha un gesto`, !!GESTI[k])
  controlla('la roba si grattugia col dito', !!GESTI['roba:grattugia'] && ROBA_SU.grattugia === 'gratta')
  for (const nomi of Object.values(ATTREZZI)) for (const a of nomi) if (a !== 'mortaio' && a !== 'tagliere' && a !== 'grattugia')
    controlla(`${a} serve a qualcosa`, Object.keys(MOSSE).some(k => k.startsWith(a + ':')))

  /* il dito disegna, il gesto riconosce */
  const cerchio = (g, giri, r = 40, cx = 100, cy = 100) => { for (let n = 0; n <= giri * 24; n++) g.punto(cx + Math.cos(n / 24 * Math.PI * 2) * r, cy + Math.sin(n / 24 * Math.PI * 2) * r) }
  const su = (g, volte, y = 'y', largo = 40) => { for (let n = 0; n < volte; n++) for (const v of [0, largo, 0]) g.punto(y === 'x' ? 100 + v : 100, y === 'y' ? 100 + v : 100) }
  const mestolo = creaGesto(GESTI['mestolo:calderone'])
  cerchio(mestolo, 1)
  dentro('un giro è metà', mestolo.avanzato, 0.45, 0.55)
  cerchio(mestolo, 1.2)
  uguale('due giri bastano', mestolo.avanzato, 1)
  const storto = creaGesto(GESTI['mestolo:calderone'])
  cerchio(storto, 2.2, 90, 30, 400)
  uguale('un cerchio largo e fuori centro vale uguale', storto.avanzato, 1)
  const zigzag = creaGesto(GESTI['mestolo:calderone'])
  su(zigzag, 12)
  controlla('su e giù non è mescolare', zigzag.avanzato < 0.2, `${zigzag.avanzato}`)
  const pestello = creaGesto(GESTI['pestello:mortaio'])
  su(pestello, 3)
  dentro('tre colpi su cinque', pestello.avanzato, 0.4, 0.6)
  su(pestello, 3)
  uguale('cinque colpi bastano', pestello.avanzato, 1)
  const tremolio = creaGesto(GESTI['pestello:mortaio'])
  su(tremolio, 20, 'y', 12)
  uguale('il dito che trema non pesta', tremolio.avanzato, 0)
  const diLato = creaGesto(GESTI['pestello:mortaio'])
  su(diLato, 10, 'x')
  uguale('di lato non si pesta', diLato.avanzato, 0)
  const fiammifero = creaGesto(GESTI['fiammifero:legna'])
  su(fiammifero, 4, 'x')
  uguale('il fiammifero si sfrega di lato', fiammifero.avanzato, 1)
  const brocca = creaGesto(GESTI['brocca:calderone'])
  brocca.punto(100, 100); brocca.scorre(2)
  uguale('dritta non versa', brocca.avanzato, 0)
  brocca.punto(170, 100); brocca.scorre(0.45)
  dentro('piegata versa', brocca.avanzato, 0.4, 0.6)
  brocca.scorre(1)
  uguale('e finisce', brocca.avanzato, 1)
  const bacchetta = creaGesto(GESTI['bacchetta:calderone'])
  su(bacchetta, 7, 'x')
  uguale('la bacchetta si scuote', bacchetta.avanzato, 1)
}
{
  /* ogni pozione ribolle a modo suo */
  const nomi = [...Object.values(POZIONI).flat().map(p => p[0]), ...CAMPAGNA.filter(t => t.famiglie.length > 1).map(t => t.nome)]
  for (const n of nomi) controlla(`${n} ha un modo di ribollire`, !!MODI[BOLLORI[n]?.[0]])
  uguale('nessun nome di troppo', Object.keys(BOLLORI).length, nomi.length)
  controlla('i modi sono tanti', new Set(Object.values(BOLLORI).map(b => b[0])).size >= 8)
  const riflessi = new Set()
  for (let s = 1; s < 30; s++) { const b = new Bottega(tappa('massa-grandi'), { rnd: caso(s) }); riflessi.add(bolloreDi(b.pozione.nome, b.ingredienti).riflesso) }
  uguale('rifacendola il riflesso può cambiare', riflessi.size, 2)
}

riassunto('pozioni')
