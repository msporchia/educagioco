/* ═══════════════════════════════════════════════════════════════════
   DOVE SI PUÒ METTERE IL PIEDE — le regole del camminare.

   `src/motore/passi.js` è il pezzo che due giochi stavano scrivendo
   ognuno per conto suo: la fattoria (dove può camminare il cane) e il
   sotterraneo (come si arriva a quel forziere). Si prova qui perché è
   il genere di codice che sbaglia in silenzio — una strada un po' più
   lunga del necessario non lancia niente — e perché su di lui poggia
   un controllo che conta davvero: **un livello si può finire?**

   Le quattro cose che devono restare vere:

     1. la strada è la **più corta**, e sono i passi da fare — non
        comprende la cella da cui si parte;
     2. dove non si passa, si torna `null`: mai una strada che
        attraversa un muro;
     3. `arrivoLibero: false` permette di **arrivare** su una cella
        occupata senza permettere di **passarci in mezzo**;
     4. si esplora sempre a passi ortogonali: mai in diagonale fra due
        muri che si toccano per un angolo.
   ═══════════════════════════════════════════════════════════════════ */
import { percorso, raggiungibili, siArriva, accanto, primaLibera,
         passiFra, viaVerso, PASSI } from '../../src/motore/passi.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

/* Una mappetta a caratteri: `#` è muro, tutto il resto si cammina.
   Scriverla così invece che a coordinate serve a poterla *guardare*
   mentre si legge il test. */
function mappa(righe) {
  return (x, y) => !!righe[y] && righe[y][x] !== undefined && righe[y][x] !== '#'
}

const APERTA = mappa([
  '.....',
  '.....',
  '.....',
])

/* ══════════ 1. la strada più corta ══════════ */
{
  const s = percorso(APERTA, { x: 0, y: 0 }, { x: 3, y: 0 })
  uguale('tre passi in linea retta', s.length, 3)
  uguale('il primo passo non è dove si sta già', `${s[0].x},${s[0].y}`, '1,0')
  uguale("l'ultimo passo è la meta", `${s.at(-1).x},${s.at(-1).y}`, '3,0')

  const diagonale = percorso(APERTA, { x: 0, y: 0 }, { x: 2, y: 2 })
  uguale('in diagonale si va a scaletta, quattro passi', diagonale.length, 4)

  controlla('restare fermi non è un passo',
    percorso(APERTA, { x: 1, y: 1 }, { x: 1, y: 1 }).length === 0)
}

/* ══════════ 2. i muri fermano davvero ══════════ */
{
  const MURO = mappa([
    '..#..',
    '..#..',
    '..#..',
  ])
  uguale('un muro che taglia la mappa in due', percorso(MURO, { x: 0, y: 1 }, { x: 4, y: 1 }), null)
  uguale('e non ci si arriva nemmeno guardando', siArriva(MURO, { x: 0, y: 1 }, { x: 4, y: 1 }), false)
  uguale('di qua si arriva solo a sei celle', raggiungibili(MURO, { x: 0, y: 0 }).size, 6)

  /* la diagonale fra due muri che si toccano per un angolo non si
     attraversa: a schermo si vedrebbe passare dentro la roccia */
  const SPIGOLO = mappa([
    '.#',
    '#.',
  ])
  uguale('non si sguscia fra due spigoli', percorso(SPIGOLO, { x: 0, y: 0 }, { x: 1, y: 1 }), null)

  const dentroUnMuro = percorso(mappa(['.#.']), { x: 0, y: 0 }, { x: 1, y: 0 })
  uguale('non si arriva dentro un muro', dentroUnMuro, null)
}

/* ══════════ 3. arrivare su una cosa senza attraversarla ══════════
   È il caso di tutti i giorni: il mostro sta su una cella dove non si
   può salire, ma è proprio lui che si vuole raggiungere. */
{
  const CORRIDOIO = mappa(['.....'])
  const conMostro = (x, y) => CORRIDOIO(x, y) && !(x === 2 && y === 0)

  uguale('col mostro in mezzo non si passa oltre',
    percorso(conMostro, { x: 0, y: 0 }, { x: 4, y: 0 }), null)
  const addosso = percorso(conMostro, { x: 0, y: 0 }, { x: 2, y: 0 }, { arrivoLibero: false })
  uguale('ma ci si arriva addosso', addosso?.length, 2)
  uguale("e l'ultimo passo è proprio lui", `${addosso.at(-1).x},${addosso.at(-1).y}`, '2,0')
}

