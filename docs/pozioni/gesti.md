# I gesti del banco

Un attrezzo arrivato sul suo bersaglio non fa niente da solo: lo muove il dito, e
il passo si fa quando il gesto è finito. I bambini si divertono proprio lì, quindi
il gioco non lo fa al posto loro. Ma il gesto deve voler dire la cosa che si fa: dove
il dito non ha niente da aggiungere (la roba che scorre) non lo si tiene lì ad aspettare. Il riconoscimento è `scena3d/gesti.js` (puro, a
punti in pixel), la figura è `scena3d/mani.js`, il suggerimento `scena3d/frecce.js`.

## Il gesto

| attrezzo | su | gesto | quanto |
|---|---|---|---|
| mestolo | calderone | gira | due giri |
| pestello | mortaio | su e giù | cinque colpi |
| coltello | tagliere | su e giù | cinque tagli |
| fiammifero | legna | sfrega di lato | cinque sfregate |
| la roba dura | grattugia | su e giù | cinque passate |
| bacchetta | calderone | scuote | sei scosse |
| sale, pepe | calderone | su e giù, capovolto | tre scosse |
| brocca, mortaio, tagliere, ciotolino | calderone | di lato si piega, e piegato versa | 0,6 s |
| ciotola, bicchiere | calderone, mortaio | di lato si piega, e piegato versa | 0,6 s |
| mestolo | calderone, poi fiala | pesca nel brodo; sulla fiala di lato si piega e la riempie | 0,6 s |

- **Piegato si può staccare il dito**: finisce di versare da solo (`solo` in `gesti.js`), e
  non si aspetta che scorra. Col dito giù si può ancora raddrizzare o portare via, così
  passarci sopra non versa niente. Lasciato da dritto è un gesto a metà.

- **Quello che si è misurato si versa, quello che è intero si lascia cadere.** Sul
  bancone arriva com'era sulla bilancia o nel cilindro (`recipiente` in
  `procedimento.js`): la roba da bilancia in una ciotola, il liquido in un bicchiere, e
  si versa piegandolo come il mortaio, col mucchio che cala. Le lunghezze e quello che
  si gratta restano interi, con la foto: nel calderone, nel mortaio e sul tagliere si
  lasciano cadere, e sulla grattugia si sfregano. Nel mortaio i pezzi da schiacciare ci
  sono solo se c'è roba intera (`grumi`). Prima sul bancone c'era la foto per
  tutti: si vedeva la polvere sulla bilancia e poi una stella, o un gufo da versare.
- **Il momento giusto lo dice il motore, a gesto finito**: fuori tempo si fa tutto
  il gesto e poi il calderone sbuffa. Passarci sopra per spostare un attrezzo non è
  un pasticcio, e nemmeno lasciarlo lì a metà: non è successo niente.
- **Il fuoco si accende sulla legna**: spunta da sotto il calderone a raggiera apposta.
  Il fiammifero sul calderone non fa niente, e una freccia dice dove va. Un attrezzo
  sulla cosa sbagliata non è mai un pasticcio.
- **Il giro si misura sul verso del dito, non attorno a un centro**: un cerchio
  storto o fuori centro vale uguale, e uno zig-zag si annulla da sé.
- **Il colpo vale tornando indietro di 22 px** (`SCATTO`): il dito che trema non pesta.
- **I colpi non sbattono contro un fondo** (`finestra` in `mani.js`): la finestra
  segue il dito, così il pestello picchia anche se il dito scivola in basso.
- **Si vede fare mentre si fa**: i grumi spariscono nel mortaio, il pezzo si accorcia
  sul tagliere e le fette aumentano, l'arcobaleno sfuma, il fiammifero prende dopo
  tre sfregate, la roba si consuma sulla grattugia. Ogni colpo ha il suo suono, che
  non dice niente che non si veda.
- **Dopo il gesto resta solo il risultato** (`MOSSE` in `indice.js`): niente
  animazione doppia. `window.__poz.fai` passa di lì, senza dito.
- **Niente coperchio e niente mantice**: provati tutti e due per far bollire più forte.
  Il mantice era un oggetto che i bambini non conoscono, e il coperchio, schiacciato o da far
  fumare, non si capiva cosa volesse dire: un passo che non si spiega da solo si toglie.
- **La fiala non si tuffa, la riempie il mestolo**: una fiala immersa nel brodo uscirebbe
  sporca. Il mestolo che entra nel calderone pesca da solo (`pesca`, si vede il brodo nella
  coppa) e sulla fiala versa; vuoto sulla fiala non fa niente, e la strada dice di passare
  dal calderone. Si tappa da sola a gesto finito, e fuori tempo si svuota. Finita la pozione
  resta sul tavolo, del colore del brodo. La fiala si può spostare, ma non è lei che si porta.
- **Si gratta nel ciotolino, e il ciotolino si versa**, come il tagliere: la grattugia sta
  in piedi sul tavolo, non si trascina, e sotto il mucchietto cresce a ogni passata (`grattato`
  in `bottega.js`, `GRATTATO` nel `cosa` della versata). Provata appesa al calderone: da fuori
  sembrava di grattare sul tavolo.

## Il suggerimento

Una freccia dipinta sul bersaglio e un puntino bianco che fa il gesto al posto del dito.

- **Attrezzo fermo sul bersaglio per 1,3 s** (`FERMO_SU`): la freccia del gesto, che
  se ne va appena il dito lo fa.
- **Attrezzo lasciato a metà gesto**: la stessa freccia per 3,5 s (`RESTA`), e torna a posto.
- **Attrezzo sulla cosa sbagliata**: la strada verso il suo bersaglio, per 3,5 s.
- **Tavolo fermo per 12 s** (`FERMO_TAVOLO`): la strada della mossa che manca
  (`prossimaMossa`). Dà la risposta, quindi aspetta quanto basta per leggere la ricetta.
  Un tocco qualunque la toglie.

## Come ribolle

- **Ogni pozione ha il suo modo** (`dati/bollori.js`): undici modi (`scena3d/bollori.js`),
  scelti da quello che è. L'Elisir del Fuoco fa scintille, l'Acqua del Ghiaccio una
  nebbia che scivola fuori, la Polvere dei Tuoni lampi, lo Sciroppo Arcobaleno cambia
  colore da solo.
- **Due riflessi a pozione**, che girano sul brodo come venature: quale dipende dagli
  ingredienti, quindi la stessa pozione rifatta può cambiare.
- **Tutto questo vale a fuoco acceso**: a fuoco spento il brodo sta fermo. La bacchetta
  accende il riflesso.
- **Il lampo usa la luce del fuoco**: provata una luce sua, ogni luce in più si paga su
  tutto il banco.

Nei test: `unita/pozioni` (`creaGesto`, `GESTI`, `BOLLORI`), `integrazione/pozioni`
(la ricetta intera col dito); `.pz-mercante[data-suggerimento]`
(`giro`·`su-giu`·`lato`·`agita`·`inclina`·`strada`),
`window.__bottega3d.dove('legna'|'grattugia'|'ciotolino'|'tagliere'|'fiala'|…)`, `window.__bottega3d.ferma()` (il banco si può prendere: le animazioni vanno a fotogrammi, e su una macchina carica durano di più), il cheat `#pozioni=maestro&banco=1`.
