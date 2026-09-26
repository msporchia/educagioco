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
     · e la carta passata al motore (`percorsoDi`) resta la carta: le
       piazzole sono quelle delle celle `o`, ognuna accanto alla sua
       strada, e la strada non è smussata.

   Com'è fatto a occhio lo dice `poc/scatti/castello-carte.png`
   (`node strumenti/sprite/carte-castello.mjs`). */
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { TAPPE, LIBERE } from '../../src/data/castello.js'
import { cartaDi, percorsoDi, DA_RIDISEGNARE, COLONNE, RIGHE } from '../../src/giochi/castello/motore/carta.js'
import { Percorso } from '../../src/motore/castello/percorso.js'
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
  const d = percorsoDi(c)
  const P = new Percorso(d.forme, t.posti, MONDO, d.percorso)
  uguale(`${dove}: il motore ha le piazzole della carta`, P.postazioni.length, c.piazzole.length)
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

riassunto('le carte del castello a scacchiera')
