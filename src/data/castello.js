/* Difendi il Castello: i conti dietro le tappe. Il racconto (nome, percorso,
   mostri, torri) sta in `campagne-castello.js`; qui i numeri, derivati da
   una promessa sola: una tappa costa il numero di calcoli che promette.
   Vedi docs/castello/taratura.md e torri.md. */
import { TORRI } from './ops.js'
import { MOSTRI, ABILITA, CAPO, MISTA, feritoDa, firmaImmunita, guastiDelleImmunita, mostroDiOnda,
         coppiaDellOnda, coppieDi, comune } from './mostri.js'
import { RACCONTO, LIBERE_RACCONTO } from './campagne-castello.js'
import { VITE, FIRMA, OLTRE } from './taratura-castello.js'
import { sullaCarta } from '../motore/castello/carta.js'

export const CFG = {
  cuori: 5,
  nemiciBase: 4, nemiciPiu: 3,
  vitaBase: 42, vitaPiu: 0.38,
  velBase: 26, velPiu: 1.6,
  respiro: 1,

  // Prezzi base, l'energia e la fretta: vedi docs/castello/taratura.md.
  // Costruire rincara di poco (+10 a torre, era +20) e salire rincara a
  // ogni gradino (30, 34, 38… 62, era 36 +2): un ⚡ nei gradini rende un
  // po' meno di un ⚡ in una torre nuova, e sempre meno salendo — si sale
  // quando i posti finiscono. Con +20 e +2 la mossa migliore era una
  // torre per tipo e poi solo gradini (l'utente). Il gradino più caro sta
  // sotto il doppio di una torre: un acquisto è un calcolo.
  costruzione: 40, costruzionePiu: 10,
  potenziamento: 30, potenziamentoPiu: 4,
  perNemico: 2,
  fineOnda: 4, ondataPulita: 6,
  // il tetto della fretta è a 5 (era 6) da quando i gradini bassi costano
  // meno: con 6 chi corre sempre arrivava a tre acquisti in più
  fretta: { perSecondo: 0.12, tetto: 5 },
  attesaLarga: 45, attesaStretta: 20,
  malusErrore: 6,
  spostamento: 2,
}

// Il campo è uno solo, uguale su ogni schermo (verticale): la telecamera
// lo incornicia dove c'è posto. S=1,3 tiene la stessa area del campo di
// prima (420×760 invece di 390×420). Vedi docs/castello/taratura.md.
export const MONDO = { W: 420, H: 760, S: 1.3 }

// Il listino (moltiplica tutto quello che una torre costa) e la resa (quanto
// rende un ⚡ speso, rispetto all'arciere): vedi docs/castello/torri.md.
export const CARATTERE = {
  arciere:  { prezzo: 0.6, resa: 1.0 },
  ghiaccio: { prezzo: 0.5, resa: 1.0 },
  magica:   { prezzo: 1.0, resa: 1.1 },
  bombe:    { prezzo: 1.4, resa: 1.2 },
}
const carattereDi = k => CARATTERE[TORRI[k]?.aspetto] || { prezzo: 1, resa: 1 }
/* il listino di una torre; senza torre, il prezzo base */
export const listinoDi = k => (k ? carattereDi(k).prezzo : 1)
export const resaDi = k => carattereDi(k).resa

/* ── come cresce una torre quando sale di livello ──

   Ogni torre cresce nel suo mestiere (arciere: cadenza, magica: area,
   bombe: danno, e dal 7° livello una doppia salva più piccola). Tutte e
   tre quelle che feriscono salgono con la stessa pendenza, e quasi dritte:
   ogni gradino aggiunge più o meno quanto il primo, così coi gradini che
   rincarano il ⚡ cumulato cala piano (0,77 al livello 4, 0,73 al 10 per
   l'arciere, nel modello). Prima la crescita si moltiplicava su sé stessa
   (arciere: danno +45% e cadenza +12% a gradino) e il livello 10 rendeva
   per ⚡ più di una torre nuova. L'area delle bombe non cresce più: il
   loro scoppio resta di una cella. Vedi docs/castello/torri.md. */
export const CRESCITA = {
  arciere:  { danno: 0.37, cadenza: 0.10,  area: 0 },
  magica:   { danno: 0.45, cadenza: 0,     area: 0.08 },
  ghiaccio: { danno: 0,    cadenza: 0,     area: 0 },
  bombe:    { danno: 0.62, cadenza: 0,     area: 0, salveDa: 7, salve: 2, perSalva: 0.65 },
}
const crescitaDi = k => CRESCITA[TORRI[k].aspetto] || CRESCITA.arciere

// I due rami: stesso valore del tronco, misurato con `npm run dps` (non a
// occhio), perché il ramo si prende al prezzo di un gradino qualunque e non
// come la torre. Il mortaio è la gittata più lunga del campo, ma non di una
// cella intera: ×1,25 sulle bombe fa 130 (una cella è 35), e spara un po'
// più spesso di prima perché con lo scoppio stretto a ogni colpo ne prende
// meno. Vedi docs/castello/torri.md.
export const RAMI = {
  cecchino: { danno: 1.8,  ricarica: 1.7, raggio: 1.3 },
  raffica:  { danno: 0.55, ricarica: 1.1, salve: 2 },
  veleno:   { danno: 0.5,  veleno: 0.75,  durata: 3 },
  catena:   { danno: 0.95, rimbalzi: 2 },
  bufera:   { freno: 1.0,  raggio: 1.5,   durata: 1.4 },
  brina:    { freno: 1.1,  fragile: 1.08, raggio: 0.9 },
  mortaio:  { danno: 1.6,  ricarica: 1.35, raggio: 1.25, area: 0.85 },
  napalm:   { danno: 0.55, veleno: 0.55,  durata: 3, area: 1.15 },
}

// Quarto gradino: prima ci sono tre salite per capire cosa fa la torre.
export const RAMI_DA = 4

