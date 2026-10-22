#!/usr/bin/env node
// La promozione dei prototipi 3D nel Sotterraneo 3D (docs/sotterraneo/mostri-3d.md): copia da `poc/` in `src/` i moduli che il
// gioco usa, seguendo gli import a partire dalle radici di ogni gruppo (solo il referenziato), li mette in una cartella sola per
// gruppo riscrivendo gli import relativi e premette a ognuno la riga «Generato da…». I prototipi restano autonomi e non si toccano:
// si cambia il prototipo e si rilancia. Per i mostri scrive anche `mostri3d/elenchi.js`, gli elenchi che ci sono davvero: una
// zona ancora a metà (un file che manca o non si importa) resta fuori senza rompere il gioco, e entra al rilancio. Per la roba
// (docs/sotterraneo/roba-3d.md) scrive `roba3d/moduli.js` coi moduli delle famiglie che ci sono e si costruiscono, e
// `roba3d/catalogo-roba.js` al posto di roba.json (i dati delle figure li tiene dati/figure3d.js, `npm run roba3d`).
//
//   npm run promuovi3d                 riscrive le copie
//   npm run promuovi3d -- --controlla  non scrive: esce con 1 se una copia è diversa dal prototipo (o manca, o è in più)
import { readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync, mkdirSync, rmSync } from 'node:fs'
import { resolve, dirname, basename, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SCENA = 'src/giochi/sotterraneo/scena3d'
export const SEGNO = 'Generato da strumenti/promuovi-3d.mjs'

// i moduli della roba: uno per famiglia di figure (il prefisso dell'id → la famiglia sta in strumenti/mappa-roba3d.mjs)
export const FAMIGLIE_ROBA = ['lame', 'bastoni', 'scudi', 'vesti', 'gioielli', 'pozioni']
const CATALOGO_ROBA = 'catalogo-roba.js'

// I gruppi: dove vanno e da quali file si parte. `elenchi`: per i mostri, il file → l'export con l'elenco delle creature
export const GRUPPI = [
  { nome: 'eroi', dest: `${SCENA}/eroi3d`,
    radici: ['poc/eroi-3d/eroi.js', 'poc/eroi-3d/ascia.js', 'poc/armi-3d/armi.js', 'poc/armi-3d/collezione.js', 'poc/armature-3d/armature.js', 'poc/copricapi-3d/copricapi.js'] },
  { nome: 'mostri', dest: `${SCENA}/mostri3d`,
    radici: ['poc/mostri-3d/mostri.js', 'poc/mostri-3d/prati.js', 'poc/mostri-3d/bosco.js', 'poc/mostri-3d/palude.js', 'poc/mostri-3d/ceneri.js',
             'poc/mostri-3d/draghi.js', 'poc/mostri-3d/monte.js', 'poc/mostri-3d/landa.js',
             // le animazioni delle mosse multiple (docs/sotterraneo/mosse.md): i dati veri stanno in dati/mosse.js, qui solo il disegno
             'poc/mostri-3d/mosse-anim.js'],
    // le zone che si aggiungono solo se il loro file c'è e si importa (altri le stanno ancora finendo)
    facoltative: ['poc/mostri-3d/monte.js', 'poc/mostri-3d/landa.js'],
    elenchi: { 'mostri.js': ['mostri', 'MOSTRI'], 'prati.js': ['prati', 'MOSTRI_PRATI'], 'bosco.js': ['bosco', 'MOSTRI_BOSCO'], 'palude.js': ['palude', 'MOSTRI_PALUDE'],
               'ceneri.js': ['ceneri', 'MOSTRI_CENERI'], 'monte.js': ['monte', 'MOSTRI_MONTE'], 'landa.js': ['landa', 'MOSTRI_LANDA'] } },
  { nome: 'effetti', dest: `${SCENA}/effetti3d`,
    radici: ['poc/effetti-3d/lancio.js', 'poc/effetti-3d/mischia.js', 'poc/effetti-3d/aure.js'] },
  // la roba: gli aloni sempre, i moduli delle famiglie (FAMIGLIE_ROBA) solo se ci sono, si importano e costruiscono una figura
  { nome: 'roba', dest: `${SCENA}/roba3d`,
    radici: ['poc/roba-3d/aloni.js', ...FAMIGLIE_ROBA.map(f => `poc/roba-3d/${f}.js`)],
    facoltative: FAMIGLIE_ROBA.map(f => `poc/roba-3d/${f}.js`), moduli: true },
]

const IMPORT = /(\bfrom\s*|\bimport\s*\(?\s*)(['"])([^'"]+)\2/g
const testoCatalogo = figure3d => `// ${SEGNO}: non si tocca a mano. Il catalogo delle figure come lo leggono i prototipi (roba.json), dai\n` +
  `// dati di dati/figure3d.js (\`npm run roba3d\`): senza le descrizioni e i rettangoli, che il disegno non usa.\n` +
  `import { FIGURE3D } from '${figure3d}'\n\nexport default { figure: Object.entries(FIGURE3D).map(([id, f]) => ({ id, ...f })) }\n`
const testata = sorgente => `// ${SEGNO} da ${sorgente}: non si tocca a mano (si cambia il prototipo e si rilancia \`npm run promuovi3d\`).\n`

/** I file di un gruppo, seguendo gli import relativi: { percorso relativo alla radice → testo riscritto }. Fallisce su un nome doppio. */
function raccogli(radici) {
  const visti = new Map(), nomi = new Map(), coda = [...radici]
  while (coda.length) {
    const rel = coda.shift()
    if (visti.has(rel)) continue
    const assoluto = resolve(RADICE, rel)
    if (!existsSync(assoluto)) throw new Error(`manca ${rel}`)
    const testo = readFileSync(assoluto, 'utf8')
    const nome = basename(rel)
    if (nomi.has(nome) && nomi.get(nome) !== rel) throw new Error(`due file con lo stesso nome: ${nomi.get(nome)} e ${rel}`)
    nomi.set(nome, rel)
    const riscritto = testo.replace(IMPORT, (tutto, prima, q, spec) => {
      if (spec.endsWith('/roba.json')) return `${prima}${q}./${CATALOGO_ROBA}${q}`
      if (!spec.startsWith('.')) {
        if (spec !== 'three' && !spec.startsWith('three/')) throw new Error(`${rel}: importa «${spec}», fuori da three`)
        return tutto
      }
      const dep = relative(RADICE, resolve(dirname(assoluto), spec))
      if (!dep.startsWith('poc/')) throw new Error(`${rel}: importa ${dep}, fuori da poc/`)
      coda.push(dep)
      return `${prima}${q}./${basename(dep)}${q}`
    })
    // la regola delle emoji (docs/core/emoji.md): ogni pila di font del gioco comincia con il nostro, anche sulle tele dei prototipi
    const conFont = riscritto.replace(/(\.font\s*=\s*['"`])((?:[\w-]+ )*\d+px )(?!"Emoji Gioco")/g, '$1$2"Emoji Gioco", ')
    visti.set(rel, testata(rel) + conFont)
  }
  return visti
}

/** Le zone facoltative che si importano davvero ed esportano il loro elenco con le `crea`. */
async function zonaPronta(rel, elenchi) {
  const voce = elenchi[basename(rel)]
  try {
    const m = await import(pathToFileURL(resolve(RADICE, rel)).href)
    const lista = voce && m[voce[1]]
    return Array.isArray(lista) && lista.length > 0 && lista.every(x => x && x.chiave && typeof x.crea === 'function')
  } catch (e) {
    console.warn(`  ${rel}: non si importa (${String(e.message).split('\n')[0]}), resta fuori`)
    return false
  }
}

/** Un modulo della roba è pronto se la sua copia si importa (in una cartella di prova sotto tmp/) e costruisce almeno una figura
 *  della sua famiglia: `crea(figura)`, o `vesti(eroe, figura)` su un eroe, o `crea(chiave)` per i consumabili (che hanno `CHIAVI`).
 *  Un modulo a metà resta fuori, e le sue figure ripiegano sulla base (roba3d.js). */
async function moduloPronto(rel) {
  const famiglia = basename(rel, '.js')
  const prova = resolve(RADICE, 'tmp/promuovi-prova', famiglia)
  try {
    const file = raccogli([rel])
    rmSync(prova, { recursive: true, force: true }); mkdirSync(prova, { recursive: true })
    for (const [r, t] of file) writeFileSync(resolve(prova, basename(r)), t)
    const figure3d = pathToFileURL(resolve(RADICE, 'src/giochi/sotterraneo/dati/figure3d.js')).href
    writeFileSync(resolve(prova, CATALOGO_ROBA), testoCatalogo(figure3d))
    const m = await import(pathToFileURL(resolve(prova, `${famiglia}.js`)).href + `?${Date.now()}`)
    const { FIGURE3D } = await import(figure3d)
    const figure = Object.entries(FIGURE3D).filter(([, f]) => f.famiglia === famiglia).map(([id, f]) => ({ id, ...f }))
    const prova1 = fn => { try { return !!fn() } catch (e) { return false } }
    if (Array.isArray(m.CHIAVI) && typeof m.crea === 'function') {
      if (!m.CHIAVI.some(k => prova1(() => m.crea(k).isObject3D))) throw new Error('non costruisce nessun consumabile')
    } else if (typeof m.vesti === 'function') {
      // l'eroe disegna la faccia su una tela: in Node ne basta una finta, per il tempo della prova
      const c2d = new Proxy({}, { get: (_, k) => (k === 'canvas' ? {} : () => ({ data: [] })), set: () => true })
      const prima = globalThis.document
      if (!prima) globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => c2d }) }
      try {
        const { creaEroe } = await import(pathToFileURL(resolve(RADICE, 'poc/eroi-3d/eroi.js')).href)
        if (!figure.some(f => prova1(() => typeof m.vesti(creaEroe('cavaliere'), f) === 'function'))) throw new Error('non veste nessuna figura')
      } finally { if (!prima) delete globalThis.document }
    } else if (typeof m.crea === 'function') {
      if (!figure.some(f => prova1(() => m.crea(f).isObject3D))) throw new Error('non costruisce nessuna figura')
    } else throw new Error('non esporta né crea né vesti')
    return true
  } catch (e) {
    console.warn(`  ${rel}: non è pronto (${String(e.message).split('\n')[0]}), resta fuori`)
    return false
  } finally {
    rmSync(prova, { recursive: true, force: true })
  }
}

function moduliDi(radici) {
  const ci = FAMIGLIE_ROBA.filter(f => radici.includes(`poc/roba-3d/${f}.js`))
  return `// ${SEGNO}: non si tocca a mano (\`npm run promuovi3d\`). I moduli 3D delle famiglie della roba che ci sono adesso; chi\n` +
    `// manca (${FAMIGLIE_ROBA.filter(f => !ci.includes(f)).join(', ') || 'nessuno'}) ripiega sulla base in roba3d.js (docs/sotterraneo/roba-3d.md).\n` +
    ci.map(f => `import * as ${f} from './${f}.js'`).join('\n') + (ci.length ? '\n\n' : '\n') +
    `export const MODULI = { ${ci.join(', ')} }\n`
}

function elenchiDi(gruppo, file) {
  const righe = [], voci = []
  for (const rel of file.keys()) {
    const v = gruppo.elenchi[basename(rel)]
    if (!v || !gruppo.radici.includes(rel)) continue
    righe.push(`import { ${v[1]} } from './${basename(rel)}'`)
    voci.push(`  ${v[0]}: ${v[1]},`)
  }
  const draghi = [...file.keys()].some(r => basename(r) === 'draghi.js')
  if (draghi) righe.push(`import { creaDragoGrande, COLORI as COLORI_DRAGHI } from './draghi.js'`)
  return `// ${SEGNO}: non si tocca a mano (\`npm run promuovi3d\`). Gli elenchi dei mostri 3D che ci sono adesso, per zona; il drago\n` +
    `// grande nei suoi colori. Il registro (registro.js) li legge da qui: una zona che manca resta allo sprite.\n` +
    righe.join('\n') + '\n\nexport const ELENCHI = {\n' + voci.join('\n') + '\n' +
    (draghi ? `  draghi: Object.keys(COLORI_DRAGHI).map(c => ({ chiave: c, nome: \`Drago grande \${c}\`, crea: () => creaDragoGrande(c) })),\n` : '') + '}\n'
}

export async function promuovi({ scrivi = true } = {}) {
  const diversi = []
  for (const g of GRUPPI) {
    let radici = g.radici
    for (const f of g.facoltative || []) {
      const pronta = existsSync(resolve(RADICE, f)) && (g.moduli ? await moduloPronto(f) : await zonaPronta(f, g.elenchi))
      if (!pronta) radici = radici.filter(r => r !== f)
    }
    const file = raccogli(radici)
    const voluti = new Map([...file].map(([rel, testo]) => [basename(rel), testo]))
    if (g.elenchi) voluti.set('elenchi.js', elenchiDi({ ...g, radici }, file))
    if (g.moduli) voluti.set('moduli.js', moduliDi(radici))
    if ([...voluti.values()].some(t => t.includes(`'./${CATALOGO_ROBA}'`))) voluti.set(CATALOGO_ROBA, testoCatalogo('../../dati/figure3d.js'))
    const cartella = resolve(RADICE, g.dest)
    if (scrivi) mkdirSync(cartella, { recursive: true })
    for (const [nome, testo] of voluti) {
      const dove = resolve(cartella, nome)
      const ora = existsSync(dove) ? readFileSync(dove, 'utf8') : null
      if (ora === testo) continue
      diversi.push(`${g.dest}/${nome}`)
      if (scrivi) writeFileSync(dove, testo)
    }
    // i generati che non servono più (quelli scritti a mano, senza il segno, restano)
    if (existsSync(cartella)) for (const nome of readdirSync(cartella)) {
      if (!nome.endsWith('.js') || voluti.has(nome)) continue
      const dove = resolve(cartella, nome)
      if (!readFileSync(dove, 'utf8').slice(0, 200).includes(SEGNO)) continue
      diversi.push(`${g.dest}/${nome} (in più)`)
      if (scrivi) unlinkSync(dove)
    }
    console.log(`${g.nome}: ${voluti.size} file in ${g.dest}${radici.length < g.radici.length ? ` (fuori: ${g.radici.filter(r => !radici.includes(r)).join(', ')})` : ''}`)
  }
  return diversi
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const controlla = process.argv.includes('--controlla')
  const diversi = await promuovi({ scrivi: !controlla })
  if (diversi.length) console.log((controlla ? 'diversi dal prototipo:\n  ' : 'riscritti:\n  ') + diversi.join('\n  '))
  else console.log('tutto come i prototipi')
  if (controlla && diversi.length) process.exit(1)
}
