[← torna al README](../README.md)

# 🗺️ Il sotterraneo

*Un posto che si gira col dito, dove ogni cosa che vale ha un prezzo — e il
prezzo è rispondere.* È fra i **giochi in prova**: si accende dalla pagina
dei grandi, sotto «i giochi in prova».

## Cos'è, e cosa non è

Si cammina in un sotterraneo visto dall'alto: si tocca dove si vuole andare,
si entra nelle stanze, si toccano le cose. Non c'è nessuna azione
interessante che si compia senza rispondere, e nessuna risposta che non apra
qualcosa che si vede.

| cosa si tocca | cosa costa |
|---|---|
| 🚪 una porta chiusa | una domanda facile — sbagliando si riprova |
| 🎁 un forziere | **una domanda sola, tosta**: se la sbagli resta chiuso per sempre |
| 👹 un mostro | una domanda per colpo, finché non cade |
| ⛲ una fonte | una domanda, e ti ridà vita |
| 🏪 un mercante | niente domande: qui si **spende** quello che le domande hanno fruttato |

**Non è [il Dungeon](dungeon.md), e non lo sostituisce.** Quello è un gioco a
carte: una mappa a nodi, un bivio alla volta, non si torna indietro. Questo è
un posto invece che un diagramma. I due fanno cose diverse con gli stessi
esercizi; se un giorno se ne terrà uno solo, sarà perché i bambini avranno
detto quale.

## Perché l'esercizio non annoia

La tentazione, in un gioco di esplorazione, è mettere il quiz *accanto* al
gioco: cammina, e ogni tanto una domanda. Non funziona, perché quella domanda
diventa un pedaggio che interrompe la cosa bella. Qui è il contrario:
**l'esercizio è la chiave, la spada e il piede di porco**.

