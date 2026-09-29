// gemello di orologio.js nella materia `tempo`: giorni, mesi, stagioni, contare le date. Niente new Date(): il punto di partenza lo sceglie sempre `sorte`, i conti sono aritmetica su tabelle fisse — un modulo legato all'orologio di sistema darebbe risposte diverse da un giorno all'altro sulla stessa domanda. I falsi sono gli errori veri: il giorno prima invece del dopo, il fuori-di-uno nel contare, il mese da 30 scambiato con uno da 31, la stagione confinante.
import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo } from '../nucleo/domanda.js'

/* ── le tabelle fisse ── */

const GIORNI = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica']

const MESI = [
  { nome: 'gennaio', giorni: 31 },
  { nome: 'febbraio', giorni: 28 },
  { nome: 'marzo', giorni: 31 },
  { nome: 'aprile', giorni: 30 },
  { nome: 'maggio', giorni: 31 },
  { nome: 'giugno', giorni: 30 },
  { nome: 'luglio', giorni: 31 },
  { nome: 'agosto', giorni: 31 },
  { nome: 'settembre', giorni: 30 },
  { nome: 'ottobre', giorni: 31 },
  { nome: 'novembre', giorni: 30 },
  { nome: 'dicembre', giorni: 31 },
]

// d eufonica solo davanti alla stessa vocale (aprile, agosto): senza, «a aprile» fa inciampare la frase
const aMese = nome => (nome.startsWith('a') ? 'ad ' : 'a ') + nome

// l'ordine conta: la vicinanza (±1) genera i falsi «stagione confinante»
const STAGIONI = [
  { nome: 'primavera', mese: 3, giorno: 21 },
  { nome: 'estate', mese: 6, giorno: 21 },
  { nome: 'autunno', mese: 9, giorno: 23 },
  { nome: 'inverno', mese: 12, giorno: 21 },
]

// solo àncora («Natale è d'inverno»), mai domanda a sé (che giorno cade è memoria, non calendario); solo feste a data fissa, Pasqua si sposta ogni anno
const FESTE = [
  { nome: 'Capodanno', mese: 1, giorno: 1 },
  { nome: "l'Epifania", mese: 1, giorno: 6 },
  { nome: 'Ferragosto', mese: 8, giorno: 15 },
  { nome: 'Halloween', mese: 10, giorno: 31 },
  { nome: 'Natale', mese: 12, giorno: 25 },
  { nome: 'Santo Stefano', mese: 12, giorno: 26 },
]

/* ── l'aritmetica del calendario ── */

// il giorno `delta` posizioni dopo (o prima) `idx`, con l'avvolgimento giusto anche sui negativi
const spostaGiorno = (idx, delta) => ((idx + delta) % 7 + 7) % 7

// ordina le date nell'anno (mese*100+giorno): solo per confrontare, mai per aritmetica vera sui giorni
const vNum = (mese, giorno) => mese * 100 + giorno

// a ridosso del cambio stagione la risposta non si ragiona, si ricorda (sapere che il 19 marzo è ancora inverno vuole a memoria che comincia il 21): le domande stanno alla larga da questa fascia
const MARGINE_CONFINE = 4
const daConfine = (mese, giorno) =>
  STAGIONI.some(s => s.mese === mese && Math.abs(giorno - s.giorno) <= MARGINE_CONFINE)

// mesi tutti dentro una stagione sola: gli altri quattro (marzo, giugno, settembre, dicembre) sono a cavallo, niente risposta unica
const MESI_INTERI = MESI.map((_, i) => i).filter(i => !STAGIONI.some(s => s.mese === i + 1))

// solo la primavera comincia per consonante, le altre tre vogliono l'apostrofo
const laStagione = nome => (/^[aeiou]/.test(nome) ? `l'${nome}` : `la ${nome}`)
const dellaStagione = nome => (/^[aeiou]/.test(nome) ? `dell'${nome}` : `della ${nome}`)

