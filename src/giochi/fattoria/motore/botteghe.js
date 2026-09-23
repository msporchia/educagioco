/* ═══════════════════════════════════════════════════════════════════
   LE BOTTEGHE DEL PAESE — QUALCUNO CHE VUOLE UNA COSA SUA

   ── IL PROBLEMA ───────────────────────────────────────────────────
   Il banco del mercato chiede di tutto, e va bene così: è il camion,
   quello che c'è sempre. Ma una fattoria con cinquanta merci e un
   posto solo che le chiede ha un difetto che si vede giocando — la
   torta e il biscotto escono ogni tanto, in mezzo a tutto il resto, e
   niente dice **per chi** si fanno. Le botteghe sono i visitatori di
   Hay Day (`docs/fattoria-albero.md` §8.3): la pasticcera vuole tre
   biscotti, e sulla pasticceria c'è scritto chi è.

   ── COSA STA QUI E COSA STA DI LÀ ─────────────────────────────────
   Qui le **regole**: chi arriva, cosa chiede, cosa succede
   consegnando. In `dati/botteghe.js` i **numeri** (quanti pezzi,
   quanto si aspetta, quanti cuori), sulla voce del catalogo **l'elenco**
   di ogni bottega (`posto: { chiede, clienti }`). Lo stato sta nella
   `Fattoria`, in `f.botteghe`, che è quello che finisce nel profilo:

     f.botteghe[id] = { consegne, prossimo, banconi: [ordine | attesa | null] }
       ordine = { id, chi, chiede: { merce: n }, xp, minuti, nato }
       attesa = { dal }        // il cliente dopo arriva a quell'ora

   **La fama non si salva, si conta**: i cuori e i banconi escono da
   `consegne` (`famaDi`). Salvati a parte sarebbero tre numeri che
   devono stare d'accordo fra loro, e il giorno che uno scappa una
   bottega ha quattro cuori e tre banconi senza che nessuno sappia
   quale dei due è quello vero.

   Stessa forma di `motore/mercato.js`: funzioni pure che ricevono la
   fattoria, e il caso e l'ora passati da fuori — una partita si deve
   poter rifare identica, e un test deve poter saltare venti minuti
   senza aspettarli.

   ── NON SI CHIEDE QUELLO CHE NON SI PUÒ FARE ──────────────────────
   Un cliente pesca fra le merci del **suo elenco** che sono anche
   ordinabili adesso (`merciOrdinabili`, la stessa domanda del banco).
   Se non ce n'è nessuna il bancone resta vuoto e riprova la volta
   dopo: non succede mai il giorno in cui la bottega arriva —
   `guastiDegliSblocchi` pretende tre merci — ma può succedere a chi
   ha messo via la sua cucina.
   ═══════════════════════════════════════════════════════════════════ */
import { PRODOTTI } from '../dati/coltivazioni.js'
import { PER_ID, postoDi } from '../dati/catalogo.js'
import { clienteDi, minutiPer, pesoDellaMerce } from '../dati/mercato.js'
import {
  PEZZI_MIN, PEZZI_MAX, ATTESA_MIN, ATTESA_MAX, CUORI, BANCONI_MAX,
  premioInBottega, clientiDellaBottega,
} from '../dati/botteghe.js'
import { merciOrdinabili, cheMancaPer, puoiConsegnare } from './mercato.js'

const MINUTO = 60000

/* La bottega in mappa, se c'è. Nel baule non conta, come per la
   bancarella: una cosa comprata e non posata non fa niente. */
export const bottegaIn = (f, id) => f.cose.find(c => c.id === id && postoDi(c)) || null

/* Le botteghe posate, una per id (sono `unico`). */
export const botteghePosate = f =>
  [...new Set(f.cose.filter(postoDi).map(c => c.id))]

/* Lo stato di una bottega, creato vuoto la prima volta. */
function statoDi(f, id) {
  if (!f.botteghe || typeof f.botteghe !== 'object') f.botteghe = {}
  if (!f.botteghe[id]) f.botteghe[id] = { consegne: 0, prossimo: 1, banconi: [] }
  return f.botteghe[id]
}

/* ── LA FAMA ──────────────────────────────────────────────────────
   Ogni consegna è un cuore; a `CUORI` cuori la bottega cresce di un
   bancone e i cuori ripartono. Arrivata a `BANCONI_MAX` non cresce
   più, e i cuori restano pieni: è una bottega famosa, e dirlo con
   cinque cuori accesi è più vero che ricominciare a riempirli per
   niente. */
export function famaDi(stato) {
  const n = Math.max(0, (stato && stato.consegne) | 0)
  const banconi = Math.min(BANCONI_MAX, 1 + Math.floor(n / CUORI))
  const piena = banconi >= BANCONI_MAX
  return { banconi, cuori: piena ? CUORI : n % CUORI, di: CUORI, piena }
}

