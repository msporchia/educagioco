/* ═══════════════════════════════════════════════════════════════════
   IL BESTIARIO — quale creatura fa le veci di quale mostro, vestito
   per vestito

   Per il gioco un mostro è quanto resiste, se vola, a quali torri è
   immune e cosa fa quando cade (`data/mostri.js`). La figura non ci entra, e quindi può
   cambiare da un vestito all'altro senza toccare niente dell'equilibrio:
   nel bosco lo slime è una melma verde, nella lava una melma viola,
   nella neve una melma rosa. È la varietà che i
   due fogli del sotterraneo permettono gratis — hanno cinquantaquattro
   creature — e le chiavi dei mostri restano quelle delle immunità e
   della taratura.

   Quattro regole per scegliere, in quest'ordine:
     · **chi vola prende una figura che vola** (`vola: true`): l'ombra
       staccata da terra lo dice comunque, e una bestia a quattro zampe
       sospesa per aria è un guasto, non un mostro;
     · **la figura dice a quale torre è immune**, ed è la cosa che conta:
       al bambino non serve sapere chi è il mostro, serve capire che
       torre mettergli davanti. Il vocabolario è corto, e vale in tutti
       e tre i vestiti:
         🪽 ali o volo            → niente bombe, tutti; e chi ha le ali
                                    di un animale (pipistrelli, grifone,
                                    tornado, l'occhio) passa sopra anche
                                    il gelo
         👻 trasparente           → niente frecce: i fantasmi
         🐉 drago                 → niente bombe e niente magia: il drago,
                                    il draghetto, il drago di lava
         🪨 pietra, guscio        → niente frecce e niente magia: i golem,
                                    il troll, la tartaruga, lo scheletro
                                    con lo scudo
         🔥 fuoco vivo            → niente magia, e niente frecce: il
                                    golem di magma e quello di lava sono
                                    sasso, lo spirito di fuoco è una
                                    fiamma che la freccia attraversa. Lo
                                    apre lo scoppio, che lo spegne
         🦂 carapace, setole,     → niente frecce: scorpione, granchio,
            bende, cuoio            ragno, cinghiale, mummia, zombie,
                                    bestia cornuta; e il diavoletto, che
                                    è troppo piccolo e svelto
         🫧 gelatina              → niente magia: le melme, che non hanno
                                    una mente su cui fare presa
         💀 ossa                  → niente magia e niente gelo: testa
                                    vuota e niente sangue (scheletro,
                                    negromante, teschio)
         🌑 molle, senza forma    → niente bombe: l'ombra e il mostro
                                    viola, dove lo scoppio affonda; il
                                    serpente, che sta rasoterra
         🌿 un groviglio          → niente bombe e niente frecce: la
                                    pianta carnivora, l'uomo albero
         🐺 pelliccia, e svelto   → niente gelo e niente frecce: il lupo,
                                    e lo spirito del fulmine
       Chi si divide è una cosa molle che si può tagliare — la melma,
       l'ombra — e non un serpente;
     · **a figura uguale, immunità uguali**: una figura che fa due mostri
       in due vestiti li fa con lo stesso profilo, così quello che il
       bambino ha imparato nel bosco vale anche nella lava. Lo controlla
       `unita/castello-bestiario`, insieme al volo.
     · **il bosco è la tabella di `strumenti/sprite/DA-GENERARE.md`**, che
       viene prima di questo file e dice anche in che foglio sta ognuna.

   Era stato scelto quando ogni mostro resisteva a una torre sola, e con
   le immunità quattro figure dicevano il contrario del loro mostro: lo
   spirito di fuoco faceva il fantasma (che solo la magia tocca); lo
   scheletro con lo scudo faceva il goblin nel bosco (lo scudo: niente
   frecce) e il balestriere nella neve (immune solo alle bombe); le
   figure d'ossa stavano fra quelle che reggono lo scoppio, mentre lo
   scheletro regge magia e gelo; e il verme che si divide era un
   serpente. Rifatta coi profili a due immunità al massimo.

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
    slime: 'melma',
    goblin: 'scorpione',         // il carapace: la freccia rimbalza
    pipistrello: 'pipistrello', fantasma: 'fantasma', ragno: 'ragno', orco: 'zombie',
    scheletro: 'scheletro', golem: 'golem', arpia: 'grifone', drago: 'drago', lupo: 'lupo',
    corvo: 'pipistrello-occhio', rovo: 'pianta',
    verme: 'ombra',              // molle, lo scoppio ci affonda; e tagliata fa due ombre
    blatta: 'draghetto',         // un drago: niente bombe, niente magia, come il drago
    troll: 'troll',
    corazziere: 'scheletro-scudo', // lo scudo per le frecce, la testa vuota per la magia
    balestriere: 'serpente',     // rasoterra: lo scoppio gli passa sopra
  },
  /* il fuoco: magma, lava, corna, fiamme */
  lava: {
    slime: 'melma-viola',        // una melma, come nel bosco
    goblin: 'diavoletto',        // piccolo e svelto: la freccia lo manca
    pipistrello: 'occhio',       // l'occhio volante, rosso come il posto
    fantasma: 'fantasma',        // trasparente: le frecce gli passano attraverso
    ragno: 'granchio',           // carapace: le frecce rimbalzano
    orco: 'bestia-cornuta',      // cuoio e corna
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
    balestriere: 'mostro-viola', // molle e buio, come l'ombra
  },
  /* il freddo: ghiaccio, vento, cose pallide e cose col pelo */
  neve: {
    slime: 'melma-rosa',
    goblin: 'mummia',            // le bende: la freccia si pianta e basta
    pipistrello: 'pipistrello-occhio',
    fantasma: 'fantasma-azzurro',
    ragno: 'scorpione',          // carapace, come il ragno
    orco: 'cinghiale',           // pelliccia e setole: la freccia ci resta piantata
    scheletro: 'teschio-azzurro', // ossa e basta, e il fuoco freddo
    golem: 'golem-ghiaccio',
    arpia: 'tornado',            // vento: la bomba gli scoppia sotto
    drago: 'drago',
    lupo: 'spirito-elettrico',   // il fulmine: la freccia lo attraversa, il gelo non lo ferma
    corvo: 'pipistrello',
    rovo: 'ent',                 // un groviglio di rami che si richiude
    verme: 'ombra',
    blatta: 'drago-lava',        // un drago, senza ali
    troll: 'golem-pietra',       // pietra
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
