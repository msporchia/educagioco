/* ═══════════════════════════════════════════════════════════════════
   COME SI CHIAMANO I BLOCCHI DEL QUADRO

   Le chiavi sono quelle di sempre (`FASCE_ETA` in
   `quiz/nucleo/catalogo.js`): qui c'è solo **come si dicono a un
   grande che sta guardando suo figlio**, e cambia perché il momento è
   un altro. Nell'elenco delle domande si tara riga per riga, e «Facili
   · Nel segno · Difficili» è il vocabolario giusto per farlo. Qui si
   decide un'età con una manopola in mano, e la domanda che ci si fa è
   sul bambino: *cosa sa già, cosa sta imparando, cosa gli chiediamo di
   provare.*

   Stanno in un file loro perché adesso li chiedono in due: il blocco
   che raccoglie le righe (`Manopola.vue`) e **la tacca che sposta una
   riga** (`Taratura.vue`), che deve poter dire dove va a finire quello
   che si sta muovendo. Se il nome della destinazione non fosse lo
   stesso del blocco in cui la riga poi atterra, la tacca direbbe una
   cosa e l'elenco ne mostrerebbe un'altra.

   Il `corto` esiste per la tacca, dove c'è la larghezza di un telefono
   e non di una riga di elenco: «Nel segno» invece di «Sta imparando
   queste». È lo stesso posto, detto con meno parole — non un secondo
   nome.
   ═══════════════════════════════════════════════════════════════════ */
export const GRUPPI = {
  sotto: { nome: 'Superfluo chiedergliele', corto: 'Ovvie',
           che: 'per lui sono ovvie: le indovinerebbe senza pensarci' },
  facili: { nome: 'Queste le sa fare', corto: 'Le sa fare',
            che: 'roba che sa già: esce quando il gioco chiede poco' },
  medie: { nome: 'Sta imparando queste', corto: 'Nel segno',
           che: 'la sua misura: sono quelle che vede più spesso' },
  toste: { nome: 'Difficili, ma ce la può fare', corto: 'Difficili',
           che: 'un gradino sopra, quando il gioco chiede molto' },
  /* Non è una fascia di difficoltà ed è l'ultima apposta: qui dentro
     non ci finisce quello che è troppo difficile, ma quello che un
     grande ha tolto dicendo «a scuola non l'hanno ancora fatto». */
  spenta: { nome: 'Non ancora spiegate', corto: 'Non ancora spiegate',
            che: 'le hai tolte tu: spariscono dalle domande di tutti i giochi' },
}

/* L'ordine in cui si leggono: dal già saputo al non ancora, poi quello
   che non gli si chiede più, e in fondo quello che è stato tolto. */
export const ORDINE = ['facili', 'medie', 'toste', 'sotto', 'spenta']
