// «Novità?»: la domanda che ogni personaggio della terra di sopra ha, e le frasi che girano (docs/sotterraneo/dialoghi.md,
// «Novità?»). Per ognuno: `ruota`, tre frasi sulla sua specialità, sempre valide; `reazioni`, quello che dice per dove è
// arrivato l'eroe. Una reazione vale in una finestra: `finite` (le discese finite, un numero o [da, a]) e/o `livello`
// ([da, a]); chi la soddisfa la dice prima, poi girano le frasi sue. Dentro il testo: {boss} l'ultimo mostro grosso battuto ({caduto} accordato a lui),
// {discesa} la discesa che si è aperta dopo. In bocca a chi parla non c'è «livello»: dice cosa si vede (il passo, la fama).
// Il tono è quello del resto del gioco: serio, da avventura, non triste; frasi brevi e parole semplici.
export const NOVITA = 'Novità?'

// le chiavi sono quelle dei personaggi e dei mercanti (armaiolo è «il fabbro», erborista «la guaritrice», rigattiere «il mercante»)
export const NOVITA_DI = {
  minatore: {
    ruota: [
      ['Quarant\'anni sotto terra insegnano una cosa: ascolta la roccia. Quando scricchiola, esci.'],
      ['I puntelli di legno tengono su la montagna. Quelli vecchi, laggiù, sono marci: non fidarti dei soffitti.'],
      ['Una lanterna accesa ti dice due cose: dove andare, e dove non sei ancora stato.'],
    ],
    reazioni: [
      { finite: 0, pagine: ['Non sei ancora sceso. Va bene: la prima porta perdona chi la prende con calma.'] },
      { finite: [1, 6], pagine: ['Ho sentito cadere {boss}: il pavimento ha tremato fin qui.', 'Ora tocca a {discesa}.'] },
      { finite: 7, pagine: ['La mia miniera, in pace. Non pensavo di rivederla.', 'Resta il pozzo vecchio. Quello non l\'ho scavato io: era già lì.'] },
      { livello: [5, 9], pagine: ['Hai il passo di chi sa dove mette i piedi. Si vede.'] },
      { livello: [10, 99], pagine: ['Ormai, quando scendi, la roccia ti conosce.'] },
    ],
  },

  ragazza: {
    ruota: [
      ['Al pozzo si sa tutto prima degli altri. L\'acqua porta le voci come porta le foglie.'],
      ['Ogni sera qualcuno racconta di aver visto una luce sotto l\'arco. Poi tutti si zittiscono.'],
      ['Dicono che chi beve qui prima di scendere torni sempre. Io non ci credo, ma bevo.'],
    ],
    reazioni: [
      { finite: 0, pagine: ['Sei appena arrivato: si vede dalle scarpe ancora pulite.'] },
      { finite: 1, pagine: ['Al pozzo non si parla d\'altro: la cripta tace, per la prima volta da anni.', 'Dicono che sia merito tuo.'] },
      { finite: [2, 6], pagine: ['Tutto il villaggio sa che {boss} è {caduto}.', 'Adesso guardano verso {discesa}, e si chiedono chi ci andrà.'] },
      { finite: 7, pagine: ['Sette porte chiuse. Mia madre ha acceso una candela per ognuna.'] },
      { livello: [5, 9], pagine: ['I bambini ti indicano per strada. Dicono: ecco quello che scende.'] },
      { livello: [10, 99], pagine: ['Quando passi, le finestre si aprono. Nessuno lo dice, ma tutti ti aspettano.'] },
    ],
  },

  mugnaio: {
    ruota: [
      ['Il segreto della farina buona è il grano che cresce lontano dalle ombre. Da un po\' le ombre sono troppe.'],
      ['Di notte la ruota gira piano, come se qualcuno la spingesse da sotto. Io dormo con un orecchio solo.'],
      ['Una macina vecchia ricorda chi ha macinato prima di te. Questa ricorda mio nonno.'],
    ],
    reazioni: [
      { finite: 0, pagine: ['Chi scende ha fame al ritorno. Passa dal mulino: il pane c\'è sempre.'] },
      { finite: 1, pagine: ['La cripta è calma, e l\'acqua ha ripreso il suo sapore. Un buon inizio.'] },
      { finite: [2, 6], pagine: ['{boss} è {caduto}, e la farina di oggi è la più bianca della settimana.', 'Non so spiegarlo, ma ringrazio.'] },
      { finite: 7, pagine: ['Il grano ondeggia come non faceva da anni. Merito tuo, e delle sette porte.'] },
      { livello: [5, 9], pagine: ['Hai le braccia di chi porta sacchi. Se un giorno smetti, un posto al mulino c\'è.'] },
      { livello: [10, 99], pagine: ['Con quelle spalle solleveresti la macina. Non provarci: è la mia.'] },
    ],
  },

  eremita: {
    ruota: [
      ['Accendo una candela per ognuno che scende. Alcune si spengono presto: le riaccendo lo stesso.'],
      ['Le pietre dell\'altare sono più antiche del villaggio. Ricordano chi le ha costruite, e chi le ha temute.'],
      ['Il silenzio non è vuoto: è pieno di chi ascolta. Impara a distinguere.'],
    ],
    reazioni: [
      { finite: 0, pagine: ['Prima di scendere fermati un momento. La cripta rispetta chi arriva con calma.'] },
      { finite: 1, pagine: ['La cripta ha chiuso gli occhi. Per la prima volta le candele non tremano.'] },
      { finite: [2, 6], pagine: ['Ho scritto il nome di {boss} fra quelli che non turbano più il sonno.', 'Adesso aspetta {discesa}.'] },
      { finite: 7, pagine: ['Le sette porte sono chiuse. Resta solo ciò che non ha porta: il pozzo.'] },
      { livello: [5, 9], pagine: ['La tua luce è più ferma. Chi ha visto il buio sa portarla meglio.'] },
      { livello: [10, 99], pagine: ['Hai visto ciò che io posso solo pregare. Che la luce ti accompagni.'] },
    ],
  },

  guardia: {
    ruota: [
      ['Una guardia impara a leggere l\'aria: quando il vento tace, qualcosa si muove.'],
      ['Quest\'anno ho cambiato il mio giro tre volte. I rumori vengono sempre da una parte diversa.'],
      ['Un elmo che nasconde la faccia spaventa più di una lama. Chi porta il ferro lo sa.'],
    ],
    reazioni: [
      { finite: 0, pagine: ['Sei diretto alla cripta? Passi dall\'altare, non da qui. La torre, per ora, lasciala a me.'] },
      { finite: 1, pagine: ['Il turno di stanotte è stato più calmo. Chi ha chiuso la cripta ha fatto un favore anche a me.'] },
      { finite: 3, pagine: ['La fornace è spenta: dal prato non esce più fumo. Ho smesso di contare i secchi d\'acqua.'] },
      { finite: [2, 6], pagine: ['Da quando è {caduto} {boss} i rumori sono cambiati.', 'Ora vengono da {discesa}.'] },
      { finite: 7, pagine: ['Dopo vent\'anni di guardia, stanotte non ho sentito niente. Strano: mi manca.'] },
      { livello: [5, 9], pagine: ['Ti saluto come saluterei un collega. Hai il passo di chi fa ronde.'] },
      { livello: [10, 99], pagine: ['Se un giorno mi serve un capitano, so già dove guardare.'] },
    ],
  },

  pescatore: {
    ruota: [
      ['La pazienza è l\'unica esca che non costa niente. Sullo stagno funziona meglio di tutto.'],
      ['Lo stagno ha le sue stagioni: ora si vede il fondo, ora no. Il pesce lo sa prima di me.'],
      ['Un pesce grosso non abbocca subito: ti guarda, ti studia. Come certi mostri, immagino.'],
    ],
    reazioni: [
      { finite: 0, pagine: ['Se cerchi la scala sott\'acqua, aspetta: non è per chi comincia.'] },
      { finite: 1, pagine: ['Stamattina ho preso tre trote. Sarà merito della cripta? Io ringrazio lo stesso.'] },
      { finite: 5, pagine: ['Lo stagno è limpido: Gorgo non gorgoglia più. Vedo il fondo, ed è bellissimo.'] },
      { finite: [2, 6], pagine: ['{boss} è {caduto}, e i pesci tornano a mordere.', 'Chissà cosa c\'è, adesso, dalle parti di {discesa}.'] },
      { finite: 7, pagine: ['Tutte le porte chiuse, e il pesce abbocca. Ho aspettato tanto, per questo.'] },
      { livello: [5, 9], pagine: ['Hai l\'occhio di chi sa aspettare. È una cosa rara.'] },
      { livello: [10, 99], pagine: ['Vieni a pescare, un giorno. Non c\'è niente di più forte della pazienza, ma forse lo sai già.'] },
    ],
  },

  boscaiolo: {
    ruota: [
      ['Un albero che cresce piano ha il legno più duro. Vale anche per chi scende.'],
      ['Le tracce nel bosco parlano: un\'orma storta, un ramo spezzato. Chi sa leggere non si perde.'],
      ['L\'ascia si affila prima del lavoro, non dopo. Lo stesso vale per chi va laggiù.'],
    ],
    reazioni: [
      { finite: 0, pagine: ['Se segui il sentiero arrivi all\'arco. Se lo lasci, arrivi dove vuole il bosco.'] },
      { finite: 1, pagine: ['Dalle parti dell\'altare gli uccelli hanno ripreso a cantare. Qualcosa è cambiato.'] },
      { finite: 4, pagine: ['Ho trovato ragnatele vuote: la tela di Zannaverde è strappata. Il legno asciuga bene, adesso.'] },
      { finite: [2, 6], pagine: ['Il bosco sa che {boss} è {caduto}: gli alberi sono meno inquieti.', 'Ora il sentiero porta a {discesa}.'] },
      { finite: 7, pagine: ['Il bosco respira. Dopo tanto tempo, ho dormito sotto un albero.'] },
      { livello: [5, 9], pagine: ['Hai il passo giusto per il bosco: leggero, ma deciso.'] },
      { livello: [10, 99], pagine: ['Chi cammina come te, il bosco lo lascia passare.'] },
    ],
  },

  armaiolo: {
    ruota: [
      ['Il ferro è onesto: se lo batti bene, regge. L\'acciaio è più testardo, e chiede più fuoco e più pazienza.'],
      ['Una lama non deve solo tagliare: deve stare in mano. Quella che pesa troppo ti tradisce al terzo colpo.'],
      ['Lo scudo di legno para un colpo, quello di ferro ne para tre. Ma il ferro pesa, e il peso stanca.'],
    ],
    reazioni: [
      { finite: 0, pagine: ['Scendi a mani nude? Passa da me: una lama comune, ma onesta.'] },
      { finite: 1, pagine: ['Dalla cripta si porta su roba vecchia, e a volte ottima. Fammela vedere.'] },
      { finite: [2, 6], pagine: ['Hai battuto {boss}: chi lo fa, di solito, torna con un\'arma che non ho mai forgiato.', 'Fammela vedere. Solo vedere.'] },
      { finite: 7, pagine: ['Sette porte chiuse, e le tue armi ancora intere. Il metallo buono si riconosce anche da questo.'] },
      { livello: [5, 9], pagine: ['Hai il braccio di chi tiene l\'arma da anni. Mi piace vederla in buone mani.'] },
      { livello: [10, 99], pagine: ['Con quel braccio, un\'arma qualunque non ti basta più. Guarda sul banco: c\'è sempre qualcosa di meglio.'] },
    ],
  },

  erborista: {
    ruota: [
      ['Ogni erba ha il suo compito: una chiude le ferite, una scalda, una dà fiato. Nella pozione stanno tutte.'],
      ['Una ferita lasciata aperta chiama altri guai. Curala presto, anche se sembra piccola.'],
      ['Raccolgo le erbe all\'alba, quando hanno ancora la rugiada. Hanno più forza, e meno ombra.'],
    ],
    reazioni: [
      { finite: 0, pagine: ['La prima discesa si ricorda per sempre. Portati una pozione: sarà un ricordo più dolce.'] },
      { finite: 1, pagine: ['Torni dalla cripta con tutte le ossa al loro posto. È un buon inizio: continua così.'] },
      { finite: [2, 6], pagine: ['Hai battuto {boss}? Avrai ferite da raccontare.', 'Per {discesa} fai scorta di pozioni.'] },
      { finite: 7, pagine: ['Le sette porte sono chiuse, e tu cammini dritto. Il resto lo fa il tempo.'] },
      { livello: [5, 9], pagine: ['Hai il colorito di chi sta bene. Mi rallegra.'] },
      { livello: [10, 99], pagine: ['Chi è tornato tante volte sa che la cura migliore è non cadere. Ma una pozione in tasca, comunque.'] },
    ],
  },

  rigattiere: {
    ruota: [
      ['Un buon affare si riconosce da due cose: chi vende sorride, e chi compra pure.'],
      ['Anelli, amuleti, collane: ognuno ha una storia. Non sempre bella, ma sempre vera.'],
      ['Niente si butta: quello che per te è inutile, per un altro è l\'inizio di una fortuna.'],
    ],
    reazioni: [
      { finite: 0, pagine: ['Vieni a vedere: non ho di tutto, ma ho quello che serve a chi comincia.'] },
      { finite: 1, pagine: ['Dalla cripta si porta su roba vecchia ma di valore. Se ne hai, io la compro volentieri.'] },
      { finite: [2, 6], pagine: ['Chi batte {boss} torna con cose che non ho mai visto.', 'Se ne trovi, fammele vedere prima di venderle ad altri.'] },
      { finite: 7, pagine: ['Sette porte chiuse. I miei affari non sono mai andati così bene, e il merito è tuo.'] },
      { livello: [5, 9], pagine: ['Ormai ti riconosco da come entri: uno che sa cosa cerca.'] },
      { livello: [10, 99], pagine: ['Per un cliente come te tengo da parte i pezzi migliori. Guarda sul banco.'] },
    ],
  },
}

