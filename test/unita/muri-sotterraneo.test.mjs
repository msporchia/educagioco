/* ═══════════════════════════════════════════════════════════════════
   DA CHE PARTE SI VEDE UNA PORTA DEL SOTTERRANEO

   `src/giochi/sotterraneo/scena/muri.js` decide il verso di una porta
   guardando solo i vicini: di fianco quando sta in un muro che va
   dall'alto in basso — anche in mezzo a una colonna di porte, dove
   sopra e sotto non c'è roccia ma un'altra porta — altrimenti di fronte.
   Si prova qui perché sbagliare non lancia niente: la porta si vede
   storta, e solo se qualcuno guarda proprio quella.

   E poi la prova vera, sui piani che il gioco genera davvero: **ogni
   porta ha il suo verso**.
   ═══════════════════════════════════════════════════════════════════ */
import { versoDellaPorta } from '../../src/giochi/sotterraneo/scena/muri.js'
import { Livello } from '../../src/giochi/sotterraneo/motore/livello.js'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { PAVIMENTO, PORTA } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

/* Una pianta scritta a mano: `#` roccia, `.` pavimento, `+` porta. Fuori
   dalla pianta è roccia, come nel gioco. */
function pianta(righe) {
  const a = (x, y) => (y >= 0 && y < righe.length && x >= 0 && x < righe[y].length
    ? righe[y][x] : '#')
  return { chiuso: (x, y) => a(x, y) !== '.' }
}

/* ══════════ 1. da che parte si vede una porta ══════════ */
{
  const incrocio = pianta([
    '#.#',
    '.+.',
    '#.#',
  ])
  uguale('dove si passa in tutti i versi si vede di fronte, che è il verso di ripiego',
         versoDellaPorta(incrocio.chiuso, 1, 1), 'davanti')
  const lato = pianta([
    '###',
    '.+.',
    '###',
  ])
  uguale('si passa da ovest a est: di fianco', versoDellaPorta(lato.chiuso, 1, 1), 'fianco')
  const fila = pianta([
    '#.#',
    '#+#',
    '#.#',
  ])
  uguale('si passa dall\'alto in basso: di fronte', versoDellaPorta(fila.chiuso, 1, 1), 'davanti')
  const colonna = pianta([
    '#####',
    '..+..',
    '..+..',
    '..+..',
    '#####',
  ])
  uguale('una colonna di porte lungo una stanza è di fianco, anche in mezzo',
         versoDellaPorta(colonna.chiuso, 2, 2), 'fianco')
  const accostate = pianta([
    '######',
    '..++..',
    '######',
  ])
  controlla('due porte accostate in un muro spesso due celle sono di fianco tutte e due',
            versoDellaPorta(accostate.chiuso, 2, 1) === 'fianco' && versoDellaPorta(accostate.chiuso, 3, 1) === 'fianco')
  const riga = pianta([
    '#...#',
    '#+++#',
    '#...#',
  ])
  uguale('e una riga di porte lungo un muro disteso è di fronte', versoDellaPorta(riga.chiuso, 2, 1), 'davanti')
}

/* ══════════ 2. sui piani veri: ogni porta ha un verso ══════════
   Tutte le discese, un pugno di semi ciascuna. */
{
  let porte = 0
  const male = []
  for (const tappa of CAMPAGNA)
    for (let seme = 1; seme <= 6; seme++) {
      const liv = new Livello({ seme: seme * 131 + tappa.misura, largo: tappa.misura,
                                alto: tappa.misura, giri: tappa.giri })
      const chiuso = (x, y) => liv.a(x, y) !== PAVIMENTO
      for (let y = 0; y < liv.alto; y++) for (let x = 0; x < liv.largo; x++) {
        if (liv.a(x, y) !== PORTA) continue
        porte++
        if (!['davanti', 'fianco'].includes(versoDellaPorta(chiuso, x, y)))
          male.push(`${tappa.chiave}/${seme} porta (${x},${y}) senza verso`)
      }
    }
  controlla(`ogni porta ha il suo verso (${porte} porte)`, porte > 0 && male.length === 0, male.slice(0, 5).join(' · '))
}

riassunto('il verso delle porte del sotterraneo')
