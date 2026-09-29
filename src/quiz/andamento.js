/* Le righe di «Come va» (docs/genitori/come-va.md): unisce il conto per
   tipologia (store/srs.js) a quello che il catalogo sa dirne. Puro
   (test/unita/andamento). L'unità è la tipologia e non la classe: «le ore
   intere» esce a due gradi ma ha un conto solo. Ordine: peggio prima, le
   mai incontrate in coda. */

import { MINIME } from './consiglio.js'

// da 1 a 5, mai zero: uno zero si legge «non vale niente», non è quello che il numero dice
export const CUORI = 5
export const cuoriPer = quota =>
  Math.max(1, Math.min(CUORI, Math.round(quota * CUORI)))

// un item che non c'è vuol dire «mai vista», diverso da «vista e sbagliata sempre»: non devono finire vicine
export function rigaDi(tipo, classi, it, { minime = MINIME } = {}) {
  const prima = classi[0] || {}
  const ok = it?.ok || 0
  const err = it?.err || 0
  const quante = ok + err // ok+err (a cui è arrivata una risposta), non seen (mostrata): è quello di cui si può dire com'è andato
  return {
    tipo,
    nome: prima.nome || tipo,
    icona: prima.icona || '',
    gruppo: prima.gruppo || null,
    gruppoNome: prima.gruppoNome || '',
    modulo: prima.nomeModulo || '',
    materia: prima.materia || '', // per le mattonelle: «Come va» si filtra per materia
    // un intervallo e non un numero solo: una media non corrisponderebbe a nessuna domanda vera
    da: classi.length ? Math.min(...classi.map(c => c.anni)) : 0,
    a: classi.length ? Math.max(...classi.map(c => c.anni)) : 0,
    ritocco: prima.ritocco || 0,
    spenta: !!prima.spenta,
    sorgente: prima.sorgente || null, // per il ▶: la prima classe basta a rigenerare una domanda vera
    classi,

    quante, ok, err,
    quota: quante ? ok / quante : 0,
    cuori: quante ? cuoriPer(ok / quante) : 0,
    poche: quante > 0 && quante < minime, // verdetto debole: chi disegna sbiadisce i cuori e scrive «3 prove»
    mai: quante === 0,
    // NON è una media: srs.js tiene una media mobile (55/45), quindi «quanto ci mette ultimamente», non «tempo medio»
    secondi: it?.t ? Math.round(it.t / 100) / 10 : 0,
    ultima: it?.last || 0,
  }
}

// peggio prima; a parità vince chi ha più prove alle spalle; le mai incontrate in coda, dalla più facile alla più difficile
export function andamentoDi(righe = [], items = {}, { minime = MINIME } = {}) {
  const per = new Map()
  for (const c of righe) {
    if (!c.tipo) continue // i moduli vecchi senza tipologie non hanno un conto suo: la loro riga esiste già nel quadro
    if (!per.has(c.tipo)) per.set(c.tipo, [])
    per.get(c.tipo).push(c)
  }
  const fuori = []
  for (const [tipo, classi] of per) fuori.push(rigaDi(tipo, classi, items[tipo], { minime }))

  const viste = fuori.filter(r => !r.mai)
    .sort((a, b) => a.quota - b.quota || b.quante - a.quante || a.nome.localeCompare(b.nome))
  const mai = fuori.filter(r => r.mai)
    .sort((a, b) => a.da - b.da || a.nome.localeCompare(b.nome))
  return { viste, mai, tutte: viste.concat(mai) }
}

// tre numeri e non venti: danno la misura di quanto pesa il resto della pagina
export function riassuntoDi(elenco, { minime = MINIME } = {}) {
  const viste = elenco.viste || []
  const risposte = viste.reduce((n, r) => n + r.quante, 0)
  const male = viste.filter(r => !r.poche && r.quota <= 0.5).length
  const bene = viste.filter(r => !r.poche && r.quota >= 0.9).length
  return { incontrate: viste.length, mai: (elenco.mai || []).length, risposte, male, bene, minime }
}
