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
import { PARTENZE, eccezioniDi, partenza } from '../../src/data/partenze.js'
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
const piccoli = eccezioniDi('piccoli')
const accesiPiccoli = CHIAVI_GIOCHI.filter(k => piccoli.giochi[k] !== false)
uguale('«piccoli» lascia accesi esattamente i giochi per i piccoli',
       accesiPiccoli.slice().sort().join(','), PICCOLI.slice().sort().join(','))
uguale('e spegne le divisioni', piccoli.sa.divisioni, false)
uguale('e le moltiplicazioni', piccoli.sa.moltiplicazioni, false)

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

nota(PARTENZE.map(p => `${p.nome}: ${Object.keys(eccezioniDi(p.chiave).giochi).length} giochi e ${p.saperi.length} saperi spenti`).join(' · '))
nota('in home con «prima o seconda»:', accesiPrima.join(', '))

riassunto('le quattro partenze')
