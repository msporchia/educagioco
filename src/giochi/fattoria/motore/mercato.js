/* ═══════════════════════════════════════════════════════════════════
   IL MERCATO — QUALCUNO CHE CHIEDE

   ── IL PROBLEMA ───────────────────────────────────────────────────
   Quello che la fattoria produce lo mangiavano **solo il cane e il
   gatto**, e una ciotola non è un consumo: si riempie in un gesto e la
   pancia risale da sola. Da lì il silo si tappava di grano e la
   domanda «e adesso cosa ci faccio» non aveva risposta — la catena
   arrivava in fondo e finiva contro un muro.

   Adesso al banco arrivano degli ordini: **«il fornaio vuole 3 grano e
   2 uova»**. Un obiettivo che si legge in due secondi e che dice da
   solo cosa seminare, che è la cosa che nessun magazzino sa dire.

   ── COSA STA QUI E COSA STA DI LÀ ─────────────────────────────────
   Qui le **regole**: cosa si può chiedere, quando arriva un ordine
   nuovo, cosa succede consegnando. In `dati/mercato.js` i **numeri** —
   quanto rende un ordine e perché non paga monete, che è la decisione
   grossa. Lo stato (i tre posti al banco, l'esperienza guadagnata) sta
   nella `Fattoria`, che è quello che finisce nel profilo.

   Stessa forma di `motore/vicino.js`: funzioni pure che ricevono la
   fattoria e rispondono. Nessun Vue, nessun DOM, gira in Node — e
   infatti si prova senza browser (`test/unita/mercato`).

   ── NON SI CHIEDE QUELLO CHE NON SI PUÒ FARE ──────────────────────
   Un ordine pesca solo fra le merci **ottenibili adesso**: quelle che
   il livello ha aperto (`merciDelLivello`) e che questa fattoria sa
   davvero produrre (`Fattoria.ottenibile` — la stessa domanda con cui
   il silo decide quali scomparti mostrare). È la stessa promessa che
   il carretto del vicino non fa: offrire zucche a chi le vedrà fra
   ventimila monete è un tasto che non si può premere, cioè un tasto
   rotto.

   ── RIFIUTARE COSTA ATTESA, CONSEGNARE NO ─────────────────────────
   Un posto **consegnato** si riempie subito: la roba l'hai portata, il
   posto è tuo. Un posto **rifiutato** resta vuoto per `RIPOSO_MIN`
   minuti veri. Senza quell'attesa il gesto giusto sarebbe premere ✕
   finché non esce l'ordine più facile — cioè un mercato che si gioca
   col pollice invece che coi campi. Cinque minuti sono un campo di
   grano: chi rifiuta torna a coltivare, non aspetta guardando.

   ── E IL CASO SI PASSA DA FUORI ───────────────────────────────────
   `rnd` arriva da chi chiama (`Math.random` in gioco), perché una
   partita si deve poter rifare identica: senza, un test racconta ogni
   volta una storia diversa.
   ═══════════════════════════════════════════════════════════════════ */
import { PRODOTTI } from '../dati/coltivazioni.js'
import { eMercato } from '../dati/catalogo.js'
import {
  CLIENTI, POSTI, MERCI_MAX, PEZZI_MAX, RIPOSO_MIN,
  merciDelLivello, premioPer, minutiPer,
} from '../dati/mercato.js'

const MINUTO = 60000

/* C'è una bancarella in mappa? In magazzino non conta: una cosa
   comprata e non ancora posata non fa niente, come un silo nel baule
   non contiene niente. Stessa regola del carretto del vicino. */
export const mercatoIn = f => f.cose.find(eMercato) || null

/* Le merci che un ordine può chiedere a questa fattoria, in ordine di
   tabella. Due filtri e non uno: il **livello** (che è dato, e vale
   per tutti) e quello che **questa** fattoria sa fare (che dipende dai
   premi presi). Il secondo è sempre più stretto del primo, e tenerli
   tutti e due scritti serve a poterlo provare per ogni livello senza
   costruire sessantacinque fattorie. */
export const merciOrdinabili = f =>
  merciDelLivello(f.livello).filter(p => f.ottenibile(p))

const pesca = (rnd, quante) => Math.min(quante - 1, Math.floor(rnd() * quante))

/* Un ordine nuovo. Quante merci diverse: quasi sempre una o due — tre
   solo ogni tanto, e mai più di quante se ne possano produrre. «Tre
   grano» è un ordine che un bambino di sei anni legge tutto; «due
   grano, un uovo, tre carote e una lana» è un compito. */
export function componiOrdine(f, rnd = Math.random, id = 1) {
  const merci = merciOrdinabili(f)
  if (!merci.length) return null
  let quante = 1
  if (rnd() < 0.55) quante++
  if (rnd() < 0.2) quante++
  quante = Math.min(quante, MERCI_MAX, merci.length)

  const resta = merci.slice()
  const chiede = {}
  for (let i = 0; i < quante; i++) {
    const [p] = resta.splice(pesca(rnd, resta.length), 1)
    chiede[p] = 1 + Math.floor(rnd() * PEZZI_MAX)
  }
  const chi = CLIENTI[pesca(rnd, CLIENTI.length)]
  return { id, chi: chi.id, chiede, xp: premioPer(chiede), minuti: minutiPer(chiede) }
}

/* I tre posti del banco, rimessi a posto: quelli vuoti si riempiono,
   quelli in riposo aspettano il loro minuto. Si chiama aprendo il
   mercato e dopo ogni gesto — non c'è nessun orologio da tenere in
   vita, come per i campi che crescono leggendo l'ora vera.

   Torna `true` se qualcosa è cambiato, così chi chiama sa se c'è da
   salvare. */
