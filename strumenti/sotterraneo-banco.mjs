// Il banco del sotterraneo da riga di comando: il giocatore finto (src/giochi/sotterraneo/motore/banco.js) gioca le discese
// senza schermo, su più processi, e si legge quante se ne vincono rispondendo bene 8, 6 e 4 volte su 10. È lo strumento con
// cui si tara l'equilibrio (docs/sotterraneo/scontro-bilancio.md): le stesse misure di `misure/sotterraneo`, ma a scelta e in
// qualche secondo invece di sei minuti.
//
//   npm run sotterraneo                          # la storia: le sette discese, i quattro eroi, roba e livello attesi
//   npm run sotterraneo -- --semi 20             # venti partite per cella (di difetto 10)
//   npm run sotterraneo -- --scarti 0,-1,2       # anche con la roba di una discesa prima e di due avanti
//   npm run sotterraneo -- --livelli -2,3        # anche con l'eroe due livelli sotto e tre sopra
//   npm run sotterraneo -- --eroi mago,nano --discese 2,3   # solo quelli (le discese sono gli indici, 0 è la cripta)
//   npm run sotterraneo -- --come tutto          # chi gira tutto, non chi va dritto alla scala
//   npm run sotterraneo -- --bravure 0.8,0.4     # altre percentuali di risposte giuste
//   npm run sotterraneo -- --diag                # com'è fatta una discesa: domande, svenimenti, pozioni, vita a fine scontro, abilità
//   npm run sotterraneo -- --zone 12,16,20,30    # le zone a quei livelli (--eroe-a 11,12,.. se l'eroe ha un altro livello)
//   npm run sotterraneo -- --vere                # la storia giocata davvero, discesa dopo discesa, con la spesa (--fila tutto)
//   npm run sotterraneo -- --forza 1,5,12,20,30  # la forza dell'eroe atteso a quei livelli, per eroe (deve valere il livello)
//   npm run sotterraneo -- --forza 6,7,8,9,10,11,12 --rapporti   # il suo rapporto (le gobbe che fanno sbagliare la forza)
//   npm run sotterraneo -- --senza-abilita       # il banco di prima: solo attacco, nessun albero
//   npm run sotterraneo -- --contro <commit>     # le stesse misure sul commit, e «prima → dopo» nelle celle
//
// `--contro` prepara da sé un `git worktree` in tmp/ sul commit chiesto, lo misura con questo stesso strumento (le cose che il
// commit non ha, come l'interruttore delle abilità, si ignorano) e lo toglie. `--processi N` limita i processi (di difetto
// quanti i core meno due). Le partite hanno semi fissi: due giri danno le stesse cifre.
import { spawn, execFileSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve, join } from 'node:path'
import { availableParallelism } from 'node:os'
import { existsSync, rmSync } from 'node:fs'

const QUI = fileURLToPath(import.meta.url)
const RADICE = resolve(dirname(QUI), '..')
const EROI = ['cavaliere', 'elfa', 'mago', 'nano']
const SRC = 'src/giochi/sotterraneo/'

const argv = process.argv.slice(2)
const valore = (nome, difetto = null) => { const i = argv.indexOf(nome); return i >= 0 ? argv[i + 1] : difetto }
const numeri = (nome, difetto) => (valore(nome) != null ? valore(nome).split(',').map(Number) : difetto)

