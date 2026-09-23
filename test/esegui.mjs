#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   IL LANCIATORE

     node test/esegui.mjs              tutto
     node test/esegui.mjs unita        solo quelli che non aprono il browser
     node test/esegui.mjs integrazione solo quelli nel browser
     node test/esegui.mjs animali      solo i file che contengono "animali"
     node test/esegui.mjs --niente-build   non ricompila prima
     node test/esegui.mjs --tempo=600      alza il tempo massimo per test
     node test/esegui.mjs torri --scatti   lascia anche le foto in test/scatti/
     node test/esegui.mjs --svelti         solo i test sotto il secondo
     node test/esegui.mjs --alla-volta=1   uno alla volta, come una volta

   Ogni test è un processo a sé: uno che va in crash non porta via gli
   altri, e il codice di uscita è quello che conta. Chi esce con 0 è
   passato, chiunque altro no. Ed è per questo che possono girare in
   tanti insieme senza chiedere niente a nessun test: vedi «quanti alla
   volta», più sotto.

   E ognuno ha un tempo massimo. Serve perché è già capitato che una
   simulazione lunga tenesse in ostaggio tutta la suite per un quarto
   d'ora: un test che non finisce è un test rotto, e va detto subito
   invece di far aspettare al buio.

   I test di integrazione girano su `dist/index.html`, quindi la build
   la fa il lanciatore: dimenticarsela vuol dire provare la versione di
   ieri e non accorgersene.

   Le foto invece **non** si fanno da sole. Nessun test le guarda: sono
   per gli occhi di chi lavora, e farle a ogni giro costa secondi e
   lascia in giro immagini che cambiano da sole (il gioco è pieno di
   caso). Si chiedono con `--scatti`, quando servono davvero, e finiscono
   tutte in `test/scatti/`, che git non guarda.

   E poi c'è `--svelti`. Aspettare secondi per un test mentre si scrive
   codice è la differenza fra lanciarli spesso e smettere di lanciarli:
   un pugno di giochi si vincono giocandoli davvero, con un finto
   giocatore che finisce la campagna intera, e da soli fanno gran parte
   dei secondi della suite. Non sono rotti, sono semplicemente il prezzo
   di provare sul serio invece che a occhio — ma quel prezzo non va
   pagato a ogni riga scritta, solo quando si tocca quella parte lì.
   `--svelti` tiene fuori chi dichiara un `tempo:` (lo stesso di sopra,
   in secondi) da 100 in su — cioè chi ha già detto «ci metto sul serio»
   — e fa girare il resto: la parte che dà una risposta prima ancora di
   aver tolto le dita dalla tastiera.
   ═══════════════════════════════════════════════════════════════════ */
import { spawn } from 'node:child_process'
import { readdirSync, existsSync, readFileSync, writeFileSync, mkdirSync, mkdtempSync,
         openSync, closeSync, rmSync } from 'node:fs'
import { availableParallelism, freemem, tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, relative } from 'node:path'

const QUI = dirname(fileURLToPath(import.meta.url))
const RADICE = resolve(QUI, '..')
const GRUPPI = ['unita', 'integrazione']

const argomenti = process.argv.slice(2)
const senzaBuild = argomenti.includes('--niente-build')
const conScatti = argomenti.includes('--scatti')
const soloSvelti = argomenti.includes('--svelti')
const filtri = argomenti.filter(a => !a.startsWith('--'))
const TEMPO = Number(argomenti.find(a => a.startsWith('--tempo='))?.slice(8)) || 240

