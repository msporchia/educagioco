/* ═══════════════════════════════════════════════════════════════════
   QUALE TESSERA VA QUI — le regole che scelgono la forma.

   `src/grafica/tessere.js` è il pezzo che permette di **segnare le
   celle** invece di piazzare le figure: si dice dove passa la strada,
   dov'è lo stagno, dove corre il recinto, e la forma del pezzo la
   ricava lui guardando i vicini.

   Si prova qui perché è l'unica parte di un mondo a tessere che si può
   sbagliare in silenzio: una curva girata dalla parte sbagliata non
   lancia niente, non rompe niente, e si vede solo a schermo — cioè
   tardi, e solo se qualcuno guarda proprio quella cella.

   Le tre cose che devono restare vere:

     1. la chiave è **ordinata**, se no due strade uguali non si
        somigliano e la tavola si riempie di doppioni;
     2. lo **specchio** copre gli angoli che il foglio non disegna, e li
        copre nel verso giusto;
     3. un percorso non è un insieme: una strada che passa due volte
        vicino a sé stessa **non diventa un incrocio**.
   ═══════════════════════════════════════════════════════════════════ */
import { chiave, riflessa, collegamenti, versiLungo, pezzoPer, fettaDi,
         bordoOtto, angoliInterni, fettaEquivalente, pezzoPerOtto,
         caso, variante, NESSUN_ATTACCO, giraSocket, specchiaSocket, pose,
         latiDi, componiPercorso } from '../../src/grafica/tessere.js'