/* ═══════════ il lavoratore: un pezzo di misura, in un processo a sé ═══════════ */
if (argv[0] === '--lavoro') {
  const lavoro = JSON.parse(argv[1])
  const mod = nome => import(pathToFileURL(join(lavoro.radice, SRC, nome)).href)
  const banco = await mod('motore/banco.js')
  if (lavoro.senzaAbilita && banco.BANCO) banco.BANCO.abilita = false
  let r
  if (lavoro.che === 'storia') r = banco.misuraLaStoria(lavoro.opz)
  else if (lavoro.che === 'zone') r = banco.misuraLeZone(lavoro.opz)
  else if (lavoro.che === 'vere') r = banco.misuraConLaRoba(lavoro.opz)
  else if (lavoro.che === 'diag') r = await diagnosi(lavoro.opz)
  console.log(JSON.stringify(r))

  // com'è una discesa giocata a una bravura: domande, svenimenti, pozioni bevute, vita a fine scontro, abilità e turni per scontro
  async function diagnosi({ eroe, k, bravura, semi }) {
    const { Corsa } = await mod('motore/corsa.js')
    const { CAMPAGNA } = await mod('dati/campagna.js')
    const { robaAttesa, crescitaAttesa } = await mod('motore/storia.js')
    let fini = 0, scontri = 0, pozioni = 0, abilita = 0, turni = 0
    const chiudi = Corsa.prototype.chiudi, usa = Corsa.prototype.usa, prepara = Corsa.prototype.prepara, risposta = Corsa.prototype.rispostaScontro
    Corsa.prototype.chiudi = function () { if (this.foglio && this.foglio.che === 'scontro') { fini += this.vita / this.vitaMax; scontri++ } return chiudi.apply(this, arguments) }
    Corsa.prototype.usa = function (i) { if (/pozione/.test(this.zaino[i] || '')) pozioni++; return usa.apply(this, arguments) }
    Corsa.prototype.prepara = function (id) { const ok = prepara.apply(this, arguments); if (ok && id) abilita++; return ok }
    Corsa.prototype.rispostaScontro = function () { turni++; return risposta.apply(this, arguments) }
    let vinte = 0, domande = 0, svenimenti = 0
    for (let s = 0; s < semi; s++) {
      const g = banco.gioca(CAMPAGNA[k], { seme: 7000 + s * 89 + k * 11, bravura, eroe, roba: robaAttesa(eroe, k), crescita: crescitaAttesa(eroe, k) })
      if (g.esito.vinta) vinte++
      domande += g.esito.domande
      svenimenti += g.esito.svenimenti
    }
    return { vinte, domande, svenimenti, pozioni, fini, scontri, abilita, turni, partite: semi }
  }
  process.exit(0)
}

/* ═══════════ il pool: lavori in parallelo ═══════════ */
const POSTI = Number(valore('--processi')) || Math.max(2, availableParallelism() - 2)
async function inParallelo(lavori) {
  const risultati = new Array(lavori.length)
  let prossimo = 0
  const uno = () => new Promise((ok, no) => {
    const i = prossimo++
    if (i >= lavori.length) return ok()
    const p = spawn('node', [QUI, '--lavoro', JSON.stringify(lavori[i])])
    let out = ''
    p.stdout.on('data', d => { out += d })
    p.stderr.on('data', d => process.stderr.write(d))
    p.on('close', codice => {
      if (codice) return no(new Error(`un lavoro è finito male (${codice}): ${JSON.stringify(lavori[i]).slice(0, 200)}`))
      risultati[i] = JSON.parse(out)
      uno().then(ok, no)
    })
  })
  await Promise.all(Array.from({ length: Math.min(POSTI, lavori.length) }, uno))
  return risultati
}

/* ═══════════ le misure: una radice di sorgenti (questa, o quella di un altro commit) → una tabella di celle ═══════════ */
const OPZ = {
  semi: Number(valore('--semi', 10)),
  eroi: valore('--eroi') ? valore('--eroi').split(',') : EROI,
  prove: numeri('--bravure', [0.8, 0.6, 0.4]),
  scarti: numeri('--scarti', [0]),
  livelli: numeri('--livelli', []),
  come: valore('--come', 'minimo'),
  zone: numeri('--zone', null),
  eroeA: numeri('--eroe-a', null),
  fila: valore('--fila', 'minimo'),
  senzaAbilita: argv.includes('--senza-abilita'),
}
const campagna = async radice => (await import(pathToFileURL(join(radice, SRC, 'dati/campagna.js')).href)).CAMPAGNA
const percento = (v, tot) => Math.round((v / tot) * 100)

