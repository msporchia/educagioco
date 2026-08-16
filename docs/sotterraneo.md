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

## Come è disegnato

Con un foglio di tessere vero: **0x72, «16×16 DungeonTileset II», CC-0**.
L'atlante ritagliato su misura pesa 10 KB per 106 pezzi, incorporato in
base64 — il build resta un file solo. Lo monta `strumenti/sprite/atlante.py`
(vedi il suo `FORMATO.md`), che genera lo stesso PNG anche dentro il
banco `strumenti/banco/mondo.html`, che legge lo stesso modulo: se i due si scollassero, quello che si
prova sul prototipo non direbbe più niente sul gioco.

Quello che il foglio **non ha** resta emoji: la fontana, il mercante, e le
tre armature — 0x72 equipaggia solo le mani. Si vede che stonano, ed è il
tipo di buco che va guardato *prima* di innamorarsi di un set.

## Da guardare in mano a un bambino

Tre numeri sono tarati a occhio e vanno visti giocare:

- **quanto sono più lenti i mostri** (3,1 celle al secondo contro 5,4) e i
  **tre secondi di calma** dopo una fuga: sono i numeri che decidono se una
  stanza fa paura o fa arrabbiare;
- **quante stanze per piano** — si comincia da quattro e si arriva a sedici,
  ma se un piano non si finisce mai la scala smette di essere un traguardo;
- **il suono**, che qui dentro c'è appena.
