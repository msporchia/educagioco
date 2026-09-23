/* ═══════════════════════════════════════════════════════════════════
   LA MONGOLFIERA — UN ORDINE GROSSO, UN PO' ALLA VOLTA

   ── COSA STA QUI E COSA STA DI LÀ ─────────────────────────────────
   Qui le **regole**: quando atterra, cosa chiede, cosa succede
   consegnando una cassa, cosa vuol dire «Parti!». In
   `dati/mongolfiera.js` i **numeri** e il tetto del premio. Lo stato
   sta nella `Fattoria`, in `f.mongolfiera`, che è quello che finisce
   nel profilo:

     f.mongolfiera = null                    mai atterrata
                   | { n, nata, file }       è a terra, e aspetta
                   | { n, via }              è partita a quell'ora
       fila  = { merce, casse: [cassa] }
       cassa = { pezzi, xp, piena }

   `n` conta i palloni, e serve alla schermata come chiave: un pallone
   nuovo è un foglio nuovo, anche se chiede le stesse cose. `xp` si
   scrive sulla cassa **quando atterra**, come il premio di un ordine
   al banco: il numero promesso è quello che si prende, anche se una
   tabella cambia in mezzo.

   Stessa forma di `motore/mercato.js`: funzioni pure che ricevono la
   fattoria, e il caso e l'ora passati da fuori — una partita si deve
   poter rifare identica, e un test deve poter saltare un'ora senza
   aspettarla.

   ── NON HA FRETTA ─────────────────────────────────────────────────
   Niente scade, in questa fattoria (`dati/coltivazioni.js`), e il
   pallone nemmeno: resta a terra finché non si preme «Parti!», che si
   può premere quando si vuole — anche a metà, anche subito. Quello che
   si è consegnato resta preso: le casse rendono **consegnandole**, non
   partendo, e la partenza non toglie niente a nessuno. Costa solo
   **tempo**: dopo, il cielo resta vuoto `CIELO_VUOTO_MIN` minuti, che è
   quello che impedisce di rimescolare le casse finché non escono
   facili — la stessa ragione del riposo al banco dopo un rifiuto.

   ── NON SI CHIEDE QUELLO CHE NON SI PUÒ FARE ──────────────────────
   Una fila pesca fra le merci ordinabili adesso (`merciOrdinabili`,
   la stessa domanda del banco) che passano da almeno una macchina
   (`merceDaCassa`), pesate come al banco (`pesoDellaMerce`) e **tutte
   diverse**: tre file di torte sarebbero una fila sola scritta tre
   volte. Se le merci sono meno delle file, le file sono meno.
   ═══════════════════════════════════════════════════════════════════ */
import { PRODOTTI } from '../dati/coltivazioni.js'
import { PER_ID, CATALOGO, eMongolfiera } from '../dati/catalogo.js'
import { pesoDellaMerce } from '../dati/mercato.js'
import {
  CASSE_MIN, CASSE_MAX, PEZZI_MIN, PEZZI_MAX, CIELO_VUOTO_MIN,
  fileAl, merceDaCassa, premioDellaCassa, bonusDellaFila, bonusDelTutto,
} from '../dati/mongolfiera.js'
import { merciOrdinabili } from './mercato.js'

const MINUTO = 60000

/* Le otto sorprese della fiera, nell'ordine del catalogo. */
export const SORPRESE = CATALOGO.filter(v => v.fiera).map(v => v.id)

/* La piazzola in mappa, se c'è. Nel baule non conta, come per la
   bancarella: una cosa comprata e non posata non fa atterrare niente. */
export const mongolfieraIn = f => f.cose.find(eMongolfiera) || null

/* Le merci che una cassa può chiedere a questa fattoria. */
export const merciDaCassa = f => merciOrdinabili(f).filter(merceDaCassa)

const traMinMax = (rnd, min, max) => min + Math.min(max - min, Math.floor(rnd() * (max - min + 1)))

/* Come la pesca del banco: una merce pesa quanto dice `pesoDellaMerce`,
   un'estrazione sola di `rnd` per merce. */
function pescaPesata(rnd, merci, livello) {
  const pesi = merci.map(p => pesoDellaMerce(p, livello))
  let x = rnd() * pesi.reduce((s, w) => s + w, 0)
  for (let i = 0; i < merci.length; i++) if ((x -= pesi[i]) < 0) return i
  return merci.length - 1
}

/* Un pallone nuovo. Ogni fila ha **una** quantità per tutte le sue
   casse — «tre casse da due torte» — perché è così che la si legge in
   un'occhiata, e perché le caselle di una fila vengono tutte uguali.
   Torna `null` se non c'è niente da chiedere. */
export function componiLaMongolfiera(f, rnd = Math.random, n = 1, ora = Date.now()) {
  const resta = merciDaCassa(f)
  const quante = Math.min(fileAl(f.livello), resta.length)
  if (!quante) return null
  const file = []
  for (let i = 0; i < quante; i++) {
    const [merce] = resta.splice(pescaPesata(rnd, resta, f.livello), 1)
    const casse = traMinMax(rnd, CASSE_MIN, CASSE_MAX)
    const pezzi = traMinMax(rnd, PEZZI_MIN, PEZZI_MAX)
    file.push({ merce, casse: Array.from({ length: casse },
      () => ({ pezzi, xp: premioDellaCassa(merce, pezzi), piena: false })) })
  }
  return { n, nata: ora, file }
}

