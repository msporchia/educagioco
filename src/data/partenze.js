/* ═══════════════════════════════════════════════════════════════════
   DA DOVE PARTE UN BAMBINO — le tre partenze che si scelgono quando
   se ne aggiunge uno.

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
   da `piccoli: true` nel manifesto, quindi un gioco nuovo per i piccoli
   entra nella partenza «piccoli» da solo. I saperi invece stanno scritti
   qui uno per uno: dire «tutto quello che è matematica» sembra più
   furbo, ma le materie in `saperi.js` servono a raggruppare la
   schermata, non a dire in che anno si imparano — e un elenco che si
   legge è meglio di una regola che indovina. `test/unita/partenze.test.mjs`
   controlla che ogni chiave citata qui esista davvero.
   ═══════════════════════════════════════════════════════════════════ */
import { GIOCHI } from './giochi.js'

/* Tre e non cinque: le partenze servono a far partire, non a fotografare
   il programma ministeriale. Chi sta in prima o in seconda parte da
   «piccoli» e si accende quello che serve; chi sta in quinta parte da
   «quarta», che ha già tutto acceso. */
export const PARTENZE = [
  {
    chiave: 'piccoli',
    nome: 'Non va ancora a scuola',
    eta: '4-6 anni',
    che: 'Solo i giochi che non chiedono di saper leggere, e in cui non si può perdere.',
    /* tutti i giochi spenti tranne quelli che si dichiarano per i piccoli */
    soloPiccoli: true,
    /* Non cambia niente per i giochi che restano accesi — non fanno
       domande di quiz — ma vale per il giorno che se ne accende un
       altro: quello che qui è spento è quello che a scuola non ha
       ancora incontrato, non quello che «è difficile». */
    saperi: ['moltiplicazioni', 'divisioni', 'misure', 'conversioni', 'decine',
             'stima', 'orologio', 'date', 'area-perimetro', 'solidi',
             'analisi', 'tempi-verbali', 'accenti'],
  },
  {
    chiave: 'terza',
    nome: 'Terza elementare',
    eta: '8 anni',
    che: 'Moltiplicazioni sì, divisioni no. Niente metri, litri e chili: quelli arrivano dopo.',
    nientePiccoli: true,
    saperi: ['divisioni', 'misure', 'conversioni'],
  },
  {
    chiave: 'quarta',
    nome: 'Quarta o quinta',
    eta: '9-10 anni',
    che: 'Tutto acceso, tranne i giochi per i più piccoli.',
    nientePiccoli: true,
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
  if (!p) return { giochi: {}, sa: {} }

  const giochi = {}
  for (const g of GIOCHI) {
    const spegni = (p.soloPiccoli && !g.piccoli) || (p.nientePiccoli && g.piccoli)
    if (spegni) giochi[g.chiave] = false
  }

  const sa = {}
  for (const s of p.saperi) sa[s] = false

  return { giochi, sa }
}