/* ── QUANTI ALLA VOLTA ──
   Un test di integrazione passa quasi tutta la sua vita **fermo**:
   aspetta un'animazione, un salvataggio a scatto ritardato, un cliente
   che arriva, e intanto la macchina non fa niente. In fila quelle
   attese si sommano — più di dieci minuti per la suite intera — e
   insieme no: otto alla volta costa un minuto e mezzo. I test erano
   già processi separati, con ognuno il suo Chrome e il suo archivio
   vuoto, quindi non c'è niente da sistemare nei test: basta non
   aspettare che finisca uno per far partire il successivo.

   Otto e non di più perché la macchina fa anche altro — l'editor, un
   altro worktree, un altro giro di test — e a otto la CPU resta libera
   per due terzi; a dodici si guadagnano venti secondi, ma la si occupa
   quasi tutta e i Chrome si prendono cinque giga
   (`docs/tempi-dei-test.md`). Sotto i sedici processori le corsie sono
   la metà di quelli che ci sono. `--alla-volta=1` è il lanciatore di
   prima, riga per riga: serve quando un test si comporta male solo in
   compagnia, per sapere se è lui o la folla.

   **E non più di una per ogni giga libero**, contato alla partenza
   (`freemem`, che su Linux è la memoria che il sistema dice
   *disponibile*). Un test nel browser ne occupa mezzo, e qui capita
   spesso che due sessioni lancino la chiusura insieme da due worktree:
   otto Chrome a testa sono sedici, e una macchina che va in swap non
   rallenta solo i test — li fa fallire, perché le attese sono tarate su
   un Chrome che risponde. Con metà della memoria libera lasciata a chi
   c'era già, la seconda sessione parte con meno corsie e lo dice. */
const PER_MEMORIA = Math.floor(freemem() / 2 ** 30)
const CORSIE = Math.max(1, Math.min(8, Math.floor(availableParallelism() / 2), PER_MEMORIA))
const ALLA_VOLTA = Number(argomenti.find(a => a.startsWith('--alla-volta='))?.slice(13)) || CORSIE
const strette = ALLA_VOLTA === CORSIE && CORSIE === PER_MEMORIA && CORSIE < 8

/* Un test può chiedersi più tempo scrivendo `tempo: 900` fra i primi
   commenti: le simulazioni lunghe sono legittime, purché lo dichiarino.
   Chi non dice niente ha il tempo normale, e se sfora è rotto.

   La riga dev'essere SOLO `tempo:` (a parte spazi davanti): una
   dichiarazione vera sta sempre da sola sulla propria riga, mai in
   mezzo a una frase. Senza l'ancoraggio a inizio riga, `\s` attraversa
   anche gli a capo e la regex legge "tempo:" pure dentro la prosa di un
   commento — è già successo con "...perde tempo:\n\n  1. il grafo..."
   che veniva letto come "tempo: 1". */
function tempoDichiarato(file) {
  const testa = readFileSync(file, 'utf8').slice(0, 1200)
  const m = /^[ \t]*tempo:\s*(\d{1,4})/m.exec(testa)
  return m ? Number(m[1]) : 0
}

/* La soglia di `--svelti`. Chi non dichiara niente vale 0 e resta
   dentro: la maggioranza dei test è così. Chi dichiara un tempo vero
   (100 e oltre — sotto sta solo qualche margine simbolico, come i 10-15
   di saperi/quiz-pesi, che restano test istantanei) ha già detto da sé
   di essere un altro genere di prova, e qui viene preso in parola.

   L'integrazione non entra mai: apre Chrome, e Chrome da solo costa più
   di un secondo prima ancora di toccare un pulsante. Non è una domanda
   di soglia, è la natura del test — dichiararsi svelto non basterebbe. */
const SOGLIA_SVELTA = 100
const svelto = t => t.gruppo !== 'integrazione' && t.suo < SOGLIA_SVELTA

function raccogli() {
  const fuori = []
  for (const g of GRUPPI) {
    const dir = resolve(QUI, g)
    if (!existsSync(dir)) continue
    /* ── ANCHE NELLE SOTTOCARTELLE ──
       Un test per argomento va bene finché l'argomento è un gioco. Per i
       pezzi di un motore no: «le azioni del Generale» in un file solo
       diventa un elenco in cui non si vede più cosa è provato e cosa
       no. Con le cartelle il nome del file È l'indice — `generale/
       azioni/vai` — e a colpo d'occhio si sa cosa manca. */
    for (const f of readdirSync(dir, { recursive: true }).sort())
      if (String(f).endsWith('.test.mjs')) {
        const file = resolve(dir, f)
        fuori.push({ gruppo: g, nome: String(f).replace(/\.test\.mjs$/, '').replace(/\\/g, '/'),
                     file, suo: tempoDichiarato(file) })
      }
  }
  if (!filtri.length) return fuori
  return fuori.filter(t => filtri.some(f => t.gruppo === f || t.nome.includes(f)))
}

