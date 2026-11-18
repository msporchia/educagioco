# Passo passo a scuola

A scuola il bambino gioca a Passo passo vero (`Gioco.vue`), limitato ai livelli che la maestra ha scelto. Il gioco non
si storpia: si limita da fuori. Chi lo monta è la vista della scuola (`src/scuola/giochi/passo-passo/`, il contratto è
[../scuola/giochi.md](../scuola/giochi.md)); il primo gioco portato così sono gli Asteroidi
([../asteroidi/scuola.md](../asteroidi/scuola.md)).

## Cosa sceglie la maestra

```js
{ tipo: 'passo', protagonista: 'coniglio', gradini: ['ghiaccio', 'buche'] }
//   protagonista: 'coniglio' | 'cane' | 'guerriero'
//   gradini: le chiavi di SCALINI (dati/campagna.js) che stanno sulla strada di quel protagonista, almeno una
```

- **I gradini, non i livelli**: sono le chiavi stabili di `SCALINI`, non gli indici della campagna, che `FILE` sposta
  ([livelli.md](livelli.md#quando-la-fila-cambia)). Un livello aggiunto a un gradino entra da solo nelle lezioni.
- **Il protagonista sceglie la strada**: il coniglio ha i primi passi, il salto, il ghiaccio, le buche, i massi e le
  quattro carte; il cane le pecore e le quattro carte; il guerriero le sue sei isole. Il ripeti col cane sono le sei
  tappe del cane, non quelle del coniglio. Di partenza il coniglio coi primi passi.
- **La scheda è pura e senza import** (`scheda.js`): la pagina della maestra non si tira dietro la campagna. Per
  questo tiene a mano i gradini di ogni protagonista, coi nomi per una maestra («Ripeti fino a», «Le frecce»), l'icona
  del gioco e quanti livelli hanno; il test dice se non sono più quelli delle strade.
- **`valido`** rifiuta chiavi in più, un protagonista che non c'è, gradini vuoti, doppi o di un altro protagonista.
  **`descrivi`**: «Passo passo · il ghiaccio e le buche · col coniglio», e «tutti i livelli» se sono tutti.
- L'editor (`Parametri.vue`) ha due file di tessere: chi gioca e quali gradini, ognuno col numero dei suoi livelli;
  cambiando protagonista restano i gradini che ha anche lui (le carte), se no il suo primo. Almeno uno resta acceso.

## Il gioco col limite

`<PassoPasso :limite="{ gradini, protagonista }">`. **A casa manca** (`null` di difetto), e `tappeDelLimite`
(`motore/limite.js`, puro) torna `null`: niente di quello che segue esiste.

- **Il giro**: i livelli dei gradini scelti, nell'ordine della strada del protagonista (dal più facile). Si parte dal
  primo senza mappa; il ▶ del cartello porta al livello dopo del giro, e finito l'ultimo **si ricomincia** dal primo.
  Il titolo dice «2/9 · Il sasso che frena».
- Scelto il giro e non il sentiero senza fine: i livelli della campagna sono pensati uno per uno (la regola del gradino
  serve, il racconto dice l'«aha»), sono gli stessi per tutta la classe e la maestra li conosce; il sentiero è fatto a
  caso e misura la serie, che a scuola non conta.
- **Il cartello** è quello di sempre, con le stelle (dicono la carota e la strada corta), senza monete e senza 🗺️
  (`mappa: false` di `Finale.vue`); 🔁 rigioca lo stesso livello.

| Resta (è il gioco) | Si spegne con `limite` |
|---|---|
| la fila, le carte, lo zaino, ▶ e ■ | la mappa (`viste/Mappa.vue` a scuola è un `Vuoto.vue`: porta via i fondali dipinti) |
| il cartello con le stelle, rigioca | le monete, `completa`, i contatori dell'albo (`segna`), `ricorda('ultima')` |
| la guida del primo giro (la manina del prato e del 🔁) | la sosta: `salvaOra` e `salvaPresto` non scrivono niente |
| i 💡 gratis | i 💡 a monete |

- **La guida del primo giro** guarda i livelli vinti in questa partita (`vinteNelGiro`) al posto delle stelle, che a
  scuola non si scrivono: la manina del prato c'è finché non si vince un livello, quella del 🔁 finché non se ne vince
  uno col ripeti.
- La barra e la pausa da cui non si esce, il suono spento, il profilo in memoria li mette la scuola
  ([../scuola/architettura.md](../scuola/architettura.md)).

## Il 💡 a scuola

A casa la scala si paga ([stelle-e-aiuti.md](stelle-e-aiuti.md)), e a scuola il profilo parte da zero monete. **A scuola
ci sono solo i due gradini gratis che fanno ragionare** (`scalaAScuola`, quelli `ragiona` di
[../core/aiuti.md](../core/aiuti.md)): cosa chiede il posto, poi dove la fila comincia a sbagliare. Finiti, ogni tocco
ridice **dove** per la fila di adesso. La freccia giusta, i pezzi di strada e la soluzione non ci sono: niente prezzo
sul tasto, e la stella 🧠 resta sempre accesa.

## L'evento `risposta`

Ogni ▶ arrivato in fondo è una risposta, emessa quando il giro finisce (quello che il bambino vede):

```js
{ chiave: 'passo:laghetto', giusta: true, ultima: true, ms: 41200,
  fatto: 'Il laghetto ghiacciato', data: 'a casa con la carota · 2 frecce', attesa: '2 frecce: →↓' }
```

- **Vinto**: `giusta: true, ultima: true`: il livello è una domanda chiusa, e le soglie dei blocchi contano i livelli
  vinti. **Non arrivato** (sbatte, splash, colpito, si ferma prima): `giusta: false, ultima: false`, un tentativo con la
  domanda ancora aperta. Fermato con ■ non è una risposta: il giro non è finito.
- `ms`: da quando si è cominciato a scrivere quella fila (l'ingresso nel livello, o la fine del ▶ di prima) al ▶.
- `data` (`dataDi`): «a casa con la carota · 5 frecce», «sbatte alla 3ª freccia», «in acqua alla 2ª freccia»,
  «colpito alla 4ª carta», «pecora incastrata…», «gira a vuoto…», «si ferma prima · 4 frecce». Le carte si contano come
  nello zaino.
- `attesa` (`attesaDi`): la strada più corta con la carota (senza zaino, dal risolutore, misurata una volta per
  livello), o la più corta delle soluzioni scritte: «7 frecce: ↓⇒⇓↓←↓⇒» (il fosso), «5 carte: 🔁3(🚩rosso(→)↓↓)»
  (i gradini storti). Il salto è la freccia doppia
  (⇒), un ciclo `🔁N(…)`, fino a `🚩rosso(…)` o `🔁🏠(…)`, il se `❓rosso(…)` o `❓→(…)`, l'attacco ⚔️. Sopra i 40 caratteri
  si taglia coi puntini, senza spezzare un'emoji: succede alle soluzioni lunghe dello zaino.
- Uscire (il blocco che cambia) mentre il coniglio entra in tana manda lo stesso la vittoria (`vintaAMeta`).

Nei test: `unita/passo-passo-scuola` (senza limite nessun giro; la scheda uguale alle strade, coi livelli e le icone;
`valido` contro una ventina di forme storte; `descrivi`; il giro del ghiaccio e delle buche in ordine e da capo, il
ripeti del cane solo col cane; la scala gratis; per ogni livello chiave, nome, attesa e data nei 40, e la soluzione
detta vince). Bersagli: la vista `[data-gioco="passo-passo"]`; nell'editor `[data-protagonista]` e `[data-gradino]`;
il cartello senza `[data-azione="mappa"]`.
