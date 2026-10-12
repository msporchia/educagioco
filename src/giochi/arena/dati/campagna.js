// La campagna: dodici tappe in quattro scalini. Una tappa è la stessa partita
// con altri numeri: quali truppe si possono costruire (ogni truppa porta la
// sua operazione, quindi sono loro a dire quale calcolo si fa), quanto è
// forte il nemico e che terreno c'è. Le operazioni arrivano una famiglia
// alla volta: + e − nel bosco, poi × nella palude, poi ÷ sulla neve, e la
// lava le mette tutte insieme. Vedi docs/arena/campagna.md.
import { TRUPPE, BASE } from './regole.js'
import { NEMICO } from './taratura.js'

export const SCALINI = [
  { chiave: 'bosco',  nome: 'Il bosco',     icona: '🌲', vestito: 'bosco',  dritta: 'Poche truppe e un nemico che impara adesso.' },
  { chiave: 'palude', nome: 'La palude',    icona: '🐸', vestito: 'palude', dritta: 'Arrivano i lupi e i golem: si calcola con le tabelline.' },
  { chiave: 'neve',   nome: 'Le nevi',      icona: '❄️', vestito: 'neve',   dritta: 'Il diavoletto e il drago: qui si divide.' },
  { chiave: 'lava',   nome: 'La lava',      icona: '🌋', vestito: 'lava',   dritta: 'Tutte le truppe, e un nemico che non ti aspetta.' },
]

const SOLE_ADD = ['scheletri', 'guardiano']
const CON_MENO = [...SOLE_ADD, 'pipistrelli']
const MENO2 = [...CON_MENO, 'negromante']
const CON_PER = [...MENO2, 'lupi']
const PER2 = [...CON_PER, 'golem']
const CON_DIV = [...PER2, 'diavoletto']
const TUTTE = [...CON_DIV, 'drago']

/* `truppe`: quali caserme si possono costruire (la base c'è sempre).
   `nemico`: la scheda del nemico — quante monete fa al secondo, ogni quanto
   pensa e quanto sono forti le sue truppe (1 = come le tue). La scrive la
   taratura (`dati/taratura.js`, `npm run tara:arena`): non si ritocca a mano.
   `portata` (0-100, docs/apprendimento/eta-e-portata.md) è quanto è avanti
   chi la gioca: una tappa sopra la mira dell'età resta chiusa. */
export const CAMPAGNA = [
  { chiave: 'scaramuccia', nome: 'La prima scaramuccia', scalino: 'bosco', portata: 12,
    truppe: SOLE_ADD, nemico: NEMICO.scaramuccia,
    racconto: 'Gli scheletri arcieri sono già tuoi. Costruisci il guardiano e tieni duro.' },
  { chiave: 'ponte', nome: 'Il ponte di pietra', scalino: 'bosco', portata: 16,
    truppe: CON_MENO, nemico: NEMICO.ponte,
    racconto: 'I pipistrelli volano sopra i muri. Gli scheletri li fermano.' },
  { chiave: 'radura', nome: 'La radura', scalino: 'bosco', portata: 20,
    truppe: MENO2, nemico: NEMICO.radura,
    racconto: 'Il negromante colpisce a gruppi: ottimo contro le file.' },

  { chiave: 'melma', nome: 'Gli stagni', scalino: 'palude', portata: 30,
    truppe: CON_PER, nemico: NEMICO.melma,
    racconto: 'I lupi sono due, e velocissimi. Ma non colpiscono chi vola.' },
  { chiave: 'guado', nome: 'Il guado', scalino: 'palude', portata: 34,
    truppe: PER2, nemico: NEMICO.guado,
    racconto: 'Il golem va dritto alle costruzioni e non si ferma per le truppe.' },
  { chiave: 'canneto', nome: 'Il canneto', scalino: 'palude', portata: 38,
    truppe: PER2, nemico: NEMICO.canneto,
    racconto: 'Il nemico adesso fa muri e curare: non basta più correre.' },

  { chiave: 'valico', nome: 'Il valico', scalino: 'neve', portata: 45,
    truppe: CON_DIV, nemico: NEMICO.valico,
    racconto: 'Il diavoletto lancia bombe a terra: contro i gruppi fa miracoli.' },
  { chiave: 'ghiaccio', nome: 'Il lago ghiacciato', scalino: 'neve', portata: 50,
    truppe: TUTTE, nemico: NEMICO.ghiaccio,
    racconto: 'Il drago vola e sputa fuoco ad area. Costa caro, ma pesa.' },
  { chiave: 'tormenta', nome: 'La tormenta', scalino: 'neve', portata: 55,
    truppe: TUTTE, nemico: NEMICO.tormenta,
    racconto: 'Il nemico non si ferma: ripara, rialza i muri, sale di livello.' },

  { chiave: 'cratere', nome: 'Il cratere', scalino: 'lava', portata: 60,
    truppe: TUTTE, nemico: NEMICO.cratere,
    racconto: 'Qui ogni moneta conta: spendila dove serve davvero.' },
  { chiave: 'fucina', nome: 'La fucina', scalino: 'lava', portata: 65,
    truppe: TUTTE, nemico: NEMICO.fucina,
    racconto: 'La miniera conviene presto, ma lascia la base scoperta.' },
  { chiave: 'trono', nome: 'Il trono di fuoco', scalino: 'lava', portata: 70,
    truppe: TUTTE, nemico: NEMICO.trono,
    racconto: 'L\'ultima battaglia: tutto quello che hai imparato, e un po\' di fortuna.' },
]

