// La taratura del sotterraneo coi giocatori tipo (docs/sotterraneo/giocatori-tipo.md): il curioso, il bravo, lo sbadato giocano le sette
// discese di fila, con la roba che trovano e comprano, e il rapporto dice per ognuno quali bersagli la discesa rispetta e, dove no, il perché.
// Non scrive mai i sorgenti: stampa il rapporto, la proposta di `--cerca` e il comando `--tara …` per verificarla.
//
//   npm run taratura                              # il giro: 30 storie per eroe, tre giocatori tipo, rapporto e scostamenti (meno di un minuto)
//   npm run taratura -- --presto                  # il giro corto: 3 storie per eroe, si ferma al primo bersaglio fuori di molto (pochi secondi)
//   npm run taratura -- --presto --discese 2      # solo fino alla torre (gli indici: 0 è la cripta)
//   npm run taratura -- --semi 40 --eroi mago,nano   # più storie, solo quegli eroi
//   npm run taratura -- --tara 2.spinta=8,3.forza=1.4   # prova dei valori senza toccare i sorgenti (indice.campo=valore)
//   npm run taratura -- --cerca                   # per ogni discesa fuori bersaglio e uniforme, cerca spinta e forza per bisezione (al più cinque minuti)
//   npm run taratura -- --cerca --discese 2,3     # cerca solo su quelle (le altre si giocano con i valori di adesso)
//   npm run taratura -- --tutto                   # nel rapporto, il perché di ogni cella e non solo il riassunto
//   npm run taratura -- --giocatori curioso,bravo # solo quei giocatori tipo
//
// Il caso è dichiarato: `--seme-da N` (di difetto 1) fa le storie N..N+semi−1, due giri danno le stesse cifre. `--processi N` (di difetto 4)
// limita i processi; la macchina ha poca memoria. I tempi si stampano alla fine.
import { spawn } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve, join } from 'node:path'

const QUI = fileURLToPath(import.meta.url)
const RADICE = resolve(dirname(QUI), '..')
const SRC = 'src/giochi/sotterraneo/'
const argv = process.argv.slice(2)
const valore = (nome, difetto = null) => { const i = argv.indexOf(nome); return i >= 0 ? argv[i + 1] : difetto }
const numeri = (nome, difetto) => (valore(nome) != null ? valore(nome).split(',').map(Number) : difetto)
const modulo = nome => import(pathToFileURL(join(RADICE, SRC, nome)).href)
const EROI_TUTTI = ['cavaliere', 'elfa', 'mago', 'nano']

/* ═══════════ il lavoratore: un pezzo di storie in un processo a sé ═══════════ */
if (argv[0] === '--lavoro') {
  let dentro = ''
  for await (const d of process.stdin) dentro += d
  const lavoro = JSON.parse(dentro)
  const { CAMPAGNA } = await modulo('dati/campagna.js')
  const zone = await modulo('dati/zone.js')
  // `2.spinta=6.5` ritocca una discesa (le zone la ereditano); `zona.forzaA12=5` la curva delle zone: stesse chiavi di npm run sotterraneo
  for (const voce of (lavoro.tara || '').split(',').filter(Boolean)) {
    const [k, campo] = voce.split('=')[0].split('.')
    const v = Number(voce.split('=')[1])
    if (k === 'zona') { if (campo in zone.CURVA_DELLE_ZONE) zone.CURVA_DELLE_ZONE[campo] = v; else zone.FORMA_DELLA_ZONA[campo] = v }
    else CAMPAGNA[Number(k)][campo] = v
  }
  const { storiaDi, passoDellaStoria, rifatteAl } = await modulo('motore/storie.js')
  let risultato
  if (lavoro.che === 'storie') {
    risultato = []
    for (const eroe of lavoro.eroi) for (const seme of lavoro.semi) for (const tipo of lavoro.tipi)
      risultato.push(...storiaDi({ tipo, eroe, seme, fino: lavoro.fino }))
  } else if (lavoro.che === 'passi') {
    // un passo solo per ogni storia, da dove ne è rimasta: la ricerca non rigioca le discese di prima
    risultato = lavoro.lista.map(x => passoDellaStoria(lavoro.k, x.stato, { tipo: lavoro.tipo, eroe: x.eroe, seme: x.seme,
      sonde: lavoro.sonde || [], rifai: lavoro.rifai ? rifatteAl(lavoro.k) : [] }))
  }
  process.stdout.write(JSON.stringify(risultato))
  process.exit(0)
}

