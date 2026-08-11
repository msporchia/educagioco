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
  const griglia = celle.map(r => r.map(t => (t === MURO ? '#' : '.')).join(''))

  const posti = {}, porte = {}, leve = {}, totem = {}
  const oggetti = [], unita = [], nomi = {}
  const schiere = {}
  const quanti = {}

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
         prato. È dichiarato, quindi non si confonde con un refuso. */
      if (voce.genere === 'segnaposto') continue

      const { genere, nome, parte, schiera, schieraNome, fa, ...resto } = voce
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
        schiere[chiave] = { nome: schieraNome || chiave, autore: parte,
                            ordini: schiere[chiave]?.ordini || {} }
        if (fa) schiere[chiave].ordini[id] = fa
        unita.push({ id, nome, fazione: chiave, x, y, token: t, ...resto })
        nomi[chiave] = schieraNome || chiave
      } else throw new Error(`livello «${livello.id}»: «${t}» ha un genere sconosciuto (${genere})`)
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

  /* i nomi scritti a mano vincono su quelli dedotti: servono per le
     cose che non stanno sulla mappa, come i segnali */
  return { griglia, posti, porte, leve, totem, oggetti, unita,
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
