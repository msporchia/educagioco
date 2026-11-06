# L'interfaccia unica per personalizzare

Un componente solo per vestire un personaggio, un animale o un oggetto in
qualunque gioco: `src/components/personalizza/Personalizza.vue`, con la
logica in `personalizza-pura.js` (senza Vue) e i temi in `personalizza.css`.
Nasce dal mock approvato dall'utente (`poc/personalizza/`, README e
`mock.html`): il componente lo segue alla lettera, e una differenza col mock
è un guasto. Prima c'erano tre interfacce diverse per la stessa cosa (il
guardaroba della fattoria, l'editor degli eroi, gli addobbi): «ogni volta
faccio diverso» è il difetto che questo componente chiude.

## Le zone

Dall'alto, sempre in quest'ordine, con altezze ferme:

| Zona | Cosa |
|---|---|
| testa | il titolo, il saldo, la ✕ (sempre in alto a destra) |
| anteprima | la figura (slot `anteprima`), che si gira a scatti di 45° con le frecce e trascinando il dito (la pagina non scorre); dentro, chi si è e otto pallini per il lato |
| schede | i gruppi (al più cinque: stanno in una riga), scritti senza icone |
| griglia | gli oggetti del gruppo, con la foto; **l'unica zona che scorre** |
| pannello | l'oggetto scelto: il nome, le sue **forme**, i **colori** della forma scelta; nella scheda Set il tasto «Salva questo set» |
| fondo | il prezzo e «Acquista e indossa», o una riga di aiuto |

## Il contratto: un'interazione modifica solo le zone sotto

La gerarchia va in un verso solo: **scheda → oggetto → forma → colore →
prezzo**. Una scelta cambia solo le zone che ne dipendono, sotto di lei; mai
quelle sopra, né il loro posto, né l'altezza, né il numero o l'ordine dei loro
elementi. Le zone sopra possono cambiare **aspetto** (il gettone scelto
evidenziato, la sua foto col colore nuovo). L'anteprima mostra il risultato e
non decide niente.

- **Le dipendenze le dichiarano i dati**, mai l'ordine dei tocchi: le forme
  sono dell'oggetto (`forme`), i colori della forma (`forme[i].colori`, se no
  quelli dell'oggetto), il prezzo è oggetto + forma + colore. Lo stesso stato
  finale si ottiene in qualunque ordine si tocchino zone indipendenti.
