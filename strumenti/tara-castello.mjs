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
   per ondata. Venti tappe più le quattro partite libere — a venti
   ondate ciascuna — costano un minuto scarso, senza aprire un browser.

     npm run tara                 # tara tutto e riscrive il file dati
     npm run tara -- --prova      # tara e stampa, senza scrivere niente
     npm run tara -- --da 0.6 --bersaglio 0.85
   ═══════════════════════════════════════════════════════════════════ */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { TAPPE, LIBERE, ONDATE_TARATE, firmaEquilibrio, vitaDiOnda, chiaveTappa }
  from '../src/data/castello.js'
import { Ondate } from '../src/motore/castello/ondate.js'
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
   esce non è quello che volevo: è il più teso che regge.

   ── e si allarga dove cede, non dappertutto ──
   Prima l'allargamento abbassava tutta la rampa insieme. Nella Grotta
   non bastava a niente: il pasticcione e `pigro` — quello che tiene in
   tasca un quarto dell'energia, e che la tappa **non** deve finire —
   cadevano tutti e due all'ondata 5, contro gli stessi golem, con le
   stesse due bombe in campo. Abbassando tutto passavano insieme, e la
   tappa che il pasticcione finiva la finiva anche chi non spendeva:
   con una rampa sola non c'era nessun punto che li separasse.
   Li separa l'ultima ondata, dove chi ha speso tutto ha una torre in
   più. Allora si abbassano **solo le ondate dove il pasticcione perde
   cuori**, cinque punti per volta, e le altre restano tese: chi cade
   per aver sbagliato i conti trova l'ondata che l'ha fermato più
   morbida, chi cade per non aver speso trova il muro in fondo. Mai più
   di `GIU_MAX` sotto la rampa, e al massimo `GIRI_ANELLO` giri. */
