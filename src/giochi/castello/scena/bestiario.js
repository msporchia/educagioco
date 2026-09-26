/* ═══════════════════════════════════════════════════════════════════
   IL BESTIARIO — quale creatura fa le veci di quale mostro, vestito
   per vestito

   Per il gioco un mostro è quanto resiste, se vola, a quali torri è
   immune e cosa fa quando cade (`data/mostri.js`). La figura non ci entra, e quindi può
   cambiare da un vestito all'altro senza toccare niente dell'equilibrio:
   nel bosco lo slime è una melma verde, nella lava un sasso di magma
   con le corna di fuoco, nella neve una melma rosa. È la varietà che i
   due fogli del sotterraneo permettono gratis — hanno cinquantaquattro
   creature — e le chiavi dei mostri restano quelle delle immunità e
   della taratura.

   Tre regole per scegliere, in quest'ordine:
     · **chi vola prende una figura che vola** (`vola: true`): l'ombra
       staccata da terra lo dice comunque, e una bestia a quattro zampe
       sospesa per aria è un guasto, non un mostro;
     · **l'immunità si legge a occhio, dove si può**: corazzato, duro
       o coperto (scudo, carapace, pelliccia) regge le frecce; pietra,
       fuoco vivo o spirito regge la magia; molle, d'ossa o d'aria regge
       le bombe. Dove non si può, almeno non dice il contrario.
       Le scelte qui sotto sono di quando ogni mostro resisteva a una
       torre sola: con le immunità qualcuna dice il contrario (lo
       spirito di fuoco fa il fantasma, che solo la magia tocca; lo
       scudo del balestriere della neve non ferma le frecce), e si
       sistemano quando si ritocca il bestiario;
     · **il bosco è la tabella di `strumenti/sprite/DA-GENERARE.md`**, che
       viene prima di questo file e dice anche in che foglio sta ognuna.

   Il nome che il bambino legge — sul nastro di chi arriva e sulla scheda
   del mostro in campo — è quello della figura (`NOMI`): «arriva il
   grifone» con un grifone a schermo. La chiave resta quella del gioco.

   Le figure le ritaglia `strumenti/sprite/vesti.py --atlante` in
   `dati/figure.js`, e porta **solo quelle nominate qui** (le coordinate
   delle nuove stanno in `strumenti/sprite/creature-castello.json`):
   `unita/castello-bestiario` pretende che i due elenchi coincidano, che
   ogni mostro abbia la sua figura in ogni vestito e che chi vola voli.
   ═══════════════════════════════════════════════════════════════════ */

/* le creature che volano: le tiene qui chi sceglie, perché il foglio non
   lo dice e il gioco lo chiede */
export const VOLANO = ['pipistrello', 'pipistrello-occhio', 'occhio', 'fantasma', 'fantasma-azzurro',
  'spirito-fuoco', 'teschio-azzurro', 'grifone', 'drago', 'draghetto', 'tornado']

export const BESTIARIO = {
  bosco: {
    slime: 'melma', goblin: 'scheletro-scudo', pipistrello: 'pipistrello', fantasma: 'fantasma',
    ragno: 'ragno', orco: 'zombie', scheletro: 'scheletro', golem: 'golem', arpia: 'grifone',
    drago: 'drago', lupo: 'lupo', corvo: 'pipistrello-occhio', rovo: 'pianta', verme: 'serpente',
    blatta: 'scorpione', troll: 'troll', corazziere: 'tartaruga', balestriere: 'diavoletto',
  },
  /* il fuoco: magma, lava, corna, fiamme. Il drago resta quello rosso,
     che è già di fuoco */
  lava: {
    slime: 'golem-magma',        // un sasso di magma senza forma: l'incantesimo ci scivola
    goblin: 'diavoletto',
    pipistrello: 'occhio',       // l'occhio volante, rosso come il posto
    fantasma: 'spirito-fuoco',   // fuoco vivo: la magia gli passa attraverso
    ragno: 'granchio',           // carapace: le frecce rimbalzano
    orco: 'bestia-cornuta',      // cuoio e corna
    scheletro: 'negromante',     // ossa sotto la tonaca
    golem: 'golem-lava',
    arpia: 'draghetto',
    drago: 'drago',
    lupo: 'drago-lava',          // scaglie
    corvo: 'pipistrello',
    rovo: 'ombra',               // molle: lo scoppio ci affonda
    verme: 'melma-viola',
    blatta: 'scorpione',
    troll: 'mostro-viola',
    corazziere: 'tartaruga',     // le spine arancio sulla corazza
    balestriere: 'scheletro',
  },
  /* il freddo: ghiaccio, vento, cose pallide e cose col pelo */
  neve: {
    slime: 'melma-rosa',
    goblin: 'mummia',            // le bende: la freccia si pianta e basta
    pipistrello: 'pipistrello-occhio',
    fantasma: 'fantasma-azzurro',
    ragno: 'cinghiale',          // pelliccia e setole
    orco: 'golem-pietra',        // pietra: le frecce rimbalzano
    scheletro: 'teschio-azzurro', // ossa e basta, e il fuoco freddo
    golem: 'golem-ghiaccio',
    arpia: 'tornado',            // vento: la bomba gli scoppia sotto
    drago: 'drago',
    lupo: 'lupo',
    corvo: 'pipistrello',
    rovo: 'ent',                 // un groviglio di rami che si richiude
    verme: 'serpente',
    blatta: 'spirito-elettrico', // non ha una mente da incantare
    troll: 'troll',
    corazziere: 'tartaruga',
    balestriere: 'scheletro-scudo', // il pavese è lo scudo
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
