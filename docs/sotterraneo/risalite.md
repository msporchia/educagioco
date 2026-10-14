# Le risalite: i giocatori tipo spendono durante la discesa

14 ottobre 2026. Il banco di [fine-discesa-e-strade.md](fine-discesa-e-strade.md) spendeva solo fra una discesa e l'altra, e il curioso arrivava in fondo
alla miniera con 4000 gemme in tasca. L'utente: «il concetto di gemme avanzate è un po' assurdo: non dovresti avere gemme avanzate, dovresti usarle per
comprare periodicamente un'arma più forte, altrimenti che senso ha? È una simulazione orribile perché non stai sfruttando il personaggio». Adesso i giocatori
tipo **tornano su dal portale a comprare mentre scendono**, come un bambino. Cambia come gioca il banco, **non un numero né una regola del gioco**.

Il codice: `motore/banco.js` (`gioca` con `risalita`, `allaBottega` con `scaffale` e `botteghe`), `motore/storie.js` (l'obiettivo e i banchi passano da una
discesa all'altra nello stato della storia), `dati/giocatori-tipo.js` (`RISALITA`, `sogliaDiRisalita`), `motore/salti.js` (i prezzi dei salti),
`motore/fine.js` e `motore/rapporto-fine.js` (le armi nuove, le tabelle). I comandi: [../core/comandi.md](../core/comandi.md). Il portale: [portale-e-sosta.md](portale-e-sosta.md).

## La regola

- **Il portale c'è in ogni piano**, nella stanza che era del mercante. Il giocatore ci cammina davvero (`raggiungi`: passi veri, orologio, torcia, mostri che
  si muovono, un portone chiuso lungo la strada si sblocca come per ogni altra meta), fa la spesa con la **sua strada** (arma prima, beve tutto) e riprende da lì:
  nel gioco il gemello lo riporta nel punto del portale, quindi il ritorno non costa passi, e il cammino verso il resto del piano si paga esplorando.
  Salendo non si guarisce e non passa tempo: sopra la discesa è ferma.
- **Quando sale** (`vuoleSalire`):
  1. ha in tasca il prezzo del **salto** che all'ultima spesa non poteva pagare (l'**obiettivo**: il pezzo che migliora l'eroe, il più economico di quelli fuori dalla sua borsa).
     È la regola dell'utente «quando può comprare qualcosa che serve», e il bambino la fa da sé: ha visto il pezzo sul banco;
  2. senza obiettivo (e a ogni livello nuovo, quando i banchi cambiano) quando ha preso `soglia(livello)` gemme dall'ultima spesa;
  3. ogni `mostriOgni` (10) mostri se le pozioni sono meno di 2 e ha preso almeno 30 gemme: per ricomprare le cure.
  Al più `tentativi` (4) prove per piano se il portale non si raggiunge.
- **Cosa vede**: il banco **e lo scaffale** (i salti e i sogni di `bottega.md`). Prima il giocatore finto guardava solo il banco del passo, che si esaurisce:
  con quello solo, le risalite non hanno niente da comprare (provato: stesse gemme non spese, stessa forza, `--tara risalita.scaffale=0`). Vale anche fra una
  discesa e l'altra. I banchi **persistono** (`botteghe` nello stato della storia): riaprire non li cambia, a discesa finita ruotano (`alGiroNuovo`, tre via e tre
  dentro), salendo di livello si rimettono in discussione (`prepara`). Provato: ripescarli a ogni visita era una slot machine, e costava 100 ms a visita.
- **Chi guarda i banchi**: l'incantatrice solo per chi porta bacchette o stoffa, il mercante dei gioielli finché il dito è libero, il fabbro sempre.
- **Le strade restano**: arma prima compra i pezzi e poi le pozioni, beve tutto le pozioni prima (fino a lasciare due tasche), in salita come fra le discese.
- **Il resto del gioco non cambia**: `RISALITA.acceso = 0` e `scaffale = 0` riproducono il giro di prima cifra per cifra (`--tara risalita.acceso=0,risalita.scaffale=0`).

## La soglia: proposta da confermare

