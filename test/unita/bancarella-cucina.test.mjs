/* Le cucine della bancarella, in prova: stazioni e ricette, senza browser.
   Vedi docs/bancarella/cucina.md.
   `node test/esegui.mjs bancarella-cucina --niente-build` */
import { INGREDIENTI, RICETTE, COLPI, ricetteDi, cucinaNuova, avanza, tocca, servi, inforna, dispensaDi, quantoStazione }
  from '../../src/motore/bancarella/cucina.js'
import { CUCINE, cucinaIdx, campagnaDi, tappaDi, generaCliente, scomponi } from '../../src/data/bancarella.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const [prima, , terza, quarta, quinta] = CUCINE
const { cuoce: PASTA, tiene: TIENE } = INGREDIENTI.pasta

/* ── la pentola ── */
{
  const c = cucinaNuova(prima)
  uguale('la pentola vuota non si scola', tocca(c, 'pentola'), false)
  uguale('il sugo senza pasta non va da nessuna parte', tocca(c, 'sugo'), false)
  uguale('la pasta va in pentola', tocca(c, 'pasta'), true)
  uguale('e non ci sta due volte', tocca(c, 'pasta'), false)
  avanza(c, PASTA - 1)
  uguale('prima del tempo non si scola', tocca(c, 'pentola'), false)
  avanza(c, 1)
  uguale('al tempo giusto è pronta', c.stazioni.pentola.fase, 'pronta')
  avanza(c, TIENE)
  uguale('lasciata lì scuoce', c.stazioni.pentola.fase, 'scotta')
  uguale('si butta', tocca(c, 'pentola'), true)
  uguale('senza finire sul piatto', c.piatti.filter(Boolean).length, 0)
}

/* ── i piatti ── */
{
  const c = cucinaNuova(prima)
  tocca(c, 'pasta'); avanza(c, PASTA)
  tocca(c, 'pane'); tocca(c, 'formaggio')
  uguale('mentre cuoce si fa il panino', c.piatti[0].pronto, '🥪')
  uguale('la pasta va sul piatto libero', tocca(c, 'pentola'), true)
  uguale('coi piatti pieni il pane non ci sta', tocca(c, 'pane'), false)
  tocca(c, 'sugo')
  uguale('col sugo è pronta', c.piatti[1].pronto, '🍝')
  uguale('il piatto sbagliato non si serve', servi(c, 0, ['🍝']), false)
  uguale('quello giusto sì', servi(c, 1, ['🍝']), true)
  uguale('e il posto si libera', c.piatti[1], null)
}

/* ── il tagliere e la padella ── */
{
  const c = cucinaNuova(terza)
  tocca(c, 'pane')
  tocca(c, 'carne'); avanza(c, INGREDIENTI.carne.cuoce)
  tocca(c, 'padella')
  uguale('la carne cotta va sul pane', c.piatti[0].cose.join(), 'pane,carne')
  tocca(c, 'insalata')
  for (let i = 0; i < COLPI - 1; i++) tocca(c, 'tagliere')
  uguale('l\'insalata va tagliata tutta', c.piatti[0].pronto, '')
  tocca(c, 'tagliere')
  uguale('al terzo tocco è un hamburger', c.piatti[0].pronto, '🍔')
  uguale('e il tagliere è libero', c.stazioni.tagliere.fase, 'vuota')
  const d = cucinaNuova(terza)
  tocca(d, 'carne'); avanza(d, INGREDIENTI.carne.cuoce)
  uguale('la carne senza pane non si posa', tocca(d, 'padella'), false)
  uguale('e intanto resta sul fuoco', d.stazioni.padella.fase, 'pronta')
  const u = cucinaNuova(terza)
  tocca(u, 'uovo'); avanza(u, INGREDIENTI.uovo.cuoce); tocca(u, 'padella')
  tocca(u, 'pane')
  uguale('il pane va sull\'uovo che lo aspetta, non su un piatto nuovo', u.piatti[0].pronto, '🍳')
}

/* ── il forno ── */
{
  const c = cucinaNuova(quarta)
  tocca(c, 'impasto'); tocca(c, 'sugo'); tocca(c, 'formaggio')
  uguale('la pizza condita è cruda', c.piatti[0].daInfornare, true)
  uguale('e non si serve', servi(c, 0, ['🍕']), false)
  uguale('dal piatto va in forno', inforna(c, 0), true)
  uguale('il piatto si libera', c.piatti[0], null)
  avanza(c, 8)
  uguale('sfornata va sul piatto', tocca(c, 'forno'), true)
  uguale('ed è pronta', c.piatti[0].pronto, '🍕')
  const d = cucinaNuova(quarta)
  tocca(d, 'impasto'); tocca(d, 'sugo'); tocca(d, 'formaggio')
  uguale('si inforna anche toccando il forno', tocca(d, 'forno'), true)
  avanza(d, 30)
  uguale('e dimenticata brucia', d.stazioni.forno.fase, 'scotta')
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
