/* ═══════════════════════════════════════════════════════════════════
   CALENDARIO — giorni, mesi, stagioni, e contare il tempo che passa
   sulle date invece che sulle lancette.

   È il gemello di `orologio.js` nella materia `tempo`, e non ripete
   niente di suo: qui non c'è un quadrante e non c'è un'ora, c'è la
   parte che un orologio non sa — l'ordine dei giorni, quanti ne ha un
   mese, in che stagione cade una data, quanti giorni separano due date.

   NIENTE `new Date()`. Una domanda deve essere la stessa a distanza di
   un anno quanto a distanza di un minuto: il punto di partenza (il
   giorno della settimana, la data) lo
   sceglie sempre la `sorte`, e i conti — il giorno dopo, i giorni fra
   due date, la stagione di una data — si fanno con l'aritmetica qui
   dentro, in tabelle fisse (i giorni dei mesi, l'inizio delle
   stagioni). Un modulo che leggesse l'orologio di sistema darebbe
   risposte diverse da un giorno all'altro sulla stessa domanda: il
   contrario di quello che serve a un banco di prova ripetibile.

   I FALSI SONO GLI ERRORI VERI di chi impara a leggere un calendario:
   il giorno prima invece del giorno dopo, il conteggio dei giorni con
   il fuori-di-uno («dal 3 al 17 marzo sono 14 giorni, non 15» — il
   giorno di partenza non si conta due volte), il mese da 30 scambiato
   con uno da 31, la stagione confinante invece di quella giusta.
   ═══════════════════════════════════════════════════════════════════ */

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

/* le quattro stagioni, con dove cominciano (mese 1-12, giorno): l'ordine
   conta, perché la vicinanza (±1) è quella che genera i falsi «stagione
   confinante» */
const STAGIONI = [
  { nome: 'primavera', mese: 3, giorno: 21 },
  { nome: 'estate', mese: 6, giorno: 21 },
  { nome: 'autunno', mese: 9, giorno: 23 },
  { nome: 'inverno', mese: 12, giorno: 21 },
]

/* qualche festa fissa, per legare le stagioni a qualcosa di conosciuto
   invece che a numeri qualunque. Servono solo come àncora — «Natale è
   d'inverno» — mai come domanda a sé: chiedere *che giorno cade* una
   festa è memoria di date, non calendario, e le feste civili (la
   Repubblica, i lavoratori) a un bambino non dicono niente. Per lo stesso
   motivo qui stanno solo feste a data fissa: Pasqua si sposta ogni anno e
   non si ricava con l'aritmetica di questo file. */
const FESTE = [
  { nome: 'Capodanno', mese: 1, giorno: 1 },
  { nome: "l'Epifania", mese: 1, giorno: 6 },
  { nome: 'Ferragosto', mese: 8, giorno: 15 },
  { nome: 'Halloween', mese: 10, giorno: 31 },
  { nome: 'Natale', mese: 12, giorno: 25 },
  { nome: 'Santo Stefano', mese: 12, giorno: 26 },
]

/* ── l'aritmetica del calendario ── */

/* il giorno della settimana `delta` posizioni dopo (o prima, se negativo)
   `idx`, con l'avvolgimento giusto anche sui negativi */
const spostaGiorno = (idx, delta) => ((idx + delta) % 7 + 7) % 7

/* un numero che ordina le date nell'anno (mese*100+giorno): serve solo a
   confrontare «quanto avanti» cade una data rispetto all'inizio di una
   stagione, mai a fare aritmetica vera sui giorni */
const vNum = (mese, giorno) => mese * 100 + giorno

/* una data è «da confine» se cade a ridosso del cambio di stagione:
   lì la risposta non si ragiona, si ricorda — sapere che il 19 marzo è
   ancora inverno vuol dire sapere a memoria che la primavera comincia il
   21. Le domande sulla stagione di una data stanno alla larga da questa
   fascia: quello che devono allenare è «luglio è estate», che un bambino
   ricava da com'è fuori, non il numero esatto sul confine. */
