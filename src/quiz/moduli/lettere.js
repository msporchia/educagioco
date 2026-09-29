// il mazzo di chi sta imparando a leggere: unico modulo sotto la scala di scuola (scala:[0,0.22]), parole scelte apposta perché l'emoji sia la domanda — vedi docs/apprendimento/quiz-moduli.md
import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo, emoji } from '../nucleo/domanda.js'

// [parola, emoji, gruppo, sillaba iniziale]. Il gruppo obbliga a leggere (un falso dello stesso scaffale non si scarta a occhio).
// La sillaba è scritta e non calcolata: un conto indovinerebbe consonante+vocale, ma «gnomo»/«scarpa»/«chiave» no.
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

// lettere davvero scambiate a sei anni: quelle che suonano vicine (P/B, T/D) e quelle simili scritte (M/N, E/F)
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
      // tre gradini e non cinque: sotto la scala di scuola c'è poco spazio, il salto che conta è il secondo (lettera → parola intera)
      scaletta: [
        'con che lettera comincia',
        'leggere la parola, e trovare la figura',
        'la sillaba iniziale, dove la prima lettera non basta',
      ],
      livelli: [12, 25, 29], // scala 0-100 comune a tutte le materie (vedi docs/apprendimento/quiz-livelli.md)
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
      // al secondo gradino solo parole corte: una di tre sillabe è un'altra domanda, e sta un gradino più su
      case 'let:leggi': return this.leggi(sorte, grado <= 2)
      case 'let:sillaba': return this.sillabaIniziale(sorte)
      default: return this.primaLettera(sorte)
    }
  }

  // la figura è la domanda, niente da leggere: unico modo di fare una domanda di italiano a chi non legge ancora
  primaLettera(sorte) {
    const voce = sorte.uno(PAROLE)
    const buona = iniziale(voce)
    const vicine = (CONFUSE[buona] || '').split('')
    const ultima = scritta(voce).slice(-1)
    // la lettera finale è il falso più onesto: il secondo posto dove un bambino guarda quando non è sicuro
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

  // il falso che conta è quello con la stessa lettera iniziale: chi legge solo quella e indovina sbaglia
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

  // tutte le figure cominciano con la stessa lettera: bisogna arrivare almeno alla vocale
  sillabaIniziale(sorte) {
    // parte da una lettera con almeno due sillabe diverse fra le parole che ci cominciano
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
    // il terzo falso viene da fuori, così non si riduce mai a una scelta fra due
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