/* ══════════ 4. da dove si tocca una cosa ══════════ */
{
  const stanza = mappa(['.....', '.....', '.....'])
  const dove = accanto(stanza, { x: 2, y: 1 }, { x: 0, y: 1 })
  uguale('ci si ferma dal lato da cui si arriva', `${dove.x},${dove.y}`, '1,1')

  const daSopra = accanto(stanza, { x: 2, y: 1 }, { x: 2, y: 2 })
  uguale('e cambia col punto di partenza', `${daSopra.x},${daSopra.y}`, '2,2')

  /* una scala ci si sale sopra: `sopra: true` conta anche la cella stessa */
  const sulla = accanto(stanza, { x: 2, y: 1 }, { x: 2, y: 1 }, { sopra: true })
  uguale('su una scala ci si sale', `${sulla.x},${sulla.y}`, '2,1')

  const chiuso = mappa(['#.#'])
  uguale('attorno a una cosa murata non c\'è posto',
    accanto((x, y) => chiuso(x, y) && !(x === 1 && y === 0), { x: 1, y: 0 }, { x: 0, y: 0 }), null)
}

/* ══════════ 5. la cella libera più vicina ══════════ */
{
  const conBuco = mappa(['##.', '###', '###'])
  const q = primaLibera(conBuco, { x: 0, y: 0 })
  uguale('si allarga a cerchi finché non trova', `${q.x},${q.y}`, '2,0')
  uguale('e se non trova niente lo dice',
    primaLibera(() => false, { x: 0, y: 0 }, 3), null)
  const gia = primaLibera(APERTA, { x: 1, y: 1 })
  uguale('una cella già buona resta dov\'è', `${gia.x},${gia.y}`, '1,1')
}

/* ══════════ 6. la distanza è a passi, non in linea d'aria ══════════
   È la misura con cui si decide dove mettere l'uscita di un livello:
   la stanza più lontana **da percorrere**, non quella che sulla carta
   sta più in là. */
{
  const GIRO = mappa([
    '...#.',
    '.#.#.',
    '.#...',
  ])
  const aria = Math.hypot(4 - 0, 0 - 0)
  const passi = passiFra(GIRO, { x: 0, y: 0 }, { x: 4, y: 0 })
  controlla('girare attorno costa più che andare dritti', passi > aria)
  uguale('dove non si arriva, la distanza è infinita',
    passiFra(mappa(['.#.']), { x: 0, y: 0 }, { x: 2, y: 0 }), Infinity)
}

/* ══════════ 7. le reti di sicurezza ══════════ */
{
  uguale('si cammina in quattro versi, mai in otto', PASSI.length, 4)
  /* Una `buona` che dice sempre sì è un errore di chi chiama — di
     solito un bordo dimenticato — e senza tetto manderebbe la ricerca
     a esplorare l'infinito con il telefono in mano a un bambino. */
  const senzaBordi = () => true
  const quante = raggiungibili(senzaBordi, { x: 0, y: 0 }, 500).size
  controlla('il tetto ferma una mappa senza bordi', quante <= 500 && quante > 0)
  nota(`una mappa senza bordi si ferma a ${quante} celle`)
}

/* ══════════ 8. su una cosa che si calpesta si sale, e non ci si ferma prima ══════════
   `sopra` vuol dire che la meta **è** la cella, non una accanto. Messa
   in fila con le vicine perde sempre, perché chi arriva incontra la
   vicina un passo prima: nel sotterraneo l'eroe si piantava accanto
   alle monete e non le raccoglieva — si prendono camminandoci sopra —
   e l'unico modo di prenderle era mirare una cella più in là. */
{
  const via = viaVerso(APERTA, { x: 4, y: 1 }, { x: 0, y: 1 }, { sopra: true })
  uguale('si arriva proprio sopra', `${via.dove.x},${via.dove.y}`, '4,1')
  uguale("e l'ultimo passo è la meta", `${via.strada.at(-1).x},${via.strada.at(-1).y}`, '4,1')

  const accosto = viaVerso(APERTA, { x: 4, y: 1 }, { x: 0, y: 1 })
  uguale('senza sopra ci si ferma accanto', `${accosto.dove.x},${accosto.dove.y}`, '3,1')

  /* se sulla cella non si può stare, `sopra` non è un ordine: si ripiega
     sul lato raggiungibile, come per un mostro o un forziere */
  const OCCUPATA = mappa([
    '.....',
    '....#',
    '.....',
  ])
  const ripiego = viaVerso(OCCUPATA, { x: 4, y: 1 }, { x: 0, y: 1 }, { sopra: true })
  uguale('dove non si può salire si sta accanto', `${ripiego.dove.x},${ripiego.dove.y}`, '3,1')
}

riassunto('passi')
