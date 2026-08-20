/* ═══════════════════════════════════════════════════════════════════
   LE QUATTRO PARTENZE — il catalogo e quello che spegne davvero

   Una partenza è un pugno di eccezioni scritte una volta sola quando si
   aggiunge un bambino. Sono dato puro, quindi si controllano senza
   browser, e quello che si controlla è la parte che a occhio non si
   vede: se una chiave è sbagliata **non succede niente di visibile** —
   il gioco resta acceso, il sapere resta acceso, e il genitore che
   aveva scelto «non va ancora a scuola» scopre il refuso il giorno che
   il figlio si trova davanti le divisioni in colonna.
   ═══════════════════════════════════════════════════════════════════ */
import { PARTENZE, eccezioniDi, partenza, spostandoLEta, rimettendoLEta,
         eccezioniPerEta } from '../../src/data/partenze.js'
import { GIOCHI, CHIAVI_GIOCHI } from '../../src/data/giochi.js'
import { SAPERI } from '../../src/data/saperi.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const CHIAVI_SAPERI = SAPERI.map(s => s.chiave)
const PICCOLI = GIOCHI.filter(g => g.piccoli).map(g => g.chiave)
const GRANDI = GIOCHI.filter(g => g.grandi).map(g => g.chiave)

/* ── quello che citano esiste ──
   È il controllo che giustifica il file: una chiave morta non dà errore
   da nessuna parte, spegne solo il silenzio. */
for (const p of PARTENZE) {
  const ignoti = p.saperi.filter(s => !CHIAVI_SAPERI.includes(s))
  uguale(`${p.chiave}: cita solo saperi che esistono`, ignoti.join(',') || '—', '—')
  controlla(`${p.chiave}: ha un nome e una riga che spiega`, !!p.nome && !!p.che)
  /* `come` è il nome che sta **dentro una frase** («come in prima o
     seconda»). Senza, la manopola ci infilava `nome` e usciva «come in
     non va ancora a scuola»: una frase compiuta annidata in un'altra. */
  controlla(`${p.chiave}: sa dirsi dentro una frase`,
    !!p.come && p.come[0] === p.come[0].toLowerCase(), p.come)
}

controlla('ci sono almeno due giochi per i piccoli da accendere',
  PICCOLI.length >= 2, PICCOLI.join(','))
/* Le due estremità sono estremità: un gioco dichiarato tutti e due
   sarebbe per chi non legge *e* per chi legge da solo, e a seconda della
   partenza scelta sparirebbe o resterebbe senza che nessuno sappia dire
   quale delle due dichiarazioni ha vinto. */
uguale('nessun gioco è insieme per i piccoli e per i grandi',
  PICCOLI.filter(k => GRANDI.includes(k)).join(',') || '—', '—')
/* In mezzo ci deve restare qualcuno, se no «prima o seconda» è la copia
   di «non va ancora a scuola» con un nome diverso. */
controlla('e qualcuno sta in mezzo, senza dichiarare né l\'uno né l\'altro',
  CHIAVI_GIOCHI.some(k => !PICCOLI.includes(k) && !GRANDI.includes(k)))

/* ── la partenza dei piccoli ── */
const POSTI = GIOCHI.filter(g => g.posto).map(g => g.chiave)
const piccoli = eccezioniDi('piccoli')
const accesiPiccoli = CHIAVI_GIOCHI.filter(k => piccoli.giochi[k] !== false)
/* I posti restano accesi insieme ai giochi per i piccoli, e non sono un
   caso a parte per pigrizia: un posto non sta sulla scala della
   difficoltà (la fattoria è il prato dove si spende, non una fila da
   macinare), quindi non lo si giudica per età in nessuna delle due
   direzioni. Dichiararlo `piccoli` sarebbe la scorciatoia che si rompe
   dall'altro capo: comparirebbe a quattro anni e sparirebbe a nove. */
uguale('«piccoli» lascia accesi i giochi per i piccoli e i posti',
       accesiPiccoli.slice().sort().join(','),
       [...new Set([...PICCOLI, ...POSTI])].sort().join(','))
controlla('e i posti restano accesi in tutte e quattro le partenze',
  PARTENZE.every(p => POSTI.every(k => eccezioniDi(p.chiave).giochi[k] === undefined)))