// Come tira la torre `k` al livello `lv`, per il ramo scelto: la usano sia
// il gioco sia il modello.
export function tiroDi(k, lv, ramo = null) {
  const c = crescitaDi(k), n = Math.max(0, lv - 1), T = TORRI[k]
  const r = RAMI[ramo] || {}
  const salve = r.salve || (c.salveDa && lv >= c.salveDa ? c.salve : 1)
  // le due salve sono più piccole della singola: il gradino non raddoppia
  const perColpo = salve > 1 && !r.salve ? (c.perSalva || 1) : 1
  const danno = T.danno * (1 + n * c.danno) * perColpo
  const durata = r.durata || 0
  return {
    danno: danno * (r.danno ?? 1),
    ricarica: T.ricarica / (1 + n * c.cadenza) * (r.ricarica ?? 1),
    area: T.area * (1 + n * c.area) * (r.area ?? 1),
    salve,
    veleno: r.veleno && durata ? danno * r.veleno / durata : 0,
    durata,
    rimbalzi: r.rimbalzi || 0,
  }
}

export const raggioDi = ramo => (RAMI[ramo] || {}).raggio || 1

export const forzaDi = (k, lv) => dpsDi(k, lv) / dpsDi(k, 1)

// Il gelo: come il ghiaccio "fa danno" senza farne. Il freno si ferma al
// 75% (un nemico del tutto bloccato spegne la partita); la brina rende
// fragile chi è gelato invece di frenare di più.
export const geloDi = (lv, ramo = null) => {
  const r = RAMI[ramo] || {}
  return {
    freno: Math.min(0.75, (0.56 + (lv - 1) * 0.02) * (r.freno ?? 1)),
    durata: (1.6 + (lv - 1) * 0.18) * (r.durata ?? 1),
    fragile: r.fragile || 1,
  }
}

/* Il danno al secondo efficace: conta tutti i bersagli che una torre ad
   area prende (un bersaglio in più ogni `BERSAGLI.area` unità di raggio,
   misurato con `npm run dps`). Su nemici che non muoiono mai l'area ne
   prende tre o quattro, ma i nemici veri muoiono e il gruppo si sfoltisce.
   Il ghiaccio non fa danno: il suo valore è quello che la regola gli
   assegna, e `npm run dps` controlla che lo valga davvero. */
export const BERSAGLI = { area: 45, rimbalzo: 0.5 }
const bersagliDi = area => 1 + (area || 0) / BERSAGLI.area

export function dpsDi(k, lv = 1, ramo = null) {
  if (!TORRI[k].danno) {
    return resaDi(k) * listinoDi(k) / listinoDi('add') * dpsDi('add', lv)
  }
  const t = tiroDi(k, lv, ramo)
  const colpo = t.danno * t.salve / t.ricarica
  const male = t.veleno * t.salve * Math.min(t.durata, t.ricarica) / t.ricarica
  const rimbalzi = t.rimbalzi ? t.danno * BERSAGLI.rimbalzo / t.ricarica : 0
  return (colpo + male) * bersagliDi(t.area) + rimbalzi
}

const DPS = dpsDi('add', 1)

export const resaPerEnergia = (k, lv = 1) =>
  (dpsDi(k, lv) / listinoDi(k)) / (dpsDi('add', lv) / listinoDi('add'))

// La resa media delle torri di una tappa, per ⚡ speso: la misura con cui
// `faticaDi` confronta tappe che danno torri diverse.
export function resaTipi(tipi, lv = 1) {
  const lista = tipi && tipi.length ? tipi : ['add']
  return lista.reduce((s, k) => s + dpsDi(k, lv) / listinoDi(k), 0) / lista.length /
         (DPS / listinoDi('add'))
}

export const potenzaDi = torri => torri.reduce((s, t) => s + dpsDi(t.tipo, t.lv), 0)

export const nemiciDiOnda = o => CFG.nemiciBase + o * CFG.nemiciPiu
export const vitaDiOnda = (o, durezza) => CFG.vitaBase * durezza * (1 + o * CFG.vitaPiu)
export const intervalloDiOnda = o => Math.max(0.45, 1.4 - o * 0.05)
const intervallo = intervalloDiOnda
const durataOnda = o => nemiciDiOnda(o) * intervallo(o) + 6

// La vita di un nemico è tarata ondata per ondata (`npm run tara`, in
// taratura-castello.js). Oltre la tabella (solo le libere) si riparte dallo
// stesso mostro, al passo di tutta la tabella e mai più svelto di `oltre` —
// non dal mostro più alto della tabella, o un salto vecchio si ripete a ogni
// giro. Vedi docs/castello/taratura.md.
export function vitaNemico(tappa, onda) {
  const v = tappa.vite
  if (!v || !v.length) return vitaDiOnda(onda, tappa.durezza)
  if (onda <= v.length) return v[onda - 1]
  const passo = tappa.oltre || 1.2
  const n = v.length
  const chi = o => (tappa.capi && o % tappa.capi === 0 ? 'capo'
                    : coppiaDellOnda(tappa, o) ? 'mista'
                    : mostroDiOnda(tappa.mostri || [], o))
  let ultima = 0
  for (let j = 1; j <= n; j++) if (chi(j) === chi(onda)) ultima = j
  const giro = Math.max(1, (tappa.mostri || []).length)
  const livello = (da, a) => {
    const xs = []
    for (let j = Math.max(1, da); j <= a; j++)
      if (chi(j) !== 'capo' && chi(j) !== 'mista') xs.push(Math.log(v[j - 1]))
    return xs.length ? Math.exp(xs.reduce((s, x) => s + x, 0) / xs.length) : null
  }
  const fine = livello(n - giro + 1, n), prima = livello(n - 2 * giro + 1, n - giro)
  if (!ultima) return Math.round((fine || Math.max(...v)) * Math.pow(passo, onda - n))
  const ritmo = fine && prima ? Math.min(passo, Math.max(1, Math.pow(fine / prima, 1 / giro))) : passo
  return Math.round(v[ultima - 1] * Math.pow(ritmo, n - ultima) * Math.pow(passo, onda - n))
}
export const velocitaNemico = (tappa, onda) =>
  (CFG.velBase + onda * CFG.velPiu) * (0.85 + 0.15 * tappa.durezza)

