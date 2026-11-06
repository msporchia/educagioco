# I gesti del banco

Un attrezzo arrivato sul suo bersaglio non fa niente da solo: lo muove il dito, e
il passo si fa quando il gesto è finito. I bambini si divertono proprio lì, quindi
il gioco non lo fa al posto loro. Il riconoscimento è `scena3d/gesti.js` (puro, a
punti in pixel), la figura è `scena3d/mani.js`, il suggerimento `scena3d/frecce.js`.

## Il gesto

| attrezzo | su | gesto | quanto |
|---|---|---|---|
| mestolo | calderone | gira | due giri |
| pestello | mortaio | su e giù | cinque colpi |
| coltello | tagliere | su e giù | cinque tagli |
| fiammifero | legna | sfrega di lato | cinque sfregate |
| coperchio | calderone | su e giù | tre schiacciate |
| la roba dura | grattugia | su e giù | cinque passate |
| bacchetta | calderone | scuote | sei scosse |
| sale, pepe | calderone | su e giù, capovolto | tre scosse |
| brocca, mortaio, tagliere | calderone | di lato si piega, e piegato versa | 0,9 s |
| ciotola, bicchiere | calderone, mortaio | di lato si piega, e piegato versa | 0,9 s |
| fiala | calderone | di lato si piega, e piegata si riempie | 0,9 s |

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
- **Il coperchio si schiaccia**: il vapore lo spinge su e il dito lo tiene giù, e a ogni
  colpo sbuffa dal bordo e il fuoco si alza. Finito torna al suo posto, e la pozione bolle
  più forte. Provato il mantice: un oggetto che i bambini non conoscono, per un effetto che
  si vedeva poco.
- **La fiala si riempie mentre è piegata** e si tappa da sola, a gesto finito. Fuori tempo
  si svuota. Finita la pozione resta sul tavolo, del colore del brodo.
- **La grattugia sta appesa al calderone**, non si trascina: quello che si gratta cade
  dentro, quindi è un passo solo.

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
- **Tutto questo vale a fuoco acceso**: a fuoco spento il brodo sta fermo. Il coperchio
  alza fiamme e bollore, la bacchetta accende il riflesso.
- **Il lampo usa la luce del fuoco**: provata una luce sua, ogni luce in più si paga su
  tutto il banco.

Nei test: `unita/pozioni` (`creaGesto`, `GESTI`, `BOLLORI`), `integrazione/pozioni`
(la ricetta intera col dito); `.pz-mercante[data-suggerimento]`
(`giro`·`su-giu`·`lato`·`agita`·`inclina`·`strada`),
`window.__bottega3d.dove('legna'|'grattugia'|'tagliere'|'coperchio'|…)`, `window.__bottega3d.ferma()` (il banco si può prendere: le animazioni vanno a fotogrammi, e su una macchina carica durano di più), il cheat `#pozioni=maestro&banco=1`.
