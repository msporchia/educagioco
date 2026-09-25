/* ═══════════════════════════════════════════════════════════════════
   CAPIRE UN TESTO — leggere due o tre frasi e ritrovarci dentro le cose.

   È il buco più grosso che c'era nel catalogo: capire quello che si
   legge è *la* competenza della primaria, quella su cui si reggono
   tutte le altre, e fino a qui nessuna domanda la chiedeva. Le domande
   di italiano che c'erano guardano una parola alla volta — come si
   scrive, che parte del discorso è, com'è il plurale — e un bambino
   che le sa tutte può ancora leggere «Prima di uscire, Ugo chiude la
   finestra» e rispondere che Ugo esce per primo.

   IL TESTO SI GENERA, NON SI SCRIVE. Una storia scritta a mano si
   impara a memoria in tre partite: qui ogni testo è uno stampo con le
   parti intercambiabili — chi, dove, che cosa, il fatto e il suo
   motivo — e la domanda si fa sullo stampo, quindi la risposta giusta
   la sa il generatore e non un elenco. Il soggetto è il testo
   (`soggetto: { testo }`), la consegna è la domanda.

   CORTO, E NON PER COMODITÀ. Qui la domanda è il pedaggio di una porta
   in un gioco d'azione, non una verifica di lettura: il testo sta
   sempre **sotto le trentacinque parole**, e le prime tipologie molto
   sotto (una dozzina). `unita/capire` lo conta domanda per domanda.
   Il tempo che `nucleo/domanda.js` concede per leggere conta anche le
   parole del soggetto (`tempoDiLettura`), quindi chi risponde prima
   di aver letto il testo lo si vede — il tetto è quattro secondi, e
   per trenta parole sono già pochi: è una soglia di «non l'ha
   guardato», non di «non l'ha capito», ed è giusto così.

   LE SEI TIPOLOGIE, dalla più facile:

     capire:trova     chi, dove, che cosa: è scritto. Il falso vero è
                      un nome o un posto CITATO ma non quello giusto —
                      chi riceve al posto di chi porta, dove si cerca al
                      posto di dove si trova.
     capire:ordine    l'ordine in cui le cose SUCCEDONO contro quello in
                      cui sono SCRITTE: «prima di», «dopo aver», «ma
                      prima». Il falso vero è la frase scritta per prima.
     capire:perche    il motivo scritto con un connettivo. I falsi: una
                      cosa vera del testo che però non è il motivo, e un
                      motivo plausibile che il testo non dice.
     capire:pronome   a chi si riferisce «lei», «lo», «gli». Solo dove
                      il testo lo rende UNIVOCO (vedi sotto).
     capire:indizio   quello che non è scritto ma si ricava da un indizio
                      solo e preciso: come si sente, che tempo fa, dove
                      si trova. Il falso vero è la risposta plausibile in
                      generale ma che il testo non sostiene.
     capire:titolo    il titolo che va bene per TUTTO il testo, contro
                      quello che ne racconta un pezzo e quello così largo
                      che andrebbe bene per mille altri.

   DUE RISPOSTE DIFENDIBILI SONO UN GUASTO, e qui è facile farne.
   Nessun controllo automatico lo vede, quindi le regole sono scritte
   dentro i dati:
     · i pronomi sono univoci per GRAMMATICA, non per buon senso. «Anna
       diede il libro a Marta. Lei lo lesse» non c'è: «lei» può essere
       tutte e due. C'è invece «lei» quando nel testo c'è una femmina
       sola, «la» quando c'è una cosa sola femminile e singolare, «gli»
       quando il soggetto è sottinteso e «gli» non può essere lui;
     · le inferenze sono scritte una per una, con l'indizio e con i due
       falsi scelti apposta: uno smentito dall'indizio e uno plausibile
       ma non sostenuto — mai uno che l'indizio lascerebbe aperto («c'è
       il sole» non è un falso per il vento: si può avere tutti e due);
     · nel testo di un pronome non compare nessun altro nome che vada
       d'accordo con lui, nemmeno un posto: «in fondo al cassetto…
       Lo mette nello zaino» renderebbe il cassetto un candidato.

   I NOMI SONO INVENTATI E VARI, e nessuno è di un bambino vero. Le
   persone hanno il genere scritto accanto al nome, perché le frasi
   concordano («arriva di corsa, tutta sudata») e perché è il genere a
   rendere univoci i pronomi.
   ═══════════════════════════════════════════════════════════════════ */

import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo } from '../nucleo/domanda.js'

/* Il pezzo di scuola di tutte e sei: capire quello che si legge. È un
   gruppo suo (`data/saperi.js`) e non «Leggere le parole»: quello si
   spegne guardando in basso — l'ha già fatto — e questo in alto. */
const SA = 'comprensione'

/* ── le persone ──
   Col genere, per le concordanze e per i pronomi. Sedici e sedici:
   con meno, le stesse coppie tornano troppo presto. */
const PERSONE = [
  ...['Bruno', 'Dario', 'Fabio', 'Lapo', 'Nico', 'Piero', 'Ugo', 'Zeno', 'Ettore',
    'Tommaso', 'Samuele', 'Giacomo', 'Renato', 'Filippo', 'Carlo', 'Mattia']
    .map(nome => ({ nome, g: 'm' })),
  ...['Ada', 'Carla', 'Elisa', 'Gaia', 'Irene', 'Marta', 'Rita', 'Viola', 'Bianca',
    'Nora', 'Greta', 'Alice', 'Livia', 'Teresa', 'Olivia', 'Lucia']
    .map(nome => ({ nome, g: 'f' })),
]

/* la desinenza che concorda: `fin(p, 'o', 'a')`, «sudat» + o/a */
const fin = (p, m, f) => (p.g === 'm' ? m : f)
const maiuscola = s => s[0].toUpperCase() + s.slice(1)

/* `n` persone diverse, con un filtro facoltativo sul genere */
const persone = (sorte, n, filtro = () => true) => sorte.alcuni(PERSONE.filter(filtro), n)

/* sostituisce {A} col nome e {o} con la desinenza di chi è {A} */
const vesti = (t, p) => t.replaceAll('{A}', p.nome).replaceAll('{o}', fin(p, 'o', 'a'))

/* «Ada ed Elisa», «porta ad Alice»: la d eufonica davanti alla stessa
   vocale. I nomi arrivano a caso, quindi non si può scriverla a mano
   nello stampo — si mette dopo, su tutto quello che si legge. */
const eufonia = s => s && s.replace(/(^|\s)e (?=[EeÈ])/g, '$1ed ').replace(/(^|\s)a (?=[Aa])/g, '$1ad ')

function lucida(d) {
  d.testo = eufonia(d.testo)
  if (d.soggetto?.testo) d.soggetto.testo = eufonia(d.soggetto.testo)
  for (const r of d.risposte) {
    if (r.testo !== undefined) r.testo = eufonia(r.testo)
    if (r.perche) r.perche = eufonia(r.perche)
  }
  if (d.aiuto) d.aiuto = eufonia(d.aiuto)
  return d
}

/* ═══════════════════════════════════════════════════════════════════
   1. TROVA — chi, dove, che cosa. È scritto.

   La difficoltà vera di una domanda così non è trovare la parola: è
   non prendere la parola SBAGLIATA che sta lì vicino. In «Gaia porta a
   Nico la palla di Rita» ci sono tre nomi, e ognuno ha un posto suo —
   chi fa, a chi, di chi — che si legge dalle paroline in mezzo. I falsi
   sono gli altri nomi della stessa frase, e il `perche` dice il posto
   di quello scelto.

   Al grado 2 lo stesso stampo si allunga di una frase e di un nome
   citato che non fa niente: una risposta in più da scartare, e un
   testo da tenere in mente un po' più lungo.
   ═══════════════════════════════════════════════════════════════════ */

