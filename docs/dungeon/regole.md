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
