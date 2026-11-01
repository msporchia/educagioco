#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   LE IMMAGINI GENERATE CHE NESSUN GIOCO USA — `npm run sprite:inutilizzati`

   La regola dell'utente: niente «oggetti non utilizzati nel gioco ma già
   generati». Ogni pezzo o è un doppione (e si elimina), o si usa. Questo
   è il rapporto che dice quali pezzi sono oggi nel mezzo. Non cambia
   niente e non è un cancello: un test lo guarda solo per sapere che gira.

   Cosa elenca (docs/core/sprite.md, «Gli inutilizzati»):
     1 immagini   i file di `sorgenti/` che nessun foglietto, nessuno
                  strumento e nessun catalogo legge (anche quelli già
                  parcheggiati in `non-usati/`), e quelli che servono solo
                  da allegato ai prompt
     2 ritagliate le voci dell'atlante di un gioco (fattoria, sotterraneo)
                  che nessun file di `src/` nomina (la fattoria: i pezzi
                  che nessuno disegna, dall'elenco esatto `VIVI`); le figure dei fogli
                  della roba del sotterraneo (`roba.json`) che nessun
                  foglietto ritaglia e nessun pezzo veste; le creature
                  del catalogo che nessun gioco disegna
     3 descritte  dove esiste un elenco dipinto-per-dipinto (`roba.json`,
                  `creature.json`): le figure mai ritagliate
     4 pixel      (con --pixel, chiama `non-ritagliato.py`) per ogni foglio
                  con un foglietto, le macchie di colore che nessun
                  rettangolo copre: figure dipinte mai ritagliate

   Uso:
     npm run sprite:inutilizzati                  il rapporto in tabella
     npm run sprite:inutilizzati -- --pixel       ...con le macchie fuori dai ritagli (Python + pillow)
     npm run sprite:inutilizzati -- --pixel --provino   ...e i fogli da guardare in tmp/inutilizzati/
     npm run sprite:inutilizzati -- --json        il rapporto come JSON
     npm run sprite:inutilizzati -- --gioco=fattoria    una cartella sola

   «Nominata» è una euristica, non una prova: un nome compare in `src/`
   (commenti esclusi) come parola intera, oppure combacia con un modello
   (`recinto_${specie}_${stato}`) le cui parti variabili sono parole che
   compaiono. Sbaglia in due modi, e il rapporto li tiene separati: un
   nome composto a runtime in un modo che nessuno scrive per intero
   (falso «inutilizzato»), e un nome che compare solo come parola in una
   frase (falso «nominato»). Per questo ogni voce va guardata prima di
   toglierla.
   ═══════════════════════════════════════════════════════════════════ */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const SORGENTI = path.join(RADICE, 'strumenti/sprite/sorgenti')
const ESTENSIONI = /\.(png|jpe?g|webp)$/i
const GIOCHI_ATLANTE = ['sotterraneo', 'fattoria']
/* dove sta l'atlante di ciascun gioco (quello della fattoria è comune, sta in `grafica/`) */
const ATLANTE_DI = { sotterraneo: 'src/giochi/sotterraneo/dati/atlante.js', fattoria: 'src/grafica/atlante-fattoria.js' }
export const moduloAtlante = gioco => ATLANTE_DI[gioco]

const rel = p => path.relative(RADICE, p)
const leggi = p => fs.readFileSync(p, 'utf8')
function cammina(dir, filtro = () => true) {
  const fuori = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist' || e.name === 'tmp') continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) fuori.push(...cammina(p, filtro))
    else if (filtro(p)) fuori.push(p)
  }
  return fuori.sort()
}
function json(p) { try { return JSON.parse(leggi(p)) } catch { return null } }

