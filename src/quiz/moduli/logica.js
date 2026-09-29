// unico modulo che non chiede di sapere niente (saperi vuoto): due o tre frasi, la risposta sta tutta lì. La terza risposta («non si può sapere») è il punto del modulo: una regola vale in un verso solo. Creature inventate apposta, così l'unica strada è leggere le premesse, non l'esperienza. Quattro passi/chiavi che tornano a ogni grado sotto vestiti diversi: log:diretta (sì), log:negata (no), log:girata e log:non-detta (non si sa) — più log:nessuno (esclusione), log:ordine (confronti in fila), log:catena (due regole attaccate).
import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo } from '../nucleo/domanda.js'

// sempre scritte così: cambia solo quale è buona, mai come si legge — un bambino deve pensare alle frasi, non ai tasti
const SI = 'sì, di sicuro'
const NO = 'no, di sicuro'
const BOH = 'non si può sapere'

// nomi che non vogliono dire niente di proposito; l'articolo non si scrive a mano («uno snizzo»/«un grufolo» si sbagliano da soli)
const CREATURE = [
  ['grufoli', 'grufolo'], ['snizzi', 'snizzo'], ['tarlocchi', 'tarlocco'],
  ['brindoli', 'brindolo'], ['mufali', 'mufalo'], ['zampiri', 'zampiro'],
  ['ciuffardi', 'ciuffardo'], ['gnappi', 'gnappo'], ['ronfoli', 'ronfolo'],
  ['sbrisi', 'sbriso'], ['pilucchi', 'pilucco'], ['tromboli', 'trombolo'],
  ['murgoli', 'murgolo'], ['fanfi', 'fanfo'], ['dranfi', 'dranfo'],
  ['quarnoli', 'quarnolo'], ['scrimoli', 'scrimolo'], ['bufigli', 'bufiglio'],
].map(([p, s]) => ({ p, s }))

// vocale, s+consonante, z, gn, ps, x: la stessa regola per tutti e tre gli articoli, scritta una volta sola
const vuoleLo = n => /^(?:[aeiou]|z|gn|ps|x|s[bcdfgklmnpqrtvz])/.test(n)
const iPlur = n => (vuoleLo(n) ? 'gli' : 'i')
const unSing = n => (vuoleLo(n) ? 'uno' : 'un')
const nessunSing = n => (vuoleLo(n) ? 'nessuno' : 'nessun')

// plurale per le regole, singolare per i casi; proprietà arbitrarie apposta, nessuna si indovina sapendo com'è il mondo
const TRATTI = [
  { p: 'hanno le ali', s: 'ha le ali' },
  { p: 'sono verdi', s: 'è verde' },
  { p: 'dormono di giorno', s: 'dorme di giorno' },
  { p: 'sanno cantare', s: 'sa cantare' },
  { p: 'brillano al buio', s: 'brilla al buio' },
  { p: 'hanno la coda a spirale', s: 'ha la coda a spirale' },
  { p: 'portano il cappello', s: 'porta il cappello' },
  { p: 'mangiano solo more', s: 'mangia solo more' },
  { p: 'hanno tre occhi', s: 'ha tre occhi' },
  { p: 'saltano altissimo', s: 'salta altissimo' },
  { p: 'hanno le orecchie a punta', s: 'ha le orecchie a punta' },
  { p: 'fanno le bolle', s: 'fa le bolle' },
  { p: 'vivono nel lago', s: 'vive nel lago' },
  { p: 'hanno il pelo blu', s: 'ha il pelo blu' },
  { p: "camminano all'indietro", s: "cammina all'indietro" },
  { p: 'hanno paura del buio', s: 'ha paura del buio' },
].map(t => ({ p: t.p, s: t.s, no: 'non ' + t.s }))

// nomi corti che non dicono il genere: «Nina è un grufolo» resta una frase su un grufolo, non su una bambina
const BESTIE = ['Bibo', 'Momo', 'Kiki', 'Zaza', 'Pippo', 'Milo', 'Teo', 'Gigi',
  'Nino', 'Ciro', 'Lillo', 'Tobi', 'Ubo', 'Fufi', 'Nanà', 'Bombo']

