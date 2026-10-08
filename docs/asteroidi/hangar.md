# L'hangar

Dove si dipinge la nave coi pezzi regalati dalle navi madri
([boss.md](boss.md)). Si apre dal tasto «Hangar» in basso a sinistra sulla
rotta, quando il volo infinito è aperto.

## Dove sta cosa

| file | cosa tiene |
|---|---|
| `src/data/hangar.js` | le tinte, i disegni, gli stemmi, quelli di serie, chi regala cosa |
| `src/motore/asteroidi/hangar.js` | i pacchi (`vintaTappa`, `vintoVolo`, `pacchiDi`), le scelte (`scegli`), la nave in colori per la tela (`livrea`), un pezzo da solo (`aspettoDi`) |
| `src/grafica/livrea.js` | i disegni sulle ali, gli stemmi, il pacco |
| `src/grafica/pezzo-hangar.js` | un pezzo da solo e il pacco aperto |
| `src/components/HangarAsteroidi.vue` | il foglio dell'hangar |
| `src/components/PezzoHangar.vue`, `RegaloHangar.vue` | un pezzo su una tela piccola, e «hai ottenuto» |

## La nave

- **Cinque scelte**: il colore dello scafo, delle ali e delle fiamme dei
  motori, un disegno sulle ali col suo colore, uno stemma col suo colore.
  Scafo, ali e fiamme hanno anche «di serie», la nave di sempre.
- **Niente nomi**, né ai pezzi né alle navi: l'utente, «così possono
  immaginarsi quello che vogliono». Gli id stanno solo nel codice.
- **I pezzi non presi si vedono col «?»**: si sa che ci sono, non cosa sono.
- **La nave scelta è la stessa dappertutto**: in partita, sulla rotta (il
  razzo), nell'hangar. La tela riceve la `livrea`, cioè colori e forme già
  decisi, e non sa niente di pezzi o regali.
- **Il danno sta sopra la livrea**: il disegno e lo stemma si dipingono
  dentro l'ala com'è, anche strappata, quindi lo strappo resta leggibile e lo
  stemma se ne va col pezzo. Provato nel mockup: dipinte sopra l'ala intera,
  le fiamme coprivano lo strappo e la nave colpita sembrava intatta.

## I regali

- **Di serie**: quattro colori (bianco, azzurro, rosso, giallo). Disegni e
  stemmi si vincono tutti, e finché non se ne ha uno la sua linguetta non c'è.
- **Le tappe**: due pezzi fissi ciascuna, in fila (`FILA_REGALI`: colori,
  disegni e stemmi a turno, nell'ordine della fila). Il primo alla prima
  nave madre abbattuta, il secondo alla seconda, poi niente: **le tappe facili
  non si coltivano**. Sono esattamente due per tappa: un test lo controlla.
- **Il volo**: la stella e le sei tinte lucide, ognuna da un livello in su
  (la stella dal 3, l'oro dal 21). Una nave madre abbattuta più in alto di
  prima dà il pezzo più alto fra quelli che il suo livello può dare
  ([boss.md](boss.md)).
- **Non si comprano**: le monete sono della fattoria, e un premio che si
  compra smette di dire «sei arrivato fin qui».
- **I pezzi nuovi hanno un pallino** finché l'hangar non si apre; sul tasto
  della rotta c'è quanti sono.
- **Gli id sono chiavi di salvataggio** (`t:rosso`, `d:pois`, `s:stella`):
  non si rinominano. Tutto sta in `campagne.mate.hangar`
  (`presi`, `nuovi`, `vinte` per tappa, `voloMax`, `nave`).

Nei test: `unita/asteroidi-hangar`; il foglio `[data-hangar]`, il tasto
`[data-azione="hangar"]` con `[data-nuovi]`, le linguette
`[data-linguetta="scafo"|"ali"|"fiamma"|"disegno"|"stemma"]`, i pezzi
`[data-scelta="t:rosso"]` con `[data-preso="1"|"0"]`, il pallino
`[data-nuovo]`, la ✕ `[data-chiudi]`.
