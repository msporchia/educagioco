/* ═══════════════════════════════════════════════════════════════════
   DA DOVE PARTE UN BAMBINO — le quattro partenze che si scelgono
   quando se ne aggiunge uno, e la prima volta che l'app si apre.

   IL PROBLEMA. Un profilo nuovo nasce con tutto acceso: dodici giochi e
   trenta macrogruppi di sapere. Per un bambino di quattro anni vuol dire
   una home con dentro le divisioni in colonna e le conversioni fra
   litri, cioè undici carte su tredici che non sa aprire; per uno di
   terza vuol dire domande che presuppongono cose che a scuola non ha
   ancora fatto. La strada c'era già — i genitori spengono a mano, gioco
   per gioco e sapere per sapere — ma è lunga trenta tocchi, e va fatta
   *prima* che il bambino apra il gioco la prima volta, che è esattamente
   il momento in cui uno ha meno voglia di sedersi a configurare.

   COSA SONO. Un pugno di eccezioni scritte una volta sola, al momento
   della creazione. Non un campo nuovo nel profilo, non una modalità che
   resta: **dopo, si tocca tutto a mano come prima**. Un bambino «terza
   elementare» che a marzo impara le divisioni non va promosso a
   «quarta»: gli si riaccendono le divisioni, che è la stessa cosa che si
   sarebbe fatta senza le partenze.

   Questo ha una conseguenza che va detta, perché è il rovescio della
   stessa medaglia: **un gioco aggiunto dopo nasce acceso per tutti**,
   anche per chi era partito da «piccoli». È il patto di sempre di
   `settings.giochi` (acceso è l'assenza) e qui non si cambia — se un
   gioco nuovo non va bene per un bambino, si spegne come tutti gli
   altri. L'alternativa sarebbe congelare la partenza nel profilo, e a
   quel punto sarebbe una modalità e non un punto di partenza.

   PERCHÉ I GIOCHI SI CALCOLANO E I SAPERI SI ELENCANO. I giochi escono
   da due dichiarazioni nel manifesto — `piccoli: true` e `grandi: true`,
   le due estremità — quindi un gioco nuovo entra nella partenza giusta
   da solo. `grandi` vuol dire «dà per scontato che legga da solo, o la
   matematica delle classi alte»: è quello che spegne la partenza di chi
   entra in prima. Chi non dichiara niente sta in mezzo e resta acceso
   per tutti tranne che per i piccolissimi — acceso è l'assenza anche
   qui.

   I saperi invece stanno scritti qui uno per uno: dire «tutto quello
   che è matematica» sembra più furbo, ma le materie in `saperi.js`
   servono a raggruppare la schermata, non a dire in che anno si
   imparano — e un elenco che si legge è meglio di una regola che
   indovina. `test/unita/partenze.test.mjs`
   controlla che ogni chiave citata qui esista davvero.
   ═══════════════════════════════════════════════════════════════════ */
import { GIOCHI } from './giochi.js'
/* ── L'ETÀ ──
   Il terzo pezzo di una partenza, arrivato con le domande per i più
   piccoli. Giochi e saperi dicono *cosa* si vede e *cosa* si dà per
   scontato; l'età dice **quali domande arrivano**, perché ogni classe
   di domande dichiara a che età serve (`quiz/nucleo/classi.js`).

   Serve perché le due cose non si sostituiscono: si può sapere contare
   fino a venti e non saper leggere una consegna di dodici parole, e
   nessun macrogruppo di `saperi.js` esprime «leggo a fatica». L'età sì,
   e taglia da tutte e due le parti — a chi comincia non arrivano le
   domande di quarta, e a chi è in quinta non arrivano i pallini da
   contare, che sarebbero un premio preso in giro.

   È un numero solo (`anni`, da non confondere con `eta`, che è
   l'etichetta che si legge sulla carta) e sta in mezzo alla fascia:
   «prima o seconda» è 6,5. Non è un dato anagrafico — nessuno chiede la data di nascita —
   è la taratura delle domande, e da lì in poi si sposta a mano. */

/* Quattro e non sei: le partenze servono a far partire, non a
   fotografare il programma ministeriale. Chi sta in quinta parte da
   «quarta», che ha già tutto acceso. La quarta voce è arrivata dopo, e
   per un motivo che si vede solo regalando il gioco: fra «non va ancora
   a scuola» (due carte, niente da leggere) e «terza elementare»
   (tabelline, problemi scritti, domande a tempo) c'era un salto di due
   anni e mezzo, e chi entra in prima ci cascava dentro — troppo grande
   per il primo, troppo piccolo per il secondo. */