// col genere: «più alta»/«più alto» devono concordare, una frase sgrammaticata è un inciampo gratis
const BAMBINI = [
  ['Ada', 'f'], ['Marco', 'm'], ['Sara', 'f'], ['Luca', 'm'], ['Nina', 'f'],
  ['Teo', 'm'], ['Gaia', 'f'], ['Bruno', 'm'], ['Lia', 'f'], ['Enea', 'm'],
  ['Vera', 'f'], ['Elia', 'm'], ['Mia', 'f'], ['Dario', 'm'],
].map(([nome, g]) => ({ nome, g }))

// piu/meno sono i due capi della stessa fila; il modulo chiede sempre uno dei due, mai «chi è medio»
const CONFRONTI = [
  { piu: { m: 'più alto', f: 'più alta' }, meno: { m: 'più basso', f: 'più bassa' }, cima: 'il più alto', fondo: 'il più basso' },
  { piu: { m: 'più veloce', f: 'più veloce' }, meno: { m: 'più lento', f: 'più lenta' }, cima: 'il più veloce', fondo: 'il più lento' },
  { piu: { m: 'più grande', f: 'più grande' }, meno: { m: 'più piccolo', f: 'più piccola' }, cima: 'il più grande', fondo: 'il più piccolo' },
  { piu: { m: 'più forte', f: 'più forte' }, meno: { m: 'meno forte', f: 'meno forte' }, cima: 'il più forte', fondo: 'il meno forte' },
]

// `se` è ciò che capita, `fa` ciò che fa questo bambino; `seNo` è scritta a mano («non il gatto ha fame» non si ricava con un "non" davanti)
const REGOLE = [
  { se: 'piove', seNo: 'non piove', fa: "prende l'ombrello", fatto: "ha preso l'ombrello" },
  { se: "c'è vento", seNo: "non c'è vento", fa: "porta l'aquilone", fatto: "ha portato l'aquilone" },
  { se: 'fa freddo', seNo: 'non fa freddo', fa: 'mette il cappotto', fatto: 'ha messo il cappotto' },
  { se: 'nevica', seNo: 'non nevica', fa: 'prende lo slittino', fatto: 'ha preso lo slittino' },
  { se: "c'è il sole", seNo: "non c'è il sole", fa: 'mette il cappellino', fatto: 'ha messo il cappellino' },
  { se: 'è domenica', seNo: 'non è domenica', fa: 'fa i pancake', fatto: 'ha fatto i pancake' },
  { se: 'il gatto ha fame', seNo: 'il gatto non ha fame', fa: 'apre la scatoletta', fatto: 'ha aperto la scatoletta' },
  { se: "c'è la partita", seNo: "non c'è la partita", fa: 'accende la tv', fatto: 'ha acceso la tv' },
  { se: 'il pane è finito', seNo: 'il pane non è finito', fa: 'compra il pane', fatto: 'ha comprato il pane' },
  { se: 'la maestra dà i compiti', seNo: 'la maestra non dà i compiti', fa: 'apre lo zaino', fatto: 'ha aperto lo zaino' },
  { se: 'la piscina è aperta', seNo: 'la piscina è chiusa', fa: 'porta il costume', fatto: 'ha portato il costume' },
  { se: 'fa buio', seNo: 'non fa buio', fa: 'accende la lampada', fatto: 'ha acceso la lampada' },
  { se: 'è il compleanno della nonna', seNo: 'non è il compleanno della nonna', fa: 'porta i fiori', fatto: 'ha portato i fiori' },
  { se: 'la bici ha la gomma a terra', seNo: 'la bici ha le gomme gonfie', fa: "prende l'autobus", fatto: "ha preso l'autobus" },
  { se: 'il forno è acceso', seNo: 'il forno è spento', fa: 'mette il grembiule', fatto: 'ha messo il grembiule' },
]