// l'inverno scavalla l'anno (21 dic → 20 mar): si cerca a ritroso, se non supera nessuna stagione più recente è ancora l'inverno scorso
function stagioneDi(mese, giorno) {
  const v = vNum(mese, giorno)
  for (let i = STAGIONI.length - 1; i >= 0; i--)
    if (v >= vNum(STAGIONI[i].mese, STAGIONI[i].giorno)) return i
  return STAGIONI.length - 1 // prima del 21 marzo: ancora inverno
}

// li usano sia grado 1 (l'ordine) che grado 4 (contare): prima i tre errori tipici, poi si ripesca a caso se collidono
function propostiErroriGiorno(partenza, delta, sorte) {
  const giusto = spostaGiorno(partenza, delta)
  const verso = delta >= 0 ? 1 : -1
  const candidati = [
    [spostaGiorno(partenza, -delta), 'hai contato dalla parte sbagliata'],
    [spostaGiorno(partenza, delta + verso), 'un giorno di troppo'],
    [spostaGiorno(partenza, delta - verso), 'un giorno di meno'],
  ]
  const usati = new Set([giusto])
  const principali = []
  for (const [idx, perche] of candidati) {
    if (usati.has(idx)) continue
    usati.add(idx)
    principali.push(testo(GIORNI[idx], perche))
  }
  const rimasti = GIORNI.map((_, i) => i).filter(i => !usati.has(i))
  while (principali.length < 3 && rimasti.length) {
    const i = sorte.uno(rimasti)
    rimasti.splice(rimasti.indexOf(i), 1)
    principali.push(testo(GIORNI[i]))
  }
  return { giusto, falsi: sorte.mescola(principali).slice(0, 3) }
}

const SCALETTA = [
  "l'ordine dei giorni della settimana",
  "i mesi dell'anno",
  'le stagioni e le feste',
  'contare i giorni',
  'le date e le durate',
]

// taglio fra quello che si impara vivendo (dopo giovedì viene venerdì) e un conto vero (quanti giorni dal 3 al 17): il secondo o l'hai fatto o tiri a indovinare
const TIPI = [
  { chiave: 'cal:giorni', nome: 'I giorni della settimana', sa: 'calendario', gradi: { 1: 1 } },
  { chiave: 'cal:mesi', nome: "L'ordine dei mesi", sa: 'calendario', gradi: { 2: 0.66 } },
  { chiave: 'cal:giorni-mese', livello: 38, nome: 'Quanti giorni ha un mese', sa: 'calendario', gradi: { 2: 0.34 } },
  { chiave: 'cal:stagioni', nome: 'Le stagioni', sa: 'calendario', gradi: { 3: 0.74 } },
  { chiave: 'cal:feste', nome: "Le feste dell'anno", sa: 'calendario', gradi: { 3: 0.26 } },
  { chiave: 'cal:conta-giorni', nome: 'Contare i giorni fra due date', sa: 'date', gradi: { 4: 1 } },
  { chiave: 'cal:durata', nome: 'Quanto dura una cosa', sa: 'date', gradi: { 5: 1 } },
]

class Calendario extends Modulo {
  constructor() {
    super({
      id: 'calendario',
      nome: 'Calendario',
      icona: '📅',
      materia: 'tempo',
      chiaro: "i giorni, i mesi, le stagioni, e quanto tempo passa fra due date",
      scaletta: SCALETTA,
      livelli: [20, 25, 29, 56, 63], // scala 0-100 comune a tutte le materie (vedi docs/apprendimento/quiz-livelli.md)
      tipi: TIPI,
    })
  }

