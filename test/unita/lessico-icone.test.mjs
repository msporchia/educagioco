/* ═══════════════════════════════════════════════════════════════════
   LE ICONE DEL LESSICO — senza browser.
   `node test/esegui.mjs lessico --niente-build`

   Il 16 agosto sono comparse a schermo due clessidre (`ora ⌛`,
   `tempo ⏳`), due calendari (`settimana 📅`, `mese 🗓️`) e un `felice 😀`
   che non si distingueva dalle altre facce. Il difetto vero non era la
   singola emoji, era il criterio: si sceglieva "quale emoji ci
   assomiglia di più" invece di "come si rappresenta la cosa". Due
   rimedi, due controlli:

   A) un'emoji che è un ripiego non si mette — resta il testo. Questo
      non si può provare da un test (è un giudizio, fatto a mano su
      `words.js` e `parole-es.js`); quello che si può provare è che il
      motore non si rompe quando un'emoji manca, e lo fa già
      `inglese.test.mjs` / `spagnolo.test.mjs` (categorie con abbastanza
      figure, domande sempre costruibili).

   B) due emoji confondibili non escono mai nella stessa domanda. Questo
      SI può provare, ed è quello che fa questo file: per ogni parola con
      un'emoji, si costruisce davvero la domanda figurata (`figura`,
      `ascoltoFigura`) e si controlla che fra bersaglio e distrattori non
      ci siano due voci della stessa `famiglia` (vedi l'intestazione di
      `words.js`). Vale per l'inglese e per lo spagnolo, e vale da solo
      per ogni parola che si aggiungerà domani — non serve rileggerlo a
      occhio ogni volta.
   ═══════════════════════════════════════════════════════════════════ */
import { tutteDi } from '../../src/data/lessico.js'
import { TIPI, componi } from '../../src/data/domande.js'
import { controlla, nota, riassunto } from '../aiuto/verifica.mjs'

const ok = (cond, cosa, dettaglio = '') => controlla(cosa, cond, dettaglio)
const titolo = t => console.log('\n' + t)
const haVoce = () => true            // qui non ci interessa l'audio, solo le figure

titolo('LE FAMIGLIE DICHIARATE')
{
  // ogni famiglia deve avere almeno due membri, altrimenti non protegge
  // niente e non ha ragione di esistere
  for (const lingua of ['en', 'es']) {
    const perFamiglia = {}
    for (const v of tutteDi(lingua))
      if (v.genere === 'parola' && v.famiglia)
        (perFamiglia[v.famiglia] = perFamiglia[v.famiglia] || []).push(v.chiave)
    for (const [fam, membri] of Object.entries(perFamiglia))
      ok(membri.length >= 2, `famiglia '${fam}' (${lingua}) con un solo membro`, membri.join(', '))
    nota(`  ${lingua}: ` + Object.entries(perFamiglia)
      .map(([f, m]) => `${f} (${m.length})`).join(' · '))
  }
}

titolo('NESSUNA COPPIA CONFONDIBILE NELLA STESSA DOMANDA')
{
  let domandeCostruite = 0, conFamiglia = 0
  for (const lingua of ['en', 'es']) {
    const voci = tutteDi(lingua).filter(v => v.genere === 'parola' && v.emoji)
    // emoji -> famiglia, per risalire dalle opzioni (che portano solo
    // l'emoji) a chi le ha generate
    const famigliaDiEmoji = new Map()
    for (const v of voci) if (v.famiglia) famigliaDiEmoji.set(v.emoji, v.famiglia)

    for (const v of voci) {
      for (const tipo of ['figura', 'ascoltoFigura']) {
        if (!TIPI[tipo].puoUsare(v, haVoce)) continue
        const q = componi(v, tipo)
        domandeCostruite++
        const famiglie = q.opzioni
          .map(o => famigliaDiEmoji.get(o.emoji))
          .filter(Boolean)
        if (famiglie.length) conFamiglia++
        if (!ok(new Set(famiglie).size === famiglie.length,
                'due icone della stessa famiglia nella stessa domanda',
                `${lingua} ${tipo} su ${v.chiave}: ` +
                JSON.stringify(q.opzioni.map(o => o.emoji)) +
                ` → famiglie ${JSON.stringify(famiglie)}`))
          continue
      }
    }
  }
  nota(`  ${domandeCostruite} domande figurate costruite, ${conFamiglia} con almeno` +
       ' una voce di famiglia dichiarata')
  ok(conFamiglia > 0, 'nessuna domanda ha mai coinvolto una famiglia: il controllo non prova niente')
}

riassunto('Lessico: le icone, senza ripieghi e senza coppie confondibili')
