/* ═══════════════════════════════════════════════════════════════════
   PREMERE A CASO — quanto costa, e chi lo viene a sapere

   Due regole nate insieme dalla stessa osservazione: guardando giocare,
   certe risposte non sono tentativi, sono **tocchi**. Il tasto è lì, lo
   si preme, si vede cosa succede — e in un gioco dove sbagliare non
   toglie niente quella è perfino la strada più corta.

   1. **La fretta si misura sulla domanda, non su un cronometro.** Un
      secondo e mezzo è tantissimo per «7 × 8» e non basta per una
      consegna lunga: la soglia dev'essere quella di *questa* domanda, o
      il gioco direbbe «hai tirato a caso» a chi le tabelline le sa.
   2. **Quello che va male per settimane lo deve sapere un grande.** Il
      conto c'era già (`quiz/consiglio.js`) e non lo leggeva nessuno; qui
      si prova che la soglia è quella e che la frase dice il numero
      invece del giudizio.

   `node test/esegui.mjs tiro-a-caso --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { tempoDiLettura, troppoDiFretta, FRETTA, FRETTA_MAX, PONDERA }
  from '../../src/quiz/nucleo/domanda.js'
import { pesoDellaFretta, azzeraLaFretta, quanteNeMancano, SCALA, PER_USCIRNE }
  from '../../src/quiz/fretta.js'
import { contoDi, consiglioDa, MINIME, MURO } from '../../src/quiz/consiglio.js'
import { frasePerIlGrande } from '../../src/quiz/allarme.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. quanto ci vuole a leggere una domanda ══════════ */
const corta = { testo: '7 × 8 = ?', risposte: [{ testo: '56' }, { testo: '54' }] }
const lunga = {
  testo: 'Nel cortile ci sono quattro galline e ogni gallina ha fatto tre uova: ' +
         'quante uova ci sono in tutto nel cortile stamattina?',
  risposte: [{ testo: 'dodici uova' }, { testo: 'sette uova' },
             { testo: 'quindici uova' }, { testo: 'quattro uova' }],
}
const figure = { testo: 'Qual è il cane?', risposte: [{ emoji: '🐕' }, { emoji: '🐈' }] }

controlla('una domanda lunga si legge in più tempo di una corta',
          tempoDiLettura(lunga) > tempoDiLettura(corta),
          `${tempoDiLettura(corta).toFixed(2)}s contro ${tempoDiLettura(lunga).toFixed(2)}s`)
dentro('e nessuna scende sotto il minimo per guardare qualunque cosa',
       tempoDiLettura(figure), FRETTA, FRETTA_MAX)
controlla('nemmeno la più lunga sfora il tetto: oltre sarebbe un\'accusa',
          tempoDiLettura(lunga) <= FRETTA_MAX,
          `${tempoDiLettura(lunga).toFixed(2)}s`)
/* le risposte a figura non hanno parole da leggere, e va bene così: si
   guardano, e guardare quattro emoji costa meno che leggere quattro
   parole */
controlla('una domanda a figure costa poco più del minimo',
          tempoDiLettura(figure) < tempoDiLettura(lunga))

/* ══════════ 2. e quando è troppo poco ══════════ */
uguale('rispondere giusto non è mai fretta, per veloce che sia',
       troppoDiFretta(corta, { giusto: true, tempo: 0.2 }), false)
uguale('sbagliare in due decimi di secondo sì',
       troppoDiFretta(corta, { giusto: false, tempo: 0.2 }), true)
uguale('sbagliare dopo averci pensato no',
       troppoDiFretta(corta, { giusto: false, tempo: 6 }), false)
/* il caso che la soglia fissa sbagliava: due secondi su una domanda
   lunga sono ancora fretta, sulla tabellina no */
uguale('due secondi sulla tabellina sono un tentativo vero',
       troppoDiFretta(corta, { giusto: false, tempo: 2 }), false)
uguale('due secondi su una consegna di venticinque parole no',
       troppoDiFretta(lunga, { giusto: false, tempo: 2 }), true)
uguale('e una domanda che non c\'è non accusa nessuno',
       troppoDiFretta(null, { giusto: false, tempo: 0 }), true)

nota(`tabellina ${tempoDiLettura(corta).toFixed(2)}s · figure ` +
     `${tempoDiLettura(figure).toFixed(2)}s · problema ${tempoDiLettura(lunga).toFixed(2)}s`)

