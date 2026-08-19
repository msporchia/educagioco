/* ═══════════════════════════════════════════════════════════════════
   IL CARRETTO DEL VICINO — DARE VIA QUELLO CHE AVANZA

   ── IL PROBLEMA ───────────────────────────────────────────────────
   Un bambino non alterna le colture: semina quella che gli piace. Da lì
   arriva lo stato che ha fatto nascere questo file — **trentadue di
   mais e quattro di carote** — dove il campo è maturo, lo scomparto è
   colmo, e l'unica strada che il gioco offriva era pagare per
   ingrandire il silo. Chi non ha monete resta fermo, e restare fermi in
   un gioco che è il premio degli esercizi vuol dire smettere di farli.

   ── COSA FA ───────────────────────────────────────────────────────
   Gli si danno **5** di quello che avanza e se ne ricevono **1** di
   quello che manca. Non è un mercato e non è un negozio: non entrano né
   escono monete, in nessuna direzione, quindi la regola che tiene in
   piedi tutta la fattoria — *niente si vende, il verso è sempre monete
   → cose* — resta intatta.

   ── PERCHÉ PERDE, E PERCHÉ DEVE PERDERE ───────────────────────────
   Cinque contro uno è uno scambio pessimo, ed è la sua unica difesa. Un
   convertitore alla pari sarebbe la strada più corta per qualunque
   coltura: si semina sempre la più veloce e si converte, e le altre
   quattro diventano decorazioni. A cinque contro uno coltivare conviene
   sempre, e questo resta quello che è: **la via d'uscita da uno
   stallo**, non un modo di giocare.

   Per lo stesso motivo è **gratis** e **immediato**. Chi ha il silo
   tappato è spesso anche a zero monete — è lo stesso bambino, nello
   stesso pomeriggio — e una valvola che si apre solo pagando non è una
   valvola. Il carretto si è già pagato quando è stato comprato.

   ── E SE NON C'È NIENTE DA RICEVERE ───────────────────────────────
   Il vicino prende la roba e **dice grazie**. Sembra la stessa cosa che
   buttarla, e non lo è: quello che cambia è che qualcuno l'ha voluta.
   In una fattoria dove niente marcisce e niente scade, un tasto
   «butta» sarebbe l'unica cosa capace di sprecare il lavoro di un
   bambino — e non ci sarà mai. Un regalo che viene ringraziato no.

   Non sa niente di Vue né di monete: riceve la fattoria e risponde.
   Gira in Node, e infatti si prova senza browser.
   ═══════════════════════════════════════════════════════════════════ */
import { PRODOTTI, merciDi } from '../dati/coltivazioni.js'
import { eVicino } from '../dati/catalogo.js'
import { livelloDelProdotto } from '../dati/livelli.js'

/* Quanto se ne dà e quanto se ne riceve. Il perché di questo rapporto
   sta in testa al file: è quello che impedisce al carretto di diventare
   un modo di giocare. */
export const DAI = 5
export const RICEVI = 1

/* C'è un carretto in mappa? In magazzino non conta: una cosa comprata e
   non ancora posata non fa niente, come un silo nel baule non contiene
   niente. */
export const carrettoIn = f => f.cose.find(eVicino) || null

/* Quello che si può dare: ce n'è almeno cinque. Torna righe pronte da
   mostrare, in ordine di quanto ne hai — chi ne ha di più è quello che
   ti sta tappando il silo, e va per primo. */
export function cosaPuoiDare(f) {
  const righe = []
  for (const prodotto of Object.keys(PRODOTTI)) {
    const quanti = f.quantoHo(prodotto)
    if (quanti >= DAI) righe.push({ prodotto, quanti, colmo: f.quantoCiSta(prodotto) === 0 })
  }
  return righe.sort((a, b) => b.quanti - a.quanti)
}

/* Quello che si può ricevere in cambio di `dato`.

   Tre condizioni, e ognuna toglie una promessa che non si potrebbe
   mantenere: dev'essere una merce che **il livello ha già aperto** (se
   no il vicino offre zucche a chi le vedrà fra ventimila monete), che
   ha **posto dove finire**, e che **non è quella che stai dando** —
   scambiare mais con mais è un tasto che toglie quattro pezzi e non
   fa niente.

   L'ordine mette per primo quello che hai di meno: è quasi sempre la
   ragione per cui sei venuto qui. */
export function cosaOffre(f, dato) {
  const righe = []
  for (const prodotto of Object.keys(PRODOTTI)) {
    if (prodotto === dato) continue
    if (livelloDelProdotto(prodotto) > f.livello) continue
    if (f.quantoCiSta(prodotto) < RICEVI) continue
    righe.push({ prodotto, quanti: f.quantoHo(prodotto) })
  }
  return righe.sort((a, b) => a.quanti - b.quanti)
}

/* Lo scambio. `verso` a `null` è il regalo: si dà e si riceve un
   grazie, ed è la strada che resta quando non c'è più niente che possa
   entrare da nessuna parte.

   Il controllo su `cosaOffre` non si salta: un `verso` arrivato da una
   schermata vecchia — il silo si è riempito mentre il foglio era
   aperto — toglierebbe cinque pezzi per metterne uno che non ci sta,
   e sarebbe una perdita secca causata dal gioco. */
export function scambia(f, dato, verso = null) {
  if (!carrettoIn(f)) return { ok: false, motivo: 'niente-carretto' }
  if (!PRODOTTI[dato]) return { ok: false, motivo: 'non-esiste' }
  if (f.quantoHo(dato) < DAI) return { ok: false, motivo: 'poca-roba', serve: DAI }
  if (verso) {
    if (!cosaOffre(f, dato).some(r => r.prodotto === verso))
      return { ok: false, motivo: 'non-ci-sta' }
  }
  f.togli(dato, DAI)
  if (verso) f.metti(verso, RICEVI)
  return { ok: true, dato, quanti: DAI, verso, ricevuti: verso ? RICEVI : 0 }
}

/* Quanti scomparti sono colmi in tutta la fattoria: serve solo a
   scegliere cosa dire aprendo il carretto. Zero vuol dire che il
   bambino è passato di qui per curiosità, e allora la schermata deve
   parlare di scambio; uno o più vuol dire che è venuto a sbloccarsi, e
   allora deve parlare di quello. */
export function scompartiColmi(f) {
  const colmi = []
  for (const fam of ['terra', 'stalla'])
    for (const prodotto of merciDi(fam))
      if (f.eCostruito(fam) && f.quantoCiSta(prodotto) === 0) colmi.push(prodotto)
  return colmi
}
