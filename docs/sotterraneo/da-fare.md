# Il sotterraneo: da fare

Le voci aperte, ognuna con quello che serve per farla. Il progetto dettagliato
dell'abisso sta in [abisso-progetto.md](abisso-progetto.md).

## L'abisso

- **La lettura unica `cosa(k)`** e le chiavi `base#N` (punto 1 del progetto):
  oggi le letture `COSE[` fuori da `dati/cose.js` sono una sessantina, e
  nessun controllo le vieta. Niente cambia a schermo.
- **Il bottino graduato** (punto 3): `G(p) = floor(p / 2)`, il guardiano che
  lascia sempre, il mercante a `G(p)−1`, prezzi `× (1 + N × 0,5)`, il grado
  sulla mano che comanda (`attaccoMancino` sulla scheda nuda), i nomi
  accordati col campo `genere: 'f'` e il suo controllo in `guastiDelleCose`.
  È il pezzo che manca per andare oltre la decina di piani.
- **Le scorte che si diradano e la scorta del guardiano**: le due leve
  proposte e **mai misurate**. Fonte e mercante da uno per piano a uno ogni
  due, poi ogni tre; dove il capo è ormai il gigante, un secondo mostro nella
  stanza della scala (indurisce il minimo senza allungare il giro). Vanno
  provate sul banco insieme al bottino graduato, non prima: oggi la discesa
  si ferma per l'arma che non cresce.
- **Le soglie mancanti del banco** in `unita/sotterraneo-abisso`: costo per
  piano 10–25 fino al 30, forbice oltre 2×, guardiano ≤ 8 risposte con l'arma
  del piano, salvataggio di quaranta piani sotto i 10 KB, risalita senza
  perdite.
- **La scala che risale** e i piani lasciati salvati come differenza
  (punto 4): `dietro` e `fondo` nella sosta, tetto a venti piani. Per ultima.

## Il gioco

- **Altri scenari**: la fornace e la grotta di cristallo hanno il blocco
  pronto nella scheda
  `strumenti/sprite/sorgenti/sotterraneo/generati/PROMPT-scenario.md`, da
  fare come la cripta: la scena, poi i pezzi che mancano nella stessa chat.
  Poi i foglietti, una voce in `SCENARI`, un branco in `BRANCHI` e un tratto
  in `TRATTI_DELL_ABISSO` (vedi [scenari.md](scenari.md) e
  [abisso.md](abisso.md#il-posto-cambia-scendendo)).
- **La fornace: quale discesa la indossa.** Oggi nessuna (è una riga, `scenario:` nella tappa). Le fuliggini non sono state usate.
- **L'arredo della cripta**: la fornace ha il suo (`arredo` e `dice` nella voce
  di `SCENARI`), le cantine e la cripta no, e botti, casse e stendardi rossi
  nella cripta sembrano portati dalle cantine. La scena della cripta ha
  sarcofagi, statue, candelabri e colonne spezzate ma col pavimento dietro:
  vanno chiesti su fondo magenta e mappati con `arredo`.
- **La fontana della cripta** è ancora quella di `sotterraneo_3.png`, piena e
  asciutta: quella del foglio dei pezzi è a muro, e bevendo cambierebbe forma.
- **Un mostro di quinta fascia per ogni posto**: oggi il golem sta in tutti
  i branchi, e cantine e cripta si separano solo fino alla quarta. Con un
  terzo posto conviene anche una seconda faccia per le fasce che ne hanno una
  sola (il ratto nelle cantine, pipistrello, fantasma e scheletro nella
  cripta).
- **I guardiani dell'abisso per posto**: la scaletta è misurata e non guarda
  il tratto, quindi lo scheletro fa la guardia alle cantine. Da rifare sul
  banco insieme al bottino graduato.
- **Quale discesa indossa la cripta**: oggi nessuna (è una riga, `scenario:`
  nella tappa).
- **Il suono**: c'è il minimo (passo, colpo, errore, il graffio). Col suono
  spento il gioco deve restare intero.

## Da guardare col dito

Cose tarate a occhio o provate solo dai test: le giudica solo un bambino con
il telefono in mano.

- **Quanto sono più lenti i mostri** (`PASSO_MOSTRO` 3,1 contro `PASSO_EROE`
  5,4) **e i tre secondi di calma** dopo una fuga (`CALMA`, `dati/mondo.js`):
  decidono se una stanza fa paura o fa arrabbiare.
- **Quante stanze per piano** (da quattro a sedici): se un piano non finisce
  mai, la scala smette di essere un traguardo.
- **I gesti**: il tocco che manda a camminare, il dito tenuto premuto che fa
  inseguire, il pizzico dello zoom, i mostri che vengono addosso.
- **Lo scontro al centro**: la modale in mezzo allo schermo con la scena
  ferma non è mai stata vista a schermo — pilotare l'esplorazione da fuori
  non ha mai portato a un incontro (~400 tocchi in tre tentativi). Guardare
  anche **quanto ci mette un incontro a capitare**, che è un dato sospetto.
- **Le domande che si incatenano** (riguarda anche Dungeon, Corsa e
  Survivors: tutti passano da `quiz/Domanda.vue`): il componente si azzera
  da sé fra una domanda e l'altra, ma i **320 ms di finestra cieca** al
  montaggio vanno sentiti col dito — sono la differenza fra un tocco fantasma
  ingoiato e un tasto che sembra lento.
