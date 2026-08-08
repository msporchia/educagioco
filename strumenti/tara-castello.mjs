/* ═══════════════════════════════════════════════════════════════════
   TARARE LE ONDATE — quanto devono essere duri i nemici

   Il vecchio modo era una formula sola per tutta la tappa: la vita
   cresceva di un tanto a ondata, e il numero si sceglieva guardando
   l'ondata più dura. Il difetto era matematico, non di gusto: se tari
   sulla peggiore, tutte le altre restano larghe. Le misure lo dicevano
   chiaro — la prima ondata di ogni tappa aveva margine 1,35 e l'ultima
   2,5. Cioè: la prima metà si giocava, la seconda si guardava.

   Adesso ogni ondata ha la sua vita, cercata giocandola per davvero.
   Il criterio è uno solo:

     chi spende tutta la sua energia deve vedere i mostri arrivare
     **quasi** al castello, ogni volta.

   «Quasi» è il BERSAGLIO qui sotto: la frazione di strada che il più
   avanti di loro percorre prima di cadere. A 0,85 il mostro muore a un
   passo dalle mura — si vince, ma con il fiato sul collo, e chi tiene
   in tasca un decimo dell'energia comincia a prenderle.

   Il conto lo fa una bisezione: la vita è monotòna rispetto a dove
   muoiono i nemici, quindi bastano una quindicina di partite simulate
   per ondata. Quindici tappe più la partita libera — centotrentotto
   ondate in tutto — costano una ventina di secondi, senza aprire un
   browser.

     npm run tara                 # tara tutto e riscrive il file dati
     npm run tara -- --prova      # tara e stampa, senza scrivere niente
     npm run tara -- --da 0.6 --bersaglio 0.85
   ═══════════════════════════════════════════════════════════════════ */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { TAPPE, LIBERA, firmaEquilibrio, vitaDiOnda, chiaveTappa } from '../src/data/castello.js'
import { gioca, PROFILI } from './simula-castello.mjs'

const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..')

const argv = process.argv.slice(2)
const prova = argv.includes('--prova')
const iB = argv.indexOf('--bersaglio')
/* ── quanto vicino al limite si gioca ──

   Il limite di un'ondata è la vita oltre la quale chi spende tutto
   comincia a perdere cuori: sopra quella soglia la difesa che si può
   avere in campo non ce la fa, e non per come si gioca. Da lì si
   scende di una frazione, ed è quella frazione la difficoltà:

     0,55  ne passa metà: si impara, si sbaglia, si recupera
     0,90  dieci punti sotto il muro: si vince col fiato sul collo

   Si misura il limite e non «dove muore il primo mostro» perché le
   postazioni si occupano partendo dal castello: finché le torri sono
   due, il mostro cammina comunque per due terzi della strada prima
   che qualcuno gli spari, e quel numero raccontava la geometria del
   campo invece della forza dei nemici.

   La frazione cresce lungo la tappa. Tenerla alta dappertutto
   l'aveva resa ingiocabile: l'energia qui la lasciano i nemici
   uccisi, quindi chi resta indietro di un soffio incassa meno, compra
   meno e resta indietro di più — una spirale che nella prima versione
   ammazzava alla quarta ondata il bambino che sbaglia un conto su
   quattro. La tensione va messa **in fondo**, dove un errore non ha
   più il tempo di trascinarsi dietro tutto il resto. Ed è anche come
   si racconta una battaglia.

   ── perché la corsa è più corta di prima: 60 → 85 e non 55 → 95 ──

   Da quando una tappa costa i calcoli che promette, le tappe sono
   corte: quattro ondate la prima, e sei acquisti in tutto. Con sei
   acquisti, perderne uno vuol dire perdere un sesto della difesa — e
   una rampa che finisce al 95% chiedeva, proprio nelle ultime ondate,
   una difesa che il bambino che sbaglia un conto su quattro non aveva
   più il tempo di ricomprare. Il risultato era l'anello di sicurezza
   qui sotto che scattava su dieci tappe su sedici, cioè una taratura
   che si allargava da sola e diceva 95 mentre giocava a 65.

   La rampa buona per tappe corte parte più in alto e finisce più in
   basso: si è sotto pressione da subito e non si arriva mai al muro.
   Con 60 → 85 l'anello non scatta più su nessuna tappa, chi tiene in
   tasca un quarto dell'energia perde quattordici volte su quindici, e
   chi ne tiene un decimo comincia a perdere dalla seconda campagna. */
const iD = argv.indexOf('--da')
const DA = iD >= 0 ? Number(argv[iD + 1]) : 0.6
const A = iB >= 0 ? Number(argv[iB + 1]) : 0.85
const vicinanzaDi = (o, ondate, a = A) => DA + (a - DA) * ((o - 1) / Math.max(1, ondate - 1))

