/* ═══════════════════════════════════════════════════════════════════
   PROVARE I PIANI DI UN LIVELLO — il banco di chi lo sta scrivendo

   Il banco di prova (`test/aiuto/livello.mjs`) dice se le soluzioni
   dichiarate reggono. Qui si fa il lavoro di prima: **giocare tanti
   piani plausibili** e guardare quali vincono e perché gli altri
   perdono. È così che si scopre se un livello ha una regola sola al
   millimetro o più strade sensate (`src/data/livelli/GUIDA.md`, §7).

     node strumenti/generale/piani.mjs <livello.js>
         gioca le soluzioni dichiarate nel livello
     node strumenti/generale/piani.mjs <livello.js> <piani.mjs>
         gioca i piani di un file (vedi sotto com'è fatto)
     … --mappa               la mappa con le coordinate, per scrivere
                             le caselle ('x,y') e contare i passi
     … --perche              per ogni piano perso, le ultime righe del
                             registro: chi ha fatto cosa, e chi ha preso chi
     … --traccia [nome]      battito per battito: dove sta ognuno, chi
                             cade, che rumori partono (solo i piani il
                             cui nome contiene [nome], se c'è)
     … --solo [nome]         gioca solo i piani il cui nome contiene [nome]
     … --zitto               niente riga per piano: solo il riassunto
     … --scena N             gioca la variante N (di serie la prima)
     … --confronta NOME=a,b  gioca gli stessi piani due volte, con la
                             manopola `process.env.NOME` a `a` e a `b`
                             (la bozza la legge, vedi sotto), e stampa solo
                             i piani che cambiano esito: è il modo di
                             sapere se un'abitudine conta davvero

   Un `quando senti` interrompe quello che il personaggio sta facendo
   (§2.5 della guida), ma se lo stesso ascolto sta ancora girando il
   segnale nuovo non lo fa ripartire: va perso. Il piano perso lo dice:
   «⚠ segnale perso: la ladra ha sentito «il mestolo» al battito 30, ma
   quel suo ascolto stava ancora girando». È la causa più facile da non
   vedere.

   Il file dei piani esporta di default una lista `[{ nome, piano,
   famiglia? }]`, oppure una funzione che la costruisce — è il modo di
   provare una griglia intera. Chi dà una `famiglia` ai piani trova in
   fondo il riassunto per famiglia: quanti vincono, in quanti battiti, e
   per colpa di chi perdono gli altri.

       export default ({ fai, se }) => {
         const piani = []
         for (const dove of ['sala', '3,8', '10,8'])
           piani.push({ nome: `chiama da ${dove}`, famiglia: 'chiamata',
                        piano: { principessa: [fai.vai(dove), fai.suona('chiamata')] } })
         return piani
       }

   Una bozza di livello può leggere `process.env` per provare le sue
   varianti dalla riga di comando senza farne una copia per ognuna:
   `const SOSTA = Number(process.env.SOSTA || 3)`, e poi
   `SOSTA=5 node strumenti/generale/piani.mjs bozza.js piani.mjs --zitto`.
   ═══════════════════════════════════════════════════════════════════ */
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { creaMondo, avvia, passo, pianoCompleto, guaiDi } from '../../src/motore/generale.js'
import { Unita } from '../../src/motore/generale/unita.js'
import * as scrivi from '../../src/data/livelli/scrivi.js'

/* ── I SEGNALI PERSI ──
   Il motore non li scrive da nessuna parte: un `quando senti` che sta
   ancora girando non riparte per un segnale nuovo (`Unita.senti`, «già
   in ballo»). Qui si guarda da fuori, prima di passargli il messaggio,
   senza toccare niente di come va la partita. Le reazioni della scheda
   (`evento`) non si contano: quelle sono del livello. */
let corrente = null
const sentiVero = Unita.prototype.senti
Unita.prototype.senti = function (messaggio) {
  if (corrente)
    for (const a of this.ascoltatori)
      if (a.evento === undefined && a.riconosce(messaggio) && this.fili.includes(a.filo) && !a.filo.finito)
        corrente.persi.push({ passo: corrente.m.passi, chi: this.comeSiChiama,
                              seg: corrente.m.nomeDelSegnale(messaggio.segnale) })
  return sentiVero.call(this, messaggio)
}

const arg = process.argv.slice(2)
const eFile = a => a.endsWith('.js') || a.endsWith('.mjs')
const opzione = nome => {
  const i = arg.indexOf(nome)
  if (i < 0) return null
  const dopo = arg[i + 1]
  return dopo && !dopo.startsWith('--') && !eFile(dopo) ? dopo : true
}
const file = arg.filter(eFile)
if (!file.length || opzione('--help') || opzione('-h')) {
  const testa = (await import('node:fs')).readFileSync(new URL(import.meta.url), 'utf8')
  console.log(testa.slice(testa.indexOf('PROVARE'), testa.indexOf('═══', 100)).replace(/^ {3}/gm, ''))
  process.exit(file.length ? 0 : 1)
}
const carica = async (f, versione = '') => import(pathToFileURL(resolve(f)).href + versione)
const livelloDi = modulo => modulo.default || Object.values(modulo).find(v => v && v.scena && v.vince)
const liv = livelloDi(await carica(file[0]))
if (!liv) { console.log(`${file[0]}: non esporta un livello`); process.exit(1) }