/* ═══════════ il pool ═══════════ */
const POSTI = Number(valore('--processi')) || 4
async function inParallelo(lavori) {
  const risultati = new Array(lavori.length)
  let prossimo = 0
  const uno = () => new Promise((ok, no) => {
    const i = prossimo++
    if (i >= lavori.length) return ok()
    const p = spawn('node', [QUI, '--lavoro'], { stdio: ['pipe', 'pipe', 'inherit'] })
    let out = ''
    p.stdout.on('data', d => { out += d })
    p.on('close', codice => {
      if (codice) return no(new Error(`un lavoro è finito male (${codice})`))
      risultati[i] = JSON.parse(out)
      uno().then(ok, no)
    })
    p.stdin.end(JSON.stringify(lavori[i]))
  })
  await Promise.all(Array.from({ length: Math.min(POSTI, lavori.length) }, uno))
  return risultati
}

const PRESTO = argv.includes('--presto')
const EROI = valore('--eroi') ? valore('--eroi').split(',') : EROI_TUTTI
const SEMI = Number(valore('--semi')) || (PRESTO ? 3 : argv.includes('--cerca') ? 16 : 30)
const DA = Number(valore('--seme-da', 1))
const semiDi = (n = SEMI) => Array.from({ length: n }, (_, i) => DA + i)
const TARA = valore('--tara', '')
const tempi = []
const cronometra = async (nome, f) => { const t = Date.now(); const r = await f(); tempi.push([nome, (Date.now() - t) / 1000]); return r }

// le storie intere, in pezzi bilanciati fra i processi
async function giocaLeStorie({ tipi, fino }) {
  const per = Math.max(1, Math.ceil((POSTI * 3) / EROI.length))
  const semi = semiDi()
  const pezzi = Array.from({ length: per }, (_, i) => semi.filter((_, j) => j % per === i)).filter(p => p.length)
  const lavori = EROI.flatMap(eroe => pezzi.map(s => ({ che: 'storie', eroe: [eroe], eroi: [eroe], semi: s, tipi, fino, tara: TARA })))
  return (await inParallelo(lavori)).flat()
}

/* ═══════════ la stampa del rapporto ═══════════ */
async function stampaIlRapporto(passi, { completo = false, solo = null, tipi = null } = {}) {
  const rap = await modulo('motore/rapporto.js')
  const { NOMI_TIPO } = await modulo('dati/giocatori-tipo.js')
  const { CAMPAGNA } = await modulo('dati/campagna.js')
  const P = rap.partite(passi)
  const R = rap.rapporto(P)
  const elenco = (tipi || NOMI_TIPO).filter(t => P.per[t])
  for (const t of elenco) console.log(`\n${rap.tabella(R, t)}`)
  const f = rap.forbice(P)
  console.log(`\nLa roba con cui il curioso entra (10° · mediana · 90° percentile): forza sul livello atteso, e livello`)
  console.log(' '.repeat(10) + f.map(x => CAMPAGNA[x.k].chiave.slice(0, 6).padStart(14)).join(''))
  console.log('scarto'.padEnd(10) + f.map(x => x.scarto.map(v => (v == null ? '-' : (v > 0 ? '+' : '') + v)).join('·').padStart(14)).join(''))
  console.log('livello'.padEnd(10) + f.map(x => `${x.livello.join('·')} (${x.atteso})`.padStart(14)).join(''))
  const lista = rap.scostamenti(R, P, { solo }).filter(x => elenco.includes(x.f.tipo))
  console.log(`\nScostamenti (${lista.length}): ogni deviazione è sospetta, prima si capisce e poi si gira una manopola`)
  const limite = completo ? 99 : 6
  for (const { spiegazione: s } of lista) console.log(`\n❌ ${s.testa}  [${s.natura}]\n${s.righe.slice(0, limite).map(r => `     · ${r}`).join('\n')}`)
  if (!lista.length) console.log('nessuno: tutti i bersagli sono rispettati')
  return { R, P, lista }
}

