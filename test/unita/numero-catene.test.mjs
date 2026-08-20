/* ═══════════════════════════════════════════════════════════════════
   I CONTI IN FILA — che l'andata venga prima del ritorno.

   Il banco dei quiz (`unita/quiz`) prova la *forma* di queste domande
   come prova quella di tutte le altre. Quello che non può sapere è se
   la progressione ha senso, e qui la progressione **è** la domanda: la
   stessa catena raccontata in avanti o dalla fine non costa uguale.

   In avanti si risolve una volta sola, nell'ordine in cui è scritta.
   Dalla fine no: con quattro risposte davanti, la strada breve è
   rifare il viaggio per ognuna delle quattro — quattro catene invece
   di una. Erano la stessa tipologia con la stessa fatica dichiarata
   (56, otto anni e mezzo) dal passo singolo alla catena da tre, e la
   catena da tre da disfare arrivava così a bambini di sette anni e
   mezzo. Era la domanda più cara del modulo.

   L'andata comincia anche **prima**, al grado 3: quello che la
   rendeva roba da otto anni non era la fila di conti, erano le
   divisioni e i numeri grossi da attraversare. Tolti quelli restano
   due passi dentro il venti, che a sei anni e mezzo si tengono a
   mente — ed è l'unico posto del modulo dove un numero si tiene da
   parte mentre se ne fa un altro.

   Le quattro cose che devono restare vere:

     · **tre passi solo in andata**: da disfare, al massimo due;
     · **la catena piccola resta piccola**: al grado 3 due passi, mai
       una divisione, e niente da attraversare sopra il venti;
     · **l'andata è dichiarata più facile del ritorno**, grado per
       grado, e nessuna delle due si dichiara con un numero solo per
       tutti i gradi;
     · **i numeri di mezzo restano a mente**: una catena da tre non
       passa mai per un «27 per 3», che non è un passo ma un compito.
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { Sorte } from '../../src/quiz/nucleo/sorte.js'
import numero from '../../src/quiz/moduli/numero.js'
import { livelloVoluto } from '../../src/quiz/nucleo/modulo.js'
import { anniDelLivello } from '../../src/quiz/nucleo/classi.js'

const TIRI = 200
const GRADI = [3, 4, 5, 6]
/* il ritorno comincia più tardi dell'andata: qui si confrontano solo i
   gradi dove ci sono tutti e due */
const GRADI_INDIETRO = [4, 5, 6]

/* quante operazioni racconta una domanda: si contano dalle virgole e
   dalla «e» finale, cioè come le legge un bambino */
const quantiPassi = testo => testo.replace(/\.[^.]*$/, '').split(/,| e /).length - 1

/* ══════════ 1. tre passi solo in andata ══════════ */
{
  let maxAvanti = 0, maxIndietro = 0
  const fascia = []
  for (const grado of GRADI) {
    for (let i = 0; i < TIRI; i++) {
      const a = numero.genera(grado, new Sorte(i * 31 + grado), 'num:catena')
      maxAvanti = Math.max(maxAvanti, quantiPassi(a.testo))
      controlla('una catena in avanti parte da un numero detto',
                a.testo.startsWith('Parto da '), a.testo)

      if (grado < 4) continue
      const b = numero.genera(grado, new Sorte(i * 17 + grado), 'num:indovinello')
      /* «quale di questi ha il triplo fra 60 e 70?» è l'altra forma del
         grado 4, e non è una catena: non si conta */
      if (b.testo.startsWith('Penso a un numero')) maxIndietro = Math.max(maxIndietro, quantiPassi(b.testo))
      else fascia.push(grado)
    }
  }
  uguale('in avanti si arriva a tre passi', maxAvanti, 3)
  uguale('da disfare, mai più di due', maxIndietro, 2)
  controlla('e la forma corta resta solo al grado 4', fascia.every(g => g === 4),
            [...new Set(fascia)].join(' '))
  nota(`in avanti fino a ${maxAvanti} passi, da disfare fino a ${maxIndietro}`)
}