/* `raccogli` è un file dove tenere da parte quello che il test scrive,
   invece di lasciarlo passare: serve quando i test girano insieme (vedi
   sotto). Un file e non un tubo, per due ragioni. Stdout e stderr
   scritti nello stesso file restano nell'ordine in cui sono usciti, e
   in due tubi separati no: una riga di stderr finiva prima o dopo
   quelle che le stavano attorno. E un file non tiene vivo nessuno,
   mentre un tubo sì: Chrome è un nipote, sopravvive al test fermato per
   il tempo, e finché ha in mano l'altro capo il 'close' non arriva — il
   lanciatore resterebbe appeso proprio sul test che doveva fermare. */
function esegui(comando, argomenti, opzioni = {}) {
  const { secondi = 0, raccogli = null, ...resto } = opzioni
  return new Promise(ok => {
    const fd = raccogli ? openSync(raccogli, 'w') : null
    const p = spawn(comando, argomenti, { cwd: RADICE, stdio: raccogli ? ['ignore', fd, fd] : 'inherit', ...resto })
    if (raccogli) closeSync(fd)                    // il figlio ha il suo: questo non serve più
    let scaduto = false
    const sveglia = secondi ? setTimeout(() => { scaduto = true; p.kill('SIGKILL') }, secondi * 1000) : null
    const fine = codice => {
      clearTimeout(sveglia)
      let uscita = ''
      if (raccogli) try { uscita = readFileSync(raccogli, 'utf8'); rmSync(raccogli) } catch (e) { /* già letto */ }
      ok({ codice: scaduto ? 'tempo' : (codice ?? 1), uscita })
    }
    p.on('close', fine)
    p.on('error', () => fine(1))
  })
}

/* ── PRIMA I LUNGHI ──
   Con più corsie l'ordine conta: il giro finisce quando finisce l'ultima
   corsia, e un test da un minuto partito per ultimo allunga il totale di
   un minuto intero, mentre partito per primo si perde in mezzo agli
   altri. Quindi si parte dai più lunghi — e «lungo» non si dichiara, si
   ricorda: il lanciatore si segna quanto ci ha messo ogni test e la
   volta dopo li mette in fila da lì. Il quaderno sta in
   `node_modules/.cache/`, che è il posto degli strumenti per queste
   cose: cambia a ogni giro e da macchina a macchina, e in git sarebbe
   solo rumore. Chi non c'è ancora (un test nuovo, o la prima volta) ha
   una stima per gruppo, larga: un test lungo partito tardi costa molto
   di più di uno corto partito presto. */
const QUADERNO = resolve(RADICE, 'node_modules/.cache/educagioco/tempi-dei-test.json')
const chiave = t => `${t.gruppo}/${t.nome}`

function tempiDiPrima() {
  try { return JSON.parse(readFileSync(QUADERNO, 'utf8')) } catch (e) { return {} }
}

function ricordaTempi(esiti) {
  try {
    const tempi = tempiDiPrima()
    for (const e of esiti) tempi[chiave(e)] = Math.round(e.ms / 10) / 100
    mkdirSync(dirname(QUADERNO), { recursive: true })
    writeFileSync(QUADERNO, JSON.stringify(tempi, null, 1) + '\n')
  } catch (e) { /* senza quaderno la volta dopo l'ordine è solo meno buono */ }
}

const stima = (t, tempi) => tempi[chiave(t)]
  ?? (t.gruppo === 'integrazione' ? 30 : t.suo >= SOGLIA_SVELTA ? 5 : 1)

const raccolti = raccogli()
if (!raccolti.length) {
  console.log('nessun test trovato' + (filtri.length ? ' per: ' + filtri.join(', ') : ''))
  process.exit(1)
}

const lenti = soloSvelti ? raccolti.filter(t => !svelto(t)) : []
const prove = soloSvelti ? raccolti.filter(svelto) : raccolti
if (!prove.length) {
  console.log('nessun test svelto trovato' + (filtri.length ? ' per: ' + filtri.join(', ') : ''))
  process.exit(1)
}