function stampaITempi(inizio) {
  const tot = (Date.now() - inizio) / 1000
  console.log(`\nTempi: ${tempi.map(([n, s]) => `${n} ${s.toFixed(1)} s`).join(' · ')} — in tutto ${tot.toFixed(1)} s con ${POSTI} processi`)
}

/* ═══════════ il giro corto ═══════════ */
async function presto() {
  const fino = valore('--discese') ? Math.max(...numeri('--discese')) : 6
  const passi = await cronometra('storie', () => giocaLeStorie({ tipi: ['curioso', 'bravo'], fino: Math.min(fino, 6) }))
  const rap = await modulo('motore/rapporto.js')
  const solo = valore('--discese') ? numeri('--discese') : null
  const { R } = await stampaIlRapporto(passi, { solo })
  // con tre storie il caso pesa: «di molto» è una volta e mezza il margine
  const primo = rap.primoFuoriDiMolto(R, 1.5)
  console.log(primo ? `\nPRESTO: ${primo.frase}\nMeglio fermarsi qui e capire prima del giro lungo.` : '\nPRESTO: niente fuori di molto, si può lanciare il giro lungo.')
  return primo ? 1 : 0
}

/* ═══════════ la ricerca ═══════════ */
async function cerca() {
  const rap = await modulo('motore/rapporto.js')
  const { CAMPAGNA } = await modulo('dati/campagna.js')
  const { STATO_NUOVO } = await modulo('motore/storie.js')
  const { TENTATIVI } = await modulo('dati/giocatori-tipo.js')
  const bersagli = (await modulo('dati/giocatori-tipo.js')).GIOCATORI_TIPO.curioso.bersagli
  const cercabili = valore('--discese') ? numeri('--discese') : CAMPAGNA.map((_, k) => k)
  const semi = semiDi()
  const storie = EROI.flatMap(eroe => semi.map(seme => ({ eroe, seme })))
  let stati = { curioso: storie.map(() => STATO_NUOVO()), bravo: storie.map(() => STATO_NUOVO()) }
  const proposte = {}                   // 'k.campo' → valore
  const taraOra = () => [TARA, ...Object.entries(proposte).map(([c, v]) => `${c}=${v}`)].filter(Boolean).join(',')
  const mezzi = []
  let valutazioni = 0

  // un passo di una discesa per tutti, dai loro stati: torna i passi e gli stati nuovi
  const passo = async (k, tipo, { sonde = [], rifai = false } = {}, tara = taraOra()) => {
    const pezzi = POSTI * 2
    const lavori = Array.from({ length: pezzi }, (_, i) => ({ che: 'passi', k, tipo, sonde, rifai, tara,
      lista: storie.map((s, j) => ({ ...s, stato: stati[tipo][j], j })).filter((_, j) => j % pezzi === i) })).filter(l => l.lista.length)
    const r = await inParallelo(lavori)
    const passi = new Array(storie.length), nuovi = new Array(storie.length)
    lavori.forEach((l, i) => l.lista.forEach((x, n) => { passi[x.j] = r[i][n].passo; nuovi[x.j] = r[i][n].stato }))
    return { passi, nuovi }
  }
  const misura = (k, passi) => {
    valutazioni++
    const P = rap.partite(passi.map(p => ({ ...p })))
    const g = (P.per.curioso || {})[k] || []
    return { P, m: rap.misure(g), g }
  }
  const taraCon = (k, campo, v) => [taraOra(), `${k}.${campo}=${v}`].filter(Boolean).join(',')
  const att = k => ({ forza: proposte[`${k}.forza`] ?? CAMPAGNA[k].forza ?? 1, spinta: proposte[`${k}.spinta`] ?? CAMPAGNA[k].spinta ?? 0 })
  const arrotonda = v => Math.round(v * 20) / 20

  for (let k = 0; k < CAMPAGNA.length; k++) {
    const nome = CAMPAGNA[k].chiave
    const prima = att(k)
    let e = await cronometra(`${nome} base`, async () => misura(k, (await passo(k, 'curioso')).passi))
    const b = bersagli.vitaGrosso, bd = bersagli.domande
    const vita = e.m.vitaGrosso, dom = e.m.domande
    const fuoriVita = vita != null && rap.fuori(vita, b), fuoriDom = rap.fuori(dom, bd)
    let nota = 'nei bersagli'
    if ((fuoriVita || fuoriDom) && cercabili.includes(k)) {
      const dirV = vita > b.max ? 1 : -1
      const nv = fuoriVita ? rap.natura(e.g, 'vitaGrosso', b, dirV) : null
      const nd = fuoriDom ? rap.natura(e.g, 'domande', bd, 1) : null
      const capire = [nv, nd].filter(Boolean).filter(n => n.tipo !== 'uniforme')
      if (capire.length) {
        nota = `prima capire: ${fuoriVita && nv.tipo !== 'uniforme' ? `la vita (${nv.tipo}${nv.fuoriEroi.length ? ` ${nv.fuoriEroi.join(', ')}` : ''})` : ''} ${fuoriDom && nd.tipo !== 'uniforme' ? `le domande (${nd.tipo})` : ''}`.trim()
      } else {
        await cronometra(`${nome} ricerca`, async () => {
          // 1. le domande: la forza più alta che sta nel tetto (solo verso il basso: se stanno sotto, non si tocca)
          if (fuoriDom && CAMPAGNA[k].forza != null) {
            let lo = 0.3, hi = prima.forza, buona = null
            for (let i = 0; i < 5 && hi - lo > 0.05; i++) {
              const mid = arrotonda((lo + hi) / 2)
              const x = misura(k, (await passo(k, 'curioso', {}, taraCon(k, 'forza', mid))).passi)
              if (x.m.domande <= bd.max - 2) { buona = mid; lo = mid } else hi = mid
              if (buona != null && bd.max - 2 - x.m.domande < 4 && x.m.domande <= bd.max - 2) break
            }
            if (buona != null) { proposte[`${k}.forza`] = buona; e = misura(k, (await passo(k, 'curioso')).passi) }
          }
          // 2. la vita: la spinta che porta il curioso a metà della sua forbice (la cripta non ha spinta: si scende a mani nude)
          const centro = (b.min + b.max) / 2
          const v1 = e.m.vitaGrosso
          if (k > 0 && v1 != null && rap.fuori(v1, b)) {
            let lo = v1 > b.max ? prima.spinta : 0, hi = v1 > b.max ? 12 : prima.spinta
            let migliore = { s: att(k).spinta, v: v1 }
            for (let i = 0; i < 6 && hi - lo > 0.1; i++) {
              const mid = arrotonda((lo + hi) / 2)
              const x = misura(k, (await passo(k, 'curioso', {}, taraCon(k, 'spinta', mid))).passi)
              if (x.m.vitaGrosso != null && Math.abs(x.m.vitaGrosso - centro) < Math.abs(migliore.v - centro)) migliore = { s: mid, v: x.m.vitaGrosso }
              if (x.m.vitaGrosso != null && x.m.vitaGrosso >= b.min + 0.05 && x.m.vitaGrosso <= b.max - 0.05) break
              if (x.m.vitaGrosso > centro) lo = mid; else hi = mid
            }
            if (migliore.s !== att(k).spinta) proposte[`${k}.spinta`] = migliore.s
          }
        })
        const dopo = att(k)
        nota = `${dopo.forza !== prima.forza ? `forza ${prima.forza} → ${dopo.forza}` : 'forza invariata'}, ${dopo.spinta !== prima.spinta ? `spinta ${prima.spinta} → ${dopo.spinta}` : 'spinta invariata'}`
      }
    } else if (fuoriVita || fuoriDom) nota = 'fuori bersaglio ma non cercata (--discese)'
    // il passo che vale: i tre giocatori tipo coi valori proposti, e gli stati con cui si entra nella discesa dopo
    const cur = await cronometra(`${nome} verifica`, async () => {
      const c = await passo(k, 'curioso', { sonde: ['sbadato'], rifai: true })
      const br = await passo(k, 'bravo')
      stati = { curioso: c.nuovi, bravo: br.nuovi }
      return { c: c.passi, br: br.passi }
    })
    const P = rap.partite([...cur.c, ...cur.br])
    const mc = rap.misure((P.per.curioso || {})[k] || []), mb = rap.misure((P.per.bravo || {})[k] || []), ms = rap.misure((P.per.sbadato || {})[k] || [])
    const f = (v, u = 'perc') => (v == null ? '-' : u === 'perc' ? `${Math.round(v * 100)}%` : String(Math.round(v)))
    mezzi.push({ k, nome, nota, prima, dopo: att(k),
      curioso: `vita dopo il grosso ${f(mc.vitaGrosso)} (era ${f(vita)}), domande ${f(mc.domande, 'n')} (era ${f(dom, 'n')}), vince ${f(mc.vinte)}`,
      bravo: `vita a fine scontro ${f(mb.vitaScontri)}, sopra il 90% ${f(mb.sopra90)}, vince ${f(mb.vinte)}`,
      sbadato: `vince ${f(ms.vinte)}`,
      okBravo: !rap.fuori(mb.vitaScontri, bersaglioDi(rap, 'bravo', 'vitaScontri', k)) && !rap.fuori(mb.sopra90, bersaglioDi(rap, 'bravo', 'sopra90', k)) && !rap.fuori(mb.vinte, bersaglioDi(rap, 'bravo', 'vinte', k)),
      okSbadato: !rap.fuori(ms.vinte, bersaglioDi(rap, 'sbadato', 'vinte', k)) })
    console.log(`  ${nome}: ${nota}`)
  }
  return { mezzi, proposte, valutazioni, TENTATIVI }
}
function bersaglioDi(rap, tipo, chiave, k) { return rap.bersaglioDi(GIOCATORI[tipo].bersagli[chiave], k) }
const { GIOCATORI_TIPO: GIOCATORI } = await modulo('dati/giocatori-tipo.js')