uguale('e spegne le divisioni', piccoli.sa.divisioni, false)
uguale('e le moltiplicazioni', piccoli.sa.moltiplicazioni, false)

/* ── LE FASCE SONO ANNIDATE ──
   Quello che una fascia spegne deve spegnerlo anche ogni fascia più
   piccola. Detta così sembra ovvia; il difetto che ha reso necessario
   scriverla non lo era: «piccoli» dava per scontati i problemi scritti,
   i verbi al presente e i suoni difficili, che «prima o seconda»
   toglieva — cioè a quattro anni il gioco supponeva più cose che a sei.
   Nessun errore, nessun test rosso: solo domande fuori misura ai più
   piccoli, che è il difetto che questa scala esiste per evitare. */
for (let i = 1; i < PARTENZE.length; i++) {
  const grande = PARTENZE[i], piccola = PARTENZE[i - 1]
  const mancano = grande.saperi.filter(k => !piccola.saperi.includes(k))
  uguale(`«${piccola.nome}» spegne tutto quello che spegne «${grande.nome}»`,
         mancano.join(',') || '—', '—')
}

/* ── prima o seconda ──
   La fascia arrivata per ultima, e quella che si sbaglia più facilmente
   perché sta in mezzo: deve tenere accesi i giochi dei piccoli (a sei
   anni si contano ancora le pecore) e spegnere quelli che danno per
   scontata la lettura o i conti delle classi alte. Se un giorno
   diventasse `nientePiccoli` per sbaglio, resterebbe una fascia con
   dentro tre carte e nessuna adatta. */
const prima = eccezioniDi('prima')
for (const k of PICCOLI) controlla(`«prima» LASCIA acceso il gioco per i piccoli ${k}`,
  prima.giochi[k] === undefined)
for (const k of GRANDI) uguale(`«prima» spegne il gioco da grandi ${k}`, prima.giochi[k], false)
uguale('«prima» spegne le moltiplicazioni', prima.sa.moltiplicazioni, false)
uguale('e i problemi scritti, che sono da leggere', prima.sa.problemi, false)
controlla('«prima» LASCIA i numeri e le quantità', prima.sa.numeri === undefined)
controlla('e le sequenze', prima.sa.sequenze === undefined)
/* Il senso di una fascia in mezzo è che ci resti qualcosa da giocare:
   se spegnesse tutto sarebbe la partenza dei piccoli scritta due volte. */
const accesiPrima = CHIAVI_GIOCHI.filter(k => prima.giochi[k] !== false)
controlla('«prima» lascia in home più giochi di «piccoli»',
  accesiPrima.length > accesiPiccoli.length, accesiPrima.join(','))
controlla('ma non tutti', accesiPrima.length < CHIAVI_GIOCHI.length)

/* ── la terza ──
   Il cuore di questa partenza: moltiplicazioni SÌ, divisioni NO. Se un
   giorno si invertissero, un bambino di terza si troverebbe le divisioni
   in colonna e non le tabelline — l'esatto contrario. */
const terza = eccezioniDi('terza')
uguale('«terza» spegne le divisioni', terza.sa.divisioni, false)
controlla('«terza» LASCIA le moltiplicazioni', terza.sa.moltiplicazioni === undefined)
uguale('«terza» spegne le misure', terza.sa.misure, false)
uguale('e le conversioni', terza.sa.conversioni, false)
for (const k of PICCOLI) uguale(`«terza» spegne il gioco per i piccoli ${k}`, terza.giochi[k], false)
const spentiTerza = CHIAVI_GIOCHI.filter(k => terza.giochi[k] === false)
uguale('e non spegne nessun altro gioco',
       spentiTerza.slice().sort().join(','), PICCOLI.slice().sort().join(','))

/* ── la quarta ── */
const quarta = eccezioniDi('quarta')
uguale('«quarta» non spegne nessun sapere', Object.keys(quarta.sa).length, 0)
for (const k of PICCOLI) uguale(`«quarta» spegne il gioco per i piccoli ${k}`, quarta.giochi[k], false)
controlla('«quarta» lascia acceso il castello', quarta.giochi.torri === undefined)

