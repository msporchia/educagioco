# Le persone del mondo di sopra in 3D

Nel sotterraneo ([grafica-3d.md](grafica-3d.md)) l'eroe e i mostri sono modelli ([mostri-3d.md](mostri-3d.md)); dal 22 ottobre
anche chi sta sul mondo di sopra: i quattro mercanti, i personaggi delle missioni, il capitano, il minatore, i viandanti da
cercare e le sentinelle delle discese rosse. Le bancarelle e le botteghe restano quelle di prima.

## I quattordici modelli

`poc/persone-3d/persone.js` (la pagina `poc/persone-3d.html`), copiato in `scena3d/persone3d/` da `npm run promuovi3d`: le copie
non si toccano a mano. Ognuno si riconosce dalla sagoma e dai colori, e non somiglia a un eroe giocabile:

| modello | chi | com'è | il suo gesto |
|---|---|---|---|
| armaiolo | il fabbro | calvo, barba nera, braccia nude, grembiule di cuoio, martello | batte tre colpi |
| incantatrice | l'incantatrice | veste verde mare, scialle magenta con le monetine, la sfera arcana | la sfera sale e si accende |
| erborista | la guaritrice | cappuccio ruggine, occhiali, cesto d'erbe, boccette | coglie un ciuffo e lo annusa |
| rigattiere | il mercante | zaino enorme con coperta e pentole, cappellaccio con la piuma, sacco | saltella, le pentole ballano |
| minatore | il vecchio minatore | elmo giallo con la lampada, fuliggine, piccone a terra | si asciuga la fronte |
| capitano | il capitano | niente elmo, baffoni grigi, corazza scura, mantello blu, spada nel fodero | si liscia i baffi |
| ragazza | la ragazza del pozzo, la lavandaia | piccola, vestito azzurro, treccia col fiocco | due saltelli |
| eremita | il frate, il cantastorie | curvo, cappuccio, barba lunga, bastone nodoso | si liscia la barba |
| guardia | la guardia della torre, le sentinelle | cappello di ferro, sopravveste gialla e blu, lancia, scudo tondo | batte la lancia |
| boscaiolo | il boscaiolo, il pastore | camicia a quadri, berretto col pompon, barbone, ascia in spalla | solleva l'ascia |
| pescatore | i due pescatori | cappello di paglia, pipa, canna col filo e il galleggiante | tira la lenza |
| mugnaio | il mugnaio, il raccoglitore | basco, baffi, grembiule infarinato, sacco in spalla | sbuffo di farina |
| cacciatrice | (nessuno ancora) | pelle di lupo sul capo col muso e le orecchie, treccia rossa, giubba verde con le frange, arco corto, faretra | la mano sopra gli occhi, scruta lontano |
| carovaniere | (nessuno ancora) | turbante ocra col lembo, barba nera, spolverino rosso mattone, fascia gialla con la frusta, bastone col lume | apre la carta delle strade e la legge |

