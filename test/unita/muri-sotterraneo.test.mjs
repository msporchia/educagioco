/* ═══════════════════════════════════════════════════════════════════
   LA REGOLA DEL MURO DEL SOTTERRANEO — cella per cella

   `src/giochi/sotterraneo/scena/muri.js` decide cosa si vede in una
   cella di roccia: il tetto col suo bordo, oppure la faccia di mattoni
   quando sotto si cammina. Si prova qui perché è la parte che si sbaglia
   in silenzio — un bordo che manca non lancia niente, è un dente nel
   muro che si vede solo a schermo, e solo se qualcuno guarda proprio
   quella cella.

   Le quattro cose che devono restare vere:

     1. la faccia è **alta una cella**: roccia con del calpestabile sotto,
        anche quando sopra si cammina (il muro fra due corridoi);
     2. il bordo del tetto sta dove si cammina a nord, a ovest e a est —
        a ovest e a est **anche accanto a una faccia** — e gli angoli
        dove le strisce si incontrano o girano;
     3. una fila di facce ha lo spigolo solo dove accanto si cammina, e
        mai accanto a una porta della stessa fila;
     4. una porta si vede di fianco quando sta in un muro che va
        dall'alto in basso — anche in mezzo a una colonna di porte, dove
        sopra e sotto non c'è roccia ma un'altra porta.

   E poi la prova vera, sui piani che il gioco genera davvero: **nessuna
   cella di roccia che tocca il pavimento resta senza la sua faccia o il
   suo bordo** da quel lato.
   ═══════════════════════════════════════════════════════════════════ */
import { genere, bordiDelTetto, capiDellaFaccia, versoDellaPorta, faccia, tetto, taglio, angoloInterno, diagonaliDelPiano, VICINA_DEL_TAGLIO }
  from '../../src/giochi/sotterraneo/scena/muri.js'
import { Livello } from '../../src/giochi/sotterraneo/motore/livello.js'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { ROCCIA, PAVIMENTO, PORTA } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

/* Una pianta scritta a mano: `#` roccia, `.` pavimento, `+` porta, `n` nicchia. Fuori
   dalla pianta è roccia, come nel gioco. `buona` è il pavimento di una stanza liscia: né porta né nicchia. */
function pianta(righe) {
  const a = (x, y) => (y >= 0 && y < righe.length && x >= 0 && x < righe[y].length
    ? righe[y][x] : '#')
  return {
    pietra: (x, y) => a(x, y) === '#',
    porta: (x, y) => a(x, y) === '+',
    chiuso: (x, y) => a(x, y) !== '.',
    buona: (x, y) => a(x, y) !== '+' && a(x, y) !== 'n',
  }
}

/* ══════════ 1. la faccia è alta una cella ══════════ */
{
  // una stanza, e sopra un corridoio che le corre accanto: fra i due il
  // muro è spesso una cella sola
  const { pietra } = pianta([
    '#######',
    '#.....#',
    '#.###.#',
    '#.....#',
    '#######',
  ])
  uguale('la roccia sopra il pavimento è una faccia', genere(pietra, 2, 2), 'faccia')
  uguale('anche se sopra si cammina: il muro fra due corridoi', genere(pietra, 3, 2), 'faccia')
  uguale('la roccia sopra la roccia è tetto', genere(pietra, 0, 2), 'tetto')
  uguale('quella in fondo, con del pavimento sopra, è tetto', genere(pietra, 3, 4), 'tetto')
  uguale('e il pavimento è pavimento', genere(pietra, 1, 1), 'pavimento')
  controlla('faccia e tetto non si sovrappongono mai',
            [[0, 0], [2, 2], [3, 4], [6, 2]].every(([x, y]) => faccia(pietra, x, y) !== tetto(pietra, x, y)))
}

