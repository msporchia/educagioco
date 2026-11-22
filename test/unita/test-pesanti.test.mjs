/* Un test pesante spiega perché esiste (docs/core/test.md, «Cosa va nel browser, e cosa no»): ogni file nel browser, ogni
   verifica, ogni misura e ogni unità che si dichiara lenta dice in testa cosa prova che nessun altro prova (`perché:`) e come
   mai non è un blocco in più di un file che c'è già (`a parte perché:`). Qui si guarda solo che le due righe ci siano e
   dicano qualcosa: è la domanda da farsi prima di aprire un Chrome in più, non un divieto. */
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { controlla, nota, riassunto } from '../aiuto/verifica.mjs'

const TEST = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SEMPRE = ['integrazione', 'verifiche', 'misure']   // pesanti per natura: Chrome, o partite finte
const TESTA = 4000                                       // come `tempo:` nel lanciatore: le righe stanno fra i primi commenti
const LENTA = 100                                        // un'unità che dichiara `tempo:` da qui in su (la soglia di `--svelti`)

const fileDi = gruppo => readdirSync(resolve(TEST, gruppo), { recursive: true }).map(String)
  .filter(f => f.endsWith('.test.mjs')).sort().map(f => ({ nome: `${gruppo}/${f.replace(/\.test\.mjs$/, '')}`, file: resolve(TEST, gruppo, f) }))
const testa = t => readFileSync(t.file, 'utf8').slice(0, TESTA)
const riga = (testo, etichetta) => new RegExp(`^[ \\t*/]*${etichetta}:[ \\t]*(.+)$`, 'm').exec(testo)?.[1].trim() ?? null

const pesanti = [
  ...SEMPRE.flatMap(fileDi),
  ...fileDi('unita').filter(t => Number(/^[ \t]*tempo:\s*(\d{1,4})/m.exec(testa(t))?.[1] || 0) >= LENTA),
]

/* una riga vera: non vuota, non un segnaposto, e lunga abbastanza da dire una cosa */
const dice = r => !!r && r.length >= 20 && !/^(da scrivere|todo|\?+|\.+)$/i.test(r)

for (const t of pesanti) {
  const capo = testa(t)
  controlla(`${t.nome}: dice perché esiste (\`perché:\`)`, dice(riga(capo, 'perché')), riga(capo, 'perché') ?? 'manca la riga')
  controlla(`${t.nome}: dice perché non allunga un file che c'è già (\`a parte perché:\`)`, dice(riga(capo, 'a parte perché')),
            riga(capo, 'a parte perché') ?? 'manca la riga')
}

nota(`${pesanti.length} test pesanti: ${SEMPRE.map(g => `${fileDi(g).length} in ${g}`).join(', ')}`)
riassunto('i test pesanti spiegano perché esistono')