import { controlla, uguale, nota, stessaLista, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. la chiave è sempre nello stesso ordine ══════════ */
{
  uguale('i versi si mettono in fila da soli', chiave(['E', 'N']), 'NE')
  uguale('e l\'ordine non dipende da come arrivano', chiave(['O', 'S', 'N']), 'NSO')
  uguale('una cella sola non è collegata a niente', chiave([]), '')
  uguale('allo specchio destra e sinistra si scambiano', riflessa('NO'), 'NE')
  uguale('sopra e sotto no', riflessa('NS'), 'NS')
  uguale('e lo specchio dello specchio è l\'originale', riflessa(riflessa('SE')), 'SE')
}

/* ══════════ 2. una cella dentro un insieme ══════════ */
{
  // una croce di celle: quella al centro tocca tutte e quattro
  const zona = new Set(['2,2', '2,1', '2,3', '1,2', '3,2'])
  const dentro = (x, y) => zona.has(x + ',' + y)
  uguale('il centro di una croce è collegato dappertutto',
         collegamenti(dentro, 2, 2), 'NSOE')
  uguale('la punta di sopra guarda solo in giù', collegamenti(dentro, 2, 1), 'S')
  uguale('quella di sinistra solo a destra', collegamenti(dentro, 1, 2), 'E')
  uguale('e una cella fuori non tocca niente', collegamenti(dentro, 9, 9), '')
}

/* ══════════ 3. un percorso non è un insieme ══════════
   Questa è la ragione per cui esistono due funzioni invece di una. Il
   percorso qui sotto scende, gira, e **ripassa accanto a sé stesso**:
   la cella (2,2) ha un vicino a nord che è pure strada, ma non ci si
   può svoltare — non è un incrocio, è un tornante. */
{
  const percorso = [[2, 0], [2, 1], [3, 1], [3, 2], [2, 2], [1, 2]]
  const versi = percorso.map((_, i) => versiLungo(percorso, i))

  uguale('la cella dopo la partenza scende e sale', versi[1], 'NE')
  uguale('sotto il tornante la strada tira dritto', versi[4], 'OE')
  nota('i versi del percorso:', versi.join(' '))

  // e la controprova: lo stesso disegno letto come insieme *sì* che
  // vedrebbe un incrocio dove non c'è
  const insieme = new Set(percorso.map(c => c.join(',')))
  const comeInsieme = collegamenti((x, y) => insieme.has(x + ',' + y), 2, 2)
  controlla('lo stesso posto, letto come insieme, ne vedrebbe uno in più',
            comeInsieme.length > versi[4].length,
            `insieme ${comeInsieme}, percorso ${versi[4]}`)

  // i due capi escono dal bordo: è quello che fa entrare la strada in scena
  const conCapi = versiLungo(percorso, 0, { parte: 'N' })
  uguale('la prima cella esce dal bordo di sopra', conCapi, 'NS')
  uguale('senza dirlo, la prima cella guarda solo avanti',
         versiLungo(percorso, 0), 'S')
}

/* ══════════ 4. dalla chiave al pezzo, specchio compreso ══════════
   La tavola qui sotto è quella vera del foglio delle torri: contiene
   tre curve su quattro. La quarta deve uscire lo stesso. */
{
  const STRADA = { NS: 'strada-v', EO: 'strada-o', OS: 'curva-so',
                   ES: 'curva-se', NO: 'curva-no' }

  uguale('un pezzo che c\'è si prende com\'è', pezzoPer(STRADA, 'NS').nome, 'strada-v')
  controlla('e non si specchia per niente', !pezzoPer(STRADA, 'NS').specchia)

  const ne = pezzoPer(STRADA, 'NE')
  uguale('l\'angolo che manca si prende dal suo gemello', ne.nome, 'curva-no')
  controlla('...allo specchio', ne.specchia)

  uguale('una chiave che non esiste da nessuna parte torna niente',
         pezzoPer(STRADA, 'NSOE'), null)
  nota('un `null` va fatto vedere: è un buco nella tavola, non un caso da ignorare')
}

/* ══════════ 5. le nove fette di una pozza ══════════ */
{
  // uno stagno 3×3: il centro è dentro, gli otto attorno sono bordi
  const acqua = new Set()
  for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) acqua.add(x + ',' + y)
  const dentro = (x, y) => acqua.has(x + ',' + y)

  uguale('il cuore dello stagno non ha bordi', fettaDi(dentro, 1, 1), 'centro')
  uguale('l\'angolo in alto a sinistra', fettaDi(dentro, 0, 0), 'angolo-no')
  uguale('quello in basso a destra', fettaDi(dentro, 2, 2), 'angolo-se')
  uguale('la sponda di sopra', fettaDi(dentro, 1, 0), 'bordo-n')
  uguale('la sponda di destra', fettaDi(dentro, 2, 1), 'bordo-e')

  // una lingua d'acqua larga una cella: fuori a destra *e* a sinistra.
  // Nove fette non bastano a disegnarla, e prende un bordo: è il
  // compromesso dichiarato, e questo test lo tiene fermo
  const rivolo = new Set(['0,0', '0,1', '0,2'])
  const stretta = (x, y) => rivolo.has(x + ',' + y)
  uguale('una lingua stretta ripiega su un bordo solo',
         fettaDi(stretta, 0, 1), 'bordo-o')
  nota('sedici combinazioni, nove disegni: le altre si riducono, ed è voluto')
}

/* ══════════ 6. il caso che non cambia ══════════
   Un prato che si rimescola a ogni ridisegno si vede *mentre* cambia, e
   sembra un guasto. */
{
  uguale('lo stesso posto dà sempre la stessa erba', caso(3, 7), caso(3, 7))
  controlla('due posti vicini danno erbe diverse', caso(3, 7) !== caso(4, 7))
  controlla('e lo stesso posto con un altro seme pure', caso(3, 7) !== caso(3, 7, 1))

  let fuori = 0
  for (let x = 0; x < 60; x++)
    for (let y = 0; y < 60; y++) {
      const v = caso(x, y)
      if (v < 0 || v >= 1) fuori++
    }
  uguale('e non esce mai da zero-uno', fuori, 0)

  // la lista può ripetere: è il modo di dire «questa spunta di rado»
  const ERBE = ['erba0', 'erba0', 'erba0', 'erba1']
  const conto = {}
  for (let x = 0; x < 40; x++)
    for (let y = 0; y < 40; y++) {
      const e = variante(ERBE, x, y)
      conto[e] = (conto[e] || 0) + 1
    }
  controlla('la variante rara resta rara',
            conto.erba1 < conto.erba0 / 2, JSON.stringify(conto))
  controlla('e non esce mai niente che non sia nella lista',
            Object.keys(conto).every(k => ERBE.includes(k)))
}