/* ══════════ 2. il bordo del tetto, e gli angoli ══════════ */
{
  // una stanza chiusa: in alto la fila delle facce, ai lati e in basso
  // il tetto col suo bordo
  const { pietra } = pianta([
    '#####',
    '#####',
    '#...#',
    '#...#',
    '#####',
  ])
  const sx = bordiDelTetto(pietra, 0, 2)
  uguale('il muro di sinistra ha il bordo verso la stanza, a est', [sx.n, sx.o, sx.e].join(), 'false,false,true')
  const alto = bordiDelTetto(pietra, 0, 1)
  controlla('e sale accanto alla fila delle facce fino al coronamento', alto.e)
  controlla('dove, in fondo, incontra il coronamento con un blocco',
            bordiDelTetto(pietra, 0, 0).angoli.includes('se'),
            JSON.stringify(bordiDelTetto(pietra, 0, 0)))
  const giu = bordiDelTetto(pietra, 2, 4)
  uguale('il muro in fondo ha il bordo a nord', [giu.n, giu.o, giu.e].join(), 'true,false,false')
  stessaLista('l\'angolo in basso a sinistra è un angolo dentro',
              bordiDelTetto(pietra, 0, 4).angoli, ['ne'])
  stessaLista('e così quello a destra', bordiDelTetto(pietra, 4, 4).angoli, ['no'])
  uguale('la roccia lontana non ha bordi',
         JSON.stringify(bordiDelTetto(pietra, 2, 0)), '{"n":false,"o":false,"e":false,"angoli":[]}')

  // un pilastro in mezzo a una stanza: il tetto ha tre bordi e due spigoli
  const p = pianta([
    '.....',
    '..#..',
    '..#..',
    '.....',
  ])
  const cima = bordiDelTetto(p.pietra, 2, 1)
  uguale('la cima di un pilastro ha il bordo su tre lati', [cima.n, cima.o, cima.e].join(), 'true,true,true')
  stessaLista('e i due spigoli in alto', cima.angoli, ['no', 'ne'])
}

/* ══════════ 3. gli spigoli di una fila di facce ══════════ */
{
  // il moncone sopra una porta laterale: a sinistra la faccia sopra il
  // corridoio, a destra la stanza
  const m = pianta([
    '#####',
    '###..',
    '#.+..',
    '#.#..',
  ])
  const capi = (p, x, y) =>
    Object.entries(capiDellaFaccia(p.pietra, p.porta, x, y)).filter(([, v]) => v).map(([k]) => k)
  stessaLista('il moncone ha lo spigolo dove accanto si cammina, e solo lì', capi(m, 2, 1), ['dx'])
  stessaLista('la faccia accanto, dove la fila continua, non ne ha', capi(m, 1, 1), [])
  const q = pianta([
    '######',
    '#.#.##',
    '#.....',
  ])
  stessaLista('una faccia sola in mezzo a due passaggi ha tutti e due gli spigoli',
              capi(q, 2, 1), ['sx', 'dx'])
  const r = pianta([
    '#####',
    '##+##',
    '#...#',
  ])
  stessaLista('accanto a una porta della stessa fila, niente spigolo: la porta ha il suo arco',
              capi(r, 1, 1), [])
}

/* ══════════ 4. da che parte si vede una porta ══════════ */
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

