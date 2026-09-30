/* ═══════════════════════════════════════════════════════════════════
   IL MURO LO SISTEMA IL GIOCO

   Prima un muro (otto risposte, meno di metà giuste) scriveva un avviso
   nella posta dei grandi, e il grande non sapeva cosa farci. Adesso il
   gioco reagisce da sé: per una settimana quella tipologia esce più di
   rado — il fondo della banda del ripasso, mai fuori — e prima di
   rispondere si legge un esempio svolto (unita/svolto).

   Le cose da non sbagliare: una settimana e non per sempre; dopo, conta
   solo quello che è successo da allora; un conto azzerato riparte da
   zero; «Va bene così» toglie la riga finché le prove nuove non dicono
   di nuovo muro.

   `node test/esegui.mjs alleggerire --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { SETTIMANA, segnoDa, contoDopo, alleggeritaDa, daAlleggerire,
         ancoraDifficile, bisognoAlleggerito } from '../../src/quiz/alleggerire.js'
import { BISOGNO } from '../../src/quiz/nucleo/bisogno.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const T0 = 1_800_000_000_000
const GIORNO = 86400000
const muro = { ok: 2, err: 8 }
const bene = { ok: 9, err: 1 }

/* ══════════ 1. quando scatta ══════════ */
controlla('un muro senza segno si alleggerisce', daAlleggerire(muro, null, T0))
controlla('una tipologia che va bene no', !daAlleggerire(bene, null, T0))
controlla('e nemmeno un conto corto, che conta più il caso',
          !daAlleggerire({ ok: 1, err: 5 }, null, T0))

/* ══════════ 2. una settimana, e poi si riguarda da capo ══════════ */
{
  const segno = segnoDa(muro, T0)
  uguale('il segno si ricorda il conto di quel momento', `${segno.ok}/${segno.err}`, '2/8')
  controlla('il giorno dopo è alleggerita', alleggeritaDa(segno, T0 + GIORNO))
  controlla('e mentre lo è non si rialleggerisce',
            !daAlleggerire({ ok: 2, err: 12 }, segno, T0 + GIORNO))
  controlla('dopo sette giorni non lo è più', !alleggeritaDa(segno, T0 + SETTIMANA))
  const dopo = T0 + SETTIMANA + GIORNO
  controlla('e il vecchio conto da solo non la fa ripartire',
            !daAlleggerire({ ok: 2, err: 8 }, segno, dopo))
  controlla('ci vogliono otto prove nuove, ancora sbagliate',
            daAlleggerire({ ok: 4, err: 14 }, segno, dopo))
  controlla('se le prove nuove vanno bene, resta com\'è',
            !daAlleggerire({ ok: 9, err: 10 }, segno, dopo))
}

/* ══════════ 3. il conto dopo il segno ══════════ */
uguale('si contano solo le risposte arrivate dopo',
       JSON.stringify(contoDopo({ ok: 5, err: 10 }, { ok: 2, err: 8 })),
       JSON.stringify({ ok: 3, err: 2, quante: 5 }))
uguale('un conto azzerato («↻ ricomincia a contare») riparte da zero',
       JSON.stringify(contoDopo({ ok: 1, err: 0 }, { ok: 2, err: 8 })),
       JSON.stringify({ ok: 1, err: 0, quante: 1 }))

/* ══════════ 4. dentro la banda, mai fuori ══════════ */
uguale('alleggerita pesa il fondo della banda', bisognoAlleggerito(1.5, true), BISOGNO.min)
uguale('e non a zero: esce meno, non sparisce', BISOGNO.min > 0, true)
uguale('non alleggerita resta com\'era', bisognoAlleggerito(1.3, false), 1.3)

/* l'esempio svolto che si mostra prima della domanda ha un banco suo: unita/svolto */

/* ══════════ 5. «Va bene così» ══════════ */
{
  const segno = segnoDa(muro, T0)
  controlla('senza segno un muro è difficile', ancoraDifficile(muro, null))
  controlla('col segno sparisce dall\'elenco', !ancoraDifficile(muro, segno))
  controlla('e torna solo con otto prove nuove che dicono muro',
            ancoraDifficile({ ok: 3, err: 15 }, segno))
}

riassunto('il muro lo sistema il gioco')