const MARGINE_CONFINE = 4
const daConfine = (mese, giorno) =>
  STAGIONI.some(s => s.mese === mese && Math.abs(giorno - s.giorno) <= MARGINE_CONFINE)

/* i mesi che stanno tutti dentro una stagione sola: gli altri quattro
   (marzo, giugno, settembre, dicembre) sono a cavallo e la domanda «in
   che stagione cade maggio» su di loro non avrebbe una risposta sola */
const MESI_INTERI = MESI.map((_, i) => i).filter(i => !STAGIONI.some(s => s.mese === i + 1))

/* l'articolo giusto davanti al nome di una stagione: solo la primavera
   comincia per consonante, le altre tre vogliono l'apostrofo */
const laStagione = nome => (/^[aeiou]/.test(nome) ? `l'${nome}` : `la ${nome}`)
const dellaStagione = nome => (/^[aeiou]/.test(nome) ? `dell'${nome}` : `della ${nome}`)

/* in che stagione cade una data (indice in STAGIONI). L'inverno è
   l'unica che scavalla l'anno (21 dicembre → 20 marzo), ed è per questo
   che si cerca a ritroso: se una data non ha superato l'inizio di
   nessuna stagione più recente, è ancora dentro quella dell'inverno
   scorso. */
function stagioneDi(mese, giorno) {
  const v = vNum(mese, giorno)
  for (let i = STAGIONI.length - 1; i >= 0; i--)
    if (v >= vNum(STAGIONI[i].mese, STAGIONI[i].giorno)) return i
  return STAGIONI.length - 1 // prima del 21 marzo: ancora inverno
}

/* i falsi per «che giorno della settimana è» — li usano sia il grado 1
   (l'ordine dei giorni) sia il grado 4 (contare i giorni): stesso
   errore, contesti diversi. Sempre 3 falsi distinti dalla giusta e fra
   loro: prima i tre errori tipici, poi — solo se due di quelli
   collidono — si ripesca a caso fra i giorni rimasti. */
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

/* ── che cosa si chiede a ogni grado ── */
const SCALETTA = [
  "l'ordine dei giorni della settimana",
  "i mesi dell'anno",
  'le stagioni e le feste',
  'contare i giorni',
  'le date e le durate',
]

/* Le tipologie. Il taglio è fra quello che si impara **vivendo** — che
   dopo giovedì viene venerdì, che a dicembre è inverno — e quello che è
   un **conto**: quanti giorni passano dal 3 al 17. Il primo gruppo lo sa
   anche chi a scuola non l'ha mai fatto; il secondo o l'hai fatto o
   tiri a indovinare. */