const PRESTATI = [
  'la palla', 'il libro', 'la sciarpa', 'il cappello', 'la torcia', 'il quaderno',
  'la merenda', "l'ombrello", 'la borraccia', 'il pennarello', 'la chitarra', 'il monopattino',
]
const GRAZIE = ['ringrazia con un abbraccio', 'sorride content{o}', 'batte le mani', 'dice grazie mille']

function trovaPorta(sorte, lungo) {
  const [A, B, C, D] = persone(sorte, 4)
  const cosa = sorte.uno(PRESTATI)
  const righe = [`${A.nome} porta a ${B.nome} ${cosa} di ${C.nome}.`,
    `${B.nome} ${vesti(sorte.uno(GRAZIE), B)}.`]
  if (lungo) righe.push(`Intanto ${D.nome} guarda dalla finestra.`)
  const ruolo = {
    porta: [A, `${A.nome} è chi porta ${cosa}`],
    riceve: [B, `${B.nome} è chi riceve ${cosa}`],
    suo: [C, `${cosa} è di ${C.nome}: lo dice «di ${C.nome}»`],
    guarda: [D, `${D.nome} guarda soltanto dalla finestra`],
  }
  const chiesta = sorte.uno(['porta', 'riceve', 'suo'])
  const DOMANDE = {
    porta: [`Chi porta ${cosa}?`, 'chi fa l\'azione sta prima del verbo: cerca «porta» e guarda il nome subito prima'],
    riceve: [`Chi riceve ${cosa}?`, 'chi riceve ha davanti la parolina «a»: «porta a…»'],
    suo: [`Di chi è ${cosa}?`, 'di chi è una cosa lo dice la parolina «di», subito dopo la cosa'],
  }
  const altri = ['porta', 'riceve', 'suo', ...(lungo ? ['guarda'] : [])].filter(r => r !== chiesta)
  return domanda({
    testo: DOMANDE[chiesta][0],
    soggetto: { testo: righe.join(' ') },
    buona: testo(ruolo[chiesta][0].nome),
    falsi: altri.map(r => testo(ruolo[r][0].nome, ruolo[r][1])),
    chiave: 'capire:trova',
    aiuto: DOMANDE[chiesta][1],
    sorte,
  })
}

/* i posti di casa dove una cosa si perde, e quelli da cui si torna */
const IN_CASA = ['in giardino', 'in cucina', 'in cantina', 'in soffitta', 'sotto il letto',
  'dietro il divano', "nell'armadio", 'sul balcone', 'in garage', 'nella cesta dei giochi',
  'in bagno', 'sotto il tavolo']
const FUORI = [
  { da: 'da scuola', a: 'a scuola' }, { da: 'dal parco', a: 'al parco' },
  { da: 'dalla piscina', a: 'in piscina' }, { da: 'dal mercato', a: 'al mercato' },
  { da: 'dalla palestra', a: 'in palestra' }, { da: 'dalla biblioteca', a: 'in biblioteca' },
  { da: 'dal campo da calcio', a: 'al campo da calcio' },
]
const PERSI = [
  { il: 'il gatto', g: 'm' }, { il: 'la ciabatta', g: 'f' }, { il: 'il telecomando', g: 'm' },
  { il: 'la palla', g: 'f' }, { il: 'il pupazzo', g: 'm' }, { il: 'la chiave', g: 'f' },
  { il: 'il cappello', g: 'm' }, { il: 'la sciarpa', g: 'f' }, { il: 'lo zaino', g: 'm' },
  { il: 'la torcia', g: 'f' }, { il: 'il criceto', g: 'm' }, { il: 'la tartaruga', g: 'f' },
]

/* Cercare non è trovare: il posto dove si cerca è scritto per primo,
   ed è quello che prende chi legge in fretta. La domanda non nomina chi
   ha trovato («Dov'era…?»), perché nella versione lunga a cercare sono
   in due e «Lo trova» ha il soggetto sottinteso. */
function trovaCerca(sorte, lungo) {
  const [A, B] = persone(sorte, 2)
  const cosa = sorte.uno(PERSI)
  const [p1, p2, p4] = sorte.alcuni(IN_CASA, 3)
  const f = sorte.uno(FUORI)
  const lo = cosa.g === 'm' ? 'Lo' : 'La'
  const righe = [`${A.nome} torna ${f.da} e cerca ${cosa.il} ${p1}.`]
  if (lungo) righe.push(`Anche ${B.nome} guarda ${p4}, ma niente.`)
  righe.push(`${lo} trova ${p2}.`)
  const falsi = [
    testo(p1, `lì ${A.nome} cerca, ma ${cosa.il} non c'era`),
    testo(f.a, `${A.nome} torna da lì: ${cosa.il} non c'entra`),
  ]
  if (lungo) falsi.push(testo(p4, `lì guarda ${B.nome}, ma ${cosa.il} non c'era`))
  return domanda({
    testo: `Dov'era ${cosa.il}?`,
    soggetto: { testo: righe.join(' ') },
    buona: testo(p2),
    falsi,
    chiave: 'capire:trova',
    aiuto: 'cercare non è trovare: la risposta è il posto scritto accanto a «trova»',
    sorte,
  })
}

const SPESA = ['le pere', 'il pane', 'le uova', 'il formaggio', 'le fragole', 'il latte',
  'i pomodori', 'le carote', 'il miele', 'le arance', 'il pesce', 'le zucchine', 'le mele', 'il basilico']
const PARENTI = ['la nonna', 'il nonno', 'la zia', 'lo zio', 'la mamma', 'il papà']
const MERCATI = ['al mercato', 'al supermercato', 'al mercato del sabato']

/* Chi compra che cosa: ognuno ha la sua spesa, e c'è un grande che va
   con loro e — nel testo corto — non compra niente. È il «citato ma non
   agisce» nella forma più pulita. */
function trovaSpesa(sorte, lungo) {
  const [A, B] = persone(sorte, 2)
  const par = sorte.uno(PARENTI)
  const [o1, o2, o3, o4] = sorte.alcuni(SPESA, 4)
  const righe = [
    `${A.nome} e ${B.nome} vanno ${sorte.uno(MERCATI)} con ${par}.`,
    `${A.nome} compra ${o1} e ${o2}, ${B.nome} compra ${o3}.`,
  ]
  if (lungo) righe.push(`Alla fine ${par} prende anche ${o4}.`)
  const soggetto = { testo: righe.join(' ') }
  if (sorte.forse(0.5)) {
    const falsi = [
      testo(o1, `è la spesa di ${A.nome}, non di ${B.nome}`),
      testo(o2, `è la spesa di ${A.nome}, non di ${B.nome}`),
    ]
    if (lungo) falsi.push(testo(o4, `è ${par} a prendere ${o4}`))
    return domanda({
      testo: `Che cosa compra ${B.nome}?`,
      soggetto,
      buona: testo(o3),
      falsi,
      chiave: 'capire:trova',
      aiuto: `cerca il nome di ${B.nome} e guarda che cosa c'è subito dopo «compra»`,
      sorte,
    })
  }
  const cosa = sorte.uno([o1, o2])
  return domanda({
    testo: `Chi compra ${cosa}?`,
    soggetto,
    buona: testo(A.nome),
    falsi: [
      testo(B.nome, `${B.nome} compra ${o3}`),
      testo(par, lungo ? `${par} prende solo ${o4}` : `${par} va con loro, ma non compra niente`),
    ],
    chiave: 'capire:trova',
    aiuto: 'trova la cosa nel testo e guarda chi c\'è davanti a «compra»',
    sorte,
  })
}

const GIARDINI = ['Al parco', 'In cortile', 'Ai giardini', 'Nel prato dietro casa']
const DA_SOLO = ["va sull'altalena", 'scende dallo scivolo', 'fa le bolle di sapone',
  'legge un fumetto', 'disegna col gesso', 'va in bici', 'salta la corda', 'raccoglie le foglie']
const INSIEME = ['gioca a palla', 'fa una gara di corsa', 'gioca a nascondino', 'fa merenda',
  'costruisce una capanna', 'gioca a campana']