// Arrotondati, perché a schermo si leggono.
export const costoNuovaTorre = (quante, k = null) =>
  Math.round(listinoDi(k) * (CFG.costruzione + CFG.costruzionePiu * quante))
export const costoSalita = (lv, k = null) =>
  Math.round(listinoDi(k) * (CFG.potenziamento + CFG.potenziamentoPiu * (lv - 1)))

export const premioDellaFretta = secondi =>
  Math.max(0, Math.min(CFG.fretta.tetto, Math.floor(secondi * CFG.fretta.perSecondo)))

// Dal bersaglio alla tappa: una tappa dichiara `calcoli` e `cap`, il resto
// esce da qui. Il giocatore modello è descritto in docs/castello/taratura.md.

// Due torri, o una per ingresso se sono di più: il minimo per non regalare
// cuori alla prima ondata.
export const primeQuante = tappa => Math.max(2, ingressiDi(tappa))

// Che torre costruisce il giocatore modello, per il piano, `difesaCon` e il
// simulatore: prima le torri di apertura (una per ingresso, che coprono più
// ondate di fila dall'inizio), poi quelle urgenti strada per strada, poi a
// giro. Vedi docs/castello/taratura.md.
export const ONDATE_TARATE = 20

export const PREAVVISO_MISTE = 3

// Da che bocca arriva l'ondata `o`: con una strada sola sempre 0, con due si
// alternano e ogni terza arriva da tutte e due insieme (-1), non prima di
// `daQuandoInsieme`. Lo sa anche il giocatore modello (`Ondate.viaDi`).
export function boccaDellOnda(o, vie, daQuandoInsieme = Infinity) {
  if (vie < 2) return 0
  if (o % 3 === 0 && o >= daQuandoInsieme) return -1
  return Math.floor((o - 1 - Math.floor((o - 1) / 3)) % vie)
}

// Da quale ondata le bocche arrivano insieme: un terzo della tappa, mai
// prima della quinta. Le libere si contano come se avessero `ONDATE_TARATE`
// ondate, così gioco e taratura vedono la stessa partita.
export function insiemeDa(ondate) {
  if (!ondate) return 5
  return Math.max(5, Math.ceil(Math.min(ondate, ONDATE_TARATE) / 3))
}

/* tutte le file di `n` torri prese da `lista` (anche ripetute) */
function file(lista, n) {
  if (n <= 0) return [[]]
  return lista.flatMap(x => file(lista, n - 1).map(resto => [x, ...resto]))
}

// Le prime torri vanno una per bocca: non basta che la coppia ferisca chi
// arriva, deve ferirlo la torre dalla sua parte (nel Canneto il rovo della
// seconda ondata scende dall'altra bocca).
function apertura(tappa, sparano, fila) {
  const quante = primeQuante(tappa)
  const tocca = (tipi, m) => tipi.some(k => feritoDa(m, k))
  const copre = tipi => ondateFerite(tappa, tipi, APERTURA_COPRE)
  const ferisce = tipi => fila.filter(m => tocca(tipi, m)).length
  const diverse = tipi => new Set(tipi).size
  const costo = tipi => tipi.reduce((s, k, i) => s + costoNuovaTorre(i, k), 0)
  // la prima torre deve ferire la prima ondata da sola
  const primaTocca = tipi => (fila.length && feritoDa(fila[0], tipi[0]) ? 1 : 0)
  return file(sparano, quante)
    .sort((a, b) => copre(b) - copre(a) || primaTocca(b) - primaTocca(a) ||
                    ferisce(b) - ferisce(a) || diverse(b) - diverse(a) ||
                    costo(a) - costo(b))[0] || []
}

// La fila dei tipi; accanto `strade` (su che strada va ogni torre) e
// `urgenti` (quali si comprano prima di salire).
export function sequenzaTorri(tappa, quante = 32) {
  const tipi = tappa.torri && tappa.torri.length ? tappa.torri : ['add']
  const sparano = tipi.filter(k => TORRI[k].danno)
  const fila = tappa.mostri || []
  const vie = ingressiDi(tappa)
  const scelte = [], strade = []
  const urgenti = new Set()
  if (sparano.length) {
    apertura(tappa, sparano, fila).forEach((k, j) => {
      scelte.push(k); strade.push(vie < 2 ? 0 : j % vie); urgenti.add(j)
    })
  }
  // due giri della fila: basta perché ogni mostro scenda da ogni strada
  if (sparano.length)
    for (let o = 1; o <= fila.length * vie * 2 && scelte.length < quante; o++) {
      const m = fila[(o - 1) % fila.length]
      const bocca = boccaDellOnda(o, vie, insiemeDa(tappa.ondate))
      for (let v = 0; v < vie; v++) {
        if (bocca >= 0 && v !== bocca) continue
        if (scelte.some((k, j) => strade[j] === v && feritoDa(m, k))) continue
        const k = sparano.find(x => feritoDa(m, x))
        if (!k || scelte.length >= quante) continue
        urgenti.add(scelte.length); scelte.push(k); strade.push(v)
      }
    }
  // Le ondate miste stanno accanto (`miste`), come bisogni che si accendono
  // dal preavviso: non entrano nella fila, che è la promessa dei `calcoli`.
  // Vedi docs/castello/mostri.md.
  const miste = []
  if (sparano.length) {
    const fino = Math.min(Number.isFinite(tappa.ondate) ? tappa.ondate : ONDATE_TARATE, ONDATE_TARATE)
    for (let o = 1; o <= fino; o++) {
      const coppia = coppiaDellOnda(tappa, o)
      if (!coppia) continue
      const bocca = boccaDellOnda(o, vie, insiemeDa(tappa.ondate))
      for (const m of coppia)
        for (let v = 0; v < vie; v++) {
          if (bocca >= 0 && v !== bocca) continue
          const k = sparano.find(x => feritoDa(m, x))
          if (k) miste.push({ da: Math.max(1, o - PREAVVISO_MISTE), onda: o, mostro: m, tipo: k, strada: v })
        }
    }
  }
  const quanteDi = k => scelte.filter(x => x === k).length
  while (scelte.length < quante) {
    const k = [...tipi].sort((a, b) => quanteDi(a) - quanteDi(b) ||
                                       tipi.indexOf(a) - tipi.indexOf(b))[0]
    const perStrada = v => strade.filter(x => x === v).length
    const v = Array.from({ length: vie }, (_, i) => i).sort((a, b) => perStrada(a) - perStrada(b))[0]
    scelte.push(k); strade.push(v)
  }
  scelte.strade = strade
  scelte.urgenti = urgenti
  scelte.miste = miste
  return scelte
}

