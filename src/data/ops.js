/* ═══════════════════════════════════════════════════════════════════
   OPERAZIONI IN COLONNA
   Si scrivono SOLO le cifre del risultato, da destra verso sinistra.
   I riporti si tengono a mente: scriverli sarebbe una stampella e
   l'obiettivo è che imparino a farne a meno.

   Unica eccezione la moltiplicazione con moltiplicatore a due cifre:
   lì i prodotti parziali sono passaggi veri del procedimento, non
   promemoria, quindi si scrivono per intero e poi si sommano.

   Le cifre sono in ordine "little endian": indice 0 = unità.
   ═══════════════════════════════════════════════════════════════════ */

export const cifre = n => String(n).split('').reverse().map(Number)

/* ═══════════ IL RIPORTO, DETTO AD ALTA VOCE ═══════════
   «Se viene 12 non si scrive 12» è il malinteso che ferma i bambini la
   prima volta, e da fuori non somiglia a un errore di calcolo: la somma
   l'hanno fatta giusta, è la *procedura* che non conoscono ancora — e la
   dritta «il riporto tienilo a mente» la dà per scontata.

   Questa funzione ricostruisce il conto di una colonna, riporto entrante
   compreso, così `components/ColumnOp.vue` può mostrarlo a chi ha appena
   sbagliato. Sta qui e non lì dentro perché è aritmetica e basta, e
   l'aritmetica si prova senza aprire un browser (`unita/ops`).

   Solo l'addizione, ed è un limite voluto: è lì che nasce il malinteso, e
   sono le uniche colonne ricostruibili con certezza da quello che sta
   scritto sopra — nella sottrazione i prestiti si leggerebbero al
   contrario, nella moltiplicazione la colonna non è la somma delle cifre
   che ha sopra. */
export function spiegaColonnaAdd (numeri, i) {
  const parti = numeri.map(n => cifre(n)[i] || 0)
  let riporto = 0
  for (let c = 0; c < i; c++) {
    const s = numeri.reduce((t, n) => t + (cifre(n)[c] || 0), 0) + riporto
    riporto = Math.floor(s / 10)
  }
  const tot = parti.reduce((t, d) => t + d, 0) + riporto
  const conto = parti.join(' + ') + (riporto ? ` + ${riporto} di riporto` : '')
  return tot <= 9
    ? `${conto} fa ${tot}`
    : `${conto} fa ${tot}: scrivi ${tot % 10}, e ${Math.floor(tot / 10)} lo tieni per la colonna accanto`
}
const casuale = (min, max) => min + Math.floor(Math.random() * (max - min + 1))

/* le cifre di un numero diventano i passi da scrivere, da destra a sinistra */
const passiDa = (arr, k = 'ris') => arr.map((v, i) => ({ k, col: i, atteso: v }))

/* ---------- addizione, due addendi o più ---------- */
export function colonnaAddN(numeri) {
  const ris = cifre(numeri.reduce((s, n) => s + n, 0))
  return { ris, passi: passiDa(ris),
           colonne: Math.max(ris.length, ...numeri.map(n => String(n).length)) }
}

export const colonnaAdd = (a, b) => colonnaAddN([a, b])

/* ---------- sottrazione ---------- */
export function colonnaSub(a, b) {
  const ris = cifre(a - b)
  return { ris, passi: passiDa(ris), colonne: Math.max(ris.length, cifre(a).length) }
}

/* ---------- moltiplicazione per una cifra ---------- */
export function colonnaMul(a, m) {
  const ris = cifre(a * m)
  return { ris, passi: passiDa(ris), colonne: ris.length }
}

/* ---------- moltiplicazione per due cifre ----------
   Qui i due prodotti parziali sono passaggi del procedimento, non appunti:
   prima a×unità, poi a×decine incolonnato uno spazio più a sinistra, e
   infine la somma dei due. Si scrivono tutti e tre. */