// perOpposto: si legge scegliendo il secco sbagliato; perBoh: fermandosi troppo presto; girata: le due fughe quando la buona è «non si sa»
function treRisposte(giusta, { girata, perBoh, perOpposto }) {
  const buona = testo(giusta === 'si' ? SI : giusta === 'no' ? NO : BOH)
  if (giusta === 'boh') {
    return {
      buona,
      falsi: [
        testo(SI, girata),
        testo(NO, 'nemmeno il contrario è detto: da quello che sai potrebbe essere di sì, ma anche di no'),
      ],
    }
  }
  return { buona, falsi: [testo(giusta === 'no' ? SI : NO, perOpposto), testo(BOH, perBoh)] }
}

const maiuscola = s => s.charAt(0).toUpperCase() + s.slice(1)

// una premessa per riga: di seguito diventano un paragrafo che a otto anni si legge di corsa (la scheda rispetta pre-line)
const frasi = (...righe) => righe.join('\n')

const SCALETTA = [
  'tutti e nessuno',
  'chi è più alto di chi',
  'la regola girata: quando non si può sapere',
  'se… allora',
  'le catene di regole',
]

// le tipologie sono le forme logiche, non i gradi: la stessa forma torna vestita da un'altra storia, la chiave dice sempre cosa si è ragionato
const TIPI = [
  { chiave: 'log:diretta', nome: 'La regola applicata dritta', sa: 'deduzione',
    gradi: { 1: 0.5, 3: 0.34, 4: 0.26 } },
  { chiave: 'log:nessuno', nome: '«Nessuno» vuol dire nessuno', sa: 'insiemi',
    gradi: { 1: 0.5, 5: 0.24 } },
  { chiave: 'log:ordine', nome: 'Chi è più alto di chi', sa: 'confronti',
    gradi: { 2: 1 } },
  { chiave: 'log:girata', nome: 'La regola girata: non si può sapere', sa: 'incertezza',
    gradi: { 3: 0.33, 4: 0.23 } },
  { chiave: 'log:negata', nome: 'Quando la regola non è scattata', sa: 'deduzione',
    gradi: { 3: 0.33, 4: 0.25 } },
  { chiave: 'log:non-detta', nome: 'Quello che la regola non dice', sa: 'incertezza',
    gradi: { 4: 0.26 } },
  { chiave: 'log:catena', nome: 'Le catene di regole', sa: 'deduzione',
    gradi: { 5: 0.76 } },
]

class Logica extends Modulo {
  constructor() {
    super({
      id: 'logica',
      nome: 'Logica',
      icona: '🧩',
      materia: 'logica',
      chiaro: 'ragionare su quello che è scritto: cosa viene di sicuro e cosa non si può sapere',
      scaletta: SCALETTA,
      livelli: [25, 29, 56, 63, 75], // scala 0-100 comune a tutte le materie (vedi docs/apprendimento/quiz-livelli.md)
      tipi: TIPI, // i gruppi non sono pezzi di programma scolastico: sono tipi di ragionamento da isolare
    })
  }

  genera(grado, sorte, tipo) {
    switch (tipo) {
      case 'log:nessuno': return grado >= 5 ? this.catena(sorte, 'nessuno') : this.tuttiNessuno(sorte, false)
      case 'log:ordine': return this.inFila(sorte)
      case 'log:girata': return grado >= 4 ? this.seAllora(sorte, 'girata') : this.regolaGirata(sorte, 'girata')
      case 'log:negata': return grado >= 4 ? this.seAllora(sorte, 'negata') : this.regolaGirata(sorte, 'negata')
      case 'log:non-detta': return this.seAllora(sorte, 'non-detta')
      case 'log:catena': return this.catena(sorte, sorte.uno(['tira', 'sghemba', 'lunga']))
      default:
        return grado >= 4 ? this.seAllora(sorte, 'diretta')
          : grado >= 3 ? this.regolaGirata(sorte, 'diretta') : this.tuttiNessuno(sorte, true)
    }
  }