// Le prime ondate di fila che le torri di apertura devono ferire, ognuna
// dalla sua strada (otto e non quattro: vedi docs/castello/mostri.md).
export const APERTURA_COPRE = 8

// Quante ondate, dall'inizio, le torri `tipi` (la `j`-esima sulla strada
// `j % bocche`) feriscono tutte.
function ondateFerite(tappa, tipi, fino = Infinity) {
  const fila = tappa.mostri || []
  if (!fila.length) return 0
  const vie = ingressiDi(tappa)
  const insieme = insiemeDa(tappa.ondate)
  const ultima = Math.min(fino, Number.isFinite(tappa.ondate) ? tappa.ondate
                                 : Math.max(APERTURA_COPRE, fila.length * 2))
  let n = 0
  for (let o = 1; o <= ultima; o++) {
    const chi = coppiaDellOnda(tappa, o) || [mostroDiOnda(fila, o)]
    const via = boccaDellOnda(o, vie, insieme)
    const strade = vie < 2 ? [0] : via < 0 ? Array.from({ length: vie }, (_, v) => v) : [via]
    const ferite = chi.every(m => strade.every(v =>
      tipi.some((k, j) => (vie < 2 || j % vie === v) && feritoDa(m, k))))
    if (!ferite) break
    n++
  }
  return n
}
export function coperturaApertura(tappa) {
  return ondateFerite(tappa, sequenzaTorri(tappa, primeQuante(tappa)))
}

// Il registro di quali tappe non arrivano a coprire `APERTURA_COPRE`, col
// perché: **deve restare vuoto** (`unita/immunita-castello` lo pretende).
// Vedi docs/castello/mostri.md.
export const APERTURA_CORTA = {}

// La mossa che il giocatore modello farebbe adesso: `{ che: 'nuova', tipo,
// costo }` o `{ che: 'salita', indice, costo }`, o `null`. `largo` è chi non
// potenzia mai; `onda` accende i bisogni delle miste contro le torri in campo.
// Fra salire la torre più bassa e costruire la prossima sceglie quella che
// compra più potenza per ⚡ (sceglieva la più economica, e coi gradini che
// costavano sempre meno di una torre saliva sempre).
export function prossimoAcquisto(torri, tappa, { posti = Infinity, largo = false,
                                                  sequenza = null, onda = 0 } = {}) {
  const fila = sequenza || sequenzaTorri(tappa)
  const tipo = fila[Math.min(torri.length, fila.length - 1)]
  const strada = fila.strade ? fila.strade[Math.min(torri.length, fila.length - 1)] : 0
  const nuova = torri.length < posti
    ? { che: 'nuova', tipo, strada, costo: costoNuovaTorre(torri.length, tipo) } : null
  let indice = -1
  for (let i = 0; i < torri.length; i++)
    if (torri[i].lv < tappa.cap && (indice < 0 || torri[i].lv < torri[indice].lv)) indice = i
  const salita = indice >= 0
    ? { che: 'salita', indice, costo: costoSalita(torri[indice].lv, torri[indice].tipo) } : null
  if (nuova && (torri.length < primeQuante(tappa) || fila.urgenti?.has(torri.length))) return nuova
  const vie = ingressiDi(tappa)
  const manca = (fila.miste || []).find(b => b.da <= onda && onda < b.onda &&
    !torri.some(t => (vie < 2 || t.via == null || t.via === b.strada) && feritoDa(b.mostro, t.tipo)))
  if (manca && torri.length < posti)
    return { che: 'nuova', tipo: manca.tipo, strada: manca.strada,
             costo: costoNuovaTorre(torri.length, manca.tipo) }
  if (largo) return nuova
  if (!salita || !nuova) return salita || nuova
  // il più conveniente per ⚡: quanta potenza in più compra il gradino
  // contro quanta ne compra la torre nuova
  const t = torri[indice]
  const perSalita = (dpsDi(t.tipo, t.lv + 1) - dpsDi(t.tipo, t.lv)) / salita.costo
  const perNuova = dpsDi(tipo, 1) / nuova.costo
  return perSalita >= perNuova ? salita : nuova
}

/* comprare davvero: la stessa mossa applicata a una lista di torri */
function compra(torri, m) {
  if (m.che === 'nuova') torri.push({ tipo: m.tipo, lv: 1 })
  else torri[m.indice] = { ...torri[m.indice], lv: torri[m.indice].lv + 1 }
}

export function pianoDi(tappa) {
  const sequenza = sequenzaTorri(tappa)
  const torri = [], passi = []
  for (let k = 0; k < tappa.calcoli; k++) {
    const m = prossimoAcquisto(torri, tappa, { sequenza })
    if (!m) break
    passi.push(m.costo); compra(torri, m)
  }
  return { torri: torri.map(t => t.lv), tipi: torri.map(t => t.tipo), passi,
           costo: passi.reduce((s, x) => s + x, 0) }
}

// Il bonus della fretta non c'è dentro apposta: è un premio, non un dovuto.
export const entrataOnda = o => nemiciDiOnda(o) * CFG.perNemico + CFG.fineOnda + CFG.ondataPulita

// Le torri con cui si comincia: la sola parte del piano che le ondate non
// possono pagare, perché viene prima della prima.
const primeTorri = tappa => {
  const fila = sequenzaTorri(tappa, primeQuante(tappa))
  return fila.reduce((s, k, i) => s + costoNuovaTorre(i, k), 0)
}