/* ══════════ 7. otto vicini: l'angolo che un dungeon chiede ══════════
   Una stanza quadrata a cui manca un angolo è il modo più piccolo di
   ottenere un angolo concavo vero — due lati dentro, la diagonale
   fuori — invece di un angolo esterno, che `fettaDi` già sa fare. */
{
  // una cella in mezzo a un'area piena, ben lontana da ogni bordo
  {
    const piena = new Set()
    for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) piena.add(x + ',' + y)
    const dentro = (x, y) => piena.has(x + ',' + y)
    uguale('il centro di un\'area piena non ha né lati né angoli', bordoOtto(dentro, 2, 2), 'centro')
    stessaLista('e non ha nessun angolo concavo', angoliInterni(dentro, 2, 2), [])

    // i quattro lati: un solo cardinale fuori, niente diagonali (sono
    // abbastanza lontane dal bordo da restare dentro)
    uguale('il lato di sopra', bordoOtto(dentro, 2, 0), 'N')
    uguale('il lato di sotto', bordoOtto(dentro, 2, 4), 'S')
    uguale('il lato sinistro', bordoOtto(dentro, 0, 2), 'O')
    uguale('il lato destro', bordoOtto(dentro, 4, 2), 'E')

    // i quattro angoli esterni: due cardinali fuori insieme, e la loro
    // diagonale non è eleggibile (tocca un lato già fuori) quindi non
    // aggiunge nessuna rientranza
    uguale('l\'angolo esterno nord-ovest', bordoOtto(dentro, 0, 0), 'NO')
    uguale('quello nord-est', bordoOtto(dentro, 4, 0), 'NE')
    uguale('quello sud-ovest', bordoOtto(dentro, 0, 4), 'SO')
    uguale('quello sud-est', bordoOtto(dentro, 4, 4), 'SE')
  }

  // i quattro angoli interni: una stanza 3×3 a cui manca un angolo,
  // vista dal centro — l'unica cella che tocca la rientranza da tutti
  // e due i lati
  {
    const senzaNO = new Set(['1,0', '2,0', '0,1', '1,1', '2,1', '0,2', '1,2', '2,2'])
    const senzaNE = new Set(['0,0', '1,0', '0,1', '1,1', '2,1', '0,2', '1,2', '2,2'])
    const senzaSO = new Set(['0,0', '1,0', '2,0', '0,1', '1,1', '2,1', '1,2', '2,2'])
    const senzaSE = new Set(['0,0', '1,0', '2,0', '0,1', '1,1', '2,1', '0,2', '1,2'])
    const usa = zona => (x, y) => zona.has(x + ',' + y)

    uguale('la rientranza a nord-ovest', bordoOtto(usa(senzaNO), 1, 1), 'no')
    uguale('quella a nord-est', bordoOtto(usa(senzaNE), 1, 1), 'ne')
    uguale('quella a sud-ovest', bordoOtto(usa(senzaSO), 1, 1), 'so')
    uguale('quella a sud-est', bordoOtto(usa(senzaSE), 1, 1), 'se')
    stessaLista('e angoliInterni la vede allo stesso modo',
                angoliInterni(usa(senzaNE), 1, 1), ['NE'])

    // la regola dei 47: se manca anche il lato che fiancheggia la
    // diagonale, quella diagonale smette di contare — è esattamente
    // ciò che tiene le combinazioni a 47 invece che a 256. Qui manca
    // sia (0,0) (la diagonale nord-ovest) sia (1,0) (il lato nord che
    // la fiancheggia): il risultato è solo 'N', non 'N' più un angolo
    const senzaNOeN = new Set(['2,0', '0,1', '1,1', '2,1', '0,2', '1,2', '2,2'])
    uguale('un angolo diagonale isolato non fa una tessera propria',
           bordoOtto(usa(senzaNOeN), 1, 1), 'N')

    // due configurazioni diverse che allo stesso posto locale danno la
    // stessa figura: la stessa rientranza, ma dentro una stanza più
    // grande — solo gli otto vicini contano, non la forma intera
    const granstanza = new Set()
    for (let x = 0; x < 5; x++)
      for (let y = 0; y < 5; y++)
        if (x + ',' + y !== '2,0') granstanza.add(x + ',' + y)
    uguale('stessa rientranza locale, stanza diversa attorno: stessa chiave',
           bordoOtto((x, y) => granstanza.has(x + ',' + y), 1, 1),
           bordoOtto(usa(senzaNE), 1, 1))
  }

  // una lingua larga una cella: bordoOtto non la riduce come fettaDi,
  // le dà la sua figura propria ('OE', uno dei 47 blob veri) invece di
  // schiacciarla su un solo lato
  {
    const rivolo = new Set(['0,0', '0,1', '0,2'])
    const stretta = (x, y) => rivolo.has(x + ',' + y)
    uguale('la lingua stretta ha una figura sua, non un lato solo',
           bordoOtto(stretta, 0, 1), 'OE')
    nota('fettaDi la schiaccia su un bordo, bordoOtto no: sono due compromessi diversi')
  }
}

