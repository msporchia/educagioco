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
//   npm run taratura -- --specie                  # solo la tabella delle specie: quanto picchiano contro l'eroe atteso, cosa portano (senza giocare)
//   npm run taratura -- --da 4                    # rigioca dalla quinta discesa in poi, dai checkpoint (tmp/taratura/): quelle prima non si giocano
//   npm run taratura -- --da 4 --fino 4 --semi 10 --semi-strade 3   # una tappa sola e poche storie, servite dai checkpoint: pochi secondi
//   npm run taratura -- --rifai                   # rifà tutti i checkpoint (di difetto si rifanno da sé quelli che la firma dei sorgenti dice vecchi)
//   npm run taratura -- --strade armaPrima        # solo quelle strade di spesa (di difetto armaPrima e beveTutto); --semi-strade N le storie per eroe
//
// Il caso è dichiarato: `--seme-da N` (di difetto 1) fa le storie N..N+semi−1, due giri danno le stesse cifre. `--processi N` (di difetto 4)
// limita i processi; la macchina ha poca memoria. I tempi si stampano alla fine.
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve, join } from 'node:path'
import { firmeDelleDiscese, scrivi, leggi, validi, scegli } from './sotterraneo-checkpoint.mjs'

const QUI = fileURLToPath(import.meta.url)
const RADICE = resolve(dirname(QUI), '..')
const SRC = 'src/giochi/sotterraneo/'
const argv = process.argv.slice(2)
const valore = (nome, difetto = null) => { const i = argv.indexOf(nome); return i >= 0 ? argv[i + 1] : difetto }
const numeri = (nome, difetto) => (valore(nome) != null ? valore(nome).split(',').map(Number) : difetto)
const modulo = nome => import(pathToFileURL(join(RADICE, SRC, nome)).href)
const EROI_TUTTI = ['cavaliere', 'elfa', 'mago', 'nano']

/* ═══════════ i valori provati a mano ═══════════ */
// `2.spinta=6.5` ritocca una discesa (le zone la ereditano); `zona.forzaA12=5` la curva delle zone: stesse chiavi di npm run sotterraneo
async function applicaTara(tara) {
  const { CAMPAGNA } = await modulo('dati/campagna.js')
  const zone = await modulo('dati/zone.js')
  const livelli = await modulo('dati/livelli.js')
  for (const voce of (tara || '').split(',').filter(Boolean)) {
    const [k, campo] = voce.split('=')[0].split('.')
    const v = Number(voce.split('=')[1])
    if (k === 'livelli') livelli.CURVA_DELL_ESPERIENZA[campo] = v
    else if (k === 'potenza') livelli.VALORE_DELLA_POTENZA[campo] = v
    else if (k === 'zona') { if (campo in zone.CURVA_DELLE_ZONE) zone.CURVA_DELLE_ZONE[campo] = v; else zone.FORMA_DELLA_ZONA[campo] = v }
    else CAMPAGNA[Number(k)][campo] = v
  }
}

