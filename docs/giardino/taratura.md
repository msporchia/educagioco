# La taratura

`motore/banco.js` è il giocatore finto: gioca una tappa da solo, senza schermo,
con un seme (la partita si rifà identica). Il conto non costa tempo (il campo
sta fermo), quindi il giocatore decide solo **cosa mettere e dove**, e quanto
ci mette a toccare i soli.

Tre tipi (`GIOCATORI`): **attento** (tocca un sole dopo 1 s, decide ogni
mezzo secondo), **lento** (4 s / 2,5 s), **sbadato** (7 s / 5 s, pochi girasoli).

Cosa promette la campagna (e lo prova `unita/giardino`, sezione 7):
- la prima tappa la vince quasi sempre l'attento (≥ 90%) e di solito lo sbadato (≥ 60%);
- l'ultima si può vincere (≥ 40% l'attento) ma chiede di giocare bene.

Un giro a occhio sulle nove tappe (30 semi, attento / lento / sbadato):
si parte da 100 / 100 / 96% e si arriva a 73 / 20 / 0%. I numeri veri sono in
`gioca()`; **non c'è ancora un comando di taratura** come `npm run tara:arena`
(`da-fare.md`).

**Non è ancora tarato**: i valori di piante e zombi sono a occhio. Il giocatore
finto non compra mai il gelo (i cipressi escono uguali al pollaio), quindi
quella tappa non è misurata.