  genera(grado, sorte, tipo) {
    switch (tipo) {
      case 'cal:mesi': return sorte.forse(0.5) ? this.mesiOrdine(sorte) : this.mesiNumero(sorte)
      case 'cal:giorni-mese': return this.mesiGiorni(sorte)
      case 'cal:stagioni': {
        const quale = sorte.uno(['data', 'mese', 'giro'])
        return quale === 'data' ? this.stagioneData(sorte)
          : quale === 'mese' ? this.stagioneMese(sorte) : this.stagioneGiro(sorte)
      }
      case 'cal:feste': return this.festaStagione(sorte)
      case 'cal:conta-giorni': return this.contaGiorni(sorte)
      case 'cal:durata': return this.durate(sorte)
      default: return this.giorni(sorte)
    }
  }

  giorni(sorte) { // grado 1: l'ordine dei giorni
    const partenza = sorte.fra(0, 6)
    const verso = sorte.forse(0.5) ? 1 : -1
    const passi = sorte.fra(1, 6)
    const delta = verso * passi
    const { giusto, falsi } = propostiErroriGiorno(partenza, delta, sorte)

    const testoDomanda = passi === 1
      ? (verso > 0 ? `Che giorno viene dopo ${GIORNI[partenza]}?` : `Che giorno viene prima di ${GIORNI[partenza]}?`)
      : (verso > 0 ? `Che giorno viene ${passi} giorni dopo ${GIORNI[partenza]}?` : `Che giorno viene ${passi} giorni prima di ${GIORNI[partenza]}?`)

    return domanda({
      testo: testoDomanda,
      buona: testo(GIORNI[giusto]),
      falsi,
      chiave: 'cal:giorni',
      aiuto: 'i giorni vanno sempre in questo ordine: ' + GIORNI.join(', '),
      sorte,
    })
  }

  // grado 2: ordine e numero del mese sono la stessa chiave; quanti giorni ha un mese è un'altra voce
  mesiOrdine(sorte) { // quale mese viene prima/dopo un altro
    const idx = sorte.fra(0, 11)
    const verso = sorte.forse(0.5) ? 1 : -1
    const giusto = (idx + verso + 12) % 12
    const opposto = (idx - verso + 12) % 12 // ha guardato dalla parte sbagliata

    const usati = new Set([giusto, idx])
    const principali = []
    if (!usati.has(opposto)) { usati.add(opposto); principali.push(testo(MESI[opposto].nome, 'hai guardato dalla parte sbagliata')) }
    const altri = MESI.map((_, i) => i).filter(i => !usati.has(i))
    for (const i of sorte.distrattori(altri, 3 - principali.length)) { usati.add(i); principali.push(testo(MESI[i].nome)) }

    return domanda({
      testo: verso > 0 ? `Quale mese viene dopo ${MESI[idx].nome}?` : `Quale mese viene prima di ${MESI[idx].nome}?`,
      buona: testo(MESI[giusto].nome),
      falsi: sorte.mescola(principali).slice(0, 3),
      chiave: 'cal:mesi',
      aiuto: 'i mesi in ordine: ' + MESI.map(m => m.nome).join(', '),
      sorte,
    })
  }

  mesiNumero(sorte) { // che numero è un mese, o viceversa
    const idx = sorte.fra(0, 11)
    const numero = idx + 1
    const chiedeNumero = sorte.forse(0.5)

    const usati = new Set([numero])
    const principali = []
    for (const off of [1, -1]) {
      const n = numero + off
      if (n >= 1 && n <= 12 && !usati.has(n)) { usati.add(n); principali.push(testo(String(n), 'conta i mesi da gennaio: è il primo')) }
    }
    const restanti = Array.from({ length: 12 }, (_, i) => i + 1).filter(n => !usati.has(n))
    for (const n of sorte.distrattori(restanti, 3 - principali.length)) { usati.add(n); principali.push(testo(String(n))) }
    const falsiNumero = sorte.mescola(principali).slice(0, 3)

    if (chiedeNumero) {
      return domanda({
        testo: `Che numero è ${MESI[idx].nome} nell'anno?`,
        buona: testo(String(numero)),
        falsi: falsiNumero,
        chiave: 'cal:mesi',
        aiuto: 'gennaio è il primo, dicembre è il dodicesimo: conta sulle dita',
        sorte,
      })
    }
    return domanda({
      testo: `Qual è il ${numero}° mese dell'anno?`,
      buona: testo(MESI[idx].nome),
      falsi: falsiNumero.map(f => testo(MESI[Number(f.testo) - 1].nome)),
      chiave: 'cal:mesi',
      aiuto: 'gennaio è il primo, dicembre è il dodicesimo: conta sulle dita',
      sorte,
    })
  }