/* ═══════════ si parte ═══════════ */
const inizio = Date.now()
let uscita = 0
if (PRESTO) uscita = await presto()
else if (argv.includes('--cerca')) {
  console.log(`Ricerca: ${SEMI} storie per eroe, un passo alla volta (chi entra nella discesa dopo ha quello che ha preso nella prima)`)
  const r = await cerca()
  console.log('\nLa proposta (NON applicata: la decide chi tara)')
  for (const m of r.mezzi) {
    console.log(`\n${m.nome} (${m.k}): ${m.nota}`)
    console.log(`   curioso: ${m.curioso}\n   bravo: ${m.bravo} ${m.okBravo ? '✅' : '❌'}\n   sbadato: ${m.sbadato} ${m.okSbadato ? '✅' : '❌'}`)
  }
  const voci = Object.entries(r.proposte)
  console.log(voci.length ? `\nPer verificarla:\n  npm run taratura -- --tara ${[TARA, ...voci.map(([c, v]) => `${c}=${v}`)].filter(Boolean).join(',')}\n(poi i valori vanno scritti in src/giochi/sotterraneo/dati/campagna.js: lo strumento non li scrive)`
                    : '\nNessun cambio proposto.')
  console.log(`${r.valutazioni} valutazioni di una discesa`)
} else {
  const passi = await cronometra('storie', () => giocaLeStorie({ tipi: valore('--giocatori') ? valore('--giocatori').split(',').filter(t => t !== 'sbadato') : ['curioso', 'bravo'], fino: 7 }))
  await cronometra('rapporto', () => stampaIlRapporto(passi, { completo: argv.includes('--tutto'), solo: valore('--discese') ? numeri('--discese') : null }))
}
stampaITempi(inizio)
process.exit(uscita)
