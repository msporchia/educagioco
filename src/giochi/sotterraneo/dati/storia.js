// La grande storia: con che roba si entra in ogni discesa, eroe per eroe (docs/sotterraneo/la-grande-storia.md).
// `PASSI[eroe][k]` è quello che si ha addosso entrando nella discesa k di CAMPAGNA; l'ultima riga è quello con
// cui si esce dalla miniera, ed entra nell'abisso. Quello che manca fra una riga e la dopo lo danno la discesa
// (chi porta la chiave, i forzieri) e, se si è perso qualcosa, l'armaiolo e il rigattiere del villaggio. I mostri
// di ogni discesa sono tarati sulla riga con cui ci si entra (`forza`, `spinta` in dati/campagna.js), e le
// misure lo controllano (misure/sotterraneo). Una missione fatta dà un piccolo vantaggio, mai un passo intero.
import { COSE } from './cose.js'
import { EROI, portaLa } from './eroi.js'
import { CAMPAGNA } from './campagna.js'

const P = (mano = null, mancina = null, corpo = null, dito = null) => ({ mano, mancina, corpo, dito })

export const PASSI = {
  // lo scudo presto, poi lo spadone a due mani quando le ossa dei mostri chiedono braccio
  cavaliere: [
    P(),
    P('spada-corta'),
    P('spada-corta', 'scudo-legno', 'panciotto'),
    P('spada', 'scudo-legno', 'panciotto'),
    P('spada', 'scudo-borchiato', 'panciotto', 'amuleto-azzurro'),
    P('spada', 'scudo-ferro', 'corazza', 'amuleto-azzurro'),
    P('spadone', null, 'corazza', 'amuleto-osso'),
    P('spada-di-ghiaccio', 'scudo-teschio', 'corazza', 'amuleto-osso'),
  ],
  // picchia più del cavaliere e regge meno: la stoffa (il saio che tiene in piedi, poi il manto) e l'arco lungo
  elfa: [
    P(),
    P('spada-corta'),
    P('spada-corta', 'scudo-legno', 'saio'),
    P('spada', 'scudo-legno', 'saio'),
    P('spada', 'scudo-legno', 'saio', 'amuleto-azzurro'),
    P('spada', 'scudo-borchiato', 'manto', 'amuleto-azzurro'),
    P('arco-lungo', null, 'manto', 'amuleto-azzurro'),
    P('spadone', null, 'manto', 'amuleto-osso'),
  ],
  // il mago picchia già: gli serve pelle. Il bastone a due mani nella grotta, poi lo scettro a una mano e lo scudo (dalla
  // scala sommersa: col bastone e senza scudo, coi mostri di adesso, a 8/10 tornava su una volta su due)
  mago: [
    P(),
    P('verga'),
    P('verga', 'scudo-legno', 'saio'),
    P('bastone-magico', null, 'saio'),
    P('scettro', 'scudo-legno', 'saio', 'amuleto-azzurro'),
    P('scettro', 'scudo-legno', 'manto', 'amuleto-azzurro'),
    P('scettro', 'scudo-borchiato', 'manto', 'amuleto-rosso'),
    P('scettro', 'scudo-ferro', 'manto', 'amuleto-rosso'),
  ],
  // il nano para di suo: l'accetta e lo scudo, poi le asce a due mani
  nano: [
    P(),
    P('accetta'),
    P('accetta', 'scudo-legno', 'panciotto'),
    P('ascia', null, 'panciotto'),
    P('ascia', null, 'panciotto', 'amuleto-azzurro'),
    P('ascia', null, 'corazza', 'amuleto-azzurro'),
    P('bipenne', null, 'corazza', 'amuleto-azzurro'),
    P('bipenne', null, 'corazza', 'amuleto-osso'),
  ],
}

// le pozioni con cui si entra: quelle che le gemme della discesa di prima comprano dall'erborista, oltre ai pezzi
// mancati (misurato dal banco: allaBottega)
// (le gemme crescono col livello del posto, i prezzi col livello dell'eroe: dalla terza discesa si arriva con le tasche
// quasi piene, misurato con la storia giocata dal banco, docs/sotterraneo/livelli.md)
export const POZIONI_ATTESE = [
  [],
  ['pozione-piccola'],
  ['pozione', 'pozione-piccola', 'pozione-piccola'],
  ['pozione', 'pozione', 'pozione-piccola', 'pozione-piccola'],
  ['pozione', 'pozione', 'pozione', 'pozione-piccola', 'pozione-piccola'],
  ['pozione-grande', 'pozione', 'pozione', 'pozione', 'pozione-piccola'],
  ['pozione-grande', 'pozione-grande', 'pozione', 'pozione', 'pozione'],
  ['pozione-grande', 'pozione-grande', 'pozione-grande', 'pozione', 'pozione', 'pozione'],
]

