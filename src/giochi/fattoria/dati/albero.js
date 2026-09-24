/* ═══════════════════════════════════════════════════════════════════
   L'ALBERO DI UNA MERCE — IL CONSIGLIO SROTOLATO

   Il consiglio (`motore/consiglio.js`) risale la catena e dice **il
   prossimo passo**. Con cinque fasi il prossimo passo non basta più:
   chi vuole un maglione deve vedere **tutta la strada**, e vedere a che
   punto è. Questo file la compone; `viste/Albero.vue` la disegna.

   Puro: importa le tabelle e il consiglio, non sa niente di Vue. Gira
   in Node e si prova in `unita/albero`.

   ── UNA FUNZIONE ──────────────────────────────────────────────────
   `alberoDi(f, prodotto, ora) → nodo | null`

     nodo = {
       prodotto, nome, emoji, pezzo,
       servono,          quanti ne servono **in tutto** per la radice
       ho,               quanti ne restano in granaio per questa riga
       stato,            'ok' | 'manca' | 'arriva'
       arriva,           se 'arriva', a che livello (o null: mai)
       via,              come si ottiene, la strada scelta — o null
       rami,             gli ingredienti della strada scelta
     }
     via = {
       che: 'coltura' | 'ricetta', id, nome, minuti, costo,
       macchina: null | { id, nome, stato: 'ok'|'lavora'|'compra'|'premio',
                          manca, ne, piena, unPosto, prezzo, arriva },
       campo:    null | { stato: 'libero'|'cresce'|'pronto'|'nessuno', manca },
       alternative: [{ id, nome, dove: {nome, la, plurale} | null }, …]
       azione: null | { che: 'apri'|'compra'|'premio'|'ingrandisci', … },
       testo,                     la frase del consiglio
     }

   Tre cose che la funzione garantisce, e che il test difende:

   · **la profondità è finita** (`PROFONDITA`): un anello nelle tabelle
     si ferma con un nodo `arriva` invece di avvitarsi;
   · **le foglie sono colture**, o nodi «arriva» — mai una ricetta
     lasciata a metà;
   · **la strada scelta è quella di `valoreDi`** fra quelle **aperte**,
     così il premio del mercato, il consiglio e l'albero raccontano la
     stessa fattoria. Chi non ha il pentolone ma ha il fienile non si
     vede consigliare il pentolone: vede la strada che può percorrere.

   ── `servono` SI MOLTIPLICA, E NON ERA COSÌ ───────────────────────
   Ogni ramo porta **quanti ne servono in tutto**, non quanti ne chiede
   la ricetta per un giro solo. Un maglione vuole 2 stoffe, ogni stoffa
   2 lane, ogni lana 1 foraggio, ogni foraggio 2 erbe: l'albero si
   legge `1 · 2 · 4 · 4 · 8`. Passando giù la `q` della ricetta senza
   moltiplicarla si leggeva `1 · 2 · 2 · 1 · 2`, che in una colonna
   verticale è **una lista della spesa sbagliata a ogni riga sotto la
   prima** — e sbagliata al ribasso, cioè nel verso in cui uno si
   accorge di essere a corto solo dopo aver seminato.

   Il conto passa per `resa`: quanti giri di macchina servono è
   `servono / resa` arrotondato in su, e ogni giro vuole la sua `q`.
   Oggi `RESA` è 1 e il numero non cambia; scritto così non cambierà
   nemmeno il giorno che una ricetta ne renderà due.

   ── E IL GRANAIO È UNO SOLO, DIVISO FRA I RAMI ────────────────────
   `ho` non è `f.quantoHo(prodotto)` letto nodo per nodo: era, e due
   rami che volevano entrambi grano dicevano tutti e due «✓ ne hai 3»
   anche quando insieme ne chiedevano 6. Il granaio si spartisce **in
   ordine di lettura** — la stessa visita in profondità che la colonna
   disegna dall'alto in basso — così la prima riga dice quanti ne trova
   e quelle dopo quanti ne restano. Chi legge dall'alto vede il
   magazzino svuotarsi mentre scende, che è quello che succederà.

   ── SOLO QUELLO CHE È SBLOCCATO ───────────────────────────────────
   Una ricetta che arriva dopo non compare; se l'*unica* strada per una
   merce arriva dopo, la riga dice «arriva al livello 52» e si ferma lì,
   come fa il consiglio. Non racconta il futuro: quello sta nella pagina
   dei livelli.

   ── E OGNI RIGA AMBRA PORTA L'AZIONE DEL CONSIGLIO ────────────────
   Non ne ricava una sua: chiede a `comeAvere` la stessa risposta che
   darebbe il foglio della macchina, così il tasto sull'albero fa quello
   che farebbe il tasto sotto la ricetta. Due consigli diversi per la
   stessa merce sarebbero due fattorie.
   ═══════════════════════════════════════════════════════════════════ */
