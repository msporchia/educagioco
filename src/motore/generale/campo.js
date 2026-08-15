/* ═══════════════════════════════════════════════════════════════════
   DALLA MAPPA DISEGNATA AL CAMPO — il lettore della griglia a token

   ── il problema che toglie ──
   Prima una cosa si metteva sul campo scrivendo le sue coordinate:
   `{ x: 11, y: 8 }`, contate a mano su una griglia di caratteri. Tre
   conseguenze, tutte pagate:
     · spostare un tesoro di due celle voleva dire cambiare `x`/`y` in
       tre punti (la base e le due varianti), ricontando ogni volta;
     · niente impediva di metterlo **dentro un muro**: lo si scopriva
       giocando;
     · e l'alfabeto era finito, perché una cella era un carattere solo:
       con due porte diverse si finivano le lettere buone e si arrivava
       a chiamare il tesoro `i`.

   ── come funziona adesso ──
   Una cella è un **token di due caratteri**, e la barra è facoltativa
   (la si mette per leggere, il lettore la butta):

       mappa: [
         '##|##|##|##|##',
         '##|@@|..|p1|##',
         '##|..|T$|..|##',
       ],
       legenda: {
         '@@': chi.nostro('eroe', { corpo: 'cavaliere' }),
         'p1': cose.porta('grata', 'la grata', { chiave: 'rossa' }),
         'T$': cose.tesoro('tesoro', 'il tesoro'),
       }

   Due caratteri fissi danno oltre tremila combinazioni — l'alfabeto
   non è più un vincolo — e la griglia resta **un rettangolo che si
   legge in una diff**, che è la ragione per cui non si usa un
   separatore libero: con token di lunghezza diversa le righe si
   disallineano e la forma della stanza sparisce.

   `##` è muro e `..` è pavimento: sono gli unici due token che il
   lettore conosce da sé, perché sono l'unica cosa che il **gioco**
   deve sapere del terreno (si passa o non si passa). Tutto il resto è
   vestito, e lo decide `grafica/`.

   ── cosa esce di qui ──
   Le collezioni che il motore usa da sempre — `griglia`, `posti`,
   `porte`, `oggetti`, `unita`, `fazioni`, `leve`, `totem`, `nomi` —
   con le posizioni già dentro. Il formato di scrittura è uno solo:
   questo è il lettore, non una seconda strada.
   ═══════════════════════════════════════════════════════════════════ */

import { mappaPiena } from './stanze.js'
import { arreda } from './arreda.js'
import { ARREDAMENTO } from '../../data/arredamento.js'

const MURO = '##'
const VUOTO = '..'

/* una riga di token: si tolgono le barre e si taglia a coppie */
export function tokenDi (riga) {
  const netta = String(riga).replace(/\|/g, '')
  if (netta.length % 2)
    throw new Error(`mappa: la riga «${riga}» ha un numero dispari di caratteri: ` +
                    'una cella sono due caratteri')
  const out = []
  for (let i = 0; i < netta.length; i += 2) out.push(netta.slice(i, i + 2))
  return out
}

/* ── LO STESSO TOKEN PIÙ VOLTE ──
   Due guardie uguali si disegnano con lo stesso token, e diventano due
   cose distinte: `guardia` e `guardia#2`. È la convenzione che il
   formato aveva già per indicare la singola in mezzo a tante, e adesso
   la produce la mappa invece di doverla scrivere. */
const idNumero = (id, n) => (n ? `${id}#${n + 1}` : id)

/* ── LA STESSA STANZA, APERTA UNA VOLTA SOLA ──
   Decompressione e arredamento sono puri, e costano: una visita in
   profondità per i passi obbligati, e un giro di cammini per ogni cosa
   solida che si prova a posare. Ma la stessa scena si rilegge in
   continuazione — il mondo, il piano, la vista, e il banco che rigioca
   la stessa battaglia per ogni soluzione dichiarata — e la risposta è
   sempre quella. Si tiene da parte: la chiave è tutto quello che la
   decide, così due scene diverse non si scambiano la stanza.
   Il tetto è basso apposta: serve a non rifare il lavoro dentro una
   partita, non a ricordarsi il gioco intero. */
