/* ═══════════════════════════════════════════════════════════════════
   IL CATALOGO — tutte le domande che il gioco sa fare, in fila.

   Fin qui i moduli si potevano guardare solo **una domanda alla volta e
   a caso**: il tasto «prova» della schermata dei grandi ne apriva una,
   poi un'altra, e per capire se una tipologia era tarata bene bisognava
   insistere finché non ricapitava. Non si vedeva mai l'insieme: quante
   ne esistono, a che difficoltà stanno, quali si somigliano.

   Questo file mette in fila le CLASSI. Una classe di domande è la terna
   (modulo, grado, tipologia) — «📝 Problemi, grado 3, le parti uguali» —
   ed è la stessa unità che `nucleo/classi.js` pesca quando un gioco
   chiede una domanda. Il catalogo non inventa niente: mostra quello che
   c'è già, ordinato per come lo incontrerebbe un bambino.

   LA DIFFICOLTÀ È QUELLA VERA, e non un'etichetta scritta a mano da
   qualche parte: è `postoDelGrado(grado, gradi, scala)`, cioè lo stesso
   0..1 con cui i giochi pescano. La scaletta di un modulo si stende
   dentro l'arco che il modulo dichiara — da un quarto in su per la roba
   di scuola, più in basso per chi comincia adesso — e siccome i moduli
   hanno numeri di gradi diversi (quattro l'orologio, sei i problemi), è
   l'unico modo di confrontare due domande di materie diverse. Se un
   giorno la scaletta di un modulo si allunga, o il suo arco si sposta,
   la difficoltà delle sue classi si muove da sé: non c'è un secondo
   posto da aggiornare.

   UNA TIPOLOGIA COMPARE PIÙ VOLTE se esce a più gradi, ed è giusto così:
   «le ore intere» al grado 1 e al grado 4 sono la stessa tipologia ma
   non la stessa domanda — al grado 4 escono una volta su trenta, in
   mezzo ai minuti spicci. Il `peso` di quella riga lo dice.

   NON IMPORTA NIENTE, come `classi.js` ed `esempi.js`: gira in Node, e
   `test/unita/catalogo` ci conta sopra senza browser. Il registro dei
   moduli lo mette chi chiama (`quiz/catalogo.js` sotto Vite).
   ═══════════════════════════════════════════════════════════════════ */

import { pesoDi, bersaglio, finestraDi, anniDelLivello,
         livelloDegliAnni, MIRA_SOTTO } from './classi.js'

/* Le fasce, che adesso sono **età** e non gradini astratti. Servono a
   due cose diverse e conviene tenerle a mente tutte e due: a
   **dividere l'elenco** in blocchi leggibili, e a **pescare** come
   pescherebbe un gioco per un bambino di quell'età. La prima è una
   sistemazione, la seconda è il gioco vero — ed è la domanda che un
   genitore si fa davvero: *cosa becca il mio, che ha otto anni?*

   `eta` è il bambino tipo della fascia, `fino` dove finisce il blocco
   nell'elenco (esclusa, come tutte le età qui dentro). */
export const FASCE = [
  { chiave: 'piccoli', nome: 'Prima della scuola', eta: 5, fino: 25 },
  { chiave: 'facili', nome: 'Prima e seconda', eta: 6.5, fino: 50 },
  { chiave: 'medie', nome: 'Terza e quarta', eta: 8.5, fino: 75 },
  { chiave: 'toste', nome: 'Quinta e oltre', eta: 10.5, fino: 101 },
]

/* la fascia di un livello: `fino` è il livello dove il blocco finisce,
   sulla stessa scala 0..100 delle domande */
export const fasciaDi = livello => FASCE.find(f => livello < f.fino) || FASCE[FASCE.length - 1]

/* ── DOVE CADE UNA DOMANDA RISPETTO A UN BAMBINO ──
   Le `FASCE` qui sopra sono assolute: dicono in che anno di scuola sta
   una domanda, e valgono uguali per tutti. Queste altre cinque sono
   **relative a chi gioca**, ed è la sola cosa che un grande guarda
   davvero aprendo la schermata: *a mio figlio cosa arriva, e cosa gli
   state togliendo?*

     [troppo facili] [facili] [nel segno] [difficili] [troppo difficili]

   I due estremi sono le domande **escluse** — fuori dall'ammissione di
   `finestraDi` — e si mostrano lo stesso: un elenco che nasconde quello
   che ha tolto non fa vedere *che* l'ha tolto, ed è esattamente la cosa
   che un genitore deve poter smentire.

   Stava dentro `quiz/catalogo.js`, che è il ponte con la schermata.
   Adesso sta qui perché lo chiedono in due — l'elenco delle domande e
   il quadro di un'età (`data/quadro.js`) — e due copie degli stessi
   confini sono due tarature che prima o poi divergono, senza che niente
   diventi rosso. */
