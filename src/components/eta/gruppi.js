// nomi dei blocchi del quadro (vedi docs/genitori/quadro.md); `corto` è la stessa etichetta per la tacca, larga quanto un telefono
export const GRUPPI = {
  sotto: { nome: 'Superfluo chiedergliele', corto: 'Ovvie',
           che: 'per lui sono ovvie: le indovinerebbe senza pensarci' },
  facili: { nome: 'Queste le sa fare', corto: 'Le sa fare',
            che: 'roba che sa già: esce quando il gioco chiede poco' },
  medie: { nome: 'Sta imparando queste', corto: 'Nel segno',
           che: 'la sua misura: sono quelle che vede più spesso' },
  toste: { nome: 'Difficili, ma ce la può fare', corto: 'Difficili',
           che: 'un gradino sopra, quando il gioco chiede molto' },
  // non è difficoltà: è quello che a scuola non si è ancora fatto, tolto dall'età o da un grande (la riga dice chi dei due, vedi quadro.md)
  spenta: { nome: 'Non ancora spiegate', corto: 'Non ancora spiegate',
            che: 'tolte dall\'età o da te: spariscono dalle domande di tutti i giochi' },
}

/* L'ordine in cui si leggono: dal già saputo al non ancora, poi quello
   che non gli si chiede più, e in fondo quello che è stato tolto. */
export const ORDINE = ['facili', 'medie', 'toste', 'sotto', 'spenta']