export const PARTENZE = [
  {
    chiave: 'piccoli',
    nome: 'Non va ancora a scuola',
    eta: '4-6 anni',
    che: 'Solo i giochi che non chiedono di saper leggere, e in cui non si può perdere.',
    /* tutti i giochi spenti tranne quelli che si dichiarano per i piccoli */
    soloPiccoli: true,
    /* i giochi accesi qui non fanno domande, ma la fascia vale lo stesso
       per il giorno che se ne accende un altro: sotto sta solo quello
       che si guarda e si tocca */
    anni: 5,
    /* Non cambia niente per i giochi che restano accesi — non fanno
       domande di quiz — ma vale per il giorno che se ne accende un
       altro: quello che qui è spento è quello che a scuola non ha
       ancora incontrato, non quello che «è difficile». */
    saperi: ['moltiplicazioni', 'divisioni', 'misure', 'conversioni', 'decine',
             'stima', 'orologio', 'date', 'area-perimetro', 'solidi',
             'analisi', 'tempi-verbali', 'accenti'],
  },
  {
    chiave: 'prima',
    nome: 'Prima o seconda',
    eta: '6-7 anni',
    che: 'Legge ancora a fatica: niente tabelline, niente misure, niente domande scritte lunghe.',
    /* I giochi per i piccoli restano accesi — a sei anni si contano
       ancora le pecore — e si spengono quelli che danno per scontata la
       lettura o i conti delle classi alte. È l'unica partenza che tiene
       tutte e due le estremità in casa: le altre tre stanno da una parte
       o dall'altra. */
    nienteGrandi: true,
    /* Fin dove pescano le domande: tutto il mazzo dei piccoli e il primo
       gradino di quello di scuola, che sta a 0.25 — le figure, i
       contrari, i giorni della settimana. Più su ci sono consegne da
       leggere in fretta, che è esattamente quello che a sei anni non si
       riesce a fare. */
    anni: 6.5,
    /* Quello che a scuola non ha ancora incontrato. È l'elenco dei
       piccoli meno le poche cose che in prima si toccano davvero (i
       numeri fino a venti, le figure, i giorni della settimana), più
       quelle che senza lettura fluente non si possono nemmeno provare:
       i problemi scritti sono il caso limite, il conto lo saprebbe fare
       ma la storia non riesce a leggerla. */
    saperi: ['moltiplicazioni', 'divisioni', 'misure', 'conversioni', 'decine',
             'stima', 'problemi', 'orologio', 'date', 'area-perimetro', 'solidi',
             'spazio-mente', 'analisi', 'flessione', 'presente', 'tempi-verbali',
             'accenti', 'suoni-difficili'],
  },
  {
    chiave: 'terza',
    nome: 'Terza elementare',
    eta: '8 anni',
    che: 'Moltiplicazioni sì, divisioni no. Niente metri, litri e chili: quelli arrivano dopo.',
    nientePiccoli: true,
    anni: 8,
    saperi: ['divisioni', 'misure', 'conversioni'],
  },
  {
    chiave: 'quarta',
    nome: 'Quarta o quinta',
    eta: '9-10 anni',
    che: 'Tutto acceso, tranne i giochi per i più piccoli.',
    nientePiccoli: true,
    anni: 9.5,
    saperi: [],
  },
]

export const partenza = chiave => PARTENZE.find(p => p.chiave === chiave) || null

/* Le eccezioni da scrivere nel profilo appena creato, nella forma che
   `settings` usa già: solo quello che va SPENTO, perché acceso è
   l'assenza. Una partenza sconosciuta non spegne niente — un profilo con
   tutto acceso è com'era prima che questo file esistesse, ed è il
   fallimento giusto: si vede subito e non perde nessun dato. */
export function eccezioniDi (chiave) {
  const p = partenza(chiave)
  if (!p) return { giochi: {}, sa: {}, eta: null }

  const giochi = {}
  for (const g of GIOCHI) {
    const spegni = (p.soloPiccoli && !g.piccoli) || (p.nientePiccoli && g.piccoli)
                || (p.nienteGrandi && g.grandi)
    if (spegni) giochi[g.chiave] = false
  }

  const sa = {}
  for (const s of p.saperi) sa[s] = false

  /* `null` vuol dire «lascia com'è»: una partenza che non si pronuncia
     non deve azzerare l'età di un bambino che ce l'aveva. */
  return { giochi, sa, eta: p.anni ?? null }
}