/* ── l'età ──
   Il terzo pezzo di una partenza, e quello che non si vede: dice a che
   età il gioco deve credere che sia il bambino, e da lì dipende quali
   domande arrivano (`quiz/nucleo/classi.js`). Scritta storta non dà
   errore da nessuna parte — arrivano semplicemente le domande di un
   altro bambino. */
for (const p of PARTENZE) {
  const e = eccezioniDi(p.chiave).eta
  controlla(`${p.chiave}: dichiara un'età`, typeof e === 'number' && e >= 4 && e <= 11, String(e))
}
/* e l'ordine è quello delle carte: se «prima» dichiarasse più anni di
   «terza», le quattro carte direbbero una cosa e il gioco ne farebbe
   un'altra */
const anni = k => eccezioniDi(k).eta
controlla('chi comincia adesso ha meno anni di chi è in terza', anni('prima') < anni('terza'))
controlla('e chi è in terza meno di chi è in quinta', anni('terza') < anni('quarta'))
controlla('e i più piccoli meno di tutti', anni('piccoli') < anni('prima'))

/* ── acceso è l'assenza ──
   Le eccezioni contengono SOLO dei `false`. Un `true` scritto dentro
   sarebbe un gioco «acceso per sempre», che è un'altra cosa e romperebbe
   il patto: un gioco nuovo deve nascere acceso senza migrazioni. */
for (const p of PARTENZE) {
  const e = eccezioniDi(p.chiave)
  const veri = [...Object.values(e.giochi), ...Object.values(e.sa)].filter(v => v !== false)
  uguale(`${p.chiave}: le eccezioni sono solo spegnimenti`, veri.length, 0)
}

/* ── una partenza che non c'è non fa danni ──
   Un profilo con tutto acceso è com'era prima che le partenze
   esistessero: si vede subito e non perde niente. */
const nulla = eccezioniDi('quinta-ginnasio')
uguale('una partenza sconosciuta non spegne giochi', Object.keys(nulla.giochi).length, 0)
uguale('né saperi', Object.keys(nulla.sa).length, 0)
uguale('e non si trova nel catalogo', partenza('quinta-ginnasio'), null)

/* ═══════════════════════════════════════════════════════════════════
   SPOSTARE L'ETÀ, CHE È QUELLO CHE LA MANOPOLA CHIEDE PRIMA DI FARE

   La manopola non scrive più a ogni tacca: muove una bozza, mostra il
   quadro di quell'età e chiede «Applica». Quello che il cartello dice
   — cosa si riscrive, e quante voci messe a mano se ne vanno — esce
   tutto da qui, quindi qui si prova: sbagliare il conto non dà nessun
   errore, dice solo una bugia a chi sta decidendo.
   ═══════════════════════════════════════════════════════════════════ */
const difettiDi = anni => eccezioniPerEta(anni)

/* ── dentro la stessa fascia non si perde niente ──
   È la promessa che rende la manopola usabile: da 8 a 8,5 si sposta la
   mira delle domande e tutto quello che il grande ha sistemato a mano
   resta dov'era. */
const dentro = spostandoLEta({ da: 8, a: 8.5, giochi: { dungeon: false }, sa: {},
                               ritocchi: { 'math:x7': 1 } })
uguale('mezzo anno nella stessa fascia non riscrive', dentro.riscrive, false)
uguale('non chiede niente', dentro.chiede, false)
uguale('e non porta via nessun gioco', dentro.perde.giochi, 0)
uguale('nessun sapere', dentro.perde.sa, 0)
uguale('nessun ritocco', dentro.perde.ritocchi, 0)
uguale('i giochi restano quelli di prima', dentro.giochi.dungeon, false)

/* ── cambiando fascia, chi stava sui difetti non perde niente ──
   Non c'è niente di suo da difendere: si riscrive e si va dritti, e il
   cartello lo dice con zero voci invece che con un «sei sicuro?». */
const suiDifetti = spostandoLEta({ da: 8, a: 5,
                                   giochi: difettiDi(8).giochi, sa: difettiDi(8).sa })
uguale('cambiare fascia riscrive', suiDifetti.riscrive, true)
uguale('ma chi stava sui difetti non deve rispondere', suiDifetti.chiede, false)
uguale('e non perde nessun gioco messo a mano', suiDifetti.perde.giochi, 0)
uguale('né saperi', suiDifetti.perde.sa, 0)

