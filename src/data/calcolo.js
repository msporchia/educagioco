/* ═══════════════════════════════════════════════════════════════════
   IL CALCOLO A MENTE — il catalogo dei concetti.

   Le tabelline sono 55 fatti: si contano, si imparano, finiscono. Il
   calcolo a mente no — 27+38 e 68+75 non sono due cose da mandare a
   memoria, sono la stessa strategia («arrivo prima alla decina») su due
   numeri diversi. Per questo qui l'elemento che il motore segue non è
   sempre il calcolo: sono DUE cose, tenute separate apposta.

     · i FATTI, dove i casi sono pochi e vanno saputi a memoria come le
       tabelline: somme e sottrazioni entro il venti, gli amici del dieci,
       i doppi. Chiave per fatto — `calc:8+5`, `calc:13-7`.
     · i CONCETTI, dove i casi sono infiniti: la chiave è la strategia
       — `calc:somma-riporto` — e ogni domanda è un'istanza generata al
       momento. La forza dice quanto è consolidata la strategia, non
       quante volte è uscito quel numero.

   Si distinguono dalla chiave e basta: dopo `calc:` un fatto comincia
   con una cifra, un concetto con una lettera. Così il motore, l'albo e i
   traguardi continuano a vedere una materia sola senza saperne niente.

   TRE ASSI DI DIFFICOLTÀ invece di uno. Le scalette del castello
   (`data/ops.js`) sono dieci gradini fissi: qui la difficoltà si muove
   su quale concetto è aperto (i prerequisiti), quanto è consolidato (la
   forza), e quanto sono grandi i numeri dentro lo stesso concetto (la
   TAGLIA, 0..1, che il gestore ricava dalla forza). Un concetto non ha
   un ultimo esercizio: `somma-riporto` a taglia 0 propone 27+38, a
   taglia 1 propone 68+75.

   LA DRITTA è la strategia detta a parole, come il trucco dei pianeti in
   `data/tabelline.js`. È la ragione per cui questo è un gioco che
   insegna e non un quiz: «arriva prima alla decina» vale più di cento
   ripetizioni di 8+5.

   I DISTRATTORI NON SONO RUMORE. Si risponde toccando un asteroide, e se
   i numeri sbagliati fossero presi a caso attorno al risultato basterebbe
   escludere invece di calcolare. Qui i falsi sono gli ERRORI TIPICI di
   quel concetto — il riporto dimenticato, le colonne sottratte in valore
   assoluto, lo zero in meno — quindi somigliano al risultato quanto basta
   perché l'unico modo di distinguerli sia farlo, il conto.
   ═══════════════════════════════════════════════════════════════════ */

const casuale = (min, max) => min + Math.floor(Math.random() * (max - min + 1))
const scegli = a => a[Math.floor(Math.random() * a.length)]

/* la taglia (0..1) muove un parametro fra il suo minimo e il suo massimo */
const fra = (t, min, max) => Math.round(min + (max - min) * Math.max(0, Math.min(1, t)))

/* prova finché il vincolo non è soddisfatto: i vincoli qui sotto capitano
   spesso, e dopo N tentativi si tiene quel che c'è (stessa scelta di ops.js) */
function finoA(prova, vale, tentativi = 300) {
  let ultimo = prova()
  for (let i = 0; i < tentativi && !vale(ultimo); i++) ultimo = prova()
  return ultimo
}

const unita = n => n % 10
const decine = n => Math.floor(n / 10) % 10

/* ═══════════ le chiavi ═══════════ */
export const PREFISSO = 'calc:'
export const chiaveConcetto = id => PREFISSO + id
export const eFatto = k => /^calc:\d/.test(k)
export const idDaChiave = k => k.slice(PREFISSO.length)

/* I tre modi di scrivere un fatto. La somma ha chiave ordinata — 5+7 e
   7+5 sono lo stesso fatto, come 6×8 e 8×6 — la sottrazione no. */
const somma = (a, b) => ({
  chiave: PREFISSO + Math.min(a, b) + '+' + Math.max(a, b),
  testo: `${a} + ${b} = ?`, ris: a + b, a, b, segno: '+' })

const meno = (a, b) => ({
  chiave: PREFISSO + a + '-' + b,
  testo: `${a} − ${b} = ?`, ris: a - b, a, b, segno: '−' })

const amico = (a, tot) => ({
  chiave: PREFISSO + a + '+?' + tot,
  testo: `${a} + ? = ${tot}`, ris: tot - a, a, b: tot, segno: '+', complemento: true })

/* Da una chiave di fatto si risale sempre all'esercizio: il picker sceglie
   una chiave, il gioco deve poterla mostrare senza tenersi niente da parte. */
export function fattoDaChiave(k) {
  const s = idDaChiave(k)
  let m
  if ((m = /^(\d+)\+\?(\d+)$/.exec(s))) return amico(+m[1], +m[2])
  if ((m = /^(\d+)\+(\d+)$/.exec(s))) return somma(+m[1], +m[2])
  if ((m = /^(\d+)-(\d+)$/.exec(s))) return meno(+m[1], +m[2])
  return null
}

