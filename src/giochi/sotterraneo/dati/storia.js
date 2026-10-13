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
  g.push(...guastiDellaStoriaPrincipale())
  return g
}

/* ═══════════ la missione principale ═══════════
   La grande storia è una missione sola, data dal minatore, in cima al diario (docs/sotterraneo/la-storia-principale.md):
   chiudere le sette porte, una discesa per volta. Il capitolo di adesso è la prima discesa non finita; battuto il suo
   mostro grosso arriva il seguente. `dice` lo dice lui mandandoti là (il perché, in una o due frasi), `fatto` quando
   la porta è chiusa. Lo stato non si salva: viene dalle discese finite. */
export const STORIA = {
  titolo: 'Chiudi le sette porte',
  // la prima volta che il minatore parla: la missione. La porta di adesso la dice la pagina dopo (motore/dialoghi.js, strada)
  affida: 'Sono sette porte. Io ti dico quale, e il diario ti ricorda la strada.',
  // finite le sette
  fine: 'Le sette porte sono chiuse. Resta il pozzo vecchio: l\'abisso non si chiude, si tiene a bada.',
  // la porta c'è ma per l'età per ora non si scende
  ferma: 'Questa porta, per ora, resta chiusa.',
}

export const CAPITOLI = {
  altare: {
    dice: 'Comincia dall\'altare. Nella cripta Re Ossuto non ha mai smesso di regnare: battilo, e la prima porta si chiude.',
    fatto: 'Re Ossuto è caduto, e la prima porta è chiusa.',
  },
  cantine: {
    dice: 'Adesso la scalinata antica. In fondo c\'è Grumo, un orco grosso come una porta. Battilo, e anche questa si chiude.',
    fatto: 'Grumo non regna più sulle cantine. Due porte chiuse.',
  },
  torre: {
    dice: 'Sotto la torre in rovina c\'è una fornace che nessuno ha acceso. Laggiù brucia Fiammetta: spegni lei, e la fornace tace.',
    fatto: 'La fornace è spenta. Tre porte chiuse, e le altre sono più profonde.',
  },
  gallerie: {
    dice: 'Nella grotta della scaletta si scende e si scende ancora. In fondo tesse la sua tela Zannaverde: strappala.',
    fatto: 'La tela è strappata. Quattro porte chiuse.',
  },
  cisterna: {
    dice: 'Nello stagno una scala va sott\'acqua. Giù, nell\'acqua nera, aspetta Gorgo. Quando cade lui, lo stagno torna limpido.',
    fatto: 'Lo stagno è tornato limpido. Cinque porte chiuse.',
  },
  labirinto: {
    dice: 'La botola nel prato porta a un labirinto. Ne è il padrone Minotto: trova la sua stanza, e battilo.',
    fatto: 'Il labirinto tace. Sei porte chiuse, ne resta una.',
  },
  fondo: {
    dice: 'L\'ultima è la miniera abbandonata. Laggiù comanda Carbonchio, un drago di brace. Se cade lui, le porte sono chiuse.',
    fatto: 'Carbonchio è caduto: le sette porte sono chiuse.',
  },
}

export function guastiDellaStoriaPrincipale() {
  const g = []
  for (const t of CAMPAGNA) {
    const c = CAPITOLI[t.chiave]
    if (!c) { g.push(`${t.chiave}: nessun capitolo nella storia principale`); continue }
    for (const k of ['dice', 'fatto']) {
      if (!c[k]) g.push(`${t.chiave}: il capitolo non ha «${k}»`)
      else if (c[k].length > 150) g.push(`${t.chiave}: «${k}» di ${c[k].length} caratteri, non sta in una pagina`)
    }
  }
  for (const k of Object.keys(CAPITOLI)) if (!CAMPAGNA.some(t => t.chiave === k)) g.push(`${k}: un capitolo per una discesa che non c'è`)
  return g
}