/* ══════════ 5. sui piani veri: nessun dente ══════════
   Tutte le discese, un pugno di semi ciascuna: ogni cella di roccia che
   tocca qualcosa di calpestabile da un lato ha, da quel lato, la sua
   faccia (sotto) o il suo bordo (sopra, a ovest, a est). E ogni porta ha
   un verso. */
{
  let celle = 0, porte = 0
  const denti = []
  for (const tappa of CAMPAGNA)
    for (let seme = 1; seme <= 6; seme++) {
      const liv = new Livello({ seme: seme * 131 + tappa.misura, largo: tappa.misura,
                                alto: tappa.misura, giri: tappa.giri })
      const pietra = (x, y) => liv.a(x, y) === ROCCIA
      const passa = (x, y) => !pietra(x, y)
      const chiuso = (x, y) => liv.a(x, y) !== PAVIMENTO
      for (let y = 0; y < liv.alto; y++) for (let x = 0; x < liv.largo; x++) {
        if (liv.a(x, y) === PORTA) {
          porte++
          if (!['davanti', 'fianco'].includes(versoDellaPorta(chiuso, x, y)))
            denti.push(`${tappa.chiave}/${seme} porta (${x},${y}) senza verso`)
        }
        if (!pietra(x, y)) continue
        celle++
        if (passa(x, y + 1)) {
          if (genere(pietra, x, y) !== 'faccia') denti.push(`${tappa.chiave}/${seme} (${x},${y}) senza faccia`)
          continue
        }
        const b = bordiDelTetto(pietra, x, y)
        if (passa(x, y - 1) && !b.n) denti.push(`${tappa.chiave}/${seme} (${x},${y}) senza bordo a nord`)
        if (passa(x - 1, y) && !b.o) denti.push(`${tappa.chiave}/${seme} (${x},${y}) senza bordo a ovest`)
        if (passa(x + 1, y) && !b.e) denti.push(`${tappa.chiave}/${seme} (${x},${y}) senza bordo a est`)
        if (faccia(pietra, x - 1, y) && !b.o) denti.push(`${tappa.chiave}/${seme} (${x},${y}) senza bordo accanto alla faccia`)
      }
    }
  controlla(`nessuna roccia che tocca il pavimento resta senza faccia o bordo (${celle} celle, ${porte} porte)`,
            denti.length === 0, denti.slice(0, 5).join(' · '))
}

/* ══════════ 6. i tagli in diagonale (la cripta, docs/sotterraneo/scenari.md) ══════════
   Una cella di roccia con roccia da due lati e pavimento dagli altri due e in diagonale taglia di 45°. Una stanza
   smussata ha i suoi quattro angoli; il corner di un rettangolo e la svolta di un corridoio no. */
{
  const { pietra } = pianta([
    '###########',
    '###.....###',
    '##.......##',
    '#.........#',
    '#.........#',
    '#.........#',
    '##.......##',
    '###.....###',
    '###########',
  ])
  const t = (x, y) => taglio(pietra, x, y)
  uguale('in alto a sinistra la roccia sporge: no', t(2, 1), 'no')
  uguale('un passo più in basso, ancora no', t(1, 2), 'no')
  uguale('in alto a destra: ne', t(8, 1), 'ne')
  uguale('in basso a sinistra: so', t(2, 7), 'so')
  uguale('in basso a destra: se', t(8, 7), 'se')
  uguale('un muro dritto non taglia', t(5, 0), null)
  uguale('il pavimento non è roccia: non taglia', t(5, 3), null)
  // le due scalette hanno il pavimento dalla parte giusta
  for (const [x, y, lato] of [[2, 1, 'no'], [8, 1, 'ne'], [2, 7, 'so'], [8, 7, 'se']]) {
    const [dx, dy] = VICINA_DEL_TAGLIO[lato]
    controlla(`${lato}: la cella opposta alla roccia è pavimento`, !pietra(x + dx, y + dy))
  }

  const rettangolo = pianta(['#######', '#.....#', '#.....#', '#.....#', '#######'])
  let n = 0
  for (let y = 0; y < 5; y++) for (let x = 0; x < 7; x++) if (taglio(rettangolo.pietra, x, y)) n++
  uguale('un rettangolo non ha celle tagliate (gli angoli della roccia restano quadrati)', n, 0)

  // la svolta di un corridoio e un'elle: il taglio si fa solo dove il pavimento è di una stanza liscia
  const svolta = pianta(['#####', '#...#', '#.###', '#.###', '#####'])
  uguale('l\'angolo interno di una svolta, se il pavimento non è buono, non taglia', taglio(svolta.pietra, 2, 2, () => false), null)
  uguale('...e lo stesso angolo taglia se il pavimento è buono', taglio(svolta.pietra, 2, 2, () => true), 'se')

  // l'angolo interno: il 270° del pavimento, dove la roccia entra nella cella (con gli stessi pezzi del taglio)
  const dentro = (r, buona) => { const o = []; for (let y = 0; y < r.length; y++) for (let x = 0; x < r[0].length; x++) { const a = angoloInterno(pianta(r).pietra, x, y, buona); if (a) o.push(`${a}@${x},${y}`) } return o.join(' ') }
  uguale('un rettangolo ha i suoi quattro angoli interni', dentro(['#######', '#.....#', '#.....#', '#.....#', '#######']), 'no@1,1 ne@5,1 so@1,3 se@5,3')
  uguale('...ma non se il pavimento non è di una stanza liscia', dentro(['#######', '#.....#', '#.....#', '#.....#', '#######'], () => false), '')
  uguale('una stanza già smussata non ha angoli interni (il taglio c\'è già)', dentro(['###########', '###.....###', '##.......##', '#.........#', '#.........#', '#.........#', '##.......##', '###.....###', '###########']), '')
  uguale('la fine di un corridoio stretto non è un angolo interno', dentro(['#####', '#...#', '#####']), '')
  uguale('una svolta di corridoio non lo è: servono tre celle di pavimento dall\'altra parte', dentro(['#####', '#...#', '#.###', '#.###', '#####']), '')

  // niente pezzo obliquo accanto a una nicchia o a una porta, e un angolo interno solo con due celle di muro dritto oltre l'angolo, da tutti e due i lati
  const conNicchia = x => ['#########', '#'.repeat(x) + 'n' + '#'.repeat(8 - x), '#.......#', '#.......#', '#.......#', '#########']
  const angoli = r => { const p = pianta(r); const o = []; for (let y = 0; y < r.length; y++) for (let x = 0; x < r[0].length; x++) { const a = angoloInterno(p.pietra, x, y, p.buona); if (a) o.push(`${a}@${x},${y}`) } return o.join(' ') }
  uguale('una sala con la nicchia lontana dagli angoli li ha tutti e quattro', angoli(conNicchia(4)), 'no@1,2 ne@7,2 so@1,4 se@7,4')
  uguale('una nicchia sulla diagonale dell\'angolo lo toglie', angoli(conNicchia(2)), 'ne@7,2 so@1,4 se@7,4')
  uguale('una nicchia sul muro a due celle dall\'angolo lo toglie (il tratto dritto è corto)', angoli(conNicchia(3)), 'ne@7,2 so@1,4 se@7,4')
  uguale('una porta in diagonale toglie l\'angolo come una nicchia', angoli(conNicchia(2).map(r => r.replace('n', '+'))), 'ne@7,2 so@1,4 se@7,4')
  uguale('una stanza larga due celle non ha angoli interni: i muri non restano dritti per due celle', angoli(['####', '#..#', '#..#', '#..#', '####']), '')
  const gradino = ['##+##', '##...', '#....', '#....', '#....']
  const g = pianta(gradino)
  uguale('il taglio c\'è con la porta fuori dal conto', taglio(g.pietra, 1, 1), 'no')
  uguale('...e non c\'è con una porta fra le otto celle intorno: meglio il gradino', taglio(g.pietra, 1, 1, g.buona), null)
}

