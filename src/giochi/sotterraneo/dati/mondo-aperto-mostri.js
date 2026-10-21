// Chi vive nel mondo di sopra e quanto è forte (docs/sotterraneo/mondo-aperto-mostri.md). Dato puro: lo legge motore/aperta.js. I
// luoghi del mondo a percorso tengono le chiavi delle regioni di prima: i sei che vengono dalle terre selvagge hanno i loro abitanti
// nella scheda (dati/mondo-aperto.js, LUOGHI, `abitanti` e `caporale`); qui gli altri diciotto, con le specie che il gioco ha già (dati/mostri.js): una specie può stare in più regioni, sopra. Dove l'habitat
// vorrebbe una creatura che non c'è, `dipingere` dice quale (il foglio delle creature d'aperta campagna, da fare).
// I numeri di SOPRA sono una proposta da misurare col banco (`npm run sotterraneo -- --mondo`), non da credere.

// `mostri`: da due a quattro creature di strada (mai un capo); `caporale`: chi sta nella tana col signore, e non anche per strada
export const ABITANTI_DI_SOPRA = {
  // i luoghi delle prime due zone (i prati, il bosco): specie piccole (attacco 2–4)
  cimitero: { mostri: ['scheletro', 'zombie', 'fantasma'], caporale: 'scheletro-scudo' },
  campi: { mostri: ['ratto', 'goblin', 'vespa'], caporale: 'cinghiale', dipingere: 'lo spaventapasseri vivo, il corvo' },
  colle: { mostri: ['goblin', 'ratto', 'melma'], caporale: 'orco' },
  brughiera: { mostri: ['pipistrello', 'vespa', 'serpente'], caporale: 'lupo', dipingere: 'la lepre, il falco' },
  frutteto: { mostri: ['vespa', 'ratto', 'melma-rosa'], caporale: 'cinghiale', dipingere: 'il ghiro, lo sciame' },
  mulino: { mostri: ['lupo', 'ratto', 'goblin'], caporale: 'orco' },
  bosco: { mostri: ['ragno', 'fungo', 'lupo'], caporale: 'mostro-verde', dipingere: 'l\'orso, il cinghiale col pelo lungo' },
  lago: { mostri: ['granchio', 'serpente', 'melma'], caporale: 'tartaruga', dipingere: 'il rospo, l\'airone' },
  // i luoghi delle zone dopo
  passo: { mostri: ['lupo', 'pipistrello', 'golem-pietra'], caporale: 'troll-clava', dipingere: 'la capra di montagna, lo yeti' },
  monte: { mostri: ['golem-pietra', 'golem', 'spirito-elettrico'], caporale: 'golem-ghiaccio' },
  corvi: { mostri: ['grifone', 'pipistrello-occhio', 'occhio'], caporale: 'drago', dipingere: 'il corvo, lo stormo' },
  foresta: { mostri: ['ragno', 'lupo', 'ombra'], caporale: 'ent', dipingere: 'l\'orso nero, il gufo' },
  ossa: { mostri: ['scheletro', 'ghoul', 'teschio-azzurro'], caporale: 'mietitore' },
  landa: { mostri: ['mummia', 'ombra', 'teschio-azzurro'], caporale: 'negromante', dipingere: 'l\'avvoltoio' },
  guado: { mostri: ['granchio', 'cinghiale', 'lupo'], caporale: 'tartaruga', dipingere: 'il brigante' },
  palude: { mostri: ['melma', 'serpente', 'fungo'], caporale: 'mostro-verde', dipingere: 'il coccodrillo, la sanguisuga' },
  ceneri: { mostri: ['diavoletto', 'spirito-fuoco', 'bestia-cornuta'], caporale: 'golem-magma' },
  lupi: { mostri: ['lupo', 'cinghiale', 'ragno'], caporale: 'troll-clava', dipingere: 'il lupo capobranco (oggi il troll fa da caporale)' },
}

