/* ═══════════════════════════════════════════════════════════════════
   QUELLO CHE ARRIVA A CHI HA QUELL'ETÀ — le tappe, non le domande.

   Il difetto da cui è nato tutto questo si racconta in due righe, ed è
   il motivo per cui questo file esiste: **a nove anni «2×2» non ha
   senso, a sei anni «7×8» nemmeno, e a otto vanno bene tutti e due.**
   Prima le campagne non lo sapevano: la fila era una sola per tutti, e
   chi arrivava grande si macinava le prime tappe per delle sere.

   Qui si controllano due cose diverse:

   1. **Il conto** (`data/portata.js`), che è dato puro e si prova con
      tappe finte: la mira, i tre stati, e le due asimmetrie che si
      sbagliano più facilmente — la testa si taglia solo a quello che la
      scuola ha già dato, e un sapere spento la fa tornare.

   2. **I numeri veri**, campagna per campagna. È la parte che a occhio
      non si vede: una tappa senza `portata` non dà nessun errore, entra
      nella fila e ci resta — semplicemente non viene mai tolta a
      nessuno, che è esattamente il difetto di partenza tornato indietro
      in silenzio.
   ═══════════════════════════════════════════════════════════════════ */
import { miraDi, statoDellaTappa, filaConPortata, primaDaGiocare,
         restaQualcosa, giocoDaOffrire, arcoDelGioco, livelloDegliAnni,
         PASSATA, IN_PORTATA, AVANTI } from '../../src/data/portata.js'
import { CAMPAGNA as TABELLINE } from '../../src/data/tabelline.js'
import { STAZIONI } from '../../src/data/calcolo.js'
import { SCALETTA } from '../../src/data/asteroidi.js'
import { CAMPAGNA as CONTA } from '../../src/giochi/conta/dati/campagna.js'
import { CAMPAGNA as PRIMA_DOPO } from '../../src/giochi/prima-dopo/dati/campagna.js'
import { CAMPAGNA as CODICE } from '../../src/giochi/codice-segreto/dati/campagna.js'
import { CAMPAGNA as DUNGEON } from '../../src/giochi/dungeon/dati/campagna.js'
import { CAMPAGNA as SURVIVORS } from '../../src/giochi/survivors/dati/campagna.js'
import { CAMPAGNA as CORSA } from '../../src/giochi/corsa/dati/campagna.js'
import { CAMPAGNA as SOTTERRANEO } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { CAMPAGNA as INGLESE } from '../../src/data/campagna-inglese.js'
import { CAMPAGNA as SPAGNOLO } from '../../src/data/campagna-spagnolo.js'
import { RACCONTO as CASTELLO } from '../../src/data/campagne-castello.js'
import { TAPPE as POZIONI } from '../../src/data/pozioni.js'
import { FILA as BANCARELLA } from '../../src/data/bancarella.js'
import { CAMPAGNE as GENERALE } from '../../src/data/campagne-generale.js'
import { SAPERI } from '../../src/data/saperi.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

/* ═══════════ 1. IL CONTO ═══════════ */

/* la mira è stretta apposta: un anno indietro, un anno e mezzo avanti */
const [giu, su] = miraDi(9)
dentro('la mira a nove anni comincia a otto', giu, livelloDegliAnni(8) - 0.5, livelloDegliAnni(8) + 0.5)
dentro('e finisce a dieci e mezzo', su, livelloDegliAnni(10.5) - 0.5, livelloDegliAnni(10.5) + 0.5)
uguale('senza età non si taglia niente', miraDi(null), null)

const finta = (portata, scuola) => ({ portata, scuola })
uguale('sotto la mira, roba di scuola: già passata',
       statoDellaTappa(finta(20, 'numeri'), { eta: 9 }), PASSATA)
uguale('sopra la mira: chiusa, arriva dopo',
       statoDellaTappa(finta(95, 'numeri'), { eta: 9 }), AVANTI)
uguale('dentro la mira: si gioca',
       statoDellaTappa(finta(60, 'numeri'), { eta: 9 }), IN_PORTATA)

/* ── le due asimmetrie ──
   Sono la ragione per cui questo non è un semplice «taglia fuori
   finestra», e sono le due cose che qualcuno prima o poi «sistemerà». */
uguale('la testa NON si taglia a quello che la scuola non dà (dog a dieci anni)',
       statoDellaTappa(finta(12), { eta: 10 }), IN_PORTATA)
uguale('ma si taglia a quello che la scuola dà (2×2 a nove anni)',
       statoDellaTappa(finta(37, 'moltiplicazioni'), { eta: 9 }), PASSATA)
uguale('e un sapere spento fa tornare la testa',
       statoDellaTappa(finta(37, 'moltiplicazioni'), { eta: 9, spenti: ['moltiplicazioni'] }),
       IN_PORTATA)
uguale('senza età, tutto alla portata di tutti',
       statoDellaTappa(finta(95, 'divisioni'), {}), IN_PORTATA)

/* ── nessuna tappa esce dalla fila ──
   È quello che tiene in piedi i salvataggi: `profile.campagne[…]` è un
   indice, e una fila che si accorcia lo sposta senza dire niente. */
const fila = [finta(10, 'numeri'), finta(40, 'numeri'), finta(70, 'numeri'), finta(99, 'numeri')]
uguale('la fila resta lunga uguale', filaConPortata(fila, { eta: 9 }).length, fila.length)
controlla('e gli indici sono quelli veri',
          filaConPortata(fila, { eta: 9 }).every((t, i) => t.indice === i))
uguale('si comincia dalla prima non ancora saputa', primaDaGiocare(fila, { eta: 9 }), 2)

