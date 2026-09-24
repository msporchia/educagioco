/* ═══════════════════════════════════════════════════════════════════
   COM'È IN PYTHON — il programma del bambino, scritto come lo scrive
   chi programma

   Non si scrive mai: si legge. Serve a una cosa sola, ed è la ragione
   per cui c'è — a dieci anni vedere `colonna(h)` e `h = h + 1` dice
   «quello che sto facendo è programmare davvero», e il giorno che
   arriverà un linguaggio vero la metà delle parole sarà già vista.

   La traduzione è fedele, non abbellita: un progetto è una `def` con le
   sue misure come parametri, una lavagnetta è una variabile, «ripeti ·
   smetti quando» è un `while not`. Le lavagnette del bambino dentro un
   progetto sono `global`, perché nell'esecutore lo sono davvero.
   ═══════════════════════════════════════════════════════════════════ */
import { dentro } from '../dati/scrivi.js'

const nome = s => String(s || '_').replace(/-/g, '_')

export function numeroPy(e) {
  if (!e || e.vuoto) return 'N'
  if (typeof e === 'string') return `"${e}"`
  if (typeof e.n === 'number') return String(e.n)
  if (typeof e.v === 'string') return nome(e.v)
  if (e.leggi) return `leggi("${e.leggi}")`
  if (e.op) return `${numeroPy(e.a)} ${e.op === '×' ? '*' : e.op} ${numeroPy(e.b)}`
  return '0'
}

/* il porto guarda di fianco e in mano: `c_e("su", "cassa", "rosso")`,
   una funzione sola invece di una per casella, perché le cose da
   guardare sono tante e le frecce quattro */
const DOVE_PORTO = new Set(['su', 'giu', 'mano'])
const colorePy = c => (typeof c === 'string' ? `"${c}"` : numeroPy(c))

const DOVE = { sotto: 'sotto_i_piedi', 'giu-destra': 'in_basso_a_destra', 'giu-sinistra': 'in_basso_a_sinistra',
               destra: 'a_destra', sinistra: 'a_sinistra', sopra: 'sopra_la_testa' }
const POSTO = { sotto: 'sotto', 'giu-destra': 'in_basso_a_destra', 'giu-sinistra': 'in_basso_a_sinistra' }

export function condizionePy(c) {
  if (!c) return '???'
  if (c.tipo === 'confronta') return `${numeroPy(c.a)} ${c.cmp === '=' ? '==' : c.cmp} ${numeroPy(c.b)}`
  let s
  if (DOVE_PORTO.has(c.dove) || !DOVE[c.dove] || ['cassa', 'cassone', 'cliente', 'niente', 'libero', 'bancone',
                                                    'scaffale', 'nastro', 'biglietto', 'muro', 'mare'].includes(c.cosa))
    s = `c_e("${c.dove}", "${c.cosa}"${c.colore ? `, ${colorePy(c.colore)}` : ''})`
  else s = `${DOVE[c.dove] || c.dove}() == "${c.cosa === 'mattone' && c.colore ? `mattone ${c.colore}` : c.cosa}"`
  return c.c === false ? `not ${s}` : s
}

function righe(corpo, prog, rientro, fuori) {
  const r = ' '.repeat(rientro)
  if (!corpo || !corpo.length) return [`${r}pass`]
  const out = []
  for (const i of corpo) {
    switch (i.tipo) {
      case 'vai': out.push(`${r}${i.verso === 'su' || i.verso === 'giu' ? `vai_${i.verso}` : `vai_a_${i.verso || '???'}`}(${numeroPy(i.quanto)})`); break
      case 'prendi': out.push(`${r}prendi("${i.lato || '???'}")`); break
      case 'posa': out.push(`${r}posa("${i.lato || '???'}")`); break
      case 'sempre':
        out.push(`${r}while True:`, ...righe(i.corpo, prog, rientro + 4, fuori))
        break
      /* «aspetta che»: un giro che non fa niente, e il mondo va avanti */
      case 'aspetta':
        out.push(`${r}while not (${condizionePy(i.cond)}):`, `${r}    aspetta()`)
        break
      case 'metti': {
        const c = typeof i.colore === 'string' ? `"${i.colore}"` : i.colore && i.colore.v ? nome(i.colore.v) : '???'
        out.push(`${r}metti_${POSTO[i.dove || 'sotto']}(${c})`)
        break
      }
      case 'ripeti':
        out.push(`${r}for _ in range(${numeroPy(i.volte)}):`, ...righe(i.corpo, prog, rientro + 4, fuori))
        break
      case 'finche':
        out.push(`${r}while not (${condizionePy(i.cond)}):`, ...righe(i.corpo, prog, rientro + 4, fuori))
        break
      case 'se':
        out.push(`${r}if ${condizionePy(i.cond)}:`, ...righe(i.allora, prog, rientro + 4, fuori))
        if (i.altrimenti) out.push(`${r}else:`, ...righe(i.altrimenti, prog, rientro + 4, fuori))
        break
      case 'assegna': out.push(`${r}${nome(i.nome)} = ${numeroPy(i.valore)}`); break
      case 'chiama': {
        const p = (prog.progetti || []).find(q => q.id === i.progetto)
        out.push(`${r}${nome(p ? p.nome : 'progetto')}(${(i.argomenti || []).map(numeroPy).join(', ')})`)
        break
      }
    }
  }
  return out
}

export function inPython(prog, lavagnetteOrdine = {}) {
  const out = []
  const ordine = Object.entries(lavagnetteOrdine)
  if (ordine.length) {
    out.push('# i numeri dell\'ordine')
    for (const [n, v] of ordine) out.push(`${nome(n)} = ${typeof v === 'string' ? `"${v}"` : v}`)
    out.push('')
  }
  for (const p of prog.progetti || []) {
    out.push(`def ${nome(p.nome)}(${(p.misure || []).map(nome).join(', ')}):`)
    /* le lavagnette che il progetto scrive, dichiarate `global`: senza,
       in Python sarebbero variabili nuove e il programma farebbe
       un'altra cosa da quella che il robot fa */
    const scritte = [...new Set([...dentro(p.corpo)].filter(i => i.tipo === 'assegna' && i.nome).map(i => nome(i.nome)))]
    if (scritte.length) out.push(`    global ${scritte.join(', ')}`)
    out.push(...righe(p.corpo, prog, 4, true), '')
  }
  out.push('# il programma principale')
  if ((prog.lavagnette || []).length) out.push('# (le lavagnette partono da 0)')
  for (const l of prog.lavagnette || []) out.push(`${nome(l)} = 0`)
  out.push(...righe(prog.principale, prog, 0, false))
  return out.join('\n')
}
