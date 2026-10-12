# Come nasce un piano

Stanze di forme diverse, sale grandi con le colonne, mostri a branchi e
appostati, l'anticamera coi caporali davanti al mostro grosso. Richiesta
dell'utente, 12 ottobre 2026: «se ogni stanza è minuscola non c'è molto da
esplorare: entri, vedi tutto e tanti saluti. Dovremmo avere più varietà…
forme differenti, zone più ampie dove possano nascondersi negli angoli e
farti degli agguati, zone dove c'è il boss e prima del boss ci sono dei
caporali; dobbiamo rendere il gioco più avventuroso e meno "entro nella zona,
uccido il mostro e fine"». Gli agguati veri arrivano con la luce a cono e lo
scontro a gruppi ([scontro.md](scontro.md)): questa pagina prepara i piani.

Il codice: `motore/livello.js` (il piano), `motore/forme.js` (le forme, pura:
gira in Node), `dati/mostri.js` (`CAPORALE`), `scena/tela.js` (pavimento,
galloni), `motore/corsa.js` (solo dove una stanza è un'area).

## Come nasce un piano

1. **Il BSP taglia, una foglia una stanza** (`scava`): il numero di stanze è
   quello di sempre (da quattro a sedici, [regole.md](regole.md)).
2. **Le sale** (`scegliLeSale`): una ogni quattro stanze, almeno una, nelle
   foglie dove ci sta (da 13×10 di foglia, mai l'ingresso); se non ci sta una
   sala vera la foglia più larga ne ospita una piccola. Quasi ogni piano ne ha
   una (95%).
3. **Le forme** (`stanzaIn`): le altre foglie tirano una forma; l'ingresso
   resta un rettangolo (chi arriva trova un posto semplice).
4. **I corridoi** collegano i centri delle stanze, come prima.
5. **Le colonne** (`piazzaLeColonne`), dopo i corridoi, che non le
   attraversano. 6. **Le porte** (`scavaPorte`) dove un corridoio tocca il
   bordo vero della stanza. 7. **Le vicinanze** (`segnaLeVicinanze`): la mappa
   che dice di che stanza è una cella.
8. **I ruoli** (ingresso, scala, anticamera, portale, fonte, tesoro), poi
   **i mostri** (`popolaIlPiano`), il guardiano, le gemme, le curiosità,
   l'arredo, le porte da chiudere: come prima, ma sulla stanza com'è fatta.

## Una stanza è la sua mappa di celle

- **Il riquadro `{x, y, w, h}` resta, ma non dice dove si è dentro.** Una
  stanza ha `pezzi` (rettangoli che, uniti, sono la sua forma), `suolo` (le
  sue celle, colonne escluse), `interno` (quelle con tutte e quattro le
  vicine nella stanza: lontane dai muri), `colonne`, `cx`/`cy` (una cella
  del suolo con la roccia lontana: da lì partono scale, forzieri e corridoi).
- **Per sapere se una cella è nella stanza si chiede al piano**:
  `dentro(s, x, y)`, `dentroStanza(r, s)`, `stanzaDi(x, y)` (la stanza di una
  cella o del suo bordo, l'uscio compreso: chi tocca la stanza di lato la
  vince), `cellaDellaStanza(s, rnd, lontano)`, `celleDellaLuce(s)` (suolo e
  giro di muro attorno, quello che si accende con la torcia). Mai `.x`/`.w`
  per confrontare: sulle L e sulle croci il riquadro è in parte roccia.
- **I mostri non escono dalla loro stanza** (`muoviMostri`): il passo viene
  fermato se la cella dopo non è `dentro`. Davanti a una colonna scivolano di
  lato invece di restare fermi.

## Le forme

Dal riquadro `bw × bh` a una maschera di celle (`forme.js`, `costruisci`):

| forma | com'è | riquadro |
|---|---|---|
| rettangolo | come sempre | 5–10 × 4–8 |
| elle | un rettangolo senza un angolo | 7–11 × 6–9 |
| tu | una sbarra e un gambo, girata da tutte le parti | 8–11 × 6–9 |
| croce | due bracci larghi tre | 9–12 × 8–10 |
| doppia | due rettangoli sovrapposti per due celle: una Z | 9–13 × 7–10 |
| caverna | bordi che vanno e vengono, mai sotto quattro di larghezza | 9–14 × 7–10 |
| sala | un rettangolo largo, con le colonne | 12–18 × 9–13 |

Nelle foglie normali pesano 38% rettangolo, 20 elle, 12 tu, 10 croce, 10
doppia, 10 caverna; la forma che non ci sta torna rettangolo. Ogni forma deve
essere in un pezzo solo (`connessa`).

## Le sale e le colonne

- **Una sala è grande da 70 celle** (`CELLE_SALA`, la stanza `grande`): qui
  stanno i branchi. Le colonne stanno nelle sale e, una o due, nelle
  caverne.
- **Una colonna è roccia sola o a coppia, mai attaccata al muro, mai a meno di
  due celle da un'altra e dal centro.** Si gira attorno e ci si nasconde dietro,
  ma non si chiude mai una strada: tutt'attorno c'è stanza.
- **Il muro alto una cella le disegna da solo** (`scena/muri.js`): una colonna
  da una cella è una faccia con i due spigoli, una coppia in verticale ha
  il suo tetto sopra la faccia. Guardato con uno scatto: sembrano pilastri.
- **Per ora non nascondono niente alla luce**: la luce di oggi è un cerchio e
  non conosce gli ostacoli. Nascondono quando arriva il cono.

## I mostri: branchi, appostati, caporali

- **Il numero di mostri non cresce**: tre quarti di mostro per stanza, meno il
  10% (`MOSTRI_PER_STANZA`), meno due mostri per ogni caporale; cambia come stanno. L'utente:
  «lo stesso numero di mostri in gruppi più grossi è proprio quello che lo
  scontro a gruppi rende interessante».
- **Un branco sta in una stanza, tutto entro due celle da un'ancora** (fra
  due mostri al più quattro celle: lo scontro prende chi sta a 4,5 celle, il
  branco ci sta sempre dentro) e della coppia della discesa (`tipiPer`,
  [mostri.md](mostri.md)). Nelle sale (il 70% dei mostri) da due a cinque; in alcune discese i branchi sono più piccoli
  (`tettoBranco` della discesa: la scalinata al più tre, la miniera due), o un incontro
  sarebbe troppo. Le stanze piccole ne hanno uno o due, e molte
  nessuno: il piano è meno popolato e più incontrare uno è un fatto.
- **Gli appostati** (`mettiUnAppostato`): un mostro solo, in un angolo (roccia
  da due lati) o dietro una colonna, dalla parte lontana dalle porte, a
  quattro celle da ogni altro mostro. `m.appostato` dice 'angolo' o
  'colonna'. Sono loro che faranno gli agguati con la luce a cono.
- **La stanza del tesoro ha un'unica guardia**, della specie più dura della coppia; quella della scala
  nei piani col grosso non ha mostri di strada (il grosso è già un branco).
- **L'anticamera** (`anticameraDi`): nel piano col mostro grosso la stanza
  *subito prima* sulla strada più corta dall'ingresso alla scala (mai
  l'ingresso: se la strada va dritta si prende la vicina più lontana). È una
  stanza di strada: si sceglie prima del premio, che la prenderebbe.
- **I caporali** (`mettiICaporali`): **due, tre se l'anticamera è una sala in
  un piano da otto stanze in su**, nel mezzo della stanza, vicini fra loro. La
  specie è una delle due della coppia della discesa, con le ossa ×1,25 e un
  colpo in più (`CAPORALE`); il nome diventa «<mostro> caporale»
  (`m.caporale`). Si vedono dai **galloni**: due V d'oro sopra la testa e un
  anello d'oro ai piedi, disegnati in codice (`Tela.galloni`). Niente emoji:
  il sotterraneo è un gioco serio.
- **Nell'abisso non ci sono caporali** (`caporali: false` da `faiIlPiano`): un
  eroe nudo che scende all'abisso già si ferma al grosso del quinto piano, e
  coi caporali tre semi su otto si fermavano lì contro uno (e il piano costava
  oltre i 30 del tetto per piano di `unita/sotterraneo-abisso`).
- **Il guardiano della chiave è un caporale** (`faiCaporale`): la specie più dura della coppia, con i galloni, accanto alla
  scala; nei piani col grosso c'è il grosso.
- **Mai più di cinque in un branco, più l'appostato**: lo scontro nuovo ne
  prende al più sei, e il grosso vale due posti.

## Il costo in domande

Il giocatore finto combatte i gruppi veri e usa le abilità ([scontro-bilancio.md](scontro-bilancio.md)). Il tetto di 85 risposte
obbligate a seduta regge, per tutti e quattro gli eroi.

| discesa | minimo, con le sale (12/10, mattina) → dopo la taratura | tutto il piano, prima → dopo |
|---|---|---|
| La cripta dell'altare | 12 → 9 | 22 → 16 |
| La scalinata antica | 13 → 6 | 57 → 50 |
| La torre in rovina | 29 → 21 | 74 → 55 |
| La grotta della scaletta | 46 → 31 | 78 → 40 |
| La scala sommersa | 39 → 26 | 91 → 65 |
| La botola segreta | 37 → 24 | 158 → 98 |
| La miniera abbandonata | 65 → 25 | 156 → 98 |

(cavaliere, seme del banco). Il minimo cala perché le abilità chiudono un mostro in meno risposte; «tutto» cala di meno e la grotta
resta con una forbice stretta. Mostri per stanza: 0,79 (come prima).

- **Provato**: lo stesso numero di mostri *per stanza* nelle sale
  (due-cinque più l'appostato, tutto sopra il vecchio numero): il minimo della
  botola saliva da 62 a 92 (media su otto semi 91) e la scala sommersa da 45 a 57. Il numero va tenuto sul
  *piano*, e va tolto dai caporali.
- **Provato**: caporali con le ossa ×1,5: la grotta e la scalinata si vincevano
  9 volte su 12 a otto su dieci, dove prima 12 su 12. A ×1,25 e un colpo in più
  29 volte su 30 e più.
- **Misure d'equilibrio** (`npm run test:misure`, «la tabella della grande
  storia»): le zone dopo la storia non stanno più dentro la banda di `6/10 si
  vince ma non sempre` (cantine 28–38%, cisterna 25–30%, altare 95–100%): è il
  giocatore finto uno contro uno, da rimisurare dopo lo scontro nuovo.

## Nei test

`unita/sotterraneo-piani` (le forme si costruiscono e sono in un pezzo solo;
`dentro`/`stanzaDi`/porte/centro di ogni stanza di 308 piani; sale con le
colonne isolate che non chiudono strade; branchi entro 4,5 celle, appostati
davvero in un angolo o dietro una colonna; anticamera con due o tre caporali
più duri e senza altri mostri; dal seme sempre uguale; un mostro non esce
dalla sua stanza; la luce copre il suolo). `unita/sotterraneo` (§ 5a bis: la
posa degli orpelli guarda la roccia accanto, non il riquadro) e
`unita/sotterraneo-abisso` (nessuna anticamera nell'abisso, il costo per piano).
Per guardare un piano senza giocarlo: `#seme=812&piano=2&stanza=anticamera`
(o `sala`, `elle`, `tu`, `croce`, `caverna`; [../core/comandi.md](../core/comandi.md)).