const pesca = (rnd, quante) => Math.min(quante - 1, Math.floor(rnd() * quante))

function pescaPesata(rnd, merci, livello) {
  const pesi = merci.map(p => pesoDellaMerce(p, livello))
  let x = rnd() * pesi.reduce((s, w) => s + w, 0)
  for (let i = 0; i < merci.length; i++) if ((x -= pesi[i]) < 0) return i
  return merci.length - 1
}

/* Le merci che **questa** bottega può chiedere a questa fattoria
   adesso: il suo elenco, stretto a quello che si sa produrre. */
export function merciDellaBottega(f, id) {
  const posto = (PER_ID[id] || {}).posto
  if (!posto) return []
  const si = new Set(merciOrdinabili(f))
  return posto.chiede.filter(p => si.has(p))
}

/* Un cliente nuovo: una merce sola, da `PEZZI_MIN` a `PEZZI_MAX`
   pezzi. Se un altro bancone chiede già quella merce se ne cerca
   un'altra — due clienti che vogliono tre biscotti ciascuno sono un
   cliente solo detto due volte — ma solo se c'è: meglio due biscotti
   che un bancone vuoto. */
export function componiCliente(f, id, rnd = Math.random, n = 1, gia = []) {
  const posto = (PER_ID[id] || {}).posto
  const tutte = merciDellaBottega(f, id)
  if (!posto || !tutte.length) return null
  const altre = tutte.filter(p => !gia.includes(p))
  const merci = altre.length ? altre : tutte
  const p = merci[pescaPesata(rnd, merci, f.livello)]
  const pezzi = PEZZI_MIN + pesca(rnd, PEZZI_MAX - PEZZI_MIN + 1)
  const possibili = clientiDellaBottega(posto, p)
  const chi = possibili[pesca(rnd, possibili.length)]
  const chiede = { [p]: pezzi }
  return { id: n, chi: chi.id, chiede, xp: premioInBottega(p, pezzi),
           minuti: minutiPer(chiede) }
}

/* Fra quanto arriva il cliente dopo: da `ATTESA_MIN` a `ATTESA_MAX`
   minuti, estremi compresi. */
export const attesaNuova = (rnd = Math.random) =>
  ATTESA_MIN + pesca(rnd, ATTESA_MAX - ATTESA_MIN + 1)

/* Una bottega rimessa a posto: i banconi che la fama ha aperto ci sono
   tutti, quelli vuoti si riempiono, quelli in attesa aspettano la loro
   ora. Si chiama aprendo la bottega e ogni tanto dal battito del
   gioco, perché il fumetto sopra la bottega deve comparire anche senza
   aprirla. Torna `true` se qualcosa è cambiato. */
export function aggiornaLaBottega(f, id, ora = Date.now(), rnd = Math.random) {
  if (!bottegaIn(f, id)) return false
  const b = statoDi(f, id)
  let mosso = false
  const { banconi } = famaDi(b)
  while (b.banconi.length < banconi) { b.banconi.push(null); mosso = true }
  for (let i = 0; i < b.banconi.length; i++) {
    const x = b.banconi[i]
    if (x && x.chiede) continue                      // c'è già qualcuno
    if (x && x.dal > ora) continue                   // arriva più tardi
    const gia = b.banconi.filter(o => o && o.chiede).map(o => Object.keys(o.chiede)[0])
    const c = componiCliente(f, id, rnd, b.prossimo || 1, gia)
    if (!c) { if (x) { b.banconi[i] = null; mosso = true } continue }
    b.prossimo = (b.prossimo || 1) + 1
    c.nato = ora
    b.banconi[i] = c
    mosso = true
  }
  return mosso
}

/* Tutte le botteghe in mappa, in un colpo: è quello che chiama il
   battito del gioco. */
export function aggiornaLeBotteghe(f, ora = Date.now(), rnd = Math.random) {
  let mosso = false
  for (const id of botteghePosate(f)) if (aggiornaLaBottega(f, id, ora, rnd)) mosso = true
  return mosso
}

const clientiDi = (f, id) =>
  ((f.botteghe && f.botteghe[id] && f.botteghe[id].banconi) || []).filter(o => o && o.chiede)
const cercaCliente = (f, id, n) => clientiDi(f, id).find(o => o.id === n) || null

/* Consegnare: esce la merce, entra l'esperienza, si accende un cuore,
   e al bancone il cliente dopo arriva fra dieci e venti minuti. Se il
   cuore era il quinto la bottega cresce, e il bancone nuovo si riempie
   subito — è il premio della fama, e si deve vedere nel momento stesso
   in cui arriva.

   Il controllo viene **prima** di toccare qualunque cosa, come al
   banco: chi non ha abbastanza roba non perde niente. */
