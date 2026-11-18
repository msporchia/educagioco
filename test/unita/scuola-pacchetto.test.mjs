/* LA SCUOLA NON TIRA DENTRO L'APP DI CASA

   Segue gli import (anche nei .vue e quelli dinamici) dalle due `main.js`, coi sostituti applicati, e
   fallisce se arriva a un modulo vietato, dicendo la catena che ce l'ha portato (docs/scuola/architettura.md).
   Le regole sono per pagina: i bambini giocano agli Asteroidi veri (three, MathGame, lo store di casa) ma
   senza archivio su disco, amici, guide né altri giochi; la maestra non ha niente di tutto questo.
   `node test/esegui.mjs scuola-pacchetto --niente-build` */
import { readFileSync, existsSync, statSync } from 'node:fs'
import { resolve, dirname, relative } from 'node:path'
import { SOSTITUTI, AMMESSI } from '../../src/scuola/sostituti/elenco.js'
import { controlla, riassunto, nota } from '../aiuto/verifica.mjs'

const RADICE = resolve(import.meta.dirname, '../..')
const rel = p => relative(RADICE, p).split('\\').join('/')
const ammesso = p => AMMESSI.some(a => p === a || (a.endsWith('/') && p.startsWith(a)))
const SOST = new Map(Object.entries(SOSTITUTI).map(([da, a]) => [resolve(RADICE, da), resolve(RADICE, a)]))

const MAESTRA = {
  three: false,
  vietati: [
    [p => p.startsWith('src/store/'), 'src/store/'],
    [p => p === 'src/aggiornamento.js', 'src/aggiornamento.js'],
    [p => p.startsWith('src/amici/'), 'src/amici/'],
    [p => p.startsWith('src/guide/'), 'src/guide/'],
    [p => p === 'src/App.vue', 'src/App.vue'],
  ],
  testi: [],
}

// l'originale dell'archivio raggiunto vuol dire che il sostituto non è collegato
const BAMBINI = {
  three: true,
  vietati: [
    [p => p === 'src/store/storage.js', "src/store/storage.js (l'originale: il sostituto non è collegato)"],
    [p => ['src/store/amici.js', 'src/store/posta.js', 'src/store/pin.js'].includes(p), 'src/store/{amici,posta,pin}.js'],
    [p => ['src/aggiornamento.js', 'src/incidenti.js', 'src/App.vue', 'src/main.js'].includes(p), "un pezzo dell'app di casa"],
    [p => p.startsWith('src/amici/'), 'src/amici/'],
    [p => p.startsWith('src/guide/'), 'src/guide/'],
    [p => p.startsWith('src/insieme/') && p !== 'src/insieme/rete.js', 'src/insieme/'],
    [p => /^src\/giochi\/[^/]+\//.test(p) && !ammesso(p), 'un gioco non ammesso (src/giochi/<cartella>/: docs/scuola/giochi.md)'],
    [p => p.startsWith('src/views/') && !ammesso(p), 'un gioco non ammesso (src/views/)'],
  ],
  testi: [
    [() => true, /\bindexedDB\b/, 'indexedDB'],
    [p => !p.startsWith('src/scuola/'), /\b(?:localStorage|sessionStorage)\b/, 'localStorage o sessionStorage'],
  ],
}

const codiceDi = (file, testo) => {
  if (!file.endsWith('.vue')) return testo
  return [...testo.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n')
}
const senzaCommenti = t => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const importDi = t => {
  const fonti = []
  for (const m of t.matchAll(/\b(?:import|export)\b[^'"`;()]*?\bfrom\s*['"]([^'"]+)['"]/g)) fonti.push(m[1])
  for (const m of t.matchAll(/\bimport\s*['"]([^'"]+)['"]/g)) fonti.push(m[1])
  for (const m of t.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]/g)) fonti.push(m[1])
  return fonti
}

const trova = base => {
  for (const c of [base, base + '.js', base + '.vue', base + '/index.js']) {
    if (existsSync(c) && statSync(c).isFile()) return c
  }
  return null
}

function segui (partenza, regole) {
  const guasti = []
  const visti = new Map()          // file → chi l'ha portato (catena)
  const coda = [[partenza, [rel(partenza)]]]
  visti.set(partenza, true)
  while (coda.length) {
    const [file, catena] = coda.shift()
    const testo = senzaCommenti(codiceDi(file, readFileSync(file, 'utf8')))
    if (/import\.meta\.glob/.test(testo)) guasti.push(`usa import.meta.glob: ${catena.join(' → ')}`)
    // per i testi anche i commenti in coda alla riga (non quelli dopo «:», che sono indirizzi)
    const codice = testo.replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1')
    for (const [dove, re, che] of regole.testi) {
      if (dove(rel(file)) && re.test(codice)) guasti.push(`nomina ${che}: ${catena.join(' → ')}`)
    }
    for (const fonte of importDi(testo)) {
      if (fonte === 'three' || fonte.startsWith('three/')) {
        if (!regole.three) guasti.push(`tocca three: ${[...catena, fonte].join(' → ')}`)
        continue
      }
      if (!fonte.startsWith('.')) continue
      const pulita = fonte.split('?')[0]
      if (/\.(css|svg|png|json)$/.test(pulita) && !/\.json$/.test(pulita)) continue
      const dove = trova(resolve(dirname(file), pulita))
      if (!dove) { guasti.push(`import che non si risolve «${fonte}»: ${catena.join(' → ')}`); continue }
      const vero = SOST.get(dove) || dove
      const r = rel(vero)
      const divieto = regole.vietati.find(([f]) => f(r))
      if (divieto) { guasti.push(`tocca ${divieto[1]}: ${[...catena, r].join(' → ')}`); continue }
      if (visti.has(vero)) continue
      visti.set(vero, true)
      coda.push([vero, [...catena, r]])
    }
  }
  return { guasti, visti: [...visti.keys()].map(rel) }
}

for (const [p, regole] of [['src/scuola/bambini/main.js', BAMBINI], ['src/scuola/maestra/main.js', MAESTRA]]) {
  const f = resolve(RADICE, p)
  if (!controlla(`${p} esiste`, existsSync(f))) continue
  const { guasti, visti } = segui(f, regole)
  controlla(`${p}: il pacchetto non tocca moduli vietati`, !guasti.length, '\n     ' + guasti.join('\n     '))
  nota(`${p}: ${visti.length} file`)
  if (regole === BAMBINI) {
    controlla('i bambini hanno gli Asteroidi veri', visti.includes('src/views/MathGame.vue'))
    controlla("e l'archivio in memoria al posto di quello di casa", visti.includes('src/scuola/sostituti/storage.js'))
  }
}

riassunto('il pacchetto della scuola')