export const QUANTE_TAPPE = CAMPAGNA.length
export const tappa = indice => CAMPAGNA[Math.max(0, Math.min(indice, CAMPAGNA.length - 1))]
export const tappeDelloScalino = chiave =>
  CAMPAGNA.map((t, i) => ({ ...t, indice: i })).filter(t => t.scalino === chiave)
export const scalinoDi = t => SCALINI.find(s => s.chiave === t.scalino)

/* quello che il motore legge di una tappa */
export const sfidaDi = t => ({ nemico: t.nemico, truppe: t.truppe })

/* quali operazioni si incontrano in una tappa: quelle delle truppe che
   si possono costruire */
export const operazioniDi = t => [...new Set(['+', ...t.truppe.map(id => TRUPPE[id].op)])]

/* Quando un'azione (miniera, torretta…) vuole un'operazione che la tappa non
   ha ancora insegnato, si ripiega su quella più vicina: ÷ → × → − → + (la
   stessa scelta del castello, docs/castello/operazioni.md). */
const RIPIEGO = { '÷': '×', '×': '−', '−': '+' }
export function operazionePer(op, ammesse) {
  let o = op
  while (!ammesse.includes(o) && RIPIEGO[o]) o = RIPIEGO[o]
  return ammesse.includes(o) ? o : '+'
}

/* Le stelle: una per aver vinto, una per aver tenuto in piedi la torretta,
   una per aver finito con la base quasi intatta. */
export function stellePer({ vinto, torrettaViva, vitaBase }) {
  if (!vinto) return 0
  return 1 + (torrettaViva ? 1 : 0) + (vitaBase >= 0.7 ? 1 : 0)
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
    if (!(t.truppe || []).includes(BASE)) g.push(`${dove}: manca la truppa di partenza`)
    const n = t.nemico || {}
    if (!(n.moneteAlSecondo > 0 && n.pensa > 0 && n.forza > 0)) g.push(`${dove}: la scheda del nemico non sta in piedi`)
    if (!(t.portata >= 0 && t.portata <= 100)) g.push(`${dove}: portata ${t.portata}`)
    if (i > 0) {
      const p = campagna[i - 1]
      if (t.portata < p.portata) g.push(`${dove}: la portata scende rispetto alla tappa prima`)
      if (t.truppe.length < p.truppe.length) g.push(`${dove}: le truppe si sono ristrette`)
    }
  })
  const ordine = SCALINI.map(s => s.chiave)
  const fila = campagna.map(t => ordine.indexOf(t.scalino))
  if (fila.some((x, i) => i > 0 && x < fila[i - 1])) g.push('gli scalini non sono in fila')
  for (const s of SCALINI) if (!campagna.some(t => t.scalino === s.chiave)) g.push(`lo scalino "${s.chiave}" non ha tappe`)
  if (campagna[0] && operazioniDi(campagna[0]).some(o => o !== '+')) g.push('la prima tappa comincia già con altre operazioni oltre la somma')
  return g
}
