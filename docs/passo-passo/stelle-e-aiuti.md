# Passo passo — stelle, monete e aiuti

Cosa vale una tappa e come si scende la scala del 💡 in questo gioco. La
scala a monete comune a Generale, Passo passo e costruttore (gradini
gratis, prezzi, secondo tocco) sta in [../core/aiuti.md](../core/aiuti.md).

## Le quattro stelle

| stella | cosa la dà |
|:--|:--|
| ⭐ arrivato | la tana (per il cane: il gregge nel recinto) |
| ⭐ la carota | la carota presa (per il cane: l'osso) |
| ⭐ 🧠 l'hai trovata tu | la spegne **solo** la strada intera comprata col 💡 |
| ⭐ 🎯 la più corta | arrivare **con la carota** con meno carte possibile |

- **Sotto ogni stella del cartello c'è il disegno di cosa l'ha data**: una
  stella spenta con sotto la carota dice da sola che rigiocando la si prende.
- **La carota non serve mai per vincere.** Prima sta sulla strada, poi chiede
  una deviazione, poi una deviazione pensata: sul ghiaccio, dall'altra parte
  di un buco, oltre la buca giusta.
- **🎯 conta carte, non celle**: una scivolata è una freccia sola, e si
  contano fino a quella che ha portato a casa. Chi ne ha usate di più legge i
  due numeri («si può fare con 7 frecce: tu ne hai usate 12»); nel sentiero
  senza fine le stelle non ci sono, la riga sì. È nata perché senza nessun
  incentivo si vedevano file da quaranta frecce su posti da dodici.
- **Il minimo lo dà `minimoDi`** (`motore/risolutore.js`): esatto senza zaino,
  misurato dal risolutore; con lo zaino è la più corta delle soluzioni
  scritte, e siccome la stella chiede «al più» chi trova di meglio non perde
  niente. Che le soluzioni scritte siano davvero le più corte lo controlla
  `strumenti/passo-passo/minimi.mjs`, che cerca il programma più corto coi
  cicli (scatole fino a sei carte). Nei sentieri lo cerca `cercaProgramma`
  (`motore/programmi.js`), senza tetto alle scatole: vedi
  [sentiero-finale.md](sentiero-finale.md).
- **Il 💡 porta sempre alla strada più corta**: se la fila arriva già ma è
  lunga, il 🔎 dice dove accorciarla, e chi segue gli aiuti prende anche la
  quarta — se no il gioco ti aiuterebbe e poi ti rimprovererebbe.

## Le monete

- **Una tappa paga una volta sola**, alla prima vittoria: 🪙4 nei primi passi,
  🪙12 ai massi, da 🪙14 a 🪙20 con lo zaino. Il livello è fisso: rigiocarlo
  è ricordarlo, non esercitarsi.
- **Il sentiero senza fine paga 🪙3 per sentiero, 🪙6 con lo zaino**, perché lì
  ogni sentiero è nuovo (vedi [sentiero.md](sentiero.md)).

## La scala del 💡

Ogni tocco scende di un gradino (`motore/aiuti.js`):

1. **gratis** — una frase su cosa chiede quel posto, ricavata da quello che
   c'è sulla mappa (ghiaccio, massi, buche, zaino), da leggere al bambino se
   ancora non legge;
2. **gratis** — **dove** la fila comincia a sbagliare: il cursore va lì e le
   frecce dopo si spengono un poco, ma la freccia giusta non la dice;
3. **🪙10** — la freccia giusta, tre volte al massimo: tratteggiata dentro la
   fila nel punto dove va, e col suo tasto che brilla. La mette il bambino;
4. **🪙50** e **🪙100** — un pezzo di strada scritto nella fila: un terzo di
   quello che manca, poi la metà (`pezzoDiStrada` in `motore/aiuti.js`);
5. **🪙200** — la strada intera, che vince ma spegne la stella 🧠.

- **I pezzi sono quello che farebbe chi segue il 💡 a occhi chiusi**, a
  partire da dove la fila va bene. Il risolutore dà la prossima freccia
  giusta, mai la soluzione intera, finché non la si compra.
- **Una freccia pagata e non ancora messa si riaccende gratis.**
- **Quello che si è pagato resta** finché il livello non è vinto, insieme
  alla fila: uscire e rientrare non fa ripagare niente. Vinto, rigiocarlo
  riparte da capo (vedi [sosta.md](sosta.md)).
- **Il 💡 non si spegne mai**: premuto mentre il coniglio corre si accende e
  aspetta, e il gradino arriva quando il coniglio si ferma — è mentre lo si
  vede sbattere che lo si cerca.
- Con lo zaino il 💡 parte dalla soluzione scritta: [zaino.md](zaino.md).