/* ══════════ 8. dagli otto vicini ai quattro, quando il set non ha i concavi ══════════ */
{
  // fettaEquivalente deve ricalcare esattamente le scelte di fettaDi
  uguale('un lato resta un lato', fettaEquivalente('N'), 'bordo-n')
  uguale('un angolo esterno resta un angolo esterno', fettaEquivalente('NO'), 'angolo-no')
  uguale('un angolo concavo puro si perde nel centro', fettaEquivalente('no'), 'centro')
  uguale('un lato con una rientranza resta solo il lato',
         fettaEquivalente('S-no'), 'bordo-s')
  uguale('centro resta centro', fettaEquivalente('centro'), 'centro')

  // e sulla lingua stretta, la stessa identica riduzione di fettaDi:
  // fettaEquivalente non è un secondo algoritmo, è lo stesso fettaDi
  uguale('la lingua stretta si riduce come farebbe fettaDi',
         fettaEquivalente('OE'), 'bordo-o')

  // pezzoPerOtto: un set senza pezzi diagonali non resta scoperto
  const SOLO_QUATTRO = { 'bordo-n': 'muro-n', 'angolo-no': 'muro-angolo-no' }
  uguale('senza il pezzo concavo, ripiega sul lato', pezzoPerOtto(SOLO_QUATTRO, 'N-se').nome, 'muro-n')
  uguale('e un angolo esterno cade sulla stessa voce di fettaDi',
         pezzoPerOtto(SOLO_QUATTRO, 'NO').nome, 'muro-angolo-no')

  // un set che invece ha anche i pezzi diagonali vince sempre lui,
  // esatto, senza passare dalla riduzione
  const CON_DIAGONALI = { 'bordo-n': 'muro-n', 'no': 'muro-angolo-interno-no' }
  uguale('un set con i concavi non degrada', pezzoPerOtto(CON_DIAGONALI, 'no').nome, 'muro-angolo-interno-no')
}