/* Chi gioca con chi: in «Marta gioca a palla con Irene» Irene gioca
   anche lei, ma la domanda «chi gioca con Irene?» ha una risposta sola.
   Chi sceglie Irene ha preso il nome e non il posto del nome. */
function trovaGioco(sorte, lungo) {
  const [A, B, C, D] = persone(sorte, 4)
  const solo = sorte.uno(DA_SOLO)
  const ins = sorte.uno(INSIEME)
  const righe = [`${sorte.uno(GIARDINI)} ${A.nome} ${solo} e ${B.nome} ${ins} con ${C.nome}.`]
  if (lungo) righe.push(`Più tardi arriva ${D.nome} con il cane.`)
  const soggetto = { testo: righe.join(' ') }
  const arriva = testo(D.nome, `${D.nome} arriva più tardi, con il cane`)
  /* «con chi gioca B» ha due risposte sole finché non c'è il quarto
     nome: la si chiede solo nel testo lungo */
  const chiesta = sorte.uno(lungo ? ['solo', 'chi-con', 'con-chi'] : ['solo', 'chi-con'])
  if (chiesta === 'solo') return domanda({
    testo: `Chi ${solo}?`,
    soggetto,
    buona: testo(A.nome),
    falsi: [testo(B.nome, `${B.nome} ${ins} con ${C.nome}`),
      testo(C.nome, `${C.nome} ${ins} con ${B.nome}`), ...(lungo ? [arriva] : [])],
    chiave: 'capire:trova',
    aiuto: `cerca «${solo}» nel testo e guarda il nome subito prima`,
    sorte,
  })
  if (chiesta === 'chi-con') return domanda({
    testo: `Chi ${ins} con ${C.nome}?`,
    soggetto,
    buona: testo(B.nome),
    falsi: [testo(C.nome, `${C.nome} viene dopo «con»: è chi fa compagnia, non chi fa l'azione`),
      testo(A.nome, `${A.nome} ${solo}`), ...(lungo ? [arriva] : [])],
    chiave: 'capire:trova',
    aiuto: 'chi fa l\'azione sta prima del verbo; il nome dopo «con» dice con chi lo fa',
    sorte,
  })
  return domanda({
    testo: `Con chi ${ins} ${B.nome}?`,
    soggetto,
    buona: testo(C.nome),
    falsi: [testo(A.nome, `${A.nome} ${solo}`), arriva],
    chiave: 'capire:trova',
    aiuto: 'con chi si fa una cosa lo dice la parolina «con»: guarda il nome subito dopo',
    sorte,
  })
}

/* ═══════════════════════════════════════════════════════════════════
   2. ORDINE — quello che succede prima, contro quello scritto prima.

   Tre cose che fa una persona, in un ordine che il mondo non suggerisce
   (chiudere la finestra e annaffiare le piante vanno bene in tutti e
   due i versi): la risposta deve venire dal testo, non da come va di
   solito una mattina.

   Gli stampi non sono tutti al contrario, ed è voluto: se in ogni
   testo la cosa scritta per prima succedesse per ultima, la regola che
   si imparerebbe è «prendi quella in fondo», che è sbagliata quanto
   «prendi quella in cima». Metà degli stampi rimescola, metà no, e la
   domanda chiede a volte la prima e a volte l'ultima.

   Solo verbi con l'ausiliare avere: «dopo aver chiuso» non concorda
   con chi l'ha fatto, «dopo essere uscita» sì — un dettaglio in meno
   da sbagliare in un testo che si genera.
   ═══════════════════════════════════════════════════════════════════ */

/* [infinito, presente, participio] */
const AZIONI = [
  ['chiudere la finestra', 'chiude la finestra', 'chiuso la finestra'],
  ['annaffiare le piante', 'annaffia le piante', 'annaffiato le piante'],
  ['prendere le chiavi', 'prende le chiavi', 'preso le chiavi'],
  ['spegnere la luce', 'spegne la luce', 'spento la luce'],
  ['dare da mangiare al gatto', 'dà da mangiare al gatto', 'dato da mangiare al gatto'],
  ['lavare la tazza', 'lava la tazza', 'lavato la tazza'],
  ['fare il letto', 'fa il letto', 'fatto il letto'],
  ['preparare lo zaino', 'prepara lo zaino', 'preparato lo zaino'],
  ['scrivere un biglietto', 'scrive un biglietto', 'scritto un biglietto'],
  ['telefonare alla nonna', 'telefona alla nonna', 'telefonato alla nonna'],
  ['riempire la borraccia', 'riempie la borraccia', 'riempito la borraccia'],
  ['mettere in ordine i giochi', 'mette in ordine i giochi', 'messo in ordine i giochi'],
  ['chiamare il cane', 'chiama il cane', 'chiamato il cane'],
  ['portare fuori la spazzatura', 'porta fuori la spazzatura', 'portato fuori la spazzatura'],
  ['apparecchiare la tavola', 'apparecchia la tavola', 'apparecchiato la tavola'],
  ['piegare le magliette', 'piega le magliette', 'piegato le magliette'],
  ['stendere il bucato', 'stende il bucato', 'steso il bucato'],
  ['svuotare la lavastoviglie', 'svuota la lavastoviglie', 'svuotato la lavastoviglie'],
].map(([inf, pres, pp]) => ({ inf, pres, pp }))

/* Gli stampi. `x`, `y`, `z` sono le tre azioni nell'ordine in cui
   SUCCEDONO; `nota` dice, per quella scritta fuori posto, quale parola
   la sposta — è la metà del `perche` che diagnostica. */
const ORDINI = [
  /* scritta per prima, succede per ultima */
  ({ A, x, y, z }) => ({
    testo: `Prima di ${z.inf}, ${A} ${x.pres} e poi ${y.pres}.`,
    nota: { z: `«prima di ${z.inf}» la manda in fondo, anche se è scritta per prima` },
  }),
  /* la prima in fondo, l'ultima in cima: il rovescio completo */
  ({ A, x, y, z }) => ({
    testo: `${A} ${z.pres} dopo aver ${y.pp}. E prima di ${y.inf}, ${x.pres}.`,
    nota: {
      z: `«dopo aver ${y.pp}» la manda in fondo, anche se è scritta per prima`,
      x: `«prima di ${y.inf}» la porta in testa, anche se è scritta per ultima`,
    },
  }),
  /* «ma prima» torna indietro di un passo */
  ({ A, x, y, z }) => ({
    testo: `${A} ${y.pres}, ma prima ${x.pres}. Solo alla fine ${z.pres}.`,
    nota: { x: '«ma prima» la porta in testa, anche se è scritta dopo' },
  }),
  /* questi tre sono nell'ordine giusto: servono a non far imparare che
     la risposta sta sempre dall'altra parte */
  ({ A, x, y, z }) => ({ testo: `Appena finisce di ${x.inf}, ${A} ${y.pres}. Poi ${z.pres}.`, nota: {} }),
  ({ A, x, y, z }) => ({ testo: `Dopo aver ${x.pp}, ${A} ${y.pres} e poi ${z.pres}.`, nota: {} }),
  ({ A, x, y, z }) => ({
    testo: `Prima di ${y.inf}, ${A} ${x.pres}. Dopo aver ${y.pp}, ${z.pres}.`,
    nota: { x: `«prima di ${y.inf}» la porta in testa, anche se è scritta dopo` },
  }),
]

function ordine(sorte) {
  const A = sorte.uno(PERSONE)
  const [x, y, z] = sorte.alcuni(AZIONI, 3)
  const { testo: t, nota } = sorte.uno(ORDINI)({ A: A.nome, x, y, z })
  const primaChiesta = sorte.forse(0.5)
  const posto = { x: 'per prima', y: 'in mezzo', z: 'per ultima' }
  const perche = k => {
    return `questa la fa ${posto[k]}` + (nota[k] ? `: ${nota[k]}` : '')
  }
  const giusta = primaChiesta ? 'x' : 'z'
  return domanda({
    testo: primaChiesta ? `Qual è la prima cosa che fa ${A.nome}?` : `Qual è l'ultima cosa che fa ${A.nome}?`,
    soggetto: { testo: t },
    buona: testo({ x, y, z }[giusta].pres),
    falsi: ['x', 'y', 'z'].filter(k => k !== giusta).map(k => testo({ x, y, z }[k].pres, perche(k))),
    chiave: 'capire:ordine',
    aiuto: 'non conta l\'ordine in cui è scritto: «prima di», «dopo aver», «ma prima» e «poi» '
         + 'dicono l\'ordine in cui succede',
    sorte,
  })
}