  // solo due risposte: «non si può sapere» qui non è mai giusto (arriva al grado 3, dove è vero)
  tuttiNessuno(sorte, quale) {
    const c = sorte.uno(CREATURE)
    const t = sorte.uno(TRATTI)
    const chi = sorte.uno(BESTIE)
    const tutti = quale ?? sorte.forse(0.5)

    const regola = tutti
      ? `Tutti ${iPlur(c.p)} ${c.p} ${t.p}.`
      : `${maiuscola(nessunSing(c.s))} ${c.s} ${t.s}.`

    return domanda({
      testo: frasi(regola, `${chi} è ${unSing(c.s)} ${c.s}.`, `${chi} ${t.s}?`),
      buona: testo(tutti ? SI : NO),
      falsi: [testo(tutti ? NO : SI, tutti
        ? `la regola non fa eccezioni: vale per tutti ${iPlur(c.p)} ${c.p}, e ${chi} è ${unSing(c.s)} ${c.s}`
        : `${maiuscola(nessunSing(c.s))} ${c.s} lo fa, e ${chi} è ${unSing(c.s)} ${c.s}: quindi no`)],
      chiave: tutti ? 'log:diretta' : 'log:nessuno',
      aiuto: 'la regola parla di tutti, e lui è uno di quelli: quello che vale per tutti vale anche per lui',
      sorte,
    })
  }

  // le premesse escono mescolate apposta: in ordine si leggerebbero senza ragionare, come una copiatura
  inFila(sorte) {
    const quanti = sorte.forse(0.35) ? 4 : 3
    const gente = sorte.alcuni(BAMBINI, quanti)   // gente[0] è il primo della fila
    const c = sorte.uno(CONFRONTI)

    // le coppie vicine si dicono, il resto si deduce
    const premesse = []
    for (let i = 0; i < gente.length - 1; i++) {
      const a = gente[i]
      const b = gente[i + 1]
      premesse.push(`${a.nome} è ${c.piu[a.g]} di ${b.nome}.`)
    }

    const cerchiamoIlPrimo = sorte.forse(0.5)
    const giusto = cerchiamoIlPrimo ? gente[0] : gente[gente.length - 1]
    const opposto = cerchiamoIlPrimo ? gente[gente.length - 1] : gente[0]

    const falsi = [testo(opposto.nome, 'quello è il capo opposto della fila: rileggi cosa chiede la domanda')]
    for (const m of gente.slice(1, -1)) falsi.push(testo(m.nome, 'sta in mezzo: qualcuno lo batte e lui ne batte un altro'))

    return domanda({
      testo: frasi(...sorte.mescola(premesse), `Chi è ${cerchiamoIlPrimo ? c.cima : c.fondo}?`),
      buona: testo(giusto.nome),
      falsi,
      chiave: 'log:ordine',
      aiuto: 'mettili in fila uno dietro l\'altro: chi batte qualcuno gli sta davanti, e ai due capi della fila ci sono il primo e l\'ultimo',
      sorte,
    })
  }

  // le tre forme si somigliano parola per parola apposta: un aspetto suo farebbe riconoscere la domanda invece di leggerla
  regolaGirata(sorte, quale) {
    const c = sorte.uno(CREATURE)
    const t = sorte.uno(TRATTI)
    const chi = sorte.uno(BESTIE)
    const forma = quale || sorte.uno(['diretta', 'girata', 'negata'])
    const regola = `Tutti ${iPlur(c.p)} ${c.p} ${t.p}.`

    if (forma === 'diretta') {
      const r = treRisposte('si', {
        perOpposto: `la regola vale per tutti ${iPlur(c.p)} ${c.p}, senza eccezioni`,
        perBoh: 'qui la regola basta: è un caso di quelli di cui parla, quindi si sa',
      })
      return domanda({
        testo: frasi(regola, `${chi} è ${unSing(c.s)} ${c.s}.`, `${chi} ${t.s}?`),
        buona: r.buona, falsi: r.falsi,
        chiave: 'log:diretta',
        aiuto: `${chi} è ${unSing(c.s)} ${c.s}, e la regola parla di tutti: quindi vale anche per lui`,
        sorte,
      })
    }

    if (forma === 'girata') {
      const r = treRisposte('boh', {
        girata: `la regola vale in un verso solo: dice che ${c.p} ${t.p}, non che soltanto loro lo fanno`,
      })
      return domanda({
        testo: frasi(regola, `${chi} ${t.s}.`, `${chi} è ${unSing(c.s)} ${c.s}?`),
        buona: r.buona, falsi: r.falsi,
        chiave: 'log:girata',
        aiuto: `la regola dice cosa fanno ${iPlur(c.p)} ${c.p}, non chi altro lo può fare: uno che ${t.s} può essere anche altro`,
        sorte,
      })
    }

    const r = treRisposte('no', {
      perOpposto: `${maiuscola(unSing(c.s))} ${c.s} ${t.s} di sicuro, e ${chi} invece ${t.no}`,
      perBoh: `qui si può sapere: la regola non fa eccezioni, e ${chi} ${t.no}`,
    })
    return domanda({
      testo: frasi(regola, `${chi} ${t.no}.`, `${chi} è ${unSing(c.s)} ${c.s}?`),
      buona: r.buona, falsi: r.falsi,
      chiave: 'log:negata',
      aiuto: `la regola vale per tutti: uno che ${t.no} non può essere ${unSing(c.s)} ${c.s}`,
      sorte,
    })
  }

