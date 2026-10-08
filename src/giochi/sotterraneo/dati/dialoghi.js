// Quello che dicono i personaggi della terra di sopra quando ci si parla (docs/sotterraneo/dialoghi.md). Le pagine
// sono di una o due frasi; `da` è quante discese sono finite: vale l'ultima voce con `da` non oltre. Così parlare di
// nuovo con qualcuno, più avanti nella storia, dice cose nuove. Le missioni hanno le loro frasi (dati/missioni.js),
// il minatore la strada (motore/dialoghi.js).
//   `domanda`  la scelta che segue la storia, e `racconti` le risposte
//   `saluti`   quando non ha niente da chiederti né da riprendere
//   `presa`    quando accetti un suo favore
//   `bottega`, `vendi`  le scelte dei mercanti (aprono il banco, o la linguetta delle tasche)

export const DIALOGHI = {
  minatore: {
    domanda: 'Cosa c\'è laggiù?',
    // la prima volta: chi è, e perché si scende
    presentazione: [
      'Un volto nuovo. Ho scavato sotto queste terre per quarant\'anni: le strade che scendono le conosco tutte.',
      'Sotto il villaggio qualcosa si è svegliato, e i mostri risalgono. Ogni discesa è una porta, e qualcuno deve chiuderle.',
    ],
    saluti: [{ da: 0, testo: 'Ancora qui? Le discese non si chiudono da sole.' }],
    presa: 'La lanterna del nonno. Se la riporti su, mi riporti su anche lui.',
  },

  ragazza: {
    domanda: 'Cosa si dice al pozzo?',
    saluti: [
      { da: 0, testo: 'L\'acqua di questo pozzo è la più fresca del villaggio. Bevi, se vuoi: non costa niente.' },
      { da: 3, testo: 'Al pozzo passano tutti, e tutti parlano. Io ascolto.' },
    ],
    racconti: [
      { da: 0, pagine: ['Dicono che di notte, dalla cripta dell\'altare, si senta piangere. Una voce di donna.',
                        'Il frate che sta lassù ne sa più di me.'] },
      { da: 2, pagine: ['Da quando i goblin salgono dalle discese, nessuno lascia più niente fuori di casa.',
                        'Mia nonna dice che una volta, sotto la torre, c\'erano solo topi.'] },
      { da: 4, pagine: ['Il pescatore giura che una notte l\'acqua dello stagno è diventata nera.',
                        'Da allora l\'acqua la prendo solo qui.'] },
      { da: 6, pagine: ['Mio padre lavorava nella miniera. Il giorno che le pietre hanno preso fuoco da sole, sono scappati tutti.',
                        'Dicono che laggiù comandi un re fatto di brace.'] },
    ],
    presa: 'Grazie! Ti aspetto qui, al pozzo.',
  },

  mugnaio: {
    domanda: 'Che si dice al mulino?',
    saluti: [{ da: 0, testo: 'La ruota gira, la macina macina, e io ho la farina fin nelle orecchie.' }],
    racconti: [
      { da: 0, pagine: ['Il mulino macina da cent\'anni, e da cent\'anni la ruota gira tranquilla.',
                        'Ma ultimamente l\'acqua porta su un odore di cantina. Non mi piace.'] },
      { da: 2, pagine: ['I ratti ci sono sempre stati. Ratti così grossi, mai.',
                        'Salgono dalla torre in rovina. Qualcosa, là sotto, li fa crescere.'] },
      { da: 5, pagine: ['La botola nel prato era chiusa da quando ero bambino.',
                        'Adesso la trovo aperta ogni mattina, e ogni mattina la richiudo. Chi la apre?'] },
      { da: 7, pagine: ['Il grano di quest\'anno è il più bello che ricordi.',
                        'Dicono che sia merito tuo: i mostri sono tornati giù. Tutti, tranne quelli dell\'abisso.'] },
    ],
    presa: 'Bene. La farina ti ringrazia già.',
  },

  eremita: {
    domanda: 'Chi dorme sotto l\'altare?',
    saluti: [{ da: 0, testo: 'Sotto queste pietre dormono in tanti. Non tutti dormono tranquilli.' }],
    racconti: [
      { da: 0, pagine: ['Sotto l\'altare c\'è una cripta, e nella cripta riposano i re di un tempo.',
                        'Il più vecchio si chiamava Re Ossuto. Dicono che non abbia mai smesso di regnare.'] },
      { da: 1, pagine: ['Re Ossuto non comanda più. Ma la cripta era solo la prima porta.',
                        'Le discese sono sette, e sotto tutte c\'è il pozzo che non ha fondo.'] },
      { da: 4, pagine: ['Nel libro dei nomi scrivo chi è sceso e non è tornato.',
                        'Il tuo, finora, non c\'è. Fa\' che resti così.'] },
      { da: 7, pagine: ['L\'abisso non si chiude: si tiene a bada.',
                        'Finché qualcuno scende, quello che sta là sotto resta là sotto.'] },
    ],
    presa: 'Va\', e che la luce ti accompagni.',
  },

  guardia: {
    domanda: 'Cosa c\'è sotto la torre?',
    saluti: [{ da: 0, testo: 'Faccio la guardia a una torre che cade a pezzi. Qualcuno deve pur farla.' }],
    racconti: [
      { da: 0, pagine: ['La torre era la casa del signore di queste terre. Poi è crollata, e lui se n\'è andato.',
                        'Quello che c\'è sotto, invece, non se n\'è andato.'] },
      { da: 2, pagine: ['Sotto la torre c\'è una fornace che nessuno accende da cent\'anni. Eppure è calda.',
                        'Dentro, dicono, si muove una melma di fuoco. La chiamano Fiammetta.'] },
      { da: 3, pagine: ['La fornace si è spenta. Stanotte, per la prima volta da anni, ho dormito.',
                        'Ma dal prato, verso la botola, arrivano ululati.'] },
      { da: 6, pagine: ['Ho fatto la guardia a questa torre per vent\'anni.',
                        'Adesso so che la guardia va fatta a quello che c\'è sotto. E quella, la fai tu.'] },
    ],
    presa: 'Conto su di te. Io resto qui, di guardia.',
  },

  pescatore: {
    domanda: 'Cosa c\'è nello stagno?',
    saluti: [{ da: 0, testo: 'Oggi non abbocca niente. Ieri nemmeno. Domani chissà.' }],
    racconti: [
      { da: 0, pagine: ['Nello stagno c\'è una scala che scende sott\'acqua. L\'ha costruita qualcuno, tanto tempo fa.',
                        'Io non ci scendo. I pesci sì: e non tornano.'] },
      { da: 4, pagine: ['La scala sommersa porta a una cisterna, e la cisterna non è vuota.',
                        'Laggiù c\'è una melma d\'acqua nera, Gorgo. Quando gorgoglia, lo stagno trema.'] },
      { da: 5, pagine: ['Lo stagno è tornato limpido: per la prima volta vedo il fondo.',
                        'E stanotte i pesci hanno abboccato. Tutti.'] },
    ],
    presa: 'Va bene. Io intanto aspetto, che è la cosa che mi riesce meglio.',
  },

  boscaiolo: {
    domanda: 'Cosa c\'è oltre il bosco?',
    saluti: [{ da: 0, testo: 'Il bosco è grande, ma le strade sono poche: chi le conosce non si perde.' }],
    racconti: [
      { da: 0, pagine: ['Il sentiero del bosco porta all\'arco di pietra, e oltre l\'arco alla grotta.',
                        'Non uscire dal sentiero: qui gli alberi si somigliano tutti.'] },
      { da: 3, pagine: ['Nella grotta della scaletta i piani sono piccoli e tanti: si scende, e si scende ancora.',
                        'In fondo tesse la tela Zannaverde, un ragno lungo come un carro. Mio padre l\'ha visto, e ci ha lasciato l\'ascia.'] },
      { da: 4, pagine: ['Le ragnatele nel bosco non ci sono più.',
                        'Gli uccelli sono tornati a cantare. Lo sentono anche loro, che qualcosa è cambiato.'] },
    ],
    presa: 'Grazie. Mio padre non lo dirà, ma ci tiene.',
  },

  armaiolo: {
    domanda: 'Cosa serve laggiù?',
    bottega: 'Fammi vedere le armi',
    racconti: [
      { da: 0, pagine: ['Laggiù non si va a mani nude. Una lama, prima di tutto.',
                        'Poi uno scudo: chi para i colpi torna su.'] },
      { da: 3, pagine: ['Più giù si scende, più i mostri hanno la pelle dura.',
                        'Le armi dei mostri grossi io non le so fare: quelle si strappano a loro.'] },
      { da: 6, pagine: ['Dicono che il martello di Carbonchio batta il ferro senza fuoco: il fuoco ce l\'ha dentro.',
                        'Se lo porti su, fammelo vedere. Solo vedere.'] },
    ],
  },

  erborista: {
    domanda: 'Cosa serve laggiù?',
    bottega: 'Mi servono pozioni',
    racconti: [
      { da: 0, pagine: ['Laggiù il buio è il primo nemico: una torcia accesa vale più di una spada.',
                        'E porta sempre una pozione. Quando la vita cala, bevila: non aspettare.'] },
      { da: 3, pagine: ['Più giù si scende, più le ferite bruciano.',
                        'Un\'ampolla costa, lo so. Ma una sola ti riporta su intero.'] },
      { da: 7, pagine: ['L\'abisso non ha una fine, e quindi nemmeno un ritorno facile.',
                        'Riempi le tasche di pozioni, prima. Sempre.'] },
    ],
  },

  rigattiere: {
    domanda: 'Cosa trovo laggiù?',
    bottega: 'Fammi vedere',
    vendi: 'Ho roba da vendere',
    racconti: [
      { da: 0, pagine: ['Laggiù la gente perde di tutto: anelli, amuleti, armi.',
                        'Tu raccogli, io compro. Così ci guadagniamo tutti e due.'] },
      { da: 4, pagine: ['Un anello buono, a volte, ti salva più di uno scudo.',
                        'Guardali bene, i gioielli che trovi: ognuno fa una cosa sua.'] },
    ],
  },
}

