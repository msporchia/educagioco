/* Il campo del castello a tessere: venti tappe ricalcate sulla griglia.

   Quello che si prova qui non è «esce un'immagine» — un'immagine esce
   sempre — ma le tre cose che, sbagliate, si vedono a schermo come un
   guasto e non come un limite:

     · la strada **non si spezza**. Ogni cella di strada tocca la
       successiva per un lato, mai per un angolo, e la fila arriva dal
       bordo di sopra al bordo di sotto senza buchi.
     · le tessere **combaciano**. Dove la composizione riesce, il lato
       che due tessere vicine si guardano racconta la stessa cosa. Dove
       non riesce si ripiega, e allora deve dirlo.
     · lo stesso campo **si ridisegna uguale**. Un prato che si rimescola
       a ogni giro sembra rotto anche quando è bello.

   Non prova che sia bello: quello lo guarda un occhio, in
   `poc/scatti/castello-campi.png`.
*/
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { campoDi, TAPPE, catalogoDi } from '../../src/giochi/castello/scena/campo.js'
import { COLONNE, RIGHE, materialeDi, AMBIENTE_DI } from '../../src/giochi/castello/dati/mondo.js'
import { AMBIENTI, ATTACCHI, nomiDi, pratiDi } from '../../src/giochi/castello/dati/atlante.js'
import { latiDi } from '../../src/grafica/tessere.js'
import manifesto from '../../src/giochi/castello/gioco.js'

const CONTRO = { N: 'S', S: 'N', O: 'E', E: 'O' }
const PASSI = { N: [0, -1], S: [0, 1], O: [-1, 0], E: [1, 0] }

/* ═══════════ 1. il foglio ═══════════ */
nota('il foglio delle tessere')

for (const materiale of new Set(Object.values(AMBIENTE_DI))) {
  const strade = nomiDi(materiale)
  controlla(`${materiale}: ha delle strade`, strade.length > 0)
  controlla(`${materiale}: ha almeno un terreno pieno`, pratiDi(materiale).length > 0,
            'senza fondo si vede il nero sotto il mondo')
  /* una tessera di strada attraversa almeno due lati: un vicolo cieco in
     questi fogli non c'è, e quando ne esce uno è la lettura ad aver
     sbagliato */
  const monche = strade.filter(n => latiDi(ATTACCHI[n]).length < 2)
  uguale(`${materiale}: nessun vicolo cieco`, monche.length, 0, monche.join(' '))
}

controlla('la sabbia resta fuori dalle tappe',
          !Object.values(AMBIENTE_DI).includes('sabbia'),
          'la sua strada è sabbia su sabbia: non si legge e non si vedrebbe')

/* La regola, e vale per tutto l'atlante: **quello che non è
   referenziato non si genera**. Dentro un file unico che un telefono
   scarica una volta, una famiglia di tessere che nessuno guarda non è
   una scorta, è mezzo megabyte. Chi taglia è `terreni.py`, che legge
   proprio questa tabella; questo controllo è il guardiano dall'altra
   parte — se qualcuno rimette una tavolozza senza rilanciare
   l'attrezzo, il campo resterebbe senza tessere e si scoprirebbe a
   schermo. */
const inPiu = Object.keys(AMBIENTI).filter(m => !Object.values(AMBIENTE_DI).includes(m))
uguale("l'atlante non porta materiali che nessuno nomina", inPiu.length, 0, inPiu.join(' '))
const mancanti = [...new Set(Object.values(AMBIENTE_DI))].filter(m => !AMBIENTI[m])
uguale('...e non ne manca nessuno di quelli nominati', mancanti.length, 0,
       `${mancanti.join(' ')} — rilancia strumenti/sprite/terreni.py`)

/* ═══════════ 2. le venti tappe ═══════════ */
nota('le venti tappe, ricalcate')

uguale('le tappe sono venti', TAPPE.length, 20)

