// Quello che dicono i personaggi della terra di sopra quando ci si parla (docs/sotterraneo/dialoghi.md). Le pagine
// sono di una o due frasi; `da` è quante discese sono finite: vale l'ultima voce con `da` non oltre. Così parlare di
// nuovo con qualcuno, più avanti nella storia, dice cose nuove. Le missioni hanno le loro frasi (dati/missioni.js),
// il minatore la strada (motore/dialoghi.js).
//   `domanda`  la scelta che segue la storia, e `racconti` le risposte
//   `saluti`   quando non ha niente da chiederti né da riprendere
//   `presa`    quando accetti un suo favore
//   `bottega`, `vendi`  le scelte dei mercanti (aprono il banco, o la linguetta delle tasche)
//   `porte`    solo il capitano: per le discese che racconta lui (la chiave della tappa), quello che dice della porta
//              di adesso, in aggiunta alla strada (motore/dialoghi.js, stradaDelCapitano)
//   `terre`    il minatore e il capitano, nel mondo 3D: la porta delle terre aperta in fondo alla landa (ctx.terre)
//   `cura`     chi cura gratis (la guaritrice la vita, l'incantatrice l'energia): `risorsa`, la `domanda`, le `pagine` dette
//              curando, `gia` quando non serve e `richiamo`, il fumetto sulla sua testa quando serve (motore/dialoghi.js)
// «Novità?», con le frasi che ruotano e reagiscono, sta in dati/novita.js.

