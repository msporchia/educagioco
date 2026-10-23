/* ═══════════════════════════════════════════════════════════════════
   IL BUDGET 3D DEL SOTTERRANEO — poc/appiattimento-3d/budget.js

   Ogni modello delle discese (i mostri 3D saldati come nel gioco, le
   persone, l'arredo, i relitti, le botti) si pesa come lo disegnerebbe
   three: chiamate, triangoli, luci dentro il modello, materiali fisici,
   additivi, ricette di shader. Un modello nuovo deve stare nel budget
   della sua famiglia (docs/sotterraneo/appiattimento-3d.md, «Le regole»).
   Chi c'era prima del budget sta in ECCEZIONI col peso di oggi: può
   solo scendere (un numero più alto è rosso, uno più basso si scrive).
   In Node non c'è un canvas: le trame sono vuote, la forma c'è tutta.
   ═══════════════════════════════════════════════════════════════════ */
import { VOCI } from '../../strumenti/banco/catalogo-3d/sotterraneo.js'
import { studia, saldaTutto } from '../../src/giochi/sotterraneo/scena3d/salda3d.js'
import { pesa, BUDGET, fuori } from '../../poc/appiattimento-3d/budget.js'
import { controlla, nota, riassunto } from '../aiuto/verifica.mjs'

// la famiglia di ogni voce delle discese; il mondo di sopra (case, ponti, natura) ha un altro conto (docs/sotterraneo/limiti-3d.md)
const famiglia = v => (/^sot:(mostri|persona):/.test(v.id) ? 'personaggio' : /^sot:discese:/.test(v.id) ? 'cosa' : null)

// i modelli di prima del budget, col peso di oggi (solo le voci oltre): si abbassano, non si alzano. Dal 23/10 la pelle
// (scena3d/salda3d.js) ha portato sotto il tetto gli altri 43, i draghi da 140 a 56 (docs/sotterraneo/prestazioni-3d.md, «Meno chiamate»)
const ECCEZIONI = {
  'sot:mostri:ceneri-golem-magma': { chiamate: 44 },
  'sot:mostri:ceneri-spirito-azzurro': { chiamate: 64 },
  'sot:mostri:ceneri-spirito-fuoco': { chiamate: 64 },
  'sot:mostri:mostri-melma': { fisici: 13 },
  'sot:mostri:prati-melma-rosa': { fisici: 13 },
  'sot:mostri:proprio-melma-viola': { fisici: 13 },
}

const righe = []
for (const v of VOCI) {
  const fam = famiglia(v)
  if (!fam) continue
  let o = null
  try { o = v.crea() } catch (e) { controlla(`${v.id}: si costruisce`, false, e.message); continue }
  // i mostri si saldano come in scena3d/mostro3d.js: le mesh ferme in una per materiale, il resto nella pelle
  if (/^sot:mostri:/.test(v.id)) { try { saldaTutto(o, studia(o)) } catch (e) { /* resta com'è: il gioco fa lo stesso */ } }
  const p = pesa(o), oltre = fuori(p, BUDGET[fam])
  righe.push([v.id, p])
  if (!oltre.length) { controlla(`${v.id}: nel budget`, true); continue }
  const e = ECCEZIONI[v.id]
  if (!e) { controlla(`${v.id}: nel budget di «${fam}»`, false, oltre.map(([k, a, b]) => `${k} ${a} (tetto ${b})`).join(', ')); continue }
  for (const [k, a] of oltre) controlla(`${v.id}: ${k} non sale (eccezione ${e[k] ?? '—'})`, e[k] != null && a <= e[k], `${a} contro ${e[k]}`)
}
const max = k => righe.reduce((m, [, p]) => Math.max(m, p[k]), 0)
nota(`${righe.length} modelli pesati; i più cari: chiamate ${max('chiamate')}, triangoli ${max('triangoli')}, shader ${max('shader')}`)
if (process.argv.includes('--elenco')) for (const [id, p] of righe) console.log(`${id}\t${p.chiamate} ch\t${p.triangoli} tri\t${p.luci} luci\t${p.fisici} fis\t${p.additivi} add\t${p.shader} sh\t${p.pelle} pelle`)
riassunto('il budget 3d del sotterraneo')