export function colonnaMul2(a, b) {
  const bu = b % 10, bd = Math.floor(b / 10)
  const p1 = cifre(a * bu)
  const p2 = cifre(a * bd)          // va disegnato spostato di una colonna
  const ris = cifre(a * b)
  return {
    p1, p2, ris, doppia: true,
    passi: [...passiDa(p1, 'p1'), ...passiDa(p2, 'p2'), ...passiDa(ris)],
    colonne: Math.max(ris.length, p2.length + 1),
  }
}

/* ---------- divisione per una cifra, quoziente da sinistra ---------- */
export function colonnaDiv(a, m) {
  const dig = String(a).split('').map(Number)
  let resto = 0
  const quo = []
  for (const d of dig) {
    const cur = resto * 10 + d
    quo.push(Math.floor(cur / m))
    resto = cur % m
  }
  let inizio = 0
  while (inizio < quo.length - 1 && quo[inizio] === 0) inizio++
  const q = quo.slice(inizio)
  const passi = q.map((v, i) => ({ k: 'quo', col: i, atteso: v }))
  passi.push({ k: 'res', col: 0, atteso: resto })
  return { quoziente: q, resto, passi, colonne: q.length, saltate: inizio }
}

/* ═══════════ LA SCALETTA: DIECI GRADINI PER OPERAZIONE ═══════════
   Il livello è quello della torre: si costruisce al gradino 1 e si sale uno
   per volta, quindi la scaletta va percorsa tutta e in ordine. Ogni gradino
   cambia UNA cosa sola — prima le cifre, poi il riporto, poi quanti numeri —
   perché "sai fare 27+15, adesso prova 247+185+96" è un salto, non un passo.

     +   cifre → riporti → tre addendi → quattro
     −   cifre → prestiti → prestiti doppi → zeri di mezzo
     ×   cifre → riporti → moltiplicatore a due cifre → numeri grandi
     :   esatta → con resto → dividendo lungo → zero nel quoziente          */

export const LIVELLI = 10
const grado = lv => Math.max(1, Math.min(LIVELLI, Math.round(lv) || 1))

/* prova a generare finché la condizione non è soddisfatta: le condizioni qui
   sotto capitano spesso, e comunque dopo N tentativi si tiene quel che c'è */
function finoA(prova, vale, tentativi = 400) {
  let ultimo = prova()
  for (let i = 0; i < tentativi && !vale(ultimo); i++) ultimo = prova()
  return ultimo
}

const daCifre = arr => arr.reduce((n, d, i) => n + d * 10 ** i, 0)
const conLung = c => casuale(10 ** (c - 1), 10 ** c - 1)

/* quante colonne superano il nove: sono i riporti da tenere a mente */
function riporti(ns) {
  const colonne = Math.max(...ns.map(n => String(n).length))
  let quanti = 0, r = 0
  for (let c = 0; c < colonne; c++) {
    const somma = ns.reduce((s, n) => s + (cifre(n)[c] || 0), 0) + r
    r = Math.floor(somma / 10)
    if (r > 0) quanti++
  }
  return quanti
}

/* quante volte tocca chiedere in prestito alla colonna accanto */
function prestiti(a, b) {
  const A = cifre(a), B = cifre(b)
  let quanti = 0, p = 0
  for (let c = 0; c < A.length; c++) {
    const sopra = (A[c] || 0) - p, sotto = B[c] || 0
    if (sopra < sotto) { quanti++; p = 1 } else p = 0
  }
  return quanti
}

/* ---------- addizione: lunghezze dei numeri e riporti richiesti ---------- */
const RICETTE_ADD = [
  { lung: [2, 2], riporti: 0 },
  { lung: [2, 2], riporti: 1 },
  { lung: [3, 3], riporti: 0 },
  { lung: [3, 3], riporti: 1 },
  { lung: [2, 2, 2], riporti: 0 },
  { lung: [2, 2, 2], riporti: 1 },
  { lung: [4, 3], riporti: 1 },
  { lung: [3, 3, 2], riporti: 2 },
  { lung: [2, 2, 2, 2], riporti: 1 },
  { lung: [4, 3, 4], riporti: 2 },
]

