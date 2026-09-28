/* Capire un testo: leggere due o tre frasi e ritrovarci dentro le cose —
   la competenza mancante nel catalogo (le altre domande di italiano
   guardano una parola alla volta). Il testo si genera da uno stampo con
   parti intercambiabili, mai scritto a mano, e sta sempre sotto le 35
   parole (è un pedaggio, non una verifica di lettura). Sei tipologie,
   dalla più facile: trova (chi/dove/cosa, scritto), ordine (successione
   contro scrittura), perche (il motivo con un connettivo), pronome
   (univoco per grammatica, mai per buon senso), indizio (un solo indizio
   preciso, scritto a mano voce per voce), titolo (buono per tutto il
   testo, non troppo largo). Due risposte difendibili sono un guasto che
   nessun controllo automatico vede: le regole sono nei dati. */

import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo } from '../nucleo/domanda.js'

const SA = 'comprensione' // gruppo suo, non «leggere le parole»: quello si spegne in basso (l'ha già fatto), questo in alto

// col genere, per concordanze e pronomi; sedici e sedici, con meno le stesse coppie tornano troppo presto
const PERSONE = [
  ...['Bruno', 'Dario', 'Fabio', 'Lapo', 'Nico', 'Piero', 'Ugo', 'Zeno', 'Ettore',
    'Tommaso', 'Samuele', 'Giacomo', 'Renato', 'Filippo', 'Carlo', 'Mattia']
    .map(nome => ({ nome, g: 'm' })),
  ...['Ada', 'Carla', 'Elisa', 'Gaia', 'Irene', 'Marta', 'Rita', 'Viola', 'Bianca',
    'Nora', 'Greta', 'Alice', 'Livia', 'Teresa', 'Olivia', 'Lucia']
    .map(nome => ({ nome, g: 'f' })),
]

const fin = (p, m, f) => (p.g === 'm' ? m : f) // la desinenza che concorda: fin(p, 'o', 'a'), «sudat» + o/a
const maiuscola = s => s[0].toUpperCase() + s.slice(1)

const persone = (sorte, n, filtro = () => true) => sorte.alcuni(PERSONE.filter(filtro), n)

const vesti = (t, p) => t.replaceAll('{A}', p.nome).replaceAll('{o}', fin(p, 'o', 'a'))

// la d eufonica: i nomi arrivano a caso, quindi non si scrive a mano nello stampo, si applica dopo su tutto il testo
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

// 1. TROVA (chi, dove, che cosa: è scritto). La difficoltà vera è non prendere il nome sbagliato vicino a quello giusto

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

// i posti di casa dove una cosa si perde, e quelli da cui si torna
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

// cercare non è trovare: il posto dove si cerca è scritto per primo, ed è quello che prende chi legge in fretta
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

// chi compra che cosa: un grande va con loro e non compra niente, il «citato ma non agisce» nella forma più pulita
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