/* ═══════════ quanto costa un fatto ═══════════
   Decide l'ordine con cui i fatti entrano in lavorazione, e senza di lei
   entrano nell'ordine in cui sono scritti: 1+1, 1+2, 1+3… cioè un'intera
   partita a sommare uno. La fatica di una somma è dove ti porta, con due
   sconti veri: aggiungere 1 è contare, non ricordare, e i doppi si
   imparano prima di tutto il resto perché servono a tutto il resto.
   Torna un numero fra 0 e 1: è un pari-merito, non l'ordine principale. */
export function faticaFatto(k) {
  const e = fattoDaChiave(k)
  if (!e) return 0
  let costo
  if (e.complemento) costo = 6 + Math.abs(5 - e.a) * 0.5
  else if (e.segno === '−') costo = e.a - (e.b === 1 ? 3 : 0)
  else costo = e.ris - (e.a === e.b ? 2 : 0)
  return Math.max(0, Math.min(20, costo)) / 21
}

/* ═══════════ le famiglie di un fatto ═══════════
   L'insieme in lavorazione gira a turno fra le famiglie, come fa con le
   tabelline (vedi `activeSet` in store/srs.js). Senza, una partita esce
   tutta «1+2, 1+3, 1+4…»: sono davvero i fatti più facili, e proprio per
   questo l'ordine da solo non basta — di serate a sommare uno ne bastano
   zero. La famiglia è il numero attorno a cui gira il fatto. */
export function famigliaFatto(k) {
  const e = fattoDaChiave(k)
  if (!e) return k
  if (e.complemento) return 'c' + Math.min(e.a, e.b - e.a)
  if (e.segno === '−') return 'm' + e.b
  return 's' + Math.min(e.a, e.b)
}

/* esercizi senza chiave propria: la chiave gliela mette `esercizioDi()`,
   ed è quella del concetto */
const conto = (a, segno, b, ris, testo) => ({ a, b, segno, ris, testo })
const piu = (a, b) => conto(a, '+', b, a + b, `${a} + ${b} = ?`)
const tolgo = (a, b) => conto(a, '−', b, a - b, `${a} − ${b} = ?`)
const per = (a, b) => conto(a, '×', b, a * b, `${a} × ${b} = ?`)
const diviso = (a, b) => conto(a, ':', b, a / b, `${a} : ${b} = ?`)
const mancante = (a, tot) => ({ a, b: tot, segno: '+', ris: tot - a,
                                testo: `${a} + ? = ${tot}`, complemento: true })

/* ═══════════ gli errori tipici ═══════════
   Ogni famiglia sbaglia a modo suo, e il modo è sempre lo stesso: chi
   somma dimentica il riporto, chi sottrae fa le colonne in valore
   assoluto («52−27: 5−2 fa 3, 7−2 fa 5, quindi 35»), chi moltiplica per
   una decina perde uno zero. Sono questi i numeri da mettere in cielo. */
const scambiaCifre = n => {
  const s = String(n)
  return s.length === 2 ? +(s[1] + s[0]) : n
}

/* la sottrazione fatta colonna per colonna senza mai chiedere in prestito */
function senzaPrestito(a, b) {
  let out = 0, peso = 1
  while (a > 0 || b > 0) {
    out += Math.abs((a % 10) - (b % 10)) * peso
    a = Math.floor(a / 10); b = Math.floor(b / 10); peso *= 10
  }
  return out
}

function erroriTipici(e) {
  const r = e.ris
  if (e.complemento) return [r + 10, r - 10, 10 - unita(e.a), r + 1, r - 1, e.a]
  if (e.segno === '+') return [r - 10, r + 10, r - 1, r + 1, scambiaCifre(r),
                               r - 100, r + 100, e.a - e.b]
  if (e.segno === '−') return [senzaPrestito(e.a, e.b), r + 10, r - 10, r + 1, r - 1,
                               r + 100, r - 100, e.a + e.b]
  if (e.segno === '×') return [r - e.a, r + e.a, r - e.b, r + e.b, r / 10, r * 10,
                               r - 10, r + 10, e.a + e.b]
  return [r + 1, r - 1, r + e.b, r - e.b, r * e.b, r + 10, r - 10]
}

/* Quanti bersagli sbagliati servono, presi in ordine di plausibilità e
   scartando quelli che si riconoscerebbero a occhio: negativi, con un
   numero di cifre diverso dal risultato (dove si può), doppioni. */
