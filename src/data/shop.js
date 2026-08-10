/* Oggetti della cameretta, comuni a tutti i giochi: [emoji, nome, costo]

   I prezzi sono stati moltiplicati per tre quando ci si è accorti che
   l'intero negozio costava mezza settimana di gioco: le monete che si
   guadagnano crescono col livello del profilo, questi numeri no, e a
   livello 5 la cameretta si comprava tutta in due sere. Chi aveva già
   comprato non viene toccato — `owned` è la verità — e i prossimi oggetti
   vanno aggiunti su questa scala, non su quella di prima.

   Poi sono stati moltiplicati **per dieci**, ed è la scala di adesso.
   Il motivo è che un oggetto si compra UNA VOLTA SOLA: comprato, resta
   sulla mensola per sempre e non chiede più niente. Tutto il resto della
   cameretta invece ricomincia — la ciotola si svuota, l'animale ha di
   nuovo fame, la capsula successiva costa più della prima — e una spesa
   che finisce non può costare come una che torna, altrimenti in due sere
   gli scaffali sono pieni e non c'è più niente da desiderare. A questi
   prezzi il mappamondo è un traguardo di qualche giorno e l'astronave di
   qualche settimana, che è esattamente il mestiere di questa stanza.

   Chi aveva già comprato non paga la differenza: gli oggetti in `owned`
   restano suoi. */
export const ITEMS = [
  ['🧸','Orsetto',90],       ['🪴','Pianta',90],        ['💡','Lampada',120],
  ['📗','Libri',120],        ['🎈','Palloncino',150],   ['🧩','Puzzle',180],
  ['🖼️','Quadro',210],       ['🕰️','Orologio',240],     ['🌵','Cactus',240],
  ['🎧','Cuffie',300],       ['🪁','Aquilone',300],     ['🏮','Lanterna',360],
  ['🎸','Chitarra',420],     ['🤖','Robot',420],        ['🔭','Telescopio',480],
  ['📷','Macchina foto',480],['🎨','Cavalletto',540],   ['🪀','Yo-yo',540],
  ['🦖','Dinosauro',600],    ['🚀','Razzo',660],        ['🏆','Coppa',660],
  ['🎮','Console',720],      ['🛹','Skate',720],        ['🥁','Batteria',780],
  ['🦄','Unicorno',840],     ['🌍','Mappamondo',840],   ['🎹','Pianoforte',900],
  ['🐠','Acquario',1020],    ['🏰','Castello',1080],    ['🛸','Astronave',1200],
]