/* ── e chi aveva messo le mani sa **quante** ne perde ──
   Il numero è tutta la differenza fra una domanda a cui si può
   rispondere e un «sei sicuro?»: si contano le differenze dai difetti
   della fascia **da cui si parte**, nei due versi — un gioco spento a
   mano e uno riacceso a mano se ne vanno tutti e due. */
/* un sapere che a otto anni è acceso di suo: spegnerlo è una scelta
   del grande, e va contata. Cercarlo invece di scriverlo a mano è la
   differenza fra un test che prova il conto e uno che prova quali
   saperi la terza elementare spegne oggi. */
const sapereAcceso = CHIAVI_SAPERI.find(c => difettiDi(8).sa[c] !== false)
const aMano = {
  giochi: { ...difettiDi(8).giochi, dungeon: false },
  sa: { ...difettiDi(8).sa, [sapereAcceso]: false },
  ritocchi: { 'math:x7': 1, 'orologio:mezze': -1 },
}
const suMisura = spostandoLEta({ da: 8, a: 5, ...aMano })
uguale('con roba a mano si chiede prima', suMisura.chiede, true)
uguale('e si dice quanti giochi tornano di partenza', suMisura.perde.giochi, 1)
uguale('quanti pezzi di scuola', suMisura.perde.sa, 1)
uguale('e quante domande ritoccate', suMisura.perde.ritocchi, 2)

/* I ritocchi da soli bastano a far chiedere: sono correzioni sopra
   l'età, e ripartire dai difetti li porta via — se non entrassero nel
   conto sparirebbero in silenzio nell'unico caso in cui un grande
   aveva toccato solo quelli. */
const soloRitocchi = spostandoLEta({ da: 8, a: 5, giochi: difettiDi(8).giochi,
                                     sa: difettiDi(8).sa, ritocchi: { 'math:x7': 1 } })
uguale('i soli ritocchi bastano a far chiedere', soloRitocchi.chiede, true)
uguale('e si contano', soloRitocchi.perde.ritocchi, 1)

nota(PARTENZE.map(p => `${p.nome}: ${Object.keys(eccezioniDi(p.chiave).giochi).length} giochi e ${p.saperi.length} saperi spenti`).join(' · '))
nota('in home con «prima o seconda»:', accesiPrima.join(', '))

/* ── E RIMETTERE TUTTO COM'È DI PARTENZA ──
   Lo stesso conto senza spostare l'età: quello che si butta sono le
   eccezioni. Due cose da tenere ferme. Che **conti giusto**: il tasto
   dice cosa perde, e un numero diverso da quello che poi sparisce è
   peggio di nessun numero. E che **si nasconda quando non c'è niente
   da rimettere**: un ripristino che non ripristina niente fa dubitare
   di aver capito cosa fa. */
{
  const pulito = rimettendoLEta({ eta: 8, giochi: difettiDi(8).giochi,
                                  sa: difettiDi(8).sa, ritocchi: {} })
  uguale('senza niente a mano non c\'è niente da rimettere', pulito.cambia, false)
  uguale('e non si perde niente',
         pulito.perde.giochi + pulito.perde.sa + pulito.perde.ritocchi, 0)

  const sporco = rimettendoLEta({
    eta: 8,
    giochi: { ...difettiDi(8).giochi, torri: false, dungeon: true },
    /* uno che a otto anni è acceso di suo: spegnere quello che l'età
       spegneva già non è una differenza, e infatti non si conta */
    sa: { ...difettiDi(8).sa, [sapereAcceso]: false },
    ritocchi: { 'math:x7': 1, geometria: -2 },
  })
  uguale('con roba a mano c\'è qualcosa da rimettere', sporco.cambia, true)
  /* si contano le differenze nei due versi: un gioco spento a mano e
     uno tenuto a mano se ne vanno tutti e due */
  uguale('due giochi messi a mano si contano', sporco.perde.giochi, 2)
  uguale('un pezzo di scuola pure', sporco.perde.sa, 1)
  uguale('e le domande ritoccate', sporco.perde.ritocchi, 2)
  uguale('e quello che torna sono i difetti della sua fascia',
         JSON.stringify(sporco.giochi), JSON.stringify(difettiDi(8).giochi))
  uguale('l\'età non si tocca', sporco.eta, 8)
}

riassunto('le quattro partenze')
