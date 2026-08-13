/* ═══════════════════════════════════════════════════════════════════
   COM'È FATTO UN LIVELLO — e come si fa a non sbagliarlo

   Un livello è un oggetto con trenta campi possibili. Finora era un
   oggetto **nudo**: se scrivevi `obiettivi:` invece di `obiettivo:`,
   o `unità:` con l'accento, non succedeva niente — nessun errore,
   nessun avviso. Il livello si apriva, si giocava, e non si vinceva
   mai. Il guasto si scopriva mezz'ora dopo, guardando un bambino che
   non capiva perché.

   Questa funzione è il rimedio, e fa tre cose in quest'ordine:

     1. **rifiuta le chiavi che non esistono.** È la più importante:
        un refuso non è più un campo in più che nessuno legge, è un
        errore con scritto il nome del livello e cosa volevi dire
        («`obiettivi` non esiste — forse intendevi `obiettivo`?»).
     2. **pretende quello che ci vuole sempre** — id, nome, griglia,
        unità, fazioni, obiettivo.
     3. **riempie i valori normali**, così un livello scrive solo
        quello che ha di suo.

   Ed è **presto**: succede quando il file viene importato, non quando
   qualcuno arriva a quella tappa. Un livello rotto non arriva a
   schermo: rompe il build e i test.

   ── perché una funzione e non uno schema ──
   Perché il repo è JavaScript e resta JavaScript: nessun compilatore,
   nessuna dipendenza, niente da imparare. Il `@typedef` qui sotto dà
   l'autocompletamento nell'editor senza che nulla cambi a runtime, e
   il controllo vero lo fa questa chiamata. Chi legge un livello vede
   `livello({ … })` e sa che quell'oggetto è stato guardato.

   ── e cosa NON fa ──
   Non controlla che il livello si possa vincere: quello lo fa il banco
   di prova (`test/aiuto/livello.mjs`), che lo **gioca**. Qui si guarda
   la forma, lì la sostanza.
   ═══════════════════════════════════════════════════════════════════ */

/**
 * @typedef {Object} Livello
 * @property {string} id            la chiave dei progressi: NON si rinomina mai
 * @property {string} nome          come si chiama a schermo
 * @property {string} [idea]        cosa insegna, in una riga
 * @property {string} [dritta]      la riga sotto la scena
 * @property {string} [racconto]    la spiegazione lunga del 💡
 * @property {string[]} [aiuti]     i suggerimenti a scalare
 * @property {string[]} griglia     le righe della mappa: '#' muro, il resto pavimento
 * @property {string} [ambiente]    quale stanza la veste (`grafica/ambienti/`)
 * @property {number} [prove]       su quanti mondi si prova il piano
 * @property {Object<string,string>} [nomi]     id → come si chiama in una frase
 * @property {Object} [posti]       i punti con un nome
 * @property {Object} [porte]       i varchi
 * @property {Object} [leve]        i congegni che si premono
 * @property {Object} [totem]       i congegni che contano
 * @property {Object[]} [oggetti]   le cose da raccogliere
 * @property {string[]} [segnali]   quali segnali sono in gioco
 * @property {Object[]} unita       chi c'è sul campo
 * @property {Object} fazioni       chi comanda chi
 * @property {string[]} [complementi] quali cose si possono nominare
 * @property {string[]} [verbi]     quali verbi offre la cassetta
 * @property {boolean} [celle]      si possono nominare anche le caselle nude
 * @property {Object[]} obiettivo   quando è vinta
 * @property {Object[]} [sconfitta] quando è persa
 * @property {string} [motivoSconfitta]
 * @property {Object[]} [varianti]  le altre scene: almeno tre
 * @property {Object[]} [soluzioni] la promessa che si può chiudere
 * @property {number} [par]         con quanti ordini
 * @property {Object[]} [scenografia] roba che sta lì e basta
 * @property {Object} [verifiche]   cosa questo livello ha di suo (lo legge il banco)
 */

