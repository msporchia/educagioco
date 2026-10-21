# Decisioni per l'utente

Quello che il codice non può decidere. Per ognuna: le opzioni con pro e contro, e una **raccomandazione** (un'indicazione, non una
scelta fatta). Finché non c'è una risposta, i giri che ne dipendono restano fermi ([piano-a-giri.md](piano-a-giri.md)).

## D1 — Cosa succede ai salvataggi della 2D (blocca G1)

| opzione | pro | contro |
|---|---|---|
| **a. Si riparte da zero**, con un regalo di monete o di livello alla pari di quello che si aveva | niente codice di conversione; nessun bug di migrazione | un bambino perde la sua fattoria (terra, bestie con nome, addobbi): contro «non si perde nessun salvataggio»; il regalo di monete rompe la regola «le monete vengono solo dagli esercizi» |
| **b. Si converte** livello e roba (`statoDa2D`, funzione pura) | nessuna perdita; il passaggio è invisibile; con la stessa scaletta (D2) il livello si porta uguale | si scrive e si prova una conversione su 70 livelli; ogni cosa 2D senza equivalente 3D (cuccia, 190 decori) va tradotta o regalata |
| **c. Le due fattorie restano in parallelo**, la 2D si spegne solo quando la 3D copre tutto (S5) | zero rischio sui dati; si può tornare indietro | due posti dove spendere (viola «il money pit è uno»); doppia manutenzione; i bambini si dividono |

Indicazione: **c fino ai P0, poi b**, e la 2D resta leggibile (non cancellata) un periodo dopo il passaggio.

## D2 — La scala dei livelli e dei prezzi

| opzione | pro | contro |
|---|---|---|
| **allinea alla 2D** (stessi livelli e prezzi: la 3D è la 2D con un'altra pelle) | scaletta già tarata su ~200 ore; il livello si migra senza conversione; nessun «arriva prima» | tutto il contenuto della 2D va portato per riempire 70 livelli |
| **tieni la scala corta** (18 livelli) e allunga con nuovo contenuto 3D | si parte da quello che c'è | ~8 ore: la 3D non regge mesi; livelli diversi → conversione a mano |

Indicazione: **allinea**.

## D3 — Il livello del fienile (a)
2 (oggi: il mangime c'è prima dei recinti; la soglia dal livello 3 sale di 40) o 1 (la roba del livello 1 non entra nella soglia, ma un «!» per un
edificio inutile fino al 4). Indicazione: **2**, con D2 il problema sparisce (2D: livello 6).

## D4 — I tempi della pesca (b)
12 s di attesa, 60 s di riposo: nessuna controparte 2D. Con D9 si decide la scala; indicazione: tieni finché la pesca resta ✳, poi
riallinea alla scala scelta.

## D5 — Vendere ai vicini non dà monete (c)
Indicazione: **tieni**. È la regola della 2D («niente si vende»): un solo rubinetto di entrata, gli esercizi.

## D6 — Comprare dai vicini non dà esperienza (d)
Indicazione: **tieni**. Dare esperienza a chi compra roba e poi la consegna al banco la contarebbe due volte.

## D7 — Il fienile di scena e la macchina fienile sono due fienili (e)
Indicazione: **togli quello di scena**: «tre mangimi, tre bocche» si insegna con un fienile solo. Costo: toccare `FISSI`,
`POSTI_STORICI` e gli alberi dei lotti storici; un salvataggio vecchio non perde niente.

## D8 — I laghetti naturali accanto a quelli costruiti (f)
Indicazione: **tieni**, ma i naturali non si spostano e non si comprano: la distinzione tra «paesaggio» e «mio» va detta nella carta.

## D9 — I tempi di crescita (h)
Secondi (colture ×8–22, ricette ×60) o minuti come la 2D?

| | pro | contro |
|---|---|---|
| secondi | si gioca restando; i bambini piccoli non aspettano | la catena si compie in un minuto; la roba si accumula; il «torna più tardi» (la 2D) si perde |
| minuti come la 2D | stesso ritmo; la tabella del premio e il tetto 🪙6/min tornano; nessun accumulo | più attesa: serve il lavoro in fila sempre utile |

Indicazione: **minuti alla 2D** per le macchine e le bestie, **brevi i primi livelli** per l'avvio.

## D10 — Le funzioni solo 3D: tieni o allinea

| funzione | indicazione | perché |
|---|---|---|
| mondo senza confini | tieni | è la ragione del 3D; il prezzo si auto-limita |
| mare, laghi, pesca, molo, porticciolo | tieni | pesce, friggitoria e sushi bar sono già la 2D; la peschiera 2D si riduce a una scelta (A1k) |
| vicini col trattore, cassa, mercato che compra | tieni, allinea il carretto 2D a una vista del trattore | il carretto 2D serve a svuotare lo scomparto (C15): con D11 va dentro |
| guardaroba del contadino | tieni | gratuito, non spostava nessuna soglia |
| compagni (Watson, Sherlock, Irene, Pepe) | tieni **e** aggiungi le bestie che si curano | gli animali veri di casa sono scelta sua; la cura è la spesa quotidiana (A5–A8) |
| crescita continua dei campi, tre stadi delle bestie | tieni | più leggibile |
| 4 tessere per campo | vedi D12 | |
| visite agli amici | tieni pronto, non collegare | consenso dei genitori e moderazione ([../vicini.md](../vicini.md)) |

## D11 — Silos e scomparti
**Allinea** in forma più piccola (un magazzino con scomparti per merce, 8 +2): è il rubinetto che non si chiude e insegna la catena.
Alternativa: tetto unico e visibile. Contro: un tetto frustra chi gioca a raffica.

## D12 — Quattro tessere per campo o una
Indicazione: **tieni le quattro tessere** (si leggono meglio, ✳) ma il campo intero deve rendere come uno della 2D (1 pezzo in tutto), oppure
resta 4 e si allungano i tempi (D9) perché 4 pezzi per campo non gonfino la catena. Da provare col metro.

## D13 — Costo di raccolta e di lavorazione
Indicazione: **allinea** (🪙1–2 a gesto): è un rubinetto quotidiano ([livelli-ed-economia.md](livelli-ed-economia.md) L13).

## D14 — La 2D dopo il passaggio
Tolta dal codice, o conservata «in archivio» (`sperimentale`, spenta di base)? La 3D dipende dall'atlante, da `Provino.vue`, `catalogo`
e dati della 2D: **non si toglie nulla finché la 3D li importa**. Indicazione: archiviare, non cancellare, un periodo.

## D15 — Senza WebGL 2 o con un telefono debole
Indicazione: se la 3D diventa l'unica fattoria, serve un ripiego (la 2D resta come «modalità leggera», oppure una soglia di fascia che
non propone la 3D). Altrimenti un bambino con un telefono vecchio perde il posto dove spende.

## D16 — La riga per i bambini
Alla sostituzione una riga («La fattoria è cambiata: ora è in 3D») va **proposta** a fine lavoro e scritta solo dopo il sì
([../../genitori/novita-bambini.md](../../genitori/novita-bambini.md)).
