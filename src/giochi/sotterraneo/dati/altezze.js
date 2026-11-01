// Quanto è alto in scena chi ha un modello 3D (docs/sotterraneo/sagome-3d.md, «Le misure»): il posto che occupa, in celle, prima
// dell'allungo della vista (scena3d/costanti.js, ALLUNGA). Il modello e la sua sagoma sono alti RAPPORTO (0,72) volte il posto allungato
// (scena3d/sagome-pura.js, scalaDelModello). Sono le misure degli sprite dipinti che i modelli hanno sostituito, prese il 31 ottobre 2026
// (il fotogramma fermo, con la taglia di viste/campo.js): oggi è un dato, gli sprite non ci sono più. Dato puro.

// le specie (dati/mostri.js): il posto, già nella taglia della specie rispetto all'eroe
export const ALTO_DELLA_SPECIE = {
  goblin: 1, scheletro: 1.78125, orco: 1.4375, gigante: 2.25, ratto: 0.9375, pipistrello: 1, melma: 1.09375, fantasma: 1.484375,
  vespa: 1.125, fungo: 0.984375, lupo: 1.3125, granchio: 0.84375, serpente: 1.03125, golem: 1.875, troll: 2.25, zombie: 1.640625,
  'scheletro-scudo': 1.5625, diavoletto: 1.03125, 'spirito-fuoco': 1.5625, 'golem-magma': 1.875, ragno: 0.890625, pianta: 1.4375,
  'melma-rosa': 1.1875, 'mostro-verde': 1.953125, piranha: 1.125, polpo: 1.125, 'fantasma-azzurro': 1.25, tartaruga: 1.21875,
  cinghiale: 1.078125, ent: 2.34375, 'golem-muschio': 2.03125, scorpione: 1.21875, 'spirito-elettrico': 1.21875, 'golem-lava': 2.1875,
  'melma-viola': 1, 'mostro-viola': 1.71875, 'pipistrello-occhio': 0.984375, ombra: 1.5625, 'golem-ghiaccio': 1.875, ghoul: 1.625,
  'teschio-azzurro': 1.078125, mummia: 1.640625, mietitore: 2.0625, draghetto: 1.265625, occhio: 1.03125, 'golem-pietra': 1.953125,
  grifone: 1.9375, drago: 2.1875, 'bestia-cornuta': 1.625, negromante: 1.625, 'troll-clava': 1.625, 'drago-lava': 1.625,
}

// i grossi (dati/grossi.js): grandi fino a 1,9 eroi in alto e 3 in largo (docs/sotterraneo/grossi.md, «Come si vede»)
export const ALTO_DEL_GROSSO = {
  ossuto: 3.25, grumo: 3.234375, fiammetta: 3.125, zannaverde: 2.671875, gorgo: 3, minotto: 2.84375, carbonchio: 2.4375,
  barbamuschio: 2.84375, piumanera: 2.90625, sibilla: 3.09375, brontolava: 3, brinaldo: 3, falcenera: 3.09375,
}

// la grandezza della specie rispetto all'eroe (di difetto 1): misura i chiarori per terra e la macchia d'ombra sotto (scena3d/cose.js)
export const GRANDEZZA_DELLA_SPECIE = {
  scheletro: 1.5, ratto: 0.75, melma: 1.25, fantasma: 1.25, vespa: 0.75, fungo: 0.75, granchio: 0.75, serpente: 0.75, golem: 1.25,
  zombie: 1.25, diavoletto: 0.75, 'golem-magma': 1.25, ragno: 0.75, 'mostro-verde': 1.25, piranha: 0.75, polpo: 0.75, tartaruga: 0.75,
  cinghiale: 0.75, ent: 1.5, 'golem-muschio': 1.25, scorpione: 0.75, 'spirito-elettrico': 0.75, 'golem-lava': 1.25, 'mostro-viola': 1.25,
  'pipistrello-occhio': 0.75, 'golem-ghiaccio': 1.25, 'teschio-azzurro': 0.75, mummia: 1.25, mietitore: 1.5, draghetto: 0.75, occhio: 0.75,
  'golem-pietra': 1.25,
}
export const GRANDEZZA_DEL_GROSSO = {
  ossuto: 2, grumo: 2.25, fiammetta: 2, zannaverde: 2.25, gorgo: 2, minotto: 1.75, carbonchio: 1.5, barbamuschio: 1.75, piumanera: 1.5,
  sibilla: 2.25, brontolava: 2, brinaldo: 2, falcenera: 2.25,
}

// i quattro eroi: tutti uguali
export const ALTO_DELL_EROE = 1.75

// le persone di sopra, per modello (dati/persone3d.js), prima della loro scala (scena3d/mondo/persone.js, SCALA_PERSONE, o la sua):
// il capitano è alto quanto la guardia, cacciatrice e carovaniere (ancora senza un posto nel mondo) quanto un passante
export const ALTO_DELLA_PERSONA = {
  armaiolo: 0.9375, incantatrice: 0.9375, erborista: 0.9375, rigattiere: 1, minatore: 0.9375, capitano: 1.125, ragazza: 1.0625,
  eremita: 1, guardia: 1.125, boscaiolo: 1.125, pescatore: 1, mugnaio: 0.9375, cacciatrice: 1, carovaniere: 1,
}