export function guastiDelleNovita(chi = []) {
  const g = []
  for (const k of chi) if (!NOVITA_DI[k]) g.push(`${k}: non ha le novità`)
  for (const [k, d] of Object.entries(NOVITA_DI)) {
    if ((d.ruota || []).length < 3) g.push(`${k}: meno di tre frasi che girano`)
    const finestra = (q, nome) => {
      if (q == null) return
      const [a, b] = Array.isArray(q) ? q : [q, q]
      if (!(Number.isInteger(a) && Number.isInteger(b) && a <= b)) g.push(`${k}: la finestra «${nome}» è storta (${JSON.stringify(q)})`)
    }
    for (const r of d.reazioni || []) {
      if (r.finite == null && r.livello == null) g.push(`${k}: una reazione senza finestra`)
      finestra(r.finite, 'finite'); finestra(r.livello, 'livello')
      // {boss} e {discesa} dicono qualcosa solo se almeno una discesa è finita e una è ancora da fare
      if (r.pagine.some(p => /\{(boss|discesa)\}/.test(p)) && r.finite != null) {
        const [a, b] = Array.isArray(r.finite) ? r.finite : [r.finite, r.finite]
        if (a < 1 || b > 6) g.push(`${k}: {boss} o {discesa} in una finestra dove non c'è (finite ${JSON.stringify(r.finite)})`)
      }
    }
    for (const p of [...(d.ruota || []), ...(d.reazioni || []).map(r => r.pagine)].flat()) {
      if (!p) g.push(`${k}: una pagina vuota`)
      else if (p.length > 150) g.push(`${k}: una pagina di ${p.length} caratteri («${p.slice(0, 30)}…»)`)
      if (/\blivello\b/i.test(p)) g.push(`${k}: «livello» in bocca a un personaggio («${p.slice(0, 30)}…»)`)
    }
  }
  return g
}