export function distrattoriDi(e, n) {
  const c = CONCETTI_PER_ID[e.id]
  const cifre = String(e.ris).length
  const visti = new Set([e.ris])
  const buoni = [], ripiego = []
  /* un falso deve restare nel mondo del risultato: 1010 accanto a 110 lo
     scarta anche chi non sa contare, e quel bersaglio è spazio sprecato */
  const credibile = v => v >= e.ris / 2 - 12 && v <= e.ris * 2 + 12
  const prova = v => {
    if (!Number.isInteger(v) || v < 0 || visti.has(v) || !credibile(v)) return
    visti.add(v)
    // a parità di plausibilità viene prima chi ha la stessa lunghezza
    ;(String(v).length === cifre ? buoni : ripiego).push(v)
  }
  /* Ogni tanto i falsi stanno tutti da una parte. Senza questo il risultato
     giusto non è MAI il più grande né il più piccolo dei bersagli, e
     scartare i due estremi diventa una scorciatoia che funziona sempre:
     sei asteroidi che ne valgono quattro. */
  const lato = Math.random()
  const passo = lato < 0.2 ? -1 : lato > 0.8 ? 1 : 0

  for (const v of [...(c && c.errori ? c.errori(e) : []), ...erroriTipici(e)]) prova(v)
  // quando i bersagli devono stare tutti da un lato si pesca prima di lì
  if (passo) {
    const quanti = () => [...buoni, ...ripiego].filter(v => (v - e.ris) * passo > 0).length
    for (let d = 1; d <= 14 && quanti() < n; d++) prova(e.ris + passo * d)
  }
  // se gli errori tipici non bastano si allarga attorno al risultato, ma
  // sempre a distanza credibile: un 7 accanto a un 65 non lo tocca nessuno
  for (let d = 1; buoni.length + ripiego.length < n + 2 && d <= 12; d++) {
    prova(e.ris + d); prova(e.ris - d)
  }
  const pesa = v => (passo ? ((v - e.ris) * passo > 0 ? 0 : 1) : 0)
  const out = [...buoni, ...ripiego]
    .map((v, i) => ({ v, i }))
    .sort((x, y) => pesa(x.v) - pesa(y.v) || x.i - y.i)
    .slice(0, n).map(x => x.v)
  // mescolati: l'ordine di plausibilità non deve diventare una posizione
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/* ═══════════ I CONCETTI ═══════════
   `peso` (1..3) è quanto il calcolo costa in testa: da lì il gioco ricava
   quanti asteroidi mandare giù e quanto lentamente farli cadere. Un 3+4
   può arrivare fra sei bersagli, un 497+298 ne vuole tre e il doppio del
   tempo, altrimenti la scelta multipla diventa una lotteria.

   `tabelline` è quante tabelline devono reggere perché il concetto si
   apra, e i concetti moltiplicativi pescano il fattore proprio fra quelle:
   così le due campagne degli asteroidi si tengono per mano invece di
   stare una accanto all'altra. */

/* le tabelline su cui appoggiarsi quando ancora non ne regge nessuna:
   sono le tre che si sanno per regola e non per memoria */
const REGOLE = [2, 5, 10]
const tab = ctx => (ctx && ctx.tabelline && ctx.tabelline.length ? ctx.tabelline : REGOLE)
/* per moltiplicare a mente serve un fattore vero, non 1 o 10 */
const tabVera = ctx => {
  const buone = tab(ctx).filter(n => n >= 2 && n <= 9)
  return buone.length ? scegli(buone) : scegli([2, 3, 4, 5])
}

export const CONCETTI = [
  /* ───────── 1. gli amici del dieci ───────── */
  { id: 'somma-10', nome: 'Somme fino a 10', segno: '+', peso: 1, prereq: [],
    dritta: 'Parti dal numero più grande e conta in avanti: 3+5 è 5, 6, 7, 8.',
    chiavi: () => {
      const out = []
      for (let a = 1; a <= 9; a++) for (let b = a; a + b <= 10; b++) out.push(somma(a, b).chiave)
      return out
    } },

  { id: 'doppi', nome: 'I doppi', segno: '+', peso: 1, prereq: ['somma-10'],
    dritta: 'Un numero più se stesso. Impararli conviene: servono a tutto il resto.',
    chiavi: () => Array.from({ length: 10 }, (_, i) => somma(i + 1, i + 1).chiave) },

  { id: 'meno-10', nome: 'Sottrazioni fino a 10', segno: '−', peso: 1, prereq: ['somma-10'],
    dritta: 'Pensa alla somma che manca: 9−4 è «quanto manca da 4 a 9».',
    chiavi: () => {
      const out = []
      for (let a = 2; a <= 10; a++) for (let b = 1; b < a; b++) out.push(meno(a, b).chiave)
      return out
    } },

  /* ───────── 2. oltre la decina ───────── */
  { id: 'somma-20', nome: 'Somme oltre il dieci', segno: '+', peso: 1,
    prereq: ['somma-10'],
    dritta: 'Arriva prima a 10: 8+5 → 8+2 fa 10, restano 3, quindi 13.',
    chiavi: () => {
      const out = []
      for (let a = 2; a <= 9; a++) for (let b = a; b <= 9; b++)
        if (a + b > 10) out.push(somma(a, b).chiave)
      return out
    } },

  { id: 'quasi-doppi', nome: 'I quasi doppi', segno: '+', peso: 1, prereq: ['doppi'],
    dritta: '7+8 è il doppio di 7 più uno: 14 e 1, cioè 15.',
    chiavi: () => Array.from({ length: 9 }, (_, i) => somma(i + 1, i + 2).chiave) },

  { id: 'meno-20', nome: 'Sottrazioni sotto il dieci', segno: '−', peso: 1,
    prereq: ['meno-10'],
    dritta: 'Scendi prima a 10: 13−7 → 13−3 fa 10, restano 4 da togliere, quindi 6.',
    chiavi: () => {
      const out = []
      for (let a = 11; a <= 18; a++) for (let b = 2; b <= 9; b++)
        if (a - b < 10 && a - b > 0) out.push(meno(a, b).chiave)
      return out
    } },

  /* ───────── 3. il buco da riempire, e le decine tonde ─────────
     Il `?` in mezzo al conto non è una somma scritta in un altro modo: è
     un'altra domanda — «quanto manca» invece di «quanto fa» — e chiede di
     girare l'operazione. Per questo non sta più il primo giorno accanto a
     3+4: arriva quando somme e sottrazioni entro il venti stanno in piedi,
     insieme all'altro complemento, quello del cento. */
  { id: 'amici-10', nome: 'Gli amici del dieci', segno: '+', peso: 1,
    prereq: ['somma-10', 'meno-10'],
    dritta: 'Sono le coppie che fanno dieci: 1 e 9, 2 e 8, 3 e 7, 4 e 6, 5 e 5.',
    chiavi: () => Array.from({ length: 9 }, (_, i) => amico(i + 1, 10).chiave) },

  { id: 'decine-somma', nome: 'Decine tonde', segno: '+', peso: 1, prereq: ['somma-10'],
    dritta: '30+40 è 3+4 decine: sette decine, cioè 70. Lo zero resta dov\'è.',
    genera: t => {
      const s = casuale(3, fra(t, 10, 18))
      const da = casuale(Math.max(1, s - 9), Math.min(9, s - 1))
      return piu(da * 10, (s - da) * 10)
    } },

  { id: 'decine-meno', nome: 'Decine da togliere', segno: '−', peso: 1,
    prereq: ['meno-10', 'decine-somma'],
    dritta: '70−30 è 7−3 decine: quattro decine, cioè 40.',
    genera: t => {
      const a = casuale(3, fra(t, 10, 18))
      return tolgo(a * 10, casuale(1, a - 1) * 10)
    } },

  { id: 'amici-100', nome: 'Gli amici del cento', segno: '+', peso: 1,
    prereq: ['amici-10', 'decine-somma'],
    dritta: '60+40 fa 100: le decine sono amiche del dieci. Con 65 pensa a 5 e 30.',
    genera: t => {
      const a = t < 0.5 ? casuale(1, 9) * 10 : casuale(1, 19) * 5
      return mancante(a, 100)
    },
    errori: e => [100 - e.a + 10, 100 - e.a - 10, 10 - unita(e.a), e.a] },

  /* ───────── 4. due cifre, senza cambio ───────── */
  { id: 'unita-in-piu', nome: 'Aggiungi le unità', segno: '+', peso: 1,
    prereq: ['somma-10', 'meno-10'],
    dritta: 'Le decine non si toccano: 34+5 → le unità fanno 9, quindi 39.',
    genera: t => {
      const a = casuale(fra(t, 11, 31), fra(t, 48, 97))
      const u = unita(a)
      // con lo zero in fondo non si può togliere niente senza cambiare decina,
      // con il nove non si può aggiungere: il caso limite decide da solo
      const su = u === 0 || (u <= 8 && Math.random() < 0.5)
      return su ? piu(a, casuale(1, 9 - u)) : tolgo(a, casuale(1, u))
    } },

  { id: 'decine-in-piu', nome: 'Aggiungi le decine', segno: '+', peso: 1,
    prereq: ['decine-somma', 'unita-in-piu'],
    dritta: 'Cambiano solo le decine: 34+20 → 54. Le unità restano quelle.',
    genera: t => {
      const a = casuale(fra(t, 12, 31), fra(t, 49, 89))
      if (Math.random() < 0.5) {
        const b = casuale(1, Math.max(1, Math.floor((fra(t, 90, 190) - a) / 10))) * 10
        return piu(a, b)
      }
      return tolgo(a, casuale(1, Math.max(1, decine(a))) * 10)
    } },

  { id: 'due-somma', nome: 'Due cifre più due cifre', segno: '+', peso: 2,
    prereq: ['unita-in-piu', 'decine-in-piu'],
    dritta: 'Prima le decine, poi le unità: 23+45 → 60 e 8, cioè 68.',
    genera: t => finoA(
      () => {
        const a = casuale(fra(t, 11, 21), fra(t, 44, 84))
        return piu(a, casuale(fra(t, 11, 15), Math.max(12, fra(t, 44, 99) - a + 10)))
      },
      e => unita(e.a) + unita(e.b) <= 9 && e.ris <= 99 && e.b >= 10) },

  { id: 'due-meno', nome: 'Due cifre meno due cifre', segno: '−', peso: 2,
    prereq: ['unita-in-piu', 'decine-meno'],
    dritta: 'Togli prima le decine e poi le unità: 68−25 → 48 e poi 43.',
    genera: t => finoA(
      () => {
        const a = casuale(fra(t, 24, 45), fra(t, 68, 99))
        // appena aperto si toglie poco — 47−13, non 68−57: il salto sta
        // tutto in quanto è grosso il numero che si porta via
        return tolgo(a, casuale(11, Math.max(12, Math.min(a - 10, fra(t, 24, 89)))))
      },
      e => unita(e.a) >= unita(e.b) && e.ris >= 10 && e.b >= 10) },

  /* ───────── 5. due cifre, col cambio ─────────
     Qui c'era il gradino più alto di tutta la campagna: si passava da 34+5
     e 23+45 — dove le colonne non si parlano — direttamente a 27+38, che
     è la stessa cosa più il riporto più due cifre da tenere a mente. In
     mezzo manca un solo passo, ed è quello che si fa a scuola: **una cifra
     sola che scavalca la decina**. 26+7 è 8+5 con davanti una decina che
     non si muove; imparato quello, 27+38 è farlo due volte. */
  { id: 'unita-riporto', nome: 'Passa la decina', segno: '+', peso: 2,
    prereq: ['unita-in-piu', 'somma-20'],
    dritta: 'Arriva prima alla decina tonda: 26+7 → 26+4 fa 30, restano 3, quindi 33.',
    genera: t => {
      const u = casuale(2, 9)
      // b non scende mai sotto quel che serve per scavalcare: se resta di
      // qua dalla decina il concetto non allena niente
      return piu(casuale(1, fra(t, 3, 9)) * 10 + u, casuale(10 - u, 9))
    },
    errori: e => [e.ris - 10, e.ris + 10, decine(e.a) * 10 + unita(e.ris), e.ris - 1] },

  { id: 'unita-prestito', nome: 'Scendi sotto la decina', segno: '−', peso: 2,
    prereq: ['unita-in-piu', 'meno-20'],
    dritta: 'Scendi prima alla decina tonda: 43−7 → 43−3 fa 40, restano 4 da togliere → 36.',
    genera: t => {
      const u = casuale(0, 7)
      return tolgo(casuale(1, fra(t, 3, 9)) * 10 + u, casuale(u + 1, 9))
    },
    errori: e => [senzaPrestito(e.a, e.b), e.ris + 10, e.ris - 10, e.ris + 1] },

  { id: 'somma-riporto', nome: 'Somme col riporto', segno: '+', peso: 2,
    prereq: ['due-somma', 'unita-riporto'],
    dritta: 'Arriva alla decina e poi vai avanti: 27+38 → 27+3 fa 30, restano 35 → 65.',
    genera: t => finoA(
      () => {
        const a = casuale(fra(t, 13, 24), fra(t, 48, 88))
        return piu(a, casuale(fra(t, 10, 16), fra(t, 39, 89)))
      },
      // la cifra sola col riporto adesso ha un concetto suo: qui si somma
      // sempre due cifre a due cifre, altrimenti i due si sovrappongono
      e => unita(e.a) + unita(e.b) > 9 && e.ris <= 180 && e.b >= 10),
    errori: e => [e.ris - 10, decine(e.a + e.b - 10) * 10 + unita(e.ris), e.ris + 10] },

  { id: 'meno-prestito', nome: 'Sottrazioni col prestito', segno: '−', peso: 2,
    prereq: ['due-meno', 'unita-prestito'],
    dritta: 'Scendi prima alla decina: 52−27 → 52−22 fa 30, restano 5 da togliere → 25.',
    genera: t => finoA(
      () => {
        const a = casuale(fra(t, 22, 45), fra(t, 68, 99))
        return tolgo(a, casuale(fra(t, 11, 19), Math.max(12, a - 8)))
      },
      e => unita(e.a) < unita(e.b) && e.ris > 0 && e.b >= 10),
    errori: e => [senzaPrestito(e.a, e.b), e.ris + 10, e.ris - 10, e.ris + 1] },

  { id: 'arrotonda-somma', nome: 'Arrotonda e togli', segno: '+', peso: 2,
    prereq: ['somma-riporto', 'amici-10'],
    dritta: '47+29 → fai 47+30 che è 77, poi togli 1: 76. Con i numeri quasi tondi conviene.',
    genera: t => {
      const b = casuale(1, fra(t, 3, 8)) * 10 - casuale(1, 2)
      return piu(casuale(fra(t, 14, 34), fra(t, 49, 89)), b)
    },
    errori: e => [e.ris + 1, e.ris - 1, e.ris + 2, e.ris - 2, e.a + e.b + 10 - unita(e.b)] },

  { id: 'arrotonda-meno', nome: 'Arrotonda e rimetti', segno: '−', peso: 2,
    prereq: ['meno-prestito', 'amici-10'],
    dritta: '63−29 → togli 30 che fa 33, poi rimetti 1: 34. Ne hai tolto uno di troppo.',
    genera: t => {
      const b = casuale(1, fra(t, 3, 8)) * 10 - casuale(1, 2)
      return tolgo(casuale(Math.max(b + 6, fra(t, 41, 61)), fra(t, 79, 99)), b)
    },
    errori: e => [e.ris - 1, e.ris + 1, e.ris - 2, e.a - e.b - 10 + unita(e.b)] },

  /* ───────── 6. moltiplicare a mente ───────── */
  { id: 'per-10', nome: 'Per dieci e per cento', segno: '×', peso: 1, prereq: ['decine-somma'],
    dritta: 'Uno zero in fondo per il dieci, due per il cento: 23×10 = 230.',
    genera: t => {
      const m = t < 0.45 ? 10 : scegli([10, 10, 100])
      // per cento si resta a una cifra: 27×100 è fuori dal mondo del mille
      return per(casuale(2, m === 100 ? 9 : fra(t, 9, 99)), m)
    },
    errori: e => [e.ris * 10, e.ris / 10, e.ris + e.a, e.ris - e.a] },

  { id: 'per-decine', nome: 'Per una decina', segno: '×', peso: 2, prereq: ['per-10'],
    tabelline: 3,
    dritta: '4×30 è 4×3 con uno zero in fondo: 12 diventa 120.',
    genera: (t, ctx) => {
      const a = t < 0.5 ? tabVera(ctx) : casuale(2, 19)
      return per(a, casuale(2, Math.max(2, Math.min(9, Math.floor(100 / a)))) * 10)
    },
    errori: e => [e.ris / 10, e.ris * 10, e.ris - e.a * 10, e.ris + e.a * 10] },

  { id: 'spezza-prodotto', nome: 'Spezza e moltiplica', segno: '×', peso: 3,
    prereq: ['per-decine', 'due-somma'], tabelline: 4,
    dritta: '4×23 → 4×20 fa 80, 4×3 fa 12: insieme 92. Si spezza in decine e unità.',
    genera: (t, ctx) => {
      const m = tabVera(ctx)
      return per(m, finoA(() => casuale(fra(t, 12, 21), fra(t, 29, 99)), n => unita(n) !== 0))
    },
    errori: e => [e.a * decine(e.b) * 10, e.a * decine(e.b) * 10 + unita(e.b),
                  e.ris - e.a, e.ris + e.a] },

  { id: 'per-9', nome: 'Per nove', segno: '×', peso: 2, prereq: ['per-10', 'meno-20'],
    tabelline: 3,
    dritta: '9×14 è 10×14 meno 14: 140−14 = 126. Il nove è un dieci che si scusa.',
    genera: t => per(9, casuale(fra(t, 3, 12), fra(t, 12, 39))),
    errori: e => [e.b * 10, e.ris - e.b, e.ris + e.b, e.ris - 10] },

  { id: 'per-11', nome: 'Per undici', segno: '×', peso: 2, prereq: ['per-10', 'due-somma'],
    tabelline: 2,
    dritta: '11×24 è 10×24 più 24: 240+24 = 264.',
    genera: t => per(11, casuale(fra(t, 3, 14), fra(t, 12, 49))),
    errori: e => [e.b * 10, e.ris - e.b, e.ris + e.b, e.b * 100 + e.b] },

  { id: 'raddoppia-dimezza', nome: 'Raddoppia e dimezza', segno: '×', peso: 2,
    prereq: ['doppi', 'per-10'], tabelline: 2,
    dritta: '14×5 → dimezza 14 e raddoppia 5: 7×10 = 70. Con il cinque conviene sempre.',
    genera: t => {
      const b = scegli([5, 5, 50])
      const alto = b === 50 ? 10 : fra(t, 12, 44)
      const basso = Math.min(fra(t, 3, 12), alto)
      return per(casuale(basso, alto) * 2, b)
    },
    errori: e => [e.ris / 10, e.ris * 10, e.ris - e.a, e.ris + e.a] },

  /* ───────── 7. dividere a mente ───────── */
  { id: 'divide-tabellina', nome: 'La tabellina girata', segno: ':', peso: 2, prereq: [],
    tabelline: 4,
    dritta: '56:8 è «per quanto moltiplico 8 per fare 56?». È la tabellina al contrario.',
    genera: (t, ctx) => { const m = tabVera(ctx); return diviso(m * casuale(2, fra(t, 6, 10)), m) },
    errori: e => [e.ris + 1, e.ris - 1, e.a - e.b, e.b] },

  { id: 'meta', nome: 'La metà', segno: ':', peso: 2, prereq: ['doppi', 'due-meno'],
    dritta: 'Metà di 68: metà di 60 fa 30, metà di 8 fa 4, quindi 34.',
    genera: t => {
      const n = casuale(fra(t, 11, 60), fra(t, 49, 499)) * 2
      return { a: n, b: 2, segno: ':', ris: n / 2, testo: `la metà di ${n} = ?` }
    },
    errori: e => [e.ris + 10, e.ris - 10, decine(e.a) * 5 * 10 + unita(e.a), e.ris + 1] },

  { id: 'decine-divise', nome: 'Decine da dividere', segno: ':', peso: 2,
    prereq: ['divide-tabellina', 'per-decine'], tabelline: 4,
    dritta: '120:4 è 12:4 con uno zero in fondo: 3 diventa 30.',
    genera: (t, ctx) => { const m = tabVera(ctx); return diviso(m * casuale(2, fra(t, 5, 9)) * 10, m) },
    errori: e => [e.ris / 10, e.ris * 10, e.ris - 10, e.ris + 10] },

  { id: 'quante-volte', nome: 'Quante volte ci sta', segno: ':', peso: 2,
    prereq: ['divide-tabellina'],
    dritta: 'In 29 il 4 ci sta 7 volte (28) e avanza 1: si cerca il più vicino senza superare.',
    genera: t => {
      const m = casuale(3, 9), q = casuale(2, fra(t, 9, 20))
      const a = q * m + casuale(1, m - 1)
      return { a, b: m, segno: ':', ris: q, testo: `in ${a} quante volte c'è ${m}?` }
    },
    errori: e => [e.ris + 1, e.ris - 1, e.ris + 2, Math.ceil(e.a / e.b) + 1] },

  /* ───────── 8. le centinaia ───────── */
  { id: 'centinaia-somma', nome: 'Centinaia', segno: '+', peso: 2,
    prereq: ['decine-somma', 'per-10'],
    dritta: '350+200 → 3 centinaia e 2 fanno 5: 550. Le decine restano dove sono.',
    genera: t => {
      const a = casuale(1, 8) * 100 + (t < 0.4 ? 0 : casuale(0, 9) * 10)
      return piu(a, casuale(1, Math.max(1, 9 - Math.floor(a / 100))) * 100)
    } },

  { id: 'centinaia-meno', nome: 'Centinaia da togliere', segno: '−', peso: 2,
    prereq: ['centinaia-somma', 'decine-meno'],
    dritta: '600−250 → togli 200 che fa 400, poi 50: 350.',
    genera: t => {
      const a = casuale(3, 9) * 100 + (t < 0.4 ? 0 : casuale(0, 9) * 10)
      return tolgo(a, casuale(1, Math.floor(a / 100) - 1) * 100 + (t < 0.4 ? 0 : casuale(0, 5) * 10))
    } },

  { id: 'amici-1000', nome: 'Gli amici del mille', segno: '+', peso: 2,
    prereq: ['amici-100', 'centinaia-somma'],
    dritta: '650+350 fa 1000: pensa prima alle centinaia che arrivano a 900, poi al resto.',
    genera: t => mancante(t < 0.45 ? casuale(1, 9) * 100 : casuale(1, 19) * 50, 1000),
    errori: e => [1000 - e.a + 100, 1000 - e.a - 100, 1000 - e.a + 10, 100 - e.a % 100] },

  { id: 'tre-cifre-somma', nome: 'Tre cifre a mente', segno: '+', peso: 3,
    prereq: ['centinaia-somma', 'somma-riporto'],
    dritta: '240+130 → centinaia con centinaia (300), decine con decine (70): 370.',
    genera: t => finoA(
      () => piu(casuale(fra(t, 110, 240), fra(t, 480, 780)),
                casuale(fra(t, 105, 160), fra(t, 210, 480))),
      e => e.ris <= 1000 && (t > 0.5 || unita(e.a) + unita(e.b) <= 9)),
    errori: e => [e.ris - 100, e.ris + 100, e.ris - 10, e.ris + 10] },

  { id: 'arrotonda-centinaia', nome: 'Quasi mille', segno: '+', peso: 3,
    prereq: ['tre-cifre-somma', 'arrotonda-somma'],
    dritta: '497+298 → 500+300 fa 800, poi togli 3 e 2: 795. I quasi tondi si arrotondano.',
    genera: t => {
      const b = casuale(1, fra(t, 2, 4)) * 100 - casuale(1, 3)
      return piu(casuale(fra(t, 120, 240), fra(t, 380, 590)), b)
    },
    errori: e => [e.ris + 5, e.ris - 5, e.ris + 3, e.ris - 3, e.ris + 100] },
]

export const CONCETTI_PER_ID = Object.fromEntries(CONCETTI.map(c => [c.id, c]))
export const eConcettoDiFatti = c => typeof c.chiavi === 'function'

/* tutte le chiavi dei fatti, calcolate una volta: servono al pool, al
   conteggio della materia e alla tavola dei progressi */
const FATTI_DI = new Map(CONCETTI.filter(eConcettoDiFatti).map(c => [c.id, c.chiavi()]))
export const chiaviDi = id => FATTI_DI.get(id) || [chiaveConcetto(id)]
export const TUTTI_I_FATTI = [...new Set([...FATTI_DI.values()].flat())]

/* Quale concetto «possiede» un fatto. Un fatto può stare in più concetti
   — 6+6 è un doppio ed è anche una somma fino a 10 — e allora vale il
   primo del catalogo, che è il più elementare: la dritta da dare a chi
   sbaglia 3+3 è quella delle somme piccole, non quella dei doppi. */
const PADRONE = new Map()
for (const c of CONCETTI.filter(eConcettoDiFatti))
  for (const k of chiaviDi(c.id)) if (!PADRONE.has(k)) PADRONE.set(k, c.id)
export const concettoDiChiave = k => (eFatto(k) ? PADRONE.get(k) : idDaChiave(k))

/* Il padrone è uno, ma l'APPARTENENZA è di tutti: 1+2 è una somma fino a
   dieci ed è anche un quasi doppio, e per la stazione dei quasi doppi
   quella risposta conta. Col padrone soltanto, i concetti trasversali —
   doppi, quasi doppi — non avrebbero mai una domanda loro e il bersaglio
   della tappa sarebbe irraggiungibile. */
const SETDI = new Map([...FATTI_DI].map(([id, ks]) => [id, new Set(ks)]))
export const appartiene = (id, k) =>
  (SETDI.has(id) ? SETDI.get(id).has(k) : idDaChiave(k) === id)

/* quanti elementi esistono in tutto: i fatti uno per uno, i concetti a
   istanze infinite uno ciascuno. È il denominatore della padronanza. */
export const TOTALE_ELEMENTI =
  TUTTI_I_FATTI.length + CONCETTI.filter(c => !eConcettoDiFatti(c)).length

/* ═══════════ da una chiave all'esercizio da mostrare ═══════════
   Il picker sceglie una chiave e basta: qui diventa una domanda vera.
   Un fatto si rilegge dalla chiave, un concetto genera un'istanza nuova
   alla taglia che il gestore ha deciso. */
export function esercizioDi(chiave, ctx = {}) {
  const id = concettoDiChiave(chiave)
  const c = CONCETTI_PER_ID[id]
  if (eFatto(chiave)) {
    const e = fattoDaChiave(chiave)
    return e && { ...e, id, peso: c ? c.peso : 1 }
  }
  if (!c || !c.genera) return null
  const e = c.genera(Math.max(0, Math.min(1, ctx.taglia ?? 0)), ctx)
  return { ...e, chiave, id, peso: c.peso }
}

/* ═══════════ LE STAZIONI ═══════════
   La campagna, con la stessa forma dei pianeti: una fila, una tappa per
   volta, un bersaglio di partita. I concetti nuovi sono il cuore della
   tappa, i precedenti restano dentro come ripasso — una strategia che non
   si rivede si dimentica come una tabellina.

   L'ultima stazione non porta niente di nuovo: è l'esame, come il ☀️
   delle tabelline. Dopo c'è il volo a mente, che non finisce.

   UNA COSA NUOVA PER TAPPA, e la cosa nuova è sempre *un pezzo in più da
   tenere a mente*. Le tappe di mezzo erano tre — «Due cifre», «Riporti e
   prestiti» — e ognuna ne portava quattro o sei insieme: chi le apriva si
   trovava addosso 12+6 e 52−27 nella stessa partita. Adesso la salita è
   scritta nella fila, un gradino per volta:

     12+6   la decina sta ferma, si toccano le unità
     26+7   le unità scavalcano, la decina si muove di uno
     23+45  due cifre contro due cifre, ma le colonne non si parlano
     27+38  due cifre e le colonne si parlano: il riporto
     47+29  quasi tondo: si arrotonda e si aggiusta

   Le fasi della luna 🌑🌒🌓🌗 sono lì apposta, per far vedere che è una
   salita sola e non cinque cose diverse. */
const TAPPE = [
  { emoji: '🚀', nome: 'Fino al dieci', esempio: '3+4 · 6+6 · 9−4',
    nuovi: ['somma-10', 'doppi', 'meno-10'] },
  { emoji: '🛰️', nome: 'Oltre la decina', esempio: '8+5 · 7+8 · 13−7',
    nuovi: ['somma-20', 'quasi-doppi', 'meno-20'] },
  { emoji: '🌑', nome: 'Amici e decine', esempio: '7+?=10 · 30+40 · 60+?=100',
    nuovi: ['amici-10', 'decine-somma', 'decine-meno', 'amici-100'] },
  { emoji: '🌒', nome: 'Due cifre e una', esempio: '12+6 · 18−6 · 34+20',
    nuovi: ['unita-in-piu', 'decine-in-piu'] },
  { emoji: '🌓', nome: 'Passa la decina', esempio: '26+7 · 43−7',
    nuovi: ['unita-riporto', 'unita-prestito'] },
  { emoji: '🌗', nome: 'Due cifre', esempio: '23+45 · 68−25',
    nuovi: ['due-somma', 'due-meno'] },
  { emoji: '☄️', nome: 'Riporti e prestiti', esempio: '27+38 · 52−27',
    nuovi: ['somma-riporto', 'meno-prestito'] },
  { emoji: '💫', nome: 'I quasi tondi', esempio: '47+29 · 63−29',
    nuovi: ['arrotonda-somma', 'arrotonda-meno'] },
  { emoji: '🌠', nome: 'Moltiplicare a mente', esempio: '4×30 · 4×23 · 14×5',
    nuovi: ['per-10', 'per-decine', 'spezza-prodotto', 'per-9', 'per-11', 'raddoppia-dimezza'] },
  { emoji: '🛸', nome: 'Dividere a mente', esempio: '56:8 · metà di 68 · 120:4',
    nuovi: ['divide-tabellina', 'meta', 'decine-divise', 'quante-volte'] },
  { emoji: '🌌', nome: 'Fino a mille', esempio: '350+200 · 650+?=1000 · 497+298',
    nuovi: ['centinaia-somma', 'centinaia-meno', 'amici-1000', 'tre-cifre-somma',
            'arrotonda-centinaia'] },
  { emoji: '⭐', nome: 'La prova', esempio: 'tutto insieme', nuovi: [] },
]

export const STAZIONI = TAPPE.map((t, i) => ({
  i, emoji: t.emoji, nome: t.nome, nuovi: t.nuovi, esempio: t.esempio,
  /* tutto quello che si è visto fin qui: il pool di una stazione è i suoi
     concetti più il ripasso di quelli di prima */
  concetti: TAPPE.slice(0, i + 1).flatMap(x => x.nuovi),
  dritta: t.nuovi.length
    ? CONCETTI_PER_ID[t.nuovi[0]].dritta
    : 'Tutto quello che sai fare a mente, mescolato. Niente di nuovo, nessuno sconto.',
  /* Sale piano: le tappe adesso sono dodici invece di nove, e con il vecchio
     `14 + i*2` l'ultima ne avrebbe chieste trentasei — una partita intera
     senza sbagliare. Poche cose per tappa vogliono un bersaglio corto. */
  bersaglio: Math.round(13 + i * 1.2),
  /* poco più della metà: la tappa chiede i suoi concetti sette volte su
     dieci (`QUOTA_TAPPA` in `store/calcolo.js`), il resto sono errori e
     ripasso. Chiedere quanto la quota promette, e non di più, è quello che
     tiene la tappa una serata invece che un'attesa */
  mirate: t.nuovi.length ? Math.round(Math.round(13 + i * 1.2) * 0.55) : 0,
}))

export const VOLO_A_MENTE = {
  i: -1, emoji: '♾️', nome: 'Volo a mente', nuovi: [], esempio: 'tutto',
  concetti: CONCETTI.map(c => c.id),
  dritta: 'Tutti i calcoli che sai fare, senza bersaglio e senza fine.',
  bersaglio: Infinity, mirate: 0,
}

export const stazioneDi = i => (i >= 0 && i < STAZIONI.length ? STAZIONI[i] : VOLO_A_MENTE)
