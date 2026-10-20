/* Il catalogo 3D (strumenti/banco/catalogo-3d/): ogni voce della fattoria ha i campi del formato (docs/core/catalogo-3d.md) e
   un `file:` che esiste davvero e nomina qualcosa che c'è scritto dentro. Non crea i modelli (serve un browser).
   `node test/esegui.mjs catalogo-3d`
   tempo: 1 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { controlla, riassunto } from '../aiuto/verifica.mjs'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const DIR = resolve(RADICE, 'strumenti/banco/catalogo-3d')
const GIOCHI = ['sotterraneo', 'fattoria', 'entrambi']
const CATEGORIE = ['edificio', 'prop', 'pianta', 'personaggio', 'animale', 'effetto', 'altro']

for (const f of readdirSync(DIR).filter(x => x.endsWith('.js'))) {
  const { VOCI } = await import(resolve(DIR, f))
  controlla(`${f}: esporta VOCI, un array non vuoto`, Array.isArray(VOCI) && VOCI.length > 0)
  const ids = new Set()
  for (const v of VOCI) {
    const chi = `${f} «${v.id}»`
    controlla(`${chi}: id unico`, typeof v.id === 'string' && v.id && !ids.has(v.id)); ids.add(v.id)
    controlla(`${chi}: ha un nome`, typeof v.nome === 'string' && v.nome.length > 0)
    controlla(`${chi}: gioco valido`, GIOCHI.includes(v.gioco))
    controlla(`${chi}: categoria valida`, CATEGORIE.includes(v.categoria))
    controlla(`${chi}: dice dove si vede`, typeof v.dove === 'string' && v.dove.length > 5)
    controlla(`${chi}: crea è una funzione`, typeof v.crea === 'function')
    const m = /^(src\/[^:]+):(.+)$/.exec(v.file || '')
    controlla(`${chi}: file è «percorso:funzione»`, !!m)
    if (!m) continue
    controlla(`${chi}: il file ${m[1]} esiste`, existsSync(resolve(RADICE, m[1])))
    if (existsSync(resolve(RADICE, m[1]))) {
      const nome = m[2].split('.').pop()
      controlla(`${chi}: ${nome} è scritto in ${m[1]}`, readFileSync(resolve(RADICE, m[1]), 'utf8').includes(nome))
    }
  }
}
riassunto('Catalogo 3D')