Le domande arrivano dai moduli di quiz come in tutti gli altri giochi — sono
di tutte le materie, non solo matematica — e si fanno più difficili in due
modi insieme: **scendendo** (ogni piano alza l'asticella) e **scegliendo**
(un forziere chiede più di una porta). Un bambino prudente vede domande più
facili di uno che va a caccia di scrigni, e le vede nella stessa discesa.

## La scelta, anche potendo tornare indietro

Si può girare tutto, e non è un difetto: il peso viene da un'altra parte. La
mappa contiene sempre **più roba di quanta ne farà un bambino in una
seduta**, e sbagliare costa vita — chi ripulisce tutto arriva alla scala con
mezzo cuore. La scelta non è «quale porta» ma **«dove spendo le risposte»**,
ed è una scelta che si fa *sapendo*.

I **segni sopra le porte** servono a questo: 💀 c'è una guardia, 💎 roba
buona, 🏪 un mercante, ⛲ acqua. Si leggono **prima** di pagare, e non
mentono mai — dietro un teschio c'è davvero una guardia. Se un segno
promettesse a vuoto diventerebbe una decorazione, e con lui se ne andrebbe
l'unico motivo per cui tornare indietro è una scelta e non una penitenza.

## La scala è chiusa, e la chiave ce l'ha un guardiano

È la regola che tiene in piedi tutto il resto, e si è vista solo misurando: i
mostri **si possono aggirare tutti**, quindi senza di lei un bambino sveglio
scenderebbe di piano in piano senza rispondere a una domanda sola. Adesso il
minimo assoluto per scendere è battere un guardiano, e tutto il resto resta
facoltativo — che è quello che si voleva.

## Quanto costa una discesa, in domande

Misurato dal banco di prova (`motore/banco.js`, un giocatore finto che scende
davvero), non a occhio:

| discesa | piani | solo il guardiano | tutto il piano |
|---|---|---|---|
| Le cantine | 2 | 11 | 29 |
| Il pozzo | 3 | 41 | 64 |
| Le gallerie | 3 | 28 | 64 |
| La cisterna | 4 | 44 | 111 |
| Il labirinto | 3 | 50 | 104 |
| Il fondo | 4 | 44 | 91 |

**La forbice è il punto.** Se «tutto» costasse quanto «il minimo», in mezzo
non ci sarebbe più niente da scegliere — e la scelta è il motivo per cui un
posto è un posto. Il tetto sopra è una seduta: oltre le ottanta risposte
obbligate non è più un gioco, è un compito, e il test diventa rosso.

## Le tre luci

Nero = non ci sei mai stato. Scuro e freddo = te lo ricordi. Pieno e caldo =
lo stai guardando adesso. Un sotterraneo tutto illuminato è una piantina, e
su una piantina non c'è niente da esplorare — la piantina c'è, ed è la
**mappina** in alto a destra, che mostra solo quello che si è visto più i tre
punti che servono: dove sei, dov'è la scala, chi ha la chiave.

## La stanza è il confine

I mostri dormono finché non entri nella **loro** stanza; da lì ti vengono
addosso, e smettono appena esci. Non è una gentilezza: un mostro che ti
insegue per tutto il piano trasformerebbe il sotterraneo in una fuga
continua, uno che sta fermo in un percorso a ostacoli. Così il corridoio
diventa il posto dove si è al sicuro e **la soglia diventa una decisione**.
Sono anche più lenti di te, perché scappare deve funzionare sempre: «scappo
via» non è un bottone, è uscire di lì.

## Cosa resta fra una discesa e l'altra

**Niente.** Dentro una discesa l'equipaggiamento scende con te di piano in
piano, ed è l'arco che dà senso a cercare una spada; fra una discesa e
l'altra si riparte nudi. Quello che resta è la campagna — le discese
superate, le stelle — e le monete nel salvadanaio.

Non è pigrizia: un equipaggiamento che persiste vuole un'economia (dove si
ripara, cosa si rivende, come si evita che l'ultima discesa sia una
passeggiata per chi ha l'ascia), e quella economia è un altro gioco. Se un
giorno la si vorrà, si cambia in `dati/campagna.js`.

## Una discesa si può lasciare a metà

Tre o quattro piani, quaranta domande, venti minuti buoni: una discesa dura
più di quello che un bambino ha davanti prima di cena. Prima, uscire voleva
dire buttarla via.

Adesso **si esce e si riprende**. Uscendo si scrive dove si era, e la mappa
delle discese lo offre in cima: «piano 2 di 3 · ❤️ 14 · 💎 37 — torno giù da
dove ero». Il piano non si salva, si **rifà dal seme**: sono le celle a
essere una funzione del numero. Quello che si salva è ciò che è *successo*
— chi è caduto, cosa si è aperto, cosa sta per terra, quanta mappa hai
girato — perché lì di mezzo c'è il caso, e il caso non si riavvolge. Un
salvataggio pesa un paio di chilobyte (`motore/sosta.js`).

Due scelte dentro questa:

- **Riprendendo, i mostri sono tornati al loro posto.** Riaprire il gioco
  con l'orco addosso e un colpo già partito è il modo più rapido di far
  pentire qualcuno di aver ripreso. È la stessa regola del risveglio dopo
  uno svenimento.
- **Si salva sempre**, anche dopo due passi e a mani vuote. La regola con
  l'eccezione — «solo se hai fatto abbastanza» — sembrava più pulita e non
  lo è: quello che si perde in una discesa appena cominciata non sono le
  gemme, è **la mappa già girata**, e girare al buio è metà del gioco.

Se il formato del salvataggio cambia, quello di ieri **non si legge**: si
ricomincia la discesa. Una partita persa è un dispiacere; una partita
ripresa con dei campi che non tornano è un gioco rotto in un modo che
nessuno sa spiegare.

## Chi scende, e cosa si porta

Quattro eroi — cavaliere, elfa, mago, nano — e la differenza sta in **due
numeri soli**: quanto reggi e quanto fai male. Niente tratti nascosti,
niente abilità da ricordare: sono le due colonne che compaiono nella
scelta, e un bambino di sette anni le confronta da solo.

| | vita | braccio | com'è |
|---|---|---|---|
| 🛡️ Cavaliere | 24 | 3 | tiene botta |
| 🧝 Elfa | 20 | 4 | colpisce più forte, regge meno |
| 🧙 Mago | 16 | 5 | i mostri cadono in metà risposte, ma ogni sbaglio fa malissimo |
| 🧔 Nano | 26 | 3 (difesa 2) | sbagliare gli fa quasi il solletico |

Il costo di un mostro è le sue ossa diviso il tuo braccio, quindi
l'attacco è la manopola **velenosa**: la stessa campagna costa 13–33
domande al cavaliere e 8–21 al mago, che però sviene molto più spesso.
Nessuno scende sotto braccio 3 — con 2 l'orco costerebbe dodici risposte
di fila, che non è difficile: è lungo. I numeri li misura il banco
(`unita/sotterraneo` gioca la campagna con tutti e quattro), non l'occhio.

Si sceglie **una volta e resta**, dalla mappa delle discese: chiederlo
prima di ogni discesa sarebbero due tocchi in più ogni volta, e la
risposta sarebbe la stessa di ieri.

Addosso ci sono **tre caselle**: la mano, il corpo, il dito. Le armi sono
quattro famiglie in tre gradini — spade, asce, archi, bacchette — e a
parità di gradino **valgono lo stesso**: è la regola dei due rami di una
torre nel castello, cambia la forma e mai la quantità, perché altrimenti
ci sarebbe una famiglia giusta e tre da evitare. Al dito ci va l'unica
cosa che non picchia: vedere più lontano, tornare su con più gemme,
reggere un colpo in più. Ce n'è uno solo, quindi si sceglie.

Nello zaino le caselle stanno **intorno alla figura** di chi le porta,
con in pugno l'arma vera: guardando si vede come si è messi, senza
leggere una riga.

## Come è disegnato

Con due fogli: **0x72, «16×16 DungeonTileset II», CC-0** per il mondo, i
mostri e i quattro eroi, e un foglio di oggetti per quello che si
raccoglie — armi, pozioni, gioielli, e l'arredo delle stanze. L'atlante
ritagliato su misura pesa 34 KB per 162 pezzi, incorporato in base64 —
il build resta un file solo.

Il foglio degli oggetti arriva **senza canale alfa e a tripla
grandezza**: il fondo nero lo toglie `atlante.py` allagando dai bordi
(`"fondo": "auto"`), e la scala è dichiarata `3` — misurata per
proporzione contro le armi 0x72 che già c'erano, non indovinata (una
spada ridotta deve stare fra i 13 e i 37 px del set, e 1254 diviso 3 fa
418 esatto). Una scala sbagliata non dà nessun errore: dà un'arma alta
il doppio dell'eroe.

