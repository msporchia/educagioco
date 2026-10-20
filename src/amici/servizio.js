// Il motore degli amici di questo telefono (docs/core/amici.md): tiene un `Ponte` per amico, sa chi è online, riceve gli inviti.
// Spento di base: senza «Amici online» acceso dai grandi non apre niente. Offline non dà mai un errore: i ponti riprovano da soli.
import { reactive } from 'vue'
import { dati, impara } from '../store/amici.js'
import { Ponte } from './rete.js'
import { presento, invito, risposta, leggi } from './messaggi.js'
import { GIOCHI, sappiamo } from './giochi.js'

export const DURATA_INVITO = 30000       // ms: il cartello sparisce da solo

/* quello che le schermate guardano: gli amici (con chi è online) e l'invito in arrivo */
export const stato = reactive({ acceso: false, amici: [], invito: null, risposta: null })

let ponti = new Map()                    // chiave → Ponte
let presenti = new Map()                 // chiave → { gioco } di chi si è presentato su questo collegamento
let io = { nome: '', gioco: null }
let puoGiocare = () => true               // il bambino ha quel gioco in casa? (i grandi possono averlo spento)
let opzioni = {}                         // WebSocketImpl, servizio, ritardi: per le prove
let scadenza = 0

function aggiorna() {
  stato.amici = dati.amici.map(a => {
    const p = ponti.get(a.chiave)
    const visto = presenti.get(a.chiave)
    return { chiave: a.chiave, id: a.id, nome: a.nome, online: !!(p?.aperto && p.altro && visto), gioco: visto?.gioco || null, inAttesa: !a.id }
  })
}

function presentati(chiave) { ponti.get(chiave)?.invia(presento(dati.id, io.nome, io.gioco)) }

function arrivato(chiave, m) {
  const l = leggi(m)
  if (!l) return
  if (l.k === 'presento') {
    impara(chiave, l.id, l.nome)
    presenti.set(chiave, { gioco: l.gioco })
  } else if (l.k === 'invito') {
    if (!sappiamo(l.gioco) || !GIOCHI[l.gioco].valida(l.dati) || stato.invito) return      // uno alla volta; roba che non capiamo, non si mostra
    if (!puoGiocare(l.gioco)) { ponti.get(chiave)?.invia(risposta(false)); return }          // un gioco che i grandi hanno spento: «non può ora»
    const a = dati.amici.find(x => x.chiave === chiave)
    stato.invito = { chiave, nome: a?.nome || 'Un amico', gioco: l.gioco, dati: l.dati }
    clearTimeout(scadenza)
    scadenza = setTimeout(() => { stato.invito = null }, DURATA_INVITO)
  } else if (l.k === 'risposta') {
    stato.risposta = { chiave, ok: l.ok }
  }
  aggiorna()
}

function nuovoPonte(a) {
  const p = new Ponte({
    chiave: a.chiave, id: dati.id, ...opzioni,
    alMessaggio: m => arrivato(a.chiave, m),
    alCambio: () => {
      if (p.altro) presentati(a.chiave)                                  // l'altro è appena arrivato (o ci siamo appena aperti): ci si presenta
      else presenti.delete(a.chiave)
      aggiorna()
    },
  })
  return p
}

/* Si parte per il bambino di turno, se i grandi hanno acceso «Amici online» e lui è online. Si può richiamare: ricomincia da capo. */
export function avvia({ nome = '', gioco = null, puoGiocare: puo = () => true, ...prove } = {}) {
  ferma()
  puoGiocare = puo
  opzioni = prove
  io = { nome, gioco }
  if (!dati.attivo || !dati.online) { aggiorna(); return }
  stato.acceso = true
  for (const a of dati.amici) { const p = nuovoPonte(a); ponti.set(a.chiave, p); p.avvia() }
  aggiorna()
}

export function ferma() {
  for (const p of ponti.values()) p.chiudi()
  ponti = new Map(); presenti = new Map()
  clearTimeout(scadenza)
  stato.acceso = false; stato.invito = null; stato.risposta = null
  aggiorna()
}

/* un'amicizia nuova mentre si gioca (abbinamento fatto dai grandi): si apre il suo ponte */
export function aggiungiPonte(chiave) {
  if (!stato.acceso || ponti.has(chiave)) return
  const a = dati.amici.find(x => x.chiave === chiave)
  if (!a) return
  const p = nuovoPonte(a); ponti.set(chiave, p); p.avvia(); aggiorna()
}

export function togliPonte(chiave) {
  ponti.get(chiave)?.chiudi(); ponti.delete(chiave); presenti.delete(chiave); aggiorna()
}

/* a cosa sto giocando, perché gli amici lo vedano */
export function diciGioco(gioco) {
  io = { ...io, gioco: gioco || null }
  for (const chiave of ponti.keys()) presentati(chiave)
}

/* invita un amico che è online: torna falso se non si può (non c'è, offline, occupato altrove) */
export function invita(chiave, gioco, datiInvito) {
  const a = stato.amici.find(x => x.chiave === chiave)
  if (!a?.online || !sappiamo(gioco) || !GIOCHI[gioco].valida(datiInvito)) return false
  stato.risposta = null
  return !!ponti.get(chiave)?.invia(invito(gioco, datiInvito))
}

/* risponde all'invito in arrivo; torna l'invito se si accetta (chi chiama apre il gioco), altrimenti null */
export function rispondi(ok) {
  const i = stato.invito
  if (!i) return null
  clearTimeout(scadenza)
  stato.invito = null
  ponti.get(i.chiave)?.invia(risposta(ok))
  return ok ? i : null
}

/* lo schermo torna acceso: i ponti riprovano subito; spento, smettono di riprovare da soli */
export function schermoAcceso() { for (const p of ponti.values()) p.riprendi() }