// Tante quante ne servono perché le entrate paghino il piano (meno le due
// torri di partenza), e non una di più.
export function ondateDi(tappa) {
  const daGuadagnare = pianoDi(tappa).costo - primeTorri(tappa)
  let quante = 0, entrate = 0
  while (entrate + entrataOnda(quante + 1) <= daGuadagnare) entrate += entrataOnda(++quante)
  return Math.max(3, quante)
}

// Quello che le ondate non arrivano a pagare, mai meno di due torri. Senza
// un bersaglio di calcoli (le libere) due torri e mezza scaletta a prezzo
// base.
export function partenzaDi(tappa) {
  if (!tappa.calcoli) {
    let e = costoNuovaTorre(0) + costoNuovaTorre(1)
    for (let lv = 1; lv < Math.max(2, Math.ceil(tappa.cap / 2)); lv++) e += costoSalita(lv)
    return Math.round(e)
  }
  const ondate = tappa.ondate || ondateDi(tappa)
  let entrate = 0
  for (let o = 1; o <= ondate; o++) entrate += entrataOnda(o)
  return Math.max(primeTorri(tappa), pianoDi(tappa).costo - entrate)
}

// Almeno il doppio delle torri del piano e mai meno delle torri offerte;
// sopra, una quota per campagna. Vedi docs/castello/taratura.md («Le piazzole»).
export const PIAZZOLE = { bosco: 8, sotterraneo: 12, mura: 14, palude: 12 }
export const PIAZZOLE_PER_INGRESSO = 4
export const PIAZZOLE_LIBERE = 20
export const ingressiDi = t => (t.forme || [t.forma || []]).length
// Quante difese separate chiede davvero una tappa: non è il numero di
// bocche. Due strade che restano separate ne chiedono due; due che si
// fondono ne chiedono meno (`fronti`, dichiarato dalla tappa).
export const frontiDi = t => t.fronti || ingressiDi(t)
export function postiDi(tappa) {
  const piano = pianoDi(tappa).torri.length
  const minimo = Math.max(2 * piano, piano + 1, 3, (tappa.torri || []).length)
  return Math.max(minimo, PIAZZOLE[tappa.campagna] || 0) +
         (ingressiDi(tappa) - 1) * PIAZZOLE_PER_INGRESSO
}

// Comprare tutto: occupare ogni posto e portare ogni torre in cima.
export function costoDifesaPiena(tappa) {
  const { posti, cap } = tappa
  const fila = sequenzaTorri(tappa, posti)
  let costo = 0
  for (let i = 0; i < posti; i++) {
    costo += costoNuovaTorre(i, fila[i])
    for (let lv = 1; lv < cap; lv++) costo += costoSalita(lv, fila[i])
  }
  return costo
}

export function energiaAll(o, partenza) {
  let e = partenza
  for (let k = 1; k < o; k++) e += entrataOnda(k)
  return e
}

// Il margine che resta a chi gioca meglio del modello (con tutto il
// premio della fretta): non è la misura su cui si tara.
export function energiaMassima({ ondate, partenza }) {
  return energiaAll(ondate + 1, partenza) + CFG.fretta.tetto * ondate
}

// Il giocatore modello: applica `prossimoAcquisto` finché l'energia basta.
export function difesaCon(energia, tappa, { largo = false } = {}) {
  const sequenza = sequenzaTorri(tappa, Math.max(32, tappa.posti || 0))
  const torri = []
  let resta = energia, prossima = null
  for (let giro = 0; giro < 400; giro++) {
    const m = prossimoAcquisto(torri, tappa, { posti: tappa.posti, largo, sequenza })
    if (!m || m.costo > resta) { prossima = m; break }
    resta -= m.costo; compra(torri, m)
  }
  return { torri: torri.map(t => t.lv), tipi: torri.map(t => t.tipo),
           potenza: potenzaDi(torri), resta, prossima: prossima ? prossima.costo : Infinity }
}

// Il modello che *prima* stimava la difficoltà (ora la trova `npm run tara`
// giocando davvero): resta per la velocità dei nemici e la vita oltre la
// tabella nelle libere. Vedi docs/castello/taratura.md.
export const RESA = 0.55
export const MARGINE = 1.35

// Quante volte il danno in campo copre la vita dei nemici in arrivo. Con più
// ingressi conta `frontiDi` (le strade separate), non le bocche: contro
// un'ondata su una strada lavora solo la difesa di quella strada.
export function margineDi(tappa, o) {
  const { cap, posti, partenza, durezza, torri } = tappa
  const { potenza } = difesaCon(energiaAll(o, partenza), tappa)
  const danno = potenza / frontiDi(tappa) * durataOnda(o) * RESA
  return danno / (nemiciDiOnda(o) * vitaDiOnda(o, durezza))
}

export function durezzaDi(tappa) {
  let peggiore = Infinity
  for (let o = 1; o <= tappa.ondate; o++)
    peggiore = Math.min(peggiore, margineDi({ ...tappa, durezza: 1 }, o) / MARGINE)
  return Math.round(peggiore * 20) / 20
}

// Quanto è dura davvero una tappa: la robustezza dei nemici misurata sulla
// difesa che quella tappa offre (torri diverse, uno o due ingressi).
export const faticaDi = t => t.durezza * frontiDi(t) / resaTipi(t.torri)

// Deve tornare uguale a `calcoli`: il controllo che tiene onesta tutta la
// derivazione.
export function operazioniDi(t) {
  const finale = difesaCon(energiaAll(t.ondate + 1, t.partenza), t)
  return finale.torri.length + finale.torri.reduce((s, lv) => s + lv - 1, 0)
}


// Il termine di paragone: solo torri di livello 1, mai potenziate.
export const difesaLarga = (energia, tappa) => difesaCon(energia, tappa, { largo: true })

export const attesaDi = (i, quante) =>
  Math.round(CFG.attesaLarga - (CFG.attesaLarga - CFG.attesaStretta) * (i / Math.max(1, quante - 1)))

// campagna/nome: due campagne possono raccontare due tappe con lo stesso
// nome, e non devono pescare le stesse vite tarate.
export const chiaveTappa = t => (t.campagna ? `${t.campagna}/${t.nome}` : t.nome)

