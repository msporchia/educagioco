// Inciampo è un errore del robot; Sera è la giornata del porto finita, e non è un errore.
// Stanno in un file loro perché li lanciano l'esecutore e i mondi, che non devono importarsi a vicenda.

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