// chi gioca con chi: chi sceglie il compagno invece di chi fa l'azione ha preso il nome e non il posto del nome
function trovaGioco(sorte, lungo) {
  const [A, B, C, D] = persone(sorte, 4)
  const solo = sorte.uno(DA_SOLO)
  const ins = sorte.uno(INSIEME)
  const righe = [`${sorte.uno(GIARDINI)} ${A.nome} ${solo} e ${B.nome} ${ins} con ${C.nome}.`]
  if (lungo) righe.push(`Più tardi arriva ${D.nome} con il cane.`)
  const soggetto = { testo: righe.join(' ') }
  const arriva = testo(D.nome, `${D.nome} arriva più tardi, con il cane`)
  // «con chi gioca B» ha due risposte sole finché non c'è il quarto nome: si chiede solo nel testo lungo
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

// 2. ORDINE: quello che succede prima, contro quello scritto prima; il mondo non deve suggerirlo (verbi con «avere», mai «essere»)
// metà degli stampi rimescola e metà no, per non far imparare «prendi sempre quella in fondo»

// [infinito, presente, participio]
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

// gli stampi: x/y/z sono le tre azioni nell'ordine in cui succedono; nota dice, per quella fuori posto, quale parola la sposta
const ORDINI = [
  ({ A, x, y, z }) => ({ // scritta per prima, succede per ultima
    testo: `Prima di ${z.inf}, ${A} ${x.pres} e poi ${y.pres}.`,
    nota: { z: `«prima di ${z.inf}» la manda in fondo, anche se è scritta per prima` },
  }),
  ({ A, x, y, z }) => ({ // la prima in fondo, l'ultima in cima: il rovescio completo
    testo: `${A} ${z.pres} dopo aver ${y.pp}. E prima di ${y.inf}, ${x.pres}.`,
    nota: {
      z: `«dopo aver ${y.pp}» la manda in fondo, anche se è scritta per prima`,
      x: `«prima di ${y.inf}» la porta in testa, anche se è scritta per ultima`,
    },
  }),
  ({ A, x, y, z }) => ({ // «ma prima» torna indietro di un passo
    testo: `${A} ${y.pres}, ma prima ${x.pres}. Solo alla fine ${z.pres}.`,
    nota: { x: '«ma prima» la porta in testa, anche se è scritta dopo' },
  }),
  // questi tre sono nell'ordine giusto: servono a non far imparare che la risposta sta sempre dall'altra parte
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

// 3. PERCHÉ: il motivo con una parola-ponte. Un falso è vero nel mondo ma non detto dal testo, l'altro è scritto ma di un altro
// il ponte cambia il verso (dopo «perché»/«siccome»/«dato che», prima con «così»/«per questo»)
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

// quello che fa l'altra persona: niente che possa sembrare un motivo di qualcosa (renderebbe il falso difendibile)
const INTANTO = ['fa i compiti', 'apparecchia la tavola', 'annaffia le piante', 'prepara lo zaino',
  'legge il giornale', 'disegna una casa', 'piega le magliette']

const PONTI = [
  { dove: 'dopo «perché»', scrivi: (A, c, fa) => `${A} ${fa} perché ${c.t}.` },
  // col motivo in testa il nome va dentro il motivo: dopo una frase su Bruno, «Siccome ha la febbre, Nico…» confonderebbe
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

// 4. PRONOME: di chi parla «lei», «la», «gli» (in rilievo nel testo). Tre stampi, ognuno univoco per una ragione grammaticale
// diversa: soggetto (un solo genere in scena), complemento oggetto (genere/numero, mai «li»), termine (chi riceve ≠ chi dà)

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

// cosa è il nome senza articolo, serve solo a non mettere nella stessa frase «una biglia» e «tre biglie»
const TROVATE = [
  ...[['un quaderno', 'il quaderno'], ['un fischietto', 'il fischietto'], ['un pennarello', 'il pennarello'],
    ['un elastico', "l'elastico"], ['un sasso liscio', 'il sasso liscio'], ['un braccialetto', 'il braccialetto'],
    ['un calzino', 'il calzino']].map(([un, il]) => ({ un, il, g: 'm', n: 's' })),
  ...[['una matita', 'la matita'], ['una biglia', 'la biglia'], ['una cartolina', 'la cartolina'],
    ['una chiave', 'la chiave'], ['una conchiglia', 'la conchiglia'], ['una moneta', 'la moneta'],
    ['una figurina', 'la figurina']].map(([un, il]) => ({ un, il, g: 'f', n: 's' })),
  ...[['due figurine', 'le figurine'], ['tre biglie', 'le biglie'], ['due mollette', 'le mollette'],
    ['tre conchiglie', 'le conchiglie']].map(([un, il]) => ({ un, il, g: 'f', n: 'p' })),
  // questi solo come «l'altra cosa»: «li» non è mai il pronome chiesto
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
  // l'altra cosa: genere o numero diversi; se il pronome è «le» dev'essere maschile, o due femminili farebbero ancora «le»
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

// 5. INDIZIO: non è scritto, ma si capisce. Ogni voce è scritta a mano (un indizio solo, due falsi) perché la regola
// non si controlla combinando parti; l'apertura (`apre`) è la trappola che prepara il falso plausibile senza contraddire l'indizio

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
  // l'apertura, dove c'è: è la trappola, e i perche possono nominarla
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

// 6. TITOLO: buono per tutto il testo. Un falso è il titolo-pezzetto (racconta una sola frase), l'altro è troppo largo
// le frasi di contorno si reggono da sole (niente «poi»/«lo»): si scelgono a due a due, un rimando solo verso il perno

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
  // i tre che seguono sono storie, e hanno dentro chi le vive
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
  // due frasi di contorno, nell'ordine in cui stanno
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

const SCALETTA = [
  'chi, dove e che cosa, in due frasi',
  'chi, dove e che cosa, in un testo più lungo',
  'prima e dopo, il perché, e quello che si capisce senza leggerlo',
  'di chi parla un pronome, e quello che si capisce senza leggerlo',
  'quello che si capisce senza leggerlo, e il titolo giusto',
]

// livelli tarati sul programma (Indicazioni 2012, italiano/lettura): vedi docs/apprendimento/quiz-livelli.md
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
      livelli: [31, 40, 51, 57, 63], // la media delle sue tipologie, tarate una per una qui sopra

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