/* senza riporti si costruisce colonna per colonna: le cifre di ogni colonna
   sommate devono stare sotto dieci, e cercarlo a tentativi non finirebbe mai */
function addSenzaRiporti(lung) {
  const colonne = Math.max(...lung)
  const cifreDi = lung.map(() => [])
  for (let c = 0; c < colonne; c++) {
    let resta = 9
    // chi ha la cifra più significativa qui non può metterci uno zero
    const attivi = lung.map((L, i) => (c < L ? i : -1)).filter(i => i >= 0)
    for (const i of attivi) {
      const ultimo = i === attivi[attivi.length - 1]
      const minimo = c === lung[i] - 1 ? 1 : 0
      const massimo = ultimo ? resta : Math.max(minimo, Math.floor(resta / 2))
      const d = casuale(minimo, Math.max(minimo, massimo))
      cifreDi[i][c] = d
      resta -= d
    }
    for (const i of lung.map((_, i) => i)) if (cifreDi[i][c] == null) cifreDi[i][c] = 0
  }
  return lung.map((L, i) => daCifre(cifreDi[i].slice(0, L)))
}

export function generaAdd(lv) {
  const r = RICETTE_ADD[grado(lv) - 1]
  const numeri = r.riporti === 0 ? addSenzaRiporti(r.lung)
    : finoA(() => r.lung.map(conLung), ns => riporti(ns) >= r.riporti)
  return { tipo: 'add', numeri, a: numeri[0], b: numeri[1], segno: '+',
           ...colonnaAddN(numeri), risultato: numeri.reduce((s, n) => s + n, 0) }
}

/* ---------- sottrazione ---------- */
const RICETTE_SUB = [
  { lung: [2, 2], prestiti: 0 },
  { lung: [2, 2], prestiti: 1 },
  { lung: [3, 3], prestiti: 0 },
  { lung: [3, 2], prestiti: 1 },
  { lung: [3, 3], prestiti: 1 },
  { lung: [3, 3], prestiti: 2 },
  { lung: [3, 3], prestiti: 1, zero: true },
  { lung: [4, 3], prestiti: 2 },
  { lung: [4, 4], prestiti: 2 },
  { lung: [4, 4], prestiti: 2, zero: true },
]

/* senza prestiti ogni cifra di sopra deve essere maggiore di quella di sotto */
function subSenzaPrestiti([la, lb]) {
  const A = [], B = []
  for (let c = 0; c < la; c++) {
    const minimo = c === la - 1 ? 1 : 0
    A[c] = casuale(Math.max(minimo, 1), 9)
    B[c] = c < lb ? casuale(c === lb - 1 ? 1 : 0, A[c]) : 0
  }
  return [daCifre(A), daCifre(B.slice(0, lb))]
}

export function generaSub(lv) {
  const r = RICETTE_SUB[grado(lv) - 1]
  let a, b
  if (r.prestiti === 0) {
    ;[a, b] = subSenzaPrestiti(r.lung)
  } else {
    const piccolo = 10 ** (r.lung[1] - 1)
    ;[a, b] = finoA(
      () => {
        let x = conLung(r.lung[0])
        // uno zero in mezzo al numero di sopra: il prestito deve saltare una colonna
        if (r.zero) { const C = cifre(x); C[casuale(1, C.length - 2)] = 0; x = daCifre(C) }
        const alto = Math.min(10 ** r.lung[1] - 1, x - 1)
        return [x, alto < piccolo ? piccolo : casuale(piccolo, alto)]
      },
      ([x, y]) => x > y && y >= piccolo && prestiti(x, y) >= r.prestiti &&
                  (!r.zero || String(x).slice(1, -1).includes('0')))
  }
  return { tipo: 'sub', a, b, segno: '−', ...colonnaSub(a, b), risultato: a - b }
}

/* ---------- moltiplicazione ----------
   il moltiplicatore arriva da fuori: così la torre magica allena proprio le
   tabelline che il gioco degli asteroidi ha trovato deboli */