const serveBrowser = prove.some(t => t.gruppo === 'integrazione')
if (serveBrowser && !senzaBuild) {
  console.log('· ricompilo dist/index.html')
  const { codice } = await esegui('npm', ['run', 'build'], { stdio: 'ignore' })
  if (codice !== 0) { console.log('❌ la build fallisce: i test non direbbero niente di utile'); process.exit(1) }
}

/* ── L'USCITA A BLOCCHI ──
   Otto test che scrivono insieme sullo stesso terminale fanno
   un'insalata di righe in cui non si capisce di chi è un guasto. Con
   più corsie l'uscita di ognuno si tiene da parte e si stampa intera
   quando quel test finisce: l'ordine è quello d'arrivo e non più
   quello alfabetico, ma ogni blocco è identico a quello che si
   vedrebbe lanciando il file da solo. Con una corsia sola — o un test
   solo, cioè chi sta provando un file — l'uscita scorre dal vivo come
   prima, e nell'ordine di prima: un test da un minuto che per un
   minuto non dice niente sembra appeso. */
const corsie = Math.max(1, Math.min(ALLA_VOLTA, prove.length))
const dalVivo = corsie === 1
const USCITE = dalVivo ? null : mkdtempSync(resolve(tmpdir(), 'educagioco-test-'))
const tempi = tempiDiPrima()
const coda = dalVivo ? [...prove] : [...prove].sort((a, b) => stima(b, tempi) - stima(a, tempi))

console.log(`\n▶ ${prove.length} test` + (dalVivo ? '' : `, ${corsie} alla volta`)
            + (strette ? ` — di più la memoria libera non ne regge` : '') + '\n')
const partenza = Date.now()
const esiti = []
async function corsia() {
  for (let t = coda.shift(); t; t = coda.shift()) {
    const etichetta = chiave(t)
    const testa = `── ${etichetta} ${'─'.repeat(Math.max(0, 56 - etichetta.length))}`
    if (dalVivo) console.log(testa)
    const inizio = Date.now()
    const suo = Math.max(TEMPO, t.suo)
    const ambiente = conScatti ? { ...process.env, SCATTI: '1' } : process.env
    const raccogli = USCITE && resolve(USCITE, etichetta.replace(/\//g, '_') + '.txt')
    const { codice, uscita } = await esegui('node', [relative(RADICE, t.file)],
                                            { secondi: suo, env: ambiente, raccogli })
    if (!dalVivo) process.stdout.write(testa + '\n' + uscita + (uscita.endsWith('\n') || !uscita ? '' : '\n'))
    if (codice === 'tempo')
      console.log(`   ⏱ fermato dopo ${suo}s — se ci mette davvero tanto, scriva "tempo: ${suo * 2}" in cima`)
    esiti.push({ ...t, codice, ms: Date.now() - inizio })
    console.log('')
  }
}
await Promise.all(Array.from({ length: corsie }, corsia))
if (USCITE) rmSync(USCITE, { recursive: true, force: true })
ricordaTempi(esiti)

/* il riepilogo torna in ordine alfabetico: lì si cerca un nome, non un
   momento */
const posto = new Map(prove.map((t, i) => [t.file, i]))
esiti.sort((a, b) => posto.get(a.file) - posto.get(b.file))
const durata = s => (s = Math.round(s)) < 60 ? `${s}s` : `${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s`

const rotti = esiti.filter(e => e.codice !== 0)
console.log('═'.repeat(60))
for (const e of esiti) {
  const segno = e.codice === 0 ? '✅' : e.codice === 'tempo' ? '⏱' : '❌'
  console.log(` ${segno} ${e.gruppo}/${e.nome}`.padEnd(46) + `${(e.ms / 1000).toFixed(1)}s`)
}
console.log('═'.repeat(60))
console.log((rotti.length ? `❌ ${rotti.length} test su ${esiti.length} non passano`
                          : `✅ tutti e ${esiti.length} passano`) + `, in ${durata((Date.now() - partenza) / 1000)}`)
if (lenti.length)
  console.log(`saltati ${lenti.length} test lenti: node test/esegui.mjs`)
process.exitCode = rotti.length ? 1 : 0