// Quanto sono forti i mostri di sopra al livello L: `forza` moltiplica le ossa, `spinta` aggiunge all'attacco, `branco` è quanti al più
// in un branco. Sono le discese della storia messe al loro livello atteso (LIVELLI_ATTESI). Fra due punti in linea retta; dal 12 la curva
// delle zone (dati/zone.js, CURVA_DELLE_ZONE), scritta fino al 15 dove finisce la prima terra; oltre, le terre dopo (+14 a terra, fino
// al 71) la seguono da sola (motore/aperta.js, crescitaDiSopra). La cripta non ha spinta (si comincia a mani nude)
export const CURVA_DI_SOPRA = [
  { livello: 1, forza: 0.25, spinta: 0, branco: 2, gradi: 0 },
  { livello: 2, forza: 0.5, spinta: 2, branco: 3 },
  { livello: 3, forza: 0.5, spinta: 4, branco: 3 },
  { livello: 5, forza: 0.8, spinta: 6.5, branco: 4 },
  { livello: 7, forza: 1.1, spinta: 7.7, branco: 4 },
  { livello: 8, forza: 1.25, spinta: 8.7, branco: 5 },
  { livello: 10, forza: 1.8, spinta: 9.5, branco: 6 },
  { livello: 12, forza: 2.2, spinta: 9.5, branco: 6 },
  { livello: 13, forza: 2.35, spinta: 10.8, branco: 6 },
  { livello: 15, forza: 2.65, spinta: 13.4, branco: 6 },
]

// Le regole di sopra, tutte in un posto (docs/sotterraneo/mondo-aperto-mostri.md, «Le tarature»). Le distanze sono in celle
export const SOPRA = {
  // dove i mostri non stanno mai: attorno al villaggio, lungo la strada fino alla cripta e alla pietra dei prati (perché un bambino
  // piccolo non trovi un branco sulla strada del primo dungeon). La scrive il generatore (`m.cintura`, 12 celle): qui per i test
  cintura: 12,
  // né a meno di tante celle da un ponte o da un varco: passare un confine è mettersi in salvo
  daConfine: 4,
  // dove non nasce un branco (ma inseguendo ci passa): accanto a una strada, a un ingresso, a una pietra, a chi sta fermo
  daStrada: 2,
  daiPosti: 4,
  // quanti branchi: uno ogni tante celle d'erba dove può nascere, per zona (i prati, il bosco, la brughiera, la palude, le ceneri, il
  // monte, la landa: la leva del numero dei mostri), e almeno così lontani fra loro e dalla tana
  cellePerBranco: [110, 110, 110, 110, 110, 110, 110],
  fraBranchi: 14,
  dallaTana: 12,
  // svegliarsi, inseguire, toccare: come nelle terre selvagge (SVEGLIA di dati/mondo.js è 7; oltre INSEGUE si torna a casa)
  sveglia: 7,
  insegue: 11,
  contatto: 0.9,         // a questa distanza un mostro sveglio apre lo scontro
  tocco: 1.6,            // fin dove arriva il tocco dell'eroe su un mostro
  dentro: 6,             // o dentro o fuori: ogni vivo entro tante celle dall'eroe o da chi apre entra nello scontro (fino al massimo)
  aUnPasso: 2.5,         // chi è già sveglio e così vicino entra nello scontro anche se è di un altro branco
  passoMostro: 3.1,      // celle al secondo (PASSO_MOSTRO), più lento dell'eroe (PASSO_MONDO 4,5)
  passoRientro: 2.2,
  calma: 3,              // secondi in cui chi resta dopo una fuga non si risveglia (CALMA)
  // i morti tornano a passi, mai a ore: da una a due volte questa base (nei dungeon 200: sopra si cammina di più)
  ricomparsa: 400,
  // il signore di un luogo: il caporale con la corona, più ossa di un caporale, un raro della fascia di sicuro. `livello`: quanti sopra
  // l'inizio della fascia del luogo. Le guardie (caporali come lui) per zona: nei prati e nel bosco al più una, perché chi segue la storia
  // ci arriva al livello del dungeon che c'è (provato: in cima alla fascia e con una o due guardie il curioso che passa dalla tana sveniva
  // quattro volte su cinque fino alla torre)
  signore: { ossa: 2, att: 1, livello: 0 },
  guardieDelSignore: [[0, 1], [0, 1], [1, 2], [1, 2], [1, 2], [1, 2], [1, 2]],
  // la luce di sopra: si vedono i mostri entro questo raggio (RAGGIO_APERTO delle terre selvagge); un morto non torna sotto gli occhi
  vista: 9.5,
}