const RICETTE_MUL = [
  { lung: 2, doppio: false, riporti: false },
  { lung: 2, doppio: false, riporti: true },
  { lung: 3, doppio: false, riporti: false },
  { lung: 3, doppio: false, riporti: true },
  { lung: 4, doppio: false, riporti: true },
  { lung: 2, doppio: true, dec: [2, 3] },
  { lung: 2, doppio: true, dec: [2, 9] },
  { lung: 3, doppio: true, dec: [2, 3] },
  { lung: 3, doppio: true, dec: [2, 9] },
  { lung: 4, doppio: true, dec: [2, 9] },
]

export function generaMul(lv, moltiplicatore) {
  const r = RICETTE_MUL[grado(lv) - 1]
  const u = moltiplicatore || casuale(2, 9)          // la tabellina da allenare
  if (!r.doppio) {
    if (r.riporti) {
      const a = finoA(() => conLung(r.lung), x => String(x).split('').some(d => +d * u > 9))
      return { tipo: 'mul', a, b: u, segno: '×', ...colonnaMul(a, u), risultato: a * u }
    }
    // senza riporti ogni cifra moltiplicata resta sotto dieci. Con una tabellina
    // alta resterebbe solo 11×9, quindi si ripiega su un moltiplicatore piccolo:
    // il procedimento viene prima della tabellina.
    const m = u <= 4 ? u : casuale(2, 4)
    const alto = Math.floor(9 / m)
    const C = Array.from({ length: r.lung }, (_, i) =>
      casuale(i === r.lung - 1 ? 1 : 0, alto))
    const a = daCifre(C)
    return { tipo: 'mul', a, b: m, segno: '×', ...colonnaMul(a, m), risultato: a * m }
  }
  // moltiplicatore a due cifre: entrano in scena i prodotti parziali
  const b = casuale(r.dec[0], r.dec[1]) * 10 + u
  const a = conLung(r.lung)
  return { tipo: 'mul', a, b, segno: '×', ...colonnaMul2(a, b), risultato: a * b }
}

/* ---------- divisione ---------- */
const RICETTE_DIV = [
  { lung: 2, divisore: [2, 5], resto: false },
  { lung: 2, divisore: [2, 5], resto: true },
  { lung: 3, divisore: [2, 5], resto: false },
  { lung: 3, divisore: [2, 5], resto: true },
  { lung: 3, divisore: [2, 9], resto: false },
  { lung: 3, divisore: [2, 9], resto: true },
  { lung: 3, divisore: [2, 9], resto: true, zeroQuoziente: true },
  { lung: 4, divisore: [2, 9], resto: false },
  { lung: 4, divisore: [2, 9], resto: true },
  { lung: 4, divisore: [6, 9], resto: true, zeroQuoziente: true },
]

export function generaDiv(lv) {
  const r = RICETTE_DIV[grado(lv) - 1]
  const m = casuale(r.divisore[0], r.divisore[1])
  const minimo = 10 ** (r.lung - 1), massimo = 10 ** r.lung - 1
  const a = finoA(
    () => {
      const q = casuale(Math.ceil(minimo / m), Math.floor(massimo / m))
      return q * m + (r.resto ? casuale(1, m - 1) : 0)
    },
    x => x >= minimo && x <= massimo &&
         (!r.zeroQuoziente || String(Math.floor(x / m)).slice(1).includes('0')))
  return { tipo: 'div', a, b: m, segno: ':', ...colonnaDiv(a, m),
           risultato: Math.floor(a / m) }
}

export const GENERATORI = { add: generaAdd, sub: generaSub, mul: generaMul, div: generaDiv }