import { COLTURE, RICETTE, PRODOTTI, PROFONDITA, RESA } from './coltivazioni.js'
import { valoreDi, minutiDi, megliaDi } from './mercato.js'
import { livelloDelProdotto, livelloDellaVoce } from './livelli.js'
import { laMacchina, eCampo, macchinaDi } from './catalogo.js'
import { comeAvere } from '../motore/consiglio.js'

const roba = id => PRODOTTI[id] || { nome: id, emoji: '📦' }

/* Una ricetta è **aperta** per questa fattoria se è arrivata col
   livello, lei e la sua macchina. Arrivata, non presa: una macchina
   che aspetta nei premi è una riga con un tasto («vai a prenderla»),
   non una merce che arriva dopo — è il terzo caso di `acquisto()` nel
   consiglio, e qui sta nello stato della macchina. Gli ingredienti non
   si chiedono: li racconta il ramo sotto. */
const aperta = (f, r) => {
  if ((r.liv || 1) > f.livello) return false
  const m = laMacchina(r.dove)
  return !m || livelloDellaVoce(m) <= f.livello
}

/* ── QUALE STRADA, FRA QUELLE APERTE ──
   Una coltura si misura da sé (semina più raccolta, i suoi minuti);
   una ricetta la misura `megliaDi` di `dati/mercato.js`, che è **la
   stessa funzione che usa il consiglio**. Erano due ordinamenti
   diversi — qui il costo, là l'ordine di tabella — e la colonna
   finiva per mostrare una macchina col tasto che ne comprava
   un'altra: il perché per esteso sta accanto a `megliaDi`.

   `haTutto` entra anche qui, e ci voleva: chi ha già in granaio gli
   ingredienti di una strada non va mandato per l'altra, e una
   colonna che glielo dicesse racconterebbe una fattoria diversa da
   quella che il tasto apre. */
const haTuttoIn = f => r => Object.keys(r.prende || {}).every(k => f.quantoHo(k) >= r.prende[k])
const costoVia = v => v.che === 'coltura'
  ? (v.c.semina || 0) + (v.c.raccolta || 0)
  : Object.entries(v.r.prende || {}).reduce((n, [k, q]) => n + q * valoreDi(k), v.r.costo || 0)
const minutiVia = v => v.che === 'coltura'
  ? v.c.minuti || 0
  : Object.entries(v.r.prende || {}).reduce((n, [k, q]) => n + q * minutiDi(k), v.r.minuti || 0)

/* Le altre strade aperte, dette in modo che si possano scrivere: non
   basta l'id della ricetta — `lana_angora` a un bambino non dice
   niente — ci vuole **dove si fa**, che è la sola cosa che distingue
   una strada dall'altra a chi guarda. La lana esce dall'ovile e dalla
   conigliera, e la riga da leggere è «o nella conigliera».

   Li risolve questo file e non la vista, perché è questo file che ha
   in mano le tabelle: una vista che si va a cercare il nome di una
   macchina dentro il catalogo è una vista che conosce il catalogo. */
const altraStrada = v => {
  const m = v.che === 'coltura' ? null : laMacchina(v.r.dove)
  return {
    id: v.id,
    nome: v.che === 'coltura' ? v.c.nome : v.r.nome,
    /* La voce intera e non il solo nome: chi la scrive ci mette davanti
       un articolo, e il genere sta lì (`la` in `dati/catalogo.js`). */
    dove: m ? { nome: m.nome, la: !!m.la, plurale: !!m.plurale } : null,
  }
}