export function consegnaInBottega(f, id, n, ora = Date.now(), rnd = Math.random) {
  if (!bottegaIn(f, id)) return { ok: false, motivo: 'niente-bottega' }
  const o = cercaCliente(f, id, n)
  if (!o) return { ok: false, motivo: 'non-esiste' }
  const manca = cheMancaPer(f, o)
  if (manca.length) return { ok: false, motivo: 'manca-roba', manca }
  for (const [p, q] of Object.entries(o.chiede)) f.togli(p, q)
  const salito = f.guadagna(o.xp)
  const b = statoDi(f, id)
  const prima = famaDi(b).banconi
  b.consegne = (b.consegne || 0) + 1
  const attesa = attesaNuova(rnd)
  b.banconi[b.banconi.indexOf(o)] = { dal: ora + attesa * MINUTO }
  const cresciuta = famaDi(b).banconi > prima
  aggiornaLaBottega(f, id, ora, rnd)
  return { ok: true, xp: o.xp, ordine: o, attesa, cresciuta,
           livello: f.livello, salito }
}

/* «Non mi va»: il cliente se ne va senza niente, e il dopo arriva con
   la stessa attesa di una consegna. Non costa di più, perché qui non
   c'è niente da scorrere — ma nemmeno di meno, se no rifiutare
   sarebbe il modo svelto di cambiare merce. */
export function rifiutaInBottega(f, id, n, ora = Date.now(), rnd = Math.random) {
  const o = cercaCliente(f, id, n)
  if (!o) return { ok: false, motivo: 'non-esiste' }
  const b = statoDi(f, id)
  const attesa = attesaNuova(rnd)
  b.banconi[b.banconi.indexOf(o)] = { dal: ora + attesa * MINUTO }
  return { ok: true, attesa }
}

/* ── IL SALVATAGGIO ───────────────────────────────────────────────
   Quello che torna da un profilo, rimesso in piedi. Una fattoria di
   prima delle botteghe non ha niente e nasce vuota; una bottega tolta
   dal catalogo si butta; un cliente si rilegge solo se chiede **una**
   merce che esiste ancora, in quantità sane — un cliente che chiede
   roba sparita sarebbe un bancone occupato per sempre da un tasto che
   non si può premere. Le consegne invece restano anche così: la fama
   è stata guadagnata, e non si perde per una tabella ritoccata. */
export function leggiLeBotteghe(d) {
  const fuori = {}
  if (!d || typeof d !== 'object') return fuori
  for (const [id, b] of Object.entries(d)) {
    if (!postoDi({ id }) || !b || typeof b !== 'object') continue
    const banconi = (Array.isArray(b.banconi) ? b.banconi : []).slice(0, BANCONI_MAX).map(x => {
      if (!x) return null
      if (!x.chiede) return x.dal > 0 ? { dal: x.dal } : null
      const merci = Object.entries(x.chiede).filter(([k, n]) => PRODOTTI[k] && n > 0)
      if (merci.length !== 1) return null
      const [[p, n]] = merci
      return { id: x.id | 0, chi: x.chi, chiede: { [p]: Math.floor(n) },
               xp: Math.max(0, x.xp | 0), minuti: Math.max(0, x.minuti | 0),
               nato: x.nato || 0 }
    })
    const consegne = Math.max(0, b.consegne | 0)
    const prossimo = Math.max(1, b.prossimo | 0,
                              ...banconi.map(x => ((x && x.id) || 0) + 1))
    fuori[id] = { consegne, prossimo, banconi }
  }
  return fuori
}

/* C'è qualcosa da consegnare in questa bottega adesso? È il fumetto. */
export const daConsegnareIn = (f, id) => clientiDi(f, id).some(o => puoiConsegnare(f, o))

/* Quello che la schermata deve sapere, in un colpo, già contato: chi
   ha disegnato il foglio non rifà nessun conto. */
export function bottegaDi(f, id, ora = Date.now()) {
  const v = PER_ID[id]
  const stato = (f.botteghe && f.botteghe[id]) || { consegne: 0, banconi: [] }
  const banconi = stato.banconi.map((x, i) => {
    if (x && x.chiede) {
      const righe = Object.entries(x.chiede).map(([prodotto, serve]) => ({
        prodotto, serve, hai: f.quantoHo(prodotto),
        nome: (PRODOTTI[prodotto] || {}).nome || prodotto,
        pieno: f.quantoHo(prodotto) >= serve,
      }))
      return { i, cliente: { ...x, cliente: clienteDi(x.chi), righe,
                             pronto: puoiConsegnare(f, x) } }
    }
    const minuti = x && x.dal
      ? Math.max(0, Math.ceil((x.dal - ora) / MINUTO)) : 0
    return { i, minuti }
  })
  return { id, nome: v ? v.nome : id, fama: famaDi(stato), banconi }
}