  // «ogni volta che» e non «se… allora»: «se» parlato si sente spesso come «solo se», che darebbe due risposte difendibili
  seAllora(sorte, quale) {
    const g = sorte.uno(REGOLE)
    const chi = sorte.uno(BAMBINI).nome
    const forma = quale || sorte.uno(['diretta', 'negata', 'girata', 'non-detta'])
    const regola = `Ogni volta che ${g.se}, ${chi} ${g.fa}.`

    if (forma === 'diretta') {
      const r = treRisposte('si', {
        perOpposto: `la regola dice proprio questo: ogni volta che ${g.se}, lo fa`,
        perBoh: 'qui si sa: la cosa che fa scattare la regola è successa',
      })
      return domanda({
        testo: frasi(regola, `Oggi ${g.se}.`, `${chi} ${g.fatto}?`),
        buona: r.buona, falsi: r.falsi,
        chiave: 'log:diretta',
        aiuto: `«ogni volta» vuol dire tutte le volte, e oggi ${g.se}`,
        sorte,
      })
    }

    if (forma === 'negata') {
      const r = treRisposte('no', {
        perOpposto: `quando ${g.se} lo fa sempre, e oggi non l'ha fatto`,
        perBoh: `qui si può sapere: la regola non salta mai un giorno, e oggi non l'ha fatto`,
      })
      return domanda({
        testo: frasi(regola, `Oggi ${chi} non ${g.fatto}.`, `${maiuscola(g.se)}?`),
        buona: r.buona, falsi: r.falsi,
        chiave: 'log:negata',
        aiuto: `la regola non salta mai un giorno: se oggi ${g.se}, lo avrebbe fatto. Non l'ha fatto, quindi non ${g.se}`,
        sorte,
      })
    }

    if (forma === 'girata') {
      const r = treRisposte('boh', {
        girata: `la regola dice cosa succede quando ${g.se}, non che lo faccia solo allora: può averlo fatto per un altro motivo`,
      })
      return domanda({
        testo: frasi(regola, `Oggi ${chi} ${g.fatto}.`, `${maiuscola(g.se)}?`),
        buona: r.buona, falsi: r.falsi,
        chiave: 'log:girata',
        aiuto: `la regola va in un verso solo: ${g.se} → lo fa. Al contrario non è detto`,
        sorte,
      })
    }

    const r = treRisposte('boh', {
      girata: `la regola dice cosa fa quando ${g.se}: oggi ${g.seNo}, quindi non dice niente — può farlo lo stesso`,
    })
    return domanda({
      testo: frasi(regola, `Oggi ${g.seNo}.`, `${chi} ${g.fatto}?`),
      buona: r.buona, falsi: r.falsi,
      chiave: 'log:non-detta',
      aiuto: `la regola parla solo dei giorni in cui ${g.se}: sugli altri non promette niente`,
      sorte,
    })
  }