/* ── LA MACCHINA DI UNA RIGA, CON LA FILA ──
   `lavora` adesso vuol dire due cose, e la riga le dice diverse: **ne
   sta facendo** di questa merce (`ne`, quanti fra quello che macina e
   quello in fila, e `manca` del primo che esce) — «⏳ ne fa 2, pronto
   fra 4 min» — oppure ha **la fila piena** di altro (`piena`), e allora
   `manca` è quando esce il prossimo pezzo, che è quando si libera un
   posto a ritirarlo. Una macchina che fa altro ma ha un posto è `ok`:
   ci si mette in fila. `unPosto` dice che quella fila piena è **da
   uno** — com'è la fila di ogni macchina finché non si comprano altri
   posti (`dati/coda.js`) — e allora la riga dice che sta facendo
   altro: «fila piena» detto di un posto solo non si capisce. */
function statoMacchina(f, r, ora) {
  const dove = r.dove
  const voce = laMacchina(dove)
  if (!voce) return null
  const tutte = f.cose.filter(c => macchinaDi(c) === dove)
  const base = { id: voce.id, nome: voce.nome, manca: 0, ne: 0, piena: false,
                 unPosto: false, prezzo: null, arriva: null }
  if (!tutte.length) {
    const liv = livelloDellaVoce(voce)
    if (liv > f.livello) return { ...base, stato: 'compra', arriva: liv }
    if (!f.sbloccata(voce.id)) return { ...base, stato: 'premio' }
    return { ...base, stato: 'compra', prezzo: f.quantoCosta(voce.id) }
  }
  const stati = tutte.map(c => f.statoMacchina(c, ora)).filter(Boolean)
  if (stati.some(s => s.pronto)) return { ...base, stato: 'ok' }
  const suoi = stati.flatMap(s => s.coda).filter(p => !p.pronto && p.ricetta.da === r.da)
    .sort((a, b) => a.manca - b.manca)
  if (suoi.length) return { ...base, stato: 'lavora', ne: suoi.length, manca: suoi[0].manca }
  if (stati.some(s => s.libera)) return { ...base, stato: 'ok' }
  const prima = stati.filter(s => s.lavora).sort((a, b) => a.manca - b.manca)[0]
  return { ...base, stato: 'lavora', piena: true, manca: prima ? prima.manca : 0,
           unPosto: stati.every(s => s.posti === 1) }
}

function statoCampo(f, coltura, ora) {
  const campi = f.cose.filter(eCampo).map(c => f.statoCampo(c, ora)).filter(Boolean)
  if (!campi.length) return { stato: 'nessuno', manca: 0 }
  const suoi = campi.filter(s => s.coltura && s.coltura.id === coltura)
  if (suoi.some(s => s.pronto)) return { stato: 'pronto', manca: 0 }
  const cresce = suoi.filter(s => !s.vuoto && !s.pronto).sort((a, b) => a.manca - b.manca)[0]
  if (cresce) return { stato: 'cresce', manca: cresce.manca }
  if (campi.some(s => s.vuoto)) return { stato: 'libero', manca: 0 }
  return { stato: 'occupati', manca: 0 }
}

/* ── IL GRANAIO SPARTITO ──
   Un `Map` che vive per un albero solo e si consuma mentre lo si
   compone. Alla prima riga che chiede una merce si legge il granaio;
   dalla seconda in poi si legge **quello che resta**. Chi chiede prima
   è chi sta più in alto nella colonna, perché la composizione è la
   stessa visita in profondità che la colonna disegna. */
function spartisci(f, prodotto, servono, resto) {
  if (!resto.has(prodotto)) resto.set(prodotto, f.quantoHo(prodotto))
  const ce = resto.get(prodotto)
  resto.set(prodotto, Math.max(0, ce - Math.max(0, servono)))
  return ce
}

export function alberoDi(f, prodotto, ora = Date.now()) {
  return ramoDi(f, prodotto, ora, 1, PROFONDITA, new Map())
}