/* ══════════ 7. sui piani veri: nessun pezzo obliquo accanto a una nicchia o a una porta ══════════ */
{
  let pezzi = 0
  const male = []
  for (const tappa of CAMPAGNA) for (let seme = 1; seme <= 8; seme++) {
    const liv = new Livello({ seme: seme * 131 + tappa.misura, largo: tappa.misura, alto: tappa.misura, giri: tappa.giri })
    const nicchie = new Set(liv.stanze.flatMap(r => r.nicchie || []).map(n => n.y * liv.largo + n.x))
    const { tagli, interni } = diagonaliDelPiano(liv, ['smussata', 'cappella', 'sala'])
    for (const k of [...tagli.keys(), ...interni.keys()]) {
      pezzi++
      const x = k % liv.largo, y = Math.floor(k / liv.largo)
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++)
        if (nicchie.has((y + dy) * liv.largo + x + dx) || liv.a(x + dx, y + dy) === PORTA) male.push(`${tappa.chiave}/${seme} (${x},${y})`)
    }
  }
  controlla(`nei piani veri nessun taglio o angolo interno ha una nicchia o una porta fra le otto celle intorno (${pezzi} pezzi)`, pezzi > 0 && male.length === 0, male.slice(0, 5).join(' · '))
}

riassunto('la regola del muro del sotterraneo')
