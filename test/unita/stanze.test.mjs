/* ═══════════════════════════════════════════════════════════════════
   LA MAPPA PIENA E CHI LA ARREDA

   Sono due funzioni pure — griglia dentro, fatti fuori — ed è tutto il
   motivo per cui esistono staccate: quello che prima si poteva solo
   guardare dipinto («la botte è finita sopra un muro»), qui si chiede.

   Si prova su mappe scritte apposta, piccole e leggibili, perché una
   regola strutturale sbagliata su una stanza di sei caselle si vede a
   occhio nudo e su una vera no.
   ═══════════════════════════════════════════════════════════════════ */
import { mappaPiena } from '../../src/motore/generale/stanze.js'
import { arreda } from '../../src/motore/generale/arreda.js'
import { ARREDAMENTO } from '../../src/data/arredamento.js'
import { PITTORI_OGGETTI } from '../../src/grafica/oggetti/indice.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

/* due stanze e un varco che le unisce: la cella 4,3 ha i muri sopra e
   sotto, ed è l'unico modo di passare da una all'altra.
      01234567
   0  ########
   1  #...#..#
   2  #...#..#
   3  #......#   ← 4,3 è la soglia
   4  #...#..#
   5  ########   */
const DUE_STANZE = [
  '########',
  '#...#..#',
  '#...#..#',
  '#......#',
  '#...#..#',
  '########',
]
const M = mappaPiena(DUE_STANZE)

controlla('due stanze separate dal varco', M.stanze.length === 2,
          `ne trova ${M.stanze.length}`)
controlla('il varco è una soglia', M.soglia(4, 3), 'la cella 4,3 non è segnata soglia')
controlla('il centro della stanza non è una soglia', !M.soglia(2, 2))
controlla('e le due stanze sono diverse', M.stanza(2, 2) !== M.stanza(5, 2),
          'le due parti sono finite nella stessa stanza')

controlla('un angolo è un angolo', M.angolo(1, 1))
controlla('e il muro non è né bordo né angolo', !M.bordo(0, 0) && !M.angolo(0, 0))

/* ── il passo obbligato ──
   la cella davanti al varco tiene insieme il pavimento: toglierla lo
   spezza in due. È quella che l'arredatore non deve toccare mai. */
controlla('la cella del varco è un passo obbligato', M.obbligata(4, 3),
          'togliere 4,3 non spezza il pavimento?')
controlla('una cella in mezzo alla stanza no', !M.obbligata(2, 2))

/* ── E LO STESSO CONTO, FATTO ALLA MANIERA STUPIDA ──
   I passi obbligati si calcolano in una visita sola, con un algoritmo
   che si legge ma non si controlla a occhio. Quello che si controlla a
   occhio è la definizione: «togli la cella e guarda se il pavimento si
   spezza». Qui si scrive la definizione, lenta e ovvia, e si pretende
   che le due risposte coincidano su ogni cella di ogni mappa di prova.
   È la prova che serve quando si scambia chiarezza per velocità. */
const aManoBassa = (righe, x, y) => {
  const muro = (i, k) => !righe[k] || righe[k][i] === undefined || righe[k][i] === '#' ||
                         (i === x && k === y)
  const visto = new Set()
  let pezzi = 0
  for (let k = 0; k < righe.length; k++) for (let i = 0; i < righe[0].length; i++) {
    if (muro(i, k) || visto.has(i + ',' + k)) continue
    pezzi++
    const coda = [[i, k]]
    visto.add(i + ',' + k)
    while (coda.length) {
      const [a, b] = coda.pop()
      for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]])
        if (!muro(a + dx, b + dy) && !visto.has((a + dx) + ',' + (b + dy))) {
          visto.add((a + dx) + ',' + (b + dy))
          coda.push([a + dx, b + dy])
        }
    }
  }
  return pezzi
}
const provaObbligate = (righe, come) => {
  const M2 = mappaPiena(righe)
  const interi = aManoBassa(righe, -1, -1)
  const male = []
  for (let k = 0; k < righe.length; k++)
    for (let i = 0; i < righe[0].length; i++) {
      if (M2.muro(i, k)) continue
      const vero = aManoBassa(righe, i, k) > interi
      if (vero !== M2.obbligata(i, k)) male.push(`${i},${k}`)
    }
  controlla(`i passi obbligati di ${come} tornano col conto lento`, !male.length,
            `non tornano su: ${male.join(' · ')}`)
}
provaObbligate(DUE_STANZE, 'due stanze')
provaObbligate(['#########', '#.#...#.#', '#.#.#.#.#', '#...#...#', '#########'], 'un labirinto')
provaObbligate(['######', '#....#', '#.##.#', '#....#', '######'], 'un anello')
provaObbligate(['#####', '#...#', '#.#.#', '#.#.#', '#...#', '#####'], 'una U')

