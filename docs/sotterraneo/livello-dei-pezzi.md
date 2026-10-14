# Un pezzo si indossa dal suo livello

Regola dell'utente (14 ottobre 2026): *«anche se ti offre un oggetto super bello non dovresti poterlo equipaggiare»*. **Un pezzo di livello N si
porta solo se l'eroe ha almeno il livello N** (`livelloRichiesto` in `dati/eroi.js`, `livelloBasta` e `posso` in `motore/corredo.js`). Vale per tutto
quello che ha un livello (armi, scudi, corpo, gioielli) **da qualunque parte arrivi**: il banco, i forzieri, i mostri e i grossi, le missioni. Il
motivo: i salti del fabbro stanno fino a sette livelli sopra l'eroe e la caratteristica richiesta è «mite apposta» (un paio di punti), quindi chi
alzava la sua caratteristica li indossava subito; misurato, il curioso usciva da ogni discesa con la forza +4 sull'atteso e i pezzi trovati non
servivano mai.

- **N e non N−1** (`MARGINE_DEL_LIVELLO`, 0): il pezzo «per il prossimo livello» si compra e aspetta, che è esattamente il gioco; N−1 lascerebbe indossare
  subito il pezzo del livello dopo a chi è a metà e farebbe sentire il banco come prima. Il numero è uno solo se si vuole provare l'altro.
- **Si compra e si raccoglie lo stesso**: va nello zaino col 🔒, e il pannello e la riga dicono «Serve livello 18 (hai 12)» come per la caratteristica
  (`perchéNo`; se mancano tutte e due: «Serve livello 18 (hai 12) · Forza 7 (hai 5)»). Il requisito di caratteristica resta com'è.
- **Quando l'eroe arriva al livello** il pezzo diventa indossabile, e se è meglio di quello addosso la riga lo dice («· ora lo puoi indossare», `pezziPronti`
  in `Corsa.guadagna`); non si mette da sé, come per la caratteristica.
- **I salvataggi**: chi ha già addosso un pezzo sopra il suo livello lo tiene (a nessuno si toglie niente: `livelloBasta` è vero per quello che si ha
  addosso, e `sistemaIlCorredo` non lo sfratta). Se lo toglie, per indossarlo ci vuole il livello.
- **La roba attesa della storia** è un livello sotto quello di chi la porta (`livelloDeiPezzi`), quindi la regola è soddisfatta per costruzione; `robaAttesa` la
  costruisce con `livelloLibero` perché il corredo di partenza non ha ancora la crescita (un test controlla che ogni pezzo sia del livello atteso).
- Il livello con cui nasce un pezzo trovato: sotto, «Il livello di un pezzo trovato». Il banco del fabbro e il giocatore finto:
  [bottega.md](bottega.md#salti-e-sogni), [giocatori-tipo.md](giocatori-tipo.md).

## Il livello di un pezzo trovato

Regola dell'utente (14 ottobre 2026, sera): *«ci sta che ogni tanto droppi qualcosa fuori dal suo livello, in particolare se è un boss ed è qualcosa di raro, ma non sempre»*.
**Un pezzo trovato nasce al livello dell'eroe più una variazione** (`livelloDelTrovato`, `VARIAZIONE_DEL_TROVATO` in `motore/bottino.js`), non più al più alto fra eroe e posto:

| variazione | −1 | 0 | +1 | +2 |
|---|---|---|---|---|
| peso | 20% | 45% | 25% | 10% |

Pesata verso il livello giusto, un po' più spesso sopra che sotto (media +0,25): chi trova un pezzo +1 o +2 lo tiene chiuso finché non sale, uno −1 è appena sotto.
**Il grosso**, che lascia roba rara, una volta su quattro (`FUORI_LIVELLO_DEL_GROSSO`) dà un pezzo 3 o 4 livelli sopra l'eroe (metà e metà), altrimenti la tabella di sopra; vale per il suo pezzo
raro e per quello col nome. Vale per forzieri, mostri, caporali e grossi (`Corsa.livelloDelTrovato`); **la roba della storia e delle missioni resta com'è** (`livelloDelBottino`, `premio()`).
Il tiro nasce dal seme, dal piano e dal posto (`tiroDalSeme`, come l'elisir) e non dal caso della discesa: aggiungerlo non sposta niente di quello che cade. Mai sotto il livello 1.

- **Cosa ha cambiato**: poco. Il livello del posto non c'entrava più: il curioso è quasi sempre sopra il livello atteso della discesa, e il bottino era già al suo livello (provato: eroe esatto,
  senza variazione, dà gli stessi numeri di prima fino al decimale). I pezzi trovati servono poco dalla torre in giù (0,1 a discesa) non per il livello ma per la qualità: nove su dieci sono
  comuni o magici e il curioso ha già dal fabbro il meglio del suo livello. Il giro prima → dopo, e cosa resta: [risalite.md](risalite.md#il-livello-del-bottino-e-due-pezzi-subito-14-ottobre-sera).

## Il banco e il giocatore finto

- **Il banco del fabbro e dell'incantatrice** ([bottega.md](bottega.md#salti-e-sogni)): i salti restano «di qualche livello sopra» e i sogni il traguardo, e
  ora che non si indossano subito **ogni linguetta ha almeno un pezzo che migliora e si mette adesso** (`completaSubito`, al livello dell'eroe o fino a due sotto,
  un raro solo se è un salto), oltre ai pezzi da tenere per dopo (`DA_MERITARE`, fino a otto). Il salto «che si compra e si mette» è del livello dell'eroe.
  Fa eccezione chi ha già il meglio del suo livello (un eroe con tre rari del suo livello): niente di quello che il banco può dare lo alza adesso, e la
  linguetta ha solo pezzi per dopo. Lo stesso per i gioielli, che migliorano quasi solo col livello.
- **Il giocatore finto** ([giocatori-tipo.md](giocatori-tipo.md), `allaBottega` in `motore/banco.js`): compra per dopo solo se, comprato il pezzo per adesso, gli
  avanzano gemme e non ha un pezzo per adesso da risparmiare; tiene al più `RISALITA.perDopo` (2) pezzi in attesa del livello (i più vicini) e non li vende;
  quando arriva al livello `equipaggia` li mette. Nel rapporto sono «comprati».
