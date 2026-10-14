// Le tre strade di ogni classe (docs/sotterraneo/strade.md): un modo di giocare la stessa classe, con la sua roba, i suoi punti e il
// suo albero. Dato puro: le regole che le usano stanno in motore/strade.js e le gioca il banco (`--strada`). Non sono una
// scelta nel gioco: dicono cosa si può costruire, e il banco misura che nessuna domini e nessuna crolli.
//
// `arma`: le famiglie e le mani dell'arma di tutti i giorni (dati/eroi.js, FAMIGLIE). `mancina`: 'scudo', o nulla (con un'arma a
// due mani non c'è; una seconda arma leggera, la metà del braccio, valeva meno di uno scudo e la strada crollava). `punti`: dove vanno i punti delle caratteristiche
// in fila, come COME_LI_DA (dati/livelli.js). `abilita`: i nodi dell'albero in fila, come STRADA (motore/abilita.js): una che
// colpisce, la difesa o la cura entro il livello 4, e poi il resto.
export const STRADE = {
  mago: {
    guerriero: {
      nome: 'Guerriero', dice: 'Spada e scudo, poche magie toste: la Lama arcana colpisce con l\'intelligenza.',
      arma: { famiglie: ['spade'], mani: 1 }, mancina: 'scudo',
      punti: ['forza', 'intelligenza', 'destrezza', 'forza', 'tempra', 'destrezza', 'intelligenza', 'tempra'],
      abilita: ['lama-incantata', 'scudo-arcano', 'incanto', 'fonte-arcana', 'lama-di-fuoco', 'falciata-arcana', 'spada-del-mago',
                'lama-di-gelo', 'danza-arcana', 'raggio-arcano', 'mente-lucida'],
    },
    bacchetta: {
      nome: 'Bacchetta e scudo', dice: 'Colpisce meno forte, ma non è di carta: un po\' di forza per la difesa.',
      arma: { famiglie: ['bacchette'], mani: 1 }, mancina: 'scudo',
      punti: ['intelligenza', 'forza', 'destrezza', 'intelligenza', 'tempra', 'destrezza', 'forza', 'intelligenza'],
      abilita: ['dardo-di-fuoco', 'scudo-arcano', 'fiamma-viva', 'fonte-arcana', 'sfera-di-fuoco', 'esplosione', 'palla-di-fuoco',
                'brucia', 'mente-lucida', 'raggio-arcano'],
    },
    pura: {
      nome: 'Pura magia', dice: 'Il bastone a due mani e gli scudi magici dell\'Arcano: schiva e ha tanta vita.',
      arma: { famiglie: ['bacchette'], mani: 2 }, mancina: null,
      punti: ['intelligenza', 'destrezza', 'tempra', 'intelligenza', 'destrezza', 'tempra', 'intelligenza', 'tempra'],
      abilita: ['scudo-arcano', 'fonte-arcana', 'dardo-di-fuoco', 'raggio-arcano', 'fulmine', 'catena-di-fulmini', 'mente-lucida',
                'fiamma-viva', 'sfera-di-fuoco', 'esplosione', 'specchio'],
    },
  },
  cavaliere: {
    baluardo: {
      nome: 'Baluardo', dice: 'Spada e scudo, il ramo dello Scudo: forza e tempra, e non si smuove.',
      arma: { famiglie: ['spade'], mani: 1 }, mancina: 'scudo',
      punti: ['forza', 'tempra', 'forza', 'tempra', 'forza', 'destrezza', 'tempra', 'forza'],
      abilita: ['scudo-alzato', 'parata', 'spallata', 'bordo-a-punte', 'colpo-di-scudo', 'fortezza', 'muro', 'fendente', 'filo',
                'preghiera'],
    },
    spadone: {
      nome: 'Spadone', dice: 'L\'arma a due mani e la Lama con la Furia: colpisce forte e va avanti.',
      arma: { famiglie: ['spade', 'asce'], mani: 2 }, mancina: null,
      punti: ['forza', 'forza', 'tempra', 'forza', 'destrezza', 'forza', 'tempra', 'forza'],
      abilita: ['fendente', 'filo', 'colpo-furioso', 'rabbia', 'taglio-profondo', 'carica', 'affondo', 'macello', 'mulinello',
                'tempesta-di-colpi', 'turbine'],
    },
    paladino: {
      nome: 'Paladino', dice: 'Spada e Giuramento, un po\' di intelligenza per più preghiere e colpi sacri.',
      arma: { famiglie: ['spade'], mani: 1 }, mancina: 'scudo',
      punti: ['forza', 'tempra', 'forza', 'intelligenza', 'tempra', 'destrezza', 'forza', 'tempra'],
      abilita: ['preghiera', 'cuore-saldo', 'fendente', 'luce-sacra', 'mano-santa', 'grido', 'giudizio', 'ultimo-fiato', 'filo'],
    },
  },
  elfa: {
    arciera: {
      nome: 'Arciera', dice: 'L\'arco e il Bosco: destrezza, frecce da lontano e veleno.',
      arma: { famiglie: ['archi'], mani: 2 }, mancina: null,
      punti: ['destrezza', 'destrezza', 'tempra', 'destrezza', 'forza', 'destrezza', 'tempra', 'forza'],
      abilita: ['dardo-avvelenato', 'rovi', 'primo-tiro', 'linfa', 'freccia-di-fuoco', 'freccia-che-trapassa', 'spore', 'freccia-mirata',
                'volo-di-frecce', 'pioggia', 'silenzio-del-bosco'],
    },
    lama: {
      nome: 'Lama leggera', dice: 'La spada, la schivata e tanti colpi veloci.',
      arma: { famiglie: ['spade'], mani: 1 }, mancina: 'scudo',
      punti: ['destrezza', 'forza', 'destrezza', 'tempra', 'destrezza', 'forza', 'tempra', 'destrezza'],
      abilita: ['stoccata', 'passo-leggero', 'rovi', 'ferita-aperta', 'piedi-leggeri', 'danza', 'passo-d-ombra', 'alle-spalle', 'linfa'],
    },
    luna: {
      nome: 'Luna', dice: 'Niente armi da impugnare: la luce, il gelo e le cure, con un po\' di intelligenza.',
      arma: { famiglie: ['spade'], mani: 1 }, mancina: 'scudo',
      punti: ['destrezza', 'destrezza', 'intelligenza', 'tempra', 'destrezza', 'forza', 'destrezza', 'tempra'],
      abilita: ['raggio-di-luna', 'linfa', 'luce-d-argento', 'notte-gelida', 'ninna-nanna', 'falce-di-luna', 'velo-di-luna', 'luna-piena',
                'rovi', 'spore'],
    },
  },
  nano: {
    difensore: {
      nome: 'Difensore', dice: 'Ascia e scudo, la Pietra: regge e non cade quasi mai.',
      arma: { famiglie: ['asce'], mani: 1 }, mancina: 'scudo',
      punti: ['forza', 'tempra', 'forza', 'tempra', 'forza', 'destrezza', 'tempra', 'forza'],
      abilita: ['pelle-di-pietra', 'rune', 'pugno-di-pietra', 'cuore-di-pietra', 'frana', 'testa-dura', 'montagna', 'spaccaroccia',
                'mani-pesanti'],
    },
    doppia: {
      nome: 'Ascia doppia', dice: 'Due mani sull\'ascia e la furia dell\'Ascia e della Fucina: il berserker.',
      arma: { famiglie: ['asce'], mani: 2 }, mancina: null,
      punti: ['forza', 'forza', 'tempra', 'forza', 'destrezza', 'forza', 'tempra', 'forza'],
      abilita: ['spaccaroccia', 'mani-pesanti', 'martello-caldo', 'ira-del-nano', 'fornace', 'ascia-lanciata', 'stordisce', 'mietitrice',
                'scintille-di-fucina', 'terremoto', 'colata'],
    },
    runico: {
      nome: 'Runico', dice: 'Ascia e scudo, la Fucina: le rune e il fuoco, con un po\' di intelligenza.',
      arma: { famiglie: ['asce'], mani: 1 }, mancina: 'scudo',
      punti: ['forza', 'destrezza', 'forza', 'intelligenza', 'tempra', 'destrezza', 'forza', 'tempra'],
      abilita: ['martello-caldo', 'pelle-di-pietra', 'fornace', 'rune', 'ferro-rovente', 'scintille-di-fucina', 'fiamma-della-fucina',
                'grembiule', 'colata'],
    },
  },
}

// le strade di una classe, in fila: [{ chiave, classe, ...strada }]
export const stradeDi = classe => Object.entries(STRADE[classe] || {}).map(([chiave, s]) => ({ chiave, classe, ...s }))
export const stradaDi = (classe, chiave) => (STRADE[classe] && STRADE[classe][chiave] ? { chiave, classe, ...STRADE[classe][chiave] } : null)