  mesiGiorni(sorte) { // quanti giorni ha un mese
    const idx = sorte.fra(0, 11)
    const mese = MESI[idx]
    const scambio = mese.giorni === 31 ? 30 : mese.giorni === 30 ? 31 : mese.giorni === 28 ? 29 : 28

    const usati = new Set([mese.giorni, scambio])
    const principali = [testo(String(scambio), 'trenta e trentuno si scambiano facilmente: guarda bene questo mese')]
    for (const n of [28, 29, 30, 31].filter(n => !usati.has(n))) principali.push(testo(String(n)))

    return domanda({
      testo: `Quanti giorni ha ${mese.nome}?`,
      buona: testo(String(mese.giorni)),
      falsi: sorte.mescola(principali).slice(0, 3),
      chiave: 'cal:giorni-mese',
      aiuto: "trenta giorni ha novembre, con aprile, giugno e settembre; di ventotto ce n'è uno solo, tutti gli altri ne hanno trentuno",
      sorte,
    })
  }

  // grado 3: «quando comincia la primavera?» è uscita — un equinozio si ricorda o non si ricorda, non si ragiona
  stagioneData(sorte) { // in che stagione cade una data, mai a ridosso del cambio
    let meseIdx = sorte.fra(0, 11)
    let giorno = sorte.fra(1, MESI[meseIdx].giorni)
    for (let tentativi = 0; tentativi < 20 && daConfine(meseIdx + 1, giorno); tentativi++) {
      meseIdx = sorte.fra(0, 11)
      giorno = sorte.fra(1, MESI[meseIdx].giorni)
    }
    const s = stagioneDi(meseIdx + 1, giorno)
    const falsi = [
      testo(STAGIONI[(s + 1) % 4].nome, 'è la stagione vicina, ma non ci siamo ancora'),
      testo(STAGIONI[(s + 3) % 4].nome, 'è la stagione vicina, ma non ci siamo ancora'),
      testo(STAGIONI[(s + 2) % 4].nome),
    ]
    return domanda({
      testo: `In che stagione cade il ${giorno} ${MESI[meseIdx].nome}?`,
      buona: testo(STAGIONI[s].nome),
      falsi: sorte.mescola(falsi).slice(0, 3),
      chiave: 'cal:stagioni',
      aiuto: 'primavera dal 21 marzo, estate dal 21 giugno, autunno dal 23 settembre, inverno dal 21 dicembre',
      sorte,
    })
  }

  stagioneMese(sorte) { // in che stagione sta un mese intero
    const meseIdx = sorte.uno(MESI_INTERI)
    const s = stagioneDi(meseIdx + 1, 15)
    const falsi = [
      testo(STAGIONI[(s + 1) % 4].nome, 'è la stagione dopo: questo mese non ci arriva'),
      testo(STAGIONI[(s + 3) % 4].nome, 'è la stagione prima: questo mese è già oltre'),
      testo(STAGIONI[(s + 2) % 4].nome, "è la stagione opposta, dall'altra parte dell'anno"),
    ]
    return domanda({
      testo: `In che stagione cade il mese di ${MESI[meseIdx].nome}?`,
      buona: testo(STAGIONI[s].nome),
      falsi: sorte.mescola(falsi).slice(0, 3),
      chiave: 'cal:stagioni',
      aiuto: 'le stagioni vanno in questo giro: primavera, estate, autunno, inverno — e ognuna tiene tre mesi',
      sorte,
    })
  }