La soglia fa da innesco solo quando il giocatore non ha un obiettivo, quindi conta meno della prima regola. L'utente proponeva `100 + (livello − 10) × 10`, «ma forse più
esponenziale la seconda parte». I prezzi dicono altro: **il salto costa quasi lo stesso a ogni livello e poi si appiattisce** (`npm run taratura -- --salti`, 4 eroi × 3 semi):

| livello | soglia dell'utente | **soglia proposta** | salto: minimo · primo quarto · **mediana** · massimo | sogno (mediana) |
|---|---|---|---|---|
| 1 | 10 | **83** | 8 · 36 · **73** · 1734 | 1094 |
| 3 | 30 | **119** | 20 · 71 · **110** · 1076 | 1120 |
| 5 | 50 | **145** | 35 · 93 · **141** · 1585 | 986 |
| 7 | 70 | **163** | 40 · 110 · **160** · 1476 | 1060 |
| 10 | 100 | **182** | 45 · 137 · **190** · 946 | 1128 |
| 12 | 120 | **190** | 37 · 97 · **181** · 1240 | 1248 |
| 14 | 140 | **195** | 41 · 134 · **204** · 980 | 1120 |

`soglia = 60 + 150 · (1 − e^(−livello/6))`: sale in fretta e si ferma intorno a 200, come la mediana del salto (quella lineare parte da 10 e sta sotto il prezzo di un salto a ogni livello;
una esponenziale partirebbe sotto e andrebbe oltre il prezzo, mentre i prezzi sono piatti). Il «salto» è come lo chiama il banco (`ruoloDi`): alza il posto di almeno un quarto e
non meno di 1,5. Il sogno costa il doppio, intorno a 1100 a ogni livello: è il traguardo per cui il giocatore risparmia più a lungo. Nel codice `RISALITA` (`base`, `salita`, `scala`).

## Cosa si misura adesso

- **Le gemme avanzate sono «gemme non spese all'uscita»** e un numero alto è un sospetto, non un dato: il rapporto segna con !! la discesa in cui la mediana supera il valore della roba
  attesa (il giocatore non sfrutta il personaggio). Sono anche le gemme che avanzano dopo la spesa di fine discesa.