/* ── quando un'operazione non si è ancora fatta a scuola ──
   Un bambino che le divisioni in colonna non le ha ancora viste non deve
   restare fuori dall'ultima tappa: nelle impostazioni dei genitori si
   spengono, e la torre Bombe chiede moltiplicazioni al posto loro. Non le
   stesse della torre magica, però: tre gradini più su, così la torre che
   costa di più resta quella che chiede di più, e il gioco non diventa più
   facile — diventa un'altra strada per lo stesso posto.

   Da quando anche le moltiplicazioni si possono spegnere, la stessa
   regola vale una scala intera: si scende all'operazione più difficile
   che resta, e ogni scalino sceso costa tre gradini di difficoltà in più.
   Divisioni spente → moltiplicazioni a +3. Spente pure quelle →
   sottrazioni a +6. Il patto è sempre quello, e vale la pena scriverlo:
   **togliere un'operazione non abbassa l'asticella**, sposta soltanto
   dove il bambino la incontra. Altrimenti spegnere un sapere sarebbe una
   scorciatoia, e un genitore lo userebbe per far vincere invece che per
   dire la verità su cosa il figlio ha già fatto.

   Sotto la sottrazione non si scende: addizione e sottrazione sono il
   pavimento del castello, e un gioco che chiede solo addizioni non è più
   il castello — a quel punto si spegne il gioco, che è un interruttore
   che i genitori hanno già. */
export const SALTO_SENZA = 3
/* alias storico: era il nome di quando l'unica spegnibile era la divisione */
export const SALTO_SENZA_DIVISIONI = SALTO_SENZA
export const RIPIEGO = { div: 'mul', mul: 'sub' }

/* `sa` dice cosa il bambino può fare. Regge due forme apposta: l'oggetto
   `{ div, mul }` di adesso, e il booleano di prima — che voleva dire «le
   divisioni» e basta. Non è pigrizia: `contoDi(t, false)` è scritto nei
   test e in mezzo castello, e cambiarlo tutto insieme al resto avrebbe
   mescolato un refuso di conversione con un cambio di regole. */
const normalizza = sa =>
  (sa === undefined || sa === null) ? {}
  : typeof sa === 'boolean' ? { div: sa }
  : sa

function ripiega (tipo, sa) {
  const puoi = t => t === 'div' ? sa.div !== false
                  : t === 'mul' ? sa.mul !== false
                  : true
  let t = tipo, scesi = 0
  while (!puoi(t) && RIPIEGO[t]) { t = RIPIEGO[t]; scesi++ }
  return { tipo: t, scesi }
}

export const contoDi = (tipo, sa) => ripiega(tipo, normalizza(sa)).tipo
export const gradoDi = (tipo, lv, sa) => {
  const { scesi } = ripiega(tipo, normalizza(sa))
  return Math.min(LIVELLI, lv + scesi * SALTO_SENZA)
}
/* il segno che il banco mostra sul tasto della torre */
export const segnoDi = (tipo, sa) => TORRI[contoDi(tipo, sa)].segno

/* Le torri. `stadi` è come cambiano di aspetto salendo la scaletta: una torre
   che ha superato sei operazioni deve *vedersi* che è un'altra cosa, altrimenti
   il lavoro fatto resta un numeretto in un angolo.

   ── i due rami ──
   A metà scaletta ognuna può diventare due cose diverse (`rami`). Qui ci
   sono i nomi, i colori e le descrizioni; i numeri — quanto danno, ogni
   quanto, fin dove — stanno in `data/castello.js` insieme a tutto il
   resto dell'equilibrio, perché la regola che li tiene onesti è una
   sola: **i due rami valgono lo stesso**. Cambia la forma del danno,
   non la quantità, e per questo il modello che tara le tappe può
   continuare a ignorarli.

   La chiave è **l'operazione**, non la torre: `sub` vuol dire «la torre che
   si compra facendo sottrazioni». Quale torre sia lo dice `aspetto`, e i
   due non coincidono per un motivo preciso.

   Le operazioni entrano nell'ordine dei libri — + − × : — e la seconda
   torre che un bambino si guadagna non può essere il ghiaccio, che non fa
   danno: se la prima cosa che ti compri con un calcolo difficile non
   ammazza niente, pensi di aver sbagliato tu. Quindi la sottrazione dà la
   torre magica, che fa danno a zona e si vede lavorare, e il ghiaccio
   arriva con la moltiplicazione — terzo, quando c'è già una difesa che
   approfitta dei nemici tenuti fermi.

   L'ordine qui sotto è anche quello dei tasti nel banco, e deve restare
   quello di sblocco: vedere una torre al secondo posto per tutta la
   partita in cui non ce l'hai ancora è confuso e pure bugiardo. */
