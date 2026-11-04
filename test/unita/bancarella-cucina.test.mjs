/* La cucina della bancarella, in prova: la pentola e i piatti, senza browser.
   Vedi docs/bancarella/cucina.md.
   `node test/esegui.mjs bancarella-cucina --niente-build` */
import { COTTURA, TIENE, PIATTI, cucinaNuova, avanza, tocca, servi, quantoPentola } from '../../src/motore/bancarella/cucina.js'
import { CUCINA, CUCINA_IDX, campagnaDi, tappaDi, generaCliente, scomponi } from '../../src/data/bancarella.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

/* ── la pentola ── */
{
  const c = cucinaNuova()
  uguale('la pentola vuota non si scola', tocca(c, 'pentola'), false)
  uguale('il sugo senza pasta non va da nessuna parte', tocca(c, 'sugo'), false)
  uguale('la pasta va in pentola', tocca(c, 'pasta'), true)
  uguale('e non ci sta due volte', tocca(c, 'pasta'), false)
  avanza(c, COTTURA - 1)
  uguale('prima del tempo cuoce ancora', c.pentola.fase, 'cuoce')
  uguale('e non si scola', tocca(c, 'pentola'), false)
  avanza(c, 1)
  uguale('al tempo giusto è pronta', c.pentola.fase, 'pronta')
  avanza(c, TIENE)
  uguale('lasciata lì scuoce', c.pentola.fase, 'scotta')
  uguale('la pasta scotta non va sul piatto: si butta', tocca(c, 'pentola'), true)
  uguale('e nessun piatto si è riempito', c.piatti.filter(Boolean).length, 0)
  uguale('la pentola è di nuovo libera', c.pentola.fase, 'vuota')
}

/* ── i due piatti ── */
{
  const c = cucinaNuova()
  tocca(c, 'pasta'); avanza(c, COTTURA)
  tocca(c, 'pane')
  uguale('mentre cuoce si prepara il panino', c.piatti[0].cose.join(), 'pane')
  tocca(c, 'formaggio')
  uguale('il panino è pronto', c.piatti[0].pronto, '🥪')
  uguale('la pasta va sul piatto libero', tocca(c, 'pentola'), true)
  uguale('sul secondo', c.piatti[1].cose.join(), 'pasta')
  uguale('coi due piatti pieni il pane non ci sta', tocca(c, 'pane'), false)
  tocca(c, 'sugo')
  uguale('col sugo è la pasta al pomodoro', c.piatti[1].pronto, '🍝')
  uguale('il piatto sbagliato non si serve', servi(c, 0, '🍝'), false)
  uguale('e resta sul banco', c.piatti[0].pronto, '🥪')
  uguale('quello giusto sì', servi(c, 1, '🍝'), true)
  uguale('e il posto si libera', c.piatti[1], null)
  uguale('un piatto a metà non si serve', (() => { const d = cucinaNuova(); tocca(d, 'pane'); return servi(d, 0, '🥪') })(), false)
}
uguale('la barra sale mentre cuoce', quantoPentola({ fase: 'cuoce', t: COTTURA / 2 }), 0.5)

/* ── la cassa di sempre ── */
uguale('la giornata si trova dal suo indice', campagnaDi(CUCINA_IDX).id, CUCINA.id)
const guasti = new Set()
for (let n = 0; n < CUCINA.tappe.length; n++) {
  const t = tappaDi(CUCINA, n)
  for (let g = 0; g < 300; g++) {
    const c = generaCliente(t, PIATTI)
    if (c.articoli.length !== 1 || c.articoli[0].quanti !== 1) guasti.add('un cliente vuole un piatto solo')
    if (c.resto <= 0) guasti.add('resto nullo')
    if (scomponi(c.resto, c.monete).reduce((s, v) => s + v, 0) !== c.resto) guasti.add(`resto ${c.resto} non componibile`)
    if (c.pazienza < COTTURA + 25) guasti.add(`solo ${c.pazienza} secondi per cucinare e contare`)
  }
}
controlla('ogni cliente ha un resto che si può dare e il tempo per farlo', guasti.size === 0, [...guasti].join(' · '))

riassunto('la cucina della bancarella')
