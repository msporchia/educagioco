// Il motore degli amici di questo telefono (docs/core/amici.md): tiene un `Ponte` per amico, sa chi è online, riceve gli inviti.
// Spento di base: senza «Amici online» acceso dai grandi non apre niente. Offline non dà mai un errore: il collegamento riprova da solo.
import { reactive } from 'vue'
import { dati, impara } from '../store/amici.js'
import { Ponte } from './rete.js'
import { presento, invito, risposta, leggi } from './messaggi.js'
import { GIOCHI, sappiamo } from './giochi.js'

export const DURATA_INVITO = 30000       // ms: il cartello sparisce da solo

/* quello che le schermate guardano: gli amici (con chi è online) e l'invito in arrivo */
export const stato = reactive({ acceso: false, amici: [], invito: null, risposta: null })

let ponte = null                         // l'unico collegamento di questo telefono
let presenti = new Map()                 // chiave → { gioco } di chi si è presentato su questo collegamento
let io = { nome: '', gioco: null }
let puoGiocare = () => true               // il bambino ha quel gioco in casa? (i grandi possono averlo spento)
let opzioni = {}                         // WebSocketImpl, servizio, ritardi: per le prove
let scadenza = 0
let suBacheca = () => {}                 // l'amico ha riscritto la sua bacheca: la mette bacheca.js

function aggiorna() {
  stato.amici = dati.amici.map(a => {
    const visto = presenti.get(a.chiave)
    return { chiave: a.chiave, id: a.id, nome: a.nome, online: !!(ponte?.aperto && ponte.presenti.has(a.chiave) && visto), gioco: visto?.gioco || null, inAttesa: !a.id }
  })
}

function presentati(chiave) { ponte?.invia(chiave, presento(dati.id, io.nome, io.gioco)) }

function arrivato(chiave, m) {
  const l = leggi(m)
  if (!l) return
  if (l.k === 'presento') {
    impara(chiave, l.id, l.nome)
    presenti.set(chiave, { gioco: l.gioco })
  } else if (l.k === 'invito') {
    if (!sappiamo(l.gioco) || !GIOCHI[l.gioco].valida(l.dati) || stato.invito) return      // uno alla volta; roba che non capiamo, non si mostra
    if (!puoGiocare(l.gioco)) { ponte?.invia(chiave, risposta(false)); return }          // un gioco che i grandi hanno spento: «non può ora»
    const a = dati.amici.find(x => x.chiave === chiave)
    stato.invito = { chiave, nome: a?.nome || 'Un amico', gioco: l.gioco, dati: l.dati }
    clearTimeout(scadenza)
    scadenza = setTimeout(() => { stato.invito = null }, DURATA_INVITO)
  } else if (l.k === 'risposta') {
    stato.risposta = { chiave, ok: l.ok }
  } else if (l.k === 'bacheca') {
    suBacheca(chiave)
  }
  aggiorna()
}

/* il collegamento è cambiato: chi è appena arrivato si saluta presentandosi, chi se n'è andato si dimentica */
let conosciuti = new Set()
function cambiato() {
  const adesso = ponte?.aperto ? ponte.presenti : new Set()
  for (const c of adesso) if (!conosciuti.has(c)) presentati(c)
  for (const c of [...presenti.keys()]) if (!adesso.has(c)) presenti.delete(c)
  conosciuti = new Set(adesso)
  aggiorna()
}

/* Si parte per il bambino di turno, se i grandi hanno acceso «Amici online» e lui è online. Si può richiamare: ricomincia da capo. */
export function avvia({ nome = '', gioco = null, puoGiocare: puo = () => true, ...prove } = {}) {
  ferma()
  puoGiocare = puo
  opzioni = prove
  io = { nome, gioco }
  if (!dati.attivo || !dati.online) { aggiorna(); return }
  stato.acceso = true
  ponte = new Ponte({ id: dati.id, chiavi: () => dati.amici.map(a => a.chiave), ...opzioni, alMessaggio: arrivato, alCambio: cambiato })
  ponte.avvia()
  aggiorna()
}

export function ferma() {
  ponte?.chiudi()
  ponte = null; presenti = new Map(); conosciuti = new Set()
  clearTimeout(scadenza)
  stato.acceso = false; stato.invito = null; stato.risposta = null
  aggiorna()
}

/* un'amicizia nuova (o tolta) mentre si gioca, fatta dai grandi: si dice al servizio le chiavi di adesso */
export function aggiungiPonte() { ponte?.imposta(); aggiorna() }
export function togliPonte(chiave) { presenti.delete(chiave); ponte?.imposta(); aggiorna() }

/* a cosa sto giocando, perché gli amici lo vedano */
export function diciGioco(gioco) {
  io = { ...io, gioco: gioco || null }
  for (const chiave of ponte?.presenti || []) presentati(chiave)
}

/* invita un amico che è online: torna falso se non si può (non c'è, offline, occupato altrove) */
export function invita(chiave, gioco, datiInvito) {
  const a = stato.amici.find(x => x.chiave === chiave)
  if (!a?.online || !sappiamo(gioco) || !GIOCHI[gioco].valida(datiInvito)) return false
  stato.risposta = null
  return !!ponte?.invia(chiave, invito(gioco, datiInvito))
}

/* risponde all'invito in arrivo; torna l'invito se si accetta (chi chiama apre il gioco), altrimenti null */
export function rispondi(ok) {
  const i = stato.invito
  if (!i) return null
  clearTimeout(scadenza)
  stato.invito = null
  ponte?.invia(i.chiave, risposta(ok))
  return ok ? i : null
}

/* la bacheca (docs/core/amici-bacheca.md): chi la rilegge quando l'amico avvisa, e l'avviso a chi è online adesso */
export const quandoBacheca = f => { suBacheca = typeof f === 'function' ? f : () => {} }
export function avvisaPresenti(m) { for (const chiave of ponte?.presenti || []) ponte.invia(chiave, m) }

/* lo schermo torna acceso: il collegamento riprova subito; spento, smettono di riprovare da soli */
export function schermoAcceso() { ponte?.riprendi() }
