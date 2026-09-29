// Il bestiario: quale creatura fa le veci di quale mostro, vestito per
// vestito (bosco/lava/neve/palude). La figura non tocca l'equilibrio
// (`data/mostri.js` resta la fonte di immunità e abilità): sceglie chi vola
// (`vola: true`), poi la figura giusta per il vocabolario di immunità (vedi
// docs/castello/mostri.md), a parità di figura le stesse immunità in ogni
// vestito. Il nome letto a schermo è quello della figura (`NOMI`).
export const VOLANO = ['pipistrello', 'pipistrello-occhio', 'occhio', 'fantasma', 'fantasma-azzurro',
  'spirito-fuoco', 'teschio-azzurro', 'grifone', 'drago', 'draghetto', 'tornado']

export const BESTIARIO = {
  bosco: {
    slime: 'melma',
    goblin: 'scorpione',         // un comune: nessuna immunità
    pipistrello: 'pipistrello', fantasma: 'fantasma', ragno: 'ragno', orco: 'zombie',
    scheletro: 'scheletro', golem: 'golem', arpia: 'grifone', drago: 'drago', lupo: 'lupo',
    corvo: 'pipistrello-occhio', rovo: 'pianta',
    verme: 'ombra',              // molle, e tagliata fa due ombre
    blatta: 'draghetto',         // un drago: niente bombe, niente magia, come il drago
    troll: 'troll',
    corazziere: 'scheletro-scudo', // lo scudo per le frecce, la testa vuota per la magia
    balestriere: 'serpente',     // un comune
  },
  lava: {
    slime: 'melma-viola',        // una melma, come nel bosco
    goblin: 'diavoletto',        // un comune
    pipistrello: 'occhio',       // l'occhio volante, rosso come il posto
    fantasma: 'fantasma',        // trasparente: le frecce gli passano attraverso
    ragno: 'granchio',           // un comune
    orco: 'bestia-cornuta',      // un comune
    scheletro: 'negromante',     // ossa sotto la tonaca
    golem: 'golem-lava',
    arpia: 'pipistrello-occhio',
    drago: 'drago',
    lupo: 'lupo',
    corvo: 'pipistrello',
    rovo: 'pianta',
    verme: 'ombra',
    blatta: 'draghetto',
    troll: 'golem-magma',        // sasso e fuoco: né frecce né magia
    corazziere: 'spirito-fuoco', // la freccia lo attraversa, la magia no, lo scoppio lo spegne
    balestriere: 'mostro-viola', // un comune, molle e buio come l'ombra
  },
  neve: {
    slime: 'melma-rosa',
    goblin: 'mummia',            // un comune
    pipistrello: 'pipistrello-occhio',
    fantasma: 'fantasma-azzurro',
    ragno: 'scorpione',          // un comune, come il goblin del bosco
    orco: 'cinghiale',           // un comune
    scheletro: 'teschio-azzurro', // ossa e basta, e il fuoco freddo
    golem: 'golem-ghiaccio',
    arpia: 'tornado',            // vento: la bomba gli scoppia sotto
    drago: 'drago',
    lupo: 'spirito-elettrico',   // un comune, svelto come il lupo
    corvo: 'pipistrello',
    rovo: 'ent',                 // un groviglio di rami che si richiude
    verme: 'ombra',
    blatta: 'drago-lava',        // un drago, senza ali
    troll: 'golem-pietra',       // pietra
    corazziere: 'tartaruga',
    balestriere: 'serpente',
  },
  palude: {
    slime: 'melma',
    goblin: 'granchio',          // un comune, dal fango
    pipistrello: 'pipistrello',
    fantasma: 'fantasma-azzurro', // il fuoco fatuo
    ragno: 'ragno',
    orco: 'zombie',
    scheletro: 'scheletro',
    golem: 'golem-pietra',       // pietra col muschio
    arpia: 'grifone',
    drago: 'drago',
    lupo: 'lupo',
    corvo: 'pipistrello-occhio',
    rovo: 'pianta',
    verme: 'ombra',
    blatta: 'draghetto',
    troll: 'troll',
    corazziere: 'tartaruga',
    balestriere: 'serpente',
  },
}

/* il nome da leggere, per figura */
export const NOMI = {
  'melma': 'Melma', 'scheletro-scudo': 'Scheletro con lo scudo', 'pipistrello': 'Pipistrello',
  'fantasma': 'Fantasma', 'ragno': 'Ragno', 'zombie': 'Zombie', 'scheletro': 'Scheletro',
  'golem': 'Golem', 'grifone': 'Grifone', 'drago': 'Drago', 'lupo': 'Lupo',
  'pipistrello-occhio': 'Occhio alato', 'pianta': 'Pianta carnivora', 'serpente': 'Serpente',
  'scorpione': 'Scorpione', 'troll': 'Troll', 'tartaruga': 'Tartaruga', 'diavoletto': 'Diavoletto',
  'golem-magma': 'Golem di magma', 'occhio': 'Occhio volante', 'spirito-fuoco': 'Spirito di fuoco',
  'granchio': 'Granchio', 'bestia-cornuta': 'Bestia cornuta', 'negromante': 'Negromante',
  'golem-lava': 'Golem di lava', 'draghetto': 'Draghetto', 'drago-lava': 'Drago di lava',
  'ombra': 'Ombra', 'melma-viola': 'Melma viola', 'mostro-viola': 'Mostro viola',
  'melma-rosa': 'Melma rosa', 'mummia': 'Mummia', 'fantasma-azzurro': 'Fantasma azzurro',
  'cinghiale': 'Cinghiale', 'golem-pietra': 'Golem di pietra', 'teschio-azzurro': 'Teschio blu',
  'golem-ghiaccio': 'Golem di ghiaccio', 'tornado': 'Tornado', 'ent': 'Uomo albero',
  'spirito-elettrico': 'Spirito del fulmine',
}

/* la figura di un mostro in un vestito; un vestito che non c'è prende
   il bosco, un mostro che non c'è la melma — meglio una melma di un buco */
export const figuraDi = (vestito, bestia) =>
  (BESTIARIO[vestito] || BESTIARIO.bosco)[bestia] || BESTIARIO.bosco[bestia] || 'melma'

/* tutte le figure nominate, una volta sola */
export const FIGURE_NOMINATE = [...new Set(Object.values(BESTIARIO).flatMap(Object.values))].sort()