/* ═══════════════════════════════════════════════════════════════════
   3. PERCHÉ — il motivo, scritto con una parola-ponte.

   Ogni fatto ha due o tre motivi possibili, tutti ragionevoli: il testo
   ne dice uno, e un altro finisce fra i falsi. È il falso più istruttivo
   del modulo, perché è VERO NEL MONDO — si resta a casa anche quando
   piove — e sbagliato solo perché il testo non lo dice. L'altro falso è
   una cosa che il testo dice davvero, ma di qualcun altro: vera e
   scritta, e non è il motivo.

   Il ponte cambia, e con lui il verso: dopo «perché», «siccome», «dato
   che» il motivo viene dopo; con «così» e «per questo» viene prima. Chi
   ha imparato a prendere la frase dopo «perché» qui trova anche quelle
   dove il motivo sta dall'altra parte.

   `suo: true` vuol dire che il motivo ha per soggetto la stessa persona
   («ha la febbre»), e allora con «così» la frase comincia dal suo nome;
   gli altri motivi hanno un soggetto loro («fuori piove forte») e
   cominciano da lì.
   ═══════════════════════════════════════════════════════════════════ */

const MOTIVI = [
  { fa: 'resta a casa', per: [['ha la febbre', 1], ['fuori piove forte', 0], ['aspetta una telefonata importante', 1]] },
  { fa: 'mette il maglione', per: [['ha freddo', 1], ['stasera fa fresco', 0]] },
  { fa: 'corre verso la scuola', per: [['è in ritardo', 1], ['vuole salutare gli amici prima della campanella', 1]] },
  { fa: 'non mangia il gelato', per: [['ha mal di gola', 1], ['ha appena finito una merenda enorme', 1]] },
  { fa: 'va a letto presto', per: [['domani parte per una gita', 1], ['ha giocato a calcio tutto il giorno', 1]] },
  { fa: 'chiude la finestra', per: [['entrano le zanzare', 0], ['fuori c\'è troppo rumore', 0], ['fa freddo', 0]] },
  { fa: 'accende la luce', per: [['si è fatto buio', 0], ['cerca un orecchino caduto', 1]] },
  { fa: "prende l'ombrello", per: [['il cielo è pieno di nuvole nere', 0], ['la radio dice che pioverà', 0]] },
  { fa: 'piange', per: [['ha perso il suo pupazzo', 1], ['ha battuto il ginocchio contro il tavolo', 1]] },
  { fa: 'ride forte', per: [['il nonno fa una faccia buffa', 0], ['il gatto è finito dentro una scatola', 0]] },
  { fa: 'cerca sotto il letto', per: [['non trova più una ciabatta', 1], ['ha sentito un rumore strano', 1]] },
  { fa: 'apre la finestra', per: [['in camera fa troppo caldo', 0], ["vuole guardare i fuochi d'artificio", 1]] },
  { fa: 'va dal veterinario', per: [['il suo cane zoppica', 0], ['il suo cane non mangia da due giorni', 0]] },
  { fa: 'compra un vaso nuovo', per: [['il gatto ha rotto quello vecchio', 0], ['vuole regalarlo alla zia', 1]] },
  { fa: 'parla sottovoce', per: [['il fratellino dorme', 0], ['è in biblioteca', 1]] },
  { fa: 'mette le scarpe da ginnastica', per: [["oggi c'è la gara di corsa", 0], ['va a giocare a basket', 1]] },
].map(m => ({ fa: m.fa, per: m.per.map(([t, suo]) => ({ t, suo: !!suo })) }))

/* quello che fa l'altra persona del testo: niente che possa sembrare un
   motivo di qualcosa — un flauto suonato sarebbe il rumore che fa
   chiudere la finestra, e allora il falso diventerebbe difendibile */
const INTANTO = ['fa i compiti', 'apparecchia la tavola', 'annaffia le piante', 'prepara lo zaino',
  'legge il giornale', 'disegna una casa', 'piega le magliette']

/* i ponti: come si scrive la frase, e dove sta il motivo */
const PONTI = [
  { dove: 'dopo «perché»', scrivi: (A, c, fa) => `${A} ${fa} perché ${c.t}.` },
  /* con il motivo in testa il nome va dentro il motivo: «Siccome ha la
     febbre, Nico…» dopo una frase su Bruno fa pensare che la febbre sia
     di Bruno */
  { dove: 'dopo «siccome»',
    scrivi: (A, c, fa) => (c.suo ? `Siccome ${A} ${c.t}, ${fa}.` : `Siccome ${c.t}, ${A} ${fa}.`) },
  { dove: 'dopo «dato che»',
    scrivi: (A, c, fa) => (c.suo ? `Dato che ${A} ${c.t}, ${fa}.` : `Dato che ${c.t}, ${A} ${fa}.`) },
  { dove: 'prima di «così»',
    scrivi: (A, c, fa) => (c.suo ? `${A} ${c.t}, così ${fa}.` : `${maiuscola(c.t)}, così ${A} ${fa}.`) },
  { dove: 'prima di «per questo»',
    scrivi: (A, c, fa) => (c.suo ? `${A} ${c.t}: per questo ${fa}.` : `${maiuscola(c.t)}: per questo ${A} ${fa}.`) },
]

function perche(sorte) {
  const [A, B] = persone(sorte, 2)
  const m = sorte.uno(MOTIVI)
  const [vero, altro] = sorte.alcuni(m.per, 2)
  const ponte = sorte.uno(PONTI)
  const att = sorte.uno(INTANTO)
  const fatto = ponte.scrivi(A.nome, vero, m.fa)
  const t = sorte.forse(0.5) ? `${fatto} Intanto ${B.nome} ${att}.` : `${B.nome} ${att}. ${fatto}`
  return domanda({
    testo: `Perché ${A.nome} ${m.fa}?`,
    soggetto: { testo: t },
    buona: testo(`perché ${vero.t}`),
    falsi: [
      testo(`perché ${altro.t}`, `può succedere, ma il testo non lo dice: il motivo scritto sta ${ponte.dove}`),
      testo(`perché ${B.nome} ${att}`, `è scritto, ma parla di ${B.nome}: non spiega perché ${A.nome} ${m.fa}`),
    ],
    chiave: 'capire:perche',
    aiuto: 'il motivo sta vicino alle parole-ponte: dopo «perché», «siccome», «dato che»; '
         + 'prima di «così» e «per questo»',
    sorte,
  })
}

/* ═══════════════════════════════════════════════════════════════════
   4. PRONOME — di chi parla «lei», «la», «gli».

   Il pronome è in rilievo nel testo (`evidenzia`), perché la domanda è
   su QUELLA parola lì e non su un'altra uguale. Tre stampi, e ognuno è
   univoco per una ragione di grammatica diversa:

     · «Lui»/«Lei» soggetto: nel testo c'è una persona sola di quel
       genere. Il falso vero è il primo nome del testo — chi legge in
       fretta attacca il pronome a chi ha nominato per primo.
     · «Lo»/«La»/«Le» complemento: due cose trovate, di genere o numero
       diversi, e il pronome va d'accordo con una sola. Mai «li»:
       «li» andrebbe d'accordo anche con tutte e due insieme. E nella
       prima frase non c'è nessun altro nome — «in fondo al cassetto»
       farebbe del cassetto un candidato. Il falso vero è la persona:
       «la» sembra lei, ma lei è chi fa.
     · «Gli»/«Le» davanti al verbo: vuol dire «a lui», «a lei», e il
       soggetto sottinteso è quello della frase prima. Chi riceve non
       può essere chi dà, quindi è univoco anche fra due maschi.
   ═══════════════════════════════════════════════════════════════════ */

