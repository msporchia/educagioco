# Come nasce una domanda

`motore/scena.js` genera una domanda pronta per lo schermo da una tappa
e dal caso (`rnd`), senza schermo: gira uguale nel browser e in Node, così
il banco di prova può giocare mille tappe e un test rifare la stessa
domanda due volte.

## La griglia sicura

I gettoni si piazzano su una griglia con celle larghe almeno `MIN_DIST`,
più un tremolio piccolo quanto basta a non sembrare un quadernone a
quadretti ma mai tanto da far toccare due celle vicine. È una griglia
matematicamente sicura (nessuna sovrapposizione), non un tentativo a
caso che a volte fallisce. «In fila» è la stessa griglia senza mescolare
le celle: si riempie in ordine di lettura.

## Non ripetere sempre la stessa specie

`escludi` è un divieto (quelle specie non possono uscire), `evita` è un
desiderio: le specie appena nominate vanno in fondo alla fila e si
pescano solo se le altre non bastano — un mondo con tre bestie e una
tappa da quattro domande, pescando sempre da capo, ripeterebbe una specie
per forza (i cassetti), e chi gioca lo sentirebbe come «mi chiede sempre
le rane». Si evita **solo quello che il mondo può permettersi**: lo
spazio di manovra è `pool - quante`, mai di più, altrimenti un verbo che
pesca due bestie su tre evitandole entrambe si troverebbe una scelta
sola — che non è varietà, è un'altra ripetizione.

## Le opzioni numeriche

Le cifre fra cui si sceglie sono sempre vicine al valore vero: un 40 fra
le opzioni di un 3 mette alla prova l'indovinare, non il conteggio.

## I casi per verbo

- **`dipiu`** — «sono uguali» è forzato al 30% delle volte, altrimenti
  capiterebbe troppo di rado per caso e la risposta «uguale» non si
  imparerebbe mai a riconoscere.
- **`inclusione`** — le due opzioni sono sempre mescolate: con l'ordine
  fisso il tasto giusto sarebbe sempre lo stesso, e si vincerebbe la
  tappa premendo sempre lì senza aver capito niente. Le due specie si
  pescano separatamente (non in coppia) perché è quella **nominata** —
  quella che il bambino sente ripetere nella frase — a dover cambiare
  più spesso.
- **`stessi`** — due file di posizioni per gli stessi gettoni («prima» e
  «dopo»): il conto è deciso una volta sola qui, l'animazione la fa la
  vista.
- **`piuUno`** — si genera un gettone in più (arriva) o se ne segna uno
  da far sparire (scappa); l'animazione la fa la vista.
- **`genQuantiDi`/`genInsieme`/`genInclusione`** — i distrattori (specie
  che non contano nella risposta) condividono lo stesso posizionamento
  del bersaglio, così non si sovrappongono anche se appartengono a specie
  diverse.