// ogni misura torna { righe: [{ titolo, celle: [ numero in 0..100 | testo ] }], intestazione: [..] } per radice; il confronto le mette in colonna
async function misura(radice) {
  const CAMP = await campagna(radice)
  const discese = numeri('--discese', CAMP.map((_, k) => k))
  const nomi = discese.map(k => CAMP[k].chiave.slice(0, 7))
  const tabelle = []
  const base = { radice, senzaAbilita: OPZ.senzaAbilita }

  if (argv.includes('--forza')) {
    const { livelloDiForza, eroeAtteso, rapporto } = await import(pathToFileURL(join(radice, SRC, 'motore/forza.js')).href)
    const Ls = numeri('--forza', [1, 5, 12, 20, 30])
    // `--dettagli`: com'è fatto l'eroe atteso (arma, scudo, abilità forti, danno, vita): perché il suo rapporto fa gobbe
    if (argv.includes('--dettagli')) {
      const righe = []
      for (const e of OPZ.eroi) for (const L of Ls) {
        const c = eroeAtteso(e, L)
        const { mostroDiRiferimento, offesa, resistenza } = await import(pathToFileURL(join(radice, SRC, 'motore/forza.js')).href)
        const m = mostroDiRiferimento(L), o = offesa(c, m)
        righe.push({ titolo: `${e} ${L}`, celle: [String(c.mano).split('@')[0], String(c.mancina).split('@')[0], o.forti.join('+') || '-', o.colpo, +o.risposte.toFixed(1), Math.round(resistenza(c)), +rapporto(c, L).toFixed(2)], numeri: true })
      }
      return { intestazione: ['mano', 'mancina', 'forti', 'colpo', 'risposte', 'resist.', 'rapporto'], titolo: 'l\'eroe atteso', righe, numeri: true, larga: 24 }
    }
    // `--rapporti`: invece del livello, il rapporto dell'eroe atteso (quanti mostri regge per ogni mostro che batte): le gobbe
    if (argv.includes('--rapporti'))
      return { intestazione: Ls.map(String), titolo: 'rapporto dell\'eroe atteso al livello', righe: OPZ.eroi.map(e => ({ titolo: e, celle: Ls.map(L => +rapporto(eroeAtteso(e, L), L).toFixed(2)) })), numeri: true }
    return { intestazione: Ls.map(String), titolo: 'forza dell\'eroe atteso al livello', righe: OPZ.eroi.map(e => ({ titolo: e, celle: Ls.map(L => livelloDiForza(eroeAtteso(e, L))) })), numeri: true }
  }

  if (argv.includes('--diag')) {
    const lavori = []
    for (const eroe of OPZ.eroi) for (const k of discese) lavori.push({ ...base, che: 'diag', opz: { eroe, k, bravura: OPZ.prove[0], semi: OPZ.semi } })
    const r = await inParallelo(lavori)
    const righe = discese.map((k, i) => {
      const mie = r.filter((_, j) => lavori[j].opz.k === k)
      const s = f => mie.reduce((n, x) => n + x[f], 0)
      const part = s('partite')
      return { titolo: nomi[i], celle: [percento(s('vinte'), part), Math.round(s('domande') / part), +(s('svenimenti') / part).toFixed(1), +(s('pozioni') / part).toFixed(1),
                                       percento(s('fini'), s('scontri') || 1), +(s('abilita') / (s('scontri') || 1)).toFixed(2), +(s('turni') / (s('scontri') || 1)).toFixed(1)] }
    })
    return { titolo: `a ${OPZ.prove[0] * 10}/10 (${OPZ.eroi.length * OPZ.semi} partite a discesa)`,
             intestazione: ['vinte%', 'domande', 'svenim.', 'pozioni', 'vita%fine', 'abil/sc', 'turni/sc'], righe, numeri: true, perRiga: true }
  }

  if (OPZ.zone) {
    const lavori = []
    OPZ.zone.forEach((L, i) => { for (const eroe of OPZ.eroi) for (const k of discese) lavori.push({ ...base, che: 'zone', opz: { eroe, livello: L, eroeA: OPZ.eroeA ? OPZ.eroeA[i] : L, semi: OPZ.semi, prove: OPZ.prove, quali: [k], come: OPZ.come }, L: i, k }) })
    const r = await inParallelo(lavori)
    const righe = []
    OPZ.zone.forEach((L, i) => {
      OPZ.prove.forEach((b, j) => {
        const celle = discese.map(k => {
          const v = lavori.reduce((n, l, x) => (l.L === i && l.k === k ? n + r[x].vinte[j][k] : n), 0)
          return percento(v, OPZ.eroi.length * OPZ.semi)
        })
        righe.push({ titolo: `zone al ${L}${OPZ.eroeA ? ` (eroe ${OPZ.eroeA[i]})` : ''} a ${Math.round(b * 10)}/10`, celle, media: true })
      })
      const liv = discese.map(k => lavori.reduce((n, l, x) => (l.L === i && l.k === k ? n + r[x].livelli[k] : n), 0) / OPZ.eroi.length)
      righe.push({ titolo: `   livelli presi (al ${L})`, celle: liv.map(v => +v.toFixed(1)), numeri: true })
      const dom = discese.map(k => lavori.reduce((n, l, x) => (l.L === i && l.k === k ? n + r[x].domande[k] : n), 0) / OPZ.eroi.length)
      righe.push({ titolo: `   domande (a ${Math.round(OPZ.prove[0] * 10)}/10)`, celle: dom.map(Math.round), numeri: true })
    })
    return { intestazione: nomi, righe }
  }

  if (argv.includes('--vere')) {
    const lavori = OPZ.eroi.map(eroe => ({ ...base, che: 'vere', opz: { semi: OPZ.semi, eroe, fila: OPZ.fila, prove: OPZ.prove } }))
    const r = await inParallelo(lavori)
    const righe = OPZ.prove.map((b, j) => ({
      titolo: `la storia giocata (${OPZ.fila}) a ${Math.round(b * 10)}/10`,
      celle: discese.map(k => percento(r.reduce((n, x) => n + x.vinte[j][k], 0), r.length * OPZ.semi)), media: true,
    }))
    righe.push({ titolo: '   livello con cui si entra', numeri: true, celle: discese.map(k => +(r.reduce((n, x) => n + x.zaini[k].livello, 0) / r.length).toFixed(1)) })
    return { intestazione: nomi, righe }
  }

  // la storia: roba e livello attesi, a scarti diversi
  const lavori = []
  for (const eroe of OPZ.eroi) for (const k of discese)
    lavori.push({ ...base, che: 'storia', opz: { eroe, semi: OPZ.semi, prove: OPZ.prove, scarti: OPZ.scarti, livelli: OPZ.livelli, come: OPZ.come, quali: [k] }, k })
  const r = await inParallelo(lavori)
  const chiavi = [...OPZ.scarti, ...OPZ.livelli.map(l => `L${l > 0 ? '+' : ''}${l}`)]
  const righe = []
  for (const ch of chiavi) OPZ.prove.forEach((b, j) => {
    const nome = ch === 0 ? 'roba attesa' : typeof ch === 'number' ? `roba di ${ch > 0 ? '+' : ''}${ch} discese` : `livello ${ch.slice(1)}`
    const celle = discese.map(k => percento(lavori.reduce((n, l, x) => (l.k === k ? n + r[x].vinte[ch][j][k] : n), 0), OPZ.eroi.length * OPZ.semi))
    const perEroe = discese.map(k => OPZ.eroi.map(e => lavori.reduce((n, l, x) => (l.k === k && l.opz.eroe === e ? n + r[x].vinte[ch][j][k] : n), 0)).join('·'))
    righe.push({ titolo: `${nome} a ${Math.round(b * 10)}/10`, celle, media: true, perEroe })
  })
  return { intestazione: nomi, righe }
}