import { guastiDelleNovita } from './novita.js'

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
    terre: 'Laggiù, in fondo alla landa, si è aperta una porta di pietra. Le rune dicono che di là c\'è un\'altra terra: le stesse strade, mostri più forti.',
  },

  ragazza: {
    domanda: 'Cosa si dice al pozzo?',
    saluti: [
      { da: 0, testo: 'L\'acqua di questo pozzo è la più fresca del villaggio. Bevi, se vuoi: non costa niente.' },
      { da: 3, testo: 'Al pozzo passano tutti, e tutti parlano. Io ascolto.' },
    ],
    racconti: [
      { da: 0, pagine: ['Dicono che di notte, dalla cripta dei re, si senta piangere. Una voce di donna.',
                        'Il frate che sta lassù ne sa più di me.'] },
      { da: 2, pagine: ['Da quando i goblin salgono dalle discese, nessuno lascia più niente fuori di casa.',
                        'Mia nonna dice che una volta, sotto la torre, c\'erano solo topi.'] },
      { da: 4, pagine: ['Il pescatore giura che una notte l\'acqua dello stagno è diventata nera.',
                        'Da allora l\'acqua la prendo solo qui.'] },
      { da: 6, pagine: ['Mio padre lavorava nelle miniere di brace. Il giorno che le pietre hanno preso fuoco da sole, sono scappati tutti.',
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
                        'Salgono dalla torre bruciata. Qualcosa, là sotto, li fa crescere.'] },
      { da: 5, pagine: ['La porta dell\'inferno, nel prato, era chiusa da quando ero bambino.',
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
      { da: 0, pagine: ['Sotto l\'altare c\'è la cripta dei re, e là riposano i sovrani di un tempo.',
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

  // il capitano (docs/sotterraneo/mondo-aperto-quest.md): sta nel villaggio del mondo 3D, venuto dal forte del guado che non c'è più
  // (le decisioni del 20 ottobre). La porta di adesso la dice lui quando è la quinta o la sesta; le altre le dice il minatore
  capitano: {
    domanda: 'Com\'è oltre il guado?',
    saluti: [
      { da: 0, testo: 'Capitano della guardia. Il forte del guado è caduto, e adesso la strada maestra la tengo d\'occhio da qui.' },
      { da: 6, testo: 'La strada maestra è tranquilla, per la prima volta da anni. Anche questo è merito tuo.' },
    ],
    racconti: [
      { da: 0, pagine: ['Il guado era la strada dei mercanti. Poi dall\'altra riva sono arrivate le bestie.',
                        'Il forte non ha tenuto, e sono tornato al villaggio. Ma la strada la conosco palmo a palmo.'] },
      { da: 4, pagine: ['Le sale allagate sono sotto la palude, e l\'acqua nera sale fino alle radici delle canne.',
                        'Chi scende torna con le scarpe fradice. Ma torna, se ha la testa a posto.'] },
      { da: 5, pagine: ['Dalla piana delle ceneri viene un fumo che non è di nessun camino.',
                        'I miei soldati dicono che laggiù si apre una porta. Io dico che è meglio non guardarla troppo.'] },
      { da: 6, pagine: ['Sei porte chiuse. La settima è su, sul monte: il minatore te la spiega.',
                        'Passa il valico del passo, e copriti bene: lassù tira vento.'] },
      { da: 7, pagine: ['Sette porte chiuse, e il villaggio ancora in piedi. Non pensavo di vederlo.',
                        'Il pozzo senza fondo no: quello non lo chiude nessuno. Si tiene d\'occhio.'] },
    ],
    porte: {
      cisterna: 'Su per la salita della brughiera, e poi oltre il ponte del guado: lì comincia la palude. Sotto la palude ci sono le sale allagate, e là dorme Gorgo. L\'acqua nera sale fino alle radici delle canne. Fermalo, e il guado respira.',
      labirinto: 'La piana delle ceneri mi dà pensiero: ne viene un fumo che non è di nessun camino. C\'è una botola nel telaio, e la chiamano la porta dell\'inferno. Dietro ci sta Minotto. Battilo, e poi torna dal minatore.',
    },
    terre: 'I miei vecchi soldati giurano che in fondo alla landa si è aperta una porta di pietra, con le rune. Di là c\'è un\'altra terra, e bestie più forti.',
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
                        'Ma dal prato, verso la porta dell\'inferno, arrivano muggiti.'] },
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
      { da: 4, pagine: ['Le sale allagate sono una cisterna antica, e la cisterna non è vuota.',
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
      { da: 0, pagine: ['Nel bosco vecchio c\'è una grotta fra le radici: è la tana dei ragni.',
                        'Non uscire dal sentiero: qui gli alberi si somigliano tutti.'] },
      { da: 3, pagine: ['Nella tana dei ragni i piani sono piccoli e tanti: si scende, e si scende ancora.',
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

  incantatrice: {
    domanda: 'La magia serve, laggiù?',
    bottega: 'Fammi vedere la magia',
    cura: {
      risorsa: 'energia', domanda: 'Ricaricami',
      richiamo: 'Sei a secco. Vieni, ti ricarico.',
      pagine: ['Dammi le mani. Respira piano.', 'Ecco: l\'energia torna. Questo lo offro io.'],
      gia: ['La tua energia è intera. Sei già in forze.'],
    },
    racconti: [
      { da: 0, pagine: ['Il ferro ferma un colpo. Un incanto lo ferma prima che arrivi.',
                        'Ma ogni incanto costa energia. Quando finisce, resti con le mani vuote.'] },
      { da: 3, pagine: ['Più giù, certi mostri non temono il fuoco. Altri non temono il gelo.',
                        'Porta un incanto per ogni paura, e una boccetta blu per ogni incanto.'] },
      { da: 6, pagine: ['Gli ultimi mostri resistono a quasi tutto. Ma nessuno resiste a un incanto scelto bene.',
                        'Guarda cosa hai davanti, prima di lanciare.'] },
    ],
  },

  erborista: {
    domanda: 'Cosa serve laggiù?',
    bottega: 'Mi servono pozioni',
    cura: {
      risorsa: 'vita', domanda: 'Curami',
      richiamo: 'Sei ferito. Vieni, ti curo.',
      pagine: ['Siediti, e sta\' fermo.', 'Ecco: le ferite si chiudono. Questo non lo faccio pagare.'],
      gia: ['Non vedo ferite. Sei già in forze.'],
    },
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

// la fontana della piazza, dove in città manca chi cura (docs/sotterraneo/chi-cura.md): cura vita ed energia, gratis, a chi è salito dal
// portale. Nessun dialogo: un fumetto col tasto «bevo»
export const FONTANA = {
  nome: 'La fontana',
  richiamo: 'Sei ammaccato. Bevi alla fontana: è gratis.',
  dice: 'L\'acqua è chiara e fresca. Chi sale dal portale ferito, o a secco, ne beve e si rimette in forze.',
  gia: 'L\'acqua è chiara e fresca. Sei già in forze: ti servirà quando risali ammaccato.',
  bevi: 'bevo',
}

export const ARRIVEDERCI = 'Arrivederci'
// la domanda del minatore, quella che non manca mai: «cosa faccio adesso» (motore/dialoghi.js, strada)
export const DOVE_VADO = 'Dove vado adesso?'
// nel mondo 3D, dopo la strada della porta di adesso: le luci per terra e il tasto in cima (docs/sotterraneo/mondo-3d-la-meta.md)
export const LE_LUCI = 'Per terra ci sono le luci azzurre: seguile e ci arrivi. Se ti perdi, tocca «portami lì» in alto, e ti ci porto io.'

// l'ultima voce con `da` non oltre le discese finite (le voci stanno in ordine)
export const perOra = (voci, finite) => {
  let v = null
  for (const x of voci || []) if (x.da <= finite) v = x
  return v
}

export function guastiDeiDialoghi(chi = []) {
  const g = []
  for (const k of chi) if (!DIALOGHI[k]) g.push(`${k}: non ha un dialogo`)
  g.push(...guastiDelleNovita(chi))
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
    if (d.cura) {
      const c = d.cura
      if (!['vita', 'energia'].includes(c.risorsa)) g.push(`${k}: cura una cosa che non c'è (${c.risorsa})`)
      if (!c.domanda || !c.richiamo || !(c.pagine || []).length || !(c.gia || []).length) g.push(`${k}: la cura non è completa`)
      for (const p of [c.richiamo, ...(c.pagine || []), ...(c.gia || [])]) if (p && p.length > 150) g.push(`${k}: una frase della cura di ${p.length} caratteri`)
    }
    for (const v of d.racconti || []) if (v.pagine.length > 4) g.push(`${k}: un racconto di più di quattro pagine`)
    for (const [t, testo] of Object.entries(d.porte || {}))
      for (const f of testo.split(/(?<=[.!?…])\s+/)) if (f.length > 120) g.push(`${k}: una frase della porta «${t}» di ${f.length} caratteri`)
    if (d.terre) for (const f of d.terre.split(/(?<=[.!?…])\s+/)) if (f.length > 120) g.push(`${k}: una frase della porta delle terre di ${f.length} caratteri`)
  }
  return g
}