/* ── le facce dei muri ──
   quelle che si vedono sono le facce col pavimento sotto: è dove va
   appesa una torcia. */
const sotto = M.facce.filter(f => f.versoY === 1)
controlla('ci sono facce rivolte verso chi guarda', sotto.length > 0)
controlla('e ogni faccia è un muro con pavimento davanti',
          M.facce.every(f => M.muro(f.x, f.y) && !M.muro(f.x + f.versoX, f.y + f.versoY)))

/* ── il terreno sotto le cose ──
   una cella che ospita qualcosa non può dichiarare anche il pavimento:
   se lo prende dai vicini. */
const P = mappaPiena(['#####', '#...#', '#...#', '#####'], {
  suoli: { '1,1': 'lastre', '2,1': 'lastre', '3,1': 'lastre', '1,2': 'lastre', '3,2': 'lastre' },
  riempi: ['2,2'],
})
uguale('sotto una cosa ci va il terreno dei vicini', P.suolo(2, 2), 'lastre')

/* ═══════════ l'arredatore ═══════════ */

/* una sala con una porta stretta: l'arredatore ci mette qualcosa, ma
   non dove chiuderebbe la strada */
const SALA = [
  '###########',
  '#.........#',
  '#.........#',
  '#.........#',
  '####.######',
  '#.........#',
  '#.........#',
  '###########',
]
const S = mappaPiena(SALA)
const A = arreda(S, ARREDAMENTO.corridoio, { seme: 3, occupate: ['1,1', '9,6'] })

controlla('la stanza si arreda', A.scenografia.length > 0, 'non ha messo niente')
controlla('niente sul varco',
          !A.scenografia.some(d => d.x === 4 && d.y === 4),
          'ha messo qualcosa sul passaggio')
controlla('niente dove c\'è già qualcosa',
          !A.scenografia.some(d => (d.x === 1 && d.y === 1) || (d.x === 9 && d.y === 6)),
          'ha arredato una cella occupata')

/* ── LA PROVA CHE CONTA: LA MAPPA NON SI TOCCA ──
   La prima versione murava una casella di pavimento per far posto a
   una botte, e si vedeva — nella grotta comparivano rettangoli di
   pavimento chiaro dentro la roccia, come un buco aperto per metterci
   una stalagmite. E si giocava: in una sala che si gioca a vista, un
   passo in più fra il punto di guardia e l'angolo è la partita.
   Adesso quello che ha un volume sta **sul muro che c'è già**, dove
   l'ingombro è vero senza che nessuno lo dichiari, e quello che sta
   sul pavimento è roba che si calpesta. */
uguale('l\'arredatore non muove un sasso', Object.keys(A.arredi).length, 0)
const dovunque = A.scenografia.map(d => `${d.che} in ${d.x},${d.y}`)
const male = A.scenografia.filter(d => !S.muro(d.x, d.y) && d.versoY != null)
controlla('quello che ha un volume sta su una casella di muro', !male.length,
          male.map(d => `${d.che} (${d.x},${d.y}) sta sul pavimento`).join(' · '))
controlla('e ogni cosa appoggiata ha il pavimento davanti',
          A.scenografia.every(d => d.versoY == null || !S.muro(d.x + d.versoX, d.y + d.versoY)),
          dovunque.join(' · '))

/* ── e si riapre uguale ──
   il seme è l'id del livello: una stanza che cambia a ogni apertura
   non è una stanza, è un rumore. */
const B = arreda(S, ARREDAMENTO.corridoio, { seme: 3, occupate: ['1,1', '9,6'] })
uguale('stesso seme, stessa stanza', JSON.stringify(B), JSON.stringify(A))
const C = arreda(S, ARREDAMENTO.corridoio, { seme: 4, occupate: ['1,1', '9,6'] })
controlla('e semi diversi danno stanze diverse', JSON.stringify(C) !== JSON.stringify(A),
          'due livelli diversi sarebbero arredati identici')

/* ── la cella che deve restare libera ── */
const D = arreda(S, ARREDAMENTO.tesoro, { seme: 9, occupate: [], liberi: ['5,1'] })
controlla('la cella dichiarata libera resta libera',
          !D.scenografia.some(d => d.x === 5 && d.y === 1))

/* ── ogni cosa del catalogo si sa disegnare ──
   un refuso qui sarebbe una cosa che non compare e non dice niente:
   il catalogo è dato, i pittori sono codice, e nessuno dei due sa
   dell'altro. */
for (const [amb, regole] of Object.entries(ARREDAMENTO))
  for (const c of regole.cose)
    controlla(`«${c.che}» (${amb}) ha un pittore`, !!PITTORI_OGGETTI[c.che],
              `nessun pittore si chiama «${c.che}»`)

nota(`ambienti arredabili: ${Object.keys(ARREDAMENTO).length}`)
riassunto('la mappa piena e l\'arredatore')
