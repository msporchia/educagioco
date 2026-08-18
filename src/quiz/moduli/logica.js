/* ═══════════════════════════════════════════════════════════════════
   LOGICA — cosa segue di sicuro da quello che è scritto, e cosa no.

   È il solo modulo che non chiede di sapere niente: non c'è una regola
   di grammatica da ricordare, non c'è una tabellina, non c'è un'unità
   di misura. Ci sono due o tre frasi e una domanda, e la risposta sta
   tutta lì dentro. Per questo `saperi` è vuoto a ogni grado: la logica
   non si è «fatta a scuola», si fa e basta.

   LA TERZA RISPOSTA È IL MODULO. «Tutti i grufoli hanno le ali. Bibo ha
   le ali. Bibo è un grufolo?» — la risposta è **non si può sapere**, e
   quasi tutti i bambini (e non solo) rispondono sì. La regola vale in un
   verso solo: dice cosa fanno tutti i grufoli, non dice che soltanto
   loro lo fanno. Chi impara a fermarsi lì ha imparato la cosa più utile
   che c'è in questo file, e la userà per il resto della vita ogni volta
   che qualcuno gli girerà una frase addosso.

   CREATURE INVENTATE, APPOSTA. Se chiedessimo «tutti i cani abbaiano,
   questo animale abbaia, è un cane?» il bambino risponderebbe con quello
   che sa dei cani invece che con quello che c'è scritto — e avrebbe
   anche ragione a farlo. Con i grufoli e gli snizzi non si può sapere
   niente per esperienza: l'unica strada è leggere le premesse. Per lo
   stesso motivo, nel grado del «se… allora» le regole sono cose di casa
   ma i fatti sono sempre di uno solo (l'ombrello che *questo* bambino
   prende), mai leggi del mondo che si potrebbero girare da sé.

   I QUATTRO PASSI, e sono le chiavi. Due si possono fare e due no, e
   sono gli stessi in tutti i gradi — cambia il vestito, non il passo:

     log:diretta   la regola vale, il caso ci sta dentro → sì
     log:negata    l'effetto non c'è, quindi la causa nemmeno → no
     log:girata    la regola girata al contrario → non si può sapere
     log:non-detta la causa non c'è: la regola non dice niente → non si sa

   più `log:nessuno` (l'esclusione), `log:ordine` (i confronti in fila) e
   `log:catena` (due regole attaccate). Sono concetti, non domande: il
   giorno che le chiavi finiranno in `store/srs.js`, «sbaglia sempre a
   girare le regole» sarà una cosa che si può leggere.
   ═══════════════════════════════════════════════════════════════════ */

import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo } from '../nucleo/domanda.js'

/* ── le tre risposte ──
   Sempre scritte così, in tutti i gradi che le usano: quello che cambia
   da una domanda all'altra è quale delle tre è buona, mai come si legge.
   Un bambino deve poter smettere di leggere i tasti e pensare solo alle
   frasi. */
const SI = 'sì, di sicuro'
const NO = 'no, di sicuro'
const BOH = 'non si può sapere'

/* ── il bestiario inventato ──
   Nomi che non vogliono dire niente di proposito (vedi l'intestazione):
   l'articolo non si scrive a mano perché «uno snizzo» e «un grufolo» si
   sbagliano da soli dopo la terza voce. */
const CREATURE = [
  ['grufoli', 'grufolo'], ['snizzi', 'snizzo'], ['tarlocchi', 'tarlocco'],
  ['brindoli', 'brindolo'], ['mufali', 'mufalo'], ['zampiri', 'zampiro'],
  ['ciuffardi', 'ciuffardo'], ['gnappi', 'gnappo'], ['ronfoli', 'ronfolo'],
  ['sbrisi', 'sbriso'], ['pilucchi', 'pilucco'], ['tromboli', 'trombolo'],
  ['murgoli', 'murgolo'], ['fanfi', 'fanfo'], ['dranfi', 'dranfo'],
  ['quarnoli', 'quarnolo'], ['scrimoli', 'scrimolo'], ['bufigli', 'bufiglio'],
].map(([p, s]) => ({ p, s }))

