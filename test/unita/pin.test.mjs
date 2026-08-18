/* ═══════════════════════════════════════════════════════════════════
   L'ATTESA DEL CODICE DEI GENITORI

   Il codice a quattro cifre non è mai stato il problema — nessun
   bambino l'ha indovinato. Il problema era che provarlo costava zero:
   un tastierino che risponde a ogni tiro è un minigioco, e i bambini
   ci tornavano per quello. Qui si prova l'unica parte che si può
   provare senza schermo, cioè quanto costa sbagliare: tre secondi, poi
   dieci, poi trenta e non di più.

   L'ora si passa da fuori apposta: un test che aspetta trenta secondi
   veri per sapere se sono passati trenta secondi non prova niente e
   costa mezza suite.
   ═══════════════════════════════════════════════════════════════════ */
import { segnaSbaglio, azzeraSbagli, attesa } from '../../src/store/pin.js'
import { uguale, controlla, riassunto } from '../aiuto/verifica.mjs'

const T = 1_000_000   // un'ora qualunque, in millisecondi

azzeraSbagli()

/* ══════════ 1. la scala ══════════ */
uguale('il primo sbaglio costa tre secondi', segnaSbaglio(T), 3000)
uguale('il secondo dieci', segnaSbaglio(T), 10000)
uguale('il terzo trenta', segnaSbaglio(T), 30000)
uguale('e dal quarto in poi resta trenta', segnaSbaglio(T), 30000)
uguale('anche molto più avanti', segnaSbaglio(T), 30000)

/* ══════════ 2. il tempo che passa ══════════ */
azzeraSbagli()
segnaSbaglio(T)
uguale('appena sbagliato manca tutta l\'attesa', attesa(T).resta, 3000)
uguale('a metà ne manca metà', attesa(T + 1500).resta, 1500)
uguale('dopo non manca niente', attesa(T + 3000).resta, 0)
uguale('e non diventa negativa', attesa(T + 99999).resta, 0)

/* la barretta ha bisogno di sapere anche quanto durava in tutto: senza,
   riempirsi vorrebbe dire dividere per zero */
uguale('si sa anche quanto durava', attesa(T).quanto, 3000)

/* ══════════ 3. entrare azzera il conto ══════════
   Sbagliare quattro volte e poi indovinare non deve lasciare in eredità
   l'attesa da trenta secondi al grande che entra domani. */
segnaSbaglio(T); segnaSbaglio(T); segnaSbaglio(T)
azzeraSbagli()
uguale('dopo essere entrati non si aspetta più', attesa(T).resta, 0)
uguale('e si riparte da tre secondi', segnaSbaglio(T), 3000)

/* ══════════ 4. uscire e rientrare non azzera ══════════
   È il motivo per cui il conto sta nel modulo e non in un `ref` dentro
   la schermata: un componente che si smonta si porta via l'attesa, e
   uscire e rientrare tornerebbe a costare zero. */
azzeraSbagli()
segnaSbaglio(T)
controlla('l\'attesa sopravvive alla schermata che si chiude', attesa(T + 100).resta > 0)

riassunto('l\'attesa del codice dei genitori')