/* i campi ammessi, con il loro valore normale quando ne hanno uno.
   `undefined` vuol dire «ammesso, ma non si mette se non serve». */
const CAMPI = {
  id: undefined, nome: undefined, idea: undefined,
  dritta: undefined, racconto: undefined, aiuti: undefined,
  scena: undefined,
  /* ── `intera` NON ESISTE PIÙ ──
     Era un tetto: «questa mappa deve starci tutta nello schermo», e su
     un telefono starci tutta vuol dire celle da ventidue pixel, cioè
     al massimo diciassette colonne. Chi scriveva un livello finiva per
     disegnare stanzette per rispettare un vincolo che nessuno gli aveva
     chiesto — è successo per un pomeriggio intero.
     Le mappe grandi il motore le ha sempre gestite: si trascinano, e le
     frecce sul bordo dicono chi è fuori campo. Una stanza che non ci
     sta in uno schermo non è un difetto, è una stanza grande — ed è
     anche quello che fa nascere i piani lunghi, perché la distanza fra
     due cose diventa parte del lavoro. */
  ambiente: 'corridoio', prove: 3, campoAperto: false,
  /* ── QUANTO SI VEDE AL BUIO ──
     Un tetto sulla vista, in celle: `min(vista dichiarata, questo)`. Non
     si deriva dall'ambiente — il `buio` che sta in `grafica/ambienti/` è
     l'opacità di un velo, tarata per come si legge a schermo, e sarebbe
     una regola di gioco presa da un numero di disegno. Qui è un input
     esplicito, nello spirito di `calcoli`/`cap` del castello.
     Chi non lo dichiara ci vede come sempre: senza questo default a
     infinito, accendere il buio avrebbe cambiato sotto i piedi ogni
     livello scritto finora, perché `vedi` sta dappertutto — nelle
     uscite dei cicli, nelle attese, nelle reazioni dei nemici. */
  vistaAlBuio: undefined,
  nomi: undefined, segnali: undefined, scenografia: undefined,
  complementi: undefined, verbi: undefined,
  /* ── INDICARE UN PUNTO SI PUÒ SEMPRE ──
     Era `false`, e voleva dire che in quasi tutti i livelli «vai lì
     dietro quel muro» non si poteva dire: l'elenco offriva solo i nomi.
     Ma il motore una casella libera la accetta **sempre** — sta scritto
     in `Mondo.laCosa`: «se il dito può indicarla, l'ordine deve poterla
     dire» — e l'editor legge `celle !== false`, cioè è scritto per
     essere acceso di default. Erano due pezzi che dicevano il
     contrario, e a perderci era `vai`, che senza la mappa sa fare metà
     di quello che sa fare.
     Chi vuole una cassetta stretta lo spegne a mano (`celle: false`),
     e resta una scelta dichiarata invece di un default che nessuno
     aveva deciso. */
  celle: true, condizioni: undefined,
  vince: undefined, perde: undefined, motivoSconfitta: undefined,
  varianti: undefined, soluzioni: undefined, par: undefined,
  verifiche: undefined,
  /* questi li mettono i livelli delle storie, e li legge `mappe-storie.js` */
  storia: undefined, capitolo: undefined, emoji: undefined,
  forma: undefined, concetto: undefined, eredita: undefined, lascia: undefined,
  mostraNemici: undefined,
}

const OBBLIGATORI = ['id', 'nome', 'scena', 'vince']

/* «volevi dire questo?»: la distanza fra due parole, per suggerire il
   campo giusto invece di dire solo che quello scritto non esiste.
   Lo usa anche `scrivi.js`, per le opzioni di una cosa o di un'unità:
   è la stessa domanda un gradino più in basso. */