La cacciatrice e il carovaniere sono le persone nuove delle città del progetto ([mondo-aperto-quest.md](mondo-aperto-quest.md#chi-le-dà)):
il modello c'è, nel mondo ancora no.

Un corpo solo coi parametri (corporatura, testa, braccia col gomito e la mano), la faccia su una trama canvas come gli eroi
(che ammicca, e apre la bocca salutando), sotto i 2500 triangoli.

## Il contratto

`creaPersona(chiave)` → Group coi piedi a y = 0 e il davanti verso +z; `CHIAVI`. In `userData`:
- `anima(t)`: l'idle in funzione del tempo (respiro, sguardo intorno, ammiccare, mantelli e trecce che seguono, un gesto ogni 6–9 s);
- `saluta(t)`: il saluto parte all'istante `t` (la mano alzata per circa 2,4 s; capitano e guardia la tengono ferma) e `anima` lo
  finisce da sé;
- `altezza`: la cima della testa o del cappello **senza gli arnesi** (lancia, canna, piccone, ascia, zaino). Si normalizza su questa,
  non sul Box3 intero: con il Box3 la guardia e il rigattiere uscirebbero piccoli.

**La pelle.** A figura costruita i pezzi fermi di tutta la persona, per tipo di materiale, diventano una `SkinnedMesh` sola coi
colori nei vertici: lo scheletro sono i perni stessi, ogni vertice pesa 1 sul suo. Da 13–27 mesh a 2–5 (la faccia con la sua trama,
le luci e le stoffe a righe e a quadri restano a sé). Provato prima per perno (come gli eroi): il villaggio passava da 135 a 243
chiamate. Un pezzo nella pelle non si spegne con `visible`: si scala a zero (il ciuffo dell'erborista).

## In scena (`scena3d/persona3d.js`, `mondo/persone.js`)

- **Chi**: il modello è il nome dello sprite (`<sprite>-fermo-0`), il capitano ha il suo (`modelloDellaPersona` in `Mondo3d.vue`);
  le sentinelle sono la guardia. Le liste senza three per le viste: `dati/persone3d.js` (`MODELLI_PERSONE`).
- **Quanti**: le persone più vicine all'eroe, entro 18 celle, al più 8 (`PERSONE_3D_SOPRA`); le altre restano sprite. Una
  riserva per modello, riusata come quella dei mostri.
- **Quanto grandi**: alte quanto lo sprite che sostituiscono × 0,72 (lo stesso rapporto dell'eroe e dei mostri), misurate su
  `altezza`. La ragazza resta più bassa quanto lo è il suo sprite.
- **Dove guardano**: verso la telecamera; con l'eroe a meno di 6 celle si girano verso di lui, col tempo.
- **Il saluto**: quando `Mondo3d.vue` accende il saluto (l'eroe entra nel raggio di 6 celle, `RAGGIO_SALUTO`) parte `saluta(t)`.
- **Il dito** non cambia: il rettangolo di una persona viene dal bersaglio (`rettangoloPersona`, `alto` 2,2), non dal disegno;
  `data-vis`, `data-saluta` e gli altri bersagli dei test restano quelli di prima.
- **Il gioco non si rompe**: un modello che manca, non si costruisce o si rompe animando torna allo sprite (`console.warn`).
  `#persone2d` nell'indirizzo li spegne tutti.

## I ritratti

Il servizio delle anteprime ([anteprime-3d.md](anteprime-3d.md)) ha la chiave `persona:<modello>`: la faccia e le spalle, appena
girata, 96 px. La usano `Ritratto.vue` (il dialogo, il diario; e la bottega, che ora usa lo stesso ritratto) e l'icona di chi si è
perso nelle taglie «trova chi» del diario. Finché l'immagine non è pronta resta lo sprite.

## Quanto costa

Misurato con SwiftShader (390×844, `&dpr=1`, dal villaggio, sette persone in vista): 135 chiamate con gli sprite (`#persone2d`), 164
coi modelli (243 prima della pelle). Le soglie di `integrazione/sotterraneo-mondo` e `-mondo-meta` sono passate da 150 a 200.

## Cosa manca

- La camicia a quadri del boscaiolo e la maglia a righe del pescatore sono trame: cinque mesh in più ciascuno.
- Non camminano: chi si sposta (nessuno, per ora) scorrerebbe col suo idle.
- Non misurato sul telefono vero.

Nei test: `unita/sotterraneo-persone-3d` (chi sta sopra ha il modello, la lista delle viste è quella dei modelli, ogni modello si
costruisce, sta nel tetto, ha i piedi a terra, si anima, saluta e ha poche mesh), `unita/sotterraneo-mostri-3d` (le copie uguali ai
prototipi), `unita/catalogo-3d-sotterraneo` (le quattordici voci `sot:persona:*`), `integrazione/sotterraneo-mondo` (le persone del
villaggio coi modelli, le chiamate, il ritratto 3D del dialogo e della bottega).
