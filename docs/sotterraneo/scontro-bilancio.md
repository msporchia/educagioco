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

## La luce a cono e gli agguati

Col cono di luce ([luce.md](luce.md)) i mostri nell'ombra arrivano alle spalle, e l'agguato (un colpo prima di tutto)
diventa comune: il banco gioca a torcia spenta e **non si volta mai**, quindi è il caso peggiore.

- **Con il solo cono, mostri che vanno dritti, tutto verde.** I bersagli di `unita/sotterraneo` e `-roba` passano.
- **Con i mostri che girano alle spalle** gli agguati nelle discese del banco (trenta semi, bravura 0,8) vanno da 12–26 a
  41–67 per tappa (da circa un decimo a un quarto degli scontri) e le vittorie scendono dove la roba attesa è più
  stretta: gallerie 29 → 21 su 30, cisterna 29 → 25, le altre invariate (28–30 su 30). Quattro bersagli
  si rompono, tutti sullo stesso meccanismo: «la torre e le gallerie a otto su dieci si arrivano in fondo» (4/6, serve
  5/6), «chi ripulisce il piano paga molto di più» sulle gallerie
  (minimo 53, tutto 56) e «rispondere bene costa meno vite» (seme 31: 7 svenimenti sia a 0,9 sia a 0,25); «a caso no» sulla
  scala sommersa balla fra 0 e 3 su 8 secondo i ritocchi (il bersaglio è ≤1).
- **È l'agguato, non il movimento**: senza il colpo in più (`alleSpalle` sempre falso) le stesse discese col giro alle
  spalle hanno gli svenimenti di prima (gallerie, seme 7: 4, come con i mostri dritti; con l'agguato: 7 e la discesa
  persa, 19 agguati su 70 scontri).
- **Non forzato.** Leve, da scegliere con le misure vere: un colpo d'agguato più leggero, l'agguato solo da dietro (un
  cono di 120° speculare a quello della luce, non la metà intera), un banco che si volta (come un adulto attento), o
  rifare la roba attesa delle gallerie e della cisterna. Provato un passo più lento per i mostri nell'ombra: gli
  agguati calano ma le discese peggiorano (gallerie 18 su 30), tolto.