export const TAPPE = RACCONTO.map((t, i) => {
  const ondate = ondateDi(t)
  const posti = postiDi(t)
  const partenza = partenzaDi({ ...t, ondate })
  const base = { ...t, ondate, posti, partenza, attesa: attesaDi(i, RACCONTO.length) }
  const tappa = { ...base, durezza: durezzaDi(base), vite: VITE[chiaveTappa(t)],
           miste: MISTA.campagne.includes(t.campagna) && ondate > APERTURA_COPRE }
  return tappa.miste ? { ...tappa, ...mistaDelPiano(tappa) } : tappa
})

// La mista della campagna chiede solo torri che il piano ha già dalla sua
// strada, o farebbe fare meno conti di quelli promessi: vedi mostri.md.
function mistaDelPiano(tappa) {
  const tutte = coppieDi(tappa)
  const sequenza = sequenzaTorri(tappa)
  const piano = pianoDi(tappa).tipi.map((k, j) => ({ k, via: sequenza.strade[j] }))
  const vie = ingressiDi(tappa)
  const ultima = tappa.capo ? tappa.ondate - 1 : tappa.ondate
  for (const o of [ultima, ultima - 1]) {
    if (o <= APERTURA_COPRE) continue
    const bocca = boccaDellOnda(o, vie, insiemeDa(tappa.ondate))
    const strade = vie < 2 ? [0] : bocca < 0 ? Array.from({ length: vie }, (_, v) => v) : [bocca]
    const coperto = m => strade.every(v => piano.some(t => (vie < 2 || t.via === v) && feritoDa(m, t.k)))
    const buone = tutte.filter(c => c.every(coperto))
    if (buone.length) return { mista: o, coppie: buone }
  }
  return { miste: false }
}

// L'impronta dei numeri su cui la taratura è stata fatta: se cambia, non
// combacia più col file generato e il test chiede di rifare `npm run tara`.
export function firmaEquilibrio() {
  const roba = JSON.stringify([
    CFG, CRESCITA, MONDO, CARATTERE, RAMI, RAMI_DA, PIAZZOLE_PER_INGRESSO,
    Object.entries(TORRI).map(([k, T]) => [k, T.danno, T.ricarica, T.area, T.raggio, !!T.gela]),
    Object.entries(MOSTRI).map(([id, m]) => [id, m.immune, m.abilita || null, !!m.vola]),
    ABILITA, CAPO, MISTA,
    // il tracciato entra per intero (forma o forme): decide quanta strada
    // ogni torre tiene sotto tiro
    RACCONTO.map(t => [chiaveTappa(t), t.calcoli, t.cap, t.torri, t.mostri,
                       !!t.abilita, !!t.capo, !!t.rami, t.forme || [t.forma], t.fronti ?? null]),
    // `durezza` muove la velocità dei nemici
    TAPPE.map(t => [t.ondate, t.posti, t.partenza, t.attesa, t.durezza]),
    LIBERE.map(l => [l.chiave, l.campagna, l.cap, l.posti, l.torri, l.mostri, l.rami,
                     l.forme, l.fronti ?? null, l.partenza, l.attesa, l.capi, !!l.abilita]),
    // e il campo su cui si gioca davvero: la strada a squadra e le piazzole
    // della carta, che lo schizzo da solo non dice (le carte a mano, il
    // generatore di `carta.js`)
    [...TAPPE, ...LIBERE].map(t => { const c = sullaCarta(t); return [c.forme, c.posti] }),
  ])
  let h = 5381
  for (let i = 0; i < roba.length; i++) h = ((h * 33) ^ roba.charCodeAt(i)) >>> 0
  return h.toString(16)
}
export const firmaTaratura = () => FIRMA

// I regali della partita libera: ogni OGNI_REGALO ondate un potenziamento a
// scelta, che resta per sempre. Solo lì (non nella campagna, tarata ondata
// per ondata) e non passano da un esercizio. Vedi docs/castello/libere.md.
export const OGNI_REGALO = 5

export const QUANTE_CARTE = 3

// I doni a riposo: moltiplicatori a 1 e somme a 0, così «zero regali» e
// «nessun regalo» sono la stessa partita bit per bit.
export const doniZero = () => ({
  danno: { arciere: 1, magica: 1, bombe: 1, ghiaccio: 1 },
  raggio: 1, cadenza: 0, gelo: 0, fragile: 0, veleno: 1,
})

export const REGALI = [
  // il gradino più grosso: misurato al muro, +10% di arciere vale un
  // settimo di +10% di bombe
  { id: 'frecce', emoji: '🏹', nome: 'Frecce affilate', torre: 'add',
    che: 'gli arcieri fanno più male', per: '+8% di danno',
    dai: (d, g) => { d.danno.arciere += 0.08 * g } },
  { id: 'incanto', emoji: '🔮', nome: 'Incanto più forte', torre: 'sub',
    che: "l'onda magica fa più male", per: '+5% di danno',
    dai: (d, g) => { d.danno.magica += 0.05 * g } },
  { id: 'polvere', emoji: '💣', nome: 'Polvere da sparo', torre: 'div',
    che: 'le bombe fanno più male', per: '+5% di danno',
    dai: (d, g) => { d.danno.bombe += 0.05 * g } },
  // scala la fragilità (brina) e non il gelo: allungare la durata oltre la
  // strada non aggiunge niente (misurato, +72s ferma solo 9 nemici in più di +12s)
  { id: 'gelo', emoji: '❄️', nome: 'Gelo che morde', torre: 'mul',
    che: 'il gelo dura di più, e chi è gelato prende più male da tutti',
    per: '+0,2 s di gelo e +3% di danno su chi è gelato',
    dai: (d, g) => { d.gelo += 0.2 * g; d.fragile += 0.03 * g } },
  { id: 'vista', emoji: '🦅', nome: 'Vista lunga',
    che: 'tutte le torri arrivano più lontano', per: '+5% di raggio',
    dai: (d, g) => { d.raggio += 0.05 * g } },
  /* Vale solo per chi ha scelto il ramo che avvelena o che brucia, e va
     detto sulla carta: un regalo che non fa niente è peggio di un
     regalo che non c'è. Chi è immune alla torre è immune anche al suo
     veleno (`Nemico.avvelena`): il male arriva col colpo, e un colpo
     che rimbalza non lascia niente dentro. */
  { id: 'veleno', emoji: '☠️', nome: 'Veleno tenace', ramo: true,
    che: 'veleno e fuoco fanno più male — solo le torri che ce l\'hanno',
    per: '+8% di veleno',
    dai: (d, g) => { d.veleno += 0.08 * g } },
  // il grado più piccolo: tocca tutte e quattro le torri, ghiaccio compreso
  { id: 'cadenza', emoji: '💨', nome: 'Mani veloci',
    che: 'tutte le torri ricaricano più in fretta', per: '+3% di cadenza',
    dai: (d, g) => { d.cadenza += 0.03 * g } },
]