/* ═══════════ il lavoratore: un pezzo di storie in un processo a sé ═══════════ */
async function eseguiLavoro(lavoro) {
  const { storiaDi, passoDellaStoria, rifatteAl, compatta } = await modulo('motore/storie.js')
  if (lavoro.che === 'storie') {
    const risultato = []
    for (const eroe of lavoro.eroi) for (const seme of lavoro.semi) for (const tipo of lavoro.tipi)
      risultato.push(...storiaDi({ tipo, eroe, seme, fino: lavoro.fino }))
    return risultato
  }
  // un passo solo per ogni storia, da dove ne è rimasta: la ricerca non rigioca le discese di prima
  if (lavoro.che === 'passi')
    return lavoro.lista.map(x => passoDellaStoria(lavoro.k, x.stato, { tipo: lavoro.tipo, eroe: x.eroe, seme: x.seme,
      sonde: lavoro.sonde || [], rifai: lavoro.rifai ? rifatteAl(lavoro.k) : [] }))
  // una tappa: la discesa k per storie di linee diverse, ognuna dal suo stato
  if (lavoro.che === 'tappa')
    return lavoro.items.map(x => {
      const r = passoDellaStoria(lavoro.k, x.stato, { tipo: x.tipo, strada: x.strada, eroe: x.eroe, seme: x.seme, sonde: x.sonde, rifai: x.rifai ? rifatteAl(lavoro.k) : [] })
      return { l: x.l, i: x.i, passo: x.compatta ? compatta(r.passo) : r.passo, stato: r.stato }
    })
}
// un lavoro per processo (la ricerca prova valori diversi a ogni lavoro)
if (argv[0] === '--lavoro') {
  let dentro = ''
  for await (const d of process.stdin) dentro += d
  const lavoro = JSON.parse(dentro)
  await applicaTara(lavoro.tara)
  const risultato = await eseguiLavoro(lavoro)
  process.stdout.write(JSON.stringify(risultato), () => process.exit(0))   // uscire prima che la pipe si svuoti tronca l'output
  await new Promise(() => {})
}
// un operaio resta in vita e riceve un lavoro per riga: i valori provati sono gli stessi per tutti
if (argv[0] === '--operaio') {
  await applicaTara(argv[1])
  for await (const riga of createInterface({ input: process.stdin })) process.stdout.write(`${JSON.stringify(await eseguiLavoro(JSON.parse(riga)))}\n`)
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

// operai che restano in vita: un lavoro per volta ciascuno, senza ricaricare il gioco a ogni tappa
class Operai {
  constructor(tara) {
    this.figli = Array.from({ length: POSTI }, () => {
      const p = spawn('node', [QUI, '--operaio', tara], { stdio: ['pipe', 'pipe', 'inherit'] })
      const f = { p, buf: '', corrente: null }
      p.stdout.setEncoding('utf8')
      p.stdout.on('data', d => {
        f.buf += d
        for (let i; (i = f.buf.indexOf('\n')) >= 0;) { const riga = f.buf.slice(0, i); f.buf = f.buf.slice(i + 1); f.corrente.ok(JSON.parse(riga)) }
      })
      p.on('close', codice => { if (f.corrente) f.corrente.no(new Error(`un operaio è finito male (${codice})`)) })
      return f
    })
  }
  async esegui(lavori) {
    const fuori = new Array(lavori.length)
    let prossimo = 0
    await Promise.all(this.figli.map(async f => {
      while (prossimo < lavori.length) {
        const i = prossimo++
        fuori[i] = await new Promise((ok, no) => { f.corrente = { ok, no }; f.p.stdin.write(`${JSON.stringify(lavori[i])}\n`) })
      }
    }))
    return fuori
  }
  chiudi() { for (const f of this.figli) f.p.stdin.end() }
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
async function stampaIlRapporto(passi, { completo = false, solo = null, tipi = null, finito = true } = {}) {
  const rap = await modulo('motore/rapporto.js')
  const { NOMI_TIPO, GIOCATORI_TIPO } = await modulo('dati/giocatori-tipo.js')
  const { CAMPAGNA } = await modulo('dati/campagna.js')
  const P = rap.partite(passi)
  if (!finito) P.finite = null   // senza tutte le discese non si dice quante storie sono finite
  const R = rap.rapporto(P)
  const elenco = (tipi || NOMI_TIPO).filter(t => P.per[t])
  for (const t of elenco) console.log(`\n${rap.tabella(R, t)}`)
  for (const t of ['curioso', 'bravo'].filter(x => elenco.includes(x))) {
    const f = rap.forbice(P, t)
    console.log(`\nLa roba con cui ${GIOCATORI_TIPO[t].nome.toLowerCase()} entra (10° · mediana · 90° percentile): la forza sul livello atteso, il livello (atteso), le gemme`)
    console.log(' '.repeat(10) + f.map(x => CAMPAGNA[x.k].chiave.slice(0, 6).padStart(14)).join(''))
    console.log('scarto'.padEnd(10) + f.map(x => x.scarto.map(v => (v == null ? '-' : (v > 0 ? '+' : '') + v)).join('·').padStart(14)).join(''))
    console.log('livello'.padEnd(10) + f.map(x => `${x.livello.join('·')} (${x.atteso})`.padStart(14)).join(''))
    console.log('gemme prese'.padEnd(10) + f.map(x => String(Math.round(x.gemmePrese ?? 0)).padStart(14)).join(''))
    console.log('avanzate'.padEnd(10) + f.map(x => x.gemmeAvanzate.map(v => v ?? '-').join('·').padStart(14)).join(''))
  }
  const lista = rap.scostamenti(R, P, { solo }).filter(x => elenco.includes(x.f.tipo))
  console.log(`\nScostamenti (${lista.length}): ogni deviazione è sospetta, prima si capisce e poi si gira una manopola`)
  const limite = completo ? 99 : 5
  for (const { spiegazione: s } of lista) console.log(`\n❌ ${s.testa}  [${s.natura}]\n${s.righe.slice(0, limite).map(r => `     · ${r}`).join('\n')}`)
  if (!lista.length) console.log('nessuno: tutti i bersagli sono rispettati')
  return { R, P, lista }
}

function stampaITempi(inizio) {
  const tot = (Date.now() - inizio) / 1000
  console.log(`\nTempi: ${tempi.map(([n, s]) => `${n} ${s.toFixed(1)} s`).join(' · ')} — in tutto ${tot.toFixed(1)} s con ${POSTI} processi`)
}

// la tabella delle specie: i mostri dei piani veri contro l'eroe atteso, e cosa portano (docs/sotterraneo/giocatori-tipo.md)
async function stampaLeSpecie({ completa = true } = {}) {
  const { tabellaDelleSpecie } = await modulo('motore/specie.js')
  const t = tabellaDelleSpecie()
  if (completa) console.log(t.testo)
  console.log(t.fuori.length ? `\nSpecie che picchiano fuori misura (la prima cosa da guardare):\n${t.fuori.map(x => `  ! ${x}`).join('\n')}` : '\nNessuna specie picchia fuori misura.')
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

  // la bisezione: `crescente` dice se il numero misurato sale con la manopola; torna il valore provato più vicino al centro
  const bisezione = async (k, campo, lo, hi, { crescente, centro, dentro, misurato, cicli = 5 }) => {
    let migliore = null
    for (let i = 0; i < cicli && hi - lo > 0.1; i++) {
      const mid = arrotonda((lo + hi) / 2)
      const x = misura(k, (await passo(k, 'curioso', {}, taraCon(k, campo, mid))).passi)
      const v = misurato(x)
      if (v == null) break
      if (!migliore || Math.abs(v - centro) < Math.abs(migliore.v - centro)) migliore = { x: mid, v, m: x.m }
      if (dentro(v)) break
      if ((v > centro) === crescente) hi = mid; else lo = mid
    }
    return migliore
  }

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
        const motivi = []
        await cronometra(`${nome} ricerca`, async () => {
          // 1. le domande: la forza più alta che sta nel tetto (solo verso il basso: se stanno sotto, non si tocca)
          if (fuoriDom) {
            const r = await bisezione(k, 'forza', 0.2, prima.forza, { crescente: true, centro: bd.max - 7, dentro: v => v >= bd.max - 12 && v <= bd.max - 2, misurato: x => x.m.domande })
            if (r && r.v <= bd.max) { proposte[`${k}.forza`] = r.x; e = misura(k, (await passo(k, 'curioso')).passi) }
            else if (r) motivi.push(`le domande non scendono sotto ${Math.round(r.v)} nemmeno a forza ${r.x} (${Math.round(r.m.mostri)} mostri battuti a discesa, una domanda a mostro): la leva è il numero dei mostri, non la forza`)
          }
          // 2. la vita: la spinta (la cripta non ne ha: si scende all'attacco normale, e lì cede la forza) che porta il curioso a metà della sua forbice
          const v1 = e.m.vitaGrosso
          if (v1 != null && rap.fuori(v1, b)) {
            const troppoFacile = v1 > b.max
            const opz = { crescente: false, centro: (b.min + b.max) / 2, dentro: v => v >= b.min + 0.05 && v <= b.max - 0.05, misurato: x => x.m.vitaGrosso }
            const campo = k > 0 ? 'spinta' : 'forza'
            const r = k > 0
              ? await bisezione(k, 'spinta', troppoFacile ? att(k).spinta : 0, troppoFacile ? 12 : att(k).spinta, { ...opz, cicli: 6 })
              : (fuoriDom && proposte[`${k}.forza`] != null ? null : await bisezione(k, 'forza', troppoFacile ? att(k).forza : 0.2, troppoFacile ? 1 : att(k).forza, opz))
            if (r) {
              proposte[`${k}.${campo}`] = r.x
              if (rap.fuori(r.v, b)) motivi.push(`la vita arriva a ${Math.round(r.v * 100)}% e non oltre con ${campo === 'spinta' ? 'la spinta' : 'la forza'} ${r.x}`)
            } else motivi.push(k === 0 && !(fuoriDom && proposte[`${k}.forza`] != null) ? `la manopola è già al minimo (forza ${att(k).forza}, la cripta non ha spinta): restano il tetto dei branchi e gli scagnozzi del grosso` : 'la vita resta fuori, ma la forza della cripta è già stata mossa per le domande')
          }
        })
        const dopo = att(k)
        nota = `${dopo.forza !== prima.forza ? `forza ${prima.forza} → ${dopo.forza}` : 'forza invariata'}, ${dopo.spinta !== prima.spinta ? `spinta ${prima.spinta} → ${dopo.spinta}` : 'spinta invariata'}${motivi.length ? ` — ${motivi.join('; ')}` : ''}`
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


/* ═══════════ il giro a tappe: le linee, i checkpoint, la fine, le strade ═══════════ */
const DIR_BASE = resolve(RADICE, 'tmp/taratura')
const { SEMI_DELLE_STRADE } = await modulo('dati/giocatori-tipo.js')

// di giocatori-tipo.js conta come si gioca (non i bersagli: cambiarli non cambia le storie)
const sceltaDeiGiocatori = m => ({ tipi: Object.fromEntries(Object.entries(m.GIOCATORI_TIPO).map(([n, { bersagli, ...gioca }]) => [n, gioca])), strade: m.STRADE, tentativi: m.TENTATIVI, tasche: m.TASCHE_PER_I_PEZZI })

async function giroATappe({ completo, solo }) {
  const storie = await modulo('motore/storie.js'), tipiMod = await modulo('dati/giocatori-tipo.js'), fine = await modulo('motore/rapporto-fine.js')
  const campagna = await modulo('dati/campagna.js')
  const { CAMPAGNA } = campagna
  const giocatori = valore('--giocatori') ? valore('--giocatori').split(',') : tipiMod.NOMI_TIPO
  const strade = valore('--strade') ? valore('--strade').split(',') : tipiMod.NOMI_STRADA
  const linee = storie.lineeDelGiro({ giocatori, strade, eroi: EROI, semi: SEMI, semiStrade: Math.min(SEMI, Number(valore('--semi-strade')) || SEMI_DELLE_STRADE), semeDa: DA })
  const chiaviDi = l => l.storie.map(x => `${x.eroe}|${x.seme}`)
  const richieste = Object.fromEntries(linee.map(l => [l.id, chiaviDi(l)]))
  // si scrivono i checkpoint solo del giro di difetto (tutti gli eroi, le linee e le storie): un giro più piccolo si serve da quelli, uno più grande non li pesta
  const intero = storie.lineeDelGiro({ eroi: EROI_TUTTI, semi: 30, semiStrade: SEMI_DELLE_STRADE, semeDa: 1 })
  const predefinito = JSON.stringify(Object.fromEntries(intero.map(l => [l.id, chiaviDi(l)]))) === JSON.stringify(richieste)
  const dir = DIR_BASE
  const generale = TARA.split(',').filter(v => v && !/^\d+\./.test(v)).sort().join(',')
  const firme = firmeDelleDiscese({ entrate: [`${SRC}motore/storie.js`], radice: RADICE, campagna, righe: CAMPAGNA.length + 1, generale, propri: ['strumenti/sotterraneo-checkpoint.mjs'],
    escludi: [`${SRC}dati/campagna.js`, `${SRC}dati/giocatori-tipo.js`], extra: sceltaDeiGiocatori(tipiMod) })
  const nValidi = argv.includes('--rifai') ? 0 : validi(dir, firme, richieste)
  const daK = Math.min(nValidi, valore('--da') != null ? Number(valore('--da')) : Infinity)
  const scrive = !TARA && predefinito   // una prova con valori a mano, o un giro diverso, usa i checkpoint che tornano e non scrive i suoi
  const fino = valore('--fino') != null ? Number(valore('--fino')) : CAMPAGNA.length
  const operai = new Operai(TARA)
  const passi = Object.fromEntries(linee.map(l => [l.id, []]))
  let stati = Object.fromEntries(linee.map(l => [l.id, l.storie.map(() => storie.STATO_NUOVO())]))
  const chiavi = []
  console.log(`Giro a tappe: ${linee.length} linee (${linee.map(l => `${l.id} ${l.storie.length}`).join(' · ')}); checkpoint in ${dir.replace(`${RADICE}/`, '')}: ${nValidi} validi su ${firme.length}${scrive ? '' : ' (un giro diverso da quello di difetto, o con valori a mano: non si scrivono)'}`)
  for (let k = 0; k <= fino; k++) {
    const t0 = Date.now()
    const nome = k < CAMPAGNA.length ? CAMPAGNA[k].chiave : 'uscita'
    if (k < daK) {
      const c = leggi(dir, k)
      for (const l of linee) { const sc = scegli(c.linee[l.id], richieste[l.id]); passi[l.id].push(...sc.map(x => x.passo)); stati[l.id] = sc.map(x => x.stato) }
      chiavi.push([nome, 'checkpoint', (Date.now() - t0) / 1000])
      continue
    }
    const items = linee.flatMap(l => l.storie.map((st, i) => ({ l: l.id, i, ...st, stato: stati[l.id][i], tipo: l.tipo, strada: l.strada, sonde: l.sonde, rifai: l.rifai, compatta: l.compatta })))
    const pezzi = Math.min(items.length, POSTI * 3)
    const lavori = Array.from({ length: pezzi }, (_, p) => ({ che: 'tappa', k, items: items.filter((_, n) => n % pezzi === p) }))
    const dati = await operai.esegui(lavori)
    const fuori = Object.fromEntries(linee.map(l => [l.id, new Array(l.storie.length)]))
    for (const x of dati.flat()) fuori[x.l][x.i] = x
    for (const l of linee) { passi[l.id].push(...fuori[l.id].map(x => x.passo)); stati[l.id] = fuori[l.id].map(x => x.stato) }
    if (scrive) scrivi(dir, k, { firma: firme[k], linee: Object.fromEntries(linee.map(l => [l.id, fuori[l.id].map(x => ({ passo: x.passo, stato: x.stato }))])) })
    chiavi.push([nome, 'giocata', (Date.now() - t0) / 1000])
  }
  operai.chiudi()
  tempi.push(['tappe', chiavi.reduce((a, c) => a + c[2], 0)])
  console.log(`Tappe: ${chiavi.map(([n, come, s]) => `${n} ${come === 'checkpoint' ? 'cache' : `${s.toFixed(1)} s`}`).join(' · ')}`)

  // i bersagli: la base (il curioso e il bravo di arma prima)
  const base = linee.filter(l => l.base)
  if (base.length) {
    const r = await stampaIlRapporto(base.flatMap(l => passi[l.id]), { completo, solo, finito: fino >= CAMPAGNA.length - 1 })
    return { r, linee, passi, fine }
  }
  return { r: null, linee, passi, fine }
}

// a che punto è l'eroe alla fine di ogni discesa, per ogni linea
async function stampaLaFine({ linee, passi, fine }, { completo }) {
  console.log('\n══ A che punto è l\'eroe alla fine di ogni discesa (dopo la spesa, prima di scendere ancora) ══')
  console.log(`\n${fine.tabellaAtteso()}`)
  const solo = completo ? null : ['liv', 'scarto', 'dpa', 'valore', 'gemme', 'poz', 'bevute']
  for (const l of linee) console.log(`\n${fine.tabellaFine(fine.fineDi(passi[l.id]), `${l.strada} · ${l.tipo}`, { solo })}`)
}

// una riga per linea: quanti vincono alla prima, dove si ferma, con che forza arriva
async function stampaLeStrade({ linee, passi, fine }) {
  const { CAMPAGNA } = await modulo('dati/campagna.js')
  const { QUOTA_CHE_SI_FERMA, POZIONI_DA_BEONE } = await modulo('dati/giocatori-tipo.js')
  console.log(`\n══ Le strade: vinte alla prima · bloccati (nessuna vittoria in 4 giri), per discesa ══`)
  console.log(' '.repeat(22) + CAMPAGNA.map(t => t.chiave.slice(0, 6).padStart(10)).join('') + '   si ferma · forza lì · forza a fine · danno a fine · valore roba a fine')
  const f = v => (v == null ? '-' : `${Math.round(v * 100)}`)
  const n = v => (v == null ? '-' : `${v > 0 ? '+' : ''}${Math.round(v)}`)
  for (const l of linee) {
    const r = fine.rigaDellaStrada(fine.fineDi(passi[l.id]))
    console.log(`${l.id}`.padEnd(22) + CAMPAGNA.map((_, j) => `${f(r.allaPrima[j])}·${f(r.bloccati[j])}`.padStart(10)).join('') +
      `   ${r.ferma != null ? `${CAMPAGNA[r.ferma].chiave} (≥ ${Math.round(QUOTA_CHE_SI_FERMA * 100)}% bloccati)` : r.fine === CAMPAGNA.length - 1 ? 'arriva in fondo' : `non si ferma fino a ${r.fine >= 0 ? CAMPAGNA[r.fine].chiave : '-'}`} · ${n(r.forzaLa)} · ${n(r.forzaFine)} · ${f(r.dpaFine ? r.dpaFine / 100 : null)}% · ${f(r.valoreFine ? r.valoreFine / 100 : null)}%`)
  }
  console.log('\nPozioni bevute a discesa (media):')
  for (const l of linee) console.log(`${l.id}`.padEnd(22) + fine.fineDi(passi[l.id]).map(x => (x.n ? (x.bevute.reduce((a, b) => a + b, 0) / x.n).toFixed(1) : '-').padStart(10)).join(''))
  console.log(`\nChi vince bevendo (almeno ${POZIONI_DA_BEONE} pozioni in una discesa vinta) contro chi vince bevendo meno: quota delle discese vinte, forza sull'atteso e danno a risposta all'uscita (mediane), discesa dopo vinta alla prima`)
  const c = v => (v == null ? '-' : `${Math.round(v)}`), p = v => (v == null ? '-' : `${Math.round(v * 100)}%`)
  for (const l of linee) {
    const b = fine.chiVinceBevendo(fine.fineDi(passi[l.id]))
    console.log(`${l.id}`.padEnd(22) + `${p(b.quota).padStart(4)} bevendo (${b.beve.n} su ${b.beve.n + b.altri.n}) · forza ${n(b.beve.scarto)} contro ${n(b.altri.scarto)} · danno ${c(b.beve.dpa)}% contro ${c(b.altri.dpa)}% · dopo alla prima ${p(b.beve.dopo)} contro ${p(b.altri.dopo)}`)
  }
}

/* ═══════════ si parte ═══════════ */
const inizio = Date.now()
let uscita = 0
if (TARA) {
  // anche questo processo vede i valori provati (la tabella delle specie si legge qui)
  const { CAMPAGNA } = await modulo('dati/campagna.js'), zone = await modulo('dati/zone.js'), livelli = await modulo('dati/livelli.js')
  for (const voce of TARA.split(',').filter(Boolean)) {
    const [k, campo] = voce.split('=')[0].split('.'), v = Number(voce.split('=')[1])
    if (k === 'livelli') livelli.CURVA_DELL_ESPERIENZA[campo] = v
    else if (k === 'potenza') livelli.VALORE_DELLA_POTENZA[campo] = v
    else if (k === 'zona') { if (campo in zone.CURVA_DELLE_ZONE) zone.CURVA_DELLE_ZONE[campo] = v; else zone.FORMA_DELLA_ZONA[campo] = v }
    else CAMPAGNA[Number(k)][campo] = v
  }
}
if (argv.includes('--specie')) await stampaLeSpecie()
else if (PRESTO) uscita = await presto()
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
  const giro = await giroATappe({ completo: argv.includes('--tutto'), solo: valore('--discese') ? numeri('--discese') : null })
  await cronometra('fine', () => stampaLaFine(giro, { completo: argv.includes('--tutto') }))
  await cronometra('strade', () => stampaLeStrade(giro))
  await cronometra('specie', () => stampaLeSpecie())
}
stampaITempi(inizio)
process.exit(uscita)