const ATTESE = ['davanti a scuola', "alla fermata dell'autobus", "all'ingresso del parco",
  'davanti al cinema', 'sotto casa']
const ARRIVI = ['arriva di corsa, tutt{o} sudat{o}', 'arriva in bici e suona il campanello',
  'arriva tardi e chiede scusa', 'arriva con un pacco in mano', 'arriva ridendo, con il cappello storto']
const CARTE = ['vince tutte le partite', 'mescola le carte ridendo', 'perde la prima partita e sbuffa']

function pronomeSoggetto(sorte) {
  const B = sorte.uno(PERSONE)
  const [A, C] = persone(sorte, 2, p => p.g !== B.g)
  const P = fin(B, 'Lui', 'Lei')
  const prima = sorte.forse(0.6)
    ? `${A.nome} e ${C.nome} aspettano ${B.nome} ${sorte.uno(ATTESE)}. ${P} ${vesti(sorte.uno(ARRIVI), B)}.`
    : `${A.nome} e ${C.nome} giocano a carte con ${B.nome}. ${P} ${sorte.uno(CARTE)}.`
  const chi = fin(B, 'un maschio', 'una femmina')
  const perche = X => `«${P}» si usa per ${chi}, e ${X.nome} è ${fin(X, 'un maschio', 'una femmina')}`
  return domanda({
    testo: `Di chi parla «${P}»?`,
    soggetto: { testo: prima, evidenzia: P },
    buona: testo(B.nome),
    falsi: [testo(A.nome, perche(A)), testo(C.nome, perche(C))],
    chiave: 'capire:pronome',
    aiuto: '«lui» è per un maschio e «lei» per una femmina: cerca nel testo l\'unico nome che va d\'accordo',
    sorte,
  })
}

/* le cose trovate: `cosa` è il nome senza articolo, e serve solo a non
   mettere nella stessa frase «una biglia» e «tre biglie» */