export const regaloDi = id => REGALI.find(r => r.id === id) || null

export function doniDi(regali) {
  const d = doniZero()
  if (!regali) return d
  for (const r of REGALI) {
    const g = Math.max(0, Math.floor(regali[r.id] || 0))
    if (g > 0) r.dai(d, g)
  }
  return d
}

export const quantiRegali = regali =>
  REGALI.reduce((n, r) => n + Math.max(0, Math.floor((regali || {})[r.id] || 0)), 0)

// Tre voci a giro (non a sorte): in due giri il catalogo passa tutto
// davanti, e non serve un seme da salvare nel profilo.
export function regaliOfferti(k, quante = QUANTE_CARTE) {
  const n = Math.min(quante, REGALI.length)
  return Array.from({ length: n }, (_, i) => REGALI[(k * n + i) % REGALI.length])
}

// Le due funzioni che il motore chiama al posto di `tiroDi`/`geloDi` quando
// in campo ci sono regali (i numeri sono equilibrio: in motore/ non entrano).
export function tiroConDoni(k, lv, ramo, doni) {
  const t = tiroDi(k, lv, ramo)
  if (!doni) return t
  const f = doni.danno[TORRI[k].aspetto] ?? 1
  if (f === 1 && doni.veleno === 1 && !doni.cadenza) return t
  return { ...t, danno: t.danno * f, veleno: t.veleno * f * doni.veleno,
           ricarica: t.ricarica / (1 + doni.cadenza) }
}

export function geloConDoni(lv, ramo, doni) {
  const g = geloDi(lv, ramo)
  if (!doni || (!doni.gelo && !doni.fragile)) return g
  return { ...g, durata: g.durata + doni.gelo, fragile: g.fragile + doni.fragile }
}

// Il blocchetto dei potenziamenti (per Potenziamenti.vue): per ogni tipo di
// torre in campo, quante sono, quanti gradini e quanto fanno in più di una
// appena costruita (col modello `dpsDi`, lo stesso che decide i prezzi).
// `torri` è `[{ tipo, lv, ramo }]`, `regali` i gradi presi `{ id: quanti }`.
export function blocchettoDi(torri = [], regali = null) {
  const doni = doniDi(regali)
  const perTipo = []
  for (const k of Object.keys(TORRI)) {
    const sue = torri.filter(t => t.tipo === k)
    if (!sue.length) continue
    const aspetto = TORRI[k].aspetto
    const regalo = TORRI[k].danno ? (doni.danno[aspetto] ?? 1) * (1 + doni.cadenza) : 1
    const forza = sue.reduce((s, t) => s + dpsDi(k, t.lv, t.ramo) * regalo / dpsDi(k, 1), 0) / sue.length
    const rami = {}
    for (const t of sue) if (t.ramo) rami[t.ramo] = (rami[t.ramo] || 0) + 1
    perTipo.push({
      tipo: k, quante: sue.length,
      gradini: sue.reduce((s, t) => s + t.lv - 1, 0),
      piu: Math.round((forza - 1) * 100),
      livelloMassimo: Math.max(...sue.map(t => t.lv)),
      rami: Object.entries(rami).map(([ramo, quante]) => ({ ramo, quante })),
    })
  }
  const doniPresi = REGALI
    .map(r => ({ r, g: Math.max(0, Math.floor((regali || {})[r.id] || 0)) }))
    .filter(({ g }) => g > 0)
    .map(({ r, g }) => ({ id: r.id, emoji: r.emoji, nome: r.nome, gradi: g,
                          che: r.che, quanto: moltiplicaPer(r.per, g) }))
  const gradini = perTipo.reduce((s, t) => s + t.gradini, 0)
  const regaliPresi = doniPresi.reduce((s, d) => s + d.gradi, 0)
  return { torri: perTipo, regali: doniPresi, gradini, regaliPresi,
           totale: gradini + regaliPresi }
}

// «+5% di danno» preso tre volte è «+15% di danno»: la frase del catalogo è
// scritta per un grado solo, qui si moltiplica.
function moltiplicaPer(frase, gradi) {
  return frase.replace(/\d+(?:,\d+)?/g, n => {
    const v = Number(n.replace(',', '.')) * gradi
    return String(Math.round(v * 10) / 10).replace('.', ',')
  })
}

// Le partite libere: una per terreno, ereditano dalla loro campagna mostri,
// torri e rami; il tracciato è suo (LIBERE_RACCONTO). Vedi docs/castello/libere.md.
const ultimaDi = campagna => RACCONTO.filter(t => t.campagna === campagna).at(-1)
function mostriDi(campagna) {
  const tutti = [...new Set(RACCONTO.filter(t => t.campagna === campagna).flatMap(t => t.mostri))]
  const mucchi = new Map()
  for (const m of tutti) {
    const k = firmaImmunita(m)
    if (!mucchi.has(k)) mucchi.set(k, [])
    mucchi.get(k).push(m)
  }
  const fila = []
  let prima = null
  while (fila.length < tutti.length) {
    const scelte = [...mucchi.entries()].filter(([k, v]) => v.length && k !== prima)
    const [k, v] = (scelte.length ? scelte : [...mucchi.entries()].filter(([, v]) => v.length))
      .sort((a, b) => b[1].length - a[1].length)[0]
    fila.push(v.shift())
    prima = k
  }
  // la fila gira in tondo: se l'ultimo ha le stesse immunità del primo,
  // lo si infila fra due che non le hanno
  const res = firmaImmunita
  const ultimo = fila[fila.length - 1]
  if (fila.length > 2 && res(ultimo) === res(fila[0])) {
    const dove = fila.findIndex((m, i) => i > 0 && i < fila.length - 1 &&
                                          res(fila[i - 1]) !== res(ultimo) && res(m) !== res(ultimo))
    if (dove > 0) { fila.pop(); fila.splice(dove, 0, ultimo) }
  }
  // e si fa girare finché in testa non c'è uno che l'arciere ferisce
  const primo = fila.findIndex(m => feritoDa(m, 'add'))
  return primo > 0 ? [...fila.slice(primo), ...fila.slice(0, primo)] : fila
}

