# Le regole

I numeri stanno in `src/giochi/arena/dati/regole.js`, il motore in
`motore/partita.js` (senza schermo, il caso passato da fuori). Qui il perché.

## Il campo: una corsia sola

- **Una corsia, un ponte, al centro.** C'erano due corsie (come Clash Royale):
  tolte perché i nemici finivano «dietro» i muri e le caserme costruiti, e il
  muro, che copre una corsia sola, non serviva a niente sull'altra.
- Il motore conta la corsia in verticale (`y` lungo, `x` di lato), e la scena la
  disegna così, col castello di chi gioca in basso (vedi [grafica.md](grafica.md)).
- **Una partita dura 3:00.** Vince chi abbatte il castello nemico; allo scadere
  chi ha il castello più sano (entro il 5% è pari).

## Le truppe e le caserme

- Una **caserma** manda la sua truppa da sola ogni `9 / (1 + 0.12·(liv−1))`
  secondi; il livello (1-10) alza anche vita e danno (`1 + 0.25·(liv−1)`).
  Si parte con quella degli scheletri; le altre si **costruiscono** (8–16
  monete) su un posto che sceglie il gioco (il lato con meno caserme, e il
  posto più al sicuro): niente da piazzare col dito.
- **Le truppe sono otto e si distinguono per chi colpiscono, non per quanto
  valgono**: arcieri e negromanti ferirono tutti, guardiano e lupi solo chi
  cammina, il golem solo le costruzioni, i pipistrelli e il drago volano e
  scavalcano i muri. Il `guasti…()` di `dati/regole.js` pretende che ci sia
  almeno chi vola e almeno chi, da terra, ferisce chi vola.
- **Le truppe marciano lungo la corsia.** Vedono una truppa nemica a 80 e un
  edificio a 105: se c'è qualcosa in vista lo colpiscono (la più vicina), se no
  vanno verso il castello nemico. **Le caserme stanno a 100 dalla strada** (due
  file ai lati): chi passa le vede e le può rompere, chi non ci passa vicino le
  lascia stare. La prima versione puntava all'edificio più vicino *in assoluto*:
  le truppe nate ai lati tagliavano il campo in diagonale verso le caserme dei
  lati invece di marciare sulla strada (l'utente: «c'è qualcosa di strano nel
  modo in cui gira»).
- **Gli omini per squadra crescono**: una squadra di `n` truppe ne ha una in più al
  livello 5 e un'altra al 9 (`CRESCITA.omini`). È il premio che si vede sul campo,
  oltre a vita, danno e squadre più frequenti.
- Le caserme **crollano** (hanno vita, 300 + 60 per livello): il posto torna
  libero e si può ricostruire (si riparte dal livello 1). Una partita a
  caserme che nessuno può rompere sarebbe una gara di soldi.

## Le scelte che non sono truppe

Costano monete di battaglia e un calcolo, come le caserme.

| scelta | cosa fa | prezzo |
|---|---|---|
| ⛏️ Più monete | +50% di monete al secondo per livello (6 livelli: da ×1 a ×3,5) | 10, 16, 24, 34, 46 |
| 🔧 Ripara | +40% di vita alla costruzione messa peggio, muro compreso (anche crollato) | 6 |
| 🏰 Castello | più danno, cadenza, gittata e vita (+300 per livello, 10 livelli) | 8 → 66 |
| 💣 Bomba | **in regalo** (non si compra): spazza le truppe nemiche più fitte | 0 monete, un calcolo |

- **Il castello è l'unica costruzione che spara.** Prima c'era una torretta
  davanti alla base: tolta (l'utente: «più un potenziamento del castello»), e il
  castello ne ha preso la gittata (150, più 4 per livello) perché da lì deve
  coprire il muro sul ponte. La carta usa la torre del castello (a tre stadi,
  per livello), non un'emoji.
- **Il muro è uno solo per parte e non si compra**: c'è dall'inizio, chi
  cammina lo colpisce prima del resto, chi vola lo scavalca. Se crolla resta il
  cumulo e **si ricostruisce riparando** (la riparazione lo cerca per primo).
  Con due muri uno finiva «dietro» all'altro e non serviva a niente.
- **La miniera conviene presto e lascia scoperti**: è la scelta di strategia
  voluta dall'utente (produrre di più ma non attaccare); la riparazione e il
  castello più forte sono la risposta difensiva che prende tempo.

## La bomba: un regalo, non un acquisto

Ogni 40 secondi ne arriva una a tutti e due (se ne tengono al massimo due). Si lancia
con un calcolo di divisione ma **non costa monete**. **È un'arma difensiva**: colpisce
solo le truppe nemiche entrate nella *tua* metà (fra il fiume e il tuo castello), nel
punto dove sono più fitte e più vive (raggio 95, 700 di danno). Una bomba che colpisse
ovunque servirebbe a poco: spazzerebbe truppe lontane che non fanno ancora danno
(l'utente: «un'arma difensiva non offensiva, altrimenti non serve a nulla»).
Perché in regalo e non da comprare: è il «reset» per quando uno ha una forza
schiacciante e va avanti per inerzia, e chi è già indietro non ha le monete per una
cosa da comprare («non ne esci»). Il nemico la usa quando un ammasso di tue truppe entra nella
sua metà (vedi [nemico.md](nemico.md)); il giocatore finto idem (`motore/banco.js`).

## La durata

Una partita si decideva in circa un minuto (il giocatore bravo vinceva in 50 s, il
bambino di prova in 70–90) perché i castelli reggevano poco. **Castello da 4000 di
vita** (era 1600, e cresce di 300 per livello invece di 130), **muro da 1000** (era
500) e tempo massimo di **3 minuti** (era 2:30): ora il bravo vince in circa 75 s e il
bambino in circa 105. Alzare soltanto il tempo massimo non serviva: le partite
finivano molto prima.

## I dettagli («?»)

Ogni carta ha un «?»: apre `viste/Dettagli.vue` con le righe «adesso → livello dopo»
di `motore/dettagli.js` (una squadra ogni N secondi, vita e danno di ogni truppa,
vita della caserma, prezzo), chi colpisce e se vola. È pensata per **confrontare
le truppe in tranquillità** e capire quale conviene costruire; per questo il
campo sta fermo mentre è aperta. Da lì si può anche partire col calcolo.

## Il respiro

Il castello **spara da solo dal primo secondo** e il nemico parte con una
caserma e un muro: chi non fa niente resiste una cinquantina di secondi (misurato
dal banco), e nei primi nove nessuna squadra è ancora uscita. Il tempo di
decidere la strategia c'è, poi la base viene sopraffatta.

## Nei test

`[data-caserma=<truppa>]`, `[data-azione=miniera|ripara|castello]`,
`[data-monete]`, `[data-avviso]`, `[data-tappa=<n>]`, `[data-fine=vinta|persa|pari]`.
