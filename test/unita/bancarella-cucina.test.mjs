/* Le cucine della bancarella, in prova: stazioni e ricette, senza browser.
   Vedi docs/bancarella/cucina.md.
   `node test/esegui.mjs bancarella-cucina --niente-build` */
import { INGREDIENTI, RICETTE, COLPI, ricetteDi, cucinaNuova, avanza, metti, svuota, taglia, inforna, butta, buttaPiatto, servi, dispensaDi, quantoStazione }
  from '../../src/motore/bancarella/cucina.js'
import { CUCINE, cucinaIdx, campagnaDi, tappaDi, generaCliente, scomponi } from '../../src/data/bancarella.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const [prima, , terza, quarta, quinta] = CUCINE
const { cuoce: PASTA, tiene: TIENE } = INGREDIENTI.pasta

/* ── la pentola ── */
{
  const c = cucinaNuova(prima)
  uguale('la pentola vuota non si svuota', svuota(c, 'pentola', 0), false)
  uguale('il sugo senza pasta non va su un piatto', metti(c, 'sugo', 0), false)
  uguale('la pasta cruda non va sul piatto', metti(c, 'pasta', 0), false)
  uguale('la pasta va in pentola', metti(c, 'pasta', 'pentola'), true)
  uguale('e non ci sta due volte', metti(c, 'pasta', 'pentola'), false)
  avanza(c, PASTA - 1)
  uguale('prima del tempo non si scola', svuota(c, 'pentola', 0), false)
  avanza(c, 1)
  uguale('al tempo giusto è pronta', c.stazioni.pentola.fase, 'pronta')
  avanza(c, TIENE)
  uguale('lasciata lì scuoce', c.stazioni.pentola.fase, 'scotta')
  uguale('scotta non va sul piatto', svuota(c, 'pentola', 0), false)
  uguale('va nel bidone', butta(c, 'pentola'), true)
  uguale('e la pentola è libera', c.stazioni.pentola.fase, 'vuota')
}

/* ── i piatti ── */
{
  const c = cucinaNuova(prima)
  metti(c, 'pasta', 'pentola'); avanza(c, PASTA)
  metti(c, 'pane', 0); metti(c, 'formaggio', 0)
  uguale('mentre cuoce si fa il panino', c.piatti[0].pronto, '🥪')
  uguale('un piatto finito non prende altro', svuota(c, 'pentola', 0), false)
  uguale('la pasta va sul piatto libero', svuota(c, 'pentola', 1), true)
  uguale('il pane sulla pasta no', metti(c, 'pane', 1), false)
  metti(c, 'sugo', 1)
  uguale('col sugo è pronta', c.piatti[1].pronto, '🍝')
  uguale('il piatto sbagliato non si serve', servi(c, 0, ['🍝']), false)
  uguale('quello giusto sì', servi(c, 1, ['🍝']), true)
  uguale('e il posto si libera', c.piatti[1], null)
  uguale('un piatto si può buttare', buttaPiatto(c, 0), true)
  uguale('ed è vuoto', c.piatti[0], null)
}

/* ── il tagliere e la padella ── */
{
  const c = cucinaNuova(terza)
  metti(c, 'pane', 0)
  metti(c, 'carne', 'padella'); avanza(c, INGREDIENTI.carne.cuoce)
  svuota(c, 'padella', 0)
  uguale('la carne cotta va sul pane', c.piatti[0].cose.join(), 'pane,carne')
  uguale('l\'insalata va sul tagliere', metti(c, 'insalata', 'tagliere'), true)
  uguale('intera non si posa', svuota(c, 'tagliere', 0), false)
  for (let i = 0; i < COLPI; i++) taglia(c)
  uguale('tagliata è pronta', c.stazioni.tagliere.fase, 'pronta')
  svuota(c, 'tagliere', 0)
  uguale('sul piatto è un hamburger', c.piatti[0].pronto, '🍔')
  uguale('il tagliere è libero', c.stazioni.tagliere.fase, 'vuota')
  const d = cucinaNuova(terza)
  metti(d, 'carne', 'padella'); avanza(d, INGREDIENTI.carne.cuoce)
  uguale('la carne senza pane non si posa', svuota(d, 'padella', 0), false)
  uguale('e intanto resta sul fuoco', d.stazioni.padella.fase, 'pronta')
}

/* ── il forno ── */
{
  const c = cucinaNuova(quarta)
  metti(c, 'impasto', 0); metti(c, 'sugo', 0); metti(c, 'formaggio', 0)
  uguale('la pizza condita è cruda', c.piatti[0].daInfornare, true)
  uguale('e non si serve', servi(c, 0, ['🍕']), false)
  uguale('dal piatto va in forno', inforna(c, 0), true)
  uguale('il piatto si libera', c.piatti[0], null)
  avanza(c, 8)
  uguale('sfornata va su un piatto vuoto', svuota(c, 'forno', 0), true)
  uguale('ed è pronta', c.piatti[0].pronto, '🍕')
}
uguale('la barra sale mentre cuoce', quantoStazione({ fase: 'cuoce', t: PASTA / 2, cosa: 'pasta' }), 0.5)

/* ── le cucine ── */
const guasti = new Set()
CUCINE.forEach((camp, k) => {
  uguale(`la cucina ${k + 1} si trova dal suo indice`, campagnaDi(cucinaIdx(k)).id, camp.id)
  const c = cucinaNuova(camp)
  for (const r of c.ricette) {
    for (const p of r.passi) {
      const va = INGREDIENTI[p]?.va
      if (va && !camp.stazioni.includes(va)) guasti.add(`${camp.id}: ${r.nome} vuole ${va}`)
    }
    if (r.forno && !camp.stazioni.includes('forno')) guasti.add(`${camp.id}: ${r.nome} vuole il forno`)
  }
  for (let n = 0; n < camp.tappe.length; n++) {
    const t = tappaDi(camp, n)
    for (let g = 0; g < 300; g++) {
      const cl = generaCliente(t, ricetteDi(camp.ricette))
      if (cl.articoli.length > camp.articoli[1]) guasti.add(`${camp.id}: troppi piatti`)
      if (cl.resto <= 0) guasti.add(`${camp.id}: resto nullo`)
      if (scomponi(cl.resto, cl.monete).reduce((s, v) => s + v, 0) !== cl.resto) guasti.add(`${camp.id}: resto ${cl.resto} non componibile`)
      if (cl.pazienza < 35) guasti.add(`${camp.id}: solo ${cl.pazienza} secondi`)
    }
  }
})
controlla('ogni cucina ha le stazioni delle sue ricette, e i resti si danno', guasti.size === 0, [...guasti].slice(0, 5).join(' · '))
controlla('ogni cucina aggiunge qualcosa', CUCINE.every((c, i) => !i || c.stazioni.length > CUCINE[i - 1].stazioni.length ||
  c.ricette.length !== CUCINE[i - 1].ricette.length || c.fuocoAcceso))
uguale('solo l\'ultima tiene i fuochi accesi mentre si conta', CUCINE.filter(c => c.fuocoAcceso).length, 1)
uguale('e lì il totale si batte', quinta.conto, 'tutto')
controlla('la dispensa ha tutti gli ingredienti che servono', dispensaDi(cucinaNuova(quinta)).length === Object.keys(INGREDIENTI).length)
controlla('nessuna ricetta è l\'inizio di un\'altra', RICETTE.every(a => RICETTE.every(b => a === b ||
  a.passi.join() !== b.passi.slice(0, a.passi.length).join())))

riassunto('le cucine della bancarella')
