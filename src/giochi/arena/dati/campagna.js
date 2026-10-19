// La campagna: dodici tappe in quattro scalini. Una tappa è la stessa partita
// con altri numeri: quali truppe si possono costruire (ogni truppa porta la
// sua operazione, quindi sono loro a dire quale calcolo si fa), quanto è
// forte il nemico e che terreno c'è. Le operazioni arrivano una famiglia
// alla volta: + e − nel bosco, poi × nella palude, poi ÷ sulla neve, e la
// lava le mette tutte insieme. Vedi docs/arena/campagna.md.
import { TRUPPE, EDIFICI, OPERAZIONI, TERRENI, truppeDelTerreno } from './regole.js'
import { NEMICO, NEMICO_PER_LIVELLO } from './taratura.js'

/* I livelli di difficoltà: ognuno ha la sua scheda del nemico per ogni tappa (`dati/taratura.js`), con le stesse truppe.
   Lo sceglie il bambino (o un grande) e sta in `profile.campagne.arena.livello`. Vedi docs/arena/taratura.md. */
export const LIVELLI = [
  { chiave: 'facile', nome: 'Facile', icona: '🌱' },
  { chiave: 'medio', nome: 'Medio', icona: '⚔️' },
  { chiave: 'difficile', nome: 'Difficile', icona: '🔥' },
]
export const LIVELLO_DI_SEMPRE = 'medio'
export const livelloValido = l => (LIVELLI.some(x => x.chiave === l) ? l : LIVELLO_DI_SEMPRE)

export const SCALINI = [
  { chiave: 'bosco',  nome: 'Il bosco',     icona: '🌲', vestito: 'bosco',  dritta: 'Poche truppe e un nemico che impara adesso.' },
  { chiave: 'palude', nome: 'La palude',    icona: '🐸', vestito: 'palude', dritta: 'Qui ci sono le mummie, e niente più pipistrelli: si calcola con le tabelline.' },
  { chiave: 'neve',   nome: 'Le nevi',      icona: '❄️', vestito: 'neve',   dritta: 'Le bestie cornute e il golem, poi il drago: qui si divide.' },
  { chiave: 'lava',   nome: 'La lava',      icona: '🌋', vestito: 'lava',   dritta: 'I diavoletti, e un nemico che non ti aspetta.' },
]

/* Le truppe di una tappa sono quelle del TERRENO del suo scalino (`truppeDelTerreno`, le stesse della battaglia
   infinita), tolte quelle la cui operazione non è ancora stata insegnata: così a ogni scalino cambia
   davvero cosa si costruisce, e non solo si aggiunge. Il drago (÷) arriva con le nevi, i diavoletti con la lava. */
const SOLE_ADD = ['scheletri', 'guardiano']
const CON_MENO = [...SOLE_ADD, 'pipistrelli']
const MENO2 = [...CON_MENO, 'negromante']
const PALUDE = [...SOLE_ADD, 'lupi']
const PALUDE2 = [...PALUDE, 'negromante']
const NEVE = [...SOLE_ADD, 'negromante', 'bestie']
const NEVE2 = [...NEVE, 'golem', 'drago']
const LAVA = [...SOLE_ADD, 'negromante', 'bestie', 'diavoletto', 'drago']

/* `truppe`: quali truppe si possono scegliere costruendo gli edifici (la cripta c'è sempre).
   `nemico`: la scheda del nemico — quante monete fa al secondo, ogni quanto
   pensa e quanto sono forti le sue truppe (1 = come le tue). La scrive la
   taratura (`dati/taratura.js`, `npm run tara:arena`): non si ritocca a mano.
   `portata` (0-100, docs/apprendimento/eta-e-portata.md) è quanto è avanti
   chi la gioca (solo per decidere da dove si comincia: non chiude niente). */
