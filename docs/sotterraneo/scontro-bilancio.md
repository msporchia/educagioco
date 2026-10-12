# Lo scontro a gruppi: il bilancio

I numeri con cui il motore dello scontro ([scontro.md](scontro.md)) parte, tarati sui test unitari del sotterraneo
(`unita/sotterraneo`, `-roba`, `-storia`, `-zone`, `-abisso`, `-missioni`, `-forza`). **Le misure vere (`npm run test:misure`) non
sono state rifatte**: la tabella di [la-grande-storia.md](la-grande-storia.md) e le soglie dei giochi finti aspettano.

- **`COLPO_DEL_MOSTRO` 0,8.** Era 0,6 sulla carta (la media di oggi a otto risposte giuste su dieci: metà quando si risponde
  bene, intero quando si sbaglia), ma un mostro non colpisce a ogni risposta dell'eroe, solo ai suoi turni (l'eroe
  parte più veloce), quindi 0,6 era troppo dolce.
- **La forbice si stringe.** Prima sbagliare costava il colpo intero e rispondere bene la metà (la lunghezza della battaglia
  contava due volte); ora il danno non dipende dalla risposta e sbagliare allunga soltanto la battaglia. Chi preme a caso
  perde ancora (0 vittorie su 8 sulla scala sommersa, contro 8 su 8 a otto su dieci), ma con meno margine: in una griglia di
  valori (colpo 0,65–1,3, velocità dei mostri ×0,7–×1,1) nessuna coppia faceva stare insieme «a caso no» e «a otto su dieci si
  arriva in fondo» finché il lupo e il serpente erano a 11: la grotta (orco, lupo, serpente, granchio) vinceva 4 volte su 6,
  non 5. A 9, il lupo e il serpente restano di mezzo e tutti i test passano. È il punto da guardare con le misure vere.
- **Le discese in domande** (il minimo, col banco, seme del banco): cripta 15, scalinata 17, torre 20, grotta 46, scala
  sommersa 44, botola 68, miniera 47; prima 15 · 14 · 19 · 44 · 45 · 62 · 60. La miniera scende di molto (i gruppi grandi sono
  quelli che il banco, che attacca soltanto, regge meglio di prima); la scalinata sale di tre.
- **La forza dell'eroe** ([forza.md](forza.md)) usa lo stesso modello: il mostro colpisce `COLPO_DEL_MOSTRO` × (att − dif) a ogni suo
  turno, e ne gioca `velocità mostro / velocità eroe` per ogni turno dell'eroe. L'eroe atteso vale ancora il suo livello.
- **Rotto prima di questo lavoro**: `integrazione/sotterraneo-pericolo` non scende nella miniera (il mago nudo al livello 8 ha
  forza 1 e il pallino è rosso, la sentinella lo ferma: succede anche prima, con la forza di `motore/forza.js`). Il test
  è aggiornato alla fila dei turni ma va rimesso in piedi con la vista nuova.