export function aggiornaIlMercato(f, ora = Date.now(), rnd = Math.random) {
  if (!Array.isArray(f.ordini)) f.ordini = []
  let mosso = false
  while (f.ordini.length < POSTI) { f.ordini.push(null); mosso = true }
  if (f.ordini.length > POSTI) { f.ordini.length = POSTI; mosso = true }
  for (let i = 0; i < POSTI; i++) {
    const p = f.ordini[i]
    if (p && p.chiede) continue                       // c'è già un ordine
    if (p && p.dal > ora) continue                    // sta riposando
    const o = componiOrdine(f, rnd, f.prossimoOrdine || 1)
    if (!o) { if (p) { f.ordini[i] = null; mosso = true } continue }
    f.prossimoOrdine = (f.prossimoOrdine || 1) + 1
    o.nato = ora
    f.ordini[i] = o
    mosso = true
  }
  return mosso
}

/* Gli ordini veri, senza i posti vuoti: è quello che la schermata
   mostra. I posti in riposo escono a parte (`riposi`), perché «fra
   quanto ne arriva un altro» è una cosa da dire e non da nascondere. */
export const ordiniDi = f => (f.ordini || []).filter(o => o && o.chiede)
export const riposiDi = f => (f.ordini || []).filter(o => o && !o.chiede && o.dal)
export const ordineDi = (f, id) => ordiniDi(f).find(o => o.id === id) || null

/* Quello che manca per consegnare: `[{ prodotto, serve, hai }]`, vuoto
   se si può consegnare. Non è un sì/no perché un «non si può» non
   compare mai da solo in questo gioco — porta con sé cosa manca, e
   possibilmente il tasto per andarlo a prendere
   (`motore/consiglio.js`). */
export function cheMancaPer(f, ordine) {
  if (!ordine) return []
  return Object.entries(ordine.chiede)
    .map(([prodotto, serve]) => ({ prodotto, serve, hai: f.quantoHo(prodotto) }))
    .filter(r => r.hai < r.serve)
}

export const puoiConsegnare = (f, ordine) => !!ordine && !cheMancaPer(f, ordine).length

/* Consegnare: esce la merce, entra l'esperienza, e al posto liberato
   arriva subito un ordine nuovo.

   Il controllo viene **prima** di toccare qualunque cosa, come in
   `nutri` e in `coccola`: chi non ha abbastanza roba non perde niente,
   perde solo il gesto. Un ordine consegnato a metà sarebbe l'unico
   modo, in tutta la fattoria, di far sparire il lavoro di un bambino. */
export function consegna(f, id, ora = Date.now(), rnd = Math.random) {
  if (!mercatoIn(f)) return { ok: false, motivo: 'niente-mercato' }
  const o = ordineDi(f, id)
  if (!o) return { ok: false, motivo: 'non-esiste' }
  const manca = cheMancaPer(f, o)
  if (manca.length) return { ok: false, motivo: 'manca-roba', manca }
  for (const [p, n] of Object.entries(o.chiede)) f.togli(p, n)
  const salito = f.guadagna(o.xp)
  const i = f.ordini.indexOf(o)
  if (i >= 0) f.ordini[i] = null
  aggiornaIlMercato(f, ora, rnd)
  return { ok: true, xp: o.xp, ordine: o, livello: f.livello, salito }
}

/* Rifiutare: il posto resta vuoto per `RIPOSO_MIN` minuti. Non si
   perde niente e non si paga niente — quello che si paga è **il
   tempo**, che è l'unica moneta che qui non si può fare in fretta. */
export function rifiuta(f, id, ora = Date.now()) {
  const o = ordineDi(f, id)
  if (!o) return { ok: false, motivo: 'non-esiste' }
  const i = f.ordini.indexOf(o)
  if (i < 0) return { ok: false, motivo: 'non-esiste' }
  f.ordini[i] = { dal: ora + RIPOSO_MIN * MINUTO }
  return { ok: true, minuti: RIPOSO_MIN }
}

/* Fra quanti minuti torna un posto rifiutato: serve alla schermata, che
   dice «ne arriva un altro fra 4 min» invece di lasciare un buco. */
export const mancaAlProssimo = (riposo, ora = Date.now()) =>
  Math.max(0, Math.ceil(((riposo && riposo.dal ? riposo.dal : ora) - ora) / MINUTO))

/* C'è qualcosa da consegnare adesso? È il fumetto che galleggia sopra
   la bancarella, la stessa domanda del 🧺 sopra un campo pronto: si
   vede da lontano e non chiede di aprire niente. */
export const qualcosaDaConsegnare = f => ordiniDi(f).some(o => puoiConsegnare(f, o))

/* Quello che la schermata deve sapere, in un colpo: gli ordini con
   dentro già contato cosa manca, e i posti in attesa. Chi disegna non
   rifà nessun conto — riceve fatti già decisi, come il resto del
   gioco. */
export function bancoDi(f, ora = Date.now()) {
  return {
    ordini: ordiniDi(f).map(o => ({
      ...o,
      cliente: CLIENTI.find(c => c.id === o.chi) || CLIENTI[0],
      righe: Object.entries(o.chiede).map(([prodotto, serve]) => ({
        prodotto, serve, hai: f.quantoHo(prodotto),
        nome: (PRODOTTI[prodotto] || {}).nome || prodotto,
        pieno: f.quantoHo(prodotto) >= serve,
      })),
      pronto: puoiConsegnare(f, o),
    })),
    riposi: riposiDi(f).map(r => ({ minuti: mancaAlProssimo(r, ora) })),
  }
}