/* ══════════ 2-bis. la raffica ══════════
   Una penalità fissa non si sentiva, ed è misurato: col pavimento dei
   quattro secondi che serve a leggere la spiegazione, un secondo e
   mezzo sopra fa 4,0 contro 5,5 — un terzo in più su un'attesa già
   lunga, cioè niente. E il comportamento da spegnere non è il tocco
   affrettato (capita a chiunque abbia il dito già in aria): è la fila
   di tocchi con cui si fa passare una domanda senza guardarla. */
{
  /* La scala, in totali che si vedono a schermo. Il pavimento è
     `PONDERA` = 4 s e questi si sommano — ma solo dove la spiegazione
     sta in una riga: da quando la scheda dice il perché **e** come si
     fa, il pavimento cresce con le parole da leggere
     (`attesaDellEsito`) e questi totali sono il caso corto. Il tetto
     dei dieci secondi vale comunque, ed è lì che le due cose si
     incontrano. */
  const totale = a => (PONDERA + a) / 1000

  azzeraLaFretta()
  uguale('una risposta letta non costa niente', pesoDellaFretta(false).attesa, 0)
  uguale('la 1ª di fretta porta a 5,5s', totale(pesoDellaFretta(true).attesa), 5.5)
  uguale('la 2ª di fila a 7', totale(pesoDellaFretta(true).attesa), 7)
  uguale('la 3ª a 9', totale(pesoDellaFretta(true).attesa), 9)
  uguale('la 4ª a 10', totale(pesoDellaFretta(true).attesa), 10)
  /* oltre non si sale: un'attesa troppo lunga non si legge più come una
     pausa, si legge come un gioco rotto — e allora si posa il telefono */
  uguale('e da lì in poi resta 10', totale(pesoDellaFretta(true).attesa), 10)
  uguale('la scala è quella dichiarata, e finisce lì',
         pesoDellaFretta(true).difila, SCALA.length)

  /* ── e per uscirne servono quattro risposte GIUSTE ──
     Prima bastava una risposta letta con calma: si tirava a caso per
     tre domande, si rallentava su una, e il conto ripartiva da zero —
     cioè insistere restava conveniente. */
  uguale('una risposta letta ma sbagliata non fa uscire',
         pesoDellaFretta(false, false).difila, SCALA.length)
  uguale('e nemmeno risale la scala',
         totale(pesoDellaFretta(true).attesa), 10)
  for (let i = 1; i < PER_USCIRNE; i++) {
    pesoDellaFretta(false, true)
    controlla(`dopo ${i} giusta/e si è ancora dentro`, quanteNeMancano() > 0,
              `ne mancano ${quanteNeMancano()}`)
  }
  uguale(`alla ${PER_USCIRNE}ª giusta si esce`, pesoDellaFretta(false, true).difila, 0)
  uguale('e la prossima di fretta riparte dal primo scatto',
         totale(pesoDellaFretta(true).attesa), 5.5)

  /* una di fretta in mezzo alle giuste rimette il contatore a capo: se
     no si alternerebbe una giusta e un tocco all'infinito */
  pesoDellaFretta(false, true)
  pesoDellaFretta(true)
  uguale('e chi ricomincia a tirare rimette a zero le giuste fatte',
         quanteNeMancano(), PER_USCIRNE)

  azzeraLaFretta()
  nota('attesa dopo uno sbaglio corto: 4,0s · di fretta 5,5 · 7 · 9 · 10 · poi 10, ' +
       `e ne servono ${PER_USCIRNE} giuste per uscirne`)
}

/* ══════════ 3. quando lo si dice a un grande ══════════
   La soglia è quella di `consiglio.js` e non una seconda: se le due
   divergessero, il numero letto nel quadro e quello letto nella posta
   direbbero cose diverse sulla stessa riga. */
const items = q => ({ 'orto:doppie': q })

uguale('sotto le otto risposte non si dice niente: conta più il caso',
       consiglioDa(contoDi(['orto:doppie'], items({ ok: 1, err: 4 }))), null)
{
  const c = consiglioDa(contoDi(['orto:doppie'], items({ ok: 3, err: 7 })))
  controlla('sette sbagliate su dieci sono un muro', !!c && c.verso === -1)
  controlla('e la frase dice il numero, non il giudizio',
            /7 su 10/.test(c.detto), c.detto)
}
uguale('sette su dieci giuste non sono niente da segnalare',
       consiglioDa(contoDi(['orto:doppie'], items({ ok: 7, err: 3 }))), null)
{
  const c = consiglioDa(contoDi(['orto:doppie'], items({ ok: 19, err: 1 })))
  controlla('e chi le indovina quasi tutte si consiglia dall\'altra parte',
            !!c && c.verso === 1, JSON.stringify(c))
}
nota(`servono ${MINIME} risposte, e il muro è sotto il ${MURO * 100}% di giuste`)

/* ══════════ 4. la frase che arriva in posta ══════════ */
{
  const f = frasePerIlGrande({ chi: 'Melody', nome: 'Le doppie',
                               detto: 'ne ha sbagliate 7 su 10' })
  controlla('dice di chi si parla', f.includes('Melody'), f)
  controlla('e di cosa', f.includes('Le doppie'), f)
  controlla('col numero dentro', f.includes('7 su 10'), f)
  /* la parte che la rende utile: non è un verdetto, è una cosa da
     andare a guardare — e dice dove */
  controlla('e con la cosa da fare', /Come va/.test(f), f)
}

riassunto('premere a caso')