  stagioneGiro(sorte) { // che stagione viene dopo/prima di un'altra: il giro, non le date
    const s = sorte.fra(0, 3)
    const verso = sorte.forse(0.5) ? 1 : -1
    const giusto = (s + verso + 4) % 4
    const opposto = (s - verso + 4) % 4
    const falsi = [
      testo(STAGIONI[opposto].nome, 'hai girato dalla parte sbagliata'),
      testo(STAGIONI[(s + 2) % 4].nome, "è quella opposta, dall'altra parte dell'anno"),
      testo(STAGIONI[s].nome, 'quella è la stagione da cui parti'),
    ]
    return domanda({
      testo: verso > 0
        ? `Quale stagione viene dopo ${laStagione(STAGIONI[s].nome)}?`
        : `Quale stagione viene prima ${dellaStagione(STAGIONI[s].nome)}?`,
      buona: testo(STAGIONI[giusto].nome),
      falsi: sorte.mescola(falsi).slice(0, 3),
      chiave: 'cal:stagioni',
      aiuto: "il giro è sempre lo stesso e non finisce mai: primavera, estate, autunno, inverno, e poi di nuovo primavera",
      sorte,
    })
  }

  festaStagione(sorte) { // in che stagione cade una festa
    const f = sorte.uno(FESTE)
    const s = stagioneDi(f.mese, f.giorno)
    const falsi = [testo(STAGIONI[(s + 1) % 4].nome), testo(STAGIONI[(s + 2) % 4].nome), testo(STAGIONI[(s + 3) % 4].nome)]
    return domanda({
      testo: `In che stagione cade ${f.nome}?`,
      buona: testo(STAGIONI[s].nome),
      falsi: sorte.mescola(falsi).slice(0, 3),
      chiave: 'cal:feste',
      aiuto: `${f.nome} è il ${f.giorno} ${MESI[f.mese - 1].nome}`,
      sorte,
    })
  }

  contaGiorni(sorte) { // grado 4: contare i giorni
    return sorte.forse(0.5) ? this.contaStessoMese(sorte) : this.contaFraGiorni(sorte)
  }

  contaStessoMese(sorte) { // oggi è [giorno] [numero]. che giorno della settimana è il [altro numero]?
    const partenza = sorte.fra(0, 6)
    const numero1 = sorte.fra(1, 27)
    let numero2 = sorte.fra(1, 28)
    if (numero2 === numero1) numero2 = numero2 === 28 ? numero2 - 1 : numero2 + 1
    const delta = numero2 - numero1
    const { giusto, falsi } = propostiErroriGiorno(partenza, delta, sorte)

    return domanda({
      testo: `Oggi è ${GIORNI[partenza]} ${numero1}. Che giorno della settimana è il ${numero2}?`,
      buona: testo(GIORNI[giusto]),
      falsi,
      chiave: 'cal:conta-giorni',
      aiuto: 'conta quanti giorni separano le due date, poi avanza (o indietreggia) di tanti giorni della settimana: se sono un multiplo di 7 il giorno resta lo stesso',
      sorte,
    })
  }

  contaFraGiorni(sorte) { // fra N giorni che giorno sarà
    const partenza = sorte.fra(0, 6)
    const n = sorte.fra(2, 20)
    const { giusto, falsi } = propostiErroriGiorno(partenza, n, sorte)

    return domanda({
      testo: `Oggi è ${GIORNI[partenza]}. Fra ${n} giorni che giorno sarà?`,
      buona: testo(GIORNI[giusto]),
      falsi,
      chiave: 'cal:conta-giorni',
      aiuto: 'ogni 7 giorni si torna allo stesso giorno della settimana: dividi per 7 e guarda quanto avanza',
      sorte,
    })
  }