export const CAMPAGNA = [
  { chiave: 'scaramuccia', nome: 'La prima scaramuccia', scalino: 'bosco', portata: 12,
    truppe: SOLE_ADD, nemico: NEMICO.scaramuccia,
    racconto: 'Costruisci la cripta: arcieri od opliti? Poi tieni duro.' },
  { chiave: 'ponte', nome: 'Il ponte di pietra', scalino: 'bosco', portata: 16,
    truppe: CON_MENO, nemico: NEMICO.ponte,
    racconto: 'I pipistrelli volano sopra i muri. Gli scheletri li fermano.' },
  { chiave: 'radura', nome: 'La radura', scalino: 'bosco', portata: 20,
    truppe: MENO2, nemico: NEMICO.radura,
    racconto: 'Il negromante colpisce a gruppi: ottimo contro le file.' },

  { chiave: 'melma', nome: 'Gli stagni', scalino: 'palude', portata: 30,
    truppe: PALUDE, nemico: NEMICO.melma,
    racconto: 'Le mummie sono quattro, e svelte. Ma non colpiscono chi vola, e qui i pipistrelli non ci sono.' },
  { chiave: 'guado', nome: 'Il guado', scalino: 'palude', portata: 34,
    truppe: PALUDE2, nemico: NEMICO.guado,
    racconto: 'Gli arcieri e i maghi tengono a bada le mummie, ma da vicino sono loro a perdere.' },
  { chiave: 'canneto', nome: 'Il canneto', scalino: 'palude', portata: 38,
    truppe: PALUDE2, nemico: NEMICO.canneto,
    racconto: 'Il nemico adesso ripara e rialza il muro: non basta più correre.' },

  { chiave: 'valico', nome: 'Il valico', scalino: 'neve', portata: 45,
    truppe: NEVE, nemico: NEMICO.valico,
    racconto: 'Le bestie cornute corrono a testa bassa: reggono, e colpiscono da vicino.' },
  { chiave: 'ghiaccio', nome: 'Il lago ghiacciato', scalino: 'neve', portata: 50,
    truppe: NEVE2, nemico: NEMICO.ghiaccio,
    racconto: 'Il drago vola e sputa fuoco ad area; il golem va dritto alle costruzioni. Costano caro, ma pesano.' },
  { chiave: 'tormenta', nome: 'La tormenta', scalino: 'neve', portata: 55,
    truppe: NEVE2, nemico: NEMICO.tormenta,
    racconto: 'Il nemico non si ferma: ripara, rialza i muri, sale di livello.' },

  { chiave: 'cratere', nome: 'Il cratere', scalino: 'lava', portata: 60,
    truppe: LAVA, nemico: NEMICO.cratere,
    racconto: 'Il diavoletto lancia bombe a terra: contro i gruppi fa miracoli. Qui ogni moneta conta.' },
  { chiave: 'fucina', nome: 'La fucina', scalino: 'lava', portata: 65,
    truppe: LAVA, nemico: NEMICO.fucina,
    racconto: 'La miniera conviene presto, ma lascia la base scoperta.' },
  { chiave: 'trono', nome: 'Il trono di fuoco', scalino: 'lava', portata: 70,
    truppe: LAVA, nemico: NEMICO.trono,
    racconto: 'L\'ultima battaglia: tutto quello che hai imparato, e un po\' di fortuna.' },
]

export const QUANTE_TAPPE = CAMPAGNA.length
export const tappa = indice => CAMPAGNA[Math.max(0, Math.min(indice, CAMPAGNA.length - 1))]
export const tappeDelloScalino = chiave =>
  CAMPAGNA.map((t, i) => ({ ...t, indice: i })).filter(t => t.scalino === chiave)
export const scalinoDi = t => SCALINI.find(s => s.chiave === t.scalino)

/* La battaglia infinita, in cima alla mappa oltre le dodici tappe: senza timer, col nemico alla
   difficoltà massima (la scheda dell'ultima tappa, niente scale), e un terreno diverso a ogni
   volta con la sua truppa firma (`truppeDelTerreno`). Finisce quando cade un castello; niente record
   (non ha senso: l'utente). `portata` è quella dell'ultima tappa: si apre con la stessa regola (docs/arena/campagna.md). */
export const INFINITA = {
  chiave: 'infinita', nome: 'La battaglia infinita', icona: '♾️', portata: CAMPAGNA[CAMPAGNA.length - 1].portata,
  nemico: NEMICO.trono,
  racconto: 'Senza timer, nemico al massimo, terreno sempre nuovo.',
  operazioni: OPERAZIONI,
}
export const sfidaInfinita = (terreno, livello = LIVELLO_DI_SEMPRE) => ({ nemico: NEMICO_PER_LIVELLO[livello].trono, truppe: truppeDelTerreno(terreno), durata: Infinity })
export const scalinoDelTerreno = terreno => SCALINI.find(s => s.vestito === terreno)

/* un terreno diverso dall'ultimo (che sta nel profilo): mai due volte lo stesso di fila */
export function terrenoDiverso(ultimo, rnd = Math.random) {
  const altri = TERRENI.filter(t => t !== ultimo)
  return altri[Math.floor(rnd() * altri.length)]
}

/* quello che il motore legge di una tappa */
export const sfidaDi = (t, livello = LIVELLO_DI_SEMPRE) => ({ nemico: NEMICO_PER_LIVELLO[livello][t.chiave], truppe: t.truppe })

/* quali operazioni si incontrano in una tappa: quelle delle truppe che
   si possono costruire */
export const operazioniDi = t => [...new Set(['+', ...t.truppe.map(id => TRUPPE[id].op)])]

/* Quando un'azione (miniera, castello…) vuole un'operazione che la tappa non
   ha ancora insegnato, si ripiega su quella più vicina: ÷ → × → − → + (la
   stessa scelta del castello, docs/castello/operazioni.md). */