/* È a terra? */
export const aTerra = m => !!(m && Array.isArray(m.file) && m.file.length)

/* Fra quanti minuti ne atterra un'altra: zero se il cielo è già pronto
   (o se non è mai partita). */
export const minutiAlProssimo = (f, ora = Date.now()) => {
  const m = f.mongolfiera
  if (!m || !(m.via > 0)) return 0
  return Math.max(0, Math.ceil((m.via + CIELO_VUOTO_MIN * MINUTO - ora) / MINUTO))
}

/* Il pallone rimesso a posto: se il cielo è libero — mai atterrato, o
   partito da più di un'ora — ne scende uno. Si chiama aprendo il foglio
   e dal battito della scena, come il banco: nessun orologio da tenere
   in vita. Torna `true` se qualcosa è cambiato, così chi chiama sa se
   c'è da salvare.

   Senza la piazzola in mappa non succede niente: né atterra né si
   perde quello che c'era — una mongolfiera messa via col pallone a
   terra lo ritrova rimettendola giù. */
export function aggiornaLaMongolfiera(f, ora = Date.now(), rnd = Math.random) {
  if (!mongolfieraIn(f)) return false
  const m = f.mongolfiera
  if (aTerra(m)) return false
  if (m && m.via > 0 && minutiAlProssimo(f, ora) > 0) return false
  const nuova = componiLaMongolfiera(f, rnd, ((m && m.n) || 0) + 1, ora)
  if (!nuova) return false
  f.mongolfiera = nuova
  return true
}

/* La cassa `c` della fila `i`, se esiste e il pallone è a terra. */
function cassaDi(f, i, c) {
  const m = f.mongolfiera
  if (!aTerra(m)) return null
  const fila = m.file[i]
  const cassa = fila && fila.casse[c]
  return cassa ? { fila, cassa } : null
}

export const filaPiena = fila => fila.casse.every(c => c.piena)
export const tuttoPieno = m => aTerra(m) && m.file.every(filaPiena)
const premioDelleCasse = casse => casse.reduce((s, c) => s + c.xp, 0)

/* Si può riempire questa cassa adesso? */
export const cassaPronta = (f, fila, cassa) =>
  !cassa.piena && f.quantoHo(fila.merce) >= cassa.pezzi

/* C'è una cassa da riempire con la roba che c'è? È il fumetto sopra il
   pallone, la stessa domanda del 🧺 sopra un campo pronto. */
export const qualcosaDaCaricare = f => aTerra(f.mongolfiera) &&
  f.mongolfiera.file.some(fila => fila.casse.some(c => cassaPronta(f, fila, c)))

/* La sorpresa: una delle otto, **fra quelle che non si hanno ancora** —
   in mappa o nel baule. Finite quelle, di nuovo a caso fra tutte: la
   collezione è completa, e una seconda giostrina è un regalo lo stesso. */
export function scegliLaSorpresa(f, rnd = Math.random) {
  if (!SORPRESE.length) return null
  const nuove = SORPRESE.filter(id => !f.quanteNeHo(id))
  const fra = nuove.length ? nuove : SORPRESE
  return fra[Math.min(fra.length - 1, Math.floor(rnd() * fra.length))]
}

/* Riempire una cassa: esce la merce, entra l'esperienza, subito. Se
   era l'ultima della sua fila, la fila rende il suo bonus; se era
   l'ultima di tutte, anche il bonus grosso e la sorpresa — che finisce
   nel baule come una cosa comprata.

   Il controllo viene **prima** di toccare qualunque cosa, come al
   banco: chi non ha la roba non perde niente, perde solo il gesto. */
export function caricaLaCassa(f, i, c, rnd = Math.random) {
  if (!mongolfieraIn(f)) return { ok: false, motivo: 'niente-mongolfiera' }
  const dove = cassaDi(f, i, c)
  if (!dove) return { ok: false, motivo: 'non-esiste' }
  const { fila, cassa } = dove
  if (cassa.piena) return { ok: false, motivo: 'gia-piena' }
  const hai = f.quantoHo(fila.merce)
  if (hai < cassa.pezzi)
    return { ok: false, motivo: 'manca-roba', manca: { prodotto: fila.merce, serve: cassa.pezzi, hai } }
  f.togli(fila.merce, cassa.pezzi)
  cassa.piena = true
  const m = f.mongolfiera
  const bonusFila = filaPiena(fila) ? bonusDellaFila(premioDelleCasse(fila.casse)) : 0
  const pieno = tuttoPieno(m)
  const bonusTutto = pieno ? bonusDelTutto(m.file.reduce((s, x) => s + premioDelleCasse(x.casse), 0)) : 0
  let sorpresa = null
  if (pieno) {
    sorpresa = scegliLaSorpresa(f, rnd)
    if (sorpresa) f.magazzino[sorpresa] = f.quantiNe(sorpresa) + 1
  }
  const xp = cassa.xp + bonusFila + bonusTutto
  const salito = f.guadagna(xp)
  return { ok: true, xp, cassa: cassa.xp, bonusFila, bonusTutto, sorpresa,
           tutto: pieno, livello: f.livello, salito }
}