const scena = Number(opzione('--scena')) || 0
const variante = (liv.varianti || [])[scena]
const clona = x => JSON.parse(JSON.stringify(x))

/* ── la mappa con le coordinate ──
   Due lettere per casella, e una sigla per cosa: le prime due lettere
   dell'id, e se sono già prese la prima con una cifra — `forno` e
   `fornoVecchio` erano tutti e due «fo», e la mappa diceva il falso. */
if (opzione('--mappa')) {
  const m = creaMondo(liv, variante)
  const sigle = new Map(), prese = new Set()
  const siglaDi = id => {
    if (sigle.has(id)) return sigle.get(id)
    let s = id.slice(0, 2).padEnd(2, '·')
    for (let k = 1; prese.has(s) && k < 10; k++) s = id[0] + k
    prese.add(s); sigle.set(id, s)
    return s
  }
  const chi = {}
  for (const u of m.unita) chi[`${u.x},${u.y}`] = u.id
  for (const [id, c] of Object.entries(m.cose))
    if (c && c.x != null && c.tipo !== 'unita' && !chi[`${c.x},${c.y}`]) chi[`${c.x},${c.y}`] = id
  /* il fuori resta vuoto, il muro e i mobili sono pieni: per il gioco
     sono la stessa cosa, ma è il fuori che dà la forma al posto */
  const fuori = new Set((m.campo && m.campo.vuoti) || [])
  const decine = Array.from({ length: m.w }, (_, x) => String(Math.floor(x / 10) || ' ')).join('  ')
  const unita = Array.from({ length: m.w }, (_, x) => String(x % 10)).join('  ')
  console.log(`    ${decine}\n    ${unita}`)
  for (let y = 0; y < m.h; y++) {
    const riga = []
    for (let x = 0; x < m.w; x++) {
      const c = m.celle[y][x]
      const qui = chi[`${x},${y}`]
      riga.push(qui ? siglaDi(qui) : c.porta ? '▯▯'
        : fuori.has(`${x},${y}`) ? '  ' : c.muro ? '██' : '··')
    }
    console.log(`${String(y).padStart(3)} ${riga.join(' ')}`)
  }
  console.log('\n' + Object.entries(chi).map(([p, id]) => `${siglaDi(id)}=${id} (${p})`).join(' · '))
  console.log('(una sola sigla per casella: chi sta sopra a un posto nasconde il posto)')
}

/* ── i piani da giocare ── */
let piani
if (file[1]) {
  const p = (await carica(file[1])).default
  piani = typeof p === 'function' ? p({ ...scrivi, liv }) : p
} else {
  piani = (liv.soluzioni || []).map(s => ({
    nome: s.nome + (s.fragile ? ' (fragile)' : '') + (s.lunga ? ' (lunga)' : ''), piano: s.piano }))
}
const solo = opzione('--solo')
if (typeof solo === 'string') piani = (piani || []).filter(p => p.nome.includes(solo))
if (!piani || !piani.length) {
  if (!opzione('--mappa')) console.log('nessun piano da giocare')
  process.exit(0)
}

/* ── PERCHÉ HA PERSO, IN UNA PAROLA ──
   Chi ha preso uno dei nostri si legge nel registro: l'ultima riga di
   uno del livello che fa qualcosa a chi è caduto («prende a mestolate la
   ladra», «abbatte la ladra»). Senza caduti si perde per stallo, per
   ordini finiti o per tempo, e lo dice già il motivo della partita. */
function causaDi (m, righe) {
  if (m.vinto) return 'vinta'
  const miei = m.unita.filter(u => u.fazione === m.mia)
  const caduti = miei.filter(u => !u.eInPiedi())
  for (const c of caduti) {
    const r = [...righe].reverse().find(r => r.unita !== c.id && r.fazione !== m.mia &&
      String(r.fatto || r.testo || '').endsWith(c.comeSiChiama))
    if (r) return `presa da ${m.perId[r.unita] ? m.perId[r.unita].comeSiChiama : r.unita}`
  }
  if (caduti.length) return 'caduta'
  const motivo = String(m.motivo || '')
  if (motivo.startsWith('Stallo')) return 'stallo'
  if (motivo.includes('ordini sono finiti')) return 'ordini finiti'
  if (motivo.toLowerCase().includes('tempo') || m.passi >= 300) return 'tempo scaduto'
  return motivo.split(/[.:—]/)[0] || 'persa'
}

