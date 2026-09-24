/* ═══════════════════════════════════════════════════════════════════
   COME SI FERMA UN PROGRAMMA — due modi, e non si somigliano

   `Inciampo` è il robot che si ferma per un errore: un muro davanti, le
   mani già piene, una N da scegliere. Porta il motivo (una chiave di
   `PERCHE` in `esecutore.js`), la riga dove è successo e i dettagli per
   dirlo con le parole giuste.

   `Sera` è la giornata finita, e **non è un errore**: nel porto il mondo
   ha un orologio, e un programma che dice «ripeti per sempre» si ferma
   quando il livello chiude la giornata. Chi la riceve guarda com'è
   andata, non cerca un colpevole.

   Stanno in un file loro perché li lanciano due parti che non devono
   conoscersi: l'esecutore e i mondi (il cantiere di lato, il porto
   dall'alto). Messi nell'esecutore, i mondi dovrebbero importarlo, e
   l'esecutore importa già i mondi: un anello.
   ═══════════════════════════════════════════════════════════════════ */

export class Inciampo extends Error {
  constructor(motivo, id = null, dettagli = {}) {
    super(motivo)
    this.motivo = motivo
    this.id = id
    this.dettagli = dettagli
  }
}

export class Sera extends Error {
  constructor(perche = 'orologio') {
    super('sera')
    this.perche = perche
  }
}