// Nella libera i capi devono poterli ferire almeno due torri: vedi
// docs/castello/libere.md.
export function capiAperti(tappa) {
  const sparano = tappa.torri.filter(k => TORRI[k].danno)
  for (let o = CAPO.ogni; o <= ONDATE_TARATE; o += CAPO.ogni) {
    const m = mostroDiOnda(tappa.mostri, o)
    if (sparano.filter(k => feritoDa(m, k)).length < 2) return false
  }
  return true
}
// Se nessuna fila arriva a `APERTURA_COPRE`, prima si allunga coi comuni,
// poi si abbassa la pretesa tenendo la fila migliore (vedi mostri.md).
function filaCheRegge(tappa) {
  for (let copre = APERTURA_COPRE; copre >= 4; copre--) {
    const f = filaCheCopre(tappa, copre)
    if (f) return f
    if (copre === APERTURA_COPRE) {
      const comuni = tappa.mostri.filter(comune)
      for (let extra = 1; extra <= 3 && comuni.length; extra++) {
        const lunga = [...tappa.mostri, ...Array.from({ length: extra }, (_, k) => comuni[k % comuni.length])]
        const f = filaCheCopre({ ...tappa, mostri: lunga }, copre)
        if (f) return f
      }
    }
  }
  return tappa.mostri
}
function filaCheCopre(tappa, copre) {
  const va = fila => {
    const t = { ...tappa, mostri: fila }
    return !guastiDelleImmunita(t).length && coperturaApertura(t) >= copre &&
           capiAperti(t)
  }
  const base = tappa.mostri
  const n = base.length
  for (let r = 0; r < n; r++) {
    const giro = [...base.slice(r), ...base.slice(0, r)]
    if (va(giro)) return giro
    for (const i of [2, 3, 1])
      for (let j = i + 1; j < n; j++) {
        const f = giro.slice();
        [f[i], f[j]] = [f[j], f[i]]
        if (va(f)) return f
      }
  }
  return filaCostruita(tappa, va, copre)
}

// Se girare e scambiare non basta, la fila si costruisce posto per posto,
// con le stesse regole (`va`): prima l'arciere, due di fila mai con le
// stesse immunità, i capi feriti da almeno due torri.
function filaCostruita(tappa, va, copre) {
  const base = tappa.mostri
  const n = base.length
  const sparano = tappa.torri.filter(k => TORRI[k].danno)
  const vie = ingressiDi(tappa)
  const insieme = insiemeDa(tappa.ondate)
  const capo = new Set()
  for (let o = CAPO.ogni; o <= ONDATE_TARATE; o += CAPO.ogni) capo.add((o - 1) % n)
  for (const tipi of file(sparano, primeQuante(tappa))) {
    /* le ondate dell'apertura che cadono sul posto `i`, e chi può starci */
    const ferito = (m, o) => {
      const via = boccaDellOnda(o, vie, insieme)
      const strade = vie < 2 ? [0] : via < 0 ? Array.from({ length: vie }, (_, v) => v) : [via]
      return strade.every(v => tipi.some((k, j) => (vie < 2 || j % vie === v) && feritoDa(m, k)))
    }
    const puo = (m, i) => {
      for (let o = i + 1; o <= copre; o += n) if (!ferito(m, o)) return false
      return true
    }
    /* per posto nella fila e non per nome: un comune può starci due volte */
    const fila = [], usati = base.map(() => false)
    let passi = 0
    const prova = i => {
      if (++passi > 5000) return false
      if (i === n) return va(fila)
      const provati = new Set()
      for (let q = 0; q < n; q++) {
        const m = base[q]
        if (usati[q] || provati.has(m)) continue
        provati.add(m)
        if (i === 0 && !feritoDa(m, 'add')) continue
        if (i > 0 && !(comune(m) && comune(fila[i - 1])) &&
            firmaImmunita(m) === firmaImmunita(fila[i - 1])) continue
        if (!puo(m, i)) continue
        if (capo.has(i) && sparano.filter(k => feritoDa(m, k)).length < 2) continue
        fila.push(m); usati[q] = true
        if (prova(i + 1)) return true
        fila.pop(); usati[q] = false
      }
      return false
    }
    if (prova(0)) return fila.slice()
  }
  return null
}

export const LIBERE = LIBERE_RACCONTO.map(r => {
  const ultima = ultimaDi(r.campagna)
  const libera = {
    ...r, ondate: Infinity, posti: PIAZZOLE_LIBERE, cap: 10,
    torri: ultima.torri, ambiente: ultima.ambiente,
    rami: !!ultima.rami,
    abilita: true, capi: CAPO.ogni,
    regali: true, // solo qui: nella campagna il motore li ignora
    mostri: mostriDi(r.campagna),
    partenza: partenzaDi({ cap: 4 }), durezza: 1, attesa: 30,
    vite: VITE[r.chiave], oltre: (OLTRE && OLTRE[r.chiave]) || 1.2,
  }
  return { ...libera, mostri: filaCheRegge(libera) }
})

export const liberaDi = chiave => LIBERE.find(l => l.chiave === chiave) || null

// La prima delle quattro: chi chiede "la partita libera" senza dire quale,
// ed eredita il record della vecchia libera unica.
export const LIBERA = LIBERE[0]