/* ══════════ 9. gli attacchi: dove passa la strada, non solo se passa ══════════ */
{
  const V = NESSUN_ATTACCO
  // un incrocio con la strada in mezzo su tutti e quattro i lati
  const CROCE = { N: 'c', S: 'c', O: 'c', E: 'c' }
  // una curva che entra da nord in mezzo ed esce a est in mezzo
  const CURVA = { N: 'c', S: V, O: V, E: 'c' }
  // e una che esce a est ma verso il basso: stessa forma, altro attacco
  const CURVA_BASSA = { N: 'c', S: V, O: V, E: 'dx' }

  uguale('una curva girata di un quarto entra da est ed esce a sud',
         latiDi(giraSocket(CURVA)), 'SE')
  uguale('girare quattro volte torna al punto di partenza',
         JSON.stringify(giraSocket(giraSocket(giraSocket(giraSocket(CURVA))))),
         JSON.stringify(CURVA))
  uguale('lo specchio scambia i lati', latiDi(specchiaSocket(CURVA)), 'NO')
  uguale('e ribalta anche l\'attacco, non solo il lato',
         specchiaSocket({ N: 'sx', S: V, O: V, E: V }).N, 'dx')

  // un incrocio è lo stesso incrocio comunque lo giri: una posa sola
  uguale('le pose di un incrocio simmetrico sono una', pose('croce', CROCE).length, 1)
  uguale('quelle di una curva sono quattro', pose('curva', CURVA).length, 4)
  // quella asimmetrica non si sovrappone mai a sé stessa: otto pose
  uguale('e di una curva storta sono otto', pose('storta', CURVA_BASSA).length, 8)

  /* ── comporre ──
     Un percorso che scende dritto: servono tre pezzi verticali, e la
     tessera esiste. */
  const DRITTO = pose('dritto', { N: 'c', S: 'c', O: V, E: V })
  const CURVE = pose('curva', CURVA)
  const CATALOGO = [...DRITTO, ...CURVE]
  const CAMPO = { dentro: (x, y) => x >= 0 && x < 3 && y >= 0 && y < 3,
                  capi: { parte: 'N', arriva: 'S' } }
  const scesa = componiPercorso([[1, 0], [1, 1], [1, 2]], CATALOGO, CAMPO)
  controlla('una discesa dritta si compone', !!scesa)
  uguale('e usa tre volte il pezzo dritto', scesa.map(p => p.nome).join(' '),
         'dritto dritto dritto')

  // una svolta: dritto, curva, dritto — la curva la sceglie lui, girata
  // nel verso giusto
  const svolta = componiPercorso([[1, 0], [1, 1], [2, 1]], CATALOGO,
                                 { ...CAMPO, capi: { parte: 'N', arriva: 'E' } })
  controlla('una svolta si compone', !!svolta)
  uguale('e in mezzo ci mette una curva', svolta[1].nome, 'curva')

  /* ── quello che non si può comporre va detto ──
     Senza il pezzo dritto non c'è modo di scendere, e la risposta giusta
     è `null`: un buco nel foglio si scopre qui, non a schermo. */
  uguale('senza il pezzo giusto non si inventa niente',
         componiPercorso([[1, 0], [1, 1], [1, 2]], CURVE, CAMPO), null)

  /* ── gli attacchi devono combaciare davvero ──
     Due pezzi verticali che portano la strada in due punti diversi del
     bordo non si possono impilare, anche se tutti e due sono «aperti a
     nord e a sud». È il caso che il modello a sì/no sbagliava in
     silenzio. */
  const STORTO = pose('storto', { N: 'sx', S: 'dx', O: V, E: V })
  uguale('due attacchi diversi non si impilano',
         componiPercorso([[1, 0], [1, 1]], STORTO, CAMPO), null)
  // ma lo stesso pezzo specchiato sì: sx contro sx
  const DRITTI_STORTI = [...STORTO, ...pose('dritto', { N: 'sx', S: 'sx', O: V, E: V })]
  controlla('mentre due attacchi uguali sì',
            !!componiPercorso([[1, 0], [1, 1], [1, 2]], DRITTI_STORTI, CAMPO))

  /* ── il prato chiude i lati ──
     Una strada che finisce in mezzo al campo non può continuare
     nell'erba: l'ultima cella vuole un pezzo con un lato solo. */
  const TESTA = pose('testa', { N: 'c', S: V, O: V, E: V })
  const finita = componiPercorso([[1, 0], [1, 1]], [...DRITTO, ...CURVE, ...TESTA],
                                 { dentro: CAMPO.dentro, capi: { parte: 'N' } })
  controlla('una strada che finisce nel campo si chiude', !!finita)
  uguale('e l\'ultimo pezzo è una testa morta', finita[1].nome, 'testa')

  /* ── stesso campo, stessa strada ──
     Due composizioni della stessa mappa devono venire identiche: una
     strada che si ridisegna diversa a ogni giro si legge come un guasto
     anche quando è bella. */
  const via = [[1, 0], [1, 1], [2, 1], [2, 2]]
  const largo = { dentro: (x, y) => x >= 0 && x < 4 && y >= 0 && y < 4,
                  capi: { parte: 'N', arriva: 'S' } }
  uguale('la composizione non cambia da un giro all\'altro',
         JSON.stringify(componiPercorso(via, CATALOGO, largo)),
         JSON.stringify(componiPercorso(via, CATALOGO, largo)))
}

riassunto('quale tessera va qui')
