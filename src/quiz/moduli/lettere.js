/* ═══════════════════════════════════════════════════════════════════
   LE PRIME LETTERE — il mazzo di chi sta imparando a leggere.

   È il primo modulo che non sta sulla scala di scuola. Tutti gli altri
   partono da un quarto della manopola in su (`SCALA_SCUOLA`) perché
   danno per scontata una cosa che nessun macrogruppo di `data/saperi.js`
   sapeva dire: **che il bambino legga la consegna**. «Qual è il
   contrario di indietro?» a chi fa la prima elementare non è difficile,
   è muta — non è una domanda di italiano, è una prova di lettura
   travestita — e a lungo la fascia sei-sette anni si è ritrovata solo
   giochi da guardare, perché ogni gioco a domande le chiedeva quella.

   Qui la consegna è sempre la stessa e sempre corta, e quello che si
   guarda è una figura o una parola sola scritta grande. Chi non legge
   ancora niente riconosce le figure; chi comincia a leggere ci prova; e
   la parola scritta è **stampatello maiuscolo**, che è l'unico alfabeto
   che a scuola hanno visto tutti a novembre.

   DOVE STA SULLA MANOPOLA. `scala: [0, 0.22]`, cioè tutto il mazzo sta
   sotto il primo gradino della roba di scuola. Non è un'etichetta di
   comodo: serve a due cose in una. Un bambino di sei anni riceve queste
   e non quelle di terza; e uno di quinta, che si è guadagnato una carta
   tosta nel dungeon, non si vede arrivare «con che lettera comincia
   🐝?» come premio — che sarebbe un premio preso in giro. Il taglio lo
   fa la fascia del bambino in `quiz/scelta.js`; qui si dichiara solo
   dove sta la scaletta.

   LE PAROLE STANNO QUI E NON IN `data/words.js`. Quel file serve
   all'inglese, e le sue voci vanno bene per il gioco «quale figura è
   dog»: se l'emoji è un po' generica non fa danno, perché la parola
   inglese è scritta accanto. Qui invece **l'emoji è la domanda**: se
   🐰 si può chiamare coniglio o lepre, «con che lettera comincia» ha
   due risposte e nessuna delle due è sbagliata. Le settanta voci qui
   sotto sono scelte una per una perché un bambino italiano le chiami in
   un modo solo.
   ═══════════════════════════════════════════════════════════════════ */

import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo, emoji } from '../nucleo/domanda.js'

/* [parola, emoji, gruppo, sillaba iniziale].

   Il gruppo serve ai falsi: una figura sbagliata presa dallo stesso
   scaffale (un altro animale, un'altra frutta) obbliga a leggere la
   parola, mentre una presa a caso si scarta perché «non c'entra
   niente» — e allora la domanda non misura più la lettura.

   La sillaba iniziale è scritta e non calcolata: quasi sempre sarebbe
   consonante più vocale, ma «gnomo», «scarpa» e «chiave» no, e un conto
   che indovina sbaglia proprio le parole che i bambini trovano
   difficili. */