export function vicino (parola, candidati) {
  const dist = (a, b) => {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
    for (let j = 0; j <= b.length; j++) d[0][j] = j
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1,
                           d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    return d[a.length][b.length]
  }
  const piu = candidati.map(c => [c, dist(parola.toLowerCase(), c.toLowerCase())])
    .sort((x, y) => x[1] - y[1])[0]
  return piu && piu[1] <= 3 ? piu[0] : null
}

/** @param {Livello} d @returns {Livello} */
export function livello (d) {
  const chi = d && (d.id || d.nome) ? `«${d.id || d.nome}»` : 'un livello senza id'
  if (!d || typeof d !== 'object') throw new Error(`livello: ${chi} non è un oggetto`)

  for (const k of Object.keys(d)) {
    if (k in CAMPI) continue
    const forse = vicino(k, Object.keys(CAMPI))
    throw new Error(`livello ${chi}: «${k}» non è un campo di un livello` +
                    (forse ? ` — forse intendevi «${forse}»?` : ''))
  }
  for (const k of OBBLIGATORI)
    if (d[k] === undefined) throw new Error(`livello ${chi}: manca «${k}»`)

  /* la mappa dev'essere rettangolare, e ogni riga un numero pari di
     caratteri: una cella sono due. Una riga storta a schermo diventa
     un muro dove non c'è. */
  const celle = (d.scena.righe || []).map(r => String(r).replace(/\|/g, ''))
  const dispari = celle.findIndex(r => r.length % 2)
  if (dispari >= 0)
    throw new Error(`livello ${chi}: la riga ${dispari} ha un numero dispari di caratteri — ` +
                    'una cella sono due')
  const storte = celle.map((r, y) => [y, r.length]).filter(([, l]) => l !== celle[0].length)
  if (storte.length)
    throw new Error(`livello ${chi}: la mappa non è rettangolare — la riga 0 è larga ` +
                    `${celle[0].length / 2} celle, la riga ${storte[0][0]} ne ha ` +
                    `${storte[0][1] / 2}`)

  /* almeno una fabbrica `chi.nostro`: senza, il gioco non sa chi
     comandi. Una voce può essere una lista — due cose sulla stessa
     cella, l'eroe che parte dentro il rifugio — quindi si guarda in
     piano. */
  const voci = [
    ...Object.values(d.scena.legenda || {}),
    ...(d.varianti || []).flatMap(v => Object.values(v.metti || {})),
  ].flat()
  if (!voci.some(v => v && v.parte === 'giocatore'))
    throw new Error(`livello ${chi}: nessuno è del giocatore — serve almeno un «chi.nostro»`)
  for (const [t, v0] of Object.entries(d.scena.legenda || {}))
    for (const v of (Array.isArray(v0) ? v0 : [v0]))
    if (!v || !v.genere)
      throw new Error(`livello ${chi}: il token «${t}» non viene da una fabbrica ` +
                      '(cose.*, chi.*): scrivilo con quelle, non a mano')

  /* ── NESSUN TOKEN ORFANO ──
     Un token che non compare né in legenda né in una scena non è un
     posto preparato: è un refuso, e senza questo controllo diventerebbe
     pavimento in silenzio. */
  const spiegati = new Set([
    ...Object.keys(d.scena.legenda || {}),
    ...(d.varianti || []).flatMap(v => [
      ...Object.keys((v.scena && v.scena.legenda) || {}),
      ...Object.keys(v.metti || {}),
    ]),
    '##', '..',
  ])
  const orfani = new Set()
  for (const riga of celle)
    for (let i = 0; i < riga.length; i += 2) {
      const tk = riga.slice(i, i + 2)
      if (!spiegati.has(tk)) orfani.add(tk)
    }
  if (orfani.size)
    throw new Error(`livello ${chi}: nella mappa c'è «${[...orfani].join('», «')}» ` +
                    'che nessuna scena spiega — è un refuso, o manca la voce in legenda')

  const fuori = { ...d }
  for (const [k, v] of Object.entries(CAMPI))
    if (v !== undefined && fuori[k] === undefined) fuori[k] = v
  return fuori
}