export const ARRIVEDERCI = 'Arrivederci'
// la domanda del minatore, quella che non manca mai: «cosa faccio adesso» (motore/dialoghi.js, strada)
export const DOVE_VADO = 'Dove vado adesso?'

// l'ultima voce con `da` non oltre le discese finite (le voci stanno in ordine)
export const perOra = (voci, finite) => {
  let v = null
  for (const x of voci || []) if (x.da <= finite) v = x
  return v
}

export function guastiDeiDialoghi(chi = []) {
  const g = []
  for (const k of chi) if (!DIALOGHI[k]) g.push(`${k}: non ha un dialogo`)
  for (const [k, d] of Object.entries(DIALOGHI)) {
    if (!d.domanda) g.push(`${k}: senza la domanda della storia`)
    const voci = [...(d.racconti || []), ...(d.saluti || [])]
    if (k !== 'minatore' && !(d.racconti || []).length) g.push(`${k}: niente da raccontare`)
    for (const lista of [d.racconti || [], d.saluti || []]) {
      if (lista.length && lista[0].da !== 0) g.push(`${k}: la prima voce non vale da subito`)
      for (let i = 1; i < lista.length; i++) if (lista[i].da <= lista[i - 1].da) g.push(`${k}: le voci non sono in ordine`)
    }
    // pagine di una o due frasi: una pagina lunga non sta nel riquadro, e il bambino non la legge
    for (const v of voci) for (const p of v.pagine || [v.testo]) {
      if (!p) g.push(`${k}: una pagina vuota`)
      else if (p.length > 150) g.push(`${k}: una pagina di ${p.length} caratteri («${p.slice(0, 30)}…»)`)
    }
    for (const v of d.racconti || []) if (v.pagine.length > 4) g.push(`${k}: un racconto di più di quattro pagine`)
  }
  return g
}