  // grado 5: febbraio dei bisestili è uscita — è trivia, si sa o non si sa, nemmeno la regola la rende un conto
  durate(sorte) {
    return sorte.forse(0.5) ? this.durataGiorni(sorte) : this.durataMesi(sorte)
  }

  durataGiorni(sorte) { // quanti giorni ci sono dal N al M di un mese
    const meseIdx = sorte.fra(0, 11)
    const giorniMese = MESI[meseIdx].giorni
    const d1 = sorte.fra(1, Math.max(1, giorniMese - 3))
    const d2 = sorte.fra(d1 + 2, giorniMese)
    const giusto = d2 - d1

    const principali = [
      testo(String(giusto + 1), `dal ${d1} al ${d2}: il giorno di partenza non si conta due volte`),
      testo(String(giusto - 1), 'hai contato un giorno di meno'),
    ]
    const pool = [giusto + 2, giusto + 3].concat(giusto - 2 > 0 ? [giusto - 2] : [])
    for (const n of sorte.distrattori(pool, Math.max(0, 3 - principali.length))) principali.push(testo(String(n)))

    return domanda({
      // «passano» e non «ci sono»: la seconda si potrebbe contare includendo il primo giorno, due risposte difendibili
      testo: `Quanti giorni passano dal ${d1} al ${d2} ${MESI[meseIdx].nome}?`,
      buona: testo(String(giusto)),
      falsi: sorte.mescola(principali).slice(0, 3),
      chiave: 'cal:durata',
      aiuto: `sottrai: ${d2} − ${d1} = ${giusto} (il giorno di partenza non si conta due volte)`,
      sorte,
    })
  }

  // era «Quanti mesi mancano da marzo a gennaio?»: due risposte difendibili (10 andando avanti col giro dell'anno sottinteso, 2 andando indietro).
  // «Siamo a marzo. Quanti mesi mancano a gennaio?» mette il presente: da un presente si manca solo in avanti, il giro dell'anno non è più un sottinteso.
  durataMesi(sorte) {
    const idx1 = sorte.fra(0, 11)
    let idx2 = sorte.fra(0, 11)
    if (idx2 === idx1) idx2 = (idx2 + 1) % 12
    const giusto = ((idx2 - idx1) + 12) % 12
    const erroreDirezione = 12 - giusto

    const usatiNum = new Set([giusto])
    const principali = []
    // dichiarato il presente, all'indietro non si manca: è un errore vero, non una lettura possibile
    if (!usatiNum.has(erroreDirezione)) { usatiNum.add(erroreDirezione); principali.push(testo(String(erroreDirezione), 'hai contato all\'indietro: «manca» vuol dire in avanti')) }
    for (const off of [1, -1]) {
      const n = giusto + off
      if (n >= 1 && n <= 12 && !usatiNum.has(n)) { usatiNum.add(n); principali.push(testo(String(n))) }
    }
    const pool = Array.from({ length: 12 }, (_, i) => i + 1).filter(n => !usatiNum.has(n))
    for (const n of sorte.distrattori(pool, Math.max(0, 3 - principali.length))) principali.push(testo(String(n)))

    return domanda({
      testo: `Siamo ${aMese(MESI[idx1].nome)}. Quanti mesi mancano ${aMese(MESI[idx2].nome)}?`,
      buona: testo(String(giusto)),
      falsi: sorte.mescola(principali).slice(0, 3),
      chiave: 'cal:durata',
      // corto si conta, lungo si dice come si conta: undici nomi in fila sarebbero la risposta scritta male
      aiuto: giusto <= 4
        ? 'conta in avanti: ' +
          Array.from({ length: giusto }, (_, i) => MESI[(idx1 + i + 1) % 12].nome).join(', ') +
          ` → ${giusto}`
        : `conta i mesi in avanti da ${MESI[idx1].nome}, uno per uno` +
          (idx2 < idx1 ? ' — e dopo dicembre si ricomincia da gennaio' : ''),
      sorte,
    })
  }

}

export default new Calendario()