function ramoDi(f, prodotto, ora, servono, giri, resto) {
  if (!PRODOTTI[prodotto]) return null
  const pr = roba(prodotto)
  const ho = spartisci(f, prodotto, servono, resto)
  const nodo = { prodotto, nome: pr.nome, emoji: pr.emoji, pezzo: pr.pezzo || null,
                 servono, ho, stato: ho >= servono ? 'ok' : 'manca', arriva: null,
                 via: null, rami: [] }
  if (giri <= 0) return { ...nodo, stato: 'arriva', arriva: null }

  /* Le strade aperte, col loro costo; vince la più economica. */
  const vie = []
  for (const c of COLTURE)
    if (c.da === prodotto && f.colturaAperta(c.id)) vie.push({ che: 'coltura', id: c.id, c })
  for (const r of RICETTE)
    if (r.da === prodotto && aperta(f, r)) vie.push({ che: 'ricetta', id: r.id, r })
  if (!vie.length) {
    const quando = livelloDelProdotto(prodotto)
    return { ...nodo, stato: 'arriva',
             arriva: quando > f.livello && Number.isFinite(quando) ? quando : null }
  }
  /* Fra due ricette decide `megliaDi`, la stessa del consiglio; una
     coltura contro una ricetta si confronta col costo e coi minuti,
     che è quello che le due hanno in comune. */
  const meglio = megliaDi(haTuttoIn(f))
  vie.sort((a, b) => (a.che === 'ricetta' && b.che === 'ricetta')
    ? meglio(a.r, b.r)
    : costoVia(a) - costoVia(b) || minutiVia(a) - minutiVia(b))
  const scelta = vie[0]

  /* La frase e il tasto sono quelli del consiglio, chiesti solo dove
     servono: una riga verde non ha niente da fare. */
  const consiglio = nodo.stato === 'ok' ? null : comeAvere(f, prodotto, ora)
  if (scelta.che === 'coltura') {
    const c = scelta.c
    nodo.via = { che: 'coltura', id: c.id, nome: c.nome, minuti: c.minuti, costo: c.raccolta,
                 macchina: null, campo: statoCampo(f, c.id, ora),
                 alternative: vie.slice(1).map(altraStrada),
                 azione: consiglio ? consiglio.azione : null,
                 testo: consiglio ? consiglio.testo : '' }
    return nodo
  }
  const r = scelta.r
  nodo.via = { che: 'ricetta', id: r.id, nome: r.nome, minuti: r.minuti, costo: r.costo,
               macchina: statoMacchina(f, r, ora), campo: null,
               alternative: vie.slice(1).map(altraStrada),
               azione: consiglio ? consiglio.azione : null,
               testo: consiglio ? consiglio.testo : '' }
  /* Quanti giri di macchina, e da lì quanto vuole ogni ingrediente.
     `servono` scende **moltiplicato**: due stoffe vogliono due giri di
     telaio, e ogni giro due lane — quattro, non due. */
  const giriDiMacchina = Math.max(1, Math.ceil(servono / (r.resa || RESA)))
  nodo.rami = Object.entries(r.prende || {})
    .map(([k, q]) => ramoDi(f, k, ora, q * giriDiMacchina, giri - 1, resto))
    .filter(Boolean)
  return nodo
}

/* ── LE RIGHE IN FILA, E LE ROTAIE ────────────────────────────────
   Quello che una colonna verticale disegna, dall'alto in basso. Oltre
   a `livello` — quanto è rientrata — ogni riga porta **come si
   disegna l'albero a sinistra di lei**, che è l'unica cosa che da sola
   non si può sapere:

     guide       un sì/no per ogni antenato: la rotaia verticale passa
                 di lì (│) o è spazio bianco, e ci vuole sapere se
                 quell'antenato aveva altri fratelli sotto di sé
     ultimo      è l'ultimo fratello? (└ invece di ├)
     guideSotto  le rotaie dei suoi figli — e della riga della
                 macchina, che sta fra lei e loro e apre il gruppo (┌)

   Un rientro e basta non è un albero: con cinque fasi due rami che
   scendono in parallelo si leggono come una lista sola, e non si vede
   più quale ingrediente appartiene a quale passaggio. Le rotaie sono
   quello che lo dice, e sono dato puro — `unita/albero` le controlla
   senza aprire niente. */
export function righeDi(nodo, livello = 0, fuori = [], guide = [], ultimo = true) {
  if (!nodo) return fuori
  const guideSotto = livello === 0 ? [] : [...guide, !ultimo]
  fuori.push({ ...nodo, livello, guide, ultimo, guideSotto })
  nodo.rami.forEach((r, i) =>
    righeDi(r, livello + 1, fuori, guideSotto, i === nodo.rami.length - 1))
  return fuori
}

/* Le foglie dell'albero: quello che sta in fondo. Serve al test —
   devono essere colture o nodi «arriva», mai ricette lasciate a metà. */
export const foglieDi = nodo => righeDi(nodo).filter(n => !n.rami.length)

/* Quanto è profondo: per il test contro `PROFONDITA`. */
export const profonditaDellAlbero = nodo =>
  nodo ? 1 + Math.max(0, ...nodo.rami.map(profonditaDellAlbero)) : 0