const traccia = opzione('--traccia')
const perche = opzione('--perche')
const zitto = opzione('--zitto')

function gioca (livello, { nome, piano }, segui = false) {
  const m = creaMondo(livello, (livello.varianti || [])[scena])
  const guai = guaiDi(m, clona(piano))
  if (guai.length) return { rifiutato: guai[0].motivo }
  corrente = { m, persi: [] }
  avvia(m, pianoCompleto(m, clona(piano)))
  while (!m.finita && m.passi < 400) {
    passo(m)
    if (!segui) continue
    const dove = m.unita.map(u => `${u.id.slice(0, 5)}(${u.x},${u.y})${u.eInPiedi() ? '' : '✗'}`).join(' ')
    const rumori = m.allarmi.length ? '  🔊 ' + [...new Set(m.allarmi.map(a => a.seg))].join(', ') : ''
    console.log(`   ${String(m.passi).padStart(3)}  ${dove}${rumori}`)
  }
  const persi = corrente.persi
  corrente = null
  const righe = (m.partita && m.partita.registro && m.partita.registro.righe) || []
  return { m, righe, persi, causa: causaDi(m, righe) }
}

/* ── IL CONFRONTO ──
   Stessi piani, la manopola della bozza in due posizioni: si stampano
   solo i piani che cambiano esito. Il livello si ricarica con un
   `?versione` diversa, se no `import` restituirebbe quello di prima. */
const confronta = opzione('--confronta')
if (typeof confronta === 'string') {
  const [nomeVar, valori] = confronta.split('=')
  const [a, b] = (valori || '').split(',')
  const esiti = {}
  for (const v of [a, b]) {
    process.env[nomeVar] = v
    const l = livelloDi(await carica(file[0], `?${nomeVar}=${encodeURIComponent(v)}`))
    esiti[v] = piani.map(p => gioca(l, p))
  }
  let cambiano = 0
  const dire = e => e.rifiutato ? `⛔ ${e.rifiutato}` : e.m.vinto ? `✅ ${e.m.passi}` : `❌ ${e.causa}`
  piani.forEach((p, i) => {
    const [ea, eb] = [esiti[a][i], esiti[b][i]]
    if (dire(ea) === dire(eb)) return
    cambiano++
    if (!zitto) console.log(`${p.nome}: ${nomeVar}=${a} → ${dire(ea)} · ${nomeVar}=${b} → ${dire(eb)}`)
  })
  console.log(`\n${nomeVar}=${a} contro ${nomeVar}=${b}: cambiano ${cambiano} piani su ${piani.length}`)
  process.exit(0)
}

const famiglie = new Map()
let vinte = 0
for (const { nome, piano, famiglia } of piani) {
  const segui = traccia === true || (typeof traccia === 'string' && nome.includes(traccia))
  const esito = gioca(liv, { nome, piano }, segui)
  if (esito.rifiutato) { console.log(`⛔ ${nome} — rifiutato: ${esito.rifiutato}`); continue }
  const { m, righe, persi, causa } = esito
  if (m.vinto) vinte++
  if (!zitto) {
    console.log(`${m.vinto ? '✅' : '❌'} ${nome} — ${m.passi} battiti — ${m.vinto ? m.motivo : causa + ': ' + (m.motivo || '')}`)
    if (!m.vinto)
      for (const x of persi.slice(0, 2))
        console.log(`     ⚠ segnale perso: ${x.chi} ha sentito «${x.seg}» al battito ${x.passo}, ma quel suo ascolto stava ancora girando`)
    if (perche && !m.vinto)
      for (const r of righe.slice(-4))
        console.log(`     ↳ ${String(r.passo).padStart(3)} ${m.perId[r.unita] ? m.perId[r.unita].comeSiChiama : r.unita}: ${r.fatto || r.testo}${r.n > 1 ? ` (×${r.n})` : ''}`)
  }
  if (famiglia) {
    const f = famiglie.get(famiglia) || { tot: 0, vinte: 0, min: Infinity, max: 0, cause: {} }
    f.tot++
    if (m.vinto) { f.vinte++; f.min = Math.min(f.min, m.passi); f.max = Math.max(f.max, m.passi) }
    else f.cause[causa] = (f.cause[causa] || 0) + 1
    famiglie.set(famiglia, f)
  }
}
if (famiglie.size) {
  console.log('\n── per famiglia ──')
  for (const [nome, f] of famiglie) {
    const battiti = f.vinte ? `, in ${f.min}–${f.max} battiti` : ''
    const cause = Object.entries(f.cause).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c} ${n}`).join(', ')
    console.log(`${nome}: ${f.vinte} su ${f.tot} vincono${battiti}${cause ? ' · perse: ' + cause : ''}`)
  }
}
console.log(`\n${vinte} su ${piani.length} vincono`)
