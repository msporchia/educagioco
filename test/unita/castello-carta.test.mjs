/* Le carte del castello a scacchiera: le tappe vere, portate a squadra.

   Si prova quello che, sbagliato, si vede a schermo come un campo rotto:
     · la strada rispetta la scacchiera — una per cella, niente corsie
       che si toccano, esce dritta dalla bocca ed entra dritta nel
       castello (le regole le guarda `cartaDi` stessa);
     · ci sono le piazzole che la tappa promette;
     · le distrazioni non toccano il gioco: niente acqua o fitto a
       ridosso della strada o di una piazzola, niente decori attaccati a
       una piazzola;
     · la stessa tappa esce sempre uguale;
     · e il motore gioca sulla carta (`sullaCarta`, che ci passa da
       `Battaglia`): le piazzole sono quelle delle celle `o`, ognuna
       accanto alla sua strada, e la strada non è smussata.

   Com'è fatto a occhio lo dice `poc/scatti/castello-carte.png`
   (`node strumenti/sprite/carte-castello.mjs`). */
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { TAPPE, LIBERE } from '../../src/data/castello.js'
import { cartaDi, sullaCarta, DA_RIDISEGNARE, A_MANO, COLONNE, RIGHE } from '../../src/motore/castello/carta.js'
import { creaBattaglia } from '../../src/motore/battaglia.js'
import { MONDO } from '../../src/data/castello.js'

const tutte = [...TAPPE, ...LIBERE]
const chiaveDi = t => t.chiave || t.nome

nota('le carte, una per tappa')
for (const t of tutte) {
  const c = cartaDi(t)
  const dove = `${t.campagna} · ${t.nome}`
  uguale(`${dove}: 12×22`, `${c.righe[0].length}×${c.righe.length}`, `${COLONNE}×${RIGHE}`)
  const a = (x, y) => (c.righe[y] || '')[x] || null
  const accanto = (x, y, quali) => {
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && quali.includes(a(x + dx, y + dy))) return true
    return false
  }
  let invadenti = 0, attaccati = 0, piazzole = 0
  for (let y = 0; y < RIGHE; y++)
    for (let x = 0; x < COLONNE; x++) {
      const q = a(x, y)
      if (q === 'o') piazzole++
      if ('~^'.includes(q) && accanto(x, y, '+o')) invadenti++
      if (q === 'd' && accanto(x, y, 'o')) attaccati++
    }
  uguale(`${dove}: le piazzole promesse`, piazzole, t.posti)
  uguale(`${dove}: acqua e fitto lontani da strada e piazzole`, invadenti, 0)
  uguale(`${dove}: nessun decoro attaccato a una piazzola`, attaccati, 0)
  uguale(`${dove}: esce sempre uguale`, cartaDi(t).righe.join('\n'), c.righe.join('\n'))

  /* il motore sulla carta: le piazzole sono quelle della carta, in
     quell'ordine, e stanno a una cella dalla loro strada — non di più,
     se no la torre sarebbe su una piazzola e il fondale ne mostrerebbe
     un'altra */
  const d = sullaCarta(t)
  uguale(`${dove}: la carta del motore è questa`, d.carta.righe.join('\n'), c.righe.join('\n'))
  const P = creaBattaglia({ tappa: t, misure: { ...MONDO }, stato: {} }).percorso
  uguale(`${dove}: il motore ha le piazzole della carta`, P.postazioni.length, c.piazzole.length)
  controlla(`${dove}: nello stesso ordine`, P.postazioni.every((p, i) =>
    Math.abs(p.x / MONDO.W - d.posti[i][0]) < 1e-9 && Math.abs(p.y / MONDO.H - d.posti[i][1]) < 1e-9))
  const cella = MONDO.W / COLONNE
  const lontane = P.postazioni.filter(p => {
    const via = P.viaN(p.via)
    let meno = Infinity
    for (let s = 0; s <= via.lunghezza; s += 2) {
      const q = via.puntoA(s)
      meno = Math.min(meno, Math.hypot(q.x - p.x, q.y - p.y))
    }
    return meno > cella * 1.05
  })
  uguale(`${dove}: ogni piazzola accanto alla sua strada`, lontane.length, 0)
  controlla(`${dove}: la strada a squadra non si smussa`,
            P.vie.every((v, k) => v.punti.length === d.forme[k].length))

  const daRifare = DA_RIDISEGNARE.includes(chiaveDi(t))
  if (daRifare)
    controlla(`${dove}: è ancora da ridisegnare a mano`, c.guasti.length > 0,
              'si è aggiustata da sé: toglila da DA_RIDISEGNARE')
  else
    uguale(`${dove}: rispetta la scacchiera`, c.guasti.length, 0, c.guasti.join(' · '))
}

/* le carte scritte a mano: nessuna tappa resta da ridisegnare, e quelle
   a mano sono davvero la loro tappa — la radura grande è una bocca sola
   che si sdoppia in due bracci e si richiude nello stesso tronco */
nota('le carte a mano')
uguale('nessuna tappa resta da ridisegnare', DA_RIDISEGNARE.join(', '), '')
for (const chiave of Object.keys(A_MANO))
  controlla(`${chiave}: è una tappa vera`, tutte.some(t => chiaveDi(t) === chiave))
const radura = cartaDi(tutte.find(t => chiaveDi(t) === 'libera-bosco'))
uguale('la radura: due vie', radura.vie.length, 2)
uguale('la radura: una bocca sola', new Set(radura.vie.map(v => v[0].join())).size, 1)
controlla('la radura: i bracci si separano subito e si richiudono prima della porta', (() => {
  const [a, b] = radura.vie
  const comuni = a.filter(c => b.some(d => d[0] === c[0] && d[1] === c[1]))
  return a[3].join() !== b[3].join() && comuni.length >= 6 &&
    a.slice(-6).every(c => comuni.includes(c))
})())

riassunto('le carte del castello a scacchiera')