/* ═══════════ la stampa ═══════════ */
function stampa(t, prima = null) {
  const media = c => Math.round(c.reduce((a, b) => a + b, 0) / c.length)
  const cella = (x, y) => (y == null ? String(x) : `${y}→${x}`)
  console.log(t.titolo ? `${t.titolo}` : '')
  const larga = t.larga || 8 + (prima ? 4 : 0)
  console.log(' '.repeat(34) + t.intestazione.map(s => String(s).padStart(larga)).join('') + (t.righe.some(r => r.media) ? '   media' : ''))
  t.righe.forEach((r, i) => {
    const p = prima && prima.righe[i] ? prima.righe[i] : null
    const unita = r.numeri || t.numeri ? '' : '%'
    const celle = r.celle.map((c, j) => (cella(c, p ? p.celle[j] : null) + unita).padStart(larga))
    const coda = r.media ? '   ' + cella(media(r.celle), p ? media(p.celle) : null) + '%' : ''
    console.log(r.titolo.padEnd(34) + celle.join('') + coda)
    if (r.perEroe && argv.includes('--per-eroe')) console.log(' '.repeat(34) + r.perEroe.map(s => s.padStart(larga)).join(''))
  })
}

const contro = valore('--contro')
let tmp = null
try {
  let prima = null
  if (contro) {
    const hash = execFileSync('git', ['rev-parse', '--short', contro], { cwd: RADICE, encoding: 'utf8' }).trim()
    tmp = join(RADICE, 'tmp', `banco-${hash}`)
    if (existsSync(tmp)) execFileSync('git', ['worktree', 'remove', '--force', tmp], { cwd: RADICE })
    execFileSync('git', ['worktree', 'add', '--detach', tmp, contro], { cwd: RADICE, stdio: 'ignore' })
    console.log(`prima = ${hash}, dopo = la copia di lavoro`)
    prima = await misura(tmp)
  }
  stampa(await misura(RADICE), prima)
} finally {
  if (tmp) {
    try { execFileSync('git', ['worktree', 'remove', '--force', tmp], { cwd: RADICE, stdio: 'ignore' }) } catch { rmSync(tmp, { recursive: true, force: true }) }
  }
}
