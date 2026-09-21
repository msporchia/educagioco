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
       servono,          quanti ne chiede il padre (1 alla radice)
       ho,               quanti ne ha il granaio
       stato,            'ok' | 'manca' | 'arriva'
       arriva,           se 'arriva', a che livello (o null: mai)
       via,              come si ottiene, la strada scelta — o null
       rami,             gli ingredienti della strada scelta
     }
     via = {
       che: 'coltura' | 'ricetta', id, nome, minuti, costo,
       macchina: null | { id, nome, stato: 'ok'|'lavora'|'compra'|'premio',
                          manca, prezzo, arriva },
       campo:    null | { stato: 'libero'|'cresce'|'pronto'|'nessuno', manca },
       alternative: [id, …],      le altre strade aperte
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
import { COLTURE, RICETTE, PRODOTTI, PROFONDITA } from './coltivazioni.js'
import { valoreDi, minutiDi } from './mercato.js'
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

/* Quanto costa una strada, con lo stesso metro del mercato: la coltura
   è semina più raccolta, la ricetta il gesto più gli ingredienti al
   valore migliore. Serve a scegliere fra due strade aperte. */
const costoVia = v => v.che === 'coltura'
  ? (v.c.semina || 0) + (v.c.raccolta || 0)
  : Object.entries(v.r.prende || {}).reduce((n, [k, q]) => n + q * valoreDi(k), v.r.costo || 0)
/* E a parità di monete la più svelta, che è la stessa regola del
   mercato: i due foraggi costano uguale, e quello d'erba ci mette meno. */
const minutiVia = v => v.che === 'coltura'
  ? v.c.minuti || 0
  : Object.entries(v.r.prende || {}).reduce((n, [k, q]) => n + q * minutiDi(k), v.r.minuti || 0)

function statoMacchina(f, dove, ora) {
  const voce = laMacchina(dove)
  if (!voce) return null
  const tutte = f.cose.filter(c => macchinaDi(c) === dove)
  const base = { id: voce.id, nome: voce.nome, manca: 0, prezzo: null, arriva: null }
  if (!tutte.length) {
    const liv = livelloDellaVoce(voce)
    if (liv > f.livello) return { ...base, stato: 'compra', arriva: liv }
    if (!f.sbloccata(voce.id)) return { ...base, stato: 'premio' }
    return { ...base, stato: 'compra', prezzo: f.quantoCosta(voce.id) }
  }
  const stati = tutte.map(c => f.statoMacchina(c, ora)).filter(Boolean)
  if (stati.some(s => s.ferma || s.pronto)) return { ...base, stato: 'ok' }
  const prima = stati.slice().sort((a, b) => a.manca - b.manca)[0]
  return { ...base, stato: 'lavora', manca: prima ? prima.manca : 0 }
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

export function alberoDi(f, prodotto, ora = Date.now(), servono = 1, giri = PROFONDITA) {
  if (!PRODOTTI[prodotto]) return null
  const pr = roba(prodotto)
  const ho = f.quantoHo(prodotto)
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
  vie.sort((a, b) => costoVia(a) - costoVia(b) || minutiVia(a) - minutiVia(b))
  const scelta = vie[0]

  /* La frase e il tasto sono quelli del consiglio, chiesti solo dove
     servono: una riga verde non ha niente da fare. */
  const consiglio = nodo.stato === 'ok' ? null : comeAvere(f, prodotto, ora)
  if (scelta.che === 'coltura') {
    const c = scelta.c
    nodo.via = { che: 'coltura', id: c.id, nome: c.nome, minuti: c.minuti, costo: c.raccolta,
                 macchina: null, campo: statoCampo(f, c.id, ora),
                 alternative: vie.slice(1).map(v => v.id),
                 azione: consiglio ? consiglio.azione : null,
                 testo: consiglio ? consiglio.testo : '' }
    return nodo
  }
  const r = scelta.r
  nodo.via = { che: 'ricetta', id: r.id, nome: r.nome, minuti: r.minuti, costo: r.costo,
               macchina: statoMacchina(f, r.dove, ora), campo: null,
               alternative: vie.slice(1).map(v => v.id),
               azione: consiglio ? consiglio.azione : null,
               testo: consiglio ? consiglio.testo : '' }
  nodo.rami = Object.entries(r.prende || {})
    .map(([k, q]) => alberoDi(f, k, ora, q, giri - 1))
    .filter(Boolean)
  return nodo
}

/* Le righe dell'albero in fila, dall'alto in basso, con la profondità:
   è quello che una colonna verticale disegna. Il nodo porta `livello`
   (quanto è rientrato) e nient'altro di nuovo. */
export function righeDi(nodo, livello = 0, fuori = []) {
  if (!nodo) return fuori
  fuori.push({ ...nodo, livello })
  for (const r of nodo.rami) righeDi(r, livello + 1, fuori)
  return fuori
}

/* Le foglie dell'albero: quello che sta in fondo. Serve al test —
   devono essere colture o nodi «arriva», mai ricette lasciate a metà. */
export const foglieDi = nodo => righeDi(nodo).filter(n => !n.rami.length)

/* Quanto è profondo: per il test contro `PROFONDITA`. */
export const profonditaDellAlbero = nodo =>
  nodo ? 1 + Math.max(0, ...nodo.rami.map(profonditaDellAlbero)) : 0