// il livello con cui si entra nella discesa k (l'ultimo: nell'abisso), per chi va dritto alla scala rispondendo bene
// otto volte su dieci e rifacendo quella persa (misurato col banco: docs/sotterraneo/livelli.md, «Le misure»). I
// pezzi della riga sono di un livello sotto (motore/storia.js, livelloDeiPezzi)
export const LIVELLI_ATTESI = [1, 2, 3, 5, 7, 8, 10, 12]

export const CASELLE = ['mano', 'mancina', 'corpo', 'dito']

// la riga con cui si entra nella discesa `k` (fuori misura: la prima o l'ultima)
export const passoDi = (eroe, k) => {
  const fila = PASSI[eroe] || PASSI.cavaliere
  return fila[Math.max(0, Math.min(k, fila.length - 1))]
}

// quello che la discesa `k` deve dare: le cose della riga dopo che nella sua non ci sono, nell'ordine delle
// caselle (l'arma prima: è la cosa che si sente di più)
export function premiDella(eroe, k) {
  const ora = passoDi(eroe, k), dopo = passoDi(eroe, k + 1)
  const ce = new Set(CASELLE.map(c => ora[c]).filter(Boolean))
  return CASELLE.map(c => dopo[c]).filter(x => x && !ce.has(x))
}

const forzaDi = (eroe, riga) => {
  const e = EROI.find(x => x.chiave === eroe)
  let att = e.att, dif = e.dif
  for (const c of CASELLE) {
    const k = riga[c]
    if (!k) continue
    att += c === 'mancina' ? Math.ceil((COSE[k].att || 0) / 2) : (COSE[k].att || 0)
    dif += COSE[k].dif || 0
  }
  return { att, dif }
}
export const numeriDel = (eroe, k) => forzaDi(eroe, passoDi(eroe, k))

export function guastiDellaStoria() {
  const g = []
  for (const e of EROI) {
    const fila = PASSI[e.chiave]
    if (!fila) { g.push(`${e.chiave}: nessuna fila nella storia`); continue }
    if (fila.length !== CAMPAGNA.length + 1)
      g.push(`${e.chiave}: ${fila.length} righe, ne servono ${CAMPAGNA.length + 1} (una per discesa, più l'uscita)`)
    if (CASELLE.some(c => fila[0][c])) g.push(`${e.chiave}: la prima discesa si comincia a mani nude`)
    fila.forEach((riga, k) => {
      for (const c of CASELLE) {
        const x = riga[c]
        if (!x) continue
        if (!COSE[x]) { g.push(`${e.chiave}, riga ${k}: "${x}" non esiste`); continue }
        const dove = COSE[x].dove
        if (dove !== c && !(c === 'mancina' && dove === 'mano')) g.push(`${e.chiave}, riga ${k}: ${x} non va su ${c}`)
        if (!portaLa(e, COSE[x])) g.push(`${e.chiave}, riga ${k}: ${x}, e non lo porta`)
        if (!COSE[x].prezzo) g.push(`${e.chiave}, riga ${k}: ${x} non ha un prezzo, e il banco non lo potrebbe dare`)
      }
      if (riga.mancina && COSE[riga.mano] && COSE[riga.mano].mani === 2)
        g.push(`${e.chiave}, riga ${k}: un'arma a due mani e qualcosa nell'altra`)
      if (k === 0) return
      // ogni discesa dà qualcosa, e la roba non torna indietro: braccio più difesa non cala mai
      if (!premiDella(e.chiave, k - 1).length) g.push(`${e.chiave}: la discesa ${k - 1} non dà niente di nuovo`)
      const a = forzaDi(e.chiave, fila[k - 1]), b = forzaDi(e.chiave, riga)
      if (b.att + b.dif < a.att + a.dif) g.push(`${e.chiave}, riga ${k}: braccio e difesa calano`)
    })
  }
  if (POZIONI_ATTESE.length !== CAMPAGNA.length + 1) g.push('le pozioni attese non hanno una riga per discesa')
  if (LIVELLI_ATTESI.length !== CAMPAGNA.length + 1) g.push('i livelli attesi non hanno una riga per discesa')
  for (let i = 1; i < LIVELLI_ATTESI.length; i++)
    if (LIVELLI_ATTESI[i] < LIVELLI_ATTESI[i - 1]) g.push(`il livello atteso cala alla discesa ${i}`)
  if (LIVELLI_ATTESI[0] !== 1) g.push('la prima discesa si comincia al livello 1')
  for (const r of POZIONI_ATTESE) for (const k of r) if (!COSE[k] || COSE[k].usa !== 'cura') g.push(`"${k}" non è una pozione`)
  return g
}