export const FASCE_ETA = [
  { chiave: 'sotto', nome: 'Troppo facili', che: 'tolte: le indovinerebbe senza pensarci' },
  { chiave: 'facili', nome: 'Facili', che: 'roba che sa già fare: esce quando il gioco chiede poco' },
  { chiave: 'medie', nome: 'Nel segno', che: 'la sua misura: sono quelle che vede più spesso' },
  { chiave: 'toste', nome: 'Difficili', che: 'un passo avanti: escono quando il gioco chiede molto' },
  { chiave: 'sopra', nome: 'Troppo difficili', che: 'tolte: non ha ancora di che ragionarle' },
]

/* Il blocco di mezzo è **stretto**: da un anno sotto a mezzo anno
   sopra. Non è la mira della pesca (quella arriva a un anno e mezzo
   sopra): è quello che serve a un occhio umano, cioè tre blocchi di
   dimensione paragonabile. Con il confine alto sulla mira il blocco
   centrale si mangiava tre quarti delle righe, e un elenco dove tutto
   sta nello stesso posto non è un elenco. */
const SEGNO_SOPRA = 6

/* Si chiede il classificatore una volta e lo si usa su tutte le righe:
   la finestra dipende dall'età e non dalla riga, e ricalcolarla
   duecento volte per disegnare un elenco è lavoro buttato. */
export function doveCadeCon (eta) {
  const qui = livelloDegliAnni(eta)
  const finestra = finestraDi(eta)
  if (!finestra) return () => 'medie'
  const [giu, su] = finestra
  return livello =>
    livello < giu ? 'sotto'
      : livello > su ? 'sopra'
        : livello < qui - MIRA_SOTTO ? 'facili'
          : livello > qui + SEGNO_SOPRA ? 'toste' : 'medie'
}

/* ── le classi di un modulo ──
   Una riga per (grado, tipologia). I moduli che le tipologie non le
   dichiarano — restano quelli vecchi — hanno una riga per grado, e il
   nome è la riga di scaletta: è il nome più preciso che hanno.

   `sorgente` è tutto quello che serve per **rigenerare** quella domanda,
   e ha la stessa forma che vuole `esempi.js`: così il pannello di prova
   riceve una riga del catalogo e non deve sapere altro. */
export function classiDelModulo(modulo) {
  const fuori = []
  for (let g = 1; g <= modulo.gradi; g++) {
    const scaletta = modulo.scaletta[g - 1] || ''
    const tipi = modulo.tipiDi(g)
    if (tipi.length) {
      /* La riga di scaletta descrive il GRADO, non la tipologia: dove un
         grado ne mescola due o tre, scriverla accanto a ognuna dice una
         cosa falsa — «Quello che arriva si somma · quello che va via si
         toglie». Si mostra solo quando il grado è tutto di quella
         tipologia, e nemmeno allora se ripete il nome. */
      const sola = tipi.length === 1
      for (const t of tipi)
        fuori.push(voce(modulo, g, {
          tipo: t.chiave, nome: t.nome, sa: t.sa, peso: t.peso,
          scaletta: sola ? scaletta : '',
        }))
    } else {
      fuori.push(voce(modulo, g, { tipo: null, nome: scaletta, sa: modulo.serve(g), peso: 1, scaletta }))
    }
  }
  return fuori
}

/* due frasi dicono la stessa cosa se una contiene l'altra, a meno di
   maiuscole e articoli: serve solo a decidere se scriverne una sola */
const nudo = s => String(s || '').toLowerCase().replace(/[^a-zà-ù ]/g, ' ').replace(/\s+/g, ' ').trim()
const ripete = (a, b) => {
  const [x, y] = [nudo(a), nudo(b)]
  return !!x && !!y && (x.includes(y) || y.includes(x))
}

function voce(modulo, grado, { tipo, nome, sa, peso, scaletta }) {
  /* il livello della tipologia se se l'è dichiarato, se no quello del
     suo grado: è il numero che decide se questa domanda arriva a un
     bambino o no, ed è il motivo per cui questa riga esiste */
  const t = modulo.tipi.find(x => x.chiave === tipo)
  const livello = t ? modulo.livelloDelTipo(t, grado) : modulo.livelli[grado - 1]
  return {
    /* per rigenerarla: la stessa forma delle sorgenti di `esempi.js` */
    sorgente: { modulo, grado, tipo, nome },
    livello,
    /* la stessa cosa detta in anni, che è la lingua della schermata dei
       grandi: nessun genitore giudica un «54», tutti giudicano «otto
       anni e mezzo» */
    anni: Math.round(anniDelLivello(livello) * 10) / 10,
    /* per mostrarla */
    chiave: `${modulo.id}:${grado}:${tipo || 'grado'}`,
    modulo: modulo.id,
    icona: modulo.icona,
    nomeModulo: modulo.nome,
    materia: modulo.materia,
    grado,
    gradi: modulo.gradi,
    tipo,
    nome,
    /* la riga di scaletta si tace quando ripete il nome della tipologia:
       «Le parti uguali · le parti uguali» è solo rumore, e succede
       spesso perché una tipologia si chiama quasi sempre come la riga
       che la descrive — basta che una contenga l'altra */
    scaletta: scaletta && !ripete(scaletta, nome) ? scaletta : '',
    sa: [...sa],
    /* l'ha dichiarato lei, o è quello del suo grado? */
    suo: !!(t && Number.isFinite(t.livello)),
    /* quanto spesso esce **dentro** il suo grado, quando il grado è
       toccato a lei: 1 se è l'unica, meno se se lo divide */
    peso,
    fascia: fasciaDi(livello).chiave,
  }
}