**L'arma si posa accanto al pugno**, staccata, e respira col passo: è
quello che permette a dodici armi di andare bene per quattro
personaggi senza disegnarne quarantotto.

Le stanze hanno un po' d'arredo — barili, casse, ossa, uno stendardo
appeso, un braciere che arde e fa luce. Non si tocca, non blocca, non
vale niente: serve solo a far sembrare che qui sotto ci abbia vissuto
qualcuno. Un sotterraneo di stanze vuote e mostri si legge come un
diagramma, e un diagramma non fa venire voglia di girare l'angolo. Lo monta `strumenti/sprite/atlante.py`
(vedi il suo `FORMATO.md`), che genera lo stesso PNG anche dentro il
banco `strumenti/banco/mondo.html`, che legge lo stesso modulo: se i due si scollassero, quello che si
prova sul prototipo non direbbe più niente sul gioco.

Quello che i fogli **non hanno** resta emoji: la fontana, il mercante, e
le tre armature — in nessuno dei due c'è un'armatura, uno scudo o un
elmo, si equipaggiano solo le mani. Si vede che stonano, ed è il
tipo di buco che va guardato *prima* di innamorarsi di un set.

## Da guardare in mano a un bambino

Tre numeri sono tarati a occhio e vanno visti giocare:

- **quanto sono più lenti i mostri** (3,1 celle al secondo contro 5,4) e i
  **tre secondi di calma** dopo una fuga: sono i numeri che decidono se una
  stanza fa paura o fa arrabbiare;
- **quante stanze per piano** — si comincia da quattro e si arriva a sedici,
  ma se un piano non si finisce mai la scala smette di essere un traguardo;
- **il suono**, che qui dentro c'è appena.