const RIPIEGO = { '÷': '×', '×': '−', '−': '+' }
export function operazionePer(op, ammesse) {
  let o = op
  while (!ammesse.includes(o) && RIPIEGO[o]) o = RIPIEGO[o]
  return ammesse.includes(o) ? o : '+'
}

/* Le operazioni che un genitore ha spento (i saperi «divisioni» e «moltiplicazioni», `contiPermessi()`)
   escono da quelle ammesse: la scelta ripiega su un'altra, e `PESO_DEL_RIPIEGO` la rende più difficile
   (docs/arena/calcoli.md): chi non sa dividere fa conti più grossi, non meno. */
export const senzaSaperi = (ammesse, { div = true, mul = true } = {}) =>
  ammesse.filter(o => (o !== '÷' || div) && (o !== '×' || mul))
export const PESO_DEL_RIPIEGO = 2

/* Le stelle: una per aver vinto, una per aver finito col castello oltre la
   metà, una per averlo tenuto quasi intatto. */
export function stellePer({ vinto, vitaBase }) {
  if (!vinto) return 0
  return 1 + (vitaBase >= 0.5 ? 1 : 0) + (vitaBase >= 0.85 ? 1 : 0)
}

export function guastiDellaCampagna(campagna = CAMPAGNA) {
  const g = []
  const viste = new Set()
  campagna.forEach((t, i) => {
    const dove = `tappa ${i + 1} ("${t.chiave}")`
    if (viste.has(t.chiave)) g.push(`${dove}: chiave ripetuta`)
    viste.add(t.chiave)
    if (!t.nome || !t.racconto) g.push(`${dove}: senza nome o senza racconto`)
    if (!SCALINI.some(s => s.chiave === t.scalino)) g.push(`${dove}: scalino "${t.scalino}" sconosciuto`)
    if (!Array.isArray(t.truppe) || !t.truppe.length) g.push(`${dove}: nessuna truppa`)
    for (const id of t.truppe || []) if (!TRUPPE[id]) g.push(`${dove}: la truppa "${id}" non esiste`)
    if (!EDIFICI.cripta.varianti.some(id => (t.truppe || []).includes(id))) g.push(`${dove}: manca la cripta, la prima caserma`)
    const vestito = (SCALINI.find(x => x.chiave === t.scalino) || {}).vestito
    for (const id of t.truppe || []) if (vestito && !truppeDelTerreno(vestito).includes(id)) g.push(`${dove}: "${id}" non è una truppa del terreno ${vestito}`)
    const n = t.nemico || {}
    for (const l of LIVELLI) { const x = (NEMICO_PER_LIVELLO[l.chiave] || {})[t.chiave]; if (!(x && x.moneteAlSecondo > 0 && x.pensa > 0 && x.forza > 0)) g.push(`${dove}: la scheda del nemico ${l.chiave} non sta in piedi`) }
    if (!(n.moneteAlSecondo > 0 && n.pensa > 0 && n.forza > 0)) g.push(`${dove}: la scheda del nemico non sta in piedi`)
    if (!(t.portata >= 0 && t.portata <= 100)) g.push(`${dove}: portata ${t.portata}`)
    if (i > 0) {
      const p = campagna[i - 1]
      if (t.portata < p.portata) g.push(`${dove}: la portata scende rispetto alla tappa prima`)
      if (t.scalino === p.scalino && t.truppe.length < p.truppe.length) g.push(`${dove}: le truppe si sono ristrette nello stesso scalino`)
    }
  })
  const ordine = SCALINI.map(s => s.chiave)
  const fila = campagna.map(t => ordine.indexOf(t.scalino))
  if (fila.some((x, i) => i > 0 && x < fila[i - 1])) g.push('gli scalini non sono in fila')
  for (const s of SCALINI) if (!campagna.some(t => t.scalino === s.chiave)) g.push(`lo scalino "${s.chiave}" non ha tappe`)
  if (campagna === CAMPAGNA) {
    if (TERRENI.join() !== SCALINI.map(s => s.vestito).join()) g.push('i terreni della battaglia infinita non sono quelli degli scalini')
    if (!(INFINITA.nemico && INFINITA.nemico.moneteAlSecondo > 0 && INFINITA.nemico.pensa > 0 && INFINITA.nemico.forza > 0)) g.push('la battaglia infinita: la scheda del nemico non sta in piedi')
    if (INFINITA.portata !== CAMPAGNA[CAMPAGNA.length - 1].portata) g.push('la battaglia infinita non ha la portata dell\'ultima tappa')
    for (const terreno of TERRENI) {
      const ammesse = truppeDelTerreno(terreno)
      if (!EDIFICI.cripta.varianti.some(id => ammesse.includes(id))) g.push(`${terreno}: manca la cripta`)
    }
  }
  if (campagna[0] && operazioniDi(campagna[0]).some(o => o !== '+')) g.push('la prima tappa comincia già con altre operazioni oltre la somma')
  return g
}