export const PAROLE = [
  /* ── animali ── */
  ['cane', '🐶', 'animali', 'CA'],
  ['gatto', '🐱', 'animali', 'GA'],
  ['topo', '🐭', 'animali', 'TO'],
  ['rana', '🐸', 'animali', 'RA'],
  ['pesce', '🐟', 'animali', 'PE'],
  ['ape', '🐝', 'animali', 'A'],
  ['mucca', '🐮', 'animali', 'MU'],
  ['cavallo', '🐴', 'animali', 'CA'],
  ['pecora', '🐑', 'animali', 'PE'],
  ['gallina', '🐔', 'animali', 'GAL'],
  ['leone', '🦁', 'animali', 'LE'],
  ['tigre', '🐯', 'animali', 'TI'],
  ['orso', '🐻', 'animali', 'OR'],
  ['lupo', '🐺', 'animali', 'LU'],
  ['volpe', '🦊', 'animali', 'VOL'],
  ['farfalla', '🦋', 'animali', 'FAR'],
  ['tartaruga', '🐢', 'animali', 'TAR'],
  ['serpente', '🐍', 'animali', 'SER'],
  ['elefante', '🐘', 'animali', 'E'],
  ['giraffa', '🦒', 'animali', 'GI'],
  ['zebra', '🦓', 'animali', 'ZE'],
  ['delfino', '🐬', 'animali', 'DEL'],
  ['balena', '🐳', 'animali', 'BA'],
  ['polpo', '🐙', 'animali', 'POL'],
  ['granchio', '🦀', 'animali', 'GRAN'],
  ['lumaca', '🐌', 'animali', 'LU'],
  ['formica', '🐜', 'animali', 'FOR'],
  ['ragno', '🕷️', 'animali', 'RA'],
  ['coniglio', '🐰', 'animali', 'CO'],
  ['pinguino', '🐧', 'animali', 'PIN'],
  ['gufo', '🦉', 'animali', 'GU'],
  ['maiale', '🐷', 'animali', 'MA'],
  ['scimmia', '🐵', 'animali', 'SCIM'],
  /* ── da mangiare ── */
  ['mela', '🍎', 'cibo', 'ME'],
  ['banana', '🍌', 'cibo', 'BA'],
  ['uva', '🍇', 'cibo', 'U'],
  ['fragola', '🍓', 'cibo', 'FRA'],
  ['limone', '🍋', 'cibo', 'LI'],
  ['pera', '🍐', 'cibo', 'PE'],
  ['carota', '🥕', 'cibo', 'CA'],
  ['pane', '🍞', 'cibo', 'PA'],
  ['formaggio', '🧀', 'cibo', 'FOR'],
  ['torta', '🍰', 'cibo', 'TOR'],
  ['pizza', '🍕', 'cibo', 'PIZ'],
  ['gelato', '🍦', 'cibo', 'GE'],
  ['latte', '🥛', 'cibo', 'LAT'],
  ['uovo', '🥚', 'cibo', 'UO'],
  ['fungo', '🍄', 'cibo', 'FUN'],
  ['miele', '🍯', 'cibo', 'MIE'],
  /* ── cose ── */
  ['casa', '🏠', 'cose', 'CA'],
  ['letto', '🛏️', 'cose', 'LET'],
  ['sedia', '🪑', 'cose', 'SE'],
  ['libro', '📕', 'cose', 'LI'],
  ['matita', '✏️', 'cose', 'MA'],
  ['forbici', '✂️', 'cose', 'FOR'],
  ['chiave', '🔑', 'cose', 'CHIA'],
  ['martello', '🔨', 'cose', 'MAR'],
  ['palla', '⚽', 'cose', 'PAL'],
  ['tamburo', '🥁', 'cose', 'TAM'],
  ['chitarra', '🎸', 'cose', 'CHI'],
  ['telefono', '📱', 'cose', 'TE'],
  ['ombrello', '☂️', 'cose', 'OM'],
  ['scarpa', '👟', 'cose', 'SCAR'],
  ['cappello', '🎩', 'cose', 'CAP'],
  ['regalo', '🎁', 'cose', 'RE'],
  ['candela', '🕯️', 'cose', 'CAN'],
  /* ── che si muovono ── */
  ['treno', '🚂', 'mezzi', 'TRE'],
  ['barca', '⛵', 'mezzi', 'BAR'],
  ['aereo', '✈️', 'mezzi', 'A'],
  ['razzo', '🚀', 'mezzi', 'RAZ'],
  ['bicicletta', '🚲', 'mezzi', 'BI'],
  /* ── fuori ── */
  ['sole', '☀️', 'fuori', 'SO'],
  ['luna', '🌙', 'fuori', 'LU'],
  ['stella', '⭐', 'fuori', 'STEL'],
  ['nuvola', '☁️', 'fuori', 'NU'],
  ['fiore', '🌸', 'fuori', 'FIO'],
  ['albero', '🌳', 'fuori', 'AL'],
  ['foglia', '🍃', 'fuori', 'FO'],
  ['neve', '❄️', 'fuori', 'NE'],
  ['fuoco', '🔥', 'fuori', 'FUO'],
]

const parola = v => v[0]
const icona = v => v[1]
const gruppo = v => v[2]
const sillaba = v => v[3]
const iniziale = v => v[0][0].toUpperCase()
const scritta = v => v[0].toUpperCase()