const TIPI = [
  { chiave: 'cal:giorni', nome: 'I giorni della settimana', sa: 'calendario', gradi: { 1: 1 } },
  { chiave: 'cal:mesi', nome: "L'ordine dei mesi", sa: 'calendario', gradi: { 2: 0.66 } },
  { chiave: 'cal:giorni-mese', nome: 'Quanti giorni ha un mese', sa: 'calendario', gradi: { 2: 0.34 } },
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
      /* giorni, mesi e stagioni si imparano vivendo; contare i giorni
         fra due date è un conto che a scuola si fa (o non si è fatto) */
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

  /* ── grado 1: l'ordine dei giorni ── */
  giorni(sorte) {
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

  /* ── grado 2: i mesi ──
     l'ordine e il numero del mese sono la stessa cosa da sapere e
     stanno sotto la stessa chiave; quanti giorni ha un mese è un'altra
     cosa, e per un genitore è un'altra voce. */

  /* quale mese viene prima/dopo un altro */
  mesiOrdine(sorte) {
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

  /* che numero è un mese, o viceversa */
  mesiNumero(sorte) {
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

  /* quanti giorni ha un mese */
  mesiGiorni(sorte) {
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

  /* ── grado 3: le stagioni e le feste ──
     Qui c'era anche «quando comincia la primavera?»: è uscita per lo
     stesso motivo per cui le feste sono solo un'àncora e i bisestili non
     ci sono più. La data esatta di un equinozio non si ricava da niente
     — la si sa o non la si sa — e sbagliarla di un giorno non è un
     ragionamento storto, è un ricordo storto. Quello che resta è tutto
     roba che si ragiona: in che stagione cade un giorno lontano dal
     confine, in che stagione sta un mese intero, che stagione viene dopo
     un'altra, in che stagione cade una festa che il bambino conosce. */

  /* in che stagione cade una data, mai a ridosso del cambio */
  stagioneData(sorte) {
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

  /* in che stagione sta un mese intero */
  stagioneMese(sorte) {
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

  /* che stagione viene dopo (o prima di) un'altra: il giro, non le date */
  stagioneGiro(sorte) {
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

  /* in che stagione cade una festa */
  festaStagione(sorte) {
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

  /* ── grado 4: contare i giorni ── */
  contaGiorni(sorte) {
    return sorte.forse(0.5) ? this.contaStessoMese(sorte) : this.contaFraGiorni(sorte)
  }

  /* oggi è [giorno] [numero]. che giorno della settimana è il [altro numero]? */
  contaStessoMese(sorte) {
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

  /* fra N giorni che giorno sarà */
  contaFraGiorni(sorte) {
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

  /* ── grado 5: le date e le durate ──
     Qui c'era anche febbraio dei bisestili: è uscita perché non è
     calendario, è trivia — la si sa o non la si sa, e nemmeno regalando
     la regola nella domanda diventa un conto che insegna qualcosa. */
  durate(sorte) {
    return sorte.forse(0.5) ? this.durataGiorni(sorte) : this.durataMesi(sorte)
  }

  /* quanti giorni ci sono dal N al M di un mese */
  durataGiorni(sorte) {
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
      /* «quanti giorni passano» e non «quanti giorni ci sono»: la
         seconda si può contare includendo il primo giorno, e allora la
         domanda avrebbe due risposte difendibili invece di una */
      testo: `Quanti giorni passano dal ${d1} al ${d2} ${MESI[meseIdx].nome}?`,
      buona: testo(String(giusto)),
      falsi: sorte.mescola(principali).slice(0, 3),
      chiave: 'cal:durata',
      aiuto: `sottrai: ${d2} − ${d1} = ${giusto} (il giorno di partenza non si conta due volte)`,
      sorte,
    })
  }

  /* quanti mesi mancano da un mese all'altro */
  durataMesi(sorte) {
    const idx1 = sorte.fra(0, 11)
    let idx2 = sorte.fra(0, 11)
    if (idx2 === idx1) idx2 = (idx2 + 1) % 12
    const giusto = ((idx2 - idx1) + 12) % 12
    const erroreDirezione = 12 - giusto

    const usatiNum = new Set([giusto])
    const principali = []
    if (!usatiNum.has(erroreDirezione)) { usatiNum.add(erroreDirezione); principali.push(testo(String(erroreDirezione), 'hai contato dalla parte sbagliata')) }
    for (const off of [1, -1]) {
      const n = giusto + off
      if (n >= 1 && n <= 12 && !usatiNum.has(n)) { usatiNum.add(n); principali.push(testo(String(n))) }
    }
    const pool = Array.from({ length: 12 }, (_, i) => i + 1).filter(n => !usatiNum.has(n))
    for (const n of sorte.distrattori(pool, Math.max(0, 3 - principali.length))) principali.push(testo(String(n)))

    return domanda({
      testo: `Quanti mesi mancano da ${MESI[idx1].nome} a ${MESI[idx2].nome}?`,
      buona: testo(String(giusto)),
      falsi: sorte.mescola(principali).slice(0, 3),
      chiave: 'cal:durata',
      aiuto: "conta i mesi in avanti, uno per uno, dal primo nome all'altro",
      sorte,
    })
  }

}

export default new Calendario()
