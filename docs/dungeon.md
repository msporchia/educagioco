[← torna al README](../README.md)

# ⚔️ Il Dungeon

*Si scende di stanza in stanza, e più si scende più le domande si fanno
difficili.* Un gioco a carte dove si sceglie sempre fra scendere ancora o
tornare su col bottino.

<img src="img/dungeon-gioco.png" width="230"> <img src="img/dungeon-mappa.png" width="230">

## Come è fatto

Ogni tappa è una discesa. Si entra in una stanza, e la stanza può essere un
mostro, un forziere, una trappola, un mercante. Davanti a una sfida il gioco
**fa una domanda**: rispondendo giusto si passa, sbagliando si perde qualcosa.

## Chi ti aspetta si vede

I mostri sono **disegnati**, non sono emoji: respirano, sbiancano quando li
colpisci e si ribaltano quando cadono. Non è una decorazione — è
un'informazione, ed è quella che si legge per prima.

Un mostro grosso **è grosso a schermo**, il capo che chiude un piano lo è
ancora di più e ha un alone attorno, il padrone di casa riempie la
schermata. Quando erano tutti larghi uguale, un capo con la vita tripla e
nessuna via di fuga si presentava con lo stesso ingombro del topo della
prima stanza: la difficoltà stava tutta nei numeri, che si leggono dopo e
più lentamente.

Chi ci abita cambia con la tappa, e cambia in fila: nella cantina si comincia
con ragni, topi e vermoni e si finisce con lo zombi impolverato; nel covo si
arriva al drago. Le **cose** invece restano emoji — uno scrigno, un fuoco da
campo, un mercante non sono qualcuno.

## Perché un bambino continua a rispondere

Questa è la parte che fa funzionare il gioco, e vale la pena dirla chiara:
**ogni risposta giusta porta bottino**.

Ci sono due caselle, **un'arma in mano e un'armatura addosso**, e tre gradi
per ognuna:

- ⚔️ l'arma dà attacco — i mostri cadono in meno scambi
- 🛡️ l'armatura dà difesa — sbagliare una domanda costa meno vita
- 💎 le gemme sono i soldi del dungeon, si spendono dal mercante

E il patto è che **i mostri difficili lasciano roba migliore**: il topo
lascia lo spadino, il mostro grosso la spada di ferro, lo scrigno in fondo la
lama del drago. Chi gira largo dai mostri grossi arriva al guardiano con lo
spadino e lo vede scendere di un punto per volta — nessuno glielo dice, lo
legge sulla barra della vita.

Il risultato è che il bambino non sta «facendo una fila di esercizi»: sta
cercando una spada migliore. Le domande sono il prezzo, e in un pomeriggio ne
risponde molte più di quante ne farebbe su una scheda — perché ogni risposta
lo avvicina a qualcosa che vuole.

Le armi buone cadono **presto**, nel primo e secondo piano: una spada trovata
alla penultima stanza non è un premio, è una notifica. Al piano più profondo
si trovano cure e gemme, perché è lì che l'equipaggiamento si usa.

Il ritiro volontario è sempre possibile: **tornare su con poco è meglio che
perdere tutto in fondo**, ed è una delle cose che il gioco insegna senza
dirlo. A fine discesa l'equipaggiamento sparisce — quello che resta è l'eroe
di base, che cresce con le tappe portate a casa.

## Quali domande escono

Qui non è matematica: sono **domande di tutte le materie** — italiano,
matematica, spazio, tempo, logica. Ortografia, sillabe, contrari, area e
perimetro, l'orologio a lancette, le sequenze da completare.

**[→ Cosa c'è dentro, materia per materia](domande.md)**

## Come cresce la difficoltà

Questa è la parte che si nota giocando, ed è deliberata: **la difficoltà
dipende da quanto si è scesi**.

Ogni tappa dichiara una fascia — poniamo *da 0,2 a 0,7* — e la domanda che
esce dipende da **a che riga del dungeon si è arrivati**: alla prima riga si
sta al minimo della fascia, all'ultima al massimo. Certe stanze hanno un
**rincaro** loro: il forziere sorvegliato chiede più del corridoio vuoto.

Quindi:

- le prime stanze di una tappa fanno domande facili;
- man mano che si scende, la stessa tappa diventa più tosta;
- le tappe più avanti partono già più in alto.

Ed è per questo che scendere ancora è una scelta vera e non un automatismo:
la ricompensa cresce, ma cresce anche quello che ti viene chiesto.

## Da 0 a 1: cosa vuol dire «difficile»

La difficoltà è **una manopola sola**, da 0 a 1, e ogni tipo di domanda la
traduce nel proprio grado: 0 è il più facile che sa fare, 1 il più difficile.
Il gioco non sa quali materie esistano — chiede «una domanda di questa
durezza» e riceve. [Come funziona il magazzino](domande.md).

## Cosa allena

Il ragionamento sotto pressione — c'è sempre la tentazione di scendere
ancora — e un ripasso trasversale che tocca materie diverse nella stessa
partita. È anche il gioco che introduce l'idea del **rischio calcolato**.

## Fermarsi: qui non serve un tasto

Negli altri giochi a orologio — [Survivors](survivors.md), il
[sotterraneo](sotterraneo.md), la [corsa](corsa.md) — c'è un **⏸** in barra.
Qui no, ed è voluto: il Dungeon è a turni, la stanza aspetta, e nessun
mostro cammina addosso mentre si pensa. Un ⏸ dove non si muove niente non
ferma niente, e un tasto che non fa niente insegna che i tasti mentono —
quando poi ne arriva uno che serve è già stato svuotato di significato.
Chi vuole smettere posa il telefono e torna quando gli pare.

L'unica cosa che qui scorre è il mezzo secondo di respiro **prima che la
domanda compaia**, e quello sì che va fermato a mano: un `setTimeout`
scatta uguale a schermo spento, quindi si riapriva il telefono e la
domanda era già lì da mezz'ora, o si apriva il `?` e ne arrivava una
dietro il foglio che si stava leggendo. Adesso si congela quello che
restava e si riparte da lì (la stessa cosa che fa `quiz/Domanda.vue` con
l'attesa dopo una risposta). Qui il ritorno **riprende da solo**, al
contrario della pausa degli altri giochi: là c'è una partita in corsa da
consegnare in faccia a chi ha appena acceso il telefono, qui c'è una
schermata ferma che resta ferma per il mezzo secondo che le mancava.

## Note per i genitori

- Le domande rispettano quello che hai spento in *Genitori → cosa sa*: se il
  bambino non ha ancora fatto le misure, quelle domande non escono, e se un
  intero grado resta senza domande valide si scende a un grado più facile
  invece di sparire.
- Si può sempre risalire prima di rischiare: il gioco non punisce chi si
  ferma, e il bottino portato a casa resta.