/* ── i falsi della lettera iniziale ──
   Non lettere a caso: quelle che un bambino di sei anni scambia
   davvero, e sono due specie diverse. Quelle che **suonano vicine**
   (P e B, T e D, F e V: cambia solo la voce) e quelle che si
   **assomigliano scritte** (M e N, E e F). Una lettera presa a caso si
   scarta senza sapere niente, e la domanda diventa un tiro a sorte fra
   due. */
const CONFUSE = {
  A: 'EO', B: 'PDV', C: 'GQ', D: 'BTP', E: 'AF', F: 'VE', G: 'CQ',
  H: 'NM', I: 'LJ', L: 'IR', M: 'NW', N: 'MH', O: 'AQ', P: 'BQD',
  Q: 'OGP', R: 'PL', S: 'ZC', T: 'DF', U: 'VO', V: 'FUB', Z: 'SN',
}

class Lettere extends Modulo {
  constructor() {
    super({
      id: 'lettere',
      nome: 'Le prime lettere',
      icona: '🅰️',
      materia: 'italiano',
      chiaro: 'riconoscere le lettere, e leggere una parola corta invece di indovinarla dalla prima lettera',
      /* Tre gradini e non cinque: sotto la scala di scuola c'è poco
         spazio (`scala`), e tre passi veri valgono più di cinque
         sfumature che nessuno distingue. Il salto che conta è il
         secondo: dalla lettera sola alla parola intera. */
      scaletta: [
        'con che lettera comincia',
        'leggere la parola, e trovare la figura',
        'la sillaba iniziale, dove la prima lettera non basta',
      ],
      /* QUANTO È COMPLICATO OGNI GRADO, da 0 a 100 — la scala è una
         sola per tutte le materie, e serve a confrontare questa riga
         con quelle di tutti gli altri moduli. Zero è il primo giorno
         di materna, cento la fine della primaria: dodici punti e mezzo
         per anno di scuola. Non dice a chi arriva — quello lo decide
         la finestra dell'età di chi gioca (`nucleo/classi.js`). */
      livelli: [12, 25, 29],
      scala: [0, 0.22],
      tipi: [
        { chiave: 'let:iniziale', nome: 'Con che lettera comincia', sa: 'lettura',
          gradi: { 1: 1, 2: 0.25, 3: 0.1 } },
        { chiave: 'let:leggi', nome: 'Leggere la parola, non solo la prima lettera', sa: 'lettura',
          gradi: { 2: 0.75, 3: 0.4 } },
        { chiave: 'let:sillaba', nome: 'La sillaba iniziale', sa: 'lettura',
          gradi: { 3: 0.5 } },
      ],
    })
  }

  genera(grado, sorte, tipo) {
    switch (tipo) {
      /* al secondo gradino solo parole corte: una parola di tre sillabe
         a chi ne decifra una alla volta è un'altra domanda, e infatti sta
         un gradino più su */
      case 'let:leggi': return this.leggi(sorte, grado <= 2)
      case 'let:sillaba': return this.sillabaIniziale(sorte)
      default: return this.primaLettera(sorte)
    }
  }

  /* ── grado 1: con che lettera comincia ──
     La figura è la domanda, e non c'è niente da leggere: si guarda, si
     dice il nome dentro di sé, si ascolta come comincia. È il compito
     della prima elementare, ed è anche l'unico modo di fare una domanda
     di italiano a chi non legge ancora. */
  primaLettera(sorte) {
    const voce = sorte.uno(PAROLE)
    const buona = iniziale(voce)
    const vicine = (CONFUSE[buona] || '').split('')
    const ultima = scritta(voce).slice(-1)
    /* la lettera finale è il falso più onesto che ci sia: è il secondo
       posto dove un bambino guarda quando non è sicuro */
    const candidati = [...new Set([...vicine, ultima])].filter(l => l !== buona)
    const altre = PAROLE.map(iniziale).filter(l => l !== buona && !candidati.includes(l))
    const falsi = [...sorte.mescola(candidati), ...sorte.mescola([...new Set(altre)])].slice(0, 2)
    return domanda({
      testo: 'Con che lettera comincia?',
      soggetto: emoji(icona(voce)),
      buona: testo(buona),
      falsi: falsi.map(l => testo(l, l === ultima
        ? `con questa ${parola(voce)} finisce, non comincia`
        : `${parola(voce)} non comincia così`)),
      chiave: 'let:iniziale',
      aiuto: `${scritta(voce)}: comincia con ${buona}`,
      sorte,
    })
  }

