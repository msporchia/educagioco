/* ═══════════════════════════════════════════════════════════════════
   LE TRE PARTENZE — il catalogo e quello che spegne davvero

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

/* ── la partenza dei piccoli ── */
const piccoli = eccezioniDi('piccoli')
const accesiPiccoli = CHIAVI_GIOCHI.filter(k => piccoli.giochi[k] !== false)
uguale('«piccoli» lascia accesi esattamente i giochi per i piccoli',
       accesiPiccoli.slice().sort().join(','), PICCOLI.slice().sort().join(','))
uguale('e spegne le divisioni', piccoli.sa.divisioni, false)
uguale('e le moltiplicazioni', piccoli.sa.moltiplicazioni, false)

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

riassunto('le tre partenze')