/* ══════════ 2. la catena piccola resta piccola ══════════
   Al grado 3 la stessa domanda gira con due passi, senza divisioni e
   dentro il venti. La divisione si riconosce da come si dice: «ne
   prendo la metà» e «lo divido per 3» sono le uniche due forme. */
{
  let piuGrosso = 0, maxPassi = 0
  for (let i = 0; i < TIRI; i++) {
    const d = numero.genera(3, new Sorte(i * 23 + 3), 'num:catena')
    maxPassi = Math.max(maxPassi, quantiPassi(d.testo))
    controlla('al grado 3 non si divide', !/la metà|divido/.test(d.testo), d.testo)
    for (const t of (d.aiuto.match(/→ (\d+)/g) || []).map(x => Number(x.slice(2)))) {
      piuGrosso = Math.max(piuGrosso, t)
      controlla('al grado 3 non si attraversa niente sopra il venti', t <= 20,
                `${t} in «${d.testo}»`)
    }
  }
  uguale('e i passi restano due', maxPassi, 2)
  nota(`al grado 3: ${maxPassi} passi, il più grosso attraversato è ${piuGrosso}`)
}

/* ══════════ 3. l'andata è dichiarata più facile del ritorno ══════════
   Non è un dettaglio da catalogo: quel numero è la sola cosa che decide
   se una domanda arriva a un bambino o no. */
{
  const avanti = numero.tipi.find(t => t.chiave === 'num:catena')
  const indietro = numero.tipi.find(t => t.chiave === 'num:indovinello')
  for (const grado of GRADI_INDIETRO) {
    const a = numero.livelloDelTipo(avanti, grado)
    const b = numero.livelloDelTipo(indietro, grado)
    controlla(`al grado ${grado} l'andata costa meno del ritorno`, a < b, `${a} contro ${b}`)
    controlla('e tutte e due si dichiarano per quel grado',
              livelloVoluto(avanti, grado) !== undefined && livelloVoluto(indietro, grado) !== undefined)
  }
  /* un livello per grado, non uno solo per tutti: era quello il difetto */
  const suoi = GRADI_INDIETRO.map(g => livelloVoluto(indietro, g))
  uguale('il ritorno non si dichiara uguale a ogni grado', new Set(suoi).size, GRADI_INDIETRO.length)
  nota(`da disfare: ${suoi.map((v, i) => `g${GRADI_INDIETRO[i]} ${Math.round(anniDelLivello(v) * 10) / 10} anni`).join(' · ')}`)

  /* l'andata sale grado per grado, e comincia più in basso del ritorno */
  const scala = GRADI.map(g => livelloVoluto(avanti, g))
  controlla('l\'andata si dichiara a ogni grado, dal terzo in su', scala.every(v => v !== undefined))
  controlla('e sale sempre', scala.every((v, i) => i === 0 || v > scala[i - 1]), scala.join(' '))
  controlla('il ritorno al grado 3 non c\'è affatto', livelloVoluto(indietro, 3) === undefined)
  nota(`in avanti: ${scala.map((v, i) => `g${GRADI[i]} ${Math.round(anniDelLivello(v) * 10) / 10} anni`).join(' · ')}`)
}

/* ══════════ 4. i numeri di mezzo restano a mente ══════════
   Una catena da tre che passa per «27 per 3» non è difficile: è lunga,
   e fa perdere il filo a chiunque. Si legge l'aiuto, che dice la strada
   tappa per tappa ed è l'unico posto dove i numeri di mezzo sono
   scritti. */
{
  let piuGrosso = 0
  for (const grado of GRADI) {
    for (let i = 0; i < TIRI; i++) {
      const d = numero.genera(grado, new Sorte(i * 13 + grado * 7), 'num:catena')
      const tappe = (d.aiuto.match(/→ (\d+)/g) || []).map(x => Number(x.slice(2)))
      const tre = quantiPassi(d.testo) >= 3
      for (const t of tappe) {
        piuGrosso = Math.max(piuGrosso, t)
        if (tre) controlla('in una catena da tre non si passa da numeri grossi', t <= 60,
                           `${t} in «${d.testo}»`)
      }
    }
  }
  nota(`il numero più grosso che si attraversa è ${piuGrosso}`)
}

riassunto('i conti in fila')