/* ── l'anello di sicurezza ──
   Stringere è facile: basta alzare la frazione finché non passa più
   nessuno. Ma il gioco non è per chi non sbaglia mai — è per chi sta
   imparando a fare le operazioni in colonna, e quindi ne sbaglia una
   ogni quattro. Quel bambino lì la tappa la deve finire.

   Quindi si tara al massimo della tensione, si prova con il
   `pasticcione` — tre partite, tre serie di errori diverse — e se non
   ce la fa si allarga di cinque punti e si ricomincia. Il numero che
   esce non è quello che volevo: è il più teso che regge. */
const SEMI = [7, 13, 29]
const SCALINI = [0, 0.05, 0.1, 0.15, 0.2, 0.3]

/* Il limite: la vita più bassa che fa entrare almeno un nemico. Sopra
   di lei si perde, sotto si tiene — quindi si trova per bisezione. */
function limiteDi(tappa, onda, istantanea, opzioni) {
  let tiene = 4, cede = 60000
  for (let giro = 0; giro < 16; giro++) {
    const v = (tiene + cede) / 2
    tappa.vite[onda - 1] = v
    const r = gioca(tappa, { ...opzioni, da: istantanea, finoA: onda })
    const corsa = r.storia[r.storia.length - 1]
    if ((corsa?.persi || 0) > 0 || r.esito === 'persa') cede = v; else tiene = v
  }
  return cede
}

/* la vita di un'ondata: una frazione del suo limite, e la misura di
   quanto si è avvicinato il più avanti di loro */
function vitaDiTaratura(tappa, onda, istantanea, opzioni, a) {
  const vicinanza = vicinanzaDi(onda, tappa.ondate, a)
  const limite = limiteDi(tappa, onda, istantanea, opzioni)
  const vita = Math.max(5, Math.round(limite * vicinanza))
  tappa.vite[onda - 1] = vita
  const r = gioca(tappa, { ...opzioni, da: istantanea, finoA: onda })
  const corsa = r.storia[r.storia.length - 1]
  return { vita, limite: Math.round(limite), vicinanza,
           avanzata: corsa?.avanzata || 0, persi: corsa?.persi || 0, esito: r.esito }
}

/* ── una tappa, ondata per ondata ──
   In ordine, perché ogni ondata parte da dove l'ha lasciata la
   precedente: le torri che ha in campo chi spende tutto, e l'energia
   che gli è rimasta. Tarare l'ondata 7 senza aver prima fissato le
   sei di prima vorrebbe dire tararla su una difesa immaginaria. */
function taraTappa(tappa, a) {
  const t = { ...tappa, vite: [] }
  const righe = []
  for (let o = 1; o <= tappa.ondate; o++) {
    const istantanee = new Map()
    // si rigioca dall'inizio con le vite già fissate, per fotografare la
    // partita così com'è davvero quando l'ondata `o` sta per partire
    gioca(t, { ...PROFILI.misura, finoA: o - 1, istantanee })
    const foto = istantanee.get(o)
    if (!foto) { righe.push({ onda: o, vita: t.vite[o - 2] || 42, cieca: true }); continue }
    const r = vitaDiTaratura(t, o, foto, PROFILI.misura, a)
    t.vite[o - 1] = r.vita
    righe.push({ onda: o, ...r, torri: foto.torri.map(x => x.lv).join(''),
                 energia: Math.round(foto.stato.energia) })
  }
  return { vite: spiana(t.vite), righe }
}

/* ── la curva non torna mai indietro ──
   Il limite misurato ondata per ondata fa i gradini: la difesa cresce a
   scatti — un potenziamento comprato, una torre in più — e il mostro
   dell'ondata cambia, con la sua debolezza. Ne uscivano ondate più
   molli di quella prima, che a chi gioca sembrano un errore.

   Si spiana **verso il basso**, tirando ogni ondata al livello della
   più mite che la segue: al rialzo si andrebbe sopra il limite trovato,
   cioè si chiederebbe una difesa che a quel punto non si può avere. */
function spiana(vite) {
  const out = vite.slice()
  for (let i = out.length - 2; i >= 0; i--) out[i] = Math.min(out[i], out[i + 1])
  return out
}

/* la tappa più tesa che il bambino vero riesce ancora a finire */
function taraFinchePassa(tappa) {
  let ultimo = null
  for (const giù of SCALINI) {
    const a = A - giù
    const { vite, righe } = taraTappa(tappa, a)
    const prove = SEMI.map(s => gioca({ ...tappa, vite }, { ...PROFILI.pasticcione, s }))
    ultimo = { vite, righe, a, prove }
    if (prove.every(r => r.esito === 'vinta')) return ultimo
  }
  return ultimo          // non ce l'ha fatta nemmeno larghissima: lo dirà il collaudo
}

/* ── il collaudo ──
   Tarare non basta: bisogna vedere che tappa ne esce per chi la gioca
   in modi diversi. Sono i quattro bambini di `PROFILI`. */
function collauda(tappa) {
  const esiti = {}
  for (const [nome, p] of Object.entries(PROFILI)) esiti[nome] = gioca(tappa, p)
  return esiti
}