/* ── tutto il catalogo, modulo per modulo ──
   L'ordine è quello dei moduli come arrivano (il registro li legge
   dalla cartella, quindi alfabetico) e dentro ognuno dal grado più
   facile al più difficile: è la scaletta che abbiamo disegnato, letta
   dall'alto. `spenti` non toglie niente dall'elenco — un catalogo che
   nasconde quello che il genitore ha spento non gli fa più vedere cosa
   ha spento — ma lo **segna**, e chi mostra decide se sbiadirlo. */
export function catalogoDi(moduli, { spenti = [], giudizi = [] } = {}) {
  const detti = contaGiudizi(giudizi)
  return moduli.map(m => {
    const classi = classiDelModulo(m).map(c => ({
      ...c,
      spenta: c.sa.some(s => spenti.includes(s)) || (c.tipo ? spenti.includes(c.tipo) : false),
      /* cosa ne è stato detto giocando: vale più di qualunque età che
         le abbiamo assegnato noi (vedi `contaGiudizi`) */
      detti: detti.get(c.tipo) || null,
    }))
    return {
      id: m.id,
      nome: m.nome,
      icona: m.icona,
      materia: m.materia,
      chiaro: m.chiaro,
      gradi: m.gradi,
      classi,
      /* da che età a che età arriva questo modulo: due numeri che sulla
         testata dicono a colpo d'occhio se è roba da prima elementare o
         da quinta, e che si stringono quando un genitore spegne
         qualcosa. */
      da: classi.length ? Math.min(...classi.map(c => c.livello)) : 0,
      a: classi.length ? Math.max(...classi.map(c => c.livello)) : 0,
      livelloDichiarato: !!m.livelloDichiarato,
      spente: classi.filter(c => c.spenta).length,
    }
  })
}

/* ── quello che è stato detto giocando ──
   Il quaderno dei giudizi (`store/giudizi.js`) annota, quando
   l'interruttore è acceso, i tre verdetti che un grande dà a una domanda
   comparsa a schermo: 😴 troppo facile, 😰 troppo difficile, 🐛 storta.
   Ogni voce si porta dietro la `chiave` della domanda, che è la chiave
   della tipologia — quindi combacia esattamente con le righe di questo
   catalogo.

   Perché conta averli qui: la difficoltà che si legge di fianco a una
   riga è quella che le **abbiamo assegnato noi**, e una tipologia con
   tre 😰 addosso sta dicendo che l'abbiamo assegnata male. Il numero è
   la nostra intenzione, i giudizi sono cosa è successo davvero.

   La lista arriva già letta da fuori: questo file non tocca l'archivio,
   perché deve girare anche in Node. */
export function contaGiudizi(lista = []) {
  const fuori = new Map()
  for (const v of lista) {
    if (!v?.chiave || !v?.verdetto) continue
    const c = fuori.get(v.chiave) || { facile: 0, difficile: 0, storta: 0, quanti: 0 }
    if (c[v.verdetto] === undefined) continue
    c[v.verdetto]++
    c.quanti++
    fuori.set(v.chiave, c)
  }
  return fuori
}

/* ── il giro di una fascia ──
   Le classi di tutti i moduli che stanno in quella fascia, in ordine di
   difficoltà e poi di modulo: è la lista che il pannello di prova scorre
   quando si chiede «fammele vedere tutte». Le spente restano fuori: qui
   non si sta guardando cosa esiste, si stanno guardando le domande che
   **arriverebbero**. */
export function giroDellaFascia(moduli, fascia, { spenti = [] } = {}) {
  return catalogoDi(moduli, { spenti })
    .flatMap(m => m.classi)
    .filter(c => c.fascia === fascia && !c.spenta)
    .sort((x, y) => x.livello - y.livello || x.modulo.localeCompare(y.modulo))
}

/* quanto pesa una classe per un bambino di quell'età, con la manopola a
   metà: serve solo a raccontarlo nel pannello («a otto anni esce una
   volta su venti»), e il conto è quello di `classi.js` — non una
   copia. */
export const quantoEsce = (classe, eta, difficolta = 0.5) =>
  pesoDi(classe.livello, bersaglio(difficolta, finestraDi(eta)))
