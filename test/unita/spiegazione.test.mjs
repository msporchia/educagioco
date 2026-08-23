/* ═══════════════════════════════════════════════════════════════════
   LA SPIEGAZIONE DOPO UNO SBAGLIO, E QUANTO TEMPO SI DÀ PER LEGGERLA

   Questo file esiste per un guasto che **giocando non si vedeva**, ed è
   il motivo per cui è passato inosservato per mesi: la scheda mostrava
   `perche || aiuto`, cioè il primo dei due che ci fosse. A schermo
   compariva sempre qualcosa, nessun errore da nessuna parte, e la
   domanda restava formalmente ineccepibile — solo che l'unica delle due
   righe che **insegna** era proprio quella che non si vedeva mai, visto
   che i moduli scritti bene danno un `perche` a ogni risposta falsa.

   Le due righe fanno due mestieri e vanno tenute distinte:

     · il `perche` di una risposta diagnostica **quella scelta lì** —
       «hai guardato solo l'ultima cifra» — e domani non serve a niente;
     · l'`aiuto` della domanda insegna **come si fa** — «47 sta fra 40 e
       50: l'ultima cifra è 7, quindi si va su» — e la volta dopo il
       bambino può rifare il ragionamento da solo.

   Nasce da un bambino di terza che l'arrotondamento a scuola non
   l'aveva ancora fatto: la scelta non è togliergli quelle domande, è
   fare in modo che sbagliarle insegni qualcosa. Il che vuol dire due
   cose, e sono le due metà di questo file — che la spiegazione ci sia
   tutta, e che ci sia il tempo di leggerla.
   ═══════════════════════════════════════════════════════════════════ */
import { readdirSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { nota, controlla, uguale, dentro, riassunto } from '../aiuto/verifica.mjs'
import {
  spiegazioneDi, attesaDellEsito, tempoDiCapire,
  PONDERA, LEGGERE_MAX, TETTO, A_CAPIRE,
} from '../../src/quiz/nucleo/domanda.js'
import { SCALA } from '../../src/quiz/fretta.js'
import { Sorte } from '../../src/quiz/nucleo/sorte.js'

/* ══════════ 1. TUTTE E DUE, NON UNA DELLE DUE ══════════ */

const conDue = {
  testo: 'Arrotonda 47 alla decina più vicina.',
  risposte: [
    { testo: '40', perche: '7 è più di 5, quindi si va su' },
    { testo: '50' },
    { testo: '70', perche: "hai guardato solo l'ultima cifra" },
  ],
  giusta: 1,
  aiuto: "47 sta fra 40 e 50: l'ultima cifra è 7, quindi si va su",
}

/* IL CONTROLLO CHE VALE PIÙ DI TUTTI. Rimettendo un `||` questo torna
   rosso, e nient'altro lo farebbe: a schermo si vedrebbe comunque una
   riga sotto la risposta sbagliata, e chi prova il gioco per un minuto
   non ha modo di sapere che ne manca un'altra. */
const scelto0 = spiegazioneDi(conDue, 0)
controlla('sbagliando si legge il perché di quella scelta',
          scelto0.perche === '7 è più di 5, quindi si va su', scelto0.perche)
controlla('E ANCHE come si fa — è il guasto che non si notava giocando',
          scelto0.comeSiFa === conDue.aiuto,
          scelto0.comeSiFa ? `ha dato «${scelto0.comeSiFa}»` : 'l\'insegnamento non arriva a nessuno')

/* i tre casi che esistono davvero nel catalogo, tutti e tre */
const senzaPerche = spiegazioneDi({ ...conDue, risposte: [{ testo: '40' }, { testo: '50' }, { testo: '70' }] }, 0)
uguale('una risposta senza perché non perde il come si fa', senzaPerche.comeSiFa, conDue.aiuto)
uguale('e non si inventa un perché', senzaPerche.perche, '')

const senzaAiuto = spiegazioneDi({ ...conDue, aiuto: undefined }, 2)
uguale('una domanda senza aiuto mostra comunque il perché',
       senzaAiuto.perche, "hai guardato solo l'ultima cifra")
uguale('e non si inventa un come si fa', senzaAiuto.comeSiFa, '')

const nulla = spiegazioneDi({ ...conDue, aiuto: undefined, risposte: [{ testo: 'a' }, { testo: 'b' }] }, 0)
controlla('senza né uno né l\'altro non compare niente', !nulla.perche && !nulla.comeSiFa)

/* a risposta giusta non si spiega niente: quello che c'era da dire
   l'ha appena detto il bambino */
const azzeccata = spiegazioneDi(conDue, 1)
controlla('a risposta giusta non si spiega niente',
          !azzeccata.perche && !azzeccata.comeSiFa)
const nonRisposta = spiegazioneDi(conDue, -1)
controlla('e finché non si è risposto nemmeno',
          !nonRisposta.perche && !nonRisposta.comeSiFa)

/* ══════════ 2. E VALE PER TUTTO IL CATALOGO ══════════
   Il caso singolo qui sopra dice che la funzione è giusta; questo dice
   che serve a qualcuno. Si generano domande vere da ogni modulo, si
   sceglie una risposta sbagliata come farebbe un bambino, e si conta
   quante volte le due righe ci sono tutte e due: col vecchio `||`
   quel conto sarebbe zero, perché il `perche` vince sempre. */
const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CARTELLA = resolve(RADICE, 'src/quiz/moduli')
const moduli = []
if (existsSync(CARTELLA))
  for (const f of readdirSync(CARTELLA).sort().filter(x => x.endsWith('.js'))) {
    const mod = (await import(pathToFileURL(resolve(CARTELLA, f)).href)).default
    if (mod) moduli.push(mod)
  }
controlla('i moduli di quiz si raccolgono da soli', moduli.length > 0)

let sbagli = 0, insegnate = 0, soloPerche = 0, mute = 0
let parolePeggiori = 0
const parole = s => String(s || '').trim().split(/\s+/).filter(Boolean).length
for (const m of moduli)
  for (let g = 1; g <= m.gradi; g++)
    for (let t = 0; t < 40; t++) {
      const d = m.chiedi(g, new Sorte(g * 7919 + t))
      /* la risposta sbagliata che sceglierebbe un bambino: la prima che
         non è quella giusta */
      const i = d.risposte.findIndex((_, k) => k !== d.giusta)
      const s = spiegazioneDi(d, i)
      sbagli++
      if (s.perche && s.comeSiFa) insegnate++
      else if (s.perche) soloPerche++
      else if (!s.comeSiFa) mute++
      parolePeggiori = Math.max(parolePeggiori, 2 + parole(s.perche) + parole(s.comeSiFa))
    }
nota(`su ${sbagli} sbagli veri: ${insegnate} spiegano perché E come si fa, `
   + `${soloPerche} solo il perché, ${mute} niente`)
controlla('nel catalogo vero la doppia spiegazione arriva quasi sempre',
          insegnate / sbagli > 0.9, `${(insegnate / sbagli * 100).toFixed(1)}%`)
controlla('e non c\'è nessuno sbaglio che resti muto', mute === 0, `${mute} muti`)

/* ══════════ 3. IL TEMPO CRESCE CON QUELLO CHE C'È DA LEGGERE ══════════
   Il pavimento di quattro secondi era tarato su una riga sola. Adesso
   le righe sono due e arrivano a venticinque parole: quattro secondi
   sarebbero sei parole al secondo, cioè una spiegazione che passa senza
   essere letta — che è peggio di nessuna spiegazione, perché insegna
   che quel riquadro non contiene niente di utile. */
uguale('senza niente da leggere si resta al pavimento',
       attesaDellEsito({ righe: [], pavimento: PONDERA }), PONDERA)
uguale('una spiegazione corta non muove il pavimento: è un pavimento, non un\'aggiunta',
       attesaDellEsito({ righe: ['Era questa. sette è più di cinque'], pavimento: PONDERA }), PONDERA)

const lunga = attesaDellEsito({
  righe: ['Era questa.', conDue.risposte[2].perche, conDue.aiuto], pavimento: PONDERA })
controlla('due righe vere valgono più di quattro secondi', lunga > PONDERA,
          `${(lunga / 1000).toFixed(1)} s per ${2 + parole(conDue.risposte[2].perche) + parole(conDue.aiuto)} parole`)
nota(`la domanda che ha fatto nascere questo lavoro si legge in ${(lunga / 1000).toFixed(1)} s`)

/* e cresce sul serio, non di un pelo: raddoppiando le parole raddoppia
   (dodici e ventiquattro, cioè sotto il tetto tutte e due) */
const dodici = tempoDiCapire([Array(12).fill('parola').join(' ')])
const ventiquattro = tempoDiCapire([Array(24).fill('parola').join(' ')])
uguale('il conto è per parola', dodici, Math.round(12 * A_CAPIRE * 1000))
controlla('e raddoppiando le parole raddoppia', ventiquattro === dodici * 2,
          `${dodici} → ${ventiquattro}`)

/* il pavimento e il passo sono lo stesso numero detto due volte: quattro
   secondi sono esattamente la spiegazione di una riga su cui `PONDERA`
   era stato tarato. Se qualcuno muove uno dei due senza l'altro, la
   soglia sotto cui «non cambia niente» si sposta di nascosto. */
uguale('il pavimento vale sedici parole, cioè una riga',
       Math.round(PONDERA / (A_CAPIRE * 1000)), 16)

/* il tetto della singola attesa: le spiegazioni della logica arrivano a
   cinquanta parole, e a quel punto una schermata ferma smette di
   sembrare una pausa */
uguale('ma non si sale all\'infinito',
       tempoDiCapire([Array(200).fill('parola').join(' ')]), LEGGERE_MAX)
nota(`la spiegazione più lunga del catalogo è di ${parolePeggiori} parole, `
   + `cioè ${(Math.min(LEGGERE_MAX, parolePeggiori * A_CAPIRE * 1000) / 1000).toFixed(1)} s`)

/* ══════════ 4. E LA FRETTA CI STA SOPRA, SENZA SFONDARE ══════════
   La penalità del tiro a caso (`quiz/fretta.js`) si somma a questa
   attesa. Dieci secondi sono il punto oltre il quale una pausa smette
   di sembrare una pausa: da quando il pavimento cresce, la somma dei
   due numeri poteva scavallarlo senza che niente lo dicesse. */
const conFretta = attesaDellEsito({ righe: [], pavimento: PONDERA, penale: SCALA[0] })
uguale('la penalità della fretta si aggiunge', conFretta, PONDERA + SCALA[0])

const ilPeggio = attesaDellEsito({
  righe: [Array(60).fill('parola').join(' ')],
  pavimento: PONDERA,
  penale: SCALA[SCALA.length - 1],
})
uguale('ma il totale non passa mai il tetto dei dieci secondi', ilPeggio, TETTO)
dentro('e il caso peggiore resta un\'attesa, non un castigo', ilPeggio / 1000, 6, 10)

riassunto('la spiegazione dopo uno sbaglio')