const vinta = r => r.esito === 'vinta'
const riga = r => `${(vinta(r) ? 'superata' : r.esito === 'persa' ? `persa o${r.onda}` : r.esito).padEnd(11)}` +
                  ` ${r.cuori}❤ [${r.livelli.join(',')}] speso ${r.speso}/${r.guadagnato}⚡` +
                  ` (in tasca ${(r.inTasca * 100).toFixed(0)}%)`

/* ── anche la partita libera ──
   Non finisce mai, quindi non si può tabellare tutta: se ne tarano le
   prime venti ondate come una tappa qualsiasi, e da lì in poi la vita
   continua a salire con la stessa progressione (`OLTRE`). Senza questo,
   chi ha appena finito una campagna tarata al filo trovava nella libera
   dei mostri di burro per quaranta ondate. */
const ONDATE_LIBERE = 20
const libera = { ...LIBERA, ondate: ONDATE_LIBERE, attesa: LIBERA.attesa }

const fatte = {}
let oltre = 1.2
console.log(`si gioca dal ${(DA * 100).toFixed(0)}% del limite nella prima ondata ` +
            `al ${(A * 100).toFixed(0)}% nell'ultima\n`)
for (const [i, tappa] of [...TAPPE.entries(), [TAPPE.length, libera]]) {
  const via = Date.now()
  const { vite, righe, a, prove } = taraFinchePassa(tappa)
  fatte[chiaveTappa(tappa)] = vite
  const reggono = prove.filter(r => r.esito === 'vinta').length
  console.log(`${i + 1}. ${tappa.nome} — ${tappa.ondate} ondate · ${tappa.posti} posti · ` +
              `cap ${tappa.cap} · fino al ${(a * 100).toFixed(0)}% del limite` +
              `${a < A ? ` (allargata da ${(A * 100).toFixed(0)}%: il pasticcione non passava)` : ''}` +
              ` · ${((Date.now() - via) / 1000).toFixed(1)}s`)
  if (reggono < SEMI.length)
    console.log(`   ⚠ il pasticcione la finisce solo ${reggono} volte su ${SEMI.length}`)
  for (const r of righe)
    console.log(`   o${String(r.onda).padStart(2)}  vita ${String(r.vita).padStart(5)}` +
                ` (era ${String(Math.round(vitaDiOnda(r.onda, tappa.durezza))).padStart(4)})` +
                `  limite ${String(r.limite).padStart(5)} × ${(r.vicinanza * 100).toFixed(0)}%` +
                `  torri [${r.torri || '—'}] ⚡${String(r.energia ?? '').padStart(3)}` +
                `  arrivati al ${((r.avanzata ?? 0) * 100).toFixed(0)}%` +
                `${r.persi ? ' · −' + r.persi + '❤' : ''}`)
  if (tappa === libera) {
    /* di quanto cresce, alla fine: è il passo con cui la vita continuerà
       a salire oltre l'ultima ondata tarata */
    const ultime = vite.slice(-6)
    const passi = ultime.slice(1).map((v, k) => v / ultime[k]).filter(x => x > 1)
    oltre = passi.length ? Math.round((passi.reduce((s, x) => s + x, 0) / passi.length) * 100) / 100 : 1.2
    console.log(`   oltre l'ondata ${ONDATE_LIBERE} la vita continua a salire di ×${oltre} per ondata`)
  }
  // il collaudo si fa sulla tappa con le vite appena trovate
  const esiti = collauda({ ...tappa, vite, oltre })
  for (const [nome, r] of Object.entries(esiti)) console.log(`   ${nome.padEnd(12)} ${riga(r)}`)
  console.log()
}

if (prova) {
  console.log('— prova: il file dei dati non è stato toccato')
} else {
  const corpo = `/* GENERATO da \`npm run tara\` — non si scrive a mano.

   La vita dei nemici di ogni ondata di ogni tappa, trovata giocando la
   tappa migliaia di volte con il motore vero (\`strumenti/tara-castello.mjs\`).
   Il criterio: ogni ondata vale una frazione del suo limite — la vita
   oltre la quale chi spende tutto non ce la fa più — e la frazione va
   dal ${(DA * 100).toFixed(0)}% della prima ondata al ${(A * 100).toFixed(0)}% dell'ultima.
   La \`FIRMA\` è l'impronta dei numeri da cui è stata ricavata: se prezzi,
   torri o tappe cambiano, il test se ne accorge e chiede di rifarla. */
export const VITE = {
${Object.entries(fatte).map(([nome, v]) =>
    `  ${JSON.stringify(nome)}: [${v.join(', ')}],`).join('\n')}
}
/* di quanto cresce la vita nella partita libera dopo l'ultima ondata
   tarata: da lì in poi non c'è tabella, c'è questa progressione */
export const OLTRE = ${oltre}
export const FIRMA = ${JSON.stringify(firmaEquilibrio())}
export const BERSAGLIO = [${DA}, ${A}]
`
  writeFileSync(join(RADICE, 'src/data/taratura-castello.js'), corpo)
  console.log('scritto src/data/taratura-castello.js — ora rilancia i test')
}