/* «Parti!»: quando si vuole, anche a metà. Il premio delle casse
   consegnate è già stato preso, e resta; le altre se ne vanno col
   pallone. */
export function parti(f, ora = Date.now()) {
  const m = f.mongolfiera
  if (!aTerra(m)) return { ok: false, motivo: 'non-a-terra' }
  const casse = m.file.flatMap(x => x.casse)
  const piene = casse.filter(c => c.piena).length
  f.mongolfiera = { n: m.n || 1, via: ora }
  return { ok: true, piene, di: casse.length, minuti: CIELO_VUOTO_MIN }
}

/* ── LA FACCIA IN MAPPA ───────────────────────────────────────────
   Partita, la piazzola **cambia disegno** (`partita` sulla voce del
   catalogo), come un recinto cambia faccia: il pallone a terra e la
   piazzola vuota sono due cose che si leggono da lontano. A terra, il
   fumetto c'è solo quando una cassa si può riempire adesso: un invito
   che c'è sempre non è un invito.

   Un'ora passata e il pallone non ancora ricomposto (lo fa il battito
   della scena, entro qualche secondo) si mostra già a terra: il cielo
   è libero, ed è l'orologio a dirlo, non chi ha aggiornato per ultimo. */
export function aspettoDellaMongolfiera(f, cosa, ora = Date.now()) {
  const m = f.mongolfiera
  const v = PER_ID[cosa && cosa.id] || {}
  if (m && m.via > 0 && minutiAlProssimo(f, ora) > 0)
    return v.partita ? { invece: v.partita.pezzo } : null
  return qualcosaDaCaricare(f) ? { sopra: null, fumetto: '📦' } : null
}

/* ── IL SALVATAGGIO ───────────────────────────────────────────────
   Un salvataggio di prima non ce l'ha, e nasce `null`: il cielo è
   libero, e il primo pallone scende quando si posa la piazzola. Un
   pallone si rilegge solo se sta in piedi — una fila di una merce tolta
   dalla tabella si scorda, e se non ne resta nessuna il cielo torna
   libero invece di tenere a terra un pallone che non si può riempire. */
export function leggiLaMongolfiera(d) {
  if (!d || typeof d !== 'object') return null
  const n = Math.max(1, Math.floor(d.n) || 1)
  if (d.via > 0) return { n, via: d.via }
  const file = (Array.isArray(d.file) ? d.file : [])
    .filter(x => x && PRODOTTI[x.merce] && Array.isArray(x.casse))
    .map(x => ({ merce: x.merce, casse: x.casse.filter(c => c && c.pezzi > 0).map(c => ({
      pezzi: Math.min(PEZZI_MAX, Math.max(PEZZI_MIN, Math.floor(c.pezzi))),
      xp: Math.max(0, Math.floor(c.xp) || 0),
      piena: c.piena === true })) }))
    .filter(x => x.casse.length)
  if (!file.length) return null
  return { n, nata: d.nata > 0 ? d.nata : 0, file }
}

/* Quello che la schermata deve sapere, in un colpo: le file con le
   casse già contate, quanto si è preso e quanto si prenderebbe
   riempiendola tutta. Chi disegna non rifà nessun conto. */
export function naveDi(f, ora = Date.now()) {
  const m = f.mongolfiera
  if (!aTerra(m)) return { aTerra: false, minuti: minutiAlProssimo(f, ora), n: (m && m.n) || 0 }
  const tutte = m.file.flatMap(x => x.casse)
  const somma = premioDelleCasse(tutte)
  const file = m.file.map((fila, i) => {
    const p = PRODOTTI[fila.merce] || {}
    const suo = premioDelleCasse(fila.casse)
    return {
      i, merce: fila.merce, nome: p.nome || fila.merce, hai: f.quantoHo(fila.merce),
      piena: filaPiena(fila), bonus: bonusDellaFila(suo),
      casse: fila.casse.map((c, j) => ({ j, pezzi: c.pezzi, xp: c.xp, piena: c.piena,
                                         pronta: cassaPronta(f, fila, c) })),
    }
  })
  const piene = tutte.filter(c => c.piena).length
  const preso = file.reduce((s, x) => s + x.casse.filter(c => c.piena)
    .reduce((t, c) => t + c.xp, 0) + (x.piena ? x.bonus : 0), 0)
    + (piene === tutte.length ? bonusDelTutto(somma) : 0)
  const tuttoIntero = somma + file.reduce((s, x) => s + x.bonus, 0) + bonusDelTutto(somma)
  return {
    aTerra: true, n: m.n || 1, file, piene, di: tutte.length,
    preso, tuttoIntero, bonusTutto: bonusDelTutto(somma),
    pieno: piene === tutte.length,
  }
}