/* ── togliere i commenti, per non contare le menzioni ── */
const senzaCommentiPy = t => t
  .replace(/("""|''')[\s\S]*?\1/g, ' ')
  .replace(/(^|[ \t])#.*$/gm, '$1')
const senzaCommentiJs = t => t
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[ \t(,;{}])\/\/.*$/gm, '$1')
  .replace(/<!--[\s\S]*?-->/g, ' ')

/* ═══════════ 1 · le immagini ═══════════ */

/* un glob (`torri-[0-9]*.png`) in espressione regolare */
function globInRegex(g) {
  let r = ''
  for (let i = 0; i < g.length; i++) {
    const c = g[i]
    if (c === '*') r += '.*'
    else if (c === '?') r += '.'
    else if (c === '[') { const f = g.indexOf(']', i); r += g.slice(i, f + 1); i = f }
    else r += c.replace(/[.+^${}()|\\]/g, '\\$&')
  }
  return new RegExp('^' + r + '$', 'i')
}

/* I nomi di immagine che gli strumenti nominano **nel codice** (commenti e
   docstring esclusi), come modelli: `f'terreno-{vestito}.png'` diventa
   `terreno-*.png`. Un modello fatto di soli jolly non conta. */
function lettoriNegliStrumenti() {
  const fuori = []
  const file = cammina(path.join(RADICE, 'strumenti'), p => /\.(py|mjs|js)$/.test(p) && !p.endsWith('inutilizzati.mjs'))
  for (const f of file) {
    const t = leggi(f)
    const codice = f.endsWith('.py') ? senzaCommentiPy(t) : senzaCommentiJs(t)
    for (const m of codice.matchAll(/(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g)) {
      let s = m[2].replace(/\$?\{[^}]*\}/g, '*')
      if (!/^[\w\-.*\[\]()<>? ]+$/.test(s)) continue
      if (!(ESTENSIONI.test(s) || (/\*/.test(s) && /\.\*$|\.\w+$/.test(s)))) continue
      if (s.replace(/[*?\[\]]/g, '').replace(ESTENSIONI, '').length < 4) continue
      fuori.push({ modello: globInRegex(s), testo: s, file: rel(f) })
    }
  }
  return fuori
}

/* ogni stringa di un foglietto (chiavi e valori), tranne le note e i prompt: servono a dire
   «questo foglio lo nomina un foglietto» */
function stringheDiUnFoglietto(v, fuori = new Set(), chiave = '') {
  if (chiave === 'prompt' || chiave.startsWith('__') || chiave === '_') return fuori
  if (typeof v === 'string') fuori.add(v)
  else if (Array.isArray(v)) v.forEach(x => stringheDiUnFoglietto(x, fuori, ''))
  else if (v && typeof v === 'object')
    for (const [k, x] of Object.entries(v)) {
      if (!(k.startsWith('__') || k === '_' || k === 'prompt')) fuori.add(k)
      stringheDiUnFoglietto(x, fuori, k)
    }
  return fuori
}

/* L'insieme dei file `.json` in `sorgenti/` che dichiarano davvero un ritaglio o un catalogo. */
const DICHIARA = ['sprite', 'ritagli', 'figure', 'passi', 'creature', 'isole', 'posti', 'pezzi', 'figure']
function foglietto(p) {
  const j = json(p)
  return j && DICHIARA.some(k => j[k] && Object.keys(j[k]).length) ? j : null
}

export function immagini() {
  const tutte = cammina(SORGENTI, p => ESTENSIONI.test(p))
  const jsons = cammina(SORGENTI, p => p.endsWith('.json'))
  const nomi = new Map()            // nome o radice citata da un foglietto → file .json
  for (const f of jsons) {
    const j = json(f)
    if (!j) continue
    for (const s of stringheDiUnFoglietto(j)) {
      const x = ESTENSIONI.test(s) ? path.basename(s) : s     // «generati/regno-2.png» → regno-2.png
      if (ESTENSIONI.test(x) || /^[\w-]+$/.test(x)) nomi.set(x.toLowerCase(), nomi.get(x.toLowerCase()) || rel(f))
    }
  }
  const strumenti = lettoriNegliStrumenti()
  const testiPrompt = cammina(SORGENTI, p => /PROMPT-.*\.md$/.test(p)).map(p => leggi(p)).join('\n')
    + jsons.map(f => { const j = json(f); return j ? JSON.stringify(j.prompt || {}) : '' }).join('\n')
  const catalogoCreature = json(path.join(SORGENTI, 'creature/creature.json')) || { fogli: {}, creature: {} }
  const fogliCreature = new Set(Object.keys(catalogoCreature.fogli || {}))
  const passiCreature = new Set(Object.keys(catalogoCreature.creature || {}))
  const copertine = leggiCopertineDipinte()

  const fuori = []
  for (const p of tutte) {
    const nome = path.basename(p), radice = nome.replace(ESTENSIONI, '')
    const cartella = path.dirname(p), gioco = path.relative(SORGENTI, p).split(path.sep)[0]
    // un set di terzi sta in una cartella col nome dell'autore (armm1998/, 0x72/), mai in generati/, non-usati/, passi/
    const sotto = path.relative(SORGENTI, cartella).split(path.sep)
    const terzi = sotto.length === 2 && !['generati', 'non-usati', 'non-usate', 'passi'].includes(sotto[1])
    const parcheggiata = path.basename(cartella) === 'non-usati' || path.basename(cartella) === 'non-usate'
    const lettaDa = []
    const accanto = ['.json'].map(e => path.join(cartella, radice + e)).find(q => fs.existsSync(q))
    if (accanto && foglietto(accanto)) lettaDa.push(`il foglietto ${nome.replace(ESTENSIONI, '.json')}`)
    const doJson = nomi.get(nome.toLowerCase())
    if (doJson && !lettaDa.length) lettaDa.push(`il foglietto ${doJson}`)
    // un glob di uno strumento non guarda dentro non-usati/: quello che sta lì non lo legge nessuno
    if (!parcheggiata) for (const s of strumenti) if (s.modello.test(nome)) { lettaDa.push(`${s.file} («${s.testo}»)`); break }
    if (cartella.endsWith(path.join('creature')) && fogliCreature.has(radice)) lettaDa.push('il catalogo creature')
    if (cartella.endsWith(path.join('creature', 'passi')) && passiCreature.has(radice)) lettaDa.push('i passi del catalogo creature')
    if (radice.startsWith('copertina-') && copertine.has(radice.slice('copertina-'.length))) lettaDa.push('copertine-dipinte.js')
    const allegata = testiPrompt.toLowerCase().includes(nome.toLowerCase())
    let stato
    if (/^PROMPT-/.test(nome)) stato = 'schema'               // lo scrive scenario.py, si allega ai prompt
    else if (lettaDa.length) stato = 'letta'
    else if (terzi) stato = 'terzi'
    else if (allegata) stato = 'allegato'
    else stato = 'nessuno'
    fuori.push({ percorso: rel(p), gioco, nome, stato, parcheggiata, lettaDa: lettaDa[0] || null, byte: fs.statSync(p).size })
  }
  return fuori
}

function leggiCopertineDipinte() {
  const p = path.join(RADICE, 'src/components/home/copertine-dipinte.js')
  const chiavi = new Set()
  if (fs.existsSync(p)) for (const m of leggi(p).matchAll(/(?:^|[\s,{])['"]?([a-z0-9-]+)['"]?\s*:\s*(?:\{|\[|['"`]data:)/g)) chiavi.add(m[1])
  return chiavi
}

/* ═══════════ 2 · le voci dell'atlante che nessuno nomina ═══════════ */

/* Le parole di `src/` (commenti esclusi, file generati esclusi tranne `aspetti.js`, che è generato
   ma è la lista delle figure che il gioco veste) e i modelli dei nomi composti. */
export function paroleDelGioco() {
  const parole = new Set(), modelli = []
  const file = cammina(path.join(RADICE, 'src'), p => /\.(js|vue|mjs)$/.test(p))
  for (const f of file) {
    const t = leggi(f)
    if (/GENERATO/.test(t.slice(0, 600)) && !f.endsWith('aspetti.js')) continue
    const codice = senzaCommentiJs(t)
    for (const m of codice.match(/[A-Za-z0-9_-]+/g) || []) parole.add(m)
    for (const m of codice.matchAll(/(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g)) {
      const s = m[2]
      if (!/\$\{/.test(s) || s.length > 90) continue
      const pezzi = s.split(/(?:\$\{[^}]*\})+/)           // buchi attaccati valgono un buco solo
      const fisso = pezzi.join('').replace(/\s/g, '')
      if (fisso.length < 3) continue
      modelli.push({ re: new RegExp('^' + pezzi.map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('(.+?)') + '$'), testo: s, file: rel(f) })
    }
    // 'abc_' + x   o   'abc-' + x
    for (const m of codice.matchAll(/(['"])([\w-]*[_-])\1\s*\+/g))
      modelli.push({ re: new RegExp('^' + m[2].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(.+)$'), testo: `${m[2]}…`, file: rel(f) })
  }
  return { parole, modelli }
}

/* Un nome è nominato se: è una parola; oppure (senza le cifre in coda) lo è; oppure combacia con un
   modello le cui parti variabili sono fatte di parole che compaiono. Dice anche come. */
export function nominatoDa(nome, { parole, modelli }) {
  if (parole.has(nome)) return 'parola'
  const stelo = nome.replace(/[-_]?\d+$/, '')
  if (stelo !== nome && parole.has(stelo)) return 'parola'
  for (const m of modelli) {
    const c = m.re.exec(nome) || m.re.exec(stelo)
    if (!c) continue
    const parti = c.slice(1).flatMap(x => x.replace(/\d+$/, '').split(/[_-]/)).filter(Boolean)
    if (parti.every(x => parole.has(x))) return `modello ${m.testo} (${m.file})`
  }
  return null
}

/* Dove l'elenco non si indovina: chi disegna dall'atlante di quel gioco dice quali pezzi prende, e il resto non serve.
   L'atlante della fattoria tiene solo questi (docs/core/sprite.md). */
const importa = f => import(pathToFileURL(path.join(RADICE, f)).href)
export const VIVI = {
  fattoria: async A => [
    ...A.PERSONE.map(p => `${p}_giu0`),                                                       // components/SceltaAspetto.vue: un fotogramma fermo
    ...(await importa('src/giochi/passo-passo/scena/tela.js')).DALL_ATLANTE,                  // Passo passo
    ...(await importa('src/giochi/fattoria3d/dati/ricette.js')).facceDelleMerci(),            // fattoria3d: viste/Faccia.vue, scena3d/facce.js
  ],
  // il sotterraneo disegna dall'atlante solo nella scena 3D (scena3d/figure.js) e dove una cosa non ha un modello (viste/figura.js):
  // ogni nome che le sue tabelle possono chiedere, e di ogni cosa tutte le pose (docs/core/sprite.md, «Gli inutilizzati»)
  sotterraneo: async A => {
    const D = f => importa(`src/giochi/sotterraneo/${f}`)
    const { SCENARI, SOGLIE_DELLE_GEMME, pezziDelloScenario, PEZZO_DI } = await D('dati/tessere.js')
    const { NICCHIE } = await D('dati/orpelli.js')
    const { pezziDeiRelitti } = await D('dati/relitti.js')
    const { COSE, chiaveDelPezzo } = await D('dati/cose.js')
    const { haModelloPerTerra } = await D('scena3d/per-terra-pura.js')
    const { ASPETTI } = await D('dati/aspetti.js')
    const { SPRITE_FIGURA } = await D('dati/figure3d.js')
    const { UNICI } = await D('dati/pezzi.js')
    const { CURIOSITA } = await D('dati/curiosita.js')
    const { SCALA_SU } = await D('scena/scala-su.js')
    const { BESTIARIO } = await importa('src/giochi/survivors/scena/figure.js')
    const nomi = [
      ...Object.values(SCENARI).flatMap(pezziDelloScenario),                                  // scena3d/cose.js: porte, scale, forzieri, arredo
      ...Object.values(NICCHIE).flat(), ...pezziDeiRelitti(), SCALA_SU,                       // le nicchie, i relitti col pezzo, la scala che sale
      ...SOGLIE_DELLE_GEMME.map(([, n]) => n), 'moneta-0',                                    // pezzoDelleGemme
      PEZZO_DI.forziere({ aperto: true }), PEZZO_DI.forziere({}), 'forziere-oro-chiuso',      // il forziere aperto, quello dei salvataggi vecchi, il d'oro
      ...Object.entries(COSE).filter(([k]) => !haModelloPerTerra(k)).map(([, c]) => c.sprite),   // per terra senza modello (roba-per-terra.js), nei pannelli senza chiave
      // le figure della roba: il loro ritaglio è anche quello che dice che la figura c'è (roba.py `in_gioco`, figure3d.js `SPRITE_FIGURA`),
      // e lo sprite resta per terra a chi non ha un modello
      ...Object.values(ASPETTI).flat().map(a => a.sprite), ...Object.keys(SPRITE_FIGURA),
      ...Object.entries(UNICI).map(([id, u]) => (COSE[chiaveDelPezzo(u.base, 1, u.rarita || 'leggendario', [], id)] || {}).sprite),
      ...CURIOSITA.map(c => c.pezzo),                                                         // per terra e nel foglio che si apre (viste/Foglio.vue)
      // mostri, grossi, eroi e persone di sopra non hanno sprite: il modello, o la sua sagoma (docs/sotterraneo/sagome-3d.md)
      'cavaliere-fermo-0',                                                                    // il castello (components/castello/Regno.vue)
      ...Object.values(BESTIARIO).flatMap(b => Object.values(b)).filter(n => n.startsWith('sot:')).map(n => `${n.slice(4)}-fermo-0`),   // Survivors
    ].filter(Boolean)
    // di ogni cosa tutte le pose e tutti i fotogrammi
    const voce = new Map(A.VOCI.flatMap(v => Object.values(v.pose).flat().map(n => [n, v])))
    return [...new Set(nomi.flatMap(n => (voce.has(n) ? Object.values(voce.get(n).pose).flat() : [n])))]
  },
}

/* I pezzi che il codice vivo disegna (`vivi`) e i nomi vivi che l'atlante non ha (`mancano`), o null se il gioco non ha `VIVI`. */
export async function pezziVivi(gioco) {
  if (!VIVI[gioco]) return null
  const A = await importa(ATLANTE_DI[gioco])
  const vivi = new Set(), mancano = []
  for (const n of await VIVI[gioco](A)) (A.PEZZI[n] ? vivi.add(n) : mancano.push(n))
  return { vivi, mancano }
}

export async function vociNonNominate(gioco, W = paroleDelGioco()) {
  const A = await import(pathToFileURL(path.join(RADICE, ATLANTE_DI[gioco])).href)
  const fuori = []
  const esatti = await pezziVivi(gioco)
  if (esatti) {
    // una voce è fuori per i pezzi che nessuno disegna, anche se un altro suo fotogramma serve
    for (const v of A.VOCI) {
      const tutti = Object.values(v.pose).flat(), morti = tutti.filter(n => !esatti.vivi.has(n))
      if (morti.length) fuori.push({ gioco, voce: v.id, famiglia: v.famiglia, foglio: v.da, pezzi: morti.length, morti: morti.length < tutti.length ? morti : null, riquadri: morti.map(n => A.PEZZI[n]) })
    }
    return { voci: A.VOCI.length, pezzi: Object.keys(A.PEZZI).length, vivi: esatti.vivi.size, mancano: esatti.mancano, nonNominate: fuori, atlante: A.ATLANTE }
  }
  for (const v of A.VOCI) {
    const pezzi = Object.values(v.pose).flat()
    const chi = [v.id, ...pezzi].find(n => nominatoDa(n, W))
    if (!chi) fuori.push({ gioco, voce: v.id, famiglia: v.famiglia, foglio: v.da, pezzi: pezzi.length, riquadri: pezzi.map(n => A.PEZZI[n]).filter(Boolean) })
  }
  return { voci: A.VOCI.length, nonNominate: fuori, atlante: A.ATLANTE }
}

/* le voci non nominate di un gioco, ritagliate dal suo atlante in un foglio da guardare (tmp/inutilizzati/) */
function provinoDelleVoci(gioco, v) {
  if (!v.nonNominate.length) return null
  const dir = path.join(RADICE, 'tmp/inutilizzati')
  fs.mkdirSync(dir, { recursive: true })
  const png = path.join(dir, `${gioco}-atlante.png`), elenco = path.join(dir, `${gioco}-voci.json`), fuori = path.join(dir, `${gioco}-voci-inutilizzate.png`)
  fs.writeFileSync(png, Buffer.from(v.atlante.replace(/^data:image\/png;base64,/, ''), 'base64'))
  fs.writeFileSync(elenco, JSON.stringify(v.nonNominate.map(x => ({ voce: x.voce, foglio: x.foglio, pezzi: x.riquadri }))))
  const r = spawnSync('python3', [path.join(RADICE, 'strumenti/sprite/non-ritagliato.py'), '--voci', elenco, '--atlante', png, '--dove', fuori], { encoding: 'utf8' })
  return r.status === 0 ? rel(fuori) : null
}

/* ── i fogli della roba del sotterraneo: roba.json contro i foglietti (come `in_gioco` di roba.py) ── */
export function figureDellaRoba() {
  const dir = path.join(SORGENTI, 'sotterraneo/generati')
  const figure = json(path.join(dir, 'roba.json')).figure
  const ids = new Set(figure.map(v => v.id))
  const tagli = {}
  for (const v of figure) {
    if (tagli[v.foglio]) continue
    const fg = json(path.join(dir, v.foglio.replace(/\.png$/, '.json')))
    const s = fg.scala || 1
    tagli[v.foglio] = Object.entries(fg.sprite)
      .filter(([k, p]) => p && p.da && !ids.has(k))
      .map(([k, p]) => [k, (p.da[0] + p.cella[0] / 2) * s, (p.da[1] + p.cella[1] / 2) * s])
  }
  const fuori = []
  let inGioco = 0
  for (const v of figure) {
    const [x, y, w, h] = v.rettangolo
    const ritagliata = tagli[v.foglio].find(([, cx, cy]) => x <= cx && cx <= x + w && y <= cy && cy <= y + h)
    if (ritagliata || v.pezzo) { inGioco++; continue }
    fuori.push({ id: v.id, foglio: v.foglio, cosa: v.cosa, elemento: v.elemento, stile: v.stile, pregio: v.pregio,
                 nome: v.nome, dubbi: v.dubbi || null, descrizione: v.descrizione, rettangolo: v.rettangolo })
  }
  return { totale: figure.length, inGioco, fuori }
}

/* ── le creature del catalogo che nessun gioco disegna, e i fotogrammi che nessuno prende ── */
export function creatureSenzaGioco() {
  const cat = json(path.join(SORGENTI, 'creature/creature.json'))
  const fuori = []
  for (const [k, v] of Object.entries(cat.creature)) {
    if (!(v.giochi || []).length)
      fuori.push({ creatura: k, foglio: v.foglio, fotogrammi: v.fotogrammi.length, tenuta: v.tenuta !== false,
                   perche: v.perche || null, che: (v.scheda || {}).che || null })
  }
  const parziali = []
  for (const [k, v] of Object.entries(cat.creature))
    for (const [g, scelta] of Object.entries(v.scelta || {}))
      if ((v.giochi || []).includes(g) && scelta.length < v.fotogrammi.length)
        parziali.push({ creatura: k, gioco: g, presi: scelta.length, di: v.fotogrammi.length })
  return { totale: Object.keys(cat.creature).length, fuori, parziali }
}

/* ═══════════ il rapporto ═══════════ */

export async function inventario({ pixel = false, provino = false, gioco = null } = {}) {
  const W = paroleDelGioco()
  const img = immagini().filter(i => !gioco || i.gioco === gioco)
  const voci = {}
  for (const g of GIOCHI_ATLANTE) if (!gioco || gioco === g) voci[g] = await vociNonNominate(g, W)
  const rapporto = { immagini: img, voci, roba: gioco && gioco !== 'sotterraneo' ? null : figureDellaRoba(), creature: gioco && gioco !== 'sotterraneo' && gioco !== 'castello' ? null : creatureSenzaGioco() }
  if (provino) for (const [g, v] of Object.entries(voci)) v.provino = provinoDelleVoci(g, v)
  for (const v of Object.values(voci)) delete v.atlante           // 2 MB di base64 non vanno nel rapporto
  if (pixel) rapporto.pixel = macchieFuoriDaiRitagli({ provino, gioco })
  return rapporto
}

function macchieFuoriDaiRitagli({ provino, gioco }) {
  const args = [path.join(RADICE, 'strumenti/sprite/non-ritagliato.py'), '--json']
  if (provino) args.push('--provino')
  if (gioco) args.push(`--gioco=${gioco}`)
  const r = spawnSync('python3', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  if (r.status !== 0) { process.stderr.write(r.stderr || ''); return { errore: 'non-ritagliato.py non è partito (serve python3 con pillow)' } }
  return JSON.parse(r.stdout)
}

const kb = n => n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`
const STATI = {
  nessuno: 'NESSUNO LA LEGGE',
  allegato: 'solo allegato ai prompt',
  schema: 'schema da allegare (scenario.py)',
  terzi: 'set di terzi non usato (il nome non si tocca)',
  letta: 'letta',
}

function stampa(r) {
  const per = {}
  for (const i of r.immagini) (per[i.gioco] ||= []).push(i)
  console.log('═══ 1 · IMMAGINI SORGENTI ═══')
  for (const [g, lista] of Object.entries(per)) {
    const nessuno = lista.filter(i => i.stato === 'nessuno')
    const altri = lista.filter(i => ['allegato', 'terzi'].includes(i.stato))
    console.log(`\n${g}: ${lista.length} immagini, ${lista.filter(i => i.stato === 'letta').length} lette, ${nessuno.length} che nessuno legge (${kb(nessuno.reduce((a, i) => a + i.byte, 0))})`)
    for (const i of nessuno) console.log(`  ✗ ${i.percorso}  ${kb(i.byte)}${i.parcheggiata ? '  (già in non-usati/)' : ''}`)
    for (const i of altri) console.log(`  · ${i.percorso}  ${kb(i.byte)}  — ${STATI[i.stato]}`)
    // lette solo da uno strumento (un nome nel codice, non un foglietto): un file letto solo da uno strumento (td_1.png in vesti.py) sta qui
    for (const i of lista.filter(i => i.stato === 'letta' && i.lettaDa && /^strumenti\/sprite\/[\w-]+\.(py|mjs)/.test(i.lettaDa) && !/^PROMPT-/.test(i.nome)))
      console.log(`  ? ${i.percorso}  — letta solo da ${i.lettaDa}: controllare che serva`)
  }
  console.log('\n═══ 2 · VOCI DELL\'ATLANTE CHE NESSUN FILE DI src/ NOMINA ═══')
  for (const [g, v] of Object.entries(r.voci)) {
    if (v.vivi != null) {
      console.log(`\n${g}: ${v.pezzi - v.vivi} pezzi su ${v.pezzi} che nessuno disegna (${v.voci} voci; l'elenco esatto è VIVI)`)
      if (v.mancano.length) console.log(`  ✗ disegnati e assenti dall'atlante: ${v.mancano.join(' ')}`)
    } else console.log(`\n${g}: ${v.nonNominate.length} voci su ${v.voci}`)
    const per = {}
    for (const x of v.nonNominate) (per[x.foglio] ||= []).push(x.morti ? `${x.voce}(${x.pezzi} pezzi)` : x.voce)
    for (const [f, l] of Object.entries(per)) console.log(`  ${f}: ${l.join(' ')}`)
    if (v.provino) console.log(`  → ${v.provino}`)
  }
  if (r.roba) {
    console.log(`\n═══ 3 · LA ROBA DEL SOTTERRANEO (roba.json): ${r.roba.fuori.length} figure su ${r.roba.totale} che nessuno ritaglia né veste ═══`)
    for (const f of r.roba.fuori) console.log(`  ${f.id.padEnd(12)} ${f.foglio.padEnd(22)} ${f.cosa}${f.dubbi ? ` — ${f.dubbi}` : ''}`)
  }
  if (r.creature) {
    console.log(`\n═══ 4 · CREATURE DEL CATALOGO: ${r.creature.fuori.length} su ${r.creature.totale} senza nessun gioco ═══`)
    for (const c of r.creature.fuori) console.log(`  ${c.creatura.padEnd(18)} ${c.foglio} ${c.fotogrammi} fotogrammi${c.tenuta ? '' : ' (scartata)'} — ${c.perche || c.che || ''}`)
    if (r.creature.parziali.length) console.log(`  fotogrammi lasciati fuori da un gioco: ${r.creature.parziali.map(p => `${p.creatura}/${p.gioco} ${p.presi}/${p.di}`).join(', ')}`)
  }
  if (r.pixel) {
    console.log('\n═══ 5 · MACCHIE DEI FOGLI CHE NESSUN RITAGLIO COPRE ═══')
    if (r.pixel.errore) console.log(`  ${r.pixel.errore}`)
    else for (const f of r.pixel.fogli) console.log(`  ${f.foglio}: ${f.macchie.length} macchie, ${f.quota}% del colore fuori dai ritagli`)
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = n => (process.argv.find(a => a.startsWith(`--${n}=`)) || '').split('=')[1] || null
  const r = await inventario({ pixel: process.argv.includes('--pixel'), provino: process.argv.includes('--provino'), gioco: arg('gioco') })
  if (process.argv.includes('--json')) console.log(JSON.stringify(r, null, 1))
  else stampa(r)
}
