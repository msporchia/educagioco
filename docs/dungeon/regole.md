# Le regole del Dungeon

Il bottino, la difficoltà, il bestiario e perché qui non c'è la pausa. Il
combattimento (armi, armature, mostri con la vita) ha il suo documento nel
codice: `src/giochi/dungeon/COMBATTIMENTO.md`.

## Il bottino

- **Ogni risposta giusta porta bottino**: è il motivo per cui si continua a
  rispondere. Due caselle, arma (attacco) e armatura (difesa), tre gradi
  l'una; le gemme si spendono dal mercante.
- **I mostri difficili lasciano roba migliore.** Chi gira largo dai mostri
  grossi arriva al guardiano con lo spadino e lo vede scendere di un punto per
  volta: nessuno glielo dice, lo legge sulla barra della vita.
- **Le armi buone cadono presto**, nel primo e secondo piano: una spada
  trovata alla penultima stanza è una notifica, non un premio. Al piano più
  profondo cure e gemme, perché lì l'equipaggiamento si usa.
- **A fine discesa l'equipaggiamento sparisce**; resta l'eroe di base, che
  cresce con le tappe portate a casa. Il ritiro volontario è sempre possibile.

## La difficoltà

- **Una manopola sola, da 0 a 1**: il gioco chiede «una domanda di questa
  durezza» e non sa quali materie esistano; ogni tipo di domanda la traduce
  nel suo grado ([../apprendimento/presentazione.md](../apprendimento/presentazione.md)).
- **Ogni tappa dichiara una fascia** (per esempio da 0,2 a 0,7), e la domanda
  dipende dalla **riga del dungeon** a cui si è arrivati: la prima al minimo,
  l'ultima al massimo. Le tappe più avanti partono più in alto.
- **Certe stanze hanno un rincaro loro**: il forziere sorvegliato chiede più
  del corridoio vuoto.
- **I pezzi di scuola spenti non escono**; se un grado resta senza domande
  valide si scende a uno più facile invece di sparire.
- **La forza di un mostro** (`dati/mostri.js`, `forzaDi`) è l'indice della
  tappa più la profondità nella discesa moltiplicata per `PASSO` (2): a metà
  campagna si possono incontrare mostri più deboli di quelli appena battuti,
  perché all'ingresso di una discesa si è sempre nudi (l'equipaggiamento non
  passa la notte, solo l'eroe di base cresce fra una discesa e l'altra).
- **La difesa dei mostri cresce a un terzo del ritmo dell'attacco**: entra in
  una sottrazione (attacco − difesa), quindi se crescesse come l'attacco
  dell'eroe il bottino diventerebbe una decorazione.
- **Il guardiano di tappa non è battibile con le statistiche di partenza**:
  è il posto dove si scopre se ci si è equipaggiati per strada.
- **Il numero di domande non è più l'input come nel castello**: è il
  risultato di come si combatte e ci si equipaggia (`dati/taratura.js`,
  `DOMANDE`). A cinque secondi a domanda la prima cantina dura una decina
  di minuti, il covo del drago una ventina: è una partita, non un
  esercizio, e i tre piani esistono perché ci si possa fermare a metà.
- **La soglia del banco per «il bambino» è 0,6 e non 0,7** (`ATTESE` in
  `dati/taratura.js`): adesso si può anche sbagliare *come strategia* —
  arrivare al guardiano senza essersi equipaggiati — e perderla lì è come
  il gioco insegna a farlo meglio la volta dopo.

## Le monete

- **🪙1 a risposta giusta, pagato nel momento in cui si risponde**
  (`PAGA.mossa` in `src/data/paghe.js`), anche in una discesa persa, rifatta
  o senza fondo; a fine discesa il cartello dice il totale
  (`[data-monete-prese]`) e, se il salvadanaio era stanco, di quanto
  (`[data-nota-monete]`). Niente premio di tappa: c'era, `premio × stelle`
  (🪙9–30), e pagava venti minuti di domande come due minuti di asteroidi.
- **Una e non tre, come le altre domande vere**: qui la domanda è la mossa,
  e se ne fa una ogni cinque secondi (sopra). A 🪙3 la cantina renderebbe
  🪙150 in dieci minuti, due volte e mezza l'ora della calibrazione
  ([../apprendimento/calibrazione.md](../apprendimento/calibrazione.md)).

## Il bestiario

- **Un mostro del dungeon non è un'emoji.** Le emoji le disegna il telefono:
  hanno lo stile di Apple in mezzo a uno schermo disegnato a mano, non si
  ingrandiscono, non si tingono dell'ambiente, non tremano quando le colpisci
  e su due telefoni non sono la stessa figura.
- **Le creature stanno in `src/grafica/bestiario/`**, una ventina, un file per
  creatura e `indice.js` che le mette insieme. Sono **schede di dati** sopra
  lo scheletro di `grafica/corpo.js` (`bestia()`, `persona()`), che regala
  ombra, respiro, lampo bianco della botta e ribaltamento da ko.
- **Viste grandi e di fronte, e la paura la fa la forma**, mai il macabro:
  niente denti sporchi, sangue, occhi vuoti umani. Misure in unità, mai in
  pixel.
- **La stazza è informazione**: il mostro grosso è grosso a schermo, il capo
  di piano di più e con un alone, il padrone di casa riempie la schermata.
  L'`ingombro` di ogni creatura (`ingombroDi`, usato in `scena/bestia.js`) la
  tiene dentro il riquadro. Provato tutti larghi uguale: un capo con la vita
  tripla si presentava come il topo della prima stanza.
- **Le cose restano emoji**: uno scrigno, un fuoco, un mercante non sono
  qualcuno.
- **I quattro mazzi di un ambiente sono una scala, non quattro elenchi**
  (`mostri`, `grossi`, `capi`, `boss` in `dati/mostri.js`): le ossa crescono
  di taglia in taglia e la figura deve fare paura in proporzione — un capo
  di piano che pesca dal mazzo dei mostri normali si legge come «un altro
  insetto», non come «attento». Nessun controllo automatico lo sa fare, va
  guardato a occhio quando si ritocca un mazzo.

## Niente pausa, ma il respiro si ferma

- **Il Dungeon è a turni, quindi non ha il ⏸**: la stanza aspetta, e un tasto
  che non ferma niente insegna che i tasti mentono. Chi vuole smettere posa il
  telefono. (La pausa comune: [../core/interfaccia.md](../core/interfaccia.md#la-pausa-una-sola).)
- **L'unica cosa che scorre è il respiro prima della domanda** (`RESPIRO` in
  `Gioco.vue`: 750 ms all'entrata, 620 dopo un colpo, 350 dopo una ripresa),
  un `setTimeout` che scatterebbe uguale a schermo spento. Si congela a
  pagina nascosta (`visibilitychange`) e col foglio del `?` aperto, e riparte
  da quello che restava.
- **Qui il ritorno riprende da solo**, al contrario della pausa: non c'è una
  partita in corsa da consegnare in faccia a chi riaccende il telefono, solo
  una schermata ferma a cui mancava mezzo secondo.