- **Quando una scelta sopra rende impossibile quella sotto**, il sotto torna
  a un valore dichiarato: un oggetto toccato parte dalla prima forma e dal
  primo colore (o com'è addosso, se è lui); un'altra forma tiene il colore se
  ce l'ha, se no il primo dei suoi.
- **Il pannello è alto uguale per tutta la scheda**: tante righe quante ne
  servono alla voce più ricca. Una voce con una forma sola non ha la riga
  delle forme, «Nessuno» (`niente`) non ha né forme né colori: le righe
  restano vuote, della stessa altezza. Cambiare scheda può cambiare l'altezza,
  perché cambia tutto quello che sta sotto.
- **I set salvati hanno sei posti fissi**: salvare riempie un posto, togliere
  lo svuota, e la griglia non cambia numero né ordine.
- **Niente «Com'era» nel fondo**: tornerebbe indietro sulle scelte sopra di
  lui. Una prova si toglie toccando quello che si aveva, o chiudendo con la ✕.

Nei test: `unita/personalizza` (per tocchi a ogni livello, le zone sopra con
gli stessi elementi nello stesso ordine; i prezzi; i set) e, a schermo,
`integrazione/sotterraneo-personaggio` (le posizioni delle schede e dei
gettoni non si muovono di un pixel toccando il pannello, l'altezza del
pannello resta). Il mock ha lo stesso controllo: `fai.mjs --scatti --misura`.

## I prezzi

Le regole stanno in `costo()` e `costoSet()`; un gioco senza prezzi (gli eroi)
non dà `valuta` e ogni scelta si mette subito.

- L'oggetto si paga una volta (`prezzo`, finché non è `posseduto`); con lui
  vengono la forma e il colore di base, e chi lo compra lo prende nella forma
  e nel colore che sta provando.
- Un'altra forma ha il suo `prezzo` (finché non è `posseduta`); un altro
  colore dopo costa `prezzoColore` della voce, o il `prezzo` suo (un colore
  speciale, che si paga anche al primo acquisto).
- **Quando ogni colore si compra** (gli addobbi delle bestie: un altro colore si paga come l'addobbo, [../fattoria3d/addobbi.md](../fattoria3d/addobbi.md)):
  ogni colore ha il suo `prezzo` e il suo `posseduto`, la voce niente prezzo e `prezzoDa` per il gettone («da 🪙12»).
- `chiuso` (un testo breve, «Solo a Natale»): quello che non hai non si prende per un altro motivo; si prova, e il tasto lo dice. Quello che hai si mette sempre.
- `liv` più alto di `livello`: si vede, si prova addosso, ma il tasto dice
  «Dal livello N» ed è spento. Senza abbastanza saldo: «Ti mancano N».
- Un set del gioco costa il minimo fra il suo prezzo e la somma dei pezzi che
  mancano.
- Quello che è tuo si mette subito (`scegli`); quello che costa resta in
  prova (`prova`) finché non si preme «Acquista e indossa» (`acquista`).

## I set

- **I miei set**: sei posti per personaggio, salvati da chi gioca. Un tocco
  li indossa: quello che è tuo e del tuo livello subito e gratis; un pezzo che
  non si può mettere si salta, e il gettone lo dice («1 manca»).
- **«Salva questo set»** sta sempre nel pannello della scheda Set: salva nel
  posto toccato o nel primo libero, chiede il nome dentro il pannello (uno è
  già scritto, sedici lettere al massimo), e salva quello che si ha addosso ed
  è tuo (non la prova). Coi sei posti pieni bisogna toccarne uno, e il tasto
  diventa «Salva al posto di «…»». Toccato un set: «Cambia nome» e «Togli»
  (che chiede un secondo tocco).
- **Set del gioco** (`setGioco`): da comprare, o da rimettere se già tuoi.
- **Cosa tiene il gioco**: per ogni set `{ posto, nome, pezzi }` (o la sua
  forma di quei pezzi), nella campagna del gioco e per personaggio: niente
  campi nuovi nel profilo, niente set in comune fra giochi.

## L'API

```js
import Personalizza from '../../components/personalizza/Personalizza.vue'
```

**Props**

| Prop | Tipo | Cosa |
|---|---|---|
| `tema` | `'sotterraneo' \| 'fattoria' \| 'animali'` | solo i colori |
| `titolo` | string | in testa |
| `chi` | string | chi si è, dentro l'anteprima («Maga», «Bobi») |
| `valuta`, `saldo` | string, number | il simbolo (🪙, 💎) e quanto se ne ha; senza valuta niente prezzi |
| `livello` | number | i pezzi con `liv` più alto si provano ma non si prendono |
| `schede` | `[{ id, nome, tipo: 'oggetti' \| 'set' }]` | i gruppi |
| `voci` | `[{ id, scheda, posto, nome, foto?, prezzo?, prezzoDa?, liv?, chiuso?, posseduto?, prezzoColore?, tratto?, niente?, forme?, colori?, dati? }]` | gli oggetti; `forme: [{ id, nome, foto?, prezzo?, liv?, chiuso?, posseduta?, colori?, dati? }]`, `colori: [{ id, nome, css?, prezzo?, liv?, chiuso?, posseduto?, dati? }]` |
| `indossato` | `{ posto: { oggetto, forma, colore } }` | quello che si ha addosso |
| `setGioco` | `[{ id, nome, prezzo, liv?, foto?, pezzi }]` | i set da comprare |
| `mieiSet` | `[{ posto: 0..5, nome, pezzi }]` | i set salvati |
| `giro` | number 0..7 | `v-model:giro`, il lato dell'anteprima |
| `aiuto`, `avviso` | string | la riga del fondo senza prova; un avviso breve sopra la figura |

`tratto`: toccarlo apre il pannello e basta (la pelle, i capelli: si cambiano
nel pannello). `niente`: «Nessuno». `dati`: attributi per i test
(`{ 'data-pelle': 'ambra' }`). Un colore senza `css` ha la foto (slot `foto`).

**Slot**: `fondo`, al posto della riga di aiuto quando non c'è niente da pagare (i tasti
di un oggetto che non sono scelte: il mobile della casa ha ↻ e 📦); `anteprima` (`{ stato, giro }`: quello che si ha addosso con la
prova sopra) e `foto` (`{ zona: 'voce' | 'forma' | 'colore' | 'set', voce?,
forma?, colore?, valore?, set?, stato }`: lo stato con quel pezzo cambiato, da
disegnare). Senza foto né slot resta un riquadro grigio «foto 3D»: **mai
un'emoji** al posto di un oggetto o di un personaggio.

**Eventi**

| Evento | Carico | Quando |
|---|---|---|
| `scegli` | `{ posto, oggetto, forma, colore, da: 'oggetto' \| 'forma' \| 'colore' }` | una scelta gratis: il gioco la mette subito |
| `prova` | lo stesso | una scelta che costa: resta in prova nel componente |
| `acquista` | `{ pezzi: [{ posto, oggetto, forma, colore }], set, totale }` | «Acquista e indossa»: il gioco scala e mette |
| `indossa-set` | `{ posto \| gioco, pezzi, saltati }` | un set salvato, o uno del gioco già tuo |
| `salva-set` | `{ posto, nome, pezzi }` | |
| `rinomina-set` | `{ posto, nome }` | |
| `togli-set` | `posto` | |
| `update:giro` | 0..7 | frecce e dito |
| `chiudi` | — | la ✕ o il velo |

Il componente tiene da sé la scheda aperta, l'oggetto aperto per scheda e la
prova; il gioco tiene il resto e lo ridà nelle props.

**Nei test**: `[data-personalizza]`, `[data-chiudi]`,
`[data-prs="anteprima|gira-sx|gira-dx|giro|schede|griglia|pannello|forme|colori|titolo|fondo|paga|salva-set|nome|nome-ok|nome-no|rinomina|togli|saldo"]`
(`[data-prs="giro"]` ha `data-giro`), `[data-prs-scheda]`, `[data-prs-voce]`,
`[data-prs-forma]`, `[data-prs-colore]`, `[data-prs-set-mio]`,
`[data-prs-set-gioco]`.

## Come lo adotta un gioco

1. I dati: un elenco di voci col loro posto, le forme e i colori; il gioco
   sa cosa possiede chi gioca e lo scrive nei flag `posseduto`/`posseduta`.
2. Una funzione che va dal salvataggio a `indossato` e ritorno (per gli eroi:
   `giochi/sotterraneo/viste/personaggio-valori.js`).
3. Lo slot `anteprima` con la figura che sa girare a scatti di 45°, e lo slot
   `foto` (o gli url delle foto) per i gettoni.
4. I gestori: `scegli` e `acquista` scrivono nella campagna, i set nella
   campagna per personaggio.

Chi lo usa: l'editor degli eroi e il tintore del sotterraneo
([../sotterraneo/personaggio.md](../sotterraneo/personaggio.md), [../sotterraneo/tintore.md](../sotterraneo/tintore.md)), il guardaroba del
contadino, gli addobbi delle bestie e i mobili di casa della fattoria ([../fattoria3d/guardaroba.md](../fattoria3d/guardaroba.md),
[../fattoria3d/addobbi.md](../fattoria3d/addobbi.md), [../fattoria3d/casa.md](../fattoria3d/casa.md)). L'interfaccia di prima non c'è più.
