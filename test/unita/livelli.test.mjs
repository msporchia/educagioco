/* ═══════════════════════════════════════════════════════════════════
   TUTTI I LIVELLI DEL GENERALE, SULLO STESSO BANCO
   tempo: 600

   Un test solo, non uno per scenario. Raccoglie i livelli da dove
   stanno — i sei (e più) scenari delle storie in `src/data/livelli/` e
   quelli di prova in `src/data/generale.js` — e li passa al
   verificatore, che è uguale per tutti (`test/aiuto/livello.mjs`).

   I file non si elencano a mano: si leggono dalla cartella, come fa
   `data/mappe-storie.js` col glob di Vite. Uno scenario nuovo entra nel
   banco di prova il giorno in cui il suo file compare, senza che
   nessuno debba ricordarsi di aggiungere una riga qui.

   Quello che uno scenario ha di suo — «senza la chiavetta non si
   vince», «non basta mandarli avanti in fila» — non sta qui: sta nel
   campo `verifiche` del livello, e il verificatore lo esegue. Il
   contratto di quel campo è scritto in testa a `test/aiuto/livello.mjs`.
   ═══════════════════════════════════════════════════════════════════ */
import { readdirSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { nota, controlla, riassunto } from '../aiuto/verifica.mjs'
import { provaLivello } from '../aiuto/livello.mjs'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CARTELLA = resolve(RADICE, 'src/data/livelli')
const PROVA = resolve(RADICE, 'src/data/generale.js')

/* un modulo può esportare il livello come default o con un nome: si
   prende il primo oggetto che assomiglia a un livello — la stessa
   regola di `data/mappe-storie.js`, che è quella che vale nel gioco */
const estrai = mod => [mod.default, mod.LIVELLO, mod.livello, ...Object.values(mod)]
  .find(v => v && typeof v === 'object' && !Array.isArray(v) && (v.griglia || v.unita)) || null

const livelli = []

if (existsSync(CARTELLA))
  for (const f of readdirSync(CARTELLA).sort().filter(x => x.endsWith('.js'))) {
    const liv = estrai(await import(pathToFileURL(resolve(CARTELLA, f)).href))
    if (liv) livelli.push({ nome: f.replace(/\.js$/, ''), liv })
    else controlla(`${f}: esporta un livello`, false, 'non esporta niente che assomigli a un livello')
  }

if (existsSync(PROVA)) {
  const dati = await import(pathToFileURL(PROVA).href)
  const LIVELLI = dati.LIVELLI || dati.livelli || dati.default || []
  LIVELLI.forEach((liv, i) => livelli.push({ nome: `prova ${i + 1}. ${liv.nome || liv.id}`, liv }))
}

controlla('i livelli si raccolgono da soli', livelli.length > 0)
const ids = livelli.map(x => x.liv.id)
controlla('gli id dei livelli sono unici', new Set(ids).size === ids.length,
          ids.filter((x, i) => ids.indexOf(x) !== i).join(', '))

for (const { nome, liv } of livelli) provaLivello(liv, nome)

nota(`livelli sul banco: ${livelli.length} — ${livelli.map(x => x.nome).join(', ')}`)
const dichiarano = livelli.filter(x => x.liv.verifiche)
nota(`con prove dichiarate: ${dichiarano.length ? dichiarano.map(x => x.nome).join(', ') : 'nessuno'}`)

riassunto('i livelli del Generale')