  /* ── grado 2: leggere la parola ──
     Il falso che conta è quello che comincia con la stessa lettera: chi
     legge solo la prima e tira a indovinare sbaglia, chi legge fino in
     fondo no. È l'errore vero di quest'età, e senza quel distrattore la
     domanda si risolve senza leggere niente. */
  leggi(sorte, corte = false) {
    const mazzo = corte ? PAROLE.filter(v => parola(v).length <= 6) : PAROLE
    const voce = sorte.uno(mazzo)
    const stessaLettera = mazzo.filter(v =>
      iniziale(v) === iniziale(voce) && parola(v) !== parola(voce))
    const stessoScaffale = mazzo.filter(v =>
      gruppo(v) === gruppo(voce) && parola(v) !== parola(voce) && !stessaLettera.includes(v))
    const resto = mazzo.filter(v =>
      parola(v) !== parola(voce) && !stessaLettera.includes(v) && !stessoScaffale.includes(v))

    const falsi = []
    if (stessaLettera.length) falsi.push(sorte.uno(stessaLettera))
    falsi.push(...sorte.alcuni(stessoScaffale, Math.min(2, stessoScaffale.length)))
    for (const v of sorte.mescola(resto)) {
      if (falsi.length >= 3) break
      falsi.push(v)
    }

    return domanda({
      testo: 'Che cos\'è?',
      soggetto: testo(scritta(voce)),
      buona: emoji(icona(voce)),
      falsi: falsi.slice(0, 3).map(v => emoji(icona(v), iniziale(v) === iniziale(voce)
        ? `questa è ${parola(v)}: comincia uguale, ma poi va avanti diversa`
        : `questa è ${parola(v)}`)),
      chiave: 'let:leggi',
      aiuto: `si legge tutta: ${scritta(voce).split('').join('-')}`,
      sorte,
    })
  }

  /* ── grado 3: la sillaba iniziale ──
     Lo stesso passo del grado 2 fatto al contrario, e più stretto: qui
     tutte le figure in campo cominciano con la stessa lettera, quindi
     la prima lettera non serve a niente e bisogna arrivare almeno alla
     vocale. È il gradino che porta alla lettura vera. */
  sillabaIniziale(sorte) {
    /* si parte da una lettera che ha almeno due sillabe diverse fra le
       parole che ci cominciano: se no non c'è niente da distinguere */
    const perLettera = new Map()
    for (const v of PAROLE) {
      const l = iniziale(v)
      if (!perLettera.has(l)) perLettera.set(l, [])
      perLettera.get(l).push(v)
    }
    const buone = [...perLettera.values()].filter(voci =>
      new Set(voci.map(sillaba)).size >= 2)
    if (!buone.length) return this.leggi(sorte)

    const gruppoVoci = sorte.uno(buone)
    const voce = sorte.uno(gruppoVoci)
    const diverse = gruppoVoci.filter(v => sillaba(v) !== sillaba(voce))
    const falsi = sorte.alcuni(diverse, Math.min(2, diverse.length))
    /* il terzo falso viene da fuori, così la domanda non si riduce mai a
       una scelta fra due */
    const fuori = PAROLE.filter(v =>
      iniziale(v) !== iniziale(voce) && sillaba(v) !== sillaba(voce))
    if (falsi.length < 3 && fuori.length) falsi.push(sorte.uno(fuori))

    return domanda({
      testo: `Quale comincia con ${sillaba(voce)}?`,
      buona: emoji(icona(voce)),
      falsi: falsi.map(v => emoji(icona(v),
        `${parola(v).toUpperCase()} comincia con ${sillaba(v)}`)),
      chiave: 'let:sillaba',
      aiuto: `${sillaba(voce)}-${scritta(voce).slice(sillaba(voce).length)}: la prima sillaba è ${sillaba(voce)}`,
      sorte,
    })
  }
}

export default new Lettere()
