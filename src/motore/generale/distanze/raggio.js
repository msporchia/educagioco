/* ═══════════════════════════════════════════════════════════════════
   RAGGIO — «ci arrivo da qui?»

   Vedere, sentire e colpire erano tre cose scritte in tre posti — una
   BFS in `mappa.js`, un `aPortata` cablato a una cella, e il raggio del
   rumore che non esisteva ancora. Sono la stessa domanda con due
   variabili: **come si misura la distanza**, e **fin dove si arriva**.

                   come si misura                chi dichiara il limite
     vedere        a cammino: i muri fermano,    chi guarda (`vista: 6`)
                   una porta chiusa acceca
     sentire       in linea d'aria: i muri non   il segnale (un fracasso
                   fermano niente                va più lontano di un cigolio)
     colpire       a contatto — e per l'arco     l'arma di chi colpisce
                   in aria, ma solo se vede

   Da qui viene che il rumore con una portata non è una cosa nuova da
   aggiungere al bus dei segnali: è la vista con un altro modo di
   misurare. E che un arciere non costringe a riaprire `attacca`: cambia
   il raggio della sua arma.

   ── I DATI DEL LIVELLO NON CAMBIANO ──
   Un livello continua a scrivere `vista: 6`. È la fabbrica a farne un
   `ACammino(6)`: nessuno deve imparare una parola nuova per dire una
   cosa che diceva già.
   ═══════════════════════════════════════════════════════════════════ */
export class Raggio {
  constructor (limite) { this.limite = limite ?? 0 }

  /* quanto dista, col mio modo di misurare. `Infinity` vuol dire «per
     me non è raggiungibile affatto» — un muro in mezzo, per chi misura
     a cammino. */
  distanza (mondo, da, a) { return Infinity }

  arriva (mondo, da, a) { return this.distanza(mondo, da, a) <= this.limite }

  /* come si legge in una scheda: «vede fin qui», «si sente da lontano» */
  get comeSiLegge () { return `${this.limite}` }
}
