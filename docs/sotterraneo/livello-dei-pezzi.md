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
- Provato: i pezzi che cadono in una zona sopra l'eroe (il bottino è a livello `max(posto, eroe)`) restano chiusi finché l'eroe non sale; non si è toccato
  il livello del bottino. Il banco del fabbro e il giocatore finto: [bottega.md](bottega.md#salti-e-sogni), [giocatori-tipo.md](giocatori-tipo.md).

## Il banco e il giocatore finto

- **Il banco del fabbro e dell'incantatrice** ([bottega.md](bottega.md#salti-e-sogni)): i salti restano «di qualche livello sopra» e i sogni il traguardo, e
  ora che non si indossano subito **ogni linguetta ha almeno un pezzo che migliora e si mette adesso** (`completaSubito`, al livello dell'eroe o fino a due sotto,
  un raro solo se è un salto), oltre ai pezzi da tenere per dopo (`DA_MERITARE`, fino a otto). Il salto «che si compra e si mette» è del livello dell'eroe.
  Fa eccezione chi ha già il meglio del suo livello (un eroe con tre rari del suo livello): niente di quello che il banco può dare lo alza adesso, e la
  linguetta ha solo pezzi per dopo. Lo stesso per i gioielli, che migliorano quasi solo col livello.
- **Il giocatore finto** ([giocatori-tipo.md](giocatori-tipo.md), `allaBottega` in `motore/banco.js`): compra per dopo solo se, comprato il pezzo per adesso, gli
  avanzano gemme e non ha un pezzo per adesso da risparmiare; tiene al più `RISALITA.perDopo` (2) pezzi in attesa del livello (i più vicini) e non li vende;
  quando arriva al livello `equipaggia` li mette. Nel rapporto sono «comprati».