const TROVATE = [
  ...[['un quaderno', 'il quaderno'], ['un fischietto', 'il fischietto'], ['un pennarello', 'il pennarello'],
    ['un elastico', "l'elastico"], ['un sasso liscio', 'il sasso liscio'], ['un braccialetto', 'il braccialetto'],
    ['un calzino', 'il calzino']].map(([un, il]) => ({ un, il, g: 'm', n: 's' })),
  ...[['una matita', 'la matita'], ['una biglia', 'la biglia'], ['una cartolina', 'la cartolina'],
    ['una chiave', 'la chiave'], ['una conchiglia', 'la conchiglia'], ['una moneta', 'la moneta'],
    ['una figurina', 'la figurina']].map(([un, il]) => ({ un, il, g: 'f', n: 's' })),
  ...[['due figurine', 'le figurine'], ['tre biglie', 'le biglie'], ['due mollette', 'le mollette'],
    ['tre conchiglie', 'le conchiglie']].map(([un, il]) => ({ un, il, g: 'f', n: 'p' })),
  /* questi solo come «l'altra cosa»: «li» non è mai il pronome chiesto */
  ...[['tre bottoni', 'i bottoni'], ['due dadi', 'i dadi'], ['tre tappi', 'i tappi']]
    .map(([un, il]) => ({ un, il, g: 'm', n: 'p' })),
].map(o => ({ ...o, cosa: o.il.replace(/^(il|la|le|i|l')\s?/, '').slice(0, 5) }))

const PRONOMI_OGGETTO = { ms: ['Lo', 'una cosa sola, maschile'], fs: ['La', 'una cosa sola, femminile'],
  fp: ['Le', 'più cose, femminili'] }
const QUANDO = ['Mentre riordina,', 'Per caso', 'Oggi', 'Stamattina', 'Mentre gioca,']
const DOVE_METTE = ['mette subito nello zaino', 'porta subito alla mamma', 'nasconde sotto il cuscino',
  'lava con cura sotto il rubinetto', 'mette in una scatolina']

function pronomeOggetto(sorte) {
  const A = sorte.uno(PERSONE)
  const cercata = sorte.uno(TROVATE.filter(o => !(o.g === 'm' && o.n === 'p')))
  /* l'altra cosa: genere o numero diversi, e se il pronome è «le» deve
     essere maschile — due femminili insieme farebbero ancora «le» */
  const altra = sorte.uno(TROVATE.filter(o => o.cosa !== cercata.cosa &&
    (o.g !== cercata.g || o.n !== cercata.n) && (cercata.n === 's' || o.g === 'm')))
  const [P, com] = PRONOMI_OGGETTO[cercata.g + cercata.n]
  const fa = sorte.uno(DOVE_METTE)
  const [o1, o2] = sorte.mescola([cercata, altra])
  const t = `${sorte.uno(QUANDO)} ${A.nome} trova ${o1.un} e ${o2.un}. ${P} ${fa}.`
  return domanda({
    testo: `Di chi o di che cosa parla «${P}»?`,
    soggetto: { testo: t, evidenzia: P },
    buona: testo(cercata.il),
    falsi: [
      testo(altra.il, `«${P}» vuol dire ${com}: con ${altra.il} non va d'accordo`),
      testo(A.nome, `${A.nome} è chi ${fa.split(' ')[0]}: «${P}» è quello che ${fa.split(' ')[0]}`),
    ],
    chiave: 'capire:pronome',
    aiuto: '«lo» è una cosa sola maschile, «la» una sola femminile, «le» tante femminili: '
         + 'cerca nel testo quella che va d\'accordo',
    sorte,
  })
}

const INCONTRI = ['al parco', 'in cortile', 'in biblioteca', 'alla fermata', 'in piazza']
const DONI = ['regala', 'presta', 'mostra', 'restituisce']
const COSE_DATE = ['un fumetto', 'una figurina', 'il suo disegno', 'una caramella',
  'il suo monopattino', 'un sasso colorato', 'una cartolina']

function pronomeTermine(sorte) {
  const [A, B] = persone(sorte, 2)
  const P = fin(B, 'Gli', 'Le')
  const verbo = sorte.uno(DONI)
  const cosa = sorte.uno(COSE_DATE)
  return domanda({
    testo: `Di chi o di che cosa parla «${P}»?`,
    soggetto: { testo: `${A.nome} incontra ${B.nome} ${sorte.uno(INCONTRI)}. ${P} ${verbo} ${cosa}.`, evidenzia: P },
    buona: testo(B.nome),
    falsi: [
      testo(A.nome, `${A.nome} è chi ${verbo}: «${P}» è a chi va ${cosa}`),
      testo(cosa, `${cosa} è la cosa data: «${P}» dice a chi`),
    ],
    chiave: 'capire:pronome',
    aiuto: '«gli» davanti al verbo vuol dire «a lui», «le» vuol dire «a lei»: è chi riceve, non chi fa',
    sorte,
  })
}

/* ═══════════════════════════════════════════════════════════════════
   5. INDIZIO — non è scritto, ma si capisce.

   Qui niente si genera a pezzi: ogni voce è scritta a mano, con il suo
   indizio e i suoi due falsi, perché la regola che la tiene in piedi —
   UN indizio solo, chiaro, e nessun falso che l'indizio lasci aperto —
   non si controlla combinando parti. Quello che si combina è chi c'è
   (trentadue nomi) e, dove serve, la frase d'apertura.

   L'apertura (`apre`) è la trappola: prepara il falso plausibile.
   «La famiglia va a trovare gli zii» fa pensare alla macchina; il
   controllore dice treno. Chi risponde con quello che succede di solito
   invece che con quello che c'è scritto cade lì, ed è esattamente la
   cosa che la tipologia insegna. L'apertura non contraddice mai
   l'indizio: mette solo davanti una strada più comoda.

   {A} è il nome, {o} la desinenza di chi è {A}.
   ═══════════════════════════════════════════════════════════════════ */

const COME_SI_SENTE = ['Come si sente {A}?', "Com'è {A}, in quel momento?"]
const CHE_TEMPO = ['Che tempo fa?', 'Che tempo fa fuori?']
const CHE_MOMENTO = ['In che momento della giornata siamo?', 'Quando succede?']
const DOVE_STA = ['Dove si trova {A}?', "Dov'è {A}?"]

const INDIZI = [
  /* ── come si sente ── */
  { chiedi: COME_SI_SENTE, t: 'Di notte {A} sente un rumore in corridoio. Trattiene il fiato e si tira la coperta sopra la testa.',
    giusta: 'spaventat{o}', indizio: 'trattiene il fiato e si nasconde sotto la coperta',
    falsi: [['arrabbiat{o}', 'chi è arrabbiato non si nasconde sotto la coperta'],
      ['felice', 'nel testo non c\'è niente di bello: c\'è un rumore al buio']] },
  { chiedi: COME_SI_SENTE, t: '{A} scarta il pacco, trova la bici che sognava da mesi e salta per tutta la stanza.',
    giusta: 'felice', indizio: 'salta per la stanza davanti al regalo che voleva',
    falsi: [['triste', 'chi è triste non salta per tutta la stanza'],
      ['spaventat{o}', 'non c\'è niente che faccia paura: c\'è un regalo']] },
  { chiedi: COME_SI_SENTE, t: 'Il suo migliore amico cambia città. {A} lo saluta dal cancello e resta lì, in silenzio, con gli occhi pieni di lacrime.',
    giusta: 'triste', indizio: 'resta in silenzio con gli occhi pieni di lacrime',
    falsi: [['felice', 'le lacrime e il silenzio non sono di chi è contento'],
      ['spaventat{o}', 'non c\'è niente di cui avere paura: l\'amico parte']] },
  { chiedi: COME_SI_SENTE, t: 'Qualcuno ha scarabocchiato il disegno di {A}. {A} pesta i piedi, diventa ross{o} in faccia e urla: «Chi è stato?»',
    giusta: 'arrabbiat{o}', indizio: 'pesta i piedi, diventa rosso e urla',
    falsi: [['annoiat{o}', 'chi si annoia non urla e non pesta i piedi'],
      ['felice', 'nessuno è contento se gli rovinano un disegno, e nessuno urla così per gioia']] },
  { chiedi: COME_SI_SENTE, t: 'Dopo la gita in montagna {A} si siede sul divano e si addormenta subito, con le scarpe ancora ai piedi.',
    giusta: 'stanc{o}', indizio: 'si addormenta subito, senza nemmeno togliersi le scarpe',
    falsi: [['arrabbiat{o}', 'chi è arrabbiato non si addormenta di colpo'],
      ['spaventat{o}', 'chi ha paura non si addormenta sul divano']] },
  { chiedi: COME_SI_SENTE, t: 'Piove da tre giorni. {A} guarda fuori dalla finestra, sbuffa e dice: «Uffa, non c\'è niente da fare!»',
    giusta: 'annoiat{o}', indizio: 'sbuffa e dice che non c\'è niente da fare',
    falsi: [['spaventat{o}', 'la pioggia non fa paura a {A}: sbuffa, non trema'],
      ['felice', '«uffa» non lo dice chi è contento']] },
  { chiedi: COME_SI_SENTE, t: '{A} mostra a tutti la medaglia della gara e racconta la sua corsa tre volte di fila.',
    giusta: 'orgoglios{o}', indizio: 'mostra a tutti la medaglia e racconta la corsa più volte',
    falsi: [['triste', 'chi è triste non mostra la medaglia a tutti'],
      ['annoiat{o}', 'chi si annoia non racconta tre volte la stessa cosa con la medaglia in mano']] },

  /* ── che tempo fa ── */
  { chiedi: CHE_TEMPO, apre: ["È una mattina di luglio."], t: '{A} esce di casa, apre l\'ombrello e cammina attent{o} a non finire nelle pozzanghere.',
    giusta: 'piove', indizio: 'apre l\'ombrello e cammina fra le pozzanghere',
    falsi: [['c\'è il sole', 'a luglio viene da pensare al sole, ma ombrello e pozzanghere dicono pioggia'],
      ['c\'è la nebbia', 'la nebbia non fa pozzanghere e non ci vuole l\'ombrello']] },
  { chiedi: CHE_TEMPO, t: '{A} si sventola con un giornale e beve tutta la borraccia d\'acqua fresca, all\'ombra di un albero.',
    giusta: 'fa molto caldo', indizio: 'si sventola, beve tanto e cerca l\'ombra',
    falsi: [['fa freddo', 'con il freddo non ci si sventola e non si cerca l\'ombra'],
      ['piove', 'nel testo non c\'è niente di bagnato, e all\'ombra si sta quando c\'è il sole']] },
  { chiedi: CHE_TEMPO, t: 'In spiaggia l\'aquilone di {A} sale altissimo senza bisogno di correre. Poi il cappello vola via e {A} lo rincorre.',
    giusta: 'c\'è vento', indizio: 'l\'aquilone sale da solo e il cappello vola via',
    falsi: [['c\'è la nebbia', 'con la nebbia l\'aquilone non vola da solo'],
      ['nevica', 'in spiaggia a far volare l\'aquilone non si va con la neve']] },
  { chiedi: CHE_TEMPO, t: '{A} soffia sulle mani, si tira su la sciarpa fino al naso e vede il suo fiato fare il fumo.',
    giusta: 'fa freddo', indizio: 'si scalda le mani e il fiato fa il fumo',
    falsi: [['fa caldo', 'con il caldo non si tira su la sciarpa e il fiato non fa il fumo'],
      ['c\'è vento', 'il vento può esserci, ma il testo non lo dice: il fiato che fumo dice freddo']] },

  /* ── che cosa è caduto (la neve è un indizio solo con il pupazzo) ── */
  { chiedi: ['Che cosa è caduto stanotte?'], t: 'Stanotte il giardino si è coperto di bianco. {A} infila i guanti e fa un pupazzo con una carota per naso.',
    giusta: 'la neve', indizio: 'tutto bianco, e ci si fa un pupazzo',
    falsi: [['la pioggia', 'la pioggia non fa il giardino bianco, e non ci si fa un pupazzo'],
      ['le foglie', 'le foglie non sono bianche, e con le foglie non si fa un pupazzo']] },

  /* ── che momento è ── */
  { chiedi: CHE_MOMENTO, t: 'Suona la sveglia. {A} sbadiglia, si stiracchia e va in cucina a fare colazione.',
    giusta: 'di mattina', indizio: 'suona la sveglia e si fa colazione',
    falsi: [['di sera', 'la colazione non si fa la sera'],
      ['a mezzogiorno', 'a mezzogiorno si pranza: la colazione viene prima']] },
  { chiedi: CHE_MOMENTO, apre: ['Oggi {A} ha giocato tanto.'], t: '{A} si mette il pigiama, si lava i denti e chiede una storia prima di dormire.',
    giusta: 'di sera', indizio: 'pigiama, denti lavati e una storia prima di dormire',
    falsi: [['di mattina', 'di mattina il pigiama si toglie, non si mette'],
      ['a pranzo', 'a pranzo non ci si mette il pigiama']] },
  { chiedi: CHE_MOMENTO, t: '{A} torna da scuola, fa merenda con pane e marmellata e poi comincia i compiti.',
    giusta: 'di pomeriggio', indizio: 'si torna da scuola, si fa merenda e poi i compiti',
    falsi: [['di mattina', 'di mattina a scuola ci si va, non si torna'],
      ['di notte', 'di notte non si fa merenda e non si fanno i compiti']] },

  /* ── dove si trova ── */
  { chiedi: DOVE_STA, apre: ['È estate.'], t: '{A} scava una buca nella sabbia e la riempie di acqua salata con il secchiello.',
    giusta: 'al mare', indizio: 'la sabbia e l\'acqua salata',
    falsi: [['in piscina', 'in piscina non c\'è la sabbia e l\'acqua non è salata'],
      ['in montagna', 'in montagna non si trova l\'acqua salata']] },
  { chiedi: DOVE_STA, t: '{A} sceglie un libro sui dinosauri da prendere in prestito e parla sottovoce per non disturbare.',
    giusta: 'in biblioteca', indizio: 'un libro in prestito e la voce bassa',
    falsi: [['al supermercato', 'al supermercato i libri non si prendono in prestito'],
      ['in palestra', 'in palestra non si scelgono libri e non si parla sottovoce']] },
  { chiedi: DOVE_STA, t: '{A} si mette la cuffia e gli occhialini, poi si tuffa dal trampolino e nuota fino al bordo.',
    giusta: 'in piscina', indizio: 'cuffia, occhialini, trampolino e bordo',
    falsi: [['in palestra', 'in palestra non ci si tuffa e non si nuota'],
      ['al parco', 'al parco non c\'è un trampolino dove tuffarsi']] },
  { chiedi: DOVE_STA, apre: ['È inverno.'], t: '{A} sale in cima con la seggiovia e poi scende sulla neve con gli sci ai piedi.',
    giusta: 'in montagna', indizio: 'la seggiovia e gli sci',
    falsi: [['al mare', 'al mare non ci sono seggiovie e non si scia'],
      ['in città', 'in città non si sale con la seggiovia']] },
  { chiedi: DOVE_STA, t: '{A} rompe le uova in una ciotola, aggiunge la farina e accende il forno.',
    giusta: 'in cucina', indizio: 'le uova, la farina e il forno',
    falsi: [['in bagno', 'in bagno non c\'è il forno'],
      ['in giardino', 'in giardino non si accende il forno per una torta']] },
  { chiedi: DOVE_STA, apre: ['La famiglia di {A} va a trovare gli zii.'], t: '{A} guarda i campi scorrere dal finestrino. Poi passa il controllore e chiede il biglietto.',
    giusta: 'in treno', indizio: 'il controllore che chiede il biglietto',
    falsi: [['in macchina', 'si va dagli zii anche in macchina, ma in macchina non passa il controllore'],
      ['a scuola', 'a scuola non c\'è il finestrino con i campi che scorrono']] },
  { chiedi: DOVE_STA, apre: ['È sabato, e {A} è con i cugini.'], t: 'Si spengono le luci. {A} sgranocchia i popcorn e guarda un film su uno schermo enorme, in mezzo a tanta gente.',
    giusta: 'al cinema', indizio: 'lo schermo enorme, le luci spente e tanta gente',
    falsi: [['a casa, sul divano', 'a casa lo schermo non è enorme e non c\'è tanta gente'],
      ['al circo', 'al circo non si guarda un film']] },
]

function indizio(sorte) {
  const A = sorte.uno(PERSONE)
  const v = sorte.uno(INDIZI)
  /* l'apertura c'è sempre, dove c'è: è la trappola, e i `perche`
     possono nominarla */
  const apre = v.apre ? vesti(sorte.uno(v.apre), A) + ' ' : ''
  return domanda({
    testo: vesti(sorte.uno(v.chiedi), A),
    soggetto: { testo: apre + vesti(v.t, A) },
    buona: testo(vesti(v.giusta, A)),
    falsi: v.falsi.map(([r, p]) => testo(vesti(r, A), vesti(p, A))),
    chiave: 'capire:indizio',
    aiuto: `non è scritto, ma c'è un indizio: ${v.indizio}`,
    sorte,
  })
}

/* ═══════════════════════════════════════════════════════════════════
   6. TITOLO — quello che va bene per tutto il testo.

   Ogni testo ha una frase che dice di cosa parla (`perno`, sempre in
   testa e sempre presa) e tre o quattro frasi che la raccontano, fra
   cui se ne prendono due. Ogni frase di contorno porta con sé il suo
   titolo-pezzetto, cioè il falso più vero che ci sia: è scritto, è nel
   testo, ma racconta una frase sola.

   L'altro falso è il titolo TROPPO LARGO: «Gli animali del bosco» per un
   testo sul riccio. Va bene per il testo, ma anche per altri mille, ed
   è lo sbaglio di chi ha capito l'argomento e non l'idea.

   Le frasi di contorno si reggono da sole — niente «Poi», niente «lo»
   che rimandi a una frase che potrebbe non esserci — perché si
   scelgono a due a due: un rimando è permesso solo verso il perno.
   ═══════════════════════════════════════════════════════════════════ */

const TESTI = [
  { perno: 'Il riccio passa tutto l\'inverno a dormire.',
    frasi: [['In autunno mangia tantissimi insetti per mettere su grasso.', 'Un pranzo di insetti'],
      ['Sotto una siepe si prepara un letto di foglie secche.', 'Un letto di foglie'],
      ['Lì si arrotola a palla, con gli aculei fuori.', 'Una palla di aculei'],
      ['Si sveglia solo quando torna il caldo della primavera.', 'Il caldo della primavera']],
    giusti: ['Il lungo sonno del riccio', "Come il riccio passa l'inverno"],
    largo: ['Gli animali del bosco', 'Le quattro stagioni'], perLargo: 'il testo parla solo del riccio' },
  { perno: 'Le api lavorano tutta l\'estate per fare il miele.',
    frasi: [['Volano di fiore in fiore a raccogliere il nettare.', 'I fiori del prato'],
      ['Chiudono ogni celletta piena con un tappo di cera.', 'Il tappo di cera'],
      ['Con quel miele, d\'inverno, sfamano tutto l\'alveare.', 'Il cibo per l\'inverno']],
    giusti: ['Le api e il loro miele', 'Il lavoro delle api'],
    largo: ['Gli insetti', 'La vita in campagna'], perLargo: 'il testo parla solo delle api e del miele' },
  { perno: 'Il faro è una torre che di notte aiuta le navi.',
    frasi: [['In cima ha una luce fortissima che gira sempre.', 'Una luce che gira'],
      ['I marinai vedono la sua luce anche da molto lontano.', 'Vedere lontano'],
      ['Grazie a lui le navi evitano gli scogli.', 'Gli scogli'],
      ['Un tempo ci viveva un guardiano che accendeva la luce.', 'Il guardiano']],
    giusti: ['Il faro, amico delle navi', 'A che cosa serve il faro'],
    largo: ['Il mare', 'Le cose del mare'], perLargo: 'il testo parla solo del faro' },
  { perno: 'La lumaca si porta sempre dietro la sua casa: il guscio.',
    frasi: [['Quando ha paura, si chiude tutta dentro.', 'Quando ha paura'],
      ['Se fa troppo secco, chiude l\'entrata con un velo di bava.', 'Il velo di bava'],
      ['Se il guscio si rompe un po\', lo ripara da sola.', 'Il guscio rotto']],
    giusti: ['La lumaca e la sua casa', 'Una casa sulla schiena'],
    largo: ['Gli animali del giardino', 'Gli animali lenti'], perLargo: 'il testo parla solo della lumaca e del suo guscio' },
  { perno: 'Ogni autunno le rondini partono per l\'Africa.',
    frasi: [['Volano per migliaia di chilometri, sopra il mare e il deserto.', 'Il deserto'],
      ['Là trovano il caldo e tanti insetti da mangiare.', 'Tanti insetti'],
      ['In primavera tornano, spesso nello stesso nido.', 'Lo stesso nido']],
    giusti: ['Il lungo viaggio delle rondini', 'Le rondini in viaggio'],
    largo: ['Gli uccelli', 'I paesi caldi'], perLargo: 'il testo parla solo delle rondini e del loro viaggio' },
  { perno: 'Il castoro è un grande costruttore di dighe.',
    frasi: [['Con i denti affilati rosicchia i tronchi finché cadono.', 'Denti affilati'],
      ['Trascina i rami nel fiume e li incastra con fango e sassi.', 'Fango e sassi'],
      ['Dietro la diga l\'acqua si alza e forma un laghetto.', 'Un laghetto']],
    giusti: ['Il castoro costruttore', 'Le dighe del castoro'],
    largo: ['Gli animali del fiume', 'I fiumi'], perLargo: 'il testo parla solo del castoro e delle sue dighe' },
  /* i tre che seguono sono storie, e hanno dentro chi le vive */
  { perno: 'Per il compleanno della nonna, {A} e il papà fanno una torta di mele.',
    frasi: [['Sbucciano le mele e le tagliano a fettine.', 'Le fettine di mela'],
      ['In forno diventa dorata e profuma tutta la casa.', 'Il profumo in casa'],
      ['La nonna ne mangia due fette e li abbraccia.', 'Due fette']],
    giusti: ['Una torta per la nonna', 'Il regalo più dolce'],
    largo: ['I dolci', 'Le feste'], perLargo: 'il testo parla di una torta sola, per la nonna' },
  { perno: '{A} perde il suo cane Pepe al parco e lo cerca dappertutto.',
    frasi: [['Chiede aiuto al giardiniere e a una signora con il passeggino.', 'Il giardiniere'],
      ['Guarda sotto le panchine e dietro la fontana.', 'La fontana'],
      ['Alla fine Pepe spunta dal chiosco dei gelati, scodinzolando.', 'Il chiosco dei gelati']],
    giusti: ["Dov'è finito Pepe?", 'La ricerca di Pepe'],
    largo: ['Gli animali di casa', 'I parchi della città'], perLargo: 'il testo parla solo di Pepe che si è perso' },
  { perno: '{A} vuole imparare ad andare in bici senza le rotelle.',
    frasi: [['Il primo giorno cade due volte e si sbuccia un ginocchio.', 'Il ginocchio sbucciato'],
      ['Il papà corre accanto e tiene il sellino.', 'Il papà che corre'],
      ['Dopo una settimana pedala da sol{o} fino in fondo alla strada.', 'In fondo alla strada']],
    giusti: ['Finalmente senza rotelle', '{A} impara la bici'],
    largo: ['Gli sport', 'I giochi all\'aperto'], perLargo: 'il testo parla solo di imparare la bici' },
]

function titolo(sorte) {
  const A = sorte.uno(PERSONE)
  const v = sorte.uno(TESTI)
  /* due frasi di contorno, nell'ordine in cui stanno */
  const prese = sorte.alcuni(v.frasi.map((f, i) => i), 2).sort((a, b) => a - b).map(i => v.frasi[i])
  const t = [v.perno, ...prese.map(f => f[0])].map(f => vesti(f, A)).join(' ')
  const pezzo = sorte.uno(prese)[1]
  const largo = sorte.uno(v.largo)
  return domanda({
    testo: sorte.uno(['Qual è il titolo migliore per questo testo?', 'Quale titolo va bene per tutto il testo?']),
    soggetto: { testo: t },
    buona: testo(vesti(sorte.uno(v.giusti), A)),
    falsi: [
      testo(pezzo, 'racconta una frase sola, non tutto il testo'),
      testo(largo, `è troppo largo: ${v.perLargo}`),
    ],
    chiave: 'capire:titolo',
    aiuto: 'il titolo giusto va bene per tutte le frasi, non per una sola, e non per mille altri testi',
    sorte,
  })
}

/* ── che cosa si chiede a ogni grado ── */
const SCALETTA = [
  'chi, dove e che cosa, in due frasi',
  'chi, dove e che cosa, in un testo più lungo',
  'prima e dopo, il perché, e quello che si capisce senza leggerlo',
  'di chi parla un pronome, e quello che si capisce senza leggerlo',
  'quello che si capisce senza leggerlo, e il titolo giusto',
]

/* ── Le tipologie, e quanto è complicata ognuna ──
   La scala è quella di tutto il catalogo: 0 = quattro anni, 12,5 punti
   per anno di scuola, 100 = fine primaria. Il metro è il programma
   (Indicazioni nazionali 2012 per l'italiano, lettura):

   · TROVA 31 e 40. Due frasi da una dozzina di parole, con l'informazione
     scritta, si leggono nella seconda metà della prima (6 anni e mezzo);
     il testo con il nome in più e la frase in più è da inizio seconda.
     Sotto non si va: sotto c'è chi le lettere le sta ancora imparando,
     e per lui un testo di due frasi è muto.
   · ORDINE 50, PERCHÉ 53. «Cogliere le relazioni» fra le informazioni di
     un testo — il prima e il dopo, la causa — è un obiettivo di fine
     terza. Il perché sta un poco più su perché i ponti con il motivo
     scritto PRIMA («così», «per questo») chiedono di rigirare la frase.
   · INDIZIO 50. Ricavare quello che non è scritto è un obiettivo di fine
     quinta, ma i nostri indizi sono uno solo e quotidiano (pigiama,
     denti lavati, la storia prima di dormire: è sera), e a otto anni si
     leggono — l'aveva messo a 66, e guardando gli esempi il proprietario
     l'ha riportato qui. Esce già dal grado 3, accanto al prima-e-dopo.
   · PRONOME 63. Tenere il filo dei riferimenti è un obiettivo di fine
     quinta, e una delle cose che le prove nazionali chiedono di più: si
     mette all'inizio della quarta, univoco per grammatica.
   · TITOLO 72. Scegliere fra il titolo giusto, il pezzetto e quello
     troppo largo vuol dire distinguere l'argomento dall'idea principale:
     da fine quarta. */
const TIPI = [
  { chiave: 'capire:trova', nome: 'Chi, dove, che cosa: è scritto nel testo', sa: SA,
    livello: { 1: 31, 2: 40 }, gradi: { 1: 1, 2: 1 } },
  { chiave: 'capire:ordine', nome: 'Prima e dopo: l\'ordine in cui le cose succedono', sa: SA,
    livello: 50, gradi: { 3: 0.55 } },
  { chiave: 'capire:perche', nome: 'Il perché scritto nel testo', sa: SA,
    livello: 53, gradi: { 3: 0.45 } },
  { chiave: 'capire:pronome', nome: 'Di chi parla «lei», «lo», «gli»', sa: SA,
    livello: 63, gradi: { 4: 0.5 } },
  { chiave: 'capire:indizio', nome: 'Quello che non è scritto ma si capisce', sa: SA,
    livello: 50, gradi: { 3: 0.35, 4: 0.5, 5: 0.4 } },
  { chiave: 'capire:titolo', nome: 'Il titolo giusto per tutto il testo', sa: SA,
    livello: 72, gradi: { 5: 0.6 } },
]

class Capire extends Modulo {
  constructor() {
    super({
      id: 'capire',
      nome: 'Capire un testo',
      icona: '📚',
      materia: 'italiano',
      chiaro: 'leggere due o tre frasi e ritrovarci chi, dove, quando, perché — e quello che si capisce senza che sia scritto',
      scaletta: SCALETTA,
      /* QUANTO È COMPLICATO OGNI GRADO, da 0 a 100 — la media delle sue
         tipologie, scritte una per una qui sopra con il perché */
      livelli: [31, 40, 51, 57, 63],
      tipi: TIPI,
    })
  }

  genera(grado, sorte, tipo) {
    return lucida(this.componi(grado, sorte, tipo))
  }

  componi(grado, sorte, tipo) {
    switch (tipo) {
      case 'capire:ordine': return ordine(sorte)
      case 'capire:perche': return perche(sorte)
      case 'capire:pronome':
        return sorte.uno([pronomeSoggetto, pronomeOggetto, pronomeTermine])(sorte)
      case 'capire:indizio': return indizio(sorte)
      case 'capire:titolo': return titolo(sorte)
      default: {
        /* il grado 2 è lo stesso testo con una frase e un nome in più */
        const lungo = grado >= 2
        return sorte.uno([trovaPorta, trovaCerca, trovaSpesa, trovaGioco])(sorte, lungo)
      }
    }
  }
}

/* le persone escono anche per `unita/capire`, che controlla che un «lei»
   abbia davvero una femmina sola nel testo */
export { PERSONE }

export default new Capire()