export const TORRI = {
  add: { nome: 'Arciere',  aspetto: 'arciere', emoji: '🏹', segno: '+', colore: '#38c172',
         stadi: ['🏹', '🎯', '🦅'],
         raggio: 92,  danno: 11, ricarica: 0.62, area: 0,  descr: 'colpi rapidi su un nemico',
         rami: {
           cecchino: { nome: 'Cecchino', segno: '🎯', colore: '#1f7a4a',
                       descr: 'vede più lontano e colpisce forte, ma piano' },
           raffica:  { nome: 'Raffica',  segno: '🌪', colore: '#7ecb56',
                       descr: 'due frecce per volta, su due nemici' },
         } },
  sub: { nome: 'Magica',   aspetto: 'magica',  emoji: '🔮', segno: '−', colore: '#a06bff',
         stadi: ['🔮', '✨', '🧙'],
         raggio: 104, danno: 24, ricarica: 1.5,  area: 46, descr: 'onda magica che colpisce a zona',
         rami: {
           veleno: { nome: 'Veleno', segno: '☠', colore: '#61b53a',
                     descr: 'colpisce piano ma il male continua da solo' },
           catena: { nome: 'Catena', segno: '⚡', colore: '#c48bff',
                     descr: 'il colpo rimbalza sui nemici vicini' },
         } },
  mul: { nome: 'Ghiaccio', aspetto: 'ghiaccio', emoji: '❄️', segno: '×', colore: '#4aa3ff',
         stadi: ['❄️', '🧊', '⛄'], gela: true,
         /* quanto frena e per quanto lo dice `geloDi()` in data/castello.js,
            perché dipende dal livello: qui resterebbe un numero morto */
         raggio: 86,  danno: 0,  ricarica: 0.5,  area: 0,
         descr: 'non fa danno: congela i nemici vicini',
         rami: {
           bufera: { nome: 'Bufera', segno: '🌬', colore: '#7fc6ff',
                     descr: 'gela molto più largo, ma frena di meno' },
           brina:  { nome: 'Brina',  segno: '💎', colore: '#2b7fd4',
                     descr: 'frena di più, e chi è gelato prende più danno' },
         } },
  div: { nome: 'Bombe',    aspetto: 'bombe',   emoji: '💣', segno: ':', colore: '#ff7a3d',
         stadi: ['💣', '🧨', '🚀'],
         raggio: 132, danno: 44, ricarica: 2.3,  area: 62, descr: 'colpo lento e devastante',
         rami: {
           mortaio: { nome: 'Mortaio', segno: '🎇', colore: '#d1521c',
                      descr: 'arriva lontanissimo, e quando arriva pesa' },
           napalm:  { nome: 'Napalm',  segno: '🔥', colore: '#ffab3d',
                      descr: 'scoppia più largo e lascia tutti a bruciare' },
         } },
}

/* tre stadi lungo i dieci gradini: 1-3 la torre com'è nata, 4-6 cresciuta,
   7-10 al massimo di quello che può diventare */
export const stadioDi = lv => (lv <= 3 ? 0 : lv <= 6 ? 1 : 2)
export const emojiTorre = (tipo, lv = 1) => TORRI[tipo].stadi[stadioDi(lv)]

/* i due mestieri fra cui una torre può scegliere, in forma di elenco:
   la scheda li mostra così, e chi non ne ha (nessuno, per ora) ne mostra
   zero senza doverlo sapere */
export const ramiDi = tipo => Object.entries(TORRI[tipo].rami || {})
  .map(([id, r]) => ({ id, ...r }))
