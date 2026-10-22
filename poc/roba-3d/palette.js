// La roba in 3D, una figura del catalogo alla volta: i colori comuni a tutte le famiglie (armi, scudi, vesti, amuleti), così il «legno» o il
// «cristallo» di una spada e di uno scudo sono gli stessi. Le figure del catalogo (strumenti/sprite/sorgenti/sotterraneo/generati/roba.json:
// 238 voci con `cosa`, `descrizione`, `elemento`, `materia`, `stile`, `mani`, `pregio` 1..4, `nome`) dicono COSA modellare; questa dice DI CHE
// materia e con che luce. Dato puro, niente three.
export const MATERIE = {
  acciaio:  { chiaro: 0xeaf0f6, medio: 0xc3ccd6, scuro: 0x8791a0, ombra: 0x56606e, metallo: true },
  ferro:    { chiaro: 0xa3a9b0, medio: 0x7c828a, scuro: 0x555a62, ombra: 0x383c42, metallo: true },
  oro:      { chiaro: 0xffe58a, medio: 0xf4c542, scuro: 0xc8922a, ombra: 0x8a5e18, metallo: true },
  legno:    { chiaro: 0xc9955a, medio: 0x9a6a36, scuro: 0x6e4a26, ombra: 0x4a3018, metallo: false },
  cuoio:    { chiaro: 0xa8693f, medio: 0x7a4a2a, scuro: 0x4f2f1c, ombra: 0x33200f, metallo: false },
  stoffa:   { chiaro: 0xe9dcc3, medio: 0xbfa98a, scuro: 0x8a7658, ombra: 0x5b4c38, metallo: false },
  osso:     { chiaro: 0xf4ead2, medio: 0xe0d3b4, scuro: 0xb8a784, ombra: 0x7c6d52, metallo: false },
  cristallo:{ chiaro: 0xe8fbff, medio: 0x9fe0f2, scuro: 0x58b4d0, ombra: 0x2f7a96, metallo: false, luminoso: true },
}
// la luce dell'elemento: `colore` il corpo del bagliore, `colore2` il nucleo più chiaro, `ombra` il bordo scuro; `gemma` il colore di una gemma di quel tipo
export const ELEMENTI = {
  nessuno: { colore: 0xffffff, colore2: 0xffffff, ombra: 0x888888, gemma: 0x8fa3b8, emissivo: 0 },
  fuoco:   { colore: 0xff7a2a, colore2: 0xffd45a, ombra: 0x9a2410, gemma: 0xe8402a, emissivo: 1 },
  ghiaccio:{ colore: 0x58b4e6, colore2: 0xe6f8ff, ombra: 0x2a6ea0, gemma: 0x7fd4ff, emissivo: 0.9 },
  fulmine: { colore: 0xb98af0, colore2: 0xfff6a8, ombra: 0x5a3a9a, gemma: 0xd8b8ff, emissivo: 1 },
  veleno:  { colore: 0x7cc94a, colore2: 0xd6ff9a, ombra: 0x3a6a1a, gemma: 0x8ae04a, emissivo: 0.8 },
  luce:    { colore: 0xffe08a, colore2: 0xffffff, ombra: 0xc8922a, gemma: 0xfff0a0, emissivo: 1 },
  ombra:   { colore: 0x6a3a9a, colore2: 0xd08aff, ombra: 0x24103a, gemma: 0x3a1a5a, emissivo: 0.7 },
  arcano:  { colore: 0xc07cff, colore2: 0xffd8ff, ombra: 0x6a30a8, gemma: 0xb060f0, emissivo: 1 },
  natura:  { colore: 0x58c860, colore2: 0xd8ffb0, ombra: 0x2a6a30, gemma: 0x58d870, emissivo: 0.7 },
  acqua:   { colore: 0x3aa8d8, colore2: 0xc8f4ff, ombra: 0x1a5a88, gemma: 0x3ab0e0, emissivo: 0.7 },
  oro:     { colore: 0xffc83a, colore2: 0xfff2b0, ombra: 0xa87a18, gemma: 0xffd84a, emissivo: 0.8 },
  sangue:  { colore: 0xc8202a, colore2: 0xff8a8a, ombra: 0x5a0a10, gemma: 0xd01a2a, emissivo: 0.8 },
  morte:   { colore: 0x7aff9a, colore2: 0xe0ffe8, ombra: 0x1a4a2a, gemma: 0x58e090, emissivo: 0.8 },
}
// quanta cura mette il pregio (1 comune … 4 leggendario): gemme, bordi d'oro, rune, bagliore (ogni agente lo declina per la sua famiglia)
export const PREGIO = { 1: { ornamenti: 0, bagliore: 0 }, 2: { ornamenti: 1, bagliore: 0.35 }, 3: { ornamenti: 2, bagliore: 0.7 }, 4: { ornamenti: 3, bagliore: 1 } }
