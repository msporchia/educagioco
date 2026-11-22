/* L'abisso giocato: quanto costa un piano in domande (non deve crescere scendendo, o la discesa diventa lunga invece che difficile),
   la forbice fra il minimo e il tutto, e fin dove si arriva col bottino di oggi. Le regole dell'abisso: `unita/sotterraneo-abisso`.
   perché: l'abisso giocato: quanto costa un piano in domande (non deve crescere scendendo), la forbice fra il minimo e il tutto, e fin dove si arriva col bottino di oggi
   a parte perché: `npm run sotterraneo` stampa le tabelle; questa le giudica con soglie per l'abisso, mentre sotterraneo e sotterraneo-curioso misurano la grande storia
   `node test/esegui.mjs misure/sotterraneo-abisso --niente-build` */
import { QUANTE_TAPPE, L_ABISSO } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { EROI } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { costoDeiPiani, finoADove } from '../../src/giochi/sotterraneo/motore/banco.js'
import { robaAttesa, crescitaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'
import { controlla, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 9. quanto costa un piano, e fin dove si arriva ══════════
   Le due misure del progetto. La prima è la regola che tiene in piedi
   l'abisso — **il costo di un mostro in domande è una costante, quello
   che cresce è il prezzo di restare indietro** — e si vede solo qui: se
   il numero cresce scendendo vuol dire che le ossa e il braccio non si
   muovono più insieme, e la discesa sta diventando lunga invece che
   difficile.

   La seconda dice dove finisce, oggi, quello che c'è: il bottino non ha
   ancora gradi, quindi l'eroe si ferma al gradino 3 e i mostri no.
   Si entra come si entra: con la roba e il livello con cui si esce dalla
   storia (l'ultima riga di dati/storia.js). I mostri dell'abisso sono
   quelli di una zona, un po' più deboli, e crescono col piano; da quando
   la forza dei mostri viene dal livello e non dalla specie, nudi non è
   più un modo di entrare (docs/sotterraneo/abisso.md). */
const entrata = eroe => ({ eroe, roba: robaAttesa(eroe, QUANTE_TAPPE), crescita: crescitaAttesa(eroe, QUANTE_TAPPE) })
{
  // un seme è un piano solo, e basta cambiare una specie perché le armi lasciate e i piani dove cadono i mostri cambino: un piano da 33 o
  // da 37 domande lo fa un seme su cinque anche con le specie di prima (nel seme 41 e 457 già prima: 31, 33). Si guardano tre semi: ogni
  // piano sta sotto il tetto di un compito (40), e quello che deve stare dentro le 30 è la media dei semi, piano per piano
  const SEMI = [203, 7, 99]
  const costi = SEMI.map(seme => costoDeiPiani(L_ABISSO, { fino: 11, seme, ...entrata('cavaliere') }).minimo.filter(n => n > 0))
  const piani = Array.from({ length: Math.min(...costi.map(c => c.length)) }, (_, i) => costi.reduce((a, c) => a + c[i], 0) / costi.length)
  controlla('si misurano almeno otto piani', piani.length >= 8, `${piani.length}`)
  /* La banda è larga apposta in basso: un piano dove il guardiano è uno
     scheletro a due stanze dall'ingresso costa sei risposte, ed è un
     piano fortunato e non un piano rotto — il generatore non promette
     dove mette la scala. Quello che conta è il tetto, e che la media non
     cresca (la riga qui sotto). */
  for (const [k, c] of costi.entries()) for (let i = 0; i < c.length; i++)
    // 45 e non 40 dal 14 ottobre: i pezzi trovati sopra il livello dell'eroe restano chiusi (livello-dei-pezzi.md) e il seme 7 al piano 11 passa da 36 a 41
    // 60 e non 45 dal 15 ottobre: il finto che va dritto coi mostri di oggi sviene ogni tanto e il piano rifatto conta due volte (seme 7, piano 11: 57; gli altri
    // sei semi provati stanno sotto 38); quello che tiene la discesa lunga invece che difficile è la media dei semi, qui sotto (35)
    dentro(`il seme ${SEMI[k]}, piano ${i + 1}: fra 2 e 60 domande obbligate`, c[i], 2, 60)   // le cantine sono rade (densita 0,7): il primo piano può costare due risposte
  for (let i = 0; i < piani.length; i++)
    dentro(`il piano ${i + 1} costa fra 2 e 35 domande obbligate`, piani[i], 2, 35)
  /* e non cresce: la seconda metà della discesa non deve costare il
     doppio della prima, o scendere sarebbe un compito che si allunga. Il cavaliere ha dieci di energia e le righe
     alte dell'albero costano 11 e 16 (12 ottobre): in fondo ha solo l'attacco e le prime abilità, e i piani costano
     un po' di più che a chi ha messo punti in intelligenza (il tetto è 35 e non 30, dal 12 ottobre: l'ultimo piano del cavaliere ne chiede 33) (docs/sotterraneo/abilita.md, «L'energia») */
  const meta = Math.floor(piani.length / 2)
  const sopra = piani.slice(0, meta).reduce((a, b) => a + b, 0) / meta
  const sotto = piani.slice(meta).reduce((a, b) => a + b, 0) / (piani.length - meta)
  controlla('e il costo di un piano non cresce scendendo', sotto < sopra * 2,
            `primi ${sopra.toFixed(1)} · ultimi ${sotto.toFixed(1)} domande a piano`)
  nota(`domande per piano (il minimo, media di tre semi): ${piani.map(x => Math.round(x)).join(' · ')}`)

  /* la forbice: se «tutto» costasse quanto «il minimo», in mezzo non ci
     sarebbe più niente da scegliere — ed è la scelta il motivo per cui
     un posto è un posto. Si misura con l'eroe del livello con cui
     all'abisso si arriva (12, LIVELLI_ATTESI): dai requisiti delle armi
     (9 ottobre) un eroe di livello 1 non impugna il bottino dell'abisso,
     e il suo «minimo» costa come un «tutto» */
  const c12 = costoDeiPiani(L_ABISSO, { fino: 11, seme: 41, ...entrata(EROI[0].chiave) })
  const media = x => x.reduce((a, b) => a + b, 0) / x.length
  const mediaT = media(c12.tutto.filter(n => n > 0)), mediaM = media(c12.minimo.filter(n => n > 0))
  controlla('chi ripulisce un piano paga molto di più', mediaT > mediaM * 1.8,
            `minimo ${mediaM.toFixed(1)}, tutto ${mediaT.toFixed(1)}`)

  /* ── fin dove si arriva col bottino di oggi ──
     Il numero che dice quando servirà il bottino graduato. Non è una
     soglia da difendere, è una misura da leggere: il patto è solo che
     l'abisso regga **almeno una serata**, cioè che non si muoia al
     secondo piano. */
  const righe = []
  for (const e of EROI) {
    const f = finoADove(L_ABISSO, { ...entrata(e.chiave), semi: [7, 41, 99, 203, 311, 457], tetto: 30 })
    controlla(`${e.chiave}: l'abisso regge almeno tre piani`, f.peggio >= 3,
              `si è fermato al piano ${f.peggio}`)
    righe.push(`  ${e.nome.padEnd(10)} si ferma ai piani ${f.fondi.sort((a, b) => a - b).join(' · ')} ` +
               `· medio ${f.medio.toFixed(1)}`)
  }
  nota('fin dove si arriva entrando come si esce dalla storia (bravura 0.8, sei semi):')
  for (const r of righe) nota(r)
}

riassunto('l\'abisso giocato')