/* ── la carta in home ── */
const finito = [finta(10, 'numeri'), finta(20, 'numeri')]
uguale('un gioco tutto sotto non si offre più', giocoDaOffrire(finito, { eta: 10 }), false)
uguale('ma se l\'ha già aperto non sparisce mai', giocoDaOffrire(finito, { eta: 10, provato: true }), true)
uguale('e un gioco tutto sopra non si offre ancora',
       giocoDaOffrire([finta(95, 'divisioni')], { eta: 6 }), false)

/* ═══════════ 2. I NUMERI VERI ═══════════ */

const CAMPAGNE = [
  ['conta gli animali', CONTA], ['prima e dopo', PRIMA_DOPO],
  ['codice segreto', CODICE], ['dungeon', DUNGEON], ['survivors', SURVIVORS],
  ['la corsa', CORSA], ['il sotterraneo', SOTTERRANEO],
  ['asteroidi', SCALETTA.map(v => v.T)], ['tabelline', TABELLINE], ['calcolo a mente', STAZIONI],
  ['inglese', INGLESE], ['spagnolo', SPAGNOLO], ['castello', CASTELLO],
  ['pozioni', POZIONI], ['bancarella', BANCARELLA],
  ...GENERALE.map(c => ['generale/' + c.id, c.tappe]),
]

const CHIAVI_SAPERI = SAPERI.map(s => s.chiave)

for (const [nome, tappe] of CAMPAGNE) {
  /* ── nessuna tappa muta ──
     Una senza `portata` non dà errore: resta offerta a tutti per sempre,
     ed è il difetto di partenza che rientra dalla finestra. */
  const mute = tappe.filter(t => !Number.isFinite(t.portata)).length
  uguale(`${nome}: ogni tappa dice dove sta`, mute, 0)

  /* ── dentro la scala ── */
  const fuori = tappe.filter(t => t.portata < 0 || t.portata > 100).length
  uguale(`${nome}: e ci sta dentro la scala 0-100`, fuori, 0)

  /* ── i saperi citati esistono ──
     Una chiave sbagliata qui non spegne niente: fa solo sì che la testa
     non si tagli mai, in silenzio. */
  const ignoti = [...new Set(tappe.map(t => t.scuola).filter(Boolean))]
    .filter(s => !CHIAVI_SAPERI.includes(s))
  uguale(`${nome}: i pezzi di scuola che cita esistono`, ignoti.join(','), '')

  /* ── la fila sale ──
     Non serve che salga a ogni passo — una campagna può alternare due
     mestieri, come gli asteroidi — ma non può scendere di netto: una
     tappa molto più facile della precedente vuol dire che il numero è
     sbagliato, non che la campagna è furba. */
  const scalini = tappe.slice(1).map((t, i) => t.portata - tappe[i].portata)
  const crolli = scalini.filter(d => d < -12).length
  uguale(`${nome}: la fila non torna indietro`, crolli, 0)
}

/* ── il caso che ha fatto nascere tutto ──
   Detto sui numeri veri e non su tappe finte, perché è lì che si vede
   se le tabelline sono state messe al posto giusto. */
const perNome = n => SCALETTA.map(v => v.T).find(t => (t.nome || '').includes(n))
const due = perNome('del 2')
const otto = perNome('del 8')
uguale('a nove anni la tabellina del 2 è roba già passata',
       statoDellaTappa(due, { eta: 9 }), PASSATA)
uguale('a sei anni quella dell\'8 è ancora chiusa',
       statoDellaTappa(otto, { eta: 6 }), AVANTI)
uguale('a otto anni si gioca la tabellina del 2…',
       statoDellaTappa(due, { eta: 8 }), IN_PORTATA)
uguale('…e anche quella dell\'8: a metà strada ci stanno tutte e due',
       statoDellaTappa(otto, { eta: 8 }), IN_PORTATA)

/* ── e il suo contrario, che è la metà che si dimentica ──
   Le prime parole d'inglese non spariscono a nessuna età: non le dà
   nessuna scuola, e questo gioco è l'unica fonte che il bambino ha. */
uguale('«gli animali» in inglese resta a disposizione anche a dieci anni',
       statoDellaTappa(INGLESE[0], { eta: 10 }), IN_PORTATA)
uguale('ma le frasi scritte a cinque anni no',
       statoDellaTappa(INGLESE[INGLESE.length - 1], { eta: 5 }), AVANTI)

/* ── chi si vede e chi no, alle quattro età delle partenze ── */
const GIOCHI_IN_HOME = [
  ['conta gli animali', CONTA], ['prima e dopo', PRIMA_DOPO], ['inglese', INGLESE],
  ['asteroidi', SCALETTA.map(v => v.T)], ['pozioni', POZIONI], ['castello', CASTELLO],
]
for (const eta of [5, 6.5, 8, 9.5]) {
  const visti = GIOCHI_IN_HOME.filter(([, t]) => giocoDaOffrire(t, { eta })).map(([n]) => n)
  controlla(`a ${eta} anni resta qualcosa da giocare`, visti.length > 0, 'nessun gioco')
  nota(`${eta} anni →`, visti.join(', '))
}
uguale('a cinque anni il laboratorio delle pozioni non si offre',
       giocoDaOffrire(POZIONI, { eta: 5 }), false)
uguale('a dieci anni conta gli animali non si offre più',
       giocoDaOffrire(CONTA, { eta: 10 }), false)

for (const [nome, tappe] of CAMPAGNE) {
  const a = arcoDelGioco(tappe)
  if (a) nota(nome.padEnd(18), `${a.anniDa.toFixed(1)}–${a.anniA.toFixed(1)} anni`)
}

riassunto('la portata delle tappe')