let composte = 0
for (const tappa of TAPPE) {
  const c = campoDi(tappa)
  const dove = `${tappa.nome} (${c.materiale})`
  if (!c.approssimato) composte++

  /* ── la fila non si spezza ── */
  const dentro = c.strada.every(s => s.x >= 0 && s.x < COLONNE && s.y >= 0 && s.y < RIGHE)
  controlla(`${dove}: tutte le celle stanno nel campo`, dentro)

  const chiavi = new Set(c.strada.map(s => `${s.x},${s.y}`))
  const isolate = c.strada.filter(s => !Object.entries(PASSI)
    .some(([, [dx, dy]]) => chiavi.has(`${s.x + dx},${s.y + dy}`)))
  uguale(`${dove}: nessuna cella isolata`, isolate.length, 0)

  /* ogni verso dichiarato porta o su un'altra cella di strada o fuori
     dal campo: se portasse sul prato la strada finirebbe nell'erba */
  const sbucano = []
  for (const s of c.strada)
    for (const v of s.versi) {
      const [dx, dy] = PASSI[v]
      const nx = s.x + dx, ny = s.y + dy
      const fuori = nx < 0 || nx >= COLONNE || ny < 0 || ny >= RIGHE
      if (!fuori && !chiavi.has(`${nx},${ny}`)) sbucano.push(`${s.x},${s.y}${v}`)
    }
  uguale(`${dove}: nessuna strada che sbuca nel prato`, sbucano.length, 0, sbucano.join(' '))

  /* ── si tocca il bordo di sopra e quello di sotto ── */
  controlla(`${dove}: entra dal bordo di sopra`, c.strada.some(s => s.y === 0))
  controlla(`${dove}: arriva al bordo di sotto`, c.strada.some(s => s.y === RIGHE - 1))

  /* ── la forma della tessera è quella che il posto chiede ── */
  const storte = c.strada.filter(s => s.posa && latiDi(s.posa.socket) !== s.versi)
  uguale(`${dove}: ogni tessera si apre dove deve`, storte.length, 0)

  /* ── e dove si è composto, i giunti combaciano ── */
  if (!c.approssimato) {
    const dovePosa = new Map(c.strada.map(s => [`${s.x},${s.y}`, s.posa]))
    let male = 0
    for (const s of c.strada)
      for (const v of ['S', 'E']) {
        const [dx, dy] = PASSI[v]
        const la = dovePosa.get(`${s.x + dx},${s.y + dy}`)
        if (la && s.posa && s.posa.socket[v] !== la.socket[CONTRO[v]]) male++
      }
    uguale(`${dove}: i giunti combaciano`, male, 0)
    uguale(`${dove}: e nessun buco`, c.mancanti.length, 0)
  }

  /* ── il prato copre tutto ── */
  const senzaFondo = []
  for (let x = 0; x < COLONNE; x++)
    for (let y = 0; y < RIGHE; y++) if (!c.prato(x, y)) senzaFondo.push(`${x},${y}`)
  uguale(`${dove}: il fondo non ha buchi`, senzaFondo.length, 0)
}

/* Quante si chiudono da sole è una misura, non una promessa: il foglio
   di oggi non ha tutte le forme, e il numero serve a vedere se una
   modifica lo migliora o lo peggiora. Il minimo invece è una promessa —
   sotto la metà, la strada a tessere non è una strada. */
controlla(`si compongono da sole ${composte} tappe su ${TAPPE.length}`,
          composte >= TAPPE.length / 2, 'sotto la metà non è più un ricalco, è un caso')

/* ═══════════ 3. sempre lo stesso campo ═══════════ */
nota('lo stesso campo, ogni volta')

const primo = campoDi(TAPPE[0])
const secondo = campoDi(TAPPE[0])
uguale('la strada si ridisegna identica',
       JSON.stringify(primo.strada), JSON.stringify(secondo.strada))
uguale('e anche il prato', primo.prato(3, 7), secondo.prato(3, 7))

const altroSeme = campoDi(TAPPE[0], undefined, 9)
controlla('con un altro seme cambia',
          JSON.stringify(altroSeme.strada) !== JSON.stringify(primo.strada) ||
          altroSeme.prato(3, 7) !== primo.prato(3, 7))

/* ═══════════ 4. il manifesto ═══════════ */
nota('il manifesto')

uguale('la chiave è castello', manifesto.chiave, 'castello')
controlla('sta dietro ai giochi in prova', manifesto.sperimentale === true,
          'non si gioca ancora: è un campo da guardare')
controlla('il riassunto è una riga', typeof manifesto.riassunto() === 'string')
controlla('non porta niente all\'albo', !manifesto.albo,
          'giusto così finché non si gioca: un traguardo che non scatta mai è peggio di nessuno')

/* il catalogo si calcola una volta sola */
controlla('il catalogo di un materiale è lo stesso oggetto',
          catalogoDi('bosco') === catalogoDi('bosco'))
uguale('il materiale di una tavolozza che non c\'è è il bosco',
       materialeDi('non-esiste'), 'bosco')

riassunto('il campo del castello a tessere')
