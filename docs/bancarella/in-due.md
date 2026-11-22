# La cucina in due

Due bambini, due telefoni, la stessa cucina: insieme, non uno contro l'altro. Si entra dal tasto **In due** in cima ai livelli; chi
crea la partita sceglie i minuti (5, 10, 15) e le pietanze (`MENU_IN_DUE`: poche a crudo, tante, tutte); l'altro entra col codice o
con l'invito. La rete è il pezzo comune ([../core/insieme.md](../core/insieme.md)); il motore è `src/motore/bancarella/in-due.js`, che
fa girare due cuochi sul motore di uno solo (`conCuoco`). `#bancarella=due&menu=tante&minuti=5` apre una partita di prova da soli,
con l'altro cuoco fermo.

## Le regole

- **Niente pausa e niente cuori.** Conta quante se ne servono insieme finché dura l'orologio; una scaduta sparisce, e ne arriva
  un'altra. In lista ce ne sono sempre quattro, con un piatto solo. La ricetta si legge mentre il tempo corre.
- **La stanza è una**, con tutti gli attrezzi doppi, due appoggi e otto piatti. I cuochi si passano attraverso: fermarsi a vicenda
  in un corridoio sarebbe solo fastidioso. Ognuno ha il cuoco che si è scelto ([cuoco.md](cuoco.md)); chi è chi si dice col colore,
  sulla fascia del cappello e con l'anello per terra.
- **Andando a consegnare l'ordinazione diventa tua**: basta toccare la consegna con un piatto pronto. Se cambi strada la lasci.
- **Il pulsantino «prenota»** sulla scheda la tiene prima, e la scheda prende il tuo colore: a distanza non c'è altro modo di dirsi
  chi sta facendo cosa. Un secondo tocco la lascia. Quella prenotata dall'altro non si serve, e il fumetto lo dice.
- **I conti li fa ognuno sul suo telefono**, quelli del livello a cui è arrivato da solo (i prezzi e i soldi non passano dalla
  rete: all'altro arriva solo `pagata`). Mentre conti il tuo cuoco è fermo, e sull'altro telefono ha sopra la calcolatrice;
  l'altro cuoco va avanti, l'orologio pure, ma **l'ordinazione che stai contando non scade**. Il tempo sta nel lasciare solo il compagno,
  non nel conto: resta vero che i conti non hanno fretta. Le monete vanno a chi ha fatto il conto, come da solo.

A fine partita si dice quante insieme, quante a testa e quante scadute. Non c'è record, e una partita in due non si salva: l'altro
andrebbe avanti da solo.

## Due telefoni, una partita

Le mosse sono cinque (`tocca`, `vai`, `prenota`, `pagata`, e `veste` alla partenza: com'è fatto il proprio cuoco, solo da guardare). Un tocco vale 0,6 s dopo (`RITARDO` del lockstep), quindi il riquadro
verde si accende subito sul proprio telefono, e il cuoco parte poco dopo. Il caso ha lo stato dentro la partita. `verso` del cuoco è fatto
con `atan2`, che i browser arrotondano diverso: serve solo al disegno e non entra nell'impronta.

## Nei test

`unita/bancarella-in-due` (regole, e due telefoni finti su una rete cattiva: `test/aiuto/sfide/cucina.mjs`), `integrazione/bancarella-cucina`
(la prova da soli sempre; due pagine vere col servizio: `SERVIZIO=` come in `verifiche/arena-sfida`, se no quella parte salta).
Bersagli: `[data-cucina-in-due]`, `[data-minuti-in-due]`, `[data-menu-in-due]`, `[data-prenota]`, `[data-di]`, `[data-fine-in-due]`.