/* le parole che vogliono «gli», «uno», «nessuno»: vocale, s+consonante,
   z, gn, ps, x. È la stessa regola per tutti e tre gli articoli, quindi
   sta scritta una volta sola */
const vuoleLo = n => /^(?:[aeiou]|z|gn|ps|x|s[bcdfgklmnpqrtvz])/.test(n)
const iPlur = n => (vuoleLo(n) ? 'gli' : 'i')
const unSing = n => (vuoleLo(n) ? 'uno' : 'un')
const nessunSing = n => (vuoleLo(n) ? 'nessuno' : 'nessun')

/* ── quello che una creatura può fare o essere ──
   Al plurale per le regole («tutti i grufoli hanno le ali»), al
   singolare per i casi («Bibo ha le ali»). Sono proprietà arbitrarie
   apposta: nessuna si può indovinare sapendo com'è fatto il mondo. */
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

/* nomi buffi per i singoli: corti, e nessuno dice il genere — «Nina è un
   grufolo» dovrebbe restare una frase su un grufolo, non su una bambina */
const BESTIE = ['Bibo', 'Momo', 'Kiki', 'Zaza', 'Pippo', 'Milo', 'Teo', 'Gigi',
  'Nino', 'Ciro', 'Lillo', 'Tobi', 'Ubo', 'Fufi', 'Nanà', 'Bombo']

/* ── i bambini dei confronti in fila ──
   Col genere, perché «più alta» e «più alto» si devono concordare: una
   frase sgrammaticata in mezzo a un ragionamento è un inciampo gratis */
const BAMBINI = [
  ['Ada', 'f'], ['Marco', 'm'], ['Sara', 'f'], ['Luca', 'm'], ['Nina', 'f'],
  ['Teo', 'm'], ['Gaia', 'f'], ['Bruno', 'm'], ['Lia', 'f'], ['Enea', 'm'],
  ['Vera', 'f'], ['Elia', 'm'], ['Mia', 'f'], ['Dario', 'm'],
].map(([nome, g]) => ({ nome, g }))

/* i confronti: `piu`/`meno` sono i due capi della stessa fila, e il
   modulo ne chiede sempre uno dei due, mai «chi è medio» detto così */
const CONFRONTI = [
  { piu: { m: 'più alto', f: 'più alta' }, meno: { m: 'più basso', f: 'più bassa' }, cima: 'il più alto', fondo: 'il più basso' },
  { piu: { m: 'più veloce', f: 'più veloce' }, meno: { m: 'più lento', f: 'più lenta' }, cima: 'il più veloce', fondo: 'il più lento' },
  { piu: { m: 'più grande', f: 'più grande' }, meno: { m: 'più piccolo', f: 'più piccola' }, cima: 'il più grande', fondo: 'il più piccolo' },
  { piu: { m: 'più forte', f: 'più forte' }, meno: { m: 'meno forte', f: 'meno forte' }, cima: 'il più forte', fondo: 'il meno forte' },
]

/* ── le regole del «se… allora» ──
   `se` è una cosa che capita (il tempo, il giorno, la scuola), `fa` è
   quello che *questo* bambino fa quando capita. La negazione della
   causa è scritta a mano perché «non il gatto ha fame» non si ricava
   con un `non ` davanti; i participi sono tutti con «avere», così il
   nome di chi agisce non trascina nessuna concordanza. */
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

/* ── le tre risposte, con il perché di quelle sbagliate ──
   Il `perche` è quello che il bambino legge quando sbaglia, ed è l'unico
   posto dove il modulo insegna qualcosa: «era questa» da solo non ha mai
   fatto capire niente a nessuno. Cambia con la risposta giusta, perché
   sbagliare «sì» quando era «non si sa» è un errore diverso da
   sbagliare «sì» quando era «no».

   `perOpposto` è quello che si legge scegliendo il secco sbagliato (il
   «no» quando era sì, il «sì» quando era no); `perBoh` quello che si
   legge fermandosi troppo presto, quando invece si poteva concludere.
   Quando la buona è «non si può sapere» ne serve uno solo che valga per
   tutte e due le fughe in avanti: `girata`. */
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

