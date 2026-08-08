/* ═══════════════════════════════════════════════════════════════════
   I LUCCHETTI DELLE CAMPAGNE

   Ogni gioco a tappe si faceva la stessa domanda per conto suo, con la
   stessa riga copiata in cinque posti: `i <= progresso.tappa`. Adesso
   la regola sta in `tappaAperta`, una volta sola, perché il flag dei
   genitori la deve poter scavalcare tutta insieme.

   Il flag `settings.tuttoAperto` esisteva da tempo con il suo
   interruttore nella schermata dei genitori, e non lo leggeva nessuno:
   si accendeva e non succedeva niente. È il guasto che questo file
   esiste per non far tornare — che è anche l'unico modo di provare in
   fretta le quindici tappe del castello senza giocarsele tutte in fila.
   ═══════════════════════════════════════════════════════════════════ */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { tappaAperta, accendiTuttoAperto, tuttoAperto } from '../../src/store/profile.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const RADICE = join(dirname(fileURLToPath(import.meta.url)), '../..')

/* ── 1. a lucchetti chiusi si va avanti una per volta ── */
accendiTuttoAperto(false)
uguale('la tappa già superata resta aperta', tappaAperta(0, 2), true)
uguale('la prossima è aperta', tappaAperta(2, 2), true)
uguale('quella dopo no', tappaAperta(3, 2), false)
uguale('l\'ultima di quindici è chiusa a chi non ha ancora giocato',
       tappaAperta(14, 0), false)

/* ── 2. il flag le apre tutte ──
   Non «qualcuna in più»: tutte, anche l'ultima a chi non ha mai giocato.
   È il punto dell'interruttore. */
accendiTuttoAperto(true)
uguale('col flag acceso l\'interruttore risulta acceso', tuttoAperto(), true)
for (const i of [0, 5, 14, 42])
  uguale(`col flag acceso la tappa ${i + 1} è aperta a chi non ha giocato`,
         tappaAperta(i, 0), true)

/* ── 3. e si richiude ──
   Un interruttore che accende e non spegne è un guasto che si scopre
   il giorno in cui si pubblica. */
accendiTuttoAperto(false)
uguale('spento il flag i lucchetti tornano', tappaAperta(14, 0), false)

/* ── 4. nessun gioco se la calcola più per conto suo ──
   La prova che tiene in piedi tutte le altre: se domani qualcuno
   riscrive `i <= progresso.tappa` dentro una view, il flag smette di
   funzionare in quel gioco e nessuno se ne accorge, perché il gioco
   continua a funzionare benissimo. Qui si guarda il sorgente. */
/* si guarda in `views/` e in `components/`, e anche nei `.js` che le
   viste si sono portate fuori: da quando il castello è stato spezzato,
   la mappa delle tappe non sta più dentro un `.vue` di gioco */
const files = []
const raccogli = d => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory()) raccogli(join(d, e.name))
    else if (/\.(vue|js)$/.test(e.name)) files.push(join(d, e.name))
  }
}
raccogli(join(RADICE, 'src/views'))
raccogli(join(RADICE, 'src/components'))

/* la riga incriminata: un confronto fatto a mano con `progresso.tappa`
   dentro la definizione di cosa è sbloccato */
const AMANO = /(sbloccat\w*|apribile|aperta)\s*=\s*[^\n]*<=\s*[^\n]*\.tappa/
const colpevoli = files.filter(f => AMANO.test(readFileSync(f, 'utf8')))
controlla('nessuna view decide i lucchetti per conto suo',
          colpevoli.length === 0,
          colpevoli.map(f => f.slice(RADICE.length + 1)).join(', ') +
          ' — usa tappaAperta() di store/profile.js')

nota(`viste esaminate: ${files.length}`)
riassunto('lucchetti')
