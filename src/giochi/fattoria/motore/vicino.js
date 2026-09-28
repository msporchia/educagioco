/* Il carretto del vicino: dà 5 di quello che avanza, riceve 1 di quello che manca — mai monete.
   Cinque contro uno apposta (la via d'uscita da uno stallo, non un modo di giocare); gratis e
   immediato — vedi docs/fattoria/chi-chiede.md. Pure, gira in Node. */
import { PRODOTTI, SILI, merciDi } from '../dati/coltivazioni.js'
import { eVicino } from '../dati/catalogo.js'
import { livelloDelProdotto } from '../dati/livelli.js'

// Il rapporto che impedisce al carretto di diventare un modo di giocare — vedi in testa al file.
export const DAI = 5
export const RICEVI = 1

// C'è un carretto in mappa? In magazzino non conta.
export const carrettoIn = f => f.cose.find(eVicino) || null

// Quello che si può dare (almeno cinque): chi ne ha di più va per primo.
export function cosaPuoiDare(f) {
  const righe = []
  for (const prodotto of Object.keys(PRODOTTI)) {
    const quanti = f.quantoHo(prodotto)
    if (quanti >= DAI) righe.push({ prodotto, quanti, colmo: f.quantoCiSta(prodotto) === 0 })
  }
  return righe.sort((a, b) => b.quanti - a.quanti)
}

// Quello che si può ricevere: solo merci già aperte, con posto dove finire, diverse da quella data.
// Per primo quello che hai di meno.
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

// Lo scambio; verso null è il regalo. Il controllo su cosaOffre non si salta (un foglio vecchio potrebbe offrire un posto già pieno).
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

// Quanti scomparti sono colmi: serve solo a scegliere cosa dire aprendo il carretto (scambio o sblocco).
export function scompartiColmi(f) {
  const colmi = []
  // Tutti i silos letti dalla tabella, non scritti a mano (la dispensa sarebbe rimasta fuori).
  for (const fam of Object.keys(SILI))
    for (const prodotto of merciDi(fam))
      if (f.eCostruito(fam) && f.quantoCiSta(prodotto) === 0) colmi.push(prodotto)
  return colmi
}