/* le premesse vanno UNA PER RIGA. Scritte di seguito diventano un
   paragrafo, e a otto anni un paragrafo si legge di corsa: separate, si
   vedono per quello che sono — due o tre cose date per vere, e in fondo
   la domanda. La scheda le rispetta perché la consegna è `pre-line`. */
const frasi = (...righe) => righe.join('\n')

const SCALETTA = [
  'tutti e nessuno',
  'chi è più alto di chi',
  'la regola girata: quando non si può sapere',
  'se… allora',
  'le catene di regole',
]

/* Le tipologie sono le FORME LOGICHE, non i gradi: la stessa forma
   torna a gradi diversi vestita da un'altra storia — la deduzione
   diretta si incontra col «tutti» al grado 1, con la regola al 3 e col
   «se… allora» al 4 — e la chiave dice sempre che cosa si è ragionato.
   È il motivo per cui questo modulo ne aveva bisogno più degli altri:
   qui la chiave non seguiva il grado, la sceglieva un ramo dentro il
   generatore, e da fuori non si poteva né chiedere né evitare.

   I gruppi non sono pezzi di scuola (vedi `data/saperi.js`): servono a
   guardare una forma per volta. Quella che vale di più è
   `incertezza` — «non si può sapere» è la risposta che quasi tutti
   sbagliano, e volerla vedere da sola è una richiesta legittima. */
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
      /* QUANTO È COMPLICATO OGNI GRADO, da 0 a 100 — la scala è una
         sola per tutte le materie, e serve a confrontare questa riga
         con quelle di tutti gli altri moduli. Zero è il primo giorno
         di materna, cento la fine della primaria: dodici punti e mezzo
         per anno di scuola. Non dice a chi arriva — quello lo decide
         la finestra dell'età di chi gioca (`nucleo/classi.js`). */
      livelli: [25, 29, 56, 63, 75],
      /* i gruppi qui non sono pezzi di programma scolastico — non c'è
         una lezione da aver fatto per rispondere — ma tipi di
         ragionamento che si possono isolare */
      tipi: TIPI,
    })
  }

  /* La stessa forma logica cambia vestito col grado: la deduzione
     diretta è «tutti i grufoli» al grado 1, la regola al 3, il «se…
     allora» al 4. Chi chiede sceglie la forma, il grado sceglie la
     storia in cui incontrarla. */
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

  /* ── grado 1: tutti e nessuno ──
     Solo i due passi che si possono fare, e solo due risposte: qui il
     «non si può sapere» non è mai giusto, e tenerlo in mezzo agli altri
     insegnerebbe soltanto a scartarlo. Arriva al grado 3, dove è vero. */
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

  /* ── grado 2: i confronti in fila ──
     Le premesse escono mescolate apposta: se arrivassero sempre in
     ordine («A più di B, B più di C») la fila si leggerebbe senza
     ragionare, e la domanda diventerebbe una copiatura. */
  inFila(sorte) {
    const quanti = sorte.forse(0.35) ? 4 : 3
    const gente = sorte.alcuni(BAMBINI, quanti)   // gente[0] è il primo della fila
    const c = sorte.uno(CONFRONTI)

    /* le coppie vicine: sono quelle che si dicono, il resto si deduce */
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

  /* ── grado 3: la regola girata ──
     Le tre forme escono mescolate e si somigliano parola per parola: è
     apposta. Se la forma «girata» avesse un aspetto suo, si
     riconoscerebbe la domanda invece di leggerla. */
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

  /* ── grado 4: se… allora ──
     Le quattro combinazioni della stessa regola: due si concludono e due
     no, e sono le stesse due che si sbagliano da grandi leggendo un
     contratto. La regola si scrive «ogni volta che», non «se… allora»,
     perché «se» in italiano parlato si sente spesso come «solo se» — e
     allora la domanda avrebbe due risposte difendibili. */
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

  /* ── grado 5: le catene ──
     Due regole attaccate. Quando l'anello combacia si arriva in fondo;
     quando le due regole finiscono nello stesso posto invece di
     attaccarsi (A sta in C, B sta in C) non si arriva da nessuna parte,
     ed è lo stesso errore del grado 3 con un vestito più difficile. */
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
