/* ═══════════════════════════════════════════════════════════════════
   COME SI DIPINGE «IL GENERALE»

   Stessa regola di `castello.js`: qui dentro non esistono ordini,
   turni, allarmi suonati o partite vinte. Esistono **cose da
   disegnare**, ognuna con la sua funzione, raccolte nella tabella
   `PITTORI` che `grafica/tela.js` sa usare.

   Il gioco manda una lista tipo
       { che: 'orco', x, y, dir: 'dx', passo: 2, stato: 'errore' }
   e l'orco esce disegnato, girato a destra, a mezzo passo e rosso di
   rabbia. Se domani gli orchi diventano robot si riscrive `orco.js` e
   il gioco non se ne accorge.

   ── questo file è l'ingresso, non la stanza ──
   Il disegno del generale non ci sta in un file solo, e nemmeno in
   sette: adesso è **una cartella per famiglia, un file per cosa**, e
   questo file non fa altro che comporre la tabella.

     comune.js      colore e forme: mescola, capsula, poligono, il dado
     corpo.js       lo scheletro: camminata a due gambe e a quattro zampe
     segni.js       gli stati, gli occhi, i puntini, le scintille
     personaggi/    un file a testa: cavaliere, ladra, elfo, mago, orco,
                    guardia, capitano, goblin, scheletro, lupo
     oggetti/       un file a testa: chiave, forziere, torcia, leva,
                    cassa, botte, pozzo, altare, bandiera…
     ambienti/      un file a testa: cortile, corridoio, cripta, grotta,
                    bosco, miniera, trono, fogne…
     materiali/     di che cosa è fatto il terreno: pietra, roccia,
                    legno, metallo, marmo, verde, acqua, dettagli
     mappa.js       la macchina che dipinge una stanza, e il fondale
     luce.js        il buio, le pozze delle torce, il sole fra le foglie

   Aggiungere un personaggio, un oggetto o una stanza è **un file nuovo
   più una riga nell'indice della sua cartella**. Qui non si scende mai
   a disegnare, e nessun file esistente si allunga.

   ── quello che il gioco può mettere in scena ──
   I nomi stanno in `PERSONAGGI` e in `OGGETTI`; le proprietà di ognuno
   sono scritte in cima al suo file. Le regole che valgono per tutti:

     · `x`, `y` sono il centro della cella, in pixel;
     · un personaggio vuole `dir` ('giu' | 'su' | 'dx' | 'sx'), `passo`
       (un intero che cresce di uno per cella) e `stato` ('normale' |
       'attesa' | 'errore' | 'colpito' | 'ko' | 'lancia');
     · le cose piatte — `vista`, `ronda`, `acqua`, `pozzanghera`,
       `ragnatela`, `scala`, `botola`, `ponte`, `binario` — vanno messe
       a uno strato sotto (`strato: -1`), se no coprono i piedi di chi
       ci cammina sopra;
     · chi ha uno stato continuo lo prende come numero da 0 a 1
       (`apertura`, `tirata`, `alzata`, `abbassato`, `avvolta`): così il
       gioco può animarlo o metterlo secco, e il disegno non cambia.

   Nessuna immagine, nessun font, nessun dato: solo tracciati.
   ═══════════════════════════════════════════════════════════════════ */
import { PITTORI_PERSONE, PERSONAGGI } from './personaggi/indice.js'
import { PITTORI_OGGETTI, OGGETTI } from './oggetti/indice.js'

export { mescola } from './comune.js'
export {
  apriForziere, COLORI_ALLARME, COLORI_CHIAVE, COLORI_GEMMA, COLORI_POZIONE, STILI_PORTA,
} from './oggetti/indice.js'
export { PERSONAGGI, OGGETTI }

/* ─────────── la tabella ───────────
   Il gioco nomina le cose, qui c'è chi le dipinge. */
export const PITTORI = { ...PITTORI_OGGETTI, ...PITTORI_PERSONE }