- **Per linea e discesa** (`tabellaFine`): risalite a discesa, gemme spese in salita, pezzi e pozioni comprati in salita, passi per arrivare al portale.
- **Le armi nuove** (`tabellaArmi`, proposta dell'utente): «in una discesa quante armi nuove sono riuscito a comprare? Se la risposta è 5 qualcosa non va. Un'intera discesa dovrebbe
  farti guadagnare diciamo 3 oggetti veri utili, fra quelli comprati e quelli trovati; se sono di più siamo troppo generosi». Si contano i pezzi che **entrano addosso e alzano il
  valore dell'eroe** (non quelli finiti nello zaino o venduti), divisi in **comprati** (in salita o fra le discese) e **trovati**, con in coda i trovati che non servivano.
  **Bersaglio indicativo [da confermare]: circa 3 utili a discesa, come mediana.** Molti di più: gemme o drop troppo generosi; molti di meno: il fabbro è troppo caro o i drop avari.
- **Il prima → dopo**: `--riassunto file` salva le mediane, `--contro file` le confronta (vinte alla prima, domande, forza sull'atteso, danno a risposta, gemme non spese, armi utili,
  risalite).

## Il giro del 14 ottobre (30 storie per eroe, 6 per le strade, sorgenti dopo il merge dei muri della cripta)

Tre giri: **prima** (`risalita.acceso=0,scaffale=0`), **solo salite** (`scaffale=0`), **dopo** (di difetto). Mediane alla fine di ogni discesa, curioso di arma prima
(altare · cantine · torre · gallerie · cisterna · labirinto · fondo):

| | prima | solo salite | dopo |
|---|---|---|---|
| forza sull'atteso | 0 · +1 · 0 · 0 · +1 · −1 · −1 | stessa (−1 alla fine) | 0 · +1 · +1 · +2 · +4 · **+6 · +6** |
| danno a risposta % | 121 · 304 · 227 · 150 · 130 · 156 · 127 | 113 · 256 · 223 · 150 · 133 · 154 · 130 | 197 · 345 · 296 · 221 · 217 · 248 · 208 |
| gemme non spese | 3 · 132 · 357 · 771 · 1,4k · 2,7k · **4,0k** | 4 · 130 · 355 · 797 · 1,5k · 2,9k · 4,1k | 4 · 57 · 84 · 112 · 156 · 203 · **288** |
| risalite a discesa | 0 | 1,4 · 1,7 · 1,7 · 2,0 · 2,6 · 5,6 · 5,3 | 1,7 · 2,0 · 1,8 · 2,6 · 2,9 · 7,0 · 5,9 |
| armi utili (mediana) | 3 · 3 · 2 · 1 · 1 · 1 · 1 | 3 · 3 · 1 · 1 · 0 · 2 · 0 | 3 · 4 · 3 · 3 · 3 · **5 · 4** |
| vinte alla prima % | 96 · 98 · 97 · 95 · 100 · 97 · 98 | 99 · 96 · 95 · 93 · 99 · 90 · 89 | 96 · 93 · 96 · 91 · 99 · 93 · 98 |
| domande (mediana) | 20 · 77 · 60 · 54 · 61 · 140 · 97 | uguali ±3 | 19 · 75 · 60 · 52 · 58 · 124 · 78 |

- **Le risalite da sole non cambiano niente**: il banco del passo si esaurisce in una discesa e le gemme restano. Il guasto non era «non sale», era «non c'è niente che compri».
- **Con lo scaffale le gemme spariscono (da 4,0k a 288) e l'eroe cambia classe**: forza +6 sull'atteso alle ultime due discese (era −1), danno a risposta 208% (era 127%). Nel rapporto dei
  bersagli il curioso **non sviene più** dalla cisterna in giù (0% contro 15–18%), **esce dal grosso con il 74–90% della vita** (bersaglio 40–70%) e il 90° percentile entra stravincendo
  (sopra il 90%: 56–82% degli scontri, bersaglio ≤ 55%). Il gioco, per chi sfrutta tutto il banco, **dalle gallerie in giù è troppo facile**; chi va dritto (il bravo) resta a −1 e vince di più
  (98–99% alle ultime due, era 88 e 78). Le domande scendono (140 → 124 al labirinto, 97 → 78 al fondo): si muore meno e si ripete meno.
- **Le armi nuove**: le utili a discesa del curioso, comprate · trovate: 1,7+1,7 · 3,1+0,6 · 2,7+0,1 · 3,1 · 3,3 · **5,0** · 4,0 (prima 2,7 · 3,1 · 1,8 · 0,8 · 0,6 · 1,6 · 0,8). Il bersaglio
  di 3 regge fino alla cisterna e poi va oltre al labirinto (5): **troppo generosi dalla fine in giù, per le gemme** (i pezzi trovati contano zero: ogni drop è peggiore di quello che si compra) e
  **troppo avari prima** (fra le gallerie e la cisterna chi non sale compra e trova meno di 1). I trovati che non servivano sono 5–11 a discesa (soldi per il rigattiere, non armi).
  Il bravo sta a 2 a ogni discesa: il fabbro per lui non è generoso.
- **La strada che beve tutto** ora ferma il bravo: alle cantine e alla torre il 13% resta bloccato (era l'8%), perché con meno pezzi comprati prima delle pozioni arriva più debole;
  il curioso e lo sbadato, che comprano molto, sono a +6 come arma prima.
- **Chi vince bevendo** è quasi sparito: dal labirinto in giù il curioso beve 0–3 pozioni a discesa.

## Il giro delle gemme (14 ottobre sera)

Decisione dell'utente: il fabbro non deve far pagare di più (le pozioni diventerebbero relativamente economiche): la regola è «un pezzo utile costa quanto uno zaino pieno di pozioni»
([bottega.md](bottega.md)), e la leva sono le gemme dei mostri (`potenza.gemme`, di difetto 1, adesso **0,5**). Dopo il merge delle cinque cure. Curioso di arma prima, mediane
(altare · cantine · torre · gallerie · cisterna · labirinto · fondo), prima (1) → dopo (0,5):

| | prima | dopo |
|---|---|---|
| armi utili (comprate · trovate) | 1,7+1,6 · 3,2+0,6 · 2,7+0,1 · 2,8+0,1 · 3,4 · 5,3 · 4,3 | 1,0+2,1 · 2,0+1,2 · 2,3+0,2 · 2,0+0,1 · 2,5+0,1 · 4,3 · 4,0 |
| forza a fine sull'atteso | 0 · +1 · +1 · +2 · +4 · +6 · +7 | 0 · +1 · +1 · +2 · +2 · +4 · +4 |
| gemme non spese | 4 · 57 · 49 · 108 · 144 · 221 · 342 | 3 · 32 · 39 · 47 · 119 · 152 · 206 |
| vinte alla prima % | 96 · 90 · 93 · 94 · 98 · 92 · 94 | 98 · 93 · 84 · 99 · 98 · 97 · 96 |
| discese con uno svenimento % | 32 · 13 · 37 · 24 · 5 · 2 · 0 | 38 · 13 · 45 · 36 · 7 · 6 · 2 |
| vita dopo il grosso % | 40 · 59 · 53 · 71 · 77 · 78 · 89 | 35 · 58 · 49 · 66 · 71 · 71 · 86 |

Il bravo (dritto): utili 2 a discesa (1,4–2,3), forza −1 · −1 · −3 · −2 · −2 · −1 · −3 (prima −1 · −1 · −3 · −2 · −1 · −1 · −1), vinte alla prima 100 · 65 · 73 · 90 · 88 · 93 · 95.

- **La leva funziona fino a un punto**: le gemme non spese si dimezzano e i pezzi utili tornano intorno a 3 fino alla cisterna (4 al labirinto e al fondo), ma la forza del curioso
  resta a +4 alla fine. Anche a 0,05 resta +2/+3 e compra ancora 1–2 pezzi a discesa: **la forza del curioso è per metà il livello** (esce a +2 livelli sull'atteso, la curva
  dell'esperienza non è di questo giro) e il resto viene da forzieri e rivendite; il bersaglio 0…+2 non si raggiunge con le gemme dei mostri. Il bravo, che prende pochissime gemme,
  perde di più del curioso.
- **0,5 è il minimo per la cripta**: a 0,25 chi esce dalla cripta ha 5–8 💎 e la prima arma ne costa 9 (4 controlli di `misure/sotterraneo`); a 0,5 passano. A 0,5 le
  misure ritrovano rosse le discese «dritte» di cantine, gallerie e labirinto (69 · 68 · 63%), oltre alla torre e al fondo che erano già rossi.
- **Il prezzo pagato**: `unita/sotterraneo` (già rossa) passa da 1 a 3 controlli rossi (gallerie, labirinto e fondo, «si vince 8 volte su 10» a 3/6 contro i 4–5/6 di prima, sei semi soltanto),
  e il bravo perde 3–7 punti di vinte alla prima. Tornare a 1 è un numero solo (`VALORE_DELLA_POTENZA.gemme`).
- **I pezzi trovati non servono dalla torre in giù** (0,0–0,4 a discesa) e non per il livello: **provato** il raro del grosso a +2, +3, +5, +6 livelli, il migliore di 4, 6 e 8
  pescati, e salendo di un livello alla volta finché alza l'eroe (fino a +8): i trovati restano a 0,1–0,8. Il curioso porta già salti di +7 livelli comprati (bipenne di livello 18 a
  livello 12 d'eroe), e un raro più alto non si regge o non lo batte; la cosa che si porta addosso si guadagna con le gemme. Un forziere o un caporale che lasciano di più non
  cambiano la sostanza. **Non applicato**: la proposta minima è abbassare ancora l'entrata del curioso (forzieri, rivendita) e riguardare i trovati dopo, o dichiarare che oltre
  la cisterna i drop sono per il rigattiere.
- **Il rapporto pezzo / pozione** (`rapportoPezzoPozione`, nel rapporto e in `--salti`): salto mediano 76 · 72 · 127 · 162 · 169 · 204 · 181 · 213 ai livelli 1 · 2 · 4 · 6 · 8 · 10 · 12 · 14,
  cioè 3,6 · 3,4 · 6,0 · 7,7 · 8,0 · 9,7 · 8,6 · 10,1 Pozioni da 21; contro l'Ampolla maggiore (200) vale una; contro la Boccetta (8) nove al livello 1.
- **Da rifare** quando bere nello scontro non costerà più il turno (e una sola pozione per turno): le pozioni diventano più forti e questi numeri cambiano.
- Tempo: un giro a freddo, 150 s (dopo il merge dei muri della cripta); da checkpoint meno di un secondo.

## Il livello dei pezzi (14 ottobre sera)

Regola dell'utente: un pezzo si indossa dal suo livello ([livello-dei-pezzi.md](livello-dei-pezzi.md)). **Il metro è il curioso**, quello che gira tutto: l'utente, «il modo
corretto di giocare è esplorare tutte le stanze, non andare secco all'obiettivo; farmare dà vantaggi ma implica anche più operazioni, quindi per me va bene».
Che il curioso esca un paio di livelli sopra l'atteso va bene; il bravo, che va dritto, può restare un po' sotto purché non trovi un muro. Curioso di arma prima, mediane
(altare · cantine · torre · gallerie · cisterna · labirinto · fondo), prima → dopo, sullo stesso albero (dopo i merge di bere senza turno e delle pozioni a cinque stadi):

| | prima | dopo |
|---|---|---|
| forza a fine sull'atteso | 0 · +1 · +1 · +2 · +3 · +4 · +4 | 0 · +1 · +1 · +2 · +1 · 0 · 0 |
| armi utili (comprate + trovate, per discesa) | 1,0+2,1 · 1,9+1,1 · 2,4+0,2 · 2,1+0,1 · 2,4+0,1 · 4,2+0,0 · 3,9+0,0 (mediane 3 · 3 · 3 · 2 · 2 · 4 · 4) | 0,9+2,2 · 2,0+1,3 · 2,0+0,3 · 1,7+0,1 · 1,4+0,1 · 1,7+0,3 · 1,3+0,2 (mediane 3 · 3 · 2 · 2 · 1 · 2 · 1) |
| gemme non spese | 3 · 39 · 62 · 87 · 114 · 181 · 212 | 4 · 62 · 80 · 91 · 123 · 285 · 449 |
| vinte alla prima % | 98 · 98 · 100 · 98 · 100 · 98 · 96 | 98 · 98 · 98 · 97 · 99 · 97 · 94 |
| discese con uno svenimento % | 21 · 3 · 13 · 6 · 3 · 0 · 0 | 20 · 1 · 10 · 8 · 6 · 9 · 9 |
| pozioni bevute a discesa | 1,5 · 3,4 · 4,1 · 2,8 · 1,4 · 1,9 · 0,1 | 1,4 · 2,9 · 3,7 · 2,8 · 2,0 · 8,7 · 5,1 |
| domande (mediana) | 19 · 76 · 61 · 53 · 59 · 131 · 80 | 19 · 75 · 60 · 53 · 60 · 139 · 93 |

Il bravo: forza a fine −1 · −1 · −3 · −2 · −2 · −1 · −3 invariata, vinte alla prima 100 · 66 · 73 · 89 · 88 · 93 · 95 → 100 · 68 · 71 · 89 · 85 · 89 · 89 (perde 3–6 punti dalla cisterna in giù); i muri
alle cantine e alla torre c'erano già (8–10 storie su 120 bloccate).

- **La regola spegne il +4/+6 del curioso**: la forza torna a 0…+2, dove l'utente la vuole. Il prezzo è che il banco ha meno da vendere («armi utili» da 4 a 1,5 al labirinto e al fondo) e
  il curioso **accumula gemme** (449 al fondo, 212 prima): quello che compra subito si esaurisce, il resto sono pezzi per dopo che il livello non sblocca in fretta. Da guardare.
- **Il curioso beve di più dal labirinto** (8,7 pozioni a discesa contro 1,9) e fa più domande al fondo (93 contro 80): senza la forza in più i mostri si battono più lentamente. Svenimenti
  dal 0% al 9% alle ultime due: nel bersaglio 20–60% non entrano comunque.
- **Più pezzi per dopo non servono**: `--tara risalita.perDopo=4` (da 2) dimezza le gemme non spese del fondo (449 → 246) e lascia la forza a 0 e le armi utili a 1,6. Il giocatore finto
  compra, ma il livello è quello che decide.
- **N e non N−1**: provato `MARGINE_DEL_LIVELLO = 1` (il pezzo del livello dopo si porta già) sullo stesso albero: forza 0 · +1 · +1 · +2 · +1 · 0 · 0, utili 3,1 · 3,3 · 2,2 · 1,8 · 1,5 · 1,9 · 1,7. Identico: il banco
  vende pezzi di molti livelli sopra, e uno solo di margine non li tocca. Si tiene N, che si spiega in una riga.
- **Il bottino non si è toccato** (livello `max(posto, eroe)`): i pezzi che cadono in una zona sopra l'eroe restano chiusi. Provato in scratch a metterli sempre al livello dell'eroe (solo i test
  unitari, non il giro): l'abisso rientra nel tetto di 40, la cisterna di `unita/sotterraneo` resta rossa (4/6). È la leva da guardare se i trovati devono pesare di più; non applicata.
- **Costi nei test**: `unita/sotterraneo` ha una verifica rossa in più (la cisterna a 3/6 invece di 5/6, in aggiunta a gallerie, labirinto e fondo già rossi) e `unita/sotterraneo-abisso` ha il tetto per piano
  a 45 domande e non 40 (il seme 7 al piano 11 passa da 36 a 41).

## Il livello del bottino e due pezzi subito (14 ottobre, notte)

Due decisioni dell'utente sul giro di sopra: **un pezzo trovato nasce al livello dell'eroe con una variazione −1…+2** (e il grosso ogni tanto 3 o 4 sopra,
[livello-dei-pezzi.md](livello-dei-pezzi.md#il-livello-di-un-pezzo-trovato)) e **il banco ha due pezzi da mettersi subito per linguetta** (`SUBITO_PER_LINGUETTA`, e
quattro tentativi di abilità per livello e rarità invece di due). Curioso di arma prima, mediane (altare · cantine · torre · gallerie · cisterna · labirinto · fondo), prima → dopo:

| | prima | dopo |
|---|---|---|
| armi utili (comprate + trovate) | 0,9+2,2 · 2,0+1,3 · 2,0+0,3 · 1,7+0,1 · 1,4+0,1 · 1,7+0,3 · 1,3+0,2 | 1,0+1,5 · 2,3+1,3 · 2,2+0,1 · 1,8+0,1 · 1,7+0,1 · 1,8+0,1 · 1,6+0,1 |
| forza a fine sull'atteso | 0 · +1 · +1 · +2 · +1 · 0 · 0 | −1 · −1 · +1 · 0 · +1 · −1 · −1 |
| gemme non spese | 4 · 62 · 80 · 91 · 123 · 285 · 449 | 3 · 49 · 64 · 77 · 96 · 240 · 362 |
| pozioni bevute a discesa | 1,4 · 2,9 · 3,7 · 2,8 · 2,0 · 8,7 · 5,1 | 1,5 · 4,1 · 4,6 · 3,5 · 2,7 · 9,1 · 6,3 |
| vinte alla prima % | 98 · 98 · 98 · 97 · 99 · 97 · 94 | 98 · 93 · 99 · 96 · 99 · 93 · 98 |
| discese con uno svenimento % | 20 · 1 · 10 · 8 · 6 · 9 · 9 | 20 · 13 · 21 · 18 · 8 · 13 · 9 |

Il bravo, vinte alla prima: 100 · 68 · 71 · 89 · 85 · 89 · 89 → 100 · 53 · 67 · 87 · 88 · 92 · 82. Lo sbadato (bersaglio ≤ 15%): 80 · 94 · 87 · 93 · 97 · 85 · 88 → 78 · 80 · 81 · 91 · 92 · 82 · 86.

- **Il banco dà qualcosa** (due pezzi subito, da solo: comprati 1,0 · 2,2 · 2,0 · 1,9 · 1,6 · 1,8 · 1,4, utili 3,0 · 3,3 · 2,3 · 2,0 · 1,7 · 2,1 · 1,6; gemme non spese −10…−20%), **ma non quanto serve**: il bersaglio
  è 3 e dalla torre in giù si sta a 1,7–2,3.
- **Il livello del bottino non è il problema**: con la variazione azzerata (eroe esatto) i numeri sono identici a quelli di prima, al decimale. Il curioso è sempre sopra il livello atteso della discesa
  (4 contro 3 alla torre, 12 contro 10 al fondo) e il bottino era già al suo livello; i pezzi trovati sono 0,1 a discesa dalla torre in giù perché **non migliorano quello che ha**: nove su dieci sono comuni
  o magici e il fabbro gli dà ogni volta il meglio del suo livello, rari compresi. 4–6 pezzi a discesa cadono e restano inutili.
- **La variazione costa forza**: −1 livello è un pezzo appena peggiore, +1 e +2 stanno chiusi finché non sale, quindi solo il 45% è utile subito; il curioso passa dal bersaglio 0…+2 a −1 in quattro
  discese su sette, con più svenimenti (le cantine da 1% a 13%) e più pozioni (4,1 contro 2,9). Il bravo perde alle cantine (68 → 53).
- **Lo sbadato non rientra** (78–92% contro ≤ 15%): non lo salvano le risalite (`--tara risalita.acceso=0`: 72 · 79 · 82 · 92 · 97 · 93 · 88, uguale a prima). Bevono: 9 · 8 · 9 · 7 · 18 · 16 pozioni a discesa dalle cantine
  in giù, 3–7,5 fonti, e svenire è concesso 5–7 volte a discesa (`svenimentiDi`: `SVENIMENTI_IN_REGALO` più i piani) senza perdere la discesa. Leve non applicate: un tetto di pozioni per scontro, il costo
  del turno rimesso a chi beve sotto una soglia, o meno svenimenti concessi; prima va misurato quanti ne spende lo sbadato.

## I tempi

Con 4 processi: **il giro a freddo dura 212 s** (7 discese più la spesa in uscita 4,7 · 13,3 · 13,9 · 23,8 · 27,7 · 52,8 · 39,7 · 35,6 s), contro i 65 s di prima; solo con le salite e senza scaffale 79 s.
**Da checkpoint meno di un secondo**, e una discesa toccata rifà solo quella e le dopo. Il costo è lo scaffale (`Bottega.prepara`: 40–80 ms a banco, con le sue ricerche dei salti): una storia
passa da 1,1 a 4,0 s (2,4 con `--tara risalita.rivedi=0`, che non rimette in discussione i banchi salendo di livello). Il minuto del giro intero non c'è più; `--presto` e le tappe con
`--da K --fino K` restano rapide.

## Cosa resta

- La soglia, il bersaglio di 3 armi utili e i bersagli di sotto (forza a fine discesa del curioso, vita dopo il grosso) sono da confermare con l'utente: i giocatori finti adesso sfruttano il banco
  e la discesa dalle gallerie in giù esce troppo facile; prima di girare una manopola va capito se è colpa del banco (gemme `potenza.gemme`, salti e sogni) o dei mostri.
- Il tempo: l'ostacolo è `Bottega.prepara`/`ruoloDi`, che ripetono lo stesso confronto (`confronto`, `punteggio`) per ogni candidato. Una memoria dei confronti per stato dell'eroe taglierebbe quasi tutto, ma sta nel motore del gioco.
- Le risalite non guardano la torcia né la luce: il giocatore non compra torce (`allaBottega` non le ha mai comprate).
- I trovati che non servivano restano da leggere: se sono 10 a discesa il drop è per lo più rumore.