const stanzeLette = new Map()
function decomprimi (griglia, opz) {
  const chiave = griglia.join('|') + '¦' + opz.ambiente + '¦' + opz.seme + '¦' +
    JSON.stringify(opz.suoli) + JSON.stringify(opz.muri) + JSON.stringify(opz.arredi) + '¦' +
    opz.occupate.join(' ') + '¦' + opz.liberi.join(' ')
  if (stanzeLette.has(chiave)) return stanzeLette.get(chiave)
  const piena = mappaPiena(griglia, {
    suoli: opz.suoli, muri: opz.muri, arredi: opz.arredi, riempi: opz.occupate })
  /* ── E LA STANZA SI ARREDA DA SÉ ──
     Quello che il livello non ha detto, se l'ambiente sa metterlo.
     Quello che nasce qui non entra mai in gioco — le solide occupano
     una cella e basta, e l'arredatore ha appena controllato che non
     abbiano allungato la strada di nessuno. */
  const auto = arreda(piena, ARREDAMENTO[opz.ambiente], opz)
  if (stanzeLette.size > 48) stanzeLette.clear()
  stanzeLette.set(chiave, { piena, auto })
  return { piena, auto }
}

export function leggiCampo (livello) {
  const righe = livello.scena && livello.scena.righe
  if (!Array.isArray(righe) || !righe.length)
    throw new Error(`livello «${livello.id}»: manca la scena`)
  const celle = righe.map(tokenDi)
  const w = celle[0].length
  const storta = celle.findIndex(r => r.length !== w)
  if (storta > 0)
    throw new Error(`livello «${livello.id}»: la riga ${storta} è larga ${celle[storta].length} ` +
                    `celle, la prima ne ha ${w}`)

  const legenda = (livello.scena && livello.scena.legenda) || {}
  /* ── QUALI TOKEN SONO MURO ──
     `##` sempre, e in più quelli che la legenda dichiara come muratura
     (`muri.pietra`, `muri.legno`…): un muro con un materiale suo resta
     muro a tutti gli effetti — di lì non ci si passa, la vista si ferma
     — e cambia solo chi lo dipinge. */
  const genereDi = t => {
    const v = legenda[t]
    return (v && !Array.isArray(v) && v.genere) || null
  }
  /* muro per il MOTORE: `##`, la muratura dichiarata, e **l'arredo** —
     una botte è un ostacolo, non un disegno. Di lì non ci si passa e
     la vista si ferma, che è quello che si vede guardandola. */
  const eMuro = t => t === MURO || genereDi(t) === 'muro' || genereDi(t) === 'arredo'
  const griglia = celle.map(r => r.map(t => (eMuro(t) ? '#' : '.')).join(''))

  const posti = {}, porte = {}, leve = {}, totem = {}
  const oggetti = [], unita = [], nomi = {}
  const schiere = {}
  const quanti = {}
  /* ── I POSTI PREPARATI CHE QUESTA SCENA HA LASCIATO VUOTI ──
     Erano scartati in silenzio, e con loro se ne andava l'unica cosa
     che rende leggibile un livello a scene: **dove la cosa POTEVA
     finire**. Un bambino che vede l'orco in un punto non ha nessun
     motivo di scrivere un piano che regga altrove — la situazione ce
     l'ha sotto gli occhi. Vedere invece i quattro angoli da cui può
     arrivare è vedere il problema.
     Qui si raccoglie solo dove sono; **cosa** possa comparirci lo sa il
     livello (le sue varianti), e lo mette insieme chi disegna. */
  const attese = []
  /* di che è fatto il pavimento, cella per cella: solo dove il livello
     l'ha detto — le altre restano quelle dell'ambiente */
  const suoli = {}
  /* e di che è fatto il muro, dove il livello l'ha detto */
  const muri = {}
  /* e i mobili: cella occupata, disegno sopra */
  const arredi = {}
  /* le celle che ospitano qualcosa: prendono il terreno dei vicini, e
     l'arredatore non ci mette niente sopra */
  const occupate = []
  /* e quelle che il livello vuole vuote per forza */
  const liberi = []

  for (let y = 0; y < celle.length; y++)
    for (let x = 0; x < w; x++) {
      const t = celle[y][x]
      if (t === MURO || t === VUOTO) continue
      const dichiarata = legenda[t]
      if (!dichiarata)
        throw new Error(`livello «${livello.id}»: il token «${t}» (riga ${y}, cella ${x}) ` +
                        'non è in legenda')
      /* ── UNA CELLA PUÒ AVERE PIÙ COSE ──
         L'eroe che parte **dentro** il rifugio, il tesoro appoggiato su
         un posto che ha un nome: sono due cose nello stesso punto, e un
         token solo non saprebbe dirlo. La legenda accetta una lista, e
         l'ordine conta quanto conta sempre — è quello dei fili. */
      for (const voce of (Array.isArray(dichiarata) ? dichiarata : [dichiarata])) {
      /* un POSTO PREPARATO che questa scena non ha riempito: resta
         prato — ma si segna, perché è informazione da mostrare. */
      if (voce.genere === 'segnaposto') { attese.push({ x, y, token: t }); occupate.push(x + ',' + y); continue }
      /* ── UN TOKEN CHE DICE SOLO DI CHE È FATTO IL PAVIMENTO ──
         Non è una cosa e non cammina: è pavimento come `..`, e l'unica
         differenza è chi lo dipinge. Il motore non lo sa nemmeno — se
         lo tiene il campo e lo passa a chi disegna. */
      if (voce.genere === 'suolo') { suoli[x + ',' + y] = voce.id; continue }
      /* e il gemello per la muratura: la cella è già segnata muro nella
         griglia, qui si tiene solo di che è fatta */
      if (voce.genere === 'muro') { muri[x + ',' + y] = voce.id; continue }
      /* un mobile: la cella è già piena nella griglia, qui si tiene
         solo cosa ci sta sopra — lo disegna il fondale, perché è fermo
         come un muro e non cambia mai */
      if (voce.genere === 'arredo') { arredi[x + ',' + y] = voce.id; occupate.push(x + ',' + y); continue }
      /* ── LA CELLA CHE DEVE RESTARE VUOTA ──
         La valvola di sfogo dell'arredamento automatico: quando serve
         uno spazio libero per forza — una piazzola, il punto dove
         qualcuno si ferma — il livello lo dice e nessuno ci mette
         niente. Le regole strutturali coprono i casi che si possono
         dedurre; questo copre quelli che sa solo chi ha scritto il
         livello, e gli lascia l'ultima parola. */
      if (voce.genere === 'libero') { liberi.push(x + ',' + y); continue }

      const { genere, nome, parte, ostile, schiera, schieraNome, fa, ...resto } = voce
      const n = quanti[voce.id] = (quanti[voce.id] || 0)
      quanti[voce.id]++
      const id = idNumero(voce.id, n)
      nomi[id] = n ? `${nome} (${n + 1})` : nome

      if (genere === 'posto') posti[id] = { x, y, ...resto }
      else if (genere === 'porta') porte[id] = { x, y, ...resto }
      else if (genere === 'leva') leve[id] = { x, y, ...resto }
      else if (genere === 'totem') totem[id] = { x, y, ...resto }
      else if (genere === 'oggetto') oggetti.push({ nome: id, x, y, ...resto })
      else if (genere === 'unita') {
        /* la fazione non si scrive più: la dice la fabbrica con cui
           l'unità è stata creata, e il gruppo prende il nome della
           schiera — che serve a nominarlo tutto insieme, «attacca gli
           orchi» */
        const chiave = schiera || (parte === 'giocatore' ? 'nostri' : 'nemici')
        /* `ostile` sta sulla SCHIERA e non sull'unità: è una proprietà
           del gruppo — «gli orchi» sono avversari, «quelli del mulino»
           no — ed è così che la legge chi disegna la fila di chi c'è in
           campo. Chi non lo dichiara si comporta come prima: nemico se
           lo comanda il livello. */
        schiere[chiave] = { nome: schieraNome || chiave, autore: parte,
                            ostile: ostile ?? (parte === 'livello'),
                            ordini: schiere[chiave]?.ordini || {} }
        if (fa) schiere[chiave].ordini[id] = fa
        unita.push({ id, nome, fazione: chiave, x, y, token: t, ...resto })
        nomi[chiave] = schieraNome || chiave
      } else throw new Error(`livello «${livello.id}»: «${t}» ha un genere sconosciuto (${genere})`)
      occupate.push(x + ',' + y)
      }
    }

  /* ── L'ORDINE È QUELLO DELLA LEGENDA, NON DELLA MAPPA ──
     Chi agisce per primo in un battito conta: due unità che si muovono
     nello stesso istante danno una scena diversa a seconda di chi va
     avanti. Se l'ordine venisse dalla scansione della mappa, spostare
     un orco dall'angolo in alto a quello in basso cambierebbe il
     comportamento di tutta la partita senza che nessuno l'abbia
     chiesto — ed è successo davvero: una variante si vinceva e la
     stessa, ridisegnata, no.
     Adesso l'ordine è quello in cui le voci stanno scritte in legenda,
     che è la stessa regola dei segnali: si consegna nell'ordine in cui
     le cose sono dichiarate. */
  const posto2 = Object.keys(legenda)
  unita.sort((a, b) => posto2.indexOf(a.token) - posto2.indexOf(b.token))
  unita.forEach(u => { delete u.token })

  /* ── LA DECOMPRESSIONE ──
     Fin qui si sono letti i token: è **la forma compressa**. Adesso si
     apre — il reticolo pieno, con il terreno risolto cella per cella e
     i fatti che riguardano la forma della stanza (dov'è una soglia,
     cos'è un bordo, quale casella è un passo obbligato). Non è un
     dettaglio di disegno: è la conoscenza che serve a chiunque debba
     decidere *dove va una cosa*, e prima non ce l'aveva nessuno.
     Il riempimento dei buchi lasciati dalle cose sta lì dentro. */
  const { piena, auto } = decomprimi(griglia, {
    suoli, muri, arredi, occupate, liberi,
    ambiente: livello.ambiente,
    /* il seme è l'id del livello: la stessa stanza si riapre uguale */
    seme: [...String(livello.id || '')].reduce((s, c) => s * 31 + c.charCodeAt(0), 7) >>> 0,
    gia: livello.scenografia || [],
  })

  /* i nomi scritti a mano vincono su quelli dedotti: servono per le
     cose che non stanno sulla mappa, come i segnali */
  return { griglia, posti, porte, leve, totem, oggetti, unita, attese,
           suoli: piena.suoli, muri, arredi, piena,
           scenografia: [...(livello.scenografia || []), ...auto.scenografia],
           fazioni: schiere, nomi: { ...nomi, ...(livello.nomi || {}) } }
}

/* ── LO STESSO CAMPO, LETTO UNA VOLTA ──
   `leggiCampo` è puro, quindi rileggerlo dà sempre lo stesso risultato
   — ma lo chiedono in tre (il mondo, il piano, la vista) e su una mappa
   grande sono qualche migliaio di token per volta. La memoria è tenuta
   da una `WeakMap`: quando il livello se ne va, se ne va anche lei. */
const letti = new WeakMap()
export function campoDi (livello) {
  if (!letti.has(livello)) letti.set(livello, leggiCampo(livello))
  return letti.get(livello)
}
