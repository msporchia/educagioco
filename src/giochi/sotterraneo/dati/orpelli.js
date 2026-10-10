// Gli orpelli: l'arredo che non fa niente, uno scenario una lista (docs/sotterraneo/arredo.md). Dato puro.
// Ogni pezzo sa da sé come si piazza (`posa`) e quanto è epico (`epica`, da 1 a 10): sarcofago e panca
// sono roba di tutti i giorni, un trono sta solo dove c'è un re. Il piano decide quanto è epica una stanza
// (livello.js, epicaDellaStanza) e pesca fra quelli che le stanno bene. La lista può crescere quanto vuole:
// un pezzo in più è una riga qui e il suo ritaglio nell'atlante, il motore non cambia.
//
// posa: 'appeso' sulla fila in alto contro la parete di faccia · 'posato' sul bordo della stanza · 'angolo' in
//   uno dei quattro angoli · 'fondo' al centro della parete di fondo (uno solo per stanza) · 'coppia' due uguali
//   ai lati della parete di fondo, uno di qua e uno di là.
// arde: fa luce (uno solo acceso per stanza, o due cantine illuminerebbero tutto).
// pezzo: il nome nell'atlante · dice: cosa risponde a chi lo tocca.

export const POSE = ['appeso', 'posato', 'angolo', 'fondo', 'coppia']

const o = (pezzo, posa, epica, dice, arde = false) => ({ pezzo, posa, epica, dice, ...(arde ? { arde } : {}) })