  // due regole attaccate: se finiscono nello stesso posto invece di attaccarsi (A sta in C, B sta in C) non si arriva da nessuna parte
  catena(sorte, quale) {
    const [a, b, c] = sorte.alcuni(CREATURE, 3)
    const t = sorte.uno(TRATTI)
    const forma = quale || sorte.uno(['tira', 'nessuno', 'sghemba', 'lunga'])

    if (forma === 'tira') {
      const r = treRisposte('si', {
        perOpposto: `${maiuscola(iPlur(a.p))} ${a.p} sono ${b.p}, e ${b.p} ${t.p}: la catena arriva fino in fondo`,
        perBoh: 'qui si sa: le due regole si attaccano, basta seguirle',
      })
      return domanda({
        testo: frasi(`Tutti ${iPlur(a.p)} ${a.p} sono ${b.p}.`, `Tutti ${iPlur(b.p)} ${b.p} ${t.p}.`, `${maiuscola(iPlur(a.p))} ${a.p} ${t.p}?`),
        buona: r.buona, falsi: r.falsi,
        chiave: 'log:catena',
        aiuto: `${maiuscola(unSing(a.s))} ${a.s} è anche ${unSing(b.s)} ${b.s}, e ${iPlur(b.p)} ${b.p} ${t.p}: quindi sì`,
        sorte,
      })
    }

    if (forma === 'lunga') {
      const r = treRisposte('si', {
        perOpposto: 'le tre regole si attaccano una all\'altra: seguile una alla volta',
        perBoh: 'sono tante ma si attaccano tutte: si arriva fino in fondo',
      })
      return domanda({
        testo: frasi(`Tutti ${iPlur(a.p)} ${a.p} sono ${b.p}.`, `Tutti ${iPlur(b.p)} ${b.p} sono ${c.p}.`, `Tutti ${iPlur(c.p)} ${c.p} ${t.p}.`, `${maiuscola(iPlur(a.p))} ${a.p} ${t.p}?`),
        buona: r.buona, falsi: r.falsi,
        chiave: 'log:catena',
        aiuto: `${a.p} → ${b.p} → ${c.p} → ${t.p}: un anello alla volta si arriva`,
        sorte,
      })
    }

    if (forma === 'nessuno') {
      const r = treRisposte('no', {
        perOpposto: `${maiuscola(iPlur(a.p))} ${a.p} sono ${b.p}, e ${nessunSing(b.s)} ${b.s} ${t.s}`,
        perBoh: 'qui si può sapere: la seconda regola esclude tutti quanti, e i primi ci stanno dentro',
      })
      return domanda({
        testo: frasi(`Tutti ${iPlur(a.p)} ${a.p} sono ${b.p}.`, `${maiuscola(nessunSing(b.s))} ${b.s} ${t.s}.`, `${maiuscola(iPlur(a.p))} ${a.p} ${t.p}?`),
        buona: r.buona, falsi: r.falsi,
        chiave: 'log:nessuno',
        aiuto: `${maiuscola(unSing(a.s))} ${a.s} è anche ${unSing(b.s)} ${b.s}, e ${b.p} non lo fanno: quindi no`,
        sorte,
      })
    }

    const r = treRisposte('boh', {
      girata: `stanno tutti e due dentro ${iPlur(b.p)} ${b.p}, ma questo non li fa uguali fra loro: ${iPlur(b.p)} ${b.p} possono essere di tanti tipi`,
    })
    return domanda({
      testo: frasi(`Tutti ${iPlur(a.p)} ${a.p} sono ${b.p}.`, `Tutti ${iPlur(c.p)} ${c.p} sono ${b.p}.`, `${maiuscola(iPlur(a.p))} ${a.p} sono ${c.p}?`),
      buona: r.buona, falsi: r.falsi,
      chiave: 'log:catena',
      aiuto: `le due regole non si attaccano: portano tutte e due dentro ${iPlur(b.p)} ${b.p}, e lì dentro c'è posto per tutti e due i tipi`,
      sorte,
    })
  }
}

export default new Logica()