const SEMI = [7, 13, 29]
const GIU_MAX = 0.3, GIRI_ANELLO = 16

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
function vitaDiTaratura(tappa, onda, istantanea, opzioni, giù) {
  const vicinanza = vicinanzaDi(onda, tappa.ondate) - giù
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
function taraTappa(tappa, giù) {
  const t = { ...tappa, vite: [] }
  const righe = []
  for (let o = 1; o <= tappa.ondate; o++) {
    const istantanee = new Map()
    // si rigioca dall'inizio con le vite già fissate, per fotografare la
    // partita così com'è davvero quando l'ondata `o` sta per partire
    gioca(t, { ...PROFILI.misura, finoA: o - 1, istantanee })
    const foto = istantanee.get(o)
    /* il metro non ci è arrivato vivo: l'ondata si tara «alla cieca»,
       con la vita di quella prima — e la si scrive, se no la tabella
       resta corta di un'ondata e la tappa ne ha una senza vita */
    if (!foto) {
      t.vite[o - 1] = t.vite[o - 2] || 42
      righe.push({ onda: o, vita: t.vite[o - 1], cieca: true })
      continue
    }
    const r = vitaDiTaratura(t, o, foto, PROFILI.misura, giù[o - 1] || 0)
    t.vite[o - 1] = r.vita
    righe.push({ onda: o, ...r, torri: foto.torri.map(x => x.lv).join(''),
                 energia: Math.round(foto.stato.energia), chi: chiDi(tappa, o) })
  }
  return { vite: spiana(t.vite, tappa), righe }
}

/* chi arriva all'ondata `o`: il mostro, «capo» se è l'ondata del capo,
   «mista» se ne arrivano due tipi insieme (`coppiaDellOnda` in
   `data/mostri.js`) */
function chiDi(tappa, o) {
  const b = new Ondate(tappa).bestiaDi(o)
  return b.capo ? 'capo' : b.con ? 'mista' : b.id
}

/* ── la curva non torna mai indietro ──
   Il limite misurato ondata per ondata fa i gradini: la difesa cresce a
   scatti — un potenziamento comprato, una torre in più — e il mostro
   dell'ondata cambia, con la sua resistenza. Ne uscivano ondate più
   molli di quella prima, che a chi gioca sembrano un errore.

   Si spiana **verso il basso**, tirando ogni ondata al livello della
   più mite che la segue: al rialzo si andrebbe sopra il limite trovato,
   cioè si chiederebbe una difesa che a quel punto non si può avere.

   ── e da quando c'è l'immunità, si spiana mostro per mostro ──
   Con le immunità il limite di un'ondata dipende soprattutto da **chi
   arriva**: un'ondata di golem la fermano solo le bombe, una di
   pipistrelli solo arcieri e magia, e i loro limiti non stanno sulla
   stessa scala — a parità di torri in campo possono stare a un fattore
   tre l'uno dall'altro. Spianare tutta la fila sull'ondata più mite
   voleva dire che un golem in fondo alla tappa ammorbidiva tutti quelli
   prima di lui, pipistrelli compresi: la tappa intera tarata sul suo
   mostro più scomodo.
   Adesso si spiana **dentro ogni mostro**: il golem della sesta ondata
   non è mai più molle di quello della terza, e così il pipistrello, e
   così il capo. La promessa che `unita/castello` conta è quella che a
   schermo si vede — lo stesso mostro, più avanti, non torna mai più
   debole — e un golem con meno vita di un pipistrello non è un
   errore: ce l'ha perché lo apre una torre sola.

   ── le miste fanno gruppo a sé, come il capo ──
   Un'ondata di golem e pipistrelli mescolati non sta sulla scala dei
   golem né su quella dei pipistrelli: la ferma una difesa che ha
   **tutte e due** le risposte, e il suo limite può stare sotto quello
   di tutti e due da soli (metà dei colpi di ogni torre non ha
   bersaglio). Spianarla col suo primo mostro avrebbe tirato giù i
   golem di tutta la tappa al livello della mista, o la mista a quello
   dei golem, sopra il suo limite. Quindi si spiana **per ondata**:
   una mista si confronta solo con le altre miste. */
function spiana(vite, tappa) {
  const out = vite.slice()
  const chi = vite.map((_, i) => chiDi(tappa, i + 1))
  for (let i = out.length - 2; i >= 0; i--) {
    const dopo = chi.indexOf(chi[i], i + 1)
    if (dopo > 0) out[i] = Math.min(out[i], out[dopo])
  }
  return out
}

/* la tappa più tesa che il bambino vero riesce ancora a finire */
function taraFinchePassa(tappa) {
  const giù = new Array(tappa.ondate).fill(0)
  let ultimo = null
  for (let giro = 0; giro < GIRI_ANELLO; giro++) {
    const { vite, righe } = taraTappa(tappa, giù)
    const prove = SEMI.map(s => gioca({ ...tappa, vite }, { ...PROFILI.pasticcione, s }))
    ultimo = { vite, righe, giù: giù.slice(), prove }
    if (prove.every(r => r.esito === 'vinta')) return ultimo
    /* le ondate dove ha perso cuori, in una qualunque delle tre partite;
       se non ne ha persi e non ha vinto lo stesso, quella dove si è fermato */
    const dove = new Set()
    for (const r of prove) {
      for (const s of r.storia) if (s.persi) dove.add(s.onda)
      if (r.esito !== 'vinta' && !r.storia.some(s => s.persi)) dove.add(Math.max(1, Math.min(r.onda, tappa.ondate)))
    }
    let mosso = false
    for (const o of dove) if (giù[o - 1] < GIU_MAX - 1e-9) {
      giù[o - 1] = Math.round((giù[o - 1] + 0.05) * 100) / 100; mosso = true
    }
    if (!mosso) break
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

/* ── anche le partite libere, una per una ──
   Non finiscono mai, quindi non si possono tabellare tutte: se ne
   tarano le prime venti ondate come una tappa qualsiasi, e da lì in poi
   la vita continua a salire con la progressione che ognuna ha mostrato
   in coda (`OLTRE[chiave]`). Senza questo, chi ha appena finito una
   campagna tarata al filo trovava nella libera dei mostri di burro per
   quaranta ondate. Sono quattro, una per terreno, e ognuna ha il suo
   tracciato a due bocche: si tarano **una per una**, perché quello che
   una Y perdona un anello non lo perdona. */
const ONDATE_LIBERE = ONDATE_TARATE
/* `regali: false` non è una dimenticanza: la partita libera regala un
   potenziamento ogni cinque ondate (`REGALI` in `data/castello.js`), e
   la taratura si fa **su chi non ne ha nessuno** — quello che si tara è
   il pavimento, cioè la prima partita di uno che apre la modalità
   appena finita la campagna. Tarando su un giocatore con i regali in
   tasca, chi entra la prima volta troverebbe un muro, e quel muro
   crescerebbe a ogni ritaratura. */
const libere = LIBERE.map(l => ({ ...l, ondate: ONDATE_LIBERE, regali: false }))

/* ── di quanto continua a salire, oltre la tabella ──
   Il passo con cui la vita cresce dopo l'ultima ondata tarata. Si
   ricava dai **limiti** della seconda metà della tabella — la vita
   oltre la quale il metro perde — con una retta sui logaritmi: il
   limite sale a scatti (un gradino comprato, un mostro che chiude la
   torre di una strada), e una retta legge la pendenza senza farsi
   trascinare dal singolo scatto.

   Prima era la media dei rapporti fra le ultime sei vite **spianate**,
   e con due bocche non funzionava: la spianatura tira la coda giù al
   livello della sua ondata più mite, quindi la coda è piatta per otto
   ondate e poi salta — e la media di «×1» e «×5» diceva ×3,9. Cioè un
   muro alla ventunesima che nessun regalo avrebbe mai comprato.

   E c'è un pavimento, che è **il patto della modalità** e non una
   misura: prima o poi vince lei. Il passo misurato sta fra 1,10 e 1,16
   — nella seconda metà della tabella la difesa cresce ancora, e il
   limite sale piano — ma a quel passo la libera non chiude più:
   misurato col metro e trentacinque regali in tasca, a ×1,16 si arriva
   alla 33ª, a ×1,10 non si muore entro un'ora di gioco. A ×1,3 senza
   regali si cede fra la 20ª e la 22ª e con trentacinque fra la 27ª e
   la 31ª, che è la scala su cui i regali sono dimensionati
   (`docs/castello.md`). Sopra 1,3 si tiene quello che il tracciato
   dice, se dice di più. */
const OLTRE_MINIMO = 1.3
function passoOltre(righe) {
  /* il capo non conta: la sua vita è scritta in nemici normali ma lo
     ferma un'altra difesa (contro uno solo l'area non serve), e il suo
     limite farebbe un gradino che la retta leggerebbe come pendenza. Lo
     stesso per le miste, che ferma una difesa con tutte e due le
     risposte */
  const meta = righe.filter(r => r.limite > 0 && r.onda > ONDATE_LIBERE / 2 &&
                                r.chi !== 'capo' && r.chi !== 'mista')
  if (meta.length < 3) return 1.2
  const xs = meta.map(r => r.onda), ys = meta.map(r => Math.log(r.limite))
  const mx = xs.reduce((s, x) => s + x, 0) / xs.length
  const my = ys.reduce((s, y) => s + y, 0) / ys.length
  const cov = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0)
  const var_ = xs.reduce((s, x) => s + (x - mx) ** 2, 0)
  return Math.max(OLTRE_MINIMO, Math.round(Math.exp(cov / var_) * 100) / 100)
}
/* la chiave con cui una libera sta in `VITE`: la sua, non «campagna/nome» */
const chiaveDi = t => t.chiave || chiaveTappa(t)

const fatte = {}
const oltre = {}
console.log(`si gioca dal ${(DA * 100).toFixed(0)}% del limite nella prima ondata ` +
            `al ${(A * 100).toFixed(0)}% nell'ultima\n`)
for (const [i, tappa] of [...TAPPE.entries(), ...libere.map((l, k) => [TAPPE.length + k, l])]) {
  const via = Date.now()
  const { vite, righe, giù, prove } = taraFinchePassa(tappa)
  fatte[chiaveDi(tappa)] = vite
  const reggono = prove.filter(r => r.esito === 'vinta').length
  console.log(`${i + 1}. ${tappa.nome} — ${tappa.ondate} ondate · ${tappa.posti} posti · ` +
              `cap ${tappa.cap} · fino al ${(A * 100).toFixed(0)}% del limite` +
              `${giù.some(g => g > 0) ? ` (allargata in ${giù.map((g, k) => g > 0 ? `o${k + 1} −${Math.round(g * 100)}` : '')
                .filter(Boolean).join(', ')}: il pasticcione ci perdeva cuori)` : ''}` +
              ` · ${((Date.now() - via) / 1000).toFixed(1)}s`)
  if (reggono < SEMI.length)
    console.log(`   ⚠ il pasticcione la finisce solo ${reggono} volte su ${SEMI.length}`)
  for (const r of righe)
    console.log(`   o${String(r.onda).padStart(2)} ${String(r.chi || '').padEnd(11)} vita ${String(r.vita).padStart(5)}` +
                ` (era ${String(Math.round(vitaDiOnda(r.onda, tappa.durezza))).padStart(4)})` +
                `  limite ${String(r.limite).padStart(5)} × ${(r.vicinanza * 100).toFixed(0)}%` +
                `  torri [${r.torri || '—'}] ⚡${String(r.energia ?? '').padStart(3)}` +
                `  arrivati al ${((r.avanzata ?? 0) * 100).toFixed(0)}%` +
                `${r.persi ? ' · −' + r.persi + '❤' : ''}`)
  let suoOltre = tappa.oltre
  if (tappa.chiave) {
    suoOltre = passoOltre(righe)
    oltre[tappa.chiave] = suoOltre
    console.log(`   oltre l'ondata ${ONDATE_LIBERE} la vita continua a salire di ×${suoOltre} per ondata`)
  }
  // il collaudo si fa sulla tappa con le vite appena trovate
  const esiti = collauda({ ...tappa, vite, oltre: suoOltre })
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
/* di quanto cresce la vita in ogni partita libera dopo l'ultima ondata
   tarata: da lì in poi non c'è tabella, c'è questa progressione */
export const OLTRE = ${JSON.stringify(oltre)}
export const FIRMA = ${JSON.stringify(firmaEquilibrio())}
export const BERSAGLIO = [${DA}, ${A}]
`
  writeFileSync(join(RADICE, 'src/data/taratura-castello.js'), corpo)
  console.log('scritto src/data/taratura-castello.js — ora rilancia i test')
}