export const ORPELLI = {
  // il generico di prima: quello di tutti, anche di chi non dichiara il suo scenario
  cantine: [
    o('barile', 'posato', 1, 'Un barile vuoto.'),
    o('cassa', 'posato', 1, 'Una cassa sfondata: dentro non c\'è più niente.'),
    o('ossa', 'posato', 1, 'Vecchie ossa. Meglio non chiedersi di chi.'),
    o('teschio-scena', 'posato', 2, 'Un teschio. Ti guarda male e basta.'),
    o('lanterna', 'posato', 1, 'Una lanterna appesa. La luce ce l\'hai già.', true),
    o('stendardo', 'appeso', 2, 'Uno stendardo scolorito, di nessuno.'),
    o('candelabro', 'appeso', 2, 'Un candelabro con tre candele storte.'),
  ],

  // arredo-cripta-2.png: tutto pietra e ferro, niente ossa né teschi né drappi
  cripta: [
    o('cripta-sarcofago-liscio', 'posato', 2, 'Un sarcofago di pietra, chiuso. Meglio non aprirlo.'),
    o('cripta-sarcofago-spada', 'posato', 3, 'Un sarcofago con una spada incisa sul coperchio.'),
    o('cripta-sarcofago-stemma', 'posato', 3, 'Un sarcofago con uno stemma: apparteneva a qualcuno che contava.'),
    o('cripta-sarcofago-croce', 'posato', 3, 'Un sarcofago con una croce. Dorme in pace, o ci prova.'),
    o('cripta-sarcofago-crepato', 'posato', 2, 'Un sarcofago crepato. Dentro non si vede niente.'),
    o('cripta-sarcofago-aperto', 'posato', 4, 'Un sarcofago aperto. Vuoto, per fortuna.'),
    o('cripta-cavaliere-spada', 'coppia', 5, 'Un cavaliere di pietra. Ti guarda male e basta.'),
    o('cripta-cavaliere-scudo', 'coppia', 5, 'Un cavaliere di pietra con lo scudo, di guardia da secoli.'),
    o('cripta-cavaliere-inginocchiato', 'angolo', 4, 'Un cavaliere di pietra inginocchiato sulla spada.'),
    o('cripta-cavaliere-seduto', 'posato', 5, 'Un cavaliere di pietra seduto, stanco di aspettare.'),
    o('cripta-cavaliere-mani', 'angolo', 4, 'Un cavaliere di pietra con le mani giunte.'),
    o('cripta-cavaliere-caduto', 'posato', 3, 'Un cavaliere di pietra, caduto da tanto.'),
    o('cripta-colonna', 'angolo', 3, 'Una colonna di pietra. Regge ancora.'),
    o('cripta-colonna-spezzata', 'angolo', 2, 'Una colonna spezzata in alto.'),
    o('cripta-colonna-moncone', 'posato', 1, 'Il moncone di una colonna.'),
    o('cripta-colonna-inclinata', 'posato', 2, 'Una colonna inclinata: meglio non appoggiarsi.'),
    o('cripta-colonna-doppia', 'angolo', 4, 'Due colonne gemelle, strette come fratelli.'),
    o('cripta-base', 'posato', 1, 'Una base di pietra, senza più niente sopra.'),
    o('cripta-candelabro-1', 'posato', 1, 'Un candelabro di ferro, acceso. La luce ce l\'hai già.', true),
    o('cripta-candelabro-5bracci', 'coppia', 4, 'Un grande candelabro a cinque bracci, tutti accesi.', true),
    o('cripta-candelabro-3', 'posato', 2, 'Un candelabro di ferro a tre fiamme.', true),
    o('cripta-candelabro-alto', 'posato', 2, 'Un candelabro di ferro, acceso. La luce ce l\'hai già.', true),
    o('cripta-candelabro-tre', 'coppia', 3, 'Un candelabro di ferro, acceso.', true),
    o('cripta-candelabro-singolo', 'posato', 1, 'Una sola fiamma, in cima a un lungo gambo di ferro.', true),
    o('cripta-altare', 'fondo', 4, 'Un altare di pietra, spoglio.'),
    o('cripta-leggio', 'posato', 2, 'Un leggio con un libro chiuso. Meglio lasciarlo chiuso.'),
    o('cripta-fonte', 'posato', 2, 'Un fonte di pietra, asciutto da secoli.'),
    o('cripta-nicchia-lampada', 'appeso', 1, 'Una nicchia con una lampada spenta.'),
    o('cripta-tavolo', 'posato', 2, 'Un tavolo di pietra. Nessuno ci mangia da un pezzo.'),
    o('cripta-panca', 'posato', 1, 'Una panca di pietra, fredda.'),
    o('cripta-arco-murato', 'appeso', 2, 'Un arco murato: di là non si passa.'),
    o('cripta-blocchi-caduti', 'posato', 1, 'Blocchi di pietra caduti dal soffitto.'),
    o('cripta-lastra-funeraria', 'posato', 3, 'Una lastra funeraria in piedi. Il nome è consumato.'),
    o('cripta-pilastro-grata', 'angolo', 3, 'Un pilastro con una grata di ferro.'),
    o('cripta-braciere', 'posato', 4, 'Un braciere spento. Cenere vecchia.'),
    o('cripta-trono', 'fondo', 8, 'Un trono di pietra. Chi ci sedeva, comandava.'),
    o('cripta-cancello', 'fondo', 4, 'Un cancello di ferro, chiuso da prima che nascessi.'),
    o('cripta-campana', 'fondo', 5, 'Una grande campana, muta.'),
    o('cripta-scudo-cavalletto', 'posato', 3, 'Uno scudo su un cavalletto, con lo stemma consumato.'),
    o('cripta-rastrelliera', 'posato', 2, 'Una rastrelliera di lance: vuota.'),
    o('cripta-muro-cavaliere', 'appeso', 2, 'Un cavaliere scolpito nel muro, consumato.'),
    o('cripta-muro-nicchia', 'appeso', 1, 'Una nicchia ad arco, vuota.'),
    o('cripta-muro-edera', 'appeso', 1, 'Edera secca sul muro.'),
    o('cripta-muro-stemma', 'appeso', 3, 'Uno stemma di pietra con un leone.'),
    o('cripta-muro-rosone', 'appeso', 5, 'Un rosone di pietra scolpita.'),
    o('cripta-muro-grata', 'appeso', 2, 'Una grata nel muro. Di là, buio.'),
  ],

  // sotterraneo_5_3.png: la fornace
  fornace: [
    o('fornace-botte', 'posato', 1, 'Una botte di ferro, vuota.'),
    o('fornace-carbone', 'posato', 1, 'Carbone. Nero, e non scalda più.'),
    o('fornace-incudine', 'posato', 2, 'Un\'incudine: troppo pesante per spostarla.'),
    o('fornace-gargoyle-0', 'posato', 3, 'Un gargoyle di pietra. Ti guarda male e basta.'),
    o('fornace-calderone', 'posato', 2, 'Un calderone sulle braci. Scalda, e fa luce.', true),
    o('fornace-rastrelliera', 'appeso', 2, 'Catene appese, di nessuno.'),
    o('fornace-banco', 'posato', 2, 'Un banco da fabbro, con gli attrezzi.'),
  ],
}
