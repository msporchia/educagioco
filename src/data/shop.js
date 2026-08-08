/* Oggetti della cameretta, comuni a tutti i giochi: [emoji, nome, costo]

   I prezzi sono stati moltiplicati per tre quando ci si è accorti che
   l'intero negozio costava mezza settimana di gioco: le monete che si
   guadagnano crescono col livello del profilo, questi numeri no, e a
   livello 5 la cameretta si comprava tutta in due sere. Chi aveva già
   comprato non viene toccato — `owned` è la verità — e i prossimi oggetti
   vanno aggiunti su questa scala, non su quella di prima. */
export const ITEMS = [
  ['🧸','Orsetto',9],       ['🪴','Pianta',9],        ['💡','Lampada',12],
  ['📗','Libri',12],        ['🎈','Palloncino',15],   ['🧩','Puzzle',18],
  ['🖼️','Quadro',21],       ['🕰️','Orologio',24],     ['🌵','Cactus',24],
  ['🎧','Cuffie',30],       ['🪁','Aquilone',30],     ['🏮','Lanterna',36],
  ['🎸','Chitarra',42],     ['🤖','Robot',42],        ['🔭','Telescopio',48],
  ['📷','Macchina foto',48],['🎨','Cavalletto',54],   ['🪀','Yo-yo',54],
  ['🦖','Dinosauro',60],    ['🚀','Razzo',66],        ['🏆','Coppa',66],
  ['🎮','Console',72],      ['🛹','Skate',72],        ['🥁','Batteria',78],
  ['🦄','Unicorno',84],     ['🌍','Mappamondo',84],   ['🎹','Pianoforte',90],
  ['🐠','Acquario',102],    ['🏰','Castello',108],    ['🛸','Astronave',120],
]
